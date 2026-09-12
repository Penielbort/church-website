"""
evaluate_real.py

Supplementary validation: re-runs this paper's UNMODIFIED baseline and
tyre-channel detectors (detectors.py), UNMODIFIED attack injection
(attack_injector.py), and UNMODIFIED tyre-load model (vehicle_physics.py
compute_tyre_data / estimate_*_accel_from_tyres) -- but the underlying
"true vehicle motion" for benign trials is now REAL ground-truth motion
extracted from the VeReMi dataset's simulated urban traffic (LuST /
Luxembourg city scenario), instead of this paper's own synthetic
straight/curve/brake generator.

What this validates: that the FPR results aren't an artefact of the
synthetic motion generator being unrealistically smooth/idealized --
i.e. genuine urban driving (real speed profiles, real turns, stop-start
traffic) doesn't blow up the false-positive rate.

What this does NOT validate: the tyre channel itself is still
synthesized on top of real motion using the same linear K_lat/K_long
model as the detector inverts (see paper's inverse-crime caveat) --
VeReMi contains no real tyre-load telemetry, so that limitation is
structural and unaffected by this experiment. Synthetic attacks
(naive/synchronized) are still injected the same way as in the main
paper, since VeReMi's own attack types (position/speed spoofing) don't
match this paper's yaw/heading/braking attack taxonomy.

DT here is 1.0s (VeReMi's native ~1Hz beacon rate), not the paper's
10Hz synthetic sampling -- real message spacing, not interpolated.
"""

import pickle
import numpy as np

from vehicle_physics import compute_tyre_data, estimate_lat_accel_from_tyres, \
    estimate_long_accel_from_tyres
from attack_injector import build_bsm, inject_naive_attack, \
    inject_synchronized_attack, inject_synchronized_attack_longitudinal
from detectors import (baseline_lat_mismatch, baseline_heading_mismatch,
                        baseline_long_mismatch, tyre_lat_mismatch,
                        tyre_long_mismatch, baseline_flags_lateral,
                        baseline_flags_longitudinal, tyre_flags_lateral,
                        tyre_flags_longitudinal)

PERCENTILE = 99


def _tyre_estimates(motion, rng):
    tyre_data = compute_tyre_data(motion, rng=rng)
    return (estimate_lat_accel_from_tyres(tyre_data),
            estimate_long_accel_from_tyres(tyre_data))


def calibrate(windows, seed_base):
    lat_scores, heading_scores, tyre_lat_scores = [], [], []
    long_scores, tyre_long_scores = [], []
    for i, w in enumerate(windows):
        rng = np.random.default_rng(seed_base + i)
        motion = w["motion"]
        dt = float(np.median(np.diff(motion["t"])))
        bsm = build_bsm(motion)
        tyre_lat_est, tyre_long_est = _tyre_estimates(motion, rng)

        lat_scores.append(baseline_lat_mismatch(bsm).max())
        heading_scores.append(baseline_heading_mismatch(bsm, dt).max())
        tyre_lat_scores.append(tyre_lat_mismatch(bsm, tyre_lat_est).max())
        long_scores.append(baseline_long_mismatch(bsm, dt).max())
        tyre_long_scores.append(tyre_long_mismatch(bsm, tyre_long_est).max())

    thr_lat = np.percentile(lat_scores, PERCENTILE)
    thr_heading = np.percentile(heading_scores, PERCENTILE)
    thr_tyre_lat = np.percentile(tyre_lat_scores, PERCENTILE)
    thr_long = np.percentile(long_scores, PERCENTILE)
    thr_tyre_long = np.percentile(tyre_long_scores, PERCENTILE)
    return dict(lat=thr_lat, heading=thr_heading, tyre_lat=thr_tyre_lat,
                long=thr_long, tyre_long=thr_tyre_long)


def run_benign(windows, thr, seed_base):
    baseline_lat_hits = tyre_lat_hits = 0
    baseline_long_hits = tyre_long_hits = 0
    for i, w in enumerate(windows):
        rng = np.random.default_rng(seed_base + i)
        motion = w["motion"]
        dt = float(np.median(np.diff(motion["t"])))
        bsm = build_bsm(motion)
        tyre_lat_est, tyre_long_est = _tyre_estimates(motion, rng)

        bflag_lat = baseline_flags_lateral(bsm, dt, thr["lat"], thr["heading"])
        tflag_lat = tyre_flags_lateral(bsm, tyre_lat_est, thr["tyre_lat"])
        bflag_long = baseline_flags_longitudinal(bsm, dt, thr["long"])
        tflag_long = tyre_flags_longitudinal(bsm, tyre_long_est, thr["tyre_long"])

        baseline_lat_hits += int(bflag_lat.any())
        tyre_lat_hits += int(tflag_lat.any())
        baseline_long_hits += int(bflag_long.any())
        tyre_long_hits += int(tflag_long.any())
    n = len(windows)
    return dict(baseline_lat_fpr=baseline_lat_hits / n, tyre_lat_fpr=tyre_lat_hits / n,
                baseline_long_fpr=baseline_long_hits / n, tyre_long_fpr=tyre_long_hits / n,
                n=n)


