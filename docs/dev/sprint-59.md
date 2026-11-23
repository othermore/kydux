# Sprint 59 — The hall's rules for familiars, the others at work, and the stories' staging

Asked by the owner on 2026-11-22, after trying the start screen,
the named games and chapter 5 whole. The comments that are texts,
the default look, the staging of two stories that today's keys
can tell, and chapter 5's music are the designer's own commits,
made before this plan. This sprint builds the rest. The owner's
words head each decision of section 1.

**Where it is today.**

- *The plates.* The hall's three plates (`moon`, `sun`, `star`,
  things of kind `plate` in `content/scenes/the-tower-hall/`)
  are things like any other: `role_of("plate")` is `thing`
  (`world/kydux_world/api.py`), so a plate has every member the
  course has taught of a thing (`kind`, `name`, `position`,
  `distance_to`, `reveal`). A level's API is everything taught
  so far (D40, `knownApi` in `app/src/main.ts`), so from the
  chapter's first practice the notebook and the completion show
  the three plates with all of that.
- *How many familiars.* `_k_made` (`world/kydux_world/world.py`)
  names every object a program makes, with no limit, and
  `_k_looked_at` takes every class. A second trial called with
  no free cell among the block's `trials` takes the oldest
  trial's cell (`_trial`). A familiar's move in a trial level
  ends in the wizard's thought `blocked.not_called`.
- *The others in the hall.* In *One line in the book* the mate's
  failed try is a spark that stands still (`"spark": true`), and
  the friend's hare stands in the circle until the level is won,
  then steps out beside her (`then`). In *Out of the circle* the
  mate's familiar steps out of the circle and stays there.
- *Orla's orders.* `tell` (`app/src/engine/scene.ts`) holds the
  tick for the reading of every piece of the words. The order
  to the star has two pieces: about 3.8 s and 1.9 s pass before
  the familiar's first step.
- *The familiar in a story.* A story's built world has no
  `familiar` block, so `childsFamiliar`
  (`app/src/engine/layout.ts`) draws the table's default, a red
  fox, whatever the child's familiar is. The texts already say
  the kept familiar's name and kind.
- *A living familiar's class.* A class of another name in a
  living level is told with `told.class_changed`, which says
  that a living familiar's description is not changed.
- *A bubble.* `bubbleShift` moves a bubble's box off the figures
  it would hide, and `bubbleTip` keeps the tail inside the box
  (`width/2 − 12`). In *The trail*, step 8, the box is moved so
  far off the friend that its tail points at the wizard.
- *A story's staging.* The wizard of a story or of a part is
  placed by `wizard`, a cell, and faces down. A `later` part
  (D280) fades to dark and back with no words. The validator
  (`story_on_scene`, `world/kydux_world/level.py`) lets the
  wizard walk out of sight only in the story's last step, and
  nobody speaks out of sight.
- *The painted openings.* The hall's small tunnel for familiars
  (column 14, its mouth at about x 1365..1415, y 265..335 of
  `ground.webp`) is wall on the map: in *The trail* the
  familiar fades away before it (`vanish`) and comes back the
  same way (`appear`). In the passage scene Rinlo leaves the
  forgotten room along row 3, where three lowerings differ
  (0 on [6,3] and [7,3], 0.65 on [5,3], 0.3 on [2,3]..[4,3]),
  goes down the back stairs to [2,8] and fades away, and
  appears at [2,12], before the arch. The arch has no cover.
- *The plates' figures.* The moon's engraving reads dark on its
  brass; the sun's and the star's are pale, and hard to tell
  while unlit.

## 1. Decisions taken here

