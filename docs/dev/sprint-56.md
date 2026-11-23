# Sprint 56 — The forgotten room's side door, painted open by Gemini, and Rinlo down the back stairs

Sprint 55 built all that the owner asked on 2026-11-19 but one
piece, its 3.5: the side door of the forgotten room and Rinlo's
way out by it. The owner's words stand:

> (*Lo que trajo el familiar*, paso 1) Rinlo tiene que aparecer
> desde arriba, abrir la puerta y bajar las escaleras. Está toda
> esa animación hecha? No la veo en las capturas.

Sprint 55 asked Gemini for the doorway empty, three times, and
no try could be used. The door stays Gemini's to paint, by the
owner's rule of the same day:

> No quiero que hagas la puerta tú con una herramienta.

No tool makes, turns or fills anything of this door. This sprint
asks Gemini again, for another picture and in other words, and
builds the story on it.

**Where it is today.**

- *The painting.* `game-tower-passage-flap.png`
  (`art/raw/game-tower-passage/`, 4800 x 3584, a cell 240 by
  238.933 pixels) shows the door from above, shut: a wooden
  plank lying in the room's left wall, from (5.62, 2.58) to
  (5.87, 4.06), with small pale stones at its two sides, the
  whole from (5.45, 2.57) to (6.0, 4.08). Above it the wall's
  strip of pale stones, from x = 5.47 to 6.0, ends at y = 2.57;
  below it a stone block, from (5.45, 4.1), joins the top of
  the room's front wall. Left of it is the landing: the wall
  with the scroll shelves, whose feet stand at y = 2.7, the
  right shelf's last post from x = 5.17 to 5.32, and the bare
  floor below. Right of it is the room's floor, the crates from
  x = 6.15, and in the room's back wall an arched door of
  planks with dark iron bands.
- *Gemini's three tries of sprint 55*
  (`tower-passage-doorway-try1.png` to `-try3.png`, each an edit
  of the part from (0, 0) to (10, 5.65), `door-part.png`). They
  were asked to take the door away and to run the landing's
  floor through the doorway, with no stone added, no threshold
  and no line. Each took the plank out and drew the wall's strip
  longer: down to y = 3.27 in the first, 2.9 in the second, 2.85
  in the third. What they teach:
  - In this view a wall that ends shows its end face under its
    top. The second try painted just that, a short face of
    darker stones from 2.57 to 2.9, and below it a doorway clean
    of the plank and of its stones. Asking for no stone at all
    asks against the view. An end face no lower than y = 3.0
    leaves the doorway more than a cell long, and a figure's
    feet cross it at y = 3.8.
  - Bare floor painted anew does not join the painting's floor.
    The model's edit of a part comes back a little off in tone,
    some 4 of 255 on the landing's floor in the second try, and
    `tools/art/lay.py` copies only what differs within a box:
    new floor against old floor shows the box's side as a line,
    or the mask's edge as a paler blot. A thing with an outline
    of its own, as the second flap is (D281), is laid with
    nothing seen.
  - The model was told what to take away, and three times it
    put wall back. It has not been asked what a model knows
    best about a door: to open it.
- *The count.* Three pictures were spent; the chapter's count
  stands at 47 of 120.
- *The cells.* The landing, the back stairs and the floor before
  the room's crates are a story's cells (D288): `l` on (2, 3) to
  (5, 3) and (2, 4) to (2, 8), `v` on (6, 3) and (7, 3). The
  door's cell, (5, 3), is among them.
- *The story.* *Lo que trajo el familiar* has twenty-seven steps.
  Its first, the voice's, with the camera wide, takes Rinlo out
  of sight where he sits, brings him into sight at (2, 12) and
  walks him to (5, 13) while the three children turn left.
- *The designer's guide*,
  `art/raw/game-tower-passage/door-open-guide.png`: `door-part.png`
  with two flat boxes, magenta on the door, from (5.45, 2.57) to
  (6.0, 4.08), and cyan where the open leaf stands, from
  (4.15, 0.8) to (5.45, 2.75). It is in `art/raw/`, which is not
  in the repository.

## 1. Decisions taken here

