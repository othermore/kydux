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

A level that is a race (D189) starts with Ilda reading the program, a tick a
line, before the wizard's first action, and ends with the race flown out; a
wizard in the air when the program ends sets down where it is (D185).
"""

import sys
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from functools import partial
from typing import Any

from .actors import Actor, Friend, Teacher, make_actor, sight_tiles
from .goals import code_lines, make_goal
from .level import CARRIED_KINDS, Level, Position
from .things import Bed, Child, Door, Hole, Ring, Thing, make_thing, steps_between

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


class Refused(Exception):
    """An action the world cannot do with what it is given, which stops the child's
    program as any error does and is explained in the child's words (D22): untying a
    broom with no knot (`no_knot`, D183). Its words name the thing, `by`."""

    def __init__(self, reason: str, by: str) -> None:
        super().__init__(f"{by}: {reason}")
        self.reason = reason
        self.by = by


class ActionArguments(TypeError):
    """An action given what it cannot take; `example`, how to call it, when its
    docstring's first example is not the one the child needs."""

    def __init__(self, action: str, message: str, example: str | None = None) -> None:
        super().__init__(message)
        self.action = action
        self.example = example


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
#: How far the wizard walks to the cell under a bed's pillow to go to bed, at most
#: (D130).
PILLOW_WALK = 8
#: The ticks a ring missed costs in a race, served before the finish (D189).
RING_PENALTY = 5


