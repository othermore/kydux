"""The wand and its spells (D42), and doors that open by spell or by word (D43)."""

import pytest
from kydux_world.level import Level, LevelError
from kydux_world.run import check_consistency, run_code
from kydux_world.world import World

#: A corridor: the wand, a sealed door, a password door, the way out.
HALL = {
    "id": "hall",
    "map": ["#########", "#SWA.B.E#", "#########"],
    "spells": ["zelim"],
    "things": [
        {"kind": "wand", "id": "wand", "marker": "W"},
        {"kind": "door", "id": "seal", "marker": "A", "sealed": "zelim"},
        {"kind": "door", "id": "gate", "marker": "B", "password": "ambrel"},
    ],
    "goals": [{"kind": "reach", "marker": "E"}],
}
LEVEL = Level.from_dict(HALL)
TO_THE_GATE = "wizard.move_right()\nwizard.pick_up()\nwizard.cast('zelim')\nwizard.move_right(2)\n"


def last(world):
    event = world.events[-1]
    return event.actor, event.kind, event.data


def test_cast_without_the_wand_is_an_action_the_wizard_does_not_know():
    world = World(LEVEL)
    world.wizard.cast("zelim")
    assert last(world) == (
        "wizard",
        "blocked",
        {"at": [1, 1], "by": "wizard", "reason": "no_wand", "tried": False},
    )


def test_a_spell_the_level_does_not_have_is_refused():
    world = World(LEVEL)
    world.wizard.move_right()
    world.wizard.pick_up()
    world.wizard.cast("abracadabra")
    assert last(world)[2]["reason"] == "unknown_spell"
    assert last(world)[2]["spell"] == "abracadabra"


def test_the_spell_breaks_the_seal_of_the_door_beside_the_wizard_and_only_there():
    world = World(LEVEL)
    world.wizard.move_right()
    world.wizard.pick_up()
    world.wizard.move_left()
    world.wizard.cast("zelim")
    assert last(world) == ("wizard", "cast", {"spell": "zelim", "at": [1, 1]})
    door = world.things["seal"]
    assert door.sealed and not door.is_open
    world.wizard.move_right()
    world.wizard.cast("zelim")
    tick = world.events[-1].tick
    assert [(e.actor, e.kind, e.tick) for e in world.events[-2:]] == [
        ("wizard", "cast", tick),
        ("seal", "open", tick),
    ]
    assert world.events[-1].data == {"id": "seal", "at": [3, 1], "by": "spell"}
    assert door.is_open and not door.sealed
    check_consistency(world)


def test_open_says_what_a_sealed_door_and_a_password_door_want():
    world = World(LEVEL)
    world.wizard.move_right()
    world.things["seal"].open()
    assert last(world)[2]["reason"] == "sealed"
    assert last(world)[2]["tried"] is True


def test_the_password_said_beside_the_door_opens_it_word_for_word():
    world = World(LEVEL)
    exec(TO_THE_GATE, world.namespace())
    gate = world.things["gate"]
    gate.open()
    assert last(world)[2]["reason"] == "password"
    world.wizard.say("Ambrel")
    assert not gate.is_open
    world.wizard.say("ambrel")
    assert gate.is_open
    assert last(world) == ("gate", "open", {"id": "gate", "at": [5, 1], "by": "word"})
    assert gate.password == "ambrel"
    check_consistency(world)


def test_the_password_from_afar_opens_nothing():
    world = World(LEVEL)
    world.wizard.say("ambrel")
    assert not world.things["gate"].is_open


def test_a_run_through_both_doors_wins():
    result = run_code(LEVEL, TO_THE_GATE + "wizard.say('ambrel')\nwizard.move_right(3)\n")
    assert result.status == "won", result


def test_cast_takes_a_spell_s_name_in_quotes():
    result = run_code(LEVEL, "wizard.cast(3)\n")
    assert result.status == "error"
    assert result.error.explanation["kind"] == "arguments"


@pytest.mark.parametrize(
    ("door", "says"),
    [
        ({"locked": True, "sealed": "zelim"}, "locked, and so neither"),
        ({"sealed": "kirra"}, "not a spell here"),
        ({"password": ""}, "by a word"),
    ],
)
def test_the_loader_refuses_a_door_that_cannot_be(door, says):
    data = {**HALL, "things": [{"kind": "door", "id": "d", "marker": "A", **door}]}
    with pytest.raises(LevelError, match=says):
        Level.from_dict(data)


def test_spells_are_words_in_small_letters():
    with pytest.raises(LevelError, match="spells"):
        Level.from_dict({**HALL, "spells": ["Zelim"]})


#: The castle's door: sealed and keyed by a word, open once both are done.
CASTLE = {
    "id": "castle",
    "map": ["#######", "#SWD.E#", "#######"],
    "spells": ["zelim"],
    "things": [
        {"kind": "wand", "id": "wand", "marker": "W"},
        {
            "kind": "door",
            "id": "castle_door",
            "marker": "D",
            "sealed": "zelim",
            "password": "ambrel",
        },
    ],
    "goals": [{"kind": "reach", "marker": "E"}],
}


@pytest.mark.parametrize("first", ["say", "cast"], ids=["word first", "spell first"])
def test_a_door_sealed_and_keyed_by_a_word_opens_once_both_are_done(first):
    word, spell = "wizard.say('ambrel')\n", "wizard.cast('zelim')\n"
    both = word + spell if first == "say" else spell + word
    result = run_code(
        Level.from_dict(CASTLE),
        "wizard.move_right()\nwizard.pick_up()\n" + both + "wizard.move_right(3)\n",
    )
    assert result.status == "won", result
    done = [e.kind for e in result.events if e.actor == "castle_door"]
    assert done == ["heard" if first == "say" else "unsealed", "open"]


def test_a_door_sealed_and_keyed_by_a_word_stays_shut_with_one_alone():
    result = run_code(
        Level.from_dict(CASTLE),
        "wizard.move_right()\nwizard.pick_up()\nwizard.say('ambrel')\nwizard.move_right(3)\n",
    )
    assert result.status != "won"
    with pytest.raises(LevelError, match="locked, and so neither"):
        Level.from_dict(
            {**CASTLE, "things": [{**CASTLE["things"][1], "sealed": None, "locked": True}]}
        )
