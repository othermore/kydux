# Sprint 30 — Chapter 3: the passages, on seven small scenes

The owner's design of chapter 3 (2026-11-05, `drafts/chapter-3/capitulo-3.md`,
in Spanish, with its images in `drafts/chapter-3/escenas/`) shapes this
sprint. The chapter is built whole, as chapter 2 was in sprint 15: its
scenes cut and exported, its world features, its levels and stories
placed, its texts from Gemini, its tests, its documents. The owner's
decisions of the day, which the design document's section 6 asked for:
the set of scenes stands and is mended rather than painted again; the fix
level stays; the three doors are the loop's level; the naughty child's map
is a window with the scene's plan, opened by `orvim`, which pauses the run
until the window is closed; *True or false* has no level of its own.

The pieces, in this order: 30.1 to 30.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer (the owner pushes with `ci/push.sh`);
every word for the player through `t()` or a content file, in English and
Spanish; nothing forbidden and nothing secret; documents and comments in
the present (CLAUDE.md); Gemini writes every text the child reads from a
brief, and the implementer reads and corrects the draft; a chosen painting
is mended in boxes, never painted again (D88); no content is edited while
a browser run is going. The design document is the truth for what the
chapter tells and teaches; this document says how it is built and, where
the two differ (section 2), this one wins and the difference is said in
the commit. Section 5 is the Gemini budget, section 6 the owner's
acceptance test, section 7 the hand-over, section 8 the prompt.

## 1. Decisions taken here

- **D134 — The naughty child's map is a window with the scene's plan,
  and `orvim` opens it and pauses the run.** Decided 2026-11-05 by the
  owner; supersedes the overlay of D112, whose teaching order stands
  without its third level. The map is a thing of kind `map`, carried from
  the chapter's first level on (`carrying`); `wizard.cast("orvim")` takes
  a tick, needs the wand and the map (without the map it is refused,
  `no_map`), and makes the world's event `map`. When the page plays that
  tick it pauses the playback and opens a window over the scene with the
  scene's plan, drawn by the page from the map and the level, at that
  tick: the playable cells of the scene as a grid, floor light and walls
  dark, furniture hatched, each door at its cell shut or open, every
  column numbered along the top and the bottom and every row along the
  left and the right, each floor cell's own numbers small inside it; the
  wizard, every actor and every thing with its name and its cell beside
  it, except what lies unlit in a dark room (D52) and anyone in an
  enchanted region (D135), which is hatched and named. The window is
  closed by its button or Escape, and the playback goes on from the same
  tick. A lesson's *Try it* that casts `orvim` opens it the same way. The
  plan is drawn like an old map in ink on parchment, not as a second
  painting: no Gemini image. Rules out cell numbers drawn over the
  painting, and a map that costs a picture a scene.
- **D135 — An enchanted region hides every figure in it, on the scene and
  on the plan.** Decided 2026-11-05 by the owner, for the tunnel. A scene's
  settings name the region (`enchanted`, boxes of cells); a figure, the
  wizard or an actor, standing in it is not drawn, a figure stepping into
  it fades out over that step and one stepping out fades in, and the plan
  draws no figure in it. The world is not changed: the wizard walks it
  as any floor, and `wizard.position` tells where it stands, which is the
  point of the level played inside it. Rules out a dark picture of the
  tunnel's inside, and a figure drawn black over the painting.
- **D136 — Chapter 3 is seven small scenes, one a level or a pair of
  levels, asked of the model as places and the levels fitted to them.**
  Decided 2026-11-05 by the owner. A scene is twenty by fifteen cells, one
  part of the castle's inside at night with its roof lifted off: the
  corridor or room of the level in the middle, closed doors to dim rooms
  at its sides that fill the picture and give the corridor sense, no
  outside, no sky, no frame and no black but inside the tunnel's mouth
  (`art/README.md`, *What surrounds a scene*, holds for the margins). The
  route of the level is not forced into the picture: the picture is asked
  as a plain consistent place and the level's cells are read from it;
  what a level adds, a key, a hole, is an edit in a box. A scene the design
  needs and no picture holds (the way down) is laid out on the grid first
  and painted from its layout (D102, D115). Between two scenes the next
  starts where the last ended, an arch out of one being the arch into the
  next, and a story is told between them where the tale needs it. Rules
  out one large painting a chapter, and a stepped diagonal stair, which
  the model paints isometric every time.
- **D137 — A teacher may start anywhere on its patrol, and a level's
  ways set its phase so that no fixed wait wins where a loop is taught.**
  Decided 2026-11-05. `patrol` takes two forms. In the first, as until now,
  it lists the turning points after `at`, the path going from `at` through
  them, and the teacher starts at `at` looking the way `facing` says and
  steps toward the first point at tick 1 without a turn. In the second it
  lists the whole path's turning points, two or more, `at` lies on the
  path drawn from the first point through the rest, `facing` points along
  the path from `at`, and the teacher starts there walking that way. A
  patrol of two or more points whose drawn path holds `at` is the second
  form; any other is the first. A level that teaches waiting
  with `while` gives the teacher a sight that reaches the crossing cell
  from every cell of its patrol but the far end, where it turns, so that
  "it faces this way" and "it sees the crossing" are one thing, and the
  wizard waits on the cell beside the crossing, off the teacher's row, so
  that the step after the loop is safe whenever the loop ends; its three
  ways start the teacher a third of its period apart, so that no number
  of waits written in the code wins all three (section 3, 30.5, holds
  the tick tables). Rules out a loop level a child wins with `wait(5)`
  found by trial.
- **D138 — The stair of D53 is a slab over a hole.** Decided 2026-11-05 by
  the owner, who said a moving stair cannot be drawn in the scene's view.
  The thing's kind is `slab` in `level.json` and in the child's code
  (`slab.in_place`), with D53's rule unchanged: in place for `period` ticks
  and away for as many, from tick 0 in place, a step onto it while away a
  bump (`by: "slab"`), `osto` holding it from its next tick in place. On a
  painted scene the slab in place is the painting's own floor and away it
  is the hole, a picture cut from an edit of the painting and drawn at the
  cell the level gives (D85); `osto`'s hold glows round the cell. Rules out
  a stair that comes and goes and the word *escalón* in any text.
- **D139 — `can_see` is not taught; a program asks `facing`.** Decided
  2026-11-05 by the owner: when `can_see` is true the wizard is already
  caught, so no level can be won by asking it. `teacher.can_see` stays in
  the world's API for the challenges, in no lesson and in no level's
  `api` of chapters 1 to 3. The lesson on true and false keeps `==`, `not`
  and `dask.facing` (D54 otherwise stands).
- **D140 — A level's words show their code as code.** Decided 2026-11-05
  (the debt of sprint 29). Every text of a level's `text.<lang>.json`
  shown on the page, the intro, the outro, what was learned, the goals,
  the hints and the ways, renders a span between backquotes as inline code,
  as the lessons' pages do. Rules out a backquote shown to the child.

## 2. What differs from the design document

The design document (third version) is read first and holds; these are
the differences, decided while planning this sprint and told to the owner:

- **The statues' level is played in the corridor that goes down past the
  statues.** On the painting of the tunnel's exit the statues stand in a
  row along the corridor, not in a wide hall, so Dask stands still in the
  middle of the three-cell corridor that goes down, under the statues, at
  (16, 10), looking left or right (two ways), and the wizard passes down
  the side he is not looking at: `level:by-the-statues`, *Junto a las
  estatuas*. The tunnel's exit level ends at the corner where that
  corridor begins, (16, 6), not at (11, 6).
