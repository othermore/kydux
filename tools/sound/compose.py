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
            "choir": {"kind": "strings", "volume": 1.0},
            "strings": {"kind": "strings", "volume": 0.5},
            "bass": {"kind": "strings", "volume": 0.6},
            "flute": {"kind": "flute", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.5},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.5},
        },
        ["choir", "strings", "bass", "flute", "harp", "celesta", "drum"],
        ["choir", "strings", "bass"],
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


# --- The candidates (D203): three themes for each chapter, one lively, one even and one
# calm, each in its chapter's manner, for the owner to choose among. The pad under each
# is low and holds its chords one into the next.

# --- Arrival, lively: a bright dance in four in G, a celesta's skipping tune over a
# plucked bass and its after-beats, a flute's answer in its middle part.


def arrival_lively() -> dict:
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
        "arrival-lively",
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
        ["celesta", "flute", "strings", "bass", "chords", "drum"],
        ["celesta", "strings", "bass"],
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


# --- Arrival, even: a lilting tune in six in F, a flute over a rolling harp, the
# celesta in its middle part.


def arrival_even() -> dict:
    bar = 6
    a_chords = "F | Bb | F | C | Dm | Bb | C | C7 | F | Am | Bb | F | Gm | C7 | F | F"
    a_melody = (
        "c5/2 f5 a5/2 c6 | d6/3 bb5/2 d6 | c6/2 a5 f5/2 a5 | g5/6 | "
        "f5/2 a5 d6/2 f6 | d6/2 bb5 f5/2 bb5 | e5/2 g5 c6/2 e6 | e6/3 bb5/3 | "
        "a5/2 c6 f6/2 e6 | e6/3 c6/2 a5 | bb5/2 d6 f6/2 d6 | c6/3 a5/3 | "
        "bb5/2 a5 g5/2 bb5 | bb5/2 g5 e5/2 g5 | f5/2 a5 c6/2 f6 | f6/3 c6/3"
    )
    b_chords = "Dm | Gm | C | F | Dm | Gm | A7 | A7 | Bb | F | Gm | Dm | Bb | C | C7 | C7"
    b_melody = (
        "a5/3 d6/3 | bb5/3 g5/3 | g5/2 c6 e6/2 g6 | f6/6 | "
        "d6/2 f6 a6/2 f6 | g6/3 d6/3 | e6/2 c#6 a5/2 c#6 | e6/6 | "
        "d6/3 f6/3 | c6/3 a5/3 | bb5/2 d6 g6/2 d6 | f6/3 d6/3 | "
        "d6/2 bb5 f5/2 bb5 | c6/2 e6 g6/2 e6 | bb5/2 g5 e5/2 g5 | c6/3 bb5/2 g5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    rolling = [0, 1, 2, 3, 2, 1]
    return theme(
        "arrival-even",
        192,
        [6, 8],
        {
            "flute": {"kind": "flute", "volume": 0.75},
            "celesta": {"kind": "celesta", "volume": 0.7},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.5},
            "bass": {"kind": "pluck", "volume": 0.7},
        },
        ["flute", "celesta", "harp", "strings", "bass"],
        ["harp", "strings", "bass"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.6),
                harp=arpeggio(a, rolling, 1, 53, 0.32, 0.08),
                strings=pad(a, 53, 69, 0.4),
                bass=bass(a, [0, 3], 41, 0.5, 1.5),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.55),
                flute=descant(b, 72, 84, 0.26),
                harp=arpeggio(b, rolling, 1, 53, 0.3, 0.08),
                strings=pad(b, 53, 69, 0.42),
                bass=bass(b, [0, 3], 41, 0.5, 1.5),
            ),
        ],
        ["a", "b", "a"],
    )


# --- Arrival, calm: a slow waltz in D, a celesta's few long notes over a harp, a
# flute in its middle part.


