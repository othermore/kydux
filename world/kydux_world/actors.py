"""The actors: who moves in the world besides the wizard, or stands in it: the
teacher, the ghost, the cat, and a friend who teaches (D66).

An actor takes its step in every tick, after the wizard has done its thing
(architecture.md, D21). The teacher walks its patrol one tile per tick,
back and forth, facing the way it walks, and turns in place for one tick at
each end; it sees straight ahead, as far as its sight, until a wall or a
closed door.
"""

from collections.abc import Callable
from typing import TYPE_CHECKING, Any

from .level import ActorSpec, Position
from .things import Child

if TYPE_CHECKING:
    from .world import World

DELTAS = {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}


def towards(here: Position, there: Position) -> str:
    if there.x > here.x:
        return "right"
    if there.x < here.x:
        return "left"
    return "down" if there.y > here.y else "up"


def sight_tiles(
    clear: Callable[[Position], bool], position: Position, facing: str, sight: int
) -> list[Position]:
    """The tiles seen from `position` facing a way: up to `sight` straight ahead,
    stopping before the first that is not `clear` (a wall, a closed door, the edge).
    The page draws the same tiles (app/src/engine/sight.ts)."""
    dx, dy = DELTAS[facing]
    tiles, here = [], position
    for _ in range(sight):
        here = Position(here.x + dx, here.y + dy)
        if not clear(here):
            break
        tiles.append(here)
    return tiles


class Actor(Child):
    """Someone in the world besides the wizard."""

    def __init__(self, world: "World", spec: ActorSpec) -> None:
        self._set(world=world, spec=spec, position=spec.position, facing=spec.facing)

    @property
    def _k_child_name(self) -> str:
        return self._k_spec.id

    def __repr__(self) -> str:
        here, spec = self._k_position, self._k_spec
        return f"<{spec.kind} {spec.id} at {here.x}, {here.y} facing {self._k_facing}>"

    def distance_to(self, other: Any) -> int | None:
        """How many steps lie between them and another, the wizard or a thing, along
        the rows and the columns: `eldra.distance_to(wizard)`"""
        from .things import steps_between

        return steps_between(self, other)

    def _k_where(self) -> Position:
        return self._k_position

    @property
    def kind(self) -> str:
        """What the actor is: `"teacher"`: `teacher.kind`"""
        return self._k_spec.kind

    @property
    def name(self) -> str:
        """The actor's own name in this level: `teacher.name`"""
        return self._k_spec.id

    @property
    def position(self) -> Position:
        """Where the actor stands, as x and y: `teacher.position`"""
        return self._k_position

    @property
    def facing(self) -> str:
        """The way the actor looks: `"up"`, `"down"`, `"left"` or `"right"`: `teacher.facing`"""
        return self._k_facing

    def _step(self) -> None:
        """The actor's step in a tick; an actor that stands still does nothing."""


class Teacher(Actor):
    """A teacher, who walks a patrol and catches the wizard it sees."""

    _k_role = "teacher"

    def __init__(self, world: "World", spec: ActorSpec) -> None:
        super().__init__(world, spec)
        # Where it is on its patrol, and which way along it it walks.
        self._set(index=0, along=1)

    def can_see(self, target: Any) -> bool:
        """True when `target` stands straight ahead, near enough, with nothing in between:
        `teacher.can_see(wizard)`"""
        where = getattr(target, "position", None)
        if not isinstance(where, tuple):
            return False
        return Position(*where) in self._k_seen()

    def _k_seen(self) -> list[Position]:
        world: World = self._k_world
        return sight_tiles(world.is_clear, self._k_position, self._k_facing, self._k_spec.sight)

    def _step(self) -> None:
        patrol = self._k_spec.patrol
        if not patrol:
            return
        world: World = self._k_world
        index, along = self._k_index, self._k_along
        if not 0 <= index + along < len(patrol):
            along = -along
            facing = towards(patrol[index], patrol[index + along])
            self._set(along=along, facing=facing)
            world.note(self.name, "turn", {"facing": facing})
            return
        here, there = patrol[index], patrol[index + along]
        facing = towards(here, there)
        self._set(index=index + along, position=there, facing=facing)
        world.note(self.name, "move", {"from": list(here), "to": list(there), "facing": facing})


class Ghost(Actor):
    """A ghost, who stands where it is and speaks in the level's story (D48)."""

    _k_role = "ghost"


class Cat(Actor):
    """The school's cat, who stands where it is (D48)."""

    _k_role = "cat"


class Friend(Actor):
    """A friend who teaches, standing in the scene and looking at the wizard: the
    wizard walks round, never through (D66)."""

    _k_role = "friend"


#: Each actor kind's class, by the kind's name in level.json.
ACTORS: dict[str, type[Actor]] = {"teacher": Teacher, "ghost": Ghost, "cat": Cat, "friend": Friend}


def make_actor(world: "World", spec: ActorSpec) -> Actor:
    return ACTORS[spec.kind](world, spec)
