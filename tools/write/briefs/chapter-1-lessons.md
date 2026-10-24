---
outputs:
  - content/lessons/what-a-program-is/en.md
  - content/lessons/what-a-program-is/es.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/objects-and-actions/es.md
  - content/lessons/notes/en.md
  - content/lessons/notes/es.md
  - content/lessons/how-much/en.md
  - content/lessons/how-much/es.md
  - content/lessons/words/en.md
  - content/lessons/words/es.md
  - content/lessons/things-to-carry/en.md
  - content/lessons/things-to-carry/es.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
---
Write the seven lessons of chapter 1 of Kydux, *Arrival*, in English and
Spanish. They are the game's tutorial, taught by Nuri at the castle's gate
and on the path beyond it, between the levels that use them. Nuri speaks every
lesson to the wizard as "you", in Nuri's own voice (story.md): a friend
who knows a bit more, explaining it the way they wish someone had
explained it to them. The child reading is eight to twelve and has never
programmed.

## How a lesson is written

Markdown, pages separated by a line with only `---`, the first page
opening with a `#` title. Three or four pages, each a short paragraph or
two of natural prose. First what the idea is and what it is for, in
words, with no code; then how it is written in the game, with an
example; and last, unless the lesson says otherwise, a page that invites
the child to try it and ends with exactly one block fenced ```python try
holding the code given, word for word (in Spanish only a comment or a
string inside it is translated). The level after the lesson starts from
its own program, never from this example.

Explain each idea in general, as an idea of programming, and say "in
this game" when you mean the game; keep the gate and the castle out of an
explanation where they are not needed (the owner asked that
`move_right` be explained without the gate beside it). The story comes
back at the end of a lesson, if at all, in a sentence.

## What the child knows by now

Before the first lesson the child has read the opening and *At the gate*
(given): they made their wizard, met Nuri at the shut gate, and Nuri
promised to show them how to give the gate instructions. They know
nothing of programming. Each lesson below says what is new in it; what
an earlier lesson taught is known, and is used, never explained again.

## The lessons

1. `what-a-program-is` — *What a program is* / *Qué es un programa*. A
   computer does exactly what it is told, one step at a time; each step
   is an instruction, and a list of instructions is a program, which runs
   from the top down. In this game the computer does everything for you:
   you give it the instructions, and it makes your wizard do exactly what
   they say, no more and no less. Your wizard is you. The first
   instruction, `wizard.move_right()`, makes your wizard take one step to
   the right; what each part of it means comes in the next lesson.
   Try code: `wizard.move_right()`

2. `objects-and-actions` — *Objects and actions* / *Objetos y acciones*.
   The child knows what a program and an instruction are: do not say it
   again. New: everything in a program is an object, the characters and
   the things, a door, a book; your wizard is an object too, the one we
   call `wizard`. An object can do actions, which programmers call
   methods, and each object has its own: `move_right` is a method of
   `wizard`. How an instruction is written: the object, a dot (the action
   belongs to it), the method, and brackets (do it now). The four moves,
   one step each, one instruction a line. The notebook, a button on the
   screen, lists every method your wizard knows: open it whenever you
   wonder what your wizard can do.
   Try code: `wizard.move_down()` then `wizard.move_down()` on two lines.

3. `notes` — *Notes* / *Notas*. A comment is something you write in your
   program to remember it later or to explain what it does, for a person,
   not for the computer: a line that starts with `#`, which the computer
   skips. In this game, comments in a level's program tell you what to do
   or help you. This lesson has **no Try it page and no `python try`
   block**: the next level shows a comment anyway. Two or three pages.

4. `how-much` — *How much* / *Cuánto*. Walking far with one step a line
   means writing the same line six times: it is slow, and you may write
   it five or seven times, or one of them wrong. Programmers are lazy, in
   a good way: they like to do things with the fewest instructions. A
   move can be told how far: a number in its brackets, which programmers
   call an argument. With no number, one step. Every method has its own
   arguments, which mean their own things, or none at all: the move's
   argument says how far.
   Try code: `wizard.move_left(3)`

5. `words` — *Words* / *Palabras*. Your wizard can say things, with the
   `say` method, whose argument is what to say. Words in a program go
   between quotes, and words in quotes are called a string: the computer
   keeps a string exactly as it is written, every character of it,
   capitals and small letters, digits and signs. Without quotes it would
   read a word as a name in the program. In Arvelia, what you say can be
   heard, and sometimes that does something special, like opening a door
   that knows its password.
   Try code: `wizard.say("Hello!")` (Spanish: `wizard.say("¡Hola!")`)

6. `things-to-carry` — *Things to carry* / *Cosas que llevar*. Things are
   objects, just as the characters are, your wizard among them, and each
   has the name the code knows it by. `wizard.pick_up()` picks up a thing;
   the thing must be on your tile or right beside you. When several are
   near, you must say exactly which one you want, by giving its name as
   the argument: `wizard.pick_up(key)`. At the end, Nuri says they have
   left their spare wand on a flat stone past the gate for you to pick up: it is
   lent, to be given back one day.
   Try code: `wizard.move_right(2)` then `wizard.pick_up()` on two lines.

7. `your-first-spell` — *Your first spell* / *Tu primer hechizo*. Spells
   are cast with a wand, and when cast they do something; a spell is a
   word of magic, a string, and said without a wand it is only a word.
   Casting is an action the wand gives your wizard,
   `wizard.cast("zelim")`: without the wand, your wizard cannot cast
   spells. What a spell does depends on where you are and what you have
   near, and it may do nothing at all. `zelim` breaks the seal of a door
   right beside you; a sealed door shows a glowing rune. *zelim* is a
   word to type: in italics where it appears in the prose.
   Try code: `wizard.move_right(2)` then `wizard.cast("zelim")` on two lines.

A word the child must type (a password, a spell) is in italics in the
prose, with its sentence punctuated around it.
