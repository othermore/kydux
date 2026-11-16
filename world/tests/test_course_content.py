"""The course in content/ holds together (D32, D33, D41): its chapters name items
that exist, every lesson is in every language with the same pages and no HTML,
every story is staged on its scene and said in every language (D74), what
a lesson explains is taught by the level after it, its Try it runs there, and in a
chapter with lessons, a level teaches nothing a lesson before it has not explained."""

import ast
import json
import re
from pathlib import Path

import pytest
from kydux_world.level import Level
from kydux_world.run import run_code
from wizard_words import for_wizard

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
LANGUAGES = sorted(p.stem for p in (ROOT / "i18n").glob("*.json"))
CHAPTERS = sorted(p for p in (CONTENT / "chapters").iterdir() if (p / "chapter.json").is_file())
LESSONS = sorted(p for p in (CONTENT / "lessons").iterdir() if (p / "lesson.json").is_file())
STORIES = sorted(p for p in (CONTENT / "stories").glob("*") if (p / "story.json").is_file())
#: The concepts a lesson may teach, beside the API's names (D60): Python's words and
#: signs.
CONCEPTS = {
    "arguments",
    "arithmetic",
    "comments",
    "def",
    "def_arguments",
    "else",
    "equal",
    "for_each",
    "for_range",
    "if",
    "len",
    "less_greater",
    "lists",
    "not",
    "print",
    "strings",
    "variables",
    "while",
}
TRY = re.compile(r"```python try\n(.*?)```", re.S)
FENCED = re.compile(r"```.*?```", re.S)
INLINE = re.compile(r"`[^`\n]*`")
HTML = re.compile(r"<[A-Za-z!/]")


def chapter(path: Path) -> dict:
    return json.loads((path / "chapter.json").read_text(encoding="utf-8"))


def course() -> list[str]:
    return [item for path in CHAPTERS for item in chapter(path)["items"]]


def pages(markdown: str) -> list[str]:
    return [page for page in re.split(r"^---$", markdown, flags=re.M) if page.strip()]


def level_after(item: str) -> Path | None:
    """The level the course reaches first after `item`."""
    items = course()
    for later in items[items.index(item) + 1 :]:
        kind, _, item_id = later.partition(":")
        if kind == "level":
            return CONTENT / "levels" / item_id
    return None


def test_there_is_a_course():
    assert CHAPTERS and course()


@pytest.mark.parametrize("path", CHAPTERS, ids=lambda p: p.name)
def test_a_chapter_s_id_is_its_directory_and_its_items_exist(path):
    data = chapter(path)
    assert data["id"] == path.name
    for item in data["items"]:
        kind, _, item_id = item.partition(":")
        assert kind in ("story", "lesson", "level"), item
        folder = CONTENT / ("stories" if kind == "story" else f"{kind}s") / item_id
        assert (folder / f"{kind}.json").is_file(), f"{item} names nothing in content/"


def test_every_item_is_in_the_course_once():
    items = course()
    assert len(items) == len(set(items))
    for path in LESSONS:
        assert f"lesson:{path.name}" in items, f"the lesson {path.name} is in no chapter"
    for path in STORIES:
        story = json.loads((path / "story.json").read_text(encoding="utf-8"))
        assert story["id"] == path.name
        # The game's opening comes before the course (D61); every other story is in it.
        if not story.get("opening"):
            assert f"story:{path.name}" in items, f"the story {path.name} is in no chapter"
    for path in sorted((CONTENT / "levels").iterdir()):
        if (path / "level.json").is_file():
            assert f"level:{path.name}" in items, f"the level {path.name} is in no chapter"


@pytest.mark.parametrize("path", LESSONS, ids=lambda p: p.name)
def test_a_lesson_is_in_every_language_with_the_same_pages(path):
    counts = {}
    for lang in LANGUAGES:
        markdown = path / f"{lang}.md"
        assert markdown.is_file(), f"{path.name} lacks {lang}.md"
        text = markdown.read_text(encoding="utf-8")
        counts[lang] = len(pages(text))
        assert re.match(r"#\s+\S", text), f"{path.name}/{lang}.md does not open with its title"
        for page in pages(text):
            assert len(TRY.findall(page)) <= 1, f"{path.name}/{lang}.md: a page has two blocks"
    assert len(set(counts.values())) == 1, f"{path.name}: pages differ, {counts}"


