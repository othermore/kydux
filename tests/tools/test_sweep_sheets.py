"""The review's sheets (D208): their grid lines fall on the cells' borders, each cell's
number lies inside its cell, in its middle and at its foot, where the game's ?debug
layer writes it, and a scene wider than forty cells is written in parts that share two
columns."""

import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools" / "art"))
import sweep  # noqa: E402

CELL = 96
GREY = (128, 128, 128, 255)


def plain(columns: int, rows: int) -> sweep.Scene:
    """A scene of plain grey ground."""
    ground = np.zeros((rows * CELL, columns * CELL, 4), dtype=np.uint8)
    ground[...] = GREY
    return sweep.Scene("plain", CELL, columns, rows, np.ones((rows, columns), bool), ground)


SCENE = plain(12, 14)
SHEET = np.array(sweep.gridded(SCENE, Image.fromarray(SCENE.ground)))
#: The numbers' yellow, told from the grey, the black and the white of the lines.
YELLOW = (SHEET[..., 0] > 200) & (SHEET[..., 1] > 200) & (SHEET[..., 2] < 170)


def test_the_grid_lines_fall_on_the_cells_borders_and_leave_the_cells_clear():
    grey = np.all(SHEET[..., :3] == GREY[:3], axis=2)
    for k in range(1, SCENE.columns):
        assert not grey[: SCENE.rows * CELL, k * CELL].any()
    for k in range(1, SCENE.rows):
        assert not grey[k * CELL, :].any()
    # Within a cell, clear of its borders and of its number, the ground as it is.
    for y in range(SCENE.rows):
        for x in range(SCENE.columns):
            assert grey[
                y * CELL + 8 : y * CELL + CELL // 2, x * CELL + 8 : (x + 1) * CELL - 8
            ].all()


@pytest.mark.parametrize("cell", [(0, 0), (3, 7), (10, 13), (11, 9)], ids=str)
def test_each_number_lies_inside_its_cell_in_its_middle_at_its_foot(cell):
    x, y = cell
    box = YELLOW[y * CELL : (y + 1) * CELL, x * CELL : (x + 1) * CELL]
    rows, columns = np.nonzero(box)
    assert rows.size > 20
    # Clear of the cell's borders on every side.
    assert columns.min() > 2 and columns.max() < CELL - 3 and rows.max() < CELL - 3
    # Its middle where a figure on the cell has its feet (FOOT_IN_CELL).
    middle = (rows.min() + rows.max()) / 2 / CELL
    across = (columns.min() + columns.max()) / 2 / CELL
    assert abs(middle - sweep.FOOT_IN_CELL) < 0.04, middle
    assert abs(across - 0.5) < 0.04, across


def test_no_number_crosses_into_another_cell():
    """Every number's pixels are in the band at its own cell's foot."""
    rows, _ = np.nonzero(YELLOW)
    within = (rows % CELL) / CELL
    assert within.min() > 0.6 and within.max() < 0.98


@pytest.mark.parametrize(
    ("columns", "found"),
    [
        (20, [range(0, 20)]),
        (40, [range(0, 40)]),
        (41, [range(0, 22), range(20, 41)]),
        (42, [range(0, 22), range(20, 42)]),
        (80, [range(0, 28), range(26, 54), range(52, 80)]),
    ],
)
def test_a_scene_wider_than_forty_cells_is_written_in_parts_that_share_two_columns(columns, found):
    parts = sweep.parts(columns)
    assert parts == found
    for one, other in zip(parts, parts[1:], strict=False):
        assert one.stop - other.start == 2
    assert all(len(part) <= sweep.WIDEST for part in parts)


def test_the_shed_s_sheets_are_its_whole_picture_at_its_cell(tmp_path):
    written = sweep.review_sheets("the-broom-shed", tmp_path)
    names = sorted(path.name for path in written)
    assert names == sorted(
        f"the-broom-shed-{name}.png"
        for name in (
            "cells-even-rows",
            "cells-odd-rows",
            "masks",
            "things-brooms",
            "things-row-5-hung",
            "things-row-5-bare",
            "things-rows-6-9",
            "things-rows-8-10",
        )
    )
    for path in written:
        assert Image.open(path).size == (20 * CELL, 15 * CELL)
    assert CELL >= 64


def test_a_passage_is_walked_both_ways_facing_as_the_familiar_goes():
    """The small cells a chain, walked in from its lowest end and out again, each facing
    the next cell, the last as it came (D282)."""
    trench = [(10, 12), (10, 11), (10, 10), (10, 9), (10, 8), (11, 8), (12, 8), (13, 8), (13, 7)]
    ways = sweep.passage_ways(trench)
    assert ways[(10, 12)] == ("up", "down")
    assert ways[(10, 8)] == ("right", "left")
    assert ways[(12, 8)] == ("right", "left")
    assert ways[(13, 8)] == ("up", "down")
    assert ways[(13, 7)] == ("up", "down")
    assert sweep.passage_ways([(4, 4)]) == {(4, 4): ("down", "down")}
