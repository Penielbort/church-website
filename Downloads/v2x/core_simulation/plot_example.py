"""
plot_example.py

Generates the two results-section figures, using the SAME calibrated
thresholds as evaluate.py (not hardcoded sensitivities), in plain
black-and-white / grayscale styling suitable for print.

Fig 1: Synchronized lateral (cornering) attack
Fig 2: Synchronized longitudinal (braking) attack
"""

import numpy as np
import matplotlib.pyplot as plt

from vehicle_physics import (simulate_true_motion, compute_tyre_data,
                              estimate_lat_accel_from_tyres,
                              estimate_long_accel_from_tyres)
from attack_injector import (build_bsm, inject_synchronized_attack,
                              inject_synchronized_attack_longitudinal)
from detectors import (baseline_flags_lateral, tyre_flags_lateral,
                        baseline_flags_longitudinal, tyre_flags_longitudinal)
from evaluate import (calibrate_lateral_thresholds,
                       calibrate_longitudinal_thresholds, DT, DURATION_S)

plt.rcParams.update({
    "font.size": 10,
    "axes.edgecolor": "black",
    "axes.labelcolor": "black",
    "xtick.color": "black",
    "ytick.color": "black",
})


def plot_lateral(seed=7, out_path="results/fig1_lateral_attack.png"):
    thr_lat, thr_heading, thr_tyre = calibrate_lateral_thresholds()

    rng = np.random.default_rng(seed)
    motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
    bsm = build_bsm(motion)
    n = len(bsm["speed"]); start, end = n // 3, 2 * n // 3
    attacked_bsm = inject_synchronized_attack(bsm, DT, start, end)

    tyre_data = compute_tyre_data(motion, rng=rng)
    tyre_lat_est = estimate_lat_accel_from_tyres(tyre_data)

    baseline_flags = baseline_flags_lateral(attacked_bsm, DT, thr_lat, thr_heading)
    tyre_flags = tyre_flags_lateral(attacked_bsm, tyre_lat_est, thr_tyre)

    claimed_lat = attacked_bsm["speed"] * attacked_bsm["yaw_rate"]
    t = motion["t"]

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.axvspan(t[start], t[end - 1], color="0.85", label="Fabricated manoeuvre window")
    ax.plot(t, claimed_lat, label="BSM-claimed lateral accel (fabricated)",
            color="black", linewidth=1.8)
    ax.plot(t, tyre_lat_est, label="Tyre-derived lateral accel (ground truth)",
            color="black", linewidth=1.4, linestyle="--")
    if tyre_flags.any():
        ax.scatter(t[tyre_flags], claimed_lat[tyre_flags],
                   color="black", marker="x", s=60,
                   linewidths=1.6, zorder=5, label="Tyre-channel flags misbehavior")

    ax.set_xlabel("Time (s)")
    ax.set_ylabel(r"Lateral acceleration (m/s$^2$)")
    ax.set_title("Synchronized insider attack (lateral)")
    ax.legend(loc="upper right", fontsize=7, frameon=True, edgecolor="black")
    fig.tight_layout()
    fig.savefig(out_path, dpi=200)
    print(f"Saved {out_path} | Baseline flagged: "
          f"{'YES' if baseline_flags[start:end].any() else 'NO'} | "
          f"Tyre-channel flagged: {'YES' if tyre_flags[start:end].any() else 'NO'}")


def plot_longitudinal(seed=3, out_path="results/fig2_longitudinal_attack.png"):
    thr_long, thr_tyre = calibrate_longitudinal_thresholds()

    rng = np.random.default_rng(seed)
    motion = simulate_true_motion(DURATION_S, DT, maneuver="straight", rng=rng)
    bsm = build_bsm(motion)
    n = len(bsm["speed"]); start, end = n // 3, 2 * n // 3
    attacked_bsm = inject_synchronized_attack_longitudinal(bsm, DT, start, end)

    tyre_data = compute_tyre_data(motion, rng=rng)
    tyre_long_est = estimate_long_accel_from_tyres(tyre_data)

    baseline_flags = baseline_flags_longitudinal(attacked_bsm, DT, thr_long)
    tyre_flags = tyre_flags_longitudinal(attacked_bsm, tyre_long_est, thr_tyre)

    t = motion["t"]

    fig, ax = plt.subplots(figsize=(7, 4))
    ax.axvspan(t[start], t[end - 1], color="0.85", label="Fabricated manoeuvre window")
    ax.plot(t, attacked_bsm["long_accel"], label="BSM-claimed longitudinal accel (fabricated)",
            color="black", linewidth=1.8)
    ax.plot(t, tyre_long_est, label="Tyre-derived longitudinal accel (ground truth)",
            color="black", linewidth=1.4, linestyle="--")
    if tyre_flags.any():
        ax.scatter(t[tyre_flags], attacked_bsm["long_accel"][tyre_flags],
                   color="black", marker="x", s=60,
                   linewidths=1.6, zorder=5, label="Tyre-channel flags misbehavior")

    ax.set_xlabel("Time (s)")
    ax.set_ylabel(r"Longitudinal acceleration (m/s$^2$)")
    ax.set_title("Synchronized insider attack (longitudinal / braking)")
    ax.legend(loc="lower right", fontsize=7, frameon=True, edgecolor="black")
    fig.tight_layout()
    fig.savefig(out_path, dpi=200)
    print(f"Saved {out_path} | Baseline flagged: "
          f"{'YES' if baseline_flags[start:end].any() else 'NO'} | "
          f"Tyre-channel flagged: {'YES' if tyre_flags[start:end].any() else 'NO'}")


if __name__ == "__main__":
    plot_lateral()
    plot_longitudinal()
