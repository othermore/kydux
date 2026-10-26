#!/usr/bin/env python3
"""A painted scene swept cell by cell (D76, D79): the wizard standing on every cell
walked on, drawn as the page draws it, and what of the painting covers it there;
and the checks that a scene's cut-outs hold neither too much nor too little.

    tools/art/sweep.py [scene]

Prints, for each cell where something is drawn in front of the wizard, how much
of the wizard it covers, how much of its head, and which images; writes a sheet
of those cells, each with the wizard on it, to art/raw/game-check/sweep-<scene>.png,
and the whole scene with the wizard on every cell walked on at once, each cell
numbered, those no one walks on crossed out and those where the wizard is wholly
hidden framed, to all-<scene>.png; and prints the problems found, failing when
there are any. The page draws a
row's image at the row's depth, R + 0.75, a figure on row r at r + FOOT_IN_CELL,
and a thing among the rows by its own row (painted.ts).

The problems, each on a cell walked on:

- floating: pixels of a row's image drawn in front of the cell that do not hang
  from the row's foot (image_first.held): a shadow or a flower on the lawn given
  a foot further down. Read from the scene's content alone.
- lawn: pixels of a row's image drawn in front of the cell where the painting
  does not differ from its ground-only edit: the lawn between two things.
- holes: a gap closed in on every side by a row's image where the painting
  differs from its ground-only edit: a crown's sunlit leaves left out, and the
  wizard seen through them.

The last two read the pictures the export cut the scene from
(art/raw/game/<scene>-src/), and are left out when they are not there. The
colours an outline and a shadow are told by are the scene's (scene_settings).
"""

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import image_first  # noqa: E402
import scene_settings  # noqa: E402

REPO = HERE.parents[1]
CONTENT = REPO / "content"
RAW = REPO / "art" / "raw"
#: Where a figure's feet stand in its cell, as a part of a cell (painted.ts).
FOOT_IN_CELL = 0.8
#: A cell's share of pixels a problem must reach to count: smaller is the soft edge;
#: a hole smaller than HOLE shows nothing of a figure behind it.
SHARE = 0.015
HOLE = 0.02
#: How much of the wizard covered is the wizard hidden: a problem on that cell is not
#: seen, and the cell is listed apart. The page shows the wizard by its outline
#: wherever more than a quarter of it is covered (app/src/engine/silhouette.ts).
HIDDEN = 0.95
#: How much of the wizard may be covered before its cell goes on the sheet.
SHOWN = 0.02
#: The look the wizard is drawn in.
LOOK = "wizard-plum"


@dataclass
class Layer:
    name: str
    #: The depth the page draws it at, in rows.
    depth: float
    #: The row its foot stands on, for a row's image.
    row: int | None
    rgba: np.ndarray
    left: int
    top: int


@dataclass
class Scene:
    name: str
    cell: int
    columns: int
    rows: int
    walked: np.ndarray
    ground: np.ndarray
    layers: list[Layer] = field(default_factory=list)
    #: The colours the scene is read by (D82).
    thresholds: dict = field(default_factory=image_first.thresholds)


def walks(scene: str) -> np.ndarray:
    """The cells walked on, from the scene's map and its terrains."""
    folder = CONTENT / "scenes" / scene
    marks = (folder / "map.txt").read_text(encoding="utf-8").split()
    terrains = json.loads((folder / "scene.json").read_text(encoding="utf-8"))["terrains"]
    walk = {letter for letter, terrain in terrains.items() if terrain.get("walk")} | {"."}
    return np.array([[char in walk for char in row] for row in marks])


def load(scene: str) -> Scene:
    folder = CONTENT / "art" / "scenes" / scene
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    cell = art["cell"]
    columns, rows = art["size"]
    ground = np.array(Image.open(folder / art["ground"]).convert("RGBA"))
    # The playable part of a ground painted with a margin (D83).
    ox, oy = art.get("origin", [0, 0])
    ground = ground[oy : oy + rows * cell, ox : ox + columns * cell]
    found = Scene(scene, cell, columns, rows, walks(scene), ground)
    if (scene_settings.SCENES / scene / "cut.json").is_file():
        found.thresholds = scene_settings.settings(scene).thresholds
    for row in art["rows"]:
        rgba = np.array(Image.open(folder / row["image"]).convert("RGBA"))
        found.layers.append(
            Layer(f"row {row['row']}", row["row"] + 0.75, row["row"], rgba, 0, row["top"])
        )
    for name, thing in art["things"].items():
        state = "closed" if "closed" in thing["states"] else next(iter(thing["states"]))
        rgba = np.array(Image.open(folder / thing["states"][state]).convert("RGBA"))
        # A thing is drawn just after its row's image (painted.ts).
        found.layers.append(
            Layer(name, thing["row"] + 0.75 + 0.001, None, rgba, thing["left"], thing["top"])
        )
    found.layers.sort(key=lambda layer: layer.depth)
    return found