@pytest.mark.parametrize(
    ("path", "lang"),
    [(p, lang) for p in LESSONS for lang in LANGUAGES],
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_a_lesson_has_no_html(path, lang):
    text = (path / f"{lang}.md").read_text(encoding="utf-8")
    prose = INLINE.sub("", FENCED.sub("", text))
    assert not HTML.search(prose), f"{path.name}/{lang}.md has HTML in it"


@pytest.mark.parametrize("path", LESSONS, ids=lambda p: p.name)
def test_what_a_lesson_explains_the_level_after_it_teaches(path):
    teaches = json.loads((path / "lesson.json").read_text(encoding="utf-8"))["teaches"]
    level = level_after(f"lesson:{path.name}")
    assert level is not None, f"no level comes after {path.name}"
    api = Level.from_directory(level).api
    names = [name for name in teaches if not name.startswith("concept:")]
    missing = [name for name in names if name not in api]
    assert not missing, f"{level.name} does not teach {missing}"


@pytest.mark.parametrize("path", LESSONS, ids=lambda p: p.name)
def test_a_lesson_s_concepts_are_ones_the_game_knows(path):
    """A concept a lesson teaches (D60) is one the notebook and the checks follow."""
    teaches = json.loads((path / "lesson.json").read_text(encoding="utf-8"))["teaches"]
    concepts = [name.split(":", 1)[1] for name in teaches if name.startswith("concept:")]
    assert set(concepts) <= CONCEPTS, f"{path.name} teaches {set(concepts) - CONCEPTS}"


@pytest.mark.parametrize(
    ("path", "lang", "gender"),
    [(p, lang, gender) for p in LESSONS for lang in LANGUAGES for gender in ("girl", "boy")],
    ids=lambda v: v.name if isinstance(v, Path) else v,
)
def test_a_lesson_s_blocks_run_in_the_level_after_it(path, lang, gender):
    """Each block of a lesson runs on its page, in the world of the level after it (D142)."""
    text = for_wizard((path / f"{lang}.md").read_text(encoding="utf-8"), gender)
    found = TRY.findall(text)
    if not found:
        return
    level = level_after(f"lesson:{path.name}")
    lesson = json.loads((path / "lesson.json").read_text(encoding="utf-8"))
    for code in found:
        result = run_code(Level.from_directory(level), code)
        assert result.status != "error", result.error
        stumbles = [e for e in result.events if e.kind in ("bump", "blocked")]
        if lesson.get("try") == "refused":
            # A lesson on where an action works shows it refused where it does not (D84).
            assert stumbles, f"{path.name}'s example is refused nothing in {level.name}"
            continue
        # The example is the level's own: it bumps into nothing and is refused nothing.
        assert not stumbles, f"{path.name}'s example stumbles in {level.name}: {stumbles[0].data}"


@pytest.mark.parametrize("path", LESSONS, ids=lambda p: p.name)
def test_a_lesson_s_try_says_how_its_block_runs_and_only_a_block_has_one(path):
    """`try` says how a lesson's block runs (refused, D84); a lesson with nothing worth
    trying has no block and no `try` (D173)."""
    lesson = json.loads((path / "lesson.json").read_text(encoding="utf-8"))
    blocks = {
        lang: TRY.findall((path / f"{lang}.md").read_text(encoding="utf-8")) for lang in LANGUAGES
    }
    if "try" in lesson:
        assert lesson["try"] == "refused", f"{path.name}: try is refused or absent"
        assert all(blocks.values()), f"{path.name} says how its block runs and has none"


#: The lessons with nothing worth trying, and so no block, with their pages (D173, D174).
NOTHING_TO_TRY = {
    "the-right-place": 2,
    "words": 2,
    "things-to-carry": 2,
    "your-first-spell": 2,
    "giving-things": 3,
    "keys-and-doors": 2,
    "fendra": 2,
    "the-cells": 3,
    "waiting": 1,
    "while": 2,
    "kirra-and-osto": 2,
    "the-portal": 2,
    "drevo": 1,
}


@pytest.mark.parametrize(("lesson", "count"), sorted(NOTHING_TO_TRY.items()))
def test_a_lesson_with_nothing_to_try_has_no_block_and_goes_on_to_its_level(lesson, count):
    """D173, D174: a lesson whose block would only walk, cast or pick up keeps its pages
    of words, no block, and its last button leads to the level after it."""
    path = CONTENT / "lessons" / lesson
    for lang in LANGUAGES:
        text = (path / f"{lang}.md").read_text(encoding="utf-8")
        assert len(pages(text)) == count and not TRY.findall(text), lang
    items = course()
    assert items[items.index(f"lesson:{lesson}") + 1].startswith("level:")


#: What each block of the lesson less-or-greater prints, by language, as its pages say
#: (D212): the four answers; the broom to the left; left by three.
LESS_OR_GREATER_PRINTS = {
    "es": ["True\nFalse\nTrue\nFalse\n", "True\n", "izquierda 3\n"],
    "en": ["True\nFalse\nTrue\nFalse\n", "True\n", "left 3\n"],
}


@pytest.mark.parametrize("lang", LANGUAGES)
def test_the_lesson_less_or_greater_s_blocks_print_what_its_pages_say(lang):
    path = CONTENT / "lessons" / "less-or-greater"
    blocks = TRY.findall(for_wizard((path / f"{lang}.md").read_text(encoding="utf-8"), "girl"))
    level = Level.from_directory(level_after("lesson:less-or-greater"))
    assert [run_code(level, code).stdout for code in blocks] == LESS_OR_GREATER_PRINTS[lang]


def compared(code: str) -> set[str]:
    """The comparisons by size and the calls of abs, min and max in a program (D212)."""
    tree = ast.parse(code)
    signs = {
        type(op).__name__
        for node in ast.walk(tree)
        if isinstance(node, ast.Compare)
        for op in node.ops
    }
    calls = {
        node.func.id
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
    }
    return (signs & {"Lt", "Gt", "LtE", "GtE", "NotEq"}) | (calls & {"abs", "min", "max"})


def taught_code(item: str) -> list[tuple[str, str]]:
    """The code an item of the course shows the child or solves with: a level's solution,
    its other solutions and its starting code in each language; a lesson's blocks."""
    kind, _, item_id = item.partition(":")
    if kind == "lesson":
        path = CONTENT / "lessons" / item_id
        return [
            (f"{item} {lang}", code)
            for lang in LANGUAGES
            for code in TRY.findall((path / f"{lang}.md").read_text(encoding="utf-8"))
        ]
    if kind != "level":
        return []
    path = CONTENT / "levels" / item_id
    found = [(f"{item} solution", (path / "solution.py").read_text(encoding="utf-8"))]
    found += [
        (f"{item} {other.name}", other.read_text(encoding="utf-8"))
        for other in path.glob("solutions/*.py")
    ]
    for lang in LANGUAGES:
        text = json.loads((path / f"text.{lang}.json").read_text(encoding="utf-8"))
        found.append((f"{item} starting code {lang}", text.get("starting_code") or ""))
    return found


def test_the_course_compares_by_size_only_with_less_and_greater_and_after_their_lesson():
    """D212: `<` and `>` come with the lesson less-or-greater and not before it; `<=`,
    `>=`, `!=`, `abs`, `min` and `max` in no lesson and no level."""
    items = course()
    lesson = items.index("lesson:less-or-greater")
    for index, item in enumerate(items):
        for where, code in taught_code(item):
            found = compared(code)
            assert found <= {"Lt", "Gt"}, f"{where}: {sorted(found)}"
            assert index >= lesson or not found, f"{where} compares before its lesson"


def level_api(item_id: str) -> list[str]:
    return list(Level.from_directory(CONTENT / "levels" / item_id).api)


@pytest.mark.parametrize("path", CHAPTERS, ids=lambda p: p.name)
def test_a_level_teaches_only_what_a_lesson_before_it_explained(path):
    """In a chapter that has lessons (D41), every name a level teaches was explained
    by a lesson before it in the course, or taught by a level before it. A chapter
    with no lesson yet holds levels to be given their lessons in its own sprint."""
    if not any(item.startswith("lesson:") for item in chapter(path)["items"]):
        return
    explained: set[str] = set()
    for item in course():
        kind, _, item_id = item.partition(":")
        if kind == "lesson":
            lesson = json.loads((CONTENT / "lessons" / item_id / "lesson.json").read_text())
            explained.update(lesson["teaches"])
            continue
        if kind != "level":
            continue
        api = level_api(item_id)
        if item in chapter(path)["items"]:
            unexplained = [name for name in api if name not in explained]
            assert not unexplained, f"{item_id} teaches {unexplained}, which no lesson explained"
        explained.update(api)


@pytest.mark.parametrize("path", STORIES, ids=lambda p: p.name)
def test_a_story_is_staged_on_its_scene_and_said_in_every_language(path):
    """A story (D74) is a staging that fits its scene, and in every language its
    title and one text for each step, with no HTML."""
    from kydux_world.level import read_scene, story_on_scenes

    story = json.loads((path / "story.json").read_text(encoding="utf-8"))
    story_on_scenes(story, lambda scene: read_scene(CONTENT / "scenes", scene, story["id"]))
    for lang in LANGUAGES:
        text = json.loads((path / f"text.{lang}.json").read_text(encoding="utf-8"))
        assert text.get("title"), f"{path.name}/text.{lang}.json has no title"
        steps = text.get("steps", [])
        assert len(steps) == len(story["steps"]), (
            f"{path.name}/text.{lang}.json: not a text a step"
        )
        for said in steps:
            assert isinstance(said, str) and said.strip(), (
                f"{path.name}/text.{lang}.json: a step unsaid"
            )
            assert not HTML.search(INLINE.sub("", said)), f"{path.name}/text.{lang}.json has HTML"


def rewritten(chapter_path: Path) -> bool:
    """A chapter in the shape of the owner's UAT (D56, D62): it opens with a story.
    The chapters not yet rewritten are held to it in their own sprint."""
    items = chapter(chapter_path)["items"]
    return bool(items) and items[0].startswith("story:")


def concepts_used(code: str) -> set[str]:
    """The concepts a piece of code needs known (D60, D256): a comment, an action given
    something in its brackets, a string, print, len, a function of its own (def) and
    its arguments; a variable given a value, a sum or a subtraction, a comparison by
    `==` or by `<` and `>`, `not`, an `if` and its `else`, a `for` over a `range` or
    over anything else, a `while`, and a list in brackets or an index."""
    import ast
    import io
    import tokenize

    used = set()
    tokens = tokenize.generate_tokens(io.StringIO(code).readline)
    if any(token.type == tokenize.COMMENT for token in tokens):
        used.add("comments")
    for node in ast.walk(ast.parse(code)):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute) and (node.args or node.keywords):
                used.add("arguments")
            if isinstance(node.func, ast.Name) and node.func.id in ("print", "len"):
                used.add(node.func.id)
        if isinstance(node, ast.FunctionDef):
            used.add("def")
            if node.args.args:
                used.add("def_arguments")
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            used.add("strings")
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            used.add("variables")
        if isinstance(node, ast.AugAssign):
            used |= {"variables", "arithmetic"}
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub)):
            used.add("arithmetic")
        if isinstance(node, ast.Compare):
            for op in node.ops:
                if isinstance(op, (ast.Eq, ast.NotEq)):
                    used.add("equal")
                if isinstance(op, (ast.Lt, ast.Gt, ast.LtE, ast.GtE)):
                    used.add("less_greater")
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
            used.add("not")
        if isinstance(node, (ast.If, ast.IfExp)):
            used.add("if")
            if node.orelse:
                used.add("else")
        if isinstance(node, ast.For):
            ranged = (
                isinstance(node.iter, ast.Call) and getattr(node.iter.func, "id", None) == "range"
            )
            used.add("for_range" if ranged else "for_each")
        if isinstance(node, ast.While):
            used.add("while")
        if isinstance(node, (ast.List, ast.Subscript)):
            used.add("lists")
    return used


