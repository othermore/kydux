---
outputs:
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/story.md
  - content/stories/up-to-the-castle/text.en.json
  - content/stories/up-to-the-castle/text.es.json
  - content/stories/the-first-night/text.en.json
  - content/stories/the-first-night/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
---
## What changes, and why

The game's owner tried the story *The wand bank*, which closes chapter 2,
and found that the friend had no reason to be there: the friend already
had two wands, their own and the spare one lent to the wizard at the
gate. Now the friend is in the library for a book, hears the wizard's
voice through the shelves, knows it, and comes out from behind them; the
wizard, glad, introduces the dormitory mate; and the wizard gives the
spare wand back. The friend and the mate meet here for the first time.

Write the story again, in English and in Spanish, as a JSON object
`{"title": "...", "steps": ["...", ...]}` with exactly **ten** steps, in
the order below. Steps 1 to 4, 9 and 10 are the ones now (steps 1 to 4,
8 and 9 of the story given), word for word in both languages; write
steps 5 to 8. The title stays.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a
time. Each step is said by one speaker: **the voice**, the narrator,
whose words show in a band under the scene (speaking to the child as
"you": the child is the wizard), or **a character**, whose words show in
a speech bubble over their head (what they say aloud, one to three
sentences, no quotation marks and no "he says").

## Who is who

- The wizard is the child, written `{wizard}` when named.
- **The friend**, `{friend}`, of the wizard's other gender, met the
  wizard at the gate on the first evening, taught chapter 1 and lent the
  wizard a spare wand. In Spanish the friend's own gendered words are in
  double braces, the boy's form first (`{{contento|contenta}}`).
- **The mate**, `{mate}`, of the wizard's own gender, shares the
  wizard's dormitory and came to the library with the wizard for a wand.
  In Spanish the mate's own gendered words take the wizard's single
  braces. The friend and the mate do not know each other yet.
- Wenna, the librarian, and Baro, who keeps the wand bank, are there
  too.

## The steps

1. The voice: as now.
2. Eldra: as now.
3. The voice: as now.
4. Baro: as now.
5. **The friend**, who has just come out from behind the high shelves,
   beside the wand bank's counter, facing the wizard: surprised and
   glad; came to the library for a book, heard the wizard's voice
   through the shelves and knew it at once. One to three sentences,
   warm.
6. **The wizard**, glad too, introduces the mate to the friend by name
   (`{mate}`), and the friend to the mate (`{friend}`), in a sentence
   or two: who each is to the wizard (the dormitory mate; the friend who
   taught the wizard at the gate).
7. **The mate** greets the friend, warmly, a little shy, one or two
   sentences; may say the wizard has told of the gate.
8. **The wizard**, who now has a school wand, gives the friend's spare
   wand back, with thanks for lending it. One or two sentences.
9. Wenna: as now (step 8 of the story given).
10. The voice: as now (step 9 of the story given).