- **The night walk has a scene of its own, the seventh**, `the-way-down`:
  the storeroom's painting has no room for a second key, a door, a hole
  and Dask's last corridor. It is laid out on the grid first (30.4) and
  painted from the layout. The storeroom's scene holds the slab's level,
  the dark room's level and the story of the voices.
- **The dark room's level ends before its door, with the door opened**,
  and the story of the voices is told there, by the crack in the right
  wall, before the three go down through the door; the night walk starts
  under the storeroom, at the top of the seventh scene.
- **Each level that waits for Dask with `while` is played in three ways**
  (D137); the tunnel's exit, with `if`, in two; the slab's level in two
  (periods 3 and 4).
- **Where a level's cells are named below, they are the cells read from
  the painting's own grid** by `map_from_image.py grid`, which the
  prompts asked for as twenty by fifteen; the design document's route
  pictures used the same grid laid over the picture. Where the painting's
  grid turns out to put a wall or a door one cell off, the level keeps its
  shape (its moves, its ways, its tick tables) and the cells move with
  the picture; the commit says which.

## 3. The chapter

### 3.1 The stops, in order

`content/chapters/03-passages/chapter.json`, the chapter's title *The
passages* / *Los pasadizos*:

| # | Item | Kind | Scene |
| --- | --- | --- | --- |
| 1 | `story:after-dark` | Story 1 | `the-dormitory`, at night |
| 2 | `lesson:the-cells` | Lesson 1 | tried in `the-tunnel` |
| 3 | `level:the-doors-corridor` | Practice 1 | `the-tunnel` |
| 4 | `lesson:where-i-am` | Lesson 2 | tried in `the-tunnel` |
| 5 | `level:the-dark-tunnel` | Practice 2 | `the-tunnel` |
| 6 | `lesson:true-or-false` | Lesson 3 | (no level; its example is shown, not tried) |
| 7 | `lesson:if` | Lesson 4 | tried in `the-crossing` |
| 8 | `level:the-tunnel-exit` | Practice 3 | `the-crossing` |
| 9 | `lesson:else` | Lesson 5 | tried in `the-crossing` |
| 10 | `level:by-the-statues` | Practice 4 | `the-crossing` |
| 11 | `level:left-or-right` | Practice 5 | `the-two-doors` |
| 12 | `level:the-wrong-door` | Fix 1 | `the-two-doors` |
| 13 | `lesson:repeat` | Lesson 6 | tried in `the-three-doors` |
| 14 | `level:the-three-doors` | Improve 1 | `the-three-doors` |
| 15 | `story:beyond-the-doors` | Story 2 | `the-long-round` |
| 16 | `lesson:while` | Lesson 7 | tried in `the-long-round` |
| 17 | `level:past-the-teacher` | Practice 6 | `the-long-round` |
| 18 | `lesson:kirra-and-osto` | Lesson 8 | tried in `the-storeroom` |
| 19 | `level:the-moving-slab` | Practice 7 | `the-storeroom` |
| 20 | `level:the-dark-room` | Practice 8 | `the-storeroom` |
| 21 | `story:the-voices` | Story 3 | `the-storeroom` |
| 22 | `level:the-night-walk` | Practice 9 | `the-way-down` |
| 23 | `story:caught` | Story 4 | `the-way-down` |

Removed with their folders, briefs, tests and words: the levels
`the-watchtower`, `the-watch`, `the-long-stairs`, `the-moving-stairs`; the
story `the-top-of-the-stairs`; the scenes `the-passages` and
`the-night-passages` (and `world/tests/test_passages.py`, rewritten on the
new scenes). `content/levels/the-dark-room`, `left-or-right`,
`the-wrong-door`, `past-the-teacher`, `the-night-walk`, the lessons
`true-or-false`, `if`, `else`, `repeat`, `while`, `kirra-and-osto` and the
stories `after-dark`, `caught` keep their ids and are rewritten whole.

In every level the wizard carries the school wand and the map
(`carrying: ["wand", "map"]`), the friend (`friend`) speaks the intro and
the lessons and stands by with the mate (`mate`), each on a free cell near
the start that no route crosses; Dask is `dask`, a `teacher`. A level
starts where the one before ended; the first level of a scene starts at
that scene's way in.

### 3.2 The seven scenes

Each is twenty by fifteen cells, its painting in `art/raw/<prompt>/`
(the prompts in `tools/art/prompts/scene-*.md`), its cells those of its
painted grid. The cells named are the design's; 30.4 reads each scene's
true grid and the commit says what moved.

**`the-tunnel`** (painting `scene-tunnel-corridor`): a corridor along rows
11 and 12 from the left edge, closed doors in its top wall at columns 3 and
11 (never opened), turning up at columns 14 and 15 into a corridor that
ends at the tunnel's arch, its mouth the cells (14, 3) and (15, 3). The
tunnel is the enchanted region (D135): `[[14, 1, 15, 3], [16, 1, 19, 1]]`,
floor on the map, the painting's wall over it, no one drawn in it; its
other end is (19, 1), the right edge. The dim rooms at the sides are
walls on the map.

**`the-crossing`** (`scene-tunnel-exit`): the tunnel's arch at the left
edge, (0, 6) and (1, 6), enchanted; a corridor along rows 6 and 7 to the
right edge; a corridor along columns 8 to 10 from the top arch (9, 0) to
the bottom arch (9, 13), crossing it; three statues on row 7 at columns 12,
14 and 17, furniture (`u`, not walked, sight passes); at columns 15 to 17
a corridor going down from row 8 to the arch at (15, 13) and (16, 13).

**`the-two-doors`** (`scene-two-doors`): a room, floor rows 4 to 7 and
columns 5 to 14, entered under the top arch at (10, 2) and (10, 3); two
doors in its bottom wall, `left_door` at (7, 8) and `right_door` at
(13, 8), each with its doorway cell below, (7, 9) and (13, 9); a corridor
along row 10 from the left edge to the right; the benches at (12, 4),
(13, 4), (14, 5) and (14, 6) furniture. The doors in the bottom wall of
the corridor (row 11) are painted shut and never open.

**`the-three-doors`** (`scene-four-doors`): a corridor along columns 9 and
10 from the bottom arch (10, 13) to the top arch (10, 0), with three doors
across it, each two cells wide: the door thing at (10, 11), (10, 7) and
(10, 3), the cell beside each, (9, 11), (9, 7) and (9, 3), a wall on the
map (the leaf covers both; the wizard walks column 10). Their ids
`door_1`, `door_2`, `door_3`, from the bottom.

**`the-long-round`** (`scene-long-round`): a corridor along columns 9 and
10 from the top arch (10, 0) to the bottom arch (10, 13); the round's
corridor along rows 6 and 7 from column 2 to the right edge, the armour
at (0, 6), (0, 7), (1, 6), (1, 7) furniture; Dask's patrol on row 7 from
(2, 7) to (7, 7).

