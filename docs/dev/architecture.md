# Kydux — architecture

## Overview

Kydux is a static web app. The page holds the shell (the screens, the editor,
the scene) and a Web Worker holds Python: Pyodide, CPython compiled to
WebAssembly, running the child's code against `kydux_world`, a Python package
of Kydux's own that models a level deterministically and records what
happens as a list of events. The page plays the events back. Nothing runs on
a server: the game is files, served by whatever is at hand, the development
server, the launcher on a child's computer, or a host online later.

Because `kydux_world` is plain Python, it runs on the development machine
under CPython too, and every level's solution and wrong answers are checked
there by pytest, without a browser.

## Parts

```
app/            the web app: Vite, TypeScript, plain DOM for the shell
  src/i18n/     every string the player sees, from i18n/<lang>.json, made for
                the wizard and the friend by personal.ts (D37, D77)
  src/runtime/  the worker that holds Pyodide, and the page's side of it
  src/engine/   the scene in Phaser, where everything stands before a run
                (layout.ts), what an actor sees (sight.ts, the same rule as the
                world's, tested on tests/fixtures/sight.json), a hole's state at
                a tick (hole.ts, the same rule as the world's), the playback, and
                the words the scene shows (words.ts, why an action failed);
                the looks a wizard may have (looks.ts) and the placeholders for a
                scene without art (placeholders.ts); the camera on the scene, its
                zoom, its drag, a story's window and the place a story step or
                a level frames (camera.ts, D69, D74, D199, D201), the
                words said in bubbles and the wizard's thoughts (speech.ts), the
                playback of a run's events (playback.ts, its long ticks for
                what the wizard's hands do), a painted scene drawn from its
                art with its figures sorted by their feet (scene.ts, painted.ts,
                D76), a painted thing drawn on the tile its level lays it on,
                in its middle (shift.ts, D85, D109), a figure drawn on its
                scene's painted strip (depth.ts, D105, D149), a speaker's bubble
                clear of the other figures (bubble.ts), the camera's zoom with
                the buttons and the wheel, and when a level's framing holds
                (zooming.ts, D106, D201), the goal's
                beating mark on the ground and the sealed doors' glow (D79,
                D160), a key drawn small (D164),
                the wizard casting, a seal breaking and a door opening (D81),
                the wizard's outline where something painted hides more than
                a quarter of it, a revealed thing's glow wherever
                something covers it, and the goal's ring, as thin as a figure's
                outline, where a cut-out is drawn over it, and the crack of
                light round a hole osto holds closed (silhouette.ts, cover.ts,
                D85, D107, D160, D167, D168),
                the wizard asleep
                (D84), the night that falls once it sleeps and the morning
                after it, and a morning story's light (light.ts, D124), a thing
                drawn from a sprite of its kind, a broom or a ring, and a hidden
                one once found (things.ts, D182, D184), a figure flying on its
                broom, lifted and bobbing, a flown step in a third of a walked
                one's time (flight.ts, D185), the tester's view of the cells,
                the low and the high ones, the rings' order and the masks
                (debug.ts, opened with ?debug), and the sound effects, made as
                the game plays (sfx.ts), with the flight's wind, which lasts
                while a figure flies (sound.ts, D185), and the chapters' music,
                played from its notes (music.ts, D192)
  src/editor/   the child's editor, CodeMirror
  src/ui/       the screens: start with the saved games (start.ts), the
                wizard's creator (wizard.ts), the map, also over a level (map.ts),
                a lesson with its teacher (lesson.ts), a story told on its scene
                (story.ts, D74), the
                settings (settings.ts), and the level screen, a view of the run controller
                (controller.ts), with its goals panel, outcome card, start and
                win cards (cards.ts), the zoom box over the scene (zoom.ts), the
                wizard's notebook with its spells and words (notebook.ts, D80),
                the naughty child's map open on the scene's plan, drawn in ink as the
                scene draws it (plan.ts, D134, D143, D151), a lesson's code run on its page (lessonrun.ts, D142),
                a level's words with their code shown as code (words.ts, D140),
                the stars (stars.ts), the screen's guide (guide.ts, D68), and
                the note on a phone or a tablet that the game is made for a
                computer (handheld.ts), the characters' and the looks' portraits
                (portraits.ts, D194), the welcome page (about.ts, #about, D193),
                Kydux's mark in the header (mark.ts), what a screen shows while
                it loads, the mark, Loading… and a tip with its clock (waiting.ts,
                D214), and under ?debug the page
                that plays any of the music's themes, each voice of the one
                playing to turn off or set by hand (themes.ts, #music, D192, D203).
                main.ts shows a screen: it shows the waiting view at once, loads
                the screen's own code, texts and pictures (a story needs no scene
                code to show its words), puts the screen in when it is ready or,
                with a tip up, when the tip has been read, and once the first
                screen shows fetches the other screens' code in idle time (D214)
  src/content/  loading a level's level.json and its text.<lang>.json, a lesson
                and its pages (lessons.ts), a story and its steps as the scene's
                events (stories.ts), the guide's words (guide.ts), and the
                course (course.ts): its chapters, what comes next, a stop's
                state, what the child knows in a level (D40)
  src/progress/ the player's progress, a document per game (store.ts), the
                saved games (games.ts, D70), play time while the child is at the
                page (playtime.ts, D70), and the calls the screens make on them
                (progress.ts)
  scripts/      before dev and build: copy Pyodide into public/, pack the world
                into world.zip, copy the content into content/ with the course in
                content/course.json (its items' titles in every language among
                it), each level and story on a scene with its world built in, and
                write the world's table as api.json
  e2e/          the browser tests (Playwright), beside the node_modules they need;
                the loop's screenshots in e2e/shots/ (D39), and a chapter played whole
                for the owner (walkthrough.spec.ts, by `npm run walkthrough`)
world/          kydux_world, the model of the levels, and its tests: level.py reads
                a level; world.py holds the wizard and the ticks; things.py the
                read-only base and the things; actors.py the teacher and the sight
                rule, the ghost, the cat, the friend and the racer (D189);
                goals.py the goals; api.py
                the names a level may teach;
                explain.py errors in the child's words; run.py runs the child's code;
                sandbox.py keeps it from Pyodide's bridge to JavaScript
content/        the levels, each with level.json, its words in text.<lang>.json,
                its solution, maybe other solutions written another way the
                course shows (solutions/), and its wrong answers (none of these
                three ever shipped);
                the scenes the levels are parts of (scenes/, each a map.txt and a
                scene.json, D65, D73); a painted scene's art and the figures'
                sheets, the wizard's in every look and the two friends' (art/,
                D76, D77); the lessons, each with lesson.json and
                <lang>.md; the stories (stories/), each with story.json, its
                staging, and text.<lang>.json, D74; the chapters, each with
                chapter.json and text.<lang>.json; the screen's guide's words
                (guide/, D68); the music's themes, each its notes (music/, D192);
                each chapter's card for the map (art/chapters/, D193)
i18n/           en.json, es.json: the app's words, the same keys in each
docs/dev/       the plan, the sprints, this log, the guide; the story (story.md)
                and the course (course.md) that the content is written from
tools/          the i18n check, the forbidden-word check, the names a wizard
                may not take (reserved_names.py), each level and story on a scene
                with its world built in (scene_maps.py, D65, D74), the course as
                one document
                to review (course_book.py) and the comments read back from the
                reviewed document (doc_comments.py), a chapter's walkthrough with a
                comments line under every picture (walkthrough.py), the writing tool (write/:
                write.py, the rules every text follows in rules.md, and the
                briefs in briefs/; Gemini drafts the child's texts into
                drafts/, which git ignores, D55, through the API or the
                Antigravity CLI), the art tools (art/: generate.py asks the
                image services, cut.py and sprites.py cut what they draw,
                map_from_image.py and image_first.py read a painting's grid and
                cut its things, scene_settings.py reads a scene's settings
                (art/scenes/<scene>/cut.json, D82), layout.py draws a scene's
                map on its grid before it is painted and over a try (D102),
                margin.py paints a scene on beyond its playable area (D83),
                repaint.py mends a chosen painting in a few boxes and nowhere
                else and opens its doorways (D88, D108), paints what a model
                left empty, moves a wall or widens a corridor, and lays stones
                or a picture in a box (void, spaced, tiled, placed: D136),
                door.py opens a door from its closed picture (D144), none of
                them on a scene of chapter 3 (D148); trace.py cuts a thing's
                mask as the difference of two of a scene's pictures (diff,
                D148) and helps to trace a door's polygons (D113: look, a crop
                enlarged with a grid and a polygon's points; outline, a first
                polygon round a leaf; footprint, the doorway's polygon from its
                fill),
                export_scene.py makes
                content/art/ and draws each door's states over the
                painting at three times their size to check (D113) and
                every state as the page draws the scene (the doors
                sheet), and
                sweep.py stands the wizard on every cell of a scene to check
                the cut, figures.py
                makes the figures' sheets from the base sheets in art/figures/,
                recoloured for each look, and trials/ the scripts of the art
                trials, contact.py and demo.py among them; D72, D76), the
                chapters' cards for the map (art/chapter_cards.py, D193), the
                music's score, written out as the themes' notes
                (sound/compose.py, D192), and a model's music asked for a trial
                (sound/generate.py)
tests/tools/    the writing and art tools' tests, with the services faked
tests/project/  the repository's own checks
ci/             check.sh, push.sh and hours.py, dev-cert.sh, the git hooks
```

### Versions

Pinned exactly, checked against their registries on 2026-10-20:

| Part | Version | Note |
|---|---|---|
| Node | 24 LTS (`.node-version`) | from NodeSource's apt repository (D9) |
| Vite | 8.3.4 | |
| TypeScript | 5.9.3 | 7.x, the compiler rewritten in Go, is adopted later on its own |
| Vitest | 5.0.5 | needs Node 22 or later |
| @types/node | 24.19.2 | |
| Playwright | 1.64.1 | |
| Pyodide | 314.0.7 | Python 3.14 |
| Phaser | 4.2.1 | the scene; loaded on its own, after the page (D15) |
| marked | 18.0.14 | the lessons' Markdown (D33); pinned to a release at least two weeks old |
| codemirror | 6.0.2 | the editor (D17), with the packages below |
| @codemirror/lang-python | 6.2.1 | |
| @codemirror/state, view, commands, language, autocomplete | 6.7.6, 6.43.15, 6.11.1, 6.13.1, 6.20.4 | imported directly, so declared and pinned; one copy of each in the lock |
| Python on the machine | 3.13 | `kydux_world` keeps to syntax that runs on 3.12 and up |
| pytest | 9.1.1 | |
| ruff | 0.17.1 | one configuration for all the Python, `ruff.toml` |
| google-genai | 2.29.0 | the writing tool's client (D55), `tools/requirements.txt` |
| Gemini model | gemini-3.1-pro-preview | the writer of the child's texts (D55), pinned in `tools/write/write.py`; Gemini 3.8 Flash through `agy` when asked |
| Gemini image model | gemini-3-pro-image | the scenes' paintings and the figures (D72, D76), named in each prompt of `tools/art/prompts/` |
| Lyria | lyria-3-clip-preview | the music's trial (D72) |
| Pillow, numpy | 13.0.0, 2.5.4 | the art tools, `tools/requirements.txt` |
| Go | 1.27 | for the launcher, phase 6 |

## The child's Python

What the child can type, and what the world records. The one list of the
names is `world/kydux_world/api.py`; a test holds every one of them to a
member of the world's classes with a docstring and an example, which the
notebook shows. A level lists in its `api` which of them it teaches
(D23). Nothing takes a tick unless it says so (D21).

```python
wizard.move_right(steps=1)   # and move_left, move_up, move_down: a tick per step;
                             # stops at a wall or a closed door
wizard.say(text)             # a tick; a door beside the wizard whose password it is opens;
                             # a number is said as its digits (D184)
wizard.cast(spell, thing=None)  # a tick: with the wand carried, a spell of the level's,
                             # where the wizard stands (D42); zelim breaks a seal beside it;
                             # fendra is given the thing to bring (D47); orvim, wherever the
                             # map is carried, opens the scene's plan (D134); drevo, with a
                             # broom carried, lifts it, and every move after it flies (D185)
wizard.wait(ticks=1)         # a tick each: stands still while the world moves on
wizard.pick_up()             # a tick: the thing on the wizard's tile, into wizard.items
wizard.find_nearest(kind)    # the nearest thing or actor of a kind ("key"...), or None;
                             # a thing of a zone only from within it (D196)
wizard.find_item(kind)       # the thing of a kind it carries, or None (D123)
wizard.find_all(kind)        # all of them, nearest first, then in reading order, as a
                             # list; hidden ones found as find_nearest finds them (D184)
wizard.has(kind)             # whether it carries one of that kind
wizard.position              # Position(x, y), which compares as a tuple
position.x, position.y       # a position's two numbers, its attributes: key.position.x (D153)
wizard.facing                # "up", "down", "left" or "right"
wizard.items                 # the things it carries, from the start those of the
                             # level's carrying (D49)
wizard.give(thing)           # a tick: a thing it carries, to the actor beside it (D48)
wizard.sleep()               # a tick: lies down in a free bed beside it; refused with
                             # no bed beside (no_bed) or a taken one (bed_taken) (D84)
wizard.distance_to(other)    # the steps to a thing or an actor along the rows and the
                             # columns; asks, so no tick (D86)
wizard.flying                # whether it flies on its broom, from drevo to the run's end (D185)
len(things)                  # how many things a list holds, a builtin the sandbox lets
                             # through (D184)

thing.kind, thing.name       # a key, a book, a wand, a potion, a door, a bed: by its id
thing.position               # where it lies; None once carried
thing.distance_to(other)     # the steps to the wizard, a thing or an actor (D86); a
                             # carried thing is where the wizard is
thing.reveal()               # a tick: its whole outline drawn where it lies, over
                             # what covers it; refused once carried (not_here) (D85)

bed.free                     # whether no one sleeps in it (D84)

broom.knotted                # whether the black thread is tied in its twigs (D183)
broom.untie()                # a tick: from the broom's own cell, or the cell under it when
                             # it hangs on a peg (D195), else refused (too_far);
                             # an error that stops the program on a broom with no knot
                             # (no_knot, D183)

door.locked, door.sealed, door.password, door.is_open
door.open()                  # a tick: from a tile beside any cell of its doorway (D24,
                             # D150), with its key when locked; else blocked, and always
                             # for a sealed door or one with a password (D43)

teacher.kind, teacher.name, teacher.position, teacher.facing
teacher.can_see(target)      # the target straight ahead, within its sight (4 tiles by
                             # default), with no wall or closed door in between; it sees
                             # over a shelf (D46)

ghost.kind, ghost.name, ghost.position, ghost.facing    # and cat.*: they stand (D48)
teacher.distance_to(other), ghost.distance_to(other), cat.distance_to(other)

hole.open                    # whether a step onto it, taken now, would find it open (D53, D167)
hole.closed                  # whether a step onto it, taken now, lands on the floor; hole.open's
                             # opposite, so `while hole.open:` is `while not hole.closed:`
```

The map's characters: `#` a wall, `.` floor, `=` a shelf (D46), `~` a low
cell, which a flight crosses and a walk does not (D186), `S` the wizard's
start, any other letter a floor tile named by it (a marker). A scene's map
names its own terrains in its scene.json, each with its `kind` and whether
it is walked on (`walk`), seen across (`sight`) and flown over (`fly`): a
low terrain, water or a hedge, is flown over and not walked on; a high one,
a tree or a wall, neither (D186).

The child's code holds `wizard` and every thing and actor of the level by
its id. Everything it holds is read-only to it (D20). Its errors are
explained in its own words (D22); the kinds are in `kydux_world/explain.py`
and their words in `i18n/<lang>.json` under `error`.

### The world's events

What a run records, tick by tick, and what the scene does with each
(`app/src/engine/scene.ts`). Every event has `tick`, `actor` (`wizard`, or
an actor's id), `kind`, `data` and `line`, the line of the child's code;
tiles are `[x, y]`.

| kind | actor | data | the scene |
|---|---|---|---|
| `move` | wizard, or an actor | `from`, `to`, `facing` | walks it one tile, facing that way, with a step's sound, a tap of filtered noise: the wizard's `step`, a child's `step_child` (the friends, Eldra), a grown-up's `step_adult` (figures.json's `adults`), every other one a little lower (D132) |
| `bump` | wizard | `at`, `facing`, `by`: `wall`, `door`, `hole`, `friend` (with `id`, D66), `high` (flying, with the cell's `kind`, D186) or `ring` (walked or flown into from its side, with `id`, D187); `kind`, the cell's terrain where the scene names it | nudges the wizard against it; the thought names a high cell's kind (*las copas de los árboles no se pasan*) and a ring's side |
| `say` | wizard | `text` | a bubble over the wizard for three ticks, under it when there is no room above |
| `wait` | wizard | `at` | nothing: the wizard stands still |
| `pick_up` | wizard | `id`, `at` | the wizard bends; a thing on the floor rises and vanishes, one a spell brought to the hands fades there (D127); `data-carried` |
| `open` | wizard, by `door.open()`; or the door, in the wizard's tick, opened by a spell or a word | `id`, `at`, `by`: `hand`, `spell` or `word` | the door's frame turns open; `data-doors` |
| `shoved` | the door, in the tick it opens | `id`, the figure; `from`, `to`; `by`, the door | the figure on the open leaf's cells walks aside along the row (D125); `data-shoved` |
| `cast` | wizard | `spell`, `at` | the wand is pointed and a point of light flies from it, to the thing the spell takes or a tile ahead, and bursts in a ring |
| `pull` | the thing, in the wizard's tick | `id`, `from`, `to` | once the spell's light reaches it, the thing flies to the wizard's hands, in its `pulled` state when it is painted one, a book glowing (D47), and stays there, held (D127) |
| `light` | `world`, in the wizard's tick | `at` | the dark is lifted (D52) |
| `hold` | the hole, in the wizard's tick | `id`, `from`, `until`: the ticks it is held closed | it stays closed for those ticks, its floor whole and a crack of light round it (D53, D167) |
| `map` | `world`, in the wizard's tick | `at` | the playback pauses, and once the wand is seen pointed the plan's window opens over the page, drawn at that tick; closed, the playback goes on (D134) |
| `give` | wizard | `id`, `to`, `at` | the wizard turns to the figure that takes the thing, which faces the wizard; then the thing floats from the middle of the wizard's hands to the middle of that figure, where it is drawn, and fades there (D48) |
| `sleep` | wizard, or in a story an actor | `id`, the bed; `at`, the cell under the bed's pillow (`pillow_side`) the figure goes to bed from, which the world walks the wizard to first, a `move` a tick; `bed`, its tile; `facing`, toward the bed (the wizard's) | the figure, facing the bed, hops in an arc from its cell into the bed and settles lying there, its head on the pillow, under the quilt, in the tick (D130); for the wizard no celebration after, but the night falling and the morning coming before the card (D124); `data-sleeping` for the wizard, `data-asleep` for all (D84, D91) |
| `wake` | in a story, the wizard or an actor | `at` | the figure gets up and stands on its tile, the floor under the bed's pillow (D91, D130) |
| `reveal` | wizard | `id`, `at` | the thing's whole outline beats over whatever covers it, until it is picked up or given; `data-revealed` (D85) |
| `blocked` | wizard | `at`; `by`: a door's id, or `wizard`; `reason`: `locked`, `far`, `open`, `nothing`, `sealed`, `password`, `no_wand`, `unknown_spell` (with `spell`), `no_map` (orvim, with `spell`), `nothing_near` (osto, with `spell`), `out_of_reach` (fendra, `by` the thing, with `spell`), `too_high` (`by` the thing up on a shelf), `not_carried`, `nobody`, `no_bed`, `bed_taken`, `not_here`, or the reason of a tile the wizard may not step on, `not_my_dormitory` (with `facing`, which the wizard turns to, D84), or `door_leaf`, `by` the door whose open leaf lies there (with `facing`, D125), or `no_walk`, a walk into a low cell (with `facing` and the cell's `kind`, D186); `too_far`, `by` a broom untied from off its cell, and `no_knot`, `by` a broom with no knot, after which the run ends in an error (D183); `no_broom`, drevo with no broom carried (D185); `tried`: whether the wizard got to try | the wizard thinks why, in a grey cloud; when `tried`, the door or the wizard shakes (D28) |
| `turn` | an actor | `facing` | the actor faces the other way |
| `vanish` | in a story, an actor, or the wizard at the story's very end | | the figure fades out of sight (D74) |
| `appear` | in a story, an actor | `at`; `from`, a cell beside it, when it steps out from behind a thing there | the figure comes into sight on its cell: walking out from `from`, behind what stands there, over the tick (D128), or fading in (D74) |
| `seen` | an actor | `by`, `at` | the scene shakes and the actor's cone turns red; the run ends `caught` |
| `found` | `world`, in the tick of `find_all` or `find_nearest` | `ids`, the hidden things found; `at`, their cells | each comes into sight from the straw and is drawn from now on; one found before the first tick is shown with it; `data-found` (D184) |
| `untie` | wizard | `id`, `at` | the wizard bends over the broom, a long tick, and its thread is gone; `data-untied` (D183) |
| `fly` | `broom`, in the wizard's tick of drevo, or a racer in its own | `id`, the figure; `at` | the figure lifts half a cell, drawn from its flying rows, and the wind starts; every move after it is flown in a third of a walked step's time (`move`'s `flying`); `data-flying`, `data-wind` (D185) |
| `land` | `broom`, after the run's last tick, or a racer at its path's end | `id`, `at` | the figure sets down on its cell and the wind fades (D185) |
| `through` | the ring, in the wizard's move | `id`, `at`, the cell flown from | the ring glows as the wizard passes; `data-through`, in order (D187) |
| `circle` | wizard, before a race's finish, or a racer | `at`; `ring`, the ring missed (the wizard's) | the figure flies a loop over its cell for the tick: the wizard's five ticks for each ring missed, the racer's flourish; `data-circling` (D189) |
| `read` | wizard, before the first action of a race | `at`, `count`, `lines` | the band over the scene says Ilda reading the two programs and the ticks to each take-off, the line read lit in the editor; `data-race-band` (D189) |

A run's status is `won`, `incomplete`, `error`, `too_many_ticks`,
`interrupted` or `caught`; its goals say for each whether it was met or
failed, at which tick, and whether it was a bonus.

## Decision log

Each entry: what was decided, why, and what it rules out. An entry a later
one overturns stays, marked as superseded.

- **D1 — A static web app in TypeScript, built by Vite.** Decided
  2026-10-20. The same files serve the development server, the launcher,
  the Kidux package and a host online. Rules out a native app and a
  server-side game.
- **D2 — Python is Pyodide, in a Web Worker.** Decided 2026-10-20. Real
  CPython, the Python the child meets outside the game; in a worker so that
  the page never freezes and a run can be stopped. Rules out a Python
  dialect compiled to JavaScript.
- **D3 — The world is Python, tested under CPython.** Decided 2026-10-20.
  The child's code calls real Python objects, and the same package runs on
  the development machine, so levels are checked by pytest in milliseconds.
  Rules out a world written in TypeScript and driven from Python.
- **D4 — The scene is drawn by Phaser; its version is chosen at piece 1.3.**
  Decided 2026-10-20. Phaser 4 is out; 3.90 or 4.x is chosen once 4.x's
  support for Tiled maps has been tried. *Its version: D15.*
- **D5 — The editor is CodeMirror 6.** Decided 2026-10-20. Light,
  accessible, with line markers and completion. Rules out Monaco, ten times
  its size.
- **D6 — The launcher is a Go program embedding the built game.** Decided
  2026-10-20. One executable per platform with nothing to install,
  cross-compiled from Linux. Rules out Electron and a Python launcher.
- **D7 — The words are JSON files per language, kept in step by a check.**
  Decided 2026-10-20. `i18n/<lang>.json` with the same keys in each;
  `tools/i18n_check.py` fails on a key one lacks, a key used and missing, a
  key unused, and a string for people written in the code. Adding a language
  is adding its file. Rules out an i18n library.
- **D8 — Forbidden words are a list kept outside the repository.** Decided
  2026-10-20 by the owner. The name of the game Kydux takes after, and
  anything else the project must not name by accident, such as names from
  famous wizard stories, are listed in `~/.config/kydux/forbidden.txt`,
  since the list cannot be written in the repository it guards.
  `tools/forbidden.py` matches each entry in any case, with accents ignored
  and up to three other characters between its letters, so that one entry
  covers its spaced, hyphenated and underscored spellings. Files, paths and
  commit messages are checked, by the project tests and by the pre-commit
  and commit-msg hooks; on GitHub, where there is no list, the test skips.
  A finding names the place, never the word.
- **D9 — Node comes from NodeSource.** Decided 2026-10-20. Debian 13's
  Node is 20, past its end of life, and Vitest 5 refuses it; NodeSource's
  apt repository gives Node 24, the LTS maintained until 2028.
- **D10 — The shell is plain DOM, without a UI framework.** Decided
  2026-10-20. A few screens with small helpers do not need one, and the
  game's weight goes to Pyodide and the scene. Revisited if the shell grows
  past what helpers keep readable.
- **D11 — The game is served cross-origin isolated everywhere.** Decided
  2026-10-20. Every server sends `Cross-Origin-Opener-Policy: same-origin`
  and `Cross-Origin-Embedder-Policy: require-corp`, so that the page has
  `SharedArrayBuffer` and Pyodide's interrupt can stop a runaway program in
  place. Where isolation is missing, the runtime stops a run by restarting
  the worker instead.
- **D12 — GitHub sees Kydux only inside its hours.** Decided 2026-10-20 by
  the owner. Madrid's 19:00 to 03:00 around a night from Tuesday to Friday,
  and the whole of Saturday, Sunday and Monday. `ci/push.sh` is the one way
  to push, dating the commits not yet on GitHub inside the hours; the
  pre-push hook refuses any other (`ci/hours.py`).
- **D13 — The development server serves HTTPS, with a local authority's
  certificate.** Decided 2026-10-20, found at piece 0.1. A browser isolates
  only a secure context, and plain HTTP from another computer is not one:
  from the MacBook, `http://hija.local:5173` had the headers but no
  `SharedArrayBuffer`. `ci/dev-cert.sh` makes a certificate authority of the
  machine's own and a certificate for its names and private addresses, kept
  with their keys in `~/.config/kydux/tls/`; the dev and preview servers use
  it when it exists. The authority carries name constraints that limit it to
  the machine's names and private address ranges, so that trusting it on the
  other computer trusts nothing else. Without the certificate, as on GitHub,
  the servers serve HTTP on localhost, which browsers count as secure.
- **D14 — The child's code is contained by the browser's sandbox.**
  Decided 2026-10-20. The child's Python is real CPython compiled to
  WebAssembly, running in a Web Worker: it has no access to the computer's
  files (Pyodide's file system is in memory), processes, sockets or devices,
  nor to the page, its cookies or other tabs; the servers that serve the game
  only serve files and execute nothing they are sent. Inside that sandbox the
  code can still reach Pyodide's bridge to JavaScript (`import js`), and with
  it make requests as any web page can, post messages to the page, and touch
  the game's own storage; the worst it can do there is cheat at the game.
  Piece 1.8 narrows that further (plan.md).
- **D15 — Phaser 4.** Decided 2026-10-20 (sprint-2.md), built
  2026-10-21. Phaser 4.2.1, out since April 2026, keeps 3.x's Tilemap API
  and Tiled's formats, and 3.90 is the end of its line. Pinned exactly; its
  types come with it. It is about 1.4 MB, loaded by a dynamic import after
  the page, in a chunk of its own.
- **D16 — One source for a level's map.** Decided 2026-10-20 (sprint-2.md).
  `level.json`'s rows of characters feed both the world and the scene, which
  draws them with placeholder tiles and a placeholder wizard drawn at run
  time with Canvas 2D (`app/src/engine/placeholders.ts`). Tiled comes with
  the art in phase 4, when there are tiles to place: the world will read the
  `.tmj` then, and the rows of characters will go. Two files describing one
  map would drift.
- **D17 — CodeMirror 6, its packages declared.** Decided 2026-10-20
  (sprint-2.md), built 2026-10-21. `codemirror` 6.0.2 with
  `@codemirror/lang-python` 6.2.1, as D5 planned. The editor imports
  `@codemirror/state`, `view`, `commands`, `language` and `autocomplete`
  directly, so they are declared and pinned at the versions `codemirror`
  resolves, rather than left to the lock file as sprint-2.md said: a package
  used but not declared can vanish with an update of the one that brought
  it, and two copies of `@codemirror/state` break the editor.
- **D18 — Loading Python has a deadline.** Decided 2026-10-21, found at
  piece 1.7. When Pyodide's WebAssembly fails to arrive, Pyodide logs a
  warning and its `loadPyodide()` never settles, so the page would say
  *Preparing Python…* for ever. The runtime gives up on a load that has not
  finished in 120 seconds, ends the worker and reports `failed`, which the
  level screen shows with a *Reload* button. Two minutes leave room for a
  first load of about 13 MB over a slow connection.
- **D19 — The game keeps to its own origin, and the child's code away from
  JavaScript.** Decided 2026-10-21, piece 1.8, narrowing D14. Every server
  of the game sends, with the isolation headers, this
  Content-Security-Policy, which the launcher sends as it is:

  ```
  default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self';
  connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';
  font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
  ```

  `connect-src 'self'` is what keeps the child's code, and anything else in
  the page, from reaching another server; `'wasm-unsafe-eval'` is what
  Pyodide needs, and `'unsafe-inline'` for styles what CodeMirror and Phaser
  need. Nothing is evaluated from a string. Behind it,
  `kydux_world.sandbox` refuses the modules `js`, `pyodide`, `pyodide_js`,
  `_pyodide`, `_pyodide_core` and `micropip` to the child's code in two ways,
  since an import looks in `sys.modules` before any finder: the worker
  installs, once, a finder that refuses them and takes them out of
  `sys.modules`, except the `_pyodide` parts Pyodide runs from; and the
  child's code runs with builtins whose `__import__` refuses them, loaded or
  not. The refusal is Python's own `ModuleNotFoundError`, which piece 2.4
  says in the child's words; sprint-2.md had a message of the game's own,
  which would have been English in every language. The runtime also takes a
  worker's result only when it has the shape of one, its world's too, and
  treats anything else as a run that could not be run.
- **D20 — The child's objects are Python objects with read-only state.**
  Decided 2026-10-20 (sprint-3.md), built 2026-10-21. What the child
  commands, the wizard, things and actors, are instances of the world's
  classes (`kydux_world.things.Child` and below), with methods for what
  they do and properties for what they are. Setting or deleting any
  attribute raises `ReadOnly`, an `AttributeError` the child's words
  explain; `dir()` shows only the names `kydux_world.api` gives the
  object's role; the world keeps its state on the object under `_k_`
  names. A second line, like D19: the browser's sandbox stays the wall,
  and a child who digs past it cheats only themselves. Rules out plain
  dicts or namedtuples for the child, and setting state to move.
- **D21 — One tick is one thing done.** Decided 2026-10-20 (sprint-3.md),
  built 2026-10-21. Every spell that does something takes one tick: each
  step of a move, `say`, `wait`, `pick_up`, `open`, and a spell that could
  not be done (`blocked`), so that trying costs time as doing does. In each
  tick, after the wizard's event, every actor takes its step, a teacher
  who sees the wizard catches it, and the goals are checked; all of a
  tick's events carry its number and the child's line. A `reach` goal is
  met only by the run's end on its tile, unless it says `on_the_way` (D146): a
  goal is stopped at, and when the wizard walked over it on the way the result
  says so
  (`walked_over`), and the page tells the child. Asking takes no
  tick. The end of a run, past the tick limit or caught, is a
  `BaseException` the child's `except Exception` lets through, and a world
  that has ended refuses every further spell, so not even a bare `except:`
  carries the run on.
- **D22 — Errors are explained by the world, said by the page.** Decided
  2026-10-20 (sprint-3.md), built 2026-10-21. `kydux_world.explain` turns
  a Python exception into an explanation, a kind and its parameters, with
  suggestions from the names the level teaches for a spell, and from
  `wizard` and the level's ids for a name; the page says it through
  `t('error.<kind>')` in the player's language, a code name in backticks
  shown as code, and Python's own text stays in the error for an adult.
  The kinds: `unknown_spell`, `unknown_name`, `read_only`, `not_called`,
  `unclosed`, `missing_colon`, `indentation`, `syntax`, `arguments`,
  `no_such_module` and `other`. `not_called` was not in sprint-3.md's
  table: a spell named without its brackets, `wizard.move_right` alone, is
  no error to Python and does nothing, which a child cannot tell from a
  spell that failed, so the world refuses it before the run, at its line.
- **D23 — A level says what it teaches.** Decided 2026-10-20 (sprint-3.md),
  built 2026-10-21. `level.json` lists in `api` the names the level uses,
  as `role.member` from `kydux_world.api`'s table (`wizard.move_right`,
  `door.open`, `thing.position`), and the level is refused when it names
  one no object has. `world/tests/test_levels_content.py` reads each
  solution with `ast` and refuses a use of a member the level does not
  teach, so the course's order cannot be broken by accident; the
  suggestions of D22 come from the same list, and the grimoire and the
  editor's completion will show it. A variable named like a thing's id is
  taken for that thing, which errs on the side of checking.
- **D24 — A door is opened from next to it.** Decided 2026-10-21, piece
  2.2. `door.open()` works only with the wizard on a tile beside the door;
  from further away it is `blocked` with the reason `far`, and so is
  opening a door already open (`open`), and a locked door without its key
  (`locked`). Sprint-3.md set no distance; opening a door from across the
  map would teach nothing about where the wizard is, and walking to it is
  half the puzzle.
- **D25 — The playback plays a tick at a time, with all its events.**
  Decided 2026-10-21, piece 2.2. A tick holds the wizard's event and its
  actors' (D21), so `Playback` groups the events by tick and each step
  plays all of one tick's together; its listeners get the tick and its
  events. Playing one event per step would make the teacher move after the
  wizard rather than with it.
- **D26 — A goal's parameters never reuse its own keys; a level's own
  goals are declared.** Decided 2026-10-21, piece 2.3. A `collect` goal
  for any thing of a kind names the kind with `of`, `{"kind": "collect",
  "of": "key"}`, since `kind` is the goal's own (sprint-3.md had `kind`
  twice). A level with goals of its own says so in level.json,
  `"own_goals": true`, and its goals.py comes with it: the page fetches it
  and sends its source to the world with the level, the tests read it from
  the level's directory, and either without the other is refused. Rules
  out the world looking for goals.py on its own, which it cannot do in the
  browser.
