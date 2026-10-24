#!/usr/bin/env python3
"""Chapter 1's garden at the gate, built from an open tileset (D72 trials).

    tools/art/open_scene.py <pack> [--scene the-gate]

<pack> is one of RECIPES: which piece of the pack's sheets stands for each kind
of terrain of content/scenes/<scene>/, its doors, its stone and a child. The
garden is drawn at the pack's own tile size and shown at whole multiples of it
beside our 48 pixels a tile; what the pack lacks is drawn as a magenta square,
so that what would have to be drawn is seen at once. A wall in the 3/4 view
shows its front face where the tile south of it is not wall, and its top
elsewhere. A dirt path that a pack gives as an RPG Maker autotile (the VX Ace
A2 block or the XP 96 by 128 sheet) is joined by its quarters, from the
neighbours of each tile. Writes art/raw/contact-sheet-open-<pack>.png.

The packs' files are under art/raw/open/<pack>/, each with its SOURCE.md.
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "art" / "raw"
OPEN = RAW / "open"
CONTENT = REPO / "content"

TOWN = "16x16-town-remix"
LPC = "lpc-modified-base-tiles/files"
OUT = "outdoors-tileset/files/RPG Maker XP TileSet"

#: For each pack: its tile size, and for each part the sheet and the tile (in
#: tiles, or `auto` with the block's corner in pixels and its format); None for
#: what the pack lacks.
RECIPES = {
    "16x16-town-remix": {
        "tile": 16,
        "grass": (f"{TOWN}/16oga.png", (0, 1)),
        "path": (f"{TOWN}/16oga.png", (1, 1)),
        "floor": (f"{TOWN}/town_tiles.png", (7, 0)),
        "wall_top": (f"{TOWN}/16oga.png", (5, 1)),
        "wall_face": (f"{TOWN}/16oga.png", (5, 2)),
        "fence": (f"{TOWN}/16oga.png", (3, 4)),
        "hedge": (f"{TOWN}/town_tiles.png", (8, 1)),
        "gate": (f"{TOWN}/town_tiles.png", (1, 0)),
        "door": (f"{TOWN}/town_tiles.png", (2, 0)),
        "stone": None,
        "child": None,
    },
    "lpc-modified-base-tiles": {
        "tile": 32,
        "grass": (f"{LPC}/Tilesets/Outside_A2.png", (0, 0)),
        "path": (f"{LPC}/Tilesets/Outside_A2.png", ("auto", (64, 0), "vxace")),
        "floor": (f"{LPC}/Tilesets/Outside_A2.png", (0, 3)),
        "wall_top": (f"{LPC}/Tilesets/Outside_A3.png", (0, 0)),
        "wall_face": (f"{LPC}/Tilesets/Outside_A3.png", (0, 3)),
        "fence": (f"{LPC}/Tilesets/Outside_B.png", (9, 6)),
        "hedge": None,
        # The iron lattice, two tiles tall, standing on the gate's tile.
        "gate": (f"{LPC}/Tilesets/Outside_B.png", (7, 0), (1, 2)),
        "door": (f"{LPC}/Tilesets/Outside_B.png", (6, 2), (1, 2)),
        "stone": (f"{LPC}/Tilesets/Outside_B.png", (14, 9)),
        "child": (f"{LPC}/Characters/$princess.png", (1, 0), (1, 2)),
    },
    "outdoors-tileset": {
        "tile": 32,
        "grass": (f"{OUT}/Outdoors Tileset.png", (0, 0)),
        "path": (f"{OUT}/Outdoors AutoTile Sand.png", ("auto", (0, 0), "xp")),
        "floor": (f"{OUT}/Outdoors Tileset.png", (1, 0)),
        "wall_top": (f"{OUT}/Outdoors Tileset.png", (6, 6)),
        "wall_face": (f"{OUT}/Outdoors Tileset.png", (0, 5)),
        "fence": None,
        "hedge": None,
        "gate": None,
        "door": (f"{OUT}/Animated Door.png", (0, 0), (1, 2)),
        "stone": None,
        "child": None,
    },
}


class Pack:
    def __init__(self, recipe: dict):
        self.recipe = recipe
        self.tile = recipe["tile"]
        self.sheets: dict[str, Image.Image] = {}

    def sheet(self, path: str) -> Image.Image:
        if path not in self.sheets:
            self.sheets[path] = Image.open(OPEN / path).convert("RGBA")
        return self.sheets[path]

    def has(self, part: str) -> bool:
        return self.recipe.get(part) is not None

    def piece(self, part: str) -> Image.Image:
        """A part as it stands on its tile: one tile, or taller for a gate or a child."""
        spec = self.recipe.get(part)
        t = self.tile
        if spec is None:
            missing = Image.new("RGBA", (t, t), (255, 0, 255, 255))
            ImageDraw.Draw(missing).text((1, 1), part[:3], fill="black")
            return missing
        path, (tx, ty), *rest = spec
        w, h = rest[0] if rest else (1, 1)
        return self.sheet(path).crop((tx * t, ty * t, (tx + w) * t, (ty + h) * t))

    def joined(self, part: str, same) -> Image.Image:
        """A tile of an autotile, from which of its neighbours are of it: `same(dx, dy)`."""
        path, (_, (bx, by), form) = self.recipe[part]
        sheet, t = self.sheet(path), self.tile
        q = t // 2
        out = Image.new("RGBA", (t, t))
        # The block of edges and corners below the first row, and the inner corners.
        region = (bx, by + t)
        inner = (bx + t, by) if form == "vxace" else (bx + 2 * t, by)
        last = 3 if form == "vxace" else 5
        for qx in (0, 1):
            for qy in (0, 1):
                h = same(-1 if qx == 0 else 1, 0)
                v = same(0, -1 if qy == 0 else 1)
                d = same(-1 if qx == 0 else 1, -1 if qy == 0 else 1)
                if h and v and not d:
                    sx, sy = inner[0] + qx * q, inner[1] + qy * q
                else:
                    cx = (2 if h else 0) if qx == 0 else (last - 2 if h else last)
                    cy = (2 if v else 0) if qy == 0 else (last - 2 if v else last)
                    sx, sy = region[0] + cx * q, region[1] + cy * q
                out.alpha_composite(sheet.crop((sx, sy, sx + q, sy + q)), (qx * q, qy * q))
        return out


def build(pack: Pack, scene_id: str) -> Image.Image:
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world.level import read_scene

    scene = read_scene(CONTENT / "scenes", scene_id, scene_id)
    kinds = [[scene.terrains[c]["kind"] for c in row] for row in scene.rows]
    height, width, t = len(kinds), len(kinds[0]), pack.tile
    image = Image.new("RGBA", (width * t, height * t), (30, 30, 36, 255))

    def kind(x: int, y: int) -> str | None:
        return kinds[y][x] if 0 <= y < height and 0 <= x < width else None

    tall = []
    for y in range(height):
        for x in range(width):
            here, spot = kind(x, y), (x * t, y * t)
            if here in ("grass", "fence", "hedge"):
                image.alpha_composite(pack.piece("grass"), spot)
            if here == "path":
                spec = pack.recipe["path"]
                if isinstance(spec[1][0], str):
                    image.alpha_composite(pack.piece("grass"), spot)
                    piece = pack.joined(
                        "path", lambda dx, dy, x=x, y=y: kind(x + dx, y + dy) == "path"
                    )
                else:
                    piece = pack.piece("path")
                image.alpha_composite(piece, spot)
            elif here == "floor":
                image.alpha_composite(pack.piece("floor"), spot)
            elif here == "wall":
                face = kind(x, y + 1) not in ("wall", None)
                image.alpha_composite(pack.piece("wall_face" if face else "wall_top"), spot)
            elif here in ("fence", "hedge"):
                image.alpha_composite(pack.piece(here), spot)
    for thing in scene.things:
        if thing.get("kind") != "door":
            continue
        x, y = thing["at"]
        part = "gate" if thing["id"] in ("gate", "inner_gate") else "door"
        image.alpha_composite(pack.piece("floor"), (x * t, y * t))
        tall.append((part, x, y))
    for prop in scene.props:
        tall.append(("stone", *prop["at"]))
    # The child on the gate level's start, and the friend beside it.
    level = json.loads((CONTENT / "levels" / "the-gate" / "level.json").read_text())
    tall.append(("child", *level["start"]))
    for part, x, y in sorted(tall, key=lambda item: item[2]):
        piece = pack.piece(part)
        image.alpha_composite(piece, (x * t, (y + 1) * t - piece.height))
    return image


def contact(name: str, scene_id: str) -> Path:
    pack = Pack(RECIPES[name])
    garden = build(pack, scene_id)
    scale = max(1, 48 // pack.tile)
    shown = garden.resize((garden.width * scale, garden.height * scale), Image.NEAREST)
    missing = [part for part in RECIPES[name] if part != "tile" and not pack.has(part)]
    note = f"{name}: {pack.tile} px tiles, shown x{scale} ({pack.tile * scale} px a tile)"
    if 48 % pack.tile:
        note += f"; our 48 px grid is x{48 / pack.tile:g}, not a whole multiple"
    note += f"; missing (magenta): {', '.join(missing) or 'nothing'}"
    sheet = Image.new("RGBA", (shown.width, shown.height + 28), (24, 24, 30, 255))
    ImageDraw.Draw(sheet).text((6, 6), note, fill="white")
    sheet.alpha_composite(shown, (0, 28))
    target = RAW / f"contact-sheet-open-{name}.png"
    sheet.save(target)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="Chapter 1's garden from an open tileset.")
    parser.add_argument("pack", choices=sorted(RECIPES))
    parser.add_argument("--scene", default="the-gate")
    args = parser.parse_args()
    print(contact(args.pack, args.scene).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
