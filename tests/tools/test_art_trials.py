"""The art trials' scripts (D72), in tools/art/trials/: the pieces drawn as code,
the contact sheet's choice of pieces, the layout guides, the isometric and
open-pack trials, the demo page, and the interiors painted first."""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ART = Path(__file__).resolve().parents[2] / "tools" / "art"
sys.path.insert(0, str(ART))
sys.path.insert(0, str(ART / "trials"))
import contact  # noqa: E402
import cut  # noqa: E402
import draw  # noqa: E402
import isometric  # noqa: E402
import layout  # noqa: E402
import open_scene  # noqa: E402


def test_the_code_drawn_pieces_are_the_brief_s_and_join_by_construction():
    pieces = draw.all_pieces()
    for mask in range(16):
        assert f"wall-{mask}" in pieces and f"path-{mask}" in pieces
        assert pieces[f"wall-{mask}"].size == (draw.TILE, draw.TILE)
    for way in ("down", "left", "right", "up"):
        assert pieces[f"wizard-{way}-0"].size == (draw.TILE, 32)
    # A straight wall's east edge is the same column of pixels as a cross's west edge.
    straight = np.array(pieces["wall-10"])
    cross = np.array(pieces["wall-15"])
    stone = cut.is_wall(straight[:, -1, :3])
    assert stone.any()
    assert (stone == cut.is_wall(cross[:, 0, :3])).all()


def test_the_grass_repeats_without_a_seam():
    image = np.array(draw.grass()).astype(int)
    # The colours across the seam differ no more than inside the tile.
    seam = np.abs(image[:, 0] - image[:, -1]).mean()
    inside = np.abs(image[:, 1:] - image[:, :-1]).mean()
    assert seam <= inside * 1.5


def test_the_contact_sheet_picks_each_tile_s_piece_by_its_neighbours():
    rows = ["g#g", "###", "g#g"]
    assert contact.mask_at(rows, 1, 1, "#") == 15
    assert contact.mask_at(rows, 0, 1, "#") == 2
    assert contact.mask_at(rows, 1, 0, "#") == 4


def small_scene(tmp_path: Path):
    """A scene of three tiles across and three down: a wall row, grass, a path."""
    folder = tmp_path / "scenes" / "yard"
    folder.mkdir(parents=True)
    (folder / "map.txt").write_text("###\nggg\nppp\n")
    (folder / "scene.json").write_text(
        json.dumps(
            {
                "terrains": {
                    "g": {"kind": "grass", "walk": True},
                    "p": {"kind": "path", "walk": True},
                }
            }
        )
    )
    return layout.read("yard", tmp_path / "scenes")


def test_the_layout_guide_draws_each_tile_and_a_wall_s_face_at_its_foot(tmp_path):
    scene = small_scene(tmp_path)
    image, band = layout.guide(scene)
    assert image.size == (3 * layout.TILE, 3 * layout.TILE) and band == 0
    top, face = layout.COLOURS["wall"]
    assert image.getpixel((10, 5)) == top
    assert image.getpixel((10, layout.TILE - 3)) == face
    assert image.getpixel((10, layout.TILE + 10)) == layout.COLOURS["grass"][0]


def test_the_guide_is_padded_to_a_shape_with_bands_above_and_below(tmp_path):
    image, band = layout.guide(small_scene(tmp_path), (9, 16))
    assert band > 0 and image.height == 3 * layout.TILE + 2 * band
    assert image.getpixel((5, 2)) == (0, 0, 0)


def test_the_check_tints_the_tiles_no_one_walks_on(tmp_path):
    scene = small_scene(tmp_path)
    painted = Image.new("RGB", (3 * layout.TILE, 3 * layout.TILE), (0, 0, 255))
    over = layout.overlay(scene, painted, 0)
    wall = over.getpixel((20, 20))
    grass = over.getpixel((20, layout.TILE + 20))
    assert wall[0] > grass[0]


def test_a_character_sheet_s_figures_keep_their_shape(tmp_path):
    sheet = Image.new("RGBA", (200, 60), (255, 0, 255, 255))
    for index in range(4):
        sheet.paste((20, 40, 160, 255), (10 + index * 50, 10, 30 + index * 50, 50))
    figures = layout.figures(sheet, 20, smooth=False)
    assert list(figures) == ["down", "left", "right", "up"]
    assert all(f.size == (10, 20) for f in figures.values())


def test_the_isometric_projection_sends_x_down_right_and_y_down_left():
    assert isometric.screen(1, 0) == (isometric.W / 2, isometric.H / 2)
    assert isometric.screen(0, 1) == (-isometric.W / 2, isometric.H / 2)


def test_an_autotile_inside_its_terrain_takes_the_middle_quarters():
    # An XP autotile of one colour per row of quarters, so that each quarter says
    # where it came from.
    sheet = Image.new("RGBA", (96, 128))
    for qy in range(8):
        sheet.paste((qy * 30, 0, 0, 255), (0, qy * 16, 96, qy * 16 + 16))
    pack = open_scene.Pack({"tile": 32, "path": ("x.png", ("auto", (0, 0), "xp"))})
    pack.sheets["x.png"] = sheet
    inside = pack.joined("path", lambda dx, dy: True)
    # The north quarters from the region's third row of quarters (32 + 2 * 16).
    assert inside.getpixel((4, 4))[0] == 4 * 30
    alone = pack.joined("path", lambda dx, dy: False)
    assert alone.getpixel((4, 4))[0] == 2 * 30


