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
    sections: list[dict],
    order: list[str],
) -> dict:
    """A theme's file: its one set of voices (D210), every one played wherever the theme
    is heard, and its sections in their order."""
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
        "sections": sections,
        "order": order,
    }


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


# --- The passages: night, a secret, eerie, very slow, in E with its lowered second: a
# low pad that barely moves, a tritone held against it, single notes of the celesta and
# the harp far apart that die away, a note repeated fading as an echo, a low drum now
# and then as a far door; no tune to whistle (D209).


def echo(pitch: int, start: float, loud: float, times: int = 4, gap: float = 1.5) -> list:
    """A note repeated, each time softer, as an echo dies away."""
    return [[pitch, start + gap * k, 1.0, loud * 0.55**k] for k in range(times)]


def far(*notes: tuple[str, float, float]) -> list[list[float]]:
    """Single notes far apart, each `(name, beat from the section's start, loudness)`,
    left to ring out."""
    return [[pitch(name), start, 3.0, loud] for name, start, loud in notes]


def the_passages() -> dict:
    bar = 4
    a = harmony("Em | Em | Em | Em | F | F | Em | Em | Em | Em | Dm | Dm | F | F | Em | Em", bar)
    b = harmony("Am | Am | F | F | Am | Am | Bb | Bb | Dm | Dm | F | F | E | E | E | E", bar)
    return theme(
        "the-passages",
        56,
        [4, 4],
        {
            "pad": {"kind": "strings", "volume": 0.6},
            "shadow": {"kind": "strings", "volume": 0.4},
            "celesta": {"kind": "celesta", "volume": 0.55},
            "harp": {"kind": "harp", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.6},
        },
        [
            section(
                "a",
                16,
                bar,
                pad=pad(a, 38, 52, 0.42, count=2),
                # The tritone, B flat against the E under it.
                shadow=[[58, 16, 8, 0.3], [58, 48, 12, 0.32]],
                celesta=far(("b5", 5, 0.4), ("f5", 22, 0.36), ("e6", 37, 0.34), ("c6", 54, 0.3))
                + echo(76, 27, 0.32),
                harp=far(("e3", 10, 0.42), ("f3", 18, 0.38), ("b2", 44, 0.4), ("bb2", 58, 0.36)),
                drum=[[31, 14, 1, 0.34], [31, 40, 1, 0.3], [31, 59, 1, 0.26]],
            ),
            section(
                "b",
                16,
                bar,
                pad=pad(b, 38, 52, 0.42, count=2),
                shadow=[[52, 24, 8, 0.28], [58, 52, 12, 0.3]],
                celesta=far(
                    ("a5", 3, 0.38), ("bb5", 26, 0.34), ("d6", 35, 0.32), ("g#5", 57, 0.34)
                )
                + echo(69, 42, 0.3),
                harp=far(("a2", 8, 0.4), ("e3", 19, 0.36), ("f2", 46, 0.4)),
                drum=[[31, 30, 1, 0.32], [31, 50, 1, 0.3]],
            ),
        ],
        ["a", "b", "a"],
    )


# --- The passages, with less in it: the pad and its tritone, fewer notes far apart, one
# echo, the far door once a section.


def the_passages_b() -> dict:
    bar = 4
    a = harmony("Em | Em | Em | Em | F | F | Em | Em | Em | Em | Em | Em | F | F | Em | Em", bar)
    b = harmony("Am | Am | Am | Am | Bb | Bb | Am | Am | Dm | Dm | Dm | Dm | E | E | E | E", bar)
    return theme(
        "the-passages-b",
        52,
        [4, 4],
        {
            "pad": {"kind": "strings", "volume": 0.6},
            "shadow": {"kind": "strings", "volume": 0.4},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.6},
        },
        [
            section(
                "a",
                16,
                bar,
                pad=pad(a, 38, 52, 0.42, count=2),
                shadow=[[58, 32, 16, 0.3]],
                celesta=far(("f5", 12, 0.34), ("e6", 46, 0.3)) + echo(71, 26, 0.3, times=3),
                drum=[[31, 22, 1, 0.3]],
            ),
            section(
                "b",
                16,
                bar,
                pad=pad(b, 38, 52, 0.42, count=2),
                shadow=[[52, 40, 16, 0.28]],
                celesta=far(("bb5", 18, 0.32), ("g#5", 56, 0.3)),
                drum=[[31, 44, 1, 0.28]],
            ),
        ],
        ["a", "b", "a"],
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
VOICES_OF_THE_RACE = {
    "tune": {"kind": "piano", "volume": 0.8},
    "bass": {"kind": "pluck", "volume": 0.85},
    "push": {"kind": "pluck", "volume": 0.45},
    "strings": {"kind": "strings", "volume": 0.4},
    "drum": {"kind": "drum", "volume": 0.55},
}


