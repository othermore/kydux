#!/usr/bin/env python3
"""A painted scene swept cell by cell (D76, D79): the wizard standing on every cell
walked on, drawn as the page draws it, and what of the painting covers it there;
and the checks that a scene's cut-outs hold neither too much nor too little.

    tools/art/sweep.py [scene]
    tools/art/sweep.py [scene] --sheets <folder>

Prints, for each cell where something is drawn in front of the wizard, how much
of the wizard it covers, how much of its head, and which images; writes a sheet
of those cells, each with the wizard on it, to art/raw/game-check/sweep-<scene>.png,
and the whole scene with the wizard on every cell walked on at once, each cell
numbered, the number yellow where the wizard is wholly hidden, to
all-<scene>.png; and prints the problems found, failing when
there are any. The page draws a
row's image at the row's depth, R + 0.75, a figure on row r at r + FOOT_IN_CELL,
and a thing among the rows by its own row (painted.ts).

With --sheets it writes instead the scene's review sheets into the folder (D208):
the cells, the even rows and the odd ones, each cell walked on or flown over tinted
and a figure on it where the game draws it; the masks, each tinted, outlined and
named; and for the shed its brooms and the figures of rows 5, 6, 8 and the doorway.
Every sheet carries the cells' borders and each cell's number at its foot, where the
game's ?debug layer writes it. A scene wider than forty cells is written in parts
that share two columns.

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
  under it; a door's leaf swung open (D111) is judged on its own picture
  composed on the ground, whose outlines are the leaf's.
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
    #: A door drawn open, its leaf swung against the wall beside its doorway (D111):
    #: its edge is judged on its own picture composed on the ground.
    swung: bool = False


def is_door(thing: dict) -> bool:
    """Whether an exported thing is a door, by its kind (D167): a door's open state is
    its leaf swung, a hole's open state lies in the floor and has no leaf."""
    return thing.get("kind") == "door"


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
    #: The parts of the scene its settings keep in its things (`kept`, D93), in cells.
    kept: list = field(default_factory=list)
    #: Whether Gemini marked its things in magenta (`marks`), which are then whole.
    marked: bool = False
    #: The cells a figure is drawn lower on, and by how much of a cell (D95).
    #: The cells of a dark tunnel, where the page draws no figure (D135).
    enchanted: set = field(default_factory=set)
    lowered: dict = field(default_factory=dict)
    #: The cells a figure is drawn sideways on, and by how much of a cell (D105).
    nudged: dict = field(default_factory=dict)
    #: The cells a thing drawn from a sprite is drawn sideways on, and by how much of a
    #: cell, not a figure (D207).
    shifted: dict = field(default_factory=dict)
    #: The dark passages a figure is drawn darker in, the deeper it goes (shade.ts).
    dark: list = field(default_factory=list)


def walks(scene: str) -> np.ndarray:
    """The cells walked on, from the scene's map and its terrains: the cells the
    wizard is refused too, which the others walk on (D84)."""
    folder = CONTENT / "scenes" / scene
    marks = (folder / "map.txt").read_text(encoding="utf-8").split()
    terrains = json.loads((folder / "scene.json").read_text(encoding="utf-8"))["terrains"]
    walk = {letter for letter, terrain in terrains.items() if terrain.get("walk")} | {"."}
    return np.array([[char in walk for char in row] for row in marks])


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


def middle_at(scene: Scene, x: int, y: int) -> float:
    """Where the wizard's middle is drawn on a cell, in columns: sideways on a cell
    the scene nudges (D105)."""
    return x + 0.5 + scene.nudged.get((x, y), 0.0)


#: How much darker a figure's head is than its feet in a dark passage (shade.ts).
HEAD_SHADE = 0.5


