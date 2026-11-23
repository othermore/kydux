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
A section may have a tempo of its own, or go evenly from one to another (D315), and a
theme may be told in movements, each some sections once and then some over and over,
which a story asks for by name (D316).
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
    bars: list[int], bar: int, beats: list[float], low: int, loud: float, length: float = 1.0
) -> list[list[float]]:
    """A soft drum on the beats given of the bars given (counted from 1)."""
    return [[low, (number - 1) * bar + beat, length, loud] for number in bars for beat in beats]


def shifted(notes: list[list[float]], bars: int, bar: int) -> list[list[float]]:
    """Notes moved later by whole bars."""
    return [[p, start + bars * bar, length, loud] for p, start, length, loud in notes]


def section(
    name: str,
    bars: int,
    bar: int,
    *,
    tempo: float | list[float] | None = None,
    **voices: list[list[float]],
) -> dict:
    """A section of `bars` bars of `bar` beats: its notes by voice, each rounded, and none
    ringing past its end, so that the next section, or the loop's start, follows clean.
    `tempo` is its own where it is not the theme's (D315): one it keeps, or the one it
    starts at and the one it ends at."""
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
    if tempo is None:
        return {"id": name, "bars": bars, "notes": notes}
    return {"id": name, "bars": bars, "tempo": tempo, "notes": notes}


def theme(
    id_: str,
    tempo: float,
    metre: list[int],
    voices: dict,
    sections: list[dict],
    order: list[str],
    movements: list[dict] | None = None,
) -> dict:
    """A theme's file: its one set of voices (D210), every one played wherever the theme
    is heard, its sections in their order, and its movements where a story asks for it a
    movement at a time (D316)."""
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
    made = {
        "id": id_,
        "tempo": tempo,
        "metre": metre,
        "voices": voices,
        "sections": sections,
        "order": order,
    }
    if movements:
        names = {part["id"] for part in sections}
        for movement in movements:
            assert movement["round"], (id_, movement["id"])
            assert set(movement.get("once", []) + movement["round"]) <= names, (
                id_,
                movement["id"],
            )
        made["movements"] = movements
    return made


# --- Arrival: dusk, outdoors, glad: a march in four in G, a celesta's skipping tune over a
# plucked bass and its after-beats, a flute's answer in its middle part, a drum.


def arrival() -> dict:
    bar = 4
    a_chords = "G | G | C | G | Em | Am | D7 | D7 | G | G | C | G | Am | D7 | G | G"
    a_melody = (
        "d5/0.5 g5/0.5 b5 a5/0.5 g5/0.5 b5 | d6/2 b5 g5 | "
        "e5/0.5 g5/0.5 c6 b5/0.5 a5/0.5 g5 | b5/3 r | "
        "e5/0.5 g5/0.5 b5 a5/0.5 g5/0.5 e5 | a5/0.5 c6/0.5 e6 d6/0.5 c6/0.5 a5 | "
        "f#5/0.5 a5/0.5 d6 c6/0.5 a5/0.5 f#5 | a5/2 r/0.5 d5/0.5 e5/0.5 f#5/0.5 | "
        "d5/0.5 g5/0.5 b5 a5/0.5 g5/0.5 b5 | d6/2 g6 d6 | "
        "e6/0.5 d6/0.5 c6 b5/0.5 c6/0.5 e6 | d6/3 r | "
        "c6/0.5 b5/0.5 a5 e5/0.5 a5/0.5 c6 | b5/0.5 a5/0.5 f#5 d5/0.5 f#5/0.5 a5 | "
        "g5 b5/0.5 d6/0.5 g6/2 | r d6/0.5 b5/0.5 g5/2"
    )
    b_chords = "C | C | G | G | Am | D7 | G | G7 | C | C | Bm | Em | Am | D7 | D7 | D7"
    b_melody = (
        "e5/2 g5 c6 | e6/3 d6 | d6/2 b5 g5 | b5/4 | c6/2 a5 e5 | f#5/2 a5 c6 | b5/2 d6/2 | "
        "b5 d6 f6/2 | e6/2 c6 g5 | e5/2 g5 c6 | d6/2 b5 f#5 | g5/3 b5 | a5/2 c6 e6 | "
        "d6/2 c6 a5 | f#5 a5 d6 f#6 | e6/0.5 d6/0.5 c6 a5 f#5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "arrival",
        132,
        [4, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.8},
            "flute": {"kind": "flute", "volume": 0.6},
            "strings": {"kind": "strings", "volume": 0.5},
            "bass": {"kind": "pluck", "volume": 0.75},
            "chords": {"kind": "pluck", "volume": 0.45},
            "drum": {"kind": "drum", "volume": 0.4},
        },
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.62),
                strings=pad(a, 55, 71, 0.4),
                bass=bass(a, [0], 36, 0.55, 0.6, fifth=[2]),
                chords=after_beat(a, [1, 3], 59, 74, 0.3, 0.4),
                drum=drum(list(range(1, 17)), bar, [0, 2], 43, 0.2),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.6),
                celesta=bells(b, 79, 91, 0.32, every=2),
                strings=pad(b, 55, 71, 0.42),
                bass=bass(b, [0], 36, 0.52, 0.6, fifth=[2]),
                chords=after_beat(b, [1, 3], 59, 74, 0.28, 0.4),
                drum=drum(list(range(1, 17)), bar, [0], 43, 0.18),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The library: indoors, evening, calm, slow in four in A minor: a piano's phrases,
