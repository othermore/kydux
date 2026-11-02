#!/usr/bin/env python3
"""Aids for a door's polygons on a scene's pictures, in cells (D113): a leaf's,
traced by hand, and its doorway's, made from the open doorway's fill.

    tools/art/trace.py <scene> look <picture> x0 y0 x1 y1 [--scale 3] [--poly <json>]
                                    [--diff <other picture>] [--out <png>]
    tools/art/trace.py <scene> outline <picture> x0 y0 x1 y1 <seed x> <seed y>
                                    [--dark 70] [--tolerance 1.5] [--out <json>]
    tools/art/trace.py <scene> footprint <door thing> [--grow 7] [--tolerance 1.5]
                                    [--out <json>]

`look` writes a crop of the picture, the box given in cells, enlarged `--scale`
times, with a grid line every tenth of a cell, numbered every half cell; with
`--poly`, a polygon (a JSON list of `[x, y]` in cells) drawn over it with its
points numbered, to see where each point lies; with `--diff`, the crop tinted red
where the picture differs from the other picture, to see what a model painted
again round a thing. The pictures are the scene's edits (`art/raw/<scene>/...`),
at the painting's own size, placed by the scene's grid.

`outline` writes a first polygon: the region closed in by the dark outline (a
pixel whose brightest channel is under `--dark`) that holds the seed, its
boundary simplified to points at most `--tolerance` pixels off the true edge.
It is a start for the hand: the outline of a leaf is continuous and the result
follows it, but where the leaf's outline touches another (a jamb, a hinge's
plate) the region spills, and the points there are moved by hand with `look`.

`footprint` writes a door's `doorway` polygon, within which its closed leaf is the
painting: the open doorway's fill and its threshold, every pixel where the
door's doorway picture (the thing's `without`) differs from the painting within
the thing's box, its holes filled, grown `--grow` pixels over the arch's inner
line, the width of the painting's outlines, and its boundary simplified as
`outline`'s. It is made again whenever `repaint.py doorways` lays the fill again.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import export_scene  # noqa: E402
import image_first  # noqa: E402
import scene_settings  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
GRID_LINE = (0, 255, 255)
POLYGON = (255, 0, 255)
POINT = (255, 255, 0)


def placed(grid: dict):
    """The painting's pixel of a cell coordinate, each way."""
    gx, gy = grid["x"], grid["y"]
    return (
        lambda x: gx["offset"] + x * gx["spacing"],
        lambda y: gy["offset"] + y * gy["spacing"],
    )


def look(
    grid: dict,
    picture: Path,
    box: tuple[float, float, float, float],
    scale: float,
    polygon: list | None,
    other: Path | None,
) -> Image.Image:
    px, py = placed(grid)
    x0, y0, x1, y1 = box
    pixels = (round(px(x0)), round(py(y0)), round(px(x1)), round(py(y1)))
    crop = Image.open(picture).convert("RGB").crop(pixels)
    if other is not None:
        there = np.array(Image.open(other).convert("RGB").crop(pixels)).astype(int)
        differs = np.abs(np.array(crop).astype(int) - there).sum(axis=2)
        shown = np.array(crop).astype(np.float32) * 0.35
        shown[..., 0] += np.clip(differs * 3, 0, 255) * 0.65
        crop = Image.fromarray(shown.clip(0, 255).astype(np.uint8))
    width, height = round(crop.width * scale), round(crop.height * scale)
    out = crop.resize((width, height), Image.LANCZOS).convert("RGBA")
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pen = ImageDraw.Draw(layer)

    def sx(x: float) -> float:
        return (px(x) - pixels[0]) * scale

    def sy(y: float) -> float:
        return (py(y) - pixels[1]) * scale

    for tenth in range(int(np.floor(x0 * 10)), int(np.ceil(x1 * 10)) + 1):
        x, strong = tenth / 10, tenth % 5 == 0
        pen.line((sx(x), 0, sx(x), height), fill=(*GRID_LINE, 200 if strong else 70))
        if strong:
            pen.text((sx(x) + 2, 2), f"{x:.1f}", fill=(*GRID_LINE, 255))
    for tenth in range(int(np.floor(y0 * 10)), int(np.ceil(y1 * 10)) + 1):
        y, strong = tenth / 10, tenth % 5 == 0
        pen.line((0, sy(y), width, sy(y)), fill=(*GRID_LINE, 200 if strong else 70))
        if strong:
            pen.text((2, sy(y) + 2), f"{y:.1f}", fill=(*GRID_LINE, 255))
    if polygon:
        points = [(sx(x), sy(y)) for x, y in polygon]
        pen.line(points + [points[0]], fill=(*POLYGON, 255), width=1)
        for number, (x, y) in enumerate(points):
            pen.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(*POINT, 255))
            pen.text((x + 3, y - 10), str(number), fill=(*POINT, 255))
    out.alpha_composite(layer)
    return out.convert("RGB")


