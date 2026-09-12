# Independent Tyre-Sensor Trust Channel for V2X Misbehavior Detection

Code and paper for "An Independent Tyre-Sensor Trust Channel for Detecting
Synchronized Insider Attacks in V2X Misbehavior Detection."

## Structure

- `core_simulation/` — the main synthetic simulation behind the paper's
  headline results (Tables I–II). Run `python evaluate.py` to reproduce
  both tables from scratch. `plot_example.py` / `plot_architecture.py`
  regenerate the paper's figures.

- `veremi_validation/` — supplementary validation cited in the paper's
  Limitations section: the same detector/attack code re-run against real
  benign vehicle trajectories extracted from the original VeReMi dataset's
  ground truth. See `REAL_VALIDATION.md` for full methodology and results.
  `real_windows.pkl` is the already-extracted trajectory data (5,203
  windows) — run `python evaluate_real.py` directly without needing to
  re-download or re-parse the ~230MB of VeReMi tarballs. To regenerate
  `real_windows.pkl` from scratch, see `extract_trajectories.py` and the
  download instructions in `REAL_VALIDATION.md`.

- `paper/` — the paper source (`paper.tex`), compiled PDF, and figures.

## Reproducing the headline results

```
cd core_simulation
pip install -r requirements.txt
python evaluate.py
```

## Reproducing the supplementary real-data validation

```
cd veremi_validation
python evaluate_real.py
```

## Citation

VeReMi dataset: R. W. van der Heijden, T. Lukaseder, and F. Kargl,
"VeReMi: A dataset for comparable evaluation of misbehavior detection in
VANETs," Proc. SecureComm, 2018.