- **D27 — The game's words for the ideas of programming.** Decided
  2026-10-21 by the owner. An **action** is a method: what an object knows
  how to do, `wizard.move_right()`, `door.open()`, `teacher.can_see()`.
  The wizard has its general actions from the first level: moving,
  waiting, saying, picking up, finding, looking at what it carries, using
  a thing. Some actions come with a thing it carries: the wand gives
  `wizard.cast(...)`, the broom gives `wizard.fly()`; they stay the
  wizard's actions, and without the thing they are refused with *You do
  not know this action yet*. A **spell** is a named piece of magic, data
  and not a method, cast with the wand where the wizard stands,
  `wizard.cast("zelim")`; which spells can be cast is the level's to say
  (D42, which supersedes this entry's `wizard.read(book)` and
  `wizard.spells`: no chapter of the course reads a spell from a book). A
  spell is a string first, and may become an object when classes are
  taught. An **attribute** keeps Python's word:
  what an object knows about itself, `door.locked`, `wizard.position`. A
  **thing** (or item) is what the wizard can pick up and carry: a key, a
  book, a wand, a broom, a potion. A **module** is a book of the school's
  library. Running the child's code is **Run** (*Ejecutar*), never *Cast*.
  The panel that lists what the wizard can do, carries and knows is the
  **notebook** (*cuaderno*), not a grimoire. Until this decision the
  game's texts, docstrings and plans said *spell* for *method* and *Cast*
  for *Run*; sprint 4 renames them. Rules out a word of the story's for a
  mechanism of the language's. These are the proper
  words; how a child reaches them, beside the easy word first, is D59.
- **D28 — An action that cannot be done says why, where it happens.**
  Decided 2026-10-21 (sprint-4.md), on the owner's acceptance test of
  sprint 3. A `blocked` event is shown as a thought over the wizard, a grey
  cloud with two small circles leading to it, in the child's words, for
  three ticks; the run's card, when the run is not won, repeats the first
  one with its line. The event carries `tried`: false for an attempt that
  could not even be made (a door too far away, or already open), which is
  not animated as a try, and true otherwise, when what would not do
  shakes. The words name the thing by its kind with its article, *the
  door*, *la puerta*, from `things.<kind>` in the i18n files, rather than
  by the id the child typed as sprint-4.md had it, so that a sentence
  reads well in every language. A bubble or a thought that has no room
  above the wizard goes under it, and neither leaves the scene's sides.
- **D29 — The level screen is a view of a controller.** Decided 2026-10-21
  (sprint-4.md), built the same day. `RunController`
  (`app/src/ui/controller.ts`) holds the state of a run, what each button
  does, and what the screen shows, as a snapshot: the state, the last
  world, the outcome, the lines to mark, the goals' marks at the tick
  shown. It reaches the runtime and the scene through the small interfaces
  it needs of them, so Vitest drives it with fakes. The level screen makes
  its DOM once and renders every snapshot. An outcome is data, not words:
  the reason an action could not be done is kept as its code and its
  thing's kind, and the card says it in the language of the moment, so a
  change of language needs no new run.
- **D30 — The notebook's words come from two places by design.** Decided
  2026-10-21 (sprint-4.md), built the same day. A member's example is its
  docstring's, in the code, the same one the error explanations use; its
  description is in `i18n/<lang>.json` under `notebook.<role>.<member>`,
  so that the child reads it in their language while the code stays
  English, and `tools/i18n_check.py` requires one for every member of
  `kydux_world.api`'s table and refuses one for anything else. At build
  time `pack-world.mjs` runs `python -m kydux_world.api` and writes the
  table as `api.json`, so the page needs no Python to show it. The
  notebook opens over the scene, beside the editor, rather than over the
  editor as first built: over the editor, an example clicked landed where
  the child could not see it. The editor's completion offers, after a
  name the child's code holds and a dot, the members the level teaches of
  it, and nothing else: Python's keywords would be noise at this age.
- **D31 — Progress is one document behind one interface.** Decided
  2026-10-21 (sprint-5.md), built the same day. `ProgressStore`
  (`app/src/progress/store.ts`) has `load()` and `save(progress)`; the
  game's store is `GamesStore`, which keeps a document per saved game
  (D70), and `LocalProgressStore`, one document under `kydux.progress`,
  serves the tests; a remote store can come later behind the same
  interface. The document has a `version`; one of another version, or
  none, is read as the defaults, and each field read back is checked for
  its shape. The language chosen, the settings, the hints shown in each
  level, whether a level was tried, its stars, the start
  cards seen and the item last opened all live in it, so that export and
  import carry everything, and nothing else in the page keeps state: i18n
  keeps the language where the game tells it to (`keepLanguageIn`). A
  storage that cannot be read or written leaves the document in memory for
  the visit.
- **D32 — The course is chapters of lessons and levels, in `content/`.**
  Decided 2026-10-21 (sprint-5.md), built the same day. A chapter is a
  directory under `content/chapters/` with `chapter.json`, its id and its
  items in order, each `lesson:<id>` or `level:<id>`, and its title in
  `text.<lang>.json`. `pack-world.mjs` writes the chapters, sorted by
  directory, as `content/course.json`, which the page reads for the map,
  for what comes after an item, and for where Continue goes. It is the
  course's one order: nothing else lists the levels, so no second list can
  disagree with it. A lesson is a directory under
  `content/lessons/` (D33).
- **D33 — A lesson is Markdown, in pages, with one Try it.** Decided
  2026-10-21 (sprint-5.md), built the same day. A lesson is a directory
  under `content/lessons/` with `lesson.json`, the names it explains
  (`teaches`), and its text in `<lang>.md`, falling back to English. Its
  pages are separated by a line of `---`; the first page opens with its
  title as a `#` heading. A fenced block marked `python try` is the Try it:
  its example, shown as code; the level after it starts with its own
  program (D63). marked (`app/src/ui/lesson.ts`) turns
  the Markdown into HTML, put in as it is: the lessons are the project's
  own, and `world/tests/test_course_content.py` refuses HTML in them, as
  well as a lesson missing in a language, pages that differ in number
  between languages, more than one Try it, a `teaches` the next level does
  not teach, and a Try it that fails in that level. Code on a page is
  plain `<pre>`, not highlighted: a highlighter would be one more
  dependency for a few short lines, and the editor already shows the
  colours. Reaching the last page marks a lesson read. Its last page's
  button says *Try it* only where a level comes next, the one the example
  is tried in; a lesson before another lesson or a story says *Go on*,
  its example shown all the same.
- **D34 — An item is open once the one before it is done.** Decided
  2026-10-21 (sprint-5.md), built the same day. On the map, a stop is done
  (a lesson read, a level won), open (the course's first item, or the one
  after a done item, across chapters too), or locked; a locked stop is not
  a link. A level's address still opens it directly, for a developer and
  for the tests, and a done item can always be played again. A level only
  tried is not done.
- **D35 — The split between scene and editor, and the editor's text size,
  are the child's to set.** Decided 2026-10-21 (sprint-5.md), built the
  same day. Both are kept in the progress document under `settings` and
  set as CSS variables on the page's root (`app/src/ui/look.ts`), so that a
  screen drawn later finds them: `--split`, the scene's share of the level
  screen's width, from 0.35 to 0.75, and `--editor-font-size`, chosen in
  the settings (`#settings`) among 14, 17, 20 and 24 pixels. The handle
  between the panes takes pointer events, so a mouse and a finger both
  drag it; a double-click gives back 0.6, and the arrow keys move it by
  0.05, so that it can be reached without a pointer. The share shows while
  dragging and is saved when the drag ends. The scene follows as it does a
  window resize. Under 800 pixels the panes stack and the handle is gone.
  The settings' Back returns to the screen they were opened from.
- **D36 — The wizard is the child's: a name, a gender and a look, kept in
  the progress document.** Decided 2026-10-21 (sprint-6.md), built the
  same day. `progress.wizard` is `{name, gender, look}`, or null before the
  child has made one; the document's `version` stays 1, and one without
  `wizard` reads as null. `readWizard` (`app/src/progress/store.ts`) keeps a
  wizard only when its name, trimmed, is 1 to 20 letters of any alphabet,
  digits, spaces, hyphens or apostrophes, its gender `girl` or `boy`, and
  its look one the game has. `gender` chooses the words (D37), nothing
  else. The looks are `app/src/engine/looks.ts`: eight ids, each with the
  placeholder figure's skin, hair, hair style, robe, hat and band, four
  skin tones each with both hair styles, none like a famous wizard; with
  phase 4's art the same ids pick sprite sheets, so the document does not
  change. The creator is at `#wizard` (`app/src/ui/wizard.ts`); the start
  screen's big button leads there while there is no wizard, and offers
  *Change my wizard* once there is. Done needs a name and a gender: the
  gender is never preset, since a default would choose for the child.
  The gender buttons are words, not a figure each, since a figure is a
  look and any look is either's. Escape and Back leave an existing wizard
  as it was. *New game* begins with no wizard (D64, D70); an import keeps
  the file's, or the current one when the file has none. The scene draws
  the wizard from the look and says its id in `data-look`, which the
  browser tests read: a WebGL canvas's pixels cannot be read reliably, so
  the colours are checked on the creator's 2D canvas instead.
- **D37 — The words follow the wizard.** Decided 2026-10-21 (sprint-6.md),
  built the same day. A text for the player may hold a choice,
  `{boy's words|girl's words}`, either side possibly empty (`cansad{o|a}`),
  and the wizard's name, `{wizard}`. `personal()` (`app/src/i18n/personal.ts`)
  resolves both; `forWizard()` in `app/src/i18n/` does it for the wizard the
  page was told of by `speakOf()`, which `main.ts` calls on every screen it
  shows, from the progress document. Every path a text takes goes through
  it: `t()`, a lesson's Markdown before its pages are cut, and every string
  of a level's text, the starting code included. `t()` makes the choices in
  its template before it puts the parameters in: a parameter can be the
  child's own text, a Python name, and
  must never be read for a choice. Braces with no bar, or with more than
  one, are left alone, so `t()`'s `{name}` and a Python set survive. With
  no wizard, which only a developer's direct address brings about, the
  first side is taken and `{wizard}` is `wizard.no_name`, *Kydux* in
  every language, the creator's default name (D119).
  `tools/i18n_check.py` refuses a choice with other than two sides in any
  text for the player, and, in Spanish, `mago` or `maga` outside a choice;
  the world's tests run every level's starting code and every lesson's Try
  it as a girl's wizard and as a boy's (`world/tests/wizard_words.py`).
  English needs few choices (`{his|her}` in a lesson); the code's `wizard`
  is Python, never a word to gender. The adjectives that agree with the
  wizard (`quiet{o|a}`, `agotad{o|a}`) are not checked: the check would need
  a grammar, and a reviewer reads the Spanish.
- **D38 — The screens the game is made for.** Decided 2026-10-21
  (sprint-6.md), built the same day. The level screen works from 1024 ×
  700 pixels, a tablet held sideways with its browser's bars, to any size:
  at 1024 × 700, 1280 × 720 and 1920 × 1080 the scene, the editor with
  eight lines or more, Run, the goals, the speed and the gear are in view
  with no scrolling, the start card and the notebook fit inside the
  scene's frame, and the heading wraps rather than overlap
  (`app/e2e/screens.spec.ts`). Under 800 pixels the panes stack, for a
  phone, which the game does not promise but does not break on. The goals
  panel's heading folds it, since at 1024 the open panel covers the scene's
  first row, the wizard's start; it stays folded for the visit. The keys: Tab and
  Shift+Tab indent, Escape then Tab leaves the editor, Ctrl+Enter (Cmd on
  a Mac) runs in the editor, and on the whole level screen Alt+R runs and
  Alt+N opens the notebook. Those two are read by the key's place
  (`event.code`), so that a Mac's Option+R, which types `®`, works and
  types nothing. The buttons say their key in their title, and the
  settings list every key.
- **D39 — The loop suite leaves screenshots for the reviewer.** Decided
  2026-10-21 (sprint-6.md), built the same day. `app/e2e/loop.spec.ts`
  walks the whole loop in each language, from a fresh visit through the
  creator, the first lesson, a failed run, a hint, a win and the next
  lesson to the map and the settings, asserting each step as the other
  specs do and saving a full-page screenshot of it under
  `app/e2e/shots/<lang>/<nn>-<step>.png`. The folder is ignored by git and
  emptied at each run, so it always shows the code just tested;
  `ci/check.sh --e2e` says where it is. The owner tries the game every few
  sprints; between those trials, the shots are what a reviewer reads in
  place of hands on the game. They are taken at 1280 × 720, the laptop the
  game is first made for (D38).
- **D40 — An action once learned stays known.** Decided 2026-10-21 by the
  owner, during sprint 6, built the same day. A level's `api` (D23) still
  lists what that level teaches, and the world's tests hold its solution
  to it; what the child may use in a level is wider: every name taught by
  that level and by every level before it in the course. `pack-world.mjs`
  writes it into `content/course.json` as `known`, by level, and the page
  gives it to the world, the notebook and the editor's completion in
  place of the level's own list (`knownApi` in `app/src/content/course.ts`);
  a level opened outside the course keeps its own. So the notebook of the
  level with the teacher lists the moves and `pick_up` learned before,
  though the level does not need them, and the world lets them be used,
  rather than the notebook offering what the world then refuses. The
  notebook still shows only the objects the level holds: no door where
  there is none, and the teacher only where the teacher is. A name the
  course has not taught yet is shown nowhere.
- **D42 — Spells.** Decided 2026-10-21 (sprint-7.md), built the same day.
  A spell is a word, cast with the wand: `wizard.cast("<spell>")` is the
  wand's action (D27), and a spell that acts on a thing is given it too,
  `wizard.cast("fendra", book)` (D47), and without the wand carried it is refused with a
  `blocked` event of reason `no_wand`, which the wizard thinks as *I do not
  know this action yet*; nothing is tried, so nothing shakes. A level says
  which spells exist in it, `"spells"` in `level.json`, words in small
  letters; any other is refused with `unknown_spell` and the spell's name,
  and the wizard shakes, having tried. A spell cast makes a `cast` event
  and does what it does where the wizard stands: `zelim`, chapter 1's,
  breaks the seal of a door next to the wizard. The world does not hold
  the child to the level's `api` while it runs (the api is the notebook's,
  the suggestions' and the solution's, D23, D40); the wand is the rule
  for `cast`, as the story has it. The spells' names are `story.md`'s.
- **D43 — A door opens by hand, by key, by word or by spell.** Decided
  2026-10-21 (sprint-7.md), built the same day. A door in `level.json`
  has at most one of `"locked": true` (`door.open()` with its key
  carried), `"sealed": "<spell>"` (the spell cast beside it; the spell
  must be one of the level's) or `"password": "<word>"` (the word said
  beside it, exactly, capitals and all); with none it opens by hand. A
  door opened by a spell or a word opens in the tick of the wizard's
  `cast` or `say`, by an `open` event whose actor is the door itself, so
  that the wizard keeps one event per tick, which the run's consistency
  check holds to (D20). `door.open()` on a sealed door or a password door
  is refused (`sealed`, `password`) and the door shakes: the wizard tried.
  `door.sealed` is true until the seal is broken; `door.password` is the
  door's word, so that a later chapter can teach reading it into a
  variable. The scene draws the four closed doors apart, one frame each,
  named as the layout's `lock`: plain, a lock plate with a keyhole, a
  glowing rune, a mouth.
- **D41 — A lesson is one idea: its theory first, then how the game says
  it, then Try it.** Decided 2026-10-21 by the owner (plan, phase 5;
  sprint-7.md), built the same day. A lesson's first page or two say what
  the idea is and why it exists, in words a child of eight understands,
  with no code; the next page shows it in the game's API with its example;
  the last is Try it, into the first level that practises it. One idea per
  lesson, so the course has more lessons than the draft's 10 to 20, each
  short (`course.md`). Conditions come before loops, each alone, and a
  loop with a condition only once both are known. An idea goes where it
  belongs, not where it is first handy: `wizard.items` is read like an
  attribute, so it is taught with attributes in chapter 2, not with
  picking things up in chapter 1. A bonus never asks for what the course
  has not taught: without loops, chapter 1's last level asks for no line
  to spare.
  `world/tests/test_course_content.py` holds a chapter that has lessons to
  it: every name a level's `api` teaches was explained by a lesson before
  it, or taught by a level before it. A chapter with no lesson yet holds
  levels that get their lessons in its own sprint.
- **D44 — An item's id is its slug; its order is the chapter's.** Decided
  2026-10-21 (sprint-7.md), built the same day. A lesson's or a level's
  directory is a slug with no number (`the-corridor`,
  `what-a-program-is`), and only `chapter.json` says where it comes
  (D32), so that an item is added or moved without renaming the others.
  Chapters keep their number: they are few, and their order is the
  story's. The ids are also the progress document's keys, so a renamed
  item loses the progress kept under its old id.
- **D45 — A level may tell its story on its cards.** Decided 2026-10-21
  (sprint-7.md), built the same day. A level's `text.<lang>.json` may have
  `intro`, one to three short sentences shown on the start card above the
  goals, and `outro`, shown on the win card; both are said by the
  character `level.json` names in `speaker`, an id of `story.md`'s
  characters, whose name the page shows from `characters.<id>` in
  `i18n/`, the same in every language. Both follow the wizard (D37). The
  checks: an intro or outro is in every language or none, never empty, and
  has a speaker (`world/tests/test_levels_content.py`); a speaker is a
  character of the story (`tests/project/test_story.py`) with a name in
  every language (`tools/i18n_check.py`).
- **D46 — A shelf is a tile that stops feet, not eyes.** Decided
  2026-10-21 (sprint-8.md), built the same day. The map character `=` is a
  shelf: a bookcase, a table, a gap. No one walks onto it (`Level.free`),
  sight passes over it (`Level.clear`, the world's `is_clear`, the page's
  `clearOf`), and a thing may lie on it, placed with `"at"` since a
  marker letter makes its tile floor; an actor may not stand on one, nor
  patrol across it. `pick_up` takes only what lies on the wizard's own
  tile, so a thing on a shelf comes down only by a spell. Both sides'
  sight is tested with their own rule on `tests/fixtures/sight.json`,
  which holds shelves.
- **D47 — `fendra` pulls the thing it is told, when the wizard can see
  it.** Decided 2026-10-21 (sprint-8.md), and the thing named on
  2026-10-28 by the owner: the library's shelves hold many books, and the
  nearest one is not the one wanted. Cast with the wand and given the
  thing as its second argument, `wizard.cast("fendra", book)`, `fendra`
  moves that thing onto the wizard's tile when it lies along one of the
  four ways from the wizard's tile, up to three tiles (`FENDRA_REACH`),
  through shelves and not through walls or closed doors, nor past a door's
  cell the wizard does not stand on (D129; `world.in_line`).
  The other spells take no thing; a spell given the wrong arguments is
  explained with the example that fits it (`ActionArguments.example`).
  The thing's `pull` event comes in the wizard's tick, the thing's own, as
  a door's `open` by a spell is (D43). A thing out of reach refuses the
  cast, `out_of_reach`, and the wizard shakes, having tried. The wizard
  then picks the thing up: a spell moves the world, the hands carry. A
  `pick_up` with nothing in the hands' reach and a thing up on a shelf in
  the spell's is refused `too_high`, so that the child thinks of the
  spell. A thing painted in a state of its own for the pull (`pulled`, a
  book glowing) is drawn so while it comes. A spell's effect is looked up by name in
  `SPELLS` (`world.py`), a function from the world and the wizard's tile
  to an `Effect`, the change to make in the tick or the reason to refuse;
  `level.KNOWN_SPELLS` names the same spells, so that a level naming a
  spell the world cannot cast is refused when it loads.
- **D48 — Actors who stand and speak, and giving.** Decided 2026-10-21
  (sprint-8.md), built the same day. The actor kinds are `teacher`,
  `ghost` and `cat`, each a class in `actors.ACTORS`; a ghost or a cat
  stands where it is put, faces one way, catches no one, and has no sight
  cone in the scene. The wizard walks through a ghost's tile and a cat's:
  no level asks otherwise yet. `wizard.give(thing)` hands a thing the
  wizard carries to the actor on a tile beside it, the first by id: a
  `give` event, and the thing is gone from the map and from
  `wizard.items` (`position` None, `find_nearest` passes it by). It is
  refused with `not_carried` for a thing not carried, and with `nobody`
  when no actor is beside; `far` would say *I cannot reach the thing*,
  which is not what goes wrong. `give` takes the thing
  as an object, so that a variable holding what `find_nearest` gave back
  is what is given. The goal `give` (`id`, `to`) is met once that thing
  has been given to that actor. On the page the wizard turns to the
  figure that takes the thing, then the thing goes from the middle of the
  wizard's hands to the middle of that figure, where it is drawn (its
  nudge and its lowering included), and fades there (the owner,
  2026-11-01).
