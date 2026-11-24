"""A painted scene and the levels on it hold together (D79): nothing of the painting
stands on a cell the map lets one walk on, no level puts its start, its mark, its
things or its friend where a cut-out covers them, and an open door's leaf lies on
the cells its scene names (D125)."""

import json
import sys

import numpy as np
import pytest
from conftest import REPO
from PIL import Image

sys.path.insert(0, str(REPO / "tools" / "art"))
import export_scene  # noqa: E402

CONTENT = REPO / "content"
SCENES = sorted(p.parent.name for p in (CONTENT / "art" / "scenes").glob("*/art.json"))
#: How much of a cell's middle a cut-out may cover before the cell counts as hidden,
#: and how much of its lower half before something counts as standing on it.
HIDDEN = 0.08
STANDS = 0.2


def rows_of(scene: str) -> tuple[dict, dict[int, np.ndarray]]:
    """The scene's art, and each row's cut-outs as a mask over the whole scene."""
    folder = CONTENT / "art" / "scenes" / scene
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    cell = art["cell"]
    width, height = art["size"]
    masks = {}
    for row in art["rows"]:
        # What is drawn over whoever stands on its row, and what hangs on a wall,
        # stands on no cell (D95).
        if row.get("under") or row.get("hangs") or row.get("over"):
            continue
        image = np.array(Image.open(folder / row["image"]).convert("RGBA"))
        mask = np.zeros((height * cell, width * cell), dtype=bool)
        mask[row["top"] : row["top"] + image.shape[0], : image.shape[1]] = image[..., 3] > 128
        # A row's things and its static things are two images of the same row (D89).
        masks[row["row"]] = masks.get(row["row"], False) | mask
    return art, masks


def part(mask: np.ndarray, cell: int, x: int, y: int, top: float, bottom: float) -> float:
    """How much of a band of the cell (x, y) the mask covers, the cell's sides left out."""
    side = int(cell * 0.2)
    band = mask[
        y * cell + int(cell * top) : y * cell + int(cell * bottom),
        x * cell + side : (x + 1) * cell - side,
    ]
    return float(band.mean()) if band.size else 0.0


def walked(scene: str) -> set[tuple[int, int]]:
    rows = (CONTENT / "scenes" / scene / "map.txt").read_text(encoding="utf-8").split()
    terrains = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text(encoding="utf-8"))[
        "terrains"
    ]
    walks = {letter for letter, terrain in terrains.items() if terrain.get("walk") is True} | {"."}
    return {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char in walks}


#: The walked cells something painted stands on, by the owner's word: in the shed, the
#: barrel's cell, where a figure stands nudged to its right, in front of it (D211).
STANDS_ON = {"the-broom-shed": {(6, 5)}}


@pytest.mark.parametrize("scene", SCENES)
def test_nothing_of_the_painting_stands_on_a_cell_walked_on(scene):
    art, masks = rows_of(scene)
    standing = [
        cell
        for cell in sorted(walked(scene) - STANDS_ON.get(scene, set()))
        if cell[1] in masks and part(masks[cell[1]], art["cell"], *cell, 0.45, 1.0) > STANDS
    ]
    assert not standing, f"{scene}: something of the painting stands on {standing}"


