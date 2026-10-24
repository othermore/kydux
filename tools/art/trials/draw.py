#!/usr/bin/env python3
"""The art made as code (D72, candidate 2): the trials' pieces drawn by a
program, in the oblique view, at 24 pixels a tile, on one palette.

    tools/art/trials/draw.py [--out art/raw/code/pieces]

The walls and the paths are drawn as their sixteen pieces, one for each way a
tile's four neighbours (north, east, south, west) are of the same terrain, so
that any corner, end, T or cross joins by construction: the piece for a
neighbour mask m is named wall-m or path-m, with north 1, east 2, south 4 and
west 8. The grass repeats without a seam (its noise wraps round). The wizard
has four directions, each a standing frame and two walking ones.
"""

import argparse
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[3]
TILE = 24
NORTH, EAST, SOUTH, WEST = 1, 2, 4, 8

PALETTE = {
    "grass": [(86, 156, 72), (100, 176, 80), (74, 138, 64), (120, 190, 92)],
    "path": [(196, 160, 104), (178, 142, 90), (212, 178, 122)],
    "path_edge": (150, 118, 74),
    "stone_top": [(176, 176, 188), (160, 160, 174)],
    "stone_face": [(112, 112, 128), (96, 96, 112)],
    "mortar": (70, 70, 84),
    "outline": (40, 36, 48),
    "wood": [(138, 92, 54), (112, 72, 42), (160, 112, 66)],
    "metal": (220, 196, 90),
    "shadow": (0, 0, 0, 70),
}


def _noise(seed: int) -> list[list[float]]:
    """A tileable field of values from 0 to 1: random points smoothed with their
    neighbours, wrapping round the edges so that the tile repeats."""
    rng = random.Random(seed)
    base = [[rng.random() for _ in range(TILE)] for _ in range(TILE)]
    out = [[0.0] * TILE for _ in range(TILE)]
    for y in range(TILE):
        for x in range(TILE):
            total = 0.0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    total += base[(y + dy) % TILE][(x + dx) % TILE]
            out[y][x] = total / 9
    return out


def grass(seed: int = 7) -> Image.Image:
    image = Image.new("RGBA", (TILE, TILE))
    field = _noise(seed)
    colours = PALETTE["grass"]
    rng = random.Random(seed + 1)
    for y in range(TILE):
        for x in range(TILE):
            value = field[y][x]
            colour = colours[0] if value < 0.47 else colours[1] if value < 0.55 else colours[2]
            image.putpixel((x, y), colour)
    # Blades: a light pixel over a dark one, here and there.
    for _ in range(7):
        x, y = rng.randrange(TILE), rng.randrange(1, TILE)
        image.putpixel((x, y - 1), colours[3])
        image.putpixel((x, y), colours[2])
    return image


def _arms(mask: int, inset: int) -> list[tuple[int, int, int, int]]:
    """The rectangles of a piece's shape: its middle, and an arm to each neighbour
    of the same terrain, `inset` pixels in from the tile's sides."""
    low, high = inset, TILE - inset - 1
    boxes = [(low, low, high, high)]
    if mask & NORTH:
        boxes.append((low, 0, high, low))
    if mask & SOUTH:
        boxes.append((low, high, high, TILE - 1))
    if mask & WEST:
        boxes.append((0, low, low, high))
    if mask & EAST:
        boxes.append((high, low, TILE - 1, high))
    return boxes


