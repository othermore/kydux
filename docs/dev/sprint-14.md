# Sprint 14 — Chapter 1 closed, the pipeline ready for the next scene

The owner's three acceptance tests of chapter 1 on its painting
(2026-10-24, sprint 13 and its three rounds of fixes) and Fable's reviews
shape this sprint. It closes chapter 1 before chapter 2 begins: the third
round committed; the scene pipeline made to serve any scene, not the field
alone, since the next painting cannot be cut with tools that name the
field in their code; the field painted with a margin, the owner's idea, so
that zooming out never shows the frame's colour; the wizard's missing
frames; the story screen's replay; the debts the reviews listed; the texts
touched by hand briefed again; and the documents. Chapters 2 and 3 enter
the game in sprint 15.

The pieces, in this order: 14.1 to 14.7. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, every word for the player through `t()` or a content
file, nothing forbidden and nothing secret, documents and comments in the
present (CLAUDE.md), Gemini writes every text the child reads from a
brief. At most ten Gemini images in the sprint. Section 7 is the owner's
acceptance test.

## 1. Decisions taken here

- **D82 — A scene's settings live beside its art, and the tools take the
  scene's id.** Everything the cut and the export need of a scene that is
  the scene's own, not the method's, is one file in the repository,
  `art/scenes/<scene>/cut.json`: the raw pictures' names (the painting
  without its grid, its grid, the ground-only edit, the edit without each
  thing that opens or is picked up), the things with their boxes, rows,
  states, `solid`, `hull`, `reach` and `rune`, the rows of the walls' tops
  (`cuts`), the row above which the painting is ground (`castle`), the
  patches of the ground, and the colour thresholds the field's painting
  set (the lawn's and the path's hues, the outline's darkness, the leaves'
  green). The field's values are the defaults in the code, so that a
  setting left out means the field's. `export_scene.py`, `sweep.py` and
  the content tests take a scene's id, and run over every scene that has
  a `cut.json`. Rules out a second scene cut by editing the tools.
