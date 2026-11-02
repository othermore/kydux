---
outputs:
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/the-wrong-order/text.en.json
  - content/levels/the-wrong-order/text.es.json
  - content/levels/the-high-shelf/text.en.json
  - content/levels/the-high-shelf/text.es.json
  - content/levels/eldras-book/text.en.json
  - content/levels/eldras-book/text.es.json
  - docs/dev/chapter-2-words.en.json
  - docs/dev/chapter-2-words.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/levels/the-way-in/text.en.json
  - content/levels/the-way-in/text.es.json
  - content/levels/the-wand/text.es.json
---
Write the texts of chapter 2's seven levels, in English and Spanish, and a
few words the game says round them. The last levels of chapter 1 are
given for their voice. Each level comes right after the lesson it
practises, in the order below, and the levels are where the story moves
on between the lessons.

## Where it happens

The first level is in the first-years' dormitory at night: a common room
with a fire between two dormitories, the girls' through an open arch on
the left, the boys' through an open arch on the right; the wizard's own
is always the one on the right for this level, whoever the wizard is, and
the arch on the left refuses the wizard with a thought. {mate}, the
dormitory mate, of the wizard's own gender, met there, speaks in it.

The other six are in the library, the next morning, one after the other
along one way: from the reading room through Wenna's small door, round
the bookcases into a wide hall with Eldra's nook on its left (an old
armchair, a round rug); through the door in the middle of the hall's top
wall to the top aisle under the high shelves; along the aisle to the
small door of Eldra's little room at its left end; the wand bank is at
the aisle's right end. Wenna speaks in each, in the voice of her lessons.
Eldra is the library's ghost, who lost her books long ago; she whispers,
in old-fashioned words, and is never frightening. {mate} goes along.

## Who is who

Write the friend met at the gate as `{friend}`, the dormitory mate as
`{mate}`, and the wizard as `{wizard}`, as rules.md says.

## Each level's file

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
- `intro`: what the speaker says before the level, one to three
  sentences: where they are and what is wanted, so that the child knows
  why.
- `outro`: what the speaker says after a win, one or two sentences that
  move the story on to what comes next.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says
  what the idea is and what the child can do with it now. Every level has
  it but the last, `eldras-book`, which the chapter's closing story sums
  up instead.

## What the child knows by now

The texts never explain again what a lesson has taught; they use its
words. Before every level the child knows all of chapter 1 (programs,
objects and methods, comments, arguments, strings and `say`, `pick_up`,
spells cast with the wand, *zelim*). In chapter 2, before each level:

- your-bed: also that an action has its place: `wizard.sleep()` only
  beside a free bed.
- the-lost-book: also attributes (`door.locked`, `wizard.position`,
  `wizard.items`) and `print`; methods that give something back,
  `find_nearest`, kept under a name, a variable; `None`; `give`.
- the-hidden-key: also `door.open()`, keys, and `reveal`.
- the-moving-key, the-wrong-order: also `distance_to`, a number kept
  under a name and used twice, and a level played in several ways.
- the-high-shelf and eldras-book: also *fendra*.

## The levels

1. `your-bed` — Practice 1, after *The right place*. Speaker: {mate}.
   The intro is {mate} meeting {wizard} for the first time, in the
   wizard's own dormitory, at night: say hello, say they share the
   dormitory this year, and that {wizard} must be tired: the free bed is
   the one beside theirs; lie down in it and sleep. The wizard stands in
   the common room by its door; their own dormitory is through the arch
   on the right. Goals: sleep in the free bed beside {mate}'s; bonus:
   without bumping into anything. Starting code: comments allowed.
   Learned: that an action may need the right place, and that a program
   walks there first.
   Solution: `wizard.move_up(5); wizard.move_right(4); wizard.sleep()`.

2. `the-lost-book` — Practice 2, after *What things know* and *Finding
   things*. In the reading room, by Wenna's open door. A whisper from
   across the hall beyond: Eldra, the ghost, lost a book long ago in her
   nook; Wenna asks {wizard} to find it and give it back. The book lies
   on the rug by the old armchair, out of sight from here. Goals: give
   Eldra her book; bonus: find the book with `find_nearest`. Starting
   code: comments allowed. Learned: how a method can give something back,
   how a variable keeps it, and how to give a thing to someone.
   Solution: `book = wizard.find_nearest("book"); print(book.position); wizard.move_up(2); wizard.move_right(4); wizard.move_up(4); wizard.move_left(7); wizard.pick_up(); wizard.give(book)`.

