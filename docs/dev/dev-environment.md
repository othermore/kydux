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

## 3. Files that stay outside the repository

Some files must exist on the machine but must never be committed. They all
live in `~/.config/kydux/`. The repository's `.gitignore` and the project's
checks keep them out, but it is worth knowing what they are.

| File | What it is for |
|---|---|
| `secrets.env` | The API keys and credentials the tools use, one `KEY=value` per line. Keep its mode at 600. Nothing in the project ever prints its contents. |
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
- The levels, copied into `content/levels/`. A level's solution and its
  wrong answers stay out, so that a child cannot find them in the game.
- The order of the levels, in `content/levels.json`. It is the levels'
  directory names, sorted, so a level's number in its name is its place.
- The table of everything the child can type, in `api.json`. It comes from
  the world itself, by running `python -m kydux_world.api`. The notebook
  and the editor's completion read it.

You never run these scripts by hand, with one exception. If you change
something under `world/` or `content/` while the server is already
running, the browser keeps the old copy. Run this from `app/` to prepare
the new one, then reload the page:

```sh
npm run predev
```

The page opens a level by the hash in its address. For example,
`#level/02-the-locked-door` opens the level in the directory
`content/levels/02-the-locked-door/`. An address with no hash goes to the
first level, the corridor.

The browser remembers a few things. The playback speed you chose stays
between visits. Three more things stay only until you close the tab: the
code you typed in each level, the hints you have opened, and whether a
level's start card has been shown. If you want to start from a clean page,
clear the site's data in the browser, or open the game in a private
window.

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

The browser tests take longer, about a minute and a half. They build the
game, serve it, and play the levels in a real browser. Add `--e2e` to run
them after the other checks:

```sh
ci/check.sh --e2e
```

The repository's own checks deserve a mention, because they guard the
project's rules. They refuse a secret in any tracked file. They refuse a
forbidden word in any file, path or commit message. They keep the two
READMEs saying the same things. And they require every piece of art and
sound to be listed in a manifest with its source and licence.

## 7. Committing and pushing

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
