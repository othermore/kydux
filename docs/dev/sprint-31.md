# Sprint 31 — Chapter 3 as the owner reads it: the words, the crossing, the doors, the plan

The owner read the first third of chapter 3 in the walkthrough document
(`drafts/recorrido-capitulo-3.es.md`, 2026-11-06: every story step, every
lesson page, every level's start, route and win, and the check sheets) and
wrote corrections under the pictures: some apply to the whole chapter, some
to a level or a lesson, and each of those teaches something for the rest.
This sprint answers every one of them and what the designer found alike in
the two thirds the owner has not read yet. The owner's own words, quoted in
section 2, are the model of how the chapter must speak to a child; where
the owner wrote a text, it is used as written.

The pieces, in this order: 31.1 to 31.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer (the owner pushes with `ci/push.sh`);
every word for the player through `t()` or a content file, in English and
Spanish; Gemini writes every text the child reads from a brief, and the
implementer reads and corrects the draft, except the texts the owner wrote,
which the brief gives as fixed; a chosen painting is mended in boxes, never
painted again (D88); no content is edited while a browser run is going;
documents and comments in the present (CLAUDE.md). Section 5 is the Gemini
budget, section 6 the owner's acceptance test, section 7 the hand-over,
section 8 the prompt.

## 1. Decisions taken here

- **D141 — The chapter's words speak as the owner does.** Decided
  2026-11-07 from the owner's corrections. A text the child reads says what
  a friend would say, in the order a child needs: the thing first, then the
  word for it, then an example with numbers, and nothing about how the game
  is built. In particular: a program *looks at* an attribute, *sees* where
  it stands, *checks* its coordinates; it never *asks* (`preguntar` is out,
  with `preguntarle a la puerta`, `preguntar dónde estoy`); a cell is named
  by its two numbers, the first `x` from the left and the second `y` from
  the top, written `(x, y)`, both from 0, and the lesson calls this a
  system of coordinates; the tunnel is dark, not enchanted (D145); no text
  says that a level is played in several ways, that the friend whispers, or
  that the game waits: the game's doing is shown, not told; the friend's
  reasons are said (*I was looking for books about this castle*), and what
  the friend does not know is said as a guess (*creo que*); a bonus goal
  names the spell (*abre el mapa con su hechizo*); an outro tells what the
  three see next, not what the code did. Rules out mechanics in the fiction
  and a lesson that names three ideas on one page.
- **D142 — A lesson page runs its code.** Decided 2026-11-07 (the owner's
  suggestion, taken). Any page of a lesson may carry a `python try` block;
  the page shows it in an editor with a *Run* button, runs it in the world
  of the lesson's level (the stop after it) at that level's start, and
  writes under the editor what the program printed, the wizard's cell at the
  end if it moved, or the error in the child's words; no scene is shown. The
  child edits the block and runs it again. The lesson's last page keeps the
  *Try it* button, which leads to the level with that page's code (D55 as
  until now). Rules out a lesson that explains an expression and never lets
  the child print one.
