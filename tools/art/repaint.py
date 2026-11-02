#!/usr/bin/env python3
"""A chosen painting mended in a few places, and nowhere else (the owner's rule of
2026-10-26: once a scene's painting is chosen it does not change, unless it must).

    tools/art/repaint.py <scene> canvas
    tools/art/repaint.py <scene> join <picture>

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
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import scene_settings  # noqa: E402

REPO = HERE.parents[1]
#: How wide the fade is round a box the model paints, in the painting's pixels.
FADE = 40
#: How much smaller the laying is searched at, and the blur of what is to be painted.
SMALL = 8
BLUR = 60


def settings_of(scene: str) -> dict:
    found = scene_settings.settings(scene).data.get("repaint")
    if not found:
        raise SystemExit(f"{scene}: its settings name nothing to repaint")
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


def canvas(scene: str) -> Path:
    repaint = settings_of(scene)
    painting = grown(repaint)
    blurred = np.array(Image.fromarray(painting).filter(ImageFilter.GaussianBlur(BLUR)))
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


def join(scene: str, picture_path: Path) -> Path:
    repaint = settings_of(scene)
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


def main(arguments: list[str]) -> int:
    if len(arguments) < 2 or arguments[1] not in ("canvas", "join"):
        print("usage: repaint.py <scene> canvas | repaint.py <scene> join <picture>")
        return 2
    if arguments[1] == "canvas":
        print(canvas(arguments[0]).relative_to(REPO))
    else:
        print(join(arguments[0], Path(arguments[2])).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
