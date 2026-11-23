#!/usr/bin/env python3
"""A thing painted into a scene's base by an edit of a part of it (D148, D281).

    tools/art/lay.py <scene> <picture> --part X0 Y0 X1 Y1 --box X0 Y0 X1 Y1 --out <name>

`picture` is a model's edit of a part of the scene's painting, the part `--part` gives
in cells: the model was given that part, cut from the painting, and drew one thing into
it. The model gives its picture at a size of its own, a little off the part's shape: it
is laid on the part first, resized to the part's width and to the height, and moved by
the shift, that differ least from the painting outside the thing's box. Then only the
thing's own pixels enter the painting: the difference of the laid picture against the
painting within `--box`, as a cut-out is made (`export_scene.difference_mask`), is
copied over the painting, and every other pixel stays the painting's own. The new
painting is written beside the scene's pictures as `<name>`, in art/raw/, with a look
of the box enlarged and its mask's edge in magenta, art/raw/game-check/lay-<name>; it
prints the fit found, the pixels laid, and the pixels that differ from the painting
outside the box, which are none.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

import export_scene  # noqa: E402
import image_first  # noqa: E402
import scene_settings  # noqa: E402

#: How far the laid picture's height is searched round the part's, as a share of it, and
#: how far it is shifted each way, in the painting's pixels.
STRETCH = 0.012
REACH = 8


def fit(part: np.ndarray, picture: Image.Image, box: tuple[int, int, int, int]) -> dict:
    """The size and the shift that lay `picture` on `part` best: the mean colour difference
    outside `box` (in the part's pixels) is the least. Returns the laid picture, at the
    part's size, with what was found."""
    height, width = part.shape[:2]
    keep = np.ones((height, width), dtype=bool)
    x0, y0, x1, y1 = box
    keep[max(0, y0 - REACH) : y1 + REACH, max(0, x0 - REACH) : x1 + REACH] = False
    keep[:REACH] = keep[-REACH:] = False
    keep[:, :REACH] = keep[:, -REACH:] = False
    # Every third pixel of every third row is enough to tell the fits apart.
    keep[1::3] = keep[2::3] = False
    keep[:, 1::3] = keep[:, 2::3] = False
    ys, xs = np.nonzero(keep)
    wanted = part[ys, xs].astype(int)
    reach = max(1, round(height * STRETCH))
    best: dict | None = None
    for tall in range(height - reach, height + reach + 1):
        resized = np.array(picture.convert("RGB").resize((width, tall), Image.LANCZOS))
        for dy in range(-REACH, REACH + 1):
            rows = np.clip(ys + dy, 0, tall - 1)
            for dx in range(-REACH, REACH + 1):
                columns = np.clip(xs + dx, 0, width - 1)
                error = float(np.abs(resized[rows, columns].astype(int) - wanted).mean())
                if best is None or error < best["error"]:
                    best = {"height": tall, "shift": (dx, dy), "error": error}
    assert best is not None
    resized = np.array(picture.convert("RGB").resize((width, best["height"]), Image.LANCZOS))
    best["laid"] = _shifted(resized, *best["shift"], (height, width))
    return best


def _shifted(picture: np.ndarray, dx: int, dy: int, shape: tuple[int, int]) -> np.ndarray:
    """`picture` drawn at (dx, dy) on a canvas of `shape`, its uncovered edge left as the
    picture's nearest pixels."""
    height, width = shape
    rows = np.clip(np.arange(height) + dy, 0, picture.shape[0] - 1)
    columns = np.clip(np.arange(width) + dx, 0, picture.shape[1] - 1)
    return picture[rows][:, columns]


def lay(
    painting: np.ndarray,
    picture: Image.Image,
    part: tuple[int, int, int, int],
    box: tuple[int, int, int, int],
) -> tuple[np.ndarray, np.ndarray, dict]:
    """The painting with the thing in `box` laid from `picture`, an edit of `part` (both
    boxes in the painting's pixels); the mask laid, at the painting's size; and the fit."""
    px0, py0, px1, py1 = part
    own = painting[py0:py1, px0:px1]
    inside = (box[0] - px0, box[1] - py0, box[2] - px0, box[3] - py0)
    found = fit(own, picture, inside)
    shown = painting.copy()
    shown[py0:py1, px0:px1] = found["laid"]
    mask = export_scene.difference_mask(shown, painting, box).astype(bool)
    laid = painting.copy()
    laid[mask] = shown[mask]
    return laid, mask, found


def main(arguments: list[str]) -> int:
    parser = argparse.ArgumentParser(description=" ".join(__doc__.split("\n\n")[0].split()))
    parser.add_argument("scene")
    parser.add_argument("picture", type=Path)
    corners = ("X0", "Y0", "X1", "Y1")
    parser.add_argument("--part", type=float, nargs=4, required=True, metavar=corners)
    parser.add_argument("--box", type=float, nargs=4, required=True, metavar=corners)
    parser.add_argument("--out", required=True)
    found = parser.parse_args(arguments)
    settings = scene_settings.settings(found.scene)
    picture = found.picture if found.picture.is_absolute() else settings.edits / found.picture
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    part = export_scene.native_box(settings.grid, tuple(found.part))
    box = export_scene.native_box(settings.grid, tuple(found.box))
    laid, mask, fitted = lay(painting, Image.open(picture), part, box)
    outside = ~export_scene.in_box(mask.shape, box)
    differs = int(np.count_nonzero(np.any(laid != painting, axis=2) & outside))
    target = settings.edits / found.out
    Image.fromarray(laid).save(target)
    look = laid.copy()
    look[image_first.dilated(export_scene.edge_of(mask.astype(np.float32)), 1)] = (255, 0, 255)
    x0, y0, x1, y1 = box
    margin = round(settings.grid["x"]["spacing"] / 2)
    crop = look[max(0, y0 - margin) : y1 + margin, max(0, x0 - margin) : x1 + margin]
    checks = export_scene.RAW / "game-check"
    checks.mkdir(parents=True, exist_ok=True)
    shot = Image.fromarray(crop)
    shot = shot.resize((shot.width * 3, shot.height * 3), Image.NEAREST)
    shot.save(checks / f"lay-{Path(found.out).stem}.png")
    dx, dy = fitted["shift"]
    print(
        f"laid at height {fitted['height']}, shifted {dx:+d}, {dy:+d}, "
        f"mean difference {fitted['error']:.2f} outside the box"
    )
    print(f"{int(mask.sum())} pixels laid in the box; {differs} differ outside it")
    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