def the_race(
    id_: str, a_chords: str, a_tune: str, b_chords: str, b_tune: str, drumless: set
) -> dict:
    """A theme of the broom's race: its two sections' chords and tunes, and the bars of
    the first whose drum is silent."""
    bar = 4
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        id_,
        160,
        [4, 4],
        dict(VOICES_OF_THE_RACE),
        [
            section(
                "a",
                16,
                bar,
                tune=line(a_tune, bar, 0.62),
                bass=running(a, RUN, 40, 0.5),
                push=after_beat(a, [3.5], 55, 70, 0.34, 0.3),
                strings=pad(a, 45, 60, 0.32),
                drum=beats([n for n in range(1, 17) if n not in drumless], bar, 43, 0.3, 0.2),
            ),
            section(
                "b",
                16,
                bar,
                tune=line(b_tune, bar, 0.64),
                bass=running(b, RUN, 40, 0.52),
                push=after_beat(b, [3.5], 55, 70, 0.36, 0.3),
                strings=pad(b, 45, 60, 0.34),
                drum=beats(list(range(1, 17)), bar, 43, 0.32, 0.22),
            ),
        ],
        ["a", "b", "a", "b"],
    )


def the_broom() -> dict:
    return the_race(
        "the-broom",
        "Em | Em | C | D | Em | Em | Am | B7 | Em | G | C | D | Am | Em | B7 | B7",
        (
            "e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5 r | g5/0.5 a5/0.5 b5/0.5 c6/0.5 b5/0.5 r/1.5 | "
            "c6/0.5 d6/0.5 e6 r/0.5 e5/0.5 g5 | r/4 | "
            "b4/0.5 c5/0.5 d5/0.5 e5/0.5 f#5 r | e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5/0.5 r/0.5 e6 | "
            "e6/0.5 d6/0.5 c6 r/0.5 a5/0.5 c6 | d#6/2 r/0.5 b5/0.5 a5 | "
            "e5/0.5 f#5/0.5 g5/0.5 b5/0.5 e6 r | d6/0.5 e6/0.5 f#6/0.5 g6/0.5 f#6 r | "
            "e6/0.5 f#6/0.5 g6 r/2 | f#4/0.5 a4/0.5 d5 r/2 | "
            "a4/0.5 b4/0.5 c5/0.5 d5/0.5 e5 r | g5/0.5 f#5/0.5 e5/0.5 f#5/0.5 g5 r | "
            "a5/0.5 b5/0.5 c6/0.5 d#6/0.5 f#6 r | a6/0.5 f#6/0.5 d#6/0.5 b5/0.5 d#6/2"
        ),
        "C | D | Em | Em | C | D | B7 | B7 | Am | B7 | Em | C | Am | B7 | Em | B7",
        (
            "g5/0.5 a5/0.5 b5/0.5 c6/0.5 e6 r | a5/0.5 b5/0.5 c6/0.5 d6/0.5 f#6 r | "
            "b5/0.5 c6/0.5 d6/0.5 e6/0.5 g6/0.5 r/1.5 | r/4 | "
            "e6/0.5 d6/0.5 c6/0.5 b5/0.5 c6 r | f#6/0.5 e6/0.5 d6/0.5 c6/0.5 d6 r | "
            "d#5 f#5/0.5 a5/0.5 b5 d#6 | f#6/2 r/2 | "
            "c5/0.5 d5/0.5 e5/0.5 f#5/0.5 g5 r | d#5/0.5 e5/0.5 f#5/0.5 g5/0.5 a5 r | "
            "b5/0.5 c6/0.5 b5/0.5 a5/0.5 g5 e6 | e6/0.5 r/0.5 e6/0.5 r/0.5 g6/0.5 r/1.5 | "
            "a5/0.5 b5/0.5 c6/0.5 d6/0.5 e6 r | d#6/0.5 e6/0.5 f#6/0.5 a6/0.5 b6 r | "
            "g6/0.5 f#6/0.5 e6/0.5 d#6/0.5 r/2 | b5/0.5 c6/0.5 d6/0.5 d#6/0.5 f#6/2"
        ),
        set(),
    )


