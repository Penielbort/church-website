"""
vehicle_physics.py

A simplified vehicle dynamics + tyre sensor model.

This is NOT a certified/validated vehicle dynamics model. It is a
lightweight, physically-motivated approximation good enough for a
proof-of-concept security simulation:

  - Lateral load transfer during cornering (basic weight-transfer physics)
  - Longitudinal load transfer during acceleration/braking
  - Tyre temperature and pressure as simple functions of load + slip

References used for the shape of these relationships (see README):
  - Tire-Road Friction Coefficient Estimation (fusion of model/data methods)
  - Multi-sensor Fusion Road Friction Estimation (steering/lateral accel)

Wheel layout / naming convention:
    FL --- FR
    |       |
    RL --- RR
"""

import numpy as np

# ---- Vehicle constants (a generic mid-size sedan) ----
MASS_KG = 1500.0          # vehicle mass
TRACK_WIDTH_M = 1.6       # distance between left and right wheels
WHEELBASE_M = 2.7         # distance between front and rear axles
CG_HEIGHT_M = 0.50        # height of centre of gravity
GRAVITY = 9.81
BASE_LOAD_PER_TYRE_N = MASS_KG * GRAVITY / 4.0

# ---- Tyre sensor constants ----
BASE_TYRE_TEMP_C = 35.0
BASE_TYRE_PRESSURE_KPA = 220.0
TEMP_NOISE_STD = 0.15
PRESSURE_NOISE_STD = 0.5
LOAD_NOISE_STD_N = 15.0

# Weight-transfer coefficients (how much load shifts per unit of accel)
K_LAT = MASS_KG * CG_HEIGHT_M / (2.0 * TRACK_WIDTH_M)
K_LONG = MASS_KG * CG_HEIGHT_M / (2.0 * WHEELBASE_M)


def simulate_true_motion(duration_s=6.0, dt=0.1, speed_mps=20.0,
                          maneuver="straight", rng=None):
    """
    Generate the vehicle's TRUE (ground-truth) motion.

    maneuver: "straight" or "curve"
        "curve" injects a smooth lane-change-like yaw-rate pulse.

    Returns a dict of time-series arrays: t, speed, yaw_rate,
    heading, lat_accel, long_accel, x, y
    """
    if rng is None:
        rng = np.random.default_rng()

    n = int(duration_s / dt)
    t = np.arange(n) * dt

    speed = np.full(n, speed_mps) + rng.normal(0, 0.05, n)

    if maneuver == "straight":
        yaw_rate = rng.normal(0, 0.005, n)  # tiny sensor/steering noise
    elif maneuver == "curve":
        # smooth bell-shaped yaw-rate pulse -> a lane change / gentle turn
        centre = duration_s / 2.0
        width = duration_s / 6.0
        yaw_rate = 0.25 * np.exp(-0.5 * ((t - centre) / width) ** 2)
        yaw_rate += rng.normal(0, 0.005, n)
    elif maneuver == "brake":
        # genuine braking event: real deceleration pulse, no turning
        yaw_rate = rng.normal(0, 0.005, n)
        centre = duration_s / 2.0
        width = duration_s / 6.0
        decel_pulse = -4.0 * np.exp(-0.5 * ((t - centre) / width) ** 2)
        speed = speed[0] + np.cumsum(decel_pulse) * dt + rng.normal(0, 0.05, n)
        speed = np.clip(speed, 0, None)
    else:
        raise ValueError("maneuver must be 'straight', 'curve', or 'brake'")

    long_accel = np.gradient(speed, dt)
    heading = np.cumsum(yaw_rate) * dt
    lat_accel = speed * yaw_rate

    x = np.cumsum(speed * np.cos(heading)) * dt
    y = np.cumsum(speed * np.sin(heading)) * dt

    return {
        "t": t, "speed": speed, "yaw_rate": yaw_rate, "heading": heading,
        "lat_accel": lat_accel, "long_accel": long_accel, "x": x, "y": y,
    }


def compute_tyre_data(motion, rng=None):
    """
    Given TRUE motion, compute physically-correlated tyre sensor
    readings for all four wheels: vertical load, temperature, pressure.

    This is the data an attacker cannot directly rewrite by editing
    the V2X/BSM payload, because (per our threat model) the tyre
    sensors report over a channel that is architecturally separate
    from the compromised GNSS/IMU/V2X transceiver pipeline.
    """
    if rng is None:
        rng = np.random.default_rng()

    n = len(motion["t"])
    lat_a = motion["lat_accel"]
    long_a = motion["long_accel"]

    lat_shift = K_LAT * lat_a     # +ve -> load moves to one side
    long_shift = K_LONG * long_a  # +ve -> load moves rear<->front

    # Sign convention: positive yaw_rate = left turn -> load shifts to
    # the right-side (outer) wheels.
    load = {
        "FL": BASE_LOAD_PER_TYRE_N - lat_shift - long_shift,
        "FR": BASE_LOAD_PER_TYRE_N + lat_shift - long_shift,
        "RL": BASE_LOAD_PER_TYRE_N - lat_shift + long_shift,
        "RR": BASE_LOAD_PER_TYRE_N + lat_shift + long_shift,
    }

    tyre_data = {}
    for name, F in load.items():
        F_noisy = F + rng.normal(0, LOAD_NOISE_STD_N, n)
        load_ratio = F_noisy / BASE_LOAD_PER_TYRE_N

        temp = (BASE_TYRE_TEMP_C
                + 4.0 * np.abs(lat_a)
                + 2.0 * np.abs(long_a)
                + 3.0 * (load_ratio - 1.0)
                + rng.normal(0, TEMP_NOISE_STD, n))

        pressure = (BASE_TYRE_PRESSURE_KPA
                    + 0.8 * (temp - BASE_TYRE_TEMP_C)
                    + rng.normal(0, PRESSURE_NOISE_STD, n))

        tyre_data[name] = {"load_n": F_noisy, "temp_c": temp,
                            "pressure_kpa": pressure}

    return tyre_data


def estimate_lat_accel_from_tyres(tyre_data):
    """
    The core "tyre trust channel" reconstruction step: estimate lateral
    acceleration purely from the measured left-right load asymmetry,
    with NO knowledge of the claimed BSM fields.
    """
    left_load = tyre_data["FL"]["load_n"] + tyre_data["RL"]["load_n"]
    right_load = tyre_data["FR"]["load_n"] + tyre_data["RR"]["load_n"]
    # asymmetry = 2 * lat_shift (summed over front+rear) = 4 * K_LAT * a_lat
    asymmetry = (right_load - left_load)
    a_lat_est = asymmetry / (4.0 * K_LAT)
    return a_lat_est


def estimate_long_accel_from_tyres(tyre_data):
    """
    Estimate longitudinal acceleration from the measured front-rear
    load asymmetry, independent of any claimed BSM field.
    """
    front_load = tyre_data["FL"]["load_n"] + tyre_data["FR"]["load_n"]
    rear_load = tyre_data["RL"]["load_n"] + tyre_data["RR"]["load_n"]
    asymmetry = (rear_load - front_load)
    a_long_est = asymmetry / (4.0 * K_LONG)
    return a_long_est