**`the-storeroom`** (`scene-dark-room`): a corridor along rows 6 and 7
from the left edge to the storeroom's arch at (4, 6) and (4, 7); the
storeroom, floor columns 5 to 13 and rows 2 to 9, its crates at (6, 3),
(7, 3), (6, 4), (7, 4), (8, 5), (6, 8), (7, 8), (6, 9), (7, 9), barrels at
(11, 3), (12, 3), (13, 3), (12, 4), (13, 4), (12, 8), (13, 8), (12, 9),
(13, 9) and the broken chair at (11, 4), (11, 5) furniture (the exact
cells from the painting); the crack in the right wall at (15, 5) and
(15, 6) above the lit passage at (14, 6) to (19, 7), a passage no level
walks (floor on the map, so that a story stands in it); the locked door
`store_door` at (10, 10) with its doorway cell (10, 11); the lit corridor
below along rows 12 to 14, columns 7 to 12, going off the bottom edge at
(10, 14). The key is painted at (9, 7): the painting is edited without it
and the key drawn there (D85). The storeroom is the scene's dark room
(`rooms`: `storeroom: [5, 2, 13, 9]`).

**`the-way-down`** (new, `scene-way-down`, painted from its layout): the
map below, D102. A corridor along columns 9 and 10 from the top arch
(rows 0 and 1) to the bottom arch (rows 13 and 14); a wall across it at
row 5 with a door two cells wide, the door thing `door` at (10, 5) and
(9, 5) a wall; the hole's cell (10, 7), plain floor in the painting; Dask's
corridor along row 10 from the left edge to column 10, ending at the
vertical corridor (a T); dim rooms, closed doors and thick walls
everywhere else. Its `map.txt`:

```
#########..#########
#########..#########
#########..#########
#########..#########
#########..#########
##########.#########
#########..#########
#########..#########
#########..#########
#########..#########
...........#########
#########..#########
#########..#########
#########..#########
#########..#########
```

The prompt (`tools/art/prompts/scene-way-down.md`) is the COMMON block of
`scene-four-doors.md` word for word (the style from the reference, the
inside of the castle with its roof lifted off, the view, the grid of
twenty by fifteen, no people and no text) with the layout as its first
picture and this place: a stone corridor two cells wide running from an
arch at the top edge down the middle of the picture to an arch at the
bottom edge; a wall across it a third of the way down with a closed
wooden door two cells wide, the wall going on at both sides of the door;
a plain corridor of flagstones below it; two thirds of the way down a
second corridor two cells wide comes in from the left edge and ends at
the middle corridor, with banners and torches on its walls and closed
doors, and nothing coming in from the right; everything else dim closed
rooms seen from above. The try is laid under the layout with
`layout.py the-way-down --over <try>` and chosen only when its walls, its
door and its two corridors lie in the layout's cells (D102); a try that
is off is asked again, not mended, three tries at most. The door is asked
shut and open (D116): the open picture an edit of the chosen try with the
door open and the floor of the corridor beyond seen through it.

### 3.3 The levels

Each level's `level.json`, its solution and its three or more wrong
programs, as the course's rule asks; the exact cells from each scene's map
(30.4). Every level's `tick_limit` is 100. Dask's sight is the default,
four, unless said. A reach goal with `"hidden": true` shows no mark
(30.2). A `uses` bonus names a member. The ways' names are in the level's
`text.<lang>.json` under `ways`.

