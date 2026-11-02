"""The art tools of the game (D72, D76): cutting a generated sheet into pieces,
naming pieces by the joins they show, the prompt files, the soft key and the
walking sheets, a painting's grid and its cells, its things cut out and exported,
and the figures' looks; every service faked."""

import json
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools" / "art"))
import cut  # noqa: E402
import generate  # noqa: E402
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


def test_a_scene_s_own_thresholds_are_used_and_the_rest_are_the_field_s():
    # A grey-blue night lawn is no ground by the field's colours, and is by a
    # scene's that says so.
    lawn = np.full((4, 4, 3), (70, 90, 130), dtype=np.uint8)
    assert not image_first.groundlike(lawn).any()
    night = image_first.thresholds({"grass": {"hue": [200, 240], "value": 0.3}})
    assert night["grass"]["saturation"] == image_first.THRESHOLDS["grass"]["saturation"]
    assert night["outline"] == image_first.THRESHOLDS["outline"]
    assert image_first.groundlike(lawn, night).all()


def test_every_scene_s_settings_name_its_pictures_and_its_things():
    for name in export_scene.scenes():
        settings = scene_settings.settings(name)
        assert {"folder", "edits", "painting", "grid", "ground"} <= set(settings.data["sources"])
        for thing in settings.things.values():
            assert len(thing["box"]) == 4 and isinstance(thing["row"], int)
            # A static thing is cut against an edit without it, or by its mask (D89):
            # Gemini's magenta round it or round what it is cut round, a polygon,
            # its pale stone or its box.
            masks = ("marked", "unmarked", "polygon", "pale", "box")
            assert thing["states"] and ("without" in thing or thing.get("mask") in masks)
        assert settings.map.is_file(), name


def test_the_strongest_differences_from_the_ground_are_kept_in_the_mask():
    # A pixel a hundred levels from its ground on every channel: tripled in its own
    # bytes it would wrap round below the threshold and be lost.
    painting = np.full((12, 12, 3), 200, dtype=np.uint8)
    ground = painting.copy()
    painting[3:9, 3:9] = 100
    assert image_first.difference(painting, ground)[6, 6]