The programmer enters them in `docs/dev/architecture.md` when
built, in the present. D295 (the default look) and D296 (chapter
5's theme) are the designer's and are entered already.

- **D297 — One familiar a pupil at a time.** Decided 2026-11-22
  by the owner: *«si se declaran varias clases o se crean varios
  objetos, Orla debería pararlo diciendo que cada alumno solo
  debe crear un familiar cada vez, salvo en el capítulo en que
  se pide al mago que cree el familiar para él y para su
  compañero […] Estas protecciones aplican a todos los niveles,
  salvo que explícitamente necesitemos crear dos familiares»*,
  and of the fix: *«En este nivel sí se permite crear dos
  familiares, pero solo dos. Si se crean más de dos o si se
  hacen dos descripciones, Orla debe pararlo.»* A level's
  `familiar` block says how many objects a program may make,
  `most`: 1 when it is not said, 2 in *The slate*. The object
  that goes over it is stopped by Orla at its line, and so is
  the second class of a familiar a program writes. Rules out a
  second trial on a cell another holds, and a level that takes
  more familiars without saying so.
- **D298 — The notebook lists the first year's familiars.**
  Decided 2026-11-22 by the owner: *«se deberían listar los
  animales que puede crear un alumno de primero (y más adelante,
  añadirle los colores posibles a cada uno, cuando se explique
  lo de los colores)»*. Where a familiar is described (a block
  of stage `trial` or `birth`), the notebook's tab of actions
  has a section with the six kinds; each has its colours beside
  it from the level that teaches `familiar.color` on. Rules out
  a colour told before colours are taught, and the friend's
  grey.
- **D299 — A plate has its position, and nothing else.** Decided
  2026-11-22 by the owner: *«el cuaderno muestra los objetos
  sun, moon, star… no debería mostrarlos todavía, ya que no
  hacen falta aún»*, and *«decirle que tiene tres objetos: sun,
  moon, star, y que los tres objetos tienen su atributo
  position. Y no habría que poner nada más sobre esos objetos
  en el cuaderno […] ni en el autocomplete»*. A plate is a role
  of its own, `plate`, whose one member is `position`, taught by
  *Out of the circle*. Before that level a plate has no member,
  and neither the notebook nor the completion shows it. Rules
  out a thing's other members on a plate.
- **D300 — The hall's other pupils are at work.** Decided
  2026-11-22 by the owner, of *One line in the book*: *«debería
  verse al compañero intentando lanzar hechizos que fallan todo
  el rato […] a veces ese y a veces cualquier animal aleatorio,
  sin color o con color, pero que desaparece a los pocos
  segundos»*, and *«a la amiga avanzada debería ya vérsele dando
  órdenes a su animal […] que el animal se vaya moviendo solo
  una casilla, sin salirse de su zona del círculo»*. Both are
  the page's own show, on its clock: the world's ticks, the
  goals and the run's `data-*` know nothing of them. The mate's
  tries go on always; the friend's orders play while no program
  runs. Rules out a show that changes what a run finds.
- **D301 — A trial is not moved.** Decided 2026-11-22 by the
  owner: *«debería pararlo Orla simplemente, diciendo "aún es
  pronto para mover a tu animal, antes debes estar seguro de
  que es el que quieres y debes decírmelo para que lo anote en
  el libro"»*. In a level of stage `trial`, a move asked of a
  familiar is stopped by Orla with those words, whether the
  action is taught or not. Rules out the wizard's thought about
  the circle there.
- **D302 — A familiar born walks to the moon's plate, and two
  share it.** Decided 2026-11-22 by the owner: *«cuando la amiga
  saca al familiar del círculo, lo debería llevar al plato de
  la luna, no solo sacarlo (va por delante justo un nivel)»*,
  and of the mate's: *«también debería llevarse a la luna […]
  al llegar el segundo le hace hueco al primero desplazándose
  un poco dentro de la casilla de la luna»*. A block's `then`
  takes a `way`, walked after the step out of the circle, a
  cell a tick, lighting the plate it ends on. The walker of a
  `then` may end on the cell the child's familiar holds; the
  page draws the two side by side on it. Rules out two
  familiars drawn one over the other.
- **D303 — An order's command does not hold the run.** Decided
  2026-11-22 by the owner: *«entre que el familiar va al sol y
  que Orla lo manda a la estrella, hay una pausa demasiado
  grande. Tiene que ser una pausa un poco más pequeña.»* In the
  tick of an order, the last piece of Orla's words, the command,
  holds nothing: the familiar sets off as its bubble comes up,
  and the bubble stays for its reading. The pieces before it
  hold as words do (D264, D274).
- **D304 — A plate's figure reads unlit.** Decided 2026-11-22 by
  the owner: *«el sol y la estrella no se ven mucho cuando no
  están iluminados. ¿Podemos aumentar el contraste (hacer la
  figura un poco más oscura, como la de la luna)?»* The sun's
  and the star's engravings are painted as dark on the brass as
  the moon's, by Gemini, each in its box, in the day's ground
  and the sunset's. Rules out an engraving darkened by a filter.
- **D305 — The game's familiar is in its stories, and is kept
  for good.** Decided 2026-11-22 by the owner: *«Debería saber
  el animal que he conjurado en el momento en el que lo saco
  del círculo, ahí ya se debe quedar recordado y usarlo en la
  historia y además obligar a que ya el animal que se usa
  siempre sea ese (si se cambia en un nivel posterior, debe
  fallar diciendo que ya has conjurado y sacado del círculo a
  un X y que debes seguir con eso)»*. A story's figure of the
  familiar is the game's kept one, its kind and its colour, in
  every part. In a living level a class of another kind is
  stopped by Orla with words that name the kind kept. Rules out
  the table's default in a game with a familiar.
- **D306 — A bubble's tail is over who speaks.** Decided
  2026-11-22 by the owner: *«sale como un globo que dice el mago
  principal, en lugar de decirlo Nuri»*. A bubble's box is moved
  off other figures only as far as its tail still reaches the
  one who speaks: the tail's tip is over the speaker's head,
  always. Where the two cannot both be had, the tail wins and
  the box covers what it must.
- **D307 — A figure goes through a painted opening behind its
  stones.** Decided 2026-11-22 by the owner, of the familiars'
  tunnel: *«se debe meter por el túnel y desaparecer dentro
  porque sigue subiendo y sale fuera de la vista, en lugar de
  desaparecer en plan "desvanecerse" en la puerta del túnel. Y
  luego al aparecer, igual»*, and of the passage's arch:
  *«debería cruzar el arco (que debe tener máscara para que
  funcione) y quedarse ahí»*. An opening painted in a wall that
  a story's figure goes through has story-walked cells behind
  it (D288) and a cover cut from the painting, its stones
  without its opening (D76). The figure walks; it never fades
  at a wall. The covers are a tool's cut of the painting (the
  owner's rule on masks), not a new painting.
- **D308 — A story says which way its wizard faces.** Decided
  2026-11-22 by the owner: *«Deberían estar desde el principio,
  cuando aparece la escena, mirando a Orla»*. A story, and a
  part of one, takes `facing` beside `wizard`. Rules out a
  first frame that a `face` then corrects.
- **D309 — Words on the dark between two parts.** Decided
  2026-11-22 by the owner: *«Puede aparecer en un texto en caja
  blanca como los de los diálogos pero sin triángulo de
  diálogos, en la pantalla negra […] de transición»*. A `later`
  part may have words: they show in the middle of the dark, in
  a bubble's box with no tail, and the dark waits for their
  reading.
- **D310 — The wizard may leave a part out of sight.** Decided
  2026-11-22 by the owner, of *The tower*: *«adentrándose igual
  en la oscuridad»*, and of its dormitory: *«desaparecer por la
  izquierda del escenario»*. In the last step of a part, before
  a `scene`, the wizard may walk out of sight as in a story's
  last step, and so may the one who speaks under `meanwhile`
  (D275), as its last action; its bubble stays where it was
  last seen until the step ends.

## 2. What is asked

### 2.1 The plates (D299)

- `world/kydux_world/api.py`: `MEMBERS["plate"] = ("position",)`.
  `plate` is not one of `THING_ROLES`, so nothing taught of a
  thing reaches a plate. `plate.position` enters the `api` of
  `content/levels/out-of-the-circle/level.json`; by D40 the
  levels after it know it. `check_api`, `allows`, `table()` and
  their tests follow.
- The world refuses any other member of a plate as a member not
  taught is refused, and `position` before *Out of the circle*
  the same way. A plate's `position` has its `x` and `y`
  (D153). The goals, Orla's orders and the lighting of a plate
  use the world's own plates and do not change.
- The page mirrors it: `app/src/ui/notebook.ts` (`roleOf`,
  `allows`) and the editor's completion. An object none of
  whose members is taught is not listed and not offered; from
  *Out of the circle* on, `moon`, `sun` and `star` show with
  `position` alone.
- The reminders in the starting code (the designer's texts, too
  small to brief). In `out-of-the-circle`, as the first comment
  after the cast, before the three steps, in Spanish and in
  English:

  ```
  # Los platos del suelo son tres objetos: `moon`, `sun` y `star`. Cada uno tiene su atributo `position`: `print(moon.position)` te dice en qué casilla está la luna.
  ```

  ```
  # The plates on the floor are three objects: `moon`, `sun` and `star`. Each has its attribute `position`: `print(moon.position)` tells you which cell the moon is on.
  ```

  In `orlas-orders`, before the last comment:

  ```
  # Recuerda: los platos son tres objetos, `sun`, `moon` y `star`, y cada uno tiene su `position`.
  ```

  ```
  # Remember: the plates are three objects, `sun`, `moon` and `star`, and each has its `position`.
  ```

- The notebook's entry, `notebook.plate.position` (and
  `notebook_simple.plate.position` where the simple notebook
  has one for a thing's):

  | | |
  |---|---|
  | es | La casilla en la que está el plato, en x e y. |
  | en | The cell the plate is on, as x and y. |

### 2.2 One familiar at a time, and a trial that is not moved (D297, D301)

- `world/kydux_world/level.py`, `_familiar`: the block takes
  `most`, 1 or 2, 1 when absent; only in stages `trial` and
  `birth`; the block has at least `most` cells in `trials`.
  `content/levels/the-slate/level.json` says `"most": 2`.
- `world.py`, `_k_made`: the objects the child's own lines make
  are counted (the object of the book's line, `booking`, is
  not). The one that goes over `most` stops the program at its
  line with Orla's words, the way `other_attribute` is told
  (`warn`, by Orla): `one_familiar` when `most` is 1,
  `two_familiars` when it is 2.
- `_k_looked_at`: the second class of a familiar written in the
  child's file in one program stops it the same way, at the
  class's line, with `told.one_class`; in *The slate* too. A
  living level keeps what it does today with a class and with an
  object.
- A level of stage `trial`: `move_up`, `move_down`, `move_left`,
  `move_right`, `pick_up` and `go_to` asked of a familiar stop
  the program with `told.too_soon`, by Orla, at the line, before
  any check of what is taught. In the birth level, an object not
  yet called keeps the wizard's thought.
- `_trial` keeps its way with a cell taken for what still
  reaches it: the same object cast twice.
- The lessons' plain Python (D170) is not the world's: nothing
  changes there.
- The words, under `told` in `i18n/*.json`, but
  `two_familiars`, which names the mate and so is one of *The
  slate*'s own words (`told` in its `text.<lang>.json`, D264).
  The first three and the English of the fourth are the
  designer's; the Spanish of the fourth is the owner's:

  | key | es | en |
  |---|---|---|
  | `one_familiar` | ¡Alto! Cada alumno crea un solo familiar cada vez. | Stop! Each pupil makes only one familiar at a time. |
  | `two_familiars` | ¡Alto! Con dos familiares basta: uno para ti y otro para {mate}. | Stop! Two familiars are enough: one for you and one for {mate}. |
  | `one_class` | ¡Alto! Cada alumno escribe una sola descripción de familiar cada vez. | Stop! Each pupil writes only one description of a familiar at a time. |
  | `too_soon` | Aún es pronto para mover a tu animal. Antes debes estar seguro de que es el que quieres, y debes decírmelo para que lo anote en el libro. | It is too soon to move your animal. First you must be sure it is the one you want, and you must tell me, so that I note it in the book. |

### 2.3 The notebook's list (D298)

`app/src/ui/notebook.ts`, in the tab of actions, when the
level's `familiar` block is of stage `trial` or `birth`: a
section after the wizard's actions. Its title and its line are
texts (`notebook.familiars.title`, `notebook.familiars.text`);
under them the six kinds of `familiarTable().kinds`, in the
table's order, each as code (`Fox`) with its word (the kinds'
words i18n has), and a button that writes the kind at the
cursor, as an example's button does. When the level's API has
`familiar.color`, each kind has its colours beside it, as code
strings (`"red"`), from the same table: the colours offered to
the child, never the friend's grey.

