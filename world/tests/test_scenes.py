"""A level as a part of a chapter's scene (D65), the friend who stands in it (D66),
and a door an earlier level opened."""

import json

import pytest
from kydux_world.level import Level, LevelError, Position, on_scene, read_scene, scene_rows
from kydux_world.run import run_code

SCENE = ["#######", "#.....#", "#.###.#", "#.....#", "#######"]


def level_on(tmp_path, data, rows=SCENE):
    scenes = tmp_path / "content" / "scenes" / "yard"
    scenes.mkdir(parents=True, exist_ok=True)
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


def test_a_scene_s_letters_are_each_a_terrain_of_its_table(tmp_path):
    with pytest.raises(LevelError, match="the letters S are no terrain"):
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


GARDEN = ["#######", "#ggfgg#", "#ppfpp#", "#ggggh#", "#######"]
GARDEN_JSON = {
    "terrains": {
        "g": {"kind": "grass", "walk": True},
        "p": {"kind": "path", "walk": True},
        "f": {"kind": "fence", "walk": False, "sight": True},
        "h": {"kind": "hedge", "walk": False, "sight": False},
    },
    "things": [{"kind": "door", "id": "gate", "at": [1, 1], "password": "ambrel"}],
    "props": [{"kind": "stone", "at": [5, 1]}],
    "rooms": {"shed": [4, 1, 5, 3]},
}


def garden_level(tmp_path, scene_json=GARDEN_JSON, **change):
    folder = tmp_path / "content" / "scenes" / "yard"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "scene.json").write_text(json.dumps(scene_json), encoding="utf-8")
    data = part(start=[1, 2], end=[5, 2], **change)
    data["api"] = ["wizard.move_right", "wizard.move_down", "wizard.move_up", "wizard.say"]
    return level_on(tmp_path, data, rows=GARDEN)


def test_a_terrain_lets_the_wizard_walk_or_not_and_sight_pass_or_not(tmp_path):
    level = garden_level(tmp_path)
    assert level.free(Position(1, 3))  # grass
    assert not level.free(Position(3, 1)) and level.clear(Position(3, 1))  # a fence
    assert not level.clear(Position(5, 3))  # a hedge
    # The fence across the path stops the wizard; round it over the grass, it wins.
    assert run_code(level, "wizard.move_right(4)\n").status != "won"
    round_it = "wizard.move_down()\nwizard.move_right(3)\nwizard.move_up()\nwizard.move_right()\n"
    assert run_code(level, round_it).status == "won"


def test_a_story_s_floor_is_to_a_level_what_it_is_with_walk_false(tmp_path):
    """D288: a terrain whose walk is "story" is read with no sight and no flight where it
    says none, and a level on the scene has, to the letter, the map it has with the
    terrain not walked."""
    told = {
        **GARDEN_JSON,
        "terrains": {
            **GARDEN_JSON["terrains"],
            "f": {"kind": "fence", "walk": "story", "sight": True},
            "h": {"kind": "hedge", "walk": "story", "fly": True},
        },
    }
    folder = tmp_path / "yard"
    folder.mkdir()
    (folder / "map.txt").write_text("\n".join(GARDEN), encoding="utf-8")
    (folder / "scene.json").write_text(json.dumps(told), encoding="utf-8")
    scene = read_scene(tmp_path, "yard")
    assert scene.terrains["f"] == {"kind": "fence", "walk": "story", "sight": True, "fly": False}
    assert scene.terrains["h"] == {"kind": "hedge", "walk": "story", "sight": False, "fly": False}
    assert not scene.walks(3, 1)
    built = on_scene(part(start=[1, 2], end=[5, 2]), scene)
    (folder / "scene.json").write_text(json.dumps(GARDEN_JSON), encoding="utf-8")
    plain = on_scene(part(start=[1, 2], end=[5, 2]), read_scene(tmp_path, "yard"))
    assert built["map"] == plain["map"]
    assert built["map"][1] == "#..=..#" and built["map"][3] == "#....##"
    assert built["walked"] == plain["walked"] == [".", "g", "p"]


def test_the_page_gets_the_scene_s_letters_kinds_and_props(tmp_path):
    folder = tmp_path / "yard"
    folder.mkdir()
    (folder / "map.txt").write_text("\n".join(GARDEN), encoding="utf-8")
    (folder / "scene.json").write_text(json.dumps(GARDEN_JSON), encoding="utf-8")
    built = on_scene(part(start=[1, 2], end=[5, 2]), read_scene(tmp_path, "yard"))
    assert built["terrain"] == GARDEN
    assert built["terrains"]["f"] == "fence"
    assert built["map"][1] == "#..=..#"
    assert built["props"] == [{"kind": "stone", "at": [5, 1]}]


def test_a_fixed_thing_is_in_every_level_in_the_state_the_level_gives_it(tmp_path):
    shut = garden_level(tmp_path)
    assert [t.id for t in shut.things] == ["gate"] and shut.things[0].password == "ambrel"
    opened = garden_level(tmp_path / "b", things=[{"id": "gate", "open": True}])
    assert opened.things[0].open and opened.things[0].password is None


def test_a_level_s_thing_without_a_kind_must_be_a_fixed_thing(tmp_path):
    with pytest.raises(LevelError, match="no fixed thing"):
        garden_level(tmp_path, things=[{"id": "wicket", "open": True}])


def test_a_dark_room_hides_only_its_own_things_and_kirra_lights_it_from_inside(tmp_path):
    scene = {**GARDEN_JSON, "things": [], "props": []}
    level = garden_level(
        tmp_path,
        scene_json=scene,
        dark=["shed"],
        spells=["kirra"],
        carrying=["wand"],
        things=[
            {"kind": "key", "id": "key", "at": [4, 3]},
            {"kind": "book", "id": "book", "at": [1, 3]},
        ],
    )
    assert (
        level.dark and Position(4, 3) in level.dark_area and Position(1, 3) not in level.dark_area
    )
    from kydux_world.world import World

    world = World(level)
    assert world.things["key"]._k_unseen() and not world.things["book"]._k_unseen()
    outside = run_code(level, 'wizard.cast("kirra")\n')
    assert not [e for e in outside.events if e.kind == "light"]
    inside = run_code(level, 'wizard.move_down()\nwizard.move_right(3)\nwizard.cast("kirra")\n')
    assert [e for e in inside.events if e.kind == "light"]


def test_a_dark_room_the_scene_has_not_is_an_error(tmp_path):
    with pytest.raises(LevelError, match="no room cellar"):
        garden_level(tmp_path, dark=["cellar"], spells=["kirra"])
