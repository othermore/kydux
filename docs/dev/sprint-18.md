# Sprint 18 — The stories as the owner sees them: doorways, walking together, the words on the scene

The owner's review of chapter 2 on the current build (2026-10-28, on the
development server, the version of commit 7cbe5af) shapes this sprint. The
review goes stop by stop through the first stories and levels, and Fable's
reading of it against the paintings, the maps, the stagings and the page
finds a few causes behind it: the dormitory's walls have no doorway, only
an open leaf painted on a wall seen from above, so that every figure walks
through the wall; a story step does one thing at a time, so that friends
walk one after the other and a teacher cannot open a door, step out and
shut it; the words on the scene shrink with the zoom, which the wheel
takes in leaps and the stories cannot change; a figure is drawn in its
cell's middle where the painting's strip is off the middle; the library's
open doorways are lit brighter than the room beyond; a thing moved away
from where it is painted keeps the painted offset; a found thing is shown
by its numbers, which mean nothing to a child. This sprint fixes each
cause in the tools, the page and the content, and restages the stories as
the owner asked. Section 2 maps every finding of the review to the piece
that answers it, so that nothing is lost.

The pieces, in this order: 18.1 to 18.9. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only with `ci/push.sh`); every word for the player
through `t()` or a content file; nothing forbidden and nothing secret;
documents and comments in the present (CLAUDE.md); Gemini writes every
text the child reads from a brief; a chosen painting is mended in boxes,
never painted again (D88); reports show only pictures of the current
commit. The Gemini budget is in section 4. Section 7 is the owner's
acceptance test, and section 8 says what the implementer hands over.
Nothing in this plan is left for the implementer to decide: where a
number is to be measured, the plan says what to measure and against what.

## 1. Decisions taken here

- **D102 — A scene's grid is laid out before the scene is painted.**
  Decided 2026-10-28 by the owner. The map comes first: the rooms, the
  walls, the doorways, the furniture and every strip a figure walks are
  drawn on the grid before any prompt is written, with every wall on a
  cell line, every doorway whole cells wide, every walked strip at least
  a cell wide and in the middle of its cells, every thing in whole cells,
  and no slanting perspective that takes a wall from one column into the
  next. The layout, drawn from the map by `tools/art/layout.py`, is the
  first picture of the painting's prompt, and a try is chosen only when
  its walls, doorways and furniture lie in the layout's cells, checked
  with the grid over the try before any cut is made; a try that is off
  is asked for again, not mended. Chapter 2's scenes were painted before
  this rule and are fitted to their grids by `nudged` cells (D105) and
  mends; the scenes still to paint (chapter 3's passages and night
  passages) keep to it. Rules out a painting chosen for its look and
  fitted to the grid afterwards, which cost three sprints in chapter 2.
- **D103 — A story step can do several things, and a figure can open and
  close a door.** Decided 2026-10-28 by the owner. A step's `do` is one
  action or a list of actions, each saying `by` whom (the step's speaker,
  or its `by`, when it does not say). The actions of one figure play one
  after another, in the list's order; the actions of different figures
  play at the same time, tick by tick, so that two friends walk together.
  A `walk` is a tile or a list of tiles, each reached in a straight line
  from the one before; a walk may end `vanish`ing, for a figure walking
  out of sight. `open` and `close` name a door of the story's things; the
  figure stands where it stands and the door changes state, as a level's
  door does. The camera keeps with the step's `by`, or its speaker: a
  teacher going down a corridor is not followed when the step is about
  the wizard. Rules out a story that walks one figure at a time and a
  teacher who vanishes in front of a shut door.
- **D104 — A doorway between two rooms seen from above is a gap in the
  wall; a door in a wall seen from the front is a thing with a state of
  rest.** Decided 2026-10-28 by the owner. A wall seen from above is a
  band, and its doorway is a gap in the band, whole cells tall, with the
  floor running through; no leaf is painted in it. A door in a wall seen
  from the front (the dormitory's door to the corridor, the library's
  three doors) is a thing with a closed and an open picture, and the
  scene's settings name the state it rests in (`rest`) when a level or a
  story does not place it: the library's doors rest open, the dormitory's
  front door rests closed. A story opens and closes it (D103); a level
  places it closed or open as its goals need. Rules out the slit with a
  leaf the dormitory had, which no figure could pass without crossing the
  wall, and a shut door that is taken out of the painting to save a
  picture.
- **D105 — A figure walks the painted strip: `nudged` cells.** Decided
  2026-10-28 by the owner. Where a painting's walked strip is not in the
  middle of its cells (a wall's band leaning across a column, trunks
  reaching into the next), the scene's settings name the cells and how
  far sideways, in cells, a figure standing on them is drawn (`nudged`,
  like `lowered`); the figure's cell, its depth, its words and its
  outline follow the drawing, and a walk between two cells glides between
  their drawn places. The map stays the map: a cell is walked or not.
  Rules out a figure drawn over the trunks it walks beside and a figure
  half behind a wall it walks along.