| key | es | en |
|---|---|---|
| `title` | Los familiares de primero | The first year's familiars |
| `text` | Un alumno de primero puede describir uno de estos seis. | A first-year pupil can describe one of these six. |
| `text_colours` | Un alumno de primero puede describir uno de estos seis, en uno de sus colores. | A first-year pupil can describe one of these six, in one of its colours. |

### 2.4 The familiar in the stories, and kept (D305)

- `showStory` (`app/src/main.ts`, `app/src/ui/story.ts`): the
  game's kept familiar (`kept.living ?? kept.draft`,
  `checkedFamiliar`) is given to every part's built world
  before its scene starts, so that `childsFamiliar` finds it. A
  game with none keeps the table's default.
- `world.py`, `_k_takes_over`: a class whose name is not the
  living familiar's kind is stopped by Orla with
  `told.kind_kept`, which names the kind kept
  (`{familiar_a_kind}`, as `told.pale_colour` does).
  `told.class_changed` stays for a changed `__init__`.

  | key | es | en |
  |---|---|---|
  | `kind_kept` | Ya has conjurado y sacado del círculo a {familiar_a_kind}: debes seguir con tu familiar, no puedes cambiarlo por otro. | You have already conjured {familiar_a_kind} and taken it out of the circle: you must go on with your familiar, you cannot change it for another. |

- The birth level played again says so first: *Out of the
  circle*'s `told.halt` has the owner's sentence as its first
  piece. It is the designer's commit, made already.

### 2.5 The others' familiars go to the moon (D302)

- `level.py`: `then` takes `way`, a list of corners; each leg
  is straight, on walked floor, and the way is checked on the
  level's map.
