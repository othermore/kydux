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


def test_the_table_for_the_page_has_every_member_with_its_kind_and_example():
    found = api.table()
    assert set(found) == set(api.MEMBERS)
    for role, members in found.items():
        assert [m["name"] for m in members] == list(api.MEMBERS[role])
        for member in members:
            assert member["kind"] in ("action", "attribute")
            assert f".{member['name']}" in member["example"], member
            if member["kind"] == "action":
                assert "(" in member["example"], member
    wizard = {m["name"]: m for m in found["wizard"]}
    assert wizard["move_right"] == {
        "name": "move_right",
        "kind": "action",
        "example": "wizard.move_right(3)",
        "simple": "wizard.move_right()",
    }
    # An action that needs its argument, or has none, has no simpler example (D60).
    assert "simple" not in wizard["say"] and "simple" not in wizard["pick_up"]
    assert wizard["position"]["kind"] == "attribute"


def test_a_hole_is_looked_at_by_open_and_closed_and_no_slab_is_left():
    """D167: the thing in the floor is a hole, `hole.open` and `hole.closed`; neither a
    `slab` role nor an `in_place` member is anywhere in the table."""
    assert api.MEMBERS["hole"] == (*api.THING_MEMBERS, "open", "closed")
    assert "hole" in api.THING_ROLES
    assert "slab" not in api.MEMBERS and "slab" not in api.THING_ROLES
    assert all("in_place" not in members for members in api.MEMBERS.values())


def test_a_plate_has_its_position_alone_taught_by_out_of_the_circle():
    """D299: a plate is a role of its own whose one member is `position`; nothing taught
    of a thing reaches it, and Out of the circle teaches it."""
    import json
    from pathlib import Path

    from kydux_world.things import Plate

    assert api.role_of("plate") == "plate" and "plate" not in api.THING_ROLES
    assert api.MEMBERS["plate"] == ("position",)
    things = ["thing.kind", "thing.name", "thing.position", "thing.distance_to", "thing.reveal"]
    assert api.members_taught(things, "plate") == []
    assert api.members_taught([*things, "plate.position"], "plate") == ["position"]
    assert Plate._k_role == "plate"
    position = {"name": "position", "kind": "attribute", "example": "key.position"}
    assert api.table()["plate"] == [position]
    levels = Path(__file__).resolve().parents[2] / "content" / "levels"
    teaching = [
        level.parent.name
        for level in sorted(levels.glob("*/level.json"))
        if "plate.position" in json.loads(level.read_text(encoding="utf-8")).get("api", [])
    ]
    assert teaching == ["out-of-the-circle"]