def test_what_hangs_from_its_foot_is_held_and_a_patch_with_lawn_below_it_is_not():
    # A crown from row 0 down to its foot's row (2), and a shadow on row 0 with a
    # pixel of lawn under it, both given row 2.
    things = np.zeros((6, 4), dtype=bool)
    things[0:6, 0] = True
    things[0, 2] = True
    things[2:6, 3] = True
    own = np.repeat((np.arange(6) // 2)[:, None], 4, axis=1)
    depth = np.full((6, 4), 2, dtype=np.int16)
    held = image_first.held(things, depth, own)
    assert held[0, 0] and held[4, 3]
    assert not held[0, 2]
    # A slanting way down holds too.
    slant = np.zeros((6, 4), dtype=bool)
    slant[0, 0] = slant[1, 1] = slant[2, 2] = slant[3, 2] = slant[4, 2] = True
    assert image_first.held(slant, depth, own)[0, 0]


def test_a_value_spreads_into_the_pixels_allowed_next_to_it_and_no_further():
    seed = np.full((1, 6), -1, dtype=np.int16)
    seed[0, 0] = 7
    allowed = np.array([[False, True, True, False, True, True]])
    assert image_first.spread(seed, allowed, 10).tolist() == [[7, 7, 7, -1, -1, -1]]


def test_a_crown_s_sunlit_leaves_inside_its_outline_are_of_it():
    # A ring of dark outline, the crown's cut-out filling its lower half, and in its
    # upper half leaves coloured as the lawn outside it.
    # Far from the picture's edges, which close a crown in as its outline would.
    painting = np.full((400, 400, 3), (150, 190, 70), dtype=np.uint8)
    yy, xx = np.mgrid[:400, :400]
    away = np.hypot(yy - 200, xx - 200)
    ring = np.abs(away - 120) < 4
    painting[ring] = (20, 25, 15)
    crown = (away < 117) & (yy >= 200)
    sunlit = image_first.outlined(ring | crown, crown, painting)
    assert sunlit[140, 200] and not sunlit[20, 20] and not sunlit[250, 200]


def test_a_band_at_a_box_s_edge_goes_on_as_inside_it_as_far_as_an_outline():
    inside = np.zeros((3, 10), dtype=bool)
    inside[:, 4] = True
    band = np.zeros_like(inside)
    band[:, :4] = True
    dark = np.zeros_like(inside)
    dark[1, 2] = True
    reached = image_first.reached(inside, band, dark, 4)
    assert reached[0].tolist()[:4] == [True] * 4
    assert reached[1].tolist()[:4] == [False, False, True, True]


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


import export_scene  # noqa: E402
import scene_settings  # noqa: E402
import sweep  # noqa: E402

SCENE_ART = generate.REPO / "content" / "art" / "scenes"


def scene_ids() -> list:
    """Every scene with settings (D82), each skipped with its reason while it is
    not exported."""
    return [
        pytest.param(
            name,
            marks=pytest.mark.skipif(
                not (SCENE_ART / name / "art.json").is_file(), reason=f"{name} is not exported"
            ),
        )
        for name in export_scene.scenes()
    ]


FIGURES = generate.REPO / "content" / "art" / "figures"


def test_a_thing_is_emptied_below_its_own_row():
    alpha = np.ones((300, 10), dtype=np.float32)
    # An image whose top is at 100 px, of a thing on row 1 of 96-pixel cells:
    # its own row ends at 192, so 92 rows of it stay.
    out = export_scene.clip_below(alpha, 1, 100, cell=96)
    assert out[:92].all() and not out[92:].any()


def test_a_mask_keeps_its_large_pieces_and_drops_the_scraps():
    mask = np.zeros((80, 80), dtype=bool)
    mask[10:50, 10:50] = True
    mask[70:73, 70:73] = True
    kept = export_scene.kept(mask, 0.2)
    assert kept[20, 20] and not kept[71, 71]


def drawn_disc(size: int = 120, radius: int = 34, line: int = 5) -> np.ndarray:
    """A painted thing as Kydux's art draws it: a brown disc with a dark outline all
    round, on lit grass."""
    yy, xx = np.mgrid[:size, :size]
    distance = np.hypot(yy - size / 2, xx - size / 2)
    picture = np.zeros((size, size, 3), dtype=np.uint8)
    picture[:] = (150, 200, 70)
    picture[distance < radius + line] = (20, 15, 10)
    picture[distance < radius] = (130, 80, 40)
    return picture


def test_a_mask_s_edge_is_moved_onto_its_thing_s_outline():
    picture = drawn_disc()
    yy, xx = np.mgrid[:120, :120]
    distance = np.hypot(yy - 60, xx - 60)
    thing = distance < 39
    # Too far on the left, onto the grass; too short on the right, the outline left out.
    rough = (distance < 33) | ((distance < 46) & (xx < 60))
    edged = image_first.snapped(rough, picture, 96)
    assert not (edged & ~thing).any()
    assert (edged & thing).sum() >= 0.99 * thing.sum()


def test_a_quilt_takes_its_sheet_s_line_and_not_the_pillow_s_beside_it():
    picture = np.full((100, 80, 3), (230, 220, 210), dtype=np.uint8)
    ink = (25, 20, 30)
    picture[10:91, 50:54] = ink  # the sheet's edge
    picture[10:91, 60:64] = ink  # the pillow's, beside it
    picture[40:46, 54:60] = ink  # where the two lines touch
    picture[10:91, 30:33] = ink  # the line between the sheet and the quilt
    marked = np.zeros((100, 80), dtype=bool)
    marked[10:91, 10:50] = True
    marked[60:81, 46:50] = False  # Gemini's magenta short of the sheet's line
    marked[10:91, 30:33] = False
    edged = image_first.lined(marked, picture, 192)
    assert edged[10:91, 10:54].all()
    assert not edged[:, 57:].any()
    assert not edged[:10].any() and not edged[91:].any()


def test_a_wall_s_part_with_no_outline_beyond_it_is_kept_as_drawn():
    # A light stone block on a floor of its own colour, outlined but on its top.
    painting = np.full((192, 192, 3), (225, 215, 200), dtype=np.uint8)
    painting[40:150, 40:44] = painting[40:150, 148:152] = (20, 15, 10)
    painting[146:150, 40:152] = (20, 15, 10)
    grid = {"x": {"offset": 0, "spacing": 96}, "y": {"offset": 0, "spacing": 96}}
    wall = {"mask": "polygon", "polygon": [[0.45, 0.42], [1.55, 0.42], [1.55, 1.55], [0.45, 1.55]]}
    box = (30, 30, 162, 162)
    cut = export_scene.static_alpha(painting, box, wall, 96, grid=grid) > 0.5
    assert not cut[42:50, 60:130].all()
    fixed = {**wall, "fixed": [[[0.45, 0.42], [1.55, 0.42], [1.55, 0.6], [0.45, 0.6]]]}
    kept = export_scene.static_alpha(painting, box, fixed, 96, grid=grid) > 0.5
    assert kept[42:50, 60:130].all()


def test_a_thing_s_picture_without_it_may_be_its_own_box_from_another(tmp_path):
    # Beside the rare book, the edit that took it out also changed its neighbour: the
    # picture without it is the painting with the book's box from that edit.
    painting = np.zeros((200, 200, 3), dtype=np.uint8)
    painting[50:100, 50:70] = (40, 60, 160)  # the book
    painting[50:100, 70:90] = (120, 80, 40)  # its neighbour
    shelf = np.full((200, 200, 3), 30, dtype=np.uint8)
    Image.fromarray(painting).save(tmp_path / "painting.png")
    Image.fromarray(shelf).save(tmp_path / "shelf.png")

    class Edits:
        edits = tmp_path

    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    without = {"picture": "painting.png", "box": [0.5, 0.5, 0.7, 1.0], "from": "shelf.png"}
    out = export_scene.without_of(Edits, grid, {"without": without})
    assert (out[50:100, 50:70] == 30).all()
    assert (out[50:100, 70:90] == (120, 80, 40)).all()


def test_a_thing_drawn_smaller_stands_where_it_was_painted():
    sprite = np.zeros((100, 80, 4), dtype=np.uint8)
    sprite[40:90, 20:60] = (200, 50, 50, 255)
    small = export_scene.shrunk(sprite, 0.5)
    assert small.shape == sprite.shape
    ys, xs = np.nonzero(small[..., 3] > 128)
    assert abs((xs.min() + xs.max() + 1) / 2 - 40) <= 1
    assert abs(ys.max() + 1 - 90) <= 1
    assert abs((ys.max() - ys.min() + 1) - 25) <= 1


def swept(painting: np.ndarray, walked: np.ndarray, layers: list) -> tuple:
    """A drawn scene for the sweep: its painting, the cells walked on, its layers."""
    rows, columns = walked.shape
    rgba = np.dstack([painting, np.full(painting.shape[:2], 255, dtype=np.uint8)])
    scene = sweep.Scene("drawn", 96, columns, rows, walked, rgba, layers)
    still = np.zeros(painting.shape[:2], dtype=bool)
    ground = np.zeros_like(painting)
    ground[:] = (150, 200, 70)
    dark = image_first.dark_lines(painting)
    return scene, sweep.Differs(still, still, painting, ground, dark, dark)


def layer_of(painting: np.ndarray, mask: np.ndarray, row: int) -> "sweep.Layer":
    """A row's image: the painting where the mask is, as the export cuts one."""
    rgba = np.dstack([painting, mask.astype(np.uint8) * 255])
    return sweep.Layer(f"row {row}", row + 0.75, row, rgba, 0, 0)


def test_the_sweep_finds_a_cut_out_s_edge_off_its_outline():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    painting[:] = (150, 200, 70)
    yy, xx = np.mgrid[:288, :288]
    distance = np.hypot(yy - 150, xx - 144)
    painting[distance < 60] = (20, 15, 10)
    painting[distance < 54] = (130, 80, 40)
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 0] = True
    # A rock standing on row 2, a figure behind it on the cell to its left: its
    # mask runs onto the grass there.
    rough = (distance < 60) | ((xx > 60) & (xx < 96) & (yy > 110) & (yy < 190))
    scene, seen = swept(painting, walked, [layer_of(painting, rough, 2)])
    assert {(p.kind, p.cell) for p in sweep.edges(scene, seen)} == {("fringe", (0, 1))}
    exact = layer_of(painting, distance < 60, 2)
    scene, seen = swept(painting, walked, [exact])
    assert not sweep.edges(scene, seen)
    # Its outline left out on the left, under the figure.
    short = layer_of(painting, (distance < 60) & (xx > 92), 2)
    scene, seen = swept(painting, walked, [short])
    assert ("bare", (0, 1)) in {(p.kind, p.cell) for p in sweep.edges(scene, seen)}


def test_the_sweep_finds_a_thing_cut_across_a_row_round_a_figure():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    painting[:] = (150, 200, 70)
    # A rock from the middle of row 0 to the middle of row 1, outlined, its parts
    # given two rows: what is in row 1 the row below's, in front of the figure.
    painting[40:150, 100:200] = (20, 15, 10)
    painting[46:144, 106:194] = (130, 80, 40)
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 1] = True
    top = np.zeros((288, 288), dtype=bool)
    top[40:96, 100:200] = True
    bottom = np.zeros_like(top)
    bottom[96:150, 100:200] = True
    layers = [layer_of(painting, top, 0), layer_of(painting, bottom, 2)]
    scene, seen = swept(painting, walked, layers)
    assert [(p.kind, p.cell) for p in sweep.spills(scene, seen)] == [("spill", (1, 1))]
    # Cut on its outline, the bottom part a thing of its own, there is none.
    painting[94:98, 100:200] = (20, 15, 10)
    scene, seen = swept(painting, walked, layers)
    assert not sweep.spills(scene, seen)