def path(mask: int, seed: int = 11) -> Image.Image:
    """A path piece over grass: the dirt in the shape of the mask, its edge darker."""
    image = grass(seed)
    shape = Image.new("L", (TILE, TILE), 0)
    draw = ImageDraw.Draw(shape)
    for box in _arms(mask, 5):
        draw.rectangle(box, fill=255)
    rng = random.Random(seed + mask)
    for y in range(TILE):
        for x in range(TILE):
            if not shape.getpixel((x, y)):
                continue
            edge = any(
                0 <= x + dx < TILE and 0 <= y + dy < TILE and not shape.getpixel((x + dx, y + dy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            colour = (
                PALETTE["path_edge"]
                if edge
                else rng.choice(PALETTE["path"][:2] + PALETTE["path"][:1])
            )
            image.putpixel((x, y), colour)
    return image


def wall(mask: int) -> Image.Image:
    """A stone wall piece in the oblique view: the wall's top, light, in the shape
    of the mask, and, where the wall does not go on south, its front face below
    the top, with bricks; on grass where the wall is not."""
    image = grass(3)
    draw = ImageDraw.Draw(image)
    face = 8  # how tall the front face shows
    top = Image.new("L", (TILE, TILE), 0)
    tdraw = ImageDraw.Draw(top)
    for left, upper, right, lower in _arms(mask, 3):
        # The top sits higher than the floor by the face's height; an arm that
        # goes on into the tile south of it reaches the tile's edge.
        bottom = lower if lower == TILE - 1 else max(0, lower - face)
        tdraw.rectangle((left, max(0, upper - face), right, bottom), fill=255)
    # The face: under every part of the top whose south is open.
    for x in range(TILE):
        column = [y for y in range(TILE) if top.getpixel((x, y))]
        if not column:
            continue
        bottom = max(column)
        if bottom >= TILE - 1:
            continue  # the wall goes on south: no face shows here
        for y in range(bottom + 1, min(TILE, bottom + 1 + face)):
            row = y - bottom - 1
            mortar = row in (3, face - 1) or ((x + (0 if row < 4 else 4)) % 8 == 0)
            image.putpixel(
                (x, y), PALETTE["mortar"] if mortar else PALETTE["stone_face"][(x // 8) % 2]
            )
    for y in range(TILE):
        for x in range(TILE):
            if top.getpixel((x, y)):
                edge = any(
                    0 <= x + dx < TILE
                    and 0 <= y + dy < TILE
                    and not top.getpixel((x + dx, y + dy))
                    for dx, dy in ((1, 0), (-1, 0), (0, -1))
                )
                image.putpixel(
                    (x, y), PALETTE["outline"] if edge else PALETTE["stone_top"][(x + y) % 5 == 0]
                )
    del draw
    return image


def door(opened: bool) -> Image.Image:
    """A wooden door in a wall running east and west, closed or open."""
    image = wall(EAST | WEST)
    draw = ImageDraw.Draw(image)
    if opened:
        draw.rectangle((5, 1, 18, 20), fill=(30, 26, 34))
        draw.rectangle((4, 1, 6, 20), fill=PALETTE["wood"][1])
        return image
    draw.rectangle((5, 1, 18, 20), fill=PALETTE["wood"][0], outline=PALETTE["outline"])
    for x in (9, 14):
        draw.line((x, 2, x, 19), fill=PALETTE["wood"][1])
    draw.point((16, 11), fill=PALETTE["metal"])
    return image


def wizard(
    direction: str, frame: int, robe=(58, 104, 196), hat=(44, 80, 160), skin=(240, 200, 160)
) -> Image.Image:
    """The wizard, 24 by 32 pixels, facing a way; frame 0 stands, 1 and 2 walk."""
    image = Image.new("RGBA", (TILE, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    step = (0, 1, -1)[frame]
    draw.ellipse((5, 27, 18, 31), fill=PALETTE["shadow"])
    # Legs, apart while walking.
    draw.rectangle((8 - max(step, 0), 25, 10 - max(step, 0), 29), fill=PALETTE["outline"])
    draw.rectangle((13 + max(-step, 0), 25, 15 + max(-step, 0), 29), fill=PALETTE["outline"])
    # The robe, a bell.
    draw.polygon([(6, 26), (17, 26), (15, 14), (8, 14)], fill=robe, outline=PALETTE["outline"])
    # The head.
    draw.ellipse((7, 8, 16, 17), fill=skin, outline=PALETTE["outline"])
    if direction == "down":
        draw.point((9, 12), fill=PALETTE["outline"])
        draw.point((13, 12), fill=PALETTE["outline"])
    elif direction in ("left", "right"):
        eye = 9 if direction == "left" else 14
        draw.point((eye, 12), fill=PALETTE["outline"])
    # The hat, leaning the way the wizard faces.
    lean = {"left": -2, "right": 2}.get(direction, 0)
    draw.polygon([(5, 10), (18, 10), (11 + lean, 0)], fill=hat, outline=PALETTE["outline"])
    draw.line((6, 9, 17, 9), fill=PALETTE["metal"])
    # An arm swinging.
    arm_y = 18 + step
    if direction != "up":
        draw.rectangle((5, arm_y, 6, arm_y + 4), fill=robe)
        draw.rectangle((17, 18 - step, 18, 22 - step), fill=robe)
    return image


def all_pieces() -> dict[str, Image.Image]:
    pieces = {"grass": grass()}
    for mask in range(16):
        pieces[f"wall-{mask}"] = wall(mask)
        pieces[f"path-{mask}"] = path(mask)
    pieces["door-closed"] = door(False)
    pieces["door-open"] = door(True)
    for direction in ("down", "left", "right", "up"):
        for frame in range(3):
            pieces[f"wizard-{direction}-{frame}"] = wizard(direction, frame)
    return pieces


def main() -> int:
    parser = argparse.ArgumentParser(description="Draw the trials' pieces as code.")
    parser.add_argument("--out", type=Path, default=REPO / "art" / "raw" / "code" / "pieces")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    for name, image in all_pieces().items():
        image.save(args.out / f"{name}.png")
    print(f"{len(all_pieces())} pieces in {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
