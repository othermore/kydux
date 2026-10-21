"""A level: its map, what is on it, what it teaches, and what it asks of the wizard.

A level is read from its level.json. The map is rows of characters: `#` a
wall, `.` floor, `=` a shelf (no one walks on it, a thing may lie on it, and
sight passes over it, D46), `S` where the wizard starts, and any other
letter a floor tile that things, actors and goals may name by that letter (a
marker), like `D` for a door. Positions are (x, y) from the top-left corner,
x to the right and y down.

Beside the map: `things` (keys, doors, books...) and `actors` (the teacher,
the ghost, the cat), each placed by a marker or at x and y, with an id the
child's code knows it by; `carrying`, the kinds of thing the wizard holds
from the start (D49); `spells`, the spells that can be cast (D42); `api`,
the names the level teaches (D23); `goals`, some of them bonus goals; and
`tick_limit`. A level may come with goals of its own, in a goals.py beside
level.json, whose source the loader passes as `goals_source`.
"""

import json
import keyword
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, NamedTuple

from .api import check_api


class Position(NamedTuple):
    x: int
    y: int


class LevelError(ValueError):
    """A level definition that cannot be played."""


WALL, FLOOR, SHELF, START = "#", ".", "=", "S"

#: The kinds of thing a level may hold, and the ones the wizard can carry.
THING_KINDS = ("key", "door", "book", "wand", "potion")
CARRIED_KINDS = ("key", "book", "wand", "potion")
ACTOR_KINDS = ("teacher", "ghost", "cat")
#: The spells the world knows how to cast; a level names those it has (D42).
#: Each has its effect in kydux_world.world.SPELLS.
KNOWN_SPELLS = ("zelim", "fendra")
FACINGS = ("up", "down", "left", "right")
DEFAULT_SIGHT = 4


@dataclass(frozen=True)
class GoalSpec:
    kind: str
    params: dict[str, Any] = field(default_factory=dict)
    bonus: bool = False


@dataclass(frozen=True)
class ThingSpec:
    kind: str
    id: str
    position: Position
    #: For a key, the id of the door it opens, or None for any door.
    opens: str | None = None
    #: For a door, whether it needs a key.
    locked: bool = False
    #: For a door, the spell that breaks its seal, or None (D43).
    sealed: str | None = None
    #: For a door, the word that opens it when said beside it, or None (D43).
    password: str | None = None
    #: Carried by the wizard from the start, with no tile of its own (D49).
    carried: bool = False


@dataclass(frozen=True)
class ActorSpec:
    kind: str
    id: str
    position: Position
    facing: str
    #: The tiles the actor walks, from its position, one per tick, back and forth.
    patrol: tuple[Position, ...] = ()
    sight: int = DEFAULT_SIGHT


