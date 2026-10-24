---
outputs:
  - content/stories/the-letter/text.en.json
  - content/stories/the-letter/text.es.json
  - content/stories/at-the-gate/text.en.json
  - content/stories/at-the-gate/text.es.json
  - content/stories/up-to-the-castle/text.en.json
  - content/stories/up-to-the-castle/text.es.json
context:
  - docs/dev/story.md
---
Write the three stories of chapter 1 of Kydux, *Arrival*: the game's
opening, the story at the gate that opens the chapter, and the one that
closes it on the road up to the castle. English and Spanish.

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
walks, turns or appears. The step's words go with it; they need not
describe it in full, since the child sees it, but they should not
contradict it. The stories are where the child meets the people of the
school, so let the characters sound like themselves (story.md says how
each speaks) and let them talk to each other, not only explain.

Each file is a JSON object: `{"title": "...", "steps": ["...", ...]}`,
with exactly as many steps as the story's list below, in that order.

## What the child knows by now

- Before **the-letter**: nothing. It is the game's very first screen. The
  child has not yet named their wizard nor chosen a girl or a boy, so this
  story uses no `{wizard}` and, in Spanish, no word that would change with
  the wizard's gender: say *tú*, and choose words that need no choice.
- Before **at-the-gate**: the opening, and they have just made their
  wizard (a name, `{wizard}`, and a girl or a boy). Nothing about
  programming yet. This story does not teach; the first lesson comes
  right after it.
- Before **up-to-the-castle**: all of chapter 1. What a computer does with
  a program, and what instructions and programs are; that the wizard is
  an object, the one the code calls `wizard`, and that its actions are
  methods; notes in a program, comments; telling a move how far, its
  argument; words in quotes, strings, and saying them with `say`, which
  opened the gate with its password; picking things up with `pick_up`;
  and casting a spell with the wand, `zelim`, which broke two seals.

## the-letter: the opening, told from the gate

The scene: the field before the school's great gate, at dusk. The wizard
stands at the end of the path, the gate ahead. The story starts here and
now, at the gate, and goes back in the past to tell how the wizard came:
the owner wants the letter told as something that happened weeks ago,
not as if it were arriving now.

1. voice. You stand at the end of a path before a great iron gate, at
   dusk. Then go back: some weeks ago, a letter came.
2. voice. The letter: an invitation to a first year at Arvelia, a school
   of magic, signed by Orla, the head of the school; with it, a picture
   of the school, an old castle on a hill above a deep lake. How the
   child felt reading it.
3. voice. (The wizard walks up the path to the gate.) The journey: packing,
   the long road, the village at the foot of the hill, the climb at dusk,
   and so to here.
4. voice. Now, at the gate: it is shut, with no handle and no bell; the
   child has no wand and knows no magic yet. But the old gate is very
   quiet, as if it were listening.
5. voice. Before the story goes on, one question: who are you? (The next
   screen asks the child to make their wizard: a name, a girl or a boy, a
   look.)

Title: *The letter* / *La carta*.

## at-the-gate: Nuri arrives

The scene: the wizard before the shut gate; the path leads back from it
through the field. Nuri comes up that path.

1. voice. (The wizard turns to the gate.) You are at the gate, and you do
   not know how to open it.
2. wizard. The wizard tries something a child would try: calls out to the
   gate, or knocks, or asks if anyone is there. Nothing happens.
3. voice. (Nuri appears at the far end of the path.) Someone else is
   coming up the path: another new pupil, out of breath.
4. nuri. (Nuri walks up beside the wizard.) Nuri says hello and who they
   are: a first-year pupil, just arriving too.
5. wizard. (The wizard turns to Nuri.) The wizard answers with their name,
   and asks if Nuri knows how the gate opens.
6. nuri. Nuri grew up among wizards and knows a little magic; the gate is
   not opened by pushing: this gate listens to instructions. (The gate,
   not the castle: in this game it is the computer that runs a program,
   and the story never says the castle does what it is told.)
7. wizard. The wizard asks what an instruction is, or how one gives an
   instruction to a gate.
8. nuri. Nuri promises to show them, one thing at a time, right here, and
   says how wizards learn in Arvelia: you try, you watch what happens, and
   you try again. They start with what a program is.

Nuri is a girl when the wizard is a girl and a boy when the wizard is a
boy: in Spanish, Nuri's own gendered words are choices too. Title: *At
the gate* / *Ante la puerta*.

## up-to-the-castle: at the castle's door

The scene: the top of the path, before the castle's great door, which the
wizard has just opened with the word and the spell: inside, the dark of
the hall. Nuri comes up the path behind.

1. voice. (The wizard steps up to the open door.) The castle's great door
   stands open at last, the last seal broken.
2. nuri. (Nuri comes up the path behind.) Nuri is delighted: they did
   it, the two of them.
3. nuri. (Nuri comes to the wizard's side.) Nuri looks back on the first
   half of what the wizard learned today, as a friend remembering the
   day, in two flowing sentences: the first step to the gate, the fixed
   note, the long walk in one instruction; each idea said exactly (a
   program is a list of instructions; your wizard is an object, the one
   the code calls `wizard`, and its actions are methods; a comment is a
   note for a person; a move's argument says how far).
4. nuri. Nuri goes on with the second half: the password, the wand, the
   seals, said exactly (a string is words in quotes, kept exactly as
   written, and `say` says one; `pick_up` picks a thing up; a spell is
   cast with the wand). In Spanish the programmer's words are the
   course's: *instrucción*, *programa*, *objeto*, *método*,
   *comentario*, *argumento*, *cadena* (never *string*). A spell or a
   password is in italics (*zelim*, *ambrel*), not as code.
5. wizard. (The wizard turns to Nuri.) The wizard thanks Nuri, and says
   something about the wand, or about what they liked most.
6. nuri. The wand is only lent: Ilda, their teacher, waits inside, and
   the wand bank, a counter in the castle run by the pupils' parents,
   lends every new pupil a school wand for the year; then the wizard can
   give Nuri's spare back.
7. voice. (The wizard walks in through the door.) Together you step into
   the castle; the real castle begins.

Title: *Up to the castle* / *Hacia el castillo*.