- **D49 — A level may hand the wizard things from the start.** Decided
  2026-10-21 (sprint-8.md), built the same day. `"carrying": ["wand"]` in
  `level.json` lists kinds of thing the wizard holds at tick 0, each once,
  each a thing whose id is its kind, with no tile; the start card says so
  (`level.carrying`), and the scene counts them carried from tick 0. The
  world keeps nothing between levels: each level says what is carried, so
  that any level can be played on its own.
- **D50 — Goals that read the code: lines, numbers, and what it uses.**
  Decided 2026-10-21, while building sprint 8. Besides `lines_under`, a
  level may ask, before the run, for `numbers_under` (fewer numbers
  written in the code than a count, so that a value is named once, as a
  variable) and `uses` (the code names a member, an action or an
  attribute, as `.locked` or `.find_nearest`). They are the world's
  goals, not a level's `goals.py`: every chapter that teaches an idea
  needs to ask for it, so one goal serves them all. A code that does not
  parse meets neither. They are bonus goals in chapter 2: a run that wins
  without the idea still wins, and the extra star says the idea was
  used. A goal read from the run, `ticks_under` (D133), is met when the run
  ends in fewer ticks than its count; it is judged only at the run's end
  and never fails on the way, since a goal failed loses the run, and a
  longer program that wins still wins, without the star.
- **D51 — A level may be played in several ways, and the program must win
  them all.** Decided 2026-10-21 (sprint-9.md), built the same day.
  `level.json`'s `ways` is a list of two or more, each with an `id`, a
  Python name, and what differs in that way: `things` and `actors` as
  `{id, ...}` merged into the level's own by id, field by field, and
  `carrying`, `spells` and `dark` in place of the level's; the map, the
  goals, the api and the rest are the level's in every way.
  `Level.from_dict` gives the level as its first way, with `ways` holding
  each way's own `Level` (`level.way(id)`). `run_code` runs the child's
  code once per way, each in a world of its own, and returns the first
  way not won, or the first, with `way` naming it, `ways` holding every
  way's result, and `status` won only when every way is. Rules out a
  random way per run: a child must see that one program handles every
  case, and a test must be able to say so. The page keeps every way's
  world and shows one: the first not won; the goals, the timeline and the
  card follow the way shown. The card says *won* only when every way is: a
  way won while another is not is its own outcome, `way_won`, so that the
  progress document never counts a level won by looking at its one good
  way. What the child is told of it is D204's: what may differ at each run,
  never the ways.
- **D52 — A dark room hides what lies on its floor.** Decided 2026-10-21
  (sprint-9.md), built the same day. A level with `"dark": true` is unlit
  until `kirra` (which it lists among its spells when it must find or open
  something in the dark, D162): until then, a
  thing that can be carried and lies farther than one tile from the
  wizard, in any of the eight directions, has no `position`, and so
  `find_nearest`, `find_all` and `fendra` pass it by; doors, holes and
  actors are the castle's shape, and are seen. `kirra` makes a `light`
  event, the world's, and lights the room for the rest of the run; in a
  lit room it does nothing. A teacher's sight is not darkness's
  business: Dask carries a lantern. What is seen is what is near the
  wizard now, which the code can ask about; rules out a fog that
  remembers where the wizard has been, which it cannot. Over a painting the
  dark is one soft shape over the dark area, faint enough for the painting's
  shapes to show, with a soft light round the wizard.
- **D53 — A stair comes and goes, and `osto` holds it** (its thing is a hole
  that opens in the floor: D167; one that never closes on its own: D178). Decided
  2026-10-21 (sprint-9.md), built the same day. A thing of kind `stair`,
  with a whole `period`, lies on a floor tile and is in place for
  `period` ticks and away for as many, in place from tick 0. A step onto
  it in a tick it is away bumps (`by: "stair"`); a stair never goes from
  under the wizard, since only stepping onto it is asked. `stair.in_place`
  says whether a step onto it, taken now, lands: it looks at the next
  tick, the one the step would take, so that `while not stair.in_place:
  wizard.wait()` and then a step always land. `osto`, cast beside a
  stair, holds it in place for `HOLD_TICKS` (six) from the next tick it is
  in place, with the stair's `hold` event (`from`, `until`); with no stair
  beside, it is refused with `nothing_near`. A stair is never locked,
  sealed or opened.
- **D54 (`can_see` is not taught: D139) — `not`, `==` and `can_see` belong to the lesson on true and
  false; `wait` to the lesson on `if`.** Decided 2026-10-21 (sprint-9.md),
  built the same day. An expression that is true or false is the idea of
  one lesson: `==` asks whether two values are the same (and is not `=`),
  `not` turns the answer round, and an action can answer
  (`teacher.can_see(wizard)`); `and` and `or` wait for the challenges.
  `wizard.wait()` comes with `if`, in a sentence of its example: the level
  after the lesson on `if` asks the wizard to wait while Dask looks this
  way, so the action is needed there, and it is too small an idea for a
  lesson of its own. The teacher of the passages is `dask` in the
  child's code in every level, the name the story gives him, and his kind
  is `teacher`, as the notebook says.
- **D55 — Gemini drafts the child's words; Claude briefs and reviews.**
  Decided 2026-10-22 by the owner, built the same day. Every text the
  child reads, and the story bible, is drafted by Gemini through
  `tools/write/write.py`: a brief (`tools/write/briefs/<name>.md`, its
  front matter naming the files to write and the context to read), the
  rules every text follows (`tools/write/rules.md`: the style, the choices
  for the wizard's gender and for Nuri's, the names rule, the formats, the
  answer's shape), and the context files in full make the prompt; Gemini
  answers with a JSON object of path to text, written under `drafts/<name>/`
  with a manifest of the model, the brief and the date. `drafts/` is ignored
  by git and refused by the repository's checks; a person reads each draft,
  corrects it, and moves it into `content/` or `docs/dev/`. The brief stays
  in the repository as the record of what was asked. The model is pinned in
  the tool; a busy model (429, 500, 503) is tried again, waiting longer each
  time. The prompt never carries the forbidden list: it asks for names that
  recall no famous story of wizards, and the hooks check what comes back.
  Claude writes the briefs, the corrections, and words too small to brief:
  a button, a label, a notebook entry.
- **D56 — Items have kinds, and a number in their chapter.** Decided
  2026-10-22 by the owner's UAT (sprint-10.md), built the same day. A
  chapter's items are `story:<id>`, `lesson:<id>` and `level:<id>`. A story
  page is `content/stories/<id>/` with `story.json` (`id`, and `opening`
  for the game's opening, which is not in the course) and `<lang>.md`,
  pages like a lesson's with no Try it; it is read on the lesson screen,
  ends in *Go on*, is done once read to its end (`progress.stories`), and
  is a scroll on the map. A level's `kind` in `level.json` is `practice`
  (the default), `fix` (a program given that does not work, to repair),
  `improve` (a program that works, to make better) or `challenge`; a fix
  or improve level says on its start card what is to be done.
  `pack-world.mjs` numbers each lesson and level within its chapter and its
  kind into `course.json`'s `numbers`, and the map, the headings and the
  start card say *Lesson 3*, *Practice 4*, *Fix 1* (`kinds.<kind>`), so
  that no text carries a number and an item can move without renumbering
  by hand. Stories are not numbered.
- **D57 — Stars say how well, and why.** Decided 2026-10-22 by the owner's
  UAT (sprint-10.md), built the same day. A win earns three stars and
  loses one for each of: a hint shown in the level; the winning run
  bumping into a wall, a door or a hole; and a bonus goal unmet, or, in a
  level with no bonus goal, a run before the winning one in the same visit
  to the level (the progress also counts every run, `runs`). A win is one
  star at least. `app/src/ui/stars.ts` judges, and the win card lists the
  three reasons, kept or lost (`stars.<reason>`), so that the child knows
  what to try again for. A level played again never loses: the progress
  keeps the most stars, and the win card shows them, with a line that says
  they are kept, when this run earned fewer.
- **D60 — A lesson may teach a concept, which the notebook follows.**
  Decided 2026-10-22 by the owner's UAT (sprint-10.md), built the same
  day. `teaches` in `lesson.json` may name a concept beside the API's
  names: `concept:arguments`, `concept:comments`, `concept:print`,
  `concept:strings`, `concept:len`, `concept:def`, `concept:def_arguments`.
  `pack-world.mjs` writes the concepts known at each level into
  `course.json`'s `concepts`, and the page gives them to the level as
  `concepts`. The notebook says Python's own words once taught, `len`, `def`
  and a `def`'s arguments, each with its example, after the objects
  (`notebook_python.<word>`). `api.table()` gives an action that can go without
  its argument a `simple` example (`wizard.move_right()`), with its words
  in `notebook_simple.<role>.<member>`; the notebook and the completion
  show the simple ones until `arguments` is known. A level outside the
  course is shown as one that knows every concept.
- **D58 — The wizard picks up what is on its tile or beside it, and may
  say which.** Decided 2026-10-22 by the owner's UAT (sprint-10.md), built
  the same day. `wizard.pick_up()` takes the thing on the wizard's tile,
  else the one thing on the four tiles beside it, but for one up on a
  shelf or a bookcase, which only `fendra` brings down (D129); with
  several in reach and none underfoot it is refused with `which_one`, whose
  thought names them and shows how to say which. `wizard.pick_up(thing)`
  takes that thing when it is in reach, and is refused with `far` when it
  is not; a word in quotes is not a thing, and is explained as an argument
  of the wrong kind. A thing hidden under a bookcase (D85), or on a stone
  or a pile of books, lies within reach of the tile beside it. The start
  card opens over the
  notebook and says *Continue* when the child opens it again with *?*; a
  password door opens in the second half of its tick, once the word is
  said.
- **D61 — The game opens in the story.** Decided 2026-10-22 by the owner's
  UAT (sprint-10.md), built the same day. The game begins with
  `story:the-letter`, the game's opening (`story.json` has `opening: true`,
  and it is in no chapter): the letter of admission, the journey, the shut
  gate at dusk, and no mechanics. A first visit, with no wizard, no saved game
  and no address, opens on the welcome page (D193), whose *Start playing*
  begins it. Its *Go on* leads
  to the creator, or, once a wizard exists, to the course's first item; it
  is never the place *Continue* returns to. The start screen's big button
  begins the story while there is no wizard, and *New game* begins it
  again for a new wizard, keeping the language and the settings (D64,
  D70). The
  creator shows the looks of the gender chosen, four each (`looksFor`),
  none before a gender is; its name starts as *Kydux*, chosen whole on
  entering the field so that typing replaces it; a name that is the
  story's, a level's thing or actor, a spell, a password or one of the
  world's roles is refused (`tools/reserved_names.py`, written as
  `reserved.json` by `pack-world.mjs`, held to the content by a test).
- **D59 — Easy word and technical word together, then the technical.**
  Decided 2026-10-22 by the owner's UAT (sprint-10.md), built the same day.
  Each idea has the child's word and the proper one: an action, which
  programmers call a method; any character or thing in a program, an
  object; a note, a comment; how much, the number in the brackets, an
  argument; words in quotes, a string; a name for a value, a variable;
  what a thing knows, an attribute; a question, an expression. The
  chapter that introduces an idea uses both, side by side; the chapters
  after it use the proper word alone. Gemini's rules (`tools/write/rules.md`)
  and each chapter's brief carry the pairs; D27 keeps the proper words.
- **D62 — Every level closes, and a chapter opens and closes.** Decided
  2026-10-22 by the owner's UAT (sprint-10.md), built the same day. A
  level's text has `outro`, said by its speaker on the win card, and
  `learned`, one sentence of what the child now knows, shown under the
  stars; a chapter's last level has no `learned`, since the chapter's
  closing story sums the chapter up. A chapter opens and closes with a
  story (D74). The content tests hold a chapter to this when it opens with a
  story, which is how a chapter rewritten in the shape of the UAT is
  told from one not yet rewritten; the same chapters are held to D60's
  concepts. An improve level asks for a clean run with the goal `no_bumps`,
  failed at the first bump.
- **D63 — A level starts with its own program, never with a lesson's
  example.** Decided 2026-10-22 by the owner's UAT (sprint-11.md). A lesson's
  Try it is an example on its last page; the level after it opens with the
  `starting_code` of its own text, which is empty, comments that say what
  to do, or, in a fix or improve level, the program to work on. A practice
  never gives part of its solution as code: what the child has to do is
  said in comments. Rules out the example copied into the editor, which
  left a fix level with half a program and a practice half done.
- **D64 — Starting again forgets the wizard.** Decided 2026-10-22 by the
  owner's UAT (sprint-11.md). A game begun again begins with no wizard:
  *New game* (D70) opens the story from the letter to the creator, and the
  new wizard is made there. The language and the settings are kept, since
  they are the machine's, not the game's.
- **D65 — A chapter's levels are parts of one scene.** Decided 2026-10-22 by
  the owner's UAT (sprint-11.md), built the same day. A scene is
  `content/scenes/<id>/map.txt`, rows of `#`, `.` and `=` with no markers.
  A level names its scene in `level.json` (`scene`) and puts what is its
  own on it by coordinates: `start`, `end` (the tile of the `E` its reach
  goal wants, when it has one) and `at` for every thing and actor; it has
  no `map`. `Level.from_directory` builds the level's map from the scene
  (`kydux_world.level.on_scene`), so that the world, the goals, the
  solutions and the wrong answers work as for any level; `Level.from_dict`
  refuses a level that still names its scene. `tools/scene_maps.py` gives
  each such level with its map built in, and `pack-world.mjs` ships it so,
  so that the page loads it as any other. Where one level ends the next
  begins, on the same tile, and what an earlier level opened or took stays
  as the story has it: a door opened is a door `open` from the start, a
  thing picked up is `carrying`; the content tests hold each level on a
  scene to start where the one before it on the same scene ended. A
  fix or an improve level that plays the level before it again from its
  start, the program just repaired given to do more (*Eldra's door* after
  *The moving key*, the owner, 2026-11-01), or one more program for the same
  room (*The wrong door* after *Left or right*), begins where that level
  began. The scenes of each chapter are in the course (`docs/dev/course.md`);
  chapter 3's are seven small ones (D136). Rules out one map per level,
  which showed the same gate nine times from nine angles.
- **D66 — A friend stands in the scene.** Decided 2026-10-22 by the owner's
  UAT (sprint-11.md), built the same day. The actor kind `friend` stands
  where the level puts it, looks at the wizard's start unless it says
  otherwise, never moves and never catches. A step onto a friend is a bump,
  `by: friend` with the friend's `id`, and the wizard thinks who is in the
  way; the content tests keep a friend off the solution's way. The child's
  code has nothing of a friend: a friend teaches by words, so the API's
  table gives the role no members. Nuri is the friend of chapters 1 and 3,
  Wenna of chapter 2; each is drawn as the character (`friendFigure` in
  `placeholders.ts`), Nuri with the wizard's gender. The level's intro and
  outro are the friend's words (D45).
- **D67 — A lesson shows who teaches it.** Decided 2026-10-22 by the
  owner's UAT (sprint-11.md), built the same day. `lesson.json` names its
  `speaker`, a character of `story.md`; the lesson screen draws the
  speaker's figure large beside the words, with the name, and frames the
  words as the speaker's speech. A story is told on its scene instead
  (D74). A content test refuses a lesson that names no teacher. Rules out
  a lesson that looks like a story.
- **D68 — The screen explains itself once, with arrows.** Decided 2026-10-22
  by the owner's UAT (sprint-11.md), built the same day. The course's first
  level opens the screen's guide once its start card is closed, the first
  time it is played (`progress.guided`): `app/src/ui/guide.ts` dims the
  screen but one part at a time, with a card beside it and an arrow to it,
  *Next* and *Skip*: the scene, the goals, the editor, *Run*, the notebook
  (opened for its step), *Hint* and *?*, and the way to learn. The card
  opened with *?* offers *Show me the screen*. The guide's words are
  Gemini's, `content/guide/text.<lang>.json`, and the i18n check holds them
  to the same steps in every language.
- **D69 — The camera: a window on the scene.** Decided 2026-10-22 by the
  owner's UAT (sprint-11.md), built the same day. The scene is drawn whole;
  the canvas takes the frame's size and shape, and at zoom 1 the camera
  fits `VIEW_TILES` (15 by 9, or the whole of a smaller scene) to it, so
  that the frame's other way shows more of the scene, never a band of the
  frame's colour; the camera, bounded by the scene and its painted margin
  (D83), follows the wizard. The player zooms with *+* and *−* over the
  scene or the mouse wheel, through `ZOOMS` (0.5 to 2), never out so far
  that the window would reach past those bounds, and drags the scene to
  look around, which
  lets go of the wizard; a run or a restart brings the camera back to it.
  The scene publishes `data-zoom` and `data-following` for the tests; the
  world's coordinates, which the tests read, do not change with the camera.
- **D70 — Games are saved, several, in the browser.** Decided 2026-10-22 by
  the owner's UAT (sprint-11.md), built the same day. `GamesStore`
  (`app/src/progress/games.ts`) keeps each game's progress document under
  `kydux.game.<id>`, the list under `kydux.games` (begun, last played,
  seconds played) and the game being played under `kydux.current`; a game
  is begun by its first save, and the list shows the games with a wizard.
  Every change saves the game being played; there is no *Save*. The start
  screen offers *Continue*, *Load a game* (each game with its wizard, where
  it is, its play time and dates, *Play* and *Delete*, which asks) and *New
  game*; a first visit with no game opens the welcome page (D193), and with saved games
  and none being played the start screen offers them. An imported file
  becomes one more game; *Export* keeps the game being played. Play time is
  counted every ten seconds a level, a lesson or a story is on screen
  with the tab in sight and the child at the page: a key, a click, a scroll or
  a move of the pointer within the last two minutes; a child who walks away is
  not counted. The single document of before, `kydux.progress`,
  becomes the list's first game the first time the list is read, so the
  document keeps its version: its shape is the same. The online game
  (plan, phase 7) keeps the same list on the server it runs from.
- **D71 — The map opens over the level, and a lesson from it.** Decided
  2026-10-22 by the owner's UAT (sprint-11.md), built the same day. From a
  level, *Map* opens the map over it (the run and the editor kept), the
  stop being played marked *You are here*; *Back to the level* or Escape
  closes it, and choosing another stop while a run goes on asks first. On
  every map, the locked stops after the first are unnamed: their kind and
  number show, not their title. A level's heading has *Lesson*, the last
  lesson before it in the course, at `#lesson/<id>/from/<level>`, which
  ends in *Back to the level* in place of *Try it* and leaves the place in
  the course as it was. Rules out the map as a screen the player leaves
  the level for.
- **D72 — Where the game's pieces come from.** Decided 2026-10-23 by the
  trials of sprint 12 (12.1) and the owner's choice after them. The game's
  look is the owner's style B: painted cartoon art with bold outlines and
  warm light, in a three-quarter top-down view (the ground seen from above,
  every upright thing showing its top and its front), drawn by Gemini 3 Pro
  Image (`tools/art/generate.py`). A scene is painted in one picture (D76),
  not built from pieces; the characters are Gemini's style-B walking sheets,
  PixelLab's four-direction sprites the second choice. The trials, each
  drawing chapter 1's garden at the gate into `art/raw/` and judged on a
  contact sheet (`tools/art/trials/contact.py`):

  | Route | What it gave | Cost |
  | --- | --- | --- |
  | Gemini, pieces that join (walls, paths) | Pieces in no order, joins that seldom match | Cents an image |
  | Art as code (`tools/art/trials/draw.py`) | Perfect joins, plain | Free |
  | Retro Diffusion and PixelLab corner sets | Perfect joins, a flat pixel look | A trial's credits |
  | Open tilesets (LPC, 16x16 Town Remix, Outdoors) | Free and joined, flatter, of mixed families, lacking the story's own things | Free |
  | Kenney's isometric packs (CC0) | A rich look; moves that run on diagonals, near walls hiding the wizard | Free |
  | Gemini, a style frame of the whole scene | The look the owner wants, not on a grid | About 10 cents |
  | Gemini, the whole scene painted from requirements, the map read from it | The look of the frame, on a grid that can be marked | About 10 cents a picture, an edit per thing that changes |

  The music is the game's own, written as notes and played by the page
  (D192); the effects are made as the game plays (`app/src/engine/
  sfx.ts`), and the settings mute them. Rules out scenes built from tiles
  for the levels, and the isometric view for the levels: it may serve the
  course's map.
- **D73 — A scene has terrains, fixed things and rooms.** Decided
  2026-10-23 (sprint 12, 12.2). A scene is a directory `content/scenes/
  <id>/` with `map.txt`, a grid of letters, and `scene.json`, which says
  what each letter is (`terrains`: its `kind`, whether it is walked on and
  whether sight passes it), the scene's fixed things (`things`, by id, with
  their kind and tile) and props, and its rooms (`rooms`, a rectangle each,
  by id). A level on the scene gives only the state of a fixed thing it
  cares about (`{"id": "gate", "open": true}`) and may add things of its
  own; `dark` names the rooms dark at the start, and `kirra` lights the
  room the wizard is in. Rules out one letter per terrain fixed in the
  code, and things declared again in every level.
