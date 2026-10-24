# Sprint 11 — One scene per chapter

The owner's second UAT (2026-10-22, of sprint 10's story and chapter 1)
asks for continuity: a chapter's levels are parts of one scene, where a
level ends the next begins, and the friend who teaches stands in the scene;
a level never comes half done; the lessons look like a character teaching
and the story pages like story; the screen explains itself once, with
arrows, instead of a lesson page; games are saved and loaded by name; a
level played again keeps its stars. This sprint builds the scenes and the
screen's guide, rebuilds chapter 1 in its scene, rewrites chapters 2 and 3
in the same shape, and adds the saved games. The review of sprint 10
already fixed what was small: a lesson's example no longer enters the
editor (D63), starting from the beginning forgets the wizard (D64), the
first-try star counts this visit's runs and a win never shows fewer stars
than the level had, a word said fades after the run, and three sentences
of the lessons.

The pieces, in this order: 11.1 to 11.9. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, every word for the player through `t()` or a content
file, nothing forbidden and nothing secret, documents and comments in the
present (CLAUDE.md), and Gemini writes every text the child reads from a
brief (CLAUDE.md, *Who writes what the child reads*). Section 2 is the
story's continuity, decided here; the briefs are written from it, not
around it. Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D65 — A chapter's levels are parts of one scene.** A scene is a map of
  its own under `content/scenes/<id>/map.txt`: rows of `#` (wall or
  hedge), `.` (floor) and `=` (shelf), with no markers. A level names its
  scene in `level.json` (`"scene": "the-gate"`) and places what is its
  own on it by coordinates: `start`, `end` (the tile the `reach` goal
  wants, when it has one), and `at` for every thing and actor; a level
  with a `scene` has no `map`. `kydux_world.level` reads the scene file
  beside the level (`content/scenes/`, found from the level's directory)
  and builds the level's map from it, so that the world, the goals, the
  solutions and the wrong answers work as they do; `pack-world.mjs` writes
  the built map into the packed `level.json`, so the page changes nothing
  in how it loads a level, and copies `content/scenes/` for the tests.
  Where one level ends the next starts, on the same tile, and what the
  earlier level opened or took stays as the story says it (a gate opened
  stays open as a door thing with no password; a wand picked up is
  `carrying`). A chapter may have more than one scene, when a story page
  moves the wizard elsewhere; chapter 3 has two. The scene is drawn whole;
  the camera shows a window of it, follows the wizard, and starts centred
  on the level's start, so the tiles keep their size (D69). Rules out one
  map per level, which showed the same gate nine times from nine angles.
- **D66 — A friend stands in the scene.** A new actor kind, `friend`,
  stands where the level puts it, faces the wizard's start, never moves,
  never catches, and is walked around: a move onto its tile is a bump
  (`blocked`, `by: friend`, said in the child's words: *Nuri is there*).
  Nuri is a friend in every level of chapters 1 and 3, Wenna in every
  level of chapter 2; Eldra stays a ghost. The friend is drawn with the
  character's figure (placeholder until the art, a figure like the
  wizard's in the speaker's colour; Nuri's figure follows the wizard's
  gender, D37). The level's intro and outro are the friend's words, as
  D45 has them. Rules out a friend who talks on a card but is nowhere.
- **D67 — A lesson shows who teaches it; a story page looks like story.**
  `lesson.json` names its `speaker` (an id of `story.md`'s), and the
  lesson screen draws the speaker's figure large beside the text, with
  the name under it, in a frame that reads as a character speaking; the
  pages of a lesson are the speaker's words. A story page keeps no
  figure and is framed as a page of a book (a parchment frame, a
  different background), so that the child sees when the story speaks
  and when a character teaches. The level screen is the scene. Rules out
  a lesson page that looks like a story page, which the owner could not
  tell apart.
- **D68 — The screen explains itself once, with arrows.** The first level
  of the course (`the-gate`) opens its guide the first time it is shown
  (`progress.guided`): a series of steps, each dimming the screen but one
  part, with a card beside it and an arrow to it: the scene (your wizard,
  the gate, Nuri), the goals, the editor (where the program is written),
  *Run*, the notebook (opened by the guide, to show what the wizard
  knows), *Hint* and *?*, and the method (try, watch, try again). *Next*
  and *Skip*; the `?` card gains *Show me the screen*, which plays the
  guide again in any level. Its words come from Gemini through a brief,
  into `content/guide/text.<lang>.json`, loaded like a level's text.
  Rules out the lesson page about the notebook, removed in the review.
- **D69 — The camera: a window on the scene, following the wizard,
  zoomed and dragged by the player.** The scene is a Phaser tilemap of
  the whole scene; the camera is bounded by it, starts centred on the
  wizard's start, and follows the wizard with a short lerp while a run
  plays. The scene's canvas keeps its size and the tiles their 48 px at
  zoom 1; a scene smaller than the window is centred, as today. The
  player zooms with *+* and *−* buttons on the scene and the mouse wheel
  (from 0.5 to 2, in steps), and drags the scene with the pointer (or
  two fingers) to look around; a run, *Restart* or *Start* brings the
  camera back onto the wizard. The zoom is kept for the visit, not
  saved. The `data-wizard` attribute and the e2e tests read the world's
  coordinates, which the camera does not change; an e2e test zooms,
  drags, runs and sees the camera return to the wizard.
- **D70 — Games are saved, several, in the browser.** The progress store
  holds a list of games (`kydux.games`: id, created, last played, play
  time) and one progress document per game (`kydux.game.<id>`); the
  current game's id is `kydux.current`. Every change saves the current
  game, as today (there is no *Save* button: the game is always saved,
  and the start screen says so in a line). The start screen, when there
  is a game, shows *Continue* (the current game, named by its wizard)
  and *Load a game*: the list, each with the wizard's figure and name,
  where it is (the chapter and the item), its play time and its dates,
  with *Play* and *Delete* (confirmed); and *New game*, which opens the
  letter and the creator for a new game (D61, D64). The first visit, with
  no game, opens the letter as today. Play time counts the seconds a
  level, a lesson or a story page is on screen and the tab visible.
  Export and import stay as the way to carry a game away; an import adds
  a game. *Start from the beginning* goes: a new game replaces it, and
  *Delete* in the list. Sprint 12 keeps the same list on the server the
  game runs from (plan, phase 5), with the browser's as the fallback.
- **D71 — The map opens over the level, and a lesson from it.** From a
  level, *Map* opens the map as an overlay over the level (the run kept,
  the editor kept), with the current stop marked *You are here*; its
  stops after the next one are unnamed (*?* with the kind and number, so
  that *Fix 1* is seen coming but not named); closing it returns to the
  level; choosing another stop asks when a run is going. The level's
  heading gains *Lesson*, which opens the last lesson before the level
  with *Back to the level* in place of *Try it*. Rules out the map as a
  screen the player leaves the level for.

## 2. The story's continuity, chapter by chapter

What every brief of this sprint is written from. The scenes are given as
they are to be carved: `#` wall, `.` floor, `=` shelf; the coordinates
are `x, y` from the top-left corner. Every solution below was run against
the world on these maps and wins; every program given in a fix or improve
level was run and does not. The friend's tile is given per level; it is
never on the solution's way.

### Chapter 1 — Arrival: the scene `the-gate` (28 × 14)

```
               111111111122222222
     0123456789012345678901234567
  0  ############################
  1  ##################.#########
  2  ##################.#########
  3  ##################........##
  4  #########################.##
  5  #########################.##
  6  #####......................#
  7  #####.######.###############
  8  ##....##.....###############
  9  ##.#####.###################
 10  ##.......###################
 11  ############################
 12  ############################
 13  ############################
```

Outside the wall (x ≤ 12) is the forecourt before the great gate: hedges
and paths, the road's end at (5, 6), the steps up the hill's last slope
from (2, 10) to the landing at (7, 6). The gate is the tile (13, 6), a door
in the wall. Inside (x ≥ 14) is the gatehouse: the passage with the flat
stone at (17, 6), the sealed door at (23, 6), the inner gate at (25, 4),
two more seals and the way out to the castle road at (18, 1), at the top.
The art of phase 4 draws the forecourt as a garden at dusk, the gatehouse
as stone.

| Item | Kind | Start → end | What is there | The beat, for the brief |
| --- | --- | --- | --- | --- |
| `story:at-the-gate` | story | | | As written, plus on its last page Nuri's turn to teaching: before the gate can be opened, there are a few things to learn; Nuri will show them one at a time. |
| `the-gate` | Practice 1 | (11, 6) → (12, 6) | Nuri at (10, 6). | One instruction: a step to the gate's circle. The gate stays shut. Starting code: empty. |
| `the-corridor` | Practice 2 | (12, 6) → (10, 8) | The gate (13, 6) is a door with the password, shut; Nuri at (11, 6). | The gate will not open yet; Nuri wants to look round the forecourt: down along the hedge, then round the corner. Solution: down, down, left, left. Starting code: a comment saying where to go. |
| `the-dark-note` | Fix 1 | (10, 8) → (8, 10) | Nuri at (11, 8). | Nuri wrote a program on a note on the way up, and one move is wrong. Given: left, left, down, right; the last move is the wrong one. |
| `the-long-corridor` | Practice 3 | (8, 10) → (2, 10) | Nuri at (8, 9). | The long path along the bottom hedge to the foot of the steps, six tiles left, one instruction with a number. Bonus: fewer than 2 lines. |
| `the-stairs` | Improve 1 | (2, 10) → (7, 6) | Nuri at (3, 10). | Nuri's program climbs the steps to the landing by the gate but bumps twice. Given: up 3, right 3, up 3, right 2; the ups are 2. Goals: reach, no bumps; bonus fewer than 5 lines. |
| `the-password` | Practice 4 | (7, 6) → (14, 6) | The gate (13, 6), password `ambrel`; Nuri at (6, 6). | Back at the gate: an older pupil told Nuri the word. Right 5, say it beside the gate, right 2 through it. The comment gives the word. |
| `the-wand` | Practice 5 | (14, 6) → (20, 6) | The wand at (17, 6); Nuri at (21, 6), by the stone, ahead. | Inside the gatehouse, Nuri has set the spare wand on the flat stone: lent, to be given back one day. Right 3, pick up, right 3. From here on the wizard carries it. |
| `the-sealed-door` | Practice 6 | (20, 6) → (25, 6) | A door sealed with `zelim` at (23, 6); the wand carried; Nuri at (19, 6). | The passages are sealed at night; a spell needs a wand, and the wizard has one. Right 2, cast beside the door, right 3. |
| `the-way-in` | Practice 7 | (25, 6) → (18, 1) | The inner gate at (25, 4), password `ambrel`; seals at (21, 3) and (18, 2); the wand carried; Nuri at (24, 6). | Everything together: the inner gate listens to the same word; two seals; the castle road at the top. Up 1, say, up 2, left 3, cast, left 4, cast, up 2. Bonus: fewer than 9 lines. No `learned`. |
| `story:up-to-the-castle` | story | | | As written, with the wand on loan and chapter 2's errand named: a school wand from the wand bank, and Nuri's spare returned. |

The pedestal's slug is `the-wand` (*The wand* / *La varita*). The gate's
and the inner gate's `open` goals and the doors' seals are as in the
table; `the-corridor` carries the gate as a shut door so that walking
right bumps into it, as the story has it.

### Chapter 2 — The library: the scene `the-library` (28 × 16)

```
               111111111122222222
     0123456789012345678901234567
  0  ############################
  1  ############################
  2  ############################
  3  ############...............#
  4  ##########.#.###########.###
  5  ##########.#.###########.###
  6  ########.......#########.###
  7  ########.===##.#########.###
  8  ########.===##.##=====##.###
  9  ######.#.===##.##=====##.###
 10  #####..........##=====##.###
 11  #####.###................###
 12  #####.######################
 13  ##....######################
 14  ############################
 15  ############################
```

The library's door is at the bottom left, (1, 13), where the wizard comes
in. The reading room is the path from it to (8, 10), with Wenna's desk at
(6, 9), where Wenna stands in every level. The aisles are the loop of
rows 6 and 10 and columns 8 and 14, with the reading room's short way, a
locked door at (8, 8). Eldra's corner is the nook (10, 4–6) and her shelf
at (9–11, 7–9). The locked door's room is column 12 and the top corridor,
row 3, which leads right to the archive, column 24, going down; the high
shelf is the aisle of row 11 under the shelves at (17–21, 8–10), and
Eldra's book waits on her shelf at the aisle's left end. The wand bank's
counter is beyond the aisle's left end, (5, 11–12): the closing story page
reaches it.

| Item | Kind | Start → end | What is there | The beat |
| --- | --- | --- | --- | --- |
| `story:in-the-castle` | story | | | Inside at last: Ilda greets the new pupils and sends the wizard to the wand bank, through the library; Wenna keeps the library and its rules; Nuri goes to class. |
| `the-reading-room` | Improve 1 | (2, 13) → (8, 10) | | Wenna's program for new pupils reaches her desk, right 3, up 3, right 3, with the number written three times; give it a name. Goals: reach; numbers under 2. Given: the three moves with `3`. |
| `which-way` | Practice 1 | (8, 10) → (8, 6) | A locked door at (8, 8), no key. | The short way up is a locked door: ask it (`print(door.locked)`), then the long way: right 6, up 4, left 6. Bonus: the code asks the door. |
| `the-lost-book` | Practice 2 | (8, 6) | The book at (10, 4); Eldra at (13, 6), facing left. | Eldra's whisper: a book lost in the nook. `find_nearest("book")`, right 2, up 2, pick up, down 2, right 2, give. Bonus: found with `find_nearest`. |
| `the-locked-door` | Practice 3 | (12, 6) → (18, 3) | The key at (12, 4); the locked door at (16, 3). | Up 2 onto the key, pick up, up 1, right 3, open, right 3. Bonus: fewer than 7 lines. |
| `the-wrong-order` | Fix 1 | (18, 3) → (24, 3) | The key at (20, 3); the locked door at (22, 3). | A program of Wenna's that opens the door before it has the key. Given: right 2, right 1, `door.open()`, `pick_up()`, right 3. Fixed: pick up before opening (either line moved). |
| `the-archive` | Practice 4 | (24, 3) → (24, 11) | A door at (24, 5), opened by hand; the key at (24, 7); the vault door at (24, 9), locked. | Down the archive: down 1, open, down 3, pick up, down 1, open, down 3. Bonus: the key found with `find_nearest`. |
| `the-high-shelf` | Practice 5 | (24, 11) → (16, 11) | The book at (19, 8), on the shelf; the wand carried. | Left 5, in line with it, cast `fendra`, pick up, left 3. |
| `eldras-book` | Practice 6 | (16, 11) | The key at (14, 11); the locked door at (12, 11); the book at (10, 8), on Eldra's shelf; Eldra at (9, 11), facing right; the wand carried. | The chapter together: left 2, pick up, left 1, open, left 3, `fendra`, pick up, give. Bonus: the book named with `find_nearest` before the spell moves it. No `learned`. |
| `story:the-wand-bank` | story | | | Eldra's thanks; the wand bank's counter: a school wand borrowed for the year, Nuri's spare given back; what the chapter taught. |

The lessons, by Wenna: `a-name-for-a-value`, `what-things-know`,
`finding-things`, `keys-and-doors`, `fendra`, with the ideas of
`course.md`, rewritten by Gemini in Wenna's voice (D59's pairs: a name
for a value, a variable; what a thing knows, an attribute).

### Chapter 3 — The passages: the scenes `the-passages` (24 × 12) and `the-night-passages` (24 × 11)

```
               11111111112222
     012345678901234567890123
  0  ########################
  1  #####.#############..###
  2  #........#########..####
  3  #######........##..#####
  4  ######.....#####..######
  5  ######.#.#.####..#######
  6  ######.....###..########
  7  ######.....##..#########
  8  ######.###.#..##########
  9  ######.......###########
 10  ########################
 11  ########################
```

```
               11111111112222
     012345678901234567890123
  0  ########################
  1  #######......###########
  2  ##...........###########
  3  ##.####......###########
  4  ##.#######.#############
  5  #....................###
  6  ##.#################.###
  7  ##.#######...........###
  8  ####################.###
  9  ########################
 10  ########################
```

The passages: the watchtower's corridor, row 2, with Dask's nook at
(5, 1); Dask's round on row 3; the two-door rooms of rows 4–6 and 7–9; the
long stairs climbing from (12, 9) to (20, 1). The night passages, reached
at the top of the stairs: Dask's long corridor, row 5 (x 1–8); the moving
stair's passage, row 2; the dark room, (7–12, 1–3), its door at (10, 4);
the night walk's corridor, row 5 (x 9–20), the stair at (18, 5), Dask's
lower round on row 7, and the way out at (20, 8).

| Item | Kind | Start → end | What is there | The beat |
| --- | --- | --- | --- | --- |
| `story:after-dark` | story | | | Night; Nuri at the door: the passages after dark, where Dask patrols; a dare, and a method. |
| `the-watchtower` | Practice 1 | (2, 2) → (8, 2) | Dask at (5, 1), facing up, standing; Nuri at (1, 2). | Dask stares at the wall: print what he faces and whether he sees you; walk past, right 6. Bonus: the code asks `can_see`. |
| `the-watch` | Practice 2 | (8, 2) → (8, 4), two ways | Dask on row 3: *away*, at (11, 3) facing right, patrol to (12, 3); *watching*, at (13, 3) facing left, patrol to (12, 3). Nuri at (7, 2). | Cross Dask's corridor: `if dask.facing == "left": wait()`, then down 2. |
| `left-or-right` | Practice 3 | (8, 4) → (8, 7), two ways | Doors at (6, 5) and (10, 5); *left_locked* and *right_locked*. Nuri at (7, 4). | `if left_door.locked:` right 2, open, down 2, left 2; `else:` the mirror; then down 1. |
| `the-wrong-door` | Fix 1 | (8, 7) → (12, 9), two ways | Doors at (6, 8) and (10, 8); *left_locked* and *right_locked*. Nuri at (7, 7). | Nuri's program has its `if` and `else` bodies the wrong way round. Given: `if left_door.locked:` left 2, open, down 2, right 6; `else:` right 2, open, down 2, right 2. Fixed: the bodies swapped. |
| `the-long-stairs` | Improve 1 | (12, 9) → (20, 1) | Nuri at (11, 9). | Sixteen lines, up and right eight times; a `for`. Goal: fewer than 4 lines. |
| `story:the-top-of-the-stairs` | story | | | At the top, the night passages begin; Dask is somewhere below; the scene changes. |
| `past-the-teacher` | Practice 4 | (2, 6) → (2, 4) | Dask at (7, 5), facing left, patrol to (3, 5); Nuri at (2, 7). | `while dask.facing == "left": wait()`, then up 2. Tick limit 60. |
| `the-moving-stairs` | Practice 5 | (2, 4) → (7, 2) | A stair at (4, 2), period 2; the wand carried; `osto`; Nuri at (1, 5), in the corridor Dask has left. | Up 2, right 1, `while not stair.in_place: wait()`, right 4. Bonus: the code asks `in_place`. |
| `the-dark-room` | Practice 6 | (7, 2) → (10, 5) | Dark; the key at (11, 3); the locked door at (10, 4); the wand carried; `kirra`. Nuri at (6, 2). | `kirra`; `find_nearest("key")`; right 4, down 1, pick up, left 1, open, down 2. Bonus: found with `find_nearest`. |
| `the-night-walk` | Practice 7 | (10, 5) → (20, 8) | Dark; the key at (14, 5); the locked door at (16, 5); the stair at (18, 5), period 2; Dask at (12, 7), facing right, patrol to (17, 7); the wand carried; `kirra`, `osto`; Nuri at (9, 5). | Everything together; Dask catches the wizard on the win card and lets them go. No `learned`. |
| `story:caught` | story | | | Dask, impressed, lets them go; what the chapter taught; the wizard belongs to the castle now. |

The maps above hold Nuri's tiles: (1, 2) in the passages, (2, 7) and
(9, 5) in the night passages, dead ends off the start tiles that change
no solution; (9, 5) joins Dask's corridor to the night walk's, which no
level's goal can use. The lessons, by Nuri:
`true-or-false`, `if`, `else`, `repeat`, `while`, `kirra-and-osto`, with
the ideas of `course.md`, rewritten by Gemini in Nuri's voice.

## 3. The pieces

### 11.1 Scenes in the world and on the page

- `content/scenes/<id>/map.txt`; `level.json` with `scene`, `start`,
  `end` and `at` for everything (D65); `kydux_world.level` builds the map
  from the scene; `Level.from_directory` finds `content/scenes/` from the
  level's path; `pack-world.mjs` inlines the built map. A level with both
  `map` and `scene`, or a `start` or `end` or `at` off the floor, is a
  `LevelError`, tested.
- The `friend` kind (D66): stands, faces the start, is walked around;
  `blocked` with `by: friend` and a word for it in both languages; the
  world's tests cover it; the notebook does not list a friend (it has no
  API for the child).