- **D83 — A scene is painted with a margin.** The painting reaches two
  cells beyond the playable area on every side, filled with what no one
  enters (trees, rocks, a fence, the castle's wall), so that the camera
  zoomed out, or a wide window, shows painting and never the frame's
  colour. The world's map and every level's and story's coordinates stay
  those of the playable area: the margin is the art's alone, said in
  `art.json` (`margin`, cells on each side), drawn by the page outside
  the map, and the camera's bounds reach over it. The margin's cells are
  marked standing for the cut, so that what rises in it is cut by its row
  like the rest. Rules out a map grown to hold the margin, which would
  move every coordinate of chapter 1.

## 2. What the third test and the reviews leave

From the owner's third test and Fable's review of the fixes (2026-10-24):

- The third round is in the working tree and not committed: the reach
  goal stopped at, the cut's rules and the sweep, the crown cells walked
  on, the mark behind the castle's door, the debug view, the silhouette.
- The scene pipeline names the field in its code: `export_scene.py`
  (THINGS, MAP, SCENE_OUT, GROUND_PATCHES, the `cut.json` it writes with
  no `cuts` nor `castle`), `sweep.differs` (`the-field`,
  `art/raw/game/field-src`), `image_first.py`'s colour thresholds.
- The owner's idea: a margin beyond the playable area, and the zoom-out
  loosened.
- `world/tests/wizard_words.py` holds the friends' names (Nuri, Teku)
  rather than reading i18n.
- `painted.ts` and `placeholders.ts` import `friendOf` from
  `i18n/personal`, while `words.ts` says the engine touches i18n only
  there.
- `level.known_words` and `concepts` are keys main.ts adds to a level's
  JSON by hand; `LevelJson` does not name them.
- `guide.ts`'s `edgeToward` and placement have no unit test; only e2e.
- Play time's idleness (D70) has no automated test: the interval lives
  in main.ts.
- `debug.ts` works a mask's row out of its image's depth; the row is at
  hand when the image is made.
- The glow over a placeholder sealed door (a scene without art) is
  unverified since chapters 2 and 3 got no paintings yet.
- `scene.ts` is 1200 lines (the painted path, the story mode, the
  placeholders, the camera) and `level.ts` 680 (cards, guide, map
  overlay, zoom): split when next touched, said twice already.
- The way-in's intro and hints were corrected by hand in the second
  round (the seal first, then the word); the rule is that Gemini writes
  them.
- The story screen has no replay of a step's action and no way to the
  end (sprint 13, section 4).
- The wizard has no frames for picking up and for winning (plan, 4.5).
- The castle door's half-open state: dropped, Gemini swung it outward
  twice; the owner has not asked for another try.

## 3. The pieces

### 14.1 The third round committed, and the pipeline per scene (D82)

- First, with nothing else changed, the working tree committed as one
  commit, `Third round of chapter 1's test: the goal stopped at, the cut
  made right, the sweep, the debug view, the silhouette`, its body the
  report's substance. `ci/check.sh --e2e` is green on it already.
- `art/scenes/the-field/cut.json` written from what the tools hold now:
  `sources` (`painting`, `grid`, `ground`, and under `without` the edit
  for each thing), `things` (what `export_scene.THINGS` holds), `cuts`,
  `castle`, `patches` (GROUND_PATCHES), `thresholds` (`groundlike`'s
  hue, saturation and value bounds for grass and path, `OUTLINE`,
  `green`'s hue and saturation bounds, `darkened`'s two numbers), and
  `source` (the text of SOURCE.md). `art/scenes/` is tracked; the
  pictures stay in `art/raw/`, which is not, and the paths in `sources`
  point into it.
- `image_first.py` keeps its DEFAULTS as the field's values and reads
  the thresholds from the settings it is given; `groundlike`, `green`,
  the outline test and `darkened` take their numbers as arguments, the
  constants their defaults.
- `export_scene.py <scene> [scene|check|all]` and `export_scene.py
  figures`: the scene's id names `art/scenes/<id>/cut.json`,
  `content/scenes/<id>/map.txt` and `content/art/scenes/<id>/`; the
  figures are no scene's. The field's `scene()` becomes the general one:
  `composite` reads the things from the settings, the working folder is
  `art/raw/game/<id>-src` and `<id>-cut`, SOURCE.md comes from the
  settings. `checks()` and the close looks take the things and the
  boxes from the settings too (the close looks are the things' boxes
  grown by two cells).
- `sweep.py <scene>`: `differs` finds the ground-only edit through the
  scene's settings, and the sheets are `sweep-<id>.png` and
  `all-<id>.png`.
- `tests/tools/test_art.py` and `tests/project/test_art_content.py`
  run over every `art/scenes/*/cut.json` whose scene is exported; a
  scene with settings and no export is skipped with its reason. A unit
  test gives `image_first.groundlike` other thresholds and sees them
  used.
- Done when the field exported again by the new tools is pixel for
  pixel what the repository holds (`git diff --stat content/art/` shows
  nothing but what the sprint changes on purpose), and `tools/art/`
  holds no name of the field outside `DEFAULTS` and the tests.

### 14.2 The field painted with a margin (D83)

- A prompt file, `tools/art/prompts/image-first-field-margin.md`: an
  edit of the painting without its grid, extended by two cells on every
  side in the same style and light, the new ground filled with what no
  one enters: trees and bushes on the sides, rocks and a fence at the
  bottom, the castle's wall going on at the top. The playable area must
  stay pixel for pixel as it is (Gemini is asked to change nothing
  inside; `tools/art/image_first.difference` against the original, over
  the old area, says whether it did). Up to three images: the first that
  keeps the inside is the one.
- The ground-only edit and the edits without each thing are not
  repainted: the margin has no thing that opens. The margin's pixels
  come from the margin painting; the inside's from the pictures as now.
- The cut: `image_first.build` is given the map padded by the margin
  with standing cells (`t` on the sides and the bottom, `#` at the top),
  so that what rises in the margin is cut by its row and nothing of it
  is walked on; the rows of the margin above the map have negative
  numbers, those below, numbers past the map's last row.
- `art.json`: `margin: [left, top, right, bottom]` in cells, the ground's
  image the whole painting, each row's `top` and each thing's `left` and
  `top` in the page's pixels from the painting's corner as now, and a
  new `origin: [x, y]`, the playable area's corner in those pixels. The
  page (`painted.ts`) draws everything shifted by `-origin`, so that the
  map's cell (0, 0) stays at the scene's (0, 0) and every coordinate of
  the levels and the stories holds.
- The camera (`scene.ts`): its bounds reach from `-left` cells to
  `columns + right`, from `-top` to `rows + bottom`; `canZoomBy` keeps
  refusing a window larger than the bounds, which now hold the margin;
  the camera starts and follows as before. The pencil grid stays on the
  playable area. The debug view numbers the margin's cells with
  negative numbers and marks them standing.
- The sweep and the content tests know the margin: the wizard never
  stands in it, and the checks on `before` and `walked` read the map as
  now.
- Done when the field at zoom 0.5 shows painting to every edge in a
  1280×800 window, `tests/project/test_art_content` passes, and the
  owner's acceptance test of sprint 13 (its section 7, points 6 and 7)
  still holds by the e2e of `painted.spec.ts`.

### 14.3 The wizard's frames for picking up and for winning (plan, 4.5)

- Two Gemini edits of each base sheet (`art/figures/wizard-base-boy.webp`
  and `-girl.webp`), as 13.9 made the casting frames: a row of three
  frames picking up (bending down, the hand at the ground, up again
  with the thing held), facing down; and a row of three celebrating
  (the arms up, a small jump, down again), facing down. Four images at
  most, with the prompts in `tools/art/prompts/figure-pickup-*.md` and
  `figure-win-*.md`; put on the grid by `figures.py` as the casting rows
  are, and steadied.
- `figures.json` says the rows: `rows: {walk: 0, cast: 4, pickup: 8,
  win: 9}` (the names, not numbers scattered in the code); `painted.ts`
  reads them, and its CAST_ROW constant goes.
- `scene.ts` plays the pick-up row on a `pick_up` event over one tick,
  the thing fading as the hand reaches it, and the win row once when a
  run ends won, before the win card (a short delay, as the door's
  opening has), still for a reader who asks for less motion; the
  looks' sheets get the rows through `figures.py` as they get the
  casting rows. A figure without the rows (the friends) is unchanged.
- The art content test holds every `wizard-*` sheet to the rows
  `figures.json` names; `painted.spec.ts` shows both with screenshots
  for the owner (`shots/painted/12-pick-up.png`, `13-won.png`).

### 14.4 The story screen: a step replayed, and the way to the end

- On the story screen, a small *Again* button beside *Back* replays the
  step's action (the playback sought to the step's first tick and
  played, as `play()` does); hidden on a step with no action. A *Skip*
  link at the band's right, `story.skip`, goes to the last step with
  every figure where the story leaves it, for a child who has read it;
  it marks the story read as the last step does.
