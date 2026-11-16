# Sprint 45 — A turn inside a ring stops the program, the finish past its line, the start card over the whole window, a goals box of two shapes, the server's cache and the sound asleep

On 2026-11-14 the owner asked how the race counts a ring, and the
answer showed a hole in the rule: a wizard that flies one step into a
ring, stops inside it and leaves by its side hears nothing; the ring
is only missed, and a race pays for it with five turns at its end. The
owner closes it, in their words:

> Si se está dentro del aro y se intenta salir hacia un lado (no hacia
> arriba o hacia abajo), se choca con el borde del aro. Se puede
> resolver con un pensamiento/sonido de choque que pare el programa y
> que diga "Oh, giré demasiado pronto y rocé el aro".

They asked also for whatever the review of sprint 44 saw, and answered
each thing the same day:

> Que ventaja tiene plegar la caja automáticamente? El niño tiene que
> leer eso cuando inicia el nivel, si la pliegas le obligas a
> desplegarla primero, por qué eso es mejor?
>
> Por otro lado, hay algo que podamos hacer para que haya que hacer
> menos scroll en esas cajas? Cuando el texto es largo se tapa la
> mitad y hay que hacer scroll.
>
> Veo ok el cambio de la cache. Veo ok lo del audio.
>
> De zarek: se puede hacer que tanto el como el mago aterricen pasada
> la meta. Añade la misma distancia a todos así que no cambia nada,
> solo hay que cambiar la celda objetivo.

The first of those answers spoke of the start card and not of the
goals box, as the owner said once the plan was written; and they
settled both:

> Vale, estaba confundiendo el panel de objetivos con el del inicio
> del nivel. El de objetivos veo bien plegarlo solo si tapa algo,
> pero dejémoslo desplegado 3 segundos para que el niño sea
> consciente. Y intentemos hacer más ancho o que entre más texto en
> el panel de la carrera (en el panel de la carrera no, en el panel
> de inicio del nivel).
>
> Y el de objetivos también veo bien tener dos tamaños o formatos,
> uno vertical y uno apaisado, y elegir automáticamente el que no
> tape nada, y si ambos tapan algo, pues plegarlo a los 3 s.
>
> Me gusta la idea de sacar las cajas de inicio de nivel del mapa y
> que ocupe toda la pantalla. Se puede hacer algo más ancha y reducir
> un punto el tamaño de la fuente.

What this sprint holds:

1. Inside a ring, a move to the left or to the right rubs the ring's
   rim: the bump's sound, the wizard's thought in the owner's words,
   and the program stops there, as `drevo` cast over the water stops
   it (D226).
2. The race's finish is the cell past the painted line, for the
   wizard and for Zarek: both land beyond it, and Zarek stands clear
   of the flag's pole. Every count is one tick more for both, so no
   race changes its end (D229).
3. The start card leaves the scene and lies over the whole window,
   wider, its letters a point smaller: no start card of the game
   scrolls on any screen the game is made for, where 25 of the 37
   scroll today at 1280 by 800 (D228).
4. The goals box has two shapes, a list and a strip, and the page
   takes the one that covers nothing of the level. Where both cover
   something, the box stays open three seconds and then folds by
   itself (D227).
5. The server keeps for good what the game's addresses name with a
   version: every file of `content/` and Python's own files (D230).
6. The page's sound sleeps while nothing sounds (D231).
7. The pictures of the tips *notebook*, *spells*, *click* and *lesson*
   are taken in chapter 1, where a child first reads them, and not in
   chapter 4, whose spells and actions that child has not met.

The rules of the earlier sprints hold: pieces in order, one local
commit each, `ci/check.sh` and the browser specs a piece touches green
before it, the whole `ci/check.sh --e2e` once before the last commit;
never a push, never a timer, never a deploy; the servers on 443 and
5173 untouched; documents and comments in the present; Gemini writes
every text the child reads from a brief, and the owner's own Spanish
words are kept as they are, with their slips of the keyboard put
right.

## 1. Decisions taken here

All are entered in `docs/dev/architecture.md` with this plan; D187 and
D219 are brought to D226, D189 and D220 to D229, D38 to D227 and
D228, D222 to D228.

- **D226 — A turn inside a ring rubs its rim, and the program stops.**
  The owner's, 2026-11-14, in the words above. While the wizard is in
  a ring's cell, flown into from below or from above, a move to the
  left or to the right is refused as `drevo` over the water is (D215):
  the event `blocked`, `by` the ring, `reason: ring_rim`, with
  `facing`; the run ends in an error at that line, the wizard still in
  the ring's cell and in the air; the ring makes no event and counts
  as not flown through. The scene turns the wizard that way and nudges
  it, shakes the ring and plays the bump's sound; the wizard thinks
  the owner's words, and the card says why the program stopped. A
  vertical move goes on as it does: on along the same way and out by
  the ring's far side, or back out by the side it came in, which says
  nothing and leaves the ring not flown. Rules out a ring left by its
  side in silence, and a rim that only bumps while the program goes
  on.
