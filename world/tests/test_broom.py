"""Chapter 4's world: the broom knotted and untied (D183), every thing of a kind found
and counted (D184), flying with drevo over the low cells (D185, D186), the rings
flown through in order (D187), the race scored by Ilda's count (D189), and the
child's own functions."""

import json

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


def test_the_cast_goal_may_ask_for_the_spell_from_a_few_cells():
    goal = {"kind": "cast", "spell": "drevo", "from": [[2, 1]], "bonus": True}
    level = lake(goals=[*LAKE["goals"], goal])
    early = run_code(level, "wizard.cast('drevo')\nwizard.move_right(8)\n")
    assert early.status == "won" and not early.goals[1].met
    late = run_code(level, "wizard.move_right(2)\nwizard.cast('drevo')\nwizard.move_right(6)\n")
    assert late.goals[1].met


#: A field with two rings on row 2, flown through downward then upward.
FIELD = {
    "id": "field",
    "map": ["..........", "S.........", "..........", "..........", ".........."],
    "carrying": ["wand", "broom"],
    "spells": ["drevo"],
    "things": [
        {"kind": "ring", "id": "ring_1", "at": [1, 2]},
        {"kind": "ring", "id": "ring_2", "at": [3, 2]},
    ],
    "goals": [{"kind": "through_in_order", "ids": ["ring_1", "ring_2"]}],
}
PAIR = (
    "wizard.cast('drevo')\nwizard.move_right()\nwizard.move_down(2)\n"
    "wizard.move_right(2)\nwizard.move_up(2)\n"
)


def test_rings_flown_through_down_then_up_meet_the_goal_in_order():
    result = run_code(Level.from_dict(FIELD), PAIR)
    assert result.status == "won"
    through = [e.data["id"] for e in result.events if e.kind == "through"]
    assert through == ["ring_1", "ring_2"]
    assert result.goals[0].params["missed"] == []


def test_a_ring_is_walked_into_and_flown_into_sideways_as_a_wall():
    world = World(Level.from_dict(FIELD))
    world.wizard.move_down()
    world.wizard.move_right()
    assert (world.events[-1].kind, world.events[-1].data["by"]) == ("bump", "ring")
    world.wizard.cast("drevo")
    world.wizard.move_right()
    assert (world.events[-1].kind, world.events[-1].data["by"]) == ("bump", "ring")


def test_a_ring_passed_over_is_missed_and_the_goal_fails_at_the_end():
    code = "wizard.cast('drevo')\nwizard.move_right(3)\nwizard.move_down(2)\n"
    result = run_code(Level.from_dict(FIELD), code)
    assert result.goals[0].failed
    assert result.goals[0].params["missed"] == ["ring_1"]


#: The race, on an open course: rings on row 8 at the race's columns; Zarek at
#: (10, 5) with fourteen lines, his lift and forty cells to the finish (31, 7), one of
#: them a flourish, a tick circling in place: his flight is forty-one ticks.
RACE_RINGS = (12, 15, 17, 20, 22, 24, 27, 29)
ZAREK_PATH = [
    [12, 5], [12, 6], [15, 6], [15, 4], [17, 4], [17, 6], [20, 6], [20, 4], [22, 4],
    [22, 6], [24, 6], [24, 4], [27, 4], [27, 6], [29, 6], [29, 4], [31, 4], [31, 4],
    [31, 7],
]  # fmt: skip
#: The rematch: his lift and thirty-seven cells, no flourish: thirty-eight ticks.
SHARPER_PATH = [
    [12, 5], [12, 6], [15, 6], [15, 4], [17, 4], [17, 6], [20, 6], [20, 4], [22, 4],
    [22, 6], [24, 6], [24, 4], [27, 4], [27, 6], [29, 6], [29, 5], [31, 5], [31, 7],
]  # fmt: skip