- Both through i18n; keyboard: *R* replays; `story.spec.ts` covers them.

### 14.5 The debts

One commit per item, in this order:

- `scene.ts` split: `camera.ts` (the window, the zoom, the drag, the
  story's dead zone: `setUpCamera`, `follow`, `fitWindow`, `zoomBy`,
  `canZoomBy`), `speech.ts` (bubbles and thoughts: `say`, `think`,
  `bubbleAnchor`, `roomAbove`, the clearing), and `scene.ts` keeping
  the playback and the events; the handle and the data-* attributes
  unchanged, every e2e green without a change. `level.ts` split the
  same way: `zoom.ts` (the zoom box and *Find my wizard*) and
  `cards.ts` already holds the cards; the map overlay stays.
- `words.ts`'s claim made true: the figure a friend is drawn from is
  decided in one place, `looks.ts` (`friendFigure(gender)`), which
  `painted.ts` and `placeholders.ts` call; `friendOf` stays in
  `i18n/personal` for the names and words.
- `LevelJson` gets a typed `course` block, `{ concepts, known_words }`
  and whatever else main.ts gives a level from the course, filled in one
  place and read by the notebook and the world's call; the ad-hoc keys
  go.
- `world/tests/wizard_words.py` reads the friends' names from
  `i18n/<lang>.json` (`characters.nuri`, `characters.teku`).
