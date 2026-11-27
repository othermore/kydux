# Sprint 61 — Variables one step at a time, and what the program has

Asked by the owner on 2026-11-25, after watching children play
chapter 2: the first level of the library asks for three new
things at once (find a thing, keep it in a variable, call a
method on that variable), and the lesson before it is seven
pages long. The owner reviewed the whole design in two documents
with comments, and asked for one sprint that gives something
complete: chapter 2 taught one idea a lesson, the same rule for
what is found in chapters 3 to 5, two lists over the editor that
show what the program has, the program a child was writing kept,
and no way of leaving a level by mistake. The owner's words head
each decision of section 1.

The texts the child reads are final. They were drafted by Gemini,
corrected by the owner line by line, and are handed over in
`drafts/sprint-61-final/` (section 4). Nothing of `drafts/`
enters a commit: the programmer copies those files into
`content/` and `i18n/`.

**Where it is today.**

- *Chapter 2* has 19 stops. Its lesson `what-things-know` (seven
  pages) teaches attributes, `print`, a method that gives a
  value back, a variable, adding variables and `reveal`. The
  level after it, `the-lost-book`, is the first where the child
  writes `book = wizard.find_nearest("book")` and then
  `book.reveal()`.
- *What the program holds.* `World.namespace()`
  (`world/kydux_world/world.py`) gives the program `wizard`,
  every actor that is not someone's familiar, and **every thing
  that is not carried, by its id**. So `key.reveal()`,
  `old_book.reveal()` or `broom_0.untie()` run with nothing
  found, and a child who writes `wizard.reveal(key)` or
  `book.reveal()` gets an answer that does not say what is
  missing. The notebook (`heldObjects`,
  `app/src/ui/notebook.ts`) lists the same objects.
