"""The broom shed's cells and picture as the page draws them (sprint 42, 2.5; D202, D207,
D211): its figures on the scene's exported images, composed as tools/art/sweep.py
composes them, the way the page draws them, each figure among the cut-outs by its depth.

Read on the painting with its grid: the front wall's top from y 8.73 to 9.054, the lintel
under it down to its lower outline at y 9.385, from x 8.33 to x 11.67; the standing
bales from x 13.75; the back wall's foot at y 5.55 to 5.65; the bench on x 4.45 to 5.75,
its legs down to y 8.4.
"""

import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools" / "art"))
import image_first  # noqa: E402
import sweep  # noqa: E402

SCENE = sweep.load("the-broom-shed")
CELL = SCENE.cell
FRAME, FOOT = sweep.figure()
ALPHA = FRAME[..., 3] > 127
CUT = json.loads((REPO / "art" / "scenes" / "the-broom-shed" / "cut.json").read_text())
SHED = json.loads((REPO / "content" / "scenes" / "the-broom-shed" / "scene.json").read_text())


def region(*boxes: tuple[float, float, float, float]) -> np.ndarray:
    """The scene's pixels inside boxes given in cells, x0, y0, x1, y1."""
    out = np.zeros((SCENE.rows * CELL, SCENE.columns * CELL), dtype=bool)
    for x0, y0, x1, y1 in boxes:
        out[round(y0 * CELL) : round(y1 * CELL), round(x0 * CELL) : round(x1 * CELL)] = True
    return out


def polygon(points: list[list[float]]) -> np.ndarray:
    image = Image.new("L", (SCENE.columns * CELL, SCENE.rows * CELL))
    ImageDraw.Draw(image).polygon([(x * CELL, y * CELL) for x, y in points], fill=255)
    return np.array(image) > 0


#: What the front wall's top and the lintel paint, inside their outlines by a pixel.
WALL_AND_LINTEL = region((3.6, 8.75, 16.4, 9.04), (8.36, 9.06, 11.64, 9.37))
#: The standing bales, from their left edge, and the bench with its legs.
BALES = region((13.77, 4.6, 16.0, 9.0))
BENCH = region((4.47, 5.4, 5.73, 8.38))
BARREL = polygon(CUT["things"]["barrel"]["polygon"])


def placed(middle: float, feet: float) -> tuple[np.ndarray, np.ndarray]:
    """A figure drawn with its middle and its feet at those places, in cells: its own
    pixels and, of them, those something drawn in front of it covers, as scene-sized
    masks."""
    height, width = ALPHA.shape
    left = int(middle * CELL) - width // 2
    bottom = int(feet * CELL) + FOOT
    top = bottom - height
    own = np.zeros((SCENE.rows * CELL, SCENE.columns * CELL), dtype=bool)
    covered = np.zeros_like(own)
    front = np.zeros(ALPHA.shape, dtype=bool)
    for layer in SCENE.layers:
        if layer.depth > feet + 0.0005:
            front |= sweep.window(layer, left, top, left + width, bottom)[..., 3] > 127
    y0, x0 = max(0, top), max(0, left)
    y1, x1 = min(own.shape[0], bottom), min(own.shape[1], left + width)
    own[y0:y1, x0:x1] = ALPHA[y0 - top : y1 - top, x0 - left : x1 - left]
    covered[y0:y1, x0:x1] = (ALPHA & front)[y0 - top : y1 - top, x0 - left : x1 - left]
    return own, covered


def on(x: int, y: int) -> tuple[np.ndarray, np.ndarray]:
    return placed(sweep.middle_at(SCENE, x, y), sweep.feet_at(SCENE, x, y))


def walked(rows: tuple[int, ...]) -> list[tuple[int, int]]:
    return [(int(x), int(y)) for y, x in zip(*np.nonzero(SCENE.walked), strict=True) if y in rows]


FRONT_CELLS = walked((8, 9, 10))
#: Each step between two walked neighbours of rows 8 to 10, a quarter, a half and three
#: quarters of the way.
STEPS = [
    (a, b, part)
    for a in FRONT_CELLS
    for b in FRONT_CELLS
    if (b[0] - a[0], b[1] - a[1]) in ((1, 0), (0, 1))
    for part in (0.25, 0.5, 0.75)
]


@pytest.mark.parametrize("cell", FRONT_CELLS, ids=str)
def test_no_figure_of_the_front_rows_is_drawn_over_the_front_wall_or_the_lintel(cell):
    own, covered = on(*cell)
    assert not (own & WALL_AND_LINTEL & ~covered).any(), cell


