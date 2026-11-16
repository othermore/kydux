"""Chapter 4's world: the broom knotted and untied (D183), on the floor or hung on a peg
(D195), every thing of a kind found and counted (D184) from the zone the wizard stands
in (D196), a story step's framing (D199), flying with drevo over the low cells (D185,
D186), the rings flown through in order (D187), the race scored by Ilda's count (D189),
and the child's own functions."""

import itertools
import json
from pathlib import Path

import pytest
from kydux_world.goals import code_lines
from kydux_world.level import Level, LevelError, Position, Scene, read_scene, story_on_scenes
from kydux_world.run import run_code
from kydux_world.world import ActionArguments, Refused, World

#: The shed's floor: brooms on it, the wizard at S.
SHED = {
    "id": "shed",
    "map": ["##########", "#........#", "#........#", "#...S....#", "##########"],
    "things": [
        {"kind": "broom", "id": "broom_1", "at": [2, 1], "knotted": True},
        {"kind": "broom", "id": "broom_2", "at": [3, 1], "knotted": True},
        {"kind": "broom", "id": "broom_3", "at": [4, 1]},
    ],
    "goals": [{"kind": "untied"}],
    "api": ["wizard.move_up", "wizard.find_all", "broom.untie", "broom.knotted"],
}


def shed(**change):
    return Level.from_dict({**SHED, **change})


def kinds(world):
    return [(e.actor, e.kind) for e in world.events]


def test_a_broom_is_untied_by_the_wizard_standing_on_it_in_a_tick():
    world = World(shed())
    world.wizard.move_up(2)
    world.wizard.move_left(2)
    broom = world.things["broom_1"]
    assert broom.knotted
    broom.untie()
    assert not broom.knotted
    assert world.events[-1].kind == "untie"
    assert world.events[-1].data == {"id": "broom_1", "at": [2, 1]}
    assert world.tick == 5


def test_a_broom_untied_from_beside_it_is_refused_too_far_and_the_program_goes_on():
    world = World(shed())
    world.wizard.move_up(2)
    world.things["broom_1"].untie()
    event = world.events[-1]
    assert (event.kind, event.data["reason"], event.data["by"]) == (
        "blocked",
        "too_far",
        "broom_1",
    )
    assert world.things["broom_1"].knotted
    world.wizard.move_left()
    assert world.over is None


def test_untying_a_broom_with_no_knot_is_an_error_that_stops_the_program():
    result = run_code(shed(), "wizard.move_up(2)\nbroom_3.untie()\nwizard.move_left()\n")
    assert result.status == "error"
    assert result.error.explanation == {"kind": "no_knot", "params": {"thing": "broom_3"}}
    assert result.events[-1].kind == "blocked"
    assert result.events[-1].data["reason"] == "no_knot"
    assert result.ticks == 3


def test_the_untied_goal_is_met_once_no_broom_is_knotted_and_failed_at_the_end_else():
    untie = "wizard.move_up(2)\nwizard.move_left(2)\nbroom_1.untie()\n"
    half = run_code(shed(), untie)
    assert half.status == "incomplete"
    assert half.goals[0].failed
    whole = run_code(shed(), untie + "wizard.move_right()\nbroom_2.untie()\n")
    assert whole.status == "won"
    assert whole.goals[0].met_at_tick == 7


def test_a_level_knots_a_broom_only_where_it_says_and_only_a_broom():
    assert not shed().things[2].knotted
    with pytest.raises(LevelError, match="only a broom is knotted"):
        Level.from_dict(
            {**SHED, "things": [{"kind": "key", "id": "k", "at": [2, 1], "knotted": True}]}
        )


def test_find_all_gives_every_broom_nearest_first_then_in_reading_order():
    world = World(shed())
    found = world.wizard.find_all("broom")
    assert [broom.name for broom in found] == ["broom_3", "broom_2", "broom_1"]
    assert len(found) == 3


def test_hidden_brooms_are_seen_once_found_in_the_tick_going_on():
    things = [{**thing, "hidden": True} for thing in SHED["things"]]
    world = World(shed(things=things))
    world.wizard.move_up()
    world.wizard.find_all("broom")
    world.wizard.find_all("broom")
    found = [e for e in world.events if e.kind == "found"]
    assert len(found) == 1
    assert (found[0].tick, found[0].actor) == (1, "world")
    assert sorted(found[0].data["ids"]) == ["broom_1", "broom_2", "broom_3"]


def test_the_wizard_says_a_number_and_the_say_goal_counts_the_brooms_of_the_way():
    level = shed(goals=[{"kind": "say", "count_of": "broom"}])
    assert run_code(level, "wizard.say(len(wizard.find_all('broom')))\n").status == "won"
    assert run_code(level, "wizard.say(2)\n").status == "incomplete"
    assert run_code(level, 'wizard.say("3")\n').status == "won"


def test_say_refuses_a_list():
    world = World(shed())
    with pytest.raises(ActionArguments, match="a word or a number"):
        world.wizard.say(world.wizard.find_all("broom"))


def test_a_loop_with_an_if_unties_the_knotted_brooms_and_ends_with_no_error():
    level = shed(goals=[{"kind": "untied"}, {"kind": "no_error"}])
    code = (
        "wizard.move_up(2)\n"
        "wizard.move_left(2)\n"
        "for broom in wizard.find_all('broom'):\n"
        "    x = broom.position.x\n"
        "    wizard.move_right(x - wizard.position.x)\n"
        "    if broom.knotted:\n"
        "        broom.untie()\n"
    )
    assert run_code(level, code).status == "won"
    without_if = code.replace(
        "    if broom.knotted:\n        broom.untie()\n", "    broom.untie()\n"
    )
    result = run_code(level, without_if)
    assert result.status == "error"
    assert result.goals[1].failed


#: The lake's edge, in small: a path, a jetty, water to cross, the stone; trees above.
LAKE = {
    "id": "lake",
    "map": ["##########", "S..~~~..E.", "##########"],
    "carrying": ["wand", "broom"],
    "spells": ["drevo"],
    "goals": [{"kind": "reach", "marker": "E"}],
}


def lake(**change):
    return Level.from_dict({**LAKE, **change})


def test_water_is_not_walked_on_and_the_wizard_says_what_it_is():
    level = lake()
    world = World(level)
    world.wizard.move_right(4)
    event = world.events[-1]
    assert event.kind == "blocked"
    assert (event.data["reason"], event.data["kind"]) == ("no_walk", "low")
    assert world.wizard.position == Position(2, 1)