- *The program written.* A level opens on its starting code
  every time (D131). A child who leaves a level by mistake (the
  browser's menu under a two-finger click, a sideways swipe)
  comes back to an empty editor. The map opened from a level
  covers the whole page.
- *Lessons.* A page with code to try can be passed without
  trying it.
- *The words.* The game's answers and the notebook say
  *acción*; the lessons of chapters 4 and 5 say *guardar bajo un
  nombre* where the course already says *variable*.

## 1. Decisions taken here

Each is in `docs/dev/architecture.md` in full.

- **D342 — Chapter 2 teaches one idea a lesson, on 24 stops.**
  The owner: *he notado que el primer nivel de la biblioteca se
  les hace un poco difícil. Tienen que hacer un find_nearest
  pero tienen que asignarlo a una variable, y eso les confunde,
  y luego tienen que usar esa variable para hacer el reveal*,
  and *habría también que partir la lección de lo que las cosas
  saben de si mismas, porque es muy larga, y pensar bien el
  orden de lo que explicamos y qué nivel o niveles metemos en
  medio*. Three lessons and three short levels come before
  `the-lost-book`; `what-things-know` is gone; attributes are
  taught in chapter 3.
- **D343 — The first variable is practised on a number used
  three times, and a practice may come with a line written.**
  The owner: *Sí. Es un objetivo obligatorio*, and *No hay
  problema, puede haber una línea ya escrita (y puede que más
  adelante también lo aceptemos, no es un problema)*.
- **D344 — What is to be found is no variable until the program
  finds it and keeps it.** The owner: *Me parece bien que lo que
  se supone que el niño tiene que encontrar, requiera que se
  encuentre antes de poder usarlo*, and, of chapters 3 to 5,
  *Hay que hacerlo ya, tenemos que dar algo completo*. A level
  says `"to_find"`; a thing may say `"variable": false`.
- **D345 — A found thing is kept in a variable the child names,
  and no text names a variable as its search word.** The owner:
  *Me parece bien obligatorio*, and *Eso solo ayuda en español,
  pero no en ingles […] en inglés hay que encontrar otros
  nombres para que se vea el mismo efecto*.
- **D346 — Two lists over the editor: what the program has, and
  what is to find.** The owner: *justo arriba del código ver una
  lista […] con los objetos que están disponibles en ese nivel*;
  *Dejalo en tienes y "por encontrar"*; *Fichas alargadas en vez
  de cuadrados -> Sí, vamos a intentar no quitar mucho espacio
  al editor […] Puede usarse una fuente más pequeñita*; *Sí,
  cualquier variable que se declare en el programa. Pero quizás
  necesitamos un método de scroll*; *Un brillo al ejecuta --> No
  hace falta*.
- **D347 — The notebook says what the program has and what is to
  find, and says *Objetos* and *Métodos*.** The owner: *en el
  cuaderno podemos distinguir entre "cosas disponibles" y "cosas
  que tienes que encontrar antes de usar"*.
- **D348 — The editor completes after a dot from the variables
  the lists know.** The owner: *mejor no completar antes del
  punto, creo que va a confundir demasiado al niño. Y mejor no
  completar una cadena tampoco. Pero lo de usar las variables
  que hemos detectado, sí.*
- **D349 — The game answers the four mistakes of a first
  variable in the child's words.** A find not kept; a method
  asked of the wizard that is another object's; a search word
  used as a variable; the book kept under the search word.
- **D350 — *Variable* and *método* are the game's words.** The
  owner: *Está bien decir lo de guardar bajo un nombre, o darle
  un nombre, pero solo las primeras veces, y luego hay que usar
  el término variable*; of *método*, *Hay que repasarlo ya y
  hacer un sprint completo*; and, of the one level before the
  word is taught, *Podemos decir acción y poner entre paréntesis
  un método y decir que lo explicaremos luego*.
- **D351 — A saved game keeps the program being written, one,
  and *Código original* asks before it erases.** The owner:
  *estaría super bien que cuando un niño deja una partida a
  medias […] se quede guardado lo que tiene escrito*; *Creo que
  lo mejor es que solo guardemos un nivel […] un único "notepad"
  que sabe qué nivel es y el código que tiene […] Y si se
  presiona el reset del código, se borra el notepad y se carga
  el código por defecto del nivel (quizás hay que pedir
  confirmación al hacer reset)*; *Vamos a poner Ejecutar,
  reiniciar y parar, y código original en una fila, y cuaderno y
  pista en la otra. Quizás le podríamos poner iconos a los
  botones y poner el texto más pequeño*. It takes D131's place.
- **D352 — From a level the map opens as a window over it.** The
  owner: *Quizás el mapa puede verse como una ventana "modal"
  superpuesta encima y así se ve que tienes detrás todavía tu
  nivel, y pinchando fuera o dándole a cerrar en la esquina,
  vuelves?*
- **D353 — No screen of the game is left by mistake.** The
  owner: *a mi hijo le pasaba que a veces se salía del nivel
  […] hacía clic con dos dedos (clic derecho) y en el menú
  desplegable le daba a "atrás"*; *Sin menú del navegador en las
  pantallas del juego -> OK. Sin gesto de deslizar para ir atrás
  -> OK.*
- **D354 — A lesson's page with code is passed by trying it.**
  The owner: *No dejemos que pase, tiene que hacerlo.*
- **D355 — A level may give a figure words for the moment a
  thing lights.** The friend's, in `the-hidden-key`: the owner's
  *OK* to the friend as the speaker.
- **D356 — A saved game on a course that has grown keeps what it
  won, and nothing it had open closes.** The owner's *OK* to:
  the new stops show as not done, nothing closes, the stars
  count the new levels once played.
- **D357 — A tip for the comments, and a tip for the two lists
  once the child's game has them.** The owner, 2026-11-26:
  *Habría que añadir algún consejo nuevo explicando lo de TIENES
  y POR ENCONTRAR y, si no tenemos, uno recordando lo de los
  comentarios*.
- **D358 — A tip's picture is shown as a photograph pinned up:
  framed, a little turned, a pin over it.** The owner,
  2026-11-26: *a veces los niños intentan hacer clic en los
  botones de las capturas de los consejos*, and of the ways put
  to them: *la imagen girada con un marco tipo foto y una
  chincheta la veo bien*.

## 2. What is asked

### 2.1 Chapter 2's stops (D342, D343, D345)

`content/chapters/02-the-library/chapter.json`, `items`:

| # | Item | Kind | Title (es) |
|---|---|---|---|
| 1 | `story:the-entrance` | story | |
| 2 | `story:the-first-night` | story | |
| 3 | `lesson:the-right-place` | lesson 1 | |
| 4 | `level:your-bed` | practice 1 | |
| 5 | `story:the-morning` | story | |
| 6 | `story:at-the-library` | story | |
| 7 | `lesson:a-name-for-a-value` | lesson 2, new | Un nombre para un valor |
| 8 | `level:the-reading-room` | practice 2, new | Entre las mesas |
| 9 | `lesson:each-thing-its-methods` | lesson 3, new | |
| 10 | `level:wennas-door` | practice 3, new | La puerta de Wenna |
| 11 | `lesson:finding-things` | lesson 4, new | Encontrar cosas |
| 12 | `level:the-fallen-book` | practice 4, new | El libro caído |
| 13 | `level:the-lost-book` | practice 5 | El libro perdido |
| 14 | `lesson:giving-things` | lesson 5 | |
| 15 | `level:the-book-returned` | practice 6 | |
| 16 | `lesson:keys-and-doors` | lesson 6 | |
| 17 | `level:the-hidden-key` | practice 7 | |
| 18 | `lesson:the-distance` | lesson 7 | |
| 19 | `level:the-moving-key` | fix 1 | |
| 20 | `lesson:counting-with-names` | lesson 8 | Contar con variables |
| 21 | `level:eldras-door` | improve 1 | |
| 22 | `lesson:fendra` | lesson 9 | |
| 23 | `level:eldras-room` | practice 8 | |
| 24 | `story:the-wand-bank` | story | |

`content/lessons/what-things-know/` is deleted. Every title is
in the text files of section 4.

**The lessons.** Each new lesson's `lesson.json`, `es.md` and
`en.md` are in `drafts/sprint-61-final/content/lessons/<id>/`,
and so are the changed files of `giving-things`,
`keys-and-doors`, `the-distance`, `counting-with-names`,
`fendra` (chapter 2) and `where-i-am` (chapter 3, four pages:
it teaches the attributes `wizard.items`, `door.locked` and
`position`). `wizard.items` and `door.locked` are in no
`teaches` of chapter 2 and in no `api` of its levels; a test of
the course (`world/tests/test_course_content.py`) holds that no
level's `api` names a member no lesson before it teaches, as
today. What each `lesson.json` teaches:

| Lesson | `speaker` | `teaches` |
|---|---|---|
| `a-name-for-a-value` | `wenna` | `concept:print`, `concept:variables`, `concept:arithmetic` |
| `each-thing-its-methods` | `wenna` | `door.open` |
| `finding-things` | `wenna` | `wizard.find_nearest`, `thing.reveal` |
| `giving-things` | as today | `wizard.find_item`, `wizard.give` |
| `keys-and-doors` | as today | nothing (`[]`): the door's `open` is lesson 3's, and the lesson is the key's |
| `the-distance` | as today | `thing.distance_to` |
| `counting-with-names` | as today | nothing (`[]`) |
| `fendra` | as today | nothing (`[]`) |
| `where-i-am` (chapter 3) | `friend` | `wizard.items`, `door.locked`, `wizard.position`, `thing.position` |

`wizard.pick_up` is taught by chapter 1 (`things-to-carry`), as
today.

**The story.** `content/stories/at-the-library/`: step 5 is
`{"who": "wenna", "do": [{"walk": [8, 17]}]}`: Wenna walks to
the door, stays beside it and does not open it. The texts of
the story are in section 4's folder.

**The four levels**, all on `the-library`, speaker `wenna`,
`carrying: ["wand"]`, the door at `[7, 16]` with `"art":
"wenna_door"`. The texts (`text.es.json`, `text.en.json`: title,
goals, starting code, intro, outro, learned, three hints) are in
section 4's folder. Cells are `[column, row]` of
`content/scenes/the-library/map.txt`.

| | `the-reading-room` | `wennas-door` | `the-fallen-book` | `the-lost-book` |
|---|---|---|---|---|
| `kind` | practice | practice | practice | practice |
| `start` | `[7, 19]` | `[7, 17]` | `[7, 15]` | `[3, 15]` |
| `end` | `[7, 17]` | `[7, 15]` | none | none |
| the door | closed, `"variable": false` | `{"kind": "door", "id": "door"}`, closed, not locked | open, `"variable": false` | open, `"variable": false` |
| the book | none | none | `{"kind": "book", "id": "fallen_book", "at": [3, 15]}`, in sight | `{"kind": "book", "id": "old_book", "at": [1, 13]}`, as today |
| `wenna` | `[8, 17]` | `[8, 17]` | `[5, 17]` | `[5, 17]` |
| `mate` | `[8, 19]` | `[5, 17]` | `[9, 17]` | `[9, 17]` |
| `api` | the four `wizard.move_*` | the four moves, `door.open` | the four moves, `wizard.pick_up`, `wizard.find_nearest`, `thing.reveal` | the same as `the-fallen-book` |
| `to_find` | none | none | `["book"]` | `["book"]` |
| goals | `reach` E; `move_by_variable`; bonus `numbers_under` 2 | `open` `door`; `reach` E | `uses` `reveal`; `collect` `fallen_book` | `collect` `old_book`; `own_name`; bonus `uses` `reveal` |
| `tick_limit` | 40 | 20 | 40 | 100 |

The facing of each figure is chosen on a picture of the level
at its start: Wenna and the friend look at the wizard or at the
door, never at a wall.

*`the-reading-room`* (Entre las mesas). The tables of row 18
leave two gaps, columns 5 and 9. `solution.py`:

```python
steps = 2
wizard.move_left(steps)
wizard.move_up(steps)
wizard.move_right(steps)
```

The friend stands at `[8, 19]`, on the way to the other gap:
the level has one way and one solution. `wrong/numbers_by_hand.py` is the same walk with `2` typed
three times: it reaches the door and does not win.
`wrong/one_step_short.py` uses `steps = 1`. The goal
`numbers_under` with `"count": 2` is today's kind: it is met by
a program whose code holds one number.

*`wennas-door`*. `solution.py` is `door.open()` and
`wizard.move_up(2)`. `wrong/door_closed.py` walks without
opening; `wrong/open_of_the_wizard.py` is `wizard.open()` and
the walk: the run ends on 2.5's answer.

*`the-fallen-book`*. The starting code holds one line that
works, the translated variable's name in it (D343): `tesoro =
wizard.find_nearest("book")` in Spanish, `treasure = …` in
English, and a comment under it, from the text files. On
winning Wenna keeps the book: the outro says so, and nothing is
carried into the next level. `solution.py`:

```python
treasure = wizard.find_nearest("book")
treasure.reveal()
wizard.move_left(4)
wizard.pick_up()
```

`wrong/never_lit.py` picks the book up without `reveal`;
`wrong/reveal_of_the_wizard.py` writes `wizard.reveal(treasure)`;
`wrong/search_word.py` writes `book.reveal()`: each ends on its
answer of 2.5.

*`the-lost-book`*. The starting code holds comments only.
`solution.py`:

```python
eldras_book = wizard.find_nearest("book")
eldras_book.reveal()
wizard.move_right(8)
wizard.move_up(4)
wizard.move_left(10)
wizard.move_down()
wizard.pick_up()
```

The three `wrong/` programs of today keep their walks from the
new start and name their variable `eldras_book`. A fourth,
`wrong/kept_as_book.py`, is the solution with the variable named
`book`: the book is collected, the level is not won, and the
run says 2.5's fourth answer.

**The other levels of chapter 2.** In section 4's folder, with
their starting code, hints and solutions' variable names
changed. Their `level.json`:

| Level | `to_find` | What else |
|---|---|---|
| `the-book-returned` | `["book"]` | the carried book is found with `wizard.find_item("book")`, as today (D123) |
| `the-hidden-key` | `["key"]` | `"told": {"revealed": [["mate", "revealed"]]}` (2.9) |
| `the-moving-key` | `["key"]` | its starting code keeps the key in `llave_de_eldra` / `eldras_key` |
| `eldras-door` | `["key"]` | its starting code names `llave_de_eldra`, `pasos` / `eldras_key`, `steps` |
| `eldras-room` | `["book"]` | |

Every `solution.py`, `solutions/*.py` and `wrong/*.py` of these
five that names `key` or a book by its id finds it first and
keeps it in the English name of 2.4's table. A wrong program
that was wrong only by a walk stays wrong by that walk.

### 2.2 The two new goals (D343, D345)

In `world/kydux_world/goals.py`, both checked on the code's
tree before the run, as `uses` is:

- **`move_by_variable`**: met when some call of `wizard.move_up`,
  `move_down`, `move_left` or `move_right` has, as its first
  argument, a name that an assignment of the program gives a
  whole number written by hand (`steps = 2`).
- **`own_name`**: `{"kind": "own_name", "find": "book", "not":
  ["book", "tesoro", "treasure"]}`. Met when the program has at
  least one assignment of `wizard.find_nearest("<find>")` or
  `wizard.find_item("<find>")` to a single name, and no such
  assignment's name is in `not`. `find` is a kind of
  `THING_KINDS`; `not` is a list of Python names, both held by
  the level's check.

Their words are the level's own (`goals` in its text files), as
every goal's.

### 2.3 What the program holds (D344)

**The rule.** A program starts with:

- `wizard`;
- every actor that is not someone else's familiar;
- every thing of kind `door`, `hole` or `bed`, by its id, unless
  the thing says `"variable": false` or its kind is in the
  level's `to_find`;
- the `Familiar` class and the living familiar, as today.

No thing of another kind is ever a variable: a key, a book, a
wand, a potion, a map, a broom, a thread, a ring, a trail, a
plate. The program reaches one with `wizard.find_nearest`,
`wizard.find_all` or `wizard.find_item` and keeps what comes
back.

**The level's keys** (`world/kydux_world/level.py`).

- `"to_find": ["book"]`: the kinds the level asks the child to
  find. A list of kinds of `THING_KINDS`, none twice; each has at
  least one thing in the level, counting what the wizard carries
  (`carrying`) and the scene's fixed things. Any other value is a
  `LevelError` that names the level and the kind.
- A thing's `"variable": false`: the thing is in the world and
  is drawn, and it is no variable, has no chip and no page of
  the notebook. Only `false` is said, and only by a thing of
  kind `door`, `hole` or `bed`.

**Where.** `World.namespace()` and `heldObjects`
(`app/src/ui/notebook.ts`) follow the one rule; `Level.ids()`,
which `explain` uses for its suggestions, gives the variables'
names only. A thing's `repr` names its id only when it is a
variable: `print(treasure)` writes `<book at 3, 15>`, and
`print(door)` writes `<door door closed>` as today.

**The levels.**

| Chapter | Level | Given, beside `wizard` | `to_find` |
|---|---|---|---|
| 2 | `the-fallen-book`, `the-lost-book`, `the-book-returned`, `eldras-room` | 2.1 | `["book"]` |
| 2 | `the-hidden-key`, `the-moving-key`, `eldras-door` | `door` | `["key"]` |
| 3 | `the-three-doors` | none: the scene's three doors are found | `["door"]` |
| 3 | `the-dark-room` | `store_door` | `["key"]` |
| 3 | `the-night-walk` | `door`, `hole`, `dask` | none: its key is picked up on the way; `wizard.find_nearest("key")` works |
| 4 | the six levels with brooms to find: `the-broom-at-your-feet`, `the-shed`, `the-brooms-on-the-wall`, `the-check`, `the-nearest-broom`, `the-brooms-in-the-straw` by their ids in `content/levels/` | none | `["broom"]` |
| 5 | `the-forgotten-room` | the familiar | `["thread"]` |

The six broom levels are the ones whose solution calls
`find_nearest("broom")` or `find_all("broom")`; their ids are
read from `content/levels/` and listed in the report. Every
program of the course is run again: the ones that named `key`
with nothing found (`the-hidden-key`, `the-moving-key`,
`eldras-door`, `the-dark-room`) find it first. No program of the
course names a ring, a trail, a plate, a broom, a thread or a
book by its id.

### 2.4 The names (D345, D350)

No text of the game, no starting code and no solution names a
variable as a search word (`book`, `key`, `broom`, `door`,
`thread`). The names, by language:

| Where | Spanish | English |
|---|---|---|
| ch. 2, lesson 2 | `edad`, `nombre`, `caramelos`, `pasos` | `age`, `name`, `sweets`, `steps` |
| ch. 2, lesson 4 and practice 4 | `tesoro`; `libro_viejo`, `mi_hallazgo` | `treasure`; `my_find`, `dusty_one` |
| ch. 2, lesson 5 on | `libro_de_eldra` | `eldras_book` |
| ch. 2, lessons 7 and 8, fix 1, improve 1 | `llave_de_eldra`, `pasos`, `resto` | `eldras_key`, `steps`, `rest` |
| ch. 2, lesson 9 | `otro_libro` | `other_book` |
| ch. 3 | `mi_llave`, `puerta`, `casilla`, `vuelta` | `my_key`, `next_door`, `my_cell`, `turn` |
| ch. 4 | `escoba`, `escobas`, loop's `escoba`, `pasos`, `derecha`, `abajo` | `my_broom`, `brooms`, `each_broom`, `steps`, `right`, `down` |
| ch. 5 | `uno`, `otro` | `one`, `other` |

The solutions in `content/levels/*/` are English and use the
English column. The names of functions, classes, methods and
arguments of chapters 4 and 5 stay as they are (the owner:
*Están OK así. No tiene que ir todo en español, era sobre todo
al principio para que entendiese el concepto de variable*).

### 2.5 The game's answers (D349)

Said by the game, under the editor, where an error's
explanation is said today. The words are `i18n` keys of section
4's `i18n-changes.json`; `{…}` are their parameters.

1. **A find not kept.** A run that ends without winning, in a
   level with `to_find`, whose code has a statement that is only
   a call of `wizard.find_nearest`, `find_all` or `find_item`:
   *En la línea {line} has encontrado algo, pero no lo has
   guardado. Pon delante una variable y `=` para guardarlo.* Said
   under the outcome's own words.
2. **A method asked of the wizard that is another object's.**
   An `AttributeError` on `wizard` for a name that is a method of
   the role `thing` (`reveal`) or `door` (`open`):
   - `reveal`, the code keeps a found thing in `{variable}`:
     *`reveal` no es un método de `wizard`: es un método de la
     cosa que quieres hacer brillar. Escribe delante del punto
     la variable donde la guardaste, como en
     `{variable}.reveal()`.*
   - `reveal`, nothing kept: *… Primero encuéntrala y guárdala
     en una variable; después, escribe esa variable delante del
     punto.*
   - a door's: *`open` no es un método de `wizard`: es un método
     de la puerta. Escribe delante del punto la variable de la
     puerta.* It never writes `door.open()` whole.
3. **A search word used as a variable.** A `NameError` for a
   name that is a kind of the level's `to_find`:
   - the code keeps a find of that kind in `{variable}`: *Aquí
     no hay nada que se llame `book`. Lo que encontraste con la
     palabra "book" lo guardaste en `{variable}`: usa esa
     variable.*
   - nothing kept: *Aquí no hay nada que se llame `book`.
     "book", entre comillas, es la palabra para buscar:
     encuentra la cosa primero y guárdala en una variable con el
     nombre que tú elijas.*
   No `¿Querías decir…?` follows either.
4. **The book kept under a name that is not the child's.** A
   run of a level with an `own_name` goal not met, whose required
   goals are otherwise all met: *Has guardado el libro en
   `{name}`. Funciona, pero hoy Wenna te pide una variable con
   un nombre inventado por ti: cámbialo en todas las líneas
   donde la usas.* Said under *Todavía no: 1 de 2 objetivos
   cumplidos.*

**Where.** 2 and 3 are kinds of `explain`
(`world/kydux_world/explain.py`), which reads the code's tree
for the kept variable: the first assignment of a find of that
kind (for `reveal`, of any kind) to a single name. 1 and 4 are
not errors: a module `world/kydux_world/advice.py` reads the
code's tree and the run's end, and the run's result carries
`advice`, a list of `{kind, params}` (`run.py`,
`app/src/runtime/protocol.ts`); the level's screen says the
first under the outcome's words when the run did not win.

### 2.6 The two lists (D346)

Over the editor, in every level from `the-reading-room` on:
none in chapter 1, none in a lesson's code box.

**What they are.**

- Two boxes side by side, each with its title on a narrow line
  above it: **Tienes** / **You have**, a solid border; **Por
  encontrar** / **To find**, a dashed border.
- *Tienes* holds chips. First, in green, the variables the level
  gives: `wizard`; each variable of 2.3's rule that has at least
  one entry in the level's notebook (`notebookEntries`); each
  actor a `give` goal names in `to`; the living familiar. Then,
  in gold, what the child's code declares, in the order
  written: variables, functions as `volver(lejos)`, classes.
- *Por encontrar* holds the level's `to_find`, each as its
  search word in quotes, grey, with the kind's picture:
  `"book"`. It shows only in a level with `to_find`. A word
  leaves it when the code keeps a find of that kind; when it is
  empty the box and its title go and *Tienes* takes the whole
  width; it comes back when the keeping line is deleted.
- A chip is long: the picture at the left (the kind's art,
  cropped to what is painted in it), the name at the right, in a
  letter smaller than the code's. The two lists take, with their
  titles, the height of two lines of the editor.
- One row, always. A box with more chips than fit scrolls
  sideways (wheel, drag, finger), with faded edges and `‹` `›`,
  two buttons with a label of their own for who does not see
  them (*Ver las anteriores* / *See the ones before*, *Ver las
  siguientes* / *See the next ones*); it scrolls by itself to a
  chip just added.
- A value longer than 12 characters is cut and ends in `…`; a
  string keeps its closing quote (`"Hola, Tek…"`). A chip is
  never wider than half its box: the name is cut with `…`.
  Hovering a chip shows the whole name and value (`title`).
- No glow and no animation at a run.

**How they are read.** From the code as written, never from a
run: `readVariables(code, level)` in a module of its own
(`app/src/editor/variables.ts`), pure, with no DOM, on the tree
of the Python parser the editor already has
(`@codemirror/lang-python`). It is read again 0.5 s after the
last key. *Reiniciar* changes nothing; *Código original* puts
the lists as at the start. A statement with a syntax error in
it counts for nothing.

The closed table: what is written, and the chip.

| Written | Chip in *Tienes* |
|---|---|
| `steps = 2`, `greeting = "Hola"`: a number or a string written by hand, assigned once, outside any loop, `if` or function | the name and the value |
| the same name assigned twice, or anything computed (`rest = 5 - steps`, `steps = key.distance_to(wizard)`) | the name |
| `x = wizard.find_nearest("k")`, `x = wizard.find_item("k")`, `k` a kind of the level's things | the name and the kind's picture; `"k"` leaves *Por encontrar* |
| `xs = wizard.find_all("k")` | the name and the kind's picture in brackets; `"k"` leaves *Por encontrar* |
| `for x in xs:`, `for x in wizard.find_all("k"):` | `x` with the kind's picture; the second form takes `"k"` out of *Por encontrar* |
| `x = xs[0]` (any index), `other = x` | the same picture |
| a find inside a loop or an `if` | one chip, as outside |
| `for turn in range(3):` | the name |
| `a, b = 4, 3` | two chips, names only |
| `def volver(lejos):` | `volver(lejos)`; no chip for a variable inside a function |
| `class Fox(Familiar):`, `pimu = Fox("Pimu", "red")` | `Fox`, and `pimu` |
| `self.color = color` | none |
| a find not kept, a line half written | none; *Por encontrar* as it was |
| `x = wizard.find_nearest("dragon")`, a word of no thing of the level | the name, no picture; *Por encontrar* as it was |
| a variable given a found thing and, on another line, something else | the name |

The lists say which variables the program has, never what each
holds at a moment: a chip's picture is the kind's, and a value
shows only where it is sure without a run.

**A click.** A chip of *Tienes* opens the notebook at that
object's page, its methods written with the chip's variable
(`tesoro.reveal()`); a chip with no page (a number, a person)
opens the notebook at its top. A chip of *Por encontrar* opens
it at the part *Lo que hay que encontrar antes de usarlo*
(2.7).

### 2.7 The notebook (D347)

- The first tab is **Objetos** / **Objects**; the heading over
  an object's methods is **Métodos** / **Methods**.
- Two parts, the second only in a level with `to_find`: **Lo que
  tu programa ya tiene** and **Lo que hay que encontrar antes de
  usarlo**.
- In the second part, for each kind to find: its search word and
  its plain name (`"book"`, *un libro*); *Encuéntralo y guárdalo
  en una variable con un nombre tuyo:*; the line `tu_variable =
  wizard.find_nearest("book")` (`your_variable` in English), or
  with `find_item` where the kind is only carried; *Cuando lo
  tengas, sabrá hacer esto:*; and the kind's methods, dimmed,
  written `tu_variable.reveal()`. A click on the finding line
  writes it in the program, as every line of the notebook does;
  a click on a dimmed method writes nothing.
- Once the code keeps a find of that kind (2.6), the kind's
  page is in the first part under the child's variable, its
  methods written with it.
- The examples that named a thing by its id name a variable of
  2.4: `wizard.pick_up(mi_llave)`, `wizard.cast("fendra",
  otro_libro)`, `escobas = wizard.find_all("broom")` with
  `len(escobas)`, `if escoba.knotted:`.

### 2.8 The editor's completion (D348)

After a name and a dot, the editor offers:

- for a variable the level gives, what it offers today;
- for a variable *Tienes* shows with a kind's picture
  (`librito.`, the loop's `escoba.`, `primera.` from an index,
  `otro.` from another variable), the methods and attributes the
  level teaches of that kind, with the notebook's words;
- for the child's familiar by the variable it was born into
  (`pimu.`), the familiar's.

Nothing is offered for a variable with a name only, for a list
(`escobas.`), nor for `book.` with nothing found. The editor
never completes a variable's name, and nothing inside quotes.

### 2.9 What a figure says when a thing lights (D355)

A level's `told` (D264) takes a second moment beside `won`:
`"told": {"revealed": [["mate", "revealed"]]}`. Each entry is
who speaks and the key of the words, as `won`'s are; the words
are in the level's `told` texts. The world tells them
(`World.tell`) in the tick of the first `reveal` of a run that
lights a thing, once in the run; a `reveal` that is refused
tells nothing. The playback waits for the words, as for every
`told` (D264).

Only `the-hidden-key` says it, and its friend speaks: *¡Mira!
La llave está detrás de esa estantería. Habrá que entrar entre
las dos estanterías.* Nobody speaks in a run with no `reveal`.

### 2.10 The words (D350)

**Variable.** *Darle un nombre a un valor* is said in chapter
2's lesson 2 only, where the idea is first met. From practice 2
on every text says *variable*; *el nombre de la variable* stays
where a text speaks of how a variable is called. No text of
chapter 1 says *variable*. What a level gives (`wizard`, `door`)
is a variable too, and is called so. A function's, a class's, a
method's and the familiar's own name stay *nombre*. English
alike: *variable*, never *a name for* after lesson 2.

**Método.** The game's answers, the notebook and every text
from chapter 1's lesson `objects-and-actions` on say *método* /
*method*. *Acción* is kept in two places: the sentence of
chapter 1's lesson `what-a-program-is` that presents the first
instruction, *Le pide a tu {mago|maga} una acción (un método;
luego te explico esa palabra): dar un paso a la derecha.*, and
its recall in chapter 1's closing story.

**The game's answers** (`i18n/es.json`, `i18n/en.json`; the
English beside each in section 4's `i18n-changes.json`):

| Key | Spanish |
|---|---|
| `error.read_only` | No puedes cambiar `{object}.{name}` tú mismo. Lo cambia un método. |
| `error.not_called` | `{name}` es un método. Un método se usa con paréntesis detrás, como `{example}`. |
| `error.unknown_action` | `{object}` no tiene ningún método llamado `{name}`. |
| `error.no_new_attribute` | No puedes darle a `{object}` algo nuevo llamado `{name}`. Sus métodos y sus atributos están en el cuaderno. |
| `error.no_such_method` | {familiar} no tiene ningún método llamado `{name}`. |
| `blocked.unknown_action` | Todavía no conozco este método. |

**The texts.** Every changed text of chapters 1, 3, 4 and 5 is
in section 4's folder: the lessons and levels that said
*guardar bajo un nombre* or named a variable as a search word,
the titles *Objetos y métodos* and *Una función propia*, the
guide, and chapter 1's `the-corridor`, whose intro ends with
*¡Y si no te sale a la primera, puedes pedir una pista!*.
`things-to-carry` (chapter 1) has one page: the page *Qué cosa
recoger* is gone, and with it the sentence that said each thing
has a name the code knows it by.

The lessons' and levels' ids and file names do not change
(`objects-and-actions`, `an-action-of-your-own`,
`counting-with-names`): only their titles do.

### 2.11 The kept program and the buttons (D351)

**The kept program.** A saved game keeps one program: the code
of the last level whose code the child changed.

- `Progress.program?: { level: string; code: string }`
  (`app/src/progress/store.ts`), read by `readProgress`, written
  with the saved game and in its exported file.
- It is kept by itself: one second after the last key in a
  level's editor, and at once when the level's screen is left or
  the page is hidden (`pagehide`, `visibilitychange`). No button
  keeps it.
- Code equal to the level's starting code is not a program: with
  it in the editor, a kept program of that level is dropped, and
  a kept program of another level stays.
- A level opens with the kept program when it is that level's,
  and with its starting code otherwise. Every way into the level
  is one: the map, *Continuar*, the next stop, the browser's
  back, the page loaded again, the map's window closed onto the
  same level.
- Changing another level's code keeps that one and drops the
  former. Winning a level drops nothing: the level opened again
  shows the program that won.
- A lesson's code boxes are not kept.
- `LevelProgress.code`, which older saved games hold, stays read
  and is never shown.
- When the page's language changes, a kept program stays as
  written; an editor that holds the starting code takes the
  starting code of the new language, as today.

No text of the game names this: the child sees the program
still there. The code and the documents call it *the kept
program*, never a notebook.

**The buttons.** Under the editor, two rows:

- first row: **Ejecutar**, **Reiniciar**, **Parar**, **Código
  original** (`#run`, `#restart`, `#stop`, `#original`);
- second row: **Cuaderno**, **Pista** (`#notebook-open`,
  `#hint`), and the speed at the right end.

Each button holds a small picture before its word, drawn in
code as an SVG in `app/src/ui/icons.ts` with the page's colours
(a triangle; a turned arrow; a square; a page with a turned
arrow; an open book; a lamp), and its word in a 15 px letter.
The tester's *Solution* button stays after *Pista*. On a narrow
window each row wraps as a row.

**Código original** / **Original code** puts the level's
starting code in the editor and drops the kept program. It is
disabled while the editor holds the starting code. Pressed, it
asks in the game's own dialog (the one the saved games' deletion
uses, never `window.confirm`): *¿Borrar lo que has escrito y
volver al código original?*, **Sí, borrar** / **No, seguir**;
*No, seguir* has the focus, and Escape is *No*. It also stops a
run going on and puts the scene as at the start, as *Reiniciar*
does.