def boundary(region: np.ndarray) -> list[tuple[int, int]]:
    """The region's outer boundary, pixel by pixel, clockwise, as (x, y)."""
    height, width = region.shape
    padded = np.zeros((height + 2, width + 2), bool)
    padded[1:-1, 1:-1] = region
    ys, xs = np.nonzero(padded)
    start = (int(ys[0]), int(xs[0]))
    around = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    out, here, back = [start], start, 6
    while True:
        for turn in range(8):
            way = (back + 1 + turn) % 8
            there = (here[0] + around[way][0], here[1] + around[way][1])
            if padded[there]:
                back, here = (way + 4) % 8, there
                break
        if here == start or len(out) > height * width:
            break
        out.append(here)
    return [(x - 1, y - 1) for y, x in out]


def simplified(points: list[tuple[int, int]], tolerance: float) -> np.ndarray:
    """The points with those kept that the line between their neighbours misses by
    more than `tolerance` pixels (Douglas–Peucker)."""
    pts = np.array(points, dtype=float)

    def between(a: int, b: int) -> list[int]:
        if b <= a + 1:
            return [a]
        segment = pts[b] - pts[a]
        length = float(np.hypot(*segment)) or 1.0
        toward = pts[a + 1 : b] - pts[a]
        off = np.abs(segment[0] * toward[:, 1] - segment[1] * toward[:, 0]) / length
        far = int(np.argmax(off))
        if off[far] > tolerance:
            return between(a, a + 1 + far) + between(a + 1 + far, b)
        return [a]

    kept = between(0, len(pts) - 1) + [len(pts) - 1]
    return pts[kept]


def outline(
    grid: dict,
    picture: Path,
    box: tuple[float, float, float, float],
    seed: tuple[float, float],
    dark: int,
    tolerance: float,
) -> list[list[float]]:
    px, py = placed(grid)
    x0, y0, x1, y1 = box
    pixels = (round(px(x0)), round(py(y0)), round(px(x1)), round(py(y1)))
    shown = np.array(Image.open(picture).convert("RGB"))
    crop = shown[pixels[1] : pixels[3], pixels[0] : pixels[2]].astype(int)
    lines = crop.max(axis=2) < dark

    def closed_in(mask: np.ndarray) -> np.ndarray:
        """Everything but the parts of `mask` that reach the crop's edge: what the
        mask closes in, with the lines that close it."""
        labels = image_first.labels(mask)
        edge = np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
        return ~np.isin(labels, [number for number in np.unique(edge) if number])

    region = closed_in(~lines)
    # Thin leaks through a broken line closed; the region the seed is in, with its holes.
    region = image_first.dilated(image_first.eroded(region, 4), 4)
    labels = image_first.labels(region)
    at = labels[round(py(seed[1])) - pixels[1], round(px(seed[0])) - pixels[0]]
    if not at:
        raise SystemExit("the seed is not inside a region closed by the outline")
    region = closed_in(~(labels == at)) | (labels == at)
    return edge_in_cells(region, (pixels[0], pixels[1]), grid, tolerance)


def edge_in_cells(
    region: np.ndarray, corner: tuple[int, int], grid: dict, tolerance: float
) -> list[list[float]]:
    """A region's outer boundary, simplified to points at most `tolerance` pixels
    off it, in cells: the region lies in the painting from `corner` (x, y), and each
    point is taken at its pixel's middle."""
    edge = simplified(boundary(region), tolerance)[:-1]
    gx, gy = grid["x"], grid["y"]
    return [
        [
            round((x + corner[0] + 0.5 - gx["offset"]) / gx["spacing"], 3),
            round((y + corner[1] + 0.5 - gy["offset"]) / gy["spacing"], 3),
        ]
        for x, y in edge
    ]