# quick notes among their long ones, and the celesta's answers, the two taking turns on
# the tune, over a harp that climbs a chord a bar and a low pad (D209).


def the_library() -> dict:
    bar = 4
    rest = "r/4 | r/4"
    a_chords = "Am | F | C | G | Am | Dm | E | E | Am | F | C | G | Dm | Am | E7 | Am"
    a_piano = " | ".join(
        [
            "e5/1.5 a5/0.5 c6/0.5 b5/0.5 a5 | c6/2 a5/0.5 g5/0.5 f5/0.5 a5/0.5",
            rest,
            "e5 a5/0.5 b5/0.5 c6/1.5 a5/0.5 | f5/0.5 a5/0.5 d6/0.5 c6/0.5 a5/2",
            rest,
            "c6/1.5 e6/0.5 a5/0.5 b5/0.5 c6 | f6/2 e6/0.5 d6/0.5 c6/0.5 a5/0.5",
            rest,
            "f6/1.5 d6/0.5 a5/0.5 c6/0.5 d6 | c6/2 b5/0.5 a5/0.5 g#5/0.5 a5/0.5",
            rest,
        ]
    )
    a_celesta = " | ".join(
        [
            rest,
            "g5/1.5 e5/0.5 g5 c6 | d6/0.5 c6/0.5 b5/0.5 a5/0.5 g5/2",
            rest,
            "g#5/1.5 b5/0.5 e6 d6 | b5/0.5 g#5/0.5 e5/0.5 g#5/0.5 b5/2",
            rest,
            "e6/1.5 c6/0.5 g5 c6 | d6/0.5 b5/0.5 g5/0.5 b5/0.5 d6/2",
            rest,
            "g#5/1.5 b5/0.5 d6 b5 | c6/0.5 b5/0.5 a5/0.5 e5/0.5 a5/2",
        ]
    )
    b_chords = "C | G | Am | Em | F | C | Dm | E | F | G | Em | Am | Dm | G | E | E7"
    b_celesta = " | ".join(
        [
            "r g5 c6 e6 | d6/2 b5/2",
            rest,
            "r a5 c6 f6 | e6/2 g5/2",
            rest,
            "r c6 f6 a6 | g6/2 d6/2",
            rest,
            "r a5 d6 f6 | d6/2 b5/2",
            rest,
        ]
    )
    b_piano = " | ".join(
        [
            rest,
            "c6/0.5 b5/0.5 a5/0.5 e5/0.5 a5/1.5 c6/0.5 | b5/1.5 g5/0.5 e5 g5",
            rest,
            "f5/0.5 a5/0.5 d6/0.5 f6/0.5 e6/1.5 d6/0.5 | b5/1.5 g#5/0.5 e5 g#5",
            rest,
            "g5/0.5 b5/0.5 e6/0.5 g6/0.5 e6/1.5 b5/0.5 | c6/1.5 a5/0.5 e5 a5",
            rest,
            "g#5/0.5 b5/0.5 e6/0.5 b5/0.5 g#5/1.5 e5/0.5 | d6/1.5 b5/0.5 g#5 e5",
        ]
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    climbing = [0, 1, 2, 3]
    return theme(
        "the-library",
        66,
        [4, 4],
        {
            "piano": {"kind": "piano", "volume": 0.7},
            "celesta": {"kind": "celesta", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.45},
        },
        [
            section(
                "a",
                16,
                bar,
                piano=line(a_piano, bar, 0.55),
                celesta=line(a_celesta, bar, 0.46),
                harp=arpeggio(a, climbing, 1, 45, 0.34, 0.06),
                strings=pad(a, 48, 64, 0.38),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_celesta, bar, 0.46),
                piano=line(b_piano, bar, 0.55),
                harp=arpeggio(b, climbing, 1, 45, 0.32, 0.06),
                strings=pad(b, 48, 64, 0.4),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The passages: night, a secret, time running while nobody must hear, in four in A
# minor with its lowered second: a string plucked on every eighth note as a clock, a
# piano's low notes three, three and two under it, a timpani on the bar, a horn's long
# notes that rise a half step and wait, far off, and in the second section a piano's tune
# in the same three, three and two, kept under the clock; a snare's roll closes each half
# of a section (D213).


def ticking(progression, low: int, loud: float) -> list[list[float]]:
    """A chord's fifth plucked on every eighth note, as a clock, the first of each three,
    three and two a little louder."""
    notes = []
    for start, span, root, _ in progression:
        p = low + (root + 7 - low) % 12
        for index in range(int(round(span / 0.5))):
            accent = 0.12 if index % 8 in (0, 3, 6) else 0.0
            notes.append([p, start + index * 0.5, 0.4, loud + accent])
    return notes


def roll(bars: list[int], bar: int, loud: float) -> list[list[float]]:
    """A snare's roll that swells over the last beat of the bars given (counted from 1)."""
    return [
        [60, number * bar - 1 + k * 0.25, 0.25, loud * (0.55 + 0.15 * k)]
        for number in bars
        for k in range(4)
    ]


def the_passages() -> dict:
    bar = 4
    every = list(range(1, 17))
    a = harmony(
        "Am | Am | Am | Am | Bb | Bb | Am | Am | Dm | Dm | Am | Am | Bb | Bb | E7 | E7", bar
    )
    b = harmony("F | F | C | C | Dm | Dm | E7 | E7 | F | F | G | G | Am | Am | E7 | E7", bar)
    a_horn = (
        "r/4 | r/2 e4/2 | f4/3 r | e4/2 r/2 | r/2 f4/2 | g4/3 r | e4/4 | r/4 | "
        "r/2 a4/2 | bb4/3 r | a4/2 e4/2 | r/4 | r/2 d5/2 | f5/3 r | e5/4 | g#4/2 b4 r"
    )
    b_tune = (
        "c5/1.5 a4/0.5 f4 a4 | c5/1.5 f5/0.5 e5/2 | e5/1.5 c5/0.5 g4 c5 | e5/1.5 g5/0.5 d5/2 | "
        "f5/1.5 d5/0.5 a4 d5 | f5/1.5 a5/0.5 g5/2 | g#5/1.5 e5/0.5 b4 d5 | e5/3 r | "
        "a5/1.5 f5/0.5 c5 f5 | a5/1.5 c6/0.5 a5/2 | b5/1.5 g5/0.5 d5 g5 | b5/1.5 d6/0.5 b5/2 | "
        "c6/1.5 a5/0.5 e5 a5 | e5/1.5 c5/0.5 a4/2 | g#4/1.5 b4/0.5 d5 e5 | g#5/3 r"
    )

    def low(progression, loud: float) -> list[list[float]]:
        return bass(progression, [0, 1.5, 3], 45, loud, 1.4) + bass(
            progression, [0], 33, loud * 0.8, 4.0
        )

    return theme(
        "the-passages",
        116,
        [4, 4],
        {
            "tune": {"kind": "piano", "volume": 0.2},
            "horn": {"kind": "brass", "volume": 0.15},
            "tick": {"kind": "pluck", "volume": 0.5},
            "bass": {"kind": "piano", "volume": 0.5},
            "pad": {"kind": "strings", "volume": 0.4},
            "drum": {"kind": "drum", "volume": 0.55},
            "snare": {"kind": "snare", "volume": 0.45},
        },
        [
            section(
                "a",
                16,
                bar,
                horn=line(a_horn, bar, 0.5),
                tick=ticking(a, 57, 0.26),
                bass=low(a, 0.42),
                pad=pad(a, 45, 60, 0.34),
                drum=drum(every, bar, [0], 36, 0.28),
                snare=roll([8, 16], bar, 0.3),
            ),
            section(
                "b",
                16,
                bar,
                tune=line(b_tune, bar, 0.6),
                horn=descant(b, 52, 64, 0.34),
                tick=ticking(b, 57, 0.28),
                bass=low(b, 0.44),
                pad=pad(b, 45, 60, 0.36),
                drum=drum(every, bar, [0], 36, 0.3) + drum(every, bar, [3], 36, 0.18),
                snare=roll([8, 16], bar, 0.32),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The broom: a race, tense and surprising, fast in four in E minor: a piano's tune
# of short cells that climb by step and break off, over a low voice that never stops
# running in eighth notes, the drum on every beat and a chord pushed off the beat before
# each bar; a bar with no tune, a leap of register, a raised seventh left hanging; the
# loop ends in the air (D209).


def running(progression, pattern: list[int], low: int, loud: float) -> list[list[float]]:
    """A low voice that runs in eighth notes, each chord's root and its octave and fifth
    by `pattern`, a beat's first eighth a little louder."""
    notes = []
    for start, span, root, _ in progression:
        base = low + (root - low) % 12
        for index in range(int(round(span / 0.5))):
            accent = 0.08 if index % 2 == 0 else 0.0
            notes.append(
                [base + pattern[index % len(pattern)], start + index * 0.5, 0.5, loud + accent]
            )
    return notes


def beats(bars: list[int], bar: int, low: int, down: float, up: float) -> list[list[float]]:
    """A drum on every beat of the bars given, the bar's first and third louder."""
    return drum(bars, bar, [0, 2], low, down) + drum(bars, bar, [1, 3], low, up)


RUN = [0, 0, 12, 0, 7, 0, 12, 7]


def the_broom() -> dict:
    bar = 4
    every = list(range(1, 17))
    a = harmony("Em | Em | C | D | Em | Em | Am | B7 | Em | G | C | D | Am | Em | B7 | B7", bar)
    a_tune = (
        "e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5 r | g5/0.5 a5/0.5 b5/0.5 c6/0.5 b5/0.5 r/1.5 | "
        "c6/0.5 d6/0.5 e6 r/0.5 e5/0.5 g5 | r/4 | "
        "b4/0.5 c5/0.5 d5/0.5 e5/0.5 f#5 r | e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5/0.5 r/0.5 e6 | "
        "e6/0.5 d6/0.5 c6 r/0.5 a5/0.5 c6 | d#6/2 r/0.5 b5/0.5 a5 | "
        "e5/0.5 f#5/0.5 g5/0.5 b5/0.5 e6 r | d6/0.5 e6/0.5 f#6/0.5 g6/0.5 f#6 r | "
        "e6/0.5 f#6/0.5 g6 r/2 | f#4/0.5 a4/0.5 d5 r/2 | "
        "a4/0.5 b4/0.5 c5/0.5 d5/0.5 e5 r | g5/0.5 f#5/0.5 e5/0.5 f#5/0.5 g5 r | "
        "a5/0.5 b5/0.5 c6/0.5 d#6/0.5 f#6 r | a6/0.5 f#6/0.5 d#6/0.5 b5/0.5 d#6/2"
    )
    b = harmony("C | D | Em | Em | C | D | B7 | B7 | Am | B7 | Em | C | Am | B7 | Em | B7", bar)
    b_tune = (
        "g5/0.5 a5/0.5 b5/0.5 c6/0.5 e6 r | a5/0.5 b5/0.5 c6/0.5 d6/0.5 f#6 r | "
        "b5/0.5 c6/0.5 d6/0.5 e6/0.5 g6/0.5 r/1.5 | r/4 | "
        "e6/0.5 d6/0.5 c6/0.5 b5/0.5 c6 r | f#6/0.5 e6/0.5 d6/0.5 c6/0.5 d6 r | "
        "d#5 f#5/0.5 a5/0.5 b5 d#6 | f#6/2 r/2 | "
        "c5/0.5 d5/0.5 e5/0.5 f#5/0.5 g5 r | d#5/0.5 e5/0.5 f#5/0.5 g5/0.5 a5 r | "
        "b5/0.5 c6/0.5 b5/0.5 a5/0.5 g5 e6 | e6/0.5 r/0.5 e6/0.5 r/0.5 g6/0.5 r/1.5 | "
        "a5/0.5 b5/0.5 c6/0.5 d6/0.5 e6 r | d#6/0.5 e6/0.5 f#6/0.5 a6/0.5 b6 r | "
        "g6/0.5 f#6/0.5 e6/0.5 d#6/0.5 r/2 | b5/0.5 c6/0.5 d6/0.5 d#6/0.5 f#6/2"
    )
    return theme(
        "the-broom",
        160,
        [4, 4],
        {
            "tune": {"kind": "piano", "volume": 0.8},
            "bass": {"kind": "pluck", "volume": 0.85},
            "push": {"kind": "pluck", "volume": 0.45},
            "strings": {"kind": "strings", "volume": 0.4},
            "drum": {"kind": "drum", "volume": 0.55},
        },
        [
            section(
                "a",
                16,
                bar,
                tune=line(a_tune, bar, 0.62),
                bass=running(a, RUN, 40, 0.5),
                push=after_beat(a, [3.5], 55, 70, 0.34, 0.3),
                strings=pad(a, 45, 60, 0.32),
                drum=beats(every, bar, 43, 0.3, 0.2),
            ),
            section(
                "b",
                16,
                bar,
                tune=line(b_tune, bar, 0.64),
                bass=running(b, RUN, 40, 0.52),
                push=after_beat(b, [3.5], 55, 70, 0.36, 0.3),
                strings=pad(b, 45, 60, 0.34),
                drum=beats(every, bar, 43, 0.32, 0.22),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The familiar: the tower's high hall at the year's end, wonder and a little
# longing, slow in three in D minor with its raised sixth: two flutes as a consort, the
# second answering the first a bar later, over a harp's open notes and the low pad; in
# the middle part a celesta's tune, high as stars, over the harp running in eighth notes
# while a flute holds long notes under it, closing on D major; then the consort again
# over the running harp, the celesta ringing above it (D296).


def the_familiar() -> dict:
    bar = 3
    rest = "r/3"
    a_chords = "Dm | G | Dm | C | F | C | Dm | Am | Dm | G | F | Am | Dm | G | C | Dm"
    a_flute = (
        "a5/2 d6 | b5/1.5 a5/0.5 g5 | a5/2 f5 | e5/3 | "
        "f5 g5 a5 | g5/2 e5 | f5/1.5 e5/0.5 d5 | e5/3 | "
        "a5/2 d6 | b5/1.5 c6/0.5 d6 | c6/2 a5 | c6/1.5 b5/0.5 a5 | "
        "f5 a5 d6 | b5/2 g5 | g5/1.5 f5/0.5 e5 | d5/3"
    )
    a_second = (
        "r/3 | g4/2 d5 | f5/1.5 e5/0.5 d5 | g4 c5 d5 | "
        "a4/2 c5 | e5/2 c5 | d5/2 a4 | c5 b4 a4 | "
        "d5/2 f5 | g5/2 f5 | f5/1.5 e5/0.5 f5 | e5/2 c5 | "
        "d5/2 f5 | g5/1.5 f5/0.5 d5 | e5/1.5 d5/0.5 c5 | a4/3"
    )
    b_chords = (
        "Fmaj7 | C | Fmaj7 | C | Dm7 | Am7 | Bb | C | Fmaj7 | C | Dm7 | Am7 | Bb | C | Dsus4 | D"
    )
    b_celesta = (
        "e6/2 c6 | e6/1.5 d6/0.5 g6 | a6/2 e6 | g6/3 | "
        "f6/2 d6 | e6/1.5 d6/0.5 c6 | d6/2 f6 | e6/3 | "
        "e6/2 c6 | e6/1.5 g6/0.5 c7 | a6/2 f6 | g6/1.5 e6/0.5 c6 | "
        "d6 f6 a6 | g6/2 e6 | g6/1.5 a6/0.5 g6 | f#6/3"
    )
    b_flute = (
        "a5/3 | g5/3 | a5/3 | c6/1.5 b5/0.5 g5 | "
        "a5/3 | g5/3 | f5/3 | e5 g5 c6 | "
        "a5/3 | g5/3 | f5/2 a5 | e5/3 | "
        "d5/2 f5 | e5/2 g5 | a5/3 | d5 f#5 a5"
    )
    # The stars over the consort: the celesta answers where the flute's tune rests on a
    # long note, and falls to the loop's start.
    c_celesta = " | ".join(
        [rest, rest, rest, "r e6 g6", rest, rest, rest, "r e6 a6"]
        + [rest, rest, rest, rest, rest, rest, rest, "a6 f6 d6"]
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    open_notes = [0, 2, 3]
    flowing = [0, 2, 4, 5, 4, 2]
    return theme(
        "the-familiar",
        88,
        [3, 4],
        {
            "flute": {"kind": "flute", "volume": 0.7},
            "second": {"kind": "flute", "volume": 0.5},
            "celesta": {"kind": "celesta", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.45},
            "bass": {"kind": "strings", "volume": 0.5},
        },
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_flute, bar, 0.58),
                second=line(a_second, bar, 0.5),
                harp=arpeggio(a, open_notes, 1, 50, 0.3, 0.06),
                strings=pad(a, 48, 64, 0.36),
                bass=bass(a, [0], 38, 0.36, 3),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_celesta, bar, 0.5),
                flute=line(b_flute, bar, 0.46),
                second=descant(b, 60, 72, 0.3),
                harp=arpeggio(b, flowing, 0.5, 50, 0.28, 0.08),
                strings=pad(b, 48, 64, 0.4, 4),
                bass=bass(b, [0], 38, 0.38, 3),
            ),
            section(
                "c",
                16,
                bar,
                flute=line(a_flute, bar, 0.6),
                second=line(a_second, bar, 0.5),
                celesta=line(c_celesta, bar, 0.42) + bells(a, 84, 96, 0.28, every=2),
                harp=arpeggio(a, flowing, 0.5, 50, 0.28, 0.08),
                strings=pad(a, 48, 64, 0.4),
                bass=bass(a, [0], 38, 0.4, 3),
            ),
        ],
        ["a", "b", "c"],
    )


# --- The truth: the year's ending, told in the tower's high hall at sunset, grave and
# then great: the familiar's tune with the minor's own low sixth, in three in D minor,
# told in movements that the story's steps ask for (D313, D316). A piano has the tune
# alone, slow, over its left hand. An organ takes a middle part of its own over the
# cellos and a low drum's heartbeat. That part's second half speeds up bar by bar as a
# snare, the violins, a horn and the toms join it, up to the dominant, and every voice
# plays the tune, faster than it began, over the cellos' running eighth notes and a drum
# kit: a kick, a snare on the bar's third beat, a hat's eighth notes, a crash; the middle
# part answers it as loud, the toms under it. A hush is a low open fifth and the
# heartbeat. Then the tune turns major and broad for every voice, and the piano keeps it
# after, alone as it began.


def broken(
    progression, shape: list[int], step: float, low: int, loud: float, accent: float = 0.0
) -> list[list[float]]:
    """A piano's left hand: a chord's notes one after another from its root, `step` beats
    each, by `shape`: 1 the root from `low`, 5 its fifth, 8 its octave, 10 the third over
    the octave, 12 the fifth over it."""
    notes = []
    for start, span, root, intervals in progression:
        base = low + (root - low) % 12
        over = {1: 0, 5: intervals[2], 8: 12, 10: 12 + intervals[1], 12: 12 + intervals[2]}
        for index in range(int(round(span / step))):
            p = base + over[shape[index % len(shape)]]
            notes.append(
                [p, start + index * step, step * 1.5, loud + (accent if index == 0 else 0.0)]
            )
    return notes


def swelling(
    notes: list[list[float]], first: float, last: float, begin: float, end: float
) -> list[list[float]]:
    """Notes that grow or fall evenly from the beat `first` to the beat `last`: a note
    that starts between them is `begin` times as loud as written at the first and `end`
    times at the last; the others stay as written."""
    made = []
    for p, start, length, loud in notes:
        if first <= start < last:
            loud *= begin + (end - begin) * (start - first) / (last - first)
        made.append([p, start, length, loud])
    return made


def within(notes: list[list[float]], first: int, last: int, bar: int) -> list[list[float]]:
    """The notes that start in the bars from `first` to `last` (counted from 1)."""
    return [note for note in notes if (first - 1) * bar <= note[1] < last * bar]


def raised(notes: list[list[float]], by: int) -> list[list[float]]:
    """Notes moved up by `by` half steps, down when it is under zero."""
    return [[p + by, start, length, loud] for p, start, length, loud in notes]


def thunder(
    number: int, bar: int, low: int, begin: float, end: float, over: float = 2.0
) -> list[list[float]]:
    """A timpani's roll that swells over the last `over` beats of a bar (counted from 1),
    from `begin` to `end`."""
    count = int(round(over / 0.25))
    return [
        [low, number * bar - over + k * 0.25, 0.25, begin + (end - begin) * k / (count - 1)]
        for k in range(count)
    ]


def tattoo(bars: list[int], bar: int, loud: float) -> list[list[float]]:
    """A snare's figure in three on the bars given (counted from 1): the first beat, and
    the two halves of each beat after it, softer."""
    return [
        [60, (number - 1) * bar + beat, 0.25, loud * (1.0 if beat == 0 else 0.6)]
        for number in bars
        for beat in (0, 1, 1.5, 2, 2.5)
    ]


PULSE = [0, 0, 12, 0, 12, 0]


def bars_of(text: str, first: int, last: int) -> str:
    """The bars from `first` to `last` (counted from 1) of a melody or a progression."""
    return " | ".join(written.strip() for written in text.split("|")[first - 1 : last])


def fill(number: int, bar: int, pitches: list[int], begin: float, end: float) -> list[list[float]]:
    """The toms' way down at the end of a bar (counted from 1): a sixteenth note for each
    pitch given, the last of them the bar's last, growing from `begin` to `end`."""
    first = number * bar - len(pitches) * 0.25
    return [
        [p, first + k * 0.25, 0.25, begin + (end - begin) * k / (len(pitches) - 1)]
        for k, p in enumerate(pitches)
    ]


def hat(bars: list[int], bar: int, loud: float) -> list[list[float]]:
    """A closed hat's eighth notes through the bars given, each beat's first the louder."""
    return [
        [80, (number - 1) * bar + k * 0.5, 0.2, loud * (1.0 if k % 2 == 0 else 0.6)]
        for number in bars
        for k in range(bar * 2)
    ]


# A drum kit's pitches: its kick, and its three toms from the high one down.
KICK = 31
TOMS = [50, 47, 43]
DOWN = [50, 50, 47, 47, 43, 43]


def the_truth() -> dict:
    bar = 3
    a_chords = "Dm | Gm | Dm | A | Bb | C | Dm | A | Dm | Gm | F | C | Bb | Gm | A7 | Dm"
    tune = (
        "a5/2 d6 | bb5/1.5 a5/0.5 g5 | a5/2 f5 | e5/3 | "
        "f5 g5 a5 | g5/2 e5 | f5/1.5 e5/0.5 d5 | e5/3 | "
        "a5/2 d6 | bb5/1.5 c6/0.5 d6 | c6/2 a5 | c6/1.5 bb5/0.5 a5 | "
        "f5 a5 d6 | bb5/2 g5 | g5/1.5 f5/0.5 e5 | "
    )
    a_tune = tune + "d5/3"
    high_tune = tune + "d6/3"
    b_chords = "Bb | C | Am | Dm | Bb | C | F | A | Bb | C | Am | Dm | Gm | Em7b5 | Asus4 | A"
    b_tune = (
        "d5/2 f5 | e5/2 g5 | a5/1.5 g5/0.5 e5 | f5/3 | "
        "f5/2 bb5 | g5/2 c6 | a5/1.5 bb5/0.5 c6 | c#6/2 e6 | "
        "f6/2 d6 | e6/1.5 d6/0.5 c6 | c6/2 a5 | a5/1.5 g5/0.5 f5 | "
        "g5/2 bb5 | bb5/1.5 a5/0.5 g5 | d6/3 | c#6/2 e6"
    )
    b_horn = "d4/3 | e4/3 | e4/3 | f4/3 | d4/3 | e4/3 | e4/3 | e4/2 a4"
    # The middle part's second half is the way up: it is played alone where the theme
    # speeds up.
    up_tune = bars_of(b_tune, 9, 16)
    # The tune in the major, its sixth and its third raised, and its end held.
    d_chords = "D | G | D | A | Bm | G | A7 | D"
    d_tune = "a5/2 d6 | b5/1.5 a5/0.5 g5 | a5/2 f#5 | e5/3 | f#5 g5 a5 | b5/2 d6 | e6/2 c#6 | d6/3"
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    up = harmony(bars_of(b_chords, 9, 16), bar)
    d = harmony(d_chords, bar)
    held = harmony(d_chords + " | D | D", bar)
    low_d = harmony("Dm | Dm | Dm | Dm", bar)
    slow = [1, 5, 10]
    flowing = [1, 5, 8, 10, 8, 5]
    wide = [1, 5, 8, 10, 12, 10]
    every = list(range(1, 17))
    b_octaves = line(b_tune, bar, 0.85) + raised(line(b_tune, bar, 0.75), -12)
    up_octaves = line(up_tune, bar, 0.7) + raised(line(up_tune, bar, 0.6), -12)
    return theme(
        "the-truth",
        76,
        [3, 4],
        {
            "piano": {"kind": "piano", "volume": 0.9},
            "left": {"kind": "piano", "volume": 0.7},
            "organ": {"kind": "organ", "volume": 0.8},
            "cellos": {"kind": "cello", "volume": 0.8},
            "violins": {"kind": "strings", "volume": 0.9},
            "horn": {"kind": "brass", "volume": 0.8},
            "flute": {"kind": "flute", "volume": 0.5},
            "strings": {"kind": "strings", "volume": 0.65},
            "bass": {"kind": "strings", "volume": 0.75},
            "drum": {"kind": "drum", "volume": 0.8},
            "kit": {"kind": "drum", "volume": 0.8},
            "snare": {"kind": "snare", "volume": 0.8},
            "hat": {"kind": "cymbal", "volume": 0.65},
            "crash": {"kind": "cymbal", "volume": 0.6},
        },
        [
            section(
                "alone",
                16,
                bar,
                piano=raised(line(a_tune, bar, 0.58), -12)
                + within(line(a_tune, bar, 0.28), 9, 16, bar),
                left=broken(a, slow, 1, 38, 0.36, 0.05),
                strings=pad(a[8:], 50, 67, 0.2),
                bass=bass(a[8:], [0], 33, 0.22, 3),
            ),
            section(
                "name",
                16,
                bar,
                organ=line(b_tune, bar, 0.48) + pad(b, 50, 69, 0.34, 4) + bass(b, [0], 33, 0.4, 3),
                cellos=bass(b, [0], 36, 0.52, 3) + bass(b, [0], 24, 0.44, 3),
                left=broken(b, slow, 1, 38, 0.26, 0.05),
                strings=pad(b[8:], 50, 67, 0.36, 4),
                bass=bass(b, [0], 33, 0.42, 3),
                drum=bass(b, [0], 33, 0.5) + bass(b, [0.5], 33, 0.32),
            ),
            section(
                "rise",
                8,
                bar,
                tempo=[76, 100],
                organ=swelling(
                    line(up_tune, bar, 0.5)
                    + pad(up, 50, 69, 0.38, 4)
                    + bass(up, [0], 33, 0.42, 3),
                    0,
                    24,
                    0.8,
                    1.15,
                ),
                cellos=swelling(
                    running(up, PULSE, 36, 0.5) + bass(up, [0], 24, 0.45, 3), 0, 24, 0.8, 1.2
                ),
                violins=swelling(up_octaves, 0, 24, 0.8, 1.3),
                flute=line(up_tune, bar, 0.45),
                piano=bells(up, 72, 84, 0.3),
                left=swelling(broken(up, flowing, 0.5, 38, 0.3, 0.08), 0, 24, 0.9, 1.2),
                horn=swelling(line(b_horn, bar, 0.4), 0, 24, 0.8, 1.5),
                strings=swelling(pad(up, 50, 67, 0.5, 4), 0, 24, 0.9, 1.15),
                bass=swelling(bass(up, [0], 33, 0.5, 3), 0, 24, 0.95, 1.15),
                drum=swelling(
                    bass(up, [0], 33, 0.45) + bass(up[2:7], [2], 33, 0.32), 0, 24, 0.9, 1.6
                )
                + thunder(8, bar, 33, 0.2, 0.85, 3.0),
                kit=swelling(drum(list(range(3, 9)), bar, [0], KICK, 0.5), 6, 24, 0.8, 1.5)
                + fill(6, bar, DOWN[2:], 0.35, 0.6)
                + fill(8, bar, DOWN + DOWN[4:], 0.4, 0.95),
                snare=swelling(tattoo(list(range(1, 8)), bar, 0.32), 0, 21, 0.75, 1.6)
                + roll([4], bar, 0.5)
                + [[60, 7 * bar + k * 0.25, 0.25, 0.25 + 0.04 * k] for k in range(12)],
                hat=swelling(hat(list(range(5, 9)), bar, 0.5), 12, 24, 0.3, 1.0),
            ),
            section(
                "height",
                16,
                bar,
                tempo=100,
                violins=line(high_tune, bar, 0.9) + raised(line(high_tune, bar, 0.8), -12),
                horn=raised(line(high_tune, bar, 0.7), -12),
                organ=line(high_tune, bar, 0.65)
                + pad(a, 50, 69, 0.37, 4)
                + bass(a, [0], 33, 0.45, 3),
                piano=line(high_tune, bar, 0.45) + raised(line(high_tune, bar, 0.32), -12),
                flute=raised(within(line(high_tune, bar, 0.45), 9, 16, bar), 12),
                left=broken(a, wide, 0.5, 38, 0.32, 0.1),
                cellos=running(a, PULSE, 36, 0.62) + bass(a, [0], 24, 0.6, 3),
                strings=pad(a, 50, 67, 0.6, 4),
                bass=bass(a, [0], 33, 0.7, 3) + bass(a, [0], 45, 0.42, 3),
                drum=bass(a, [0], 33, 0.6)
                + thunder(8, bar, 33, 0.2, 0.6)
                + thunder(16, bar, 33, 0.3, 0.9),
                kit=drum(every, bar, [0], KICK, 0.9)
                + drum(every, bar, [2.5], KICK, 0.55)
                + fill(8, bar, DOWN, 0.5, 0.9)
                + fill(16, bar, DOWN + DOWN[4:], 0.5, 0.95),
                snare=drum(every, bar, [2], 60, 0.85, 0.25)
                + drum(every, bar, [1.5], 60, 0.28, 0.25)
                + roll([8, 16], bar, 0.6),
                hat=hat(every, bar, 0.6),
                crash=drum([1, 9], bar, [0], 80, 0.8, 3.0),
            ),
            section(
                "storm",
                16,
                bar,
                tempo=100,
                horn=raised(line(b_tune, bar, 0.75), -12),
                organ=line(b_tune, bar, 0.65)
                + pad(b, 50, 69, 0.37, 4)
                + bass(b, [0], 33, 0.45, 3),
                violins=pad(b[:8], 62, 81, 0.5) + within(b_octaves, 9, 16, bar),
                piano=bells(b, 72, 84, 0.4),
                flute=within(line(b_tune, bar, 0.45), 9, 16, bar),
                left=broken(b, wide, 0.5, 38, 0.32, 0.1),
                cellos=running(b, PULSE, 36, 0.62) + bass(b, [0], 24, 0.6, 3),
                strings=pad(b, 50, 67, 0.6, 4),
                bass=bass(b, [0], 33, 0.7, 3) + bass(b, [0], 45, 0.42, 3),
                drum=bass(b, [0], 33, 0.6)
                + thunder(8, bar, 33, 0.2, 0.6)
                + thunder(16, bar, 33, 0.3, 0.95, 3.0),
                kit=drum(every, bar, [0], KICK, 0.9)
                + drum(every[:15], bar, [1], TOMS[2], 0.6, 0.25)
                + drum(every[:15], bar, [1.5], TOMS[1], 0.5, 0.25)
                + fill(8, bar, DOWN[2:], 0.5, 0.9)
                + fill(16, bar, DOWN, 0.5, 0.95),
                snare=drum(every[:15], bar, [2], 60, 0.85, 0.25)
                + roll([8], bar, 0.6)
                + [[60, 15 * bar + k * 0.25, 0.25, 0.4 + 0.05 * k] for k in range(12)],
                hat=hat(every, bar, 0.6),
                crash=drum([1, 9], bar, [0], 80, 0.8, 3.0),
            ),
            section(
                "hush",
                4,
                bar,
                strings=[[62, 0, 12, 0.24], [69, 0, 12, 0.18]],
                bass=[[38, 0, 12, 0.35]],
                piano=[[69, 3, 3, 0.32], [74, 9, 3, 0.28]],
                drum=bass(low_d, [0], 33, 0.34) + bass(low_d, [0.5], 33, 0.2),
            ),
            section(
                "glory",
                10,
                bar,
                tempo=88,
                violins=line(d_tune + " | d6/3 | r/3", bar, 0.9)
                + raised(line(d_tune + " | d6/3 | r/3", bar, 0.8), -12),
                horn=raised(line(d_tune + " | d5/3 | r/3", bar, 0.7), -12),
                organ=line(d_tune + " | d6/3 | r/3", bar, 0.65)
                + pad(held[:9], 50, 69, 0.42, 4)
                + bass(held[:9], [0], 33, 0.45, 3),
                piano=line(d_tune, bar, 0.45) + raised(line(d_tune, bar, 0.32), -12),
                flute=raised(within(line(d_tune, bar, 0.45), 5, 8, bar), 12),
                left=broken(held[:8], wide, 0.5, 38, 0.32, 0.1)
                + broken(held[8:9], slow, 1, 38, 0.32),
                cellos=bass(held[:9], [0], 36, 0.8, 3) + bass(held[:9], [0], 24, 0.6, 3),
                strings=pad(held[:9], 50, 67, 0.7, 4),
                bass=bass(held[:9], [0], 33, 0.7, 3) + bass(held[:9], [0], 45, 0.42, 3),
                drum=bass(held[:7], [0], 33, 0.7)
                + thunder(7, bar, 33, 0.3, 0.95, 3.0)
                + bass(held[7:8], [0], 38, 1.0)
                + [[38, 8 * bar + k * 0.25, 0.25, 0.75 - 0.03 * k] for k in range(12)]
                + bass(held[9:], [0], 38, 0.9),
                kit=drum([1, 5, 8], bar, [0], KICK, 0.9),
                snare=[[60, 6 * bar + k * 0.25, 0.25, 0.3 + 0.04 * k] for k in range(12)]
                + drum([8, 10], bar, [0], 60, 0.8, 0.25),
                crash=drum([1, 8], bar, [0], 80, 0.85, 3.0),
            ),
            section(
                "after",
                8,
                bar,
                piano=raised(line(d_tune, bar, 0.55), -12),
                left=broken(d, slow, 1, 38, 0.34, 0.05),
                strings=pad(d, 50, 67, 0.18),
                bass=bass(d, [0], 33, 0.2, 3),
            ),
        ],
        ["alone", "name", "rise", "height", "storm", "hush", "glory", "after"],
        [
            {"id": "alone", "round": ["alone"]},
            {"id": "name", "round": ["name"]},
            {"id": "revelation", "once": ["rise"], "round": ["height", "storm"]},
            {"id": "silence", "round": ["hush"], "enters": "beat"},
            {"id": "love", "once": ["glory"], "round": ["after"], "enters": "beat"},
        ],
    )


THEMES = {
    "arrival": arrival,
    "the-library": the_library,
    "the-passages": the_passages,
    "the-broom": the_broom,
    "the-familiar": the_familiar,
    "the-truth": the_truth,
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