- **D227 — The goals box has two shapes, and folds by itself only
  after three seconds.** The owner's, 2026-11-14, in the words above.
  The box has a list, its goals one under another in a narrow column
  at the scene's top left corner, and a strip, its heading and its
  goals one after another along the scene's top. Once the camera has
  drawn the level's start, the page takes the first of the two, the
  list before the strip, that covers nothing of the level: the
  wizard, a figure, a thing of the level in sight, the end's mark.
  The box is first shown in the shape taken. Where both cover
  something, the box opens as the list and, three seconds after the
  child can see it, the page folds it, for that level alone. The
  child's click on the heading decides from then on, and before the
  three seconds end it keeps the page from folding. The shape is
  taken once in a level's visit. What the scene's picture holds of
  its own, a wall, a bed, a statue, does not count. Rules out a box
  folded as a level opens, a box left open over the wizard or a thing
  of the level, and a box that changes its shape while the child
  plays.
- **D228 — The start card lies over the whole window.** The owner's,
  2026-11-14, in the words above. The start card is centred in the
  window, over a dim that covers the whole page, with the window's
  height less 12 px above and below for its room. It is up to 760 px
  wide, 94% of the window's width at most; its text is 17 px where
  the page's is 18, its title 21 px, and its margins are tight. The
  dim takes no click: a button of the page that the card does not
  cover works under it and closes the card (D222). At 1024 by 700,
  the smallest screen the game is made for (D38), and on any larger
  one, no start card of the game scrolls, in either language: a text
  that outgrows that fails the check. In a smaller window a card
  still too tall scrolls, by D222. The win card and the outcome's
  cards stay over the scene, inside its frame, beside the child's
  program. Rules out a start card held inside the scene's frame, and
  a text left to scroll on a screen the game is made for.
- **D229 — The race's finish is the cell past the painted line.** The
  owner's, 2026-11-14 (*se puede hacer que tanto él como el mago
  aterricen pasada la meta; añade la misma distancia a todos, así que
  no cambia nada, solo hay que cambiar la celda objetivo*). The line
  and its poles are painted at the middle of column 31; a race's
  `finish` and the last cell of the racer's path are in column 32,
  (32,8) and (32,12), where each racer lands, the racer clear of the
  lower flag's pole. It is the levels' data alone: a flight is one
  cell longer for both, 43 ticks, and every count one tick more.
  Rules out a racer landed on the line, half hidden by the pole, and
  a finish moved for one racer alone.
- **D230 — What an address names with its version is kept for good.**
  The owner's yes, 2026-11-14, to the designer's proposal. The page
  asks for every file under `content/` with the world's stamp in its
  address (`?v=<stamp>`), the stamp that covers every file shipped
  there, and for Python's own files in a folder named by Pyodide's
  version. The friends' server keeps both for good, as it keeps
  `/assets/`; a file asked for with no stamp, the page itself and
  `world.zip` are asked again on each load. A new build changes the
  stamp, and with it every address. Rules out a trip to the server
  for each file that has not changed, and a file kept for good under
  an address that a later build fills with something else.
- **D231 — The page's sound sleeps while nothing sounds.** The
  owner's yes, 2026-11-14, to the designer's proposal. The page's one
  sound context is suspended once no theme plays or fades, no wind
  blows and the last sound ended three seconds ago, and is resumed
  before the next sound. The music's rule of the hidden tab holds
  (D192). Rules out a sound engine working behind a page that makes
  no sound.

## 2. What is asked

### 2.1 The ring's rim (D226)

**The world.** In `Wizard._move` (`world/kydux_world/world.py`), the
first check of each step, before the friend, the forbidden cell and
the rest: when the wizard is inside a ring's cell (`self._k_ring` is
not `None`) and the direction is `LEFT` or `RIGHT`,

```python
world.refuse(<the ring's id>, "ring_rim", list(here), facing=direction.value)
```

`refuse` is D183's and D215's: it takes the tick, makes the event
`blocked` with `tried: true`, sets the run's error and raises
`Refused`, which `explain.py` turns into the explanation `ring_rim`
with the ring as its `thing`. Nothing else of the world changes.

The designer tried these three lines in a copy of the world. The whole
Python suite passes with them, 2396 tests, and every solution, every
`wrong/` program and every starting code of *Los aros*, *La carrera*
and *La revancha*, in both languages, gives the same events tick for
tick: no program of the game leaves a ring by its side.

What the world does, case by case. `the-rings` starts at (4,9), its
first ring `ring_1` at (5,8), flown upward:

| program, after `wizard.cast("drevo")` and `wizard.move_right(1)` | what happens |
|---|---|
| `move_up(1)` then `move_right(1)` | refused at that line, tick 4: `blocked`, `at` [5,8], `by` `ring_1`, `reason` `ring_rim`, `tried` true, `facing` `right`; status `error`; the wizard at (5,8), flying; no `through`, no `wrong_way` |
| `move_up(1)` then `move_left(1)` | the same, `facing` `left` |
| `move_up(1)` then `move_up(1)` | `through`, as `move_up(2)` |
| `move_up(1)` then `move_down(1)` | no event of the ring's, the program goes on; the ring is not flown |
| `move_up(1)` and the program ends | no error; the wizard stays in the air inside the ring; the level is not won |
| `move_up(2)`, `move_right(2)`, `move_down(1)` then `move_right(1)` | the second ring, entered along its way, refuses the same; a ring entered against its way refuses the same too |

