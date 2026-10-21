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
| Art tools | Python scripts in `tools/art/` calling Gemini's image models and cutting sheets | Reproducible: every generated asset keeps its prompt. |
| Sound tools | Scripts calling Lyria for music and effects; free CC0 effects where simpler | The game's own music. |

Versions to pin when phase 0 starts, each checked against its latest release:
Node 20.19 (the machine's; Vite needs 20.19+), Vite 6, TypeScript 5, Phaser
3.90, CodeMirror 6, Pyodide 314.0.x, Vitest 3, Playwright 1.5x, Go 1.27 (the
machine's), Tiled 1.11, Python 3.13 on the machine (the world keeps to syntax
that runs on 3.12 and up, so that it runs on both).

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
    chapter.json                          id, and the items in order: lesson:<id>, level:<id>
    text.en.json  text.es.json            the chapter's title
  lessons/01-first-action/
    lesson.json                           id, and what it teaches: the names the
                                          level after it needs (`teaches`)
    en.md  es.md                          the lesson, a few short pages separated by ---
  levels/01-the-corridor/
    level.json                            map file, actors, exposed API, goals, tick
                                          limit, hints keys, starting code key
    map.tmj                               Tiled map: layers floor, walls, objects
    text.en.json  text.es.json            title, goals, hints, starting code's
                                          comments and strings, dialogue
    solution.py                           wins the level
    wrong/*.py                            each must not win (the naive mistakes)
```

Goals are declared (`reach`, `collect`, `not_seen_by`, `say`, `lines_under`,
`open`) and a level may add `goals.py` for one of its own. The lesson's
Markdown, with no HTML in it, may hold one fenced block marked `python try`:
*Try it* puts it in the next level's editor when the child has typed nothing
there (D33). `pack-world.mjs` writes the chapters, in the order of their
directories, as `content/course.json`, the one order of the course (D32). A
chapter's picture for the map comes with the art (phase 4); the map draws
its stops as a path until then.

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
  `current` the item last opened, where *Continue* goes. `LocalProgressStore`
  keeps it in `localStorage`
  under `kydux.progress` (IndexedDB when it outgrows it); *Export* and
  *Import*, on the start screen, move it as a JSON file between computers;
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
- **GitHub Actions** runs `ci/check.sh` and the Playwright suite on every push
  and builds the release bundles on a tag. Pushes happen only inside the
  hours, so the runs do too.
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

UAT: the three levels from the MacBook; a misspelled action gets a Spanish
message with a suggestion; the scrubber; a hint; stars.

### Phase 3 — The shell

The game around the levels: the course as the child walks it.
Sprint 5 has 3.5, 3.1, 3.3, 3.4 and 3.6 (`sprint-5.md`); sprint 6 has 3.9, 3.2,
3.7 and 3.8 (`sprint-6.md`).

3.1 The start screen: language, New wizard / Continue, Export / Import.
3.2 The wizard creator: a name, a girl or a boy, and a look chosen among
    several (D36): now palettes and hair styles on the placeholder figure,
    later palette swaps and overlays on the base sprite; shown in every
    scene.
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

From placeholder squares to the game's look, with reproducible tools.

4.0 The way the sprites are made, decided by trying two on the same brief
    (the wizard's walking sheet in the retro pixel style of `draft.md`,
    section 5, and one object), each with GPT Image and with Gemini's image
    model where it generates:
    1. autosprite.io: close to what is wanted, with cleanup and some back
       and forth still needed.
    2. GPT-image 2.5, a clear step above Gemini's image model, with the
       agent-sprite-forge skill (https://github.com/0x0funky/agent-sprite-forge)
       for consistency from one sheet to the next, iterating until good
       enough.
    What each gives, what it cost in time and money, and how the pieces cut
    and fit, go in the architecture log with the choice. GPT Image needs an
    OpenAI key in `secrets.env` (`OPENAI_API_KEY`), beside the Gemini one.
4.1 `tools/art/generate.py`: a prompt file in, an image out, the key from
    `secrets.env`, the prompt and model recorded in the asset's manifest
    entry; `tools/art/cut.py`: key out the background, slice a grid, reduce to
    true pixels, write a sprite sheet and its Phaser atlas JSON.
4.2 Terrain, second round: each terrain asked for alone as a seamless tile
    (floor variants, wall top and face, carpet, grass, water), and a free
    tileset in a matching style as the fallback; the decision in the
    architecture log.
4.3 The wizard's base sheet with placeholder palette colours: idle, walk
    (four directions), cast, pick up, celebrate; the palette swap wired to the
    creator; hats and hair overlays if a sheet comes out on the same grid.
4.4 Objects and actors of chapters 1–2: wand, books, keys, doors, chests,
    potions, broom, teacher, cat, ghost, portraits; each on the grid.
4.5 The UI skin: cards, panels, buttons, the notebook, the map's
    frame, icons for goals, actions and spells, a font with its licence (Andika or a
    pixel font readable by children).
4.6 Sound: `tools/sound/generate.py` with Lyria for a chapter theme and short
    effects (step, cast, door, pick up, win, fail), free CC0 effects where
    generation is poorer; the characters' voices as short sounds; Phaser's
    audio with a mute switch; manifests.
4.7 `art/README.md`: the style guide: grid, palette, the view angle, how a
    new sprite is made and reviewed.

UAT: the three levels of phase 2 with real art and sound; the creator's
colours showing on the map and in the scene; a tile seam hunt.

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

5.1 The story bible, `docs/dev/story.md`: the school, its name and places,
    the characters (the head, the teachers, a rival, a friend, the cat, a
    ghost), the wizard's arc through the chapters, the tone (warm, funny,
    never scary). All names invented for Kydux.
5.2 The course outline, `docs/dev/course.md`: every lesson with the idea it
    teaches, theory or practice, the API it unlocks, and its levels with
    their goals; the challenges after it. The order of the draft, refined
    to one idea at a time, as above; the lessons and levels of sprint 5 are
    replaced by it.
5.3 Chapter 1, Arrival (methods, sequences, arguments, strings): about four
    lessons, eight levels: the gate, the corridor, the wand on its pedestal,
    the first spell.
5.4 Chapter 2, The library (variables, attributes, finding things): books
    give spells; locked doors and keys.
5.5 Chapter 3, Corridors and passages (loops, conditions): the moving
    staircases, the patrolling teacher, slipping out of class.
5.6 Chapter 4, The broom (lists, functions): flying, the race, an action of the
    child's own.
5.7 Chapter 5, The familiar (classes and objects): the child defines a
    creature with its attributes and methods and sends it through a passage.
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

- Online: the built game on a paid host, with a `RemoteProgressStore` and
  accounts; then rankings by stars and lines; then duels between wizards as
  a level type where two programs run in the same world.
- More languages: a new pair of files per language.
- A level editor for teachers, from the Tiled format.
- Speech for the characters, if ever wanted; the lessons stay text.

## 6. Risks and what to do about them

| Risk | Answer |
|---|---|
| Generated terrain never tiles seamlessly | Free tilesets in a matching style (phase 4.2 decides early). |
| Hats and hair overlays do not align | Colours only for the creator; a few whole-wizard variants later. |
| Pyodide's first load is slow (10–20 MB) | A loading screen with the story's first lines; the launcher serves it from disk; the browser caches it. |
| A child's code hangs the worker | Interrupt buffer or restart (1.7), tested in phase 1. |
| Lessons too long for an 8-year-old | Pages of three sentences; the owner's UAT with a child in phase 5. |
| macOS refuses an unsigned launcher | Ad hoc signing and the guide's two-click workaround; notarisation when the project can pay for it. |
| The two languages drift | `tools/i18n_check.py` in every check run. |