- The camera (D69) in `scene.ts`: the window, the following, the zoom
  buttons and wheel, the drag, the return to the wizard; and the friend
  drawn with its figure (placeholders.ts gains a figure per speaker
  colour; Nuri's by gender).
- The content tests hold a chapter's levels to the continuity: in a
  chapter whose levels have scenes, each level's `start` is the previous
  level's `end` (or, with no `end`, the tile its solution ends on), and
  the friend's tile is never on the solution's path.

### 11.2 Chapter 1 in its scene

- The scene `the-gate` and the nine levels placed as section 2 says; the
  pedestal becomes `the-wand`; the gate is a door in `the-corridor`;
  `the-sealed-door` carries the wand; `the-way-in` has the inner gate and
  two seals as given. Solutions and wrong answers as section 2; the
  `wrong/` of each level reworked for the new maps (at least three each).
- Starting code (D63): practices get comments only, in the child's words;
  `the-gate` stays empty; fix and improve get their programs.
- A brief, `chapter-1-in-its-scene.md`, re-asks Gemini for the nine levels'
  texts and the two story pages (the gate story's last page with the turn
  to teaching; the closing page with the wand bank's errand), from the
  beats of section 2, with the owner's wording for the lessons kept as the
  review left them.

### 11.3 The screen's guide

- D68: the overlay (`app/src/ui/guide.ts`), its steps, the dimming, the
  arrow, *Next* and *Skip*, `progress.guided`; *Show me the screen* on the
  `?` card; the guide's words from Gemini (`briefs/guide.md`) into
  `content/guide/text.<lang>.json`, checked by the i18n check for the same
  keys in each language.
- The loop's screenshots gain the guide's first step.

### 11.4 Who teaches: the lesson and story frames

- D67: `speaker` in every `lesson.json` (chapter 1 `nuri`, chapter 2
  `wenna`, chapter 3 `nuri`); the lesson screen with the speaker's figure
  and name, in the speaking frame; the story frame for story pages;
  `tests/project` or the content tests refuse a lesson without a speaker.

### 11.5 Saved games

- D70: the games list in the store, the current game, play time, the
  start screen's *Continue*, *Load a game* (the list, *Play*, *Delete*),
  *New game*; export and import by game; the existing single document
  migrated into the list as one game on first load (`PROGRESS_VERSION`
  bumped). Unit tests for the store; e2e for the list, a second game, and
  a delete.

### 11.6 Chapter 2 in its scene

- The scene `the-library`, the eight levels as section 2 (`the-wrong-order`
  new; `the-reading-room` an improve), the story pages `in-the-castle` and
  `the-wand-bank`, Wenna as the friend at her desk, `chapter.json` in the
  new order; the lessons with `speaker: wenna`.
- Briefs: `chapter-2-story.md` (the two pages), `chapter-2-lessons.md`
  (five lessons, in Wenna's voice, one idea each, D59's pairs),
  `chapter-2-levels.md` (eight levels). Each reviewed and corrected before
  it enters `content/`; the corrections in the report.

### 11.7 Chapter 3 in its scenes

- The scenes `the-passages` and `the-night-passages`, the ten levels as
  section 2 (`the-wrong-door` new; `the-long-stairs` an improve), the
  story pages `after-dark`, `the-top-of-the-stairs` and `caught`, Nuri as
  the friend; `chapter.json`; the lessons with `speaker: nuri`.
- Briefs: `chapter-3-story.md`, `chapter-3-lessons.md`,
  `chapter-3-levels.md`, as for chapter 2.

### 11.8 The map over the level, and the lesson at hand

- D71: the map as an overlay from a level, *You are here*, the unnamed
  stops ahead, the question when a run is going; *Lesson* on the level's
  heading, *Back to the level* on the lesson.

### 11.9 Documents

- `architecture.md`: D65–D71 in the log; *Parts* with `content/scenes/`,
  `content/guide/`, `guide.ts`; the progress document's shape with the
  games list.
- `plan.md`: section 2.5's layout with scenes; phase 5's chapters 4 and 5
  each with a scene; sprint 12's saved games on the server as the same
  list, served.
- `dev-environment.md`: a scene's file and how a level is placed on it;
  the saved games in the browser's storage, and how to clear them.
- `README.md` and `README.es.md`: *Playing* with the games list, the
  guide, the scene that continues from level to level.
- `course.md`: chapters 1 to 3 as built, with their scenes; chapters 4
  and 5 in outline, with a scene each.
- `story.md`: the places of the three scenes named in the table of places,
  and the wand bank.

## 4. What this sprint leaves out

The saved games on the server (sprint 12); chapters 4 and 5 (a sprint
each, with their scenes); the art and the sound (phase 4), which will draw
the scenes, the figures and the frames this sprint shapes; the lessons
read from the map.

## 5. What the owner brings

- A reading of chapters 1 to 3 in their scenes, in both languages, with a
  child where possible, before chapter 4.
- Nothing to install: the sprint needs what sprint 10 needed.

## 6. How the implementer works

As in the earlier sprints (sprint-10.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`11.1: scenes in the world and on the page`), never a push; what this
document leaves open decided the simplest way and said in the commit; what
turns out wrong done the working way and logged in `architecture.md`; a
short report to the owner in Spanish at the end, with what differs, what
Gemini's drafts needed corrected, where the screenshots are, and section 7.

## 7. Acceptance test (for when the owner tries it)

1. A new game: the letter, the creator, the gate story; the first level
   opens with the guide: the scene, the goals, the editor, *Run*, the
   notebook, *Hint*, *Next* and *Skip*; the `?` card plays it again.
2. Chapter 1's levels are all in one scene: the forecourt, the gate, the
   gatehouse; the wizard starts each level where the last one ended, and
   Nuri stands nearby. The scene follows the wizard as it walks; *+*,
   *−* and the wheel zoom it, dragging looks around, and *Run* brings it
   back to the wizard.
3. No level opens with part of its solution: a practice has comments or
   nothing, a fix the program to repair, an improve the program to make
   better; *Restart* keeps what was typed.
4. The lessons show Nuri (or Wenna) beside the words; the story pages
   look like pages of a book; the first lesson follows the gate story
   with Nuri's turn to teaching.
5. The wand is picked up once, in *The wand*, and carried from then on;
   the sealed door needs no second pick-up; the way in opens the inner
   gate with the same word.
6. A level won with three stars and played again keeps them, and the win
   card says so; the word said at the gate fades once the run is over.
7. The start screen lists the games: a second game with another wizard,
   loaded by name, with its place and play time; *Delete* asks first;
   *New game* opens the letter again.
8. From a level, *Map* opens over it and closes back to it; the stops
   ahead are unnamed; *Lesson* opens the lesson and returns.
9. Chapters 2 and 3 play in their scenes with their new story pages, their
   fix levels and their improve levels, in Wenna's and Nuri's voices.
