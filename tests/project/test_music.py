"""The music's themes (D192): each chapter names one, the year's ending has one of its own
(D313), each parses, and each loops on a bar, with no note ringing over a section's end;
the files are what the score in tools/sound/compose.py makes. A theme has one set of
voices and no arrangements (D210), and no candidate stands beside them (D209). Every theme
a story names, at its top or in a step (D314), is one of them, and so is the movement it
names of it (D316)."""

import importlib.util
import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
MUSIC = REPO / "content" / "music"
THEMES = sorted(MUSIC.glob("*.json"))
CHAPTERS = sorted((REPO / "content" / "chapters").glob("*/chapter.json"))
KINDS = {
    "celesta",
    "strings",
    "pluck",
    "harp",
    "flute",
    "piano",
    "brass",
    "drum",
    "snare",
    "organ",
    "cello",
    "cymbal",
}


def compose():
    spec = importlib.util.spec_from_file_location(
        "compose", REPO / "tools" / "sound" / "compose.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CHAPTER_THEMES = ("arrival", "the-library", "the-passages", "the-broom", "the-familiar")
ENDING_THEME = "the-truth"


def test_there_are_the_chapters_themes_and_the_ending_s_and_no_other():
    assert {path.stem for path in THEMES} == {*CHAPTER_THEMES, ENDING_THEME}


def test_no_chapter_has_the_ending_s_theme():
    for path in CHAPTERS:
        assert json.loads(path.read_text(encoding="utf-8")).get("music") != ENDING_THEME


@pytest.mark.parametrize("path", CHAPTERS, ids=lambda p: p.parent.name)
def test_every_chapter_names_a_theme_there_is(path):
    music = json.loads(path.read_text(encoding="utf-8")).get("music")
    assert music and (MUSIC / f"{music}.json").is_file(), f"{path.parent.name} names no theme"


STORIES = sorted((REPO / "content" / "stories").glob("*/story.json"))


@pytest.mark.parametrize("path", STORIES, ids=lambda p: p.parent.name)
def test_every_theme_a_story_names_is_there(path):
    story = json.loads(path.read_text(encoding="utf-8"))
    named = [story.get("music"), *(step.get("music") for step in story.get("steps", []))]
    for cue in filter(None, named):
        # A theme, or a theme and a movement of it after a slash (D316).
        theme, _, movement = cue.partition("/")
        file = MUSIC / f"{theme}.json"
        assert file.is_file(), f"{path.parent.name} names no theme {theme}"
        movements = json.loads(file.read_text(encoding="utf-8")).get("movements", [])
        assert not movement or movement in {each["id"] for each in movements}, (
            f"{path.parent.name} names no movement {cue}"
        )


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
    movements = theme.get("movements", [])
    if movements:
        # A theme told in movements (D316): each some sections once and then some over
        # and over, every section in one of them, each coming in on a bar or on a beat.
        assert len({movement["id"] for movement in movements}) == len(movements)
        for movement in movements:
            assert movement["round"] and movement.get("enters", "bar") in ("bar", "beat")
            assert set(movement.get("once", []) + movement["round"]) <= set(sections)
        told = [name for each in movements for name in each.get("once", []) + each["round"]]
        assert sorted(told) == sorted(sections)
    else:
        assert 48 <= sum(sections[name]["bars"] for name in order) <= 64
        assert 2 <= len(sections) <= 3
    for section in sections.values():
        length = section["bars"] * beats
        # A section's own tempo is one, or one to start at and one to end at (D315).
        own = section.get("tempo", theme["tempo"])
        assert all(tempo > 0 for tempo in (own if isinstance(own, list) else [own]))
        assert not isinstance(own, list) or len(own) == 2
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


def test_the_broom_runs_fast_in_four_over_a_low_voice_that_never_stops():
    """D209: 150 to 170 beats a minute in four; the low voice in eighth notes on every
    half beat of the loop; the drum on every beat; the tune's loop ends on a note held to
    its end, in the air."""
    theme = loaded("the-broom")
    assert 150 <= theme["tempo"] <= 170 and theme["metre"] == [4, 4]
    assert "flute" not in {voice["kind"] for voice in theme["voices"].values()}
    for section in theme["sections"]:
        length = section["bars"] * 4
        starts = sorted(note[1] for note in section["notes"]["bass"])
        assert starts == [i / 2 for i in range(length * 2)]
        assert {note[1] for note in section["notes"]["drum"]} == {float(b) for b in range(length)}
    last = {section["id"]: section for section in theme["sections"]}[theme["order"][-1]]
    end = last["bars"] * 4
    assert max(start + long for _, start, long, _ in last["notes"]["tune"]) == end


def test_the_passages_tick_on_every_eighth_note_under_a_far_horn_and_tune():
    """D213: in four at a walk's pace, with no celesta; the plucked clock never stops,
    the piano's low notes come three, three and two, and the horn and the piano's tune
    are the quietest voices, under the clock."""
    theme = loaded("the-passages")
    assert 100 <= theme["tempo"] <= 126 and theme["metre"] == [4, 4]
    voices = theme["voices"]
    assert "celesta" not in {voice["kind"] for voice in voices.values()}
    assert voices["horn"]["kind"] == "brass" and voices["snare"]["kind"] == "snare"
    far = max(voices["horn"]["volume"], voices["tune"]["volume"])
    assert all(
        far < voice["volume"] for name, voice in voices.items() if name not in ("horn", "tune")
    )
    for section in theme["sections"]:
        length = section["bars"] * 4
        assert sorted(note[1] for note in section["notes"]["tick"]) == [
            i / 2 for i in range(length * 2)
        ]
        assert {note[1] % 4 for note in section["notes"]["bass"]} == {0.0, 1.5, 3.0}
        assert section["notes"]["horn"]


def test_the_familiar_is_two_flutes_in_three_with_the_celesta_s_tune_in_the_middle():
    """D296: slow in three; two flutes, the second the quieter and a bar after the first in
    the outer parts; the celesta silent in the first part and on the tune in every bar of
    the middle one; the harp a note a beat at first, then running in eighth notes."""
    theme = loaded("the-familiar")
    assert 80 <= theme["tempo"] <= 96 and theme["metre"] == [3, 4]
    voices = theme["voices"]
    assert [name for name, voice in voices.items() if voice["kind"] == "flute"] == [
        "flute",
        "second",
    ]
    assert voices["second"]["volume"] < voices["flute"]["volume"]
    sections = {section["id"]: section for section in theme["sections"]}
    first, middle, last = (sections[name]["notes"] for name in theme["order"])
    beats = sections[theme["order"][0]]["bars"] * 3
    assert all(sections[name]["bars"] * 3 == beats for name in theme["order"])
    for outer in (first, last):
        assert min(note[1] for note in outer["flute"]) == 0
        assert min(note[1] for note in outer["second"]) == 3
    assert "celesta" not in first
    assert set(by_bar(middle["celesta"], 3)) == set(range(beats // 3))
    assert sorted(note[1] for note in first["harp"]) == [float(beat) for beat in range(beats)]
    for running in (middle, last):
        assert sorted(note[1] for note in running["harp"]) == [i / 2 for i in range(beats * 2)]


def test_the_truth_is_the_familiar_s_tune_grave_told_in_movements_up_to_a_drum_kit():
    """D313, D316: it starts slower than the familiar's theme and in three as it is; its
    tune is the familiar's first flute's with each B a half step lower, which a piano has
    alone an octave under it over its left hand for eight bars. Its movements are the
    piano alone, the organ's part with the cellos and a drum, the revelation, a silence
    and the major's. The revelation speeds up once, from the theme's tempo to one faster
    that its two sections keep over and over: every voice sounds in them, the violins in
    octaves, the cellos in eighth notes, a kick on every bar's first beat, a snare on its
    third, a hat on every eighth note, a crash where each half starts. The silence has no
    more than four voices, each soft. The major's movement plays the tune with an F sharp
    and a B natural, every pitched voice in it, and then a piano has it alone."""
    theme = loaded(ENDING_THEME)
    familiar = loaded("the-familiar")
    assert theme["tempo"] < familiar["tempo"] and theme["metre"] == [3, 4]
    sections = {section["id"]: section for section in theme["sections"]}
    movements = {movement["id"]: movement for movement in theme["movements"]}
    assert list(movements) == ["alone", "name", "revelation", "silence", "love"]
    kinds = {voice: theme["voices"][voice]["kind"] for voice in theme["voices"]}
    unpitched = ("drum", "snare", "cymbal")

    def sounding(section: dict) -> set[str]:
        return {kinds[voice] for voice in section["notes"]}

    # The piano alone: the familiar's tune, grave.
    (first,) = (sections[name] for name in movements["alone"]["round"])
    assert "once" not in movements["alone"] and "tempo" not in first
    consort = {section["id"]: section for section in familiar["sections"]}[familiar["order"][0]]
    grave = sorted(
        (start, pitch - 1 if pitch % 12 == 11 else pitch, length)
        for pitch, start, length, _ in consort["notes"]["flute"]
    )
    low = sorted(
        (start, pitch + 12, length)
        for pitch, start, length, loudness in first["notes"]["piano"]
        if loudness > 0.5
    )
    assert low == grave
    alone = {
        voice for voice, notes in first["notes"].items() if any(note[1] < 8 * 3 for note in notes)
    }
    assert alone == {"piano", "left"}
    # The organ's part: at the theme's tempo, with the cellos and a drum from its first
    # bar, no snare and no cymbal.
    (named,) = (sections[name] for name in movements["name"]["round"])
    assert "tempo" not in named
    entering = {kinds[voice] for voice, notes in named["notes"].items() if notes[0][1] == 0}
    assert {"organ", "cello", "drum"} <= entering
    assert not {"snare", "cymbal"} & sounding(named)
    # The revelation: the way up once, then the height over and over.
    (rise,) = (sections[name] for name in movements["revelation"]["once"])
    high = [sections[name] for name in movements["revelation"]["round"]]
    begins, ends = rise["tempo"]
    assert begins == theme["tempo"] < ends <= 1.4 * theme["tempo"]
    assert rise["bars"] <= 8 and {"snare", "drum", "organ", "brass"} <= sounding(rise)
    cellos = next(voice for voice, kind in kinds.items() if kind == "cello")
    for section in high:
        assert section["tempo"] == ends
        assert set(section["notes"]) == set(theme["voices"])
        bars = range(section["bars"])
        notes = section["notes"]
        assert {bar * 3.0 for bar in bars} <= {
            start for pitch, start, _, _ in notes["kit"] if pitch < 36
        }
        assert {bar * 3.0 + 2 for bar in list(bars)[:-1]} <= {note[1] for note in notes["snare"]}
        assert sorted(note[1] for note in notes["hat"]) == [i / 2 for i in range(len(bars) * 6)]
        assert {0.0, len(bars) * 1.5} <= {note[1] for note in notes["crash"]}
        eighths = {note[1] for note in notes[cellos] if note[2] == 0.5}
        assert {beat / 2 for beat in range(6)} <= eighths
        tune = {(note[1], note[0]) for note in notes["violins"] if note[1] >= len(bars) * 1.5}
        assert all(
            (start, pitch - 12) in tune or (start, pitch + 12) in tune for start, pitch in tune
        )
    # The silence: on a beat, a few soft voices.
    (hush,) = (sections[name] for name in movements["silence"]["round"])
    assert movements["silence"]["enters"] == "beat" and len(hush["notes"]) <= 4
    assert all(note[3] <= 0.35 for notes in hush["notes"].values() for note in notes)
    # The major's: every pitched voice once, then a piano alone, in D major both.
    (glory,) = (sections[name] for name in movements["love"]["once"])
    (after,) = (sections[name] for name in movements["love"]["round"])
    assert movements["love"]["enters"] == "beat"
    assert {kind for kind in kinds.values() if kind not in unpitched} <= sounding(glory)
    assert sounding(after) <= {"piano", "strings"}
    for section in (glory, after):
        classes = {
            note[0] % 12
            for voice, notes in section["notes"].items()
            if kinds[voice] not in unpitched
            for note in notes
        }
        assert {6, 11} <= classes and not {5, 10} & classes, section["id"]
    closing = {
        note[0] % 12
        for voice, notes in glory["notes"].items()
        if kinds[voice] not in unpitched
        for note in notes
        if note[1] >= (glory["bars"] - 2) * 3
    }
    assert closing == {2, 6, 9}
    # The whole theme, as the debug page plays it, tells the movements in their order.
    told = [name for each in movements.values() for name in each.get("once", []) + each["round"]]
    assert theme["order"] == told
