"""The music's themes (D192): each chapter names one, each parses, and each loops on a
bar, with no note ringing over a section's end; the files are what the score in
tools/sound/compose.py makes. A theme has one set of voices and no arrangements (D210).
Beside the broom's and the passages' themes is a second, `-b`, for the owner's ear
(D209)."""

import importlib.util
import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
MUSIC = REPO / "content" / "music"
THEMES = sorted(MUSIC.glob("*.json"))
CHAPTERS = sorted((REPO / "content" / "chapters").glob("*/chapter.json"))
KINDS = {"celesta", "strings", "pluck", "harp", "flute", "piano", "drum"}


def compose():
    spec = importlib.util.spec_from_file_location(
        "compose", REPO / "tools" / "sound" / "compose.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CHAPTER_THEMES = ("arrival", "the-library", "the-passages", "the-broom", "the-familiar")


def test_there_are_the_chapters_themes_and_the_two_second_ones():
    assert {path.stem for path in THEMES} == {*CHAPTER_THEMES, "the-broom-b", "the-passages-b"}


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
    # One set of voices, every one heard wherever the theme is (D210).
    assert "arrangements" not in theme
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


def loaded(name: str) -> dict:
    return json.loads((MUSIC / f"{name}.json").read_text(encoding="utf-8"))


def by_bar(notes: list, bar: int) -> dict[int, list]:
    found: dict[int, list] = {}
    for note in notes:
        found.setdefault(int(note[1] // bar), []).append(note)
    return found


def test_the_library_s_piano_and_celesta_take_turns_and_the_piano_runs_in_eighths():
    """D209: a phrase of one, then the other's answer, never both on the tune at once;
    the piano's phrases have runs of three or four eighth notes, and no note longer than
    a bar."""
    theme = loaded("the-library")
    assert theme["voices"]["piano"]["kind"] == "piano" and "flute" not in theme["voices"]
    bar = theme["metre"][0]
    for section in theme["sections"]:
        piano = by_bar(section["notes"]["piano"], bar)
        celesta = by_bar(section["notes"]["celesta"], bar)
        assert piano and celesta and not set(piano) & set(celesta), section["id"]
        assert all(length <= bar for _, _, length, _ in section["notes"]["piano"])
        eighths = [length == 0.5 for _, _, length, _ in section["notes"]["piano"]]
        assert any(all(eighths[i : i + 3]) for i in range(len(eighths) - 2))


@pytest.mark.parametrize("name", ["the-broom", "the-broom-b"])
def test_the_broom_runs_fast_in_four_over_a_low_voice_that_never_stops(name):
    """D209: 150 to 170 beats a minute in four; the low voice in eighth notes on every
    half beat of the loop; the drum on every beat, but in the bar where the second's
    stops; the tune's loop ends on a note held to its end, in the air."""
    theme = loaded(name)
    assert 150 <= theme["tempo"] <= 170 and theme["metre"] == [4, 4]
    assert "flute" not in {voice["kind"] for voice in theme["voices"].values()}
    for section in theme["sections"]:
        length = section["bars"] * 4
        starts = sorted(note[1] for note in section["notes"]["bass"])
        assert starts == [i / 2 for i in range(length * 2)]
        drums = {note[1] for note in section["notes"]["drum"]}
        assert drums <= {float(b) for b in range(length)}
        # Every beat, but for the bar where the second one's drum stops, its surprise.
        assert len(drums) >= length - (4 if name == "the-broom-b" else 0)
    last = {section["id"]: section for section in theme["sections"]}[theme["order"][-1]]
    end = last["bars"] * 4
    assert max(start + long for _, start, long, _ in last["notes"]["tune"]) == end


@pytest.mark.parametrize("name", ["the-passages", "the-passages-b"])
def test_the_passages_are_slow_low_and_sparse_with_no_tune(name):
    """D209: slow; the pad low; the celesta's and the harp's notes far apart, but for an
    echo's repeated note; the second with less in it than the first."""
    theme = loaded(name)
    assert theme["tempo"] <= 60
    for section in theme["sections"]:
        assert max(note[0] for note in section["notes"]["pad"]) <= 52
        for voice in ("celesta", "harp"):
            notes = sorted(section["notes"].get(voice, []), key=lambda note: note[1])
            for one, other in zip(notes, notes[1:], strict=False):
                assert other[1] - one[1] >= 1.5 or other[0] == one[0], (voice, one, other)


def test_the_passages_b_has_less_in_it():
    def count(name: str) -> int:
        return sum(len(n) for s in loaded(name)["sections"] for n in s["notes"].values())

    assert count("the-passages-b") < count("the-passages")