In `the-race`, start (6,8) and `ring_1` at (7,7), the same four lines
stop the program at tick 8, Ilda reading the four lines first, a tick
each: the race is not flown out, no `circle`, both of its goals failed.

Unchanged, and each kept by a test that exists: a ring's cell flown
into from its side, or walked into, bumps and the program goes on
(`bump`, `by: ring`, *¡He chocado con el aro!…*); a ring flown
against its way shakes, says its way and counts as missed
(`wrong_way`); `drevo` cast inside a ring is refused (`no_landing`).

**The page.**

- `app/src/engine/words.ts`, `blockedText`: `ring_rim` gives
  `blocked.ring_rim`.
- `app/src/ui/outcome.ts`: `ring_rim` gives `error.ring_rim`, as
  `no_landing` gives its own.
- `app/src/engine/scene.ts`, `case 'blocked'`: for `ring_rim` the
  bump's sound, as for `no_landing`, and the wizard nudged the way it
  turned, as a bump nudges it. The turn (`facing`), the thought and
  the ring's shake (`tried`, `by` the ring) come from what the case
  does for every refusal. The thought stays its reading time and the
  card waits for it (D175).

**The texts.** Three, in 2.8.

**A wrong program**, `content/levels/the-rings/wrong/turned_inside_the_ring.py`:

```python
wizard.cast("drevo")
wizard.move_right(1)
wizard.move_up(1)
wizard.move_right(2)
wizard.move_down(2)
```

It is refused at line 4, tick 4, the wizard at (5,8). The content
tests that read `wrong/` hold it, and `docs/dev/course.md`'s row of
`the-rings` names it with the others.

**Tests.**

- `world/tests/test_broom.py`, beside the ring's: the six rows of the
  table above, each as a test or a case of one; the race's four lines;
  and one that runs every solution and every `wrong/` program of the
  three ring levels and finds no `ring_rim` but in
  `turned_inside_the_ring`.
- Vitest: `words.test.ts` and `outcome.test.ts`, the new reason beside
  `no_landing`.
- `app/e2e/chapter-4.spec.ts`, modelled on the test of `drevo` over
  the water: `the-rings` run with the wrong program; `data-thought`
  is the owner's sentence, `data-sounds` holds the bump, the outcome
  shows the error's words and no win card, `data-flying` holds the
  wizard, `data-wizard` is `5,8`; a screenshot for the report.

**The documents.** In `architecture.md`, the events table's row of
`blocked` gains `ring_rim` (`by` the ring, with `facing`, D226) and
`no_landing`, which it lacks (`drevo` over a cell no one walks on,
D215), and its scene column says the bump's sound of both. The code's
comments at `_move` and at `case 'blocked'` say the rule in the
present.

### 2.2 The finish past its line (D229)

**The picture.** The scene `the-race-course` paints the finish line
and its two poles at the middle of column 31. The lower pole's foot is
at (31,14) and its flag hangs over column 32, between rows 10.6 and
11.3. Zarek, landed at (31,12), stands behind that pole; the wizard,
landed at (31,8), stands on the line. A figure is a cell tall inside
its row: at (32,12) Zarek is right of the pole and under the flag, in
the clear, and at (32,8) the wizard is just past the line.

**The data**, and nothing of the world's code. In
`content/levels/the-race/level.json` and
`content/levels/the-rematch/level.json`: `end` and `race.finish` are
`[32, 8]`, and the last cell of `race.path` is `[32, 12]`. The racer
crosses at the last cell of his path and the wizard at `finish`, and
each lands there. Whatever the page draws at `end` goes with it.

**The programs.** Each flies one cell more at its end:

| file | its last flight to the right |
|---|---|
| `the-race/solution.py`, `wrong/a_pair_skipped.py`, `wrong/the_pair_upside_down.py` | `two_rings(3, 2)` |
| `the-race/wrong/eighteen_lines.py` | `wizard.move_right(2)` |
| `the-race/wrong/the_arguments_turned_round.py` | `two_rings(2, 3)` |
| `the-rematch/solution.py`, `wrong/a_pair_missed.py` | `two_rings(2, 2)` |
| `the-rematch/wrong/the_race_s_program.py`, and the starting code of `the-rematch` in `text.es.json` and `text.en.json` | `two_rings(3, 2)` |

`the-rematch/wrong/only_the_first_move.py` stays. The starting code of
*La revancha* is the program that won *La carrera*, so its last line
follows the race's solution; no other text of either level names a
distance or a tick.

**The counts.** The designer made these changes in a copy of the two
levels and ran every program. Each crossing is one tick later, the
racer's too, and every outcome is the one of today:

| program | crosses at | Zarek at | outcome |
|---|---|---|---|
| `the-race` solution | 54 | 61 | won |
| `the-race` `a_pair_skipped` | 60 | 61 | incomplete: a pair not flown |
| `the-race` `eighteen_lines` | 61 | 61 | a tie, flown again |
| `the-race` `the_arguments_turned_round` | 74 | 61 | incomplete |
| `the-race` `the_pair_upside_down` | 100 | 61 | incomplete |
| `the-rematch` solution | 54 | 61 | won |
| `the-rematch` `a_pair_missed` | 60 | 61 | incomplete |
| `the-rematch` `only_the_first_move` | never | 61 | incomplete |
| `the-rematch` `the_race_s_program` | 89 | 61 | incomplete |

