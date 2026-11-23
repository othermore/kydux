import pytest
from kydux_world.level import Level, Position
from kydux_world.run import run_code
from kydux_world.world import TooManyTicks, World

ROOM = Level.from_dict(
    {"id": "room", "map": ["#####", "#S..#", "#...#", "#####"], "tick_limit": 10}
)


def kinds(world):
    return [(e.kind, e.data) for e in world.events]


def test_a_move_is_one_tick_and_one_event():
    world = World(ROOM)
    world.wizard.move_right()
    assert world.wizard.position == Position(2, 1)
    assert world.tick == 1
    assert kinds(world) == [("move", {"from": [1, 1], "to": [2, 1], "facing": "right"})]


def test_a_move_of_several_steps_is_a_tick_each():
    world = World(ROOM)
    world.wizard.move_right(2)
    world.wizard.move_down()
    assert world.wizard.position == Position(3, 2)
    assert [e.tick for e in world.events] == [1, 2, 3]
    assert world.wizard.facing == "down"


def test_a_wall_stops_the_wizard_with_a_bump_and_the_rest_of_the_steps():
    world = World(ROOM)
    world.wizard.move_right(5)
    assert world.wizard.position == Position(3, 1)
    assert [e.kind for e in world.events] == ["move", "move", "bump"]
    assert world.events[-1].data == {"at": [3, 1], "facing": "right", "by": "wall"}


def test_the_edge_of_the_map_stops_the_wizard_too():
    level = Level.from_dict({"id": "open", "map": ["S.."]})
    world = World(level)
    world.wizard.move_up()
    world.wizard.move_left()
    assert world.wizard.position == Position(0, 0)
    assert [e.kind for e in world.events] == ["bump", "bump"]
    assert world.wizard.facing == "left"


def test_the_wizard_faces_the_way_its_level_says_before_any_act():
    """D286: down where the level says none; what reads the way reads the level's."""
    assert World(ROOM).wizard.facing == "down"
    level = Level.from_dict(
        {"id": "room", "map": ["#####", "#S..#", "#...#", "#####"], "facing": "left"}
    )
    world = World(level)
    assert world.wizard.facing == "left"
    assert repr(world.wizard) == "<wizard at 1, 1 facing left>"
    world.wizard.say(world.wizard.facing)
    assert kinds(world) == [("say", {"text": "left"})]
    run = run_code(level, "wizard.say(wizard.facing)\nwizard.move_left()\n")
    assert [(e.kind, e.data) for e in run.events if e.kind in ("say", "bump")] == [
        ("say", {"text": "left"}),
        ("bump", {"at": [1, 1], "facing": "left", "by": "wall"}),
    ]


def test_the_wizard_turns_even_when_it_cannot_move():
    world = World(ROOM)
    world.wizard.move_up()
    assert world.wizard.facing == "up"


def test_say_records_what_was_said():
    world = World(ROOM)
    world.wizard.say("Hello")
    world.wizard.say(42)
    assert kinds(world) == [("say", {"text": "Hello"}), ("say", {"text": "42"})]


def test_past_the_tick_limit_the_world_stops_the_run():
    world = World(ROOM)
    for _ in range(10):
        world.wizard.say("hi")
    with pytest.raises(TooManyTicks):
        world.wizard.say("one too many")
    assert len(world.events) == 10


@pytest.mark.parametrize("steps", [-1, -3, 1.5, "2", True, None])
def test_steps_must_be_a_whole_number_of_zero_or_more(steps):
    world = World(ROOM)
    with pytest.raises((TypeError, ValueError), match="move_right.*0 or more"):
        world.wizard.move_right(steps)
    assert world.events == []


def test_a_move_of_no_steps_walks_nothing_and_takes_no_tick():
    # D133: the rest of a walk already done is zero, and no error.
    world = World(ROOM)
    for move in (world.wizard.move_right, world.wizard.move_left, world.wizard.move_up):
        move(0)
    world.wizard.move_down(0)
    assert world.events == [] and world.tick == 0


def test_events_carry_the_child_s_line():
    level = Level.from_dict({"id": "line", "map": ["S...."]})
    result = run_code(level, "wizard.say('a')\n\nwizard.move_right(2)\n")
    assert [(e.kind, e.line) for e in result.events] == [("say", 1), ("move", 3), ("move", 3)]


def test_a_loop_s_events_carry_the_line_inside_it():
    level = Level.from_dict({"id": "loop", "map": ["S...."]})
    code = "for i in range(2):\n    wizard.move_right()\n"
    assert [e.line for e in run_code(level, code).events] == [2, 2]


def test_events_outside_the_child_s_code_have_no_line():
    world = World(ROOM)
    world.wizard.move_right()
    assert world.events[0].line is None
