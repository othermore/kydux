#!/usr/bin/env python3
"""The chapters' themes (D192), written here as a score and made into the notes the page
plays, content/music/<id>.json.

    tools/sound/compose.py            # every theme
    tools/sound/compose.py the-broom  # one

Each theme is original, written for Kydux and shipped under the GPL as the code is. Its
melodies are written out a bar at a time, `a4/2 d5 f#5/2 a5`: a note's name, its octave
(c4 is the middle C) and its length in beats after a slash (one when none is given), `r`
a rest, `|` the end of a bar, which must hold the metre's beats. Its harmony is a chord a
bar (`Dm | Bb | A7`, two in a bar split it), from which the accompaniments are made: a
held pad led smoothly from chord to chord, a bass, a waltz's two chords after the bass,
arpeggios, a descant of long chord notes, a bell on a bar's first beat, a soft drum.
The file the page reads holds only the notes, by section and voice.
"""

import json
import re
import sys
from itertools import combinations
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "content" / "music"

NAMES = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}
QUALITIES = {
    "": (0, 4, 7),
    "m": (0, 3, 7),
    "7": (0, 4, 7, 10),
    "maj7": (0, 4, 7, 11),
    "m7": (0, 3, 7, 10),
    "m7b5": (0, 3, 6, 10),
    "dim": (0, 3, 6),
    "6": (0, 4, 7, 9),
    "m6": (0, 3, 7, 9),
    "sus4": (0, 5, 7),
    "add9": (0, 4, 7, 2),
}


def pitch(name: str) -> int:
    """A note's MIDI number from its name: `c4` is 60, `f#5` 78, `bb3` 58."""
    found = re.fullmatch(r"([a-g])(#|b)?(\d)", name)
    if not found:
        raise ValueError(f"no note {name!r}")
    letter, accidental, octave = found.groups()
    shift = {"#": 1, "b": -1}.get(accidental or "", 0)
    return 12 * (int(octave) + 1) + NAMES[letter] + shift


def line(text: str, bar: int, loud: float = 0.6) -> list[list[float]]:
    """A melody's notes, written a bar at a time; each bar must hold `bar` beats."""
    notes: list[list[float]] = []
    at = 0.0
    for number, written in enumerate(text.split("|"), 1):
        start = at
        for token in written.split():
            name, _, length = token.partition("/")
            beats = float(length) if length else 1.0
            if name != "r":
                notes.append([pitch(name), at, beats, loud])
            at += beats
        if abs(at - start - bar) > 1e-9:
            raise ValueError(
                f"bar {number} of {text[:30]!r}... holds {at - start} beats, not {bar}"
            )
    return notes


def chord(symbol: str) -> tuple[int, tuple[int, ...]]:
    """A chord's root as a pitch class and its intervals, from `F`, `Dm`, `Bb7`, `C#m7b5`."""
    found = re.fullmatch(r"([A-G])(#|b)?(.*)", symbol)
    if not found or found.group(3) not in QUALITIES:
        raise ValueError(f"no chord {symbol!r}")
    letter, accidental, quality = found.groups()
    root = (NAMES[letter.lower()] + {"#": 1, "b": -1}.get(accidental or "", 0)) % 12
    return root, QUALITIES[quality]


def harmony(text: str, bar: int) -> list[tuple[float, float, int, tuple[int, ...]]]:
    """The chords of a progression, a bar between bars, each as (start, length, root,
    intervals); two chords in a bar take half of it each."""
    chords = []
    for number, written in enumerate(text.split("|")):
        symbols = written.split()
        share = bar / len(symbols)
        for index, symbol in enumerate(symbols):
            root, intervals = chord(symbol)
            chords.append((number * bar + index * share, share, root, intervals))
    return chords


def tones(root: int, intervals: tuple[int, ...], low: int, high: int) -> list[int]:
    """Every pitch of a chord between `low` and `high`."""
    classes = {(root + interval) % 12 for interval in intervals}
    return [p for p in range(low, high + 1) if p % 12 in classes]


