"""A level: its map, what is on it, what it teaches, and what it asks of the wizard.

A level is read from its level.json. The map is rows of characters: `#` a
wall, `.` floor, `=` a shelf (no one walks on it, a thing may lie on it, and
sight passes over it, D46), `S` where the wizard starts, and any other
letter a floor tile that things, actors and goals may name by that letter (a
marker), like `D` for a door. Positions are (x, y) from the top-left corner,
x to the right and y down.

A level that is a part of a chapter's scene (D65) names it in `scene` instead
of giving a map: the scene's rows are read from content/scenes/<id>/map.txt,
letters whose terrains its scene.json names (D73), and the level puts the
wizard at `start` and the `E` the reach goal wants at `end`, each [x, y];
`from_directory` builds the level's map from them. A story told on a scene
(D74) is staged on it the same way, by `story_on_scene`.

Beside the map: `things` (keys, doors, books...) and `actors` (the teacher,
the ghost, the cat, a friend), each placed by a marker or at x and y, with an
id the child's code knows it by, an actor maybe `asleep` in a bed beside it
(D91); `carrying`, the kinds of thing the wizard holds
from the start (D49); `spells`, the spells that can be cast (D42); `words`,
the passwords the level gives the child, each a door's (D80); `api`,
the names the level teaches (D23); `goals`, some of them bonus goals;
`tick_limit`; `dark`, a room unlit until `kirra` (D52); `forbidden`, the
tiles the wizard may not step on and why, which its scene gives (D84); and
`ways`, the ways the level is played, each one the same program must win
(D51). A level may
come with goals of its own, in a goals.py beside level.json, whose source
the loader passes as `goals_source`.
"""

import json
import keyword
from dataclasses import dataclass, field, replace
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
THING_KINDS = ("key", "door", "book", "wand", "potion", "stair", "bed")
CARRIED_KINDS = ("key", "book", "wand", "potion")
#: The terrains a thing lies up on, out of the hands' reach (D129): a level map's
#: shelf, a scene's bookcase. A thing on another tile no one walks, a stone or a
#: pile of books, lies within reach of the tile beside it.
HIGH_KINDS = ("shelf", "bookcase")
ACTOR_KINDS = ("teacher", "ghost", "cat", "friend")
#: The spells the world knows how to cast; a level names those it has (D42).
#: Each has its effect in kydux_world.world.SPELLS.
KNOWN_SPELLS = ("zelim", "fendra", "kirra", "osto")
#: The kinds of level (D56): a screen to solve, a program to repair, a program to
#: make better, a challenge with no lesson before it.
LEVEL_KINDS = ("practice", "fix", "improve", "challenge")
#: What a way may say differently from the level it is a way of (D51).
WAY_FIELDS = ("id", "things", "actors", "carrying", "spells", "dark")
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
    #: For a stair, the ticks it is in place and then away, in turn (D53).
    period: int | None = None
    #: For a door, open from the start: a door an earlier level of the scene opened (D65).
    open: bool = False
    #: For a bed, whether no one sleeps in it, so that the wizard may (D84).
    free: bool = True
    #: For a bed, the floor cell under its pillow, in front of it, which whoever goes
    #: to bed walks to and hops in from (D130); None for a bed with no floor there.
    pillow_side: Position | None = None
    #: Lying where something painted covers it wholly, so that it is not seen until
    #: it is revealed or picked up (D85); the world treats it as any thing.
    hidden: bool = False
    #: For a door, the cells its open leaf lies on beside its doorway, which no one
    #: walks onto while it is open (D125).
    covers: tuple[Position, ...] = ()


@dataclass(frozen=True)
class ActorSpec:
    kind: str
    id: str
    position: Position
    facing: str
    #: The tiles the actor walks, from its position, one per tick, back and forth.
    patrol: tuple[Position, ...] = ()
    sight: int = DEFAULT_SIGHT
    #: The bed the actor lies asleep in (D91), or None. A sleeper is placed beside
    #: its bed, where it gets up, and lies on the bed's tile, standing in no one's way.
    asleep: str | None = None


