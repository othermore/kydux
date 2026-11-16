---
outputs:
  - content/sprint-45/texts.es.json
  - content/sprint-45/texts.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-45.md
  - content/levels/the-rings/text.*.json
  - i18n/es.json
  - i18n/en.json
---
Write the words of a new refusal in chapter 4, *The broom*, that sprint 45 adds: the
ring's rim (D226 in the plan, sprint 45, section 2.1, given above in full).

While the wizard flies inside a ring's cell, having flown into it from below or from
above, a move to the left or to the right rubs the ring's rim: the bump sounds, the ring
shakes, the wizard thinks a sentence, and the program stops at that line, the wizard
still in the air inside the ring, the ring not flown. A ring is left by its other side,
one step more upward or downward, before turning.

Answer with two JSON objects, one a file: `texts.es.json` holds only the Spanish you
write; `texts.en.json` holds the English of everything. Each is an object of the keys
below to a string. Use exactly these keys and no others.

## The owner's sentence, of which you write only the English

- `blocked.ring_rim`: the wizard's thought, in the owner's words: *Oh, giré demasiado
  pronto y rocé el aro.* Write its English, in `texts.en.json` only, in natural English
  for a child of eight, saying the same: the wizard turned too soon and grazed the ring.

## The text you write, in both files

- `error.ring_rim`: what the card says when the program stops so, the error's words. Two
  short sentences, as the card of `drevo` cast over the water does (`error.no_landing`:
  *Aquí no hay dónde posar la escoba, así que el programa se para aquí, todavía en el
  aire. Aterriza donde haya suelo.*): the first, that the broom turned while it was
  still inside the ring and rubbed its rim, so the program stops there, still in the
  air; the second, that a ring is left by its other side, one step more upward or
  downward, before turning.

## Rules

- No text says *manera* or *way* for the different arrangements a level is played in;
  in English, avoid *way* altogether.
- No metaphor; nothing the child does not need yet.
- What is untied is a knot, never a broom; *la paja* only where brooms lie.
- *Turno* nowhere: the game says *tick*, and these texts need neither.
- Spanish from Spain. The wizard is the one who turned: write it so that no word needs
  the wizard's gender, or give it as a choice in braces, the boy's form first.
- Code names in backquotes, as the texts now write them; these texts need none.