- **D74 — The story is told on the scene.** Decided 2026-10-23 (sprint 12,
  12.3). A story is a script played on its scene in story mode: the scene
  drawn wide, no editor and no goals; a sequence of steps, each a line said
  by a character in a bubble over them or by the voice in a band under the
  scene, with its actions before it (D103: a walk through a tile or a list
  of them, each leg straight, ending out of sight when it says so, a turn,
  an appearing, a vanishing once the words are said, lying down in a bed
  and getting up, D91, a door opened or closed), each done by its own
  `by`, the step's `by`, or the speaker, so that the voice can tell what
  others do; different figures' actions play at once.
  The camera starts on the story's tile and follows whoever each step is
  about (who speaks, walks, appears or turns, the step's `by`) through a
  window: a dead
  zone the size of the view less that figure, its bubble and a margin.
  While they are inside, the camera stays still; when the figure pushes
  past an edge, it glides just far enough to keep them in, as a game's
  camera does. It never jumps, not even when *Next* or *Back* replays a
  step at once. A figure's words are in a speech bubble with its tail on
  them. `story.json` holds the
  staging, checked against the scene by
  `kydux_world.level.story_on_scene`, and `text.<lang>.json` the title and
  one text a step; *Next*, Enter and Space go on, *Back* replays the step
  before, *Go on* ends it. The game's opening tells the letter in the past,
  at the gate, before the creator. Rules out the story told as pages of a
  book.
- **D75 — Every run starts the level again, and says so.** Decided
  2026-10-23 (sprint 12, 12.5). *Run* and *Restart* fade the scene out,
  put everything back, show a spinner, quickly, and fade it in; a run
  plays once that and Python are both done. The child sees that a run
  never goes on from the one before, and that a level played in ways is
  dealt again each time.
- **D76 — A scene is painted first, and its map read from the painting.**
  Decided 2026-10-23 by the owner. Gemini paints a chapter's whole scene
  from plain requirements (what the levels need: "two paths, one with a
  door", "the wand on a stone a step off the path"), in style B, at dusk,
  with nothing on a diagonal and a faint grid of square cells; the cells
  are marked from the picture (`tools/art/map_from_image.py`) into the
  scene's map, and the levels are placed on it, which is easier than
  painting a picture to fit a map. `tools/art/export_scene.py` makes
  `content/art/scenes/<scene>/`: the ground, with what opens or is picked
  up taken out by edits of the painting without it; the raised things cut
  out by the row their foot stands on, never reaching below that row, cut
  by the scene's own map; and each changing thing in its states. What a
  row draws in front of a figure hangs from its foot (a crown, a rock, a
  wall's top), never a shadow, a flower or lawn, and a crown is whole,
  with its sunlit leaves; `tools/art/sweep.py`, run by the export's
  `check`, stands the wizard on every cell walked on and fails when a cut
  breaks either. A cell under only a crown is walked on, the figure
  behind it, and where something painted covers more than a quarter of
  the wizard (`cover.ts` counts it), the page draws a thin yellow line of
  the wizard's outline over it, only there, beating until it fades and coming back (still for a
  reader who asks for less motion), so that the child never loses the
  wizard (`silhouette.ts`, the owner's choice). The page draws the ground, the rows
  and the figures sorted by their feet, so that a thing covers who stands
  behind it and is covered by who stands in front, and a pencil grid that
  breathes over the ground for counting steps; a scene without art is
  drawn with placeholders. The figures are `content/art/figures/`, four
  ways of three walking frames each. A door may be both sealed and keyed
  by a word, as the castle's is: it hears no word while its seal holds,
  so the spell comes first and the word after, and the door opens to the
  word. Rules out building a scene's look from its map, and a word that
  counts before the seal is broken.
- **D77 — Two friends, and the one who teaches is of the other gender.**
  Decided 2026-10-24 by the owner (sprint 13, 13.1). The story has two
  first-year friends: Nuri, a girl, and Teku, a boy. The friend who meets
  the wizard at the gate and teaches chapters 1 and 3 is the one of the
  other gender: Nuri for a boy wizard, Teku for a girl wizard; the other,
  of the wizard's gender, is the wizard's dormitory mate in chapters 2
  and 3. A text names the friend as `{friend}`, and writes the friend's
  gendered words as a double-braced choice, `{{boy's words|girl's
  words}}`, resolved by the friend's gender before the wizard's single
  braces (D37); in Spanish, the words for the two of them together are
  masculine. In `level.json`, `lesson.json` and `story.json` the friend is
  the actor and the speaker `friend`; the page resolves the figure and the
  name from the wizard's gender. Rules out a friend of the wizard's own
  gender as the teacher, and a friend's name fixed in a text.
- **D78 — The opening belongs to chapter 1, and stories are numbered.**
  Decided 2026-10-24 (sprint 13, 13.1). `story:the-letter` is chapter 1's
  first item, named by `course.json`'s `opening`, and is done once a
  wizard exists; the creator follows it, and *Continue* never goes back to
  it. Every item's label carries its chapter and its number by kind,
  stories too: *Chapter 1 · Story 1*, *Chapter 1 · Practice 4*. Rules out
  an unnumbered story before the course.
- **D79 — What stands on a cell is marked, and no painting hides a mark.**
  Decided 2026-10-24 (sprint 13, 13.3). Every cell a tree's trunk, a rock,
  a fence or a stone of the painting stands on is in the scene's map as
  not walked on; the flat stone is `o`, seen over, and the wand on it is
  picked up from beside. A level's start, end, things and friend lie on
  cells no cut-out covers, and nothing painted stands on a cell walked on;
  `tests/project/test_art_content.py` holds every painted scene and its
  levels to both, reading the scene's art. The page draws the goal's mark
  as a ring that beats in size, alpha and colour, lying on the ground under
  the cut-outs and the figures, a shut door's too, its ring seen over what
  covers it (D160). Over each sealed
  door, while its seal holds, a glowing rune: its sign drawn by the page
  unless the painting draws one (`rune` in `art.json`); both are still for
  a reader who asks for less motion. A painting is asked for things that
  fit one cell where they can, and paths along the rows and columns.
  Rules out a mark under a crown or an arch, and a cell walked through a
  tree.
- **D80 — The notebook has the spells and the words.** Decided 2026-10-24
  (sprint 13, 13.5). A level's `level.json` names the spells it has
  (`spells`, D42) and the passwords it gives (`words`, each the password
  of one of its doors); the course packs every spell and word known on
  reaching each level (`spells_known`, `words_known` in `course.json`).
  The page gives the world the spells known, as it gives the API (D40),
  and the notebook the words known, which the world does not take: it
  holds a level's own words to its own doors. Once there is one, the
  notebook has a second tab, *Spells and words*: each in italics with what
  it does or opens, from i18n (`spells.<name>`, `words.<name>`, held by
  the i18n check to the world's spells and the levels' words), and an
  example to click. Rules out a child having to remember a spell's or a
  word's spelling from a lesson pages back.
- **D81 — What a spell does is seen.** Decided 2026-10-24 by the owner
  (sprint 13, 13.9). The wizard's sheet has four casting rows after its
  four walking ones, the same ways in the same order: the wand raised,
  pointed with its light, and lowered, played when the wizard casts,
  over more than the tick so that the wand is seen out, while a point of
  light leaves its tip and bursts a tile ahead. A
  sealed door's glow breaks into sparks and a flare as its seal goes. A
  door seen opening passes from one painted state to the next, each
  fading into the next, through a half-open state (`ajar`) where the
  painting has one: the gate. The castle's door opens onto its hall, lit
  by torches inside. The casting frames are Gemini's edits of the two
  wizard bases, recoloured for every look like the walking rows; the
  half-open state and the lit hall are edits of the painting, cut as the
  other states are. The wizard's acts are seen the same way: it bends the
  way it faces to take what it picks up, both hands at the ground in front
  of its feet, the thing fading as they reach it, and it celebrates a run
  won, facing the viewer, its arms up and a small jump, before the win
  card, which waits for it (`celebrate`); from Gemini's edits, the row
  seen from behind lowered from the standing frame, rows named in
  `figures.json`, still for a reader who asks for less motion. A tick in
  which the wizard casts or picks up plays 1.6 times as long as another
  (`LONG` in `playback.ts`), so that what its hands do is seen through
  before its next step. Rules out a spell seen only as a ring of
  light, and a door that changes in one frame.
- **D82 — A scene's settings live beside its art, and the tools take the
  scene's id.** Decided 2026-10-24 (sprint 14, 14.1). Everything the cut
  and the export need of a scene that is its own, not the method's, is one
  file in the repository, `art/scenes/<scene>/cut.json`: where its pictures
  are in `art/raw/` (the painting without its grid, its grid, the
  ground-only edit, an edit for each thing that opens or is picked up),
  the things with their boxes, rows, states, `solid`, `hull`, `reach`,
  `largest`, `whole_box` and `rune`, the rows of the walls' tops (`cuts`),
  the row above which the painting is ground (`castle`), the patches of
  its ground, the colours it is read by (`thresholds`: the lawn's and the
  path's, an outline's darkness, the leaves' green, a shadow's), and its
  SOURCE.md. The field's values are the defaults in
  `tools/art/image_first.py`, so that a setting left out is the field's.
  `tools/art/scene_settings.py` reads it; `export_scene.py <scene>` and
  `sweep.py <scene>` take the scene's id, and the art tests run over
  every scene that has settings and is exported. Rules out a scene cut by
  editing the tools.
- **D83 — A scene is painted with a margin.** Decided 2026-10-24 by the
  owner (sprint 14, 14.2). The painting goes on beyond the playable area,
  three cells on each side and two above and below on the field, with
  what no one enters (the castle going up, woods and rocks at the sides,
  trees and a fence at the bottom), so that the camera zoomed out, or a
  frame of another shape, shows painting to its edges. The world's map
  and every level's and story's coordinates are those of the playable
  area: the margin is the art's alone. `tools/art/margin.py` makes it: a
  canvas with the painting in the middle and its edge stretched and
  blurred round it, which Gemini paints the border of; then the model's
  picture laid on the canvas by the least difference, the seam measured
  cell by cell along the edge, and the scene's own painting kept inside,
  pixel for pixel, joined to the border by a short fade. The seam does not
  show: the painting's few outermost pixels are left out, since a model's
  painting often has a dark line along its edge, and the cut-outs fade out
  before them; and the border's colours are brought to the painting's
  along the edge, by how far the model's own copy of the inside drifted
  from the painting there. The margin is a little in shadow outward, as a
  game shows what cannot be entered. Nothing of the margin rises into the
  playable area, so the margin is ground, drawn under everything and
  never cut: `ground.webp` holds it, `art.json` says
  its cells (`margin`, left, top, right, bottom) and the playable
  corner's place in the ground (`origin`), and the page draws the ground
  there and bounds the camera over it. The debug view numbers the
  margin's cells below zero and crosses them out. A border whose seam the
  tool says is bad is asked for again with what the edge cuts named in
  the prompt, or sketched into the canvas for the model to keep. Rules
  out a map grown to hold the margin, which would move every coordinate,
  and the model's copy of the inside, which the cut and the edits do not
  line up with.

- **D84 — The castle's entrance hall and the first-year dormitory are
  scenes, and a scene may forbid the wizard a tile (D171: where the tale stops the child).** Decided 2026-10-26
  (sprint 15). `the-entrance` holds a story and no level, and nothing in
  it is cut: no one stands behind anything tall. `the-dormitory` holds a
  level and two stories: a common room between the girls' dormitory on
  the left and the boys' on the right; the wizard's is always the
  right-hand one, whoever the wizard is, and the scene names the other
  arch's tiles in `scene.json`'s `forbidden`, with the reason the wizard
  is told (`not_my_dormitory`, worded by the wizard's gender), which a
  level on the scene carries, beside any it forbids of its own (D205): the
  wizard's step is refused and turned that way, and anyone else passes. A bed is a thing, `free` or not, drawn
  by the painting and never by the page; `wizard.sleep()` beside a free bed
  walks to the floor under its pillow and lies down in it (D130); a goal
  `sleep` names the bed. The dormitory
  mate, the friend of the wizard's own gender, is the actor `mate`, drawn
  and named as Nuri or Teku by the wizard's gender, and a text writes
  `{mate}`. Rules out mirroring the painting by gender: what changes is who
  stands where and what the arch says.
- **D85 — A thing is drawn where the level lays it, and may be hidden and
  revealed.** Decided 2026-10-26 (sprint 15). `art.json` gives each
  painted thing the cell it is painted on (`at`), and the page draws it on
  the level's tile, in that cell's middle (D109) and among the rows by its
  new foot; a level's thing may name the painted thing it is drawn from
  (`art`), so that each level calls its door `door` and its key `key`.
  fendra's pull moves a painted thing the same way. A thing the wizard
  carries may be `hidden`, lying under a cut-out on purpose, which the
  content test allows; the world treats it as any thing, `find_nearest`
  finds it, and `thing.reveal()` makes it glow, its whole shape over
  whatever covers it (D107, `silhouette.ts`), so that it is found among
  things like it too, a book among books.
  Rules out a second painting of a key in each place, and a world where
  what is hidden is absent.
- **D86 — `distance_to` is the steps between two of the child's objects.**
  Decided 2026-10-26 (sprint 15). Along the rows and the columns, an
  integer; on the wizard, a thing and an actor, a carried thing being
  where the wizard is, one given where its actor is, one in the dark
  unknown (None). It asks, so it takes no tick. It is the number a
  variable keeps when the program cannot know it (*How a level earns its
  idea*, course.md): the key of `the-moving-key` lies at another distance
  in each of its four ways (D51). Rules out a float distance, which a
  child cannot walk.
- **D87 — The story has a hook.** Decided 2026-10-26 by the owner (sprint
  15). The story bible's *The wizard's way* runs a thread from chapter 3 to
  the end: in the night passages the children overhear that the brooms of
  the next day's flying lesson have been tampered with; in chapter 4 they
  stop the accident; in chapter 5 the familiar finds the proof that the
  one behind it is Korvel, who long ago wrote the castle's enchantments
  and vanished, and whom everyone believes gone. He is felt, never seen,
  and the children are never in danger (*The tone*). Chapters 3 to 5 keep
  their lessons; their levels are rewoven round the hook chapter by
  chapter, before each is painted.
- **D88 — A chosen painting is mended, never repainted.** Decided
  2026-10-26 by the owner (sprint 15): once a scene's painting is chosen it
  does not change unless it must. A fix is a few boxes of it, and the
  canvas's grown band when it must go on, that a model paints again on a
  canvas where they are blurred, given a crop large enough that it cannot
  paint over what is kept; `tools/art/repaint.py` lays the model's picture
  on the crop by the least difference over what is kept and takes the
  boxes from it, faded into the painting over a few pixels round each, the
  painting itself elsewhere. A named section (`--section`) mends one set of
  boxes; `also` mends the scene's other pictures, the ground-only edit and
  the marked picture, with the same boxes; `plain` keeps the canvas
  unblurred; `fill` mends a thin strip with no model. Settings in
  `cut.json`'s `repaint`. Rules out an edit of the whole picture to fix its
  edge: an edit paints the whole picture again and moves what it is to
  keep.
- **D89 — Indoors, what a figure passes under or behind is cut as a static
  thing, where Gemini marks it.** Decided 2026-10-26 by the owner, from
  the check sheets of sprint 15, and on 2026-10-27 how it is marked. A
  raised part of an indoor painting that never changes (an arch, a wall, a
  bed, an armchair, a counter, a bookcase, a lamp) is a static thing in
  `cut.json`: `"static": true`, its box and the row it stands on, and its
  mask. Gemini is given crops of the chosen painting and asked to turn only
  the named things flat magenta and to redraw nothing, one try a crop or
  several; `tools/art/repaint.py <scene> marks` lays each try on the
  painting, whole and then part by part, and with several a pixel is
  magenta where most tries agree. The thing is its magenta whole with the painting's outline beside
  it (`"marked"`), a box less the magenta for a wall cut round its openings
  (`"unmarked"`), or a polygon in cells for a wall (`"polygon"`); the
  whole box (`"box"`) serves a thing of a simple shape, the seal gate's
  keystone; the stone's pale colour (`"pale"`) is a kind the tools keep
  and no scene uses. The static things of a row are an
  image of their own, `row-<r>-static`, drawn at the row's depth, or as
  D95 says. What no figure stands beside or behind stays ground, its cells
  not walked on. The sweep's `all-<scene>.png`, the wizard on every
  walked-on cell, is the proof. Rules out an indoor scene cut by colour,
  and a Gemini edit without the things, whose repainting moves what it
  is to keep.
- **D90 — A friend never wears the wizard's colours, nor the other
  friend's.** Decided 2026-10-26 by the owner. Nuri and Teku each have two
  sets of colours, robe, hat and band (`FRIEND_SETS` in `looks.ts`): Nuri
  green or burgundy, Teku orange or navy. For a look, `friendSets` takes,
  of the four pairings, the one whose three robes, the wizard's and the
  two friends', stand farthest apart as seen (CIELAB's ΔE), the closest
  two counting; it depends on the look alone, so a friend wears the same
  colours all the game. `tools/art/figures.py` draws a sheet a set,
  `<friend>-a` and `<friend>-b`, and `figureName` picks it. Rules out a
  single colour a friend, which with eight looks always meets one of them,
  and a rule by hue: no saturated colour is far in hue from all eight.
- **D91 — A pupil asleep lies in the bed, under its covers.** Decided
  2026-10-26 by the owner, for the wizard and the friends alike. Every
  wizard sheet has a lying row (13) and each friend's sheet one (4, named
  in figures.json's `sheets`), made from Gemini's edits of the boy's, the
  girl's and each friend's standing frame. A scene's beds are its fixed
  things; `cut.json` gives each bed its cover, a static thing (D97), and
  its pillow's point, which art.json's `beds` carry with the pillow's side
  and the cover's row. The page draws a sleeper's lying frame turned along
  the bed, the head on the pillow, between the bed's frame and its cover,
  so that the cover lies over the body; while the wizard lies under it, its
  outline is off. The wizard lies down by `wizard.sleep()`; an actor of a level or a
  story starts `asleep` in a bed beside its tile, or, in a story, its tile
  the bed's `pillow_side`, where it gets up (D130) (the world takes the bed,
  not free, and lays the sleeper on the bed's own tile, in no one's way),
  and a story's step lays a figure down or gets it up (`{"sleep":
  "bed_1"}`, `{"wake": true}`). Rules out the standing figure turned on top
  of the bed, and a sleeper only the wizard; a scene without a bed's place, or a sheet without a lying row,
  keeps that turned figure.
- **D92 — A painted scene is painted on at its sides when the view would
  run out of it, and the view never reaches past it.** Decided 2026-10-26
  by the owner, as for the field (D83). The library, fifteen cells wide,
  has three cells on each side, castle walls above and grass and trees
  beyond them, painted by Gemini on `tools/art/margin.py`'s canvas and
  joined by it (where the model's picture falls short of the canvas's
  edge, its outermost pixels are stretched out). On a painted scene the
  camera's zoom at its first step goes no lower than the painting and its
  margin fill the canvas, so a window wider than the scene zooms in;
  `data-view` and `data-bounds` say the window and the scene in tiles.
  Rules out a band of the frame's colour beside a story.
- **D93 — A cut-out ends at the outer edge of its thing's outline.**
  Decided 2026-10-27 by the owner, from the field's check sheet. Every
  raised thing in Kydux's art is drawn with a dark outline all round; the
  outline is of the thing, and nothing of the ground beyond it is. Every
  mask the export makes, but a box's and one its thing says not to
  (`snap: false`, a thing set among others whose lines the snap runs into),
  is moved onto the outline (`image_first.snapped`): what of it the ground
  beyond reaches without crossing an outline goes back to the ground,
  where the painting is as its picture without the thing when it has one,
  and the outline just beyond it comes in; a mask drawn inside its
  outline, Gemini's magenta (D89), has the outline added and nothing taken
  away (`image_first.rimmed`), or, for a thing with another's line just
  beside it (a quilt, a counter before its wands), only its own line
  (`image_first.lined`). A part of a polygon with no outline between it
  and what lies beyond, a stone's sunlit top, is the polygon's as drawn
  (`fixed`), and a static thing gives up to a door or a thing picked up
  exactly that thing's cut-out, so that nothing between them shows a
  figure behind. The alpha is the mask itself, softened only
  by the bringing down to the page's size, and faded out over a few pixels
  before a scene's margin. The sweep checks it on every
  cut-out a figure may stand behind, reading the outlines at the painting's
  own size: `fringe`, the ground beyond the outline in the mask; `bare`, the
  painting's black line beside the mask left out. A scene whose outlines
  are not black gives their darkness (`thresholds`, `outline`). Rules out a
  mask's edge set by a colour threshold, which takes grass with a tree and
  leaves outlines on the ground.
- **D94 — A thing is one thing, on the row of its foot.** Decided
  2026-10-27 by the owner. A thing cut across a row's edge has the figure
  standing inside it, behind one part and in front of the other; the sweep
  reports it (`spill`, by the cell the figure stands on), and the scene's
  settings mend it where the painting asks: `rows`, a part (`area`) whose things
  stand on a row (`row`); `grounds`, a part given back to the ground (a lawn cut
  with a tree, a doorway the cut took); `kept`, a part kept whatever the
  ground beside it, which the sweep does not look at; `whole`, a part whose
  things' holes are filled; each a box or a polygon in cells. A `kept` part
  is one the sweep flags and the eye finds right, a light stone top with no
  line on it, and the commit names it. Rules out a figure over a rock's
  base and behind its top.
- **D95 — Shut doors and arches are over whoever stands in them; a wall
  seen from above is over everyone; a counter hides half of who stands
  behind it.** Decided 2026-10-27 by the owner, and for open doors on
  2026-10-28. A thing or a static thing marked `under` (a door, its arch)
  is drawn at nine tenths of its cell, over the figure standing on its row
  and under the next row (`depth.ts`); a door's cell is walked on only
  while it is open, and then what is seen through it is drawn under the
  figure in the doorway and its arch over them, so that the figure stands
  in the doorway (`thingDepth`); a static
  thing marked `over` (a wall between rooms, a front wall) over every
  figure of the scene, the wizard's outline showing through it; one marked
  `hangs` (a torch) as its row's, standing on no cell; one that hangs
  above every head (a chandelier) is `over`, as a wall seen from above is
  (the owner, 2026-10-31). A scene's `lowered`
  cells draw a figure lower by a part of a cell, at the depth its feet are
  drawn at, so that a counter on the row below hides its legs: Baro behind
  the wand bank's. Rules out the wizard over the door it walks through and
  Baro standing on his counter, and a figure hidden behind the doorway it
  stands in.
- **D96 — There are three first-years, and each sleeps in the dormitory
  of their gender.** Decided 2026-10-27 by the owner. The first-years are
  the wizard, the friend of the other gender and the mate of the same
  gender; no other pupil is seen. At the first night's end the friend goes
  into the other dormitory and lies down, and the mate, waiting by the
  wizard's arch, goes into the wizard's dormitory and lies down in `bed_1`;
  then the wizard goes to bed (*Your bed*), and the morning wakes the mate.
  Rules out pupils no one knows in the wizard's room.
- **D97 — A sleeper lies under the sheet, head on the pillow.** Decided
  2026-10-27 by the owner. A bed is painted with a quilt and a white sheet
  folded over it at the pillow's end. Its cover, the static thing drawn
  over the sleeper (`cover`), is the quilt and the sheet together, from the
  sheet's dark line by the pillow to the foot, marked in magenta with the
  pillow left out. Its mask takes only the outline its magenta touches
  (`image_first.lined`), so that the sheet's line stays seen over the
  sleeper, and the pillow, its outline and the strip of bed beside the
  sheet stay under the head. The head's point is the pillow's middle, as
  far from the sheet's line in every bed, so that the face lies whole on
  the pillow and the shoulders show over the sheet. A sleeper lies just over the bed's frame
  and its cover just over the sleeper, all under a figure standing on the
  bed's row. Rules out a sleeper between the sheet and the quilt.
- **D98 — Every figure walks through every door with room to spare.**
  Decided 2026-10-27 by the owner, and the grown-ups' height on 2026-10-28.
  Every figure is drawn at 0.82 of the height it is cut at, and a grown-up
  (Wenna, Ilda, Dask, Baro) at 0.9 of that, since a grown-up wears no hat:
  a child stands at most 1.15 cells tall, a grown-up at most 1.31 and
  taller than every pupil who walks; Eldra, a pupil's ghost, is a child's
  size. Every door a figure walks through leaves a tenth of a cell over the
  tallest figure that does (`opening` in the scene's settings, measured on
  the painting, `adults` where a grown-up walks through); a test asserts
  it. Rules out a hat over the arch it is passing under, and grown-ups who
  stand a head too tall beside the pupils.
- **D99 — A scene is painted for the cut.** Decided 2026-10-27 by the
  owner, and written as rules in
  `art/README.md` ("What a scene is painted for"): open floors, doorways in
  walls seen from the front, shelves in one row against a wall, nothing
  hanging from a ceiling not shown, no one painted in, outlines closed and
  black, bases in their own cells, things apart, every thing marked in
  magenta when the painting is chosen, and figures that fit. Rules out
  furniture a figure walks beside, slits in walls seen from above and
  double rows of shelves, each a cut-out to make and to mend.
- **D100 — A figure going into a dark passage goes dark.** Decided
  2026-10-28 by the owner. A scene's settings name its dark passages
  (`dark`: the columns each spans, the row a figure's feet are on where
  its dark begins and where it is darkest, and how dark it is there); a
  figure walking in is drawn darker the deeper it goes, its head half as
  dark again as its feet, until it is hardly seen (`shade.ts`, a tint
  from the figure's top to its feet). The entrance's three arches are
  such passages, the middle one deeper. Rules out a figure as lit in a
  dark corridor as in the hall.
- **D101 — An open door is seen open; one whose picture goes wrong
  swings out of sight.** Decided 2026-10-28 by the owner. An open door is
  drawn as its edit shows it, its leaves seen: it looks better so. Where
  that picture goes wrong, a leaf covering part of the doorway, the closed
  door's planks left under it, half a leaf before a round doorway, a door
  in a wall seen from the front with room behind it swings out against the
  wall beside its doorway instead (D111): open, its whole doorway, from the
  arch to the threshold,
  shows the floor of the room beyond (`doorways` in the scene's settings,
  `repaint.py doorways`, the floor taken from the painting itself, D108),
  as the library's three doors and the dormitory's; and a doorway always
  open has
  no door at all, as the entrance's side arches, whose doors a repaint
  section marked `opened` takes out, flooding the doorway's dark into the
  marked picture as magenta. Rules out a door drawn
  open wrong because its edit is.
- **D102 — A scene's grid is laid out before the scene is painted.**
  Decided 2026-10-28 by the owner. The map comes first: the rooms, the
  walls, the doorways, the furniture and every strip a figure walks are
  drawn on the grid before any prompt is written, with every wall on a
  cell line, every doorway whole cells wide, every walked strip at least
  a cell wide and in the middle of its cells, every thing in whole cells,
  and no slanting perspective that takes a wall from one column into the
  next. The layout, drawn from the map by `tools/art/layout.py`, is the
  first picture of the painting's prompt, and a try is chosen only when
  its walls, doorways and furniture lie in the layout's cells, checked
  with `layout.py --over` before any cut is made; a try that is off is
  asked for again, not mended. Chapter 2's scenes, painted before this,
  are fitted to their grids by `nudged` cells (D105) and mends; chapter
  3's passages and night passages keep to it. Rules out a painting chosen
  for its look and fitted to the grid afterwards, which cost three
  sprints in chapter 2.
- **D103 — A story step can do several things, and a figure can open and
  close a door.** Decided 2026-10-28 by the owner. A step's `do` is one
  action or a list, each done by its `by`, the step's `by`, or the
  speaker. One figure's actions play one after another, in the list's
  order; different figures' play at once, tick by tick, in the order they
  are first named, so that two friends walk together. A `walk` is a tile
  or a list of tiles, each reached in a straight line; a walk may end in
  `vanish`, for a figure walking out of sight. `open` and `close` name a
  door of the story beside the figure, which changes state as a level's
  door does. The camera keeps with the step's `by`, or its speaker: the
  others' events say `aside`, and a teacher walking away down a corridor
  is not followed when the step is the wizard's. The staging check plays
  the actions tick by tick as the page does. Rules out a story that walks
  one figure at a time, and a teacher who vanishes before a shut door.
- **D104 — A doorway is where the painting has it, and the walked cells
  go through it; a door in a wall seen from the front is a thing with a
  state of rest.** Decided 2026-10-28 by the owner. The cells walked
  between two rooms are the doorway's own, as the painting draws it, and
  no cell beside it is: in the dormitory, row 9, under each wall's open
  leaf. Whoever stands in a doorway seen from above is behind the wall's
  band and in front of the doorway's inside: the wall's polygon takes in
  the band all along and leaves the inside out. A door in a wall seen
  from the front (the dormitory's door to the corridor, the library's
  three doors) is a thing with a closed and an open picture, and the
  scene's settings name the state it rests in (`rest`) where no level or
  story places it: the library's doors rest open, the dormitory's front
  door rests shut. A story opens and closes it (D103); a level places it
  as its goals need. Rules out a crossing through a wall beside its
  doorway, a gap painted in a wall where the painting has its own
  doorway, and a shut door taken out of the painting to save a picture.
- **D105 — A figure walks the painted strip: `nudged` cells.** Decided
  2026-10-28 by the owner. Where a painting's walked strip is not in the
  middle of its cells (a wall's band leaning across a column, trunks
  reaching into the next, a doorway off its cell's middle), the scene's
  settings name the cells and how far sideways, in cells, a figure
  standing on them is drawn (`nudged`, like `lowered`), measured as the
  strip's middle less the cell's; the figure's words, its outline and its
  walks follow the drawing, and the sweep draws it there too. The map
  stays the map. Rules out a figure drawn over the trunks it walks beside
  and a figure half behind a wall it walks along. In chapter 3 the cells are
  where the figures walk, and only the cells round a door or an arch are nudged
  (D149).
- **D106 — The zoom is the child's to set, finely, in every scene, and
  the words on the scene are always readable.** Decided 2026-10-28 by the
  owner. The zoom box (+, −, Find my wizard) is on a story's scene as on
  a level's. The buttons step through the zooms; the wheel turns the zoom
  a tenth a notch, at most a quarter a turn, between the same limits.
  Every scene opens at zoom 1, a story on its camera's tile. A drag in a
  story holds until the next step or Find my wizard, so that the child can
  watch someone the story does not follow, a teacher walking away down a
  corridor. A bubble and
  a thought are drawn larger as the camera zooms out, so that their words
  are never smaller on the screen than at zoom 1; zoomed in, they grow
  with the scene. Rules out words of seven pixels under a teacher's face
  and a wheel that leaps from the whole scene to a close look in two
  notches.
- **D107 — A revealed thing glows.** Decided 2026-10-28 by the owner. A
  thing revealed (D85) is drawn as its own shape filled with the
  outline's yellow, half seen, beating, over whatever covers it, until
  it is picked up or given: a filled shape reads as "it is here" whatever
  the thing's shape, where a line round a thin key reads as a bar across
  it. The wizard's outline where something hides it stays a line, and is
  counted and drawn only from the images drawn in front of the wizard.
  Rules out the key's outline with a line through it and the wizard's
  outline lit where nothing hides it.
- **D108 — An open doorway shows the floor beyond at the room's own
  light, under every figure.** Decided 2026-10-28 by the owner. The
  opening of an open door is filled with the floor of the room beyond,
  taken from the painting itself where that floor is plain, darker under
  the arch and as lit as the room at the threshold, never brighter; the
  fill covers the leaf from one jamb to the other down to its foot, the
  floor's own dark line under the threshold or the closed leaf's own
  bottom outline gone through (`sill`), so that no board or line of the
  frame is left on the floor, and ends in a threshold of the floor beyond
  (D114; `repaint.py doorways`). The fill is
  the ground's, under every figure, so that a figure standing beyond the
  door is seen through it and not counted as hidden by it; the open
  door's own picture is its leaf, swung beside the doorway (D111). Rules
  out a doorway lit like a lamp before a dim room, and a model's edit as
  the source of a fill the painting holds.
- **D111 — An open door is seen open, its leaf swung against the wall
  beside its doorway.** Decided 2026-10-28 by the owner. A doorway with
  no leaf in sight is taken for floor: an open door shows its leaf,
  swung out of the doorway toward the viewer and lying against the wall
  beside the arch, over the wall. The leaf is a model's, painted on the
  guide `repaint.py doorways` draws for it (`guide`): the shut leaf
  turned over on its hinges at the opening's edge, narrowed to the span
  it lies in and a little darker, its free edge a little forward and its
  shadow on the wall; the model's picture is joined into the doorway's as
  any box is (D88). It is the open state's picture, cut by the shape
  traced round it (D113), and is drawn among the rows as the
  wall it lies on is (a state's own `row`, the dormitory's front door's on
  the front wall's). A door that rests open where no level places it is drawn so
  too. Rules out an open door taken out of sight, and a door seen open
  only by the floor in its doorway.
- **D109 — A thing drawn away from where it is painted is drawn in the
  middle of its cell.** Decided 2026-10-28 by the owner. A thing a level
  places on another cell than the one it is painted on (D85) has the
  middle of what is drawn of it put at the middle of that cell, not the
  painted offset carried along, and with the cell's nudge (D105), where a
  figure on it stands; on its painted cell it is drawn as painted. A thing laid on a cell no one walks, under a bookcase, is
  drawn just under that row's things, hidden in them. The cell's nudge is the one D149 gives it.
  A key is drawn at 0.65 of its painted size, centred on its cell wherever it lies (D164).
  Rules out a book that is in one cell and looks to be in the one above.
- **D110 — The child sees where a thing is; its numbers wait.** Decided
  2026-10-28 by the owner. In chapter 2 no text prints or speaks of a
  position: the grid's numbers mean nothing to a child who does not see
  them. A thing found with `find_nearest` is shown with `reveal`, taught
  in the same lesson as `find_nearest`, and a level puts a lost thing
  where the child can walk to it once it glows. `position` stays in the
  world's API for chapter 3, which teaches the grid first and `position`
  after it (D112). Rules out `print(book.position)` as the way to find a
  book.
- **D112 — The grid is taught before `position`, with the naughty
  child's map** (its overlay and its third level are superseded by D134, its
  teaching order stands). Decided 2026-10-29 by the owner. A cell's numbers mean
  nothing until the child has seen them on the scene and counted cells by
  hand. Chapter 3 opens with the naughty child's map, a thing the wizard
  carries, and the spell `orvim`, cast only with the map carried: for a
  few ticks the scene shows every cell's numbers, as the debug view draws
  them, and every thing and person outlined with its name and its cell.
  The lesson *The cells* says what the two numbers are (x from the left,
  y from the top, both from 0, a step right adding one to x and a step
  down one to y) and the first level names the wizard's cell and the
  goal's, shows no mark, and asks for the moves; the second gives the
  goal's cell only, and `wizard.position` tells the wizard's; the third
  gives neither, and a thing's `position`, found with `find_nearest`,
  says where to walk. Only then do chapter 3's conditions use
  `teacher.position`. Rules out `position` listed in a lesson no level
  needs, and a goal mark shown where the child is to count.
- **D113 — An open leaf is cut by its traced shape, never by a difference
  snapped to lines.** Decided 2026-10-29 by the owner, who found the masks
  loose at every leaf's bottom corners and along its shadow. The open
  state of a door is cut by a polygon traced by hand on the swung picture,
  `leaf`, round the wood, the hinges and the iron of the leaf and round
  the shadow it throws on the wall, the free edge and the bottom corners
  whole; the polygon is drawn at the painting's own size with its edge
  softened over one pixel, and nothing is snapped, flooded or kept by
  size. The closed state is the painting within the doorway's own shape,
  `doorway`: the open doorway's fill grown over the arch's inner line by
  the width of the painting's outlines, so that the wall keeps its line
  round the door's cut-out, no mortar line of the wall beside the arch
  comes along with the leaf, and nothing of the open doorway shows through
  it (the painting's cut-out within that shape left gaps where the leaf's
  edge and the fill's are alike). Every scene's check draws each door's
  states over the painting at three times their size, the mask's edge
  marked, and a state is accepted only when its edge lies on the leaf's
  outline all round. Rules out a mask whose edge is found by a difference
  where the leaf's foot meets the floor, and a door looked at only in the
  game's small picture.
- **D114 — An open doorway ends in a threshold of the floor beyond it.**
  Decided 2026-10-29 by the owner, on mock-ups of a drawn line, a wooden
  board and a stone sill. At the foot of every open doorway filled by
  `repaint.py doorways` lies a threshold from one jamb to the other, 0.08
  cells high, inside the doorway: from the wall's edge inward, its foot
  on the jambs' feet, never over the floor before the door. It is made of
  the floor seen through the doorway, the `floor` box the fill is taken
  from: a plain strip of that floor turned a quarter, so that a wooden
  floor gives a board with its grain across the doorway and a stone floor
  a flagstone sill; a tenth darker than the floor, with its two edges
  drawn as thin, slightly wavy lines in the colour of that floor's own
  joints, never in the black of the outlines. The fill ends at the
  threshold's top; the threshold covers whatever outline of the closed
  leaf lay at the fill's foot. Where the floor before the door is stone,
  the painting's stone stays below the threshold with no line added.
  The jambs' feet are where their bottom outline ends, measured on the
  painting beside the fill's span; where the fill's foot is the closed
  leaf's own bottom outline, the threshold reaches down to the jambs'
  feet over the doorway's own floor, and where it is the floor's own
  line, the edge of the floor before the door, the threshold ends on that
  line even where the jambs stand lower (the owner, 2026-10-29, on the
  review of sprint 20). Rules out a straight line of the outlines' width
  drawn at the foot, a threshold laid over the floor before the door, a
  leaf's outline left as a floor line, and a board that ends above the
  jambs' feet with floor between.
- **D115 — A scene is painted on the grid as if the grid lay on the
  floor.** Decided 2026-10-29 by the owner, on the lessons of chapters 1
  and 2. The prompt of a scene asks the model to make the things and the
  edges of the picture coincide, roughly, with the grid drawn on the
  floor: a wall, a doorway, a piece of furniture, a path's edge on a
  cell's lines, as the layout shows them (D102), without naming what each
  cell holds. A thing has height, so it may rise over the cell above the
  one it stands on; its base is what keeps to the grid. The nearer a
  painting comes to the grid from the start, the less the cut and the
  levels have to be bent to it. Rules out a prompt that lists the cells'
  contents, and a try kept whose walls fall between columns.
- **D116 — A door is painted shut and open from the start, and the floors
  meet in a painted joint.** Decided 2026-10-29 by the owner. Every door
  of a scene is asked of the model in both states when the scene is
  painted, the shut picture and the open one, and both masks are made
  from them: the shut leaf within its doorway, the open leaf swung beside
  it (D111, D113). Through an open door the floor seen is the floor of
  the room beyond, never the room before it (D108), and where the two
  floors meet at the doorway's foot the painting itself holds a joint, a
  board or a row of paving from jamb to jamb, so that no joint has to be
  made by hand; the threshold `repaint.py doorways` draws (D114) is for
  a painting that lacks one. The lower corners of a leaf and the row the
  leaf is cut at below are what most often go wrong: the doors sheet
  (`doors-<scene>.png`) is looked at there first. Rules out a door painted
  shut alone and opened by an edit, and an open doorway showing the floor
  of the room the viewer stands in.
  Chapter 3's doors are Gemini's edits of a base without them (D148).
- **D117 — Figures that go together move together in a story.** Decided
  2026-10-29 by the owner. A story's step stages every figure that moves
  at that moment at once, as the page can play them (D103): three who
  leave a room go in one step, not three; a walk is staged one figure at
  a time only where the story means it, a teacher leaving while the
  others wait. Rules out a story whose figures take turns to walk when
  nothing in the tale makes them wait.
- **D118 — A scene's margin is wide: four or five cells at the sides,
  two above and below.** Decided 2026-10-29 by the owner, for every scene
  from chapter 3 on; the field, the dormitory and the library keep theirs
  (D83). A scene is taller than wide more often than not, so the zoom
  wants most of its room at the sides: four to five cells of margin on
  each side and two above and below, painted with the scene from the
  start (D83), and painted so that what fills them keeps a figure out of
  them of itself, walls, bushes, rocks, water, a drop, never a floor one
  could walk on. Rules out a margin the zoom runs out of, and a margin
  of open floor that only the map forbids.
- **D119 — A wizard with no name is Kydux.** Decided 2026-10-29 by the
  owner. Where no wizard has been made, which only the tester's mode
  brings about by skipping the creator, the wizard's name in every text
  is the creator's default name, *Kydux*, in every language; no other
  word stands in for it. Rules out *apprentice* as a stand-in.
- **D120 — A floating figure never stands still.** Decided 2026-10-29 by
  the owner. A figure that floats (Eldra) is drawn, while it stands, with
  its dress swaying at the hem, slowly and without end, in a level and in
  a story alike; walking, it steps as every figure does (its step frames
  are its dress grown and swung, `tools/art/figures.py`). Rules out a
  ghost that hangs in the air like a picture.
- **D121 — A way's places are taken while the level is out of sight.**
  Decided 2026-10-29 by the owner. When a run starts, the scene fades out
  and stays out until Python has run and the way to show is known; the
  things and the figures are put at that way's places while nothing is
  seen, and the scene fades back in with everything in place (D51, D75).
  Rules out a thing seen to jump to its place after the level has come
  back.
- **D122 — The map opens at the place the child has reached.** Decided
  2026-10-29 by the owner. Opened from a level, a lesson or a story, the
  map scrolls to that item and marks it; opened from the start screen, it
  scrolls to the item last opened and marks it the same way. A story
  opened counts as the item last opened, as a lesson and a level do.
  Rules out a map that opens at its top.
- **D123 — What the wizard carries is asked for with `find_item`, and is
  seen when given.** Decided 2026-10-29 by the owner. A level may start
  with a thing in the wizard's hands that has a picture (`carrying`
  names the kind, or the kind with its `art`). `wizard.find_item("book")`
  gives the thing of that kind the wizard carries, or `None`, as
  `find_nearest` gives the nearest one on the map: a name kept in one
  program is gone in the next, each level being a new program (D75), so
  the next program asks for the thing again. Given, the thing is seen to
  go from the wizard's hands to whoever takes it. Rules out a name put
  into the child's program unseen, `find_nearest` looking into the
  wizard's hands, and lists with their brackets before chapter 4.
- **D124 — Going to sleep is seen: the lights go out, the sleeper is
  seen, the morning comes.** Decided 2026-10-29 by the owner. When a
  level is won by the wizard going to sleep (a `sleep` goal), the card
  waits: once the wizard lies in the bed, the night falls over the whole
  scene, a dark blue that leaves the sleeper and the room faintly seen,
  the wizard is seen asleep for a moment with a small thought of sleep,
  and then the dark lifts into a warm morning light that stays on the
  scene until the level is left; only then the card shows. A story that
  plays in the morning on a scene painted at night opens under that same
  morning light (`light` in its staging). The times are the page's own,
  not the run's speed. Rules out a win card over a wizard who has just
  lain down in the dark, and a morning story told on a night scene with
  no light of morning.
- **D125 — The cells an open leaf lies on are not walked while it is
  open.** Decided 2026-10-30 by the owner. A door whose open leaf lies on
  the floor beside its doorway covers the cells its foot stands on (the
  scene names them, `covers` on the door's open state, measured on the
  leaf's picture); while the door is open no one walks onto them, the
  wizard's step is refused and the child told why (`door_leaf`); and when
  the door opens with the wizard or an actor on one of them, that figure
  steps to the nearest free cell along the row, away from the door, as
  the leaf swings (`shoved`). Rules out a figure drawn behind the leaf of
  a door it stands beside. A leaf cut by difference is measured on every
  row it reaches, and a cell it only touches is walked with the figure
  drawn away from it (D157).
- **D126 — A scene painted at night has a morning picture: its sky, its
  windows and its outside by day.** Decided 2026-10-30 by the owner. A
  scene painted at night that a morning story plays on, or that a night
  spent in it ends in, has a second ground (`grounds.morning`): the night
  painting with the sky above its walls, the sky in every window and
  everything outside the walls (grass, towers, battlements) painted by
  day and taken in boxes (D88), the inside as painted, candles and torches
  as they are. A story under the morning light (`light`, D124) draws that
  ground, and the dawn of D124 crossfades the night ground into it under
  the warm light. Where Gemini's morning picture fits the night painting
  whole, every wall, bed and door within three pixels, the morning is the
  whole picture: every image of the scene has a morning twin cut with the
  same masks, the torches, candles and fire out, and no light is laid over
  it; where it does not fit, the sky, the windows and the outside are
  taken in boxes with their tones matched to the painting along the
  boxes' edges (the owner, 2026-11-01). The fit is measured box by box,
  every static thing's and every door's (`trace.py fit`): each laid within
  three pixels; the share of the night's outlines the picture covers,
  which a night's outlines thickened by its shadows and its rooms in the
  dark keep low even where the picture lies in place, does not decide (the
  owner, 2026-11-01, on the dormitory's, whole since: `sources.hours`,
  every image's twin at the hour, a doorway's fill in the hour's light of
  the floor it is taken from). Rules out a morning told under a night sky,
  and a scene painted twice by hand.
- **D127 — A spell's pull is seen in order: the light, then the thing to
  the hands, then the hands.** Decided 2026-10-31 by the owner. When
  *fendra* takes a thing, the light leaves the wand and flies to the
  thing; only when the light reaches it does the thing leave its place,
  and it flies to the wizard's hands, where it stays seen, held, until
  the tick ends; the pick-up of a thing already in the hands shows the
  wizard's hands close on it with no second rise; and a give starts from
  the hands, after the pick-up has ended. Every step waits for the one
  before. Rules out a book that lands at the wizard's feet before the
  light has reached it, and a hand-over that begins while the book is
  still on its way.
- **D128 — A figure in a story may step out from behind a thing.**
  Decided 2026-10-31 by the owner. A story's `appear` may say `from`, a
  cell next to the one the figure appears on, which no one walks (a shelf,
  a counter) or which something covers: the figure is drawn walking out
  of it onto its cell over the step's tick, behind what stands there, and
  the world has it on its cell from the step's start; nothing of it shows
  before it steps out, the check counting its pixels seen there. Rules
  out a figure that comes out of nothing where the scene has a thing to
  come out from behind.
- **D129 — A spell's line stops at a doorway the wizard does not stand
  in.** Decided 2026-11-01 by the owner. *fendra* reaches a thing in a
  straight line of at most three cells, and that line does not pass
  through a door's cell, open or shut, unless the wizard stands on it: a
  thing inside a room is reached from its doorway or from inside, never
  from the room before it through the open door. A thing on a shelf is
  never picked up by hand, from beside or from below: it is too high
  (`too_high`), and only the spell brings it down. A shelf is a level
  map's shelf or a scene's bookcase (`level.HIGH_KINDS`); a thing hidden
  under a bookcase (D85), as the hidden key is, or lying on a stone or a
  pile of books, as the wand and the old book are, lies low, within the
  hands' reach from beside (built 2026-11-01). Rules out a book fetched
  out of a locked room from across its threshold, and a door opened for
  nothing.
- **D130 — Going to sleep is seen: the wizard walks to the cell under
  the pillow and hops into the bed; the cell to sleep from is marked.**
  Decided 2026-11-01 by the owner. Each bed names the floor cell under
  its pillow (`pillow_side` in the scene's `scene.json`), on the row in
  front of the bed, the cell nearest the pillow. `wizard.sleep()` from a
  cell beside the bed walks the wizard along free cells to that cell by
  the shortest way, a `move` a tick with its facing as any walk, then
  faces the bed and sleeps: the `sleep` event comes from the pillow-side
  cell. The page draws the moves as every walk, and the `sleep` as a hop:
  the figure, facing the bed, rises in an arc from the cell into the
  bed's place and settles lying there, head on the pillow, under the
  quilt, in one tick. A story's figure going to bed sleeps from that cell,
  its walk written in its staging. A bed with no floor under its pillow
  is not slept in from the side. A level whose goal is to sleep marks the
  cell the wizard must stand on to do it (the goal's `at`), with the
  goal's ring and a sign of sleep drawn by the page, a crescent and two
  "z" in the ring's colour, as a reach goal marks its cell. Rules out a
  figure that snaps into the bed in a blink, one that slides to the
  pillow faster than it walks, one that crosses the bed to get there, and
  a child who does not know where to stand.
- **D131 — A level opened again starts from its starting code.** Decided
  2026-11-01 by the owner. Opening a level from the map, from the course
  or from its lesson shows the level's starting code, as the first time;
  the program the child typed is kept only while the level's screen is
  open (*Run*, *Restart* and *Play again* keep it). Rules out a level that
  opens on the last program typed days ago, and a child who cannot find
  the comments that guide the practice.
- **D132 — Every figure's steps are heard: the wizard's soft and its
  own, the others' alike.** Decided 2026-11-01 by the owner. A walk of
  any figure, the wizard's, a friend's, a teacher's, in a level or a
  story, plays a step a cell: a short tap of filtered noise, never a
  tone, quiet; the wizard's its own, the children's (the friends, Eldra)
  alike, the grown-ups' (the teachers, Baro) lower and a little longer,
  so that the child tells whose steps they hear (`sfx.ts`); every other
  step a little lower, so that a walk does not tick like a clock. Rules
  out steps heard for the wizard alone, steps that sound like a drum, and
  the wizard's steps louder than the scene.
- **D133 — A sum or a subtraction with a name is taught where a level
  needs the rest of a walk, and a level never asks for a number below
  zero.** Decided 2026-11-01 by the owner. After the variable (D86), a
  lesson teaches that `5 - steps` and `steps + 2` are numbers made from
  a name, kept under a name of their own or written straight into a
  method's brackets, and `print` shows them. The level that needs it
  walks to a key that lies two to five cells away and then the rest of
  the five cells to the door: `rest = 5 - steps`, never below zero, since
  a move of a number below zero is for a later chapter. A level that can
  be won by a longer way gives its bonus to the shorter one: the bonus
  counts the run's ticks (`ticks_under`). Rules out a key farther than
  the door, a subtraction that goes below zero, and a bonus the long way
  earns.
- **D134 — The naughty child's map is a window with the scene's plan,
  and `orvim` opens it and pauses the run.** Decided 2026-11-05 by the
  owner; supersedes the overlay of D112, whose teaching order stands
  without its third level. The map is a thing of kind `map`, carried from
  the chapter's first level on (`carrying`); `wizard.cast("orvim")` takes
  a tick, needs the wand and the map, works wherever the map is carried, needed
  or not, whether the level names the spell or not (the owner, 2026-11-07), and
  makes the world's event `map`; a level that names the spell and has no map refuses
  it, `no_map`. When the page plays that
  tick it pauses the playback, and once the wand is seen pointed opens a
  window over the page with the scene's plan at that tick, what D143 says it
  is, and the wizard, every actor and every thing with its name and its cell
  beside it, except what lies unlit in a dark room (D52) and anyone in the dark
  tunnel (D135, D145). The window is closed by its button or Escape, and the
  playback goes on from the same tick; a run started again closes it. A lesson's
  page that casts the spell opens it too (D142). Rules out cell numbers drawn over
  the painting, and a map that costs a picture a scene.
- **D135 — An enchanted region hides every figure in it, on the scene and
  on the plan.** Decided 2026-11-05 by the owner, for the tunnel, which the child
  reads of as dark (D145). A scene's settings name the region (`enchanted`, boxes
  of cells); a figure, the
  wizard or an actor, standing in it is not drawn, a figure stepping into
  it fades out over that step and one stepping out fades in, and the plan
  draws no figure in it. The world is not changed: the wizard walks it
  as any floor, and `wizard.position` tells where it stands, which is the
  point of the level played inside it. Rules out a dark picture of the
  tunnel's inside, and a figure drawn black over the painting.
- **D136 — Chapter 3 is seven small scenes, one a level or a pair of
  levels, asked of the model as places and the levels fitted to them.**
  Decided 2026-11-05 by the owner. A scene is twenty by fifteen cells, one
  part of the castle's inside at night with its roof lifted off: the
  corridor or room of the level in the middle, closed doors to dim rooms
  at its sides that fill the picture and give the corridor sense, no
  outside, no sky, no frame and no black but inside the tunnel's mouth
  (`art/README.md`, *What surrounds a scene*). The route of the level is not
  forced into the picture: the picture is asked as a plain consistent place
  and the level's cells are read from it; what a level adds, a key, a hole,
  is an edit in a box. The twenty by fifteen cells are laid over the picture,
  whatever grid the model painted on it, which its edit takes out. A scene the
  design needs and no picture holds (the way down) is laid out on the grid first
  and painted from its layout (D102, D115). Between two scenes the next
  starts where the last ended, an arch out of one being the arch into the
  next, and a story is told between them where the tale needs it. Rules
  out one large painting a chapter, and a stepped diagonal stair, which
  the model paints isometric every time.
- **D137 — A teacher may start anywhere on its patrol, and a level's
  ways set its phase so that no fixed wait wins where a loop is taught.**
  Decided 2026-11-05. `patrol` lists the turning points of the path. With one
  point, or with the teacher's own tile first, the path starts where the teacher
  stands; with two or more and another first, the path is drawn from the first
  point through the rest, `at` lies on it and the teacher starts there walking
  the way it faces along the path. A level that teaches waiting with `while`
  gives the teacher a sight that reaches the crossing cell from every cell of
  its patrol but the far end, where it turns, so that "it faces this way" and
  "it sees the crossing" are one thing, and the wizard waits on the cell beside
  the crossing, off the teacher's row, so that the step after the loop is safe
  whenever the loop ends; its three ways start the teacher a third of its period
  apart, so that no number of waits written in the code wins all three, which a
  test holds. Rules out a loop level a child wins with `wait(5)` found by trial.
- **D138 — The stair of D53 is a slab over a hole (D167 takes over).** Decided 2026-11-05 by
  the owner, who said a moving stair cannot be drawn in the scene's view.
  The thing's kind is `slab` in `level.json` and in the child's code
  (`slab.in_place`), with D53's rule unchanged: in place for `period` ticks
  and away for as many, from tick 0 in place, a step onto it while away a
  bump (`by: "slab"`), `osto` holding it from its next tick in place. On a
  painted scene the slab in place is the painting's own floor and away it
  is the hole, a picture drawn at the cell the level gives (D85); `osto`'s
  hold glows round the cell. Rules out a stair that comes and goes and the word
  *escalón* in any text.
- **D139 — `can_see` is not taught; a program asks `facing`.** Decided
  2026-11-05 by the owner: when `can_see` is true the wizard is already
  caught, so no level can be won by asking it. `teacher.can_see` stays in
  the world's API for the challenges, in no lesson and in no level's
  `api` of chapters 1 to 3, which a test holds. The lesson on true and false
  keeps `==`, `not` and `dask.facing` (D54 otherwise stands).
- **D140 — A level's words show their code as code.** Decided 2026-11-05
  (the debt of sprint 29). Every text of a level's `text.<lang>.json`
  shown on the page, the intro, the outro, what was learned, the goals,
  the hints and the ways, renders a span between backquotes as inline code,
  and a word between asterisks, a spell's, in italics, as the lessons' pages
  do. Rules out a backquote or an asterisk shown to the child.
- **D141 — The chapter's words speak as the owner does.** Decided 2026-11-07
  from the owner's corrections to the walkthrough of chapter 3. A text the child
  reads says what a friend would say, in the order a child needs: the thing
  first, then the word for it, then an example with numbers, and nothing about
  how the game is built. A program *looks at* an attribute, *sees* where it
  stands, *checks* its coordinates; it never *asks*. A cell is named by its two
  numbers, the first `x` from the left and the second `y` from the top, written
  `(x, y)`, both from 0, and the lesson calls this a system of coordinates. No
  text says that a level is played in several ways, that the friend whispers,
  or that the game waits: the game's doing is shown, not told. The friend's
  reasons are said, and what the friend does not know is said as a guess; a
  bonus goal names the spell; an outro tells what the three see next, not what
  the code did. A metaphor for an idea (*preguntar*, *un nombre*, *lo que sabe*, *una
  acción*) is used only where the idea is first explained, which says at once that in
  programming it is called X; from then on the text says X, and the second time may
  recall it in parentheses (the owner, 2026-11-07, for the whole course). Content tests
  hold it. Rules out mechanics in the fiction and a lesson that names three ideas on
  one page.
- **D142 — A lesson page runs its code (D174 says what its code tries, D180 how a walk is told).** Decided 2026-11-07 (the owner's
  suggestion). Any page of a lesson may carry a block fenced `python try`, one a
  page; the page shows it in an editor with a *Run* button, runs it in the
  world of the first level after the lesson, in that level's first way, at its
  start, and writes under the editor what the program printed, how far the
  wizard walked if it moved, or what stopped it in the child's words; no scene
  is shown, and a program that casts the map's spell opens the plan's window.
  The child edits the block and runs it again, always from the start. The
  lesson's last page keeps the button that leads to the level, which never
  starts with the block (D63). Rules out a lesson that explains an expression
  and never lets the child print one.
- **D143 — The plan is the scene's own picture in ink (D151 says where it draws what).** Decided 2026-11-07 (the
  owner: the plan must show walls, doors and rooms, the figures as themselves,
  the mark as a mark, and match the scene). The plan's window (D134) draws the
  scene's ground picture through an ink-on-parchment filter on the page's side:
  each pixel's tone from the mean round it, stretched between the picture's
  darkest and lightest, its lines darkened from what is darker than that mean,
  its colour taken out. Over it, the grid at the scene's cells, every door as the
  scene shows it at that tick (inked with the ground), a key or a hole with its
  own picture, the figures with their
  own standing sprites and their names and cells beside them, every `reach` mark
  with the mark's picture, the hidden ones too, since the plan is where the child
  reads the cell, the dark tunnel's cells as a dotted path labelled
  `t('plan.tunnel')`, the column and row numbers along the four edges at 18
  pixels, and each cell's own numbers only where the pointer rests or a finger
  taps. What is unlit in a dark room stays undrawn (D52). No Gemini image. Rules
  out a hatched grid, numbers in every cell, and an old-map painting asked of the
  model, which cannot match the scene cell for cell.
- **D144 — A door's open state is built from its closed one, on no scene the child
  sees: D148 takes over.** Decided 2026-11-07
  (the owner: a reliable method for doors, which fail every time).
  `tools/art/door.py` makes the open picture of a door from the painting alone:
  the doorway is the closed leaf's traced polygon (D113) filled with the floor
  beyond, tiled at the painting's own size from the floor cells `floor_from` names
  (the room's cells behind the door), darker toward the lintel; the leaf is the
  closed leaf's own pixels, cut by its polygon, turned about its hinge edge
  (`hinge: left`, `right`, or `both` for a double door) so that it lies beyond the
  hinge, its width scaled to `swing` (0.35 by default) and its far edge lifted,
  drawn whole over the jamb with a dark line round it where the scaling thinned
  the painting's, never clipped by the door's box, which the tool grows round it,
  with a soft shadow at its foot; the jambs, the arch and what lies at the foot
  are the painting's, untouched. The two pictures, closed and open, differ in
  nothing else, so the leaf's shape, its arch and its bands are the same open as
  shut. A leaf over a jamb needs the arch under it and figures on the wall's foot
  row before both: the arch stands on that row, not `under`, and the open state's
  `row` is that row (or the next, where the arch is `under` on the wall's own
  row). Rules out asking the model to paint a door open, and a leaf cut by a box's
  corner.
- **D145 — The tunnel is dark.** Decided 2026-11-07 by the owner. In every word the
  child reads the tunnel is a dark tunnel where nothing is seen, and the map does
  not show the three inside it either; the word *enchanted* (*encantado*) is in no
  text and in no label. The scene's setting keeps its key `enchanted` (D135), which
  is code.
- **D146 — The crossing teaches waiting, then `if`, then `else`, one idea a
  level.** Decided 2026-11-07 by the owner. *La salida del túnel* teaches `wait`
  alone: Dask always starts at the same place, walking up the crossing toward the
  wizard's row, and the wizard waits two ticks for him to pass, then crosses to the
  first statue; a lesson *Esperar* (`lesson:waiting`) comes before it. *Junto a las
  estatuas* teaches `if` alone: Dask stands still between the first and the second
  statue, looking up or down, and the wizard, against the top wall, goes down two
  cells to pass below him when he looks up, and crosses straight when he looks
  down; the corridor is three cells high for it. The two ways end in different
  cells with one `if`, so its reach goal says `on_the_way`, met when the wizard
  stands on the mark at any tick; its bonus is to end right on the mark, which asks a
  second `if` (the owner, 2026-11-07). *Izquierda o derecha* teaches `if` and `else`, and
  the lesson *Si no* comes right before it. Rules out a level where one tick of
  waiting is enough only because Dask has two starts.
- **D147 — A standing figure stands.** Decided 2026-11-07 by the owner. A figure's
  standing frame, in every row of its sheet, has its feet together and its weight on
  both; a walking frame is made from it (`figures.py`). Dask's and Wenna's sheets are
  made from drawings of them standing still in the four views (`figures.py
  --standing`). Rules out a figure who stands still with a foot in the air.
- **D148 — Every state of a scene is painted by Gemini from one base, and every cut-out
  is the difference between two of its pictures.** Decided 2026-11-08 by the owner (*no
  debemos pintar ni reconstruir escenarios; Gemini hace las imágenes, así son
  consistentes*). A scene's base is its painting with nothing in it that comes and goes:
  no door leaf, each doorway open with the floor beyond running through it. Every other
  state is an edit of the base asked of the model: the door open, its leaf swung toward
  the viewer beside the doorway, and the door closed, where the painting's own door fits
  the arch the base keeps, or else an edit of its own. A cut-out is where that picture
  differs from the base (`trace.py diff`): the colour distance read at a narrow smoothing
  for its edge and a wide one for what is nearly the floor's colour, cleaned of the lines
  an edit moved, its holes closed, kept within the thing's box. A thing the model cannot
  take away cleanly, or whose stones are nearly the colour of what lies behind them, an
  arch, is asked of the model flat magenta instead, and takes the outline beside it
  (`--rim`): the difference is then the thing to the pixel. A wall's top, which cannot be
  taken away, is a box on its two straight outlines; a leaf opens within its doorway (D158).
  The ground the game draws is the
  base; what stands or lies in the scene is a cut-out over it at its row; what a figure
  walks behind is a cut-out on its foot's row or `over`. A try whose edit changed what it
  should not, in the mask or beside it, is asked again, three tries at most. A key and a
  hole stay the pictures they were cut from. Rules out `door.py`'s open leaf,
  `repaint.py spaced`, `tiled`, `placed` and `fill` on a scene the child sees, and a
  polygon traced by eye where a difference can be had; those tools stay for the sheets and
  for chapter 2, which the owner has accepted.
- **D149 — The cells are where the figures walk.** Decided 2026-11-08 by the owner. (a) A
  corridor two cells wide has both columns walked, each figure in its own; no column is
  nudged whole, and the settings refuse a nudge over a whole column or row. (b) Only on
  the cells of a door or an arch and the cell before and after them, both columns are
  drawn toward the opening's middle, by 0.2 cell each, so that a figure passes clear of
  the jambs and the two columns stay apart. Where an open leaf stands in the doorway, the
  column beside it moves less (0.1 at the storeroom's door); the two columns round the long
  round's arches move 0.3 (the owner, sprint 34), and round the way down's double door, its
  leaves a quarter open against its jambs, 0.2 (the owner, D167). (c) The first floor row below a
  wall's foot is drawn 0.3 cell lower (`lowered_rows`); the row the foot is painted on is
  wall (D154), but for the shed's row under the pegs, walked and drawn 0.25 lower (D211). (d) The row at the bottom of a
  corridor where the lower wall's face is painted is walked, the wall's top cut `over` the
  figures on it, and where that wall stands so close that only a hat would show, the row
  is drawn 0.3 higher. (e) A level starts a cell past an arch, never in it or on the cell
  beside its jamb. (f) The plan and the goal's mark draw at the same nudged place as a
  figure on the cell (D151). A cell beside a hole stays a wall where a child could walk
  round it, the hole's lesson lost. Rules out a column nudged whole to a corridor's middle,
  and a figure whose head lies on the wall above it.
- **D150 — A door is as wide as the cells its leaf closes.** Decided 2026-11-08. A door's
  `cells` in `scene.json` lists the one or two cells of its doorway; shut, it blocks them
  all; open, it frees them all, but for those its leaf covers (D125); `open()` is asked
  from any cell beside any of them; `at` is the first. The plan and the level's things draw
  one door. A leaf cut by difference is measured on the rows above its own, whose figures
  it hides, where a figure on the cell is drawn; a figure on its own row is drawn before
  it. Rules out a doorway two cells wide with one of them a wall.
- **D151 — The plan draws what the scene draws.** Decided 2026-11-08 by the owner. The plan
  (D143) draws the figures and the marks at their nudged places, and the figures behind
  the same cut-outs as the scene, each at the scene's depth and inked with the ground (Dask
  under the arch he stands in, a figure behind a statue); every reach mark with its cell
  written beside it, `(15, 3)`, as a figure's name is; and the grid as ink lines on every
  floor cell's edges, fainter over the walls, so that a child counts cells without numbers
  in them. A goal's mark lies on the ground, on the scene and on the plan, its ring seen
  over what covers it (D160); a dark room is drawn as any room (D163); the names cover
  nothing (D166). Rules out a plan where the grid is read only from the numbers at its
  edges.
- **D152 — The dark tunnel's level starts where the child cannot know.** Decided 2026-11-08
  by the owner. *El túnel oscuro* starts at (14, 2), a cell the child has not seen, not
  where *El pasillo de las puertas* ended; its goal names no cell: the exit is found on the
  plan, so the level is played by opening the map (in the lesson's block or in the program)
  and looking at the wizard's position. Rules out a start the child remembers from the level
  before.
- **D153 — The dark room teaches the two numbers of a position.** Decided 2026-11-08 by the
  owner. A position's two numbers are its attributes `x` and `y` (`key.position.x`); the
  steps between two cells are the difference of their `x` and of their `y`, kept in two
  variables; a lesson *Las dos coordenadas* (`lesson:the-two-coordinates`) before *La sala
  oscura* recalls the system of coordinates and teaches it; the level is played in three
  ways with the key on three cells, always right of and not above the wizard, so that the
  differences are never below zero, and the walk to the door is counted the same way. Rules
  out a key whose cell the child reads off the plan and types.
- **D154 — The row a wall's foot is painted on is not walked; the first floor row below it
  is.** Decided 2026-11-08 by the owner (*la maga está casi dentro de la pared; bajar todo
  una fila*). In the crossing, row 5, where the top wall's foot is painted, is wall, but
  for the tunnel's arch and Dask's corridor; the gallery's floor is rows 6, 7 and 8, and
  row 8 is walked behind the lower wall's top (D149 d). The three statues stand out in the
  middle of the gallery, `u` on row 7, their cut-out on that row (the owner: *las estatuas
  deben estar en el centro del pasillo*), so that Dask stands between two of them and a
  figure passes behind him on row 6, behind the statues, or below him on row 8; Gemini
  painted them there on the painting with them taken out (`crossing-statues-middle-3.md`).
  Row 6 is drawn where it is, not lowered (D149 c): lowered, a figure on it stood in the
  statues' bases (the owner). The same holds for every scene: the row of a wall's foot is
  not walked, and the row below it is lowered only where nothing stands out on the row
  below that. The one exception is the owner's: in the shed the row under the pegs is
  walked, its figures drawn lower against the back wall (D211). Rules out a figure whose
  head lies in the wall, or whose feet lie in a statue's base.
- **D155 — A cut-out's mask is opaque inside its outline.** Decided 2026-11-08 by the
  owner (the wizard seen through the statue's robe). A mask by difference (D148) is 0 or 1
  at every pixel, its edge softened over one pixel by the page's resampling. Where a
  thing's colour is nearly the floor's, its thin outline differs even where its inside
  does not: the lines that differ and touch the mask close those parts in, each as large as
  the thing's largest hole, with the outline beside them (`closed_in`); a line the edit
  moved apart from the thing closes nothing in. Rules out a figure seen through a statue, a
  leaf or a torch.
- **D156 — A painted door shows its painted state at every tick, hung on the jamb it opens
  on.** Decided 2026-11-08 by the owner. A door with painted states is never drawn with the
  placeholder's frame: at the tick it opens, at the run's end and on the timeline, the page
  draws the state's picture, and where that picture is not loaded it keeps the painted
  state it shows until it is; a browser test plays *Izquierda o derecha* in both ways and
  the three doors, every tick, and holds each door's painted picture (`data-door-looks`).
  A door's shut and open pictures hang it on the same jamb: its hinges, shut, are on the
  side its leaf swings on (the room of two doors' right door and the three doors, shut,
  are Gemini's edits with their ironwork on that side). A walkthrough takes its pictures
  once a door's fade is over, and only of its own run. Rules out a door that changes from
  one tick to another.
- **D157 — An open leaf is measured on every row it reaches, and a figure it only touches
  is drawn away from it.** Decided 2026-11-08 by the owner (*la maga está chocando con la
  puerta*). A leaf cut by difference (D148) is measured on the rows above its own, where a
  figure is drawn behind it: a cell whose lower part it covers by more than a fifth is
  covered (D125); and on its own row and below, where a figure is drawn before it: a cell
  is covered only where the leaf fills that part (the storeroom's (9, 13)), and a cell
  whose figure the upright leaf touches (its columns at least 1.25 cells tall; its shadow
  on the floor touches nothing) is walked, the figure drawn 0.3 away from it, down below
  the leaf's row and sideways on it. `export_scene.py` writes those into art.json's
  `lowered` and `nudged`, each with its door's name (`leaf`), before the doorway's own, and
  the page, the plan and the sweep take the first range that names a cell. Rules out a
  figure walking through a leaf's foot.
- **D158 — A leaf opens within its doorway's width.** Decided 2026-11-08 by the owner (*no
  vale con que aparezcan detrás del muro; deben quedar menos abiertas*). A door whose
  leaves, opened wide, would run into a wall beside the doorway is asked of the model
  opened within the doorway's width: the way down's double door has its two leaves turned
  a quarter, each against the inner side of its own jamb, the arch and its jambs whole
  (D165), and the figures passing it drawn 0.2 toward the doorway's middle on its cells
  and the cell before and after (D149 b, D167). Leaves that stand in their doorway are drawn on a row at
  or below their feet, so that a figure passing between them is seen. No leaf is hidden
  behind a wall's box to make room. Rules out a leaf drawn over or behind a side wall.
- **D159 — The plan draws a cut-out where it is painted.** Decided 2026-11-08 by the owner
  (the statues higher on the plan than on the scene). The plan (D151) draws every image of
  the scene, a row's cut-outs, a door's state and a thing, at its painted box
  (`paintedBox`), as the scene does, never from the cell it stands on; a test holds the
  crossing's statues and the doors at the boxes art.json gives them. Rules out a thing on
  the plan a row off the scene.
- **D160 — The goal's mark lies on the floor (D168 says how its ring is drawn, D172 where a door opens on it, D181 what covers it).** Decided 2026-11-08 by the owner (*los
  círculos de destino deben verse sobre el suelo, tapados por lo que está delante, en
  todos los escenarios de todos los capítulos*). On a painted scene the mark is drawn at
  the ground's depth (`MARK_DEPTH`), under every row's things, every thing standing and
  every figure, in every scene of every chapter: a figure walking over it, a cut-out
  before it (a statue, an arch's band, a door's leaf shut or open, a wall's top) covers
  it. Where one of them covers it, the mark's ring is drawn over them in the outline's
  yellow, masked by copies of what is drawn over it, beating with the mark, over every
  figure and under the dark and the light (`MarkSilhouette`), so that the mark is read
  whole, as a figure is by its outline (D107); the page says which marks are covered
  (`data-marks-covered`). The plan draws its marks under its figures and cut-outs, and
  their ring over what covers them. Rules out a mark that floats over an arch, over a
  shut door or over the wizard's feet.
- **D161 — A door's open state is asked of the model as the whole scene.** Decided
  2026-11-08 by the owner (*pedir a Gemini la imagen completa con la puerta abierta, y eso
  debería hacer que el suelo tuviese continuidad*), for every scene: the edit that opens a
  door is asked on the whole picture of the scene, never on a crop, so that the floor seen
  through the doorway continues the floor on both sides; the leaf and the doorway are the
  difference against the base (D148), or, where the model painted what lies round the
  leaf again and the difference takes it in, the polygon traced on the leaf's outline
  (`traced`, art/README.md). The way down's double door is so (D165). The dormitory's
  common room door keeps the leaf and the doorway it has, the owner's choice once its
  door was asked whole (2026-11-08). Rules out a doorway whose floor stops at a crop's
  edge.
- **D162 — A dark room is dark in every level played before it is lit.** Decided
  2026-11-08 by the owner (*en este nivel la sala debería estar a oscuras, porque si no ya
  la ha visto el niño*). *El agujero que se abre* plays with the storeroom dark (`dark:
  ["storeroom"]`), its mark on (5, 7) in the dark, seen faintly as the castle's shape
  (D52), and no light to cast. A dark level lists `kirra` among its spells only when a
  `collect` or an `open` goal names a thing that lies in the dark (its dark rooms, or the
  whole map), since a `reach` needs no sight (`level.py`). Rules out a room seen lit a
  level before the level that lights it.
- **D163 — The plan shows a dark room as the castle's plan (D169: the things in it too).** Decided 2026-11-08 by the
  owner (*en el mapa la oscuridad no se debería ver como un parche blanco*). The plan
  (D151) draws a dark room's picture as any room's, since the map knows the castle; only
  the things that lie unlit in it are not drawn (the key stays the level's secret), and a
  figure in it is drawn. Rules out a white patch on the plan.
- **D164 — A key is drawn small, and a torch stands over it.** Decided 2026-11-08 by the
  owner (*la llave se ve por encima de la antorcha, y es muy grande*). A key's picture on
  a painted scene, in every chapter, is drawn at 0.65 of its painted size (`KEY_SCALE`),
  the middle of what is drawn of it on its cell's middle with the cell's nudge wherever
  it lies (D109), and just under its row's things (`lying`), so that a torch's cut-out on
  its row is over it; the plan draws it so. The way down's key on (10, 3) ends short of
  the wall torch beside it, which is the ground's. Rules out a key wider than a figure.
- **D165 — A double door opens a quarter turn against its jambs, drawn over the hole
  before it.** Decided 2026-11-08 by the owner (*las hojas a 90 o 95 grados, lo justo para
  no dar con el muro; por encima del agujero, no por debajo*). The way down's two leaves
  are Gemini's edit of the whole base (`way-down-open-quarter-2.md`), each turned a
  quarter toward the viewer and standing against the inner side of its own jamb, the
  arch whole between them. A leaf turned toward the viewer comes out in front of the wall
  by its width, so their feet reach the hole's row (about 7.7); they are drawn on row 8,
  over the hole and over the torch beside it, and a figure passes between them on the
  doorway's cells (D158). Rules out leaves that barely open and leaves drawn under the
  hole.
- **D166 — A label on the plan covers no figure and no other label, and the mark's label
  no cut-out.** Decided 2026-11-08. The plan's labels (a figure's name and cell, a mark's
  cell) are placed by a search, right, left, below and above of their owner and then
  farther out, at the first place that overlaps no figure's body, no mark, no label
  placed before it and, for a mark's, no solid pixel of a cut-out, and they are drawn
  last, over everything. Rules out Nuri's label over Teku's figure on P3's plan.
- **D167 — The thing in the floor is a hole that opens (D178: one of period 0 never closes on its own).** Decided 2026-11-08 by the owner
  (*el dibujo muestra un agujero redondo que aparece y desaparece; cambiemos los textos; en
  el código `hole.closed` o `hole.open`*). The thing's kind is `hole`, in `level.json` and
  in the child's code: closed for `period` ticks and open for as many, from tick 0 closed,
  and closed while `osto` holds it (D53's rule). `hole.closed` is true while the floor
  covers it and `hole.open` is its opposite, both looking at the next tick, so that `while
  not hole.closed:` and `while hole.open:` are one wait after which a step lands; a step
  onto an open hole bumps (`by: "hole"`); `osto`, cast beside any of its cells, holds it
  closed from the next tick it is closed, for `HOLD_TICKS`. A hole lies on one cell or two
  side by side (`cells`, as a door's, D150, `at` the first; the loader refuses others), open
  and closed together; the way down's lies on (10, 7) and (9, 7), as it is painted, so that
  no one walks round it, and the figures by its half-open door are drawn 0.2 toward the
  doorway's middle (D149 b). Its picture is the art's state `open` (D148), drawn while it is
  open and never under the wizard, who holds it closed standing on either cell (D53); while
  `osto` holds it closed, the floor shows whole, and where the hole's open picture meets it
  a crack of light, a pale line nearly white at its middle, wider and narrower along its
  way, between two dark lines, and many dark cracks running from it out into the floor and
  in over the hole, each a zigzag that is never straight, most of them splitting into
  branches and some branches again, drawn by the page from the hole's picture, the same
  every time for the same hole; the crack is dark from edge to edge and stays, with its
  cracks, and the light alone fades away over it and comes back with a figure's outline's
  beat (D107), dark where it has faded; what is held is so read in the hole's own shape, on
  one cell or two (the owner, 2026-11-09). A door and a hole name their kind in the scene's
  settings and in art.json (`kind`), and the art tools and the page tell them apart by it,
  never by the states they have: either may have an `open` state and a `closed` one, a
  door's open state is its leaf and a hole's has none, and a closed hole shows its `closed`
  picture where it has one, else the floor (the owner, 2026-11-09). The lesson *Luz y
  trampas* teaches the two waits as one; the levels' solutions use `while not hole.closed:`
  and their bonus asks `closed`; *El agujero que se abre* (`the-opening-hole`) is played in
  four ways, *Se abre cada tres ticks* to *Se abre cada siete ticks*. In the words the child
  reads the hole is *un agujero que se abre en el suelo*, *una trampa mágica, o un portal
  oscuro* where it is first told, and *otro de esos agujeros* afterwards; no text says
  *losa*, nor that anything goes and comes, which a content test holds. Supersedes D138 and
  D53's names. Rules out a slab in any text, `in_place` in any code, and a door told from a
  hole by the states it has.
- **D168 — The mark's silhouette is a figure's, and only over the scene's cut-outs.** Decided
  2026-11-08 by the owner (*el círculo que se ve por encima debería ser muy fino y latente,
  como la silueta de los personajes, y solo sobre los objetos del escenario, no sobre los
  personajes*). Where a cut-out of the scene covers the goal's mark, the covered part of its
  ring is drawn as a figure's outline is behind a cut-out (D107): a line as thick as the
  figures' (`THICK` at the figure's scale), in their yellow, fading away and coming back with
  their beat, masked by copies of the cut-outs and, inverted, by copies of the figures
  (`MarkSilhouette`); where a figure stands over the mark, the figure covers it and nothing
  is drawn over the figure. The plan draws it so, thin, over its cut-outs and never over a
  figure. `data-marks-covered` names the marks a cut-out covers. Amends D160. Rules out a ring
  over the wizard's feet, and one thicker or brighter than a figure's outline.
- **D169 — The plan shows the things of a dark room.** Decided 2026-11-08 by the owner (*la
  llave debería salir en el mapa del niño travieso*). The plan draws a dark room's picture and
  the things lying in it, the key among them, lit or not, since the map knows the castle; only
  the dark tunnel hides its figures (D135). The scene keeps a dark room's things unseen until it
  is lit (D52), and the dark room's level asks the steps to be counted from `position`, since
  the key lies on another cell in each way (D153). Amends D163.
- **D170 — A lesson that teaches a principle runs plain Python (D174 takes it to every block).** Decided 2026-11-08 by the
  owner (*son lecciones teóricas; no nos hace falta el mago*). A page that teaches `print`, a
  variable or a sum carries a block without the wizard, run in the world of the level after
  the lesson as any block is (D142), what it prints the answer: in chapter 2, *Lo que saben
  las cosas*, page 3, prints a number, a sum and a string; *Encontrar cosas*, page 2, keeps a
  number and a string in variables and prints them, and page 3 adds two variables into a
  third and prints it. The variables' names in a block are the child's own words, Spanish in
  the Spanish lesson and English in the English one. Chapter 1's lessons keep their blocks as
  they are. Rules out a theory page with no code to run.
- **D171 — Where the tale does not let the child go on yet, the wizard says so.** Decided
  2026-11-09 by the owner (*pasarse de la marca, cuando hay sitio, no es problema; pero hay
  que pensar bien las barreras cuando no queremos que pasen a la siguiente parte aún*).
  Walking past the goal's mark is allowed wherever the scene has room. Where the tale does
  not let the child go on, into the castle before chapter 2, the cells beyond are the
  scene's `forbidden` cells with a reason of their own (D84), so that the wizard stops
  before them and says why in the child's words, never a wall it bumps into, with a star
  lost to the bump. In the field, *La entrada* (`the-way-in`) ends on the castle's open
  door's threshold, (8, 6), the goal's mark; the hall's cell beyond it, (8, 5), is floor,
  reached only through the open door, and forbidden with the reason `not_inside_yet`: *No
  entres todavía: quédate en el umbral, pasada la puerta.* / *Do not go in yet: stay on the
  threshold, past the door.* (the owner's words). *La puerta sellada*'s walk past its mark
  ends at the castle's door, shut and seen shut (the owner, 2026-11-09). Rules out a bump
  where a barrier is meant.
- **D172 — The goal's mark on a door's cell is whole once the door opens.** Decided
  2026-11-09 by the owner (*al estar abierta la puerta el círculo debe cambiar para verse
  entero, la máscara ya no debe afectarle*). While a door is shut, the mark on its cell lies
  under the door's picture and shows its thin silhouette (D160, D168); once the door shows
  its open picture, which paints the doorway's floor, the mark is drawn just over that
  picture (`markDepthIn`), under the figure standing in the doorway and the next rows'
  things. What covers a mark, its silhouette's masks and `data-marks-covered`, is what is
  drawn deeper than it, as for a figure (D107): of an open door, nothing. *La entrada*'s
  mark on the castle door's threshold, (8, 6), is the one mark on a door's cell in the
  game. Rules out a mark cut by a door that is no longer there.
- **D173 — A lesson with nothing worth trying has no block (D174 says which).** Decided 2026-11-09 by the
  owner (*probar `wizard.sleep()` donde no hay cama no tiene sentido, es forzado*). A
  lesson's *Try it* exists only where running something teaches something (D142); *Cada
  cosa en su sitio* (`the-right-place`) keeps its two pages of words, with no block and no
  `try` in its lesson.json, and its last button, *Seguir* / *Go on*, leads to the level, as
  *Notas*'s does; a content test holds that a lesson's `try` comes only with a block. Rules
  out a block written to have one.
- **D174 — A lesson's block tries an idea of the language, not the wizard.** Decided
  2026-11-09 by the owner (*las pruebas de código dentro de las lecciones son sobre todo
  para probar conceptos de programación complejos, sin pensar en el mago y demás;
  puntualmente se puede usar algún atributo del mago si lo necesitamos, pero no tiene
  sentido usar métodos, waits, etc.*). A block (D142) prints a value, keeps one in a
  variable, adds, compares, chooses with `if` and `else`, counts with `for`; an attribute
  of the wizard or of a figure, `position`, `facing`, `locked`, appears where the idea
  needs a value to look at, and a method that gives something back only on the page that
  teaches that very thing (*Lo que saben las cosas*' last block keeps the nearest door,
  `find_nearest("door")`, and prints its `locked`). No block moves the wizard, waits, picks
  up, casts, gives, opens or reveals: those are the levels'. A page whose words only present
  its block goes with it (D173), a sentence of it that taught something moving to the page
  before, and the lesson's last button goes on to the level. Chapter 1's first programs,
  `move_right()`, two lines, an argument, are the one exception: there the block is the
  idea itself. In chapter 1, *Palabras*, *Cosas que llevar* and *Tu primer hechizo* have no
  block; in chapter 2, *Lo que saben las cosas* is one lesson of eight pages before *El
  libro perdido* (*Encontrar cosas* one with it), and *Dar cosas*, *Llaves y puertas* and *Un
  hechizo que alcanza* have no block; in chapter 3, *Las casillas*, *Esperar*, *Mientras*,
  *Luz y trampas* and *El portal que no se cierra* have none, *Si*'s prints whether Dask
  looks up and the wizard's cell, and *Las dos coordenadas*' prints a position's two
  numbers. The runner still runs what the child types, a walk or a spell. A content test
  holds the lessons with nothing to try. Rules out a block written to have one, and a
  lesson of three pages where two are a button.
- **D175 — The card waits for the words, and the words last as long as they take to
  read.** Decided 2026-11-09 by the owner (*si hay un diálogo abierto, debería esperar a que
  se acabe antes de mostrar el cuadro de fin de pantalla, en general, para todas las
  pantallas*). A bubble or a thought in a level stays for its reading time, 0.8 seconds and
  50 thousandths more for each of its characters, in ticks of 400 milliseconds, three at
  least (`readingTicks`): a greeting three ticks, the threshold's sentence of 58 characters
  ten. Once a run is over, no tick ends them, and each goes when, on the scene's clock, it is
  read to its end. The outcome's card of a level appears once no bubble and no thought is on
  the scene: the controller waits for the scene's `settle(won)`, the longer of the
  celebration of a run won (14.3) and the words read to their end (`Speech.settle`), after a
  run refused, failed or lost alike; a sleeper's thought, said for ever, is not waited for.
  In a story a bubble stays until its step ends. Rules out a card over the reason the wizard
  stopped, and a sentence gone before it is read.
- **D176 — A bonus for casting a spell is earned by the spell, not by the word `cast`.**
  Decided 2026-11-09 by the owner (*si he hecho mal el hechizo no debe marcar el bonus
  extra*). A goal of kind `cast`, `{"kind": "cast", "spell": "orvim"}`, names a known spell
  and is met at the tick the world notes a `cast` event of it; a spell refused, unknown or
  with nothing to act on is a `blocked` event and meets nothing. *El pasillo de las puertas*
  gives its bonus by it, and *El paseo nocturno* has `osto`'s as a goal. `uses` keeps its
  place for a member read or called, `closed`, `position`, `x`. Rules out a star for a
  misspelt spell.
- **D177 — A stop is not an outcome.** Decided 2026-11-09 by the owner (*si hago stop, no
  debe decir que se ha superado el nivel, debe parar ahí y no evaluar*). *Parar* pressed
  while the program runs interrupts it; pressed while the scene plays it out, it leaves the
  figures where they are. Neither shows a card, judges a goal, gives a star or marks the
  level done: the run's result says who asked for the interrupt (`interrupted_by`, the
  child or the clock), the controller ends a run the child stopped with no outcome and its
  status ready, and the editor keeps the child's code for *Ejecutar* to run again from the
  start; such a run is not counted among the runs before a win for the first-try star
  (D57), never having been judged. The one stop that keeps its card is the clock's, a
  program that did nothing for its seconds, with the words it has. Rules out a win card
  after a stop.
- **D178 — A hole that never closes on its own, and `osto` the only way across, taught
  after the `while`.** Decided 2026-11-09 from the owner's question (*había un sitio donde
  se sujetaba un agujero en el suelo, pero no veo eso en ningún nivel, ¿por qué?*) and their
  rule (*no quiero que el niño use osto y evite el while*). `osto` is taught once the
  `while` is practised: *Luz y trampas* teaches `kirra`, `hole.open` and `hole.closed` and no
  spell for the hole; *El agujero que se abre* does not know `osto`, which is refused there
  as an unknown spell; a short lesson of its own, *El portal que no se cierra*
  (`the-portal`, Lesson 11, no block, D174), after the story *Voces en el muro* and before
  *El paseo nocturno*, teaches it. A hole with `"period": 0` is open from tick 0 and at every
  tick, a dark portal that never closes by itself, and is closed only while `osto` holds it,
  from the next tick, for HOLD_TICKS (D167); the page draws it so (`hole.ts`). *El paseo
  nocturno*'s hole is one: `osto`, cast from the cell above it, is the way across, a goal of
  the level (D176), and a `while` waiting for it to close ends at the tick limit; the
  chapter's last level uses both its spells. Rules out a spell taught, summed up in the
  story, and never cast, and a spell that spares the child the loop.
- **D179 — The browser tests run on GitHub at a release, and by hand.** Decided 2026-11-09
  by the owner, on the designer's proposal, after every run of 2026-11-09 and the one of
  0.0.2 failed there: GitHub's runner takes 1.8 hours for the 288 browser tests, and six of
  them, the ones that wait the longest in real time, run out of their time, while every one
  passes on hija. On GitHub the `check` job (`ci/check.sh`) runs on every push and pull
  request; the `e2e` job (`ci/check.sh --e2e`) runs on a version's tag (`v*`) and when
  started by hand (`workflow_dispatch`). The gate stays `ci/check.sh --e2e` on hija, once
  before a sprint's last commit, each piece checked with `ci/check.sh` and the browser tests
  it touches (the owner, 2026-11-09). A release tags its version commit, `git tag -a
  v<version>`, before `ci/push.sh`, which pushes with `--follow-tags`; a tag on a commit it
  dates again is made again on the commit's new self, with its message, dated now, and a tag
  on a commit already pushed goes up alone. Rules out two hours of a private repository's
  minutes on every push, and a red check that says nothing about the code.
- **D180 — A lesson's block that walked says the walk, not the cell.** Decided 2026-11-10 by
  the owner (*no tiene sentido poner coordenadas si no sabes dónde empieza el mago; debería
  tomarse la posición inicial, ejecutar los movimientos y tomar la posición final, y mostrar
  "el mago se movió tres pasos a la derecha" o "dos pasos hacia abajo y uno a la
  izquierda"*). Under a block's editor (D142), when something moved the wizard, a step of its
  own or a door that shoved it, the page says how far it went: the difference between its
  cell before anything moved it, where the world starts it in the first way (D51), and its
  cell at the end, each axis in its direction (`runSaid`'s `moved`, `walkText` in
  `lessonrun.ts`). The steps down or up come first, and the sideways ones after them
  without the word for a step: *{El mago|La maga} se ha movido 2 pasos hacia abajo y 1 a la
  izquierda.* / *The wizard has moved 2 steps down and 1 to the left.*; one axis alone,
  *... 3 pasos a la derecha* / *... 3 steps to the right*; one step, *1 paso* / *1 step*; a
  walk that ends where it began, *{El mago|La maga} ha vuelto a donde empezó.* / *The wizard
  has come back to the start.* (the order, the second part's words and the English are the
  owner's choices of the same day). The numbers are digits. The cell's numbers are never
  said: a child who has not met the grid (chapter 3) has no use for them, and one who has
  prints `wizard.position`. Everything else under the editor stays: what was printed, the
  reason a step was refused, the quiet end. Rules out *ha terminado en la casilla (4, 5)*
  under *Qué es un programa*.
- **D181 — A mark is covered only by what is painted over it.** Decided 2026-11-10 from the
  owner's finding (*la máscara donde está el círculo de destino no está ajustada al borde de
  la puerta, y hace que el círculo cambie a silueta lejos del arco de piedra*) and answer
  (*no es problema que el círculo esté detrás del arco, solo era problema que la máscara no
  encajaba con el arco*). The goal's mark's ring (D160, D168) shows its silhouette only
  where a cut-out's paint lies over the mark, where the eye sees what covers it; what
  covers counts a cut-out's pixels of alpha over a half (`ringCoveredShare`). A cut-out
  Gemini marked flat magenta takes the outline beside it (D148, `rimmed`), which reads dark
  pixels as ink: round a dark opening it would take the opening's dark beside the stones for
  outline and spread into it, a band the colour of the ground. An arch round a dark opening
  is `lined` in its settings instead, its stones and their own line (`image_first.lined`).
  In *El pasillo de las tres puertas* the top arch is so: the mark on (10, 0), in its
  opening, lies behind its stones, the silhouette of its ring over them and nowhere over
  the opening, from the start to the end; the scene's other arches, round doorways that are
  not dark, keep their rim. The other marks of chapter 3 covered at a level's start,
  *Pasar al profesor*'s and *El paseo nocturno*'s on (10, 13) and *El agujero que se
  abre*'s on (5, 7), lie behind an arch's or a jamb's stones. Rules out a silhouette where
  the eye sees floor or an opening.
- **D182 — A thing may be drawn from a sprite of its kind, on any scene.** Decided
  2026-11-10 by the owner (*los aros los dibuja el juego*), after Gemini ignored the
  columns asked for in three race courses. A kind of thing may have a picture of its own,
  `content/art/things/<kind>.webp`, listed in `content/art/things/things.json` with its
  size in cells (`size`, width and height), the point of the picture that stands on its
  cell's lower edge (`foot`), and whether it lies flat (`lying`, drawn under whoever
  stands on it); its source is in `SOURCE.md`. A thing on a painted scene with no cut-out
  of its own, whose kind has a sprite, is drawn from that sprite at its cell, among the
  figures by its row, scaled by the scene's cell as a figure is, the same on every scene
  (`engine/things.ts`, `data-sprite-things`). A sprite is cut from a picture by
  `tools/art/sprites.py sprite`: one painted alone on flat magenta is keyed out, and its
  rim of magenta's shades, a shadow or an edge painted on the magenta, cleared from the
  outside in; one painted standing on a lawn (`--lawn`) is freed of the lawn by its
  colour, and only its largest piece is kept. The broom is such a kind, painted alone,
  and the ring, cut from Gemini's painting of a small ring field. Rules out a picture of
  each broom and each ring painted into each scene, and a scene asked again for every
  arrangement of them.
- **D183 — The broom is a thing, knotted and untied.** Decided 2026-11-10 by the owner.
  `broom` is a kind of thing, found by `find_all` and `find_nearest`, carried
  (`carrying`) from the first flight on, with the attribute `knotted` (true while the
  black thread is tied in its twigs) and the method `untie()`. Untying works only from
  the broom's own cell, as `pick_up` does, and is refused `too_far` from anywhere else; on
  a broom that is not knotted it is an error that ends the run (`no_knot`, *esta escoba no
  tiene nudo*), after a `blocked` event the wizard thinks: the precondition that teaches
  the `if` in the loop. Untying takes a tick and makes the event `untie`, the wizard
  bending over the broom. A level gives a broom's knot in `level.json` (`"knotted":
  true`, false by default) and may change it by way (D51). The goal `untied` is met when
  no broom in the level is knotted, and failed at the run's end otherwise; the goal
  `no_error` is failed by an error, so that the friend's program that stops on a broom
  with no knot loses even where it untied the others. Rules out a counter-spell for the
  knot, and an `untie` from afar.
- **D184 — `find_all`, `len` and a count said.** Decided 2026-11-10. The lesson on lists
  teaches `wizard.find_all(kind)`, which gives every thing of a kind as a Python list,
  nearest first, a hung thing as near as the cell under it (D206), ties by row and then
  column, hidden ones found as `find_nearest` finds them, and `len`, which the sandbox lets through among the builtins. A hidden thing found
  makes the world's `found` event, in the tick of the call or before the first tick, and
  the page draws it from then on: the brooms under the straw are not seen until a program
  looks for them, and those on the bare boards are seen from the start (D202).
  `wizard.say` takes a number as it takes a word and says its digits; a list is refused.
  The goal `say` takes `"count_of": "<kind>"` in place of `"text"`: met when the wizard
  says the number of things of that kind the way played has. The notebook's words for
  `find_all` and `items` show `len`. Rules out counting brooms by eye, and a `say` goal
  written once per way.
- **D185 — Flying: `drevo` lifts the broom, the moves fly, and a flown cell takes a third
  of a walked one.** Decided 2026-11-10 by the owner (*cuando se vuela se debe mover por
  lo menos 3x*). `wizard.cast("drevo")` needs the wand and a broom carried (refused
  `no_broom`), takes a tick, makes the event `fly` and puts the wizard in the air
  (`wizard.flying`); from then on every `move_*` flies: it crosses the low cells (D186)
  and the rings' cells (D187), and bumps on the high ones as a walk bumps on a wall. When
  the program ends over a cell that is walked on, the broom sets down where it is (the
  event `land`); the wizard's own landing, and an end over a cell that is not walked on,
  are D215. The world counts a flown cell as one tick, like a walked one, so that
  counting stays the
  child's; the page plays a tick whose every move is flown in a third of a tick
  (`FLOWN`, `engine/flight.ts`), at every speed, so that a flight is three times as fast
  to the eye and the long flights of the rings and the race pass quickly. While flying,
  the figure is drawn from its flying rows (D188), lifted half a cell above its cell,
  its origin moved so that its depth stays its cell's, with a soft shadow on the ground,
  bobbing over the rows' three frames; a sheet with no flying rows bobs a little
  instead. The steps' taps are not heard in the air; the flight's sound is a wind
  synthesised as the steps are (the owner's choice: no sample), filtered noise that
  starts at the lift, swells a little with each flown step and fades at the landing
  (`engine/sound.ts`, `wind` among `data-sounds`). Rules out a `fly_right` family of
  methods, and a flight as slow as a walk.
- **D186 — Low and high: what a flight crosses.** Decided 2026-11-10. A scene's terrains
  say whether a flight crosses them (`fly`, false unless given; a terrain walked on is
  flown over): a low terrain is flown over and not walked on (water, reeds, a hedge, a
  fence, a bench, a chest, a stand), a high one neither (a tree, a wall, the shed, a rock,
  a tall pole, a gate). A plain map writes a low cell `~`. A walk into a low cell is
  refused with the cell's kind (`no_walk`; *el agua no se pisa: por aquí solo se pasa
  volando*, `blocked.no_walk.<kind>`); a flight into a high cell bumps (`by: high`; *las
  copas de los árboles no se pasan: hay que rodearlas*, `blocked.high.<kind>`). The plan
  window hatches a low cell lightly and a high one darkly; `?debug` crosses a low cell in
  blue and a cell no one walks on or flies over in red, and the legend names the low ones.
  Rules out one "blocked" kind for everything a wizard does not walk on.
- **D187 — The ring: flown through in order.** Decided 2026-11-10. `ring` is a kind of
  thing drawn from its sprite (D182), standing on a cell no one walks on; the wizard flies
  through it by crossing its cell in a vertical move, from the row above to the row below
  or the reverse, which makes the ring's event `through` and lights it; a horizontal move
  into its cell while flying bumps (*chocas con el aro*), and a walk into it bumps as into
  furniture. The goal `through_in_order` (`{"kind": "through_in_order", "ids": ["ring_1",
  ...]}`) is met when every ring named is flown through, each after the one before it in
  the list; a ring passed over, or flown through out of its turn, counts as missed, and
  the goal's `missed` lists the rings not flown through in order, for the race (D189).
  `?debug` numbers the rings in their order. Rules out a ring the wizard walks under.
- **D188 — Flying figures, Zarek and Rinlo.** Decided 2026-11-10 by the owner (*van a ser
  nuevas hojas de sprites*). The wizard's sheets have four flying rows after the sleeping
  one (`rows.fly`, one a way, three frames: level, a little up, a little down, for the
  bobbing), made from Gemini's edit of the walking base of each gender (the figure
  sitting on a broom, legs together, the handle ahead and the twigs behind,
  `tools/art/prompts/figure-fly-<gender>.md`) and recoloured into the eight looks as the
  casting rows are. Zarek and Rinlo, pupils a year older, are drawn whole by Gemini from
  the cast's own figures as a reference, standing in the four views
  (`figure-zarek-standing.md`, `figure-rinlo-standing.md`), each view a little taller in
  its frame than a first-year's, between the children's and the grown-ups' (`DRAWN`,
  `figures.py --drawn`); their walking rows are the standing frame three times. Zarek has
  flying rows from Gemini's drawings of him riding the broom in the same views, both
  hands on its handle, as a racer holds it (`figure-zarek-fly-down.md`,
  `figure-zarek-fly.md`, `--drawn-fly-view`); Rinlo stands only. `figures.json`'s `sheets`
  says each one's rows. Ilda's sheet stands. Rules out a wizard flying in its walking
  frames.
- **D189 — The race: Ilda's count.** Decided 2026-11-10 by the owner (*ticks + líneas +
  aros saltados*), made visible as the owner asked to see it rather than read it. A race
  level names a racer (`"race": {"against": "zarek", "lines": 14, "path": [...],
  "finish": [x, y]}`), an actor of kind `racer`. Before the start Ilda reads both
  programs, a tick a line (the lines `lines_under` counts: neither blank nor a comment),
  the line read lit in the editor (the event `read`), while the wizard stands on the
  start; the racer lifts his broom the tick after his own `lines`, as the wizard does with
  drevo, and flies his `path` from there, its turning points flown in straight lines, a
  cell a tick; a point the same as the one before is a tick circling in place (a
  flourish, the event `circle`), which lets his flight's ticks be any number, and he
  crosses the finish at the tick his path reaches it. A ring the wizard missed (D187)
  costs five ticks before the finish line, served circling over the cell before it. The
  goal `before` (`{"kind": "before", "racer": "zarek"}`) is met when the wizard crosses
  the finish at a tick lower than the racer's; a tie is the racer's. A band over the scene
  says Ilda reading (*Ilda lee los programas: tú, 11 líneas; Zarek, 14*) and the ticks to
  each take-off; the win and the outcome cards say her count from the goal's `params`:
  *tus líneas (11) + tu vuelo (38) + la penalización (0) = tick 49. Zarek: 14 + 41 = tick
  55*. In *La carrera* the program without a function, 18 lines, crosses at 56 against
  his 55; in *La revancha* Zarek's 12 lines cross at 50, and the race's function, its
  arguments unchanged, misses three rings. Rules out a race won by a long program that
  arrives first, and a penalty the child cannot see.
- **D190 — A function is taught where a loop cannot serve.** Decided 2026-11-10 by the
  owner (*hace que la función sea útil*). The rings' level repeats the pair of rings three
  times with a different manoeuvre between each pair (under the trees, over the pond), so
  that a `for` cannot cover the repetition and `def two_rings()` is called from three
  places: a loop round the pair flies into the trees' crowns. The race's pairs differ in
  their gaps, so that arguments are the only way to keep one function, and Ilda's count
  makes the program without a function lose by one tick (D189); the rematch moves the
  rings and sharpens Zarek, so that only the arguments change and no line may be spared.
  Rules out a `def` whose only reason is a lines goal a `for` would meet.
- **D191 — The browser tests on GitHub run with three times the time.** Decided
  2026-11-10 from the tag run of v0.0.5, which lost three tests by time alone (D179).
  Under `CI`, Playwright's test timeout is 360 s and its expect timeout 45 s
  (`app/playwright.config.ts`), and the specs' own waits are three times theirs through
  one helper, `ciTimes` in `app/e2e/support.ts`; a wait of under 400 ms, a sample within a
  tick, stays as it is. `retries` stays 1. `ci/push.sh --tags` refuses a tag whose commit
  does not carry the tag's version. Rules out a release whose tag run is red by the
  runner's speed.
- **D192 — Every chapter has a score of its own, made by the game from notes.** Decided
  2026-11-10 by the owner (*cada capítulo debe tener una banda sonora apropiada, ajustada a
  la hora del día, el ambiente, si es exterior o interior, si es de noche y en secreto*). A
  theme is a file `content/music/<id>.json`: its tempo, its metre, its one set of voices
  (D210), and its sections of notes (pitch, start, length, loudness), which follow one
  another in their `order` and loop without a seam, no note ringing past its section's
  end. The page plays it with Web Audio (`engine/music.ts`): voices of nine kinds, a
  celesta's bell, a bowed string pad, a plucked string, a harp, a flute, a piano's struck
  tone (D209), a horn and a march's snare (D213) and a soft drum, each an oscillator or
  two or a burst of noise with an envelope, the pad on lines that sound on from a note to
  the next (D203), through a reverb whose impulse is decaying noise; the notes are
  scheduled a third of a second ahead on the audio clock; no sound file is loaded. A
  chapter's `chapter.json` names its theme (`music`), which the
  course carries; a story, the map and the start screen play their chapter's theme at its
  written loudness, a lesson and a level every voice of it at 0.4 (D210), the map and the
  start screen in the chapter the child is in; the settings and the creator leave what
  plays. A change of loudness or of theme fades over two seconds. The music starts at the
  first gesture on the page, as a browser asks, goes on across screens without a break,
  and is still while the tab is hidden. The settings have the music's volume beside the
  sounds' switch, a slider from none to full in five steps (`music`, 0.6 at first, kept
  with the settings); at none no theme plays. The root element says what plays
  (`data-music`: `waiting`, `playing`, `off`; `data-music-theme`; `data-music-heard`,
  `story` or `level`), and `?debug#music` plays any theme alone, its voices to hand
  (D203). The themes are original, written for this game as a score in
  `tools/sound/compose.py`, each melody a bar at a time and each section's harmony a chord
  a bar from which the accompaniments are made, and shipped under the GPL as the code is:
  *Arrival* (dusk, outdoors, glad: a march in four in G, a celesta's skipping tune over a
  plucked bass, a flute's answer, a drum), *The library* (indoors, evening, calm: slow in
  four in A minor, a piano's phrases and the celesta's answers taking turns over a harp that
  climbs), *The passages* (night, a secret, time running: in four in A minor with its
  lowered second, a string plucked on every eighth note as a clock over a piano's low notes,
  a horn's long notes and a piano's tune far under them), *The broom* (a race: fast in four
  in E minor, a piano's short climbing cells over a low voice that runs in eighth notes, the
  drum on every beat) and *The familiar* (the tower: a slow chorale in C that opens out, the
  flute taking its top line). A test holds every chapter to a theme, every theme to its
  rules, and the files to what the score makes. Rules out loaded music files and a score
  that names or quotes any work under copyright.
- **D193 — The page's look, and a welcome page.** Decided 2026-11-10 by the owner (*una
  página inicial de bienvenida que explique y venda qué es Kydux; el arte de todas las
  páginas: fondos, botones, cajas; limpio y fácil de usar para un niño, un poco más
  acabado y fino*). One look for every screen, written once at the top of `style.css`
  as tokens and components. The palette is taken from the paintings: parchment for the
  page, paper for what lies on it, ink for the words, moss green for a button and what
  is done, a warm gold for what is chosen and for the focus ring, a sky blue for links,
  a soft red for a warning; with the radii, two shadows, the spaces and the type (the
  interface's sans serif, a serif for the story's words, the monospace for code) beside
  it. The page's background is the parchment with a fine grain, an SVG noise written in
  the stylesheet, no file. The components: a button stands on a darker foot and sinks
  onto it when pressed (`.button`, `.big-button`; `.quiet-button` paper with an ink line;
  `danger` soft red), a card over the scene and a panel on the page are paper with a
  thin ink line and a soft shadow (`.card`, `.panel`), a chip is a small gold label
  (`.chip`), a field is paper with an ink line. The screens keep their layout and their
  `data-*` hooks; their colours, borders, radii and shadows are the tokens'. The header
  has Kydux's mark, a pointed hat and a wand in ink and gold drawn as an inline SVG
  (`ui/mark.ts`, the tab's icon `favicon.svg` the same), and the link to the welcome page.
  The welcome page (`#about`, `ui/about.ts`) opens on a painting of Arvelia on its hill
  above the lake at dusk, the village at its foot (Gemini, `welcome-castle.md`), with the
  promise and its big button over it; then what Kydux is, for whom (from eight years
  on), how it is played (the game, the story and the lessons, in that order, each with a
  picture of the game in the page's language, `app/public/about/<lang>/`), that it is
  free software of the Kidux
  family in English and Spanish, and the button again; its words are under `about` in
  the i18n files. A first visit, with no wizard, no saved game and no address, opens on
  it (the owner, 2026-11-11: *si nunca ha jugado y acaba de llegar, prefiero que haya una
  landing page que explique algo*): the button says *Start playing* and begins the story
  (D61). A child who has played opens on the start screen, where *Continue* goes on; from
  the welcome page, reached by the header's link, the button says *Play* and goes back to
  the start screen. The start screen, before a wizard is made, shows the welcome's first
  part, with a link to the rest. The map's
  chapters each have a card, a band of the chapter's first level's scene cut small by
  `tools/art/chapter_cards.py` into `content/art/chapters/<id>/card.webp`, the title
  over it on a dark veil; a chapter whose first stop is locked is greyed. Rules out a
  page that looks like a form, and decoration that gets in a child's way.
- **D194 — Portraits of every character and of every look.** Decided 2026-11-10 by the
  owner (*imágenes buenas para todos los personajes, para las lecciones cuando hablan y
  para la selección del personaje*). A portrait is a bust, head and shoulders, in
  three-quarter view looking a little to the left, painted as the figures are: Gemini
  paints it on flat magenta from the character's front frame in its sheet, so that the
  face, the hair and the clothes match (Ilda, Dask, Wenna, Baro, Eldra, Nuri and Teku in
  their first colours, Zarek, Rinlo), or from the cast's figures for the style where the
  character has no sheet (Orla, Bimo), `tools/art/prompts/portrait-<id>.md`; `tools/art/
  sprites.py portrait` keys it out, clears its magenta rim, keeps its largest piece and
  scales it into a square of 512 pixels, the cut of its chest on the bottom edge,
  `content/art/portraits/<id>.webp`. The wizard's portraits are one base bust a gender,
  painted from the base sheet's figure in the base sheet's colours (`art/figures/
  portrait-wizard-<gender>.webp`), recoloured into each look by `figures.py --portraits`
  (`wizard-<look>.webp`, one a look, a look being a gender's): a bust's parts are read by
  `portrait_parts`, since a hat's brim lies below its band: the cloth's large pieces are
  the robe where they reach the bust's foot and the hat elsewhere, the band the gold
  beside the hat, the stars the gold on the robe, the skin light and warm, the hair the
  large warm dark pieces without the thin lines of the outline. A lesson's page shows its
  teacher's portrait where the figure stood, with the name under it; a card's speaker and
  a story's speaker, while a figure speaks in its bubble, show a small portrait beside the
  name (the friend and the mate as the wizard's gender makes them); the creator shows the
  gender's four looks as portraits and the chosen one large beside the name, and the
  start screen the wizard's and each saved game's (`ui/portraits.ts`; `data-portrait`
  names the file shown). The pixel figures the page drew for these places are gone. A
  test holds every character a text makes speak, and every look, to a portrait. Rules out
  the pixel busts, and a portrait that does not match the figure's colours.
- **D195 — A broom hangs on a peg, and is untied from the cell under it.** Decided
  2026-11-11 by the owner (*habrá que poner las escobas colgadas; hay que hacer la
  imagen de una escoba colgada y ver cómo se posicionan para que encajen en el gancho
  perfectamente*). The shed's rack holds eight pegs, one in the middle of each cell from
  column 6 to 13, laid by the tool from the painting's own peg (`repaint.py pegs`,
  which fills the painting's pegs over and draws the board out to the rack's ends).
  A hanging broom is a thing of kind `broom` with `"hung": true`, on its peg's cell,
  (x, 4) in the shed, furniture no one walks on; `untie()` works from the cell under it,
  (x, 5), the row under the pegs, which is walked (D211), as a door opens from beside
  it, and is refused `too_far` from anywhere else (`under` in `level.py`). A broom on the
  floor is untied on its own cell (D183). The page draws a hung broom from its kind's
  hung sprite, `broom-hung` in `things.json` (Gemini's broom hanging by a loop of cord
  from a peg), which hangs from its top (`anchor: "top"`): its `origin` is the sprite's
  own peg, laid over the scene's peg's point (`foot`, given from the peg's cell), at its
  row's depth, behind a figure standing under it (`engine/things.ts`); the barrel at the
  rack's left end, a cut-out of row 5, is drawn over the brush of a broom hung on peg 6,
  whose cord and handle show over its top (D211). `data-sprite-things` names it
  `broom-hung`. Rules out brooms "in a row on the floor", and a hung broom drawn off
  its peg.
- **D196 — What `find_all` and `find_nearest` find depends on where the wizard
  stands.** Decided 2026-11-11 by the owner (*find_all depende de dónde estés: junto a
  la pared, solo encontrarás las escobas colgadas; cerca de la paja, las que están
  tiradas bajo la paja*). A level may name `zones`, `{"<name>": [[x0, y0, x1, y1],
  ...]}`, each a list of boxes of cells (`Level.zones`); a thing may name its `zone`. A
  thing with a zone is found by `find_all` and `find_nearest` only while the wizard
  stands in that zone (`_nearby`); a thing without one, and every actor, is found from
  anywhere; with nothing found, `find_nearest` gives `None` and `find_all` an empty
  list. A thing's zone is one of the level's, and holds the cell the thing is found
  from: its own, or, for a hung broom, the cell under it. The level handed to the page
  carries its zones: the plan window hatches each zone's cells lightly, the other way
  from the low cells', and writes its name on its first cell (`plan.zone.<name>`:
  *junto a la pared*, *en la paja*); `?debug` frames each zone's cells in a colour of
  its own and names it in the legend. In the shed the zone `wall` is the row under the
  pegs, row 5, from which the hung brooms are found and untied, and the zone `straw` is
  the floor away from the wall, rows 6 to 8 and (5, 8) (D211); it keeps its name, *en la
  paja*, though most of its brooms lie on the bare boards (D202). *El cobertizo* names
  the zone `wall` alone, its hung brooms in it and its lying ones in none, and forbids
  the row under the pegs (D205); the plan hatches and names zones only where a level
  has two. Rules out a `find_all` that sees through walls into
  every corner of a place.
- **D197 — The broom is taught before the lists, with a practice of one `untie`.**
  Decided 2026-11-11 by the owner (*una primera práctica sencilla: una escoba justo a tus
  pies, búscala con find_nearest y quítale el nudo con untie*). The lesson `the-broom`,
  *La escoba y su nudo*, comes first in chapter 4, after the story: the broom is an object,
  `knotted` says whether the black thread is tied in it, `untie()` takes it off from the
  broom's cell or from under it where it hangs, and `find_nearest` finds it, as it found a
  key; its second page is D196's rule, with the shed's two places as the example. Two
  pages and no block (D174). The practice `the-broom-at-your-feet` follows: one broom by
  the door, at the wizard's feet, one `find_nearest` and one `untie`; its `untied` goal
  names that broom alone (`ids`), the hung ones above it being for the eye. The lesson
  unlocks `broom.untie`; `broom.knotted` is unlocked by *An if inside the loop*, where it
  is used. Rules out `untie` used in a level before it is explained.
- **D198 — The lists' lesson teaches one element by its index; the loop's lesson shows
  both ways.** Decided 2026-11-11 by the owner. `lists` has a third page, *Uno de la
  lista*: `nombres[0]` is the first, counting from 0 as the cells do, `nombres[2]` the
  third; asking for one the list does not have, `nombres[3]` in a list of three, is an
  error the world explains in the child's words, `index_range` with the list's length and
  the place asked for counted from 1 (*La lista no tiene tantos: tiene 3, y pediste el
  4.º*), read from the failing line's names and numbers, or `index_range_unknown` when the
  line does not say it so plainly; a lesson's run explains it too. Its block prints the
  first and the last. `for-each` has two pages, each with its block: `for broom in
  brooms:`, and `for i in range(len(brooms)):` with `brooms[i]`, the index counting the
  turns, with when each way is handy. No level asks for the second way, and a level may
  be won with either: *Las escobas de la pared* has a second solution written with the
  index (`solutions/by_index.py`), which the content tests win in every way with three
  stars, as they do every program in a level's `solutions/`. Rules out a child who meets
  `[0]` for the first time in a challenge, and a way the course shows that no level is
  proved to take.
- **D199 — A story step may frame a place.** Decided 2026-11-11 by the owner (*al
  entrar al cobertizo la cámara se centrase en el cobertizo, para que se vea entero*).
  A step's `camera` may be `{"fit": [[x0, y0], [x1, y1]]}`: the page zooms out as far as
  it must, and no further than its zoom of 1, to show that box of cells whole, centred
  on it (`boxFrame`, `SceneCamera.place`); or `{"wide": true}`: the scene's playable
  width, on the window's middle (the wide fields). The framing holds, the camera
  following no one, until a later step of the same part frames another, and the story's
  steps without one keep it (`framingAt`); a part told on another scene starts with
  none. The world checks the box against the scene. A bubble said under a framing
  stays inside what the framing shows of the scene (`bubbleRoom`,
  `SceneCamera.shown`), since the camera does not follow the words. The scene's parent
  says it in `data-camera-fit` (`x0,y0,x1,y1` or `wide`). Rules out a story where a
  place is seen in pieces.
- **D200 — The map folds by chapter.** Decided 2026-11-11 by the designer under the
  owner's rule for the look (D193: clean, nothing crowded). The map shows each chapter
  as its card. The chapter the wizard is in stands open, its stops listed
  (`chapterStandings`: the first chapter neither finished nor locked, or the last one
  reached once every one is finished), and so does the chapter of the stop being
  played. A finished chapter is folded under its card, with its stars' total
  (`map.stars_total`) and *Desplegar* (`map.unfold`), which unfolds it, *Plegar*
  (`map.fold`) folding it again. A locked chapter is folded and greyed, its first stop
  named and the rest hidden. Under `?debug` every chapter stands open. A chapter's fold
  is remembered while the page lives, not kept. A chapter's section says
  `data-folded`, `data-finished` and `data-current`. Rules out a map that scrolls
  through every stop of every chapter to reach today's.
- **D201 — A level may frame a place.** Decided 2026-11-11 by the designer, from the
  walkthrough's pictures of the shed's levels, where the start's view sat low on the
  figures in the straw and the goals' panel lay over the pegs. A level's `level.json`
  may say `"camera": {"fit": [[x0, y0], [x1, y1]]}`, as a story's step does (D199):
  at the level's start, and again at each start over, the page shows that box of cells
  whole, zoomed out as far as it must and no further than its zoom of 1, centred on it
  (`SceneCamera.frame`, `boxFrame`). A run keeps it while the wizard stands inside the
  box (`LevelFraming`, `SceneCamera.runs` and `hold`); once the wizard leaves it, or the
  child drags the camera or presses *Find my wizard*, it is let go and the camera is the
  wizard's, until the next start frames the place again. Zoom, drag and *Find my
  wizard* work as everywhere. While the place is held a bubble stays inside what it
  shows (`bubbleRoom`). The world reads the box (`_level_camera`): on the scene, not
  turned round, and holding the start, every marker and every thing of the level in
  each of its ways. The scene's parent says the box held in `data-camera-fit`, and what
  the camera shows, in cells, in `data-world`. The shed's five levels frame
  `[[3, 0], [16, 10]]`: the roof's row, the eight pegs, the straw and the door's
  threshold in view, and no peg under the goals' panel or the zoom's buttons at 1280
  by 800. A level with no `camera` starts as it does without one. Rules out a level
  whose things lie under the page's own panels as it opens, and a shed seen in pieces.
- **D202 — The lying brooms: in sight on the boards, hidden on the straw's seven
  cells.** Decided 2026-11-12 from the owner's list (*las escobas que están en la paja
  solo pueden estar en las casillas: (6,6), (7,6), (5,8), (6,8), (12,8), (13,8), (13,6)*),
  after their rule of 2026-11-11 (*Hay que colocar algunas a la vista (donde no hay paja)
  y otras escondidas (donde sí hay paja)*). The shed's `scene.json` names its straw cells,
  `"straw": [[6, 6], [7, 6], [13, 6], [5, 8], [6, 8], [12, 8], [13, 8]]`, the cells the
  picture paints straw on. A lying broom on a straw cell is `hidden` until a program finds
  it (D184); a hidden broom lies nowhere else. A lying broom in sight lies on the boards of
  rows 6 to 8, off the straw cells and off (13, 7). (5, 8) is floor: a broom on it is
  untied from its own cell (D183), and a figure on it stands in front of the bench. The
  brooms on (13, 6) and (13, 8) are drawn a little to the left, clear of the standing
  bales (D207). The content's tests hold every level, every way and every story step in
  the shed to this (`test_broom.py`). Rules out a hidden broom on the boards, and a broom
  in sight on the straw.
- **D203 — The pad is low and unbroken, and a chapter's theme is chosen by ear.** Decided 2026-11-12 by the owner (*debería tener mucho menos volumen en general,
  para que las notas más agudas y punteadas se noten más y esto solo rellene y dé cuerpo
  al sonido, y además debería ser continuado*; *para cada capítulo 3 canciones distintas
  para que pueda elegir, una más animada, otra más tranquila y la otra el punto medio*;
  *activar y desactivar dinámicamente cada instrumento, y quizás también cambiar los
  volúmenes*). The bowed pad, the `strings` kind, fills under the other voices and never
  leads: a note of it sounds at 0.07 of its loudness. It is played on lines, each two
  saws a little apart in pitch through a low-pass filter and a gain, which sound on from a
  note to the next: a note takes the line whose note is over as it starts, the nearest in
  pitch, or a line of its own where none is free; where a note follows another the line
  slides to its pitch, with no fall and no new attack, and where none follows it dies
  away. A chord held into the next is so one sound that changes its notes, across a
  section's end and the loop's too. On `?debug#music`, over the list, the theme playing
  shows its voices, each with a box that silences it or lets it sound and a slider for its
  volume, from 0 to 1; a voice set by hand sounds at that volume (`music.mix`), until
  another theme, or the same as a story or a level hears it, is asked or *As written* is
  pressed, and a line says what is set apart from the theme's file, as `the-broom: tune
  0.50, strings off`, to be told to who writes the score. The owner chooses a chapter's
  theme by ear among candidates written in its manner (D209); a chapter names its theme,
  never a candidate. A voice of the `strings` kind that carries a tune, as *The
  familiar*'s `choir`, is a voice apart from the pad, written louder. Rules out a pad
  whose notes stop and start, a pad that covers the tune, and a theme chosen from its
  score without being heard.
- **D204 — The child is told what may differ at each run, never of ways.** Decided
  2026-11-12 by the owner (*No hay que hablar de las maneras en ningún lugar de ningún
  capítulo. Eso es una cuestión de como está programado nuestro mundo, pero el usuario no
  debe saberlo*). D51 is the world's mechanism. A level with ways has in each
  `text.<lang>.json` a `changes`, one sentence in the child's words of what may be
  different at each run (*La llave está cada vez a una distancia distinta de la
  puerta.*); the start card shows it with the same words on every such level under it,
  `level.changes_tail` (*Tu programa tiene que funcionar en todos los casos.*), and no
  count or list of ways (`changesLines` in `ui/cards.ts`). No `text.<lang>.json` names a
  way, and `tools/i18n_check.py` refuses a level with ways and no `changes` or no
  `changed`, or with `ways`. The level opens on its first way; a run shows the first way
  it does not win, and the scene keeps it until the next run or until the level starts
  over, when it is on its first way again (`firstWay`). When the way a run shows is not the one on the screen before it, the
  outcome's card starts with the level's `changed`, one sentence of each
  `text.<lang>.json` in the owner's pattern (*Esta vez, la llave está en otro sitio.*): it
  names the thing of `changes` that is different on the screen this time, never what the
  difference is, and stands on a line of its own, so that it is not read as part of
  *Todavía no: …*; then the card says what it says of any run (`RunController`'s
  `onScreenWay`, `outcomeText` in `ui/outcome.ts`). A run that wins every way has the
  won card of any level. Only `?debug` draws the `#way` select, with the ways' ids, and
  only there is `outcome.way_won` said. The course book, read by developers, heads each
  way with its id and says once that the child never sees these names; the walkthrough,
  read by the
  owner, shows a level in its first way (D216), and heads each way so where it shows
  several. A content test holds every text the child reads, and every word of
  `i18n/` but `level.way_label` and `outcome.way_won`, to `manera` and `way` only in the
  innocent uses it lists (*de la misma manera*, *which way Dask looks*). Rules out the
  word for this in any text the child reads, a count or a list of ways on a card, a
  select of ways outside `?debug`, and the won card's *¡De todas las maneras!*.
- **D207 — A thing drawn by the game may be moved sideways on its cell.** Decided
  2026-11-12 by the owner (*hay que desplazarlas un poco hacia la izquierda para que no se
  metan en la paca de paja*). A scene's `cut.json` may carry `"shifted": [{"about": "...",
  "cells": [[x0, y0], [x1, y1]], "by": <cells>}]`, which the export writes into
  `art.json`: a thing the game draws from a sprite on one of those cells is drawn that far
  sideways (`shiftedBy` in `engine/depth.ts`, `placeSprite`), and so is its square on the
  plan. It is the things' own setting: a figure on the cell is not moved by it (its move
  is the cell's nudge, D105), and a thing is not moved by a cell's nudge. The world knows
  nothing of it. The settings refuse a shift over a whole column or row, as they refuse a
  nudge. In the shed, (13, 6) and (13, 8) move by -0.3, so that a lying broom's sprite
  ends left of the standing bales. Rules out a sprite drawn into painted furniture, and a
  figure moved to make room for a broom.
- **D211 — In the shed the row under the pegs is walked, and a hung broom is reached from
  it.** Decided 2026-11-12 by the owner (*La fila 5 debe ser pisable/transitable pero con
  la posición bajada (y la casilla de la izquierda de esa fila, la del barril, con la
  posición desplazada a la derecha para caer justo entre esa casilla y la de su derecha).
  Y la fila 5 es desde la que se accede a las escobas colgadas, y desde donde se hace todo
  (el find para las escobas colgadas y te vas moviendo)*; and, on its picture, *Hay que
  bajar la posición del niño un poco más, de modo que la planta de sus pies esté en la
  casilla de abajo pero sus tobillos estén en su casilla. Y el niño también debe verse
  por delante del barril en la casilla 6,5*). The shed's back wall's foot is painted at
  0.6 of row 5, and the boards show under it. Row 5 is floor from column 6 to 13, and the
  pegs' cells above it, (6, 4) to (13, 4), are furniture. A figure on row 5 is drawn 0.25
  lower (`lowered`): its soles just past the cell's lower border, in row 6, its ankles in
  its own cell, its body over the wall's face. (6, 5) is nudged 0.5 to the right, so that
  a figure on it stands on the border between columns 6 and 7, and (13, 5) 0.05 to the
  left, clear of the standing bales. The barrel is a cut-out of the scene, traced on the
  painting, static on row 5 at its row's depth: drawn after the hung brooms of row 4 and
  before every figure of rows 5 and 6. A hung broom is on its peg's cell, (x, 4), and is
  untied, found and measured from the cell under it, (x, 5) (D195, D196); a figure on
  (x, 5) stands in front of the broom and hides what of it lies behind. The shed's zones
  are `wall`, row 5, `[[6, 5, 13, 5]]`, and `straw`, the floor away from the wall,
  `[[6, 6, 13, 8], [5, 8, 5, 8]]`. Row 8 is drawn 0.2 lower, so that the front wall's top
  hides a figure's shoes and hem, and the lintel over the door is traced on the painting
  down to its lower outline, so that a figure in the doorway is behind the whole lintel.
  `tests/tools/test_shed_cells.py` holds these on the scene as the page draws it.
  Rules out a hung broom untied from two rows under its peg, a figure of row 5 with its
  feet on the wall's face, and a figure of row 5 behind the barrel or behind a hung broom.
- **D205 — A level may forbid cells of its own.** Decided 2026-11-12 by the owner (*si el
  personaje intenta llegar a la pared (a la zona de la pared) debería fallar diciendo:
  para contar las escobas en el suelo, mejor me quedo cerca de donde están tiradas*). A
  level's `level.json` may carry `"forbidden": {"reason": "<id>", "cells": [[x, y],
  ...]}`, with the form and the checks of the scene's (D84, D171): the wizard stops
  before a forbidden cell and says the reason's words, `blocked.<reason>`. A level in a
  scene with forbidden cells of its own has both, each cell with its reason
  (`Level.forbidden_reasons`); a cell named by both is refused. *El cobertizo* asks one
  thing, how many brooms lie on the floor: its goal is `{"kind": "say", "count_of":
  "broom", "hung": false}` (a `say` goal's `hung` counts the things not hung, `true` the
  hung ones, and without it every one); its zones are `wall` alone, which its hung
  brooms carry so that a `find_all` from the floor never gives them; and it forbids
  the row under the pegs with the owner's words, `stay_by_the_brooms` (*Para contar las
  escobas en el suelo, mejor me quedo cerca de donde están tiradas.*). The plan hatches
  and names zones only in a level that has two. Rules out a wall or an actor placed to
  keep the wizard from a part of a scene, and a goal that fails without a word when the
  wizard goes where the level does not want it.
- **D206 — A walk is asked for by what it does, and a hung thing is as far as the cell it
  is reached from.** Decided 2026-11-12 by the owner (*no me gusta lo de caminar hasta la
  casilla 8,6. No creo que eso importe. Lo que importa es recorrer todas las escobas*;
  and *hay que irse a un extremo y iterar por las escobas, moviendose la cantidad
  definida con la funcion que te da la distancia a un objeto y, cuando estás al lado,
  desatándola*). A level has a `reach` goal only where being on that cell is what the
  level is about: a landing, a door's threshold, a bed's side. A level whose things must
  all be dealt with has its goal on the things, and the walk follows from where they
  are: in the shed, the wall's levels and the straw's have no `reach` goal and no `end`.
  `distance_to` between the wizard and a hung thing counts the steps to the cell under
  it, where the wizard stands to untie it (D195, D211): a broom hung over the wizard's
  cell is 0 steps away, the next peg's 1 (`Thing._k_reached_from`). `find_all` and
  `find_nearest` order by that same distance. A hung thing's `position` is its peg's
  cell. In *Las escobas de la pared* the brooms hang on other pegs each time, with gaps,
  and the program goes first to one end of the row under the pegs, so that the list,
  nearest first, is the order of a walk in one direction; for each broom it walks its
  `distance_to` and unties it. Rules out a hung broom one step further than the walk to
  it, a level that asks to end on a cell to prove a walk, and pegs filled in a row from
  one end so that a step of one a broom solves the level.
- **D212 — A walk to a thing that may lie on any side compares before it subtracts.**
  Decided 2026-11-12 by the owner (*tendra que ser capaz de moverse en las 4 direcciones
  [...] De modo que hay que ver qué número es más grande para hacer movimientos a la
  izquierda o la derecha. Para que el niño sepa hacer eso habría que explicarle las
  comparaciones menor y mayor y recordárselo y hacerle un poco entender cómo se comportan
  los números en las coordenadas*). `find_all` gives the floor's brooms nearest first
  from where the list is made, and the next one may lie to the left or to the right of
  the wizard, higher or lower. A move takes a whole number of steps, 0 or more, and the
  world refuses a negative one (`error.arguments`). So the program asks first which of
  the two numbers is the smaller, and then takes the smaller from the greater. The lesson
  `less-or-greater` comes before the two levels of the straw (D217) and teaches `<` and
  `>` and how
  the coordinates' numbers behave: `x` grows to the right and `y` grows downwards, so a
  thing with a smaller `x` is to the left and one with a smaller `y` is higher up. In
  every arrangement of the straw's level the walk goes at least once left, right, up and
  down, and no two brooms are equally far from the start. The course compares by size
  with `<` and `>` only, from that lesson on: no `<=`, `>=`, `!=`, `abs`, `min` or `max`
  until a level needs one (`test_course_content.py`). Rules out a level whose things lie
  so that a program walks only two ways to them, a move that takes a negative number as
  a walk the other way, and a level that needs a comparison before its lesson.
- **D208 — A scene's review sheets carry the grid.** Decided 2026-11-12 by the owner
  (*necesito todas las hojas de contacto para ver que las máscaras estén bien y para ver
  todas las casillas transitables y donde se posicionan los personajes en esas casillas.
  Y necesito que las hojas de contacto tengan no solo el número de celda sino la rejilla
  superpuesta para ver exactamente los límites de las casillas*). `tools/art/sweep.py
  <scene> --sheets <folder>` writes a scene's review sheets: its cells in two sheets, the
  even rows and the odd ones, so that every figure is seen whole, each cell walked on or
  flown over tinted and a figure on it where the game draws it, nudged and lowered, and
  flying over a cell only flown over; its masks, each tinted, outlined and named with
  its row and whether it is drawn under or over a figure; and for the shed its brooms, a
  lying one on each straw cell and a hung one on each peg, and a figure on each cell of
  row 5, with the brooms hung behind them and with none, of rows 6 and 8 and of the
  doorway. Every sheet has the cells' borders drawn as a dark line under a light one,
  seen on any ground, and each cell's number where the game's layer of numbers writes
  it: at the foot of the cell, in its middle, over everything drawn. The owner reads a
  cell that way: *el personaje en 6,5 espero que aparezca justo encima de donde está
  escrito 6,5*. A sheet is at the scene's own cell, at least 64 pixels; a scene wider
  than forty cells is written in parts that share two columns. The `?debug` layer of
  numbers draws the cells' borders too, and says on its canvas where its cell (0, 0)
  begins and how wide a cell is (`data-grid`). Rules out a sheet or a debug picture
  without the cells' borders, and a sheet that writes a number elsewhere in its cell than
  the game does.
- **D209 — The themes chosen by ear, and the struck voice.** Decided 2026-11-12 by the
  owner, by ear on the mixer (D203): *The arrival: lively full. The broom: lively full,
  pero suena demasiado "celta", me gustaría que sonase algo más animado, con movimiento,
  que recuerde a una carrera y no a un "paseo por el campo" como suena ahora. Menos
  alegría y más tensión y sorpresa. The familiar: solo hay una opción y no me gusta pero
  esperemos a ver ese capítulo antes de decidir. The library: Calm full, pero en lugar de
  una flauta con sonidos largos me gustaría un piano o similar, con algunas notas un poco
  más rápidas, y que se alterne con la celesta. The passages: esta no me gusta, quiero que
  sea algo más tétrico, con más misterio.* A theme chosen takes the theme's id and its
  candidates leave the tree. *Arrival* is the lively candidate. *The library* is the calm
  one with a piano in the flute's place, its phrases with runs of three or four eighth
  notes and no note held longer than a bar, the piano and the celesta taking turns on the
  tune, never both at once. *The broom* is a race: in E minor, in four, at 160 beats a
  minute, over a low voice that never stops running in eighth notes, the drum on every
  beat and a chord pushed off the beat before each bar; its tune of short cells that
  climb by step and break off, and every few bars a surprise, a bar with no tune, a leap
  of register, a raised seventh left hanging; its loop ends in the air. *The passages* is
  the theme of D213, a clock that ticks at night. The broom's theme and the passages' are
  the owner's choice by ear (D213). *The familiar* waits until its chapter is seen. The page
  sounds one more kind of voice, `piano`: a struck tone, bright at the hammer's blow, that
  starts at once and dies away by itself in a time of its pitch, however long the note is
  written (`pianoRing`).
  Rules out a chosen chapter with candidates left beside its theme, and a held flute
  where the owner asked for struck notes.
- **D210 — A theme has one set of voices.** Decided 2026-11-12 by the owner, who chose
  every theme in its whole form and asked what the other was: *cuando se quitan algunos
  instrumentos la canción cambia mucho, solo tendría sentido si se quitasen los
  instrumentos de relleno y se dejase la voz principal, pero creo que no es el caso*. A
  theme's file names its voices and no arrangements; the page refuses one that has them.
  A story, the map and the start screen play the theme at its written loudness; a lesson
  and a level play the same voices, every one, at 0.4 of it (`voiceLevels`, D213). The player
  is given no choice of voices. The mixer on `?debug#music` has two buttons a theme, as a
  story hears it and as a level hears it, lower, and its line names the theme and what is
  set apart from the file, with no word for an arrangement. When the owner chooses a
  theme on the mixer, they say the theme and the voices they turned off, if any, with the
  mixer's line; a voice turned off leaves the theme everywhere. Rules out a level's music
  without its tune, and two forms of a theme that differ in their instruments.
