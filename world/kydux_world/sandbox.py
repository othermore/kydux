"""What keeps the child's code to the game: no reach into Pyodide's bridge to JavaScript.

The browser's sandbox is what contains the child's Python (architecture.md,
D14). Inside it, Pyodide's modules `js`, `pyodide` and the like are a bridge
to the page's JavaScript, with which the code could make requests or talk to
the page; nothing the game asks of the child needs them. This is a second
line behind the sandbox, not a wall: it refuses those modules to the child.

Two things do it, since an import looks in sys.modules before any finder:

- `install()`, called once by the worker after Python has loaded, puts a
  finder first on sys.meta_path that refuses the modules, and takes out of
  sys.modules those the child could otherwise import from there. The ones
  Pyodide's own machinery runs from (`_pyodide` and its parts) stay loaded.
- `child_builtins()` gives the child's code builtins whose `__import__`
  refuses the same names whether loaded or not, `_pyodide` included.

The refusal is the ModuleNotFoundError Python gives for any missing module.
"""

import builtins
import importlib.abc
import sys
from types import ModuleType
from typing import Any

#: The modules refused to the child's code, and everything under them.
BLOCKED = ("js", "pyodide", "pyodide_js", "_pyodide", "_pyodide_core", "micropip")
#: What Pyodide's own machinery runs from, so it stays in sys.modules.
KEPT_LOADED = ("_pyodide", "_pyodide_core")


def blocked(name: str) -> bool:
    return any(name == root or name.startswith(f"{root}.") for root in BLOCKED)


def refusal(name: str) -> ModuleNotFoundError:
    return ModuleNotFoundError(f"No module named '{name}'", name=name)


class Refuser(importlib.abc.MetaPathFinder):
    """Refuses to find the blocked modules, for whoever imports them."""

    def find_spec(self, fullname: str, path: Any, target: ModuleType | None = None) -> None:
        if blocked(fullname):
            raise refusal(fullname)
        return None


_installed = False


def install() -> None:
    """Refuse the blocked modules from now on; once, after Python has loaded."""
    global _installed
    if _installed:
        return
    for name in list(sys.modules):
        if blocked(name) and not any(
            name == root or name.startswith(f"{root}.") for root in KEPT_LOADED
        ):
            del sys.modules[name]
    sys.meta_path.insert(0, Refuser())
    _installed = True


def _guarded_import(
    name: str,
    globals: dict[str, Any] | None = None,
    locals: dict[str, Any] | None = None,
    fromlist: tuple[str, ...] = (),
    level: int = 0,
) -> ModuleType:
    if level == 0 and blocked(name):
        raise refusal(name)
    return builtins.__import__(name, globals, locals, fromlist, level)


def child_builtins() -> dict[str, Any]:
    """Python's builtins for the child's code, with the guarded import."""
    return {**vars(builtins), "__import__": _guarded_import}