#: How far round a door's box its pictures are compared for its footprint, beyond
#: what it is grown by, in the painting's pixels.
FOOTPRINT_MARGIN = 4


def footprint(
    settings: scene_settings.Settings, name: str, grow: int, tolerance: float
) -> list[list[float]]:
    """A door's doorway polygon (D113): where its doorway picture differs from the
    painting within its box, its holes filled, its largest part, grown `grow`
    pixels, its boundary simplified, in cells."""
    thing = settings.things[name]
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    doorway = export_scene.without_of(settings, settings.grid, thing)
    x0, y0, x1, y1 = export_scene.native_box(settings.grid, thing["box"])
    height, width = painting.shape[:2]
    reach = grow + FOOTPRINT_MARGIN
    left, top = max(0, x0 - reach), max(0, y0 - reach)
    right, bottom = min(width, x1 + reach), min(height, y1 + reach)
    crop = (slice(top, bottom), slice(left, right))
    inside = export_scene.in_box(
        (bottom - top, right - left), (x0 - left, y0 - top, x1 - left, y1 - top)
    )
    # Every pixel the fill or its threshold changed, however little: where the
    # floor beyond is as dark as the leaf was, a difference over a threshold
    # leaves a notch the open doorway would show through.
    differs = np.abs(painting[crop].astype(np.int16) - doorway[crop]).sum(axis=2) > 0
    region = export_scene.filled_mask(differs & inside)
    labels = image_first.labels(region)
    numbers, sizes = np.unique(labels[labels > 0], return_counts=True)
    if not len(numbers):
        raise SystemExit(f"{name}: its doorway picture does not differ from the painting")
    region = image_first.dilated(labels == numbers[np.argmax(sizes)], grow)
    return edge_in_cells(region, (left, top), settings.grid, tolerance)


def main(arguments: list[str]) -> int:
    parser = argparse.ArgumentParser(description=" ".join(__doc__.split("\n\n")[0].split()))
    parser.add_argument("scene")
    commands = parser.add_subparsers(dest="command", required=True)
    for command in ("look", "outline"):
        on = commands.add_parser(command)
        on.add_argument("picture", type=Path)
        on.add_argument("box", type=float, nargs=4, metavar=("X0", "Y0", "X1", "Y1"))
        on.add_argument("--out", type=Path)
    looking, outlining = commands.choices["look"], commands.choices["outline"]
    looking.add_argument("--scale", type=float, default=3.0)
    looking.add_argument("--poly", type=json.loads)
    looking.add_argument("--diff", type=Path)
    outlining.add_argument("seed", type=float, nargs=2, metavar=("SX", "SY"))
    outlining.add_argument("--dark", type=int, default=70)
    outlining.add_argument("--tolerance", type=float, default=1.5)
    footprinting = commands.add_parser("footprint")
    footprinting.add_argument("thing")
    footprinting.add_argument("--grow", type=int, default=7)
    footprinting.add_argument("--tolerance", type=float, default=1.5)
    footprinting.add_argument("--out", type=Path)
    found = parser.parse_args(arguments)
    settings = scene_settings.settings(found.scene)
    if found.command == "footprint":
        target = found.out or Path(f"{found.thing}-footprint.json")
        points = footprint(settings, found.thing, found.grow, found.tolerance)
        target.write_text(json.dumps(points), encoding="utf-8")
        print(f"{len(points)} points")
        print(target)
        return 0
    picture = found.picture if found.picture.is_absolute() else REPO / found.picture
    box = tuple(found.box)
    if found.command == "look":
        other = found.diff and (found.diff if found.diff.is_absolute() else REPO / found.diff)
        target = found.out or Path(f"{picture.stem}-look.png")
        look(settings.grid, picture, box, found.scale, found.poly, other).save(target)
    else:
        target = found.out or Path(f"{picture.stem}-outline.json")
        seed = (found.seed[0], found.seed[1])
        points = outline(settings.grid, picture, box, seed, found.dark, found.tolerance)
        target.write_text(json.dumps(points), encoding="utf-8")
        print(f"{len(points)} points")
    print(target)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