def run_attack(windows, thr, seed_base, kind):
    """kind in {'naive_lat','sync_lat','naive_long','sync_long'}"""
    baseline_hits = tyre_hits = 0
    n = len(windows)
    for i, w in enumerate(windows):
        rng = np.random.default_rng(seed_base + i)
        motion = w["motion"]
        dt = float(np.median(np.diff(motion["t"])))
        bsm = build_bsm(motion)
        m = len(bsm["speed"])
        s, e = m // 3, 2 * m // 3

        if kind == "naive_lat":
            attacked = inject_naive_attack(bsm, dt, s, e)
            tyre_lat_est, _ = _tyre_estimates(motion, rng)
            bflag = baseline_flags_lateral(attacked, dt, thr["lat"], thr["heading"])
            tflag = tyre_flags_lateral(attacked, tyre_lat_est, thr["tyre_lat"])
        elif kind == "sync_lat":
            attacked = inject_synchronized_attack(bsm, dt, s, e)
            tyre_lat_est, _ = _tyre_estimates(motion, rng)
            bflag = baseline_flags_lateral(attacked, dt, thr["lat"], thr["heading"])
            tflag = tyre_flags_lateral(attacked, tyre_lat_est, thr["tyre_lat"])
        elif kind == "naive_long":
            attacked = {k: v.copy() for k, v in bsm.items()}
            attacked["speed"][s:e] -= 6.0
            _, tyre_long_est = _tyre_estimates(motion, rng)
            bflag = baseline_flags_longitudinal(attacked, dt, thr["long"])
            tflag = tyre_flags_longitudinal(attacked, tyre_long_est, thr["tyre_long"])
        elif kind == "sync_long":
            attacked = inject_synchronized_attack_longitudinal(bsm, dt, s, e)
            _, tyre_long_est = _tyre_estimates(motion, rng)
            bflag = baseline_flags_longitudinal(attacked, dt, thr["long"])
            tflag = tyre_flags_longitudinal(attacked, tyre_long_est, thr["tyre_long"])
        else:
            raise ValueError(kind)

        baseline_hits += int(bflag[s:e].any())
        tyre_hits += int(tflag[s:e].any())
    return dict(baseline_rate=baseline_hits / n, tyre_rate=tyre_hits / n, n=n)


def main():
    windows = pickle.load(open("real_windows.pkl", "rb"))
    rng = np.random.default_rng(42)
    idx = rng.permutation(len(windows))
    windows = [windows[i] for i in idx]

    calib = windows[0:400]
    eval_benign = windows[400:600]
    eval_naive_lat = windows[600:800]
    eval_sync_lat = windows[800:1000]
    eval_naive_long = windows[1000:1200]
    eval_sync_long = windows[1200:1400]

    print(f"Total real windows available: {len(windows)}")
    print(f"Calibration: {len(calib)}, benign-FPR eval: {len(eval_benign)}, "
          f"each attack eval: {len(eval_naive_lat)}")

    thr = calibrate(calib, seed_base=0)
    print("\nThresholds (99th pct, real benign calibration):")
    for k, v in thr.items():
        print(f"  {k}: {v:.4f}")

    benign = run_benign(eval_benign, thr, seed_base=100_000)
    print(f"\nBenign real driving -- Baseline lat FPR: {benign['baseline_lat_fpr']*100:.1f}%, "
          f"Tyre lat FPR: {benign['tyre_lat_fpr']*100:.1f}% (n={benign['n']})")
    print(f"Benign real driving -- Baseline long FPR: {benign['baseline_long_fpr']*100:.1f}%, "
          f"Tyre long FPR: {benign['tyre_long_fpr']*100:.1f}% (n={benign['n']})")

    for kind, ws, seed in [("naive_lat", eval_naive_lat, 200_000),
                           ("sync_lat", eval_sync_lat, 300_000),
                           ("naive_long", eval_naive_long, 400_000),
                           ("sync_long", eval_sync_long, 500_000)]:
        r = run_attack(ws, thr, seed_base=seed, kind=kind)
        print(f"{kind:12s} -- Baseline: {r['baseline_rate']*100:.1f}%, "
              f"Tyre: {r['tyre_rate']*100:.1f}% (n={r['n']})")


if __name__ == "__main__":
    main()