def arrival_calm() -> dict:
    bar = 3
    a_chords = "D | A | Bm | G | D | Em | A | A7 | D | F#m | G | D | Em | A7 | D | D"
    a_melody = (
        "f#5/2 a5 | e5/3 | d5/2 f#5 | b5/3 | a5/2 f#5 | g5/2 e5 | c#5 e5 a5 | g5/3 | "
        "f#5/2 a5 | c#6/3 | b5/2 g5 | a5/3 | g5 e5 b5 | a5/2 e5 | d5/3 | r a4 d5"
    )
    b_chords = "G | D | Em | Bm | G | D | A | A | Bm | F#m | G | D | G | Em | A7 | A7"
    b_melody = (
        "b5/3 | a5/2 f#5 | g5/3 | f#5/2 d5 | g5 b5 d6 | d6/2 a5 | c#6/3 | e5 a5 c#6 | "
        "d6/3 | c#6/2 a5 | b5/2 d6 | a5/3 | g5/2 b5 | e5/2 g5 | e5/3 | g5/2 e5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "arrival-calm",
        96,
        [3, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.75},
            "flute": {"kind": "flute", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.6},
            "strings": {"kind": "strings", "volume": 0.5},
        },
        ["celesta", "flute", "harp", "strings"],
        ["harp", "strings"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.58),
                harp=arpeggio(a, [0, 1, 2], 1, 50, 0.34, 0.08),
                strings=pad(a, 50, 66, 0.4),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.55),
                celesta=bells(b, 78, 90, 0.28, every=4),
                harp=arpeggio(b, [0, 1, 2], 1, 50, 0.32, 0.08),
                strings=pad(b, 50, 66, 0.42),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The library, lively: curious and light on its feet, in four in B flat: a flute's
# skipping tune over plucked strings, the celesta in its middle part.


def the_library_lively() -> dict:
    bar = 4
    a_chords = "Bb | Gm | Eb | F | Bb | Dm | Eb | F7 | Bb | Gm | Cm | F | Dm | Gm | Cm F7 | Bb"
    a_melody = (
        "f5/0.5 bb5/0.5 d6 c6/0.5 bb5/0.5 f5 | g5/1.5 bb5/0.5 d6/2 | "
        "eb6/0.5 d6/0.5 c6 bb5/0.5 g5/0.5 eb5 | f5/2 a5 c6 | "
        "d6/0.5 bb5/0.5 f5 bb5/0.5 d6/0.5 f6 | f6/1.5 d6/0.5 a5/2 | "
        "g5/0.5 bb5/0.5 eb6 d6/0.5 c6/0.5 bb5 | a5/2 c6 eb6 | "
        "d6/2 bb5 f5 | g5/0.5 a5/0.5 bb5 d6/2 | "
        "eb6/0.5 d6/0.5 c6 g5/0.5 c6/0.5 eb6 | c6/3 r | "
        "d6/0.5 f6/0.5 a6 f6/0.5 d6/0.5 a5 | bb5/1.5 g5/0.5 d5/2 | "
        "eb5/0.5 g5/0.5 c6 a5/0.5 c6/0.5 eb6 | d6/2 bb5/2"
    )
    b_chords = "Gm | Cm | F | Bb | Gm | Cm | D7 | D7 | Eb | Bb | Cm | Gm | Eb | Cm | F | F7"
    b_melody = (
        "d6 g6/0.5 d6/0.5 bb5/2 | c6 eb6/0.5 c6/0.5 g5/2 | a5 c6/0.5 a5/0.5 f5 a5 | bb5/3 r | "
        "d6 g6/0.5 d6/0.5 bb5/2 | eb6 g6/0.5 eb6/0.5 c6/2 | f#5 a5 d6 c6 | a5/3 r | "
        "g5 bb5 eb6/2 | f5 bb5 d6/2 | eb6/0.5 d6/0.5 c6 g5/2 | bb5/0.5 a5/0.5 g5 d5/2 | "
        "eb5 g5 bb5 eb6 | c6/2 g5 eb5 | f5 a5 c6 f6 | eb6/2 c6 a5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "the-library-lively",
        104,
        [4, 4],
        {
            "flute": {"kind": "flute", "volume": 0.7},
            "celesta": {"kind": "celesta", "volume": 0.65},
            "pizzicato": {"kind": "pluck", "volume": 0.7},
            "chords": {"kind": "pluck", "volume": 0.4},
            "strings": {"kind": "strings", "volume": 0.45},
        },
        ["flute", "celesta", "pizzicato", "chords", "strings"],
        ["pizzicato", "chords", "strings"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.58),
                pizzicato=bass(a, [0], 34, 0.5, 0.5, fifth=[2]),
                chords=after_beat(a, [1, 3], 55, 70, 0.28, 0.35),
                strings=pad(a, 50, 65, 0.38),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.52),
                pizzicato=bass(b, [0], 34, 0.48, 0.5, fifth=[2]),
                chords=after_beat(b, [1, 3], 55, 70, 0.26, 0.35),
                strings=pad(b, 50, 65, 0.4),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The library, even: a music box's waltz in E flat, the celesta over a harp, a
