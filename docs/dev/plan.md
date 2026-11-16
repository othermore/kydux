# Kydux — project plan

How Kydux is built, phase by phase, from the draft (`draft.md`). Each phase
ends in something the owner can try from another computer on the network, and
the next phase does not start until they have. Within a phase the work is cut
into numbered pieces, each small enough to be asked for, done, and tried on its
own.

## 1. The stack

| Part | Choice | Why |
|---|---|---|
| The game | A static web app: HTML, CSS, **TypeScript**, built by **Vite** | Runs in any browser from any web server, offline once loaded; the same files serve a local launcher, a Kidux package and, later, a hosted site. |
| Python | **Pyodide 314.x** (CPython 3.14 in WebAssembly), from its npm package, run in a **Web Worker** | Real Python, the one the child will meet outside the game; a worker keeps the page responsive and lets a runaway program be stopped. |
| The level model | A Python package of our own, `kydux_world`, run inside Pyodide | The child's code calls real Python objects (`wizard.move_right()`), the world is deterministic, and the same package runs under CPython on the development machine, so every level is checked by plain `pytest` in milliseconds, without a browser. |
| The scene | **Phaser 3** | Tile maps from Tiled, sprite animation, tweens, audio and input in one MIT library made for exactly this kind of 2D game. |
| Maps | Rows of characters in `level.json` now; **Tiled** (`.tmj` JSON) from phase 4 | One source for the world and the scene. Tiled is a free map editor whose files Phaser loads as they are; it comes when there are tiles to place. |
| The editor | **CodeMirror 6** with its Python mode | Light, accessible, themeable, with line markers for the running line and for errors. |
| Lessons and texts | Markdown and JSON per language, under `content/` and `i18n/` | Writers edit text files; a check keeps the languages in step. |
| Progress | A `ProgressStore` interface; local storage in the browser now, a server later | Local first, online later, without touching the game. |
| The launcher | A small **Go** program that embeds the built game, serves it on `localhost` and opens the browser | One executable per platform (Linux, Windows, macOS), no runtime to install, cross-compiled from Linux in one command. |
| Checks | `pytest` for the world and the levels, **Vitest** for TypeScript, **Playwright** for the game in a browser, and project checks (i18n parity, forbidden words, secrets) | Fast checks run at every change; the browser checks before a release. |
| Writing tool | A Python script in `tools/write/` calling Gemini's text model with a brief and its context | Every text the child reads is drafted from the whole story and course, then reviewed (D55); the brief stays as the record of what was asked. |
| Art tools | Python scripts in `tools/art/` calling Gemini's image models and cutting sheets | Reproducible: every generated asset keeps its prompt. |
| Sound tools | Scripts calling Lyria for music and effects; free CC0 effects where simpler | The game's own music. |

Every version is pinned exactly, each checked against its latest release, in
the versions table of `architecture.md`: Node, Vite, TypeScript, Phaser,
CodeMirror, Pyodide, Vitest, Playwright, the writing tool's `google-genai`
and its Gemini model, Go for the launcher, Tiled, and Python 3.13 on the
machine (the world keeps to syntax that runs on 3.12 and up, so that it
runs on both).

### Why not the alternatives

- **Not `file://`**: Pyodide, workers and module scripts do not load from a
  file opened directly; a web server is needed, hence the launcher.
- **Not Electron or Tauri**: a hundred megabytes of browser, when every machine
  has one. The launcher is a few megabytes and opens the browser that is there.
- **Not a Python launcher**: Windows and macOS do not ship Python; a Go binary
  needs nothing. Python stays for the world, the checks and the tools.
- **Not Blockly or a toy language**: the point is Python.

## 2. How the game works

### 2.1 From the child's code to the scene

1. The editor's text goes to the worker with the level's id.
2. In the worker, `kydux_world` builds the level from its definition (map,
   actors, goals), creates the API objects (`wizard`, and what the level
   gives: `door`, `teacher`, ...) and runs the child's code with them in its
   namespace, by `exec`.
3. Every API call advances the world by whole **ticks**: `wizard.move_right()`
   is one tick per tile, `wizard.cast("light")` one tick, `wizard.say(...)`
   one. On each tick the other actors move (a teacher on patrol, a moving
   staircase), goals are evaluated, and an **event** is recorded:
   `{tick, actor, kind, data, line}` with the line of the child's code that
   caused it.
4. The run ends when the code ends, a goal fails fatally (caught by the
   teacher), the tick limit is hit, or an exception escapes. The worker returns
   the event list, the goal results and, when there was one, the error, already
   mapped to a key and its data (section 2.4).
5. The scene plays the events back at the chosen speed: the wizard walks tile
   by tile, the editor's gutter marks the line being played, a bubble over the
   wizard names what it says, the goals tick off as their events arrive. The
   timeline under the scene can be dragged to any tick, since every tick's
   state can be rebuilt from the events.

Everything is deterministic: same code, same events. That is what lets every
level's solution be checked without a browser.

### 2.2 Stopping a runaway program

- Every API call counts a tick; past the level's limit (default 1000) the
  world raises `TooManyTicks`, shown as "Your program has taken more than
  run more than 1000 steps. Is there a loop that never ends?".
