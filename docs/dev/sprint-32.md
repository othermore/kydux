# Sprint 32 — Chapter 3 consistent: Gemini paints every state, the difference cuts every mask, the cells follow the figures

The owner read the whole of chapter 3 in the second walkthrough
(`drafts/recorrido-capitulo-3-2026-11-07-2.es-con-comentarios.md`, 28
comments) and found three things wrong across the chapter: where the cells
are and where the figures stand (figures against walls, a corridor of two
columns walked down one nudged column, cells that do not match the plan),
the plan not matching the scene, and, above all, the doors and the masks:
open doors built by a tool look pasted, masks traced by eye hide a figure
where nothing stands. The owner's rule for this sprint and from now on:
**Gemini makes the pictures, so that every state of a scene is consistent
with the others; nothing is painted, moved or pasted by a tool.** This
sprint sets the method (section 1), rebuilds chapter 3's seven scenes with
it (section 4), moves the cells to where the figures walk (section 3), and
answers the rest of the comments (section 2).

The pieces, in this order: 32.1 to 32.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; Gemini writes every text
the child reads from a brief, the owner's own words fixed; documents and
comments in the present; no content edited while a browser run is going.
Section 5 is the Gemini budget, which goes past the chapter's seventy with
the owner's yes (the ceiling is 100, 2026-11-08); section 6 the owner's acceptance test; section 7 the
hand-over; section 8 the prompt.

## 1. Decisions taken here

