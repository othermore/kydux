#!/usr/bin/env python3
"""Aids for a thing's cut-outs on a scene's pictures: its mask as the difference of two
of them (D148), and a polygon in cells, traced by hand (D113).

    tools/art/trace.py <scene> diff <thing> <picture> [--state <state>]
                                    [--within X0 Y0 X1 Y1]
                                    [--threshold 26] [--soft 13] [--speck 8] [--holes 3000]
                                    [--close 0] [--rim]
    tools/art/trace.py <scene> look <picture> x0 y0 x1 y1 [--scale 3] [--poly <json>]
                                    [--diff <other picture>] [--out <png>]
    tools/art/trace.py <scene> outline <picture> x0 y0 x1 y1 <seed x> <seed y>
                                    [--dark 70] [--tolerance 1.5] [--out <json>]
    tools/art/trace.py <scene> footprint <door thing> [--grow 7] [--tolerance 1.5]
                                    [--out <json>]
    tools/art/trace.py <scene> fit <picture>

`diff` writes a thing's mask into its settings as the difference of `picture` against
the scene's painting, its base (D148): the colour distance smoothed and thresholded,
cleaned of specks, closed over its holes, kept within the thing's box (`--within` for
a part of it). With `--state`, the state of a thing that comes and goes; without it, a
static thing, cut from the base where `picture`, the base with the thing gone or painted
flat magenta, differs; with magenta, `--threshold 70 --soft 70 --rim`, so that only the
magenta counts and the thing keeps the outline beside it.
It prints how much the mask covers and the leak, how much of a cell's band round the
box differs the same way: more than a fringe says to look at the picture, and where the
edit changed what it should not, in the mask or beside it, it is asked again. It writes
art/raw/game-check/diff-<scene>-<thing>[-<state>].png, the picture with the mask's edge
drawn in magenta, to look at.

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

`fit` measures how well a model's picture of the whole scene at another hour lays
on the painting (D126), before anything is cut from it: the dark outlines of both
(image_first.dark_lines), and for each static thing's box and each door's box, the
shift of the picture, up to FIT_REACH pixels each way, that differs least from
the painting's outlines there, and the share of the painting's outline pixels
the shifted picture's outlines cover. It prints them as a table, and whether the
picture fits: every box's shift at most FIT_SHIFT pixels each way and its share at
least FIT_SHARE.
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


#: How wide the band round a thing's box the leak is measured on, in cells; and the share
#: of it that may differ before the picture is asked again.
LEAK_BAND = 0.5
LEAK_MOST = 0.03


def difference(
    settings: scene_settings.Settings,
    name: str,
    picture: Path,
    state: str | None,
    within: tuple[float, float, float, float] | None,
    options: dict,
) -> dict:
    """A thing's mask as the difference of `picture` against the base (D148), written
    into its settings; what it measured, and the look it wrote."""
    thing = settings.data["things"][name]
    grid = settings.grid
    base = np.array(Image.open(settings.painting).convert("RGB"))
    shown = np.array(Image.open(picture).convert("RGB"))
    box = tuple(within or thing["box"])
    native = export_scene.native_box(grid, box)
    mask = export_scene.difference_mask(shown, base, native, options)
    if not mask.any():
        raise SystemExit(f"{name}: {picture.name} does not differ from the base in its box")
    spacing = round(grid["x"]["spacing"])
    band = round(LEAK_BAND * spacing)
    x0, y0, x1, y1 = native
    around = (x0 - band, y0 - band, x1 + band, y1 + band)
    height, width = base.shape[:2]
    ring = export_scene.in_box((height, width), around) & ~export_scene.in_box(
        (height, width), native
    )
    leaked = export_scene.difference_mask(shown, base, around, options) & ring
    leak = float(leaked.sum() / max(1, ring.sum()))
    relative = picture.relative_to(settings.edits).as_posix()
    own = {key: value for key, value in options.items() if value is not None}
    if state is None:
        thing["mask"] = "difference"
        thing["picture"] = relative
        thing["diff"] = own
        thing.pop("polygon", None)
    else:
        entry = {"picture": relative, "diff": own}
        was = thing["states"].get(state)
        if isinstance(was, dict):
            entry.update({key: was[key] for key in ("row", "reach") if key in was})
        if within:
            entry["box"] = list(within)
        thing["states"][state] = entry
    path = scene_settings.SCENES / settings.id / "cut.json"
    path.write_text(json.dumps(settings.data, indent=2, ensure_ascii=False) + "\n")
    out = export_scene.RAW / "game-check"
    out.mkdir(parents=True, exist_ok=True)
    suffix = f"-{state}" if state else ""
    target = out / f"diff-{settings.id}-{name}{suffix}.png"
    edge = export_scene.edge_of(mask.astype(np.float32))
    # A static thing is drawn from the base, a state from its own picture.
    edged = (base if state is None else shown).copy()
    edged[image_first.dilated(edge, 1)] = (255, 0, 255)
    left, top = max(0, around[0]), max(0, around[1])
    Image.fromarray(edged[top : around[3], left : around[2]]).save(target)
    return {"pixels": int(mask.sum()), "leak": leak, "look": target}


#: How far a box of a scene's picture at another hour is shifted to lay it on the
#: painting, in the painting's pixels; how far it may be off and how much of the
#: painting's outlines it must cover for the picture to fit whole (D126).
FIT_REACH = 12
FIT_SHIFT = 3
FIT_SHARE = 0.85


def fit(settings: scene_settings.Settings, picture: Path) -> list[dict]:
    """For each static thing and door of the scene, the shift (dx, dy) of `picture`
    whose outlines differ least from the painting's in the thing's box, and the
    share of the painting's outline pixels there that they cover so shifted."""
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    shown = Image.open(picture).convert("RGB")
    if shown.size != (painting.shape[1], painting.shape[0]):
        shown = shown.resize((painting.shape[1], painting.shape[0]), Image.LANCZOS)
    ours = image_first.dark_lines(painting, settings.thresholds)
    theirs = image_first.dark_lines(np.array(shown), settings.thresholds)
    height, width = ours.shape
    reach = FIT_REACH
    found = []
    for name, thing in settings.things.items():
        states = thing.get("states", {})
        if not (thing.get("static") or (thing.get("kind") == "door" and states)):
            continue
        x0, y0, x1, y1 = export_scene.native_box(settings.grid, thing["box"])
        x0, y0 = max(reach, x0), max(reach, y0)
        x1, y1 = min(width - reach, x1), min(height - reach, y1)
        lines = ours[y0:y1, x0:x1]
        best = None
        for dy in range(-reach, reach + 1):
            for dx in range(-reach, reach + 1):
                moved = theirs[y0 + dy : y1 + dy, x0 + dx : x1 + dx]
                differs = int(np.count_nonzero(lines ^ moved))
                if best is None or differs < best[0]:
                    best = (differs, dx, dy, moved)
        assert best is not None
        _, dx, dy, moved = best
        share = float(np.count_nonzero(lines & moved)) / max(1, int(np.count_nonzero(lines)))
        fits = abs(dx) <= FIT_SHIFT and abs(dy) <= FIT_SHIFT and share >= FIT_SHARE
        found.append({"thing": name, "shift": [dx, dy], "share": round(share, 3), "fits": fits})
    return found


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
    fitting = commands.add_parser("fit")
    fitting.add_argument("picture", type=Path)
    differing = commands.add_parser("diff")
    differing.add_argument("thing")
    differing.add_argument("picture", type=Path)
    differing.add_argument("--state")
    differing.add_argument("--within", type=float, nargs=4, metavar=("X0", "Y0", "X1", "Y1"))
    differing.add_argument("--threshold", type=int)
    differing.add_argument("--soft", type=int)
    differing.add_argument("--speck", type=int)
    differing.add_argument("--holes", type=int)
    differing.add_argument("--close", type=int)
    differing.add_argument("--rim", action="store_true", default=None)
    found = parser.parse_args(arguments)
    settings = scene_settings.settings(found.scene)
    if found.command == "diff":
        picture = found.picture if found.picture.is_absolute() else settings.edits / found.picture
        options = {
            "threshold": found.threshold,
            "soft": found.soft,
            "speck": found.speck,
            "holes": found.holes,
            "close": found.close,
            "rim": found.rim,
        }
        told = {key: value for key, value in options.items() if value is not None}
        within = tuple(found.within) if found.within else None
        measured = difference(settings, found.thing, picture, found.state, within, told)
        verdict = "look at the picture" if measured["leak"] > LEAK_MOST else "a fringe at most"
        print(f"{measured['pixels']} pixels; leak {measured['leak']:.3f} ({verdict})")
        print(measured["look"])
        return 0
    if found.command == "fit":
        picture = found.picture if found.picture.is_absolute() else REPO / found.picture
        rows = fit(settings, picture)
        print("| thing | shift (dx, dy) | share | fits |")
        print("| --- | --- | --- | --- |")
        for row in rows:
            dx, dy = row["shift"]
            print(f"| {row['thing']} | {dx:+d}, {dy:+d} | {row['share']:.3f} | {row['fits']} |")
        whole = all(row["fits"] for row in rows)
        missed = sum(not row["fits"] for row in rows)
        print(
            "the picture fits whole" if whole else f"the picture does not fit: {missed} boxes off"
        )
        return 0
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
