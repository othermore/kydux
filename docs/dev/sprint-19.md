# Sprint 19 — Chapter 2 made ready for its acceptance test: the doors' leaves, and the way between the bookcases

Fable's review of sprint 18 (2026-10-29, on commit ed5be3a and the owner's
look at the open doors) found two kinds of thing. The small ones Fable
fixed in the review's own commits, so that the owner's acceptance test
does not stumble on them: the three who stand before the dormitory's door
had their legs behind the arch's dome; two library levels walked through
the back bookcase, which the map held as floor; *The moving key*'s given
program named a key it never found; chapter 3 listed `teacher.position`
where nothing used it. The big one needs the tools: the masks of the four
open doors do not fit their leaves. The owner sees it in every leaf's
bottom corners and along the shadow each leaf throws on its wall: the mask
of an open state is cut by the difference against the doorway picture,
snapped to the outline, and the snap runs along the floor's and the
stones' lines where the leaf's foot has no dark line of its own, so that a
corner is bitten off, a spur of floor comes along, and the shadow's edge
goes in steps. This sprint cuts each leaf by its own traced shape, adds the
sheet that shows every door state over the painting at three times its
size, and hands the chapter over for the owner's test. Nothing of chapter
3 is built here: its plan is sprint 20, written after the owner's test.

One piece, 19.1, and the hand-over. The rules of the earlier sprints hold:
`ci/check.sh --e2e` green and one local commit, never a push, never a
timer (nothing is pushed before Friday 2026-10-30, and then only with
`ci/push.sh`); every word for the player through `t()` or a content file;
nothing forbidden and nothing secret; documents and comments in the
present (CLAUDE.md); a chosen painting is mended in boxes, never painted
again (D88); reports show only pictures of the current commit. Section 4
is the Gemini budget, section 5 the owner's acceptance test, section 6 the
hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D113 — An open leaf is cut by its traced shape, never by a difference
  snapped to lines.** Decided 2026-10-29 by the owner, who found the masks
  loose at every leaf's bottom corners and along its shadow. The open
  state of a door is cut by a polygon traced by hand on the swung picture,
  `leaf`, round the wood, the hinges and the iron of the leaf and round
  the shadow it throws on the wall, the free edge and the bottom corners
  whole; the polygon is drawn at the painting's own size with its edge
  softened over one pixel, and nothing is snapped, flooded or kept by
  size. The closed state keeps its cut-out of the painting, but within
  the doorway's own shape, so that no mortar line of the wall beside the
  arch comes along with the leaf. Every scene's check draws each door's
  states over the painting at three times their size, the mask's edge
  marked, and a state is accepted only when its edge lies on the leaf's
  outline all round. Rules out a mask whose edge is found by a difference
  where the leaf's foot meets the floor, and a door looked at only in the
  game's small picture.

Fable's review also took the owner's decision on how the grid is taught
(D112, in `architecture.md`): chapter 3 opens with the naughty child's map
and its spell, and `position` comes after the child has counted cells.
That is sprint 20's work; `course.md` and `story.md` say it already.

