---
outputs:
  - content/levels/the-reading-room/text.en.json
  - content/levels/the-reading-room/text.es.json
  - content/levels/which-way/text.en.json
  - content/levels/which-way/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-locked-door/text.en.json
  - content/levels/the-locked-door/text.es.json
  - content/levels/the-wrong-order/text.en.json
  - content/levels/the-wrong-order/text.es.json
  - content/levels/the-archive/text.en.json
  - content/levels/the-archive/text.es.json
  - content/levels/the-high-shelf/text.en.json
  - content/levels/the-high-shelf/text.es.json
  - content/levels/eldras-book/text.en.json
  - content/levels/eldras-book/text.es.json
context:
  - docs/dev/story.md
  - content/stories/in-the-castle/text.en.json
  - content/stories/the-wand-bank/text.en.json
  - content/lessons/a-name-for-a-value/en.md
  - content/lessons/what-things-know/en.md
  - content/lessons/finding-things/en.md
  - content/lessons/keys-and-doors/en.md
  - content/lessons/fendra/en.md
  - content/levels/the-way-in/text.en.json
---
Write the texts of chapter 2's eight levels, in English and Spanish. The
chapter's stories and lessons are given, and the last level of chapter 1
for its voice. Each level comes right after the lesson it practises, in
the order below, and the levels are where the story moves on between the
lessons. Wenna speaks in every level, in the voice of her lessons.

## Where it happens

One scene for the chapter, the library. The wizard comes in at the door
at the bottom left; a short reading room leads to Wenna's desk. Beyond
are the aisles between tall shelves, a loop with a short way up through a
locked door; Eldra's nook at the top, with her shelf below it; a
corridor along the top to a room behind a locked door and on to the
archive, which goes down through two doors; and the lowest aisle under
the high shelves, which leads back left to Eldra's shelf, and beyond it
to the wand bank's counter. Eldra is the library's ghost, who lost her
books long ago; she whispers, in old-fashioned words, and is never
frightening.

## Each file

A JSON object with exactly these keys:

- `title`: the level's name, short.
- `goals`: a list of strings, as many as the level's goals below and in
  their order, each a short sentence. A bonus goal's sentence is plain:
  the game writes *Bonus:* before it.