@dataclass(frozen=True)
class Level:
    id: str
    width: int = 1
    height: int = 1
    walls: frozenset[Position] = frozenset()
    shelves: frozenset[Position] = frozenset()
    #: The shelves a thing lies up on, out of the hands' reach (HIGH_KINDS, D129).
    high: frozenset[Position] = frozenset()
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
    #: The passwords the level gives the child, for the notebook (D80).
    words: tuple[str, ...] = ()
    #: Whether the room is dark until `kirra` lights it (D52), and the tiles it
    #: covers: the dark rooms of the level's scene, or, when empty, the whole map (D73).
    dark: bool = False
    dark_area: frozenset[Position] = frozenset()
    #: The level's kind (D56), `practice` unless it says.
    kind: str = "practice"
    #: The ways the level is played, by id, each a level of its own (D51); empty
    #: for a level played one way.
    ways: tuple[tuple[str, "Level"], ...] = ()
    #: The tiles the wizard may not step on, though others may, and why: the other
    #: dormitory's arch (D84).
    forbidden: frozenset[Position] = frozenset()
    forbidden_reason: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Level":
        """A level from its level.json; with `ways`, the level as its first way, its
        `ways` each merged with the rest of level.json (D51)."""
        level_id = data.get("id")
        if not isinstance(level_id, str) or not level_id:
            raise LevelError("a level needs an id")
        if "scene" in data:
            raise LevelError(f"{level_id}: a level on a scene is read with its scene (on_scene)")
        if "ways" in data:
            ways = tuple((way["id"], cls._one(merged)) for way, merged in _ways(data))
            return replace(ways[0][1], ways=ways)
        return cls._one(data)

    @classmethod
    def _one(cls, data: dict[str, Any]) -> "Level":
        level_id = data["id"]
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

        shape = _Shape(
            level_id, width, len(rows), frozenset(walls), frozenset(shelves), markers, starts[0]
        )
        things = tuple(_thing(shape, spec) for spec in _list(data, "things", level_id))
        things += _carrying(data, level_id, starts[0])
        actors = tuple(_actor(shape, spec) for spec in _list(data, "actors", level_id))
        _check_ids(level_id, things, actors)
        things, actors = _sleepers(level_id, things, actors)
        doors = {t.id for t in things if t.kind == "door"}
        # No one stands where an open door's leaf lies (D125).
        covered = {cell: t.id for t in things if t.open for cell in t.covers}
        for who, at in [("the wizard", starts[0]), *((a.id, a.position) for a in actors)]:
            if at in covered:
                raise LevelError(f"{level_id}: {who} stands under {covered[at]}'s open leaf")
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

        words = data.get("words", [])
        if not isinstance(words, list) or not all(
            isinstance(word, str) and word.isalpha() and word.islower() for word in words
        ):
            raise LevelError(f"{level_id}: words must be a list of words in small letters")
        passwords = {thing.password for thing in things if thing.password is not None}
        for word in words:
            if word not in passwords:
                raise LevelError(f"{level_id}: {word} is the password of no door here")

        dark = data.get("dark", False)
        if not isinstance(dark, bool):
            raise LevelError(f"{level_id}: dark is true or false")
        kind = data.get("kind", "practice")
        if kind not in LEVEL_KINDS:
            raise LevelError(f"{level_id}: a level's kind is one of {', '.join(LEVEL_KINDS)}")
        if dark and "kirra" not in spells:
            raise LevelError(f"{level_id}: a dark level needs kirra among its spells")
        area = set()
        for box in _list_of_boxes(data.get("dark_area", []), level_id):
            x0, y0, x1, y1 = box
            area.update(Position(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1))
        if area and not dark:
            raise LevelError(f"{level_id}: a dark area needs the level to be dark")
        # A fixed thing of the scene is there in every level; its seal may be a
        # spell this level does not have, and the door then stays shut (D73).
        fixed = set(data.get("fixed", []))
        for thing in things:
            if thing.sealed is not None and thing.sealed not in spells and thing.id not in fixed:
                raise LevelError(
                    f"{level_id}: the door {thing.id} is sealed by {thing.sealed}, "
                    "which is not a spell here"
                )

        forbidden, forbidden_reason = _forbidden(
            data.get("forbidden"), level_id, walls, len(rows), width
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
            high=_high(data, frozenset(shelves)),
            start=starts[0],
            goals=tuple(goals),
            tick_limit=tick_limit,
            markers=markers,
            things=things,
            actors=actors,
            api=tuple(api),
            goals_source=source,
            spells=tuple(spells),
            words=tuple(words),
            dark=dark,
            dark_area=frozenset(area),
            kind=kind,
            forbidden=forbidden,
            forbidden_reason=forbidden_reason,
        )
        check_api(level)
        return level

    def way(self, way_id: str) -> "Level":
        """The level as one of its ways is played."""
        return dict(self.ways)[way_id]

    @classmethod
    def from_json(cls, text: str) -> "Level":
        return cls.from_dict(json.loads(text))

    @classmethod
    def from_directory(cls, directory: Path) -> "Level":
        """A level from its directory: level.json, its scene's map when it names one
        (D65), and goals.py when level.json says `"own_goals": true`."""
        data = json.loads((directory / "level.json").read_text(encoding="utf-8"))
        if "scene" in data:
            data = on_scene(
                data, read_scene(directory.parent.parent / "scenes", data["scene"], data.get("id"))
            )
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
    start: Position

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
    # A door is locked, or sealed, or has a password, or is both sealed and keyed by
    # a word, as the castle's door is: it opens once its word is said and its seal broken.
    if locked and (sealed is not None or password is not None):
        raise LevelError(
            f"{shape.level_id}: the door {thing_id} is locked, and so neither sealed "
            "nor keyed by a word"
        )
    period = spec.get("period")
    whole = isinstance(period, int) and not isinstance(period, bool) and period >= 1
    if (kind == "stair") != (period is not None) or (period is not None and not whole):
        raise LevelError(f"{shape.level_id}: a stair, and only a stair, has a whole period")
    opened = spec.get("open", False)
    if not isinstance(opened, bool) or (opened and kind != "door"):
        raise LevelError(f"{shape.level_id}: only a door is open from the start, true or false")
    if opened and (locked or sealed is not None):
        raise LevelError(
            f"{shape.level_id}: the door {thing_id} is open, and so neither locked nor sealed"
        )
    free = spec.get("free", True)
    if not isinstance(free, bool) or ("free" in spec and kind != "bed"):
        raise LevelError(f"{shape.level_id}: only a bed is free, true or false")
    hidden = spec.get("hidden", False)
    if not isinstance(hidden, bool) or (hidden and kind not in CARRIED_KINDS):
        raise LevelError(f"{shape.level_id}: only a thing the wizard carries is hidden")
    covers = _covers(shape, spec, thing_id)
    pillow_side = _pillow_side(shape, spec, thing_id)
    return ThingSpec(
        kind,
        thing_id,
        shape.place(spec, thing_id),
        opens,
        locked,
        sealed,
        password,
        period=period,
        open=opened,
        free=free,
        hidden=hidden,
        covers=covers,
        pillow_side=pillow_side,
    )