- **D106 — The zoom is the child's to set, finely, in every scene, and
  the words on the scene are always readable.** Decided 2026-10-28 by the
  owner. The zoom box (+, −, Find my wizard) is on a story's scene as on
  a level's. The buttons step through the zooms as before; the wheel
  turns the zoom a little at a time, between the same limits. Every scene
  opens at zoom 1 (a story on its camera's tile). A bubble and a thought
  are drawn so that their words are never smaller on screen than at zoom
  1, whatever the zoom: zoomed out, they keep their size on the screen;
  zoomed in, they grow with the scene. Rules out words of seven pixels
  under a teacher's face and a wheel that leaps from the whole scene to a
  close look in two notches.
- **D107 — A revealed thing glows.** Decided 2026-10-28 by the owner. A
  thing revealed (D85) is drawn as its own shape filled with the
  outline's yellow, half seen, beating, over whatever covers it, until
  the level ends: a filled shape reads as "it is here" whatever the
  thing's shape, where a line round a thin key reads as a bar across it.
  The wizard's outline where something hides it (the silhouette) stays a
  line, and it is counted and drawn only from the pixels of what is drawn
  in front of the wizard: an open door drawn under the wizard, or the
  empty part of an arch, never counts. Rules out the key's outline with a
  line through it and the wizard's outline lit where nothing hides it.
- **D108 — An open doorway shows the floor beyond at the room's own
  light.** Decided 2026-10-28 by the owner. The opening of an open door
  is filled with the floor of the room beyond, taken from the painting
  itself where that floor is plain, a little darker under the arch as a
  doorway is, and never brighter than the room; the fill covers the
  leaf and its threshold down to the floor's own outline, so that no line
  of the frame is left on the floor. Rules out a doorway lit like a lamp
  in front of a dim room, and Gemini's edits as the source of a fill the
  painting already holds.
- **D109 — A thing drawn away from where it is painted is drawn in the
  middle of its cell.** Decided 2026-10-28 by the owner. A thing a level
  places on another cell than the one it is painted on (D85) has the
  middle of its picture put at the middle of that cell, not the painted
  offset carried along, so that a book or a key is seen in its cell and
  not astride the one above. At its painted cell it is drawn as painted.
  Rules out a book that is in a cell and looks in the one above.
- **D110 — The child sees where a thing is; its numbers wait.** Decided
  2026-10-28 by the owner. In chapter 2 no text prints a position: the
  grid's numbers mean nothing to a child who does not see them, and a
  lesson with pictures of the counting would carry more than the chapter
  needs. A thing found with `find_nearest` is shown with `reveal`, taught
  in the same lesson as `find_nearest`, and a level puts a lost thing
  where the child can walk to it once it glows. `position` stays in the
  API for a later chapter that teaches it with a ruler on the scene;
  chapter 3's lesson *true or false* keeps `teacher.position` in its
  list until that chapter is reviewed on its painted scenes. Rules out
  `print(book.position)` as the way to find a book.

## 2. What the owner found, and which piece answers it

Every line of the owner's review, with the cause Fable found and the
piece that fixes it. Cells are column,row as `?debug` numbers them.

| The owner's finding | Cause | Piece |
|---|---|---|
| *The entrance* 1 of 8 speaks of the cold night outside; it was dusk. | The text. | 18.4, 18.7 |
| The teacher's words are tiny; no zoom buttons in a story; the wheel leaps; the zoom should start afresh in each scene. | The bubble is 15 px of the scene and shrinks with the zoom; the zoom box is the level screen's; the wheel steps through 0.5, 0.75, 1, 1.5, 2. Each scene does open at zoom 1 already. | 18.2 |
| "We are so tired, where do we sleep?" is not what a child says on arriving; Ilda should send them to rest because tomorrow is long. | The text. | 18.4, 18.7 |
| Going to the arch, the two children should walk at once. | One action a step. | 18.1, 18.7 |
| *The first night*: Ilda should go to the door, open it, step out, close it, and be seen going down the corridor if the camera is moved; at the same time as the friend goes to the other room. | One action a step; the door is part of the front wall's picture; the corridor is behind the wall in the map. | 18.1, 18.3, 18.5 |
| The mate should be inside the dormitory from the start; the friend leaves without a word to them otherwise. | The staging. | 18.5 |
| The friend crosses the wall instead of the doorway; and appears in bed instead of going to bed later, on their own. | The walls have no doorway (a leaf painted on a band seen from above); `sleep` is instant. | 18.3, 18.5 |
| The wall at the corridor's end does not join the other wall, and is another colour, a patch. | The corner mend of 2026-10-26. | 18.5 |
| 6 of 9: the mate cannot say "Hello {wizard}" without knowing the name; they should be inside, greet, give their name, point at the beds and ask the wizard's name; the mate also crosses the wall, and goes up through the trunks: the column should be the one before. | The staging; no doorway; the right room's floor strip is left of its column's middle (the wall's band leans into column 15, the trunks reach into 16). | 18.3, 18.5 |
| *Your bed*: the wizard crosses into the dormitory on row 8, through the wall; the doorway should be row 9, not walked now. To sleep one stands by the bed's trunk, not by the bed: say so. | No doorway (the gap is mended at rows 7–9 and the paths go through its middle, row 8); the texts. | 18.5, 18.7 |
| *The morning*: both should walk to the door at once. | One action a step. | 18.1, 18.5 |
| *At the library*: the door from the first room to the second is lit more from outside than from inside. | The doorway's fill is Gemini's lit floor. | 18.6 |
| "This is my own little door and I have just opened it for you" sounds odd: the door should be shut and Wenna seen opening it. | The library's doors are drawn open by default and a story cannot open one. | 18.1, 18.6 |
| *The lost book*: the outline lights on the seen part of the wizard going through the open door; on column 11 the figures hit the wall; the print of the position is used for nothing; the book should not be beside the ghost but far, among the book piles; the book sits too high in its cell; a rest of the frame of the second door is on the floor; a door the game opens and closes is never taken out of the picture; the revealed key has a line through it; after taking the key the wizard crosses the little table (3,9 to 3,10): make the table and the armchair not walked, and hide the key elsewhere, between the bookcases. | D107 (the outline's count), D105 (column 11), D110 (no position), the level's things, D109 (the book's offset), D108 (the fill and the frame), D104 (a door's rest state), D107 (the glow), the map (3,9 walked) and the level's key. | 18.3, 18.6, 18.7 |
| Before the next scenes, fit the grid first. | D102. | 18.8 |

Open since Fable's review of sprint 17 and taken up here: the library's
`kept` boxes that keep nothing or reach into walked floor (18.6), the
library's main double door drawn shut with a walked cell behind it (18.6).
Eldra's armchair, cut by the old difference method, is left as it is: its
cut-out is right on the sheet and a new cut would spend two pictures for
nothing seen.

## 3. The pieces

### 18.1 A story does several things at once (D103)

`app/src/content/stories.ts`:

- `Doing` becomes one `Action` or `Action[]`. An `Action` is `{ by?:
  string }` with one of: `{ walk: Tile | Tile[], vanish?: true }`,
  `{ face: Facing }`, `{ appear: Tile }`, `{ vanish: true }`, `{ sleep:
  string }`, `{ wake: true }`, `{ open: string }`, `{ close: string }`.
  A step's `by` is the default `by` of its actions and the camera's
  focus; without it, the step's `who` (a voice step with actions names
  `by`, so that the camera has someone).