- **D213 — The broom's theme and the passages' are chosen by ear, the passages' in another
  manner.** Decided 2026-11-13 by the owner, by ear on the mixer (*Para la música me gusta
  the broom (la versión sin -b). La de the passages no me gusta. Sin la celesta creo que me
  gustaría más, pero quiero escuchar otras cosas completamente distintas*), who asked for
  the manner of a march played while someone steals into a guarded place and, of three
  candidates in it, each with a pulse to walk to and none with a celesta, took the watch
  with its horn and its tune turned down (*usemos: the-passages-watch: tune 0.20, horn
  0.15*). `the-broom` is its chapter's theme and stands alone. `the-passages` is time
  running while nobody must hear, in A minor with its lowered second at 116 beats a minute:
  a string plucked on every eighth note as a clock, a piano's low notes three, three and two
  under it, a timpani on the bar, a snare's roll at the end of each half of a section, and
  far under them a horn's long notes that rise a half step and wait, at a volume of 0.15,
  and a piano's tune in the second section, at 0.2. No candidate stands beside it (D209).
  The page sounds two more kinds of voice: `brass`, a horn, a saw whose filter opens as the
  note is blown, held for the note's length; and `snare`, a short rattle of noise over a
  skin's tone, a tap whatever pitch and length are written. Every theme is the game's own
  notes and quotes no other work's. A lesson and a level play a theme quieter and in no
  other way (D210), at 0.4 of a story's loudness, which the ear tells from it at once (*la
  diferencia de volumen entre normal y más bajo debe ser más clara*), and the mixer's second
  button says *a menos volumen*, *quieter*: *más bajo* is read as a lower tone. Rules out a
  theme that is the refused one with a voice less, a note taken from another work, the horn
  or the tune over the clock, and a level's music as loud as a story's to the ear.
