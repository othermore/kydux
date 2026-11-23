"""Running a child's code: what the browser's worker calls, and what the tests call.

The code is compiled under the file name CHILD, so that its lines can be told
from the world's in a traceback; what it prints is captured; and whatever
happens, a result comes back as a plain dict the worker sends as JSON.
"""

import ast
import contextlib
import io
import json
import time
import traceback
from dataclasses import asdict, dataclass, field, replace
from typing import Any, Literal

from .explain import NotCalled, check_called, explain, index_explanation
from .goals import GoalResult
from .level import Level
from .sandbox import child_builtins
from .world import CHILD, Caught, Event, Refused, TooManyTicks, World


@dataclass
class ErrorInfo:
    type: str
    message: str
    line: int | None
    #: What it means, in the kind and parameters the page says in the child's words.
    explanation: dict[str, Any] | None = None


def child_line(error: BaseException) -> int | None:
    """The innermost line of the child's code in the error's traceback."""
    if isinstance(error, NotCalled):
        return error.line
    if isinstance(error, Refused) and isinstance(error.detail.get("line"), int):
        # What the first year does not allow, at the line that asks it (D261).
        return error.detail["line"]
    if isinstance(error, SyntaxError) and error.filename == CHILD:
        return error.lineno
    line = None
    for frame in traceback.extract_tb(error.__traceback__):
        if frame.filename == CHILD:
            line = frame.lineno
    return line


def python_name(error: BaseException) -> str:
    """The name of the error as Python has it: the world's own errors are told by
    the built-in error they are (ReadOnly is an AttributeError)."""
    for kind in type(error).__mro__:
        if kind.__module__ == "builtins":
            return kind.__name__
    return type(error).__name__


def error_info(
    error: BaseException, level: Level | None = None, code: str | None = None
) -> ErrorInfo:
    """An error as the page shows it: Python's own words and their explanation in the
    child's; a run with no level, a lesson's, explains an index past a list's end
    only (D198)."""
    message = error.msg if isinstance(error, SyntaxError) else str(error)
    if level is not None:
        explanation = explain(error, level, code).to_dict()
    elif isinstance(error, IndexError):
        explanation = index_explanation(error, code).to_dict()
    else:
        explanation = None
    return ErrorInfo(python_name(error), message, child_line(error), explanation)


class WorldError(Exception):
    """A run whose events do not add up: the world was changed by other means than actions."""


def check_consistency(world: World) -> None:
    """The run's events hold together: one acting event for each tick, the wizard's, a
    familiar's or the world's own after the program (D270), a walked step that lasts
    several ticks (D225) taking them all; the wizard's steps one after the other from
    the start to where it stands, and each familiar's from where it came into sight;
    and every goal's tick a tick of the run. Raises WorldError when they do not (D20)."""
    taken = sorted(tick for first, count in world.acts for tick in range(first, first + count))
    if taken != list(range(1, world.tick + 1)):
        raise WorldError("the wizard's ticks do not follow one another")
    _familiars_follow_on(world)
    here = list(world.level.start)
    for event in world.events:
        # A door's leaf, opening, moves the wizard aside (D125).
        if event.kind == "shoved" and event.data["id"] == "wizard":
            if event.data["from"] != here:
                raise WorldError(f"the wizard is not where it was at tick {event.tick}")
            here = event.data["to"]
            continue
        if event.actor != "wizard":
            continue
        if event.kind == "move":
            there = event.data["to"]
            if (
                event.data["from"] != here
                or abs(there[0] - here[0]) + abs(there[1] - here[1]) != 1
            ):
                raise WorldError(f"the wizard's step at tick {event.tick} does not follow on")
            here = there
        elif event.kind in ("bump", "wait") and event.data["at"] != here:
            raise WorldError(f"the wizard is not where it was at tick {event.tick}")
    if list(world.wizard.position) != here:
        raise WorldError("the wizard is not where its steps took it")
    for tick in [*world.met_at.values(), *world.failed_at.values()]:
        if not 0 <= tick <= world.tick:
            raise WorldError("a goal was met at a tick the run does not have")


