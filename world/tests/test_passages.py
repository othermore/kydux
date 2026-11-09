"""Chapter 3's world: a level played in several ways (D51), dark rooms and kirra
(D52), holes that open in the floor and osto (D53, D167), the map and orvim (D134), the
enchanted region (D135), a teacher started anywhere on its patrol (D137), and a
door found as any thing."""

import json
from pathlib import Path

import pytest
from kydux_world.level import Level, LevelError, Position, on_scene, read_scene
from kydux_world.run import check_consistency, run_code
from kydux_world.things import HOLD_TICKS
from kydux_world.world import World

#: A corridor with a door; in one way it is locked, in the other it is not.
DOOR = {
    "id": "door_ways",
    "map": ["#######", "#S.D.E#", "#######"],
    "things": [{"kind": "door", "id": "door", "marker": "D"}],
    "goals": [{"kind": "reach", "marker": "E"}],
    "ways": [{"id": "open"}, {"id": "locked", "things": [{"id": "door", "locked": True}]}],
}


def test_each_way_is_the_level_with_its_changes_merged_by_id():
    level = Level.from_dict(DOOR)
    assert [way_id for way_id, _ in level.ways] == ["open", "locked"]
    assert not level.way("open").things[0].locked
    assert level.way("locked").things[0].locked
    assert level.way("locked").things[0].position == Position(3, 1)


def test_a_run_is_won_only_when_every_way_is_and_shows_the_first_not_won():
    level = Level.from_dict(DOOR)
    walks = run_code(level, "wizard.move_right()\ndoor.open()\nwizard.move_right(3)\n")
    assert [(w, r.status) for w, r in walks.ways] == [("open", "won"), ("locked", "incomplete")]
    assert walks.status == "incomplete" and walks.way == "locked"
    assert walks.to_dict()["way"] == "locked"
    assert [w["id"] for w in walks.to_dict()["ways"]] == ["open", "locked"]


def test_a_program_that_wins_every_way_wins_and_shows_the_first():
    level = Level.from_dict(
        {**DOOR, "ways": [{"id": "open"}, {"id": "also_open", "things": [{"id": "door"}]}]}
    )
    result = run_code(level, "wizard.move_right()\ndoor.open()\nwizard.move_right(3)\n")
    assert result.status == "won" and result.way == "open"


@pytest.mark.parametrize(
    ("ways", "says"),
    [
        ([{"id": "one"}], "two ways or more"),
        ([{"id": "one"}, {"id": "one"}], "an id of its own"),
        ([{"id": "one"}, {"id": "two", "map": ["#"]}], "cannot change map"),
        ([{"id": "one"}, {"id": "two", "things": [{"id": "ghost"}]}], "changes ghost"),
    ],
)
def test_the_loader_refuses_ways_that_cannot_be(ways, says):
    with pytest.raises(LevelError, match=says):
        Level.from_dict({**DOOR, "ways": ways})


#: A dark room with the key in a corner, far from the wizard.
DARK = {
    "id": "dark",
    "map": ["#######", "#S....#", "#.....#", "#....K#", "#######"],
    "dark": True,
    "spells": ["kirra"],
    "carrying": ["wand"],
    "things": [{"kind": "key", "id": "key", "marker": "K"}],
}


def test_the_dark_hides_what_lies_far_from_the_wizard_until_kirra_lights_it():
    world = World(Level.from_dict(DARK))
    key = world.things["key"]
    assert key.position is None and world.wizard.find_nearest("key") is None
    world.wizard.cast("kirra")
    cast, light = world.events[-2:]
    assert [(cast.actor, cast.kind), (light.actor, light.kind)] == [
        ("wizard", "cast"),
        ("world", "light"),
    ]
    assert key.position == Position(5, 3)
    assert world.wizard.find_nearest("key") is key
    check_consistency(world)


def test_in_the_dark_the_wizard_sees_the_tiles_around_it():
    world = World(Level.from_dict(DARK))
    world.wizard.move_right(3)
    world.wizard.move_down()
    assert world.things["key"].position == Position(5, 3)


def test_a_dark_level_needs_kirra_to_collect_or_open_what_lies_in_the_dark():
    # What the wizard must find in the dark is not seen until kirra lights it (D162).
    for goal in ({"kind": "collect", "id": "key"}, {"kind": "collect", "of": "key"}):
        with pytest.raises(LevelError, match="needs kirra"):
            Level.from_dict({**DARK, "spells": [], "goals": [goal]})
    door = {"kind": "door", "id": "door", "at": [2, 2]}
    with pytest.raises(LevelError, match="needs kirra"):
        Level.from_dict(
            {**DARK, "spells": [], "things": [door], "goals": [{"kind": "open", "id": "door"}]}
        )


def test_a_dark_level_whose_goals_lie_outside_the_dark_or_are_a_reach_needs_no_kirra():
    # A reach needs no sight, and a key outside the dark rooms is seen (D162).
    reach = Level.from_dict(
        {
            **DARK,
            "spells": [],
            "map": ["#######", "#S....#", "#....E#", "#....K#", "#######"],
            "goals": [{"kind": "reach", "marker": "E"}],
        }
    )
    assert reach.dark and "kirra" not in reach.spells
    outside = Level.from_dict(
        {
            **DARK,
            "spells": [],
            "dark_area": [[1, 1, 3, 3]],
            "goals": [{"kind": "collect", "id": "key"}],
        }
    )
    assert outside.dark and outside.dark_area


