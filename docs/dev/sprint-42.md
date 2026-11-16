# Sprint 42 — What changes between runs told in the child's words, the shed's walks by distance, its cells and masks, the review's sheets, and the music chosen

The owner read the first part of chapter 4's walkthrough (the shed, to
*La revisión*) and listened to the twelve candidate themes on
2026-11-12. Their comments are in
`drafts/recorrido-capitulo-4-2026-11-12-2.es-comments.md` and in their
message of that day, and this sprint is all of them. What they found in
the shed holds for the rest of the chapter and, where it is about the
ways, for every chapter. They do not read the earlier chapters again.

What the owner asks, in short:

1. The child is never told of *ways* (*las maneras*). That is how the
   world is programmed. The child is told what may be different at each
   run, so that the program has to count or look instead of holding a
   number.
2. *El cobertizo* asks one thing: how many brooms lie on the floor. The
   hung ones are seen at once and are not counted. A step towards the
   wall is stopped, with the wizard's own words.
3. The wall's brooms hang on pegs that differ at each run, with gaps
   between them. The program goes to one end of the wall and walks from
   broom to broom by the distance to the next one. No level asks to end
   on a cell that does not matter.
4. The brooms hidden in the straw lie only on seven cells, the ones the
   picture paints straw on. The shed's figures and brooms are drawn
   clear of its barrel, its bales and its walls.
5. The next review comes with chapter 4's walkthrough and with contact
   sheets of every scene of the chapter, each with the grid drawn over
   it, the masks, every cell a figure walks and where the figure is
   drawn on it.
6. The music: two themes chosen, one chosen with a change of voice, one
   to write again, one to wait.

The owner is away and reads nothing until the designer's review of this
sprint finds nothing. Nothing is released until they are happy with
chapter 4.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer, never a deploy; the servers on 443 and 5173
untouched; documents and comments in the present; Gemini writes every
text the child reads from a brief, and the owner's own Spanish words are
kept as they are.

## 1. Decisions taken here

- **D204 — The child is told what may differ at each run, never of
  ways.** Decided 2026-11-12 by the owner (*No hay que hablar de las
  maneras en ningún lugar de ningún capítulo. Eso es una cuestión de
  como está programado nuestro mundo, pero el usuario no debe saberlo.
  El usuario debe saber que el número de escobas cambia cada vez, así
  que hay que programarlo para contarlas, no vale contarlas a mano y
  decir el número*). D51 stands as the world's mechanism: a level's
  `ways`, a run through each of them, the first one not won returned,
  the level won when every one is. What the child meets of it is this
  and nothing else:
  - A level with ways has in its `text.<lang>.json` a `changes`: one
    sentence, in the child's words, of what may be different at each
    run (*El número de escobas del suelo cambia cada vez.*). The start
    card shows it where the list of ways stood, followed by the same
    words on every level, `level.changes_tail`: *Tu programa tiene que
    valer siempre.* / *Your program has to work every time.* A level
    with ways and no `changes` is refused by the content's check.
  - The card shows no count of ways and no list of them. The ways'
    names leave every level's `text.<lang>.json`.
  - The level opens on its first way. A run shows the first way it does
    not win, as D51 says, and the scene keeps that way until the next
    run or until the level starts over. When the way a run shows is not
    the one that was on the screen before it, the outcome's card starts
    with `outcome.changed`: *Esta vez era distinto.* / *This time it
    was different.* Then it says what it says of any run.
  - A run that wins every way has the won card of any level, with no
    word about ways.
  - The `#way` select and its label are drawn only under `?debug`, and
    show the ways' ids. `outcome.way_won` is said only there.
  - The walkthrough and the course book, read by the owner and by
    developers, head each run with the way's id and say once that the
    child never sees these names.
  Rules out the word *manera* or *way* for this in any text the child
  reads, a count or a list of ways on a card, a select of ways on the
  page outside `?debug`, and the won card's *¡De todas las maneras!*.