- A loop with no API call in it (`while True: pass`) never reaches that
  check. Two defences: when the page has `SharedArrayBuffer` (served with the
  `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` headers, which the dev server
  and the launcher send), Pyodide's interrupt buffer stops the run after a
  wall-clock limit (5 s); when it does not, the worker is terminated and a
  fresh one started, with a message to the child. Either way the page never
  freezes.

### 2.3 The API the child uses

Python conventions throughout: `snake_case`, objects with methods and
attributes, docstrings in English in the code (the notebook shows them
translated from `i18n`). What exists is in `architecture.md`, section *The
child's Python*, from the one list in `kydux_world/api.py`; the actions the
later chapters bring (casting with the wand, using a thing, the wizard's
energy) are added there as their chapters arrive.

What a level exposes is listed in its definition, so the notebook and the
editor's completion show only what has been taught.

### 2.4 Errors in the child's words

The worker maps Python's exceptions to keys with data, and the shell shows
the translated text pointing at the line:

| Python | Key, data | English text |
|---|---|---|
| `AttributeError: 'Wizard' object has no attribute 'mvoe_right'` | `error.unknown_action`, `{name, suggestion}` | The wizard does not know an action called `mvoe_right`. Did you mean `move_right`? |
| `NameError: name 'wizrd' is not defined` | `error.unknown_name` | There is nothing called `wizrd` here. Did you mean `wizard`? |
| `SyntaxError` on a line with `(` unclosed | `error.unclosed_paren` | This line opens a `(` that never closes. |
| `IndentationError` | `error.indentation` | The lines inside a `while` or `if` need four spaces in front. |
| `TypeError` on wrong argument count | `error.arguments`, `{name, expected}` | `move_right` takes a number of steps, like `move_right(3)`. |
| `TooManyTicks` | `error.too_many_ticks` | ... |
| Anything else | `error.other`, `{type, message}` | Python says: ... (the raw text, for an adult to read) |

Suggestions come from `difflib.get_close_matches` against the names the level
exposes. Every key is in `i18n/<lang>.json` like any other text.

### 2.5 Content: lessons, levels, chapters

```
content/
  chapters/01-arrival/
    chapter.json                          id, and the items in order: story:<id>, lesson:<id>,
                                          level:<id>; an item's id is its slug, its order the
                                          chapter's (D44); a story item opens and closes it (D62);
                                          chapter 1's first is the opening (D78)
    text.en.json  text.es.json            the chapter's title
  scenes/the-field/
    map.txt  scene.json                   the scene a chapter's levels are parts of: a grid
                                          of letters, and what each letter is (its terrain:
                                          walked on, seen through), its fixed things, its
                                          props and its rooms (D65, D73)
  art/scenes/the-field/  art/figures/     a painted scene's ground, rows and things' states,
                                          and the figures' walking sheets: the wizard's in
                                          every look, and the two friends' (D76, D77)
  stories/at-the-gate/
    story.json                            the staging on its scene: where the wizard and the
                                          actors stand, the camera's tile, and each step's
                                          speaker and action; who tells it (`speaker`), and
                                          `opening` for the story before the creator (D61, D74)
    text.en.json  text.es.json            its title and one text a step
  lessons/your-first-action/
    lesson.json                           id, who teaches it (`speaker`, D67), and what it
                                          teaches: the names the level after it needs (`teaches`)
    en.md  es.md                          the lesson, a few short pages separated by ---:
                                          the idea's theory, then the game's way, then Try it (D41)
  levels/the-corridor/
    level.json                            its scene, its start and its end on it (D65), or a
                                          map of its own; things and actors by tile,
                                          exposed API, goals, tick limit, the spells it
                                          has and the passwords it gives (`words`, D80),
                                          the speaker of its intro (`friend` for the friend,
                                          D77), its kind: practice, fix, improve or
                                          challenge (D56)
    text.en.json  text.es.json            title, goals, hints, starting code's
                                          comments and strings, intro, outro and what
                                          was learned (D45, D62)
    solution.py                           wins the level
    wrong/*.py                            each must not win (the naive mistakes)
```

Goals are declared (`reach`, `collect`, `open`, `say`, `give`, `cast`, `no_bumps`,
`not_seen_by`, `ticks_under`, `lines_under`, `numbers_under`, `uses`; and for chapter 4
`say` with `count_of`, `cast` with `from`, `untied` (with `ids` for the brooms it counts), `no_error`, `through_in_order` and
`before`, D183 to D189) and a level may add `goals.py` for one of its own. The lesson's
Markdown, with no HTML in it, may hold one fenced block marked `python try`,
its example; the level after it starts with its own program (D33, D63). Within a chapter, every item is
numbered by kind, stories too, and says its chapter: *Chapter 1 · Story 1*, *Chapter 1 · Practice 1*,
*Fix 1*, *Improve 1* (D56, D78). A text names the friend as `{friend}`, with the friend's gendered words
in double braces (D77). `pack-world.mjs` writes the chapters, in the order of their
directories, as `content/course.json`, the one order of the course (D32). A
chapter's picture for the map comes with the art (phase 4); the map draws
its stops as a path until then. A scene is painted whole (D76), and a level
shows the part the camera follows (D69).