3. `the-hidden-key` — Practice 3, after *Keys and doors*. By Eldra's
   nook. The way on is the locked door in the middle of the hall's top
   wall; its key fell long ago behind Eldra's armchair, where no one can
   see it. Find it, show where it lies, fetch it from beside the armchair,
   open the door and go through. Goals: pick up the key; open the door;
   go through it; bonus: find the key with `find_nearest`. Starting code:
   comments allowed. Learned: that a thing out of sight is there all the
   same for a program, and how a door opens with its key.
   Solution: `key = wizard.find_nearest("key"); key.reveal(); print(key.position); wizard.move_up(2); wizard.move_left(); wizard.pick_up(); wizard.move_down(); wizard.move_right(4); wizard.move_up(); door.open(); wizard.move_up(3)`.

4. `the-moving-key` — Improve 1, after *How far*. On the top aisle, by
   Wenna. The key of Eldra's little room is never twice in the same place
   along the aisle (Wenna smiles: Eldra moves it, she thinks). Wenna's
   program from yesterday walked four steps and brought it back; today it
   is somewhere else, and the level is played three ways, the key nearer
   or farther each time. Make the program ask the key how far it is,
   keep the number under a name, walk there, pick it up, walk back the
   same number, and give the key to Wenna. Goals: give Wenna the key;
   bonus: write no number at all. Starting code, exactly: a comment that
   this is yesterday's program and the key has moved; then
   `wizard.move_left(4)`, `wizard.pick_up()`, `wizard.move_right(4)`,
   `wizard.give(key)`. Learned: what a variable is for: a value the
   program cannot know when it is written, kept under a name and used
   twice.
   Solution: `key = wizard.find_nearest("key"); steps = key.distance_to(wizard); wizard.move_left(steps); wizard.pick_up(); wizard.move_right(steps); wizard.give(key)`.

5. `the-wrong-order` — Fix 1. On the top aisle. Wenna gives {wizard} the
   key back: her old program takes it to Eldra's little room, at the left
   end of the aisle, but it asks the door to open from where it starts,
   and only then walks to it; a door listens only to whoever stands
   beside it. Fix the order. Goals: open the door; stand before it.
   Starting code, exactly: a comment that the program does things in the
   wrong order; then `door.open()`, `wizard.move_left(5)`. Learned: that
   the computer does the steps from the top down, and that a step in the
   wrong place does nothing.
   Solution: `wizard.move_left(5); door.open()`.

6. `the-high-shelf` — Practice 4, after *A spell that reaches*. By
   Eldra's open door. Before Eldra's own book, Wenna asks for a rare book
   she has long wanted down: it glows on top of a high bookcase over the
   aisle, three cells up, out of reach. Goals: take the rare book; bonus:
   name the book with `find_nearest` first. Starting code: comments
   allowed. Learned: how *fendra* reaches a thing in a straight line, and
   that a thing it brings must still be picked up.
   Solution: `book = wizard.find_nearest("book"); wizard.move_right(5); wizard.cast("fendra"); wizard.pick_up()`.

7. `eldras-book` — Practice 5. Below the high shelves; Eldra waits by her
   little room. Her own book lies on the shelf inside it, which no one
   can step into: bring it down with *fendra* from the doorway's line, and
   give it to her. The chapter together. Goals: give Eldra her book;
   bonus: name the book with `find_nearest` before the spell moves it.
   Starting code: comments allowed. No learned.
   Solution: `book = wizard.find_nearest("book"); wizard.move_left(5); wizard.cast("fendra"); wizard.pick_up(); wizard.give(book)`.

## The words round the levels

`docs/dev/chapter-2-words.en.json` and `.es.json`, one JSON object each,
with exactly these keys, each a short sentence the wizard thinks or the
notebook says (the notebook's are plain descriptions, as in "Gives a thing
the wizard carries to whoever stands right beside it."):

- `blocked.not_my_dormitory`: what the wizard thinks when the arch of the
  other dormitory refuses them: that they should not go into the girls'
  (for a boy wizard) or the boys' (for a girl wizard) dormitory. English:
  `{girls'|boys'}`; Spanish: `{las chicas|los chicos}`.
- `blocked.no_bed`: there is no bed right beside the wizard.
- `blocked.bed_taken`: the bed beside is someone else's.
- `blocked.not_here`: a thing cannot be shown where it lies, since the
  wizard is carrying it; the thing is `{thing}`, as "the key".
- `notebook.wizard.sleep`: what `wizard.sleep()` does.
- `notebook.wizard.distance_to`, `notebook.thing.distance_to`: what
  `distance_to` gives, from the wizard and from a thing.
- `notebook.thing.reveal`: what `reveal` does.
- `notebook.bed.free`: what a bed's `free` says.
- `things.bed`: "the bed" / "la cama".