def levels_on(scene: str) -> list[dict]:
    found = []
    for path in sorted((CONTENT / "levels").glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("scene") == scene:
            found.append(data)
    return found


def lowered(art: dict) -> dict[tuple[int, int], float]:
    """How much lower than its cell a figure is drawn there, in cells, as the page draws
    it (D105): the first range of `lowered` that names a cell is taken."""
    found: dict[tuple[int, int], float] = {}
    for part in art.get("lowered", []):
        (x0, y0), (x1, y1) = part["cells"]
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                found.setdefault((x, y), part["by"])
    return found


@pytest.mark.parametrize("scene", SCENES)
def test_a_level_s_start_mark_things_and_friend_are_never_hidden(scene):
    art, masks = rows_of(scene)
    drawn = lowered(art)
    hidden = []
    for level in levels_on(scene):
        cells = {"start": level["start"]}
        if "end" in level:
            cells["mark"] = level["end"]
        for thing in level.get("things", []):
            # A door is in its wall, a thing lying on a stone is drawn over it, and a
            # thing the level hides lies under a cut-out on purpose (D85).
            if (
                "kind" in thing
                and thing["kind"] != "door"
                and "at" in thing
                and not thing.get("hidden")
            ):
                cells[thing["id"]] = thing["at"]
        for actor in level.get("actors", []):
            # A pupil asleep lies in its bed, under its quilt (D97).
            if "asleep" not in actor:
                cells[actor["id"]] = actor["at"]
        for what, (x, y) in cells.items():
            if what in art["things"]:
                continue
            by = drawn.get((x, y), 0.0)
            front = max(
                (
                    part(m, art["cell"], x, y, 0.15 + by, 0.85 + by)
                    for row, m in masks.items()
                    if row > y
                ),
                default=0.0,
            )
            if front > HIDDEN:
                hidden.append(f"{level['id']}: its {what} at {x},{y}")
    assert not hidden, f"{scene}: hidden by a cut-out: " + "; ".join(hidden)


@pytest.mark.parametrize("scene", SCENES)
def test_every_bed_of_the_scene_has_its_pillow_and_its_quilt(scene):
    """A pupil asleep lies with its head on the bed's pillow, under its quilt (D91):
    every bed the scene holds has its place in the art, beside the bed's tile, and
    its quilt is a static row."""
    art = json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text())
    spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
    beds = {t["id"]: t["at"] for t in spec.get("things", []) if t.get("kind") == "bed"}
    places = art.get("beds", {})
    assert set(places) == set(beds), scene
    statics = {row["row"] for row in art["rows"] if row.get("static")}
    for bed, (x, y) in beds.items():
        place = places[bed]
        assert place["row"] in statics, bed
        hx, hy = place["head"]
        # The pillow lies along the bed's own row, a cell or more from its tile.
        assert abs(hy - (y + 0.5)) < 1.5 and 1 <= abs(hx - (x + 0.5)) < 4, bed
        assert place["toward"] == ("right" if hx > x + 0.5 else "left"), bed


@pytest.mark.parametrize("scene", SCENES)
def test_the_cells_an_open_leaf_lies_on_are_the_cells_its_scene_names(scene):
    """A door whose open leaf lies on cells beside its doorway names them in
    scene.json (`covers`, D125), measured on its exported picture, so that a leaf
    cut again keeps them true."""
    measured = export_scene.leaf_cells(scene)
    spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
    named = {
        thing["id"]: sorted(thing["covers"]["open"])
        for thing in spec.get("things", [])
        if "covers" in thing
    }
    assert {door: cells for door, cells in measured.items() if cells} == named, scene


def test_a_cell_an_open_leaf_only_touches_is_walked_with_the_figure_drawn_away():
    """D157: in the room of two doors, each leaf swung open toward the viewer stands with
    its foot on the corridor's row; the cell beside that foot, where the wizard walks
    from the doorway along the corridor, is not covered: a figure there is drawn 0.3 of
    a cell lower, clear of the leaf."""
    art = json.loads((CONTENT / "art" / "scenes" / "the-two-doors" / "art.json").read_text())
    measured = export_scene.leaf_measures("the-two-doors")
    for door, cell in (("left_door", [5, 10]), ("right_door", [14, 10])):
        assert cell not in measured[door]["covers"], door
        assert [*cell, "down"] in measured[door]["touches"], door
        lowered = [part for part in art["lowered"] if part["cells"] == [cell, cell]]
        assert lowered and lowered[0]["by"] == 0.3 and lowered[0]["leaf"] == door
    # The first range that names a cell is the one the page takes: the leaf's.
    first = next(part for part in art["lowered"] if part["cells"][0] == [14, 10])
    assert first.get("leaf") == "right_door"