@pytest.mark.parametrize(("a", "b", "part"), STEPS, ids=str)
def test_no_figure_walking_between_them_is_drawn_over_the_front_wall_or_the_lintel(a, b, part):
    middle = sweep.middle_at(SCENE, *a) * (1 - part) + sweep.middle_at(SCENE, *b) * part
    feet = sweep.feet_at(SCENE, *a) * (1 - part) + sweep.feet_at(SCENE, *b) * part
    own, covered = placed(middle, feet)
    assert not (own & WALL_AND_LINTEL & ~covered).any(), (a, b, part)


@pytest.mark.parametrize("x", range(6, 14))
def test_a_figure_under_the_pegs_has_its_soles_just_in_row_six(x):
    """D211: its lowest pixel under y 6.0, and no more than a tenth of a cell under it."""
    own, _ = on(x, 5)
    lowest = np.nonzero(own.any(axis=1))[0][-1] / CELL
    assert 6.0 < lowest <= 6.1, lowest


@pytest.mark.parametrize("cell", [(6, 5), (6, 6)], ids=str)
def test_a_figure_by_the_barrel_is_drawn_whole_in_front_of_it(cell):
    own, covered = on(*cell)
    assert own.any() and not covered.any(), cell


def test_the_barrel_is_cut_from_the_painting_on_row_five():
    """D211: its image is drawn over a broom hung on peg 6 and under the figures."""
    rows = [layer for layer in SCENE.layers if layer.name == "row 5 static"]
    assert rows and rows[0].depth < sweep.feet_at(SCENE, 6, 5)
    shown = np.zeros_like(BARREL)
    layer = rows[0]
    height, width = layer.rgba.shape[:2]
    top, left = layer.top, layer.left
    shown[top : top + height, left : left + width] = layer.rgba[..., 3] > 127
    # The barrel's part above its row's lower edge is the cut-out, round it nothing.
    above = BARREL & region((0, 0, SCENE.columns, 6.0))
    assert (shown & above).sum() > 0.95 * above.sum()
    assert not (shown & ~polygon_grown()).any()


def polygon_grown() -> np.ndarray:
    """The barrel's traced outline and its painted line beyond it, an eighth of a cell,
    which the cut takes with the barrel (D93)."""
    return image_first.dilated(BARREL, CELL // 8)


def test_the_figure_under_the_last_peg_is_clear_of_the_standing_bales():
    own, _ = on(13, 5)
    assert not (own & BALES).any()


@pytest.mark.parametrize("x", range(6, 14))
def test_a_figure_on_row_six_is_drawn_under_the_back_wall_s_foot(x):
    own, _ = on(x, 6)
    assert np.nonzero(own.any(axis=1))[0][0] / CELL >= 5.65


def lying_broom(cell: tuple[int, int]) -> np.ndarray:
    """A lying broom's pixels as the page draws it on a cell, moved by the scene's shift
    (D207): its sprite, its size, its foot and its origin from things.json."""
    things = REPO / "content" / "art" / "things"
    about = json.loads((things / "things.json").read_text())["broom"]
    sprite = Image.open(things / about["image"]).convert("RGBA")
    height = round(about["size"][1] * CELL)
    width = round(sprite.width * height / sprite.height)
    alpha = np.array(sprite.resize((width, height)))[..., 3] > 127
    ox, oy = about.get("origin", [0.5, 1.0])
    shift = SCENE.shifted.get(cell, 0.0)
    fx = (cell[0] + about["foot"][0] + shift) * CELL
    fy = (cell[1] + about["foot"][1]) * CELL
    left, top = round(fx - ox * width), round(fy - oy * height)
    out = np.zeros((SCENE.rows * CELL, SCENE.columns * CELL), dtype=bool)
    out[top : top + height, left : left + width] = alpha
    return out


@pytest.mark.parametrize("cell", [tuple(c) for c in SHED["straw"]], ids=str)
def test_a_broom_on_a_straw_cell_is_clear_of_the_barrel_the_bales_and_the_bench(cell):
    """D202, D207: drawn on each of the seven straw cells, moved by its shift."""
    broom = lying_broom(cell)
    assert broom.any()
    assert not (broom & (BARREL | BALES | BENCH)).any(), cell


def test_the_lintel_s_mask_covers_the_painting_from_the_wall_s_top_to_its_lower_outline():
    """2.5, 6: the wall's top and the lintel, drawn over every figure, cover the doorway's
    width from the wall's upper outline down to the lintel's lower one."""
    over = np.zeros_like(BARREL)
    for layer in SCENE.layers:
        if layer.over:
            height, width = layer.rgba.shape[:2]
            part = over[layer.top : layer.top + height, layer.left : layer.left + width]
            part |= layer.rgba[: part.shape[0], : part.shape[1], 3] > 127
    doorway = region((8.36, 8.75, 11.64, 9.37))
    assert (over & doorway).sum() == doorway.sum()