- **D205 — A level may forbid cells of its own.** Decided 2026-11-12 by
  the owner (*si el personaje intenta llegar a la pared (a la zona de la
  pared) debería fallar diciendo: para contar las escobas en el suelo,
  mejor me quedo cerca de donde están tiradas*). A level's `level.json`
  may carry `"forbidden": {"reason": "<id>", "cells": [[x, y], ...]}`,
  with the form and the checks of the scene's (D84, D171). The wizard
  stops before a forbidden cell and says the reason's words, as before
  any forbidden cell. A level in a scene with forbidden cells of its own
  has both, each with its reason; a cell named by both is refused.
  Rules out a wall or an actor placed to keep the wizard from a part of
  a scene, and a goal that fails without a word when the wizard goes
  where the level does not want it.

- **D206 — A walk is asked for by what it does, and a hung thing is as
  far as the cell it is reached from.** Decided 2026-11-12 by the owner
  (*no me gusta lo de caminar hasta la casilla 8,6. No creo que eso
  importe. Lo que importa es recorrer todas las escobas. Hay que ir
  viendo su posición y moviéndose hacia la izquierda el número de
  casillas que faltan, usando la función que te da la distancia a un
  objeto*; and *Las escobas deben estar colgadas en lugares aleatorios y
  para resolverlo hay que irse a un extremo y iterar por las escobas,
  moviendose la cantidad definida con la funcion que te da la distancia
  a un objeto y, cuando estás al lado, desatándola. No hace falta llegar
  a la última casilla, pero sí hay que partir de la primera para
  asegurar que se va en una sola dirección hasta el final de la lista*).
  Two things:
  - A level has a `reach` goal only where being on that cell is what the
    level is about: a landing, a door's threshold, a bed's side. A level
    whose things must all be dealt with has the goal on the things, and
    the walk follows from where they are. In the shed, the wall's
    levels and the straw's have no `reach` goal and no `end`.
  - `distance_to` between the wizard and a hung thing counts the steps
    to the cell under it, where the wizard stands to untie it (D195):
    a broom hung over the wizard's own column of the wall's row is 0
    steps away, the next peg's is 1. `find_all` and `find_nearest` order
    by that same distance. A hung thing's `position` stays its peg's
    cell.
  Rules out a hung broom one step further than the walk to it, a level
  that asks to end on a cell to prove a walk, and pegs filled in a row
  from one end so that a step of one a broom solves the level.

- **D202 — The lying brooms: in sight on the boards, hidden on the
  straw's seven cells.** Rewritten 2026-11-12 from the owner's list
  (*las escobas que están en la paja solo pueden estar en las casillas:
  (6,6), (7,6), (5,8), (6,8), (12,8), (13,8), (13,6)*). The shed's
  `scene.json` names its straw cells, `"straw": [[6, 6], [7, 6], [13,
  6], [5, 8], [6, 8], [12, 8], [13, 8]]`, the cells the picture paints
  straw on. A lying broom on a straw cell is `hidden` until a program
  finds it; a hidden broom lies nowhere else. A lying broom in sight
  lies on the boards of rows 7 and 8, off the straw cells and off
  (13, 7). (5, 8) is floor: a broom on it is untied from its own cell
  (D183), and a figure on it stands in front of the bench. The content's
  tests hold every level, every way and every story step in the shed to
  this. Rules out a hidden broom on the boards, and a broom in sight on
  the straw.