# flute in its middle part.


def the_library_even() -> dict:
    bar = 3
    a_chords = "Eb | Bb | Cm | Ab | Eb | Fm | Bb | Bb7 | Eb | Gm | Ab | Eb | Fm | Bb7 | Eb | Eb"
    a_melody = (
        "g5 bb5 eb6 | d6/2 bb5 | c6 eb6 g6 | eb6/3 | bb5 eb6 g6 | f6/2 c6 | d6 f6 bb5 | ab5/3 | "
        "g5 bb5 eb6 | d6/2 g6 | ab6 eb6 c6 | bb5/3 | ab5 c6 f6 | d6/2 ab5 | g5/3 | r bb5 eb6"
    )
    b_chords = "Cm | Fm | Bb | Eb | Cm | Fm | G7 | G7 | Ab | Eb | Fm | Cm | Ab | Fm | Bb | Bb7"
    b_melody = (
        "g5/2 c6 | ab5/3 | f5/2 bb5 | g5/3 | eb6/2 c6 | c6/2 ab5 | b5/2 d6 | g5/3 | "
        "c6/2 eb6 | bb5/3 | ab5/2 f5 | g5/3 | eb5 ab5 c6 | f5 ab5 c6 | d6/3 | f6/2 ab5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "the-library-even",
        108,
        [3, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.7},
            "flute": {"kind": "flute", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.45},
        },
        ["celesta", "flute", "harp", "strings"],
        ["harp", "strings"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.55),
                harp=arpeggio(a, [0, 1, 2], 1, 51, 0.34, 0.08),
                strings=pad(a, 51, 67, 0.38),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.52),
                celesta=bells(b, 79, 91, 0.26, every=2),
                harp=arpeggio(b, [0, 1, 2], 1, 51, 0.32, 0.08),
                strings=pad(b, 51, 67, 0.4),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The library, calm: very slow, in A minor: a flute's long notes over a harp that
# climbs a chord a bar, the celesta's few bells in its middle part.