def levels_with_concepts() -> list[tuple[Path, str, set[str]]]:
    """Every level of a rewritten chapter, with the concepts known on reaching it."""
    found, known = [], set()
    for path in CHAPTERS:
        for item in chapter(path)["items"]:
            kind, _, item_id = item.partition(":")
            if kind == "lesson":
                lesson = json.loads((CONTENT / "lessons" / item_id / "lesson.json").read_text())
                taught = lesson["teaches"]
                known |= {n.split(":", 1)[1] for n in taught if n.startswith("concept:")}
            elif kind == "level" and rewritten(path):
                found.append((CONTENT / "levels" / item_id, item, set(known)))
    return found


@pytest.mark.parametrize(
    ("directory", "item", "known"), levels_with_concepts(), ids=lambda v: getattr(v, "name", "")
)
def test_a_level_s_code_needs_only_the_concepts_taught_before_it(directory, item, known):
    """A level's starting code and solution use no comment, argument, string, print,
    len, function of their own (def) or arguments of one that a lesson before it has
    not explained (D60)."""
    codes = {"solution": (directory / "solution.py").read_text(encoding="utf-8")}
    for lang in LANGUAGES:
        text = json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
        for gender in ("girl", "boy"):
            codes[f"starting code, {lang}"] = for_wizard(text["starting_code"], gender)
    for where, code in codes.items():
        unknown = concepts_used(code) - known
        assert not unknown, f"{item}'s {where} uses {sorted(unknown)} before a lesson explains it"