def test_a_door_is_drawn_over_whoever_stands_in_its_doorway_and_a_wall_over_all():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    painting[:] = (150, 200, 70)
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 1] = walked[0, 1] = True
    # A door filling the middle cell, on the row the figure stands on (D95).
    door = np.zeros((288, 288), dtype=bool)
    door[96:192, 110:178] = True
    plain = layer_of(painting, door, 1)
    scene, _ = swept(painting, walked, [plain])
    assert (1, 1) not in {c.cell for c in sweep.covers(scene)}
    under = sweep.Layer("door", sweep.depth_of(1, 3, under=True), 1, plain.rgba, 0, 0, under=True)
    scene, _ = swept(painting, walked, [under])
    assert (1, 1) in {c.cell for c in sweep.covers(scene)}
    # A wall seen from above, on the scene's top row, over a figure two rows below it.
    over = sweep.Layer("wall", sweep.depth_of(0, 3, over=True), 0, plain.rgba, 0, 0, over=True)
    scene, _ = swept(painting, walked, [over])
    assert (1, 1) in {c.cell for c in sweep.covers(scene)}
    assert sweep.reach_of(scene, over) == 4


def test_a_figure_on_a_lowered_cell_is_drawn_lower():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 1] = True
    scene, _ = swept(painting, walked, [])
    scene.lowered = {(1, 1): 0.5}
    assert sweep.feet_at(scene, 1, 1) == 1 + sweep.FOOT_IN_CELL + 0.5
    assert sweep.feet_at(scene, 0, 1) == 1 + sweep.FOOT_IN_CELL


def test_a_figure_on_a_nudged_cell_is_drawn_sideways():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 1] = True
    scene, _ = swept(painting, walked, [])
    scene.nudged = {(1, 1): -0.3}
    assert sweep.middle_at(scene, 1, 1) == 1.5 - 0.3
    assert sweep.middle_at(scene, 0, 1) == 0.5


def test_a_door_swung_open_lies_on_the_row_of_its_wall():
    """An open door is its leaf swung against the wall beside its doorway (D111),
    drawn by the row its open state gives: the dormitory's on the front wall's."""
    folder = sweep.CONTENT / "art" / "scenes" / "the-dormitory"
    if not (folder / "art.json").is_file():
        return
    scene = sweep.load("the-dormitory")
    door = next(layer for layer in scene.layers if layer.name == "front_door")
    assert door.depth == sweep.depth_of(15, scene.rows) + 0.001


def test_a_figure_in_a_dark_passage_is_drawn_darker_the_deeper_head_first():
    painting = np.zeros((288, 288, 3), dtype=np.uint8)
    walked = np.ones((3, 3), dtype=bool)
    scene, _ = swept(painting, walked, [])
    scene.dark = [{"columns": [1, 1], "from": 2.8, "to": 1.8, "most": 0.9}]
    frame = np.full((40, 10, 4), 200, dtype=np.uint8)
    assert (sweep.shaded(scene, frame, 1, 2) == frame).all()
    assert (sweep.shaded(scene, frame, 0, 0) == frame).all()
    deep = sweep.shaded(scene, frame, 1, 1)
    assert deep[..., 0].max() <= 21 and deep[-1, 0, 0] <= 21
    scene.dark[0]["to"] = 0.8
    half = sweep.shaded(scene, frame, 1, 1)
    assert half[0, 0, 0] < half[-1, 0, 0] < 200
    assert half[0, 0, 3] == 200


def standing_height(name: str) -> float:
    """How tall a figure stands in its sheet's standing frame, in cells."""
    data = json.loads((FIGURES / "figures.json").read_text())
    width, height = data["frame"]
    sheet = np.array(Image.open(FIGURES / f"{name}.webp").convert("RGBA"))
    rows = np.nonzero(sheet[:height, width : 2 * width, 3].max(axis=1) > 20)[0]
    return (rows.max() - rows.min() + 1) / data["cell"]


@pytest.mark.skipif(
    not (FIGURES / "figures.json").is_file(), reason="the figures are not exported"
)
def test_every_figure_passes_under_the_doors_it_walks_through():
    # D98: a child at most 1.15 cells, a grown-up at most 1.31 and taller than every
    # pupil who walks, and a door's opening, from the feet of a figure in its
    # doorway to the top of its arch, a tenth of a cell taller than the tallest
    # figure that walks through.
    names = json.loads((FIGURES / "figures.json").read_text())["figures"]
    children = [n for n in names if n.startswith(("wizard-", "nuri-", "teku-")) or n == "eldra"]
    grown = [n for n in names if n not in children]
    child = max(standing_height(n) for n in children)
    adult = max(standing_height(n) for n in grown)
    assert child <= 1.15 and adult <= 1.31
    # Eldra, a ghost, keeps to her nook and never walks through a door.
    walker = max(standing_height(n) for n in children if n != "eldra")
    assert min(standing_height(n) for n in grown) > walker + 0.05
    for scene in export_scene.scenes():
        for name, thing in export_scene.settings(scene).things.items():
            if "opening" in thing:
                tallest = adult if thing.get("adults") else walker
                assert thing["opening"] >= tallest + 0.1, (scene, name)


def test_a_picture_drawn_again_is_moved_part_by_part_onto_the_painting():
    import repaint

    painting = np.full((240, 480, 3), 200, dtype=np.uint8)
    painting[60:180, 60:66] = 10
    painting[60:180, 380:386] = 10
    # Gemini's picture: the left line where it is, the right one 8 pixels astray.
    drawn = np.full_like(painting, 200)
    drawn[60:180, 60:66] = 10
    drawn[60:180, 388:394] = 10
    moved = repaint.moved_locally(drawn, painting)
    assert (moved[100:140, 380:386].max(axis=2) < 80).mean() > 0.9
    assert (moved[100:140, 60:66].max(axis=2) < 80).mean() > 0.9


