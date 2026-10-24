"""A level as a part of a chapter's scene (D65), the friend who stands in it (D66),
and a door an earlier level opened."""

import json

import pytest
from kydux_world.level import Level, LevelError, Position, on_scene, scene_rows
from kydux_world.run import run_code

SCENE = ["#######", "#.....#", "#.###.#", "#.....#", "#######"]


def level_on(tmp_path, data, rows=SCENE):
    scenes = tmp_path / "content" / "scenes" / "yard"
    scenes.mkdir(parents=True)
    (scenes / "map.txt").write_text("\n".join(rows) + "\n", encoding="utf-8")
    directory = tmp_path / "content" / "levels" / data["id"]
    directory.mkdir(parents=True)
    (directory / "level.json").write_text(json.dumps(data), encoding="utf-8")
    return Level.from_directory(directory)


def part(**change):
    data = {
        "id": "a-part",
        "scene": "yard",
        "start": [1, 1],
        "end": [5, 1],
        "goals": [{"kind": "reach", "marker": "E"}],
        "api": ["wizard.move_right", "wizard.move_down"],
    }
    data.update(change)
    return data


def test_a_level_on_a_scene_has_the_scene_s_map_with_its_start_and_end(tmp_path):
    level = level_on(tmp_path, part())
    assert (level.width, level.height) == (7, 5)
    assert level.start == Position(1, 1)
    assert level.markers == {"E": Position(5, 1)}
    assert run_code(level, "wizard.move_right(4)\n").status == "won"


def test_a_level_on_a_scene_places_its_things_and_actors_at_their_tiles(tmp_path):
    level = level_on(
        tmp_path,
        part(
            things=[{"kind": "key", "id": "key", "at": [3, 3]}],
            actors=[{"kind": "friend", "id": "nuri", "at": [1, 3]}],
        ),
    )
    assert level.things[0].position == Position(3, 3)
    assert level.actors[0].position == Position(1, 3)


@pytest.mark.parametrize(
    ("change", "says"),
    [
        ({"start": [3, 2]}, "not floor"),
        ({"end": [0, 0]}, "not floor"),
        ({"start": "1,1"}, r"must be \[x, y\]"),
        ({"map": SCENE}, "a map or a scene"),
        ({"scene": "the-moon"}, "no scene"),
    ],
)
def test_a_level_badly_placed_on_its_scene_says_why(tmp_path, change, says):
    with pytest.raises(LevelError, match=says):
        level_on(tmp_path, part(**change))


def test_a_scene_holds_only_walls_floor_and_shelves(tmp_path):
    with pytest.raises(LevelError, match=r"only #, \. and ="):
        level_on(tmp_path, part(), rows=["####", "#.S#", "####"])


def test_a_level_on_a_scene_is_read_from_its_directory_only():
    with pytest.raises(LevelError, match="read with its scene"):
        Level.from_dict(part())


def test_on_scene_gives_the_level_json_the_page_reads(tmp_path):
    (tmp_path / "yard").mkdir()
    (tmp_path / "yard" / "map.txt").write_text("\n".join(SCENE), encoding="utf-8")
    built = on_scene(part(), scene_rows(tmp_path, part()))
    assert built["map"][1] == "#S...E#"
    assert "scene" not in built and "start" not in built and "end" not in built


def friend_level(tmp_path):
    return level_on(tmp_path, part(actors=[{"kind": "friend", "id": "nuri", "at": [3, 1]}]))


def test_a_friend_looks_at_the_wizard_and_stands_still(tmp_path):
    level = friend_level(tmp_path)
    assert level.actors[0].facing == "left"
    result = run_code(level, "wizard.move_down(2)\nwizard.move_right(4)\n")
    assert not [e for e in result.events if e.actor == "nuri"]


def test_a_friend_is_walked_round_not_through(tmp_path):
    level = friend_level(tmp_path)
    result = run_code(level, "wizard.move_right(4)\n")
    bump = [e for e in result.events if e.kind == "bump"]
    assert bump and bump[0].data == {"at": [2, 1], "facing": "right", "by": "friend", "id": "nuri"}
    assert result.status != "won"
    round_it = "wizard.move_down(2)\nwizard.move_right(4)\nwizard.move_up(2)\n"
    assert run_code(level, round_it).status == "won"


def test_a_friend_never_walks_a_patrol():
    with pytest.raises(LevelError, match="a friend, who stands still"):
        Level.from_dict(
            {
                "id": "x",
                "map": ["#####", "#S..#", "#####"],
                "actors": [{"kind": "friend", "id": "nuri", "at": [2, 1], "patrol": [[3, 1]]}],
            }
        )


def test_a_door_an_earlier_level_opened_is_open_from_the_start():
    data = {
        "id": "x",
        "map": ["#####", "#S.E#", "#####"],
        "things": [
            {"kind": "door", "id": "gate", "at": [2, 1], "password": "ambrel", "open": True}
        ],
        "goals": [{"kind": "reach", "marker": "E"}],
        "api": ["wizard.move_right"],
    }
    assert run_code(Level.from_dict(data), "wizard.move_right(2)\n").status == "won"
    data["things"][0] = {"kind": "door", "id": "gate", "at": [2, 1], "locked": True, "open": True}
    with pytest.raises(LevelError, match="neither locked nor sealed"):
        Level.from_dict(data)
