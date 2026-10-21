"""Every level in content/ can be played, and keeps to what it teaches.

Its solution wins and calls nothing outside the level's api (D23); it has
three wrong answers or more, none of which wins; a text in every language,
whose starting code runs without an error.
"""

import ast
import json
from pathlib import Path

import pytest
from kydux_world import api
from kydux_world.level import Level
from kydux_world.run import run_code

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content" / "levels"
LANGUAGES = sorted(p.stem for p in (ROOT / "i18n").glob("*.json"))
LEVELS = sorted(p for p in CONTENT.iterdir() if (p / "level.json").is_file())
WRONG = [(level, wrong) for level in LEVELS for wrong in sorted((level / "wrong").glob("*.py"))]


def load(directory: Path) -> Level:
    return Level.from_directory(directory)


def roles(level: Level) -> dict[str, str]:
    """The role of every name the child's code holds in the level."""
    found = {"wizard": "wizard"}
    found.update({t.id: api.role_of(t.kind) for t in level.things})
    found.update({a.id: api.role_of(a.kind) for a in level.actors})
    return found


def outside_api(level: Level, code: str) -> list[str]:
    """The `name.member` uses in the code that the level does not teach."""
    held = roles(level)
    found = []
    for node in ast.walk(ast.parse(code)):
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name):
            role = held.get(node.value.id)
            if role is not None and not api.allows(level.api, role, node.attr):
                found.append(f"{node.value.id}.{node.attr} (line {node.lineno})")
    return found


def test_there_are_levels():
    assert LEVELS


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_level_s_id_is_its_directory(directory):
    assert load(directory).id == directory.name


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_level_says_what_it_teaches(directory):
    assert load(directory).api, "a level lists the names it teaches in api"


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_solution_wins(directory):
    result = run_code(load(directory), (directory / "solution.py").read_text(encoding="utf-8"))
    assert result.status == "won", result.error


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_solution_uses_only_what_the_level_teaches(directory):
    level = load(directory)
    code = (directory / "solution.py").read_text(encoding="utf-8")
    assert not outside_api(level, code)


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_every_level_has_three_wrong_answers_or_more(directory):
    assert len(list((directory / "wrong").glob("*.py"))) >= 3


@pytest.mark.parametrize(
    ("directory", "wrong"), WRONG, ids=lambda p: p.name if isinstance(p, Path) else str(p)
)
def test_a_wrong_answer_does_not_win(directory, wrong):
    result = run_code(load(directory), wrong.read_text(encoding="utf-8"))
    assert result.status != "won"


@pytest.mark.parametrize(
    ("directory", "lang"),
    [(d, lang) for d in LEVELS for lang in LANGUAGES],
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_the_starting_code_runs_without_an_error(directory, lang):
    text = json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
    result = run_code(load(directory), text["starting_code"])
    assert result.status != "error", result.error


@pytest.mark.parametrize(
    ("directory", "lang"),
    [(d, lang) for d in LEVELS for lang in LANGUAGES],
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_a_hint_never_gives_the_solution_away(directory, lang):
    """A hint may name the action that is needed, `door.open()`; it may not be a
    line of the solution, nor quote one that holds its shape (a while, an if, a for)."""
    text = json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
    solution = {
        line.strip()
        for line in (directory / "solution.py").read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
    shape = {line for line in solution if line.split()[0] in ("while", "if", "elif", "for")}
    for hint in text.get("hints", []):
        assert hint.replace("`", "").strip() not in solution, (
            f"a hint is a line of the solution: {hint}"
        )
        for code in hint.split("`")[1::2]:
            assert code.strip() not in shape, f"a hint quotes the solution's shape: {code}"


def test_the_api_check_finds_what_a_level_does_not_teach():
    level = Level.from_dict({"id": "few", "map": ["S..."], "api": ["wizard.move_right"]})
    assert outside_api(level, "wizard.move_right()\nwizard.say('hi')\nx = 3\nx.real") == [
        "wizard.say (line 2)"
    ]
