# Kydux — general draft

The shape of the project, before its requirements and its implementation plan
are written. Every point here is open to change.

## 1. The game

A child learns Python by writing it. Each screen is a level: a scene of the
castle or its grounds seen from above, the young wizard in it, a goal, and a code
editor beside it. The child writes a few lines, presses *Cast* (run), and watches
the wizard carry them out. A level is won when its goals are met: reach the door,
pick up the wand, get past the teacher unseen.

The course goes by **lessons**. A lesson is a short, illustrated explanation of
one idea, told inside the story by a character of the school, with a tiny example
the child can try. The level after it needs that idea, and only the ideas taught
before it.

### The screen of a level

- **The scene**, most of the screen: the map, the wizard, objects, characters.
- **The editor**, beside it: Python with colours, line numbers, and the line that
  is running lit while the wizard acts it out.
- **The goals**, a short list ticked off as they are met.
- **The grimoire**: the spells (methods) and things (attributes) the wizard
  knows so far, each with an example; it grows as lessons teach more, and a click
  puts an example in the editor.
- **Cast / Stop / Restart**, and a speed control for the playback.
- **Help**: a hint at a time, after a failed try or on request; never the answer.
- **Errors in the child's words**: a Python error is shown as what it is in
  plain language ("The spell `mvoe_up` does not exist. Did you mean
  `move_up`?"), in the player's language, pointing at the line.

### How the code runs

The child's code is real Python, run by CPython in the browser. It runs against
a model of the level, deterministically, faster than it is shown: each call
(`wizard.move_right()`, `wizard.cast("light")`) changes the model and records an
event; the scene then plays the events back in time, with the editor following
along. A level that never ends (an endless loop) is stopped after a limit of
steps and the child is told why. The same code always gives the same result, so
a level can be checked automatically.

The game's API follows Python's own conventions (`snake_case`, objects with
methods and attributes), so what the child learns carries over to Python outside
the game.

## 2. The course

A first sketch of the order of ideas, each a lesson and one or more levels:

1. Calling a method on an object: `wizard.move_right()`.
2. A sequence of instructions; arguments: `wizard.move_right(3)`.
3. Strings as arguments: `wizard.say("Lumos")`, `wizard.cast("open", door)`.
4. Variables: naming things the wizard finds, `door = wizard.find_nearest_door()`.
5. Attributes: `door.locked`, `wizard.energy`, `potion.colour`.
6. Loops: `while True:` and `for` over a range, then over a list.
7. Conditions: `if`, `else`, `elif`; comparing; `and`, `or`, `not`.
8. Lists: carrying several things, choosing from them.
9. Defining functions: a spell of one's own.
10. Defining classes: creating a familiar or a new kind of object, with its own
    attributes and methods.

### The story

The wizard (the child picks their look and name) arrives at the school and goes
from scene to scene: getting a wand, learning the first spells, finding the way
through the castle's corridors and secret passages, slipping out of a class
without the teacher seeing, earning and learning to fly a broom, and further
chapters that match the ideas above. The setting is the game's own: its school,
characters and places have names and looks invented for it.

## 3. Technology

- **A web app**: HTML, CSS and JavaScript (or TypeScript), with everything it
  needs in the repository or fetched at build time, so it runs offline.
- **Python**: Pyodide (CPython 3.14 compiled to WebAssembly, Pyodide 314.x), run in
  a Web Worker so that the page never freezes and a runaway program can be
  stopped. The level's model is written in Python too, beside the child's code.
- **The scene**: a 2D engine for the browser (Phaser or PixiJS, to be chosen),
  tile maps made in Tiled.
- **The editor**: CodeMirror 6.
- **Running it locally**: one small launcher that starts a local web server and
  opens the browser, on Linux, Windows and macOS (Python's own `http.server` is
  enough). The same files can be published as a website.
- **Progress**: kept on the player's machine (the browser's storage, or a file
  beside the game when it is run locally). No accounts, no server of ours.
- **Kidux**: packaged as a Kidux learning module, a `.deb` built from this
  repository, and presented on the Kidux website.
- **Checks**: every level has its solution in the repository, run headless to
  prove it wins and that the naive wrong answers do not.

## 4. Art and sound

- One consistent style for the whole game: pixel art seen from above (a grid of
  32 or 48 pixels to be chosen), animated characters in four directions.
- Made for Kydux, with Gemini's image generation as a tool, then cleaned up,
  cut into sprite sheets and reviewed by hand; or taken from free collections
  (OpenGameArt, Kenney and the like) under a licence that can ship with a GPL
  game.
- Every asset is listed in a manifest beside it: where it came from, who made
  it, its licence, and for a generated one the prompt that made it.
- The API key is read from `~/.config/kydux/secrets.env` or the environment,
  never from the repository.

## 5. Open questions

- The age range of the players, which sets the length of the texts and of the
  levels.
- The wizard's look and name: fixed, or chosen by the child.
- The size of the first release: how many lessons and levels.
- Whether the online version is published from the start, and where.
- The art's grid size and style, to be settled on a few test sprites.
