#!/usr/bin/env python3
"""A passage narrower than a cell, for familiars (D273): a trench painted by Gemini a
cell wide on an enlargement of a wall, squeezed by this tool onto the middles of its
cells, its two flaps made smaller, and laid back into the scene.

    tools/art/narrow.py <scene> squeeze
    tools/art/narrow.py <scene> green
    tools/art/narrow.py <scene> scene
    tools/art/narrow.py <scene> guide

The scene's numbers are art/scenes/<scene>/narrow.json: the pictures each step reads
and writes (in art/raw/, which git ignores), the enlargement's place in the scene
(`box`), a cell in the enlargement's pixels (`cell`), the trench's width after the
squeeze as a part of a cell (`wide`), how much masonry is stretched at each side of it
(`margin`), the flaps' new size (`flap`), each stretch of the trench as painted, kerb
to kerb, with the middle it goes to (`columns`, `rows`), the flaps as painted with the
middle and the foot each goes to (`flaps`), the green boxes of `green`, and the trial
scene's painted grid, where its lines lie (`grid`).

The order of the work, as the passage was made: Gemini paints the trench a whole cell
wide on the enlargement whatever it is asked (`close`, from a guide of the scene with
the trench drawn as a thin green line); `squeeze` takes the enlargement's painted grid
out, squeezes the trench with a warp along x round its columns and along y round its
row, the masonry beside it stretched to fill, makes the flaps smaller, and writes the
picture Gemini repairs without moving anything (`squeezed`, to `repaired`); `green`
lays a flat green over the rubble Gemini mirrored beside the trench and writes the
picture Gemini paints new rubble on (`greened`, to `rubble`); `scene` lays the result
into the whole scene with its colours brought back to the scene's, measured on the
enlargement's outer ring, and the scene's grid drawn again (`out`). `guide` writes
art/raw/game-check/narrow-<scene>.png from the scene's base (`painting`): the trench's
cells framed green, every cell beside them red, so that one sees that none of them
holds any of the trench.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

REPO = Path(__file__).resolve().parents[2]
SCENES = REPO / "art" / "scenes"
CHECK = REPO / "art" / "raw" / "game-check"
#: How wide a painted grid line is taken out, in pixels each side of its middle, and how
#: far from where it should be it is looked for.
LINE_HALF = 10
LINE_REACH = 24


def settings(scene: str) -> dict:
    return json.loads((SCENES / scene / "narrow.json").read_text(encoding="utf-8"))


def track(a: np.ndarray, expected: int) -> np.ndarray:
    """Where a painted grid line that runs down the picture really is, at each row: the
    lightest thin stripe near its expected place, smoothed along the line."""
    height = a.shape[0]
    step, reach = 40, LINE_REACH
    light = a[..., 1] + a[..., 2]
    found, sure = [], []
    for y in range(0, height, step):
        p = light[y : y + step, expected - reach - 16 : expected + reach + 17].mean(axis=0)
        p = np.convolve(p, np.ones(7) / 7, mode="same")
        score = p[16:-16] - (p[2:-30] + p[30:-2]) / 2
        found.append(int(score.argmax()) - reach)
        sure.append(score.max() > 25)
    found_a, sure_a = np.array(found), np.array(sure)
    usual = int(np.median(found_a[sure_a])) if sure_a.any() else 0
    found_a = np.where(sure_a, found_a, usual)
    smooth = [int(np.median(found_a[max(0, i - 3) : i + 4])) for i in range(len(found_a))]
    return expected + np.repeat(smooth, step)[:height]


def erase(a: np.ndarray, expected: int, half: int = LINE_HALF) -> None:
    """A painted grid line that runs down the picture, painted out with what is at its
    two sides, blended across it."""
    middle = track(a, expected)
    rows = np.arange(a.shape[0])
    left = (a[rows, middle - half - 2] + a[rows, middle - half - 1]) / 2
    right = (a[rows, middle + half + 1] + a[rows, middle + half + 2]) / 2
    for i in range(-half, half + 1):
        t = (i + half + 1) / (2 * half + 2)
        a[rows, middle + i] = left * (1 - t) + right * t


def without_grid(close: Image.Image, own: dict) -> Image.Image:
    """The enlargement with its painted grid taken out: a line every cell down it, and
    across it from the first of the scene's rows inside it."""
    a = np.asarray(close).astype(np.float32).copy()
    height, width = a.shape[:2]
    cell = own["cell"]
    for x in range(cell, width - 1, cell):
        erase(a, x)
    a = a.transpose(1, 0, 2).copy()
    x0, y0, x1, y1 = own["box"]
    scene_cell = own["scene_size"][1] / 15
    first_row = int(np.ceil(y0 / scene_cell))
    first = (first_row * scene_cell - y0) * height / (y1 - y0)
    for k in range(own["grid_rows_inside"]):
        erase(a, round(first + k * cell))
    return Image.fromarray(a.transpose(1, 0, 2).round().astype("uint8"))


