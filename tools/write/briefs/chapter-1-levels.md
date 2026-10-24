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
## What the child already knows

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

## What to write

The texts of chapter 1's nine levels, in English and Spanish. The
chapter's stories and lessons are given: each level comes right after the
lesson it practises, in the order below, and the levels are where the
story moves on between the lessons. The friend speaks in every level, in
the voice of the lessons. The friend is of the other gender: a girl,
Nuri, for a boy wizard, and a boy, Teku, for a girl wizard. Write the
friend's name as `{friend}`, and the friend's own gendered words in
double braces, the boy's form first, as the rules say.

The project's owner wrote some of these words. Where a level gives a
sentence or a title in quotation marks, write it exactly as given, in its
language, where the level says.

The place the wizard must get to is shown on the ground by a round mark
that beats softly; the first lesson has named it, and the texts call it
*the mark* (*la marca*).

## Where it happens

One scene for the whole chapter, at dusk. The open countryside before the
school: a meadow of grass with trees, rocks, flowers, a little pen of low
wooden fences, and a grassy rise with stone steps up it; a dirt path comes
up from the road at the bottom to the school's great iron gate, set in the
middle of a high stone wall. Past the gate a path climbs between trees and
rocks; a little to its right, the wand lies on a flat stone, which cannot be
stood on: the wand is picked up from beside it; further up,
a low wall with an arched gate sealed by a glowing rune; and at the top
the whole castle, whose great door is sealed too and also listens for a
word. The scene has no wall round it: its edge is simply where one cannot
go, and trees, rocks, fences and the rise's bank cannot be walked on.

## Each file

A JSON object with exactly these keys:

- `title`: the level's name, short.
- `goals`: a list of strings, as many as the level's goals below and in
  their order, each a short sentence. A bonus goal's sentence is plain,
  with no *Bonus* in it: the game writes *Bonus:* before it.
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
  `move_left`), and lets the child write the line. So no hint gives a
  number of steps the solution has, lists its moves in order, or pairs a
  method with its argument: "Count the steps up the path" is a hint;
  "move up three steps" is the line.
- `intro`: what the friend says before the level, one to three sentences: where
  they are and what they want to do, so that the child knows why. In a fix
  or an improve, the intro says that something is wrong or could be
  better, never what: finding it is the level. The facts each level gives
  below about its program are for you, so that the hints are true.
