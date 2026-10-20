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
from dataclasses import asdict, dataclass

CHILD = "<child>"


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