def _familiars_follow_on(world: World) -> None:
    """Each familiar of the child's walks from where it came into sight, a cell a step,
    and ends where its steps took it (D270)."""
    figures = world.made
    where: dict[str, list[int] | None] = {}
    block = world.familiar_block
    if world.living is not None and block is not None and block.living is not None:
        where["familiar"] = list(block.living.at)
    for event in world.events:
        name = event.actor
        if name not in figures:
            continue
        if event.kind == "trial":
            where[name] = event.data["at"]
        elif event.kind == "move":
            here, there = where.get(name), event.data["to"]
            if (
                event.data["from"] != here
                or here is None
                or abs(there[0] - here[0]) + abs(there[1] - here[1]) != 1
            ):
                raise WorldError(f"{name}'s step at tick {event.tick} does not follow on")
            where[name] = there
        elif event.kind in ("bump", "held") and not event.data.get("footprint"):
            if event.data["at"] != where.get(name):
                raise WorldError(f"{name} is not where it was at tick {event.tick}")
    for name, figure in figures.items():
        if figure._k_state in ("trial", "living") and name in where:
            if list(figure._k_cell) != where[name]:
                raise WorldError(f"{name} is not where its steps took it")


def run_script(code: str) -> dict:
    """Run `code` on its own, with nothing of a level: the playground's run."""
    stdout, stderr = io.StringIO(), io.StringIO()
    status, error = "ok", None
    started = time.perf_counter()
    try:
        compiled = compile(code, CHILD, "exec")
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(compiled, {"__name__": "__main__", "__builtins__": child_builtins()})
    except KeyboardInterrupt:
        status = "interrupted"
    except BaseException as caught:  # the child's code may raise anything, exit() too
        status, error = "error", error_info(caught, code=code)
    return {
        "status": status,
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "error": asdict(error) if error else None,
        "durationMs": round((time.perf_counter() - started) * 1000, 1),
    }


def run_script_json(code: str) -> str:
    return json.dumps(run_script(code))


Status = Literal["won", "incomplete", "error", "too_many_ticks", "interrupted", "caught"]


@dataclass
class RunResult:
    """What happened when the child's code ran in a level. For a level played in
    several ways (D51), `ways` holds each way's own result, by its id, and the rest
    is the way shown: the first not won, or the first; `status` is won only when
    every way is."""

    status: Status
    events: list[Event] = field(default_factory=list)
    goals: list[GoalResult] = field(default_factory=list)
    ticks: int = 0
    stdout: str = ""
    error: ErrorInfo | None = None
    #: The id of the way shown, or None for a level played one way.
    way: str | None = None
    ways: list[tuple[str, "RunResult"]] = field(default_factory=list)
    #: In a level with a familiar, what the page keeps of it (D265); in the birth level,
    #: whether the rehearsal passed (D268).
    familiar: dict[str, Any] | None = None
    passes: bool | None = None

    def to_dict(self) -> dict[str, Any]:
        found: dict[str, Any] = {
            "status": self.status,
            "events": [event.to_dict() for event in self.events],
            "goals": [goal.to_dict() for goal in self.goals],
            "ticks": self.ticks,
            "stdout": self.stdout,
            "error": asdict(self.error) if self.error else None,
        }
        if self.ways:
            found["way"] = self.way
            found["ways"] = [{"id": way_id, **result.to_dict()} for way_id, result in self.ways]
        if self.familiar is not None:
            found["familiar"] = self.familiar
        if self.passes is not None:
            found["passes"] = self.passes
        return found


