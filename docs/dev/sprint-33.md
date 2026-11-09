# Sprint 33 — The crossing one row down, the doors as painted at every tick, the leaves within their doorways

The owner read the fourth walkthrough of chapter 3
(`drafts/recorrido-capitulo-3-2026-11-07-4.es-comments.md`, 11 comments).
What they found: at the crossing the figures and the mark still stand too
high, in the wall's foot, and the statues sit higher on the plan than on
the scene; a figure shows through a statue; in the room of two doors the
open door changes from one tick to another, is badly drawn at the tick it
opens and at the run's end, and the wizard walks into the open leaf; the
way down's double door, opened wide, runs into the side walls. The owner's
answers of 2026-11-08 add three things: the slab's level gets the periods 5
and 7 as two more ways, so that no fixed wait found by trial wins; the common
room's door of the dormitory, whose floor through the doorway does not match
the room's, is mended if one edit does it cleanly; and the storeroom's open
leaf is kept, with (9, 13) not walked while it is open. This sprint asks two
Gemini images at most (the double door opened less, the common room's door
open) and no other painting.

The pieces, in this order: 33.1 to 33.6. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer; every word for the player through
`t()` or a content file, in English and Spanish; Gemini writes every text
the child reads from a brief, the owner's own words fixed; D148 holds:
nothing the child sees is painted, moved or pasted by a tool; documents
and comments in the present; no content edited while a browser run is
going. Section 4 is the Gemini budget, section 5 the owner's acceptance
test, section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D154 — The wall's foot row is not walked; the first floor row below
  it is.** Decided 2026-11-08 by the owner (*la maga está casi dentro de la
  pared; bajar todo una fila*). In the crossing, row 5, where the top
  wall's foot and the statues' bases are painted, is wall; the gallery's
  floor is rows 6, 7 and 8, row 8 walked behind the lower wall's top
  (D149 d). The statues stand on row 5 (`u` at (12, 5), (14, 5) and
  (17, 5)), their pictures on that row, so that a figure on row 6 passes
  before their bases and is not hidden. D149 c, the row under a wall's foot
  drawn 0.3 lower, applies to row 6. The same reading holds for every scene:
  the row the wall's foot is painted on is never walked. Rules out a figure
  whose head lies in the wall.