```
  guide/
    text.en.json  text.es.json            the screen's guide's words, a title and a text per
                                          step (D68)
```

### 2.6 Internationalization

- `i18n/en.json`, `i18n/es.json`: every string of the shell, the notebook's
  descriptions of every action and attribute, and the error texts, nested keys.
- Level and lesson texts beside their content (above).
- `tools/i18n_check.py` fails on a key present in one language and not the
  other, a key no code or content uses, or a string literal in the TypeScript
  UI that looks like prose (a heuristic: capitalised words with spaces in JSX
  or `textContent`).
- The language is chosen on the first screen and remembered; the browser's
  language is the default. Python keywords and the API are not translated.
- A text may speak of the wizard: `{boy's words|girl's words}` and `{wizard}`
  are resolved from the wizard the child made (D37), in every path a text
  takes to the screen. Spanish needs it in nearly every sentence about the
  wizard; English in few.

### 2.7 Progress and the wizard

- `ProgressStore` (TypeScript interface, D31): `load()`, `save(progress)`,
  with `progress` = `{version, language, wizard: {name, gender, look},
  settings: {speed, fontSize, split}, lessons: {id: {read}}, levels: {id:
  {won, stars, code, hints, tried}}, started, current}`: `wizard` what the
  child made (D36), `started` the levels whose start card was seen,
  `current` the item last opened, where *Continue* goes. Each saved game is
  one such document (D70): `GamesStore` keeps them in `localStorage` under
  `kydux.game.<id>`, with their list under `kydux.games` (IndexedDB when it
  outgrows it); *Export* and *Import*, on the start screen, move a game as
  a JSON file between computers;
  the launcher can also keep it as a file beside itself when asked. An
  online store comes later behind the same interface.
- The wizard's look: a base sprite drawn with placeholder colours for skin,
  hair, robe and hat, recoloured at load time on a canvas to the child's
  choices (pixel art makes exact colour replacement trivial); hats and hair
  styles as overlay sheets on the same frame grid, when the art pipeline
  shows they can be made to fit.

### 2.8 Trying it over the network while it is developed

The game is a web app, so trying it from the MacBook is only a matter of
serving it on the network instead of on `localhost`:

- **During development**: `npm run dev` runs Vite's server bound to all
  interfaces (`--host`), with hot reload; the MacBook opens
  `https://hija.local:5173` (mDNS, which macOS resolves) or
  `https://10.10.11.226:5173`. A change saved on the Linux machine shows in the
  MacBook's browser within a second. The server sends the COOP/COEP headers,
  and serves HTTPS because a browser isolates only a secure context, which
  plain HTTP from another computer is not: its certificate comes from a
  local authority of the machine's own (`ci/dev-cert.sh`), which the MacBook
  trusts once (architecture.md, D13; dev-environment.md, section 4).
- **A built game**: `npm run build` then `npm run preview -- --host` serves
  `dist/` the way the launcher will; or the launcher itself with
  `kydux --listen 0.0.0.0:8765`, which is what a release will run.
- **Browser checks**: the Playwright suite runs headless on the Linux machine
  against the same server, and its screenshots are the pictures in the docs.
- The firewall of the Linux machine must allow the port on the local network;
  from outside it, Tailscale or an SSH tunnel (`ssh -L 5173:localhost:5173
  hija`) does the same with nothing opened.

## 3. Repository layout

```
kydux/
  app/                the web app (Vite, TypeScript)
    src/engine/       Phaser scenes: the level scene, playback of events, the map
    src/runtime/      the worker, Pyodide loading, the bridge to the world
    src/editor/       CodeMirror setup, line markers, completion from the level's API
    src/ui/           the shell: start, wizard creator, chapter map, lesson,
                      level screen, cards, notebook, settings
    src/i18n/         loading and lookup of strings
    src/progress/     ProgressStore and its local implementation
    src/content/      loading of chapters, lessons and levels
    public/           static files copied as they are
  world/              the Python package kydux_world and its tests
  content/            chapters, lessons, levels (section 2.5)
  i18n/               en.json, es.json
  art/                sprites/, tiles/, ui/, each with manifest.toml; raw/ ignored
  sound/              music/, effects/, with manifest.toml
  launcher/           the Go launcher
  packaging/          debian/ for the Kidux package, and the per-platform bundles
  tools/              art/ (generation, cutting), sound/, i18n_check.py, checks
  tests/              project/ (repository checks); the browser tests are in app/e2e/
  ci/                 hours.py, push.sh, hooks/, build and release scripts
  docs/dev/           this plan, architecture.md with its decision log, how each part works
  docs/en/ docs/es/   the user guide, when there is something to guide
```

## 4. Development model

- **One piece at a time.** The owner asks for a numbered piece of the current
  phase; it is done, its checks pass, it is tried on the network; then the
  next. Pieces of a phase can be reordered when one is blocked.
- **Sprints.** A run of pieces given to the implementer together is a
  sprint, with its own document, `sprint-<n>.md`, that spells each piece
  out to the file and the test, and ends with the owner's acceptance test.
  A sprint is reviewed before the next is planned: the design, its fit
  with the documents, and what the implementer reported as different.