def voicing(
    root: int,
    intervals: tuple[int, ...],
    low: int,
    high: int,
    count: int,
    before: list[int] | None,
) -> list[int]:
    """`count` notes of a chord in a range, every one of its notes among them where they
    fit, moved as little as can be from the voicing before it."""
    classes = {(root + interval) % 12 for interval in intervals[:count]}
    candidates = [
        list(chosen)
        for chosen in combinations(tones(root, intervals, low, high), count)
        if classes <= {p % 12 for p in chosen} and chosen[-1] - chosen[0] <= 14
    ]
    if not candidates:
        raise ValueError("no voicing in the range")
    if before is None:
        middle = (low + high) / 2
        return min(candidates, key=lambda chosen: abs(sum(chosen) / count - middle))
    return min(
        candidates, key=lambda chosen: sum(abs(a - b) for a, b in zip(chosen, before, strict=True))
    )


def pad(progression, low: int, high: int, loud: float, count: int = 3) -> list[list[float]]:
    """The chords held, each for its length, led smoothly from one to the next."""
    notes, before = [], None
    for start, length, root, intervals in progression:
        before = voicing(root, intervals, low, high, count, before)
        notes += [[p, start, length, loud] for p in before]
    return notes


def bass(
    progression,
    beats: list[float],
    octave_low: int,
    loud: float,
    length: float = 1.0,
    fifth: list[float] | None = None,
) -> list[list[float]]:
    """The chord's root on the beats given within each chord, its fifth on `fifth`'s."""
    notes = []
    for start, span, root, _ in progression:
        low = octave_low + (root - octave_low) % 12
        for beat in beats:
            if beat < span:
                notes.append([low, start + beat, min(length, span - beat), loud])
        for beat in fifth or []:
            if beat < span:
                notes.append([low + 7, start + beat, min(length, span - beat), loud * 0.85])
    return notes


def after_beat(
    progression, beats: list[float], low: int, high: int, loud: float, length: float = 0.8
) -> list[list[float]]:
    """A waltz's chords after its bass: the chord, short, on each beat given."""
    notes, before = [], None
    for start, span, root, intervals in progression:
        before = voicing(root, intervals, low, high, 3, before)
        for beat in beats:
            if beat < span:
                notes += [[p, start + beat, length, loud] for p in before]
    return notes


def arpeggio(
    progression, pattern: list[int], step: float, low: int, loud: float, accent: float = 0.0
) -> list[list[float]]:
    """A chord's notes one after another, `step` beats each, by `pattern`: 0 the lowest
    note of the chord from `low`, 1 the next above it, and so on."""
    notes = []
    for start, span, root, intervals in progression:
        ladder = tones(root, intervals[:3] if len(intervals) > 3 else intervals, low, low + 36)
        count = int(round(span / step))
        for index in range(count):
            p = ladder[pattern[index % len(pattern)]]
            notes.append(
                [p, start + index * step, step * 1.5, loud + (accent if index == 0 else 0.0)]
            )
    return notes


def descant(progression, low: int, high: int, loud: float) -> list[list[float]]:
    """A long chord note for each chord, high, each the nearest to the one before."""
    notes, before = [], None
    for start, span, root, intervals in progression:
        choices = tones(root, intervals, low, high)
        p = choices[-1] if before is None else min(choices, key=lambda c: (abs(c - before), -c))
        notes.append([p, start, span, loud])
        before = p
    return notes


def bells(progression, low: int, high: int, loud: float, every: int = 1) -> list[list[float]]:
    """The top of the chord rung on the first beat of every `every`-th chord."""
    notes = []
    for index, (start, _, root, intervals) in enumerate(progression):
        if index % every == 0:
            notes.append([tones(root, intervals, low, high)[-1], start, 1.0, loud])
    return notes


def drum(
    bars: list[int], bar: int, beats: list[float], low: int, loud: float
) -> list[list[float]]:
    """A soft drum on the beats given of the bars given (counted from 1)."""
    return [[low, (number - 1) * bar + beat, 1.0, loud] for number in bars for beat in beats]


def shifted(notes: list[list[float]], bars: int, bar: int) -> list[list[float]]:
    """Notes moved later by whole bars."""
    return [[p, start + bars * bar, length, loud] for p, start, length, loud in notes]


def section(name: str, bars: int, bar: int, **voices: list[list[float]]) -> dict:
    """A section of `bars` bars of `bar` beats: its notes by voice, each rounded, and none
    ringing past its end, so that the next section, or the loop's start, follows clean."""
    ends = bars * bar
    notes = {}
    for voice, written in voices.items():
        if not written:
            continue
        kept = []
        for p, start, length, loud in sorted(written, key=lambda n: (n[1], n[0])):
            length = min(length, ends - start)
            kept.append([int(p), round(start, 4), round(length, 4), round(min(loud, 1.0), 3)])
        notes[voice] = kept
    return {"id": name, "bars": bars, "notes": notes}