def shaded(scene: Scene, frame: np.ndarray, x: int, y: int) -> np.ndarray:
    """The wizard's frame as the page draws it on (x, y): in a dark passage darker
    the deeper the cell, from its feet up to its head, which is darker still."""
    feet = feet_at(scene, x, y)
    passage = next((p for p in scene.dark if p["columns"][0] <= x <= p["columns"][1]), None)
    if passage is None:
        return frame
    depth = (passage["from"] - feet) / (passage["from"] - passage["to"])
    low = passage["most"] * min(1.0, max(0.0, depth))
    if low <= 0:
        return frame
    high = min(passage["most"], low * (1 + HEAD_SHADE))
    shade = np.linspace(high, low, frame.shape[0])[:, None, None]
    out = frame.copy()
    out[..., :3] = (frame[..., :3] * (1 - shade)).astype(np.uint8)
    return out


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
        found.kept = own.data.get("kept", [])
        found.marked = "marks" in own.data
    found.dark = art.get("dark", [])
    about = REPO / "content" / "scenes" / scene / "scene.json"
    if about.is_file():
        found.enchanted = {
            (x, y)
            for x0, y0, x1, y1 in json.loads(about.read_text()).get("enchanted", [])
            for y in range(y0, y1 + 1)
            for x in range(x0, x1 + 1)
        }
    for key in ("lowered", "nudged", "shifted"):
        for part in art.get(key, []):
            (x0, y0), (x1, y1) = part["cells"]
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    # The first range that names a cell is taken, as on the page.
                    getattr(found, key).setdefault((x, y), part["by"])
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
        # A door is drawn open: one stands in its doorway, the only cell it is walked
        # on from, only when it is open, and what is seen through it is then under
        # them, its arch over them (D95); a door swung open lies on the wall beside
        # its doorway, among the rows by the row that state gives (D111).
        # A door or a hole is drawn open; anything else in its first state.
        door = is_door(thing)
        opens = thing.get("kind") in scene_settings.KINDS and "open" in thing["states"]
        state = "open" if opens else next(iter(thing["states"]))
        rgba = np.array(Image.open(folder / thing["states"][state]).convert("RGBA"))
        # A thing is drawn just after its row's image (painted.ts).
        under = thing.get("under", False) and not (door and state == "open")
        row = thing.get("rows", {}).get(state, thing["row"])
        found.layers.append(
            Layer(
                name,
                depth_of(row, rows, under) + 0.001,
                None,
                rgba,
                thing["left"],
                thing["top"],
                open_work=not solid.get(name, True),
                under=under,
                swung=door and state == "open",
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


def figure(name: str = LOOK, flying: bool = False) -> tuple[np.ndarray, int]:
    """A figure's standing frame, facing down, the wizard's unless named, or its first
    flying frame (flight.ts), and how far above its bottom the feet are."""
    figures = CONTENT / "art" / "figures"
    data = json.loads((figures / "figures.json").read_text(encoding="utf-8"))
    width, height = data["frame"]
    sheet = Image.open(figures / f"{name}.webp").convert("RGBA")
    column, row = (0, data["rows"]["fly"]) if flying else (data["standing"], 0)
    box = (column * width, row * height, (column + 1) * width, (row + 1) * height)
    return np.array(sheet.crop(box)), data["foot"]


def seen_at(scene: Scene, x: int, y: int, name: str = LOOK) -> int:
    """How many pixels of a figure standing on (x, y) are seen, nothing drawn in
    front of them: none for a figure wholly behind a thing, as one about to step
    out from behind it is (D128)."""
    frame, foot = figure(name)
    height, width = frame.shape[:2]
    alpha = frame[..., 3].astype(np.float32) / 255
    left = int(middle_at(scene, x, y) * scene.cell) - width // 2
    bottom = int(feet_at(scene, x, y) * scene.cell) + foot
    top = bottom - height
    here = feet_at(scene, x, y) + 0.0005
    front = np.zeros_like(alpha)
    for layer in scene.layers:
        if layer.depth > here:
            over = window(layer, left, top, left + width, bottom)[..., 3].astype(np.float32) / 255
            front = np.maximum(front, over)
    return int(((alpha * (1 - front)) > 0.5).sum())


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
        left = int(middle_at(scene, x, y) * scene.cell) - width // 2
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
    left = int(middle_at(scene, x, y) * cell) - width // 2 - x0
    top = int(feet_at(scene, x, y) * cell) + foot - height - y0
    wizard = Image.fromarray(shaded(scene, frame, x, y))
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


#: How much of a page pixel a line found at the painting's size must cover to be one.
LINE = 60


@dataclass
class Differs:
    """Where the picture a scene's rows were cut from differs from its ground-only
    edit, and where it is that ground in shadow, at the page's size; and that
    picture itself, whose outlines the cut-outs' edges lie on (D93)."""

    raw: np.ndarray
    shadow: np.ndarray
    painting: np.ndarray
    ground: np.ndarray
    #: The painting's outlines, by the scene's colours and by the painting's black,
    #: found at the painting's own size and brought down: a thin line a painting
    #: drawn large has would blur away at the page's size.
    dark: np.ndarray
    black: np.ndarray


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
    native = np.array(Image.open(source / "ground-composite.png").convert("RGB"))

    def lines(th: dict) -> np.ndarray:
        found = Image.fromarray(image_first.dark_lines(native, th).astype(np.uint8) * 255)
        brought = image_first.aligned(found, grid, scene.columns, scene.rows, scene.cell)
        return np.array(brought)[..., 0] > LINE

    dark, black = lines(scene.thresholds), lines(image_first.THRESHOLDS)
    raw = image_first.difference(painting, ground)
    return Differs(raw, shadow, painting, ground, dark, black)


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
    dark = seen.dark[:height, :width]
    same = image_first.like(seen.painting[:height, :width], seen.ground[:height, :width])
    # What Gemini painted magenta in a scene's marked picture is no outline: the
    # inside of an opening a wall is cut round.
    edge = max(1, round(image_first.MARK_EDGE * scene.cell))
    painted = image_first.marked(seen.ground[:height, :width])
    holes = image_first.eroded(painted, edge)
    # An outline left out is the painting's black line, whatever a darker scene's
    # outlines are read by: its shading and the cracks of its floor are not one.
    black = seen.black[:height, :width]
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
        alike = same[y0:y1, x0:x1]
        if layer.swung:
            # A leaf swung open lies over the wall and the doorway beside it (D111):
            # its outlines, its hinges' too, are on its own picture composed on the
            # ground, not on the ground the scene was cut from, which has no leaf.
            shown = window(layer, x0, y0, x1, y1)
            alpha = shown[..., 3:] / 255
            composed = seen.painting[y0:y1, x0:x1] * (1 - alpha) + shown[..., :3] * alpha
            composed = composed.astype(np.uint8)
            lines = lines | image_first.dark_lines(composed, scene.thresholds)
            alike = image_first.like(composed, seen.ground[y0:y1, x0:x1])
        # The scene's own edge lets no ground in: a crown it cuts has its outline
        # beyond it, in the margin.
        others = (count[y0:y1, x0:x1] - piece) > 0
        outside = image_first.outside_of(piece, lines, band, border=False)
        # What another image draws beside the edge is no ground let in: a wall and
        # the door cut out of it meet with no outline between them.
        given = image_first.outside_of(piece, lines, band, alike & ~others, border=False)
        behind = (
            behind_cells(scene, reach_of(scene, layer), (x0, y0, x1, y1)) & inner[y0:y1, x0:x1]
        )
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


#: How far from the scene's edge, in the page's pixels, a cut-out's edge is looked at:
#: a painting's outermost pixels are left out (margin.TRIM), a cut-out fades out
#: before them (export_scene.EDGE_FEATHER), and the grid may begin a little
#: outside the painting, so that a crown the edge cuts is faded beside the edge and
#: its strip next to the fade would look like a fringe.
EDGE = 40
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
    dark = seen.dark[:height, :width]
    # What the scene's settings keep whole is not looked at (`kept`, D93).
    kept = np.zeros((height, width), dtype=bool)
    for area in scene.kept:
        kept |= image_first.area_mask(kept.shape, area, scene.cell)
    found = []
    for y, x in zip(*np.nonzero(scene.walked), strict=True):
        left = int(middle_at(scene, x, y) * scene.cell) - wide // 2
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
        contact &= ~kept[top:bottom, left : left + wide]
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
    tall, wide = frame.shape[:2]
    # As the page: no figure is drawn in a dark tunnel (D135).
    standing = [
        (feet_at(scene, x, y), (x, y))
        for y, x in zip(*np.nonzero(scene.walked), strict=True)
        if (x, y) not in scene.enchanted
    ]
    drawn: list[tuple[float, Layer | tuple[int, int]]] = [
        (layer.depth, layer) for layer in scene.layers
    ]
    for _, what in sorted(drawn + standing, key=lambda item: item[0]):
        if isinstance(what, Layer):
            out.alpha_composite(Image.fromarray(window(what, 0, 0, width, height)))
        else:
            x, y = what
            left = int(middle_at(scene, x, y) * cell) - wide // 2
            top = int(feet_at(scene, x, y) * cell) + foot - tall
            seen = Image.fromarray(shaded(scene, frame, x, y))
            out.paste(seen, (left, top), seen)
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


# The review's sheets (D208): the scene as the game draws it with its grid and its
# numbers, the number of a cell at its foot, in its middle, as the ?debug layer writes
# it, so that a figure on a cell stands just over its number.

#: How tall a cell's number is, as a part of a cell: the ?debug layer's 9 pixels of a
#: 48-pixel cell (debug.ts).
NUMBER_SIZE = 9 / 48
#: The widest a sheet is, in cells: a wider scene is written in parts that share
#: SHARED columns.
WIDEST = 40
SHARED = 2
#: How far a flying figure is lifted above its cell, in cells (flight.ts).
FLY_LIFT = 0.5
#: The tints of a cell walked on and of one only flown over.
WALKED_TINT = (60, 220, 255)
FLOWN_TINT = (90, 120, 255)


@dataclass
class Placed:
    """Something drawn among the scene's layers by its depth, in rows: a figure, or a
    thing drawn from its sprite."""

    depth: float
    image: Image.Image
    left: int
    top: int


def flown(scene: str) -> np.ndarray:
    """The cells a flight crosses and no one walks on (D186)."""
    folder = CONTENT / "scenes" / scene
    marks = (folder / "map.txt").read_text(encoding="utf-8").split()
    terrains = json.loads((folder / "scene.json").read_text(encoding="utf-8"))["terrains"]
    fly = {k for k, t in terrains.items() if t.get("fly") and not t.get("walk")} | {"~"}
    return np.array([[char in fly for char in row] for row in marks])


def standing_on(scene: Scene, x: int, y: int, flying: bool = False) -> Placed:
    """A figure on (x, y) where the game draws it, nudged and lowered; flying, lifted
    half a cell, its depth its cell's."""
    frame, foot = figure(flying=flying)
    height, width = frame.shape[:2]
    left = int(middle_at(scene, x, y) * scene.cell) - width // 2
    lift = round(FLY_LIFT * scene.cell) if flying else 0
    top = int(feet_at(scene, x, y) * scene.cell) + foot - height - lift
    image = Image.fromarray(shaded(scene, frame, x, y))
    return Placed(feet_at(scene, x, y), image, left, top)


def sprite_on(scene: Scene, kind: str, cell: tuple[int, int], hung: bool = False) -> Placed:
    """A thing drawn from its kind's sprite on a cell, as the game draws it (things.ts):
    its size, its foot and its origin from things.json, moved by the scene's shift
    (D207); a hung broom from its hung sprite (D195), at its row's depth, a lying one
    just under it."""
    things = CONTENT / "art" / "things"
    sprites = json.loads((things / "things.json").read_text(encoding="utf-8"))
    name = f"{kind}-hung" if hung and f"{kind}-hung" in sprites else kind
    about = sprites[name]
    picture = Image.open(things / about["image"]).convert("RGBA")
    height = round(about["size"][1] * scene.cell)
    width = round(picture.width * height / picture.height)
    picture = picture.resize((width, height), Image.Resampling.LANCZOS)
    top_anchor = about.get("anchor") == "top"
    ox, oy = about.get("origin", [0.5, 0.0] if top_anchor else [0.5, 1.0])
    x, y = cell
    fx = (x + about["foot"][0] + scene.shifted.get(cell, 0.0)) * scene.cell
    fy = (y + about["foot"][1]) * scene.cell
    lying = about.get("lying", False)
    depth = y + ROW_IN_CELL + (-0.00001 if lying else 0.00001)
    return Placed(depth, picture, round(fx - ox * width), round(fy - oy * height))


def composed(scene: Scene, placed: list[Placed], ground: Image.Image | None = None) -> Image.Image:
    """The scene as the game draws it: the ground, or the one given, then its layers
    and what is placed among them, each by its depth."""
    width, height = scene.columns * scene.cell, scene.rows * scene.cell
    out = (ground or Image.fromarray(scene.ground)).convert("RGBA")
    drawn: list[tuple[float, int, Layer | Placed]] = [
        (layer.depth, 0, layer) for layer in scene.layers
    ]
    drawn += [(item.depth, 1, item) for item in placed]
    for _, _, what in sorted(drawn, key=lambda item: (item[0], item[1])):
        if isinstance(what, Layer):
            out.alpha_composite(Image.fromarray(window(what, 0, 0, width, height)))
        else:
            out.paste(what.image, (what.left, what.top), what.image)
    return out


def tinted(scene: Scene, image: Image.Image, cells: dict[tuple[int, int], tuple]) -> Image.Image:
    """Cells tinted on the ground, under everything the game draws over it."""
    tint = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(tint)
    cell = scene.cell
    for (x, y), colour in cells.items():
        draw.rectangle(
            (x * cell, y * cell, (x + 1) * cell - 1, (y + 1) * cell - 1), fill=(*colour, 80)
        )
    return Image.alpha_composite(image, tint)


def framed(scene: Scene, image: Image.Image, cells: dict[tuple[int, int], tuple]) -> Image.Image:
    """Cells framed inside their borders, over everything drawn."""
    out = image.copy()
    draw = ImageDraw.Draw(out)
    cell, inset = scene.cell, max(3, scene.cell // 24)
    for (x, y), colour in cells.items():
        box = (x * cell + inset, y * cell + inset, (x + 1) * cell - inset, (y + 1) * cell - inset)
        draw.rectangle(box, outline=(*colour, 255), width=max(2, scene.cell // 40))
    return out


def gridded(scene: Scene, image: Image.Image) -> Image.Image:
    """The cells' borders, a dark line under a light one, seen on any ground, and each
    cell's number at its foot, in its middle, over everything drawn (D208), as the
    game's ?debug layer draws them (debug.ts)."""
    out = image.convert("RGBA")
    lines = Image.new("RGBA", out.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(lines)
    cell = scene.cell
    width, height = scene.columns * cell, scene.rows * cell
    for colour, line in (((0, 0, 0, 140), 3), ((255, 255, 255, 205), 1)):
        for x in range(scene.columns + 1):
            draw.line(((x * cell, 0), (x * cell, height)), fill=colour, width=line)
        for y in range(scene.rows + 1):
            draw.line(((0, y * cell), (width, y * cell)), fill=colour, width=line)
    out.alpha_composite(lines)
    words = ImageDraw.Draw(out)
    font = number_font(round(NUMBER_SIZE * cell))
    for y in range(scene.rows):
        for x in range(scene.columns):
            words.text(
                ((x + 0.5) * cell, (y + FOOT_IN_CELL) * cell),
                f"{x},{y}",
                font=font,
                anchor="mm",
                fill=(255, 243, 107),
                stroke_width=2,
                stroke_fill=(0, 0, 0),
            )
    return out


def number_font(size: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    """A bold monospace face for the numbers, as the ?debug layer's, or Pillow's own."""
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/Library/Fonts/Courier New Bold.ttf",
        "C:/Windows/Fonts/courbd.ttf",
    ):
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def parts(columns: int) -> list[range]:
    """The columns of each part of a sheet: one part up to WIDEST cells wide, else
    parts of equal width that share SHARED columns with the next."""
    if columns <= WIDEST:
        return [range(columns)]
    count = -(-(columns - SHARED) // (WIDEST - SHARED))
    width = -(-(columns + SHARED * (count - 1)) // count)
    starts = [index * (width - SHARED) for index in range(count)]
    return [range(start, min(start + width, columns)) for start in starts]


def written(scene: Scene, image: Image.Image, folder: Path, name: str) -> list[Path]:
    """A sheet saved whole, or in its parts, each part named by its columns."""
    folder.mkdir(parents=True, exist_ok=True)
    found = []
    pieces = parts(scene.columns)
    for columns in pieces:
        piece = image.crop(
            (columns.start * scene.cell, 0, columns.stop * scene.cell, scene.rows * scene.cell)
        )
        suffix = "" if len(pieces) == 1 else f"-columns-{columns.start}-{columns.stop - 1}"
        path = folder / f"{scene.name}-{name}{suffix}.png"
        piece.convert("RGB").save(path)
        found.append(path)
    return found


def cells_sheets(scene: Scene, folder: Path) -> list[Path]:
    """Two sheets, the even rows and the odd ones: every cell walked on or flown over
    tinted, and a figure on each of that sheet's rows where the game draws it, flying
    over a cell only flown over, so that every figure is seen whole."""
    walked = {(int(x), int(y)) for y, x in zip(*np.nonzero(scene.walked), strict=True)}
    over = flown(scene.name)
    only_flown = {(int(x), int(y)) for y, x in zip(*np.nonzero(over), strict=True)} - walked
    tints = {cell: WALKED_TINT for cell in walked} | {cell: FLOWN_TINT for cell in only_flown}
    found = []
    for parity, name in ((0, "cells-even-rows"), (1, "cells-odd-rows")):
        placed = [
            standing_on(scene, x, y, flying=(x, y) in only_flown)
            for x, y in sorted(walked | only_flown, key=lambda c: (c[1], c[0]))
            if y % 2 == parity and (x, y) not in scene.enchanted
        ]
        ground = tinted(scene, Image.fromarray(scene.ground).convert("RGBA"), tints)
        image = framed(scene, composed(scene, placed, ground), tints)
        found += written(scene, gridded(scene, image), folder, name)
    return found


#: The colours the masks are tinted in, one after another.
MASK_COLOURS = [
    (255, 80, 80),
    (80, 200, 255),
    (255, 200, 40),
    (120, 255, 120),
    (220, 110, 255),
    (255, 140, 60),
]


def masks_sheet(scene: Scene, folder: Path) -> list[Path]:
    """The scene with every mask tinted and outlined, each named: a row's image by its
    row and how it is drawn (static, under, over), a thing by its id, its row and
    whether it is drawn under or over a figure on its row."""
    image = composed(scene, [])
    width, height = scene.columns * scene.cell, scene.rows * scene.cell
    over = np.zeros((height, width, 4), dtype=np.uint8)
    labels = []
    for index, layer in enumerate(scene.layers):
        colour = MASK_COLOURS[index % len(MASK_COLOURS)]
        alpha = window(layer, 0, 0, width, height)[..., 3] > 127
        if not alpha.any():
            continue
        edge = alpha & ~image_first.eroded(alpha, max(2, scene.cell // 32))
        over[alpha & (over[..., 3] < 70)] = (*colour, 70)
        over[edge] = (*colour, 255)
        rows, columns = np.nonzero(alpha)
        if layer.row is not None:
            words = layer.name
        else:
            how = " · over" if layer.over else " · under" if layer.under else ""
            words = f"{layer.name} · row {int(layer.depth)}{how}"
        labels.append(((int(columns.min()) + 4, int(rows.min()) + 4), words, colour))
    image.alpha_composite(Image.fromarray(over))
    image = gridded(scene, image)
    draw = ImageDraw.Draw(image)
    font = number_font(round(scene.cell * 0.2))
    for place, words, colour in labels:
        draw.text(
            place, words, font=font, fill=(*colour, 255), stroke_width=3, stroke_fill=(0, 0, 0)
        )
    return written(scene, image, folder, "masks")


def shed_sheets(scene: Scene, folder: Path) -> list[Path]:
    """The shed's things (D202, D211): its brooms, a lying one on each of the seven straw
    cells, outlined, and a hung one on each of the eight pegs; a figure on each cell of
    row 5, with the eight brooms hung behind them and with no broom; of rows 6 and 8,
    and of the doorway's two rows, each sheet's rows far enough apart that every figure
    is seen whole."""
    about = json.loads((CONTENT / "scenes" / scene.name / "scene.json").read_text())
    straw = [tuple(cell) for cell in about["straw"]]
    pegs = [(x, 4) for x in range(6, 14)]
    hung = [sprite_on(scene, "broom", peg, hung=True) for peg in pegs]
    lying = [sprite_on(scene, "broom", cell) for cell in straw]

    def row(y: int) -> list[Placed]:
        return [standing_on(scene, x, y) for x in range(scene.columns) if scene.walked[y, x]]

    sheets = {
        "things-brooms": (hung + lying, {cell: (255, 200, 40) for cell in straw}),
        "things-row-5-hung": (hung + row(5), {}),
        "things-row-5-bare": (row(5), {}),
        "things-rows-6-9": (row(6) + row(9), {}),
        "things-rows-8-10": (row(8) + row(10), {}),
    }
    found = []
    for name, (placed, frames) in sheets.items():
        image = framed(scene, composed(scene, placed), frames)
        found += written(scene, gridded(scene, image), folder, name)
    return found


def review_sheets(name: str, folder: Path) -> list[Path]:
    """Every review sheet of a scene (D208), into a folder."""
    scene = load(name)
    found = cells_sheets(scene, folder) + masks_sheet(scene, folder)
    if name == "the-broom-shed":
        found += shed_sheets(scene, folder)
    return found


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
    if len(sys.argv) == 4 and sys.argv[2] == "--sheets":
        for path in review_sheets(sys.argv[1], Path(sys.argv[3])):
            print(path)
        sys.exit(0)
    if len(sys.argv) != 2:
        print("usage: sweep.py <scene> [--sheets <folder>]")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