- **D207 — A thing drawn by the game may be moved sideways on its
  cell.** Decided 2026-11-12 by the owner (*hay que desplazarlas un poco
  hacia la izquierda para que no se metan en la paca de paja*). A
  scene's `cut.json` may carry `"shifted": [{"about": "...", "cells":
  [[x, y], ...], "by": <cells>}]`: a thing the game draws from a sprite
  on one of those cells is drawn that far sideways, with its mark, its
  outline and its dot on the plan. It is the things' own setting: a
  figure on the cell is not moved by it (its move is the cell's nudge,
  D105), and a thing is not moved by the nudge of a cell with a
  `shifted` entry. The world knows nothing of it. The settings refuse a
  shift over a whole column or row, as they refuse a nudge. Rules out a
  sprite drawn into painted furniture, and a figure moved to make room
  for a broom.

- **D208 — A scene's review sheets carry the grid.** Decided 2026-11-12
  by the owner (*necesito todas las hojas de contacto para ver que las
  máscaras estén bien y para ver todas las casillas transitables y donde
  se posicionan los personajes en esas casillas. Y necesito que las
  hojas de contacto tengan no solo el número de celda sino la rejilla
  superpuesta para ver exactamente los límites de las casillas*).
  `tools/art/sweep.py` writes for a scene, besides what it checks, the
  sheets of section 2.6: every one has the cells' borders drawn as
  lines seen on any ground and each cell's number in the cell's top
  left corner, inside it. The `?debug` layer of numbers draws the
  cells' borders too, so that a number in a game picture is read
  against its cell. Rules out a sheet or a debug picture where a
  number can be read as the cell above or below it.

- **D209 — The themes chosen by ear, and the struck voice.** Decided
  2026-11-12 by the owner, by ear on the mixer (D203): *The arrival:
  lively full. The broom: lively full, pero suena demasiado "celta", me
  gustaría que sonase algo más animado, con movimiento, que recuerde a
  una carrera y no a un "paseo por el campo" como suena ahora. Menos
  alegría y más tensión y sorpresa. The familiar: solo hay una opción y
  no me gusta pero esperemos a ver ese capítulo antes de decidir. The
  library: Calm full, pero en lugar de una flauta con sonidos largos me
  gustaría un piano o similar, con algunas notas un poco más rápidas, y
  que se alterne con la celesta. The passages: esta no me gusta, quiero
  que sea algo más tétrico, con más misterio.* A theme chosen takes the
  theme's id and its candidates leave the tree. The page sounds one
  more kind of voice, `piano`: a struck tone that starts at once and
  dies away by itself, however long the note is written. Section 2.7
  gives each theme. Rules out a chosen chapter with candidates left
  beside its theme, and a held flute where the owner asked for struck
  notes.

## 2. What is asked

### 2.1 What may differ, in the child's words (D204)

Thirteen levels have ways: `eldras-door`, `left-or-right`,
`past-the-teacher`, `the-moving-key`, `by-the-statues`, `the-dark-room`,
`the-night-walk`, `the-opening-hole`, `the-wrong-door`, `the-shed`,
`the-brooms-on-the-wall`, `the-brooms-in-the-straw` and `the-check`.

For each, Gemini writes `changes` in both languages from one brief that
gives it, for every level, the level's intro and what its ways differ
in. The sentence says what may differ, in the words the level's intro
uses for those things, and nothing about how many arrangements there
are: *La llave está cada vez a una distancia distinta de la puerta.*
The designer's models for the shed's four, to be given to Gemini as
what each must say and not as its words:

- `the-shed`: how many brooms lie on the floor differs each time, and
  some are hidden in the straw.
- `the-brooms-on-the-wall`: how many brooms hang on the wall and on
  which pegs differs each time.
- `the-brooms-in-the-straw`: how many brooms lie in the straw and where
  differs each time.
- `the-check`: how many brooms hang, on which pegs, and which of them
  still have a knot differs each time.

Where a level's intro, hints or learned line already say the same thing
in other words, they stay. Where one of them says *manera* for this, or
names a way, it is written again. (No chapter text does today; the
brief asks Gemini to look.)

The words given here letter for letter, too small to brief:

| key | es | en |
| --- | --- | --- |
| `level.changes_tail` | Tu programa tiene que valer siempre. | Your program has to work every time. |
| `outcome.changed` | Esta vez era distinto. | This time it was different. |

`level.ways`, `outcome.way` and `outcome.all_ways` leave both i18n
files. `level.way_label` and `outcome.way_won` stay for `?debug`.

### 2.2 *El cobertizo*: the brooms on the floor (D205)

One idea: `find_all` gives a list, and `len` counts it. The level asks
how many brooms lie on the floor. The hung ones are seen at once and
are not asked for.

- Goals: `{"kind": "say", "count_of": "broom", "hung": false}`, whose
  words are *Di cuántas escobas hay en el suelo, con `say`.* / *Say how
  many brooms are on the floor, with `say`.*; and the bonus that uses
  `print`, as it is. `"hung": false` counts the things of the kind that
  are not hung; `true` counts the hung ones; without it every one
  counts.
- `"forbidden": {"reason": "stay_by_the_brooms", "cells": [[6, 6], [7,
  6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6]]}`, the wall's
  row. The reason's words are the owner's, letter for letter: *Para
  contar las escobas en el suelo, mejor me quedo cerca de donde están
  tiradas.* In English: *To count the brooms on the floor, I had better
  stay near where they lie.*
- `zones` holds `wall` alone, `[[6, 6, 13, 6]]`, and the hung brooms
  carry it, so that a `find_all` from the floor never gives them. The
  lying brooms carry no zone: they are found from anywhere the wizard
  may stand. The plan hatches and names zones only in a level where the
  wizard may stand in two of them, so this level's plan shows none.
- Hung, the same in every way: pegs 7, 10, 11 and 13.
- Start (9, 8), friend (10, 8), mate (8, 7), camera as they are. The
  lying brooms by way, the first of each the one at the wizard's feet:

  | way | in sight | hidden | on the floor |
  | --- | --- | --- | --- |
  | `a` | (9, 8), (7, 7), (11, 7) | (6, 8), (13, 6) | 5 |
  | `b` | (9, 8), (10, 7), (11, 8) | (7, 6), (12, 8), (5, 8) | 6 |
  | `c` | (9, 8), (11, 7) | (6, 6), (13, 8) | 4 |

- The solution:

  ```python
  brooms = wizard.find_all("broom")
  print(brooms)
  wizard.say(len(brooms))
  ```

- Wrong programs, each failing for the reason its name gives:
  `a_number_typed.py` (says 5), `the_walk_to_the_wall.py` (walks up two
  and is stopped), `the_list_said.py` (says the list and not its
  length).
- Gemini writes again, from the brief of 2.8: the intro, the starting
  code's comments, the hints, the learned line and the outro. The intro
  no longer speaks of two places: it asks how many lie on the floor,
  says that some are hidden in the straw and that the hung ones are in
  plain sight.

The lessons before it (`the-broom`, `lists`) keep their line on what is
found from the wall and what from the floor: the level needs it, since
it is why the floor's list holds no hung broom.

### 2.3 The wall's levels: from one end, by the distance (D206)

`the-brooms-on-the-wall`:

- Eight hung brooms declared, one a peg, knotted, zone `wall`; each way
  takes some away with `gone`. The pegs with a broom, by way:

  | way | pegs |
  | --- | --- |
  | `a` | 12, 10, 9, 6 |
  | `b` | 13, 11, 7 |
  | `c` | 13, 12, 9, 8, 6 |

- The two lying knotted brooms in sight, (7, 7) and (11, 7), zone
  `straw`, stay: they are for the next level.
- Zones as the straw's level has them (2.4). Start (9, 8), friend
  (8, 8), mate (10, 8). No `end`.
- Goals: `{"kind": "untied", "zone": "wall"}` and the bonus that uses
  `for`. The `reach` goal is gone.
- `api` gains `thing.distance_to`.
- The solution:

  ```python
  wizard.move_up(2)
  wizard.move_right(4)
  brooms = wizard.find_all("broom")
  for broom in brooms:
      steps = broom.distance_to(wizard)
      wizard.move_left(steps)
      broom.untie()
  ```

  From the wall's right end the list comes in the order of the walk,
  since `find_all` gives the nearest first. In ways `b` and `c` the
  first broom hangs over the end's own cell and the first move is of 0
  steps, which walks nothing and takes no tick. The left end and
  `move_right` solve it as well.
- Wrong programs, each failing for the reason its name gives:
  `a_step_for_each.py` (unties and takes one step: the pegs have gaps),
  `the_list_from_the_middle.py` (walks up two and makes the list there:
  the nearest first is then on one side and then on the other),
  `the_list_made_at_the_door.py` (the list made before the walk holds
  the floor's brooms), `the_steps_written_out.py` (the numbers of way
  `a`).
- Gemini writes again: the intro, the goals' first line if it must
  change, the starting code's comments, the three hints, the learned
  line. They say, in the level's words: the brooms hang on different
  pegs each time; go first to one end of the wall, because the list
  comes nearest first and from an end the walk goes one way only; for
  each broom, ask how far it is with `distance_to`, walk that many
  steps, untie it. `distance_to` was taught in chapter 2 (lesson
  `the-distance`); the intro or the first hint recalls it in one
  sentence.

`the-check` (the fix):

- Start (9, 8), friend (8, 8), mate (10, 8), no `end`, no lying broom.
  Eight hung brooms declared; by way, the pegs with a broom and the
  ones that still have a knot:

  | way | pegs | knotted |
  | --- | --- | --- |
  | `a` | 13, 11, 10, 8, 6 | 11, 6 |
  | `b` | 12, 11, 9, 8, 7, 6 | 12, 9, 7 |
  | `c` | 13, 12, 10, 9, 7 | 12, 10, 9 |

- Goals: `untied`, `no_error`, and the bonus that uses `knotted`. The
  `reach` goal is gone.
- The starting code is the wall's solution above, under its comment.
  It stops with an error at the first broom without a knot: the first
  broom in `a` and `c`, the second in `b`. The solution puts
  `broom.untie()` under `if broom.knotted:`.
- Wrong programs: `the_given_program.py`, `the_if_turned_round.py`,
  `the_knots_written_out.py` (the pegs of way `a`),
  `the_untie_before_the_walk.py`. `the_move_inside_the_if.py` is
  removed: with the distance asked at each turn it solves the level.
- Gemini writes again the intro (the program stops at the first broom
  without a knot, wherever it hangs), the goals, the starting code's
  comment and whatever hint names a cell or a step to the right.

The lessons `for-each` and `checking-each` show the wall's program where
they show one: Gemini writes those pages again so that their example is
the walk by distance and not a step for each broom. A lesson's page
that runs code (D170) runs the new example.

### 2.4 *Las escobas de la paja*: no cell to end on

- Zones: `wall` `[[6, 6, 13, 6]]`, `straw` `[[6, 7, 13, 8], [5, 8, 5,
  8]]`. The same two in `the-brooms-on-the-wall`.
- No `reach` goal and no `end`. Goals: `untied` and the bonus that uses
  `x`.
- Start (12, 7), friend (13, 8), mate (13, 7), as they are. The hung
  brooms are the pegs of the wall's way `a`, untied.
- The lying brooms by way. The level's program walks only left and
  down, so every way's list, in the order `find_all` gives it from the
  start, never goes right and never goes up:

  | way | in sight, knotted | hidden, knotted | in the list's order |
  | --- | --- | --- | --- |
  | `a` | (11, 7), (9, 7) | (6, 8), (5, 8) | (11, 7), (9, 7), (6, 8), (5, 8) |
  | `b` | (10, 8), (8, 8) | (12, 8), (6, 8) | (12, 8), (10, 8), (8, 8), (6, 8) |
  | `c` | (10, 7), (9, 8), (8, 8), (7, 8) | (5, 8) | (10, 7), (9, 8), (8, 8), (7, 8), (5, 8) |

  A content test asserts that order and that property for each way.
- The solution is the one it has. The wrong program that writes one
  way's numbers is of way `a`; the other two stay if they still fail,
  and are written again for the reason in their name if they do not.
- Gemini writes again the goals' lines and whatever line of the intro,
  the hints or the learned line names the cell (6, 8).

### 2.5 The shed's cells and picture (D202, D207)

What the owner saw, cell by cell, read on the painting with its grid
(`art/raw/game-broom-shed/game-broom-shed-pegs.png`; the barrel is
painted on x 5.85 to 6.8, y 5.2 to 6.35; the bench on x 4.45 to 5.75,
its legs down to y 8.4; the standing bales' left edge on x 13.75; the
back wall's foot on y 5.55 to 5.65; the front wall's top from y 8.73):

1. **The straw cells**: `scene.json`'s `straw` (D202), (5, 8) made floor
   in `map.txt`, the levels' and stories' brooms as 2.2 to 2.4 and the
   test.
2. **The brooms by the bales**: `shifted` (D207), cells (13, 6) and
   (13, 8), by -0.3, so that a lying broom's sprite ends left of the
   bales. If on the sheet a broom still touches a bale, the shift grows
   by steps of 0.05 until it does not, and the commit says the number.
   (The owner wrote *las que están en la columna 6*; the bales stand by
   column 13, and a broom on column 6 moved left would go under the
   barrel and the bench. The report says this to the owner.)
3. **The barrel over the broom of peg 6**: the barrel is a thing of the
   scene, cut from the painting by a traced outline (D128,
   `tools/art/trace.py`), static, on row 5, drawn after the hung brooms
   of its row and before every figure of row 6. A broom hung on peg 6
   shows its cord and its handle over the barrel's top, and its brush
   is behind the barrel. (The owner gave two ways, behind the barrel or
   hung higher; D195 keeps a hung broom on its peg, so it is behind.)
4. **The figure on (6, 6)**: `nudged` by 0.45, so that it stands beside
   the barrel, almost on the next cell (D105). The broom of peg 6 is
   untied from (6, 6) as before.
5. **The figures of row 6**: cells (6, 6) to (13, 6) `lowered` by 0.2
   (D149), so that no hat's tip touches the back wall's foot. If one
   still does on the sheet, by 0.3.
6. **The figures of row 8 and the front wall**: the owner sees figures
   of the lowest row in front of the front wall, where they should be
   behind it. The wall's top is cut `over` them, but a figure's feet
   end on the wall's upper outline, so the figure seems to stand on the
   wall. Cells (5, 8) to (13, 8) are `lowered` by 0.2, so that the
   wall's top hides the shoes and the hem. A lying broom or a mark on
   those cells stays where it is. The masks of the front wall and of the
   door's beam are checked against the painting on the masks' sheet,
   pixel for pixel on their outlines, and traced again where they do
   not follow it.
7. **The test**: in the browser, for every walked cell of rows 8, 9 and
   10 of the shed and for a walk between each pair of neighbours among
   them, no pixel of a figure is drawn over a pixel the front wall or
   the beam paints. For row 6, no pixel of a figure standing on a cell
   lies above the back wall's foot. For (6, 6), no pixel of the figure
   lies over the barrel's mask. For each straw cell, no pixel of a
   lying broom lies over the barrel, the bales or the bench.

Where a number given here does not reach what its sentence asks, the
sentence rules, the number moves by steps of 0.05 and the commit says
it.

### 2.6 The review's sheets (D208)

For each scene of chapter 4 (`the-broom-shed`, `the-lake-edge`,
`the-ring-field`, `the-race-course`), `tools/art/sweep.py` writes:

- **Cells**: the picture as the game draws it, masks applied, with the
  grid and the numbers (D208); every cell a figure walks or flies over
  tinted; a figure standing on each of them where the game draws it,
  nudge and lowering applied. Two sheets, even rows and odd rows, so
  that every figure is seen whole.
- **Masks**: the picture with the grid and the numbers, every mask
  tinted and outlined, with its thing's id, its row and whether it is
  `under` or `over`.
- For the shed, **things**: a lying broom on each of the seven straw
  cells, the straw cells outlined, a hung broom on each of the eight
  pegs, a figure on each cell of row 6 and of row 8.

At least 64 pixels a cell. A scene wider than 40 cells is written in
parts that share two columns. The sheets go to
`drafts/hojas-capitulo-4-<date>/`, with `drafts/hojas-capitulo-4-<date>.es.md`,
a page in Spanish for the owner that shows each sheet under one or two
sentences of what to look at in it, one idea a sentence.
The walkthrough of chapter 4 is written again beside it.

### 2.7 The music (D209)

- `arrival`: `arrival-lively.json` becomes `arrival.json`, with the
  theme's id. `arrival-even.json`, `arrival-calm.json` and the theme
  that was there leave.
- `the-library`: from `the-library-calm.json`, which becomes
  `the-library.json`. The flute's voice becomes a `piano`, and its long
  notes become phrases with some quicker notes in them: runs of three
  or four eighth notes inside the calm pace, never a held note longer
  than a bar. The piano and the celesta take turns: a phrase of one,
  then the other's answer, never both on the melody at once. The other
  two candidates and the theme that was there leave.
- `the-broom`: written again from `the-broom-lively.json`. What makes
  it sound of the country goes: the lilt in three, the dotted turns,
  the drone of a fifth, the pentatonic tune on a flute. It is in a
  minor mode, in four, fast (150 to 170 beats a minute), over a low
  voice that never stops running in eighth notes, with the drum on
  every beat and a push off the beat. The tune is of short cells that
  climb by step and break off; every few bars something unexpected
  happens: a bar of silence in the tune over the running low voice, a
  leap of register, a raised seventh that does not resolve at once.
  It ends its loop in the air, not on a rest. Two are written, for the
  owner's ear: `the-broom.json`, the one the game plays, and
  `the-broom-b.json`, which differs in its tune and in what surprises.
  The three candidates that were there leave.
- `the-passages`: written new, eerie, with mystery. Slow, low, with
  much silence: a low pad that barely moves, a mode with a lowered
  second or a tritone held against the pad, single notes of celesta or
  harp far apart that die away, a repeated note that fades like an
  echo, a low drum now and then like a far door. No tune one could
  whistle. Two are written: `the-passages.json` and
  `the-passages-b.json`, the second with less in it. The three
  candidates and the theme that were there leave.
- `the-familiar` stays as it is until its chapter is seen.
- The mixer on `?debug#music` lists the themes and the two `-b`
  candidates. `content/music/README.md`, D192 and D203 say the tree as
  it is. The tests of the music count what is there.

