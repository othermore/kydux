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
  - content/levels/the-wand/text.en.json
  - content/levels/the-wand/text.es.json
  - content/levels/the-sealed-door/text.en.json
  - content/levels/the-sealed-door/text.es.json
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/up-to-the-castle/text.en.json
  - content/lessons/what-a-program-is/en.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/notes/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/your-first-spell/en.md
---
Write the texts of chapter 1's nine levels, in English and Spanish. The
chapter's stories and lessons are given: each level comes right after the
lesson it practises, in the order below, and the levels are where the
story moves on between the lessons. Nuri speaks in every level, in the
voice of the lessons, and is of the wizard's gender (Spanish choices for
Nuri's own gendered words too).

## Where it happens

One scene for the whole chapter, at dusk. The open countryside before the
school: a meadow of grass with trees, rocks, flowers, a little pen of low
wooden fences, and a grassy rise with stone steps up it; a dirt path comes
up from the road at the bottom to the school's great iron gate, set in the
middle of a high stone wall. Past the gate a path climbs between trees and
rocks; beside it, in a corner, the wand lies on a flat stone; further up,
a low wall with an arched gate sealed by a glowing rune; and at the top
the whole castle, whose great door is sealed too and also listens for a
word. The scene has no wall round it: its edge is simply where one cannot
go, and trees, rocks, fences and the rise's bank cannot be walked on.

## Each file

A JSON object with exactly these keys:

- `title`: the level's name, short.
- `goals`: a list of strings, as many as the level's goals below and in
  their order, each a short sentence. A bonus goal's sentence is plain:
  the game writes *Bonus:* before it.
