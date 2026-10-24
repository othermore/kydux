---
outputs:
  - content/stories/at-the-gate/en.md
  - content/stories/at-the-gate/es.md
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
  - content/stories/up-to-the-castle/en.md
  - content/stories/up-to-the-castle/es.md
context:
  - docs/dev/story.md
  - content/stories/the-letter/en.md
  - content/stories/the-letter/es.md
---
Write chapter 1 of Kydux, *Arrival*: its opening story page, its seven
lessons and its closing story page, in English and Spanish. The level texts
come in a later brief.

## Where the child is

The child has read the opening (`the-letter`, given): a letter of
admission, the journey, and the great gate of Arvelia, shut at dusk. Then
they made their wizard: a name (`{wizard}`) and a girl or a boy. Chapter 1
happens at the gate and on the road up to the castle. It is the game's
tutorial, taught by Nuri inside the story, not by the game.

Nuri is a first-year pupil who arrives at the gate at the same moment,
grew up among wizards and already knows some magic, and becomes the
wizard's friend. Nuri is a girl when the wizard is a girl and a boy when
the wizard is a boy: in Spanish, Nuri's own gendered words are choices too
(`{nuevo|nueva}`, `{amigo|amiga}`). Every lesson is in Nuri's voice,
speaking to the wizard as "you". The wand is lent by Nuri: a spare one, to
be given back.

In Kydux the child plays the wizard: the wizard on the screen is them. The
castle of Arvelia listens to instructions written in Python; wizards write
small programs, and the magic follows them. So "your program tells your
wizard what to do" must be explained, not assumed: Nuri says it.

The school's method, which Nuri says early and the lessons repeat: try,
watch what happens, and try again. A good wizard investigates first.

## The words (the easy word with the proper one)

Each idea is named by the child's word beside the programmer's word, both
used together through this chapter: an instruction; a program, a list of
instructions; an action, which programmers call a method; an object, any
character or thing in a program (the wizard, a door, a book); a note,
which programmers call a comment; how much, the number in the brackets,
which programmers call an argument; words in quotes, which programmers call
a string. Spanish: instrucción, programa, acción (método), objeto,
nota (comentario), cuánto / argumento, cadena.

## The texts

Each is Markdown, pages separated by a line with only `---`, the first page
opening with a `#` title. Each page a few short sentences. A lesson is three
or four pages: what the idea is and why it exists, with no code; then how it
is written in the game, with one example; and the last page, *Try it*,
which ends with exactly one fenced block marked `python try` holding the
code given below, word for word (in Spanish, only a string or a comment
inside the code is translated). A story page has no code and no `python
try` block.

1. `stories/at-the-gate` (opening story page, 2 or 3 pages). At the shut
   gate at dusk. The wizard does not know how to open it. Nuri arrives,
   friendly and a little proud of knowing magic, says the gate listens to
   instructions, and offers to show the basics right there. The method:
   try, watch, try again.

2. `lessons/what-a-program-is`. Nuri explains: a computer, and the castle,
   do exactly what they are told, one step at a time; each step is an
   instruction; a list of instructions is a program; it runs from the top
   down. Then: in Arvelia, you write a program and your wizard, you, does
   it, exactly, no more, no less. One instruction: `wizard.move_right()`,
   one step to the right; what each part means comes next. Try it: the
   gate is one step to the right.
   Try code: `wizard.move_right()`

3. `lessons/objects-and-actions`. A program is a list of instructions; an
   instruction can be an action, like moving to the right. An action needs
   someone to do it: the wizard. Each character can do some actions and not
   others. The characters in a program are objects, and so is anything in
   it, a book, a door. The actions are called methods: `move_right` is a
   method of the object `wizard`. Then the dot (the action belongs to the
   wizard) and the brackets (do it now); the four moves; one line, one
   step. Tell the child about the notebook: the wizard's notebook, a button
   on the screen, lists the actions the wizard knows; open it often. Try
   it: a corridor that turns a corner.
   Try code:
   `wizard.move_right()` then `wizard.move_down()` on two lines.

4. `lessons/notes`. Sometimes you want to write in a program something that
   is not an instruction: a note for a person, saying what a part does or
   what to do. A line that starts with `#` is a note, which programmers
   call a comment; the computer skips it. From now on, programs may come
   with notes that tell you what to do, like *this program has a mistake:
   find it and fix it*. The next level gives a program with one wrong move
   to fix.
   Try code: a comment line, in the child's language, saying the first
   step is to the left, then `wizard.move_left()`.

5. `lessons/how-much`. Long corridors: writing the same line six times is
   slow and easy to miscount. An action can be told how much: a number in
   the brackets, which programmers call an argument; it is what you give
   the action so that it knows how much. With no number, one step.
   Try code: `wizard.move_right(3)`

6. `lessons/words`. The wizard can also say things. Words in a program go
   between quotes: a string. Without quotes the computer would read a word
   as an instruction or a name; with them, it keeps the word as it is, so
   capitals matter. Just as `move_right` takes how much to move as its
   argument, `say` takes what to say: `wizard.say("Hello!")`. Some doors in
   Arvelia listen for a word.
   Try code: `wizard.say("Hello!")` (Spanish: `wizard.say("¡Hola!")`)

7. `lessons/things-to-carry`. Arvelia is full of things: keys, books,
   wands; each thing is an object too, with a name. The wizard picks up a
   thing on its own tile or right beside it: `wizard.pick_up()`. With
   several things in reach, the wizard asks which: you give the thing's
   name, `wizard.pick_up(key)`. Here, Nuri lends a spare wand, set down
   near the gate, for the wizard to pick up: it must be given back one day.
   Try code: `wizard.move_right(2)` then `wizard.pick_up()` on two lines.

8. `lessons/your-first-spell`. A spell is a word of magic: said by anyone,
   only a word; cast with a wand, it does something. What a spell does
   depends on where the wizard stands and what is near, and it may do
   nothing at all. Some spells, later, will need to be told what to act on.
   `cast` is the wand's action: without the wand the wizard does not know
   it. `zelim` breaks the seal of a door right beside the wizard; a sealed
   door shows a glowing rune.
   Try code: `wizard.move_right()`, `wizard.pick_up()`,
   `wizard.cast("zelim")` on three lines.

9. `stories/up-to-the-castle` (closing story page, 2 or 3 pages). The way
   in is open; the wizard and Nuri walk up the road to the castle, lit
   windows, the great doors. Nuri sums up what the wizard learned, in a
   few lines, with both words: a program and its instructions, objects and
   their actions or methods, notes or comments, how much or arguments,
   words in quotes or strings, carrying things, a spell. Nuri reminds them
   the wand is only lent. Inside, a teacher, Ilda, waits: what comes next
   is the castle itself.

Never mention the game's own interface beyond the notebook in lesson 3;
the screen is shown to the child by the game. Keep every text short: a
child of eight reads it.
