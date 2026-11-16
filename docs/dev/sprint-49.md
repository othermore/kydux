# Sprint 49 — A start card at every opening, a wait that moves, the keys that move a line in, the rings told as the next practice, the castle's painting read at the opening, and a wind counted from its own plan

On 2026-11-16 the owner played sprint 48 and wrote what they saw and
heard, in their words:

> El audio: hay un sonido fuerte en los sonidos (tanto de un paso
> como de varios) justo al principio, que suena casi como el disparo
> de una escopeta. Ese hay que quitarlo o suavizarlo mucho, no puede
> sonar tan fuerte como si fuese un golpe o un disparo, aunque está
> bien que haya un primer sonido de despegar claro. El añadir "rest"
> mejora algo el sonido, pero sigue sin estar bien. Me gustan los
> cambios aleatorios, la clave es que coincidan un poco con el
> principio y el final de los movimientos (cambios de dirección),
> pero no siempre tiene que haber un "golpe de viento" por paso
> volado.
>
> En la página de carga (los tips) se debe ver más grande el
> cargando, y debe haber alguna animación que haga ver que se está
> cargando (o un progreso)
>
> No sé si ya lo hacemos, pero si no lo hacemos hay que hacerlo:
> Cuando se enseñe el primer "anidamiento" (if o for o while) hay que
> explicar el tabulador (la tecla tabulador del teclado) y los 4
> espacios, y decir que en nuestro editor el tabulador se usa para
> poner cuatro espacios y que borrar también borra cuatro espacios
> seguidos. Quizás haga falta una página para poner todo eso.
>
> No sé por qué hay veces que la trarjeta inicial de un nivel no se
> está mostrando: por ejemplo cuando se carga capitulo 4 arreglo 1,
> no se muestra en ningún momento el cuadro de que nos hemos dejado
> algunos nudos pendientes. Además ahi aparece un botón "Enseñame la
> pantalla" que creo que no hace falta tenerlo, eso solo hay que
> mostrarlo en el primer capítulo al principio del todo.
>
> En capitulo 4 mejora 1 empezamos directamente con la prueba de los
> aros sin haber dicho antes nada de que tras cruzar el lago toca
> otra prueba. Hay que empezar diciendo algo así como "¡Sigamos
> practicando! Los aros son una forma muy buena de aprender a
> controlar los giros...."
>
> Respecto a pantallas anteriores:
> Acabo de ver que al empezar la historia se muestra una imagen del
> castillo junto al lago. Hasta ahora no la había visto porque el
> nivel carga enseguida. Hay que dejar esa imagen ahí al menos unos
> segundos para que se vea.... Quizás con un texto propio que sea
> "Este es el castillo de Arvelia, la escuela para magos y
> magas...".

The designer looked for the cause of each before planning it.

- **The shot.** It was a fault of the code, not of the wind's
  numbers, and the designer has mended it (`setNow`,
  `engine/sound.ts`, in a commit of its own before this plan). A
  wind's nodes are made when its first gust starts. Each gust
  begins by holding the level its gain has at that moment
  (`fromNow`), read from the node. In a browser, a gain just made
  and only scheduled to 0 still reads 1, a gain's default, until
  the sound's clock has rendered it. The first gust after every
  silence so started at full gain, more than fourteen times its
  loudest level, and fell to its level in its rise: a bang. The
  unit tests did not see it because their stand-in for a node
  answered a scheduled value at once, as no browser does; the
  stand-in is now as the browser.
- **A puff for every flown step.** D243 as it was built: every
  flown command draws a peak of its own and rises to it in three
  tenths of its length, 60 ms for a one-cell move. A zigzag of
  one-cell moves is a new jump of the level every 133 ms.
- **The small *Cargando…*.** A grey status line of the page's
  small size under the mark (`waitingView`), and nothing that
  moves.
- **The Tab key.** Nothing in the course tells it. The editor
  already does all the owner asks: Enter after a colon starts the
  next line four spaces in, Tab puts four spaces, and the delete
  key in a line's leading spaces takes four away
  (`editor/editor.ts`, tried by the designer in a lesson's block).
  The first lines inside another are in `lesson:if`, chapter 3's
  lesson 5.
- **The card that does not open.** `level.ts` opens the start card
  only the first time a level is ever played: the game keeps the
  levels whose card was seen (`progress.started`). The owner had
  opened *La revisión* in an earlier sprint. The guide's button
  is on any level's card that is opened again (`onGuide`).
- **The rings with no word before.** After *El primer vuelo* comes
  the lesson of `def`, and then *Los aros*' card begins with the
  rule of the pairs. Nothing says that the practice goes on.
- **The painting never seen.** The opening shows the welcome's
  painting only while its scene loads (D214), and the scene loads
  at once.

The same day, with the shot gone, the owner listened again on the
debug page, moved the wind's sliders, and answered:

> El vuelo suena bien así: El viento de la escoba: air 1.10, rest
> 0.50 -- Pero el sonido de descender se parece mucho al de
> ascender. El de descender debería ser un poco más pausado, como si
> se "apagase" el sonido.
>
> Ante una puerta cerrada veo bien lo del pensamiento como está por
> ahora. Y me parece bien que las pruebas de github que se pasan de
> tiempo se dejen para lanzar a mano pero no se lancen

And of the game's mark:

> podemos cambiar el logotipo de kydux que es un gorro de mago y una
> varita para que sean igual pero la varita de madera en vez de
> negra, y el gorro marrón oscuro en vez de negro (el gorro puede
> ser negro también si queda mejor, pero la varita tiene que ser de
> madera)

Of the trials shown: *me gusta la opción D de los logos*, the hat
in ink.

And of the landing as the designer built it from this answer, a
hum that falls, heard with the programmer already building:

> no está mal del todo pero es demasiado llamativo creo. Estaría
> bien si en los últimos segundos del vuelo antes de aterrizar se
> subiese un poco el sonido rest progresivamente, y luego fuese ese
> sonido el que se apagase cambiando a un tono más bajo y bajando el
> volumen progresivamente. Así quizás conseguimos mejor el efecto.

Of three trials of that, on a page that played whole flights with
the game's own wind: *veo bien la opción C. Si más adelante quiero
le damos otra vuelta.*

What follows from the answer, all of it but the landing's last
word done by the designer in commits of its own before the
programmer starts:

- **The wind stays a gust for each flown command**, as it is built
  and as the owner now hears it. Its mix as written is the
  owner's: the air at 1.1, the whistle at 1, the rest on at 0.5
  (`WIND_WRITTEN`, D252). This plan asked first for one wind for
  a whole stretch of flight; that is out (2.8). What stays for the
  programmer is small: the wind's level counted from its own plan
  and never read back from a node (2.6).
- **The landing is a thing switched off** (D253). The owner's
  second word on it: *tiene que ser un sonido que vaya bajando de
  volumen y cambiando el tono para que suene como un aparato que
  se apaga*. The designer built it as a sound of its own, a hum
  and its air that fall (`set_down`, `engine/sfx.ts`). The owner
  heard that one as too striking and asked for the wind itself:
  its rest rises as the landing nears and is then switched off
  (D255). That is the programmer's, piece 3.8, added while the
  sprint is built (2.9).
- **The thought at a locked door** stays as it is.
- **The browser tests on GitHub** run only when started by hand
  (D179, `.github/workflows/check.yml`).
- **The mark's wand is wood** (D254, `ui/mark.ts`,
  `favicon.svg`).