- `world.py`, `_closing`: after the step out of the circle and
  its `born` note, the actor walks the way, a cell a tick, each
  a `move` of its own; a move that ends on a plate lights it
  (D270). The walker may end on a cell the child's familiar
  holds; no other cell of the way is held by anyone.
- `content/levels/one-line-in-the-book/level.json`:
  `"then": {"born": "friend_familiar", "to": [7, 7], "way":
  [[7, 4], [6, 4]]}`.
- `content/levels/out-of-the-circle/level.json`:
  `"then": {"born": "mate_familiar", "to": [12, 7], "way":
  [[12, 5], [6, 5], [6, 4]]}`.
- `content/levels/the-slate/level.json`: the friend stands at
  [7, 5] facing left and her hare at [6, 5] facing right, by
  the moon's plate.
- The page (`scene.ts`): two familiars on one cell are drawn
  side by side. As the second arrives, the first slides about a
  quarter of a cell to one side and the second stops a quarter
  to the other; the slide takes about one step's time. The
  world's cells do not change.

### 2.6 The order's command (D303)

`tell` in `scene.ts`, `holdTick` in `playback.ts`: in a tick
that has an `order`, the hold is the reading of the pieces
before the last one; the last piece's bubble comes up as the
hold ends and stays for its own reading while the familiar
walks, or until other words take its place. An order of one
piece («{familiar}: ¡Con tu maga!») holds nothing. The first
words of an order come up within one tick's time of the
familiar's last step. Under the slider (`instant`) nothing
changes.

### 2.7 The hall at work (D300)

Only in `one-line-in-the-book`.

- *The mate's tries.* The level says `"tries": true` on
  `mate_familiar` in place of `"spark": true`; the world reads
  it as it reads a spark today. The page plays a cycle on that
  cell, on its own clock: a try comes up, stays about 2.5 s,
  fades in about 0.6 s; about 1.2 s later the next comes. A try
  is the spark, about one time in three, or one of the six
  kinds, pale or in one of its colours; never the same picture
  twice running. It plays before, during and after a run, with
  no sound. When the player asks for less motion (the scene's
  `still`, `prefers-reduced-motion`), it is the spark, standing.
- *The friend's orders.* `friend_familiar` takes `"drill"`, a
  loop of cells: `[[8, 6], [9, 6], [9, 7], [9, 8], [8, 8],
  [8, 7]]`. The validator asks that each cell is one step from
  the one before, the first one step from the actor's own cell
  and the last that cell; that all are inside the block's
  `circle`; and that none is a cell of `trials` or another
  actor's. On the page, the friend says an order in a bubble
  and the hare takes that one step, at the familiar's pace; the
  bubble stays for its reading, a short pause, the next order.
  It plays while the level stands with its card closed and no
  program running, and again after *Restart*. When a run begins
  it stops and the hare is on its own cell; it does not come
  back after a run in which the hare was born. With less motion
  asked it does not play. The browser tests and the pictures
  that need the hall standing ask for less motion.
- The order of the loop and the picking of a try are a module
  of their own with no Phaser in it (`app/src/engine/ambient.ts`
  or beside `trial.ts`), the random number given to it, with
  unit tests.
- `#scene[data-ambient]` says what plays (`tries`, `drill`,
  both, or nothing), for the browser tests.
- The friend's orders (`ambient.*`; `{name}` is her familiar's
  name; the designer's texts):

  | key | es | en |
  |---|---|---|
  | `move_up` | {name}, muévete arriba. | {name}, move up. |
  | `move_down` | {name}, muévete abajo. | {name}, move down. |
  | `move_left` | {name}, muévete a la izquierda. | {name}, move left. |
  | `move_right` | {name}, muévete a la derecha. | {name}, move right. |

### 2.8 The bubble's tail (D306)

`app/src/engine/bubble.ts`: `bubbleShift` is bounded by what
`bubbleTip` can reach: the box moves off a figure by no more
than `width/2 − 12` less the distance the screen's edge already
took. `bubble.test.ts` has the case of *The trail*, step 8: the
friend at [7, 9], the wizard at [10, 10], the camera's fit
`[[4, 2], [15, 11]]`, the words of that step in both languages.
A browser check reads the tail's tip and the speaker's head
there: within a quarter of a cell.

### 2.9 The stories' staging (D308, D309, D310)

- *Facing (D308).* `level.py`: `facing` (`up`, `down`, `left`,
  `right`) beside `wizard`, for a story and inside `scene`
  (`PART_STAGING`); it reaches the built world's start.
  `what-the-familiar-brought`: `"facing": "up"` in the parts of
  steps 11 and 13, whose `do` becomes `null`.
  `the-end-of-the-year`: `"facing": "up"` on the story.
- *Words on the dark (D309).* A story's `text.<lang>.json`
  takes `"later": {"<step>": "<words>"}`, the step's number as
  its key. `level.py` and `tools/i18n_check.py` ask that the
  step has a `scene` with `later: true` and that both languages
  have the same keys. `app/src/ui/story.ts`, `passTime`: the
  dark stays for the longer of `PASS_DARK` and the words'
  reading (`readingMs`); the words are in the middle of the
  screen, in a white rounded box of a bubble's font and
  padding, with no tail; a click or a key goes on, as with a
  step. In `what-the-familiar-brought`, step 13:

  | | |
  |---|---|
  | es | Tardáis un buen rato en contar la historia completa. |
  | en | It takes you a good while to tell the whole story. |

  The Spanish is the owner's; the English, the designer's.
- *Out of sight (D310).* `story_on_scene`: the step before a
  `scene`, like a story's last, may end with the wizard's `walk`
  and `vanish`; a `meanwhile` speaker may `vanish` as the last
  of its actions. `app/src/content/stories.ts`,
  `app/src/ui/story.ts`: the bubble of a speaker out of sight
  stays where it was last seen. Then, in `the-tower`:
  - step 6 ends: `mate` `walk [0, 15]`, `vanish`; `wizard`,
    after closing the door, `walk [0, 15]`, `vanish` (the two
    `face` actions go);
  - step 17: `friend` as it is; `wizard`
    `walk [[20, 11], [14, 11], [14, 6]]`, `vanish`; `mate`
    `walk [[21, 11], [14, 11], [14, 6]]`, `vanish`.