def _pillow_side(shape: _Shape, spec: dict[str, Any], thing_id: str) -> Position | None:
    """A bed's `pillow_side`, [x, y]: the floor cell under its pillow (D130), which
    its scene names."""
    value = spec.get("pillow_side")
    if value is None:
        return None
    if spec.get("kind") != "bed" or not (
        isinstance(value, list)
        and len(value) == 2
        and all(isinstance(v, int) and not isinstance(v, bool) for v in value)
    ):
        raise LevelError(f"{shape.level_id}: only a bed has a pillow_side, [x, y]")
    cell = Position(*value)
    inside = 0 <= cell.x < shape.width and 0 <= cell.y < shape.height
    if not inside or cell in shape.walls or cell in shape.shelves:
        raise LevelError(f"{shape.level_id}: {thing_id}'s pillow_side is no floor cell")
    return cell


def _covers(shape: _Shape, spec: dict[str, Any], thing_id: str) -> tuple[Position, ...]:
    """A door's `covers`: the floor cells its open leaf lies on, `{"open": [[x, y]...]}`,
    which its scene names (D125)."""
    covers = spec.get("covers")
    if covers is None:
        return ()
    cells = covers.get("open") if isinstance(covers, dict) and set(covers) == {"open"} else None
    if spec.get("kind") != "door" or not isinstance(cells, list):
        raise LevelError(f"{shape.level_id}: only a door covers cells, by its open state's")
    placed = tuple(shape.tile(cell, f"a cell {thing_id} covers") for cell in cells)
    if any(cell in shape.shelves for cell in placed):
        raise LevelError(f"{shape.level_id}: {thing_id} covers a shelf, not floor")
    return placed


def _actor(shape: _Shape, spec: dict[str, Any]) -> ActorSpec:
    kind = spec.get("kind")
    if kind not in ACTOR_KINDS:
        raise LevelError(f"{shape.level_id}: there is no actor of kind {kind}")
    actor_id = _identifier(shape.level_id, spec.get("id"), f"a {kind}")
    position = shape.place(spec, actor_id, walks=True)
    waypoints = spec.get("patrol", [])
    if kind == "friend" and waypoints:
        raise LevelError(f"{shape.level_id}: {actor_id} is a friend, who stands still")
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
    if facing is None and kind == "friend" and position != shape.start:
        # A friend looks at the wizard (D66).
        facing = _towards(position, shape.start)
    if facing is None:
        facing = _towards(path[0], path[1]) if len(path) > 1 else "down"
    if facing not in FACINGS:
        raise LevelError(f"{shape.level_id}: {actor_id} faces up, down, left or right")
    sight = spec.get("sight", DEFAULT_SIGHT)
    if not isinstance(sight, int) or isinstance(sight, bool) or sight < 1:
        raise LevelError(f"{shape.level_id}: {actor_id}'s sight must be a whole number, 1 or more")
    patrol = tuple(path) if len(path) > 1 else ()
    asleep = spec.get("asleep")
    if asleep is not None and not isinstance(asleep, str):
        raise LevelError(f"{shape.level_id}: {actor_id} is asleep in a bed, named by its id")
    if asleep is not None and patrol:
        raise LevelError(f"{shape.level_id}: {actor_id} is asleep, and walks no patrol")
    return ActorSpec(kind, actor_id, position, facing, patrol, sight, asleep)


def _beside(one: Position, other: Position) -> bool:
    return abs(one.x - other.x) + abs(one.y - other.y) == 1


def _sleepers(
    level_id: str, things: tuple[ThingSpec, ...], actors: tuple[ActorSpec, ...]
) -> tuple[tuple[ThingSpec, ...], tuple[ActorSpec, ...]]:
    """The things with every bed someone lies asleep in taken, and the actors with
    each sleeper on its bed's tile (D91): a sleeper's bed is a bed of the level,
    beside where the sleeper is placed or with its pillow_side there (D130), and has
    one sleeper."""
    beds = {thing.id: thing for thing in things if thing.kind == "bed"}
    taken: dict[str, str] = {}
    for actor in actors:
        if actor.asleep is None:
            continue
        bed = beds.get(actor.asleep)
        if bed is None:
            raise LevelError(f"{level_id}: {actor.id} is asleep in {actor.asleep}, no bed")
        if not _beside(actor.position, bed.position) and actor.position != bed.pillow_side:
            raise LevelError(f"{level_id}: {actor.id} stands beside no {actor.asleep}")
        if actor.asleep in taken:
            raise LevelError(
                f"{level_id}: {taken[actor.asleep]} and {actor.id} are asleep in {actor.asleep}"
            )
        taken[actor.asleep] = actor.id
    things = tuple(replace(thing, free=False) if thing.id in taken else thing for thing in things)
    actors = tuple(
        replace(actor, position=beds[actor.asleep].position) if actor.asleep else actor
        for actor in actors
    )
    return things, actors


