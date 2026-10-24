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
