"""The art tools (D72): cutting a generated sheet into pieces, naming pieces by the
joins they show, drawing the pieces as code, the prompt files, and the contact
sheet's choice of pieces; every service faked."""

import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "art"))
import contact  # noqa: E402
import cut  # noqa: E402
import draw  # noqa: E402
import generate  # noqa: E402
import isometric  # noqa: E402
import layout  # noqa: E402
import open_scene  # noqa: E402
import sprites  # noqa: E402

MAGENTA = (255, 0, 255, 255)
GRASS = (80, 160, 70, 255)
STONE = (160, 160, 170, 255)
DIRT = (190, 150, 100, 255)


def sheet_of(cells: list[np.ndarray], gap: int = 3) -> np.ndarray:
    """Cells side by side on magenta, with magenta gaps between them."""
    size = cells[0].shape[0]
    image = np.zeros((size + 2 * gap, len(cells) * (size + gap) + gap, 4), dtype=np.uint8)
    image[...] = MAGENTA
    for index, cell in enumerate(cells):
        x = gap + index * (size + gap)
        image[gap : gap + size, x : x + size] = cell
    return image


def tile(colour, size: int = 30) -> np.ndarray:
    cell = np.zeros((size, size, 4), dtype=np.uint8)
    cell[...] = colour
    return cell


def wall_piece(mask: int, size: int = 30) -> np.ndarray:
    """Grass with a stone bar from the middle to each side in the mask."""
    cell = tile(GRASS, size)
    low, high = size // 3, size - size // 3
    cell[low:high, low:high] = STONE
    if mask & 1:
        cell[:high, low:high] = STONE
    if mask & 2:
        cell[low:high, low:] = STONE
    if mask & 4:
        cell[low:, low:high] = STONE
    if mask & 8:
        cell[low:high, :high] = STONE
    return cell


def test_key_out_makes_the_key_colour_transparent():
    image = sheet_of([tile(GRASS)])
    keyed = cut.key_out(image)
    assert keyed[0, 0, 3] == 0
    assert keyed[10, 10, 3] == 255


def test_cells_are_found_between_the_bands_of_key_colour_in_reading_order():
    image = cut.key_out(sheet_of([tile(GRASS), tile(STONE), tile(DIRT)]))
    found = cut.cells(image)
    assert len(found) == 3
    assert [box[0] for box in found] == sorted(box[0] for box in found)
    assert all(box[2] - box[0] == 30 and box[3] - box[1] == 30 for box in found)


def test_an_even_grid_splits_without_bands():
    image = np.zeros((40, 80, 4), dtype=np.uint8)
    assert cut.cells(image, grid=(4, 2))[5] == (20, 20, 40, 40)


def test_to_pixels_gives_true_pixels_of_the_cell_s_main_colour():
    cell = tile(GRASS, 48)
    cell[:24, :24] = STONE
    small = cut.to_pixels(cell, 4)
    assert small.shape == (4, 4, 4)
    assert tuple(small[0, 0]) == STONE
    assert tuple(small[3, 3]) == GRASS


def test_to_pixels_leaves_a_mostly_empty_square_transparent():
    cell = np.zeros((8, 8, 4), dtype=np.uint8)
    cell[0, 0] = STONE
    assert cut.to_pixels(cell, 2)[0, 0, 3] == 0


@pytest.mark.parametrize("mask", range(16))
def test_a_wall_piece_is_named_by_the_sides_it_reaches(mask):
    piece = cut.to_pixels(wall_piece(mask), 24)
    assert cut.mask_of(piece, "wall") == mask


def test_pieces_are_named_by_their_mask_whatever_the_order_they_came_in():
    pieces = [cut.to_pixels(wall_piece(m), 24) for m in (5, 10, 5, 15)]
    kept, names = cut.classified(pieces, "wall")
    assert names == ["wall-5", "wall-10", "wall-15"]
    assert len(kept) == 3


def test_a_corner_piece_is_named_by_the_corners_its_terrain_covers():
    piece = tile(GRASS, 24)
    piece[:12, 12:] = DIRT  # north-east
    piece[12:, :12] = DIRT  # south-west
    assert cut.corners_of(piece, "path") == 2 + 4


def test_a_sheet_and_its_atlas_place_every_piece():
    pieces = [tile(GRASS, 24), tile(STONE, 24), tile(DIRT, 24)]
    image, atlas = cut.sheet(pieces, ["a", "b", "c"], columns=2)
    assert image.size == (48, 48)
    assert atlas["frames"]["c"]["frame"] == {"x": 0, "y": 24, "w": 24, "h": 24}


def test_cut_writes_the_pieces_the_sheet_and_the_atlas(tmp_path):
    source = tmp_path / "walls.png"
    Image.fromarray(sheet_of([wall_piece(5), wall_piece(10)])).save(source)
    written = cut.cut(source, tmp_path / "pieces", size=24, classify="wall")
    assert sorted(p.name for p in written) == ["wall-10.png", "wall-5.png"]
    atlas = json.loads((tmp_path / "pieces" / "sheet.json").read_text())
    assert set(atlas["frames"]) == {"wall-5", "wall-10"}


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


