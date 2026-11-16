# Sprint 46 — The race judged at its end

On 2026-11-14, after the review of sprint 45, the owner asked for the
race's penalty to be told another way, in their words:

> Y la penalización por un aro fallado no debería darse parando la
> llegada a la meta, sino que al terminar la carrera ilda debería
> anunciar las penalizaciones y el ganador final.

And, asked what Ilda says before the race and how she announces it:

> si puedes añadir esas dos cosas y resolverlas tu mismo o hacer un
> mini sprint y luego ya reviso todo, mejor, así ya reviso solo una
> vez.

The designer builds this sprint, since the owner asks for one review
of everything; nobody else reviews it before the owner does.

## 1. What the owner's words change

Until this sprint a wizard that had missed a ring was held in the air
before the finish line, circling five ticks a ring, while the racer
flew on (D189). The child saw the wizard stopped a cell from the line
and nothing said why. The owner wants the race flown to its end by
both, and the penalties and the winner said by Ilda once it is over.

Reading the game for it showed three more things:

- **Ilda's band has never been seen.** The band that says Ilda reading
  the programs (*Ilda lee los programas: tú, 11 líneas; Zarek, 18*,
  D189) is an element with no style, laid after the scene's canvas and
  outside what its frame shows. The browser test read only its words.
- **A winner Ilda names must be the level's.** The race levels ask for
  the eight rings in order as a goal that is needed, so a program that
  skips a pair and still has the lower count (*La carrera*'s
  `a_pair_skipped`: 11 lines, 39 of flight, 10 of penalty, 60 against
  61) would hear Ilda name it the winner and then lose the level. The
  owner's rule on the start card is a penalty, as a long program's is,
  and not a race lost: *por cada aro que te saltes*.
- **A bonus goal that fails loses the level.** `World.won()` asks that
  no goal has failed, bonus or not, so a bump in *Tu cama* or *El
  paseo nocturno*, whose bonus is `no_bumps`, loses a level whose
  needed goals are all met, against what a bonus is (`goals.py`: *a
  bonus goal is not needed to win*).

## 2. Decisions

- **D233 — A bonus goal that fails loses its star and not the level.**
  `World.won()` looks only at the goals that are needed, for those met
  and for those failed. A bump in *Tu cama* or *El paseo nocturno*
  fails their bonus and the level is still won.
- **D234 — The race is judged at its end.** Both racers cross the
  finish and land at their lines and their flight; nobody circles, and
  the event `circle` is gone. A ring the wizard has not flown through
  when it crosses the finish adds five ticks to Ilda's count, which
  stays lines + flight + penalty. The goal `before` is met at the
  run's end, when that count is lower than the racer's tick; an equal
  count is a tie, nobody's (D220). At the run's end the world notes
  the event `judged`, and the band says Ilda's verdict over the
  scene's foot, beside her portrait: the rings missed and their
  penalty, both counts, the winner. The card waits until it is read
  (D175) and keeps the count in full. The rings in order are the two
  race levels' bonus, so that the winner Ilda names wins the level,
  with a star less for a ring missed.

## 3. Pieces

### 3.1 A bonus goal that fails does not lose the level

`World.won()` looks only at the goals that are needed, for those met
and for those failed. A test: a level with `no_bumps` as its bonus is
won by a run that bumps, the bonus failed.

### 3.2 The world: the count at the end

- `Wizard._move` flies into the finish as into any cell; `_k_moved`
  sets `crossed_at` and `penalty` (five a ring missed then).
- `BeforeGoal`: met at the run's end by `crossed_at + penalty` lower
  than the racer's tick; failed at the racer's tick while the wizard
  has not crossed, and at the run's end by a count not lower. Its
  params: `flight` is `crossed_at - lines`, `tick` the count.