- `storyEvents`: for each step, a queue of events a figure, built from
  that figure's actions in order (a walk is one `move` a cell, through
  each waypoint in a straight line, facing the way it goes; `vanish` on a
  walk is a `vanish` event after its last move; `open` and `close` are
  events of kind `open` and `close` with `data: { id }`, the actor the
  figure); then the queues are interleaved tick by tick: at each tick,
  each figure that has events left plays its next, in the order the
  figures first appear in the list; the tick advances while any queue has
  events. A speaker's bare `{ vanish: true }` keeps today's rule (it goes
  at the next step's start). The `say` event closes the step as now. The
  spans are as now. A single action behaves exactly as today, so that
  every `story.json` of chapter 1 is unchanged.
- The story's `things` may hold a door (`kind`, `id`, `at`, `art`,
  `open`): pack-world passes it through as a level's door.

`app/src/engine/scene.ts`: a `close` event on a door of the scene does
the opposite of `open`: the closed picture, the doorway's mark hidden
again (D79). A story's `open`/`close` play as a level's.

Tests: `app/src/content/stories.test.ts` (new): two walkers share ticks
and the longer walk goes on alone; waypoints turn; a walk ending in
`vanish` emits the vanish on the tick after its last move; `open` and
`close` events; a step with a single action gives the events of today;
the speaker's vanish still waits for the next step. The e2e story tests
of 18.5 cover the page.

### 18.2 The zoom, and the words on the scene (D106)

`app/src/engine/camera.ts`: the zoom is a number between `ZOOMS[0]` and
the last of `ZOOMS`, times `fit()`. `zoomBy(±1)` (the buttons) goes to
the next value of `ZOOMS` strictly above or below the current zoom.
`zoomWheel(deltaY)` multiplies the zoom by `1.1 ** (-deltaY / 100)`,
at most ×1.25 or ÷1.25 in one event, never past the limits and never
out further than `fits()` allows. `data-zoom` is the zoom rounded to
two decimals (the buttons land on the exact values, so the camera tests
hold). `canZoomBy` holds for the buttons as now.

`app/src/ui/story.ts`: the zoom box of `zoom.ts` on the story's frame,
at the same corner as on a level; *Find my wizard* there calls
`follow()`, which brings the camera back to the story's focus. The
labels through `t()` as they are.

`app/src/engine/speech.ts`: the bubble's and the thought's containers are
scaled by `max(1, 1 / camera.zoom)` when made and on every zoom change
(the scene tells `Speech` the zoom, or `Speech` reads the camera), so
that the words are never under 15 screen pixels. `around()` (the story's
window) takes the scaled bounds, which `getBounds` gives.

Tests: `camera.spec.ts` gains a story with the zoom box (`#zoom-in`
visible on `#story/the-first-night`, `data-zoom` 1 at the open, `0.75`
after one −); a unit test of the wheel's step in `camera` (or a Phaser-
free helper for the next zoom) covers ×1.1 a notch and the clamp; a
test that a bubble's scale is 1 at a zoom of 1 or more and 1/zoom below.

### 18.3 Figures on the painted strip, and four small things on the page

1. **`nudged` cells (D105).** In a scene's `cut.json`, next to
   `lowered`: `"nudged": [{ "cells": [[x0, y0], [x1, y1]], "by": -0.3 },
   ...]`, `by` in cells, negative to the left. `tools/art/export_scene.py`
   passes it into `art.json` as it passes `lowered`; `depth.ts` gains
   `nudgedBy(nudged, tile)` beside `loweredBy`; `scene.ts`'s `figureAt`
   adds it to the x. Everything that places a figure goes through
   `figureAt`, so the bubbles, the outline, the cover count and the walk
   tweens follow. The debug view's numbers stay on the cells. Unit test
   in `depth.test.ts`; the sweep's all-cells sheet draws the figure where
   the page does (the sheet is the owner's proof).
2. **A thing moved is centred (D109).** `painted.ts` `shiftOf`: when the
   level's tile is not the painted cell, the picture's middle goes to the
   tile's middle (`dx = tile.x + 0.5 − (left + width/2)/CELL` and the same
   down); at the painted cell, no shift. `shift.ts` and its test say it.
