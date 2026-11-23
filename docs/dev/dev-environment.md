# The development environment

This guide explains how to work on Kydux. It covers four things: how to
prepare a machine, how to run the game while you develop it, how to try the
game from another computer, and how to check your work before you commit.

Kydux is developed on a Linux server with no screen. In this guide that
server is called `hija`, which is its hostname. The game is tried from
another computer, such as a MacBook, through a web browser.

## 1. What the machine needs

The development machine runs Debian 13. Debian provides Python 3.13 and
git, and the project uses both as Debian ships them.

Node is different. Debian 13 ships Node 20, which has reached its end of
life, and the project's test tool refuses it. So Node 24 is installed from
NodeSource's package repository instead. This is the one thing installed
system-wide, and it needs `sudo`:

```sh
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

To confirm it worked, ask Node for its version:

```sh
node --version
```

You should see a version that starts with `v24`.

Everything else lives inside your user account and inside the repository.
Nothing else needs `sudo`.

## 2. Preparing the repository

Clone the repository, then run these commands from its root directory.
Each one prepares a different part of the project.

The git hooks enforce the project's rules at every commit and push. They
refuse a commit that contains a forbidden word or a secret, and a push made
outside the project's hours. This tells git where the hooks are:

```sh
git config core.hooksPath ci/hooks
```

The world, the Python model of the levels, runs in a virtual environment.
Creating it and installing the world into it, together with its test tools
`pytest` and `ruff`, takes two commands:

```sh
python3 -m venv .venv
.venv/bin/pip install -e 'world[dev]'
```

The app, the web page the child plays in, has its own tools under `app/`.
This installs them exactly as the lock file pins them:

```sh
(cd app && npm ci)
```

The browser tests drive a real browser. This downloads the one they use:

```sh
(cd app && npx playwright install chromium)
```

The writing tool asks Gemini for the texts the child reads (section 7). It
needs Google's client in the same virtual environment:

```sh
.venv/bin/pip install -r tools/requirements.txt
```

## 3. Files that stay outside the repository

Some files must exist on the machine but must never be committed. They all
live in `~/.config/kydux/`. The repository's `.gitignore` and the project's
checks keep them out, but it is worth knowing what they are.

| File | What it is for |
|---|---|
| `secrets.env` | The API keys the tools use, one `KEY=value` per line. The writing, art and sound tools read `GEMINI_API_KEY` from it; the art tool also reads `RETRO_DIFFUSION_API_KEY` and `PIXELLAB_API_KEY` when they are there. Keep its mode at 600. Nothing in the project ever prints its contents. |
| `forbidden.txt` | The words that must never appear in the repository. The hooks refuse a commit while this file is missing. |
| `tls/` | The certificate the development server uses for HTTPS. Section 5 explains it. |

The forbidden words deserve a word more. The list starts with the name of
the game that Kydux takes after, which the project never names, not even
in this guide. Any other name that the story must not use by accident goes
on its own line. One entry covers all its spellings. If the list held the
made-up word `zorblax`, it would also catch `Zorb Lax`, `zorb-lax` and
`ZORB_LAX`. Lines that start with `#` are comments.

## 4. Running the game while you develop

The development server builds the page as you edit it and reloads the
browser when a file changes. Start it from the `app/` directory:

```sh
cd app
npm run dev
```

The server prints the addresses it listens on. One is
`https://localhost:5173`, for a browser on the same machine. The others
are the machine's network addresses, for a browser on another computer.
Section 5 explains how to use those.

Before the server starts, two scripts run on their own. They prepare
everything the browser needs into `app/public/`, which git ignores:

- Python's WebAssembly build, copied from its npm package into
  `pyodide/<version>/`, a folder named by Pyodide's version. The page
  loads Python from that folder.
- The world, packed into `world.zip`, which the browser unpacks into
  Python. It carries a stamp, a short hash of the world and the content
  packed with it, which `world-stamp.json` says too. The page is made with
  that stamp, fetches `world.zip` by it, and refuses to run a level when the
  world it gets has another stamp.
- The content, copied into `content/`: the chapters, the stories, the
  lessons, the levels and the screen's guide. A level's solution and its
  wrong answers stay out, so that a child cannot find them in the game. A
  level that is a part of a scene gets the scene's map built in, by
  `tools/scene_maps.py`, so that the page reads it as any other level.
  The page asks for every file of it with the world's stamp in its
  address, as `?v=6cd992b6313c`. The stamp covers every file of
  `content/`, so a changed file means a new stamp and a new address. The
  development server answers whatever the address says after the `?`.
- The course, in `content/course.json`: its chapters in order, each with
  its lessons and levels. It comes from each chapter's `chapter.json`, in
  `content/chapters/`.
- The table of everything the child can type, in `api.json`. It comes from
  the world itself, by running `python -m kydux_world.api`. The notebook
  and the editor's completion read it.
- The names a wizard may not take, in `reserved.json`: the story's
  characters, the spells, the passwords and the game's own words. The
  creator reads it.

You never run these scripts by hand, with one exception. If you change
something under `world/` or `content/` while the server is already
running, the browser keeps the old copy. Stop the server with Ctrl+C,
start it again, then reload the page:

```sh
npm run dev
```

The same holds after a build, `ci/check.sh` or `npm run build`, while the
server runs: the build packs the world again, with a new stamp, and the
page the server gives keeps the stamp it was started with. Until the
server is started again, every level says *The game's world does not match
the page: reload the page*. On the server, the page's stamp is the one of
the day it started, so reloading alone is not enough there; for the game
built and served from `app/dist/`, reloading the page is.

To see which page and which world you have, open a level with `?debug` in
the address. The panel in the scene's corner shows the page's build, the
stamp of the world the page was made with, and the stamp of the world
running; the two stamps are the same. The page's footer shows the build
too, beside the version.

The hash in the address says which screen the page shows. You can type
one to go straight to a screen:

| Address | Screen |
| --- | --- |
| `#start` | The start screen. An address the game does not know opens it too, and so does an address with no hash once a wizard is made. |
| `#story/the-letter` | A story told on its scene, from `content/stories/the-letter/`. This one is the game's opening: an address with no hash opens it while there is no wizard yet. |
| `#wizard` | The creator, where the player names their wizard, says whether it is a girl or a boy, and picks its look. |
| `#map` | The map of the course. |
| `#lesson/what-a-program-is` | A lesson, from `content/lessons/what-a-program-is/`. |
| `#lesson/how-much/from/the-long-corridor` | A lesson read again from a level. It ends in *Back to the level* instead of *Try it*. |
| `#level/the-locked-door` | A level, from `content/levels/the-locked-door/`. |
| `#settings` | The settings: the language, the speed and the editor's text size. |

Some levels are played in several ways: the same map, with a door locked
in one way and open in another, or the teacher looking another way. The
program must win in every way. After a run, a select under the timeline
plays back any way, and the card says which way it speaks of.

The map keeps a locked stop closed. A level's or a lesson's address opens
it anyway. That is on purpose, so that you can test any level without
playing the ones before it.

The first time the game opens, it opens on the welcome page. Its *Start
playing* button begins the story, which leads to the creator. A player who
has a wizard or a saved game opens on the start screen instead. The course begins once the player has a wizard. A level's or a
lesson's address works without one: the texts then call the player
*apprentice*. The first level of the course shows the screen's guide the
first time it is played; the `?` card shows it again.

The browser remembers the player's games. Each game is one document in its
`localStorage`, under the key `kydux.game.` followed by the game's id. The
document holds everything about that game: the wizard, the language, the
settings, the code typed in each level, the hints opened, the stars won and
the lessons read. The list of games is under `kydux.games`, with when each
was begun, when it was last played and how long. The game being played is
under `kydux.current`. Closing the tab or the browser loses nothing.

The start screen lists the games in a box, as soon as there is one. Each game
can be played, exported or deleted there. *New game* begins the story again
for a new wizard and keeps the other games. *Export* downloads its row's game
as `kydux-<name>.json`, named after the game. *Import a game* adds such a file
as one more game.

To start from a clean page, with no game at all, clear the site's data in
the browser, or open the game in a private window. The game then opens on
the welcome page, as a child's first visit does.

### A level that is part of a scene

A chapter's levels are parts of one scene, so that where one level ends
the next one begins. The scene lives in `content/scenes/<id>/`. Its
`map.txt` is a grid of letters, and its `scene.json` says what each
letter is: its terrain, whether the wizard walks on it, and whether sight
passes it. It also lists the scene's fixed things, like the gate, by id,
and the scene's rooms. A level on the scene says which scene it is part
of, where it starts and ends, and the state of each fixed thing it cares
about:

```json
{
  "id": "the-wand",
  "scene": "the-field",
  "start": [8, 14],
  "end": [10, 15],
  "things": [{ "id": "gate", "open": true }, { "kind": "wand", "id": "wand", "at": [12, 14] }],
  "actors": [{ "kind": "friend", "id": "friend", "at": [8, 15] }]
}
```

The coordinates are `x` and `y`, counted from 0 at the map's top-left
corner. `start` is where the wizard stands. `end` is the tile the reach
goal asks for. The checks make sure each level starts on the tile where
the level before it ended, and that the friend never stands on the
solution's way. The friend is the actor `friend`: the game shows Nuri to a
boy wizard and Teku to a girl wizard.

On a painted scene, one more check reads the painting. A level's start,
its mark, its things and its friend must stand on cells that no cut-out
covers, and nothing painted may stand on a cell the map lets one walk on.
When it fails, it names the level and the cell. Move that one to a free
cell, or mark the cell in `map.txt`.

### A painted scene

A scene with a folder in `content/art/scenes/<id>/` is drawn from its
painting: the ground, the raised things cut out row by row, and each door
or thing that changes in its states. The characters come from
`content/art/figures/`. A scene without that folder is drawn with
placeholders. Section 10 says how the art is made.

### Seeing the cells

To say exactly where something looks wrong, open the game with `?debug`
before the `#`, like this:

```
https://localhost:5173/?debug#level/the-sealed-door
```

The scene then has three more buttons in its lower left corner, each
turning a layer on or off:

- **Numbers** writes on each cell's floor, where a figure standing in it
  has its feet, its column and its row: `9,12` is column 9, row 12. Say a
  cell's place this way when you report a problem.
- **Cells** tints each cell by its kind of terrain and crosses out in red
  the cells no one walks on. A legend over the buttons says what each
  colour is, with the cell's letter in the scene's `map.txt`.
- **Masks** draws over every painted thing its mask, the shape the game
  cuts it by, see-through and in one colour for each row. A gap in a
  mask, or a mask over the lawn, is a mistake in the cut.

The browser remembers which layers are on. The address without `?debug`
shows the game as the child sees it.

Two more things help you test quickly in this mode:

- **The map opens every stop.** Each lesson, level and story is a link,
  even those still locked, so you can go straight to any of them. Open
  the map like this:

  ```
  https://localhost:5173/?debug#map
  ```

- **Write the solution** is a button under the editor, beside the
  notebook. It replaces the code with the level's solution, so that a run
  shows the level solved. It is there whenever the address has `?debug`, on
  the development server and on a build alike. A build keeps the solutions
  apart from the game, under `__debug/solution/`, and only this button asks
  for them.

### A story on its scene

A story is a short play on a scene. Its `story.json` says the scene,
where the wizard and the others stand, the tile the camera looks at, and
each step: who speaks and what happens first. Its `text.<lang>.json`
holds the title and one text for each step.

A story plays its chapter's music unless it names its own. A `"music"`
at the top of `story.json` is the theme the story opens to, by its name
in `content/music/`. A `"music"` in a step, beside its `"who"`, changes
the theme from that step on. Going back over that step brings back the
theme before it. A theme told in movements is named with the movement to
play, after a slash: `"the-truth/love"`. `content/music/README.md` says
what a movement is.

To try a story, open its address in the browser, like this one:

```
https://localhost:5173/#story/at-the-gate
```

The checks refuse a staging that does not fit its scene, such as a walk
that is not a straight line or a figure that speaks out of sight.

Two other commands matter. `npm run build` makes the finished game under
`app/dist/`, the same files a release ships. `npm run preview` serves that
finished build on port 4173, which is how the browser tests run it.
`npm run build` rewrites `app/public/content/`, and a development server
already running loses track of some of its files: it then answers
`content/course.json` with the page itself, and the game finds no course.
After a build, stop `npm run dev` and start it again.

## 5. Trying the game from another computer

### Why it needs HTTPS

The development server listens on every network interface, so another
computer on the same network can open the game. But a plain `http://`
address is not enough. Here is why.

The game stops a child's program that runs forever. To stop it without
restarting Python, the page needs a browser feature called cross-origin
isolation. Browsers grant that feature only to pages in a secure context.
A page on `localhost` counts as secure. A page on `http://hija.local` from
another computer does not. So the development server serves HTTPS, and for
that it needs a certificate the other computer trusts.

Without the trusted certificate the game still works. The browser shows a
warning first, and once you go past it, the game stops a runaway program by
restarting Python instead.

The child is not told which of the two the page has, because it means
nothing to a child. A developer can find out in two ways. The browser's
console shows one line that starts with `Kydux:` and says it. And the
page's root element carries it as an attribute: `data-isolated="true"` on
the `<html>` element means the page is isolated.

### Making the certificate on the server

The certificate comes from a small certificate authority that the server
makes for itself. The authority can sign certificates only for the
server's own names and for private network addresses. Trusting it on your
other computer therefore trusts nothing else. The authority and the
certificate live in `~/.config/kydux/tls/`, and their private keys never
leave the server.

Run this once on the server:

```sh
ci/dev-cert.sh
```

It prints the names and addresses the certificate covers. If the server's
network address changes later, make a new certificate with the same
authority:

```sh
ci/dev-cert.sh --renew
```

The other computer keeps trusting the authority, so nothing has to be
redone there.

### Trusting the authority on a Mac

First copy the authority's public certificate to the Mac. Its file is
`ca.crt`. From a terminal on the Mac:

```sh
scp hija:.config/kydux/tls/ca.crt ~/Downloads/kydux-dev-ca.crt
```

Then add it to your login keychain as a trusted root. The Mac asks for
your password, because trusting a certificate authority is a change to the
system's trust:

```sh
security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db ~/Downloads/kydux-dev-ca.crt
```

Safari and Chrome read the keychain, so they now trust the server's
certificate. Firefox keeps its own list of authorities. For Firefox, open
`about:config`, search for `security.enterprise_roots.enabled`, and set it
to `true`; Firefox then reads the keychain too.

If you prefer the graphical way, double-click `kydux-dev-ca.crt` instead.
It opens in Keychain Access under the *login* keychain. Double-click the
entry called *Kydux development (hija)*, open the *Trust* section, set
*When using this certificate* to *Always Trust*, and close the window.

### Trusting the authority on Windows or Linux

On Windows, open `ca.crt`, choose *Install Certificate*, then *Current
User*, then *Place all certificates in the following store*, and pick
*Trusted Root Certification Authorities*.

On Linux, copy it into the system's store and update the store:

```sh
sudo cp ca.crt /usr/local/share/ca-certificates/kydux-dev.crt
sudo update-ca-certificates
```