def lessons_with_concepts() -> list[tuple[Path, set[str]]]:
    """Every lesson of the course, with the concepts known once it is read, its own
    among them."""
    found, known = [], set()
    for path in CHAPTERS:
        for item in chapter(path)["items"]:
            kind, _, item_id = item.partition(":")
            if kind == "lesson":
                lesson = json.loads((CONTENT / "lessons" / item_id / "lesson.json").read_text())
                taught = lesson["teaches"]
                known |= {n.split(":", 1)[1] for n in taught if n.startswith("concept:")}
                found.append((CONTENT / "lessons" / item_id, set(known)))
    return found


BLOCK = re.compile(r"```python(?: try)?\n(.*?)```", re.S)


@pytest.mark.parametrize(
    ("path", "known"), lessons_with_concepts(), ids=lambda v: getattr(v, "name", "")
)
def test_a_lesson_s_blocks_need_only_the_concepts_taught_up_to_it(path, known):
    """Every block of a lesson that is whole Python uses nothing a lesson up to it, this
    one among them, has not marked (D256); a line shown alone that is no whole program
    is passed over."""
    for lang in LANGUAGES:
        for gender in ("girl", "boy"):
            text = for_wizard((path / f"{lang}.md").read_text(encoding="utf-8"), gender)
            for block in BLOCK.findall(text):
                try:
                    unknown = concepts_used(block) - known
                except SyntaxError:
                    continue
                assert not unknown, f"{path.name}/{lang}.md: a block uses {sorted(unknown)}"


