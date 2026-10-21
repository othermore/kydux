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
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .explain import NotCalled, check_called, explain
from .goals import GoalResult
from .level import Level
from .sandbox import child_builtins
from .world import CHILD, Caught, Event, TooManyTicks, World


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


def error_info(error: BaseException, level: Level | None = None) -> ErrorInfo:
    message = error.msg if isinstance(error, SyntaxError) else str(error)
    explanation = explain(error, level).to_dict() if level is not None else None
    return ErrorInfo(python_name(error), message, child_line(error), explanation)


class WorldError(Exception):
    """A run whose events do not add up: the world was changed by other means than actions."""


def check_consistency(world: World) -> None:
    """The run's events hold together: every tick of the wizard's once, its steps one
    after the other from the start to where it stands, and every goal's tick a tick of
    the run. Raises WorldError when they do not (D20)."""
    own = [e for e in world.events if e.actor == "wizard"]
    if [e.tick for e in own] != list(range(1, world.tick + 1)):
        raise WorldError("the wizard's ticks do not follow one another")
    here = list(world.level.start)
    for event in own:
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
        status, error = "error", error_info(caught)
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
    """What happened when the child's code ran in a level."""

    status: Status
    events: list[Event] = field(default_factory=list)
    goals: list[GoalResult] = field(default_factory=list)
    ticks: int = 0
    stdout: str = ""
    error: ErrorInfo | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "events": [event.to_dict() for event in self.events],
            "goals": [goal.to_dict() for goal in self.goals],
            "ticks": self.ticks,
            "stdout": self.stdout,
            "error": asdict(self.error) if self.error else None,
        }


def run_code(level: Level, code: str) -> RunResult:
    """Run the child's code in `level`, with the wizard and the level's things theirs.

    The events recorded before an error, or before the run ended early, are
    kept, so that the scene can show the wizard walking up to the mistake.
    """
    world = World(level, code)
    stdout = io.StringIO()
    status: Status
    error = None
    try:
        compiled = compile(code, CHILD, "exec")
        check_called(compile(code, CHILD, "exec", flags=ast.PyCF_ONLY_AST), world.namespace())
        with contextlib.redirect_stdout(stdout):
            namespace = {"__name__": "__main__", "__builtins__": child_builtins()}
            exec(compiled, {**namespace, **world.namespace()})
    except (SyntaxError, NotCalled) as caught:
        status, error = "error", error_info(caught, level)
    except TooManyTicks:
        status = "too_many_ticks"
    except Caught:
        status = "caught"
    except KeyboardInterrupt:
        status = "interrupted"
    except BaseException as caught:  # the child's code may raise anything, exit() too
        status, error = "error", error_info(caught, level)
    else:
        status = "incomplete"
    if world.over is not None and status in ("incomplete", "error"):
        # The child's code caught the end of the run and went on: the end stands.
        status = "caught" if isinstance(world.over, Caught) else "too_many_ticks"
        error = None
    world.finish()
    if status == "incomplete" and world.won():
        status = "won"
    try:
        check_consistency(world)
    except WorldError as broken:
        status, error = "error", ErrorInfo("WorldError", str(broken), None)
    goals = [
        GoalResult(
            spec.kind,
            dict(spec.params),
            index in world.met_at,
            world.met_at.get(index),
            index in world.failed_at,
            world.failed_at.get(index),
            spec.bonus,
        )
        for index, spec in enumerate(level.goals)
    ]
    return RunResult(status, list(world.events), goals, world.tick, stdout.getvalue(), error)


def run_level_json(level_json: str, code: str) -> str:
    """The worker's call: a level as JSON and the child's code, the result as JSON."""
    return json.dumps(run_code(Level.from_json(level_json), code).to_dict())
