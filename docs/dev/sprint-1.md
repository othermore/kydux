# Sprint 1 — Foundations and Python in the browser

Phase 0 of `plan.md` whole, and pieces 1.1 and 1.2 of phase 1. At its end
the owner opens the game from the MacBook, in Spanish and in English, types
Python into a box, and watches it run in the browser: the hardest technical
risk of the project (Pyodide in a worker, the interrupt, the world package
shared with CPython) is retired before any game is drawn.

The pieces are done in order; each is committed locally when its checks pass
(section 7) and never pushed by the implementer. Everything here is a
decision already taken; what it leaves open it says so.

## 1. Before starting: the machine

The development machine is Debian 13, with Python 3.13, Go 1.27 and Debian's
Node 20.19. **Node 20 is past its end of life and Vitest 5 refuses it**, so
Node comes from NodeSource's apt repository instead (D9 of the architecture
log): Node 24, the current LTS, maintained until 2028.

```sh
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version      # v24.x
```

Nothing else is installed system-wide: Python packages go in a venv, npm
packages in `app/node_modules`, Playwright's browser in `~/.cache/ms-playwright`.

The owner also creates, once, outside the repository:

```sh
printf '%s\n' '<the name of the game Kydux takes after, lowercase>' > ~/.config/kydux/forbidden.txt
```

which the forbidden-name check (piece 0.3) reads. The name itself is never
written in any file of the repository, this one included.

## 2. Versions

Pinned exactly (no `^`, no `~`) in `app/package.json` and `world/pyproject.toml`;
the implementer checks each against npm and PyPI the day it is added and
records what was pinned in `docs/dev/architecture.md`:

| Package | Version | Note |
|---|---|---|
| node | 24 LTS | `.node-version` at the repository root; `engines.node` in package.json |
| vite | 8.3.x | needs Node ^20.19 or >=22.12 |
| typescript | 5.9.x | 7.x is the new Go-based compiler; adopted later, on its own |
| vitest | 5.0.x | needs Node 22+ |
| @playwright/test | 1.64.x | |
| pyodide | 314.0.x | Python 3.14; the npm package carries the whole distribution |
| python | 3.13 (machine), 3.14 (Pyodide) | `kydux_world` keeps to syntax that runs on 3.12 and up |
| pytest | 8.x | in the venv |
| ruff | 0.1x | lint and format for Python, in the venv |

Phaser and CodeMirror are not part of this sprint. Phaser 4 is out (4.2);
whether the game uses 3.90 or 4.x is decided at piece 1.3, after checking
4.x's Tiled support, and goes in the decision log.

## 3. Repository layout after the sprint

```
kydux/
  .node-version
  .github/workflows/check.yml
  app/
    package.json  package-lock.json  tsconfig.json  vite.config.ts  index.html
    playwright.config.ts
    scripts/copy-pyodide.mjs   scripts/pack-world.mjs
    public/            (pyodide/ and world.zip are written here at build and ignored)
    src/main.ts  src/style.css
    src/i18n/index.ts  src/i18n/index.test.ts
    src/runtime/runtime.ts  src/runtime/worker.ts  src/runtime/protocol.ts
    src/runtime/runtime.test.ts
    src/ui/playground.ts
  world/
    pyproject.toml
    kydux_world/__init__.py  level.py  world.py  goals.py  run.py
    tests/test_level.py  test_world.py  test_goals.py  test_run.py  test_levels_content.py
  content/levels/01-the-corridor/level.json  solution.py  wrong/too_short.py  wrong/into_wall.py
  i18n/en.json  i18n/es.json
  tools/i18n_check.py
  tests/project/conftest.py  test_forbidden.py  test_secrets.py  test_readmes.py  test_manifests.py
  tests/e2e/playground.spec.ts
  ci/check.sh  ci/hooks/pre-commit  (hours.py, push.sh, hooks/pre-push exist)
  docs/dev/README.md  architecture.md  dev-environment.md  (draft.md, plan.md, sprint-1.md exist)
```

