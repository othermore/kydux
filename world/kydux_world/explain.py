"""Errors in the child's words: what a Python exception means, as a kind and its parameters.

The world explains, and the page says it in the player's language through
its i18n files (architecture.md, D22): `explain` gives a kind, one key under
`error.` in i18n/<lang>.json, and the names and examples that go in it.
Suggestions come from the names the level teaches (its `api`) for an action,
and from `wizard` and the level's ids for a name. Python's own text stays in
the error beside the explanation, for an adult.
"""

import ast
import difflib
import re
from dataclasses import dataclass, field
from typing import Any

from . import api
from .level import Level
from .things import Child, ReadOnly
from .world import ActionArguments, Refused


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


def explain(error: BaseException, level: Level) -> Explanation:
    if isinstance(error, NotCalled):
        return Explanation(
            "not_called", {"object": error.owner, "name": error.action, "example": error.example}
        )
    if isinstance(error, Refused):
        # The world refused the program, as untying a broom with no knot (D183).
        return Explanation(error.reason, {"thing": error.by})
    if isinstance(error, ReadOnly):
        kind = "read_only" if error.exists else "no_new_attribute"
        return Explanation(kind, {"object": error.owner, "name": error.attribute})
    if isinstance(error, ActionArguments):
        if error.example:
            return Explanation("arguments", {"name": error.action, "example": error.example})
        return _arguments(error.action, level)
    if isinstance(error, AttributeError) and isinstance(getattr(error, "obj", None), Child):
        owner: Child = error.obj  # type: ignore[attr-defined]
        params: dict[str, Any] = {"object": owner._k_child_name, "name": error.name}
        suggestion = suggest(str(error.name), actions_of(owner, level))
        if suggestion:
            params["suggestion"] = suggestion
        return Explanation("unknown_action", params)
    if isinstance(error, NameError):
        name = str(getattr(error, "name", "") or "")
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


def _child_classes(base: type = Child) -> list[type]:
    """Every class of object the child may hold, the wizard's and the things' and actors'."""
    found = []
    for kind in base.__subclasses__():
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
