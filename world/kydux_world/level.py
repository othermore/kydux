"""A level: its map, what is on it, what it teaches, and what it asks of the wizard.

A level is read from its level.json. The map is rows of characters: `#` a
wall, `.` floor, `=` a shelf (no one walks on it, a thing may lie on it, and
sight passes over it, D46), `~` a low cell (water, a hedge, a bench: no one
walks on it, a flight crosses it and sight passes over it, D186), `,` a cell
only a familiar enters (a familiars' passage: the wizard bumps there, D270), `S`
where the wizard starts, and any other letter a floor tile that things, actors and goals
may name by that letter (a marker), like `D` for a door. A wall is high: a
flight bumps on it as a walk does. Positions are (x, y) from the top-left corner,
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
`tick_limit`; `race`, a race against a racer scored by Ilda's count (D189);
`dark`, a room unlit until `kirra` (D52), which the level lists among its
spells when a `collect` or an `open` goal lies in the dark (D162); `forbidden`, the
tiles the wizard may not step on and why, which its scene gives (D84) and the level
may add to, each with its reason (D205);
`enchanted`, the boxes of cells that hide every figure in them, which its scene
gives too and only the page reads (D135); `camera`, a box of cells the page
shows whole at the level's start (D201), which holds the start, every marker and
every thing; `familiar`, the familiar the level describes, calls or plays with
(D260), with `told`, what is said at the end of a run won (D264), and `fault`, the
explanation a fix level's given program stops with (D272); and `ways`, the ways the
level is played, each one the same program must win (D51). A level may
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
    """A cell's two numbers, its attributes `x` and `y`: `key.position.x` (D153)."""

    x: int
    y: int

    def __repr__(self) -> str:
        """As the child reads it: `print(wizard.position)` shows `(15, 3)`."""
        return f"({self.x}, {self.y})"


Position.x.__doc__ = "The cell's first number, its column from the left: `wizard.position.x`"
Position.y.__doc__ = "The cell's second number, its row from the top: `wizard.position.y`"


class LevelError(ValueError):
    """A level definition that cannot be played."""


WALL, FLOOR, SHELF, LOW, SMALL, START = "#", ".", "=", "~", ",", "S"

#: The kinds of thing a level may hold, and the ones the wizard can carry.
THING_KINDS = (
    "key",
    "door",
    "book",
    "wand",
    "potion",
    "hole",
    "bed",
    "map",
    "broom",
    "ring",
    "thread",
    "trail",
    "plate",
)
#: The kinds that lie on cells of their own, one or two side by side (D150, D167).
CELLED_KINDS = ("door", "hole")
CARRIED_KINDS = ("key", "book", "wand", "potion", "map", "broom", "thread")
#: The kinds that lie in or on the floor, walked over and found by no one (D270): a
#: thread's end, a brass plate.
FLOOR_KINDS = ("trail", "plate")
#: The terrains a thing lies up on, out of the hands' reach (D129): a level map's
#: shelf, a scene's bookcase. A thing on another tile no one walks, a stone or a
#: pile of books, lies within reach of the tile beside it.
HIGH_KINDS = ("shelf", "bookcase")
ACTOR_KINDS = ("teacher", "ghost", "cat", "friend", "racer", "familiar")
#: A ring's way, the way it is flown through: `up`, from the row under it to the row
#: over it, or `down` (D219).
RING_WAYS = ("up", "down")
#: A pair of rings' colours (D219).
RING_COLOURS = ("red", "blue", "yellow", "purple")
#: The ticks a walked step takes in a level where the wizard can fly, its spells
#: holding drevo; a flown step takes one, and a step elsewhere one (D225).
WALK_TICKS_FLYING = 3
#: The ticks a walked step of the wizard's takes in a level whose familiar can walk, its
#: block of stage birth or living; a familiar's step takes one (D277).
WALK_TICKS_FAMILIAR = 2
#: The spells the world knows how to cast; a level names those it has (D42).
#: Each has its effect in kydux_world.world.SPELLS.
KNOWN_SPELLS = ("zelim", "fendra", "kirra", "osto", "orvim", "drevo", "minka")
#: The explanations a fix level's given program may stop with, its `fault` (D272).
FAULTS = ("missing_self", "no_attribute", "object_arguments", "no_such_method")
#: A level's familiar block's stages (D260): a level where the description is tried, the
#: level where it leaves the circle, a level played with the familiar there.
FAMILIAR_STAGES = ("trial", "birth", "living")
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
    #: For a hole, the ticks it is closed and then open, in turn (D53, D167).
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
    #: For a door, the cells of its doorway, one or two side by side, its position the
    #: first; shut, it blocks them all (D150). For a hole, the cells it opens on, one or
    #: two side by side, open and closed together (D167).
    cells: tuple[Position, ...] = ()
    #: For a broom, whether the black thread is knotted in its twigs (D183).
    knotted: bool = False
    #: For a broom, whether it hangs on a peg of the rack, its cell the rack's under
    #: the peg; it is untied from the cell under it (D195).
    hung: bool = False
    #: The level's zone it is found from, or None for a thing found from anywhere (D196).
    zone: str | None = None
    #: For a ring, the way it is flown through, `up` or `down`, and its pair's colour
    #: (D219).
    way: str | None = None
    colour: str | None = None


@dataclass(frozen=True)
class ActorSpec:
    kind: str
    id: str
    position: Position
    facing: str
    #: The tiles the actor walks, one per tick, back and forth, its position among them.
    patrol: tuple[Position, ...] = ()
    sight: int = DEFAULT_SIGHT
    #: The bed the actor lies asleep in (D91), or None. A sleeper is placed beside
    #: its bed, where it gets up, and lies on the bed's tile, standing in no one's way.
    asleep: str | None = None
    #: Where on its patrol the actor starts, and which way along it it walks (D137).
    patrol_start: int = 0
    patrol_along: int = 1
    #: For a familiar of someone else's (D273): its kind, or a list of kinds of which
    #: the first that is not the child's; its colour, or one for each of those kinds;
    #: whether it is a trial in the circle, or a spark; and `of`, `mate` for the
    #: room-mate's copy of the child's, drawn from the child's description.
    creature: str | tuple[str, ...] | None = None
    color: str | tuple[str, ...] | None = None
    trial: bool = False
    spark: bool = False
    of: str | None = None
    #: A spark that the page shows as the room-mate's tries, coming and going (D300).
    tries: bool = False
    #: The loop of cells the friend orders her familiar round, its last its own (D300).
    drill: tuple[Position, ...] = ()
    #: Seated on the floor, drawn in its sitting rows (D273).
    sitting: bool = False


@dataclass(frozen=True)
class Described:
    """A familiar as it is described: its kind, and its name and colour when given."""

    kind: str
    name: str | None = None
    color: str | None = None


@dataclass(frozen=True)
class Living:
    """The game's familiar that lives (D265, D269): its kind, name and colour, the class
    kept when it was born (`source`) and with what it learned after (`learned`), where it
    stands at the level's start and the way it faces."""

    kind: str
    name: str
    color: str
    source: str
    at: Position
    facing: str = "down"
    learned: str | None = None


@dataclass(frozen=True)
class Order:
    """One of Orla's orders after the program (D267): the cell she sends the familiar to,
    and her words' key."""

    to: Position
    key: str


@dataclass(frozen=True)
class FamiliarBlock:
    """A level's `familiar` block (D260): its stage, the circle and the cells its trials
    stand on, the methods a class may define, whether the book tries the trial's line, what
    follows a won run, the level's own draft and living familiar, which of the living
    one's classes plays, and Orla's orders with the plate they follow."""

    stage: str
    circle: tuple[int, int, int, int] | None = None
    trials: tuple[Position, ...] = ()
    methods: tuple[str, ...] = ()
    book: bool = False
    #: The actor of a familiar that steps out of the circle and lives after a won run,
    #: and the cell it steps to (D268).
    then: tuple[str, Position] | None = None
    #: The cells that familiar walks after its step out, a cell a tick, its way's corners
    #: walked out (D302).
    then_way: tuple[Position, ...] = ()
    draft: Described | None = None
    living: Living | None = None
    #: `source` or `learned`: the living familiar's class kept at its birth, or the one
    #: with what it learned after (`learned`, or the source where it learned nothing).
    source: str = "source"
    orders: tuple[Order, ...] = ()
    orders_on: str | None = None
    #: How many familiars a program may make in a level of trials or of the birth (D297):
    #: 1, or 2 where the child makes one for the room-mate too.
    most: int = 1

    def in_circle(self, position: Position) -> bool:
        if self.circle is None:
            return False
        x0, y0, x1, y1 = self.circle
        return x0 <= position.x <= x1 and y0 <= position.y <= y1

    def kept_class(self) -> str | None:
        """The living familiar's class as this level plays it."""
        if self.living is None:
            return None
        if self.source == "learned" and self.living.learned:
            return self.living.learned
        return self.living.source


