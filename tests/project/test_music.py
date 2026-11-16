"""The music's themes (D192): each chapter names one, each parses, and each loops on a
bar, with no note ringing over a section's end; the files are what the score in
tools/sound/compose.py makes."""

import importlib.util
import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
MUSIC = REPO / "content" / "music"
THEMES = sorted(MUSIC.glob("*.json"))
CHAPTERS = sorted((REPO / "content" / "chapters").glob("*/chapter.json"))
KINDS = {"celesta", "strings", "pluck", "harp", "flute", "drum"}


def compose():
    spec = importlib.util.spec_from_file_location(
        "compose", REPO / "tools" / "sound" / "compose.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_there_are_the_five_themes():
    assert {path.stem for path in THEMES} == {
        "arrival",
        "the-library",
        "the-passages",
        "the-broom",
        "the-familiar",
    }


@pytest.mark.parametrize("path", CHAPTERS, ids=lambda p: p.parent.name)
def test_every_chapter_names_a_theme_there_is(path):
    music = json.loads(path.read_text(encoding="utf-8")).get("music")
    assert music and (MUSIC / f"{music}.json").is_file(), f"{path.parent.name} names no theme"


@pytest.mark.parametrize("path", THEMES, ids=lambda p: p.stem)
def test_a_theme_parses_and_loops_on_a_bar(path):
    theme = json.loads(path.read_text(encoding="utf-8"))
    assert theme["id"] == path.stem
    assert theme["tempo"] > 0
    beats, unit = theme["metre"]
    assert beats in (2, 3, 4, 6) and unit in (4, 8)
    voices = theme["voices"]
    assert all(voice["kind"] in KINDS and 0 < voice["volume"] <= 1 for voice in voices.values())
    full, quiet = theme["arrangements"]["full"], theme["arrangements"]["quiet"]
    assert set(full) == set(voices) and set(quiet) < set(full)
    sections = {section["id"]: section for section in theme["sections"]}
    order = theme.get("order", list(sections))
    assert set(order) == set(sections)
    assert 48 <= sum(sections[name]["bars"] for name in order) <= 64
    assert 2 <= len(sections) <= 3
    for section in sections.values():
        length = section["bars"] * beats
        for voice, notes in section["notes"].items():
            assert voice in voices
            for pitch, start, beats_long, loudness in notes:
                assert 24 <= pitch <= 108
                assert 0 < loudness <= 1
                assert 0 <= start and start + beats_long <= length + 1e-6, (
                    section["id"],
                    voice,
                    start,
                )


def test_the_files_are_what_the_score_makes():
    score = compose()
    for path in THEMES:
        assert json.loads(path.read_text(encoding="utf-8")) == score.THEMES[path.stem](), path.stem