def squeezed_axis(size: int, bands: list, wide: float, margin: float) -> np.ndarray:
    """For each place along an axis, the place of the painting it shows: each band, a
    stretch of the trench kerb to kerb (low, high) with the middle it goes to, drawn
    `wide` across round that middle, and the `margin` beside it stretched to fill."""
    here, there = [0.0], [0.0]
    for low, high, middle in bands:
        here += [low - margin, middle - wide / 2, middle + wide / 2, high + margin]
        there += [low - margin, low, high, high + margin]
    here.append(size - 1.0)
    there.append(size - 1.0)
    return np.interp(np.arange(size), here, there)


def sample(a: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
    """The picture read at fractional places, between its four neighbours."""
    height, width = a.shape[:2]
    x0 = np.clip(np.floor(sx).astype(int), 0, width - 2)
    y0 = np.clip(np.floor(sy).astype(int), 0, height - 2)
    fx = (sx - x0)[..., None]
    fy = (sy - y0)[..., None]
    top = a[y0, x0] * (1 - fx) + a[y0, x0 + 1] * fx
    low = a[y0 + 1, x0] * (1 - fx) + a[y0 + 1, x0 + 1] * fx
    return top * (1 - fy) + low * fy


def arch(box: tuple[int, int, int, int], grow: int = 0) -> Image.Image:
    """A flap's outline: a rectangle with a round top."""
    left, top, right, foot = box
    width, height = right - left, foot - top
    mask = Image.new("L", (width, height), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-grow, -grow, width - 1 + grow, width - 1 + grow], fill=255)
    d.rectangle([-grow, width // 2, width - 1 + grow, height], fill=255)
    return mask


def squeeze(scene: str) -> Path:
    """The enlargement with its grid out, its flaps made smaller and its trench squeezed:
    the picture Gemini repairs without moving anything."""
    own = settings(scene)
    close = without_grid(Image.open(REPO / own["close"]).convert("RGB"), own)
    width, height = close.size
    cell = own["cell"]
    # The flaps kept aside, and plain wall from two cells to their left in their place.
    flaps = []
    for flap in own["flaps"]:
        box, to = tuple(flap["painted"]), tuple(flap["to"])
        flaps.append((close.crop(box), arch(box), to))
        left, top, right, foot = box
        cover = (left - 30, top - 30, right + 30, foot + 12)
        patch = close.crop((cover[0] - 2 * cell, cover[1], cover[2] - 2 * cell, cover[3]))
        soft = Image.new("L", patch.size, 0)
        ImageDraw.Draw(soft).rectangle([10, 10, patch.width - 11, patch.height - 1], fill=255)
        close.paste(patch, cover[:2], soft.filter(ImageFilter.GaussianBlur(5)))
    # The squeeze: the second column's stops below the trench, above what hangs on the wall.
    a = np.asarray(close).astype(np.float32)
    wide, margin = own["wide"] * cell, own["margin"]
    columns = own["columns"]
    both = squeezed_axis(width, columns, wide, margin)
    one = squeezed_axis(width, columns[:1], wide, margin)
    rows = squeezed_axis(height, own["rows"], wide, margin)
    start, length = own["column_fade"]
    t = np.clip((np.arange(height) - start) / length, 0, 1)
    fade = (t * t * (3 - 2 * t))[:, None]
    sx = both[None, :] * (1 - fade) + one[None, :] * fade
    sy = np.repeat(rows[:, None], width, axis=1)
    out = Image.fromarray(sample(a, sx, sy).round().astype("uint8"))
    for figure, mask, (middle, foot) in flaps:
        size = (round(figure.width * own["flap"]), round(figure.height * own["flap"]))
        figure = figure.resize(size, Image.LANCZOS)
        mask = mask.resize(size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
        out.paste(figure, (round(middle - size[0] / 2), foot - size[1]), mask)
    target = REPO / own["squeezed"]
    target.parent.mkdir(parents=True, exist_ok=True)
    out.resize((width // 2, height // 2), Image.LANCZOS).save(target)
    return target


def green(scene: str) -> Path:
    """Gemini's repaired picture with a flat green over the rubble it mirrored: the
    picture Gemini paints new rubble on."""
    own = settings(scene)
    close = Image.open(REPO / own["repaired"]).convert("RGB")
    d = ImageDraw.Draw(close)
    for box in own["green"]:
        d.rectangle(box, fill=(0, 255, 0))
    target = REPO / own["greened"]
    target.parent.mkdir(parents=True, exist_ok=True)
    close.resize((close.width // 2, close.height // 2), Image.LANCZOS).save(target)
    return target


def with_grid(whole: Image.Image, own: dict) -> None:
    """The scene's painted grid, drawn again inside the enlargement's place, each line
    where the scene's own lies (`grid`), so that they meet at its edges."""
    d = ImageDraw.Draw(whole)
    pink = tuple(own["grid"]["colour"])
    x0, y0, x1, _ = own["box"]
    cw, ch = own["scene_size"][0] / 20, own["scene_size"][1] / 15
    for column, off in own["grid"]["columns"].items():
        x = int(column) * cw + off
        d.rectangle([x - 2, y0 + 12, x + 1, own["floor"] + 20], fill=pink)
    for row, off in own["grid"]["rows"].items():
        y = round(int(row) * ch) + off
        d.rectangle([x0 + 12, y - 2, x1 - 12, y + 1], fill=pink)


def laid_scene(scene: str) -> Path:
    """The enlargement laid back into the whole scene, its colours brought back to the
    scene's on its outer ring (Gemini's drift towards purple from pass to pass), the
    corridor's floor below the wall's foot kept the scene's own, the grid drawn again."""
    own = settings(scene)
    close = Image.open(REPO / own["rubble"]).convert("RGB")
    whole = Image.open(REPO / own["whole"]).convert("RGB")
    box = tuple(own["box"])
    small = close.resize((box[2] - box[0], box[3] - box[1]), Image.LANCZOS)
    new = np.asarray(small).astype(np.float32).copy()
    was = np.asarray(whole.crop(box)).astype(np.float32)
    ring = np.ones(new.shape[:2], bool)
    ring[200:-200, 200:-200] = False
    for c in range(3):
        gain = was[..., c][ring].std() / new[..., c][ring].std()
        new[..., c] = (new[..., c] - new[..., c][ring].mean()) * gain + was[..., c][ring].mean()
    small = Image.fromarray(new.clip(0, 255).round().astype("uint8"))
    edge = Image.new("L", small.size, 0)
    ImageDraw.Draw(edge).rectangle([24, 24, small.width - 25, own["floor"] - box[1]], fill=255)
    whole.paste(small, box[:2], edge.filter(ImageFilter.GaussianBlur(12)))
    with_grid(whole, own)
    target = REPO / own["out"]
    target.parent.mkdir(parents=True, exist_ok=True)
    whole.save(target)
    return target


def guide(scene: str) -> Path:
    """The passage's cells on the scene's base, enlarged: the trench's cells framed
    green, every cell beside them that is not one of them framed red."""
    own = settings(scene)
    painting = Image.open(REPO / own["painting"]).convert("RGB")
    cw, ch = painting.width / 20, painting.height / 15
    trench = {tuple(cell) for cell in own["trench"]}
    beside = {
        (x + dx, y + dy)
        for x, y in trench
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        if (x + dx, y + dy) not in trench
    }
    x0, y0, x1, y1 = own["guide_box"]
    crop = painting.crop((round(x0 * cw), round(y0 * ch), round(x1 * cw), round(y1 * ch)))
    d = ImageDraw.Draw(crop)
    for cells, colour in ((beside, (255, 40, 40)), (trench, (40, 230, 60))):
        for x, y in cells:
            box = [
                (x - x0) * cw + 3,
                (y - y0) * ch + 3,
                (x + 1 - x0) * cw - 4,
                (y + 1 - y0) * ch - 4,
            ]
            d.rectangle(box, outline=colour, width=5)
    CHECK.mkdir(parents=True, exist_ok=True)
    target = CHECK / f"narrow-{scene}.png"
    crop.save(target)
    return target


STEPS = {"squeeze": squeeze, "green": green, "scene": laid_scene, "guide": guide}


def main(arguments: list[str]) -> int:
    if len(arguments) != 2 or arguments[1] not in STEPS:
        print("usage: narrow.py <scene> squeeze|green|scene|guide")
        return 2
    print(STEPS[arguments[1]](arguments[0]).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
