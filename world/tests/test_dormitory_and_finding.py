"""Chapter 2's world (D84, D85, D86): beds and sleeping, the tiles the wizard may
not step on, a thing revealed through what hides it, and the steps between two
of the child's objects."""

from pathlib import Path

import pytest
from kydux_world.level import DEFAULT_TERRAINS, Level, LevelError, Position, Scene, on_scene
from kydux_world.run import run_code
from kydux_world.world import ActionArguments, World

#: The common room in the middle, the other dormitory's arch on the left, the
#: wizard's on the right, two beds there: the mate's, and a free one.
DORMITORY = {
    "id": "dormitory",
    "map": [
        "#########",
        "#..#...=#",
        "#.......#",
        "#..#S#.=#",
        "#########",
    ],
    "things": [
        {"kind": "bed", "id": "bed_1", "at": [7, 1], "free": False},
        {"kind": "bed", "id": "bed_2", "at": [7, 3]},
    ],
    "actors": [{"kind": "friend", "id": "mate", "at": [5, 1]}],
    "forbidden": {"reason": "not_my_dormitory", "cells": [[3, 2]]},
    "goals": [{"kind": "sleep", "bed": "bed_2"}],
}


def blocked(world):
    return [e.data["reason"] for e in world.events if e.kind == "blocked"]


def test_the_wizard_sleeps_beside_a_free_bed_and_the_goal_is_met():
    code = "wizard.move_up()\nwizard.move_right(2)\nwizard.move_down()\nwizard.sleep()"
    result = run_code(Level.from_dict(DORMITORY), code)
    assert result.status == "won"
    sleep = [e.to_dict() for e in result.events if e.kind == "sleep"]
    assert sleep == [
        {
            "tick": 5,
            "actor": "wizard",
            "kind": "sleep",
            "data": {"id": "bed_2", "at": [6, 3], "bed": [7, 3], "facing": "right"},
            "line": 4,
        }
    ]


def test_the_sleep_goal_marks_a_floor_cell_beside_its_bed_and_any_cell_beside_wins():
    # D130: the goal's `at` is the cell the page marks; the bed is the goal.
    level = Level.from_dict(
        {**DORMITORY, "goals": [{"kind": "sleep", "bed": "bed_2", "at": [6, 3]}]}
    )
    beside = "wizard.move_up()\nwizard.move_right(3)\nwizard.sleep()"
    assert run_code(level, beside).status == "won"
    for at, says in (([5, 3], "no floor cell"), ([5, 2], "no floor cell"), ([6], "is \\[x, y\\]")):
        goals = [{"kind": "sleep", "bed": "bed_2", "at": at}]
        with pytest.raises(LevelError, match=says):
            run_code(Level.from_dict({**DORMITORY, "goals": goals}), "wizard.sleep()")


CONTENT = Path(__file__).resolve().parents[2] / "content"


def test_going_to_bed_walks_to_the_cell_under_the_pillow_a_cell_a_tick():
    # D130: Your bed's solution walks down, then right along the floor before the
    # bed to the cell under bed_2's pillow, and sleeps there facing the bed.
    level = Level.from_directory(CONTENT / "levels" / "your-bed")
    code = (CONTENT / "levels" / "your-bed" / "solution.py").read_text(encoding="utf-8")
    result = run_code(level, code)
    assert result.status == "won"
    walked = [
        (e.data["from"], e.data["to"], e.data["facing"]) for e in result.events if e.kind == "move"
    ]
    assert walked == [
        ([16, 7], [16, 8], "down"),
        ([16, 8], [16, 9], "down"),
        ([16, 9], [17, 9], "right"),
        ([17, 9], [18, 9], "right"),
    ]
    sleep = [e for e in result.events if e.kind == "sleep"]
    assert [(e.tick, e.data["at"], e.data["facing"]) for e in sleep] == [(5, [18, 9], "up")]
    assert result.ticks == 5
    assert all(goal.met for goal in result.goals), result.goals


#: A bed, the cell under its pillow in front of it, and a bed with none.
PILLOWED = {
    "id": "pillowed",
    "map": ["#######", "#.==..#", "#....S#", "#######"],
    "things": [{"kind": "bed", "id": "bed", "at": [2, 1], "pillow_side": [3, 2]}],
    "goals": [{"kind": "sleep", "bed": "bed"}],
}


def test_going_to_bed_from_the_cell_under_the_pillow_walks_nothing():
    level = Level.from_dict({**PILLOWED, "map": ["#######", "#.==..#", "#..S..#", "#######"]})
    result = run_code(level, "wizard.sleep()")
    assert result.status == "won"
    assert [e.kind for e in result.events] == ["sleep"]
    assert result.events[0].data["at"] == [3, 2] and result.events[0].data["facing"] == "up"


