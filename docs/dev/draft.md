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

### The flow of a level

- **Before it starts**, a card shows the level's goals with a picture of the
  scene and a two-line example of the idea it needs, and a *Start* button.
- **While the child writes**, the goals stay in a corner of the scene, each
  ticked or crossed as the last run left it. Some levels add a bonus goal, such
  as solving it in fewer than a number of lines.
- **When a run plays**, a timeline under the scene can be dragged back and
  forth; the line being run is marked in the editor, and a bubble over the
  wizard names the spell being cast. The wizard's energy shows in a bar.
- **Things grant spells.** What the wizard can do comes from what they carry:
  the wand gives `cast`, a spellbook gives its spells, the broom gives `fly`,
  a cloak gives `hide`. Getting a new thing is part of the story, and its
  spells appear in the grimoire with the thing's icon. The first time a new
  spell or idea appears, a card explains it with an example.
- **On winning**, a short scene and a reward (stars, potions or another
  currency of the game's own) that buys things in a shop between levels.
- Levels are reached from a **map** of each chapter, with the path between
  them lit as they are won.

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

The players are children from 8 or 9 years old upwards, which sets short
texts, one idea at a time, and levels solved in a few minutes.

The first release has between 10 and 20 lessons, each followed by its levels.
After them come **challenges**: levels with no lesson, each harder than the
last, that combine everything taught so far, and that can keep growing after
the course itself is finished.

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

The child creates their wizard at the start: a name, and a look put together
from parts (body, skin, hair, robe, hat and colours), which every scene and
cutscene then shows. The parts are separate sprite layers drawn to fit each
other, so that each combination animates without art of its own.

The wizard arrives at the school and goes
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
  beside the game when it is run locally). No accounts and no server of ours in
  the first release.
- **Online later**: the first release is local only. The design keeps the way
  open to publishing it on a hosted server: the game is static files, and saving
  progress goes through one interface that a local store implements today and an
  online one can implement later. On top of that, later ideas include accounts,
  online rankings, and playing with others, such as duels between wizards; none
  of them is part of the first release.
- **Kidux**: packaged as a Kidux learning module, a `.deb` built from this
  repository, and presented on the Kidux website.
- **Checks**: every level has its solution in the repository, run headless to
  prove it wins and that the naive wrong answers do not.

## 4. Internationalization

Everything the player sees comes from translation files, one per language with
the same keys: the interface, the lessons, the story, the goals, the hints, the
grimoire, the error messages, the launcher's messages, and the words that appear
inside the scene (signs, book titles), which the game draws from a string
instead of painting them into the art. English and Spanish from the start; a new
language is a new set of files and nothing else. A check fails when a language
lacks a key or keeps one nothing uses. The player picks the language, which
defaults to the system's. The Python stays Python in every language: keywords
and the game's API in English, while the comments and the strings in a level's
starting code are translated.

## 5. Art and sound

### The style is chosen by what is easiest to program

- The scene is a **flat grid seen from straight above** (or nearly, with walls
  showing their front face), not an isometric or free-perspective view: tiles
  line up with the map, a move of one step is one square, collisions and goals
  are cells, and maps are drawn in a tile editor. This keeps the level model,
  the checks and the renderer simple.
- Characters are **sprite sheets** with a few frames per direction (idle, walk,
  cast), all on the same grid and scale as the tiles.
- The wizard the child designs is put together in the cheapest way that looks
  good: a base sprite recoloured in code (skin, hair, robe), plus a small set of
  hats and hair styles drawn to fit it, instead of every combination drawn.
- The words in a scene are drawn by the game from translated strings, never
  painted into the art (section 4).

### Where the art comes from

- **First, tests with Gemini** (`gemini-3-pro-image`, `gemini-3.1-flash-image`):
  a few candidate styles, each with a wizard sprite sheet, a stretch of castle
  corridor as tiles, and an object, to choose the style and the grid size, and
  to see whether the generated pieces can be cut up and fit together: tiles
  that join without seams, characters at the tiles' scale, the same character
  the same from one sheet to the next.
- **If they do not fit**, the art comes from free collections (OpenGameArt,
  Kenney and the like) under a licence that can ship with a GPL game, or from
  another image model, or a mix: free tiles with generated characters.
- Whatever is generated is cleaned up, cut into sheets and reviewed by hand
  before it enters the repository; raw output stays out of it.
- Every asset is listed in a manifest beside it: where it came from, who made
  it, its licence, and for a generated one the model and the prompt.
- The API key is read from `~/.config/kydux/secrets.env` or the environment,
  never from the repository.

### Sound

- **Music** and **sound effects** made with Lyria: a theme for each chapter,
  short effects for spells, steps, doors, winning and failing.
- **Voices for the characters**: short sounds or exclamations when they speak,
  not spoken lines, so that they need no translation.
- The lessons and the dialogue are **not read aloud**; they are text.

### What the first tests showed

Three styles were tried with `gemini-3-pro-image` (a scene, a 4×4 walking sheet
of the wizard and a tileset each, on a magenta background to be keyed out):

- **Retro pixel art, seen from above with front-facing walls**: the best fit.
  The scene came out on a clean grid; the walking sheet came out regular, with
  the same wizard in all sixteen frames, and it was keyed, cut, reduced to its
  true pixels (each drawn pixel is 4 of the image's) and animated walking over
  tiles without retouching. The tileset's objects (wand, book, broom, potion,
  chest, doors) are usable as they are. Its floor and wall tiles are not: they
  carry their own borders and are not the same size, so they show seams when
  repeated. Terrain needs another approach: each terrain asked for alone as a
  seamless texture, or a free tileset in a matching style with the characters
  and objects generated.
- **Detailed pixel art**: drifted into a diagonal, isometric-like view, which is
  harder to program; set aside.
- **Cartoon with outlines**: pleasant and consistent, but drew the sheet's cells
  on white rather than on the key colour, and its smooth lines do not reduce to a
  small grid as cleanly; a second choice.

The working choice is the retro pixel style on a grid of about 48 screen
pixels, the wizard about one and a quarter tiles tall. The raw tests, their
prompts and the scripts that cut them are kept outside the repository, in
`art/raw/`.

## 6. Open questions

- Terrain tiles: generated as seamless textures, or a free tileset; to be
  settled by a second round of tests.

## 7. What the plan is to cover

A full, detailed plan of every phase is to be written from this draft: the
basic technology (the runtime, the level model, the renderer, the editor, i18n,
saving, the launcher), the art, the story and the levels, the packaging for
Kidux, and the way the project is developed: tests, the checks of every level,
releases, and the hours of the repository.