def theme(
    id_: str,
    tempo: float,
    metre: list[int],
    voices: dict,
    full: list[str],
    quiet: list[str],
    sections: list[dict],
    order: list[str],
) -> dict:
    beats = metre[0]
    for part in sections:
        for voice, notes in part["notes"].items():
            assert voice in voices, (id_, voice)
            for p, start, length, _ in notes:
                assert 0 <= start and start + length <= part["bars"] * beats + 1e-6, (
                    id_,
                    part["id"],
                    p,
                    start,
                )
        part["notes"] = {voice: part["notes"][voice] for voice in sorted(part["notes"])}
    return {
        "id": id_,
        "tempo": tempo,
        "metre": metre,
        "voices": voices,
        "arrangements": {"full": full, "quiet": quiet},
        "sections": sections,
        "order": order,
    }


# --- Arrival: dusk, outdoors; a gentle waltz in three, strings and celesta, warm and a
# little shy.


def arrival() -> dict:
    bar = 3
    a_chords = "F | C | Dm | F | Gm | C7 | Dm | C | F | C | Am | Bb | Gm7 | C7 | C7 | F"
    a_melody = (
        "a4 c5 f5 | e5/2 d5 | d5 c5 a4 | c5/3 | g4 bb4 d5 | c5/2 bb4 | a4 g4 f4 | g4/3 | "
        "a4 c5 f5 | g5/2 f5 | e5 d5 c5 | d5/3 | f5 e5 d5 | c5/2 a4 | bb4 g4 e4 | f4/3"
    )
    a_end_chords = "F | C | Dm | F | Gm | C7 | Dm | C | F | C | Am | Bb | Gm7 | C7 | C7 | C7"
    a_end_melody = (
        "a4 c5 f5 | e5/2 d5 | d5 c5 a4 | c5/3 | g4 bb4 d5 | c5/2 bb4 | a4 g4 f4 | g4/3 | "
        "a4 c5 f5 | g5/2 f5 | e5 d5 c5 | d5/3 | f5 e5 d5 | c5/2 a4 | bb4 g4 e4 | c5/3"
    )
    b_chords = "Dm | Bb | Gm | A7 | Dm | Bb | C | C | Bb | F | Gm | F | Gm7 | Dm | C7 | C7"
    b_melody = (
        "d5/2 e5 | f5/2 e5 | d5 c5 bb4 | a4/3 | d5/2 e5 | f5/2 g5 | a5 g5 f5 | e5/3 | "
        "f5/2 d5 | c5/2 a4 | bb4 c5 d5 | c5/3 | g4 a4 bb4 | a4/2 d5 | e5 d5 c5 | e4 g4 bb4"
    )
    a = harmony(a_chords, bar)
    a_end = harmony(a_end_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "arrival",
        132,
        [3, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.8},
            "flute": {"kind": "flute", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.7},
            "bass": {"kind": "pluck", "volume": 0.75},
            "waltz": {"kind": "pluck", "volume": 0.45},
        },
        ["celesta", "flute", "strings", "bass", "waltz"],
        ["celesta", "strings", "bass"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.62),
                strings=pad(a, 53, 69, 0.45),
                bass=bass(a, [0], 41, 0.55),
                waltz=after_beat(a, [1, 2], 57, 72, 0.32, 0.5),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.6),
                celesta=bells(b, 74, 86, 0.35, every=2),
                strings=pad(b, 53, 69, 0.5),
                bass=bass(b, [0], 41, 0.55),
                waltz=after_beat(b, [1, 2], 57, 72, 0.3, 0.5),
            ),
            section(
                "a2",
                16,
                bar,
                celesta=line(a_end_melody, bar, 0.62),
                flute=descant(a_end, 74, 86, 0.32),
                strings=pad(a_end, 53, 69, 0.45),
                bass=bass(a_end, [0], 41, 0.55),
                waltz=after_beat(a_end, [1, 2], 57, 72, 0.32, 0.5),
            ),
        ],
        ["a", "b", "a2"],
    )


# --- The library: indoors, evening; harp arpeggios and a curious woodwind, quiet.