### 2.10 The openings (D307)

*The hall's tunnel.*

- `content/scenes/the-tower-hall/`: a terrain of kind `wall`,
  `"walk": "story"`, `"sight": false`, on [14, 3], [14, 2] and
  [14, 1] of `map.txt`.
- A cover on row 3, not `over` (D76: it is drawn over a figure
  on rows 0 to 2): the wall around and above the mouth, about
  x 1296..1488, y 96..340, without the mouth's dark opening
  (about x 1365..1415, y 265..335; measured on `ground.webp`,
  to be traced on the painting). One for the day's ground, one
  for the sunset's. Cut by the scene's tools
  (`tools/art/trace.py`, `cut.py`, `export_scene.py`) from the
  two grounds, entered in the scene's settings and `art.json`,
  and told in `SOURCE.md`.
- `content/stories/the-trail/story.json`: step 9, the familiar
  `walk [[13, 9], [13, 5], [14, 5], [14, 1]]`, with no
  `vanish`; step 10, `walk [[14, 9], [11, 9], [11, 10]]`, with
  no `appear`.
- To see, on a burst of frames (the sweep's way): the familiar
  goes into the mouth whole, nothing of it over the wall beside
  or above the mouth, and comes out of it the same way.

*The passage's back stairs and arch.*

- `content/scenes/the-tower-passage/map.txt`: [2, 9], [2, 10]
  and [2, 11] are `l` (story-walked wall).
- `art.json`, `lowered`: [6, 3]..[7, 3] by 0.4, so that Rinlo
  passes between the stool (about x 700..780, y 260..350) and
  the candle's box (about x 760..850, y 370..440); [2, 3]..
  [5, 3] by 0.65, the door's own lowering (D289) kept on to the
  landing, in place of the 0.3 of [2, 3]..[4, 3]: he goes down
  once and stays down. The figure goes before the open leaf and
  behind the jamb's block (`row-4-static.webp`), as today.
- A second cover on row 12, not `over`: the arch's wall, about
  x 0..384, y 905..1250, without its opening (about
  x 150..330, y 980..1160), traced on the painting. It is drawn
  over a figure on rows 0 to 11, so Rinlo on the last stairs is
  seen through the opening alone. `painted.ts` takes two covers
  on a row; the trench's cover of row 12 stays `over`.
- `lowered`: [2, 10] by 0.6 and [2, 11] by 0.3 to begin with,
  set on a burst of frames so that, once his legs show in the
  opening, no part of Rinlo shows above the arch's crown or
  beside its jambs.
- `content/stories/what-the-familiar-brought/story.json`:
  step 1, `"camera": {"fit": [[0, 0], [19, 14]]}`, `rinlo`:
  `stand`, `walk [6, 3]`, `open room_door`,
  `walk [[2, 3], [2, 12]]`, with no `vanish`: he stays under
  the arch. Step 2: `rinlo` `walk [[2, 13], [5, 13]]`, with no
  `appear`; the three `face` actions as they are.
- To see: Rinlo's way along row 3 goes down once; on the stairs
  and through the arch he is never over a wall; under the arch
  he stands whole.

The sweep (`tools/art/sweep.py`, `sweeps.spec.ts`) covers the
new cells of both scenes. A cover that hides too much or too
little is measured against the painting and cut again; the
figure is not moved to fit it.

### 2.11 The plates' figures (D304)

`tools/art/repaint.py` on `the-tower-hall`: the sun's box and
the star's (the boxes of `tower-hall-sun.md` and
`tower-hall-star.md`), with a new prompt each in
`tools/art/prompts/`: the same engraving, its lines as dark and
as wide as the moon's, the brass and the floor around kept. The
sunset's ground gets the same engravings the way that hour was
made from the day's (`SOURCE.md`). The lit pictures stay, and
still cover the engravings whole. `SOURCE.md` tells it. A close
picture of the three plates unlit, by day and at sunset, goes in
the report.

### 2.12 The zoom box at a scene's change

`app/src/ui/zoom.ts`, `refresh` → `canZoomBy` →
`SceneCamera.least` throws `Cannot read properties of undefined
(reading 'getBounds')` when a story changes its scene: the box
asks a camera whose scene is gone. `refresh` does nothing
without a live camera. `story.spec.ts` asks that a story with
parts ends with no page error.

### 2.13 The tests

