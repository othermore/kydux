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
  src/engine/   the scene in Phaser, and the playback of a run's events
  src/editor/   the child's editor, CodeMirror
  src/ui/       the screens: the level screen, its goals panel and outcome card
  src/content/  loading a level's level.json and its text.<lang>.json
  scripts/      copy Pyodide into public/ and pack the world, before dev and build
  e2e/          the browser tests (Playwright), beside the node_modules they need
world/          kydux_world, the model of the levels, and its tests
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
