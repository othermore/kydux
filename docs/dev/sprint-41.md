# Sprint 41 — The shed framed, its lying brooms seen or hidden, and what the review of sprint 40 left

The designer's review of sprint 40 (2026-11-11) accepted the shed as the
owner asked for it: the brooms hung on their pegs, `find_all` by where
the wizard stands, the broom's lesson and its practice, the list's index,
both ways of a loop, the story's camera on the shed, the fields' static
things, the notebook's Python section and the map folded by chapter. The
review fixed in commits of its own the check's way with eight brooms
(its solution bumped into the wall), a bubble cut by a story step's
frame, and small things in the shed's texts. It left what follows, none
of it a fault of the build. The review asked the owner one thing,
whether the straw's brooms are seen before a program finds them, and
their answer of the same day is D202 and piece 3.2. The owner is away
this week and reads the whole chapter again, through the walkthrough,
once this sprint is built and its review finds nothing. Nothing is
released until they are happy with chapter 4.

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
- **D202 — In the shed a lying broom is in sight on the boards or hidden
  under the straw.** Decided 2026-11-11 by the owner (*Hay que colocar
  algunas a la vista (donde no hay paja) y otras escondidas (donde sí hay
  paja) para que tenga sentido el find_all pero tenga sentido la historia
  de "están desordenadas o tiradas por el suelo" que decimos. Lo ideal es
  tener 3-4 localizaciones en la paja y 3-4 localizaciones fuera de la
  paja, y colocarlas la mitad en la paja y la mitad fuera de la paja, en
  distintos sitios según la "manera" para que el programa deba funcionar
  con todos*). On the shed's picture the floor's zone, rows 7 and 8, has
  straw on the cells (6, 7), (6, 8), (7, 8), (12, 8) and (13, 8) and bare
  boards on the others. A lying broom on one of those five cells is
  `hidden` until a program finds it (D184); a lying broom on the boards
  is seen from the start; none lies on (13, 7), half under the straw, nor
  on row 6, the wall's zone. The knotted lying brooms are four, two on
  the boards and two under the straw, laid otherwise in each way of the
  levels whose program looks for them; the story and the
  levels whose program does not look for them show the two on the boards.
  The zone keeps its name, `straw`, and the texts their *la paja*: it is
  the floor away from the wall. Rules out a broom that appears from bare
  boards, a floor left empty after the story has shown brooms lying on
  it, and a count made by eye.

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

### 2.2 The lying brooms, in sight and under the straw (D202)

The cells, by stop. `broom_0` is the one at the wizard's feet by the
door, at (9, 8), on the boards and in sight wherever it is. The four
knotted lying brooms are `broom_1` and `broom_2` on the boards and
`broom_3` and `broom_4` under the straw, so that a way only moves them.

| Stop | Hung | On the boards, seen | Under the straw, hidden |
|---|---|---|---|
| `story:the-morning-after`, step 4 | `broom_6` to `broom_9` | (9, 8), (7, 7), (11, 7) | not staged |
| `the-broom-at-your-feet` | as it has | (9, 8), (7, 7), (11, 7) | not in the level |
| `the-shed`, way `six` | `broom_6` | (9, 8), (7, 7), (11, 7) | (6, 8), (13, 8) |
| `the-shed`, way `seven` | `broom_6`, `broom_7` | (9, 8), (10, 7), (11, 8) | (6, 7), (12, 8) |
| `the-shed`, way `eight` | `broom_6` to `broom_8` | (9, 8), (7, 7), (11, 8) | (7, 8), (13, 8) |
| `the-brooms-on-the-wall`, every way | as it has | (7, 7), (11, 7) | not in the level |
| `the-brooms-in-the-straw`, way `four` | as it has | (11, 7), (8, 7) | (6, 7), (6, 8) |
| `the-brooms-in-the-straw`, way `four_low` | as it has | (10, 8), (8, 8) | (12, 8), (6, 8) |
| `the-brooms-in-the-straw`, way `four_mid` | as it has | (10, 7), (9, 8) | (7, 8), (6, 8) |
| `the-check` | as it has | none | none |

What follows from it, stop by stop:

- **The story.** Step 4 stages three lying brooms, all in sight: the one
  by the door and the two on the boards. The story's walks end on
  (8, 8), (9, 8) and (10, 8) as they do. The words are the owner's and
  do not change.
- **`the-broom-at-your-feet`.** The two knotted brooms on the boards are
  in the level, seen and not asked for: `find_nearest` gives the one at
  the wizard's feet, at no step from it, and the goal names it as it
  does.
- **`the-shed`.** `broom_0` is seen. From the door `find_all` gives five
  brooms, the three in sight and the two it uncovers, and by the wall
  one, two or three: six, seven or eight in all, so the ways keep their
  ids and their names. A count made by eye is short by two in every way.
