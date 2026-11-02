# Sprint 20 — The thresholds of the open doorways, and the doors as the page draws them

The owner's look at the doors after sprint 19 (2026-10-29, on commit
81139b9, the designer's review of 19.1) found three things on the eight
door panels composed as the page draws them: the line drawn at the foot
of Wenna's open doorway is too thick, dead straight, black, and sits a few
pixels under the jambs' feet; the centre door's open leaf is cut flat at
its foot, and the line left at that doorway's foot, the closed leaf's own
outline, is as heavy; the room door's open leaf lacks a sliver of its
lower left corner. The owner then chose, on mock-ups, how the foot of an
open doorway is finished: a threshold board inside the doorway, in the
material of the floor seen through it (D114). This sprint builds that
threshold, mends the three leaves, and adds the check sheet that showed
what the states sheet could not: every door composed with the scene's
rows. One piece, 20.1, and the hand-over. Chapter 3 is sprint 21, after
the owner's acceptance test of chapter 2 (sprint-19.md section 5).

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit, never a push, never a timer (nothing is pushed before
Friday 2026-10-30, and then only with `ci/push.sh`); every word for the
player through `t()` or a content file; nothing forbidden and nothing
secret; documents and comments in the present (CLAUDE.md); a chosen
painting is mended in boxes, never painted again (D88); reports show only
pictures of the current commit. Section 4 is the Gemini budget, section 5
the owner's acceptance test, section 6 the hand-over, section 7 the
prompt.

## 1. Decisions taken here

- **D114 — An open doorway ends in a threshold of the floor beyond it.**
  Decided 2026-10-29 by the owner, on mock-ups of a drawn line, a wooden
  board and a stone sill. At the foot of every open doorway filled by
  `repaint.py doorways` lies a threshold from one jamb to the other, 0.08
  cells high, inside the doorway: from the wall's edge inward, its foot
  on the jambs' feet, never over the floor before the door. It is made of
  the floor seen through the doorway, the `floor` box the fill is taken
  from: a plain strip of that floor turned a quarter, so that a wooden
  floor gives a board with its grain across the doorway and a stone floor
  a flagstone sill; a tenth darker than the floor, with its two edges
  drawn as thin, slightly wavy lines in the colour of that floor's own
  joints, never in the black of the outlines. The fill ends at the
  threshold's top; the threshold covers whatever outline of the closed
  leaf lay at the fill's foot. Where the floor before the door is stone,
  the painting's stone stays below the threshold with no line added.
  Rules out a straight line of the outlines' width drawn at the foot, a
  threshold laid over the floor before the door, and a leaf's outline
  left as a floor line.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| Wenna's open doorway (panel 4): the line at its foot is thick, straight, black and 2 to 5 pixels under the jambs' feet. | `sill_line`: a fitted straight line, LINE_WIDTH of the painting wide, in the jambs' outline colour, laid under the fill's foot. | 20.1: the threshold (D114) replaces `sill_line`. |