@dataclass(frozen=True)
class Race:
    """A race against a racer, scored by Ilda's count (D189), each racer in a lane of
    their own (D220): once Ilda has read the racer's `lines`, a tick a line, its flight
    starts, as the wizard's does with drevo, with a tick for the lift, then its `path`,
    a cell a tick, through its `rings`; it crosses the finish line at its path's last
    cell, on the finish's column. The wizard takes off at the tick of the program's own
    lines and crosses at its own `finish`; each ring it has missed by then adds five
    ticks to its count (D234)."""

    against: str
    lines: int
    #: The cells the racer flies into, one a tick, after its lift.
    path: tuple[Position, ...]
    #: The wizard's finish, on the finish line.
    finish: Position
    #: The racer's own rings, in the order he flies them (D220).
    rings: tuple[str, ...] = ()

    @property
    def tick(self) -> int:
        """The tick the racer crosses the finish: its lines, its lift, its path."""
        return self.lines + 1 + len(self.path)


@dataclass(frozen=True)
class Level:
    id: str
    width: int = 1
    height: int = 1
    walls: frozenset[Position] = frozenset()
    shelves: frozenset[Position] = frozenset()
    #: The low cells, which a flight crosses and a walk does not (D186).
    low: frozenset[Position] = frozenset()
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
    #: Why each forbidden tile is, the reason the wizard says (D84): the scene's and the
    #: level's own (D205).
    forbidden_reasons: dict[Position, str] = field(default_factory=dict)
    #: The race the level is, or None (D189).
    race: Race | None = None
    #: On a scene, the kind of each cell's terrain no one walks on, `water`, `tree`,
    #: `wall`..., which the wizard thinks of when it cannot go there (D186).
    kinds: dict[Position, str] = field(default_factory=dict)
    #: The level's zones by name, each its cells: a thing of a zone is found only from
    #: within it (D196).
    zones: dict[str, frozenset[Position]] = field(default_factory=dict)
    #: The cells only a familiar enters, a familiars' passage (D270).
    small: frozenset[Position] = frozenset()
    #: The familiar the level describes, calls or plays with (D260), or None.
    familiar: FamiliarBlock | None = None
    #: What is said at the end of a run won, each by whom and its words' key (D264).
    told_won: tuple[tuple[str, str], ...] = ()
    #: Where someone painted into the scene speaks from, by id (D264).
    voices: dict[str, Position] = field(default_factory=dict)
    #: The explanation a fix level's given program stops with (D272), or None.
    fault: str | None = None
    #: The way the wizard faces at tick 0, one of FACINGS (D286).
    facing: str = "down"

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

        walls, shelves, low, small, starts, markers = set(), set(), set(), set(), [], {}
        for y, row in enumerate(rows):
            for x, char in enumerate(row):
                here = Position(x, y)
                if char == WALL:
                    walls.add(here)
                elif char == SHELF:
                    shelves.add(here)
                elif char == LOW:
                    low.add(here)
                elif char == SMALL:
                    small.add(here)
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
            level_id,
            width,
            len(rows),
            frozenset(walls),
            frozenset(shelves) | frozenset(low),
            markers,
            starts[0],
            frozenset(low),
            frozenset(small),
        )
        zones = _zones(data.get("zones", {}), level_id)
        things = tuple(_thing(shape, spec) for spec in _list(data, "things", level_id))
        _check_zones(level_id, things, zones)
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

        # What the wizard must find or open in the dark is not seen until kirra lights
        # it; a reach needs no sight (D162).
        if dark and "kirra" not in spells and _sought_in_the_dark(goals, things, area):
            raise LevelError(
                f"{level_id}: a dark level needs kirra among its spells "
                "when a collect or an open goal lies in the dark"
            )

        forbidden_reasons = _forbidden(data.get("forbidden"), level_id, walls, len(rows), width)
        forbidden = frozenset(forbidden_reasons)

        facing = data.get("facing", "down")
        if facing not in FACINGS:
            raise LevelError(f"{level_id}: facing is one of {', '.join(FACINGS)}")

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
            forbidden_reasons=forbidden_reasons,
            low=frozenset(low),
            race=_race(data.get("race"), shape, actors, things),
            kinds=_kinds(data),
            zones=zones,
            small=frozenset(small),
            voices=_voices(data.get("voices"), shape),
            fault=_fault(data.get("fault"), level_id, kind),
            facing=facing,
        )
        level = replace(
            level,
            familiar=_familiar(data.get("familiar"), shape, level),
            told_won=_told_won(data.get("told"), level),
        )
        check_api(level)
        _level_camera(data.get("camera"), level)
        _check_rings(level)
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
        level = cls.from_dict(data)
        # A flight's pace and a familiar's are each a level's own (D225, D277): the course
        # gives no level both, though the page gives a level every spell known (D80).
        if "drevo" in level.spells and level.familiar_can_walk:
            raise LevelError(f"{level.id}: a level has drevo or a familiar that walks, not both")
        return level

    def inside(self, position: Position) -> bool:
        return 0 <= position.x < self.width and 0 <= position.y < self.height

    def free(self, position: Position) -> bool:
        """Inside the map, and neither a wall, a shelf, a low cell nor a familiars' passage:
        a tile to walk on. Doors are the world's to say."""
        return (
            self.clear(position)
            and position not in self.shelves
            and position not in self.low
            and position not in self.small
        )

    def familiar_walks(self, position: Position) -> bool:
        """A tile a familiar walks on: the floor, or a familiars' passage (D270)."""
        return self.free(position) or position in self.small

    def flies(self, position: Position) -> bool:
        """A tile a flight crosses: one to walk on, or a low cell (D186)."""
        return self.free(position) or position in self.low

    @property
    def familiar_can_walk(self) -> bool:
        """Whether the level's familiar can walk: its block of stage birth or living
        (D277)."""
        return self.familiar is not None and self.familiar.stage in ("birth", "living")

    @property
    def walk_ticks(self) -> int:
        """The ticks a walked step of the wizard's takes: two where its familiar can walk,
        so that a familiar goes at twice a child's pace, and one in the levels of trials: a
        level with a familiar keeps its own pace, though the page gives it drevo among the
        spells known (D80, D277); three where the wizard can fly, its spells holding
        drevo, so that a flight is three times as fast (D225); one elsewhere."""
        if self.familiar is not None:
            return WALK_TICKS_FAMILIAR if self.familiar_can_walk else 1
        return WALK_TICKS_FLYING if "drevo" in self.spells else 1

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
    #: The cells no one walks on and sight passes: shelves, and low cells (D186).
    shelves: frozenset[Position]
    markers: dict[str, Position]
    start: Position
    low: frozenset[Position] = frozenset()
    #: The cells only a familiar enters (D270).
    small: frozenset[Position] = frozenset()

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
    # A hole's period is whole, or 0 for a hole that never closes on its own (D178).
    period = spec.get("period")
    whole = isinstance(period, int) and not isinstance(period, bool) and period >= 0
    if (kind == "hole") != (period is not None) or (period is not None and not whole):
        raise LevelError(f"{shape.level_id}: a hole, and only a hole, has a whole period")
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
    knotted = spec.get("knotted", False)
    if not isinstance(knotted, bool) or ("knotted" in spec and kind != "broom"):
        raise LevelError(f"{shape.level_id}: only a broom is knotted, true or false")
    hung = spec.get("hung", False)
    if not isinstance(hung, bool) or ("hung" in spec and kind != "broom"):
        raise LevelError(f"{shape.level_id}: only a broom hangs, true or false")
    zone = spec.get("zone")
    if zone is not None and not (isinstance(zone, str) and zone):
        raise LevelError(f"{shape.level_id}: {thing_id}'s zone is a zone's name")
    way, colour = spec.get("way"), spec.get("colour")
    if kind == "ring" and (way not in RING_WAYS or colour not in RING_COLOURS):
        raise LevelError(
            f"{shape.level_id}: the ring {thing_id} is flown {' or '.join(RING_WAYS)}, "
            f"and is {', '.join(RING_COLOURS)}"
        )
    if kind != "ring" and ("way" in spec or "colour" in spec):
        raise LevelError(f"{shape.level_id}: only a ring has a way and a colour")
    covers = _covers(shape, spec, thing_id)
    pillow_side = _pillow_side(shape, spec, thing_id)
    position = shape.place(spec, thing_id)
    return ThingSpec(
        kind,
        thing_id,
        position,
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
        cells=_cells(shape, spec, thing_id, position),
        knotted=knotted,
        hung=hung,
        zone=zone,
        way=way,
        colour=colour,
    )


def _zones(value: Any, level_id: str) -> dict[str, frozenset[Position]]:
    """A level's zones (D196): `{"<name>": [[x0, y0, x1, y1], ...]}`, each a list of
    boxes of cells."""
    if not isinstance(value, dict):
        raise LevelError(f"{level_id}: zones are named, each a list of [x0, y0, x1, y1]")
    zones = {}
    for name, boxes in value.items():
        cells = set()
        for x0, y0, x1, y1 in _list_of_boxes(boxes, level_id, "a zone"):
            cells.update(Position(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1))
        if not cells:
            raise LevelError(f"{level_id}: the zone {name} has no cell")
        zones[name] = frozenset(cells)
    return zones