- **D289 — The forgotten room's side door opens, painted by
  Gemini, and Rinlo comes down the back stairs.** Decided
  2026-11-19 by the owner (*Rinlo tiene que aparecer desde
  arriba, abrir la puerta y bajar las escaleras*; *No quiero que
  hagas la puerta tú con una herramienta*). The forgotten room's
  side door, in its left wall at (5, 3), onto the landing of the
  back stairs, is the thing `room_door` of the scene's settings.
  The painting shows it shut, from above: a plank lying in the
  wall's strip. Gemini paints it open, as an edit of that part
  of the painting (D148, D281): the plank and its stones gone
  from the wall; the wall's end showing its end face, no lower
  than y = 3.0; in the doorway a flat stone threshold as wide as
  the wall, with an outline along its two long sides, so that
  nothing painted anew lies against the old floor; and the leaf
  standing open on the landing, seen from the front, flat before
  the right end of the scroll shelves, hinged on the wall's end,
  its foot on the shelves' foot. `tools/art/lay.py` lays the
  picture's two changes on the painting, each the difference
  within its box: the doorway gives the scene's ground and the
  door's `without`, the leaf on it the door's open picture. Its
  state `closed` is the painting's own leaf and its state `open`
  Gemini's, each cut by the difference, each mask 0 or 1 (D155).
  It rests closed (D104), so every level and story of the scene
  shows it shut. Outside the two boxes every pixel of the ground
  is the painting's own, and the trench's covers stay fitted.
  The open leaf is on row 2: a figure on the landing passes in
  front of it. The door is a story's thing
  (`"art": "room_door"`); no level has it, and the arched door
  in the room's back wall has no open state. In *Lo que trajo el
  familiar* Rinlo stands up, walks to the door, opens it,
  crosses the landing and goes down the stairs to their foot at
  (2, 8), walking out of sight there; in the next step he comes
  into sight at (2, 12), under the corridor's arch, and walks to
  the children. Between the stairs' foot and the arch no figure
  is drawn: there the painting shows the corridor's wall from
  above and its arch from the front, and a figure walking
  through would have its head over the wall's top while its legs
  stood in the arch's opening. Rules out a door, a doorway or a
  leaf made, turned, filled or redrawn by a tool; a doorway of
  bare floor painted anew against the painting's floor; a Rinlo
  who is taken out of his room and put in the corridor; and a
  figure drawn across the arch's stones.

D273 names the door, and the plan's chapter 5 names D289.

## 2. What is asked

### 2.1 Gemini's picture: the door open (D289)

**What is asked of Gemini.** One edit of `door-part.png`, the
painting's part from (0, 0) to (10, 5.65), given with the guide
`door-open-guide.png`: the side door open. The prompt file is
`tools/art/prompts/tower-passage-door-open.md`, run by
`tools/art/generate.py`; its front matter is that of sprint 55's
tries (`candidate: game-tower-passage`, `service: gemini`,
`model: gemini-3-pro-image`, `aspect_ratio: 16:9`,
`image_size: 2K`) with
`image: ["art/raw/game-tower-passage/door-part.png", "art/raw/game-tower-passage/door-open-guide.png"]`.
Its words:

```
Edit the first picture, a part of a finished painting of a castle seen from above at an angle. On the right there is a small dusty storeroom: wooden crates, a stool, candles, and an arched door of planks with dark iron bands in its back wall. Its left wall is a narrow strip of pale stones running down the middle of the picture. On the left, outside the storeroom, there is a landing: wall shelves full of rolled scrolls along its back wall, and a bare stone floor in front of them. In the storeroom's left wall, between the landing and the storeroom, there is a narrow side door, shut, seen from above: a long wooden plank lying in the wall's strip, with small pale stones on each side of it.

Make one change only: open that side door. The second picture is the same picture with two flat coloured boxes over it. They only show two places: there is no magenta and no cyan at all in the result.

The magenta box is the doorway. With the door open, the plank and the small stones at its sides are gone from it, all of them. The wall's strip of pale stones ends at the top of the box, where it ends now. Just under its last stone you may show the end of the wall: a short face of the same stones, in shadow, no longer than a quarter of the box. From there down to the pale stone block under the box, which stays exactly as it is, the floor of the doorway is one long flat threshold stone: a worn flagstone of the same dull stone as the landing's floor, a little paler than it, exactly as wide as the wall's strip and no wider, with the painting's dark outline along its two long sides. Nothing stands on the threshold, and no shadow lies on it. Left of the box the landing's floor, and right of it the storeroom's floor, stay exactly as they are.

The cyan box is where the open door stands. The door has swung on its hinges, which are on the end of the wall's strip, out onto the landing, and now it stands flat in front of the right end of the scroll shelves, seen from the front as the shelves are, hiding the part of them behind it. It is a plain door with a flat top, made of upright planks of the same warm wood as the plank that lay in the wall, with two dark iron bands like the arched door's, and a dark outline all round it. It fits inside the cyan box: its hinged side touches the wall's strip, its foot stands on the line where the shelves' feet stand, and no part of it is on the floor below the box or in the doorway. It casts no shadow on the floor.

Everything else stays exactly as it is, pixel for pixel: the rest of the shelves and their scrolls, the landing's floor, the crates, the stool, the candles, the arched door, every other stone of the walls, with the same shapes, sizes, colours and light. The same painted cartoon style, the same black outlines. No grid, no text, no people, no animals.
```

