import pytest
from kydux_world import api
from kydux_world.actors import Teacher
from kydux_world.level import Level, Position
from kydux_world.run import run_code
from kydux_world.things import Door, Key, ReadOnly, Thing
from kydux_world.world import Wizard, World

ROOMS = Level.from_dict(
    {
        "id": "rooms",
        "map": ["##########", "#S...K...#", "#######D##", "#.....BE.#", "##########"],
        "things": [
            {"kind": "key", "id": "key", "marker": "K", "opens": "door"},
            {"kind": "door", "id": "door", "marker": "D", "locked": True},
            {"kind": "book", "id": "book", "marker": "B"},
        ],
        "goals": [{"kind": "reach", "marker": "E"}],
    }
)


def kinds(world):
    return [(e.kind, e.data) for e in world.events]


def test_the_child_holds_the_wizard_and_every_thing_by_its_id():
    world = World(ROOMS)
    assert set(world.namespace()) == {"wizard", "key", "door", "book"}
    assert world.namespace()["door"].kind == "door"


def test_a_thing_says_what_it_is_and_where():
    key = World(ROOMS).things["key"]
    assert (key.kind, key.name, key.position) == ("key", "key", Position(5, 1))
    assert key.position == (5, 1)


def test_pick_up_carries_the_thing_on_the_wizard_s_tile():
    world = World(ROOMS)
    world.wizard.move_right(4)
    world.wizard.pick_up()
    key = world.things["key"]
    assert key.position is None
    assert world.wizard.items == [key]
    assert world.wizard.has("key") and not world.wizard.has("book")
    assert kinds(world)[-1] == ("pick_up", {"id": "key", "at": [5, 1]})


def test_pick_up_with_nothing_there_is_blocked_and_takes_a_tick():
    world = World(ROOMS)
    world.wizard.pick_up()
    assert kinds(world) == [
        ("blocked", {"at": [1, 1], "by": "wizard", "reason": "nothing", "tried": True})
    ]
    assert world.tick == 1


def test_a_closed_door_stops_the_wizard_like_a_wall():
    world = World(ROOMS)
    world.wizard.move_right(6)
    world.wizard.move_down()
    assert world.wizard.position == (7, 1)
    assert kinds(world)[-1] == ("bump", {"at": [7, 1], "facing": "down", "by": "door"})


def test_a_locked_door_needs_its_key():
    world = World(ROOMS)
    world.wizard.move_right(6)
    world.things["door"].open()
    assert kinds(world)[-1] == (
        "blocked",
        {"at": [7, 2], "by": "door", "reason": "locked", "tried": True},
    )
    assert world.things["door"].locked and not world.things["door"].is_open


def test_a_door_is_opened_from_next_to_it_with_its_key_and_lets_the_wizard_through():
    world = World(ROOMS)
    world.wizard.move_right(4)
    world.wizard.pick_up()
    door = world.things["door"]
    door.open()
    assert kinds(world)[-1] == (
        "blocked",
        {"at": [7, 2], "by": "door", "reason": "far", "tried": False},
    )
    world.wizard.move_right(2)
    door.open()
    assert kinds(world)[-1] == ("open", {"id": "door", "at": [7, 2]})
    assert door.is_open and not door.locked
    world.wizard.move_down(2)
    assert world.wizard.position == (7, 3)
    door.open()
    assert kinds(world)[-1][1]["reason"] in ("open", "far")


def test_a_key_that_names_no_door_opens_any():
    level = Level.from_dict(
        {
            "id": "any",
            "map": ["S.D."],
            "things": [
                {"kind": "key", "id": "k", "at": [0, 0]},
                {"kind": "door", "id": "d", "marker": "D", "locked": True},
            ],
        }
    )
    world = World(level)
    world.wizard.pick_up()
    world.wizard.move_right()
    world.things["d"].open()
    assert world.things["d"].is_open


def test_an_unlocked_door_opens_without_a_key():
    level = Level.from_dict(
        {"id": "u", "map": ["SD."], "things": [{"kind": "door", "id": "d", "marker": "D"}]}
    )
    world = World(level)
    world.things["d"].open()
    assert world.things["d"].is_open


def test_find_nearest_and_find_all_go_by_distance_then_reading_order():
    level = Level.from_dict(
        {
            "id": "f",
            "map": [".....", "..S..", "....."],
            "things": [
                {"kind": "book", "id": "far", "at": [4, 2]},
                {"kind": "book", "id": "below", "at": [2, 2]},
                {"kind": "book", "id": "above", "at": [2, 0]},
                {"kind": "key", "id": "key", "at": [0, 1]},
            ],
        }
    )
    wizard = World(level).wizard
    assert [b.name for b in wizard.find_all("book")] == ["above", "below", "far"]
    assert wizard.find_nearest("book").name == "above"
    assert wizard.find_nearest("dragon") is None
    assert wizard.find_all("dragon") == []


def test_asking_takes_no_tick():
    world = World(ROOMS)
    wizard = world.wizard
    _ = (wizard.position, wizard.facing, wizard.items, wizard.find_nearest("key"))
    _ = wizard.has("key"), world.things["door"].locked
    assert world.tick == 0


def test_wait_stands_still_a_tick_each():
    world = World(ROOMS)
    world.wizard.wait(3)
    assert kinds(world) == [("wait", {"at": [1, 1]})] * 3


@pytest.mark.parametrize("ticks", [0, -1, 1.5, "2", True])
def test_wait_takes_a_whole_number_of_ticks(ticks):
    with pytest.raises(TypeError, match="wait"):
        World(ROOMS).wizard.wait(ticks)


def test_the_child_s_objects_are_read_only():
    world = World(ROOMS)
    with pytest.raises(ReadOnly) as raised:
        world.wizard.position = (7, 3)
    assert (raised.value.owner, raised.value.attribute) == ("wizard", "position")
    assert raised.value.exists
    with pytest.raises(ReadOnly) as raised:
        world.wizard.jump = 3
    assert not raised.value.exists
    with pytest.raises(AttributeError):
        world.things["door"].locked = False
    with pytest.raises(AttributeError):
        del world.things["key"].kind
    assert world.wizard.position == (1, 1)


def test_dir_shows_only_the_child_s_names():
    world = World(ROOMS)
    assert dir(world.wizard) == sorted(api.MEMBERS["wizard"])
    assert dir(world.things["door"]) == sorted(api.MEMBERS["door"])


ROLES = {"wizard": Wizard, "thing": Thing, "door": Door, "key": Key, "teacher": Teacher}


@pytest.mark.parametrize(
    ("role", "member"),
    [(role, member) for role, members in api.MEMBERS.items() for member in members],
)
def test_every_name_the_child_may_use_is_a_member_with_a_docstring_and_an_example(role, member):
    found = getattr(ROLES[role], member, None)
    assert found is not None, f"{role}.{member} is not a member of {ROLES[role].__name__}"
    doc = found.__doc__ or ""
    assert doc.strip(), f"{role}.{member} has no docstring"
    assert "`" in doc, f"{role}.{member}'s docstring has no example in backticks"


def test_the_child_s_code_holds_the_level_s_things():
    result = run_code(ROOMS, "print(door.locked, key.kind, book.position)")
    assert result.stdout == "True key Position(x=6, y=3)\n"