def window(layer: Layer, x0: int, y0: int, x1: int, y1: int) -> np.ndarray:
    """The layer's RGBA over the scene's box (x0, y0, x1, y1), empty where it is not."""
    out = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.uint8)
    height, width = layer.rgba.shape[:2]
    ax0, ay0 = max(x0, layer.left), max(y0, layer.top)
    ax1, ay1 = min(x1, layer.left + width), min(y1, layer.top + height)
    if ax0 < ax1 and ay0 < ay1:
        out[ay0 - y0 : ay1 - y0, ax0 - x0 : ax1 - x0] = layer.rgba[
            ay0 - layer.top : ay1 - layer.top, ax0 - layer.left : ax1 - layer.left
        ]
    return out


def figure() -> tuple[np.ndarray, int]:
    """The wizard's standing frame, facing down, and how far above its bottom the
    feet are."""
    figures = CONTENT / "art" / "figures"
    data = json.loads((figures / "figures.json").read_text(encoding="utf-8"))
    width, height = data["frame"]
    sheet = Image.open(figures / f"{LOOK}.webp").convert("RGBA")
    standing = data["standing"]
    return np.array(sheet.crop((standing * width, 0, (standing + 1) * width, height))), data[
        "foot"
    ]


@dataclass
class Covered:
    cell: tuple[int, int]
    share: float
    head: float
    by: dict[str, float]


def covers(scene: Scene) -> list[Covered]:
    """Every cell walked on where something is drawn in front of the wizard."""
    frame, foot = figure()
    height, width = frame.shape[:2]
    alpha = frame[..., 3].astype(np.float32) / 255
    total = alpha.sum()
    seen = np.nonzero(alpha.sum(axis=1) > 0)[0]
    # The head: the top of the figure down to a little below its middle.
    neck = int(seen[0] + (seen[-1] - seen[0]) * 0.45)
    found = []
    for y, x in zip(*np.nonzero(scene.walked), strict=True):
        left = int((x + 0.5) * scene.cell) - width // 2
        bottom = int((y + FOOT_IN_CELL) * scene.cell) + foot
        top = bottom - height
        if top < 0 or bottom > scene.rows * scene.cell or left < 0:
            continue
        here = y + FOOT_IN_CELL + 0.0005
        front = np.zeros_like(alpha)
        by = {}
        for layer in scene.layers:
            if layer.depth <= here:
                continue
            over = window(layer, left, top, left + width, bottom)[..., 3].astype(np.float32) / 255
            hit = (over * alpha).sum() / total
            if hit > 0.001:
                by[layer.name] = round(float(hit), 3)
            front = np.maximum(front, over)
        share = float((front * alpha).sum() / total)
        head = float((front * alpha)[:neck].sum() / max(1.0, alpha[:neck].sum()))
        if share > SHOWN:
            found.append(Covered((int(x), int(y)), share, head, by))
    return found


