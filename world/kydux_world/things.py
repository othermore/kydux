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
from .level import CARRIED_KINDS, Position, ThingSpec, under

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
        # `given`: the id of the actor the wizard gave the thing to, or None (D48); `held`:
        # the id of the familiar that carries it, or None (D270).
        self._set(
            world=world,
            spec=spec,
            position=spec.position,
            carried=spec.carried,
            given=None,
            held=None,
        )

    @property
    def _k_child_name(self) -> str:
        return self._k_spec.id

    def __repr__(self) -> str:
        if self._k_given is not None:
            where = f"given to {self._k_given}"
        elif self._k_held is not None:
            where = f"carried by {self._k_held}"
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
        if self._k_carried or self._k_given is not None or self._k_held is not None:
            return None
        if self._k_unseen():
            return None
        return self._k_position

    def reveal(self) -> None:
        """Show where the thing lies, its outline drawn through whatever hides it:
        `key.reveal()`"""
        world: World = self._k_world
        world.ready()
        where = self.position
        if where is None:
            refused = {"at": list(world.wizard.position), "by": self.name, "reason": "not_here"}
            world.act("blocked", {**refused, "tried": False})
            return
        world.act("reveal", {"id": self.name, "at": list(where)})
        world.revealed()

    def distance_to(self, other: Any) -> int | None:
        """How many steps lie between the thing and another, the wizard or someone,
        along the rows and the columns: `key.distance_to(wizard)`"""
        return steps_between(self, other)

    def _k_where(self) -> Position | None:
        """Where the thing is, whoever holds it: on its tile, with the wizard when
        carried, with the actor it was given to; None when it is unseen."""
        world: World = self._k_world
        if self._k_given is not None:
            return world.actors[self._k_given]._k_position
        if self._k_held is not None:
            return world.figure(self._k_held)._k_cell
        if self._k_carried:
            return world.wizard._k_position
        return None if self._k_unseen() else self._k_position

    def _k_reached_from(self) -> Position | None:
        """The cell the thing is reached from, which its distance counts to: where it is,
        or the cell under its peg for a hung broom (D206)."""
        where = self._k_where()
        if where is not None and self._k_spec.hung and where == self._k_position:
            return under(where)
        return where

    def _k_unseen(self) -> bool:
        """Whether the thing lies in the dark, out of the wizard's reach (D52): a thing
        on the floor, not a door or a hole, which are the castle's shape."""
        world: World = self._k_world
        return (
            not world.lit
            and world.in_dark(self._k_position)
            and self.kind in CARRIED_KINDS
            and not world.near_wizard(self._k_position)
        )

    def _carry(self) -> None:
        self._set(carried=True, held=None)

    def _pick(self, familiar: str) -> None:
        """Picked up by a familiar, which carries it until it hands it over (D270)."""
        self._set(held=familiar)

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
    cast beside it) or with a password (its word said beside it, once no seal
    holds); a door both sealed
    and keyed by a word opens once both are done, in either order."""

    _k_role = "door"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        self._set(locked=spec.locked, seal=spec.sealed, open=spec.open, heard=False)

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

    def _k_beside(self, position: Position) -> bool:
        """Whether a tile lies next to a cell of the doorway and not in it (D150)."""
        cells = self._k_spec.cells
        return position not in cells and any(
            abs(cell.x - position.x) + abs(cell.y - position.y) == 1 for cell in cells
        )

    @property
    def sealed(self) -> bool:
        """True while the door is sealed, until its spell is cast beside it: `door.sealed`"""
        return self._k_seal is not None

    @property
    def password(self) -> str | None:
        """The word that opens the door when it is said beside it, or None: `door.password`"""
        return self._k_spec.password

    def _opened_by(self, how: str) -> None:
        """Its spell or its word, done beside it in the tick of the wizard's that did it.
        A word is heard only once the seal is broken: said while the seal holds, it
        does nothing, and the scene is told (`unheard`). The spell breaks the seal
        (`unsealed`), and the door opens when nothing else is wanted of it."""
        world: World = self._k_world
        at = list(self._k_position)
        if how == "word":
            if self._k_seal is not None:
                world.note(self.name, "unheard", {"id": self.name, "at": at})
                return
            self._set(heard=True)
        else:
            self._set(seal=None)
        if self._k_seal is None and (self._k_spec.password is None or self._k_heard):
            self._set(open=True, locked=False)
            world.note(self.name, "open", {"id": self.name, "at": at, "by": how})
            world.shove(self)
        else:
            world.note(self.name, "unsealed", {"id": self.name, "at": at})

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
        if not self._k_beside(wizard):
            world.act("blocked", {"at": at, "by": self.name, "reason": "far", "tried": False})
        elif self._k_open:
            world.act("blocked", {"at": at, "by": self.name, "reason": "open", "tried": False})
        elif self._k_seal is not None:
            world.act("blocked", {"at": at, "by": self.name, "reason": "sealed", "tried": True})
        elif self.password is not None and not self._k_heard:
            world.act("blocked", {"at": at, "by": self.name, "reason": "password", "tried": True})
        elif self._k_locked and not any(
            isinstance(item, Key) and item._opens(self) for item in world.carried()
        ):
            world.act("blocked", {"at": at, "by": self.name, "reason": "locked", "tried": True})
        else:
            self._set(open=True, locked=False)
            world.act(
                "open", {"id": self.name, "at": at, "by": "hand"}, then=lambda: world.shove(self)
            )


class Bed(Thing):
    """A bed, in which the wizard may sleep when no one else does (D84)."""

    _k_role = "bed"

    @property
    def free(self) -> bool:
        """True when no one sleeps in the bed, so that the wizard may: `bed.free`"""
        return self._k_spec.free


def steps_between(one: Any, other: Any) -> int | None:
    """The steps between two of the child's objects along the rows and the columns
    (D86), to the cell under a hung broom (D206), or None when either is unseen.
    Anything else is refused, as an action's wrong argument is."""
    from .world import ActionArguments

    if not isinstance(other, Child) or not hasattr(other, "_k_where"):
        raise ActionArguments(
            "distance_to", "distance_to() takes the wizard, a thing or someone, by its name"
        )
    here, there = _reached_from(one), _reached_from(other)
    if here is None or there is None:
        return None
    return abs(here.x - there.x) + abs(here.y - there.y)