def _forbidden(
    value: Any, level_id: str, walls: set[Position], height: int, width: int
) -> tuple[frozenset[Position], str]:
    """The tiles the wizard may not step on, and the reason it is told (D84):
    `{"reason": "not_my_dormitory", "cells": [[x, y], ...]}`, each a floor tile."""
    if value is None:
        return frozenset(), ""
    reason = value.get("reason") if isinstance(value, dict) else None
    cells = value.get("cells") if isinstance(value, dict) else None
    if not isinstance(reason, str) or not reason.isidentifier() or not isinstance(cells, list):
        raise LevelError(f"{level_id}: forbidden is a reason and its cells")
    found = set()
    for cell in cells:
        if not (
            isinstance(cell, list)
            and len(cell) == 2
            and all(isinstance(v, int) and not isinstance(v, bool) for v in cell)
        ):
            raise LevelError(f"{level_id}: a forbidden cell is [x, y]")
        here = Position(*cell)
        if not (0 <= here.x < width and 0 <= here.y < height) or here in walls:
            raise LevelError(f"{level_id}: the forbidden cell {here.x},{here.y} is not floor")
        found.add(here)
    return frozenset(found), reason


def _list_of_boxes(value: Any, level_id: str) -> list[tuple[int, int, int, int]]:
    if not isinstance(value, list) or not all(
        isinstance(box, list) and len(box) == 4 and all(isinstance(v, int) for v in box)
        for box in value
    ):
        raise LevelError(f"{level_id}: dark_area is a list of [x0, y0, x1, y1]")
    return [tuple(box) for box in value]


def _ways(data: dict[str, Any]) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """Each way of a level, with level.json as that way plays it: its things and actors
    merged by id, field by field, and its carrying, spells and dark in place of the
    level's (D51)."""
    level_id = data["id"]
    ways = data["ways"]
    if not isinstance(ways, list) or len(ways) < 2 or not all(isinstance(w, dict) for w in ways):
        raise LevelError(f"{level_id}: ways is a list of two ways or more")
    base = {key: value for key, value in data.items() if key != "ways"}
    seen: set[str] = set()
    found = []
    for way in ways:
        way_id = way.get("id")
        if not isinstance(way_id, str) or not way_id.isidentifier() or way_id in seen:
            raise LevelError(f"{level_id}: every way needs an id of its own, a Python name")
        seen.add(way_id)
        for key in way:
            if key not in WAY_FIELDS:
                raise LevelError(f"{level_id}: the way {way_id} cannot change {key}")
        merged = dict(base)
        for key in ("things", "actors"):
            if key in way:
                merged[key] = _merged_by_id(level_id, way_id, key, base.get(key, []), way[key])
        for key in ("carrying", "spells", "dark"):
            if key in way:
                merged[key] = way[key]
        found.append((way, merged))
    return found


def _merged_by_id(
    level_id: str, way_id: str, key: str, base: list[Any], changes: Any
) -> list[dict[str, Any]]:
    if not isinstance(changes, list) or not all(isinstance(c, dict) for c in changes):
        raise LevelError(f"{level_id}: the way {way_id}'s {key} must be a list of objects")
    by_id = {item.get("id"): dict(item) for item in base if isinstance(item, dict)}
    for change in changes:
        item_id = change.get("id")
        if item_id not in by_id:
            raise LevelError(f"{level_id}: the way {way_id} changes {item_id}, not in {key}")
        by_id[item_id].update(change)
    return [by_id[item.get("id")] for item in base]


def _carrying(data: dict[str, Any], level_id: str, start: Position) -> tuple[ThingSpec, ...]:
    """The things the wizard holds from the start (D49): one of each kind named, its id
    the kind's name, with no tile of its own. An entry is the kind, or an object
    with the kind and the painted thing the page draws it from when it leaves the
    wizard's hands (`{"kind": "book", "art": "old_book"}`, D123)."""
    entries = data.get("carrying", [])
    if not isinstance(entries, list):
        raise LevelError(f"{level_id}: carrying lists kinds of thing the wizard can carry")
    kinds = [_carried_kind(entry) for entry in entries]
    if not all(kind in CARRIED_KINDS for kind in kinds):
        raise LevelError(f"{level_id}: carrying lists kinds of thing the wizard can carry")
    if len(set(kinds)) != len(kinds):
        raise LevelError(f"{level_id}: carrying names a kind twice")
    return tuple(ThingSpec(kind, kind, start, carried=True) for kind in kinds)


def _high(data: dict[str, Any], shelves: frozenset[Position]) -> frozenset[Position]:
    """The shelves a thing lies up on (D129): on a scene, those whose terrain is of
    HIGH_KINDS (on_scene gives the scene's letters, `terrain`, and their kinds,
    `terrains`); on a level's own map, every shelf."""
    rows, kinds = data.get("terrain"), data.get("terrains")
    if not isinstance(rows, list) or not isinstance(kinds, dict):
        return shelves
    return frozenset(cell for cell in shelves if kinds.get(rows[cell.y][cell.x]) in HIGH_KINDS)


def _carried_kind(entry: Any) -> Any:
    """The kind of an entry of `carrying`: the entry itself, or an object's `kind`
    beside its `art`, a string, and nothing else."""
    if isinstance(entry, dict):
        if set(entry) - {"kind", "art"} or not isinstance(entry.get("art", ""), str):
            return None
        return entry.get("kind")
    return entry


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


#: What a scene's letters are when it gives no table of its own (D65): wall,
#: floor and shelf, as in a level's map.
DEFAULT_TERRAINS = {
    WALL: {"kind": "wall", "walk": False, "sight": False},
    FLOOR: {"kind": "floor", "walk": True, "sight": True},
    SHELF: {"kind": "shelf", "walk": False, "sight": True},
}


