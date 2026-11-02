#!/usr/bin/env python3
"""A painted interior exported for the game (the owner's choice, 2026-10-23): the
scene's ground, its raised things by row, and what opens or is picked up, in the
format content/art/scenes/<scene>/art.json gives the page (D76).

    tools/art/trials/interior.py <source folder> <out folder>

The source folder holds the painting without its grid, the grid found in the
gridded one (grid.json), the cells marked by hand (marks.txt), an edit of the
painting with the floor alone, and edits without each thing that opens or is
picked up; and export.json, which names them:

    {"painting": "...png", "floor": "...png", "title": "...",
     "things": {"<id>": {"box": [x0, y0, x1, y1], "row": r, "solid": true,
                         "without": "...png", "states": {"closed": "painting",
                         "open": null}}},
     "lifts": [{"box": [x0, y0, x1, y1], "row": r}]}

`lifts` gives the things in a box that nothing joins to their foot in the
picture, like an awning on its poles, the row they stand on.

The field's cutter (image_first.py) joins a thing's pixels into one piece with
one foot; indoors every wall and bookcase is joined to every other, so here each
pixel stands on a row by where it lies, by the owner's rules for the masks:

- a pixel in a cell no one walks on stands on that cell's row;
- a pixel in a cell walked on, in its lower half, that differs from the floor
  alone and has a cell no one walks on just below it, is that thing rising: it
  stands on the row below;
- every other pixel is the ground.

So nothing reaches below its own row, and a thing covers only the cells above
it. What opens or is picked up is cut by the difference between the picture of
its state and the edit without it (export_scene.sprite_alpha), the ground taking
the edit without it inside its box, so that no ghost of it is left.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import export_scene  # noqa: E402
import image_first  # noqa: E402

CELL = export_scene.CELL
STANDING = image_first.STANDING


def page(picture: Image.Image, grid: dict, columns: int, rows: int) -> np.ndarray:
    """A picture in the painting's pixels moved onto the page's grid, as RGB."""
    return np.array(image_first.aligned(picture, grid, columns, rows, CELL))


def feet(marks: list[str], rising: np.ndarray) -> np.ndarray:
    """Each page pixel's foot row, or -1 for the ground: its own row in a cell no one
    walks on; the row below for a pixel of `rising` in a cell walked on with a cell
    no one walks on just below, joined to it in its own column by rising pixels
    from the cell's bottom edge up: a bookcase's top, an awning. A wall's foot seen
    above a cell walked on, which nothing joins to the cell below, is the ground."""
    rows, columns = len(marks), len(marks[0])
    standing = np.array([[ch in STANDING for ch in row] for row in marks])
    ys = np.arange(rows * CELL) // CELL
    xs = np.arange(columns * CELL) // CELL
    own = standing[ys][:, xs]
    foot = np.full(own.shape, -1, dtype=np.int16)
    foot[own] = np.repeat(ys[:, None], len(xs), axis=1)[own]
    # Closed up and down a little, so that a pixel or two of outline does not cut a run.
    closed = (
        np.array(
            Image.fromarray(rising.astype(np.uint8) * 255)
            .filter(ImageFilter.MaxFilter(5))
            .filter(ImageFilter.MinFilter(3))
        )
        > 127
    )
    for r in range(rows - 1):
        for c in range(columns):
            if standing[r][c] or not standing[r + 1][c]:
                continue
            band = closed[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL]
            # From the bottom edge up: a pixel rises while every pixel below it does.
            joined = np.flipud(np.cumprod(np.flipud(band), axis=0).astype(bool))
            mine = joined & rising[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL]
            foot[r * CELL : (r + 1) * CELL, c * CELL : (c + 1) * CELL][mine] = r + 1
    return foot


def rising_mask(painting: np.ndarray, floor: np.ndarray) -> np.ndarray:
    """Where the painting differs from its floor alone: what stands up."""
    mask = export_scene.changed(painting, floor, threshold=90)
    return (
        np.array(Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3)))
        > 127
    )


def build(source: Path, out: Path) -> Path:
    settings = json.loads((source / "export.json").read_text())
    grid = json.loads((source / "grid.json").read_text())
    marks = [r for r in (source / "marks.txt").read_text().splitlines() if r]
    rows, columns = len(marks), len(marks[0])
    painting_native = np.array(Image.open(source / settings["painting"]).convert("RGB"))
    ground_native = painting_native.copy()
    withouts = {}
    for name, thing in settings["things"].items():
        without = np.array(Image.open(source / thing["without"]).convert("RGB"))
        box = export_scene.native_box(grid, tuple(thing["box"]))
        inside = export_scene.in_box(painting_native.shape[:2], box)
        mask = export_scene.filled_mask(export_scene.changed(painting_native, without) & inside)
        grown = Image.fromarray((mask | inside & mask).astype(np.uint8) * 255).filter(
            ImageFilter.MaxFilter(15)
        )
        alpha = (np.array(grown.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255)[
            ..., None
        ]
        ground_native = (ground_native * (1 - alpha) + without * alpha).astype(np.uint8)
        withouts[name] = without
    ground = page(Image.fromarray(ground_native), grid, columns, rows)
    floor = page(Image.open(source / settings["floor"]), grid, columns, rows)
    rising = rising_mask(ground, floor)
    # Inside a thing's box the ground is what lies under it, a gap or a doorway's
    # dark: never something rising, which would be drawn over the thing.
    for thing in settings["things"].values():
        x0, y0, x1, y1 = (round(v * CELL) for v in thing["box"])
        rising[y0:y1, x0:x1] = False
    foot = feet(marks, rising)
    # A thing nothing joins to its foot in the picture, like an awning on its poles,
    # is given its row by hand: what rises in its box stands on that row.
    faint = export_scene.changed(ground, floor, threshold=35) if settings.get("lifts") else None
    for lift in settings.get("lifts", []):
        x0, y0, x1, y1 = (round(v * CELL) for v in lift["box"])
        part = faint[y0:y1, x0:x1]
        foot[y0:y1, x0:x1][part] = lift["row"]
    if out.exists():
        for old in out.iterdir():
            old.unlink()
    out.mkdir(parents=True, exist_ok=True)
    export_scene.webp(Image.fromarray(ground), out / "ground.webp")
    rows_out = []
    soft = np.array(
        Image.fromarray(((foot >= 0) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    )
    for row in range(rows):
        mine = foot == row
        if not mine.any():
            continue
        ys = np.nonzero(mine.any(axis=1))[0]
        top, bottom = int(ys.min()), (row + 1) * CELL
        alpha = np.where(mine, 255, 0).astype(np.uint8)
        # A soft edge where the thing meets the ground, never past its own row.
        edge = np.where(foot == -1, soft, 0).astype(np.uint8)
        near = (
            np.array(Image.fromarray(mine.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3)))
            > 0
        )
        alpha = np.maximum(alpha, np.where(near, edge, 0))
        rgba = np.dstack([ground, alpha])[top:bottom]
        rgba[..., 3] = (export_scene.clip_below(rgba[..., 3] / 255, row, top) * 255).astype(
            np.uint8
        )
        export_scene.webp(Image.fromarray(rgba, "RGBA"), out / f"row-{row}.webp")
        rows_out.append({"row": row, "image": f"row-{row}.webp", "top": top})
    things = {}
    for name, thing in settings["things"].items():
        without = withouts[name]
        native = export_scene.native_box(grid, tuple(thing["box"]))
        box = tuple(round(v * CELL) for v in thing["box"])
        states = {}
        for state, picture in thing["states"].items():
            states[state] = f"{name}-{state}.webp"
            if picture is None:
                export_scene.webp(Image.new("RGBA", (1, 1), (0, 0, 0, 0)), out / states[state])
                continue
            shown = (
                painting_native
                if picture == "painting"
                else np.array(Image.open(source / picture).convert("RGB"))
            )
            alpha = export_scene.sprite_alpha(
                shown, without, native, thing, round(grid["x"]["spacing"])
            )
            rgba = np.dstack([shown, (alpha * 255).astype(np.uint8)])
            sprite = export_scene.aligned_rgba(rgba, grid, columns, rows)[
                box[1] : box[3], box[0] : box[2]
            ].copy()
            sprite[..., 3] = (
                export_scene.clip_below(sprite[..., 3] / 255, thing["row"], box[1]) * 255
            ).astype(np.uint8)
            export_scene.webp(Image.fromarray(sprite, "RGBA"), out / states[state])
        things[name] = {"row": thing["row"], "left": box[0], "top": box[1], "states": states}
    art = {
        "cell": CELL,
        "size": [columns, rows],
        "ground": "ground.webp",
        "rows": rows_out,
        "things": things,
        "source": "SOURCE.md",
    }
    (out / "art.json").write_text(json.dumps(art, indent=2) + "\n")
    (out / "SOURCE.md").write_text(settings.get("source", ""))
    return out / "art.json"


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    print(build(Path(sys.argv[1]), Path(sys.argv[2])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
