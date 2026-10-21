"""The world a child's code runs in: the wizard, the level's things and actors, ticks and events.

Everything is deterministic: the same level and the same code give the same
events. One tick is one thing done (architecture.md, D21): every action that
does something takes a tick, and in each tick, after the wizard, every
actor takes its step, a teacher who sees the wizard catches it, and the
goals are checked. Asking takes no tick. Each tick's events carry the line
of the child's code that caused them, for the page to play back.

A run ends early when the wizard is caught or past the tick limit. Both are
raised as BaseExceptions, which the child's `except Exception` does not
catch; and a world that has ended refuses every further action, so that a
bare `except:` cannot carry the run on.
"""

import sys
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from typing import Any

from .actors import Actor, Teacher, make_actor
from .goals import make_goal
from .level import CARRIED_KINDS, Level, Position
from .things import Child, Door, Thing, make_thing

CHILD = "<child>"


class Direction(Enum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"

    @property
    def delta(self) -> tuple[int, int]:
        return {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}[self.value]


@dataclass(frozen=True)
class Event:
    tick: int
    actor: str
    kind: str
    data: dict[str, Any]
    line: int | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "tick": self.tick,
            "actor": self.actor,
            "kind": self.kind,
            "data": self.data,
            "line": self.line,
        }


class RunOver(BaseException):
    """The run has ended; the child's code is stopped. Not an Exception, so that the
    child's `except Exception` lets it through."""


class TooManyTicks(RunOver):
    """The run went past the level's tick limit."""

    def __init__(self, limit: int) -> None:
        super().__init__(f"the run went past {limit} steps")
        self.limit = limit


class Caught(RunOver):
    """An actor saw the wizard."""

    def __init__(self, by: str) -> None:
        super().__init__(f"{by} saw the wizard")
        self.by = by


class ActionArguments(TypeError):
    """An action given what it cannot take."""

    def __init__(self, action: str, message: str) -> None:
        super().__init__(message)
        self.action = action


def child_line() -> int | None:
    """The line of the child's code running now: the outermost call into the world
    comes from it."""
    frame = sys._getframe(1)
    while frame is not None:
        if frame.f_code.co_filename == CHILD:
            return frame.f_lineno
        frame = frame.f_back
    return None