def taught_once_marked() -> dict[str, set[str]]:
    """For each concept, the concepts known once the lesson that marks it is read."""
    known_at = {}
    for _path, known in lessons_with_concepts():
        for concept in known:
            known_at.setdefault(concept, set(known))
    return known_at


#: The concepts with no entry on the notebook's page of Python (D256): an argument is
#: said with each action; a comment, a string and `print` are on the screen in the
#: programs; `len` is said in the list's entry.
OFF_THE_PAGE = {"arguments", "comments", "len", "print", "strings"}


def test_the_page_of_python_has_a_line_and_an_example_for_each_concept_it_shows():
    """D256: notebook_python holds every concept but those off the page; each example, in
    every language, is whole Python with as many lines in each, and needs only what is
    known once the lesson that marks its concept has been read."""
    import ast

    pages = {
        lang: json.loads((ROOT / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))[
            "notebook_python"
        ]
        for lang in LANGUAGES
    }
    known_at = taught_once_marked()
    for lang, page in pages.items():
        shown = CONCEPTS - OFF_THE_PAGE
        assert set(page) == shown, f"{lang}: {set(page) ^ shown}"
        for concept, entry in page.items():
            assert entry["does"].strip(), f"{lang}: {concept} says nothing"
            example = entry["example"]
            ast.parse(example)
            unknown = concepts_used(example) - known_at[concept]
            assert not unknown, f"{lang}: {concept}'s example uses {sorted(unknown)}"
    for concept in pages["en"]:
        counts = {lang: len(page[concept]["example"].split("\n")) for lang, page in pages.items()}
        assert len(set(counts.values())) == 1, f"{concept}'s example: {counts}"


@pytest.mark.parametrize("path", [p for p in CHAPTERS if rewritten(p)], ids=lambda p: p.name)
def test_every_level_of_a_rewritten_chapter_closes(path):
    """Every level says an outro and what was learned; the chapter's last level says
    no learned, since the chapter's closing story recaps (D62)."""
    levels = [i.partition(":")[2] for i in chapter(path)["items"] if i.startswith("level:")]
    for level_id in levels:
        for lang in LANGUAGES:
            text = json.loads(
                (CONTENT / "levels" / level_id / f"text.{lang}.json").read_text(encoding="utf-8")
            )
            assert text.get("outro", "").strip(), f"{level_id} has no outro in {lang}"
            if level_id == levels[-1]:
                assert "learned" not in text, f"{level_id}, the chapter's last, says learned"
            else:
                assert text.get("learned", "").strip(), f"{level_id} says no learned in {lang}"
    assert chapter(path)["items"][-1].startswith("story:"), "the chapter closes with a story"


def level_json(item_id: str) -> dict:
    return json.loads((CONTENT / "levels" / item_id / "level.json").read_text(encoding="utf-8"))


def walked(item_id: str, way: int = 0) -> list[tuple[int, int]]:
    """The tiles the wizard stands on in a level's solution, from its start to its end,
    in its first way, or the one given."""
    directory = CONTENT / "levels" / item_id
    level = Level.from_directory(directory)
    level = level.ways[way][1] if level.ways else level
    result = run_code(level, (directory / "solution.py").read_text(encoding="utf-8"))
    tiles = [tuple(level.start)]
    tiles += [
        tuple(e.data["to"]) for e in result.events if e.actor == "wizard" and e.kind == "move"
    ]
    return tiles


def scene_pairs() -> list[tuple[str, str]]:
    """Each level on a scene with the level before it in its chapter on the same scene."""
    pairs = []
    for path in CHAPTERS:
        levels = [i.partition(":")[2] for i in chapter(path)["items"] if i.startswith("level:")]
        for before, after in zip(levels, levels[1:], strict=False):
            scene = level_json(after).get("scene")
            if scene and level_json(before).get("scene") == scene:
                pairs.append((before, after))
    return pairs


@pytest.mark.parametrize(("before", "after"), scene_pairs(), ids=lambda v: v)
def test_a_level_on_a_scene_starts_where_the_one_before_it_ended(before, after):
    """D65: where a level ends the next begins, on the same tile: its end, or, with no
    end, the tile its solution leaves the wizard on; but a fix or an improve level that
    plays the level before it again, from the start, begins where that one began. A level
    whose ways end on different cells, the brooms in a row, is followed from where its
    solution leaves the wizard in one of them (the row's end, in its longest way)."""
    ended = level_json(before).get("end") or list(walked(before)[-1])
    again = level_json(after).get("kind") in ("fix", "improve") and level_json(before)["start"]
    ways = [
        list(walked(before, way)[-1]) for way in range(len(level_json(before).get("ways", [])))
    ]
    # The dark tunnel starts where the child cannot know (D152); three of the shed's
    # levels start where the plan puts them.
    if after in STARTS_SAID:
        assert level_json(after)["start"] == STARTS_SAID[after]
    elif after != "the-dark-tunnel":
        assert level_json(after)["start"] in (ended, again, *ways)