- **D155 — A cut-out's mask is opaque.** Decided 2026-11-08 by the owner
  (the wizard shows through the statue's robe). A mask made by difference
  (D148) is 0 or 1 everywhere but a one-pixel soft edge: where the
  difference is weak because the thing's colour is near the floor's, the
  pixel is inside the mask if it lies inside the mask's closed outline.
  Rules out a figure seen through a statue, a leaf or a torch.
- **D156 — A painted door shows its painted state at every tick.** Decided
  2026-11-08 from the owner's finding. A door with painted states is never
  drawn with the placeholder's frame: not at the tick it opens, not at the
  run's end, not when the timeline is scrubbed; where the picture of the
  hour or the state is not loaded, the page waits for it or draws the last
  painted state, never the placeholder. A browser test scrubs to the
  opening tick and to the end of *Izquierda o derecha* and holds the
  painted key on both doors. Rules out the drawn door of the placeholder on
  a painted scene.
- **D157 — An open leaf is measured where it lies, above and below its
  door, and a figure it touches steps aside.** Decided 2026-11-08 by the
  owner (*la maga está chocando con la puerta*). The cells an open leaf
  lies on (D125, `leaf_cells`) are measured on the rows above its door and
  on the rows below it, where a leaf swung toward the viewer hangs; a cell
  the leaf hides a figure on is covered while the door is open; a cell the
  leaf only touches, its foot or its edge over the figure's cell, is
  walked with the figure drawn 0.3 away from the leaf (down, or toward the
  doorway's middle), named in `nudged` by the tool. Rules out a figure
  walking through a leaf's foot.
- **D158 — A leaf opens within its doorway's width.** Decided 2026-11-08
  by the owner (*no vale con que aparezcan detrás del muro; deben quedar
  menos abiertas*). A door whose leaves, opened wide, would run into a wall
  beside the doorway is asked of the model opened less, each leaf turned
  toward the viewer only as far as the doorway's width allows, and the
  figures passing it are drawn toward the doorway's middle by 0.3 on its
  cells. No leaf is hidden behind a wall's box to make room. Rules out the
  way down's side-wall boxes of sprint 32.9.
- **D159 — The plan draws a cut-out where it is painted.** Decided
  2026-11-08 by the owner (the statues higher on the plan than on the
  scene). The plan (D151) draws every static cut-out and every door's state
  at its painted box, as the scene does, not from its cell. Rules out a
  thing on the plan a row off the scene.

## 2. The owner's comments, and what answers each

| # | Where | The owner (summary) | Piece |
| --- | --- | --- | --- |
| 1 | S1, step 5 | *Esta puerta* (the comment is cut short; the owner says the rest). | asked |
| 2 | P3 start | The wizard and the mark too high, in the wall; lower everything a row and redo the waits. | 33.2 (D154) |
| 3 | P3 plan | The statues higher on the plan than on the scene. | 33.4 (D159) |
| 4 | P4 start | The statues must be on the gallery's row, the wizards one row lower. | 33.2 (D154) |
| 5 | P4 tick 1 | The wizard shows through the statue's robe. | 33.1 (D155) |
| 6, 7, 9, 10 | P5 ticks 6, 9, 13; the other way's tick 8 | The open door changes between ticks: hinges on the other side, opened from the other side, badly drawn, as if old. | 33.3 (D156) |
| 8 | P5 tick 10 | The wizard walks into the open leaf: that cell drawn a little lower. | 33.1, 33.3 (D157) |
| 11 | P9 tick 5 | The way down's open doors mix with the wall: open them less, and move the wizard toward the middle. | 33.3 (D158) |
| 12 | Storeroom contact | The half-open door is fine, but (9, 13) must not be walked while it is open. | 33.3 |
| 13 | S1, step 5 | The common room's door: the floor through the doorway does not quite match the room's; mend it if it is easy and safe. | 33.3 |
| 14 | P7 (the owner's answer) | Add the periods 5 and 7 as ways, both primes, so that the common number is much harder to find. | 33.2 |
| 15 | The walkthrough | Not every way needs its route in the captures, so that the document is shorter. | 33.6 |

## 3. The crossing's levels

Rows 6, 7 and 8 walked, row 5 wall with the statues on it (D154); the
tunnel's arch (0, 5) to (1, 5) stays the way in, its first floor cell past
the arch (3, 6) (the cells (2, 6) to (2, 8) beside the arch stay walls, as
sprint 32 left them). Dask's corridor columns 8 and 9, rows 1 to 12.

**P3 `the-tunnel-exit`.** Start (4, 6), two cells past the arch, so that
two ticks of waiting are what it takes; friend at (3, 7), mate at (4, 7).
Dask `at` (9, 12), `facing` `up`, `patrol` `[[9, 1]]`. Goals: `reach` E at
(11, 6), the cell left of the first statue; `not_seen_by` `dask`. Solution:

```python
wizard.wait(2)
wizard.move_right(7)
```

Dask is at (9, 12 − t) at tick t, looking up: he sees (9, 6) from (9, 10)
to (9, 7), ticks 2 to 5; he stands on it at tick 6; from tick 7 he is
above it. The wizard reaches (9, 6) at tick 2 + 5 = 7. Wrong: the walk
alone (seen at tick 5), `wait(1)` (walked into at tick 6), `wait(2)` and a
walk of 6 (stops short). The texts' counts: seven cells, two ticks.

**P4 `by-the-statues`.** Start (11, 6); friend at (10, 6), mate at
(10, 7). Dask stands still at (13, 7), the gallery's middle row, between
the first statue (12, 5) and the second (14, 5) in the row below them;
two ways, `looking_up` (he sees (13, 6)) and `looking_down` (he sees
(13, 8)). Goals: `reach` E at (15, 8) `on_the_way`; `not_seen_by` `dask`;
the bonus `reach` E ending on the mark. Solution and its bonus:

```python
if dask.facing == "up":
    wizard.move_down(2)
wizard.move_right(4)
wizard.move_down(2)
```

```python
if dask.facing == "up":
    wizard.move_down(2)
wizard.move_right(4)
if dask.facing == "down":
    wizard.move_down(2)
```

Looking up: (11, 6) → (11, 8) → (15, 8), the mark, → (15, 10). Looking
down: (11, 6) → (15, 6), passing (13, 6) above Dask and before the statues'
bases, → (15, 8). Wrong: the walk alone (seen at (13, 6) in `looking_up`),
down two always (seen at (13, 8) in `looking_down`), the condition on
`"down"` (caught in both), the body not moved in. The unit tests of
`test_passages.py` hold both levels; the texts say the cells (33.5).

**P7 `the-moving-slab`, four ways.** `three` (period 3), `four` (4), `five`
(5) and `seven` (7), the slab at (3, 7) from tick 0 in place as D53 says.
The wizard is on (2, 7) at tick 2 and `in_place` tells of the next tick: in
`three` the slab is away at ticks 3 to 5 and the loop waits three; in the
other three it is in place at tick 3 and the loop waits none. A fixed wait
*n* before the step onto the slab, at tick 3 + *n*, wins every way first at
*n* = 29, beyond what a child finds by trial; a unit test holds that every
*n* from 0 to 28 loses in some way and that the solution wins all four. The
ways' names: *Cada tres ticks*, *Cada cuatro ticks*, *Cada cinco ticks*,
*Cada siete ticks* (33.5).

## 4. The pieces

### 33.1 The tools

- `export_scene.difference_mask` (D155): the mask binary after its holes
  are closed, a one-pixel soft edge; a test on a synthetic thing whose
  colour is near the floor's holds that no pixel inside the outline is
  partly transparent. Every chapter 3 scene exported again; the statues,
  the torch and the leaves checked on the sheets.
- `leaf_cells` (D157): measured on the rows below the door as well; a cell
  the leaf hides is `covers`, a cell it touches gets a nudge of 0.3 away
  from the leaf, written into `art.json` by the tool and read by the page
  and the plan; a test on the two doors holds (13, 9) or (13, 10),
  whichever the leaf's foot touches, nudged and not covered.
- `tools/walkthrough`: a tick's picture is taken once `data-fading` and
  `data-opening` are gone, so that no frame is taken through a fade.
- Check: `tests/tools`, `tests/project`.

### 33.2 The crossing one row down

`map.txt` (row 5 wall but the arch's cells, `u` on row 5 for the statues,
rows 6 to 8 floor), `scene.json`, `art.json` (the statues on row 5,
`lowered` row 6, the nudges round the arches on rows 6 to 8), P3 and P4
as section 3, their wrong programs and tests, the sweep green. The lesson
*Esperar*'s count (two ticks, seven cells) in 33.5. P7's two new ways and
their test (section 3). No image.

### 33.3 The doors

- D156 in `engine/scene.ts`: `doorLook` and the restart, the scrub and the
  run's end never set the placeholder's frame on a door with painted
  states; the browser test of D156 on *Izquierda o derecha* at its opening
  tick and its end, in both ways, and on the three doors.
- D158: the way down's double door asked of Gemini opened less
  (`way-down-open-half.md`: *the same two leaves, each turned toward the
  viewer only halfway, so that both stay within the doorway's width
  between the side walls; nothing else changed*), 1 image (+1 retry); its
  leaves by difference; the side-wall boxes `side_left` and `side_right`
  and the torch's standing over the leaves undone; the door's cells and
  the cell before and after nudged 0.3 toward the middle; the doors' sheet
  looked at.
- The two doors' leaf foot by D157 (33.1), the figure on the touched cell
  drawn 0.3 lower; the walkthrough's tick 10 looked at.
- The storeroom's `store_door`: its open leaf stays (the owner's answer);
  `covers` is (9, 11), (9, 12) and (9, 13), and the level test holds that
  (9, 13) is not walked while the door is open.
- The common room's door of `the-dormitory` (`front_door`, chapter 2):
  its open state asked of Gemini as an edit of the dormitory's painting
  (`dormitory-front-door-open.md`: *the same door open, the common room's
  floor seen through the doorway continuing the floor round it, nothing
  else changed*), 1 image (+1 retry); the leaf and the doorway by
  difference against the painting (D148), the old pictures set aside. If
  neither try keeps the rest of the painting (the difference leaks beyond
  the door's box), the door stays as it is and the commit says so: the
  owner accepts it as it is rather than a risk to chapter 2.
- Check: `ci/check.sh --e2e`, chapter 2's browser tests among them.

### 33.4 The plan

`plan.ts` (D159): a static cut-out and a door's state drawn at their
painted box, inked; a Vitest test holds that a statue's drawn box on the
plan equals its box in `art.json`. The crossing's plan looked at in P3
and P4.

### 33.5 The texts

Brief `chapter-3-crossing-counts.md`: *La salida del túnel* (start two
cells past the arch, seven cells to the first statue, two ticks), *Junto
a las estatuas* (Dask in the middle of the gallery below the first two
statues; the wizard on the row above him, against the statues' bases),
*Esperar*'s block (`wizard.move_right(7)`), the slab's two new ways'
names; the course book regenerated.

### 33.6 The walkthrough and the documents

The walkthrough takes the route tick by tick of a level's first way only,
and the won card of every way, so that the document is shorter (the
owner, 2026-11-08). `npm run walkthrough -- 03-passages` to a new document; `architecture.md`
D154 to D159 (D149 c and D125 say where D154 and D157 take over);
`art/README.md` *Where the cells are* with D154 and D157; `plan.md` 5.5;
the report in Spanish and the prompt for the review.

## 5. Gemini images

Two images and two retries at most: 82 of the chapter's 100.

## 6. What the owner tries

1. *La salida del túnel*: the three a row lower, in the gallery; two ticks
   of waiting, seven cells to the first statue; the mark on the floor.
2. *Junto a las estatuas*: Dask below the first two statues; passing above
   him before the statues' bases, or below him behind the lower wall's top;
   no figure seen through a statue.
3. The plan of the crossing with the statues where the scene has them.
4. *Izquierda o derecha* in both ways: the same painted leaf at every
   tick, at the tick it opens and at the end; the wizard clear of the
   leaf's foot.
5. *El paseo nocturno*: the double door opened less, within its doorway,
   the wizard passing its middle.
6. *La losa que va y viene* in four ways; `wait(5)` loses in one of them.
7. *La sala oscura* with the door open: no one on (9, 13).
8. *Después del anochecer*, step 5: the common room's floor through the
   open door, if the edit fitted.

## 7. What the implementer hands over

A report in Spanish with only pictures of the final commit (the crossing
whole, P3 and P4 at their start, the two doors at the opening tick and at
the end, the way down's door, the plan of the crossing), the commits, the
differences from the plan with their reasons, the image spent against 100,
the walkthrough document's path, what is left open, and the prompt for
the designer's review in English, in a code block.

## 8. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-33.md (this plan, whole), docs/dev/sprint-32.md (how
chapter 3's scenes are made), the owner's comments in
drafts/recorrido-capitulo-3-2026-11-07-4.es-comments.md (under each
picture, in Spanish: the sprint answers them), art/README.md whole,
D125, D148 to D159 in docs/dev/architecture.md, and the memory notes
kydux-two-agents, kydux-sprint-32-state, kydux-designer-review-32 and
kydux-designer-scene-states-method. Build sprint 33 whole: pieces 33.1
to 33.6 in order, one local commit each, ci/check.sh --e2e green before
each, never a push, never a timer (the owner pushes with ci/push.sh).
Never stop or build into the servers on ports 443 and 5173, and never
kill a vite, node or nginx process of the owner's (CLAUDE.md); your own
preview on 4174 is stopped when you are done. D148 holds: Gemini paints
every state of a scene and nothing the child sees is painted, moved or
pasted by a tool. Gemini paints at most two images in this sprint and
two retries, the way down's double door opened less and the common
room's door open, within the chapter's ceiling of 100. Every text the child reads comes from the brief the
plan names; you read and correct every draft before it enters content/.
The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit; a choice that
changes what the owner sees is asked first, through the owner. Every
document and comment in the present. Before git add, read git diff of
each file and stage only your own hunks; commit promptly. Hand over as
section 7 asks, as a report in Spanish, and end with the prompt for the
designer's review in English, in a code block.
```