- *World* (`world/tests/`): `test_api.py` (the plate's role,
  `plate.position` taught by *Out of the circle*, nothing of a
  thing's on a plate); `test_familiars.py` and
  `familiar_cases.json` (a second object, a third in *The
  slate*, a second class, a move in a trial level, a class of
  another kind in a living level, `most` validated, `then.way`
  walked and the moon lit, the walker ending on the child's
  cell); `test_stories.py` (`facing`, `later` words, the walk
  out of sight at a part's end, a `meanwhile` speaker's
  `vanish`; the refusals of each); `test_scenes.py` and
  `test_levels_content.py` (`drill`, `tries`, the new cells).
- *Tools*: `i18n_check.py`'s `later` keys; the art content's
  tests for the two new covers.
- *App, unit*: `notebook.test.ts` (no plate before *Out of the
  circle*, `position` alone after; the list of kinds, with and
  without colours), `bubble.test.ts` (D306), `playback.test.ts`
  or `scene`'s helpers (D303), the ambient module, `stories.
  test.ts` (`later` words, `facing`), the editor's completion.
- *Browser*: `chapter-5.spec.ts` (a second familiar stopped by
  Orla in *The circle*; three in *The slate*; a move in *One
  line in the book*; the hare on the moon, lit, after a win
  there; the two familiars on the moon in *Out of the circle*,
  apart on the screen; in *Orla's orders*, the familiar's first
  step to the star no later than the first piece's reading plus
  half a second after its last step onto the sun; `data-
  ambient`), `notebook.spec.ts` (the plates and the list),
  `story.spec.ts` (the game's crow in *The trail*; the words on
  the dark; the wizard facing up in the first frame of the two
  hall parts and of *The end of the year*; no page error),
  `sweeps.spec.ts` and `painted.spec.ts` (the new cells and
  covers), `walkthrough.spec.ts` where its pictures change.

### 2.14 What the owner will try

On `https://localhost:5173/?debug`, a game with chapter 5 open
and a familiar that is not a fox.

1. *The circle* (practice 1). The notebook shows nothing of
   `sun`, `moon` or `star`, and lists the six familiars, with no
   colours. Make two objects: Orla stops the program at the
   second. Write two classes: she stops it at the second.
2. *The name and the colour* (practice 2). The notebook's list
   has each kind's colours.
3. *One line in the book* (practice 3). Before running: the
   mate's tries come and go, a spark or an animal, and the
   friend orders her hare about its side of the circle. Add
   `pimu.move_left(1)`: Orla says it is too soon. Win the level:
   the hare leaves the circle and walks to the moon, which
   lights.
4. *The slate* (fix 1). Two familiars pass; a third is stopped,
   and so is a second class.
5. *Out of the circle* (practice 4). The starting code tells of
   the three plates and `position`; the notebook shows `moon`,
   `sun` and `star` with `position` only, and so does the
   completion after `moon.`. Played again with a familiar
   living, Orla says first that the level is done and is being
   repeated. In a new game, won: the mate's familiar walks to
   the moon and the two stand side by side on it.
6. *Orla's orders* (practice 5). The familiar reaches the sun,
   Orla speaks, and at «¡A la estrella!» the familiar is already
   walking. The sun and the star are told apart unlit. Change
   the class's name to another kind: Orla names the kind kept.
7. *The trail* (story 2). The familiar is the game's own, not a
   fox. In 8 of 22 the bubble is the friend's. In 9 and 10 the
   familiar goes up into the tunnel and comes out of it,
   walking.
8. *What the familiar brought* (story 4). In 1 of 28 Rinlo
   walks out between the stool and the candle, goes down once,
   down the stairs and through the arch, and waits under it; in
   2 he comes from there. In 11 and 13 the wizard looks at Orla
   from the first frame. Between 12 and 13 the dark screen says
   «Tardáis un buen rato en contar la historia completa.»
9. *The end of the year* (story 5). The wizard looks at Orla
   from the first frame.
10. *The tower* (story 1). In 6 the mate and the wizard leave
    by the left after the others. In 17 the three go into the
    dark of the arch and none stays in it.

### 2.15 What is left out, and why

- *The friend's and the mate's shows in other levels.* The
  owner asked them of *One line in the book*; the other levels
  keep their figures still.
- *The mate walking its familiar by code of its own.* Its way
  is the level's `then`; no second program runs.
- *A familiar's colour kept as its kind is.* The owner's rule
  names the animal; a living level has no line that makes the
  object again, so nothing there changes its colour.
- *The link to the landing page.* The owner withdrew it: the
  start screen's *What is Kydux* is that way.
- *A new painting of the hall or the passage.* The paintings
  stay; only the plates' two boxes are painted again, and the
  covers are cut from what is painted.

## 3. The pieces

One local commit each, in this order. Before each commit,
`ci/check.sh` and the browser specs the piece touches, green.

### 3.1 The plates (D299; 2.1)

The role, the API of *Out of the circle*, the notebook and the
completion, the two reminders, the notebook's entry.
`test_api.py`, `notebook.test.ts`, `notebook.spec.ts`,
`chapter-5.spec.ts`.

### 3.2 One familiar at a time, a trial not moved (D297, D301; 2.2)

`most`, the two stops, the stop of a move, the four texts.
`test_familiars.py`, `chapter-5.spec.ts`.

### 3.3 The notebook's list (D298; 2.3)

`notebook.ts`, its texts and tests.

### 3.4 The familiar in the stories, and kept (D305; 2.4)

The kept familiar in a story's parts; `kind_kept`.
`story.spec.ts`, `test_familiars.py`, `chapter-5.spec.ts`.

### 3.5 To the moon (D302; 2.5)

`then.way`, the three levels, the two familiars side by side.
`test_familiars.py`, `chapter-5.spec.ts`, `walkthrough.spec.ts`.

### 3.6 The order's command (D303; 2.6)

`scene.ts`, `playback.ts`, their tests, `chapter-5.spec.ts`.

### 3.7 The hall at work (D300; 2.7)

`tries`, `drill`, the ambient module, the four texts.
Unit tests, `chapter-5.spec.ts`.

### 3.8 The bubble's tail (D306; 2.8)

`bubble.ts`, `bubble.test.ts`, `story.spec.ts`.

### 3.9 The stories' staging (D308, D309, D310; 2.9)

`facing`, the words on the dark, the walk out of sight, the
three stories. `test_stories.py`, `stories.test.ts`,
`story.spec.ts`.

### 3.10 The openings (D307; 2.10)

The hall's tunnel, then the passage's stairs and arch, a commit
each if that is easier. `sweeps.spec.ts`, `painted.spec.ts`,
`story.spec.ts`; bursts of frames of the two walks.

### 3.11 The plates' figures (D304; 2.11)

Gemini's two boxes, both grounds. `painted.spec.ts`,
`walkthrough.spec.ts`.

### 3.12 The zoom box, the documents, the whole check and the report

2.12. D297 to D310 in `docs/dev/architecture.md`, in the
present, and D40, D76, D153, D264, D267, D270, D275, D280 and
D288 brought to it where they tell what this sprint changes;
the documents that tell a level's `familiar` block, a story's
keys and a scene's art; `docs/dev/plan.md`. `ci/check.sh --e2e`
whole, once, in a copy. The report in Spanish, in `drafts/`: the
ten steps of 2.14, each with pictures of the current commit
only (the notebook in practices 1, 2 and 4; Orla's four stops;
the hall at work, three frames; the hare on the moon; the two
familiars on the moon; the three plates unlit, close, by day
and at sunset; *The trail* 8, 9 and 10; story 4's 1 and 2 as
strips of frames, and its dark screen with the words; the first
frames of the hall parts; *The tower* 6 and 17); what was
decided where the plan does not decide. The memory note
`kydux-sprint-59-state`, and the prompt for the designer's
review.

## 4. Gemini

Pictures: the sun's and the star's boxes of the hall's ground,
by day and at sunset (D304); eight images at most, retries
included. No text is asked of Gemini: the texts here are the
owner's own or too small to brief, and each is marked.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 59, from the owner's UAT of chapter 5 on
2026-11-22. The designer has applied the texts, the default
look, two stories' staging and chapter 5's music already. You
build the rest: the hall's rules for familiars, the other pupils
at work, the familiar kept and shown in the stories, and the
stories' staging that needs new keys, covers and cells. Build on
the last commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-59.md (this plan, whole),
and in docs/dev/architecture.md D40, D76, D153, D170, D175,
D260 to D275, D277, D280, D282, D288 and D289. Then your memory
notes kydux-sprint-56-state, kydux-sprint-57-state,
kydux-mask-fit-not-figure, kydux-checks-per-piece,
kydux-report-images-current, kydux-no-co-authored-by,
kydux-docs-present-tense and kydux-github-only-code-and-docs.
Then the code: world/kydux_world/api.py, world.py (the familiars'
part), level.py (_familiar, story_on_scene), familiars.py;
app/src/engine/scene.ts (tell, the familiars), bubble.ts,
playback.ts, layout.ts, painted.ts; app/src/ui/notebook.ts,
story.ts, zoom.ts; app/src/content/familiar.ts and stories.ts;
the levels the-circle, the-name-and-the-colour,
one-line-in-the-book, the-slate, out-of-the-circle and
orlas-orders; the stories the-tower, the-trail,
what-the-familiar-brought and the-end-of-the-year; the scenes
the-tower-hall and the-tower-passage with their art.json.

What is asked, in short; the plan has each in full, with the
cells, the numbers and every text in both languages.

1. The plates (D299). A role "plate" whose one member is
position, taught by out-of-the-circle; before it the notebook
and the completion show nothing of moon, sun and star, after it
position alone. Two reminders in the starting code.

2. One familiar at a time (D297, D301). The familiar block's
"most" (1 by default, 2 in the-slate). Orla stops the program at
the object that goes over it, at a second familiar class, and at
a move asked of a familiar in a trial level.

3. The notebook lists the six kinds where a familiar is
described, with their colours once familiar.color is taught
(D298).

4. The game's kept familiar is the figure of every story part
(D305): today a story draws the default fox. In a living level
a class of another kind is stopped with words that name the
kind kept.

5. then.way (D302): the friend's hare in one-line-in-the-book
and the mate's familiar in out-of-the-circle walk to the moon's
plate after stepping out; two familiars on one cell are drawn
side by side. The-slate's friend and hare stand by the moon.

6. An order's last piece, the command, does not hold the tick
(D303).

7. The hall at work in one-line-in-the-book (D300), the page's
own show: the mate's tries come and go always; the friend orders
her hare round a loop of cells while no program runs. A module
with no Phaser, the random given; #scene[data-ambient].

8. A bubble's box never moves farther than its tail reaches
(D306); the case is the-trail, step 8.

9. Stories (D308, D309, D310): "facing" beside "wizard"; words
on the dark of a "later" part; the wizard, and a meanwhile
speaker, walking out of sight at a part's end. The restagings
of the-tower, what-the-familiar-brought and the-end-of-the-year.

10. The openings (D307): story-walked cells behind the hall's
tunnel and on the passage's back stairs, a cover for each cut
from the painting by the scene's tools (the stones without the
opening), the lowerings of the passage's row 3 and stairs, and
the-trail and story 4 restaged so that the figure walks through
and never fades at a wall. Fix the cover, never the figure.