Firefox on Linux needs the same `about:config` change as on a Mac.

### Opening the game

With the server running (section 4), open this address in a browser on
the other computer:

```
https://hija.local:5173
```

macOS resolves names that end in `.local` on its own, with no setup. If
that name does not resolve on your computer, use the server's network
address instead. The development server prints it when it starts, and
`https://10.10.11.226:5173` is the server's address at the time of
writing.

The server answers only names it knows. `app/vite.config.ts` lists the
server's hostname and its `.local` name. Without that, the page would open
but the automatic reload would not work, because the reload uses a
websocket that the server would refuse.

### From outside the local network

When you are not on the same network as the server, an SSH tunnel brings
the game to your computer as if it were local. A local page is a secure
context, so no certificate is needed. Run this on your computer and keep
it open:

```sh
ssh -L 5173:localhost:5173 hija
```

Then open `https://localhost:5173` in the browser.

### Opening the game to friends

A few friends can play from their homes. The game runs wholly in each
browser, and every game is saved in the browser it is played in, so the
server only hands out files: nginx, which the machine has, serves the
built game over HTTPS behind a password, at `https://kydux.kidux.org`.
Nothing of the development server is used.

The pieces, once, in this order. Section 11 holds every command that
needs `sudo`.

1. **A fixed address for the server on the home network**, so that the
   router's port forwarding always finds it. Give the wired interface a
   reserved address in the router (its MAC address is in section 11), or
   a static one on the machine.
2. **The name.** In the registrar's DNS zone of `kidux.org`, a CNAME
   record: name `kydux`, target `home.antonio.mg.`, which follows the
   home's public address. Nothing more is needed of the registrar, and no
   certificate is bought there.
3. **The router forwards two ports** to the server: 443 for the game, and
   80 for the certificate's renewal and for sending a plain address to
   HTTPS.
4. **The certificate**, from Let's Encrypt with certbot: free, made in a
   minute once port 80 reaches the server, and renewed by itself every
   two months. A certificate bought elsewhere is not needed.
5. **The site**: `ci/deploy.sh --site` builds the game, copies it to
   `/srv/kydux` and installs `deploy/nginx-kydux.conf` as nginx's site
   for the name. After that, each new build goes up with `ci/deploy.sh`.
6. **The passwords**: one a friend, with `deploy/password.sh <name>`. The
   browser asks for the name and the password once, and remembers them.

The site sends the same headers as the development server
(`app/vite.config.ts`), so that stopping a runaway program works.

The browser keeps three things for good, so that a visit with a full
cache makes few trips to the server:

- The game's code, in `assets/`, since a new build gives it new names.
- The content, asked for with the world's stamp in its address. A new
  build has a new stamp, and so new addresses.
- Python's own files, in the folder of Pyodide's version. A new version
  is a new folder.

It asks again for everything else on each visit: the page itself, the
world and its stamp. So a friend sees a new build as soon as they
reload. These rules live in `deploy/nginx-kydux.conf`. When that file
changes, install the site again, once, with `ci/deploy.sh --site`
(section 11).

What a friend needs to know: the address, their name and password, and
that their game lives in that browser on that computer. *Export*, beside a
game on the start screen, carries it to another one.

## 6. Checking your work

One script runs every check the project has. It stops at the first
failure and says which check failed. Run it from the repository's root:

```sh
ci/check.sh
```

It runs, in this order: the Python linter and formatter, the world's tests,
the art tools' tests and the repository's own checks, the check that keeps the languages in
step, and the app's type check, unit tests and build. When everything
passes, the last line says `==> All checks passed`.

The browser tests take longer, about three minutes. They build the game,
serve it, and play it in a real browser. Add `--e2e` to run them after the
other checks:

```sh
ci/check.sh --e2e
```

One of them walks the whole game, once in each language, and takes a
screenshot at each step. The screenshots let you see the game without
playing it. They land in `app/e2e/shots/`, one folder per language, and git
ignores them. `app/e2e/README.md` says what each one shows.

To read a whole chapter as the child does, with room to write under every
picture, make its walkthrough. It builds the game, plays the chapter in Spanish for
a seeded wizard, and writes one document. The browser tests' server must be free.
The chapter is named by its folder in `content/chapters/`: `01-arrival`,
`02-the-library`, `03-passages` or `04-the-broom`. For chapter 3:

```sh
(cd app && npm run walkthrough -- 03-passages)
```

You should see it end by naming the document,
`drafts/recorrido-capitulo-3-<date>.es.md`, with its pictures in the folder of the same
name beside it. Each chapter's document has its own number. Every picture has a
**Comentarios:** line under it, and a document that is already there is never
overwritten, so your comments stay safe.

A level that is laid out differently at each run is shown in one arrangement, its
first: its card, its start, its route tick by tick and its won card (D216). Under its
card the document says what changes each time, and what the card says when this time
is different. To see some levels in every arrangement, name them after `--all-ways`,
separated by commas. Each arrangement then has its own heading, and shows the card it
ends on:

```sh
(cd app && npm run walkthrough -- 04-the-broom --all-ways the-shed,the-check)
```