The owner's ear is the test of these. The report tells them to restart
their dev server and open `https://localhost:5173/?debug#music`.

### 2.8 The texts (Gemini)

One brief for the shed (levels `the-shed`, `the-brooms-on-the-wall`,
`the-brooms-in-the-straw`, `the-check`, lessons `for-each` and
`checking-each`), with the bible, the course, the chapter's texts as
they are, the owner's four comments whole, sections 2.2 to 2.4 of this
plan, and the rules: no *manera*; what changes each time is said in the
level's own words; metaphors only where an idea is first explained; an
idea is taught only where it is needed; no cell is named for the child
to walk to. One brief for the thirteen `changes` (2.1). The programmer
reads the drafts, corrects them and says in the commit what was
corrected. The words this plan gives letter for letter are not sent to
Gemini.

## 3. The pieces

### 3.1 What may differ (D204)

- **World**: `text.<lang>.json` takes `changes` and no `ways`; the
  content's check refuses a level with ways and no `changes`, and one
  with `ways` names.
- **Page**: the start card (`ui/cards.ts`), the level's bar
  (`ui/level.ts`), the controller's shown way and the outcome's words
  (`ui/controller.ts`, `ui/outcome.ts`) as D204 says; the select only
  under `?debug`.
- **Content**: thirteen `changes` in each language, the ways' names
  removed, the i18n keys of 2.1.
