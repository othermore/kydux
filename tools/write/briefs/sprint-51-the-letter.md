---
outputs:
  - content/stories/the-letter/text.en.json
  - content/sprint-51/letter.en.json
context:
  - docs/dev/story.md
  - content/stories/the-letter/text.*.json
  - content/stories/the-letter/story.json
  - content/stories/at-the-gate/text.en.json
---
Write the English of the game's opening, the story *La carta* / *The letter*, for its
first three steps, and the English of the words written on the letter of admission
that the child sees in its first picture. The Spanish of all of them is the owner's,
fixed, and given below: you write only their English.

The opening is the first thing a new player reads, before they make their wizard. It
is told by the voice, under the picture, and speaks to the child as *you*.

## What the owner asked

The owner of the game, reading the opening, asked for this (their words):

> En la carta, estaría guay si en la primera imagen se viese la imagen del castillo
> pero por delante tapando el castillo se viese la carta con el castillo dibujado a
> trazos/lineas (y debajo unas letras de admitido a la escuela de magia de Arvelia), y
> en la segunda imagen se viese el castillo, con la carta ya apartada para que se vea
> detrás el castillo "de verdad" (es también un dibujo, pero los normales que tenemos
> nosotros, no de lineas). El texto tendría que cambiar: Primero lo de "Hace unas
> semanas te llegó una carta [...]. Un enorme castillo salía dibujado en ella". Luego:
> Es este mismo castillo, el castillo de Arvelia, la escuela para magos y magas. Se
> alza [...], y al verlo sientes una gran emoción. Y el último sería: Desde que
> hiciste las maletas has recorrido un largo camino. Finalmente, tras pasar el pueblo
> al pié de la colina y la empinada subida al anochecer, has llegado.

And of the words on the letter:

> preferiría una letra como manuscrita y un poco más pequeña, y que diga "Por la
> presente, le informamos de su admisión en la escuela de magia de Arvelia. Deberá
> personarse en diez días para iniciar su formación..." Pueden ser varias lineas y
> salir cortadas por abajo, como si la carta estuviese doblada por la mitad

> la idea es que la carta se corte ahí como si continuase, así que no puedes poner los
> puntos suspensivos [...]. Puedes poner primero "Carta de Admisión" y debajo ya el
> texto

## What the child sees

1. **Step 1.** The painting of the castle of Arvelia on its hill above the lake at
   dusk, the village at its foot; and before the castle, covering it, the letter: a
   sheet of old parchment folded in half, the very same castle drawn on it in ink
   lines, a red wax seal in its corner, and handwritten under the drawing a heading
   and the letter's first lines, which run on to the fold, as if the letter went on
   behind it.
2. **Step 2.** The letter is lowered out of the picture, and the painted castle is
   there: the same castle, the real one.
3. **Step 3.** The path up to the castle's gate at dusk, and the wizard walking up it.

Steps 4 and 5 stay as they are, in both languages.

## The Spanish, fixed

The three steps, letter for letter:

1. Hace unas semanas te llegó una carta: la invitación para tu primer año en Arvelia,
   firmada por la directora, Orla. Un enorme castillo salía dibujado en ella.
2. Es este mismo castillo, el castillo de Arvelia, la escuela para magos y magas. Se
   alza en lo alto de una colina, sobre un lago profundo, y al verlo sientes una gran
   emoción.
3. Desde que hiciste las maletas has recorrido un largo camino. Finalmente, tras pasar
   el pueblo al pie de la colina y la empinada subida al anochecer, has llegado.

The letter's words: the heading *Carta de Admisión*, and under it *Por la presente, le
informamos de su admisión en la escuela de magia de Arvelia. Deberá personarse en diez
días para iniciar su formación* — with no full stop and no dots at the end: the
sentence runs on behind the fold.

## Rules

- Each English step says what its Spanish says, in the same order, with nothing added
  and nothing left out.
- Keep the opening's own English for what does not change: *the school for young
  wizards, boys and girls*; *the head of the school, Orla*; *the village at the foot of
  the hill*; *the steep climb at dusk*.
- Step 1 is told in the past. Steps 2 and 3 bring the reader to now, as the Spanish
  does: step 2 in the present (*it rises*, *you feel*), step 3 ending on the arrival
  (*you have arrived*).
- No word that marks the wizard as a boy or a girl.
- No step is longer than about 220 characters.
- The letter's words are the school's: formal, as an official letter of admission is,
  and read by a child of eight. The heading is a few words, with capitals as the
  Spanish has them. The lines under it end in the middle of the sentence, at the same
  place as the Spanish (*to begin your training* or as close to it as English
  allows), with no full stop and no dots. Nothing in them says *admitted* of a boy or
  of a girl.
- Answer with two JSON files: `content/stories/the-letter/text.en.json`, as it is now
  (`{"title": "The letter", "steps": [five strings]}`) with steps 1 to 3 written anew
  and steps 4 and 5 kept letter for letter; and `content/sprint-51/letter.en.json`,
  `{"letter_title": ..., "letter_words": ...}`.