- **`the-brooms-on-the-wall`.** The two knotted brooms on the boards
  stay in sight while the wall's are untied, as the intro says (*Las
  escobas de la paja las dejamos para luego*). Its first goal counts the
  wall's brooms only: `{"kind": "untied", "zone": "wall"}`, a goal
  `untied` that takes a zone and counts that zone's brooms in the way
  played (its `ids` cannot: a way takes hung brooms away, and the goal
  refuses a name the way has not). Its words say it: *No dejes ninguna
  escoba colgada con nudo.* and "Leave no hanging broom knotted."
- **`the-brooms-in-the-straw`.** Four brooms, and the ways are `four`,
  `four_low` and `four_mid`, named *cuatro escobas*, *cuatro escobas,
  más abajo*, *cuatro escobas, en medio* and "four brooms", "four
  brooms, lower down", "four brooms, in between". The friend stands on
  (13, 8), clear of (12, 8), and the other pupil on (13, 7) as now. From
  the start, (12, 7), the brooms of every way come from `find_all` at 1,
  4, 6, 7 steps, at 1, 3, 5, 7 and at 2, 4, 6, 7, each left of or under
  the one before and none above it, and the last on (6, 8): the level's
  solution wins the three as it is written, and its steps down come at
  the end, at the start or in the middle by the way. The owner's intro
  and the goals' words stay.
- **`the-check`.** Every broom hangs; nothing changes.

These are the only words the child reads that this sprint changes: one
goal of the wall's level and the three names of the straw's ways, in
both languages, as written above.

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

### 3.2 The lying brooms (D202)

- World: the goal `untied` takes `"zone"`, a zone of the level, and
  counts the brooms of that zone in the way played; refused together
  with `"ids"`, and where the zone has no broom in some way. Its tests.
- Content: the story's step 4 and the four levels as 2.2's table and
  list say, cell by cell, the friend's cell in the straw's level with
  them; the wall's goal and its words; the straw's ways under their
  ids and names wherever they are written (the level, its two text
  files, the tests), and its wrong program that writes one way's steps
  written for the way `four`. The test of the straw's order asks what
  2.2 says: each broom left of or under the one before, none above it,
  the four at growing distances. Every level of the shed wins with its
  solution in every way with three stars, and the tests of the programs
  that lose hold as they are.
- A content test over every level and story staged in `the-broom-shed`,
  in every way: a lying broom is hidden where it lies on one of D202's
  five straw cells and seen elsewhere, none on (13, 7) or on row 6; in
  `the-shed` and `the-brooms-in-the-straw` two knotted brooms lie on
  the boards and two under the straw, and no two ways lay the four on
  the same cells.
- Documents: D202 logged in `docs/dev/architecture.md`, D184's and
  D196's words on the shed agreeing with it; `docs/dev/course.md`'s rows
  of the five stops.
- Check: `world/tests`, `e2e/chapter-4.spec.ts`, `e2e/story.spec.ts`; a
  browser test that at the start of `the-brooms-in-the-straw` two lying
  brooms are drawn and after the run's `find_all` four.

### 3.3 Zarek's flying rows

- As 2.3; `art/raw/figures-check.png` made again; the prompts used are
  committed beside the others.
- Check: the art checks, `e2e/chapter-4.spec.ts` (the race).

### 3.4 The loop by index, proved

- As 2.4.
- Check: `world/tests`.

### 3.5 The tests, the walkthrough and the report

- The whole `ci/check.sh --e2e`, in a copy, before the last commit.
- The walkthrough of each of the four chapters made again (`npm run
  walkthrough -- <chapter>`), chapter 4's first: the owner reads the
  whole story through them once the review of this sprint finds
  nothing.
- The report in Spanish in `drafts/`, with pictures of the current
  commit only: the five levels of the shed at their start, `the-shed`
  and `the-brooms-in-the-straw` after their `find_all` in each way, the
  story's step 4, Zarek's rows; and the prompt for the designer's
  review.

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
keep a bubble inside a story step's frame (bubbleRoom,
SceneCamera.shown), and corrected the shed's texts: read them with git
log -p 6a6d0dc..HEAD before you start. Build sprint 41 whole: pieces 3.1
to 3.5 in order, one local commit each; before each commit ci/check.sh
and the browser specs the piece touches green, and the whole ci/check.sh
--e2e once before the last commit, in a copy with Playwright's own
server on 4173; never a push, never a timer, never a deploy: the owner
is away and nothing is released until they are happy with chapter 4.
Never stop or build into the servers on ports 443 and 5173, and stop
your own preview when you are done. Gemini paints at most 3 images,
named in their commits. The only words the child reads that change are
the ones section 2.2 gives, letter for letter; if another must, Gemini
writes it from a brief and you read and correct the draft, and the
owner's own Spanish words are kept as they are. The plan decides
everything; where it does not, take the smallest choice that keeps its
intent and say it in the commit. The owner reads nothing before you
build: they read the whole story in the walkthroughs once the designer's
review of this sprint finds nothing. Every document and comment in the
present. Before git add, read git diff of each file and stage only your
own hunks; commit promptly. Hand over the walkthroughs and a report in
Spanish as 3.5 asks, and end with the prompt for the designer's review
in English, in a code block.
```