What this sprint holds:

1. A level's start card opens every time the level opens, and
   *Show me the screen* is on the first level's card alone (D248).
2. The wait shows *Cargando…* large, beside the mark, and a bar
   that moves (D249).
3. `lesson:if` has a page for the four spaces and the keys that
   put them and take them away (D250).
4. *Los aros*' card opens by saying that the practice goes on, and
   why the rings.
5. The opening's first two steps are told over the painting of
   the castle (D251).
6. The wind's level is counted from its own plan and never read
   back from a node; by ear the wind is the one the owner has
   approved (D252).
7. The landing is the wind switched off: the rest rises over the
   flight's last second and a half, and at the landing it sinks
   in pitch and in loudness to nothing (D255).

The rules of the earlier sprints hold: pieces in order, one local
commit each, `ci/check.sh` and the browser specs a piece touches green
before it, the whole `ci/check.sh --e2e` once before the last commit;
never a push, never a timer, never a deploy; the servers on 443 and
5173 untouched; documents and comments in the present; every text
the child reads is Gemini's or the owner's own.

## 1. Decisions taken here

All are entered in `docs/dev/architecture.md` with this plan, where
they are told whole; D243 names D252, D68 is brought to D248, and
D61, D214 name D249 and D251. D253 and D254 are the designer's,
built with their entry; D179 is brought to the owner's answer.

- **D248 — The start card opens a level every time, and the guide
  is offered on the first level alone.** The owner's (*no se
  muestra en ningún momento el cuadro*; *eso solo hay que mostrarlo
  en el primer capítulo al principio del todo*). The game keeps no
  list of the cards seen. Rules out a level opened with no word of
  what it asks.
- **D249 — The wait says that it loads: large words and a bar that
  moves.** The owner's (*se debe ver más grande el cargando, y debe
  haber alguna animación … (o un progreso)*). A band sweeps while
  the screen loads; the bar fills while a tip holds a ready
  screen. Rules out a wait in which nothing moves.
- **D250 — The first lines moved in teach the keys that move
  them.** The owner's (*hay que explicar el tabulador … y los 4
  espacios … y que borrar también borra cuatro espacios
  seguidos*). A page of `lesson:if`. Rules out a child who counts
  spaces one by one.
- **D251 — The opening's first steps are told over the painting of
  the castle.** The owner's (*Hay que dejar esa imagen ahí … Quizás
  con un texto propio*). A story's first steps may be told over
  its still; the reader goes on at *Next*. Rules out a painting
  seen only while something loads, and a timer that holds it.
- **D252 — A wind starts from nothing, and its mix is the
  owner's.** The owner's (*suena casi como el disparo de una
  escopeta. Ese hay que quitarlo*; *El vuelo suena bien así: … air
  1.10, rest 0.50*). The level is counted from the wind's own
  plan. Rules out a bang at a start, a level read back from a
  node, and a written mix that is not the owner's.
- **D253 — The landing is a thing switched off.** The owner's
  (*debería ser un poco más pausado, como si se "apagase" el
  sonido*; *como un aparato que se apaga*). Built by the designer.
  Rules out a landing that is the lift played backwards, and one
  that is heard as a thump.
- **D254 — The mark's wand is wood.** The owner's (*la varita
  tiene que ser de madera*; *me gusta la opción D*). Built by the
  designer. Rules out a wand in ink.
- **D255 — The landing is the wind itself, which rises as the
  ground nears and is then switched off.** The owner's (*que se
  subiese un poco el sonido rest progresivamente, y luego fuese
  ese sonido el que se apagase*; *veo bien la opción C*). Added
  while the sprint is built; the programmer's (2.9, 3.8). Rules
  out a sound of the landing's own laid over the wind, and a
  landing cut short by the run's end.

## 2. What is asked

### 2.1 The start card at every opening (D248)

**The page.**

- `ui/level.ts`: where the level's screen opens, after
  `progress.setCurrent`, `showStart()` is called, always.
- `progress.hasStarted`, `progress.markStarted` and the store's
  `started` (its type, its default, its reading) go, with their
  tests. A saved game that has `started` is read without it, and
  an exported game has none.
