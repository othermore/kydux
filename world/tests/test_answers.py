"""The game's answers to the four mistakes of a first variable (D349), on the course's
own wrong programs: a find kept in no variable, a method of another object asked of the
wizard, a search word written as a variable, and the book kept under a name the level
refuses."""

from pathlib import Path

import pytest
from kydux_world.level import Level
from kydux_world.run import run_code

LEVELS = Path(__file__).resolve().parents[2] / "content" / "levels"


def run(level: str, code: str):
    return run_code(Level.from_directory(LEVELS / level), code)


def wrong(level: str, name: str) -> str:
    return (LEVELS / level / "wrong" / name).read_text(encoding="utf-8")


def explained(result) -> dict:
    return result.error.explanation if result.error else {}


def test_open_asked_of_the_wizard_says_whose_method_it_is():
    result = run("wennas-door", wrong("wennas-door", "open_of_the_wizard.py"))
    assert explained(result) == {"kind": "open_of_wizard", "params": {}}


def test_reveal_asked_of_the_wizard_names_the_variable_the_find_is_kept_in():
    result = run("the-fallen-book", wrong("the-fallen-book", "reveal_of_the_wizard.py"))
    assert explained(result) == {
        "kind": "reveal_of_wizard_kept",
        "params": {"variable": "treasure"},
    }


def test_reveal_asked_of_the_wizard_with_nothing_kept_says_to_find_and_keep():
    result = run("the-fallen-book", 'wizard.reveal("book")\n')
    assert explained(result) == {"kind": "reveal_of_wizard", "params": {}}


def test_a_search_word_as_a_variable_names_the_variable_its_find_is_kept_in():
    result = run("the-fallen-book", wrong("the-fallen-book", "search_word.py"))
    assert explained(result) == {
        "kind": "search_word_kept",
        "params": {"name": "book", "variable": "treasure"},
    }
    assert result.error.line == 2


def test_a_search_word_as_a_variable_with_nothing_kept_says_it_is_for_searching():
    result = run("the-fallen-book", "book.reveal()\n")
    assert explained(result) == {"kind": "search_word", "params": {"name": "book"}}


def test_a_name_that_is_no_search_word_is_explained_as_before_with_its_suggestion():
    result = run("the-fallen-book", "wizzard.move_left(4)\n")
    assert explained(result) == {
        "kind": "unknown_name",
        "params": {"name": "wizzard", "suggestion": "wizard"},
    }


def test_a_find_kept_in_no_variable_is_said_with_its_line():
    result = run("the-fallen-book", 'wizard.find_nearest("book")\nwizard.move_left(4)\n')
    assert result.status == "incomplete"
    assert result.advice == [{"kind": "found_not_kept", "params": {"line": 1}}]


def test_the_book_kept_under_a_refused_name_is_said_with_the_name():
    result = run("the-lost-book", wrong("the-lost-book", "kept_as_book.py"))
    assert result.status == "incomplete"
    assert result.advice == [{"kind": "variable_not_own", "params": {"name": "book"}}]


def test_the_book_kept_under_a_refused_name_and_not_picked_up_is_not_said():
    code = wrong("the-lost-book", "kept_as_book.py").replace("wizard.pick_up()\n", "")
    assert run("the-lost-book", code).advice == []


@pytest.mark.parametrize("level", ["the-fallen-book", "the-lost-book", "the-reading-room"])
def test_a_run_that_wins_carries_no_advice(level):
    result = run(level, (LEVELS / level / "solution.py").read_text(encoding="utf-8"))
    assert result.status == "won"
    assert result.advice == []
    assert "advice" not in result.to_dict()


def test_a_find_not_kept_is_no_advice_where_nothing_is_to_find():
    result = run("the-reading-room", 'wizard.find_nearest("door")\n')
    assert result.advice == []