- **D214 — While a screen loads there is something to read: a story's words first, and a
  tip for a child who has begun.** Decided 2026-11-13 by the owner (*A veces tarda un poco
  en cargar python, sobre todo la primera vez. Estaría bien, mientras eso se carga,
  mostrar algo*). Python loads in its worker from the moment the page opens, behind
  everything, and no screen waits for it: a story and a lesson's pages need none, and a
  level shows as soon as its own files are there, its status line saying *Preparando
  Python…* (`level.loading`) until a run can start. What a screen waits for is its own
  code, texts and pictures, and while it waits the page shows the waiting view
  (`ui/waiting.ts`): Kydux's mark and *Cargando…* (`waiting.loading`). A story's words
  come first: its screen needs the story's file, the course and `ui/story`, and the
  scene's code and pictures arrive behind it; the voice's words of the first step are read
  at once and the steps that do nothing on the scene are read on, while a figure's bubble
  and a step's actions wait for the scene. The music starts as soon as the theme's file is
  there. The game's opening (D61) shows the welcome's painting of the castle where its
  scene will be (*la imagen inicial del castillo y el texto inicial sobre la carta*), and
  the scene takes its place with a short fade. A child who has begun, with a wizard made
  or a game saved, reads a tip when a wait is longer than the grace of 2 seconds, and a
  new one every 10 seconds (*un tip cada 10 segundos*); when the screen is ready it waits
  until the tip up has had its 10 seconds (*se espera a que haya dado tiempo a leer el
  último tip*), and the button *Seguir* (`waiting.go`) under the tip opens the screen at
  once. A wait shorter than the grace shows no tip and holds nothing. The tips are the
  page's words (`tips.*`, the same keys in every language), each true of the page as it
  is; they are shown in order from where the last wait stopped, kept in `localStorage`,
  and none comes back until all have been seen. Once its first screen shows, the page
  fetches in idle time the code the other screens need, so that a later screen waits only
  for its own files. The browser tests turn the tips off with a key of `localStorage` that
  no setting shows. Rules out a screen that waits for Python, *Preparando Python…* said of
  anything that is not Python, a tip that flashes by on a quick load, a hold the child
  cannot end, and a tip that is not true.
