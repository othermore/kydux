#!/usr/bin/env python3
"""A chosen painting mended in a few places, and nowhere else (the owner's rule of
2026-10-26: once a scene's painting is chosen it does not change, unless it must).

    tools/art/repaint.py <scene> canvas [--section <name>]
    tools/art/repaint.py <scene> join <picture> [--section <name>]
    tools/art/repaint.py <scene> fill [--section <name>]
    tools/art/repaint.py <scene> marks
    tools/art/repaint.py <scene> doorways
    tools/art/repaint.py <scene> spaced
    tools/art/repaint.py <scene> tiled --section <name>
    tools/art/repaint.py <scene> placed --section <name>
    tools/art/repaint.py <scene> pegs

What to mend is the scene's settings' `repaint` (art/scenes/<scene>/cut.json,
D82): the painting it starts from (`from`), how many pixels it grows by below
(`grow`), the boxes of it, in its pixels, a model paints again (`boxes`),
polygons where a box will not follow an edge (`areas`, each a list of [x, y]
pixels), and what is not painted at all (`void`, `black` or `paper`: what the
model left of that colour, wider than a line, under `below`, joined to the
picture's edge when it says `outside`, but for the boxes it is to stay in,
`leave`), each faded in over FADE pixels round it or `fade`, the part of the
canvas the model is given (`crop`, x0, y0, x1, y1, so that what is to be kept is
large in its picture and hard to paint over), and where the canvas and the
mended painting go. A model keeps pale paper as the page it is painted on, and
may keep black as a gap: `flat` shows what it is to paint in that colour, [r, g,
b], on the canvas.

`canvas` writes the picture the model is given: the painting, grown below by its
own bottom row stretched down, with the boxes and the grown band blurred, so that
the model sees the colours there and no shape to copy, cut to `crop`. A prompt
file asks the model to paint the blurred parts and keep the rest.

`join <picture>` lays the model's picture on the crop, scaled and moved by the
least difference with what is kept, searched coarsely then finely at an eighth
of the size, and writes the mended painting: the model's pixels in the boxes and
the grown band, each faded in over FADE, the painting's own everywhere else.
Rows below where the model's picture reaches take its last row. Models paint
the whole picture again when asked to edit it, and sometimes paint over what was
asked to be kept: the join keeps it whatever the model did.

`marks` lays Gemini's pictures of parts of the scene with its things painted
flat magenta (the owner's way, 2026-10-27) on the painting, each moved and scaled
onto its crop by the least difference with the painting, as `join` lays a mended
part, and writes the painting with the magenta where they have it: the picture
that says which thing a static thing's mask is (`"mask": "marked"`,
export_scene.static_alpha), whole, with the painting's outline beside it added;
the sweep checks the scene against it. A model keeps shapes but not places to
the pixel, so each picture laid whole is then moved part by part, its outlines
onto the painting's (moved_locally). A part may be asked several times, its
`picture` a list: it is magenta where more than half the tries are. The scene's
settings' `marks` give the pictures, each with its crop, and where the painting
goes; things that lie on other things, a bed's covers on the bed, are marked in
a set of their own, each set a painting (`sets`), the first the sweep's. A
marked picture that `doorways` lays its fills into (`also`) has its untouched
copy written too, the same picture, so that `doorways` run after it lays the
fills on the new one.

A section that takes a door out of a doorway (`opened`) has the dark of the
doorway the door hid made magenta in each of its `also` pictures, flooded from
the opening's magenta, so that a wall cut round its openings leaves it out.

`tiled` mends what is not painted without a model (a section with `void` and
`texture`): it lays there a part of a picture (`texture`, the picture and its box
x0, y0, x1, y1, in pixels), mirrored at each side so that it meets itself, made
darker by `shade`, faded in over `fade` pixels: the tops of thick walls in the
narrow gaps a model leaves black whatever it is asked.

`placed` lays a part of a model's picture on the painting, scaled, without a
model asked again (a section with `picture` and its box `part`, in the picture's
pixels, and `at`, the box it goes to, in cells): what lies inside the ellipse of
that box, faded in over `fade` pixels: a hole the model painted large and clear,
drawn at the size of its cell.

`pegs` lays a rack's pegs one a cell (D195), without a model: the painted pegs
(`painted`, boxes in pixels) are filled from the four sides round each, as `fill`
fills a box; the rack's board (`board`, its box) is drawn out at each end by `grow`
pixels: each end's piece (`ends`, `left` and `right`, its columns, and `edge`, the
points of its outline down the end) moved out, only what lies inside the outline, and
the gap filled with a stretch of the board near that end with no peg (`left_middle`,
`right_middle`, columns); and the
painting's own peg
(`peg`, its box) is laid on the middle of each cell from the first column of `cells`
to the last, at its own height, inside an ellipse faded over `fade` pixels.

`fill` mends without a model: each box, a narrow upright strip, is painted row
by row from the pixels just left and right of it, blended across, so that what
lies under a thin thing (the entrance lamp's chain over a plain floor, the foot
of a door taken out) goes on across it, and its `also` pictures with it; a box
as wide as tall, on a floor whose light changes both ways, is painted from all
four sides (`sides` 4). A model given such a strip blurred painted the chain
again.

`spaced` moves the walls of a painting along its rows without a model (the scene's
`spaced`): between two `columns`, in cells, a row of the picture is taken from
where the `knots` say, each [old row, new row], in cells; what lies between two
knots moved by as much is moved whole, a wall with its door, and what lies between
the others is stretched, plain floor: three doors painted unevenly made even (the
owner, 2026-11-05). Each side blends into the painting beside it over SEAM pixels.
With `rows`, in cells, in place of `columns`, it moves the columns between those
rows, by knots of old and new columns, the same way: a corridor made a cell wider,
its wall and the room beyond moved whole and its plain floor stretched.

`doorways` opens each door of the scene's settings' `doorways` without a model
(D108): the door's leaf is found in the painting from bands of seeds across it
(`seeds`, each x0, x1 and y in cells), within the box it is looked for in
(`leaf_box`, in cells; the thing's box by default), flooded up to the black line that bounds
it, its planks' lighter lines crossed, and filled row by row, or traced by hand
(`shape`, a polygon in cells) where iron bands or an open outline stop or spill the
flood; and the whole
leaf, from the arch down to its foot and from one jamb to the other, is painted
with the floor of the room beyond (`floor`, a box in cells of the painting
itself, a plain part of that room's floor), stretched to it, DOORWAY_SHADE
darker at the arch's top and as lit as the room at the threshold, so that no
board, rail or shadow of the leaf is left there. Its foot is the first dark line
under the leaf's box, within `sill` cells below it (`sill` 0: the box's own
foot, the jambs' feet): the floor's own line under a threshold, the edge of the
floor before the door, whose top it ends on; or, with nothing but the leaf's
wood above it, the closed leaf's own bottom outline, which it covers down to its
lower edge. At that foot lies a threshold (D114), THRESHOLD cells high, inside
the doorway: a strip of the `floor` box, the plainest one, turned a quarter so
that what ran down the box runs across the doorway (a board's grain, a
flagstone), THRESHOLD_SHADE darker, its two edges drawn as thin wavy lines in
the colour of that floor's joints. Over the closed leaf's own outline, the
threshold reaches down to the jambs' feet, where the jambs' bottom outline ends
beside the fill's span (`jambs_feet`), over the doorway's own floor, and the
fill reaches down to its top; on the floor's own line it ends there, even
where the jambs stand lower. The fill and its threshold are laid into the
scene's other pictures that show the doorway shut (`also`: its ground-only edit
and its marked picture), so that the cut finds no difference there; each is
laid from the picture's untouched copy beside it (`<stem>-untouched.<suffix>`),
made from the picture on the first run that finds none, so that a doorway laid
again leaves nothing of the one before; never into the
swung picture, whose leaf may lie a little over the opening and is cut by its
own traced shape (D113). The leaf swung open beside the doorway (D111) is a
model's, mended into the doorway's picture as any box is, on a guide the tool
draws first
(`guide`): the shut leaf, exactly the opening's size, turned over on its hinges
at the opening's edge, its free edge a little forward, and its shadow, which the
model is given as it is to paint the door's hinges and finish on. A model asked
to open a whole door drew its leaf against the arch's side and left its bottom
planks, and a model's floor was lit brighter than the room it is the floor of.

The same is done for any other section of the settings, named by `--section`:
`without`, the edit of a scene indoors without its static things (D89), which
those things are cut against. There, `boxes` may be `"statics"`, every static
thing's box, a little grown; `plain` gives the model the painting itself, not
blurred, for it to take the things out of; and with no `crop` the model is given
the whole painting. A scene painted at night has `morning` (D126): the model,
given the whole painting as it is, paints it by morning, and `join` takes from
it the sky, the windows and what lies beyond the castle's walls, faded in over a
few pixels on the outlines that bound them, into the scene's morning picture.
Where the model's picture fits the painting whole (`trace.py fit`), the section
is `whole`: `join` lays the picture on the painting by the affine that lays its
dark outlines best on the painting's, over the whole picture, since the light of
another hour changes every tone, and takes it whole, the scene's picture at that
hour (the settings' `sources` `hours`).

A section may lay flat shapes on its canvas (`shapes`, D273), each a `rectangle` or an
`ellipse` in the painting's pixels with its `fill`, in order, over the painting given
`plain`: a model paints where a flat colour asks it and keeps the rest, so that a thing
moved to its cell is a flat disc on a patch of the floor's colour where it was and where
it goes (the tower hall's plates, its lectern and its cat).
"""

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import image_first  # noqa: E402
import scene_settings  # noqa: E402

