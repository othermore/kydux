#!/usr/bin/env python3
"""A scene drawn isometric from its square grid, with an open isometric set (D72
trials).

    tools/art/isometric.py <scene> [--level <id>] [--pack art/raw/open/isometric-dungeon-tiles]

The world stays a square grid; only the picture projects it. A tile (x, y) is
drawn as a diamond whose top corner is at ((x - y) * W/2, (x + y) * H/2), W
and H the diamond's width and height: the grid's x runs down and to the right
on the screen, its y down and to the left. Floor tiles are drawn far to near
(by x + y), each with its walls on the edges it shares with a wall tile: the
far edges (north and west) as whole walls, the near edges (south and east) as
half walls, so that a wall never hides the floor in front of it. Shelves are
bookcases; a level's doors and its start come from its level.json. Writes
art/raw/contact-sheet-open-<pack>.png.

The sets are Kenney's: each piece is a 256 by 512 image whose floor diamond,
256 by 148, sits at its bottom; an edge wall is named by where it stands on
the diamond (N its lower left edge, E its upper left, S its upper right, W its
lower right).
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "art" / "raw"
CONTENT = REPO / "content"
#: The diamond of a piece: its width, its height and where its top corner is.
W, H, TOP = 256, 148, 364
#: Which of a piece's walls stands on each of the grid's edges.
EDGE = {"north": "S", "west": "E", "south": "N", "east": "W"}
STEPS = {"north": (0, -1), "west": (-1, 0), "south": (0, 1), "east": (1, 0)}


def screen(x: int, y: int) -> tuple[float, float]:
    """Where tile (x, y)'s diamond has its top corner, before the picture's margin."""
    return (x - y) * W / 2, (x + y) * H / 2


def draw_scene(
    rows: list[str], doors: dict, start, pieces, character, scale: float
) -> Image.Image:
    height, width = len(rows), len(rows[0])

    def walked(x: int, y: int) -> bool:
        return 0 <= y < height and 0 <= x < width and rows[y][x] != "#"

    spots = [(x, y) for y in range(height) for x in range(width) if walked(x, y)]
    xs = [screen(x, y)[0] for x, y in spots]
    ys = [screen(x, y)[1] for x, y in spots]
    left, top = min(xs) - W / 2, min(ys) - TOP
    size = (int(max(xs) + W / 2 - left), int(max(ys) + H - top + 24))
    picture = Image.new("RGBA", size, (30, 28, 34, 255))

    def put(piece: str, x: int, y: int) -> None:
        image = pieces(piece)
        if image is None:
            return
        sx, sy = screen(x, y)
        picture.alpha_composite(image, (int(sx - left - W / 2), int(sy - top - TOP)))

    for x, y in sorted(spots, key=lambda spot: (spot[0] + spot[1], spot[0])):
        put("stone_N", x, y)
        for side in ("north", "west"):
            dx, dy = STEPS[side]
            if not walked(x + dx, y + dy):
                put(f"stoneWall_{EDGE[side]}", x, y)
        if (x, y) in doors:
            # A door across its corridor: on its west edge when the way runs east
            # and west, else on its north edge.
            across = walked(x - 1, y) and walked(x + 1, y)
            put(f"stoneWallGateBars_{EDGE['west' if across else 'north']}", x, y)
        if rows[y][x] == "=":
            put("bookcaseBooks_E", x, y)
        if start == (x, y) and character is not None:
            sx, sy = screen(x, y)
            picture.alpha_composite(character, (int(sx - left - W / 2), int(sy - top - TOP + 10)))
        for side in ("south", "east"):
            dx, dy = STEPS[side]
            if not walked(x + dx, y + dy):
                put(f"stoneWallHalf_{EDGE[side]}", x, y)
    return picture.resize((int(picture.width * scale), int(picture.height * scale)), Image.LANCZOS)


def pieces_of(pack: Path):
    found: dict[str, Image.Image | None] = {}
    folders = [pack / "files" / "Isometric"]
    library = pack.parent / "isometric-library-tiles" / "files" / "Isometric"
    if library.is_dir():
        folders.append(library)

    def piece(name: str) -> Image.Image | None:
        if name not in found:
            path = next(
                (f / f"{name}.png" for f in folders if (f / f"{name}.png").is_file()), None
            )
            found[name] = Image.open(path).convert("RGBA") if path else None
        return found[name]

    return piece


def main() -> int:
    parser = argparse.ArgumentParser(description="A scene drawn isometric from its grid.")
    parser.add_argument("scene")
    parser.add_argument("--level")
    parser.add_argument("--pack", type=Path, default=RAW / "open" / "isometric-dungeon-tiles")
    parser.add_argument("--scale", type=float, default=0.25)
    args = parser.parse_args()
    rows = [r for r in (CONTENT / "scenes" / args.scene / "map.txt").read_text().splitlines() if r]
    doors, start = {}, None
    if args.level:
        level = json.loads((CONTENT / "levels" / args.level / "level.json").read_text())
        start = tuple(level["start"]) if "start" in level else None
        for thing in level.get("things", []):
            if thing.get("kind") == "door":
                # A door stands in a wall tile of the grid; its wall faces the floor.
                doors[tuple(thing["at"])] = thing["id"]
    character_path = args.pack / "files" / "Characters" / "Male" / "Male_3_Idle0.png"
    character = Image.open(character_path).convert("RGBA") if character_path.is_file() else None
    picture = draw_scene(rows, doors, start, pieces_of(args.pack), character, args.scale)
    # Close by: the part round the start at twice the size, as a zoomed camera shows it.
    close = draw_scene(rows, doors, start, pieces_of(args.pack), character, args.scale * 2)
    if start:
        sx, sy = screen(*start)
        spots = [(x, y) for y, row in enumerate(rows) for x, c in enumerate(row) if c != "#"]
        left = min(screen(x, y)[0] for x, y in spots) - W / 2
        top = min(screen(x, y)[1] for x, y in spots) - TOP
        cx, cy = (sx - left) * args.scale * 2, (sy - top + TOP) * args.scale * 2
        half_w, half_h = picture.width // 2, picture.height // 2
        close = close.crop(
            (int(cx - half_w), int(cy - half_h), int(cx + half_w), int(cy + half_h))
        )
    sheet = Image.new(
        "RGBA", (picture.width, picture.height + close.height + 56), (24, 24, 30, 255)
    )
    sheet.alpha_composite(close, (0, picture.height + 56))
    ImageDraw.Draw(sheet).text(
        (6, 6),
        f"{args.pack.name}: {args.scene} drawn isometric from its square grid"
        + (f", {args.level}'s door and start" if args.level else ""),
        fill="white",
    )
    sheet.alpha_composite(picture, (0, 28))
    target = RAW / f"contact-sheet-open-{args.pack.name}.png"
    sheet.save(target)
    print(target.relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
