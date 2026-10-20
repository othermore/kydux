# Kydux — project conventions

Read this before touching anything. These rules come from the project owner and are
not negotiable.

## What the project is

A game for children to learn Python: a young wizard crosses one scene after another
of their school's castle and its grounds, and gets through each by writing real
Python. It goes by lessons: each lesson explains one programming idea, and the
level after it needs that idea to be solved. It is an independent project from
Kidux (`../kidux`), a Debian-based distribution for a child's first computer, and
it is presented on the same website. The general draft is `docs/dev/draft.md`.

## Fundamental rules

- **The hours Kydux is seen working on GitHub.** Nothing is committed with a visible
  date, pushed or run on GitHub outside Madrid's 19:00 to 03:00 around a night from
  Tuesday to Friday, and the whole of Saturday, Sunday and Monday, so from Friday
  19:00 to Tuesday 03:00 without a break. Work outside them stays local. A commit
  made outside them is dated inside them when it is pushed. `ci/push.sh` is the one
  way to push: it dates the commits not yet on GitHub inside the hours and pushes;
  outside them, `ci/push.sh --later` sets a timer for their next opening. The
  pre-push hook (`ci/hooks/pre-push`, enabled by `git config core.hooksPath
  ci/hooks`) refuses any commit dated outside them. Never `git push` by hand, never
  rewrite a commit already on GitHub.
- **No secret ever enters the repository.** The image-generation API key lives in
  `~/.config/kydux/secrets.env` or in the environment, never in a file of this tree,
  a commit message, a log or a generated file. Tools read it from there.
- **The game that inspired Kydux is never named**, in code, documents, commit
  messages, assets or the website. Its source may be read to understand how
  something works, but nothing of it is copied: no code, no text, no levels, no art,
  no sounds, no names of its own.
- **Everything is free software under the GNU GPL, version 3 or later** (`LICENSE`):
  code, levels, texts and art. An asset from elsewhere comes only under a licence
  that lets it ship with a GPL game (CC0, CC BY, CC BY-SA, GPL, OFL for fonts), and
  its origin, author and licence are recorded next to it.
- The repository is private until the owner says otherwise.

## Language rules

- **Code, comments, identifiers, commit messages and development docs: English
  only**, even though the owner talks to Claude in Spanish. Reply to the owner in
  Spanish.
- **Everything the player sees goes through the i18n layer**: lessons, story,
  hints, error messages, UI. Spanish and English from day one; adding a language
  never requires a code change. The Python the child writes is Python: its
  keywords and the game's API stay in English.
- User documentation is `README.md` with `README.es.md`, always in sync. Developer
  documentation is English only, in `docs/dev/`.

## Documents describe the present, not the past

Documents and plans say what is true now; code comments describe the code, not its
edit history. Why a change was made belongs in the commit message.

## Working agreements

- It runs locally, simply, on Linux, Windows and macOS, offline, with nothing to
  install beyond what the platform has; the same files can be served online.
- Commits: imperative subject line in English, body explains why. Commit only when
  the owner asks. They are authored as `othermore <info@kidux.org>`, the
  repository's own `git config`, never with a personal address.
- Never write a timestamp from memory: a dated note comes from `date -I`.