**P1 `the-doors-corridor`, *El pasillo de las puertas*** (`the-tunnel`).
Start (1, 12); friend at (0, 12), mate at (0, 11), or on the two free cells
nearest the start that no route crosses. Goals: `reach` `[15, 3]` hidden; bonus `uses`
`cast` (the map's spell, the only one the level has: `spells: ["orvim"]`).
`api`: the four moves, `wizard.cast`. Starting code: two comments, one a
move, in the friend's words (the goal's cell is named in the intro and on
the goal's line). Solution: `wizard.move_right(14)`, `wizard.move_up(9)`.
Wrong: right 14 only (stops short), right 13 then up 9 (ends on (14, 3),
the mouth's other cell, not the goal), up first (into the wall). The wizard steps into (15, 3), an enchanted cell,
and fades as it does (D135): that is the level's end.

**P2 `the-dark-tunnel`, *El túnel oscuro*** (`the-tunnel`). Start (15, 3)
inside the enchanted region, friend at (14, 3), mate at (14, 2), none drawn.
Goals: `reach` `[19, 1]` hidden; bonus `uses` `position`. `api`: the moves,
`wizard.position`, `print`. `spells: ["orvim"]`. Starting code: a comment
to print where the wizard stands, two for the moves. Solution:
`print(wizard.position)`, `wizard.move_up(2)`, `wizard.move_right(4)`.
Wrong: up 3 (into the wall), right first (into the wall), up 2 and right 3
(short). Nothing is seen to move; the win card follows.

**P3 `the-tunnel-exit`, *La salida del túnel*** (`the-crossing`). Start
(2, 6); friend at (2, 7), mate at (3, 7). Dask on column 9, patrol
`[[9, 11]]` (today's form: the path from `at` to (9, 11); his `facing` at
tick 0 is the way's, and his first step goes down at tick 1 without a
turn), two ways:

- `away`: Dask `at` `[9, 5]`, `facing` `down` (he walks down through the
  crossing and away);
- `watching`: Dask `at` `[9, 8]`, `facing` `up` (he looks up at the
  crossing and turns down after a tick).

Goals: `reach` marker E at (16, 6); `not_seen_by` `dask`. `api`: the moves,
`wizard.wait`, `teacher.facing`. Starting code: a comment for the
condition (ask which way Dask faces with `facing`; if it is `"up"`, wait
one tick with `wait`), a comment for the walk. Solution:

```python
if dask.facing == "up":
    wizard.wait()
wizard.move_right(14)
```

The tick table, the wizard on (9, 6) at tick 7 without the wait and at 8
with it; Dask sees (9, 6) when he faces up from (9, 7) to (9, 10):

| way | Dask, ticks 1 to 13 | (9, 6) unsafe at |
| --- | --- | --- |
| `away` | down 6, 7, 8, 9, 10, 11; turn up at 11 (sees 10 to 7); up 10, 9, 8, 7; on 6; up 5 | 8, 9, 10, 11, 12 |
| `watching` | down 9, 10, 11; turn up (sees 10 to 7); up 10, 9, 8; turn down; down 9, 10, 11; turn up | 5, 6, 7, 13, 14, 15 |

Wrong: the walk alone (caught in `watching` at tick 7), `wait()` then the
walk (caught in `away` at tick 8), `wait(2)` then the walk (caught in
`away` at tick 9; in `watching` Dask walks down then).
A unit test plays the solution and the three wrong programs in both ways
and holds the table. The friend and the mate stay where they are.

**P4 `by-the-statues`, *Junto a las estatuas*** (`the-crossing`). Start
(16, 6); friend at (15, 6), mate at (14, 6). Dask stands still (no patrol)
at (16, 10) in the corridor that goes down, two ways: `looking_left`
(`facing` `left`) and `looking_right` (`facing` `right`). Goals: `reach` E
at (16, 13); `not_seen_by` `dask`. `api`: the moves, `wizard.wait`,
`teacher.facing`. Starting code: the two moves down to (16, 8) given, then
comments: if Dask looks left, go down the right side, else the left side;
the last step into the arch. Solution:

```python
wizard.move_down(2)
if dask.facing == "left":
    wizard.move_right()
    wizard.move_down(4)
    wizard.move_left()
else:
    wizard.move_left()
    wizard.move_down(4)
    wizard.move_right()
wizard.move_down()
```

Dask facing left sees (15, 10) and nothing beyond the wall at 14; facing
right, (17, 10). Wrong: the left side always (caught in `looking_left`),
the right side always, the branches swapped, straight down column 16
(walks into Dask: caught). A unit test plays them in both ways.

**P5 `left-or-right`, *Izquierda o derecha*** (`the-two-doors`). Start
(10, 4); friend at (9, 4), mate at (11, 4). Two doors, `left_door` at
(7, 8) and `right_door` at (13, 8), no key anywhere; two ways:
`left_locked` (`left_door` locked, `right_door` not) and `right_locked`
(the other way round). Goals: `reach` E at (16, 10). `api`: the moves,
`door.locked`, `door.open`, `wizard.wait`, `teacher.facing`. Starting code:
comments for the condition on `left_door.locked`, the walk down to the
doors' row and along it to one door, opening it, the walk through and
along the corridor; the `else` branch the same. The walk goes down first:
row 4 holds the friend, the mate and the benches. Solution:

```python
if left_door.locked:
    wizard.move_down(3)
    wizard.move_right(3)
    right_door.open()
    wizard.move_down(3)
    wizard.move_right(3)
else:
    wizard.move_down(3)
    wizard.move_left(3)
    left_door.open()
    wizard.move_down(3)
    wizard.move_right(9)
```

Wrong: the left door always (refused `locked` in `left_locked`), the right
door always, the branches swapped, `right_door.open()` from (10, 7) (`far`).

**F1 `the-wrong-door`, *La puerta equivocada*** (`the-two-doors`). The same
room on another night: the same start, actors, doors, ways and goals as P5,
`kind: "fix"`, its given program the solution of P5 with the two branches'
bodies swapped (so that it walks to the locked door in both ways). Goals:
`reach` E at (16, 10), no bonus. Hints: the
first says the program opens the locked door in both ways, the second
which lines belong under `if` and which under `else`. Wrong: the given
program, the given program with only one branch swapped, the branches
right but `open()` before the walk down.

**I1 `the-three-doors`, *El pasillo de las tres puertas*** (`the-three-doors`).
Start (10, 12); friend at (9, 12), mate at (10, 13). Doors `door_1`
(10, 11), `door_2` (10, 7), `door_3` (10, 3), none locked. Goals: `reach` E
at (10, 0); `lines_under` 5 (not a bonus: the improve's own goal, as
`the-stairs` of chapter 1 asks for fewer lines). `kind: "improve"`, the
given program the nine lines of the design document (find the nearest
door, open it, four up, three times); `api`: the moves,
`wizard.find_nearest`, `door.open`. Solution:

```python
for step in range(3):
    door = wizard.find_nearest("door")
    door.open()
    wizard.move_up(4)
```

`find_nearest("door")` finds the nearest door as it finds a key (a unit
test says so: from (10, 12) it is `door_1`, from (10, 8) `door_2`). Wrong:
the given program (wins the walk, fails the lines), `range(2)` (stops at
the third door), the body not moved in (a syntax error, explained), the
loop with `move_up(3)` (stops before the door).

**P6 `past-the-teacher`, *Pasar al profesor*** (`the-long-round`). Start
(10, 1); friend at (9, 1), mate at (9, 2). Dask on row 7, `sight` 7,
`patrol` `[[2, 7], [7, 7]]`, three ways (D137):

- `near`: `at` `[2, 7]`, `facing` `right`;
- `middle`: `at` `[6, 7]`, `facing` `right`;
- `far`: `at` `[5, 7]`, `facing` `left`.

Goals: `reach` E at (10, 13); `not_seen_by` `dask`. `api`: the moves,
`wizard.wait`, `teacher.facing`. Starting code: comments for the walk down
to the cell before the crossing, the loop that waits while Dask faces
right, the walk down. Solution:

```python
wizard.move_down(5)
while dask.facing == "right":
    wizard.wait()
wizard.move_down(7)
```

Dask sees (10, 7) when he faces right from any cell of his patrol but
(2, 7) (sight 7 reaches (9, 7) from there); the wizard waits on (10, 6),
which is never seen, and steps onto (10, 7) the tick after the loop ends.
The tick table (the wizard on (10, 6) at tick 5; a cell in the table is
Dask's cell on row 7 after his step, `t` a turn):

| way | ticks 1 to 14 | (10, 7) unsafe at (then every 12) |
| --- | --- | --- |
| `near` | 3 4 5 6 7 t 6 5 4 3 2 t 3 4 | 1 to 5, 13 to 17 |
| `middle` | 7 t 6 5 4 3 2 t 3 4 5 6 7 t | 1, 9 to 13 |
| `far` | 4 3 2 t 3 4 5 6 7 t 6 5 4 3 | 5 to 9, 17 to 21 |

The solution waits 1 tick in `near`, none in `middle`, 5 in `far`. A
program that waits a fixed number *n* before the step onto (10, 7), which
is then at tick 6 + *n*, is caught in some way for every *n* (the safe
ticks of `near` are 6 to 12, of `middle` 2 to 8, of `far` 10 to 16, every
12): a unit test holds that for *n* from 0 to 12 and that the solution
wins all three. Wrong: the walk alone, `wait(1)` (caught in `far`),
`wait(4)` (caught in `middle`), the loop on `"left"` (never crosses: too
many ticks).

**P7 `the-moving-slab`, *La losa que va y viene*** (`the-storeroom`).
Start (0, 6); friend at (0, 7), mate at (1, 7). The slab `slab` at (3, 6),
two ways: `three` (`period` 3) and `four` (`period` 4). Goals: `reach` E at
(5, 6), the cell inside the arch; bonus `uses` `in_place`. `spells:
["osto"]`; `api`: the moves, `wizard.wait`, `wizard.cast`, `slab.in_place`.
Starting code: comments for the two steps to the hole's edge, the loop
that waits while the slab is not in place, the steps across. Solution:

```python
wizard.move_right(2)
while not slab.in_place:
    wizard.wait()
wizard.move_right(3)
```

The wizard is on (2, 6) at tick 2, and `in_place` tells of the next tick
(D53): in `three` the slab is away at ticks 3, 4 and 5, the loop waits
three ticks and the step onto it is tick 6; in `four` it is in place
through tick 3, the loop waits none and the step is tick 3. A fixed wait
wins both ways first at `wait(5)` (the step at tick 8, in place in both);
the bonus is what asks `in_place`. Wrong: the walk alone (bumps in
`three`; it wins `four`), `wait(3)` (bumps in `four`), `osto` cast and the
step at once (bumps: the hold starts at the next tick in place).

**P8 `the-dark-room`, *La sala oscura*** (`the-storeroom`). Start (5, 6);
friend at (5, 7), mate at (4, 7). `dark: ["storeroom"]`, `spells:
["kirra"]`; the key `key` at (9, 7), `opens` `store_door`; the door
`store_door` at (10, 10), locked. Goals: `collect` `key`; `open`
`store_door`; `reach` E at (10, 9), the cell above the door; bonus `uses`
`find_nearest`. `api`: the moves, `wizard.cast`, `wizard.find_nearest`,
`thing.position`, `print`, `wizard.pick_up`, `door.open`, `door.locked`.
Starting code: comments for the light, finding the key and printing its
cell, the walk to it, picking it up, the walk to the cell above the door,
opening it. Solution:

```python
wizard.cast("kirra")
key = wizard.find_nearest("key")
print(key.position)
wizard.move_down()
wizard.move_right(4)
wizard.pick_up()
wizard.move_right()
wizard.move_down(2)
store_door.open()
```

In the dark, `find_nearest("key")` gives `None` (the key lies farther than
one cell: D52) and the next line fails with the error the world explains
for it; the first hint says so. Wrong: no `kirra` (the error), the walk
without `pick_up` (the door refuses, `locked`), `open()` from (9, 7)
(`far`).

**P9 `the-night-walk`, *El paseo nocturno*** (`the-way-down`). Start
(10, 1); friend at (9, 1), mate at (9, 2). The key `key` at (10, 3), `opens`
`door`; the door `door` at (10, 5), locked; the slab `slab` at (10, 7),
`period` 3; Dask on row 10, `sight` 8, `patrol` `[[1, 10], [8, 10]]`, three
ways:

- `near`: `at` `[1, 10]`, `facing` `right`;
- `middle`: `at` `[6, 10]`, `facing` `right`;
- `far`: `at` `[5, 10]`, `facing` `left`.

Goals: `collect` `key`; `open` `door`; `reach` E at (10, 13); `not_seen_by`
`dask`; bonus `uses` `in_place`. `spells: ["osto"]`; `api`: everything the
chapter taught (the moves, `wait`, `cast`, `pick_up`, `find_nearest`,
`thing.position`, `door.open`, `door.locked`, `teacher.facing`,
`slab.in_place`). Starting code: one comment a step, in order. Solution:

```python
wizard.move_down(2)
wizard.pick_up()
wizard.move_down()
door.open()
wizard.move_down(2)
while not slab.in_place:
    wizard.wait()
wizard.move_down(3)
while dask.facing == "right":
    wizard.wait()
wizard.move_down(4)
```

The wizard is on (10, 6) at tick 7, the slab is in place at tick 8 (period
3: in at 6 to 8), and on (10, 9), the cell beside the crossing, at tick 10.
Dask sees (10, 10) facing right from (2, 10) to (8, 10), never from
(1, 10); his period is 16 (7 steps, a turn, 7 steps, a turn). The tick
table (a cell is Dask's on row 10 after his step, `t` a turn):

| way | ticks 1 to 18 | (10, 10) unsafe at (then every 16) |
| --- | --- | --- |
| `near` | 2 3 4 5 6 7 8 t 7 6 5 4 3 2 1 t 2 3 | 1 to 7, 17 to 23 |
| `middle` | 7 8 t 7 6 5 4 3 2 1 t 2 3 4 5 6 7 8 | 1, 2, 12 to 18 |
| `far` | 4 3 2 1 t 2 3 4 5 6 7 8 t 7 6 5 4 3 | 6 to 12, 22 to 28 |

The solution waits none in `near` and `middle` (in `middle` Dask turns at
(1, 10) the tick of the step, and sees no farther than (9, 10) from
there) and three in `far`. A fixed wait *n* before the step onto (10, 10),
at tick 11 + *n*, is caught in some way for every *n* from 0 to 16 (the
safe ticks of `near` are 8 to 16, of `middle` 3 to 11, of `far` 13 to 21,
every 16: a unit test, as P6's). Wrong: no wait for the slab (bumps), no
wait for Dask (caught in `far`), `open()` before the key (`locked`),
`wait(3)` for Dask (caught in `middle`).

### 3.4 The stories

Each `story.json` with its `text.<lang>.json` from Gemini (30.6); the
camera on who speaks (D74); figures that go together move in one step
(D117); the staging check of `ci/check.sh` plays every step.

**S1 `after-dark`, *Después del anochecer*** (`the-dormitory`, at night, the
scene's night picture: `light` none, the painting's own). The wizard
asleep in `bed_2` and the mate asleep in `bed_1` (as `the-morning` lays
the mate: `asleep`; if a story cannot lay the wizard asleep, the wizard
stands at (18, 9), the bed's `pillow_side`, and the step says it sits up);
the friend not yet there. Steps: the voice (a soft knock) — the mate wakes
(`wake`) — the voice: the two go to the common room's door (the wizard
wakes and both walk to (12, 13) and (11, 13) in one step; the wizard opens
`front_door`; the friend appears at (12, 15) and walks to (12, 14)) — the
friend (the map found in the library book, the cells, the word in its
corner; the friend hands it over: *take it, you read it while I watch the
way*) — the mate (the rumours, Dask) — the friend (we look before every
step; are you coming?) — the wizard (if Dask sees us, straight back to
bed) — the voice: the three go out (the friend walks to (3, 15) and
vanishes; the wizard and the mate walk (12, 14), (12, 15), (3, 15) and
vanish, in the same step). Eight steps.

**S2 `beyond-the-doors`, *Al otro lado de las puertas*** (`the-long-round`,
the three under the top arch: wizard (10, 1), friend (9, 1), mate (9, 2),
camera (10, 3)). Steps: the voice (through the three doors; the stones
older here; the round's corridor crosses ahead) — the friend (the loop got
us through; proud) — the mate (steps below: Dask walks his round, and
looks this way a long while) — the wizard (how do we cross if we do not
know how long he looks?) — the friend (we wait exactly as long as he looks;
a program can do that). Five steps, no walk.

**S3 `the-voices`, *Voces en el muro*** (`the-storeroom`, lit: a story is
never dark; the door `store_door` open from the start, as P8 left it; the
three above it: wizard (10, 9), friend (9, 9), mate (11, 9); camera on the
crack (14, 6)). Steps: the voice (the room lit at last; a crack in the
right wall; voices from the room beyond: the three walk to (13, 6),
(13, 7) and (12, 6) in one step and face right) — the voice (the cold voice
from the stone, its words in italics: tomorrow's flying lesson, the brooms
in the shed, the words to say to each broom; no one will make the boy fly
for a long while) — the voice (an older pupil's voice, afraid: what if
someone is hurt; the cold voice: a fright, no more, and a lesson for those
who think the castle is theirs; steps going away) — the mate (that was a
pupil; the other voice came from the wall) — the friend (someone will
tamper with the brooms; we cannot tell anyone without confessing) — the
wizard (then we stop it ourselves tomorrow; first, back to bed unseen) —
the voice: the way home (the three walk back to (10, 9), through the open
door to (10, 12) and down to (10, 14) and vanish, in one step). Seven steps.

**S4 `caught`, *Atrapados*** (`the-way-down`, the three before the bottom
arch: wizard (10, 12), friend (9, 12), mate (9, 11), camera (10, 12)).
Steps: the voice (almost there) — the voice: Dask steps out of the dark
(Dask `appear` at (10, 13), facing up) — Dask (three first-years out of
bed at this hour?) — the mate (we were only checking the slab, sir) — the
voice (a long look; the smallest smile) — Dask (I have been watching you:
you looked before each step, waited, lit the dark; off you go, this once,
{wizard}) — the voice (under the blankets; what was learned: the cells and
`position`, an expression, `if` and `else`, `for` and `while`, *kirra* and
*osto*; the secret the three share; Dask walks away up the corridor to
(10, 2) and vanishes, and the three walk through the arch to (10, 14) and
vanish). Seven steps.

### 3.5 The lessons

Eight, the friend's voice, whispering, as the design document's section 4
gives them, each tried in the level that follows it (3.1); the ones the
owner's decisions change are briefed again (30.6):

- `the-cells`: the plan window (D134) instead of numbers on the scene: the
  map shows the whole castle floor by floor as a plan of cells; a cell's
  two numbers; counting what changes; *Try it*: `wizard.cast("orvim")`
  opens the plan of the corridor the three stand in.
- `where-i-am`: the enchanted tunnel is the reason: inside it the scene and
  the plan show no one, and `wizard.position` tells; a thing knows its
  cell too, `key.position` (one sentence, for the dark room); *Try it*:
  `print(wizard.position)`, tried inside the tunnel, where it prints
  `(15, 3)`.
- `true-or-false`: as given, with `can_see` taken out: `==`, `not`,
  `dask.facing`; the example `print(dask.facing == "left")` is shown and
  not tried (the next stop is a lesson).
- `if`: as given (`wizard.wait()`, four spaces, a level played several
  ways).
- `else`: as given, the *Try it* on Dask: `if dask.facing == "left":
  print(...) else: print(...)`.
- `repeat`: the stairs replaced by the three doors: `for step in range(3):`;
  the same three lines three times are a loop; *Try it*: `for step in
  range(3): print(step)`, which prints 0, 1 and 2.
- `while`: as given.
- `kirra-and-osto` (*Luz y losas*): the hole and the slab (D138), `slab`,
  `slab.in_place`, `osto`; *Try it*: `wizard.move_right(2)`,
  `print(slab.in_place)`.

## 4. The pieces

### 30.1 The story bible, the course and the chapter

- `docs/dev/story.md`: the places table's two chapter 3 rows replaced by
  seven, one a scene (3.2), in order; *The wizard's way*: chapter 1's
  opening beat gains the wizard's parents (the wizard says at the gate
  that their parents are not wizards, and the friend answers that a
  wizard born to parents without magic is extremely rare, a thing to be
  proud of, and teaches them the basics since the friend's own parents
  are wizards); chapter 2's closing beat says the friend came to the
  library for an old book about the passages, because of the rumours;
  chapter 3's beats rewritten to this chapter (the map found folded in
  that book, handed to the wizard; the enchanted tunnel; the crossing;
  Dask's rounds; the slab; the storeroom and the crack; the way down;
  Dask lets them go); chapter 5's closing beat gains Orla's tale: Korvel's
  story and death, and the truth about the wizard's parents (they were
  wizards; Korvel tried to kill them; the unborn wizard protected both;
  Korvel could kill only the magic in them, so they are not wizards and
  remember nothing of magic). The characters table: Korvel's row says he
  died and his voice remains in the walls; Rinlo's row his motive (afraid
  of flying; the voice promised the lessons would stop). The spells
  table: `orvim` opens the plan (D134), `osto` holds a slab (D138).
- `docs/dev/course.md`: chapter 3's section rewritten to the twenty-three
  stops of 3.1 with the ideas and the API each unlocks, the seven scenes,
  and the world features it needs (D134 to D139); *How a level earns its
  idea* gains two rules the owner gave: a question the program asks is
  one the world answers before the harm (`facing`, never `can_see`), and a
  loop that waits is forced by ways no fixed number wins (D137); the
  challenges' row *Dask's round* keeps `can_see`; the count updated.
- `content/chapters/03-passages/chapter.json`: the twenty-three items of
  3.1; the old items removed with their folders, briefs, tests and words
  (3.1).
- `docs/dev/plan.md` 5.5 names this sprint.
- Check: `ci/check.sh`; the course book regenerated.

### 30.2 The world

In `world/kydux_world/`, tests in `world/tests/`:

- `map` among `CARRIED_KINDS`; `orvim` in `KNOWN_SPELLS` and `SPELLS`: an
  `Effect` whose `then` notes the world's event `map` (`{"at": [x, y]}`);
  refused `no_map` when no `map` is carried (the wand's check stays first).
- The `reach` goal takes `"hidden": true` (kept in `params`, so that the
  page reads it); the level's content test allows a hidden reach without
  a marker on the map.
- `slab` replaces `stair` as the kind, the class, the role in `api.py`
  (`slab.in_place`), the bump's `by` and the `hold` event's actor (D138);
  `osto` holds a `slab`; every test and fixture that says stair says slab.
- D137 in `level.py`'s `_actor`: today's form (the path from `at` through
  the patrol's points, the spec's `facing` at tick 0, the first step at
  tick 1 without a turn) is unchanged; when the patrol has two or more
  points and `at` lies on the path drawn from the first point through the
  rest, that path is the patrol, `facing` is required and must point to
  a neighbour of `at` on the path (else a `LevelError` naming the actor),
  and the `Teacher` starts at `at`'s index with `along` set by the facing.
  Tests: the three ways of P6 and P9 give the tick tables of 3.3.
- A test that `find_nearest("door")` gives the nearest door and that it
  answers `open()`.
- The enchanted region: nothing in the world (D135); `scene.json` may name
  `enchanted` boxes, read by `read_scene` and handed to the page in the
  level's map (`enchanted` cells, as `dark_area` is), checked to be floor.
- `teacher.can_see` stays in `api.py`; the api lists of chapter 3's levels
  do not name it (a content test holds it for chapters 1 to 3).
- The API table and the notebook's words for `slab.in_place`,
  `wizard.position`, `thing.position`, `teacher.facing`, `wizard.cast`
  with `orvim`, `wizard.wait`, in `i18n/<lang>.json`, Claude's.
- Check: `world/tests`, `test_api_table`, the i18n dynamic names.

### 30.3 The page

In `app/src/`:

- **The plan window** (D134): `ui/plan.ts`, a modal `#plan` over the level
  (`data-plan-open` on the scene's parent while open), drawn on a canvas
  from the level's map, its things and its actors at the tick shown:
  parchment background, ink-brown lines; walls as dark hatched blocks,
  floor as pale cells, furniture cross-hatched, a door as a brown bar on
  its cell when shut and a quarter arc when open; the enchanted region
  hatched diagonally and labelled with `t('plan.enchanted')`; a dark room
  unlit tinted grey with no thing drawn in it; column numbers along the
  top and the bottom edges, row numbers along the left and the right,
  each floor cell's `x,y` in small ink inside it; the wizard as a filled
  circle with its name and `(x, y)` beside, a friend as a circle, Dask as a
  circle with a short arrow for his facing, a thing as a small square,
  each with its name and cell; a legend line `t('plan.legend')` (x from
  the left, y from the top, from 0) and a close button `t('plan.close')`.
  The margin's cells are not drawn. The playback pauses when the `map`
  event's tick is shown (`playback.pause()`), the window opens, and
  closing it (the button, Escape) plays on (`playback.play()`); a run
  restarted closes it. A lesson's *Try it* opens it the same way. The
  window fits the viewport, the plan scaled to it, and on a phone fills
  it. A Vitest test draws a small map and checks the cells drawn;
  `data-plan-open` for the browser tests.
- **The enchanted region** (D135): `engine/scene.ts` reads `enchanted`
  from the map; a figure whose tile is in it is not drawn (`visible`
  false), a `move` into it tweens the sprite's alpha to 0 over the step
  and a move out of it to 1; `data-enchanted` names the figures hidden;
  the silhouette and the shade do not apply to them; a thing in it is
  drawn as usual (none is placed there).
- **The slab** (D138): `engine/stairs.ts` renamed `slab.ts`; on a painted
  scene the slab's `away` state is the hole's picture at its cell, drawn
  from `art.json` as a thing's state (`hole`), and `in` is nothing (the
  floor); the hold's glow a ring round the cell; `data-slabs` replaces
  `data-stairs`. Without art, the placeholder as now.
- **The dark room on a painted scene** (D52): the darkness drawn over the
  room's cells at alpha 0.82 (not 0.97), so that the painting's shapes
  show faintly under it, the key hidden entirely until lit (its sprite
  invisible while the room is unlit and it is not near the wizard); the
  light lifted with a fade over 0.6 of a tick when `kirra` plays.
- **A hidden reach**: no mark drawn for a reach goal with `hidden`.
- **The `no_map` thought** through `blockedText`.
- **Dask's sight** of 7 and 8: `sight.ts` and the cone drawn as now,
  longer.
- **Inline code in a level's words** (D140): the helper of `outcome.ts`
  (line 117, the backquote split) moved to `ui/words.ts` and used by the
  start card's intro and goals, the hints, the win card's outro and
  learned, and the ways' names; a Vitest test on a text with backquotes.
- Check: Vitest; e2e in 30.7.

### 30.4 The seven scenes' art

For each scene: `art/scenes/<id>/cut.json` and `manifest.toml` as the
library's, the things marked in magenta by Gemini in crops (three tries a
part, voted) and cut by their outlines, every door's leaf traced (D113),
`tools/art/export_scene.py <id>`, the sweep green, and `all-<id>.png`,
`states-<id>.png` and `doors-<id>.png` looked at before the commit. The
order of work for a scene:

1. `map_from_image.py grid` on the painting; the cells read against the
   design's (3.2); `sheet` for marking; `marks.txt` → `map.txt` and
   `scene.json` (terrains `u` for furniture, `rooms`, `enchanted`,
   `things` fixed in the scene: doors with their art).
2. The grid taken out of the painting by an edit (`<scene>-nogrid.md`, as
   `game-library6-nogrid.md`), the base every later edit is measured
   against.
3. The voids mended (D136, `art/README.md`): every black or paper area
   outside the place painted as more of the castle's inside, dim rooms and
   thick walls, in boxes with `repaint.py`; the scene whole, no sky.
4. Every door that opens painted open (an edit in its box, the floor of
   the room beyond seen through it, D116), its leaf traced (D113), its
   closed state within its doorway, the threshold if the painting lacks
   a joint (D114).
5. The things that are picked up or come and go edited out of the
   painting, one an edit, and cut in their boxes (D85).
6. Static things (statues, armour, benches, crates, barrels, the chair)
   marked and cut, the walls' top bands in `cuts`, the thresholds of the
   night (the paintings are dark: `thresholds` and `outline` set per
   scene, measured, as the dormitory's).
7. Export, sweep, sheets; a figure on every walked cell whole or hidden
   only behind what should hide it; the owner's `?debug` view opens each.

The scenes and what each needs:

- **`the-tunnel`**: nogrid; the black gaps between the top rooms (columns
  10 to 13, rows 0 to 3) and at the bottom right (columns 16 to 19, rows
  10 to 14) painted as rooms and walls; the two doors on the corridor are
  shut things cut once (never open: `things` of the scene with no open
  state); `enchanted` as 3.2; the tunnel's mouth `dark` as D100 for the
  cells (14, 3) and (15, 3) (a figure stepping in goes dark before it
  fades). Images: 1 nogrid + 2 voids = 3 (+ 2 retries).
- **`the-crossing`**: nogrid; the paper round the castle (the four
  corners and the bottom middle) painted as the castle's inside; the
  three statues and the armour marked and cut; no door opens. Images: 1 +
  2 = 3 (+ 2).
- **`the-two-doors`**: nogrid; the black top corners painted as rooms;
  `left_door` and `right_door` open (two edits), traced; the benches
  marked. Images: 1 + 1 + 2 = 4 (+ 2).
- **`the-three-doors`**: nogrid; the three doors open, each its own edit
  (three), traced. Images: 1 + 3 = 4 (+ 2).
- **`the-long-round`**: nogrid; the small black slivers at the bottom;
  the armour marked; no door opens. Images: 1 + 1 = 2 (+ 1).
- **`the-storeroom`**: nogrid; the black bands (the left of rows 8 and 9,
  the right of rows 4 and 5, the bottom corners) painted; the key edited
  out (`-nokey`); the hole painted in a box at (3, 6) of the corridor
  (`-hole`), cut as the thing `hole` (D138); `store_door` open, traced;
  the crates, barrels and chair marked and cut; `rooms` the storeroom.
  Images: 1 + 2 + 1 + 1 + 1 = 6 (+ 3).
- **`the-way-down`**: `layout.py` from the map of 3.2 (`content/scenes/
  the-way-down/map.txt` written first, with its `scene.json`); the
  painting from `scene-way-down.md` (up to 3 tries, chosen by `--over`);
  nogrid; the key painted lying at (10, 3) by an edit and edited out
  again (or asked in the prompt and edited out: one edit either way); the
  door open, traced; the hole at (10, 7): the storeroom's hole cut-out
  drawn there (D85, no new image). Images: 3 + 1 + 1 + 1 = 6 (+ 2).

Figures: none new; Dask's sheet is `content/art/figures/dask.webp`; the
map has no picture (nothing is drawn in the hands). `content/art/scenes/
<id>/SOURCE.md` for each.

### 30.5 The levels and the stories

`content/levels/<id>/level.json`, `solution.py`, `wrong/` and the goals of
3.3 for the eleven levels; `content/stories/<id>/story.json` for the four
stories of 3.4; `tools/scene_maps.py` builds each level's and story's map
from its scene. The unit tests of 3.3 (the tick tables, the fixed waits,
`find_nearest("door")`) in `world/tests/test_passages.py`, rewritten.
Check: `ci/check.sh`; `tests/project` for the placement against the
cut-outs.

### 30.6 The texts

Briefs in `tools/write/briefs/`, as chapter 2's (`chapter-2-levels.md`,
`chapter-2-lessons.md`, `chapter-2-stories.md` are the model; the
chapter 3 design briefs of `drafts/chapter-3-design-*` give the voice and
the facts, and the design document's section 4 is given as context in
full, since the owner approved its lessons and stories):

- `chapter-3-lessons.md`: the eight lessons of 3.5, English and Spanish,
  each with its *Try it*; the design document's section 4 given, with
  what changes (3.5) said for `the-cells`, `where-i-am`, `true-or-false`,
  `else`, `repeat`, `kirra-and-osto`.
- `chapter-3-levels.md`: the eleven levels' `text.<lang>.json`: title,
  goals as the child reads them (the hidden reach's line names the cell),
  starting code's comments (one a step, naming the method), hints (three,
  the first on the idea, the last the whole), intro (the friend,
  whispering, the situation and the cells the design names, never the
  solution), outro, learned, `ways` names; the facts of 3.3 for each.
- `chapter-3-stories.md`: the four stories' `text.<lang>.json` with the
  steps of 3.4, the cold voice's words in italics inside the voice's
  steps.
- `chapter-3-older-stories.md`: `at-the-gate`'s two new steps after step 4
  (the wizard: my parents are not wizards, so I know nothing of magic; the
  friend: a wizard born to parents without magic is extremely rare, be
  proud; my parents are wizards and taught me some things, so I can teach
  you the basics) and the step after them kept; `the-wand-bank`'s step 4
  (the friend came for an old book about the castle's passages, because
  of the rumours, and heard the wizard's voice); both files given whole,
  every other step kept word for word.
- The words: the plan window's title, legend, close, the enchanted
  label; the `no_map` thought; the notebook's words; `i18n/<lang>.json`,
  Claude's.
- Every draft read, corrected and moved into `content/`; the course book
  regenerated and read whole in Spanish.
- Check: `ci/check.sh` (i18n keys, forbidden words, the course book).

### 30.7 The tests, the debug view and the pictures for the owner

- Playwright, `app/e2e/chapter-3.spec.ts`: every level won by its
  solution at speed 4, in Spanish for a girl wizard and in English for a
  boy; every way of every level with ways; `orvim` opens the plan and
  pauses (`data-plan-open`, `data-state` paused), closing it plays on, in
  P1 and in the first lesson's *Try it*; in P2 the wizard is hidden from
  the start (`data-enchanted`) and the plan draws no figure; in P1 the
  wizard fades on entering the mouth; in P3 the walk alone is caught in
  `watching`; in P6 and P9 `wait(1)` is caught in a way and the solution
  wins all three; in P8 the room is dark until `kirra` and the key is not
  seen; the slab's hole shows while away; each story played to its end;
  the chapter's stops in order on the map. Screenshots of every stop to
  `app/e2e/shots/chapter-3/`, each scene zoomed out once, the plan window
  once, for the owner.
- The sweep's and the doors' sheets for the seven scenes in
  `art/raw/game-check/`.
- `?debug`: the enchanted cells crossed in the cells layer.
- Check: `ci/check.sh --e2e` green.

### 30.8 Documents, and the prompt for the review

- `docs/dev/architecture.md`: D134 to D140 in the decision log, D112 and
  D53 marked as superseded where they are; the module map (`plan.ts`,
  `slab.ts`, `words.ts`); the world's API lines (`slab.in_place`,
  `orvim`); the events table (`map`, `hold` by the slab, the bump's
  `slab`); the map's characters unchanged.
- `art/README.md`: the seven scenes under *Where things are kept*; a line
  under *What surrounds a scene* for the voids mended by edits in
  chapter 3's scenes.
- `docs/dev/dev-environment.md` if a step changes.
- The report in Spanish and **the prompt for the designer's review**: a
  Markdown block the owner pastes, naming the commits in order, what
  differs from this plan and the design document and why, what was
  corrected by hand in Gemini's drafts, the Gemini images spent (the
  count against 70), the check sheets and the screenshots to look at, and
  what is left open.