### Sweeping every level

A spec measures every level of the game at once, for the designer and for you
to read. It gives two tables. The first says how tall each start card is, and
whether it scrolls, in both languages, at 1024 by 700, 1280 by 800 and 1366 by
650. The second says which shape the goals box takes in each level, the list or
the strip, whether it folds after its three seconds, and how many things of the
level each shape would cover, in Spanish, at 1024 by 700 and 1280 by 800. It is
skipped unless it is asked for. Build first, then run it from `app/`:

```sh
npm run build
KYDUX_SWEEPS=1 npx playwright test e2e/sweeps.spec.ts
```

It takes about fifteen minutes. It writes its tables to
`app/e2e/shots/sweeps/start-cards.md` and `app/e2e/shots/sweeps/goals-box.md`. A
card that scrolls says by how many pixels.

### Measuring how long the game takes to load

The game runs in the browser, but every file comes from the server first. A
spec measures what each screen costs: how many files, how many trips to the
server, how many bytes, and how long until the screen shows and until
Python's files are there. It serves a build the way the server on the
internet does (`deploy/nginx-kydux.conf`). The browser keeps for good the
files under `assets/`, the content asked for with a stamp of twelve
hexadecimal digits, and Python's files under `pyodide/<version>/`. Every
other file is asked for again on each load, with a short answer when it
has not changed. A file of the content or of Python's that is not there is
a 404, as on the server. It measures each screen
with an empty cache and a full one, on a fast network and on a slow one
(400 ms a trip, 1 Mbit/s).

It needs a build, and it is skipped unless it is asked for. Build first, then
run it from `app/`:

```sh
npm run build
KYDUX_LOAD=dist npx playwright test e2e/load.spec.ts
```

It takes about twenty minutes, most of it on the slow network. Each measure
is added, as it is made, to `app/e2e/shots/load/dist.jsonl`, one line a
screen. To measure an older build, build it in a folder of its own and give
that folder, with a name for its file and the screens it had:

```sh
KYDUX_LOAD=/tmp/kydux-old/app/dist KYDUX_LOAD_NAME=before KYDUX_LOAD_SCREENS="start,story 1,level 1" npx playwright test e2e/load.spec.ts
```

The repository's own checks deserve a mention, because they guard the
project's rules. They refuse a secret in any tracked file. They refuse a
forbidden word in any file, path or commit message. They keep the two
READMEs saying the same things. And they require every piece of art and
sound to be listed in a manifest with its source and licence.

## 7. Writing a text the child reads

Every text the child reads is drafted by Gemini: the story, the lessons,
and each level's goals, hints and words. A person writes the brief, then
reads and corrects the draft. The brief stays in the repository, as the
record of what was asked.

A brief is a Markdown file in `tools/write/briefs/`. Its front matter
names the files to write and the files Gemini reads first. Its words say
what each text is for and the facts it must hold. `tools/write/README.md`
explains the format.

To see the prompt the tool would send, without sending it:

```sh
.venv/bin/python tools/write/write.py tools/write/briefs/chapter-1-levels.md --dry-run
```

To have Gemini write the drafts:

```sh
.venv/bin/python tools/write/write.py tools/write/briefs/chapter-1-levels.md
```

It prints each file it wrote. With `--via agy`, the brief goes through the
Antigravity CLI instead, signed in with the owner's Google account and
with no API key. It uses Gemini 3.8 Flash unless `--model` names another
of `agy models`.

The drafts land in
`drafts/chapter-1-levels/`, at the same paths they will have in the
repository. A `manifest.json` beside them records the model, the brief
and the date. Git ignores `drafts/`, and the project's checks refuse a
draft in a commit.

A text names the friend as `{friend}`. The friend is Nuri for a boy
wizard and Teku for a girl wizard. In Spanish, the friend's own words that
change with their gender go in double braces, the boy's first:
`{{un alumno|una alumna}}`. Single braces hold the wizard's words:
`{mago|maga}`. `tools/write/rules.md` tells Gemini the same.

Read every draft whole before it enters `content/`. Check it against the
level or the lesson: what the map has, what the goals ask, what a hint
gives away. Correct a sentence that is wrong. When much is wrong, correct
the brief and run the tool again. Then copy the files into `content/` and
run `ci/check.sh`, which holds the texts to the game's rules.

## 8. Reading the course as one document

The whole course, as the child reads it, can be put in one Markdown file to
read it through and comment on it: every story, step by step, lesson and level in
order, with each level's goals, starting code, hints and solution. This
writes it in Spanish, for a girl wizard, into `drafts/`:

```sh
.venv/bin/python tools/course_book.py
```

The last line printed is the file's path. `--lang en` writes the English,
`--gender boy` the boy's words. Import the file into a Google Doc (File >
Import, or paste it into a new doc) to comment on it.

To bring the comments back, download the Google Doc as Microsoft Word
(File > Download > Microsoft Word), which keeps them, and print them:

```sh
.venv/bin/python tools/doc_comments.py ~/Downloads/the-book.docx
```

Each comment comes out with the words it was made on, in the document's
order, so that the texts can be corrected one by one.