## 2. What Fable found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| The leaf of each open door is cut short at its bottom corners; a sliver of floor or wall comes along at its foot; the shadow's edge on the wall goes in steps (the dormitory's front door, Wenna's door, the centre door, the room door). | The open state's mask is `changed()` against the doorway picture within `area`, then `snapped`: the snap runs along the floor's and the stones' lines, and the difference is weak where the leaf's dark foot meets the floor's dark line. | 19.1 |
| At the foot of the dormitory's open doorway a board of the leaf is left where the floor should be: the doorway fill stops short of the threshold. | The fill's reach. | 19.1 |
| Where the floor beyond an open door is of another kind than the floor before it (the dormitory: the common room's planks seen from the stone corridor; Wenna's door: the hall's planks seen from the reading room's stone), the one turns into the other at the threshold with no line, which reads as a patch; the painting draws a dark line wherever stone meets wood. | The fill has no line at its foot. | 19.1 |
| The closed leaves of the three library doors carry short mortar lines of the wall round the arch (seen on the states composed over the ground; in the game they coincide with the painting's own lines, so they do not show, but any mend of the wall would show them). | The closed state's mask is the difference against the doorway picture, rimmed with the outline beside it: the wall's lines touching the arch come in. | 19.1 |
| Ilda, standing before the dormitory's door at 12,12, has her legs behind the arch's dome (the sweep: 12,12 37 % hidden). | The front wall's dome reaches into row 12. | Fixed by Fable: the three stand on row 11 (`the-first-night`: wizard 11,11, friend 10,11, Ilda 12,11; `story.spec.ts`). |
| *The hidden key* walked from the aisle up through the back bookcase (7,13 to 7,11 across 7,12), and *The lost book* the same (5,13 to 5,11): the painting's back bookcase stands on row 12, which the map held as floor; the sweep showed a figure there 79 % hidden. | The map. | Fixed by Fable: row 12 is `#.kkkkkkkkk.###`; both levels leave the aisle by its right end (column 11); Eldra waits at 11,10; *The hidden key* starts at 11,11 where *The lost book* ends, Wenna at 10,10, the mate at 9,10; solutions, `wrong/` programs, hints 2 and 3 of both levels (by hand, said in the commit) and `levels.spec.ts`. |
| *The moving key*'s given program used `key` without finding it: a child who followed the hints got a Python error. | The starting code. | Fixed by Fable: yesterday's program begins with `key = wizard.find_nearest("key")` (both languages, `wrong/as_given.py`). |
| Chapter 3 listed `teacher.position` in *True or false* and three levels' `api`, used by nothing, shown in the notebook as numbers the child cannot read. | D110 left it for a later review. | Fixed by Fable: taken out of the lists; chapter 3 teaches it after the cells (D112, sprint 20). |

Looked at and left as they are: the library's row 7, where a figure is
behind the wall's coping (crossed only through the centre door's
doorway); row 13, the aisle, where a figure shows from the waist up over
the front bookcase, as the owner asked (2026-10-28); row 15, where the
wall's coping covers a figure's feet; the texts of the chapter, read
whole in Spanish, which say what each character would say.

## 3. The piece

### 19.1 The leaves cut by their shape, and the states sheet (D113)

**`tools/art/export_scene.py`.** A state given as a picture (`{"picture":
..., "without": ...}`) may carry `"leaf": [[x, y], ...]`, a polygon in
cells with three decimals, in place of `area`. With `leaf`, the state's
alpha is that polygon alone, drawn at the painting's size: rasterised at
four times the size and averaged down, so that the edge is soft over one
painting pixel; no `changed`, no `kept`, no `snapped`, no `filled_mask`.
`area` stays for a state that has one and no `leaf` (none, after this
sprint; take the code path out if nothing uses it, and the README's
line with it). The row crop and the `rows` of a state are as they are.