#: A hole in the floor, closed two ticks and open two, from tick 0 (D53, D167).
HOLES = {
    "id": "holes",
    "map": ["#######", "#S.T.E#", "#######"],
    "spells": ["osto"],
    "carrying": ["wand"],
    "things": [{"kind": "hole", "id": "hole", "marker": "T", "period": 2}],
    "goals": [{"kind": "reach", "marker": "E"}],
}

#: A hole across a corridor two cells wide, on (3, 1) and (3, 2) (D167).
WIDE_HOLE = {
    "id": "wide_hole",
    "map": ["#######", "#S....#", "#.....#", "#######"],
    "spells": ["osto"],
    "carrying": ["wand"],
    "things": [
        {"kind": "hole", "id": "hole", "at": [3, 1], "cells": [[3, 1], [3, 2]], "period": 2}
    ],
    "goals": [{"kind": "reach", "at": [5, 2]}],
}


def test_a_hole_is_closed_for_its_period_and_open_for_as_long():
    hole = World(Level.from_dict(HOLES)).things["hole"]
    assert [hole._k_closed_at(t) for t in range(6)] == [True, True, False, False, True, True]


def test_a_hole_is_open_exactly_when_it_is_not_closed():
    world = World(Level.from_dict(HOLES))
    hole = world.things["hole"]
    for _ in range(8):
        assert hole.open is not hole.closed
        world.wizard.wait()


def test_a_step_onto_an_open_hole_bumps():
    world = World(Level.from_dict(HOLES))
    world.wizard.move_right()
    world.wizard.wait()
    assert world.things["hole"].open
    world.wizard.move_right()
    assert world.events[-1].kind == "bump" and world.events[-1].data["by"] == "hole"


@pytest.mark.parametrize("loop", ["while not hole.closed:", "while hole.open:"])
def test_waiting_while_the_hole_is_open_gets_the_wizard_across(loop):
    code = f"wizard.move_right()\nwizard.wait()\n{loop}\n    wizard.wait()\nwizard.move_right(3)\n"
    assert run_code(Level.from_dict(HOLES), code).status == "won"


def test_osto_holds_the_hole_closed_from_the_next_tick_it_is_closed():
    world = World(Level.from_dict(HOLES))
    world.wizard.move_right()
    world.wizard.cast("osto")
    hold = world.events[-1]
    assert (hold.actor, hold.kind) == ("hole", "hold")
    # Cast in tick 2; the hole is open in tick 3 and closed again in tick 4.
    assert hold.data == {"id": "hole", "from": 4, "until": 4 + HOLD_TICKS}
    world.wizard.wait(2)
    assert world.things["hole"].closed
    check_consistency(world)


def test_osto_with_no_hole_beside_is_refused():
    world = World(Level.from_dict(HOLES))
    world.wizard.cast("osto")
    assert world.events[-1].data["reason"] == "nothing_near"


@pytest.mark.parametrize("row", [1, 2])
def test_a_hole_of_two_cells_bumps_on_either_while_open(row):
    world = World(Level.from_dict(WIDE_HOLE))
    if row == 2:
        world.wizard.move_down()
    world.wizard.move_right()
    assert world.things["hole"].open
    world.wizard.move_right()
    assert world.events[-1].kind == "bump" and world.events[-1].data["by"] == "hole"
    assert world.wizard.position == (2, row)


@pytest.mark.parametrize("row", [1, 2])
def test_osto_holds_a_hole_of_two_cells_from_beside_either(row):
    world = World(Level.from_dict(WIDE_HOLE))
    if row == 2:
        world.wizard.move_down()
    world.wizard.move_right()
    world.wizard.cast("osto")
    assert world.events[-1].kind == "hold"
    world.wizard.wait()
    assert world.things["hole"].closed
    world.wizard.move_right(3)
    assert world.wizard.position == (5, row)


def test_both_cells_of_a_hole_open_and_close_together():
    world = World(Level.from_dict(WIDE_HOLE))
    for _ in range(6):
        assert world.is_free(Position(3, 1)) == world.is_free(Position(3, 2))
        world.wizard.wait()


def test_a_hole_s_cells_are_one_or_two_side_by_side():
    hole = {"kind": "hole", "id": "hole", "at": [3, 1], "period": 2}
    with pytest.raises(LevelError, match="not side by side"):
        Level.from_dict({**WIDE_HOLE, "things": [{**hole, "cells": [[3, 1], [4, 2]]}]})
    with pytest.raises(LevelError, match="one cell or two"):
        three = [[3, 1], [3, 2], [4, 2]]
        Level.from_dict({**WIDE_HOLE, "things": [{**hole, "cells": three}]})


def test_a_hole_has_a_whole_period_and_nothing_else_does():
    with pytest.raises(LevelError, match="whole period"):
        Level.from_dict({**HOLES, "things": [{"kind": "hole", "id": "h", "marker": "T"}]})
    with pytest.raises(LevelError, match="whole period"):
        key = {"kind": "key", "id": "k", "marker": "T", "period": 2}
        Level.from_dict({**HOLES, "things": [key]})