def _direction(here: Position, there: Position) -> Direction:
    """The way from a cell to one beside it, or along its row or column."""
    if there.x != here.x:
        return Direction.RIGHT if there.x > here.x else Direction.LEFT
    return Direction.DOWN if there.y > here.y else Direction.UP


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
        #: The bed the wizard sleeps in, once it does (D84).
        self.slept: str | None = None
        self.over: RunOver | None = None
        #: Whether the child's code has come to its end, however it did.
        self.finished = False
        self.goals = [make_goal(spec, level) for spec in level.goals]
        #: For each goal by its index, the first tick it was met at, or failed at.
        self.met_at: dict[int, int] = {}
        self.failed_at: dict[int, int] = {}
        self._line: int | None = None
        #: The reason an error stopped the program, or the world refused it, once one
        #: did: what the `no_error` goal fails at.
        self.error: str | None = None
        #: In a race (D189): the lines Ilda read, the tick the wizard crossed the finish
        #: at, and the ticks it served for the rings it missed.
        self.read_lines = 0
        self.crossed_at: int | None = None
        self.penalty = 0
        #: The hidden things the wizard has found, by id (D184).
        self.found: set[str] = set()
        self._check_goals()

    def begin(self) -> None:
        """The run's start, before the wizard's first action: in a race, Ilda reads
        the program, a tick a line, the line she reads lit, while the wizard stands on
        the start and the racer waits for its own lines (D189)."""
        if self.level.race is None:
            return
        counted = [
            number
            for number, line in enumerate(self.code.splitlines(), 1)
            if line.strip() and not line.strip().startswith("#")
        ]
        self.read_lines = code_lines(self.code)
        at = list(self.wizard.position)
        for count, number in enumerate(counted, 1):
            self.act("read", {"at": at, "count": count, "lines": self.read_lines}, line=number)

    def rings(self) -> list[str]:
        """The rings the wizard must fly through, in order: the `through_in_order`
        goal's (D187)."""
        for spec in self.level.goals:
            if spec.kind == "through_in_order":
                return list(spec.params.get("ids", []))
        return []

    def missed(self) -> list[str]:
        """The rings not flown through in their order (D187): a ring is flown through in
        its turn when it comes after the last one flown through; one passed over to
        fly through a later one is missed, and so is one flown through out of its
        turn, and one not flown through yet."""
        order = self.rings()
        done, passed = -1, set()
        for event in self.events:
            if event.kind == "through" and event.data.get("id") in order:
                index = order.index(event.data["id"])
                if index > done:
                    done = index
                    passed.add(event.data["id"])
        return [ring for ring in order if ring not in passed]

    def namespace(self) -> dict[str, Child]:
        """What the child's code holds: the wizard, and the level's things and actors by
        id; not what the wizard holds from the start, which the code asks for with
        `find_item` (D123), so that no name is put into the program unseen."""
        things = {name: thing for name, thing in self.things.items() if not thing._k_spec.carried}
        return {"wizard": self.wizard, **things, **self.actors}

    def is_free(self, position: Position, flying: bool = False) -> bool:
        """Whether the wizard or an actor can walk onto a tile in the next tick: floor,
        no closed door, no open door's leaf (D125), and no cell of an open hole (D53,
        D167); or, `flying`, fly into it, a low cell too (D186)."""
        ground = self.level.flies(position) if flying else self.level.free(position)
        if not (ground and self._not_shut(position)):
            return False
        if self.leaf_over(position) is not None:
            return False
        hole = self.hole_at(position)
        return hole is None or hole._k_closed_at(self.tick + 1)

    def hole_at(self, position: Position) -> Hole | None:
        """The hole one of whose cells a tile is, or None (D167)."""
        for thing in self.things.values():
            if isinstance(thing, Hole) and thing._k_on(position):
                return thing
        return None

    def near_wizard(self, position: Position) -> bool:
        """Whether a tile is the wizard's or one of its eight neighbours."""
        here = self.wizard._k_position
        return abs(position.x - here.x) <= 1 and abs(position.y - here.y) <= 1

    def in_dark(self, position: Position) -> bool:
        """Whether a tile is in the level's dark area: the dark rooms, or anywhere
        when the level names none (D52, D73)."""
        return self.level.dark and (not self.level.dark_area or position in self.level.dark_area)

    def is_clear(self, position: Position) -> bool:
        """Whether sight passes a tile: floor or a shelf, and no closed door (D46)."""
        return self.level.clear(position) and self._not_shut(position)

    def _not_shut(self, position: Position) -> bool:
        door = self.door_at(position)
        return door is None or door.is_open

    def friend_at(self, position: Position) -> str | None:
        """The id of the friend standing on a tile, or None (D66): a friend, or a teacher
        who only stands by and watches for no one, as Ilda on the field (sight 0)."""
        for actor in self.actors.values():
            standing = isinstance(actor, Teacher) and not actor._k_spec.sight
            if (isinstance(actor, Friend) or standing) and actor.position == position:
                return actor.name
        return None

    def ring_at(self, position: Position) -> Ring | None:
        """The ring standing on a tile, or None (D187)."""
        for thing in self.things.values():
            if isinstance(thing, Ring) and thing._k_position == position:
                return thing
        return None

    def door_at(self, position: Position) -> Door | None:
        for thing in self.things.values():
            if isinstance(thing, Door) and position in thing._k_spec.cells:
                return thing
        return None

    def up_high(self, thing: Thing) -> bool:
        """Whether a thing lies up on a shelf, out of the hands' reach from any tile
        (D129): on one of the level's high shelves, and not hidden under it (D85)."""
        return thing._k_position in self.level.high and not thing._k_spec.hidden

    def leaf_over(self, position: Position) -> Door | None:
        """The open door whose leaf lies on a tile (D125), or None."""
        for thing in self.things.values():
            if isinstance(thing, Door) and thing.is_open and position in thing._k_spec.covers:
                return thing
        return None

    def shove(self, door: Door) -> None:
        """A door has opened: whoever stands where its leaf comes to lie steps to the
        nearest free tile of the same row, away from the door (D125), in the door's
        tick, as an event of the door's."""
        figures: list[Child] = [self.wizard, *self.actors.values()]
        for figure in figures:
            here = figure._k_position
            if here not in door._k_spec.covers:
                continue
            taken = {other._k_position for other in figures if other is not figure}
            way = -1 if here.x < door._k_position.x else 1
            to = None
            for along in (way, -way):
                x = here.x + along
                while self.level.inside(Position(x, here.y)) and to is None:
                    tile = Position(x, here.y)
                    if not self.level.free(tile) or not self._not_shut(tile):
                        break
                    if self.is_free(tile) and tile not in taken:
                        to = tile
                    x += along
                if to is not None:
                    break
            if to is None:
                continue
            name = "wizard" if figure is self.wizard else figure.name
            figure._set(position=to)
            moved = {"id": name, "from": list(here), "to": list(to), "by": door.name}
            self.note(door.name, "shoved", moved)

    def door_beside(self, position: Position, opens: Callable[[Door], bool]) -> Door | None:
        """The first closed door next to `position`, by id, for which `opens` holds."""
        for thing in sorted(self.things.values(), key=lambda t: t.name):
            if not isinstance(thing, Door) or thing.is_open:
                continue
            if thing._k_beside(position) and opens(thing):
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

    def act(
        self,
        kind: str,
        data: dict[str, Any],
        then: Callable[[], None] | None = None,
        line: int | None | object = CHILD,
    ) -> None:
        """One tick of the wizard's: its event, what it does to the world (`then`, as a
        door opening to a spell), every actor's step, who sees it, the goals. Its line
        is the child's code's running now, or the one given (Ilda's reading, D189)."""
        self.ready()
        self.tick += 1
        self._line = child_line() if line is CHILD else line  # type: ignore[assignment]
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

    def refuse(self, by: str, reason: str, at: list[int]) -> None:
        """The wizard tries what cannot be done, and the program stops with an error in
        the child's words (D183): the try is seen, a tick, and raises."""
        self.act("blocked", {"at": at, "by": by, "reason": reason, "tried": True})
        self.error = reason
        raise Refused(reason, by)

    def finish(self, ended: bool = True) -> None:
        """The child's code has ended, `ended` when it came to its end with the world
        still running: a broom in the air sets down where it is (D185), a race is flown
        out until the racer crosses the finish, unless the wizard stands on its last
        cell (D189); then the goals that are met only then are checked."""
        if self.over is None and self.wizard._k_flying:
            self.wizard._set(flying=False)
            self.note("broom", "land", {"id": "wizard", "at": list(self.wizard.position)})
        race = self.level.race
        if ended and self.over is None and race is not None:
            last = race.path[race.path.index(race.finish)]
            end = race.tick - 1 if last == self.wizard.position else race.tick
            at = list(self.wizard.position)
            try:
                while self.tick < min(end, self.level.tick_limit):
                    self.act("wait", {"at": at, "after": True}, line=None)
            except RunOver:
                pass
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