`generate.py` writes each try over `<name>.png`: each is copied
to `tower-passage-door-open-try<n>.png` before the next is
asked. The key is read by the tool from
`~/.config/kydux/secrets.env`; it is never printed, and enters
no file, log or commit.

**How a try is laid.** `tools/art/lay.py` takes one option more,
`--from <picture>`: the picture the edit is laid on, in the
scene's edits folder, the scene's painting when it is not given.
The tool is otherwise as it is. Then, from the one try:

1. The doorway, on the painting:
   `lay.py the-tower-passage <try> --part 0 0 10 5.65 --box <doorway> --out game-tower-passage-doorway.png`.
   Its box is measured on the try, the smallest that holds the
   doorway's change with the outlines that close it: about
   `[5.4, 2.45, 6.05, 4.12]`.
2. The leaf, on the doorway's picture:
   `lay.py the-tower-passage <try> --from game-tower-passage-doorway.png --part 0 0 10 5.65 --box <leaf> --out game-tower-passage-door-open.png`.
   Its box is the smallest that holds the leaf with its outline:
   about `[4.0, 0.7, 5.47, 2.95]`.

The fit is found outside one box, and the try's other change is
in what it measures: the two runs must print the same height and
the same shift. Each run prints that no pixel differs outside
its box.

**How a try is judged.** On the two laid pictures and on the
looks `lay.py` writes, enlarged to four times the game's size,
and once at the game's size. The doorway and the leaf are judged
apart.

The doorway passes when:

- the plank and its small stones are gone, the whole of them;
- nothing of the wall, top or end face, is lower than y = 3.0;
- from there to the block the doorway's floor is flat, with
  nothing standing on it;
- no side of the box and no edge of the mask is seen: no line,
  no step of tone, no blot, no mark of the floor cut in half;
- the block below it is the painting's.

The leaf passes when:

- it reads as that door, open, whole, with its outline all
  round, its hinged side at the wall's strip;
- nothing of it is below y = 3.0, right of x = 5.5 or in the
  doorway;
- no shadow, halo or side of the box is seen round it, and the
  shelves beside it are the painting's.

No magenta and no cyan is anywhere in a try.

**How many.** Six images at most in this sprint. A part that
passes is kept and not asked again; the next try asks only what
is missing, with the same words less the paragraph of the part
kept, and a guide with the one box:

- neither passed: the whole change again, its words mended by
  what the try shows;
- the doorway passed: the leaf alone, as an edit of the same
  part cut from `game-tower-passage-doorway.png`, a thing added
  to it;
- the leaf passed: the doorway alone, as an edit of
  `door-part.png`; the leaf is laid from its own try.

If six are spent and a part is still missing, the sprint stops
there: nothing of 2.2 or 2.3 is built, nothing is committed but
`lay.py`'s option if it was made, and the report shows each try
laid, with what failed in it. No tool then makes what is
missing.

**Tests.** `tests/tools/test_art.py`, beside `lay.py`'s: with
`--from`, the edit is laid on that picture and the painting is
not read for it; without it, the tool does what it does today.

### 2.2 The scene

**What is asked.**

- `art/scenes/the-tower-passage/cut.json`: the ground is
  `game-tower-passage-doorway.png`; the painting stays
  `game-tower-passage-flap.png`. `laid` has the doorway and the
  leaf after the second flap, each with its `from`, its
  `picture`, its `part`, its `box` and its `to`, as measured.
  The thing `room_door`, a door as the storeroom's `store_door`
  is: `"at": [5, 3]`, `"rest": "closed"`, `"without"` the
  doorway's picture, its state `closed` cut from the painting,
  on row 3, its state `open` from
  `game-tower-passage-door-open.png`, on row 2. The three
  covers, `laid`'s flap, `hides`, `rims`, `nudged`, `lowered`
  and `kept` are untouched; `about` and `source` say how the
  door is painted and laid, in the present, and `source` names
  the prompt that gave the picture kept. The prompts of the
  tries not kept are in `drafts/`, and nothing names them.