11. The sun's and the star's engravings as dark as the moon's,
by Gemini with tools/art/repaint.py, both grounds (D304).

12. The zoom box's page error at a story's change of scene.

Build pieces 3.1 to 3.12 in order, one local commit each. Before
each commit, ci/check.sh and the browser specs the piece touches
green; the whole ci/check.sh --e2e once, before the report, in a
copy with Playwright's own server and the app built anew in that
copy. Never a push, never a timer, never a deploy. Never stop or
build into the servers on ports 443 and 5173; a preview left on
4173 is a browser run's leftover and may be stopped, and yours is
stopped when you are done. Nothing under .github/ changes.
Gemini: eight images at most, for piece 3.11 alone; no text. The
key stays in ~/.config/kydux/secrets.env.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for is the ten steps of the plan's
2.14. The ones most looked at:
(1) practice 1's notebook with no plates and with the six
    familiars; a second object and a second class stopped;
(2) practice 3 alive: the mate's tries, the friend's orders,
    Orla's "too soon", the hare to the moon;
(3) practice 4: two familiars side by side on the moon;
(4) practice 5: the familiar walking as Orla says the command;
(5) story 2 with the game's own familiar, the friend's bubble
    hers, the familiar walking into the tunnel and out of it;
(6) story 4: Rinlo's way out, down and through the arch; the
    words on the dark screen; the wizard facing Orla at once.

Enter D297 to D310 with the plan's words, and bring the
decisions and documents the plan's 3.12 names to the present.
Where the plan does not decide (names of functions and of
styles, the exact times of the show, the covers' exact outlines,
the lowerings' last values, how the page learns of two familiars
on a cell), take the smallest choice that keeps its intent and
say it in the commit. The plan's cells and pixel boxes were
measured on the paintings by the designer: check each on the
painting before you cut, and say what you changed. Do not build
what section 2.15 leaves out. Every user-facing string through
i18n, the same keys in both languages; enter the plan's texts as
they are. Never edit content while a browser run is going. Every
document and comment in the present. Before git add, read git
diff of each file and stage only your own hunks; nothing of
drafts/ or art/raw/ enters a commit.

