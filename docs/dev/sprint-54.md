# Sprint 54 — Trials that fade, animals at twice a child's pace, a familiar that picks up when told, Rinlo seen breaking the thread, time that passes, and a second cat flap

On 2026-11-18 the owner had read chapter 5's whole walkthrough
(sprint 53, the fourth of 2026-11-17) and written twenty-two
comments under its steps. Fourteen were about words, and the
designer entered them, in Spanish and in English, before this plan
(`deca490`). Two more were stagings the designer entered as well:
only the friend's trial stands in the circle's first two levels
(`27f3fb3`), and *La voz en el túnel* is framed on whoever speaks
(`4652c89`). The rest are this sprint. In the owner's words:

> (*El círculo*) No me gusta que en este nivel haya ya dos pruebas
> hechas, la de los dos amigos. Solo el amigo del sexo contrario
> debería haber logrado ya su prueba, y además sería sin color
> todavía. Y además no debería de durar todo el rato, deberia
> desaparecer a los pocos segundos porque es una prueba y además
> no tiene color ni nombre.
>
> Aquí hay que decir: Como véis vuestro familiar desaparece a los
> pocos segundos. Necesita un nombre y un color para ser estable y
> poder mantenerse más tiempo en el círculo.
>
> (*El nombre y el color*) Igual, aquí debería haber solo un
> familiar, la liebre gris. Y esa se puede quedar ahí un rato
> porque ya tiene nombre y color, y luego aparece la otra cuando la
> crea el mago.
>
> (*El rastro*, «cruza la sala como una flecha») Lo de que salte
> como una flecha es importante. Creo que los animales deben
> moverse a 2x. No tan rápido como las escobas, pero más rápido
> que los niños. Así que donde hay animales hay que hacer que el
> tiempo vaya al doble de rápido, para que los niños tarden dos
> ticks por casilla pero los animales solo un tick por casilla.
>
> (*El rastro*, «Bajáis un piso…») Esto no tiene mucho sentido. En
> esta sala debería haber otro pasadizo más (o una gatera al
> menos) y debería decir: creo que pimu bajó por ahí, pero dónde
> encontro el hilo? Y luego pimu debería ir por el otro pasadizo y
> sacar otro hilo más, y así se sabe por donde fue.
>
> (*El pasadizo pequeño*) Hay que centrar al familiar un poco
> mejor en el pasadizo: En el primer tramo hacia arriba debe ir un
> pelín más hacia la derecha. Cuando se mueve en horizontal de
> izquierda a derecha, creo que está bien centrado, pero la
> máscara está mal, una parte del muro de debajo del animal sale
> detrás del propio animal.
>
> (*La voz en el túnel*, «Oís algunos ruidos más…») Aquí debería
> al menos verse mover a Rinlo un poco, o mirar a un lado u otro o
> irse a una esquina de la habitación, para que se entienda que
> está haciendo algo o rompiendo y tirando los hilos, y que ahí
> aparezcan los hilos.
>
> (*El cuarto olvidado*) En este programa si solo va a la posición
> de los hilos, no los coje. Habría que usar pick_up. No hay que
> enseñarlo ni programarlo, o simplemente decir que los familiares
> tienen pick_up, que se podría introducir antes cuando se explica
> la herencia y se dice que por ser familiar se tiene move_X, y
> luego aquí recordarlo.
>
> (*Lo que trajo el familiar*, «Tenemos algo que contarte…») Aquí
> hay que poner una animación (como apagar y encender la escena,
> ponerla gris... algo así) para que se entienda que están
> contando toda la historia.
>
> (*Lo que trajo el familiar*, su último paso) Quizás el cambio a
> por la tarde noche se peude hacer cuando se supone que los niños
> están contando la historia, en vez de en este punto.

The designer looked for the cause of each before planning it.

- **The trials that stay.** A trial called is drawn until the run
  is cleared, whatever it lacks, and a staged one for the whole
  level (`showFamiliar`, `app/src/engine/scene.ts`); only the
  spark goes out by itself. Nothing in the world or in the page
  says that a trial with no name or no colour does not last.
  Orla's words at the circle's win say it since `deca490`; the
  scene does not show it yet.
- **The animals' pace.** A familiar's step is a tick, and a tick
  of chapter 5 lasts what a tick lasts in every level where the
  wizard walks: a fox crosses a cell in the time a child does. A
  story's walk gives every figure the same time a cell
  (`storyEvents`, `app/src/content/stories.ts`). The flight has
  its own measure (D225): three ticks a walked cell, and the page
  plays the ticks in a third of the time. The owner asks for the
  same with two.
- **The thread nobody picks up.** A familiar takes what lies where
  a move of its own ends (`_k_ends_move`,
  `world/kydux_world/world.py`, D270), so the program of *El
  cuarto olvidado* collects four pieces without a word that says
  so. `Familiar` has no `pick_up`.
- **Rinlo, still.** A story has no doing that stands a seated
  figure up or seats it (`STORY_DOINGS`,
  `world/kydux_world/level.py`), and none that brings a staged
  thing into sight: Rinlo sits through the whole story, and the
  pieces he says he has broken are seen first in the level after
  it.
