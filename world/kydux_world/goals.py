"""What a level asks of the wizard, each goal checked after every tick.

A goal is a class made from its spec and the level, with `check(world)`,
true once the goal is met, and optionally `failed(world)`, true once it can
no longer be met. The world remembers the first tick each was met or failed
at. A bonus goal (`"bonus": true`) is not needed to win.

The kinds: reach (the run ends with the wizard on a marker's tile, or on
one at x and y; passing over it on the way does not count, unless the goal says
`"on_the_way": true`, for a level whose ways end in different cells), collect (a thing by
id, or any `of` a kind: `{"kind": "collect", "of": "key"}`), open (a door),
say (a text, word for word, or the number of things of a kind in the way played:
`{"kind": "say", "count_of": "broom"}`, D184, those hung or not with `"hung": true` or
`false`, D205), give (a thing by id, to an actor by
id), cast (a spell cast, not a word refused: `{"kind": "cast", "spell": "osto"}`,
D176), land (the wizard's own drevo sets the broom down on a marker's tile or on one
at x and y, D215; the broom's setting down at the program's end does not count), no_bumps
(the wizard bumps into nothing; failed at the first bump), untied (no broom knotted,
or none of those named in `ids` or of a `zone`; failed at the run's end with one
still knotted, D183, D202), no_error (the run ends
without an error, nor the world refusing the program; failed at the first),
through_in_order (the rings named, flown through in that order: `{"kind":
"through_in_order", "ids": ["ring_1", ...]}`, D187), before (the wizard crosses a
race's finish at a tick lower than the racer's: `{"kind": "before", "racer":
"zarek"}`, D189),
not_seen_by (an actor; failed when it catches the wizard), ticks_under (the
run ends in fewer ticks than that, so that the shorter of two winning programs
earns it, D133), and three read from the code before the run: lines_under
(fewer lines than that, not counting blank lines and comments), numbers_under
(fewer numbers written in it than that, so that a value is named once, as a
variable) and uses (the code names an action or an attribute: `{"kind":
"uses", "member": "locked"}`).
A level may add its own in a goals.py beside its level.json, which says so
with `"own_goals": true`: a module whose `GOALS` maps each kind to its class,
in the same shape as these.
"""

import ast
import sys
import types
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol

from .level import KNOWN_SPELLS, GoalSpec, Level, LevelError, Position

if TYPE_CHECKING:
    from .world import World


class Goal(Protocol):
    def check(self, world: "World") -> bool: ...


@dataclass
class GoalResult:
    kind: str
    params: dict[str, Any] = field(default_factory=dict)
    met: bool = False
    met_at_tick: int | None = None
    failed: bool = False
    failed_at_tick: int | None = None
    bonus: bool = False
    #: A reach goal not met that the wizard walked over on the way.
    walked_over: bool = False

    @staticmethod
    def shown(goal: "Goal", spec: GoalSpec, world: "World") -> dict[str, Any]:
        """A goal's params for the page: its spec's, and what the goal adds from the
        run (its `shown`): the rings missed, a race's count."""
        more = getattr(goal, "shown", None)
        return {**spec.params, **(more(world) if more is not None else {})}

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "params": self.params,
            "met": self.met,
            "met_at_tick": self.met_at_tick,
            "failed": self.failed,
            "failed_at_tick": self.failed_at_tick,
            "bonus": self.bonus,
            "walked_over": self.walked_over,
        }


def _thing_id(spec: GoalSpec, level: Level, kinds: tuple[str, ...] | None = None) -> str:
    thing_id = spec.params.get("id")
    things = {t.id: t for t in level.things}
    if thing_id not in things or (kinds is not None and things[thing_id].kind not in kinds):
        raise LevelError(f"{level.id}: the {spec.kind} goal names {thing_id}, no such thing")
    return thing_id


