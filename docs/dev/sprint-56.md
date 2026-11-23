# Sprint 56 — The forgotten room's side door, made from the painting, and Rinlo down the back stairs

Sprint 55 built all that the owner asked on 2026-11-19 but one
piece, its 3.5: the side door of the forgotten room and Rinlo's
way out by it. The owner's words stand:

> (*Lo que trajo el familiar*, paso 1) Rinlo tiene que aparecer
> desde arriba, abrir la puerta y bajar las escaleras. Está toda
> esa animación hecha? No la veo en las capturas.

Sprint 55 planned the door as two pictures of Gemini: the
doorway empty, and the leaf open. The programmer asked the first
three times and stopped there, as the plan said. This sprint
makes the door another way, and builds the story on it.

**Where it is today.**

- *The painting.* `game-tower-passage-flap.png`
  (`art/raw/game-tower-passage/`, 4800 x 3584, a cell 240 by
  238.933 pixels) shows the door from above, shut: a wooden
  plank lying in the room's left wall, from (5.58, 2.6) to
  (5.88, 4.02), with small pale stones at its two sides, the
  whole from (5.45, 2.6) to (6.0, 4.08). Above it the wall's
  strip of pale stones ends on a stone whose foot is at y = 2.6;
  below it a stone block, from (5.45, 4.09), joins the top of
  the room's front wall. Left of it is the landing's floor, dark
  near the scroll shelves and paler below; right of it the
  room's floor, the crates from x = 6.15.
- *Gemini's three tries* (`tower-passage-doorway-try1.png` to
  `-try3.png`, the part from (0, 0) to (10, 5.65)). Each took
  the plank out and drew the wall's strip longer in its place:
  down to y = 3.27 in the first, 2.9 in the second, 2.85 in the
  third. The second and the third painted the landing's floor
  anew as well, and the third a channel through the doorway. The
  model reads the plank and its stones as wall, and puts wall
  back. `tools/art/lay.py` keeps the difference within a box,
  and the stones added lie inside the door's box: no try can be
  laid. Three pictures were spent; the chapter's count stands at
  47 of 120.
- *The cells.* The landing, the back stairs and the floor before
  the room's crates are a story's cells (D288): `l` on (2, 3) to
  (5, 3) and (2, 4) to (2, 8), `v` on (6, 3) and (7, 3). The
  door's cell, (5, 3), is among them.
- *The story.* *Lo que trajo el familiar* has twenty-seven steps.
  Its first, the voice's, with the camera wide, takes Rinlo out
  of sight where he sits, brings him into sight at (2, 12) and
  walks him to (5, 13) while the three children turn left.
- *Doors made by a tool.* `tools/art/door.py` (D144) opens a
  door seen from the front, its leaf scaled and lifted; no scene
  of the game uses it, and D148's states by Gemini's edits took
  its place. This door is seen from above, and what it needs is
  neither a leaf scaled nor a model: a strip of floor, and the
  same plank lying another way.
- *The designer's trial* (`drafts/sprint-56/side_door_trial.py`,
  never committed, with its pictures beside it): the doorway
  filled with the floor at its two sides, and the plank turned a
  quarter and laid along the foot of the scroll shelves. At
  twice the game's size the doorway reads as floor running
  through, and the plank as the door swung open. At four times,
  the trial has two flaws this sprint mends: the plank is cut by
  a box, with pale slivers of the wall's stones at its corners,
  and a small crack of the room's floor is cut in half at the
  box's right side.

## 1. Decisions taken here