- **The story told to Orla.** *Lo que trajo el familiar* goes from
  the friend's *Tenemos algo que contarte…* to Orla's thanks with
  nothing between, and the evening comes with the next story,
  which opens under `sunset`. A part's staging may say its light
  (`PART_STAGING`), but a change of part is a cut.
- **One entrance for two ways.** In *El rastro* the familiar goes
  into the hall's tiny arch and comes back with a thread; a floor
  below, the corridor's wall has one flap, the trench's, and the
  voice says a thread is found inside it. Nothing shows where the
  familiar came down or where it found the first thread.
- **The trench.** The familiar is drawn on its cell's middle, and
  the trench's first stretch (column 10, rows 9 to 12) is painted
  a little to the right of it. On the stretch along row 8 the
  figure is drawn over the whole ground, the trench's near rim
  included: its feet lie over the wall it should stand behind.
  The scene's two covers are the wall over the passage's mouths
  (`art/scenes/the-tower-passage/cut.json`); the rim has none.

**What this sprint holds:**

1. A trial holds only with a name and a colour; one that does not
   fades in a few seconds (2.1, D276).
2. Where a familiar walks, it goes at twice a child's pace (2.2,
   D277).
3. A familiar picks up when told, with the `pick_up` it inherits
   (2.3, D278).
4. In a story a seated figure stands and sits and a thing comes
   into sight; Rinlo is seen breaking the thread (2.4, D279).
5. Time that passes in a story is the scene gone dark and back;
   the evening comes while the children tell Orla (2.5, D280).
6. The corridor has two tiny entrances, and *El rastro* shows by
   which the thread came (2.6, D281).
7. In the trench a familiar stands on its middle, behind its near
   rim (2.7, D282).
8. Four notes from sprint 53's review: the friends' portraits in
   their second colours (D283), a bubble that keeps off the circle
   (D284), code shown as code in two places, and Ilda's band
   beside the find-wizard button (2.8).

It is built after sprint 53, on the designer's last commit.

## 1. Decisions taken here