## 5. Gemini images

Twenty-three of the chapter's seventy are spent. This sprint's ceiling is
**thirty-six** (3 + 3 + 4 + 4 + 2 + 6 + 6 = 28 planned, and 8 retries),
to 59 at most. Each image is named in its commit. At 60 spent in all,
the implementer stops painting and says so in the report; nothing is
asked beyond 70 without the owner. Text drafts: four briefs (30.6),
asked again when a draft is wrong in its facts.

## 6. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` in a normal window, a new game as a
girl and again as a boy, from chapter 3's first stop:

1. **Después del anochecer.** The dormitory at night: the two wake, open
   the door, the friend hands over the map, the three leave together.
2. **Las casillas** and **El pasillo de las puertas.** *Try it* opens the
   plan window, paused, with the corridor's cells numbered and the three
   figures named; closing it goes on. In the level no mark is shown;
   `move_right(14)` and `move_up(9)` win; the figures fade into the arch.
3. **Dónde estoy** and **El túnel oscuro.** *Try it* prints `(15, 3)`
   with no one seen; the plan shows the tunnel hatched and empty; the
   level is won without anything moving on the scene.
4. **La salida del túnel.** Two ways: the walk alone is caught in the
   watching way; the `if` wins both.
5. **Junto a las estatuas.** Dask below the statues looks left or right;
   the side he does not look at wins.
