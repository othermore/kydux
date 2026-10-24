#!/usr/bin/env python3
"""A scene painted first (the owner's choice, 2026-10-23), made ready for the
art demo: the painting cut into the ground and the things that stand up, by
difference matting.

    tools/art/image_first.py [<source folder> <out folder>]

From art/raw/image-first/, or the source folder given: the painting without
its grid (an edit of the gridded one Gemini drew first), the same picture
with only the ground left (a second and third edit: no trees, bushes, rocks,
fences, walls or gates), the grid found in the gridded painting (grid.json,
map_from_image.py) and the cells marked by hand (marks.txt). Writes
art/raw/demo/field/, or the out folder given:

- ground.png: the painting itself, with the ground alone under what opens or
  is picked up (a gate's leaf and the shadow of its bars, a sealed door, the
  wand), so that a shadow lies under a figure, never over it, and nothing is
  missing where a cut-out falls short;
- baked.png: the gridded painting, for comparing the grid Gemini drew;
- one layer for each row of cells, layer-<row>.png: the pixels of what stands
  up, cut out with transparency, whose foot is on that row;
- gate.png, seal.png, wand.png: the school's gate, the sealed gate and the wand,
  each cut out apart, for the page to take away when it opens or is picked up;
- field.json: where each layer goes and on which row it stands.

A source folder may hold cut.json, which names its pictures (`gridded`,
`nogrid`, `ground`), the boxes of the gate, the seal and the wand in cells
(`boxes`), the rows where the walls' tops begin (`cuts`), the row above which
the castle is left as ground (`castle`), the castle door's box (`door`), the
things whose leaves are cut (`leaves`, all of them unless it says), and
anything else for the page (`page`: the levels it plays, where the seal glows,
where the wand lies); without it, the first painting's are taken.

The cut-out is the difference between the painting and its ground. A pixel
that differs strongly belongs to a thing, and stands on the row of the first
cell that no one walks on at or below it, within three rows, in its column or
the next: a tree's leaves hang over the cells behind its trunk, and are drawn
with the trunk's row, so that a figure walking behind them is hidden. Over a
wall, only a crown's leaves are its tree's; the stones stand on the wall's
row. A crown is whole: what its dark outline closes in, its sunlit leaves
coloured as the grass, is of it. What is drawn in front of a cell walked on,
or of the cell above one, where a figure's hat is, hangs from its foot (held):
a shadow, a flower or a tuft on the lawn, with lawn between it and the row it
was given, goes back into the ground, as does a shadow on a cell walked on
beside a thing's foot. Everything is aligned on the grid, TILE pixels a cell.
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SOURCE = REPO / "art" / "raw" / "image-first"
OUT = REPO / "art" / "raw" / "demo" / "field"
TILE = 64
#: Worked at twice the page's size, then brought down, for soft edges.
WORK = 2
#: What no one walks on and stands up: trees and bushes, rocks, fences, walls, a flat
#: stone, bookcases and furniture.
STANDING = set("trf#oku")
#: The things the page changes, each by its box in cells: (x0, y0, x1, y1).
BOXES = {
    "gate": (7.18, 16.2, 9.82, 19.55),
    "seal": (8.02, 10.8, 9.12, 12.2),
    "wand": (12.0, 13.6, 14.0, 14.9),
}


def aligned(image: Image.Image, grid: dict, columns: int, rows: int, tile: int) -> Image.Image:
    """The painting moved and scaled so that its cells are `tile` pixels, the
    first cell at the top-left corner."""
    gx, gy = grid["x"], grid["y"]
    sx, sy = gx["spacing"] / tile, gy["spacing"] / tile
    return image.convert("RGB").transform(
        (columns * tile, rows * tile),
        Image.AFFINE,
        (sx, 0, gx["offset"], 0, sy, gy["offset"]),
        resample=Image.BICUBIC,
    )


def difference(painting: np.ndarray, ground: np.ndarray, threshold: float = 70) -> np.ndarray:
    """Where the painting differs from its ground: each pixel's distance in colour,
    smoothed, over a threshold; closed, to fill the small gaps inside a thing,
    then opened, to drop the specks."""
    d = np.abs(painting.astype(np.int16) - ground.astype(np.int16)).sum(axis=2)
    d = np.array(
        Image.fromarray(np.clip(d / 3, 0, 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(1.5)
        )
    )
    # Tripled as integers: in its own bytes the strongest differences would wrap round.
    mask = Image.fromarray(((d.astype(np.int16) * 3) > threshold).astype(np.uint8) * 255)
    mask = mask.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    return np.array(mask) > 127


def box_mask(
    shape: tuple[int, int], box: tuple[float, float, float, float], tile: int
) -> np.ndarray:
    x0, y0, x1, y1 = (round(v * tile) for v in box)
    inside = np.zeros(shape, dtype=bool)
    inside[y0:y1, x0:x1] = True
    return inside


def rgba(image: np.ndarray, alpha: np.ndarray) -> Image.Image:
    """The image with this alpha, brought down to the page's size."""
    out = np.dstack([image, (alpha * 255).astype(np.uint8)])
    big = Image.fromarray(out, "RGBA")
    return big.resize((big.width // WORK, big.height // WORK), Image.LANCZOS)


#: The page's cells at this many pixels, to find the things that hold together.
SMALL = 32
#: Where the walls' tops begin, in rows: a thing never holds together across them.
CUTS = (10.55, 16.6)
#: The first painting's settings; another painting's are in its folder's cut.json.
DEFAULTS = {
    "gridded": "image-first-field.png",
    "nogrid": "image-first-field-nogrid.png",
    "ground": "image-first-field-ground-2.png",
    "boxes": BOXES,
    "cuts": CUTS,
    "castle": 6.75,
    "door": [7.62, 4.12, 9.44, 6.62],
    "page": {},
}


def green(image: np.ndarray) -> np.ndarray:
    """The pixels coloured as leaves are, a crown's dark ones and its sunlit ones: any
    green of some colour, never a wall's grey stone."""
    hsv = np.array(Image.fromarray(image).convert("HSV")).astype(np.float32)
    h, sat = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255
    return (h > 45) & (h < 140) & (sat > 0.25)


def groundlike(image: np.ndarray) -> np.ndarray:
    """The pixels coloured as the ground is: lit grass, a light yellow-green, and
    the dirt path's tan. A thing's own colours are darker greens, greys, browns
    and its dark outline; its sunlit leaves may look like grass, but lie inside
    the outline, and are filled in as a hole."""
    hsv = np.array(Image.fromarray(image).convert("HSV")).astype(np.float32)
    h, sat, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    grass = (h > 50) & (h < 105) & (sat > 0.35) & (v > 0.5)
    path = (h > 18) & (h < 48) & (sat > 0.33) & (sat < 0.75) & (v > 0.6)
    return grass | path


def labels(mask: np.ndarray) -> np.ndarray:
    """Each group of mask pixels that touch, by its number (0 where none): every
    pixel takes the smallest number among its own and its four neighbours',
    again and again, until nothing changes."""
    height, width = mask.shape
    big = height * width + 1
    lab = np.where(mask, np.arange(1, height * width + 1).reshape(height, width), big)
    while True:
        new = lab.copy()
        new[1:] = np.minimum(new[1:], lab[:-1])
        new[:-1] = np.minimum(new[:-1], lab[1:])
        new[:, 1:] = np.minimum(new[:, 1:], lab[:, :-1])
        new[:, :-1] = np.minimum(new[:, :-1], lab[:, 1:])
        new[~mask] = big
        if np.array_equal(new, lab):
            break
        # Jump along the chains, so that a long thing settles in few rounds.
        flat = np.concatenate([[big], new.ravel()])
        jumped = np.where(new < big, flat[np.minimum(new, big - 1)], big)
        lab = np.where(mask, np.minimum(new, jumped), big)
    return np.where(mask, lab, 0)


def filled(mask: np.ndarray, largest: int) -> np.ndarray:
    """The mask with its small holes filled: the gaps, no larger than `largest`
    pixels, that no path of empty pixels joins to the picture's edge."""
    empty = labels(~mask)
    edge = set(np.unique(np.concatenate([empty[0], empty[-1], empty[:, 0], empty[:, -1]])))
    numbers, sizes = np.unique(empty[empty > 0], return_counts=True)
    pairs = zip(numbers, sizes, strict=True)
    small = [n for n, size in pairs if size <= largest and n not in edge]
    return mask | np.isin(empty, small)


#: How far below a pixel of a thing its foot may be, in rows.
REACH = 3


def feet(marks: list[str], height: int, width: int, tile: int) -> np.ndarray:
    """For every pixel, the row of the first cell no one walks on at or below it,
    within REACH rows, in its own column, or else in the next; else its own row."""
    rows, columns = len(marks), len(marks[0])
    cell_row = np.empty((rows, columns), dtype=np.int16)
    for r in range(rows):
        for c in range(columns):
            cell_row[r, c] = r
            for near in ((0,), (-1, 1)):
                found = [
                    r + dr
                    for dr in range(REACH + 1)
                    for dc in near
                    if r + dr < rows
                    and 0 <= c + dc < columns
                    and marks[r + dr][c + dc] in STANDING
                ]
                if found:
                    cell_row[r, c] = min(found)
                    break
    ys = np.minimum(np.arange(height) // tile, rows - 1)
    xs = np.minimum(np.arange(width) // tile, columns - 1)
    return cell_row[ys][:, xs]


#: How dark a painted outline is: no channel brighter than this.
OUTLINE = 60


#: How wide a band of the scene's edge closes in a crown it cuts, in working pixels.
EDGE_BAND = 32


def reached(
    inside: np.ndarray, band: np.ndarray, dark: np.ndarray, b: int = EDGE_BAND
) -> np.ndarray:
    """In a band along a box's edges, what lies straight out from `inside`: each
    band pixel takes the value of the first pixel inward of the band, along its
    row for a side band, along its column for a top or bottom one, as far out as
    the first dark outline it meets, that outline too. The band is `b` pixels wide."""

    def out_to(values: np.ndarray, outline: np.ndarray) -> np.ndarray:
        # Along axis 1, the band's inner edge at index 0 and the box's edge at its end.
        passed = np.logical_or.accumulate(outline, axis=1)
        passed[:, 1:] = passed[:, :-1].copy()
        passed[:, 0] = False
        return values[:, None] & ~passed

    out = np.zeros_like(inside)
    height, width = inside.shape
    if band[:, 0].all() and width > b:
        out[:, :b] |= out_to(inside[:, b], dark[:, :b][:, ::-1])[:, ::-1]
    if band[:, -1].all() and width > b:
        out[:, -b:] |= out_to(inside[:, -b - 1], dark[:, -b:])
    if band[0].all() and height > b:
        out[:b] |= out_to(inside[b], dark[:b][::-1].T).T[::-1]
    if band[-1].all() and height > b:
        out[-b:] |= out_to(inside[-b - 1], dark[-b:].T).T
    return out & band


def outlined(things: np.ndarray, crowns: np.ndarray, painting: np.ndarray) -> np.ndarray:
    """What each crown's dark outline closes in, and the outline itself, that the
    cut-out leaves out: its sunlit leaves, coloured as grass, and the strokes on
    them. Each crown is looked at in its own box, a crown being the pixels of
    things within a tree's reach that touch; only what joins a crown is taken
    into it (spread)."""
    out = np.zeros_like(things)
    dark = painting.max(axis=2) < OUTLINE
    # The crowns found on a coarse grid, and each one's box.
    step = 8
    coarse = crowns[::step, ::step]
    numbers = labels(coarse)
    # A crown's box reaches past what of it is cut out, to its outline round the
    # sunlit leaves, the most of them at its top.
    margin, above = 64, 160
    height, width = things.shape
    for number in np.unique(numbers[numbers > 0]):
        ys, xs = np.nonzero(numbers == number)
        y0, y1 = max(0, ys.min() * step - above), min(height, (ys.max() + 1) * step + margin)
        x0, x1 = max(0, xs.min() * step - margin), min(width, (xs.max() + 1) * step + margin)
        here = things[y0:y1, x0:x1]
        region = here | dark[y0:y1, x0:x1]
        # The scene's own edge closes in a crown it cuts, as its outline would, a
        # band of it wide enough for an outline that stops short of the edge.
        band = np.zeros_like(region)
        if y0 == 0:
            band[:EDGE_BAND] = True
        if x0 == 0:
            band[:, :EDGE_BAND] = True
        if x1 == width:
            band[:, -EDGE_BAND:] = True
        if y1 == height:
            band[-EDGE_BAND:] = True
        # A hole as large as half the box at most: the lawn round the crown reaches
        # the box's edge, and is never one. The outline and its strokes inside the
        # crown are of it too.
        inside = filled(region | band, region.size // 2) & ~band
        # Within the band, each row and column goes on as it is just inside it.
        inside |= band & reached(inside | here, band, dark[y0:y1, x0:x1])
        out[y0:y1, x0:x1] |= inside & ~here
    return out


#: How far a crown's sunlit leaves and its edge reach out of its mask, in working
#: pixels: what its outline closes in, and what next to it differs from the ground.
SUNLIT_STEPS = 160
EDGE_STEPS = 48


def spread(seed: np.ndarray, allowed: np.ndarray, steps: int) -> np.ndarray:
    """Each value of `seed` (-1 where none) carried into the `allowed` pixels next to
    it, a pixel a step, `steps` times: where a pixel reached takes its value from."""
    out = seed.copy()
    for _ in range(steps):
        near = out.copy()
        near[1:] = np.maximum(near[1:], out[:-1])
        near[:-1] = np.maximum(near[:-1], out[1:])
        near[:, 1:] = np.maximum(near[:, 1:], out[:, :-1])
        near[:, :-1] = np.maximum(near[:, :-1], out[:, 1:])
        new = allowed & (out < 0) & (near >= 0)
        if not new.any():
            break
        out[new] = near[new]
    return out


def held(things: np.ndarray, depth: np.ndarray, own_row: np.ndarray) -> np.ndarray:
    """The pixels of things that hang from their foot: on their own row, or above it
    with a way down to it through pixels of the same row, a pixel a step, straight
    down or slanting. A crown, a rock or a wall's top hangs from its foot so; a
    shadow or a flower on the lawn, with lawn between it and the foot it was
    given, does not."""
    out = np.zeros_like(things)
    last = things.shape[0] - 1
    out[last] = things[last] & (own_row[last] == depth[last])
    for y in range(last - 1, -1, -1):
        below, under, here = out[y + 1], depth[y + 1], depth[y]
        way = below & (under == here)
        way[1:] |= below[:-1] & (under[:-1] == here[1:])
        way[:-1] |= below[1:] & (under[1:] == here[:-1])
        out[y] = things[y] & ((own_row[y] == here) | way)
    return out


def grouped(
    mask: np.ndarray,
    marks: list[str],
    cuts: tuple[float, ...] = CUTS,
    wand_box: tuple[float, float, float, float] = BOXES["wand"],
) -> tuple[np.ndarray, np.ndarray, dict[int, int], np.ndarray]:
    """The things of the mask, found at SMALL pixels a cell: each one's number,
    the holes closed in by them, each one's foot, the lowest row of a cell no one
    walks on that it covers half of, or -1 for a patch on the ground (a shadow, a
    tuft), and for the pixels within a tree's reach, what lies between its edges
    too, its trunk's row (-1 out of every tree's reach)."""
    rows, columns = len(marks), len(marks[0])
    small = (
        np.array(
            Image.fromarray(mask.astype(np.uint8) * 255).resize(
                (columns * SMALL, rows * SMALL), Image.BOX
            )
        )
        > 60
    )
    # A hole the size of a cell and a half at most: sunlit leaves, never a lawn.
    whole = filled(small, int(1.5 * SMALL * SMALL))
    holes = whole & ~small
    # A thing never holds together across a wall's top: the rows there are left
    # out while the things are numbered, and take the number of the pixel below.
    # A cut is a row, or [row, first column, last column] for a wall's top that
    # runs only between two trees whose crowns rise over it.
    cut = whole.copy()
    lines = []
    for c in cuts:
        row, x0, x1 = (c, 0, columns) if isinstance(c, int | float) else c
        lines.append((round(row * SMALL), round(x0 * SMALL), round(x1 * SMALL)))
    for line, x0, x1 in lines:
        cut[line, x0:x1] = False
    lab = labels(cut)
    for line, x0, x1 in lines:
        lab[line, x0:x1] = np.where(whole[line, x0:x1], lab[line + 1, x0:x1], 0)
    standing = np.array([[ch in STANDING for ch in row] for row in marks])
    foot: dict[int, int] = {}
    # The cells each thing stands on, to join the parts of one tree.
    trunks: dict[tuple[int, int], list[int]] = {}
    for number in np.unique(lab[lab > 0]):
        number = int(number)
        part = lab == number
        cover = part.reshape(rows, SMALL, columns, SMALL).mean(axis=(1, 3))
        under = np.argwhere((cover > 0.5) & standing)
        if not len(under):
            # Leaves with their trunk below them: a standing cell the thing touches,
            # or one just below its lowest row, among its columns.
            under = np.argwhere((cover > 0.05) & standing)
        if not len(under):
            ys, xs = np.nonzero(part)
            bottom = min(ys.max() // SMALL + 1, rows - 1)
            columns_of = range(xs.min() // SMALL, xs.max() // SMALL + 1)
            under = np.array([[bottom, c] for c in columns_of if standing[bottom, c]])
        # Leaves that touch a fence or a rock as well as their trunk stand on the trunk.
        trunk = np.array([[r, c] for r, c in under if marks[r][c] == "t"])
        if len(trunk) and len(trunk) < len(under):
            under = trunk
        foot[number] = int(under[:, 0].max()) if len(under) else -1
        kinds = {marks[r][c] for r, c in under} if len(under) else set()
        if kinds & set("tr") and not kinds & set("#f"):
            low = under[under[:, 0] == foot[number]]
            trunks.setdefault((foot[number], int(low[0][1])), []).append(number)
        # The flat stone the wand lies on stands on cells walked on, and is a thing.
        x0, y0, x1, y1 = wand_box
        box = part[round(y0 * SMALL) : round(y1 * SMALL), round(x0 * SMALL) : round(x1 * SMALL)]
        if foot[number] < 0 and box.mean() > 0.2:
            foot[number] = int(round(y1 - 0.5))
    # A tree or a rock is round: what lies between its edges, row by row and
    # column by column, is of it, its sunlit leaves and tops too, and the parts
    # of it standing on the same cell are one.
    reach = np.full(whole.shape, -1, dtype=np.int16)
    for (row, col), numbers in trunks.items():
        # Within a tree's reach of its trunk: a cell and a half to either side.
        window = np.zeros_like(whole)
        x0, x1 = max(0, round((col - 1.4) * SMALL)), round((col + 2.4) * SMALL)
        window[: round((row + 0.8) * SMALL), x0:x1] = True
        part = np.isin(lab, numbers) & window
        # Inside the crown is what lies between its edges both across and down: a
        # pixel between them only one way is beside the crown, the lawn by it.
        spans = np.ones_like(part)
        for axis in (0, 1):
            seen = part.any(axis=axis)
            first = np.argmax(part, axis=axis)
            last = part.shape[axis] - 1 - np.argmax(np.flip(part, axis=axis), axis=axis)
            index = np.arange(part.shape[axis])
            if axis == 0:
                spans &= (index[:, None] >= first) & (index[:, None] <= last) & seen
            else:
                spans &= (
                    (index[None, :] >= first[:, None])
                    & (index[None, :] <= last[:, None])
                    & seen[:, None]
                )
        grown = spans & ~whole & window
        whole |= grown
        lab[grown | part] = numbers[0]
        reach[(grown | part) & window] = row
    return lab, holes, foot, reach


def leaf(painting: np.ndarray, mask: np.ndarray, name: str, inside: np.ndarray) -> np.ndarray:
    """The part of a boxed thing that opens or is picked up. A gate or a door is
    everything that differs from the ground in its box, which is drawn tight
    round the leaf, and its dark iron, wood and rune besides; the wand is what in
    its box, drawn tight round it, differs from the ground and is the wand's own:
    its brown wood, much redder than blue and redder than green, and its dark
    outline, never the grey or pink stone it lies on nor the grass."""
    hsv = np.array(Image.fromarray(painting).convert("HSV")).astype(np.int16)
    sat, v = hsv[..., 1], hsv[..., 2]
    p = painting.astype(np.int16)
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    if name == "gate":
        found = mask | (v < 95) | ((sat < 60) & (v < 130))
    elif name == "seal":
        found = mask | ((r > b + 25) & (v < 170) & (sat > 70)) | ((b > r + 40) & (v > 120))
    else:
        # Wood is much redder than blue, and redder than green; the stone, grey or
        # pink in the light, and the grass are not.
        found = mask & (((r > b + 45) & (r > g)) | (v < 80))
    found &= inside
    # Closed over its small gaps, opened of its specks, kept in its box.
    image = Image.fromarray(found.astype(np.uint8) * 255)
    image = image.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    image = image.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    return (np.array(image) > 0) & inside


def build(source: Path = SOURCE, out: Path = OUT) -> Path:
    settings = dict(DEFAULTS)
    if (source / "cut.json").is_file():
        settings.update(json.loads((source / "cut.json").read_text()))
    boxes = {name: tuple(box) for name, box in settings["boxes"].items()}
    grid = json.loads((source / "grid.json").read_text())
    marks = [r for r in (source / "marks.txt").read_text().splitlines() if r]
    rows, columns = len(marks), len(marks[0])
    tile = TILE * WORK

    def read(name: str, size: int) -> Image.Image:
        return aligned(Image.open(source / name), grid, columns, rows, size)

    painting = np.array(read(settings["nogrid"], tile))
    ground = np.array(read(settings["ground"], tile))
    raw = difference(painting, ground)
    mask = raw & ~groundlike(painting)
    # The castle is ground: nothing of it is cut out, down to the foot of its walls.
    castle = round(settings["castle"] * tile)
    mask[:castle] = False
    raw[:castle] = False
    lab, holes, foot, reach = grouped(mask, marks, tuple(settings["cuts"]), boxes["wand"])
    # Each pixel of a thing stands on its tree's trunk, within a tree's reach, or
    # else on the first cell no one walks on at or below it.
    scale = tile // SMALL

    def up(small: np.ndarray) -> np.ndarray:
        return np.repeat(np.repeat(small, scale, axis=0), scale, axis=1)

    feet_of = np.array([foot.get(n, -1) for n in range(int(lab.max()) + 1)])
    of_thing = feet_of[up(lab)] >= 0
    trunk = up(reach)
    stands_on = feet(marks, *mask.shape, tile)
    depth = np.where(trunk >= 0, trunk, stands_on)
    own_row = np.repeat((np.arange(rows * tile) // tile)[:, None], columns * tile, axis=1)
    walked = np.array([[ch not in STANDING for ch in row] for row in marks])
    ys = np.minimum(np.arange(rows * tile) // tile, rows - 1)
    xs = np.minimum(np.arange(columns * tile) // tile, columns - 1)
    on_walked = walked[ys][:, xs]
    # Over a wall, within a tree's reach, only the crown's leaves and the outline
    # next to them are the tree's: the stones stand on the wall's own row.
    on_wall = np.array([[ch == "#" for ch in row] for row in marks])[ys][:, xs]
    leafy = (trunk >= 0) & on_wall & green(painting)
    near_leaves = np.array(
        Image.fromarray(leafy.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))
    )
    leafy |= (painting.max(axis=2) < OUTLINE) & (near_leaves > 0)
    depth = np.where((trunk >= 0) & on_wall & ~leafy, stands_on, depth)
    # A thing's pixels are the small grid's, kept to a few pixels round the mask,
    # so that its edge is the mask's and the pinholes inside it are filled. On
    # the ground: a patch with no foot, what lies below a tree's trunk (its
    # shadow), and the shadow on a cell walked on beside a thing's foot.
    near = np.array(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9)))
    body = up(lab > 0) & (near > 0)
    ratio = (painting.astype(np.float32) + 1) / (ground.astype(np.float32) + 1)
    darkened = ((ratio.max(axis=2) - ratio.min(axis=2)) < 0.16) & (ratio.mean(axis=2) < 0.93)
    lying = on_walked & (depth == own_row) & (trunk < 0) & darkened
    # A hole a thing closes in is of it where the painting differs from its ground;
    # what lies between a crown's edges is only the crown's reach, never drawn: the
    # lawn between two bushes, or a wall's shadow between a wall and a crown, would
    # be drawn in front of whoever stands there. A crown's sunlit leaves are what
    # its dark outline closes in (below).
    things = (mask | body | (up(holes) & raw)) & of_thing & (own_row <= depth) & ~lying
    # A crown's sunlit leaves, coloured as grass and so left out of the mask: what
    # its dark outline closes in, and what differs from the ground next to it and
    # is no shadow, are of the crown.
    # A crown is what lies within a tree's reach, or stands on a tree's or a rock's
    # cell, whatever it touches.
    rounded = np.array([[ch in "tr" for ch in row] for row in marks])
    on_round = rounded[np.clip(depth, 0, rows - 1), xs[None, :]] | (trunk >= 0)
    crown = np.where(things & on_round, depth, -1).astype(np.int16)
    sunlit = outlined(things, crown >= 0, painting)
    grown = spread(crown, sunlit, SUNLIT_STEPS)
    grown = spread(grown, raw & ~darkened & ~things, EDGE_STEPS)
    added = (grown >= 0) & (crown < 0) & (own_row <= grown)
    depth = np.where(added, grown, depth)
    things |= added
    # On a cell walked on, and on the cell above one, where a figure's hat is, what
    # is drawn in front of whoever stands there hangs from its foot: a crown or a
    # wall's top, never a shadow, a flower or a tuft on the lawn with lawn between
    # it and the row it was given.
    hat = np.zeros_like(walked)
    hat[:-1] = walked[1:]
    seen = on_walked | hat[ys][:, xs]
    things &= ~seen | (own_row == depth) | held(things, depth, own_row)
    # What opens, or is picked up, is its leaf, found by its colour in its box:
    # the gate's dark iron bars, the sealed door's brown wood and its blue rune,
    # the wand's brown wood; and, for a gate or a door, whatever else of the
    # things lies in its box, which is drawn tight round it; its frame, the
    # pillars and the arch, stays.
    leaves = {}
    for name, box in boxes.items():
        # A painting with these things already taken out has no leaves to cut.
        if name not in settings.get("leaves", boxes):
            leaves[name] = np.zeros_like(things)
            continue
        inside = box_mask(things.shape, box, tile)
        part = leaf(painting, mask, name, inside)
        if name != "wand":
            part |= things & inside
            things |= part
        leaves[name] = part
    # The floor is the painting itself: what stands up is drawn over it again, cut
    # out, in front of whoever is behind it, so that nothing is missing where a cut
    # falls short. Only under what opens, or is picked up, lies the ground alone,
    # and under a gate the bars' shadow on the path goes with it.
    bare = np.zeros_like(things)
    for name, part in leaves.items():
        grown = (
            np.array(Image.fromarray(part.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9)))
            > 0
        )
        bare |= grown
        if name == "gate":
            x0, y0, x1, y1 = boxes[name]
            bare |= box_mask(bare.shape, (x0, y0, x1, y1 + 0.8), tile)
    out.mkdir(parents=True, exist_ok=True)
    floor = painting.copy()
    floor[bare] = ground[bare]
    page = (columns * TILE, rows * TILE)
    Image.fromarray(floor).resize(page, Image.LANCZOS).save(out / "ground.png")
    read(settings["gridded"], TILE).save(out / "baked.png")
    # Soft edges: the thing's mask a little blurred, as alpha.
    soft = Image.fromarray(things.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(1.2))
    alpha = np.array(soft).astype(np.float32) / 255
    alpha[things] = 1.0
    alpha[~things & ~mask] = 0.0
    layers = []
    taken = np.zeros_like(things)
    for name, box in boxes.items():
        part = leaves[name]
        alpha[part] = 1.0
        image = rgba(painting, alpha * part)
        bbox = image.getbbox()
        taken |= part
        # A picture with the thing already taken out has nothing in its box.
        if not bbox:
            continue
        image.crop(bbox).save(out / f"{name}.png")
        row = int(round(box[3] - 0.5))
        layers.append({"name": name, "file": f"{name}.png", "at": list(bbox[:2]), "row": row})
    rest = things & ~taken
    # Under the wand, the stone it lay on: the stone's grey, taken from round it.
    stone = box_mask(things.shape, boxes["wand"], tile)
    under = stone & taken
    p = painting.astype(np.int16)
    greyish = (p.max(axis=2) - p.min(axis=2)) < 30
    grey = painting[stone & rest & greyish]
    if under.any() and len(grey):
        painting[under] = np.median(grey, axis=0).astype(np.uint8)
        rest |= under
    for row in range(rows):
        image = rgba(painting, alpha * (rest & (depth == row)))
        bbox = image.getbbox()
        if not bbox:
            continue
        image.crop(bbox).save(out / f"layer-{row}.png")
        layers.append(
            {"name": f"row {row}", "file": f"layer-{row}.png", "at": list(bbox[:2]), "row": row}
        )
    data = {
        "tile": TILE,
        "columns": columns,
        "rows": rows,
        "marks": marks,
        "layers": layers,
        "door": {"box": list(settings["door"])},
        "dir": out.name,
        **settings["page"],
    }
    (out / "field.json").write_text(json.dumps(data, indent=1) + "\n")
    return out / "field.json"


if __name__ == "__main__":
    import sys

    folders = [REPO / arg for arg in sys.argv[1:3]]
    print(build(*folders).relative_to(REPO))
