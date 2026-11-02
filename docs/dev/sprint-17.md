# Sprint 17 — The cut made exact: outlines, doors, beds, and the three pupils

The owner's review of sprint 16 (2026-10-27), on the report's pictures and
on the all-cells check sheets of the four scenes, shapes this sprint. The
review lists some sixty cells and a dozen pictures where the cut is wrong,
and Fable's reading of them finds a few causes behind nearly all of them.
This sprint fixes the causes in the tools and the page, and uses the
owner's cells as the proof that each cause is gone. A handful of findings
are their own: the beds, the pupils, Baro, the lamp, the figures' size.
The sprint ends with a lesson for every scene still to be painted, so that
chapter 3's scenes are painted for the cut and need none of this.

The pieces, in this order: 17.1 to 17.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only with `ci/push.sh`); every word for the player
through `t()` or a content file; nothing forbidden and nothing secret;
documents and comments in the present (CLAUDE.md); Gemini writes every
text the child reads from a brief; a chosen painting is mended in boxes,
never painted again (D88). The Gemini budget is in section 4. Section 7 is
the owner's acceptance test, and section 8 says what the implementer hands
over.

## 1. Decisions taken here

- **D93 — A cut-out ends at the outer edge of the thing's dark outline.**
  Decided 2026-10-27 by the owner, from the field's sheet. Every raised
  thing in Kydux's art is drawn with a dark outline all round; the outline
  is of the thing, and nothing of the ground beyond it is. So a cut-out
  takes the outline whole, and takes no pixel of grass, path or floor
  outside it. The tools make it so for every mask, however it was found
  (the difference with an edit, a polygon, a box): the mask is *snapped*
  to the outline, grown into the dark pixels that touch it and trimmed of
  the ground-coloured fringe outside them. The sweep checks it on every
  scene: a mask with ground-coloured pixels beyond its outline (`fringe`)
  or with outline pixels left out beside it (`bare`) is a failure, named
  by cell. Rules out a mask edge set by a colour threshold's whim, which
  the owner saw as grass cut with a tree and outlines left on the ground.
- **D94 — A thing's foot is where its outline ends, and the map agrees
  with it.** Decided 2026-10-27 by the owner. The row a thing stands on
  is the row that holds the lowest pixel of its outline; a thing never
  reaches below that row, and the cell it stands on is not walked on. The
  export no longer clips quietly what reaches below a thing's row: the
  sweep reports it (`spill`), with the cell, and the scene is fixed by
  giving the thing its true row and marking the cell, or by mending the
  painting. Rules out a figure drawn standing on a rock's base or in front
  of a tree it is behind, and the same figure behind a thing on one row
  and over it on the next.