- **Checks at every piece**: `pytest world content` (the world and every
  level's solutions and wrong answers), `npm test` (Vitest), `tools/i18n_check.py`,
  `tests/project/` (no forbidden word anywhere, no secret-looking string, every
  asset in a manifest with a licence, the two READMEs in step). All of them
  together: `ci/check.sh`. The Playwright suite, slower, runs before a release
  and when a piece touches the shell.
- **GitHub Actions** runs `ci/check.sh` on every push, and the Playwright suite
  too on a version's tag and when started by hand (D179); it builds the release
  bundles on a tag. Pushes and tags happen only inside the hours, so the runs
  do too.
- **Releases**: `0.1`, `0.2`, ... while the course is incomplete; `1.0` when
  the first course and its challenges are there. A release is a tag, pushed by
  `ci/push.sh`, and GitHub's workflow attaches the bundles. A release is cut
  only after the owner has tried the phase's UAT and said yes, and the
  Playwright suite has passed on that commit.
- **Documents**: `docs/dev/architecture.md` is started in phase 0 with its
  decision log, and every decision taken while building goes there, as in
  Kidux. The present-tense rule holds everywhere else.
- **The hours and the secrets** as the draft states: `ci/push.sh` only, the
  pre-push hook, the key in `~/.config/kydux/secrets.env`.

### UAT

Each phase below lists what the owner tries from the MacBook. The owner's
yes closes the phase. A no becomes a piece added to the phase.

## 5. Phases

### Phase 0 — Foundations

The toolchain, the layout, the checks, and an empty page served on the
network.

0.1 `app/` with Vite and TypeScript; `npm run dev -- --host` serves a page that
    says "Kydux" in the browser's language from `i18n/`; COOP/COEP headers in
    the dev and preview servers. Hot reload seen from the MacBook.
0.2 `world/` as a Python package with `pyproject.toml`, an empty `Level`,
    `pytest` running; `uv` or a plain venv, documented.
0.3 `ci/check.sh` running pytest, Vitest, `tools/i18n_check.py` and
    `tests/project/`: the forbidden-word check (a list kept outside the
    repository, in any case and any spelling, in every tracked file, path
    and commit message), the secret check (strings shaped
    like API keys, `secrets.env` content), the manifest check, the READMEs in
    step (same headings).
0.4 GitHub Actions: `check.yml` running `ci/check.sh` on push.
0.5 `docs/dev/architecture.md` with the stack as decisions D1..Dn, and
    `docs/dev/dev-environment.md`: how to set the machine up, how to try from
    another computer, the hours.
0.6 Pin every version; note each in the architecture document.

UAT: open `https://hija.local:5173` on the MacBook, see the page in Spanish,
switch the MacBook's browser language to English, see it in English.

### Phase 1 — Walking skeleton

One hard-coded level played end to end: editor, Python, scene, goals.

1.1 The worker: loads Pyodide and `kydux_world` (packed as a zip at build
    time), runs code, returns events; a `runtime` module with `run(levelId,
    code) -> Result` on the page side. Loading screen while Pyodide loads
    (several seconds the first time; cached after).
1.2 `kydux_world`: `World`, `Wizard` with the four moves, ticks, events, the
    `reach` goal, `TooManyTicks`; tests.
1.3 The level scene in Phaser: the map from `level.json`'s rows of
    characters, the one source the world reads too until Tiled arrives with
    the art in phase 4, drawn with placeholder tiles made at run time and a
    placeholder wizard; playback of move events as tweens tile by tile;
    speed control; restart.
1.4 The editor: CodeMirror with Python, the starting code, the running line
    marked during playback, Run and Stop buttons.
1.5 The goals panel: the level's goals ticked as events arrive; a win banner.
1.6 The first level, "The corridor": reach the door in six steps; its
    `solution.py` and `wrong/` checked by pytest.
1.7 Interrupts: the tick limit shown as a message; a tight loop stopped by the
    interrupt buffer or a worker restart; Vitest for the bridge.

1.8 Hardening the sandbox (architecture.md, D14): a Content-Security-Policy
    on every server and in the page, with `connect-src 'self'` so that the
    child's code can reach no server but the game's own; the modules `js`,
    `pyodide`, `pyodide_js`, `_pyodide` and `micropip` refused to the child's
    code by an import hook, as a second line behind the sandbox; and the
    worker's messages to the page checked for their shape. A test of each.

UAT: from the MacBook, write the three moves, press Run, watch the wizard
reach the door; write `while True: pass`, see it stopped with a message;
misspell a move, see Python's error (plain, not yet translated).

### Phase 2 — The level engine

Everything a level can be made of, with the content format of section 2.5.
Sprint 3 had 2.1, 2.2, 2.3, 2.9, 2.4 and 2.10 (`sprint-3.md`); sprint 4
has 2.11, 2.12, 2.0, 2.7, 2.5, 2.8 and 2.6 (`sprint-4.md`).

2.0 The level screen's run, as a controller of its own: the states a run
    goes through (idle, running, playing, done, failed) and what each
    button does, apart from the DOM and tested by Vitest, before the
    screen gains hints, the timeline, the cards and the notebook.

2.1 The level definition (`level.json`) and its loader on both sides; the
    exposed API list. The level texts, `text.<lang>.json` with their check in
    `tools/i18n_check.py`, hold the hints and the dialogue too.
2.2 Objects and actors: doors, keys, items on tiles, `pick_up`, `wait`,
    `find_nearest`, `find_all`, `has`, attributes; a patrolling actor that
    walks its path back and forth, with `can_see`; their events and their
    playback (open door, item vanishing, a sight cone drawn).
2.3 Goals: the full set, `goals.py` per level, bonus goals, fatal failures
    (seen by the teacher ends the run).
2.4 Errors in the child's words: the mapping of section 2.4 with
    suggestions; the error card under the editor pointing at the line.
2.5 Hints: one at a time from the level's list, offered after a failed run
    or on request; never the solution.
2.6 The timeline: a scrubber under the scene; dragging rebuilds the state at
    that tick; the editor's marker follows.
2.7 The level-start card (goals, picture, example, Start) and the win scene
    (a short animation, stars by goals met, Next).
2.8 Completion in the editor from the exposed API, and the notebook panel
    listing it with translated descriptions and a click to insert an example.
2.9 The world refuses to be tampered with: the wizard's position, facing
    and items are read-only to the child's code, the world's own modules are
    out of its reach, and a run's events must add up, each step following
    the last from the start, before it counts, so that a run cannot claim a
    win it did not make.
2.10 A second and third level exercising all of it (a locked door with a key;
    sneaking past a teacher), with solutions and wrong answers.
2.11 The game's words (D27): *action* for a method, *Run* for the button,
    *notebook* for the panel, *spell* only for the story's magic; the
    isolation diagnostic out of the child's sight; changing an attribute
    told apart from adding one.
2.12 Why an action could not be done (D28): a thought over the wizard at the
    tick it happens, the card repeating the first with its line, and no
    animation for an attempt that could not even be made.
2.13 The wand and spells (D42), and doors that open by key, by word or by
    spell (D43): chapter 1's world, in sprint 7.
2.14 Shelves that stop feet and not eyes (D46), the spell that pulls
    (D47), actors who stand and speak, and giving (D48), and what the
    wizard carries from the start (D49): chapter 2's world, in sprint 8.
2.15 A level played in several ways, which one program must win in all
    (D51), dark rooms and the spell that lights them (D52), stairs that
    come and go and the spell that holds them (D53): chapter 3's world,
    in sprint 9.
2.16 The page for the ways, the darkness and the stairs: the way select,
    the outcome by way, the dark layer, the stair drawn by the tick; in
    sprint 9.

UAT: the three levels from the MacBook; a misspelled action gets a Spanish
message with a suggestion; the scrubber; a hint; stars.

### Phase 3 — The shell

The game around the levels: the course as the child walks it.
Sprint 5 has 3.5, 3.1, 3.3, 3.4 and 3.6 (`sprint-5.md`); sprint 6 has 3.9, 3.2,
3.7 and 3.8 (`sprint-6.md`).

3.1 The start screen: language, New wizard / Continue, Export / Import.
3.2 The wizard creator: a name, a girl or a boy, and a look chosen among
    several (D36), each a sprite sheet of its own; shown in every scene.
3.3 The chapter map: levels as places on a picture, the path lit as levels
    are won, lessons as books on the path; the map opens where the child
    left off.
3.4 The lesson viewer: pages of markdown with pictures and code, a `try`
    block that goes into the next level's editor; marked read.
3.5 `ProgressStore` and `LocalProgressStore`; progress saved after every run
    and lesson; Export and Import.
3.6 Settings: language, speed, the editor's text size, the split between the
    scene and the editor (D35); sound on/off when there is sound; the "reset
    my wizard" door.
3.7 Keyboard and screen: the layout works from 1280×720 up, in a tablet's
    landscape too; the editor font is readable for a child; Tab inserts four
    spaces.
3.8 The Playwright suite: new wizard → lesson → level → win → map, in both
    languages, with screenshots (D39).
3.9 The words follow the wizard (D37): a text for the player may hold
    `{boy's words|girl's words}` and `{wizard}`, resolved from the wizard
    chosen, in `t()`, the lessons and the levels' texts; the i18n check
    holds the Spanish texts to it.

UAT: the whole loop from the MacBook as a child would, in both languages;
close the browser, come back, continue; export on the MacBook, import on
another browser.

### Phase 4 — Art and sound pipeline

From placeholder squares to the game's look, with reproducible tools. The
look is the owner's style B (D72): painted cartoon art with bold outlines
and warm light, in a three-quarter top-down view (the ground seen from
above, every upright thing showing its top and its front), everything on
the tile grid and nothing on a diagonal, since the wizard moves only along
it. A chapter's scene is painted by Gemini in one picture from the
requirements of its levels, with a faint grid; its map is read from the
picture and its levels placed on it; its raised things are cut out by row,
so that the figures pass behind and in front of them (D76).

4.0 **Where the pieces come from** (done, D72): Gemini's image models,
    art as code, the pixel-art services' corner sets, free tilesets and
    isometric packs, tried on chapter 1's garden; the painted scene won.
4.1 **The scene model** (done, D73): terrains, fixed things and rooms in
    `scene.json`; a level gives the state of a fixed thing.
4.2 **The tools** (done): `tools/art/generate.py` (a prompt file in, an
    image out, its prompt and model beside it), `cut.py` and `sprites.py`,
    `map_from_image.py`, `image_first.py` and `export_scene.py` (a painted
    scene into `content/art/scenes/<scene>/`), `contact.py` and `demo.py`
    for the trials; `tools/sound/generate.py` with Lyria; the effects made
    in the page (`sfx.ts`) with a mute in the settings.
4.3 **The chapters' scenes painted and placed:** chapter 1's field in the
    game (sprint 12, 12.8), with its margin (sprint 14, D83) and its
    settings (D82); chapter 2's entrance, dormitory and library painted
    with their margins, mapped, their levels placed on them and their texts
    written again; chapter 3's passages and night passages laid out on the
    grid before they are painted (D102, `tools/art/layout.py`), then painted
    to that layout, mapped and placed.
4.4 **The masks made right** (done, sprint 14): every raised thing cut by
    its outline, no shadow below its row, what opens or is picked up cut
    against an edit without it, checked by the sweep with the wizard on
    every cell walked on (`tools/art/sweep.py`), and the painting's rules
    for the cut in `art/README.md`.
4.5 **The figures:** the wizard drawn in every look the creator offers,
    and the two friends, recoloured from base sheets by
    `tools/art/figures.py`, with the wizard's casting frames (sprint 13,
    D81) and its acts, picking up and celebrating (sprint 14); the
    teachers, Eldra and Bimo on the same scale.
