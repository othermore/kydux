import json
from pathlib import Path

import pytest
from kydux_world.actors import sight_tiles
from kydux_world.level import Level, Position
from kydux_world.run import run_code
from kydux_world.world import Caught, World

FIXTURE = json.loads(
    (Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "sight.json").read_text()
)


@pytest.mark.parametrize("case", FIXTURE["cases"], ids=lambda c: c["name"])
def test_sight_follows_the_shared_rule(case):
    rows = FIXTURE["map"]
    closed = {Position(*tile) for tile in case["closed"]}

    def clear(here):
        inside = 0 <= here.y < len(rows) and 0 <= here.x < len(rows[0])
        return inside and rows[here.y][here.x] != "#" and here not in closed

    tiles = sight_tiles(clear, Position(*case["from"]), case["facing"], case["sight"])
    assert [list(t) for t in tiles] == case["tiles"]


HALL = {
    "id": "hall",
    "map": ["#########", "#S......#", "#.......#", "#########"],
    "actors": [
        {"kind": "teacher", "id": "teacher", "at": [4, 2], "patrol": [[6, 2]], "facing": "right"}
    ],
}


def teacher_moves(world):
    return [(e.tick, e.kind, e.data) for e in world.events if e.actor == "teacher"]


def test_the_teacher_walks_its_patrol_back_and_forth_turning_at_each_end():
    world = World(Level.from_dict(HALL))
    for _ in range(7):
        world.wizard.say("…")
    positions = [
        (e.tick, e.kind, e.data.get("to"), e.data["facing"])
        for e in world.events
        if e.actor == "teacher"
    ]
    assert positions == [
        (1, "move", [5, 2], "right"),
        (2, "move", [6, 2], "right"),
        (3, "turn", None, "left"),
        (4, "move", [5, 2], "left"),
        (5, "move", [4, 2], "left"),
        (6, "turn", None, "right"),
        (7, "move", [5, 2], "right"),
    ]


def test_actors_move_in_the_wizard_s_tick_after_the_wizard():
    world = World(Level.from_dict(HALL))
    world.wizard.move_right()
    assert [(e.tick, e.actor) for e in world.events] == [(1, "wizard"), (1, "teacher")]


def test_a_teacher_standing_still_does_nothing():
    data = {**HALL, "actors": [{"kind": "teacher", "id": "teacher", "at": [4, 2], "facing": "up"}]}
    world = World(Level.from_dict(data))
    world.wizard.wait(3)
    assert teacher_moves(world) == []


def test_can_see_looks_straight_ahead_as_far_as_its_sight():
    data = {
        **HALL,
        "actors": [
            {"kind": "teacher", "id": "teacher", "at": [7, 1], "facing": "left", "sight": 3}
        ],
    }
    world = World(Level.from_dict(data))
    teacher = world.actors["teacher"]
    assert not teacher.can_see(world.wizard)
    assert teacher.can_see(world.things.get("none")) is False
    assert teacher.can_see(5) is False


def test_the_wizard_walking_into_sight_is_caught():
    data = {
        **HALL,
        "actors": [
            {"kind": "teacher", "id": "teacher", "at": [7, 1], "facing": "left", "sight": 3}
        ],
    }
    world = World(Level.from_dict(data))
    with pytest.raises(Caught):
        world.wizard.move_right(5)
    assert world.wizard.position == (4, 1)
    assert world.events[-1].kind == "seen"
    assert world.events[-1].data == {"by": "teacher", "at": [4, 1]}
    assert world.caught_by == "teacher"


def test_a_closed_door_hides_the_wizard_and_an_open_one_does_not():
    level = Level.from_dict(
        {
            "id": "door",
            "map": ["#######", "#S.D..#", "#######"],
            "things": [{"kind": "door", "id": "door", "marker": "D"}],
            "actors": [{"kind": "teacher", "id": "teacher", "at": [5, 1], "facing": "left"}],
        }
    )
    world = World(level)
    teacher = world.actors["teacher"]
    world.wizard.move_right()
    assert not teacher.can_see(world.wizard)
    with pytest.raises(Caught):
        world.things["door"].open()


def test_a_caught_run_ends_even_if_the_child_s_code_catches_it():
    data = {
        **HALL,
        "actors": [{"kind": "teacher", "id": "teacher", "at": [7, 1], "facing": "left"}],
    }
    code = "try:\n    wizard.move_right(5)\nexcept:\n    pass\nwizard.move_left()\n"
    result = run_code(Level.from_dict(data), code)
    assert result.status == "caught"
    assert result.events[-1].kind == "seen"


def test_except_exception_does_not_catch_the_end_of_a_run():
    data = {
        **HALL,
        "actors": [{"kind": "teacher", "id": "teacher", "at": [7, 1], "facing": "left"}],
    }
    code = "try:\n    wizard.move_right(5)\nexcept Exception:\n    print('caught it')\n"
    result = run_code(Level.from_dict(data), code)
    assert result.status == "caught"
    assert result.stdout == ""
