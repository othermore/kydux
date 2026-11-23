"""Chapter 5's two scenes hold what the page and the world read of them (D273): the
hall's three plates with their lit state, lying in the floor, and its light at sunset;
the passage's cells only a familiar walks on, its trench's, and the mouths where the
painted wall is drawn over it; and the spots someone painted into a scene speaks from
(D264)."""

import json

from conftest import REPO

CONTENT = REPO / "content"
#: The cells only a familiar walks on in the small passage, and those of them where the
#: painted wall is drawn over it (sprint-53.md 3.2).
SMALL = {
    (10, 12), (10, 11), (10, 10), (10, 9), (10, 8), (11, 8),
    (12, 8), (13, 8), (13, 7), (13, 6), (13, 5), (13, 4),
}  # fmt: skip
UNDER_THE_WALL = {(10, 12), (10, 11), (10, 10), (13, 5), (13, 4)}


def test_the_hall_s_plates_have_a_lit_state_and_the_hall_a_sunset():
    art = json.loads((CONTENT / "art" / "scenes" / "the-tower-hall" / "art.json").read_text())
    assert art["hours"] == {"sunset": "ground-sunset.webp"}
    scene = json.loads((CONTENT / "scenes" / "the-tower-hall" / "scene.json").read_text())
    plates = {thing["id"]: thing["at"] for thing in scene["things"] if thing["kind"] == "plate"}
    assert plates == {"moon": [6, 4], "sun": [13, 4], "star": [13, 10]}
    for plate in plates:
        thing = art["things"][plate]
        assert thing["lying"] is True
        assert set(thing["states"]) == {"lit"}
        assert "sunset" in thing["hours"]
    assert scene["voices"] == {"bimo": [9, 3]}


def test_the_hall_s_walked_floor_is_columns_5_to_14_rows_4_to_10_but_the_lectern():
    rows = (CONTENT / "scenes" / "the-tower-hall" / "map.txt").read_text().split()
    floor = {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char == "."}
    lectern = {(9, 4), (10, 4)}
    room = {(x, y) for x in range(5, 15) for y in range(4, 11)} - lectern
    assert floor == room | {(9, 11), (10, 11)}


def test_the_passage_s_small_cells_are_the_trench_s_and_the_wall_hides_the_mouths():
    folder = CONTENT / "scenes" / "the-tower-passage"
    scene = json.loads((folder / "scene.json").read_text())
    rows = (folder / "map.txt").read_text().split()
    small = {letter for letter, t in scene["terrains"].items() if t.get("walk") == "small"}
    found = {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char in small}
    assert found == SMALL
    assert all(scene["terrains"][letter]["kind"] == "passage" for letter in small)
    assert scene["voices"] == {"cold_voice": [8, 2]}
    settings = json.loads((REPO / "art" / "scenes" / "the-tower-passage" / "cut.json").read_text())
    assert {tuple(cell) for cell in settings["hides"]} == UNDER_THE_WALL
    # The corridor, the cell under the back stair's arch, and the room's free floor.
    floor = {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char == "."}
    corridor = {(x, y) for x in range(1, 19) for y in (13, 14)}
    room = {(x, 3) for x in range(8, 14)} | {(x, 2) for x in range(9, 12)}
    assert floor == corridor | room | {(2, 12)}


def test_the_hall_s_six_levels_and_the_passage_s_two_open_with_the_wizard_facing_up():
    """D286: the wizard stands still before the circle, or under the passage's mouth."""
    hall = ["the-circle", "the-name-and-the-colour", "one-line-in-the-book", "the-slate"]
    hall += ["out-of-the-circle", "orlas-orders"]
    for level in [*hall, "the-small-passage", "the-forgotten-room"]:
        data = json.loads((CONTENT / "levels" / level / "level.json").read_text())
        assert data["facing"] == "up", level


def test_the_passage_s_story_floor_is_its_landing_its_stairs_and_the_room_s_front():
    """D288, D307: `l`, the landing and the back stairs down to the arch, and `v`, the
    floor before the crates and the stool, are walked by a story's figures alone."""
    folder = CONTENT / "scenes" / "the-tower-passage"
    scene = json.loads((folder / "scene.json").read_text())
    assert scene["terrains"]["l"] == {"kind": "wall", "walk": "story", "sight": False}
    assert scene["terrains"]["v"] == {"kind": "furniture", "walk": "story", "sight": True}
    rows = (folder / "map.txt").read_text().split()
    told = {
        (x, y): char for y, row in enumerate(rows) for x, char in enumerate(row) if char in "lv"
    }
    landing = {(x, 3) for x in range(2, 6)} | {(2, y) for y in range(4, 12)}
    assert told == {**{cell: "l" for cell in landing}, (6, 3): "v", (7, 3): "v"}