- **D289 — The forgotten room's side door is made from the
  painting's own pixels, and Rinlo comes down the back stairs.**
  Decided 2026-11-19 by the owner (*Rinlo tiene que aparecer
  desde arriba, abrir la puerta y bajar las escaleras*); how the
  door is made, by the designer. The forgotten room's side door,
  in its left wall at (5, 3), onto the landing of the back
  stairs, is the thing `room_door` of the scene's settings. The
  painting shows it from above, shut: a wooden plank lying in
  the wall's strip, with small stones at its sides. A model
  asked to take the plank out draws the wall longer in its
  place, so the door's two pictures are made by
  `tools/art/side_door.py` from the painting alone. The doorway
  empty: each row of the leaf's box goes from the colour of the
  floor at its left to the colour of the floor at its right,
  and the stone above keeps a dark line along its foot. The door
  open: the plank's own pixels, cut by its outline, turned a
  quarter on its far end and laid along the foot of the scroll
  shelves, left of the doorway. The doorway is the scene's
  ground and the door's `without`; its state `closed` is the
  painting's own leaf and its state `open` the turned plank,
  each cut by the difference (D148), each mask 0 or 1 (D155). It
  rests closed (D104), so every level and story of the scene
  shows it shut. Outside the leaf's box and the turned plank's,
  every pixel of the ground is the painting's own, and the
  trench's covers stay fitted. The open plank lies on row 2: a
  figure on the landing passes in front of it. The door is a
  story's thing (`"art": "room_door"`); no level has it, and the
  arched door in the room's back wall has no open state. In *Lo
  que trajo el familiar* Rinlo stands up, walks to the door,
  opens it, crosses the landing and goes down the stairs to
  their foot at (2, 8), walking out of sight there; in the next
  step he comes into sight at (2, 12), under the corridor's
  arch, and walks to the children. Between the stairs' foot and
  the arch no figure is drawn: there the painting shows the
  corridor's wall from above and its arch from the front, and a
  figure walking through would have its head over the wall's top
  while its legs stood in the arch's opening. Rules out a Rinlo
  who is taken out of his room and put in the corridor, a figure
  drawn across the arch's stones, and a wall redrawn by a model
  to open a door in it.

D144 and D148 are brought to it: D144's tool is for a door seen
from the front, and D148's edits for a thing a model draws; a
leaf the painting shows whole and flat, from above, is moved as
it is (D289).

## 2. What is asked

### 2.1 The tool (D289)

**What is asked.** `tools/art/side_door.py <scene> <door thing>`,
a sibling of `door.py`, for a door seen from above lying in a
wall that runs up the picture. Its settings are `side_door` in
the thing's entry of the scene's `cut.json`, in cells of the
painting:

- `leaf`: the box of the leaf with the stones at its sides, what
  the doorway loses. Here about `[5.45, 2.6, 6.0, 4.08]`:
  measured on the painting, its top on the foot of the stone
  above, its bottom on the top of the block's dark outline, its
  sides in the floor, clear of the stones' outlines.
- `plank`: the plank's own shape with its dark outline, a
  polygon traced on the outline's outer edge, or a box and the
  outline found in it. Here about (5.58, 2.6) to (5.88, 4.02).
- `to`: where the turned plank lies, the cell point of its
  hinge end's top corner. Here the plank's right end at
  x = 5.49, the left edge of the wall's strip, and its top at
  y = 2.7, just under the foot of the shelves' post: the plank
  then lies from about (4.04, 2.7) to (5.49, 3.0).

It writes two pictures into the scene's edits folder and the
settings they need, as `door.py` does:

1. **`<door>-doorway.png`, the doorway empty.** Within `leaf`,
   each row takes the floor's colour just left of the box and
   just right of it (the middle of some ten pixels on each
   side, smoothed down the rows so that no row shows as a
   stripe) and goes smoothly from the one to the other across
   the box, with the floor's own faint grain. The fill dies away
   into the floor over a few pixels outside the box's two
   sides, where both are floor: nothing of the leaf's stones is
   mixed into it. The stone above keeps a dark line along its
   foot, of the colour and the width of the wall's outlines,
   measured on them. The block below is untouched. A mark of
   the floor that the box's side would cut in half (the small
   crack right of the door, near (6.05, 3.3)) is either whole
   or gone, never half.
2. **`<door>-open.png`, the door open**: the doorway picture
   with the plank on it. The plank's own pixels, cut by its
   shape and not by a box, turned a quarter so that its far
   end, the one against the stone above, stays to the right, by
   the wall; the end that was cut from the block's side gets
   the outline's dark line. Laid at `to`. No shadow is added: a
   soft shadow has no mask of 0 or 1.

