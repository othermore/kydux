"""The course in content/ holds together (D32, D33, D41): its chapters name items
that exist, every lesson is in every language with the same pages and no HTML,
every story is staged on its scene and said in every language (D74), what
a lesson explains is taught by the level after it, its Try it runs there, and in a
chapter with lessons, a level teaches nothing a lesson before it has not explained."""

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
#: The concepts a lesson may teach, beside the API's names (D60).
CONCEPTS = {"arguments", "comments", "print", "strings"}
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
        assert len(TRY.findall(text)) <= 1, f"{path.name}/{lang}.md has more than one Try it"
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
def test_a_lesson_s_try_it_runs_in_the_level_after_it(path, lang, gender):
    text = for_wizard((path / f"{lang}.md").read_text(encoding="utf-8"), gender)
    found = TRY.findall(text)
    if not found:
        return
    level = level_after(f"lesson:{path.name}")
    result = run_code(Level.from_directory(level), found[0])
    assert result.status != "error", result.error
    # The example is the level's own: it bumps into nothing and is refused nothing.
    stumbles = [e for e in result.events if e.kind in ("bump", "blocked")]
    assert not stumbles, f"{path.name}'s example stumbles in {level.name}: {stumbles[0].data}"


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
    from kydux_world.level import read_scene, story_on_scene

    story = json.loads((path / "story.json").read_text(encoding="utf-8"))
    story_on_scene(story, read_scene(CONTENT / "scenes", story.get("scene"), story["id"]))
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
    """The concepts a piece of code needs known (D60): a comment, an action given
    something in its brackets, a string, print."""
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
            if isinstance(node.func, ast.Name) and node.func.id == "print":
                used.add("print")
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            used.add("strings")
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
    """A level's starting code and solution use no comment, argument, string or print
    that a lesson before it has not explained (D60)."""
    codes = {"solution": (directory / "solution.py").read_text(encoding="utf-8")}
    for lang in LANGUAGES:
        text = json.loads((directory / f"text.{lang}.json").read_text(encoding="utf-8"))
        for gender in ("girl", "boy"):
            codes[f"starting code, {lang}"] = for_wizard(text["starting_code"], gender)
    for where, code in codes.items():
        unknown = concepts_used(code) - known
        assert not unknown, f"{item}'s {where} uses {sorted(unknown)} before a lesson explains it"


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


def walked(item_id: str) -> list[tuple[int, int]]:
    """The tiles the wizard stands on in a level's solution, from its start to its end,
    in its first way."""
    directory = CONTENT / "levels" / item_id
    level = Level.from_directory(directory)
    level = level.ways[0][1] if level.ways else level
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
    end, the tile its solution leaves the wizard on."""
    ended = level_json(before).get("end") or list(walked(before)[-1])
    assert level_json(after)["start"] == ended


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
    `friend` is the friend of the wizard's other gender, Nuri or Teku (D77)."""
    speaker = json.loads((path / "lesson.json").read_text(encoding="utf-8")).get("speaker")
    characters = json.loads((ROOT / "i18n" / "en.json").read_text(encoding="utf-8"))["characters"]
    assert speaker == "friend" or speaker in characters, (
        f"{path.name} names no teacher of the story's"
    )