def test_drevo_lifts_the_broom_and_the_moves_fly_over_the_water():
    world = World(lake())
    world.wizard.move_right(2)
    world.wizard.cast("drevo")
    assert world.wizard.flying
    assert [(e.actor, e.kind) for e in world.events[-2:]] == [("wizard", "cast"), ("broom", "fly")]
    world.wizard.move_right(6)
    assert world.wizard.position == Position(8, 1)
    assert all(e.data.get("flying") for e in world.events if e.kind == "move" and e.tick > 3)
    world.finish()
    assert world.events[-1].actor == "broom"
    assert (world.events[-1].kind, world.events[-1].data) == (
        "land",
        {"id": "wizard", "at": [8, 1]},
    )
    assert not world.wizard.flying


def test_drevo_needs_a_broom_carried_and_the_wand():
    world = World(lake(carrying=["wand"]))
    world.wizard.cast("drevo")
    assert world.events[-1].data["reason"] == "no_broom"
    world = World(lake(carrying=["broom"]))
    world.wizard.cast("drevo")
    assert world.events[-1].data["reason"] == "no_wand"


def test_a_flight_bumps_on_a_high_cell():
    world = World(lake())
    world.wizard.cast("drevo")
    world.wizard.move_up()
    assert world.events[-1].kind == "bump"
    assert world.events[-1].data["by"] == "high"


def test_drevo_cast_in_the_air_lands_on_a_cell_walked_on_and_the_moves_walk_again():
    """D215: a tick, the broom's `land` marked as the wizard's own cast, and the move
    after it walks, so that the water is refused to it."""
    world = World(lake())
    world.wizard.move_right(2)
    world.wizard.cast("drevo")
    world.wizard.move_right(4)
    tick = world.tick
    world.wizard.cast("drevo")
    assert world.tick == tick + 1
    assert not world.wizard.flying
    assert (world.events[-1].actor, world.events[-1].kind, world.events[-1].data) == (
        "broom",
        "land",
        {"id": "wizard", "at": [6, 1], "cast": True},
    )
    world.wizard.move_left()
    assert (world.events[-1].kind, world.events[-1].data["reason"]) == ("blocked", "no_walk")


def test_drevo_cast_over_the_water_is_refused_and_the_wizard_stays_in_the_air():
    """D215: refused with the cell's kind, the program stopped, no landing."""
    code = (
        "wizard.move_right(2)\nwizard.cast('drevo')\nwizard.move_right(2)\nwizard.cast('drevo')\n"
    )
    result = run_code(lake(), code)
    assert result.status == "error" and result.error.explanation["kind"] == "no_landing"
    refused = [e for e in result.events if e.kind == "blocked"][-1]
    assert (refused.data["reason"], refused.data["kind"], refused.data["tried"]) == (
        "no_landing",
        "low",
        True,
    )
    assert not [e for e in result.events if e.kind == "land"]
    world = World(lake())
    world.wizard.move_right(2)
    world.wizard.cast("drevo")
    world.wizard.move_right(2)
    with pytest.raises(Refused):
        world.wizard.cast("drevo")
    assert world.wizard.flying and world.wizard.position == Position(4, 1)


def test_drevo_cast_on_a_ring_s_cell_is_refused_as_no_cell_to_land_on():
    world = World(Level.from_dict(FIELD))
    world.wizard.cast("drevo")
    world.wizard.move_right()
    world.wizard.move_up()
    assert world.wizard.position == Position(1, 2)
    with pytest.raises(Refused):
        world.wizard.cast("drevo")
    assert world.events[-1].data["kind"] == "ring"
    assert world.wizard.flying


def test_a_program_ending_over_the_water_leaves_the_wizard_in_the_air():
    """D215: the broom sets down by itself only where the ground can be stood on."""
    world = World(lake())
    world.wizard.move_right(2)
    world.wizard.cast("drevo")
    world.wizard.move_right(2)
    world.finish()
    assert world.wizard.flying
    assert not [e for e in world.events if e.kind == "land"]


def test_the_land_goal_is_met_by_the_wizard_s_own_cast_and_not_by_the_program_s_end():
    goal = {"kind": "land", "marker": "E", "bonus": True}
    level = lake(goals=[*LAKE["goals"], goal])
    flown = "wizard.move_right(2)\nwizard.cast('drevo')\nwizard.move_right(6)\n"
    ended = run_code(level, flown)
    assert ended.status == "won" and not ended.goals[1].met
    landed = run_code(level, flown + "wizard.cast('drevo')\n")
    assert landed.status == "won" and landed.goals[1].met
    # Landed short of the stone, and walked on to it: not a landing on it.
    short = "wizard.move_right(2)\nwizard.cast('drevo')\nwizard.move_right(4)\n"
    walked = run_code(level, short + "wizard.cast('drevo')\nwizard.move_right(2)\n")
    assert walked.status == "won" and not walked.goals[1].met


def test_the_cast_goal_names_no_cells():
    goal = {"kind": "cast", "spell": "drevo", "from": [[2, 1]]}
    with pytest.raises(LevelError, match="names no cells"):
        World(lake(goals=[*LAKE["goals"], goal]))


#: A field with a pair of rings on row 2, the first flown upward and the second
#: downward (D219), the wizard on the row under them.
FIELD = {
    "id": "field",
    "map": ["..........", "..........", "..........", "S.........", ".........."],
    "carrying": ["wand", "broom"],
    "spells": ["drevo"],
    "things": [
        {"kind": "ring", "id": "ring_1", "at": [1, 2], "way": "up", "colour": "red"},
        {"kind": "ring", "id": "ring_2", "at": [3, 2], "way": "down", "colour": "red"},
    ],
    "goals": [{"kind": "through_in_order", "ids": ["ring_1", "ring_2"]}],
}
PAIR = (
    "wizard.cast('drevo')\nwizard.move_right()\nwizard.move_up(2)\n"
    "wizard.move_right(2)\nwizard.move_down(2)\n"
)


def test_rings_flown_through_up_then_down_meet_the_goal_in_order():
    result = run_code(Level.from_dict(FIELD), PAIR)
    assert result.status == "won"
    through = [e.data["id"] for e in result.events if e.kind == "through"]
    assert through == ["ring_1", "ring_2"]
    assert result.goals[0].params["missed"] == []


def test_a_ring_is_walked_into_and_flown_into_sideways_as_a_wall():
    world = World(Level.from_dict(FIELD))
    world.wizard.move_up()
    world.wizard.move_right()
    assert (world.events[-1].kind, world.events[-1].data["by"]) == ("bump", "ring")
    world.wizard.cast("drevo")
    world.wizard.move_right()
    assert (world.events[-1].kind, world.events[-1].data["by"]) == ("bump", "ring")


def test_a_ring_passed_over_is_missed_and_the_goal_fails_at_the_end():
    code = "wizard.cast('drevo')\nwizard.move_up(2)\nwizard.move_right(3)\nwizard.move_down(2)\n"
    result = run_code(Level.from_dict(FIELD), code)
    assert result.goals[0].failed
    assert result.goals[0].params["missed"] == ["ring_1"]


