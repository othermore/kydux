"""A scene's layout on its grid, drawn before it is painted (D102)."""

import importlib.util
from pathlib import Path

from PIL import Image

# Loaded from its file: another module of the suite is called layout too.
_PATH = Path(__file__).resolve().parents[2] / "tools" / "art" / "layout.py"
_SPEC = importlib.util.spec_from_file_location("art_layout", _PATH)
assert _SPEC and _SPEC.loader
layout = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(layout)

TERRAINS = {"u": {"kind": "furniture", "walk": False, "sight": True}}
ROWS = ["#####", "#.u.#", "#...#", "#####"]


def colour_at(image: Image.Image, x: int, y: int, cell: int) -> tuple[int, int, int]:
    """The colour a little inside a cell's top left corner, clear of its number."""
    return image.getpixel((x * cell + cell // 2, y * cell + cell - 6))[:3]


def test_a_layout_draws_walls_furniture_floor_and_doors_on_the_grid():
    cell = 48
    drawn = layout.draw(ROWS, TERRAINS, [(3, 2)], (5 * cell, 4 * cell))
    assert drawn.size == (5 * cell, 4 * cell)
    assert colour_at(drawn, 0, 0, cell) == layout.WALL
    assert colour_at(drawn, 1, 1, cell) == layout.FLOOR
    # The furniture is hatched: its colour and the wall's lines across it.
    hatched = {
        drawn.getpixel((2 * cell + i, cell + j))[:3] for i in range(cell) for j in range(cell)
    }
    assert layout.FURNITURE in hatched and layout.WALL in hatched
    # A door's cell is outlined.
    outline = {drawn.getpixel((3 * cell + i, 2 * cell + cell // 6 + 1))[:3] for i in range(cell)}
    assert layout.DOOR in outline


def test_a_layout_is_laid_over_a_try_at_its_size():
    shown = Image.new("RGBA", (500, 400), (10, 120, 10, 255))
    drawn = layout.draw(ROWS, TERRAINS, [], shown.size, alpha=110)
    assert drawn.size == shown.size
    # Half seen over the try: a wall's cell is the wall's colour, not wholly.
    assert drawn.getpixel((50, 50))[3] == 110


def test_a_letter_is_drawn_as_its_terrain_says():
    assert layout.kind_of("#", TERRAINS) == "wall"
    assert layout.kind_of(".", TERRAINS) == "floor"
    assert layout.kind_of("u", TERRAINS) == "furniture"
    assert layout.kind_of("x", {"x": {"walk": False, "sight": False}}) == "wall"
