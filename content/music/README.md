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

## The file

A theme is `<id>.json`:

- `id`: its name, the file's.
- `tempo`: beats a minute, a beat being the metre's unit, a quarter in 3/4 and 4/4, an
  eighth in 6/8.
- `metre`: `[beats in a bar, unit]`, as `[3, 4]` or `[6, 8]`.
- `voices`: each voice by name, with its `kind` and its `volume` from 0 to 1. The kinds
  are `celesta` (a bell), `strings` (a bowed pad), `pluck` (a plucked string,
  pizzicato), `harp`, `flute` and `drum` (a soft drum).
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