@dataclass(frozen=True)
class Scene:
    """A scene a chapter's levels are parts of (D65, D73): its rows of letters,
    what each letter is, its fixed things, the props drawn on it and its rooms."""

    id: str
    rows: tuple[str, ...]
    terrains: dict[str, dict[str, Any]]
    things: tuple[dict[str, Any], ...] = ()
    props: tuple[dict[str, Any], ...] = ()
    rooms: dict[str, tuple[int, int, int, int]] = field(default_factory=dict)
    #: The tiles the wizard may not step on, with the reason (D84), or None.
    forbidden: dict[str, Any] | None = None

    def walks(self, x: int, y: int) -> bool:
        return bool(self.terrains[self.rows[y][x]]["walk"])


def read_scene(scenes: Path, scene_id: Any, level_id: Any = None) -> Scene:
    """The scene `scenes/<id>/`: map.txt, and scene.json when it has one (D73)."""
    if not isinstance(scene_id, str) or not scene_id:
        raise LevelError(f"{level_id}: scene is the id of a scene")
    folder = scenes / scene_id
    path = folder / "map.txt"
    if not path.is_file():
        raise LevelError(f"{level_id}: there is no scene {scene_id}")
    rows = tuple(row for row in path.read_text(encoding="utf-8").splitlines() if row)
    if not rows or any(len(row) != len(rows[0]) for row in rows):
        raise LevelError(f"{scene_id}: a scene's rows must all be as long as the first")
    about = (
        json.loads((folder / "scene.json").read_text(encoding="utf-8"))
        if (folder / "scene.json").is_file()
        else {}
    )
    terrains = dict(DEFAULT_TERRAINS)
    for letter, terrain in about.get("terrains", {}).items():
        if len(letter) != 1 or letter in (START, "E") or not isinstance(terrain, dict):
            raise LevelError(f"{scene_id}: a terrain is one letter, not S or E, with its kind")
        if not isinstance(terrain.get("kind"), str):
            raise LevelError(f"{scene_id}: the terrain {letter} needs its kind")
        terrains[letter] = {
            "kind": terrain["kind"],
            "walk": bool(terrain.get("walk", False)),
            "sight": bool(terrain.get("sight", terrain.get("walk", False))),
        }
    unknown = sorted({char for row in rows for char in row} - set(terrains))
    if unknown:
        raise LevelError(f"{scene_id}: the letters {''.join(unknown)} are no terrain of the scene")
    rooms = {}
    for room_id, box in about.get("rooms", {}).items():
        if not (isinstance(box, list) and len(box) == 4 and all(isinstance(v, int) for v in box)):
            raise LevelError(f"{scene_id}: the room {room_id} is [x0, y0, x1, y1]")
        rooms[room_id] = tuple(box)
    things = tuple(about.get("things", []))
    ids = [thing.get("id") for thing in things]
    if len(set(ids)) != len(ids) or not all(isinstance(i, str) for i in ids):
        raise LevelError(f"{scene_id}: each fixed thing has an id of its own")
    forbidden = about.get("forbidden")
    if forbidden is not None and not isinstance(forbidden, dict):
        raise LevelError(f"{scene_id}: forbidden is a reason and its cells")
    return Scene(scene_id, rows, terrains, things, tuple(about.get("props", [])), rooms, forbidden)


def scene_rows(scenes: Path, data: dict[str, Any]) -> list[str]:
    """The rows of the scene a level names (D65)."""
    return list(read_scene(scenes, data.get("scene"), data.get("id")).rows)


def _merged_things(scene: Scene, data: dict[str, Any]) -> list[dict[str, Any]]:
    """The scene's fixed things, each in the state the level gives it, then the
    level's own things (D73). A level's thing with no kind is a state of a fixed
    thing; a door the level opens is no longer locked, sealed or keyed by a word."""
    level_id = data.get("id")
    fixed = {thing["id"]: dict(thing) for thing in scene.things}
    own = []
    for thing in data.get("things", []):
        if not isinstance(thing, dict):
            raise LevelError(f"{level_id}: things must be a list of objects")
        if thing.get("id") in fixed:
            state = fixed[thing["id"]]
            state.update({k: v for k, v in thing.items() if k != "id"})
            if state.get("open") is True:
                for lock in ("locked", "sealed", "password"):
                    state.pop(lock, None)
        elif "kind" not in thing:
            raise LevelError(
                f"{level_id}: {thing.get('id')} has no kind, and is no fixed thing of the scene"
            )
        else:
            own.append(thing)
    return [*fixed.values(), *own]


