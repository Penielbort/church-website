"""
attack_injector.py

Builds BSM-style broadcast messages from TRUE motion, and implements
two kinds of falsification:

1. "naive" attack: attacker edits ONE field (heading) without updating
   the others (yaw_rate, lateral accel). This is the kind of attack
   VCADS-style field cross-validation is designed to catch.

2. "synchronized" attack (the interesting case): attacker fabricates a
   fully self-consistent fake manoeuvre -- yaw_rate, heading, and the
   implied lateral acceleration all agree with each other -- but the
   vehicle's REAL physical motion (and therefore its true tyre data)
   never changed. This is the attack that defeats field-only
   cross-validation (VCADS's own stated limitation), and the one your
   tyre-channel check is designed to catch.

Threat model / trust boundary (explicit, not assumed):
   We assume the attacker has compromised the vehicle's V2X
   transceiver / GNSS / IMU data path (a software/firmware-level
   compromise), and can therefore rewrite everything that flows
   through it into the outgoing BSM. We assume the tyre sensors
   report over a physically separate path (e.g. a dedicated,
   authenticated short-range link direct to the safety module) that
   is NOT part of the compromised pipeline, so the attacker cannot
   also rewrite the tyre channel in this scenario. This is a
   narrower, explicitly-stated threat model -- it does NOT claim to
   defend against an attacker with full physical/hardware access to
   every wheel sensor. See README "Limitations".
"""

import numpy as np


def build_bsm(motion):
    """Construct the (claimed) BSM fields directly from TRUE motion.
    In the no-attack case, claimed == true."""
    return {
        "speed": motion["speed"].copy(),
        "yaw_rate": motion["yaw_rate"].copy(),
        "heading": motion["heading"].copy(),
        "lat_accel": motion["lat_accel"].copy(),
        "long_accel": motion["long_accel"].copy(),
    }


def inject_naive_attack(bsm, dt, start_idx, end_idx, heading_bias_rad=0.3):
    """
    Edits ONLY the heading field, leaving yaw_rate/lat_accel untouched.
    This creates an internal inconsistency: reported heading no longer
    matches the integral of reported yaw_rate.
    """
    attacked = {k: v.copy() for k, v in bsm.items()}
    attacked["heading"][start_idx:end_idx] += heading_bias_rad
    return attacked


def inject_synchronized_attack(bsm, dt, start_idx, end_idx, fake_yaw_peak=0.25):
    """
    Fabricates a fully self-consistent fake manoeuvre over
    [start_idx:end_idx]: a smooth yaw-rate pulse, its integrated
    heading, and the implied lateral acceleration (speed * yaw_rate)
    -- all mutually consistent, exactly like VCADS's Field
    Cross-Validation expects a genuine manoeuvre to look.
    """
    attacked = {k: v.copy() for k, v in bsm.items()}
    n = end_idx - start_idx
    t_local = np.arange(n) * dt
    centre = t_local[-1] / 2.0
    width = max(t_local[-1] / 6.0, 1e-3)

    fake_yaw = fake_yaw_peak * np.exp(-0.5 * ((t_local - centre) / width) ** 2)
    fake_heading_delta = np.cumsum(fake_yaw) * dt

    attacked["yaw_rate"][start_idx:end_idx] = fake_yaw
    attacked["heading"][start_idx:end_idx] = (
        bsm["heading"][start_idx] + fake_heading_delta
    )
    attacked["lat_accel"][start_idx:end_idx] = (
        attacked["speed"][start_idx:end_idx] * fake_yaw
    )
    return attacked


def inject_synchronized_attack_longitudinal(bsm, dt, start_idx, end_idx,
                                             fake_decel_peak=-4.0):
    """
    Fabricates a fully self-consistent fake hard-braking event: a
    smooth deceleration pulse in long_accel, AND a matching drop in
    the reported speed field, so a baseline check that cross-validates
    speed against long_accel (finite-difference consistency) will not
    fire. True motion is unchanged (vehicle keeps its real speed).
    """
    attacked = {k: v.copy() for k, v in bsm.items()}
    n = end_idx - start_idx
    t_local = np.arange(n) * dt
    centre = t_local[-1] / 2.0
    width = max(t_local[-1] / 6.0, 1e-3)

    fake_long_accel = fake_decel_peak * np.exp(-0.5 * ((t_local - centre) / width) ** 2)
    fake_speed_delta = np.cumsum(fake_long_accel) * dt

    attacked["long_accel"][start_idx:end_idx] = fake_long_accel
    attacked["speed"][start_idx:end_idx] = np.clip(
        bsm["speed"][start_idx] + fake_speed_delta, 0, None
    )
    return attacked
