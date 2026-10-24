#!/usr/bin/env python3
"""Turns a black-on-white (or transparent) drawing in a PNG into a tidy SVG.

It follows the outline of the ink with sub-pixel accuracy (marching squares on
the anti-aliased image), simplifies it and fits smooth curves, so the result
stays sharp at any size. The SVG follows the same conventions as the rest of
the brand art: a viewBox of about 1000 units, integer coordinates and
fill="currentColor". Needs Pillow and NumPy; nothing is downloaded.

  python3 scripts/trace-png.py drawing.png public/brand/coffee-cup.svg
  python3 scripts/brand-art.py component public/brand/coffee-cup.svg components/brand/coffee-cup.tsx CoffeeCup
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

UNITS = 1000
LEVEL = 0.5


def load_ink(path, margin, smooth):
    """Ink amount (0..1) of the drawing, cropped to its bounding box."""
    image = Image.open(path).convert("RGBA")
    page = Image.new("RGBA", image.size, (255, 255, 255, 255))
    page.alpha_composite(image)
    ink = 1 - np.asarray(page.convert("L"), dtype=float) / 255
    ys, xs = np.where(ink > LEVEL)
    y0, y1, x0, x1 = ys.min() - margin, ys.max() + margin + 1, xs.min() - margin, xs.max() + margin + 1
    ink = ink[max(y0, 0) : y1, max(x0, 0) : x1]
    # A blur takes the pixel stair-steps and the roughness of the brush out.
    blurred = Image.fromarray((ink * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(smooth))
    return np.pad(np.asarray(blurred, dtype=float) / 255, 1)


def contours(f):
    """Closed outlines of the region where f >= LEVEL (marching squares)."""
    h, w = f.shape
    links = {}

    def point(key):
        kind, y, x = key
        if kind == "h":  # between (y, x) and (y, x + 1)
            a, b = f[y, x], f[y, x + 1]
            return (x + (LEVEL - a) / (b - a), y)
        a, b = f[y, x], f[y + 1, x]  # between (y, x) and (y + 1, x)
        return (x, y + (LEVEL - a) / (b - a))

    def link(a, b):
        links.setdefault(a, []).append(b)
        links.setdefault(b, []).append(a)

    for y in range(h - 1):
        for x in range(w - 1):
            tl, tr, br, bl = f[y, x] >= LEVEL, f[y, x + 1] >= LEVEL, f[y + 1, x + 1] >= LEVEL, f[y + 1, x] >= LEVEL
            index = tl * 8 + tr * 4 + br * 2 + bl
            if index in (0, 15):
                continue
            T, R, B, L = ("h", y, x), ("v", y, x + 1), ("h", y + 1, x), ("v", y, x)
            centre = (f[y, x] + f[y, x + 1] + f[y + 1, x] + f[y + 1, x + 1]) / 4 >= LEVEL
            segments = {
                1: [(L, B)], 2: [(B, R)], 3: [(L, R)], 4: [(T, R)],
                5: [(T, L), (B, R)] if centre else [(T, R), (L, B)],
                6: [(T, B)], 7: [(L, T)], 8: [(L, T)], 9: [(T, B)],
                10: [(T, R), (L, B)] if centre else [(L, T), (B, R)],
                11: [(T, R)], 12: [(L, R)], 13: [(B, R)], 14: [(L, B)],
            }[index]
            for a, b in segments:
                link(a, b)

    seen, loops = set(), []
    for start in links:
        if start in seen:
            continue
        loop, previous, current = [], None, start
        while current not in seen:
            seen.add(current)
            loop.append(point(current))
            options = [n for n in links[current] if n != previous]
            previous, current = current, (options[0] if options else start)
        loops.append(loop)
    return loops


def simplify(points, epsilon):
    """Douglas-Peucker on a closed outline."""
    def reduce(pts):
        (x1, y1), (x2, y2) = pts[0], pts[-1]
        dx, dy = x2 - x1, y2 - y1
        norm = (dx * dx + dy * dy) ** 0.5 or 1e-9
        distances = [abs(dy * (x - x1) - dx * (y - y1)) / norm for x, y in pts[1:-1]]
        if not distances or max(distances) <= epsilon:
            return [pts[0], pts[-1]]
        i = distances.index(max(distances)) + 1
        return reduce(pts[: i + 1])[:-1] + reduce(pts[i:])

    half = len(points) // 2
    if half < 2:
        return points
    return reduce(points[: half + 1])[:-1] + reduce(points[half:] + [points[0]])[:-1]


def to_path(loop, scale, dx, dy):
    """Smooth closed curve through the points (Catmull-Rom as cubic Beziers)."""
    p = [((x - dx) * scale, (y - dy) * scale) for x, y in loop]
    n = len(p)
    if n < 3:
        return ""
    out = [f"M{round(p[0][0])} {round(p[0][1])}"]
    for i in range(n):
        p0, p1, p2, p3 = p[(i - 1) % n], p[i], p[(i + 1) % n], p[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append("C" + " ".join(str(round(v)) for v in (*c1, *c2, *p2)))
    return "".join(out) + "Z"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("src")
    parser.add_argument("dst")
    parser.add_argument("--margin", type=int, default=4, help="pixels kept around the drawing")
    parser.add_argument("--detail", type=float, default=0.9, help="outline tolerance in pixels; lower keeps more detail")
    parser.add_argument("--smooth", type=float, default=1.4, help="blur in pixels applied before tracing; 0 keeps every irregularity")
    args = parser.parse_args()

    ink = load_ink(args.src, args.margin, args.smooth)
    loops = [simplify(loop, args.detail) for loop in contours(ink) if len(loop) > 8]
    height, width = ink.shape
    scale = UNITS / max(width, height)
    path = "".join(to_path(loop, scale, 0, 0) for loop in loops)
    w, h = round(width * scale), round(height * scale)
    Path(args.dst).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="currentColor">'
        f'<path fill-rule="evenodd" d="{path}"/></svg>\n'
    )
    print(f"{args.src} -> {args.dst}  ({len(loops)} outlines, {w}x{h}, {Path(args.dst).stat().st_size} bytes)")


if __name__ == "__main__":
    sys.exit(main())
