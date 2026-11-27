"""What a program starts with (D344): the wizard, the actors, and each door, hole and bed
by its id; no thing of another kind, which the program finds and keeps; and no kind the
level asks the child to find."""

import pytest
from kydux_world.explain import explain
from kydux_world.level import Level, LevelError
from kydux_world.run import run_code
from kydux_world.world import World

ROOM = [
    "S.d.h.b.",
    "k.o.r.t.",
    "F.c.....",
]


def room(**more):
    """A room with one thing of each kind the rule names, and a friend; `more` adds to its
    level.json."""
    things = [
        {"kind": "door", "id": "door", "marker": "d"},
        {"kind": "hole", "id": "hole", "marker": "h", "period": 2},
        {"kind": "bed", "id": "bed", "marker": "b"},
        {"kind": "key", "id": "key", "marker": "k"},
        {"kind": "book", "id": "old_book", "marker": "o"},
        {"kind": "broom", "id": "broom_0", "marker": "r"},
        {"kind": "thread", "id": "thread_1", "marker": "t"},
    ]
    data = {
        "id": "room",
        "map": ROOM,
        "things": things,
        "actors": [{"kind": "friend", "id": "mate", "marker": "F"}],
        "goals": [{"kind": "reach", "at": [1, 0]}],
        **more,
    }
    return Level.from_dict(data)


def held(level):
    return set(World(level).namespace())


def test_a_door_a_hole_and_a_bed_are_variables_by_their_ids_and_nothing_else_is():
    assert held(room()) == {"wizard", "door", "hole", "bed", "mate"}


def test_a_door_that_says_it_is_no_variable_is_none():
    level = Level.from_dict(
        {
            "id": "room",
            "map": ["S.d."],
            "things": [{"kind": "door", "id": "door", "marker": "d", "variable": False}],
        }
    )
    assert held(level) == {"wizard"}
    assert "door" in World(level).things


def test_a_kind_to_find_is_no_variable_a_door_among_them():
    assert held(room(to_find=["door", "key"])) == {"wizard", "hole", "bed", "mate"}


def test_someone_else_s_familiar_is_none_and_a_living_familiar_s_class_is_there():
    level = Level.from_dict(
        {
            "id": "room",
            "map": ["S.F.c"],
            "actors": [
                {"kind": "friend", "id": "mate", "marker": "F"},
                {"kind": "familiar", "id": "tiko", "marker": "c", "of": "mate"},
            ],
        }
    )
    assert held(level) == {"wizard", "mate"}


@pytest.mark.parametrize(
    "to_find",
    [["dragon"], ["potion"], ["key", "key"], "key"],
)
def test_to_find_names_kinds_the_level_has_each_once(to_find):
    with pytest.raises(LevelError, match="room"):
        room(to_find=to_find)


def test_a_kind_the_wizard_only_carries_may_be_to_find():
    level = Level.from_dict(
        {"id": "room", "map": ["S.."], "carrying": ["book"], "to_find": ["book"]}
    )
    assert level.to_find == ("book",)
    assert held(level) == {"wizard"}


@pytest.mark.parametrize("kind", ["key", "book", "broom"])
def test_only_a_door_a_hole_or_a_bed_says_variable_false(kind):
    with pytest.raises(LevelError):
        Level.from_dict(
            {
                "id": "room",
                "map": ["S.k"],
                "things": [{"kind": kind, "id": "one", "marker": "k", "variable": False}],
            }
        )
    with pytest.raises(LevelError):
        Level.from_dict(
            {
                "id": "room",
                "map": ["S.k"],
                "things": [{"kind": "door", "id": "one", "marker": "k", "variable": True}],
            }
        )


def test_a_thing_found_and_kept_is_written_by_its_kind_and_cell_a_variable_by_its_id():
    level = room()
    result = run_code(level, 'mine = wizard.find_nearest("book")\nprint(mine)\nprint(door)\n')
    assert result.stdout == "<book at 2, 1>\n<door door closed>\n"


def test_a_door_to_find_is_written_with_no_id():
    result = run_code(room(to_find=["door"]), 'one = wizard.find_nearest("door")\nprint(one)\n')
    assert result.stdout == "<door closed>\n"


def test_a_thing_s_id_alone_is_an_unknown_name():
    result = run_code(room(to_find=["book"]), "old_book.reveal()\n")
    assert result.status == "error"
    assert result.error.type == "NameError"


def test_the_explanations_suggest_from_the_variables_only():
    level = room()
    assert level.ids() == ["door", "hole", "bed", "mate"]
    try:
        exec("old_bok", {})
    except NameError as error:
        assert "suggestion" not in explain(error, level).params
