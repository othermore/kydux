# The development environment

How to set up a machine to work on Kydux, run it, try it from another
computer, and check it.

## 1. The machine

Debian 13 with Python 3.13 and git. Node 24 comes from NodeSource, since
Debian's Node is too old for the tools (architecture.md, D9):

```sh
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Nothing else is installed system-wide. From the repository's root:

```sh
git config core.hooksPath ci/hooks     # the hours, the forbidden words, the secrets
python3 -m venv .venv
.venv/bin/pip install -e 'world[dev]'  # kydux_world, pytest, ruff
(cd app && npm ci)                     # the app's tools
(cd app && npx playwright install chromium)   # the browser for the browser tests
```

## 2. Files outside the repository

All in `~/.config/kydux/`, none of them ever committed:

| File | What it holds |
|---|---|
| `secrets.env` | `KEY=value` lines: the image-generation API key and other credentials. Mode 600. Tools read it; nothing prints it. |
| `forbidden.txt` | The forbidden words, one entry per line, `#` for comments (architecture.md, D8). The hooks refuse a commit without it. |
| `tls/` | The local certificate authority and this machine's certificate, made by `ci/dev-cert.sh`. |

`forbidden.txt` starts with the name of the game Kydux takes after; any
other name the project must not use by accident is added as a line. One
entry covers its spellings with spaces, hyphens or underscores, in any
case.

## 3. Running the game

```sh
ci/dev-cert.sh           # once: the certificate for HTTPS (section 4)
cd app && npm run dev    # https://localhost:5173, and on the network
```

The server reloads the page when a file changes. `npm run build` makes the
game in `app/dist/`, and `npm run preview` serves that on port 4173, the way
a release runs.

The page opens a level by the address's hash, `#level/<id>`, the level's
directory under `content/levels/`; without one it goes to the first,
`#level/01-the-corridor`. The browser keeps the speed chosen
(`localStorage`, `kydux.speed`) and the code typed in each level for the
visit (`sessionStorage`, `kydux.code.<id>`); clearing the site's data in
the browser starts afresh.

## 4. Trying it from another computer

The development server listens on every interface, so another computer on
the same network opens it by this machine's name, `https://hija.local:5173`
(macOS resolves `.local` names by itself), or by its address, which Vite
prints when it starts.

It has to be HTTPS: a browser gives a page the isolation that stopping a
runaway program needs only in a secure context, and HTTP from another
computer is not one (architecture.md, D13). The certificate comes from a
small certificate authority of this machine's own, made by `ci/dev-cert.sh`.
The other computer trusts that authority once:

- **macOS**: copy `~/.config/kydux/tls/ca.crt` to the Mac
  (`scp hija:.config/kydux/tls/ca.crt ~/Downloads/kydux-dev-ca.crt`), open
  it, which adds it to Keychain Access in the *login* keychain; double-click
  *Kydux development (hija)*, open *Trust*, set *When using this
  certificate* to *Always Trust*, close and give the password. Safari and
  Chrome then trust the game's certificate; Firefox needs
  `security.enterprise_roots.enabled` set to true in `about:config`, or the
  file imported under *Settings → Privacy & Security → Certificates*.
- **Windows**: open `ca.crt`, *Install Certificate*, *Current User*, *Place
  all certificates in the following store*, *Trusted Root Certification
  Authorities*.
- **Linux**: `sudo cp ca.crt /usr/local/share/ca-certificates/kydux-dev.crt &&
  sudo update-ca-certificates` (and Firefox's import, as on macOS).

The authority can sign only for this machine's names and private
addresses, so trusting it trusts nothing else. After this machine's address
changes, `ci/dev-cert.sh --renew` makes the certificate again; the other
computer keeps trusting the same authority.

The page's status line says whether it is isolated: *This page can stop a
spell that runs forever.* Without the certificate trusted, the browser
warns before it opens the page. When the page is not isolated, whatever the
reason, the game still works: it stops a runaway program by starting Python
again, and the status line says so.

From outside the local network, an SSH tunnel makes the game local to the
other computer, which needs no certificate:
`ssh -L 5173:localhost:5173 hija`, then `https://localhost:5173` (or
`KYDUX_HTTP=1 npm run dev` on this machine and `http://localhost:5173` there).

## 5. Checking

```sh
ci/check.sh          # lint, the world's and the project's tests, i18n, the app's types, tests, build
ci/check.sh --e2e    # all that, then the browser tests against the built game
```

A change to `world/` or `content/` while the dev server runs needs
`npm run predev` again, in `app/`, which packs the world and copies the
levels for the browser, and a reload.

## 6. Committing and pushing

- Commits are local, any time, authored as the repository's `git config`
  says (`othermore <info@kidux.org>`). The pre-commit hook refuses a
  forbidden word or a secret in the tree; the commit-msg hook a forbidden
  word in the message.
- `ci/push.sh` is the one way to push: inside the hours it dates the
  commits not yet on GitHub inside them and pushes; outside them,
  `ci/push.sh --later` sets a timer for when they open (architecture.md,
  D12). The pre-push hook refuses a push made any other way.
- `CLAUDE.md` and `.claude/` are never committed.
