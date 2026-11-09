#!/usr/bin/env python3
"""A door's open state built from its closed one, with no model (D144).

    tools/art/door.py <scene> <door thing>

The door's settings are `door` in the thing's entry of art/scenes/<scene>/cut.json:

    polygon     the closed leaf's traced shape (D113), in cells, on the outer edge
                of the leaf's outline, the arch's inner line and the foot's
    hinge       where the leaf is hung: `left`, `right`, or `both` for a double door
    floor_from  a box in cells of the painting: the floor of the room behind the door
    swing       how wide the swung leaf is drawn, as a part of its width (0.35)
    lift        how far its far edge is lifted, as a part of its height (LIFT)
    seam        a double door's middle, in cells (the polygon's middle)
    row         the row the open state is drawn on, over the arch of its own row

It writes two pictures into the scene's edits folder and the settings they need:
`<door>-doorway.png`, the painting with the polygon filled with the floor beyond,
tiled from `floor_from` at the painting's own size and darker toward the lintel,
which is the thing's `without`, and `<door>-open.png`, that picture with the leaf
drawn on it: the closed leaf's own pixels, cut by the polygon, turned on the hinge
edge so that they lie on the other side of it, over the jamb, their width scaled to
`swing` and the far edge lifted, with a dark line round them where the scaling
thinned the painting's and a soft shadow at the foot. The settings are the thing's
`without`, its `box`, grown round the leaf so that nothing of it is cut, its open
state (`picture`, `without`, `leaf`, the shape round leaf and shadow, a list of two
for a double door, and `row`) and its `doorway` polygon (trace.py footprint), within
which the closed state is the painting. The jambs, the arch and what lies at the
foot are the painting's, so the two pictures differ in nothing else.
"""

import json
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import trace  # noqa: E402

import export_scene  # noqa: E402
import image_first  # noqa: E402
import repaint  # noqa: E402
import scene_settings  # noqa: E402

#: The swung leaf's width, as a part of the closed leaf's.
SWING = 0.35
#: How far its far edge is lifted, as a part of its height.
LIFT = 0.05
#: How much darker the floor beyond is under the lintel than at the foot.
LINTEL_SHADE = 0.32
#: The dark line round the swung leaf, in pixels of the painting, as wide as a third
#: of the painting's own outlines, which the scaling thins on the leaf's sides.
OUTLINE = 3
#: The shadow at the leaf's foot: how far down it falls, how soft it is and how
#: dark, as a part of the cell's height and of the picture's light.
SHADOW_DROP = 0.12
SHADOW_SOFT = 0.06
SHADOW_DARK = 0.34
#: What is left of an alpha or a shadow at the shape cut round them.
SEEN = 0.02


@dataclass
class Opened:
    """A door opened: the painting with its doorway filled, that picture with its leaf
    or leaves drawn, and the shapes round each leaf and its shadow, in cells."""

    doorway: np.ndarray
    open: np.ndarray
    leaves: list[list[list[float]]]


def tile_of(painting: np.ndarray, grid: dict, floor: list[float]) -> np.ndarray:
    """The plain floor a doorway is filled with, a box of the painting in cells."""
    x0, y0, x1, y1 = export_scene.native_box(grid, tuple(floor))
    return painting[y0:y1, x0:x1].astype(np.float32)


def filled(painting: np.ndarray, area: np.ndarray, tile: np.ndarray) -> np.ndarray:
    """The painting with `area`, an alpha, filled with `tile` mirrored at each side so
    that it meets itself, at the painting's own size, darker toward the lintel, the
    area's top, and the room's own light at its foot."""
    ys, xs = np.nonzero(area > 0)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    floor = repaint.tiled_over((int(y1 - y0), int(x1 - x0)), tile)
    light = 1 - LINTEL_SHADE * np.linspace(1, 0, int(y1 - y0))[:, None, None]
    out = painting.astype(np.float32)
    part = area[y0:y1, x0:x1, None]
    out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - part) + floor * light * part
    return out.clip(0, 255).astype(np.uint8)


