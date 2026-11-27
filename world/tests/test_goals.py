import pytest
from kydux_world.goals import GoalResult, make_goal
from kydux_world.level import GoalSpec, Level, LevelError
from kydux_world.run import run_code
from kydux_world.world import World

LEVEL = Level.from_dict(
    {"id": "goals", "map": ["S..D."], "goals": [{"kind": "reach", "marker": "D"}]}
)


def test_reach_by_marker_is_met_when_the_run_ends_on_it_at_the_last_tick():
    world = World(LEVEL)
    world.wizard.move_right(3)
    assert world.met_at == {}
    world.finish()
    assert world.met_at == {0: 3}


def test_reach_is_not_met_by_walking_over_the_tile_and_on():
    world = World(LEVEL)
    world.wizard.move_right(4)
    world.finish()
    assert world.met_at == {}


def test_a_reach_goal_on_the_way_is_met_by_walking_over_the_tile():
    level = Level.from_dict(
        {
            "id": "on_the_way",
            "map": ["S..D."],
            "goals": [{"kind": "reach", "marker": "D", "on_the_way": True}],
        }
    )
    world = World(level)
    world.wizard.move_right(4)
    world.finish()
    assert world.met_at == {0: 3}
    passed = run_code(level, "wizard.move_right(4)")
    assert (passed.status, passed.goals[0].met, passed.goals[0].walked_over) == (
        "won",
        True,
        False,
    )


def test_reach_by_coordinates():
    level = Level.from_dict(
        {"id": "at", "map": ["S..."], "goals": [{"kind": "reach", "at": [2, 0]}]}
    )
    world = World(level)
    world.wizard.move_right(2)
    world.finish()
    assert world.met_at == {0: 2}


def test_a_run_that_passes_the_goal_does_not_win_and_one_that_stops_on_it_does():
    assert run_code(LEVEL, "wizard.move_right(4)").status == "incomplete"
    assert run_code(LEVEL, "wizard.move_right(4)\nwizard.move_left()").status == "won"
    assert run_code(LEVEL, "wizard.move_right(3)").status == "won"


def test_a_reach_goal_walked_over_and_not_met_says_so():
    passed = run_code(LEVEL, "wizard.move_right(4)").goals[0]
    assert (passed.met, passed.walked_over) == (False, True)
    short = run_code(LEVEL, "wizard.move_right(2)").goals[0]
    assert (short.met, short.walked_over) == (False, False)
    stopped = run_code(LEVEL, "wizard.move_right(4)\nwizard.move_left()").goals[0]
    assert (stopped.met, stopped.walked_over) == (True, False)


def test_a_run_that_starts_on_the_goal_and_does_nothing_wins_at_tick_zero():
    level = Level.from_dict(
        {"id": "zero", "map": ["S."], "goals": [{"kind": "reach", "at": [0, 0]}]}
    )
    result = run_code(level, "")
    assert result.status == "won"
    assert result.goals[0].met_at_tick == 0


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
        "walked_over": False,
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


def test_ticks_under_goes_to_the_run_that_ends_in_fewer_ticks():
    # D133: of two programs that both win, the shorter earns the bonus.
    short = run_code(rooms({"kind": "reach", "marker": "E"}), SOLVES_ROOMS)
    ticks = short.ticks
    level = rooms(
        {"kind": "reach", "marker": "E"},
        {"kind": "ticks_under", "count": ticks + 1, "bonus": True},
    )
    short = run_code(level, SOLVES_ROOMS)
    assert short.status == "won" and [g.met for g in short.goals] == [True, True]
    long = run_code(level, SOLVES_ROOMS + "\nwizard.wait(1)")
    assert long.status == "won", "a bonus goal is not needed to win"
    assert [g.met for g in long.goals] == [True, False]


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
        ({"kind": "ticks_under", "count": 0}, "whole number"),
        ({"kind": "ticks_under", "count": "8"}, "whole number"),
    ],
)
def test_a_goal_that_cannot_be_checked_names_its_fault(goal, says):
    with pytest.raises(LevelError, match=says):
        World(rooms(goal))


def test_numbers_under_counts_the_numbers_the_code_writes():
    level = rooms(
        {"kind": "reach", "marker": "E"}, {"kind": "numbers_under", "count": 2, "bonus": True}
    )
    once = run_code(level, "steps = 3\nwizard.move_right(steps)\nwizard.move_right(steps)\n")
    twice = run_code(level, "wizard.move_right(3)\nwizard.move_right(3)\n")
    assert once.goals[1].met and not twice.goals[1].met