def test_a_prompt_file_says_its_candidate_service_and_fields(tmp_path):
    path = tmp_path / "walls.md"
    path.write_text(
        "---\ncandidate: trial\nservice: retrodiffusion\nwidth: 32\nflag: true\n---\nA wall.\n"
    )
    fields, words = generate.read_prompt(path)
    assert fields == {"candidate": "trial", "service": "retrodiffusion", "width": 32, "flag": True}
    assert words == "A wall."


def test_a_prompt_file_without_its_service_is_refused(tmp_path):
    path = tmp_path / "walls.md"
    path.write_text("---\ncandidate: trial\n---\nA wall.\n")
    with pytest.raises(generate.ArtError, match="service"):
        generate.read_prompt(path)


def test_generate_writes_the_images_and_their_record(tmp_path):
    path = tmp_path / "grass.md"
    path.write_text("---\ncandidate: trial\nservice: gemini\nmodel: m\n---\nGrass.\n")
    png = tmp_path / "one.png"
    Image.new("RGBA", (4, 4), GRASS).save(png)
    data = png.read_bytes()

    def fake(fields, prompt):
        assert prompt == "Grass."
        return [data, data], {"tokens": 3}

    written = generate.generate(path, raw=tmp_path / "raw", services={"gemini": fake})
    assert [p.name for p in written] == ["grass.png", "grass-2.png"]
    record = json.loads((tmp_path / "raw" / "trial" / "grass.json").read_text())
    assert record["prompt"] == "Grass." and record["said"] == {"tokens": 3}
    assert record["fields"]["model"] == "m"


def test_a_service_with_no_image_is_an_error(tmp_path):
    path = tmp_path / "grass.md"
    path.write_text("---\ncandidate: trial\nservice: gemini\n---\nGrass.\n")
    with pytest.raises(generate.ArtError, match="no image"):
        generate.generate(path, raw=tmp_path, services={"gemini": lambda f, p: ([], {})})


def test_the_images_in_a_pixellab_answer_are_found_however_deep():
    import base64

    answer = {"tiles": [{"image": {"type": "base64", "base64": base64.b64encode(b"x").decode()}}]}
    assert generate._pixellab_images(answer) == [b"x"]
    assert generate._find({"a": [{"tileset_id": "t1"}]}, "tileset_id") == "t1"


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


# The painted pieces (sprites.py), the 3/4 guide (layout.guide34) and the demo.


def test_a_soft_key_makes_the_magenta_clear_and_takes_its_tint_off_an_edge():
    image = np.zeros((1, 3, 4), dtype=np.uint8)
    image[0, 0] = MAGENTA
    image[0, 1] = (200, 60, 200, 255)  # a figure's edge, half magenta
    image[0, 2] = GRASS
    keyed = sprites.soft_key(image)
    assert keyed[0, 0, 3] == 0
    assert 0 < keyed[0, 1, 3] < 255
    assert keyed[0, 1, 0] < 200 and keyed[0, 1, 2] < 200
    assert keyed[0, 2, 3] == 255


def test_a_thin_line_across_a_sheet_is_taken_out_and_a_wide_figure_is_not():
    image = np.zeros((40, 40, 4), dtype=np.uint8)
    image[10:12, :, 3] = 255  # a baseline alone
    image[25:35, 5:35, 3] = 255  # a figure wider than half the sheet
    out = sprites.without_lines(image)
    assert out[10:12, :, 3].max() == 0
    assert out[25:35, 5:35, 3].min() == 255


def test_a_regular_pattern_is_cropped_to_a_whole_number_of_its_periods():
    stripes = np.zeros((60, 60, 4), dtype=np.uint8)
    stripes[..., 3] = 255
    for x in range(0, 60, 12):
        stripes[:, x : x + 3, :3] = 255
    assert sprites.period(stripes[..., 0].astype(np.float32).mean(axis=0)) == 12
    assert sprites.periodic(stripes).shape[1] % 12 == 0


def walking_sheet(tmp_path, facing_right_in_the_middle=False):
    """Three rows of three figures on magenta; the side row's figures carry a
    mark on the side they face."""
    image = np.zeros((90, 90, 4), dtype=np.uint8)
    image[...] = MAGENTA
    for row in range(3):
        for col in range(3):
            top, left = row * 30 + 5, col * 30 + 8
            image[top : top + 20, left : left + 12] = STONE
            if row == 1:
                right = facing_right_in_the_middle and col == 1
                mark = left + 10 if right else left
                image[top : top + 4, mark : mark + 2] = DIRT
    path = tmp_path / "walk.png"
    Image.fromarray(image).save(path)
    return path


def test_a_walking_sheet_gives_four_ways_and_right_is_left_mirrored(tmp_path):
    written = sprites.figures(walking_sheet(tmp_path), tmp_path / "out", "nuri", 40)
    names = sorted(p.stem for p in written)
    assert len(names) == 12 and "nuri-right-2" in names
    left = np.array(Image.open(tmp_path / "out" / "nuri-left-1.png"))
    right = np.array(Image.open(tmp_path / "out" / "nuri-right-1.png"))
    assert left.shape[0] == 40
    assert (left[:, ::-1] == right).all()


