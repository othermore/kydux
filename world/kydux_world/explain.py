"""Errors in the child's words: what a Python exception means, as a kind and its parameters.

The world explains, and the page says it in the player's language through
its i18n files (architecture.md, D22): `explain` gives a kind, one key under
`error.` in i18n/<lang>.json, and the names and examples that go in it.
Suggestions come from the names the level teaches (its `api`) for an action,
and from `wizard` and the level's variables for a name; a first variable's mistakes,
a thing's method asked of the wizard and a search word written as a variable, are
answered in the child's words with no suggestion (D349). Python's own text stays in
the error beside the explanation, for an adult.
"""

import ast
import difflib
import inspect
import re
from dataclasses import dataclass, field
from typing import Any

from . import api
from .familiars import Familiar, NoAttribute, NoSuchMethod
from .goals import FINDS_KEPT, kept_finds
from .level import Level
from .things import Child, ReadOnly
from .world import CHILD, ActionArguments, Refused


@dataclass
class Explanation:
    kind: str
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"kind": self.kind, "params": self.params}


class NotCalled(Exception):
    """An action named without the brackets that do it: `wizard.move_right`."""

    def __init__(self, owner: str, action: str, example: str, line: int) -> None:
        super().__init__(f"{owner}.{action} is not called")
        self.owner, self.action, self.example, self.line = owner, action, example, line


def example(owner: Child | type, member: str) -> str:
    """The first example in backticks in a member's docstring, which shows it used."""
    found = getattr(owner if isinstance(owner, type) else type(owner), member, None)
    for text in re.findall(r"`([^`]+)`", getattr(found, "__doc__", None) or ""):
        if "(" in text:
            return text
    return f"{member}()"


def suggest(name: str, candidates: list[str]) -> str | None:
    close = difflib.get_close_matches(name, candidates, n=1, cutoff=0.6)
    return close[0] if close else None


def actions_of(owner: Child, level: Level) -> list[str]:
    """The members of an object the level teaches; every one of its role's when it lists none."""
    role = owner._k_role
    taught = api.members_taught(level.api, role)
    return taught or list(api.MEMBERS.get(role, ()))


def check_called(tree: ast.AST, namespace: dict[str, Child]) -> None:
    """Refuses a line that names an action and does not do it: `wizard.move_right`
    alone does nothing, which a child cannot tell from an action that failed."""
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Expr) and isinstance(node.value, ast.Attribute)):
            continue
        target = node.value.value
        if not (isinstance(target, ast.Name) and target.id in namespace):
            continue
        owner = namespace[target.id]
        member = getattr(type(owner), node.value.attr, None)
        if callable(member) and not isinstance(member, property):
            raise NotCalled(
                target.id, node.value.attr, example(owner, node.value.attr), node.lineno
            )


_CALL = re.compile(r"^(\w+)\.(\w+)\(\)")
_UNCLOSED = re.compile(r"'(.)' was never closed")


def index_explanation(error: IndexError, code: str | None) -> Explanation:
    """A list asked for an element it has not (D198): how many it has and which one was
    asked for, counted from 1, when the line asks for it by a name and a number;
    without them, that it has not so many."""
    asked = _asked_index(error, code)
    if asked is None:
        return Explanation("index_range_unknown")
    count, index = asked
    return Explanation("index_range", {"count": count, "asked": index + 1})


#: What an index or a list may be written as for the explanation to read it: names,
#: numbers, and sums and differences of them; nothing that does anything when read.
_PLAIN = (ast.Name, ast.Constant, ast.BinOp, ast.UnaryOp, ast.Add, ast.Sub, ast.USub, ast.Load)


def _asked_index(error: IndexError, code: str | None) -> tuple[int, int] | None:
    """The length of the list and the index the failing line of the child's code asked
    for, read in the variables the line had, or None."""
    if code is None:
        return None
    frame = None
    trace = error.__traceback__
    while trace is not None:
        if trace.tb_frame.f_code.co_filename == CHILD:
            frame, line = trace.tb_frame, trace.tb_lineno
        trace = trace.tb_next
    lines = code.splitlines()
    if frame is None or not 0 < line <= len(lines):
        return None
    text = lines[line - 1].strip().rstrip(":")
    for start in ("for ", "if ", "elif ", "while ", "return "):
        if text.startswith(start):
            text = (
                text[len(start) :].split(" in ", 1)[-1] if start == "for " else text[len(start) :]
            )
    try:
        tree = ast.parse(text, mode="exec")
    except SyntaxError:
        return None
    names = {**frame.f_globals, **frame.f_locals}
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Subscript) and isinstance(node.value, ast.Name)):
            continue
        if not all(isinstance(part, _PLAIN) for part in ast.walk(node.slice)):
            continue
        listed = names.get(node.value.id)
        try:
            index = eval(
                compile(ast.Expression(node.slice), CHILD, "eval"), {"__builtins__": {}}, names
            )
        except Exception:
            continue
        if isinstance(listed, list) and isinstance(index, int) and index >= len(listed) >= 0:
            return len(listed), index
    return None