4.6 **The UI skin:** cards, panels, buttons, the notebook, the map's frame
    (perhaps the castle drawn isometric, D72), the lesson's speech bubble,
    icons for goals, actions and spells, a font with its licence readable
    by children.
4.7 **Sound:** a theme per chapter from Lyria, short clips, the
    characters' voices as short sounds.
4.8 `art/README.md`: the style guide: the view, the grid, the light, how a
    scene is painted, mapped and cut, how a figure is made, and how each
    is reviewed; `art/raw/`, which git ignores, for the trials.

Sprint 13 (`sprint-13.md`) makes chapter 1 right on its painting, with
the wizard's looks (4.5) and the first mask rules (4.4); sprint 14
(`sprint-14.md`) closes chapter 1: the scene's settings beside its art
(D82), the field painted with a margin (D83), the wizard picking up and
celebrating, the story replayed a step at a time, the debts of the
reviews. Sprint 15 brings chapters 2 and 3 onto their paintings, with
their margins.

UAT: the three chapters with their paintings and sound; the creator's
choices showing in the scene; a hunt for things that cover a figure
wrongly; a child's verdict.

### Phase 5 — The story and the course

The content: 10 to 20 lessons with their levels, then challenges. Written in
English and Spanish together; the owner reviews each chapter before the next.