6. **Izquierda o derecha** and **La puerta equivocada.** The locked door
   refuses; the `if`/`else` wins both ways; the given program fails both
   ways until its branches are swapped.
7. **El pasillo de las tres puertas.** The nine lines win the walk and
   fail the lines goal; the `for` wins.
8. **Al otro lado de las puertas** and **Pasar al profesor.** Three ways;
   `wait(1)` is caught in one, the `while` wins all three.
9. **La losa que va y viene.** The hole shows when the slab is away; the
   `while not` wins both periods; the bonus asks `in_place`.
10. **La sala oscura.** Dark until *kirra*; the key appears; found,
    picked up, the door opened from the cell above it.
11. **Voces en el muro.** By the crack, the cold voice in italics; the
    three go down through the door.
12. **El paseo nocturno** and **Atrapados.** The key, the door, the slab,
    Dask's corridor in three ways; Dask steps out of the arch and lets
    them go; the chapter's map shows chapter 4's first stop locked.
13. In `?debug`, every scene's cells and masks look right; the sweep's
    and the doors' sheets show no figure cut wrong and no leaf with a
    loose corner.

## 7. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: every scene zoomed out, the plan window, each level's start
and win, each story's first step; the commits with their hashes and the
state of `ci/check.sh --e2e`; what differs from this plan and the design
document and why; what was written by hand in Gemini's drafts; the Gemini
images spent, named, and the count against 70; what is left open; and the
prompt for the designer's review.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-30.md (this plan, whole), drafts/chapter-3/capitulo-3.md
(the owner's design, in Spanish, with its pictures in
drafts/chapter-3/escenas/), docs/dev/sprint-15.md (how chapter 2 was
built), docs/dev/course.md ("How a level earns its idea" and chapter 3),
docs/dev/story.md, art/README.md whole, D51, D52, D53, D85, D100, D102,
D103, D112 to D118, D121, D123 and D130 to D133 in
docs/dev/architecture.md with its API, goal and events tables,
tools/write/README.md and rules.md, and the memory notes
kydux-two-agents, kydux-sprint-29-state, kydux-designer-review-29,
kydux-painted-scene-learnings, kydux-chapter-design-learnings and
kydux-writing-feedback. Build sprint 30 whole: pieces 30.1 to 30.8 in
order, one local commit each, ci/check.sh --e2e green before each,
never a push, never a timer (the owner pushes with ci/push.sh). Never
stop or build into the servers on ports 443 and 5173, and never kill a
vite, node or nginx process of the owner's (CLAUDE.md); your own
preview or dev server on 4174 is stopped when you are done. Gemini
paints at most 36 images in this sprint, each named in its commit, and
you stop and say so at 60 of the chapter's 70; Gemini writes every text
the child reads from the briefs the plan names, and you read and
correct every draft before it enters content/. The plan decides
everything; where it does not, take the smallest choice that keeps its
intent and say it in the commit; a choice that changes what the owner
sees is asked first, through the owner. Every document and comment in
the present. Before git add, read git diff of each file and stage only
your own hunks; commit promptly. Hand over what section 7 asks, as a
report in Spanish, and end with the prompt for the designer's review in
English, in a code block: the commits, the differences from the plan
with their reasons, what to look at with care, the images spent, what
is left open, and the limits.
```
