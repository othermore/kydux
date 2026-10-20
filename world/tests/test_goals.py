import pytest
from kydux_world.goals import GoalResult, make_goal
from kydux_world.level import GoalSpec, Level, LevelError
from kydux_world.world import World

LEVEL = Level.from_dict(
    {"id": "goals", "map": ["S..D."], "goals": [{"kind": "reach", "marker": "D"}]}
)


def test_reach_by_marker_is_met_at_the_tick_the_wizard_arrives():
    world = World(LEVEL)
    world.wizard.move_right(2)
    assert world.met_at == {}
    world.wizard.move_right()
    assert world.met_at == {0: 3}


def test_reach_stays_met_after_the_wizard_walks_on():
    world = World(LEVEL)
    world.wizard.move_right(4)
    assert world.met_at == {0: 3}


def test_reach_by_coordinates():
    level = Level.from_dict(
        {"id": "at", "map": ["S..."], "goals": [{"kind": "reach", "at": [2, 0]}]}
    )
    world = World(level)
    world.wizard.move_right(2)
    assert world.met_at == {0: 2}


def test_a_goal_met_at_the_start_is_met_at_tick_zero():
    level = Level.from_dict(
        {"id": "zero", "map": ["S."], "goals": [{"kind": "reach", "at": [0, 0]}]}
    )
    assert World(level).met_at == {0: 0}


@pytest.mark.parametrize(
    ("spec", "says"),
    [
        (GoalSpec("fly"), "no goal of kind fly"),
        (GoalSpec("reach"), "a marker or at"),
        (GoalSpec("reach", {"at": [9, 9]}), "off the map"),
    ],
)
def test_a_goal_that_cannot_be_checked_says_why(spec, says):
    with pytest.raises(LevelError, match=says):
        make_goal(spec, LEVEL)


def test_a_goal_result_is_plain_data():
    result = GoalResult("reach", {"marker": "D"}, True, 3)
    assert result.to_dict() == {
        "kind": "reach",
        "params": {"marker": "D"},
        "met": True,
        "met_at_tick": 3,
    }