#: A hole that never closes on its own, a dark portal open at every tick (D178).
PORTAL = {**HOLES, "things": [{"kind": "hole", "id": "hole", "marker": "T", "period": 0}]}


def test_a_hole_of_period_0_is_open_at_every_tick_until_osto_holds_it():
    """D178: open at ticks 0 to 20; held closed from the tick after osto, for
    HOLD_TICKS; open again after."""
    world = World(Level.from_dict(PORTAL))
    hole = world.things["hole"]
    assert not any(hole._k_closed_at(tick) for tick in range(21))
    world.wizard.move_right()
    world.wizard.cast("osto")
    hold = world.events[-1]
    # Cast in tick 2, held from tick 3.
    assert (hold.kind, hold.data) == ("hold", {"id": "hole", "from": 3, "until": 3 + HOLD_TICKS})
    assert [hole._k_closed_at(tick) for tick in (2, 3, 2 + HOLD_TICKS, 3 + HOLD_TICKS)] == [
        False,
        True,
        True,
        False,
    ]
    check_consistency(world)


def test_a_step_onto_a_hole_of_period_0_bumps_and_lands_while_it_is_held():
    world = World(Level.from_dict(PORTAL))
    world.wizard.move_right()
    world.wizard.wait(5)
    world.wizard.move_right()
    assert world.events[-1].kind == "bump" and world.events[-1].data["by"] == "hole"
    world.wizard.cast("osto")
    world.wizard.move_right(3)
    assert world.wizard.position == (5, 1)
    assert (
        run_code(
            Level.from_dict(PORTAL),
            'wizard.move_right()\nwizard.cast("osto")\nwizard.move_right(3)\n',
        ).status
        == "won"
    )


def test_waiting_for_a_hole_of_period_0_to_close_never_ends():
    """No wait gets across a hole that never closes on its own: the run ends at its
    tick limit."""
    code = "wizard.move_right()\nwhile not hole.closed:\n    wizard.wait()\nwizard.move_right(3)\n"
    assert run_code(Level.from_dict({**PORTAL, "tick_limit": 30}), code).status == "too_many_ticks"


def test_a_cast_goal_is_met_by_the_spell_cast_and_not_by_a_word_refused():
    """D176: *The doors' corridor*'s bonus is the map's spell cast; a misspelt spell is
    refused, and the run is won without it."""
    level = real("the-doors-corridor")
    walk = "wizard.move_right(14)\nwizard.move_up(9)\n"
    for spell, bonus in (("orvin", False), ("orvim", True)):
        result = run_code(level, f'wizard.cast("{spell}")\n{walk}')
        assert result.status == "won"
        (cast,) = [goal for goal in result.goals if goal.kind == "cast"]
        assert (cast.bonus, cast.met) == (True, bonus), spell
    with pytest.raises(LevelError, match="no spell"):
        World(
            Level.from_dict({**MAP, "goals": [*MAP["goals"], {"kind": "cast", "spell": "abra"}]})
        )


#: A corridor the map's spell may be cast in (D134).
MAP = {
    "id": "the_map",
    "map": ["#####", "#S.E#", "#####"],
    "spells": ["orvim"],
    "carrying": ["wand", "map"],
    "goals": [{"kind": "reach", "marker": "E"}],
}


def test_orvim_takes_a_tick_and_makes_the_world_s_map_event():
    world = World(Level.from_dict(MAP))
    world.wizard.cast("orvim")
    assert world.tick == 1
    cast, shown = world.events[-2:]
    assert (cast.actor, cast.kind, cast.data["spell"]) == ("wizard", "cast", "orvim")
    assert (shown.actor, shown.kind, shown.data) == ("world", "map", {"at": [1, 1]})
    check_consistency(world)


def test_orvim_with_no_map_is_refused_and_with_no_wand_the_wand_is_what_is_missing():
    no_map = World(Level.from_dict({**MAP, "carrying": ["wand"]}))
    no_map.wizard.cast("orvim")
    assert no_map.events[-1].kind == "blocked" and no_map.events[-1].data["reason"] == "no_map"
    no_wand = World(Level.from_dict({**MAP, "carrying": ["map"]}))
    no_wand.wizard.cast("orvim")
    assert no_wand.events[-1].data["reason"] == "no_wand"


def test_the_map_s_spell_works_wherever_the_map_is_carried_needed_or_not():
    level = {**MAP, "spells": []}
    world = World(Level.from_dict(level))
    world.wizard.cast("orvim")
    assert world.events[-1].kind == "map"
    # Another spell the level does not name stays unknown, and with no map so does this one.
    world = World(Level.from_dict(level))
    world.wizard.cast("kirra")
    assert world.events[-1].data["reason"] == "unknown_spell"
    world = World(Level.from_dict({**level, "carrying": ["wand"]}))
    world.wizard.cast("orvim")
    assert world.events[-1].data["reason"] == "unknown_spell"


