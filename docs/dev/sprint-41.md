# Sprint 41 — The shed's levels framed, and what the review of sprint 40 left

The designer's review of sprint 40 (2026-11-11) accepted the shed as the
owner asked for it: the brooms hung on their pegs, `find_all` by where
the wizard stands, the broom's lesson and its practice, the list's index,
both ways of a loop, the story's camera on the shed, the fields' static
things, the notebook's Python section and the map folded by chapter. The
review fixed in commits of its own the check's way with eight brooms
(its solution bumped into the wall), a bubble cut by a story step's
frame, and small things in the shed's texts. It left what follows, none
of it a fault of the build. The owner is away this week and reads the
chapter through documents with captures
(`drafts/uat-capitulo-4.es.md` and the walkthrough of the day); what
they write on them may add pieces to this sprint, which is then written
again. Nothing is released until they are happy with chapter 4.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer, never a deploy; the servers on 443 and 5173
untouched; documents and comments in the present; Gemini writes every
text the child reads from a brief.

## 1. Decisions taken here

- **D201 — A level may frame a place.** Decided 2026-11-11 by the
  designer, from the walkthrough's pictures of the shed's levels: at a
  level's start the camera shows the wizard and every actor, who stand
  in the straw, so the view sits low, the shed's roof is cut off and the
  goals' panel lies over the pegs: in *Las escobas de la pared* over
  every hung broom, the very things the level is about. A level's
  `level.json` may say `"camera": {"fit": [[x0, y0], [x1, y1]]}`, as a
  story's step does (D199): at the level's start, and again when the
  level starts over, the page shows that box of cells whole, zoomed out
  as far as it must and no further than its zoom of 1, centred on it. A
  run does not take the camera back to the wizard while the wizard stays
  inside the box; the child's zoom, drag and *Find my wizard* work as
  they do everywhere, and the next start frames the place again. The
  world checks the box against the scene and asks that it holds the
  start, every mark and every thing of the level in every way. The
  scene's parent says it in `data-camera-fit`, as a story does. The
  shed's five levels frame the shed: every peg, the straw and the door
  in view, and no peg or hung broom under the goals' panel at 1280 by
  800. Rules out a level whose things are under the page's own panels
  when it opens, and a shed seen in pieces.

## 2. What is asked

### 2.1 The shed's levels framed (D201)

The five levels `the-broom-at-your-feet`, `the-shed`,
`the-brooms-on-the-wall`, `the-brooms-in-the-straw` and `the-check` name
the same box. The designer's sum for it, to be checked on the page and
changed where the picture says otherwise: `[[3, 0], [16, 10]]`, eleven
rows, which at 1280 by 800 puts the pegs' row about 255 pixels under the
view's top, where the goals' panel ends about 178 pixels down. What
holds is the picture, not the sum: the roof's ridge, the eight pegs,
the straw's two rows and the door's threshold all in view, the wizard
and the two friends whole, and each of the eight pegs with its broom
clear of the goals' panel and of the buttons over the scene. Where the
window is too low for that (a handheld, D-pad layout), the framing does
what it can and the level plays as it does today.

The other chapters' levels are not touched: a level without `camera`
starts as it does now.

### 2.2 The story's lying brooms where the levels find them

In `the-morning-after`, step 4 stages the lying brooms at (7, 7),
(12, 7), (6, 8) and the one by the door at (9, 8). The levels that
follow find the straw's brooms at (10, 7), (8, 8) and (6, 8) (`the-shed`
and the first way of `the-brooms-in-the-straw`). The story stages its
three at those cells, so that a broom the child's program finds in the
straw appears where the story showed one lying. The words are the
owner's and do not change.

Whether the straw's brooms should be seen in the levels before a program
finds them is the owner's to say (the report asks it); until they do,
the levels keep them under the straw (D184), as the owner's note on the
rule says (*las que están tiradas en el suelo bajo la paja*).

### 2.3 Zarek's flying views

`art/raw/figures-check.png`: flying to a side, Zarek raises a hand off
the broom, and flying up, both. A racer holds his broom. The two rows
are asked of Gemini again from the down view accepted in sprint 40
(`tools/art/prompts/figure-zarek-fly.md`, both hands on the handle said
first and again at the end), cut and rimmed as the others; the row that
comes back worse than what there is, is not taken, and the report says
so. At most 3 images.

### 2.4 The second way of a loop, tried