A closed state cut from the painting (`"closed": "painting"`) of a thing
that has a `doorway` polygon (new, in cells, the arch's inner edge and the
threshold's line, traced on the painting) is masked within that polygon
after `sprite_alpha`: the leaf, its iron and its threshold, and nothing of
the wall. The four doors get one.

**The doorways' feet (`tools/art/repaint.py doorways`).** The fill of an
open doorway reaches down to the floor's own dark outline below the
threshold, the first dark line under the door's box from one jamb to the
other, so that no board, rail or shadow of the leaf is left at the foot;
the dormitory's front door is the one to measure (its fill stops a few
pixels short, and a plank's edge of the leaf shows as a lighter board).
A door's settings may say `"sill_line": true`: a dark line is drawn
along the threshold, from jamb to jamb, as wide as the painting's own
outlines (LINE_WIDTH at the painting's scale, its ends softened), in the
colour of the arch's outline at its foot, so that the stone before the
door and the wood beyond it meet as everywhere else in the painting. It
is `true` for `front_door` and `wenna_door`, where stone meets wood, and
absent for `centre_door` and `room_door`, where wood meets wood and the
threshold's own line stays. The ground-only picture and the marked
picture are mended with the doorway picture as `also` does.

**Tracing.** Each `leaf` is traced on the swung picture joined into the
painting (`art/raw/game-dormitory/dormitory-door-swung.png`,
`art/raw/game-library6/library-{wenna,centre,room}-swung.png`) with
`tools/art/trace.py`: `outline` gives a first polygon, the region the
leaf's dark outline closes in, simplified; `look` writes a crop at three
times its size with a grid line every tenth of a cell and the polygon's
points numbered over it, and with `--diff` against the doorway picture
shows in red what the model painted again round the leaf. The points are
then moved by hand, crop by crop (the top, each side, the foot), to the
outer edge of the leaf's dark outline, the hinge's plate and the iron's
ends, and to the outer edge of the shadow where it fades into the wall;
the bottom corners whole, the top's curve with a point every 0.05 cells.
Between twenty and sixty points a leaf. Measured on the dormitory's
leaf by the designer, for the others to be measured the same way: the
leaf's outline is continuous all round, the bottom corners included; the
shadow on the wall is the painting's own wall darkened, from 9.39 to the
outline at 9.56 on row 14.6, and beyond the shadow the wall is the
painting's pixel for pixel, so a polygon that ends where the shadow fades
leaves no seam; to the right of the hinges the model painted the arch's
jamb again, so the polygon follows the leaf's and the hinges' edge there
and takes no stone. Where the
swung picture itself lacks a corner (the room door's lower left is the
one to look at), the owner's rule holds, "bottom corners whole": the
corner is painted by Gemini in a box of that corner alone (`repaint`,
D88, at most two pictures in the sprint), the traced polygon then
following it.

**The states sheet.** `export_scene.py <scene> check` writes
`art/raw/game-check/states-<scene>.png`: for each thing that has states,
three panels at three times the painting's size for a thing under 300
pixels wide and twice for a wider one: the ground alone round the
thing's box, with 0.4 cells of margin; each state composed on the ground,
with the state's alpha edge (a pixel with alpha above 0 beside one with
alpha 0) drawn in magenta; the panels side by side on black, the thing's
name and the state's over each. The sheet is kept with the sprint's
other sheets as `s19-states-<scene>.png`.

**Acceptance of a cut, before the commit.** On the states sheet, for each
open leaf: the magenta edge lies on the leaf's outline from the hinge
round the top to the free edge and down to both bottom corners, which
are whole; the shadow's edge is a smooth line, not steps; no pixel of
floor or wall stands inside the edge apart from the shadow; no pale or
blue fringe along the free edge (the leaf's own edge pixels, feathered,
never the canvas's blur). For each closed leaf: the edge lies on the
arch's inner line and on the threshold, with no line reaching into the
wall. On the ground panel: the fill reaches the threshold's line, and
the line is there where the floors differ. Then in the game, at zoom 2
on each door open and closed
(`#story/the-first-night` after step 5 for the dormitory's door;
`#level/the-lost-book` for Wenna's; `#level/the-hidden-key` won for the
centre door; `#level/the-wrong-order` won for the room door), a
screenshot each, 1440 × 900, Spanish, the girl wizard with the look
`teal`, for the report.

**The dormitory and the library exported again** (`export_scene.py
<scene>`, about seven minutes each), their sweeps green, their all-cells
sheets looked at and kept as `s19-<scene>.png`. The sweep must show the
figure at 12,11 whole and the library's row 12 no longer walked (Fable's
fixes, already in the map and the stories).

**Tests.** `tests/tools/test_art.py`: a state with `leaf` has an alpha
that is 1 inside the polygon, 0 outside, and between at its edge over
one pixel; a closed state with a `doorway` polygon has no alpha outside
it. `tests/tools/test_sweep.py` or its neighbour: the states sheet is
written with one row per thing with states and three panels a state.
The browser tests of chapter 2 as they are (`ci/check.sh --e2e` green).

**Documents.** `art/README.md`, "The rules for the cut-outs": `leaf` and
`doorway`, and the states sheet among the check's pictures. `docs/dev/
architecture.md`: D113 in the log, in the words of section 1, and
`export_scene.py`'s line in the parts list says the states sheet.
`art/scenes/<scene>/cut.json` `about` lines of the four doors say the
leaf is cut by its traced shape.

## 4. Gemini images

None planned. At most **two**, only for a leaf's bottom corner the swung
picture does not have whole (section 3, tracing); each named in the
commit and counted in the report.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` (the development server restarted
after the build, so that it serves the new `world.zip`), in a private
window, as a girl with the look `teal` and as a boy with `amber`:

1. **The first night.** The three stand before the door with their whole
   bodies seen, Ilda's legs included; Ilda walks down through the doorway,
   opens, steps out, the door shuts, she goes away left; the friend goes
   through the left doorway.
2. **The doors, open and closed**, at zoom 2 with the + button: the
   dormitory's door open while Ilda is in the doorway and shut after; in
   the library, Wenna's door shut in *At the library* and open from step
   5 on; the centre door shut until *The hidden key* opens it; the room
   door shut until *The wrong order* opens it. Each open leaf is whole to
   its bottom corners, lies flat beside its arch with its shadow on the
   wall, and no floor or wall is cut along with it. Each closed leaf ends
   at the arch's inner line and the threshold. At the foot of each open
   doorway the floor beyond runs to the threshold, no board of a leaf
   left, and where stone meets wood a drawn dark line marks it.
3. **The lost book.** The book glows between the two bookcases at 5,13;
   the wizard walks the aisle from its right end and leaves it the same
   way; Eldra waits at the way out, 11,10, and takes the book.
4. **The hidden key.** The level starts at the aisle's way out, 11,11,
   with Wenna and the mate beside; the key glows under the front bookcase
   at 3,14; the wizard goes down into the aisle, left to the key, back
   right, up, left along the hall and up to the centre door; nobody ever
   walks row 12, the back bookcase.
5. **The moving key.** The given program runs without a Python error and
   fails in the way *The key is near*; the solution wins the three ways.
6. **The notebook in chapter 3** (`#level/the-watchtower`) lists no
   `position`.
7. The check sheets handed over show every door state at three times its
   size with its edge on the leaf.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a
reader who does not know the code, and then its picture, only pictures
of the final commit (memory: no before/after):

1. **The leaves**, what was wrong and how each is cut now, with the
   states sheets of both scenes and the four game screenshots at zoom 2.
2. **The check sheets** of the dormitory and the library as this sprint
   leaves them.
3. What differs from this plan and why, the Gemini images spent, and
   what is left open.
4. The prompt for Fable's review.

## 7. The prompt for Opus

```
Read /home/other/Projects/kydux/CLAUDE.md, then docs/dev/sprint-19.md
(this plan), docs/dev/sprint-18.md sections 1 and 3 (18.3, 18.6) and
the end of its decision D111 in docs/dev/architecture.md, art/README.md,
and the memory notes kydux-sprint-18-state, kydux-friends-server-4173
and kydux-painted-scene-learnings. Build sprint 19: piece 19.1 as one
local commit, ci/check.sh --e2e green before it, never a push, never a
timer (nothing is pushed before Friday 2026-10-30). Never stop or build
into the servers on ports 443 and 5173, and never kill a vite or nginx
process (CLAUDE.md); a vite preview on 4173 is a leftover of a check
run. The plan decides everything: each open leaf is cut by a polygon
traced by hand on its swung picture (D113), accepted only on the
states sheet at three times its size with its edge on the leaf's
outline and its bottom corners whole; the closed leaves are masked
within the doorway's shape. At most two Gemini images, only for a
corner the swung picture lacks, each named in the commit. Every
document and comment in the present. Hand over what section 6 asks,
and end with the prompt for Fable's review.
```