def on_scene(data: dict[str, Any], scene: Scene | list[str]) -> dict[str, Any]:
    """level.json made whole on its scene (D65, D73): the map the world reads, its
    letters walls, floor and shelves by what each terrain lets through, with the
    wizard's `S` at `start` and the `E` of the reach goal at `end`; the scene's
    letters and kinds and props, for the page to draw; the fixed things merged
    with the level's; and the rooms named in `dark` as the dark area."""
    level_id = data.get("id")
    if "map" in data:
        raise LevelError(f"{level_id}: a level has a map or a scene, not both")
    if not isinstance(scene, Scene):
        scene = Scene(str(data.get("scene")), tuple(scene), dict(DEFAULT_TERRAINS))
    grid = []
    for row in scene.rows:
        line = []
        for char in row:
            terrain = scene.terrains[char]
            line.append(FLOOR if terrain["walk"] else SHELF if terrain["sight"] else WALL)
        grid.append(line)
    for key, letter in (("start", START), ("end", "E")):
        if key not in data:
            if key == "start":
                raise LevelError(f"{level_id}: a level on a scene needs its start")
            continue
        value = data[key]
        if not (
            isinstance(value, list)
            and len(value) == 2
            and all(isinstance(v, int) and not isinstance(v, bool) for v in value)
        ):
            raise LevelError(f"{level_id}: {key} must be [x, y]")
        x, y = value
        if not (0 <= y < len(grid) and 0 <= x < len(grid[0])) or grid[y][x] != FLOOR:
            raise LevelError(f"{level_id}: its {key} {x},{y} is not floor on the scene")
        grid[y][x] = letter
    built = {key: value for key, value in data.items() if key not in ("scene", "start", "end")}
    built["map"] = ["".join(row) for row in grid]
    built["terrain"] = list(scene.rows)
    built["terrains"] = {letter: terrain["kind"] for letter, terrain in scene.terrains.items()}
    if scene.props:
        built["props"] = list(scene.props)
    if scene.things or data.get("things"):
        built["things"] = _merged_things(scene, data)
    if scene.things:
        built["fixed"] = [thing["id"] for thing in scene.things]
    if scene.forbidden is not None:
        built["forbidden"] = scene.forbidden
    dark = data.get("dark")
    if isinstance(dark, list):
        missing = [room for room in dark if room not in scene.rooms]
        if missing:
            raise LevelError(f"{level_id}: no room {', '.join(map(str, missing))} in the scene")
        built["dark"] = bool(dark)
        built["dark_area"] = [list(scene.rooms[room]) for room in dark]
    return built


STORY_DOINGS = ("walk", "face", "appear", "vanish", "sleep", "wake", "open", "close")
#: The lights a story may be told under, besides its scene's own (D124).
STORY_LIGHTS = ("morning",)


def _story_actions(doing: Any, here: str) -> list[dict[str, Any]]:
    """A step's actions (D103): none, one, or a list, each one of STORY_DOINGS with
    the figure who does it in `by` when it is not the step's; a walk may end in
    `vanish`, and an appearing may come `from` a cell beside (D128)."""
    if doing is None:
        return []
    listed = doing if isinstance(doing, list) else [doing]
    if not listed:
        raise LevelError(f"{here}: do is one of {', '.join(STORY_DOINGS)}")
    for action in listed:
        kinds = set(action) - {"by"} if isinstance(action, dict) else set()
        if "walk" in kinds and kinds <= {"walk", "vanish"} and action.get("vanish", True) is True:
            continue
        # An appearing from behind a thing beside the cell (D128).
        if kinds == {"appear", "from"}:
            continue
        if len(kinds) != 1 or not kinds <= set(STORY_DOINGS):
            raise LevelError(f"{here}: do is one of {', '.join(STORY_DOINGS)}")
    return listed


def _waypoints(walk: Any, here: str) -> list[Position]:
    """A walk's tiles: one tile, or a list of them, each reached in a straight line."""
    if isinstance(walk, list) and walk and all(isinstance(tile, list) for tile in walk):
        return [_story_tile(tile, "walk", here) for tile in walk]
    return [_story_tile(walk, "walk", here)]


def _story_tile(value: Any, what: str, story_id: Any) -> Position:
    if not (
        isinstance(value, list)
        and len(value) == 2
        and all(isinstance(v, int) and not isinstance(v, bool) for v in value)
    ):
        raise LevelError(f"{story_id}: {what} must be [x, y]")
    return Position(*value)