- `main.ts` gives `loadGuide` to the course's first level alone;
  `guideFirst` goes from the screen's parts. In `level.ts`:
  closing the start card opens the guide where `parts.loadGuide`
  is given and `progress.guided()` is false; the card offers
  *Show me the screen* (`onGuide`) where `parts.loadGuide` is
  given and `progress.guided()` is true, whether the card opened
  by itself or with *?*.
- Nothing else of the card changes: *Start* the first time it
  opens in a screen, *Continue* when *?* opens it again; any
  button of the page closes it and does what it does (D222); it
  lies over the whole window and does not scroll (D228).

**Tests.**

- Vitest, `store.test.ts`: a stored game with `started` is read,
  and what is saved back has no `started`.
- Browser, `cards.spec.ts`: the test at line 21 turned round: the
  card opens, *Start* closes it, the page is loaded again, and the
  card is open again with the same title; *?* and Escape as now.
- Browser, the owner's case: `level:the-check` opened by its
  address, its card closed, `#map` opened and the level opened
  from it again: the card is open, with its intro's words
  (`levelText('the-check', 'es').intro`).
- Browser, a level won and opened again: its card is open.
- Browser, `guide.spec.ts`: on the course's first level, the first
  time, the card has no *Show me the screen* and closing it opens
  the guide; the guide skipped and the page loaded again, the card
  is open and has the button, and the button opens the guide; on
  another level, the card opened by itself and the card opened
  with *?* have no such button.
- Every browser spec that opens a level twice, or loads the page
  again, is brought to a card that is open: the specs that name
  `.start-card`, `reload()` or the guide (`cards`, `guide`,
  `sweeps`, `screens`, `loop`, `addresses`, `load`, `handheld`,
  `music`, `hints`, `settings`, `sound`) are run for this piece.

**The documents.** `plan.md`, 2.7: `started` gone from the
progress. The headers of `level.ts`, `progress.ts` and `store.ts`
where they tell of the card seen.

### 2.2 The wait that moves (D249)

**The page**, `ui/waiting.ts` and `style.css`.

- The view's first child is a row, `div.waiting-head`: the mark at
  44 px (`markSvg(44)`) and `p.waiting-loading` with
  `waiting.loading`, without the class `status`. The row is
  centred, its gap 12 px. The words: 28 px, weight 600, the ink's
  colour (`var(--ink)`), no margin.
- Under the row, `div#waiting-bar.waiting-bar`, `aria-hidden`,
  with one child, `span.waiting-bar-fill`. The bar: 260 px wide
  and never more than 70 % of the view, 8 px high, its corners
  round, its ground `var(--ink-line)`. The fill: the colour of the
  page's main button.
- While the screen loads the fill is a band 35 % of the bar wide
  that sweeps from the left edge to the right one
  (`waiting-sweep`, 1.4 seconds, ease-in-out, for ever). Under
  `prefers-reduced-motion: reduce` the band is the bar's whole
  width, still, and its opacity goes from 0.35 to 1 and back
  (`waiting-pulse`, 2 seconds each way).
- The hold. `WaitOptions` gains `onHold?: (ms: number) => void`.
  `Wait.ready`, with a tip up, calls it once with the time the
  tip still has, `max(0, shownAt + readMs - now)`, the same number
  its timer is set with. The view answers by setting
  `data-hold` on `#waiting` and the time as `--hold` on the bar,
  in milliseconds; the fill then starts at the bar's left with no
  width and grows to the whole bar in that time, linear, and stays
  (`waiting-fill`), under reduced motion too.
- The tip's picture. The row and the bar take less height than the mark
  over the words: the rest of the page at its tallest tip is
  measured again at 1024×700, and the constant of
  `.waiting-tip-picture` (392 px) and its comment are brought to
  it. The picture is no smaller than before at any of 1024×700,
  1280×800 and 1366×650; the report gives its width at the three,
  before and after.

**Tests.**

- Vitest, `Wait`: `ready` with a tip up calls `onHold` once, with
  the time left; with no tip up it does not.
- Browser, `waiting.spec.ts`: `.waiting-loading` says *Cargando…*
  at a computed size of 28 px; the mark is beside it, on its row;
  the fill's animation is `waiting-sweep` and runs; under reduced
  motion it is `waiting-pulse`; a tip up and the screen ready,
  `#waiting` has `data-hold` and the fill's animation is
  `waiting-fill`, of a length over 0 and no more than ten seconds;
  with the tallest tip up the page does not scroll at 1024×700,
  1280×800 or 1366×650.
- The shots of `e2e/shots/waiting/` are taken again.

**The documents.** The header of `waiting.ts`; the comments of
`style.css` at the view.

### 2.3 The keys that move a line in (D250)

**The lesson.** `content/lessons/if/es.md` and `en.md` gain a
third page, after *Una condición*, written by Gemini (section 4).
What the page says, in this order and in the course's words (a
line *moved in*, *metida hacia dentro*; no new technical word):

1. The four spaces before a line are how Python knows that the
   line is inside the `if`. One sentence: the page before has
   shown it.
2. Nobody has to count them. In this editor, Enter at the end of
   a line that ends with a colon starts the next line already
   moved in, and the lines after it stay in.
3. The Tab key puts four spaces at once: it takes a line in. The
   page says where the key is: at the keyboard's left, over the
   Caps Lock key, often drawn with two arrows.
4. The delete key, the one with the long arrow that points left,
   in the spaces before a line takes the four away at once: one
   press brings the line out.
5. Four presses of the space bar are the same for Python; Tab is
   only quicker.
6. What to try in the block, step by step: run it, and one line
   is printed, the one outside; put the cursor at the start of
   the last line and press Tab, run it again, and nothing is
   printed, because the line is inside the `if` and Dask does not
   look down; press the delete key there, and the line is out and
   printed again.

