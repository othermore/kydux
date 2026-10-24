---
outputs:
  - content/stories/at-the-gate/en.md
  - content/stories/at-the-gate/es.md
  - content/stories/up-to-the-castle/en.md
  - content/stories/up-to-the-castle/es.md
  - content/levels/the-gate/text.en.json
  - content/levels/the-gate/text.es.json
  - content/levels/the-corridor/text.en.json
  - content/levels/the-corridor/text.es.json
  - content/levels/the-dark-note/text.en.json
  - content/levels/the-dark-note/text.es.json
  - content/levels/the-long-corridor/text.en.json
  - content/levels/the-long-corridor/text.es.json
  - content/levels/the-stairs/text.en.json
  - content/levels/the-stairs/text.es.json
  - content/levels/the-password/text.en.json
  - content/levels/the-password/text.es.json
  - content/levels/the-wand/text.en.json
  - content/levels/the-wand/text.es.json
  - content/levels/the-sealed-door/text.en.json
  - content/levels/the-sealed-door/text.es.json
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
context:
  - docs/dev/story.md
  - content/stories/the-letter/en.md
  - content/stories/at-the-gate/en.md
  - content/stories/at-the-gate/es.md
  - content/stories/up-to-the-castle/en.md
  - content/stories/up-to-the-castle/es.md
  - content/lessons/what-a-program-is/en.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/notes/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
---
Chapter 1 of Kydux now happens in one place, one scene, and its levels
are parts of it: where one level ends, the next one begins, on the same
spot, and Nuri stands in the scene beside the wizard, teaching. Rewrite
the chapter's two story pages and the texts of its nine levels so that
they tell one continuous story in this place. The lessons stay as they
are: they come between the levels, in the order below, and are given
for you to follow on from.

## The place

The road ends at the top of the hill, at dusk, before a great iron gate
in the castle's outer wall. Outside the gate is the forecourt: a small
garden of hedges and paths. A path runs down along a hedge from the gate,
turns a corner, and runs into a long path along the bottom hedge, to the
foot of a few stone steps that climb back up to a landing beside the gate.
Inside the gate is the gatehouse, all stone: a passage with a flat stone
where things can be set down, a door sealed with a glowing rune, then an
inner gate that listens like the great gate, two more sealed doors, and
the way out at the top to the castle road. The great gate opens to the
word **ambrel**, said beside it; so does the inner gate.

## The story pages

1. `content/stories/at-the-gate/<lang>.md`: keep its three pages as they
   are, word for word, and add a fourth page at the end: Nuri's turn to
   teaching. Before the gate can be opened, there are a few things to
   learn, and they will help in the whole school; Nuri will show them one
   at a time, right here, starting with what a program is. The page makes
   clear that what follows are lessons from Nuri, not more story.
2. `content/stories/up-to-the-castle/<lang>.md`: the chapter's closing.
   Keep what it says (the way in open, the recap of the chapter's ideas
   with the easy word and the programmer's word together, the wand only
   lent, Ilda waiting inside), and add the errand of the next chapter:
   the wizard has to get a school wand from the wand bank, a counter
   inside the castle run by the pupils' parents, and give Nuri's spare
   wand back. Four pages, as now.

## The levels

