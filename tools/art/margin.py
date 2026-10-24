#!/usr/bin/env python3
"""A scene's margin (D83): the painting gone on beyond its playable area, so that
the camera zoomed out shows painting and never the frame's colour.

    tools/art/margin.py <scene> canvas
    tools/art/margin.py <scene> join <picture>

The margin's size, in cells on each side, and where its pictures go are the
scene's settings (`margin` in art/scenes/<scene>/cut.json, D82).

`canvas` writes the picture a model is given to paint the margin on: the scene's
painting in the middle, where the margin's cells put it, and round it the
painting's own edge stretched outward and blurred, so that the model sees the
colours round the scene and no shape to copy. A prompt file asks the model to
paint the border and change nothing inside (tools/art/prompts/).

`join <picture>` lays the model's picture on the canvas, scaled and moved by
the least difference with the painting over its inside, says how well its
border meets the painting's edge, cell by cell, and writes the margin painting:
the model's border round the scene's own painting, joined by a short fade. The
inside is always the painting's, pixel for pixel, whatever the model did to it:
the cut and the edits line up with the painting, not with the model's copy.
Since nothing of the margin rises into the playable area, the margin is ground,
drawn under everything, and is never cut.
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
#: How much of a cell of the edge's band may change its shapes before the seam
#: there is said to be bad; and how wide that band is, in the painting's pixels.
BAD = 0.2
BAND = 60
#: How wide the fade is where the inside meets the border, in the painting's pixels.
FADE = 40


def margin_of(settings: scene_settings.Settings) -> dict:
    margin = settings.data.get("margin")
    if not margin:
        raise SystemExit(f"{settings.id}: its settings name no margin")
    return margin


def placed(settings: scene_settings.Settings) -> tuple[dict, int, int, int, int]:
    """The margin painting's grid, its size, and where the painting lies in it."""
    grid = settings.grid
    left, top, right, bottom = margin_of(settings)["cells"]
    sx, sy = grid["x"]["spacing"], grid["y"]["spacing"]
    columns, rows = grid["x"]["cells"] + left + right, grid["y"]["cells"] + top + bottom
    width, height = round(columns * sx), round(rows * sy)
    # The painting's cell (0, 0) at the margin painting's cell (left, top).
    ox, oy = round(left * sx - grid["x"]["offset"]), round(top * sy - grid["y"]["offset"])
    margin_grid = {
        "x": {"spacing": sx, "offset": ox + grid["x"]["offset"] - left * sx, "cells": columns},
        "y": {"spacing": sy, "offset": oy + grid["y"]["offset"] - top * sy, "cells": rows},
    }
    return margin_grid, width, height, ox, oy


def canvas(settings: scene_settings.Settings) -> Path:
    grid, width, height, ox, oy = placed(settings)
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    ph, pw = painting.shape[:2]
    ys = np.clip(np.arange(height) - oy, 0, ph - 1)
    xs = np.clip(np.arange(width) - ox, 0, pw - 1)
    stretched = painting[ys][:, xs]
    out = np.array(Image.fromarray(stretched).filter(ImageFilter.GaussianBlur(60)))
    out[oy : oy + ph, ox : ox + pw] = painting
    target = REPO / margin_of(settings)["canvas"]
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(out).save(target)
    return target


