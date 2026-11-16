"""Every level in content/ can be played, and keeps to what it teaches.

Its solution wins, stumbling on nothing in any way, and calls nothing outside the
level's api (D23); it has three wrong answers or more, none of which wins; a text
in every language, whose starting code runs without an error, as a girl's wizard
and a boy's see it.
"""

import ast
import json
from pathlib import Path

import pytest
from kydux_world import api
from kydux_world.level import Level
from kydux_world.run import run_code
from wizard_words import for_wizard

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
def test_the_solution_stumbles_on_nothing_in_any_way(directory):
    """The level's own program bumps into nothing and is refused nothing, whichever way
    the level comes: its card keeps the star of a run with no bump."""
    level = load(directory)
    code = (directory / "solution.py").read_text(encoding="utf-8")
    for way in [way_id for way_id, _ in level.ways] or [None]:
        result = run_code(level.way(way) if way else level, code)
        stumbles = [e for e in result.events if e.kind in ("bump", "blocked")]
        assert not stumbles, f"{directory.name}, way {way}: {stumbles[0].data}"


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
    ("directory", "lang", "gender"),
    [(d, lang, gender) for d in LEVELS for lang in LANGUAGES for gender in ("girl", "boy")],
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_the_starting_code_runs_without_an_error(directory, lang, gender):
    """The starting code runs; but a fix level's given program may stop where the world
    refuses what it asks, the error the level is about: untying a broom with no knot
    (D183)."""
    text = json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
    result = run_code(load(directory), for_wizard(text["starting_code"], gender))
    refused = (
        load(directory).kind == "fix"
        and result.error is not None
        and (result.error.explanation or {}).get("kind") in REFUSALS
    )
    assert result.status != "error" or refused, result.error


#: The world's refusals a fix level's given program may stop at (D183).
REFUSALS = ("no_knot",)


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


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_a_level_s_story_is_said_by_someone_in_every_language_or_in_none(directory):
    """A level's intro and outro (D45): in every language or in none, never empty,
    and said by the level's speaker."""
    speaker = json.loads((directory / "level.json").read_text(encoding="utf-8")).get("speaker")
    texts = {
        lang: json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
        for lang in LANGUAGES
    }
    for part in ("intro", "outro"):
        said = {lang: text.get(part) for lang, text in texts.items()}
        present = {lang for lang, text in said.items() if text is not None}
        assert present in (set(), set(LANGUAGES)), f"{part} in {sorted(present)} only"
        for lang in present:
            assert isinstance(said[lang], str) and said[lang].strip(), f"{part} in {lang} is empty"
            assert speaker, f"the level has an {part} and no speaker to say it"


@pytest.mark.parametrize("directory", [d for d in LEVELS if load(d).ways], ids=lambda p: p.name)
def test_a_level_played_in_ways_has_a_wrong_answer_that_wins_only_some(directory):
    """In a level with ways (D51), the ways must matter: some wrong answer, a program
    that does not ask, wins one way and loses another."""
    level = load(directory)
    some = []
    for wrong in sorted((directory / "wrong").glob("*.py")):
        result = run_code(level, wrong.read_text(encoding="utf-8"))
        won = [way_id for way_id, way in result.ways if way.status == "won"]
        if 0 < len(won) < len(result.ways):
            some.append(wrong.name)
    assert some, "no wrong answer wins one way and not another: do the ways matter?"


def test_the_key_and_the_door_are_played_in_the_same_ways():
    """*Eldra's door* plays *The moving key* again from the start (D133): the same
    ways, the key two to five steps from the start, never past the door."""
    ways = {}
    for level_id in ("the-moving-key", "eldras-door"):
        data = json.loads((CONTENT / level_id / "level.json").read_text(encoding="utf-8"))
        ways[level_id] = data["ways"]
        start = data["start"]
        for way in data["ways"]:
            (key,) = [thing["at"] for thing in way["things"] if thing["id"] == "key"]
            assert key[1] == start[1] and 2 <= start[0] - key[0] <= 5, (level_id, way["id"])
    assert ways["the-moving-key"] == ways["eldras-door"]


def test_eldras_door_gives_its_bonus_to_the_subtraction_and_not_to_the_return():
    """D133: walking the rest, `5 - steps`, wins every way in 7 ticks with the bonus;
    walking back to the start and then the five wins too, without it."""
    level = load(CONTENT / "eldras-door")
    found = "key = wizard.find_nearest('key')\nsteps = key.distance_to(wizard)\n"
    there = found + "wizard.move_left(steps)\nwizard.pick_up()\n"
    rest = run_code(level, (CONTENT / "eldras-door" / "solution.py").read_text(encoding="utf-8"))
    assert rest.status == "won"
    for _, way in rest.ways:
        assert way.ticks == 7 and all(goal.met for goal in way.goals), way.goals
    back = run_code(level, there + "wizard.move_right(steps)\nwizard.move_left(5)\ndoor.open()\n")
    assert back.status == "won"
    for _, way in back.ways:
        bonus = [goal for goal in way.goals if goal.kind == "ticks_under"]
        assert way.ticks >= 11 and bonus and not bonus[0].met


def test_the_way_in_keeps_the_wizard_on_the_threshold_with_its_words():
    """D171: past the castle's great door, opened on its threshold (8, 6), the hall's
    cell (8, 5) is forbidden, so that a walk longer than the mark stops on the mark and
    says why, with no bump; the level is won, with no star lost to a bump."""
    level = load(CONTENT / "the-way-in")
    code = 'wizard.move_up(2)\nwizard.cast("zelim")\nwizard.say("ambrel")\nwizard.move_up(3)\n'
    result = run_code(level, code)
    assert result.status == "won"
    last = result.events[-1]
    assert last.kind == "blocked"
    assert (last.data["reason"], last.data["at"], last.data["facing"]) == (
        "not_inside_yet",
        [8, 6],
        "up",
    )
    assert not [event for event in result.events if event.kind == "bump"]
    words = {
        lang: json.loads((ROOT / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        for lang in LANGUAGES
    }
    assert words["es"]["blocked"]["not_inside_yet"] == (
        "No entres todavía: quédate en el umbral, pasada la puerta."
    )
    assert words["en"]["blocked"]["not_inside_yet"] == (
        "Do not go in yet: stay on the threshold, past the door."
    )


@pytest.mark.parametrize("directory", LEVELS, ids=lambda p: p.name)
def test_a_forbidden_cell_s_reason_has_its_words_in_every_language(directory):
    """The wizard says why a cell is forbidden (D84, D171): the reason's words are
    `blocked.<reason>` in every language."""
    reason = load(directory).forbidden_reason
    if not reason:
        return
    for lang in LANGUAGES:
        words = json.loads((ROOT / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        assert words["blocked"].get(reason), f"blocked.{reason} in {lang}"
