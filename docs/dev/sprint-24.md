# Sprint 24 — Chapter 2's last corrections before the owner's acceptance test: the open leaf's cells, column 8, the entrance's door stubs, the dormitory by morning

The owner read the chapter 2 document (`drafts/uat-capitulo-2.es.md`)
on 2026-10-30 and found four things on its pictures: the dormitory's
open leaf lies on corridor cells a figure may still stand on; the figures
along column 8 of the dormitory are pushed too far left; a stub of each
door taken out of the entrance's far wall is left on the floor; and *The
morning* on the dormitory still shows a night sky in the windows and
beyond the walls, with the grass dark, so the morning light alone does
not make a morning. This sprint fixes the four, in four pieces, before
the owner's last acceptance test of chapter 2. Chapter 3 is sprint 25.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (the owner pushes with
`ci/push.sh` from Friday 2026-10-30 at 19:00); every word for the player
through `t()` or a content file; nothing forbidden and nothing secret;
documents and comments in the present (CLAUDE.md); a chosen painting is
mended in boxes, never painted again (D88); reports show only pictures of
the current commit. Section 4 is the Gemini budget, section 5 the owner's
acceptance test, section 6 the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D125 — The cells an open leaf lies on are not walked while it is
  open.** Decided 2026-10-30 by the owner. A door whose open leaf lies on
  the floor beside its doorway covers the cells its foot stands on (the
  scene names them, `covers` on the door's open state); while the door is
  open no one walks onto them, the wizard's step is refused and the
  child told why; and when the door opens with the wizard or an actor on
  one of them, that figure steps to the nearest free cell along the row,
  away from the door, as the leaf swings. Rules out a figure drawn
  behind the leaf of a door it stands beside.
- **D126 — A scene painted at night has a morning picture: its sky, its
  windows and its outside by day.** Decided 2026-10-30 by the owner. A
  scene painted at night that a morning story plays on, or that a night
  spent in it ends in, has a second ground: the night painting with the
  sky above its walls, the sky in every window and everything outside the
  walls (grass, towers, battlements) painted by day and taken in boxes
  (D88), the inside as painted, candles and torches as they are. A story
  under the morning light (`light`, D124) draws that ground, and the dawn
  of D124 crossfades the night ground into it under the warm light. Rules
  out a morning told under a night sky, and a scene painted twice.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| Dormitory: a figure may stand on 10,15 with the front door open, behind its leaf. | The open leaf's picture stands on the corridor (rows.open 15), its foot covering 10,15 whole, 9,15 by 0.58 and 11,15 by 0.36 (its alpha over the lower two thirds of row 15); the world knows nothing of it. | 24.1 (D125). |
| Dormitory, column 8: the figures from 8,7 to 8,13 are drawn too far left. | `nudged`: 8,7-8,8 by −0.3, 8,9-8,10 by −0.45, 8,11-8,13 by −0.65 (D105). | 24.2: a quarter of a cell to the right from 8,7 to 8,9, a third from 8,10 to 8,13. |
| Entrance: at 11,10 and 28,10 a stub of the door taken out lies on the floor below each side arch. | The Gemini edits that took the doors out (`door_left`, `door_right`) left the leaf's foot below their boxes. | 24.3: filled from its sides (`repaint.py fill`), no Gemini. |
| *The morning*: a night sky in the windows and beyond the walls, dark grass, under the morning light. | The dormitory has one painting, at night (its three tries all at night: no day version exists); D124's light tints it only. | 24.4 (D126): a morning ground from Gemini's morning picture, taken in boxes. |

## 3. The pieces

### 24.1 The open leaf's cells (D125)

**The scene.** `content/scenes/the-dormitory/scene.json`, on the door
`front_door` (added to `things` as the scene's door with its `at` 12,14,
if the scene's things do not hold it yet; the level and the stories keep
placing it): `"covers": {"open": [[9, 15], [10, 15]]}`: the corridor
cells the open leaf's foot covers by more than half, measured on
`front_door-open.webp` over the lower two thirds of row 15 (10,15 1.00;
9,15 0.58; 11,15 0.36, not covered). `tools/art/export_scene.py check`
measures the same on the exported picture and the content test
(`tests/project/test_art_content.py`) holds the scene's `covers` equal to
the measure, so that a leaf cut again keeps them true.

**The world** (`world/kydux_world/`). `level.py` reads `covers` on a
door of a scene (`on_scene` merges it into the level's door); `world.py`:
while a door is open, its covered cells are not free (`is_free`), a step
onto one is refused with the reason `door_leaf` (`blocked`, `by` the
door; the text `blocked.door_leaf` in both languages, "The open door's
leaf is in the way." / "La hoja de la puerta abierta está delante."), and
an actor's walk in a story may not end on one. When a door opens (a
level's `door.open()`, a story's `open`) with the wizard or an actor on a
covered cell, the world moves that figure to the nearest free cell of the
same row away from the door, 8,15 for either cell here, as an event of
its own (`shoved`: `id`, `from`, `to`, `by` the door) in the door's tick;
the staging check plays it. Tests: the step refused and the reason; the
figure moved on opening, from each covered cell; a story's walk refused
onto a covered cell while the door is open; the dormitory's stories and
level still stage (none has a figure there when the door opens: say so in
the commit after checking).

**The page** (`scene.ts`, `words.ts`): `shoved` draws the figure walking
to its cell in the door's tick, as a walk does, the wizard too; `blocked`
with `door_leaf` thinks the reason as the others do. `?debug` marks the
covered cells as not walked while the door is open (the cells' tint).
A browser test on *The first night* that the door opens with no figure
shoved, and a unit test of `blockedText` for `door_leaf`.

### 24.2 Column 8 of the dormitory

`art/scenes/the-dormitory/cut.json` `nudged`: 8,7 and 8,8 by −0.05;
8,9 by −0.2; 8,10 by −0.12; 8,11 to 8,13 by −0.32 (each a quarter or a
third of a cell to the right of now, as the owner asked; 8,5-8,6 at −0.05
and the rest as they are). The dormitory exported again (`export_scene.py
the-dormitory`), its sweep green, its all-cells sheet kept as
`s24-the-dormitory.png`: on it, the figures of column 8 beside the wall,
not over it and not over the trunks. Column 16 is left as it is unless the
owner says otherwise.

### 24.3 The entrance's door stubs

`art/scenes/the-entrance/cut.json`: a `fill` section like the chain's,
with two boxes in the painting's pixels round the stub below each side
arch, at 11,10 and 28,10 (the painting's cell is 120 pixels; the stubs
lie in the lower half of those cells, about 20 pixels wide and 60 tall;
measured by the programmer with `trace.py look` on `entrance-doors.png`,
box 10 9.5 13 11 and 26 9.5 29 11); filled from their sides by
`tools/art/repaint.py fill`, the painting kept elsewhere, the marked
picture mended with it (`also`). The entrance exported again, its sweep
green, `s24-the-entrance.png` kept, and a crop of each cell at 3× before
and the same after is not kept (reports show the current commit only):
the crop after, `s24-entrance-stubs.png`.

### 24.4 The dormitory by morning (D126)

**Gemini.** One prompt, `tools/art/prompts/game-dormitory-morning.md`:
the whole night painting (`art/raw/game-dormitory/dormitory-mended.png`,
the scene's painting) given as it is, asked for "the same picture in the
morning": a pale blue morning sky with light clouds above the walls and
in every window, no moon and no stars, sunlight on the grass, the towers
and the battlements outside the walls, everything inside the rooms
exactly as it is, the candles and torches as they are, nothing moved, the
same size. Two tries at most. The chosen try is laid by `tools/art/
repaint.py join` on a copy, `art/raw/game-dormitory/dormitory-morning.
png`, taking ONLY the boxes of the sky, the windows and the outside (a
`morning` section in `cut.json` like `repaint`'s, its boxes in pixels
measured on the painting: the band above the top wall, each window's
panes, the margin at the left, the right and the bottom beyond the
castle's walls, and the sky corners), the painting kept pixel for pixel
inside the rooms. The commit says the boxes and the try chosen; the sheet
`s24-dormitory-morning.png` shows the night painting and the morning one
side by side at a quarter size with the boxes drawn.

**The export.** `cut.json` `sources` takes `grounds: {"morning":
"dormitory-morning.png"}`; `export_scene.py` writes `ground-morning.webp`
as it writes `ground.webp` (the same crop and size), and `art.json`
says `grounds: {"morning": "ground-morning.webp"}`. The static things and
the rows come from the night painting as now; `check` composes the
morning ground with every row and thing (`morning-the-dormitory.png`) and
the programmer looks at it for any night piece left over the day (a row
image holding a window pane or a bit of sky; if one does, that row's
image is cut from the morning painting too, `rows_morning`, and the page
swaps it with the ground).

**The page** (`painted.ts`, `scene.ts`). A scene whose art has a
`morning` ground loads it; a story under `light: "morning"` draws it
instead of the night ground from its first step; the dawn of D124 fades
the night ground out over the morning ground during `DAWN_MS`, under the
warm light, and the morning ground stays; a restart puts the night ground
back. The light's alpha for `morning` stays 0.18 unless the morning ground
makes it too much: the programmer judges on the screenshot and says so.
Browser test: *The morning* opens with the morning ground
(`data-ground="morning"`); *Your bed* ends with it after the dawn.
Screenshots `s24-morning-story.png` and `s24-morning-after-dawn.png`.

**Documents.** D126 (this commit); `art/README.md` "What surrounds a
scene": a scene painted at night has its morning picture, taken in boxes;
the parts list: `grounds`. D105's text is as it is (the numbers live in
`cut.json`). All in the present.

## 4. Gemini images

Two at most, both for 24.4 (the dormitory by morning). None for the
other pieces. Texts: one blocked reason, too small to brief.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug`, in a private window, as a girl with
the look `teal`:

1. `#story/the-first-night`: Ilda opens the door and steps out; nobody
   stands behind the leaf. With `?debug`, while the door is open, the
   cells 9,15 and 10,15 show as not walked.
2. `#level/your-bed` and `#story/the-first-night`: the figures walking
   column 8 (the friend crossing to the other dormitory) go beside the
   wall, a little to the right of where they went, not over the trunks.
3. `#story/the-entrance`: below the left and the right arches of the far
   wall, at 11,10 and 28,10, the floor is plain stone; nothing of a door
   is left.
4. `#story/the-morning`: from the first step the sky in the windows and
   above the walls is a morning sky, the grass outside is lit, the
   towers by day; the inside as before, under the warm light.
5. `#level/your-bed`: the night falls, the wizard sleeps, and at the dawn
   the windows and the outside turn to day as the light warms; the card
   then.
6. The rest of chapter 2 as `drafts/uat-capitulo-2.es.md` says.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the open leaf's cells (the debug view with the door open),
column 8 on the all-cells sheet, the entrance's two cells at 3×, the
dormitory by morning (the side-by-side sheet, the story's first step, the
level after the dawn); the commits with their hashes and the state of
`ci/check.sh --e2e`; what differs from this plan and why, the Gemini
images spent, and what is left open; and the prompt for the designer's
review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-24.md (this plan), D84, D88, D95, D103, D105, D124,
D125 and D126 in docs/dev/architecture.md, art/README.md ("What
surrounds a scene" and "The rules for the cut-outs"), and the memory
notes kydux-two-agents, kydux-sprint-23-state, kydux-designer-review-23
and kydux-uat-6-chapter-2. Build sprint 24: pieces 24.1 to 24.4, one
local commit each, ci/check.sh --e2e green before each, never a push,
never a timer (the owner pushes with ci/push.sh from Friday 2026-10-30
at 19:00; you never push). Never stop or build into the servers on
ports 443 and 5173, and never kill a vite, node or nginx process of the
owner's (CLAUDE.md); a vite preview on 4173 is a leftover of a check
run. Gemini: at most two images, both for the dormitory by morning
(24.4), from the prompt the plan names; the chosen try taken in boxes
only (D88). The plan decides everything; where it does not, the owner
does, through the designer. Every document and comment in the present.
Before git add, read git diff of each file and stage only your own
hunks; commit promptly. Hand over what section 6 asks, and end with the
prompt for the designer's review.
```
