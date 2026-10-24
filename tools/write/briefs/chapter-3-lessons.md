---
outputs:
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/if/en.md
  - content/lessons/if/es.md
  - content/lessons/else/en.md
  - content/lessons/else/es.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/lessons/while/en.md
  - content/lessons/while/es.md
  - content/lessons/kirra-and-osto/en.md
  - content/lessons/kirra-and-osto/es.md
context:
  - docs/dev/story.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/what-things-know/en.md
  - content/lessons/finding-things/en.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/fendra/en.md
  - content/stories/after-dark/text.en.json
---
Write the six lessons of chapter 3 of Kydux, *The passages*, in English
and Spanish. The friend teaches them at night, in the castle's passages, in a
whisper so as not to be heard, between the levels that use them; the friend
speaks to the wizard as "you", in the friend's own voice (story.md), and
is of the other gender (Nuri for a boy wizard, Teku for a girl wizard): write the friend's name as `{friend}` and the friend's own gendered words in double braces, as the rules say. The lessons of chapters 1 and 2 are given: they are
what the child has learned, and they show how a lesson is laid out. The
child reading is eight to twelve.

## How a lesson is written

Markdown, pages separated by a line with only `---`, the first page
opening with a `#` title. Three or four pages, each a short paragraph or
two of natural prose. First what the idea is and what it is for, in
words, with no code; then how it is written in the game, with an
example; and last a page that invites the child to try it and ends with
exactly one block fenced ```python try holding the code given, word for
word (in Spanish only a comment or a string inside it is translated). The
level after the lesson starts from its own program, never from this
example.

Explain each idea in general, as an idea of programming: the computer
(the game) runs the program and answers the questions, never "the
castle". Say "in this game" when you mean the game; Dask and the
passages come in where they help the child see why, not inside every
explanation.

## What the child knows by now

Chapters 1 and 2 (given): programs and instructions, objects and their
methods, comments, arguments, strings and `say`, `pick_up`, spells cast
with the wand (`zelim`, `fendra`), variables, attributes and `print`,
methods that give something back (`find_nearest`), `give`, doors and
keys. Use these words without explaining them again: a variable is a
variable, an attribute an attribute. Each lesson below says what is new;
what an earlier lesson of this chapter taught is known from then on.

## The lessons

1. `true-or-false` — *True or false* / *Verdadero o falso*. Some
   questions have only two answers, yes or no: is the door locked? is
   Dask looking this way? In a program such a question is an expression,
   and the computer answers it with `True` or `False`. An attribute can be
   one (`door.locked`); two values can be compared, `==` asking whether
   they are the same (one `=` names a value, two ask a question), as in
   `dask.facing == "left"`; `not` turns an answer round; and a method can
   answer too: `dask.can_see(wizard)`. Dask is an object, the one the
   code calls `dask`, and `dask.facing` is the way he looks.
   Try code: `print(dask.facing)` then `print(dask.can_see(wizard))` on
   two lines.

2. `if` — *If* / *Si*. Knowing the answer is not enough: you want to do
   something only when it is yes. That is a condition, written with `if`:
   the expression, a colon, and under it the lines that belong to it,
   moved in by four spaces, which run only when the answer is `True`.
   `wizard.wait()` makes your wizard stand still for a moment while
   everything else moves on. In this game a level can be played in more
   than one way, and the same program must win them all: here, Dask
   may or may not be looking.
   Try code: `if dask.facing == "left":` then, moved in,
   `wizard.wait()`.

3. `else` — *Else* / *Si no*. When the answer is no, you may want to do
   something else instead: `else`, with its own colon, at the same place
   as its `if`, and its own lines moved in under it, which run only when
   the condition is `False`. One of the two always runs.
   Try code: `if left_door.locked:`, moved in `print("left is locked")`,
   `else:`, moved in `print("left is open")` (Spanish strings:
   `"la izquierda está cerrada"`, `"la izquierda está abierta"`).

4. `repeat` — *Repeat* / *Repetir*. Doing the same instructions many
   times means writing them many times; a loop, written with `for`, does
   them again and again for you: `for step in range(8):` and, moved in
   under it, the lines to repeat, eight times. `step` is a variable the
   loop counts with.
   Try code: `for step in range(3):` then, moved in,
   `wizard.move_up()` and `wizard.move_right()`.

5. `while` — *While* / *Mientras*. A `for` loop knows how many times; but
   you cannot know how long Dask will look your way. `while` repeats its
   lines as long as its expression is `True`, asking again each time, and
   stops when it is `False`. If the answer never changes, the loop never
   ends; the game stops a run that goes on too long, so make sure the
   answer can change.
   Try code: `while dask.facing == "left":` then, moved in,
   `wizard.wait()`.

6. `kirra-and-osto` — *Light and stairs* / *Luz y escaleras*. Two new
   spells, cast with the wand. *kirra* lights the room you are in, so that
   what is in the dark shows. Some stairs move: they swing into place for
   a moment and away again; a stair knows whether it is in place, the
   attribute `stair.in_place`, which says whether a step onto it now
   would land; and *osto*, cast beside a moving stair, holds it still for
   a while. Spells to type are in italics in the prose.
   Try code: `wizard.move_up(2)` then `print(stair.in_place)` on two
   lines.