| The centre door's open leaf (panel 6) is cut flat at its foot. | The thing's box ends at 9.6 cells and the traced leaf reaches 9.705: the sprite crop cuts the last tenth of a cell (33 leaf pixels on the image's last row; a whole foot has 2 to 9). | 20.1: box to 9.8. |
| The centre door's open doorway (panel 6): a heavy line at its foot. | The fill stops on the closed leaf's own bottom outline (9.08 to 9.10), kept as "the threshold's own line". | 20.1: the fill goes through the leaf's outline; the threshold's foot is its lower edge. |
| The room door's open leaf (panel 8) lacks a sliver of its lower left corner. | The model painted that corner's outline pale; the polygon (points 30 to 34) follows the dark line and leaves the pale wood outside. | 20.1: those points moved outward about 0.03 cells. |
| The dormitory's open leaf: 15 pixels of the left wall remain on its upper left corner (not visible at 3×, found by measure). | `wall_left`'s hole is the leaf's polygon drawn hard; the leaf's edge is soft over one pixel and reaches beyond it. | 20.1: a hole covers the soft edge. |
| The states sheet of sprint 19 showed none of the first three: it composed each state on the ground alone, without the rows. | The sheet's scope. | 20.1: the doors sheet, every door composed as the page draws it. |

## 3. The piece

### 20.1 The thresholds, the three leaves, and the doors sheet (D114)

**The threshold (`tools/art/repaint.py doorways`).** `sill_line` and
`SILL_DARKEST` go; every door of `doorways` gets a threshold, with no new
key. Constants, in cells of the painting unless said: `THRESHOLD` 0.08
(its height), `THRESHOLD_SHADE` 0.1 (how much darker than the floor),
`THRESHOLD_LINE` 0.011 (its edge lines' width, about 2.5 pixels in the
library's painting, 2.2 in the dormitory's), `THRESHOLD_WAVE` 0.004 (the
lines' amplitude) with periods 0.3 and 0.1 cells, as `a·sin(2πx/0.3) +
a/2·sin(2πx/0.1 + 1)`. The method:

1. *Its foot* is the row the fill ends on, per column, `to_foot`'s fitted
   line (`feet`), with one change to `to_foot`: when the dark row it
   finds is contiguous with the leaf's foot, no lighter row between, it
   is the closed leaf's own outline (the centre door, 9.08; the room
   door, 6.00), and the fill goes down through it to its lower edge and
   looks no further; when a lighter row lies between, it is the floor's
   own line (the dormitory, 15.39) and the fill ends on its top, as now.
   Wenna's door keeps `sill` 0: its foot is the jambs' foot, 17.00.
2. *Its span* is the fill's at its foot, `first` to `first + len(feet)`.
3. *Its strip* comes from the door's `floor` box: the plainest strip
   `THRESHOLD` cells wide and the box's whole height tall (the least
   summed colour spread over its pixels, scanned every 4 pixels), turned a
   quarter so that what ran down the box runs along the threshold, resized
   to the span, darkened by `THRESHOLD_SHADE`. It is laid from the foot
   upward: rows `feet − THRESHOLD·spacing` to `feet`, per column, over the
   fill (the fill ends at its top).
4. *Its lines* are drawn on its top and bottom edges, `THRESHOLD_LINE`
   wide, antialiased (drawn four times larger and averaged, as
   `soft_area` does), their ends softened over three pixels, in the
   colour of the floor's joints: the mean of the darkest twentieth of the
   `floor` box's pixels. The bottom line's middle is on `feet`.
5. The threshold is laid into the `also` pictures as the fill is, never
   into the swung pictures.

Measured and put in the commit for each door: the foot row (cells, three
decimals), the span (cells), the strip's box in the painting, the joints'
colour, and the difference in levels between the painting's stone and the
rows just under the threshold at Wenna's door and the dormitory's (the
painting's own pixels there, 0 expected).

**The three leaves.** `art/scenes/the-library/cut.json`: `centre_door`'s
box `[6.6, 7.25, 9.45, 9.8]` (the open image's last row then holds a
rounded foot, under 10 leaf pixels, like the other three). `room_door`'s
`leaf`, points 30 to 34, moved outward to the edge where the swung picture
differs from the doorway picture by more than 10 levels: about 0.03 cells
down and left at the corner (`trace.py look` at scale 8 on
`library-room-swung.png`, box 1.2 5.9 2.2 6.5, with `--poly`). `tools/art/
export_scene.py`: a hole given as a polygon (`holes`) is cut as
`soft_area(...) > 0`, so that it covers the soft edge of the leaf it is
traced from; `wall_left`'s hole then leaves no pixel of wall on the
dormitory's open leaf (measure: 0 pixels of `row 13 static over` within
the leaf's alpha, as against 15 now).

**The doors sheet.** `export_scene.py <scene> check` writes `art/raw/
game-check/doors-<scene>.png` beside the states sheet: for every thing
with states, each state composed as the page draws the scene, with no
figure: the ground (the playable part, by `origin`), every row image and
every thing at its depth, in the order `sweep.load` and `painted.ts`
give, the other things in their resting state (`rest`, else their first
state), the thing in the state shown, with the state's own row and
`under` as the page applies them. Cropped round the thing's box with one
cell of margin, three times the page's size (twice for a thing 300 pixels
wide or more), numbered from 1 across the sheet, four panels a row, each
panel labelled `<n>. <thing> <state>`; the ground alone is not a panel.
Built on `sweep.load` and `sweep.window`, swapping the thing's layer for
the state's image and depth. Both sheets of both scenes are looked at
before the commit and kept as `s20-doors-<scene>.png` and
`s20-states-<scene>.png`.

**Acceptance of the cut, before the commit.** On the doors sheets: each
open leaf whole to its foot, its lower corners rounded (no flat edge at
the image's bottom); the threshold inside every open doorway, its foot on
the jambs' feet, the floor before the door untouched below it, no black
line; no outline of the closed leaf left at any doorway's foot. On the
states sheets: as sprint 19 left them. Then in the game, at zoom 2, each
door open and closed (`#story/the-first-night` after step 5 for the
dormitory's door; `#level/the-lost-book` for Wenna's; `#level/
the-hidden-key` won for the centre door; `#level/the-wrong-order` won for
the room door), a screenshot each, 1440 × 900, Spanish, the girl wizard
with the look `teal`.

**The dormitory and the library exported again** (`export_scene.py
<scene>`, about seven minutes each; `repaint.py doorways <scene>` first),
their sweeps green, their all-cells sheets kept as `s20-<scene>.png`.

**Tests.** `tests/tools/test_art.py`: the threshold lies between the
jambs with its foot on the fill's foot and two lines on its edges, and
nothing of it below the foot; the fill goes through a dark row contiguous
with the leaf and stops above one that is not; a hole polygon covers a
soft edge (`soft_area > 0`); the doors sheet has a numbered panel per
state and none for the ground. The test of `sill_line` goes with it. The
browser tests of chapter 2 as they are.

**Documents.** `docs/dev/architecture.md`: D108's sentence on the foot
says the threshold (D114); the parts list says the doors sheet.
`art/README.md`, "The rules for the cut-outs": the threshold in the
doorway rule, and `doors-<scene>.png` among the check pictures. The
`about` of `doorways` and of the four doors in both `cut.json`. The
docstrings of `repaint.py` and `export_scene.py`. All in the present.

## 4. Gemini images

None. The corner of the room door is in its swung picture; nothing is
painted.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` (the development server restarted
after the build, so that it serves the new `world.zip`), in a private
window, as a girl with the look `teal`:

1. **The doors sheets** `art/raw/game-check/s20-doors-the-dormitory.png`
   and `s20-doors-the-library.png`: the eight panels, numbered as the
   owner's look of 2026-10-29 numbered them (1-2 the dormitory's door,
   3-4 Wenna's, 5-6 the centre door, 7-8 the room door; closed then
   open). Panel 4: a wooden threshold inside the doorway, its foot on the
   jambs' feet, the stone below it as painted. Panel 6: the leaf's foot
   rounded; a wooden threshold, no black line. Panel 8: the lower left
   corner whole.
2. **In the game**, at zoom 2 with the + button: the dormitory's door
   open while Ilda is in the doorway (*The first night*) and shut after;
   Wenna's door from step 5 of *At the library*; the centre door once
   *The hidden key* opens it; the room door once *The wrong order* opens
   it. Each open doorway ends in its threshold; each open leaf is whole.
3. The rest of chapter 2 as sprint-19.md section 5 says, if not yet
   tried.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a
reader who does not know the code, and then its picture, only pictures
of the final commit:

1. **The thresholds and the leaves**: what was wrong and what is done,
   with the doors sheets of both scenes and the four game screenshots at
   zoom 2.
2. **The check sheets** (`s20-<scene>.png`, `s20-states-<scene>.png`) as
   this sprint leaves them.
3. The commit, with its hash, and the state of `ci/check.sh --e2e`.
4. What differs from this plan and why, the Gemini images spent (none
   planned), and what is left open.
5. The prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-20.md (this plan), docs/dev/sprint-19.md section 3
(what 19.1 built), D108, D111, D113 and D114 in
docs/dev/architecture.md, art/README.md ("The rules for the cut-outs"
and the check pictures), and the memory notes kydux-two-agents,
kydux-sprint-19-state, kydux-designer-review-19,
kydux-friends-server-4173 and kydux-painted-scene-learnings. Build
sprint 20: piece 20.1 as one local commit, ci/check.sh --e2e green
before it, never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only by the owner with ci/push.sh). Never stop or
build into the servers on ports 443 and 5173, and never kill a vite,
node or nginx process of the owner's (CLAUDE.md); a vite preview on
4173 is a leftover of a check run. The plan decides everything: the
threshold of D114 at every open doorway, in the method of section 3,
with every number it names measured and put in the commit; the centre
door's box, the room door's five points, the soft hole; the doors
sheet in `check`, looked at before the commit with the states sheet.
No Gemini image. Every document and comment in the present. Hand over
what section 6 asks, and end with the prompt for the designer's review.
```
