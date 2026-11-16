---
outputs:
  - content/levels/eldras-door/changes.en.txt
  - content/levels/eldras-door/changes.es.txt
  - content/levels/the-moving-key/changes.en.txt
  - content/levels/the-moving-key/changes.es.txt
  - content/levels/left-or-right/changes.en.txt
  - content/levels/left-or-right/changes.es.txt
  - content/levels/past-the-teacher/changes.en.txt
  - content/levels/past-the-teacher/changes.es.txt
  - content/levels/by-the-statues/changes.en.txt
  - content/levels/by-the-statues/changes.es.txt
  - content/levels/the-dark-room/changes.en.txt
  - content/levels/the-dark-room/changes.es.txt
  - content/levels/the-night-walk/changes.en.txt
  - content/levels/the-night-walk/changes.es.txt
  - content/levels/the-opening-hole/changes.en.txt
  - content/levels/the-opening-hole/changes.es.txt
  - content/levels/the-wrong-door/changes.en.txt
  - content/levels/the-wrong-door/changes.es.txt
  - content/levels/the-shed/changes.en.txt
  - content/levels/the-shed/changes.es.txt
  - content/levels/the-brooms-on-the-wall/changes.en.txt
  - content/levels/the-brooms-on-the-wall/changes.es.txt
  - content/levels/the-brooms-in-the-straw/changes.en.txt
  - content/levels/the-brooms-in-the-straw/changes.es.txt
  - content/levels/the-check/changes.en.txt
  - content/levels/the-check/changes.es.txt
context:
  - docs/dev/story.md
  - content/levels/eldras-door/text.*.json
  - content/levels/eldras-door/level.json
  - content/levels/the-moving-key/text.*.json
  - content/levels/the-moving-key/level.json
  - content/levels/left-or-right/text.*.json
  - content/levels/left-or-right/level.json
  - content/levels/past-the-teacher/text.*.json
  - content/levels/past-the-teacher/level.json
  - content/levels/by-the-statues/text.*.json
  - content/levels/by-the-statues/level.json
  - content/levels/the-dark-room/text.*.json
  - content/levels/the-dark-room/level.json
  - content/levels/the-night-walk/text.*.json
  - content/levels/the-night-walk/level.json
  - content/levels/the-opening-hole/text.*.json
  - content/levels/the-opening-hole/level.json
  - content/levels/the-wrong-door/text.*.json
  - content/levels/the-wrong-door/level.json
  - content/levels/the-shed/text.*.json
  - content/levels/the-shed/level.json
  - content/levels/the-brooms-on-the-wall/text.*.json
  - content/levels/the-brooms-on-the-wall/level.json
  - content/levels/the-brooms-in-the-straw/text.*.json
  - content/levels/the-brooms-in-the-straw/level.json
  - content/levels/the-check/text.*.json
  - content/levels/the-check/level.json
---
Write one sentence for each of the thirteen levels listed, in English and in Spanish: the
files listed, each holding that one sentence and nothing else, no quotes, no title.

## What the sentence is for

Each of these levels is played several times over in the game's world when the child
runs a program: the things in it are laid out in a few different arrangements (a key
nearer or further from a door, more or fewer brooms on the floor, a teacher who looks
up or down), and the program must win in every one of them. That is how the game is
programmed, and the child must never be told of it: never of "ways", "arrangements",
"versions", "maneras", "formas", "variantes", nor of how many there are. What the child
is told is what may be different each time the program runs, in the words the level's
own intro uses for those things, so that the child understands that the program has to
look or count instead of holding a number.

The start card shows your sentence, and under it, always, the words *Tu programa tiene
que valer siempre.* / *Your program has to work every time.* Do not say that part: it
follows your sentence on every card.

Two examples of the kind of sentence wanted, from the owner:

- *El número de escobas del suelo cambia cada vez.*
- *La llave está cada vez a una distancia distinta de la puerta.*

## What each level's arrangements differ in

Each level's `level.json` (its `ways`) and its texts are given above. The `ways` entry
of each `text.<lang>.json` names each arrangement in words: it is what the game says
today and leaves the game; read it to know what differs, and never copy its words as a
list. The intro and the hints say what the things are called in that level: use those
names (*la llave*, *Dask*, *el agujero*, *las escobas*).

For the broom shed's four levels the arrangements change in this sprint; say what the
designer says here, not what the files given show:

- `the-shed`: how many brooms lie on the floor differs each time, and some of them are
  hidden in the straw.
- `the-brooms-on-the-wall`: how many brooms hang on the wall, and on which pegs, differs
  each time.
- `the-brooms-in-the-straw`: how many brooms lie on the floor, and where, differs each
  time, so the next one may be on any side.
- `the-check`: how many brooms hang, on which pegs, and which of them still have a knot,
  differs each time.

## How it is written

- One sentence, short and plain, for a child of eight: what may be different each
  time, nothing else. No "each time you run it" twice; no exclamation.
- In the level's own words for its things, as the speaker of its intro would say it,
  but in the voice of the game's card: not addressed by name, no "we".
- Never *manera*, *way*, *forma*, *arrangement* or a count of them; never a cell or a
  number of steps of one arrangement.
- In Spanish, where the wizard is named, `{el mago|la maga}`, as the texts do; a code
  name in backquotes, as the texts write it (`store_door`).
- The English and the Spanish say the same thing, each as a native speaker would.