The keys are named as a child's keyboard names them in each
language (in Spanish *Tab*, *Intro*, and the delete key told by
where it is and what is drawn on it). The page is short: six to
eight sentences and the block. Its block, the strings translated:

```python try
if dask.facing == "down":
    print("Dask mira hacia abajo")
print("Esta línea está fuera del if")
```

Shift+Tab, and moving several lines at once, are not told: the
settings' list of keys has them.

**The page.** Nothing of the editor changes. If the block's
output shows nothing where nothing is printed, and the child
cannot tell a run that printed nothing from no run, the programmer
says so in the report and changes nothing.

**Tests.**

- Browser, `lesson.spec.ts`, the lesson `if`, in both languages:
  three pages. On the third, in its block: run as written, the
  output has the last line's words and not the second's; the
  cursor at the start of the last line and Tab, the line starts
  with four spaces, and a run prints neither; Backspace there,
  the line starts with none, and a run prints it again; the cursor
  at the end of the first line and Enter, the new line starts
  with four spaces.
- The content's checks hold the same pages in both languages.

**The documents.** `course.md`, the row of `lesson:if`: three
pages, and what the third tells.

### 2.4 The rings told as the next practice

`content/levels/the-rings/text.es.json` and `text.en.json`, the
`intro`, by Gemini (section 4). Ilda speaks. It begins by saying
that the practice goes on after the lake, and why the rings, from
the owner's words: *¡Sigamos practicando! Los aros son una forma
muy buena de aprender a controlar los giros…*. Then what it says
now, in fewer words where the card needs it: a pair's first ring
is crossed from below upward and its second from above downward,
and a ring crossed the other way does not count; this is Ilda's
program for the field; it goes through three pairs, round a group
of trees by the top between the first two and over a pond between
the last two; its 19 lines are the four lines of a pair written
three times; a function for the pair, called in the three places,
makes it much shorter.

The card is no taller than *La revisión*'s, the game's tallest:
615 px in the sweep at 1024×700, 1280×800 and 1366×650
(`KYDUX_SWEEPS=1 npx playwright test e2e/sweeps.spec.ts`, which
writes `e2e/shots/sweeps/start-cards.md`); it is 601 px now.
D228's test stays green.

**Tests.** The sweep, made again and committed; the specs that
read *Los aros*' intro.

### 2.5 The castle's painting read at the opening (D251)

**The story's format.** A step of `story.json` may carry
`"still": true`. It is allowed only in a story that has a still
(the opening, `opening: true`), only on the story's first steps
in a row from the first, and only on a step of the voice whose
`do` is `null`. `content/stories.ts` reads it (`StoryStep.still`),
and the check that reads the stories' files holds those three
rules.

**The page**, `ui/story.ts`.

- The scene's place shows the still while the scene has not come
  or the step shown has `still`. One function decides it at every
  step shown and when a scene comes: with the still due, the
  still is shown at once, the scene's node has
  `story-scene-waiting` and the zoom box is hidden; with the scene
  due, the class goes, the scene comes in over the still in
  `FADE_IN`, the still is hidden after it, and the zoom box shows.
  A timer of a fade that is overtaken is dropped.
- The frame says which: `data-still` is `on` or `off`.
- The scene loads from the story's opening as it does, and a
  still step plays on it as any step with nothing to do.
- *Back* to a still step shows the still again, at once. *Skip*
  goes to the last step, on the scene.
- A story with no still step is as it is: its place shows the
  mark on paper until its scene comes.

**The opening.** `content/stories/the-letter/story.json`: steps 1
and 2 carry `"still": true`; the walks of steps 3 and 4 and the
camera stay. Its five texts are written again by Gemini, in both
languages (section 4), in the order of time:

1. Over the painting. This is the castle of Arvelia, the school
   for *magos y magas*, from the owner's words (*Este es el
   castillo de Arvelia, la escuela para magos y magas…*): old, on
   its hill, above a deep lake, as the painting shows it.
2. Over the painting. Some weeks ago a letter came to you: the
   invitation to your first year at Arvelia, signed by the head of
   the school, Orla. This very drawing came with it, and your
   heart leaped.
3. On the scene, the wizard walking up. Then the journey: the
   bags, the long road, the village at the foot of the hill, the
   steep climb at dusk.
4. On the scene. Now you stand before the great iron gate: shut,
   with no handle and no bell, and you do not know how to get in.
   But it is very quiet, almost as if it were listening.
5. Before the story goes on, one question: who are you?

No step is longer than the longest of the five is now.

**Tests.**

- Vitest: the stories' check: `still` on a step that is not of
  the voice, that does something, that comes after a step without
  it, or in a story with no still, is refused; the opening's first
  two steps have it.
- Browser, `story.spec.ts`: the opening opened and its scene come
  (`#scene` says its playback is done): the frame's `data-still`
  is `on`, `#story-still` is seen and the scene's opacity is 0;
  the zoom box is not seen; *Next*, the same at step 2; *Next*,
  `data-still` is `off`, the scene's opacity reaches 1 and the
  still is hidden; *Back*, `on` again; from step 1, *Skip* shows
  the last step on the scene. `waiting.spec.ts`'s test of the
  still while the scene loads holds.
- Browser: a chapter's story shows no still once its scene has
  come.

**The documents.** `architecture.md` where it tells a story's
steps; the headers of `story.ts` and `stories.ts`.

### 2.6 The wind counted from its own plan (D252)

The owner has approved the wind by ear. Nothing that is heard
changes: the gusts' plans (`gustPlan`), every number, the voices,
the bands, the mix and the rest's two curves stay as they are.
What changes is where a gust that is taken on, a drop and the
rest find the level they start from.

**Why.** Each of them reads its start from the node
(`fromNow`: `param.value`). The bang at a start came from such a
reading (a gain only scheduled reads as its default), and what a
param answers while its plan plays is not the same in every
browser. A level counted by the wind itself is the same
everywhere, and a test can hold it.