def picture(scene: Scene, x: int, y: int) -> Image.Image:
    """The cells round (x, y) as the page draws them, with the wizard on (x, y)."""
    cell = scene.cell
    x0, y0 = max(0, (x - 1) * cell), max(0, y * cell - cell * 3 // 2)
    x1, y1 = min(scene.columns * cell, (x + 2) * cell), min(scene.rows * cell, (y + 2) * cell)
    out = Image.fromarray(scene.ground[y0:y1, x0:x1])
    frame, foot = figure()
    height, width = frame.shape[:2]
    left = int((x + 0.5) * cell) - width // 2 - x0
    top = int((y + FOOT_IN_CELL) * cell) + foot - height - y0
    wizard = Image.fromarray(frame)
    placed = False
    for layer in scene.layers:
        if not placed and layer.depth > y + FOOT_IN_CELL:
            out.paste(wizard, (left, top), wizard)
            placed = True
        out.alpha_composite(Image.fromarray(window(layer, x0, y0, x1, y1)))
    if not placed:
        out.paste(wizard, (left, top), wizard)
    return out


@dataclass
class Problem:
    kind: str
    cell: tuple[int, int]
    layer: str
    pixels: int

    def __str__(self) -> str:
        return (
            f"{self.kind} at {self.cell[0]},{self.cell[1]} in {self.layer}: {self.pixels} pixels"
        )


def by_cell(
    kind: str, layer: str, where: np.ndarray, cell: int, top: int = 0, share: float = SHARE
) -> list[Problem]:
    """A problem for each cell where `where`, an image's box starting at row `top`
    of the scene's pixels, holds at least `share` of the cell."""
    found = []
    ys, xs = np.nonzero(where)
    if not len(ys):
        return found
    cells, counts = np.unique(
        np.stack([xs // cell, (ys + top) // cell], axis=1), axis=0, return_counts=True
    )
    for (x, y), count in zip(cells, counts, strict=True):
        if count >= share * cell * cell:
            found.append(Problem(kind, (int(x), int(y)), layer, int(count)))
    return found


def before(scene: Scene, layer: Layer) -> np.ndarray:
    """Where a row's image may be drawn in front of a figure: over a cell walked on
    above its own row, where the figure stands, or over the cell just above one,
    where its hat is."""
    height, width = layer.rgba.shape[:2]
    ys = (np.arange(height) + layer.top) // scene.cell
    xs = np.minimum((np.arange(width) + layer.left) // scene.cell, scene.columns - 1)
    here = np.minimum(ys, scene.rows - 1)
    below = np.minimum(ys + 1, scene.rows - 1)
    stands = scene.walked[here][:, xs] & (ys < layer.row)[:, None]
    hat = scene.walked[below][:, xs] & (ys + 1 < layer.row)[:, None]
    return stands | hat


def outlined(
    scene: Scene, layer: Layer, raw: np.ndarray, whole: Layer | None = None
) -> np.ndarray:
    """What a row's image closes in with its outlines and what of it differs from
    the ground: a crown's inside, its sunlit leaves coloured as grass among it.
    What another image draws there, a wall a crown rises over, and a band of the
    scene's edge close it in too, as they do for the cut (image_first.outlined).
    `layer` may be a piece of a row's image, `whole`, which is not another image."""
    rgba = layer.rgba
    height, width = rgba.shape[:2]
    solid = rgba[..., 3] > 128
    dark = solid & image_first.outline(rgba, scene.thresholds)
    walls = dark | (solid & raw[:height, :width])
    for other in scene.layers:
        if other is not (whole or layer):
            box = window(other, layer.left, layer.top, layer.left + width, layer.top + height)
            walls |= box[..., 3] > 128
    size = image_first.EDGE_BAND // image_first.WORK
    band = np.zeros_like(walls)
    if layer.left == 0:
        band[:, :size] = True
    if layer.left + width >= scene.columns * scene.cell:
        band[:, -size:] = True
    if layer.top + height >= scene.rows * scene.cell:
        band[-size:] = True
    inside = image_first.filled(walls | band, walls.size // 2) & ~band
    inside |= band & image_first.reached(inside | walls, band, dark, size)
    return inside | walls


def floating(scene: Scene) -> list[Problem]:
    found = []
    for layer in scene.layers:
        if layer.row is None:
            continue
        height = layer.rgba.shape[0]
        solid = layer.rgba[..., 3] > 128
        own = np.repeat(
            ((np.arange(height) + layer.top) // scene.cell)[:, None], solid.shape[1], axis=1
        )
        depth = np.full(solid.shape, layer.row, dtype=np.int16)
        hanging = image_first.held(solid, depth, own)
        where = solid & before(scene, layer) & ~hanging
        found += by_cell("floating", layer.name, where, scene.cell, layer.top)
    return found


@dataclass
class Differs:
    """Where the picture a scene's rows were cut from differs from its ground-only
    edit, and where it is that ground in shadow, at the page's size."""

    raw: np.ndarray
    shadow: np.ndarray


def differs(scene: Scene) -> Differs | None:
    """The scene's differences from its ground; None when the pictures the export
    cut it from are not there."""
    source = scene_settings.WORK / f"{scene.name}-src"
    if not (source / "ground-composite.png").is_file():
        return None
    grid = json.loads((source / "grid.json").read_text())

    def read(name: str) -> np.ndarray:
        image = Image.open(source / name)
        return np.array(image_first.aligned(image, grid, scene.columns, scene.rows, scene.cell))

    painting, ground = read("ground-composite.png"), read("ground-only.png")
    shadow = image_first.darkened(painting, ground, scene.thresholds)
    return Differs(image_first.difference(painting, ground), shadow)


def lawn(scene: Scene, seen: Differs) -> list[Problem]:
    """A row's image's pixels where the painting is its ground, outside every outline:
    the lawn between two things, drawn in front of whoever stands there."""
    found = []
    for layer in scene.layers:
        if layer.row is None:
            continue
        height, width = layer.rgba.shape[:2]
        same = ~seen.raw[layer.top : layer.top + height, :width]
        where = (layer.rgba[..., 3] > 128) & before(scene, layer) & same
        if not where.any():
            continue
        # What closes them in is looked for round them, two cells about, not over
        # the scene's whole width.
        ys, xs = np.nonzero(where)
        room = 2 * scene.cell
        y0, y1 = max(0, ys.min() - room), min(height, ys.max() + 1 + room)
        x0, x1 = max(0, xs.min() - room), min(width, xs.max() + 1 + room)
        piece = Layer(
            layer.name, layer.depth, layer.row, layer.rgba[y0:y1, x0:x1], x0, layer.top + y0
        )
        raw = seen.raw[layer.top + y0 : layer.top + y1, x0:x1]
        where[y0:y1, x0:x1] &= ~outlined(scene, piece, raw, layer)
        found += by_cell("lawn", layer.name, where, scene.cell, layer.top)
    return found


def holes(scene: Scene, seen: Differs) -> list[Problem]:
    """The gaps a row's image closes in where the painting differs from its ground and
    is no shadow, a figure behind seen through them: found on a small grid, so that
    a gap must be a few pixels wide to count. The lawn seen between a fence's rails
    is in their shadow."""
    small = image_first.SMALL
    scale = scene.cell // small
    found = []
    for layer in scene.layers:
        if layer.row is None:
            continue
        height, width = layer.rgba.shape[:2]
        solid = layer.rgba[..., 3] > 128
        cut = (height // scale) * scale
        if not cut:
            continue
        shrunk = (
            solid[:cut].reshape(cut // scale, scale, width // scale, scale).mean(axis=(1, 3)) > 0.5
        )
        gaps = image_first.filled(shrunk, int(1.5 * small * small)) & ~shrunk
        gaps = np.repeat(np.repeat(gaps, scale, axis=0), scale, axis=1)
        where = np.zeros_like(solid)
        where[: gaps.shape[0], : gaps.shape[1]] = gaps
        box = slice(layer.top, layer.top + height), slice(0, width)
        where &= seen.raw[box] & ~seen.shadow[box] & ~solid & before(scene, layer)
        found += by_cell("hole", layer.name, where, scene.cell, layer.top, HOLE)
    return found


def problems(scene: Scene, covered: list[Covered] | None = None) -> list[Problem]:
    """The problems a figure would show: none on a cell where the wizard is hidden,
    nor over the cell above it, where its hat is."""
    hidden = {
        c.cell for c in (covered if covered is not None else covers(scene)) if c.share >= HIDDEN
    }
    found = floating(scene)
    seen = differs(scene)
    if seen is not None:
        found += lawn(scene, seen) + holes(scene, seen)

    def shown(problem: Problem) -> bool:
        x, y = problem.cell
        stands = (x, y) if scene.walked[y, x] else (x, y + 1)
        return stands not in hidden

    return [problem for problem in found if shown(problem)]


def sheet(scene: Scene, found: list[Covered], flagged: set[tuple[int, int]]) -> Image.Image:
    """The covered cells side by side, each named, a problem's in red."""
    if not found:
        return Image.new("RGB", (1, 1))
    pictures = []
    for covered in found:
        image = picture(scene, *covered.cell).convert("RGB")
        draw = ImageDraw.Draw(image)
        colour = (255, 70, 70) if covered.cell in flagged else (255, 240, 90)
        x, y = covered.cell
        draw.rectangle((0, 0, image.width, 14), fill=(0, 0, 0))
        draw.text((3, 1), f"{x},{y} {covered.share:.0%} head {covered.head:.0%}", fill=colour)
        pictures.append(image)
    width = max(p.width for p in pictures)
    height = max(p.height for p in pictures)
    columns = 8
    out = Image.new("RGB", (columns * width, -(-len(pictures) // columns) * height), (24, 24, 30))
    for index, image in enumerate(pictures):
        out.paste(image, ((index % columns) * width, (index // columns) * height))
    return out


def everyone(scene: Scene, hidden: set[tuple[int, int]]) -> Image.Image:
    """The scene as the page draws it with the wizard standing on every cell walked
    on, each drawn by its feet among the rows; over it every cell's edges and its
    column and row, a red cross on each cell no one walks on, and a yellow frame
    round each cell where the wizard is wholly hidden."""
    cell = scene.cell
    width, height = scene.columns * cell, scene.rows * cell
    out = Image.fromarray(scene.ground).convert("RGBA")
    frame, foot = figure()
    wizard = Image.fromarray(frame)
    tall, wide = frame.shape[:2]
    standing = [(y + FOOT_IN_CELL, (x, y)) for y, x in zip(*np.nonzero(scene.walked), strict=True)]
    drawn: list[tuple[float, Layer | tuple[int, int]]] = [
        (layer.depth, layer) for layer in scene.layers
    ]
    for _, what in sorted(drawn + standing, key=lambda item: item[0]):
        if isinstance(what, Layer):
            out.alpha_composite(Image.fromarray(window(what, 0, 0, width, height)))
        else:
            x, y = what
            left = int((x + 0.5) * cell) - wide // 2
            top = int((y + FOOT_IN_CELL) * cell) + foot - tall
            out.paste(wizard, (left, top), wizard)
    marks = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(marks)
    for y in range(scene.rows):
        for x in range(scene.columns):
            x0, y0, x1, y1 = x * cell, y * cell, (x + 1) * cell - 1, (y + 1) * cell - 1
            if not scene.walked[y, x]:
                draw.rectangle((x0, y0, x1, y1), fill=(255, 40, 40, 60))
                draw.line((x0 + 10, y0 + 10, x1 - 10, y1 - 10), fill=(255, 40, 40, 190), width=3)
                draw.line((x1 - 10, y0 + 10, x0 + 10, y1 - 10), fill=(255, 40, 40, 190), width=3)
            draw.rectangle((x0, y0, x1, y1), outline=(255, 255, 255, 110), width=1)
    for x, y in hidden:
        draw.rectangle(
            (x * cell + 3, y * cell + 3, (x + 1) * cell - 4, (y + 1) * cell - 4),
            outline=(255, 225, 0, 255),
            width=6,
        )
    out.alpha_composite(marks)
    words = ImageDraw.Draw(out)
    font = ImageFont.load_default(size=cell // 5)
    for y in range(scene.rows):
        for x in range(scene.columns):
            words.text(
                (x * cell + 4, y * cell + 2),
                f"{x},{y}",
                font=font,
                fill=(255, 243, 107),
                stroke_width=3,
                stroke_fill=(0, 0, 0),
            )
    return out


def main(name: str) -> int:
    scene = load(name)
    found = covers(scene)
    for covered in found:
        x, y = covered.cell
        by = ", ".join(f"{layer} {share:.0%}" for layer, share in covered.by.items())
        print(f"{x:2},{y:2}  covered {covered.share:4.0%}  head {covered.head:4.0%}  by {by}")
    print(f"{len(found)} of {int(scene.walked.sum())} cells walked on have something in front")
    hidden = [c.cell for c in found if c.share >= HIDDEN]
    print("the wizard is wholly hidden on " + " ".join(f"{x},{y}" for x, y in hidden))
    wrong = problems(scene, found)
    out = RAW / "game-check" / f"sweep-{name}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet(scene, found, {p.cell for p in wrong}).save(out)
    print(out.relative_to(REPO))
    whole = out.with_name(f"all-{name}.png")
    everyone(scene, set(hidden)).save(whole)
    print(whole.relative_to(REPO))
    for problem in wrong:
        print(problem)
    if differs(scene) is None:
        print("the export's pictures are not there: lawn and holes not checked")
    return 1 if wrong else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: sweep.py <scene>")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