REPO = HERE.parents[1]
#: How wide the fade is round a box the model paints, in the painting's pixels.
FADE = 40
#: How wide a wall moved along its rows blends into the painting beside it.
SEAM = 10
#: What is not painted: the black a model left, or its pale paper, as the brightest
#: channel or the darkest; and how wide a piece must be not to be a line, at a
#: quarter of the size.
VOID_BLACK = 26
VOID_PAPER = 200
VOID_OPENED = 7
#: How much smaller the laying is searched at, and the blur of what is to be painted.
SMALL = 8
BLUR = 60


#: How far round a static thing's box the model's picture is taken, in the
#: painting's pixels.
STATIC_PAD = 24


def settings_of(scene: str, section: str = "repaint") -> dict:
    settings = scene_settings.settings(scene)
    found = settings.data.get(section)
    if not found:
        raise SystemExit(f"{scene}: its settings have no {section}")
    found = dict(found)
    if found.get("boxes") == "statics":
        gx, gy = settings.grid["x"], settings.grid["y"]
        found["boxes"] = [
            [
                round(gx["offset"] + x0 * gx["spacing"]) - STATIC_PAD,
                round(gy["offset"] + y0 * gy["spacing"]) - STATIC_PAD,
                round(gx["offset"] + x1 * gx["spacing"]) + STATIC_PAD,
                round(gy["offset"] + y1 * gy["spacing"]) + STATIC_PAD,
            ]
            for x0, y0, x1, y1 in (
                thing["box"]
                for thing in settings.data.get("things", {}).values()
                if thing.get("static")
            )
        ]
    if "crop" not in found:
        width, height = Image.open(REPO / found["from"]).size
        found["crop"] = [0, 0, width, height + found.get("grow", 0)]
    return found


def from_the_edge(empty: np.ndarray) -> np.ndarray:
    """What of a mask is joined to the picture's edge through the mask itself: what lies
    round the place, and not the dark corners of the rooms inside its walls."""
    reached = np.zeros_like(empty)
    reached[0, :], reached[-1, :], reached[:, 0], reached[:, -1] = (
        empty[0, :],
        empty[-1, :],
        empty[:, 0],
        empty[:, -1],
    )
    # Downward and upward sweeps, each row taking what its neighbour reached, and running
    # along the row through what is empty, until nothing more is reached.
    while True:
        before = int(reached.sum())
        for rows in (range(1, empty.shape[0]), range(empty.shape[0] - 2, -1, -1)):
            for y in rows:
                near = y - 1 if rows.step > 0 else y + 1
                row = reached[y] | (reached[near] & empty[y])
                # Each run of the row's empty pixels with one reached is reached whole.
                edges = np.flatnonzero(np.diff(np.concatenate(([0], empty[y].astype(int), [0]))))
                for start, end in zip(edges[::2], edges[1::2], strict=True):
                    if row[start:end].any():
                        row[start:end] = True
                reached[y] = row
        if int(reached.sum()) == before:
            return reached


