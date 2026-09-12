"""
evaluate.py

Runs two independent experiments (lateral/cornering and
longitudinal/braking), each with:

  1. THRESHOLD CALIBRATION: run 400 benign-only trials (straight +
     the relevant real manoeuvre) and set each detector's threshold
     at the 99th percentile of its mismatch score on that benign
     data. Thresholds are never tuned against attack data.

  2. EVALUATION: run 200 trials of each of 4 scenario types (two
     benign, one naive attack, one synchronized attack) using the
     calibrated thresholds, and report detection / false-positive
     rates.
"""

import numpy as np

from vehicle_physics import (simulate_true_motion, compute_tyre_data,
                              estimate_lat_accel_from_tyres,
                              estimate_long_accel_from_tyres)
from attack_injector import (build_bsm, inject_naive_attack,
                              inject_synchronized_attack,
                              inject_synchronized_attack_longitudinal)
from detectors import (baseline_lat_mismatch, baseline_heading_mismatch,
                        baseline_long_mismatch, tyre_lat_mismatch,
                        tyre_long_mismatch, baseline_flags_lateral,
                        baseline_flags_longitudinal, tyre_flags_lateral,
                        tyre_flags_longitudinal)

DT = 0.1
DURATION_S = 6.0
N_CALIBRATION_TRIALS = 400
N_EVAL_TRIALS = 200
PERCENTILE = 99


# ---------------- shared helpers ----------------

def _generate_tyre_estimates(motion, rng):
    tyre_data = compute_tyre_data(motion, rng=rng)
    return (estimate_lat_accel_from_tyres(tyre_data),
            estimate_long_accel_from_tyres(tyre_data))


# ---------------- LATERAL (cornering) experiment ----------------

def calibrate_lateral_thresholds(seed_offset=0):
    lat_scores, heading_scores, tyre_scores = [], [], []
    for i in range(N_CALIBRATION_TRIALS):
        rng = np.random.default_rng(seed_offset + i)
        maneuver = "straight" if i % 2 == 0 else "curve"
        motion = simulate_true_motion(DURATION_S, DT, maneuver=maneuver, rng=rng)
        bsm = build_bsm(motion)
        tyre_lat_est, _ = _generate_tyre_estimates(motion, rng)

        # per-trial MAX mismatch (not raw pooled points) so the
        # resulting threshold controls the trial-level false-positive
        # rate at ~ (100 - PERCENTILE)%, rather than the per-timestep
        # rate (which would guarantee a hit almost every trial once
        # there are dozens of timesteps per trial).
        lat_scores.append(baseline_lat_mismatch(bsm).max())
        heading_scores.append(baseline_heading_mismatch(bsm, DT).max())
        tyre_scores.append(tyre_lat_mismatch(bsm, tyre_lat_est).max())

    thr_lat = np.percentile(lat_scores, PERCENTILE)
    thr_heading = np.percentile(heading_scores, PERCENTILE)
    thr_tyre = np.percentile(tyre_scores, PERCENTILE)
    return thr_lat, thr_heading, thr_tyre


def run_lateral_trial(scenario, seed, thresholds):
    thr_lat, thr_heading, thr_tyre = thresholds
    rng = np.random.default_rng(seed)

    if scenario == "benign_straight":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        window = None
    elif scenario == "benign_curve":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="curve", rng=rng)
        bsm = build_bsm(motion)
        window = None
    elif scenario == "naive_attack":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        n = len(bsm["speed"]); s, e = n // 3, 2 * n // 3
        bsm = inject_naive_attack(bsm, DT, s, e)
        window = (s, e)
    elif scenario == "sync_attack":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        n = len(bsm["speed"]); s, e = n // 3, 2 * n // 3
        bsm = inject_synchronized_attack(bsm, DT, s, e)
        window = (s, e)
    else:
        raise ValueError(scenario)

    tyre_lat_est, _ = _generate_tyre_estimates(motion, rng)
    baseline_flags = baseline_flags_lateral(bsm, DT, thr_lat, thr_heading)
    tyre_flags = tyre_flags_lateral(bsm, tyre_lat_est, thr_tyre)
    return baseline_flags, tyre_flags, window


# ---------------- LONGITUDINAL (braking) experiment ----------------

