#!/usr/bin/env python3
"""A chosen painting mended in a few places, and nowhere else (the owner's rule of
2026-10-26: once a scene's painting is chosen it does not change, unless it must).

    tools/art/repaint.py <scene> canvas [--section <name>]
    tools/art/repaint.py <scene> join <picture> [--section <name>]
    tools/art/repaint.py <scene> fill [--section <name>]
    tools/art/repaint.py <scene> marks

What to mend is the scene's settings' `repaint` (art/scenes/<scene>/cut.json,
D82): the painting it starts from (`from`), how many pixels it grows by below
(`grow`), the boxes of it, in its pixels, a model paints again (`boxes`), the
part of the canvas the model is given (`crop`, x0, y0, x1, y1, so that what is to
be kept is large in its picture and hard to paint over), and where the canvas
and the mended painting go.

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
a set of their own, each set a painting (`sets`), the first the sweep's.

`fill` mends without a model: each box, a narrow upright strip, is painted row
by row from the pixels just left and right of it, blended across, so that what
lies under a thin thing (the entrance lamp's chain over a plain floor) goes on
across it. A model given such a strip blurred painted the chain again.

The same is done for any other section of the settings, named by `--section`:
`without`, the edit of a scene indoors without its static things (D89), which
those things are cut against. There, `boxes` may be `"statics"`, every static
thing's box, a little grown; `plain` gives the model the painting itself, not
blurred, for it to take the things out of; and with no `crop` the model is given
the whole painting.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import image_first  # noqa: E402
import scene_settings  # noqa: E402

REPO = HERE.parents[1]
#: How wide the fade is round a box the model paints, in the painting's pixels.
FADE = 40
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


def painted_part(shape: tuple[int, int], boxes: list[list[int]], grow: int) -> np.ndarray:
    """How much of each pixel the model paints: 1 in a box or the grown band, 0 a
    FADE beyond them."""
    height, width = shape
    yy, xx = np.arange(height)[:, None], np.arange(width)[None, :]
    kept = np.ones(shape, dtype=np.float32)
    for x0, y0, x1, y1 in [*boxes, *([[0, height - grow, width, height]] if grow else [])]:
        dx = np.maximum(np.maximum(x0 - xx, xx - x1), 0)
        dy = np.maximum(np.maximum(y0 - yy, yy - y1), 0)
        kept = np.minimum(kept, np.clip(np.hypot(dx, dy) / FADE, 0, 1))
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
    part = painted_part(painting.shape[:2], repaint.get("boxes", []), repaint.get("grow", 0))[
        ..., None
    ]
    out = (painting * (1 - part) + blurred * part).astype(np.uint8)
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


def join(scene: str, picture_path: Path, section: str = "repaint") -> Path:
    repaint = settings_of(scene, section)
    painting = grown(repaint).astype(np.float32)
    part = painted_part(painting.shape[:2], repaint.get("boxes", []), repaint.get("grow", 0))
    x0, y0, x1, y1 = repaint["crop"]
    crop = painting[y0:y1, x0:x1].astype(np.uint8)
    whole = laid(crop, 1 - part[y0:y1, x0:x1], Image.open(picture_path).convert("RGB"))
    inside = part[y0:y1, x0:x1, None]
    painting[y0:y1, x0:x1] = painting[y0:y1, x0:x1] * (1 - inside) + whole * inside
    target = REPO / repaint["painting"]
    Image.fromarray(painting.clip(0, 255).astype(np.uint8)).save(target)
    if "grid" in repaint:
        grid = json.loads((REPO / repaint["from_grid"]).read_text())
        grid["y"]["cells"] = int(
            round((painting.shape[0] - grid["y"]["offset"]) / grid["y"]["spacing"])
        )
        (REPO / repaint["grid"]).write_text(json.dumps(grid, indent=2) + "\n")
    return target


def fill(scene: str, section: str = "repaint") -> Path:
    repaint = settings_of(scene, section)
    painting = grown(repaint).astype(np.float32)
    for x0, y0, x1, y1 in repaint["boxes"]:
        left, right = painting[y0:y1, x0 - 1], painting[y0:y1, x1]
        across = ((np.arange(x0, x1) - (x0 - 1)) / (x1 - (x0 - 1)))[None, :, None]
        painting[y0:y1, x0:x1] = left[:, None] * (1 - across) + right[:, None] * across
    target = REPO / repaint["painting"]
    Image.fromarray(painting.clip(0, 255).astype(np.uint8)).save(target)
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
    return written


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
    if len(arguments) < 2 or arguments[1] not in ("canvas", "join", "fill", "marks"):
        print(
            "usage: repaint.py <scene> canvas | join <picture> | fill | marks [--section <name>]"
        )
        return 2
    if arguments[1] == "marks":
        for path in marks(arguments[0]):
            print(path.relative_to(REPO))
        return 0
    if arguments[1] == "canvas":
        print(canvas(arguments[0], section).relative_to(REPO))
    elif arguments[1] == "fill":
        print(fill(arguments[0], section).relative_to(REPO))
    else:
        print(join(arguments[0], Path(arguments[2]), section).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