def test_a_ring_flown_against_its_way_is_not_flown_through_and_is_missed():
    """D219: down through the first ring of the pair and up through the second."""
    code = (
        "wizard.cast('drevo')\nwizard.move_up(2)\nwizard.move_right()\nwizard.move_down(2)\n"
        "wizard.move_right(2)\nwizard.move_up(2)\n"
    )
    result = run_code(Level.from_dict(FIELD), code)
    assert not [e for e in result.events if e.kind == "through"]
    wrong = [(e.actor, e.data) for e in result.events if e.kind == "wrong_way"]
    assert wrong == [
        ("ring_1", {"id": "ring_1", "at": [1, 2], "way": "up", "from": [1, 1]}),
        ("ring_2", {"id": "ring_2", "at": [3, 2], "way": "down", "from": [3, 3]}),
    ]
    assert result.goals[0].failed
    assert result.goals[0].params["missed"] == ["ring_1", "ring_2"]
    # The moves are made: the wizard ends over the second ring.
    assert result.events[-1].data.get("to", [3, 1]) == [3, 1]


def test_a_ring_flown_again_along_its_way_in_its_turn_counts():
    code = (
        "wizard.cast('drevo')\nwizard.move_up(2)\nwizard.move_right()\nwizard.move_down(2)\n"
        "wizard.move_up(2)\nwizard.move_right(2)\nwizard.move_down(2)\n"
    )
    result = run_code(Level.from_dict(FIELD), code)
    assert [e.kind for e in result.events if e.kind in ("through", "wrong_way")] == [
        "wrong_way",
        "through",
        "through",
    ]
    assert result.status == "won"


def rings(*specs, start=(0, 3)):
    """A field of rings on rows 1 and 2, each `(x, y, way, colour)`, all named by the
    goal in their order; the wizard at `start`."""
    rows = ["." * 12 for _ in range(5)]
    x, y = start
    rows[y] = rows[y][:x] + "S" + rows[y][x + 1 :]
    things = [
        {"kind": "ring", "id": f"ring_{n}", "at": [rx, ry], "way": way, "colour": colour}
        for n, (rx, ry, way, colour) in enumerate(specs, 1)
    ]
    goal = {"kind": "through_in_order", "ids": [thing["id"] for thing in things]}
    return {"id": "rings", "map": rows, "carrying": ["wand", "broom"], "spells": ["drevo"],
            "things": things, "goals": [goal]}  # fmt: skip


@pytest.mark.parametrize(
    ("level", "says"),
    [
        (rings((1, 2, "up", "red")), "go in pairs"),
        (rings((1, 2, "down", "red"), (3, 2, "up", "red")), "first ring is flown up"),
        (rings((1, 2, "up", "red"), (3, 2, "up", "red")), "first ring is flown up"),
        (rings((1, 2, "up", "red"), (3, 1, "down", "red")), "on ring_1's row"),
        (rings((3, 2, "up", "red"), (1, 2, "down", "red")), "to its right"),
        (rings((1, 2, "up", "red"), (3, 2, "down", "blue")), "a pair of one colour"),
        (
            rings(
                (1, 2, "up", "red"),
                (3, 2, "down", "red"),
                (5, 2, "up", "red"),
                (7, 2, "down", "red"),
            ),  # fmt: skip
            "another colour than the pair before",
        ),
        (rings((1, 2, "up", "red"), (3, 2, "down", "red"), start=(0, 4)), "row under ring_1"),
        (rings((1, 2, "up", "green"), (3, 2, "down", "green")), "is red, blue, yellow, purple"),
    ],
)
def test_a_level_whose_rings_are_not_in_pairs_by_d219_does_not_load(level, says):
    with pytest.raises(LevelError, match=says):
        Level.from_dict(level)


def test_a_ring_has_a_way_and_a_colour_and_nothing_else_does():
    level = rings((1, 2, "up", "red"), (3, 2, "down", "red"))
    del level["things"][0]["way"]
    with pytest.raises(LevelError, match="is flown up or down"):
        Level.from_dict(level)
    level = rings((1, 2, "up", "red"), (3, 2, "down", "red"))
    level["things"].append({"kind": "broom", "id": "broom", "at": [5, 3], "colour": "red"})
    with pytest.raises(LevelError, match="only a ring has a way and a colour"):
        Level.from_dict(level)
    good = Level.from_dict(rings((1, 2, "up", "red"), (3, 2, "down", "red"),
                                 (5, 2, "up", "blue"), (8, 2, "down", "blue")))  # fmt: skip
    assert [(t.way, t.colour) for t in good.things if t.kind == "ring"] == [
        ("up", "red"), ("down", "red"), ("up", "blue"), ("down", "blue"),
    ]  # fmt: skip


#: The race, on an open course: rings on row 8 at the race's columns, in pairs flown up
#: then down (D219), the wizard on row 9 under them; Zarek at (10, 5) with fourteen
#: lines, his lift and forty cells to the finish (31, 9), one of them a flourish, a
#: tick circling in place: his flight is forty-one ticks.
RACE_RINGS = (12, 15, 17, 20, 22, 24, 27, 29)
ZAREK_PATH = [
    [12, 5], [12, 6], [15, 6], [15, 4], [17, 4], [17, 6], [20, 6], [20, 4], [22, 4],
    [22, 6], [24, 6], [24, 4], [27, 4], [27, 6], [29, 6], [29, 5], [31, 5], [31, 5],
    [31, 9],
]  # fmt: skip
#: The rematch: his lift and thirty-seven cells, no flourish: thirty-eight ticks.
SHARPER_PATH = [
    [12, 5], [12, 6], [15, 6], [15, 4], [17, 4], [17, 6], [20, 6], [20, 4], [22, 4],
    [22, 6], [24, 6], [24, 4], [27, 4], [27, 6], [29, 6], [31, 6], [31, 9],
]  # fmt: skip


