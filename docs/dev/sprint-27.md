# Sprint 27 — Going to bed, seen properly: a real walk along the bed to the pillow, then a hop in

The owner tried sprint 26 on 2026-11-01 and found going to bed still
wrong: the figure slides to the pillow's side in less than a tick,
faster than any walk, and the dormitory mate, who sleeps from the bed's
head end, crosses the bed on its way, seen behind it and then in front.
The owner wants a normal walk, cell by cell with the walking frames,
along the floor in front of the bed to the cell under its pillow, and
from there a hop into the bed. One piece, 27.1, no Gemini image, before
the owner's next pass. Chapter 3 is sprint 28.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit, never a push, never a timer (the owner pushes with
`ci/push.sh`); every word for the player through `t()` or a content file;
documents and comments in the present (CLAUDE.md); reports show only
pictures of the current commit. Section 4 is the Gemini budget, section 5
the owner's acceptance test, section 6 the hand-over, section 7 the
prompt.

## 1. Decisions taken here

- **D130, rewritten** (in `architecture.md`, this commit): going to
  sleep is the world's walk and then the page's hop. Each bed names the
  floor cell under its pillow (`pillow_side` in the scene's `scene.json`,
  on the bed), on the row in front of the bed, the cell nearest the
  pillow. `wizard.sleep()` from a cell beside the bed walks the wizard
  along free cells to that cell by the shortest way, a `move` a tick with
  its facing as any walk, then faces the bed and sleeps: the `sleep` event
  comes from the pillow-side cell. The page draws the moves as it draws
  every walk, and the `sleep` as a hop: the figure, facing the bed, rises
  in an arc from the cell into the bed's place and settles lying there,
  head on the pillow, under the quilt, in one tick. A story's figure
  going to bed does the same, its walk written in its staging. A bed with
  no floor under its pillow is not slept in from the side: a level or a
  story names no such bed. The cell to sleep from stays marked (the goal's
  `at`). Rules out a figure that slides to the pillow faster than it
  walks, and one that crosses the bed to get there.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| The figure slides to the pillow's side faster than it walks. | The page tweens the figure from its cell to the side point in 0.9 tick, whatever the distance (two to three cells). | 27.1: the walk is the world's, one cell a tick. |
| The mate crosses the bed, seen behind and then in front. | *The first night* walks the mate to 16,5, the bed's head row left of the bed, and the page's tween goes diagonally from there to the floor in front of the pillow, through the bed's picture. | 27.1: the staging walks the mate along row 6 to 18,6, the cell under bed_1's pillow, and sleeps from there. |

## 3. The piece

### 27.1 The walk to the pillow and the hop (D130)

**The scene.** `content/scenes/the-dormitory/scene.json`, each bed:
`"pillow_side": [x, y]`, measured as the floor cell of the row just
below the bed's furniture cells nearest the pillow's x (`art.json`'s
`beds.<id>.head`): bed_1 18,6; bed_2 18,9; bed_3 18,11; bed_5 5,6;
bed_6 5,9; bed_7 5,11; bed_4 and bed_8 none (a wall below them). A
content test (`tests/project/test_art_content.py`) holds each
`pillow_side` to be a floor cell on the row below the bed's cells and the
nearest to the head's x; and that every bed a level's `sleep` goal or a
story's `sleep` names has one.

**The world** (`world/kydux_world/`). `level.py` reads `pillow_side` on
a bed (`on_scene` merges it). `world.py` `Wizard.sleep`: the bed found
beside the wizard as now (D84); then, if the wizard is not on its
`pillow_side`, the shortest way over free cells (`is_free`) from the
wizard's cell to it, at most 8 cells (breadth-first), walked as `move`
events a tick each with their facing (as `_move` does, bumps impossible
since the way is free); then the wizard faces the bed (`face` event, as
a turn, or the facing on the sleep event) and `sleep` is acted from the
pillow-side cell (`at` = that cell). With no `pillow_side` on the bed,
or no way to it, the sleep is acted from where the wizard stands, as
now. The `sleep` goal is met as now (the bed). Tests: *Your bed*'s
solution gives moves 16,8 → 16,9 → 17,9 → 18,9 then `sleep` at 18,9 with
facing up; a sleep from the pillow-side cell itself walks nothing; the
no-bumps bonus still met; the tick count told in the commit.