- **D148 — Every state of a scene is painted by Gemini from one base, and
  every cut-out is the difference between two of its pictures.** Decided
  2026-11-08 by the owner (*no debemos pintar ni reconstruir escenarios;
  Gemini hace las imágenes, así son consistentes*). A scene's base is its
  painting with nothing in it that comes and goes: no door leaf (each
  doorway open, the floor beyond continuing through it), no key, no hole.
  Every other state is an edit of the base asked of the model: the door
  closed, the door open (its leaf swung into the room on its hinge, in the
  same view), a statue, a torch, the arch's band drawn over an opening. A
  cut-out is where that picture differs from the base (`trace.py diff`:
  the difference thresholded, cleaned of specks, closed over holes, kept
  within the thing's box), so that a mask fits the painted thing to the
  pixel: a leaf, a statue between its staff and its head, a torch, a jamb.
  The ground the game draws is the base; what stands or lies in the scene is
  a cut-out over it at its row; what a figure walks behind is a cut-out
  `over` it. A try whose edit changed what it should not (the difference
  leaks beyond the thing's box by more than a fringe) is asked again, three
  tries at most. Rules out `door.py`'s open leaf, `repaint.py spaced`,
  `tiled`, `placed` and `fill` on a scene the child sees, and a polygon
  traced by eye where a difference can be had. (`trace.py footprint`, which
  cuts a doorway by difference, is the seed of this rule.)
- **D149 — The cells are where the figures walk.** Decided 2026-11-08 by
  the owner. (a) A corridor two cells wide has both columns walkable, each
  figure drawn in its own column; there is no nudge of a whole column.
  (b) Only on the cells of a door or an arch and the cell before and after
  them, both columns are drawn nudged toward the opening's middle, by 0.2
  cell each, so that a figure passes clear of the jambs and the two columns
  stay apart. (c) The floor row right under a wall's foot is drawn 0.3 cell
  lower, so that a figure on it stands in the corridor and not on the wall.
  (d) The row at the bottom of a corridor where the lower wall's face is
  painted is walkable, with the wall's face cut `over` the figures on it,
  so that a figure there stands behind the wall's top. (e) A level starts a
  cell past an arch, never in it or on the cell beside its jamb. (f) The
  plan draws every figure and mark at the same nudged place, and behind the
  same cut-outs, as the scene (D151). Rules out a column nudged whole to a
  corridor's middle, and a figure whose head lies on the wall above it.
- **D150 — A door is as wide as the cells its leaf closes.** Decided
  2026-11-08. A door's `cells` in `scene.json` lists the one or two cells of
  its doorway; shut, it blocks them all; open, it frees them all and its
  leaf covers what `covers` says (D125); `open()` is asked from any cell
  before or after them; `at` names the first. The plan and the level's
  things draw one door. Rules out a doorway two cells wide with one of them
  a wall.
- **D151 — The plan draws what the scene draws.** Decided 2026-11-08 by the
  owner. The plan (D143) draws the figures at their nudged places and behind
  the same cut-outs as the scene, inked with the ground (Dask under the
  arch he stands in, a figure behind a statue), every reach mark with its
  cell written beside it, `(15, 3)`, as a figure's name is, and the grid as
  ink lines on every floor cell's edges, fainter over the walls, so that a
  child counts cells on the plan without numbers in them. Rules out a plan
  where the grid is read only from the numbers at its edges.
- **D152 — The dark tunnel's level starts where the child cannot know.**
  Decided 2026-11-08 by the owner. *El túnel oscuro* starts at (14, 2), a
  cell the child has not seen, not where *El pasillo de las puertas* ended;
  its goal names no cell: the exit is found on the plan, so the level is
  played by opening the map (in the lesson's block or in the program) and
  looking at the wizard's position. Rules out a start the child remembers
  from the level before.
- **D153 — The dark room teaches the two numbers of a position.** Decided
  2026-11-08 by the owner. A position's two numbers are its attributes
  `x` and `y` (`key.position.x`); the steps between two cells are the
  difference of their `x` and of their `y`, kept in two variables; a new
  lesson *Las dos coordenadas* (`lesson:the-two-coordinates`) before *La
  sala oscura* recalls the system of coordinates and teaches it; the level
  is played in three ways with the key on three cells, always right of and
  not above the wizard, so that the differences are never below zero, and
  the walk to the door is counted the same way. Rules out a key whose cell
  the child reads off the plan and types.

## 2. The owner's comments, and what answers each

| # | Where | The owner (summary) | Piece |
| --- | --- | --- | --- |
| 1 | P1 card | The map must say that the mouth is (15, 3): the grid is not seen on the plan, only the edge numbers. | 32.5 (D151) |
| 2 | P2 card | Start elsewhere than P1's end; the text: *Y por algún motivo, ni siquiera el mapa nos muestra lo que hay dentro del túnel. Pero sí que vemos la salida del túnel (busca la posición en el mapa). ¡Podemos mirar dónde está la maga, contar los pasos y caminar a ciegas!* | 32.3, 32.6 (D152) |
| 3 | P2 route | The spell must be cast at some point to see the exit. | 32.3 (D152) |
| 4 | P3 tick 2 | The wizard's row is against the wall: not walkable, or drawn lower; the first cell drawn right of the jamb. | 32.4 (D149 c, e) |
| 5 | P3 plan | The same on the plan; Dask under the arch, not over it: the same masks as the scene. | 32.5 (D151) |
| 6 | P4 tick 8 | The arch and the walls bottom right look wrong; the left arch opens on another floor and the rooms' wall is missing. | 32.4 (the crossing painted again) |
| 7, 8 | P5 doors | The open door flattened, its floor unlike the floor outside, the arch's line visible. Ask Gemini for the rooms without door, closed and open, and cut. | 32.4 (D148) |
| 9 | F1 card | *Las ramas al revés*: a child does not know branches. | 32.6 |
| 10 | I1 tick 2 | The open door: black lines on the floor and frame, a shadow under the arch that should go. | 32.4 (D148) |
| 11 | I1 plan | Two cells on the door, the wizard walks between them; the mark to one side. | 32.3, 32.5 (D149, D150) |
| 12 | S2 step 2 | The three start one cell lower, past the arch; the wizard between two cells. | 32.3 (D149 a, e) |
| 13 | Lesson *Mientras* | A print inside the loop and one after it. | 32.6 |
| 14 | P6 plan | Two columns on the plan, the wizard in the middle on the scene. | 32.3 (D149 a) |
| 15 | P7 tick 0 | Friends against the wall: that row not walkable, the row below walkable behind the wall. | 32.3 (D149 c, d) |
| 16 | P8 tick 0 | The same. | 32.3 |
| 17 | P8 won | Teach the difference of the key's position and ours, the key on another cell each time; recall coordinates; two variables; values never negative. | 32.3, 32.6 (D153) |
| 18 | S3 step 3 | The storeroom's open door the same; use Gemini. | 32.4 (D148) |
| 19 | P9 tick 11 | The wizard walks the middle, the cells one side; the plan does not match. | 32.3 (D149) |
| 20 | P9 tick 23 | The way down's open door the same. | 32.4 |
| 21 | P9 won | The hole covers the torch: the torch's mask. | 32.4 (D148) |
| 22 | Tunnel states | The closed doors' masks leave frame and miss the line. | 32.4 (D148) |
| 23 | Crossing contact | Top row drawn lower; the wall row walkable behind the wall; column 8 a little left; (14, 13) to (15, 14) walkable; the arches' masks at them and at (9, 12) wrong; the statues' masks cover between staff and head. | 32.3, 32.4 |
| 24 | Two doors contact | Two columns through each door, both nudged toward its middle, distinct. | 32.3 (D149 b, D150) |
| 25 | Three doors contact | The same; the nudge only round the door, not the whole column. | 32.3 |
| 26 | Long round contact | The same, round the arches. | 32.3 |
| 27 | Storeroom contact | Row 6 not walkable, row 8 walkable behind the wall; (8, 12) and (11, 12) not walkable; columns 9 and 10 both nudged toward the door. | 32.3 |
| 28 | Way down contact | Columns 9 and 10 in their places, both nudged toward the doors. | 32.3 |

Open from before: P7's third way of period 5 (the owner), the long bubble
of S1's step 4 (32.5 makes a speaker's bubble narrow when it would cover
another figure: the bubble is at most a third of the scene's width).

## 3. The cells and the levels

The cells named are read from each base painting with
`map_from_image.py grid`; where the painting puts a wall a cell off, the
level keeps its shape and the commit says what moved. For every scene:
the row under a wall's foot drawn 0.3 lower (D149 c); the lower wall's
face row walkable with the face `over` (D149 d); no column nudge; the
nudges of D149 b on the cells of each door and arch and the cell before and
after.

**`the-tunnel`.** The corridor is rows 11 and 12; row 13, where the lower
wall's face is painted, walkable behind it; row 11 drawn lower. P1 as it
is, its start (1, 12). P2 starts at (14, 2), the friend at (15, 2) and the
mate at (15, 3), none drawn; goal `reach` (19, 1) hidden, its text *Sal
por la salida del túnel: búscala en el mapa*; solution
`print(wizard.position)`, `wizard.move_up()`, `wizard.move_right(5)`; the
level's `spells` keep `orvim` and its starting code's first comment says to
open the map and look for the exit; a browser test opens the plan in it.

**`the-crossing`** (painted again, 32.4): the gallery three rows high
(rows 5 to 7 as the painting gives them), the statues along its middle
row, the lower wall's face row walkable behind it, the top row drawn
lower; Dask's corridor columns 8 and 9 both walkable, column 8 drawn 0.2
left where the owner asks (the cells beside the torches); the statue
corridor columns 14 to 16 down to its arch, (14, 13) to (15, 14) walkable
under the arch's band. P3 and P4 keep their shapes (4.2 and 4.3 of
`sprint-31.md`): P3 starts on the cell past the arch (D149 e), waits two
ticks and walks to the cell left of the first statue; P4 one `if`, Dask
between the first two statues looking up or down, the mark at the mouth of
the statue corridor; their tick tables re-derived from the cells read and
held by the tests.

**`the-two-doors`.** Each door two cells wide (D150): `left_door` and
`right_door` with their `cells` read from the painting, the doorway's two
columns walkable below them, nudged toward the door's middle on the door's
cells and the cell before and after; the corridor row 10 and the wall's
face row below it. P5 and F1: the same programs with the counts the cells
give.

**`the-three-doors`.** Both columns 9 and 10 walkable the whole corridor;
each door's `cells` the two; the nudge round each door only; the mark at
the top arch on the column the wizard walks. I1's program unchanged.

**`the-long-round`.** Both columns 9 and 10 walkable; the nudge round the
two arches; S2's three and P6's start one row lower, past the arch: the
wizard at (10, 2), the friend at (9, 2), the mate at (9, 3); P6's walk down
4 before the crossing and its tick table one tick earlier (the step onto
(10, 7) at tick 5 + n; the test of fixed waits holds as before, since the
three safe windows still share no tick).

**`the-storeroom`.** The corridor's row 6 not walkable, row 7 as it is,
row 8 walkable behind the lower wall's face; (8, 12) and (11, 12) walls;
columns 9 and 10 both walkable through the door, nudged toward it on its
cells and the cell before and after; `store_door` two cells wide if the
painting's door is. P7: start (0, 7), the friend at (0, 8), the mate at
(1, 8). P8 (D153): start (5, 7), the friend at (5, 8), the mate at (4, 8);
three ways, the key at (9, 7) (`same_row`), (8, 8) (`lower`) and (10, 8)
(`farther`); goals `collect` key, `open` store_door, `reach` E at (10, 9),
bonus `uses` `x` (the position's attribute); the solution:

```python
wizard.cast("kirra")
key = wizard.find_nearest("key")
right = key.position.x - wizard.position.x
down = key.position.y - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
wizard.pick_up()
right = store_door.position.x - wizard.position.x
down = store_door.position.y - 1 - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
store_door.open()
```

A move of zero steps walks nothing (D133), so `same_row` wins with
`down = 0`. Wrong: the counts typed for one way (fails the others), no
`kirra` (the error explained), `x` and `y` swapped (walks into the crates),
the door opened from the key's cell (`far`). A unit test plays the solution
in the three ways and the wrong ones.

**`the-way-down`.** Columns 9 and 10 both walkable, nudged toward the
double door on its cells and the cell before and after; the door's `cells`
both; the torch at the hole's side cut `over` the hole (D148). P9's program
as it is, its counts from the cells.

## 4. The seven scenes, by D148

For each scene, in `art/raw/<scene>/` and `art/scenes/<scene>/cut.json`:

1. **The base.** Where the scene has doors that open, a key or a hole, one
   edit of the sprint-30 painting (the `nogrid` picture with its voids
   mended, before any `spaced`): *every door's leaf removed, the doorway
   open and the floor beyond seen through it, everything else exactly as
   it is* (`<scene>-base.md`). The tunnel's two doors never open and need no
   base: their leaves are cut by difference against a base all the same
   (one edit), so that their masks fit the line. The crossing's base is a
   new painting (below).
2. **The states.** One edit of the base a state: each door open
   (`<scene>-<door>-open.md`: *the same door, its leaf swung open into the
   room on its left jamb, a quarter turn, seen in the same view, nothing
   else changed*); the door closed is the sprint-30 painting itself where
   the base was made from it. The leaf of each state = the difference
   against the base, within the door's box; the open leaf's shadow comes
   with it.
3. **The cut-outs a figure walks behind.** For each: an edit of the base
   with the thing gone (*the statues removed, the floor and wall behind them
   continued*; *the arch's opening painted as plain floor through it*; *the
   torch removed*), one edit a scene for all its statues, one for all its
   arches, one for the torch; the cut-out = the difference, `over` on the
   thing's row. The lower wall's face bands (D149 d) are traced on their two
   outlines (`trace.py`), not by difference, since a wall cannot be removed.
4. **Export, sweep, sheets.** `export_scene.py`, the sweep green on every
   walkable cell, `all-`, `sweep-`, `doors-` and `states-` sheets looked at:
   a leaf whole and the same door open as shut, a doorway showing the floor
   beyond, no line of the shut door left on an open one, no figure hidden
   where nothing stands.

**The crossing.** Painted again by Gemini as a place (D136), from
`scene-tunnel-exit.md` with the gallery three cells high and the three
statues standing along its middle row with floor behind and before them,
the tunnel's arch at the left edge, the corridor Dask walks crossing it
from arch to arch, the corridor of three cells going down beside the
statues to an arch at the bottom; up to three tries, the one chosen whose
cells read as section 3 says; then its base, states and cut-outs as above.
`repaint.py spaced` is not used; its `third_row` section and the
tool-made ground go.

What `door.py`, `spaced`, `tiled`, `placed` and `fill` made stays in
`art/raw/` as record and is used by no scene of chapter 3; the tools stay
for the sheets and for chapter 2, which the owner has accepted.

## 5. The pieces

### 32.1 The world and the tools

- `trace.py diff <scene> <thing> <picture>`: the thing's mask as the
  difference of `picture` against the base (threshold, specks, holes, the
  box), written to the thing's state; `export_scene.py` takes it (D148).
- A door's `cells` (D150) in `level.py`, `things.py` and `world.py`:
  shut blocks them all, open frees them, `open()` from any cell adjacent to
  any of them, `covers` as before; the loader refuses a door whose cells
  are not adjacent or not floor; the scenes' `things` give them.
- `Position`'s `x` and `y` for the child (D153): `position.x` and
  `position.y` in the API table, the notebook's words and the course's
  vocabulary; a test that `key.position.x` is the first number.
- `art.json`'s nudges per cell as they are; `scene_settings` refuses a
  nudge over a whole column or row (D149 a); a `lowered` row list for
  D149 c.
- Check: `world/tests`, `tests/tools`.

### 32.2 The crossing painted again

The new painting of the crossing (section 4), its base, states and
cut-outs, its map and the two levels' cells; P3's and P4's tick tables in
`test_passages.py` from the cells read. Images: 3 tries + base 1 + statues
1 + arches 1 = 6 (+2).

### 32.3 The cells of the seven scenes and the levels

`map.txt`, `scene.json` (doors' `cells`), `art.json` (nudges by D149 b,
`lowered` rows, the wall-face rows `over`), every level's start, actors
and counts as section 3; P2 by D152; P8 by D153 with the new lesson's
`lesson.json`; S2's and P6's start; `test_passages.py` for every level
whose cells moved. Images: none.

### 32.4 The six other scenes by D148

The tunnel (base for the doors' masks: 1), the two doors (base 1, open 2,
arch 1), the three doors (base 1, open 3, arch 1), the long round (arches
1), the storeroom (base 1, open 1, arches 1), the way down (base 1, open 1,
arches 1, torch 1): 18 images (+6). Every door's leaf by difference, every
arch and statue `over` by difference, the sweep green, the sheets looked at.

### 32.5 The plan and the page

- `plan.ts` by D151: nudged places, the same cut-outs, the mark's cell
  label, the grid in ink on the floor cells.
- The bubble of a speaker is at most a third of the scene's width, taller
  as it needs, so that it covers no other figure (S1 step 4); a Vitest test.
- The browser tests: P2 opens the plan and prints its cell from (14, 2);
  P8's three ways; the doors' two cells in the three doors.

### 32.6 The texts

Brief `chapter-3-cells-and-coordinates.md`: the new lesson
*Las dos coordenadas* (recall x and y from *Las casillas*; `position.x`
and `position.y` are the two numbers; the steps from one cell to another
are `b.x - a.x` to the right and `b.y - a.y` down; two variables; a block
that prints both for the key); P2's intro (the owner's text in section 2,
#2) and its goal; P8's words (the key is in another place each night;
count the steps with the two numbers); F1's intro without *ramas* (*he
puesto las líneas del `if` donde iban las del `else`*); the lesson
*Mientras*'s block, the owner's: inside the loop
`print("Dask mira hacia", dask.facing, "así que espero")`, after it
`print("Hemos salido del bucle porque Dask mira hacia", dask.facing)`;
every text whose counts changed with the cells. The course book regenerated
and read whole in Spanish.

### 32.7 The walkthrough and the tests

`npm run walkthrough -- 03-passages` to a new document for the owner;
`ci/check.sh --e2e` green.

### 32.8 Documents

`architecture.md`: D148 to D153; D143 points to D151, D144 and D109 say
where D148 and D149 take over; the module map and the tools' line.
`art/README.md`: *How a scene's states are made* rewritten to D148 and
D149 (the base, the edits, the difference, the rows). `course.md`: the
lesson and the count. `plan.md` 5.5. The report in Spanish and the prompt
for the review, as section 7.

## 6. Gemini images

Fifty-two of the chapter's seventy are spent. This sprint asks **24**
images (section 5: 6 + 18) and allows 8 retries: **32 at most, to 84 of
the chapter's ceiling of 100**, which the owner set on 2026-11-08. Each image is named in its commit; at the ceiling the
implementer stops and says so.

## 7. What the owner tries

In the new walkthrough document and in the game:

1. Every door of the chapter closed and open: the same door, its leaf
   whole, the floor beyond through the doorway, no line of the shut door
   left, the arch's shadow gone when open.
2. The crossing: the gallery three cells high, the statues along its middle,
   the walls of the rooms below as a painting; a figure behind a statue
   hidden only by the statue.
3. Every corridor of two columns walked down either column, both nudged
   toward a door only at the door; no figure with its head on a wall; a
   figure on the lower wall's row behind the wall.
4. The plan: the figures and the mark where the scene has them, Dask under
   the arch, the mark with its cell, the grid visible on the floor.
5. *El túnel oscuro* from a cell the child cannot know; the exit found on
   the plan.
6. *Las dos coordenadas* and *La sala oscura* in three ways, the key never
   on the same cell, the steps computed.
7. S2 past the arch; the bubble of S1's step 4 narrow.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-32.md (this plan, whole), docs/dev/sprint-31.md and
sprint-30.md (how chapter 3 was built), the owner's comments in
drafts/recorrido-capitulo-3-2026-11-07-2.es-con-comentarios.md (under
each picture, in Spanish: the sprint answers them), docs/dev/course.md,
art/README.md whole, D85, D105, D109, D113 to D118, D125, D133 to D153
in docs/dev/architecture.md with its API, goal and events tables,
tools/write/README.md and rules.md, and the memory
notes kydux-two-agents, kydux-sprint-31-state, kydux-designer-review-31,
kydux-metaphors-once, kydux-painted-scene-learnings and
kydux-chapter-design-learnings. Build sprint 32 whole: pieces 32.1 to
32.8 in order, one local commit each, ci/check.sh --e2e green before
each, never a push, never a timer (the owner pushes with ci/push.sh).
Never stop or build into the servers on ports 443 and 5173, and never
kill a vite, node or nginx process of the owner's (CLAUDE.md); your own
preview on 4174 is stopped when you are done. The owner's rule of this
sprint: Gemini paints every state of a scene from one base and every
mask is the difference between two of its pictures (D148); no tool
paints, moves or pastes anything the child sees. Gemini paints at most
32 images in this sprint, each named in its commit, within the
chapter's ceiling of 100, which the owner set on 2026-11-08; at 32 you
stop and say so. Every text the child reads comes from
the brief the plan names, the owner's own words word for word; you read
and correct every draft before it enters content/. The plan decides
everything; where it does not, take the smallest choice that keeps its
intent and say it in the commit; a choice that changes what the owner
sees is asked first, through the owner. Every document and comment in
the present. Before git add, read git diff of each file and stage only
your own hunks; commit promptly. Hand over as section 7 asks: a report
in Spanish with only pictures of the final commit (every door closed and
open, the crossing, the plan of three scenes, a contact sheet), the
commits, the differences from the plan with their reasons, the images
spent against 100, the walkthrough document's path, what is left open,
and end with the prompt for the designer's review in English, in a code
block.
```