What the owner asked of the course (2026-10-21), which the outline (5.2) and
every chapter follow:

- **One step at a time.** Each lesson adds one idea to what the child knows.
  The three lessons of sprint 5 go too fast: the third already asks for a
  loop with a condition. Conditions come before loops, each alone first, and
  other ideas come before both (sequences, arguments, attributes,
  variables, literals); a loop with a condition comes only once both are
  known. Each new idea is used alone in a level before it is combined.
- **A short lesson of theory before each idea, then one or more levels to
  practise it.** The theory lessons say, in a page or two each, what a
  program is, what an instruction is, an object, a method (an action, D27),
  a variable, a literal, an expression, an expression that is true or false
  and so can be a condition, a conditional instruction, a loop, and so on.
  The levels after a theory lesson practise exactly what it explained.

Sprint 7 has 5.1, 5.2, 2.13 and 5.3 (`sprint-7.md`); sprint 8 has 2.14 and
5.4 (`sprint-8.md`); sprint 9 has 2.15, 2.16 and 5.5 (`sprint-9.md`). The
owner's UAT of 2026-10-22 reshapes the course: sprint 10 builds the writing
tool, the kinds, the stars and the rules, and rewrites the story and chapter
1 (`sprint-10.md`); sprint 11 puts each chapter's levels in one scene, builds
the screen's guide, the map over the level and the saved games in the
browser, and rewrites chapters 2 and 3 the same way (`sprint-11.md`).
Phase 4, the art and the sound, comes next (sprints 12 to 14), on the
scenes that exist; then chapters 4 and 5, each a sprint with its scene,
and the challenges. The saved games on the server wait for phase 7, when
the game runs online.

What the owner's UAT of 2026-10-22 taught, which every chapter follows
(sprint-10.md has the first pieces; the rest are sprints 11 and 12):

- **Story first.** An introduction before the character is made; the first
  chapter is a tutorial taught by a friend (Nuri) at the gate, and the story
  resumes once the castle is reached; the wand is lent, and the wizard must
  earn one; the wizard grows (a wand of their own, a broom, friends). Every
  level ends with a closing: a word of story and what was learned; every
  chapter opens and closes with a story told on its scene (D74), the
  closing a recap of the chapter's ideas.
- **Gemini writes the child's texts** (CLAUDE.md, *Who writes what the child
  reads*), from briefs, with the whole context; Claude reviews.