The card's count reads *tus líneas (11) + tu vuelo (43) + la
penalización (0) = tick 54. Zarek: 18 + 43 = tick 61*.

**The circles of a missed ring** are served over the cell before the
finish, which is (31,8), the line's own cell: the wizard circles on
the line and crosses it after. Left so, and said to the owner; a
circle served a cell further back would need the world to know the
line apart from the finish.

**The story** `content/stories/the-finish/story.json` opens on the
race's end and is staged again on the same cells: the wizard starts at
(32,8); Zarek flies to (32,12) and lands; Ilda walks to (33,8) and
turns left, and no further; the wizard walks from (32,9) to (35,9).
The others stand and walk as they do. The story's check and its
browser test hold, and its pictures are looked at.

**Tests and documents.** Every test that names the finish's cell, a
crossing tick or one of these last arguments is brought to the table:
`world/tests/test_broom.py` (the race's and the rematch's),
`app/e2e/chapter-4.spec.ts` (*tick 53*, *Zarek: 18 + 42 = tick 60*,
the tie's text, the rematch's *tick 53*), the story's and the
walkthrough's specs where they name column 31. `docs/dev/course.md`'s
rows of the two levels and of the story say the new numbers. A
fixture that only needs two equal ticks may keep its own.

### 2.3 The start card over the whole window (D228)

**What is wrong.** A card is held inside the scene's frame
(`.card-overlay` is laid in `.scene-frame`, which clips), 440 px wide
at most. At 1280 by 800 the frame is 562 px high and a card has 544;
the designer measured every start card and every win card of the game
there, in Spanish:

- 25 of the 37 start cards scroll. The longest: *La revisión* 989 px
  of text in 544, *Los aros* 948, *La puerta de Eldra* 908, *La
  carrera* 882, *Las escobas de la pared* 869.
- 1 win card scrolls, *La revisión*'s, by 5 px.

Wider alone, inside the frame, is not enough: a card of 640 px
leaves 13 scrolling. The window has the room.

**What is asked.**

- The start card is laid over the whole window, not over the scene:
  centred in the window, the dim over the whole page. Its room is the
  window's height less 12 px above and below. It is the same card
  opened with a level and opened again with `?`.
- It is `min(760px, 94%)` of the window's width. Its text is 17 px
  where the page's is 18, and its title 21 px where a card's is 22;
  the line's height stays. Its margins are tight: the card's padding
  14 px 22 px, 4 px under its title, `.card-said` 4 px above and 8 px
  under, `.start-goals` 2 px above and 10 px under.
- The dim takes no click. A button of the page that the card does
  not cover works under the dim, closes the card and does what it
  does, as D222 asks; the buttons the card covers wait for it to
  close. D222 holds whole: the card opens at its top, its button
  takes the keyboard without scrolling, Escape and its own button
  close it.
- The win card (440 px; the race's 600 px) and the outcome's cards
  stay where they are, over the scene and inside its frame, beside
  the child's program, with their widths and their letters. Every
  card takes the padding 14 px 22 px, which gives *La revisión*'s win
  card the 5 px it lacks (517 px in 512 today).
- How it is laid is the programmer's: fixed to the window, in an
  element of the level's screen that leaves with it, kept right when
  the window is resized and when the panes stack under 800 px.

What it gives, measured by the designer with the card free of the
frame, 760 px wide, 17 px, with those margins, the 37 levels in each
language:

| start card | today, text in 544 px | asked, card's height |
|---|---|---|
| *La revisión* | 989 | 615 |
| *Los aros* | 948 | 601 |
| *La puerta de Eldra* | 908 | 590 |
| *El paseo nocturno* | 788 | 582 |
| *La carrera* | 882 | 568 |
| *Junto a las estatuas* | 842 | 556 |
| *La sala oscura* | 815 | 556 |
| *Las escobas de la pared* | 869 | 556 |
| *La llave que se mueve* | 800 | 539 |
| every other | less | 531 or less |

In English the tallest is 615 px too. The room is 776 px at 1280 by
800, 696 at 1280 by 720, 676 at 1024 by 700 and 626 at 1366 by 650,
the window of a browser on a laptop 768 px high: every start card
fits in the four. At 720 px of width two would scroll in the last;
at 18 px and 760 px, three.

**Tests.**

- A browser test at 1024 by 700, the smallest screen of D38, opens
  every level of the game in each language and holds that its start
  card does not scroll (`scrollHeight` no more than `clientHeight`)
  and lies inside the window. It is one page that goes from level to
  level, and it is the guard of D228: a text that outgrows the window
  fails it.
- The win card of *La revisión* and of *La carrera* at 1280 by 800
  does not scroll.
- With the start card open, *Ejecutar* clicked under the dim closes
  the card and runs the program.
- D222's tests (`app/e2e/cards.spec.ts`) hold; the one that needs a
  card taller than its room takes a window short enough for one.
  `app/e2e/screens.spec.ts` holds the start card inside the window,
  at its three sizes.
- A sweep on demand, as `tips-pictures.spec.ts` is on demand: every
  start card's height and what it scrolls by, in both languages, at
  1024 by 700, 1280 by 800 and 1366 by 650, written as a table. The
  report holds the table.

### 2.4 The goals box's two shapes (D227)

**What is wrong.** The goals box is one shape, up to 60% of the
scene's width at its top left corner. In *Los aros* and in *La
carrera* it lies over the top half of the first red pair, the pair
the child's first lines fly to. The page folds it only where it
covers the wizard, 400 ms after the level opens, before a child has
read it.

**What is asked.**

- **Two shapes**, the same words and the same marks in both, the
  heading folding both:
  - the **list**: the goals one under another, as today, in a column
    at the scene's top left corner, as wide as its longest goal and
    at most 300 px and 40% of the scene's width;
  - the **strip**: along the scene's top, from its left, the heading
    and then the goals one after another along the line, a goal on
    the line's rest where it fits whole and on the next where it does
    not; as wide as its words, and at most the scene's width less the
    box's margins.
- **What may not be covered**: the wizard, every other figure of the
  level, every thing of the level that is in sight at its start (a
  ring, a broom, a key, a book, the wand, a door the level names, a
  hole), and the end's mark. Each by its drawn rectangle on the page,
  as the wizard's is today (`SceneHandle.wizardBox`); the scene's
  handle gives them all (`SceneHandle.levelBoxes`). A thing that is
  hidden, and what the scene's picture holds of its own (a wall, a
  bed, a shelf, a statue), do not count. A shape covers something
  when its rectangle meets one of those.
