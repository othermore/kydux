---
outputs:
  - content/levels/the-watchtower/text.en.json
  - content/levels/the-watchtower/text.es.json
  - content/levels/the-watch/text.en.json
  - content/levels/the-watch/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/levels/the-wrong-door/text.en.json
  - content/levels/the-wrong-door/text.es.json
  - content/levels/the-long-stairs/text.en.json
  - content/levels/the-long-stairs/text.es.json
  - content/levels/past-the-teacher/text.en.json
  - content/levels/past-the-teacher/text.es.json
  - content/levels/the-moving-stairs/text.en.json
  - content/levels/the-moving-stairs/text.es.json
  - content/levels/the-dark-room/text.en.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
context:
  - docs/dev/story.md
  - content/stories/after-dark/en.md
  - content/stories/the-top-of-the-stairs/en.md
  - content/stories/caught/en.md
  - content/lessons/true-or-false/en.md
  - content/lessons/if/en.md
  - content/lessons/else/en.md
  - content/lessons/repeat/en.md
  - content/lessons/while/en.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
  - content/levels/the-watch/text.en.json
  - content/levels/left-or-right/text.en.json
  - content/levels/eldras-book/text.en.json
  - content/levels/eldras-book/text.es.json
---
Write the texts of chapter 3's nine levels, *The passages*, at night.
The chapter happens in two places, and in each the levels are parts of
it: where one level ends, the next begins, on the same spot. Nuri stands
beside the wizard in every level and speaks every intro and outro, in a
whisper, in the voice of the lessons; Nuri is the wizard's gender. Dask
patrols. The wizard carries the school wand in every level. The story
pages and lessons are given; the levels come between them, in this order.
Never scary: the night is an adventure, and being seen only means trying
again.

## The places

The passages: a watchtower's gallery, where Dask stands in a nook
staring at the wall; below it, the corridor of Dask's round; below, two
rooms with two doors each, left and right, one locked; then the foot of
the long stairs, which climb eight steps up and right. At the top, after
a story page, the night passages: Dask's long corridor; a passage with a
moving stair; a dark room with a locked door; the night walk's corridor
with a key, a locked door and another moving stair, and below it Dask's
lower round and the way down to the dormitory.

## The levels

Each level file is a JSON object with exactly these keys: `title`,
`goals` (one short sentence per goal, exactly as many as listed below, in
that order; a bonus goal's sentence is plain), `starting_code` (one
string, lines separated by `\n`, ending in `\n`, or empty), `hints` (two
or three, from the gentlest to the one that nearly says it; a hint is
never, and never quotes, a whole line of the solution; it may name an
action or an attribute in backticks), `intro` (one to three short
sentences Nuri says before the level), `outro` (one or two short
sentences Nuri says after a win) and `learned` (one sentence starting
"Now you know" / "Ahora sabes", the idea the level practised, the
child's word and the programmer's word together). Levels played in two
ways have one more key, `ways`, an object with a short name for each way
by its id, given below. The last level, `the-night-walk`, has no
`learned` key.

Starting code: a practice starts with comments only, in the child's
language, that say what to do and never how (no code line). A fix or
improve level starts with the program given below, exactly, and may have
one comment line above it.

1. `the-watchtower`, Practice 1, after *true or false*. The gallery: Dask
   stands in his nook halfway along, staring at the wall. Ask which way
   he faces and whether he can see you, then walk past. Goals: walk
   along the gallery; do not let Dask see you; bonus: ask whether Dask
   can see you. Starting code: comments saying to ask, with `print`,
   which way Dask faces and whether he can see you, then walk on.
   Solution: `print(dask.facing)`, `print(dask.can_see(wizard))`,
   right 6.
2. `the-watch`, Practice 2, after *if*, played two ways. Dask's round,
   just below: Dask walks a short round and either looks away (way
   `away`) or this way (way `watching`). Cross his corridor down to the
   room below. Goals: cross to the room below; do not let Dask see you.
   `ways`: `away` (Dask looks away), `watching` (Dask looks this way).
   Starting code: comments saying to wait only if Dask looks this way,
   then cross. Solution: `if dask.facing == "left":` and moved in
   `wizard.wait()`, then down 2.
3. `left-or-right`, Practice 3, after *else*, played two ways. A room with
   two doors, left and right, one locked; which one changes. Goals:
   reach the way down. `ways`: `left_locked` (the left door is locked),
   `right_locked` (the right door is locked). Starting code: comments
   saying one door is locked and to choose with `if` and `else`.
   Solution: `if left_door.locked:` go right, open the right door, down,
   back left; `else:` the mirror; then down 1.
4. `the-wrong-door`, Fix 1, after *else*, played two ways. The next room,
   two doors again, and a program of Nuri's whose `if` and `else` lines
   are the wrong way round: it tries the locked door. Goals: reach the
   foot of the long stairs. `ways`: `left_locked`, `right_locked`, as
   above. Starting code, exactly: one comment line saying the program
   chooses the wrong door and to find and fix it, then
   `if left_door.locked:`, moved in `wizard.move_left(2)`,
   `left_door.open()`, `wizard.move_down(2)`, `wizard.move_right(6)`;
   `else:`, moved in `wizard.move_right(2)`, `right_door.open()`,
   `wizard.move_down(2)`, `wizard.move_right(2)`. Solution: the two
   bodies swapped.
5. `the-long-stairs`, Improve 1, after *repeat*. The long stairs: up and
   right, eight times. Nuri's program climbs them in sixteen lines; it
   works, and a loop makes it better. Goals: climb to the top; do it in
   fewer than 4 lines. Starting code, exactly: one comment line saying
   it works in sixteen lines and to make it shorter with a loop, then
   `wizard.move_up()` and `wizard.move_right()`, eight times over, one
   per line. Solution: `for step in range(8):` with the two moves moved
   in.
6. `past-the-teacher`, Practice 4, after *while*, in the night passages.
   Dask walks his long corridor, which the wizard must cross, straight
   up, while he looks away. Goals: cross the corridor; do not let Dask
   see you. Starting code: comments saying to wait while Dask looks
   this way, then cross. Solution: `while dask.facing == "left":` and
   moved in `wizard.wait()`, then up 2.
7. `the-moving-stairs`, Practice 5, after *two spells*. Up the passage
   to a stair that comes and goes over a gap. Goals: cross the gap;
   bonus: ask the stair whether it is in place. Starting code: comments
   saying to wait for the stair, then cross. Solution: up 2, right 1,
   `while not stair.in_place:` and moved in `wizard.wait()`, right 4.
8. `the-dark-room`, Practice 6. A dark room; its key is somewhere in it,
   and its door is locked. Goals: open the door; go through it; bonus:
   find the key with `find_nearest`. Starting code: comments saying to
   light the room, find the key, and open the door. Solution:
   `wizard.cast("kirra")`, `key = wizard.find_nearest("key")`,
   `print(key.position)`, right 4, down 1, pick up, left 1,
   `door.open()`, down 2.
9. `the-night-walk`, Practice 7, the chapter's last. Dark again: a key, a
   locked door, a moving stair, then down past Dask's lower round to the
   way down to the dormitory. Everything of the chapter together. Goals:
   reach the way down to the dormitory; do not let Dask see you.
   Starting code: comments saying what waits, not how. No `learned` key.
