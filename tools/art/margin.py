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

Two things keep the seam from showing. The painting's own outermost pixels, a
few wide, are left out (TRIM): a model's painting often has a dark line along
its edge. And the border's colours are brought to the painting's along the
seam: the model's copy of the inside, laid beside the painting itself, says
how far its colours drifted at each place along the edge, and that drift,
smoothed along the edge, is taken off the border, fully at the seam and less
and less outward, gone REACH beyond it (`matched`). The shapes are the model's.
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
#: How wide the fade is where the inside meets the border, in the painting's pixels,
#: and how many of the painting's outermost pixels are left out before it.
FADE = 40
TRIM = 8
#: The colours' drift along the seam: measured on a band this wide just inside
#: the painting's edge, smoothed this far along the edge, taken off the border up
#: to this far out, and never more than this, in the painting's pixels and levels.
DRIFT_BAND = 110
DRIFT_SMOOTH = 90
REACH = 280
DRIFT_MOST = 45.0


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
    over its inside, searched at a quarter of the size; and that difference. Where
    the picture laid so falls short of the canvas's edge, its own outermost
    painted pixels are stretched out to it (`filled`)."""
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
    seen = Image.new("L", picture.size, 255).transform((width, height), Image.AFFINE, affine)
    return filled(np.array(whole), np.array(seen) == 255), best


def filled(picture: np.ndarray, seen: np.ndarray) -> np.ndarray:
    """The picture with what lies outside `seen` taken from the nearest seen pixel
    along its row, then along its column: a band the model did not paint, at the
    canvas's edge, carries on the colours beside it."""
    out = picture.copy()
    for axis in (1, 0):
        if seen.all():
            break
        size = seen.shape[axis]
        line = np.arange(size).reshape((1, size) if axis == 1 else (size, 1))
        # The nearest seen pixel at or before each, else at or after it.
        before = np.maximum.accumulate(np.where(seen, line, -1), axis=axis)
        after = np.maximum.accumulate(np.where(np.flip(seen, axis=axis), line, -1), axis=axis)
        after = np.flip(np.where(after >= 0, size - 1 - after, -1), axis=axis)
        nearest = np.where(before >= 0, before, after)
        rows, columns = np.indices(seen.shape)
        own = columns if axis == 1 else rows
        index = np.where(nearest >= 0, nearest, own)
        out = out[rows, index] if axis == 1 else out[index, columns]
        seen = nearest >= 0
    return out


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


def smoothed(values: np.ndarray, radius: int) -> np.ndarray:
    """A profile along an edge, (length, 3), smoothed by three passes of a running
    mean `radius` wide each way: near a Gaussian, the ends held by their values."""
    out = values.astype(np.float32)
    for _ in range(3):
        padded = np.concatenate(
            [np.repeat(out[:1], radius, 0), out, np.repeat(out[-1:], radius, 0)]
        )
        sums = np.cumsum(np.concatenate([np.zeros((1, 3), np.float32), padded]), axis=0)
        out = (sums[2 * radius + 1 :] - sums[: -2 * radius - 1]) / (2 * radius + 1)
    return out


def matched(whole: np.ndarray, painting: np.ndarray, ox: int, oy: int) -> np.ndarray:
    """The laid picture with its border's colours brought to the painting's along
    the seam: on each side, the drift of the model's copy of the inside from the
    painting, averaged over a band inside the edge and smoothed along it, added to
    the border, fully at the seam and less and less out to REACH. A corner's border
    takes the drifts of its two sides, each by how near it is to that side."""
    ph, pw = painting.shape[:2]
    inside = whole[oy : oy + ph, ox : ox + pw].astype(np.float32)
    drift = painting - inside
    band = slice(TRIM, TRIM + DRIFT_BAND)
    sides = {
        "left": drift[:, band].mean(axis=1),
        "right": drift[:, pw - TRIM - DRIFT_BAND : pw - TRIM].mean(axis=1),
        "top": drift[band, :].mean(axis=0),
        "bottom": drift[ph - TRIM - DRIFT_BAND : ph - TRIM, :].mean(axis=0),
    }
    sides = {
        name: np.clip(smoothed(v, DRIFT_SMOOTH), -DRIFT_MOST, DRIFT_MOST)
        for name, v in sides.items()
    }
    height, width = whole.shape[:2]
    ys, xs = np.arange(height), np.arange(width)
    # How far each column and row lies out of the painting, and on which side.
    out_x = np.maximum(ox - xs, xs - (ox + pw - 1)).clip(0).astype(np.float32)
    out_y = np.maximum(oy - ys, ys - (oy + ph - 1)).clip(0).astype(np.float32)
    along_y = np.clip(ys - oy, 0, ph - 1)
    along_x = np.clip(xs - ox, 0, pw - 1)
    horizontal = np.where(
        (xs < ox + pw // 2)[None, :, None],
        sides["left"][along_y][:, None, :],
        sides["right"][along_y][:, None, :],
    )
    vertical = np.where(
        (ys < oy + ph // 2)[:, None, None],
        sides["top"][along_x][None, :, :],
        sides["bottom"][along_x][None, :, :],
    )
    beside_x = np.broadcast_to((out_x > 0)[None, :], (height, width))
    beside_y = np.broadcast_to((out_y > 0)[:, None], (height, width))
    inner = ~beside_x & ~beside_y
    # Inside the painting, where the fade uses the border too, the nearer edge's
    # drift is taken; beside it, the side's, and in a corner both, halved.
    nearer_x = (
        np.minimum(xs - ox, ox + pw - 1 - xs)[None, :]
        <= np.minimum(ys - oy, oy + ph - 1 - ys)[:, None]
    )
    wx = np.where(inner, nearer_x, beside_x).astype(np.float32)[..., None]
    wy = np.where(inner, ~nearer_x, beside_y).astype(np.float32)[..., None]
    gone = np.hypot(out_x[None, :], out_y[:, None])
    weight = np.clip(1 - gone / REACH, 0, 1)[..., None]
    correction = (horizontal * wx + vertical * wy) / np.maximum(wx + wy, 1) * weight
    return np.clip(whole.astype(np.float32) + correction, 0, 255)


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
    # The painting's outermost pixels left out, then faded in over FADE.
    alpha = np.clip((edge - TRIM) / FADE, 0, 1)[..., None]
    out = matched(whole, painting, ox, oy)
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
