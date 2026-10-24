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
| `secrets.env` | The API keys and credentials the tools use, one `KEY=value` per line. The writing tool reads `GEMINI_API_KEY` from it. Keep its mode at 600. Nothing in the project ever prints its contents. |
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

- Python's WebAssembly build, copied from its npm package into `pyodide/`.
- The world, packed into `world.zip`, which the browser unpacks into
  Python.
- The content, copied into `content/`: the chapters, the story pages, the
  lessons, the levels and the screen's guide. A level's solution and its
  wrong answers stay out, so that a child cannot find them in the game. A
  level that is a part of a scene gets the scene's map built in, by
  `tools/scene_maps.py`, so that the page reads it as any other level.
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
running, the browser keeps the old copy. Run this from `app/` to prepare
the new one, then reload the page:

```sh
npm run predev
```

The hash in the address says which screen the page shows. You can type
one to go straight to a screen:

| Address | Screen |
| --- | --- |
| `#start` | The start screen. An address the game does not know opens it too, and so does an address with no hash once a wizard is made. |
| `#story/the-letter` | A story page, from `content/stories/the-letter/`. This one is the game's opening: an address with no hash opens it while there is no wizard yet. |
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

The first time the game opens, it opens on the story, which leads to the
creator. The course begins once the player has a wizard. A level's or a
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

The start screen lists the games under *Load a game*, where each one can be
played or deleted. *New game* begins the story again for a new wizard and
keeps the other games. *Export* downloads the game being played as
`kydux-progress.json`, and *Import* adds such a file as one more game.

To start from a clean page, with no game at all, clear the site's data in
the browser, or open the game in a private window. The game then opens on
the letter, as a child's first visit does.

### A level that is part of a scene

A chapter's levels are parts of one scene, so that where one level ends
the next one begins. The scene is a map of its own, in
`content/scenes/<id>/map.txt`. It holds only walls (`#`), floor (`.`) and
shelves (`=`). A level on it says, in its `level.json`, which scene it is
part of, and where everything of its own stands:

```json
{
  "id": "the-gate",
  "scene": "the-gate",
  "start": [11, 6],
  "end": [12, 6],
  "actors": [{ "kind": "friend", "id": "nuri", "at": [10, 6] }]
}
```

The coordinates are `x` and `y`, counted from 0 at the map's top-left
corner. `start` is where the wizard stands. `end` is the tile the reach
goal asks for, and a level with no reach goal has none. Every thing and
actor stands at its own `at`. The checks make sure each level starts on
the tile where the level before it ended, and that the friend never
stands on the solution's way. To see a level on its scene, run its
solution in the world's tests, or open its address in the browser.

Two other commands matter. `npm run build` makes the finished game under
`app/dist/`, the same files a release ships. `npm run preview` serves that
finished build on port 4173, which is how the browser tests run it.

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

## 6. Checking your work

One script runs every check the project has. It stops at the first
failure and says which check failed. Run it from the repository's root:

```sh
ci/check.sh
```

It runs, in this order: the Python linter and formatter, the world's tests
and the repository's own checks, the check that keeps the languages in
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

It prints each file it wrote. The drafts land in
`drafts/chapter-1-levels/`, at the same paths they will have in the
repository. A `manifest.json` beside them records the model, the brief
and the date. Git ignores `drafts/`, and the project's checks refuse a
draft in a commit.

Read every draft whole before it enters `content/`. Check it against the
level or the lesson: what the map has, what the goals ask, what a hint
gives away. Correct a sentence that is wrong. When much is wrong, correct
the brief and run the tool again. Then copy the files into `content/` and
run `ci/check.sh`, which holds the texts to the game's rules.

## 8. Reading the course as one document

The whole course, as the child reads it, can be put in one Markdown file to
read it through and comment on it: every story page, lesson and level in
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

Two files are never committed: `CLAUDE.md` and the `.claude/` directory.
They hold the project's internal instructions, and `.gitignore` keeps them
out.