- **Tools**: the walkthrough and the course book head a way with its
  id and carry the one sentence of D204.
- **Documents**: D51 and D204 in `docs/dev/architecture.md`, the
  content's README where it describes `text.<lang>.json`.
- **Tests**: units for the card with and without `changes`, for
  `outcome.changed` (said when the way changes, not said when it does
  not, not said on a won run), for the select absent outside `?debug`;
  the browser specs that chose a way choose it under `?debug`; a
  content test that no text of `content/` and no value of the i18n
  files outside `level.way_label` and `outcome.way_won` says *manera*
  or *way* for this (the test lists the innocent uses it lets through,
  such as *de la misma manera*).
- **Check**: `ci/check.sh`, the specs touched.

### 3.2 A level's forbidden cells and the floor's count (D205, 2.2)

- **World**: `forbidden` in `level.json`, merged with the scene's; the
  `say` goal's `hung`.
- **Page**: the plan hatches zones only where the wizard may stand in
  two.
- **Content**: `the-shed` whole as 2.2; its texts from the shed's
  brief; the reason's words in both i18n files.
- **Documents**: D205, D84's and D196's entries, the level format.
- **Tests**: the world's units for a level's forbidden cells (form,
  both reasons, a cell named twice refused) and for `hung`; the level's
  solution and wrong programs in every way; a browser spec that walks
  up in *El cobertizo* and reads the owner's words in the bubble.

