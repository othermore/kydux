# Sprint 16 — Chapter 2 made right: the cut indoors, the friends' colours, the edges

The owner's review of chapter 2 on its pictures (2026-10-26, after sprint
15 and Fable's review of it) shapes this sprint. Chapter 2 is built and
plays; what is left is what the pictures showed: the indoor scenes have no
cut-outs at all, so a figure walks over a table or an arch instead of
behind it; the friends wear the wizard's colours; the library's sides run
out of painting; the wizard asleep lies on top of the bed instead of in it;
and a few things the design left open. The owner's acceptance test of the
chapter with `?debug` follows this sprint, so every piece ends with a
picture the owner can judge.

The pieces, in this order: 16.1 to 16.7. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only with `ci/push.sh`); every word for the player
through `t()` or a content file; nothing forbidden and nothing secret;
documents and comments in the present (CLAUDE.md); Gemini writes every
text the child reads from a brief. At most ten Gemini images in the
sprint. Section 7 is the owner's acceptance test, and section 8 says what
the implementer hands over: a list of everything done, each with its
picture.

## 1. Decisions taken here

- **D89 — Indoors, what a figure can stand behind is cut, and what it
  cannot is marked.** Decided 2026-10-26 by the owner, from the check
  sheets of sprint 15. Every raised thing a walked-on cell lies above or
  below is cut by its row, as outdoors: an arch a figure walks through
  (its top drawn over the figure), a bed, a table, an armchair, a counter,
  a bookcase a figure walks along. What no figure ever stands beside or
  behind (furniture against a wall, a wall itself) stays ground, and its
  cells are marked not walked on. The sweep's `all-<scene>.png`, the
  wizard on every walked-on cell, is the proof: on it no figure stands on
  a thing, and a figure behind a thing shows only what the thing leaves,
  with its outline where more than a quarter is hidden (silhouette.ts).
  Rules out an indoor scene cut only where a level needs it.
- **D90 — A friend never wears the wizard's colours, nor the other
  friend's.** Decided 2026-10-26 by the owner. Each friend, Nuri and Teku,
  has two sets of colours (robe, hat, band), far from each other and from
  every look of the creator; the game draws each friend in the set that
  differs most from the look the child chose, and, when both friends are
  on a scene, in sets that differ from each other. The sheets are made for
  both sets by `tools/art/figures.py`, as the looks are; `figureName`
  picks the set. Rules out a friend of the wizard's own colour, which the
  owner saw, and a single colour a friend: with eight looks one colour
  always collides.