- `starting_code`: the program the level starts with, one string, `\n`
  between lines and at the end. It holds exactly the code lines given
  below, in order; where the level allows comments, comment lines
  (`# ...`, in the child's language) may say what to do, never how. Where
  no code is given and no comments are allowed, an empty string.
- `hints`: two or three, from the gentlest to the one that nearly says it.
  Each level below gives its solution, so that the hints are true to it
  (which way, how many steps, which line is wrong); the solution is for
  you, and never appears in a text. A hint never is, quotes or spells out
  a line of the solution, not even the first or the shortest: it points
  at the idea, the direction or the method by its name alone (`say`,
  `move_left`), and lets the child write the line.
- `intro`: what Nuri says before the level, one to three sentences: where
  they are and what they want to do, so that the child knows why.
- `outro`: what Nuri says after a win, one or two sentences that move the
  story on to what comes next (as the owner put it for the first one:
  "Great! You've learned to move your wizard. Now let's see how we get
  through this gate.").
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says
  what the idea is and what the child can do with it now (the owner's
  examples: "now you know what a program and an instruction are, and the
  instruction that moves your wizard"; "now you know what an argument
  is, and that the move actions have one that says how far"). Only where
  the level has it, below.

## What the child knows by now

The texts never explain again what a lesson has taught. Before each
level the child knows what the lessons before it say (given), and
nothing more:

- the-gate: what a computer does with a program, what an instruction and
  a program are, and `move_right`.
- the-corridor: also objects and methods, `wizard` as an object, the four
  moves, the notebook.
- the-dark-note: also comments. Do not say "which programmers call a
  comment" again: the child has just read the lesson.
- the-long-corridor and the-stairs: also arguments, a move told how far.
- the-password: also strings and `say`.
- the-wand: also things as objects and `pick_up`.
- the-sealed-door and the-way-in: also spells, the wand, `cast` and
  `zelim`.

## The levels

1. `the-gate` — Practice 1, after *What a program is*. The wizard stands
   one step from the spot right in front of the great gate; Nuri beside.
   One instruction takes them there; the gate stays shut, which Nuri
   knew: first the basics. Goals: walk to the gate. Starting code: empty,
   no comments. Learned: what a program and an instruction are, and the
   instruction that moves your wizard.
   Solution: `wizard.move_right()`.

2. `the-corridor` — Practice 2, after *Objects and actions*. The gate
   will not open yet; Nuri wants to look round the meadow: down the path
   a little, then round to the right into the grass. Goals: reach the
   spot. Starting code: empty, no comments (comments are taught in the
   next lesson). Learned: what objects and methods are, and the four
   moves.
   Solution: `wizard.move_down(); wizard.move_down(); wizard.move_right(); wizard.move_right()`.

3. `the-dark-note` — Fix 1, after *Notes*. Nuri wrote a program on a
   note to walk to a spot by the little fence pen, and one of its moves
   is wrong: the first one, which goes right and walks the wizard into
   the fence. Goals: reach the spot. Starting code, exactly: a first
   comment line saying that one move in this program is wrong and asking
   the child to find it and fix it, then `wizard.move_right()`,
   `wizard.move_down()`, `wizard.move_down()`. Learned: what a comment
   is, and that a note in a program can tell you what to do.
   Solution: `wizard.move_left(); wizard.move_down(); wizard.move_down()`.

4. `the-long-corridor` — Practice 3, after *How much*. The path along
   the foot of the grassy rise, six steps to the left, in one
   instruction. Goals: reach the foot of the rise's steps; bonus: in
   fewer than 2 lines. Starting code: comments allowed, saying where to
   go in one instruction. Learned: what an argument is, and that the
   move actions have one that says how far.
   Solution: `wizard.move_left(6)`.

5. `the-stairs` — Improve 1. Nuri's program walks back to the gate, but
   bumps twice, into a tree and into the wall: its two numbers are too
   big. Goals: reach the spot before the gate; never bump into anything;
   bonus: in fewer than 3 lines. Starting code, exactly: a comment saying
   the program gets there but bumps, and to make it better; then
   `wizard.move_right(7)`, `wizard.move_up(5)`. Learned: that a program
   that works can still be made better, here by giving each move the
   argument it needs.
   Solution: `wizard.move_right(5); wizard.move_up(4)`.

6. `the-password` — Practice 4, after *Words*. At the gate: an older
   pupil told Nuri the gate's password, *ambrel*, in small letters. Say
   it, and walk through, up the path beyond as far as the wand's corner.
   In the intro the word is in italics (*ambrel*) with its sentence
   punctuated. Goals: open the gate; walk through it. Starting code:
   comments allowed, saying the password and what to do. Learned: what a
   string is, and how to make your wizard say things.
   Solution: `wizard.say("ambrel"); wizard.move_up(6)`.

7. `the-wand` — Practice 5, after *Things to carry*. Past the gate, Nuri
   has set the spare wand on a flat stone in a corner beside the path:
   lent, to be given back one day. Walk over, pick it up, and come back
   to the path by Nuri. Goals: pick up the wand; reach the spot. Starting
   code: comments allowed. Learned: that things are objects too, and how
   to pick them up.
   Solution: `wizard.move_right(3); wizard.pick_up(); wizard.move_left(); wizard.move_down()`.

8. `the-sealed-door` — Practice 6, after *Your first spell*. Up the
   path, the low wall's arched gate is sealed by a glowing rune; the
   wizard has a wand now. Stand beside it, cast *zelim*, and walk
   through. Goals: open the sealed gate; walk through it. Starting code:
   comments allowed. Learned: how to cast a spell with your wand, and
   that *zelim* breaks a seal.
   Solution: `wizard.move_left(2); wizard.move_up(3); wizard.cast("zelim"); wizard.move_up(2)`.

9. `the-way-in` — Practice 7, the chapter's last. Up the steps to the
   castle's great door, which is sealed by a rune and also listens for
   the school's word: everything together. Say *ambrel*, cast *zelim*,
   and the door opens onto the dark of the hall; walk in. Goals: open
   the castle's door; walk in; bonus: in fewer than 5 lines. Starting
   code: comments allowed, saying what the door wants, never how. No
   `learned` key: the closing story looks back.
   Solution: `wizard.move_up(3); wizard.say("ambrel"); wizard.cast("zelim"); wizard.move_up()`.