def _check_zones(
    level_id: str, things: tuple[ThingSpec, ...], zones: dict[str, frozenset[Position]]
) -> None:
    """A thing's zone is one of the level's, and the thing is found from where it lies,
    or a hung broom from the cell under it (D195, D196)."""
    for thing in things:
        if thing.zone is None:
            continue
        if thing.zone not in zones:
            raise LevelError(f"{level_id}: {thing.id}'s zone {thing.zone} is not the level's")
        reached = under(thing.position) if thing.hung else thing.position
        if reached not in zones[thing.zone]:
            raise LevelError(f"{level_id}: {thing.id} lies outside its zone {thing.zone}")


def _step_camera(
    value: Any, here: str, width: int, height: int, whose: str = "a step's camera"
) -> None:
    """A story step's camera (D199): `{"fit": [[x0, y0], [x1, y1]]}`, a box of cells the
    page shows whole, or `{"wide": true}`, the scene's playable width; a level's
    (D201), only the box."""
    if value == {"wide": True} and whose == "a step's camera":
        return
    box = value.get("fit") if isinstance(value, dict) and set(value) == {"fit"} else None
    corners = (
        box
        if isinstance(box, list)
        and len(box) == 2
        and all(
            isinstance(c, list) and len(c) == 2 and all(isinstance(v, int) for v in c) for c in box
        )
        else None
    )
    if corners is None:
        wide = " or wide" if whose == "a step's camera" else ""
        raise LevelError(f'{here}: {whose} is {{"fit": [[x0, y0], [x1, y1]]}}{wide}')
    (x0, y0), (x1, y1) = corners
    if not (0 <= x0 <= x1 < width and 0 <= y0 <= y1 < height):
        raise LevelError(f"{here}: the camera's box is off the scene or turned round")


def _level_camera(value: Any, level: "Level") -> None:
    """A level's camera (D201): `{"fit": [[x0, y0], [x1, y1]]}`, a box of cells the
    page shows whole at the level's start, on the scene and holding the start, every
    marker and every thing, in the way being read."""
    if value is None:
        return
    _step_camera(value, level.id, level.width, level.height, "a level's camera")
    (x0, y0), (x1, y1) = value["fit"]
    held = [
        ("the start", level.start),
        *((f"the marker {letter}", at) for letter, at in sorted(level.markers.items())),
        *((thing.id, thing.position) for thing in level.things),
    ]
    for what, at in held:
        if not (x0 <= at.x <= x1 and y0 <= at.y <= y1):
            raise LevelError(f"{level.id}: the camera's box leaves out {what}, at {at.x},{at.y}")


def under(position: Position) -> Position:
    """The cell under another: where a hung broom is untied from (D195)."""
    return Position(position.x, position.y + 1)


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


def _cells(
    shape: _Shape, spec: dict[str, Any], thing_id: str, position: Position
) -> tuple[Position, ...]:
    """A door's or a hole's `cells`: the cells of a doorway (D150) or of a hole (D167),
    side by side, floor, the first its own position, which its scene or its level
    names; a hole's are one or two. One with none has its position alone; no other
    thing has any."""
    kind = spec.get("kind")
    cells = spec.get("cells")
    if cells is None:
        return (position,) if kind in CELLED_KINDS else ()
    if kind not in CELLED_KINDS or not isinstance(cells, list) or not cells:
        raise LevelError(f"{shape.level_id}: only a door or a hole has cells, a list of [x, y]")
    if kind != "door" and len(cells) > 2:
        raise LevelError(f"{shape.level_id}: the hole {thing_id} lies on one cell or two")
    placed = tuple(shape.tile(cell, f"a cell of {thing_id}") for cell in cells)
    if any(cell in shape.shelves for cell in placed):
        raise LevelError(f"{shape.level_id}: a cell of {thing_id} is a shelf, not floor")
    if placed[0] != position:
        raise LevelError(f"{shape.level_id}: {thing_id}'s first cell is not where it is")
    for one, other in zip(placed, placed[1:], strict=False):
        if abs(one.x - other.x) + abs(one.y - other.y) != 1:
            raise LevelError(f"{shape.level_id}: the cells of {thing_id} are not side by side")
    return placed


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
    points = [shape.tile(value, f"{actor_id}'s patrol") for value in waypoints]
    # The turning points of the path, drawn from the first when it is not the actor's
    # own tile and there are more; with one point, or from the actor's own tile, the
    # path starts where the actor stands (D137).
    elsewhere = len(points) > 1 and points[0] != position
    path = _patrol_path(shape, actor_id, points if elsewhere else [position, *points])
    facing = spec.get("facing")
    patrol_start, patrol_along = _patrol_start(shape, actor_id, path, position, facing, elsewhere)
    if facing is None and kind == "friend" and position != shape.start:
        # A friend looks at the wizard (D66).
        facing = _towards(position, shape.start)
    if facing is None:
        facing = _towards(path[0], path[1]) if len(path) > 1 else "down"
    if facing not in FACINGS:
        raise LevelError(f"{shape.level_id}: {actor_id} faces up, down, left or right")
    # A teacher who only stands by, Ilda on the field, sees nothing: sight 0.
    sight = spec.get("sight", DEFAULT_SIGHT)
    if not isinstance(sight, int) or isinstance(sight, bool) or sight < 0:
        raise LevelError(f"{shape.level_id}: {actor_id}'s sight must be a whole number, 0 or more")
    patrol = tuple(path) if len(path) > 1 else ()
    asleep = spec.get("asleep")
    if asleep is not None and not isinstance(asleep, str):
        raise LevelError(f"{shape.level_id}: {actor_id} is asleep in a bed, named by its id")
    if asleep is not None and patrol:
        raise LevelError(f"{shape.level_id}: {actor_id} is asleep, and walks no patrol")
    sitting = spec.get("sitting", False)
    if not isinstance(sitting, bool) or (sitting and patrol):
        raise LevelError(f"{shape.level_id}: {actor_id} sits, true or false, and walks no patrol")
    return ActorSpec(
        kind,
        actor_id,
        position,
        facing,
        patrol,
        sight,
        asleep,
        patrol_start,
        patrol_along,
        sitting=sitting,
        drill=_drill(shape, spec, actor_id),
        **_creature(spec, shape.level_id, actor_id),
    )


def _drill(shape: _Shape, spec: dict[str, Any], actor_id: str) -> tuple[Position, ...]:
    """A familiar's loop of cells, ordered round by its owner (D300): checked against the
    familiar block once it is read (`_check_drills`)."""
    value = spec.get("drill", [])
    if not isinstance(value, list):
        raise LevelError(f"{shape.level_id}: {actor_id}'s drill is a list of [x, y]")
    return tuple(shape.tile(cell, f"{actor_id}'s drill") for cell in value)


def _creature(spec: dict[str, Any], level_id: str, actor_id: str) -> dict[str, Any]:
    """An actor of the kind `familiar`, someone else's creature (D273): `creature`, a
    kind or a list of kinds; `color`, one, or one for each kind of the list, or none for
    a trial with no colour; `trial` or `spark`, or neither for one that lives; or `of`,
    `mate`, the room-mate's copy of the child's. No other actor has any of these."""
    from .familiars import KINDS, SHEETS

    keys = ("creature", "color", "trial", "spark", "of", "tries", "drill")
    if spec.get("kind") != "familiar":
        if any(key in spec for key in keys):
            raise LevelError(f"{level_id}: only a familiar has {', '.join(keys)}")
        return {}
    creature, color, of = spec.get("creature"), spec.get("color"), spec.get("of")
    trial, spark = spec.get("trial", False), spec.get("spark", False)
    # The room-mate's tries are a spark to the world; the page shows them coming and
    # going (D300).
    tries = spec.get("tries", False)
    if not isinstance(tries, bool) or (tries and (spark or trial)):
        raise LevelError(f"{level_id}: {actor_id}'s tries are true or false, in place of a spark")
    if tries:
        if creature is not None or color is not None or of is not None or "drill" in spec:
            raise LevelError(f"{level_id}: {actor_id}'s tries have no kind and no colour")
        return {"spark": True, "tries": True}
    if "drill" in spec and (spark or of is not None):
        raise LevelError(f"{level_id}: {actor_id}'s drill is a creature's, not a spark's")
    if not isinstance(trial, bool) or not isinstance(spark, bool) or (trial and spark):
        raise LevelError(f"{level_id}: {actor_id} is a trial or a spark, true or false")
    if of is not None:
        if of != "mate" or creature is not None or color is not None or spark:
            raise LevelError(f"{level_id}: {actor_id} is of the mate, drawn from the child's")
        return {"of": of, "trial": trial}
    if spark:
        if creature is not None or color is not None:
            raise LevelError(f"{level_id}: {actor_id} is a spark, with no kind and no colour")
        return {"spark": True}
    kinds = creature if isinstance(creature, list) else [creature]
    if not kinds or not all(kind in KINDS for kind in kinds):
        raise LevelError(f"{level_id}: {actor_id}'s creature is a kind of the first year")
    colours = color if isinstance(color, list) else [color] * len(kinds)
    if len(colours) != len(kinds) or not all(
        c in SHEETS[k] or (c is None and trial) for k, c in zip(kinds, colours, strict=True)
    ):
        raise LevelError(f"{level_id}: {actor_id}'s colour is its kind's, one for each kind")
    return {
        "creature": tuple(kinds) if isinstance(creature, list) else creature,
        "color": tuple(colours) if isinstance(color, list) else color,
        "trial": trial,
    }


