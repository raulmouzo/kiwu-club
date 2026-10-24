#!/usr/bin/env python3
"""Prepares the brand artwork. Two steps, both offline:

  clean      Rewrites an Inkscape SVG as a tidy one: integer coordinates, a
             viewBox of about 1000 units, no metadata, no transform, and
             fill="currentColor" so the colour can be changed.

  component  Turns a tidy SVG into a React component that takes the colour
             from the text colour (className="text-primary") and the size
             from its className (className="h-12").

Examples:
  python3 scripts/brand-art.py clean ~/Desktop/logo.svg public/brand/logo.svg
  python3 scripts/brand-art.py component public/brand/logo.svg components/brand/logo.tsx Logo --label "Kiwu Club"

Only single-path SVGs with absolute/relative m, l, h, v, c, z commands are
supported, which is what Inkscape exports for these drawings.
"""

import argparse
import re
import sys
from pathlib import Path

NUMBER = re.compile(r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
ARGS = {"m": 2, "l": 2, "h": 1, "v": 1, "c": 6, "z": 0}
UNITS = 1000  # size of the longest side of the new viewBox


def join(values):
    """Integers separated by spaces; a minus sign already separates."""
    out = ""
    for v in values:
        s = str(int(v))
        out += s if (not out or s.startswith("-")) else " " + s
    return out


def convert_path(d, k, tx, ty):
    """Scales the path by k, applies the translation and rounds to integers.

    Points are rounded as absolute positions and written as relative offsets
    from the previous rounded point, so rounding errors never add up.
    """
    tokens = re.findall(r"[A-Za-z]|" + NUMBER.pattern, d)
    ex = ey = 0.0  # exact current point
    qx = qy = 0  # the same point, rounded
    start = (0.0, 0.0, 0, 0)  # exact and rounded start of the subpath
    out, first, i, cmd = [], True, 0, None

    while i < len(tokens):
        if tokens[i].isalpha():
            cmd = tokens[i]
            i += 1
            if cmd in "zZ":
                ex, ey, qx, qy = start
                out.append("z")
                continue
        low = cmd.lower()
        args = [float(t) for t in tokens[i : i + ARGS[low]]]
        i += ARGS[low]
        relative = cmd.islower() and not (cmd == "m" and first)

        def target(x, y):
            return (ex + x * k, ey + y * k) if relative else ((x + tx) * k, (y + ty) * k)

        if low == "m":
            ex, ey = target(*args)
            nx, ny = round(ex), round(ey)
            out.append("M" + join([nx, ny]) if first else "m" + join([nx - qx, ny - qy]))
            qx, qy, first = nx, ny, False
            start = (ex, ey, qx, qy)
            cmd = "l" if cmd == "m" else "L"  # extra pairs are line-tos
        elif low == "l":
            ex, ey = target(*args)
            nx, ny = round(ex), round(ey)
            out.append("l" + join([nx - qx, ny - qy]))
            qx, qy = nx, ny
        elif low == "h":
            ex = ex + args[0] * k if relative else (args[0] + tx) * k
            out.append("h" + join([round(ex) - qx]))
            qx = round(ex)
        elif low == "v":
            ey = ey + args[0] * k if relative else (args[0] + ty) * k
            out.append("v" + join([round(ey) - qy]))
            qy = round(ey)
        elif low == "c":
            points = [target(args[j], args[j + 1]) for j in (0, 2, 4)]
            out.append("c" + join([v for px, py in points for v in (round(px) - qx, round(py) - qy)]))
            ex, ey = points[2]
            qx, qy = round(ex), round(ey)
    return "".join(out)


def read_svg(path):
    svg = Path(path).read_text()
    view_box = [float(x) for x in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    move = re.search(r"translate\(([-\d.eE]+)[, ]+([-\d.eE]+)\)", svg)
    tx, ty = (float(move.group(1)), float(move.group(2))) if move else (0.0, 0.0)
    d = re.search(r'\sd="([^"]*)"', svg).group(1)
    return view_box, tx, ty, d


def clean(src, dst):
    (vx, vy, vw, vh), tx, ty, d = read_svg(src)
    k = UNITS / max(vw, vh)
    width, height = round(vw * k), round(vh * k)
    path = convert_path(d, k, tx, ty)
    Path(dst).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" fill="currentColor">'
        f'<path d="{path}"/></svg>\n'
    )
    print(f"{Path(src).name} -> {dst}  ({width}x{height}, {Path(dst).stat().st_size} bytes)")


def component(src, dst, name, label):
    svg = Path(src).read_text()
    view_box = re.search(r'viewBox="([^"]+)"', svg).group(1)
    d = re.search(r'\sd="([^"]*)"', svg).group(1)
    # Traced drawings (scripts/trace-png.py) have holes that need even-odd.
    rule = ' fillRule="evenodd"' if 'fill-rule="evenodd"' in svg else ""
    # A named drawing is announced to screen readers; a decorative one is hidden.
    a11y = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    Path(dst).write_text(
        f"// Generated from {src} by scripts/brand-art.py.\n"
        f"// Edit the SVG and run the script again instead of changing this file.\n"
        f'import type {{ SVGProps }} from "react"\n\n'
        f"export function {name}(props: SVGProps<SVGSVGElement>) {{\n"
        f"  return (\n"
        f'    <svg viewBox="{view_box}" fill="currentColor" {a11y} {{...props}}>\n'
        f'      <path{rule} d="{d}" />\n'
        f"    </svg>\n"
        f"  )\n"
        f"}}\n"
    )
    print(f"{src} -> {dst}  ({name})")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    c = sub.add_parser("clean", help="Inkscape SVG -> tidy SVG")
    c.add_argument("src")
    c.add_argument("dst")
    k = sub.add_parser("component", help="tidy SVG -> React component")
    k.add_argument("src")
    k.add_argument("dst")
    k.add_argument("name")
    k.add_argument("--label", default="", help="accessible name; leave empty for decorative art")
    args = parser.parse_args()

    if args.command == "clean":
        clean(args.src, args.dst)
    else:
        component(args.src, args.dst, args.name, args.label)


if __name__ == "__main__":
    sys.exit(main())