- **The choice**, once the camera has drawn the level's start, where
  the fold is decided today: the list if it covers nothing; if it
  does, the strip if it covers nothing; if both do, the list, to be
  folded. The box is not shown before the choice, so that it never
  changes shape before the child's eyes. It is one function with no
  page in it, the two shapes' rectangles and the level's boxes in,
  the shape and whether to fold out.
- **The fold after three seconds**, where both cover something. The
  three seconds start when the child can see the box: the scene
  drawn, the start card closed and the screen's guide over,
  whichever is last. Then the page folds the box for that level
  alone, as `fold()` does today. A click of the child on the heading
  before that keeps the page from folding; after it, the heading
  opens and folds the box as ever. The program run in those three
  seconds changes nothing.
- **Once in a visit.** The shape is taken when the level opens. A
  start over, a change of the window's size and a change of language
  keep it; the strip's width follows the scene's. While a program
  runs and the camera follows the wizard, things pass under the box
  as they do today.
- The box says its shape in `data-shape` (`list`, `strip`), beside
  `data-folded`, for the tests.
- The fold of the child (D38: folded by the heading, it stays so for
  the visit) is as it is: a box the child has folded opens folded.

**What is expected.** In *Los aros* and in *La carrera* at 1280 by
800 the list would lie over the first pair, and the strip, about
110 px high, ends above the rings, which start 137 px under the
scene's top: the box opens as the strip and stays open. If the
measure says otherwise there, the box folds at three seconds, and
the report says it. Most levels inside the castle keep the list, on
the wall of the scene's top.

**Tests.**

- The function, with its cases: nothing under the list; something
  under the list and nothing under the strip; something under both.
- A sweep on demand: every level, in Spanish, at 1024 by 700 and at
  1280 by 800: the shape taken, or folded, and what each shape
  covered. The report holds the table, and the designer reads it.
- Browser tests on three levels the sweep names, one of each case:
  the list taken and still open after four seconds; the strip taken
  and still open after four seconds, nothing of the level under it;
  the box open two seconds after the start card closes and folded
  within four, then opened by its heading and left open. A fourth:
  the heading clicked twice inside the three seconds, and the box
  still open after four.
- `the-rings` and `the-race` at 1280 by 800: four seconds after the
  start card closes, no ring and no figure lies under the box.
- `app/e2e/chapter-3.spec.ts`'s test of the fold in `the-tunnel-exit`
  is brought to the rule; the shed's pegs stay clear of the box
  (`app/e2e/chapter-4.spec.ts`, D201).

### 2.5 The server's cache (D230)

**What is wrong.** The friends' server keeps `/assets/` for good and
asks again for everything else. Sprint 44 measured it: a screen
loaded with a full cache makes 9 to 69 trips, each answered *304, not
changed*, and on a slow network each trip costs 400 ms.

**The page.**

- One function gives the address of a file under `content/`, with
  `?v=<the world's stamp>` (`__WORLD_STAMP__`), and no address under
  `content/` is built anywhere else. The places that build one
  today: `engine/music.ts`, `engine/painted.ts` (its root, from which
  every picture of a scene is named), `content/lessons.ts`,
  `content/stories.ts`, `content/course.ts`, `content/levels.ts`,
  `content/guide.ts`, `ui/map.ts` (a `url()` in a style),
  `ui/portraits.ts`, `ui/waiting.ts` and `main.ts`. The stamp is the
  right version: `app/scripts/pack-world.mjs` makes it from the
  world's Python and from every file shipped under `content/`.
