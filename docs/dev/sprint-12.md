# Sprint 12 — The story on the scene, the words made right, the art tried

The owner's review of the course book (2026-10-23, chapter 1; the comments
are summed up in section 2) and the plan's turn to the art (plan, phase 4)
shape this sprint. It builds the scene model the art needs and chapter 1's
scene as an open garden; a story mode in which the story is told on the
scene, by the characters, with bubbles and a voice-over, instead of as
pages; the writing rules for Gemini as the owner wants them, and every
text of chapters 1 to 3 written again under them, with the owner's
comments applied as concepts across the whole story; the art and sound
trials of phase 4, on one brief, so that the source of the game's pieces
can be decided; and two small things the UATs asked for: the level
visibly starting again on each run, and the stars as the event of the win
card.

The pieces, in this order: 12.1 to 12.7. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, every word for the player through `t()` or a content
file, nothing forbidden and nothing secret, documents and comments in the
present (CLAUDE.md), Gemini writes every text the child reads from a
brief. Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D72 — Where the game's pieces come from.** Decided by the trials of
  12.1, in the log with what each candidate gave, cost and took: Gemini's
  image models, art made as code (Canvas, SVG, Blender), free tilesets,
  the pixel-art services with a trial. The look is the plan's: a 2D
  top-down oblique view on the tile grid, never isometric.
- **D73 — A scene has terrains, fixed things and rooms.** A scene is a
  directory `content/scenes/<id>/` with `map.txt`, a grid of letters, and
  `scene.json`, which says what each letter is (`terrains`: for each
  letter its `kind` and whether it is walked on and whether sight passes
  it), the scene's fixed things (`things`: doors, stones, fences with a
  kind and a tile, by id), and its rooms (`rooms`: a rectangle each, by
  id). A level on the scene says only the state of a fixed thing it
  cares about (`{"id": "gate", "open": true}`), and may add things of its
  own; `dark` names the rooms dark at the start, and `kirra` lights the
  room the wizard is in. The world reads the letters through the scene's
  table; the page draws each terrain with its own placeholder, and later
  its tiles through the autotiler. Chapter 1's scene is an open garden:
  grass the wizard walks on anywhere, a path, fences and hedges only
  where a puzzle needs a wall. Rules out one letter per terrain fixed in
  the code, and things declared again in every level.
