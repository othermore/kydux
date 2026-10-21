import json

import kydux_world
import pytest
from kydux_world.level import ActorSpec, GoalSpec, Level, LevelError, Position, ThingSpec

CORRIDOR = {
    "id": "corridor",
    "map": ["#####", "#S.D#", "#####"],
    "goals": [{"kind": "reach", "marker": "D"}],
    "tick_limit": 50,
}


def test_the_package_has_a_version():
    assert kydux_world.__version__


def test_a_map_gives_size_walls_start_and_markers():
    level = Level.from_dict(CORRIDOR)
    assert (level.width, level.height) == (5, 3)
    assert level.start == Position(1, 1)
    assert level.markers == {"D": Position(3, 1)}
    assert Position(0, 0) in level.walls and Position(2, 1) not in level.walls
    assert len(level.walls) == 12
    assert level.goals == (GoalSpec("reach", {"marker": "D"}),)
    assert level.tick_limit == 50


def test_from_json_reads_the_same():
    assert Level.from_json(json.dumps(CORRIDOR)) == Level.from_dict(CORRIDOR)


def test_the_tick_limit_defaults_to_a_thousand():
    data = {k: v for k, v in CORRIDOR.items() if k != "tick_limit"}
    assert Level.from_dict(data).tick_limit == 1000


def test_inside():
    level = Level.from_dict(CORRIDOR)
    assert level.inside(Position(4, 2))
    assert not level.inside(Position(5, 0))
    assert not level.inside(Position(-1, 0))


@pytest.mark.parametrize(
    ("change", "says"),
    [
        ({"id": ""}, "needs an id"),
        ({"map": []}, "list of rows"),
        ({"map": ["###", "#S"]}, "as long as the first"),
        ({"map": ["#.#"]}, "exactly one S"),
        ({"map": ["SS"]}, "exactly one S"),
        ({"map": ["S?"]}, "not a map character"),
        ({"map": ["SDD"]}, "twice"),
        ({"goals": [{"kind": "reach", "marker": "X"}]}, "not on the map"),
        ({"goals": [{"marker": "D"}]}, "needs a kind"),
        ({"tick_limit": 0}, "tick_limit"),
    ],
)
def test_a_level_that_cannot_be_played_says_why(change, says):
    with pytest.raises(LevelError, match=says):
        Level.from_dict({**CORRIDOR, **change})


# Things, actors, the api and bonus goals.

ROOMS = {
    "id": "rooms",
    "map": ["##########", "#S...K...#", "#######D##", "#T.....E.#", "##########"],
    "things": [
        {"kind": "key", "id": "key", "marker": "K", "opens": "door"},
        {"kind": "door", "id": "door", "marker": "D", "locked": True},
        {"kind": "book", "id": "book", "at": [8, 1]},
    ],
    "actors": [{"kind": "teacher", "id": "teacher", "marker": "T", "patrol": [[4, 3]]}],
    "api": ["wizard.move_right", "wizard.pick_up", "door.open", "thing.position"],
    "goals": [
        {"kind": "collect", "id": "key"},
        {"kind": "lines_under", "lines": 6, "bonus": True},
    ],
}


def test_things_are_placed_by_marker_or_at():
    level = Level.from_dict(ROOMS)
    assert level.things == (
        ThingSpec("key", "key", Position(5, 1), opens="door"),
        ThingSpec("door", "door", Position(7, 2), locked=True),
        ThingSpec("book", "book", Position(8, 1)),
    )
    assert level.ids() == ["key", "door", "book", "teacher"]


def test_an_actor_s_patrol_is_every_tile_it_walks():
    (teacher,) = Level.from_dict(ROOMS).actors
    assert teacher == ActorSpec(
        "teacher",
        "teacher",
        Position(1, 3),
        "right",
        patrol=(Position(1, 3), Position(2, 3), Position(3, 3), Position(4, 3)),
    )


def test_an_actor_without_a_patrol_stands_still_facing_down():
    data = {**ROOMS, "actors": [{"kind": "teacher", "id": "teacher", "marker": "T"}]}
    (teacher,) = Level.from_dict(data).actors
    assert (teacher.patrol, teacher.facing, teacher.sight) == ((), "down", 4)


def test_bonus_goals_are_marked_and_the_api_kept():
    level = Level.from_dict(ROOMS)
    assert [goal.bonus for goal in level.goals] == [False, True]
    assert level.goals[1].params == {"lines": 6}
    assert level.api == ("wizard.move_right", "wizard.pick_up", "door.open", "thing.position")


def test_a_level_loads_from_its_directory_with_its_goals(tmp_path):
    (tmp_path / "level.json").write_text(json.dumps(CORRIDOR))
    assert Level.from_directory(tmp_path).goals_source is None
    (tmp_path / "goals.py").write_text("GOALS = {}\n")
    with pytest.raises(LevelError, match="go together"):
        Level.from_directory(tmp_path)
    (tmp_path / "level.json").write_text(json.dumps({**CORRIDOR, "own_goals": True}))
    assert Level.from_directory(tmp_path).goals_source == "GOALS = {}\n"


def _with(**change):
    return {**ROOMS, **change}


@pytest.mark.parametrize(
    ("data", "says"),
    [
        (_with(things=[{"kind": "dragon", "id": "d", "at": [2, 1]}]), "no thing of kind dragon"),
        (_with(things=[{"kind": "key", "id": "2key", "at": [2, 1]}]), "a Python name"),
        (_with(things=[{"kind": "key", "id": "class", "at": [2, 1]}]), "a Python name"),
        (_with(things=[{"kind": "key", "id": "wizard", "at": [2, 1]}]), "cannot be called wizard"),
        (_with(things=[{"kind": "key", "id": "k", "at": [0, 0]}]), "is not floor"),
        (_with(things=[{"kind": "key", "id": "k", "marker": "Q"}]), "not on the map"),
        (_with(things=[{"kind": "key", "id": "k"}]), "a marker or at"),
        (_with(things=[{"kind": "key", "id": "k", "at": [2, 1], "opens": "gate"}]), "no door"),
        (_with(things=[{"kind": "book", "id": "b", "at": [2, 1], "locked": True}]), "only a door"),
        (
            _with(
                things=[
                    {"kind": "key", "id": "same", "at": [2, 1]},
                    {"kind": "book", "id": "same", "at": [3, 1]},
                ]
            ),
            "two things or actors",
        ),
        (_with(actors=[{"kind": "ghost", "id": "g", "at": [2, 1]}]), "no actor of kind ghost"),
        (
            _with(actors=[{"kind": "teacher", "id": "t", "marker": "T", "patrol": [[4, 1]]}]),
            "straight lines",
        ),
        (
            _with(actors=[{"kind": "teacher", "id": "t", "at": [2, 1], "patrol": [[2, 3]]}]),
            "through a wall",
        ),
        (_with(actors=[{"kind": "teacher", "id": "t", "marker": "T", "facing": "n"}]), "faces"),
        (_with(actors=[{"kind": "teacher", "id": "t", "marker": "T", "sight": 0}]), "sight"),
        (_with(api=["wizard.fly"]), "which no object has"),
        (_with(api="wizard.move_right"), "a list of names"),
        (_with(goals=[{"kind": "lines_under", "lines": 3, "bonus": True}]), "not a bonus"),
        (_with(things={}), "a list of objects"),
    ],
)
def test_things_actors_and_api_that_cannot_be_played_say_why(data, says):
    with pytest.raises(LevelError, match=says):
        Level.from_dict(data)