def test_the_3_4_guide_raises_a_wall_s_top_over_the_tile_behind_it(tmp_path):
    folder = tmp_path / "yard"
    folder.mkdir()
    (folder / "map.txt").write_text("###\n#.#\n#.#\n###\n")
    scene = layout.read("yard", tmp_path)
    image, band = layout.guide34(scene)
    pixels = np.array(image)
    T, R = layout.TILE, layout.RISE
    assert band == R and image.size == (3 * T, 4 * T + R)
    top, face = layout.COLOURS["wall"]
    floor = layout.COLOURS["floor"][0]
    # The bottom row's top covers the lower RISE of the floor tile behind it.
    assert tuple(pixels[R + 3 * T - R // 2, T + T // 2]) == top
    # The floor shows above it, and the top row's face hangs at its own tile's foot.
    assert tuple(pixels[R + 2 * T + 4, T + T // 2]) == floor
    assert tuple(pixels[R + T - 4, T + T // 2]) == face


def test_the_demo_reads_the_real_scenes_and_the_levels_it_plays():
    import demo

    data = demo.scene_data("the-library", ["the-lost-book"])
    assert data["rows"][0].startswith("#")
    assert any(t["id"] == "old_book" for t in data["things"])
    assert {a["id"] for a in data["actors"]} >= {"wenna", "eldra"}
    field = demo.scene_data("the-field", [])
    assert field["terrains"]["t"]["kind"] == "tree"
    assert {t["id"] for t in field["things"]} >= {"gate", "seal_gate", "castle_door"}


import interior  # noqa: E402

CELL = interior.CELL


def test_a_bookcase_s_top_rising_into_the_cell_above_stands_on_its_row():
    marks = ["..", "k."]
    rising = np.zeros((2 * CELL, 2 * CELL), dtype=bool)
    rising[CELL - 30 : CELL, 5:15] = True  # the top, joined to the bookcase below
    rising[5:10, 5:15] = True  # a lamp high up, joined to nothing
    rising[CELL - 30 : CELL, CELL + 5 : CELL + 15] = True  # above a floor cell
    foot = interior.feet(marks, rising)
    assert foot[CELL - 10, 10] == 1 and foot[CELL - 28, 10] == 1
    assert foot[7, 10] == -1 and foot[CELL - 10, CELL + 10] == -1
    assert foot[CELL + 5, 5] == 1


def test_an_interior_is_cut_by_rows_and_what_is_picked_up_leaves_no_ghost(tmp_path):
    floor = np.full((2 * CELL, 2 * CELL, 3), 120, dtype=np.uint8)
    painting = floor.copy()
    painting[CELL:, :CELL] = (150, 90, 40)  # a bookcase on row 1
    painting[CELL - 30 : CELL, :CELL] = (170, 110, 50)  # its top, over the cell above
    without = painting.copy()
    painting[30:60, CELL + 30 : CELL + 60] = (240, 200, 40)  # a key on row 0
    for name, image in (("painting", painting), ("floor", floor), ("without", without)):
        Image.fromarray(image).save(tmp_path / f"{name}.png")
    (tmp_path / "marks.txt").write_text("..\nk.\n")
    (tmp_path / "grid.json").write_text(
        json.dumps({"x": {"spacing": CELL, "offset": 0}, "y": {"spacing": CELL, "offset": 0}})
    )
    (tmp_path / "export.json").write_text(
        json.dumps(
            {
                "painting": "painting.png",
                "floor": "floor.png",
                "source": "A test.\n",
                "things": {
                    "key": {
                        "box": [1, 0, 2, 1],
                        "row": 0,
                        "solid": True,
                        "without": "without.png",
                        "states": {"lying": "painting", "gone": None},
                    }
                },
            }
        )
    )
    out = tmp_path / "out"
    art = json.loads(interior.build(tmp_path, out).read_text())
    assert art["size"] == [2, 2] and art["cell"] == CELL
    (row,) = art["rows"]
    strip = Image.open(out / row["image"])
    # The bookcase's row, from its top in the cell above down to its own bottom edge.
    assert row["row"] == 1 and row["top"] <= CELL - 28
    assert row["top"] + strip.height == 2 * CELL
    key = art["things"]["key"]
    assert (key["left"], key["top"]) == (CELL, 0)
    lying = np.array(Image.open(out / key["states"]["lying"]))
    assert lying.shape[0] <= CELL and lying[45, 45, 3] == 255
    ground = np.array(Image.open(out / art["ground"]).convert("RGB")).astype(int)
    assert abs(ground[45, CELL + 45] - 120).max() < 12
    assert (out / art["source"]).read_text() == "A test.\n"
