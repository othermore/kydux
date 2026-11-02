#!/usr/bin/env python3
"""A painted scene swept cell by cell (D76, D79): the wizard standing on every cell
walked on, drawn as the page draws it, and what of the painting covers it there;
and the checks that a scene's cut-outs hold neither too much nor too little.

    tools/art/sweep.py [scene]

Prints, for each cell where something is drawn in front of the wizard, how much
of the wizard it covers, how much of its head, and which images; writes a sheet
of those cells, each with the wizard on it, to art/raw/game-check/sweep-<scene>.png,
and the whole scene with the wizard on every cell walked on at once, each cell
numbered, the number yellow where the wizard is wholly hidden, to
all-<scene>.png; and prints the problems found, failing when
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
- fringe and bare: a cut-out's edge off its thing's outline (D93), the ground
  beyond the outline drawn over the wizard, or the outline left on the ground
  under it.
- spill: one thing drawn partly in front of the wizard and partly behind it, cut
  across a row's edge with no outline between its parts (D94).

All but the first read the pictures the export cut the scene from
(art/raw/game/<scene>-src/), and are left out when they are not there. The
colours an outline and a shadow are told by are the scene's (scene_settings);
a scene may name the kinds it is held to (`checks`), and parts of it whose
things are kept whatever the ground beside them (`kept`).
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
    #: A static thing's row image, drawn over the painting as it is (D89): what
    #: covers a figure there is the thing itself, never the lawn or a hole.
    static: bool = False
    #: An open-work thing, a gate of bars, drawn by how much each pixel differs
    #: from the picture without it: its edge is no outline's.
    open_work: bool = False
    #: Drawn over whoever stands on its own row too, a door or its arch; or over
    #: every figure, a wall seen from above (D95).
    under: bool = False
    over: bool = False


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
    #: The kinds of problem the scene is held to, every kind when None: a scene
    #: whose things are still to be cut again by the outline rule (D93) names the
    #: checks it already keeps (`checks` in its settings).
    checks: list[str] | None = None
    #: The parts of the scene its settings keep in its things (`kept`, D93), in cells.
    kept: list = field(default_factory=list)
    #: Whether Gemini marked its things in magenta (`marks`), which are then whole.
    marked: bool = False
    #: The cells a figure is drawn lower on, and by how much of a cell (D95).
    lowered: dict = field(default_factory=dict)


def walks(scene: str) -> np.ndarray:
    """The cells walked on, from the scene's map and its terrains, less those the
    wizard is refused."""
    folder = CONTENT / "scenes" / scene
    marks = (folder / "map.txt").read_text(encoding="utf-8").split()
    data = json.loads((folder / "scene.json").read_text(encoding="utf-8"))
    walk = {letter for letter, terrain in data["terrains"].items() if terrain.get("walk")} | {"."}
    walked = np.array([[char in walk for char in row] for row in marks])
    # A cell the wizard is refused (D84) is never stood on.
    for x, y in data.get("forbidden", {}).get("cells", []):
        walked[y, x] = False
    return walked


#: Where in its cell a row's things are drawn, as a part of a cell (painted.ts): under
#: whoever stands on the row, or over them, a door or its arch (D95).
ROW_IN_CELL = 0.75
UNDER_IN_CELL = 0.9


def depth_of(row: int, rows: int, under: bool = False, over: bool = False) -> float:
    """The depth, in rows, a row's image is drawn at among the figures: over every
    figure for a wall seen from above."""
    if over:
        return rows + 2.0
    return row + (UNDER_IN_CELL if under else ROW_IN_CELL)


def feet_at(scene: Scene, x: int, y: int) -> float:
    """Where the wizard's feet are drawn on a cell, in rows: lower on a cell the
    scene lowers (D95)."""
    return y + FOOT_IN_CELL + scene.lowered.get((x, y), 0.0)


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
        own = scene_settings.settings(scene)
        found.thresholds = own.thresholds
        found.checks = own.data.get("checks")
        found.kept = own.data.get("kept", [])
        found.marked = "marks" in own.data
    for part in art.get("lowered", []):
        (x0, y0), (x1, y1) = part["cells"]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                found.lowered[(x, y)] = part["by"]
    for row in art["rows"]:
        rgba = np.array(Image.open(folder / row["image"]).convert("RGBA"))
        kind = next((k for k in ("over", "under", "cover", "hangs") if row.get(k)), "")
        name = (
            f"row {row['row']}"
            + (" static" if row.get("static") else "")
            + (f" {kind}" if kind else "")
        )
        found.layers.append(
            Layer(
                name,
                depth_of(row["row"], rows, row.get("under", False), row.get("over", False)),
                row["row"],
                rgba,
                0,
                row["top"],
                row.get("static", False),
                under=row.get("under", False),
                over=row.get("over", False),
            )
        )
    solid = {}
    if (scene_settings.SCENES / scene / "cut.json").is_file():
        solid = {n: t.get("solid", True) for n, t in scene_settings.settings(scene).things.items()}
    for name, thing in art["things"].items():
        state = "closed" if "closed" in thing["states"] else next(iter(thing["states"]))
        rgba = np.array(Image.open(folder / thing["states"][state]).convert("RGBA"))
        # A thing is drawn just after its row's image (painted.ts).
        under = thing.get("under", False)
        found.layers.append(
            Layer(
                name,
                depth_of(thing["row"], rows, under) + 0.001,
                None,
                rgba,
                thing["left"],
                thing["top"],
                open_work=not solid.get(name, True),
                under=under,
            )
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
        bottom = int(feet_at(scene, x, y) * scene.cell) + foot
        top = bottom - height
        if top < 0 or bottom > scene.rows * scene.cell or left < 0:
            continue
        here = feet_at(scene, x, y) + 0.0005
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
    top = int(feet_at(scene, x, y) * cell) + foot - height - y0
    wizard = Image.fromarray(frame)
    placed = False
    for layer in scene.layers:
        if not placed and layer.depth > feet_at(scene, x, y):
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
    kind: str,
    layer: str,
    where: np.ndarray,
    cell: int,
    top: int = 0,
    share: float = SHARE,
    left: int = 0,
) -> list[Problem]:
    """A problem for each cell where `where`, an image's box starting at row `top`
    and column `left` of the scene's pixels, holds at least `share` of the cell."""
    found = []
    ys, xs = np.nonzero(where)
    if not len(ys):
        return found
    cells, counts = np.unique(
        np.stack([(xs + left) // cell, (ys + top) // cell], axis=1), axis=0, return_counts=True
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
    box = (layer.left, layer.top, layer.left + width, layer.top + height)
    return behind_cells(scene, reach_of(scene, layer), box)


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
    # Its edge is on its outline (D93), and what lies just beyond it that differs
    # from the ground closes it in as the outline does.
    reach = max(1, round(image_first.SNAP_REACH * scene.cell))
    walls = dark | (image_first.dilated(solid, reach) & raw[:height, :width])
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
    """Pixels of a row's image not held down to its foot: a shadow or a flower cut
    as a thing. A static thing is boxed by hand, and an arch's lintel is held by its
    posts across the opening it spans (D89): it is never looked at."""
    found = []
    for layer in scene.layers:
        if layer.row is None or layer.static:
            continue
        height = layer.rgba.shape[0]
        solid = layer.rgba[..., 3] > 128
        own = np.repeat(
            ((np.arange(height) + layer.top) // scene.cell)[:, None], solid.shape[1], axis=1
        )
        depth = np.full(solid.shape, layer.row, dtype=np.int16)
        hanging = image_first.held(solid, depth, own)
        # The edge round what hangs from the foot hangs with it (D93), as far as the
        # cut moves an edge.
        band = max(2, round(image_first.SNAP_BAND * scene.cell))
        hanging = image_first.flooded(hanging, solid, band)
        where = solid & before(scene, layer) & ~hanging
        found += by_cell("floating", layer.name, where, scene.cell, layer.top)
    return found


@dataclass
class Differs:
    """Where the picture a scene's rows were cut from differs from its ground-only
    edit, and where it is that ground in shadow, at the page's size; and that
    picture itself, whose outlines the cut-outs' edges lie on (D93)."""

    raw: np.ndarray
    shadow: np.ndarray
    painting: np.ndarray
    ground: np.ndarray


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
    return Differs(image_first.difference(painting, ground), shadow, painting, ground)


def lawn(scene: Scene, seen: Differs) -> list[Problem]:
    """A row's image's pixels where the painting is its ground, outside every outline:
    the lawn between two things, drawn in front of whoever stands there."""
    found = []
    for layer in scene.layers:
        if layer.row is None or layer.static:
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
        if layer.row is None or layer.static:
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


def behind_cells(scene: Scene, row: int, box: tuple[int, int, int, int]) -> np.ndarray:
    """Over the scene's box (x0, y0, x1, y1), where an image drawn over the figures
    standing above `row` may be drawn in front of one: a cell walked on above that
    row, or the cell just above one, where the figure's hat is."""
    x0, y0, x1, y1 = box
    ys = np.arange(y0, y1) // scene.cell
    xs = np.minimum(np.arange(x0, x1) // scene.cell, scene.columns - 1)
    here = np.minimum(ys, scene.rows - 1)
    below = np.minimum(ys + 1, scene.rows - 1)
    stands = scene.walked[here][:, xs] & (ys < row)[:, None]
    hat = scene.walked[below][:, xs] & (ys + 1 < row)[:, None]
    return stands | hat


def reach_of(scene: Scene, layer: Layer) -> int:
    """The first row whose figures a layer is drawn behind: the row below its foot's,
    or below its own row for what is over whoever stands on it (D95); below the
    scene, for a wall over every figure."""
    if layer.over:
        return scene.rows + 1
    row = layer.row if layer.row is not None else int(np.floor(layer.depth))
    return row + 1 if layer.under else row


def edges(scene: Scene, seen: Differs) -> list[Problem]:
    """A cut-out's edge off its thing's outline (D93), where a figure may stand behind
    it: `fringe`, its pixels that the ground beyond reaches without crossing an
    outline, drawn over the figure; `bare`, the outline's pixels just beyond its
    edge that the ground does not reach and no other image draws, left under the
    figure. As image_first.snapped holds an edge, at the page's size: the ground
    reaching in only where the painting is as its ground-only picture."""
    band = max(2, round(image_first.SNAP_BAND * scene.cell))
    reach = max(1, round(image_first.SNAP_REACH * scene.cell))
    height, width = scene.rows * scene.cell, scene.columns * scene.cell
    dark = image_first.dark_lines(seen.painting[:height, :width], scene.thresholds)
    same = image_first.like(seen.painting[:height, :width], seen.ground[:height, :width])
    # What Gemini painted magenta in a scene's marked picture is no outline: the
    # inside of an opening a wall is cut round.
    edge = max(1, round(image_first.MARK_EDGE * scene.cell))
    painted = image_first.marked(seen.ground[:height, :width])
    holes = image_first.eroded(painted, edge)
    # An outline left out is the painting's black line, whatever a darker scene's
    # outlines are read by: its shading and the cracks of its floor are not one.
    black = image_first.dark_lines(seen.painting[:height, :width])
    solids = [window(layer, 0, 0, width, height)[..., 3] > 128 for layer in scene.layers]
    count = np.sum(solids, axis=0, dtype=np.int16)
    inner = np.zeros((height, width), dtype=bool)
    inner[EDGE:-EDGE, EDGE:-EDGE] = True
    for area in scene.kept:
        inner &= ~image_first.area_mask(inner.shape, area, scene.cell)
    found = []
    for layer, solid in zip(scene.layers, solids, strict=True):
        ys, xs = np.nonzero(solid)
        if not len(ys) or layer.open_work:
            continue
        y0, y1 = max(0, ys.min() - 2 * band), min(height, ys.max() + 1 + 2 * band)
        x0, x1 = max(0, xs.min() - 2 * band), min(width, xs.max() + 1 + 2 * band)
        piece, lines = solid[y0:y1, x0:x1], dark[y0:y1, x0:x1]
        outside = image_first.outside_of(piece, lines, band)
        given = image_first.outside_of(piece, lines, band, same[y0:y1, x0:x1])
        behind = (
            behind_cells(scene, reach_of(scene, layer), (x0, y0, x1, y1)) & inner[y0:y1, x0:x1]
        )
        others = (count[y0:y1, x0:x1] - piece) > 0
        fringe = piece & given & behind
        if scene.marked:
            # In a scene Gemini marked, its magenta is the thing (D93): only what
            # goes beyond it is a fringe.
            fringe &= ~painted[y0:y1, x0:x1]
        bare = black[y0:y1, x0:x1] & image_first.dilated(piece, reach)
        bare &= ~piece & ~outside & ~others & behind
        bare &= ~holes[y0:y1, x0:x1]
        found += by_cell("fringe", layer.name, fringe, scene.cell, y0, left=x0)
        found += by_cell("bare", layer.name, bare, scene.cell, y0, left=x0)
    return found


#: How far from the scene's edge, in the page's pixels, a cut-out's edge is looked at: a
#: painting's outermost pixels are left out (margin.TRIM), and a cut-out fades out
#: before them (export_scene.EDGE_FEATHER).
EDGE = 12
#: How many pixels of one thing cut across a row's edge, over a figure, are a spill
#: (D94): a tenth of a cell's width.
SPILL = 0.1


def spills(scene: Scene, seen: Differs) -> list[Problem]:
    """One thing drawn partly in front of a figure and partly behind it (D94): over
    the wizard on a cell walked on, an image drawn in front of it meets one drawn
    behind it with no outline between them, so that the two are one thing cut
    across a row's edge, the figure standing inside it. The problem is the cell the
    wizard stands on."""
    frame, foot = figure()
    tall, wide = frame.shape[:2]
    shape = image_first.dilated(frame[..., 3] > 128, 2)
    height, width = scene.rows * scene.cell, scene.columns * scene.cell
    dark = image_first.dark_lines(seen.painting[:height, :width], scene.thresholds)
    found = []
    for y, x in zip(*np.nonzero(scene.walked), strict=True):
        left = int((x + 0.5) * scene.cell) - wide // 2
        bottom = int(feet_at(scene, x, y) * scene.cell) + foot
        top = bottom - tall
        if top < 0 or bottom > height or left < 0 or left + wide > width:
            continue
        here = feet_at(scene, x, y) + 0.0005
        front = np.zeros((tall, wide), dtype=bool)
        back = np.zeros_like(front)
        names = set()
        for layer in scene.layers:
            solid = window(layer, left, top, left + wide, bottom)[..., 3] > 128
            if not solid.any():
                continue
            if layer.depth > here:
                front |= solid
                names.add(layer.name)
            else:
                back |= solid
        lines = dark[top:bottom, left : left + wide]
        back &= ~front & ~lines
        contact = front & ~lines & image_first.dilated(back, 1) & shape
        pixels = int(contact.sum())
        if pixels >= SPILL * scene.cell:
            found.append(Problem("spill", (int(x), int(y)), ", ".join(sorted(names)), pixels))
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
        found += lawn(scene, seen) + holes(scene, seen) + edges(scene, seen) + spills(scene, seen)

    if scene.checks is not None:
        found = [problem for problem in found if problem.kind in scene.checks]

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
    on, each drawn by its feet among the rows; over it every cell's faint edges and
    its column and row, in yellow where the wizard is wholly hidden."""
    cell = scene.cell
    width, height = scene.columns * cell, scene.rows * cell
    out = Image.fromarray(scene.ground).convert("RGBA")
    frame, foot = figure()
    wizard = Image.fromarray(frame)
    tall, wide = frame.shape[:2]
    standing = [
        (feet_at(scene, x, y), (x, y)) for y, x in zip(*np.nonzero(scene.walked), strict=True)
    ]
    drawn: list[tuple[float, Layer | tuple[int, int]]] = [
        (layer.depth, layer) for layer in scene.layers
    ]
    for _, what in sorted(drawn + standing, key=lambda item: item[0]):
        if isinstance(what, Layer):
            out.alpha_composite(Image.fromarray(window(what, 0, 0, width, height)))
        else:
            x, y = what
            left = int((x + 0.5) * cell) - wide // 2
            top = int(feet_at(scene, x, y) * cell) + foot - tall
            out.paste(wizard, (left, top), wizard)
    lines = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(lines)
    for y in range(scene.rows):
        for x in range(scene.columns):
            draw.rectangle(
                (x * cell, y * cell, (x + 1) * cell - 1, (y + 1) * cell - 1),
                outline=(255, 255, 255, 70),
                width=1,
            )
    out.alpha_composite(lines)
    words = ImageDraw.Draw(out)
    font = ImageFont.load_default(size=cell // 6)
    for y in range(scene.rows):
        for x in range(scene.columns):
            words.text(
                (x * cell + 2, y * cell + 1),
                f"{x},{y}",
                font=font,
                fill=(255, 225, 0) if (x, y) in hidden else (255, 255, 255),
                stroke_width=2,
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
