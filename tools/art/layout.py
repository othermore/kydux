#!/usr/bin/env python3
"""A scene's layout guide, and how well a painting of it keeps to the grid (D72).

    tools/art/layout.py guide <scene> [--pad 16:9]
    tools/art/layout.py check <scene> <painted.png> [--name <candidate>]

`guide` draws content/scenes/<scene>/ (map.txt and scene.json) at 48 pixels a
tile, in flat colours, one per kind of terrain: what is walked on flat, what
stands up (walls, hedges, fences) as a raised block in the 3/4 view, its top
lighter and, where the tile south of it does not stand up, the lower part of
the tile its darker front face; the scene's doors and props on their tiles.
An image model is given the guide to paint the scene over it, keeping every
block where it is. With --pad, the guide is padded with black bands to that
shape (the shapes a model draws in), and `check` crops them off again.
Writes art/raw/layout/<scene>.png.

`stage` cuts a character sheet (figures in a row on magenta: down, left,
right, up) into its figures, made `--height` pixels tall (true pixels, or
smoothly with --smooth for painted art), and stands them on tiles of the
painting, so that their size against the scene is seen. Writes
art/raw/contact-sheet-<name>.png.

`check` lays the tile grid and the tiles that are not walked on over a
painting of the guide, beside the guide and the painting as they are, so that
whether the painting kept to the grid is seen at once. Writes
art/raw/contact-sheet-<name>.png.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "art" / "raw"
SCENES = REPO / "content" / "scenes"
TILE = 48
#: How much of a raised tile its front face takes, from the bottom.
FACE = 20

#: Each kind's colour on the guide: (top or ground, front face).
COLOURS = {
    "grass": ((96, 178, 72), None),
    "path": ((196, 150, 96), None),
    "floor": ((176, 170, 160), None),
    "water": ((70, 130, 200), None),
    "fence": ((150, 100, 56), (100, 64, 34)),
    "hedge": ((46, 120, 52), (26, 78, 32)),
    "wall": ((150, 150, 160), (86, 86, 98)),
    "shelf": ((130, 90, 60), (84, 56, 36)),
}
DOOR = ((60, 60, 70), (34, 34, 40))
STONE = (120, 120, 128)


def read(scene_id: str, scenes: Path = SCENES):
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world.level import read_scene

    return read_scene(scenes, scene_id, scene_id)


def kinds(scene) -> list[list[str]]:
    """Each tile's kind of terrain."""
    return [[scene.terrains[char]["kind"] for char in row] for row in scene.rows]


def raised(kind: str) -> bool:
    return COLOURS.get(kind, ((0, 0, 0), None))[1] is not None


def guide(scene, pad: tuple[int, int] | None = None) -> tuple[Image.Image, int]:
    """The layout guide, and how many pixels of black band it has above the scene."""
    grid = kinds(scene)
    height, width = len(grid), len(grid[0])
    image = Image.new("RGB", (width * TILE, height * TILE))
    draw = ImageDraw.Draw(image)
    for y, row in enumerate(grid):
        for x, kind in enumerate(row):
            top, face = COLOURS.get(kind, ((255, 0, 255), None))
            box = (x * TILE, y * TILE, (x + 1) * TILE - 1, (y + 1) * TILE - 1)
            if kind in ("fence",):
                # A fence is low: the ground under it, a thin rail across it.
                draw.rectangle(box, fill=COLOURS["grass"][0])
                draw.rectangle((box[0], box[1] + 14, box[2], box[1] + 26), fill=top)
                draw.rectangle((box[0], box[1] + 27, box[2], box[1] + 34), fill=face)
                continue
            draw.rectangle(box, fill=top)
            below = grid[y + 1][x] if y + 1 < height else None
            if face is not None and not (below and raised(below)):
                draw.rectangle((box[0], box[3] - FACE + 1, box[2], box[3]), fill=face)
    for thing in scene.things:
        if thing.get("kind") != "door" or "at" not in thing:
            continue
        x, y = thing["at"]
        draw.rectangle((x * TILE, y * TILE, (x + 1) * TILE - 1, (y + 1) * TILE - 1), fill=DOOR[0])
        for bar in range(6, TILE, 9):
            draw.line((x * TILE + bar, y * TILE, x * TILE + bar, (y + 1) * TILE), fill=DOOR[1])
    for prop in scene.props:
        x, y = prop["at"]
        draw.ellipse(
            (x * TILE + 8, y * TILE + 14, (x + 1) * TILE - 8, (y + 1) * TILE - 10), fill=STONE
        )
    band = 0
    if pad:
        wide, high = pad
        target = round(image.width * high / wide)
        if target > image.height:
            band = (target - image.height) // 2
            padded = Image.new("RGB", (image.width, target))
            padded.paste(image, (0, band))
            image = padded
    return image, band


