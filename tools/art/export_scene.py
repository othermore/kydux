#!/usr/bin/env python3
"""A scene painted first, and the figures, exported for the game (the owner's
choice of 2026-10-23): what the page draws, at CELL pixels a cell.

    tools/art/export_scene.py <scene> [scene | check | all]
    tools/art/export_scene.py figures

A scene is named by its id, and everything of it that is its own is in its
settings, art/scenes/<scene>/cut.json (D82): where its pictures are in
art/raw/ (the painting without its grid, its grid, the ground-only edit, and
an edit for each thing that opens or is picked up, without it or in another
state), its things with their boxes, rows and states, the rows of its walls'
tops, the row above which the painting is ground, the patches of its ground,
the colours it is read by, and its SOURCE.md. The cells come from the scene's
map, content/scenes/<scene>/map.txt, marked by hand, which the world plays on
too. `all`, the default, is `scene` then `check`.

`check` draws pictures of the exported scene to look at, then sweeps it
(tools/art/sweep.py) and fails when its cut-outs would show a figure a
problem: a shadow or a flower drawn in front, the lawn drawn in front, a hole.

`scene` writes content/art/scenes/<scene>/:

- ground.webp: the painting with everything that opens or is picked up taken
  out, each from the edit without it, so that no ghost of a leaf remains;
- row-<r>.webp: the full scene's width, with alpha, holding what stands up and
  has its foot on row r, cut from that ground by image_first.py, from its top
  down to the bottom edge of row r and never lower: a thing only ever covers
  the cells above its own, where a figure standing behind it is, and never the
  cells below, where a figure standing in front of it is;
- <thing>-<state>.webp: each state of what opens or is picked up, cut by the
  difference between the picture of that state and the edit without the thing,
  and trimmed at its own row's bottom edge;
- art.json, which says where each image goes (the page's contract), and
  SOURCE.md.

The figures, from the painted walking sheets of art/raw/demo-src/ (three rows,
down, left and up, of three frames: a step, standing, the other step): each
figure's twelve frames in one sheet, content/art/figures/<id>.webp, four rows
(down, left, right, up) of three frames, every frame the same size, the figure
standing on the frame's foot line in its middle; figures.json says the frame's
size and its foot. A side frame a model drew facing the other way is turned by
comparing it with the demo's frames, which were turned by eye. The wizard's and
Nuri's sheets are the bases in art/figures/ that tools/art/figures.py recolours
for every look and friend, and it is run last, so that every sheet is made.
"""

import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import figures as looks  # noqa: E402
import image_first  # noqa: E402
import sprites  # noqa: E402
import sweep  # noqa: E402
from scene_settings import Settings, scenes, settings  # noqa: E402

REPO = HERE.parents[1]
RAW = REPO / "art" / "raw"
WORK = RAW / "game"
FIGURES_OUT = REPO / "content" / "art" / "figures"
#: The page's pixels a cell.
CELL = 96
QUALITY = 86


FIGURES = ("wizard", "nuri", "wenna", "eldra", "dask")
#: The figures every look and friend is recoloured from (tools/art/figures.py),
#: kept in art/figures/ as their bases.
AS_BASES = {"wizard": "wizard-base-boy.webp", "nuri": "friend-base-boy.webp"}
WAYS = ("down", "left", "right", "up")