def run_code(level: Level, code: str) -> RunResult:
    """Run the child's code in `level`, with the wizard and the level's things theirs;
    in each of its ways, one world each, when it has ways (D51).

    The events recorded before an error, or before the run ended early, are
    kept, so that the scene can show the wizard walking up to the mistake.
    """
    if not level.ways:
        return _run_one(level, code)
    results = [(way_id, _run_one(way, code)) for way_id, way in level.ways]
    shown_id, shown = next(
        ((way_id, result) for way_id, result in results if result.status != "won"), results[0]
    )
    status: Status = "won" if all(r.status == "won" for _, r in results) else shown.status
    return replace(shown, status=status, way=shown_id, ways=results)


def _run_one(level: Level, code: str) -> RunResult:
    """One way's run; in the birth level, the program rehearsed first and then shown, as
    the rehearsal's verdict plays it (D268)."""
    block = level.familiar
    if block is None or block.stage != "birth":
        return _run_world(level, code)
    rehearsal = _run_world(level, code, "rehearsal")
    passes = rehearsal.status == "won" and block.living is None
    shown = _run_world(level, code, "passing" if passes else "holding")
    if block.living is not None:
        # A familiar lives already: the run is played as held, and is the practice the
        # rehearsal was (D268).
        shown = replace(shown, status=rehearsal.status, goals=rehearsal.goals)
    return replace(shown, passes=passes)


def _run_world(level: Level, code: str, verdict: str = "rehearsal") -> RunResult:
    world = World(level, code)
    world.verdict = verdict
    stdout = io.StringIO()
    status: Status
    error = None
    try:
        compiled = compile(code, CHILD, "exec")
        world.prepare()
        check_called(compile(code, CHILD, "exec", flags=ast.PyCF_ONLY_AST), world.namespace())
        world.begin()
        with contextlib.redirect_stdout(stdout):
            namespace = {"__name__": "__main__", "__builtins__": child_builtins()}
            exec(compiled, {**namespace, **world.namespace()})
    except (SyntaxError, NotCalled) as caught:
        status, error = "error", error_info(caught, level, code)
    except TooManyTicks:
        status = "too_many_ticks"
    except Caught:
        status = "caught"
    except KeyboardInterrupt:
        status = "interrupted"
    except BaseException as caught:  # the child's code may raise anything, exit() too
        status, error = "error", error_info(caught, level, code)
    else:
        status = "incomplete"
    if world.over is not None and status in ("incomplete", "error"):
        # The child's code caught the end of the run and went on: the end stands.
        status = "caught" if isinstance(world.over, Caught) else "too_many_ticks"
        error = None
    if error is not None and world.error is None:
        world.error = error.type
    with contextlib.redirect_stdout(stdout):
        world.finish(ended=status == "incomplete")
    if world.after_error is not None:
        # The child's own class failed when the world used it (D267).
        status, error = "error", error_info(world.after_error, level, code)
    elif status == "incomplete" and world.over is not None and level.familiar is not None:
        # The world's own ticks after the program ran out (D267).
        status = "caught" if isinstance(world.over, Caught) else "too_many_ticks"
    if status == "incomplete" and world.won():
        status = "won"
    try:
        check_consistency(world)
    except WorldError as broken:
        status, error = "error", ErrorInfo("WorldError", str(broken), None)
    goals = [
        GoalResult(
            spec.kind,
            GoalResult.shown(world.goals[index], spec, world),
            index in world.met_at,
            world.met_at.get(index),
            index in world.failed_at,
            world.failed_at.get(index),
            spec.bonus,
            index not in world.met_at and getattr(world.goals[index], "walked_over", False),
        )
        for index, spec in enumerate(level.goals)
    ]
    return RunResult(
        status,
        list(world.events),
        goals,
        world.tick,
        stdout.getvalue(),
        error,
        familiar=world.familiar_result(),
    )


def run_level_json(level_json: str, code: str) -> str:
    """The worker's call: a level as JSON and the child's code, the result as JSON."""
    return json.dumps(run_code(Level.from_json(level_json), code).to_dict())
