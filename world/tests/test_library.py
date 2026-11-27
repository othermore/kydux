"""Chapter 2's world: shelves (D46), fendra (D47), actors who stand and giving
(D48), and what the wizard carries from the start (D49)."""

import pytest
from kydux_world.level import KNOWN_SPELLS, Level, LevelError, Position
from kydux_world.run import check_consistency, run_code
from kydux_world.world import SPELLS, ActionArguments, World

#: The wizard below a shelf with a book on it; a wall with a book behind it to
#: the right; Eldra at the end of the corridor.
LIBRARY = {
    "id": "library",
    "map": ["#########", "#.=.....#", "#S..#.GE#", "#########"],
    "spells": ["fendra"],
    "carrying": ["wand"],
    "things": [
        {"kind": "book", "id": "book", "at": [2, 1]},
        {"kind": "book", "id": "hidden", "at": [5, 2]},
    ],
    "actors": [{"kind": "ghost", "id": "eldra", "marker": "G", "facing": "left"}],
    "goals": [{"kind": "give", "id": "book", "to": "eldra"}],
}
LEVEL = Level.from_dict(LIBRARY)


def last(world):
    event = world.events[-1]
    return event.actor, event.kind, event.data


def test_a_shelf_stops_a_step_and_not_a_look():
    assert not LEVEL.free(Position(2, 1)) and LEVEL.clear(Position(2, 1))
    world = World(LEVEL)
    world.wizard.move_right()
    world.wizard.move_up()
    assert last(world)[1] == "bump"
    assert world.wizard.position == (2, 2)


def test_the_wizard_carries_the_wand_from_the_start():
    world = World(LEVEL)
    assert [t.kind for t in world.wizard.items] == ["wand"]
    assert world.wizard.has("wand")
    assert world.things["wand"].position is None


def test_fendra_draws_the_thing_named_onto_the_wizard_s_tile():
    world = World(LEVEL)
    world.wizard.move_right()
    world.wizard.cast("fendra", world.things["book"])
    tick = world.events[-1].tick
    assert [(e.actor, e.kind, e.tick) for e in world.events[-2:]] == [
        ("wizard", "cast", tick),
        ("book", "pull", tick),
    ]
    assert world.events[-1].data == {"id": "book", "from": [2, 1], "to": [2, 2]}
    assert world.things["book"].position == (2, 2)
    world.wizard.pick_up()
    assert world.things["book"] in world.wizard.items
    check_consistency(world)


def test_fendra_does_not_see_through_a_wall():
    world = World(LEVEL)
    world.wizard.move_right(2)
    # The hidden book is behind the wall to the right.
    world.wizard.cast("fendra", world.things["hidden"])
    assert last(world)[1:] == (
        "blocked",
        {"at": [3, 2], "by": "hidden", "reason": "out_of_reach", "tried": True, "spell": "fendra"},
    )
    assert world.things["hidden"].position == (5, 2)


def test_fendra_draws_only_a_thing_in_a_straight_line():
    world = World(LEVEL)
    world.wizard.move_right(2)
    # The shelf's book is up and to the left, in no straight line.
    world.wizard.cast("fendra", world.things["book"])
    assert last(world)[2]["reason"] == "out_of_reach"
    assert world.things["book"].position == (2, 1)


def test_fendra_draws_the_thing_named_and_not_the_nearest():
    level = Level.from_dict(
        {
            **LIBRARY,
            "map": ["#######", "#S....#", "#######"],
            "actors": [],
            "goals": [],
            "things": [
                {"kind": "book", "id": "near", "at": [2, 1]},
                {"kind": "book", "id": "rare", "at": [4, 1]},
            ],
        }
    )
    world = World(level)
    world.wizard.cast("fendra", world.things["rare"])
    assert world.things["rare"].position == (1, 1)
    assert world.things["near"].position == (2, 1)


def test_fendra_is_told_which_thing_and_the_other_spells_none():
    world = World(LEVEL)
    with pytest.raises(ActionArguments) as told:
        world.wizard.cast("fendra")
    assert told.value.example == 'wizard.cast("fendra", other_book)'
    with pytest.raises(ActionArguments):
        world.wizard.cast("fendra", "book")
    with pytest.raises(ActionArguments) as told:
        world.wizard.cast("zelim", world.things["book"])
    assert told.value.example == 'wizard.cast("zelim")'


def test_a_thing_up_on_a_shelf_is_too_high_for_the_hands():
    level = Level.from_dict(
        {
            **LIBRARY,
            "map": ["#####", "#.=.#", "#.=.#", "#.S.#", "#####"],
            "actors": [],
            "goals": [],
            "things": [{"kind": "book", "id": "book", "at": [2, 1]}],
        }
    )
    world = World(level)
    world.wizard.pick_up()
    assert last(world)[1:] == (
        "blocked",
        {"at": [2, 3], "by": "book", "reason": "too_high", "tried": True},
    )
    world.wizard.pick_up(world.things["book"])
    assert last(world)[2]["reason"] == "too_high"
    world.wizard.move_left()
    world.wizard.pick_up()
    assert last(world)[2]["reason"] == "nothing"


def test_fendra_reaches_three_tiles_and_no_further():
    level = Level.from_dict(
        {
            **LIBRARY,
            "map": ["#########", "#S......#", "#########"],
            "actors": [],
            "goals": [],
            "things": [{"kind": "book", "id": "book", "at": [5, 1]}],
        }
    )
    world = World(level)
    world.wizard.cast("fendra", world.things["book"])
    assert last(world)[2]["reason"] == "out_of_reach"
    world.wizard.move_right()
    world.wizard.cast("fendra", world.things["book"])
    assert last(world)[1] == "pull"


