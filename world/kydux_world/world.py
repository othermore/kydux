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

from .actors import Actor, Friend, Teacher, make_actor, sight_tiles
from .goals import make_goal
from .level import CARRIED_KINDS, Level, Position
from .things import Child, Door, Stair, Thing, make_thing

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


#: The four tiles beside a tile.
DELTAS = ((0, -1), (-1, 0), (1, 0), (0, 1))


class World:
    def __init__(self, level: Level, code: str = "") -> None:
        self.level = level
        #: The child's code, which some goals read (lines_under).
        self.code = code
        self.tick = 0
        self.events: list[Event] = []
        #: Whether the room is lit: a dark level is not, until kirra (D52).
        self.lit = not level.dark
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
        """Whether the wizard or an actor can walk onto a tile in the next tick: floor,
        no closed door, and no stair that is away (D53)."""
        if not (self.level.free(position) and self._not_shut(position)):
            return False
        return all(
            stair._k_in_place_at(self.tick + 1)
            for stair in self.things.values()
            if isinstance(stair, Stair) and stair._k_position == position
        )

    def near_wizard(self, position: Position) -> bool:
        """Whether a tile is the wizard's or one of its eight neighbours."""
        here = self.wizard._k_position
        return abs(position.x - here.x) <= 1 and abs(position.y - here.y) <= 1

    def is_clear(self, position: Position) -> bool:
        """Whether sight passes a tile: floor or a shelf, and no closed door (D46)."""
        return self.level.clear(position) and self._not_shut(position)

    def _not_shut(self, position: Position) -> bool:
        door = self.door_at(position)
        return door is None or door.is_open

    def friend_at(self, position: Position) -> str | None:
        """The id of the friend standing on a tile, or None (D66)."""
        for actor in self.actors.values():
            if isinstance(actor, Friend) and actor.position == position:
                return actor.name
        return None

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
            t for t in self.things.values() if t.position == position and t.kind in CARRIED_KINDS
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
            friend = world.friend_at(ahead)
            if friend is not None:
                # A friend stands in the way: the wizard walks round (D66).
                world.act(
                    "bump",
                    {"at": list(here), "facing": direction.value, "by": "friend", "id": friend},
                )
                return
            if not world.is_free(ahead):
                by = (
                    "door"
                    if world.door_at(ahead) is not None
                    else "stair"
                    if self._k_stair_at(world, ahead)
                    else "wall"
                )
                world.act("bump", {"at": list(here), "facing": direction.value, "by": by})
                return
            self._set(position=ahead)
            world.act("move", {"from": list(here), "to": list(ahead), "facing": direction.value})

    @staticmethod
    def _k_stair_at(world: "World", position: Position) -> bool:
        return any(
            isinstance(t, Stair) and t._k_position == position for t in world.things.values()
        )

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
        effect = SPELLS[spell](world, self._k_position)
        if effect.refused is not None:
            refused = {"at": here, "by": "wizard", "reason": effect.refused, "tried": True}
            world.act("blocked", {**refused, "spell": spell})
            return
        world.act("cast", {"spell": spell, "at": here}, then=effect.then)

    def give(self, thing: Thing) -> None:
        """Give a thing the wizard carries to whoever stands beside it: `wizard.give(book)`"""
        if not isinstance(thing, Thing):
            raise ActionArguments("give", "give() takes a thing the wizard carries")
        world: World = self._k_world
        world.ready()
        here = self._k_position
        if not thing._k_carried:
            refused = {"at": list(here), "by": thing.name, "reason": "not_carried", "tried": False}
            world.act("blocked", refused)
            return
        beside = [
            actor
            for actor in sorted(world.actors.values(), key=lambda a: a.name)
            if abs(actor.position.x - here.x) + abs(actor.position.y - here.y) == 1
        ]
        if not beside:
            world.act(
                "blocked", {"at": list(here), "by": "wizard", "reason": "nobody", "tried": False}
            )
            return
        to = beside[0]
        thing._give(to.name)
        world.act("give", {"id": thing.name, "to": to.name, "at": list(here)})

    def wait(self, ticks: int = 1) -> None:
        """Stand still while the world moves on, one tick at a time: `wizard.wait(2)`"""
        for _ in range(_whole("wait", "ticks", ticks)):
            self._k_world.act("wait", {"at": list(self._k_position)})

    def pick_up(self, thing: Thing | None = None) -> None:
        """Pick up a thing on the wizard's tile, or beside it, and carry it; with several in
        reach, say which: `wizard.pick_up()`, `wizard.pick_up(key)`"""
        if thing is not None and not isinstance(thing, Thing):
            raise ActionArguments("pick_up", "pick_up() takes a thing by its name, with no quotes")
        world: World = self._k_world
        world.ready()
        here = self._k_position
        reach = self._k_in_reach()
        if thing is not None:
            if thing not in reach:
                refused = {"at": list(here), "by": thing.name, "reason": "far", "tried": False}
                world.act("blocked", refused)
                return
            chosen = thing
        else:
            if not reach:
                world.act(
                    "blocked",
                    {"at": list(here), "by": "wizard", "reason": "nothing", "tried": True},
                )
                return
            # The wizard's own tile first; from beside, only when there is one to take.
            own = [t for t in reach if t._k_position == here]
            if own:
                chosen = own[0]
            elif len(reach) == 1:
                chosen = reach[0]
            else:
                names = [t.name for t in reach]
                refused = {"at": list(here), "by": "wizard", "reason": "which_one", "tried": False}
                world.act("blocked", {**refused, "things": names})
                return
        chosen._carry()
        world.act("pick_up", {"id": chosen.name, "at": list(here)})

    def _k_in_reach(self) -> list[Thing]:
        """The things the wizard can pick up: on its tile, or on one of the four beside it,
        shelves included (D58), in reading order."""
        world: World = self._k_world
        here = self._k_position
        tiles = [here, *(Position(here.x + dx, here.y + dy) for dx, dy in DELTAS)]
        found = [t for tile in tiles for t in world.things_at(tile)]
        return sorted(
            found, key=lambda t: (t._k_position != here, t._k_position.y, t._k_position.x)
        )

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