**The stories** (`kydux_world.level.story_on_scene`): a figure's `sleep`
in a story must be from the bed's `pillow_side` (refused otherwise, with
a message naming the cell), so that every walk is written in the staging
and nothing is hidden. `content/stories/the-first-night/story.json`:
step 9 walks the mate `[[16, 6], [18, 6]]` and sleeps in bed_1 (the mate
starts at 16,6, so the first tile may be dropped); step 7 walks the
friend to 5,9 before sleeping in bed_6 (its walk ends at 8,8 now: add
`[8, 9], [5, 9]`, checked against the map). The morning story (the mate
asleep in bed_1 from the start, `asleep`) is unchanged; the `wake` puts
the figure up on the bed's `pillow_side` (as the tile beside the bed:
`getUp` takes the actor's `at`, which the staging sets to the pillow-side
cell for an actor that starts asleep: `the-morning`'s mate `at` becomes
18,6, checked by the staging test).

**The page** (`scene.ts`). The `move` events of the walk draw as every
walk (`walk`, a cell a tick, the walking frames). The `sleep` event:
`layDown` no longer walks; from where the figure stands (the pillow-side
cell), facing the bed, it hops: a tween of `tick × 0.8` along an arc
(x and y to the lying point, with a rise of 0.35 cells at the arc's
middle, `Sine.easeOut` up and `Sine.easeIn` down, two tweens or one with
an `onUpdate` offset), the standing frame facing the bed during the
rise, the lying frame set at the top of the arc, the figure settling to
the lying point and `sleeperDepth` on landing; `SLEEP` in `playback.ts`
is 1 again (the walk is the world's ticks); `lyingUntil` for the night
of D124 is the sleep tick's end. The sleep mark (D130) stays at the
goal's `at`. A unit test where possible; the browser test of *Your bed*:
`data-wizard` goes through 16,9, 17,9 and 18,9 a tick each before
`data-asleep` lying; *The first night*: the mate's `data-actors` goes
along row 6 to 18,6 and never onto a row-5 cell beyond 16,5; three
screenshots of the hop a third of a tick apart at speed 1
(`s27-hop-1.png` to `-3.png`) and one of the mate half-way along row 6
(`s27-mate-walk.png`).

**Documents.** D130 (this commit); `docs/dev/architecture.md`'s events
table: `sleep` one tick, from the pillow-side cell, a hop; D84's words on
`wizard.sleep()` ("lies down in a free bed beside the wizard") say the
walk to the pillow; `art/README.md` where the beds are described says
`pillow_side`; the lesson *Cada cosa en su sitio* and the level's texts
stay true (sleep is still only beside a free bed).

## 4. Gemini images

None. Texts: none.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug` (restart the dev server after the
build), in a private window, as a girl with the look `teal`:

1. `#level/your-bed`, the solution at speed 1: from the marked cell the
   wizard walks down one cell, right two cells along the floor in front
   of the bed, at the pace of every walk, turns to the bed and hops into
   it; the night falls after.
2. `#story/the-first-night`: the friend walks round to the floor under
   bed_6's pillow and hops in; the mate walks along the floor in front of
   bed_1 to the cell under its pillow and hops in; neither crosses a bed.
3. `#story/the-morning`: the mate wakes up and stands on the floor under
   the pillow, then walks as before.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the walk and the hop (the four screenshots); the commit
with its hash and the state of `ci/check.sh --e2e`; what differs from
this plan and why; and the prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, a game for children to learn
Python, at /home/other/Projects/kydux. Another agent, CLAUDE-designer,
plans each sprint and reviews it; you build what the sprint's document
says, and only that, and you two never talk: everything goes through
the owner. Read first, in this order: /home/other/Projects/kydux/
CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-27.md (this plan), D74, D84, D91, D103, D124 and D130
in docs/dev/architecture.md and its events table, and the memory notes
kydux-two-agents, kydux-sprint-26-state, kydux-designer-review-26 and
kydux-uat-9-chapter-2. Build sprint 27: piece 27.1 as one local
commit, ci/check.sh --e2e green before it, never a push, never a timer
(the owner pushes with ci/push.sh). Never stop or build into the
servers on ports 443 and 5173, and never kill a vite, node or nginx
process of the owner's (CLAUDE.md); a vite preview on 4173 is a
leftover of a check run. No Gemini image or text. The plan decides
everything; where it does not, the owner does, through the designer.
Every document and comment in the present. Before git add, read git
diff of each file and stage only your own hunks; commit promptly. Hand
over what section 6 asks, as a report in Spanish, and end with the
prompt for the designer's review in English, in a code block: the
commit, the differences from the plan with their reasons, what to look
at with care, what is left open, and the limits.
```