class ReachGoal:
    """Met when the run ends with the wizard on a tile, a marker's or one given by x
    and y: a goal is stopped at, and walking over it on the way does not count; unless
    it says `on_the_way`, when standing on it at any tick does."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        if "marker" in spec.params:
            self.target = level.markers[spec.params["marker"]]
        elif "at" in spec.params:
            x, y = spec.params["at"]
            self.target = Position(int(x), int(y))
            if not level.inside(self.target):
                raise LevelError(f"{level.id}: the reach goal's tile is off the map")
        else:
            raise LevelError(f"{level.id}: a reach goal needs a marker or at")
        #: Whether the wizard has stood on the tile before the run's end.
        self.walked_over = False
        self.on_the_way = bool(spec.params.get("on_the_way"))

    def check(self, world: "World") -> bool:
        here = world.wizard.position == self.target
        if self.on_the_way:
            return here
        if here and not world.finished:
            self.walked_over = True
        return world.finished and here


class CollectGoal:
    """Met once the wizard carries a thing: one by its id, or any `of` a kind."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        if "id" in spec.params:
            self.id: str | None = _thing_id(spec, level)
            self.kind: str | None = None
        elif isinstance(spec.params.get("of"), str):
            self.id, self.kind = None, spec.params["of"]
        else:
            raise LevelError(f"{level.id}: a collect goal needs an id, or `of` a kind")

    def check(self, world: "World") -> bool:
        carried = world.carried()
        if self.id is not None:
            return any(t.name == self.id for t in carried)
        return any(t.kind == self.kind for t in carried)


class OpenGoal:
    """Met once a door is open."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        self.id = _thing_id(spec, level, ("door",))

    def check(self, world: "World") -> bool:
        return bool(world.things[self.id].is_open)


class SayGoal:
    """Met once the wizard has said a text, word for word; or, with `count_of`, the
    number of things of a kind the way played has (D184): with `"hung": false` only those
    not hung, with `true` only the hung ones, without it every one (D205)."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        text = spec.params.get("text")
        kind = spec.params.get("count_of")
        hung = spec.params.get("hung")
        if hung is not None and (not isinstance(hung, bool) or kind is None):
            raise LevelError(f"{level.id}: a say goal's hung is true or false, with count_of")
        if isinstance(kind, str) and text is None:
            text = str(
                sum(
                    1
                    for thing in level.things
                    if thing.kind == kind and (hung is None or thing.hung == hung)
                )
            )
        if not isinstance(text, str):
            raise LevelError(f"{level.id}: a say goal needs a text, or count_of a kind")
        self.text = text

    def check(self, world: "World") -> bool:
        return any(
            e.actor == "wizard" and e.kind == "say" and e.data.get("text") == self.text
            for e in world.events
        )


class UntiedGoal:
    """Met once no broom it counts is knotted; failed at the run's end when one still is
    (D183): `{"kind": "untied"}` counts every broom of the level,
    `{"kind": "untied", "ids": ["broom_0"]}` the brooms named, and
    `{"kind": "untied", "zone": "wall"}` the brooms of a zone in the way played (D202)."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        brooms = {thing.id for thing in level.things if thing.kind == "broom"}
        if not brooms:
            raise LevelError(f"{level.id}: an untied goal needs a broom")
        ids, zone = spec.params.get("ids"), spec.params.get("zone")
        if ids is not None and zone is not None:
            raise LevelError(f"{level.id}: an untied goal counts by ids or by zone, not both")
        if ids is not None and (
            not isinstance(ids, list) or not ids or not all(i in brooms for i in ids)
        ):
            raise LevelError(f"{level.id}: an untied goal's ids name brooms of the level")
        if zone is not None:
            if zone not in level.zones:
                raise LevelError(f"{level.id}: an untied goal's zone {zone} is not the level's")
            ids = [t.id for t in level.things if t.kind == "broom" and t.zone == zone]
            if not ids:
                raise LevelError(f"{level.id}: an untied goal's zone {zone} has no broom")
        self.ids = set(ids) if ids is not None else None

    def check(self, world: "World") -> bool:
        return not self._knotted(world)

    def failed(self, world: "World") -> bool:
        return world.finished and self._knotted(world)

    def _knotted(self, world: "World") -> bool:
        return any(
            getattr(thing, "_k_knotted", False)
            for name, thing in world.things.items()
            if self.ids is None or name in self.ids
        )


class NoErrorGoal:
    """Met at the end of a run with no error in it; failed at the first, an error of the
    child's code or the world refusing what it asked, untying a broom with no knot:
    `{"kind": "no_error"}` (D183)."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        pass

    def check(self, world: "World") -> bool:
        return world.finished and world.error is None

    def failed(self, world: "World") -> bool:
        return world.error is not None


