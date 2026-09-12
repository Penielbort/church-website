"""
plot_architecture.py

A clean, monochrome (black-on-white) system/threat-model diagram:
the compromised digital pipeline (GNSS/IMU/V2X -> BSM) versus the
independent tyre-sensor channel, both feeding the detection module,
which outputs a pass/alert decision. Plain boxes, lines, text only.
"""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

plt.rcParams.update({"font.size": 9.5, "font.family": "sans-serif"})

fig, ax = plt.subplots(figsize=(7, 5.2))
ax.set_xlim(0, 10)
ax.set_ylim(0, 7.2)
ax.axis("off")


def box(x, y, w, h, text, fontsize=9.5):
    rect = FancyBboxPatch((x, y), w, h,
                           boxstyle="round,pad=0.02,rounding_size=0.08",
                           linewidth=1.3, edgecolor="black", facecolor="white")
    ax.add_patch(rect)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
             fontsize=fontsize, color="black")
    return (x, y, w, h)


def arrow(b1, b2, side1, side2, double=False):
    x1, y1, w1, h1 = b1
    x2, y2, w2, h2 = b2
    pts = {"right": lambda x, y, w, h: (x + w, y + h / 2),
           "left": lambda x, y, w, h: (x, y + h / 2),
           "top": lambda x, y, w, h: (x + w / 2, y + h),
           "bottom": lambda x, y, w, h: (x + w / 2, y)}
    p1 = pts[side1](x1, y1, w1, h1)
    p2 = pts[side2](x2, y2, w2, h2)
    style = "<|-|>" if double else "-|>"
    arr = FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=12,
                           linewidth=1.2, color="black")
    ax.add_patch(arr)


# ---- Compromised domain (dashed outer box, top-left) ----
outer = FancyBboxPatch((0.3, 4.55), 4.7, 2.35, boxstyle="round,pad=0.02",
                        linewidth=1.0, edgecolor="black", facecolor="white",
                        linestyle="dashed")
ax.add_patch(outer)
ax.text(0.55, 6.65, "Assumed compromised (software / firmware)",
         fontsize=8, style="italic", color="black")

gnss = box(0.6, 5.7, 1.8, 0.85, "GNSS\nReceiver")
imu = box(2.8, 5.7, 1.9, 0.85, "IMU /\nCAN-bus")
v2x = box(1.7, 4.75, 2.0, 0.75, "V2X\nTransceiver")

# ---- Right column: BSM -> Detection -> Alert ----
bsm = box(6.4, 5.55, 2.4, 0.95, "Broadcast BSM\n(claimed motion)")
detect = box(6.4, 3.15, 2.4, 1.5,
             "Detection Module\n\nBaseline check +\nTyre-channel check")
alert = box(6.4, 1.15, 2.4, 0.85, "Misbehavior alert\n/ pass")

# ---- Independent tyre channel (bottom-left) ----
tyre = box(0.5, 2.55, 3.9, 0.95, "Tyre Sensors (FL, FR, RL, RR)\npressure / temperature / load")
link = box(0.5, 1.15, 3.9, 0.85, "Dedicated authenticated link\n(architecturally separate)")

# ---- Arrows ----
arrow(gnss, v2x, "bottom", "top")
arrow(imu, v2x, "bottom", "top")
arrow(v2x, bsm, "right", "left")
arrow(bsm, detect, "bottom", "top")
arrow(detect, alert, "bottom", "top")
arrow(tyre, link, "bottom", "top")
arrow(link, detect, "right", "left")

# Labels placed manually in clear whitespace (not on the arrow midpoint,
# to avoid overlapping box edges)
ax.text(5.55, 5.15, "claimed motion\n(potentially fabricated)",
         ha="center", fontsize=7.5, style="italic", color="black")
ax.text(5.55, 2.15, "ground-truth\nphysical motion",
         ha="center", fontsize=7.5, style="italic", color="black")

fig.tight_layout()
fig.savefig("results/fig0_architecture.png", dpi=220, facecolor="white")
print("Saved results/fig0_architecture.png")