- `starting_code`: the program the level starts with, one string, `\n`
  between lines and at the end. It holds exactly the code lines given
  below, in order; where the level allows comments, comment lines
  (`# ...`, in the child's language) may say what to do, never how.
- `hints`: two or three, from the gentlest to the one that nearly says it.
  Each level below gives its solution, so that the hints are true to it
  (which way, how many steps, which line is wrong); the solution is for
  you, and never appears in a text. A hint never is, quotes or spells out
  a line of the solution, not even the first or the shortest: it points
  at the idea, the direction or the method by its name alone (`open`,
  `find_nearest`), and lets the child write the line.
- `intro`: what Wenna says before the level, one to three sentences:
  where they are and what is wanted, so that the child knows why.
- `outro`: what Wenna says after a win, one or two sentences that move
  the story on to what comes next.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says
  what the idea is and what the child can do with it now (as in "now you
  know what an argument is, and that the move actions have one that says
  how far"). Only where the level has it, below.

## What the child knows by now

The texts never explain again what a lesson has taught; they use its
words. Before every level the child knows all of chapter 1 (programs,
objects and methods, comments, arguments, strings and `say`, `pick_up`,
spells cast with the wand). In chapter 2, before each level:

- the-reading-room: also variables.
- which-way: also attributes, `door.locked`, `wizard.position`, and
  `print`.
- the-lost-book: also methods that give something back, `find_nearest`,
  `None`, and `give`.
- the-locked-door, the-wrong-order, the-archive: also `door.open()` and
  keys.
- the-high-shelf and eldras-book: also *fendra*.

## The levels

1. `the-reading-room` — Improve 1, after *A name for a value*. Wenna's
   program for new pupils walks from the door to her desk, but it writes
   the same number three times; give the number a name. Goals: reach
   Wenna's desk; write the number only once. Starting code, exactly: a
   comment saying the program works but writes the same number three
   times, and to give it a name; then `wizard.move_right(3)`,
   `wizard.move_up(3)`, `wizard.move_right(3)`. Learned: what a variable
   is, and how a name for a value keeps a program tidy.
   Solution: `steps = 3; wizard.move_right(steps); wizard.move_up(steps); wizard.move_right(steps)`.

2. `which-way` — Practice 1, after *What things know*. The short way up
   the aisles is a door; ask it whether it is locked, and if it is, take
   the long way round. Goals: reach the far end of the aisles; bonus: the
   program asks the door whether it is locked. Starting code: comments
   allowed. Learned: what an attribute is, and how to see one with
   `print`.
   Solution: `print(door.locked); wizard.move_right(6); wizard.move_up(4); wizard.move_left(6)`.

3. `the-lost-book` — Practice 2, after *Finding things*. A whisper among
   the shelves: Eldra, the ghost, lost a book long ago, somewhere in her
   nook. Find it, pick it up and give it to her. Goals: give Eldra her
   book; bonus: find the book with `find_nearest`. Starting code:
   comments allowed. Learned: how a method can give something back, and
   how to find a thing and give it to someone.
   Solution: `book = wizard.find_nearest("book"); print(book.position); wizard.move_right(2); wizard.move_up(2); wizard.pick_up(); wizard.move_down(2); wizard.move_right(2); wizard.give(book)`.

4. `the-locked-door` — Practice 3, after *Keys and doors*. Up the
   corridor, a locked door, and its key on the floor before it. Goals:
   pick up the key; open the door; walk through it; bonus: in fewer than
   7 lines. Starting code: comments allowed. Learned: how to open a door
   with its own method, and that a locked one needs its key first.
   Solution: `wizard.move_up(2); wizard.pick_up(); wizard.move_up(); wizard.move_right(3); door.open(); wizard.move_right(3)`.

5. `the-wrong-order` — Fix 1. A program of Wenna's tries to open the next
   door before it has the key. Goals: open the door; walk through it.
   Starting code, exactly: a comment saying the program does things in
   the wrong order, and to find and fix it; then `wizard.move_right(2)`,
   `wizard.move_right()`, `door.open()`, `wizard.pick_up()`,
   `wizard.move_right(3)`. Learned: that the order of the instructions
   matters, and how to find the one in the wrong place.
   Solution: `wizard.move_right(2); wizard.pick_up(); wizard.move_right(); door.open(); wizard.move_right(3)`.

6. `the-archive` — Practice 4. Down the archive: a door that opens by
   hand, a key, and the vault's locked door. The doors are called
   `archive_door` and `vault_door`. Goals: open the vault's door; reach
   the archive's foot; bonus: find the key with `find_nearest`. Starting
   code: comments allowed, saying what waits, never how. Learned: how to
   tell apart two doors by their names.
   Solution: `wizard.move_down(); archive_door.open(); wizard.move_down(3); wizard.pick_up(); wizard.move_down(); vault_door.open(); wizard.move_down(3)`.

7. `the-high-shelf` — Practice 5, after *A spell that reaches*. A rare
   book on a high shelf over the lowest aisle, out of reach. Stand in line
   with it, cast *fendra*, pick it up, walk on. Goals: take the rare
   book; walk on down the aisle. Starting code: comments allowed.
   Learned: how *fendra* draws a thing to you, and that it is picked up
   after.
   Solution: `wizard.move_left(5); wizard.cast("fendra"); wizard.pick_up(); wizard.move_left(3)`.

8. `eldras-book` — Practice 6, the chapter's last. Everything together:
   a key, a locked door, and Eldra's own book on her shelf, with Eldra
   waiting. Goals: give Eldra her book; bonus: name the book with
   `find_nearest` before the spell moves it. Starting code: comments
   allowed, saying what waits. No `learned` key: the closing story looks
   back.
   Solution: `wizard.move_left(2); wizard.pick_up(); wizard.move_left(); door.open(); wizard.move_left(3); book = wizard.find_nearest("book"); wizard.cast("fendra"); wizard.pick_up(); wizard.give(book)`.