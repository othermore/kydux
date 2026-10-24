---
outputs:
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/a-name-for-a-value/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
context:
  - docs/dev/story.md
  - content/lessons/what-a-program-is/en.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/notes/en.md
  - content/lessons/how-much/en.md
  - content/lessons/words/en.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/your-first-spell/en.md
  - content/stories/in-the-castle/text.en.json
---
Write the five lessons of chapter 2 of Kydux, *The library*, in English
and Spanish. Wenna, the librarian, teaches them in the library, between
the levels that use them. She speaks to the wizard as "you", in her own
voice (story.md): precise and quiet, fond of order and of a good
question, kind. Chapter 1's lessons are given: they are what the child
has learned, and they show how a lesson is laid out. The child reading
is eight to twelve.

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

Explain each idea in general, as an idea of programming, and say "in
this game" when you mean the game; the library comes in where it helps
the child see why, not inside every explanation.

## What the child knows by now

Everything chapter 1's lessons teach (given): programs and instructions;
objects, `wizard` among them, and their methods; comments; arguments;
strings and `say`; things as objects and `pick_up`; spells cast with the
wand, `zelim`. Use these words without explaining them again. Each lesson
below says what is new; what an earlier lesson of this chapter taught is
known from then on.

## The lessons

1. `a-name-for-a-value` — *A name for a value* / *Un nombre para un
   valor*. When a program uses the same value in several places, writing
   it again each time is easy to get wrong and hard to change: you can
   give the value a name once and use the name after. A name for a value
   is what programmers call a variable. `steps = 3`: the `=` puts the
   value under the name; it does not ask whether they are equal. Then
   `steps` can be used wherever the value would go, as a move's argument.
   Try code: `steps = 3` then `wizard.move_right(steps)` on two lines.

2. `what-things-know` — *What things know* / *Lo que saben las cosas*. An
   object does actions, its methods; it also knows things about itself,
   which programmers call attributes: a door knows whether it is locked,
   your wizard knows where it stands and what it carries. An attribute is
   asked for with a dot and no brackets, since nothing is done:
   `door.locked`. To see the answer, `print`, Python's own way to show a
   value, shows it under the editor: `print(door.locked)`. Also
   `wizard.position` and `wizard.items`.
   Try code: `print(door.locked)`

3. `finding-things` — *Finding things* / *Encontrar cosas*. Some methods
   do something in the world; others give something back, an answer, and
   the answer is kept under a variable to use after.
   `wizard.find_nearest("book")` gives back the nearest book, the thing
   itself, so that `book = wizard.find_nearest("book")` keeps it and
   `book.position` asks where it is; if there is none, it gives back
   `None`, Python's word for nothing. `wizard.give(book)` hands a thing to
   someone right beside you.
   Try code: `book = wizard.find_nearest("book")` then
   `print(book.position)` on two lines.

4. `keys-and-doors` — *Keys and doors* / *Llaves y puertas*. A door is an
   object with a method of its own: `door.open()`, said standing right
   beside it. A locked door opens only for a wizard who carries its key,
   so the key is picked up first: the order of the instructions matters.
   Try code: `wizard.move_up(2)` then `wizard.pick_up()` on two lines.

5. `fendra` — *A spell that reaches* / *Un hechizo que alcanza*. Some
   things are out of reach, on a high shelf or across a gap. *fendra*,
   cast with the wand, draws to your tile the nearest thing up to three
   tiles away in a straight line, in any of the four ways, over shelves,
   but not through walls or closed doors; then the wizard picks it up,
   since a spell moves things and hands carry them. If nothing is near
   enough, nothing comes, and your wizard says so. *fendra* is a word to
   type: in italics in the prose.
   Try code: `wizard.move_left(5)`, `wizard.cast("fendra")`,
   `wizard.pick_up()` on three lines.
