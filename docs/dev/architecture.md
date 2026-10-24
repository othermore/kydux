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
                the wizard by personal.ts (D37)
  src/runtime/  the worker that holds Pyodide, and the page's side of it
  src/engine/   the scene in Phaser, where everything stands before a run
                (layout.ts), what an actor sees (sight.ts, the same rule as the
                world's, tested on tests/fixtures/sight.json), a stair's state at
                a tick (stairs.ts, the same rule as the world's), the playback, and
                the words the scene shows (words.ts, why an action failed);
                the looks a wizard may have (looks.ts) and the figures drawn
                until the art comes (placeholders.ts)
  src/editor/   the child's editor, CodeMirror
  src/ui/       the screens: start (start.ts), the wizard's creator
                (wizard.ts), the map (map.ts), a lesson (lesson.ts), the
                settings (settings.ts), and the level screen, a view of the run controller
                (controller.ts), with its goals panel, outcome card, start and
                win cards (cards.ts), and the wizard's notebook (notebook.ts)
  src/content/  loading a level's level.json and its text.<lang>.json, a lesson
                and its pages (lessons.ts), and the course (course.ts): its
                chapters, what comes next, a stop's state, what the child
                knows in a level (D40)
  src/progress/ the player's progress, one document (store.ts), and the calls
                the screens make on it (progress.ts)
  scripts/      before dev and build: copy Pyodide into public/, pack the world
                into world.zip, copy the content into content/ with the course in
                content/course.json, and write the world's table as api.json
  e2e/          the browser tests (Playwright), beside the node_modules they need;
                the loop's screenshots in e2e/shots/ (D39)
world/          kydux_world, the model of the levels, and its tests: level.py reads
                a level; world.py holds the wizard and the ticks; things.py the
                read-only base and the things; actors.py the teacher and the sight
                rule; goals.py the goals; api.py the names a level may teach;
                explain.py errors in the child's words; run.py runs the child's code;
                sandbox.py keeps it from Pyodide's bridge to JavaScript
content/        the levels, each with level.json, its words in text.<lang>.json,
                its solution and its wrong answers (the last two never shipped);
                the lessons, each with lesson.json and <lang>.md; the chapters,
                each with chapter.json and text.<lang>.json
i18n/           en.json, es.json: the app's words, the same keys in each
docs/dev/       the plan, the sprints, this log, the guide; the story (story.md)
                and the course (course.md) that the content is written from
tools/          the i18n check, the forbidden-word check, the writing tool
                (write/: Gemini drafts the child's texts from a brief, D55),
                later the art tools
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
| Gemini model | gemini-3.1-pro-preview | the writer of the child's texts (D55), pinned in `tools/write/write.py` |
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
wizard.say(text)             # a tick; a door beside the wizard whose password it is opens
wizard.cast(spell)           # a tick: with the wand carried, a spell of the level's,
                             # where the wizard stands (D42); zelim breaks a seal beside it
wizard.wait(ticks=1)         # a tick each: stands still while the world moves on
wizard.pick_up()             # a tick: the thing on the wizard's tile, into wizard.items
wizard.find_nearest(kind)    # the nearest thing or actor of a kind ("key"...), or None
wizard.find_all(kind)        # all of them, nearest first, then in reading order
wizard.has(kind)             # whether it carries one of that kind
wizard.position              # Position(x, y), which compares as a tuple
wizard.facing                # "up", "down", "left" or "right"
wizard.items                 # the things it carries, from the start those of the
                             # level's carrying (D49)
wizard.give(thing)           # a tick: a thing it carries, to the actor beside it (D48)

thing.kind, thing.name       # a key, a book, a wand, a potion, a door: by its id
thing.position               # where it lies; None once carried

door.locked, door.sealed, door.password, door.is_open
door.open()                  # a tick: from a tile beside it (D24), with its key when
                             # locked; else blocked, and always for a sealed door or
                             # one with a password (D43)

teacher.kind, teacher.name, teacher.position, teacher.facing
teacher.can_see(target)      # the target straight ahead, within its sight (4 tiles by
                             # default), with no wall or closed door in between; it sees
                             # over a shelf (D46)

ghost.kind, ghost.name, ghost.position, ghost.facing    # and cat.*: they stand (D48)

stair.in_place               # whether a step onto it, taken now, lands on it (D53)
```

The map's characters: `#` a wall, `.` floor, `=` a shelf (D46), `S` the
wizard's start, any other letter a floor tile named by it (a marker).

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
| `move` | wizard, or an actor | `from`, `to`, `facing` | walks it one tile, facing that way |
| `bump` | wizard | `at`, `facing`, `by`: `wall`, `door` or `stair` | nudges the wizard against it |
| `say` | wizard | `text` | a bubble over the wizard for three ticks, under it when there is no room above |
| `wait` | wizard | `at` | nothing: the wizard stands still |
| `pick_up` | wizard | `id`, `at` | the thing rises and vanishes; `data-carried` |
| `open` | wizard, by `door.open()`; or the door, in the wizard's tick, opened by a spell or a word | `id`, `at`, `by`: `hand`, `spell` or `word` | the door's frame turns open; `data-doors` |
| `cast` | wizard | `spell`, `at` | a ring of light grows from the wizard and fades |
| `pull` | the thing, in the wizard's tick | `id`, `from`, `to` | the thing slides to the wizard's tile (D47) |
| `light` | `world`, in the wizard's tick | `at` | the dark is lifted (D52) |
| `hold` | the stair, in the wizard's tick | `id`, `from`, `until`: the ticks it is held | the stair glows, and stays in place for those ticks (D53) |
| `give` | wizard | `id`, `to`, `at` | the thing floats from the wizard to the actor and fades; the actor faces the wizard (D48) |
| `blocked` | wizard | `at`; `by`: a door's id, or `wizard`; `reason`: `locked`, `far`, `open`, `nothing`, `sealed`, `password`, `no_wand`, `unknown_spell` (with `spell`), `nothing_near` (with `spell`), `not_carried` or `nobody`; `tried`: whether the wizard got to try | the wizard thinks why, in a grey cloud; when `tried`, the door or the wizard shakes (D28) |
| `turn` | an actor | `facing` | the actor faces the other way |
| `seen` | an actor | `by`, `at` | the scene shakes and the actor's cone turns red; the run ends `caught` |

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
  tick's events carry its number and the child's line. Asking takes no
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
  mechanism of the language's.
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
  (`app/src/progress/store.ts`) has `load()` and `save(progress)`;
  `LocalProgressStore` keeps the document in `localStorage` under
  `kydux.progress`, and a remote store can come later behind the same
  interface. The document has a `version`; one of another version, or
  none, is read as the defaults, and each field read back is checked for
  its shape. The language chosen, the settings, the code typed in each
  level, the hints shown, whether a level was tried, its stars, the start
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
  it is shown as code, and Try it puts it in the next level's editor when
  the child has typed nothing there. marked (`app/src/ui/lesson.ts`) turns
  the Markdown into HTML, put in as it is: the lessons are the project's
  own, and `world/tests/test_course_content.py` refuses HTML in them, as
  well as a lesson missing in a language, pages that differ in number
  between languages, more than one Try it, a `teaches` the next level does
  not teach, and a Try it that fails in that level. Code on a page is
  plain `<pre>`, not highlighted: a highlighter would be one more
  dependency for a few short lines, and the editor already shows the
  colours. Reaching the last page marks a lesson read.
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
  as it was. *Start from the beginning* keeps the wizard; an import keeps
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
  first side is taken and `{wizard}` is `wizard.no_name` (*apprentice*,
  *aprendiz*: a word with no gender in either language).
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
  wand's action (D27), and without the wand carried it is refused with a
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
- **D47 — `fendra` pulls the nearest thing the wizard can see.** Decided
  2026-10-21 (sprint-8.md), built the same day. Cast with the wand,
  `fendra` looks along the four ways from the wizard's tile, up to three
  tiles each (`FENDRA_REACH`), through shelves and not through walls or
  closed doors, and moves the nearest thing that can be carried onto the
  wizard's tile: nearest by distance, then by reading order, as
  `find_nearest` chooses. The thing's `pull` event comes in the wizard's
  tick, the thing's own, as a door's `open` by a spell is (D43). With
  nothing to pull the cast is refused, `nothing_near`, and the wizard
  shakes, having tried. The wizard then picks the thing up: a spell moves
  the world, the hands carry. A spell's effect is looked up by name in
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
  has been given to that actor.
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
  used.
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
  world and shows one: the first not won, with a `#way` select, after a
  run, to play back any other; the goals, the timeline and the card follow
  the way shown, and the card names it. The card says *won* only when
  every way is: a way won while another is not is its own outcome,
  `way_won`, so that the progress document never counts a level won by
  looking at its one good way. The start card lists the ways in their
  words, `ways` in `text.<lang>.json`.
- **D52 — A dark room hides what lies on its floor.** Decided 2026-10-21
  (sprint-9.md), built the same day. A level with `"dark": true` is unlit
  until `kirra` (which it must list among its spells): until then, a
  thing that can be carried and lies farther than one tile from the
  wizard, in any of the eight directions, has no `position`, and so
  `find_nearest`, `find_all` and `fendra` pass it by; doors, stairs and
  actors are the castle's shape, and are seen. `kirra` makes a `light`
  event, the world's, and lights the room for the rest of the run; in a
  lit room it does nothing. A teacher's sight is not darkness's
  business: Dask carries a lantern. What is seen is what is near the
  wizard now, which the code can ask about; rules out a fog that
  remembers where the wizard has been, which it cannot.
- **D53 — A stair comes and goes, and `osto` holds it.** Decided
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
- **D54 — `not`, `==` and `can_see` belong to the lesson on true and
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
  by hand. Story pages are not numbered.
- **D57 — Stars say how well, and why.** Decided 2026-10-22 by the owner's
  UAT (sprint-10.md), built the same day. A win earns three stars and
  loses one for each of: a hint shown in the level; the winning run
  bumping into a wall, a door or a stair; and a bonus goal unmet, or, in a
  level with no bonus goal, a run before the winning one (the progress
  counts runs per level, `runs`). A win is one star at least.
  `app/src/ui/stars.ts` judges, and the win card lists the three reasons,
  kept or lost (`stars.<reason>`), so that the child knows what to try
  again for; the progress keeps the most stars.
- **D60 — A lesson may teach a concept, which the notebook follows.**
  Decided 2026-10-22 by the owner's UAT (sprint-10.md), built the same
  day. `teaches` in `lesson.json` may name a concept beside the API's
  names: `concept:arguments`, `concept:comments`, `concept:print`,
  `concept:strings`. `pack-world.mjs` writes the concepts known at each
  level into `course.json`'s `concepts`, and the page gives them to the
  level as `concepts`. `api.table()` gives an action that can go without
  its argument a `simple` example (`wizard.move_right()`), with its words
  in `notebook_simple.<role>.<member>`; the notebook and the completion
  show the simple ones until `arguments` is known. A level outside the
  course is shown as one that knows every concept.
- **D58 — The wizard picks up what is on its tile or beside it, and may
  say which.** Decided 2026-10-22 by the owner's UAT (sprint-10.md), built
  the same day. `wizard.pick_up()` takes the thing on the wizard's tile,
  else the one thing on the four tiles beside it, shelves included; with
  several in reach and none underfoot it is refused with `which_one`, whose
  thought names them and shows how to say which. `wizard.pick_up(thing)`
  takes that thing when it is in reach, and is refused with `far` when it
  is not; a word in quotes is not a thing, and is explained as an argument
  of the wrong kind. A thing on a shelf beside the wizard comes down by
  hand; `fendra` is for what lies farther. The start card opens over the
  notebook and says *Continue* when the child opens it again with *?*; a
  password door opens in the second half of its tick, once the word is
  said.
