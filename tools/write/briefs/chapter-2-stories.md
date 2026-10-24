---
outputs:
  - content/stories/in-the-castle/text.en.json
  - content/stories/in-the-castle/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/up-to-the-castle/text.en.json
---
Write the two stories of chapter 2 of Kydux, *The library*: the one that
opens the chapter inside the castle, at the library's door, and the one
that closes it at the wand bank. English and Spanish. The stories of
chapter 1 are given, so that you know how the game's stories sound and
where the story stands.

## How a story is told in the game

A story is played on the game's scene, like a short play. The scene is
drawn wide, with the wizard and the other characters standing on it, and
the story goes forward one step at a time when the child presses *Next*.
Each step is said by one speaker:

- **the voice**, the narrator, whose words show in a band under the
  scene: a short paragraph, two to four sentences, that tells the child
  what is happening and how it feels. The narrator speaks to the child as
  "you": the child is the wizard.
- **a character**, the wizard or another, whose words show in a speech
  bubble over their head: what they say aloud, as they would say it, one
  to three sentences. No quotation marks and no "she says": the bubble
  shows who speaks.

Before a step's words, something may happen on the scene: a character
walks, turns, appears or goes. The words go with it and never contradict
it. Let the characters sound like themselves (story.md) and talk to each
other, not only explain.

Each file is a JSON object: `{"title": "...", "steps": ["...", ...]}`,
with exactly as many steps as the story's list below, in that order.

## What the child knows by now

- Before **in-the-castle**: all of chapter 1. What a computer does with a
  program, and what instructions and programs are; that the wizard is an
  object, `wizard`, whose actions are methods, and that things are
  objects too; comments; arguments, a move told how far; strings, and
  `say`; `pick_up`; casting a spell with the wand, `zelim`. The wizard
  carries Nuri's spare wand, lent at the gate, and must borrow a school
  wand from the wand bank and give the spare back. This story teaches
  nothing; Wenna's first lesson follows it.
- Before **the-wand-bank**: chapter 1, and chapter 2 with Wenna: a name
  for a value, which programmers call a variable (`steps = 3`); what a
  thing knows, an attribute (`door.locked`, `wizard.position`), shown
  with `print`; a method that gives something back, `find_nearest`, kept
  under a variable, and `give`; opening a door with its own method,
  `door.open()`, and a locked door's key picked up first; and `fendra`,
  the spell that draws a thing from a shelf to the wizard. The wizard has
  just given Eldra, the library's ghost, the book she lost long ago.

## in-the-castle: at the library's door

The scene: inside the castle, at the door of the library, its shelves
beyond. Ilda, a teacher, stands with the new pupils; Nuri beside the
wizard; Wenna, the librarian, comes later.

1. voice. (The wizard turns to Ilda.) Inside at last: the great doors
   close behind you, and the castle is warm and bright after the cold
   road. A teacher is waiting for the new pupils.
2. ilda. Ilda welcomes them to Arvelia and says who she is: their
   teacher.
3. ilda. Ilda notices the wand the wizard carries: a spare, lent by a
   friend. Every new pupil borrows a school wand for the year at the wand
   bank, a counter run by the pupils' parents, on the far side of the
   library; then the wizard can give Nuri's wand back.
4. wizard. The wizard answers: asks the way, or says they will go now.
5. nuri. (Nuri goes once the words are said.) Nuri has to go to their
   first class, and says goodbye for now: they will meet at the wand bank.
6. voice. (Wenna appears at the library's door.) The library: shelves
   taller than a house, old books, a hush; and the librarian coming to
   meet you.
7. wenna. Wenna says who she is, that the library is a place of order,
   and that she will see the wizard across it, teaching a few new things
   on the way.

Ilda calls the pupils together in Spanish with a plural that includes
everyone: *Bienvenidos* is fine for a group. Title: *In the castle* /
*En el castillo*.

## the-wand-bank: Eldra's thanks, and the wand

The scene: the library's lowest aisle. Eldra floats beside the wizard
with her book; further along is the counter of the wand bank, where Nuri
will appear.

1. voice. (The wizard turns to Eldra.) Eldra holds her lost book again,
   after so many years.
2. eldra. Eldra thanks the wizard, in her old-fashioned way.
3. voice. (Eldra goes once the words are said.) She drifts away between
   the shelves, reading as she goes.
4. voice. (The wizard steps to the aisle's end.) Just beyond it is the
   wand bank: a counter where a pupil's parent lends the wizard a school
   wand for the year.
5. nuri. (Nuri appears by the counter.) Nuri is there, back from class,
   and sees the new wand.
6. wizard. (The wizard turns to Nuri.) The wizard gives Nuri the spare
   wand back, with thanks.
7. voice. A look back at what Wenna taught in the library, warmly and in
   a natural way, not as a list: the ideas of chapter 2 above, each with
   its programmer's word.
8. nuri. Night is falling; Nuri has heard the older pupils whisper that
   the passages change after dark, and wonders who walks there. A hook
   for chapter 3.

Nuri is of the wizard's gender: in Spanish, Nuri's own gendered words are
choices, and the wizard's too. Title: *The wand bank* / *El banco de
varitas*.