def _patrol_path(shape: _Shape, actor_id: str, points: list[Position]) -> list[Position]:
    """The tiles of a patrol, walked in straight lines through its turning points."""
    path, here = [points[0]], points[0]
    for there in points[1:]:
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
    return path


def _patrol_start(
    shape: _Shape,
    actor_id: str,
    path: list[Position],
    position: Position,
    facing: Any,
    elsewhere: bool,
) -> tuple[int, int]:
    """Where on its path an actor starts and which way it walks: from the path's first
    tile, onward; on a path drawn from a point elsewhere (D137), on the actor's tile,
    which lies on the path, the way it faces, toward a neighbour there."""
    if not elsewhere:
        return 0, 1
    if position not in path:
        raise LevelError(f"{shape.level_id}: {actor_id} stands off its patrol")
    index = path.index(position)
    for along in (1, -1):
        if 0 <= index + along < len(path) and _towards(position, path[index + along]) == facing:
            return index, along
    raise LevelError(f"{shape.level_id}: {actor_id} must face along its patrol")


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
) -> dict[Position, str]:
    """The tiles the wizard may not step on, each with the reason it is told (D84):
    `{"reason": "not_my_dormitory", "cells": [[x, y], ...]}`, each a floor tile; or a
    list of them, the scene's and the level's own (D205), no tile named twice."""
    if value is None:
        return {}
    found: dict[Position, str] = {}
    for part in value if isinstance(value, list) else [value]:
        reason = part.get("reason") if isinstance(part, dict) else None
        cells = part.get("cells") if isinstance(part, dict) else None
        if not isinstance(reason, str) or not reason.isidentifier() or not isinstance(cells, list):
            raise LevelError(f"{level_id}: forbidden is a reason and its cells")
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
            if here in found:
                raise LevelError(
                    f"{level_id}: the forbidden cell {here.x},{here.y} is named twice"
                )
            found[here] = reason
    return found


def _sought_in_the_dark(
    goals: list[GoalSpec], things: tuple[ThingSpec, ...], area: set[Position]
) -> bool:
    """Whether a `collect` or an `open` goal names a thing that lies in the dark: in the
    dark rooms, or anywhere when the whole map is dark (D162). A door lies in the dark
    when one of its cells does; a goal for any thing of a kind, when one of them does."""

    def dark(position: Position) -> bool:
        return not area or position in area

    for goal in goals:
        if goal.kind not in ("collect", "open"):
            continue
        sought = [
            thing
            for thing in things
            if thing.id == goal.params.get("id") or thing.kind == goal.params.get("of")
        ]
        for thing in sought:
            if not thing.carried and any(map(dark, thing.cells or (thing.position,))):
                return True
    return False


def _list_of_boxes(
    value: Any, level_id: str, what: str = "dark_area"
) -> list[tuple[int, int, int, int]]:
    if not isinstance(value, list) or not all(
        isinstance(box, list) and len(box) == 4 and all(isinstance(v, int) for v in box)
        for box in value
    ):
        raise LevelError(f"{level_id}: {what} is a list of [x0, y0, x1, y1]")
    return [tuple(box) for box in value]


def _ways(data: dict[str, Any]) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """Each way of a level, with level.json as that way plays it: its things and actors
    merged by id, field by field, a thing it says is `gone` taken away, and its
    carrying, spells and dark in place of the level's (D51)."""
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
    gone = set()
    for change in changes:
        item_id = change.get("id")
        if item_id not in by_id:
            raise LevelError(f"{level_id}: the way {way_id} changes {item_id}, not in {key}")
        # A thing a way does not have: six brooms in one way, nine in another (D184).
        if change.get("gone") is True:
            if key != "things" or set(change) != {"id", "gone"}:
                raise LevelError(
                    f"{level_id}: the way {way_id} takes away a thing, by its id alone"
                )
            gone.add(item_id)
            continue
        by_id[item_id].update(change)
    return [by_id[item.get("id")] for item in base if item.get("id") not in gone]


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


def check_pairs(level_id: str, rings: list[ThingSpec], start: Position, who: str) -> None:
    """D219: rings flown in order go in pairs, taken two by two: the first `up` and
    the second `down`, on one row, the second to the right of the first, of one colour,
    and a pair of another colour than the pair before; `who` starts on the row under the
    first."""
    if len(rings) % 2:
        raise LevelError(f"{level_id}: the rings go in pairs, and {rings[-1].id} has none")
    for index in range(0, len(rings), 2):
        first, second = rings[index], rings[index + 1]
        if first.way != "up" or second.way != "down":
            raise LevelError(
                f"{level_id}: in a pair the first ring is flown up and the second down, "
                f"not {first.id} {first.way} and {second.id} {second.way}"
            )
        if first.position.y != second.position.y or second.position.x <= first.position.x:
            raise LevelError(f"{level_id}: {second.id} stands on {first.id}'s row, to its right")
        if first.colour != second.colour:
            raise LevelError(f"{level_id}: {first.id} and {second.id} are a pair of one colour")
        if index and first.colour == rings[index - 1].colour:
            raise LevelError(
                f"{level_id}: {first.id}'s pair is of another colour than the pair before"
            )
    if rings and start.y != rings[0].position.y + 1:
        raise LevelError(f"{level_id}: {who} starts on the row under {rings[0].id}")


def _check_rings(level: "Level") -> None:
    """The rings a `through_in_order` goal names go in pairs, the wizard starting under
    the first (D219), and none of them is a racer's (D220)."""
    rings = {thing.id: thing for thing in level.things if thing.kind == "ring"}
    for goal in level.goals:
        ids = goal.params.get("ids") if goal.kind == "through_in_order" else None
        if isinstance(ids, list) and all(ring in rings for ring in ids):
            check_pairs(level.id, [rings[ring] for ring in ids], level.start, "the wizard")
            shared = set(ids) & set(level.race.rings if level.race else ())
            if shared:
                raise LevelError(
                    f"{level.id}: {', '.join(sorted(shared))} is the racer's, not the wizard's"
                )


def _race(
    value: Any, shape: _Shape, actors: tuple[ActorSpec, ...], things: tuple[ThingSpec, ...]
) -> Race | None:
    """A level's race (D189, D220): `{"against": <a racer's id>, "lines": <its program's
    lines>, "path": [[x, y], ...], "rings": [<ring id>, ...], "finish": [x, y]}`, the
    path's turning points from where the racer stands, flown in straight lines over
    cells a flight crosses, no point twice running; `rings` his own, in pairs by D219,
    his start on the row under the first; `finish` the wizard's. The path flies each of
    his rings in its turn and by its way, enters no other ring, stays in his lane, from
    the row under his rings to the row over them, and ends on the finish's column."""
    if value is None:
        return None
    level_id = shape.level_id
    if not isinstance(value, dict) or set(value) != {
        "against",
        "lines",
        "path",
        "rings",
        "finish",
    }:
        raise LevelError(
            f"{level_id}: a race names its racer, its lines, its path, his rings and the finish"
        )
    racers = {actor.id: actor for actor in actors if actor.kind == "racer"}
    racer = racers.get(value["against"])
    if racer is None:
        raise LevelError(f"{level_id}: the race is against {value['against']}, no racer here")
    lines = value["lines"]
    if isinstance(lines, bool) or not isinstance(lines, int) or lines < 1:
        raise LevelError(f"{level_id}: a racer's lines are a whole number, 1 or more")
    points = value["path"]
    if not isinstance(points, list) or not points:
        raise LevelError(f"{level_id}: a race's path is a list of [x, y]")
    path, here = [], racer.position
    for point in points:
        there = shape.tile(point, f"{racer.id}'s path")
        if there == here:
            raise LevelError(
                f"{level_id}: {racer.id}'s path names {there.x},{there.y} twice running"
            )
        if there.x != here.x and there.y != here.y:
            raise LevelError(f"{level_id}: {racer.id}'s path goes in straight lines")
        dx = (there.x > here.x) - (there.x < here.x)
        dy = (there.y > here.y) - (there.y < here.y)
        while here != there:
            here = Position(here.x + dx, here.y + dy)
            if here in shape.walls or (here in shape.shelves and here not in shape.low):
                raise LevelError(f"{level_id}: {racer.id}'s path flies into a wall")
            path.append(here)
    finish = shape.tile(value["finish"], "the race's finish")
    rings = {thing.id: thing for thing in things if thing.kind == "ring"}
    own = value["rings"]
    if not isinstance(own, list) or not own or not all(ring in rings for ring in own):
        raise LevelError(f"{level_id}: {racer.id}'s rings are rings of the level")
    check_pairs(level_id, [rings[ring] for ring in own], racer.position, racer.id)
    _check_racer_s_flight(level_id, racer, path, [rings[ring] for ring in own], rings, finish)
    return Race(racer.id, lines, tuple(path), finish, tuple(own))