- **D95 — Doors and arches are over whoever stands in them; a wall seen
  from above is over everyone; a counter hides half of who stands behind
  it.** Decided 2026-10-27 by the owner. A thing marked `"under": true`
  (a door, its arch, a bed's foot board a sleeper lies behind) is drawn
  over a figure standing on its own row too, not only on the rows above:
  its depth is its row plus 0.85, a figure's its row plus 0.8. A static
  thing marked `"over": true` (a wall that divides two rooms, seen from
  above; a front wall a figure walks behind) is drawn over every figure
  whatever its row, and the wizard's outline shows through it as through
  anything in front. A scene may name `lowered` cells: a figure standing
  on one is drawn lower by the fraction given, its depth unchanged, so
  that a counter cut on the row below hides its legs. Rules out the
  wizard over the door it walks through, a figure half over a wall's
  top, and Baro standing on his counter.
- **D96 — There are three first-years, and each sleeps in the dormitory
  of their gender.** Decided 2026-10-27 by the owner. The first-years are
  the wizard, the friend of the other gender and the mate of the same
  gender; no other pupil is seen in the dormitories. The mate sleeps in
  the wizard's dormitory and the friend in the other. At the first
  night's end the friend is seen going into the other dormitory and lying
  down, and the mate going into the wizard's and lying down, and then the
  wizard goes to bed; the morning wakes the mate. Rules out `pupil_<n>`
  actors and any bed taken by someone unnamed.
- **D97 — A sleeper lies under the sheet, head on the pillow.** Decided
  2026-10-27 by the owner. A bed is painted with a quilt and a white sheet
  folded over it at the pillow's end. The sleeper lies with the head on
  the pillow and the body under the sheet: the bed's cover, the static
  thing drawn over the sleeper, is the quilt and the sheet together, from
  the sheet's fold to the bed's foot, cut along the sheet's dark line with
  the line of it (D93), so that the line stays seen over the sleeper. The
  head's point is the pillow's middle. Rules out a sleeper between the
  sheet and the quilt, and half a face.
- **D98 — Every figure walks through every door with room to spare.**
  Decided 2026-10-27 by the owner. A child figure stands at most 1.15
  cells tall and an adult at most 1.45, and each adult stays clearly
  taller than the children; the smallest door opening a figure walks
  through, measured on the painting, is at least a tenth of a cell taller
  than the tallest figure that walks through it, and the check asserts it
  from `figures.json` and the scenes' things. Rules out an adult whose hat
  rises over the arch they are passing under.
- **D99 — A scene is painted for the cut.** Decided 2026-10-27 by the
  owner, as the lesson of sprints 15 to 17, and written as rules in
  `art/README.md` for every scene still to paint (section 5 of this
  plan). Rules out the things that cost these three sprints: furniture a
  figure walks beside, walls seen from above with slits for doors,
  double rows of shelves with no aisle, a lamp hung from a ceiling that
  is not there, a counter with someone behind it, doors that open onto
  darkness, and things whose bases spill into the cells a figure walks on.

## 2. What the review found, by cause

The owner's findings, each with its cause as Fable reads it, and the
piece that takes it. The owner's cells are listed again in the pieces as
the verification sets.

**A. Mask edges (D93).** On the field, masks take a band of grass beside a
tree's or a rock's outline (10,8; 12,13; 13,13; 11–14,15; 9,21; 10,21;
1,22; 3,25; 5,25; 4,16; 4,27 "and many more") or leave the outline on the
ground (10,9); on the library, the chairs at 6,17 and 8,17 end short of
their outline, so a figure beside them stands over it. The cause is the
difference mask: Gemini's ground-only edit drifts in tone beside each
thing, so the difference includes a fringe of lawn, and where the
painting's outline lies over a dark shadow in the edit the difference is
weak and the outline is left out. The field has no check for either.
Piece 17.1.

**B. Indoor masks missing or partial (D89 superseded).** Sprint 16 cut the
indoor scenes without Gemini's edits, by a `pale` colour mask inside a box,
or by the box itself. A wooden door is not pale, so the dormitory's door
arch leaves the door out and the wizard is drawn over it (12,13); the
library's arches leave the leaves and the pillars out (2,5; 7,7–8;
7,15–16; the friend over the pillar at the main door in *At the
library*); the entrance's far wall is cut but nothing else is (the lamp,
the torches, the knights, the benches, the pillars, the turrets, the
front wall). Every static thing is cut again, by an edit without it or
by a polygon, snapped to its outline. Pieces 17.4 to 17.6.

