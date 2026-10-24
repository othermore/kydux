#!/usr/bin/env python3
"""A candidate's contact sheet (D72): a small test scene drawn with its pieces,
at the game's 48 pixels a tile, and under it every piece it has.

    tools/art/contact.py <candidate> [--pieces art/raw/<candidate>/pieces]

The pieces are named as tools/art/draw.py names them: `grass`, `wall-M` and
`path-M` for M the mask of the tile's neighbours of the same terrain (north 1,
east 2, south 4, west 8), `door-closed`, `door-open`, `wizard-<way>-<frame>`.
The test scene holds a wall's every join (ends, corners, a T, a cross), a
path's turns, a door and the wizard; a set that joins by its corners instead
(`<terrain>-corner-M`, Wang tiles, M the corners of the upper terrain:
north-west 1, north-east 2, south-west 4, south-east 8) is drawn as a region
beside it; a piece the candidate lacks shows as a
magenta square with its name, so that what is missing is seen at once.
Writes art/raw/contact-sheet-<candidate>.png. With --frames, the sheet is
the candidate's whole pictures instead (style frames, mock-ups), two to a row.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "art" / "raw"
SCALE = 2

#: The test scene: # wall, D door (in a wall), p path, g grass, W the wizard on the path.
SCENE = [
    "gggggggggggg",
    "g####gg#ggpg",
    "g#gg#gg#ggpg",
    "g#gg##D###pg",
    "g#ggggg#gppg",
    "g###g#g#gpgg",
    "ggg#g#gggpgg",
    "gg###ggppWpg",
    "ggg#gggpgggg",
    "gggggggpgggg",
]
NEIGHBOURS = ((0, -1, 1), (1, 0, 2), (0, 1, 4), (-1, 0, 8))


def mask_at(rows: list[str], x: int, y: int, same: str) -> int:
    mask = 0
    for dx, dy, bit in NEIGHBOURS:
        nx, ny = x + dx, y + dy
        if 0 <= ny < len(rows) and 0 <= nx < len(rows[0]) and rows[ny][nx] in same:
            mask |= bit
    return mask


def _missing(name: str, size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, (255, 0, 255, 255))
    ImageDraw.Draw(image).text((2, 2), name[:8], fill=(0, 0, 0, 255))
    return image


def load_pieces(folder: Path) -> dict[str, Image.Image]:
    return {
        path.stem: Image.open(path).convert("RGBA")
        for path in sorted(folder.glob("*.png"))
        if path.stem != "sheet"
    }


def scene_image(pieces: dict[str, Image.Image], tile: int) -> Image.Image:
    rows = SCENE
    image = Image.new("RGBA", (len(rows[0]) * tile, len(rows) * tile), (40, 40, 48, 255))

    def piece(name: str) -> Image.Image:
        found = pieces.get(name)
        return found if found is not None else _missing(name, (tile, tile))

    wizard_at = None
    for y, row in enumerate(rows):
        for x, char in enumerate(row):
            spot = (x * tile, y * tile)
            image.alpha_composite(piece("grass").resize((tile, tile), Image.NEAREST), spot)
            if char in "pW":
                name = f"path-{mask_at(rows, x, y, 'pW')}"
                image.alpha_composite(piece(name).resize((tile, tile), Image.NEAREST), spot)
            elif char == "#":
                name = f"wall-{mask_at(rows, x, y, '#D')}"
                image.alpha_composite(piece(name).resize((tile, tile), Image.NEAREST), spot)
            elif char == "D":
                image.alpha_composite(
                    piece("door-closed").resize((tile, tile), Image.NEAREST), spot
                )
            if char == "W":
                wizard_at = (x, y)
    if wizard_at:
        sprite = piece("wizard-down-0")
        w, h = sprite.width * SCALE, sprite.height * SCALE
        sprite = sprite.resize((w, h), Image.NEAREST)
        x, y = wizard_at
        image.alpha_composite(sprite, (x * tile + (tile - w) // 2, (y + 1) * tile - h))
    return image


#: A region of one terrain over another, for a set that joins by its corners
#: (Wang tiles: each piece says which of its four corners are the upper terrain).
REGION = [
    "000000000000",
    "011110000110",
    "011110001110",
    "011111111100",
    "000011111100",
    "000011001100",
    "011111001110",
    "011100000110",
    "000000000000",
]


def corner_scene(pieces: dict[str, Image.Image], prefix: str, tile: int) -> Image.Image:
    """The region drawn with a corner set on the dual grid: the piece for each tile
    is chosen by the four cells meeting at it (north-west 1, north-east 2,
    south-west 4, south-east 8)."""
    rows = REGION
    width, height = len(rows[0]) - 1, len(rows) - 1
    image = Image.new("RGBA", (width * tile, height * tile), (40, 40, 48, 255))
    for y in range(height):
        for x in range(width):
            mask = (
                (rows[y][x] == "1") * 1
                + (rows[y][x + 1] == "1") * 2
                + (rows[y + 1][x] == "1") * 4
                + (rows[y + 1][x + 1] == "1") * 8
            )
            name = f"{prefix}-{mask}"
            found = pieces.get(name)
            shown = (
                found.resize((tile, tile), Image.NEAREST)
                if found
                else _missing(name, (tile, tile))
            )
            image.alpha_composite(shown, (x * tile, y * tile))
    return image


def gallery(pieces: dict[str, Image.Image], width: int) -> Image.Image:
    cell = 48 * SCALE // 2 + 16
    columns = max(1, width // (cell + 8))
    rows = -(-len(pieces) // columns) or 1
    image = Image.new("RGBA", (width, rows * (cell + 14)), (24, 24, 30, 255))
    draw = ImageDraw.Draw(image)
    for index, (name, picture) in enumerate(pieces.items()):
        x, y = (index % columns) * (cell + 8), (index // columns) * (cell + 14)
        scale = max(1, min(cell // max(picture.width, 1), cell // max(picture.height, 1)))
        shown = picture.resize((picture.width * scale, picture.height * scale), Image.NEAREST)
        image.alpha_composite(shown, (x, y))
        draw.text((x, y + cell), name[:14], fill=(220, 220, 230, 255))
    return image


def contact(candidate: str, folder: Path) -> Path:
    pieces = load_pieces(folder)
    tile = 24 * SCALE
    scene = scene_image(pieces, tile)
    # Each corner set the candidate has, as a region beside the test scene.
    prefixes = sorted({name.rsplit("-", 1)[0] for name in pieces if "-corner-" in name})
    for prefix in prefixes:
        region = corner_scene(pieces, prefix, tile)
        both = Image.new(
            "RGBA",
            (scene.width + region.width + 8, max(scene.height, region.height)),
            (24, 24, 30, 255),
        )
        both.alpha_composite(scene, (0, 0))
        both.alpha_composite(region, (scene.width + 8, 0))
        scene = both
    shelf = gallery(pieces, scene.width * 2)
    width = max(scene.width, shelf.width)
    sheet = Image.new("RGBA", (width, scene.height + shelf.height + 30), (24, 24, 30, 255))
    ImageDraw.Draw(sheet).text(
        (4, 4), f"{candidate}: {len(pieces)} pieces", fill=(240, 240, 250, 255)
    )
    sheet.alpha_composite(scene, (0, 24))
    sheet.alpha_composite(shelf, (0, 30 + scene.height))
    target = RAW / f"contact-sheet-{candidate}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(target)
    return target


def frames(candidate: str, folder: Path, width: int = 960) -> Path:
    """Whole pictures, like style frames, two to a row at `width` each, named."""
    pictures = sorted(p for p in folder.glob("*.png"))
    shown = [Image.open(p).convert("RGBA") for p in pictures]
    shown = [im.resize((width, round(im.height * width / im.width))) for im in shown]
    row = max((im.height for im in shown), default=0) + 20
    sheet = Image.new("RGBA", (2 * width + 8, 24 + row * (-(-len(shown) // 2))), (24, 24, 30, 255))
    draw = ImageDraw.Draw(sheet)
    draw.text((4, 4), f"{candidate}: {len(shown)} pictures", fill=(240, 240, 250, 255))
    for index, (path, image) in enumerate(zip(pictures, shown, strict=True)):
        x, y = (index % 2) * (width + 8), 24 + (index // 2) * row
        draw.text((x, y), path.stem, fill=(220, 220, 230, 255))
        sheet.alpha_composite(image, (x, y + 16))
    target = RAW / f"contact-sheet-{candidate}.png"
    sheet.save(target)
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description="A candidate's contact sheet.")
    parser.add_argument("candidate")
    parser.add_argument("--pieces", type=Path)
    parser.add_argument(
        "--frames", action="store_true", help="whole pictures, not pieces: art/raw/<candidate>/"
    )
    args = parser.parse_args()
    if args.frames:
        print(frames(args.candidate, args.pieces or RAW / args.candidate).relative_to(REPO))
        return 0
    folder = args.pieces or RAW / args.candidate / "pieces"
    print(contact(args.candidate, folder).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