@pytest.mark.parametrize(
    "item",
    [
        item.removeprefix("level:")
        for item in json.loads(
            (
                Path(__file__).resolve().parents[2]
                / "content"
                / "chapters"
                / "03-passages"
                / "chapter.json"
            ).read_text(encoding="utf-8")
        )["items"]
        if item.startswith("level:")
    ],
)
def test_the_map_opens_in_every_level_of_chapter_3(item):
    level = Level.from_directory(Path(__file__).resolve().parents[2] / "content" / "levels" / item)
    result = run_code(level, 'wizard.cast("orvim")')
    assert any(event.kind == "map" for event in result.events)


def test_the_map_is_carried_and_put_in_no_name():
    world = World(Level.from_dict(MAP))
    assert world.wizard.has("map") and world.wizard.find_item("map").kind == "map"
    assert "map" not in world.namespace()


def test_a_hidden_reach_needs_no_marker_and_says_it_is_hidden():
    level = Level.from_dict(
        {
            "id": "hidden",
            "map": ["#####", "#S..#", "#####"],
            "goals": [{"kind": "reach", "at": [3, 1], "hidden": True}],
        }
    )
    result = run_code(level, "wizard.move_right(2)\n")
    assert result.status == "won"
    assert result.goals[0].params["hidden"] is True


def enchanted_scene(tmp_path, enchanted):
    folder = tmp_path / "corridor"
    folder.mkdir()
    (folder / "map.txt").write_text("#####\n#...#\n#####\n")
    (folder / "scene.json").write_text(json.dumps({"enchanted": enchanted}))
    return read_scene(tmp_path, "corridor")


def test_a_scene_names_its_enchanted_boxes_and_a_level_on_it_hands_them_to_the_page(tmp_path):
    scene = enchanted_scene(tmp_path, [[2, 1, 3, 1]])
    built = on_scene({"id": "here", "scene": "corridor", "start": [1, 1]}, scene)
    assert built["enchanted"] == [[2, 1, 3, 1]]
    # The world is not changed: the wizard walks it as any floor, and knows where it is.
    world = World(Level.from_dict(built))
    world.wizard.move_right(2)
    assert world.wizard.position == Position(3, 1)


def test_an_enchanted_cell_is_floor(tmp_path):
    with pytest.raises(LevelError, match="enchanted cell 4,1 is not floor"):
        enchanted_scene(tmp_path, [[3, 1, 4, 1]])


def patrolled(rows, actor, goals=()):
    return Level.from_dict(
        {"id": "round", "map": rows, "actors": [actor], "goals": list(goals), "carrying": ["wand"]}
    )


def walk_of(actor, ticks, rows=None):
    """Where an actor stands, and the way it faces, after each tick of a wizard waiting."""
    world = World(patrolled(rows or ROUND, {"kind": "teacher", "id": "dask", **actor}))
    seen = []
    for _ in range(ticks):
        world.wizard.wait()
        seen.append((world.actors["dask"].position.x, world.actors["dask"].facing))
    return seen


#: A long row for a round, the wizard waiting out of its sight.
ROUND = ["###########", "#.........#", "###########", "#S#########", "###########"]


def test_a_teacher_may_start_on_its_patrol_walking_the_way_it_faces():
    actor = {"patrol": [[2, 1], [7, 1]], "sight": 1}
    assert walk_of({**actor, "at": [6, 1], "facing": "right"}, 4) == [
        (7, "right"),
        (7, "left"),
        (6, "left"),
        (5, "left"),
    ]
    assert walk_of({**actor, "at": [5, 1], "facing": "left"}, 5) == [
        (4, "left"),
        (3, "left"),
        (2, "left"),
        (2, "right"),
        (3, "right"),
    ]


def test_a_patrol_from_the_teacher_s_own_tile_is_as_it_always_was():
    assert walk_of({"at": [2, 1], "patrol": [[2, 1], [4, 1]], "facing": "right"}, 3) == walk_of(
        {"at": [2, 1], "patrol": [[4, 1]], "facing": "right"}, 3
    )


@pytest.mark.parametrize(
    ("actor", "says"),
    [
        ({"at": [8, 1], "patrol": [[2, 1], [7, 1]], "facing": "left"}, "stands off its patrol"),
        ({"at": [5, 1], "patrol": [[2, 1], [7, 1]], "facing": "up"}, "must face along"),
        ({"at": [5, 1], "patrol": [[2, 1], [7, 1]]}, "must face along"),
    ],
)
def test_a_teacher_started_elsewhere_stands_on_its_path_and_faces_along_it(actor, says):
    with pytest.raises(LevelError, match=says):
        patrolled(ROUND, {"kind": "teacher", "id": "dask", **actor})


def round_level(at, facing, row, patrol, sight):
    """A corridor along `row`, crossed by column 10 from the top to the bottom, with a
    teacher on it, as the long round and the way down are (D137)."""
    width, height = 14, 16
    rows = []
    for y in range(height):
        line = ""
        for x in range(width):
            floor = x == 10 or (y == row and x <= 10)
            line += "S" if (x, y) == (10, 1) else "." if floor else "#"
        rows.append(line)
    actor = {"kind": "teacher", "id": "dask", "at": at, "facing": facing}
    return Level.from_dict(
        {
            "id": "round",
            "map": rows,
            "actors": [{**actor, "patrol": patrol, "sight": sight}],
            "goals": [{"kind": "reach", "at": [10, 13]}, {"kind": "not_seen_by", "id": "dask"}],
        }
    )