`lesson:for-each` shows `for i in range(len(brooms)):` on its second
page and no level asks for it. The design's choice stands (the lesson
shows both, a level may use either), and the practice's own tests gain
the proof: `the-brooms-on-the-wall` has a second solution,
`solutions/by_index.py` or the folder's own convention for more than
one, written with the index, and the content test wins every way with
it, three stars. No text changes.

## 3. The pieces

### 3.1 The level's framing (D201)

- World: `level.json`'s `camera` read and checked (`_step_camera`'s
  check, and the start, the marks and every way's things inside the
  box); handed to the page with the level.
- Page: the level's start and its starting over place the framing
  (`SceneCamera`: the start's own framing gives way to the level's box;
  a run keeps it while the wizard is inside; zoom, drag and *Find my
  wizard* as now); `data-camera-fit` on the scene's parent; a bubble
  keeps inside what the framing shows (`bubbleRoom`, as in a story).
- Content: the shed's five levels.
- D201 logged in `docs/dev/architecture.md`, and the field said where
  that document describes `level.json`.
- Tests: the world's (a box off the scene, a box that leaves out the
  start or a thing of some way: refused); Vitest for the frame held
  through a run inside the box and let go by a drag; a browser test, for
  each of the five levels at 1280 by 800, that no peg's cell (x, 5), x
  from 6 to 13, and no cell (x, 4) over it, meets the goals' panel's box
  or the scene's buttons, and that the door's cells and the roof's row
  are inside the canvas.
- Check: `world/tests`, Vitest, `e2e/chapter-4.spec.ts`, `e2e/camera.spec.ts`.

### 3.2 The story's brooms

- `content/stories/the-morning-after/story.json`: the three lying brooms
  at (10, 7), (8, 8), (6, 8); the one at (9, 8) stays; no walk of the
  story's crosses a broom it did not cross before, or the walk is moved
  a cell and the commit says it.
- Check: `world/tests`, `e2e/story.spec.ts` and the chapter's story test.

### 3.3 Zarek's flying rows

- As 2.3; `art/raw/figures-check.png` made again; the prompts used are
  committed beside the others.
- Check: the art checks, `e2e/chapter-4.spec.ts` (the race).

### 3.4 The loop by index, proved

- As 2.4.
- Check: `world/tests`.

### 3.5 The tests, the walkthrough and the report

- The whole `ci/check.sh --e2e`, in a copy, before the last commit.
- Chapter 4's walkthrough made again (`npm run walkthrough --
  04-the-broom`), for the owner to write on.
- The report in Spanish in `drafts/`, with pictures of the current
  commit only: the five levels of the shed at their start, the story's
  step 4, Zarek's rows; and the prompt for the designer's review.

## 4. Gemini images

At most 3 (2.3). Chapter 4 stands at 28 of 50.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux. Read
first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-41.md (this plan, whole), docs/dev/sprint-40.md (what
you built last), drafts/uat-capitulo-4.es.md (the designer's review of
sprint 40; its findings section), and the memory notes kydux-two-agents,
kydux-sprint-40-state, kydux-designer-review-40 and
kydux-checks-per-piece. The designer's commits after yours (7618d78 to
the plan's own) changed the check's ways to five, six and seven brooms,
keep a bubble inside a story step's frame (bubbleRoom, SceneCamera.shown),
and corrected the shed's texts: read them with git log -p 6a6d0dc..HEAD
before you start. Build sprint 41 whole: pieces 3.1 to 3.5 in order, one
local commit each; before each commit ci/check.sh and the browser specs
the piece touches green, and the whole ci/check.sh --e2e once before the
last commit, in a copy with Playwright's own server on 4173; never a
push, never a timer, never a deploy: the owner is away and nothing is
released until they are happy with chapter 4. Never stop or build into
the servers on ports 443 and 5173, and stop your own preview when you
are done. Gemini paints at most 3 images, named in their commits. No
text the child reads changes in this sprint; if one must, Gemini writes
it from a brief and you read and correct the draft, and the owner's own
Spanish words are kept as they are. The plan decides everything; where
it does not, take the smallest choice that keeps its intent and say it
in the commit. If the owner hands you comments on the walkthrough with
this prompt, they come first and the plan's pieces after. Every document
and comment in the present. Before git add, read git diff of each file
and stage only your own hunks; commit promptly. Hand over a report in
Spanish as 3.5 asks, and end with the prompt for the designer's review
in English, in a code block.
```