# --- The broom, another tune for the owner's ear: the same race, its cells climbing by
# half steps too, a leap of two octaves down, a bar where the drum stops, a chord a half
# step above the tonic's fifth (F) in its second section.


def the_broom_b() -> dict:
    return the_race(
        "the-broom-b",
        "Em | Em | Em | Em | C | C | B7 | B7 | Em | Em | Em | Em | Am | C | B7 | B7",
        (
            "b4/0.5 e5/0.5 f#5/0.5 g5/0.5 r/2 | e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5/0.5 r/1.5 | "
            "g5/0.5 a5/0.5 b5/0.5 c6/0.5 d6/0.5 r/1.5 | e6/0.5 r/0.5 e4/0.5 r/2.5 | "
            "e5/0.5 f5/0.5 f#5/0.5 g5/0.5 c6 r | g5/0.5 g#5/0.5 a5/0.5 b5/0.5 c6/0.5 r/1.5 | "
            "b5/0.5 c6/0.5 d#6 r/2 | r/4 | "
            "e6/0.5 d#6/0.5 e6/0.5 f#6/0.5 g6 r | f#6/0.5 e6/0.5 d#6/0.5 b5/0.5 r/2 | "
            "g5/0.5 a5/0.5 b5/0.5 c6/0.5 d#6 r | e6/2 r/2 | "
            "a4/0.5 b4/0.5 c5/0.5 d5/0.5 e5/0.5 r/1.5 | "
            "e5/0.5 f#5/0.5 g5/0.5 a5/0.5 b5/0.5 r/0.5 e6 | "
            "d#6/0.5 e6/0.5 f#6/0.5 a6/0.5 r/2 | f#6/0.5 d#6/0.5 b5/0.5 a5/0.5 f#5/2"
        ),
        "Am | Am | Em | Em | F | F | B7 | B7 | Am | Am | Em | C | Am | F | B7 | B7",
        (
            "a5/0.5 b5/0.5 c6/0.5 r/0.5 c6/0.5 d6/0.5 e6 | r/2 e5/0.5 a5/0.5 c6 | "
            "b5/0.5 c6/0.5 d6/0.5 e6/0.5 g6 r | e6/0.5 b5/0.5 g5/0.5 e5/0.5 b4/2 | "
            "f5/0.5 g5/0.5 a5/0.5 c6/0.5 f6 r | e6/0.5 f6/0.5 a6 r/2 | "
            "d#6/0.5 f#6/0.5 b6 r/2 | a6/0.5 f#6/0.5 d#6/0.5 r/2.5 | "
            "c5/0.5 d5/0.5 e5/0.5 f5/0.5 e5 r | e5/0.5 f5/0.5 g#5/0.5 a5/0.5 b5/0.5 r/1.5 | "
            "g5/0.5 a5/0.5 b5 r/2 | c6/0.5 d6/0.5 e6 r/2 | "
            "e6/0.5 f#6/0.5 g6 r/0.5 a4/0.5 c5 | f5/0.5 a5/0.5 c6/0.5 f6/0.5 r/2 | "
            "f#6/0.5 a6/0.5 b6/0.5 d#6/0.5 r/2 | c6/0.5 c#6/0.5 d6/0.5 d#6/0.5 f#6/2"
        ),
        {8},
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
            "choir": {"kind": "strings", "volume": 1.0},
            "strings": {"kind": "strings", "volume": 0.5},
            "bass": {"kind": "strings", "volume": 0.6},
            "flute": {"kind": "flute", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.5},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.5},
        },
        [
            section(
                "a",
                16,
                bar,
                choir=line(a_top, bar, 0.88),
                strings=pad(a, 50, 65, 0.38),
                bass=bass(a, [0], 36, 0.4, 4),
                drum=drum([4, 8, 12, 16], bar, [0], 36, 0.3),
            ),
            section(
                "b",
                16,
                bar,
                choir=line(b_top, bar, 0.97),
                strings=pad(b, 52, 67, 0.42),
                bass=bass(b, [0], 36, 0.44, 4),
                harp=arpeggio(b, rising, 1, 48, 0.3, 0.06),
                drum=drum([4, 8, 12, 16], bar, [0], 36, 0.32),
            ),
            section(
                "c",
                16,
                bar,
                flute=line(c_top, bar, 0.55),
                choir=line(c_top.replace("6/", "5/").replace("g#5/", "g#4/"), bar, 0.8),
                strings=pad(c, 50, 65, 0.42),
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
    "the-passages-b": the_passages_b,
    "the-broom": the_broom,
    "the-broom-b": the_broom_b,
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