- **D74 — The story is told on the scene.** A story item is a script
  played on its scene in story mode: the scene drawn wide, no editor and
  no goals; a sequence of steps, each a line said by a character in a
  bubble over them, or by a voice-over in a band under the scene, with an
  action before it (a character walks, turns, appears); *Next* advances,
  *Go on* ends. `story.json` holds the staging (the scene, where the
  wizard and the actors stand, each step's speaker and action) and
  `text.<lang>.json` the words, one per step. Markdown pages stay for
  lessons only. The game's opening tells the letter in the past, at the
  gate, before the creator. Rules out story told as pages of a book, which
  the owner found flat beside the scenes.
- **D75 — Every run starts the level again, and says so.** *Run* plays a
  short reset of the scene, everything put back where it stands, with
  the words *Starting the level again…*, before the run plays; so the
  child sees that a run never continues the one before, and that a level
  played in ways is dealt again each time.

## 2. What the owner's review of chapter 1 asks (and so every chapter)

The comments on `drafts/course-book.es.md` are concepts to apply across
the whole story, not edits to copy. The principles, now in
`tools/write/rules.md` where they are general:

- **Natural prose.** Gemini writes as a storyteller speaks to a child:
  sentences with rhythm, not clipped one-idea sentences (that rule was
  for the project's own documents, never for the child's texts).
- **Say things as they are.** The computer (the game) runs the program
  and does what it is told; never "the castle does". An object is named
  by the name the code knows it by ("your wizard, which we call
  `wizard`"; "a thing is an object too, like the characters"). Each
  method has its own arguments, which mean its own things, or none
  ("the move's argument says how far"). A string holds any characters
  (capitals, digits, signs) exactly as written. A spell is cast with the
  wand, and when cast it does something; without the wand the wizard
  cannot cast.
- **Never teach twice.** Nothing re-explains an idea already taught
  ("my note, which programmers call a comment" in a level after the
  lesson on comments; "a program is a list of instructions" opening
  lesson 2). A Try it page is dropped when the next level shows the idea
  anyway (the notes lesson). Each brief says what the child knows by then.
- **"Now you know" says what and what for**: "what an instruction is and
  the instruction that moves your wizard"; "what an argument is, and that
  a move's argument says how far"; "how to make your wizard say things".
- **No place-talk where the idea is general**: "in this game", not "in
  Arvelia", when explaining programs; the gate is not mentioned when
  `move_right` is explained.
- **The outro moves the story on**: "Great! You've learned to move your
  wizard. Now let's see how to get through this gate."
- **A word to type is in italics**, with its sentence punctuated
  (*ambrel*, in small letters).

The specific notes on chapter 1 (c1–c29), each to be applied in the
brief of 12.4 and checked in the draft:

| Where | What |
| --- | --- |
| The letter | Told in the past, from the gate: weeks ago a letter came…; a picture of the school; then *who are you?* Becomes the opening story in story mode. |
| At the gate | Played on the scene: Nuri walks in, the two talk in bubbles; a voice-over for the narration. |
| Lesson 1 | "A computer does exactly what it is told; in this game, the computer does everything for you and you give it the instructions" (not "the castle does the same"); "in this game" for "in Arvelia"; the gate not mentioned beside `move_right`. |
| The gate's outro and learned | "Great! You have learned to move your wizard. Now let's see how we get through this gate."; "now you know what a program and an instruction are, and the instruction that moves your wizard". |
| Lesson 2 | Does not repeat "a program is a list of instructions"; "your wizard is an object too, the one we call `wizard`". |
| Lesson 3 | A comment is "something you write in your program to remember later or to explain what it does"; "in this game, comments tell you what to do or help you"; no Try it page. |
| Fix 1 | The intro does not say "which programmers call a comment". |
| Lesson 4 | "Writing the same line six times is slow, and you may write it five or seven times, or one of them wrong; programmers are lazy and like to do things with the fewest instructions"; "the move action can be told how far: that number is what programmers call an argument; every method has its own arguments, which mean their own things, or none". |
| Practice 3's learned | "Now you know what an argument is, and that the move actions have one that says how far." |
| Lesson 5 | "A string may have capitals and small letters, digits, signs, any character"; "in Arvelia, what you say can be heard, and sometimes that does something special, like opening a door with its password". |
| The password's intro | *ambrel*, in italics, "ambrel, in small letters". Its learned: "and how to make your wizard say things". |
| Lesson 6 | "Things are objects, just as the characters are, your wizard among them"; "the thing must be on your tile or right beside you"; "when several are near, you must say exactly which one you want". Learned: "and how to pick them up". |
| Lesson 7 | "Spells are cast with a wand, and when cast they do something"; "what a spell does depends on where you are and what you have near"; "without the wand, your wizard cannot cast spells". |

The same kind of change is applied to chapters 2 and 3 before the owner
reads them: the briefs carry the principles, and the reviewer reads each
draft for them.

## 3. The pieces

### 12.1 The art and sound trials (plan 4.0, 4.2)

- `tools/art/generate.py`: a prompt file in (`tools/art/prompts/<name>.md`,
  with the model and the size in its front matter), an image out into
  `art/raw/<candidate>/` (ignored by git; `.gitignore`), the key from
  `secrets.env`, the prompt and the model recorded beside the image.
  `tools/art/cut.py`: key out the background (the chroma key with a
  tolerance, since Gemini gives JPEG), snap to the grid (find the grid
  lines and resample each cell), slice into tiles or frames, reduce to
  the palette, write a PNG sheet and a Phaser atlas JSON. Both with tests
  on small made images.
- The one brief, written once in `tools/art/prompts/brief.md` and turned
  into each candidate's prompt: (1) the wizard's walking sheet, four
  directions, idle and two walking frames, on the chroma key; (2) a stone
  wall's pieces for the blob set: straight horizontal and vertical, the
  four ends, the four corners, the four T junctions, the cross, with the
  wall's front face and top; (3) a grass tile and a path tile that repeat
  without seams, and the path's straights, corners and ends; (4) a wooden
  door in a wall, closed and open. The view is the plan's oblique one;
  the native size is 24 px (drawn at ×2 on the 48 px grid) or 48 px,
  never 32 (×1.5 blurs pixels).
- The candidates, each tried on the brief and kept in `art/raw/`:
  1. Gemini, `gemini-3.1-flash-image` and `gemini-3-pro-image`, through
     `generate.py` (the key the project has).
  2. Art as code: the pieces drawn by a program (`tools/art/draw.py`, Canvas
     or SVG rendered to pixels, the wall pieces from one description of a
     wall) and, if `blender` is on the machine (the owner installs it,
     since that needs sudo; else this route is noted and skipped), modular
     wall pieces rendered from one oblique camera by `tools/art/render.py`.
  3. A free tileset in the licence a GPL game can ship (CC0, CC BY,
     CC BY-SA, GPL): Kenney's packs first, then OpenGameArt's and the
     Liberated Pixel Cup's; fetched into `art/raw/free/` with the origin,
     author and licence written beside.
  4. Retro Diffusion and PixelLab, through their APIs when `secrets.env`
     holds `RETRO_DIFFUSION_API_KEY` and `PIXELLAB_API_KEY`; when it holds
     only the accounts' user and password, the implementer writes the
     prompts into `tools/art/prompts/` and asks the owner in the report to
     generate in the web and drop the images into `art/raw/<service>/`.
     Never log in with the password from code.
- Sound: `tools/sound/generate.py` with `lyria-3-clip-preview` (a short
  clip) and `lyria-3.5` for one chapter theme, kept in `art/raw/sound/`;
  the effects (step, bump, cast, door, pick up, win, fail) made by a small
  sfxr-like synthesizer in the page (`app/src/engine/sfx.ts`, no file,
  deterministic from a few numbers), tried on the gate's level with a
  mute switch in the settings.
- The result: `art/raw/contact-sheet-<candidate>.png` per candidate, each
  the four pieces placed on a 48 px grid beside each other, and the
  decision D72 in the log with the table (joins, consistency between
  pieces, true pixels, transparency, cost, time, licence). When the
  implementer cannot decide, the report shows the sheets and leaves the
  choice to the owner's UAT; the next sprint draws with the winner.

### 12.2 The scene model, and chapter 1's garden (plan 4.1)

- `scene.json` beside `map.txt` (D73): `terrains`, `things`, `rooms`.
  `kydux_world.level` reads the letters through `terrains`
  (`walk`, `sight`); `#`, `.` and `=` keep their meanings when a scene
  gives no table, so the other scenes still read. `on_scene` merges a
  level's thing by id with the scene's declaration; a level's thing that
  names no `kind` must exist in the scene. `dark` as a list of room ids;
  `kirra` lights the room the wizard is in (the whole scene when there
  are no rooms). Tests for each.
- The page: `layout.ts` gets each tile's terrain kind; `placeholders.ts`
  draws a placeholder per kind (grass, path, fence, hedge, water, floor,
  wall, shelf); the darkness covers the dark rooms' tiles.
- Chapter 1's scene as the open garden below, with the levels' tiles as
  they are (every solution wins on it, every given program of a fix or
  improve still fails, checked); `the-dark-note`'s wrong answer
  `down_first` wins in the open and is replaced by another wrong move.
  Letters: `g` grass (walked on), `p` path (walked on), `f` fence (not
  walked, sight passes), `h` hedge (neither), `#` wall, `.` stone floor,
  `=` shelf.

```
############################
#gggggggggggg#####.#########
#gggggggggggg#####.#########
#gggggggggggg#####........##
#gggggggggggg############.##
#gggfffgggggg############.##
#ggggppppppppp.............#
#fffgpffghhhp###############
#fppppffppppp###############
#fpffgffpgggg###############
#fpppppppgggg###############
#gggggggggggg###############
#gggggggggggg###############
############################
```

- The scene's fixed things in `scene.json`: the gate at (13, 6) with its
  password, the flat stone at (17, 6), the sealed door at (23, 6), the
  inner gate at (25, 4), the seals at (21, 3) and (18, 2); the levels keep
  only their state. The library and the passages keep their maps, with a
  `scene.json` that names their fixed doors and the dark room as a room.

### 12.3 The story on the scene (D74)

- `content/stories/<id>/story.json`: `id`, `scene`, `wizard` (a tile),
  `actors` (as a level's), `camera` (a tile the camera starts on), and
  `steps`, each `{"who": "voice" | "wizard" | "<actor id>", "do": null |
  {"walk": [x, y]} | {"face": "left"} | {"appear": [x, y]} | {"vanish": true}}`;
  `text.<lang>.json`: `{"title": "…", "steps": ["…", …]}` with as many
  steps; `speaker` stays for the map and the characters' names. The
  i18n check holds the step counts and the languages together; the
  content tests hold the staging to the scene (every tile floor, every
  walk a straight line of free tiles).
- `app/src/ui/story.ts`: the story screen: the scene wide (the
  `scene-frame` alone, the camera on `camera`), under it the voice band
  (`#story-voice`), over an actor its bubble (actors get `say` bubbles in
  `scene.ts`, as the wizard has), *Next* / *Go on*, Enter and Space to
  advance, the step's action played as scripted events through the
  playback (a walk as one move event per tile). Read to the end marks the
  story read, as now. The map's story stop and `#story/<id>` stay.
- The opening and the chapters' story items become scripts: the letter
  told in the past at the gate (the wizard at the road's end, the camera
  on the gate; a voice-over of four or five steps), then *Go on* to the
  creator; at the gate, Nuri appears at the path's end, walks to the
  wizard's side and they talk; up to the castle at the way out; chapter
  2's at the library's door and at the wand bank; chapter 3's at the
  dormitory's door, at the top of the stairs and at the catch. The
  staging is the implementer's, on the scenes as they are, with Nuri's
  walks straight along the paths. The words are 12.4's.
- The lesson screen loses the story kind; the `story` frame style goes;
  the loop's screenshots show the story mode.

### 12.4 The words, written again (D55, section 2)

- `tools/write/rules.md` as the owner wants it (done in the review).
  Each brief now opens with *What the child knows by now*, the ideas and
  names taught before the texts asked for, so that nothing is taught
  twice.
- Briefs, one per chapter and kind, from the continuity of sprint-11.md
  and section 2 here: `chapter-1-stories.md` (the opening and the two
  story scripts, as steps with their speaker), `chapter-1-lessons.md`
  (the seven lessons, the notes lesson without a Try it),
  `chapter-1-levels.md`; the same three for chapters 2 and 3. Every text
  of the three chapters comes back, reviewed for the principles of
  section 2 and for prose that reads as a child's story, not as a list of
  short sentences; a draft that still clips is asked for again with the
  brief corrected, not patched.
- The course book (`tools/course_book.py`) reads the story scripts as
  steps with their speaker, so that the owner reviews the new texts the
  same way.

### 12.5 The run that starts again, and the stars (D75)

- *Run* plays the reset: the scene fades, everything is put back, the
  words *Starting the level again…* (`level.restarting`, which exists)
  show over the scene for a moment, then the run plays. *Restart* plays
  the same. An e2e test sees the state.
- The win card: the stars big, drawn in one after another with a short
  bounce, the reasons under them small; the speaker's words and the
  learned sentence below in a smaller block.

### 12.6 Small debts of the review of sprint 11

- `course.json` carries each item's title per language, written by
  `pack-world.mjs`, and the start screen and the map read titles from it
  instead of fetching each item.
- The camera: a drag threshold of a few pixels before the camera lets go
  of the wizard; the wheel over the scene does not scroll the page; a
  small *Find my wizard* button beside the zoom buttons when the camera
  has let go.
- The i18n check holds the guide's steps to `GUIDE_STEPS`.

### 12.7 Documents

- `architecture.md`: D72–D75; *Parts* with `tools/art/`, `tools/sound/`,
  `story.ts`, `sfx.ts`; the versions table with anything new.
- `plan.md`: 4.0–4.2 as done; section 2.5 with `scene.json` and the story
  scripts.
- `dev-environment.md`: the art tools and `art/raw/`; how a story script is
  written and tried; the sound's mute.
- `README.md` and `README.es.md`: the story told on the scenes.
- `course.md` and `story.md`: the story items as scripts; the garden.
- `art/README.md` begun: the view, the grid, the chroma key, the blob set.

## 4. What this sprint leaves out

Drawing the three chapters' scenes, the characters and the things with
the winning source (sprints 13 and 14); the UI skin; the autotiler's
pieces drawn; chapters 4 and 5; the saved games on the server (phase 7).

## 5. What the owner brings

- For the trials: the API keys of Retro Diffusion and PixelLab in
  `secrets.env` as `RETRO_DIFFUSION_API_KEY` and `PIXELLAB_API_KEY` if the
  accounts give them (the web user and password are never used by code);
  Blender installed (`sudo apt install blender`) if the Blender route is
  to be tried; nothing else.
- After this sprint: the course book read again, chapters 1 to 3, and the
  contact sheets looked at, to settle the art's source if the trials do
  not.

## 6. How the implementer works

As in the earlier sprints (sprint-11.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`12.1: the art and sound trials`), never a push; what this document
leaves open decided the simplest way and said in the commit; what turns
out wrong done the working way and logged in `architecture.md`; a short
report to the owner in Spanish at the end, with what differs, what
Gemini's drafts needed corrected, what each art candidate gave, where the
contact sheets and the screenshots are, and section 7.

## 7. Acceptance test (for when the owner tries it)

1. A new game opens on the gate's scene, wide, with the letter told in the
   past by a voice-over, step by step; *Go on* leads to the creator; then
   Nuri walks in and the two talk in bubbles.
2. Chapter 1's levels play in the open garden: the wizard can walk on the
   grass, the fences and hedges stop it only where a puzzle needs it, the
   stone and Nuri stand off the path.
3. *Run* shows the level starting again before every run; the win card
   shows the stars big, one after another.
4. The course book reads as a child's story: no clipped sentences, nothing
   taught twice, the computer and the objects named as they are, each
   "now you know" saying what and what for; the owner's notes on chapter 1
   applied, and the same care in chapters 2 and 3.
5. `art/raw/` holds a contact sheet per candidate on the same brief, and
   the log says which source the game takes and why, or the report asks
   the owner to choose.
6. A sound plays on a step, a bump, a cast and a win, and the settings
   mute it.
7. The map and the start screen show the titles without a pause; the
   camera lets go of the wizard only after a real drag, and *Find my
   wizard* brings it back.
