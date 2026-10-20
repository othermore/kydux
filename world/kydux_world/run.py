"""Running a child's code: what the browser's worker calls, and what the tests call.

The code is compiled under the file name CHILD, so that its lines can be told
from the world's in a traceback; what it prints is captured; and whatever
happens, a result comes back as a plain dict the worker sends as JSON.
"""

import contextlib
import io
import json
import time
import traceback
from dataclasses import asdict, dataclass, field
from typing import Any, Literal

from .goals import GoalResult
from .level import Level
from .world import CHILD, Event, TooManyTicks, World


@dataclass
class ErrorInfo:
    type: str
    message: str
    line: int | None


def child_line(error: BaseException) -> int | None:
    """The innermost line of the child's code in the error's traceback."""
    if isinstance(error, SyntaxError) and error.filename == CHILD:
        return error.lineno
    line = None
    for frame in traceback.extract_tb(error.__traceback__):
        if frame.filename == CHILD:
            line = frame.lineno
    return line


def error_info(error: BaseException) -> ErrorInfo:
    message = error.msg if isinstance(error, SyntaxError) else str(error)
    return ErrorInfo(type(error).__name__, message, child_line(error))


def run_script(code: str) -> dict:
    """Run `code` on its own, with nothing of a level: the playground's run."""
    stdout, stderr = io.StringIO(), io.StringIO()
    status, error = "ok", None
    started = time.perf_counter()
    try:
        compiled = compile(code, CHILD, "exec")
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(compiled, {"__name__": "__main__"})
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


Status = Literal["won", "incomplete", "error", "too_many_ticks", "interrupted"]


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
    """Run the child's code in `level`, with `wizard` theirs to command.

    The events recorded before an error, or before the tick limit, are kept,
    so that the scene can show the wizard walking up to the mistake.
    """
    world = World(level)
    stdout = io.StringIO()
    status: Status
    error = None
    try:
        compiled = compile(code, CHILD, "exec")
        with contextlib.redirect_stdout(stdout):
            exec(compiled, {"__name__": "__main__", "wizard": world.wizard})
    except SyntaxError as caught:
        status, error = "error", error_info(caught)
    except TooManyTicks:
        status = "too_many_ticks"
    except KeyboardInterrupt:
        status = "interrupted"
    except BaseException as caught:  # the child's code may raise anything, exit() too
        status, error = "error", error_info(caught)
    else:
        status = "won" if len(world.met_at) == len(world.goals) else "incomplete"
    goals = [
        GoalResult(spec.kind, dict(spec.params), index in world.met_at, world.met_at.get(index))
        for index, spec in enumerate(level.goals)
    ]
    return RunResult(status, list(world.events), goals, world.tick, stdout.getvalue(), error)


def run_level_json(level_json: str, code: str) -> str:
    """The worker's call: a level as JSON and the child's code, the result as JSON."""
    return json.dumps(run_code(Level.from_json(level_json), code).to_dict())
