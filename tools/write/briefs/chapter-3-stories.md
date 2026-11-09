---
outputs:
  - content/stories/after-dark/text.en.json
  - content/stories/after-dark/text.es.json
  - content/stories/beyond-the-doors/text.en.json
  - content/stories/beyond-the-doors/text.es.json
  - content/stories/the-voices/text.en.json
  - content/stories/the-voices/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
context:
  - docs/dev/story.md
  - drafts/chapter-3/capitulo-3.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/the-morning/text.es.json
  - content/stories/the-wand-bank/text.es.json
---
Write the four stories of chapter 3 of Kydux, *The passages*, in English and Spanish.
The owner's design document is given in full: its section 4 has the Spanish of three
of them, step by step, which the owner likes. Keep their words wherever they are
still true, and write English that says the same. Where this brief says something
changes, this brief wins.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a time.
Each step is said by one speaker: **the voice**, the narrator, in a band under the
scene, speaking to the child as "you", the child being the wizard, two to four
sentences; or **a character**, in a speech bubble, one to three sentences, with no
quotation marks and no "she says". Before a step's words something may happen on the
scene; the words go with it and never contradict it. At night the three whisper; the
tone stays warm and a little funny, never scary.

Each file is a JSON object, `{"title": "...", "steps": ["...", ...]}`, with exactly as
many steps as the list below, in that order.

## Who is who

`{friend}` is the friend met at the gate, the wizard's other gender, the friend's own
words in double braces in Spanish. `{mate}` is the dormitory mate, the wizard's own
gender, single braces. `{wizard}` is the wizard. **Dask** is a strict teacher, gruff
and brief, never cruel. The three together are *los tres*; when you write for two of
them, follow rules.md.

## The stories

### `after-dark`, *After dark* / *Después del anochecer*. Eight steps.

In the first-years' dormitory, at night: the wizard's bed, the mate's beside it, the
common room with the door to the corridor.

1. The voice. Deep night in the castle, the fire out, everyone asleep; a very soft knock
   at the common room's door. You sit up in bed.
2. {mate}, sitting up too, who has heard it.
3. The voice. The two of you tiptoe across the common room to the door, and you open it.
   (Who is behind it is not seen until the next step.)
4. {friend}, in the doorway: could not sleep; the old book they took out of the library
   this afternoon, looking for something about the passages; what was folded inside it,
   the naughty child's map, the whole castle floor by floor in numbered cells, drawn
   years ago by a pupil who slipped out at night, with a word in its corner, *orvim*,
   that makes it work. {friend} hands it over: take it, you read it while I watch the
   way.
5. {mate}: the older pupils say the passages change at night, and Dask patrols them so
   that no one is out of bed.
6. {friend}: that is why the map: it says where everything is. We look before every
   step. Are you coming?
7. {wizard}: not sure... all right, let's go. But if Dask sees us, straight back to bed.
8. The voice. The three of you slip out into the corridor; the stone is cold under your
   bare feet; {friend} goes first.

### `beyond-the-doors`, *Beyond the doors* / *Al otro lado de las puertas*. Five steps.

In the castle's long corridors, under an arch, just through the three doors of the
last level. There are no stairs in this chapter any more, and no slab here yet.

1. The voice. Through the three doors at last; the stones are older and darker here;
   ahead, a long corridor crosses yours.
2. {friend}, proud: the loop got us through all three doors in one go.
3. {mate}: listen, steps down there: Dask walks his round along that corridor, and he
   looks this way a long while.
4. {wizard}: how do we cross if we do not know how long he looks?
5. {friend}: we wait exactly as long as he looks: a program can do that.

### `the-voices`, *Voices in the wall* / *Voces en el muro*. Seven steps.

In the storeroom, lit at last by *kirra*, its door open; the three stand above the door
and walk over to a crack in its right wall.

1. The voice. The room lit at last; a crack in the right wall; voices beyond it. The
   three of you creep over to it and stay very still.
2. The voice. A cold voice that seems to come from the stone itself whispers, its words
   in italics: *tomorrow's flying lesson, the brooms in the shed, the words to say to
   each broom; after that, no one will make the boy fly for a long while*.
3. The voice. An older pupil's voice answers, afraid, its words in italics: *what if
   someone gets hurt?* And the cold voice: *a fright, no more; and a lesson for those
   who think the castle is theirs*. Then steps going away.
4. {mate}: that was a pupil, and the other voice was no pupil's: it came from the wall!
5. {friend}: someone is going to tamper with the brooms for tomorrow's lesson, and we
   cannot tell anyone without confessing we were out of bed.
6. {wizard}: then we stop it ourselves, tomorrow, before the lesson. But first, back to
   bed without Dask seeing us.
7. The voice. The way home: you walk back to the door and go down through it, down the
   corridor beyond, into the dark of the way down.

### `caught`, *Caught* / *Atrapados*. Seven steps.

In the corridor of the way down, before its last arch.

1. The voice. Almost there: the way down to the dormitory is just ahead.
2. The voice. Suddenly Dask steps out of the dark in front of you. Caught.
3. Dask: what are three first-years doing out of bed at this hour?
4. {mate}: we were only checking the slab that comes and goes, sir! To make sure it did
   not get lost in the dark! (Slab, *la losa*: there is no stair.)
5. The voice. Dask looks at the three of you for a long moment in silence. Then the
   smallest of smiles.
6. Dask: I have been watching you. You looked before every step, you waited, you lit the
   dark; very clever work. I shall let you go, just this once, {wizard}.
7. The voice. He walks away up the corridor, and the three of you go on through the arch.
   Safe under the blankets, you remember all you learned tonight: you counted the cells
   and asked where things are with `position`, used a question, an expression, to know
   whether it was safe, chose your way with `if` and `else`, and got through the dark
   with the loops `for` and `while` and the spells *kirra* and *osto*. Hugging the
   secret the three of you now share, you fall asleep at last, the castle feeling like
   home.