`.gitignore` gains: `app/node_modules/`, `app/dist/`, `app/public/pyodide/`,
`app/public/world.zip`, `app/test-results/`, `app/playwright-report/`,
`.venv/`, `world/*.egg-info/`, `.ruff_cache/`.

## 4. The pieces

### 0.1 The app, served on the network in two languages

**Files.** `app/package.json` (private, `"name": "kydux"`, `"type": "module"`,
scripts below), `app/tsconfig.json` (strict, `target` and `lib` ES2022 +
DOM + WebWorker, `moduleResolution: bundler`, `noUncheckedIndexedAccess`),
`app/vite.config.ts`, `app/index.html`, `app/src/main.ts`, `app/src/style.css`,
`app/src/i18n/index.ts`, `i18n/en.json`, `i18n/es.json`.

**Scripts** in `package.json`:

| script | command |
|---|---|
| `dev` | `vite --host` |
| `build` | `node scripts/copy-pyodide.mjs && node scripts/pack-world.mjs && vite build` (the two scripts arrive in 1.1; until then `vite build`) |
| `preview` | `vite preview --host` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `e2e` | `playwright test` (arrives in 1.1) |

**Vite config.** `server.host = true`; `server.headers` and `preview.headers`
both set `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`; `server.fs.allow` includes the
repository root, so `i18n/` and `content/` outside `app/` can be imported;
`build.target: 'es2022'`; `build.sourcemap: true`.

**i18n module.** `app/src/i18n/index.ts` exports:

```ts
export type Language = 'en' | 'es';
export const languages: readonly Language[];           // from the files present
export function detectLanguage(): Language;            // localStorage 'kydux.language', else navigator.languages matched by primary tag, else 'en'
export function setLanguage(lang: Language): void;     // saves and re-renders (dispatches a 'kydux:language' event on document)
export function currentLanguage(): Language;
export function t(key: string, params?: Record<string, string | number>): string;
```

The JSON files are imported statically (`import en from '../../../i18n/en.json'`),
nested objects, keys addressed as `app.title`; `{name}` placeholders replaced
from `params`; a missing key returns the key itself and logs a warning once
(the i18n check keeps that from reaching a release). No library.