**Reiniciar** puts the scene as at the start and leaves the
code as it is, as today.

### 2.12 The map over the level (D352)

D71's map, opened from a level, is a window over it:

- the level stays behind, darkened (the scene, the editor and
  the buttons are seen and take no click);
- the window is centred, at most 1100 px wide and 90% of the
  page's height, with a margin of the level seen all around it
  at every window size down to 900×600; on a narrower page it
  takes the page's width less 12 px each side;
- a heading **Mapa**, and at the top right a button **✕ Volver
  al nivel** (`#map-close`);
- it closes by that button, by a click outside the window, and
  by Escape, onto the level as it was: the code, the scene and
  a run going on;
- going to another stop from it works as today, with today's
  question while a run goes on; the program is kept first
  (2.11).

The map opened from the start screen stays a whole screen with
*Volver al inicio*.

### 2.13 No leaving by mistake (D353)

- The browser's own menu (a right click, a two-finger click, a
  long press) does not open on the game's screens. It opens
  inside the editor, a lesson's code box and every text field,
  where copying and pasting live.
- A sideways swipe does not go back in the browser's history:
  `overscroll-behavior-x: none` on the page, and no element of
  a level scrolls the page sideways.
- The browser's back button works as before; a level left by it
  and opened again shows its program (2.11).