def _reached_from(child: Any) -> Position | None:
    """Where a distance counts from or to: a thing's cell it is reached from (D206), an
    actor's or the wizard's own cell."""
    if isinstance(child, Thing):
        return child._k_reached_from()
    return child._k_where()


#: How many ticks `osto` holds a hole closed (D53, D167).
HOLD_TICKS = 6


class Hole(Thing):
    """A hole that opens in the floor, on one cell or two side by side: closed for
    `period` ticks and open for as many, from tick 0 closed, and closed too while
    `osto` holds it (D53, D167); with `period` 0, open at every tick, a dark portal
    that never closes on its own, closed only while `osto` holds it (D178)."""

    _k_role = "hole"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        #: The ticks it is held, each a range: from the first, up to the last.
        self._set(holds=())

    def _k_closed_at(self, tick: int) -> bool:
        period = self._k_spec.period
        if period and (tick // period) % 2 == 0:
            return True
        return any(start <= tick < end for start, end in self._k_holds)

    def _k_on(self, position: Position) -> bool:
        """Whether a tile is one of the hole's cells (D167)."""
        return position in self._k_spec.cells

    def _k_beside(self, position: Position) -> bool:
        """Whether a tile lies next to a cell of the hole and not on it."""
        cells = self._k_spec.cells
        return position not in cells and any(
            abs(cell.x - position.x) + abs(cell.y - position.y) == 1 for cell in cells
        )

    @property
    def closed(self) -> bool:
        """True when the floor covers the hole, so that a step onto it, taken now,
        lands on the floor: `hole.closed`"""
        world: World = self._k_world
        return self._k_closed_at(world.tick + 1)

    @property
    def open(self) -> bool:
        """True while the hole is open, so that a step onto it, taken now, would
        fall in: `hole.open`"""
        return not self.closed

    def _hold(self) -> None:
        """Held closed for HOLD_TICKS, from the next tick it is closed; a hole that
        never closes on its own, from the next tick (D178)."""
        world: World = self._k_world
        start = world.tick + 1
        while self._k_spec.period and not self._k_closed_at(start):
            start += 1
        end = start + HOLD_TICKS
        self._set(holds=(*self._k_holds, (start, end)))
        world.note(self.name, "hold", {"id": self.name, "from": start, "until": end})


class Broom(Thing):
    """A broom, carried from the first flight on, which a black thread knotted in its
    twigs would make buck in the air (D183): untied by the wizard standing on it, or,
    hung on a peg of the rack, standing under it (D195)."""

    _k_role = "broom"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        self._set(knotted=spec.knotted)

    def __repr__(self) -> str:
        knot = ", knotted" if self._k_knotted else ""
        return super().__repr__()[:-1] + knot + ">"

    @property
    def knotted(self) -> bool:
        """True while the black thread is knotted in the broom's twigs: `broom.knotted`"""
        return self._k_knotted

    def untie(self) -> None:
        """Untie the knot in the broom's twigs, standing on the broom, or under it when it
        hangs: `broom.untie()`"""
        world: World = self._k_world
        world.ready()
        here = world.wizard._k_position
        spec = self._k_spec
        reach = under(self._k_position) if spec.hung and self._k_position is not None else None
        if self._k_carried or (reach or self._k_position) != here:
            # Untied by hand, as a thing is picked up: on its own cell (D183), or from the
            # cell under its peg, as a door opens from beside it (D195).
            refused = {"at": list(here), "by": self.name, "reason": "too_far", "tried": False}
            world.act("blocked", refused)
            return
        if not self._k_knotted:
            # Nothing to untie: an error, which stops the program (D183).
            world.refuse(self.name, "no_knot", list(here))
        self._set(knotted=False)
        world.act("untie", {"id": self.name, "at": list(here)})


class Ring(Thing):
    """A ring standing on a cell no one walks on, flown through from the row above it
    to the row below or the reverse (D187); to the child's code, a thing as any."""


class Plate(Thing):
    """A brass plate in the floor, walked over, lit when a familiar ends a move on it
    (D270): the moon's, the sun's and the star's; to the child's code, its position alone
    (D299): `moon.position`"""

    _k_role = "plate"

    def __init__(self, world: "World", spec: ThingSpec) -> None:
        super().__init__(world, spec)
        self._set(lit=False)


#: Each kind of thing with a class of its own; any other kind is a Thing.
THINGS: dict[str, type[Thing]] = {
    "door": Door,
    "key": Key,
    "hole": Hole,
    "bed": Bed,
    "broom": Broom,
    "ring": Ring,
    "plate": Plate,
}


def make_thing(world: "World", spec: ThingSpec) -> Thing:
    return THINGS.get(spec.kind, Thing)(world, spec)
