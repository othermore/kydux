---
outputs:
  - content/stories/the-entrance/text.en.json
  - content/stories/the-entrance/text.es.json
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/stories/the-morning/text.en.json
  - content/stories/the-morning/text.es.json
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/up-to-the-castle/text.en.json
  - content/stories/up-to-the-castle/text.es.json
---
Write the five stories of chapter 2 of Kydux, *The library*, in English
and Spanish. Chapter 1's stories are given, so that you know how the
game's stories sound and where the story stands: the wizard and the
friend have just opened the castle's great door, at nightfall.

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

## Who is who

- The **friend** met at the gate is of the wizard's other gender: write
  `{friend}` and the friend's Spanish words in double braces.
- The **dormitory mate**, met in this chapter, is of the wizard's own
  gender: write `{mate}`, and the mate's Spanish words in the wizard's
  single braces.
- **Ilda** is a teacher, warm, patient, a little funny. **Wenna** is the
  librarian, precise and quiet, fond of order. **Eldra** is the library's
  ghost, who whispers in old-fashioned words and is never frightening.

## What the child knows by now

- Before **the-entrance**, **the-first-night**, **the-morning** and
  **at-the-library**: all of chapter 1 (instructions and programs, the
  wizard as an object with methods, comments, arguments, strings and
  `say`, `pick_up`, the spell *zelim* cast with the wand). The wizard
  carries the friend's spare wand, lent at the gate. These stories teach
  nothing.
- Before **the-wand-bank**: chapter 1, and chapter 2: that an action has
  its place (`wizard.sleep()` only beside a free bed); what a thing knows,
  its attributes (`door.locked`, `wizard.position`, `wizard.items`), shown
  with `print`; a method that gives something back, `find_nearest`, kept
  under a name, which programmers call a variable, and `give`; a door
  opened with its own method, `door.open()`, beside it and with its key;
  a hidden thing found all the same and shown with `reveal`; a number the
  program cannot know when it is written, `key.distance_to(wizard)`, kept
  under a name and used twice; the order of the steps; and *fendra*, the
  spell that draws a thing within three cells to the wizard.

## the-entrance: the castle's great hall, at night

The scene: the castle's entrance hall, a red carpet from the great door,
open behind the children, to three arches at the far end; pillars,
banners, suits of armour, torches, a big chandelier. Ilda, a teacher,
waits on the carpet for the first-year pupils.

1. voice. You and {friend} have just come in through the great door:
   what the hall is like, warm after the night outside.
2. ilda. Ilda welcomes them to Arvelia, and says who she is: a teacher,
   who looks after the first-years.
3. ilda. A word about the castle: it listens to those who give it the
   right instructions, as they found at the gate; and it is late.
4. wizard. The wizard answers: tired, amazed, or asks where they sleep.
5. friend. The friend says something eager about the castle or tomorrow.
6. ilda. (Ilda walks up the carpet towards the middle arch.) She asks
   them to follow her to the first-years' dormitory.
7. voice. (The wizard follows her up the carpet.) You follow Ilda across
   the hall, {friend} beside you, under the chandelier.
8. ilda. (Ilda goes through the arch once her words are said.) A last
   word: it is not far, and their beds are waiting.

## the-first-night: the dormitory's common room

The scene: the first-years' rooms at night. A common room with a fire, two
armchairs, a round rug; an open arch on its left into the girls'
dormitory, an open arch on its right into the boys'; its door at the
bottom, to the castle's corridor. Ilda, the wizard and the friend stand by
the door. Through the arch of the wizard's dormitory, two pupils already lie
asleep in their beds; they say nothing.

1. voice. The common room: the fire, the quiet, the two arches.
2. ilda. Ilda says these are the first-years' rooms: the girls sleep on
   the left, the boys on the right, and they share this common room.
3. ilda. (Ilda goes once her words are said.) Good night, and see you in
   the morning.
4. friend. (The friend walks towards the arch on the left.) The friend
   says goodnight to {wizard}, sleepy, and see you tomorrow.
5. voice. ({friend} goes through the arch on the left.) {friend} goes into
   the other dormitory.
6. voice. ({friend} is gone.) You are alone in the common room, and very
   tired: your own dormitory is through the arch on the right.

## the-morning: the wizard's dormitory

The scene: the wizard's dormitory in the morning, light at its window,
four beds. The wizard stands by the bed they slept in; {mate}, the
dormitory mate met last night, is still asleep in theirs, and two other
pupils sleep on in the other beds.

1. voice. Morning light through the window: you slept well.
2. mate. ({mate} wakes and gets up.) {mate} says good morning, and that they must go to the library,
   to the wand bank, to borrow a school wand until they can buy one of
   their own: they have none at all.
3. wizard. The wizard says they need one too: the wand they carry is
   {friend}'s spare, lent at the gate, and they want to give it back.
4. mate. {mate} says they will go together, and knows the way.
5. voice. (The wizard walks into the common room.) You cross into the
   common room.
6. voice. ({mate} follows.) {mate} comes after you.
7. voice. (The wizard walks to the door.) You go to the door, and out
   into the castle's corridors, to the library.

## at-the-library: the reading room

The scene: the library's reading room, just inside its double door:
round tables with candles, a red carpet, Wenna's desk with its lamp, low
shelves, and in the wall above the room a small door, Wenna's own, which
leads to the shelves beyond. The wizard and {mate} have just come in;
Wenna stands by her desk.

1. voice. The library: shelves taller than a house beyond the wall, the
   smell of old books, a great hush, morning light.
2. wenna. Wenna greets them, says who she is, and asks what brings
   first-years so early.
3. wizard. The wizard says they have come for wands from the wand bank.
4. wenna. Wenna says the wand bank is at the far end of the library, at
   the end of the top aisle; the way there goes past many doors, and she
   will go with them and teach them a few things on the way.
5. wenna. (Wenna walks to her small door.) This is her own door, which
   she has just opened for them: the library starts beyond it.
6. mate. {mate} says something eager to {wizard}.

## the-wand-bank: the top aisle's end

The scene: the top aisle, under the high shelves; at its right end the
wand bank, a wooden counter with a striped awning and a rack of wands,
kept by one of the pupils' parents. Eldra holds the book {wizard} has
just given her; {mate} and Wenna stand by.

1. voice. Eldra holds her own book again, after so many years.
2. eldra. (Eldra drifts away once her words are said.) Her thanks, in her
   old-fashioned words.
3. voice. At the end of the aisle, the wand bank: a parent behind the
   counter lends each of you a school wand for the year, yours and
   {mate}'s.
4. friend. ({friend} appears by the counter.) {friend} has come for a
   school wand too, and is glad to see {wizard}.
5. wizard. The wizard gives {friend} back the spare wand, with thanks.
6. mate. {mate} is delighted with the new wand.
7. wenna. Wenna sums up, in a few warm sentences, what {wizard} learned in
   the library, as listed above, naming each idea by its proper word
   beside its easy one (an attribute, a variable).
8. voice. Leaving, you see the windows: it is dusk already, and older
   pupils whisper that at night the castle's passages change.
