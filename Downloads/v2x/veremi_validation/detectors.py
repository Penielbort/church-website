"""
detectors.py

Two detectors, each exposed as a raw MISMATCH SCORE function plus a
thresholded flagging function. Raw scores are needed so thresholds
can be calibrated from benign-only data (see evaluate.py) rather
than hand-picked.

1. Baseline: a simplified re-implementation of VCADS's core idea
   (Andrade Salazar et al., 2022) -- derive a field from OTHER
   reported fields and flag a mismatch:
     - lateral accel field vs. speed * yaw_rate
     - heading field vs. integral of yaw_rate
     - long accel field vs. finite-difference of reported speed
   If an attacker synchronizes all reported fields together, every
   one of these checks stays small -- reproducing VCADS's own stated
   blind spot.

2. Tyre-channel (this paper's contribution): compare BSM-claimed
   lateral/longitudinal acceleration against the value estimated
   independently from tyre load asymmetry.
"""

import numpy as np


# ---------- raw mismatch scores ----------

def baseline_lat_mismatch(bsm):
    derived_lat = bsm["speed"] * bsm["yaw_rate"]
    return np.abs(bsm["lat_accel"] - derived_lat)


def baseline_heading_mismatch(bsm, dt):
    derived_heading = np.concatenate(
        [[bsm["heading"][0]], bsm["heading"][0] + np.cumsum(bsm["yaw_rate"])[:-1] * dt]
    )
    return np.abs(bsm["heading"] - derived_heading)


def baseline_long_mismatch(bsm, dt):
    """
    Derive longitudinal acceleration from consecutive reported speed
    samples using a backward first-difference -- the same discrete
    relationship a forward-integrating attacker (or VCADS's own
    kinematic check) uses, so a genuinely self-consistent fabrication
    is not flagged merely due to a numerical-scheme mismatch between
    attack construction and detector formula.
    """
    speed = bsm["speed"]
    derived_long = np.empty_like(speed)
    derived_long[1:] = (speed[1:] - speed[:-1]) / dt
    derived_long[0] = derived_long[1]
    return np.abs(bsm["long_accel"] - derived_long)


def tyre_lat_mismatch(bsm, tyre_lat_accel_est):
    claimed_lat = bsm["speed"] * bsm["yaw_rate"]
    return np.abs(claimed_lat - tyre_lat_accel_est)


def tyre_long_mismatch(bsm, tyre_long_accel_est):
    return np.abs(bsm["long_accel"] - tyre_long_accel_est)


# ---------- thresholded flagging ----------

def baseline_flags_lateral(bsm, dt, thr_lat, thr_heading):
    """Baseline check relevant to the lateral/cornering experiment."""
    flags = baseline_lat_mismatch(bsm) > thr_lat
    flags |= baseline_heading_mismatch(bsm, dt) > thr_heading
    return flags


def baseline_flags_longitudinal(bsm, dt, thr_long):
    """Baseline check relevant to the longitudinal/braking experiment."""
    return baseline_long_mismatch(bsm, dt) > thr_long


def tyre_flags_lateral(bsm, tyre_lat_accel_est, thr):
    return tyre_lat_mismatch(bsm, tyre_lat_accel_est) > thr


def tyre_flags_longitudinal(bsm, tyre_long_accel_est, thr):
    return tyre_long_mismatch(bsm, tyre_long_accel_est) > thr