def unsafe_ticks(level, cell_row, ticks):
    """The ticks a teacher sees the crossing cell of column 10 on `cell_row`."""
    world = World(level)
    found = []
    for tick in range(1, ticks + 1):
        world.wizard._set(position=Position(13, 1))
        world.tick = tick - 1
        for actor in world.actors.values():
            actor._step()
        if Position(10, cell_row) in world.actors["dask"]._k_seen():
            found.append(tick)
    return found


@pytest.mark.parametrize(
    ("at", "facing", "unsafe"),
    [
        ([2, 7], "right", [*range(1, 6), *range(13, 18)]),
        ([6, 7], "right", [1, *range(9, 14), 21]),
        ([5, 7], "left", [*range(5, 10), *range(17, 22)]),
    ],
)
def test_the_long_round_s_three_ways_keep_their_tick_table(at, facing, unsafe):
    level = round_level(at, facing, 7, [[2, 7], [7, 7]], 7)
    assert unsafe_ticks(level, 7, 21) == unsafe


@pytest.mark.parametrize(
    ("at", "facing", "unsafe"),
    [
        ([1, 10], "right", [*range(1, 8), *range(17, 24)]),
        ([6, 10], "right", [*range(1, 3), *range(12, 19), 28, 29]),
        ([5, 10], "left", [*range(6, 13), *range(22, 29)]),
    ],
)
def test_the_way_down_s_three_ways_keep_their_tick_table(at, facing, unsafe):
    level = round_level(at, facing, 10, [[1, 10], [8, 10]], 8)
    assert unsafe_ticks(level, 10, 29) == unsafe


def test_find_nearest_finds_the_nearest_door_and_it_answers_open():
    level = Level.from_dict(
        {
            "id": "doors",
            "map": ["#.#", "#A#", "#.#", "#B#", "#.#", "#S#", "###"],
            "things": [
                {"kind": "door", "id": "far_door", "marker": "A"},
                {"kind": "door", "id": "near_door", "marker": "B"},
            ],
        }
    )
    world = World(level)
    wizard = world.wizard
    wizard.move_up()
    door = wizard.find_nearest("door")
    assert door.name == "near_door"
    door.open()
    assert door.is_open
    wizard.move_up(2)
    assert wizard.find_nearest("door").name in ("near_door", "far_door")


CONTENT = Path(__file__).resolve().parents[2] / "content" / "levels"


def real(level_id):
    return Level.from_directory(CONTENT / level_id)


def solution(level_id):
    return (CONTENT / level_id / "solution.py").read_text(encoding="utf-8")


def wrong(level_id, name):
    return (CONTENT / level_id / "wrong" / f"{name}.py").read_text(encoding="utf-8")


def outcomes(level_id, code):
    result = run_code(real(level_id), code)
    return dict((way_id, way.status) for way_id, way in result.ways)


def test_the_tunnel_exit_is_won_by_waiting_two_ticks_for_dask_to_go_by():
    """D146, D154: Dask starts below the crossing, walking up it, a cell a tick; he sees
    (9, 6), the gallery's first floor row, from (9, 10) to (9, 7), ticks 2 to 5, stands
    on it at tick 6, and is above it from tick 7, when the wizard reaches it from (4, 6)
    after two ticks of waiting and five steps."""
    level = "the-tunnel-exit"
    assert run_code(real(level), solution(level)).status == "won"
    alone = run_code(real(level), wrong(level, "the_walk_alone"))
    assert (alone.status, alone.ticks) == ("caught", 5)
    one = run_code(real(level), wrong(level, "waits_one"))
    assert (one.status, one.ticks) == ("caught", 6)
    assert run_code(real(level), wrong(level, "stops_short")).status == "incomplete"


def test_the_tunnel_exit_keeps_dask_s_ticks():
    world = World(real("the-tunnel-exit"))
    for tick in range(1, 12):
        world.wizard.wait()
        dask = world.actors["dask"]
        assert (dask.position.x, dask.position.y) == (9, 12 - tick), tick
        assert dask.facing == "up"


def test_by_the_statues_is_won_above_or_below_dask_with_one_if():
    """D146, D154: Dask stands still on the gallery's middle row, between the first two
    statues, which stand on that row too; looking up, the wizard goes down two and passes
    below him, behind the lower wall's top, and looking down it crosses straight above
    him, behind the statues. The mark is met on the way, two cells before the walk ends in
    the first way."""
    level = "by-the-statues"
    won = run_code(real(level), solution(level))
    assert dict((way, result.status) for way, result in won.ways) == {
        "looking_up": "won",
        "looking_down": "won",
    }
    ends = dict((way, tuple(result.events[-1].data.get("to", ()))) for way, result in won.ways)
    assert ends == {"looking_up": (15, 10), "looking_down": (15, 8)}
    assert outcomes(level, wrong(level, "the_walk_alone")) == {
        "looking_up": "caught",
        "looking_down": "won",
    }
    assert outcomes(level, wrong(level, "down_two_always")) == {
        "looking_up": "won",
        "looking_down": "caught",
    }
    assert set(outcomes(level, wrong(level, "the_condition_on_down")).values()) == {"caught"}
    assert run_code(real(level), wrong(level, "the_body_not_moved_in")).error.type == (
        "IndentationError"
    )