def _check_racer_s_flight(
    level_id: str,
    racer: ActorSpec,
    path: list[Position],
    own: list[ThingSpec],
    rings: dict[str, ThingSpec],
    finish: Position,
) -> None:
    """D220: the racer flies each of his rings in its turn and by its way, enters no
    other ring, keeps to his lane and ends on the finish's column."""
    rows = {ring.position.y for ring in own}
    lane = range(min(rows) - 1, max(rows) + 2)
    cells = [racer.position, *path]
    at = {ring.position: ring for ring in rings.values()}
    flown = []
    for index, here in enumerate(cells[1:], 1):
        if here.y not in lane:
            raise LevelError(f"{level_id}: {racer.id}'s path leaves his lane at {here.x},{here.y}")
        ring = at.get(here)
        if ring is None:
            continue
        came, going = cells[index - 1], cells[index + 1] if index + 1 < len(cells) else None
        upward = going is not None and came.x == here.x == going.x and came.y > here.y > going.y
        downward = going is not None and came.x == here.x == going.x and came.y < here.y < going.y
        if not (upward and ring.way == "up" or downward and ring.way == "down"):
            raise LevelError(f"{level_id}: {racer.id}'s path flies {ring.id} not by its way")
        flown.append(ring.id)
    if flown != [ring.id for ring in own]:
        raise LevelError(
            f"{level_id}: {racer.id}'s path flies {', '.join(flown) or 'no ring'}, "
            f"not his rings in their order"
        )
    if path[-1].x != finish.x:
        raise LevelError(f"{level_id}: {racer.id}'s path ends off the finish's column")


def _kinds(data: dict[str, Any]) -> dict[Position, str]:
    """On a scene, the kind of each cell's terrain no one walks on (on_scene gives the
    scene's letters, `terrain`, and their kinds, `terrains`, and its walked letters,
    `walked`): what the wizard thinks of where it cannot go (D186)."""
    rows, kinds = data.get("terrain"), data.get("terrains")
    if not isinstance(rows, list) or not isinstance(kinds, dict):
        return {}
    walked = set(data.get("walked", []))
    return {
        Position(x, y): kinds[letter]
        for y, row in enumerate(rows)
        for x, letter in enumerate(row)
        if letter not in walked and letter in kinds
    }


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


def _cell(shape: _Shape, value: Any, what: str) -> Position:
    """A cell given as [x, y] that is the map's and not a wall."""
    return shape.tile(value, what)


def _voices(value: Any, shape: _Shape) -> dict[str, Position]:
    """Where someone painted into the scene speaks from (D264): `{"bimo": [9, 3]}`."""
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise LevelError(f"{shape.level_id}: voices are named, each a cell [x, y]")
    found = {}
    for who, cell in value.items():
        if not isinstance(who, str) or not who.isidentifier():
            raise LevelError(f"{shape.level_id}: a voice's name is a Python name")
        if not (
            isinstance(cell, list)
            and len(cell) == 2
            and all(isinstance(v, int) and not isinstance(v, bool) for v in cell)
        ):
            raise LevelError(f"{shape.level_id}: the voice {who} speaks from a cell [x, y]")
        found[who] = Position(*cell)
    return found


def _fault(value: Any, level_id: str, kind: str) -> str | None:
    """A fix level's `fault` (D272): the explanation its given program stops with."""
    if value is None:
        return None
    if kind != "fix" or value not in FAULTS:
        raise LevelError(f"{level_id}: a fix level's fault is one of {', '.join(FAULTS)}")
    return value


def _described(value: Any, level_id: str, what: str) -> Described | None:
    """A familiar described, `{"kind": "Fox", "name": "Pimu", "color": "red"}`, its name
    and colour maybe left out: a kind and a colour of the first year's table, and a name
    the book takes (D260, D261)."""
    from .familiars import KINDS, name_problem

    if value is None:
        return None
    if not isinstance(value, dict) or set(value) - {"kind", "name", "color"}:
        raise LevelError(f"{level_id}: {what} is a kind, a name and a colour")
    kind, name, color = value.get("kind"), value.get("name"), value.get("color")
    if kind not in KINDS:
        raise LevelError(f"{level_id}: {what}'s kind is one of {', '.join(KINDS)}")
    if name is not None and name_problem(name) is not None:
        raise LevelError(f"{level_id}: {what}'s name {name!r} is not one the book takes")
    if color is not None and color not in KINDS[kind]:
        raise LevelError(f"{level_id}: {what}'s colour is one of {kind}'s")
    return Described(kind, name, color)


