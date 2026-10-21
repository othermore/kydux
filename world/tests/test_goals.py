import pytest
from kydux_world.goals import GoalResult, make_goal
from kydux_world.level import GoalSpec, Level, LevelError
from kydux_world.run import run_code
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
        "failed": False,
        "failed_at_tick": None,
        "bonus": False,
    }


# Every kind of goal, and bonus goals.

ROOMS = {
    "id": "rooms",
    "map": ["##########", "#S...K...#", "#######D##", "#......E.#", "##########"],
    "things": [
        {"kind": "key", "id": "key", "marker": "K", "opens": "door"},
        {"kind": "door", "id": "door", "marker": "D", "locked": True},
    ],
}

SOLVES_ROOMS = "\n".join(
    [
        "wizard.move_right(4)",
        "wizard.pick_up()",
        "wizard.move_right(2)",
        "door.open()",
        "wizard.move_down(2)",
    ]
)


def rooms(*goals, **extra):
    return Level.from_dict({**ROOMS, "goals": list(goals), **extra})


def test_collect_by_id():
    result = run_code(
        rooms({"kind": "collect", "id": "key"}), "wizard.move_right(4)\nwizard.pick_up()"
    )
    assert result.status == "won"
    assert result.goals[0].met_at_tick == 5


def test_open_is_met_when_the_door_opens():
    result = run_code(rooms({"kind": "open", "id": "door"}), SOLVES_ROOMS)
    assert result.status == "won"
    assert result.goals[0].met_at_tick == 8


def test_say_is_met_word_for_word():
    level = rooms({"kind": "say", "text": "Open"})
    assert run_code(level, "wizard.say('Open')").status == "won"
    assert run_code(level, "wizard.say('open')").status == "incomplete"


def test_lines_under_counts_lines_that_do_something():
    level = rooms(
        {"kind": "reach", "marker": "E"}, {"kind": "lines_under", "lines": 6, "bonus": True}
    )
    short = run_code(level, "# A comment\n\n" + SOLVES_ROOMS)
    assert short.status == "won"
    assert [g.met for g in short.goals] == [True, True]
    assert short.goals[1].met_at_tick == 0
    long = run_code(level, SOLVES_ROOMS + "\nwizard.say('done')")
    assert long.status == "won", "a bonus goal is not needed to win"
    assert [g.met for g in long.goals] == [True, False]
    assert long.goals[1].bonus


def test_a_goal_that_is_not_met_leaves_the_run_incomplete():
    result = run_code(rooms({"kind": "reach", "marker": "E"}), "wizard.move_right()")
    assert result.status == "incomplete"


HALL = {
    "id": "hall",
    "map": ["#########", "#S......#", "#########"],
    "actors": [{"kind": "teacher", "id": "teacher", "at": [7, 1], "facing": "left", "sight": 3}],
    "goals": [{"kind": "reach", "at": [3, 1]}, {"kind": "not_seen_by", "id": "teacher"}],
}


def test_not_seen_by_is_met_at_the_end_of_a_run_the_actor_never_caught_the_wizard_in():
    result = run_code(Level.from_dict(HALL), "wizard.move_right(2)")
    assert result.status == "won"
    assert result.goals[1].met and result.goals[1].met_at_tick == 2


def test_not_seen_by_fails_when_the_actor_catches_the_wizard_and_the_run_is_caught():
    result = run_code(Level.from_dict(HALL), "wizard.move_right(5)")
    assert result.status == "caught"
    assert result.goals[1].failed and result.goals[1].failed_at_tick == 3
    assert not result.goals[1].met
    assert result.events[-1].kind == "seen"


OWN = """
class Hops:
    def __init__(self, spec, level):
        self.hops = spec.params["hops"]

    def check(self, world):
        return sum(1 for e in world.events if e.kind == "move") >= self.hops

GOALS = {"hops": Hops}
"""


def test_a_level_s_own_goals_come_from_its_goals_py():
    level = Level.from_dict(
        {
            "id": "own",
            "map": ["S...."],
            "own_goals": True,
            "goals_source": OWN,
            "goals": [{"kind": "hops", "hops": 3}],
        }
    )
    assert run_code(level, "wizard.move_right(3)").status == "won"
    assert run_code(level, "wizard.move_right(2)").status == "incomplete"


@pytest.mark.parametrize(
    ("goal", "says"),
    [
        ({"kind": "collect"}, "an id, or `of` a kind"),
        ({"kind": "collect", "id": "gem"}, "no such thing"),
        ({"kind": "open", "id": "key"}, "no such thing"),
        ({"kind": "say"}, "a text"),
        ({"kind": "not_seen_by", "id": "ghost"}, "no actor"),
        ({"kind": "lines_under", "lines": 0}, "whole number"),
    ],
)
def test_a_goal_that_cannot_be_checked_names_its_fault(goal, says):
    with pytest.raises(LevelError, match=says):
        World(rooms(goal))
