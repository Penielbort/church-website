# Supplementary Validation: Real-World VeReMi Trajectories

This note documents a follow-up experiment run after the TELFOR submission,
to check whether the paper's results hold up when the *benign vehicle
motion* comes from real simulated urban traffic instead of this paper's
own synthetic generator. It is **not** part of the 4-page paper; it is
meant to sit in the project's GitHub repo and be cited from the paper's
Limitations section as supplementary material.

## What was done

1. Downloaded 25 simulation runs (~230 MB) from the original **VeReMi**
   dataset (Kamel et al., SecureComm 2018) — traffic simulated in
   OMNeT++/Veins/SUMO over Luxembourg's LuST scenario.
2. Parsed each run's `GroundTruthJSONlog.json`, kept only benign
   (`attackerType == 0`) per-vehicle position/speed traces, and split
   each continuous trace into non-overlapping 20-sample (~20 s) windows
   at the dataset's native ~1 Hz beacon rate — no interpolation, no
   upsampling.
3. Derived `speed`, `heading`, `yaw_rate`, `lat_accel`, `long_accel`
   from each window's real position/speed vectors, using the exact same
   conventions (`lat_accel = speed · yaw_rate`, etc.) as
   `vehicle_physics.py`'s synthetic generator.
4. Ran this paper's **unmodified** `detectors.py`, `attack_injector.py`,
   and `vehicle_physics.py` (tyre-load model + reconstruction) against
   these real trajectories — same code, same thresholds-from-calibration
   procedure, same 99th-percentile rule, same attack constructions
   (naive / synchronized, lateral / longitudinal).

This yielded **5,203** independent real 20-second driving windows —
more than enough for a 400-window calibration set and six disjoint
200-window evaluation sets (benign-FPR, and naive/synchronized ×
lateral/longitudinal), with zero overlap between any of the sets.

## What this validates — and what it doesn't

- It validates that the false-positive-rate results are not an artifact
  of the synthetic generator's idealized, noise-only motion: real
  urban driving (actual turns, stop-and-go traffic, real speed
  variability) does not blow up the tyre-channel's FPR.
- It does **not** touch the inverse-crime limitation already flagged in
  the paper: VeReMi contains no real tyre-load telemetry, so tyre data
  is still synthesized on top of real *motion* using the same linear
  model the detector inverts. Nothing closes that gap except real TPMS
  or smart-tyre logs.
- VeReMi's own attack types are position/speed spoofing, which doesn't
  match this paper's yaw/heading/braking attack taxonomy, so the same
  synthetic naive/synchronized attacks were injected on top of real
  motion rather than reusing VeReMi's labels.

## Results

| Scenario | Baseline (synthetic paper) | Baseline (real VeReMi motion) | Tyre-channel (synthetic paper) | Tyre-channel (real VeReMi motion) |
|---|---|---|---|---|
| Benign straight/driving FPR | 0.0–4.0% | 1.0–2.0% | 1.0–2.0% | 1.5% |
| Naive lateral attack (detect) | 100.0% | **4.0%** | 0.0% | 0.5% |
| Synchronized lateral attack (detect) | 0.5% | 1.5% | 100.0% | **79.0%** |
| Naive longitudinal attack (detect) | 100.0% | 100.0% | 0.5% | 0.5% |
| Synchronized longitudinal attack (detect) | 0.5% | **37.0%*** | 100.0% | 100.0% |

\* see caveat below — this number is partly a sampling-rate artifact, not a clean real-world result.

## Two findings worth taking seriously

**1. The baseline's naive-attack detection collapses on real traffic (100% → 4%).**
Confirmed by inspection: real urban driving includes genuine turns, so a
heading-consistency threshold calibrated on real benign data has to sit
much looser (~0.91 rad / 52°) than the synthetic benchmark's threshold
to avoid flagging ordinary cornering. At that looser threshold, the
naive attack's fixed 0.3 rad (~17°) heading bias mostly falls under the
line and goes uncaught. This is a genuine and informative result: the
synthetic paper's "100% naive-attack detection" is partly a property of
how smooth the synthetic benign traffic is, not a general property of
VCADS-style detectors.

**2. The tyre-channel's synchronized-lateral miss rate (100% → 79%) is
concentrated entirely at near-zero real-world speed.** Direct check:
detected cases average 17.7 m/s at the point of attack; missed cases
average 0.3 m/s. Since `lat_accel = speed · yaw_rate`, faking a yaw
rate while the vehicle is essentially stopped (a red light, stop-and-go
traffic) produces almost no physical lateral-acceleration footprint to
detect — this isn't a detector weakness so much as the attack having no
real signature to exploit at that speed. Real traffic has a lot more
near-zero-speed dwell time than the synthetic benchmark's continuous
cornering manoeuvre did.

## One caveat: the sync_long 37% is a known artifact, not a clean finding

Diagnosed by inspecting per-sample mismatch traces directly: the jump is
driven by a fixed pattern that peaks exactly at the center of the
injected attack window (mismatch ≈ 4.0, same shape across nearly every
detected trial) — not by real background dynamics or a boundary effect.
The attack injector's Gaussian braking pulse has `width = window_duration / 6`,
which was tuned for the paper's native 10 Hz sampling (a well-resolved
~10-sample-wide pulse). At VeReMi's native 1 Hz sampling, the same
formula produces a pulse only ~1 sample wide — badly under-resolved, so
forward-Euler integration and the detector's backward-difference
reconstruction diverge by a real but purely numerical amount. Running
the identical unmodified code at 10x coarser sampling than it was
designed for produces this discretization error; it is not evidence
about real-world attacker evasion, and shouldn't be quoted as such.
Fixing it would mean changing the attack injector's timing to scale with
the sampling rate — a legitimate follow-up, but it would mean the code
is no longer "unmodified," so it wasn't done here.

## Where the code lives

`extract_trajectories.py` (real trajectory extraction) and
`evaluate_real.py` (validation harness) are included alongside the main
`vehicle_physics.py` / `detectors.py` / `attack_injector.py` — the same,
completely unmodified files used in the main paper's experiments.