Their words are here; the programmer enters them in
`docs/dev/architecture.md` as it builds each, and brings to them
the decisions they touch (D225, D262, D263, D270, D273 and the
events' table).

- **D276 — A trial holds only with a name and a colour; one that
  does not fades in a few seconds.** Decided 2026-11-18 by the
  owner (*no debería de durar todo el rato, deberia desaparecer a
  los pocos segundos porque es una prueba y además no tiene color
  ni nombre*; *Necesita un nombre y un color para ser estable y
  poder mantenerse más tiempo en el círculo*; of the friend's grey
  hare, *esa se puede quedar ahí un rato porque ya tiene nombre y
  color*). A trial called holds when the book took a name for it
  and it has a colour of its kind: the `trial` event gives both
  its `name` and its `color` (D262), and says `holds`. A trial
  with no name, with no colour, or pale, does not hold. Holding is
  how long a trial is seen, and nothing else: the world's circle,
  the cell a trial takes, the dissolving of a cell's earlier
  trial, the goal `trial` and the words told are as they are. The
  page draws a trial that does not hold as D263 says, for about
  four seconds of its own clock at the normal speed, and then
  lets it fade in about one, as the spark goes out by itself. The
  seconds are the page's and not ticks, since the playback holds
  a tick while words are read (D264); they are shorter as the
  speed is higher, they wait while the run is paused, and where a
  trial steps (the birth's level) they are counted from its last
  step. A trial that holds stands until the run is cleared. A
  staged trial (an actor with `trial`) holds when it is staged
  with its colour: its master has named it. Staged with none, it
  is seen when the level opens, its seconds start when the start
  card closes, and it does not come back when a run starts again
  in that visit. Drawn at once on a later tick (the timeline, a
  run shown ended), a trial that does not hold is not there; a
  `dissolved` of a trial already faded shows nothing. Rules out a
  trial with no name or no colour that stands for the whole level,
  a fade counted in ticks, and a world that forgets a trial its
  goal still counts.

- **D277 — Where a familiar walks, a person's step takes two
  ticks, and the page plays the ticks in half the time.** Decided
  2026-11-18 by the owner (*Creo que los animales deben moverse a
  2x. No tan rápido como las escobas, pero más rápido que los
  niños*; *donde hay animales hay que hacer que el tiempo vaya al
  doble de rápido, para que los niños tarden dos ticks por casilla
  pero los animales solo un tick por casilla*). In a level whose
  familiar can walk (a `familiar` block of stage `birth` or
  `living`) a walked step of the wizard's takes two ticks
  (`Level.walk_ticks`, `WALK_TICKS_FAMILIAR`), told as D225 tells
  its three: its event `move`, with `ticks`, in the first, and
  one with no event of the wizard's. A familiar's step takes one
  tick (D270), and every other action one. The page plays every
  tick of such a level in half a tick (`Playback`'s `pace`), the
  wizard's hands' ticks as long as anywhere (LONG): a familiar
  crosses a cell in half the time a child takes anywhere, a
  flight is still faster (a third), and a child's step is seen as
  long as in any other level. The familiar that `minka` brings
  back runs at that pace. A level's `tick_limit` and a familiar's
  count of ticks are untouched. No level has both `drevo` and a
  familiar that walks, and the level's check refuses one. In a
  story a familiar's walked cell takes half the time of a
  person's, each figure at its own pace when both walk in one
  step. Rules out a familiar of two cells a tick, which would
  make a move of one cell cost a whole tick and skip the cell
  between, and a slower child with the animal's time unchanged.

- **D278 — A familiar picks up when it is told: `pick_up`, which
  it inherits.** Decided 2026-11-18 by the owner (*si solo va a
  la posición de los hilos, no los coje. Habría que usar pick_up.
  No hay que enseñarlo ni programarlo, o simplemente decir que
  los familiares tienen pick_up, que se podría introducir antes
  cuando se explica la herencia y se dice que por ser familiar se
  tiene move_X, y luego aquí recordarlo*). `Familiar` has
  `pick_up()`, with no argument, and every kind inherits it as it
  inherits its steps (`MEMBERS["familiar"]`, `familiar.pick_up`
  in a level's `api`). It takes a tick: the familiar takes every
  thing of a carried kind that lies free on its own cell (the
  familiar's `pick_up` event, as D270 gives it) and carries it;
  the wizard has it when `minka` brings the familiar back (D262).
  With nothing on its cell it is a stumble and not an error:
  `blocked`, `by` the familiar, `reason: nothing`, `tried: true`,
  the run going on, and the wizard thinks a line about it. Told
  to a trial before its `minka`, it is `blocked`, `not_here`, as
  a step of a trial's is.
  A familiar picks up nothing by ending a move on it; a plate is
  still lit by a familiar that ends a move on it. The child
  writes no `pick_up` in its class and none is asked: lesson 4
  names it beside the steps, and *El cuarto olvidado* recalls it.
  Rules out a familiar that takes what it stops on without a
  word, a `pick_up` that reaches the cells beside, and one more
  method to write in the book.

- **D279 — In a story a seated figure stands and sits, and a
  staged thing comes into sight.** Decided 2026-11-18 from the
  owner's comment (*debería al menos verse mover a Rinlo un poco…
  para que se entienda que está haciendo algo o rompiendo y
  tirando los hilos, y que ahí aparezcan los hilos*). Three
  doings join `STORY_DOINGS`: `stand`, by a figure staged
  `sitting`, which is drawn standing from then on; `sit`, by a
  figure whose sheet has the sitting rows (D273), which is drawn
  seated, the way it faces; and `show`, with the id of a thing
  staged `hidden` in the story or its part, which comes into
  sight on its cell as a thing found does (D184). Each is one of
  a figure's queue (D103) and plays in its turn: a figure may
  walk, show a thing where it stood, walk on, and sit. A seated
  figure does not walk, and the story's check refuses a walk by
  one. Rules out a figure that slides seated, and things that
  lie in a story before what brings them.

- **D280 — Time that passes in a story is the scene gone dark and
  back.** Decided 2026-11-18 by the owner (*hay que poner una
  animación (como apagar y encender la escena, ponerla gris...
  algo así) para que se entienda que están contando toda la
  historia*; *el cambio a por la tarde noche se peude hacer cuando
  se supone que los niños están contando la historia*). A step
  whose `scene` says `"later": true` opens after a passing of
  time: the scene fades to dark, stays dark for a moment, and the
  part's staging comes back out of the dark, about two seconds in
  all; the step's words open once the scene is back, and the
  music goes on. The part may be the same scene staged under
  another light (`light`, D273): the afternoon gone while
  something was told. A step shown at once (back, or a story
  skipped through) shows its staging with no wait. A change of
  place stays a cut. Rules out words that say time went by over
  a scene that does not change, and a light that changes between
  two stories with nothing that tells why.

- **D281 — The corridor under the hall has two tiny entrances.**
  Decided 2026-11-18 by the owner (*En esta sala debería haber
  otro pasadizo más (o una gatera al menos)*). `the-tower-passage`
  has a second flap painted at the foot of the corridor's wall,
  on the cell (16, 12), on the bare wall to the right of the
  tapestry, and like the trench's mouth at (10, 12): it is where
  the way from the hall's tiny arch comes down, inside the wall.
  No figure stands on the cell under it while it is spoken of,
  since a child there hides it. It is painted and
  no more: the cell stays wall in the map, no terrain is under
  it, and no figure enters it. Gemini paints it on the scene's
  base and only the flap's own pixels enter the painting (D148),
  the rest of the scene the same pixel for pixel. Rules out a
  second trench in the wall's cut, and a story where the familiar
  finds two threads by one way.

- **D282 — In the trench a familiar stands on its middle, behind
  its near rim.** Decided 2026-11-18 from the owner's comment
  (*En el primer tramo hacia arriba debe ir un pelín más hacia la
  derecha*; *una parte del muro de debajo del animal sale detrás
  del propio animal*). A familiar on a cell of the trench is
  drawn on the painted trench's middle: where the painting's
  middle is not the cell's, the cell is `nudged` by the measured
  difference (D105), in `the-tower-passage` the stretch of column
  10. Along a stretch that runs sideways (row 8, columns 10 to
  13) the trench's near rim, the wall just below the figure's
  feet, is a cover drawn over a figure (`over`, D273): the
  familiar is seen in the trench and not on the wall. Rules out
  a familiar that walks on the trench's wall, and a trench
  painted again to meet the figure.

- **D283 — A friend's portrait wears what the friend wears in the
  scene.** Decided 2026-11-18 by the designer, from sprint 53's
  review. A friend has two sets of colours, and the wizard's
  look says which it wears (D90, `friendSheet`). The portrait
  beside a friend's words is of the set the friend wears: each
  friend's second set has a portrait of its own, made from the
  first by the recolouring that makes the wizard's
  (`tools/art/figures.py --portraits`, D194), with no painting
  asked. Rules out a portrait in green beside a figure in
  burgundy.

- **D284 — Words told in the circle's levels keep off the
  circle.** Decided 2026-11-18 by the designer, from sprint 53's
  review. In a level with a circle (a `familiar` block with
  `circle`), the bubble of words told (D264) covers none of the
  circle's cells: it opens above who speaks where the frame has
  the room, and where it has not, on the side away from the
  circle. What Orla and Bimo speak about is seen while they
  speak. Rules out a bubble over the trial it tells about.

## 2. What is asked

### 2.1 A trial that does not hold fades (D276)

Where it is. `world/kydux_world/world.py`: `_trial` notes the
event `trial` with `id`, `kind`, `name`, `color`, `at`, `pale`,
`reason` and `dissolved`; `described` gives `name` only when the
book took it and `color` only when the worth is good.
`app/src/engine/scene.ts`: `showFamiliar` draws the trial and
keeps it (`this.called`); the spark is destroyed by a timer of
three ticks; a staged trial is drawn with the level's actors;
`data-trials` on the scene's parent lists the trials shown.
`app/src/engine/trial.ts` draws the figure in light.

What is asked.

- The world's `trial` event says `holds` as D276 defines it, and
  the events' table says so.
- The page fades a trial that does not hold, as D276 says: the
  seconds, the speed, the pause, the last step, the timeline, the
  dissolving. The staged trial with no colour of *El círculo*
  (the friend's hare) is seen behind the start card, fades a few
  seconds after the card closes and does not come back on a run
  started again; the staged grey hare of *El nombre y el color*
  and of *Una línea en el libro* stands.
- `data-trials` lists the trials that are seen: one that has
  faded leaves it, so that a test reads the fade.
- Orla's words at the win of *El círculo* (*Como veis, vuestro
  familiar desaparece a los pocos segundos.*) are read with the
  trial fading or gone: if the seconds of D276 do not give it,
  say so in the report with what the screen shows; do not change
  the words.
- The walkthrough's picture of a won level whose trial does not
  hold is taken while the trial is still seen.

Tests: the world's (`holds` for each case of
`world/tests/familiar_cases.json` that calls a trial: no name, no
colour, pale with a name, whole); the page's
(`app/e2e/chapter-5.spec.ts`: the circle's trial is listed and
then leaves `data-trials`; the name-and-colour's whole trial
stays; the friend's hare with no colour leaves after the card and
is not back on a second run; the grey one stays).

### 2.2 Animals at twice a child's pace (D277)

Where it is. `world/kydux_world/level.py`: `WALK_TICKS_FLYING`
and the property `walk_ticks`; `Wizard._move` in `world.py` reads
it. `app/src/engine/playback.ts`: `lengthOf(events, pace)`,
`LONG`, `FLOWN`; `startScene` in `scene.ts` sets the `pace` from
the level's spells. `app/src/content/stories.ts`: `storyEvents`
builds a story's walks.

What is asked. D277 as it is written, in the world, the page and
the stories. The levels it reaches are *Fuera del círculo*, *Las
órdenes de Orla*, *El pasadizo pequeño* and *El cuarto olvidado*;
the four levels of trials keep every level's pace. In those four
the wizard has no step in its `api`, so the two ticks are seen
only by a test of the world's; what the child sees is the
familiar at twice the pace, and `minka` bringing it back at that
pace. A familiar's steps keep their sound, and a run of them
does not pile up into a noise: the report says what was done for
it. In the stories, *El rastro*'s crossing of the hall (*como una
flecha*) and the familiar's run down the passage in *La voz en el
túnel* are the two walks to look at.

Tests: `walk_ticks` by level; a wizard's step of two ticks in a
level made for the test; the level's check refusing `drevo` with
a familiar that walks; `playback.test.ts` for the pace; a browser
test that measures a familiar's cell against a wizard's in
another level, with a wide bound; a story's walk of a familiar
and a person in one step ending at different times.

### 2.3 `pick_up`, inherited (D278)

Where it is. `world/kydux_world/familiars.py` (`Familiar`, its
steps), `world.py` (`_k_ends_move`, `Wizard.pick_up` for the
stumble's shape), `api.py` (`MEMBERS["familiar"]`), the
notebook's words in `i18n/es.json` and `i18n/en.json`
(`notebook.familiar.*`), the thoughts beside
`"no_way"` there.

What is asked. D278 in the world, and these words, entered as
they are. They are the designer's corrections on the owner's
comment; nothing is asked of Gemini.

The notebook, `notebook.familiar.pick_up`:

- ES: `Tu familiar recoge lo que hay en su casilla y lo lleva
  encima. Te lo da cuando minka lo trae de vuelta.`
- EN: `Your familiar picks up what lies on its cell and carries
  it. It gives it to you when minka brings it back.`

The wizard's thought when a familiar's `pick_up` finds nothing,
beside the familiar's other thoughts:

- ES: `Mi familiar no tiene nada que recoger ahí.`
- EN: `My familiar has nothing to pick up there.`

Lesson 4, `content/lessons/what-it-inherits`, the paragraph that
names the steps. It reads, whole:

- ES: ``Tu familiar sabe dónde está, `position`, y sabe andar,
  con `move_up`, `move_down`, `move_left` y `move_right`. Son los
  mismos nombres que usa tu `wizard`, y hacen lo mismo. También
  sabe recoger lo que tiene debajo, con `pick_up`.``
- EN: ``Your familiar knows where it is, `position`, and knows
  how to walk, with `move_up`, `move_down`, `move_left` and
  `move_right`. They are the same names your `wizard` uses, and
  they do the same. It also knows how to pick up what lies under
  it, with `pick_up`.``

*El cuarto olvidado*, `content/levels/the-forgotten-room`:

- `api` gains `familiar.pick_up`.
- `starting_code`: one line more, under the line of `find_all`
  and with no empty line between (D218):
  ES ``# Allí, haz que lo recoja con `pick_up`.``
  EN ``# There, have it pick the piece up with `pick_up`.``
- `intro` gains a second piece (D274), after an empty line:
  ES ``Recuerda: por ser un `Familiar`, también tiene
  `pick_up`.``
  EN ``Remember: being a `Familiar`, it has `pick_up` too.``
- The third hint reads:
  ES ``Recorre esa lista con `for`: manda a tu familiar a la x y
  la y de la posición de cada trozo y, allí, que lo recoja con
  `pick_up`, que heredó de `Familiar`. Al final, `minka` lo trae
  de vuelta con todo.``
  EN ``Walk that list with `for`: send your familiar to the x and
  the y of each piece's position and, there, have it pick the
  piece up with `pick_up`, which it inherited from `Familiar`.
  Last, `minka` brings it back with everything.``
- `solution.py` calls `pimu.pick_up()` in the loop, after the
  `go_to`; the three wrong answers pick up as well, so that each
  still fails for its own reason; a fourth,
  `no_pick_up.py`, is today's solution: it goes to every piece
  and comes back with none.

Tests: the world's (a pick with a thing, with none, by a trial,
before `minka`; nothing taken at a move's end; a plate still
lit), `familiar_cases.json`, the notebook's page listing
`pick_up` in a level that gives it, the level's ways `a`, `b` and
`c` solved by the new solution.

### 2.4 Rinlo is seen breaking the thread (D279)

Where it is. `world/kydux_world/level.py`: `STORY_DOINGS`,
`_story_actions`, the things a story stages (`hidden` for carried
kinds). `app/src/content/stories.ts` (`storyEvents`),
`app/src/engine/scene.ts` (`sitting`, `face`, `showFound`).
`content/stories/the-voice-in-the-tunnel/story.json`: Rinlo is
staged at (8, 3), `sitting`, facing right.

What is asked. The three doings of D279, and this staging of *La
voz en el túnel*. Its words are untouched and its cameras stay as
`4652c89` left them.

- The story stages the four pieces of *El cuarto olvidado*,
  `hidden`: `thread_1` (9, 2), `thread_2` (11, 3), `thread_3`
  (12, 3), `thread_4` (10, 3).
- Step 6 (Rinlo, *No. Vete, vete de aquí.*): Rinlo stands.
- Step 7 (the voice, *Oís algunos ruidos más. Luego, silencio.
  La voz no contesta.*): Rinlo walks to (12, 3) and back to
  (8, 3), a piece coming into sight on each cell he leaves on
  his way back: `thread_3` as he leaves (12, 3), `thread_2`
  (11, 3), `thread_4` (10, 3), and `thread_1`, thrown aside to
  (9, 2), as he passes (9, 3). At (8, 3) he faces right and
  sits. The words are up while he does it.
- Steps 10 and 11 (Rinlo, *Lo he roto…*) are said seated, the
  pieces in sight.

*El cuarto olvidado* opens on that picture: Rinlo seated at
(8, 3), the pieces where its first way has them. If a queue of
doings cannot show a thing between two stretches of one walk, the
walk is written as stretches; say in the commit how it is
written.

Tests: the story's check (a `stand` by a figure not seated, a
`sit` by a figure with no sitting rows, a `show` of a thing not
hidden, a walk by a seated figure: each refused), `story.spec.ts`
for the story's seventh step (Rinlo off his cell and back, the
four pieces shown after it and none before).