- **D215 — `drevo` cast in the air lands.** Decided 2026-11-13 by the owner (*si se lanza
  drevo mientras vuelas, deberías aterrizar (o fallar si aterrizas sobre una casilla no
  transitable y que termine el programa por fallo). Es como chocar (y debe sonar el mismo
  ruido) pero para el programa (te deja volando donde estabas, para que no te ahogues ni
  nada similar)*). `wizard.cast("drevo")` while `wizard.flying` sets the broom down on the
  wizard's cell: a tick, the event `land` marked as the wizard's own (`"cast": true`),
  `flying` false, and the moves after it walk. Over a cell that is not walked on, a low
  one (D186) or a ring's (D187), the landing is refused (`world.refuse`, reason
  `no_landing`, with the cell's kind): the page plays the bump's sound, the program stops
  with an error in the child's words (`error.no_landing`, and `blocked.no_landing` in the
  wizard's bubble), and the wizard stays in the air where it was. When a program ends in
  the air over a cell that is walked on, the broom sets down by itself (D185); over a cell
  that is not walked on it stays in the air, and the figure is left flying on the screen.
  `wizard.flying` is true from the lift until a landing. A goal of kind `land`, `{"kind":
  "land", "marker": "E"}` or `"at": [x, y]`, is met at the tick the wizard's own cast sets
  it down on that cell; the broom's own setting down at a program's end does not meet it.
  *El primer vuelo* asks to reach the white stone, and its extra is to land on it before
  the program ends (*el objetivo de esta partida debería ser "llegar a la piedra blanca" y
  no aterrizar, y el extra debería ser aterriza en la piedra blanca antes de que el
  programa termine*). The goal `cast` names a spell and no cells. Rules out a second
  `drevo` that does nothing, a landing on water, a wizard standing on water after a
  program's end, and a level that asks for a landing the program's end gives by itself.