### 3.3 The walks by distance (D206, 2.3, 2.4)

- **World**: the distance to a hung thing and the order of the found.
- **Content**: `the-brooms-on-the-wall`, `the-check` and
  `the-brooms-in-the-straw` as 2.3 and 2.4, with their texts and the
  two lessons' pages.
- **Documents**: D206, D195's and D184's entries, the grimoire's line
  on `distance_to` if it says how a hung thing counts.
- **Tests**: units for the distance and the order with hung things;
  each level's solution and wrong programs in every way; the straw's
  order test; the browser specs of these levels.

### 3.4 The shed's cells and picture (D202, D207, 2.5)

- **World**: the scene's `straw`, read by the content's tests; (5, 8)
  floor.
- **Art tools**: `shifted` in the settings and the export; the barrel
  traced; `nudged` and `lowered` as 2.5; the sweep knows the shift.
- **Page**: a sprite's shift; the barrel's place in the order of
  drawing.
- **Documents**: D202 rewritten, D207, the scene's README or `about`
  lines, D195's sentence on the broom of peg 6.
- **Tests**: 2.5's seventh point; the content test of D202 on every
  level, way and story step; the settings' refusal of a long shift.

### 3.5 The sheets (D208, 2.6)

- **Art tools**: the three kinds of sheet from `sweep.py`.
- **Page**: the numbers' layer draws the cells' borders.
- **Tests**: a unit that a sheet's grid lines fall on the cells'
  borders and that each number lies inside its cell; the debug spec
  for the layer.