### 2.5 Time passes while the children tell Orla (D280)

Where it is. `app/src/ui/story.ts` plays a change of part as a
cut (`framingAt`); `PART_STAGING` in `level.py` lists what a part
may stage. `content/stories/what-the-familiar-brought`: step 10
changes to `the-tower-hall`; step 11 is the friend's *Son hilos
para trucar escobas. Tenemos algo que contarte…*; step 12 Orla's
*Debo agradeceros por vuestra sinceridad.* The hall has its
`sunset` light, and *El fin de curso* is told under it.

What is asked. D280, and step 12 of *Lo que trajo el familiar*
staged as a part of its own: the hall again, every figure where
step 10 put it, `"light": "sunset"`, `"later": true`, the framing
step 10 gave. From there to the story's end the hall is in its
evening, and *El fin de curso* opens under the same light with no
change. No word is added.

Tests: the story's check (`later` only in a step's `scene`);
`story.spec.ts`: step 12 opens its words after the dark, the
scene under `sunset`; going back to step 11 shows the day's hall
at once.

### 2.6 The corridor's second entrance, and *El rastro* (D281)

The picture. Gemini paints a second flap on the scene's base
(`art/raw/game-tower-passage/game-tower-passage-nogrid.png`), on
the cell (16, 12): at the foot of the corridor's wall, on the
bare stretch to the right of the tapestry, the same size, arch
and darkness as the trench's mouth at (10, 12). Only the pixels of the
flap's own box enter the painting (D148): the difference is cut
by the box and laid on the base, and a test or a count in the
commit says the rest is the same pixel for pixel. The covers, the
map, the plan and `narrow.json` are untouched; `cut.json` says
what the flap is. The prompt is kept in `tools/art/prompts/` as
the scene's others are.

