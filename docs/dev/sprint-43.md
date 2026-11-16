# Sprint 43 — Something to read while the page loads, `drevo` lands, the shed's levels in a gentler order, the flying lesson in two scenes, and the welcome's words

The owner read chapter 4's walkthrough of sprint 42 on 2026-11-13, from
its start to *El primer vuelo*, and the welcome page. Their comments are
in `drafts/recorrido-capitulo-4-2026-11-12-3.es-comments.md` and in
their message of that day, and this sprint is all of them. They stopped
before lesson 7, `an-action-of-your-own`: that lesson and what follows
it (`the-rings`, `arguments-of-your-own`, `the-race`, `the-rematch`,
`the-finish`) are not read yet, and this sprint changes in them only
what its decisions reach.

What the owner asks, in short:

1. The welcome page says *from eight years on*, and tells how the game
   is played in another order and in their words: the game first, then
   the story, then the lessons.
2. While something loads, the page shows something. A child who is just
   starting hears the music and reads the opening's first words over
   the castle's picture. A child who has begun reads a tip about the
   game, a new one every ten seconds, and the last tip is left the time
   to be read.
3. `drevo` cast in the air lands. Over a cell nobody walks on it fails
   as a bump does, with the bump's sound, and stops the program, the
   wizard still in the air. *El primer vuelo* asks to reach the white
   stone, and its extra is to land on it before the program ends.
4. The shed's levels go from the easy to the hard. The `if` inside the
   `for` and *La revisión* come right after the wall's brooms, and
   check only the brooms the wall had. The straw's level becomes two:
   first one broom, the nearest, with the two `if` and no `for`; then
   all of them. Both give their program as comments, one for each
   instruction, with the indentation of each block left ready.
5. The second story is told in two scenes: Ilda comes to the shed with
   the class and sends everyone to the field with a broom; then the
   field.
6. Words of four lessons, of that story and of *El primer vuelo*, given
   by the owner sentence by sentence.
7. The walkthrough shows each level in one arrangement, not in all of
   them, unless seeing all of them matters very much.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer, never a deploy; the servers on 443 and 5173
untouched; documents and comments in the present; Gemini writes every
text the child reads from a brief, and the owner's own Spanish words are
kept as they are, with their slips of the keyboard put right.

## 1. Decisions taken here

They are entered in `docs/dev/architecture.md` with this plan. D185,
D193, D204 and D212 are brought to them in place.

- **D214 — While a screen loads there is something to read.** Decided
  2026-11-13 by the owner (*mientras eso se carga, mostrar algo*).
  Python loads in its worker from the moment the page opens, behind
  everything, and no screen waits for it: a story and a lesson's pages
  need none, and a level shows as soon as its own files are there, its
  status line saying *Preparando Python…* until a run can start. What a
  screen waits for is its own code, texts and pictures, and while it
  waits the page shows the waiting view (`ui/waiting.ts`): Kydux's mark
  and *Cargando…*.
  - *A story's words come first.* A story's screen needs the story's
    file, the course and `ui/story`; the scene's code and pictures
    arrive behind it. The voice's words of the first step are read at
    once, and the steps that do nothing on the scene are read on. A
    figure's bubble and a step's actions wait for the scene. The music
    starts as soon as the theme's file is there. The game's opening
    (D61) shows the welcome's painting of the castle where its scene
    will be, and the scene takes its place with a short fade.
  - *A tip for a child who has begun.* With a wizard made or a game
    saved, a wait longer than the grace (2 seconds, one constant) shows
    a tip under the mark, and a new one every 10 seconds. When the
    screen is ready it waits until the tip up has had its 10 seconds,
    and a button *Seguir* under the tip opens the screen at once. A wait
    shorter than the grace shows no tip and holds nothing. The tips are
    the page's words (`tips.*`, the same keys in both languages), each
    true of the page as it is; they are shown in order from where the
    last wait stopped, kept in `localStorage`, and none comes back
    until all have been seen.
  - *The page warms up.* Once its first screen shows, the page fetches
    in idle time the code the other screens need (the story, the scene,
    the lesson, the level, the editor), so that a later screen waits
    only for its own files.
  - Rules out a screen that waits for Python, *Preparando Python…* said
    of anything that is not Python, a tip that flashes by on a quick
    load, a hold the child cannot end, and a tip that is not true.