- **Kinds and numbers.** Lessons and practices are told apart and numbered
  within the chapter; there are fix-it levels (a program to repair) and
  improve levels, besides practices and challenges. A lesson that uses a
  thing in its code (a comment, an argument) comes after the lesson that
  explains it; the notebook shows an action without arguments until
  arguments are taught.
- **Stars mean something.** Three for a clean win; one lost for hints, one
  for bumping into walls or a bonus unmet; the win card says why.
- **The screen explains itself.** A guided overlay on the first level names
  the scene, the editor, the buttons and the notebook; the notebook is
  nudged; the `?` card reopens with *Continue*, above the notebook; probing
  and watching is said to be the method from the start.
- **The map does not throw the player out.** It opens over the level, shows
  where the player is, closes back to it, asks before leaving; a chapter is a
  mini-map, and what lies ahead is unnamed. Lessons can be read from a level.
- **Saved games.** A game per wizard, listed with its wizard, its place,
  its play time and its dates, loaded on return; export and import stay as
  the way to carry one away. Sprint 11 keeps the list in the browser
  (D70); the same list on the server the game runs from, with the
  browser's as the fallback, comes with the online game (phase 7).
- **One scene per chapter.** A chapter's levels are parts of one scene, or
  of a few, where a level ends the next begins and the friend who teaches
  stands in it; the camera is a window on the scene, zoomed and dragged
  (D65, D66, D69). Bigger levels done in one go come later, on the same
  scenes.
- **Sound and animation everywhere**, with the art (phase 4), the whole page
  restyled in the magic.

5.1 The story bible, `docs/dev/story.md`: the school, its name and places,
    the characters (the head, the teachers, a rival, a friend, the cat, a
    ghost), the wizard's arc through the chapters, the tone (warm, funny,
    never scary). All names invented for Kydux.
5.2 The course outline, `docs/dev/course.md`: every lesson with the idea it
    teaches, theory or practice, the API it unlocks, and its levels with
    their goals; the challenges after it. The order of the draft, refined
    to one idea at a time, as above.
5.3 Chapter 1, Arrival (methods, sequences, comments, arguments, strings),
    in the scene of the gate: the story at the gate, seven lessons, nine
    levels (seven practices, a fix, an improve) taught by Nuri, the wand
    lent, the first spell, and the story up to the castle (`course.md`).
5.4 Chapter 2, The library (variables, attributes, finding things), in the
    scene of the library: the mate's lesson and Wenna's six, whose pages on `print`
    and the variable run plain Python (D170) and whose blocks try ideas of the
    language, never the wizard (D174), eight levels (an improve, a fix), Eldra's
    books, locked doors and keys, and the wand bank.
5.5 Chapter 3, The passages (the cells and `position`, conditions, loops), in seven
    small scenes (D136, `sprint-30.md`, as the owner reads it, `sprint-31.md`, each
    scene's states Gemini's, `sprint-32.md`, the crossing a row lower with its doors as
    painted, `sprint-33.md`, the marks on the floor, `sprint-34.md`, and the hole that
    opens, `sprint-35.md`): the friend's eleven lessons, whose pages run their code (D142),
    eleven levels (a fix, an improve), the naughty child's map as a window with the
    scene's plan in ink, drawn as the scene draws it and opened by its spell (D134,
    D143, D151, D159), the dark tunnel (D135, D145, D152), the patrolling teacher
    (D137), the crossing's one idea a level (D146), the hole that opens in the floor, in
    four periods, on one cell or two (D167), the dark room and a position's two numbers
    (D153), doors of two cells (D150), each door painted at every tick and hung on one
    jamb (D156), its leaf within its doorway (D158), the cells where the figures walk
    (D149, D154, D157), masks opaque inside their outlines (D155), the goal's mark lying
    on the floor with its ring seen as thin as a figure's outline over the cut-outs that
    cover it, never over a figure, in every chapter (D160, D168), a door's open state
    asked of the model on the whole scene (D161), the storeroom dark until the level
    that lights it and drawn on the plan as any room, with its key (D162, D163, D169), a
    key drawn small (D164), the way down's double door a quarter open (D165), and the
    plan's names covering nothing (D166); and, before its release, the last findings of
    chapters 1 and 2 (`sprint-36.md`): the castle's threshold, where the wizard says why it
    does not go in yet (D171), the mark whole in an open doorway (D172), Ilda's good night
    to the two, and a lesson with nothing worth trying left without a block (D173); and,
    after the owner's whole-game pass (`sprint-37.md`), lesson blocks that try ideas of the
    language and never the wizard (D174), the card that waits for the wizard's words
    (D175), a bonus earned by the spell cast (D176), a stop that is no outcome (D177), `osto`
    taught after the `while` in a lesson of its own and needed by the night walk's hole,
    which never closes (D178), and the browser tests run on GitHub at a release (D179); and,
    after the owner's next pass (`sprint-38.md`), a lesson block's walk told in steps,
    never a cell (D180), and a mark covered only by what is painted over it, the three
    doors' top arch cut to its stones (D181).
