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
  - content/stories/after-dark/text.en.json
  - content/stories/the-top-of-the-stairs/text.en.json
  - content/stories/caught/text.en.json
  - content/lessons/true-or-false/en.md
  - content/lessons/if/en.md
  - content/lessons/else/en.md
  - content/lessons/repeat/en.md
  - content/lessons/while/en.md
  - content/lessons/kirra-and-osto/en.md
  - content/levels/eldras-book/text.en.json
---
Write the texts of chapter 3's nine levels, in English and Spanish. The
chapter's stories and lessons are given, and the last level of chapter 2
for its voice. Each level comes right after the lesson it practises, in
the order below, and the levels are where the story moves on between the
lessons. Nuri speaks in every level, whispering at night, in the voice of
the lessons, and is of the wizard's gender (Spanish choices for Nuri's
own gendered words too).

## Where it happens

At night, in two scenes. The passages: the watchtower's gallery, where
Dask stands by the wall; below it Dask's round, a corridor he walks to
and fro; two rooms with two doors each, one on the left and one on the
right, of which one is locked; and the long stairs, climbing step by step
up and to the right. The night passages, above the long stairs: Dask's
long corridor; a passage with a moving stair that swings into place and
away again; a dark room with a key and a locked door; and the night walk,
a dark corridor with a key, a locked door and another moving stair, with
Dask walking his lower round, to the way down to the dormitory. Dask is
strict, never cruel; being seen by him only means trying again.

## Each file

A JSON object with exactly these keys:

- `title`: the level's name, short.
- `goals`: a list of strings, as many as the level's goals below and in
  their order, each a short sentence. A bonus goal's sentence is plain:
  the game writes *Bonus:* before it.
