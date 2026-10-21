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
from .level import CARRIED_KINDS, Position, ThingSpec

if TYPE_CHECKING:
    from .world import World


class ReadOnly(AttributeError):
    """An attribute of a child's object set or deleted: the world's to change.

    `exists` tells changing what the object has (`wizard.position = ...`) from
    giving it something new (`wizard.jump = ...`), which the child is told apart."""

    def __init__(self, owner: str, name: str, exists: bool) -> None:
        verb = "cannot be changed directly" if exists else "cannot be added"
        super().__init__(f"{owner}.{name} {verb}", name=name)
        self.owner = owner
        self.attribute = name
        self.exists = exists


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
        raise ReadOnly(self._k_child_name, name, hasattr(type(self), name))

    def __delattr__(self, name: str) -> None:
        raise ReadOnly(self._k_child_name, name, hasattr(type(self), name))

    def __dir__(self) -> list[str]:
        return sorted(api.MEMBERS.get(self._k_role, ()))


class Thing(Child):
    """Something on the map, or carried by the wizard: a key, a book, a wand, a potion."""

    _k_role = "thing"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        # `given`: the id of the actor the wizard gave the thing to, or None (D48).
        self._set(world=world, spec=spec, position=spec.position, carried=spec.carried, given=None)

    @property
    def _k_child_name(self) -> str:
        return self._k_spec.id

    def __repr__(self) -> str:
        if self._k_given is not None:
            where = f"given to {self._k_given}"
        elif self._k_carried:
            where = "carried"
        else:
            where = f"at {self._k_position.x}, {self._k_position.y}"
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
        if self._k_carried or self._k_given is not None or self._k_unseen():
            return None
        return self._k_position

    def _k_unseen(self) -> bool:
        """Whether the thing lies in the dark, out of the wizard's reach (D52): a thing
        on the floor, not a door or a stair, which are the castle's shape."""
        world: World = self._k_world
        return (
            not world.lit
            and self.kind in CARRIED_KINDS
            and not world.near_wizard(self._k_position)
        )

    def _carry(self) -> None:
        self._set(carried=True)

    def _give(self, to: str) -> None:
        self._set(carried=False, given=to)


class Key(Thing):
    """A key, which opens a door: its own, or any door when it names none."""

    _k_role = "key"

    def _opens(self, door: "Door") -> bool:
        return self._k_spec.opens in (None, door.name)


class Door(Thing):
    """A door in a doorway, closed until it opens, in one of four ways (D43): by hand
    (`door.open()`), locked (`door.open()` with its key carried), sealed (its spell
    cast beside it) or with a password (its word said beside it)."""

    _k_role = "door"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        self._set(locked=spec.locked, seal=spec.sealed, open=False)

    def __repr__(self) -> str:
        state = (
            "open"
            if self._k_open
            else "locked"
            if self._k_locked
            else "sealed"
            if self._k_seal
            else "closed"
        )
        return f"<door {self._k_spec.id} {state}>"

    @property
    def sealed(self) -> bool:
        """True while the door is sealed, until its spell is cast beside it: `door.sealed`"""
        return self._k_seal is not None

    @property
    def password(self) -> str | None:
        """The word that opens the door when it is said beside it, or None: `door.password`"""
        return self._k_spec.password

    def _opened_by(self, how: str) -> None:
        """Opens the door by a spell or a word, in the tick of the wizard's that did it."""
        self._set(open=True, locked=False, seal=None)
        world: World = self._k_world
        world.note(self.name, "open", {"id": self.name, "at": list(self._k_position), "by": how})

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
        # `tried` says whether the wizard got to try: from too far, or at a door
        # already open, there is nothing to try, and the scene shows no attempt.
        if abs(wizard.x - self._k_position.x) + abs(wizard.y - self._k_position.y) != 1:
            world.act("blocked", {"at": at, "by": self.name, "reason": "far", "tried": False})
        elif self._k_open:
            world.act("blocked", {"at": at, "by": self.name, "reason": "open", "tried": False})
        elif self._k_seal is not None:
            world.act("blocked", {"at": at, "by": self.name, "reason": "sealed", "tried": True})
        elif self.password is not None:
            world.act("blocked", {"at": at, "by": self.name, "reason": "password", "tried": True})
        elif self._k_locked and not any(
            isinstance(item, Key) and item._opens(self) for item in world.carried()
        ):
            world.act("blocked", {"at": at, "by": self.name, "reason": "locked", "tried": True})
        else:
            self._set(open=True, locked=False)
            world.act("open", {"id": self.name, "at": at, "by": "hand"})


#: How many ticks `osto` holds a stair in place (D53).
HOLD_TICKS = 6


class Stair(Thing):
    """A stair across a gap or a doorway, in place for `period` ticks and away for as
    many, from tick 0 in place, unless `osto` holds it (D53)."""

    _k_role = "stair"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        #: The ticks it is held, each a range: from the first, up to the last.
        self._set(holds=())

    def _k_in_place_at(self, tick: int) -> bool:
        period = self._k_spec.period or 1
        if (tick // period) % 2 == 0:
            return True
        return any(start <= tick < end for start, end in self._k_holds)

    @property
    def in_place(self) -> bool:
        """True when a step onto the stair, taken now, lands on it: `stair.in_place`"""
        world: World = self._k_world
        return self._k_in_place_at(world.tick + 1)

    def _hold(self) -> None:
        """Held in place for HOLD_TICKS, from the next tick it is in place."""
        world: World = self._k_world
        start = world.tick + 1
        while not self._k_in_place_at(start):
            start += 1
        end = start + HOLD_TICKS
        self._set(holds=(*self._k_holds, (start, end)))
        world.note(self.name, "hold", {"id": self.name, "from": start, "until": end})


#: Each kind of thing with a class of its own; any other kind is a Thing.
THINGS: dict[str, type[Thing]] = {"door": Door, "key": Key, "stair": Stair}


def make_thing(world: "World", spec: ThingSpec) -> Thing:
    return THINGS.get(spec.kind, Thing)(world, spec)
