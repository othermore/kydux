---
outputs:
  - content/sprint-46/texts.es.json
  - content/sprint-46/texts.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-46.md
  - content/levels/the-race/text.*.json
  - content/levels/the-rematch/text.*.json
  - i18n/es.json
  - i18n/en.json
---
Write the words Ilda says when a race is over, in chapter 4, *The broom*, and two small
texts that go with them (D234 in the plan, sprint 46, given above in full).

In *La carrera* and *La revancha* the child's wizard races Zarek through rings. Ilda,
the flying teacher, counts: a tick for each line of the program, the ticks of the
flight, and five ticks for each ring the wizard did not fly through. The lower count
wins; an equal count is a tie and the race is flown again. Both racers fly to the finish
and land; then a band at the foot of the scene, beside Ilda's portrait, says her
verdict, and the child reads it before the card comes. The card under it keeps the
whole sum (`race.count` in `i18n/`), so the verdict is short: what a child of eight
reads in four or five seconds.

Answer with two JSON objects, one a file: `texts.es.json` holds the Spanish,
`texts.en.json` the English of everything. Each is an object of the keys below to a
string. Use exactly these keys and no others. The placeholders in braces are filled by
the game: keep them exactly as written, and write each sentence so that it reads well
with any number in them, 0 and 1 too (so no noun that would need a plural beside a
placeholder: *Aros saltados: {missed}* reads well with any number, *{missed} aros* does
not).

## Ilda's verdict, spoken by her, in both files

- `race.judged_clean`: the wizard flew through every ring. Ilda says so, and the two
  counts. Placeholders: `{tick}`, the wizard's count; `{name}`, the racer's name
  (Zarek); `{racer_tick}`, his count. For instance, to be made better: *Has pasado por
  todos los aros. Tu cuenta: {tick} ticks. La de {name}: {racer_tick}.*
- `race.judged_missed`: the wizard missed some ring. Ilda says how many rings were
  missed, the ticks of penalty they add, and the two counts, the wizard's with its
  penalty in it. Placeholders: `{missed}`, `{penalty}`, `{tick}`, `{name}`,
  `{racer_tick}`.
- `race.judged_unfinished`: the wizard did not reach the finish, and the racer wins.
  Placeholder: `{name}`. One short sentence or two.
- `race.wins_wizard`: the sentence that follows either of the first two when the
  wizard's count is the lower: Ilda names the winner, glad. Placeholder: `{wizard}`,
  the child's wizard's name (as in *¡Lo has conseguido, {wizard}!*). Short.
- `race.wins_racer`: the same when the racer's count is the lower. Placeholder:
  `{name}`. Short, and kind: Ilda is fair, she does not scold.

A tie is said by `race.tie`, which exists: *¡Es un empate! La carrera se repite.* Do
not write it.

## The goal, in both files

- `goal.win`: the goal that both levels show in the goals box, in the place of *Cruza
  la meta antes que Zarek.* The race is won by Ilda's count and not by who crosses the
  line first, so the goal says to win the race against Zarek. One short sentence, an
  order to the child, as the other goals are (*Pasa por los ocho aros en orden*). The
  name Zarek is written out.

## The start card's clause, of which you write only the English

- `intro.clause`: on the start card of *La carrera* Ilda says the rules, in the owner's
  own words. Its clause for the rings is, in Spanish: *y por cada aro que te saltes,
  sumaré cinco turnos a tu cuenta al terminar la carrera*. Write its English, in
  `texts.en.json` only, to take the place of *and for every ring you skip, I will make
  you wait five turns before crossing the finish* in the English card given above: the
  same beginning, the same word *turns*, natural English for a child of eight.

## Rules

- The count is in *ticks*, the game's word, in the verdict: `race.judged_clean` and
  `race.judged_missed` say *ticks* once at least. Only the start card's clause says
  *turnos* / *turns*, since the owner's card does.
- Ilda speaks to the child: *tú* in Spanish, never *usted*; warm and brief.
- No text says *manera* or *way*; no metaphor; nothing the child does not need.
- Spanish from Spain. Write so that no word needs the wizard's gender, or give it as a
  choice in braces, the boy's form first (*{mago|maga}*).
- These texts need no code name.