The same painting and settings give the same two pictures, byte
for byte: the grain's numbers come from a fixed seed. The tool
writes the thing's `without`, its two states and their boxes,
each the smallest that holds its change, and prints what it
wrote.

**Looked at, enlarged to four times the game's size**
(`art/raw/game-check/`): the doorway has no line at the box's
sides, no stripe, no smear and no pale sliver; the floor through
it is as dark as the landing's on its left and as the room's on
its right at each height; the stone above ends on its dark line.
The open plank is whole, with its outline all round and nothing
of the wall's stones at its corners; nothing of it is in the
doorway.

**Tests.** `tests/tools/test_art.py` or a file of its own, on
small made-up paintings: a box filled between a left colour and
a right colour takes the left's at its left edge, the right's at
its right, and changes nothing outside the box and its soft
sides; a row's stripe beside the box does not go across it; the
turned plank has the first's pixels a quarter turned, its hinge
end to the right; two runs write the same bytes.

### 2.2 The scene

**What is asked.**

- `art/scenes/the-tower-passage/cut.json`: the ground is
  `room_door-doorway.png`; the painting stays
  `game-tower-passage-flap.png`. The thing `room_door`, a door
  as the storeroom's `store_door` is: `"at": [5, 3]`,
  `"rest": "closed"`, `"without"` the doorway, its state
  `closed` cut from the painting, on row 3, its state `open`
  from `room_door-open.png`, on row 2, with its `side_door`
  settings. The three covers, `laid`'s flap, `hides`, `rims`,
  `nudged`, `lowered` and `kept` are untouched; `about` and
  `source` say how the door is made, in the present, and name
  the tool. Gemini's three tries are named nowhere.
- The scene exported again
  (`.venv/bin/python tools/art/export_scene.py the-tower-passage`).
  Outside the leaf's box the exported ground is, pixel for
  pixel, today's: compare them and say so in the report. With
  the door shut, the scene drawn is today's within the leaf's
  box as well: the closed state lays the painting's leaf back
  with no line round it.
- The trench's rim and the two mouths cover a familiar as they
  do today: the sweep says of them what it says today, and
  nothing new of the story's cells. If the sweep finds something
  in front of a figure on a story's cell, the mask is fitted
  (its row, its box); no figure is moved and the sweep is not
  loosened.
- Enlarged, at four times its size on the game's ground: the
  door shut is the painting's door; the door open has its plank
  whole along the shelves' foot and the doorway clear; Rinlo on
  (4, 3) and on (5, 3) is in front of the plank, of the wall's
  strip and of the stone above, whole, and his feet stand above
  the block.
- No level's world has the door, and nothing of the two levels
  changes: their plans show the door shut, as today's do.

**Tests.** `tests/project/test_chapter_5_art.py`: the door's two
states are in the scene's `art.json`, it rests closed, its open
picture has nothing below y = 3.05 and nothing right of
x = 5.5. `sweeps.spec.ts` and `painted.spec.ts` green.

### 2.3 The story

**What is asked.** `story.json` of *Lo que trajo el familiar*
has the door among its things, shut:

```json
"things": [
  {"kind": "door", "id": "room_door", "at": [5, 3], "art": "room_door", "open": false}
]
```

Its first step is two, twenty-eight in all; every later step is
as it is, one place on:

```json
{"who": "voice", "camera": {"wide": true}, "by": "rinlo", "do": [
  {"stand": true},
  {"walk": [6, 3]},
  {"open": "room_door"},
  {"walk": [[2, 3], [2, 8]], "vanish": true}
]},
{"who": "voice", "camera": {"wide": true}, "do": [
  {"by": "rinlo", "appear": [2, 12]},
  {"by": "rinlo", "walk": [[2, 13], [5, 13]]},
  {"by": "wizard", "face": "left"},
  {"by": "friend", "face": "left"},
  {"by": "mate", "face": "left"}
]}
```

The first step's words are parted in two at the sentence's end,
with no word changed. `text.es.json`:

1. `Tienes un puñado de trozos de hilo negro en la mano. Arriba
   se oye un cerrojo, y pasos en la escalera de atrás.`