class ThroughInOrderGoal:
    """Met once every ring named is flown through, each after the one before it in the
    list (D187); the page is shown the rings missed: passed over, flown through out of
    their turn, or not flown through by the run's end. Failed at the run's end."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        ids = spec.params.get("ids")
        rings = {thing.id for thing in level.things if thing.kind == "ring"}
        if not isinstance(ids, list) or not ids or not all(ring in rings for ring in ids):
            raise LevelError(f"{level.id}: a through_in_order goal names rings of the level")
        if len(set(ids)) != len(ids):
            raise LevelError(f"{level.id}: a through_in_order goal names a ring twice")
        self.ids = ids

    def check(self, world: "World") -> bool:
        return not world.missed()

    def failed(self, world: "World") -> bool:
        return world.finished and bool(world.missed())

    def shown(self, world: "World") -> dict[str, Any]:
        return {"missed": world.missed()}


class BeforeGoal:
    """Met when the wizard crosses the race's finish at a tick lower than the racer's
    (D189); at the same tick it is a tie, not met, and the race is flown again (D220):
    `{"kind": "before", "racer": "zarek"}`. The page is shown Ilda's count: the lines
    read, the flight, the ticks served for the rings missed, the tick crossed at, the
    racer's lines and tick, and whether it is a tie."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        race = level.race
        if race is None or spec.params.get("racer") != race.against:
            raise LevelError(f"{level.id}: a before goal names the racer of the level's race")
        self.race = race

    def check(self, world: "World") -> bool:
        return world.crossed_at is not None and world.crossed_at < self.race.tick

    def failed(self, world: "World") -> bool:
        if world.crossed_at is not None:
            return world.crossed_at >= self.race.tick
        return world.tick >= self.race.tick or world.finished

    def shown(self, world: "World") -> dict[str, Any]:
        tick = world.crossed_at
        flight = None if tick is None else tick - world.read_lines - world.penalty
        return {
            "lines": world.read_lines,
            "flight": flight,
            "penalty": world.penalty,
            "tick": tick,
            "racer_lines": self.race.lines,
            "racer_tick": self.race.tick,
            "tie": tick == self.race.tick,
        }


class NotSeenByGoal:
    """Met at the end of a run the actor did not catch the wizard in; failed when it did."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        actor_id = spec.params.get("id")
        if actor_id not in {a.id for a in level.actors}:
            raise LevelError(f"{level.id}: the not_seen_by goal names {actor_id}, no actor")
        self.id = actor_id

    def check(self, world: "World") -> bool:
        # Met only once the run is over and the actor never caught the wizard:
        # until then, it might.
        return world.finished and world.caught_by is None

    def failed(self, world: "World") -> bool:
        return world.caught_by == self.id


class NoBumpsGoal:
    """Met at the end of a run in which the wizard bumped into nothing; failed at the
    first bump: what an improve level asks (D56)."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        pass

    def check(self, world: "World") -> bool:
        return world.finished and not self.failed(world)

    def failed(self, world: "World") -> bool:
        return any(e.actor == "wizard" and e.kind == "bump" for e in world.events)


def code_lines(code: str) -> int:
    """How many lines of the child's code do something: not blank, not only a comment."""
    return sum(
        1 for line in code.splitlines() if line.strip() and not line.strip().startswith("#")
    )