- `guide.ts`: `edgeToward` and the placement of a card beside a
  target, unit-tested in Vitest on fixed rects (above, below, left,
  right, and a target at the window's edge).
- Play time's idleness: the counting factored out of main.ts into
  `progress/playtime.ts` (`startPlayTime({ now, visible, touched })`
  with its interval injectable), tested with fake timers: counts while
  touched within IDLE_S, stops after, resumes on a touch.
- `debug.ts` is given each painted image's row with the image (a
  `row` on the list `scene.ts` passes), not worked out of the depth.
- The glow over a placeholder sealed door looked at with a screenshot
  (a level of chapter 2 or 3 with a sealed door), and moved to the
  door's top edge if it sits on the tile's centre.

### 14.6 The texts

- The way-in's intro, hints and starting code briefed to Gemini again
  under the rule the world has (the seal first, then the word; a word
  said to a sealed door is not heard), with what the child knows by
  then; both languages; reviewed as sprint 12, section 2 asks.
- The sentence the page says when the goal was walked over
  (`outcome.walked_over`) read by Gemini in the same brief, as a small
  text: kept if good, its words taken if better.
- The course book made again (`tools/course_book.py`) for the owner's
  reading of chapter 1.

### 14.7 Documents

- `architecture.md`: D82 and D83 in the log; the module map (camera.ts,
  speech.ts, zoom.ts, playtime.ts); D21, D74, D76, D79, D81 read again
  against the code and made present where this sprint moves them.
- `plan.md`: 4.3's margin, 4.4 done, 4.5's new rows, section 5 said as
  it stands after sprint 14; sprint 15 named as chapters 2 and 3 on
  their paintings.
- `art/README.md`: the settings file (D82), the margin (D83), the
  figures' rows; `docs/dev/dev-environment.md`: the tools' new
  arguments.
- This document kept as written.

## 4. What this sprint leaves out

Chapters 2 and 3 on their paintings (sprint 15: the library and the
passages painted with their margins, mapped, cut with their own
`cut.json`, the darkness and the sight cones drawn above the cut-outs,
the dormitory mate written into their stories and levels, their texts
briefed again); the castle door's half-open state (the owner has not
asked for another try); the UI skin, the sound theme and the characters'
voices (4.6, 4.7: a sprint of their own once the three chapters are
painted); the silhouette for a friend or a teacher (only where a level
needs it, the owner said); chapters 4 and 5; the saved games on the
server.

## 5. What the owner brings

- Nothing before the sprint. Gemini's key and `agy` are in place.
- During it: a look at the margin painting's candidates if Gemini
  changes the inside (the implementer shows the difference picture).
- After it: the acceptance test of section 7, the course book read
  again for chapter 1, and the push: from Saturday 2026-10-24 the hours
  rule holds again, and `ci/push.sh` is the owner's call.

## 6. How the implementer works

As in sprint 13 (sprint-13.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`14.2: the field painted with a margin`), never a push, no timers; the
development server started again after every build, since a build
leaves it serving `content/course.json` as the page
(dev-environment.md, section 4); what this document leaves open decided
the simplest way and said in the commit; what turns out wrong done the
working way and logged in `architecture.md`; every text the child reads
from Gemini through a brief; every scene exported looked at in
`art/raw/game-check/all-<scene>.png` before the commit; a short report
in Spanish at the end, with what differs, what was corrected by hand,
the Gemini images spent, where the screenshots are, and section 7.

## 7. Acceptance test (for when the owner tries it)

1. In any level of chapter 1, zoom out to the smallest: painting reaches
   every edge of the window, trees and rocks round the field, the
   castle's wall at the top; the wizard, the marks and the path are
   where they were.
2. In practice 5, the wizard bends to pick up the wand and the wand
   goes; on winning any level, the wizard raises its arms before the
   win card.
3. In story 2, *Again* plays Teku's walk up the path once more; *Skip*
   goes to the last step with Teku beside the wizard.
4. In practice 7, the intro and the hints say the seal must be broken
   first and that the door hears no word while it holds; said before
   the spell, *ambrel* does nothing, and the page says the word was not
   heard.
5. In practice 1, walking past the mark does not win, and the page says
   the program must end on it.
6. Behind a tree, the wizard's yellow outline beats; the wizard walks
   through the cells under a bush's crown and never through a trunk.
7. With `?debug`, the margin's cells carry negative numbers and are
   crossed out.
8. The course book reads right for chapter 1.