@dataclass(frozen=True)
class Effect:
    """What a spell does when cast: `then`, the change to the world in the wizard's
    tick, or nothing; or `refused`, the reason it could not be cast here."""

    then: Callable[[], None] | None = None
    refused: str | None = None


def _zelim(world: World, here: Position) -> Effect:
    """Breaks the seal of a door beside the wizard; away from one it does nothing."""
    door = world.door_beside(here, lambda d: d._k_seal == "zelim")
    return Effect(then=(lambda: door._opened_by("spell")) if door else None)


#: How far `fendra` reaches along each of the four ways (D47).
FENDRA_REACH = 3


def _fendra(world: World, here: Position) -> Effect:
    """Draws the nearest thing in sight, three tiles at most along each way, through
    shelves and not through walls or closed doors, onto the wizard's tile (D47)."""
    found: list[tuple[int, int, int, Thing]] = []
    for facing in ("up", "down", "left", "right"):
        for tile in sight_tiles(world.is_clear, here, facing, FENDRA_REACH):
            for thing in world.things_at(tile):
                distance = abs(tile.x - here.x) + abs(tile.y - here.y)
                found.append((distance, tile.y, tile.x, thing))
    if not found:
        return Effect(refused="nothing_near")
    *_, thing = min(found, key=lambda f: f[:3])

    def pull() -> None:
        before = thing._k_position
        thing._set(position=here)
        world.note(thing.name, "pull", {"id": thing.name, "from": list(before), "to": list(here)})

    return Effect(then=pull)


def _kirra(world: World, here: Position) -> Effect:
    """Lights a dark room for the rest of the run (D52); in a lit room it does nothing."""
    if world.lit:
        return Effect()

    def light() -> None:
        world.lit = True
        world.note("world", "light", {"at": list(here)})

    return Effect(then=light)


def _osto(world: World, here: Position) -> Effect:
    """Holds a stair beside the wizard in place (D53); with none beside, refused."""
    beside = [
        thing
        for thing in sorted(world.things.values(), key=lambda t: t.name)
        if isinstance(thing, Stair)
        and abs(thing._k_position.x - here.x) + abs(thing._k_position.y - here.y) == 1
    ]
    if not beside:
        return Effect(refused="nothing_near")
    return Effect(then=beside[0]._hold)


#: Each spell's effect, by its name (D42); kydux_world.level.KNOWN_SPELLS lists the
#: same names, so that a level can be checked without the world.
SPELLS: dict[str, Callable[[World, Position], Effect]] = {
    "zelim": _zelim,
    "fendra": _fendra,
    "kirra": _kirra,
    "osto": _osto,
}
