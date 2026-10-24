#!/usr/bin/env python3
"""A scene painted first, its map after (the owner's choice, 2026-10-23): find
the grid the painting shows, cut it into cells, and turn the cells marked by a
person into a scene of the game (D73).

    tools/art/map_from_image.py grid <painting.png>
        finds the faint grid lines Gemini was asked to paint, and prints the
        cells' size, the offset of the first line and how many cells there are
    tools/art/map_from_image.py sheet <painting.png> <out.png> [--marks marks.txt]
        the painting at a size to read, every cell numbered by its column and
        row from 0, and, with marks, each cell tinted by its terrain
    tools/art/map_from_image.py scene <marks.txt> <things.json> <out-folder>
        writes map.txt and scene.json from the marks

The grid is found from the painting itself: a grid line is a thin line a little
lighter than what is on each side of it, so for every column of pixels the
lines are counted where a pixel is lighter than the pixels a few to its left
and right; the columns that are lines stand out, evenly spaced. The spacing is
the one that best explains those columns, and the offset the one that lines
the grid up with them; the same for the rows.

The marks are a text file, one line a row of cells, one letter a cell, with
the letters of scene.json's terrains (`g` grass, `p` path, `#` wall, `.` floor,
`f` fence, `h` hedge, `s` steps, `b` a bank, `t` a tree's trunk or a bush, `r`
a rock, `o` a flat stone a thing may lie on). A tree blocks only the cell its
trunk stands in: its leaves hang over cells a figure walks behind. The things are a JSON list in
scene.json's form ({"kind", "id", "at": [x, y]}).
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

Array = np.ndarray

#: The terrains a marked cell may be, with what the game lets through (D73).
TERRAINS = {
    "g": {"kind": "grass", "walk": True},
    "p": {"kind": "path", "walk": True},
    "s": {"kind": "steps", "walk": True},
    ".": {"kind": "floor", "walk": True},
    "f": {"kind": "fence", "walk": False, "sight": True},
    "h": {"kind": "hedge", "walk": False, "sight": False},
    "#": {"kind": "wall", "walk": False, "sight": False},
    "b": {"kind": "bank", "walk": False, "sight": True},
    "t": {"kind": "tree", "walk": False, "sight": False},
    "r": {"kind": "rock", "walk": False, "sight": False},
    "o": {"kind": "stone", "walk": False, "sight": True},
}
TINTS = {
    "g": (80, 200, 80),
    "p": (230, 170, 60),
    "s": (240, 240, 120),
    ".": (120, 170, 240),
    "f": (160, 90, 30),
    "h": (20, 110, 40),
    "#": (220, 40, 40),
    "b": (200, 120, 200),
    "t": (10, 80, 20),
    "r": (130, 130, 140),
    "o": (200, 200, 210),
}


def line_strength(gray: Array, axis: int, reach: int = 4) -> Array:
    """For each column (axis 0) or row (axis 1) of pixels, the share of its
    pixels that are lighter than the pixels `reach` away on both sides."""
    g = gray.astype(np.int16)
    if axis == 1:
        g = g.T
    left = np.roll(g, reach, axis=1)
    right = np.roll(g, -reach, axis=1)
    lighter = (g > left + 6) & (g > right + 6)
    strength = lighter.mean(axis=0)
    strength[:reach] = strength[-reach:] = 0
    return strength


def best_spacing(strength: Array, low: float, high: float) -> tuple[float, float]:
    """The spacing between `low` and `high` pixels, and the offset, of the evenly
    spaced lines that best explain `strength`: the comb that sums the most."""
    size = len(strength)
    best = (0.0, low, 0.0)
    for spacing in np.arange(low, high, 0.25):
        for offset in np.arange(0, spacing, 0.5):
            spots = np.arange(offset, size, spacing).round().astype(int)
            spots = spots[spots < size]
            near = np.maximum.reduce(
                [strength[np.clip(spots + d, 0, size - 1)] for d in (-1, 0, 1)]
            )
            score = near.mean()
            if score > best[0]:
                best = (score, spacing, offset)
    return best[1], best[2]


def find_grid(image: Image.Image, cells: tuple[int, int] = (32, 18)) -> dict:
    """The grid a painting shows: the cell's size in pixels across and down, where
    the first cell begins (a little before the picture's edge, or after it), and
    the number of cells, counting one cut by the far edge when most of it shows.
    Looked for at about the size `cells` asks, from three quarters to one and a
    third of it."""
    gray = np.array(image.convert("L"))
    height, width = gray.shape
    found = {}
    for axis, (total, count) in ((0, (width, cells[0])), (1, (height, cells[1]))):
        guess = total / count
        spacing, offset = best_spacing(line_strength(gray, axis), guess * 0.75, guess * 1.34)
        # The first line found may be the second of the grid: the picture's edge
        # is the first, with a whole cell before it.
        if offset > spacing / 2:
            offset -= spacing
        # A cell cut by the far edge counts when most of it is in the picture.
        whole = int(round((total - offset) / spacing))
        found["x" if axis == 0 else "y"] = {
            "spacing": round(float(spacing), 2),
            "offset": round(float(offset), 2),
            "cells": whole,
        }
    return found


def cell_box(grid: dict, column: int, row: int) -> tuple[int, int, int, int]:
    gx, gy = grid["x"], grid["y"]
    left = gx["offset"] + column * gx["spacing"]
    top = gy["offset"] + row * gy["spacing"]
    return (
        round(left),
        round(top),
        round(left + gx["spacing"]),
        round(top + gy["spacing"]),
    )


def read_marks(path: Path) -> list[str]:
    rows = [line.rstrip("\n") for line in path.read_text(encoding="utf-8").splitlines()]
    rows = [row for row in rows if row and not row.startswith(";")]
    if any(len(row) != len(rows[0]) for row in rows):
        raise ValueError(f"{path}: every row of marks must be as long as the first")
    unknown = sorted({c for row in rows for c in row} - set(TERRAINS))
    if unknown:
        raise ValueError(f"{path}: the marks {''.join(unknown)} are no terrain")
    return rows


def sheet(
    image: Image.Image, grid: dict, width: int = 2400, marks: list[str] | None = None
) -> Image.Image:
    """The painting with its cells outlined and numbered, and tinted by the marks."""
    scale = width / image.width
    shown = image.convert("RGBA").resize((width, round(image.height * scale)), Image.LANCZOS)
    tint = Image.new("RGBA", shown.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(tint)
    for row in range(grid["y"]["cells"]):
        for column in range(grid["x"]["cells"]):
            box = [round(v * scale) for v in cell_box(grid, column, row)]
            if marks and row < len(marks) and column < len(marks[row]):
                draw.rectangle(box, fill=TINTS[marks[row][column]] + (70,))
            draw.rectangle(box, outline=(255, 255, 255, 140))
            draw.text((box[0] + 3, box[1] + 2), f"{column},{row}", fill=(255, 255, 255, 230))
    shown.alpha_composite(tint)
    return shown


def scene_files(marks: list[str], things: list[dict], out: Path) -> list[Path]:
    """map.txt and scene.json from the marks and the things."""
    out.mkdir(parents=True, exist_ok=True)
    used = sorted({c for row in marks for c in row})
    terrains = {letter: TERRAINS[letter] for letter in used if letter not in "#."}
    (out / "map.txt").write_text("\n".join(marks) + "\n", encoding="utf-8")
    (out / "scene.json").write_text(
        json.dumps({"terrains": terrains, "things": things}, indent=2) + "\n", encoding="utf-8"
    )
    return [out / "map.txt", out / "scene.json"]


def main() -> int:
    parser = argparse.ArgumentParser(description="A scene's map from its painting.")
    sub = parser.add_subparsers(dest="command", required=True)
    g = sub.add_parser("grid")
    g.add_argument("painting", type=Path)
    g.add_argument("--cells", default="32x18")
    s = sub.add_parser("sheet")
    s.add_argument("painting", type=Path)
    s.add_argument("out", type=Path)
    s.add_argument("--cells", default="32x18")
    s.add_argument("--marks", type=Path)
    m = sub.add_parser("scene")
    m.add_argument("marks", type=Path)
    m.add_argument("things", type=Path)
    m.add_argument("out", type=Path)
    args = parser.parse_args()
    if args.command == "scene":
        marks = read_marks(args.marks)
        things = json.loads(args.things.read_text(encoding="utf-8"))
        for path in scene_files(marks, things, args.out):
            print(path)
        return 0
    cells = tuple(int(n) for n in args.cells.split("x"))
    image = Image.open(args.painting)
    grid = find_grid(image, cells)
    if args.command == "grid":
        print(json.dumps(grid))
        return 0
    marks = read_marks(args.marks) if args.marks else None
    sheet(image, grid, marks=marks).convert("RGB").save(args.out)
    print(json.dumps(grid))
    return 0


if __name__ == "__main__":
    sys.exit(main())