class World:
    def __init__(self, level: Level, code: str = "") -> None:
        self.level = level
        #: The child's code, which some goals read (lines_under).
        self.code = code
        self.tick = 0
        self.events: list[Event] = []
        self.wizard = Wizard(self)
        self.things: dict[str, Thing] = {s.id: make_thing(self, s) for s in level.things}
        self.actors: dict[str, Actor] = {s.id: make_actor(self, s) for s in level.actors}
        #: Who caught the wizard, when someone did.
        self.caught_by: str | None = None
        self.over: RunOver | None = None
        #: Whether the child's code has come to its end, however it did.
        self.finished = False
        self.goals = [make_goal(spec, level) for spec in level.goals]
        #: For each goal by its index, the first tick it was met at, or failed at.
        self.met_at: dict[int, int] = {}
        self.failed_at: dict[int, int] = {}
        self._line: int | None = None
        self._check_goals()

    def namespace(self) -> dict[str, Child]:
        """What the child's code holds: the wizard, and the level's things and actors by id."""
        return {"wizard": self.wizard, **self.things, **self.actors}

    def is_free(self, position: Position) -> bool:
        """Whether the wizard, an actor or a look can pass: floor, and no closed door."""
        if not self.level.free(position):
            return False
        door = self.door_at(position)
        return door is None or door.is_open

    def door_at(self, position: Position) -> Door | None:
        for thing in self.things.values():
            if isinstance(thing, Door) and thing._k_position == position:
                return thing
        return None

    def door_beside(self, position: Position, opens: Callable[[Door], bool]) -> Door | None:
        """The first closed door next to `position`, by id, for which `opens` holds."""
        for thing in sorted(self.things.values(), key=lambda t: t.name):
            if not isinstance(thing, Door) or thing.is_open:
                continue
            where = thing._k_position
            if abs(where.x - position.x) + abs(where.y - position.y) == 1 and opens(thing):
                return thing
        return None

    def carried(self) -> list[Thing]:
        return [t for t in self.things.values() if t._k_carried]

    def things_at(self, position: Position) -> list[Thing]:
        return [
            t
            for t in self.things.values()
            if not t._k_carried and t._k_position == position and t.kind in CARRIED_KINDS
        ]

    def ready(self) -> None:
        """Raises when the run has ended or has no tick left: every action asks first,
        before it changes anything."""
        if self.over is not None:
            raise self.over
        if self.tick >= self.level.tick_limit:
            self.over = TooManyTicks(self.level.tick_limit)
            raise self.over

    def act(self, kind: str, data: dict[str, Any], then: Callable[[], None] | None = None) -> None:
        """One tick of the wizard's: its event, what it does to the world (`then`, as a
        door opening to a spell), every actor's step, who sees it, the goals."""
        self.ready()
        self.tick += 1
        self._line = child_line()
        self.events.append(Event(self.tick, "wizard", kind, data, self._line))
        if then is not None:
            then()
        for actor in self.actors.values():
            actor._step()
        for actor in self.actors.values():
            # Seen straight ahead, or walked into: either way the teacher has found it.
            if isinstance(actor, Teacher) and (
                actor.can_see(self.wizard) or actor.position == self.wizard.position
            ):
                self.note(actor.name, "seen", {"by": actor.name, "at": list(self.wizard.position)})
                self.caught_by = actor.name
                break
        self._check_goals()
        if self.caught_by is not None:
            self.over = Caught(self.caught_by)
            raise self.over

    def finish(self) -> None:
        """The child's code has ended: the goals that are met only then are checked."""
        self.finished = True
        self._check_goals()

    def won(self) -> bool:
        """Every goal that is not a bonus met, and none failed."""
        return not self.failed_at and all(
            index in self.met_at for index, spec in enumerate(self.level.goals) if not spec.bonus
        )

    def note(self, actor: str, kind: str, data: dict[str, Any]) -> None:
        """An event in the tick going on, of an actor's or the world's."""
        self.events.append(Event(self.tick, actor, kind, data, self._line))

    def _check_goals(self) -> None:
        for index, goal in enumerate(self.goals):
            if index in self.met_at or index in self.failed_at:
                continue
            failed = getattr(goal, "failed", None)
            if failed is not None and failed(self):
                self.failed_at[index] = self.tick
            elif goal.check(self):
                self.met_at[index] = self.tick