@dataclass(frozen=True)
class Level:
    id: str
    width: int = 1
    height: int = 1
    walls: frozenset[Position] = frozenset()
    shelves: frozenset[Position] = frozenset()
    start: Position = Position(0, 0)
    goals: tuple[GoalSpec, ...] = ()
    tick_limit: int = 1000
    markers: dict[str, Position] = field(default_factory=dict)
    things: tuple[ThingSpec, ...] = ()
    actors: tuple[ActorSpec, ...] = ()
    api: tuple[str, ...] = ()
    goals_source: str | None = None
    #: The spells that exist in the level, which the wand can cast (D42).
    spells: tuple[str, ...] = ()

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Level":
        level_id = data.get("id")
        if not isinstance(level_id, str) or not level_id:
            raise LevelError("a level needs an id")
        rows = data.get("map")
        if not isinstance(rows, list) or not rows or not all(isinstance(r, str) for r in rows):
            raise LevelError(f"{level_id}: the map must be a list of rows of characters")
        width = len(rows[0])
        if width == 0 or any(len(row) != width for row in rows):
            raise LevelError(f"{level_id}: the map's rows must all be as long as the first")

        walls, shelves, starts, markers = set(), set(), [], {}
        for y, row in enumerate(rows):
            for x, char in enumerate(row):
                here = Position(x, y)
                if char == WALL:
                    walls.add(here)
                elif char == SHELF:
                    shelves.add(here)
                elif char == START:
                    starts.append(here)
                elif char == FLOOR:
                    pass
                elif char.isalpha():
                    if char in markers:
                        raise LevelError(f"{level_id}: the marker {char} is on the map twice")
                    markers[char] = here
                else:
                    raise LevelError(f"{level_id}: {char!r} at {x},{y} is not a map character")
        if len(starts) != 1:
            raise LevelError(f"{level_id}: the map needs exactly one S, and has {len(starts)}")

        shape = _Shape(level_id, width, len(rows), frozenset(walls), frozenset(shelves), markers)
        things = tuple(_thing(shape, spec) for spec in _list(data, "things", level_id))
        things += _carrying(data, level_id, starts[0])
        actors = tuple(_actor(shape, spec) for spec in _list(data, "actors", level_id))
        _check_ids(level_id, things, actors)
        doors = {t.id for t in things if t.kind == "door"}
        for thing in things:
            if thing.opens is not None and thing.opens not in doors:
                raise LevelError(f"{level_id}: the key {thing.id} opens {thing.opens}, no door")

        goals = []
        for spec in _list(data, "goals", level_id):
            if not isinstance(spec.get("kind"), str):
                raise LevelError(f"{level_id}: a goal needs a kind")
            params = {k: v for k, v in spec.items() if k not in ("kind", "bonus")}
            marker = params.get("marker")
            if marker is not None and marker not in markers:
                raise LevelError(f"{level_id}: a goal names the marker {marker}, not on the map")
            goals.append(GoalSpec(spec["kind"], params, bool(spec.get("bonus", False))))
        if goals and all(goal.bonus for goal in goals):
            raise LevelError(f"{level_id}: a level needs a goal that is not a bonus")

        tick_limit = data.get("tick_limit", 1000)
        if not isinstance(tick_limit, int) or tick_limit < 1:
            raise LevelError(f"{level_id}: tick_limit must be a whole number, 1 or more")

        api = data.get("api", [])
        if not isinstance(api, list) or not all(isinstance(name, str) for name in api):
            raise LevelError(f"{level_id}: api must be a list of names")

        spells = data.get("spells", [])
        if not isinstance(spells, list) or not all(
            isinstance(spell, str) and spell.isalpha() and spell.islower() for spell in spells
        ):
            raise LevelError(f"{level_id}: spells must be a list of words in small letters")
        for spell in spells:
            if spell not in KNOWN_SPELLS:
                raise LevelError(f"{level_id}: {spell} is not a spell the world knows")
        for thing in things:
            if thing.sealed is not None and thing.sealed not in spells:
                raise LevelError(
                    f"{level_id}: the door {thing.id} is sealed by {thing.sealed}, "
                    "which is not a spell here"
                )

        own = data.get("own_goals", False)
        source = data.get("goals_source")
        if not isinstance(own, bool) or (source is not None and not isinstance(source, str)):
            raise LevelError(f"{level_id}: own_goals is true or false, with goals.py's source")
        if own != (source is not None):
            raise LevelError(
                f"{level_id}: own_goals says goals.py, and its source must come with it"
            )

        level = cls(
            id=level_id,
            width=width,
            height=len(rows),
            walls=frozenset(walls),
            shelves=frozenset(shelves),
            start=starts[0],
            goals=tuple(goals),
            tick_limit=tick_limit,
            markers=markers,
            things=things,
            actors=actors,
            api=tuple(api),
            goals_source=source,
            spells=tuple(spells),
        )
        check_api(level)
        return level

    @classmethod
    def from_json(cls, text: str) -> "Level":
        return cls.from_dict(json.loads(text))

    @classmethod
    def from_directory(cls, directory: Path) -> "Level":
        """A level from its directory: level.json, and goals.py when level.json says
        `"own_goals": true`."""
        data = json.loads((directory / "level.json").read_text(encoding="utf-8"))
        goals = directory / "goals.py"
        if goals.is_file() != bool(data.get("own_goals", False)):
            raise LevelError(f"{directory.name}: goals.py and own_goals in level.json go together")
        if goals.is_file():
            data["goals_source"] = goals.read_text(encoding="utf-8")
        return cls.from_dict(data)

    def inside(self, position: Position) -> bool:
        return 0 <= position.x < self.width and 0 <= position.y < self.height

    def free(self, position: Position) -> bool:
        """Inside the map, and neither a wall nor a shelf: a tile to walk on. Doors are
        the world's to say."""
        return self.clear(position) and position not in self.shelves

    def clear(self, position: Position) -> bool:
        """Inside the map and not a wall: a tile sight passes, shelves too (D46)."""
        return self.inside(position) and position not in self.walls

    def ids(self) -> list[str]:
        """The names of the level's things and actors, as the child's code knows them."""
        return [t.id for t in self.things] + [a.id for a in self.actors]