def test_by_the_statues_gives_its_bonus_for_ending_right_on_the_mark_with_a_second_if():
    """The owner: optional. One `if` wins, walking on past the mark when Dask looks up; a
    second one, for when he looks down, ends on the mark in both ways."""
    level = "by-the-statues"

    def bonuses(code: str) -> dict[str, bool]:
        result = run_code(real(level), code)
        assert result.status == "won"
        return {way: [g.met for g in one.goals if g.bonus] == [True] for way, one in result.ways}

    assert bonuses(solution(level)) == {"looking_up": False, "looking_down": True}
    two = (
        'if dask.facing == "up":\n    wizard.move_down(2)\nwizard.move_right(4)\n'
        'if dask.facing == "down":\n    wizard.move_down(2)\n'
    )
    assert bonuses(two) == {"looking_up": True, "looking_down": True}


@pytest.mark.parametrize(
    ("level_id", "before", "walk", "most"),
    [
        ("past-the-teacher", "wizard.move_down(4)\n", "wizard.move_down(7)\n", 12),
        (
            "the-night-walk",
            "wizard.move_down()\nwizard.pick_up()\nwizard.move_down()\ndoor.open()\n"
            'wizard.move_down(2)\nwizard.cast("osto")\nwizard.move_down(3)\n',
            "wizard.move_down(4)\n",
            16,
        ),
    ],
)
def test_no_fixed_number_of_waits_wins_every_way_and_the_while_does(level_id, before, walk, most):
    """D137: a program that waits a number written in the code is caught in some way,
    for every number; the loop on `facing` wins them all."""
    for ticks in range(most + 1):
        wait = f"wizard.wait({ticks})\n" if ticks else ""
        statuses = outcomes(level_id, before + wait + walk)
        assert "caught" in statuses.values(), (ticks, statuses)
    assert set(outcomes(level_id, solution(level_id)).values()) == {"won"}


def test_the_hole_s_level_is_won_in_its_four_periods_and_a_fixed_wait_loses_one():
    level = "the-opening-hole"
    assert set(outcomes(level, solution(level)).values()) == {"won"}
    assert outcomes(level, wrong(level, "waits_three")) == {
        "three": "won",
        "four": "incomplete",
        "five": "incomplete",
        "seven": "won",
    }
    walk = run_code(real(level), wrong(level, "the_walk_alone"))
    bumps = [e for e in walk.events if e.kind == "bump"]
    assert bumps and bumps[0].data["by"] == "hole"


def test_the_hole_s_level_is_won_waiting_while_it_is_open_as_well():
    """D167: `while hole.open:` and `while not hole.closed:` are the same wait; the
    solution uses the second, and a program with the first wins the four ways too, with
    its bonus unmet, since the bonus asks `closed`."""
    level = "the-opening-hole"
    code = solution(level).replace("while not hole.closed:", "while hole.open:")
    assert "while hole.open:" in code
    result = run_code(real(level), code)
    assert result.status == "won"
    for way, one in result.ways:
        assert [g.met for g in one.goals if g.bonus] == [False], way
    for way, one in run_code(real(level), solution(level)).ways:
        assert [g.met for g in one.goals if g.bonus] == [True], way


def test_the_hole_s_level_plays_with_the_storeroom_dark_and_needs_no_light():
    """D162: the storeroom is dark in the hole's level, before the level that lights it;
    the mark beyond the hole lies in the dark, and a reach needs no kirra."""
    level = real("the-opening-hole")
    for way, one in (("", level), *level.ways):
        assert one.dark and Position(5, 7) in one.dark_area, way
        assert one.markers["E"] in one.dark_area and "kirra" not in one.spells, way
        assert one.start not in one.dark_area, way
    assert set(outcomes("the-opening-hole", solution("the-opening-hole")).values()) == {"won"}


def test_no_fixed_wait_a_child_finds_by_trial_crosses_the_hole_in_every_period():
    """The owner, 2026-11-08: the periods 3, 4, 5 and 7 share no tick a fixed wait could
    hit in all four below 29, so the loop on `closed` is what wins."""
    level = "the-opening-hole"
    for ticks in range(29):
        wait = f"wizard.wait({ticks})\n" if ticks else ""
        statuses = outcomes(level, f"wizard.move_right(2)\n{wait}wizard.move_right(3)\n")
        assert set(statuses.values()) != {"won"}, ticks
    code = "wizard.move_right(2)\nwizard.wait(29)\nwizard.move_right(3)\n"
    assert set(outcomes(level, code).values()) == {"won"}


def test_the_way_down_s_hole_takes_both_cells_of_the_corridor():
    """D167: the way down's hole lies on (10, 7) and (9, 7), as it is painted, so that no
    one walks round it: a program that walks down column 9 bumps on it, open as it always
    is (D178), and crosses it held by osto."""
    level = real("the-night-walk")
    hole = next(thing for thing in level.things if thing.id == "hole")
    assert set(hole.cells) == {Position(9, 7), Position(10, 7)}
    # The friends stand on (9, 2) and (9, 3): the wizard steps into column 9 at the door.
    to_the_edge = (
        "wizard.move_down()\nwizard.pick_up()\nwizard.move_down()\ndoor.open()\n"
        "wizard.move_left()\nwizard.move_down(2)\n"
    )
    wait_open = "while hole.closed:\n    wizard.wait()\n"
    walked = run_code(level, to_the_edge + wait_open + "wizard.move_down()\n")
    bumps = [e.data for e in walked.events if e.kind == "bump"]
    assert bumps == [{"at": [9, 6], "facing": "down", "by": "hole"}]
    crossed = run_code(level, to_the_edge + 'wizard.cast("osto")\nwizard.move_down(3)\n')
    walks = [e.data["to"] for e in crossed.events if e.kind == "move" and e.actor == "wizard"]
    assert walks[-3:] == [
        [9, 7],
        [9, 8],
        [9, 9],
    ]