def the_library() -> dict:
    bar = 4
    a_chords = "Eb | Cm | Ab | Bb | Gm | Cm | Fm | Bb | Eb | Eb7 | Ab | Abm | Eb | C7 | Fm7 | Bb7"
    a_melody = (
        "r g4/0.5 bb4/0.5 eb5/1.5 d5/0.5 | c5 bb4/0.5 g4/0.5 c5/2 | "
        "r ab4/0.5 c5/0.5 f5/1.5 eb5/0.5 | d5/3 r | "
        "r bb4/0.5 d5/0.5 g5/1.5 f5/0.5 | eb5 d5/0.5 c5/0.5 g4/2 | ab4 c5 f5 eb5 | d5/2 bb4 r | "
        "r g4/0.5 bb4/0.5 eb5/1.5 f5/0.5 | g5 f5/0.5 eb5/0.5 db5/2 | c5 eb5 ab5/1.5 g5/0.5 | "
        "f5 eb5 b4/2 | "
        "bb4 g4/0.5 bb4/0.5 eb5/2 | e5 g5/0.5 e5/0.5 c5/2 | f5 eb5/0.5 c5/0.5 ab4 c5 | bb4 c5 d5/2"
    )
    b_chords = "Cm | Bb | Ab | G7 | Cm | Fm | D7 | G | Ab | Bb | Gm | Cm | Fm | G7 | Ab | Bb7"
    b_melody = (
        "c6/0.5 eb6/0.5 g6 f6/0.5 eb6/0.5 d6 | eb6/2 d6 bb5 | "
        "c6/0.5 eb6/0.5 ab6 g6/0.5 f6/0.5 eb6 | d6/3 r | "
        "g5 c6 eb6 d6 | c6 ab5 f5/2 | f#5 a5 c6 a5 | b5/2 g5/2 | "
        "c6/0.5 eb6/0.5 ab6 g6 eb6 | f6/2 d6/2 | g6 f6/0.5 d6/0.5 bb5/2 | c6/3 r | "
        "ab5 c6 f6 eb6 | d6 b5 g5 f5 | eb5 ab5 c6/2 | d6/2 bb5 ab5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    harp = [0, 1, 2, 3, 4, 3, 2, 1]
    return theme(
        "the-library",
        84,
        [4, 4],
        {
            "flute": {"kind": "flute", "volume": 0.7},
            "celesta": {"kind": "celesta", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.6},
            "strings": {"kind": "strings", "volume": 0.55},
        },
        ["flute", "celesta", "harp", "strings"],
        ["harp", "strings"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.58),
                harp=arpeggio(a, harp, 0.5, 46, 0.38, 0.1),
                strings=pad(a, 43, 58, 0.4),
                celesta=bells(a, 79, 91, 0.25, every=4),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.5),
                harp=arpeggio(b, harp, 0.5, 46, 0.36, 0.1),
                strings=pad(b, 48, 64, 0.42),
                flute=descant(b, 67, 79, 0.25),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The passages: night, a secret; sparse pizzicato in a minor key, low strings, a
# tiptoeing celesta, slow.


def the_passages() -> dict:
    bar = 4
    a_chords = "Dm | Dm | Bb | A | Dm | Gm | Eb | A7 | Dm | C | Bb | Gm | Dm | Eb | A | A7"
    a_celesta = (
        "r a5/0.5 a5/0.5 d6/0.5 r/1.5 | r f5/0.5 e5/0.5 d5 r | "
        "r bb5/0.5 bb5/0.5 d6/0.5 r/0.5 f6 | e6 c#6 a5 r | "
        "r a5/0.5 a5/0.5 d6/0.5 r/1.5 | r bb5/0.5 a5/0.5 g5 r | r g5/0.5 bb5/0.5 eb6 d6 | "
        "c#6 r a5/0.5 g5/0.5 e5 | "
        "r/2 d6/0.5 r/0.5 a5/0.5 r/0.5 | r/2 e6/0.5 r/0.5 c6/0.5 r/0.5 | "
        "r/2 d6/0.5 r/0.5 bb5/0.5 r/0.5 | g5 a5 bb5 r | "
        "a5 r f5 r | g5 r eb5 r | c#5/0.5 e5/0.5 g5/0.5 a5/0.5 r/2 | r/4"
    )
    b_chords = "Gm | Dm | Eb | Bb | Gm | A | Dm | Dm | Bb | F | Gm | Dm | Eb | Eb | A | A7"
    b_flute = (
        "d6/4 | f6/2 e6/2 | eb6/4 | d6/4 | bb5/4 | c#6/4 | d6/2 a5/2 | r/4 | "
        "d6/4 | c6/4 | bb5/2 a5/2 | f5/4 | g5/4 | bb5/2 g5/2 | e5/4 | r/4"
    )
    b_celesta = (
        "r/4 | r/4 | r/4 | r/2 f6/0.5 d6/0.5 bb5 | r/4 | r/4 | r/4 | r/2 a5/0.5 a5/0.5 d6 | "
        "r/4 | r/4 | r/4 | r/2 f5/0.5 e5/0.5 d5 | r/4 | r/4 | r/4 | r/2 c#6/0.5 e6/0.5 a5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)

    def pizzicato(progression, loud):
        # The root on the first beat and the fifth on the third, low; a chord note on the
        # off-beats of every other bar, for the tiptoe.
        notes = bass(progression, [0], 38, loud, 0.5, fifth=[2])
        for index, (start, _, root, intervals) in enumerate(progression):
            if index % 2 == 1:
                inner = tones(root, intervals, 55, 67)
                notes += [
                    [inner[0], start + 1.5, 0.4, loud * 0.6],
                    [inner[-1], start + 3.5, 0.4, loud * 0.6],
                ]
        return notes

    return theme(
        "the-passages",
        76,
        [4, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.75},
            "flute": {"kind": "flute", "volume": 0.5},
            "pizzicato": {"kind": "pluck", "volume": 0.8},
            "strings": {"kind": "strings", "volume": 0.6},
            "drum": {"kind": "drum", "volume": 0.5},
        },
        ["celesta", "flute", "pizzicato", "strings", "drum"],
        ["pizzicato", "strings"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_celesta, bar, 0.5),
                pizzicato=pizzicato(a, 0.55),
                strings=pad(a, 38, 53, 0.35),
                drum=drum([1, 5, 9, 13], bar, [0], 38, 0.3),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_flute, bar, 0.45),
                celesta=line(b_celesta, bar, 0.42),
                pizzicato=pizzicato(b, 0.5),
                strings=pad(b, 41, 57, 0.4),
                drum=drum([1, 5, 9, 13], bar, [0], 38, 0.3),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The broom: morning, outdoors, a flight; bright and lifting, in six, flutes over
# strings, quick.


def the_broom() -> dict:
    bar = 6
    a_chords = "D | G | D | A | Bm | G | E7 | A | D | F#m | G | D | Em | A | D | A7"
    a_melody = (
        "a4/2 d5 f#5/2 a5 | b5/3 a5/2 g5 | f#5/2 e5 d5/2 f#5 | e5/6 | "
        "f#5/2 b5 d6/2 c#6 | b5/2 a5 g5/2 b5 | g#5/2 b5 d6/2 b5 | a5/6 | "
        "a4/2 d5 f#5/2 a5 | c#6/3 a5/2 f#5 | g5/2 b5 d6/2 b5 | a5/3 f#5/3 | "
        "g5/2 f#5 e5/2 g5 | f#5/2 e5 c#5/2 e5 | d5/2 f#5 a5/2 d6 | c#6/3 a5/3"
    )
    b_chords = "G | A | F#m | Bm | G | A | D | D | Em | F#m | G | A | Bm | G | A | A7"
    b_melody = (
        "d6/3 b5/3 | c#6/3 e6/3 | a5/3 c#6/3 | b5/6 | "
        "g5/2 b5 d6/2 g6 | e6/2 c#6 a5/2 e6 | f#6/3 e6/2 d6 | d6/3 r/3 | "
        "e6/3 b5/3 | c#6/3 a5/3 | b5/2 d6 g6/2 f#6 | e6/6 | "
        "d6/2 c#6 b5/2 f#5 | g5/2 a5 b5/2 d6 | c#6/2 b5 a5/2 g5 | e5/3 c#5/3"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    rolling = [0, 1, 2, 3, 2, 1]
    return theme(
        "the-broom",
        276,
        [6, 8],
        {
            "flute": {"kind": "flute", "volume": 0.8},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "strings": {"kind": "strings", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.5},
            "bass": {"kind": "pluck", "volume": 0.75},
            "drum": {"kind": "drum", "volume": 0.45},
        },
        ["flute", "celesta", "strings", "harp", "bass", "drum"],
        ["strings", "harp", "bass"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.62),
                strings=pad(a, 50, 66, 0.42),
                harp=arpeggio(a, rolling, 1, 50, 0.3, 0.08),
                bass=bass(a, [0, 3], 38, 0.5, 1.5),
                drum=drum(list(range(1, 17)), bar, [0, 3], 43, 0.22),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.66),
                celesta=bells(b, 81, 93, 0.3, every=2),
                strings=pad(b, 55, 71, 0.48),
                harp=arpeggio(b, rolling, 1, 50, 0.32, 0.08),
                bass=bass(b, [0, 3], 38, 0.52, 1.5),
                drum=drum(list(range(1, 17)), bar, [0, 3], 43, 0.24),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The familiar: the tower; a slow, solemn chorale that opens out.


def the_familiar() -> dict:
    bar = 4
    a = harmony("C | Am | F | G | C | Em | F | G | Am | Em | F | C | Dm | G | C | G", bar)
    b = harmony("F | C | Dm | Am | Bb | F | G | G | C | F | Am | Em | F | G | C | C", bar)
    c = harmony("Am | F | C | G | Am | F | G | E | Am | Dm | G | C | F | G | C | G7", bar)
    # The chorale's top line, sung by the strings, then by the flute as it opens out.
    a_top = (
        "e5/4 | e5/2 c5/2 | c5/2 a4/2 | b4/2 d5/2 | c5/2 e5/2 | g5/2 e5/2 | f5/2 a5/2 | g5/4 | "
        "e5/2 c5/2 | b4/2 e5/2 | a5/2 f5/2 | e5/2 g5/2 | f5/2 d5/2 | d5/2 b4/2 | c5/4 | d5/4"
    )
    b_top = (
        "a5/2 c6/2 | g5/4 | f5/2 a5/2 | e5/4 | d5/2 f5/2 | c5/2 a5/2 | g5/2 b5/2 | d6/4 | "
        "e6/2 c6/2 | a5/2 c6/2 | c6/2 e6/2 | b5/2 g5/2 | a5/2 f5/2 | d5/2 g5/2 | e5/4 | c5/4"
    )
    c_top = (
        "e6/4 | f6/2 c6/2 | e6/2 g6/2 | d6/4 | c6/2 e6/2 | a6/2 f6/2 | g6/2 d6/2 | e6/2 g#5/2 | "
        "a5/2 c6/2 | d6/2 f6/2 | g6/2 b5/2 | c6/2 e6/2 | f6/2 a6/2 | g6/2 d6/2 | e6/4 | f6/2 d6/2"
    )
    rising = [0, 1, 2, 3]
    return theme(
        "the-familiar",
        60,
        [4, 4],
        {
            "choir": {"kind": "strings", "volume": 0.8},
            "bass": {"kind": "strings", "volume": 0.6},
            "flute": {"kind": "flute", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.5},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.5},
        },
        ["choir", "bass", "flute", "harp", "celesta", "drum"],
        ["choir", "bass"],
        [
            section(
                "a",
                16,
                bar,
                choir=line(a_top, bar, 0.5) + pad(a, 50, 65, 0.38),
                bass=bass(a, [0], 36, 0.4, 4),
                drum=drum([4, 8, 12, 16], bar, [0], 36, 0.3),
            ),
            section(
                "b",
                16,
                bar,
                choir=line(b_top, bar, 0.55) + pad(b, 52, 67, 0.42),
                bass=bass(b, [0], 36, 0.44, 4),
                harp=arpeggio(b, rising, 1, 48, 0.3, 0.06),
                drum=drum([4, 8, 12, 16], bar, [0], 36, 0.32),
            ),
            section(
                "c",
                16,
                bar,
                flute=line(c_top, bar, 0.55),
                choir=line(c_top.replace("6/", "5/").replace("g#5/", "g#4/"), bar, 0.45)
                + pad(c, 50, 65, 0.42),
                bass=bass(c, [0], 36, 0.48, 4),
                harp=arpeggio(c, rising, 1, 52, 0.32, 0.06),
                celesta=bells(c, 84, 96, 0.3, every=2),
                drum=drum([4, 8, 12, 16], bar, [0], 36, 0.34),
            ),
        ],
        ["a", "b", "c"],
    )


THEMES = {
    "arrival": arrival,
    "the-library": the_library,
    "the-passages": the_passages,
    "the-broom": the_broom,
    "the-familiar": the_familiar,
}


def write(name: str) -> Path:
    made = THEMES[name]()
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(made, separators=(",", ":")) + "\n", encoding="utf-8")
    return path


def main() -> int:
    names = sys.argv[1:] or list(THEMES)
    for name in names:
        if name not in THEMES:
            print(f"no theme {name}; the themes are {', '.join(THEMES)}", file=sys.stderr)
            return 2
        print(write(name).relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
