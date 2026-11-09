"""Chapter 3's world: a level played in several ways (D51), dark rooms and kirra
(D52), slabs that come and go and osto (D53, D138), the map and orvim (D134), the
enchanted region (D135), a teacher started anywhere on its patrol (D137), and a
door found as any thing."""

import json

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


def test_a_dark_level_needs_kirra():
    with pytest.raises(LevelError, match="needs kirra"):
        Level.from_dict({**DARK, "spells": []})


#: A hole crossed by a slab in place two ticks and away two, from tick 0.
SLABS = {
    "id": "slabs",
    "map": ["#######", "#S.T.E#", "#######"],
    "spells": ["osto"],
    "carrying": ["wand"],
    "things": [{"kind": "slab", "id": "slab", "marker": "T", "period": 2}],
    "goals": [{"kind": "reach", "marker": "E"}],
}


def test_a_slab_is_in_place_for_its_period_and_away_for_as_long():
    slab = World(Level.from_dict(SLABS)).things["slab"]
    assert [slab._k_in_place_at(t) for t in range(6)] == [True, True, False, False, True, True]


def test_a_step_onto_a_slab_that_is_away_bumps():
    world = World(Level.from_dict(SLABS))
    world.wizard.move_right()
    world.wizard.wait()
    assert not world.things["slab"].in_place
    world.wizard.move_right()
    assert world.events[-1].kind == "bump" and world.events[-1].data["by"] == "slab"


def test_waiting_while_the_slab_is_away_gets_the_wizard_across():
    code = (
        "wizard.move_right()\nwizard.wait()\nwhile not slab.in_place:\n    wizard.wait()\n"
        "wizard.move_right(3)\n"
    )
    assert run_code(Level.from_dict(SLABS), code).status == "won"


def test_osto_holds_the_slab_in_place_from_the_next_tick_it_is_in_place():
    world = World(Level.from_dict(SLABS))
    world.wizard.move_right()
    world.wizard.cast("osto")
    hold = world.events[-1]
    assert (hold.actor, hold.kind) == ("slab", "hold")
    # Cast in tick 2; the slab is away in tick 3 and back in tick 4.
    assert hold.data == {"id": "slab", "from": 4, "until": 4 + HOLD_TICKS}
    world.wizard.wait(2)
    assert world.things["slab"].in_place
    check_consistency(world)


def test_osto_with_no_slab_beside_is_refused():
    world = World(Level.from_dict(SLABS))
    world.wizard.cast("osto")
    assert world.events[-1].data["reason"] == "nothing_near"


def test_a_slab_has_a_whole_period_and_nothing_else_does():
    with pytest.raises(LevelError, match="whole period"):
        Level.from_dict({**SLABS, "things": [{"kind": "slab", "id": "s", "marker": "T"}]})
    with pytest.raises(LevelError, match="whole period"):
        key = {"kind": "key", "id": "k", "marker": "T", "period": 2}
        Level.from_dict({**SLABS, "things": [key]})


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
