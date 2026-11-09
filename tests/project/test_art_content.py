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
    walks = {letter for letter, terrain in terrains.items() if terrain.get("walk")} | {"."}
    return {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char in walks}


@pytest.mark.parametrize("scene", SCENES)
def test_nothing_of_the_painting_stands_on_a_cell_walked_on(scene):
    art, masks = rows_of(scene)
    standing = [
        cell
        for cell in sorted(walked(scene))
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


@pytest.mark.parametrize("scene", SCENES)
def test_a_level_s_start_mark_things_and_friend_are_never_hidden(scene):
    art, masks = rows_of(scene)
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
            front = max(
                (part(m, art["cell"], x, y, 0.15, 0.85) for row, m in masks.items() if row > y),
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
def test_a_bed_s_pillow_side_is_the_floor_cell_nearest_its_pillow_in_front_of_it(scene):
    """Each bed's `pillow_side` (D130) is a floor cell of the row just below the bed's
    tile, the one nearest the pillow's point (art.json's `beds`)."""
    spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
    rows = (CONTENT / "scenes" / scene / "map.txt").read_text().split()
    walks = {
        letter
        for letter, terrain in {".": {"walk": True}, **spec.get("terrains", {})}.items()
        if terrain.get("walk")
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