- `starting_code`: the program the level starts with, one string, `\n`
  between lines and at the end. It holds exactly the code lines given
  below, in order, with their spaces; where the level allows comments,
  comment lines (`# ...`, in the child's language) may say what to do,
  never how.
- `hints`: two or three, from the gentlest to the one that nearly says it.
  Each level below gives its solution, so that the hints are true to it
  (which way, how many steps, which line is wrong); the solution is for
  you, and never appears in a text. A hint never is, quotes or spells out
  a line of the solution, not even the first or the shortest: it points
  at the idea, the direction or the method by its name alone (`wait`,
  `in_place`), and lets the child write the line.
- `intro`: what Nuri whispers before the level, one to three sentences:
  where they are and what is wanted, so that the child knows why.
- `outro`: what Nuri whispers after a win, one or two sentences that
  move the story on to what comes next.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says
  what the idea is and what the child can do with it now (as in "now you
  know what an argument is, and that the move actions have one that says
  how far"). Only where the level has it, below.
- `ways`: only where the level is played in more than one way, an object
  with one short phrase for each way's id, saying how that way is dealt
  ("Dask looks away"); the game shows it when a run of that way is played.

## What the child knows by now

The texts never explain again what a lesson has taught; they use its
words. Before every level the child knows chapters 1 and 2: programs,
objects and methods, comments, arguments, strings and `say`, `pick_up`,
spells cast with the wand (`zelim`, `fendra`), variables, attributes and
`print`, `find_nearest`, `give`, doors and keys. In chapter 3, before each
level:

- the-watchtower: also expressions, `True` and `False`, `==`, `not`,
  `dask.facing` and `dask.can_see(wizard)`.
- the-watch: also `if` and `wizard.wait()`, and levels played in ways.
- left-or-right and the-wrong-door: also `else`.
- the-long-stairs: also `for` loops.
- past-the-teacher: also `while`.
- the-moving-stairs, the-dark-room, the-night-walk: also *kirra*, *osto*
  and `stair.in_place`.

## The levels

1. `the-watchtower` — Practice 1, after *True or false*. Dask stands in
   the gallery, staring at the wall; ask which way he faces and whether he
   can see you, then walk past him along the gallery. Goals: walk along
   the gallery; do not let Dask see you; bonus: ask whether Dask can see
   you. Starting code: comments allowed. Learned: what an expression is,
   and how to ask one whose answer is `True` or `False`.
   Solution: `print(dask.facing); print(dask.can_see(wizard)); wizard.move_right(6)`.

2. `the-watch` — Practice 2, after *If*. Dask walks his round on the
   corridor below; cross it to the room beyond without being seen, waiting
   only if he looks your way. Played in two ways, `away` (Dask looks away)
   and `watching` (Dask looks this way). Goals: cross to the room below;
   do not let Dask see you. Starting code: comments allowed. Learned: what
   a condition is, and how `if` does something only when the answer is
   yes.
   Solution: `if dask.facing == "left":;     wizard.wait(); wizard.move_down(2)`.

3. `left-or-right` — Practice 3, after *Else*. A room with a door on the
   left and one on the right, one of them locked; choose the open one.
   The doors are `left_door` and `right_door`. Played in two ways,
   `left_locked` and `right_locked`. Goals: reach the way down. Starting
   code: comments allowed. Learned: how `else` chooses what to do when
   the answer is no.
   Solution: `if left_door.locked:;     wizard.move_right(2);     right_door.open();     wizard.move_down(2);     wizard.move_left(2); else:;     wizard.move_left(2);     left_door.open();     wizard.move_down(2);     wizard.move_right(2); wizard.move_down()`.

4. `the-wrong-door` — Fix 1. Nuri's program for the next room of two doors
   goes to the locked one: its `if` and `else` do each other's work.
   Played in two ways, `left_locked` and `right_locked`. Goals: reach the
   foot of the long stairs. Starting code, exactly, after a first comment
   line saying Nuri's program chooses the wrong door and asking the child
   to find and fix it:
   `if left_door.locked:`, then moved in four spaces `wizard.move_left(2)`,
   `left_door.open()`, `wizard.move_down(2)`, `wizard.move_right(6)`;
   `else:`, then moved in `wizard.move_right(2)`, `right_door.open()`,
   `wizard.move_down(2)`, `wizard.move_right(2)`. Learned: how to read an
   `if` and its `else` and find which one does what.
   Solution: `if left_door.locked:;     wizard.move_right(2);     right_door.open();     wizard.move_down(2);     wizard.move_right(2); else:;     wizard.move_left(2);     left_door.open();     wizard.move_down(2);     wizard.move_right(6)`.

5. `the-long-stairs` — Improve 1, after *Repeat*. Nuri's program climbs
   the long stairs in sixteen lines, up and right eight times; a loop
   says it in three. Goals: climb to the top; in fewer than 4 lines.
   Starting code, exactly: a comment saying the program works in sixteen
   lines and to make it shorter with a loop; then `wizard.move_up()` and
   `wizard.move_right()`, one after the other, eight times each,
   alternating. Learned: what a loop is, and how `for` repeats lines for
   you.
   Solution: `for step in range(8):;     wizard.move_up();     wizard.move_right()`.

6. `past-the-teacher` — Practice 4, after *While*. In the night passages,
   Dask stands in his long corridor looking your way; wait as long as he
   looks, then cross. Goals: cross the corridor; do not let Dask see you.
   Starting code: comments allowed. Learned: how `while` repeats as long
   as something stays true.
   Solution: `while dask.facing == "left":;     wizard.wait(); wizard.move_up(2)`.

7. `the-moving-stairs` — Practice 5, after *Light and stairs*. A gap, and
   a stair that swings into place and away; wait for it, then cross.
   Goals: cross the gap; bonus: ask the stair whether it is in place.
   Starting code: comments allowed. Learned: how to wait for a moving
   stair with `stair.in_place`, and that *osto* can hold it still.
   Solution: `wizard.move_up(2); wizard.move_right(); while not stair.in_place:;     wizard.wait(); wizard.move_right(4)`.

8. `the-dark-room` — Practice 6. A dark room: light it with *kirra*, find
   the key, and open the locked door. Goals: open the door; go through it;
   bonus: find the key with `find_nearest`. Starting code: comments
   allowed. Learned: how *kirra* lights the room you are in.
   Solution: `wizard.cast("kirra"); key = wizard.find_nearest("key"); print(key.position); wizard.move_right(4); wizard.move_down(); wizard.pick_up(); wizard.move_left(); door.open(); wizard.move_down(2)`.

9. `the-night-walk` — Practice 7, the chapter's last. Everything together
   on the way to the dormitory: a dark corridor with a key and a locked
   door, a moving stair, and Dask below. Goals: reach the way down to the
   dormitory; do not let Dask see you. Starting code: comments allowed,
   saying what waits, never how. No `learned` key: the closing story
   looks back.
   Solution: `wizard.cast("kirra"); key = wizard.find_nearest("key"); wizard.move_right(4); wizard.pick_up(); wizard.move_right(); door.open(); wizard.move_right(2); while not stair.in_place:;     wizard.wait(); wizard.move_right(3); wizard.move_down(); while dask.facing == "right":;     wizard.wait(); wizard.move_down(2)`.