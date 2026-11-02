#!/usr/bin/env python3
"""A scene's layout on its grid, drawn before the scene is painted (D102).

    tools/art/layout.py <scene> [--cell <pixels>]
    tools/art/layout.py <scene> --over <try.png>

The map comes first: content/scenes/<scene>/map.txt and its scene.json say which
cells are walls, which are furniture (a terrain not walked on that sight
crosses), which are floor, and where the doors are. The layout draws them on
the grid, every cell numbered: walls dark, furniture hatched, the floor light,
a door's cell marked. It is the first picture of the painting's prompt, written
to art/raw/<scene>/layout.png, CELL pixels a cell unless `--cell` says.

`--over <try.png>` lays the same grid and the same marks, half seen, over a
model's try, scaled to it, and writes <try>-layout.png beside it: a try is
chosen only when its walls, doorways and furniture lie in the layout's cells.
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
CONTENT = REPO / "content" / "scenes"
RAW = REPO / "art" / "raw"
#: A cell's size in the layout, in pixels, unless the scene's painting says.
CELL = 96
WALL = (52, 46, 58)
FLOOR = (236, 226, 204)
FURNITURE = (176, 128, 84)
DOOR = (226, 88, 64)
LINE = (90, 90, 110)
NUMBER = (40, 40, 60)


def read(scene: str) -> tuple[list[str], dict, list[tuple[int, int]]]:
    """The scene's map rows, its terrains, and its doors' cells."""
    folder = CONTENT / scene
    rows = [row for row in (folder / "map.txt").read_text(encoding="utf-8").split("\n") if row]
    # A scene's scene.json is there when it has terrains or things of its own (D73).
    found = folder / "scene.json"
    settings = json.loads(found.read_text(encoding="utf-8")) if found.is_file() else {}
    doors = [
        tuple(thing["at"])
        for thing in settings.get("things", [])
        if thing.get("kind") == "door" and "at" in thing
    ]
    return rows, settings.get("terrains", {}), doors


def kind_of(letter: str, terrains: dict) -> str:
    """What a map letter is drawn as: wall, furniture or floor."""
    if letter == "#":
        return "wall"
    terrain = terrains.get(letter)
    if terrain is None:
        return "floor"
    if terrain.get("walk"):
        return "floor"
    return "furniture" if terrain.get("sight") else "wall"


def draw(
    rows: list[str],
    terrains: dict,
    doors: list[tuple[int, int]],
    size: tuple[int, int],
    alpha: int = 255,
) -> Image.Image:
    """The layout over a picture of `size`, its cells fitted to it: each cell's kind,
    the doors, the grid and the numbers; `alpha` how much the marks are seen."""
    columns, height = len(rows[0]), len(rows)
    width_px, height_px = size
    cw, ch = width_px / columns, height_px / height
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    pen = ImageDraw.Draw(out)
    for y, row in enumerate(rows):
        for x, letter in enumerate(row):
            box = (round(x * cw), round(y * ch), round((x + 1) * cw) - 1, round((y + 1) * ch) - 1)
            kind = kind_of(letter, terrains)
            if kind == "wall":
                pen.rectangle(box, fill=(*WALL, alpha))
            elif kind == "furniture":
                pen.rectangle(box, fill=(*FURNITURE, alpha))
                step = max(4, round(cw / 6))
                x0, y0, x1, y1 = box
                # Lines at 45 degrees, each cut to the cell.
                for offset in range(-(y1 - y0), x1 - x0, step):
                    start = (x0 + max(0, offset), y0 + max(0, -offset))
                    run = min(x1 - start[0], y1 - start[1])
                    pen.line(
                        (*start, start[0] + run, start[1] + run),
                        fill=(*WALL, alpha),
                        width=max(1, round(cw / 48)),
                    )
            else:
                pen.rectangle(box, fill=(*FLOOR, alpha // 3 if alpha < 255 else alpha))
            if (x, y) in doors:
                inset = round(cw / 6)
                pen.rectangle(
                    (box[0] + inset, box[1] + inset, box[2] - inset, box[3] - inset),
                    outline=(*DOOR, 255),
                    width=max(2, round(cw / 16)),
                )
    for x in range(columns + 1):
        pen.line((round(x * cw), 0, round(x * cw), height_px), fill=(*LINE, 255), width=1)
    for y in range(height + 1):
        pen.line((0, round(y * ch), width_px, round(y * ch)), fill=(*LINE, 255), width=1)
    for y in range(height):
        for x in range(columns):
            pen.text((round(x * cw) + 3, round(y * ch) + 2), f"{x},{y}", fill=(*NUMBER, 255))
    return out


def layout(scene: str, cell: int = CELL) -> Path:
    rows, terrains, doors = read(scene)
    size = (len(rows[0]) * cell, len(rows) * cell)
    target = RAW / scene / "layout.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    background = Image.new("RGBA", size, (*FLOOR, 255))
    background.alpha_composite(draw(rows, terrains, doors, size))
    background.convert("RGB").save(target)
    return target


def over(scene: str, picture: Path) -> Path:
    rows, terrains, doors = read(scene)
    shown = Image.open(picture).convert("RGBA")
    shown.alpha_composite(draw(rows, terrains, doors, shown.size, alpha=110))
    target = picture.with_name(f"{picture.stem}-layout.png")
    shown.convert("RGB").save(target)
    return target


def main(arguments: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("scene")
    parser.add_argument("--cell", type=int, default=CELL)
    parser.add_argument("--over", type=Path)
    found = parser.parse_args(arguments)
    target = over(found.scene, found.over) if found.over else layout(found.scene, found.cell)
    print(target.relative_to(REPO) if target.is_relative_to(REPO) else target)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