### 3.6 The music (D209, 2.7)

- **Page**: the `piano` kind in `engine/music.ts`.
- **Tools**: `tools/sound/compose.py` where it writes or checks
  themes.
- **Content**: the themes as 2.7.
- **Documents**: `content/music/README.md`, D192, D203, D209.
- **Tests**: `tests/project/test_music.py` and `app/e2e/music.spec.ts`
  on the tree as it is; a unit that a `piano` note's sound ends by
  itself.

### 3.7 The whole check, the walkthrough, the sheets and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4, as
it names sprint 41's. The whole `ci/check.sh --e2e`, in a copy, with
Playwright's own server on 4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough, `recorrido-capitulo-4-<date>.es.md`, with
  every way of every level under its id;
- the sheets of 2.6 and their page;
- the report in Spanish: what was built piece by piece, every choice
  the plan left and how it was taken, every number of 2.5 that moved,
  what Gemini's drafts needed corrected, and what the owner must do to
  hear the music.

## 4. Gemini images

None. The barrel's mask is traced from the painting. Chapter 4 stands
at 29 of its 50.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux. Read
first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-42.md (this plan, whole), docs/dev/sprint-41.md (what
you built last), drafts/recorrido-capitulo-4-2026-11-12-2.es-comments.md
(the owner's four comments, marked in the walkthrough's text), and the
memory notes kydux-two-agents, kydux-sprint-41-state,
kydux-designer-review-41, kydux-designer-music-candidates,
kydux-designer-sprint-42-plan and kydux-checks-per-piece. The designer's
commits after yours (6846085 to the plan's own) fixed the walkthrough's
won pictures and the race's won card, made the pad low and unbroken,
added the mixer on ?debug#music and wrote twelve candidate themes: read
them with git log -p 6846085..HEAD before you start. Build sprint 42
whole: pieces 3.1 to 3.7 in order, one local commit each; before each
commit ci/check.sh and the browser specs the piece touches green, and
the whole ci/check.sh --e2e once before the last commit, in a copy with
Playwright's own server on 4173; never a push, never a timer, never a
deploy: the owner is away and nothing is released until they are happy
with chapter 4. Never stop or build into the servers on ports 443 and
5173, and stop your own preview when you are done. Gemini paints
nothing. Gemini writes the texts of section 2.8 from two briefs; you
read and correct the drafts and say in the commit what you corrected.
The words the plan gives letter for letter (the owner's sentence for
the wall in El cobertizo, the goal's line, the two i18n lines) are kept
as they are. No text the child reads says "manera" or "way" for the
arrangements of a level: that is the first thing the owner will look
for. The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. Where a number
of section 2.5 does not reach what its sentence asks, the sentence
rules. The owner reads nothing before you build: they read chapter 4's
walkthrough and the contact sheets once the designer's review of this
sprint finds nothing. Every document and comment in the present. Before
git add, read git diff of each file and stage only your own hunks;
commit promptly. Hand over the walkthrough, the sheets with their page
and a report in Spanish as 3.7 asks, and end with the prompt for the
designer's review in English, in a code block.
```