#: The methods of another object a child asks of the wizard by mistake (D349): a thing's
#: `reveal`, a door's `open`.
OTHERS_METHODS = {"reveal": "thing", "open": "door"}
#: The finds whose thing a variable may keep, a list's among them (D349).
FINDS = (*FINDS_KEPT, "find_all")


def first_kept(code: str | None, finds: tuple[str, ...], word: str | None = None) -> str | None:
    """The variable of the program's first assignment of a find to a single name, of the
    kind `word` when it is given (D349): `tesoro` for `tesoro = wizard.find_nearest("book")`."""
    if code is None:
        return None
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return None
    return next((name for name, kind, _ in kept_finds(tree, finds) if word in (None, kind)), None)


def _others_method(owner: Child, name: str, code: str | None) -> Explanation | None:
    """A thing's `reveal` or a door's `open` asked of the wizard (D349): whose method it
    is, and the variable the program keeps a found thing in, when it keeps one."""
    if owner._k_role != "wizard" or name not in OTHERS_METHODS:
        return None
    if name == "open":
        return Explanation("open_of_wizard")
    kept = first_kept(code, FINDS_KEPT)
    if kept is not None:
        return Explanation("reveal_of_wizard_kept", {"variable": kept})
    return Explanation("reveal_of_wizard")


def _search_word(name: str, level: Level, code: str | None) -> Explanation | None:
    """A word the level asks the child to find written as a variable (D349): the variable
    the program keeps a find of that word in, or that the word is for searching."""
    if name not in level.to_find:
        return None
    kept = first_kept(code, FINDS, name)
    if kept is not None:
        return Explanation("search_word_kept", {"name": name, "variable": kept})
    return Explanation("search_word", {"name": name})


def explain(error: BaseException, level: Level, code: str | None = None) -> Explanation:
    if isinstance(error, IndexError):
        return index_explanation(error, code)
    if isinstance(error, NotCalled):
        return Explanation(
            "not_called", {"object": error.owner, "name": error.action, "example": error.example}
        )
    if isinstance(error, Refused):
        # The world refused the program, as untying a broom with no knot (D183), or the
        # first year does not allow what it asks (D261).
        return Explanation(error.reason, {"thing": error.by, **error.detail})
    if isinstance(error, NoSuchMethod):
        # A familiar told what its class does not know (D269).
        return Explanation("no_such_method", {"familiar": error.familiar, "name": error.method})
    if isinstance(error, NoAttribute):
        return Explanation("no_attribute", {"name": error.attribute})
    if isinstance(error, ReadOnly):
        kind = "read_only" if error.exists else "no_new_attribute"
        return Explanation(kind, {"object": error.owner, "name": error.attribute})
    if isinstance(error, ActionArguments):
        if error.example:
            return Explanation("arguments", {"name": error.action, "example": error.example})
        return _arguments(error.action, level)
    if isinstance(error, TypeError):
        made = _object_arguments(error)
        if made is not None:
            return made
    if isinstance(error, AttributeError) and isinstance(getattr(error, "obj", None), Child):
        owner: Child = error.obj  # type: ignore[attr-defined]
        others = _others_method(owner, str(error.name), code)
        if others is not None:
            return others
        params: dict[str, Any] = {"object": owner._k_child_name, "name": error.name}
        suggestion = suggest(str(error.name), actions_of(owner, level))
        if suggestion:
            params["suggestion"] = suggestion
        return Explanation("unknown_action", params)
    if (
        isinstance(error, AttributeError)
        and not isinstance(error, ReadOnly)
        and getattr(error, "name", None)
        and not isinstance(getattr(error, "obj", None), Child | type(ast))
    ):
        # An object of the child's, or a value, with no attribute by that name (D271).
        return Explanation("no_attribute", {"name": error.name})
    if isinstance(error, NameError):
        name = str(getattr(error, "name", "") or "")
        searched = _search_word(name, level, code)
        if searched is not None:
            return searched
        params = {"name": name}
        suggestion = suggest(name, ["wizard", *level.ids()])
        if suggestion:
            params["suggestion"] = suggestion
        return Explanation("unknown_name", params)
    if isinstance(error, IndentationError):
        return Explanation("indentation")
    if isinstance(error, SyntaxError):
        return _syntax(error)
    if isinstance(error, TypeError):
        called = _CALL.match(str(error))
        if called and called.group(1) in ("Wizard", "Thing", "Door", "Key", "Teacher"):
            return _arguments(called.group(2), level)
    if isinstance(error, ModuleNotFoundError):
        return Explanation("no_such_module", {"name": error.name or ""})
    return Explanation("other", {"type": type(error).__name__, "message": str(error)})