def race(rings=RACE_RINGS, lines=14, path=ZAREK_PATH):
    rows = ["." * 42 for _ in range(18)]
    rows[7] = "." * 10 + "S" + "." * 31
    return Level.from_dict(
        {
            "id": "race",
            "map": rows,
            "carrying": ["wand", "broom"],
            "spells": ["drevo"],
            "tick_limit": 120,
            "things": [
                {"kind": "ring", "id": f"ring_{n}", "at": [x, 8]} for n, x in enumerate(rings, 1)
            ],
            "actors": [{"kind": "racer", "id": "zarek", "at": [10, 5], "facing": "right"}],
            "race": {"against": "zarek", "lines": lines, "path": path, "finish": [31, 7]},
            "goals": [
                {"kind": "through_in_order", "ids": [f"ring_{n}" for n in range(1, 9)]},
                {"kind": "before", "racer": "zarek"},
            ],
        }
    )


WITH_ARGUMENTS = """def two_rings(first, second):
    wizard.move_down(2)
    wizard.move_right(first)
    wizard.move_up(2)
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
            "wizard.move_down(2)",
            f"wizard.move_right({first})",
            "wizard.move_up(2)",
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
        ("circle", 52),
        ("land", 55),
    ]
    moves = [e for e in zarek if e.kind == "move"]
    assert moves[0].tick == 16
    assert (moves[-1].tick, moves[-1].data["to"]) == (55, [31, 7])


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


#: The shed's inside, rows 6 to 8 and columns 6 to 13, for the orders of the plan's
#: ways (3.3); the levels' own cells are held by their content tests.
STRAW_WAYS = {
    "three": [(10, 7), (8, 7), (6, 8)],
    "four": [(10, 7), (9, 8), (7, 8), (6, 8)],
    "four_high": [(10, 6), (9, 7), (7, 7), (6, 8)],
}
CHECK_EIGHT = [(7, 8), (7, 7), (8, 7), (9, 7), (10, 6), (11, 6), (12, 6), (13, 6)]
CHECK_WAYS = {
    "six": [(7, 8), (8, 7), (9, 7), (10, 6), (12, 6), (13, 6)],
    "eight": CHECK_EIGHT,
    "nine": sorted(
        [*CHECK_EIGHT, (9, 6)], key=lambda c: (abs(c[0] - 6) + abs(c[1] - 8), c[1], c[0])
    ),
}


def inside(start, cells):
    rows = ["#" * 20 for _ in range(15)]
    for y in (6, 7, 8):
        rows[y] = "#" * 6 + "." * 8 + "#" * 6
    row = list(rows[start[1]])
    row[start[0]] = "S"
    rows[start[1]] = "".join(row)
    things = [
        {"kind": "broom", "id": f"broom_{n}", "at": list(cell)} for n, cell in enumerate(cells, 1)
    ]
    return World(Level.from_dict({"id": "inside", "map": rows, "things": things}))


@pytest.mark.parametrize("way", sorted(STRAW_WAYS))
def test_in_the_straw_find_all_gives_each_broom_left_of_and_not_above_the_one_before(way):
    cells = STRAW_WAYS[way]
    world = inside((11, 6), cells[::-1])
    found = [tuple(broom.position) for broom in world.wizard.find_all("broom")]
    assert found == cells
    for before, after in zip([(11, 6), *found], found, strict=False):
        assert after[0] < before[0] and after[1] >= before[1]


@pytest.mark.parametrize("way", sorted(CHECK_WAYS))
def test_in_the_check_find_all_gives_each_broom_right_of_and_not_below_the_one_before(way):
    cells = CHECK_WAYS[way]
    world = inside((6, 8), cells[::-1])
    found = [tuple(broom.position) for broom in world.wizard.find_all("broom")]
    assert found == cells
    distances = [abs(x - 6) + abs(y - 8) for x, y in found]
    assert distances == sorted(distances)
    for before, after in zip([(6, 8), *found], found, strict=False):
        assert after[0] >= before[0] and after[1] <= before[1]


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