def the_library_calm() -> dict:
    bar = 4
    a_chords = "Am | F | C | G | Am | Dm | E | E | Am | F | C | G | Dm | Am | E7 | Am"
    a_melody = (
        "e5/2 a5/2 | c6/3 a5 | g5/2 e5/2 | d5/4 | e5/2 c6/2 | a5/3 f5 | e5/2 g#5/2 | b5/4 | "
        "c6/2 e6/2 | f6/3 c6 | e6/2 c6/2 | d6/4 | f6/2 d6/2 | c6/2 a5/2 | g#5/2 b5/2 | a5/4"
    )
    b_chords = "C | G | Am | Em | F | C | Dm | E | F | G | Em | Am | Dm | G | E | E7"
    b_melody = (
        "r g5 c6 e6 | d6/2 b5/2 | r a5 c6 e6 | b5/2 g5/2 | r a5 c6 f6 | e6/2 g5/2 | "
        "r f5 a5 d6 | b5/4 | r c6 f6 a6 | g6/2 d6/2 | r b5 e6 g6 | e6/2 c6/2 | "
        "r a5 d6 f6 | d6/2 b5/2 | r g#5 b5 e6 | d6/2 b5/2"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    climbing = [0, 1, 2, 3]
    return theme(
        "the-library-calm",
        66,
        [4, 4],
        {
            "flute": {"kind": "flute", "volume": 0.65},
            "celesta": {"kind": "celesta", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.45},
        },
        ["flute", "celesta", "harp", "strings"],
        ["harp", "strings"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.52),
                harp=arpeggio(a, climbing, 1, 45, 0.34, 0.06),
                strings=pad(a, 48, 64, 0.38),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.46),
                harp=arpeggio(b, climbing, 1, 45, 0.32, 0.06),
                strings=pad(b, 48, 64, 0.4),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The passages, lively: a creeping waltz in E minor, plucked, the celesta's tune
# stepping round its notes by half steps, a flute's long notes in its middle part.


def the_passages_lively() -> dict:
    bar = 3
    a_chords = "Em | Em | Am | B7 | Em | C | F | B7 | Em | D | C | Am | Em | F | B7 | Em"
    a_melody = (
        "e5 g5 b5 | a#5/2 b5 | c6 b5 a5 | f#5/2 d#5 | e5 g5 b5 | c6/2 e6 | f6 c6 a5 | b5/3 | "
        "e6 b5 g5 | f#5/2 a5 | g5 e5 c6 | a5/3 | g5 e5 b5 | a5/2 c6 | b5 a5 f#5 | e5/3"
    )
    b_chords = "Am | Em | F | C | Am | B7 | Em | Em | C | G | Am | Em | F | F | B7 | B7"
    b_melody = (
        "e6/3 | b5/3 | c6/3 | g5/2 e5 | a5/3 | d#6/3 | e6/2 b5 | g5/3 | "
        "e6/3 | d6/3 | c6/2 a5 | b5/3 | a5/3 | c6/2 f5 | f#5/3 | a5/2 f#5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "the-passages-lively",
        144,
        [3, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.75},
            "flute": {"kind": "flute", "volume": 0.5},
            "pizzicato": {"kind": "pluck", "volume": 0.8},
            "chords": {"kind": "pluck", "volume": 0.45},
            "strings": {"kind": "strings", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.45},
        },
        ["celesta", "flute", "pizzicato", "chords", "strings", "drum"],
        ["pizzicato", "chords", "strings"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.52),
                pizzicato=bass(a, [0], 40, 0.55, 0.5),
                chords=after_beat(a, [1, 2], 52, 67, 0.28, 0.3),
                strings=pad(a, 40, 55, 0.36),
                drum=drum([1, 5, 9, 13], bar, [0], 38, 0.28),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.45),
                celesta=bells(b, 76, 88, 0.28, every=2),
                pizzicato=bass(b, [0], 40, 0.5, 0.5),
                chords=after_beat(b, [1, 2], 52, 67, 0.26, 0.3),
                strings=pad(b, 43, 59, 0.4),
                drum=drum([1, 5, 9, 13], bar, [0], 38, 0.28),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The passages, even: a low flute that creeps in A minor over a harp's turning
# figure, the celesta's few steps in its middle part.


