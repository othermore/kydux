---
outputs:
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/keys-and-doors/es.md
  - content/lessons/the-distance/en.md
  - content/lessons/the-distance/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/what-a-program-is/en.md
  - content/lessons/how-much/en.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
---
Write the six lessons of chapter 2 of Kydux, *The library*, in English
and Spanish. Chapter 1's lessons are given: they are what the child has
learned, and they show how a lesson is laid out. The child reading is
eight to twelve. The course (course.md) says, in *How a level earns its
idea*, why each idea comes where it does: the level after each lesson
cannot be solved without it, and the lesson says why it is needed there.

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
this game" when you mean the game; the place comes in where it helps the
child see why, not inside every explanation. Name a new idea by the
child's word beside the proper one for its first uses (*a thing it
knows, an attribute*; *a name for a value, a variable*), then the proper
one.

## Who teaches

The first lesson is taught by the dormitory mate, in the dormitory, at
night: write the mate's name `{mate}`, and the mate's Spanish words in the
wizard's single braces (they share the wizard's gender). The other five
are taught by Wenna, the librarian, in the library: precise and quiet,
fond of order and of a good question, kind. Each speaks to the wizard as
"you".

## What the child knows by now

Everything chapter 1's lessons teach (given): programs and instructions;
objects, `wizard` among them, and their methods; comments; arguments;
strings and `say`; things as objects and `pick_up`; spells cast with the
wand, *zelim*. Use these words without explaining them again. Each lesson
below says what is new; what an earlier lesson of this chapter taught is
known from then on.

## The lessons

1. `the-right-place` — *The right place* / *Cada cosa en su sitio*.
   Taught by {mate}, in the dormitory, the first night: the wizard is
   tired and must go to bed. Some actions can only be done in the right
   place: `wizard.sleep()` lies the wizard down in a free bed, but only
   when one is right beside them; anywhere else the wizard thinks why not,
   and nothing happens. So a program first walks to the right place, then
   does the action. Their own dormitory is through the arch on the right;
   the arch on the left is the other dormitory, which is not theirs.
   Try code: `wizard.sleep()` (tried in the common room, where there is
   no bed beside: the child sees the wizard refuse, and why).

2. `what-things-know` — *What things know* / *Lo que saben las cosas*.
   An object does actions, its methods; it also knows things about
   itself, which programmers call attributes: a door knows whether it is
   locked, your wizard knows where it stands and what it carries. An
   attribute is asked for with a dot and no brackets, since nothing is
   done: `door.locked`. To see the answer, `print`, Python's own way to
   show a value, shows it under the editor. Also `wizard.position` and
   `wizard.items`. Wenna's door, which she opened for them, is the door
   to ask.
   Try code: `print(door.locked)`

3. `finding-things` — *Finding things* / *Encontrar cosas*. Some methods
   do something in the world; others give something back, an answer.
   `wizard.find_nearest("book")` gives the nearest book, the thing
   itself, even one far away. To keep an answer, give it a name:
   `book = wizard.find_nearest("book")`. A name for a value is what
   programmers call a variable; the `=` puts the value under the name, it
   does not ask whether they are equal. With nothing of that kind there,
   the answer is `None`, Python's word for nothing. A thing kept under a
   name can be asked what it knows, `book.position`, and handed to
   whoever stands right beside the wizard, `wizard.give(book)`. In the
   library, Eldra has lost a book somewhere across the hall.
   Try code: `book = wizard.find_nearest("book")` then
   `print(book.position)`, on two lines.

4. `keys-and-doors` — *Keys and doors* / *Llaves y puertas*. A door is an
   object with a method of its own: `door.open()`. It opens only for a
   wizard standing right beside it, and a locked one only when its key is
   carried. A thing you cannot see is there all the same for the program:
   `find_nearest` finds it wherever it lies, and `key.reveal()` shows its
   outline through whatever hides it, so that you know where to go. In
   the library, the key of the door ahead fell long ago behind something,
   and no one has seen it since.
   Try code: `key = wizard.find_nearest("key")` then `key.reveal()`, on
   two lines.

5. `the-distance` — *How far* / *A qué distancia*. Sometimes a program
   needs a number it cannot know when it is written: a key that is never
   twice in the same place is a different number of steps away every
   time. A thing can say how many steps lie between it and the wizard,
   along the rows and the columns: `key.distance_to(wizard)`. Kept under a
   name, `steps = key.distance_to(wizard)`, that number can be used as a
   move's argument, `wizard.move_left(steps)`, and used again to walk
   back the same way. This is what a variable is for: a value you do not
   know when you write the program, or that you use more than once. In
   this game a level can be played in several ways, one after the other,
   with the key in a different place in each: one program must win them
   all.
   Try code: `key = wizard.find_nearest("key")`, then
   `steps = key.distance_to(wizard)`, then `print(steps)`, on three lines.

6. `fendra` — *A spell that reaches* / *Un hechizo que alcanza*. A spell
   can reach across empty space: *fendra*, cast with the wand and told
   which thing to bring, by its name in the program, as its second
   argument, `wizard.cast("fendra", book)`, draws that thing to the
   wizard's own cell, when it lies up to three cells away in a straight
   line, in any of the four ways. It flies over shelves and bookcases,
   but not through walls or closed doors; with the thing out of its
   reach, nothing comes, and the wizard says so. A spell moves things and
   hands carry them: pick the thing up once it has come. In the library,
   a rare book lies among many on a high bookcase, out of reach.
   Try code: `book = wizard.find_nearest("book")`, `wizard.move_right(5)`,
   `wizard.cast("fendra", book)`, then `wizard.pick_up()`, on four lines.