class TicksUnderGoal:
    """Met once the run has ended in fewer ticks than a count: `{"kind": "ticks_under",
    "count": 8}` gives a bonus to the shorter of two programs that both win (D133)."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        count = spec.params.get("count")
        if isinstance(count, bool) or not isinstance(count, int) or count < 1:
            raise LevelError(f"{level.id}: a ticks_under goal needs a whole number of ticks")
        self.count = count

    def check(self, world: "World") -> bool:
        # Judged only once the run is over, never failed on the way: a goal failed
        # loses the run (World.won), and a longer program still wins.
        return world.finished and world.tick < self.count


class LinesUnderGoal:
    """Met, before the run starts, when the code has fewer lines than a number."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        lines = spec.params.get("lines")
        if isinstance(lines, bool) or not isinstance(lines, int) or lines < 1:
            raise LevelError(f"{level.id}: a lines_under goal needs a whole number of lines")
        self.lines = lines

    def check(self, world: "World") -> bool:
        return code_lines(world.code) < self.lines


def _code_tree(code: str) -> ast.AST | None:
    try:
        return ast.parse(code)
    except SyntaxError:
        return None


class NumbersUnderGoal:
    """Met, before the run starts, when the code writes fewer numbers than a count:
    `{"kind": "numbers_under", "count": 2}` asks for a value written once."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        count = spec.params.get("count")
        if isinstance(count, bool) or not isinstance(count, int) or count < 1:
            raise LevelError(f"{level.id}: a numbers_under goal needs a whole count")
        self.count = count

    def check(self, world: "World") -> bool:
        tree = _code_tree(world.code)
        if tree is None:
            return False
        numbers = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Constant)
            and isinstance(node.value, int | float)
            and not isinstance(node.value, bool)
        ]
        return len(numbers) < self.count


#: The words of Python a uses goal may name, by the kind of statement each makes.
KEYWORDS = {"for": ast.For, "while": ast.While, "if": ast.If, "def": ast.FunctionDef}


class UsesGoal:
    """Met, before the run starts, when the code names a member of an object, an
    action or an attribute: `{"kind": "uses", "member": "find_nearest"}`; a function of
    Python's, called (`print`); or a word of Python's, `for`, `while`, `if`, `def`."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        member = spec.params.get("member")
        if not isinstance(member, str) or not (member.isidentifier() or member in KEYWORDS):
            raise LevelError(f"{level.id}: a uses goal names a member")
        self.member = member

    def check(self, world: "World") -> bool:
        tree = _code_tree(world.code)
        if tree is None:
            return False
        if self.member in KEYWORDS:
            return any(isinstance(node, KEYWORDS[self.member]) for node in ast.walk(tree))
        return any(
            (isinstance(node, ast.Attribute) and node.attr == self.member)
            or (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == self.member
            )
            for node in ast.walk(tree)
        )


class CastGoal:
    """Met once the wizard has cast a spell, at the tick of its `cast` event (D176):
    `{"kind": "cast", "spell": "orvim"}`. A spell refused, unknown or cast where it
    can do nothing is a `blocked` event, and meets nothing."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        spell = spec.params.get("spell")
        if spell not in KNOWN_SPELLS:
            raise LevelError(f"{level.id}: the cast goal names {spell}, no spell")
        self.spell = spell
        if "from" in spec.params:
            raise LevelError(f"{level.id}: the cast goal names no cells (D215)")

    def check(self, world: "World") -> bool:
        return any(
            e.actor == "wizard" and e.kind == "cast" and e.data.get("spell") == self.spell
            for e in world.events
        )


class LandGoal:
    """Met at the tick the wizard's own drevo sets the broom down on a tile, a marker's
    or one at x and y (D215): `{"kind": "land", "marker": "E"}`. The broom's setting
    down by itself at the program's end meets nothing."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        if "marker" in spec.params:
            self.target = level.markers[spec.params["marker"]]
        elif "at" in spec.params:
            x, y = spec.params["at"]
            self.target = Position(int(x), int(y))
            if not level.inside(self.target):
                raise LevelError(f"{level.id}: the land goal's tile is off the map")
        else:
            raise LevelError(f"{level.id}: a land goal needs a marker or at")

    def check(self, world: "World") -> bool:
        return any(
            e.kind == "land"
            and e.data.get("cast") is True
            and e.data.get("at") == list(self.target)
            for e in world.events
        )