#: The shed's levels that start where the plan puts them rather than where the one before
#: ended: the wall's at the shed's door; the nearest broom's in the middle of the floor;
#: the straw's on the floor's first row, where a find_all gives the floor's brooms; and
#: the check, which plays the wall's program again, where the wall's began.
STARTS_SAID = {
    "the-brooms-on-the-wall": [9, 8],
    "the-nearest-broom": [9, 7],
    "the-brooms-in-the-straw": [10, 6],
    "the-check": [9, 8],
}


SCENE_LEVELS = sorted(
    p.name for p in (CONTENT / "levels").iterdir() if "scene" in level_json(p.name)
)


@pytest.mark.parametrize("item_id", SCENE_LEVELS)
def test_a_friend_stands_off_the_solution_s_way(item_id):
    """D66: the friend who teaches stands near, never where the solution walks."""
    path = set(walked(item_id))
    for actor in level_json(item_id).get("actors", []):
        if actor["kind"] == "friend":
            assert tuple(actor["at"]) not in path, f"{actor['id']} stands on the way"


@pytest.mark.parametrize("path", LESSONS, ids=lambda p: p.name)
def test_a_lesson_says_who_teaches_it(path):
    """D67: a lesson is drawn as its teacher speaking, a character of the story's;
    `friend` is the friend of the wizard's other gender, Nuri or Teku (D77), and
    `mate` the friend of the wizard's own (D84)."""
    speaker = json.loads((path / "lesson.json").read_text(encoding="utf-8")).get("speaker")
    characters = json.loads((ROOT / "i18n" / "en.json").read_text(encoding="utf-8"))["characters"]
    assert speaker in ("friend", "mate") or speaker in characters, (
        f"{path.name} names no teacher of the story's"
    )


#: What chapter 3 no longer says to a child (D141, D145), in the Spanish and the English.
OUT_OF_THE_WORDS = {
    "es": re.compile(r"pregunt|encantad|bajito|varias (formas|maneras)", re.I),
    "en": re.compile(r"\benchanted\b|\bwhisper|several ways|\basks?\b|\bquestion\b", re.I),
}


def chapter_3_texts(lang: str) -> list[tuple[str, str]]:
    """Every text of chapter 3's stops that the child reads, by its item."""
    items = json.loads((CONTENT / "chapters" / "03-passages" / "chapter.json").read_text())[
        "items"
    ]
    found = []
    for item in items:
        kind, _, item_id = item.partition(":")
        if kind == "lesson":
            text = (CONTENT / "lessons" / item_id / f"{lang}.md").read_text(encoding="utf-8")
        else:
            folder = "stories" if kind == "story" else "levels"
            text = (CONTENT / folder / item_id / f"text.{lang}.json").read_text(encoding="utf-8")
        found.append((item, text))
    return found


@pytest.mark.parametrize("lang", LANGUAGES)
def test_chapter_3_says_nothing_the_owner_took_out_of_it(lang):
    """A program looks and sees, it never asks; the tunnel is dark; the game's doing is
    shown, not told (D141, D145). The cold voice alone whispers."""
    for item, text in chapter_3_texts(lang):
        said = text.replace("susurra", "").replace("whispers", "")
        found = OUT_OF_THE_WORDS[lang].search(said)
        assert not found, f"{item}, {lang}: {found.group(0)}"


def every_text(lang: str) -> list[tuple[str, str]]:
    """Every text of the course's stops the child reads, by its item."""
    found = []
    for path in sorted((CONTENT / "chapters").glob("*/chapter.json")):
        for item in json.loads(path.read_text(encoding="utf-8"))["items"]:
            kind, _, item_id = item.partition(":")
            folder = {"story": "stories", "level": "levels"}.get(kind)
            name = f"text.{lang}.json" if folder else f"{lang}.md"
            found.append(
                (item, (CONTENT / (folder or "lessons") / item_id / name).read_text("utf-8"))
            )
    return found


#: Where a metaphor for an idea has no place: past the lesson that first explains it.
METAPHORS = {
    "es": re.compile(r"pregunt|bajo (un|su propio|el) nombre", re.I),
    "en": re.compile(r"\basks?\b|\basking\b|under (a|its own|the) name", re.I),
}
#: What says it in the ordinary sense, of no programming idea, or recalls it once in
#: parentheses, as the owner allows the second time.
MAY_SAY = {"story:the-letter", "level:the-lost-book"}


@pytest.mark.parametrize("lang", LANGUAGES)
def test_a_metaphor_stands_only_where_its_idea_is_first_explained(lang):
    """The owner, 2026-11-07: the easy word the first time, *in programming it is called
    X*, and then X; the second time it may be recalled in parentheses. *Preguntar* is out."""
    for item, text in every_text(lang):
        if item in MAY_SAY:
            continue
        found = METAPHORS[lang].search(text)
        assert not found, f"{item}, {lang}: {found.group(0)}"