3. **Lying down is seen.** `scene.ts` `layDown`, when not `instant` and
   not `still`: the sprite glides from where it stands to the bed's place
   over `0.8 × tickDuration`, then takes the lying frame and the angle;
   `getUp` as now. The e2e `data-asleep` reads `lying` once the frame is
   taken.
4. **A door's rest state (D104).** A thing in `cut.json` may say
   `"rest": "open"` or `"closed"`; the export passes it; the page draws a
   door the level or story does not place in its rest state (the library's
   `wenna_door`, `centre_door`, `room_door`: `rest: "open"`; the
   dormitory's `front_door` of 18.5: `rest: "closed"`). Where the page
   chooses the default today (the static things giving up every door's
   cut-out, and the door drawn open), it reads `rest` instead.
5. **The revealed glow and the outline's count (D107).** `silhouette.ts`:
   in `always` mode (a thing revealed) the sheet made from the thing's
   texture is its solid pixels filled with `COLOUR`, drawn with no mask at
   the thing's position over everything (depth above every row), alpha
   beating between 0.35 and 0.75; `THING_THICK` goes. The wizard's line
   stays as it is. Then reproduce the owner's case: `#level/the-lost-book`,
   the wizard walked from 7,17 to 7,16 and 7,15 with Wenna's door open;
   the line must show only where a pixel of an image drawn in front of
   the wizard (greater depth, visible, alpha) covers a pixel of the
   wizard. If it shows on uncovered pixels, the mask's copies are placed
   or scaled unlike their sources, or an image is in `front` that is not
   drawn in front (the open door, the arch's polygon where the opening
   is); fix what is found and say it in the commit. `cover.test.ts`
   gains a case with an image under the figure and one over it.

### 18.4 The words (Gemini, reviewed)

One brief, `tools/write/briefs/chapter-2-replayed.md`, written from
section 5 of this plan, run once with `tools/write/write.py`, its drafts
read and corrected by the implementer against `tools/write/rules.md`
(natural Spanish from Spain, gender braces, `{friend}`/`{mate}`, spells
in italics, methods in backquotes) and kept in the scratchpad; each file
enters `content/` with the piece that stages it (18.5 the dormitory's
stories and *Your bed* and its lesson; 18.6 the library's; 18.7 the
entrance's). The brief says, file by file, which steps and sentences
change and that every other text stays as it is; the implementer diffs
the draft against the current file and keeps what the brief did not
ask to change. The course book (`tools/course_book.py`) is rebuilt after
18.7.

### 18.5 The dormitory: doorways, the corridor's door and corner, the two nights

**Three mends (D88), with Gemini, on `art/raw/game-dormitory/dormitory-mended.png`
(4800 × 3584; a cell is x = 1.5 + 192·c, y = −12.33 + 200.33·r):**

1. **The doorways as gaps** (`repaint` section `doorways`, two boxes on
   one canvas, one picture a try, two tries at most): left box columns
   8.4–9.8, rows 6.3–10.3 (x 1614–1883, y 1250–2051); right box columns
   14.8–16.35, rows 6.3–10.3 (x 2843–3141, y 1250–2051). Prompt
   (`tools/art/prompts/game-dormitory-doorways.md`): in each box the wall
   between two rooms, seen from above as a narrow band, has its doorway:
   take the open door leaf away and open the band from the top of row 7
   to the bottom of row 9 (y 1390 to 1991), so that the wooden floor runs
   through with its planks continuous with the floor on both sides; the
   band ends in a squared post at the top of the gap and begins again
   below it; same light, same colours; everything else pixel for pixel.
   The chosen try joined with `repaint.py join`; the ground-only picture
   and the marked picture are not touched (the walls are polygons and no
   bed's box reaches the boxes).
2. **The corridor's end wall** (the existing `repaint` section, a new
   prompt `game-dormitory-corner-2.md` and a taller box: columns 21.4–24,
   rows 13.4–18, x 4110–4609, y 2672–3584; two tries at most): the
   corridor ends at the right against the castle's outer wall; continue
   that wall's stones straight down from the wall above the box, the same
   stones, colour and light as the wall above and as the front wall of
   the rooms, joined to both without a seam; the corridor's flagstones
   meet its foot with the same dark outline as everywhere; the torch
   stays. If neither try joins, keep the present corner and say so.
3. **The front door open** (a new section `front_door`, box columns
   11.3–13.4, rows 12.3–15.5, x 2171–2574, y 2452–3093; two tries at
   most): the door open, its leaf swung inward and out of sight, the
   opening dark as a room seen from a lit corridor, the arch's stones and
   the wall untouched. The picture is the `open` state of the `front_door`
   thing below, cut with the closed door's mask.

**`art/scenes/the-dormitory/cut.json`:**

- `wall_left` and `wall_right` become two statics each (`wall_left`,
  `wall_left_lower`, `wall_right`, `wall_right_lower`), polygons measured
  on the mended painting: the upper from row 4.05 down to the gap's top
  post, the lower from the gap's bottom to 13.53; both `over`, `solid`,
  `static`; the `fixed` foot stays with the lower.
- `front_wall`: its polygon ends at the wall's foot, the line between the
  stone face and the flagstones (about row 15.3, measured), its box to
  15.4; it keeps the arch's stones and gives up the door's cut-out as
  every static does. The corridor below is ground.
- `front_door` (new): `kind` door, `at` [12,13], `row` 13, `box` [11.3,
  12.4, 13.4, 15.4], `mask` `polygon` traced by hand round the leaf's
  outline (D93 snaps it), `under: true`, `solid: true`, `rest: "closed"`,
  states `closed: "painting"`, `open: { picture: <the mend's picture>,
  with the closed mask }`.
- `nudged`, measured as D105 says (dx = the strip's middle − the cell's
  middle, the strip from the wall polygon's edge to the bed frame's box
  at the row's middle, rounded to 0.05; the sheet shows every figure
  between the wall and the trunks, touching neither). Starting values
  from Fable's measurement, to be checked: column 8 rows 5–6 −0.05, rows
  7–8 −0.30, rows 9–10 −0.45, rows 11–13 −0.65; column 9 rows 7–9 −0.30;
  column 15 rows 7–9 −0.10; column 16 rows 5–6 −0.40, rows 7–8 −0.25,
  rows 9–10 −0.10, rows 11–13 none.

**`content/scenes/the-dormitory/map.txt`:**

```
#########################
#########################
#########################
#########################
#########################
####uuuu.#.uuu.#.uuuu####
####u....#.....#...uu####
####uuuu..uu.uu..uuuu####
####uuuu.....u...uuuu####
####u........u.....uu####
####uuuu.#.....#.uuuu####
####u....#.....#...uu####
####uuuu.#.....#.uuuu####
####uuuu.#.....#.uuuu####
############.############
.........................
#########################
#########################
```

Rows 7–9 are the doorways on both sides (15,9 is walked now); 12,14 is
the inside of the door; row 15 is the corridor, walked end to end for
the stories (a level never reaches it: the front door is closed and
solid). `scene.json`: the `forbidden` cells are 9,7, 9,8 and 9,9 alone
(`not_my_dormitory`); 8,14 goes. The scene's things gain `front_door`
with its `rest`.

**The stories** (`story.json`; the words in 18.4):

*The first night* — wizard 11,12 up; friend 10,12 up; ilda 12,12 up
(before the door); mate 16,6 down (inside the right dormitory, by the
first bed); camera 12,10. Nine steps:

1. voice — none.
2. ilda — none.
3. ilda — none.
4. friend — none.
5. voice, `by: "wizard"` — `[{"by":"ilda","open":"front_door"},
   {"by":"ilda","walk":[12,15]}, {"by":"ilda","close":"front_door"},
   {"by":"ilda","walk":[3,15],"vanish":true},
   {"by":"friend","walk":[[10,8],[8,8]]}]`.
6. voice, `by: "wizard"` — `{"walk":[[11,10],[14,10],[14,9],[16,9],[16,7]]}`.
7. mate — `[{"by":"friend","sleep":"bed_6"}]`.
8. wizard — none.
9. voice, `by: "mate"` — `[{"by":"mate","walk":[16,5]},
   {"by":"mate","sleep":"bed_1"}]`.

*The morning* — wizard 16,8; mate asleep in `bed_1` (16,5); camera 15,8.
Six steps:

1. voice — none.
2. mate — `{"wake": true}`.
3. wizard — none.
4. mate — none.
5. voice, `by: "wizard"` — `[{"by":"wizard","walk":[[16,9],[14,9],[14,10],[12,10],[12,12]]},
   {"by":"mate","walk":[[16,9],[14,9],[14,10],[13,10],[13,12]]}]`.
6. voice, `by: "wizard"` — `[{"by":"wizard","open":"front_door"},
   {"by":"wizard","walk":[[12,15],[11,15]]}, {"by":"mate","face":"left"},
   {"by":"mate","walk":[[12,12],[12,15]]}, {"by":"mate","close":"front_door"}]`
   (the mate's turn takes the tick the wizard opens the door in, so that
   they never share a cell).

**The level *Your bed*** (`level.json`): `start` [16,7] (where the story
leaves the wizard, facing the mate's bed); the rest as it is (the mate
asleep in `bed_1`, `bed_1` not free, the goal `sleep` in `bed_2`, the
bonus `no_bumps`). `solution.py`: `wizard.move_down()` then
`wizard.sleep()`. The `wrong/` programs made to fail as their names say
from the new start. The lesson *Each thing in its place* keeps
`try: "refused"`: at 16,7 no bed's trunk is beside the wizard.

**Tests:** `story.spec.ts` "a figure who goes says its words first" moves
to the unit test of 18.1 and the e2e checks the new staging: Ilda at
12,12 through step 4, gone after step 5 with the friend at 8,8, the mate
at 16,6 from the start; `chapter-2.spec.ts` keeps its nine Nexts and
`data-asleep`; the morning's test keeps `mate:16,5` after its first
Next and gains the end: the wizard at 11,15, the mate at 12,15, the door
closed; `your-bed` tests take the new start. The sweep and the all-cells
sheet (`art/raw/game-check/all-the-dormitory.png`, kept as
`s18-the-dormitory.png`): the figure seen whole on 9,7–9,9 and 15,7–15,9,
between the wall and the trunks on columns 8 and 16, on the corridor on
row 15, and inside the doorway on 12,13 and 12,14 with the door open.

### 18.6 The library: the doorways' light, the lost book, the hidden key

**`tools/art/repaint.py doorways` (D108):** a door's `floor` is a box of
plain floor of the room beyond, in the painting (`"from": "painting"`),
not an edit's; the fill tiles that floor into the leaf's shape, darkens
it by 15 % at the arch's top fading to 0 at the threshold, and reaches
down to the floor's own outline below the door, so that the threshold's
line is covered (the owner's "rest of the frame" at 7,9). The boxes:
`wenna_door` from the main hall's plain floor (columns 7.1–7.9, rows
10.2–11.0); `centre_door` from the aisle's (columns 7.1–7.9, rows
6.1–6.9); `room_door` from the aisle's too (Eldra's room shows no plain
floor). The three doors re-exported; the sheet shows each opening no
brighter than the room beyond.

