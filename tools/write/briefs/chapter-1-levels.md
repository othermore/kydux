---
outputs:
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
  - content/levels/the-pedestal/text.en.json
  - content/levels/the-pedestal/text.es.json
  - content/levels/the-sealed-door/text.en.json
  - content/levels/the-sealed-door/text.es.json
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
context:
  - docs/dev/story.md
  - content/stories/the-letter/en.md
  - content/stories/at-the-gate/en.md
  - content/stories/at-the-gate/es.md
  - content/lessons/what-a-program-is/en.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/notes/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
  - content/stories/up-to-the-castle/en.md
---
Write the texts of chapter 1's eight levels, in English and Spanish. The
story pages and lessons of the chapter are given: the levels come between
them, in this order, each just after the lesson it practises. Nuri speaks
in every level, in the same voice as the lessons, and is of the wizard's
gender (Spanish choices for Nuri's gendered words too).

Each file is a JSON object with exactly these keys:

- `title`: the level's name, short.
- `goals`: a list of strings, exactly as many as the level's goals below,
  in the same order, each one short sentence. A bonus goal's sentence is
  plain (the game writes *Bonus:* before it).
- `starting_code`: the program the level starts with, as one string with
  `\n` between lines and a `\n` at the end. It holds exactly the code lines
  given below, in that order, and, only where this brief allows it, comment
  lines (`# ...`, in the child's language) before or between them. Where it
  says *no comments*, write only the code lines given, or an empty string
  when none are given.
- `hints`: two or three, from the gentlest to the one that nearly says it.
  A hint never is, nor quotes, a whole line of the solution; it may name an
  action in backticks (`move_down`).
- `intro`: one to three short sentences Nuri says before the level.
- `outro`: one or two short sentences Nuri says after a win: a word of the
  story, what happens next.
- `learned`: one sentence that starts "Now you know" / "Ahora sabes", with
  the idea the level practised, using the easy word and the programmer's
  word together. The last level, `the-way-in`, has no `learned` key at all.

The levels, with what the scene shows, the goals, the code, and the
solution (which the hints must not give away):

1. `the-gate` (Practice 1, after *what a program is*). The wizard stands one
   tile left of the great gate (a glowing circle on the ground in front of
   it); walking to it does not open it, it only reaches it. Goals: walk to
   the gate. Code: none, no comments (an empty starting code). Solution:
   `wizard.move_right()`. The outro: the gate is still shut, but now you can
   move; Nuri has more to show.

2. `the-corridor` (Practice 2, after *objects and actions*). A path round
   the corner of the gatehouse wall: two tiles right, then two down, to its
   end. Goals: reach the end of the path. Code: `wizard.move_right()`. No
   comments. Solution: two `move_right()` and two `move_down()`, one per
   line.

3. `the-dark-note` (Fix 1, after *notes*). A path two tiles left, then two
   down. The program given has one wrong move: the child finds and fixes
   it. Goals: reach the end of the path. Code, in this order:
   `wizard.move_left()`, `wizard.move_left()`, `wizard.move_down()`,
   `wizard.move_right()`. Comments allowed: one line at the top saying one
   move is wrong and to fix it, without saying which. Solution: the last
   move made `move_down()`.

4. `the-long-corridor` (Practice 3, after *how much*). A long straight path,
   six tiles to the right, to a door. Goals: reach the door at the end; bonus:
   do it in fewer than 2 lines. Code: `wizard.move_right()`. Comments
   allowed. Solution: `wizard.move_right(6)`.

5. `the-stairs` (Improve 1, after *how much*). Stairs going up two, right
   three, up two, right two to the top. The program given reaches the top
   but bumps into the wall twice, because two of its numbers are too big;
   the child makes it better: no bumps. Goals: climb to the top; do not bump
   into anything; bonus: do it in fewer than 5 lines. Code, in this order:
   `wizard.move_up(3)`, `wizard.move_right(3)`, `wizard.move_up(3)`,
   `wizard.move_right(2)`. Comments allowed: say it reaches the top but
   bumps twice, and to make it better. Solution: the two `move_up` with 2.

6. `the-password` (Practice 4, after *words*). The gate itself, two tiles to
   the right: it opens to the word **ambrel**, said beside it, exactly, in
   small letters; then two more steps through it. Goals: open the gate; walk
   through it. Code: none. Comments allowed: one comment line that gives the
   word, so the child need not remember the intro, and one that says to
   stand beside the gate and say it. Nuri tells the word in the intro too
   (Nuri learned it from an older pupil). Solution: move two to the right,
   `wizard.say("ambrel")`, move two to the right.

7. `the-pedestal` (Practice 5, after *things to carry*). Nuri's spare wand
   lies on a flat stone three tiles to the right; Nuri lends it, to be given
   back one day. Goals: pick up the wand; walk on to the end. Code: none.
   Comments allowed. Solution: three steps right, `wizard.pick_up()`, three
   steps right.

8. `the-sealed-door` (Practice 6, after *your first spell*). The wand lies
   on the ground one tile to the right: Nuri set it down to show how a spell
   needs it; a sealed door with a glowing rune is three tiles further on.
   Goals: break the door's seal; walk through the door. Code: none.
   Comments allowed. Solution: one step right, `wizard.pick_up()`, two steps
   right, `wizard.cast("zelim")`, three steps right.

9. `the-way-in` (Practice 7, the chapter's last). The wizard holds the lent
   wand from the start. The gate that listens, one tile right; beyond it,
   the path goes right, then down through a sealed door, then left through
   another sealed door, to the road up to the castle. Everything of the
   chapter together. Goals: reach the castle road; bonus: do it in fewer
   than 9 lines. Code: none. Comments allowed: say what waits (a gate that
   listens, two seals), not how. Solution: one step right, `say` the word,
   six right, `cast` zelim, two down, four left, `cast` zelim, three left.
   No `learned` key: the chapter's closing story page recaps.

Keep every text short and warm, for a child of eight. The goals say what
to reach, not how.