**C. Things spilling below their row, and cells wrong (D94).** A rock's
base lies in the cell below its row, so the wizard at 14,15 is over the
rock whose top hides it at 14,14; a tree's crown is behind the wizard at
6,8 and over it at 6,9; a patch of grass with no outline is cut as a bush
at 6,7–6,8 (Gemini's edit repainted the lawn there). On the entrance,
cells inside walls are walked on (12,6–7; 27,6–7; 18,5–7; 21,5–7; 4,10–11;
5,10 and the right side's mirror), and cells behind the front wall are
not. On the dormitory and the library, the cells between beds, along the
walls and between the bookcase rows are not walked on, and should be, the
figure behind what hides it. `clip_below` hides the spill today. Pieces
17.1 (the check), 17.4 to 17.6 (the cells).

**D. A figure on a door's own cell (D95).** The seal gate's cell (8,11),
the dormitory's door (12,13), the library's doors (2,5; 7,8; 7,16): the
figure standing in the doorway is drawn over the door and its arch, since
a thing on the figure's own row is behind it by the depth rule. Piece
17.2, then each scene.

**E. Beds (D97).** The sleeper lies between the sheet and the quilt, the
cover's edge is a box edge and not the sheet's line, and the head is low
on the pillow. Piece 17.5.

**F. Other pupils (D96).** Two `pupil_<n>` actors sleep in the dormitory
at the first night's end, in *Your bed* and in *The morning*. Piece 17.5.

**G. Baro and the wand bank (D95).** Baro is the largest figure (1.69
cells) and stands at 12,4 with his feet on the shelf's floor, over the
counter rather than behind it; the counter is not cut. The centre door's
open state (and so the ground under it) shows a dark corridor, and a
half-erased leaf, where the floor of the top aisle should show. Pieces
17.3 and 17.6.

**H. The lamp (D88).** The entrance's lamp hangs from a rope into the
empty top of the picture. The rope goes, the lamp hangs from its wooden
ring as if from the ceiling, and the lamp is cut as a thing. Piece 17.4.

**I. Figures' size (D98).** Adults stand 1.56 to 1.69 cells tall, the
children 1.25 to 1.33; the library's doors are about 1.6 cells tall. Piece
17.3.

**J. The check sheets.** The owner asked for the sheets without tints and
crosses, with the wizard on every walked-on cell and the cells numbered.
Done by Fable (commit `b4ea8bb`); every sheet of this sprint is made so.

**K. What the review accepts as it is.** The library's sides; Ilda and
the wizard into the middle arch; the dormitory's grid off its walls; the
friends' colours; the debug view.

## 3. The pieces

### 17.1 The cut's edge, the checks, and the field (D93, D94)

The tools first, on the field, where every finding has a cell.

- `tools/art/image_first.py`: a function `snapped(mask, painting, th)`
  that moves a mask's edge to the outer edge of the dark outline next to
  it: the dark pixels (`outline()`, the scene's threshold) that touch the
  mask, or touch pixels that touch it, within `SNAP` pixels of its edge,
  are taken into it; then the pixels of the mask that are ground-coloured
  (`groundlike`, or the scene's floor colours indoors) and reachable from
  outside the mask without crossing a dark pixel, within the same band,
  are given back to the ground. A gap in an outline lets the trim in; the
  band bounds the harm, and a thing with a gap is a painting to mend, not
  a threshold to move. Every mask the export makes passes through it: the
  rows' cut-outs, each state of what opens or is picked up, and the
  static things of 17.2.
- `tools/art/sweep.py`: two checks on every row's and every thing's
  image, each a `Problem` with its cell: `fringe`, ground-coloured pixels
  of the mask that lie outside the thing's outline (reachable from the
  mask's outside without crossing dark); `bare`, dark outline pixels that
  touch the mask and are not of it. Both read the painting the export cut
  from. And a third, `spill`: a cut-out whose pixels reach below the
  bottom edge of its row before clipping, by more than `SPILL` pixels at
  any column, named by the cell below; `clip_below` still clips, and the
  sweep says what it clipped. A scene with a spill is fixed in its
  settings (the thing's row, the map's cell) or its painting, never by
  raising `SPILL`.
- A test in `tests/tools/test_art.py` for `snapped` on a drawn picture: a
  disc with a dark outline on a green ground, a mask that overshoots on
  one side and undershoots on the other, snapped to the outline's outer
  edge; and for each new problem on a drawn case.
- `the-field`: exported and swept again. The grass patch at 6,7–6,8 cut
  as a bush: a difference with no outline round it is Gemini's lawn, and
  goes back to the ground (a rule in `grouped`: a thing whose pieces are
  not closed in by an outline, at least a third of their boundary dark, is
  dropped, and the sweep lists what it drops). The rock at 14,14–15 and
  the trees at 6,7–9 settled by `spill`: the true row, the map's cells.
  The seal gate's cell by 17.2's `under`.
- Verification, on `all-the-field.png` and `sweep-the-field.png`, each
  cell looked at and named in the commit: 6,7; 6,8; 10,8; 10,9; 8,11;
  12,13; 13,13; 11,15; 12,15; 13,15; 14,15; 9,21; 10,21; 1,22; 3,25;
  5,25; 4,16; 4,27. The sweep reports no `fringe`, `bare` or `spill` on
  the field; every mask edge lies on its outline with the outline in it.
- Check: `test_art`, `test_art_content`, the chapter 1 e2e.

### 17.2 Under, over, and lowered: the page and the sweep (D95)

- `cut.json` and `art.json`: a thing or a static thing may say `"under":
  true` (its depth its row plus 0.85) or, for a static thing, `"over":
  true` (drawn over every figure); a scene may give `lowered`, a list of
  `{"cells": [[x0, y0], [x1, y1]], "by": 0.5}`, inclusive ranges and the
  fraction of a cell a figure standing there is drawn lower by. The export
  passes them through; `test_art_content` checks their shapes.
- `app/src/engine/painted.ts`: `rowDepth(row, under)` and a depth above
  every figure for `over` rows (the scene's row count plus one); a row's
  images are keyed by row, static and over, so that a row holds a cut
  image, a static image and an over image apart.
- `app/src/engine/scene.ts` and `layout.ts`: a figure's y on a lowered
  cell is its cell's foot plus `by`; its depth is its row's; a figure
  walking onto or off a lowered cell eases between the two (the walk
  already tweens the sprite). `silhouette.ts` counts `over` images among
  what is in front.
- `tools/art/sweep.py`: draws the wizard as the page does: under things
  over it on its own row, over images over everything, lowered cells
  lowered; its `everyone` sheet shows all three.
- Tests: Vitest on the depths and the lowered y; an e2e on the dormitory
  (after 17.5) that the wizard in the doorway is behind the door's image
  (`data-hidden` or the silhouette's `data-shown`), and one on the library
  (after 17.6) that Baro's sprite y on 12,4 is below the cell's foot.

### 17.3 The figures' size (D98)

- Measure first, in a script in `tools/art/` run by the check: each
  figure's standing height in cells (`figures.json` and the sheets), and
  each door opening a figure walks through, from the scenes' things: the
  field's three doors, the dormitory's door arch, the library's three
  doors, the entrance's three arches. Write the table in the commit.
- `tools/art/export_scene.py`: `FIGURE_SCALE` by kind, children (the
  wizard, Nuri, Teku, Eldra) and adults (Wenna, Ilda, Dask, Baro), chosen
  so that a child stands at most 1.15 cells and an adult at most 1.45,
  with the adults clearly taller than the children (the demo's adults are
  drawn larger; the scale keeps their ratio within the bounds). The
  figures exported again (`export_scene.py figures`, no Gemini image), and
  `figures.py` rerun for every look and both friends' sets, the lying
  rows included.
- The page's constants that depend on a figure's height (`HEAD_REACH`,
  the silhouette's thickness, the bed's head point) checked against the
  new heights; the e2e shots that hold a figure made again and looked
  at.
- The check asserts D98: every figure smaller than the smallest door it
  walks through by a tenth of a cell.
- Check: `test_art`, the unit tests, the full e2e.

### 17.4 The entrance

The painting is mended once and cut whole; every cell the owner named is
answered.

- The lamp (D88): `tools/art/repaint.py` with a box round the rope above
  the lamp's wooden ring, a prompt that takes the rope out and leaves the
  ring as the lamp's top, as if fixed to a ceiling out of the picture; the
  mended painting is the scene's painting. One Gemini image.
- The things, each cut against an edit without it (a crop with the
  boxes, `repaint.py`, several things an edit) and snapped (17.1): the
  lamp (`under`, row 13: whoever walks under it on rows 10 to 12 is
  behind it, the owner's rule); the two torches on the pillars (14,12 and
  25,12) and the two lower ones; the two knights (14,13–15,15 and the
  right side's); the two benches (4,12–4,19 and the right side's); the
  four pillars (13,10–13,21 with their banners, 16–17,21, 22–24,21,
  22,22–24 and the right side's); the two turrets (4,20–21 and the right
  side's); the front wall (rows 22 to 26, the whole width, `over`: a
  figure on rows 22 to 26 is behind it and shows as its outline, the
  door's opening left out of the mask so that whoever walks out is seen
  in it). The far wall stays as sprint 16 cut it, snapped. Three Gemini
  edits: the left side's things, the right side's, the lamp and the
  bottom.
- The map: not walked on, 12,6; 12,7; 27,6; 27,7; 18,5–7; 21,5–7; 4,10;
  4,11; 5,10 and their mirrors on the right; walked on, rows 22 to 26
  across the hall's width (the figure behind the front wall), and rows
  25–26 under the door's opening between columns 18 and 22. Beyond row
  26 the scene's `forbidden` cells with reason `not_now_outside`, and
  `blocked.not_now_outside` in both languages from a brief (Gemini): "now
  is not a good time to leave the castle", as the owner words it; the
  scene has no level today, so the message waits for one.
- Verification, on the sheet, each cell named in the commit: 18,10–21,13
  (the lamp over the wizard on rows 10–12, under it on 13); 12,6–7;
  27,6–7; 18,5–7; 21,5–7 (no wizard); 4,10; 4,11; 5,10 (no wizard);
  4,12 (behind the bench); 14,12; 25,12 (behind the torch); 14,13; 15,14;
  15,15 (behind the knight); 4,20; 4,21 (behind the turret); 16,21;
  17,21; 22,21; 23,21; 24,21; 22,22; 22,23; 22,24 (behind the pillar);
  rows 22–26 (the outline behind the wall; the figure seen in the door's
  opening). The far wall's arches as before.
- Check: `test_art_content`, the chapter 2 e2e, the entrance story's
  shots.

### 17.5 The dormitory, the beds, and the three pupils (D96, D97)

- The walls between the rooms (columns 8–9 and 15, rows 4 to 13, as
  painted, their slits included) and the front wall with the door's arch
  (row 13, the whole width): static things by polygon snapped to their
  outlines, `over`. The door with its arch (11,13–13,14): a thing cut
  against an edit without it, `under`, row 13, so that the wizard in the
  doorway (12,13) is behind it; *The first night*'s last step keeps the
  wizard there. Row 14 between 8 and 16 walked on, behind the front wall.
- The beds whole: each bed with its headboard, foot board, trunk and
  bedside table is a thing on the row of its foot board's outline (D94),
  cut against an edit without it (two edits, the left and the right
  dormitory, four beds each), so that a figure on the row above it is
  behind its foot board and a figure on the row below is over it; the
  rows between beds (6, 9, 11 and 14 on the right; the same on the left)
  walked on, the figure's feet behind the bed below. The armchairs, the
  round table and the bookshelf cut against an edit without them (one
  edit); 10,6; 11,6; 13,6; 14,5; 14,6 walked on behind the armchairs; 9,7
  and 9,9 walked on where the painting allows (the owner asks why not;
  the answer in the commit).
- The covers (D97): each bed's cover is the quilt and the folded sheet,
  from the sheet's fold line to the foot, a polygon snapped to the sheet's
  dark line, which stays in the cover; `beds` in `cut.json` gives the
  pillow's middle as `head`. `HEAD_REACH` and the lying frame's place
  tuned on the sheet until the face is whole on the pillow and the body
  under the sheet, for the wizard and for a friend, on a left bed and a
  right bed.
- The pupils (D96): `pupil_1` and `pupil_2` go from *Your bed*, *The
  first night* and *The morning*; `pupilLook` and its tests go. *The
  first night* is restaged: the mate is on the scene from the start; after
  Ilda's good night, the friend walks through the left arch to a left bed
  and lies down (`sleep`), the mate through the right arch to `bed_1` and
  lies down, and the voice sends the wizard to bed; the texts of the
  steps that change are briefed to Gemini (`tools/write/briefs/`), in both
  languages, and the old step 5 goes. *Your bed*: the mate asleep in
  `bed_1` (so that the goal, the free bed beside Nuri's, stays). *The
  morning*: the mate asleep and waking at step 2, as now. `test_stories`
  and the world's tests for the new staging.
- Verification, on the sheet and on the game's shots: 12,13 (behind the
  door and arch); 8–16,14 (the outline behind the wall); 9,7; 9,9; rows
  6, 9, 11 (behind the bed below); 10,6; 11,6; 13,6; 14,5; 14,6 (behind
  the armchairs); the walls over the wizard at 8,5–13 and 16,5–13; the
  sleeper's face whole and the sheet's line over the body in
  `asleep.png`, `asleep-mate.png` and a new `asleep-friend.png` of the
  left dormitory.
- Check: `test_art_content`, `test_stories`, the chapter 2 e2e.

### 17.6 The library, Baro, and the doors

- The three doors (2,5; 7,8; 7,16): each door `under` on its own cell;
  each arch with its pillars a static thing cut against one edit of the
  three doorways as plain wall (one Gemini image), `under`, so that a
  figure in the doorway is behind the arch and the leaf. Each door's open
  state and the ground under it show the floor of the room beyond, lit as
  that room is, not a dark corridor and no half leaf: one Gemini edit a
  door (three images), each a crop with the box; the field's castle door
  keeps its lit hall.
- The counter (11–13,5) cut against an edit without it (one image), row
  5; `lowered` cells 10,4 to 14,4 by 0.5, so that Baro at 12,4 stands
  behind the counter with his legs hidden (D95); Baro's size by 17.3.
- The walls: row 7 (the whole width, `over`), column 11 rows 10 to 15
  and row 15 (`over`), row 20 (`over`): polygons snapped. Rows 7 and 20
  walked on, the figure behind the wall with its outline; 11,10–11,15
  behind the wall.
- The bookcases: the back row (top at row 12) a thing on row 13, the
  front row a thing on row 14, each cut against one edit without both
  (one image); row 13 walked on from 2 to 10, the figure over the back
  row and behind the front row; the books on the floor at 1,13 cut with
  the front row.
- The tables, the chairs and Wenna's desk cut against one edit without
  them (one image); row 17 walked on from 2 to 9, behind the chairs
  (6,17; 8,17 and the rest), over the bookcases of row 16.
- Eldra's book (1,3–2,4): its mask snapped, and if the hand-made edit of
  the shelf's back still shows through, one Gemini edit of the shelf
  without the book (one image).
- Verification, on the sheet and the game: 2,5; 7,7; 7,8; 7,15; 7,16
  (behind the door and arch); 10,4–14,4 (Baro and the wizard lowered
  behind the counter); row 7 and row 20 (the outline behind the wall);
  11,10–15 (behind the wall); row 13 from 2 to 10 (between the
  bookcases); 1,13; row 17 from 2 to 9 (behind the chairs); 6,17; 8,17;
  1,3–2,4 (the book whole); the main door's pillars over the friend in
  *At the library* step 1, and the wizard's shoes under the door's
  outline.
- Check: `test_art_content`, `test_stories`, the chapter 2 e2e.

### 17.7 Documents and the lesson (D99)

- `docs/dev/architecture.md`: D93 to D99 written as decided, and D89's
  text brought to the present (static things cut by an edit or a polygon,
  snapped; no `pale`).
- `art/README.md`: "The rules for the cut-outs" gain the outline rule and
  the spill rule; "What a painting must keep to" gains "What a scene is
  painted for" (section 5 of this plan), the rules every scene still to
  paint follows, and the brief for a scene's painting names them.
- `docs/dev/dev-environment.md`: the new checks and what each says; the
  sheets as made now.
- `content/art/scenes/*/SOURCE.md` and the `source` texts for the new
  edits.
- The memory note for the sprint (section 6).

### 17.8 The report

Section 8.

## 4. Gemini images

At most **sixteen** in the sprint, each named in the commit that spends
it, and counted in the report:

- 17.4: the lamp's rope (1), the entrance's edits (3).
- 17.5: the beds, left and right (2), the common room's furniture (1), the
  door with its arch (1).
- 17.6: the three doorways as wall (1), the three doors open onto the
  floor beyond (3), the counter (1), the bookcases (1), the tables and
  chairs (1), Eldra's book if needed (1).

A second try of an edit counts. Where the budget runs out, the
implementer stops and says what is left, rather than cutting by colour
again.

## 5. What a scene is painted for (the lesson, for `art/README.md`)

The three sprints spent on chapter 2's scenes were spent on things the
paintings asked of the cut. A scene still to paint keeps to these, in its
prompt and in its choice among Gemini's tries:

- **The floor a figure walks is open.** Furniture stands against the top
  wall or in the corners, where no figure walks beside or behind it. A
  thing in the middle of the floor (a round table, a chandelier, a
  pillar) costs a cut-out and a mask to check; one a scene at most, and
  only where the story needs it.
- **Doors are doorways.** A door a figure walks through is in a wall seen
  from the front, with an arch at least two cells wide and a fifth of a
  cell taller than the tallest figure that passes; open, it shows the
  floor of the room beyond, lit. No slits in walls seen from above; a
  wall between rooms is seen from the front too, or the rooms are two
  scenes.
- **Shelves are one row, against a wall.** No double rows with an aisle
  the painting does not show.
- **Nothing hangs from what the picture does not show.** A lamp is on a
  wall or a stand, or its chain ends at a ring, never in the sky.
- **No one is painted into the scene.** A keeper, a teacher or a pupil
  is a figure the page places; a counter or a desk stands where the
  figure behind it is drawn whole, or beside it.
- **Every thing has its outline closed and its base in its own cells.**
  A rock's base, a tree's roots and a bed's foot board end in the cells
  the map marks not walked on, never in the cell a figure walks; the
  grid is in the prompt and the painting is checked against it before it
  is chosen (`spill` tells).
- **Things stand apart.** A chair is not tucked under a table; a torch is
  on the wall, not on a pillar; a book lies on the floor, not against a
  shelf.
- **The ground-only edit is asked for with the painting**, in the same
  session and on the whole picture, for indoor scenes as for the field,
  so that no scene is ever cut by colour.
- **Figures fit** (D98), and a scene's cells are a figure's size or
  larger.

## 6. How the implementer works

As in sprint 16: one piece at a time, `ci/check.sh --e2e` green and a
local commit per piece named after it (`17.4: the entrance`), never a
push, no timers; what this document leaves open decided the simplest way
and said in the commit; every scene exported looked at in
`art/raw/game-check/all-<scene>.png` and `sweep-<scene>.png` before the
commit; D88 kept.

Each scene's commit (17.1, 17.4, 17.5, 17.6) ends with a table in its
message: every cell of the piece's verification list, and what the sheet
shows there now, one line each. A cell that cannot be made right is said
so, with why.

Each piece's sheet is kept under a name of its own
(`art/raw/game-check/s17-<scene>.png`) for the report, since the check
overwrites `all-<scene>.png`.

## 7. Acceptance test (for when the owner tries it)

On `https://hija.local:5173/?debug`, as a girl with the look `teal` and as
a boy with `amber`:

1. The field: at every cell of 17.1's list, the mask ends on the outline
   and the wizard is behind or over the thing as the owner expects; at
   8,11 the wizard is behind the sealed gate.
2. The entrance: the lamp hangs from its ring; the wizard is behind the
   lamp, the torches, the knights, the benches, the pillars and the
   turrets where 17.4 says; walking down from the hall the wizard goes
   behind the front wall and is seen as an outline, and in the door's
   opening whole.
3. The dormitory: the wizard in the doorway is behind the door and its
   arch; walks between the beds with the feet behind the bed below;
   behind the walls between the rooms; asleep, the face whole on the
   pillow and the sheet's line over the body. At the first night's end,
   the friend lies in a left bed and the mate in `bed_1`, and no one else
   is in any bed; in the morning the mate wakes.
4. The library: the wizard behind each door and its arch; an open door
   shows the floor beyond; Baro stands behind the counter with his legs
   hidden and is no taller than Ilda; the wizard walks between the two
   bookcase rows and behind the chairs; the walls of rows 7 and 20 and
   column 11 hide it with its outline.
5. Every figure passes under every door it walks through with room over
   its hat.
6. The check sheets handed over show the wizard on every walked-on cell,
   numbered, with no tint.

## 8. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, as the owner asked on
2026-10-27:

1. **Each piece**, what it is, what was done, and a picture from the game
   (1440 × 900, Spanish, a girl wizard with the look `teal`): the field's
   edges (a close shot of a tree and a rock); the entrance's lamp and
   wall; the dormitory's door, beds and sleepers; the library's doors,
   Baro and the bookcases; the figures' new size beside a door.
2. **The check sheets** of the four scenes as 17.1 to 17.6 leave them, and
   a table a scene of the owner's cells with what each shows now.
3. What differs from this plan and why, what was corrected by hand, the
   Gemini images spent, and what is left open.
4. The prompt for Fable's review.

## 9. The prompt for Opus

```
Read /home/other/Projects/kydux/CLAUDE.md, then docs/dev/sprint-17.md
(this plan), docs/dev/sprint-16.md sections 1 and 6, art/README.md ("The
rules for the cut-outs", "What a painting must keep to") and the memory
notes kydux-sprint-16-state, kydux-uat-4-sprint-16 and
kydux-painted-scene-learnings. Build sprint 17: pieces 17.1 to 17.8 in
order, one local commit per piece, ci/check.sh --e2e green before each,
never a push, never a timer (nothing is pushed before Friday 2026-10-30).
Fix the causes in the tools and the page first (17.1 to 17.3), then each
scene; every commit of a scene ends with the table of the owner's cells
and what the sheet shows there now. A chosen painting is mended in boxes
with tools/art/repaint.py and never painted again (D88); at most sixteen
Gemini images, each named in its commit. Gemini writes every text the
child reads, from briefs in tools/write/briefs/. Decide what the plan
leaves open the simplest way and say it in the commit. At the end, hand
over what section 8 asks, in Spanish, one thing at a time with its picture
after it. Code, comments, commits and documents in English, in the
present tense.
```
