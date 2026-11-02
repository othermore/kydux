#!/usr/bin/env python3
"""A scene painted first, and the figures, exported for the game (the owner's
choice of 2026-10-23): what the page draws, at CELL pixels a cell.

    tools/art/export_scene.py <scene> [scene | check | all]
    tools/art/export_scene.py figures

A scene is named by its id, and everything of it that is its own is in its
settings, art/scenes/<scene>/cut.json (D82): where its pictures are in
art/raw/ (the painting without its grid, its grid, the ground-only edit, and
an edit for each thing that opens or is picked up, without it or in another
state), its things with their boxes, rows and states, the rows of its walls'
tops, the row above which the painting is ground, the patches of its ground,
the colours it is read by, and its SOURCE.md. The cells come from the scene's
map, content/scenes/<scene>/map.txt, marked by hand, which the world plays on
too. `all`, the default, is `scene` then `check`.

`check` draws pictures of the exported scene to look at, then sweeps it
(tools/art/sweep.py) and fails when its cut-outs would show a figure a
problem: a shadow or a flower drawn in front, the lawn drawn in front, a hole.

`scene` writes content/art/scenes/<scene>/:

- ground.webp: the painting with everything that opens or is picked up taken
  out, each from the edit without it, so that no ghost of a leaf remains;
- row-<r>.webp: the full scene's width, with alpha, holding what stands up and
  has its foot on row r, cut from that ground by image_first.py, from its top
  down to the bottom edge of row r and never lower: a thing only ever covers
  the cells above its own, where a figure standing behind it is, and never the
  cells below, where a figure standing in front of it is. A scene indoors is cut
  by its settings' static things instead (`"cut": false`, D89): each is named
  with its box and its row, cut against the edit without it as a thing that
  opens is, and drawn into its row's image, never on its own; a door's own
  pixels are left to the door, so that an arch round it is static and the door
  still opens;
- <thing>-<state>.webp: each state of what opens or is picked up, cut by the
  difference between the picture of that state and the edit without the thing,
  and trimmed at its own row's bottom edge;
- art.json, which says where each image goes (the page's contract), and
  SOURCE.md.

The figures, from the painted walking sheets of art/raw/demo-src/ (three rows,
down, left and up, of three frames: a step, standing, the other step): each
figure's twelve frames in one sheet, content/art/figures/<id>.webp, four rows
(down, left, right, up) of three frames, every frame the same size, the figure
standing on the frame's foot line in its middle; figures.json says the frame's
size and its foot. A side frame a model drew facing the other way is turned by
comparing it with the demo's frames, which were turned by eye. The wizard's and
Nuri's sheets are the bases in art/figures/ that tools/art/figures.py recolours
for every look and friend, and it is run last, so that every sheet is made.
"""

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import figures as looks  # noqa: E402
import image_first  # noqa: E402
import sprites  # noqa: E402
import sweep  # noqa: E402
from scene_settings import Settings, scenes, settings  # noqa: E402

REPO = HERE.parents[1]
RAW = REPO / "art" / "raw"
WORK = RAW / "game"
FIGURES_OUT = REPO / "content" / "art" / "figures"
#: The page's pixels a cell.
CELL = 96
QUALITY = 86


FIGURES = ("wizard", "nuri", "wenna", "eldra", "dask", "ilda", "baro")
#: A figure drawn after the demo has no pieces of its own in it: its height and the
#: way its side frames face are read from a figure of its build.
REFERENCE = {"ilda": "wenna", "baro": "dask"}
#: The figures every look and friend is recoloured from (tools/art/figures.py),
#: kept in art/figures/ as their bases.
AS_BASES = {"wizard": "wizard-base-boy.webp", "nuri": "friend-base-boy.webp"}
WAYS = ("down", "left", "right", "up")


