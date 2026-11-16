# The music

Every chapter has a theme of its own (D192), which the page plays with Web Audio
(`app/src/engine/music.ts`). No sound file is loaded: a theme is the notes, and the page
sounds them. A chapter names its theme in its `chapter.json` (`"music"`). A story, the
map and the start screen play the theme whole (`full`); a lesson and a level play it
quietly (`quiet`), with fewer voices and a little lower.

The themes are Kydux's own, written for the game, and ship under the GNU GPL, version 3
or later, like the rest of it. They quote no other work.

| Theme | Chapter | Its manner |
|---|---|---|
| `arrival` | 1, Arrival | dusk, outdoors: a gentle waltz in three, a celesta over strings, a flute in its middle part |
| `the-library` | 2, The library | indoors, evening: harp arpeggios, a curious flute, then the celesta |
| `the-passages` | 3, The passages | night, a secret: sparse pizzicato in D minor, low strings, a tiptoeing celesta, a flute's long notes |
| `the-broom` | 4, The broom | morning, outdoors, a flight: bright and quick in six, a flute over strings and a harp |
| `the-familiar` | 5, The familiar | the tower: a slow chorale that opens out, a flute and a harp joining it |

## The candidates

Beside the theme of each chapter in play are three candidates (D203), for the owner to
choose among by ear: a lively one, an even one and a calm one, each in its chapter's
manner. A chapter names its theme, never a candidate.

| Candidate | Its manner |
|---|---|
| `arrival-lively` | glad, a march in four in G: a celesta's tune over a plucked bass and its chords, a flute in its middle part, a drum |
| `arrival-even` | glad, rolling in six in F: a flute over a harp, the celesta in its middle part |
| `arrival-calm` | glad and slow, a waltz in D: a celesta's long notes over a harp, a flute in its middle part |
| `the-library-lively` | calm but curious, in four in B flat: a flute that skips over pizzicato, the celesta in its middle part |
| `the-library-even` | calm, a music box in three in E flat: the celesta over a harp, a flute in its middle part |
| `the-library-calm` | calm and still, slow in four in A minor: a flute's long notes over a harp that climbs, a celesta's bells |
| `the-passages-lively` | eerie, a creeping waltz in E minor: a celesta that steps round its notes by half steps over pizzicato, a flute's long notes in its middle part |
| `the-passages-even` | eerie, in four in A minor: a low flute that creeps over a harp's turning figure, the celesta's few steps in its middle part |
| `the-passages-calm` | eerie and bare, very slow in B minor: low strings, a far celesta, a flute's long notes, a drum now and then |
| `the-broom-lively` | lively, a gallop in four in A: a flute's quick notes over a plucked bass and its chords, a drum, a celesta that runs while the flute soars |
| `the-broom-even` | lively, a flight in six in G: a flute's long notes and leaps over a rolling harp, the celesta's tune in its middle part |
| `the-broom-calm` | lively at rest, a glide, a waltz in B flat: a flute's long lines over a harp's wide chords, a celesta's bells |

## The file

A theme is `<id>.json`:

- `id`: its name, the file's.
- `tempo`: beats a minute, a beat being the metre's unit, a quarter in 3/4 and 4/4, an
  eighth in 6/8.
- `metre`: `[beats in a bar, unit]`, as `[3, 4]` or `[6, 8]`.
- `voices`: each voice by name, with its `kind` and its `volume` from 0 to 1. The kinds
  are `celesta` (a bell), `strings` (a bowed pad), `pluck` (a plucked string,
  pizzicato), `harp`, `flute` and `drum` (a soft drum). The pad is the body under the
  other voices (D203): it sounds low, and a chord of it held into the next is one
  unbroken sound that changes its notes.
- `arrangements`: the voices `full` plays, every one, and the fewer `quiet` plays.
- `sections`: each with its `id`, its number of `bars`, and its `notes` by voice. A note
  is `[pitch, start, length, loudness]`: its pitch as a MIDI number (60 is the middle C),
  its start and its length in beats from the section's start, and its loudness from 0 to
  1. No note rings past its section's end, so that the next section, or the theme's
  start again, follows without a seam.
- `order`: the sections in the order they are played, which loops.

## How a theme is written

The themes are written as a score in `tools/sound/compose.py`: each melody a bar at a
time, `a4/2 d5 f#5/2 a5`, and each section's harmony as a chord a bar, `Dm | Bb | A7`,
from which the accompaniments are made. This writes the files again:

```sh
.venv/bin/python tools/sound/compose.py
```

A test holds the files to what the score makes, and every theme to its rules.

## How a theme is heard alone

Open the game with `?debug`, at `#music`: every theme is listed, each with a button
for its full and its quiet arrangement.

```
https://localhost:5173/?debug#music
```

Over the list are the voices of the theme that plays (D203). Each has a box, which
silences it or lets it sound, and a slider for its volume. They act at once, while the
theme plays. *As written* puts every voice back as the theme's file has it. The line
under them says what is set apart from the file, ready to be copied:

```
the-broom-lively (Full): flute 0.50, strings off
```

A theme new in `content/music/` is listed once the development server is started again,
which packs the content.