The story. `content/stories/the-trail` from its step 18, which
changes to `the-tower-passage`. The part stages the wizard at
(9, 13), the mate at (11, 14) and the familiar at (10, 13), under
the trench's mouth, as it does today, and the friend at (15, 13),
facing right: beside the new flap and not under it, so that the
flap is seen. Its framing is `{"fit": [[0, 5], [19, 14]]}` in
place of the wide one. The story has twenty-two steps:

| Step | Who | What is done | ES | EN |
|---|---|---|---|---|
| 18 | voice | the wizard faces up | `Bajáis un piso. En el pasillo de debajo de la sala hay dos entradas diminutas al pie de la pared, pequeñas como gateras.` | `You go down a floor. In the corridor under the hall there are two tiny entrances at the foot of the wall, small as cat flaps.` |
| 19 | friend | nothing: the friend stands by the new flap, facing it | `Creo que {familiar} bajó por ahí, pero ¿dónde encontró el hilo?` | `I think {familiar} came down that way, but where did it find the thread?` |
| 20 | voice | the familiar walks into the trench's mouth, to (10, 9) | `{familiar} se mete por la otra entrada.` | `{familiar} slips into the other entrance.` |
| 21 | voice | the familiar walks back to (10, 13) and faces down | `Sale enseguida y trae otro hilo negro: por ahí dentro encontró el primero.` | `It is out again at once with another black thread: in there is where it found the first.` |
| 22 | mate | nothing | the line step 19 has today | the same |