- **D143 — The plan is the scene's own picture in ink.** Decided 2026-11-07
  (the owner: the plan must show walls, doors and rooms, the figures as
  themselves, the mark as a mark, and match the scene). The plan window
  (D134) draws the scene's ground picture through an ink-on-parchment filter
  (greys lifted to parchment, lines darkened, colour taken out), the cell
  grid over it, every door as the scene shows it at that tick (its open
  state's picture when open), the figures with their own standing sprites and
  their names and cells beside them, every `reach` mark with the mark's
  picture, the hidden ones too (the plan is where the child reads the cell),
  the dark tunnel's cells as a dotted path over the picture labelled
  `t('plan.tunnel')`, the column and row numbers along the four edges in a
  larger hand, and each cell's own numbers only when the pointer rests on it
  or a finger taps it. What is unlit in a dark room stays undrawn (D52).
  No Gemini image. Rules out a hatched grid, numbers in every cell, and an
  old-map painting asked of the model, which cannot match the scene cell for
  cell.
- **D144 — A door's open state is built from its closed one.** Decided
  2026-11-07 (the owner: a reliable method for doors, which fail every
  time). `tools/art/door.py` makes the open picture of a door from the
  painting alone: the doorway is the closed leaf's traced polygon (D113)
  filled with the floor beyond, tiled from the floor cells `floor_from`
  names (the room's cells behind the door), shaded darker toward the lintel;
  the leaf is the closed leaf's own pixels, cut by its polygon, swung open
  about its hinge edge (`hinge: left`, `right`, or `both` for a double door)
  by a foreshortening that keeps the hinge edge in place, scales the width
  to `swing` (0.35 by default) and lifts the far edge, drawn whole over the
  jamb, never clipped by the door's box, with a soft shadow on the floor; the
  jambs, the arch and the threshold are the painting's, untouched. The two
  pictures, closed and open, differ in nothing else, so the leaf's shape,
  its arch and its bands are the same open as shut. Rules out asking the
  model to paint a door open, and a leaf cut by a box's corner.
- **D145 — The tunnel is dark.** Decided 2026-11-07 by the owner. In every
  word the child reads the tunnel is a dark tunnel where nothing is seen,
  and the map does not show the three inside it either; the word
  *enchanted* (*encantado*) is in no text and in no label. The scene's
  setting keeps its key `enchanted` (D135), which is code.
- **D146 — The crossing teaches waiting, then `if`, then `else`, one idea a
  level.** Decided 2026-11-07 by the owner. *La salida del túnel* teaches
  `wait` alone: Dask always starts at the same place, walking up the
  crossing toward the wizard's row, and the wizard waits two ticks for him
  to pass, then crosses to the first statue; a new lesson *Esperar*
  (`lesson:waiting`) comes before it. *Junto a las estatuas* teaches `if`
  alone: Dask stands still between the first and the second statue, looking
  up or down, and the wizard, against the top wall, goes down two cells to
  pass below him when he looks up, and crosses straight when he looks down;
  the corridor is three cells high for it. *Izquierda o derecha* teaches
  `if` and `else`, and the lesson *Si no* comes right before it. Rules out a
  level where one tick of waiting is enough only because Dask has two
  starts.
- **D147 — A standing figure stands.** Decided 2026-11-07 by the owner. A
  figure's standing frame, in every row of its sheet, has its feet together
  and its weight on both; a walking frame is made from it (`figures.py`).
  Dask's sheet is redone from a standing drawing. Rules out a teacher who
  stands still with a foot in the air.

## 2. The owner's corrections, and what answers each

The owner's words are quoted as written (Spanish). *Piece* names where it
is done.

| # | Where | The owner | Piece |
| --- | --- | --- | --- |
| 1 | S1, step 4 (friend) | New text (section 3.1); then the mate asks why the friend was looking for books about the castle; the rumours are the friend's step, not the mate's; the friend's next step rewritten. | 31.6 |
| 2 | S1, step 5 | Adds: *También hay rumores de que en esos pasillos pasan cosas raras o se oyen voces.* | 31.6 |
| 3 | Lesson 1, page 1 | No *hablo bajito*; the owner's text on the map and the system of coordinates (section 3.2). | 31.6 |
| 4 | Lesson 1, page 2 | The owner's text on the steps between two cells (section 3.2). | 31.6 |
| 5 | P1 intro | The owner's text (section 3.3): open the map with its spell and see the cells. | 31.6 |
| 6 | P1 bonus | *Abre el mapa con su hechizo.* | 31.6 |
| 7 | P1 plan | Not a bare grid: walls, doors, rooms painted; numbers bigger or on hover; the figures as themselves; the mark drawn; the plan must match the scene (the tunnel's mouth, no corridor beyond). | 31.4, D143 |
| 8 | P1 outro | *¡Lo hemos conseguido! Este túnel al que hemos llegado está muy oscuro...* | 31.6 |
| 9 | Lesson 2, page 1 | Not enchanted, dark; the owner's text on `position` (section 3.2). | 31.6, D145 |
| 10 | Lesson 2, page 2 | The owner's text: the program sees where things are even when the map does not show them. | 31.6 |
| 11 | Lesson 2, page 3 | No *preguntar*: look at or check an attribute. | 31.6, D141 |
| 12 | P2 intro | The owner's text (section 3.3). | 31.6 |
| 13 | P2 outro, learned | No *preguntar* anywhere: *mirar*, *ver dónde estamos*, *buscarnos en el mapa*. | 31.6, D141 |
| 14 | P2 plan | The tunnel's entrance and exit drawn on the plan. | 31.4, D143 |
| 15 | Lesson 3 | Slower and in order: attributes with other values (`facing`, a string); comparing, True and False; comparing attributes, and an attribute with a literal; the negation as *decir lo contrario*; an example to print or a small program on every page; then `if`, with an example to try and edit; an inline editor in the lesson. | 31.5, 31.6, D142 |
| 16 | Lesson 4, page 2 | The owner's opening on waiting (section 3.2), which becomes the new lesson *Esperar*. | 31.6, D146 |
| 17 | Lesson 4, page 3 | No *the levels can be played in several ways*: we want the wizard to wait while Dask looks up. | 31.6, D141 |
| 18 | P3 | Rethought: `wait` alone, Dask always from the same place, two ticks of waiting, then cross. | 31.2, D146 |
| 19 | P4 | `if` alone; Dask between the first and the second statue looking up or down; the wizard against the top wall goes down two to pass below, or crosses straight. | 31.2, D146 |
| 20 | P4 | Dask's standing picture has moving feet. P3 ends left of the first statue. | 31.3 (figure), 31.2 |
| 21 | P5 | `if` and `else` are introduced here, the lesson right before. | 31.6 (order) |
| 22 | P5, the left door open | The edge stays shut, the floor behind does not match the floor around, the leaf is cut by the box's corner. | 31.3, D144 |
| 23 | P5, the right door open | The same, and an arched door shows a single swung leaf unlike the closed one. | 31.3, D144 |

What the designer found alike in the rest, answered by the same pieces:
*preguntar* in P5's hints, intro and learned, in P7's outro, in the lessons
*Si no* and *Luz y losas*; *jugar de varias formas* nowhere else, but the
ways' names stay as they are (they name where Dask is on his round); the
same door faults in the three doors, the storeroom's door and the way
down's double door; the way down's navy bands between its rooms; Dask half
out of view at the start of P6 and P9, and the goals box over the wizard;
the friend speaking half out of view in S1's step 4.

## 3. The words

### 3.1 The first story, *Después del anochecer*

Nine steps, `content/stories/after-dark/story.json` and its texts. The
staging of sprint 30 stays (the wizard sits up, the mate wakes, the two walk
to the door and open it, the friend appears and hands over the map, the
three go out), with the steps now:

1. The voice, as it is.
2. The mate: *¿Has oído eso?*
3. The voice: the two go to the door, as it is.
4. The friend, the owner's text: *No podía dormir. Hoy en la biblioteca
   buscaba libros sobre este castillo, y en el que cogí encontré algo
   doblado: el mapa del niño travieso. Creo que lo dibujó hace años un
   alumno que se escapaba de noche. En la esquina tiene una palabra,
   *orvim*. Creo que es un hechizo para activarlo. Toma, quizás tú averigües
   cómo hacerlo.*
5. The mate asks why the friend was looking for books about the castle
   (Gemini writes it, one short question).
6. The friend, the owner's text: *Los alumnos mayores dicen que los pasillos
   cambian de noche, y que el profesor Dask los patrulla para que nadie esté
   fuera de la cama. También hay rumores de que en esos pasillos pasan cosas
   raras o se oyen voces.*
7. The friend, the owner's text: *Por eso creo que debemos ir a
   investigar... Y, si ese mapa funciona como creo, nos ayudará a
   orientarnos en los pasadizos, incluso a oscuras. Lo mejor es que lo
   consultemos en cada paso que demos por la noche en el castillo. ¿Qué
   decís, venís conmigo?*
8. The wizard, as it is (*si Dask nos ve, volvemos directos a la cama*).
9. The voice: the three go out, as it is. The camera on the friend's step
   lifts so that the friend at the door is whole in the view (31.3).

The English follows the Spanish.

### 3.2 The lessons

Nine lessons, in this order in `chapter.json` (section 3.4): `the-cells`,
`where-i-am`, `waiting` (new), `true-or-false`, `if`, `else`, `repeat`,
`while`, `kirra-and-osto`. Every page that shows code shows it in a
runnable block (D142), so that the child prints the example or changes it.

**`the-cells`, *Las casillas*.** Page 1, the owner's text: *Este mapa que
te he dado es el mapa del niño travieso. Es un plano de todo el castillo, y
siempre nos muestra lo que necesitamos ver en ese momento, si decimos el
hechizo correcto. Funciona con un sistema de coordenadas: cada casilla del
plano se nombra con dos números. El primero es la x y el segundo la y, y se
escriben (x, y). La x cuenta desde la izquierda hacia la derecha, y la y
desde arriba hacia abajo. Y, muy importante: empiezan en el 0. Así que la
casilla de arriba a la izquierda siempre será la (0, 0). La que está justo a
su derecha es la (1, 0) y la que está justo debajo es la (0, 1).* Page 2,
the owner's text: *Lo importante es que esos números nos dicen cuántos pasos
hay entre dos casillas. Por ejemplo, entre la (0, 0) y la (2, 0) hay dos
pasos. Un paso a la derecha suma uno a la x. Un paso hacia abajo suma uno a
la y. Si damos un paso a la izquierda restamos uno a la x, y si damos un
paso hacia arriba restamos uno a la y. Así que para ir desde la casilla
(5, 12) hasta la (9, 9), tu maga tiene que caminar cuatro pasos a la derecha
y tres arriba. Solo tienes que contar cuántos pasos hay de un número a
otro.* Page 3 as it is (the spell *orvim* opens the plan of the corridor;
*Pruébalo* with `wizard.cast("orvim")`), without *hablo bajito*.

**`where-i-am`, *Dónde estoy*.** Page 1, the owner's text: *Aquí no se ve
nada, pero eso no nos impide saber dónde estamos. Como tiene el mapa del
niño travieso, tu maga siempre sabe en qué casilla está. Puedes verlo
abriendo el mapa, pero si necesitas verlo dentro del programa, puedes usar
`wizard.position`. `position` es un atributo de `wizard`, y guarda dos
números juntos, como `(15, 3)`. También podemos ver la posición de algún
objeto o cosa que haya en el escenario. Por ejemplo, si tenemos una llave,
`key`, podemos ver su posición usando `key.position`.* A block prints
`wizard.position`. Page 2, the owner's text: *A veces no podemos ver algunas
cosas en el mapa (quizás hay un encantamiento de ocultación, o quizás son
muy pequeñas). Sin embargo, usando el atributo `position`, el programa ve
exactamente dónde están las cosas, incluso aunque tú no lo veas en el
mapa.* Page 3: *Vamos a mirar en qué casilla estamos ahora mismo, aquí
dentro del túnel*, the block `print(wizard.position)`, which prints
`(15, 3)`.

**`waiting`, *Esperar*** (new, `teaches: ["wizard.wait"]`). Page 1, the
owner's text: *Hasta ahora hemos hecho programas en los que nuestro
personaje siempre hacía algo, pero a veces nos hace falta hacerlo esperar.
Por ejemplo, en la siguiente pantalla, nuestro personaje tiene que esperar a
que Dask pase antes de poder cruzar. Para esperar se usa el método
`wizard.wait()`*, and then what sprint 30's page said: a tick is a moment
of the game in which everything else moves, `wizard.wait(2)` waits two.
Page 2, the block `wizard.wait(2)` then `wizard.move_right(9)`, which the
runner answers with the wizard's cell at the end; *Pruébalo* leads to the
level.

**`true-or-false`, *Verdadero o falso*** (`teaches: ["teacher.facing",
"wizard.facing"]`), five pages, as the owner laid them out:

1. *Otros atributos.* An attribute may hold something other than two
   numbers: `dask.facing` holds a word, a string, that says which way Dask
   looks, `"up"`, `"down"`, `"left"` or `"right"`; `wizard.facing` the same
   for the wizard. Block: `print(dask.facing)`.
2. *Comparar.* We can compare two things to see whether they are the same,
   with `==`; the answer can only be yes or no, which in programming are
   called `True` and `False`. Block: `print(3 == 3)` and `print(3 == 4)`.
3. *Comparar atributos.* Two attributes compared: whether Dask and the
   wizard look the same way, `dask.facing == wizard.facing`; an attribute
   and a literal: whether Dask looks up, `dask.facing == "up"`. Block:
   `print(dask.facing == wizard.facing)` and `print(dask.facing == "up")`.
4. *Decir lo contrario.* `not` before an expression says the opposite: if
   Dask looks up, `not dask.facing == "up"` is `False`. Block:
   `print(not dask.facing == "up")`.
5. *Pruébalo.* A small program the child changes: print whether Dask looks
   down, then whether he does not. The *Try it* leads to the level.

A single `=` names a value and `==` compares: said once, on page 2.

**`if`, *Si*** (`teaches: []`), three pages: the condition, its colon and
its four spaces (as it is); page 2, the example to try and edit, tied to
the level that follows: *si Dask mira hacia arriba, baja dos casillas*, the
block `if dask.facing == "up":` / `    wizard.move_down(2)` and under it
`print(wizard.position)`, which shows the cell changes only when the
condition is true; page 3, *Pruébalo* with the same block, leading to the
level. Nothing about ways.

**`else`, *Si no*,** after *Junto a las estatuas* and before *Izquierda o
derecha*: as it is, with the doors as its example instead of Dask (*si la
puerta izquierda está cerrada con llave... si no...*), the block an `if`
and `else` that print which door we take, tried at *Izquierda o derecha*;
*pregunta* out.

**`repeat`, `while`, `kirra-and-osto`:** read again by the rule of D141:
*preguntamos `slab.in_place`* becomes *miramos `slab.in_place`*; *Luz y
losas* says *agujero* and *losa*, never *piedra*; nothing else changes.

### 3.3 The levels' words

Every level's `text.<lang>.json` is written again by Gemini from the brief
of 31.6, with the owner's texts fixed and the facts of section 4:

- **P1 `the-doors-corridor`.** Intro, the owner's text: *Mira cuántas
  puertas... ¡Nuri dice que el túnel está al final de este pasillo! Si abres
  el mapa haciendo el hechizo orvim, verás que estamos en la casilla (1, 12)
  y el mapa dice que la boca del túnel es la (15, 3). Como no hay marca en el
  suelo, ¡cuenta cuánto cambia cada número!* (`{mate}` for Nuri.) The bonus
  goal: *Abre el mapa con su hechizo.* Outro: *¡Lo hemos conseguido! Este
  túnel al que hemos llegado está muy oscuro...*
- **P2 `the-dark-tunnel`.** Intro, the owner's text: *¡Qué oscuro! En este
  túnel no se ve nada... y por algún motivo, ni siquiera el mapa nos
  muestra. Lo que sí vemos en el mapa es la salida del túnel, en la casilla
  (19, 1). ¡Podemos mirar dónde está el mago, contar los pasos y caminar a
  ciegas!* Outro and learned without *preguntar*: we looked at our position
  and walked out; a program sees its position even where nothing is seen.
- **P3 `the-tunnel-exit`.** Intro: Dask comes up the crossing's corridor
  toward our row, looking up; if we cross now he sees us; wait two ticks for
  him to pass, then walk to the first statue. Goals: reach the mark (at the
  first statue), not seen. Hints on `wait(2)` and the walk of nine.
- **P4 `by-the-statues`.** Intro: Dask stands between the first two statues
  looking up or down; against the top wall, if he looks up we go down two
  and pass below him, if he looks down we cross straight; then down into
  the corridor between the second and the third statue. The ways' names:
  *Dask mira hacia arriba*, *Dask mira hacia abajo*. Nothing about ways in
  the intro.
- **P5, F1, I1, P6, P7, P8, P9:** the facts as they are, the words by D141
  (*mirar lo que la puerta sabe*, `left_door.locked`; the slab's outro
  without *preguntarle*; P6's intro without *ningún número fijo de esperas
  servirá* said as a mechanic: *no sabemos cuánto tiempo mirará hacia aquí,
  así que esperaremos mientras mire*).

The English the same, from the Spanish.

### 3.4 The chapter's stops

`content/chapters/03-passages/chapter.json`, twenty-four items:

```
story:after-dark, lesson:the-cells, level:the-doors-corridor,
lesson:where-i-am, level:the-dark-tunnel, lesson:waiting,
level:the-tunnel-exit, lesson:true-or-false, lesson:if,
level:by-the-statues, lesson:else, level:left-or-right,
level:the-wrong-door, lesson:repeat, level:the-three-doors,
story:beyond-the-doors, lesson:while, level:past-the-teacher,
lesson:kirra-and-osto, level:the-moving-slab, level:the-dark-room,
story:the-voices, level:the-night-walk, story:caught
```

The lessons' numbers in the course follow (nine); `docs/dev/course.md`'s
table and count with them.

## 4. The crossing, redrawn and replayed

### 4.1 The scene

`the-crossing` gains a third row of floor in the main corridor, below the
statues, so that a figure passes below Dask (D146). With
`repaint.py spaced` over the whole width (columns 0 to 20), by rows: the
rooms above the corridor's top wall are compressed by one cell, everything
from that wall down to the statues' feet moves up one cell, and the cell
freed under the statues is floor, tiled from the corridor's own floor
(`tiled`, the stones of rows 6 and 7 of the painting as it is); nothing
below the statues' feet moves. Knots, in cells of the picture as it is to
the picture as it will be: `[[0, 0], [5.0, 4.0], [8.35, 7.35]]`, then the
band `7.35` to `8.35` tiled, then `[[8.35, 8.35], [15, 15]]`. The statues'
boxes and polygons, the doors in the top wall, the left arch and Dask's
corridor above the crossing move up with the picture (their `cuts` entries
by one cell above the knot; their `map.txt` cells too); the statue corridor
keeps its cells. The map after it, rows 0 to 14:

```
####################
########..##########
########..##########
########..##########
########..##########
...................#
##..........u.u..u.#
##.................#
########..####...###
########..####...###
########..####...###
########..####...###
########..####..####
########..#####.####
####################
```

The enchanted arch is `[[0, 5, 1, 5]]`; the tunnel's end in `the-tunnel`
stays (19, 1). The sweep and the sheets run again; `kept` boxes move with
the picture. 0 images.

### 4.2 P3 `the-tunnel-exit`, *La salida del túnel*

Start (2, 5), the first cell out of the arch; friend at (2, 6), mate at
(3, 6). Dask `at` (9, 13), `facing` `up`, `patrol` `[[9, 1]]` (today's
form: he steps up at tick 1 without a turn), one way. Goals: `reach` E at
(11, 5), the cell left of the first statue; `not_seen_by` `dask`. `api`:
the moves, `wizard.wait`. Starting code: a comment to wait two ticks with
`wait`, a comment for the walk. Solution:

```python
wizard.wait(2)
wizard.move_right(9)
```

Dask is at (9, 13 − t) at tick t, looking up: he sees (9, 5) from (9, 9)
to (9, 6), ticks 4 to 7; he stands on it at tick 8; from tick 9 he is
above it. The wizard reaches (9, 5) at tick 2 + 7 = 9. Wrong: the walk
alone (seen at tick 7, Dask at (9, 6)), `wait(1)` (walked into at tick 8),
`wait(2)` and a walk of 8 (stops short). A unit test holds the four.

### 4.3 P4 `by-the-statues`, *Junto a las estatuas*

Start (11, 5); friend at (10, 5), mate at (10, 6). Dask stands still at
(13, 6), between the first statue (12, 6) and the second (14, 6); two
ways, `looking_up` (`facing` `up`: he sees (13, 5)) and `looking_down`
(`facing` `down`: he sees (13, 7)). Goals: `reach` E at (15, 8), the
mouth of the corridor between the second and the third statue;
`not_seen_by` `dask`. `api`: the moves, `wizard.wait`, `teacher.facing`.
Starting code: a comment for the condition (if Dask looks up, go down two
with `move_down`), the walk right, the walk down. Solution:

```python
if dask.facing == "up":
    wizard.move_down(2)
wizard.move_right(4)
wizard.move_down(3)
```

Looking up: (11, 5) → (11, 7) → (15, 7) → (15, 8), the mark met on the
way, (15, 10) at the end. Looking down: (11, 5) → (15, 5), passing above
the statue at (14, 6), → (15, 8). A goal once met stays met
(`world.py`, `met_at`), so the three more cells of the first way change
nothing. Wrong: the walk alone (seen at (13, 5) in `looking_up`), down two
always (seen at (13, 7) in `looking_down`), the condition on `"down"`
(caught in both), the body not moved in (a syntax error, explained). A unit
test plays them in both ways.

### 4.4 The figures

Dask's sheet (`content/art/figures/dask.webp`) is made again from a
standing drawing (D147): one Gemini image, Dask standing still in the four
views (down, left, right, up) with his feet together and his hands clasped,
in the sheet's style and size, cut by `figures.py` into the standing frames;
the walking frames are made from them as `figures.py` does. His start in
every level and story shows the standing frame.

The camera at a level's start frames the wizard and every actor of the
level (the teacher included), zooming out as far as it must and no farther
(D69 holds for the follow afterwards); at 1280 by 800 the goals box folds
itself when it would cover the wizard's start cell. The camera on a story
step whose speaker stands at the scene's edge lifts to show the speaker
whole (S1, step 4).

## 5. The pieces

### 31.1 The world

- `wizard.facing` in `api.py`'s `wizard` members, taught by
  `true-or-false` (lesson `teaches`), in the API table and the notebook's
  words.
- `tools/art/door.py` (D144): `door <scene> <door_id>` reads
  `art/scenes/<scene>/cut.json`'s door (`polygon`, `hinge`, `floor_from`,
  `swing`), writes the door's open picture into the scene's raw folder and
  the `states` entry `cut.json` needs; `export_scene.py` takes it as the
  door's `open` state. A unit test on a synthetic door (a rectangle with a
  coloured leaf) holds that the doorway's pixels come from `floor_from`,
  that the leaf's far edge lies outside the doorway on the hinge's other
  side, and that no leaf pixel is lost.
- The runner for a lesson page (D142): `world/kydux_world/run.py` already
  runs a program in a level's world; what the page needs is the level id
  of the stop after a lesson, which `chapter.json` gives.
- Check: `world/tests`, `tests/tools`.

### 31.2 The crossing and its two levels

- `art/raw/game-crossing*/` and `art/scenes/the-crossing/`: the third row
  by `spaced` and `tiled` (4.1), the cuts moved, the sweep green, the
  sheets looked at.
- `content/scenes/the-crossing/map.txt` and `scene.json` (4.1).
- `content/levels/the-tunnel-exit/` (4.2) and `by-the-statues/` (4.3):
  `level.json`, `solution.py`, `wrong/`; the texts' facts for 31.6.
- `world/tests/test_passages.py`: the tick table of 4.2 and the two ways of
  4.3.
- Check: `ci/check.sh`; `tests/project`.

### 31.3 The doors, Dask, and the pictures the owner found

- The seven doors of chapter 3 built again with `door.py` (D144):
  `left_door` and `right_door` of the two doors, `door_1` to `door_3` of
  the three doors, `store_door`, and the way down's double `door`; their
  Gemini `swung` edits set aside (kept in `art/raw/` as sources, unused);
  `floor_from` for each named in `cut.json`; the doors' sheets looked at,
  every leaf whole, every doorway the floor beyond.
- Dask's sheet from a standing drawing (4.4): 1 image (+1 retry).
- The way down: the navy bands between its right-hand rooms and above its
  door, laid with the picture's own stones (`tiled`, no model), the sweep
  green.
- The start camera and the goals box (4.4), in `engine/camera.ts` and the
  goals panel; the story camera lifting for a speaker at the edge.
- Check: `ci/check.sh`; Vitest for the camera's start frame.

### 31.4 The plan from the picture

`app/src/ui/plan.ts` (D143): the scene's ground image drawn on the plan's
canvas through the ink filter (a canvas filter, `grayscale`, `contrast`
and a parchment tint, or the pixels mapped by hand where the filter is
not enough: the result reads as a drawing, every wall and door clear), the
grid at the scene's cells, the doors' open pictures where open, the figures'
standing sprites (the wizard's look, the friends', Dask's) at their cells
with name and cell beside, every reach mark's picture, the tunnel's cells as
a dotted path with `t('plan.tunnel')`, the edge numbers at 18 px, the
cell's numbers on hover and tap; `planShapes` and its Vitest test say what
is drawn; the margins outside the scene's cells not drawn. The browser test
of 30.7 checks the plan's figures and the tunnel still.

### 31.5 The lesson's runner

`app/src/ui/lesson.ts` (D142): every `python try` block of a lesson is an
editor (CodeMirror, as the level's) with *Run* under it; *Run* loads the
runtime if it is not loaded, builds the world of the lesson's level at its
start and runs the block in it; under the editor, what was printed, in the
level's `printed` style, then the wizard's cell when it moved
(`t('lesson.ended_at')`), or the error as the level says it; a second *Run*
runs again from the start. The last page's *Try it* button stays. A Vitest
test on the runner's words and a browser test on `true-or-false` page 1
printing Dask's facing.

### 31.6 The texts

Briefs in `tools/write/briefs/`: `chapter-3-rewrite-stories.md` (S1 of
3.1, and the three others read by D141), `chapter-3-rewrite-lessons.md`
(the nine lessons of 3.2, with every text the owner wrote given as fixed
and as the model of the voice), `chapter-3-rewrite-levels.md` (the eleven
levels of 3.3). Each brief carries D141 in full, the owner's texts, and
`docs/dev/course.md`'s chapter. The drafts read, corrected and moved into
`content/`; `chapter.json` as 3.4; `lesson.json` of `waiting`; the course
book regenerated and read whole in Spanish. The `plan.tunnel` and
`lesson.ended_at` words, Claude's (D55).

### 31.7 The walkthrough as a tool, and the tests

- `app/e2e/walkthrough.spec.ts` and `tools/walkthrough.py`, from the
  designer's scratchpad scripts (section 7 of the review): the first plays
  a chapter as the child does, in Spanish for the seeded wizard, and writes
  every story step, every lesson page and, for each level, the start card,
  the start, the won card and the route tick by tick in every way, to
  `app/e2e/shots/walkthrough-<chapter>/`; the second assembles
  `drafts/recorrido-capitulo-<n>-<date>.es.md` with the check sheets and a
  **Comentarios:** line under every picture, never overwriting a file the
  owner has written in. `npm run walkthrough -- 03-passages` runs both.
- `chapter-3.spec.ts` on the new stops and ways; the lesson's runner; the
  plan.
- `ci/check.sh --e2e` green.

### 31.8 Documents, and the prompt for the review

- `docs/dev/architecture.md`: D141 to D147; D134's plan paragraph points to
  D143; D116's open-door line to D144; the module map (`door.py`, the
  lesson's runner, the walkthrough).
- `docs/dev/course.md`: chapter 3's nine lessons and the stops; *How a
  level earns its idea* gains the owner's rule that the crossing teaches
  one idea a level (D146) and the words rule (D141).
- `art/README.md`: *A door opens from its closed picture* (D144); the
  figures' standing frame (D147).
- `docs/dev/dev-environment.md`: the walkthrough's command; `docs/dev/plan.md`
  5.5 names this sprint.
- The walkthrough document regenerated for the owner's next pass:
  `drafts/recorrido-capitulo-3-<date>.es.md`.
- The report in Spanish and the prompt for the designer's review, as
  section 7.

## 6. Gemini images

Fifty of the chapter's seventy are spent. This sprint asks **one** (Dask's
standing drawing) and allows one retry: 52 at most. Doors, the plan, the
crossing's third row and the way down's bands cost none.

## 7. What the owner tries

The owner continues the walkthrough from where it stopped, in the new
document of 31.8, and in the game on `https://localhost:5173/?debug`:

1. *Después del anochecer*: nine steps, the friend's reasons, the mate's
   question, the friend whole in the view at the door.
2. *Las casillas* and *Dónde estoy* in the owner's words; a block printed
   on the lesson page itself.
3. *El pasillo de las puertas*: the plan is the corridor drawn in ink, with
   Marta, Teku and Nuri as themselves, the mouth of the tunnel and the
   mark at (15, 3); the numbers of a cell appear under the pointer.
4. *Esperar* and *La salida del túnel*: Dask comes up the corridor looking
   up; without waiting he sees us; `wait(2)` and the walk to the first
   statue win.
5. *Verdadero o falso*: five pages, each with code to run and change.
6. *Si* and *Junto a las estatuas*: Dask between the first two statues, his
   feet together; looking up, we pass below him; looking down, straight.
7. *Si no* and *Izquierda o derecha*: `if` and `else`; the open doors show
   the room's floor and a whole leaf, the same door as shut.
8. The three doors, the storeroom's door and the way down's door the same.
9. The way down without navy bands; Dask in view at the start of *Pasar al
   profesor* and *El paseo nocturno*.

## 8. What the implementer hands over

A report in Spanish with only pictures of the final commit: each new door
closed and open, the plan of three scenes, the crossing whole, Dask's
sheet, a lesson page with its runner; the commits with their hashes and the
state of `ci/check.sh --e2e`; what differs from this plan and why; what was
written by hand in Gemini's drafts, apart from the owner's texts; the
images spent against 70; what is left open; the walkthrough document's
path; and the prompt for the designer's review.

## 9. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-31.md (this plan, whole), docs/dev/sprint-30.md (how
chapter 3 was built), drafts/recorrido-capitulo-3.es.md (the owner's
corrections under the pictures, in Spanish: the sprint answers them),
docs/dev/course.md, art/README.md whole, D51, D52, D85, D88, D113 to
D118, D134 to D140 in docs/dev/architecture.md with its API, goal and
events tables, tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-30-state, kydux-designer-review-30,
kydux-painted-scene-learnings, kydux-chapter-design-learnings and
kydux-writing-feedback. Build sprint 31 whole: pieces 31.1 to 31.8 in
order, one local commit each, ci/check.sh --e2e green before each,
never a push, never a timer (the owner pushes with ci/push.sh). Never
stop or build into the servers on ports 443 and 5173, and never kill a
vite, node or nginx process of the owner's (CLAUDE.md); your own
preview on 4174 is stopped when you are done. Gemini paints one image
in this sprint, Dask's standing drawing, and one retry at most; every
text the child reads comes from the briefs the plan names, except the
texts the owner wrote, which you use word for word; you read and
correct every draft before it enters content/. The plan decides
everything; where it does not, take the smallest choice that keeps its
intent and say it in the commit; a choice that changes what the owner
sees is asked first, through the owner. Every document and comment in
the present. Before git add, read git diff of each file and stage only
your own hunks; commit promptly. Hand over what section 8 asks, as a
report in Spanish, and end with the prompt for the designer's review in
English, in a code block: the commits, the differences from the plan
with their reasons, what to look at with care, the images spent, the
walkthrough document's path, what is left open, and the limits.
```
