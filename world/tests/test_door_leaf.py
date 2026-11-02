"""An open door's leaf lies on cells beside its doorway, which no one walks onto while
it is open, and whoever stands there as it opens steps aside (D125)."""

import pytest
from kydux_world.level import DEFAULT_TERRAINS, Level, LevelError, Position, Scene, story_on_scene
from kydux_world.run import run_code
from kydux_world.world import World

#: A room above, a corridor below, and the door between them at 4,2, whose open leaf
#: lies on the corridor at 2,3 and 3,3.
ROWS = ["########", "#......#", "####.###", "#......#", "#......#", "########"]
DOOR = {"kind": "door", "id": "door", "at": [4, 2], "covers": {"open": [[2, 3], [3, 3]]}}
CORRIDOR = {
    "id": "corridor",
    "map": ROWS,
    "things": [DOOR],
    "goals": [{"kind": "open", "id": "door"}],
}


def level(start=(4, 1), door=None, actors=()):
    rows = list(ROWS)
    x, y = start
    rows[y] = rows[y][:x] + "S" + rows[y][x + 1 :]
    things = [{**DOOR, **(door or {})}]
    return Level.from_dict({**CORRIDOR, "map": rows, "things": things, "actors": list(actors)})


def shoves(world):
    return [e.data for e in world.events if e.kind == "shoved"]


def test_a_step_onto_an_open_door_s_leaf_is_refused_with_its_reason():
    world = World(level(start=(1, 3)))
    # Shut, the door's leaf is in its doorway: the corridor is walked as any floor.
    world.wizard.move_right()
    world.wizard.move_left()
    assert world.wizard.position == Position(1, 3)
    world.things["door"]._set(open=True)
    world.wizard.move_right()
    refused = [e.data for e in world.events if e.kind == "blocked"]
    assert refused == [
        {"at": [1, 3], "by": "door", "reason": "door_leaf", "tried": False, "facing": "right"}
    ]
    assert world.wizard.position == Position(1, 3)
    assert not world.is_free(Position(2, 3)) and world.is_free(Position(1, 3))


@pytest.mark.parametrize("at", [(2, 3), (3, 3)])
def test_a_figure_on_the_leaf_s_cells_steps_aside_away_from_the_door_as_it_opens(at):
    friend = {"kind": "friend", "id": "mate", "at": list(at)}
    world = World(level(actors=[friend]))
    world.things["door"].open()
    assert shoves(world) == [{"id": "mate", "from": list(at), "to": [1, 3], "by": "door"}]
    shoved = next(e for e in world.events if e.kind == "shoved")
    opened = next(e for e in world.events if e.kind == "open")
    # In the door's own tick, after it opens, as the door's event.
    assert (shoved.tick, shoved.actor) == (opened.tick, "door")
    assert world.events.index(shoved) > world.events.index(opened)
    assert world.actors["mate"].position == Position(1, 3)


def test_the_wizard_on_the_leaf_s_cells_steps_aside_and_its_run_holds_together():
    # A password door, opened by its word from the doorway's foot, where its leaf lies.
    door = {"password": "ambrel", "covers": {"open": [[3, 3], [4, 3]]}}
    code = 'wizard.say("ambrel")\nwizard.move_left()\nwizard.move_right()'
    result = run_code(level(start=(4, 3), door=door), code)
    assert result.status == "won"
    moved = [e.data for e in result.events if e.kind == "shoved"]
    assert moved == [{"id": "wizard", "from": [4, 3], "to": [5, 3], "by": "door"}]
    reasons = [e.data["reason"] for e in result.events if e.kind == "blocked"]
    assert reasons == ["door_leaf"]
    # From 5,3, the step right is free.
    assert [e.data["to"] for e in result.events if e.kind == "move"] == [[6, 3]]


def test_no_one_starts_under_an_open_leaf_and_only_a_door_covers_cells():
    with pytest.raises(LevelError, match="under door's open leaf"):
        level(start=(3, 3), door={"open": True})
    friend = {"kind": "friend", "id": "mate", "at": [2, 3]}
    with pytest.raises(LevelError, match="mate stands under"):
        level(door={"open": True}, actors=[friend])
    # Shut, the leaf is in its doorway.
    assert level(start=(3, 3)).things[0].covers == (Position(2, 3), Position(3, 3))
    for covers in ([[2, 3]], {"shut": [[2, 3]]}, {"open": [[0, 3]]}):
        with pytest.raises(LevelError):
            level(door={"covers": covers})
    book = {"kind": "book", "id": "book", "at": [1, 1], "covers": {"open": [[2, 3]]}}
    rows = ["########", "#...S..#", *ROWS[2:]]
    with pytest.raises(LevelError, match="only a door covers"):
        Level.from_dict({**CORRIDOR, "map": rows, "things": [DOOR, book]})


HALL = Scene("hall", tuple(ROWS), dict(DEFAULT_TERRAINS), (DOOR,))


def told(steps, actors=()):
    data = {"id": "a-story", "scene": "hall", "wizard": [4, 1], "actors": list(actors)}
    return story_on_scene({**data, "steps": steps}, HALL)


def test_a_story_s_walk_onto_an_open_leaf_is_refused_and_the_leaf_moves_whoever_stands_there():
    opening = {"who": "voice", "by": "wizard", "do": {"open": "door"}}
    nuri = {"id": "nuri", "kind": "friend", "at": [1, 3]}
    # Shut, the corridor is walked through.
    told([{"who": "voice", "by": "nuri", "do": {"walk": [5, 3]}}], [nuri])
    with pytest.raises(LevelError, match="stopped at 2,3"):
        told([opening, {"who": "voice", "by": "nuri", "do": {"walk": [5, 3]}}], [nuri])
    # Standing on the leaf as the door opens, nuri is moved to 1,3, and walks on from there.
    standing = {**nuri, "at": [3, 3]}
    told([opening, {"who": "voice", "by": "nuri", "do": {"walk": [1, 4]}}], [standing])
    with pytest.raises(LevelError, match="straight line"):
        told([opening, {"who": "voice", "by": "nuri", "do": {"walk": [3, 4]}}], [standing])
    # Moved while it still has a walk to go in the same step: the staging is refused.
    both = [{"by": "wizard", "open": "door"}, {"by": "nuri", "walk": [[3, 4], [5, 4]]}]
    with pytest.raises(LevelError, match="mid-way"):
        told([{"who": "voice", "by": "wizard", "do": both}], [standing])