**The sound**, `engine/sound.ts`.

- `levelAt(points, at)`, exported and pure: the value of a list
  of points `{ at, level }` at a moment, on the straight line
  between the two points round it; the first point's before it,
  the last point's after it.
- The wind keeps, for each param it plans (the gust's gain, the
  air band's middle, the whistle's middle, the whistle's level),
  the points last given to the sound's clock, in the clock's own
  seconds. The points of a band and of the whistle are the gust's
  points through the function that gives each (`airHertz`,
  `whistleHertz`, `whistleLevel`): the line the clock draws.
- **Nothing is read back.** `fromNow` goes. Every plan starts
  with `cancelScheduledValues(now)` and `setNow(param, value,
  now)`, the value counted with `levelAt` from the points kept; 0
  for a gain and the band's low end with none kept.
  - `gust(seconds)`: the plan is `gustPlan`'s, as it is. A gust
    that sounds is taken on from the level counted.
  - `drop(seconds)`: the gust's gain and the whistle's level go
    from the value counted to 0, and those two points are kept;
    the bands keep theirs.
- **The rest** keeps its curves (`setTargetAtTime`, `REST_FALL`,
  `REST_RISE`). The wind keeps what it last gave the rest's
  level: the value it started from, when, and its one or two
  targets with their times; and counts the level now with the
  curve's own rule, `target + (from − target) · e^(−t/τ)`, in a
  pure function with a test. `restLevel` starts from that value.
- Where no sound is made, nothing is kept and nothing is counted,
  as now; `blowing` and the scene's counts are as they are.

**Tests.**

- Vitest, `sound.test.ts`, with a fixed `random`:
  - `levelAt`: between two points, on a point, before the first,
    after the last, and of an empty list where the programmer
    gives it a meaning;
  - the rest's rule: at its start, after one `τ`, and with a
    second target that starts later.
- Vitest, `sleep.test.ts`, the nodes' stand-in: a param's `value`
  reads a number nothing sets, 99, and no call the wind makes
  carries 99;
  - the first gust of a new sound holds 0, as the test there
    says;
  - a second `gust`, with the clock moved into the first, holds
    after its cancel the level counted from the first's plan at
    that moment, and the bands and the whistle theirs;
  - a `drop` in a gust holds the level counted and goes to 0, and
    the gust after it starts from the drop's line;
  - the rest after a gust starts from the value its curve has at
    that moment.
- Browser: the specs of the wind in `chapter-4.spec.ts` and
  `music.spec.ts` are green with no change: *Los aros*' eighteen
  gusts, the zigzag's twelve, six samples, the mix as written.

**The documents.** The header of `sound.ts` and the comments of
`setNow` and of the wind's calls.

### 2.7 What the owner will try

**The start card**:

1. *La revisión* (chapter 4, Arreglo 1), opened from the map: its
   card opens, with the knots left to do. Closed, the map opened
   and the level opened again: the card opens again. No *Enséñame
   la pantalla* on it.
2. *La verja* (chapter 1's first level): its card has *Enséñame la
   pantalla*.

**The wait**:

3. The page loaded anew: *Cargando…* is large, beside the mark,
   and a band runs along the bar under it. When the tip is up and
   the screen is ready, the bar fills, and the screen opens when
   it is full.

**The keys**:

4. Chapter 3, Lección 5, *Si*: its third page. In its block: Tab
   at the start of the last line, and the line goes in; the
   delete key, and it comes out.

**The rings**:

5. *Los aros* (chapter 4, Mejora 1): the card begins by saying
   that the practice goes on.

**The opening**:

6. A new game: the story opens on the painting of the castle,
   with its words under it; *Siguiente*, the letter, still over
   the painting; *Siguiente*, the path and the gate.

**The wind**:

7. `?debug#music`, *El viento de la escoba*: the page opens with
   the owner's mix (air 1.10, whistle 1.00, rest 0.50) and says
   that every voice is as written. Each button sounds as it did
   when the owner approved it, with no bang at any start.
8. *Los aros*' own program, run: the wind as the owner knows it,
   and the rest under it while the wizard hovers.

**The landing**:

9. *El primer vuelo*'s own program, run: from the lift on the air
   under the gust grows, and when the wizard sets down it sinks
   and goes out in a second and a half, with no hum. *Los aros*'
   own program: the air grows over the last second and a half
   of the flight, and goes out after the wizard has landed, with
   the run already ended. `?debug#music`: the landing's button
   and the whole flight's sound the same.

One more is the designer's and is there to be tried before the
sprint is built: the mark, in the header and on the browser's tab.

### 2.8 What is left out, and why

- **A measure of what is left to load.** The page does not know
  ahead how much a screen brings. The bar sweeps while it loads,
  and counts the time a tip holds the screen, which the page does
  know.
- **Another door to the guide.** Only the first level's card
  offers it. If the owner wants it elsewhere, in the settings for
  one, it is a small piece of a later sprint.
- **Shift+Tab and several lines moved at once**: more than a child
  needs at the first `if`; the settings' list of keys has them.
- **A page of the keys at `for` and `while`**: the first lines
  moved in are the `if`'s, and the keys are told once.
- **A timer on the painting.** The reader goes on at *Next*, as in
  every story.
- **One wind for a whole stretch of flight**, which rises once
  and changes at the turns. This plan asked it from the owner's
  first comment. Then the owner heard the wind with the shot gone
  and their own mix, and says the flight sounds well as it is. A
  sound the owner has approved is not remade. If they ask for
  fewer puffs in a zigzag later, it is a piece of its own.
- **A change of any number of the wind.** They are the owner's.
- **A wind for Zarek**, as in sprint 48.
- **A thought at a locked door**: the owner has looked, and it
  stays as it is.
- **The browser tests on GitHub**: started by hand alone (D179),
  in the designer's commit. Nothing under `.github/` is the
  programmer's.
- **Another sound for the spell at a landing.** Where a spell
  lands the wizard, the spell's own sound is heard over the
  landing's first third of a second, as it is over the lift's.
  The owner, told of it, chose the landing as it is.
- **A landing for Zarek**: another figure's landing is seen and
  not heard (D244).

### 2.9 The landing is the wind switched off (D255)

Added on 2026-11-16, while the sprint is built. The owner chose it
by ear among three trials played with the game's own wind; what is
asked is that trial, with its numbers.

**What is heard.**

- **The approach.** Over the last `LAND_NEAR`, 1.5 seconds, before
  the wizard's landing, or from the lift where the flight is
  shorter, the rest's level rises on a straight line from the
  level it has to `LAND_LEVEL`, 0.11, and is there at the landing.
  The gusts sound over it as they are planned.
- **The switch-off.** At the landing, over `LAND_FALL`, 1.5
  seconds: the rest's band glides down from its 300 hertz to
  `LAND_HERTZ`, 90 (an exponential ramp); the band's Q goes on a
  straight line from the rest's 1.1 to `LAND_Q`, 5, over the first
  half of the fall, so that the falling pitch is heard; and the
  rest's level falls on a straight line to nothing. After it the
  band and its Q are the rest's again.
- **No effect** sounds at a landing: `set_down` goes from the
  effects. A spell's own sound at a landing that is cast is as it
  is.
- **A landing with no approach behind it**, the program played on
  from a pause a tick before: where the level counted is under
  `LAND_LEVEL`, it comes up to it over 0.1 seconds and then falls.
- The levels are the rest's own level's, heard through the rest's
  mix, 0.5 as written. With the rest's voice off on the debug page
  there is no landing to hear.

Measured by the designer with the mix as written, at the speakers:
the landing tops at an rms of 0.006 to 0.009, where the hum topped
at 0.012 to 0.017 and a gust tops at 0.005 to 0.01.

**The playback**, `engine/playback.ts`. It holds the run's ticks,
and says how long it is, at the speed now, from the start of the
tick that plays to the start of the first tick ahead that holds an
event the caller asks for; nothing where no tick ahead holds one.
The count is a pure function, exported, with a test: the lengths
of the ticks between (`lengthOf`, with the pace) by the tick's
length.

**The scene**, `engine/scene.ts`.

- At each tick shown while the program plays, never at once, with
  its events shown and the wizard in the air: the time to the
  wizard's next `land`, whoever orders it. Where it is `LAND_NEAR`
  or less, `wind.near(seconds)`. It is asked again at every such
  tick: the wind draws the line again from the level it counts,
  and so a change of speed is followed. A flight whose landing is
  further than that, or that ends in the air, has no approach.
- At the wizard's `land`, not at once: `wind.land()` where the
  effect is played now. `set_down` is still said among
  `data-sounds`, as `wind` is for a gust, muted or not.
- When the playback leaves `playing` (Stop, a pause, the run's
  end): `wind.stop` as now. It ends a gust and an approach. A
  landing that has begun is heard to its end, as the set-down is
  seen to its end: the world's landing at a program's end sounds
  whole with the run done. A restart, for a new run or under the
  slider, cuts all of it in `WIND_CUT`, the landing too.
- `data-landing` on the scene: `near` while an approach is
  planned, `down` while a landing falls, absent at any other time;
  from the wind's own count on the page's clock, muted or not, as
  `data-wind` is.

**The wind**, `engine/sound.ts`, on what piece 3.6 leaves.

- `WindGraph` holds the rest's band, `restBand`.
- `near(seconds)`: the sound made where it is not, as the rest
  asks it; the rest's level from the value counted, on a straight
  line, to `LAND_LEVEL` at `max(0.05, seconds)` from now.
- `land()`: the switch-off as told above, from the level counted.
  The rest is asked for no more.
- While an approach is planned, `gust`, `drop`, `rest(true)` and
  `remix` leave the rest's level as it is planned. `rest(false)`
  and `stop` end the approach: the level falls as the rest's does.
- While a landing falls, `gust`, `drop`, `rest(false)`, `stop` and
  `remix` leave the rest's level, its band and its Q as they are
  planned. `rest(true)` and `near`, a lift right after a landing,
  end it: the band and its Q are the rest's at once, and the level
  is taken on from the value counted. The restart's cut ends it
  too, in the seconds given: a second call or a flag of `stop`,
  the smaller.
- Nothing is read back (D252). The rest's level is counted from
  what was last given to the clock, a curve or a line. The band
  and its Q start a landing from the rest's own values, which the
  wind knows, and are set to them at once where a landing is
  ended.
- `landing`: `near`, `down` or none, counted on the page's clock
  where no sound is made too, as `blowing` is. `blowing` is of the
  gusts alone, as it is.
- The sound is kept, and the context awake (D231), while an
  approach or a landing sounds.

**The effects**, `engine/sfx.ts`. `set_down` goes, and with it
what was made for it alone: `Effect`'s `even`, `band` and `under`,
and what `lasts`, `pitched` and `sound` do with them. Their tests
go; the test that holds the lift as struck air stays.

**The debug page**, `ui/themes.ts`. The `landing` sample is the
rest asked for, an approach of `LAND_NEAR` and the landing; the
`flight` sample has its approach over its last 1.5 seconds and its
landing from the wind. No sample is added.

**Tests.**

- Vitest, the playback: the time to an event ahead through flown
  ticks and a cast's tick, at another speed, and with none ahead.
- Vitest, `sleep.test.ts`, the stand-in that reads 99: `near` in
  silence draws 0 to `LAND_LEVEL`; `near` in a hover starts from
  the value the rest's curve has; a gust in an approach leaves the
  rest's level's plan; a second `near`, the clock moved, starts
  from the line's value at that moment; `land` gives the level to
  0 and the band to 90 hertz at 1.5 seconds, the Q to 5 at 0.75,
  and the band and Q back after; `land` with no approach goes up
  to `LAND_LEVEL` at 0.1 seconds first; `rest(false)` and `stop`
  in a landing leave it, and the cut ends it; `rest(true)` in a
  landing puts the band back; `landing` says `near`, `down` and
  none at the right moments, with no sound made too; no call
  carries 99.
- Browser, `chapter-4.spec.ts`: *El primer vuelo*'s own program
  has `data-landing` at `near` from the lift's tick, at `down` at
  the landing and absent after it, and `set_down` once among
  `data-sounds`; *Los aros*' own program has no `near` at its
  first gusts, and `down` with `data-state` at `done`; Stop in an
  approach takes `data-landing` away at once with the wizard in
  the air; the slider on a tick of a flight gives none; with the
  sound off in the settings the attributes are the same.
- Browser, `music.spec.ts`: the six samples, as they are.

**The documents.** D255, D253, D244, D243 and the `land` event's
row are entered in `architecture.md` with this section. The
programmer's: the headers of `sound.ts` and `sfx.ts`, the comment
of the scene's `land`, the comments of `themes.ts`, and
`docs/dev/plan.md`, which names D255 with chapter 4's wind.

## 3. The pieces

One local commit each, in this order; 3.8, added while the sprint
is built, comes after 3.6 and before 3.7.

### 3.1 The start card at every opening (D248, 2.1)

`started` gone, the card at every opening, the guide's button on
the first level alone, the specs brought to it.

### 3.2 The wait that moves (D249, 2.2)

The row, the bar, its three animations, `onHold`, the picture's
constant measured again, the tests and the shots.

### 3.3 The castle's painting read at the opening (D251, 2.5)

The step's `still`, the story's page, the opening's two steps and
its five texts by Gemini, the tests and the documents.

### 3.4 The keys that move a line in (D250, 2.3)

The lesson's third page by Gemini, in both languages, the tests,
`course.md`.

### 3.5 The rings told as the next practice (2.4)

The intro by Gemini, in both languages, the sweep.

### 3.6 The wind counted from its own plan (D252, 2.6)

`levelAt`, the points kept, the rest's rule, `fromNow` gone, the
stand-in that reads 99, the tests. No number, plan or mix
changed.

### 3.7 The whole check, the hand-over and the report

`docs/dev/plan.md` names this sprint's decisions where it tells
of the cards, the wait, chapter 3's lesson 5, the opening and
chapter 4's wind. The whole `ci/check.sh --e2e`, in a copy, with
Playwright's own server on 4173. Then, in `drafts/`, never
committed:

- the walkthroughs of chapters 3 and 4 made again whole, each in
  its one arrangement (D216); the report names the pages that
  differ from the ones the owner read: the lesson *Si* and *Los
  aros*' card;
- the report in Spanish, with pictures of this commit only: *La
  revisión*'s card open after a second opening; the first level's
  card with *Enséñame la pantalla* and another level's without;
  the wait at its start, with a tip up, and with the bar filling;
  the opening's steps 1, 2 and 3; the lesson's third page, and its
  block after Tab; *Los aros*' card at 1024×700; a drawing of the
  level in time of a zigzag's twelve gusts, counted with `levelAt`
  from the points the wind kept, with the commands' starts marked
  on it: each gust starts where the one before was; the tip
  picture's widths before and after; what was built piece by
  piece; every choice the plan left and how it was taken; Gemini's
  drafts and what was corrected in each; and the owner's nine
  steps of 2.7, written to be followed.

### 3.8 The landing is the wind switched off (D255, 2.9)

After 3.6, before 3.7. The playback's time to an event ahead, the
wind's `near`, `land` and `landing`, the scene's calls and
`data-landing`, `set_down` gone from the effects, the debug page's
two samples, the tests. To the report of 3.7 it adds a drawing of
the rest's level and of its band's pitch in time, counted from the
wind's own plan, through *El primer vuelo*'s flight and through a
flight with a wait in the air, with the lift, the approach's start
and the landing marked on it.

## 4. Gemini

No image. Three briefs in `tools/write/briefs/`, written by the
programmer from this plan, run with `tools/write/write.py`, and
their drafts read and corrected before they enter `content/`; the
commit says what was corrected.

- `sprint-49-the-letter.md` (piece 3.3): the opening's five steps
  in both languages, as 2.5 tells each, with the owner's comment
  whole and a description of the painting: the castle on its hill
  above the lake at dusk, the village at the hill's foot.
- `sprint-49-moved-in.md` (piece 3.4): the third page of
  `lesson:if` in both languages, as 2.3 tells it, with the
  lesson's two pages as they are, the owner's comment whole, and
  the block given letter for letter but its two strings.
- `sprint-49-the-rings.md` (piece 3.5): *Los aros*' intro in both
  languages, as 2.4 tells it, with the owner's comment whole, the
  intro as it is, and the outro of *El primer vuelo* before it.

Each brief carries the bible, the course, the texts around the
one asked as they are, and the rules: natural words a child of
ten reads alone; nothing told that the child does not need yet; a
metaphor only where an idea is first explained, and none here; no
*manera* or *way* for a level's arrangements (D204); the words the
course already uses for a line moved in; the wizard's gender told
with the texts' own marks (`{mago|maga}`) where it is needed. The
words this plan gives letter for letter, the owner's among them,
are given to Gemini as they are, to be kept or fitted, never
dropped.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-49.md (this plan, whole), docs/dev/sprint-48.md (what
was built last), and the memory notes kydux-two-agents,
kydux-sprint-48-state, kydux-designer-review-48,
kydux-designer-uat-sprint-48, kydux-designer-sprint-49-plan and
kydux-checks-per-piece. The decisions D248 to D254 are entered in
architecture.md as built. D248 to D251 and the counting of D252 are
yours to build. The rest is built already, in the designer's commits
after sprint 48: the bang taken out of a wind's start (setNow in
engine/sound.ts, with its test in sleep.test.ts), the wind's mix as
the owner set it by ear, the landing as a thing switched off (D253), the
browser tests on GitHub started by hand alone (D179), and the mark's
wand of wood (D254). Read those commits before piece 3.6, and change
nothing of them.

Build sprint 49 whole: pieces 3.1 to 3.7 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173 and the app
built anew in that copy before the run; never a push, never a timer,
never a deploy: nothing is released until the owner is happy with
chapter 4. Never stop or build into the servers on ports 443 and
5173, and stop your own preview when you are done. No image is asked
of Gemini. Three texts are: write the three briefs of section 4, run
them, read and correct the drafts; the key stays in
~/.config/kydux/secrets.env and never enters a file of the tree, a
commit, a log or the report. Nothing under .github/ changes.

What the owner will look for:
(1) a level's start card open every time the level opens, played
    before or not (the owner's case: chapter 4's Arreglo 1, La
    revisión); the game keeps no list of cards seen; Show me the
    screen on the course's first level's card alone, once the guide
    has been seen;
(2) Cargando… at 28 px beside the mark, and a bar under it: a band
    that sweeps while the screen loads, a fill over the time a tip
    still holds a ready screen; a still band that fades under
    reduced motion; the tip's picture no smaller than it is;
(3) the opening's first two steps told over the painting of the
    castle ("still": true on a step), the scene coming in at the
    third; Back shows the painting again; the five texts written
    again by Gemini in the order of time, the first from the
    owner's words;
(4) a third page in the lesson if: the four spaces, Enter after
    the colon, Tab puts four, the delete key takes four, with a
    block to try it in; no new technical word; Gemini's;
(5) Los aros' card opening with the practice that goes on and why
    the rings, from the owner's words; the card no taller than
    615 px in the sweep;
(6) the wind exactly as it sounds now, a gust for each flown
    command with the owner's mix: the owner has approved it by
    ear. Under it, one change that is not heard: the level that a
    gust taken on, a drop and the rest start from is counted from
    the points the wind last gave the clock (levelAt, and the
    rest's curve by its own rule), and no param's value is ever
    read back; fromNow goes; the tests' stand-in reads 99 and no
    call carries 99.

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. The wind's
plans, numbers and mix are the owner's: change none, and add no
sample to the debug page. Never edit content while a browser run is
going. Every document and comment in the present. Before git add,
read git diff of each file and stage only your own hunks; commit
promptly.

Hand over, in drafts/ and never committed: the walkthroughs of
chapters 3 and 4 made again, and the report in Spanish as 3.7 asks,
with the owner's eight steps of 2.7. Write your memory note
kydux-sprint-49-state, and end with the prompt for the designer's
review in English, in a code block.
```

### 5.1 The addendum, given while the sprint is built

```
An addition to sprint 49 from the designer, through the owner. Read
it when the command you are running ends; finish and commit the piece
you are on first.

The owner has heard the landing the designer built (commit 8927147,
the hum of set_down) and finds it too striking. They asked for the
wind itself instead, and chose it by ear among three trials: the
wind's rest rises over the flight's last second and a half, and at
the landing that same air is switched off, sinking in pitch and in
loudness to nothing. This is D255, and it is yours to build: piece
3.8 of docs/dev/sprint-49.md, told whole in its section 2.9. Read
again in that plan: the owner's words near its start, D255 in
section 1, step 9 of 2.7, the two new lines of 2.8, section 2.9 and
piece 3.8; and in docs/dev/architecture.md D255, D253, D244, D243
and the land event's row, which are entered as built.

Those changes of the designer's are in the tree and not committed:
docs/dev/sprint-49.md whole, and in docs/dev/architecture.md the
hunks of D243, D244, D253, D255 and the land event's row. The
designer does not commit while you hold a provisional commit. Once
your provisional commit has its final form, and before your next
piece's commit, commit them alone, with no hunk of yours among them:
git add -p for architecture.md, the forbidden-words check, then
git commit -F /tmp/k49/d255/msg.txt (read the message first). Until
then keep them out of your own commits.

What this changes in what you were told:
- Build 3.8 after 3.6 and before 3.7: it stands on the level counted
  from the wind's own plan. One local commit, ci/check.sh and the
  browser specs it touches green before it. If 3.6 is not committed
  yet, finish it as planned first.
- "Change nothing of the designer's commits" no longer holds for the
  landing: set_down goes from engine/sfx.ts with Effect's even, band
  and under and their tests, and the scene's land() calls the wind.
  The bang's fix, the wind's mix and the mark stay untouched.
- "Add no sample to the debug page" holds: the landing and the flight
  samples play the landing from the wind; none is added.
- The gusts' plans, numbers and mix stay the owner's. The landing's
  numbers are the owner's too, as 2.9 gives them: LAND_NEAR 1.5 s,
  LAND_LEVEL 0.11, LAND_FALL 1.5 s, LAND_HERTZ 90, LAND_Q 5 over the
  fall's first half. Change none.
- The report's steps for the owner are nine, with step 9 of 2.7, and
  it carries the drawing piece 3.8 asks for. plan.md names D255.

What the owner will look for: the air growing under the gusts as the
landing nears, from the lift on in El primer vuelo; no hum and no
thump at the landing, only that air going down and out in a second
and a half; the same where the world lands the wizard at a program's
end, heard whole after the run is done; silence at once at Stop in
the air.

The designer's trial is at /tmp/k49/land2/page.js (near and
switchOff, variant C), scratch outside the tree: it shows the ramps
that the owner heard, and it reads values back from the nodes, which
your build never does. Take the ramps from it, nothing else.
```