- `World.finish()`: after the race is flown out, a run that came to
  its end is judged in a tick of its own, the event `judged` (the
  wizard's, with no line): `lines`, `flight`, `missed`
  (a number), `penalty`, `tick`, `racer_lines`, `racer_tick`,
  `winner` (`wizard`, the racer's id, or null for a tie); `flight` and
  `tick` null for a wizard that did not cross, the racer the winner.
- *La carrera* and *La revancha*: the needed goal first, the rings
  in order a bonus. Their wrong answers `a_pair_skipped` and
  `a_pair_missed` win with a pair skipped; each is replaced by one
  that skips two pairs and loses by the count.

### 3.3 The page: the band seen, Ilda's verdict

- `.race-band` over the scene's foot, clear of the zoom's
  buttons: parchment as the goals box, Ilda's small portrait and the
  words. A browser test asks that it lies inside the scene's frame.
- At the tick of `judged` the band says the verdict, its last
  sentence in bold; `data-race-verdict` carries it. `settle()` waits
  the verdict's reading time too.
- *La carrera* has two bonus goals: the card's third star asks for
  both and its reason says so (`stars.bonuses`, a label).
- `circle` leaves the scene, `flownTick`, the tests and the comments.

### 3.4 Texts

Gemini writes Ilda's verdict (the i18n keys under `race`) and the
goal that replaces *Cruza la meta antes que Zarek*, from the brief
`sprint-46-the-race-judged.md`. The start card of *La carrera* is the
owner's own text: only the clause of the ring's penalty changes, the
least it can, written by the designer, and Gemini writes its English.
`race.count` says both sums in ticks (*= 60 ticks*), since a count
with a penalty is no tick of the run.

### 3.5 Documents and checks

D233 and D234 in `architecture.md`, D189 and the events' table in the present,
`course.md`'s rows of the two levels, `plan.md`. `ci/check.sh` and the
browser specs touched after each piece; `ci/check.sh --e2e` whole,
once, at the end. Chapter 4's walkthrough made again.

## 4. The owner's answer: one word for a tick, and a verdict told

The same day, with pieces 3.1 to 3.5 built, the owner answered what the
designer had asked before them, the card's words and how Ilda announces:

> 1. En lugar de haré que esperes 5 turnos, que diga que habrá una
> penalización de 5 turnos. Y usemos turnos en todo en lugar de ticks, o
> ticks en Todo en lugar de turnos. Mira todos los capítulos a ver qué
> término es el que estamos usando, y arregla el texto pasándolo por
> gemini.
>
> 2. Si, un bocadillo diciendo lo que ha tardado cada uno, luego si ha
> habido alguna penalización, dice pero X ha tenido una penalización de 5
> ticks/turnos y por tanto Y ha ganado. Y si no hay penalizaciones
> simplemente termina después de decir lo que ha tardado cada uno,
> diciendo "y por tanto X ha ganado".
>
> Luego la tarjeta de final no hace falta que repita las puntuaciones

### 4.1 Ticks everywhere

Every chapter says *tick*: the lessons *Esperar*, *Mientras*, *El
portal* and *Kirra y Osto*, the level *La salida del túnel*, the
descriptions of `wait` and the race's own closing words. *Turno* stood
only on the start card of *La carrera*, twice, and *turn* on its English.
The card says *un tick* a line and *una penalización de cinco ticks* a
ring skipped; nothing else of the owner's card changes.

### 4.2 The verdict, in the owner's order

Ilda's band says one bubble: the ticks each one took to cross the finish
(the wizard's lines and flight, without the penalty), then the penalty and
who has won with it, or with no penalty the winner at once. She speaks to
everybody, by the racers' names, as the owner's words do. The cases the
owner's two sentences do not name follow them as closely as they can: a
tie (with or without a penalty) says that the race is flown again; a
wizard that wins in spite of its penalty hears the penalty and *aun así*;
a wizard slower even before its penalty hears *además*, since *pero* would
not be true; a wizard that did not cross the finish hears that, with no
numbers. `raceVerdict` returns the one string; the band holds a single
paragraph, no part of it in bold.

Ilda stands at the start, twenty-seven cells from the finish and outside
what the camera shows at the race's end, so the bubble is her band at the
scene's foot, with her portrait, and no bubble over her figure.

### 4.3 The cards say no numbers

`raceCount`, `#card-race`, `#outcome-race`, the wide layout of the race's
won card and the keys `race.count`, `race.count_unfinished`, `race.tie`,
`race.judged_clean`, `race.judged_missed`, `race.wins_wizard` and
`race.wins_racer` leave. The goal's `params` keep the count.

### 4.4 Texts

Gemini writes the eight verdicts, in Spanish and in English, and the two
cards with the owner's two changes, from the brief
`sprint-46-the-verdict-told.md`. The designer's one correction: the
sentence of the wizard that wins with a penalty does not say its name
twice.

### 4.5 The goals' order in *the-race*

The race's goals are told in this order: winning the race, the lines'
extra goal, the rings' extra goal. The two short goals share the strip's
first line and the rings' long goal has the next two, so the goals box
stays a strip that covers no ring and no figure, open through the race
(D227). With the rings' goal second, each goal has a line of its own, the
strip grows a line and covers the top rings, and the box falls back to
the list, folded at three seconds. `screens.spec.ts` keeps the strip
asked of `the-rings` and of `the-race`.
