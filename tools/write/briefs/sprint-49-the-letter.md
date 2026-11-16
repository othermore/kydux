---
outputs:
  - content/stories/the-letter/text.es.json
  - content/stories/the-letter/text.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/stories/the-letter/text.*.json
  - content/stories/the-letter/story.json
  - content/stories/at-the-gate/text.*.json
---
Write again the five steps of the game's opening, the story *La carta* / *The letter*,
in Spanish and in English. It is the first thing a new player reads, before they make
their wizard, and it is told by the voice, under the picture.

## What changes, and why

The owner of the game saw that the opening shows a painting of the castle first, but
only for a moment, while the scene loads. They want the child to see it and read
about it. Their words:

> Acabo de ver que al empezar la historia se muestra una imagen del castillo junto al
> lago. Hasta ahora no la había visto porque el nivel carga enseguida. Hay que dejar
> esa imagen ahí al menos unos segundos para que se vea.... Quizás con un texto propio
> que sea "Este es el castillo de Arvelia, la escuela para magos y magas...".

So the game now tells the first two steps over the painting, and the scene (the path
up to the gate, at dusk) comes in at the third step. The steps are now told in the
order of time: the castle, the letter, the journey, the gate, the question.

## The painting

The painting shown under steps 1 and 2: the castle of Arvelia, of warm golden stone,
with many towers and pointed slate roofs and lit windows, high on a green hill. Beside
the hill lies a wide, deep lake with low mountains behind it, under a dusk sky that
goes from orange to purple, with the first stars. At the foot of the hill, by the
lake, is a small village whose chimneys smoke; a stone bridge crosses a stream, and a
winding path climbs the hill to the castle's door. In front, a wooden signpost and a
fence.

## The five steps, each one string

1. **Over the painting.** This is the castle of Arvelia, the school for young wizards,
   boys and girls. Start from the owner's words, *Este es el castillo de Arvelia, la
   escuela para magos y magas…*, keeping them or fitting them; then say, as the
   painting shows it, that it is old and stands on its hill above a deep lake. One or
   two sentences.
2. **Over the painting.** Some weeks ago a letter came to you: the invitation to your
   first year at Arvelia, signed by the head of the school, Orla. This very drawing
   came with it, and your heart leaped. (The child is looking at the drawing as they
   read this.)
3. **On the scene, the wizard walking up the path.** Then the journey: packing your
   bags, the long road, the village at the foot of the hill, the steep climb at dusk
   that brought you here.
4. **On the scene.** Now you stand before the great iron gate: shut, with no handle
   and no bell, and you do not know how to get in. But it is very quiet, almost as if
   it were listening.
5. Before the story goes on, one question: who are you?

Steps 3, 4 and 5 may stay close to what they say now (given above, in both languages):
change what the new order needs, and nothing else. Step 1 no longer opens with the
gate: the gate comes in step 4.

## Rules

- No step is longer than the longest step is now (the Spanish step 2, about 230
  characters; its English, about 220).
- The voice speaks to the child as *tú* / *you*, as it does now.
- Spanish from Spain. *Magos y magas* is the owner's: keep it in step 1. Where a word
  would need the wizard's gender, write it with no such word, as the steps do now.
- No metaphor; nothing the child does not need yet; no word of programming.
- Answer with two JSON files, each `{"title": ..., "steps": [five strings]}`, the
  title kept as it is: *La carta*, *The letter*.