#: Python's words for a class's method called with too many or too few data.
_TAKES = re.compile(
    r"^(\w+)\.(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given"
)
_MISSING = re.compile(r"^(\w+)\.(\w+)\(\) missing (\d+) required positional arguments?")


def _object_arguments(error: TypeError) -> Explanation | None:
    """An object made, or a method of the child's class called, with too many or too few
    data (D271): `object_arguments`, with the class or the method, what it takes and what
    it was given; one datum too many on a method whose first name is not `self` is a
    method missing its `self`, `missing_self`."""
    message = str(error)
    taken = _TAKES.match(message)
    missing = _MISSING.match(message)
    if taken is None and missing is None:
        return None
    match = taken or missing
    assert match is not None
    klass, method = match.group(1), match.group(2)
    if klass in ("Wizard", "Thing", "Door", "Key", "Teacher", "Broom", "Hole", "Bed"):
        return None
    function = _function_of(error, klass, method)
    names = _parameters(function)
    if taken is not None:
        wants, given = int(taken.group(3)), int(taken.group(4))
        if given == wants + 1 and (not names or names[0] != "self"):
            return Explanation("missing_self", {"name": method, "kind": klass})
        wanted, gave = wants - 1, given - 1
    else:
        wanted = max(len(names) - 1, 0) if names else int(missing.group(3))
        gave = wanted - int(missing.group(3))
    shown = klass if method == "__init__" else method
    return Explanation("object_arguments", {"name": shown, "wanted": wanted, "given": gave})


def _function_of(error: TypeError, klass: str, method: str) -> Any:
    """The class's method the error was about, from the child's code where it was called."""
    trace = error.__traceback__
    frame = None
    while trace is not None:
        if trace.tb_frame.f_code.co_filename == CHILD:
            frame = trace.tb_frame
        trace = trace.tb_next
    if frame is None:
        return None
    found = {**frame.f_globals, **frame.f_locals}.get(klass)
    if found is None:
        found = next((type(v) for v in frame.f_locals.values() if type(v).__name__ == klass), None)
    return getattr(found, method, None) if found is not None else None


def _parameters(function: Any) -> list[str]:
    try:
        return list(inspect.signature(function).parameters)
    except (TypeError, ValueError):
        return []


def _child_classes(base: type = Child) -> list[type]:
    """Every class of object the child may hold, the wizard's and the things' and actors';
    not a familiar's, whose actions say their own example (D270)."""
    found = []
    for kind in base.__subclasses__():
        if issubclass(kind, Familiar):
            continue
        found.append(kind)
        found.extend(_child_classes(kind))
    return found


def _arguments(action: str, level: Level) -> Explanation:
    for owner in _child_classes():
        if callable(getattr(owner, action, None)):
            return Explanation("arguments", {"name": action, "example": example(owner, action)})
    return Explanation("arguments", {"name": action, "example": f"{action}()"})


def _syntax(error: SyntaxError) -> Explanation:
    message = error.msg or ""
    unclosed = _UNCLOSED.search(message)
    if unclosed:
        return Explanation("unclosed", {"what": unclosed.group(1)})
    if "unterminated string" in message or "unterminated triple-quoted" in message:
        text = (error.text or "").strip()
        quote = next((c for c in text if c in "'\""), '"')
        return Explanation("unclosed", {"what": quote})
    if "expected ':'" in message:
        words = (error.text or "").split()
        keyword = words[0].rstrip(":") if words else ""
        return Explanation("missing_colon", {"keyword": keyword})
    return Explanation("syntax", {"message": message})