@dataclass(frozen=True)
class _Shape:
    level_id: str
    width: int
    height: int
    walls: frozenset[Position]
    shelves: frozenset[Position]
    markers: dict[str, Position]

    def place(self, spec: dict[str, Any], what: str, walks: bool = False) -> Position:
        """Where a thing lies, or, with `walks`, where an actor stands: not on a shelf."""
        here = self._place(spec, what)
        if walks and here in self.shelves:
            raise LevelError(f"{self.level_id}: {what} cannot stand on a shelf")
        return here

    def _place(self, spec: dict[str, Any], what: str) -> Position:
        if "marker" in spec:
            marker = spec["marker"]
            if marker not in self.markers:
                raise LevelError(
                    f"{self.level_id}: {what} names the marker {marker}, not on the map"
                )
            return self.markers[marker]
        if "at" in spec:
            return self.tile(spec["at"], what)
        raise LevelError(f"{self.level_id}: {what} needs a marker or at")

    def tile(self, value: Any, what: str) -> Position:
        if not (
            isinstance(value, list)
            and len(value) == 2
            and all(isinstance(v, int) and not isinstance(v, bool) for v in value)
        ):
            raise LevelError(f"{self.level_id}: {what}'s tile must be [x, y]")
        here = Position(*value)
        if not (0 <= here.x < self.width and 0 <= here.y < self.height) or here in self.walls:
            raise LevelError(f"{self.level_id}: {what}'s tile {here.x},{here.y} is not floor")
        return here


def _list(data: dict[str, Any], key: str, level_id: str) -> list[dict[str, Any]]:
    items = data.get(key, [])
    if not isinstance(items, list) or not all(isinstance(item, dict) for item in items):
        raise LevelError(f"{level_id}: {key} must be a list of objects")
    return items


def _identifier(level_id: str, value: Any, what: str) -> str:
    if not isinstance(value, str) or not value.isidentifier() or keyword.iskeyword(value):
        raise LevelError(f"{level_id}: {what} needs an id that is a Python name")
    if value == "wizard":
        raise LevelError(f"{level_id}: {what} cannot be called wizard")
    return value