2. `Rinlo aparece por el arco del fondo del pasillo, muy pálido.`

`text.en.json`:

1. `You have a handful of pieces of black thread in your hand.
   Above, a bolt is heard, and steps on the back stair.`
2. `Rinlo comes out of the arch at the end of the corridor, very
   pale.`

Rinlo's walk is a person's, at a person's pace in a story. The
door opens with a door's sound and its fade (D156). The children
turn left as Rinlo comes into sight, not before. Where the
story's staging has no act the steps above need as written (a
walk given as corners, `vanish` at a walk's end, `appear`), the
smallest act that does it is added, and said in the commit.

**Tests.** `test_stories.py` and `tests/project/test_story.py`:
the story is built, with its twenty-eight steps and its texts'
twenty-eight in both languages; a walk through `room_door` shut
is refused. `story.spec.ts`: the story's first step ends with
the door's open picture drawn (`data-door-looks`) and Rinlo out
of sight; its second with Rinlo at (5, 13) and the three
children facing left; the test that goes on to the evening
counts one step more.

### 2.4 What the owner will try

1. *El pasadizo pequeño* and *El cuarto olvidado*: the room's
   side door is shut, as it has been, and nothing else is new.
2. *Lo que trajo el familiar*, first page: Rinlo gets up, walks
   to the side door, and it opens: the plank lies along the foot
   of the scroll shelves and the floor runs through the doorway.
   He crosses the landing and goes down the back stairs, out of
   sight at their foot.
3. Second page: he comes out under the corridor's arch, and the
   children turn to him.
4. The walkthrough: that story's first step has pictures taken
   while it plays, Rinlo at the door, on the landing and on the
   stairs.

### 2.5 What is left out, and why

- **Gemini.** Nothing is asked of it. The three tries of sprint
  55 stay in `art/raw/`, which is not in the repository, and no
  setting names them.
- **A door painted open from the front**, standing against the
  shelves with its face seen. The painting shows this door from
  above, and the open plank is that same door. If the owner
  wants it painted, it is one edit of the doorway picture by
  Gemini, a thing added, and the turned plank gives way to it.
- **A shadow under the open plank.**
- **Rinlo drawn through the arch.** Between the stairs' foot and
  the arch the painting has no floor a figure can be drawn on
  (D289). A walk seen all the way asks another painting of that
  corner; it is the owner's to ask.
- **A sound for the bolt.** The story's words say it; the door's
  own sound plays.
- **The arched door in the room's back wall**: no one goes
  through it.
- **`door.py`** is left as it is.

## 3. The pieces

One local commit each, in order.

### 3.1 The tool (2.1)

`tools/art/side_door.py` and its tests. `ci/check.sh` green.

### 3.2 The door in the scene (D289, 2.2)

The passage's `cut.json`, the two pictures made by the tool, the
scene exported, the tests of 2.2; D289 entered, D144 and D148
brought to it, D273 naming the door, the plan's chapter 5 naming
D289. `ci/check.sh`, `sweeps.spec.ts`, `painted.spec.ts` and
`chapter-5.spec.ts` green.

### 3.3 The story (2.3)

The story's three files, the tests of 2.3. `ci/check.sh`,
`story.spec.ts` and `chapter-5.spec.ts` green.

### 3.4 The whole check, the walkthrough and the report

`ci/check.sh --e2e` whole, once, in a copy. Then chapter 5's
walkthrough, made anew
(`cd app && npm run walkthrough -- 05-the-familiar`). The report
in Spanish, in `drafts/`: the four steps of 2.4; pictures of the
current commit only (the side door shut and open, at the game's
size and at four times; Rinlo at the door, in the doorway, on
the landing, on the stairs and under the arch); the ground
compared outside the leaf's box; the numbers measured for the
tool's settings; what was decided where the plan does not
decide. The memory note `kydux-sprint-56-state`, and the prompt
for the designer's review.

## 4. Gemini

