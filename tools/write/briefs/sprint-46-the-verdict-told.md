---
outputs:
  - content/sprint-46-told/texts.es.json
  - content/sprint-46-told/texts.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/waiting/*.md
  - content/levels/the-race/text.*.json
  - content/levels/the-rematch/text.*.json
---
Write what Ilda says when a race is over, in chapter 4, *The broom*, and mend one
sentence of the race's start card. The owner of the game has said how both go, and
their words are given below: keep to them.

In *La carrera* and *La revancha* the child's wizard races Zarek through rings. Ilda,
the flying teacher, judges. Each racer waits one tick for each line of its program
before taking off, then flies; the ticks until it crosses the finish are what it *took*
(*lo que ha tardado*). A ring the wizard did not fly through is a penalty of five ticks,
added afterwards. The lower number wins: for the wizard, what it took and its penalty;
for Zarek, who never misses a ring, what he took. The same number is a tie, and the race
is flown again. Both racers fly to the finish and land; nobody is stopped. Then Ilda
says her verdict to everybody at the finish, in one speech bubble with her portrait, at
the foot of the scene. The card that comes afterwards does not say the numbers again.

The whole game says *tick* for a step of the world's time, in Spanish and in English
(the lesson *Esperar*, given above, is where the child learns the word). No text of
yours says *turno* or *turn* for it.

Answer with two JSON objects, one a file: `texts.es.json` holds the Spanish,
`texts.en.json` the English. Each is an object of the keys below to a string. Use
exactly these keys and no others. The placeholders in braces are filled by the game:
keep them exactly as written.

## Ilda's verdict

The owner's words:

> Un bocadillo diciendo lo que ha tardado cada uno, luego si ha habido alguna
> penalización, dice «pero X ha tenido una penalización de 5 ticks y por tanto Y ha
> ganado». Y si no hay penalizaciones simplemente termina después de decir lo que ha
> tardado cada uno, diciendo «y por tanto X ha ganado».

Ilda announces it to everybody, so she names both racers: the child's wizard is
`{wizard}` and the other racer is `{name}` (Zarek). Written with the names, no word
needs the wizard's gender. The numbers: `{own}`, the ticks the wizard took; `{theirs}`,
the ticks the other racer took; `{penalty}`, the wizard's penalty in ticks, always 5 or
more. Each text is a short bubble a child of eight reads in a few seconds: one sentence
where the owner's words make one, two where there is a penalty.

Every text but the last begins the same way, with what each one took, for instance
*{wizard} ha tardado {own} ticks y {name} ha tardado {theirs}*. Then:

- `race.judged_wizard`: no penalty, and the wizard took fewer ticks. It ends *y por
  tanto {wizard} ha ganado* (or *ha ganado {wizard}*, whichever reads better).
- `race.judged_racer`: no penalty, and the other racer took fewer ticks. It ends the
  same way, with `{name}` the winner.
- `race.judged_tie`: no penalty, and both took the same. It ends saying that it is a tie
  and that the race is flown again (the game's words for it so far: *¡Es un empate! La
  carrera se repite.*).
- `race.judged_penalty_racer`: the wizard took fewer ticks, or the same, but with its
  penalty its number is the higher. After what each took: *Pero {wizard} ha tenido una
  penalización de {penalty} ticks, y por tanto ha ganado {name}.*
- `race.judged_penalty_wizard`: the wizard has a penalty and still wins, since what it
  took and the penalty together are less than what the other racer took. Ilda says the
  penalty and that even so `{wizard}` has won.
- `race.judged_penalty_tie`: the wizard took fewer ticks, and with its penalty both
  numbers are the same. Ilda says the penalty, that with it they are tied, and that the
  race is flown again.
- `race.judged_slower`: the wizard took more ticks than the other racer and has a
  penalty besides. *Pero* would not fit: Ilda says that the wizard has a penalty as
  well (*además*), and that `{name}` has won.
- `race.judged_unfinished`: the wizard did not cross the finish. No numbers: Ilda says
  so, and that therefore `{name}` has won. Placeholders: `{wizard}`, `{name}`.

Ilda is fair and warm; she does not scold, and she does not add praise or advice: the
card afterwards has the level's own words.

## The start card of *La carrera*

On the start card Ilda says the rules, in the owner's own words, given above in
`content/levels/the-race/text.es.json` as `intro`. The owner asks for two changes in it:

> En lugar de «haré que esperes 5 turnos», que diga que habrá una penalización de 5
> turnos. Y usemos ticks en todo en lugar de turnos.

- `intro`: the whole card. In `texts.es.json`, the owner's Spanish with those changes
  and no other: *te haré esperar un turno antes de salir* says *tick* for *turno*, and
  the clause about a ring skipped says that there will be a penalty of five ticks
  (*habrá una penalización de cinco ticks*), with nothing about waiting or about the
  finish. Every other word, comma and exclamation mark stays as it is, letter by
  letter. In `texts.en.json`, the present English card with the same two changes and
  no other.

## Rules

- *tick*, *ticks*, never *turno* or *turn*.
- Spanish from Spain. No *usted*.
- No text says *manera* or *way*; no metaphor; nothing the child does not need.
- These texts need no code name.
