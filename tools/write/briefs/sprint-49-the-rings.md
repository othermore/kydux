---
outputs:
  - content/levels/the-rings/text.es.json
  - content/levels/the-rings/text.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/levels/the-rings/text.*.json
  - content/levels/the-first-flight/text.*.json
  - content/lessons/an-action-of-your-own/*.md
---
Write again the `intro` of the level *Los aros* / *The rings* (chapter 4, Mejora 1), in
Spanish and in English: the words of its start card, said by Ilda, the flying teacher.
Answer with each language's whole `text.<lang>.json`, every other key exactly as it is
now, letter for letter, and only `intro` written again.

## Why

Before this level the child has crossed the lake in *El primer vuelo* (its outro is
given above), then read the lesson on making their own action with `def`. The card of
*Los aros* begins at once with the rule of the pairs of rings: nothing says that the
practice goes on, nor why rings. The owner of the game's words:

> En capitulo 4 mejora 1 empezamos directamente con la prueba de los aros sin haber
> dicho antes nada de que tras cruzar el lago toca otra prueba. Hay que empezar
> diciendo algo así como "¡Sigamos practicando! Los aros son una forma muy buena de
> aprender a controlar los giros...."

## What the intro says, in this order

1. That the practice goes on now that the lake is crossed, and why the rings, from the
   owner's words: *¡Sigamos practicando! Los aros son una forma muy buena de aprender
   a controlar los giros…*, kept or fitted, never dropped.
2. Then what it says now, in fewer words where the card needs it:
   - a pair's first ring is crossed from below upward and its second from above
     downward, and a ring crossed the other way does not count;
   - this is Ilda's program for the field;
   - it goes through three pairs of rings, round a group of trees by the top between
     the first two pairs, and over a pond between the last two;
   - its 19 lines are the four lines of a pair written three times;
   - a function for the pair, called in the three places, makes it much shorter.

The card must not grow taller: the new intro is no longer than the one now (about 600
characters in Spanish), or only a little.

## Rules

- No text says *manera* or *way* for the different arrangements a level is played in;
  in English, avoid *way* for them.
- *Función* / *function* as the lesson before says it; *llamar* / *call* for using it.
- No metaphor; nothing the child does not need yet.
- Spanish from Spain. Ilda speaks to the child as *tú*; where a word would need the
  wizard's gender, write it with braces, the boy's form first: `{mago|maga}`.