- `outro`: what the friend says after a win, one or two sentences that move the
  story on to what comes next (as the owner put it for the first one:
  "Great! You've learned to move your wizard. Now let's see how we get
  through this gate.").
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says
  what the idea is and what the child can do with it now (the owner's
  examples: "now you know what a program and an instruction are, and the
  instruction that moves your wizard"; "now you know what an argument
  is, and that the move actions have one that says how far"). Only where
  the level has it, below.

In Spanish, the course's words are *instrucción*, *programa*, *objeto*,
*método*, *comentario*, *argumento*, *cadena* (never *string*), and the
Spanish is Spain's (*ponte*, not *párate*).

## The levels

The places are given as the grid's cells, x across from the left and y
down from the top, for you to follow the walks; the texts never give
numbers of cells, only directions and what is there.

1. `the-gate` — Practice 1, after *What a program is*. The wizard stands
   one step to the left of the spot right in front of the great gate,
   and the friend stands just below that spot. One instruction takes them there; the gate
   stays shut, which the friend knew: first the basics. Goals: walk to the
   gate. Starting code: empty, no comments. Learned: what a program and
   an instruction are, and the instruction that moves your wizard.
   Solution: `wizard.move_right()`.

2. `the-corridor` — Practice 2, after *Objects and actions*. The gate
   will not open yet; the friend wants to look round the meadow: down
   the path, three steps, then two to the left onto the grass. Goals:
   reach the mark. Starting code: empty, no comments (comments are taught
   in the next lesson). Learned: what objects and methods are, and the
   four moves.
   Solution: `wizard.move_down(); wizard.move_down(); wizard.move_down(); wizard.move_left(); wizard.move_left()`.

3. `the-dark-note` — Fix 1, after *Notes*. Title "Fixing the program" /
   "Arreglando el programa". The friend's intro opens with "I wrote a
   program to reach that mark" / "Escribí un programa para llegar a esa
   marca" and goes on to say that one of its moves is wrong. The mark is
   on the grass below and to the left. The wrong move is the first: it
   goes up, and walks the wizard into the grassy bank behind them. Goals:
   reach the mark. Starting code, exactly: a first comment line saying
   that one move in this program is wrong and asking the child to find
   it and fix it, then `wizard.move_up()`, `wizard.move_left()`,
   `wizard.move_down()`, `wizard.move_down()`. Learned: what a comment
   is, and that a note in a program can tell you what to do.
   Solution: `wizard.move_left(); wizard.move_left(); wizard.move_down(); wizard.move_down()`.

4. `the-long-corridor` — Practice 3, after *How far we move*. Across the
   meadow to the right, eight steps over the grass and the path, to the
   little fence pen, in one instruction. Goals: reach the mark; bonus: in
   fewer than 2 lines. Starting code: comments allowed, saying where to
   go in one instruction. Learned: what an argument is, and that the
   move actions have one that says how many steps to take.
   Solution: `wizard.move_right(8)`.

5. `the-stairs` — Improve 1. The friend's program walks back to the
   gate: four steps left to the path, then up the path to the spot before
   the gate. It gets there, but bumps into the shut gate: its second
   number is one too big. Goals: reach the spot before the gate; never
   bump into anything; bonus: in fewer than 3 lines. Starting code,
   exactly: a comment saying the program gets there but bumps, and to
   make it better; then `wizard.move_left(4)`, `wizard.move_up(6)`.
   Learned: that a program that works can still be made better, here by
   giving each move the argument it needs.
   Solution: `wizard.move_left(4); wizard.move_up(5)`.

6. `the-password` — Practice 4, after *Words*. At the gate: an older
   pupil told the friend the gate's password, *ambrel*, in small letters.
   Say it, and walk through, six steps up the path beyond. In the intro
   the word is in italics (*ambrel*) with its sentence punctuated. Goals:
   open the gate; walk through it. Starting code: a comment that gives
   the password, *ambrel*, and says to say it and walk through (the
   owner's wish: a child who forgets it finds it there). Learned: what a
   string is, and how to make your wizard say things.
   Solution: `wizard.say("ambrel"); wizard.move_up(6)`.

7. `the-wand` — Practice 5, after *Things to carry*. Past the gate, the
   friend's spare wand lies on a flat stone three steps to the right of
   the path, and the stone cannot be stood on: the wand is picked up from
   beside it. The intro opens with "I have a spare wand I can lend you,
   but so that you practise a little, I left it on that stone." /
   "Tengo una varita de repuesto que te puedo prestar, pero para que
   practiques un poco, la he dejado en esa piedra." Then: walk over,
   pick it up, and come back to the mark by the path, one step left and
   one down. Goals: pick up the wand; reach the mark. Starting code:
   comments allowed. Learned: that things are objects too, and how to
   pick them up.
   Solution: `wizard.move_right(3); wizard.pick_up(); wizard.move_left(); wizard.move_down()`.

8. `the-sealed-door` — Practice 6, after *Your first spell*. Up the
   path, the low wall's arched gate is sealed by a glowing rune; the
   wizard has a wand now. Two steps left to the path, three up to stand
   before the arch, cast *zelim*, and walk through to the mark beyond.
   Goals: open the sealed gate; walk through it. Starting code: comments
   allowed. Learned: how to cast a spell with your wand, and that
   *zelim* breaks a seal.
   Solution: `wizard.move_left(2); wizard.move_up(3); wizard.cast("zelim"); wizard.move_up(3)`.

9. `the-way-in` — Practice 7, the chapter's last. Up the steps to the
   castle's great door, which is sealed by a rune and also listens for
   the school's word: everything together. Two steps up to stand before
   it, say *ambrel*, cast *zelim*, and the door opens onto the dark of
   the hall; walk in. Goals: open the castle's door; walk in; bonus: in
   fewer than 5 lines. Starting code: comments allowed, saying what the
   door wants, never how. No `learned` key: the closing story looks back.
   Solution: `wizard.move_up(2); wizard.say("ambrel"); wizard.cast("zelim"); wizard.move_up()`.