def swung(rgba: np.ndarray, swing: float, lift: float, to_left: bool) -> tuple[np.ndarray, int]:
    """A leaf, its pixels premultiplied by its alpha, turned on its hinge edge: the
    hinge edge is the side it is swung away from, its width scaled to `swing`, mirrored
    so that it lies beyond the hinge, each column lifted by its distance from the
    hinge, up to `lift` of its height at the far edge. Returns the picture, as tall as
    the leaf and the lift, and how far the lift grew it above the leaf's top."""
    height, width = rgba.shape[:2]
    narrow = max(1, round(width * swing))
    layers = [
        np.array(
            Image.fromarray(rgba[..., channel], "F").resize((narrow, height), Image.LANCZOS)
        ).clip(0, None)
        for channel in range(4)
    ]
    # The hinge edge stays at the leaf's own side: mirrored, its first column last.
    scaled = np.dstack(layers)[:, ::-1]
    raised = lift * height
    above = int(np.ceil(raised))
    out = np.zeros((height + above, narrow, 4), dtype=np.float32)
    for column in range(narrow):
        far = (narrow - 1 - column if to_left else column) / max(1, narrow - 1)
        up = (1 - far if not to_left else far) * raised
        whole = int(np.floor(up))
        share = up - whole
        top = above - whole
        out[top : top + height, column] += scaled[:, column] * (1 - share)
        if share and top > 0:
            out[top - 1 : top - 1 + height, column] += scaled[:, column] * share
    return out, above


