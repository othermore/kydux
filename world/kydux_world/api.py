"""The names a level may teach: every member of the child's objects, by role.

A level lists in `api` the names it uses, as `role.member` (D23):
`wizard.move_right`, `door.open`, `thing.position`. A role is what an object
is to the child: `wizard`; a thing's kind when it has members of its own
(`door`), or `thing`; an actor's kind (`teacher`, `ghost`, `cat`, `friend`). A
door is a thing too, so `thing.position` covers a door's position; so does a
key's.

The table here is the one list of what the child can type. It is plain data,
so that a level can be checked without the world's classes; a test holds the
classes to it, each name a member with a docstring, and the notebook (sprint
4) shows each member with its docstring's example.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .level import Level

THING_MEMBERS = ("kind", "name", "position")

MEMBERS: dict[str, tuple[str, ...]] = {
    "wizard": (
        "move_right",
        "move_left",
        "move_up",
        "move_down",
        "say",
        "wait",
        "pick_up",
        "find_nearest",
        "find_all",
        "has",
        "give",
        "cast",
        "position",
        "facing",
        "items",
    ),
    "thing": THING_MEMBERS,
    "door": (*THING_MEMBERS, "locked", "sealed", "password", "is_open", "open"),
    "key": THING_MEMBERS,
    "stair": (*THING_MEMBERS, "in_place"),
    "teacher": ("kind", "name", "position", "facing", "can_see"),
    "ghost": ("kind", "name", "position", "facing"),
    "cat": ("kind", "name", "position", "facing"),
    # A friend teaches by words, not by code: the child's code has nothing of it (D66).
    "friend": (),
}

#: The roles that are things, and so have a thing's members.
THING_ROLES = ("thing", "door", "key", "stair")


def role_of(kind: str) -> str:
    """The role of an object of a kind: its own when it has one, else `thing`."""
    if kind == "wizard" or kind in MEMBERS:
        return kind
    return "thing"


def known(name: str) -> bool:
    role, _, member = name.partition(".")
    return member in MEMBERS.get(role, ())


def allows(api: tuple[str, ...] | list[str], role: str, member: str) -> bool:
    """Whether a level that teaches `api` lets an object of `role` use `member`."""
    if f"{role}.{member}" in api:
        return True
    return role in THING_ROLES and member in THING_MEMBERS and f"thing.{member}" in api


def members_taught(api: tuple[str, ...] | list[str], role: str) -> list[str]:
    """The members of `role` a level teaches, in the table's order."""
    return [member for member in MEMBERS.get(role, ()) if allows(api, role, member)]


def check_api(level: "Level") -> None:
    from .level import LevelError

    for name in level.api:
        if not known(name):
            raise LevelError(f"{level.id}: api names {name}, which no object has")


def table() -> dict[str, list[dict[str, str]]]:
    """Every role's members, for the page's notebook: each one's name, whether it is an
    action or an attribute, and its example, from its docstring. Written as api.json at
    build time (architecture.md, D30), so that the page needs no Python to show it."""
    from .actors import ACTORS
    from .explain import example
    from .things import THINGS, Thing
    from .world import Wizard

    classes = {"wizard": Wizard, "thing": Thing, **THINGS, **ACTORS}
    found: dict[str, list[dict[str, str]]] = {}
    for role, members in MEMBERS.items():
        owner = classes[role]
        found[role] = []
        for member in members:
            attribute = isinstance(getattr(owner, member), property)
            shown = _attribute_example(owner, member) if attribute else example(owner, member)
            kind = "attribute" if attribute else "action"
            entry = {"name": member, "kind": kind, "example": shown}
            simple = None if attribute else _simple_example(owner, member, shown)
            if simple is not None:
                entry["simple"] = simple
            found[role].append(entry)
    return found


def _simple_example(owner: type, member: str, shown: str) -> str | None:
    """An action's example with no argument, when it can be called with none and its
    example has one: what the notebook shows before arguments are taught (D60)."""
    import inspect

    parameters = list(inspect.signature(getattr(owner, member)).parameters.values())[1:]
    if any(p.default is inspect.Parameter.empty for p in parameters) or shown.endswith("()"):
        return None
    return shown[: shown.index("(")] + "()"


def _attribute_example(owner: type, member: str) -> str:
    """An attribute's example: the last thing in backticks in its docstring that names it."""
    import re

    doc = getattr(owner, member).__doc__ or ""
    named = [text for text in re.findall(r"`([^`]+)`", doc) if f".{member}" in text]
    return named[-1] if named else member


if __name__ == "__main__":
    import json

    print(json.dumps({"roles": table(), "thing_roles": list(THING_ROLES)}, indent=2))