def _steps(name: str, value: object) -> int:
    """A move's steps: a whole number, 0 or more. Zero walks nothing and takes no tick,
    the rest of a walk already done (D133); a number below zero is refused."""
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ActionArguments(name, f"{name}() takes a whole number of steps, 0 or more")
    return value


class Wizard(Child):
    """The child's wizard. Its methods are its actions, which the child's code makes it do:
    moving, waiting, saying, picking up, finding, looking at what it carries, and casting
    a spell with the wand (architecture.md, D27, D42)."""

    _k_role = "wizard"

    def __init__(self, world: World) -> None:
        # `ring`: the ring whose cell the wizard flew into, and the way it was going, so
        # that flying on the same way out of it goes through the ring (D187).
        self._set(
            world=world, position=world.level.start, facing=Direction.DOWN, flying=False, ring=None
        )

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

    @property
    def flying(self) -> bool:
        """True while the wizard flies on its broom, from drevo on: `wizard.flying`"""
        return self._k_flying

    def _move(self, direction: Direction, steps: int) -> None:
        world: World = self._k_world
        for _ in range(steps):
            world.ready()
            self._set(facing=direction)
            dx, dy = direction.delta
            here = self._k_position
            ahead = Position(here.x + dx, here.y + dy)
            flying = self._k_flying
            friend = world.friend_at(ahead)
            if friend is not None:
                # A friend stands in the way: the wizard walks round (D66).
                world.act(
                    "bump",
                    {"at": list(here), "facing": direction.value, "by": "friend", "id": friend},
                )
                return
            if ahead in world.level.forbidden:
                # A tile the wizard may not step on, though anyone else may (D84).
                reason = world.level.forbidden_reason
                refused = {"at": list(here), "by": "wizard", "reason": reason, "tried": False}
                world.act("blocked", {**refused, "facing": direction.value})
                return
            leaf = world.leaf_over(ahead)
            if leaf is not None:
                # An open door's leaf lies there (D125).
                refused = {
                    "at": list(here),
                    "by": leaf.name,
                    "reason": "door_leaf",
                    "tried": False,
                }
                world.act("blocked", {**refused, "facing": direction.value})
                return
            if not flying and ahead in world.level.low:
                # Water, a hedge, a bench: a flight crosses it, a walk does not (D186).
                kind = world.level.kinds.get(ahead, "low")
                refused = {"at": list(here), "by": "wizard", "reason": "no_walk", "tried": False}
                world.act("blocked", {**refused, "facing": direction.value, "kind": kind})
                return
            ring = world.ring_at(ahead)
            if ring is not None and not (flying and direction in (Direction.UP, Direction.DOWN)):
                # A ring is flown through from above or below, never walked into nor flown
                # into from its side (D187).
                world.act(
                    "bump",
                    {"at": list(here), "facing": direction.value, "by": "ring", "id": ring.name},
                )
                return
            if not world.is_free(ahead, flying):
                by = (
                    "door"
                    if world.door_at(ahead) is not None
                    else "hole"
                    if world.hole_at(ahead) is not None
                    else "high"
                    if flying
                    else "wall"
                )
                bumped = {"at": list(here), "facing": direction.value, "by": by}
                if ahead in world.level.kinds:
                    bumped["kind"] = world.level.kinds[ahead]
                world.act("bump", bumped)
                return
            race = world.level.race
            if race is not None and ahead == race.finish and world.crossed_at is None:
                # Five ticks before the finish for each ring missed, circling (D189).
                missed = world.missed()
                for ring_id in missed:
                    for _ in range(RING_PENALTY):
                        world.act("circle", {"at": list(here), "ring": ring_id})
                        world.penalty += 1
            through = self._k_through(direction)
            self._set(position=ahead, ring=(ring.name, direction) if ring is not None else None)
            step = {"from": list(here), "to": list(ahead), "facing": direction.value}
            world.act(
                "move",
                {**step, "flying": True} if flying else step,
                then=partial(self._k_moved, through, here, ahead),
            )

    def _k_moved(self, through: str | None, here: Position, ahead: Position) -> None:
        """In a move's tick, before the goals are looked at: the ring flown through
        (D187), and a race's finish crossed (D189)."""
        world: World = self._k_world
        if through is not None:
            world.note(through, "through", {"id": through, "at": list(here)})
        race = world.level.race
        if race is not None and ahead == race.finish and world.crossed_at is None:
            world.crossed_at = world.tick

    def _k_through(self, direction: Direction) -> str | None:
        """The ring whose cell the wizard leaves the way it flew in, so flying through
        it (D187), or None."""
        entered = self._k_ring
        if entered is None:
            return None
        name, way = entered
        return name if way == direction else None

    def move_right(self, steps: int = 1) -> None:
        """Walk right, one tile per step, stopping at a wall or a closed door:
        `wizard.move_right(3)`"""
        self._move(Direction.RIGHT, _steps("move_right", steps))

    def move_left(self, steps: int = 1) -> None:
        """Walk left, one tile per step, stopping at a wall or a closed door:
        `wizard.move_left(3)`"""
        self._move(Direction.LEFT, _steps("move_left", steps))

    def move_up(self, steps: int = 1) -> None:
        """Walk up, one tile per step, stopping at a wall or a closed door:
        `wizard.move_up(3)`"""
        self._move(Direction.UP, _steps("move_up", steps))

    def move_down(self, steps: int = 1) -> None:
        """Walk down, one tile per step, stopping at a wall or a closed door:
        `wizard.move_down(3)`"""
        self._move(Direction.DOWN, _steps("move_down", steps))

    def say(self, text: object) -> None:
        """Say something out loud, a word or a number; a door beside the wizard opens to
        its password: `wizard.say("Hello!")`, `wizard.say(6)`"""
        if not isinstance(text, str | int | float):
            raise ActionArguments("say", "say() takes a word or a number", 'wizard.say("Hello!")')
        world: World = self._k_world
        said = str(text)
        world.ready()
        door = world.door_beside(self._k_position, lambda d: d.password == said)
        opens = (lambda: door._opened_by("word")) if door else None
        world.act("say", {"text": said}, then=opens)

    def cast(self, spell: str, thing: Thing | None = None) -> None:
        """Cast a spell with the wand, which the wizard must carry; it works where the
        wizard stands, and fendra on the thing it is given: `wizard.cast("zelim")`,
        `wizard.cast("fendra", book)`"""
        if not isinstance(spell, str):
            raise ActionArguments("cast", "cast() takes a spell's name, in quotes")
        if spell in AIMED and not isinstance(thing, Thing):
            raise ActionArguments(
                "cast", f"{spell} takes the thing to bring", f'wizard.cast("{spell}", book)'
            )
        if spell not in AIMED and thing is not None:
            raise ActionArguments("cast", f"{spell} takes no thing", f'wizard.cast("{spell}")')
        world: World = self._k_world
        world.ready()
        here = list(self._k_position)
        if not self.has("wand"):
            # Without the wand the wizard does not know the action (D27): nothing to try.
            world.act("blocked", {"at": here, "by": "wizard", "reason": "no_wand", "tried": False})
            return
        # The map's spell works wherever the map is carried, needed or not.
        if spell not in world.level.spells and not (spell == "orvim" and self.has("map")):
            refused = {"at": here, "by": "wizard", "reason": "unknown_spell", "tried": True}
            world.act("blocked", {**refused, "spell": spell})
            return
        effect = SPELLS[spell](world, self._k_position, thing)
        if effect.refused is not None:
            by = thing.name if thing is not None else "wizard"
            refused = {"at": here, "by": by, "reason": effect.refused, "tried": True}
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
                # Seen up on a shelf in a straight line, it is too high for the hands.
                high = thing in self._k_too_high()
                reason = "too_high" if high else "far"
                refused = {"at": list(here), "by": thing.name, "reason": reason, "tried": high}
                world.act("blocked", refused)
                return
            chosen = thing
        else:
            if not reach:
                high = self._k_too_high()
                refused = (
                    {"by": high[0].name, "reason": "too_high"}
                    if high
                    else {"by": "wizard", "reason": "nothing"}
                )
                world.act("blocked", {"at": list(here), **refused, "tried": True})
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
        """The things the wizard can pick up: on its tile, or on one of the four beside it
        (D58), but for one up on a shelf, which only fendra brings down (D129); in
        reading order."""
        world: World = self._k_world
        here = self._k_position
        tiles = [here, *(Position(here.x + dx, here.y + dy) for dx, dy in DELTAS)]
        found = [t for tile in tiles for t in world.things_at(tile) if not world.up_high(t)]
        return sorted(
            found, key=lambda t: (t._k_position != here, t._k_position.y, t._k_position.x)
        )

    def _k_too_high(self) -> list[Thing]:
        """The things the hands cannot reach and fendra could: on a tile no one walks
        on, a shelf, in sight along one of the four ways, FENDRA_REACH tiles at most,
        nearest first."""
        world: World = self._k_world
        here = self._k_position
        return [
            thing for _, thing in in_line(world, here) if not world.level.free(thing._k_position)
        ]

    def _nearby(self, kind: object) -> list[Child]:
        """The things and actors of a kind the wizard finds where it stands, nearest
        first: a thing of a zone only from within it (D196)."""
        world: World = self._k_world
        here = self._k_position
        found: list[tuple[int, int, int, Child]] = []
        for item in [*world.things.values(), *world.actors.values()]:
            where = item.position
            zone = item._k_spec.zone if isinstance(item, Thing) else None
            if zone is not None and here not in world.level.zones.get(zone, ()):
                continue
            if item.kind == kind and where is not None:
                distance = abs(where.x - here.x) + abs(where.y - here.y)
                found.append((distance, where.y, where.x, item))
        return [item for *_, item in sorted(found, key=lambda f: f[:3])]

    def find_nearest(self, kind: str) -> Child | None:
        """The nearest thing of a kind, or None when there is none:
        `wizard.find_nearest("key")`"""
        nearby = self._nearby(kind)
        self._k_found(nearby[:1])
        return nearby[0] if nearby else None

    def find_item(self, kind: str) -> Thing | None:
        """The thing of a kind the wizard carries, or None when it carries none:
        `wizard.find_item("book")`"""
        carried = [item for item in self._k_world.carried() if item.kind == kind]
        return sorted(carried, key=lambda item: item.name)[0] if carried else None

    def find_all(self, kind: str) -> list[Child]:
        """Every thing of a kind, nearest first, as a list: `wizard.find_all("broom")`"""
        nearby = self._nearby(kind)
        self._k_found(nearby)
        return nearby

    def _k_found(self, found: list[Child]) -> None:
        """What the wizard finds that lay hidden, a broom in the straw, is seen from then
        on: the world's `found` event, in the tick going on, since finding takes none
        (D184)."""
        world: World = self._k_world
        hidden = [
            thing
            for thing in found
            if isinstance(thing, Thing) and thing._k_spec.hidden and thing.name not in world.found
        ]
        if not hidden:
            return
        world.found.update(thing.name for thing in hidden)
        cells = [list(thing._k_position) for thing in hidden]
        world.note("world", "found", {"ids": [thing.name for thing in hidden], "at": cells})

    def sleep(self) -> None:
        """Lie down in a free bed beside the wizard, and sleep: `wizard.sleep()`"""
        world: World = self._k_world
        world.ready()
        here = self._k_position
        # A bed beside the wizard, or one whose pillow it stands under (D84, D130).
        beds = [
            thing
            for thing in sorted(world.things.values(), key=lambda t: t.name)
            if isinstance(thing, Bed)
            and (
                abs(thing._k_position.x - here.x) + abs(thing._k_position.y - here.y) == 1
                or thing._k_spec.pillow_side == here
            )
        ]
        free = [bed for bed in beds if bed.free]
        if not free:
            reason = "bed_taken" if beds else "no_bed"
            world.act(
                "blocked", {"at": list(here), "by": "wizard", "reason": reason, "tried": False}
            )
            return
        bed = free[0]
        # To the floor under the bed's pillow first, a cell a tick, as any walk (D130).
        side = bed._k_spec.pillow_side
        for step in self._k_way_to(side) if side is not None else []:
            world.ready()
            direction = _direction(here, step)
            self._set(facing=direction, position=step)
            world.act("move", {"from": list(here), "to": list(step), "facing": direction.value})
            here = step
        # Then, facing the bed, into it.
        spot = bed._k_position
        facing = (
            _direction(here, Position(here.x, spot.y))
            if spot.y != here.y
            else _direction(here, Position(spot.x, here.y))
        )
        self._set(facing=facing)
        world.slept = bed.name
        data = {"id": bed.name, "at": list(here), "bed": list(spot), "facing": facing.value}
        world.act("sleep", data)

    def _k_way_to(self, target: Position) -> list[Position]:
        """The cells the wizard walks to reach `target`, by the shortest way over cells it
        can step on in turn (free, not forbidden it, no friend there), PILLOW_WALK at
        most; none when it is there already, or no such way."""
        world: World = self._k_world
        start = self._k_position
        came: dict[Position, Position | None] = {start: None}
        edge = [start]
        for _ in range(PILLOW_WALK):
            if target in came:
                break
            ahead = []
            for cell in edge:
                for dx, dy in DELTAS:
                    there = Position(cell.x + dx, cell.y + dy)
                    if there in came or there in world.level.forbidden:
                        continue
                    if not world.is_free(there) or world.friend_at(there) is not None:
                        continue
                    came[there] = cell
                    ahead.append(there)
            edge = ahead
        if target not in came or target == start:
            return []
        # Back from the target to the start, each cell to the one it was reached from.
        way, cell = [], target
        while cell != start:
            way.append(cell)
            cell = came[cell] or start
        return way[::-1]

    def distance_to(self, other: object) -> int | None:
        """How many steps lie between the wizard and a thing or someone, along the rows
        and the columns: `wizard.distance_to(key)`"""
        return steps_between(self, other)

    def _k_where(self) -> Position:
        return self._k_position

    def has(self, kind: str) -> bool:
        """True when the wizard carries a thing of that kind: `wizard.has("key")`"""
        return any(item.kind == kind for item in self._k_world.carried())


