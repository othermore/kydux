---
outputs:
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/story.md
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
  - content/stories/at-the-library/text.en.json
  - content/stories/at-the-library/text.es.json
---
Rewrite the story *the-wand-bank* of Kydux, in English and Spanish, so
that the wand bank's keeper is on the scene and lends the wands himself.
The story as it is now is given; keep every step that is not named below
word for word, in both languages.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a
time. Each step is said by one speaker: **the voice**, the narrator, whose
words show in a band under the scene (two to four sentences, speaking to
the child as "you": the child is the wizard), or **a character**, whose
words show in a speech bubble over their head (what they say aloud, one to
three sentences, no quotation marks and no "he says"). Each file is a JSON
object: `{"title": "...", "steps": ["...", ...]}`, with exactly nine steps,
in the order below.

## Who is who

- **Baro** is new: a pupil's father, who keeps the wand bank in the
  mornings. Kindly and unhurried, few words; he hands a wand over as if it
  mattered. The children do not know him yet, so the voice names him.
- The **dormitory mate**, of the wizard's own gender: write `{mate}`, and
  the mate's Spanish words in the wizard's single braces, as the story
  already does. The **friend** met at the gate: `{friend}`, Spanish words
  in double braces. The wizard's own Spanish words in single braces:
  `{joven mago|joven maga}`.

## The scene and the steps

The top aisle of the library, under the high shelves; at its right end
the wand bank, a wooden counter with a striped awning and a rack of wands.
Baro stands behind the counter from the start. Eldra holds the book the
wizard has just given her; {mate} and Wenna stand by.

1. voice. As now, word for word.
2. eldra. As now, word for word.
3. voice. Rewritten: at the end of the aisle, the wand bank, and behind
   its counter Baro, a pupil's father, who keeps it in the mornings. The
   voice says no more than that: the lending is the next step's.
4. baro. New: Baro greets the two first-years and lends each of them a
   school wand for the year, {mate} one and the wizard one, with a word on
   looking after it. One to three short sentences, kindly.
5. friend. As now step 4, word for word.
6. wizard. As now step 5, word for word.
7. mate. As now step 6, word for word.
8. wenna. As now step 7, word for word.
9. voice. As now step 8, word for word.