def _thing(shape: _Shape, spec: dict[str, Any]) -> ThingSpec:
    kind = spec.get("kind")
    if kind not in THING_KINDS:
        raise LevelError(f"{shape.level_id}: there is no thing of kind {kind}")
    thing_id = _identifier(shape.level_id, spec.get("id"), f"a {kind}")
    opens = spec.get("opens")
    if opens is not None and (kind != "key" or not isinstance(opens, str)):
        raise LevelError(f"{shape.level_id}: only a key opens, and it opens a door by its id")
    locked = spec.get("locked", False)
    if not isinstance(locked, bool) or (locked and kind != "door"):
        raise LevelError(f"{shape.level_id}: only a door is locked, true or false")
    sealed, password = spec.get("sealed"), spec.get("password")
    for name, value in (("sealed", sealed), ("password", password)):
        if value is not None and (kind != "door" or not isinstance(value, str) or not value):
            raise LevelError(f"{shape.level_id}: only a door is {name}, by a word")
    if sum((locked, sealed is not None, password is not None)) > 1:
        raise LevelError(
            f"{shape.level_id}: the door {thing_id} is locked, sealed or has a password, "
            "one of them at most"
        )
    return ThingSpec(kind, thing_id, shape.place(spec, thing_id), opens, locked, sealed, password)


def _actor(shape: _Shape, spec: dict[str, Any]) -> ActorSpec:
    kind = spec.get("kind")
    if kind not in ACTOR_KINDS:
        raise LevelError(f"{shape.level_id}: there is no actor of kind {kind}")
    actor_id = _identifier(shape.level_id, spec.get("id"), f"a {kind}")
    position = shape.place(spec, actor_id, walks=True)
    waypoints = spec.get("patrol", [])
    if not isinstance(waypoints, list):
        raise LevelError(f"{shape.level_id}: {actor_id}'s patrol must be a list of [x, y]")
    path, here = [position], position
    for value in waypoints:
        there = shape.tile(value, f"{actor_id}'s patrol")
        if there.x != here.x and there.y != here.y:
            raise LevelError(f"{shape.level_id}: {actor_id}'s patrol goes in straight lines")
        dx = (there.x > here.x) - (there.x < here.x)
        dy = (there.y > here.y) - (there.y < here.y)
        while here != there:
            here = Position(here.x + dx, here.y + dy)
            if here in shape.walls or here in shape.shelves:
                raise LevelError(
                    f"{shape.level_id}: {actor_id}'s patrol walks through a wall or a shelf"
                )
            path.append(here)
    facing = spec.get("facing")
    if facing is None:
        facing = _towards(path[0], path[1]) if len(path) > 1 else "down"
    if facing not in FACINGS:
        raise LevelError(f"{shape.level_id}: {actor_id} faces up, down, left or right")
    sight = spec.get("sight", DEFAULT_SIGHT)
    if not isinstance(sight, int) or isinstance(sight, bool) or sight < 1:
        raise LevelError(f"{shape.level_id}: {actor_id}'s sight must be a whole number, 1 or more")
    patrol = tuple(path) if len(path) > 1 else ()
    return ActorSpec(kind, actor_id, position, facing, patrol, sight)


def _carrying(data: dict[str, Any], level_id: str, start: Position) -> tuple[ThingSpec, ...]:
    """The things the wizard holds from the start (D49): one of each kind named, its id
    the kind's name, with no tile of its own."""
    kinds = data.get("carrying", [])
    if not isinstance(kinds, list) or not all(kind in CARRIED_KINDS for kind in kinds):
        raise LevelError(f"{level_id}: carrying lists kinds of thing the wizard can carry")
    if len(set(kinds)) != len(kinds):
        raise LevelError(f"{level_id}: carrying names a kind twice")
    return tuple(ThingSpec(kind, kind, start, carried=True) for kind in kinds)


def _towards(here: Position, there: Position) -> str:
    if there.x > here.x:
        return "right"
    if there.x < here.x:
        return "left"
    return "down" if there.y > here.y else "up"


def _check_ids(
    level_id: str, things: tuple[ThingSpec, ...], actors: tuple[ActorSpec, ...]
) -> None:
    seen: set[str] = set()
    for item_id in [t.id for t in things] + [a.id for a in actors]:
        if item_id in seen:
            raise LevelError(f"{level_id}: two things or actors are called {item_id}")
        seen.add(item_id)
