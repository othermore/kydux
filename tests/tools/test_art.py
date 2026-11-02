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
            # A static thing is cut against an edit without it, or by its mask (D89).
            assert thing["states"] and ("without" in thing or thing.get("mask") in ("pale", "box"))
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
        # door's threshold), and no further.
        reach = things[name].get("reach", 0.0)
        for state in thing["states"].values():
            image = Image.open(folder / state)
            assert thing["top"] + image.height <= round((thing["row"] + 1 + reach) * cell), name
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