def test_a_fill_from_four_sides_follows_a_light_that_changes_both_ways():
    import repaint

    # A floor lit from the top left, and a door's foot left on it.
    yy, xx = np.mgrid[0:60, 0:80].astype(np.float32)
    floor = np.repeat((60 + xx + yy)[..., None], 3, axis=2).astype(np.uint8)
    stub = floor.copy()
    stub[20:40, 30:50] = (120, 60, 30)
    filled = repaint.filled(stub, [[30, 20, 50, 40]], sides=4)
    assert np.abs(filled.astype(int) - floor.astype(int)).max() <= 1
    # From two sides only, each row is blended across, as the lamp's chain is.
    across = repaint.filled(stub, [[30, 20, 50, 40]])
    assert np.abs(across.astype(int) - floor.astype(int)).max() <= 1
    assert (filled[:20] == stub[:20]).all() and (filled[40:] == stub[40:]).all()


def test_a_door_s_leaf_is_found_up_to_its_black_line_across_its_planks():
    import repaint

    crop = np.full((120, 100, 3), (150, 150, 160), dtype=np.uint8)  # the arch's stones
    crop[20:110, 20:80] = (20, 15, 10)  # the leaf's black line
    crop[24:106, 24:76] = (120, 70, 40)  # its wood
    crop[24:106, 49:51] = (60, 35, 20)  # a line between two planks
    crop[60:72, 44:56] = (40, 40, 45)  # the keyhole's plate
    leaf = repaint.leaf_of(crop, [(30, 70, 90)])
    assert leaf[24:106, 24:76].all()
    assert not leaf[:, :20].any() and not leaf[:, 81:].any() and not leaf[:19].any()


def doorway_crop(foot: str) -> np.ndarray:
    """A shut door in its arch, seen from the front: its foot on a stone threshold
    and the floor's own line under it (`"threshold"`), or on its own bottom
    outline and the floor beyond (`"outline"`)."""
    crop = np.full((100, 100, 3), (150, 150, 160), dtype=np.uint8)  # the stones
    crop[10:62, 20:80] = (20, 15, 10)  # the leaf's black line
    crop[14:58, 24:76] = (120, 70, 40)  # its wood, its foot a step higher on the left
    crop[52:58, 24:30] = (20, 15, 10)
    if foot == "threshold":
        crop[62:76] = (170, 165, 175)  # the threshold's stone
        crop[76:79] = (60, 50, 70)  # the floor's own line under it
        crop[79:] = (140, 135, 150)  # the floor beyond
    else:
        crop[14:72, 24:76] = (120, 70, 40)  # the wood down to its own bottom outline
        crop[72:76, 20:80] = (25, 15, 10)
        crop[76:] = (160, 110, 70)  # the floor beyond
    return crop


def test_the_fill_ends_on_the_floor_s_line_and_goes_through_the_leaf_s_own():
    import repaint

    # Under a threshold of stone, the line is the floor's: the fill ends on its top.
    crop = doorway_crop("threshold")
    leaf = repaint.leaf_of(crop, [(30, 70, 30)])
    grown, feet, first, own = repaint.to_foot(crop, leaf, 64)
    assert np.allclose(feet, 76, atol=1) and not own
    assert grown[50:75, first : first + len(feet)].all()
    assert not grown[77:].any() and not grown[:, :20].any() and not grown[:, 81:].any()
    # With nothing but the leaf's wood above it, the line is the closed leaf's own
    # outline: the fill goes down through it to its lower edge, even where the
    # leaf's box ends above it.
    crop = doorway_crop("outline")
    leaf = repaint.leaf_of(crop, [(30, 70, 30)])
    leaf[64:] = False
    grown, feet, first, own = repaint.to_foot(crop, leaf, 64)
    assert np.allclose(feet, 76, atol=1) and own
    assert grown[64:75, first : first + len(feet)].all() and not grown[77:].any()