docs/dev/sprint-59.md is the designer's and is committed
already; leave it as it is.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.12 asks, with the steps of 2.14 and pictures of the current
commit only. Write your memory note kydux-sprint-59-state, and
end with the prompt for the designer's review in English, in a
code block.
```

## 6. Added on 2026-11-22: the three leave the dormitory

The owner, of *The tower*'s parts 5 and 6, after the plan was
handed over: *«Solo hay tres alumnos de primero que son los
tres amigos»*; *«Cuando digo se ve a los alumnos salir me
refiero a los tres amigos. No hay más alumnos de primero.»*

### 6.1 The decision

- **D311 — The first year is the three friends.** Decided
  2026-11-22 by the owner. The wizard, the friend and the mate
  are the whole first year: no story, level or text shows or
  names another first-year, and the pupils seen leaving the
  first-years' dormitory are those three. A walk-on pupil
  (`classmate_boy`, `classmate_girl`) is of another year, as
  the second-years of *The flying lesson* are.

### 6.2 What is asked

This takes the place of 2.9's step 6 of `the-tower`, which the
open leaf of `front_door` stops (it covers [9, 15] and
[10, 15], and the mate reaches [10, 15] before the wizard has
shut the door). Step 17 stays as 2.9 has it. The texts of steps
5 and 6 stay as they are.

`content/stories/the-tower/story.json`:

- `actors`: `mate` as it is; `friend`, of kind `friend`, at
  [12, 9], facing `right`. `classmate_boy` and `classmate_girl`
  go.
- Step 5, its `camera` as it is. The three come to the door and
  the friend opens it:
  - `friend`: `walk [12, 13]`; `open front_door`;
  - `mate`: `walk [[14, 10], [12, 10], [12, 12]]`;
  - `wizard`: `walk [[16, 9], [14, 9], [14, 10], [12, 10],
    [12, 11]]`.
- Step 6. The three go out, the wizard shuts the door, and they
  leave by the left (D310):
  - `friend`: `walk [[12, 15], [11, 15]]`; `face right`;
    `face left`; `walk [0, 15]`, `vanish`;
  - `mate`: `walk [[12, 15], [14, 15]]`; `walk [0, 15]`,
    `vanish`;
  - `wizard`: `walk [12, 15]`; `close front_door`;
    `walk [0, 15]`, `vanish`.

  The figures are named in that order, the friend first. Tick
  by tick: the wizard shuts the door in the fifth, the friend
  steps onto [10, 15] in the sixth, the wizard follows it, and
  the mate, who stood aside at [14, 15], goes last. The
  designer checked steps 1 to 6 with `story_on_scene` on
  `the-dormitory`, step 6 as a story's last.

`app/src/engine/painted.ts`, `figureName`: the comment calls
`classmate_boy` and `classmate_girl` pupils of another year.
*The flying lesson* stays as it is: its words make them
second-years.

The tests: `test_stories.py` asks that `the-tower` has neither
walk-on pupil and that step 6 ends with none of the three in
sight; `chapter-5.spec.ts`, *the-tower is told to its end*,
follows. The walkthrough's pictures of parts
5 and 6 are taken again.

### 6.3 What the owner will try

In place of 2.14's step 10, *The tower* (story 1): in 5 the
three friends come to the dormitory's door and the friend opens
it. In 6 they go out, the wizard shuts the door, and the three
leave by the left; none stays in sight, and no other pupil is
seen. In 17 the three go into the dark of the arch and none
stays in it.

### 6.4 The prompt for CLAUDE-programmer

A follow-up of the sprint's prompt, pasted without clearing the
programmer's context.

```
A follow-up to sprint 59, from the owner's answer after the
plan was handed over. It belongs to piece 3.9 (the stories'
staging); build it there, or as its own commit if 3.9 is done.

Read section 6 of docs/dev/sprint-59.md, which the designer has
added and committed (the rest of the document is as it was).
In short: the first year is the three friends alone (D311), so
in the-tower the two walk-on pupils go, the friend stands in
the common room from the start, and steps 5 and 6 are staged as
6.2 says: the three come to the door, go out, the wizard shuts
it and the three leave by the left, out of sight (D310). 6.2
takes the place of 2.9's step 6, which the door's open leaf
stops; step 17 stays as 2.9 has it. The texts stay as they are.

Enter D311 with D297 to D310, in the plan's words. Change the
comment of figureName as 6.2 says, and bring any document that
calls the walk-on pupils first-years to the present. The tests
of 6.2; the walkthrough's pictures of the-tower's parts 5 and 6
taken again. In your report, step 10 of 2.14 is read as 6.3.

The rules of the sprint's prompt hold: the designer's staging
was checked with story_on_scene, but check it on the page too,
and say what you changed; never edit content while a browser
run is going; stage only your own hunks.
```

## 7. The designer's own: the theme's time on the page of themes (D312)

Added on 2026-11-22, built by the designer while the sprint was being
built; nothing here is the programmer's to build.

The owner, hearing chapter 5's theme: one tone far louder and lower than
the rest, like a string, at a change of style; and a wish for the debug
page to show the theme's time, with a slider to go to a moment, so as to
say at which second a sound is and to find its voice.

**The tone.** It was the engine's, not the score's: a bowed pad's line
just made sounded at full gain for a moment (`bowed()` in
`app/src/engine/music.ts` took back the silence the line started from).
In *The familiar* the pad's chord grows from three notes to four at the
change to the second part, 32.7 s in, and the fourth, a middle C, burst
out. A line just made keeps its silence; a test holds it.

**D312 — The theme's time on the page of themes.** Decided 2026-11-22 by
the owner. On `?debug#music`, over the voices of the theme that plays, a
slider as long as the theme's loop follows the music, and takes the theme
to the second it is let go at; beside it are the second that sounds, the
loop's length and the section, as `32.7 s of 98.2 s, part b`. The voices
set by hand stay as set. So a sound that is wrong is told by its second,
and its voice is found by going back to it with one voice off after
another. The music has `position` and `seek(seconds)` for it: the cut to
another moment takes 0.05 s, and a note that started before that moment is
not sounded, so a pad's chord comes in at its next bar.

The designer enters D312 in `docs/dev/architecture.md` at the sprint's
review, with the page's lines there (the file holds the programmer's
entries of D297 to D311 until then).
