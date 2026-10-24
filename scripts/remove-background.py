#!/usr/bin/env python3
"""Remove the plain background from product photos, entirely offline.

Works by flood-filling the background from the image corners, so only the
background that touches the border becomes transparent. Whites *inside* the
subject (milk, foam, highlights) stay opaque. It suits photos shot on a flat,
near-white background; it is not a general AI cut-out.

Requires Pillow:  pip install pillow

Examples:
  python3 scripts/remove-background.py photo.png
  python3 scripts/remove-background.py public/products -o cutouts --tolerance 40
  python3 scripts/remove-background.py glass.webp --format png --clamp-base
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def remove_background(
    image: Image.Image, tolerance: int, clean: int, feather: float, clamp_base: bool
) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size

    # Paint the background magenta from every corner; whatever turns magenta
    # is background that is connected to the outside of the picture.
    marker = (255, 0, 255)
    painted = rgb.copy()
    for seed in [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]:
        ImageDraw.floodfill(painted, seed, marker, thresh=tolerance)
    is_background = ImageChops.difference(painted, Image.new("RGB", rgb.size, marker))
    is_background = is_background.convert("L").point(lambda v: 255 if v == 0 else 0)
    alpha = is_background.point(lambda v: 255 - v)

    if clean > 1:
        # Opening (erode, then dilate) removes thin leftovers such as shadows.
        size = clean | 1
        alpha = alpha.filter(ImageFilter.MinFilter(size)).filter(ImageFilter.MaxFilter(size))
    # A one-pixel erosion drops the white halo; the blur softens the edge.
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    if clamp_base:
        alpha = clamp_to_body_width(alpha)

    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def clamp_to_body_width(alpha: Image.Image) -> Image.Image:
    """Keep the lowest 30% of the subject inside the width of its upper body.

    Trims the floor reflection that spreads past the base of a glass.
    """
    width, height = alpha.size
    solid = alpha.point(lambda v: 255 if v > 128 else 0)
    box = solid.getbbox()
    if box is None:
        return alpha
    top, bottom = box[1], box[3]
    split = top + int((bottom - top) * 0.7)
    body = solid.crop((0, top, width, split)).getbbox()
    if body is None:
        return alpha
    left, right = body[0], body[2]
    mask = Image.new("L", (width, height), 255)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((0, split, left - 1, height), fill=0)
    draw.rectangle((right, split, width, height), fill=0)
    return ImageChops.multiply(alpha, mask)


def collect(source: Path) -> list[Path]:
    if source.is_dir():
        return sorted(p for p in source.iterdir() if p.suffix.lower() in EXTENSIONS)
    return [source]


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove a plain background from images.")
    parser.add_argument("source", type=Path, help="an image, or a folder of images")
    parser.add_argument("-o", "--output", type=Path, default=Path("cutouts"),
                        help="output folder (default: ./cutouts)")
    parser.add_argument("-f", "--format", choices=["webp", "png"], default="webp",
                        help="output format (default: webp)")
    parser.add_argument("-t", "--tolerance", type=int, default=48,
                        help="how far from the corner colour still counts as background, 0-255 (default: 48)")
    parser.add_argument("--clean", type=int, default=9,
                        help="size of the filter that removes thin leftovers; 0 disables it (default: 9)")
    parser.add_argument("--feather", type=float, default=0.9,
                        help="edge softness in pixels (default: 0.9)")
    parser.add_argument("--clamp-base", action="store_true",
                        help="trim reflections that spread wider than the subject's base")
    args = parser.parse_args()

    if not args.source.exists():
        print(f"error: {args.source} does not exist", file=sys.stderr)
        return 1

    files = collect(args.source)
    if not files:
        print(f"error: no images found in {args.source}", file=sys.stderr)
        return 1

    args.output.mkdir(parents=True, exist_ok=True)
    for path in files:
        target = args.output / f"{path.stem}.{args.format}"
        if target.resolve() == path.resolve():
            print(f"skip {path.name}: output would overwrite the original", file=sys.stderr)
            continue
        with Image.open(path) as image:
            cutout = remove_background(image, args.tolerance, args.clean, args.feather, args.clamp_base)
        if args.format == "webp":
            cutout.save(target, "WEBP", quality=92, method=6)
        else:
            cutout.save(target, "PNG", optimize=True)
        print(f"{path.name} -> {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