## 9. Committing and pushing

Commits are made locally at any time. They are authored as the
repository's `git config` says, `othermore <info@kidux.org>`. Two hooks run
at every commit. The pre-commit hook refuses a forbidden word or a secret
in the tree. The commit-msg hook refuses a forbidden word in the message.

Pushing is different, because the project is seen on GitHub only inside
certain hours: Madrid's 19:00 to 03:00 around a night from Tuesday to
Friday, and the whole of Saturday, Sunday and Monday. There is one way to
push, and it keeps to those hours:

```sh
ci/push.sh
```

Inside the hours, it dates the commits that are not yet on GitHub inside
the hours and pushes them. Outside the hours, it refuses. To push at the
next opening without waiting up for it, set a timer instead:

```sh
ci/push.sh --later
```

The pre-push hook refuses a push made any other way. A commit that is
already on GitHub is never rewritten.

### A release

A release is a version of the game that the owner has tried and said yes
to. Its commit is the one that sets the version number. That commit
carries a tag named after the version. GitHub runs every check but the
browser tests on it, as on any push. It runs the browser tests only when
you start them by hand, because there they take hours and some run out of
their time. Here, `ci/check.sh --e2e` runs them before a sprint's last
commit.

Tag the version commit before you push. For version 0.0.4, with its
version commit at the top of `main`:

```sh
git tag -a v0.0.4 -m "Version 0.0.4"
```

Then push as always:

```sh
ci/push.sh
```

You should see the tag among the push's last lines, as
`* [new tag] v0.0.4 -> v0.0.4`. When the version commit is dated again on
its way up, the tag follows it, and the push says so first:
`The tag v0.0.4 on its commit dated again`. A tag on a commit that is
already on GitHub goes up the same way, on its own.

To run the browser tests on GitHub, open the repository's *Actions* tab,
choose the workflow *check*, and press *Run workflow*. Nothing else starts
them there.

Two files are never committed: `CLAUDE.md` and the `.claude/` directory.
They hold the project's internal instructions, and `.gitignore` keeps them
out.

## 10. Making the art and the sound

The art is painted by Gemini, and the tools turn a painting into what the
game draws. `art/README.md` is the style guide. The trials and the raw
pictures live in `art/raw/`, which git ignores.

A picture is asked for with a prompt file in `tools/art/prompts/`. Its
front matter names the service and the model. This draws it into
`art/raw/<candidate>/`, with the prompt and the model beside the image:

```sh
.venv/bin/python tools/art/generate.py tools/art/prompts/image-first-field.md
```

A painted scene is turned into the game's files by one command, named by
the scene's id. It reads the scene's settings in
`art/scenes/<scene>/cut.json`: where its pictures are, its things, the
colours it is read by. Then it cuts the raised things by row, takes each
changing thing from its edits, and writes `content/art/scenes/<scene>/`:

```sh
.venv/bin/python tools/art/export_scene.py the-field
```

It ends by checking the scene. It writes check pictures into
`art/raw/game-check/`, among them `all-the-field.png`, the wizard on
every cell walked on, each cell numbered, the number yellow where the
wizard is wholly hidden. It fails if a cut-out would show a figure a
problem, and prints each problem with its cell:

- `floating`, `lawn`, `hole`: a shadow or a patch of lawn drawn over a
  figure, or a gap in a crown that shows it;
- `fringe`: the ground beyond a thing's outline cut with the thing;
- `bare`: a thing's black outline left on the ground beside it;
- `spill`: one thing drawn partly in front of a figure and partly behind
  it, cut across a row's edge.

Look at the pictures before committing: every figure should be hidden
by what stands in front of it and drawn over what stands behind it.
`export_scene.py the-field check` checks again without cutting. When a
problem is in the painting itself, the scene's `cut.json` says how to
cut it there (art/README.md, "The rules for the cut-outs").

An indoor scene's things are marked by Gemini in flat magenta. The
scene's settings say the crops and the pictures (`marks`). This lays
the pictures on the painting, where the export reads them:

```sh
.venv/bin/python tools/art/repaint.py the-library marks
```

It prints the pictures it wrote. Then export the scene again.

A scene is painted beyond its playable area too, so that zooming out
never shows the frame's colour. The margin is painted by Gemini on a
canvas made from the scene's painting, then joined to it:

```sh
.venv/bin/python tools/art/margin.py the-field canvas
.venv/bin/python tools/art/generate.py tools/art/prompts/image-first-field-margin.md
.venv/bin/python tools/art/margin.py the-field join art/raw/game-field-margin/image-first-field-margin.png
```

The last command says where the painted border does not meet the
scene's edge. If it names a stretch, ask again with that stretch named in
the prompt. Then export the scene again.

The figures are no scene's, and are made apart:

```sh
.venv/bin/python tools/art/export_scene.py figures
```

The figures change with the look the child picks. Each look's sheet is
the base sheet of its gender, recoloured. The friends' sheets are made the
same way. The bases are in `art/figures/`, and the looks' colours are
those of `app/src/engine/looks.ts`. This writes every sheet into
`content/art/figures/`:

```sh
.venv/bin/python tools/art/figures.py --check
```