def outlined(alpha: np.ndarray) -> np.ndarray:
    """A leaf's alpha, 0 to 255, grown by OUTLINE pixels, with its edge soft over one:
    the part of a pixel the dark line round it takes."""
    grown = Image.fromarray(alpha.clip(0, 255).astype(np.uint8)).filter(
        ImageFilter.MaxFilter(2 * OUTLINE + 1)
    )
    return np.array(grown.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255


def leaf_parts(alpha: np.ndarray, door: dict, grid: dict) -> list[tuple[np.ndarray, str]]:
    """The polygon's alpha as a leaf and its hinge, or, for a double door, a leaf each
    side of its seam."""
    if door["hinge"] != "both":
        return [(alpha, door["hinge"])]
    xs = np.nonzero(alpha.max(axis=0) > 0)[0]
    middle = (xs.min() + xs.max() + 1) // 2
    if "seam" in door:
        middle = round(grid["x"]["offset"] + door["seam"] * grid["x"]["spacing"])
    left, right = alpha.copy(), alpha.copy()
    left[:, middle:] = 0
    right[:, :middle] = 0
    return [(left, "left"), (right, "right")]


def open_door(painting: np.ndarray, grid: dict, door: dict) -> Opened:
    """The door of `door`'s settings opened on `painting`, as the module says."""
    shape = painting.shape[:2]
    alpha = export_scene.soft_area(shape, grid, door["polygon"])
    doorway = filled(painting, alpha, tile_of(painting, grid, door["floor_from"]))
    swing, lift = door.get("swing", SWING), door.get("lift", LIFT)
    spacing = grid["y"]["spacing"]
    shadows = np.zeros(shape, dtype=np.float32)
    leaf_layer = np.zeros((*shape, 4), dtype=np.float32)
    regions = []
    for part, hinge in leaf_parts(alpha, door, grid):
        ys, xs = np.nonzero(part > 0)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = part[y0:y1, x0:x1]
        pixels = painting[y0:y1, x0:x1].astype(np.float32)
        rgba = np.dstack([pixels * crop[..., None], crop * 255])
        to_left = hinge == "left"
        turned, above = swung(rgba, swing, lift, to_left)
        narrow = turned.shape[1]
        left = x0 - narrow if to_left else x1
        top = y0 - above
        # What lies beyond the painting is left out: a door at its very edge.
        seen = turned[max(0, -top) :, max(0, -left) :]
        left, top = max(0, left), max(0, top)
        seen = seen[: shape[0] - top, : shape[1] - left]
        height, width = seen.shape[:2]
        # The dark line, under the leaf, of the darkest tone of its own outlines.
        solid = seen[..., 3] > 127
        dark = np.percentile(pixels[crop > 0.5], 4, axis=0)
        line = outlined(seen[..., 3])
        ground = np.dstack([*(np.full(line.shape, tone) * line for tone in dark), line * 255])
        leaf = seen + ground * (1 - seen[..., 3:] / 255)
        here = leaf_layer[top : top + height, left : left + width]
        here[:] = leaf + here * (1 - leaf[..., 3:] / 255)
        # The shadow on the floor, from the foot of the leaf down.
        feet = [
            top + int(np.nonzero(solid[:, column])[0][-1])
            for column in (0, width - 1)
            if solid[:, column].any()
        ]
        if len(feet) == 2:
            near, far = (feet[1], feet[0]) if to_left else (feet[0], feet[1])
            hinge_x, far_x = (left + width, left) if to_left else (left, left + width)
            drop = SHADOW_DROP * spacing
            mask = Image.new("L", shape[::-1], 0)
            ImageDraw.Draw(mask).polygon(
                [(hinge_x, near), (far_x, far), (far_x, near + drop), (hinge_x, near + drop)],
                fill=255,
            )
            soft = mask.filter(ImageFilter.GaussianBlur(SHADOW_SOFT * spacing))
            shadow = np.array(soft).astype(np.float32) / 255
            shadow[shadow <= SEEN] = 0
        else:
            shadow = np.zeros(shape, dtype=np.float32)
        shadows = np.maximum(shadows, shadow)
        region = shadow > SEEN
        region[top : top + height, left : left + width] |= leaf[..., 3] / 255 > SEEN
        regions.append(region)
    out = doorway.astype(np.float32) * (1 - shadows[..., None] * SHADOW_DARK)
    kept = leaf_layer[..., 3:] / 255
    out = out * (1 - kept) + leaf_layer[..., :3]
    leaves = [
        trace.edge_in_cells(region_in, corner, grid, 1.0)
        for region_in, corner in (cropped(region) for region in regions)
    ]
    return Opened(doorway, out.clip(0, 255).astype(np.uint8), leaves)


def cropped(region: np.ndarray) -> tuple[np.ndarray, tuple[int, int]]:
    """A region cut to its largest part's box, and that box's corner (x, y)."""
    labels = image_first.labels(region)
    numbers, sizes = np.unique(labels[labels > 0], return_counts=True)
    largest = labels == numbers[np.argmax(sizes)]
    ys, xs = np.nonzero(largest)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return largest[y0:y1, x0:x1], (int(x0), int(y0))


def grown_box(box: list[float], leaves: list[list[list[float]]]) -> list[float]:
    """The thing's box grown round its leaves, with a little to spare, so that its
    open state is never cut by it."""
    points = [point for leaf in leaves for point in leaf]
    xs, ys = [x for x, _ in points], [y for _, y in points]
    return [
        round(min(box[0], min(xs) - 0.05), 2),
        round(min(box[1], min(ys) - 0.05), 2),
        round(max(box[2], max(xs) + 0.05), 2),
        round(max(box[3], max(ys) + 0.05), 2),
    ]


def build(scene: str, name: str) -> list[Path]:
    """The door opened in the scene's pictures and settings."""
    settings = scene_settings.settings(scene)
    thing = settings.things[name]
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    opened = open_door(painting, settings.grid, thing["door"])
    doorway, shown = f"{name}-doorway.png", f"{name}-open.png"
    Image.fromarray(opened.doorway).save(settings.edits / doorway)
    Image.fromarray(opened.open).save(settings.edits / shown)
    path = repaint.REPO / "art" / "scenes" / scene / "cut.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    entry = data["things"][name]
    entry["without"] = doorway
    entry["box"] = grown_box(entry["box"], opened.leaves)
    leaf = opened.leaves if len(opened.leaves) > 1 else opened.leaves[0]
    state = {"picture": shown, "without": doorway, "leaf": leaf}
    if "row" in thing["door"]:
        state["row"] = thing["door"]["row"]
    entry["states"]["open"] = state
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    # The closed state is the painting within the fill, made from the picture just laid.
    again = scene_settings.settings(scene)
    entry["doorway"] = trace.footprint(again, name, 7, 1.5)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return [settings.edits / doorway, settings.edits / shown, path]


def main(arguments: list[str]) -> int:
    if len(arguments) != 2:
        print(__doc__)
        return 2
    for written in build(*arguments):
        print(written)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