def native_box(grid: dict, box: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    """A box in cells, in the painting's own pixels."""
    gx, gy = grid["x"], grid["y"]
    x0, y0, x1, y1 = box
    return (
        round(gx["offset"] + x0 * gx["spacing"]),
        round(gy["offset"] + y0 * gy["spacing"]),
        round(gx["offset"] + x1 * gx["spacing"]),
        round(gy["offset"] + y1 * gy["spacing"]),
    )


def changed(a: np.ndarray, b: np.ndarray, threshold: float = 60) -> np.ndarray:
    """Where two pictures of the same scene differ: the colour distance, smoothed,
    over a threshold, closed over its small gaps and opened of its specks."""
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).sum(axis=2) / 3
    smooth = Image.fromarray(np.clip(d, 0, 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(1.5)
    )
    # Tripled as integers: in its own bytes the strongest differences would wrap round.
    tripled = np.array(smooth).astype(np.int16) * 3
    mask = Image.fromarray((tripled > threshold).astype(np.uint8) * 255)
    mask = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    return np.array(mask) > 127


def in_box(shape: tuple[int, int], box: tuple[int, int, int, int]) -> np.ndarray:
    """The pixels of a box, which may reach past the picture's edges."""
    inside = np.zeros(shape, dtype=bool)
    x0, y0, x1, y1 = box
    inside[max(0, y0) : max(0, y1), max(0, x0) : max(0, x1)] = True
    return inside


def filled_mask(mask: np.ndarray) -> np.ndarray:
    """A solid thing's mask with its holes filled: what no path of empty pixels
    joins to the edge, where a plank was coloured as the path behind it."""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return mask
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    part = mask[y0:y1, x0:x1]
    factor = max(1, max(part.shape) // 300)
    size = (max(1, part.shape[1] // factor), max(1, part.shape[0] // factor))
    small = np.array(Image.fromarray(part.astype(np.uint8) * 255).resize(size)) > 127
    whole = image_first.filled(small, small.size)
    grown = np.array(Image.fromarray(whole.astype(np.uint8) * 255).resize(part.shape[::-1])) > 127
    out = mask.copy()
    out[y0:y1, x0:x1] |= grown
    return out


def kept(mask: np.ndarray, share: float) -> np.ndarray:
    """The mask's pieces as large as `share` of its largest, the scraps dropped."""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return mask
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    part = mask[y0:y1, x0:x1]
    factor = 4
    size = (max(1, part.shape[1] // factor), max(1, part.shape[0] // factor))
    small = np.array(Image.fromarray(part.astype(np.uint8) * 255).resize(size)) > 60
    lab = image_first.labels(small)
    numbers, sizes = np.unique(lab[lab > 0], return_counts=True)
    if not len(sizes):
        return mask
    chosen = np.isin(lab, numbers[sizes >= share * sizes.max()])
    big = np.array(Image.fromarray(chosen.astype(np.uint8) * 255).resize(part.shape[::-1])) > 0
    near = Image.fromarray(big.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))
    out = np.zeros_like(mask)
    out[y0:y1, x0:x1] = part & (np.array(near) > 0)
    return out


def sprite_alpha(
    shown: np.ndarray,
    without: np.ndarray,
    box: tuple[int, int, int, int],
    thing: dict,
    cell: int,
    th: dict | None = None,
    marked: np.ndarray | None = None,
) -> np.ndarray:
    """A state's alpha, in the painting's own pixels, a cell `cell` pixels wide: a
    solid door's or the wand's where the state differs from the picture without
    the thing, its holes filled, its edge on its outline (D93), or, when it is
    `marked`, where Gemini painted it magenta; an open-work gate's
    by how much each pixel differs, so that the path between its bars stays the
    ground's."""
    inside = in_box(shown.shape[:2], box)
    if marked is not None:
        # Where Gemini painted the thing magenta in a picture of the scene, with
        # its outline: what an edit by hand leaves too close in colour to it.
        mask = image_first.rimmed(
            kept(image_first.marked(marked) & inside, MARK_SPECK),
            shown,
            cell,
            image_first.thresholds(th),
        )
        return (mask & inside).astype(np.float32)
    if thing["solid"]:
        mask = filled_mask(changed(shown, without) & inside)
        mask = kept(mask, 0.6 if thing.get("largest") else 0.05)
        if thing.get("hull"):
            mask = row_hull(mask) & inside
        mask = image_first.snapped(mask, shown, cell, image_first.thresholds(th), without)
        return (mask & inside).astype(np.float32)
    d = np.abs(shown.astype(np.int16) - without.astype(np.int16)).sum(axis=2) / 3
    d = Image.fromarray(np.clip(d, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    alpha = np.clip((np.array(d).astype(np.float32) - 22) / 30, 0, 1) * inside
    return alpha * kept(alpha > 0.5, 0.03)


#: A static thing masked as `pale` (D89): the stone or plaster of an arch, a
#: wall's face, light and grey against the wood and the dark round it, in the
#: HSV's value and saturation; and how far its dark outline beside it is taken.
PALE_VALUE = 0.55
PALE_SATURATION = 0.32
PALE_OUTLINE = 7


#: The smallest piece of a thing's magenta that is of it, as a share of its largest;
#: and the widest pinhole in open work's magenta that is filled, in parts of a cell.
MARK_SPECK = 0.003
MARK_PINHOLE = 0.15


#: The kinds of a static thing's image, each a row's image of its own (D95, D97).
LAYERS = ("over", "under", "cover", "hangs")


def native_area(shape: tuple[int, int], grid: dict, area: list) -> np.ndarray:
    """A polygon in cells, a list of its corners [x, y], in the painting's pixels."""
    gx, gy = grid["x"], grid["y"]
    corners = [
        (gx["offset"] + x * gx["spacing"], gy["offset"] + y * gy["spacing"]) for x, y in area
    ]
    image = Image.new("L", shape[::-1], 0)
    ImageDraw.Draw(image).polygon(corners, fill=255)
    return np.array(image) > 0


def static_alpha(
    painting: np.ndarray,
    box: tuple[int, int, int, int],
    thing: dict,
    cell: int,
    th: dict | None = None,
    grid: dict | None = None,
    edits: Path | None = None,
) -> np.ndarray:
    """A static thing's alpha in the painting's own pixels, inside its box, its edge
    on its outline (D93): where Gemini painted it flat magenta in a picture of the
    scene (`"mask": "marked"`, the picture `marked`, among the edits), its holes, the
    lines Gemini left inside it, filled, unless it is `open_work`; the box less that
    magenta (`"unmarked"`); a polygon in cells (`"polygon"`, less its
    `holes`); what is pale there and its outline (`"pale"`); or the whole box
    (`"box"`), not moved."""
    inside = in_box(painting.shape[:2], box)
    if thing["mask"] == "box":
        return inside.astype(np.float32)
    if thing["mask"] == "pale":
        hsv = np.array(Image.fromarray(painting).convert("HSV")).astype(np.float32) / 255
        pale = (hsv[..., 2] > PALE_VALUE) & (hsv[..., 1] < PALE_SATURATION) & inside
        pale = kept(pale, 0.02)
        near = Image.fromarray(pale.astype(np.uint8) * 255).filter(
            ImageFilter.MaxFilter(PALE_OUTLINE)
        )
        mask = pale | ((np.array(near) > 0) & (hsv[..., 2] < 0.38))
    elif thing["mask"] in ("marked", "unmarked"):
        # The ground is let in only where Gemini left the painting as it is: its
        # magenta is the thing, and only the outline beside it is added. An
        # open-work thing, a chandelier, keeps the floor seen between its parts;
        # what is `unmarked` is the box less the magenta, a wall less its openings.
        picture = np.array(Image.open(edits / thing["marked"]).convert("RGB"))
        paint = image_first.marked(picture) & inside
        if not thing.get("open_work"):
            paint = filled_mask(paint)
        else:
            # Open work keeps the floor between its parts, and fills the pinholes
            # its tries left, smaller than any of those gaps.
            paint = image_first.filled(paint, round((MARK_PINHOLE * cell) ** 2))
        if thing["mask"] == "marked":
            # Gemini's magenta is the thing, whole: the outline beside it comes in
            # and nothing is taken away, so that no part of it is lost and the floor
            # seen through open work stays the floor. A flame Gemini painted apart
            # from its candle is a small piece of it, and kept; only specks go. A
            # bed's quilt, drawn over its sleeper, takes only the line it touches:
            # the pillow's beside its sheet stays under the sleeper's head (D97).
            mask = kept(paint, MARK_SPECK)
            rim = image_first.lined if thing.get("cover") else image_first.rimmed
            mask = rim(mask, painting, cell, image_first.thresholds(th))
            return (mask & inside).astype(np.float32)
        mask = inside & ~paint
        mask = image_first.snapped(mask, painting, cell, image_first.thresholds(th), picture)
        if thing["mask"] == "unmarked":
            # A dark corridor in an opening is no outline to take in; the outline
            # the magenta's edge runs over is.
            mask &= ~image_first.eroded(paint, max(1, round(image_first.MARK_EDGE * cell)))
        return (mask & inside).astype(np.float32)
    else:
        mask = native_area(painting.shape[:2], grid, thing["polygon"])
        for hole in thing.get("holes", []):
            mask &= ~native_area(painting.shape[:2], grid, hole)
    mask = image_first.snapped(mask & inside, painting, cell, image_first.thresholds(th))
    if thing["mask"] == "polygon":
        # A polygon drawn by hand runs beside its outline, not on it: the line just
        # beyond its edge is the thing's too; what its holes hold is another's.
        mask = image_first.rimmed(mask, painting, cell, image_first.thresholds(th))
        for hole in thing.get("holes", []):
            mask &= ~native_area(painting.shape[:2], grid, hole)
    return (mask & inside).astype(np.float32)


def beds_of(settings: Settings) -> dict[str, dict]:
    """Where a pupil asleep in each bed lies (D91), for the page: its head's point
    on the pillow, in cells; the way the pillow lies from the quilt, right or left;
    and the row of the quilt, a static thing drawn over the sleeper."""
    beds = {}
    for bed, about in settings.data["beds"].items():
        cover = settings.things[about["cover"]]
        if not cover.get("static"):
            raise SystemExit(f"{bed}'s cover {about['cover']} is not a static thing")
        x0, _, x1, _ = cover["box"]
        head = about["head"]
        beds[bed] = {
            "head": head,
            "toward": "right" if head[0] > (x0 + x1) / 2 else "left",
            "row": cover["row"],
        }
    return beds


def aligned_rgba(image: np.ndarray, grid: dict, columns: int, rows: int) -> np.ndarray:
    """An RGBA picture in the painting's pixels moved onto the page's grid."""
    gx, gy = grid["x"], grid["y"]
    sx, sy = gx["spacing"] / CELL, gy["spacing"] / CELL
    moved = Image.fromarray(image, "RGBA").transform(
        (columns * CELL, rows * CELL),
        Image.AFFINE,
        (sx, 0, gx["offset"], 0, sy, gy["offset"]),
        resample=Image.BICUBIC,
    )
    return np.array(moved)


def webp(image: Image.Image, path: Path) -> None:
    image.save(path, "WEBP", quality=QUALITY, method=6, alpha_quality=90)


def row_hull(mask: np.ndarray) -> np.ndarray:
    """A mask filled, in every row, from its leftmost pixel to its rightmost."""
    out = mask.copy()
    for y in np.nonzero(mask.any(axis=1))[0]:
        xs = np.nonzero(mask[y])[0]
        out[y, xs[0] : xs[-1] + 1] = True
    return out


def clip_below(
    alpha: np.ndarray, row: int, top: int, cell: int = CELL, reach: float = 0.0
) -> np.ndarray:
    """The alpha of an image whose top is at `top`, emptied below row's bottom edge:
    nothing of a thing reaches into the cells below its own row, but by `reach` of a
    cell for a thing that names it (a door's threshold)."""
    out = alpha.copy()
    bottom = round((row + 1 + reach) * cell) - top
    if bottom < out.shape[0]:
        out[max(0, bottom) :] = 0
    return out


def composite(
    scene: Settings, grid: dict, statics: bool = True
) -> tuple[np.ndarray, dict[str, np.ndarray], dict[str, np.ndarray]]:
    """The painting with what opens or is picked up taken out, each from the edit
    without it, in the painting's own pixels, the static things too unless
    `statics` is false; and each thing's picture without it, and the mask of where
    it was."""
    painting = np.array(Image.open(scene.painting).convert("RGB"))
    ground = painting.copy()
    withouts, masks = {}, {}
    for name, thing in scene.things.items():
        # A static thing with no edit without it is drawn over the painting as it is.
        if thing.get("static") and (not statics or "without" not in thing):
            continue
        without = np.array(Image.open(scene.edits / thing["without"]).convert("RGB"))
        box = native_box(grid, thing["box"])
        if thing.get("whole_box"):
            mask = in_box(painting.shape[:2], box)
        else:
            mask = filled_mask(changed(painting, without) & in_box(painting.shape[:2], box))
        grown = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(21))
        # Blended in softly, so that no edge shows where the edit's tones meet the painting's.
        feather = grown.filter(ImageFilter.GaussianBlur(10))
        alpha = (np.array(feather).astype(np.float32) / 255)[..., None]
        ground = (ground * (1 - alpha) + without * alpha).astype(np.uint8)
        withouts[name], masks[name] = without, mask
    return ground, withouts, masks


def patched(floor: Image.Image, patches: list[tuple[int, int, int, int]]) -> Image.Image:
    """The ground with each patch filled from the band right above it."""
    pixels = np.array(floor.convert("RGB"))
    for x0, y0, x1, y1 in patches:
        height = y1 - y0
        above = pixels[y0 - height : y0, x0:x1].astype(np.float32)
        here = pixels[y0:y1, x0:x1].astype(np.float32)
        # The band above, laid over the patch, fading out over its last rows and its
        # sides so that no edge shows.
        fade = np.ones((height, x1 - x0), dtype=np.float32)
        edge = 6
        fade[-edge:] *= np.linspace(1, 0, edge)[:, None]
        fade[:, :edge] *= np.linspace(0, 1, edge)[None, :]
        fade[:, -edge:] *= np.linspace(1, 0, edge)[None, :]
        laid = fade[..., None]
        pixels[y0:y1, x0:x1] = (above * laid + here * (1 - laid)).astype(np.uint8)
    return Image.fromarray(pixels)


#: How wide, in the page's pixels, the playable ground fades into the margin's, and
#: how far the margin darkens outward, and how much (D83): what lies beyond the
#: playable area is a little in shadow, as a game shows what cannot be entered.
MARGIN_FADE = 20
#: How wide, in the page's pixels, a cut-out fades out before the painting's edge.
EDGE_FEATHER = 4
SHADE_REACH = 2 * CELL
SHADE = 0.8


def painted_area(scene: Settings, columns: int, rows: int) -> np.ndarray:
    """How far each pixel of the playable area, at the page's size, lies inside what
    the painting holds, in pixels: the grid may begin a little outside the painting,
    and the painting's own outermost pixels, margin.TRIM wide, are left out, since a
    model's painting often has a dark line along its edge. Below zero is outside."""
    import margin as margins

    source = Image.open(scene.painting)
    trim = margins.TRIM
    white = Image.new("RGB", source.size, (0, 0, 0))
    white.paste((255, 255, 255), (trim, trim, source.width - trim, source.height - trim))
    seen = np.array(image_first.aligned(white, scene.grid, columns, rows, CELL)).min(axis=2) > 250
    xs = np.nonzero(seen[seen.shape[0] // 2])[0]
    ys = np.nonzero(seen[:, seen.shape[1] // 2])[0]
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    yy = np.arange(rows * CELL)[:, None]
    xx = np.arange(columns * CELL)[None, :]
    return np.minimum(np.minimum(yy - y0, y1 - yy), np.minimum(xx - x0, x1 - xx)).astype(
        np.float32
    )


def with_margin(floor: Image.Image, margin: dict, inside: np.ndarray) -> Image.Image:
    """The ground with the margin round it (D83): the margin painting, joined to the
    scene's painting by tools/art/margin.py, brought onto the page's grid and a
    little in shadow outward, and the playable ground laid in it at the margin's
    cells, faded in from where the painting begins (`inside`, painted_area), the
    margin's painting showing where the playable ground has none of it."""
    left, top, right, bottom = margin["cells"]
    grid = json.loads((REPO / margin["grid"]).read_text())
    columns, rows = floor.width // CELL, floor.height // CELL
    painting = Image.open(REPO / margin["painting"])
    out = image_first.aligned(painting, grid, columns + left + right, rows + top + bottom, CELL)
    # The shade: none at the playable area's edge, SHADE at SHADE_REACH beyond it.
    pixels = np.array(out).astype(np.float32)
    height, width = pixels.shape[:2]
    gx = np.maximum(left * CELL - np.arange(width), np.arange(width) - (left + columns) * CELL)
    gy = np.maximum(top * CELL - np.arange(height), np.arange(height) - (top + rows) * CELL)
    gone = np.hypot(gx.clip(0)[None, :], gy.clip(0)[:, None])
    shade = 1 - (1 - SHADE) * np.clip(gone / SHADE_REACH, 0, 1)
    out = Image.fromarray((pixels * shade[..., None]).clip(0, 255).astype(np.uint8))
    alpha = Image.fromarray((np.clip(inside / MARGIN_FADE, 0, 1) * 255).astype(np.uint8))
    out.paste(floor.convert("RGB"), (left * CELL, top * CELL), alpha)
    return out


def scene(settings: Settings) -> Path:
    grid = settings.grid
    marks = settings.marks()
    rows, columns = len(marks), len(marks[0])
    ground, withouts, masks = composite(settings, grid)
    # The ground, cut by image_first.py into the rows of what stands up: from a
    # source folder holding the ground in place of the painting, with no box for
    # a gate or a seal, since nothing of them is left in it. A scene cut by its
    # static things (D89) keeps the painting with them as its source, and the
    # ground without them as its ground-only edit, for the sweep's checks.
    cutting = settings.data.get("cut", True)
    src = settings.src
    src.mkdir(parents=True, exist_ok=True)
    (src / "grid.json").write_text(json.dumps(grid))
    shutil.copy(settings.map, src / "marks.txt")
    if cutting:
        Image.fromarray(ground).save(src / "ground-composite.png")
        shutil.copy(settings.ground_only, src / "ground-only.png")
    else:
        Image.fromarray(composite(settings, grid, statics=False)[0]).save(
            src / "ground-composite.png"
        )
        # A scene whose things Gemini marked in magenta is checked against that
        # picture, as a cut scene is against its ground-only edit.
        marks = settings.data.get("marks")
        if marks:
            first = marks["sets"][0] if "sets" in marks else marks
            shutil.copy(REPO / first["painting"], src / "ground-only.png")
        else:
            Image.fromarray(ground).save(src / "ground-only.png")
    empty = [0, 0, 0, 0]
    # A thing lying on a flat stone, cut whole from its box, stands the stone on
    # its row; nothing is left of the things to cut.
    lying = next((t["box"] for t in settings.things.values() if t.get("whole_box")), empty)
    cut = {
        "gridded": "ground-composite.png",
        "nogrid": "ground-composite.png",
        "ground": "ground-only.png",
        "boxes": {"gate": empty, "seal": empty, "wand": list(lying)},
        "leaves": [],
        "cuts": settings.data.get("cuts", list(image_first.CUTS)),
        "castle": settings.data.get("castle", image_first.DEFAULTS["castle"]),
        "thresholds": settings.data.get("thresholds", {}),
        "grounds": settings.data.get("grounds", []),
        "kept": settings.data.get("kept", []),
        "whole": settings.data.get("whole", []),
        "rows": settings.data.get("rows", []),
    }
    (src / "cut.json").write_text(json.dumps(cut))
    field: dict = {"layers": []}
    if cutting:
        keep = image_first.TILE
        image_first.TILE = CELL
        try:
            field = json.loads(image_first.build(src, settings.cut).read_text())
        finally:
            image_first.TILE = keep
    out = settings.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    width = columns * CELL
    floor = image_first.aligned(Image.fromarray(ground), grid, columns, rows, CELL)
    floor = patched(floor, settings.patches)
    margin = settings.data.get("margin")
    # Where the painting holds the playable area: a cut-out fades out before its edge,
    # so that nothing of what lies outside the painting is drawn (D83).
    inside = painted_area(settings, columns, rows) if margin else None
    if margin:
        floor = with_margin(floor, margin, inside)
    webp(floor, out / "ground.webp")
    # Each row's image, as a strip of the scene's width from its top down to the
    # row's bottom edge: what image_first.py cut, and the static things after.
    # The static things' strips are their rows' images of their own, `static` in
    # art.json, so that the sweep looks at what the cut made apart from them (D89).
    # A row's images are also told apart by where they are drawn among the figures
    # (D95): `under`, over whoever stands on the row itself, a door's or an arch's;
    # `over`, over every figure, a wall seen from above; `cover`, a bed's, over
    # whoever sleeps in it (D97); and `hangs`, what hangs on a wall over the cells
    # below it and stands on none of them, a torch.
    strips: dict[tuple[int, bool, str], tuple[int, Image.Image]] = {}
    under_rows = set(settings.data.get("under", []))

    def into_row(
        row: int, sprite: Image.Image, x: int, y: int, static: bool = False, layer: str = ""
    ) -> None:
        key = (row, static, layer)
        top, strip = strips.get(key, (y, None))
        top = min(top, y)
        bottom = max((row + 1) * CELL, y + sprite.height)
        grown = Image.new("RGBA", (width, bottom - top), (0, 0, 0, 0))
        if strip is not None:
            grown.alpha_composite(strip, (0, strips[key][0] - top))
        grown.alpha_composite(sprite, (x, y - top))
        strips[key] = (top, grown)

    for layer in field["layers"]:
        if not layer["name"].startswith("row "):
            continue
        row = layer["row"]
        crop = Image.open(settings.cut / layer["file"]).convert("RGBA")
        x, y = layer["at"]
        crop = crop.crop((0, 0, crop.width, min(crop.height, (row + 1) * CELL - y)))
        into_row(row, crop, x, y, layer="under" if row in under_rows else "")
    # Each thing's states, at the page's size: the picture of the state where it
    # differs from the picture without the thing.
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    # A cell in the painting's own pixels, and the colours its outlines are read by.
    spacing = round(grid["x"]["spacing"])
    th = settings.data.get("thresholds")
    # Where a thing that opens or is picked up lies, which no static thing takes.
    doors = np.zeros(painting.shape[:2], dtype=bool)
    for name, thing in settings.things.items():
        if not thing.get("static"):
            doors |= masks[name]
    doors = (
        np.array(Image.fromarray(doors.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9)))
        > 0
    )
    things = {}
    for name, thing in settings.things.items():
        if thing.get("static"):
            native = native_box(grid, thing["box"])
            box = tuple(round(v * CELL) for v in thing["box"])
            if name in withouts:
                alpha = sprite_alpha(painting, withouts[name], native, thing, spacing, th)
            else:
                alpha = static_alpha(painting, native, thing, spacing, th, grid, settings.edits)
            alpha = alpha * ~doors
            rgba = np.dstack([painting, (alpha * 255).astype(np.uint8)])
            sprite = aligned_rgba(rgba, grid, columns, rows)[box[1] : box[3], box[0] : box[2]]
            sprite = sprite.copy()
            below = clip_below(
                sprite[..., 3] / 255, thing["row"], box[1], reach=thing.get("reach", 0.0)
            )
            sprite[..., 3] = (below * 255).astype(np.uint8)
            # A static thing's image ends at its row's bottom edge, as a row's does.
            reach = thing.get("reach", 0.0)
            sprite = sprite[: max(1, round((thing["row"] + 1 + reach) * CELL) - box[1])]
            layer = next((k for k in LAYERS if thing.get(k)), "")
            into_row(thing["row"], Image.fromarray(sprite, "RGBA"), box[0], box[1], True, layer)
            continue
        without = withouts[name]
        native = native_box(grid, thing["box"])
        box = tuple(round(v * CELL) for v in thing["box"])
        states = {}
        left, top = box[0], box[1]
        for state, picture in thing["states"].items():
            states[state] = f"{name}-{state}.webp"
            if picture is None:
                # Nothing is drawn: the ground under it is the thing's absence.
                webp(Image.new("RGBA", (1, 1), (0, 0, 0, 0)), out / states[state])
                continue
            if picture == "painting":
                shown = painting
                marks = None
                if "marked" in thing:
                    marks = np.array(Image.open(settings.edits / thing["marked"]).convert("RGB"))
                alpha = sprite_alpha(painting, without, native, thing, spacing, th, marks)
            elif picture == "without":
                # The open door is the dark where the closed door was.
                shown, alpha = without, sprite_alpha(painting, without, native, thing, spacing, th)
            else:
                shown = np.array(Image.open(settings.edits / picture).convert("RGB"))
                alpha = sprite_alpha(shown, without, native, thing, spacing, th)
            rgba = np.dstack([shown, (alpha * 255).astype(np.uint8)])
            sprite = aligned_rgba(rgba, grid, columns, rows)[box[1] : box[3], box[0] : box[2]]
            sprite = sprite.copy()
            reach = thing.get("reach", 0.0)
            below = clip_below(sprite[..., 3] / 255, thing["row"], top, reach=reach)
            sprite[..., 3] = (below * 255).astype(np.uint8)
            webp(Image.fromarray(sprite, "RGBA"), out / states[state])
        things[name] = {"row": thing["row"], "left": left, "top": top, "states": states}
        if thing.get("under"):
            things[name]["under"] = True
        if "rune" in thing:
            things[name]["rune"] = thing["rune"]
        # The cell it is painted on, for a level that lays it on another (D85).
        if "at" in thing:
            things[name]["at"] = thing["at"]
    rows_out = []
    for row, static, layer in sorted(strips):
        top, strip = strips[(row, static, layer)]
        # Each piece was clipped at its row's bottom edge, or its reach, before.
        pixels = np.array(strip)
        alpha = pixels[..., 3] / 255
        if inside is not None:
            alpha *= np.clip(inside[top : top + alpha.shape[0]] / EDGE_FEATHER, 0, 1)
        pixels[..., 3] = (alpha * 255).astype(np.uint8)
        if not pixels[..., 3].any():
            continue
        image = f"row-{row}{'-static' if static else ''}{'-' + layer if layer else ''}.webp"
        webp(Image.fromarray(pixels), out / image)
        rows_out.append(
            {
                "row": row,
                "image": image,
                "top": top,
                **({"static": True} if static else {}),
                **({layer: True} if layer else {}),
            }
        )
    art = {
        "cell": CELL,
        "size": [columns, rows],
        "ground": "ground.webp",
        # The ground reaches past the playable area by the margin's cells, its
        # playable corner at `origin` in its own pixels (D83).
        **(
            {
                "margin": margin["cells"],
                "origin": [margin["cells"][0] * CELL, margin["cells"][1] * CELL],
            }
            if margin
            else {}
        ),
        "rows": rows_out,
        "things": things,
        **({"beds": beds_of(settings)} if settings.data.get("beds") else {}),
        # The cells a figure is drawn lower on, behind what stands below it (D95).
        **({"lowered": settings.data["lowered"]} if settings.data.get("lowered") else {}),
        "source": "SOURCE.md",
    }
    (out / "art.json").write_text(json.dumps(art, indent=2) + "\n")
    (out / "SOURCE.md").write_text(settings.data["source"])
    return out / "art.json"


FIGURES_SOURCE = """# The figures

Kydux's own art, made for the game and under the GNU GPL, version 3 or
later, like the rest of it.

- Drawn by Gemini 3 Pro Image (`gemini-3-pro-image`) as walking sheets, from
  `tools/art/prompts/demo-wizard.md`, `demo-nuri.md`, `demo-wenna.md`,
  `demo-eldra.md`, `demo-dask.md`, `demo-ilda.md` and `demo-baro.md`, each
  with the style-B wizard as its reference (`chibi-b-gemini.md`); cut by
  `tools/art/sprites.py` and put together by `tools/art/export_scene.py`,
  Ilda's sized and turned by Wenna's, a figure of her build, and Baro's by
  Dask's.
- The wizard's girl and Nuri's are Gemini's edits of those sheets
  (`figure-wizard-girl.md`, `figure-nuri-girl.md`), and the wizard's
  casting frames are Gemini's edits of the wizard's two sheets
  (`figure-cast-boy.md`, `figure-cast-girl.md`), each put back on its grid
  by `tools/art/figures.py`. The base sheets are in `art/figures/`.
- `wizard-<look>.webp` for each look of the creator, its walking rows and
  its casting rows, and `nuri-a`, `nuri-b`, `teku-a` and `teku-b`, each
  friend in two sets of colours (D90), are those bases recoloured by
  `tools/art/figures.py`: the robe, the hat, its band, the hair and the
  skin in the look's colours (`app/src/engine/looks.ts`), their shading
  kept.
"""


#: The side frames the comparison with the demo leaves wrong, put right by eye:
#: a frame to turn, and a standing side frame that faces the viewer, taken from
#: the first frame instead.
SIDE_FIXES = {
    "wenna": {"standing_from": 0},
    "dask": {"standing_from": 0},
}


def figure_frames(name: str, scale: float) -> dict[str, list[Image.Image]]:
    """A figure's frames at `scale` times the demo's, each side frame turned to
    match the demo's own, which were turned by eye."""
    demo = RAW / "demo" / "pieces"
    reference = REFERENCE.get(name, name)
    standing = Image.open(demo / f"{reference}-down-1.png")
    height = round(standing.height * scale)
    cut_dir = WORK / "figures" / name
    sprites.figures(RAW / "demo-src" / f"demo-{name}.png", cut_dir, name, height)
    frames: dict[str, list[Image.Image]] = {}
    for way in ("down", "left", "up"):
        frames[way] = []
        for index in range(3):
            frame = Image.open(cut_dir / f"{name}-{way}-{index}.png").convert("RGBA")
            if way == "left":
                target = Image.open(demo / f"{reference}-left-{index}.png").convert("RGBA")
                small = frame.resize(target.size, Image.LANCZOS)
                flipped = small.transpose(Image.FLIP_LEFT_RIGHT)
                a, b, t = (np.array(x).astype(np.int16) for x in (small, flipped, target))
                if np.abs(b - t).mean() < np.abs(a - t).mean():
                    frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            frames[way].append(frame)
    fix = SIDE_FIXES.get(name, {})
    for index in fix.get("flip", ()):
        frames["left"][index] = frames["left"][index].transpose(Image.FLIP_LEFT_RIGHT)
    if "standing_from" in fix:
        frames["left"][1] = frames["left"][fix["standing_from"]]
    frames["right"] = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames["left"]]
    return frames


#: The figures at twice the demo's size: the demo drew a cell 48 pixels across.
FIGURE_SCALE = CELL / 48
#: The space under the feet in a frame, for a shadow the page may draw.
FOOT = 6


def figures() -> Path:
    every = {name: figure_frames(name, FIGURE_SCALE) for name in FIGURES}
    # A figure drawn after the demo is fitted into the frame the others make, so
    # that every sheet keeps the frame's size and the bases stay its own.
    others = [
        f
        for name, frames in every.items()
        if name not in REFERENCE
        for way in frames.values()
        for f in way
    ]
    widest = max(f.width for f in others)
    for name in REFERENCE:
        own = max(f.width for way in every[name].values() for f in way)
        if own > widest:
            factor = widest / own
            every[name] = {
                way: [
                    f.resize((round(f.width * factor), round(f.height * factor)), Image.LANCZOS)
                    for f in frames
                ]
                for way, frames in every[name].items()
            }
    width = max(f.width for frames in every.values() for way in frames.values() for f in way)
    height = max(f.height for frames in every.values() for way in frames.values() for f in way)
    width, height = width + 4, height + FOOT + 2
    out = FIGURES_OUT
    out.mkdir(parents=True, exist_ok=True)
    for name, frames in every.items():
        sheet = Image.new("RGBA", (width * 3, height * len(WAYS)), (0, 0, 0, 0))
        for r, way in enumerate(WAYS):
            for c, frame in enumerate(frames[way]):
                x = c * width + (width - frame.width) // 2
                y = r * height + height - FOOT - frame.height
                sheet.alpha_composite(frame, (x, y))
        # Each frame over its row's standing frame, and each walking row made from
        # it, so that the figure walks moving its feet alone (or its dress, floating).
        sheet = looks.steadied(sheet, (width, height))
        sheet = looks.walking(
            sheet, (width, height), looks.FLOATING.get(name), looks.KEPT_FRAME.get(name)
        )
        # A base is recoloured into the looks' sheets, which are drawn smaller then;
        # every other figure is drawn smaller here (D98).
        if name in AS_BASES:
            webp(sheet, looks.BASE_DIR / AS_BASES[name])
        else:
            webp(looks.sized(sheet, (width, height), FOOT), out / f"{name}.webp")
    wizard = every["wizard"]["down"][1].height
    data = {
        "cell": CELL,
        "frame": [width, height],
        "foot": FOOT,
        "height_cells": round(wizard * looks.SIZE / CELL, 2),
        "ways": list(WAYS),
        "frames": 3,
        "standing": 1,
        "figures": [name for name in FIGURES if name not in AS_BASES],
    }
    (out / "figures.json").write_text(json.dumps(data, indent=2) + "\n")
    # Every look's sheet and the friends', from the bases, and their names in the list.
    looks.make()
    (out / "SOURCE.md").write_text(FIGURES_SOURCE)
    return out / "figures.json"


def main(arguments: list[str]) -> int:
    if arguments[:1] == ["figures"]:
        print(figures().relative_to(REPO))
        return 0
    if not arguments or arguments[0] not in scenes():
        print(f"usage: export_scene.py <{' | '.join(scenes())}> [scene | check | all]")
        print("       export_scene.py figures")
        return 2
    settings_of = settings(arguments[0])
    what = arguments[1] if len(arguments) > 1 else "all"
    if what in ("scene", "all"):
        print(scene(settings_of).relative_to(REPO))
    if what in ("check", "all"):
        for path in checks(settings_of):
            print(path.relative_to(REPO))
        # The wizard on every cell walked on, and the cut's problems it would show.
        if sweep.main(settings_of.id) != 0:
            return 1
    return 0


def draw(
    folder: Path,
    figures_folder: Path = FIGURES_OUT,
    standing: list[tuple[str, int, int]] = (),
    states: dict[str, str] | None = None,
) -> Image.Image:
    """The exported scene as the page draws it: the ground, then row by row what
    stands up and has its foot there, the things in their states, and the
    figures standing on that row; each figure is `(name, x, y)` in cells."""
    art = json.loads((folder / "art.json").read_text())
    fig = json.loads((figures_folder / "figures.json").read_text())
    cell = art["cell"]
    picture = Image.open(folder / art["ground"]).convert("RGBA")
    # The playable part of a ground painted with a margin (D83).
    ox, oy = art.get("origin", [0, 0])
    columns, rows = art["size"]
    picture = picture.crop((ox, oy, ox + columns * cell, oy + rows * cell))
    width, height = fig["frame"]
    sheets = {
        name: Image.open(figures_folder / f"{name}.webp").convert("RGBA")
        for name, _, _ in standing
    }
    by_row: dict[int, list[tuple[Image.Image, tuple[int, int]]]] = {}
    for layer in art["rows"]:
        image = Image.open(folder / layer["image"]).convert("RGBA")
        by_row.setdefault(layer["row"], []).append((image, (0, layer["top"])))
    for name, thing in art["things"].items():
        state = (states or {}).get(name, next(iter(thing["states"])))
        image = Image.open(folder / thing["states"][state]).convert("RGBA")
        by_row.setdefault(thing["row"], []).append((image, (thing["left"], thing["top"])))
    for name, x, y in standing:
        # The standing frame, facing down, its feet on the cell's lower middle.
        frame = sheets[name].crop((width, 0, 2 * width, height))
        left = x * cell + (cell - width) // 2
        top = (y + 1) * cell - cell // 8 - (height - fig["foot"])
        by_row.setdefault(y, []).append((frame, (left, top), "figure"))
    for row in sorted(by_row):
        # What stands on a row is drawn before the figures standing on it.
        for entry in sorted(by_row[row], key=lambda e: len(e) == 3):
            image, (left, top) = entry[0], entry[1]
            picture.alpha_composite(image, (max(0, left), max(0, top)))
    return picture


def checks(settings: Settings, out: Path = RAW / "game-check") -> list[Path]:
    """Pictures of the exported scene with figures standing behind and in front of
    what stands up, at the levels' starts, and the things open and shut, each named
    after the scene."""
    marks = settings.marks()
    rows, columns = len(marks), len(marks[0])
    walked = sweep.walks(settings.id)
    walk = {(x, y) for y, x in zip(*np.nonzero(walked), strict=True)}
    # Behind: a cell walked on just above a tree, a rock or a fence; in front: just below.
    behind, front = [], []
    for y, row in enumerate(marks):
        for x, ch in enumerate(row):
            if ch in "trf":
                if (x, y - 1) in walk:
                    behind.append((sweep.LOOK, x, y - 1))
                if (x, y + 1) in walk:
                    front.append(("nuri-a", x, y + 1))
    starts = []
    for path in sorted((REPO / "content" / "levels").glob("*/level.json")):
        level = json.loads(path.read_text())
        if level.get("scene") == settings.id and "start" in level:
            starts.append((sweep.LOOK, *level["start"]))
    opened = {name: "open" for name, thing in settings.things.items() if "open" in thing["states"]}
    out.mkdir(parents=True, exist_ok=True)
    written = []
    cell = CELL
    for name, standing, states in (
        ("behind", behind[::2], None),
        ("front", front[::2], None),
        ("starts", starts, None),
        ("open", starts, opened),
    ):
        picture = draw(settings.out, standing=standing, states=states)
        target = out / f"{settings.id}-{name}.png"
        small = picture.resize((picture.width // 2, picture.height // 2), Image.LANCZOS)
        small.save(target)
        written.append(target)
    # A close look at each thing, its box grown by two cells, shut and open, with a
    # figure in front of it and one behind.
    for name, thing in settings.things.items():
        x0, y0, x1, y1 = thing["box"]
        box = (
            max(0, int(x0) - 2),
            max(0, int(y0) - 2),
            min(columns, int(np.ceil(x1)) + 2),
            min(rows, int(np.ceil(y1)) + 2),
        )
        middle = int((x0 + x1) / 2)
        near = [(sweep.LOOK, middle, box[3] - 2), ("nuri-a", middle, box[1] + 1)]
        crop = tuple(v * cell for v in box)
        shut = draw(settings.out, standing=near).crop(crop)
        open_ = draw(settings.out, standing=near, states=opened).crop(crop)
        both = Image.new("RGBA", (shut.width * 2 + 12, shut.height), (20, 20, 26, 255))
        both.alpha_composite(shut, (0, 0))
        both.alpha_composite(open_, (shut.width + 12, 0))
        target = out / f"{settings.id}-close-{name}.png"
        both.save(target)
        written.append(target)
    return written


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