### 2.14 A lesson's page is passed by trying it (D354)

**The rule.** A lesson's page that holds code to try asks for
its test. On a first reading of the lesson, *Página siguiente*
(or the last page's button) pressed without the test leaves the
page where it is and shows the page's message under its code
box, where a run's result shows, and scrolls to it. The button
is never disabled; *Atrás* always works.

**When it does not ask.** A lesson read once asks nothing, read
again from the map or from a level (`#lesson/<id>/from/<level>`).
In a saved game begun before this, the lessons already read ask
nothing. The tester's mode passes every page.

**The four kinds**, said by the lesson's Markdown on the block's
fence. A page holds at most one block to try (a check of the
content).

| Fence | The test is done when |
|---|---|
| ```` ```python try ```` | the block was run once; a run that ends in an error counts |
| ```` ```python try change ```` | a code different from the given one was run; an error counts |
| ```` ```python try rename ```` | a run ended with no error and the given variable's name is nowhere in the code run, as a whole word |
| ```` ```python try rename error ```` | the test of `rename` is done, and a run ended on the answer *Aquí no hay nada que se llame…*; in either order |

The given variable of a `rename` block is the name the first
assignment of the given code assigns. The game never checks that
a change is the one the page asks for.

A lesson's run explains a `NameError` as a level's does
(`run.py`: today a lesson's run explains only an `IndexError`),
so that the fourth kind's answer is said and known by its kind,
`unknown_name`.

**The messages** (keys in section 4's `i18n-changes.json`):

| When | Spanish |
|---|---|
| `try`, not run | Todavía no has probado el código de esta página. Pulsa *Ejecutar* y mira qué pasa. |
| `change`, nothing run | Todavía no has hecho la prueba que te dice esta lección. Pulsa *Ejecutar* para empezar. |
| `change`, run as given | Todavía no has hecho la prueba que te dice esta lección. Cambia el código como dice la página y ejecútalo otra vez. |
| `rename`, the name still there | Todavía no has hecho la prueba que te dice esta lección. Cambia el nombre de la variable en todas las líneas y ejecuta. |
| `rename error`, renamed, the error not seen | Todavía no has hecho la prueba que te dice esta lección. Ahora cambia el nombre en una sola línea y ejecuta, para ver qué responde el juego. |

**The pages that ask more than a run** (the fences are written
in section 4's files; every other block to try is `try`):

| Chapter | Lesson | Page | Kind |
|---|---|---|---|
| 2 | `a-name-for-a-value` | Una variable | `change` |
| 2 | `a-name-for-a-value` | El nombre lo eliges tú | `rename error` |
| 2 | `finding-things` | Pruébalo | `rename` |
| 2 | `counting-with-names` | page 1 | `change` |
| 3 | `true-or-false` | Pruébalo | `change` |
| 3 | `if` | Una condición | `change` |
| 3 | `if` | Meter líneas hacia dentro | `change` |
| 4 | `less-or-greater` | Los números de las coordenadas | `change` |
| 4 | `less-or-greater` | Qué resta hacemos | `change` |
| 5 | `born-complete` | Dos cuervos completos | `change` |

**Where.** `app/src/content/lessons.ts` reads the fence's words
(`pageParts` gives each code part its `test`); a pure module
`app/src/ui/lessontest.ts` says, from the given code and the
runs made (each run's code and how it ended), whether a test is
done and which message is due; `app/src/ui/lessonrun.ts` tells
each run; `app/src/ui/lesson.ts` holds the page. The tests done
are kept with the saved game, `lessons[id].tested: number[]`,
the pages' numbers from 0; a test done stays done whatever the
code becomes after. A lesson is read (`markRead`) when its last
page shows and asks no test, or when the last page's test is
done.

### 2.15 A saved game on a course that has grown (D356)

A saved game made before this sprint keeps every stop it has
done, its stars and its place. The six new stops of chapter 2
show on the map as not done.

- **Nothing that was reached closes.** A stop is open when the
  stop before it is done, as today, and also when some stop
  after it in the course is done (`stopState`,
  `app/src/content/course.ts`). So a child in chapter 4 finds
  the six new stops open, and every stop reached before stays
  as it was.
- **The current chapter** (D200) is the last chapter neither
  finished nor locked: the chapter the child had reached, not
  chapter 2 again.
- **Where the game goes on.** `progress.current` that names a
  stop of the course that is open goes on there. One that names
  no stop of the course (`lesson:what-things-know`) or a locked
  one goes on at the first stop of the course not done.
- **The stars** of chapter 2 count the three new levels in what
  the chapter could hold; a chapter finished before shows as not
  finished until the six stops are done.
- `progress.lessons['what-things-know']` stays in the saved game
  and is read by nothing.

No saved game is converted: `PROGRESS_VERSION` stays 1, and the
new fields (`program`, `lessons[id].tested`) are optional.

### 2.16 The tests

**pytest** (`world/tests/`):

- *What the program holds* (2.3). On levels of the tests' own:
  a door, a hole and a bed are variables by their ids; a key, a
  book, a broom and a thread never are; a door with `"variable":
  false` is none; a kind in `to_find` is none, a door among them
  (`the-three-doors`); an actor is one, another child's familiar
  is none; the `Familiar` class and the living familiar are
  there. `to_find` with a word that is no kind, and with a kind
  the level has no thing of: each its `LevelError`; a kind the
  level only carries is accepted. `"variable": false` on a key:
  its `LevelError`. `repr` of a book that is no variable is
  `<book at 3, 15>`; of a door that is one, as today. A
  `NameError` for `book` in a level whose book is to find.
- *The goals* (2.2). `move_by_variable`: met by the solution of
  `the-reading-room`; not met by the same walk with the numbers
  typed, by a variable assigned and never given to a move, by a
  move given a number and a variable in two calls. `own_name`:
  met by `eldras_book`, by `x`; not met by `book`, `tesoro`,
  `treasure`, nor by a program that keeps nothing; a second
  find kept under an own name does not mend a first kept as
  `book`.
- *The answers* (2.5). Each of the four, by its kind and its
  parameters, on the course's own wrong programs:
  `wennas-door/wrong/open_of_the_wizard.py`,
  `the-fallen-book/wrong/reveal_of_the_wizard.py` (kept: its
  variable is named) and the same with nothing kept,
  `the-fallen-book/wrong/search_word.py` (kept, and not kept),
  `the-lost-book/wrong/kept_as_book.py`, and a program of
  `the-fallen-book` whose first line is a bare
  `wizard.find_nearest("book")`. A run that wins carries no
  advice. A `NameError` for a word that is no search word of the
  level is explained as today, with its *¿Querías decir…?*.
- *What a figure says* (2.9). `the-hidden-key`: a run with
  `reveal` tells the friend's words once, in the tick of the
  `reveal`, and a second `reveal` tells nothing; a run with no
  `reveal` tells nothing; `told` with a speaker the level has
  not, and with a moment that is neither `won` nor `revealed`:
  each its `LevelError`.
- *A lesson's run* (2.14): a `NameError` in a lesson's block is
  explained with the kind `unknown_name`.
- *The course* (`test_course_content.py`, as it stands, on the
  content of 2.1): the blocks to try are read under every fence
  of 2.14; a page holds at most one block to try; the lessons
  with nothing to try are today's with `each-thing-its-methods`
  (three pages) among them and `things-to-carry` with one page;
  every solution wins and every wrong program does not; no
  level's `api` and no lesson's `teaches` of chapter 2 names
  `wizard.items` or `door.locked`; no starting code, solution or
  lesson's block assigns to a name that is a kind of
  `THING_KINDS` (2.4).

**vitest** (`app/src/`):

- `readVariables` (2.6): one case for each row of the closed
  table, with what *Tienes* and *Por encontrar* hold; a
  statement with a syntax error counts for nothing and the
  statements around it count; a value of thirteen characters is
  cut, a string keeps its closing quote.
- The notebook (2.7): the two parts for `the-fallen-book` with
  nothing kept, and with `tesoro` kept (the book's page under
  `tesoro`, the second part gone); a level with no `to_find` has
  one part; a carried kind's line is written with `find_item`.
- The completion (2.8): after `tesoro.` with the book kept, the
  book's methods the level teaches; after `book.`, after
  `escobas.`, after `pasos.`, before a dot and inside quotes:
  nothing.
- The kept program (2.11): kept, read, dropped on the starting
  code, replaced by another level's; a saved game with no
  `program` reads as before; the exported file carries it.
- `lessontest` (2.14): for each of the four kinds, the runs
  that do the test and the ones that do not, and the message
  due for each; `rename` with the old name left in a comment or
  inside another word.
- `pageParts` reads the four fences; a fence with other words is
  plain code.
- `stopState`, the current chapter and where the game goes on
  (2.15): a saved game made on today's course, in chapter 4, on
  the course of 2.1.
- The texts: `i18n/en.json` and `i18n/es.json` hold the same
  keys (the check of today); no value of either says *acción* /
  *action* for a method but the two of 2.10.

**Browser** (`app/e2e/`):

- `chapter-2.spec.ts`: the chapter played whole by its
  solutions, the 24 stops in order; each of the four new levels
  won, and each of its wrong programs seen to end on its words;
  `the-reading-room` with the numbers typed reaches the door
  and shows the goal of the variable not met; `the-lost-book`
  with `book` shows 2.5's fourth answer under *Todavía no*;
  `the-hidden-key` shows the friend's bubble at the `reveal`.
- `level.spec.ts`: the two lists in `the-fallen-book` at its
  start (*Tienes*: `wizard`, `tesoro`; *Por encontrar*: empty
  and gone, since the given line keeps the book) and in
  `the-lost-book` (*Por encontrar*: `"book"`), a chip added half
  a second after its line is typed and gone when the line is
  deleted, the box scrolled to a chip out of sight, a click on
  a chip opening the notebook at its page; the two rows of
  buttons with their pictures, at 1280×800 and at 900×600;
  *Código original* disabled at the start, enabled after a key,
  its question with the focus on *No, seguir*, Escape, and *Sí,
  borrar*.
- `restart.spec.ts` or a spec of its own, the kept program:
  code typed, the map and back; the page loaded again; the
  browser's back and forward; another level changed and the
  first opened again on its starting code; a level won and
  opened again; a saved game exported and imported.
- `map.spec.ts`: the map from a level is a window with the
  level seen around it at 1280×800 and at 900×600, closed by
  its button, by a click outside and by Escape, the code and a
  run going on kept; from the start screen it is a whole
  screen.
- `handheld.spec.ts` and `screens.spec.ts`: no context menu on
  the scene, the buttons and a lesson's text; one in the editor
  and in a text field; `overscroll-behavior-x` of the page.
- `lesson.spec.ts`: each of the four kinds on a page of the
  course: the forward button pressed with the test not done
  leaves the page and shows the message, in English and in
  Spanish; done, it goes on; a lesson read once asks nothing;
  the page of `a-name-for-a-value` that asks for the error goes
  on after the rename and the error in either order.
- `notebook.spec.ts`: the tab *Objetos*, the heading *Métodos*,
  the second part and its dimmed methods, a click on the finding
  line writing it in the program.
- `start.spec.ts` or `load.spec.ts`: a saved game of today's
  course, in chapter 4, opened: *Continuar* goes on where it
  was, the map shows chapter 4 as the current one and the six
  new stops of chapter 2 open and not done.
- `walkthrough.spec.ts`, `levels.spec.ts`, `chapter-3.spec.ts`
  to `chapter-5.spec.ts`, `hints.spec.ts`, `words.spec.ts`,
  `cards.spec.ts`: as they stand, on the course of 2.1 and the
  names of 2.4. The specs' own helper that reads a lesson
  through does each page's test as a child would (runs the
  block; types a change; renames); no key of the page turns the
  tests off outside the tester's mode.
- `waiting.test.ts` and `waiting.spec.ts` (2.19): the catalogues
  hold the twelve tips; a tip told from a stop comes after every
  tip told always; a game that has not reached
  `the-reading-room` is given eleven tips and never `lists`, one
  that has is given the twelve.
- `waiting.spec.ts` (2.19, D358): a tip up has its picture in a
  frame, turned (its computed transform is a rotation) and with
  the pin over it; two tips one after the other are turned to
  opposite sides; the words are not turned; at 1024 by 700, at
  900 by 600 and at a phone's width the page scrolls neither
  way with the tallest tip up (D239); a tip whose picture is
  refused shows neither frame nor pin.

### 2.17 What the owner will try

On the owner's own server, in Spanish, with a new saved game
unless a step says otherwise.

1. Chapter 1, *¿Qué es un programa?*: the first instruction is
   presented as *una acción (un método; luego te explico esa
   palabra)*. From *Objetos y métodos* on, every text says
   *método*. *El pasillo*'s intro ends by saying a hint may be
   asked for. *Cosas que llevar* is one page.
2. Any level: under the code, two rows of buttons with their
   pictures; type something, leave by the map, come back: the
   program is there. Load the page again: still there. *Código
   original* asks, *No, seguir* keeps the code, *Sí, borrar*
   puts the starting code.
3. The map from a level: a window with the level seen around
   it; Escape, a click outside and *✕ Volver al nivel* close it.
4. A right click on the scene opens no menu; in the editor it
   does. A two-finger swipe sideways does not leave the level.
5. Chapter 2, *En la biblioteca*: Wenna walks to the door and
   stays beside it.
6. Lesson 2, *Un nombre para un valor*: on the page *Una
   variable*, *Página siguiente* with nothing run says what is
   missing; with the code changed and run, it goes on. On *El
   nombre lo eliges tú*: rename `caramelos` on both lines and
   run; then on one line only, and read the game's answer; then
   it goes on.
7. Practice 2, *Entre las mesas*: *Tienes* shows `wizard` at
   the start and `pasos` with its `2` half a second after the
   line is written. The walk with `2` typed three times reaches
   the door and does not win.
8. Lesson 3 and practice 3, *La puerta de Wenna*: `door` is in
   *Tienes*; `wizard.open()` is answered with whose method
   `open` is.
9. Lesson 4, page *Pruébalo*: it goes on only after the
   variable is renamed. Practice 4, *El libro caído*: the code
   comes with its first line; `tesoro.` offers `reveal()`;
   `wizard.reveal(tesoro)` and `book.reveal()` are each answered.
10. Practice 5, *El libro perdido*: *Por encontrar* shows
    `"book"` until a line keeps it. The notebook's second part
    shows the finding line and the dimmed methods. Solved with
    `tesoro` or `book`: the book is picked up and the game says
    Wenna asks for a name of the child's own. With an own name
    it wins.
11. Practice 7, *La llave escondida*: at the `reveal` the friend
    says where the key is.
12. The rest of chapter 2 and one level of each later chapter
    with something to find (*La habitación oscura*, *El
    cobertizo*, *La sala olvidada*): `key`, `book` and `broom`
    alone are answered with the search word's answer, and the
    starting codes name `llave_de_eldra`, `mi_llave`, `escobas`.
13. The saved game of today, in chapter 4 or later, opened:
    *Continuar* goes on where it was; the map shows the six new
    stops of chapter 2 open, and nothing reached is closed.
14. In English, steps 6 to 10 once, for the names (`steps`,
    `treasure`, `eldras_book`) and the lists' titles.
15. The tips while a screen loads: the one about the comments,
    with its picture, in a game of chapter 1; the one about
    *Tienes* and *Por encontrar* only in a game that has reached
    *Entre las mesas*. Every tip's picture as a photograph
    pinned up, a little turned, one to the left and the next to
    the right.

### 2.18 What is left out, and why

- **A variable's value followed while the program runs.** The
  lists say what the program has, read from the code (D346); a
  value that changes in a run is the timeline's and a later
  sprint's.
- **The completion of a variable's name, and of anything before
  a dot or inside quotes** (D348): a child who types the name
  learns it.
- **A check that the change a lesson asks for is the one made**
  (D354): the page asks for a try, and any change is one.
- **More than one kept program** (D351): one is what a child
  comes back to; a program per level would bring back the old
  code of a level opened for another try.
- **The voices** (the owner's plan of 2026-11-23) and **chapter
  6**: after this sprint.
- **New pictures.** No scene is painted and nothing is asked of
  Gemini's images: the chips use the art the levels have, and
  the buttons' pictures are drawn in code.
- **A converted saved game** (D356): nothing is rewritten in a
  saved game; the new stops show as not done.

### 2.19 Two tips more, and a tip's picture as a pinned photograph (D357, D358)

The tips (D214, D221; `app/src/ui/waiting.ts`) are twelve: the
ten of today in their order, then `comments`, then `lists`.
Both are added at the end, so the number the browser keeps
(`kydux.tip`) names the same tip as before.

| Key | Spanish | English |
|---|---|---|
| `tips.comments` | Acuérdate de leer los comentarios del código para saber qué hacer. Una línea que empieza por `#` es un comentario: el ordenador se la salta. | Remember to read the comments in the code to know what to do. A line that begins with `#` is a comment: the computer skips it. |
| `tips.lists` | Encima de tu programa ves las variables. Las que ya tienes son las que vienen en el nivel o las que tú has creado. Y las que están por encontrar, son las cosas que puedes buscar para guardar en una variable. | Over your program you see the variables. The ones you already have are the ones that come with the level or the ones you have made. And the ones still to find are the things you can look for to keep in a variable. |

The Spanish is the owner's own, given on 2026-11-26, and the
English says the same; they are in `i18n-changes.json` with the
rest.

**A tip told from a stop.** `comments` is told to every child
who is given tips, as the ten are. `lists` speaks of what a
level shows from `the-reading-room` on, so it is told from that
stop: it is among a child's tips when, in the game being played,
`level:the-reading-room` is open or done (`stopState`), and it
is not among them otherwise, nor where no game is in play. The
table of such tips is beside `TIPS` (`TIP_FROM = { lists:
'level:the-reading-room' }`); the waiting view and `askNextTip`
are given the game's tips by `main.ts`, through the `keys` a
`Wait` already takes. A tip told from a stop comes after every
tip told always, which a unit test holds: leaving it out moves
no other tip's number, and a number kept that is past the
game's tips is followed by the first tip. Nothing else of the
waiting changes: the
grace, the reading time, the pictures loaded first (D246), no
tip on the start screen and the welcome page (D341).

**Their pictures** (D221, D239, D331), by
`tips-pictures.spec.ts`, in each language:

- `comments`: `the-dark-note` as it opens, the level after the
  lesson `notes`: the editor, with the comment of its starting
  code and the lines under it.
- `lists`: `the-lost-book` as it opens, and one line typed at
  the program's end, `pasos = 4` in Spanish and `steps = 4` in
  English: the two boxes and the editor's first lines, *Tienes*
  with `wizard` in green and the typed variable in gold with its
  value, *Por encontrar* with `"book"`. No part of the scene is
  in the picture.

**A tip's picture is a photograph pinned up (D358).** A tip's
picture is a capture of the game at nearly its true size, and a
child takes it for the screen and clicks its buttons. In the
waiting view, every tip's picture is shown as what it is, a
picture of the game:

- **A frame.** A plain light border all round the picture, as
  a printed photograph has, with square corners or nearly, and
  a lifted shadow under it (`--shadow-lifted`).
- **Turned.** The framed picture is turned two degrees, to the
  left for a tip at an even place in the order and to the right
  for the next, so that two tips in a row do not look the same
  sheet. The tip's words stay under it, straight.
- **A pin.** A drawing pin at the middle of the frame's top
  edge, over it, its head in `--rose` with a small shine and a
  short shadow: drawn by the game (an inline SVG, or CSS), no
  file of art.
- **It answers nothing.** The picture takes no click and shows
  the plain cursor; nothing moves.

It is the view's doing alone: the files under `content/tips/`
are the captures as they are, and `tips-pictures.spec.ts`
changes nothing for it. The picture's element is still the one
loaded and decoded first (D246); a picture that fails shows the
words alone, with no frame and no pin. The picture stays as
large as the window lets (D239), the frame, the turn and the
pin counted in what the page holds: the size is measured anew
with the tallest tip, and the page scrolls neither way at 1024
by 700, at 900 by 600 and at a phone's width.

## 3. The pieces

Each piece ends with `ci/check.sh` and the browser specs it
touches, and its own commit. The whole `ci/check.sh --e2e` runs
once, at the end. The order is the one below: each piece leaves
the course whole and the checks green.

Nothing of `drafts/` enters a commit. The texts of section 4
are copied from `drafts/sprint-61-final/` into `content/` and
`i18n/`, and it is those copies that are committed.

### 3.1 A saved game on a course that has grown (D356; 2.15)

`app/src/content/course.ts`: `stopState`, the current chapter
of `chapterStandings`, and where the game goes on
(`progress.current` checked against the course where
*Continuar* and the map read it). vitest on a course of the
tests' own with stops put in before a done one; the browser
test of 2.16 waits for 3.3, which gives the course its new
stops, and is written there.

### 3.2 The goals, a figure's words, the fences (D343, D345, D354, D355; 2.2, 2.9, 2.14)

What 3.3's content needs, with no change of the course:

- `world/kydux_world/goals.py`: `move_by_variable` and
  `own_name` (2.2), in the kinds' table, with their checks of a
  level's file (`level.py`) and their goal texts' keys as the
  other kinds have them.
- `world/kydux_world/level.py` and `world.py`: `told.revealed`
  (2.9); `scene.ts` shows it as it shows `told.won`.
- `app/src/content/lessons.ts`: the four fences read, each code
  part with its `test`; every block to try runs as today. No
  page asks for anything yet (3.9).
- `world/tests/test_course_content.py`: `TRY` reads the four
  fences.

pytest and vitest of 2.16 for these. `lesson.spec.ts` as it
stands.

### 3.3 What the program holds, chapter 2's stops and every text (D342, D343, D344, D345, D350; 2.1, 2.3, 2.4, 2.10)

The sprint's largest piece, and one commit: the rule of 2.3
makes four of today's levels fail until their programs and
texts are the new ones, and chapter 2's new stops teach what
the rule asks. In this order:

1. **The world.** `level.py`: `to_find` and `"variable": false`
   read and checked. `world.py`: `namespace()` by 2.3's rule.
   `things.py`: `__repr__`. `Level.ids()` and what the page
   reads of them (`heldObjects` in `app/src/ui/notebook.ts`,
   the editor's completion of today) follow the rule. pytest on
   levels of the tests' own.
2. **The texts.** Every file of
   `drafts/sprint-61-final/content/` copied to the same path
   under `content/`. `content/lessons/what-things-know/`
   deleted. The `lesson.json` of 2.1's table written where the
   folder holds none (`keys-and-doors`, `where-i-am`); the
   others of the folder as they are.
3. **Chapter 2.** `chapter.json` (2.1's 24 items). The three new
   levels' folders (`the-reading-room`, `wennas-door`,
   `the-fallen-book`): `level.json`, `solution.py`, `wrong/`
   from 2.1; `the-lost-book` moved to its new start, its
   programs renamed and its fourth wrong program. The story's
   step 5. `to_find`, `"variable": false`, `told` and the
   stripped `api` of the other levels (2.1's and 2.3's tables).
   A picture of each of the four levels at its start, for the
   figures' facings.
4. **Chapters 3, 4 and 5.** `to_find` in the levels of 2.3's
   table; every `solution.py`, `solutions/*.py` and `wrong/*.py`
   that names a found thing by its id finds it first and keeps
   it in 2.4's English name; `the-three-doors` with
   `next_door`.
5. **The interface's words.** Every key of `changed` in
   `drafts/sprint-61-final/i18n-changes.json` written in
   `i18n/es.json` and `i18n/en.json` (2.10; the notebook's tab
   and heading of 2.7 are among them). `app/src/engine/words.ts`
   gives `blocked.which_one` no parameters. The unit tests and
   specs that quote a changed text follow it
   (`words.test.ts`, `outcome.test.ts`, `levels.spec.ts`,
   `loop.spec.ts`).
6. **The course's tests.** `test_course_content.py` by 2.16:
   the lessons with nothing to try, one block a page, no
   variable named as a kind. Every solution wins and every wrong
   program fails, each by its own cause.
7. **The browser.** `chapter-2.spec.ts` on the 24 stops, the
   four levels won; `chapter-3.spec.ts` to `chapter-5.spec.ts`,
   `walkthrough.spec.ts`, `levels.spec.ts`, `hints.spec.ts`,
   `cards.spec.ts`, `words.spec.ts`, `notebook.spec.ts` on the
   new names; the saved game of today's course opened (3.1's
   browser test).

For the report: the ids of the six broom levels as read; a
picture of each of the four levels of 2.1 at its start; any
text of the folder that did not fit the code as it is, with
what was done.

### 3.4 The game's answers (D349; 2.5)

`world/kydux_world/advice.py`, the two kinds of `explain.py`,
`run.py` and `app/src/runtime/protocol.ts` carrying `advice`,
the page saying it under the outcome's words
(`app/src/ui/outcome.ts`), the seven new keys (`error.found_not_kept`,
`error.reveal_of_wizard_kept`, `error.reveal_of_wizard`,
`error.open_of_wizard`, `error.search_word_kept`,
`error.search_word`, `outcome.variable_not_own`). pytest on the
course's wrong programs (2.16); `chapter-2.spec.ts` sees each
answer's words, and `levels.spec.ts` keeps the answers of
today.

### 3.5 The two lists (D346; 2.6)

`app/src/editor/variables.ts` with its vitest, row by row of
the closed table, first; then the boxes over the editor
(`app/src/ui/level.ts`, the styles), the chips' pictures from
the kinds' art, the scroll, the click that opens the notebook
(at its top until 3.6 gives it its pages), `level.have`,
`level.to_find`, and the arrows' labels `level.scroll_left`
and `level.scroll_right`. Shown from `the-reading-room` on: a
level before it and a lesson's code box show none.
`level.spec.ts`. For the report, a picture of
`the-fallen-book`, `the-lost-book` and `the-check` with their
lists, in Spanish, and one at 900×600.

### 3.6 The notebook and the completion (D347, D348; 2.7, 2.8)

`app/src/ui/notebook.ts`: the two parts, the kept kind's page
under the child's variable, the dimmed methods, the examples;
the chips' click lands on its page. `app/src/ui/level.ts`: the
completion's source reads `readVariables`. The keys, all in
section 4's `i18n-changes.json`: `notebook.part_have`,
`notebook.part_to_find`, `notebook.your_variable`, and
`notebook.find.<kind>` for every kind a level's `to_find`
names (*un libro*, *una llave*, *una escoba*, *una puerta*,
*un hilo*; a course test holds that each kind of a `to_find`
has its key). The two sentences are said in the gender of the
kind's Spanish word, each with two keys: `notebook.find_line`
and `notebook.find_methods` for a book and a thread,
`notebook.find_line_f` and `notebook.find_methods_f`
(*Encuéntrala y guárdala…*, *Cuando la tengas…*) for a key, a
broom and a door; which kind takes which is a table in
`notebook.ts`, and English says the same words in both.
`notebook.spec.ts`, `level.spec.ts`.

### 3.7 The kept program and the buttons (D351; 2.11)

`app/src/progress/store.ts` (`program`), `app/src/ui/level.ts`
(what a level opens with; the keeping; the two rows; *Código
original* and its question), `app/src/ui/icons.ts`, the styles,
the four keys `level.original_*`. The comment of
`LevelProgress.code` and the tests that held a level to its
starting code (D131) say the rule of D351. vitest; the kept
program's spec, `level.spec.ts`, `restart.spec.ts`,
`handheld.spec.ts` for the rows on a narrow window. For the
report, a picture of the two rows at 1280×800 and at 900×600,
and of the question.

### 3.8 The map over the level, and no leaving by mistake (D352, D353; 2.12, 2.13)

`app/src/ui/map.ts` and `level.ts` (the window, its heading,
`#map-close`, the click outside, Escape), the styles;
`app/src/main.ts` (the context menu's rule, on the page once),
`overscroll-behavior-x`. `map.spec.ts`, `handheld.spec.ts`,
`screens.spec.ts`. For the report, a picture of the map's window
at 1280×800 and at 900×600.

### 3.9 A lesson's page is passed by trying it (D354; 2.14)

`app/src/ui/lessontest.ts` with its vitest first; then
`lessonrun.ts`, `lesson.ts`, the saved game's `tested`, the five
keys `lesson.*`, `run.py` explaining a lesson's `NameError`.
The specs' helper that reads a lesson through does each page's
test. `lesson.spec.ts`, and every spec that reads a lesson.

### 3.10 The two tips, the pinned photograph, and the tips' pictures (D357, D358; 2.19)

`tips.comments` and `tips.lists` in both catalogues, `TIPS` and
`TIP_FROM` in `app/src/ui/waiting.ts`, the game's tips given to
the waiting view and to `askNextTip` by `main.ts`; the two
pictures added to `tips-pictures.spec.ts`. `waiting.test.ts`,
`waiting.spec.ts`. Then every tip's picture is taken again in
both languages (`KYDUX_TIP_PICTURES=1 npx playwright test
e2e/tips-pictures.spec.ts`, in the clone): the ten of today show
the buttons and the notebook's tab, which this sprint changes.
Last, the waiting view shows a tip's picture as a photograph
pinned up (D358): `app/src/ui/waiting.ts`, `app/src/style.css`,
`waiting.spec.ts`. For the report, the two new pictures in
Spanish, and the waiting view with a tip up at 1024 by 700 and
at a phone's width.

### 3.11 The documents, the whole check, the report

- **The documents**, in the present: `docs/dev/architecture.md`
  (the decisions are written; what the code's shape made
  different is said in them, and D71, D123 and D264 read true
  beside D352, D345 and D355), `docs/dev/course.md` (written;
  checked against the content), `docs/dev/plan.md`,
  and wherever `docs/dev/` lists a level's and a lesson's keys
  (`to_find`, `"variable": false`, `told.revealed`, the fences,
  the two goal kinds, a tip told from a stop), `README.md` and
  `README.es.md`
  where they describe the level's screen. The comments of the
  code touched say what is, not what was.
- **The whole check**: `ci/check.sh --e2e` in a clone or a
  worktree, never in the main tree's `app/` while the owner's
  server runs.
- **The report**, in Spanish, for the owner: what was built by
  piece, what differs from this document and why, the pictures
  asked for above (of the last commit), what the owner will try
  (2.17), and the prompt in English for the reviewer.

## 4. The texts handed over, and Gemini

**Gemini.** Nothing is asked of it in this sprint, and no
painting. The texts were drafted from the two briefs
`tools/write/briefs/sprint-61-the-first-names.md` and
`tools/write/briefs/sprint-61-the-names-after.md`, corrected by
the owner, and are final; the two briefs enter the repository
with piece 3.3's commit, as every brief of a text the game
uses. The buttons' pictures are drawn in `app/src/ui/icons.ts`;
a chip's picture is the kind's art.

**The folder** `drafts/sprint-61-final/`, which stays out of
every commit:

- `content/`: 101 text files at the paths they take under
  `content/`. The lessons' `es.md` and `en.md` (26 lessons; the
  `lesson.json` of the three new ones), the levels'
  `text.es.json` and `text.en.json` (20 levels), the stories
  `at-the-library` and `the-end-of-the-year`, the guide's
  texts. Each is copied whole over the file of today. No
  `level.json`, `solution.py`, `wrong/` or `chapter.json` is
  there: those are written from section 2.
- `i18n-changes.json`: `changed`, the keys of today whose words
  change, each with `es`, `en` and `from` (the owner's slot);
  `new`, a list of `{key, es, en, from, where}`, `where` saying
  what the text is for; `removed`, empty. The keys are nested
  in `i18n/es.json` and `i18n/en.json` (`error.read_only` is
  `error` → `read_only`). The pieces of section 3 say which
  keys each one writes; at the end every key of the file is in
  both languages, and the test of the same keys holds.
- `NOTES-chapter-2.md` and `NOTES-other-chapters.md`: for each
  file, the owner's slot it comes from; what was worded there;
  and the behaviour the texts take for granted
  (`NOTES-chapter-2.md`, section 4; `NOTES-other-chapters.md`,
  section 6). The slots (`[E.2]`, `[CA.4]`…) are those of the
  owner's two review documents,
  `drafts/cambios-sprint-61-2026-11-25.es-comments.md` and
  `drafts/cambios-sprint-61-segunda-vuelta-2026-11-25.es-comments.md`,
  which may be read for the owner's words and are never
  written to.

**Where the notes and this document differ, this document
rules.** Three places are known: *Por encontrar* loses a word
when the code keeps one find of that kind (2.6), not when every
thing of the kind is kept; the friend's words in
`the-hidden-key` are `told.revealed` (2.9); the `teaches` of the
lessons are 2.1's table.

**No word of a text is changed by the programmer.** A text of
the folder that does not fit the code as built (an output a
page quotes, a cell, a name) is a finding for the report: the
code is made to say what the text says where 2.x asks it
(`<book at 3, 15>`, the route's numbers), and where it cannot,
the programmer stops and says so. A label too small to brief
that turns out to be missing (an accessible name) is written in
both languages and listed in the report.

## 5. The prompt for CLAUDE-programmer

The owner clears the programmer's context (`/clear`) before
giving it.

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 61, asked by the owner on 2026-11-25 after
watching children play chapter 2, and reviewed by the owner in
two rounds of comments. It is one sprint and it is large: chapter
2 taught one idea a lesson on 24 stops, a thing to find that is
no variable until the program finds it and keeps it (chapters 2
to 5), two lists over the editor (Tienes, Por encontrar), the
notebook and the completion that follow them, the game's own
answers to the four mistakes of a first variable, the words
variable and método everywhere, the program being written kept
in the saved game, the buttons in two rows with Código original,
the map as a window over the level, no leaving a level by
mistake, a lesson's page that is passed by trying it, and, while
a screen loads, two tips more and every tip's picture shown as a
photograph pinned up. Nothing of it is built: build on the last
commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-61.md (this plan, whole: it
is long, and sections 2 and 3 leave nothing for you to design),
and in docs/dev/architecture.md D23, D27, D49, D71, D86, D123,
D131, D153, D184, D196, D214, D221, D239, D246, D264, D331, D333,
D335 and D342 to D358.
Then docs/dev/course.md (the rules and chapter 2's table). Then
your memory notes kydux-sprint-60-state, kydux-sprint-54-state
(the copy-check gotchas), kydux-checks-per-piece,
kydux-report-images-current, kydux-no-co-authored-by,
kydux-docs-present-tense, kydux-commit-by-path-shared-tree,
kydux-github-only-code-and-docs and kydux-dev-server-build.
Then the folder drafts/sprint-61-final/ (section 4 of the plan
says what it holds): its two NOTES files, i18n-changes.json and
the texts of chapter 2. Then the code: world/kydux_world/
world.py (namespace, tell, reveal, the which_one refusal),
level.py (THING_KINDS, the level's keys, told), things.py,
goals.py, explain.py, run.py; app/src/ui/level.ts, notebook.ts
(heldObjects, notebookEntries), lesson.ts, lessonrun.ts, map.ts,
outcome.ts, icons.ts; app/src/content/lessons.ts and course.ts;
app/src/progress/store.ts, games.ts and progress.ts;
app/src/editor/editor.ts;
app/src/engine/words.ts; world/tests/test_course_content.py;
app/e2e/chapter-2.spec.ts, level.spec.ts, lesson.spec.ts,
helpers.ts.

What is asked is section 2 of the plan, in full there; the
pieces and their order are section 3's, eleven of them, one commit
each:

3.1 A saved game on a course that has grown (D356).
3.2 The two goal kinds, a figure's words when a thing lights
    (told.revealed), the four fences of a lesson's block: all
    additive, nothing of the course changes yet.
3.3 What the program holds, chapter 2's 24 stops and every
    text: one commit, the largest, in the seven steps the plan
    gives. The texts are copied from drafts/sprint-61-final/
    as they are; the three new levels, the moved the-lost-book
    and every program of chapters 2 to 5 are written from the
    plan's tables. The two briefs under tools/write/briefs/
    sprint-61-*.md go in with this commit.
3.4 The game's answers (advice).
3.5 The two lists: app/src/editor/variables.ts with its unit
    tests first, row by row of the closed table of 2.6.
3.6 The notebook's two parts and the completion.
3.7 The kept program and the buttons.
3.8 The map over the level, and no leaving by mistake.
3.9 A lesson's page is passed by trying it.
3.10 The two new tips (comments, and lists told from
    the-reading-room on, D357), every tip's picture retaken in
    both languages, and the waiting view showing a tip's picture
    as a photograph pinned up (D358).
3.11 The documents in the present tense, the whole check, the
    report.

Rules that hold. Per piece, ci/check.sh and only the browser
specs the piece touches, green before its commit; the whole
ci/check.sh --e2e once, at the end, in a clone or a worktree.
Never build or pack the world in the main tree's app/ while the
owner's dev server runs on 5173, and never stop a server you
did not start. Commit by path (git commit -m ... -- <files>),
as the repository's own author, with no Co-Authored-By line nor
any other attribution; never push, never publish. Nothing of
drafts/ enters a commit, and nothing committed names a file of
it but the plan itself; CLAUDE.md and .claude/ are never
committed. The published game holds no solution and no tester's
mode (D333, D335): the lessons' tests are passed in the specs by
doing them, and ?debug passes them only where ?debug exists.
No text the child reads is written or reworded by you: the
folder's texts and i18n-changes.json are final, the owner
corrected them line by line. A label too small to brief that
turns out to be missing is written in both languages and listed
in the report; anything larger, stop and say so. No work is
asked of Gemini and no picture is painted. The documents and
the comments say what is, not what was. The report's pictures
are of the commit as it is.

The docs are partly written: docs/dev/architecture.md has D342
to D358 and docs/dev/course.md has chapter 2's new table, both
uncommitted in the tree with the plan. They describe the sprint
as built: commit them with the piece that makes each true (the
plan and the decisions with 3.1, the course with 3.3), and in
3.11 make them say what the code does where its shape made a
detail different.

Where the plan and the code disagree, or the plan leaves a
detail unsaid, choose what serves the decision's words and the
owner's words quoted in section 1, and say so in the report.
Where the plan and a NOTES file of the folder disagree, the
plan rules.

End with the report in Spanish for the owner (what is built, by
piece; what differs from the plan and why; the pictures the
pieces ask for; the ids of the six broom levels; the whole
check's result; what the owner will try, in the order of the
plan's 2.17) and the prompt in English for the reviewer.
```