class GiveGoal:
    """Met once the wizard has given a thing to an actor (D48):
    `{"kind": "give", "id": "book", "to": "eldra"}`."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        self.id = _thing_id(spec, level)
        self.to = spec.params.get("to")
        if self.to not in {a.id for a in level.actors}:
            raise LevelError(f"{level.id}: the give goal gives to {self.to}, no actor")

    def check(self, world: "World") -> bool:
        return world.things[self.id]._k_given == self.to


class SleepGoal:
    """Met once the wizard sleeps in a bed (D84): `{"kind": "sleep", "bed": "bed_2"}`;
    with `at`, the cell to sleep from, which the page marks (D130): a floor cell
    beside the bed. The wizard sleeps in it from any cell beside it all the same."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        self.bed = spec.params.get("bed")
        beds = {t.id: t for t in level.things if t.kind == "bed"}
        if self.bed not in beds:
            raise LevelError(f"{level.id}: the sleep goal names {self.bed}, no bed")
        at = spec.params.get("at")
        if at is None:
            return
        if not (
            isinstance(at, list)
            and len(at) == 2
            and all(isinstance(v, int) and not isinstance(v, bool) for v in at)
        ):
            raise LevelError(f"{level.id}: the sleep goal's at is [x, y]")
        cell, bed = Position(*at), beds[self.bed].position
        if not level.free(cell) or abs(cell.x - bed.x) + abs(cell.y - bed.y) != 1:
            raise LevelError(f"{level.id}: the sleep goal's at is no floor cell beside {self.bed}")

    def check(self, world: "World") -> bool:
        return world.slept == self.bed


GOALS: dict[str, type] = {
    "reach": ReachGoal,
    "collect": CollectGoal,
    "open": OpenGoal,
    "say": SayGoal,
    "give": GiveGoal,
    "cast": CastGoal,
    "land": LandGoal,
    "sleep": SleepGoal,
    "no_bumps": NoBumpsGoal,
    "untied": UntiedGoal,
    "no_error": NoErrorGoal,
    "through_in_order": ThroughInOrderGoal,
    "before": BeforeGoal,
    "not_seen_by": NotSeenByGoal,
    "lines_under": LinesUnderGoal,
    "ticks_under": TicksUnderGoal,
    "numbers_under": NumbersUnderGoal,
    "uses": UsesGoal,
}

_own_goals: dict[tuple[str, str], dict[str, type]] = {}


def module_name(level_id: str) -> str:
    """The name a level's own goals module goes by: kydux_world.levels.level_01_x."""
    return f"kydux_world.levels.level_{level_id.replace('-', '_')}"


def own_goals(level: Level) -> dict[str, type]:
    """The goals a level's goals.py adds, made once for each level and source."""
    if level.goals_source is None:
        return {}
    key = (level.id, level.goals_source)
    if key not in _own_goals:
        module = types.ModuleType(module_name(level.id))
        module.__file__ = f"content/levels/{level.id}/goals.py"
        code = compile(level.goals_source, module.__file__, "exec")
        sys.modules[module.__name__] = module
        exec(code, module.__dict__)
        goals = getattr(module, "GOALS", None)
        if not isinstance(goals, dict):
            raise LevelError(f"{level.id}: goals.py has no GOALS")
        _own_goals[key] = dict(goals)
    return _own_goals[key]


def make_goal(spec: GoalSpec, level: Level) -> Goal:
    kind = own_goals(level).get(spec.kind) or GOALS.get(spec.kind)
    if kind is None:
        raise LevelError(f"{level.id}: there is no goal of kind {spec.kind}")
    return kind(spec, level)