def test_a_scene_a_morning_story_is_told_on_has_its_morning_ground():
    """A story under the morning light draws its scene's morning ground: the sky,
    the windows and the outside by day, and, where the scene is painted whole by
    morning, every row and every thing's state at that hour too (D126)."""
    scenes = set()
    for path in sorted((CONTENT / "stories").glob("*/story.json")):
        story = json.loads(path.read_text(encoding="utf-8"))
        if story.get("light") == "morning":
            scenes.add(story["scene"])
    assert scenes
    for scene in sorted(scenes):
        folder = CONTENT / "art" / "scenes" / scene
        art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
        whole = "morning" in art.get("hours", {})
        ground = {**art.get("grounds", {}), **art.get("hours", {})}.get("morning")
        assert ground and (folder / ground).is_file(), scene
        for row in art["rows"]:
            assert not whole or "morning" in row.get("hours", {}), (scene, row["image"])
            for image in row.get("hours", {}).values():
                assert (folder / image).is_file(), (scene, image)
        for name, thing in art["things"].items():
            states = thing.get("hours", {}).get("morning", {})
            assert not whole or set(states) == set(thing["states"]), (scene, name)
            for image in states.values():
                assert (folder / image).is_file(), (scene, image)


@pytest.mark.parametrize("scene", SCENES)
def test_a_figure_stepping_out_from_behind_a_thing_is_unseen_before(scene):
    """A story's figure that steps out from behind a thing (`appear` with `from`,
    D128) shows nothing of itself at the cell it comes from."""
    seen = [
        line for line in export_scene.behind_seen(scene) if not line.endswith(" 0 pixels seen")
    ]
    assert not seen, seen


@pytest.mark.parametrize("scene", SCENES)
def test_a_way_out_behind_a_cover_hides_a_standing_figure_whole(scene):
    """On every cell whose terrain says `out` (D319), no figure of the sheets, standing
    and facing any way, shows a pixel under the scene's covers."""
    seen = [line for line in export_scene.outs_seen(scene) if not line.endswith(" 0 pixels seen")]
    assert not seen, seen


@pytest.mark.parametrize("scene", SCENES)
def test_no_figure_leaves_or_comes_in_by_an_edge_with_a_painted_margin(scene):
    """A story's figure goes out by the scene's edge, or comes in by it, only on a side
    where the painting has no margin (D319, D322): past the edge there it would stand
    in sight on the margin."""
    assert not export_scene.ways_over_margins(scene)


@pytest.mark.parametrize("scene", SCENES)
def test_a_bed_s_pillow_side_is_the_floor_cell_nearest_its_pillow_in_front_of_it(scene):
    """Each bed's `pillow_side` (D130) is a floor cell of the row just below the bed's
    tile, the one nearest the pillow's point (art.json's `beds`)."""
    spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
    rows = (CONTENT / "scenes" / scene / "map.txt").read_text().split()
    walks = {
        letter
        for letter, terrain in {".": {"walk": True}, **spec.get("terrains", {})}.items()
        if terrain.get("walk") is True
    }
    beds = json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text()).get(
        "beds", {}
    )
    for bed in (t for t in spec.get("things", []) if t["kind"] == "bed" and "pillow_side" in t):
        x, y = bed["pillow_side"]
        assert y == bed["at"][1] + 1, (scene, bed["id"])
        floor = [cx for cx, letter in enumerate(rows[y]) if letter in walks]
        head = beds[bed["id"]]["head"][0]
        assert x == min(floor, key=lambda cx: abs(cx + 0.5 - head)), (scene, bed["id"])


def test_every_bed_gone_to_has_a_pillow_side():
    """A bed a level's sleep goal or a story's sleep names has the cell under its
    pillow to be gone to bed from (D130)."""
    sides = {}
    for path in (CONTENT / "scenes").glob("*/scene.json"):
        for thing in json.loads(path.read_text()).get("things", []):
            if thing["kind"] == "bed":
                sides[(path.parent.name, thing["id"])] = "pillow_side" in thing
    named = set()
    for path in (CONTENT / "levels").glob("*/level.json"):
        level = json.loads(path.read_text())
        for goal in level.get("goals", []):
            if goal["kind"] == "sleep":
                named.add((level["scene"], goal["bed"]))
    for path in (CONTENT / "stories").glob("*/story.json"):
        story = json.loads(path.read_text())
        for step in story["steps"]:
            doing = step.get("do") or []
            for action in doing if isinstance(doing, list) else [doing]:
                if "sleep" in action:
                    named.add((story["scene"], action["sleep"]))
    assert named
    assert [bed for bed in sorted(named) if not sides.get(bed)] == []


