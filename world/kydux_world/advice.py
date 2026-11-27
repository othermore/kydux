"""The game's advice after a run that did not win (D349): what the code shows of a first
variable's mistakes that are no errors, read from the code's tree and the run's end.

- `found_not_kept`: in a level with something to find, a line that only finds, its find
  kept in no variable: the line.
- `variable_not_own`: in a level that asks for a name of the child's own (`own_name`),
  every other required goal met and the find kept under a name the goal refuses: the
  name.

Each is a kind and its parameters, said by the page under the outcome's words
(`error.found_not_kept`, `outcome.variable_not_own`).
"""

import ast
from typing import Any

from .goals import FINDS_KEPT, OwnNameGoal, kept_finds
from .level import Level

#: The finds a line may do and keep nothing of.
FINDS = ("find_nearest", "find_all", "find_item")


def _tree(code: str) -> ast.AST | None:
    try:
        return ast.parse(code)
    except SyntaxError:
        return None


def finds_not_kept(tree: ast.AST) -> list[int]:
    """The lines, in order, of each statement that is only a find of the wizard's:
    `wizard.find_nearest("book")` alone."""
    return sorted(
        node.lineno
        for node in ast.walk(tree)
        if isinstance(node, ast.Expr)
        and isinstance(node.value, ast.Call)
        and isinstance(node.value.func, ast.Attribute)
        and isinstance(node.value.func.value, ast.Name)
        and node.value.func.value.id == "wizard"
        and node.value.func.attr in FINDS
    )


def advise(
    level: Level, code: str, won: bool, goals: list[Any] | None = None
) -> list[dict[str, Any]]:
    """The advice for a run of `code` in `level`: none for a run won; `goals` are the
    run's goal results, in the level's order, whose `met` each says."""
    if won:
        return []
    tree = _tree(code)
    if tree is None:
        return []
    found: list[dict[str, Any]] = []
    lines = finds_not_kept(tree)
    if level.to_find and lines:
        found.append({"kind": "found_not_kept", "params": {"line": lines[0]}})
    results = goals or []
    for index, spec in enumerate(level.goals):
        if spec.kind != "own_name" or index >= len(results) or results[index].met:
            continue
        others = [
            result.met
            for other, (goal, result) in enumerate(zip(level.goals, results, strict=False))
            if other != index and not goal.bonus
        ]
        if not all(others):
            continue
        refused = OwnNameGoal(spec, level).refused
        word = spec.params["find"]
        names = [name for name, kind, _ in kept_finds(tree, FINDS_KEPT) if kind == word]
        name = next((name for name in names if name in refused), None)
        if name is not None:
            found.append({"kind": "variable_not_own", "params": {"name": name}})
    return found