def the_passages_even() -> dict:
    bar = 4
    a_chords = "Am | Am | Dm | E | Am | F | Bb | E7 | Am | G | F | Dm | Am | Bb | E | E7"
    a_melody = (
        "a4/1.5 c5/0.5 e5/2 | d#5 e5/3 | f5/1.5 e5/0.5 d5/2 | g#4/2 b4/2 | "
        "a4/1.5 c5/0.5 e5/2 | f5/1.5 a5/0.5 c6/2 | bb5/1.5 a5/0.5 f5/2 | e5/2 g#5/2 | "
        "a5/1.5 e5/0.5 c5/2 | b4/1.5 d5/0.5 g5/2 | a5/1.5 f5/0.5 c5/2 | d5/2 f5/2 | "
        "e5/1.5 c5/0.5 a4/2 | bb4/1.5 d5/0.5 f5/2 | e5/2 g#4/2 | b4/3 r"
    )
    b_chords = "Dm | Am | Bb | F | Dm | E | Am | Am | F | C | Dm | Am | Bb | Bb | E | E7"
    b_melody = (
        "r/2 a5/0.5 d6/0.5 f6 | e6/2 r/2 | r/2 bb5/0.5 d6/0.5 f6 | c6/2 r/2 | "
        "r/2 a5/0.5 d6/0.5 a6 | g#6/2 r/2 | r/2 a5/0.5 c6/0.5 e6 | a5/2 r/2 | "
        "r/2 c6/0.5 f6/0.5 a6 | g6/2 r/2 | r/2 f6/0.5 d6/0.5 a5 | c6/2 r/2 | "
        "r/2 bb5/0.5 d6/0.5 f6 | d6/2 bb5/2 | r/2 g#5/0.5 b5/0.5 e6 | d6/2 b5/2"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    turning = [0, 2, 1, 2]
    return theme(
        "the-passages-even",
        92,
        [4, 4],
        {
            "flute": {"kind": "flute", "volume": 0.6},
            "celesta": {"kind": "celesta", "volume": 0.65},
            "harp": {"kind": "harp", "volume": 0.5},
            "pizzicato": {"kind": "pluck", "volume": 0.75},
            "strings": {"kind": "strings", "volume": 0.5},
            "drum": {"kind": "drum", "volume": 0.45},
        },
        ["flute", "celesta", "harp", "pizzicato", "strings", "drum"],
        ["harp", "pizzicato", "strings"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.52),
                harp=arpeggio(a, turning, 0.5, 45, 0.26, 0.08),
                pizzicato=bass(a, [0], 33, 0.5, 0.5),
                strings=pad(a, 40, 55, 0.36),
                drum=drum([1, 5, 9, 13], bar, [0], 36, 0.28),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.44),
                flute=descant(b, 60, 72, 0.24),
                harp=arpeggio(b, turning, 0.5, 45, 0.24, 0.08),
                pizzicato=bass(b, [0], 33, 0.48, 0.5),
                strings=pad(b, 40, 55, 0.4),
                drum=drum([1, 5, 9, 13], bar, [0], 36, 0.28),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The passages, calm: very slow and bare, in B minor: low strings, a far celesta's
# few bells, a flute's long notes in its middle part, a drum now and then.


def the_passages_calm() -> dict:
    bar = 4
    a_chords = "Bm | Bm | G | F# | Bm | Em | C | F#7 | Bm | A | G | Em | Bm | C | F# | F#"
    a_melody = (
        "r/2 f#5 b5 | d6/2 r/2 | r/2 g5 b5 | a#5/2 r/2 | r/2 f#5 b5 | e6/2 r/2 | "
        "r/2 g5 c6 | a#5/2 r/2 | r/2 b5 d6 | c#6/2 r/2 | r/2 b5 g5 | e5/2 r/2 | "
        "r/2 f#5 d5 | e5/2 r/2 | r/2 c#5 f#5 | r/4"
    )
    b_chords = "G | D | Em | Bm | G | A | Bm | Bm | Em | Bm | C | G | Em | C | F# | F#7"
    b_melody = (
        "b5/4 | a5/2 f#5/2 | g5/4 | f#5/4 | d6/4 | c#6/2 e6/2 | d6/2 b5/2 | r/4 | "
        "g5/4 | f#5/2 d5/2 | e5/2 g5/2 | d5/4 | e5/4 | g5/2 e5/2 | c#5/4 | r/4"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    return theme(
        "the-passages-calm",
        60,
        [4, 4],
        {
            "celesta": {"kind": "celesta", "volume": 0.65},
            "flute": {"kind": "flute", "volume": 0.5},
            "pizzicato": {"kind": "pluck", "volume": 0.7},
            "strings": {"kind": "strings", "volume": 0.6},
            "drum": {"kind": "drum", "volume": 0.45},
        },
        ["celesta", "flute", "pizzicato", "strings", "drum"],
        ["pizzicato", "strings"],
        [
            section(
                "a",
                16,
                bar,
                celesta=line(a_melody, bar, 0.45),
                pizzicato=bass(a, [0], 35, 0.45, 0.5),
                strings=pad(a, 38, 54, 0.38),
                drum=drum([1, 9], bar, [0, 1.5], 35, 0.26),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.42),
                celesta=bells(b, 78, 90, 0.24, every=4),
                pizzicato=bass(b, [0], 35, 0.42, 0.5),
                strings=pad(b, 42, 57, 0.4),
                drum=drum([1, 9], bar, [0, 1.5], 35, 0.26),
            ),
        ],
        ["a", "b", "a"],
    )


# --- The broom, lively: a gallop in A, the flute's quick notes over a plucked bass
# and its chords, a drum under it; a celesta that runs while the flute soars.


def the_broom_lively() -> dict:
    bar = 4
    a_chords = "A | A | D | A | F#m | D | E | E7 | A | C#m | D | A | Bm | E7 | A | A"
    a_melody = (
        "e5/0.5 a5/0.5 c#6/0.5 a5/0.5 e6 c#6 | e6/0.5 d6/0.5 c#6/0.5 b5/0.5 a5/2 | "
        "f#5/0.5 a5/0.5 d6/0.5 a5/0.5 f#6 d6 | e6/0.5 c#6/0.5 a5/0.5 c#6/0.5 e6/2 | "
        "f#6/0.5 e6/0.5 c#6/0.5 a5/0.5 f#5 a5 | d6/0.5 f#6/0.5 a6/0.5 f#6/0.5 d6/2 | "
        "e6/0.5 g#5/0.5 b5/0.5 e6/0.5 g#6 e6 | d6/0.5 b5/0.5 g#5/0.5 b5/0.5 e5/2 | "
        "e5/0.5 a5/0.5 c#6/0.5 a5/0.5 e6 a6 | g#6/0.5 e6/0.5 c#6/0.5 e6/0.5 g#5/2 | "
        "a5/0.5 d6/0.5 f#6/0.5 d6/0.5 a6 f#6 | e6/0.5 c#6/0.5 a5/0.5 e5/0.5 a5/2 | "
        "b5/0.5 d6/0.5 f#6/0.5 d6/0.5 b5 d6 | e6/0.5 d6/0.5 b5/0.5 g#5/0.5 e5 g#5 | "
        "a5/0.5 c#6/0.5 e6/0.5 c#6/0.5 a6/2 | a6 e6 a5/2"
    )
    b_chords = "D | A | E | A | D | A | B7 | E | F#m | C#m | D | A | Bm | D | E | E7"
    b_melody = (
        "f#6/2 a6/2 | e6/3 c#6 | b5/2 e6/2 | c#6/3 e6 | d6/2 f#6/2 | e6/2 c#6 a5 | "
        "d#6/2 f#6/2 | e6/3 r | a5/2 c#6/2 | g#5/2 e6/2 | f#6/2 d6 a5 | c#6/3 e6 | "
        "d6/2 f#6/2 | a6/2 f#6/2 | g#6/2 e6 b5 | e6/2 g#5 b5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    gallop = [1, 1.5, 3, 3.5]
    return theme(
        "the-broom-lively",
        152,
        [4, 4],
        {
            "flute": {"kind": "flute", "volume": 0.8},
            "celesta": {"kind": "celesta", "volume": 0.55},
            "pizzicato": {"kind": "pluck", "volume": 0.8},
            "chords": {"kind": "pluck", "volume": 0.45},
            "strings": {"kind": "strings", "volume": 0.45},
            "drum": {"kind": "drum", "volume": 0.5},
        },
        ["flute", "celesta", "pizzicato", "chords", "strings", "drum"],
        ["pizzicato", "chords", "strings"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.6),
                celesta=bells(a, 81, 93, 0.3, every=2),
                pizzicato=bass(a, [0, 2], 45, 0.55, 0.5),
                chords=after_beat(a, gallop, 57, 72, 0.26, 0.25),
                strings=pad(a, 52, 67, 0.38),
                drum=drum(list(range(1, 17)), bar, [0, 2], 43, 0.26),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.64),
                celesta=arpeggio(b, [3, 4, 5, 4], 0.5, 57, 0.26, 0.06),
                pizzicato=bass(b, [0, 2], 45, 0.55, 0.5),
                chords=after_beat(b, gallop, 57, 72, 0.26, 0.25),
                strings=pad(b, 52, 67, 0.42),
                drum=drum(list(range(1, 17)), bar, [0, 2], 43, 0.28),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The broom, even: a flight in six in G, the flute's long notes and leaps over a
# rolling harp, the celesta's tune in its middle part.


def the_broom_even() -> dict:
    bar = 6
    a_chords = "G | Em | C | D | G | Bm | C | D7 | Em | C | G | D | C | Am | D7 | G"
    a_melody = (
        "b5/3 d6/2 g6 | e6/3 b5/3 | c6/2 e6 g6/2 e6 | d6/3 a5/3 | "
        "b5/3 d6/2 g6 | f#6/3 d6/3 | e6/2 g6 c7/2 g6 | a6/3 f#6/2 d6 | "
        "g6/3 e6/2 b5 | c6/3 e6/2 g6 | d6/2 b5 g5/2 b5 | a5/3 d6/3 | "
        "e6/2 c6 g5/2 c6 | a5/2 c6 e6/2 a6 | f#6/2 a6 d6/2 f#6 | g6/3 d6/3"
    )
    b_chords = "C | G | Am | Em | C | G | A7 | D | Em | Bm | C | G | Am | C | D | D7"
    b_melody = (
        "e6/3 g6/3 | d6/3 b5/3 | c6/2 e6 a6/2 e6 | g6/6 | "
        "e6/2 g6 c7/2 g6 | b6/3 g6/3 | e6/2 c#6 a5/2 c#6 | d6/3 f#6/3 | "
        "g6/3 b6/3 | f#6/3 d6/3 | e6/2 c6 g6/2 e6 | d6/6 | "
        "c6/2 e6 a5/2 c6 | e6/2 g6 c6/2 e6 | f#6/2 a6 d6/2 f#6 | a6/3 f#6/2 d6"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    rolling = [0, 1, 2, 3, 2, 1]
    return theme(
        "the-broom-even",
        240,
        [6, 8],
        {
            "flute": {"kind": "flute", "volume": 0.75},
            "celesta": {"kind": "celesta", "volume": 0.6},
            "harp": {"kind": "harp", "volume": 0.5},
            "strings": {"kind": "strings", "volume": 0.45},
            "bass": {"kind": "pluck", "volume": 0.7},
            "drum": {"kind": "drum", "volume": 0.4},
        },
        ["flute", "celesta", "harp", "strings", "bass", "drum"],
        ["harp", "strings", "bass"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.6),
                harp=arpeggio(a, rolling, 1, 55, 0.3, 0.08),
                strings=pad(a, 50, 66, 0.38),
                bass=bass(a, [0, 3], 43, 0.5, 1.5),
                drum=drum(list(range(1, 17)), bar, [0], 43, 0.22),
            ),
            section(
                "b",
                16,
                bar,
                celesta=line(b_melody, bar, 0.52),
                flute=descant(b, 74, 86, 0.26),
                harp=arpeggio(b, rolling, 1, 55, 0.3, 0.08),
                strings=pad(b, 50, 66, 0.42),
                bass=bass(b, [0, 3], 43, 0.5, 1.5),
                drum=drum(list(range(1, 17)), bar, [0], 43, 0.22),
            ),
        ],
        ["a", "b", "a", "b"],
    )


# --- The broom, calm: a glide, a waltz in B flat: the flute's long lines over a
# harp's wide chords, a celesta's bells now and then.


def the_broom_calm() -> dict:
    bar = 3
    a_chords = "Bb | Bb | Eb | Bb | Gm | Eb | F | F7 | Bb | Dm | Eb | Bb | Cm | F7 | Bb | Bb"
    a_melody = (
        "d5/2 f5 | bb5/3 | g5/2 bb5 | f5/3 | d5/2 g5 | bb5/2 g5 | a5/2 c6 | a5/3 | "
        "d6/2 bb5 | a5/2 f5 | g5/2 eb5 | f5/3 | eb5/2 g5 | f5/2 a5 | bb5/2 d6 | bb5/3"
    )
    b_chords = "Eb | Bb | Cm | Gm | Eb | Bb | C7 | F | Gm | Dm | Eb | Bb | Cm | Eb | F | F7"
    b_melody = (
        "g5/2 bb5 | f5/3 | eb5/2 g5 | d5/3 | g5/2 bb5 | d6/3 | c6/2 e6 | f6/3 | "
        "d6/2 bb5 | a5/2 f5 | g5/2 bb5 | f5/3 | eb5/2 c6 | bb5/2 g5 | a5/2 c6 | a5/2 f5"
    )
    a = harmony(a_chords, bar)
    b = harmony(b_chords, bar)
    wide = [0, 2, 4]
    return theme(
        "the-broom-calm",
        120,
        [3, 4],
        {
            "flute": {"kind": "flute", "volume": 0.7},
            "celesta": {"kind": "celesta", "volume": 0.5},
            "harp": {"kind": "harp", "volume": 0.55},
            "strings": {"kind": "strings", "volume": 0.5},
            "bass": {"kind": "pluck", "volume": 0.65},
        },
        ["flute", "celesta", "harp", "strings", "bass"],
        ["harp", "strings", "bass"],
        [
            section(
                "a",
                16,
                bar,
                flute=line(a_melody, bar, 0.55),
                harp=arpeggio(a, wide, 1, 46, 0.3, 0.06),
                strings=pad(a, 50, 65, 0.38),
                bass=bass(a, [0], 34, 0.45, 2),
            ),
            section(
                "b",
                16,
                bar,
                flute=line(b_melody, bar, 0.58),
                celesta=bells(b, 77, 89, 0.28, every=2),
                harp=arpeggio(b, wide, 1, 46, 0.3, 0.06),
                strings=pad(b, 50, 65, 0.42),
                bass=bass(b, [0], 34, 0.45, 2),
            ),
        ],
        ["a", "b", "a", "b"],
    )


THEMES = {
    "arrival": arrival,
    "the-library": the_library,
    "the-passages": the_passages,
    "the-broom": the_broom,
    "the-familiar": the_familiar,
    "arrival-lively": arrival_lively,
    "arrival-even": arrival_even,
    "arrival-calm": arrival_calm,
    "the-library-lively": the_library_lively,
    "the-library-even": the_library_even,
    "the-library-calm": the_library_calm,
    "the-passages-lively": the_passages_lively,
    "the-passages-even": the_passages_even,
    "the-passages-calm": the_passages_calm,
    "the-broom-lively": the_broom_lively,
    "the-broom-even": the_broom_even,
    "the-broom-calm": the_broom_calm,
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
