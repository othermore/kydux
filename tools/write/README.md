# Writing the texts the child reads

Gemini drafts the story and every text the child reads. A person writes the
brief, runs the tool, reads the draft, corrects it and moves it into
`content/` (`CLAUDE.md`, *Who writes what the child reads*;
`docs/dev/architecture.md`, D55).

## A brief

A brief is a Markdown file in `briefs/`. It opens with a front matter that
names the files to write and the files Gemini reads first:

```
---
outputs:
  - content/lessons/if/en.md
  - content/lessons/if/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/*/en.md
---
What to write, for whom, how long, and what each text must say.
```

The outputs are paths of `content/`, in every language, or of `docs/dev/`
for a document the writers read, like the story bible. The context is
given to Gemini in full: the story bible, the course, and every text
written so far that the new one must follow on from. The brief's words say
what each text is for, the facts it must hold (a level's map, its goals,
what its hints may say), its length, and who speaks.

`rules.md` is sent before every brief: how a text for the child is
written, the choices for the wizard's gender, the names rule, the formats
and the shape of the answer.

## Running it

The tool needs the packages of `requirements.txt` in the repository's
`.venv`, and the key `GEMINI_API_KEY` in `~/.config/kydux/secrets.env`:

```sh
.venv/bin/pip install -r tools/requirements.txt
```

To see the prompt without sending it:

```sh
.venv/bin/python tools/write/write.py tools/write/briefs/chapter-1.md --dry-run
```

To have Gemini write the drafts:

```sh
.venv/bin/python tools/write/write.py tools/write/briefs/chapter-1.md
```

It prints the files it wrote, under `drafts/<brief>/`, beside a
`manifest.json` with the model, the brief and the date.

## From a draft to content

1. Read every draft whole. Check the facts against the level or the lesson:
   what the map has, what the goals ask, what the hints may give away.
2. Correct a sentence that is wrong; when much is wrong, correct the brief
   and run it again.
3. Move the files into `content/`, at the same paths.
4. Run `ci/check.sh`: the content tests, the i18n check and the hooks hold
   the texts to the game's rules.

`drafts/` is ignored by git, and the repository's checks refuse a file of it
in a commit.
