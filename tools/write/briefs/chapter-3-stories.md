---
outputs:
  - content/stories/after-dark/text.en.json
  - content/stories/after-dark/text.es.json
  - content/stories/the-top-of-the-stairs/text.en.json
  - content/stories/the-top-of-the-stairs/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/stories/the-wand-bank/text.en.json
---
Write the three stories of chapter 3 of Kydux, *The passages*: the one
that opens it at night, at the dormitory's door; the one at the top of
the long stairs, halfway through; and the one that closes it, when Dask
catches the two friends. English and Spanish. Two earlier stories are
given, so that you know how the game's stories sound and where the story
stands.

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
  to three sentences. No quotation marks and no "he says": the bubble
  shows who speaks.

Before a step's words, something may happen on the scene: a character
walks, turns, appears or goes. The words go with it and never contradict
it. Let the characters sound like themselves (story.md) and talk to each
other, not only explain. At night the friend whispers; the tone stays warm and
funny, never scary: Dask is strict but fair.

Each file is a JSON object: `{"title": "...", "steps": ["...", ...]}`,
with exactly as many steps as the story's list below, in that order.

## What the child knows by now

- Before **after-dark**: chapters 1 and 2: programs and instructions,
  objects and methods, comments, arguments, strings and `say`,
  `pick_up`, spells cast with the wand (`zelim`, `fendra`); variables,
  attributes and `print`, methods that give something back
  (`find_nearest`), `give`, doors and keys (`door.open()`). The wizard
  has a school wand now and gave the friend's spare back. This story teaches
  nothing; the next lesson, the friend's, is about questions that are true or
  false.
- Before **the-top-of-the-stairs**: also questions that are true or false,
  which programmers call expressions; choosing with `if` and `else`, a
  condition; and repeating with `for`, a loop, which climbed the long
  stairs. The next lesson is `while`: repeating as long as something
  stays true.
- Before **caught**: also `while`, and the spells *kirra*, which lights
  the room you are in, and *osto*, which holds a moving stair still.

## after-dark: a knock at the door

The scene: a stone passage at night, at the door of the dormitory. The
wizard stands just outside it; the friend comes.

1. voice. (The wizard turns to the door.) Night in the castle; you cannot
   sleep; a soft knock.
2. friend. (The friend appears at the door.) the friend, in a whisper: are you awake,
   `{wizard}`?
3. wizard. The wizard whispers back: yes; what is it?
4. friend. The older pupils say the passages change at night, and that
   Dask, a strict teacher, patrols them so that no one is out of bed.
   The friend wants to go and see.
5. wizard. The wizard hesitates, then is tempted, or asks what happens if
   Dask sees them.
6. friend. The friend has a plan: they will look before every step, and the friend
   will show the wizard how to ask the castle questions whose answer is
   true or false.
7. voice. Together you tiptoe into the passage towards the watchtower's
   gallery; ahead, by the wall, a tall shadow: Dask.

Title: *After dark* / *Después del anochecer*.

## the-top-of-the-stairs: the night passages

The scene: the top of the long stairs, where the night passages begin.

1. voice. (The wizard looks up the passage.) The top of the long stairs:
   older, darker stones; the night passages begin here.
2. friend. (The friend comes up the last step beside the wizard.) the friend, out of
   breath and pleased: the loop got them up the stairs.
3. voice. Ahead, a stair floats in the air, comes and goes; somewhere
   below, footsteps: Dask again.
4. wizard. The wizard whispers a worry: how do they get past when they
   do not know how long Dask will look their way?
5. friend. The friend has an idea: they will wait as long as he looks, and the friend
   will show the wizard how a program can do that.

Title: *The top of the stairs* / *Lo alto de las escaleras*.

## caught: almost at the dormitory

The scene: the end of the night passages, where the way goes down to the
dormitory. The wizard and the friend stand together; Dask steps out of the
dark in front of them.

1. voice. Almost there: the way down to the dormitory is just ahead.
2. voice. (Dask appears in front of them.) Dask steps out of the dark.
   You are caught.
3. dask. Dask, stern: what are two first-year pupils doing out of bed?
4. friend. The friend tries to explain, and makes it a little worse, in a funny
   way.
5. voice. (The wizard turns to Dask.) Dask looks at you both for a long
   moment; then, the smallest smile.
6. dask. He watched them: they looked before they stepped, they waited,
   they lit the dark; clever work. He lets them go, just this once,
   `{wizard}`.
7. voice. A look back at the night, warmly and in a natural way, not as a
   list: the ideas of chapter 3, each with its programmer's word; and the
   feeling of belonging to the castle at last, falling asleep.

Dask speaks to the two of them, a boy and a girl: in Spanish, his plural
words for them are masculine (*astutos*), as the rules say for the pair.
Title: *Caught* / *Atrapados* in Spanish.
