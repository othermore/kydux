---
outputs:
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
context:
  - docs/dev/story.md
  - content/stories/the-entrance/text.en.json
  - content/stories/the-entrance/text.es.json
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/stories/the-morning/text.en.json
  - content/stories/the-morning/text.es.json
---
Rewrite the story *the-first-night* of Kydux, and the intro of the level
*your-bed* that follows it, in English and Spanish, so that the child sees
both friends go to bed before the wizard. The story and the level as they
are now are given; keep every step and every text that is not named below
word for word, in both languages.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a
time. Each step is said by one speaker: **the voice**, the narrator, whose
words show in a band under the scene (two to four sentences, speaking to
the child as "you": the child is the wizard), or **a character**, whose
words show in a speech bubble over their head (what they say aloud, one to
three sentences, no quotation marks and no "she says"). Something may
happen on the scene as a step begins: a character walks, lies down in a
bed, or goes. The story file is a JSON object: `{"title": "...", "steps":
["...", ...]}`, with exactly nine steps, in the order below.

## Who is who

There are three first-years and no others: the wizard; the **friend** met
at the gate, of the wizard's other gender, who sleeps in the other
dormitory (write `{friend}`, and the friend's Spanish words in double
braces, `{{cansado|cansada}}`); and the **dormitory mate**, of the
wizard's own gender, who shares the wizard's dormitory (write `{mate}`,
and the mate's Spanish words in the wizard's single braces). The wizard's
own Spanish words are in single braces: `{solo|sola}`. No other pupil is
in either dormitory, and no text speaks of other pupils.

## The scene

The common room at night: a fire in the fireplace, two armchairs, a round
rug and a round table, an arch on the left into the other dormitory and an
arch on the right into the wizard's dormitory, four beds in each, every one
of them empty tonight but the friends'. The wizard, the friend and Ilda
stand in the doorway at the bottom; the mate, who came up a little
earlier, waits by the right arch.

## The steps of *the-first-night*

1. voice. As now, word for word.
2. ilda. As now, word for word.
3. ilda, who then goes. Rewritten: she says good night to the three of
   them and that she will see them in the morning. One or two sentences.
4. friend, walking towards the left arch. As now, word for word.
5. voice, as the friend walks through the left arch. As now, word for word.
6. mate, as the friend lies down in a bed in the other dormitory. New: the
   mate greets the wizard by name, says they share the dormitory, and that
   the free bed is the one right beside the mate's. Two or three short
   sentences, cheerful and sleepy.
7. voice, as the mate walks through the right arch. New: one short
   sentence, the mate going into your dormitory.
8. voice, as the mate walks to the first bed, by the window. New: one
   short sentence.
9. voice, as the mate lies down. Rewritten from the last step: the mate
   gets into bed under the sheet and falls asleep; you are alone in the
   common room and very tired, and your own bed waits beside the mate's,
   through the arch on the right. Two or three sentences.

## The level *your-bed*

Its file is the JSON object it is now; keep every field word for word but
`intro`. The intro is said by the mate, in a card before the level, the
mate already in bed: rewritten so that it follows step 9 and does not
greet the wizard again (they met in step 6): the mate, half asleep, tells
the wizard to come in and take the free bed beside the mate's. One or two
sentences, warm. Keep the goals, the hints, the starting code, the outro
and the sentence of what was learned as they are.