def test_an_open_doorway_ends_in_a_threshold_of_the_floor_beyond():
    import repaint

    crop = doorway_crop("threshold")
    leaf = repaint.leaf_of(crop, [(30, 70, 30)])
    _, feet, first, _ = repaint.to_foot(crop, leaf, 64)
    # The floor beyond: planks running down the box, with their dark joints.
    floor = np.full((60, 40, 3), (160, 100, 60), dtype=np.uint8)
    floor[:, ::10] = (90, 50, 30)
    out = crop.copy()
    drawn, measured = repaint.threshold(out, floor, first, feet, (0, 0, 100, 100), (200, 200), 0)
    tall = round(repaint.THRESHOLD * 200)
    span = slice(first, first + len(feet))
    # Between the jambs, from the fill's foot up THRESHOLD cells, and nothing of it
    # under the foot but its lower line's soft edge.
    assert drawn[76 - tall + 3 : 74, span].all()
    assert not drawn[:, :first].any() and not drawn[:, first + len(feet) :].any()
    assert not drawn[79:].any() and (out[79:] == crop[79:]).all()
    # A board of that floor, a tenth darker than it on the whole, with a line on each
    # edge in its joints' colour.
    middle = first + len(feet) // 2
    board = out[76 - tall // 2, span].astype(float).mean()
    assert board < floor.astype(float).mean()
    assert np.allclose(measured["colour"], (90, 50, 30), atol=1)
    for edge in (76 - tall, 76):
        assert out[edge - 1 : edge + 2, middle].astype(float).mean() < board


def jambed_doorway(foot: str) -> np.ndarray:
    """A shut door in its arch, 200 pixels square, the jambs' bottom outline lower
    than the door's foot: the leaf on its own bottom outline over the floor
    (`"outline"`), or on its outline over a stone threshold and the floor's own
    line, the edge of the floor before the door (`"threshold"`); and in a corner a
    plain patch of the floor beyond, its planks' joints darker."""
    painting = np.full((200, 200, 3), (150, 150, 160), dtype=np.uint8)  # the stones
    painting[0:18, 0:40] = (100, 160, 200)  # the floor beyond
    painting[0:18, 0:40:10] = (40, 70, 90)  # its joints
    painting[20:124, 46:154] = (20, 15, 10)  # the leaf's line, its foot from 116
    painting[22:116, 48:152] = (120, 70, 40)  # its wood
    if foot == "outline":
        painting[124:, 46:154] = (160, 110, 70)  # the doorway's own floor
        jambs = 132
    else:
        painting[124:140, 46:154] = (170, 165, 175)  # a stone threshold
        painting[140:143, 46:154] = (60, 50, 70)  # the floor's own line
        painting[143:, 46:154] = (140, 135, 150)  # the floor before the door
        jambs = 146
    for side in (slice(0, 46), slice(154, 200)):
        painting[jambs : jambs + 6, side] = (20, 15, 10)  # the jamb's bottom outline
        painting[jambs + 6 :, side] = (160, 110, 70)  # the floor beyond the jamb
    return painting


def door_scene(tmp_path: Path, painting: np.ndarray, leaf_foot: float):
    """A scene of one door, its settings and pictures in tmp_path, a cell 100
    pixels each way; its doorway picture `doorway.png`, laid also into a marked
    picture, `marked.png`, the painting with a magenta patch."""
    Image.fromarray(painting).save(tmp_path / "painting.png")
    marked = painting.copy()
    marked[180:195, 180:195] = (255, 0, 255)
    Image.fromarray(marked).save(tmp_path / "marked.png")
    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    (tmp_path / "grid.json").write_text(json.dumps(grid))
    door = {
        "thing": "door",
        "seeds": [[0.6, 1.4, 0.6]],
        "floor": [0.0, 0.0, 0.4, 0.18],
        "painting": "doorway.png",
        "sill": 0.3,
        "leaf_box": [0.4, 0.1, 1.6, leaf_foot],
        "also": [str(tmp_path / "marked.png")],
    }
    data = {
        "sources": {
            "folder": str(tmp_path),
            "edits": str(tmp_path),
            "painting": "painting.png",
            "grid": "grid.json",
            "ground": "painting.png",
        },
        "things": {"door": {"box": [0.4, 0.1, 1.6, 1.6], "without": "doorway.png"}},
        "doorways": {"doors": [door]},
    }
    return scene_settings.Settings("door", data)


def test_the_threshold_reaches_the_jambs_feet_below_the_leaf_s_own_outline(tmp_path, monkeypatch):
    import repaint

    # The fill's foot is the closed leaf's own outline (116 to 124), and the jambs
    # end lower (their outline 132 to 138): the threshold's foot is on their feet,
    # over the doorway's own floor, and the fill reaches down to its top.
    painting = jambed_doorway("outline")
    scene = door_scene(tmp_path, painting, 1.1)
    monkeypatch.setattr(repaint.scene_settings, "settings", lambda _: scene)
    repaint.doorways("door")
    doorway = np.array(Image.open(tmp_path / "doorway.png").convert("RGB")).astype(int)
    tall = round(repaint.THRESHOLD * 100)
    span = slice(52, 148)
    # Nothing of the leaf's outline, nor of the floor between it and the
    # threshold: the fill, the floor beyond, bluer than any of them.
    fill = doorway[100 : 138 - tall, span]
    assert (fill[..., 2] > fill[..., 0] + 30).all()
    # The threshold's lower line on the jambs' feet, darker than its board, and
    # the painting below it.
    assert doorway[137:139, 100].mean() < doorway[138 - tall // 2, 100].mean() - 20
    assert (doorway[141:] == painting[141:]).all()
    assert (doorway[:, :46] == painting[:, :46]).all()


def test_the_threshold_ends_on_the_floor_s_line_where_the_jambs_stand_lower(tmp_path, monkeypatch):
    import repaint

    # The fill's foot is the floor's own line (140), the edge of the floor before
    # the door; the jambs end lower (152): the threshold ends on the line.
    painting = jambed_doorway("threshold")
    scene = door_scene(tmp_path, painting, 1.26)
    monkeypatch.setattr(repaint.scene_settings, "settings", lambda _: scene)
    repaint.doorways("door")
    doorway = np.array(Image.open(tmp_path / "doorway.png").convert("RGB")).astype(int)
    assert doorway[139:141, 100].mean() < doorway[136, 100].mean() - 20
    assert (doorway[143:] == painting[143:]).all()


def test_the_doorways_are_laid_on_the_untouched_copy_of_each_picture(tmp_path, monkeypatch):
    import repaint

    scene = door_scene(tmp_path, jambed_doorway("outline"), 1.1)
    monkeypatch.setattr(repaint.scene_settings, "settings", lambda _: scene)
    before = (tmp_path / "marked.png").read_bytes()
    repaint.doorways("door")
    first = (tmp_path / "marked.png").read_bytes()
    repaint.doorways("door")
    # The copy is the picture before the first run, and a second run gives the
    # same picture as the first.
    assert (tmp_path / "marked-untouched.png").read_bytes() == before
    assert (tmp_path / "marked.png").read_bytes() == first != before
    marked = np.array(Image.open(tmp_path / "marked.png").convert("RGB")).astype(int)
    assert marked[110, 100, 2] > marked[110, 100, 0] + 30
    assert (marked[185, 185] == (255, 0, 255)).all()


def test_a_doorway_s_footprint_is_every_pixel_its_fill_changed_grown(tmp_path):
    import trace

    painting = np.full((100, 100, 3), 120, dtype=np.uint8)
    Image.fromarray(painting).save(tmp_path / "painting.png")
    # The fill differs from the painting by a few levels only, and not at all in
    # a hole inside it.
    doorway = painting.copy()
    doorway[30:60, 20:70] += 3
    doorway[40:45, 40:45] = 120
    Image.fromarray(doorway).save(tmp_path / "doorway.png")
    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    (tmp_path / "grid.json").write_text(json.dumps(grid))
    data = {
        "sources": {
            "folder": str(tmp_path),
            "edits": str(tmp_path),
            "painting": "painting.png",
            "grid": "grid.json",
            "ground": "painting.png",
        },
        "things": {"door": {"box": [0.1, 0.1, 0.9, 0.9], "without": "doorway.png"}},
    }
    scene = scene_settings.Settings("door", data)
    polygon = trace.footprint(scene, "door", 7, 1.0)
    alpha = export_scene.soft_area((100, 100), grid, polygon)
    # Round the fill, 7 pixels out, the boundary's points at its pixels' middles.
    assert (alpha[24:66, 14:76] == 1).all() and 0 < alpha[23, 40] < 1
    assert not alpha[:22].any() and not alpha[68:].any()
    assert not alpha[:, :13].any() and not alpha[:, 77:].any()
    xs, ys = np.array(polygon).T
    assert np.allclose((xs.min(), xs.max(), ys.min(), ys.max()), (0.135, 0.765, 0.235, 0.665))


def test_a_picture_at_another_hour_is_measured_box_by_box_on_the_painting(tmp_path):
    import trace

    painting = np.full((120, 160, 3), 200, dtype=np.uint8)
    painting[30:32, 20:60] = 0
    painting[30:70, 20:22] = 0
    painting[40:42, 100:140] = 0
    Image.fromarray(painting).save(tmp_path / "painting.png")
    # The picture by day: lighter, its first thing in place, its second two pixels
    # right and five down.
    day = np.full((120, 160, 3), 240, dtype=np.uint8)
    day[30:32, 20:60] = 10
    day[30:70, 20:22] = 10
    day[45:47, 102:142] = 10
    Image.fromarray(day).save(tmp_path / "day.png")
    grid = {"x": {"offset": 0, "spacing": 40}, "y": {"offset": 0, "spacing": 40}}
    (tmp_path / "grid.json").write_text(json.dumps(grid))
    data = {
        "sources": {
            "folder": str(tmp_path),
            "edits": str(tmp_path),
            "painting": "painting.png",
            "grid": "grid.json",
            "ground": "painting.png",
        },
        "things": {
            "wall": {"box": [0.3, 0.5, 1.8, 2.0], "static": True},
            "door": {"box": [2.3, 0.6, 3.7, 1.6], "states": {"closed": "painting"}},
            "key": {"box": [0.3, 2.3, 0.7, 2.7], "states": {"lying": "painting"}},
        },
    }
    scene = scene_settings.Settings("hour", data)
    rows = {row["thing"]: row for row in trace.fit(scene, tmp_path / "day.png")}
    assert set(rows) == {"wall", "door"}
    assert (
        rows["wall"]["shift"] == [0, 0] and rows["wall"]["share"] == 1.0 and rows["wall"]["fits"]
    )
    assert rows["door"]["shift"] == [2, 5] and not rows["door"]["fits"]


def test_a_hole_covers_the_soft_edge_of_the_leaf_it_is_traced_from():
    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    leaf = [[0.305, 0.205], [0.605, 0.205], [0.605, 0.705], [0.305, 0.705]]
    painting = np.full((100, 100, 3), 150, dtype=np.uint8)
    wall = {"mask": "polygon", "polygon": [[0, 0], [1, 0], [1, 1], [0, 1]], "holes": [leaf]}
    alpha = export_scene.static_alpha(painting, (0, 0, 100, 100), wall, 100, None, grid)
    # Every pixel the leaf's soft edge touches, and the page's resampling reach
    # beyond it, and no further.
    soft = export_scene.soft_area((100, 100), grid, leaf)
    hole = export_scene.holed((100, 100), grid, leaf)
    assert (hole == image_first.dilated(soft > 0, export_scene.HOLE_REACH)).all()
    assert hole[50, 60 + export_scene.HOLE_REACH] and not hole[50, 61 + export_scene.HOLE_REACH]
    assert not alpha[hole].any() and alpha[90, 90] == 1


def test_a_leaf_traced_by_hand_is_its_polygon_with_an_edge_one_pixel_soft(tmp_path):
    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    leaf = [[0.2, 0.2], [0.605, 0.2], [0.605, 0.7], [0.2, 0.7]]
    alpha = export_scene.soft_area((100, 100), grid, leaf)
    assert (alpha[21:69, 21:60] == 1).all()
    assert not alpha[:19].any() and not alpha[:, 62:].any() and not alpha[71:].any()
    # The right edge falls in the middle of pixel 60: half of it is the leaf's.
    assert 0.3 < alpha[40, 60] < 0.7
    # Its state is that polygon alone, whatever the swung picture holds round it.
    swung = np.full((100, 100, 3), 90, dtype=np.uint8)
    swung[5:95, 5:95] = (200, 100, 50)
    Image.fromarray(swung).save(tmp_path / "swung.png")

    class Scene:
        edits = tmp_path

    Scene.grid = grid
    picture = {"picture": "swung.png", "without": "swung.png", "leaf": leaf}
    painting = np.zeros((100, 100, 3), dtype=np.uint8)
    thing = {"solid": True}
    _, state = export_scene.state_alpha(
        Scene, thing, picture, painting, painting, (0, 0, 99, 99), None
    )
    assert (state == alpha).all()


def test_a_closed_leaf_cut_from_the_painting_ends_at_its_doorway():
    grid = {"x": {"offset": 0, "spacing": 100}, "y": {"offset": 0, "spacing": 100}}
    painting = np.full((120, 120, 3), (150, 150, 160), dtype=np.uint8)
    painting[20:100, 30:90] = (20, 15, 10)  # the leaf's line
    painting[24:96, 34:86] = (120, 70, 40)  # its wood
    painting[50:53, 0:30] = (40, 40, 45)  # a mortar line of the wall touching it
    without = np.full_like(painting, (150, 150, 160))
    without[24:96, 34:86] = (200, 160, 110)  # the floor beyond the open doorway

    class Scene:
        edits = None

    Scene.grid = grid
    doorway = [[0.32, 0.22], [0.88, 0.22], [0.88, 0.98], [0.32, 0.98]]
    thing = {"solid": True, "snap": False, "doorway": doorway}
    _, alpha = export_scene.state_alpha(
        Scene, thing, "painting", painting, without, (0, 0, 120, 120), None
    )
    # The leaf, its line and the open doorway's whole floor are under it, and not
    # the mortar line beside it.
    inside = export_scene.soft_area(painting.shape[:2], grid, doorway)
    assert (alpha == inside).all() and (alpha[24:96, 34:86] == 1).all()
    assert not alpha[50:53, 0:30].any()


def test_the_states_sheet_has_a_row_for_each_thing_and_a_panel_for_each_state(tmp_path):
    cell = export_scene.CELL
    Image.new("RGB", (4 * cell, 4 * cell), (90, 90, 90)).save(tmp_path / "ground.webp")
    door = Image.new("RGBA", (cell, 2 * cell), (0, 0, 0, 0))
    door.paste((140, 80, 40, 255), (10, 10, cell - 10, 2 * cell - 10))
    door.save(tmp_path / "door-closed.webp")
    door.save(tmp_path / "door-open.webp")
    door.save(tmp_path / "key-lying.webp")
    Image.new("RGBA", (1, 1), (0, 0, 0, 0)).save(tmp_path / "key-taken.webp")
    art = {
        "cell": cell,
        "size": [4, 4],
        "ground": "ground.webp",
        "rows": [],
        "things": {
            "door": {
                "row": 2,
                "left": cell,
                "top": cell,
                "states": {"closed": "door-closed.webp", "open": "door-open.webp"},
            },
            "key": {
                "row": 1,
                "left": 0,
                "top": 0,
                "states": {"lying": "key-lying.webp", "taken": "key-taken.webp"},
            },
        },
    }
    (tmp_path / "art.json").write_text(json.dumps(art))

    class Scene:
        id = "drawn"
        out = tmp_path
        things = {"door": {"states": {}}, "key": {"states": {}}, "wall": {"static": True}}

    Scene.things["door"]["states"] = art["things"]["door"]["states"]
    Scene.things["key"]["states"] = art["things"]["key"]["states"]
    sheet = np.array(Image.open(export_scene.states_sheet(Scene, tmp_path)))
    # Each panel the thing's box with 0.4 cells round it, three times as large; the
    # door has the ground and its two states, the key the ground and the state drawn.
    panel = (cell + 2 * round(export_scene.STATES_MARGIN * cell)) * 3
    label = export_scene.STATES_LABEL
    tall = (2 * cell + 2 * round(export_scene.STATES_MARGIN * cell)) * 3
    assert sheet.shape[0] == (tall + label) * 2
    assert sheet.shape[1] == 3 * panel + 2 * label
    magenta = (sheet == export_scene.STATES_EDGE[:3]).all(axis=2)
    # The ground's panel has no edge; each state's has its edge.
    assert not magenta[label : label + tall, :panel].any()
    assert magenta[label : label + tall, panel + label : 2 * panel + label].any()
    assert magenta[label : label + tall, 2 * panel + 2 * label :].any()


@pytest.mark.skipif(
    not (SCENE_ART / "the-dormitory" / "art.json").is_file(),
    reason="the-dormitory is not exported",
)
def test_the_doors_sheet_has_a_numbered_panel_for_each_state_and_none_for_the_ground():
    settings = export_scene.settings("the-dormitory")
    art = json.loads((settings.out / "art.json").read_text())
    states = [
        f"{name} {state}"
        for name, thing in settings.things.items()
        if not thing.get("static") and thing.get("states")
        for state in art["things"][name]["states"]
    ]
    panels = export_scene.door_panels(settings)
    assert [label for label, _ in panels] == [f"{n}. {s}" for n, s in enumerate(states, 1)]
    # The door is drawn among the scene's rows: shut, its panel differs from open.
    shut, open_ = (np.array(panel) for _, panel in panels[:2])
    assert shut.shape == open_.shape and (shut != open_).any()


def test_a_box_past_the_picture_s_edge_holds_what_of_it_is_in_the_picture():
    inside = export_scene.in_box((10, 10), (-3, 2, 4, 20))
    assert inside[2:, :4].all() and not inside[:, 4:].any() and not inside[:2].any()


def test_a_solid_thing_s_mask_has_its_holes_filled():
    mask = np.zeros((60, 60), dtype=bool)
    mask[10:50, 10:50] = True
    mask[25:30, 25:30] = False
    assert export_scene.filled_mask(mask)[27, 27]


@pytest.mark.parametrize("scene", scene_ids())
def test_an_exported_scene_keeps_its_contract_and_nothing_reaches_below_its_row(scene):
    folder = SCENE_ART / scene
    art = json.loads((folder / "art.json").read_text())
    cell, (columns, rows) = art["cell"], art["size"]
    ground = Image.open(folder / art["ground"])
    # The ground holds the playable area and the margin round it, if any (D83).
    left, top, right, bottom = art.get("margin", [0, 0, 0, 0])
    assert ground.size == ((columns + left + right) * cell, (rows + top + bottom) * cell)
    assert art.get("origin", [0, 0]) == [left * cell, top * cell]
    for layer in art["rows"]:
        image = Image.open(folder / layer["image"])
        # The full width, from its top down to its row's bottom edge and no lower.
        assert image.width == columns * cell
        assert layer["top"] + image.height == (layer["row"] + 1) * cell
    # A static thing is drawn into its row's image, never as a thing (D89).
    things = {k: v for k, v in export_scene.settings(scene).things.items() if not v.get("static")}
    assert set(art["things"]) == set(things)
    for name, thing in art["things"].items():
        # A thing may reach into the row below by what its settings allow it (a
        # door's threshold), and no further; a state drawn on a row of its own, a
        # door swung open against its wall (D111), no further than that row.
        reach = things[name].get("reach", 0.0)
        for state, picture in thing["states"].items():
            image = Image.open(folder / picture)
            row = thing.get("rows", {}).get(state, thing["row"])
            assert thing["top"] + image.height <= round((row + 1 + reach) * cell), name
    assert (folder / art["source"]).is_file()


@pytest.mark.parametrize("scene", scene_ids())
def test_an_exported_scene_shows_no_figure_a_problem_of_its_cut(scene):
    # Floating pixels always; the lawn and the holes where the pictures the export
    # cut the scene from are there (art/raw, kept out of the repository).
    found = sweep.problems(sweep.load(scene))
    assert not found, "; ".join(str(problem) for problem in found)


@pytest.mark.skipif(
    not (FIGURES / "figures.json").is_file(), reason="the figures are not exported"
)
def test_the_exported_figures_are_sheets_of_four_ways_and_three_frames():
    data = json.loads((FIGURES / "figures.json").read_text())
    width, height = data["frame"]
    assert data["ways"] == ["down", "left", "right", "up"] and data["frames"] == 3
    # A wizard's sheet has its four casting rows after its four walking ones, its
    # four picking-up rows, its celebrating one and its sleeping one, where
    # figures.json's rows say; a friend's has its walking rows and its sleeping
    # one, where its `sheets` say (D91).
    named = data["rows"]
    assert named == {"walk": 0, "cast": 4, "pickup": 8, "win": 12, "sleep": 13}
    wizard_rows = max(named.values()) + 1
    sheets = data.get("sheets", {})
    for name in data["figures"]:
        sheet = Image.open(FIGURES / f"{name}.webp")
        if name in sheets:
            rows = max(sheets[name].values()) + 1
        else:
            rows = wizard_rows if name.startswith("wizard-") else 4
        assert sheet.size == (3 * width, rows * height), name
        sleep = (sheets.get(name) or (named if name.startswith("wizard-") else {})).get("sleep")
        if sleep is not None:
            # The lying frame holds a figure.
            alpha = np.array(sheet.convert("RGBA"))[..., 3]
            top = sleep * height
            assert alpha[top : top + height, :width].max() > 128, (name, "sleep")
        if name.startswith("wizard-"):
            # Every act's frame holds a figure.
            alpha = np.array(sheet.convert("RGBA"))[..., 3]
            for row in range(named["pickup"], named["win"] + 1):
                for step in range(3):
                    top, left = row * height, step * width
                    assert alpha[top : top + height, left : left + width].max() > 128, (name, row)


def test_a_look_recolours_its_parts_and_keeps_the_rest():
    import figures

    frame = np.zeros((40, 20, 4), dtype=np.uint8)
    frame[2:8, 6:14] = (40, 70, 190, 255)  # the hat, blue
    frame[8:10, 4:16] = (230, 180, 40, 255)  # its band, gold
    frame[10:16, 7:13] = (233, 185, 143, 255)  # the face, skin
    frame[16:34, 5:15] = (40, 70, 190, 255)  # the robe, blue
    frame[34:38, 7:13] = (20, 20, 20, 255)  # the boots, dark
    out = figures.recolour(
        frame,
        {
            "hat": "#a85d14",
            "robe": "#d9822b",
            "band": "#ffe08a",
            "skin": "#8d5524",
            "hair": "#000000",
        },
    )
    assert tuple(out[4, 10, :3]) != tuple(frame[4, 10, :3])
    assert out[20, 10, 0] > out[20, 10, 2]  # the robe is orange now, red over blue
    assert tuple(out[36, 10]) == tuple(frame[36, 10])  # the boots are left as they are
    assert (out[..., 3] == frame[..., 3]).all()  # the outline and the shape do not move


def test_every_look_has_its_sheet_and_the_friends_theirs():
    import figures

    about = json.loads((figures.FIGURES / "figures.json").read_text())
    for look in figures.looks():
        assert f"wizard-{look}" in about["figures"]
        assert (figures.FIGURES / f"wizard-{look}.webp").is_file()
    for friend in figures.FRIENDS:
        for colours in ("a", "b"):
            assert f"{friend}-{colours}" in about["figures"]


def test_a_floating_figure_s_step_frames_have_its_dress_grown_and_swung():
    import figures

    width, height = 20, 48
    sheet = np.zeros((height * 4, width * 3, 4), dtype=np.uint8)
    for row in range(4):
        for column in range(3):
            # A figure 4 pixels wide from row 4 to row 35 of its frame.
            sheet[
                row * height + 4 : row * height + 36, column * width + 8 : column * width + 12
            ] = (
                120,
                120,
                200,
                255,
            )
    made = np.array(figures.walking(Image.fromarray(sheet), (width, height), (4, 8)))
    grow, sway = (4, 8), figures.FLOATING_SWAY

    def frame(column: int) -> np.ndarray:
        return made[:height, column * width : (column + 1) * width, 3] > 128

    def hem(alpha: np.ndarray) -> float:
        bottom = np.nonzero(alpha.any(axis=1))[0].max()
        return float(np.nonzero(alpha[bottom])[0].mean())

    standing, first, last = frame(1), frame(0), frame(2)
    lowest = [np.nonzero(f.any(axis=1))[0].max() for f in (standing, first, last)]
    # Taller than the standing frame by the growth; the hem swung left, then right.
    assert lowest[1] - lowest[0] == grow[0] and lowest[2] - lowest[0] == grow[1]
    assert hem(first) < hem(standing) - sway / 2 and hem(last) > hem(standing) + sway / 2
    # The dress's top does not move.
    assert (first[4:20] == standing[4:20]).all() and (last[4:20] == standing[4:20]).all()


@pytest.mark.skipif(
    not (FIGURES / "figures.json").is_file(), reason="the figures are not exported"
)
def test_the_figures_that_float_are_listed_for_the_page():
    import figures

    assert json.loads((FIGURES / "figures.json").read_text())["floating"] == sorted(
        figures.FLOATING
    )


def test_the_sweep_judges_an_open_leaf_on_its_own_picture():
    # The ground the scene was cut from has no leaf where the leaf is swung (D111):
    # its edge and its hinge's plate have their outlines on its own picture only.
    painting = np.full((288, 288, 3), (150, 200, 70), dtype=np.uint8)
    leaf = np.zeros((288, 288, 4), dtype=np.uint8)
    leaf[100:190, 20:90] = (20, 15, 10, 255)  # its outline
    leaf[106:184, 26:84] = (130, 80, 40, 255)  # its wood
    leaf[130:142, 20:40] = (20, 15, 10, 255)  # a hinge's plate on its edge
    walked = np.zeros((3, 3), dtype=bool)
    walked[1, 0] = True
    shut = sweep.Layer("door", 2.75, None, leaf, 0, 0)
    scene, seen = swept(painting, walked, [shut])
    assert ("fringe", (0, 1)) in {(p.kind, p.cell) for p in sweep.edges(scene, seen)}
    swung = sweep.Layer("door", 2.75, None, leaf, 0, 0, swung=True)
    scene, seen = swept(painting, walked, [swung])
    assert not sweep.edges(scene, seen)


def test_marks_writes_the_untouched_copy_of_a_picture_the_doorways_are_laid_into(
    tmp_path, monkeypatch
):
    import repaint

    painting = np.full((40, 40, 3), 120, dtype=np.uint8)
    Image.fromarray(painting).save(tmp_path / "painting.png")
    edit = painting.copy()
    edit[10:20, 10:20] = (255, 0, 255)  # Gemini's magenta on a thing
    Image.fromarray(edit).save(tmp_path / "edit.png")
    grid = {"x": {"offset": 0, "spacing": 20}, "y": {"offset": 0, "spacing": 20}}
    (tmp_path / "grid.json").write_text(json.dumps(grid))
    marked = tmp_path / "marked.png"
    # A copy kept from before, which the doorways would otherwise be laid on.
    Image.fromarray(np.zeros_like(painting)).save(repaint.untouched_copy(marked))
    data = {
        "sources": {
            "folder": str(tmp_path),
            "edits": str(tmp_path),
            "painting": "painting.png",
            "grid": "grid.json",
            "ground": "painting.png",
        },
        "marks": {
            "painting": str(marked),
            "pictures": [{"picture": "edit.png", "crop": [0, 0, 40, 40]}],
        },
        "doorways": {"doors": [{"thing": "door", "also": [str(marked)]}]},
    }
    scene = scene_settings.Settings("marked", data)
    monkeypatch.setattr(repaint.scene_settings, "settings", lambda _: scene)
    # Gemini's picture laid as it is, with no search.
    monkeypatch.setattr(
        repaint, "laid", lambda crop, kept, picture: np.array(picture).astype(np.float32)
    )
    monkeypatch.setattr(repaint, "moved_locally", lambda shown, crop: shown)
    repaint.marks("marked")
    assert (np.array(Image.open(marked).convert("RGB"))[15, 15] == (255, 0, 255)).all()
    assert repaint.untouched_copy(marked).read_bytes() == marked.read_bytes()