**The map** (`content/scenes/the-library/map.txt`): row 9 becomes
`#uuu.u...u.u###` (1,9, 2,9 and 3,9 are the armchair's back and the
little table, not walked); row 20 becomes `##....###....##` (the main
double door's cells 6,20, 7,20 and 8,20 are behind the shut door, not
walked). Every level's start and every actor's cell checked against it
(none stands there).

**`cut.json`:** `nudged` column 11, rows 9–15, −0.30 (the strip between
the floor's edge and `wall_vault` at 11.5). `rest: "open"` on the three
doors (18.3). The `kept` boxes: #7 (the wand rack's foot), #8 and #9 (the
reading room's candles, whole walked cells) removed; #2 removed (inside
#13); #3, #5, #6, #15 and #16 tightened to the pixels of the thing each
keeps (the armchair's top, the coping, Wenna's door's sides), none into
a walked cell; the sweep green after it, and each box left named in the
commit as D94 asks. The field's bush box (13.7, 15.18, 14.4, 15.7) named
in this commit too.

**The levels:**

- *The lost book*: `old_book` at [2,15] (on the floor beside the book
  piles at the left wall; drawn centred there, D109); `api` without
  `wizard.position` and `thing.position`, with `thing.reveal`; goals:
  give to Eldra, bonus `uses reveal`; `solution.py`: find, reveal,
  `move_up(2)`, `move_left(5)`, `pick_up`, `move_right(9)`, `move_up(4)`,
  `move_left(7)`, `give(book)`; the `wrong/` programs made to fail as
  named.
- *The hidden key*: the key at [3,14], `hidden`, under the front
  bookcase, picked up from 3,13 or 3,15; `api` without the positions;
  `solution.py`: find, reveal, `move_down(2)`, `move_left()`, `pick_up`,
  `move_up(3)`, `move_right(4)`, `move_up()`, `door.open()`,
  `move_up(3)`; `wrong/` as named.
- *The moving key*, *The wrong order*, *The high shelf*, *Eldra's book*:
  `api` without `wizard.position` and `thing.position`.
- Chapter 3, *The dark room*: `thing.reveal` in its `api`, and its
  solution reveals the key instead of printing its position.

**The lessons' `lesson.json`:** *What things know* teaches
`wizard.items`, `door.locked`, `concept:print`; *Finding things* teaches
`wizard.find_nearest`, `thing.reveal`, `wizard.give`; *Keys and doors*
teaches `door.open`. `docs/dev/course.md`'s rows say the same. The
check that every method a level lists is taught before it (Fable's
script of 17.13, now `tests/test_course.py` if it is not there yet)
stays green.

**The story *At the library***: the story's `things` hold `wenna_door`
closed (`at` [7,16], `art` `wenna_door`, `open: false`); step 5 is
`wenna` with `[{"walk":[7,17]}, {"open":"wenna_door"}, {"walk":[6,17]}]`;
the rest unchanged. *The lost book* starts with the door open as it does.

**Tests:** `chapter-2.spec.ts` "the hidden key is out of sight until it is
revealed" asserts the key at 3,14 is not seen (covered) and glows after
`reveal`; a test that *The lost book*'s book is drawn in 2,15's middle
(`data-things` or the thing's sprite position); `camera.spec.ts`'s
library story unchanged; the sheets `s18-the-library.png` and
`sweep-the-library.png`: no figure over the wall on column 11, the three
doorways at the room's light, no frame on the floor at 7,9 and 7,17.

### 18.7 The entrance: the two children walk together

*The entrance* (`story.json`): step 7 is the voice, `by: "wizard"`, with
`[{"by":"wizard","walk":[20,8]}, {"by":"friend","walk":[19,8]}]`; the
rest as it is. The words of steps 1, 4, 5, 6, 7 and 8 from 18.4. The
test "Ilda goes dark as she walks into the middle arch" holds; the
stories test of chapter 2 tells every story to its end.

### 18.8 The grid first (D102): the rule and the tool

- `tools/art/layout.py <scene>` draws `art/raw/<scene>/layout.png` from
  `content/scenes/<scene>/map.txt` and `scene.json`: the grid at the
  painting's size, walls dark, furniture cells hatched, doorways and
  walked strips light, every cell numbered; and with `--over <try.png>`
  lays the grid over a Gemini try, so that a try is judged before it is
  chosen. Tests in `tests/tools/`.
- `art/README.md`, "What a scene is painted for": the first rule is the
  layout (D102): the map before the prompt, the layout as the prompt's
  first picture, a try chosen only when its walls, doorways and furniture
  lie in the layout's cells; "Doors are doorways" says that a doorway
  between rooms seen from above is a gap whole cells tall with no leaf
  (D104). "The rules for the cut-outs" gains `nudged` (D105), `rest`
  (D104) and the doorway fill from the painting (D108).
- `docs/dev/plan.md`: the chapter 3 scenes' line says they are laid out
  on the grid before they are painted.

### 18.9 Documents and the report

`docs/dev/architecture.md`: D102 to D110 in the decision log, in the
words of section 1; the story's grammar (D74's part on steps) says what
a step may do; the parts list names `layout.py`. Every document and
comment touched says the present. The report (section 8), the memory
note for Fable's review, and the course book rebuilt.

## 4. Gemini images

At most **eight** in the sprint, each named in the commit that spends it
and counted in the report: the dormitory's doorways (2), the corridor's
corner (2), the front door open (2), and two in reserve for a try that
goes wrong. The library's doorways spend none (D108 takes the floor from
the painting). Where the budget runs out, the implementer stops and says
what is left.

## 5. What the texts say (for the brief of 18.4)

The brief lists these files and, for each, the steps or sentences that
change and what they must say; everything else stays as it is. Both
languages; the Spanish from Spain; the mate's and the friend's gendered
words as `rules.md` says. The implementer writes the brief from this.

**Stories.**

*The entrance* (`content/stories/the-entrance/text.*.json`, eight
steps): 1, the voice: the hall, enormous and bright, the red carpet, the
armour in the torchlight; outside the night is falling while the castle
is warm and welcoming (not "the cold night outside"). 2 and 3 as they
are. 4, the wizard: a child's wonder at the place, nothing of being
tired or of where to sleep. 5, the friend: as it is (eager to see it all
tomorrow). 6, Ilda: tomorrow is a long day, so she takes them now to the
first-year dormitory to rest; follow her. 7, the voice: the two follow
Ilda across the hall, side by side, under the chandelier. 8, Ilda: as it
is.

*The first night* (nine steps): 1, the voice: the common room, the fire,
the round rug, the two doorways to the dormitories, one on each side.
2, Ilda: as it is (which side sleeps where; the common room shared).
3, Ilda: tomorrow is a long day; good night to the three; see you in the
morning. 4, the friend: as it is (good night, {wizard}; so tired; see you
tomorrow). 5, the voice: Ilda goes out through the door and closes it
behind her, and her steps go away down the corridor; {friend} crosses the
left doorway into the other dormitory and stops by a bed. 6, the voice:
you cross the right doorway into your dormitory, between the beds; by the
first bed, under the window, someone is waiting for you. 7, the mate:
hello; I am {mate}; I think we share this dormitory; this bed by the
window is mine, and I think yours is the one beside it; what is your
name? 8, the wizard: I am {wizard}; glad to meet you; glad to share the
room; so tired. 9, the voice: {mate} goes to the first bed, slips under
the sheet and falls asleep; you are tired too; your bed is the next one,
and to sleep in a bed one stands beside the trunk at its foot. (At the
other side {friend} is already asleep: the voice may say it in 9, not
before 7.)

*The morning* (six steps): 1 to 4 as they are. 5, the voice: you leave
the dormitory together, through the common room to the door; {mate}
follows close behind. 6, the voice: you open the door and go out into the
castle's long corridors, {mate} with you, toward the library.

*At the library* (six steps): 1 to 4 as they are. 5, Wenna: this is her
own little door; she opens it for them; the main library begins behind.
6 as it is.

**Lessons.**

*Each thing in its place* (`content/lessons/the-right-place/*.md`): the
sleep rule is said exactly: `wizard.sleep()` lies the wizard down in a
free bed, but only when the wizard stands beside the trunk at the foot
of that bed; elsewhere the wizard wonders why and nothing happens; a
program walks to the right place first. The *Try it* page: the wizard is
in their own dormitory, between the beds but away from every trunk; try
to sleep here and see what the wizard says. No "arch": the dormitories
open on the common room through a doorway on each side.

*What things know*: the examples of attributes are `door.locked` and
`wizard.items`, no `position`; the rest and the try (`print(door.locked)`
on the door Wenna has just opened) as they are.

*Finding things*: `find_nearest` gives the thing itself, even far away;
a variable keeps it; `None` when there is none; then a new page: to see
which thing the name holds, `book.reveal()` makes it glow where it is,
even through what hides it, and from then on you know where to walk;
`wizard.give(book)` hands it to whoever stands beside the wizard. The
try: `book = wizard.find_nearest("book")` then `book.reveal()`; Eldra
has lost a book somewhere among the piles by the left wall; let us find
it and make it glow. No `position`.

*Keys and doors*: `door.open()` works only beside the door, and a locked
door only with its key carried; the page "Hidden things": a thing out of
sight is still there for the program; `find_nearest` finds it and
`reveal` shows it through whatever hides it, as you learned; the try:
find the key and reveal it; the key of the door ahead fell under the
bookcase long ago and no one has seen it since.

**Levels.**

*Your bed*: the intro, by the mate: this is our dormitory; the free bed
is the one beside mine; to sleep, stand beside its trunk and then sleep.
Hints: 1, `sleep` works only beside the trunk at the foot of a free bed,
and the free bed is the one below {mate}'s; 2, one step down puts you
beside its trunk; 3, then the method `sleep`. Starting code: one comment
saying what to do. Outro and learned as they are.

*The lost book*: the intro, by Wenna: Eldra lost a book long ago; it must
be in one of the piles on the floor by the left wall; find it with
`find_nearest`, make it glow, bring it to her. Goals: give Eldra her
book; make the book glow with `reveal` (the bonus). Starting code: one
comment. Hints: 1, `find_nearest` with "book", kept under a name, then
`reveal` on it; 2, walk to where it glows, two steps up and then left
along the bookcases, and `pick_up`; 3, back to Eldra by the passage on
the right and `give` with the name. Outro and learned as they are, the
learned adding that a revealed thing shows where to go.

*The hidden key*: the intro: the way goes on through that locked door;
its key fell under the big bookcase long ago, where no one can see it;
find it, show where it is, pick it up, open the door and go through.
Starting code: one comment saying the key is under the bookcase. Hints:
1, find and `reveal`; 2, walk to the glow, down beside the bookcase, and
`pick_up` from beside it; 3, to the door, `open`, and through. Goals,
outro and learned as they are.

## 6. How the implementer works

As in sprint 17: one piece at a time, `ci/check.sh --e2e` green and a
local commit per piece named after it (`18.5: The dormitory`), never a
push, no timers; every scene exported looked at in
`art/raw/game-check/all-<scene>.png` and `sweep-<scene>.png` before the
commit, and each piece's sheet kept as `s18-<scene>.png`; D88 kept; the
Gemini images counted. A text the child reads is Gemini's from the
brief, corrected; a sentence too small to brief is corrected by hand and
said so in the commit. Where this plan gives a number to measure, the
commit says the number found.

## 7. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` (or `https://hija.local:5173/?debug`),
in a private window, as a girl with the look `teal` and as a boy with
`amber`:

1. **The entrance.** Step 1 speaks of night falling, step 6 Ilda sends
   them to rest. At step 7 the wizard and the friend walk up the hall at
   once, side by side, and darken under the arch.
2. **The zoom.** In the story, the + and − buttons are on the scene; the
   wheel turns the zoom a little at a time; zoomed all the way out, the
   teacher's words read as large as at the start.
3. **The first night.** The three stand before the door; the mate is
   inside the right dormitory from the start. After Ilda's good night and
   the friend's, Ilda opens the door, steps out, the door closes, and she
   walks away to the left along the corridor (drag the camera down to see
   her go) while the friend goes through the left doorway, in the gap in
   the wall, and stops by a bed. The wizard walks round the round table
   and through the right doorway's gap, up the strip between the wall and
   the trunks, touching neither, and the mate greets, says their name and
   asks yours. While the mate speaks, the friend lies down. At the end the
   mate walks to the first bed and is seen lying down. The corner wall at
   the corridor's end joins the walls above and beside it.
4. **Your bed.** The level starts where the story ended. `wizard.sleep()`
   alone is refused with the wizard's thought; one step down and `sleep`
   wins; the lesson and the intro say "beside the trunk".
5. **The morning.** The two walk to the door at once, the mate close
   behind; the wizard opens the door, both step out, the door closes.
6. **At the library.** Wenna's door is shut until she walks to it and
   opens it; the opening shows the room's floor at the room's light, not
   brighter.
7. **The lost book.** No outline lights on the wizard going through the
   open door; on column 11 the figures walk clear of the wall; the book
   lies in the middle of 2,15 beside the piles; `book.reveal()` makes it
   glow as a filled shape; no line of a frame on the floor at 7,9 or 7,17.
8. **The hidden key.** The key is under the front bookcase at 3,14, not
   seen until `reveal`, then a glowing key shape through the shelf; the
   wizard never walks 1,9–3,9; the door at 7,8 is drawn shut until opened.
9. **Nothing prints a position** in chapter 2's lessons or hints.
10. The check sheets handed over show every walked cell with the figure
    where the page draws it.

## 8. What the implementer hands over

A report in Spanish, one thing after another, each explained for a
reader who does not know the code, and then its picture, only pictures
of the final commit (memory: no before/after):

1. **Each piece**, what it is and what was done, with a picture from the
   game (1440 × 900, Spanish, a girl wizard with the look `teal`): the
   two children walking up the hall; the zoom box on a story; Ilda at the
   open door and away down the corridor; the friend in the left doorway's
   gap; the mate greeting; the morning's exit; Wenna opening her door;
   the lost book glowing by the piles; the hidden key's glow under the
   bookcase; the corner wall.
2. **The check sheets** of the dormitory and the library as this sprint
   leaves them, and a table of the owner's cells (section 2) with what
   each shows now.
3. What differs from this plan and why, every number measured, the Gemini
   images spent, what was corrected by hand in the texts, and what is
   left open.
4. The prompt for Fable's review.

## 9. The prompt for Opus

```
Read /home/other/Projects/kydux/CLAUDE.md, then docs/dev/sprint-18.md
(this plan), docs/dev/sprint-17.md sections 1 and 5, art/README.md,
tools/write/README.md and tools/write/rules.md, and the memory notes
kydux-sprint-17-state, kydux-friends-server-4173 and
kydux-painted-scene-learnings. Build sprint 18: pieces 18.1 to 18.9 in
order, one local commit per piece, ci/check.sh --e2e green before each,
never a push, never a timer (nothing is pushed before Friday
2026-10-30). Never stop or build into the servers on ports 4173 and 443,
and never kill a vite or nginx process (CLAUDE.md). The plan decides
everything; where it says to measure, measure and say the number in the
commit. A chosen painting is mended in boxes with tools/art/repaint.py
and never painted again (D88); at most eight Gemini images, each named
in its commit. Gemini writes every text the child reads from the brief
of 18.4 built from section 5; read, correct (Spanish from Spain, the
gender braces, {friend} and {mate}) and keep what the brief did not ask
to change. Every document and comment in the present. Hand over what
section 8 asks, and end with the prompt for Fable's review.
```