- **D215 — `drevo` cast in the air lands.** Decided 2026-11-13 by the
  owner (*si se lanza drevo mientras vuelas, deberías aterrizar (o
  fallar si aterrizas sobre una casilla no transitable y que termine el
  programa por fallo). Es como chocar (y debe sonar el mismo ruido) pero
  para el programa (te deja volando donde estabas, para que no te
  ahogues)*). `wizard.cast("drevo")` while `wizard.flying` sets the
  broom down on the wizard's cell: a tick, the event `land` marked as
  the wizard's own (`"cast": true`), `flying` false, and the moves after
  it walk. Over a cell that is not walked on (a low one, D186, or a
  ring's, D187) the landing is refused (`world.refuse`, reason
  `no_landing`, with the cell's kind): the page plays the bump's sound,
  the program stops with an error in the child's words, and the wizard
  stays in the air where it was. When a program ends in the air over a
  cell that is walked on, the broom sets down by itself, as D185 has
  it; over a cell that is not walked on it stays in the air, and the
  figure is left flying on the screen. A goal of kind `land`,
  `{"kind": "land", "marker": "E"}` or `"at": [x, y]`, is met at the
  tick the wizard's own cast sets it down on that cell; the broom's own
  setting down at the end does not meet it. `wizard.flying` is true from
  the lift until a landing. The goal `cast` names no cells: its `from`
  leaves with its only use. Rules out a second `drevo` that does
  nothing, a landing on water, a wizard standing on water after a
  program's end, and a level that asks for a landing the program's end
  gives by itself.
- **D216 — The walkthrough shows a level in one arrangement.** Decided
  2026-11-13 by the owner (*no quiero que me pongas varias maneras en
  cada revisión de cada ejercicio; pon solo una manera salvo que veas
  que es muy importante ver todas las maneras*). `tools/walkthrough.py`
  and its browser spec show a level with ways in its first way: its
  card, its start, its route tick by tick and its won card, with no
  heading for the way. The lines of what changes each time and of what
  the card says when this time is different stay under the card. The
  option `--all-ways <level ids>` shows the named levels in every way,
  each under its id as D204 has it, and the report that hands the
  walkthrough over says which levels and why. Rules out a walkthrough
  three times as long as what the owner has to read.
- **D217 — The shed goes from the easy to the hard: the `if` inside
  the `for` before the comparisons, and one broom before all of them.**
  Decided 2026-11-13 by the owner (*esta lección y el arreglo de la
  revisión son más sencillos que el programa anterior, y además se
  tienen que usar antes de usar un if dentro de un for. Así que tiene
  sentido moverlos más arriba*; *para hacer más progresivo todo esto, el
  nivel anterior lo vamos a dividir en dos*). Chapter 4's order in the
  shed: the wall's brooms; the lesson `checking-each` and *La revisión*,
  which goes over the brooms the wall had; the lesson `less-or-greater`;
  one broom of the floor, the nearest, reached with two `if` and `else`
  and no loop; then every broom of the floor, the same walk inside a
  `for`. A level that puts two ideas together comes after a level for
  each of them. Rules out an `if` inside a `for` first met in the
  chapter's hardest program, and a check of brooms that nobody saw
  hung.
- **D218 — A program that is long for the child is given as comments,
  one for each instruction.** Decided 2026-11-13 by the owner (*debemos
  darlo un poco más masticado. La idea sería dar un comentario para cada
  instrucción*). The starting code of such a level says in its first
  lines that the comments are there and what to do with them; then one
  comment for each instruction, in the order of the program, in plain
  words that name the function to use; a comment that belongs inside a
  block is indented as the block is, and the empty line under each
  comment carries the indentation of the line to write, so that the
  child sees what goes inside each `for` and each `if`. The comments
  hold no line of code. The two levels of the straw have them. Rules
  out a starting code with half the program written (UAT 2), and
  comments that tell the idea and leave the order of the lines to the
  child in a level that long.

## 2. What is asked

### 2.1 The welcome page (D193)

The i18n lines under `about`, in the owner's words. `ui/about.ts` shows
the three parts in the order the game, the story, the lessons
(`PARTS = ['level', 'story', 'lesson']`); the pictures and their `alt`
lines stay.

| Key | Spanish | English |
|---|---|---|
| `who_text` | Para niñas y niños a partir de ocho años. No hace falta saber programar: el juego lo enseña paso a paso, una idea cada vez. Una persona mayor puede jugar al lado, y también aprenderá. | For girls and boys from eight years old. No one needs to know how to program: the game teaches it step by step, one idea at a time. A grown-up can play alongside, and will learn too. |
| `level_name` | El juego. | The game. |
| `level_text` | Kydux es un mago recién llegado a la escuela de magia. Te enfrentarás a distintos retos que deberás resolver escribiendo pequeños programas para controlar al personaje. | Kydux is a wizard newly arrived at the school of magic. You will face different challenges, and you will solve each by writing small programs that control the character. |
| `story_name` | La historia. | The story. |
| `story_text` | Los retos están ambientados en una historia llena de intriga y aventura que te enganchará desde el primer día. | The challenges are set in a story full of intrigue and adventure that will hook you from the first day. |
| `lesson_name` | Las lecciones. | The lessons. |
| `lesson_text` | Aprenderás cómo escribir los programas con pequeñas lecciones que te explicarán las ideas fundamentales sobre programación y Python. | You will learn how to write the programs with short lessons that explain the basic ideas of programming and of Python. |

`README.md` and `README.es.md` name no ages today; they are read for
the order story, lesson, level where they introduce the game, and stay
as they are where they tell how a chapter goes.

### 2.2 Waiting (D214)

What is true today, measured on hija: Python is ready about 1.5 seconds
after the page opens, in a worker that `main.ts` starts at its top
(`new Runtime()`); a first visit over the network fetches Pyodide, about
13 MB, 5 MB compressed, once. The line *Preparando Python…* that every
screen shows while it loads (`main.ts`, `route()`) is not about Python:
the screen waits for its own code (`import('./ui/level')`, the editor,
`engine/scene`), its texts and its pictures. A story waits for
`engine/scene` before it shows a word.

**The waiting view.** `ui/waiting.ts`, shown by `route()` in the place
of the status line: Kydux's mark (`markSvg`), the line
`waiting.loading` (*Cargando…*, *Loading…*), and under them the tip's
place. `level.loading` stays for a level's status line alone.

**The tips.** Shown only to a child who has begun (`progress.wizard()`
or a saved game: the `newcomer` of `route()` turned round).

- The grace: 2 seconds from the view's start with no tip. A screen ready
  inside it shows at once.
- After the grace, a tip; every 10 seconds, the next one.
- The screen ready with a tip up: the button `waiting.go` (*Seguir*,
  *Go on*) appears under the tip and takes the focus; the screen shows
  when the tip has been up 10 seconds or at the button, whichever comes
  first. A change of route while it waits drops the wait.
- Which tip: in the order of the list, from the one after the last
  shown, kept under a key of `localStorage` of its own; after the last
  comes the first.
- The wait is one object with its times as named constants, and its
  tests drive the timers (`vi.useFakeTimers`), as `controller.test.ts`
  does.

The owner's four tips, kept as they are:

| Key | Spanish |
|---|---|
| `tips.notebook` | Abre el cuaderno para ver todas las instrucciones que puedes utilizar en tu programa. |
| `tips.spells` | En el cuaderno, además, puedes ver todos los hechizos y palabras mágicas disponibles. |
| `tips.click` | Si haces clic sobre una instrucción en el cuaderno, se escribe sola en el programa. |
| `tips.dot` | Si pones el nombre de un objeto seguido de un punto, te aparecen todas las cosas que tiene ese objeto para que no tengas que escribirlas. |

The four are true of the page: the notebook lists what the course has
taught, its spells and words; an entry's example clicked is written into
the program (`onExample`); the editor completes after a dot. Gemini
writes four to six more in the same voice from a brief (2.9) that lists
what is true and where it is: the *Pista* button of a level, the keys
that run the program and open the notebook as the settings name them,
the bar under the scene that goes back over a run tick by tick, the
zoom, a lesson's example that can be changed and tried, the map that
goes back to any level won. The programmer tries each tip in the page
before it enters and drops one that is not exactly true.

**A level never waits for Python.** It does not today; a test holds it:
with the runtime still loading, the level's screen shows, its card can
be read and its program written, and the status line says
*Preparando Python…*.

**A story's words first.** `showStory` awaits the story, the course and
`ui/story`, and hands the screen `startScene` as a promise. The screen
shows the first step's words at once. Until the scene is there:

- the scene's place shows the still, where the story has one, or the
  page's paper with the mark, and `data-state='loading'` as today;
- a step said by the voice with no action is read and gone on from;
- a step with a bubble or an action shows its words in the voice's box
  only if it is the voice's, and plays when the scene arrives; going on
  from it waits as it waits today while its actions play.

The still: the opening (`"opening": true`, `the-letter`) shows
`about/welcome-castle.webp`, which the welcome page has just shown and
the browser holds, with `about.hero_alt` as its words. The scene, once
started, is shown over it with a fade of about half a second. No other
story has a still. `the-letter`'s first two steps do nothing on the
scene, so a newcomer who presses *Empieza a jugar* reads the letter over
the castle while the field loads, with the first chapter's theme
playing: `playMusicFor` starts it before the screen is asked for, and
the press is the gesture the browser wants.

**The warm-up.** After the first `show()`, in `requestIdleCallback` (a
timer where the browser has none), the page imports `ui/story`,
`engine/scene`, `ui/lesson`, `ui/level`, `editor/editor` and `ui/map`,
one after another, and forgets a failure.

**Tests.** Units with a driven clock: no tip inside the grace; a tip
after it; the next at 10 seconds; the hold to the tip's 10 seconds; the
button ends it; a newcomer has none; the order goes on from the last
wait. A browser spec delays one of a level's files (`page.route`) past
the grace, sees the tip, sees *Seguir* once the file comes and the level
at the press; another delays `engine/scene`'s chunk on the opening and
reads the letter's first words over the castle before the scene. The
browser tests' helper (`e2e/helpers.ts`, where it seeds the progress)
turns the tips off for every other spec with a key of `localStorage`
read once when the page opens, which no setting shows, so that no spec
is held 10 seconds by a slow load.

### 2.3 `drevo` lands (D215)

**World.** `_drevo` in the air: the cell under the wizard is asked as a
walk asks it (`low`, a ring's cell, anything a step would be refused
on). Walked on: `flying` false, the event `land` with `"cast": true`, a
tick. Not walked on: `world.refuse(…, "no_landing", …)` with the cell's
kind in the event, as `no_walk` carries it. `finish()` sets the broom
down only over a cell that is walked on; over any other the wizard is
left flying and no `land` is noted. The goal `land` joins the registry
of `goals.py`; `cast`'s `from` leaves it.

**Page.** A `blocked` event of reason `no_landing` plays the `bump`
sound (`engine/scene.ts`, where `bump` plays it) and the figure stays
in the air. The landing by a cast is drawn and sounds as the landing at
a program's end. The outcome's card and the wizard's bubble say the
refusal in two new lines, by Gemini (2.9): `error.no_landing` (what
happened and what to do: there is nowhere to set down here, the program
stops, land where there is ground) and `blocked.no_landing` (the
wizard's own short words), beside `error.no_knot` and
`blocked.no_knot`, which they follow in manner.

***El primer vuelo*.**

- Goals: `{"kind": "reach", "marker": "E"}` and
  `{"kind": "land", "marker": "E", "bonus": true}`.
- Goal lines, given: *Llega a la piedra blanca.* / *Reach the white
  stone.*; *Aterriza en la piedra blanca antes de que el programa
  termine.* / *Land on the white stone before the program ends.*
- Solution: `wizard.move_right(8)`, `wizard.cast("drevo")`,
  `wizard.move_right(5)`, `wizard.cast("drevo")`. A program without the
  last line wins without the extra.
- Wrong programs: the three it has, and one that casts `drevo` again
  over the water (refused, `no_landing`).
- The card, the owner's words: *¡A ver qué tal se te da! Camina hasta
  el final del embarcadero. Allí, lanza \*drevo\* y vuela hasta la
  piedra blanca de la otra orilla.*
- *Ahora sabes*, the owner's words: *Ahora sabes que un hechizo puede
  cambiar cómo se mueve {el mago|la maga}: volando, pasas por donde
  andando no se puede, y mucho más rápido. Y además sabes que el mismo
  hechizo puede servir para varias cosas, por ejemplo para iniciar el
  vuelo y aterrizar.*
- Its hints and its outro are read against the new goals; Gemini
  rewrites what no longer fits (2.9). The starting code's three
  comments stay.

**The lesson `drevo`**, one page, in this order:

1. Its first paragraph as it is (*¡La palabra mágica \*drevo\* levanta
   en el aire la escoba que llevas! La lanzas con tu varita, escribiendo
   `wizard.cast("drevo")`.*).
2. The owner's words: *Una vez estás sobre la escoba, las acciones
   `move_` hacen que vueles en esa dirección. Volando puedes pasar sobre
   algunas cosas, como los setos, las vallas, los bancos y el agua. Y
   además, vas tres veces más rápido que si andases. ¡Pero ten cuidado!
   Todavía te puedes chocar con los muros y los árboles.*
3. A new paragraph by Gemini (2.9): `drevo` cast again in the air sets
   the broom down where the wizard is, if the ground there can be stood
   on; over the water there is nowhere to land, and the program stops.
4. The owner's words: *Al acabar el programa, si no te has bajado de la
   escoba, ella sola se posará en el suelo.* (The owner wrote *si no os
   habéis bajado*; the page speaks to one child, as its other sentences
   do.)

**The other words that tell of `drevo`** are brought to D215:
`spells.drevo`, the part of `notebook.wizard.cast` about `drevo`,
`notebook.wizard.flying` (*…hasta que aterriza*), in both languages, by
Gemini from the brief. *Los aros*' first goal line reads *Llega a la
piedra blanca.* / *Reach the white stone.*, as its goal is a `reach`.
Every text of chapter 4 is searched for *aterriza*, *posa*, *land* and
*set down* and read against D215.

**The levels after it.** The programmer runs every solution and wrong
program of `the-rings`, `the-race` and `the-rematch` and says in the
report what moved, if anything: none casts `drevo` twice today.

### 2.4 Chapter 4's order (D217)

```
story:the-morning-after
lesson:the-broom
level:the-broom-at-your-feet
lesson:lists
level:the-shed
lesson:for-each
level:the-brooms-on-the-wall
lesson:checking-each
level:the-check
lesson:less-or-greater
level:the-nearest-broom          (new)
level:the-brooms-in-the-straw
story:the-flying-lesson
lesson:drevo
level:the-first-flight
lesson:an-action-of-your-own
level:the-rings
lesson:arguments-of-your-own
level:the-race
level:the-rematch
story:the-finish
```

The lesson `checking-each` needs nothing of `less-or-greater`; its page
stays as it is. `docs/dev/course.md`, the course's tests
(`test_course_content.py`), the chapter's browser spec and every
document that tells the order follow.

### 2.5 *La revisión*, after the wall

The owner: *se hace el nivel pero no están todas las escobas, sino solo
las que originalmente había en la pared*.

- Things: the wall's level's own. Each way hangs the brooms that the
  way of the same id hangs in `the-brooms-on-the-wall`, and the two
  brooms of the floor lie where they lie there, still knotted:
  `broom_1` (7, 7) and `broom_2` (11, 7), zone `straw`. Start (9, 8),
  the friend (8, 8), the mate (10, 8), as today.

  | Way | Hung, on the pegs of columns | Still knotted | First stop of the starting program |
  |---|---|---|---|
  | `a` | 6, 9, 10, 12 | 6, 10 | 12, the first broom |
  | `b` | 7, 11, 13 | 11 | 13, the first broom |
  | `c` | 6, 8, 9, 12, 13 | 8, 9, 13 | 12, the second broom |

  The starting program, the wall's, goes to (13, 5) and takes the list
  from there, nearest first, so from the right. Every way has a broom
  without a knot, so the starting program stops with `no_knot` in every
  way.
- Goals: `{"kind": "untied", "zone": "wall"}`, `{"kind": "no_error"}`,
  and the bonus `uses` `knotted`. The first goal's line is the wall's
  level's, *No dejes ninguna escoba colgada con nudo.*
- The card opens with the owner's words: *{mate} se ha dado cuenta de
  que algunas escobas todavía tienen un nudo encantado. Quizás tenían
  dos, o quizás se nos escaparon al intentar desatarlas, así que hay
  que repasarlas.* Then its present words from *He puesto el programa
  que usamos…* to the end.
- `changes`: *Las escobas de la pared y cuáles tienen todavía un nudo
  cambian cada vez.* `changed` stays.
- The outro no longer hears the class coming: Gemini writes one that
  leaves the wall done and turns to the floor (2.9). The starting
  code, the hints and *Ahora sabes* stay.

### 2.6 The straw in two levels (D217, D218)

Both are practices on `the-broom-shed`, said by the friend, with the
shed's zones and camera as *Las escobas de la paja* has them.

**`the-nearest-broom`**, new. Title by Gemini; in Spanish something
like *La escoba más cercana*.

- The wizard starts at (9, 7); the friend stands at (7, 5) and the mate
  at (12, 5), by the wall. The pegs of columns 6, 9, 10 and 12 hold
  brooms with no knot.
- The floor's brooms, all knotted, zone `straw`. `broom_0` is the
  nearest and lies on the bare boards, seen from the start; the others
  are under the straw, on the picture's straw cells, each at least one
  step farther.

  | Way | `broom_0` | From (9, 7) | The others (hidden) |
  |---|---|---|---|
  | `a` | (11, 6), 3 steps | right 2, up 1 | (6, 6) 4, (6, 8) 4, (13, 8) 5 |
  | `b` | (7, 8), 3 steps | left 2, down 1 | (6, 6) 4, (12, 8) 4, (13, 6) 5 |
  | `c` | (8, 6), 2 steps | left 1, up 1 | (6, 8) 4, (12, 8) 4, (13, 6) 5 |

  A program that always walks the same two ways wins at most one
  arrangement; one that decides only left or right, or only up or down,
  loses one. No friend stands over a cell where a broom lies (a figure
  on row 5 is drawn with its soles in row 6, D211).
- `api`: `wizard.move_up`, `move_down`, `move_left`, `move_right`,
  `wizard.find_nearest`, `broom.untie`, `thing.position`,
  `wizard.position`, `position.x`, `position.y`.
- Goals: `{"kind": "untied", "ids": ["broom_0"]}`, *Desata la escoba
  más cercana.* / *Untie the nearest broom.*; the bonus `uses` `x`, as
  the straw's level has it.
- Solution:

  ```python
  broom = wizard.find_nearest("broom")
  if broom.position.x < wizard.position.x:
      wizard.move_left(wizard.position.x - broom.position.x)
  else:
      wizard.move_right(broom.position.x - wizard.position.x)
  if broom.position.y < wizard.position.y:
      wizard.move_up(wizard.position.y - broom.position.y)
  else:
      wizard.move_down(broom.position.y - wizard.position.y)
  broom.untie()
  ```

- Wrong programs, at least: always left and up; left or right decided
  and always up; the comparison turned round (a negative number of
  steps, `error.arguments`); `untie()` before the walk (`too_far`).
- Starting code (D218), the owner's comments of the second level
  without their loop:

  ```
  # Para que sea un poco más fácil, he escrito comentarios
  # y te he dejado huecos para que, debajo de cada comentario,
  # escribas el código que hace lo que dice el comentario.
  # ¡Incluso te he dejado los espacios para
  # que sepas lo que va dentro de los if!

  # Busca la escoba más cercana con find_nearest

  # Primero nos movemos a la izquierda o a la derecha.
  # Si la posición x de la escoba es menor que la tuya, la escoba está a tu izquierda:

      # Deberás usar move_left

  # Si no, la escoba está a tu derecha:

      # Deberás usar move_right

  # Luego nos movemos hacia arriba o hacia abajo.
  # Si la posición y de la escoba es menor que la tuya, la escoba está arriba:

      # Deberás usar move_up

  # Si no, la escoba está debajo de ti:

      # Deberás usar move_down

  # Una vez que hemos llegado a la escoba, podemos desatarla con broom.untie
  ```

  The empty line under a comment carries the spaces of the line to
  write: none under the comments at the margin, four under the indented
  ones. The program ends with one empty line at the margin.
- The card (Gemini, 2.9): the hung brooms are done and the rest lie in
  the straw; we start with the easy part, one broom, the nearest, found
  with `find_nearest`; it may lie on any side, so the program looks
  before it walks, as the lesson showed. Hints, outro, *Ahora sabes*,
  `changes` and `changed` by Gemini too; the outro leads to the next
  level without saying its first words.

**`the-brooms-in-the-straw`**, the second. Its things, its three ways,
its goals, its solution and its wrong programs stay as sprint 42 left
them.

- The card opens with the owner's words: *¡Vale, ya lo tienes! Pero
  intentemos hacerlo para todas las escobas que hay por el suelo, en
  lugar de ir una a una.* Gemini writes what follows (2.9): `find_all`
  gives them nearest first, each may lie on any side, and the comments
  of the program lead the way.
- Starting code, the owner's, with the comparison of the `x` the right
  way round (the owner's sketch says the broom is to the left when the
  wizard's position is the smaller; with `x` growing to the right it is
  to the left when the broom's is the smaller, as the lesson says):

  ```
  # Para que sea un poco más fácil, he escrito comentarios
  # y te he dejado huecos para que, debajo de cada comentario,
  # escribas el código que hace lo que dice el comentario.
  # ¡Incluso te he dejado los espacios para
  # que sepas lo que va dentro de los for y los if!

  # Busca todas las escobas con find_all

  # Ahora haz un bucle para pasar por todas las escobas

      # Primero nos movemos a la izquierda o a la derecha.
      # Si la posición x de la escoba es menor que la tuya, la escoba está a tu izquierda:

          # Deberás usar move_left

      # Si no, la escoba está a tu derecha:

          # Deberás usar move_right

      # Luego nos movemos hacia arriba o hacia abajo.
      # Si la posición y de la escoba es menor que la tuya, la escoba está arriba:

          # Deberás usar move_up

      # Si no, la escoba está debajo de ti:

          # Deberás usar move_down

      # Una vez que hemos llegado a la escoba, podemos desatarla con broom.untie
  ```

  The empty lines carry four spaces inside the loop and eight inside an
  `if` or an `else`.
- Its hints are read against the comments and say no more than they do
  one step further (Gemini, 2.9). Its outro closes the shed: every
  broom safe, so that the story's first words follow (*Habéis desatado
  hasta la última…*).

A test of the content holds D218 for both levels: every line of their
starting code is empty, spaces or a comment; an indented comment is
followed by a line of spaces at least as deep.

### 2.7 The flying lesson in two scenes

`the-flying-lesson` opens in the shed and goes on by the lake, as
`the-morning-after` changes scene in a step.

| Step | Who | Scene and what is seen | Words |
|---|---|---|---|
| 1 | voice | The shed, every peg with its broom, none on the floor, none knotted. The wizard at (8, 7), the friend at (7, 7), the mate at (11, 7). The camera shows the floor and the gravel path to the door, about `fit [[3, 3], [16, 14]]`. | the owner's, below |
| 2 | Ilda | Ilda appears on the path at (9, 14) and walks in through the doorway to (9, 8), facing up. Behind her the two classmates appear on the path and stop outside, at (9, 12) and (10, 12). | Gemini, from the owner's sense |
| 3 | Ilda | The lake's edge, staged as the story stages it today: the wizard (1, 7), the friend (0, 6), the mate (0, 8), Ilda (1, 5) facing down, the classmates (0, 4) and (0, 3). | the owner's, below |
| 4 | Zarek | As today: he flies in, lands and faces left. | as they are |
| 5 | Ilda | | the owner's, below |
| 6 | the mate | | as they are |
| 7 | voice | | as they are |

Step 1, the owner's words: *Habéis desatado hasta la última cuando se
oyen voces en el campo: ¡Ilda viene con el resto de alumnos! Por suerte,
habéis evitado un accidente, aunque todavía no podéis contar nada a
nadie. {friend} se guarda rápidamente los hilos negros en el bolsillo
para que no os pillen.*

Step 2, the owner's sense, for Gemini: good morning, early risers;
everyone takes a broom each and follows her to the training field.

Step 3, the owner's words: *Veo que todos tenéis vuestra escoba. Los
alumnos de segundo año deben recordar que sus compañeros de primero
todavía no han usado la escoba nunca, así que debéis ayudarles.*

Step 5, the owner's words: *Zarek, silencio y a la fila con los demás.
Os recuerdo que la escoba se levanta con una palabra mágica, \*drevo\*.
Podéis volar por encima del agua y los setos, que no podríais cruzar
andando. En el primer ejercicio deberéis caminar hasta el final del
embarcadero, levantar la escoba con la palabra mágica y volar hasta la
piedra blanca de la otra orilla.*

The figures stand clear of the shed's bales and walls, and a cell is
moved by one where a figure covers another or stands in a bale; the
report says which. The story's browser spec follows both scenes.

### 2.8 The lessons' words

The owner's words, in the Spanish page; Gemini gives the English twin
of each (2.9).

- **`the-broom`, page 1.** *Cuando un programa la guarda en una
  variable, por ejemplo `broom`, puede mirar su atributo
  `broom.knotted`.*
- **`the-broom`, page 2**, before *Por ejemplo, en este cobertizo…*,
  in the place of *No siempre puedes encontrar todo: a veces, desde
  donde estás, solo encuentras algunas cosas.*: *Ya has usado antes
  funciones que buscan cosas, como `find_nearest`. Pero estas funciones
  te dan un resultado distinto según dónde esté tu {mago|maga} en el
  escenario. Eso significa que no siempre puedes encontrar todo.* The
  course has one such function before this page, `find_nearest`
  (`find_item` gives what is carried wherever the wizard stands, and
  `find_all` is taught after it), so the sentence names that one.
- **`lists`, page 1** opens: *Tenemos que revisar todas las escobas,
  pero ¿cuántas son? Y ¿cómo las encontramos?* and goes on as it does.
- **`less-or-greater`, page 3**, its two paragraphs before the block,
  the owner's: *Con las funciones `move_`, como `move_left()`, te
  puedes mover 0 o más pasos. Si le das un número negativo, como en
  `wizard.move_left(-3)`, el juego no lo acepta y te dice que
  `move_left` no se usa así.* / *Así que para movernos a una posición
  desde donde estamos, hace falta primero ver si nos tenemos que mover
  a la izquierda o a la derecha. Así podemos calcular el número mayor
  menos el número menor, y que nos salga un número de pasos que es
  positivo. Lo podemos hacer con el `if` y el `else` que ya conoces.*
  The block and the words after it stay. The sentence that says what
  `else` does (*Las líneas del `else` se ejecutan cuando la condición
  del `if` es `False`.*) goes after the block, before *Prueba a
  poner…*, if no earlier page of the course says it.

### 2.9 The texts (Gemini)

Two briefs in `tools/write/briefs/`:

- `sprint-43-chapter-4.md`: *La revisión*'s outro; `the-nearest-broom`
  whole but its starting code and its goal line; *Las escobas de la
  paja*'s card after its first sentences, its hints and its outro; the
  story's step 2; the lesson `drevo`'s new paragraph; *El primer
  vuelo*'s hints and outro where they no longer fit; `spells.drevo`,
  the notebook's two lines, `error.no_landing` and `blocked.no_landing`;
  and the English twin of every Spanish sentence the owner gave (2.3,
  2.5, 2.6, 2.7, 2.8), the comments of both starting codes among them.
- `sprint-43-tips.md`: the tips beyond the owner's four, and the English
  twins of the four.

Each brief carries the bible, the course, chapter 4's texts as they
are, the owner's comments whole, this plan's sections it answers, and
the rules: no *manera* or *way* for a level's arrangements (D204),
nothing told that the child does not need yet, a metaphor only where an
idea is first explained, `<` and `>` alone (D212), the level's kind and
no ending cell asked unless it is the point (D206). The programmer
reads the drafts, corrects them and says in the commit what was
corrected. The words this plan gives letter for letter are not sent to
Gemini to be written again.

### 2.10 The walkthrough (D216)

`tools/walkthrough.py` and `e2e/walkthrough.spec.ts`: one way a level,
the first; `--all-ways <ids>` for the levels named, which the spec
honours, so that it takes no picture nobody reads. Under a level's card
stay *Lo que cambia cada vez* and *Lo que dice cuando esta vez es
distinto*. The tool's own text says a level has other arrangements only
through those lines. This sprint's walkthrough names no level for
`--all-ways`.

### 2.11 The changed texts, for the owner

As sprint 42's 2.9: a page in `drafts/`, made from `git diff` of the
Spanish texts between sprint 42's last commit and this sprint's last,
not by hand. Every text the child reads that changed, by chapter order:
*Antes:* and *Ahora:*, with the picture of the screen that shows it
where there is one. A text that is new says *Antes: no existía.* A text
that leaves says *Ahora: ya no se muestra.* The welcome page's words
and the tips are on it.

## 3. The pieces

### 3.1 The welcome's words (D193, 2.1)

- **Page.** `PARTS` in the new order; the seven lines in both
  languages.
- **Documents.** The READMEs, read as 2.1 says.
- **Tests.** The about spec reads the three names in order.
- **Check.** `ci/check.sh`, `e2e/about.spec.ts`.

### 3.2 Waiting (D214, 2.2)

- **Page.** `ui/waiting.ts` and its clock; `route()` shows it; `show()`
  honours the hold; `waiting.loading`, `waiting.go` and `tips.*`;
  `showStory` and `ui/story.ts` with the scene as a promise, the
  opening's still and its fade; the warm-up; the helper's key that
  turns the tips off.
- **Content.** The tips' brief and its drafts, each tip tried in the
  page.
- **Documents.** `docs/dev/architecture.md`'s account of the page where
  it tells how a screen is shown; `app/e2e/README.md` where it tells of
  the helpers.
- **Tests.** The units and the two browser specs of 2.2; the level
  shown with Python still loading.
- **Check.** `ci/check.sh`; the new specs, `story.spec.ts`,
  `start.spec.ts`, `level.spec.ts`.

### 3.3 `drevo` lands (D215, 2.3)

- **World.** `_drevo`, `finish()`, the goal `land`, `cast` without
  `from`; their tests, the end in the air over water among them.
- **Page.** The bump's sound on `no_landing`; the figure left flying at
  an end over water; the two error lines.
- **Content.** *El primer vuelo* (goals, lines, solution, wrong
  programs, card, *Ahora sabes*); the lesson `drevo`; `spells.drevo`
  and the notebook's lines; *Los aros*' goal line; the search of
  chapter 4's texts. The chapter's brief is written and run here for
  everything 2.9 lists, and its drafts are kept for 3.4 and 3.5.
- **Tests.** The world's; the level's solutions and wrong programs; the
  chapter's spec on *El primer vuelo* with and without the last cast.
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`, `levels.spec.ts`.

### 3.4 The shed's order and levels (D217, D218, 2.4, 2.5, 2.6, 2.8)

- **Content.** `chapter.json`; *La revisión* (things, ways, goal, card,
  `changes`, outro); `the-nearest-broom` whole; *Las escobas de la
  paja* (card, starting code, hints, outro); the four lessons' words.
- **Documents.** `docs/dev/course.md` and every document that tells
  chapter 4's order or its levels, in the present; the course book made
  again.
- **Tests.** The course's content tests on the new order; the ways of
  2.5 and 2.6 held by a test, with the list's order and the nearest
  broom; the test of D218; every solution and wrong program in every
  way.
- **Check.** `ci/check.sh`; `chapter-4.spec.ts`, `levels.spec.ts`,
  `lesson.spec.ts`.

### 3.5 The flying lesson in two scenes (2.7)

- **Content.** `the-flying-lesson`'s `story.json` and both texts.
- **Tests.** The story's test of its staging; the chapter's spec
  through both scenes.
- **Check.** `ci/check.sh`; `story.spec.ts`, `chapter-4.spec.ts`.

### 3.6 The walkthrough in one arrangement (D216, 2.10)

- **Tools.** `tools/walkthrough.py`, `e2e/walkthrough.spec.ts`,
  `npm run walkthrough`.
- **Documents.** `docs/dev/dev-environment.md` where it tells how a
  walkthrough is made.
- **Tests.** The tool's.
- **Check.** `ci/check.sh`; `walkthrough.spec.ts` on chapter 4.

### 3.7 The whole check, the walkthrough, the changed texts and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4. The
whole `ci/check.sh --e2e`, in a copy, with Playwright's own server on
4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough, `recorrido-capitulo-4-<date>.es.md`, each
  level in one arrangement;
- the page of the changed texts before and now, as 2.11;
- the report in Spanish: what was built piece by piece, every choice
  the plan left and how it was taken, every cell of 2.6 and 2.7 that
  moved, what Gemini's drafts needed corrected, the tips that entered
  and the ones dropped, and how the owner sees the waiting view on
  their own server (a slow network set in the browser's tools, step by
  step).

No scene's cells or masks change, so no contact sheets are made; if a
piece moves one, the scene's sheet comes with it (D208).

## 4. Gemini images

None. Chapter 4 stands at 29 of its 50.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux. Read
first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-43.md (this plan, whole), docs/dev/sprint-42.md (what
you built last), drafts/recorrido-capitulo-4-2026-11-12-3.es-comments.md
(the owner's comments, marked in the walkthrough's text), and the memory
notes kydux-two-agents, kydux-sprint-42-state, kydux-designer-review-42,
kydux-designer-texts-and-music-2026-11-13,
kydux-designer-uat-chapter-4-2026-11-13, kydux-designer-sprint-43-plan
and kydux-checks-per-piece. The designer's commits after yours (28a9e3a
to the plan's own) put the owner's words on the levels that differ at
each run, chose the passages' theme and set a level's music at 0.4:
read them with git log -p 28a9e3a..HEAD before you start. Build sprint
43 whole: pieces 3.1 to 3.7 in order, one local commit each; before
each commit ci/check.sh and the browser specs the piece touches green,
and the whole ci/check.sh --e2e once before the last commit, in a copy
with Playwright's own server on 4173; never a push, never a timer,
never a deploy: nothing is released until the owner is happy with
chapter 4. Never stop or build into the servers on ports 443 and 5173,
and stop your own preview when you are done. Gemini paints nothing.
Gemini writes the texts of section 2.9 from two briefs; you read and
correct the drafts and say in the commit what you corrected. The words
the plan gives letter for letter (the welcome's lines, the owner's four
tips, the goal lines, the owner's sentences in the lessons, the story,
La revisión and El primer vuelo, and the comments of both starting
codes) are kept as they are; Gemini gives only their English twins. No
text the child reads says "manera" or "way" for the arrangements of a
level. The five things the owner will look for: (1) no screen waits for
Python and none says Preparando Python… of anything else; a newcomer
reads the letter over the castle with the music playing while the field
loads; a child who has begun sees a tip only when a wait is longer than
the grace, the screen then waits for the tip's 10 seconds or the Seguir
button, and every tip is true of the page as it is (D214, 2.2); (2)
drevo cast in the air lands, or is refused over a cell nobody walks on
with the bump's sound and the program stopped, the wizard still in the
air; El primer vuelo asks to reach the stone and gives its extra for
landing on it by a cast (D215, 2.3); (3) the shed's order: the wall,
checking-each and La revisión on the wall's own brooms, less-or-greater,
the new level the-nearest-broom with one broom and no loop, then Las
escobas de la paja (D217, 2.4 to 2.6): the plan gives every way's
brooms and walks, checked by hand; hold them with the tests it asks
for; (4) both levels of the straw start from the owner's comments, one
for each instruction, the empty line under each carrying the
indentation of the line to write (D218); (5) the flying lesson opens in
the shed and goes on by the lake (2.7). The walkthrough shows each
level in one arrangement (D216). The plan decides everything; where it
does not, take the smallest choice that keeps its intent and say it in
the commit. Where a cell of 2.6 or 2.7 does not give what its sentence
asks, the sentence rules. Never edit content while a browser run is
going. Every document and comment in the present. Before git add, read
git diff of each file and stage only your own hunks; commit promptly.
Hand over chapter 4's walkthrough, the page of the changed texts before
and now made from git diff (2.11), and a report in Spanish as 3.7 asks,
and end with the prompt for the designer's review in English, in a code
block.
```