With `--check`, it also writes `art/raw/figures-check.png`, every sheet
side by side, then the figures drawn whole (Zarek, Rinlo) and the things'
sprites (a broom, a ring). Look at it after changing a look's colours or a
base.

A wizard's sheet also has four rows of casting frames, below its walking
ones. They come from a casting base for each gender, in `art/figures/`.
A casting base is made from Gemini's edit of the walking base, asked for
with `tools/art/prompts/figure-cast-boy.md` or `figure-cast-girl.md`.
This puts the edit back on the base's grid:

```sh
.venv/bin/python tools/art/figures.py --cast boy art/raw/figures/figure-cast-boy.png
```

It prints the base it wrote. Run `tools/art/figures.py --check` after it,
so that every look gets the new frames.

The four flying rows come the same way, from a flying base for each gender.
Gemini draws the walking base riding a broom, from
`tools/art/prompts/figure-fly-boy.md` or `figure-fly-girl.md`. This puts
the edit back on the base's grid:

```sh
.venv/bin/python tools/art/figures.py --fly boy art/raw/figures/figure-fly-boy.png
```

It also clears the magenta left round the figure. The flying bases can be
cleared again on their own, without an edit:

```sh
.venv/bin/python tools/art/figures.py --clean-fly
```

A figure with no base, like Zarek or Rinlo, is made from a drawing of it
standing still in four views, down, right, left and up. Gemini draws it
from `tools/art/prompts/figure-zarek-standing.md`. This cuts the views into
the figure's sheet in `content/art/figures/`:

```sh
.venv/bin/python tools/art/figures.py --drawn zarek art/raw/figures/figure-zarek-standing.png
```

Its flying rows come from a drawing of it riding the broom in the four
views. This cuts them all into the flying rows:

```sh
.venv/bin/python tools/art/figures.py --drawn-fly zarek art/raw/figures/figure-zarek-fly.png
```

Some views of the flying rows can be drawn again. Gemini draws them from a
prompt of their own: Zarek's down view from `figure-zarek-fly-down.md`, and
his right, left and back views from `figure-zarek-fly.md`. This puts each
figure of the drawing, from left to right, in place of the view named, at
the height its row has. Name one way, or several joined by commas:

```sh
.venv/bin/python tools/art/figures.py --drawn-fly-view zarek down art/raw/figures/figure-zarek-fly-down.png
.venv/bin/python tools/art/figures.py --drawn-fly-view zarek right,left,up art/raw/figures/figure-zarek-fly.png
```

It says so and stops when the drawing has another number of figures than
the ways named. The pose `figure-zarek-fly.md` is drawn from is
`art/raw/figures/wizard-fly-sides-reference.png`: the boy's flying base's
middle frames facing right, facing left and from the back, four times their
size, on flat magenta.

Run `--check` after either, and look at the figure's sheet at the end of
`figures-check.png`.

A character's portrait is a bust Gemini paints on flat magenta, from
`tools/art/prompts/portrait-<id>.md`. This cuts it into a square of 512
pixels:

```sh
.venv/bin/python tools/art/sprites.py portrait art/raw/portraits/portrait-ilda.png --out content/art/portraits/ilda.webp
```

The wizard's looks have their portraits made from the two base busts in
`art/figures/`, recoloured for each look:

```sh
.venv/bin/python tools/art/figures.py --portraits
```

It prints each portrait it wrote, `content/art/portraits/wizard-<look>.webp`.

A thing drawn the same on every scene, a broom or a ring, is a sprite in
`content/art/things/`. It is cut from a box of a picture, given as its
corners in pixels, and scaled to a height in pixels. A thing painted alone
on flat magenta is cut like this:

```sh
.venv/bin/python tools/art/sprites.py sprite art/raw/sprite-broom/sprite-broom.png --out content/art/things/broom.webp --box 150,150,2700,1180 --height 140 --lawn
```

The broom's picture has a strip of lawn under it, so it takes `--lawn`
too; a thing painted standing on a lawn, like the ring, takes it alone.
Its size in cells and its foot are in `content/art/things/things.json`.

The music is the game's own, written as notes. Each chapter's theme is a
score in `tools/sound/compose.py`: its melodies a bar at a time, and its
harmony a chord a bar. After changing it, this writes the themes again into
`content/music/`:

```sh
.venv/bin/python tools/sound/compose.py
```

It prints each file it wrote. To hear a theme alone, open the game with
`?debug` at `#music`:

```
https://localhost:5173/?debug#music
```

Each theme has two buttons. One plays it as a story does. The other plays
it as a level does, quieter.

Over the list are the time and the voices of the theme that plays. The
time's slider follows the music. Drag it and let go, and the theme plays on
from that second. Beside it are the second that sounds, the theme's length
and the part it is in. Each voice has a box that silences it and a slider
for its volume. A sound is found with the two: go to a little before its
second, and turn the voices off one at a time until it is gone.

The page's music starts only after a click or a key on the page, since a
browser plays no sound before one. `content/music/README.md` says the
file's form.

The sound effects need no files: the game makes them as it plays, and the
settings can turn them off.

### The tips' pictures