def calibrate_longitudinal_thresholds(seed_offset=10_000):
    long_scores, tyre_scores = [], []
    for i in range(N_CALIBRATION_TRIALS):
        rng = np.random.default_rng(seed_offset + i)
        maneuver = "straight" if i % 2 == 0 else "brake"
        motion = simulate_true_motion(DURATION_S, DT, maneuver=maneuver, rng=rng)
        bsm = build_bsm(motion)
        _, tyre_long_est = _generate_tyre_estimates(motion, rng)

        long_scores.append(baseline_long_mismatch(bsm, DT).max())
        tyre_scores.append(tyre_long_mismatch(bsm, tyre_long_est).max())

    thr_long = np.percentile(long_scores, PERCENTILE)
    thr_tyre = np.percentile(tyre_scores, PERCENTILE)
    return thr_long, thr_tyre


def run_longitudinal_trial(scenario, seed, thresholds):
    thr_long, thr_tyre = thresholds
    rng = np.random.default_rng(seed)

    if scenario == "benign_straight":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        window = None
    elif scenario == "benign_brake":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="brake", rng=rng)
        bsm = build_bsm(motion)
        window = None
    elif scenario == "naive_attack":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        n = len(bsm["speed"]); s, e = n // 3, 2 * n // 3
        attacked = {k: v.copy() for k, v in bsm.items()}
        attacked["speed"][s:e] -= 6.0  # implausible sudden speed drop, accel untouched
        bsm = attacked
        window = (s, e)
    elif scenario == "sync_attack":
        motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
        bsm = build_bsm(motion)
        n = len(bsm["speed"]); s, e = n // 3, 2 * n // 3
        bsm = inject_synchronized_attack_longitudinal(bsm, DT, s, e)
        window = (s, e)
    else:
        raise ValueError(scenario)

    _, tyre_long_est = _generate_tyre_estimates(motion, rng)
    baseline_flags = baseline_flags_longitudinal(bsm, DT, thr_long)
    tyre_flags = tyre_flags_longitudinal(bsm, tyre_long_est, thr_tyre)
    return baseline_flags, tyre_flags, window


# ---------------- summarizing / reporting ----------------

def summarize(run_trial_fn, scenario, thresholds, n_trials=N_EVAL_TRIALS,
              seed_offset=0):
    baseline_hits = 0
    tyre_hits = 0
    for i in range(n_trials):
        baseline_flags, tyre_flags, window = run_trial_fn(
            scenario, seed_offset + i, thresholds)
        if window is None:
            baseline_hits += int(baseline_flags.any())
            tyre_hits += int(tyre_flags.any())
        else:
            s, e = window
            baseline_hits += int(baseline_flags[s:e].any())
            tyre_hits += int(tyre_flags[s:e].any())
    return {
        "scenario": scenario,
        "n_trials": n_trials,
        "baseline_rate": baseline_hits / n_trials,
        "tyre_rate": tyre_hits / n_trials,
    }


def print_table(title, results):
    print(f"\n{title}")
    print(f"{'Scenario':<20}{'N':<6}{'Baseline':<12}{'Tyre-channel':<12}")
    print("-" * 50)
    for r in results:
        label = "FPR" if "benign" in r["scenario"] else "Det."
        print(f"{r['scenario']:<20}{r['n_trials']:<6}"
              f"{label + ':':<6}{r['baseline_rate']*100:>5.1f}%   "
              f"{r['tyre_rate']*100:>7.1f}%")


def main():
    # ---- Lateral experiment ----
    lat_thresholds = calibrate_lateral_thresholds()
    print(f"Lateral thresholds (99th pct, benign-only): "
          f"lat={lat_thresholds[0]:.3f}, heading={lat_thresholds[1]:.3f}, "
          f"tyre={lat_thresholds[2]:.3f}")

    lat_scenarios = ["benign_straight", "benign_curve", "naive_attack", "sync_attack"]
    lat_results = [summarize(run_lateral_trial, s, lat_thresholds, seed_offset=20_000)
                   for s in lat_scenarios]
    print_table("TABLE I: Lateral (Cornering) Attack", lat_results)

    # ---- Longitudinal experiment ----
    long_thresholds = calibrate_longitudinal_thresholds()
    print(f"\nLongitudinal thresholds (99th pct, benign-only): "
          f"long={long_thresholds[0]:.3f}, tyre={long_thresholds[1]:.3f}")

    long_scenarios = ["benign_straight", "benign_brake", "naive_attack", "sync_attack"]
    long_results = [summarize(run_longitudinal_trial, s, long_thresholds, seed_offset=30_000)
                    for s in long_scenarios]
    print_table("TABLE II: Longitudinal (Braking) Attack", long_results)

    return lat_results, long_results


if __name__ == "__main__":
    main()