Step 19's Spanish is the owner's. The others are the designer's
corrections of the step the owner struck; the owner reads them in
the walkthrough.

Tests: the stories' checks and counts, `i18n_check.py`, the
walkthrough's pictures of steps 18 to 22.

### 2.7 The trench: the middle and the rim (D282)

Where it is. `art/scenes/the-tower-passage/cut.json` (`things`
with `over`, `hides`, `lowered`), `tools/art/export_scene.py`
(`nudged`, `lowered`), `app/src/engine/depth.ts` (`nudgedBy`),
`tools/art/sweep.py`.

What is asked. Measure first, on the game's picture enlarged: a
familiar standing on each cell of the trench, its feet's middle
against the painted trench's. Then:

- the cells of column 10's stretch are `nudged` to the right by
  what the measure gives; column 13's stretch the same way if it
  is off; the corners as the two stretches ask, so that a turn
  does not jump;
- the near rim of the stretch along row 8 is a cover over a
  figure, from the trench's lower edge down to where the rim's
  stone ends, cut from the painting; a familiar on (10, 8) to
  (13, 8) is seen from its body up, its feet behind the rim, and
  a familiar on row 9 or below is not cut by it;
- `sweep.py` takes a familiar through every cell of the trench,
  both ways, and its pictures are looked at before the commit.

The report shows the trench's three stretches enlarged, a
familiar on each, with the numbers measured.

### 2.8 Four notes from sprint 53's review

- **The friends' portraits (D283).** `app/src/ui/portraits.ts`
  (`portraitOf`), `app/src/engine/looks.ts` (`friendSheet`),
  `tools/art/figures.py --portraits`, `content/art/portraits/`
  and its `SOURCE.md`. A browser test: with a look that puts
  Nuri in the second set, Nuri's words show that set's portrait;
  with one that puts Nuri in the first, the first's.
- **The bubble and the circle (D284).** `app/src/engine/speech.ts`
  and `bubble.ts`. A unit test of the place chosen, and the
  pictures of Orla's and Bimo's words at the win of *El círculo*
  in the report, the trial seen under them.
- **Code shown as code.** The lesson runner's error line
  (`app/src/ui/lessonrun.ts`, `said.textContent = forWizard(…)`)
  and every text of the won card (`app/src/ui/cards.ts`) show
  what is between backquotes in the code's letter, as the cards'
  other texts do (`withCode`), and never the backquotes. A unit
  test for each.
- **Ilda's band.** `.race-band` (`app/src/style.css`) moves aside
  when the find-wizard button shows, as `.book-band` does. First
  see whether they meet, in chapter 4's race with the wizard out
  of the frame; if they never do, say so and change nothing.

### 2.9 What the owner will try

1. *El círculo*: behind the start card, the friend's hare, a
   drawing with no colour, and nobody else's. The card closed, it
   fades in a few seconds.