def test_in_the_dark_the_key_is_not_found_until_kirra():
    result = run_code(real("the-dark-room"), wrong("the-dark-room", "no_kirra"))
    assert result.status == "error"
    world = World(real("the-dark-room"))
    assert world.wizard.find_nearest("key") is None
    world.wizard.cast("kirra")
    assert world.wizard.find_nearest("key").position == Position(9, 7)


def test_the_three_doors_each_nearest_as_the_wizard_comes_to_it():
    world = World(real("the-three-doors"))
    wizard = world.wizard
    for name, standing in (("door_1", (10, 12)), ("door_2", (10, 8)), ("door_3", (10, 4))):
        assert wizard.position == Position(*standing)
        door = wizard.find_nearest("door")
        assert door.name == name
        door.open()
        wizard.move_up(4)
    assert wizard.position == Position(10, 0)


def test_the_three_doors_given_program_wins_the_walk_and_fails_its_lines():
    result = run_code(real("the-three-doors"), wrong("the-three-doors", "the_given_program"))
    assert result.status != "won"
    goals = {goal.kind: goal.met for goal in result.goals}
    assert goals == {"reach": True, "lines_under": False}


def test_a_position_is_printed_as_the_child_reads_it():
    result = run_code(real("the-dark-tunnel"), "print(wizard.position)\n")
    assert result.stdout == "(14, 2)\n"


def test_the_dark_room_is_won_by_the_two_numbers_wherever_the_key_lies():
    """D153: the key on three cells, always right of and not above the wizard; the
    same program computes the steps in each, and no count written in the code does."""
    level = "the-dark-room"
    assert set(outcomes(level, solution(level)).values()) == {"won"}
    assert outcomes(level, wrong(level, "the_counts_typed")) == {
        "same_row": "won",
        "lower": "incomplete",
        "farther": "incomplete",
    }
    assert set(outcomes(level, wrong(level, "x_and_y_swapped")).values()) == {"incomplete"}
    assert set(outcomes(level, wrong(level, "opened_from_afar")).values()) == {"incomplete"}
    assert set(outcomes(level, wrong(level, "no_pick_up")).values()) == {"incomplete"}
    assert run_code(real(level), wrong(level, "no_kirra")).error.type == "AttributeError"


@pytest.mark.parametrize(
    ("way", "right", "down"), [("same_row", 4, 0), ("lower", 3, 1), ("farther", 5, 1)]
)
def test_the_dark_room_s_differences_are_never_below_zero(way, right, down):
    code = (
        'wizard.cast("kirra")\nkey = wizard.find_nearest("key")\n'
        "print(key.position.x - wizard.position.x, key.position.y - wizard.position.y)\n"
    )
    assert run_code(real("the-dark-room").way(way), code).stdout == f"{right} {down}\n"


def test_the_storeroom_s_open_leaf_keeps_everyone_off_the_cell_it_stands_on():
    """The owner, 2026-11-08: the storeroom's door, open, covers (9, 13) as well as
    (9, 11) and (9, 12) (D125, D157): a step onto it from beside is refused."""
    level = "the-dark-room"
    code = solution(level) + "wizard.move_down(4)\nwizard.move_left()\n"
    for way, one in run_code(real(level), code).ways:
        blocked = [e.data for e in one.events if e.kind == "blocked"]
        assert blocked[-1]["at"] == [10, 13] and blocked[-1]["reason"] == "door_leaf", way
        assert blocked[-1]["facing"] == "left", way


def test_a_move_of_no_steps_walks_nothing_where_the_key_lies_on_our_row():
    level = real("the-dark-room").way("same_row")
    result = run_code(level, solution("the-dark-room"))
    assert result.status == "won"
    assert all(event.data.get("to") != [5, 8] for event in result.events)


def test_the_dark_tunnel_starts_where_the_child_cannot_know_and_names_no_cell():
    """D152: its start is not where the level before ended, and its goal hides the exit."""
    level = real("the-dark-tunnel")
    assert level.start != real("the-doors-corridor").goals[0].params.get("at")
    assert run_code(level, solution("the-dark-tunnel")).status == "won"
    assert [g.params.get("hidden") for g in level.goals if g.kind == "reach"] == [True]
    assert "orvim" in level.spells