#: Eldra's little room (D129): a book up on the shelf at the room's back, the shelf
#: before it, the room's open door, and the aisle before the door.
ROOM = {
    **LIBRARY,
    "map": ["#####", "#.=.#", "#.=.#", "##D##", "#.S.#", "#####"],
    "actors": [],
    "goals": [],
    "things": [
        {"kind": "book", "id": "book", "at": [2, 1]},
        {"kind": "door", "id": "door", "marker": "D", "open": True},
    ],
}


def test_fendra_reaches_into_a_room_from_its_doorway_and_not_from_before_it():
    world = World(Level.from_dict(ROOM))
    book = world.things["book"]
    world.wizard.cast("fendra", book)
    assert last(world)[2]["reason"] == "out_of_reach"
    world.wizard.pick_up()
    assert last(world)[2]["reason"] == "nothing"
    world.wizard.move_up()
    world.wizard.pick_up()
    assert last(world)[2] == {"at": [2, 3], "by": "book", "reason": "too_high", "tried": True}
    world.wizard.cast("fendra", book)
    assert last(world)[1] == "pull" and book.position == (2, 3)
    world.wizard.pick_up()
    assert book in world.wizard.items


def test_fendra_reaches_past_a_doorway_from_inside_the_room():
    level = Level.from_dict(
        {**ROOM, "map": ["#####", "#.=.#", "#.S.#", "##D##", "#...#", "#####"]}
    )
    world = World(level)
    world.wizard.cast("fendra", world.things["book"])
    assert last(world)[1] == "pull"


GIVING = {
    "id": "giving",
    "map": ["#######", "#S.BG.#", "#######"],
    "things": [{"kind": "book", "id": "book", "marker": "B"}],
    "actors": [{"kind": "ghost", "id": "eldra", "marker": "G"}],
    "goals": [{"kind": "give", "id": "book", "to": "eldra"}],
}


def test_a_book_given_to_eldra_beside_her_wins():
    result = run_code(
        Level.from_dict(GIVING),
        "wizard.move_right(2)\nwizard.pick_up()\nbook = wizard.find_nearest('book')\n"
        "wizard.give(wizard.items[0])\n",
    )
    assert result.status == "won", result


def test_give_refuses_a_thing_not_carried_and_from_too_far():
    world = World(Level.from_dict(GIVING))
    book = world.things["book"]
    world.wizard.give(book)
    assert last(world)[2]["reason"] == "not_carried"
    world.wizard.move_right(2)
    world.wizard.pick_up()
    world.wizard.give(book)
    assert last(world) == ("wizard", "give", {"id": "book", "to": "eldra", "at": [3, 1]})
    assert book.position is None and book not in world.wizard.items
    assert world.wizard.find_nearest("book") is None
    check_consistency(world)


def test_give_takes_a_thing():
    result = run_code(Level.from_dict(GIVING), "wizard.give('book')\n")
    assert result.status == "error"
    assert result.error.explanation["kind"] == "arguments"


def test_a_ghost_stands_and_catches_no_one():
    world = World(Level.from_dict(GIVING))
    world.wizard.move_right(2)
    world.wizard.wait(3)
    assert world.caught_by is None
    assert world.actors["eldra"].position == (4, 1)


@pytest.mark.parametrize(
    ("change", "says"),
    [
        ({"carrying": ["door"]}, "carrying lists"),
        ({"carrying": ["wand", "wand"]}, "twice"),
        ({"carrying": [{"kind": "book", "art": 3}]}, "carrying lists"),
        ({"carrying": [{"kind": "book", "glow": True}]}, "carrying lists"),
        ({"spells": ["abra"]}, "not a spell the world knows"),
        ({"actors": [{"kind": "ghost", "id": "eldra", "at": [2, 1]}]}, "cannot stand on a shelf"),
    ],
)
def test_the_loader_refuses_what_cannot_be(change, says):
    with pytest.raises(LevelError, match=says):
        Level.from_dict({**LIBRARY, **change})


def test_a_give_goal_names_an_actor_of_the_level():
    level = Level.from_dict({**GIVING, "goals": [{"kind": "give", "id": "book", "to": "nobody"}]})
    with pytest.raises(LevelError, match="gives to nobody"):
        World(level)


def test_the_spells_a_level_may_name_are_the_spells_the_world_casts():
    """level.KNOWN_SPELLS and world.SPELLS are two lists of the same names: the loader
    checks a level without the world, and the world casts; neither may drift."""
    assert set(KNOWN_SPELLS) == set(SPELLS)


def test_a_thing_in_hand_from_the_start_is_asked_for_with_find_item_and_given():
    # The book in the wizard's hands, drawn when it leaves them (D123), and another
    # on the floor.
    level = Level.from_dict(
        {
            "id": "in-hand",
            "map": ["######", "#SG..#", "######"],
            "carrying": ["wand", {"kind": "book", "art": "old_book"}],
            "things": [{"kind": "book", "id": "far", "at": [4, 1]}],
            "actors": [{"kind": "ghost", "id": "eldra", "marker": "G", "facing": "left"}],
            "goals": [{"kind": "give", "id": "book", "to": "eldra"}],
        }
    )
    world = World(level)
    wizard = world.wizard
    book = wizard.find_item("book")
    assert book is not None and book.name == "book" and book.position is None
    # find_nearest looks on the map, not in the wizard's hands.
    assert wizard.find_nearest("book").name == "far"
    assert wizard.find_item("key") is None
    # No name is put into the program for it: the program asks for it.
    assert "book" not in world.namespace()
    wizard.give(book)
    assert last(world) == ("wizard", "give", {"id": "book", "to": "eldra", "at": [1, 1]})
    assert wizard.find_item("book") is None
    world.finish()
    assert world.won()
