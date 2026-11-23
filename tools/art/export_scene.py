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

`check` draws pictures of the exported scene to look at, among them
states-<scene>.png, each door's states over the ground at three times their
size with their edges marked (D113), doors-<scene>.png, each state of every
thing composed as the page draws the scene, and <hour>-<scene>.png, a ground at
another hour with every row and thing over it (D126), then sweeps it
(tools/art/sweep.py) and fails when its cut-outs would show a figure a problem: a
shadow or a flower drawn in front, the lawn drawn in front, a hole.

`scene` writes content/art/scenes/<scene>/:

- ground.webp: the painting with everything that opens or is picked up taken
  out, each from the edit without it, so that no ghost of a leaf remains; and
  ground-<hour>.webp, for a scene painted at night that has its picture by
  morning (D126): where that picture fits the painting whole (`hours` in the
  settings' `sources`), the ground cut from it, what the ground takes out of the
  painting given that hour's light (`relit`), with a twin of every row's image,
  row-<r>-...-<hour>.webp, and of every thing's state, <thing>-<state>-<hour>.webp,
  cut with the same masks from it; where it is taken in boxes (`grounds`), the
  same ground with what that picture mended (its sky, its windows, its outside)
  laid over it, and row-<r>-...-<hour>.webp for a row named in `rows_morning`,
  whose image holds some of that outside (a wall's strip running out over the
  grass);
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
  and trimmed at its own row's bottom edge; a door's leaf swung open is cut by
  the polygon traced round it (`leaf`), and its closed leaf within its
  doorway's (`doorway`), D113;
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
import scene_settings  # noqa: E402
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


#: How a thing's mask is read from two of a scene's pictures (D148): the colour distance
#: over which a pixel differs, smoothed little where a line changed and much where a
#: plank is coloured nearly as the floor; the pieces thinner than `speck` pixels, the
#: lines a model's edit moved a little, which are not the thing; the holes of no more
#: than `holes` pixels, which are of the thing; and how far gaps in it are closed. A
#: static thing that Gemini painted flat magenta is cut with a high threshold, and takes
#: the outline beside it (`rim`). A state of a thing lying in the floor may say how wide,
#: in cells, its edge dies away inside its outline (`feather`, D287); no other mask is
#: anything but 0 or 1 (D155).
DIFFERENCE = {"threshold": 26, "soft": 13, "speck": 8, "holes": 3000, "close": 0}
#: How far each of the two distances is smoothed, in the painting's pixels.
DIFFERENCE_BLUR = (1.2, 5.0)


def difference_mask(
    shown: np.ndarray, base: np.ndarray, box: tuple[int, int, int, int], own: dict | None = None
) -> np.ndarray:
    """A thing's mask as the difference between two of a scene's pictures, in the
    painting's own pixels, within its box (D148): the colour distance smoothed and
    thresholded, cleaned of specks and of what is thinner than a thing, its holes closed
    up to a size, what its outline closes in taken in (D155), and its pieces kept when
    they are not scraps. It is 0 or 1 at every pixel; the page's resampling softens its
    edge over one pixel."""
    options = {**DIFFERENCE, **(own or {})}
    height, width = base.shape[:2]
    x0, y0, x1, y1 = max(0, box[0]), max(0, box[1]), min(width, box[2]), min(height, box[3])
    crop = (slice(y0, y1), slice(x0, x1))
    distance = np.abs(shown[crop].astype(np.int16) - base[crop].astype(np.int16)).sum(axis=2) / 3
    plain = Image.fromarray(np.clip(distance, 0, 255).astype(np.uint8))
    sharp, soft = (np.array(plain.filter(ImageFilter.GaussianBlur(r))) for r in DIFFERENCE_BLUR)
    region = (sharp > options["threshold"]) | (soft > options["soft"])
    # Inside, the wide smoothing says what is the thing, a plank nearly the floor's colour;
    # at its edge, the narrow one, so that no floor comes with it.
    edge = image_first.eroded(region, round(DIFFERENCE_BLUR[1]) + 1)
    differs = edge | (region & (sharp > options["soft"]))
    speck = options["speck"]
    # What survives the opening is the thing; its corners and its thin parts come back
    # from what is near it, so that the cleaning rounds nothing off.
    solid = image_first.dilated(image_first.eroded(differs, speck), speck)
    mask = differs & image_first.dilated(solid, speck + 2)
    # A stone painted nearly the floor's colour leaves a gap in an arch's ring: `close`
    # closes the gaps of up to twice its pixels, which the arch's opening is far wider than.
    if options.get("close"):
        reach = options["close"]
        mask = image_first.eroded(image_first.dilated(mask, reach), reach)
    mask = image_first.filled(mask, options["holes"])
    mask = closed_in(mask, differs, options["holes"], speck)
    mask = kept(mask, options.get("scraps", 0.02))
    out = np.zeros(base.shape[:2], dtype=bool)
    out[crop] = mask
    return out


def feathered(
    shown: np.ndarray,
    base: np.ndarray,
    box: tuple[int, int, int, int],
    own: dict,
    width: float,
) -> np.ndarray:
    """A light lying in the floor, its mask by difference softened inward (D287): the mask
    made as difference_mask makes it, 0 or 1, read `width` pixels beyond the box; then its
    alpha at a pixel is that pixel's depth inside the mask's outline over `width`, 1 from
    there inward, so that the light dies away with no line and no loose dot at its rim. The
    box cuts the picture after, and an edge it makes on a wall stays sharp."""
    grow = int(np.ceil(width))
    wide = (box[0] - grow, box[1] - grow, box[2] + grow, box[3] + grow)
    mask = difference_mask(shown, base, wide, own)
    height, picture_width = base.shape[:2]
    x0, y0 = max(0, wide[0]), max(0, wide[1])
    x1, y1 = min(picture_width, wide[2]), min(height, wide[3])
    alpha = np.zeros(base.shape[:2], dtype=np.float32)
    depth = image_first.depth_inside(mask[y0:y1, x0:x1], width)
    alpha[y0:y1, x0:x1] = np.minimum(1, depth / width)
    return alpha


def closed_in(mask: np.ndarray, differs: np.ndarray, holes: int, speck: int) -> np.ndarray:
    """A mask with what its thing's outline closes in (D155): the thin lines that differ
    and touch the mask, its own outline where the cleaning took it, close the parts whose
    colour is nearly the floor's, a statue's robe by a wall; each part they close, no
    larger than `holes`, is the thing's, with the outline beside it. A line the edit
    moved apart from the thing closes nothing in."""
    pieces = image_first.labels(differs | mask)
    ours = np.unique(pieces[mask & (pieces > 0)])
    outlined = np.isin(pieces, ours) & (pieces > 0)
    enclosed = image_first.filled(outlined, holes) & ~outlined
    if not enclosed.any():
        return mask
    lined = outlined & image_first.dilated(enclosed, speck + 2)
    return image_first.filled(mask | enclosed | lined, holes)


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
        # A thing set in among others, a book on a full shelf, whose picture without
        # it differs only in its own box, is that difference: its outline is in it,
        # and snapping would run on into the shelf's lines (`snap` false).
        if thing.get("snap", True):
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


#: How many times larger a traced polygon is drawn before it is averaged down to the
#: painting's size, so that its edge is soft over one pixel (D113).
SOFT = 4


def soft_area(shape: tuple[int, int], grid: dict, area: list) -> np.ndarray:
    """A polygon in cells as an alpha in the painting's pixels: 1 inside, 0 outside,
    and between over one pixel at its edge, drawn SOFT times larger and averaged
    down within its own box."""
    gx, gy = grid["x"], grid["y"]
    corners = [
        (gx["offset"] + x * gx["spacing"], gy["offset"] + y * gy["spacing"]) for x, y in area
    ]
    height, width = shape
    xs, ys = [x for x, _ in corners], [y for _, y in corners]
    x0, y0 = max(0, int(np.floor(min(xs))) - 1), max(0, int(np.floor(min(ys))) - 1)
    x1, y1 = min(width, int(np.ceil(max(xs))) + 1), min(height, int(np.ceil(max(ys))) + 1)
    alpha = np.zeros(shape, dtype=np.float32)
    if x1 <= x0 or y1 <= y0:
        return alpha
    large = Image.new("L", ((x1 - x0) * SOFT, (y1 - y0) * SOFT), 0)
    # Each small pixel taken by its middle, half a small pixel off its corner.
    ImageDraw.Draw(large).polygon(
        [((x - x0) * SOFT - 0.5, (y - y0) * SOFT - 0.5) for x, y in corners], fill=255
    )
    cells = np.array(large).astype(np.float32) / 255
    alpha[y0:y1, x0:x1] = cells.reshape(y1 - y0, SOFT, x1 - x0, SOFT).mean(axis=(1, 3))
    return alpha


#: How far a static thing's hole reaches beyond the pixels its polygon touches, in
#: the painting's pixels: the bicubic kernel's reach when aligned_rgba moves it
#: onto the page's grid.
HOLE_REACH = 2


def holed(shape: tuple[int, int], grid: dict, hole: list) -> np.ndarray:
    """A hole's pixels: every one its polygon touches (`soft_area` above 0), grown by
    HOLE_REACH."""
    return image_first.dilated(soft_area(shape, grid, hole) > 0, HOLE_REACH)


def state_alpha(
    settings: Settings,
    thing: dict,
    picture: str | dict,
    painting: np.ndarray,
    without: np.ndarray,
    native: tuple[int, int, int, int],
    th: dict | None,
) -> tuple[np.ndarray, np.ndarray]:
    """A state's picture and its alpha, in the painting's own pixels. A door's leaf
    swung open is the polygon traced round it on its picture (`leaf`), nothing else;
    a door's closed leaf is the painting within its doorway's polygon (`doorway`),
    the arch's inner line and the threshold, so that no line of the wall beside the
    arch comes with it and nothing of the open doorway shows through it (D113); and
    a state painted on a picture that differs from its edit beyond the thing, a book
    glowing in a model's picture of its shelf, is the polygon traced round the thing
    on its outline (`traced`), so that nothing of the shelf comes with it."""
    grid = settings.grid
    spacing = round(grid["x"]["spacing"])
    if picture == "painting":
        if "doorway" in thing:
            return painting, soft_area(painting.shape[:2], grid, thing["doorway"])
        marks = None
        if "marked" in thing:
            marks = np.array(Image.open(settings.edits / thing["marked"]).convert("RGB"))
        return painting, sprite_alpha(painting, without, native, thing, spacing, th, marks)
    if picture == "without":
        # The open door is the dark where the closed door was.
        return without, sprite_alpha(painting, without, native, thing, spacing, th)
    if isinstance(picture, dict):
        shown = np.array(Image.open(settings.edits / picture["picture"]).convert("RGB"))
        if "diff" in picture:
            # A state cut by the difference against the scene's base (D148), its box
            # its own where the state lies in a part of the thing's.
            within = native_box(grid, picture["box"]) if "box" in picture else native
            feather = picture["diff"].get("feather")
            if feather:
                width = feather * spacing
                return shown, feathered(shown, painting, within, picture["diff"], width)
            mask = difference_mask(shown, painting, within, picture["diff"])
            return shown, mask.astype(np.float32)
        traced = picture.get("leaf", picture.get("traced"))
        if traced is not None:
            # A double door's two leaves are two polygons, a list of them.
            parts = traced if isinstance(traced[0][0], list) else [traced]
            areas = [soft_area(painting.shape[:2], grid, part) for part in parts]
            return shown, np.maximum.reduce(areas)
        # A state cut from a picture against its own edit without it: a book
        # glowing as the spell takes it.
        apart = np.array(Image.open(settings.edits / picture["without"]).convert("RGB"))
        own = {**thing, "solid": picture.get("solid", thing["solid"])}
        return shown, sprite_alpha(shown, apart, native, own, spacing, th)
    shown = np.array(Image.open(settings.edits / picture).convert("RGB"))
    return shown, sprite_alpha(shown, without, native, thing, spacing, th)


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
    magenta (`"unmarked"`); where a picture with it gone or painted flat magenta differs
    from the painting (`"difference"`, D148), or several such pictures, each of a part;
    a polygon in cells (`"polygon"`, less its
    `holes`, with its `fixed` parts, and only its own line when `lined`); what
    is pale there and its outline (`"pale"`); or the whole box (`"box"`), not
    moved."""
    inside = in_box(painting.shape[:2], box)
    if thing["mask"] == "box":
        return inside.astype(np.float32)
    if thing["mask"] == "difference":
        # What a figure walks behind, by the picture with it gone or marked (D148); a
        # thing whose parts two edits marked, each one part, a torch's bracket and its
        # flame, is the union of their differences.
        pictures = thing["picture"] if isinstance(thing["picture"], list) else [thing["picture"]]
        mask = np.zeros(painting.shape[:2], dtype=bool)
        for picture in pictures:
            gone = np.array(Image.open(edits / picture).convert("RGB"))
            mask |= difference_mask(gone, painting, box, thing.get("diff"))
        # Gemini's magenta ends inside the thing's outline, which is the thing's too (D93).
        # An arch round a dark opening takes only its own line (`lined`): the opening's
        # dark beside its stones is no outline, and a mark seen there is not under it
        # (D181). An arch in a wall of stones takes the line at the ends of each of its
        # parts (`"lined": "parts"`): the side of its opening too, and not the wall's
        # joint that runs beside its outer side.
        if (thing.get("diff") or {}).get("rim"):
            lined = thing.get("lined")
            if lined:
                mask = image_first.lined(
                    mask, painting, cell, image_first.thresholds(th), parts=lined == "parts"
                )
            else:
                mask = image_first.rimmed(mask, painting, cell, image_first.thresholds(th))
            mask &= inside
        return mask.astype(np.float32)
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
            # A counter marked `lined` takes its own line and not the wands' ends
            # standing just behind it.
            own = thing.get("cover") or thing.get("lined")
            rim = image_first.lined if own else image_first.rimmed
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
        # A hole takes every pixel its polygon touches, and the reach of the page's
        # resampling beyond them: traced from a leaf whose edge is soft over one
        # pixel (D113), it leaves nothing of the wall on that edge at the page's size.
        for hole in thing.get("holes", []):
            mask &= ~holed(painting.shape[:2], grid, hole)
    if thing.get("lined"):
        # A polygon drawn just inside its outline, where a light edge of the floor
        # beyond the line would be taken with it, takes its own line and no more.
        mask = image_first.lined(mask & inside, painting, cell, image_first.thresholds(th))
    else:
        mask = image_first.snapped(mask & inside, painting, cell, image_first.thresholds(th))
    if thing["mask"] == "polygon":
        # A polygon drawn by hand runs beside its outline, not on it: the line just
        # beyond its edge is the thing's too; what its holes hold is another's.
        if not thing.get("lined"):
            mask = image_first.rimmed(mask, painting, cell, image_first.thresholds(th))
        for hole in thing.get("holes", []):
            mask &= ~holed(painting.shape[:2], grid, hole)
        # A part with no outline between it and the floor beyond, a stone's sunlit
        # top, is the polygon's as drawn: the floor would be let into it.
        for part in thing.get("fixed", []):
            mask |= native_area(painting.shape[:2], grid, part)
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


def shrunk(sprite: np.ndarray, scale: float) -> np.ndarray:
    """A thing's sprite drawn at `scale` of its painted size, standing where it was
    painted, on the middle of its bottom, in a sprite of the same size: a book
    painted too big is drawn smaller on the picture without it."""
    ys, xs = np.nonzero(sprite[..., 3])
    if not len(ys):
        return sprite
    foot_x, foot_y = (xs.min() + xs.max() + 1) / 2, ys.max() + 1
    height, width = sprite.shape[:2]
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    small = Image.fromarray(sprite, "RGBA").resize(size, Image.LANCZOS)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    out.alpha_composite(small, (round(foot_x * (1 - scale)), round(foot_y * (1 - scale))))
    return np.array(out)


def without_of(scene: Settings, grid: dict, thing: dict) -> np.ndarray:
    """A thing's picture without it: an edit of the scene, or, where an edit also
    changed what lies beside the thing, the painting with the thing's own box taken
    from that edit, sharp (`{"picture", "box", "from"}`, the box in cells)."""
    without = thing["without"]
    if isinstance(without, str):
        return np.array(Image.open(scene.edits / without).convert("RGB"))
    picture = np.array(Image.open(scene.edits / without["picture"]).convert("RGB"))
    source = np.array(Image.open(scene.edits / without["from"]).convert("RGB"))
    x0, y0, x1, y1 = native_box(grid, without["box"])
    picture[y0:y1, x0:x1] = source[y0:y1, x0:x1]
    return picture


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
        without = without_of(scene, grid, thing)
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


def state_sprite(
    pixels: np.ndarray,
    alpha: np.ndarray,
    grid: dict,
    columns: int,
    rows: int,
    box: tuple[int, ...],
    row: int,
    reach: float,
    scale: float | None,
) -> Image.Image:
    """A thing's state at the page's size: its pixels and alpha in the painting's own
    moved onto the page's grid, cut to the thing's box, ending at its row's bottom
    edge (or its reach below it) as a row's image does, and drawn smaller than
    painted when the thing says (`scale`)."""
    rgba = np.dstack([pixels, (alpha * 255).astype(np.uint8)])
    sprite = aligned_rgba(rgba, grid, columns, rows)[box[1] : box[3], box[0] : box[2]].copy()
    below = clip_below(sprite[..., 3] / 255, row, box[1], reach=reach)
    sprite[..., 3] = (below * 255).astype(np.uint8)
    sprite = sprite[: max(1, round((row + 1 + reach) * CELL) - box[1])]
    return Image.fromarray(shrunk(sprite, scale) if scale else sprite, "RGBA")


#: How far the light of a scene's picture at another hour is averaged, in the
#: painting's pixels, to give it to an image painted at the painting's hour (D126).
RELIGHT_BLUR = 24


def light_ratio(night: np.ndarray, day: np.ndarray) -> np.ndarray:
    """How each pixel's colour changes from the painting to its picture at another
    hour, averaged round it: what an image painted at the painting's hour is
    multiplied by to be seen in that hour's light."""

    def soft(pixels: np.ndarray) -> np.ndarray:
        image = Image.fromarray(pixels).filter(ImageFilter.GaussianBlur(RELIGHT_BLUR))
        return np.array(image).astype(np.float32)

    return np.clip((soft(day) + 8) / (soft(night) + 8), 0.25, 4.0)


def relit(pixels: np.ndarray, ratio: np.ndarray) -> np.ndarray:
    """An image painted at the painting's hour in another hour's light (light_ratio)."""
    return np.clip(pixels.astype(np.float32) * ratio, 0, 255).astype(np.uint8)


def scene(settings: Settings) -> Path:
    grid = settings.grid
    marks = settings.marks()
    rows, columns = len(marks), len(marks[0])
    ground, withouts, _ = composite(settings, grid)
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
            # Mended after it was marked, a door taken out of its doorway, the
            # picture is its mended copy (`mended`, repaint.py's `also`).
            shutil.copy(REPO / first.get("mended", first["painting"]), src / "ground-only.png")
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
    margin = settings.data.get("margin")
    # Where the painting holds the playable area: a cut-out fades out before its edge,
    # so that nothing of what lies outside the painting is drawn (D83).
    inside = painted_area(settings, columns, rows) if margin else None

    def ground_image(pixels: np.ndarray) -> Image.Image:
        floor = image_first.aligned(Image.fromarray(pixels), grid, columns, rows, CELL)
        floor = patched(floor, settings.patches)
        return with_margin(floor, margin, inside) if margin else floor

    webp(ground_image(ground), out / "ground.webp")
    # A scene's other grounds (D126): its painting at another hour, mended from the
    # painting in boxes, laid over the ground where it differs from the painting, so
    # that what the ground takes out of the painting stays out.
    grounds = settings.data["sources"].get("grounds", {})
    painted = np.array(Image.open(settings.painting).convert("RGB")) if grounds else None
    for hour, picture in grounds.items():
        other = np.array(Image.open(settings.folder / picture).convert("RGB"))
        differs = np.any(other != painted, axis=2)[..., None]
        webp(ground_image(np.where(differs, other, ground)), out / f"ground-{hour}.webp")
    # A scene's picture at another hour that fits the painting whole (D126): the
    # ground cut from it, and what the ground takes out of the painting, a door's
    # doorway, given that hour's light.
    hours = settings.data["sources"].get("hours", {})
    pictures, ratios = {}, {}
    night = np.array(Image.open(settings.painting).convert("RGB")) if hours else None
    for hour, picture in hours.items():
        pictures[hour] = np.array(Image.open(settings.folder / picture).convert("RGB"))
        ratios[hour] = light_ratio(night, pictures[hour])
        taken = Image.fromarray(np.any(ground != night, axis=2).astype(np.uint8) * 255)
        soft = np.array(taken.filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
        # A doorway opened with the floor of the room beyond (D108) is that floor in
        # the hour's light: as much lighter as that floor is in the hour's picture.
        lit = ratios[hour].copy()
        for door in settings.data.get("doorways", {}).get("doors", []):
            fx0, fy0, fx1, fy1 = native_box(grid, door["floor"])
            floor = pictures[hour][fy0:fy1, fx0:fx1].reshape(-1, 3).mean(axis=0)
            floor_night = night[fy0:fy1, fx0:fx1].reshape(-1, 3).mean(axis=0)
            x0, y0, x1, y1 = native_box(grid, settings.things[door["thing"]]["box"])
            lit[y0:y1, x0:x1] = (floor + 8) / (floor_night + 8)
        mixed = pictures[hour] * (1 - soft[..., None]) + relit(ground, lit) * soft[..., None]
        webp(ground_image(mixed.astype(np.uint8)), out / f"ground-{hour}.webp")
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
    # Where a thing that opens or is picked up is drawn, in any of its states, which
    # no static thing takes: its cut-outs and no more, so that a wall and the door in
    # it leave no gap between them for a figure behind them to be seen through.
    doors = np.zeros(painting.shape[:2], dtype=bool)
    for name, thing in settings.things.items():
        if thing.get("static"):
            continue
        native = native_box(grid, thing["box"])
        without = withouts[name]
        for picture in thing["states"].values():
            # A state that is drawn only away from where the thing lies is not here.
            if picture is None or isinstance(picture, dict):
                continue
            _, alpha = state_alpha(settings, thing, picture, painting, without, native, th)
            doors |= alpha > 0.5
    things = {}
    for name, thing in settings.things.items():
        if thing.get("static"):
            native = native_box(grid, thing["box"])
            box = tuple(round(v * CELL) for v in thing["box"])
            if name in withouts:
                alpha = sprite_alpha(painting, withouts[name], native, thing, spacing, th)
            else:
                alpha = static_alpha(painting, native, thing, spacing, th, grid, settings.edits)
            # A wall keeps its own line round a door's cut-out: a door swung open
            # draws nothing in its doorway, where the line is the wall's (D111).
            line = max(1, round(image_first.LINE_WIDTH * spacing))
            alpha = alpha * ~image_first.eroded(doors, line)
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
        states, floors = {}, {}
        at_hour: dict[str, dict[str, str]] = {hour: {} for hour in hours}
        left, top = box[0], box[1]
        for state, picture in thing["states"].items():
            states[state] = f"{name}-{state}.webp"
            if picture is None:
                # Nothing is drawn: the ground under it is the thing's absence.
                webp(Image.new("RGBA", (1, 1), (0, 0, 0, 0)), out / states[state])
                continue
            shown, alpha = state_alpha(settings, thing, picture, painting, without, native, th)
            reach = thing.get("reach", 0.0)
            # A state may reach lower than the thing, its leaf's foot and its shadow.
            if isinstance(picture, dict):
                reach = picture.get("reach", reach)
            # A state on a row of its own ends at that row's bottom edge (D111).
            row = picture.get("row", thing["row"]) if isinstance(picture, dict) else thing["row"]
            # Drawn smaller than painted, the thing in every state or in one (`scale`).
            scale = thing.get("scale")
            scale = scale.get(state) if isinstance(scale, dict) else scale
            shape = (grid, columns, rows, box, row, reach, scale)
            webp(state_sprite(shown, alpha, *shape), out / states[state])
            # Its twin at each hour the scene is painted whole at (D126), with the same
            # mask: that hour's picture where the state is the painting's, else the
            # state's own picture in that hour's light.
            for hour in hours:
                pixels = pictures[hour] if shown is painting else relit(shown, ratios[hour])
                at_hour[hour][state] = f"{name}-{state}-{hour}.webp"
                webp(state_sprite(pixels, alpha, *shape), out / at_hour[hour][state])
            # The state's piece that lies on the floor, under every figure: a door's
            # doorway open, cut from the same picture within its own box (D289).
            floor = picture.get("floor") if isinstance(picture, dict) else None
            if floor is not None:
                within = native_box(grid, floor["box"])
                lying = difference_mask(shown, painting, within, floor.get("diff"))
                lying = lying.astype(np.float32)
                # The outline of what the piece hides whole, where the picture kept some
                # of its pixels as they were: the door shut under its open doorway.
                if "covers" in floor:
                    hidden = soft_area(painting.shape[:2], grid, floor["covers"]) >= 0.5
                    lying = np.maximum(lying, hidden.astype(np.float32))
                # Ended at its own box's bottom, not at the thing's row.
                down = max(0.0, floor["box"][3] - thing["row"] - 1)
                lies = (grid, columns, rows, box, thing["row"], down, scale)
                floors[state] = f"{name}-{state}-floor.webp"
                webp(state_sprite(shown, lying, *lies), out / floors[state])
                for hour in hours:
                    at_hour[hour][f"{state}-floor"] = f"{name}-{state}-floor-{hour}.webp"
                    pixels = relit(shown, ratios[hour])
                    webp(state_sprite(pixels, lying, *lies), out / at_hour[hour][f"{state}-floor"])
        things[name] = {"row": thing["row"], "left": left, "top": top, "states": states}
        # A door or a hole, which opens and closes (D167).
        if "kind" in thing:
            things[name]["kind"] = thing["kind"]
        if hours:
            things[name]["hours"] = at_hour
        if thing.get("under"):
            things[name]["under"] = True
        # A thing set in the floor, a plate (D273): drawn under every figure.
        if thing.get("lying"):
            things[name]["lying"] = True
        # A state drawn among the rows by its own row: a door swung open against the
        # wall it lies on (D111).
        rows_of = {
            state: picture["row"]
            for state, picture in thing["states"].items()
            if isinstance(picture, dict) and "row" in picture
        }
        if rows_of:
            things[name]["rows"] = rows_of
        # Each state's piece lying on the floor, under every figure (D289).
        if floors:
            things[name]["floors"] = floors
        # The state a door is drawn in where no level or story places it (D104).
        if "rest" in thing:
            things[name]["rest"] = thing["rest"]
        if "rune" in thing:
            things[name]["rune"] = thing["rune"]
        # The cell it is painted on, for a level that lays it on another (D85).
        if "at" in thing:
            things[name]["at"] = thing["at"]
    # A row whose image holds something of what a ground at another hour mends (a
    # wall's strip running out over the grass), named in `rows_morning`, has an image
    # at that hour too: the same cut-out, its pixels the morning picture's where that
    # picture differs from the painting (D126).
    at_hours = {}
    for hour, picture in grounds.items():
        if hour != "morning" or not settings.data.get("rows_morning"):
            continue
        night = np.array(
            image_first.aligned(Image.fromarray(painted), grid, columns, rows, CELL).convert("RGB")
        )
        other = Image.open(settings.folder / picture).convert("RGB")
        other = np.array(image_first.aligned(other, grid, columns, rows, CELL).convert("RGB"))
        named = set(settings.data["rows_morning"])
        at_hours[hour] = (other, np.any(other != night, axis=2), named)
    # A scene painted whole at another hour has every row's image at that hour too:
    # the same cut-out, its pixels that hour's picture's (D126).
    for hour in hours:
        other = Image.fromarray(pictures[hour])
        other = np.array(image_first.aligned(other, grid, columns, rows, CELL).convert("RGB"))
        every = {row for row, _, _ in strips}
        at_hours[hour] = (other, np.ones(other.shape[:2], dtype=bool), every)
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
        hours = {}
        for hour, (other, differs, named) in at_hours.items():
            if row not in named:
                continue
            band = slice(top, top + pixels.shape[0])
            shown = pixels.copy()
            mended = differs[band, : pixels.shape[1], None]
            shown[..., :3] = np.where(mended, other[band, : pixels.shape[1]], pixels[..., :3])
            hours[hour] = image.replace(".webp", f"-{hour}.webp")
            webp(Image.fromarray(shown), out / hours[hour])
        rows_out.append(
            {
                "row": row,
                "image": image,
                "top": top,
                **({"static": True} if static else {}),
                **({layer: True} if layer else {}),
                **({"hours": hours} if hours else {}),
            }
        )
    art = {
        "cell": CELL,
        "size": [columns, rows],
        "ground": "ground.webp",
        # The scene's grounds at other hours, by the hour (D126): taken in boxes,
        # `grounds`; painted whole, `hours`, where every row and thing has its twin.
        **({"grounds": {hour: f"ground-{hour}.webp" for hour in grounds}} if grounds else {}),
        **({"hours": {hour: f"ground-{hour}.webp" for hour in hours}} if hours else {}),
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
        # The cells of the painting's edges the view never shows, left, top, right and
        # bottom (D323).
        **({"unseen": settings.data["unseen"]["cells"]} if settings.data.get("unseen") else {}),
        "rows": rows_out,
        "things": things,
        **({"beds": beds_of(settings)} if settings.data.get("beds") else {}),
        # The cells a figure is drawn lower on, behind what stands below it (D95).
        **({"lowered": settings.lowered} if settings.lowered else {}),
        # The cells a figure is drawn sideways on, on the painted strip (D105).
        **({"nudged": settings.data["nudged"]} if settings.data.get("nudged") else {}),
        # The cells a thing the game draws from a sprite is drawn sideways on, clear of
        # painted furniture (D207); not a figure.
        **({"shifted": settings.data["shifted"]} if settings.data.get("shifted") else {}),
        # The dark passages a figure is drawn darker in, the deeper it goes (shade.ts).
        **(
            {
                "dark": [
                    {key: part[key] for key in ("columns", "from", "to", "most")}
                    for part in settings.data["dark"]
                ]
            }
            if settings.data.get("dark")
            else {}
        ),
        "source": "SOURCE.md",
    }
    (out / "art.json").write_text(json.dumps(art, indent=2) + "\n")
    # The cells an open leaf only touches, measured on the pictures just written, the
    # figure drawn away from it; first, so that they are taken before the doorway's
    # own nudge of the same cell (D157).
    touched = leaf_nudges(settings.id, out)
    for key in ("lowered", "nudged"):
        if touched[key]:
            art[key] = [*touched[key], *art.get(key, [])]
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
- Dask's and Wenna's standing frames are Gemini's drawings of them standing still in
  the four views (`figure-dask-standing.md`, `figure-wenna-standing.md`), cut by
  `tools/art/figures.py --standing`, and their walking frames are made from them.
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
        # A figure drawn again standing still has its sheet from that drawing (D147).
        if name in looks.STANDING_DRAWN:
            continue
        # Each frame over its row's standing frame, and each walking row made from
        # it, so that the figure walks moving its feet alone (or its dress, floating).
        sheet = looks.steadied(sheet, (width, height))
        sheet = looks.walking(sheet, (width, height), looks.FLOATING.get(name))
        # A base is recoloured into the looks' sheets, which are drawn smaller then;
        # every other figure is drawn smaller here (D98).
        if name in AS_BASES:
            webp(sheet, looks.BASE_DIR / AS_BASES[name])
        else:
            size = looks.SIZE * (looks.GROWN_UP if name in looks.GROWN_UPS else 1)
            webp(looks.sized(sheet, (width, height), FOOT, size), out / f"{name}.webp")
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
        "floating": sorted(looks.FLOATING),
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
        # The cells each open leaf lies on, as the scene names them (D125), and the
        # figures that step out from behind a thing, unseen before they do (D128).
        wrong = leaves_differ(settings_of.id)
        # The ways out behind a cover, hiding a figure whole, and no way across the
        # painted margin (D319, D322).
        for line in [*behind_seen(settings_of.id), *outs_seen(settings_of.id)]:
            print(line)
            if not line.endswith(" 0 pixels seen"):
                wrong.append(line)
        wrong += ways_over_margins(settings_of.id)
        for line in wrong:
            print(line)
        # The wizard on every cell walked on, and the cut's problems it would show.
        if sweep.main(settings_of.id) != 0 or wrong:
            return 1
    return 0


#: A cell walked on lies under an open leaf (D125) when the leaf covers more than
#: LEAF_SHARE of its lower part, from LEAF_BAND of the cell down, its sides
#: (LEAF_SIDE each) left out: where a figure standing there has its legs and feet,
#: as tests/project/test_art_content.py says something of the painting stands on a
#: cell. On the leaf's own row and below, where a figure is drawn before the leaf, it
#: lies under the leaf only when the leaf fills more than LEAF_ON of that part: the
#: figure would stand in the wood (D157).
LEAF_BAND = 0.45
LEAF_SIDE = 0.2
LEAF_SHARE = 0.2
LEAF_ON = 0.9
#: A cell an open leaf only touches (D157): the upright leaf, its columns at least
#: LEAF_UPRIGHT cells tall (its shadow on the floor is lower), over more than
#: LEAF_TOUCH of the figure's body, from LEAF_HEAD above the cell's top to its foot,
#: its sides left out. A figure there is drawn LEAF_AWAY of a cell from the leaf: down
#: below the leaf's row, sideways on it and above.
LEAF_UPRIGHT = 1.25
LEAF_TOUCH = 0.1
LEAF_HEAD = 0.25
LEAF_AWAY = 0.3


def leaf_measures(scene_id: str, folder: Path | None = None) -> dict[str, dict[str, list]]:
    """For each door of the exported scene with an open state, the cells walked on round
    its open leaf, its own doorway left out, measured on its exported picture where a
    figure on the cell is drawn (D149): `covers`, those it lies on (D125), in reading
    order; and `touches`, those whose figure it only touches, each with the way the
    figure is drawn away from it, `[x, y, "down" | "left" | "right"]` (D157). A leaf cut by
    difference (D148), its shadow in its picture, is measured on the rows above its own,
    whose figures it hides, and on its own and below, where it stands before the
    figures behind it and a figure in front of it may touch it. The nudges the leaves
    themselves give (`leaf` in art.json) are not counted: they follow from this. A door
    whose settings say its figures pass before its open leaf (`passed_before`, D289) is
    not measured."""
    folder = folder or REPO / "content" / "art" / "scenes" / scene_id
    art = json.loads((folder / "art.json").read_text())
    cell = art["cell"]
    walked = sweep.walks(scene_id)
    about = json.loads((REPO / "content" / "scenes" / scene_id / "scene.json").read_text())
    doorways = {
        thing["id"]: thing.get("cells", [thing.get("at")]) for thing in about.get("things", [])
    }
    nudges = {
        (x, y): part["by"]
        for part in reversed(art.get("nudged", []))
        if "leaf" not in part
        for y in range(part["cells"][0][1], part["cells"][1][1] + 1)
        for x in range(part["cells"][0][0], part["cells"][1][0] + 1)
    }
    settings_of = settings(scene_id).things if scene_id in scenes() else {}
    found = {}
    for name, thing in art["things"].items():
        picture = thing["states"].get("open")
        if picture is None or not sweep.is_door(thing):
            continue
        # A leaf the figures pass before, standing beside its doorway on the floor they
        # walk, lies on no cell and is drawn away from no one (D289).
        if settings_of.get(name, {}).get("passed_before"):
            continue
        row = thing.get("rows", {}).get("open", thing["row"])
        doorway = doorways.get(name, [thing.get("at")])
        alpha = np.array(Image.open(folder / picture).convert("RGBA"))[..., 3] > 128
        upright = alpha & (alpha.sum(axis=0) >= LEAF_UPRIGHT * cell)[None, :]
        left, top = thing["left"], thing["top"]
        side = int(cell * LEAF_SIDE)
        open_state = settings_of.get(name, {}).get("states", {}).get("open")
        by_difference = isinstance(open_state, dict) and "diff" in open_state
        last = (top + alpha.shape[0] - 1) // cell
        rows_of_leaf = range(max(0, top // cell), last + 1) if by_difference else [row]
        covers, touches = [], []
        for here in rows_of_leaf:
            if here >= walked.shape[0]:
                continue
            y0, y1 = here * cell + int(cell * LEAF_BAND) - top, (here + 1) * cell - top
            b0 = here * cell - int(cell * LEAF_HEAD) - top
            b1 = round((here + sweep.FOOT_IN_CELL) * cell) - top
            for x in range(walked.shape[1]):
                if not walked[here, x] or [x, here] in doorway:
                    continue
                shift = round(nudges.get((x, here), 0.0) * cell)
                x0, x1 = x * cell + side + shift - left, (x + 1) * cell - side + shift - left
                band = alpha[max(0, y0) : max(0, y1), max(0, x0) : max(0, x1)]
                share = band.sum() / ((y1 - y0) * (x1 - x0))
                if share > (LEAF_SHARE if here < row or not by_difference else LEAF_ON):
                    covers.append([x, here])
                    continue
                if not by_difference:
                    continue
                body = upright[max(0, b0) : max(0, b1), max(0, x0) : max(0, x1)]
                if body.sum() <= LEAF_TOUCH * (b1 - b0) * (x1 - x0):
                    continue
                if here > row:
                    touches.append([x, here, "down"])
                else:
                    # Away from the side the leaf lies on, toward the doorway's middle.
                    middle = (x0 + x1) / 2 - max(0, x0)
                    toward = np.nonzero(body.any(axis=0))[0].mean()
                    touches.append([x, here, "left" if toward > middle else "right"])
        found[name] = {"covers": covers, "touches": touches}
    return found


def leaf_cells(scene_id: str, folder: Path | None = None) -> dict[str, list[list[int]]]:
    """For each door of the exported scene with an open state, the cells walked on that
    its open leaf lies on (D125), as `leaf_measures` finds them."""
    return {name: found["covers"] for name, found in leaf_measures(scene_id, folder).items()}


def leaf_nudges(scene_id: str, folder: Path | None = None) -> dict[str, list[dict]]:
    """The cells each open leaf only touches, as art.json's `lowered` and `nudged` name
    them (D157): a figure there drawn LEAF_AWAY of a cell from the leaf, down or
    sideways, each range one cell, with the door's name in `leaf`."""
    out: dict[str, list[dict]] = {"lowered": [], "nudged": []}
    for name, found in leaf_measures(scene_id, folder).items():
        for x, y, way in found["touches"]:
            key = "lowered" if way == "down" else "nudged"
            by = -LEAF_AWAY if way == "left" else LEAF_AWAY
            about = f"Touched by {name}'s open leaf, the figure drawn away from it (D157)."
            out[key].append({"about": about, "cells": [[x, y], [x, y]], "by": by, "leaf": name})
    return out


#: The sheets a story's figure may be drawn from: the friend and the dormitory mate
#: in either gender and either set of colours (D77, D90), anyone else by its name.
FRIEND_SHEETS = ("nuri-a", "nuri-b", "teku-a", "teku-b")


def behind_seen(scene_id: str) -> list[str]:
    """For each figure a story of the scene has step out from behind a thing
    (`appear` with `from`, D128), how many of its pixels are seen at the cell it
    comes from, in any sheet it may be drawn from: none, for it to come out of
    hiding. A line each."""
    scene = sweep.load(scene_id)
    lines = []
    for path in sorted((REPO / "content" / "stories").glob("*/story.json")):
        story = json.loads(path.read_text())
        if story.get("scene") != scene_id:
            continue
        for number, step in enumerate(story["steps"], 1):
            doing = step.get("do") or []
            for action in doing if isinstance(doing, list) else [doing]:
                if "from" not in action:
                    continue
                who = action.get("by", step.get("by", step["who"]))
                sheets = FRIEND_SHEETS if who in ("friend", "mate") else (who,)
                x, y = action["from"]
                seen = max(sweep.seen_at(scene, x, y, sheet) for sheet in sheets)
                where = f"{story['id']}, step {number}"
                lines.append(f"{where}: {who} behind {x},{y}, {seen} pixels seen")
    return lines


#: The sides of a scene's edge, in the order of a margin's cells (D83).
SIDES = ("left", "top", "right", "bottom")


def ways_taken(scene_id: str) -> list[dict]:
    """The ways out of the scene and into it that its stories' figures take (D319,
    D322), as the world's check of the stories finds them: each with the story, the
    step, who, the cell, and the side of the edge or `out`."""
    sys.path.insert(0, str(REPO / "world"))
    sys.path.insert(0, str(REPO / "tools"))
    from kydux_world.level import read_scene, story_on_scenes
    from scene_maps import sitters

    ways: list[dict] = []
    for path in sorted((REPO / "content" / "stories").glob("*/story.json")):
        story = json.loads(path.read_text())
        story_on_scenes(
            story,
            lambda scene, story=story: read_scene(REPO / "content" / "scenes", scene, story["id"]),
            sitters(REPO / "content"),
            ways,
        )
    return [way for way in ways if way["scene"] == scene_id]


def across_margins(ways: list[dict], margin: list[float]) -> list[str]:
    """Each way taken by a side of the edge where the painting has a margin (D83): a
    figure past the edge there would stand in sight on it. A line each."""
    lines = []
    for way in ways:
        side = way.get("leaves", way.get("enters"))
        if side in SIDES and margin[SIDES.index(side)] > 0:
            verb = "leaves" if "leaves" in way else "comes in"
            lines.append(f"{way['step']}: {way['who']} {verb} by the {side} edge, over the margin")
    return lines


def ways_over_margins(scene_id: str) -> list[str]:
    """The ways the scene's stories take across its painted margin (D319, D322): none."""
    art = json.loads((REPO / "content" / "art" / "scenes" / scene_id / "art.json").read_text())
    return across_margins(ways_taken(scene_id), art.get("margin", [0, 0, 0, 0]))


def out_cells(scene_id: str) -> list[tuple[int, int]]:
    """The scene's ways out behind a cover, the cells whose terrain says `out` (D319)."""
    folder = REPO / "content" / "scenes" / scene_id
    about = (
        json.loads((folder / "scene.json").read_text())
        if (folder / "scene.json").is_file()
        else {}
    )
    letters = {k for k, t in about.get("terrains", {}).items() if t.get("out") is True}
    rows = [row for row in (folder / "map.txt").read_text().splitlines() if row]
    return [(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char in letters]


def standing_seen(scene: sweep.Scene, x: int, y: int, name: str, facing: str) -> int:
    """How many pixels of a figure standing on (x, y), facing that way, are seen, nothing
    drawn in front of them (sweep.seen_at, the count of D128, for any way it faces)."""
    frame, foot = sweep.figure(name, facing=facing)
    height, width = frame.shape[:2]
    alpha = frame[..., 3].astype(np.float32) / 255
    left = int(sweep.middle_at(scene, x, y) * scene.cell) - width // 2
    bottom = int(sweep.feet_at(scene, x, y) * scene.cell) + foot
    top = bottom - height
    here = sweep.feet_at(scene, x, y) + 0.0005
    front = np.zeros_like(alpha)
    for layer in scene.layers:
        if layer.depth > here:
            over = sweep.window(layer, left, top, left + width, bottom)[..., 3]
            front = np.maximum(front, over.astype(np.float32) / 255)
    return int(((alpha * (1 - front)) > 0.5).sum())


def outs_seen(scene_id: str) -> list[str]:
    """For each way out behind a cover (D319), the most pixels seen of any figure of the
    sheets standing there, whichever way it faces: none, for a figure to go out of sight
    whole behind the cover. A line each."""
    cells = out_cells(scene_id)
    if not cells:
        return []
    scene = sweep.load(scene_id)
    data = json.loads((FIGURES_OUT / "figures.json").read_text())
    names = sorted(
        path.stem for path in FIGURES_OUT.glob("*.webp") if not path.stem.startswith("familiar")
    )
    lines = []
    for x, y in cells:
        seen = max(
            standing_seen(scene, x, y, name, facing) for name in names for facing in data["ways"]
        )
        lines.append(f"way out {x},{y}: {seen} pixels seen")
    return lines


def leaves_differ(scene_id: str) -> list[str]:
    """Where the cells the scene names under each open leaf (`covers`, scene.json)
    are not the cells its exported picture lies on, one line each."""
    about = json.loads((REPO / "content" / "scenes" / scene_id / "scene.json").read_text())
    named = {
        thing["id"]: thing.get("covers", {}).get("open", []) for thing in about.get("things", [])
    }
    wrong = []
    for name, cells in leaf_cells(scene_id).items():
        if sorted(named.get(name, [])) != sorted(cells):
            shown = " ".join(f"{x},{y}" for x, y in cells) or "none"
            wrong.append(
                f"{name}: its open leaf lies on {shown}; scene.json's covers say otherwise"
            )
    return wrong


def draw(
    folder: Path,
    figures_folder: Path = FIGURES_OUT,
    standing: list[tuple[str, int, int]] = (),
    states: dict[str, str] | None = None,
    hour: str | None = None,
) -> Image.Image:
    """The exported scene as the page draws it: the ground, or its ground at another
    `hour` (D126), then row by row what stands up and has its foot there, the
    things in their states, and the figures standing on that row; each figure is
    `(name, x, y)` in cells."""
    art = json.loads((folder / "art.json").read_text())
    fig = json.loads((figures_folder / "figures.json").read_text())
    cell = art["cell"]
    ground = {**art.get("grounds", {}), **art.get("hours", {})}[hour] if hour else art["ground"]
    picture = Image.open(folder / ground).convert("RGBA")
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
        shown = layer.get("hours", {}).get(hour, layer["image"]) if hour else layer["image"]
        image = Image.open(folder / shown).convert("RGBA")
        by_row.setdefault(layer["row"], []).append((image, (0, layer["top"])))
    for name, thing in art["things"].items():
        state = (states or {}).get(name, next(iter(thing["states"])))
        shown = thing.get("hours", {}).get(hour, {}).get(state, thing["states"][state])
        image = Image.open(folder / shown).convert("RGBA")
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
    what stands up, at the levels' starts, the things open and shut, and every
    thing's states with their edges marked, each named after the scene."""
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
    # Every door and hole drawn open, by its kind (D167).
    opened = {
        name: "open"
        for name, thing in settings.things.items()
        if thing.get("kind") in scene_settings.KINDS and "open" in thing["states"]
    }
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
    written.append(states_sheet(settings, out))
    written.append(doors_sheet(settings, out))
    # Each ground at another hour with every row and thing over it, for a night
    # piece left over the day to be seen (D126).
    sources = settings.data["sources"]
    for hour in {**sources.get("grounds", {}), **sources.get("hours", {})}:
        target = out / f"{hour}-{settings.id}.png"
        draw(settings.out, standing=starts, hour=hour).save(target)
        written.append(target)
    return written


#: The states sheet (D113): the margin round a thing's box, in cells; how much a
#: thing narrower than STATES_NARROW pixels of the page is enlarged, and a wider one;
#: the edge's colour, and the height of a panel's name.
STATES_MARGIN = 0.4
STATES_NARROW = 300
STATES_LARGE, STATES_SMALL = 3, 2
STATES_EDGE = (255, 0, 255, 255)
STATES_LABEL = 16


def edge_of(alpha: np.ndarray) -> np.ndarray:
    """A mask's edge: a pixel drawn beside one not drawn at all, either way."""
    drawn = alpha > 0
    beside = np.zeros_like(drawn)
    beside[1:] |= ~drawn[:-1]
    beside[:-1] |= ~drawn[1:]
    beside[:, 1:] |= ~drawn[:, :-1]
    beside[:, :-1] |= ~drawn[:, 1:]
    return drawn & beside


def state_panels(folder: Path, name: str) -> list[tuple[str, Image.Image]]:
    """A thing of an exported scene as the page draws it, at the page's size: the
    ground round its box, then each of its states composed on that ground with the
    state's edge in magenta, enlarged as STATES_LARGE or STATES_SMALL says."""
    art = json.loads((folder / "art.json").read_text())
    cell = art["cell"]
    thing = art["things"][name]
    ox, oy = art.get("origin", [0, 0])
    ground = Image.open(folder / art["ground"]).convert("RGBA")
    images = {
        state: Image.open(folder / file).convert("RGBA") for state, file in thing["states"].items()
    }
    width = max(image.width for image in images.values())
    height = max(image.height for image in images.values())
    margin = round(STATES_MARGIN * cell)
    left, top = thing["left"] + ox - margin, thing["top"] + oy - margin
    box = (left, top, left + width + 2 * margin, top + height + 2 * margin)
    times = STATES_LARGE if width < STATES_NARROW else STATES_SMALL
    size = ((box[2] - box[0]) * times, (box[3] - box[1]) * times)
    plain = ground.crop(box)
    panels = [("ground", plain.resize(size, Image.LANCZOS))]
    for state, image in images.items():
        if image.width <= 1 and image.height <= 1:
            continue
        layer = Image.new("RGBA", plain.size, (0, 0, 0, 0))
        layer.alpha_composite(image, (margin, margin))
        shown = plain.copy()
        shown.alpha_composite(layer)
        shown = shown.resize(size, Image.LANCZOS)
        # The edge at the enlarged size, a line one pixel wide between the pixels of
        # the state that are drawn and those that are not.
        alpha = np.array(layer.resize(size, Image.NEAREST))[..., 3]
        pixels = np.array(shown)
        pixels[edge_of(alpha)] = STATES_EDGE
        panels.append((state, Image.fromarray(pixels)))
    return panels


def states_sheet(settings: Settings, out: Path) -> Path:
    """Every thing of the scene that has states, a row each: the ground round it and
    each state on it, its edge marked, named over each panel, side by side on black
    (D113)."""
    rows = []
    for name, thing in settings.things.items():
        if thing.get("static") or not thing.get("states"):
            continue
        panels = state_panels(settings.out, name)
        width = sum(panel.width for _, panel in panels) + STATES_LABEL * (len(panels) - 1)
        height = max(panel.height for _, panel in panels) + STATES_LABEL
        row = Image.new("RGBA", (width, height), (0, 0, 0, 255))
        pen = ImageDraw.Draw(row)
        x = 0
        for state, panel in panels:
            pen.text((x + 2, 2), f"{name}: {state}", fill=(255, 255, 255, 255))
            row.alpha_composite(panel, (x, STATES_LABEL))
            x += panel.width + STATES_LABEL
        rows.append(row)
    sheet = Image.new(
        "RGBA",
        (max([row.width for row in rows], default=1), sum(row.height for row in rows) or 1),
        (0, 0, 0, 255),
    )
    y = 0
    for row in rows:
        sheet.alpha_composite(row, (0, y))
        y += row.height
    target = out / f"states-{settings.id}.png"
    sheet.convert("RGB").save(target)
    return target


#: The doors sheet: the margin round a thing's box, in cells, and how many panels
#: a row.
DOORS_MARGIN = 1.0
DOORS_ACROSS = 4


def composed(folder: Path, name: str, state: str) -> tuple[Image.Image, int]:
    """A thing of an exported scene in one of its states, composed as the page draws
    the scene, with no figure: the playable ground, every row's image and every
    thing at its depth (sweep.load), the other things in their resting state (their
    `rest`, else their first), the thing in `state`, by that state's own row and
    over whoever stands in its doorway as the page draws it (D95, D111). Cropped
    round the thing's box with DOORS_MARGIN cells, at the page's size; and how much
    it is enlarged on the sheet."""
    art = json.loads((folder / "art.json").read_text())
    scene = sweep.load(folder.name)
    things = art["things"]

    def drawn(other: str, shown: str) -> list[sweep.Layer]:
        thing = things[other]
        rgba = np.array(Image.open(folder / thing["states"][shown]).convert("RGBA"))
        under = thing.get("under", False) and shown != "open"
        row = thing.get("rows", {}).get(shown, thing["row"])
        depth = sweep.depth_of(row, scene.rows, under) + 0.001
        found = [sweep.Layer(other, depth, None, rgba, thing["left"], thing["top"], under=under)]
        # The state's piece lying on the floor, under every figure (D289).
        floor = thing.get("floors", {}).get(shown)
        if floor:
            lying = np.array(Image.open(folder / floor).convert("RGBA"))
            found.append(sweep.Layer(other, sweep.LYING, None, lying, thing["left"], thing["top"]))
        return found

    layers = [layer for layer in scene.layers if layer.name not in things]
    for other, thing in things.items():
        resting = thing.get("rest") if thing.get("rest") in thing["states"] else None
        layers += drawn(other, state if other == name else resting or next(iter(thing["states"])))
    layers.sort(key=lambda layer: layer.depth)
    thing = things[name]
    sizes = [Image.open(folder / file).size for file in thing["states"].values()]
    width, height = max(w for w, _ in sizes), max(h for _, h in sizes)
    margin = round(DOORS_MARGIN * scene.cell)
    x0, y0 = max(0, thing["left"] - margin), max(0, thing["top"] - margin)
    x1 = min(scene.columns * scene.cell, thing["left"] + width + margin)
    y1 = min(scene.rows * scene.cell, thing["top"] + height + margin)
    picture = Image.fromarray(scene.ground[y0:y1, x0:x1]).convert("RGBA")
    for layer in layers:
        picture.alpha_composite(Image.fromarray(sweep.window(layer, x0, y0, x1, y1)))
    return picture, STATES_LARGE if width < STATES_NARROW else STATES_SMALL


def door_panels(settings: Settings) -> list[tuple[str, Image.Image]]:
    """Every state of every thing of the scene that has states, composed as the page
    draws the scene (`composed`) and enlarged, each named `<n>. <thing> <state>`,
    numbered from 1; the ground alone is none of them."""
    panels: list[tuple[str, Image.Image]] = []
    things = json.loads((settings.out / "art.json").read_text())["things"]
    for name, thing in settings.things.items():
        if thing.get("static") or not thing.get("states"):
            continue
        for state in things[name]["states"]:
            picture, times = composed(settings.out, name, state)
            size = (picture.width * times, picture.height * times)
            label = f"{len(panels) + 1}. {name} {state}"
            panels.append((label, picture.resize(size, Image.LANCZOS)))
    return panels


def doors_sheet(settings: Settings, out: Path) -> Path:
    """The scene's door panels (`door_panels`), DOORS_ACROSS a row on black, each
    named over it."""
    panels = door_panels(settings)
    width = max([panel.width for _, panel in panels], default=1)
    height = max([panel.height for _, panel in panels], default=1) + STATES_LABEL
    rows = max(1, -(-len(panels) // DOORS_ACROSS))
    across = min(DOORS_ACROSS, max(1, len(panels)))
    sheet = Image.new("RGBA", (across * (width + STATES_LABEL), rows * height), (0, 0, 0, 255))
    pen = ImageDraw.Draw(sheet)
    for number, (label, panel) in enumerate(panels):
        x, y = (number % DOORS_ACROSS) * (width + STATES_LABEL), (number // DOORS_ACROSS) * height
        pen.text((x + 2, y + 2), label, fill=(255, 255, 255, 255))
        sheet.alpha_composite(panel, (x, y + STATES_LABEL))
    target = out / f"doors-{settings.id}.png"
    sheet.convert("RGB").save(target)
    return target


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