def doors_opened_by_difference(repo_root=REPO) -> list[tuple[str, str]]:
    """Every door whose open state is Gemini's picture, cut by difference (D148)."""
    found = []
    for path in sorted((repo_root / "art" / "scenes").glob("*/cut.json")):
        for name, thing in json.loads(path.read_text(encoding="utf-8"))["things"].items():
            opened = thing.get("states", {}).get("open")
            if isinstance(opened, dict) and "diff" in opened:
                found.append((path.parent.name, name))
    return found


@pytest.mark.parametrize(("scene", "door"), doors_opened_by_difference())
def test_an_open_door_is_whole_and_its_box_cuts_nothing_of_it(scene, door):
    """No leaf cut by its picture's sides or its top; only its shadow, at the foot, may
    run on to what lies below."""
    folder = REPO / "content" / "art" / "scenes" / scene
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    picture = Image.open(folder / art["things"][door]["states"]["open"]).convert("RGBA")
    alpha = np.array(picture)[..., 3]
    assert alpha.any()
    for edge in (alpha[0], alpha[:, 0], alpha[:, -1]):
        assert not edge.any(), f"{scene}: {door}'s open picture reaches its box's edge"


def test_a_scene_of_chapter_3_has_no_nudge_along_a_whole_walk():
    """D149: a figure walks its own column; only the cells round a door or an arch are
    drawn toward the opening's middle."""
    for scene in (
        "the-tunnel",
        "the-crossing",
        "the-two-doors",
        "the-three-doors",
        "the-long-round",
        "the-storeroom",
        "the-way-down",
    ):
        art = json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text())
        for part in art.get("nudged", []):
            (x0, y0), (x1, y1) = part["cells"]
            assert (x1 - x0, y1 - y0) < (1, 6), f"{scene}: {part['cells']}"


def test_every_door_of_two_cells_stands_on_floor_side_by_side():
    """D150: the scene names every cell of a doorway, and they are walked when open."""
    named = {
        "the-two-doors": {"left_door", "right_door"},
        "the-three-doors": {"door_1", "door_2", "door_3"},
        "the-storeroom": {"store_door"},
        "the-way-down": {"door"},
    }
    for scene, doors in named.items():
        spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
        floor = walked(scene)
        for thing in spec["things"]:
            if thing["id"] in doors:
                assert len(thing["cells"]) == 2
                assert all(tuple(cell) in floor for cell in thing["cells"])


def test_the_storeroom_walls_the_cells_the_owner_named_and_its_torches_stand_over_them():
    """The owner, 2026-11-08 (sprint 34): no figure stands on (3, 8), (4, 8), (5, 8), (8, 13),
    (12, 13) or (12, 14); a figure on (4, 7) is behind the arch's band, and one on (11, 13)
    behind the torch beside the store door: both are drawn over whoever stands on their
    row (`under`)."""
    floor = walked("the-storeroom")
    for cell in ((3, 8), (4, 8), (5, 8), (8, 13), (12, 13), (12, 14)):
        assert cell not in floor, cell
    assert {(4, 7), (11, 13)} <= floor
    art = json.loads((CONTENT / "art" / "scenes" / "the-storeroom" / "art.json").read_text())
    assert {7, 13} <= {row["row"] for row in art["rows"] if row.get("under")}


def test_no_one_walks_onto_the_dormitory_s_cell_under_its_open_leaf():
    """The owner, 2026-11-08: (10, 15) is not walked while the common room's door is open,
    and (9, 15), which the leaf stands over, neither (D125)."""
    spec = json.loads((CONTENT / "scenes" / "the-dormitory" / "scene.json").read_text())
    door = next(thing for thing in spec["things"] if thing["id"] == "front_door")
    assert [10, 15] in door["covers"]["open"] and [9, 15] in door["covers"]["open"]


