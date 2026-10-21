import pytest
from kydux_world import api


@pytest.mark.parametrize(
    "name", ["wizard.move_right", "door.open", "thing.position", "teacher.can_see"]
)
def test_the_child_s_names_are_known(name):
    assert api.known(name)


@pytest.mark.parametrize("name", ["wizard.fly", "door.move_right", "dragon.roar", "wizard"])
def test_other_names_are_not(name):
    assert not api.known(name)


def test_a_thing_s_members_cover_doors_and_keys():
    taught = ["thing.position", "door.open"]
    assert api.allows(taught, "door", "position")
    assert api.allows(taught, "key", "position")
    assert api.allows(taught, "door", "open")
    assert not api.allows(taught, "door", "locked")
    assert not api.allows(taught, "teacher", "position")


def test_a_role_is_the_kind_s_own_or_a_thing_s():
    assert [api.role_of(k) for k in ("wizard", "door", "key", "book", "teacher")] == [
        "wizard",
        "door",
        "key",
        "thing",
        "teacher",
    ]


def test_the_members_taught_follow_the_table():
    assert api.members_taught(["wizard.say", "wizard.move_right"], "wizard") == [
        "move_right",
        "say",
    ]
