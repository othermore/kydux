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
  src/i18n/     every string the player sees, from i18n/<lang>.json
  src/runtime/  the worker that holds Pyodide, and the page's side of it
  src/engine/   the scene in Phaser, where everything stands before a run
                (layout.ts), what an actor sees (sight.ts, the same rule as the
                world's, tested on tests/fixtures/sight.json), and the playback
  src/editor/   the child's editor, CodeMirror
  src/ui/       the screens: the level screen, its goals panel and outcome card
  src/content/  loading a level's level.json and its text.<lang>.json
  scripts/      copy Pyodide into public/ and pack the world, before dev and build
  e2e/          the browser tests (Playwright), beside the node_modules they need
world/          kydux_world, the model of the levels, and its tests: level.py reads
                a level; world.py holds the wizard and the ticks; things.py the
                read-only base and the things; actors.py the teacher and the sight
                rule; goals.py the goals; api.py the names a level may teach; run.py
                runs the child's code; sandbox.py keeps it from Pyodide's bridge to
                JavaScript
content/        the levels, each with level.json, its words in text.<lang>.json,
                its solution and its wrong answers (the last two never shipped);
                later the lessons and chapters
i18n/           en.json, es.json: the app's words, the same keys in each
tools/          the i18n check, the forbidden-word check, later the art tools
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
| codemirror | 6.0.2 | the editor (D17), with the packages below |
| @codemirror/lang-python | 6.2.1 | |
| @codemirror/state, view, commands, language, autocomplete | 6.7.6, 6.43.15, 6.11.1, 6.13.1, 6.20.4 | imported directly, so declared and pinned; one copy of each in the lock |
| Python on the machine | 3.13 | `kydux_world` keeps to syntax that runs on 3.12 and up |
| pytest | 9.1.1 | |
| ruff | 0.17.1 | one configuration for all the Python, `ruff.toml` |
| Go | 1.27 | for the launcher, phase 6 |

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
