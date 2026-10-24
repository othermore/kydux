#!/usr/bin/env python3
"""Cut a generated image into the game's pieces (plan, phase 4; D72).

    tools/art/cut.py <image.png> --out <folder> [--key ff00ff] [--tolerance 90]
        [--grid auto | 4x4] [--size 24] [--names a,b,c...] [--colors 32] [--trim]

A generated sheet is drawn on a flat key colour (magenta unless --key says), in
cells that are only roughly a grid, and in more pixels than the game's: the
image is keyed out (every pixel near the key colour transparent), split into
its cells (by the bands of key colour between them, or an even grid of
COLSxROWS), each cell reduced to --size pixels on a side with true pixels
(each one the cell's most common colour in its square, alpha hard), and all
the pieces put on one palette of --colors colours. --trim crops each cell to
what is drawn in it before reducing, for a sprite that does not fill its cell.

Writes <folder>/<name>.png for each piece (named by --names in reading order,
or piece-1...; with --classify wall or path, by the neighbour mask each piece
shows, whatever order the model drew them in), and <folder>/sheet.png with its
Phaser atlas, sheet.json.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

Array = np.ndarray


def load(path: Path) -> Array:
    """An image as an array of height × width × RGBA, 0 to 255."""
    return np.array(Image.open(path).convert("RGBA"), dtype=np.uint8)


def key_out(image: Array, key: tuple[int, int, int] = (255, 0, 255), tolerance: int = 90) -> Array:
    """The image with every pixel near the key colour made transparent."""
    out = image.copy()
    distance = np.abs(out[..., :3].astype(int) - np.array(key)).sum(axis=2)
    out[distance <= tolerance, 3] = 0
    return out


def _runs(flags: Array) -> list[tuple[int, int]]:
    """The runs of True in a row of flags, as (start, end) with end exclusive."""
    runs, start = [], None
    for index, flag in enumerate(list(flags) + [False]):
        if flag and start is None:
            start = index
        elif not flag and start is not None:
            runs.append((start, index))
            start = None
    return runs


def cells(
    image: Array, grid: tuple[int, int] | None = None, band: float = 0.97
) -> list[tuple[int, int, int, int]]:
    """The cells of a keyed-out sheet, as (left, top, right, bottom), in reading
    order: the stretches between the bands that are almost all transparent, or,
    with `grid` (columns, rows), an even split."""
    height, width = image.shape[:2]
    if grid:
        columns, rows = grid
        xs = [round(width * i / columns) for i in range(columns + 1)]
        ys = [round(height * i / rows) for i in range(rows + 1)]
        return [(xs[c], ys[r], xs[c + 1], ys[r + 1]) for r in range(rows) for c in range(columns)]
    empty = image[..., 3] == 0
    row_spans = _runs(~(empty.mean(axis=1) >= band))
    found = []
    for top, bottom in row_spans:
        strip = empty[top:bottom]
        for left, right in _runs(~(strip.mean(axis=0) >= band)):
            found.append((left, top, right, bottom))
    # A stray speck between bands is not a cell.
    least = max(4, min(width, height) // 64)
    return [c for c in found if c[2] - c[0] >= least and c[3] - c[1] >= least]


def trim(cell: Array) -> Array:
    """The cell cropped to what is drawn in it."""
    drawn = np.argwhere(cell[..., 3] > 0)
    if drawn.size == 0:
        return cell
    (top, left), (bottom, right) = drawn.min(axis=0), drawn.max(axis=0) + 1
    return cell[top:bottom, left:right]


def to_pixels(cell: Array, size: int) -> Array:
    """The cell as `size` × `size` true pixels: each the most common opaque colour
    of its square of the cell, or transparent where most of the square is."""
    height, width = cell.shape[:2]
    out = np.zeros((size, size, 4), dtype=np.uint8)
    for y in range(size):
        for x in range(size):
            top, bottom = y * height // size, max((y + 1) * height // size, y * height // size + 1)
            left, right = x * width // size, max((x + 1) * width // size, x * width // size + 1)
            square = cell[top:bottom, left:right].reshape(-1, 4)
            opaque = square[square[:, 3] > 0]
            if len(opaque) * 2 < len(square):
                continue
            # Colours close to each other count as one: quantize to 32 levels first.
            levels = (opaque[:, :3] // 8).astype(np.int32)
            keys = levels[:, 0] * 1024 + levels[:, 1] * 32 + levels[:, 2]
            values, counts = np.unique(keys, return_counts=True)
            chosen = opaque[keys == values[counts.argmax()]][:, :3].mean(axis=0)
            out[y, x, :3] = chosen.round().astype(np.uint8)
            out[y, x, 3] = 255
    return out


def is_wall(rgb: Array) -> Array:
    """Grey stone: little colour, neither dark nor white."""
    rgb = rgb.astype(int)
    spread = rgb.max(axis=-1) - rgb.min(axis=-1)
    return (spread < 40) & (rgb.mean(axis=-1) > 70)


def is_path(rgb: Array) -> Array:
    """Dirt: red over green over blue, warm and not dark."""
    rgb = rgb.astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (r > g) & (g > b) & (r - b > 40) & (r > 110)


TERRAINS = {"wall": is_wall, "path": is_path}


def mask_of(piece: Array, terrain: str) -> int:
    """Which of the piece's sides its terrain reaches, as the neighbour mask
    (north 1, east 2, south 4, west 8): the terrain covers most of a short band
    at the middle of that side."""
    size = piece.shape[0]
    third, depth = max(1, size // 3), max(1, size // 12)
    middle = slice(third, size - third)
    bands = {
        1: piece[:depth, middle],
        2: piece[middle, size - depth :],
        4: piece[size - depth :, middle],
        8: piece[middle, :depth],
    }
    test = TERRAINS[terrain]
    mask = 0
    for bit, band in bands.items():
        opaque = band[..., 3] > 0
        if opaque.mean() > 0.5 and test(band[..., :3])[opaque].mean() > 0.5:
            mask |= bit
    return mask


def corners_of(piece: Array, terrain: str) -> int:
    """Which of the piece's corners its terrain covers, as a corner set's mask
    (north-west 1, north-east 2, south-west 4, south-east 8)."""
    size = piece.shape[0]
    quarter = max(1, size // 4)
    spots = {
        1: piece[:quarter, :quarter],
        2: piece[:quarter, size - quarter :],
        4: piece[size - quarter :, :quarter],
        8: piece[size - quarter :, size - quarter :],
    }
    test = TERRAINS[terrain]
    return sum(bit for bit, spot in spots.items() if test(spot[..., :3]).mean() > 0.5)


def classified(
    pieces: list[Array], terrain: str, corners: bool = False
) -> tuple[list[Array], list[str]]:
    """The pieces named by the mask each one shows, `<terrain>-<mask>`: the first
    piece with a mask is kept, so that a model's own order does not matter."""
    kept, names = [], []
    for piece in pieces:
        name = (
            f"{terrain}-corner-{corners_of(piece, terrain)}"
            if corners
            else f"{terrain}-{mask_of(piece, terrain)}"
        )
        if name not in names:
            kept.append(piece)
            names.append(name)
    return kept, names