- The scene exported again
  (`.venv/bin/python tools/art/export_scene.py the-tower-passage`).
  Outside the doorway's box the exported ground is, pixel for
  pixel, today's: compare them and say so in the report. With
  the door shut, the scene drawn is today's within that box as
  well: the closed state lays the painting's leaf and its
  stones back whole, with nothing of the threshold showing
  through and no line round it. Where the difference leaves a
  hole, the state's own settings (`diff`) are fitted until it
  does not.
- The trench's rim and the two mouths cover a familiar as they
  do today: the sweep says of them what it says today, and
  nothing new of the story's cells. If the sweep finds something
  in front of a figure on a story's cell, the mask is fitted
  (its row, its box); no figure is moved and the sweep is not
  loosened.
- Enlarged, at four times its size on the game's ground: the
  door shut is the painting's door; the door open has its leaf
  whole before the shelves and the doorway clear; Rinlo on
  (4, 3) and on (5, 3) is in front of the leaf, of the wall's
  strip and of its end, whole, and his feet stand above the
  block.
- No level's world has the door, and nothing of the two levels
  changes: their plans show the door shut, as today's do.

**Tests.** `tests/project/test_chapter_5_art.py`: the door's two
states are in the scene's `art.json`, it rests closed, its open
picture has nothing below y = 3.0 and nothing right of x = 5.5.
`sweeps.spec.ts` and `painted.spec.ts` green.

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
   to the side door, and it opens: the leaf stands before the
   scroll shelves and the doorway is clear, a threshold stone on
   its floor. He crosses the landing and goes down the back
   stairs, out of sight at their foot.
3. Second page: he comes out under the corridor's arch, and the
   children turn to him.
4. The walkthrough: that story's first step has pictures taken
   while it plays, Rinlo at the door, on the landing and on the
   stairs.

### 2.5 What is left out, and why

- **A door made by a tool.** No tool makes, turns, fills or
  redraws the door, its doorway or its leaf (D289). `lay.py`
  joins Gemini's picture to the painting, and the difference
  cuts the masks, as for every state of the game (D148, D281).
- **The whole scene painted anew** with its door open. A new
  painting moves every stone a little, and the trench's covers,
  the flaps and the plans are fitted to this one.
- **A doorway of bare floor.** The threshold stone is what lets
  the doorway be laid with no line (D289).
- **A shadow under the open leaf.** A soft shadow has no mask of
  0 or 1.
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

In order. Pieces 3.2 and 3.3 are one local commit each; 3.1
commits nothing, its pictures are in `art/raw/`.

### 3.1 Gemini's picture (D289, 2.1)

`lay.py`'s option `--from` and its test, held for 3.2's commit.
Then the tries, each laid and judged as 2.1 says, until the
doorway and the leaf have both passed or six images are spent.
If they are spent, the sprint ends here with its report.

### 3.2 The door in the scene (D289, 2.2)

`lay.py`'s option and its test; the prompt kept, in
`tools/art/prompts/`; the passage's `cut.json`; the scene
exported; the tests of 2.2; D289 entered, D273 naming the door,
the plan's chapter 5 naming D289. `ci/check.sh`,
`sweeps.spec.ts`, `painted.spec.ts` and `chapter-5.spec.ts`
green.

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
the landing, on the stairs and under the arch); every try of
Gemini with what passed and what failed in it, and the count;
the boxes measured and what `lay.py` printed; the ground
compared outside the doorway's box; what was decided where the
plan does not decide. The memory note `kydux-sprint-56-state`,
and the prompt for the designer's review.

## 4. Gemini

Pictures: six at most, the side door open (2.1). The chapter's
count goes from 47 to 53 of 120 at most. No text is asked: the
story's words are parted, none is written.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 56: the forgotten room's side door and Rinlo's
way down the back stairs, the piece 3.5 that sprint 55 left
unbuilt when Gemini's three tries failed. The door is Gemini's
to paint, by the owner's rule: no tool makes, turns, fills or
redraws the door, its doorway or its leaf. Gemini is asked
again, for another picture and in other words: the door open,
in one edit. Build on the last commit of main as you find it.