def test_going_to_bed_from_beside_it_walks_round_to_the_pillow():
    level = Level.from_dict({**PILLOWED, "map": ["#######", "#.==..#", "#S....#", "#######"]})
    result = run_code(level, "wizard.move_up()\nwizard.sleep()")
    assert result.status == "won"
    moves = [e.data["to"] for e in result.events if e.kind == "move"]
    assert moves == [[1, 1], [1, 2], [2, 2], [3, 2]]
    assert [e.data["at"] for e in result.events if e.kind == "sleep"] == [[3, 2]]


def test_a_bed_with_no_cell_under_its_pillow_is_slept_in_from_beside():
    code = "wizard.move_up()\nwizard.move_right(2)\nwizard.move_down()\nwizard.sleep()"
    result = run_code(Level.from_dict(DORMITORY), code)
    assert [e.data["at"] for e in result.events if e.kind == "sleep"] == [[6, 3]]


def test_a_pillow_side_is_a_bed_s_and_on_the_floor():
    for thing, says in (
        ({"kind": "bed", "id": "bed", "at": [2, 1], "pillow_side": [2, 1]}, "no floor cell"),
        ({"kind": "bed", "id": "bed", "at": [2, 1], "pillow_side": [3]}, "only a bed"),
        ({"kind": "key", "id": "key", "at": [4, 1], "pillow_side": [4, 2]}, "only a bed"),
    ):
        with pytest.raises(LevelError, match=says):
            Level.from_dict({**PILLOWED, "things": [thing], "goals": []})


def test_a_taken_bed_and_no_bed_at_all_are_refused_with_their_reasons():
    world = World(Level.from_dict(DORMITORY))
    world.wizard.sleep()
    world.wizard.move_up()
    world.wizard.move_right(2)
    world.wizard.move_up()
    world.wizard.sleep()
    assert blocked(world) == ["no_bed", "bed_taken"]
    assert world.slept is None and not world.won()


def test_a_bed_says_whether_it_is_free():
    world = World(Level.from_dict(DORMITORY))
    assert (world.things["bed_1"].free, world.things["bed_2"].free) == (False, True)


def test_a_bed_someone_sleeps_in_is_not_free_and_the_sleeper_lies_beside_it():
    # The mate asleep in bed_1 takes it, though the level does not say so (D91).
    things = [{"kind": "bed", "id": "bed_1", "at": [7, 1]}, DORMITORY["things"][1]]
    actors = [{"kind": "friend", "id": "mate", "at": [6, 1], "asleep": "bed_1"}]
    level = Level.from_dict({**DORMITORY, "things": things, "actors": actors})
    # The mate lies on the bed's tile, in no one's way.
    assert (level.actors[0].asleep, level.actors[0].position) == ("bed_1", Position(7, 1))
    world = World(level)
    assert (world.things["bed_1"].free, world.things["bed_2"].free) == (False, True)
    for asleep, says in (
        ("bed_9", "asleep in bed_9, no bed"),
        ("bed_2", "beside no bed_2"),
        (3, "named by its id"),
    ):
        wrong = [{**actors[0], "asleep": asleep}]
        with pytest.raises(LevelError, match=says):
            Level.from_dict({**DORMITORY, "things": things, "actors": wrong})
    two = [*actors, {"kind": "friend", "id": "pupil_1", "at": [7, 2], "asleep": "bed_1"}]
    with pytest.raises(LevelError, match="are asleep in bed_1"):
        Level.from_dict({**DORMITORY, "things": things, "actors": two})


def test_the_forbidden_tile_stops_the_wizard_with_its_reason_and_the_wizard_faces_it():
    world = World(Level.from_dict(DORMITORY))
    world.wizard.move_up()
    world.wizard.move_left(3)
    assert world.wizard.position == Position(4, 2)
    assert world.wizard.facing == "left"
    last = world.events[-1]
    assert (last.kind, last.data["reason"], last.data["facing"]) == (
        "blocked",
        "not_my_dormitory",
        "left",
    )


def test_others_pass_a_forbidden_tile():
    level = Level.from_dict(
        {
            **DORMITORY,
            "actors": [
                {
                    "kind": "teacher",
                    "id": "dask",
                    "at": [4, 2],
                    "patrol": [[1, 2]],
                    "facing": "left",
                }
            ],
        }
    )
    world = World(level)
    world.wizard.wait(3)
    assert world.actors["dask"].position == Position(1, 2)