def laid(settings: scene_settings.Settings, picture: Image.Image) -> tuple[np.ndarray, float]:
    """The model's picture scaled and moved onto the canvas: the affine, from a
    first guess by the sizes, that gives the least difference with the painting
    over its inside, searched at a quarter of the size; and that difference."""
    _, width, height, ox, oy = placed(settings)
    painting = Image.open(settings.painting).convert("RGB")
    quarter = 4
    target = np.array(
        painting.convert("L").resize((painting.width // quarter, painting.height // quarter))
    ).astype(np.float32)
    size = (painting.width // quarter, painting.height // quarter)

    def score(p: list[float]) -> float:
        sx, sy, tx, ty = p
        affine = (sx * quarter, 0, tx + ox * sx, 0, sy * quarter, ty + oy * sy)
        seen = picture.transform(size, Image.AFFINE, affine, resample=Image.BILINEAR).convert("L")
        return float(np.abs(np.array(seen).astype(np.float32) - target).mean())

    best_p = [picture.width / width, picture.height / height, 0.0, 0.0]
    best = score(best_p)
    for scale_step, shift in ((0.002, 24), (0.0005, 8), (0.0001, 2), (0.00003, 0.5)):
        better = True
        while better:
            better = False
            for index, step in ((0, scale_step), (1, scale_step), (2, shift), (3, shift)):
                for sign in (-1, 1):
                    tried = list(best_p)
                    tried[index] += sign * step
                    value = score(tried)
                    if value < best - 1e-4:
                        best, best_p, better = value, tried, True
    sx, sy, tx, ty = best_p
    affine = (sx, 0, tx, 0, sy, ty)
    whole = picture.transform((width, height), Image.AFFINE, affine, Image.BILINEAR)
    return np.array(whole), best


def seam(settings: scene_settings.Settings, whole: np.ndarray) -> list[tuple[str, int, float]]:
    """The cells of the painting's edge where the laid picture's shapes are not the
    painting's, in a band just inside the edge: where the border would not go on
    from the painting."""
    grid, _, _, ox, oy = placed(settings)
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    ph, pw = painting.shape[:2]
    inside = whole[oy : oy + ph, ox : ox + pw]
    changed = image_first.difference(inside, painting)
    # The shapes, not the lines' small wobble: opened of what is thinner than a few pixels.
    shapes = Image.fromarray(changed.astype(np.uint8) * 255)
    shapes = np.array(shapes.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9)))
    shapes = shapes > 127
    sx, sy = grid["x"]["spacing"], grid["y"]["spacing"]
    found = []
    for side, strip, step in (
        ("top", shapes[:BAND], sx),
        ("bottom", shapes[-BAND:], sx),
        ("left", shapes[:, :BAND].T, sy),
        ("right", shapes[:, -BAND:].T, sy),
    ):
        for cell in range(int(np.ceil(strip.shape[1] / step))):
            share = float(strip[:, int(cell * step) : int((cell + 1) * step)].mean())
            if share > BAD:
                found.append((side, cell, round(share, 2)))
    return found


def join(settings: scene_settings.Settings, picture_path: Path) -> Path:
    grid, _, _, ox, oy = placed(settings)
    whole, difference = laid(settings, Image.open(picture_path).convert("RGB"))
    print(f"laid with a mean difference of {difference:.2f} over the inside")
    bad = seam(settings, whole)
    print("the border does not meet the edge at: " + (", ".join(map(str, bad)) or "nowhere"))
    painting = np.array(Image.open(settings.painting).convert("RGB")).astype(np.float32)
    ph, pw = painting.shape[:2]
    yy, xx = np.arange(ph)[:, None], np.arange(pw)[None, :]
    edge = np.minimum(np.minimum(yy, ph - 1 - yy), np.minimum(xx, pw - 1 - xx)).astype(np.float32)
    alpha = np.clip(edge / FADE, 0, 1)[..., None]
    out = whole.astype(np.float32)
    inside = out[oy : oy + ph, ox : ox + pw]
    out[oy : oy + ph, ox : ox + pw] = painting * alpha + inside * (1 - alpha)
    margin = margin_of(settings)
    target = REPO / margin["painting"]
    Image.fromarray(out.astype(np.uint8)).save(target)
    (REPO / margin["grid"]).write_text(json.dumps(grid) + "\n")
    return target


def main(arguments: list[str]) -> int:
    if len(arguments) < 2 or arguments[1] not in ("canvas", "join"):
        print("usage: margin.py <scene> canvas | margin.py <scene> join <picture>")
        return 2
    settings = scene_settings.settings(arguments[0])
    if arguments[1] == "canvas":
        print(canvas(settings).relative_to(REPO))
    else:
        print(join(settings, Path(arguments[2])).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
