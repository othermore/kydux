"""The course in content/ holds together (D32, D33, D41): its chapters name items
that exist, every lesson is in every language with the same pages and no HTML, what
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
        assert kind in ("lesson", "level"), item
        folder = CONTENT / f"{kind}s" / item_id
        assert (folder / f"{kind}.json").is_file(), f"{item} names nothing in content/"


def test_every_item_is_in_the_course_once():
    items = course()
    assert len(items) == len(set(items))
    for path in LESSONS:
        assert f"lesson:{path.name}" in items, f"the lesson {path.name} is in no chapter"
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
    missing = [name for name in teaches if name not in api]
    assert not missing, f"{level.name} does not teach {missing}"


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
        api = level_api(item_id)
        if item in chapter(path)["items"]:
            unexplained = [name for name in api if name not in explained]
            assert not unexplained, f"{item_id} teaches {unexplained}, which no lesson explained"
        explained.update(api)