#: The thing in the floor is a hole that opens, never a slab, and nothing goes and comes
#: (D167), in every text of the course and in the game's own words.
NO_SLAB = {
    "es": re.compile(r"\blosas?\b|va y viene|van y vienen", re.I),
    "en": re.compile(r"\bslabs?\b|comes? and go(es)?\b", re.I),
}


@pytest.mark.parametrize("lang", LANGUAGES)
def test_the_hole_is_never_a_slab(lang):
    """The owner, 2026-11-08: the picture shows a round hole that opens in the floor, so
    every text speaks of a hole, a magic trap or a dark portal the first time (D167)."""
    words = (ROOT / "i18n" / f"{lang}.json").read_text(encoding="utf-8")
    for item, text in [*every_text(lang), (f"i18n/{lang}.json", words)]:
        found = NO_SLAB[lang].search(text)
        assert not found, f"{item}, {lang}: {found.group(0)}"
    lesson = (CONTENT / "lessons" / "kirra-and-osto" / f"{lang}.md").read_text(encoding="utf-8")
    first = {"es": "una trampa mágica, o un portal oscuro", "en": "a magic trap, or a dark portal"}
    assert first[lang] in lesson


# The child is told what may differ at each run, never of ways (D204).


#: Every text the child reads: the levels', the stories', the guide's, the lessons'
#: pages, and the page's own words in i18n/.
def child_texts() -> list[tuple[str, str]]:
    found = []

    def strings(value, where):
        if isinstance(value, str):
            found.append((where, value))
        elif isinstance(value, dict):
            for key, inner in value.items():
                strings(inner, f"{where}.{key}")
        elif isinstance(value, list):
            for index, inner in enumerate(value):
                strings(inner, f"{where}[{index}]")

    for path in sorted(CONTENT.glob("*/*/text.*.json")) + sorted(
        CONTENT.glob("guide/text.*.json")
    ):
        strings(json.loads(path.read_text(encoding="utf-8")), path.relative_to(CONTENT).as_posix())
    for path in sorted(CONTENT.glob("lessons/*/*.md")):
        found.append((path.relative_to(CONTENT).as_posix(), path.read_text(encoding="utf-8")))
    for path in sorted((ROOT / "i18n").glob("*.json")):
        catalog = json.loads(path.read_text(encoding="utf-8"))
        # Only ?debug's select of ways and its won way say the word (D204).
        for key in ("way_label",):
            catalog["level"].pop(key)
        catalog["outcome"].pop("way_won")
        strings(catalog, f"i18n/{path.name}")
    return found


#: The word in any of its innocent uses, each as the texts have it: a direction, a road,
#: a manner of doing something, never a level's arrangements.
INNOCENT_WAYS = [
    "watch which way they look",
    "come back this way",
    "This way you can see",
    "Python's own way",
    "two ways to wait",
    "This is the way home",
    "back the same way",
    "the shortest way",
    "check which way Dask",
    "in any of the four ways",
    "The way in",
    "somewhere on the way",
    "Both ways will",
    "a long way",
    "in a good way",
    "look this way",
    "which way Dask looks",
    "look the same way",
    "on the way home",
    "another way to cross",
    "When is each way handy",
    "goes the right way",
    "choose the way by it",
    "the same way to the cell",
    "The way goes on",
    "along the way",
    "on your way",
    "the way down",
    "chose your way",
    "this way the flying",
    "looks this way",
    "find our way",
    "know the way",
    "is in my way",
    "is in the way",
    "That way cannot",
    "The way the",
    "de la misma manera",
    "Hay una manera de encontrar",
    "a way to find all the things",
]
WAY_WORD = re.compile(r"\b(ways?|maneras?)\b", re.IGNORECASE)


def test_no_text_the_child_reads_tells_of_a_level_s_ways():
    """D204: `manera` and `way` only in their innocent uses, which the list names."""
    for where, text in child_texts():
        for found in WAY_WORD.finditer(text):
            near = text[max(0, found.start() - 30) : found.end() + 30]
            assert any(innocent in near for innocent in INNOCENT_WAYS), f"{where}: …{near}…"


#: The turns of phrase D224 rules out in Spanish: a broom untied, where its knot is; and
#: a sentence that ends, does, finishes or makes *la paja*.
UNTIED_BROOMS = [
    r"\bdes[aá]t\w*\s+(una|la|las|esa|cada|todas\s+las)\s+escobas?\b",
    r"\bescobas?\b[^.!?]{0,30}\bdesatad[ao]s?\b",
    r"\bdes[aá]t\w*las?\b",
    r"\bdesatar\s+cada\s+una\b",
]
STRAW_DONE = [
    r"\b(termin\w*|acab\w*|hac(er|emos|éis|es|e|en)|hago|hice|hizo|hech[oa]s?)\s+(con\s+)?la\s+paja\b",
]