def race(rings=RACE_RINGS, lines=14, path=ZAREK_PATH):
    rows = ["." * 42 for _ in range(18)]
    rows[9] = "." * 10 + "S" + "." * 31
    return Level.from_dict(
        {
            "id": "race",
            "map": rows,
            "carrying": ["wand", "broom"],
            "spells": ["drevo"],
            "tick_limit": 120,
            "things": [
                {
                    "kind": "ring",
                    "id": f"ring_{n}",
                    "at": [x, 8],
                    "way": "up" if n % 2 else "down",
                    "colour": ("red", "blue", "yellow", "purple")[(n - 1) // 2],
                }
                for n, x in enumerate(rings, 1)
            ],
            "actors": [{"kind": "racer", "id": "zarek", "at": [10, 5], "facing": "right"}],
            "race": {"against": "zarek", "lines": lines, "path": path, "finish": [31, 9]},
            "goals": [
                {"kind": "through_in_order", "ids": [f"ring_{n}" for n in range(1, 9)]},
                {"kind": "before", "racer": "zarek"},
            ],
        }
    )


WITH_ARGUMENTS = """def two_rings(first, second):
    wizard.move_up(2)
    wizard.move_right(first)
    wizard.move_down(2)
    wizard.move_right(second)

wizard.cast("drevo")
wizard.move_right(2)
two_rings(3, 2)
two_rings(3, 2)
two_rings(2, 3)
two_rings(2, 2)
"""


def written_out(gaps):
    lines = ['wizard.cast("drevo")', "wizard.move_right(2)"]
    for first, second in gaps:
        lines += [
            "wizard.move_up(2)",
            f"wizard.move_right({first})",
            "wizard.move_down(2)",
            f"wizard.move_right({second})",
        ]
    return "\n".join(lines) + "\n"


def test_zarek_lifts_after_his_lines_and_crosses_the_finish_at_fifty_five():
    level = race()
    assert len(level.race.path) == 40
    assert level.race.tick == 55
    code = WITH_ARGUMENTS.replace("two_rings(2, 2)\n", "two_rings(2, 2)\nwizard.move_right(5)\n")
    result = run_code(level, code)
    zarek = [e for e in result.events if e.actor == "zarek"]
    assert [(e.kind, e.tick) for e in zarek if e.kind in ("fly", "circle", "land")] == [
        ("fly", 15),
        ("circle", 51),
        ("land", 55),
    ]
    moves = [e for e in zarek if e.kind == "move"]
    assert moves[0].tick == 16
    assert (moves[-1].tick, moves[-1].data["to"]) == (55, [31, 9])


def test_ilda_reads_the_program_a_tick_a_line_and_the_function_wins_at_forty_nine():
    result = run_code(race(), WITH_ARGUMENTS)
    assert code_lines(WITH_ARGUMENTS) == 11
    reads = [e for e in result.events if e.kind == "read"]
    assert [e.tick for e in reads] == list(range(1, 12))
    assert reads[0].line == 1 and reads[-1].line == 12
    cast = next(e for e in result.events if e.kind == "cast")
    assert cast.tick == 12
    assert result.status == "won"
    count = result.goals[1].params
    assert {key: count[key] for key in ("lines", "flight", "penalty", "tick")} == {
        "lines": 11,
        "flight": 38,
        "penalty": 0,
        "tick": 49,
    }
    assert (count["racer_lines"], count["racer_tick"]) == (14, 55)


def test_the_eighteen_lines_without_a_function_cross_one_tick_after_zarek():
    code = written_out([(3, 2), (3, 2), (2, 3), (2, 2)])
    assert code_lines(code) == 18
    result = run_code(race(), code)
    assert result.goals[0].met
    assert result.goals[1].failed
    assert result.goals[1].params["tick"] == 56
    assert result.status != "won"


def test_a_ring_missed_costs_five_ticks_circling_before_the_finish():
    code = WITH_ARGUMENTS.replace(
        "two_rings(3, 2)\ntwo_rings(3, 2)\n", "two_rings(3, 2)\nwizard.move_right(5)\n"
    )
    result = run_code(race(), code)
    circles = [e for e in result.events if e.kind == "circle" and e.actor == "wizard"]
    missed = result.goals[0].params["missed"]
    assert missed == ["ring_3", "ring_4"]
    assert len(circles) == 5 * len(missed)
    assert result.goals[1].params["penalty"] == 10
    assert result.status != "won"


def test_in_the_rematch_twelve_lines_tie_with_zarek_and_the_tie_is_his():
    rings = (12, 14, 17, 19, 22, 25, 27, 29)
    level = race(rings=rings, lines=12, path=SHARPER_PATH)
    assert len(level.race.path) == 37
    assert level.race.tick == 50
    good = WITH_ARGUMENTS.replace(
        "two_rings(3, 2)\ntwo_rings(3, 2)\ntwo_rings(2, 3)\n",
        "two_rings(2, 3)\ntwo_rings(2, 3)\ntwo_rings(3, 2)\n",
    )
    won = run_code(level, good)
    assert won.status == "won"
    assert won.goals[1].params["tick"] == 49
    one_more = good.replace(
        'wizard.cast("drevo")\n', 'wizard.cast("drevo")\nwizard.move_right(0)\n'
    )
    tied = run_code(level, one_more)
    assert tied.goals[1].params["tick"] == 50
    assert tied.goals[1].failed


def test_the_race_is_flown_out_after_the_program_ends():
    result = run_code(race(), WITH_ARGUMENTS)
    assert result.ticks >= 54
    landed = [e for e in result.events if e.kind == "land" and e.actor == "broom"]
    assert landed and landed[0].tick == 49


def test_a_race_names_a_racer_of_the_level_and_a_path_that_crosses_the_finish():
    with pytest.raises(LevelError, match="never crosses the finish"):
        race(path=[[12, 5]])


def test_a_function_with_and_without_arguments_runs_and_its_lines_are_its_own():
    level = Level.from_dict(FIELD)
    code = (
        "def step():\n"
        "    wizard.move_right()\n"
        "\n"
        "def steps(count):\n"
        "    wizard.move_right(count)\n"
        "\n"
        "step()\n"
        "steps(2)\n"
    )
    result = run_code(level, code)
    moves = [e for e in result.events if e.kind == "move"]
    assert [e.line for e in moves] == [2, 5, 5]


def test_a_scene_s_low_and_high_terrains_are_read_with_what_a_flight_crosses(tmp_path):
    folder = tmp_path / "lake-edge"
    folder.mkdir()
    (folder / "map.txt").write_text("TTTT\n.ww.\n....\n", encoding="utf-8")
    terrains = {
        "T": {"kind": "tree"},
        "w": {"kind": "water", "fly": True, "sight": True},
    }
    (folder / "scene.json").write_text(json.dumps({"terrains": terrains}), encoding="utf-8")
    scene = read_scene(tmp_path, "lake-edge")
    assert scene.terrains["w"]["fly"] and not scene.terrains["w"]["walk"]
    assert not scene.terrains["T"]["fly"]
    assert scene.terrains["."]["fly"]
    from kydux_world.level import on_scene

    built = on_scene({"id": "l", "scene": "lake-edge", "start": [0, 1]}, scene)
    assert built["map"] == ["####", "S~~.", "...."]
    level = Level.from_dict({**built, "goals": [{"kind": "reach", "at": [3, 1]}]})
    assert level.low == {Position(1, 1), Position(2, 1)}
    assert level.kinds[Position(1, 1)] == "water"
    assert level.kinds[Position(0, 0)] == "tree"


def test_refused_is_an_error_the_child_s_except_may_catch():
    assert issubclass(Refused, Exception)


def test_find_all_orders_by_steps_across_rows_and_columns_and_ties_by_row_then_column():
    """Nearest first by the steps walked, whatever order the level names its things in;
    of two as near, the one on the higher row first, and on a row the one further left."""
    rows = ["#######", "#.....#", "#..S..#", "#.....#", "#######"]
    cells = [(3, 1), (2, 2), (4, 2), (3, 3), (2, 1), (4, 1), (1, 3)]
    things = [
        {"kind": "broom", "id": f"broom_{n}", "at": list(cell)}
        for n, cell in enumerate(cells[::-1], 1)
    ]
    world = World(Level.from_dict({"id": "inside", "map": rows, "things": things}))
    found = [tuple(broom.position) for broom in world.wizard.find_all("broom")]
    assert found == cells


#: The lake's edge in small, for a story: grass, water (low) and trees (high).
STORY_TERRAINS = {
    "g": {"kind": "grass", "walk": True, "sight": True, "fly": True},
    "w": {"kind": "water", "walk": False, "sight": True, "fly": True},
    "T": {"kind": "tree", "walk": False, "sight": False, "fly": False},
}
LAKE_SCENE = Scene("lake", ("TTTTTT", "gggggg", "ggwwgg", "gggggg"), STORY_TERRAINS)
SHED_SCENE = Scene("shed", ("gggg", "gggg"), STORY_TERRAINS)


def told(steps, **change):
    data = {
        "id": "a-flight",
        "scene": "lake",
        "wizard": [0, 3],
        "camera": [2, 2],
        "actors": [{"id": "zarek", "kind": "racer"}],
        "steps": steps,
        **change,
    }
    return story_on_scenes(data, {"lake": LAKE_SCENE, "shed": SHED_SCENE}.get)


def test_a_story_s_figure_flies_over_the_water_and_lands():
    told(
        [
            {"who": "voice", "do": {"appear": [1, 1], "flying": True}, "by": "zarek"},
            {"who": "zarek", "do": [{"fly": [[3, 1], [3, 2], [4, 2]]}, {"land": True}]},
        ]
    )


def test_a_story_s_walk_over_the_water_is_stopped_there():
    with pytest.raises(LevelError, match="walk is stopped at 2,2"):
        told([{"who": "wizard", "do": {"walk": [[0, 2], [3, 2]]}}])


def test_a_figure_lands_only_on_a_cell_walked_on():
    with pytest.raises(LevelError, match="lands where no one stands"):
        told(
            [
                {"who": "voice", "do": {"appear": [1, 1], "flying": True}, "by": "zarek"},
                {"who": "zarek", "do": [{"fly": [[2, 1], [2, 2]]}, {"land": True}]},
            ]
        )


def test_a_story_told_on_two_scenes_has_each_part_s_world():
    story = told(
        [
            {"who": "voice", "do": None},
            {
                "who": "voice",
                "scene": {"scene": "shed", "wizard": [0, 1], "camera": [1, 1], "actors": []},
                "do": {"walk": [3, 1]},
                "by": "wizard",
            },
            {"who": "wizard", "do": {"face": "up"}},
        ],
        actors=[],
    )
    assert len(story["steps"]) == 3
    assert "scene" not in story["steps"][1]
    (part,) = story["parts"]
    assert (part["step"], part["scene"], part["camera"]) == (1, "shed", [1, 1])
    assert part["world"]["map"][1] == "S..."


def test_a_part_s_steps_are_checked_on_its_own_scene():
    with pytest.raises(LevelError, match="stopped"):
        told(
            [
                {"who": "voice", "do": None},
                {
                    "who": "voice",
                    "scene": {"scene": "shed", "wizard": [0, 1], "camera": [1, 1]},
                    "do": {"walk": [[0, 0], [0, -1]]},
                    "by": "wizard",
                },
            ],
            actors=[],
        )


# The levels of chapter 4 as they are in content/: their ways' orders and the
# race's tick tables, on their scenes.
CONTENT = Path(__file__).resolve().parents[2] / "content" / "levels"


def content_level(name):
    return Level.from_directory(CONTENT / name)


def found_from(level, moves=()):
    """The cells of the brooms find_all gives after the moves, nearest first (D196)."""
    world = World(level)
    for move, steps in moves:
        getattr(world.wizard, move)(steps)
    return [tuple(broom.position) for broom in world.wizard.find_all("broom")]


#: The wall's pegs with a broom, by way, nearest first from the row's right end, (13, 5)
#: (plan 2.3), and the steps of each walk to the next.
WALL_PEGS = {
    "a": ([12, 10, 9, 6], [1, 2, 1, 3]),
    "b": ([13, 11, 7], [0, 2, 4]),
    "c": ([13, 12, 9, 8, 6], [0, 1, 3, 1, 2]),
}


def walked_by_distance(world, knotted_only=False):
    """The wall's program from the row's right end: the steps of each walk to the next
    broom, by its distance (D206)."""
    world.wizard.move_up(3)
    world.wizard.move_right(4)
    steps = []
    for broom in world.wizard.find_all("broom"):
        steps.append(broom.distance_to(world.wizard))
        world.wizard.move_left(steps[-1])
        if broom.knotted or not knotted_only:
            broom.untie()
    return steps


@pytest.mark.parametrize("way", sorted(WALL_PEGS))
def test_on_the_wall_the_pegs_come_nearest_first_from_the_end_and_each_walk_is_its_distance(way):
    level = content_level("the-brooms-on-the-wall").way(way)
    pegs, steps = WALL_PEGS[way]
    # From the door, the two brooms lying on the boards, left for later (D202).
    assert found_from(level) == [(7, 7), (11, 7)]
    # From the row's end, the hung ones, each on its peg's cell (D211), nearest first.
    assert found_from(level, [("move_up", 3), ("move_right", 4)]) == [(p, 4) for p in pegs]
    world = World(level)
    assert walked_by_distance(world) == steps
    assert not any(world.things[f"broom_{p}"].knotted for p in pegs)


#: The check's pegs with a broom, nearest first from the row's right end, and those still
#: knotted, by way (sprint 43, 2.5): the wall's own brooms; and which of the list's
#: brooms is the first with no knot, where the given program stops.
CHECK_PEGS = {
    "a": ([12, 10, 9, 6], [6, 10], 0),
    "b": ([13, 11, 7], [11], 0),
    "c": ([13, 12, 9, 8, 6], [8, 9, 13], 1),
}


@pytest.mark.parametrize("way", sorted(CHECK_PEGS))
def test_in_the_check_the_wall_s_own_brooms_and_the_given_program_stops_at_one_with_no_knot(
    way,
):
    """D217, 2.5: each way hangs what the wall's way of the same id hangs, the two of the
    floor still knotted where they lie there; the wall's program stops in every way."""
    pegs, knots, first = CHECK_PEGS[way]
    level = content_level("the-check").way(way)
    wall = content_level("the-brooms-on-the-wall").way(way)
    hung = sorted(tuple(t.position) for t in level.things if t.kind == "broom" and t.hung)
    assert hung == sorted(tuple(t.position) for t in wall.things if t.kind == "broom" and t.hung)
    lying = {
        (tuple(t.position), t.knotted) for t in level.things if t.kind == "broom" and not t.hung
    }
    assert lying == {((7, 7), True), ((11, 7), True)}
    world = World(level)
    world.wizard.move_up(3)
    world.wizard.move_right(4)
    brooms = world.wizard.find_all("broom")
    assert [tuple(broom.position) for broom in brooms] == [(p, 4) for p in pegs]
    assert [broom.knotted for broom in brooms] == [p in knots for p in pegs]
    assert [broom.knotted for broom in brooms].index(False) == first
    # With the knot looked at first, each broom is reached by its distance and untied.
    world = World(level)
    walked_by_distance(world, knotted_only=True)
    assert not any(world.things[f"broom_{p}"].knotted for p in pegs)


#: The nearest broom's level by way (2.6): the broom find_nearest gives from (9, 7), its
#: walk (columns to the right, rows down), and the others, each farther.
NEAREST = {
    "a": ((11, 6), (2, -1), [(6, 6), (6, 8), (13, 8)]),
    "b": ((7, 8), (-2, 1), [(6, 6), (12, 8), (13, 6)]),
    "c": ((8, 6), (-1, -1), [(6, 8), (12, 8), (13, 6)]),
}


@pytest.mark.parametrize("way", sorted(NEAREST))
def test_the_nearest_broom_lies_on_the_boards_and_the_others_farther_under_the_straw(way):
    """D217, 2.6: broom_0 is found by find_nearest from the start, seen on the boards; the
    others lie on the straw's cells, hidden, each at least a step farther."""
    level = content_level("the-nearest-broom").way(way)
    assert level.start == (9, 7)
    cell, walk, others = NEAREST[way]
    world = World(level)
    nearest = world.wizard.find_nearest("broom")
    assert nearest.name == "broom_0" and tuple(nearest.position) == cell
    assert (cell[0] - 9, cell[1] - 7) == walk
    lying = {tuple(t.position): t for t in level.things if t.kind == "broom" and not t.hung}
    assert set(lying) == {cell, *others}
    assert not lying[cell].hidden and all(lying[o].hidden for o in others)
    assert all(o in STRAW for o in others) and cell not in STRAW
    near = abs(walk[0]) + abs(walk[1])
    assert all(abs(x - 9) + abs(y - 7) >= near + 1 for x, y in others)
    # No friend's figure, drawn with its soles in row 6 (D211), over a broom.
    for actor in level.actors:
        assert actor.position.y == 5
        assert (actor.position.x, 6) not in lying


def test_the_nearest_broom_s_walks_go_every_way_round():
    """2.6: a program that walks the same two ways wins at most one arrangement; one
    that decides only left or right, or only up or down, loses one."""
    walks = [walk for _, walk, _ in NEAREST.values()]
    assert {x < 0 for x, _ in walks} == {True, False}
    assert {y < 0 for _, y in walks} == {True, False}
    for sideways in (-1, 1):
        for upwards in (-1, 1):
            same = [
                w
                for w in walks
                if (w[0] > 0) - (w[0] < 0) == sideways and (w[1] > 0) - (w[1] < 0) == upwards
            ]
            assert len(same) <= 1


#: The straw's brooms by way (plan 2.4): the list as find_all gives it from the start,
#: (10, 6), and the walk from each to the next, columns to the right and rows down.
STRAW_WALKS = {
    "a": ([(11, 7), (7, 6), (8, 8), (13, 8)], [(1, 1), (-4, -1), (1, 2), (5, 0)]),
    "b": (
        [(9, 7), (13, 6), (6, 6), (7, 8), (6, 8)],
        [(-1, 1), (4, -1), (-7, 0), (1, 2), (-1, 0)],
    ),
    "c": ([(10, 8), (7, 6), (12, 8)], [(0, 2), (-3, -2), (5, 2)]),
}


@pytest.mark.parametrize("way", sorted(STRAW_WALKS))
def test_in_the_straw_the_walks_go_to_every_side_and_no_two_brooms_are_as_far(way):
    """D212: in every way the walk goes left, right, up and down at least once, the
    brooms lie at distances all different from the start, and the friend and the mate
    stand by the wall, off every walk of rows 6 to 8."""
    level = content_level("the-brooms-in-the-straw").way(way)
    order, walks = STRAW_WALKS[way]
    assert level.start == (10, 6)
    found = found_from(level)
    assert found == order
    cells = [(10, 6), *found]
    assert [(b[0] - a[0], b[1] - a[1]) for a, b in itertools.pairwise(cells)] == walks
    assert any(x < 0 for x, _ in walks) and any(x > 0 for x, _ in walks)
    assert any(y < 0 for _, y in walks) and any(y > 0 for _, y in walks)
    distances = [abs(x - 10) + abs(y - 6) for x, y in found]
    assert len(set(distances)) == len(distances)
    assert all(not 6 <= actor.position.y <= 8 for actor in level.actors)
    assert (5, 8) not in found


#: El cobertizo's floor by way (plan 2.2): the brooms in sight, the hidden ones.
SHED_FLOOR = {
    "a": ({(9, 8), (7, 7), (11, 7)}, {(6, 8), (13, 6)}),
    "b": ({(9, 8), (10, 7), (11, 8)}, {(7, 6), (12, 8), (5, 8)}),
    "c": ({(9, 8), (11, 7)}, {(6, 6), (13, 8)}),
}


@pytest.mark.parametrize("way", sorted(SHED_FLOOR))
def test_the_shed_finds_the_floor_s_brooms_from_where_the_wizard_stands_and_no_hung_one(way):
    """D205: from the start, find_all gives every broom on the floor, those in sight and
    those under the straw, and none of the four hung on pegs 7, 10, 11 and 13."""
    level = content_level("the-shed").way(way)
    seen, hidden = SHED_FLOOR[way]
    lying = {tuple(t.position): t.hidden for t in level.things if not t.hung}
    assert lying == {**dict.fromkeys(seen, False), **dict.fromkeys(hidden, True)}
    hung = sorted(tuple(t.position) for t in level.things if t.hung)
    assert hung == [(7, 4), (10, 4), (11, 4), (13, 4)]
    assert sorted(found_from(level)) == sorted(seen | hidden)


def test_the_shed_forbids_the_row_under_the_pegs_with_the_owner_s_reason():
    level = content_level("the-shed")
    assert level.forbidden == {Position(x, 5) for x in range(6, 14)}
    assert set(level.forbidden_reasons.values()) == {"stay_by_the_brooms"}


#: The cells of the shed's floor the picture paints straw on, as its scene names them
#: (D202).
STRAW = {
    tuple(cell)
    for cell in json.loads(
        (CONTENT.parent / "scenes" / "the-broom-shed" / "scene.json").read_text(encoding="utf-8")
    )["straw"]
}


def shed_stagings():
    """Every level and story step staged in the-broom-shed, in each of its ways: a name
    and the brooms, each its cell, whether it hangs, is hidden and is knotted."""
    found = []
    for folder in sorted(CONTENT.iterdir()):
        data = json.loads((folder / "level.json").read_text(encoding="utf-8"))
        if data.get("scene") != "the-broom-shed":
            continue
        level = content_level(folder.name)
        for way_id, way in level.ways or (("", level),):
            brooms = [
                (tuple(t.position), t.hung, t.hidden, t.knotted)
                for t in way.things
                if t.kind == "broom"
            ]
            found.append((f"{folder.name} {way_id}".strip(), brooms))
    stories = CONTENT.parent / "stories"
    for folder in sorted(stories.iterdir()):
        story = json.loads((folder / "story.json").read_text(encoding="utf-8"))
        for number, step in enumerate(story["steps"], 1):
            scene = step.get("scene")
            if isinstance(scene, dict) and scene.get("scene") == "the-broom-shed":
                brooms = [
                    (tuple(t["at"]), t.get("hung", False), t.get("hidden", False), False)
                    for t in scene.get("things", [])
                    if t["kind"] == "broom"
                ]
                found.append((f"{folder.name} step {number}", brooms))
    return found


@pytest.mark.parametrize(
    ("where", "brooms"), shed_stagings(), ids=lambda v: v if isinstance(v, str) else ""
)
def test_in_the_shed_a_lying_broom_is_hidden_on_the_straw_and_seen_on_the_boards(where, brooms):
    """D202: a lying broom on one of the scene's seven straw cells is hidden, elsewhere
    seen, on the boards of rows 6 to 8 and off (13, 7); a hung one is on its peg's cell,
    on row 4 (D211)."""
    for cell, hung, hidden, _ in brooms:
        if hung:
            assert cell[1] == 4 and 6 <= cell[0] <= 13, f"{where}: a broom hung on {cell}"
            continue
        assert cell != (13, 7) and 6 <= cell[1] <= 8, f"{where}: a broom on {cell}"
        assert hidden == (cell in STRAW), f"{where}: the broom on {cell}"


def test_the_race_and_the_rematch_have_zarek_cross_at_fifty_five_and_fifty():
    race, rematch = content_level("the-race"), content_level("the-rematch")
    assert (race.race.lines, len(race.race.path), race.race.tick) == (14, 40, 55)
    assert (rematch.race.lines, len(rematch.race.path), rematch.race.tick) == (12, 37, 50)
    for level in (race, rematch):
        assert not {(31, 4), (31, 5)} & set(level.race.path)


def test_the_race_s_solution_crosses_at_forty_nine_and_eighteen_lines_one_after_zarek():
    folder = CONTENT / "the-race"
    won = run_code(content_level("the-race"), (folder / "solution.py").read_text())
    assert won.status == "won" and won.goals[1].params["tick"] == 49
    lost = run_code(
        content_level("the-race"), (folder / "wrong" / "eighteen_lines.py").read_text()
    )
    assert lost.goals[1].params["tick"] == 56 and lost.goals[1].failed


def test_the_rematch_is_won_at_forty_nine_and_tied_at_fifty():
    folder = CONTENT / "the-rematch"
    won = run_code(content_level("the-rematch"), (folder / "solution.py").read_text())
    assert won.status == "won" and won.goals[1].params["tick"] == 49
    tied = run_code(
        content_level("the-rematch"), (folder / "wrong" / "twelve_lines.py").read_text()
    )
    assert tied.goals[1].params["tick"] == 50 and tied.goals[1].failed


def test_in_the_rings_a_loop_round_the_pair_flies_into_the_trees():
    folder = CONTENT / "the-rings"
    result = run_code(
        content_level("the-rings"), (folder / "wrong" / "a_loop_round_the_pair.py").read_text()
    )
    bumps = [e.data for e in result.events if e.kind == "bump"]
    assert bumps and bumps[0]["by"] == "high" and bumps[0]["kind"] == "tree"


#: A rack along the top: brooms hang on its pegs (row 1, shelves) over the row the wizard
#: stands on under them (row 2), the wall's zone; the straw below (rows 3 and 4).
RACK = {
    "id": "rack",
    "map": ["##########", "#========#", "#........#", "#........#", "#...S....#", "##########"],
    "zones": {"wall": [[1, 2, 8, 2]], "straw": [[1, 3, 8, 4]]},
    "things": [
        {
            "kind": "broom",
            "id": "hung_1",
            "at": [2, 1],
            "hung": True,
            "zone": "wall",
            "knotted": True,
        },
        {
            "kind": "broom",
            "id": "hung_2",
            "at": [3, 1],
            "hung": True,
            "zone": "wall",
            "knotted": True,
        },
        {"kind": "broom", "id": "fallen_1", "at": [6, 3], "zone": "straw", "knotted": True},
        {"kind": "broom", "id": "fallen_2", "at": [2, 4], "zone": "straw", "knotted": True},
    ],
    "goals": [{"kind": "untied", "ids": ["hung_1"]}],
    "api": ["wizard.move_up", "wizard.find_all", "broom.untie", "broom.knotted"],
}


def rack(**change):
    return Level.from_dict({**RACK, **change})


def test_a_hung_broom_is_untied_from_the_cell_under_it_and_refused_from_beside(tmp_path):
    world = World(rack())
    world.wizard.move_up(2)
    world.wizard.move_left(2)
    world.things["hung_1"].untie()
    assert not world.things["hung_1"].knotted
    assert world.events[-1].data == {"id": "hung_1", "at": [2, 2]}
    world.things["hung_2"].untie()
    assert world.events[-1].data["reason"] == "too_far"
    assert world.things["hung_2"].knotted


def test_a_hung_broom_is_untied_only_from_the_cell_just_under_its_peg():
    """D211: from the row under the pegs and from nowhere else, not two rows down."""
    world = World(rack())
    world.wizard.move_up(1)
    world.wizard.move_left(2)
    assert world.wizard.position == (2, 3)
    world.things["hung_1"].untie()
    assert world.events[-1].data["reason"] == "too_far"
    world.wizard.move_up(1)
    world.things["hung_1"].untie()
    assert not world.things["hung_1"].knotted


def test_a_hung_broom_is_as_far_as_the_cell_under_its_peg_and_keeps_its_peg_s_position():
    """D206: 0 steps from the cell under it, 1 from the next one along, either way
    round; its position is its peg's cell."""
    world = World(rack())
    world.wizard.move_up(2)
    world.wizard.move_left(2)
    hung_1, hung_2 = world.things["hung_1"], world.things["hung_2"]
    assert world.wizard.position == (2, 2) and hung_1.position == (2, 1)
    assert hung_1.distance_to(world.wizard) == 0 == world.wizard.distance_to(hung_1)
    assert hung_2.distance_to(world.wizard) == 1 == world.wizard.distance_to(hung_2)
    assert hung_1.distance_to(hung_2) == 1
    # A lying broom counts to its own cell.
    assert world.things["fallen_2"].distance_to(world.wizard) == 2


def test_find_all_and_find_nearest_order_a_hung_broom_by_the_cell_under_its_peg():
    """D206: from (4, 2) a broom hung over (5, 2) is 1 step away, as near as one lying
    on (4, 3), and comes first, its row being higher; counted to its peg it would be 2
    steps away and come after."""
    things = [
        {"kind": "broom", "id": "hung", "at": [5, 1], "hung": True},
        {"kind": "broom", "id": "lying", "at": [4, 3]},
    ]
    world = World(rack(zones={}, things=things, goals=[{"kind": "untied"}]))
    world.wizard.move_up(2)
    assert [b.name for b in world.wizard.find_all("broom")] == ["hung", "lying"]
    assert world.wizard.find_nearest("broom").name == "hung"


def test_find_all_finds_only_what_lies_in_the_zone_the_wizard_stands_in():
    world = World(rack())
    assert [b.name for b in world.wizard.find_all("broom")] == ["fallen_2", "fallen_1"]
    assert world.wizard.find_nearest("broom").name == "fallen_2"
    world.wizard.move_up(2)
    assert [b.name for b in world.wizard.find_all("broom")] == ["hung_2", "hung_1"]
    world.wizard.move_left(2)
    assert [b.name for b in world.wizard.find_all("broom")] == ["hung_1", "hung_2"]


def test_a_thing_with_no_zone_is_found_from_anywhere_and_one_with_a_zone_only_from_it():
    things = [*RACK["things"], {"kind": "key", "id": "key", "at": [8, 2]}]
    world = World(rack(things=things, zones={"wall": [[1, 2, 7, 2]], "straw": [[1, 3, 7, 4]]}))
    world.wizard.move_right(4)
    assert world.wizard.position == (8, 4)
    assert world.wizard.find_all("broom") == []
    assert world.wizard.find_nearest("broom") is None
    assert world.wizard.find_nearest("key").name == "key"


def test_the_untied_goal_counts_only_the_brooms_it_names():
    solved = "wizard.move_up(2)\nwizard.move_left(2)\nhung_1.untie()\n"
    assert run_code(rack(), solved).status == "won"
    assert run_code(rack(goals=[{"kind": "untied"}]), solved).status != "won"
    with pytest.raises(LevelError, match="ids name brooms"):
        World(rack(goals=[{"kind": "untied", "ids": ["nothing"]}]))


def test_the_untied_goal_counts_the_brooms_of_a_zone_in_the_way_played():
    """D202: the wall's brooms untied, the straw's left knotted, meet a goal of the wall."""
    wall = {"kind": "untied", "zone": "wall"}
    half = "wizard.move_up(2)\nwizard.move_left(2)\nhung_1.untie()\n"
    solved = half + "wizard.move_right()\nhung_2.untie()\n"
    assert run_code(rack(goals=[wall]), solved).status == "won"
    assert run_code(rack(goals=[{"kind": "untied"}]), solved).status != "won"
    assert run_code(rack(goals=[wall]), half).status != "won"
    # A way that takes a hung broom away: the goal counts the one the way has.
    ways = [{"id": "one", "things": [{"id": "hung_2", "gone": True}]}, {"id": "two"}]
    level = rack(goals=[wall], ways=ways)
    assert run_code(level.way("one"), half).status == "won"
    assert run_code(level.way("two"), half).status != "won"


@pytest.mark.parametrize(
    ("goal", "says"),
    [
        ({"kind": "untied", "zone": "wall", "ids": ["hung_1"]}, "ids or by zone, not both"),
        ({"kind": "untied", "zone": "loft"}, "zone loft is not the level's"),
    ],
)
def test_an_untied_goal_s_zone_is_the_level_s_and_alone(goal, says):
    with pytest.raises(LevelError, match=says):
        World(rack(goals=[goal]))


def test_an_untied_goal_s_zone_has_a_broom_in_the_way_played():
    hung = [{"id": "hung_1", "gone": True}, {"id": "hung_2", "gone": True}]
    level = rack(
        goals=[{"kind": "untied", "zone": "wall"}],
        ways=[{"id": "bare", "things": hung}, {"id": "full"}],
    )
    with pytest.raises(LevelError, match="zone wall has no broom"):
        World(level.way("bare"))


@pytest.mark.parametrize(("hung", "said"), [(False, "2"), (True, "2"), (None, "4")])
def test_the_say_goal_counts_the_brooms_hung_or_not(hung, said):
    """D205: the floor's count, `hung` false; the wall's, true; every broom, without it."""
    goal = {"kind": "say", "count_of": "broom", **({} if hung is None else {"hung": hung})}
    assert run_code(rack(goals=[goal]), f"wizard.say({said})").status == "won"
    wrong = {"2": "4", "4": "2"}[said]
    assert run_code(rack(goals=[goal]), f"wizard.say({wrong})").status != "won"


def test_a_say_goal_s_hung_is_true_or_false_with_a_count():
    with pytest.raises(LevelError, match="hung is true or false"):
        World(rack(goals=[{"kind": "say", "count_of": "broom", "hung": "no"}]))
    with pytest.raises(LevelError, match="hung is true or false"):
        World(rack(goals=[{"kind": "say", "text": "two", "hung": True}]))


def test_a_thing_s_zone_is_the_level_s_and_holds_where_it_is_found_from():
    with pytest.raises(LevelError, match="not the level's"):
        rack(zones={"wall": [[1, 2, 8, 2]]})
    moved = [{**RACK["things"][0], "at": [2, 1], "zone": "straw"}, *RACK["things"][1:]]
    with pytest.raises(LevelError, match="outside its zone"):
        rack(things=moved)
    with pytest.raises(LevelError, match="only a broom hangs"):
        rack(things=[*RACK["things"], {"kind": "key", "id": "key", "at": [5, 3], "hung": True}])


def test_a_story_step_frames_a_box_of_cells_or_the_scene_s_width():
    from kydux_world.level import _step_camera

    _step_camera({"fit": [[3, 3], [16, 10]]}, "story", 20, 15)
    _step_camera({"wide": True}, "story", 20, 15)
    for wrong in (
        {"fit": [[3, 3], [26, 10]]},
        {"fit": [[16, 3], [3, 10]]},
        {"wide": False},
        [3, 3],
    ):
        with pytest.raises(LevelError):
            _step_camera(wrong, "story", 20, 15)
