---
outputs:
  - content/sprint-43/texts.es.json
  - content/sprint-43/texts.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-43.md
  - content/stories/the-morning-after/text.*.json
  - content/stories/the-flying-lesson/text.*.json
  - content/stories/the-finish/text.*.json
  - content/levels/the-shed/text.*.json
  - content/levels/the-brooms-on-the-wall/text.*.json
  - content/levels/the-check/text.*.json
  - content/levels/the-brooms-in-the-straw/text.*.json
  - content/levels/the-first-flight/text.*.json
  - content/levels/the-rings/text.*.json
  - content/lessons/the-broom/*.md
  - content/lessons/lists/*.md
  - content/lessons/checking-each/*.md
  - content/lessons/less-or-greater/*.md
  - content/lessons/drevo/*.md
  - i18n/es.json
  - i18n/en.json
---
Write the texts of chapter 4, *The broom*, that sprint 43 changes, and the English twin
of every Spanish sentence the game's owner wrote for it. The plan, sprint 43, is given
above in full: its sections 2.3, 2.5, 2.6, 2.7, 2.8 and 2.9 say what each text must
say. Where this brief and the plan differ, this brief wins. The texts as they are now
are given for their voice and their shape; many of their facts are old.

Answer with two JSON objects, one a file: `texts.es.json` holds only the Spanish you
write; `texts.en.json` holds the English of everything, yours and the owner's. Each is
an object of the keys below to a string, or to a list of strings where the key says
`(list)`. Use exactly these keys and no others.

## What the owner asked, in their words

- On the shed's levels: *esta lección y el arreglo de la revisión son más sencillos que
  el programa anterior, y además se tienen que usar antes de usar un if dentro de un
  for. Así que tiene sentido moverlos más arriba.* And: *para hacer más progresivo todo
  esto, el nivel anterior lo vamos a dividir en dos. Primer subnivel: le diremos al niño
  que empezaremos por lo fácil, que use find nearest para encontrar la primera escoba y
  moverse hasta ella. Ahí no necesita el if dentro del for, solo los ifs, porque solo es
  una escoba. Segundo subnivel: luego diremos algo así como "¡Vale, ya lo tienes! pero
  intentemos hacerlo para todas las escobas que hay por el suelo, en lugar de ir una a
  una".*
- On *La revisión*: *se hace el nivel pero no están todas las escobas, sino solo las que
  originalmente había en la pared.*
- On the flying lesson: *Primero debería en modo historia verse a Ilda llegar al
  cobertizo con los otros niños, ella entra al cobertizo y los niños se quedan fuera, y
  ahí decir lo de los buenos días madrugadores, y pedir a todos que cojan cada uno una
  escoba y la sigan al campo de entrenamiento. Y luego ya se carga la vista del campo de
  entrenamiento.*
- On `drevo`: *si se lanza drevo mientras vuelas, deberías aterrizar (o fallar si
  aterrizas sobre una casilla no transitable y que termine el programa por fallo). Es
  como chocar (y debe sonar el mismo ruido) pero para el programa (te deja volando donde
  estabas, para que no te ahogues).* And on *El primer vuelo*: *el objetivo de esta
  partida debería ser "llegar a la piedra blanca" y no aterrizar, y el extra debería ser
  aterriza en la piedra blanca antes de que el programa termine.*

## The Spanish you write (in `texts.es.json`, and its English in `texts.en.json`)

- `check.outro`: *La revisión*'s won card. The wall's brooms are all untied now; it turns
  to the brooms still lying on the floor, which come next. The class is not heard
  coming: that comes at the end of the shed.
- `nearest.title`: the new level `the-nearest-broom`'s title, something like *La escoba
  más cercana*.
- `nearest.intro`: its card, said by the friend: the hung brooms are done and the rest
  lie on the floor, some under the straw; we start with the easy part, one broom, the
  nearest, found with `find_nearest`; it may lie on any side, so the program looks
  before it walks, comparing its `x` and `y` with the wizard's, as the lesson *Menor o
  mayor* showed, and then unties it. It names no cell and no number of steps.
- `nearest.hints` (list): three hints, each one step further than the one before, none
  writing a whole line of the solution: find the broom with `find_nearest` and keep it
  in a variable; compare its `x` with yours, a smaller `x` is to the left, and take the
  smaller from the greater for the steps; the same with `y`, a smaller `y` is higher up,
  then `untie()`.
- `nearest.outro`: its won card: one broom done, the walk to it worked out from its
  coordinates; it leads on to the next level without saying its first words.
- `nearest.learned`: *Ahora sabes…*: that `if` and `else` with `<` choose the side to
  walk to, and that the steps are the greater number less the smaller.
- `nearest.changes`: what may be different each time, in the child's eyes: the nearest
  broom lies in another place, on any side. Never the words *manera* or *way*.
- `nearest.changed`: what the card says first when this time is different, in the shape
  *Esta vez, …*, as the other levels' `changed` sentences.
- `straw.intro_rest`: what follows the owner's opening sentence of *Las escobas de la
  paja*'s card (given below, not to be written again): `find_all` gives them nearest
  first, each may lie on any side of where the wizard stands then, and the comments of
  the program lead the way, one for each instruction.
- `straw.hints` (list): three hints read against the comments of the starting code
  (below), each saying no more than the comments do, one step further: the loop goes
  over the list of `find_all`, and everything for one broom goes inside it; inside the
  loop the same two comparisons as in the level before; a hint on where `broom.untie()`
  goes, inside the loop and after both walks.
- `straw.outro`: its won card, which closes the shed: every broom safe, so that the
  story that follows can begin with *Habéis desatado hasta la última…*.
- `story.step2`: the flying lesson's step 2, said by Ilda, in the shed, the class outside
  on the path: good morning, early risers; everyone takes a broom each and follows her
  to the training field. In her voice, two or three sentences.
- `drevo.landing`: a new paragraph of the lesson *Drevo*, between the owner's two
  paragraphs given below: `drevo` cast again in the air sets the broom down where the
  wizard is, if the ground there can be stood on; over the water there is nowhere to
  land, and the program stops. Two or three sentences.
- `first_flight.hints` (list): *El primer vuelo*'s three hints, read against its new
  goals (reach the white stone; the extra, land on it with a cast before the program
  ends) and its starting code's three comments (walk to the jetty's end with
  `move_right`; cast the word that lifts the broom; fly to the stone with
  `move_right`). The jetty's end is 8 steps away and the stone 5 steps further. The
  third hint tells of the extra: casting *drevo* again on the stone lands there.
- `first_flight.outro`: its won card: the stone reached; it may say how fast the broom
  flew over the water. It does not take for granted that the wizard landed.
- `spells_drevo`: the notebook's line for the spell *drevo*, in the manner of the one it
  has now: it lifts the broom the wizard carries; from then on the moves fly, three
  times as fast, over the water, the hedges and the fences, not through the tree tops
  nor the walls; cast again in the air it sets the broom down, if the ground under it
  can be stood on; at the program's end the broom sets down by itself.
- `cast_drevo`: the last sentence of the notebook's line for `cast`, which tells of
  *drevo*: it lifts the broom, if the wizard carries it, and sets it down again when
  cast in the air: `wizard.cast("drevo")`.
- `flying`: the notebook's line for `flying`, as it is now but ending *hasta que
  aterriza*: true while the wizard flies on the broom, from the moment *drevo* lifts it
  until it lands.
- `error_no_landing`: the outcome's words when *drevo* is cast in the air over a cell
  nobody walks on, in the manner of `error.no_knot`: there is nowhere to set the broom
  down here, the program stops here, land where there is ground.
- `blocked_no_landing`: the wizard's own short words then, in the manner of
  `blocked.no_knot`.

## The owner's Spanish, of which you write only the English (in `texts.en.json`)

Write each in natural English for a child of eight, saying the same, under its key:

- `check.intro_owner`: *{mate} se ha dado cuenta de que algunas escobas todavía tienen un
  nudo encantado. Quizás tenían dos, o quizás se nos escaparon al intentar desatarlas,
  así que hay que repasarlas.*
- `check.changes`: *Las escobas de la pared y cuáles tienen todavía un nudo cambian cada
  vez.*
- `nearest.goal`: *Desata la escoba más cercana.* (the plan gives *Untie the nearest
  broom.*: use it).
- `straw.intro_owner`: *¡Vale, ya lo tienes! Pero intentemos hacerlo para todas las
  escobas que hay por el suelo, en lugar de ir una a una.*
- `nearest.starting_code` (list) and `straw.starting_code` (list): the comments of both
  starting codes, given in the plan's section 2.6, one string for each comment line in
  their order, each starting with `# `, the code's names (`find_nearest`, `find_all`,
  `move_left`, `broom.untie`) as they are.
- `story.step1`, `story.step3`, `story.step5`: the owner's words for the flying lesson's
  steps 1, 3 and 5, in the plan's section 2.7. `{friend}` stays as it is.
- `drevo.moves` and `drevo.end`: the owner's paragraphs of the lesson *Drevo* in the
  plan's section 2.3 (*Una vez estás sobre la escoba…* and *Al acabar el programa…*).
- `first_flight.intro` and `first_flight.learned`: the owner's card and *Ahora sabes* of
  *El primer vuelo*, in the plan's section 2.3; `{el mago|la maga}` is "the wizard".
- `the_broom.page1` and `the_broom.page2`: the owner's sentences for the lesson *La
  escoba y su nudo*, in the plan's section 2.8.
- `lists.opening`: *Tenemos que revisar todas las escobas, pero ¿cuántas son? Y ¿cómo
  las encontramos?*
- `less_or_greater.page3` (list): the owner's two paragraphs of the lesson *Menor o
  mayor*'s page 3, in the plan's section 2.8.

## Rules

- No text says *manera* or *way* for the different arrangements a level is played in.
- Nothing the child does not need yet; a metaphor only where an idea is first
  explained; `<` and `>` alone, never `<=`, `>=`, `!=` or `abs`.
- No cell to end on is asked, and no cell is named, unless it is the point.
- Spanish from Spain, with the wizard's gender always as a choice in braces, the boy's
  form first; the friend as `{friend}` and the mate as `{mate}`.
- Code names in backquotes, spells in italics, as the texts now write them.