Each tip shown while a screen loads has a picture of the thing it tells, in
each language, made from the game's own page. They live in
`content/tips/<lang>/<tip>.webp`. When the page changes where a tip points,
make them again, so that they show the page as it is.

A spec of the browser tests makes them. It opens the page at 1280 by 800, cuts
the part each tip tells, takes it at twice the page's pixels, and writes the
twenty pictures. It is skipped unless it is asked for by name. Run it from
`app/`:

```sh
KYDUX_TIP_PICTURES=1 npx playwright test e2e/tips-pictures.spec.ts
```

It should say that 8 tests passed. Each picture is 960 by 540 pixels and
weighs less than 90 KB. The waiting view shows it up to 800 pixels wide, and
smaller where the window is too low for it. Look at them before you commit
them: open
`content/tips/es/` in a file viewer. The content test then checks that every
tip has its picture in every language:

```sh
.venv/bin/python -m pytest -q tests/project
```

## 11. The commands that need `sudo`, for opening the game to friends

Each step of "Opening the game to friends" (section 5) that changes the
machine or needs root is here, ready to paste, in order. The machine is
`hija`, on the home network `10.10.11.0/24` with the router at
`10.10.11.1`; its wired interface `enp2s0` has the MAC address
`04:42:1a:89:6f:dc` and holds `10.10.11.226` now from DHCP.

### The fixed address

The simplest is a reservation in the router: in its DHCP settings, bind
`04:42:1a:89:6f:dc` to `10.10.11.226`. Then nothing changes on the
machine, and the address it has now stays. If the router cannot, set it
on the machine instead, with NetworkManager:

```sh
sudo nmcli connection modify "Conexión cableada 1" ipv4.method manual ipv4.addresses 10.10.11.226/24 ipv4.gateway 10.10.11.1 ipv4.dns "8.8.8.8 8.8.4.4"
sudo nmcli connection up "Conexión cableada 1"
```

Check it with `ip -4 addr show enp2s0`: the line should say
`10.10.11.226/24` without the word `dynamic`.

### The router

Forward, to `10.10.11.226`, the outside port 443 to 443 and the outside
port 80 to 80, both TCP. The game is on 443; 80 is for the certificate's
making and renewal, and for sending `http://` to `https://`.

### certbot and the certificate

Install certbot with its nginx plugin, and make the certificate once port
80 reaches the machine (`curl http://kydux.kidux.org/` from a phone off
the wifi should answer with nginx's page):

```sh
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --webroot -w /var/www/html -d kydux.kidux.org --agree-tos -m <your email> --no-eff-email --deploy-hook "systemctl reload nginx"
```

It writes the certificate under `/etc/letsencrypt/live/kydux.kidux.org/`
and sets a timer that renews it, reloading nginx after each renewal so
that the new certificate is served. The site needs no other file of
certbot's: its TLS settings are in `deploy/nginx-kydux.conf`. Make the
certificate before the site: `ci/deploy.sh --site` refuses to install a
site whose certificate is not there, and takes the site out again if
nginx refuses it, so that nginx and the other sites keep running. Check
the renewal works:

```sh
sudo certbot renew --dry-run
```

### The folder the game is served from

Once, so that `ci/deploy.sh` can write it without sudo:

```sh
sudo mkdir -p /srv/kydux
sudo chown other:other /srv/kydux
```

### The site and the first build

From the repository, with the certificate made:

```sh
ci/deploy.sh --site
```

It builds, copies, installs `deploy/nginx-kydux.conf` as
`/etc/nginx/sites-available/kydux`, enables it, checks nginx's
configuration and reloads nginx. It asks for the sudo password itself;
run it as yourself, never with `sudo` in front, so that the build stays
yours. Later builds go up with `ci/deploy.sh` alone, no sudo.

### When the site's file changes

`deploy/nginx-kydux.conf` says what the browser keeps for good (section
5). When it changes, install the site again. The same command builds and
copies the game first:

```sh
ci/deploy.sh --site
```

A build and a site of different days work together. An old site keeps
only the game's code for good, so it answers a new build's addresses as it
answers any other. An old build asks for no address that the new site
keeps.

To check that it worked, ask for one file of the content with the stamp in
its address. This command does it from the machine itself. Put a friend's
name in place of `<name>`; it asks for their password:

```sh
curl -sI -u <name> "https://kydux.kidux.org/content/course.json?v=$(sed 's/.*"stamp":"\([0-9a-f]*\)".*/\1/' /srv/kydux/world-stamp.json)" | grep -i cache-control
```

It should print `cache-control: max-age=315360000`. The same file asked
for without `?v=` prints `cache-control: no-cache`.

### The passwords

One a friend, asked for twice and hashed:

```sh
deploy/password.sh ana
```

`deploy/password.sh --remove ana` takes it away. The file is
`/etc/nginx/kydux.htpasswd`, readable by nginx alone.

### Checking from outside

From a phone off the wifi, `https://kydux.kidux.org` asks for a name and
a password, then shows the game. The browser's console shows
`Kydux: cross-origin isolated`, so that a program that never ends can be
stopped. `http://kydux.kidux.org` goes to the same place over HTTPS.