def native_box(grid: dict, box: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    """A box in cells, in the painting's own pixels."""
    gx, gy = grid["x"], grid["y"]
    x0, y0, x1, y1 = box
    return (
        round(gx["offset"] + x0 * gx["spacing"]),
        round(gy["offset"] + y0 * gy["spacing"]),
        round(gx["offset"] + x1 * gx["spacing"]),
        round(gy["offset"] + y1 * gy["spacing"]),
    )


def changed(a: np.ndarray, b: np.ndarray, threshold: float = 60) -> np.ndarray:
    """Where two pictures of the same scene differ: the colour distance, smoothed,
    over a threshold, closed over its small gaps and opened of its specks."""
    d = np.abs(a.astype(np.int16) - b.astype(np.int16)).sum(axis=2) / 3
    smooth = Image.fromarray(np.clip(d, 0, 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(1.5)
    )
    # Tripled as integers: in its own bytes the strongest differences would wrap round.
    tripled = np.array(smooth).astype(np.int16) * 3
    mask = Image.fromarray((tripled > threshold).astype(np.uint8) * 255)
    mask = mask.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    return np.array(mask) > 127


def soft(mask: np.ndarray, radius: float = 1.2) -> np.ndarray:
    """The mask as alpha, its edge a little blurred, its inside whole."""
    blurred = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(radius))
    alpha = np.array(blurred).astype(np.float32) / 255
    alpha[mask] = 1.0
    return alpha


def in_box(shape: tuple[int, int], box: tuple[int, int, int, int]) -> np.ndarray:
    inside = np.zeros(shape, dtype=bool)
    x0, y0, x1, y1 = box
    inside[y0:y1, x0:x1] = True
    return inside


def filled_mask(mask: np.ndarray) -> np.ndarray:
    """A solid thing's mask with its holes filled: what no path of empty pixels
    joins to the edge, where a plank was coloured as the path behind it."""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return mask
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    part = mask[y0:y1, x0:x1]
    factor = max(1, max(part.shape) // 300)
    size = (max(1, part.shape[1] // factor), max(1, part.shape[0] // factor))
    small = np.array(Image.fromarray(part.astype(np.uint8) * 255).resize(size)) > 127
    whole = image_first.filled(small, small.size)
    grown = np.array(Image.fromarray(whole.astype(np.uint8) * 255).resize(part.shape[::-1])) > 127
    out = mask.copy()
    out[y0:y1, x0:x1] |= grown
    return out


def kept(mask: np.ndarray, share: float) -> np.ndarray:
    """The mask's pieces as large as `share` of its largest, the scraps dropped."""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return mask
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    part = mask[y0:y1, x0:x1]
    factor = 4
    size = (max(1, part.shape[1] // factor), max(1, part.shape[0] // factor))
    small = np.array(Image.fromarray(part.astype(np.uint8) * 255).resize(size)) > 60
    lab = image_first.labels(small)
    numbers, sizes = np.unique(lab[lab > 0], return_counts=True)
    if not len(sizes):
        return mask
    chosen = np.isin(lab, numbers[sizes >= share * sizes.max()])
    big = np.array(Image.fromarray(chosen.astype(np.uint8) * 255).resize(part.shape[::-1])) > 0
    near = Image.fromarray(big.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))
    out = np.zeros_like(mask)
    out[y0:y1, x0:x1] = part & (np.array(near) > 0)
    return out


def sprite_alpha(
    shown: np.ndarray, without: np.ndarray, box: tuple[int, int, int, int], thing: dict
) -> np.ndarray:
    """A state's alpha, in the painting's own pixels: a solid door's or the wand's
    where the state differs from the picture without the thing, its holes filled;
    an open-work gate's by how much each pixel differs, so that the path between
    its bars stays the ground's."""
    inside = in_box(shown.shape[:2], box)
    if thing["solid"]:
        mask = filled_mask(changed(shown, without) & inside)
        mask = kept(mask, 0.6 if thing.get("largest") else 0.05)
        if thing.get("hull"):
            mask = row_hull(mask) & inside
        return soft(mask, 1.5) * inside
    d = np.abs(shown.astype(np.int16) - without.astype(np.int16)).sum(axis=2) / 3
    d = Image.fromarray(np.clip(d, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
    alpha = np.clip((np.array(d).astype(np.float32) - 22) / 30, 0, 1) * inside
    return alpha * kept(alpha > 0.5, 0.03)


def aligned_rgba(image: np.ndarray, grid: dict, columns: int, rows: int) -> np.ndarray:
    """An RGBA picture in the painting's pixels moved onto the page's grid."""
    gx, gy = grid["x"], grid["y"]
    sx, sy = gx["spacing"] / CELL, gy["spacing"] / CELL
    moved = Image.fromarray(image, "RGBA").transform(
        (columns * CELL, rows * CELL),
        Image.AFFINE,
        (sx, 0, gx["offset"], 0, sy, gy["offset"]),
        resample=Image.BICUBIC,
    )
    return np.array(moved)


def webp(image: Image.Image, path: Path) -> None:
    image.save(path, "WEBP", quality=QUALITY, method=6, alpha_quality=90)


def row_hull(mask: np.ndarray) -> np.ndarray:
    """A mask filled, in every row, from its leftmost pixel to its rightmost."""
    out = mask.copy()
    for y in np.nonzero(mask.any(axis=1))[0]:
        xs = np.nonzero(mask[y])[0]
        out[y, xs[0] : xs[-1] + 1] = True
    return out


def clip_below(
    alpha: np.ndarray, row: int, top: int, cell: int = CELL, reach: float = 0.0
) -> np.ndarray:
    """The alpha of an image whose top is at `top`, emptied below row's bottom edge:
    nothing of a thing reaches into the cells below its own row, but by `reach` of a
    cell for a thing that names it (a door's threshold)."""
    out = alpha.copy()
    bottom = round((row + 1 + reach) * cell) - top
    if bottom < out.shape[0]:
        out[max(0, bottom) :] = 0
    return out


def composite(
    scene: Settings, grid: dict
) -> tuple[np.ndarray, dict[str, np.ndarray], dict[str, np.ndarray]]:
    """The painting with what opens or is picked up taken out, each from the edit
    without it, in the painting's own pixels; and each thing's picture without it,
    and the mask of where it was."""
    painting = np.array(Image.open(scene.painting).convert("RGB"))
    ground = painting.copy()
    withouts, masks = {}, {}
    for name, thing in scene.things.items():
        without = np.array(Image.open(scene.edits / thing["without"]).convert("RGB"))
        box = native_box(grid, thing["box"])
        if thing.get("whole_box"):
            mask = in_box(painting.shape[:2], box)
        else:
            mask = filled_mask(changed(painting, without) & in_box(painting.shape[:2], box))
        grown = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(21))
        # Blended in softly, so that no edge shows where the edit's tones meet the painting's.
        feather = grown.filter(ImageFilter.GaussianBlur(10))
        alpha = (np.array(feather).astype(np.float32) / 255)[..., None]
        ground = (ground * (1 - alpha) + without * alpha).astype(np.uint8)
        withouts[name], masks[name] = without, mask
    return ground, withouts, masks


def patched(floor: Image.Image, patches: list[tuple[int, int, int, int]]) -> Image.Image:
    """The ground with each patch filled from the band right above it."""
    pixels = np.array(floor.convert("RGB"))
    for x0, y0, x1, y1 in patches:
        height = y1 - y0
        above = pixels[y0 - height : y0, x0:x1].astype(np.float32)
        here = pixels[y0:y1, x0:x1].astype(np.float32)
        # The band above, laid over the patch, fading out over its last rows and its
        # sides so that no edge shows.
        fade = np.ones((height, x1 - x0), dtype=np.float32)
        edge = 6
        fade[-edge:] *= np.linspace(1, 0, edge)[:, None]
        fade[:, :edge] *= np.linspace(0, 1, edge)[None, :]
        fade[:, -edge:] *= np.linspace(1, 0, edge)[None, :]
        laid = fade[..., None]
        pixels[y0:y1, x0:x1] = (above * laid + here * (1 - laid)).astype(np.uint8)
    return Image.fromarray(pixels)


def scene(settings: Settings) -> Path:
    grid = settings.grid
    marks = settings.marks()
    rows, columns = len(marks), len(marks[0])
    ground, withouts, _ = composite(settings, grid)
    # The ground, cut by image_first.py into the rows of what stands up: from a
    # source folder holding the ground in place of the painting, with no box for
    # a gate or a seal, since nothing of them is left in it.
    src = settings.src
    src.mkdir(parents=True, exist_ok=True)
    Image.fromarray(ground).save(src / "ground-composite.png")
    (src / "grid.json").write_text(json.dumps(grid))
    shutil.copy(settings.map, src / "marks.txt")
    shutil.copy(settings.ground_only, src / "ground-only.png")
    empty = [0, 0, 0, 0]
    # A thing lying on a flat stone, cut whole from its box, stands the stone on
    # its row; nothing is left of the things to cut.
    lying = next((t["box"] for t in settings.things.values() if t.get("whole_box")), empty)
    cut = {
        "gridded": "ground-composite.png",
        "nogrid": "ground-composite.png",
        "ground": "ground-only.png",
        "boxes": {"gate": empty, "seal": empty, "wand": list(lying)},
        "leaves": [],
        "cuts": settings.data.get("cuts", list(image_first.CUTS)),
        "castle": settings.data.get("castle", image_first.DEFAULTS["castle"]),
        "thresholds": settings.data.get("thresholds", {}),
    }
    (src / "cut.json").write_text(json.dumps(cut))
    keep = image_first.TILE
    image_first.TILE = CELL
    try:
        field = json.loads(image_first.build(src, settings.cut).read_text())
    finally:
        image_first.TILE = keep
    out = settings.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    width = columns * CELL
    floor = image_first.aligned(Image.fromarray(ground), grid, columns, rows, CELL)
    floor = patched(floor, settings.patches)
    webp(floor, out / "ground.webp")
    rows_out = []
    for layer in field["layers"]:
        if not layer["name"].startswith("row "):
            continue
        row = layer["row"]
        crop = Image.open(settings.cut / layer["file"]).convert("RGBA")
        x, y = layer["at"]
        top = y
        strip = Image.new("RGBA", (width, (row + 1) * CELL - top), (0, 0, 0, 0))
        strip.alpha_composite(
            crop.crop((0, 0, crop.width, min(crop.height, strip.height))), (x, 0)
        )
        pixels = np.array(strip)
        pixels[..., 3] = (clip_below(pixels[..., 3] / 255, row, top) * 255).astype(np.uint8)
        if not pixels[..., 3].any():
            continue
        webp(Image.fromarray(pixels), out / f"row-{row}.webp")
        rows_out.append({"row": row, "image": f"row-{row}.webp", "top": top})
    # Each thing's states, at the page's size: the picture of the state where it
    # differs from the picture without the thing.
    painting = np.array(Image.open(settings.painting).convert("RGB"))
    things = {}
    for name, thing in settings.things.items():
        without = withouts[name]
        native = native_box(grid, thing["box"])
        box = tuple(round(v * CELL) for v in thing["box"])
        states = {}
        left, top = box[0], box[1]
        for state, picture in thing["states"].items():
            states[state] = f"{name}-{state}.webp"
            if picture is None:
                # Nothing is drawn: the ground under it is the thing's absence.
                webp(Image.new("RGBA", (1, 1), (0, 0, 0, 0)), out / states[state])
                continue
            if picture == "painting":
                shown, alpha = painting, sprite_alpha(painting, without, native, thing)
            elif picture == "without":
                # The open door is the dark where the closed door was.
                shown, alpha = without, sprite_alpha(painting, without, native, thing)
            else:
                shown = np.array(Image.open(settings.edits / picture).convert("RGB"))
                alpha = sprite_alpha(shown, without, native, thing)
            rgba = np.dstack([shown, (alpha * 255).astype(np.uint8)])
            sprite = aligned_rgba(rgba, grid, columns, rows)[box[1] : box[3], box[0] : box[2]]
            sprite = sprite.copy()
            reach = thing.get("reach", 0.0)
            below = clip_below(sprite[..., 3] / 255, thing["row"], top, reach=reach)
            sprite[..., 3] = (below * 255).astype(np.uint8)
            webp(Image.fromarray(sprite, "RGBA"), out / states[state])
        things[name] = {"row": thing["row"], "left": left, "top": top, "states": states}
        if "rune" in thing:
            things[name]["rune"] = thing["rune"]
    art = {
        "cell": CELL,
        "size": [columns, rows],
        "ground": "ground.webp",
        "rows": rows_out,
        "things": things,
        "source": "SOURCE.md",
    }
    (out / "art.json").write_text(json.dumps(art, indent=2) + "\n")
    (out / "SOURCE.md").write_text(settings.data["source"])
    return out / "art.json"


FIGURES_SOURCE = """# The figures

Kydux's own art, made for the game and under the GNU GPL, version 3 or
later, like the rest of it.

- Drawn by Gemini 3 Pro Image (`gemini-3-pro-image`) as walking sheets, from
  `tools/art/prompts/demo-wizard.md`, `demo-nuri.md`, `demo-wenna.md`,
  `demo-eldra.md` and `demo-dask.md`, each with the style-B wizard as its
  reference (`chibi-b-gemini.md`); cut by `tools/art/sprites.py` and put
  together by `tools/art/export_scene.py`.
- The wizard's girl and Nuri's are Gemini's edits of those sheets
  (`figure-wizard-girl.md`, `figure-nuri-girl.md`), and the wizard's
  casting frames are Gemini's edits of the wizard's two sheets
  (`figure-cast-boy.md`, `figure-cast-girl.md`), each put back on its grid
  by `tools/art/figures.py`. The base sheets are in `art/figures/`.
- `wizard-<look>.webp` for each look of the creator, its walking rows and
  its casting rows, and Teku's and Nuri's, are those bases recoloured by
  `tools/art/figures.py`: the robe, the hat, its band, the hair and the
  skin in the look's colours (`app/src/engine/looks.ts`), their shading
  kept.
"""


#: The side frames the comparison with the demo leaves wrong, put right by eye:
#: a frame to turn, and a standing side frame that faces the viewer, taken from
#: the first frame instead.
SIDE_FIXES = {
    "wenna": {"standing_from": 0},
    "dask": {"standing_from": 0},
}


def figure_frames(name: str, scale: float) -> dict[str, list[Image.Image]]:
    """A figure's frames at `scale` times the demo's, each side frame turned to
    match the demo's own, which were turned by eye."""
    demo = RAW / "demo" / "pieces"
    standing = Image.open(demo / f"{name}-down-1.png")
    height = round(standing.height * scale)
    cut_dir = WORK / "figures" / name
    sprites.figures(RAW / "demo-src" / f"demo-{name}.png", cut_dir, name, height)
    frames: dict[str, list[Image.Image]] = {}
    for way in ("down", "left", "up"):
        frames[way] = []
        for index in range(3):
            frame = Image.open(cut_dir / f"{name}-{way}-{index}.png").convert("RGBA")
            if way == "left":
                target = Image.open(demo / f"{name}-left-{index}.png").convert("RGBA")
                small = frame.resize(target.size, Image.LANCZOS)
                flipped = small.transpose(Image.FLIP_LEFT_RIGHT)
                a, b, t = (np.array(x).astype(np.int16) for x in (small, flipped, target))
                if np.abs(b - t).mean() < np.abs(a - t).mean():
                    frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
            frames[way].append(frame)
    fix = SIDE_FIXES.get(name, {})
    for index in fix.get("flip", ()):
        frames["left"][index] = frames["left"][index].transpose(Image.FLIP_LEFT_RIGHT)
    if "standing_from" in fix:
        frames["left"][1] = frames["left"][fix["standing_from"]]
    frames["right"] = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames["left"]]
    return frames


#: The figures at twice the demo's size: the demo drew a cell 48 pixels across.
FIGURE_SCALE = CELL / 48
#: The space under the feet in a frame, for a shadow the page may draw.
FOOT = 6


def figures() -> Path:
    every = {name: figure_frames(name, FIGURE_SCALE) for name in FIGURES}
    width = max(f.width for frames in every.values() for way in frames.values() for f in way)
    height = max(f.height for frames in every.values() for way in frames.values() for f in way)
    width, height = width + 4, height + FOOT + 2
    out = FIGURES_OUT
    out.mkdir(parents=True, exist_ok=True)
    for name, frames in every.items():
        sheet = Image.new("RGBA", (width * 3, height * len(WAYS)), (0, 0, 0, 0))
        for r, way in enumerate(WAYS):
            for c, frame in enumerate(frames[way]):
                x = c * width + (width - frame.width) // 2
                y = r * height + height - FOOT - frame.height
                sheet.alpha_composite(frame, (x, y))
        # Each frame over its row's standing frame, and each walking row made from
        # it, so that the figure walks moving its feet alone (or its dress, floating).
        sheet = looks.steadied(sheet, (width, height))
        sheet = looks.walking(
            sheet, (width, height), looks.FLOATING.get(name), looks.KEPT_FRAME.get(name)
        )
        webp(sheet, looks.BASE_DIR / AS_BASES[name] if name in AS_BASES else out / f"{name}.webp")
    wizard = every["wizard"]["down"][1].height
    data = {
        "cell": CELL,
        "frame": [width, height],
        "foot": FOOT,
        "height_cells": round(wizard / CELL, 2),
        "ways": list(WAYS),
        "frames": 3,
        "standing": 1,
        "figures": [name for name in FIGURES if name not in AS_BASES],
    }
    (out / "figures.json").write_text(json.dumps(data, indent=2) + "\n")
    # Every look's sheet and the friends', from the bases, and their names in the list.
    looks.make()
    (out / "SOURCE.md").write_text(FIGURES_SOURCE)
    return out / "figures.json"


def main(arguments: list[str]) -> int:
    if arguments[:1] == ["figures"]:
        print(figures().relative_to(REPO))
        return 0
    if not arguments or arguments[0] not in scenes():
        print(f"usage: export_scene.py <{' | '.join(scenes())}> [scene | check | all]")
        print("       export_scene.py figures")
        return 2
    settings_of = settings(arguments[0])
    what = arguments[1] if len(arguments) > 1 else "all"
    if what in ("scene", "all"):
        print(scene(settings_of).relative_to(REPO))
    if what in ("check", "all"):
        for path in checks(settings_of):
            print(path.relative_to(REPO))
        # The wizard on every cell walked on, and the cut's problems it would show.
        if sweep.main(settings_of.id) != 0:
            return 1
    return 0


def draw(
    folder: Path,
    figures_folder: Path = FIGURES_OUT,
    standing: list[tuple[str, int, int]] = (),
    states: dict[str, str] | None = None,
) -> Image.Image:
    """The exported scene as the page draws it: the ground, then row by row what
    stands up and has its foot there, the things in their states, and the
    figures standing on that row; each figure is `(name, x, y)` in cells."""
    art = json.loads((folder / "art.json").read_text())
    fig = json.loads((figures_folder / "figures.json").read_text())
    cell = art["cell"]
    picture = Image.open(folder / art["ground"]).convert("RGBA")
    width, height = fig["frame"]
    sheets = {
        name: Image.open(figures_folder / f"{name}.webp").convert("RGBA")
        for name, _, _ in standing
    }
    by_row: dict[int, list[tuple[Image.Image, tuple[int, int]]]] = {}
    for layer in art["rows"]:
        image = Image.open(folder / layer["image"]).convert("RGBA")
        by_row.setdefault(layer["row"], []).append((image, (0, layer["top"])))
    for name, thing in art["things"].items():
        state = (states or {}).get(name, next(iter(thing["states"])))
        image = Image.open(folder / thing["states"][state]).convert("RGBA")
        by_row.setdefault(thing["row"], []).append((image, (thing["left"], thing["top"])))
    for name, x, y in standing:
        # The standing frame, facing down, its feet on the cell's lower middle.
        frame = sheets[name].crop((width, 0, 2 * width, height))
        left = x * cell + (cell - width) // 2
        top = (y + 1) * cell - cell // 8 - (height - fig["foot"])
        by_row.setdefault(y, []).append((frame, (left, top), "figure"))
    for row in sorted(by_row):
        # What stands on a row is drawn before the figures standing on it.
        for entry in sorted(by_row[row], key=lambda e: len(e) == 3):
            image, (left, top) = entry[0], entry[1]
            picture.alpha_composite(image, (max(0, left), max(0, top)))
    return picture


def checks(settings: Settings, out: Path = RAW / "game-check") -> list[Path]:
    """Pictures of the exported scene with figures standing behind and in front of
    what stands up, at the levels' starts, and the things open and shut, each named
    after the scene."""
    marks = settings.marks()
    rows, columns = len(marks), len(marks[0])
    walked = sweep.walks(settings.id)
    walk = {(x, y) for y, x in zip(*np.nonzero(walked), strict=True)}
    # Behind: a cell walked on just above a tree, a rock or a fence; in front: just below.
    behind, front = [], []
    for y, row in enumerate(marks):
        for x, ch in enumerate(row):
            if ch in "trf":
                if (x, y - 1) in walk:
                    behind.append((sweep.LOOK, x, y - 1))
                if (x, y + 1) in walk:
                    front.append(("nuri", x, y + 1))
    starts = []
    for path in sorted((REPO / "content" / "levels").glob("*/level.json")):
        level = json.loads(path.read_text())
        if level.get("scene") == settings.id and "start" in level:
            starts.append((sweep.LOOK, *level["start"]))
    opened = {name: "open" for name, thing in settings.things.items() if "open" in thing["states"]}
    out.mkdir(parents=True, exist_ok=True)
    written = []
    cell = CELL
    for name, standing, states in (
        ("behind", behind[::2], None),
        ("front", front[::2], None),
        ("starts", starts, None),
        ("open", starts, opened),
    ):
        picture = draw(settings.out, standing=standing, states=states)
        target = out / f"{settings.id}-{name}.png"
        small = picture.resize((picture.width // 2, picture.height // 2), Image.LANCZOS)
        small.save(target)
        written.append(target)
    # A close look at each thing, its box grown by two cells, shut and open, with a
    # figure in front of it and one behind.
    for name, thing in settings.things.items():
        x0, y0, x1, y1 = thing["box"]
        box = (
            max(0, int(x0) - 2),
            max(0, int(y0) - 2),
            min(columns, int(np.ceil(x1)) + 2),
            min(rows, int(np.ceil(y1)) + 2),
        )
        middle = int((x0 + x1) / 2)
        near = [(sweep.LOOK, middle, box[3] - 2), ("nuri", middle, box[1] + 1)]
        crop = tuple(v * cell for v in box)
        shut = draw(settings.out, standing=near).crop(crop)
        open_ = draw(settings.out, standing=near, states=opened).crop(crop)
        both = Image.new("RGBA", (shut.width * 2 + 12, shut.height), (20, 20, 26, 255))
        both.alpha_composite(shut, (0, 0))
        both.alpha_composite(open_, (shut.width + 12, 0))
        target = out / f"{settings.id}-close-{name}.png"
        both.save(target)
        written.append(target)
    return written


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
