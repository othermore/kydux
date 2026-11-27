"""Chapter 2's first variable on the course's own levels (D342 to D345, D355): the
reading room's move by a variable, the lost book's name of one's own, the fallen book's
find written as the game writes a thing, and the friend's words when the hidden key
lights."""

import json
from pathlib import Path

from kydux_world.level import Level
from kydux_world.run import run_code

LEVELS = Path(__file__).resolve().parents[2] / "content" / "levels"


def level(name: str) -> Level:
    return Level.from_directory(LEVELS / name)


def program(name: str, file: str = "solution.py") -> str:
    return (LEVELS / name / file).read_text(encoding="utf-8")


def test_the_reading_room_is_won_by_a_move_by_a_variable_and_not_by_the_numbers_typed():
    room = level("the-reading-room")
    won = run_code(room, program("the-reading-room"))
    assert won.status == "won" and all(goal.met for goal in won.goals)
    typed = run_code(room, program("the-reading-room", "wrong/numbers_by_hand.py"))
    assert typed.status == "incomplete"
    assert [goal.met for goal in typed.goals[:2]] == [True, False]


def test_the_lost_book_is_won_by_a_name_of_one_s_own_and_not_by_book():
    lost = level("the-lost-book")
    assert run_code(lost, program("the-lost-book")).status == "won"
    kept = run_code(lost, program("the-lost-book", "wrong/kept_as_book.py"))
    assert kept.status == "incomplete"
    assert [goal.met for goal in kept.goals[:2]] == [True, False]
    tesoro = program("the-lost-book").replace("eldras_book", "tesoro")
    assert run_code(lost, tesoro).status == "incomplete"


def test_a_book_found_and_printed_is_its_kind_and_its_cell():
    """The page of `finding-things` quotes what its block prints in the fallen book's
    world: `<book at 3, 15>` (D344)."""
    code = 'treasure = wizard.find_nearest("book")\nprint(treasure)\n'
    assert run_code(level("the-fallen-book"), code).stdout == "<book at 3, 15>\n"


def test_the_friend_says_where_the_hidden_key_is_when_it_lights_once():
    """D355: in the tick of the first reveal, once in the run; a run with no reveal tells
    nothing."""
    hidden = level("the-hidden-key")
    result = run_code(hidden, program("the-hidden-key"))
    told = [event for event in result.events if event.kind == "told"]
    (reveal,) = [event for event in result.events if event.kind == "reveal"]
    assert [(e.data["who"], e.data["key"]) for e in told] == [("mate", "revealed")]
    assert told[0].tick == reveal.tick
    twice = program("the-hidden-key").replace(
        "my_key.reveal()", "my_key.reveal()\nmy_key.reveal()"
    )
    assert len([e for e in run_code(hidden, twice).events if e.kind == "told"]) == 1
    unlit = program("the-hidden-key").replace("my_key.reveal()\n", "")
    assert not [e for e in run_code(hidden, unlit).events if e.kind == "told"]
    for lang in ("es", "en"):
        text = json.loads((LEVELS / "the-hidden-key" / f"text.{lang}.json").read_text("utf-8"))
        assert text["told"]["revealed"]