def _whole(name: str, what: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ActionArguments(name, f"{name}() takes a whole number of {what}, 1 or more")
    return value


class Wizard(Child):
    """The child's wizard. Its methods are its actions, which the child's code makes it do:
    moving, waiting, saying, picking up, finding, looking at what it carries, and casting
    a spell with the wand (architecture.md, D27, D42)."""

    _k_role = "wizard"

    def __init__(self, world: World) -> None:
        self._set(world=world, position=world.level.start, facing=Direction.DOWN)

    def __repr__(self) -> str:
        here = self._k_position
        return f"<wizard at {here.x}, {here.y} facing {self._k_facing.value}>"

    @property
    def position(self) -> Position:
        """Where the wizard stands, as x and y: `wizard.position.x`"""
        return self._k_position

    @property
    def facing(self) -> str:
        """The way the wizard looks: `"up"`, `"down"`, `"left"` or `"right"`: `wizard.facing`"""
        return self._k_facing.value

    @property
    def items(self) -> list[Thing]:
        """The things the wizard carries, as a list: `wizard.items`"""
        return self._k_world.carried()

    def _move(self, direction: Direction, steps: int) -> None:
        world: World = self._k_world
        for _ in range(steps):
            world.ready()
            self._set(facing=direction)
            dx, dy = direction.delta
            here = self._k_position
            ahead = Position(here.x + dx, here.y + dy)
            if not world.is_free(ahead):
                by = "door" if world.door_at(ahead) is not None else "wall"
                world.act("bump", {"at": list(here), "facing": direction.value, "by": by})
                return
            self._set(position=ahead)
            world.act("move", {"from": list(here), "to": list(ahead), "facing": direction.value})

    def move_right(self, steps: int = 1) -> None:
        """Walk right, one tile per step, stopping at a wall or a closed door:
        `wizard.move_right(3)`"""
        self._move(Direction.RIGHT, _whole("move_right", "steps", steps))

    def move_left(self, steps: int = 1) -> None:
        """Walk left, one tile per step, stopping at a wall or a closed door:
        `wizard.move_left(3)`"""
        self._move(Direction.LEFT, _whole("move_left", "steps", steps))

    def move_up(self, steps: int = 1) -> None:
        """Walk up, one tile per step, stopping at a wall or a closed door:
        `wizard.move_up(3)`"""
        self._move(Direction.UP, _whole("move_up", "steps", steps))

    def move_down(self, steps: int = 1) -> None:
        """Walk down, one tile per step, stopping at a wall or a closed door:
        `wizard.move_down(3)`"""
        self._move(Direction.DOWN, _whole("move_down", "steps", steps))

    def say(self, text: object) -> None:
        """Say something out loud; a door beside the wizard opens to its password:
        `wizard.say("Hello!")`"""
        world: World = self._k_world
        said = str(text)
        world.ready()
        door = world.door_beside(self._k_position, lambda d: d.password == said)
        opens = (lambda: door._opened_by("word")) if door else None
        world.act("say", {"text": said}, then=opens)

    def cast(self, spell: str) -> None:
        """Cast a spell with the wand, which the wizard must carry; it works where the
        wizard stands: `wizard.cast("zelim")`"""
        if not isinstance(spell, str):
            raise ActionArguments("cast", "cast() takes a spell's name, in quotes")
        world: World = self._k_world
        world.ready()
        here = list(self._k_position)
        if not self.has("wand"):
            # Without the wand the wizard does not know the action (D27): nothing to try.
            world.act("blocked", {"at": here, "by": "wizard", "reason": "no_wand", "tried": False})
            return
        if spell not in world.level.spells:
            refused = {"at": here, "by": "wizard", "reason": "unknown_spell", "tried": True}
            world.act("blocked", {**refused, "spell": spell})
            return
        door = world.door_beside(self._k_position, lambda d: d._k_seal == spell)
        opens = (lambda: door._opened_by("spell")) if door else None
        world.act("cast", {"spell": spell, "at": here}, then=opens)

    def wait(self, ticks: int = 1) -> None:
        """Stand still while the world moves on, one tick at a time: `wizard.wait(2)`"""
        for _ in range(_whole("wait", "ticks", ticks)):
            self._k_world.act("wait", {"at": list(self._k_position)})

    def pick_up(self) -> None:
        """Pick up the thing on the wizard's tile and carry it: `wizard.pick_up()`"""
        world: World = self._k_world
        world.ready()
        here = self._k_position
        found = world.things_at(here)
        if not found:
            world.act(
                "blocked", {"at": list(here), "by": "wizard", "reason": "nothing", "tried": True}
            )
            return
        thing = found[0]
        thing._carry()
        world.act("pick_up", {"id": thing.name, "at": list(here)})

    def _nearby(self, kind: object) -> list[Child]:
        world: World = self._k_world
        here = self._k_position
        found: list[tuple[int, int, int, Child]] = []
        for item in [*world.things.values(), *world.actors.values()]:
            where = item.position
            if item.kind == kind and where is not None:
                distance = abs(where.x - here.x) + abs(where.y - here.y)
                found.append((distance, where.y, where.x, item))
        return [item for *_, item in sorted(found, key=lambda f: f[:3])]

    def find_nearest(self, kind: str) -> Child | None:
        """The nearest thing of a kind, or None when there is none:
        `wizard.find_nearest("key")`"""
        nearby = self._nearby(kind)
        return nearby[0] if nearby else None

    def find_all(self, kind: str) -> list[Child]:
        """Every thing of a kind, nearest first, as a list: `wizard.find_all("book")`"""
        return self._nearby(kind)

    def has(self, kind: str) -> bool:
        """True when the wizard carries a thing of that kind: `wizard.has("key")`"""
        return any(item.kind == kind for item in self._k_world.carried())