def one_palette(pieces: list[Array], colors: int = 32) -> list[Array]:
    """The pieces on one palette of at most `colors` colours, the transparency kept."""
    if not pieces:
        return []
    widths = [p.shape[1] for p in pieces]
    height = max(p.shape[0] for p in pieces)
    strip = np.zeros((height, sum(widths), 4), dtype=np.uint8)
    x = 0
    for piece in pieces:
        strip[: piece.shape[0], x : x + piece.shape[1]] = piece
        x += piece.shape[1]
    rgb = Image.fromarray(strip[..., :3])
    reduced = np.array(rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert("RGB"))
    out, x = [], 0
    for piece in pieces:
        part = piece.copy()
        part[..., :3] = reduced[: piece.shape[0], x : x + piece.shape[1]]
        out.append(part)
        x += piece.shape[1]
    return out


def sheet(pieces: list[Array], names: list[str], columns: int = 8) -> tuple[Image.Image, dict]:
    """The pieces on one sheet, in rows of `columns`, with its Phaser atlas."""
    size = max(max(p.shape[0], p.shape[1]) for p in pieces)
    rows = -(-len(pieces) // columns)
    canvas = np.zeros((rows * size, min(columns, len(pieces)) * size, 4), dtype=np.uint8)
    frames = {}
    for index, (piece, name) in enumerate(zip(pieces, names, strict=True)):
        x, y = (index % columns) * size, (index // columns) * size
        canvas[y : y + piece.shape[0], x : x + piece.shape[1]] = piece
        frames[name] = {"frame": {"x": x, "y": y, "w": piece.shape[1], "h": piece.shape[0]}}
    atlas = {
        "frames": frames,
        "meta": {"image": "sheet.png", "size": {"w": canvas.shape[1], "h": canvas.shape[0]}},
    }
    return Image.fromarray(canvas), atlas


def cut(
    path: Path,
    out: Path,
    key: tuple[int, int, int] | list[tuple[int, int, int]] = (255, 0, 255),
    tolerance: int = 90,
    grid: tuple[int, int] | None = None,
    size: int = 24,
    names: list[str] | None = None,
    colors: int = 32,
    trimmed: bool = False,
    classify: str | None = None,
    corners: bool = False,
) -> list[Path]:
    """Cut an image into its pieces in `out`, with the sheet and its atlas; with
    `classify` (`wall` or `path`), each piece is named by the mask it shows."""
    image = load(path)
    for one in [key] if isinstance(key, tuple) else key:
        image = key_out(image, one, tolerance)
    boxes = cells(image, grid)
    pieces = []
    for left, top, right, bottom in boxes:
        cell = image[top:bottom, left:right]
        pieces.append(to_pixels(trim(cell) if trimmed else cell, size))
    if classify:
        pieces, names = classified(pieces, classify, corners)
    pieces = one_palette(pieces, colors)
    names = list(names or [])
    names += [f"piece-{i}" for i in range(len(names) + 1, len(pieces) + 1)]
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for piece, name in zip(pieces, names, strict=False):
        target = out / f"{name}.png"
        Image.fromarray(piece).save(target)
        written.append(target)
    if pieces:
        image_sheet, atlas = sheet(pieces, names[: len(pieces)])
        image_sheet.save(out / "sheet.png")
        (out / "sheet.json").write_text(json.dumps(atlas, indent=2), encoding="utf-8")
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Cut a generated image into the game's pieces.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--key", default="ff00ff", help="the background colours, as rrggbb[,rrggbb]"
    )
    parser.add_argument("--tolerance", type=int, default=90)
    parser.add_argument("--grid", default="auto", help="auto, or COLUMNSxROWS")
    parser.add_argument("--size", type=int, default=24)
    parser.add_argument("--names", default="")
    parser.add_argument("--colors", type=int, default=32)
    parser.add_argument("--trim", action="store_true")
    parser.add_argument("--classify", choices=sorted(TERRAINS), help="name each piece by its mask")
    parser.add_argument(
        "--corners", action="store_true", help="with --classify: by its corners, a Wang set"
    )
    args = parser.parse_args()
    keys = [tuple(int(k[i : i + 2], 16) for i in (0, 2, 4)) for k in args.key.split(",")]
    grid = None if args.grid == "auto" else tuple(int(n) for n in args.grid.lower().split("x"))
    names = [n.strip() for n in args.names.split(",") if n.strip()]
    written = cut(
        args.image,
        args.out,
        keys,
        args.tolerance,
        grid,
        args.size,
        names,
        args.colors,
        args.trim,
        args.classify,
        args.corners,
    )
    print(f"{len(written)} pieces in {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
