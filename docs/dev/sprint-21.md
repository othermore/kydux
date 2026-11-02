# Sprint 21 — The thresholds down to the jambs' feet, and the doorway's footprint as a tool

The designer's review of sprint 20 (2026-10-29, on commit 46bf62c) found
20.1 built as planned and the eight door panels right but for one thing
the plan itself got wrong. For the centre door and the room door of the
library, the plan put the threshold's foot on the lower edge of the closed
leaf's own bottom outline (9.11 and 6.02), and the jambs of both doors
stand lower: their bottom outline ends at 9.17 and 6.09. Between the
threshold's foot and the jambs' feet lies a strip of the aisle's wooden
floor, 0.05 to 0.07 cells, four to five pixels of the page, eight to ten
at zoom 2, and the board looks laid on the floor a little inside the
doorway instead of across its foot. D114 says the foot is on the jambs'
feet. At Wenna's door the two agree (17.00); at the dormitory's door the
jambs' feet (15.45) stand on the corridor's stone below the floor's line
(15.39), and D114 keeps the threshold on the wood: there the board stays
where it is. The owner is asked to confirm this reading on the guide
crops of the review before the piece is run. The sprint also pays two
debts of the tools that this change would otherwise incur by hand a
third time: the doorway's polygon from the fill's footprint, and the
untouched copies of the pictures the fill is laid into. One piece, 21.1,
and the hand-over. Chapter 3 is sprint 22, after the owner's acceptance
test of chapter 2 (sprint-20.md section 5 with the panel numbers of this
document's section 5, then sprint-19.md section 5).

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

None new. D114 holds as written, with this reading of its two rules on
the foot, taken into D114's text once the owner confirms it: the jambs'
feet are where the jambs' bottom outline ends, measured on the painting
beside the fill's span; where the fill's foot is the closed leaf's own
bottom outline (`to_foot`'s `own`), the threshold reaches down to the
jambs' feet over the doorway's own floor, and where the fill's foot is the
floor's own line, the edge of the floor before the door, the threshold
ends on it and the painting's floor stays below it even where the jambs
stand lower.

## 2. What the review found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| The centre door's threshold (library doors sheet, panel 10) ends at 9.11 and its jambs' feet are at 9.17; the room door's (panel 12) at 6.02 and 6.09: a strip of floor between the board and the jambs' feet, inside the doorway. | Sprint 20 section 3 put the foot on the lower edge of the closed leaf's outline, which the painting draws above the jambs' feet. | 21.1 |
| The `doorway` polygons of the centre and room doors were made a third time with a script of the programmer's scratchpad. | `trace.py` has no command for the fill's footprint grown by the outlines' width (the review of sprint 19 named it). | 21.1: `trace.py footprint`. |
| The pictures the fill is laid into (`also`) are mended in place; a change of the foot needs copies kept in a scratchpad. | `repaint.py doorways` reads and writes the same file. | 21.1: an untouched copy beside each, made on the first run and read on every run. |
| The `about` of `centre_door` and `room_door` says "where the closed leaf's bottom outline was": the past (CLAUDE.md). | Wording. | 21.1 |
| The acceptance test of sprint 20 numbers the library's door panels 3 to 8; the doors sheet numbers them 7 to 12, after the keys and the books (1 to 6). | The sheet holds every thing with states, as section 3 of that plan says. | Section 5 here gives the numbers; sprint-20.md is kept as written. |

## 3. The piece

### 21.1 The thresholds' feet, the footprint command, the untouched copies

**The jambs' feet (`tools/art/repaint.py doorways`).** In `doorways`,
after `to_foot`: when the foot is the closed leaf's own outline (`to_foot`
gives `own`, now a fourth value), the jambs' feet are looked for on the
painting beside the fill's span: on each side, the columns from
`JAMB_OUT` 0.03 to 0.08 cells outside the span's end, the mean of their
values, the first run of rows darker than `DOOR_LINE` that begins below
the fill's foot and within `JAMB_BELOW` 0.12 cells of it; the run's lower
edge is that jamb's foot. With both jambs' feet found, the threshold's
foot is their mean, per column the fitted line through the two (`feet`
shifted by the difference, as a straight line between the two sides),
and the fill ends at the threshold's top: `to_foot`'s `grown` is extended
down to that top (the rows between the leaf's outline and the threshold's
top, the strip of floor, painted with the fill as the leaf is). With one
or none found, the foot stays the outline's lower edge and a line says
so. When the foot is the floor's own line (`own` false), nothing changes.
Expected: centre door 9.17 (threshold 9.09 to 9.17, fill to 9.09, the
leaf's outline 9.073 to 9.11 under the fill and the board), room door
6.09 (threshold 6.01 to 6.09, fill to 6.01), Wenna's door 17.00 and the
dormitory's 15.39 as they are. Measured and put in the commit for each
door: both jambs' feet (cells, three decimals), the threshold's foot, the
fill's end, and the floor under the threshold against the painting (0.00
levels expected). The threshold's strip, lines and shade as in sprint 20.

**`reach` and the `doorway` polygons** (`art/scenes/the-library/
cut.json`). The closed leaf is the painting within `doorway`, the fill's
footprint grown 7 pixels (D113); with the fill lower, both polygons are
made again with `trace.py footprint` (below), and `reach` is the smallest
twentieth of a cell that puts the footprint's foot and the lower line's
reach (`THRESHOLD_LINE / 2 + 1.5 · THRESHOLD_WAVE`) under the row's bottom
edge plus `reach`: expected 0.2 on `centre_door` (row 8, foot 9.17 plus
0.012) and 0.15 on `room_door` (row 5, foot 6.09 plus 0.012). The leaf
polygons, the boxes and the seeds stay.

**`trace.py footprint`.** A third command: `tools/art/trace.py <scene>
footprint <door thing> [--grow 7] [--tolerance 1.5] [--out <json>]`: the
doorway's fill, the doorway picture against the painting (`changed`
within the thing's box, as `export_scene.py` cuts a closed leaf), grown
`--grow` pixels, its boundary simplified as `outline` does, written as a
polygon in cells. With it the two `doorway` polygons of this piece are
made, and the commit says the command and the point counts. The docstring
of `trace.py` and `art/README.md` ("A door's leaves are cut by the shapes
traced round them") say the command; `tests/tools/test_art.py` tests it
on a small picture (a box that differs, grown, gives a polygon round it).

**The untouched copies.** `repaint.py doorways` keeps, beside each
picture of `also`, a copy named `<stem>-untouched.<suffix>` made on the
first run when none exists, and on every run reads that copy, lays the
fill and the threshold on it and writes the picture; the dormitory's and
the library's copies are made from the programmer's kept copies of the
state before 19.1 (the programmer's note `kydux-sprint-20-state` says
where), so that the first run does not copy a mended picture. The
docstring of `repaint.py` and `art/README.md` say it where the `also`
pictures are explained. A test: two runs on the same picture give the
same bytes, and the copy is the picture before the first.

**Wording.** The `about` of `centre_door`, `room_door` and `doorways` in
the library's `cut.json`, and the dormitory's `doorways` `about`, in the
present: the doorway shows the floor beyond down to a threshold of that
floor on the jambs' feet (the centre and room doors) or on the floor's
line (the dormitory), the closed leaf's own outline under them. No "was",
"now", "before".

**Acceptance of the cut, before the commit.** On the library's doors sheet
(panels 9 to 12): each threshold's foot on the jambs' feet, no strip of
floor between them, the top line above the closed leaf's outline (nothing
of the outline seen), the board between the jambs and never beside them;
the closed leaves as in sprint 20. On the dormitory's (panels 1 and 2):
unchanged. The library exported again (`repaint.py doorways the-library`
first), its sweep green, its sheets kept as `s21-doors-the-library.png`,
`s21-states-the-library.png` and `s21-the-library.png`; the dormitory's
`also` picture's untouched copy made, the dormitory exported again only if
its doorway picture's bytes change (they must not; the commit says so).
Then in the game, at zoom 2: the centre door once *The hidden key* opens
it and the room door once *The wrong order* opens it, a screenshot each,
1440 × 900, Spanish, the girl wizard with the look `teal`.

**Tests.** `tests/tools/test_art.py`: the threshold's foot goes down to
the jambs' feet when the foot is the leaf's own outline and the jambs end
lower (a crop with the jambs' outline ending below the leaf's), and stays
on the floor's line when the foot is the floor's own; `footprint` on a
small picture; the untouched copy. The browser tests of chapter 2 as they
are.

**Documents.** D114 takes the reading of section 1 in one sentence, in the
present; `art/README.md`'s doorway rule says the threshold reaches the
jambs' feet over the doorway's own floor and ends on the floor's line
where the floor before the door begins; the parts list of `architecture.md`
(`tools/`) names `trace.py` with its three commands.

## 4. Gemini images

None.

## 5. Acceptance test (for when the owner tries it)

The panel numbers of the doors sheets, which sprint-20.md section 5 gives
wrongly: on `art/raw/game-check/s21-doors-the-dormitory.png` (or `s20-`,
unchanged), 1 is the dormitory's door shut and 2 open; on
`s21-doors-the-library.png`, 1 to 6 are the keys and the books, 7 and 8
Wenna's door, 9 and 10 the centre door, 11 and 12 the room door, shut then
open.

1. **The library's doors sheet**, panels 10 and 12: the board's foot on
   the feet of the stone jambs, with no floor between; nothing of the
   closed leaf's outline above the board. Panel 8: as in sprint 20, the
   board on the jambs' feet and the stone below it. Panel 2 of the
   dormitory's sheet: the board ends on the line where the wood meets the
   corridor's stone; the jambs stand a little lower, on the stone.
2. **In the game**, at zoom 2 with the + button: the centre door once
   *The hidden key* opens it, the room door once *The wrong order* opens
   it. Each board lies across the doorway's foot, between the jambs.
3. The rest of chapter 2 as sprint-20.md section 5 and sprint-19.md
   section 5 say, if not yet tried.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit:

1. **The thresholds' feet**: what was wrong and what is done, with the
   library's doors sheet and the two game screenshots at zoom 2.
2. **The footprint command and the untouched copies**: what each is for
   and how it is used, with the commands run.
3. The commit, with its hash, and the state of `ci/check.sh --e2e`.
4. What differs from this plan and why, the Gemini images spent (none
   planned), and what is left open.
5. The prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-21.md (this plan), docs/dev/sprint-20.md section 3
(what 20.1 built), D108, D113 and D114 in docs/dev/architecture.md,
art/README.md ("The rules for the cut-outs" and the check pictures), and
the memory notes kydux-two-agents, kydux-sprint-20-state,
kydux-designer-review-20 and kydux-painted-scene-learnings. Build
sprint 21: piece 21.1 as one local commit, ci/check.sh --e2e green
before it, never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only by the owner with ci/push.sh). Never stop or
build into the servers on ports 443 and 5173, and never kill a vite,
node or nginx process of the owner's (CLAUDE.md); a vite preview on
4173 is a leftover of a check run. The plan decides everything: the
threshold's foot on the jambs' feet where the fill's foot is the closed
leaf's own outline, measured as section 3 says, with every number it
names put in the commit; the doorway polygons made with the new
trace.py footprint; the untouched copies of the `also` pictures from
your kept copies; the wording of the abouts in the present. No Gemini
image. Hand over what section 6 asks, and end with the prompt for the
designer's review.
```
