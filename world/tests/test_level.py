import json

import kydux_world
import pytest
from kydux_world.level import GoalSpec, Level, LevelError, Position

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