def test_the_hole_cannot_be_walked_round_on_the_corridor_s_lower_row():
    """D149: the row behind the lower wall is walked, and it stops at the hole's cell. The
    friends stand on (0, 8) and (1, 8), so the wizard goes down at the hole's edge."""
    level = "the-opening-hole"
    around = "wizard.move_right(2)\nwizard.move_down()\nwizard.move_right(3)\n"
    result = run_code(real(level), around)
    for way, one in result.ways:
        assert one.status == "incomplete", way
        moves = [tuple(e.data["to"]) for e in one.events if e.kind == "move"]
        assert moves[-1] == (2, 8), way
        assert [e.data["at"] for e in one.events if e.kind == "bump"] == [[2, 8]], way


def test_no_level_of_the_first_three_chapters_teaches_can_see():
    """D139: when `can_see` is true the wizard is already caught; it stays for the
    challenges."""
    chapters = Path(__file__).resolve().parents[2] / "content" / "chapters"
    for name in ("01-arrival", "02-the-library", "03-passages"):
        items = json.loads((chapters / name / "chapter.json").read_text(encoding="utf-8"))["items"]
        for item in items:
            kind, _, item_id = item.partition(":")
            if kind == "level":
                assert "teacher.can_see" not in real(item_id).api, item_id


#: A doorway two cells wide across a room (D150), with its door shut.
WIDE = {
    "id": "wide_door",
    "map": ["#########", "#..S....#", "###..####", "#......E#", "#########"],
    "things": [{"kind": "door", "id": "door", "at": [3, 2], "cells": [[3, 2], [4, 2]]}],
    "goals": [{"kind": "reach", "marker": "E"}],
}


@pytest.mark.parametrize("walk", ["wizard.move_down()", "wizard.move_right()\nwizard.move_down()"])
def test_a_shut_door_blocks_every_cell_of_its_doorway(walk):
    world = World(Level.from_dict(WIDE))
    result = run_code(Level.from_dict(WIDE), walk)
    assert world.door_at(Position(3, 2)) is world.door_at(Position(4, 2)) is not None
    assert result.status == "incomplete"
    assert any(event["kind"] == "bump" for event in result.to_dict()["events"])


@pytest.mark.parametrize("column", [0, 1], ids=["first cell", "second cell"])
def test_a_door_opens_from_beside_any_cell_and_frees_them_all(column):
    walk = (
        f"wizard.move_right({column})\ndoor.open()\n"
        f"wizard.move_down(2)\nwizard.move_right({4 - column})\n"
    )
    result = run_code(Level.from_dict(WIDE), walk)
    assert result.status == "won"


def test_a_door_cannot_be_opened_from_a_cell_of_no_side_of_it():
    result = run_code(Level.from_dict(WIDE), "wizard.move_left()\ndoor.open()\n")
    blocked = [e for e in result.to_dict()["events"] if e["kind"] == "blocked"]
    assert blocked and blocked[0]["data"]["reason"] == "far"


@pytest.mark.parametrize(
    ("cells", "says"),
    [
        ([[3, 2], [1, 1]], "not side by side"),
        ([[3, 2], [2, 2]], "not floor"),
        ([[4, 2], [3, 2]], "first cell"),
        ([], "a list of"),
    ],
)
def test_the_loader_refuses_a_door_whose_cells_cannot_be(cells, says):
    door = {**WIDE["things"][0], "cells": cells}
    with pytest.raises(LevelError, match=says):
        Level.from_dict({**WIDE, "things": [door]})


def test_only_a_door_or_a_hole_has_cells():
    key = {"kind": "key", "id": "key", "at": [1, 1], "cells": [[1, 1]]}
    with pytest.raises(LevelError, match="only a door or a hole has cells"):
        Level.from_dict({**WIDE, "things": [*WIDE["things"], key]})


def test_a_position_s_two_numbers_are_its_x_and_its_y():
    level = {
        "id": "numbers",
        "map": ["#####", "#S.K#", "#####"],
        "things": [{"kind": "key", "id": "key", "marker": "K"}],
    }
    result = run_code(Level.from_dict(level), "print(key.position.x, key.position.y)\n")
    assert result.stdout == "3 1\n"


def test_the_night_walk_is_crossed_with_osto_in_its_three_ways():
    """D178: the way home's hole never closes on its own; osto from the cell above it is
    the way across, and a while that waits for it to close ends at the tick limit."""
    level = real("the-night-walk")
    (hole,) = [thing for thing in level.things if thing.kind == "hole"]
    assert hole.period == 0
    won = run_code(level, solution("the-night-walk"))
    assert won.status == "won"
    assert [way_id for way_id, way in won.ways if way.status == "won"] == ["near", "middle", "far"]
    for _, way in won.ways:
        assert all(goal.met for goal in way.goals if goal.kind in ("cast", "no_bumps"))
    waiting = solution("the-night-walk").replace(
        'wizard.cast("osto")\n', "while not hole.closed:\n    wizard.wait()\n"
    )
    assert run_code(level, waiting).status == "too_many_ticks"


def test_the_opening_hole_does_not_know_osto():
    """D178: the hole that opens and closes is crossed with a while; osto is not yet a
    spell there, and is refused as unknown."""
    level = real("the-opening-hole")
    assert "osto" not in level.spells
    result = run_code(level, 'wizard.move_right(2)\nwizard.cast("osto")\n')
    refused = [event for event in result.events if event.kind == "blocked"]
    assert refused and refused[0].data["reason"] == "unknown_spell"
    assert run_code(level, solution("the-opening-hole")).status == "won"
