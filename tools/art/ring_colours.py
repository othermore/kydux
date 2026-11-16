#!/usr/bin/env python3
"""The rings' colours (D219): the ring's picture, a hoop of wood bound with rope on a
short post, painted in each colour a pair of rings carries, its rope and its post left
as they are.

    tools/art/ring_colours.py [--ring content/art/things/ring.webp] [--out content/art/things]

writes ring-red.webp, ring-blue.webp, ring-yellow.webp and ring-purple.webp beside
the ring. The hoop is the ring's circle above the post, and the four places where rope
binds it: there only the wood the rope leaves bare is painted, the darker wood between
its turns, and the rope's light strands are kept. The paint keeps the wood's light and
shade: each pixel takes the colour's hue and its saturation, and its own brightness
scaled to the colour's, so that the grain and the strokes show through as through paint.
The colours are those of paint on wood, chosen to stay apart from each other and from
the grass for a child who does not tell red from green, or blue from yellow.
"""

import argparse
import colorsys
import math
import sys
from pathlib import Path

from PIL import Image

#: A pair's colours, by name: paint on wood.
COLOURS: dict[str, tuple[int, int, int]] = {
    "red": (165, 30, 40),
    "blue": (34, 78, 176),
    "yellow": (236, 188, 40),
    "purple": (205, 120, 215),
}

#: The hoop's circle in the ring's picture of 210 by 300 pixels: its middle and its
#: outer radius; the post starts under it.
MIDDLE = (104.5, 100.0)
RADIUS = 107
POST_TOP = 199
#: The four rope bindings, as boxes (x0, y0, x1, y1): top, left, right and bottom.
BINDINGS = ((86, 0, 124, 38), (0, 82, 40, 123), (169, 84, 210, 125), (86, 164, 126, 206))
#: The ring's picture the boxes are measured on.
SIZE = (210, 300)
#: The wood's brightness the paint's own stands for, and the saturation the wood's
#: fullest has: a pixel's brightness and saturation are taken relative to them.
WOOD_VALUE = 0.72
WOOD_SATURATION = 0.55
#: An outline's brightness: darker than this is a line, darkened toward the paint.
OUTLINE = 0.3


def place(x: int, y: int) -> str | None:
    """Where a pixel of the ring's picture is: `binding`, `hoop`, or None for the post
    and the air."""
    if math.hypot(x - MIDDLE[0], y - MIDDLE[1]) > RADIUS:
        return None
    if any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in BINDINGS):
        return "binding"
    return "hoop" if y < POST_TOP else None


def is_rope(hue: float, value: float) -> bool:
    """Whether a pixel inside a binding is the rope's: a light strand, or a
    yellowish one in half light. Hue in degrees, value from 0 to 1."""
    return value >= 0.7 or (value >= 0.55 and 25 <= hue <= 45)


def paint_pixel(
    rgb: tuple[int, int, int], colour: tuple[int, int, int], where: str
) -> tuple[int, int, int] | None:
    """A pixel of the hoop painted, or None for one kept as it is."""
    h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
    if where == "binding" and (v < OUTLINE or is_rope(h * 360, v)):
        return None
    th, ts, tv = colorsys.rgb_to_hsv(*(c / 255 for c in colour))
    if v < OUTLINE:
        out = colorsys.hsv_to_rgb(th, min(1.0, ts * 0.7), v)
    else:
        out = colorsys.hsv_to_rgb(
            th, ts * min(1.0, s / WOOD_SATURATION), min(1.0, v / WOOD_VALUE * tv)
        )
    return tuple(round(c * 255) for c in out)  # type: ignore[return-value]


def paint(ring: Image.Image, colour: tuple[int, int, int]) -> Image.Image:
    """The ring's picture with its hoop painted in `colour`."""
    if ring.size != SIZE:
        raise ValueError(f"the ring's picture is {SIZE[0]} by {SIZE[1]} pixels, not {ring.size}")
    source = ring.convert("RGBA")
    out = source.copy()
    read, write = source.load(), out.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b, a = read[x, y]
            where = place(x, y)
            if a == 0 or where is None:
                continue
            painted = paint_pixel((r, g, b), colour, where)
            if painted is not None:
                write[x, y] = (*painted, a)
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--ring", type=Path, default=Path("content/art/things/ring.webp"))
    parser.add_argument("--out", type=Path, default=None)
    args = parser.parse_args(argv)
    out = args.out or args.ring.parent
    ring = Image.open(args.ring)
    for name, colour in COLOURS.items():
        target = out / f"ring-{name}.webp"
        paint(ring, colour).save(target, "WEBP", quality=90, method=6)
        print(target)
    return 0


if __name__ == "__main__":
    sys.exit(main())