def story_on_scene(data: dict[str, Any], scene: Scene) -> dict[str, Any]:
    """A story's staging checked against its scene and made whole (D74): the
    world the page draws, as a level on the scene is built, under `world`.

    The staging puts the wizard at `wizard`, the camera on `camera`, the light
    over the scene on `light` (`morning`, D124), and each actor at its `at`; an
    actor with no `at` is out of sight until a step makes it appear; the story's
    `things` place the scene's things or add a door.
    Each step is said by `voice`, `wizard` or an actor, after its actions
    (`do`, one or a list, D103), each done by its `by`, the step's `by`, or its
    speaker: a walk to a tile or through a list of them, each in a straight
    line, every tile on the way walked on and free (no one standing there, no
    door shut), and ending out of sight when it says `vanish`; a turn to face
    a way; appearing on a free tile, maybe stepping out `from` behind a thing
    on a cell beside it, a shelf or a floor (D128); vanishing, a speaker once
    its words are said; lying down asleep in a bed, no one else's, from the cell
    under its pillow (`pillow_side`, D130), or from beside a bed with none, and
    waking (D91); opening or closing a door beside it. One figure's actions follow
    one another; different figures' are played at once, tick by tick, in the
    order they are first named, and are checked so. An actor may start
    `asleep` in a bed, its `at` the bed's pillow_side, where it gets up. No one
    walks onto an open door's leaf, and whoever stands on it as the door opens
    steps aside along the row (D125). The voice does nothing itself; no one
    speaks or moves out of sight, and no one asleep walks, turns or goes."""
    story_id = data.get("id")
    if "scene" not in data:
        raise LevelError(f"{story_id}: a story is told on a scene")
    wizard = _story_tile(data.get("wizard"), "wizard", story_id)
    actors = data.get("actors", [])
    if not isinstance(actors, list) or not all(isinstance(a, dict) for a in actors):
        raise LevelError(f"{story_id}: actors must be a list of objects")
    built = on_scene(
        {
            "id": story_id,
            "scene": data["scene"],
            "start": list(wizard),
            **({"things": data["things"]} if "things" in data else {}),
        },
        scene,
    )
    grid = built["map"]
    height, width = len(grid), len(grid[0])
    shut = {
        Position(*thing["at"])
        for thing in built.get("things", [])
        if thing.get("kind") == "door" and thing.get("open") is not True and "at" in thing
    }
    camera = _story_tile(data.get("camera", list(wizard)), "camera", story_id)
    # A morning story on a scene painted at night opens under the morning's light (D124).
    if data.get("light", "morning") not in STORY_LIGHTS:
        raise LevelError(f"{story_id}: a story's light is one of {', '.join(STORY_LIGHTS)}")
    if not (0 <= camera.x < width and 0 <= camera.y < height):
        raise LevelError(f"{story_id}: the camera's tile {camera.x},{camera.y} is off the scene")

    def walked(tile: Position) -> bool:
        return (
            0 <= tile.y < height
            and 0 <= tile.x < width
            and grid[tile.y][tile.x] != WALL
            and (grid[tile.y][tile.x] != SHELF)
        )

    # Where each figure stands, or None while out of sight.
    where: dict[str, Position | None] = {"wizard": wizard}
    for actor in actors:
        actor_id = _identifier(story_id, actor.get("id"), "an actor's id")
        if actor_id in where:
            raise LevelError(f"{story_id}: two figures are called {actor_id}")
        if actor.get("kind") not in ACTOR_KINDS:
            raise LevelError(f"{story_id}: {actor_id} is of no kind of actor")
        where[actor_id] = (
            _story_tile(actor["at"], f"{actor_id}'s at", story_id) if "at" in actor else None
        )
        if where[actor_id] is not None and not walked(where[actor_id]):
            raise LevelError(f"{story_id}: {actor_id} stands on no floor")

    # The cells each door's open leaf lies on (D125), and the doors open now; no
    # one walks onto an open door's leaf.
    leaves = {
        thing["id"]: [Position(*cell) for cell in thing.get("covers", {}).get("open", [])]
        for thing in built.get("things", [])
        if thing.get("kind") == "door" and "at" in thing
    }
    opened: set[str] = set()

    def under_leaf(tile: Position) -> bool:
        return any(tile in leaves[door] for door in opened)

    def free(tile: Position, mover: str) -> bool:
        taken = any(at == tile for who, at in where.items() if who != mover)
        return walked(tile) and tile not in shut and not under_leaf(tile) and not taken

    beds = {
        thing["id"]: Position(*thing["at"])
        for thing in built.get("things", [])
        if thing.get("kind") == "bed" and "at" in thing
    }
    # The cell under each bed's pillow, which a figure goes to bed from (D130).
    pillow_sides = {
        thing["id"]: Position(*thing["pillow_side"])
        for thing in built.get("things", [])
        if thing.get("kind") == "bed" and "pillow_side" in thing
    }
    # The bed each figure lies asleep in.
    asleep: dict[str, str] = {}

    def lie_down(who: str, bed: Any, here: str) -> None:
        if bed not in beds:
            raise LevelError(f"{here}: {who} is asleep in {bed}, no bed of the scene")
        at = where[who]
        side = pillow_sides.get(bed)
        if side is not None and at != side:
            raise LevelError(
                f"{here}: {who} goes to bed in {bed} from the cell under its pillow,"
                f" {side.x},{side.y}"
            )
        if side is None and (at is None or abs(at.x - beds[bed].x) + abs(at.y - beds[bed].y) != 1):
            raise LevelError(f"{here}: {who} stands beside no {bed}")
        if bed in asleep.values():
            raise LevelError(f"{here}: someone is asleep in {bed} already")
        asleep[who] = bed

    for actor in actors:
        if "asleep" in actor:
            lie_down(actor["id"], actor["asleep"], str(story_id))

    doors = {
        thing["id"]: Position(*thing["at"])
        for thing in built.get("things", [])
        if thing.get("kind") == "door" and "at" in thing
    }
    opened.update(name for name, at in doors.items() if at not in shut)

    def shove(door: str, queues: dict[str, list[tuple[str, Any]]], here: str) -> None:
        """Whoever stands on the door's leaf as it opens steps to the nearest free
        tile of the row, away from the door, as the world moves them (D125)."""
        for who, at in list(where.items()):
            if at is None or at not in leaves[door]:
                continue
            if queues.get(who):
                raise LevelError(f"{here}: {who} is in the way of {door}'s leaf, mid-way")
            way = -1 if at.x < doors[door].x else 1
            to = None
            for along in (way, -way):
                tile = Position(at.x + along, at.y)
                while to is None and walked(tile) and tile not in shut:
                    if free(tile, who):
                        to = tile
                    tile = Position(tile.x + along, tile.y)
                if to is not None:
                    break
            if to is None:
                raise LevelError(f"{here}: {who} has nowhere to step from {door}'s leaf")
            where[who] = to

    def beside(who: str, tile: Position) -> bool:
        at = where[who]
        return at is not None and abs(at.x - tile.x) + abs(at.y - tile.y) == 1

    first_seen: dict[str, Position] = {}
    steps = data.get("steps")
    if not isinstance(steps, list) or not steps:
        raise LevelError(f"{story_id}: a story has its steps")
    for number, step in enumerate(steps, 1):
        here = f"{story_id}, step {number}"
        if not isinstance(step, dict):
            raise LevelError(f"{here}: a step is an object")
        who, doing = step.get("who"), step.get("do")
        if who != "voice" and who not in where:
            raise LevelError(f"{here}: {who} is no one in the story")
        if "by" in step and doing is None:
            raise LevelError(f"{here}: by names who does the action, and there is none")
        actions = _story_actions(doing, here)
        # Each figure's part of the step, its actions one after another as single
        # events (a walk is a move a tile), with where each leaves it; the figures
        # play at once, tick by tick, as the page plays them (D103).
        queues: dict[str, list[tuple[str, Any]]] = {}
        planned = dict(where)
        vanishing = False
        for action in actions:
            # Who does an action: its by, the step's by, or the step's speaker.
            doer = action.get("by", step.get("by", who))
            if doer not in where:
                raise LevelError(f"{here}: the action is done by no one in the story; give its by")
            # A speaker who goes says the step's words first, then goes.
            if set(action) - {"by"} == {"vanish"} and doer == who and who != "voice":
                if doer == "wizard":
                    raise LevelError(f"{here}: the wizard stays in the story")
                vanishing = True
                continue
            queue = queues.setdefault(doer, [])
            if "appear" in action:
                tile = _story_tile(action["appear"], "appear", here)
                if planned[doer] is not None:
                    raise LevelError(f"{here}: {doer} is already in sight")
                if "from" in action:
                    behind = _story_tile(action["from"], "from", here)
                    inside = 0 <= behind.y < height and 0 <= behind.x < width
                    if abs(behind.x - tile.x) + abs(behind.y - tile.y) != 1 or not inside:
                        raise LevelError(
                            f"{here}: {doer} comes from a cell beside {tile.x},{tile.y}"
                        )
                    if grid[behind.y][behind.x] == WALL:
                        raise LevelError(f"{here}: {doer} comes out of a wall")
                planned[doer] = tile
                queue.append(("appear", tile))
                continue
            if planned[doer] is None:
                raise LevelError(f"{here}: {doer} is out of sight")
            if "walk" in action:
                at = planned[doer]
                for to in _waypoints(action["walk"], here):
                    if (to.x != at.x) == (to.y != at.y):
                        raise LevelError(
                            f"{here}: {doer} walks in a straight line, to another tile"
                        )
                    dx, dy = (to.x > at.x) - (to.x < at.x), (to.y > at.y) - (to.y < at.y)
                    while at != to:
                        at = Position(at.x + dx, at.y + dy)
                        queue.append(("move", at))
                planned[doer] = at
                if action.get("vanish") is True:
                    if doer == "wizard":
                        raise LevelError(f"{here}: the wizard stays in the story")
                    planned[doer] = None
                    queue.append(("vanish", None))
            elif "vanish" in action:
                if doer == "wizard":
                    raise LevelError(f"{here}: the wizard stays in the story")
                planned[doer] = None
                queue.append(("vanish", None))
            elif "face" in action:
                if action["face"] not in FACINGS:
                    raise LevelError(f"{here}: face is one of {', '.join(FACINGS)}")
                queue.append(("face", action["face"]))
            elif "open" in action or "close" in action:
                kind = "open" if "open" in action else "close"
                if action[kind] not in doors:
                    raise LevelError(f"{here}: no door {action[kind]} in the story")
                queue.append((kind, action[kind]))
            else:
                kind = "sleep" if "sleep" in action else "wake"
                queue.append((kind, action.get("sleep")))
        while any(queues.values()):
            for doer, queue in queues.items():
                if not queue:
                    continue
                kind, value = queue.pop(0)
                if kind == "appear":
                    if not free(value, doer):
                        raise LevelError(f"{here}: {doer} appears on a tile not free")
                    where[doer] = value
                    first_seen.setdefault(doer, value)
                elif kind == "wake":
                    if doer not in asleep:
                        raise LevelError(f"{here}: {doer} is not asleep")
                    del asleep[doer]
                elif doer in asleep:
                    raise LevelError(f"{here}: {doer} is asleep")
                elif kind == "sleep":
                    lie_down(doer, value, here)
                elif kind == "vanish":
                    where[doer] = None
                elif kind == "move":
                    if not free(value, doer):
                        raise LevelError(
                            f"{here}: {doer}'s walk is stopped at {value.x},{value.y}"
                        )
                    where[doer] = value
                elif kind in ("open", "close"):
                    if not beside(doer, doors[value]):
                        raise LevelError(f"{here}: {doer} stands beside no {value}")
                    if (value in opened) == (kind == "open"):
                        state = "open" if kind == "open" else "shut"
                        raise LevelError(f"{here}: {value} is {state} already")
                    if kind == "open":
                        opened.add(value)
                        shut.discard(doors[value])
                        shove(value, queues, here)
                    else:
                        if any(at == doors[value] for at in where.values()):
                            raise LevelError(f"{here}: someone stands in {value}'s doorway")
                        opened.discard(value)
                        shut.add(doors[value])
        if vanishing:
            where[who] = None
        if who != "voice" and where[who] is None and not vanishing:
            raise LevelError(f"{here}: {who} speaks out of sight")

    world_actors = []
    for actor in actors:
        actor_id = actor["id"]
        placed = dict(actor)
        if "at" not in actor:
            if actor_id not in first_seen:
                raise LevelError(f"{story_id}: {actor_id} never appears")
            placed["at"] = list(first_seen[actor_id])
            placed["hidden"] = True
        # In a story no one watches for the wizard.
        placed["sight"] = 0
        world_actors.append(placed)
    if world_actors:
        built["actors"] = world_actors
    del built["id"]
    staging = ("wizard", "actors", "things")
    story = {key: value for key, value in data.items() if key not in staging}
    story["camera"] = list(camera)
    story["world"] = built
    return story