def void_of(repaint: dict) -> np.ndarray:
    """What a model left unpainted in a section's picture (`void`): black, or pale
    paper, in pieces wider than a line, less the boxes it stays in (`leave`, in pixels)."""
    # A model may leave a void a shade off what it was: it is found where it was first.
    picture = np.array(Image.open(REPO / repaint.get("void_in", repaint["from"])).convert("RGB"))
    if repaint["void"] == "black":
        empty = picture.max(axis=2) < repaint.get("below", VOID_BLACK)
    else:
        empty = picture.min(axis=2) > VOID_PAPER
    for x0, y0, x1, y1 in repaint.get("leave", []):
        empty[y0:y1, x0:x1] = False
    if repaint.get("outside"):
        empty = from_the_edge(empty)
    height, width = empty.shape
    small = Image.fromarray(empty.astype(np.uint8) * 255).resize((width // 4, height // 4))
    opened_up = small.filter(ImageFilter.MinFilter(VOID_OPENED)).filter(
        ImageFilter.MaxFilter(VOID_OPENED + 2)
    )
    # Its pixels at the picture's size, up to what is empty and a little over the line.
    grown_up = np.array(opened_up.resize((width, height), Image.BILINEAR)) > 127
    return grown_up


def painted_part(shape: tuple[int, int], repaint: dict) -> np.ndarray:
    """How much of each pixel the model paints: 1 in a box (`boxes`, x0, y0, x1, y1),
    a polygon (`areas`, a list of [x, y]), what is not painted (`void`) or the grown
    band, 0 a fade beyond them (`fade` pixels, FADE unless the section says)."""
    height, width = shape
    grow, fade = repaint.get("grow", 0), repaint.get("fade", FADE)
    yy, xx = np.arange(height)[:, None], np.arange(width)[None, :]
    kept = np.ones(shape, dtype=np.float32)
    boxes = repaint.get("boxes", [])
    for x0, y0, x1, y1 in [*boxes, *([[0, height - grow, width, height]] if grow else [])]:
        dx = np.maximum(np.maximum(x0 - xx, xx - x1), 0)
        dy = np.maximum(np.maximum(y0 - yy, yy - y1), 0)
        kept = np.minimum(kept, np.clip(np.hypot(dx, dy) / fade, 0, 1))
    if repaint.get("areas") or repaint.get("void"):
        inside = Image.new("L", (width, height), 0)
        draw = ImageDraw.Draw(inside)
        for area in repaint.get("areas", []):
            draw.polygon([tuple(point) for point in area], fill=255)
        if repaint.get("void"):
            part = void_of(repaint)
            inside = Image.fromarray((np.array(inside) > 0) | part).convert("L")
            inside = Image.fromarray((np.array(inside) > 0).astype(np.uint8) * 255)
        # Grown a pixel at a time, each ring a step further from the polygon.
        ring = np.array(inside) > 0
        kept = np.minimum(kept, np.where(ring, 0.0, 1.0))
        for step in range(1, fade):
            inside = inside.filter(ImageFilter.MaxFilter(3))
            ring = np.array(inside) > 0
            kept = np.minimum(kept, np.where(ring, step / fade, 1.0))
    return 1 - kept


def grown(repaint: dict) -> np.ndarray:
    painting = np.array(Image.open(REPO / repaint["from"]).convert("RGB"))
    grow = repaint.get("grow", 0)
    if grow:
        painting = np.concatenate([painting, np.repeat(painting[-1:], grow, axis=0)], axis=0)
    return painting


def canvas(scene: str, section: str = "repaint") -> Path:
    repaint = settings_of(scene, section)
    painting = grown(repaint)
    blurred = (
        painting
        if repaint.get("plain")
        else np.array(Image.fromarray(painting).filter(ImageFilter.GaussianBlur(BLUR)))
    )
    if repaint.get("flat"):
        blurred = np.full_like(painting, repaint["flat"])
    part = painted_part(painting.shape[:2], repaint)[..., None]
    out = (painting * (1 - part) + blurred * part).astype(np.uint8)
    if repaint.get("shapes"):
        shaped = Image.fromarray(out)
        draw = ImageDraw.Draw(shaped)
        for shape in repaint["shapes"]:
            {"rectangle": draw.rectangle, "ellipse": draw.ellipse}[shape["kind"]](
                shape["box"], fill=tuple(shape["fill"])
            )
        out = np.array(shaped)
    x0, y0, x1, y1 = repaint["crop"]
    target = REPO / repaint["canvas"]
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out[y0:y1, x0:x1]).save(target)
    return target


def laid(crop: np.ndarray, kept: np.ndarray, picture: Image.Image) -> np.ndarray:
    """The model's picture laid on the crop by the affine that differs least from
    it over what is kept."""
    ch, cw = crop.shape[:2]
    size = (cw // SMALL, ch // SMALL)
    target = np.array(Image.fromarray(crop).convert("L").resize(size)).astype(np.float32)
    weight = kept[::SMALL, ::SMALL][: size[1], : size[0]]
    gray = picture.convert("L")

    def score(a: float, b: float, tx: float, ty: float) -> float:
        seen = gray.transform(
            size, Image.AFFINE, (a * SMALL, 0, tx, 0, b * SMALL, ty), Image.BILINEAR
        )
        difference = np.abs(np.array(seen).astype(np.float32) - target)
        return float((difference * weight).sum() / weight.sum())

    ga, gb = picture.width / cw, picture.height / ch
    best = min(
        (score(a, b, tx, ty), a, b, tx, ty)
        for a in np.arange(ga * 0.85, ga * 1.06, 0.03)
        for b in np.arange(gb * 0.85, gb * 1.06, 0.03)
        for tx in range(-400, 401, 100)
        for ty in range(-300, 301, 100)
    )
    value, *p = best
    for da, dt in ((0.01, 30), (0.003, 10), (0.001, 3), (0.0003, 1)):
        better = True
        while better:
            better = False
            for index, step in ((0, da), (1, da), (2, dt), (3, dt)):
                for sign in (-1, 1):
                    tried = list(p)
                    tried[index] += sign * step
                    found = score(*tried)
                    if found < value - 1e-4:
                        value, p, better = found, tried, True
    a, b, tx, ty = p
    print(f"laid with a mean difference of {value:.2f} over what is kept")
    whole = np.array(
        picture.transform((cw, ch), Image.AFFINE, (a, 0, tx, 0, b, ty), Image.BILINEAR)
    )
    last = int((picture.height - 1 - ty) / b)
    if last < ch - 1:
        whole[last:] = whole[last - 1]
    return whole.astype(np.float32)


#: How much smaller a whole picture's outlines are compared while it is laid, and
#: how far they are softened, in the painting's pixels, so that a step of a pixel
#: tells.
WHOLE_SMALL = 4
WHOLE_SOFT = 3


def laid_whole(painting: np.ndarray, picture: Image.Image, th: dict) -> np.ndarray:
    """A model's picture of the whole scene at another hour laid on the painting:
    the affine, a scale and a shift each way, whose dark outlines, softened, differ
    least from the painting's, searched from no change at all."""
    height, width = painting.shape[:2]
    if picture.size != (width, height):
        picture = picture.resize((width, height), Image.LANCZOS)
    size = (width // WHOLE_SMALL, height // WHOLE_SMALL)

    def softened(lines: np.ndarray) -> Image.Image:
        image = Image.fromarray(lines.astype(np.uint8) * 255)
        return image.filter(ImageFilter.GaussianBlur(WHOLE_SOFT))

    target = np.array(softened(image_first.dark_lines(painting, th)).resize(size)).astype(
        np.float32
    )
    theirs = softened(image_first.dark_lines(np.array(picture), th))

    def score(a: float, b: float, tx: float, ty: float) -> float:
        seen = theirs.transform(
            size,
            Image.AFFINE,
            (a, 0, tx, 0, b, ty),
            Image.BILINEAR,
        )
        # The transform maps the small picture's pixels to the whole one's.
        return float(np.abs(np.array(seen).astype(np.float32) - target).mean())

    small = WHOLE_SMALL
    p = [float(small), float(small), 0.0, 0.0]
    value = score(*p)
    for da, dt in ((0.004, 4.0), (0.001, 1.0), (0.0003, 0.3)):
        better = True
        while better:
            better = False
            for index, step in ((0, da), (1, da), (2, dt), (3, dt)):
                for sign in (-1, 1):
                    tried = list(p)
                    tried[index] += sign * step
                    found = score(*tried)
                    if found < value - 1e-5:
                        value, p, better = found, tried, True
    a, b, tx, ty = p[0] / small, p[1] / small, p[2], p[3]
    print(
        f"laid whole: scale {a:.5f} x {b:.5f}, shift {tx:+.2f}, {ty:+.2f} pixels,"
        f" a mean difference of {value:.2f} between the softened outlines"
    )
    return np.array(
        picture.transform((width, height), Image.AFFINE, (a, 0, tx, 0, b, ty), Image.BICUBIC)
    )


def join(scene: str, picture_path: Path, section: str = "repaint") -> Path:
    repaint = settings_of(scene, section)
    if repaint.get("whole"):
        # The scene at another hour, whole (D126): laid by its outlines, taken whole.
        settings = scene_settings.settings(scene)
        painting = np.array(Image.open(REPO / repaint["from"]).convert("RGB"))
        picture = Image.open(picture_path).convert("RGB")
        target = REPO / repaint["painting"]
        Image.fromarray(laid_whole(painting, picture, settings.thresholds)).save(target)
        return target
    painting = grown(repaint).astype(np.float32)
    part = painted_part(painting.shape[:2], repaint)
    x0, y0, x1, y1 = repaint["crop"]
    crop = painting[y0:y1, x0:x1].astype(np.uint8)
    whole = laid(crop, 1 - part[y0:y1, x0:x1], Image.open(picture_path).convert("RGB"))
    inside = part[y0:y1, x0:x1, None]
    painting[y0:y1, x0:x1] = painting[y0:y1, x0:x1] * (1 - inside) + whole * inside
    target = REPO / repaint["painting"]
    Image.fromarray(painting.clip(0, 255).astype(np.uint8)).save(target)
    # The scene's edits that showed the mended part as the painting did, each mended
    # with it into a picture of its own ([edit, written]), so that the cut finds no
    # difference there that is not a thing's.
    for edit, written in repaint.get("also", []):
        picture = np.array(Image.open(REPO / edit).convert("RGB")).astype(np.float32)
        picture[y0:y1, x0:x1] = picture[y0:y1, x0:x1] * (1 - inside) + whole * inside
        picture = picture.clip(0, 255).astype(np.uint8)
        if repaint.get("opened"):
            cell = scene_settings.settings(scene).grid["x"]["spacing"]
            picture = opened(picture, painting.clip(0, 255).astype(np.uint8), part, cell)
        Image.fromarray(picture).save(REPO / written)
    if "grid" in repaint:
        grid = json.loads((REPO / repaint["from_grid"]).read_text())
        grid["y"]["cells"] = int(
            round((painting.shape[0] - grid["y"]["offset"]) / grid["y"]["spacing"])
        )
        (REPO / repaint["grid"]).write_text(json.dumps(grid, indent=2) + "\n")
    return target


#: The dark of a doorway, in the painting's value from 0 to 1: lighter than its
#: black outline, darker than the stones round it; and how far into what the door
#: hid it is looked for, as a part of a cell.
DOORWAY_DARK = (0.12, 0.35)
DOORWAY_REACH = 0.5


def opened(marked: np.ndarray, painting: np.ndarray, part: np.ndarray, cell: float) -> np.ndarray:
    """A marked picture whose mended part opened a doorway (`opened`): the dark of
    the doorway that a door hid there is magenta, as the rest of its opening, the
    magenta flooded into it up to the doorway's outline and its stones."""
    value = np.array(Image.fromarray(painting).convert("L")).astype(np.float32) / 255
    low, high = DOORWAY_DARK
    painted = part > 0.5
    dark = (value > low) & (value < high) & image_first.dilated(painted, 2)
    seeds = image_first.marked(marked) & image_first.dilated(painted, 4)
    grown = image_first.flooded(seeds, seeds | dark, round(DOORWAY_REACH * cell))
    out = marked.copy()
    out[grown & painted] = (255, 0, 255)
    return out


def filled(picture: np.ndarray, boxes: list, sides: int = 2) -> np.ndarray:
    """A picture with each box painted row by row from the pixels just left and right
    of it, blended across; with `sides` 4, from the pixels round it on all four
    sides, blended so that the box meets each of them (a Coons patch), for a box as
    wide as tall on a floor whose light changes both ways."""
    picture = picture.astype(np.float32)
    for x0, y0, x1, y1 in boxes:
        if sides != 4:
            left, right = picture[y0:y1, x0 - 1], picture[y0:y1, x1]
            across = ((np.arange(x0, x1) - (x0 - 1)) / (x1 - (x0 - 1)))[None, :, None]
            picture[y0:y1, x0:x1] = left[:, None] * (1 - across) + right[:, None] * across
            continue
        left, right = picture[y0 - 1 : y1 + 1, x0 - 1], picture[y0 - 1 : y1 + 1, x1]
        top, bottom = picture[y0 - 1, x0 - 1 : x1 + 1], picture[y1, x0 - 1 : x1 + 1]
        v = (np.arange(len(left)) / (len(left) - 1))[:, None, None]
        u = (np.arange(len(top)) / (len(top) - 1))[None, :, None]
        corners = (
            (1 - u) * (1 - v) * top[0]
            + u * (1 - v) * top[-1]
            + (1 - u) * v * bottom[0]
            + u * v * bottom[-1]
        )
        patch = (
            (1 - u) * left[:, None]
            + u * right[:, None]
            + (1 - v) * top[None]
            + v * bottom[None]
            - corners
        )
        picture[y0:y1, x0:x1] = patch[1:-1, 1:-1]
    return picture.clip(0, 255).astype(np.uint8)


def spaced_rows(knots: list[tuple[int, int]], height: int) -> np.ndarray:
    """For each row of the new picture, the row of the old it is taken from, between
    the knots ([old, new], in pixels); outside them, the row itself."""
    rows = np.arange(height, dtype=np.float32)
    old, new = zip(*knots, strict=True)
    inside = (rows >= new[0]) & (rows <= new[-1])
    rows[inside] = np.interp(rows[inside], new, old)
    return rows


def mirrored_band(
    picture: np.ndarray, band: dict, seam: tuple[int, int], px, py
) -> tuple[np.ndarray, np.ndarray]:
    """What a band freed under a seam holds (a spaced section's `band`): the picture's
    own stones above the seam, mirrored at it, so that they meet with no line and in
    the same light; in each of its `plain` spans, x0 and x1 in cells, where something
    stands on those stones, the stones beside it mirrored too. Returns the band's
    pixels, as tall as it is, and how much of each pixel it takes."""
    old_seam, new_seam = seam
    new_end = py(band["to"])
    height = new_end - new_seam
    rows = old_seam - 1 - np.arange(height)
    laid = picture[rows]
    for x0, x1, *side in band.get("plain", []):
        a, b = px(x0), px(x1)
        columns = np.arange(a, b)
        # Mirrored at its left edge, or at its right where it says so (`right`).
        source = 2 * b - 1 - columns if side == ["right"] else np.maximum(0, 2 * a - 1 - columns)
        source = np.minimum(source, picture.shape[1] - 1)
        weight = np.clip(np.minimum(columns - a, b - 1 - columns) / SEAM, 0, 1)[None, :, None]
        if side == ["right"]:
            # Up to the band's own edge, and only below the seam, where the light
            # above it has come down: what it replaces is far from what it must meet.
            weight = np.clip((b - 1 - columns) / SEAM, 0, 1)[None, :, None]
            weight = weight * np.clip(np.arange(height) / (10 * SEAM), 0, 1)[:, None, None]
        laid[:, a:b] = laid[:, a:b] * (1 - weight) + laid[:, source] * weight
    left, right = (px(v) for v in band["columns"])
    columns = np.arange(picture.shape[1])
    across = np.clip(np.minimum(columns - left, right - columns) / SEAM, 0, 1)
    # The seam under the stones fades into what lies below the band.
    down = np.clip((new_end - new_seam - np.arange(height)) / SEAM, 0, 1)
    return laid, across[None, :] * down[:, None]


def spaced(scene: str, section: str = "spaced") -> Path:
    settings = scene_settings.settings(scene)
    found = settings.data[section]
    picture = np.array(Image.open(REPO / found["from"]).convert("RGB")).astype(np.float32)
    gx, gy = settings.grid["x"], settings.grid["y"]

    def px(x: float) -> int:
        return round(gx["offset"] + x * gx["spacing"])

    def py(y: float) -> int:
        return round(gy["offset"] + y * gy["spacing"])

    # By columns, the same as by rows on the picture turned over its diagonal.
    across = "rows" in found
    along, side = (gx, gy) if across else (gy, gx)
    if across:
        picture = picture.transpose(1, 0, 2)
    knots = [
        (
            round(along["offset"] + old * along["spacing"]),
            round(along["offset"] + new * along["spacing"]),
        )
        for old, new in found["knots"]
    ]
    rows = spaced_rows(knots, picture.shape[0])
    low = np.floor(rows).astype(int)
    high = np.minimum(low + 1, picture.shape[0] - 1)
    share = (rows - low)[:, None, None]
    moved = picture[low] * (1 - share) + picture[high] * share
    first, last = found["rows"] if across else found["columns"]
    x0, x1 = (
        round(side["offset"] + first * side["spacing"]),
        round(side["offset"] + last * side["spacing"]),
    )
    # All of the moved picture between them, blending into the painting beside.
    weight = np.clip(
        np.minimum(np.arange(picture.shape[1]) - x0, x1 - np.arange(picture.shape[1])) / SEAM, 0, 1
    )[None, :, None]
    out = picture * (1 - weight) + moved * weight
    # What is left where a knot leaves a band empty: the stones above it, mirrored.
    if "band" in found:
        band = found["band"]
        seam = (py(band["old"]), py(band["from"]))
        laid, part = mirrored_band(picture, band, seam, px, py)
        here = out[seam[1] : seam[1] + laid.shape[0]]
        here[:] = here * (1 - part[..., None]) + laid * part[..., None]
    # Boxes in cells that stay as they were, each faded in over SEAM pixels.
    for bx0, by0, bx1, by1 in found.get("kept", []):
        yy, xx = np.arange(out.shape[0])[:, None], np.arange(out.shape[1])[None, :]
        off = np.maximum(
            np.maximum(px(bx0) - xx, xx - px(bx1)), np.maximum(py(by0) - yy, yy - py(by1))
        )
        stay = np.clip(1 - off / SEAM, 0, 1)[..., None]
        out = out * (1 - stay) + picture * stay
    if across:
        out = out.transpose(1, 0, 2)
    target = REPO / found["painting"]
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(target)
    return target


def tiled_over(shape: tuple[int, int], tile: np.ndarray) -> np.ndarray:
    """A picture of `shape` covered with `tile`, mirrored at each side so that it meets
    itself with no seam."""
    both = np.concatenate([tile, tile[:, ::-1]], axis=1)
    both = np.concatenate([both, both[::-1]], axis=0)
    rows = np.arange(shape[0]) % both.shape[0]
    columns = np.arange(shape[1]) % both.shape[1]
    return both[rows][:, columns]


def tiled(scene: str, section: str) -> Path:
    repaint = settings_of(scene, section)
    picture = np.array(Image.open(REPO / repaint["from"]).convert("RGB")).astype(np.float32)
    name, x0, y0, x1, y1 = repaint["texture"]
    source = np.array(Image.open(REPO / name).convert("RGB")).astype(np.float32)
    laid_over = tiled_over(picture.shape[:2], source[y0:y1, x0:x1]) * repaint.get("shade", 1.0)
    part = painted_part(picture.shape[:2], repaint)[..., None]
    out = picture * (1 - part) + laid_over * part
    target = REPO / repaint["painting"]
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(target)
    return target


def ellipse_part(width: int, height: int, fade: int) -> np.ndarray:
    """How much of a box the ellipse in it takes: 1 inside, 0 outside, a fade between."""
    ys = (np.arange(height) + 0.5 - height / 2) / (height / 2)
    xs = (np.arange(width) + 0.5 - width / 2) / (width / 2)
    radius = np.sqrt(ys[:, None] ** 2 + xs[None, :] ** 2)
    edge = max(1, fade) / (min(width, height) / 2)
    return np.clip((1 - radius) / edge, 0, 1)


def placed(scene: str, section: str) -> Path:
    settings = scene_settings.settings(scene)
    repaint = settings.data[section]
    picture = Image.open(REPO / repaint["from"]).convert("RGB")
    painting = np.array(picture).astype(np.float32)
    gx, gy = settings.grid["x"], settings.grid["y"]
    x0, y0, x1, y1 = repaint["at"]
    left, top = round(gx["offset"] + x0 * gx["spacing"]), round(gy["offset"] + y0 * gy["spacing"])
    width = round((x1 - x0) * gx["spacing"])
    height = round((y1 - y0) * gy["spacing"])
    part = Image.open(REPO / repaint["picture"]).convert("RGB").crop(tuple(repaint["part"]))
    shown = np.array(part.resize((width, height), Image.LANCZOS)).astype(np.float32)
    alpha = ellipse_part(width, height, repaint.get("fade", 6))[..., None]
    here = painting[top : top + height, left : left + width]
    painting[top : top + height, left : left + width] = here * (1 - alpha) + shown * alpha
    target = REPO / repaint["painting"]
    Image.fromarray(painting.clip(0, 255).astype(np.uint8)).save(target)
    return target


def pegs(scene: str, section: str = "pegs") -> Path:
    """The rack's pegs one a cell (D195): the painted ones filled from their sides, the
    board drawn out at its ends, and the painting's peg laid on each cell's middle."""
    settings = scene_settings.settings(scene)
    rack = settings.data[section]
    original = np.array(Image.open(REPO / rack["from"]).convert("RGB"))
    painting = filled(original, rack["painted"], sides=4).astype(np.float32)
    _, y0, _, y1 = rack["board"]
    ends = rack["ends"]
    grow = ends["grow"]
    rows = np.arange(y0, y1)
    for side, shift in (("left", -grow), ("right", grow)):
        # A stretch of board near the end, whose outlines lie at the end's own height.
        m0 = ends[f"{side}_middle"][0]
        middle = painting[y0:y1, m0 : m0 + grow].copy()
        c0, c1 = ends[side]
        piece = painting[y0:y1, c0:c1].copy()
        edge = np.array(ends[f"{side}_edge"], dtype=np.float32)
        across = np.interp(rows, edge[:, 1], edge[:, 0])[:, None]
        columns = np.arange(c0, c1)[None, :]
        # What lies inside the board's outline, the outline with it, faded over two pixels.
        inside = columns - across if side == "left" else across - columns
        alpha = np.clip((inside + 5) / 2, 0, 1)[..., None]
        target = painting[y0:y1, c0 + shift : c1 + shift]
        painting[y0:y1, c0 + shift : c1 + shift] = target * (1 - alpha) + piece * alpha
        gap = slice(c1 - grow, c1) if side == "left" else slice(c0, c0 + grow)
        painting[y0:y1, gap] = middle
    px0, py0, px1, py1 = rack["peg"]
    peg = original[py0:py1, px0:px1].astype(np.float32)
    width, height = px1 - px0, py1 - py0
    alpha = ellipse_part(width, height, rack.get("fade", 3))[..., None]
    gx = settings.grid["x"]
    first, last = rack["cells"]
    for column in range(first, last + 1):
        left = round(gx["offset"] + (column + 0.5) * gx["spacing"] - width / 2)
        here = painting[py0:py1, left : left + width]
        painting[py0:py1, left : left + width] = here * (1 - alpha) + peg * alpha
    target = REPO / rack["painting"]
    Image.fromarray(painting.clip(0, 255).astype(np.uint8)).save(target)
    return target


def fill(scene: str, section: str = "repaint") -> Path:
    repaint = settings_of(scene, section)
    target = REPO / repaint["painting"]
    sides = repaint.get("sides", 2)
    Image.fromarray(filled(grown(repaint), repaint["boxes"], sides)).save(target)
    # The scene's other pictures that show the part as the painting does, each filled
    # the same into a picture of its own ([edit, written]), as `join` mends them.
    for edit, written in repaint.get("also", []):
        picture = np.array(Image.open(REPO / edit).convert("RGB"))
        Image.fromarray(filled(picture, repaint["boxes"], sides)).save(REPO / written)
    return target


#: How the marked pictures are laid on the painting part by part, after the whole
#: picture is laid (marks): squares of TILE pixels, a square every STRIDE, each moved
#: by up to REACH pixels to lay its outlines on the painting's, worked at a WORK-th of
#: the size; a square with fewer than INKED outline pixels takes its neighbours' move.
LOCAL_TILE = 96
LOCAL_STRIDE = 48
LOCAL_REACH = 24
LOCAL_WORK = 2
LOCAL_INKED = 40


def moved_locally(shown: np.ndarray, crop: np.ndarray) -> np.ndarray:
    """A picture Gemini drew again, laid on its crop as a whole, moved part by part so
    that its outlines lie on the crop's: a model keeps a thing's shapes but not
    their places to the pixel, and a whole laying leaves some parts astray."""
    f = LOCAL_WORK
    h, w = crop.shape[:2]
    hs, ws = h // f, w // f

    def ink(image: np.ndarray) -> np.ndarray:
        small = np.array(Image.fromarray(image).resize((ws, hs), Image.BOX))
        return small.max(axis=2) < 80

    theirs, ours = ink(shown), ink(crop)
    tile, stride, reach = LOCAL_TILE // f, LOCAL_STRIDE // f, LOCAL_REACH // f
    ys = list(range(0, max(1, hs - tile) + 1, stride))
    xs = list(range(0, max(1, ws - tile) + 1, stride))
    best = np.full((len(ys), len(xs)), -1.0)
    moves = np.zeros((len(ys), len(xs), 2))
    padded = np.pad(theirs, reach)
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            # Their outline moved by (dx, dy), over ours: the overlap, summed by square.
            here = padded[reach - dy : reach - dy + hs, reach - dx : reach - dx + ws] & ours
            total = np.pad(here.cumsum(0).cumsum(1), ((1, 0), (1, 0)))
            for i, y in enumerate(ys):
                y1 = min(hs, y + tile)
                row = total[y1, :] - total[y, :]
                for j, x in enumerate(xs):
                    x1 = min(ws, x + tile)
                    score = row[x1] - row[x] - 0.01 * (dx * dx + dy * dy)
                    if score > best[i, j]:
                        best[i, j] = score
                        moves[i, j] = (dy, dx)
    # A square with little outline in it takes the middle of its neighbours' moves.
    inked = np.array(
        [[ours[y : y + tile, x : x + tile].sum() >= LOCAL_INKED for x in xs] for y in ys]
    )
    steady = moves.copy()
    for i in range(len(ys)):
        for j in range(len(xs)):
            near = moves[max(0, i - 1) : i + 2, max(0, j - 1) : j + 2]
            ok = inked[max(0, i - 1) : i + 2, max(0, j - 1) : j + 2]
            picked = near[ok] if ok.any() else near.reshape(-1, 2)
            steady[i, j] = np.median(picked, axis=0)
    # Each pixel's move, from the squares' middles, and the picture taken from there.
    cy = np.array(ys) + tile / 2
    cx = np.array(xs) + tile / 2
    yy, xx = np.arange(h) / f, np.arange(w) / f
    field = np.zeros((h, w, 2))
    for k in range(2):
        across = np.array([np.interp(xx, cx, steady[i, :, k]) for i in range(len(ys))])
        field[..., k] = np.array([np.interp(yy, cy, across[:, c]) for c in range(w)]).T
    sy = np.clip(np.arange(h)[:, None] - np.round(field[..., 0] * f).astype(int), 0, h - 1)
    sx = np.clip(np.arange(w)[None, :] - np.round(field[..., 1] * f).astype(int), 0, w - 1)
    return shown[sy, sx]


def marks(scene: str) -> list[Path]:
    settings = scene_settings.settings(scene)
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    written = []
    for found in mark_sets(settings.data["marks"]):
        out = painting.copy()
        for part in found["pictures"]:
            x0, y0, x1, y1 = part["crop"]
            crop = painting[y0:y1, x0:x1]
            # A part asked of Gemini several times is magenta where most tries
            # agree: each try strays somewhere else, and the vote keeps what they
            # share.
            names = part["picture"] if isinstance(part["picture"], list) else [part["picture"]]
            votes = np.zeros(crop.shape[:2], dtype=np.int16)
            for name in names:
                picture = Image.open(settings.edits / name).convert("RGB")
                whole = laid(crop, np.ones(crop.shape[:2], dtype=np.float32), picture)
                shown = moved_locally(whole.clip(0, 255).astype(np.uint8), crop)
                votes += image_first.marked(shown)
            here = votes * 2 > len(names)
            out[y0:y1, x0:x1][here] = (255, 0, 255)
        target = REPO / found["painting"]
        Image.fromarray(out).save(target)
        written.append(target)
        # A marked picture the doorways are laid into starts again untouched: its copy
        # is the new picture, which `doorways` lays the fills on.
        if target in also_pictures(settings):
            shutil.copyfile(target, untouched_copy(target))
            written.append(untouched_copy(target))
    return written


def also_pictures(settings: scene_settings.Settings) -> set[Path]:
    """The scene's pictures that show its doorways shut, which `doorways` lays the
    fills into (`also`)."""
    return {
        REPO / also
        for door in settings.data.get("doorways", {}).get("doors", [])
        for also in door.get("also", [])
    }


#: How dark, in the painting's value from 0 to 1, a line is that bounds a door's
#: leaf: the lines between its planks are lighter, and a flood crosses them.
DOOR_LINE = 0.14
#: How much darker an open doorway's floor is at the arch's top than at its
#: threshold, where it is the room's own light (D108).
DOORWAY_SHADE = 0.15
#: The floor's dark line under a doorway: a row of the leaf's span darker than
#: the rows round it by FOOT_DARKER of the painting's value, each column's own
#: point of it looked for FOOT_NEAR pixels about that row; the share of the
#: leaf's height its lowest straight part starts at, which gives its width.
FOOT_DARKER = 0.03
FOOT_NEAR = 5
FOOT_BAND = 0.7
#: The threshold at an open doorway's foot (D114), in cells of the painting: its
#: height; how much darker it is than the floor it is made of; its edge lines'
#: width, their waves' amplitude and periods, and how far apart its strip is looked
#: for in the floor's box (in the painting's pixels); the share of that box's
#: darkest pixels that give its joints' colour; how far its lines' ends fade (in
#: the painting's pixels); how many times larger its lines are drawn and averaged.
THRESHOLD = 0.08
THRESHOLD_SHADE = 0.1
THRESHOLD_LINE = 0.011
THRESHOLD_WAVE = 0.004
THRESHOLD_PERIODS = (0.3, 0.1)
THRESHOLD_SCAN = 4
THRESHOLD_JOINTS = 20
THRESHOLD_ENDS = 3
THRESHOLD_SOFT = 4
#: The jambs' feet beside an open doorway's fill (D114), in cells of the painting:
#: the columns looked at on each side, from and to how far outside the fill's span,
#: and how far below the fill's foot the jamb's bottom outline may begin.
JAMB_OUT = (0.03, 0.08)
JAMB_BELOW = 0.12


def leaf_of(crop: np.ndarray, bands: list[tuple[int, int, int]]) -> np.ndarray:
    """A door's leaf in a crop of the painting round it: flooded from bands of
    seeds across it, each from one pixel to another on a row (x0, x1, y), up to
    the black line round it, the lighter lines between its planks crossed; each
    row then filled from its leftmost pixel to its rightmost, so that the
    keyhole's plate and the darkest planks' lines are of the leaf too, and each
    column from its top to its bottom, for a hinge's arm that reaches the
    leaf's edge. A band across its top rail, which a line as dark as the leaf's
    own cuts off, finds that rail too."""
    value = np.array(Image.fromarray(crop).convert("L")).astype(np.float32) / 255
    passable = value > DOOR_LINE
    seeds = np.zeros_like(passable)
    for x0, x1, row in bands:
        seeds[row - 2 : row + 3, x0:x1] = True
    leaf = image_first.flooded(seeds & passable, passable, passable.size)
    for y in np.nonzero(leaf.any(axis=1))[0]:
        xs = np.nonzero(leaf[y])[0]
        leaf[y, xs[0] : xs[-1] + 1] = True
    # And each column from its top to its bottom, so that a hinge's arm reaching
    # the leaf's edge, which no row fills, is of the leaf too.
    for x in np.nonzero(leaf.any(axis=0))[0]:
        ys = np.nonzero(leaf[:, x])[0]
        leaf[ys[0] : ys[-1] + 1, x] = True
    return image_first.filled(leaf, leaf.size)


def polygon_in(shape: tuple[int, int], box: tuple[int, int, int, int], points: list) -> np.ndarray:
    """A polygon of the picture's pixels as a mask of a crop of it from `box`."""
    mask = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(mask).polygon([(x - box[0], y - box[1]) for x, y in points], fill=255)
    return np.array(mask) > 0


def doorways(scene: str) -> list[Path]:
    settings = scene_settings.settings(scene)
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    gx, gy = settings.grid["x"], settings.grid["y"]

    def px(x: float) -> int:
        return round(gx["offset"] + x * gx["spacing"])

    def py(y: float) -> int:
        return round(gy["offset"] + y * gy["spacing"])

    def cy(row: float) -> float:
        return (row - gy["offset"]) / gy["spacing"]

    value = np.array(Image.fromarray(painting).convert("L")).astype(np.float32) / 255
    written = []
    # The pictures that show the doorways shut, each laid from its untouched copy
    # once and then with every door's fill, and written when all are laid.
    shut_pictures: dict[Path, np.ndarray] = {}
    for door in settings.data["doorways"]["doors"]:
        # The leaf is looked for in its own box (`leaf_box`): the thing's may reach on
        # to where the leaf swings to.
        x0, y0, x1, y1 = door.get("leaf_box", settings.things[door["thing"]]["box"])
        box = (px(x0), py(y0), px(x1), py(y1))
        crop = painting[box[1] : box[3], box[0] : box[2]]
        bands = [
            (px(left) - box[0], px(right) - box[0], py(across) - box[1])
            for left, right, across in door["seeds"]
        ]
        # The leaf's shape traced by hand (`shape`, in cells), where bands of iron or an
        # open outline keep a flood from filling it; else flooded from its seeds.
        shut = (
            polygon_in(crop.shape[:2], box, [(px(x), py(y)) for x, y in door["shape"]])
            if "shape" in door
            else leaf_of(crop, bands)
        )
        # Down to the floor's own line under the box, looked for `sill` cells below it.
        below = round(door.get("sill", 0.0) * gy["spacing"])
        tall = np.pad(painting, ((0, below), (0, 0), (0, 0)), mode="edge")
        deeper = tall[box[1] : box[3] + below, box[0] : box[2]]
        leaf, foot, start, own = to_foot(
            deeper, np.pad(shut, ((0, below), (0, 0))), box[3] - box[1]
        )
        ends = cy(box[1] + foot[[0, -1]])
        if own:
            found = "the closed leaf's own outline"
        elif (foot >= len(deeper) - 0.5).all():
            found = "the foot of the leaf's box and its `sill`, no line there"
        else:
            found = "the floor's own line"
        print(f"{door['thing']}: the foot on {ends[0]:.3f} to {ends[1]:.3f}, {found}")
        if own:
            # Over the closed leaf's own outline, the threshold reaches down to the
            # jambs' feet, and the fill down to its top (D114).
            sides = jambs_feet(
                value,
                box[0] + start,
                box[0] + start + len(foot),
                box[1] + foot,
                (gx["spacing"], gy["spacing"]),
            )
            if None in sides:
                print(
                    f"{door['thing']}: the jambs' feet are not both found; the threshold's"
                    " foot stays the outline's lower edge"
                )
            else:
                left, right = (side - box[1] for side in sides)
                foot = np.linspace(left, right, len(foot)).astype(np.float32)
                board = foot - max(1, round(THRESHOLD * gy["spacing"]))
                leaf = leaf.copy()
                for x in range(len(foot)):
                    rows = np.nonzero(leaf[:, start + x])[0]
                    if len(rows):
                        leaf[rows[-1] + 1 : round(float(board[x])), start + x] = True
                print(
                    f"{door['thing']}: the jambs' feet {cy(sides[0]):.3f} (left) and"
                    f" {cy(sides[1]):.3f} (right); the threshold's foot"
                    f" {cy(box[1] + float(foot.mean())):.3f}; the fill ends at its top,"
                    f" {cy(box[1] + float(board[0])):.3f} to {cy(box[1] + float(board[-1])):.3f}"
                )
        leaf = leaf[: painting.shape[0] - box[1]]
        ys, xs = np.nonzero(leaf)
        top, bottom, first, last = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        fx0, fy0, fx1, fy1 = door["floor"]
        floor = Image.fromarray(painting).crop((px(fx0), py(fy0), px(fx1), py(fy1)))
        floor = np.array(floor.resize((last - first, bottom - top), Image.LANCZOS)).astype(
            np.float32
        )
        # Darker under the arch, the room's own light at the threshold.
        light = 1 - DOORWAY_SHADE * np.linspace(1, 0, bottom - top)[:, None, None]
        floor = (floor * light).clip(0, 255).astype(np.uint8)
        out = painting.copy()
        here = out[box[1] + top : box[1] + bottom, box[0] + first : box[0] + last]
        inside = leaf[top:bottom, first:last]
        here[inside] = floor[inside]
        mended = np.zeros(painting.shape[:2], dtype=bool)
        mended[box[1] : box[1] + leaf.shape[0], box[0] : box[0] + leaf.shape[1]] = leaf
        # At its foot, the threshold (D114).
        floor_box = (px(fx0), py(fy0), px(fx1), py(fy1))
        drawn, measured = threshold(
            out,
            painting[floor_box[1] : floor_box[3], floor_box[0] : floor_box[2]],
            start,
            foot,
            box,
            (gx["spacing"], gy["spacing"]),
            gx["offset"],
        )
        mended[box[1] : box[1] + drawn.shape[0], box[0] : box[0] + drawn.shape[1]] |= drawn
        span = [(box[0] + v - gx["offset"]) / gx["spacing"] for v in (start, start + len(foot))]
        strip = floor_box[0] + measured["strip"]
        print(
            f"{door['thing']}: the threshold spans {span[0]:.3f} to {span[1]:.3f}, from the"
            f" strip x {strip} to {strip + measured['wide']}, y {floor_box[1]} to"
            f" {floor_box[3]} of the painting; its joints"
            f" {tuple(round(float(c)) for c in measured['colour'])}"
        )
        # What lies under the threshold, the floor before the door, below the reach of
        # its lower line and that line's wave: the painting's.
        reach = int(np.ceil((THRESHOLD_LINE / 2 + 1.5 * THRESHOLD_WAVE) * gy["spacing"])) + 1
        under = [
            np.abs(out[y : y + 4, x].astype(int) - painting[y : y + 4, x]).mean()
            for x, y in (
                (box[0] + start + i, box[1] + round(float(v)) + reach) for i, v in enumerate(foot)
            )
        ]
        print(
            f"{door['thing']}: under the threshold, {np.mean(under):.2f} levels"
            f" (at most {np.max(under):.2f}) from the painting"
        )
        target = settings.edits / door["painting"]
        Image.fromarray(out).save(target)
        written.append(target)
        # The scene's pictures that show the doorway shut, laid with it.
        for also in door.get("also", []):
            path = REPO / also
            if path not in shut_pictures:
                shut_pictures[path] = np.array(Image.open(untouched(path)).convert("RGB"))
            shut_pictures[path][mended] = out[mended]
        if "guide" in door:
            target = settings.edits / door["guide"]["picture"]
            picture = guided(out, crop, shut, box, door["guide"], gx["spacing"])
            Image.fromarray(picture).save(target)
            written.append(target)
    for path, picture in shut_pictures.items():
        Image.fromarray(picture).save(path)
        written.append(path)
    return written


def untouched_copy(path: Path) -> Path:
    """Where a picture's untouched copy is kept: beside it, `<stem>-untouched.<suffix>`."""
    return path.with_name(f"{path.stem}-untouched{path.suffix}")


def untouched(path: Path) -> Path:
    """A picture's untouched copy: the picture before any doorway was laid into it,
    made from it when no copy exists, and what every run lays the doorways on."""
    copy = untouched_copy(path)
    if not copy.exists():
        shutil.copyfile(path, copy)
    return copy


def jambs_feet(
    value: np.ndarray,
    first: int,
    last: int,
    feet: np.ndarray,
    spacing: tuple[float, float],
) -> list[float | None]:
    """The feet of the jambs on either side of a doorway's fill, columns `first` to
    `last` of the painting's value (0 to 1), the fill's foot `feet` (its rows, per
    column, in the painting): on each side, the columns from JAMB_OUT[0] to
    JAMB_OUT[1] cells outside the span, the mean of their values, and in it the
    first run of rows darker than DOOR_LINE that begins below the fill's foot and
    within JAMB_BELOW cells of it, the jamb's bottom outline; the row under its
    last is that jamb's foot. None on a side where no such run is found."""
    sx, sy = spacing
    near, far = (round(share * sx) for share in JAMB_OUT)
    height, width = value.shape
    found: list[float | None] = []
    for columns, foot in (
        (slice(max(0, first - far), max(0, first - near)), feet[0]),
        (slice(min(width, last + near), min(width, last + far)), feet[-1]),
    ):
        side = None
        if columns.stop > columns.start:
            dark = value[:, columns].mean(axis=1) < DOOR_LINE
            begin = int(np.ceil(float(foot)))
            for y in range(begin, min(height, begin + round(JAMB_BELOW * sy) + 1)):
                if dark[y] and not dark[y - 1]:
                    end = y
                    while end < height and dark[end]:
                        end += 1
                    side = float(end)
                    break
        found.append(side)
    return found


def to_foot(
    crop: np.ndarray, leaf: np.ndarray, under: int
) -> tuple[np.ndarray, np.ndarray, int, bool]:
    """A door's leaf grown down to the first dark line under its box, `under` rows
    down the crop, from one jamb to the other: the leaf's lowest straight part
    gives its width, and each column of it is filled to its own point of the line,
    a straight line fitted through them; where no line is found, to the crop's
    foot. A line with something of a line's darkness between it and the leaf, the
    leaf's own outline over a threshold, is the floor's: the fill ends on its top.
    A line with nothing but the leaf's wood above it is the closed leaf's own
    bottom outline: the fill goes down through it to its lower edge and looks no
    further. Gives the grown leaf, the row each of its columns ends on, its first
    column, and whether that foot is the closed leaf's own outline (`own`)."""
    value = np.array(Image.fromarray(crop).convert("L")).astype(np.float32) / 255
    rows = np.nonzero(leaf.any(axis=1))[0]
    top, bottom = rows[0], rows[-1] + 1
    band = range(top + round(FOOT_BAND * (bottom - top)), bottom)
    first = min(np.nonzero(leaf[y])[0][0] for y in band if leaf[y].any())
    last = max(np.nonzero(leaf[y])[0][-1] for y in band if leaf[y].any()) + 1
    inner = slice(first + (last - first) // 10, last - (last - first) // 10)
    profile = value[:, inner].mean(axis=1)
    height, far = len(value), 2 * FOOT_NEAR
    found = height
    # The first row darker than the rows a little above and below it: a line, not
    # the planks' even brown nor the floor's.
    for y in range(under, height):
        round_it = min(profile[max(0, y - far)], profile[min(height - 1, y + far)])
        if round_it - profile[y] > FOOT_DARKER:
            found = y
            break
    feet = np.full(last - first, found, dtype=np.float32)
    # The leaf's own: every row between its foot and the line mostly lighter than
    # its outlines (the centre door's planks under its box), or none at all.
    between = value[bottom:found, inner] > DOOR_LINE
    own = found < height and (found <= bottom or bool(between.mean(axis=1).min() > 0.5))
    if found < height:
        points = []
        for x in range(first, last):
            # The column's own first pixel of the line, darker than it is just above.
            above = value[max(0, found - far), x]
            near = np.arange(max(0, found - FOOT_NEAR), min(height, found + FOOT_NEAR + 1))
            dark = near[value[near, x] < above - FOOT_DARKER]
            if not len(dark):
                continue
            if own:
                # Down through the line to its lower edge: the first pixel lighter
                # than halfway between its darkest and the floor a little below it.
                run = np.arange(dark[0], min(height, dark[0] + 3 * FOOT_NEAR))
                floor = value[min(height - 1, dark[0] + 3 * FOOT_NEAR), x]
                half = (value[run, x].min() + floor) / 2
                darkest = run[int(np.argmin(value[run, x]))]
                lighter = np.nonzero(value[darkest : run[-1] + 1, x] > half)[0]
                if not len(lighter):
                    continue
                points.append((x - first, darkest + lighter[0]))
            else:
                points.append((x - first, dark[0]))
        if len(points) > 2:
            xs, ys = np.array(points, dtype=np.float32).T
            fit = np.polyfit(xs, ys, 1)
            # Again without the points far off it, a plank's line or a speck.
            close = np.abs(np.polyval(fit, xs) - ys) <= 2
            if close.sum() > 2:
                fit = np.polyfit(xs[close], ys[close], 1)
            feet = np.polyval(fit, np.arange(last - first)).astype(np.float32)
    grown = leaf.copy()
    for x in range(first, last):
        grown[band.start : max(band.start, round(float(feet[x - first]))), x] = True
    return grown, feet, first, bool(own)


def threshold(
    out: np.ndarray,
    floor: np.ndarray,
    first: int,
    feet: np.ndarray,
    box: tuple,
    spacing: tuple[float, float],
    origin: float,
) -> tuple[np.ndarray, dict]:
    """The threshold of an open doorway (D114), drawn in `out`: from the fill's
    first column across its span, its foot on the fill's foot (`feet`, rows of the
    crop at `box`), THRESHOLD cells high; made of the plainest strip of the floor
    seen through the doorway (`floor`, that floor's box in the painting), turned a
    quarter, as bright as that floor on the whole and THRESHOLD_SHADE darker; its
    two edges drawn as thin wavy lines in the colour of that floor's joints.
    `spacing` is the painting's pixels a cell, each way; `origin` the grid's x
    offset, for the waves' phase. Gives the pixels it is drawn on, in the crop at
    `box`, and what was measured of it."""
    sx, sy = spacing
    count = len(feet)
    tall = max(1, round(THRESHOLD * sy))
    wide = max(1, round(THRESHOLD * sx))
    # The plainest strip, THRESHOLD wide and the box's height, looked for every few
    # pixels across it: the least colour spread over its pixels.
    spread = [
        (floor[:, x : x + wide].reshape(-1, 3).std(axis=0).sum(), x)
        for x in range(0, max(1, floor.shape[1] - wide + 1), THRESHOLD_SCAN)
    ]
    _, at = min(spread)
    strip = np.rot90(floor[:, at : at + wide], 1)
    board = Image.fromarray(np.ascontiguousarray(strip)).resize((count, tall), Image.LANCZOS)
    # As bright as the floor's box on the whole, then a tenth darker: the plainest
    # strip may be one plank lighter or darker than the floor round it.
    board = np.array(board).astype(np.float32)
    level = floor.astype(np.float32).mean() / max(1.0, float(strip.astype(np.float32).mean()))
    board = (board * level * (1 - THRESHOLD_SHADE)).clip(0, 255)
    # The floor's joints: the darkest of its pixels.
    pixels = floor.reshape(-1, 3).astype(np.float32)
    joints = pixels[np.argsort(pixels.sum(axis=1))[: max(1, len(pixels) // THRESHOLD_JOINTS)]]
    colour = joints.mean(axis=0)
    height = int(np.ceil(feet.max())) + tall + 4
    width = first + count
    drawn = np.zeros((height, width), dtype=bool)
    here = out[box[1] : box[1] + height, box[0] : box[0] + width].astype(np.float32)
    for x in range(count):
        foot = round(float(feet[x]))
        here[foot - tall : foot, first + x] = board[:, x]
        drawn[foot - tall : foot, first + x] = True
    # Its edges, drawn THRESHOLD_SOFT times larger and averaged: each a wave about
    # its edge, THRESHOLD_LINE wide, its ends fading over THRESHOLD_ENDS pixels.
    soft = THRESHOLD_SOFT
    xs = (np.arange(count * soft) + 0.5) / soft
    cells = (box[0] + first + xs - origin) / sx
    amplitude = THRESHOLD_WAVE * sy
    long, short = THRESHOLD_PERIODS
    wave = amplitude * np.sin(2 * np.pi * cells / long) + amplitude / 2 * np.sin(
        2 * np.pi * cells / short + 1
    )
    feet_fine = np.interp(xs - 0.5, np.arange(count), feet)
    ys = (np.arange(height * soft) + 0.5)[:, None] / soft
    line = THRESHOLD_LINE * sy / 2
    covered = np.zeros((height * soft, count * soft), dtype=bool)
    for middle in (feet_fine - tall, feet_fine):
        covered |= np.abs(ys - (middle + wave)[None, :]) <= line
    alpha = covered.reshape(height, soft, count, soft).mean(axis=(1, 3))
    ends = np.clip(
        np.minimum(np.arange(count) + 1, count - np.arange(count)) / THRESHOLD_ENDS, 0, 1
    )
    alpha = alpha * ends[None, :]
    span = here[:, first:]
    span[:] = span * (1 - alpha[..., None]) + colour * alpha[..., None]
    drawn[:, first:] |= alpha > 0
    out[box[1] : box[1] + height, box[0] : box[0] + width] = here.clip(0, 255).astype(np.uint8)
    return drawn, {"strip": at, "wide": wide, "colour": colour}


#: A door swung open nearly flat against its wall (D111): how much darker its leaf
#: is than shut, how much its free edge stands forward, lower in the picture, and
#: how wide and dark its shadow on the wall is, as parts of a cell.
GUIDE_SHADE = 0.88
GUIDE_DROP = 0.08
GUIDE_SHADOW = 0.14
GUIDE_SHADOW_DARK = 0.45


def guided(
    doorway: np.ndarray,
    crop: np.ndarray,
    leaf: np.ndarray,
    box: tuple[int, int, int, int],
    guide: dict,
    cell: float,
) -> np.ndarray:
    """The doorway's picture with its door swung open out of it, as the guide a model
    paints the open door on (D111): the shut leaf, exactly the opening's size,
    turned over on its hinges at the opening's edge (`side`, the side it swings
    to), so that it lies over the arch's stones there and the wall beyond; its
    free edge a little forward, lower in the picture, and a little darker; its
    shadow on the wall beyond that edge."""
    ys, xs = np.nonzero(leaf)
    top, bottom, first, last = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    height, width = bottom - top, last - first
    patch = crop[top:bottom, first:last].astype(np.float32)[:, ::-1] * GUIDE_SHADE
    alpha = leaf[top:bottom, first:last][:, ::-1].astype(np.float32)
    # The free edge is the far one from the hinges: drawn lower the further from them.
    drop = round(GUIDE_DROP * cell)
    toward = 1 if guide["side"] == "right" else -1
    columns = np.arange(width)
    far = columns if toward > 0 else columns[::-1]
    shifts = np.round(far / max(1, width - 1) * drop).astype(int)
    tall = height + drop
    moved = np.zeros((tall, width, 3), dtype=np.float32)
    moved_alpha = np.zeros((tall, width), dtype=np.float32)
    for column, shift in zip(columns, shifts, strict=True):
        moved[shift : shift + height, column] = patch[:, column]
        moved_alpha[shift : shift + height, column] = alpha[:, column]
    out = doorway.astype(np.float32)
    y0 = box[1] + top
    hinge = box[0] + (last if toward > 0 else first)
    x0 = hinge if toward > 0 else hinge - width
    # The shadow on the wall, beyond the free edge, fading away from it.
    reach = max(2, round(GUIDE_SHADOW * cell))
    edge = x0 + width if toward > 0 else x0
    for step in range(reach):
        x = edge + step if toward > 0 else edge - 1 - step
        dark = GUIDE_SHADOW_DARK * (1 - step / reach)
        column = moved_alpha[:, -1 if toward > 0 else 0] > 0.5
        out[y0 : y0 + tall, x][column] *= 1 - dark
    here = out[y0 : y0 + tall, x0 : x0 + width]
    a = moved_alpha[..., None]
    here[:] = here * (1 - a) + moved * a
    return out.clip(0, 255).astype(np.uint8)


def mark_sets(marks: dict) -> list[dict]:
    """A scene's sets of marked pictures, each written into a painting of its own:
    its things in one, and a bed's covers, which lie on its bed, in another."""
    return marks["sets"] if "sets" in marks else [marks]


def main(arguments: list[str]) -> int:
    section = "repaint"
    if "--section" in arguments:
        at = arguments.index("--section")
        section = arguments[at + 1]
        arguments = arguments[:at] + arguments[at + 2 :]
    verbs = ("canvas", "join", "fill", "marks", "doorways", "spaced", "tiled", "placed", "pegs")
    if len(arguments) < 2 or arguments[1] not in verbs:
        print(
            "usage: repaint.py <scene> canvas | join <picture> | fill | marks | doorways"
            " | spaced | tiled | placed | pegs [--section <name>]"
        )
        return 2
    if arguments[1] in ("marks", "doorways"):
        for path in (marks if arguments[1] == "marks" else doorways)(arguments[0]):
            print(path.relative_to(REPO))
        return 0
    if arguments[1] == "spaced":
        print(
            spaced(arguments[0], "spaced" if section == "repaint" else section).relative_to(REPO)
        )
    elif arguments[1] == "tiled":
        print(tiled(arguments[0], section).relative_to(REPO))
    elif arguments[1] == "placed":
        print(placed(arguments[0], section).relative_to(REPO))
    elif arguments[1] == "pegs":
        print(pegs(arguments[0], "pegs" if section == "repaint" else section).relative_to(REPO))
    elif arguments[1] == "canvas":
        print(canvas(arguments[0], section).relative_to(REPO))
    elif arguments[1] == "fill":
        print(fill(arguments[0], section).relative_to(REPO))
    else:
        print(join(arguments[0], Path(arguments[2]), section).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