def test_a_side_frame_drawn_the_other_way_is_mirrored_back(tmp_path):
    sheet = walking_sheet(tmp_path, facing_right_in_the_middle=True)
    sprites.figures(sheet, tmp_path / "out", "eldra", 40, side="0,1f,2")
    frames = [np.array(Image.open(tmp_path / "out" / f"eldra-left-{i}.png")) for i in range(3)]
    # Every left frame now has its mark on the left.
    for frame in frames:
        marked = cut.is_path(frame[..., :3]) & (frame[..., 3] > 200)
        columns = np.nonzero(marked.any(axis=0))[0]
        assert columns.mean() < frame.shape[1] / 2


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
    gate = demo.scene_data("the-gate", [])
    assert gate["terrains"]["h"]["kind"] == "hedge"


# The scene painted first (image-first): its grid found, its cells marked, its
# things cut out by difference with its ground.

import image_first  # noqa: E402
import map_from_image  # noqa: E402


def test_the_grid_a_painting_shows_is_found_with_its_spacing_and_offset():
    image = np.full((400, 600, 3), 90, dtype=np.uint8)
    image[np.arange(10, 400, 50)] = 140
    image[:, np.arange(20, 600, 50)] = 140
    grid = map_from_image.find_grid(Image.fromarray(image), cells=(12, 8))
    assert abs(grid["x"]["spacing"] - 50) <= 0.5 and abs(grid["y"]["spacing"] - 50) <= 0.5
    assert abs(grid["x"]["offset"] - 20) <= 1 and abs(grid["y"]["offset"] - 10) <= 1


def test_marks_become_a_scene_of_the_game(tmp_path):
    marks = tmp_path / "marks.txt"
    marks.write_text("gtg\npfp\n###\n")
    rows = map_from_image.read_marks(marks)
    written = map_from_image.scene_files(
        rows, [{"kind": "door", "id": "gate", "at": [1, 2]}], tmp_path
    )
    assert [p.name for p in written] == ["map.txt", "scene.json"]
    scene = json.loads((tmp_path / "scene.json").read_text())
    assert scene["terrains"]["t"] == {"kind": "tree", "walk": False, "sight": False}
    assert "#" not in scene["terrains"] and scene["things"][0]["id"] == "gate"
    (tmp_path / "bad.txt").write_text("gz\n")
    with pytest.raises(ValueError, match="z"):
        map_from_image.read_marks(tmp_path / "bad.txt")


def test_things_that_touch_are_numbered_together_and_holes_are_filled():
    mask = np.zeros((6, 8), dtype=bool)
    mask[1:4, 1:4] = True
    mask[2, 2] = False
    mask[1:3, 6] = True
    labels = image_first.labels(mask)
    assert labels[1, 1] == labels[3, 3] != labels[1, 6] != 0
    assert labels[2, 2] == 0 and image_first.filled(mask, 4)[2, 2]
    assert not image_first.filled(mask, 4)[5, 0]


def test_a_pixel_stands_on_the_first_cell_no_one_walks_on_below_it():
    marks = ["ggg", "ggg", "gtg", "ggg"]
    depth = image_first.feet(marks, 8, 6, 2)
    # Over the tree's trunk (row 2) and within its reach: row 2; beside it on its
    # own row too; on the row below: its own row.
    assert depth[0, 2] == 2 and depth[2, 0] == 2 and depth[6, 2] == 3


def test_the_wand_is_only_its_brown_wood_and_a_gate_all_it_is_in_its_box():
    painting = np.zeros((20, 20, 3), dtype=np.uint8)
    painting[...] = (120, 170, 60)  # grass
    painting[8:12, 4:16] = (150, 90, 40)  # wood
    mask = np.zeros((20, 20), dtype=bool)
    mask[6:14, 2:18] = True
    inside = np.zeros_like(mask)
    inside[4:16, 0:20] = True
    wand = image_first.leaf(painting, mask, "wand", inside)
    assert wand[10, 10] and not wand[7, 3]
    gate = image_first.leaf(painting, mask, "gate", inside)
    assert gate[7, 3] and not gate[2, 2]


def test_a_flat_stone_is_not_walked_on_but_a_thing_may_lie_on_it(tmp_path):
    marks = tmp_path / "marks.txt"
    marks.write_text("ggo\nggg\n", encoding="utf-8")
    rows = map_from_image.read_marks(marks)
    map_from_image.scene_files(rows, [{"kind": "wand", "id": "wand", "at": [2, 0]}], tmp_path)
    scene = json.loads((tmp_path / "scene.json").read_text())
    assert scene["terrains"]["o"] == {"kind": "stone", "walk": False, "sight": True}
    # What stands up is cut out of the painting, and the stone with it.
    assert "o" in image_first.STANDING
