"""
extract_trajectories.py

Parses VeReMi GroundTruthJSONlog.json files (type==4 records) and pulls
out continuous, benign (attackerType==0) per-sender trajectories.

For each trajectory we compute derived kinematics using the SAME
conventions as vehicle_physics.py's synthetic generator:
    speed      = |spd vector|
    heading    = unwrapped atan2(spd_y, spd_x)
    yaw_rate   = d(heading)/dt
    long_accel = d(speed)/dt
    lat_accel  = speed * yaw_rate

Trajectories are cut into fixed-length, non-overlapping WINDOW_N-sample
windows (VeReMi's own beacon rate is ~1 Hz, so WINDOW_N=20 => a 20s
"trial", the closest matroshka to this paper's 6s/10Hz synthetic trials
that real message spacing allows without inventing samples we don't
have via interpolation).
"""

import json
import glob
import numpy as np

WINDOW_N = 20          # samples per trial window (real data is ~1 Hz)
MAX_GAP_S = 2.0         # treat a gap > this as a break in continuity
MIN_DT, MAX_DT = 0.3, 3.0  # sanity bounds on inter-sample spacing


def load_gt_records(path):
    recs = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("type") == 4:
                recs.append(d)
    return recs


def kinematics_from_positions(times, spds):
    times = np.asarray(times)
    spd_vec = np.asarray(spds)  # (n, 3)
    speed = np.linalg.norm(spd_vec[:, :2], axis=1)
    heading = np.unwrap(np.arctan2(spd_vec[:, 1], spd_vec[:, 0]))
    dt = np.gradient(times)
    yaw_rate = np.gradient(heading) / dt
    long_accel = np.gradient(speed) / dt
    lat_accel = speed * yaw_rate
    return {
        "t": times - times[0], "speed": speed, "yaw_rate": yaw_rate,
        "heading": heading, "lat_accel": lat_accel, "long_accel": long_accel,
    }


def extract_windows_from_file(path):
    recs = load_gt_records(path)
    by_sender = {}
    for d in recs:
        if d.get("attackerType", 0) != 0:
            continue  # only benign ground-truth trajectories
        by_sender.setdefault(d["sender"], []).append(d)

    windows = []
    for sender, entries in by_sender.items():
        entries.sort(key=lambda d: d["time"])
        times = [e["time"] for e in entries]
        spds = [e["spd"] for e in entries]

        # split into continuous runs (no gap > MAX_GAP_S, sane dt)
        runs = []
        cur = [0]
        for i in range(1, len(times)):
            dt = times[i] - times[i - 1]
            if MIN_DT <= dt <= MAX_GAP_S:
                cur.append(i)
            else:
                if len(cur) >= WINDOW_N:
                    runs.append(cur)
                cur = [i]
        if len(cur) >= WINDOW_N:
            runs.append(cur)

        for run in runs:
            # cut into non-overlapping WINDOW_N windows
            for start in range(0, len(run) - WINDOW_N + 1, WINDOW_N):
                idxs = run[start:start + WINDOW_N]
                t_win = [times[i] for i in idxs]
                spd_win = [spds[i] for i in idxs]
                dts = np.diff(t_win)
                if dts.min() < MIN_DT or dts.max() > MAX_DT:
                    continue
                motion = kinematics_from_positions(t_win, spd_win)
                windows.append({
                    "source_file": path, "sender": sender, "motion": motion,
                })
    return windows


def main():
    all_windows = []
    for path in sorted(glob.glob("gt_logs/gt_*.json")):
        w = extract_windows_from_file(path)
        all_windows.extend(w)
        print(f"{path}: {len(w)} windows")
    print(f"\nTotal real benign trajectory windows extracted: {len(all_windows)}")

    # quick sanity stats
    speeds = np.concatenate([w["motion"]["speed"] for w in all_windows])
    yaws = np.concatenate([w["motion"]["yaw_rate"] for w in all_windows])
    print(f"speed range: {speeds.min():.1f} - {speeds.max():.1f} m/s, "
          f"mean {speeds.mean():.1f}")
    print(f"|yaw_rate| max: {np.abs(yaws).max():.3f} rad/s, "
          f"mean |yaw_rate|: {np.abs(yaws).mean():.4f}")

    import pickle
    with open("real_windows.pkl", "wb") as f:
        pickle.dump(all_windows, f)


if __name__ == "__main__":
    main()
