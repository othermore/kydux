---
outputs:
  - content/sprint-44/texts.es.json
  - content/sprint-44/texts.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-44.md
  - content/stories/the-flying-lesson/text.*.json
  - content/stories/the-finish/text.*.json
  - content/levels/the-brooms-on-the-wall/text.*.json
  - content/levels/the-check/text.*.json
  - content/levels/the-nearest-broom/text.*.json
  - content/levels/the-brooms-in-the-straw/text.*.json
  - content/levels/the-first-flight/text.*.json
  - content/levels/the-rings/text.*.json
  - content/levels/the-race/text.*.json
  - content/levels/the-rematch/text.*.json
  - content/lessons/checking-each/*.md
  - content/lessons/an-action-of-your-own/*.md
  - content/lessons/arguments-of-your-own/*.md
  - i18n/es.json
  - i18n/en.json
---
Write the texts of chapter 4, *The broom*, that sprint 44 changes, and the English twin of
every Spanish sentence the game's owner wrote for it. The plan, sprint 44, is given above
in full: its sections 2.1, 2.2 and 2.4 to 2.7 say what each text must say, and its
section 1 the decisions (D219 to D224). Where this brief and the plan differ, this brief
wins. The texts as they are now are given for their voice and their shape; many of their
facts are old.

Answer with two JSON objects, one a file: `texts.es.json` holds only the Spanish you
write; `texts.en.json` holds the English of everything, yours and the owner's. Each is an
object of the keys below to a string, or to a list of strings where the key says
`(list)`. Use exactly these keys and no others.

## What the owner asked, in their words

- *Lo que se desata es el nudo, no la escoba* (D224): a text never unties a broom; it
  unties or takes off its knot, or its thread. `untie` stays the method's name, and *la
  paja* only names the straw the brooms lie in, on or under: no sentence ends, does,
  finishes or makes *la paja* (*hay que tener cuidado con la paja*).
- *Los pares de aros siempre se pasan el primero desde abajo hacia arriba y el segundo
  desde arriba hacia abajo* (D219): it is a rule of broom races.
- On lesson 7: *aquí no tiene sentido poner como ejemplo two_rings porque todavía ni
  siquiera hemos enseñado los anillos del siguiente nivel. Hagamos el ejemplo con una
  función que el niño pueda entender, como def quick_fly() que despegue, dé una vuelta y
  aterrice.*
- On the race: two lanes, each racer through rings of their own; a tie is flown again.

## The sentences about knots (D224), in `texts.es.json` and their English

Each key is a sentence of today's texts that unties a broom. Write it again with the
least change that unties or takes off the knot instead, keeping everything else of it:

- `knots.checking_each`: the lesson *checking-each*, page 1: *Desatar una escoba sin nudo
  es un error que detiene el programa, ¡así que nuestro programa debe mirar `knotted`
  antes de desatar!*
- `knots.wall_intro`: *Las escobas de la pared*, its card: *Tenemos que caminar junto a
  la pared y desatar cada una.*
- `knots.wall_learned`: its *Ahora sabes*: *Ahora sabes que un bucle `for` te deja
  desatar cada escoba, y que `distance_to` te dice cuántos pasos caminar hasta la
  siguiente.*
- `knots.wall_comment`: the last comment of its starting code, inside the loop: *#     y
  desátala.* (keep the `#` and the five spaces after it).
- `knots.check_hints` (list): *La revisión*'s three hints, as they are now, with only
  their words about untying changed.
- `knots.check_intro`: *La revisión*'s card. It is the owner's: change only its words
  about untying, the least that makes them true: *al intentar desatarlas* becomes *al
  intentar quitárselos*, *para ir una por una desatando el nudo* stays, and *porque
  desatar una escoba sin nudo es un error* says the same of the knot.
- `knots.check_outro`: *La revisión*'s won card, *¡Todas las escobas de la pared están
  desatadas! Ahora tenemos que ocuparnos de las que están tiradas por la paja, que son
  las siguientes.*: the wall's knots are off; the brooms lying in the straw come next.
- `knots.nearest_intro`: *La escoba más cercana*'s card, as it is, with *y luego
  desatarla* said of the knot.
- `knots.error_no_knot`: the outcome's words *Esta escoba no tiene nudo, así que no hay
  nada que desatar, y el programa se para aquí. Antes de desatar una escoba, mira si tiene
  nudo.*, its last sentence said of the knot.
- `knots.blocked_too_far`: the wizard's thought *Para desatar {thing} tengo que estar de
  pie sobre ella.*, said of the knot of `{thing}` (`{thing}` is the broom's word, *la
  escoba*).

## The other texts you write, in `texts.es.json` and their English

- `lesson7.page1`: lesson 7, *Una acción propia*, page 1, whole, its heading line first
  (`# Una acción propia`). It explains `def` with the owner's example, written as a block
  of code that is shown and not run (a fence of ```` ```python ````, not ```` ```python try
  ````): the function `quick_fly()` that casts *drevo*, flies right 2, up 2, left 2 and down
  2, casts *drevo* again to land, and the call `quick_fly()` under it. The lines inside are
  run where the name is written with brackets, as often as it is written; they are not run
  where the `def` is. No ring is named.
- `lesson7.page2`: page 2, *Mejor que un bucle*, whole, its heading line first (`## Mejor
  que un bucle`): what a loop does and what a function does, and what a name does for the
  reader, with the same example: one line that says *vuelo rápido* where six lines
  stood. Its block `saludar` to try stays as it is now, word for word.
- `rings.goal`: *Los aros*' first goal, the six rings in order and the rule of the pair,
  in the sense *Pasa por los seis aros en orden: en cada pareja, el primero hacia arriba y
  el segundo hacia abajo.*
- `rings.intro`: *Los aros*' card, said by Ilda. First the rule, as the rule of broom
  races: the first ring of a pair is flown through from below upward, the second from
  above downward, and a ring flown the other way does not count. Then the field: three
  pairs of rings; between the first pair and the second the trees are gone round by
  above, between the second and the third the pond is flown over. Then her program: it
  has 19 lines, the four lines of a pair written three times; with a function for the
  pair, called in the three places, it is much shorter.
- `rings.hints` (list): three hints, one step further each: the four lines that go
  through a pair are *arriba, derecha, abajo y derecha*; give them a name with `def`;
  call it in the three places, in place of the lines it holds.
- `race.goal` and `rematch.goal`: the first goal of *La carrera* and of *La revancha*,
  the eight rings in order with the rule of the pair, as `rings.goal` says it.
- `race.hints` (list): three hints for *La carrera*: its function is
  `two_rings(to_second, to_next)`, up 2, right `to_second`, down 2, right `to_next`; its
  rings in four pairs at different distances; the hints lead to the function with two
  arguments and to counting the cells for each call, without writing a whole line.
- `race.comments` (list): the starting code of *La carrera*, as comments only, one for
  each instruction of its solution (D218): define the function of a pair with two
  arguments; inside it, its four moves; cast the word; the first move right to the first
  ring; then the four calls. A comment that belongs inside the function's body begins
  with four spaces. Each comment is one `#` line; it names the function to use.
- `race.learned`: *La carrera*'s *Ahora sabes*: a function's arguments let one function
  serve for pairs at different distances, and a short program leaves sooner.
- `rematch.comment`: the comment that opens *La revancha*'s starting code, over the
  race's program given whole: this is the program that won the race, and Zarek has moved
  the rings.
- `rematch.hints` (list): two hints, the second and the third of *La revancha* (the first,
  *Fíjate bien en los aros. ¡Ya no están en el mismo sitio!*, stays): only the numbers
  change; count the cells from ring to ring for each call, and the first move to the first
  ring. No hint says that a line more loses.
- `rematch.outro`: *La revancha*'s won card, short; it does not say *por un solo tick*.
- `blocked.ring`: the wizard's thought when it flies into a ring from its side: rings are
  flown through from below or from above.
- `blocked.ring_way.up` and `blocked.ring_way.down`: the wizard's thought when it flies
  through a ring against its way: this ring is flown upward (from below) / downward (from
  above), so it does not count.
- `race.tie`: what the card says under Ilda's count when both cross at the same tick: it
  is a tie, and the race is flown again.
- `notebook.def` and `notebook.def_arguments`: the notebook's lines for `def` and for a
  function's arguments, as they are now, with `quick_fly()` as the example of `def` and
  `two_rings(2, 4)` as the example of arguments.
- `bible.team`: one or two sentences, in English only, for the story bible: Arvelia has a
  broom racing team; the wizard joins it after winning the race on the first day, and so
  keeps the broom.

## The owner's Spanish, of which you write only the English (in `texts.en.json`)

Write each in natural English for a child of eight, saying the same, under its key:

- `straw.outro`: *Ya hemos terminado, ¡todas las escobas están a salvo!*
- `flying.step1_opening`: *Habéis quitado los nudos encantados de las escobas cuando se
  oyen voces en el campo:*
- `nearest.goal`: *Quita el nudo de la escoba más cercana.*
- `comments.header` (list): *# Para que sea un poco más fácil, he escrito comentarios y
  te he dejado huecos para que, debajo de cada comentario, escribas el código que hace lo
  que dice el comentario.* and *# ¡Incluso te he dejado los espacios para que sepas lo
  que va dentro de los if!*
- `comments.header_for`: the second line as *Las escobas de la paja* has it: *# ¡Incluso
  te he dejado los espacios para que sepas lo que va dentro de los for y los if!*
- `comments.lines` (list): the comments of the plan's section 2.2, one for each row of
  its table in the column *Asked* (*as it is* is the column *Today*), in that order, each a
  `#` line, the code's names as they are.
- `race.intro`: the owner's card of *La carrera*, in the plan's section 2.6.
- `race.outro`: *¡Has ganado! A veces, es mejor tener un programa corto, y en la pista de
  carreras cada tick cuenta.*
- `rematch.intro`: the owner's card of *La revancha*, in the plan's section 2.6.
- `finish.step1`: *Cruzas la meta y te posas, y un momento después aterriza Zarek, por
  segunda vez. Tus compañeros aplauden, e Ilda sonríe.*
- `finish.step3_end`: *{wizard}, hace muchos años que no veía a un alumno de primer curso
  completar estas carreras en su primer día, ¡y menos aún ganarlas! Puedes quedarte la
  escoba, la necesitarás para entrenar como nuevo miembro del equipo de carreras de escoba
  de Arvelia.*
- `finish.step5`: *Es él, el que oímos por la grieta. No sé cómo se llama. Pero ahora
  estoy más seguro que nunca: la otra voz no era de ningún alumno.*

## Rules

- No text says *manera* or *way* for the different arrangements a level is played in.
- Nothing the child does not need yet; a metaphor only where an idea is first
  explained; `<` and `>` alone.
- D224: no broom is untied, only its knot; *la paja* only where brooms lie.
- *Turno* nowhere but in the owner's card of *La carrera*: the game says *tick*.
- No cell to end on is asked, and no cell is named, unless it is the point.
- Spanish from Spain, with the wizard's gender always as a choice in braces, the boy's
  form first; the friend as `{friend}` and the mate as `{mate}`.
- Code names in backquotes, spells in italics, as the texts now write them.