def test_a_level_forbids_tiles_of_its_own_beside_its_scene_s_each_with_its_reason():
    """D205: the scene's and the level's own, each tile with its reason; a tile named by
    both is refused."""
    scene = Scene(
        "room",
        ("......", "......", "......"),
        dict(DEFAULT_TERRAINS),
        forbidden={"reason": "not_my_dormitory", "cells": [[0, 0]]},
    )
    data = {
        "id": "room",
        "start": [2, 1],
        "forbidden": {"reason": "stay_by_the_brooms", "cells": [[2, 0], [3, 0]]},
        "goals": [{"kind": "reach", "marker": "E"}],
        "end": [5, 2],
    }
    level = Level.from_dict(on_scene(data, scene))
    assert level.forbidden_reasons == {
        Position(0, 0): "not_my_dormitory",
        Position(2, 0): "stay_by_the_brooms",
        Position(3, 0): "stay_by_the_brooms",
    }
    world = World(level)
    world.wizard.move_up()
    assert world.wizard.position == Position(2, 1)
    assert world.events[-1].data["reason"] == "stay_by_the_brooms"
    twice = {**data, "forbidden": {"reason": "stay_by_the_brooms", "cells": [[0, 0]]}}
    with pytest.raises(LevelError, match="named twice"):
        Level.from_dict(on_scene(twice, scene))


def test_a_forbidden_cell_must_be_floor_and_free_only_belongs_to_a_bed():
    with pytest.raises(LevelError, match="not floor"):
        Level.from_dict({**DORMITORY, "forbidden": {"reason": "x", "cells": [[0, 0]]}})
    with pytest.raises(LevelError, match="only a bed is free"):
        Level.from_dict(
            {
                **DORMITORY,
                "things": [
                    *DORMITORY["things"],
                    {"kind": "key", "id": "k", "at": [1, 1], "free": True},
                ],
            }
        )


#: A hall: the key lies behind something painted (hidden), the book in sight.
HALL = {
    "id": "hall",
    "map": ["########", "#S...K.#", "#.B....#", "########"],
    "things": [
        {"kind": "key", "id": "key", "marker": "K", "hidden": True},
        {"kind": "book", "id": "book", "marker": "B"},
    ],
    "actors": [{"kind": "ghost", "id": "eldra", "at": [6, 2]}],
}


def test_a_hidden_thing_is_found_and_revealed_as_any_thing():
    world = World(Level.from_dict(HALL))
    key = world.wizard.find_nearest("key")
    assert key is world.things["key"]
    key.reveal()
    assert (world.events[-1].kind, world.events[-1].data) == (
        "reveal",
        {"id": "key", "at": [5, 1]},
    )
    assert world.tick == 1


def test_a_thing_carried_cannot_be_revealed():
    world = World(Level.from_dict(HALL))
    world.wizard.move_right()
    world.wizard.pick_up()
    world.things["book"].reveal()
    assert blocked(world) == ["not_here"]


def test_only_a_thing_the_wizard_carries_is_hidden():
    with pytest.raises(LevelError, match="only a thing the wizard carries is hidden"):
        Level.from_dict(
            {**HALL, "things": [{"kind": "door", "id": "d", "at": [3, 1], "hidden": True}]}
        )


def test_distance_to_counts_the_steps_along_rows_and_columns_both_ways():
    world = World(Level.from_dict(HALL))
    key, book, eldra = world.things["key"], world.things["book"], world.actors["eldra"]
    assert key.distance_to(world.wizard) == 4
    assert world.wizard.distance_to(key) == 4
    assert book.distance_to(key) == 4
    assert eldra.distance_to(world.wizard) == 6
    # Asking takes no tick.
    assert world.tick == 0


def test_a_carried_thing_is_where_the_wizard_is():
    world = World(Level.from_dict(HALL))
    world.wizard.move_right()
    world.wizard.pick_up()
    assert world.things["book"].distance_to(world.wizard) == 0
    assert world.things["book"].distance_to(world.things["key"]) == 3


def test_distance_to_takes_one_of_the_child_s_objects():
    world = World(Level.from_dict(HALL))
    with pytest.raises(ActionArguments, match="distance_to"):
        world.things["key"].distance_to(3)


def test_the_steps_kept_in_a_name_walk_there_and_back_in_every_way():
    level = Level.from_dict(
        {
            "id": "moving",
            "map": ["##########", "#.......S#", "##########"],
            "things": [{"kind": "key", "id": "key", "at": [5, 1]}],
            "goals": [{"kind": "collect", "id": "key"}],
            "ways": [
                {"id": "near", "things": [{"id": "key", "at": [5, 1]}]},
                {"id": "far", "things": [{"id": "key", "at": [2, 1]}]},
            ],
        }
    )
    code = (
        'key = wizard.find_nearest("key")\n'
        "steps = key.distance_to(wizard)\n"
        "wizard.move_left(steps)\n"
        "wizard.pick_up()\n"
        "wizard.move_right(steps)\n"
    )
    assert run_code(level, code).status == "won"
    assert run_code(level, "wizard.move_left(3)\nwizard.pick_up()").status != "won"