- **D91 — A pupil asleep lies in the bed, under its covers.** Decided
  2026-10-26 by the owner, for the wizard and the two friends alike. The
  wizard's and the friends' sheets gain a lying row (Gemini draws it once
  for the boy's base and once for the girl's, as the pick-up rows were
  drawn: head on the pillow, eyes closed, facing up; `figures.py`
  recolours it into every look and both friends); the page draws it on
  the bed's cell, at the bed's depth plus a little, and the bed's cover,
  cut as a thing of its own from the painting (the quilt's lower part), is
  drawn over the figure, so that the sleeper is under the covers. The
  wizard lies down by `wizard.sleep()`; a friend lies down when a level or
  a story places them `asleep` in a bed (`actors`: `{"id": "mate",
  "asleep": "bed_1"}`), and a story's step may lay a figure down or wake
  it (`do: {"sleep": "bed_1"}`, `do: {"wake": true}`). Rules out the
  figure turned along the bed on top of it, and a sleeper only the wizard.
- **D92 — A scene is painted on at its sides when the view would run out of
  it.** Decided 2026-10-26 by the owner, as for the field (D83). The
  library, fifteen cells wide, gains three cells of castle on each side,
  painted by Gemini on a canvas made by `tools/art/margin.py` (the castle's
  walls and towers going on, grass and trees below them as the field's
  margin had), joined by it, said in `cut.json`'s `margin` and in
  `art.json`, so that the camera's bounds reach over them. If a wide view
  still shows the frame, the camera zooms in on scenes narrower than the
  view instead of out. Rules out a black band beside a story.

## 2. What the review leaves

From the owner's review of the pictures (2026-10-26):

- `the-dormitory` and `the-entrance` have no cut-outs (`things` empty in
  their `cut.json`): the check sheet shows the wizard over tables, the
  arches and beds. The library cuts only Eldra's armchair.
- Nuri's robe is the green of the look `moss`, Teku's the orange of
  `amber`; a child who chooses either sees a friend dressed as themself.
- The library shows black beside the painting on a wide window.
- The wizard asleep is the standing figure turned 90° over the bed.
- The wand bank has no one behind its counter; the story names "a parent".
- The dormitory's upper walls are painted with a little perspective, so the
  cell grid sits a few pixels off them: the owner accepts it as it is.
- The library's cells are large (a table a cell): the owner accepts them.
- The moving key's three ways (2, 4, 6 cells): accepted.

Decided by the owner and done: Korvel as the villain, the lesson
`the-right-place`, the vault shut, no level in the morning.

## 3. The pieces

### 16.1 The cut indoors: every scene's masks and cells reviewed (D89)

For each of `the-entrance`, `the-dormitory` and `the-library`, in that
order:

- Walk the painting cell by cell against its map: every cell a figure can
  stand on is walked on; every cell a thing stands on is not; a cell under
  an arch a figure passes through is walked on, and the arch is a thing.
- Give `cut.json` a thing, with its box, row and a `without` edit, for
  everything a figure can stand behind or beside: in the entrance, the
  pillars and the benches' fronts the carpet passes, the three arches at
  the top (the wizard and Ilda walk through the middle one); in the
  dormitory, the common room's door arch (walked through), the two
  dormitory arches (walked through), the eight beds with their trunks, the
  armchairs, the round table, the bookshelf; in the library, the reading
  tables and chairs, Wenna's desk, the partition's door arch, the
  bookcases a figure walks along, the top aisle's high bookcases, the wand
  bank's counter, the centre door's arch and Eldra's door's arch. A thing
  nothing ever passes behind stays ground.
- The `without` edits: one Gemini edit a scene that takes out every thing
  that is cut, on a crop of the scene (`tools/art/repaint.py` with the
  boxes as `boxes` and the things taken out in the prompt), so that the
  cut is the difference inside each box; the budget is three images for
  this piece, one a scene, and a second try where the first paints over
  what is kept.
- Indoor thresholds in each `cut.json` where the field's defaults cut
  wrong (the floorboards' tan reads as `path`): set `path` and `grass` to
  hues the floor does not have, as the library's settings do.
- Export and sweep each scene; look at `all-<scene>.png` and
  `sweep-<scene>.png` and fix until the sheet shows the wizard behind
  every thing it should be behind, its outline where more than a quarter
  is hidden, and never on a thing.
- Check: `test_art_content` for every scene; the chapter's e2e; the
  sheets kept for section 8.

### 16.2 The friends' two colours (D90)

- `tools/art/figures.py`: `FRIENDS` gives each friend two sets, `a` and
  `b` (Nuri: a plum-and-rose set and a sky-and-sand set; Teku: a
  coral-and-sand set and a teal-and-moss set, each far from every look's
  robe in hue), and writes `nuri-a.webp`, `nuri-b.webp`, `teku-a.webp`,
  `teku-b.webp`; `figures.json` lists them. A hue distance is measured
  in the script and asserted: no set within 40° of hue of any look's
  robe, and the two sets of a friend at least 90° apart.
- `app/src/engine/looks.ts`: `friendSet(friendId, look, taken?)` gives
  the set whose robe hue is farthest from the look's and from `taken`,
  the set the other friend on the scene has; `figureName` and the
  placeholders use it; `scene.ts` passes the other friend's set when both
  `friend` and `mate` are on the scene (the wand bank's story).
- The placeholders (`friendFigure`) use the same sets.
- Check: Vitest on `friendSet` for every look; e2e: `data-friend-figure`
  names a set that is not the wizard's colour, as a girl `moss` and a boy
  `amber`.

### 16.3 The pupils asleep, in their beds (D91)

- Gemini draws the lying frame for the boy's and the girl's base sheets
  (`tools/art/prompts/figure-sleep-boy.md`, `-girl.md`, as the pick-up
  prompts): one frame, lying on the back, head at the top, eyes closed;
  `figures.py` adds a `sleep` row (one frame) to every look's sheet and to
  Nuri's and Teku's (both sets, 16.2), and `figures.json`'s `rows` names
  it. Two Gemini images.
- `scene.ts`: a figure laid in a bed shows the lying frame on the bed's
  cell, with its depth just above the bed's own row, and the bed's cover,
  a thing of its own in the dormitory's `cut.json` (`bed_<n>_cover`, the
  quilt from the pillow down, cut from the painting), is drawn at the
  bed's row plus a little more, so that it covers the body and leaves the
  head on the pillow. The wizard lies down on the `sleep` event; an actor
  lies down from the start when its spec says `asleep: <bed>` (the world
  passes it through, `level.py`'s `ActorSpec`, and a bed an actor sleeps
  in is not `free`), and in a story on `do: {"sleep": <bed>}`, standing
  again on `do: {"wake": true}` (`story_on_scene` checks the bed exists
  and the figure stands beside it). With no lying row, the figure turned
  as now.
- `the-first-night` ends with the other pupils of the wizard's dormitory
  asleep in their beds (three actors `asleep`, drawn from the friend of
  the wizard's gender in the set 16.2 gives, named `pupil_1`… with no
  words); `the-morning` opens with the mate asleep and waking at its first
  step. The briefs' staging and Gemini's texts are updated where a step
  changes.
- Check: `asleep.png` in the chapter's e2e shows the head on the pillow and
  the quilt over the body, for the wizard and for the mate; `data-sleeping`
  as before; `test_stories` for `sleep` and `wake`.

### 16.4 The library painted on at its sides (D92)

- `art/scenes/the-library/cut.json` gains `margin` with cells `[3, 0, 3, 0]`
  (three on each side, none above or below: above is sky already, below
  the corridor), its canvas, painting and grid; `tools/art/margin.py
  the-library canvas`, a Gemini painting of the sides from a prompt in
  `tools/art/prompts/image-first-library-margin.md` (the castle's walls
  and towers going on, grass and trees beneath them, nothing on a
  diagonal, every cell painted), `margin.py the-library join`; export. The
  budget is two images.
- `camera.ts`: on a scene narrower than `VIEW_TILES` even with its margin,
  the zoom's floor rises so that the view never reaches past the
  painting; `canZoomBy` already refuses a zoom that would, and `fit` takes
  the floor.
- Check: the story `at-the-library` on a 1440 × 900 window shows no frame
  colour; the e2e asserts the scene's `data-zoom` floor.

### 16.5 The wand bank's keeper

- The owner names the parent at the wand bank, or the implementer takes
  *Baro* (a word of neither language, the design's proposal) and says so
  in the commit. `docs/dev/story.md`: a row in the characters table (a
  parent of a pupil, who keeps the wand bank in the mornings; kindly,
  few words). Gemini draws the figure (`tools/art/prompts/demo-baro.md`,
  as Ilda's: a grown man, an apron over his robe), one image; `figures.py`
  lists it via `REFERENCE` as Ilda is.
- `content/stories/the-wand-bank/story.json`: the keeper stands behind the
  counter from the start (`baro`, kind `friend`); a brief adds one step in
  which he lends the wands (Gemini, both languages); `i18n` `characters.baro`.
- Check: the story plays; `test_story`; the i18n check.

### 16.6 The scene's cells shown right in `?debug`

- The dormitory's grid sits off its upper walls by the painting's
  perspective: the owner keeps it. The debug view draws its cell numbers
  on the cell's floor, so that a tester reads them on the walkable
  ground, and the legend says a cell's kind by its map letter. No other
  change.

### 16.7 Documents, the report, and the pictures

- `docs/dev/architecture.md`: D89 to D92; `art/README.md`: *What is cut
  indoors* rewritten to D89, the friends' sets, the lying row; course.md
  if a stop changes; `content/art/figures/SOURCE.md` for the new prompts.
- The report in Spanish and the pictures (section 8).

## 4. What this sprint leaves out

- Chapter 3 rewoven round the hook; its scenes.
- The dormitory's walls straightened in the painting.

## 5. What the owner brings

- Answers given on 2026-10-26: the three ways' distances, the cell size and
  the dormitory's grid accepted; castle painted on at the library's sides,
  with grass and trees; the wizard in the bed under the covers; friends in
  colours unlike the wizard's and each other's; the check sheets for every
  scene reviewed in full, and given back with the wizard on every cell.
- The wand bank keeper's name, if not *Baro*.

## 6. How the implementer works

As in sprint 15 (sprint-15.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`16.2: the friends' two colours`), never a push, no timers; what this
document leaves open decided the simplest way and said in the commit;
every scene exported looked at in `art/raw/game-check/all-<scene>.png`
before the commit, and the owner's rule of D88 kept: a chosen painting is
mended in boxes, never painted again. At the end, the report of section 8.

## 7. Acceptance test (for when the owner tries it)

On `https://hija.local:5173/?debug`, as a girl with the look `moss` and as
a boy with `amber`:

1. Nuri and Teku wear colours unlike the wizard's; at the wand bank, unlike
   each other's.
2. In the dormitory, the wizard passes under the door's arch and the two
   dormitory arches, behind them; stands beside a bed and never on one;
   asleep, lies in the bed with the quilt over the body and the head on the
   pillow; the other pupils sleep in theirs at the first night's end, and
   the mate wakes in the morning.
3. In the entrance hall's story, Ilda and the wizard pass under the middle
   arch.
4. In the library, the wizard walks along the bookcases and behind the
   tables and the desk, its outline showing where a thing hides more than
   a quarter of it; the hidden key's outline beats behind the armchair.
5. At the library, with the window wide, castle and grounds show beside
   the painting and never black; a story's camera stays on the painting.
6. The wand bank's keeper stands behind the counter and lends the wands.
7. In `?debug`, every scene's cells read on the floor; the check sheets
   given back show the wizard on every walked-on cell and behind every
   thing it should be behind.

## 8. What the implementer hands over

A report in Spanish with, in order:

1. **Everything done, one line each, each with a picture** showing how it
   looks in the game (a screenshot from the development server, 1440 × 900,
   Spanish, a girl wizard with the look `moss`): the friends' colours (the
   wand bank with Nuri and Teku and the wizard), the wizard asleep, the
   library's sides, the wand bank's keeper, the debug view's numbers, and
   for the cut every scene once with a figure behind a thing.
2. **The check sheets of every scene** (`art/raw/game-check/all-the-entrance.png`,
   `all-the-dormitory.png`, `all-the-library.png`, and the field's), the
   wizard on every walked-on cell, so that the owner marks the cells to
   change; and for each scene one screenshot from the game with the wizard
   where a thing hides it, so that the owner sees the outline.
3. What differs from this plan and why, what was corrected by hand, the
   Gemini images spent, and what is left open.
4. The prompt for Fable's review, as sprint 15's.

## 9. The prompt for Opus

```
Read /home/other/Projects/kydux/CLAUDE.md, then docs/dev/sprint-16.md
(this plan), docs/dev/sprint-15.md sections 1 and 6, art/README.md ("What
surrounds a scene", "What a painting must keep to", "The rules for the
cut-outs") and docs/dev/course.md ("How a level earns its idea"), and the
memory note kydux-sprint-15-state. Build sprint 16: pieces 16.1 to 16.7 in
order, one local commit per piece, ci/check.sh --e2e green before each,
never a push, never a timer (nothing is pushed before Friday 2026-10-30).
A chosen painting is mended in boxes with tools/art/repaint.py and never
painted again (D88); at most ten Gemini images. Gemini writes every text
the child reads, from briefs in tools/write/briefs/. Decide what the plan
leaves open the simplest way and say it in the commit. At the end, hand
over what section 8 asks: a list of everything done with a picture of
each, the check sheets of every scene with the wizard on every walked-on
cell, a screenshot a scene of the wizard hidden with its outline, what
differs and why, the images spent, what is open, and the prompt for
Fable's review. Reply to the owner in Spanish; code, comments, commits and
documents in English, in the present tense.
```
