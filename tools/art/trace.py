#!/usr/bin/env python3
"""Aids for tracing a polygon by hand on a scene's picture, in cells (D113).

    tools/art/trace.py <scene> look <picture> x0 y0 x1 y1 [--scale 3] [--poly <json>]
                                    [--diff <other picture>] [--out <png>]
    tools/art/trace.py <scene> outline <picture> x0 y0 x1 y1 <seed x> <seed y>
                                    [--dark 70] [--tolerance 1.5] [--out <json>]

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
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
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
    edge = simplified(boundary(region), tolerance)[:-1]
    gx, gy = grid["x"], grid["y"]
    return [
        [
            round((x + pixels[0] + 0.5 - gx["offset"]) / gx["spacing"], 3),
            round((y + pixels[1] + 0.5 - gy["offset"]) / gy["spacing"], 3),
        ]
        for x, y in edge
    ]


def main(arguments: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("scene")
    parser.add_argument("command", choices=["look", "outline"])
    parser.add_argument("picture", type=Path)
    parser.add_argument("box", type=float, nargs=4, metavar=("X0", "Y0", "X1", "Y1"))
    parser.add_argument("seed", type=float, nargs="*", metavar=("SX", "SY"))
    parser.add_argument("--scale", type=float, default=3.0)
    parser.add_argument("--poly", type=json.loads)
    parser.add_argument("--diff", type=Path)
    parser.add_argument("--dark", type=int, default=70)
    parser.add_argument("--tolerance", type=float, default=1.5)
    parser.add_argument("--out", type=Path)
    found = parser.parse_args(arguments)
    settings = scene_settings.settings(found.scene)
    picture = found.picture if found.picture.is_absolute() else REPO / found.picture
    other = found.diff and (found.diff if found.diff.is_absolute() else REPO / found.diff)
    box = tuple(found.box)
    if found.command == "look":
        target = found.out or Path(f"{picture.stem}-look.png")
        look(settings.grid, picture, box, found.scale, found.poly, other).save(target)
    else:
        if len(found.seed) != 2:
            parser.error("outline needs the seed's x and y, in cells")
        target = found.out or Path(f"{picture.stem}-outline.json")
        seed = (found.seed[0], found.seed[1])
        points = outline(settings.grid, picture, box, seed, found.dark, found.tolerance)
        target.write_text(json.dumps(points), encoding="utf-8")
        print(f"{len(points)} points")
    print(target)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
