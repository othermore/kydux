# The music

Every chapter has a theme of its own (D192), which the page plays with Web Audio
(`app/src/engine/music.ts`). No sound file is loaded: a theme is the notes, and the page
sounds them. A chapter names its theme in its `chapter.json` (`"music"`). A theme has one
set of voices (D210): a story, the map and the start screen play every one at its
written loudness; a lesson and a level play every one too, lower.

The themes are Kydux's own, written for the game, and ship under the GNU GPL, version 3
or later, like the rest of it. They quote no other work.

| Theme | Chapter | Its manner |
|---|---|---|
| `arrival` | 1, Arrival | dusk, outdoors, glad: a march in four in G, a celesta's skipping tune over a plucked bass and its chords, a flute's answer in its middle part, a drum |
| `the-library` | 2, The library | indoors, evening, calm: slow in four in A minor, a piano's phrases with quick notes among the long ones and the celesta's answers, taking turns on the tune, over a harp that climbs and a low pad |
| `the-passages` | 3, The passages | night, a secret, time running while nobody must hear: in four in A minor with its lowered second, a string plucked on every eighth note as a clock, a piano's low notes three, three and two, a timpani on the bar, a horn's long notes that rise a half step and wait, far off, a piano's tune in the second section kept under the clock, a snare's roll at the end of each half |
| `the-broom` | 4, The broom | a race, tense: fast in four in E minor, a piano's short cells that climb and break off over a low voice running in eighth notes, the drum on every beat, a chord pushed off the beat; a bar with no tune, a leap, a raised seventh left hanging |
| `the-familiar` | 5, The familiar | the tower: a slow chorale that opens out, a flute and a harp joining it |

## The file

A theme is `<id>.json`:

- `id`: its name, the file's.
- `tempo`: beats a minute, a beat being the metre's unit, a quarter in 3/4 and 4/4, an
  eighth in 6/8.
- `metre`: `[beats in a bar, unit]`, as `[3, 4]` or `[6, 8]`.
- `voices`: each voice by name, with its `kind` and its `volume` from 0 to 1. The kinds
  are `celesta` (a bell), `strings` (a bowed pad), `pluck` (a plucked string,
  pizzicato), `harp`, `flute`, `piano` (a struck tone that dies away by itself, however
  long its note is written), `brass` (a horn, held for its note's length), `drum` (a
  soft drum, a timpani when it is low) and `snare` (a march's snare, a tap whatever
  pitch and length are written). The pad is the body under the other voices (D203): it
  sounds low, and a chord of it held into the next is one unbroken sound that changes
  its notes. A theme has no other set of voices: the page refuses a file with
  `arrangements` (D210).
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

Open the game with `?debug`, at `#music`: every theme is listed, each with two buttons,
one to hear it as a story plays it and one as a level plays it: the same music,
quieter.

```
https://localhost:5173/?debug#music
```

Over the list are the voices of the theme that plays (D203). Each has a box, which
silences it or lets it sound, and a slider for its volume. They act at once, while the
theme plays. *As written* puts every voice back as the theme's file has it. The line
under them says what is set apart from the file, ready to be copied:

```
the-broom: tune 0.50, strings off
```

A theme new in `content/music/` is listed once the development server is started again,
which packs the content.