def test_the_long_round_draws_its_figures_well_toward_the_middle_of_its_arches():
    """The owner, 2026-11-08 (sprint 34): round both arches the two columns are drawn 0.3
    of a cell toward the arch's middle, clear of its jambs, not quite between the cells."""
    art = json.loads((CONTENT / "art" / "scenes" / "the-long-round" / "art.json").read_text())
    nudged = {tuple(map(tuple, part["cells"])): part["by"] for part in art["nudged"]}
    assert nudged == {
        ((9, 0), (9, 2)): 0.3,
        ((10, 0), (10, 2)): -0.3,
        ((9, 12), (9, 14)): 0.3,
        ((10, 12), (10, 14)): -0.3,
    }


def test_the_three_doors_top_arch_is_its_stones_and_not_its_opening():
    """D181: the goal's mark on (10, 0) lies in the top arch's opening, and its ring is
    covered only where the arch's stones are painted over it. The arch's cut-out is its
    stones and their own line (`lined`), not the dark of the opening beside them: from the
    mark's middle down, along its column, the opening is the ground's."""
    folder = CONTENT / "art" / "scenes" / "the-three-doors"
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    cell = art["cell"]
    row = next(row for row in art["rows"] if row["row"] == 1)
    alpha = np.array(Image.open(folder / row["image"]).convert("RGBA"))[..., 3]
    # Column 10 is drawn toward the arch's middle from (10, 0) to (10, 4) (D149).
    nudge = next(
        part["by"]
        for part in art["nudged"]
        if part["cells"][0][0] <= 10 <= part["cells"][1][0]
        and part["cells"][0][1] <= 0 <= part["cells"][1][1]
    )
    x = round((10.5 + nudge) * cell)
    middle = round(0.5 * cell) - row["top"]
    assert (alpha[middle : middle + round(0.25 * cell), x] <= 127).all()


#: The common pencil of a painted scene's grid, as the game has it (pencil.ts).
COMMON_PENCIL = "#3b2f1e"


def luma(colour: np.ndarray) -> np.ndarray:
    return colour @ np.array([0.2126, 0.7152, 0.0722])


def own_pencils() -> list[str]:
    return [
        scene
        for scene in SCENES
        if "grid" in json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text())
    ]


def test_the_common_pencil_is_the_game_s():
    source = (REPO / "app" / "src" / "engine" / "pencil.ts").read_text(encoding="utf-8")
    assert f"const COMMON = 0x{COMMON_PENCIL[1:]};" in source


@pytest.mark.parametrize("scene", own_pencils())
def test_a_scene_s_own_pencil_is_its_settings_and_stands_out_from_its_floor(scene):
    """D337: a scene names a pencil of its own where the common one is lost on its
    floor, so its colour lies farther from the ground under the grid's lines, twice as
    far or more, than the common pencil's does."""
    folder = CONTENT / "art" / "scenes" / scene
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    settings = json.loads((REPO / "art" / "scenes" / scene / "cut.json").read_text())["grid"]
    pencil = art["grid"]
    assert pencil == {key: settings[key] for key in ("colour", "strength")}
    assert len(pencil["colour"]) == 7 and int(pencil["colour"][1:], 16) >= 0
    assert 1 <= pencil["strength"] <= 4

    cell = art["cell"]
    columns, rows = art["size"]
    left, top = art.get("origin", [0, 0])
    ground = np.array(Image.open(folder / art["ground"]).convert("RGB"), dtype=float)
    ground = ground[top : top + rows * cell, left : left + columns * cell]
    across = ground[[min(y * cell, rows * cell - 1) for y in range(rows + 1)]]
    down = ground[:, [min(x * cell, columns * cell - 1) for x in range(columns + 1)]]
    floor = np.median(luma(np.concatenate([across.reshape(-1, 3), down.reshape(-1, 3)])))

    def far(colour: str) -> float:
        rgb = np.array([int(colour[at : at + 2], 16) for at in (1, 3, 5)], dtype=float)
        return abs(float(luma(rgb)) - floor)

    assert far(pencil["colour"]) >= 2 * far(COMMON_PENCIL)
