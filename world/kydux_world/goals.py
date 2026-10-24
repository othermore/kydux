"""What a level asks of the wizard, each goal checked after every tick.

A goal is a class made from its spec and the level, with `check(world)`,
true once the goal is met, and optionally `failed(world)`, true once it can
no longer be met. The world remembers the first tick each was met or failed
at. A bonus goal (`"bonus": true`) is not needed to win.

The kinds: reach (the run ends with the wizard on a marker's tile, or on
one at x and y; passing over it on the way does not count), collect (a thing by
id, or any `of` a kind: `{"kind": "collect", "of": "key"}`), open (a door),
say (a text, word for word), give (a thing by id, to an actor by id), no_bumps
(the wizard bumps into nothing; failed at the first bump),
not_seen_by (an actor; failed when it catches the wizard), and three read
from the code before the run: lines_under (fewer lines than that, not
counting blank lines and comments), numbers_under (fewer numbers written in
it than that, so that a value is named once, as a variable) and uses (the
code names an action or an attribute: `{"kind": "uses", "member": "locked"}`).
A level may add its own in a goals.py beside its level.json, which says so
with `"own_goals": true`: a module whose `GOALS` maps each kind to its class,
in the same shape as these.
"""

import ast
import sys
import types
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol

from .level import GoalSpec, Level, LevelError, Position

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
    and y: a goal is stopped at, and walking over it on the way does not count."""

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

    def check(self, world: "World") -> bool:
        here = world.wizard.position == self.target
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
    """Met once the wizard has said a text, word for word."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        text = spec.params.get("text")
        if not isinstance(text, str):
            raise LevelError(f"{level.id}: a say goal needs a text")
        self.text = text

    def check(self, world: "World") -> bool:
        return any(
            e.actor == "wizard" and e.kind == "say" and e.data.get("text") == self.text
            for e in world.events
        )


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


class UsesGoal:
    """Met, before the run starts, when the code names a member of an object, an
    action or an attribute: `{"kind": "uses", "member": "find_nearest"}`."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        member = spec.params.get("member")
        if not isinstance(member, str) or not member.isidentifier():
            raise LevelError(f"{level.id}: a uses goal names a member")
        self.member = member

    def check(self, world: "World") -> bool:
        tree = _code_tree(world.code)
        return tree is not None and any(
            isinstance(node, ast.Attribute) and node.attr == self.member for node in ast.walk(tree)
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


GOALS: dict[str, type] = {
    "reach": ReachGoal,
    "collect": CollectGoal,
    "open": OpenGoal,
    "say": SayGoal,
    "give": GiveGoal,
    "no_bumps": NoBumpsGoal,
    "not_seen_by": NotSeenByGoal,
    "lines_under": LinesUnderGoal,
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