def _familiar(value: Any, shape: _Shape, level: "Level") -> FamiliarBlock | None:
    """A level's `familiar` block (D260), checked against the level."""
    from .familiars import METHODS

    level_id = level.id
    if value is None:
        return None
    # `practice`: the page's mark of a level described again with a familiar living.
    known = {
        "stage",
        "circle",
        "trials",
        "methods",
        "book",
        "then",
        "draft",
        "living",
        "from",
        "practice",
        "most",
    }
    if not isinstance(value, dict) or set(value) - known - {"orders"}:
        raise LevelError(f"{level_id}: the familiar block has {', '.join(sorted(known))}, orders")
    stage = value.get("stage")
    if stage not in FAMILIAR_STAGES:
        raise LevelError(
            f"{level_id}: the familiar's stage is one of {', '.join(FAMILIAR_STAGES)}"
        )
    circle = value.get("circle")
    box: tuple[int, int, int, int] | None = None
    if circle is not None:
        boxes = _list_of_boxes([circle], level_id, "the familiar's circle")
        box = boxes[0]
        x0, y0, x1, y1 = box
        cells = [Position(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
        if x0 > x1 or y0 > y1 or not all(level.free(cell) for cell in cells):
            raise LevelError(f"{level_id}: the familiar's circle is a box of floor cells")
    trials = tuple(
        _cell(shape, cell, "a trial's cell")
        for cell in _cells_list(value.get("trials", []), level_id)
    )
    if stage in ("trial", "birth"):
        if box is None or not trials:
            raise LevelError(f"{level_id}: a {stage} level has its circle and its trials' cells")
    block = FamiliarBlock(stage, circle=box)
    if any(not block.in_circle(cell) for cell in trials) or len(set(trials)) != len(trials):
        raise LevelError(f"{level_id}: the trials' cells are cells of the circle, each once")
    # How many familiars a program may make (D297): one, or two where the level says so.
    most = value.get("most", 1)
    if "most" in value and stage not in ("trial", "birth"):
        raise LevelError(f"{level_id}: most is said in a level of trials or of the birth")
    if (
        most not in (1, 2)
        or isinstance(most, bool)
        or (stage in ("trial", "birth") and len(trials) < most)
    ):
        raise LevelError(f"{level_id}: most is 1 or 2, with as many trials' cells at least")
    methods = value.get("methods", [])
    if not isinstance(methods, list) or not set(methods) <= set(METHODS):
        raise LevelError(f"{level_id}: the methods a class may define are of {', '.join(METHODS)}")
    book = value.get("book", False)
    if not isinstance(book, bool):
        raise LevelError(f"{level_id}: the familiar's book is true or false")
    then = None
    then_way: tuple[Position, ...] = ()
    if value.get("then") is not None:
        spec = value["then"]
        actors = {actor.id: actor for actor in level.actors}
        if not isinstance(spec, dict) or not {"born", "to"} <= set(spec) <= {"born", "to", "way"}:
            raise LevelError(
                f"{level_id}: then is the familiar born, the cell it steps to and its way"
            )
        if spec["born"] not in actors or actors[spec["born"]].kind != "familiar":
            raise LevelError(f"{level_id}: then names an actor of the kind familiar")
        to = _cell(shape, spec["to"], "then's cell")
        if not level.free(to):
            raise LevelError(f"{level_id}: then's cell is floor")
        then = (spec["born"], to)
        then_way = _then_way(spec.get("way", []), to, shape, level, spec["born"])
    draft = _described(value.get("draft"), level_id, "the draft")
    # A living level plays with the living familiar; any other may be told the game has
    # one, which makes a trial level practice and holds the birth (D265, D268).
    living = _living(value.get("living"), shape, level, stage)
    if stage == "living" and living is None:
        raise LevelError(f"{level_id}: a living level has its living familiar")
    source = value.get("from", "source")
    if source not in ("source", "learned"):
        raise LevelError(f"{level_id}: the living familiar's class is from source or learned")
    orders, orders_on = _orders(value.get("orders"), shape, level, stage)
    _check_drills(level, block, trials)
    return FamiliarBlock(
        stage,
        circle=box,
        trials=trials,
        methods=tuple(methods),
        book=book,
        then=then,
        draft=draft,
        living=living,
        source=source,
        orders=orders,
        orders_on=orders_on,
        most=most,
        then_way=then_way,
    )


def _check_drills(level: "Level", block: FamiliarBlock, trials: tuple[Position, ...]) -> None:
    """Each familiar's drill (D300): a loop of cells one step apart, its first one step
    from the familiar's own cell and its last that cell, all inside the circle, none a
    trial's cell nor another actor's."""
    for actor in level.actors:
        if not actor.drill:
            continue
        held = {other.position for other in level.actors if other.id != actor.id}
        cells = actor.drill
        steps = zip((actor.position, *cells), cells, strict=False)
        if (
            cells[-1] != actor.position
            or any(abs(a.x - b.x) + abs(a.y - b.y) != 1 for a, b in steps)
            or not all(block.in_circle(cell) for cell in cells)
            or any(cell in trials or cell in held for cell in cells)
        ):
            raise LevelError(
                f"{level.id}: {actor.id}'s drill is a loop of steps in the circle, back to "
                "its own cell, on no trial's cell nor another's"
            )


def _then_way(
    value: Any, start: Position, shape: _Shape, level: "Level", walker: str
) -> tuple[Position, ...]:
    """The cells a familiar born by `then` walks after its step out (D302): its way's
    corners walked out from `start`, each leg straight, every cell walked by a familiar
    and held by no other actor."""
    level_id = level.id
    if not isinstance(value, list):
        raise LevelError(f"{level_id}: then's way is a list of corners")
    held = {actor.position for actor in level.actors if actor.id != walker}
    cells: list[Position] = []
    here = start
    for corner in value:
        to = _cell(shape, corner, "a corner of then's way")
        if (to.x != here.x) == (to.y != here.y):
            raise LevelError(f"{level_id}: each leg of then's way is straight, one cell or more")
        dx = (to.x > here.x) - (to.x < here.x)
        dy = (to.y > here.y) - (to.y < here.y)
        while here != to:
            here = Position(here.x + dx, here.y + dy)
            if not level.familiar_walks(here) or here in held:
                raise LevelError(f"{level_id}: then's way crosses {here.x},{here.y}")
            cells.append(here)
    return tuple(cells)


def _cells_list(value: Any, level_id: str) -> list[Any]:
    if not isinstance(value, list):
        raise LevelError(f"{level_id}: the trials' cells are a list of [x, y]")
    return value


def _living(value: Any, shape: _Shape, level: "Level", stage: str) -> Living | None:
    """A living level's familiar (D265, D269): its kind, name and colour, its kept class,
    and where it stands and faces at the start; in another level, the game's familiar,
    which only says that one lives, standing nowhere."""
    from .familiars import KINDS, name_problem

    level_id = level.id
    if value is None:
        return None
    fields = {"kind", "name", "color", "source", "learned", "at", "facing"}
    if not isinstance(value, dict) or set(value) - fields:
        raise LevelError(f"{level_id}: the living familiar has {', '.join(sorted(fields))}")
    kind, name, color = value.get("kind"), value.get("name"), value.get("color")
    if kind not in KINDS or color not in KINDS[kind] or name_problem(name) is not None:
        raise LevelError(
            f"{level_id}: the living familiar is a kind, a colour and a name of the book"
        )
    source, learned = value.get("source"), value.get("learned")
    if not isinstance(source, str) or (learned is not None and not isinstance(learned, str)):
        raise LevelError(f"{level_id}: the living familiar's classes are programs")
    if stage != "living" and "at" not in value:
        return Living(kind, name, color, source, Position(0, 0), "down", learned)
    at = _cell(shape, value.get("at"), "the living familiar")
    if not level.familiar_walks(at):
        raise LevelError(f"{level_id}: the living familiar stands on no cell it walks")
    facing = value.get("facing", "down")
    if facing not in FACINGS:
        raise LevelError(f"{level_id}: the living familiar faces up, down, left or right")
    return Living(kind, name, color, source, at, facing, learned)


def _orders(
    value: Any, shape: _Shape, level: "Level", stage: str
) -> tuple[tuple[Order, ...], str | None]:
    """Orla's orders after the program (D267): `{"on": <plate>, "steps": [{"to": [x, y],
    "key": <words>}...]}`, given when the familiar ends on that plate."""
    if value is None:
        return (), None
    level_id = level.id
    if stage != "living" or not isinstance(value, dict) or set(value) != {"on", "steps"}:
        raise LevelError(f"{level_id}: a living level's orders follow a plate, step by step")
    plates = {thing.id for thing in level.things if thing.kind == "plate"}
    if value["on"] not in plates:
        raise LevelError(f"{level_id}: the orders follow a plate of the level")
    steps = value["steps"]
    if not isinstance(steps, list) or not steps:
        raise LevelError(f"{level_id}: the orders have their steps")
    found = []
    for step in steps:
        if not isinstance(step, dict) or set(step) != {"to", "key"}:
            raise LevelError(f"{level_id}: an order is a cell and its words' key")
        to = _cell(shape, step["to"], "an order's cell")
        if not isinstance(step["key"], str) or not step["key"].isidentifier():
            raise LevelError(f"{level_id}: an order's words' key is a name")
        found.append(Order(to, step["key"]))
    return tuple(found), value["on"]


def _told_won(value: Any, level: "Level") -> tuple[tuple[str, str], ...]:
    """What is said at the end of a run won (D264): `{"won": [["orla", "won"], ...]}`,
    each said by an actor of the level or a voice of its scene."""
    if value is None:
        return ()
    level_id = level.id
    said = value.get("won") if isinstance(value, dict) and set(value) == {"won"} else None
    if not isinstance(said, list):
        raise LevelError(f"{level_id}: told is what is said when the run is won")
    speakers = {actor.id for actor in level.actors} | set(level.voices)
    found = []
    for entry in said:
        if not (
            isinstance(entry, list) and len(entry) == 2 and all(isinstance(e, str) for e in entry)
        ):
            raise LevelError(f"{level_id}: told says who speaks and the words' key")
        if entry[0] not in speakers:
            raise LevelError(f"{level_id}: told's {entry[0]} is no one of the level or its scene")
        found.append((entry[0], entry[1]))
    return tuple(found)


#: What a scene's letters are when it gives no table of its own (D65): wall,
#: floor, shelf and a low cell, as in a level's map.
DEFAULT_TERRAINS = {
    WALL: {"kind": "wall", "walk": False, "sight": False, "fly": False},
    FLOOR: {"kind": "floor", "walk": True, "sight": True, "fly": True},
    SHELF: {"kind": "shelf", "walk": False, "sight": True, "fly": False},
    LOW: {"kind": "low", "walk": False, "sight": True, "fly": True},
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
    #: The boxes of cells that hide every figure in them, x0, y0, x1, y1 (D135).
    enchanted: tuple[tuple[int, int, int, int], ...] = ()
    #: Where someone painted into the scene speaks from, by id, each [x, y] (D264).
    voices: dict[str, list[int]] = field(default_factory=dict)

    def walks(self, x: int, y: int) -> bool:
        """Whether the wizard and everyone walks a cell: not a familiars' passage (D270), nor
        a story's own floor (D288)."""
        return self.terrains[self.rows[y][x]]["walk"] is True


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
        # A familiars' passage is walked by a familiar alone, `"walk": "small"` (D270); the
        # floor the painting shows where no level goes, by a story's figures alone,
        # `"walk": "story"` (D288).
        raw = terrain.get("walk", False)
        walk: bool | str = raw if raw in ("small", "story") else bool(raw)
        terrains[letter] = {
            "kind": terrain["kind"],
            "walk": walk,
            "sight": bool(terrain.get("sight", walk is True)),
            # Floor flies; a terrain no one walks on flies only when it says so (D186); a
            # story's floor is a wall or a shelf to a level, and no flight crosses it.
            "fly": walk is True or (walk != "story" and bool(terrain.get("fly", False))),
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
    props = tuple(about.get("props", []))
    enchanted = _enchanted(about.get("enchanted", []), scene_id, rows, terrains)
    voices = about.get("voices", {})
    if not isinstance(voices, dict) or not all(
        isinstance(cell, list) and len(cell) == 2 and all(isinstance(v, int) for v in cell)
        for cell in voices.values()
    ):
        raise LevelError(f"{scene_id}: voices are named, each a cell [x, y]")
    return Scene(scene_id, rows, terrains, things, props, rooms, forbidden, enchanted, voices)


def _enchanted(
    boxes: Any, scene_id: str, rows: tuple[str, ...], terrains: dict[str, dict[str, Any]]
) -> tuple[tuple[int, int, int, int], ...]:
    """A scene's enchanted region (D135): boxes of cells, x0, y0, x1, y1, all floor."""
    if not isinstance(boxes, list) or not all(
        isinstance(box, list) and len(box) == 4 and all(isinstance(v, int) for v in box)
        for box in boxes
    ):
        raise LevelError(f"{scene_id}: enchanted is a list of [x0, y0, x1, y1]")
    for x0, y0, x1, y1 in boxes:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                inside = 0 <= y < len(rows) and 0 <= x < len(rows[y])
                if not inside or terrains[rows[y][x]]["walk"] is not True:
                    raise LevelError(f"{scene_id}: the enchanted cell {x},{y} is not floor")
    return tuple(tuple(box) for box in boxes)


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


def _story_door_cells(thing: dict[str, Any]) -> list[Position]:
    """The cells of a door's doorway in a story's things, its `at` where it has no
    `cells` (D150)."""
    return [Position(*cell) for cell in thing.get("cells", [thing["at"]])]


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
            if terrain["walk"] == "small":
                line.append(SMALL)
            elif terrain["walk"] is True:
                line.append(FLOOR)
            elif terrain.get("fly"):
                line.append(LOW)
            else:
                line.append(SHELF if terrain["sight"] else WALL)
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
    built["walked"] = sorted(
        letter for letter, terrain in scene.terrains.items() if terrain["walk"] is True
    )
    if scene.props:
        built["props"] = list(scene.props)
    if scene.things or data.get("things"):
        built["things"] = _merged_things(scene, data)
    if scene.things:
        built["fixed"] = [thing["id"] for thing in scene.things]
    # The scene's forbidden tiles and the level's own, each with its reason (D205).
    if scene.forbidden is not None:
        own = data.get("forbidden")
        built["forbidden"] = [scene.forbidden, own] if own is not None else scene.forbidden
    if scene.enchanted:
        built["enchanted"] = [list(box) for box in scene.enchanted]
    if scene.voices:
        built["voices"] = {who: list(cell) for who, cell in scene.voices.items()}
    dark = data.get("dark")
    if isinstance(dark, list):
        missing = [room for room in dark if room not in scene.rooms]
        if missing:
            raise LevelError(f"{level_id}: no room {', '.join(map(str, missing))} in the scene")
        built["dark"] = bool(dark)
        built["dark_area"] = [list(scene.rooms[room]) for room in dark]
    return built


STORY_DOINGS = (
    "walk",
    "fly",
    "land",
    "face",
    "appear",
    "vanish",
    "sleep",
    "wake",
    "open",
    "close",
    "stand",
    "sit",
    "show",
)
#: The lights a story may be told under, besides its scene's own (D124).
STORY_LIGHTS = ("morning", "sunset")
#: The stills a story's steps may be told over (D251): the welcome's painting of the
#: castle, which the opening tells its first steps over and `the-end-of-the-year` its last.
STILLS = ("castle",)


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
        # A figure that comes into sight in the air, on its broom (D185).
        if kinds == {"appear", "flying"} and action.get("flying") is True:
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


def story_on_scene(
    data: dict[str, Any], scene: Scene, sitters: frozenset[str] = frozenset()
) -> dict[str, Any]:
    """A story's staging checked against its scene and made whole (D74): the
    world the page draws, as a level on the scene is built, under `world`.

    The staging puts the wizard at `wizard`, the camera on `camera`, the light
    over the scene on `light` (`morning`, D124), and each actor at its `at`; an
    actor with no `at` is out of sight until a step makes it appear; the story's
    `things` place the scene's things or add a door. A story's figure stands on and
    walks the scene's floor, and the floor its terrains keep for a story (`"walk":
    "story"`, D288), which a level's map has as a wall or a shelf.
    Each step is said by `voice`, `wizard` or an actor, after its actions
    (`do`, one or a list, D103), each done by its `by`, the step's `by`, or its
    speaker: a walk to a tile or through a list of them, each in a straight
    line, every tile on the way walked on and free (no one standing there, no
    door shut), and ending out of sight when it says `vanish`; a turn to face
    a way; appearing on a free tile, maybe stepping out `from` behind a thing
    on a cell beside it, a shelf or a floor (D128); vanishing, a speaker once
    its words are said; lying down asleep in a bed, no one else's, from the cell
    under its pillow (`pillow_side`, D130), or from beside a bed with none, and
    waking (D91); opening or closing a door beside it; standing up, seated, and sitting
    down, a figure of `sitters`, whose sheet has the sitting rows (D273), and bringing
    into sight a thing staged `hidden` (D279), a seated figure never walking. One
    figure's actions follow
    one another; different figures' are played at once, tick by tick, in the
    order they are first named, and are checked so. An actor may start
    `asleep` in a bed, its `at` the bed's pillow_side, where it gets up. No one
    walks onto an open door's leaf, and whoever stands on it as the door opens
    steps aside along the row (D125). The voice does nothing itself; no one
    speaks or moves out of sight, and no one asleep walks, turns or goes. The wizard
    stays in sight but for a walk out of sight in the story's last step. A story with
    a still, the opening, may tell its first steps in a row over the still (`still`,
    D251), each of the voice and doing nothing; the first of them, in a row, may hold
    the story's letter before the still (`letter`, D257)."""
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
        cell
        for thing in built.get("things", [])
        if thing.get("kind") == "door" and thing.get("open") is not True and "at" in thing
        for cell in _story_door_cells(thing)
    }
    camera = _story_tile(data.get("camera", list(wizard)), "camera", story_id)
    # A morning story on a scene painted at night opens under the morning's light (D124).
    if data.get("light", "morning") not in STORY_LIGHTS:
        raise LevelError(f"{story_id}: a story's light is one of {', '.join(STORY_LIGHTS)}")
    if not (0 <= camera.x < width and 0 <= camera.y < height):
        raise LevelError(f"{story_id}: the camera's tile {camera.x},{camera.y} is off the scene")

    # The floor only a story's figures walk, read from the scene's terrains, since a
    # level's map has it as a wall or a shelf (D288).
    told = {
        Position(x, y)
        for y, row in enumerate(scene.rows)
        for x, char in enumerate(row)
        if scene.terrains[char]["walk"] == "story"
    }

    def walked(tile: Position, flying: bool = False) -> bool:
        """A tile a figure stands on, or, `flying`, flies over: a low cell too (D186), and
        a story's own floor (D288)."""
        if tile in told:
            return True
        inside = 0 <= tile.y < height and 0 <= tile.x < width
        char = grid[tile.y][tile.x] if inside else WALL
        return char not in (WALL, SHELF) and (flying or char != LOW)

    # Where each figure stands, or None while out of sight; the familiars, whose steps
    # are quick (D277); who is seated (D273, D279).
    where: dict[str, Position | None] = {"wizard": wizard}
    familiar_ids = {actor.get("id") for actor in actors if actor.get("kind") == "familiar"}
    seated = {actor.get("id") for actor in actors if actor.get("sitting") is True}
    # The things staged hidden, which a figure brings into sight (D279), and those shown.
    hidden: set[str] = set()
    for thing in data.get("things", []):
        if isinstance(thing, dict) and thing.get("hidden") is True:
            if thing.get("kind") not in CARRIED_KINDS:
                raise LevelError(f"{story_id}: only a thing the wizard carries is hidden")
            hidden.add(thing.get("id"))
    shown: set[str] = set()
    for actor in actors:
        actor_id = _identifier(story_id, actor.get("id"), "an actor's id")
        if actor_id in where:
            raise LevelError(f"{story_id}: two figures are called {actor_id}")
        if actor.get("kind") not in ACTOR_KINDS:
            raise LevelError(f"{story_id}: {actor_id} is of no kind of actor")
        where[actor_id] = (
            _story_tile(actor["at"], f"{actor_id}'s at", story_id) if "at" in actor else None
        )
        flying = actor_id in data.get("flying", [])
        if where[actor_id] is not None and not walked(where[actor_id], flying):
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

    # Who is in the air on a broom (D185): those the staging says, and whoever flies.
    aloft = set(data.get("flying", []))
    if not aloft <= set(where):
        raise LevelError(f"{story_id}: flying names someone not in the story")

    def free(tile: Position, mover: str) -> bool:
        taken = any(at == tile for who, at in where.items() if who != mover)
        return (
            walked(tile, mover in aloft)
            and tile not in shut
            and not under_leaf(tile)
            and not taken
        )

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
        thing["id"]: _story_door_cells(thing)
        for thing in built.get("things", [])
        if thing.get("kind") == "door" and "at" in thing
    }
    opened.update(name for name, cells in doors.items() if not shut.intersection(cells))

    def shove(door: str, queues: dict[str, list[tuple[str, Any]]], here: str) -> None:
        """Whoever stands on the door's leaf as it opens steps to the nearest free
        tile of the row, away from the door, as the world moves them (D125)."""
        for who, at in list(where.items()):
            if at is None or at not in leaves[door]:
                continue
            if queues.get(who):
                raise LevelError(f"{here}: {who} is in the way of {door}'s leaf, mid-way")
            way = -1 if at.x < doors[door][0].x else 1
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
    # The steps told over the story's still (D251) are its first ones in a row, or its
    # last ones; the steps that hold its letter before it are its first ones (D257).
    still_name = data.get("still")
    if still_name is not None and still_name not in STILLS:
        raise LevelError(f"{story_id}: a story's still is one of {', '.join(STILLS)}")
    over = [isinstance(step, dict) and "still" in step for step in steps]
    told_over = [index for index, mark in enumerate(over) if mark]
    if (
        told_over
        and told_over != list(range(len(told_over)))
        and told_over != list(range(len(steps) - len(told_over), len(steps)))
    ):
        raise LevelError(
            f"{story_id}: the steps over the still are the first, or the last, in a row"
        )
    # A figure painted into the scene speaks from its spot (D264).
    voices = set(scene.voices)
    holding_letter = True
    for number, step in enumerate(steps, 1):
        here = f"{story_id}, step {number}"
        if not isinstance(step, dict):
            raise LevelError(f"{here}: a step is an object")
        who, doing = step.get("who"), step.get("do")
        if who != "voice" and who not in where and who not in voices:
            raise LevelError(f"{here}: {who} is no one in the story")
        if "still" in step:
            if step["still"] is not True:
                raise LevelError(f"{here}: still is true, or not given")
            if data.get("opening") is not True and still_name is None:
                raise LevelError(
                    f"{here}: a step is told over the still only in a story that has one"
                )
            if who != "voice" or doing is not None:
                raise LevelError(f"{here}: a step over the still is the voice's, and does nothing")
        if "letter" in step:
            if step["letter"] is not True:
                raise LevelError(f"{here}: letter is true, or not given")
            if step.get("still") is not True:
                raise LevelError(f"{here}: the letter is held only on a step told over the still")
            if not holding_letter:
                raise LevelError(f"{here}: the steps that hold the letter are the first, in a row")
        else:
            holding_letter = False
        if "by" in step and doing is None:
            raise LevelError(f"{here}: by names who does the action, and there is none")
        if "meanwhile" in step:
            # A figure's words said while the step's actions play (D275).
            if step["meanwhile"] is not True:
                raise LevelError(f"{here}: meanwhile is true, or not given")
            if who == "voice" or doing is None:
                raise LevelError(
                    f"{here}: meanwhile is for a figure's words, said while its actions play"
                )
        if "camera" in step:
            _step_camera(step["camera"], here, width, height)
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
                if action.get("flying") is True:
                    queue.append(("lift", None))
                queue.append(("appear", tile))
                continue
            if planned[doer] is None:
                raise LevelError(f"{here}: {doer} is out of sight")
            if "land" in action:
                queue.append(("land", None))
                continue
            if "fly" in action or "walk" in action:
                if "fly" in action:
                    queue.append(("lift", None))
                at = planned[doer]
                for to in _waypoints(action.get("walk", action.get("fly")), here):
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
                    # The wizard may walk out of sight at the very end of a story.
                    if doer == "wizard" and number != len(steps):
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
            elif "stand" in action or "sit" in action:
                # A seated figure stands up, and one with the sitting rows sits (D279).
                kind = "stand" if "stand" in action else "sit"
                if action[kind] is not True:
                    raise LevelError(f"{here}: {kind} is true")
                if kind == "sit" and doer not in sitters:
                    raise LevelError(f"{here}: {doer} has no sitting rows to sit in")
                queue.append((kind, None))
            elif "show" in action:
                if action["show"] not in hidden:
                    raise LevelError(f"{here}: {action['show']} is no thing staged hidden")
                queue.append(("show", action["show"]))
            else:
                kind = "sleep" if "sleep" in action else "wake"
                queue.append((kind, action.get("sleep")))
        # In a step where a familiar walks, the figures play in half ticks: a familiar's
        # step takes one, every other doing two, as the page plays it (D277).
        quick = any(
            doer in familiar_ids and any(kind == "move" for kind, _ in queue)
            for doer, queue in queues.items()
        )
        busy: dict[str, int] = {}
        now = 0
        while any(queues.values()):
            now += 1
            for doer, queue in queues.items():
                if not queue or busy.get(doer, 0) > now:
                    continue
                kind, value = queue.pop(0)
                if quick and not (doer in familiar_ids and kind == "move"):
                    busy[doer] = now + 2
                if kind == "lift":
                    aloft.add(doer)
                elif kind == "land":
                    at = where[doer]
                    if doer not in aloft or at is None or not walked(at):
                        raise LevelError(
                            f"{here}: {doer} lands where no one stands, or is not flying"
                        )
                    aloft.discard(doer)
                elif kind == "appear":
                    if not free(value, doer):
                        raise LevelError(f"{here}: {doer} appears on a tile not free")
                    where[doer] = value
                    # Who comes into sight comes on its feet (D279).
                    seated.discard(doer)
                    first_seen.setdefault(doer, value)
                elif kind == "wake":
                    if doer not in asleep:
                        raise LevelError(f"{here}: {doer} is not asleep")
                    del asleep[doer]
                elif doer in asleep:
                    raise LevelError(f"{here}: {doer} is asleep")
                elif kind == "sleep":
                    lie_down(doer, value, here)
                elif kind == "stand":
                    if doer not in seated:
                        raise LevelError(f"{here}: {doer} stands up, and is not seated")
                    seated.discard(doer)
                elif kind == "sit":
                    seated.add(doer)
                elif kind == "show":
                    if value in shown:
                        raise LevelError(f"{here}: {value} is in sight already")
                    shown.add(value)
                elif kind == "vanish":
                    where[doer] = None
                elif kind == "move":
                    if doer in seated:
                        raise LevelError(f"{here}: {doer} is seated, and stands before walking")
                    if not free(value, doer):
                        raise LevelError(
                            f"{here}: {doer}'s walk is stopped at {value.x},{value.y}"
                        )
                    where[doer] = value
                elif kind in ("open", "close"):
                    if not any(beside(doer, cell) for cell in doors[value]):
                        raise LevelError(f"{here}: {doer} stands beside no {value}")
                    if (value in opened) == (kind == "open"):
                        state = "open" if kind == "open" else "shut"
                        raise LevelError(f"{here}: {value} is {state} already")
                    if kind == "open":
                        opened.add(value)
                        shut.difference_update(doors[value])
                        shove(value, queues, here)
                    else:
                        if any(at in doors[value] for at in where.values()):
                            raise LevelError(f"{here}: someone stands in {value}'s doorway")
                        opened.discard(value)
                        shut.update(doors[value])
        if vanishing:
            where[who] = None
        if who != "voice" and who in where and where[who] is None and not vanishing:
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


#: What a step that changes the story's scene gives of the new one (a story's own
#: staging, for the steps from it on), and whether it opens after time has passed, the
#: scene gone dark and back (`later`, D280).
PART_STAGING = ("scene", "wizard", "actors", "things", "camera", "light", "flying", "later")


def story_on_scenes(
    data: dict[str, Any], scene_of: Any, sitters: frozenset[str] = frozenset()
) -> dict[str, Any]:
    """A story told on one scene, or on several in turn (the morning after, from the
    dormitory to the shed): a step with a `scene`, the new scene's staging, starts a
    part of the story told there, each part checked on its scene as a story is
    (story_on_scene), its figures where the staging puts them. The story made whole
    is the first part's, with every step, and `parts`, each later part's first step
    and the world, camera and light it is told in, and whether time passes before it
    (`later`, D280). `scene_of` gives a scene by id;
    `sitters`, the figures whose sheets have the sitting rows (D273, D279)."""
    story_id = data.get("id")
    steps = data.get("steps")
    if not isinstance(steps, list) or not steps:
        raise LevelError(f"{story_id}: a story has its steps")
    # Time passes only where a step's scene says so (D280).
    if "later" in data or any(isinstance(step, dict) and "later" in step for step in steps):
        raise LevelError(f"{story_id}: later is said in a step's scene")
    starts = [0] + [
        index for index, step in enumerate(steps) if isinstance(step, dict) and "scene" in step
    ]
    if starts[1:2] == [0]:
        raise LevelError(f"{story_id}: the first step is told on the story's own scene")
    parts = []
    for number, first in enumerate(starts):
        end = starts[number + 1] if number + 1 < len(starts) else len(steps)
        own = [{k: v for k, v in step.items() if k != "scene"} for step in steps[first:end]]
        if number == 0:
            staging = {k: v for k, v in data.items() if k != "steps"}
        else:
            staging = steps[first]["scene"]
            if not isinstance(staging, dict) or set(staging) - set(PART_STAGING):
                raise LevelError(
                    f"{story_id}, step {first + 1}: a scene's staging is one of "
                    f"{', '.join(PART_STAGING)}"
                )
            if staging.get("later", True) is not True:
                raise LevelError(f"{story_id}, step {first + 1}: later is true, or not given")
            staging = {"id": story_id, **staging}
        built = story_on_scene({**staging, "steps": own}, scene_of(staging.get("scene")), sitters)
        parts.append((first, built))
    story = dict(parts[0][1])
    story["steps"] = [{k: v for k, v in step.items() if k != "scene"} for step in steps]
    if len(parts) > 1:
        story["parts"] = [
            {
                "step": first,
                "scene": steps[first]["scene"]["scene"],
                "world": built["world"],
                "camera": built["camera"],
                **({"light": built["light"]} if "light" in built else {}),
                **({"flying": built["flying"]} if "flying" in built else {}),
                **({"later": True} if built.get("later") is True else {}),
            }
            for first, built in parts[1:]
        ]
    return story