- Python's own files are served from `pyodide/<version>/`.
  `app/scripts/copy-pyodide.mjs` copies the five files into
  `public/pyodide/<version>/`, the version read from
  `node_modules/pyodide/package.json`, and removes any other folder
  or file of `public/pyodide/`. The build gives the page the version
  as it gives it the stamp, and `runtime/worker.ts` imports and loads
  from that folder.
- `world.zip`, `world-stamp.json`, `api.json`, `reserved.json`, the
  pages of *Qué es Kydux* and the page itself stay as they are asked
  today.
- The development server and the preview serve a file of `content/`
  whatever its query says.

**The server**, `deploy/nginx-kydux.conf`. At the file's top, beside
the server block:

```nginx
# A file asked for with the world's stamp never changes under that address.
map $arg_v $kydux_kept {
    default               epoch;
    "~^[0-9a-f]{12}$"     max;
}
```

and, in the server block, beside `/assets/`:

```nginx
location /content/ {
    expires $kydux_kept;
}
location ~ ^/pyodide/[0-9][^/]*/ {
    expires max;
}
```

Both with `expires` alone, never `add_header`, so that they inherit
the server's headers as the file's comment asks; neither with
`try_files`, so that a file that is not there is a 404 and never the
page. The comments of the file say the rule in the present.
`sudo nginx -t` is the owner's; the programmer checks the file with
`nginx -t -c` on a copy made to stand alone if the machine lets it
without sudo, and says in the report whether it could.

The order does not matter: a new build served by the server as it is
today works, each file asked again; the new file of the server with
the build of today keeps nothing for good, since no address of today
carries a stamp or a version's folder.

**The measure.** `app/e2e/load.spec.ts` serves a build as the server
does: its own server answers by the same rule (a stamp of twelve
hexadecimal digits under `/content/`, the version's folder under
`/pyodide/`). The measure of sprint 44 is run again on this build
(`KYDUX_LOAD=dist`), and the report gives its table beside sprint
44's: the trips of each screen with a full cache, and the time to the
screen on the slow network.

**Tests.** A browser test that opens the start, the map, a story, a
lesson and a level of a painted scene, with the music playing, and
holds that every request under `/content/` carries the page's stamp
and that every request under `/pyodide/` is under the version's
folder. A Vitest for the function.

**The documents.** `docs/dev/dev-environment.md`: section 4 where it
tells of the stamp, section 5 and section 11 where they tell what the
server keeps and that the server's file is installed again after
this build (`sudo ci/deploy.sh --site`), section 6 where it tells of
`load.spec.ts`. Written to be followed.

### 2.6 The sound asleep (D231)

**What is wrong.** Once the page has made its first sound, the sound
context runs for the rest of the visit. Sprint 44 measured the page
at rest in a level, per 10 s: 0.01 s of processor before any sound,
0.26 s after one with the music off, about 1.2 s with the music
playing. The gain is for the child who plays with the music off, and
for every screen where no theme plays.

**What is asked.** One place owns the context's sleep, beside
`audio()` in `app/src/engine/sfx.ts`:

- The context is awake while any of these holds: a theme plays or
  fades (`music.ts`), the wind blows (`sound.ts`), or a sound's end
  is less than three seconds behind. Otherwise it is suspended.
- Whatever is about to sound resumes it first, as `play()` and
  `Wind.start()` do today, and schedules on the context's clock,
  which stands still while it sleeps: the sound is whole.
- The music's own rule stays: still while the tab is hidden, and
  resumed when it shows only if something is to sound.
- The root element says the state, `data-audio`: `asleep` or `awake`,
  nothing before the first sound.

**Tests.** Vitest with a context that counts its `suspend` and
`resume`: asleep three seconds after a sound with the music off;
never while a theme plays, fades or the wind blows; awake again
before the next sound is scheduled. A browser test with the music
off: a program run, `data-audio` goes to `asleep`, the program run
again, `data-sounds` holds its steps and `data-audio` is `awake`. The
measure of sprint 44 again, the three cases, in the report; and the
programmer listens to the first sound after a sleep and says in the
report whether it comes late or clipped.

### 2.7 The tips' pictures

`app/e2e/tips-pictures.spec.ts` takes *notebook*, *spells* and
*click* in `the-rings`, and *lesson* in `checking-each`: a child who
waits for chapter 1's first scene is shown `drevo`, `def` and a loop
over a list. They are taken where a child of chapter 1 has been:

| tip | where | what is seen |
|---|---|---|
| `notebook`, `spells`, `click` | `the-sealed-door` (chapter 1, the level after the first spell's lesson) | the notebook's actions; its spells tab, with `zelim` alone; a move clicked into the program |
| `lesson` | `how-much`, the page that holds its block | `wizard.move_right(3)` run on the page, with what it says of the walk (`.lesson-said`; the block prints nothing) |

`dot`, `hint`, `timeline`, `zoom`, `keys` and `map` are of chapter 1
or of no chapter and stay as they are taken. The eight pictures, four
tips in two languages, are made again with the spec
(`KYDUX_TIP_PICTURES=1`), each 640 by 360 and under 40 KB, looked at
one by one before they are committed. The spec's own check of sizes
and the content test of the tips hold. Where a document or a comment
names the level a picture is taken in, it names the one of this
table.

### 2.8 The texts (Gemini)

Three new texts. No text a child reads is changed but one line of
Python, the last of the rematch's starting code (2.2), which is not
Gemini's.

- `blocked.ring_rim` in Spanish is the owner's, letter for letter,
  with the full stop every thought ends in:
  **Oh, giré demasiado pronto y rocé el aro.** It is not sent to
  Gemini.
- `blocked.ring_rim` in English and `error.ring_rim` in both
  languages are Gemini's, from one brief,
  `tools/write/briefs/sprint-45-the-rings-rim.md`: the bible, the
  course, the ring's texts as they are (`blocked.ring`,
  `blocked.ring_way.*`, `error.no_landing`, the goals' line of the
  rule), the owner's sentence, and the rules: no *manera*, no *way*
  told (D204), no metaphor, the knot's words (D224). The card's text
  says, in two short sentences as `error.no_landing` does, that the
  broom turned while it was still inside the ring and rubbed its rim,
  so the program stops there, still in the air; and that a ring is
  left by its other side, one step more upward or downward, before
  turning.

