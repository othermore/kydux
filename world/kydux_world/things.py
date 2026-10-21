"""What the child's code holds: the base of the wizard, things and actors, and the things.

Every object the child commands is a Python object whose state is read-only
to the child (architecture.md, D20): setting or deleting any attribute
raises ReadOnly, an AttributeError that says what to do instead, and dir()
shows only the names the child may use. The world keeps its state on the
object under names that start with `_k_`, set through `_set`; the world
itself is reachable from none of them by a public name. This is a second
line behind the browser's sandbox, not a wall.
"""

from typing import TYPE_CHECKING, Any

from . import api
from .level import Position, ThingSpec

if TYPE_CHECKING:
    from .world import World


class ReadOnly(AttributeError):
    """An attribute of a child's object set or deleted: the world's to change."""

    def __init__(self, owner: str, name: str) -> None:
        super().__init__(f"{owner}.{name} cannot be changed directly", name=name)
        self.owner = owner
        self.attribute = name


class Child:
    """The base of every object the child's code holds."""

    #: The object's role in kydux_world.api, which says what the child may use.
    _k_role = ""

    def _set(self, **values: Any) -> None:
        for name, value in values.items():
            object.__setattr__(self, f"_k_{name}", value)

    @property
    def _k_child_name(self) -> str:
        return self._k_role

    def __setattr__(self, name: str, value: Any) -> None:
        raise ReadOnly(self._k_child_name, name)

    def __delattr__(self, name: str) -> None:
        raise ReadOnly(self._k_child_name, name)

    def __dir__(self) -> list[str]:
        return sorted(api.MEMBERS.get(self._k_role, ()))


class Thing(Child):
    """Something on the map, or carried by the wizard: a key, a book, a wand, a potion."""

    _k_role = "thing"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        self._set(world=world, spec=spec, position=spec.position, carried=False)

    @property
    def _k_child_name(self) -> str:
        return self._k_spec.id

    def __repr__(self) -> str:
        where = "carried" if self._k_carried else f"at {self._k_position.x}, {self._k_position.y}"
        return f"<{self._k_spec.kind} {self._k_spec.id} {where}>"

    @property
    def kind(self) -> str:
        """What the thing is: `"key"`, `"door"`, `"book"`...: `key.kind`"""
        return self._k_spec.kind

    @property
    def name(self) -> str:
        """The thing's own name in this level: `key.name`"""
        return self._k_spec.id

    @property
    def position(self) -> Position | None:
        """Where the thing lies, as x and y, or None once the wizard carries it: `key.position`"""
        return None if self._k_carried else self._k_position

    def _carry(self) -> None:
        self._set(carried=True)


class Key(Thing):
    """A key, which opens a door: its own, or any door when it names none."""

    _k_role = "key"

    def _opens(self, door: "Door") -> bool:
        return self._k_spec.opens in (None, door.name)


class Door(Thing):
    """A door in a doorway: closed until opened, and locked until opened with its key."""

    _k_role = "door"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        self._set(locked=spec.locked, open=False)

    def __repr__(self) -> str:
        state = "open" if self._k_open else "locked" if self._k_locked else "closed"
        return f"<door {self._k_spec.id} {state}>"

    @property
    def locked(self) -> bool:
        """True while the door needs its key to open: `door.locked`"""
        return self._k_locked

    @property
    def is_open(self) -> bool:
        """True once the door is open; an open door lets the wizard through: `door.is_open`"""
        return self._k_open

    def open(self) -> None:
        """Open the door, standing next to it, with its key when it is locked: `door.open()`"""
        world: World = self._k_world
        world.ready()
        at = list(self._k_position)
        wizard = world.wizard.position
        if abs(wizard.x - self._k_position.x) + abs(wizard.y - self._k_position.y) != 1:
            world.act("blocked", {"at": at, "by": self.name, "reason": "far"})
        elif self._k_open:
            world.act("blocked", {"at": at, "by": self.name, "reason": "open"})
        elif self._k_locked and not any(
            isinstance(item, Key) and item._opens(self) for item in world.carried()
        ):
            world.act("blocked", {"at": at, "by": self.name, "reason": "locked"})
        else:
            self._set(open=True, locked=False)
            world.act("open", {"id": self.name, "at": at})


def make_thing(world: "World", spec: ThingSpec) -> Thing:
    if spec.kind == "door":
        return Door(world, spec)
    if spec.kind == "key":
        return Key(world, spec)
    return Thing(world, spec)