5.6 Chapter 4, The broom (lists, a loop over a list, an `if` inside it, flying,
    functions and their arguments), in four scenes behind the castle by morning
    (`sprint-39.md`): the broom shed, the lake's edge, and the long ring field and the
    race course, forty-two cells wide, which the camera follows; the friend's six
    lessons and Ilda's one, nine levels (a fix, two improves), the brooms knotted with
    a black thread and untied (D183), found all at once and counted (D184), things
    drawn from a sprite of their kind (D182), flying with `drevo` three times as fast
    with the wind's sound (D185), cells a flight crosses and a walk does not (D186),
    rings flown through in order (D187), the flying figures, Zarek and Rinlo (D188),
    the race scored by Ilda's count (D189), and a function taught where a loop cannot
    serve (D190); and, in the same sprint, the browser tests' time on GitHub (D191), a
    score of its own for every chapter (D192), the page's look with a welcome page
    (D193), and portraits of every character and every look (D194); and, in
    `sprint-40.md`, the shed's brooms hung on a peg a cell (D195), found by where the
    wizard stands, by the wall or in the straw (D196),
    the broom taught first with a practice of one `untie` (D197), a list's element by
    its index and both ways of a loop over a list (D198), a story's step that frames a
    place (D199), and the map folded by chapter (D200); and, in `sprint-41.md`, a level
    that frames a place, the shed's five levels seen whole (D201), and the shed's lying
    brooms in sight on the boards or hidden under the straw (D202); and, in
    `sprint-42.md`, the child told what may differ at each run and never of ways (D204),
    a level's own forbidden cells and *El cobertizo* counting only the floor (D205), the
    wall walked by the distance from one end, a hung thing as far as the cell under it
    (D206), a thing drawn by the game moved sideways on its cell (D207), the review's
    sheets with the grid (D208), the themes chosen by ear with a struck piano (D209), one
    set of voices a theme (D210), the row under the pegs walked (D211), and the straw
    walked by the coordinates after the lesson *less-or-greater* (D212); and, in
    `sprint-43.md`, something to read while a screen loads, a story's words before its
    scene and a tip for a child who has begun (D214), `drevo` cast in the air that lands
    (D215), the walkthrough in one arrangement (D216), the shed from the easy to the
    hard, the check on the wall's own brooms and one broom before all of them (D217),
    and a long program given as comments, one for each instruction (D218).
5.7 Chapter 5, The familiar (classes and objects), in a scene of the tower:
    the child defines a creature with its attributes and methods and sends
    it through a passage.
5.8 Challenges: ten levels with no lesson, each combining more, with bonus
    goals, extended over time.
5.9 Each level with `solution.py`, three or more `wrong/`, hints, both
    languages; each chapter with its map picture and theme.

UAT: the owner plays each chapter as it lands, in both languages, with a
child where possible; the notes become pieces.

### Phase 6 — Distribution

The game on a child's computer, three ways.

6.1 The Go launcher: embeds `dist/`, serves it on `127.0.0.1:<free port>`
    with the COOP/COEP headers, opens the default browser, `--listen` to
    bind elsewhere, `--progress-file` to keep progress beside the binary,
    quits when the browser tab closes (a heartbeat) or on Ctrl-C; its
    messages through `i18n/` too; Linux, Windows and macOS builds in one
    `go build` each from Linux; `tests/launcher/`.
6.2 Release bundles: `kydux-<version>-linux-x86_64`, `-windows-x86_64.exe`,
    `-macos-universal` (ad hoc signed, with the user guide saying how to open
    an unsigned app the first time); a GitHub workflow builds them on a tag.
6.3 The Debian package `kydux` (`packaging/debian/`): the static files under
    `/usr/share/kydux`, the launcher, a desktop entry; built reproducibly;
    then the Kidux module that presents it, in Kidux's own repository and by
    Kidux's rules.
6.4 The user guide, `docs/en/` and `docs/es/`, with the Playwright
    screenshots: installing, playing, moving progress between computers.
6.5 The website: Kydux's section on the Kidux site (its words through the
    site's `toml` files, its pictures from the suite) and its `README`s
    completed; the repository public when the owner says.

UAT: the Windows and macOS binaries on real machines; the `.deb` on a Kidux
machine; the guide followed as written.

### Phase 7 — Later

Not planned in detail; kept possible by the design.

- Online: the built game on a paid host, with the saved games kept on the
  server (the same list as the browser's, D70, behind the same store) and
  accounts; then rankings by stars and lines; then duels between wizards as
  a level type where two programs run in the same world.
- More languages: a new pair of files per language.
- A level editor for teachers, from the Tiled format.
- Speech for the characters, if ever wanted; the lessons stay text.

## 6. Risks and what to do about them

| Risk | Answer |
|---|---|
| A painted scene does not follow the levels it must hold | Paint it from the levels' requirements, read the map from the picture and place the levels on it (D76); paint again rather than force it. |
| Hats and hair overlays do not align | Colours only for the creator; a few whole-wizard variants later. |
| Pyodide's first load is slow (10–20 MB) | A loading screen with the story's first lines; the launcher serves it from disk; the browser caches it. |
| A child's code hangs the worker | Interrupt buffer or restart (1.7), tested in phase 1. |
| Lessons too long for an 8-year-old | Pages of three sentences; the owner's UAT with a child in phase 5. |
| macOS refuses an unsigned launcher | Ad hoc signing and the guide's two-click workaround; notarisation when the project can pay for it. |
| The two languages drift | `tools/i18n_check.py` in every check run. |
