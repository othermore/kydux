"""Every level in content/ can be played: its solution wins, and its wrong answers do not."""

from pathlib import Path

import pytest
from kydux_world.level import Level
from kydux_world.run import run_code

CONTENT = Path(__file__).resolve().parents[2] / "content" / "levels"
LEVELS = sorted(p for p in CONTENT.iterdir() if (p / "level.json").is_file())
WRONG = [(level, wrong) for level in LEVELS for wrong in sorted((level / "wrong").glob("*.py"))]


def load(directory: Path) -> Level:
    return Level.from_json((directory / "level.json").read_text(encoding="utf-8"))


def test_there_are_levels():
    assert LEVELS


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_level_s_id_is_its_directory(directory):
    assert load(directory).id == directory.name


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_the_solution_wins(directory):
    result = run_code(load(directory), (directory / "solution.py").read_text(encoding="utf-8"))
    assert result.status == "won", result.error


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_every_level_has_wrong_answers(directory):
    assert list((directory / "wrong").glob("*.py"))


@pytest.mark.parametrize(
    ("directory", "wrong"), WRONG, ids=lambda p: p.name if isinstance(p, Path) else str(p)
)
def test_a_wrong_answer_does_not_win(directory, wrong):
    result = run_code(load(directory), wrong.read_text(encoding="utf-8"))
    assert result.status != "won"