2. The solution run: the fox comes, Orla speaks, and the fox
   fades as she says it will. Her bubble does not cover it.
3. *El nombre y el color*: the grey hare stands; a fox with a
   name and a colour stands too; one with only a name fades.
4. *Fuera del círculo* and *Las órdenes de Orla*: the fox goes
   at twice the pace of a child's walk in any other level.
5. *El rastro*: the fox crosses the hall like an arrow. A floor
   below, two tiny entrances; the friend's question; the fox goes
   in by the other and is out with a thread.
6. *El pasadizo pequeño*: the fox in the trench's middle on the
   first stretch, and behind the rim on the stretch along it.
7. *La voz en el túnel*: at the noises, Rinlo gets up, crosses
   the room and comes back, the pieces left behind him, and sits.
8. Lesson 4 names `pick_up`. *El cuarto olvidado*: the card
   recalls it; the old program comes back with nothing; with
   `pick_up` in the loop the pieces are picked one by one.
9. *Lo que trajo el familiar*: after *Tenemos algo que contarte…*
   the hall goes dark and comes back in the evening, and Orla
   answers. *El fin de curso* follows under the same light.
10. With a wizard in green or in orange: the friend's portrait
    in the colour the friend wears in the scene.

### 2.10 What is left out, and why

- **The two asides inside a bubble** (Bimo's at the circle's win,
  the mate's *(bajito)*): the owner read both steps and struck
  neither. They stay.
- **Words for the dark.** D280 adds no narration: the owner asked
  for the picture. If the dark alone does not tell it, the owner
  says the words.
- **A second trench.** The new flap is painted only (D281).
- **The narrow windows, the story page's words on a change of
  language, the font** (earlier reviews): not asked here.
- **Texts that speak of a trial that stays.** If a text of the
  chapter contradicts D276, the report names it; the designer
  writes the correction.

## 3. The pieces

One local commit each, in order.

### 3.1 The trial that holds (D276, 2.1)

`world.py`, the events' table, `scene.ts` and `trial.ts`, the
tests of 2.1; D276 entered, D262 and D263 brought to it.
`ci/check.sh` and `chapter-5.spec.ts` green.

### 3.2 The animals' pace (D277, 2.2)

`level.py`, `world.py`, `playback.ts`, `scene.ts`, `stories.ts`,
the sound of a familiar's steps, the tests of 2.2; D277 entered,
D225 and D270 brought to it. `ci/check.sh`, `chapter-5.spec.ts`,
`story.spec.ts`, `sound.spec.ts` and `glide.spec.ts` green.

### 3.3 `pick_up` (D278, 2.3)

`familiars.py`, `world.py`, `api.py`, the two `i18n` files, the
lesson's two files, the level's files, the tests of 2.3; D278
entered, D270 brought to it, the course's documents that list a
familiar's members. `ci/check.sh`, `chapter-5.spec.ts`,
`notebook.spec.ts` and `lesson.spec.ts` green.

### 3.4 The story's doings and Rinlo's (D279, 2.4)

`level.py`, `stories.ts`, `scene.ts`, the story's `story.json`,
the tests of 2.4; D279 entered, D103 and D273 brought to it.
`ci/check.sh` and `story.spec.ts` green.

### 3.5 Time that passes (D280, 2.5)

`level.py`, `story.ts`, the story's `story.json`, the tests of
2.5; D280 entered, D199 and D273 brought to it. `ci/check.sh`
and `story.spec.ts` green.

### 3.6 The second entrance (D281, 2.6)

The flap from Gemini, the scene exported, `cut.json` and the
scene's `SOURCE.md`, the story's three files, the tests of 2.6;
D281 entered, D273 brought to it. `ci/check.sh`, `story.spec.ts`
and `painted.spec.ts` green.

### 3.7 The trench (D282, 2.7)

`cut.json`, the tools it asks, the scene exported, the sweep;
D282 entered. `ci/check.sh`, `sweeps.spec.ts`, `painted.spec.ts`
and `chapter-5.spec.ts` green.

### 3.8 The four notes (D283, D284, 2.8)

One commit for each note that changes something. D283 and D284
entered. `ci/check.sh` and the specs each touches
(`words.spec.ts`, `cards.spec.ts`, `lesson.spec.ts`,
`chapter-4.spec.ts`, `chapter-5.spec.ts`) green.

### 3.9 The whole check, the walkthrough and the report

`ci/check.sh --e2e` whole, once, in a copy. Then chapter 5's
walkthrough, made anew
(`cd app && npm run walkthrough -- 05-the-familiar`). The report
in Spanish, in `drafts/`: the ten steps of 2.9; pictures of the
current commit only (the circle before and after the fade, the
corridor with its two entrances, the trench's three stretches
enlarged, Rinlo mid-room with the pieces behind him, the hall
dark and the hall in the evening, the portraits); the seconds of
the fade and the paces measured, in plain words; the Gemini
images spent, named, and the chapter's count; what was decided
where the plan does not decide. The memory note
`kydux-sprint-54-state`, and the prompt for the designer's
review.

## 4. Gemini

One picture: the second flap (2.6), with up to three retries; the
chapter's count stands at 41 of 120 before it. No text is asked
of Gemini: the words of 2.3 and 2.6 are the owner's and the
designer's corrections, given here in both languages.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 54: what the owner asked after reading chapter 5's
whole walkthrough, and four notes from the last review. Build it
on the last commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-54.md (this plan, whole), docs/dev/sprint-53.md
(its sections 3.2, 3.3 and 5), and in docs/dev/architecture.md
D90, D103, D105, D148, D184, D199, D225, D262, D263, D264, D268,
D270, D273, D274 and D275. Then your memory notes
kydux-sprint-53-state, kydux-checks-per-piece,
kydux-report-images-current, kydux-no-co-authored-by,
kydux-docs-present-tense and kydux-github-only-code-and-docs.

What is asked, in short; the plan has each in full.

1. Trials (D276). A trial called holds only with a name the book
took and a colour of its kind; the world's `trial` event says so.
The page fades a trial that does not hold a few seconds after it
comes, by its own clock and not by ticks. The friend's staged
hare with no colour, in El círculo, fades after the start card
closes; the grey one of the next levels stands.

2. Animals at twice a child's pace (D277), the mirror of D225
with two: where a familiar can walk, a person's step takes two
ticks, a familiar's one, and the page plays the ticks in half the
time. In a story a familiar's cell takes half a person's time.

3. pick_up (D278). Familiar has pick_up(): a tick, what lies on
its own cell; nothing there is a stumble. A familiar picks up
nothing by ending a move. Lesson 4, the notebook and El cuarto
olvidado say it, with the words the plan gives in Spanish and
English; the level's solution calls it, and today's solution
becomes a wrong answer.

4. Story doings (D279): stand, sit, and show (a staged hidden
thing comes into sight). In La voz en el túnel Rinlo stands,
crosses the room and comes back leaving the four pieces behind
him, and sits.

5. Time that passes (D280): a part marked later opens after the
scene goes dark and comes back. In Lo que trajo el familiar the
hall comes back under sunset at step 12.

6. A second cat flap (D281) painted by Gemini at (16, 12) of
the-tower-passage, only its own pixels entering the painting
(D148); El rastro from step 18 as the plan's table, twenty-two
steps, the friend staged beside the new flap.

7. The trench (D282): measure, then nudge the familiar onto the
painted trench's middle on column 10's stretch, and make the near
rim of the stretch along row 8 a cover over the figure.

8. Four notes: the friends' portraits in their second colours
(D283), told bubbles off the circle (D284), code shown as code in
the lesson runner's error line and on the won card, and Ilda's
band beside the find-wizard button (look first; change nothing if
they never meet).

Build pieces 3.1 to 3.9 in order, one local commit each (3.8: one
for each note). Before each commit, ci/check.sh and the browser
specs the piece touches green; the whole ci/check.sh --e2e once,
before the last, in a copy with Playwright's own server on 4173
and the app built anew in that copy. Never a push, never a timer,
never a deploy. Never stop or build into the servers on ports 443
and 5173; a preview left on 4173 is a browser run's leftover and
may be stopped, and yours is stopped when you are done. Nothing
under .github/ changes. The image key stays in
~/.config/kydux/secrets.env and enters no file, log or commit.
Gemini: one picture, the flap, with up to three retries; no text
is asked of it.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for:
(1) El círculo: only the friend's hare behind the card, with no
    colour, and it fades a few seconds after the card closes;
(2) the child's fox fades while Orla says it will, and her
    bubble does not cover it;
(3) El nombre y el color: the grey hare and a fox with name and
    colour stand; a fox with only a name fades;
(4) the fox walks at twice a child's pace wherever it walks, and
    crosses the hall like an arrow in El rastro;
(5) El rastro, a floor below: two tiny entrances, the friend's
    question, the fox in by the other and out with a thread;
(6) El pasadizo pequeño: the fox on the trench's middle, and
    behind the rim on the stretch along row 8;
(7) La voz en el túnel: Rinlo gets up, crosses the room, leaves
    the pieces and sits;
(8) lesson 4 names pick_up; El cuarto olvidado recalls it, and
    the program without it comes back with nothing;
(9) Lo que trajo el familiar: the hall dark and back in the
    evening before Orla answers;
(10) a friend's portrait in the colour the friend wears.

The plan gives the decisions' words and the texts: enter them as
they are. Where it does not decide (the event's field and the
seconds' exact numbers, how a faded trial is kept out of a second
run, the sound of a familiar's quick steps, how a queue shows a
thing between two stretches of a walk, the dark's lengths, the
rim's box, where a bubble goes beside the circle), take the
smallest choice that keeps its intent and say it in the commit.
Do not build what section 2.10 leaves out. If a text of the
chapter contradicts a decision, name it in the report and leave
it. Never edit content while a browser run is going. Every
document and comment in the present. Before git add, read git
diff of each file and stage only your own hunks; nothing of
drafts/ enters a commit.

docs/dev/sprint-54.md is the designer's and is committed already;
leave it as it is.

Hand over, in drafts/ and never committed: chapter 5's
walkthrough made anew, and the report in Spanish as 3.9 asks,
with the ten steps of 2.9 and pictures of the current commit
only. Write your memory note kydux-sprint-54-state, and end with
the prompt for the designer's review in English, in a code block.
```