Nothing. The chapter's count stands at 47 of 120.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 56: the forgotten room's side door and Rinlo's
way down the back stairs, the piece 3.5 that sprint 55 left
unbuilt when Gemini's three tries failed. The door is made by a
tool from the painting's own pixels, with no model. Build it on
the last commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-56.md (this plan, whole),
docs/dev/sprint-55.md (its sections 2.4 and 2.5), and in
docs/dev/architecture.md D104, D144, D148, D155, D156, D273,
D281 and D288. Then your memory notes kydux-sprint-55-state,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-github-only-code-and-docs and kydux-mask-fit-not-figure.
Then the designer's trial, drafts/sprint-56/side_door_trial.py,
and the three looks beside it (look-shut.png, look-doorway.png,
look-open.png): it shows the way and its numbers, in the
painting's pixels; it is not the tool, and it is never
committed.

What is asked, in short; the plan has each in full.

1. The tool, tools/art/side_door.py <scene> <door thing>, with
its settings side_door in the thing's entry of cut.json. It
writes <door>-doorway.png, the leaf's box filled row by row from
the floor's colour at its left to the floor's colour at its
right, dying away into the floor at its two sides, the stone
above keeping a dark line along its foot; and <door>-open.png,
the plank's own pixels, cut by its outline, turned a quarter
with its far end to the right and laid along the foot of the
scroll shelves. Byte for byte the same on a second run. The
trial's two flaws are mended: the plank is cut by its shape, not
by a box, and no mark of the floor is cut in half at the box's
side.

2. The scene. The passage's ground is the doorway picture; the
thing room_door at (5, 3) rests closed, its closed state the
painting's own leaf on row 3, its open state the turned plank on
row 2, each by the difference, each mask 0 or 1. The scene
exported; outside the leaf's box the ground is today's pixel for
pixel, and with the door shut the scene drawn is today's. D289
entered with the plan's words.

3. The story. Lo que trajo el familiar has the door and opens
it. Its first step becomes two, as the plan writes them: Rinlo
stands, walks to the door, opens it, crosses the landing and
goes down the stairs out of sight; then he comes into sight
under the arch and the children turn. The texts are parted in
two, no word changed.

Build pieces 3.1 to 3.4 in order, one local commit each. Before
each commit, ci/check.sh and the browser specs the piece touches
green; the whole ci/check.sh --e2e once, before the report, in a
copy with Playwright's own server and the app built anew in that
copy. Never a push, never a timer, never a deploy. Never stop or
build into the servers on ports 443 and 5173; a preview left on
4173 is a browser run's leftover and may be stopped, and yours
is stopped when you are done. Nothing under .github/ changes.
Nothing is asked of Gemini, picture or text.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for:
(1) the forgotten room's side door shut in the two levels, as it
    has been, and nothing else new in them;
(2) Lo que trajo el familiar: Rinlo gets up, walks to the side
    door, and it opens, the plank along the foot of the scroll
    shelves and the floor running through the doorway;
(3) he crosses the landing and goes down the back stairs; on the
    next page he comes out under the arch and the children turn
    to him;
(4) the walkthrough's pictures of that step while it plays.

The plan gives the decision's words, the cells and the texts:
enter them as they are. Its numbers for the leaf, the plank and
where it lies are the designer's measures on the painting:
measure them again and take yours where they differ, and say
them in the report. Where the plan does not decide (how the
plank's shape is given and found, how wide the soft sides are,
the grain, the states' diff settings and boxes, how the scene's
ground and painting are named in the settings, an act the
story's staging lacks), take the smallest choice that keeps its
intent and say it in the commit. Do not build what section 2.5
leaves out. Look at each picture enlarged before you keep it. A
cover that hides too much is measured against the painting and
fitted: no figure is moved and the sweep is not loosened. Never
edit content while a browser run is going. Every document and
comment in the present. Before git add, read git diff of each
file and stage only your own hunks; nothing of drafts/ enters a
commit.

docs/dev/sprint-56.md is the designer's and is committed
already; leave it as it is.

Hand over, in drafts/ and never committed: chapter 5's
walkthrough made anew, and the report in Spanish as 3.4 asks,
with the four steps of 2.4 and pictures of the current commit
only. Write your memory note kydux-sprint-56-state, and end with
the prompt for the designer's review in English, in a code
block.
```