The programmer reads the drafts, corrects them and says in the commit
what was corrected. The page of the texts for the owner, in
`drafts/`: the three, each *Antes: no existía.* and *Ahora:*; the
rematch's starting code, *Antes:* and *Ahora:*; and the race's card
with its count, *Antes:* (53 against 60) and *Ahora:* (54 against
61).

### 2.9 What is left out, and why

- **The code's letter (D223)**: the owner has not chosen among the
  three; the chooser stays under `?debug`.
- **Python fetched after the first screen**, sprint 44's third
  proposal for the load: not asked.
- **A card in two columns, or shorter texts**: what is left to do if
  a card still scrolls in the owner's window. It waits for what the
  owner sees.
- **The win card and the outcome's cards over the whole window**:
  not asked; they stay beside the child's program.
- **A goals box that changes shape as the camera moves**: the shape
  is the level's start's.
- **Words said on the scene kept clear of the open goals box.**
- **The circles of a missed ring a cell before the line** (2.2).

### 2.10 What the owner will try

**The ring's rim**, in *Los aros* (chapter 4, Mejora 1):

1. This program, run:

   ```python
   wizard.cast("drevo")
   wizard.move_right(1)
   wizard.move_up(1)
   wizard.move_right(1)
   ```

   The wizard flies into the first red ring and stops inside. It
   turns to the right, the bump sounds, the ring shakes, and the
   wizard thinks *Oh, giré demasiado pronto y rocé el aro.* The
   program stops; the card says why and names line 4. The wizard is
   still in the air, inside the ring.
2. The last line as `wizard.move_left(1)`: the same, to the left.
3. The last line as `wizard.move_up(1)`: the ring lights, nothing is
   said.
4. The same four lines in *La carrera*: the same, and the race is
   not flown out.

**The finish**, in *La carrera* (Práctica 7):

5. The race won, with *Escribir la solución* under `?debug` or with
   the owner's own program, its last call `two_rings(3, 2)`. The
   wizard lands past the line. Zarek lands past it too, right of the
   pole, whole. The card says *tick 54* for the wizard and *tick 61*
   for Zarek.
6. *La revancha*: its starting code ends in `two_rings(3, 2)`, and
   the race won lands the same.
7. The story after it: everyone meets past the line.

**The start card:**

8. *Los aros*, *La carrera* and *La revisión* opened from the map, or
   their `?` button: the start card lies over the whole page, wider
   than it was, its letters a little smaller, and shows its text
   whole, with no scroll. So does every other level's.
9. With the card open, *Ejecutar* clicked beside it: the card closes
   and the program runs.

**The goals box:**

10. *Los aros*, the start card closed: the goals box is a low strip
    along the scene's top, and the first red pair is seen whole under
    it. It stays open.
11. A level the report names, where the list covers nothing: the
    box is the list at the scene's corner, narrower than it was.
12. A level the report names, where both shapes would cover
    something: the box is open for three seconds and then folds by
    itself. A click on *Objetivos* opens it, and it stays open.

**The rest:**

13. The tips' page of the hand-over: the notebook, the spells, the
    click and the lesson are chapter 1's.
14. The report's two tables: the trips to the server before and
    after, and the processor's time with the sound asleep. Nothing of
    the cache is seen on the owner's own server on 5173. On the
    friends' server it works after the next deploy, with one command
    more, once: `sudo ci/deploy.sh --site`.

## 3. The pieces

### 3.1 The ring's rim (D226, 2.1, 2.8)

The world's refusal with its tests; the page's words, sound and
nudge with theirs; the brief, Gemini's drafts corrected and the three
texts in `i18n/es.json` and `i18n/en.json`; the wrong program; the
browser test; the events table, `course.md`'s row and the comments.
One commit; its message says what was corrected in Gemini's drafts.

### 3.2 The finish past its line (D229, 2.2)

The two levels' data, the eight programs and the rematch's starting
code in both languages, the story staged again, the tests and
`course.md` brought to the table of counts. The race won and the
story's last step are looked at in the browser before the commit:
both racers past the line, Zarek clear of the pole and of the flag.

### 3.3 The start card over the whole window (D228, 2.3)

The start card's place, width, letters and margins, the dim that
takes no click, every card's padding, the tests, the sweep on demand
with its table kept for the report, the comments of `cards.ts`,
`level.ts` and `style.css` in the present.

