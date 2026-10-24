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
  - content/lessons/fendra/es.md
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
---
Write the texts of chapter 2's eight levels, *The library*. The chapter
happens in one place, the library, and its levels are parts of it: where
one level ends, the next begins, on the same spot. Wenna, the librarian,
stands at her desk by the reading room in every level and speaks every
intro and outro, in the voice of the lessons; in two levels Eldra, the
ghost, stands in the scene too. The wizard carries Nuri's lent wand in
every level. The story pages and lessons are given; the levels come
between them, in this order.

## The place

The library's door is at the bottom left. The reading room is the path
from it up to Wenna's desk. Beyond, the aisles: a loop of four paths
round tall shelves, with a short way up through a locked door. Up to the
left, Eldra's corner, a nook by her shelf. Up from the aisles, a little
room with a key, and the top corridor, which runs right past another
locked door to the archive, a narrow way down through two doors. At the
archive's foot, the long aisle under the high shelves runs left, past a
locked door, to Eldra's shelf and, beyond, to the wand bank's counter.

## The levels

Each level file is a JSON object with exactly these keys: `title`,
`goals` (one short sentence per goal, exactly as many as listed below,
in that order; a bonus goal's sentence is plain), `starting_code` (one
string, lines separated by `\n`, ending in `\n`, or empty), `hints` (two
or three, from the gentlest to the one that nearly says it; a hint is
never, and never quotes, a whole line of the solution; it may name an
action or an attribute in backticks), `intro` (one to three short
sentences Wenna says before the level), `outro` (one or two short
sentences Wenna says after a win: a word of the story, what is next) and
`learned` (one sentence starting "Now you know" / "Ahora sabes", the
idea the level practised, easy word and programmer's word together). The
last level, `eldras-book`, has no `learned` key.

Starting code: a practice starts with comments only, in the child's
language, that say what to do and never how (no code line). A fix or
improve level starts with the program given below, exactly, and may have
one comment line above it.

1. `the-reading-room`, Improve 1, after *a name for a value*. From the
   library's door to Wenna's desk: right 3, up 3, right 3. Wenna's own
   program for new pupils writes the number 3 three times; it works, and
   can be made better by giving the number a name. Goals: reach Wenna's
   desk; write the number only once. Starting code, exactly: one comment
   line saying it works but writes the same number three times, and to
   give the number a name, then `wizard.move_right(3)`,
   `wizard.move_up(3)`, `wizard.move_right(3)`. Solution: `steps = 3`,
   then the three moves with `steps`.
2. `which-way`, Practice 1, after *what things know*. Into the aisles.
   The short way up is a door, four steps ahead, locked, and there is no
   key; the long way goes round. Ask the door before trying it. Goals:
   reach the far end of the aisles; bonus: the program asks the door
   whether it is locked. Starting code: comments saying to ask the door
   with `print`, then take the way that is open. Solution:
   `print(door.locked)`, right 6, up 4, left 6.
3. `the-lost-book`, Practice 2, after *finding things*. Eldra, the ghost,
   stands at the end of the path, two steps right and down from her
   nook; she lost a book long ago, in the nook up above. Find it with
   `find_nearest`, bring it, give it to her. Goals: give Eldra her book;
   bonus: find the book with `find_nearest`. Starting code: comments
   saying to find the book, pick it up and give it to Eldra. Solution:
   `book = wizard.find_nearest("book")`, `print(book.position)`, right 2,
   up 2, pick up, down 2, right 2, `wizard.give(book)`.
4. `the-locked-door`, Practice 3, after *keys and doors*. Up the little
   room: its key lies two steps up; the corridor above goes right to a
   locked door. Goals: pick up the key; open the door; walk through it;
   bonus: in fewer than 7 lines. Starting code: comments saying to take
   the key first, then open the door. Solution: up 2, pick up, up 1,
   right 3, `door.open()`, right 3.
5. `the-wrong-order`, Fix 1, after *keys and doors*. The top corridor goes
   on to another locked door, its key on the way. Wenna wrote a program
   for it that opens the door before it has the key. Goals: open the
   door; walk through it. Starting code, exactly: one comment line saying
   the program does things in the wrong order, and to find and fix it,
   then `wizard.move_right(2)`, `wizard.move_right()`, `door.open()`,
   `wizard.pick_up()`, `wizard.move_right(3)`. Solution: the key picked
   up before the door is opened.
6. `the-archive`, Practice 4. Down the archive's narrow way: a door that
   opens by hand, a key on the floor, then the vault's locked door. Goals:
   open the vault's door; reach the archive's foot; bonus: find the key
   with `find_nearest`. Starting code: comments saying what waits (a
   door, a key, a locked door), not how. Solution: down 1,
   `archive_door.open()`, down 3, pick up, down 1, `vault_door.open()`,
   down 3.
7. `the-high-shelf`, Practice 5, after *a spell that reaches*. The long
   aisle under the high shelves: a rare book lies up on a shelf, out of
   reach. Stand in line with it, cast `fendra`, pick it up, walk on.
   Goals: take the rare book; walk on down the aisle. Starting code:
   comments saying to stand in line with the book and draw it down with
   the spell. Solution: left 5, `wizard.cast("fendra")`, pick up, left 3.
8. `eldras-book`, Practice 6, the chapter's last. At the aisle's end: a
   key, a locked door, and beyond it Eldra by her own shelf, where her
   last lost book lies high up. Everything of the chapter together.
   Goals: give Eldra her book; bonus: name the book with `find_nearest`
   before the spell moves it. Starting code: comments saying what waits.
   Solution: left 2, pick up, left 1, `door.open()`, left 3,
   `book = wizard.find_nearest("book")`, `wizard.cast("fendra")`, pick up,
   `wizard.give(book)`. No `learned` key.

Keep every text short and warm, for a child of eight. Goals say what to
reach, not how.