def overlay(scene, painted: Image.Image, band: int) -> Image.Image:
    """The painting at the guide's size, cropped of its bands, with the grid over
    it and every tile not walked on tinted red."""
    grid = kinds(scene)
    height, width = len(grid), len(grid[0])
    full_height = height * TILE + 2 * band
    shown = painted.convert("RGBA").resize((width * TILE, full_height), Image.LANCZOS)
    shown = shown.crop((0, band, width * TILE, band + height * TILE))
    marks = Image.new("RGBA", shown.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(marks)
    for y, row in enumerate(scene.rows):
        for x, char in enumerate(row):
            if not scene.terrains[char]["walk"]:
                draw.rectangle(
                    (x * TILE, y * TILE, (x + 1) * TILE - 1, (y + 1) * TILE - 1),
                    fill=(255, 40, 40, 70),
                )
    for x in range(0, width * TILE + 1, TILE):
        draw.line((x, 0, x, height * TILE), fill=(255, 255, 255, 110))
    for y in range(0, height * TILE + 1, TILE):
        draw.line((0, y, width * TILE, y), fill=(255, 255, 255, 110))
    return Image.alpha_composite(shown, marks)


def check_sheet(scene, painted: Image.Image, band: int, title: str) -> Image.Image:
    plain, _ = guide(scene)
    grid = kinds(scene)
    size = (len(grid[0]) * TILE, len(grid) * TILE)
    full = painted.convert("RGB").resize((size[0], size[1] + 2 * band), Image.LANCZOS)
    painting = full.crop((0, band, size[0], band + size[1]))
    over = overlay(scene, painted, band).convert("RGB")
    sheet = Image.new("RGB", (size[0], size[1] * 3 + 3 * 24), (24, 24, 30))
    draw = ImageDraw.Draw(sheet)
    for index, (label, part) in enumerate(
        (("the guide", plain), ("the painting", painting), ("the grid over it", over))
    ):
        y = index * (size[1] + 24)
        draw.text((6, y + 6), f"{title}: {label}", fill=(240, 240, 250))
        sheet.paste(part, (0, y + 24))
    return sheet


def figures(
    sheet: Image.Image, height: int, smooth: bool, mirror: tuple[str, str] | None = None
) -> dict[str, Image.Image]:
    """A character sheet's four figures by the way each faces, each `height` tall;
    `mirror` (wrong, right) puts in place of a wrong figure the right one flipped,
    and (left, right) swaps the two side views."""
    import numpy as np

    sys.path.insert(0, str(REPO / "tools" / "art"))
    import cut

    keyed = cut.key_out(np.array(sheet.convert("RGBA")), tolerance=140)
    boxes = sorted(cut.cells(keyed), key=lambda box: box[0])[:4]
    found = {}
    for way, (left, top, right, bottom) in zip(
        ("down", "left", "right", "up"), boxes, strict=False
    ):
        cell = cut.trim(keyed[top:bottom, left:right])
        image = Image.fromarray(cell)
        width = max(1, round(image.width * height / image.height))
        # Painted art is smoothed; pixel art keeps hard pixels.
        image = image.resize((width, height), Image.LANCZOS if smooth else Image.NEAREST)
        found[way] = image
    if mirror == ("left", "right"):
        # The two side views drawn the wrong way round.
        found["left"], found["right"] = found["right"], found["left"]
    elif mirror and mirror[1] in found:
        found[mirror[0]] = found[mirror[1]].transpose(Image.FLIP_LEFT_RIGHT)
    return found


def stage_sheet(
    scene, painted: Image.Image, band: int, people: dict[str, Image.Image], title: str
) -> Image.Image:
    """The figures in a row, and stood on the painting near the gate."""
    grid = kinds(scene)
    size = (len(grid[0]) * TILE, len(grid) * TILE)
    full = painted.convert("RGBA").resize((size[0], size[1] + 2 * band), Image.LANCZOS)
    scene_image = full.crop((0, band, size[0], band + size[1]))
    # The garden's gate end: tiles 3 to 17 across, 2 to 11 down.
    view = scene_image.crop((3 * TILE, 2 * TILE, 17 * TILE, 11 * TILE))
    spots = {"down": (8, 4), "left": (10, 4), "right": (6, 6), "up": (9, 7)}
    for way, figure in people.items():
        tx, ty = spots[way]
        x = tx * TILE + (TILE - figure.width) // 2
        y = (ty + 1) * TILE - figure.height - 4
        view.alpha_composite(figure, (x, y))
    row_height = max(f.height for f in people.values()) + 16
    sheet = Image.new("RGBA", (view.width, view.height + row_height + 48), (24, 24, 30, 255))
    draw = ImageDraw.Draw(sheet)
    draw.text((6, 6), f"{title}: the figures, and on the scene at {TILE} px a tile", fill="white")
    x = 8
    for figure in people.values():
        sheet.alpha_composite(figure, (x, 24))
        x += figure.width + 16
    sheet.alpha_composite(view, (0, 24 + row_height))
    return sheet


def _shape(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    wide, high = value.split(":")
    return int(wide), int(high)


def main() -> int:
    parser = argparse.ArgumentParser(description="A scene's layout guide, and its check.")
    sub = parser.add_subparsers(dest="command", required=True)
    make = sub.add_parser("guide")
    make.add_argument("scene")
    make.add_argument("--pad", help="pad to a shape, like 16:9")
    look = sub.add_parser("check")
    look.add_argument("scene")
    look.add_argument("painted", type=Path)
    look.add_argument("--pad", help="the shape the guide was padded to, like 16:9")
    look.add_argument("--name", default="layout")
    put = sub.add_parser("stage")
    put.add_argument("scene")
    put.add_argument("painted", type=Path)
    put.add_argument("sheet", type=Path)
    put.add_argument("--pad", help="the shape the guide was padded to, like 16:9")
    put.add_argument("--height", type=int, default=64)
    put.add_argument("--smooth", action="store_true")
    put.add_argument("--mirror", help="wrong:right, a figure to replace by another flipped")
    put.add_argument("--name", default="figures")
    args = parser.parse_args()
    scene = read(args.scene)
    if args.command == "guide":
        image, _ = guide(scene, _shape(args.pad))
        target = RAW / "layout" / f"{args.scene}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target)
    elif args.command == "stage":
        _, band = guide(scene, _shape(args.pad))
        mirror = tuple(args.mirror.split(":")) if args.mirror else None
        people = figures(Image.open(args.sheet), args.height, args.smooth, mirror)
        sheet = stage_sheet(scene, Image.open(args.painted), band, people, args.name)
        target = RAW / f"contact-sheet-{args.name}.png"
        sheet.save(target)
    else:
        _, band = guide(scene, _shape(args.pad))
        sheet = check_sheet(scene, Image.open(args.painted), band, args.name)
        target = RAW / f"contact-sheet-{args.name}.png"
        sheet.save(target)
    print(target.relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