Each level file is a JSON object with exactly these keys: `title`,
`goals` (a list, one short sentence per goal, exactly as many as listed
below, in that order; a bonus goal's sentence is plain), `starting_code`
(one string, lines separated by `\n`, ending in `\n`, or empty),
`hints` (two or three, from the gentlest to the one that nearly says
it; a hint is never, and never quotes, a whole line of the solution; it
may name an action in backticks), `intro` (one to three short sentences
Nuri says before the level), `outro` (one or two short sentences Nuri
says after a win: a word of the story, what happens next) and `learned`
(one sentence starting "Now you know" / "Ahora sabes", the idea the level
practised, easy word and programmer's word together). The last level,
`the-way-in`, has no `learned` key at all.

Starting code: a practice starts empty or with comments only, in the
child's language, that say what to do and never how (no code line). A
fix or improve level starts with the program given below, exactly, and
may have one comment line above it.

Nuri speaks every intro and outro. Nuri stands next to the wizard in the
scene, so Nuri may say "here", "this way", "follow the hedge".

1. `the-gate`, Practice 1, after *what a program is*. The wizard stands
   one step left of a glowing circle on the ground, in front of the great
   gate; Nuri stands just behind. Goal: walk to the gate. Starting code: empty, no
   comment. Solution: one step right. The gate stays shut: walking up to
   it does not open it. Outro: the gate is still shut, but you made your
   wizard move; Nuri has more to show.
2. `the-corridor`, Practice 2, after *objects and actions*. Title: the
   path by the hedge (not a corridor). From the gate, the path runs down
   along the hedge for two steps, then turns left for two. Nuri wants to
   look round the forecourt for another way in. Goal: reach the end of
   the path. Starting code: one or two comments that say to follow the
   path down the hedge and round the corner, no code. Solution: down,
   down, left, left.
3. `the-dark-note`, Fix 1, after *notes*. Nuri wrote a program on the way
   up the hill to walk the next bit of path (two steps left, then two
   down), and one of its moves is wrong. Goal: reach the end of the path.
   Starting code, exactly: one comment line saying that one move of this
   program is wrong and to find and fix it (without saying which), then
   `wizard.move_left()`, `wizard.move_left()`, `wizard.move_down()`,
   `wizard.move_right()`, one per line. Solution: the last move made
   `move_down`.
4. `the-long-corridor`, Practice 3, after *how much*. Title: the long
   path (not a corridor). The long path along the bottom hedge, six steps
   to the left, to the foot of the stone steps. Goals: reach the foot of
   the steps; bonus: do it in fewer than 2 lines. Starting code: one or
   two comments that say to go to the foot of the steps in one
   instruction, telling the action how many steps; no code. Solution:
   `move_left` with 6.
5. `the-stairs`, Improve 1, after *how much*. The stone steps climb back
   to the landing beside the gate: up two, right three, up two, right two.
   Nuri's program climbs them, but bumps into the wall twice because two
   of its numbers are too big; it works, and can be made better. Goals:
   climb to the landing; do not bump into anything; bonus: do it in fewer
   than 5 lines. Starting code, exactly: one comment line saying it
   reaches the landing but bumps twice, and to make it better, then
   `wizard.move_up(3)`, `wizard.move_right(3)`, `wizard.move_up(3)`,
   `wizard.move_right(2)`. Solution: both `move_up` with 2.
6. `the-password`, Practice 4, after *words*. Back at the gate, five steps
   to its right. Nuri learned the word from an older pupil: **ambrel**,
   said beside the gate, exactly, in small letters. Goals: open the gate;
   walk through it. Starting code: one comment that gives the word, and
   one that says to stand beside the gate, say it, and walk through.
   Solution: five steps right, `say` the word, two steps right.
7. `the-wand`, Practice 5, after *things to carry*. Title: the wand.
   Inside the gatehouse: Nuri has gone ahead and set a spare wand on the
   flat stone, three steps on; Nuri lends it, to be given back one day.
   From now on the wizard carries it. Goals: pick up the wand; walk on to
   Nuri. Starting code: comments that say to walk to the stone, pick up
   the wand, and walk on to Nuri; no code. Solution: three steps right,
   pick up, three steps right.
8. `the-sealed-door`, Practice 6, after *your first spell*. The passage
   goes on to a door sealed with a glowing rune, three steps ahead; the
   wizard already carries the lent wand (it is never picked up again),
   and a spell needs a wand. Goals: break the door's seal; walk through
   it. Starting code: comments that say to walk up to the door, cast
   `zelim` beside it, and walk through to the end of the passage; no
   code. Solution: two steps right, cast `zelim`, three steps right.
9. `the-way-in`, Practice 7, the chapter's last. The inner gate, just
   above, listens to the same word as the great gate; beyond it the
   passage turns left past two sealed doors, then up to the castle road.
   Everything of the chapter together, the wand in hand. Goals: reach the
   castle road; bonus: do it in fewer than 9 lines. Starting code:
   comments that say what waits (a gate that listens, two seals), not how.
   Solution: one step up, `say` the word, two up, three left, cast
   `zelim`, four left, cast `zelim`, two up. No `learned` key.

Keep every text short and warm, for a child of eight. Goals say what to
reach, not how. Never call the forecourt's paths corridors.