def test_uses_is_met_when_the_code_names_the_member():
    level = rooms(
        {"kind": "reach", "marker": "E"}, {"kind": "uses", "member": "position", "bonus": True}
    )
    assert run_code(level, "print(wizard.position)\n").goals[1].met
    assert not run_code(level, "wizard.move_right()\n").goals[1].met


def test_no_bumps_is_failed_at_the_first_bump_and_met_by_a_clean_run():
    level = rooms({"kind": "reach", "marker": "E"}, {"kind": "no_bumps"})
    bumped = run_code(level, "wizard.move_up()\nwizard.move_right(4)\n")
    assert bumped.goals[1].failed and bumped.status != "won"
    clean = run_code(level, "wizard.move_right(4)\n")
    assert clean.goals[1].met and not clean.goals[1].failed


def test_a_bonus_goal_that_fails_loses_its_star_and_not_the_level():
    """D233: a bump fails the bonus `no_bumps`, and the run still wins."""
    level = rooms({"kind": "reach", "marker": "E"}, {"kind": "no_bumps", "bonus": True})
    bumped = run_code(level, "wizard.move_up()\n" + SOLVES_ROOMS)
    assert bumped.status == "won"
    assert [(g.met, g.failed) for g in bumped.goals] == [(True, False), (False, True)]


#: A room with a walk of three stretches of two (D343): two left, two up, two right.
ROUND = Level.from_dict(
    {
        "id": "round",
        "map": ["#######", "#..E..#", "#.###.#", "#..S..#"],
        "goals": [{"kind": "reach", "marker": "E"}, {"kind": "move_by_variable"}],
    }
)


@pytest.mark.parametrize(
    ("code", "met"),
    [
        (
            "steps = 2\nwizard.move_left(steps)\nwizard.move_up(steps)\nwizard.move_right(steps)",
            True,
        ),
        ("wizard.move_left(2)\nwizard.move_up(2)\nwizard.move_right(2)", False),
        ("steps = 2\nwizard.move_left(2)\nwizard.move_up(2)\nwizard.move_right(2)", False),
        (
            "steps = 2\nprint(steps)\n"
            "wizard.move_left(2)\nwizard.move_up(2)\nwizard.move_right(2)",
            False,
        ),
        (
            "steps = 1 + 1\n"
            "wizard.move_left(steps)\nwizard.move_up(steps)\nwizard.move_right(steps)",
            False,
        ),
        ("steps = 2\nwizard.say(steps)\nwizard.move_left(steps)", True),
    ],
)
def test_move_by_variable_is_met_by_a_move_given_a_number_kept_by_hand(code, met):
    """D343: some move of the wizard's has as its first argument a name an assignment
    gives a whole number written by hand; the numbers typed, a variable never given to a
    move, a number computed, are not."""
    result = run_code(ROUND, code)
    assert result.goals[1].met is met


def own_name_level(refused=("book", "tesoro", "treasure")):
    return Level.from_dict(
        {
            "id": "own",
            "map": ["S.b"],
            "things": [{"kind": "book", "id": "old_book", "marker": "b"}],
            "goals": [
                {"kind": "collect", "id": "old_book"},
                {"kind": "own_name", "find": "book", "not": list(refused)},
            ],
        }
    )


@pytest.mark.parametrize(
    ("code", "met"),
    [
        ('eldras_book = wizard.find_nearest("book")', True),
        ('x = wizard.find_nearest("book")', True),
        ('x = wizard.find_item("book")', True),
        ('book = wizard.find_nearest("book")', False),
        ('tesoro = wizard.find_nearest("book")', False),
        ('treasure = wizard.find_nearest("book")', False),
        ('wizard.find_nearest("book")', False),
        ("", False),
        ('book = wizard.find_nearest("book")\nmine = wizard.find_nearest("book")', False),
        ('x = wizard.find_nearest("key")', False),
    ],
)
def test_own_name_is_met_by_a_find_kept_under_a_name_of_the_child_s(code, met):
    """D345: a find of the kind kept in a variable, and none kept under a refused name; a
    second find kept under an own name does not mend a first kept as `book`."""
    result = run_code(own_name_level(), code + "\nwizard.move_right()\nwizard.pick_up()")
    assert result.goals[1].met is met


@pytest.mark.parametrize(
    "goal",
    [
        {"kind": "own_name", "find": "dragon", "not": []},
        {"kind": "own_name", "find": "book", "not": "book"},
        {"kind": "own_name", "find": "book", "not": ["my book"]},
    ],
)
def test_an_own_name_goal_finds_a_kind_and_refuses_python_names(goal):
    level = Level.from_dict(
        {"id": "own", "map": ["S.E"], "goals": [{"kind": "reach", "marker": "E"}, goal]}
    )
    with pytest.raises(LevelError):
        World(level)