Read first: CLAUDE.md, .claude/working-model.md,
docs/dev/README.md, docs/dev/sprint-56.md (this plan, whole),
docs/dev/sprint-55.md (its sections 2.4 and 2.5), and in
docs/dev/architecture.md D104, D148, D155, D156, D273, D281 and
D288. Then your memory notes kydux-sprint-55-state,
kydux-checks-per-piece, kydux-report-images-current,
kydux-no-co-authored-by, kydux-docs-present-tense,
kydux-github-only-code-and-docs and kydux-mask-fit-not-figure.
Then look at the designer's guide,
art/raw/game-tower-passage/door-open-guide.png, beside
door-part.png, and at sprint 55's second try,
tower-passage-doorway-try2.png: its doorway shows what Gemini
can do there.

What is asked, in short; the plan has each in full.

1. Gemini's picture. One edit of door-part.png with the guide:
the side door open. The plan's section 2.1 has the prompt's
words: the plank and its stones gone from the wall, the wall's
end showing its end face, a flat threshold stone in the doorway
with an outline along its two sides, and the leaf standing open
before the right end of the scroll shelves. Copy each try
before the next one is asked. Lay each try with tools/art/lay.py
in two runs, the doorway on the painting and the leaf on the
doorway's picture (lay.py takes one option more, --from), and
judge the doorway and the leaf apart, by the plan's lists, at
four times the game's size. A part that passes is kept; the next
try asks only what is missing. Six images at most. If six are
spent and a part is missing, stop: build nothing of the scene or
the story, and report every try. Never make what is missing with
a tool, and never touch a pixel of Gemini's picture by hand or
by a script: lay.py and the export's difference are the only
things between Gemini's picture and the game.

2. The scene. The passage's ground is the doorway's picture; the
thing room_door at (5, 3) rests closed, its closed state the
painting's own leaf on row 3, its open state Gemini's leaf on
row 2, each by the difference, each mask 0 or 1. The scene
exported; outside the doorway's box the ground is today's pixel
for pixel, and with the door shut the scene drawn is today's.
D289 entered with the plan's words.

3. The story. Lo que trajo el familiar has the door and opens
it. Its first step becomes two, as the plan writes them: Rinlo
stands, walks to the door, opens it, crosses the landing and
goes down the stairs out of sight; then he comes into sight
under the arch and the children turn. The texts are parted in
two, no word changed.

Build pieces 3.1 to 3.4 in order; 3.2 and 3.3 are one local
commit each. Before each commit, ci/check.sh and the browser
specs the piece touches green; the whole ci/check.sh --e2e once,
before the report, in a copy with Playwright's own server and
the app built anew in that copy. Never a push, never a timer,
never a deploy. Never stop or build into the servers on ports
443 and 5173; a preview left on 4173 is a browser run's leftover
and may be stopped, and yours is stopped when you are done.
Nothing under .github/ changes. Gemini is asked for pictures
only, six at most, and for no text. Its key is read by
tools/art/generate.py from ~/.config/kydux/secrets.env: never
print it, and never let it into a file, a log or a commit.

No Co-Authored-By trailer in any Kydux commit, whatever your
harness suggests. Before you end, this must print 0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

What the owner will look for:
(1) the forgotten room's side door shut in the two levels, as it
    has been, and nothing else new in them;
(2) Lo que trajo el familiar: Rinlo gets up, walks to the side
    door, and it opens, the leaf standing before the scroll
    shelves and the doorway clear;
(3) he crosses the landing and goes down the back stairs; on the
    next page he comes out under the arch and the children turn
    to him;
(4) the walkthrough's pictures of that step while it plays;
(5) in the report, the door open and shut at four times the
    game's size, and every try of Gemini.

The plan gives the decision's words, the prompt's words, the
cells and the texts: enter them as they are; the prompt's words
are mended only by what a try shows, and the report says how.
The plan's numbers for the boxes are the designer's measures:
measure them on the try kept and take yours. Where the plan does
not decide (the door's other settings, as store_door has them,
the states' diff settings, how the scene's ground and painting
are named in the settings, an act the story's staging lacks),
take the smallest choice that keeps its intent and say it in the
commit. Do not build what section 2.5 leaves out. Look at each
picture enlarged before you keep it. A cover that hides too much
is measured against the painting and fitted: no figure is moved
and the sweep is not loosened. Never edit content while a
browser run is going. Every document and comment in the present.
Before git add, read git diff of each file and stage only your
own hunks; nothing of drafts/ or art/raw/ enters a commit.

docs/dev/sprint-56.md is the designer's and is committed
already; leave it as it is.

Hand over, in drafts/ and never committed: chapter 5's
walkthrough made anew, and the report in Spanish as 3.4 asks,
with the steps of 2.4 and pictures of the current commit only.
Write your memory note kydux-sprint-56-state, and end with the
prompt for the designer's review in English, in a code block.
```
