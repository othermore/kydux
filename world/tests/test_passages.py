"""Chapter 3's world: a level played in several ways (D51), dark rooms and kirra
(D52), stairs that come and go and osto (D53)."""

import pytest
from kydux_world.level import Level, LevelError, Position
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


def test_a_dark_level_needs_kirra():
    with pytest.raises(LevelError, match="needs kirra"):
        Level.from_dict({**DARK, "spells": []})


#: A gap crossed by a stair in place two ticks and away two, from tick 0.
STAIRS = {
    "id": "stairs",
    "map": ["#######", "#S.T.E#", "#######"],
    "spells": ["osto"],
    "carrying": ["wand"],
    "things": [{"kind": "stair", "id": "stair", "marker": "T", "period": 2}],
    "goals": [{"kind": "reach", "marker": "E"}],
}


def test_a_stair_is_in_place_for_its_period_and_away_for_as_long():
    stair = World(Level.from_dict(STAIRS)).things["stair"]
    assert [stair._k_in_place_at(t) for t in range(6)] == [True, True, False, False, True, True]


def test_a_step_onto_a_stair_that_is_away_bumps():
    world = World(Level.from_dict(STAIRS))
    world.wizard.move_right()
    world.wizard.wait()
    assert not world.things["stair"].in_place
    world.wizard.move_right()
    assert world.events[-1].kind == "bump" and world.events[-1].data["by"] == "stair"


def test_waiting_while_the_stair_is_away_gets_the_wizard_across():
    code = (
        "wizard.move_right()\nwizard.wait()\nwhile not stair.in_place:\n    wizard.wait()\n"
        "wizard.move_right(3)\n"
    )
    assert run_code(Level.from_dict(STAIRS), code).status == "won"


def test_osto_holds_the_stair_in_place_from_the_next_tick_it_is_in_place():
    world = World(Level.from_dict(STAIRS))
    world.wizard.move_right()
    world.wizard.cast("osto")
    hold = world.events[-1]
    assert (hold.actor, hold.kind) == ("stair", "hold")
    # Cast in tick 2; the stair is away in tick 3 and back in tick 4.
    assert hold.data == {"id": "stair", "from": 4, "until": 4 + HOLD_TICKS}
    world.wizard.wait(2)
    assert world.things["stair"].in_place
    check_consistency(world)


def test_osto_with_no_stair_beside_is_refused():
    world = World(Level.from_dict(STAIRS))
    world.wizard.cast("osto")
    assert world.events[-1].data["reason"] == "nothing_near"


def test_a_stair_has_a_whole_period_and_nothing_else_does():
    with pytest.raises(LevelError, match="whole period"):
        Level.from_dict({**STAIRS, "things": [{"kind": "stair", "id": "s", "marker": "T"}]})
    with pytest.raises(LevelError, match="whole period"):
        key = {"kind": "key", "id": "k", "marker": "T", "period": 2}
        Level.from_dict({**STAIRS, "things": [key]})