### 3.4 The goals box's two shapes (D227, 2.4)

The scene's boxes, the two shapes, the choice's function with its
tests, the fold after three seconds, the browser tests, the sweep on
demand with its table kept for the report, `goals.ts`'s heading
comment in the present.

### 3.5 The server's cache (D230, 2.5)

The function and its eleven places, Pyodide's folder, the server's
file, `load.spec.ts`'s server, the tests, the measure run again, the
documents.

### 3.6 The sound asleep (D231, 2.6)

The sleep's one place, the root's attribute, the tests, the measure.

### 3.7 The tips' pictures (2.7)

The spec taking the four tips in chapter 1, the eight pictures made
again and looked at, the documents that name where they are taken.

### 3.8 The whole check, the hand-over and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4.
The whole `ci/check.sh --e2e`, in a copy, with Playwright's own
server on 4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough made again whole, in its one arrangement
  (D216), as sprint 44's; the report names the pages that differ
  from the one the owner is reading: *La carrera*, *La revancha* and
  the story of the finish;
- the page of the texts for the owner (2.8);
- the ten tips with their pictures in Spanish, as sprint 44's page;
- the report in Spanish, with pictures of this commit only: the rim
  rubbed in *Los aros*, with the thought and the card; the race won,
  both racers landed past the line, with its card; the story's
  meeting past the line; the start cards of *La revisión*, *Los
  aros* and *La carrera* at 1280 by 800, whole over the page, and
  one of them at 1366 by 650; the table of the cards' sweep; the
  goals box as the list, as the strip and folded after its three
  seconds, a level each, *Los aros* among them; the table of the
  box's sweep; the load's table beside sprint 44's; the processor's
  table; what was built piece by piece; every choice the plan left
  and how it was taken; what Gemini's drafts needed corrected; and
  the owner's fourteen steps of 2.10, written to be followed.

## 4. Gemini images

None. One text brief.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-45.md (this plan, whole), docs/dev/sprint-44.md (what
you built last), and the memory notes kydux-two-agents,
kydux-sprint-44-state, kydux-designer-review-44,
kydux-designer-sprint-45-plan and kydux-checks-per-piece. The
designer's commits after yours (8e10cc4 to the plan's last) fix two
things of the words said on the scene and enter this plan and its
decisions (D226 to D231, with D38, D187, D189, D219, D220 and D222
brought to them): read them with git log -p 8e10cc4..HEAD before you
start. The decisions are written as built; the code is yours to bring
to them.

Build sprint 45 whole: pieces 3.1 to 3.8 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173; never a push,
never a timer, never a deploy: nothing is released until the owner is
happy with chapter 4. Never stop or build into the servers on ports
443 and 5173, never reload or test nginx with sudo, and stop your own
preview when you are done. No image is asked of Gemini; the key stays
in ~/.config/kydux/secrets.env and never enters a file of the tree, a
commit, a log or the report.

What the owner will look for:
(1) inside a ring, a move to the left or to the right rubs its rim:
    the wizard turns that way, the bump sounds, the ring shakes, the
    wizard thinks "Oh, giré demasiado pronto y rocé el aro." and the
    program stops at that line with its card, the wizard still in
    the air inside the ring; a move on upward or downward, or back
    out, goes as it does today;
(2) the race's finish a cell past the painted line, by the levels'
    data alone: the wizard lands at (32,8) and Zarek at (32,12),
    clear of the pole; the race is won at tick 54 against 61, the 18
    lines tie at 61, and no outcome of any program changes; the
    story of the finish staged on the same cells;
(3) the start card out of the scene, over the whole window: up to
    760 px wide, its text 17 px, the dim over the whole page and
    taking no click; at 1024 by 700 and larger no start card of the
    game scrolls, in either language, and a test holds it; the win
    card and the outcome's cards stay on the scene; D222 whole;
(4) the goals box in two shapes, a list and a strip: the page takes
    the one that covers nothing of the level (the wizard, a figure,
    a thing in sight, the end's mark), never changing shape before
    the child's eyes; where both cover something the box is open
    three seconds and then folds by itself; in Los aros and La
    carrera the first pair is seen whole;
(5) every file of content/ asked for with the world's stamp and
    Python's files from a folder of their version, and the server's
    file keeping both for good; the load measured again beside
    sprint 44's;
(6) the sound's context asleep while nothing sounds, with the
    processor's time measured again;
(7) the tips' pictures of the notebook, the spells, the click and
    the lesson taken in chapter 1 (the-sealed-door, how-much).

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. The owner's
sentence is entered letter for letter and never sent to Gemini to be
written again; Gemini writes the other three texts from the brief,
and you correct its drafts and say what you corrected. Never edit
content while a browser run is going. Every document and comment in
the present. Before git add, read git diff of each file and stage
only your own hunks; commit promptly.

Hand over, in drafts/ and never committed: chapter 4's walkthrough
made again, the page of the texts, the ten tips with their pictures,
and the report in Spanish as 3.8 asks, with the owner's fourteen steps
of 2.10. Write your memory note kydux-sprint-45-state, and end with
the prompt for the designer's review in English, in a code block.
```