**The page.** `index.html` has `<html lang>` set at runtime, a `<title>` from
`app.title`, a `<main>` the code fills. `main.ts` renders: a heading
`app.title` ("Kydux"), a line `app.tagline` ("A game for learning Python" /
"Un juego para aprender Python"), a language `<select>` labelled
`app.language` with the two languages by their own names (`language.en`
"English", `language.es` "Español"), and a status line `app.isolated_yes` /
`app.isolated_no` ("This page can stop a spell that runs forever" / "…
cannot stop a spell that runs forever: the server is not sending the
isolation headers") from `window.crossOriginIsolated`. Changing the select
re-renders without reloading. Plain DOM, no framework: the shell stays small
and this choice is logged (D10).

**Style.** `style.css`: a system sans-serif, a dark-on-light palette with
CSS variables (`--bg`, `--fg`, `--accent`), readable at 1280×720, 16px gutters.

**Tests.** `src/i18n/index.test.ts` (Vitest, `environment: 'node'`, with a
stubbed `navigator` and `localStorage`; no DOM library is needed): placeholder
substitution, fallback to the key, the detection order. Parity between the
languages is the check's job (0.3), not this test's.

**Done when** `npm run dev` prints a network URL; from the MacBook
`http://hija.local:5173` shows the page in the browser's language;
`curl -sI http://localhost:5173/ | grep -i cross-origin` shows both headers;
the page says it can stop a spell that runs forever; `npm run build` and
`npm run preview` serve the same from `dist/`.

### 0.2 The world package and its venv

**Files.** `world/pyproject.toml`: `[project] name = "kydux-world"`,
`version = "0.0.1"`, `requires-python = ">=3.12"`, no dependencies,
`[project.optional-dependencies] dev = ["pytest==8.x", "ruff==0.x"]`,
build backend `setuptools`; `[tool.ruff]` line length 99, `target-version
= "py312"`, rules `E, F, I, UP, B`; `[tool.pytest.ini_options] testpaths =
["tests"]`. `world/kydux_world/__init__.py`: `__version__`. `world/kydux_world/level.py`:
a first `Level` (grown in 1.2). `world/tests/test_level.py`.

**Venv.** `python3 -m venv .venv && .venv/bin/pip install -e 'world[dev]'`,
at the repository root, documented in `dev-environment.md`; `ci/check.sh`
uses `.venv/bin/` when it exists and the `PATH`'s otherwise (CI).

**Done when** `.venv/bin/pytest world` passes and `.venv/bin/ruff check world
&& .venv/bin/ruff format --check world` is clean.

### 0.3 The checks

**`tools/i18n_check.py`.** Loads every `i18n/*.json`, flattens to dotted
keys, and fails on: a key in one language and not another; a key used in
`app/src/**/*.ts` (as `t('…')` or `t("…")`, a literal first argument) and
missing from a language; a key present in the files that no source uses,
unless it starts with a prefix listed in `tools/i18n_dynamic.txt` (empty for
now; `error.` will go there in phase 2). Also scans `app/src/**/*.ts` for a
string literal that looks like prose assigned to `textContent`, `innerText`,
`title`, `placeholder` or passed to `alert`: a literal with a space and a
capital letter; fails on it, since every user-facing string goes through
`t`. Prints each finding as `file:line: message`; exit 1 on any.

**`tests/project/`** (pytest, `conftest.py` gives `repo_root` and
`tracked_files()` = `git ls-files -co --exclude-standard -z`, text files only
by a small extension list plus files without extension that decode as UTF-8):

- `test_forbidden.py`: reads `~/.config/kydux/forbidden.txt` (one word per
  line); for each tracked file, its path and its content, case-insensitive,
  must not contain any word; also the output of `git log --format=%B` for the
  commit messages. When the file does not exist (CI), the test is skipped
  with a message saying so; the pre-commit hook makes it run on the machine
  at every commit, which is where it matters.
- `test_secrets.py`: no tracked file matches `AIza[0-9A-Za-z_-]{35}`,
  `gh[pousr]_[0-9A-Za-z]{30,}`, `sk-[0-9A-Za-z]{20,}`, `-----BEGIN [A-Z ]*PRIVATE KEY`,
  `(?i)(api[_-]?key|password|secret)\s*[:=]\s*['"][^'"]{8,}`; and, when
  `~/.config/kydux/secrets.env` exists, none of its values (every `KEY=value`
  line, value 8 characters or longer) appears in any tracked file. The values
  are never printed; a failure names the file and the key's name only.
- `test_readmes.py`: `README.md` and `README.es.md` have the same sequence of
  heading levels and the same set of link and image targets.
- `test_manifests.py`: every file under `art/` and `sound/`, except `raw/`,
  is listed in a `manifest.toml` in its directory with `source`, `author`,
  `licence`; passes vacuously now.

**`ci/check.sh`.** `set -eu`; from the repository root; steps, each
announced with `==>`: `ruff check world tools tests` and `ruff format --check`
on the same; `pytest world tests/project`; `python3 tools/i18n_check.py`;
in `app/`: `npm ci` when `node_modules` is missing, `npm run typecheck`, `npm
test`, `npm run build`. `--e2e` adds `npm run e2e` at the end (needs a built
`dist/`; the Playwright config starts `vite preview` itself). Prints `==> All
checks passed` or stops at the first failure.

**`ci/hooks/pre-commit`.** Runs `pytest -q tests/project/test_forbidden.py
tests/project/test_secrets.py` against the staged tree (`git stash` is not
used; the tests read the working tree, which is what is committed in
practice; the comment says so). Takes under two seconds.

**Done when** `ci/check.sh` passes end to end on the machine, and a file
containing the forbidden word, or a fake `AIza…` string, makes `git commit`
refuse.

### 0.4 GitHub Actions

`.github/workflows/check.yml`: on `push` to `main` and on `pull_request`;
`ubuntu-latest`; `actions/checkout`, `actions/setup-node` with
`node-version-file: .node-version` and npm cache keyed on
`app/package-lock.json`, `actions/setup-python` 3.13; `pip install -e
'world[dev]'`; `ci/check.sh`; then `npx playwright install --with-deps
chromium` and `ci/check.sh --e2e` as a second job (from 1.1 on), uploading
`app/playwright-report/` as an artifact on failure. A concurrency group
cancels a superseded run. Since pushes happen inside the hours, so do the runs.

**Done when** the first push inside the hours shows a green check on GitHub.
The implementer does not push; the owner runs `ci/push.sh`.

### 0.5 The documents

- `docs/dev/README.md`: what each document is.
- `docs/dev/architecture.md`: *Overview* (two paragraphs), *Parts* (app,
  world, content, launcher, tools, checks, with the layout), *Decision log*
  with D1–D12 dated `date -I`: D1 a static web app in TypeScript built by
  Vite; D2 Pyodide in a worker; D3 the world in Python, tested under CPython;
  D4 Phaser, version deferred to 1.3; D5 CodeMirror 6; D6 the Go launcher;
  D7 i18n as JSON files with a parity check; D8 the forbidden name kept
  outside the repository; D9 Node from NodeSource; D10 no UI framework for
  the shell; D11 the COOP/COEP headers everywhere the game is served; D12 the
  GitHub hours (pointing at `ci/hours.py`). Each entry: what, why, what it
  rules out.
- `docs/dev/dev-environment.md`: setting the machine up (the apt lines of
  section 1, the venv, `npm ci`, Playwright's browser), the secrets file and
  the forbidden file, running the dev server and opening it from another
  computer (`hija.local`, the IP, the SSH tunnel), running the checks, the
  hours and `ci/push.sh`, how a commit is made (local, never pushed by the
  implementer).

### 0.6 Pins

Every version of section 2 pinned exactly; `.node-version` with `24`;
`package-lock.json` committed; the table copied into `architecture.md`'s
*Parts* with the date it was checked.

### 1.1 Python in a worker, with a playground

**Pyodide's files.** `app/scripts/copy-pyodide.mjs` copies from
`node_modules/pyodide/` into `app/public/pyodide/` the files the runtime
needs (`pyodide.mjs`, `pyodide.asm.js`, `pyodide.asm.wasm`,
`python_stdlib.zip`, `pyodide-lock.json`; not the type declarations),
skipping what is already there with the same size. It runs before `dev` too
(`"predev"`), so nothing is vendored and the game is served from its own
origin, which is what offline and the COEP header require.

**The world's files.** `app/scripts/pack-world.mjs` zips `world/kydux_world/`
(without `__pycache__`) into `app/public/world.zip`; `"predev"` runs it as
well. A change to the world while `dev` runs needs the script run again;
`dev-environment.md` says so (a watcher is not worth it yet).

**Protocol.** `app/src/runtime/protocol.ts` declares the messages:

```ts
type ToWorker   = { type: 'load' }
                | { type: 'run'; id: number; code: string; level?: LevelJson }
                | { type: 'interrupt' };
type FromWorker = { type: 'ready'; pythonVersion: string; worldVersion: string }
                | { type: 'load-error'; message: string }
                | { type: 'result'; id: number; result: RunResult }
                | { type: 'crashed'; id: number; message: string };
type RunResult  = { status: 'ok' | 'error' | 'interrupted';
                    stdout: string; stderr: string;
                    error?: { type: string; message: string; line?: number };
                    durationMs: number;
                    world?: WorldResult };           // from 1.2 when a level is given
```

**The worker.** `app/src/runtime/worker.ts`, a module worker
(`new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`).
On `load`: imports `/pyodide/pyodide.mjs` by a dynamic import marked
`/* @vite-ignore */` with `indexURL: '/pyodide/'`; fetches `/world.zip`
and `pyodide.unpackArchive`s it into the file system; `import kydux_world`;
answers `ready` with `sys.version` and `kydux_world.__version__`. On `run`
without a level: runs the code with `pyodide.runPython` under a redirected
`sys.stdout`/`sys.stderr` (Pyodide's `setStdout` with `batched`), catches
`PythonError`, answers `result`. On `run` with a level: calls
`kydux_world.run.run_code` (1.2) and returns its dict converted `toJs`.
When the page gives it a `SharedArrayBuffer`, calls `pyodide.setInterruptBuffer`
on it at load.

**The runtime.** `app/src/runtime/runtime.ts`:

```ts
export class Runtime {
  readonly ready: Promise<RuntimeInfo>;           // resolves on 'ready'
  constructor(opts?: { wallClockMs?: number });   // default 5000
  run(code: string, level?: LevelJson): Promise<RunResult>;
  interrupt(): void;
  onStatus(cb: (s: 'loading' | 'ready' | 'running' | 'restarting') => void): void;
}
```

`run` posts the message and starts the wall-clock timer; on timeout
`interrupt()`: when `crossOriginIsolated`, writes `2` into the interrupt
buffer (Pyodide raises `KeyboardInterrupt` in the running code, which
`run_code` reports as `interrupted`); otherwise terminates the worker,
answers the pending `run` with `status: 'interrupted'`, creates a new worker
and loads it again (`restarting` status). One run at a time; a second `run`
while one is pending rejects.

**The playground.** `app/src/ui/playground.ts`, rendered by `main.ts` under
the heading: a `<textarea>` (monospace, 12 rows, `Tab` inserts four spaces),
a *Run* button (`playground.run`), a *Stop* button (`playground.stop`), an
output `<pre>`, and a status line through i18n: `playground.loading`
("Preparing Python…"), `playground.ready` ("Python {version} ready"),
`playground.running`, `playground.stopped` ("Stopped: the code ran for
more than {seconds} seconds"), `playground.restarting`. Errors show the
Python type and message and the line when there is one, raw: the children's
words come in phase 2. The textarea starts with `print("Hello, Kydux!")`.

**Tests.** `src/runtime/runtime.test.ts` (Vitest): the message sequence
against a fake `Worker` (ready, a run, a timeout with and without
`SharedArrayBuffer`). `tests/e2e/playground.spec.ts` (Playwright, Chromium,
`app/playwright.config.ts` with `webServer: 'npm run preview'` on a fixed
port and `baseURL`): waits for the ready status (timeout 90 s the first
time), runs `print(1 + 1)` and sees `2`; runs `import kydux_world;
print(kydux_world.__version__)`; runs `while True: pass` and sees the
stopped status within 10 s and the runtime ready again after; repeats the
first step with the language switched to the other one and checks the
status text changed language. Playwright's test uses the same preview
server with the headers, so `crossOriginIsolated` is true there.

**Done when** all of that passes on the machine and the owner, from the
MacBook, sees Python run, a forever loop stopped, and the page usable
afterwards without a reload.

### 1.2 `kydux_world`: the grid, the wizard, ticks, events, a goal

The deterministic model the whole game rests on. Pure Python, no
dependencies, no I/O, no randomness.

**`level.py`.**

```python
@dataclass(frozen=True)
class Level:
    id: str
    width: int
    height: int
    walls: frozenset[Position]
    start: Position
    goals: tuple[GoalSpec, ...]
    tick_limit: int = 1000

    @classmethod
    def from_dict(cls, data: dict) -> "Level": ...
    @classmethod
    def from_json(cls, text: str) -> "Level": ...
```

`level.json` is this, with the map as rows of characters for now (Tiled
comes at 1.3): `#` wall, `.` floor, `S` start, `D` the door (a floor tile
that goals may name by its letter); any other letter is floor and is kept in
`markers: dict[str, Position]` for goals to refer to. Example,
`content/levels/01-the-corridor/level.json`:

```json
{ "id": "01-the-corridor",
  "map": ["#########",
          "#S.....D#",
          "#########"],
  "goals": [ { "kind": "reach", "marker": "D" } ],
  "tick_limit": 100 }
```

`Position` is a `NamedTuple(x, y)`, origin top-left, `x` to the right, `y`
down. `from_dict` validates: rectangular map, exactly one `S`, a goal's
marker present; raises `LevelError` with a clear message.

**`world.py`.**

```python
class Direction(Enum): UP, DOWN, LEFT, RIGHT  # with a .delta -> (dx, dy)

@dataclass(frozen=True)
class Event:
    tick: int
    actor: str          # "wizard"
    kind: str           # "move", "bump", "say"
    data: dict          # move: {"from": [x,y], "to": [x,y], "facing": "right"}; bump: {"at": [x,y], "facing": ...}; say: {"text": ...}
    line: int | None    # the child's line that caused it

class TooManyTicks(Exception): ...

class World:
    def __init__(self, level: Level) -> None
    tick: int; events: list[Event]; level: Level; wizard: Wizard
    def is_free(self, position: Position) -> bool     # inside and not a wall
    def record(self, actor: str, kind: str, data: dict) -> None
        # increments tick first; raises TooManyTicks when tick > level.tick_limit;
        # captures the child's line (below); appends the Event

class Wizard:
    position: Position; facing: Direction
    def move_right(self, steps: int = 1) -> None   # and move_left, move_up, move_down
    def say(self, text: str) -> None
```

A move of `steps` is `steps` ticks at most: each step turns the wizard that
way, then moves one tile when it is free (`move` event) or stays (`bump`
event) and stops the remaining steps. `steps` must be an `int` of 1 or more;
anything else raises `TypeError`/`ValueError` with a message that phase 2
maps (`move_right() takes a whole number of steps, 1 or more`). `say`
records the text as given (str() of it).

**The child's line.** `run_code` compiles the child's code with the
filename `<child>`; `World.record` walks `sys._getframe()` outwards to the
first frame whose `f_code.co_filename == "<child>"` and takes its
`f_lineno`; `None` when there is none (code run from tests).

**`goals.py`.**

```python
@dataclass(frozen=True)
class GoalSpec: kind: str; params: dict          # from level.json
@dataclass
class GoalResult: kind: str; params: dict; met: bool

class Goal(Protocol):
    def check(self, world: World) -> bool: ...

class ReachGoal:   # kind "reach", params {"marker": "D"} or {"at": [x, y]}
    met once the wizard has stood on the tile at any tick (checked after every event)

def make_goal(spec: GoalSpec, level: Level) -> Goal   # registry by kind; unknown kind -> LevelError
```

`World` holds its goals, evaluates every goal after each `record`, and
remembers the first tick each was met (`met_at: dict[int, int]`) so that
playback can tick them off at the right moment: `GoalResult` gains
`met_at_tick: int | None`.

**`run.py`.**

```python
@dataclass
class RunResult:
    status: Literal["won", "incomplete", "error", "too_many_ticks", "interrupted"]
    events: list[Event]
    goals: list[GoalResult]
    ticks: int
    stdout: str
    error: ErrorInfo | None        # {"type": "NameError", "message": "...", "line": 3}
    def to_dict(self) -> dict      # JSON-able, what the worker returns as `world`

def run_code(level: Level, code: str) -> RunResult
```

`run_code`: builds the `World`, compiles with filename `<child>` (a
`SyntaxError` becomes `status "error"` with its line, no events), execs in a
namespace holding `wizard` only (plus the builtins), with `print` captured
to `stdout`; `TooManyTicks` → `too_many_ticks`; `KeyboardInterrupt` →
`interrupted`; any other exception → `error` with the type, the message and
the innermost `<child>` line from the traceback; otherwise `won` when every
goal is met, `incomplete` when not. Events recorded before an error are
kept, so the scene can show the wizard walking up to the mistake.

**Tests** (`world/tests/`): `test_level.py` (parsing, validation errors,
markers); `test_world.py` (a move, a multi-step move, a bump at a wall and
at the edge, facing, ticks counted, `TooManyTicks` at the limit, events
carry the line when run through `run_code`, `steps` validation);
`test_goals.py` (reach by marker and by coordinates, `met_at_tick`);
`test_run.py` (won, incomplete, a `NameError` with the right line, a
`SyntaxError`, `print` captured, events kept before an error);
`test_levels_content.py`: for every `content/levels/*/level.json`, it
parses, `solution.py` runs to `won`, every `wrong/*.py` runs to anything
but `won`. The corridor's `solution.py` is `wizard.move_right(6)`;
`wrong/too_short.py` is `wizard.move_right(3)`; `wrong/into_wall.py` is
`wizard.move_up()`.

**In the browser.** The worker's `run` with a `level` calls
`run_code(Level.from_dict(level), code)` and returns `to_dict()` as
`result.world`. The playground gains a second button, *Run in the corridor*
(`playground.run_level`), which fetches
`/content/levels/01-the-corridor/level.json` (served by Vite from the
repository root through `server.fs.allow`, and copied into `dist/content/`
at build by a small addition to `pack-world.mjs`) and shows the returned
`world` JSON pretty-printed, so the owner can type `wizard.move_right(6)`
and see `"status": "won"` with its six events. A Playwright step covers it.

**Done when** `pytest world` passes, the e2e step passes, and the owner
wins the corridor from the MacBook by typing one line.

## 5. What this sprint deliberately leaves out

No Phaser, no CodeMirror, no art, no lessons, no launcher, no errors in the
children's words, no Tiled. The playground is scaffolding that the level
screen of pieces 1.3–1.5 replaces.

## 6. Acceptance test (the owner, from the MacBook)

1. On the Linux machine: `cd app && npm run dev`. On the MacBook, open
   `http://hija.local:5173` (or the IP shown by Vite).
2. The page is in the MacBook's language; the select switches it without a
   reload; the status says the page can stop a spell that runs forever.
3. "Preparing Python…" turns into "Python 3.14.x ready" within a few seconds
   (longer the first time).
4. *Run* with the starting line prints `Hello, Kydux!`.
5. Replace it with `while True: pass`, *Run*: within about five seconds the
   status says it was stopped, and *Run* works again without reloading.
6. Type `wizard.move_right(6)` and press *Run in the corridor*: the JSON
   shows `"status": "won"` and six `move` events; try `wizard.move_right(3)`
   and see `"incomplete"`; try `wizrd.move_right(6)` and see a `NameError`
   on line 1.
7. On the Linux machine, `ci/check.sh --e2e` passes; `git log` shows one
   commit per piece, none pushed.

## 7. How the implementer works

- One piece at a time, in order; each piece ends with `ci/check.sh` passing
  (and `--e2e` from 1.1) and a local commit whose subject names the piece
  (`0.3: the checks`), authored as the repository's `git config` says, with
  the `Co-Authored-By` line. **Never `git push`**; the owner pushes with
  `ci/push.sh` inside the hours.
- Anything user-facing goes through `t()`; the i18n check enforces it.
- No string that looks like a secret anywhere, no name of the inspiring
  game anywhere; the hooks enforce both.
- When a choice this document leaves open comes up, pick the simplest
  thing that works, say so in the commit message, and add it to the
  decision log if it will outlive the sprint.
- When something here turns out wrong (a version that does not install, an
  API that changed), do what works, record the change in `architecture.md`'s
  log, and say so at the end.
- At the end: a short report to the owner, in Spanish: what was done, what
  differs from this document, and the acceptance test's steps as they
  actually are.