- **D216 — The walkthrough shows a level in one arrangement.** Decided 2026-11-13 by the
  owner (*No quiero que me pongas varias maneras en cada revisión de cada ejercicio, para
  el próximo sprint pon solo una manera salvo que veas que es muy importante ver todas las
  maneras*). `tools/walkthrough.py` and its browser spec show a level with ways in its
  first way: its card, its start, its route tick by tick and its won card, with no heading
  for the way. The lines of what changes each time and of what the card says when this
  time is different stay under the card. The option `--all-ways <level ids>` shows the
  named levels in every way, each under its id (D204), and the report that hands the
  walkthrough over says which levels and why. Rules out a walkthrough three times as long
  as what the owner has to read.
- **D217 — The shed goes from the easy to the hard: the `if` inside the `for` before the
  comparisons, and one broom before all of them.** Decided 2026-11-13 by the owner (*Esta
  lección y el arreglo de la revisión son más sencillos que el programa anterior, y además
  se tienen que usar antes de usar un if dentro de un for. Así que tiene sentido moverlos
  más arriba*; *para hacer más progresivo todo esto, el nivel anterior lo vamos a dividir
  en dos*). Chapter 4's order in the shed: the wall's brooms; the lesson `checking-each`
  and *La revisión*, which goes over the brooms the wall's level hangs, some still knotted
  (*quizás tenían dos o quizás se nos escaparon al intentar desatarlas*); the lesson
  `less-or-greater`; `the-nearest-broom`, one broom of the floor, the nearest, found with
  `find_nearest` and reached with two `if` and `else` and no loop; then *Las escobas de la
  paja*, every broom of the floor, the same walk inside a `for`. In every arrangement of
  `the-nearest-broom` the nearest broom lies in sight on the bare boards, the others under
  the straw at least a step farther, and over its arrangements the walk goes left, right,
  up and down. A level that puts two ideas together comes after a level for each of them.
  Rules out an `if` inside a `for` first met in the chapter's hardest program, and a check
  of brooms that nobody saw hung.
- **D218 — A program that is long for the child is given as comments, one for each
  instruction.** Decided 2026-11-13 by the owner (*debemos darlo un poco más masticado. La
  idea sería dar un comentario para cada instrucción*; *¡Incluso te he dejado los espacios
  para que sepas lo que va dentro de los for y los if!*). The starting code of such a
  level says in its first lines that the comments are there and what to do with them; then
  one comment for each instruction, in the order of the program, in plain words that name
  the function to use. A comment that belongs inside a block is indented as the block is,
  and the empty line under each comment carries the indentation of the line to write, so
  that the child sees what goes inside each `for` and each `if`. The comments hold no line
  of code. The two levels of the straw have them, and a test of the content holds their
  form. Rules out a starting code with half the program written, and comments that tell
  the idea and leave the order of the lines to the child in a level that long.