@dataclass(frozen=True)
class Effect:
    """What a spell does when cast: `then`, the change to the world in the wizard's
    tick, or nothing; or `refused`, the reason it could not be cast here."""

    then: Callable[[], None] | None = None
    refused: str | None = None


def _zelim(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Breaks the seal of a door beside the wizard; away from one it does nothing."""
    door = world.door_beside(here, lambda d: d._k_seal == "zelim")
    return Effect(then=(lambda: door._opened_by("spell")) if door else None)


#: How far `fendra` reaches along each of the four ways (D47).
FENDRA_REACH = 3


#: The spells cast on a thing the child names, the second argument of `cast`.
AIMED = ("fendra",)


def in_line(world: World, here: Position) -> list[tuple[int, Thing]]:
    """The things lying in sight from a tile along the four ways, FENDRA_REACH tiles at
    most each, through shelves and not through walls or closed doors, nor past a
    door's cell, open or shut, but the one the wizard stands on (D129), with how far
    each is: nearest first, then in reading order."""
    found: list[tuple[int, int, int, Thing]] = []
    for facing in ("up", "down", "left", "right"):
        for tile in sight_tiles(world.is_clear, here, facing, FENDRA_REACH):
            for thing in world.things_at(tile):
                distance = abs(tile.x - here.x) + abs(tile.y - here.y)
                found.append((distance, tile.y, tile.x, thing))
            if world.door_at(tile) is not None:
                break
    return [(distance, thing) for distance, _, _, thing in sorted(found, key=lambda f: f[:3])]


def _fendra(world: World, here: Position, thing: Thing | None) -> Effect:
    """Draws the thing named onto the wizard's tile, when it lies in sight along one of
    the four ways, three tiles at most, through shelves and not through walls or closed
    doors (D47), nor past a doorway the wizard does not stand in (D129); anywhere else,
    or carried, it is out of the spell's reach."""
    if thing is None or thing not in [found for _, found in in_line(world, here)]:
        return Effect(refused="out_of_reach")

    def pull() -> None:
        before = thing._k_position
        thing._set(position=here)
        world.note(thing.name, "pull", {"id": thing.name, "from": list(before), "to": list(here)})

    return Effect(then=pull)


def _kirra(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Lights the dark room the wizard is in for the rest of the run (D52, D73); in a
    lit room, or outside the dark one, it does nothing."""
    if world.lit or not world.in_dark(here):
        return Effect()

    def light() -> None:
        world.lit = True
        world.note("world", "light", {"at": list(here)})

    return Effect(then=light)


def _osto(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Holds a hole beside the wizard closed, from beside any of its cells (D53, D167);
    with none beside, refused."""
    beside = [
        thing
        for thing in sorted(world.things.values(), key=lambda t: t.name)
        if isinstance(thing, Hole) and thing._k_beside(here)
    ]
    if not beside:
        return Effect(refused="nothing_near")
    return Effect(then=beside[0]._hold)


def _orvim(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Opens the naughty child's map on the plan of the scene (D134): the world's `map`
    event, at which the page pauses and opens the plan; with no map carried, refused."""
    if not world.wizard.has("map"):
        return Effect(refused="no_map")
    return Effect(then=lambda: world.note("world", "map", {"at": list(here)}))


def _drevo(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Lifts the broom the wizard carries into the air (D185): from then on every move
    flies, over the low cells and through the rings, until the program ends and the
    broom sets down; with no broom carried, refused; in the air already, nothing."""
    if not world.wizard.has("broom"):
        return Effect(refused="no_broom")
    if world.wizard._k_flying:
        return Effect()

    def lift() -> None:
        world.wizard._set(flying=True)
        world.note("broom", "fly", {"id": "wizard", "at": list(here)})

    return Effect(then=lift)


#: Each spell's effect, by its name (D42); kydux_world.level.KNOWN_SPELLS lists the
#: same names, so that a level can be checked without the world.
SPELLS: dict[str, Callable[[World, Position, Thing | None], Effect]] = {
    "zelim": _zelim,
    "fendra": _fendra,
    "kirra": _kirra,
    "osto": _osto,
    "orvim": _orvim,
    "drevo": _drevo,
}