def test_no_spanish_text_unties_a_broom_or_ends_the_straw():
    """D224: what is untied is the knot, never the broom; *la paja* names only where the
    brooms lie. Comments of a starting code are read too."""
    for where, text in child_texts():
        if "/text.en.json" in where or where.endswith("en.md") or "i18n/en.json" in where:
            continue
        for pattern in UNTIED_BROOMS + STRAW_DONE:
            for line in text.split("\n"):
                found = re.search(pattern, line, re.IGNORECASE)
                assert not found, f"{where}: …{line.strip()[:120]}…"


@pytest.mark.parametrize(
    "path", sorted(CONTENT.glob("levels/*/level.json")), ids=lambda p: p.parent.name
)
def test_a_level_with_ways_says_what_may_differ_and_never_names_them(path):
    """D204: `changes` in every language where the level has ways; `ways` nowhere."""
    ways = json.loads(path.read_text(encoding="utf-8")).get("ways")
    for lang in LANGUAGES:
        text = json.loads((path.parent / f"text.{lang}.json").read_text(encoding="utf-8"))
        assert "ways" not in text
        if ways:
            assert isinstance(text.get("changes"), str) and text["changes"].strip()
        else:
            assert "changes" not in text


#: The shed's order (D217, sprint 43's 2.4): the if inside the for and the check right
#: after the wall, then the comparisons, one broom, and all of them.
SHED_ORDER = [
    "level:the-brooms-on-the-wall",
    "lesson:checking-each",
    "level:the-check",
    "lesson:less-or-greater",
    "level:the-nearest-broom",
    "level:the-brooms-in-the-straw",
    "story:the-flying-lesson",
]


def test_the_shed_goes_from_the_easy_to_the_hard():
    items = course()
    start = items.index(SHED_ORDER[0])
    assert items[start : start + len(SHED_ORDER)] == SHED_ORDER


#: A comment line that a sentence goes on from: it does not end as a sentence or a
#: clause does, and the next line is a comment too.
GOES_ON = re.compile(r"[^.:!?]$")


@pytest.mark.parametrize(
    "path", sorted(CONTENT.glob("levels/*/text.*.json")), ids=lambda p: f"{p.parent.name}-{p.stem}"
)
def test_a_comment_of_a_starting_code_is_one_line_a_sentence(path):
    """D223: no sentence of a comment is cut into several `#` lines to fit a width; the
    editor wraps a line that does not fit."""
    lines = json.loads(path.read_text(encoding="utf-8")).get("starting_code", "").split("\n")
    for line, after in zip(lines, lines[1:], strict=False):
        said, next_said = line.strip().removeprefix("#").strip(), after.strip()
        if line.strip().startswith("#") and said and next_said.startswith("#"):
            assert not GOES_ON.search(said), f"{path.parent.name}: {line!r} goes on in {after!r}"


@pytest.mark.parametrize("level", ["the-nearest-broom", "the-brooms-in-the-straw"])
@pytest.mark.parametrize("lang", LANGUAGES)
def test_a_long_program_is_given_as_comments_one_for_each_instruction(level, lang):
    """D218: every line of the starting code is empty, spaces or a comment; an indented
    comment, or the comments that go on from it, is followed by a line of spaces at
    least as deep, where the line it asks for is written; no line of code."""
    text = json.loads(
        (CONTENT / "levels" / level / f"text.{lang}.json").read_text(encoding="utf-8")
    )
    lines = text["starting_code"].split("\n")
    assert lines[-1] == ""
    lines = lines[:-1]
    for number, line in enumerate(lines):
        assert line.strip() == "" or line.lstrip().startswith("#"), f"{level} {lang}: {line!r}"
        depth = len(line) - len(line.lstrip())
        if line.strip().startswith("#") and depth > 0:
            # Under the comment, or under the comments that go on from it, the room.
            below = next(
                (later for later in lines[number + 1 :] if not later.strip().startswith("#")), None
            )
            assert below is not None and below.strip() == "" and len(below) >= depth, (
                f"{level} {lang}: no room under {line!r}"
            )
    comments = [line for line in lines if line.strip().startswith("#")]
    names = (
        "find_nearest",
        "find_all",
        "move_left",
        "move_right",
        "move_up",
        "move_down",
        "broom.untie",
    )
    for name in names:
        if name == "find_all" and level == "the-nearest-broom":
            continue
        if name == "find_nearest" and level == "the-brooms-in-the-straw":
            continue
        assert any(name in line for line in comments), f"{level} {lang}: no comment names {name}"


def test_the_opening_tells_its_first_two_steps_over_its_still():
    """D251: the castle and the letter over the welcome's painting, the journey on."""
    path = CONTENT / "stories" / "the-letter" / "story.json"
    story = json.loads(path.read_text(encoding="utf-8"))
    assert story["opening"] is True
    stills = [step.get("still", False) for step in story["steps"]]
    assert stills == [True, True, False, False, False]
