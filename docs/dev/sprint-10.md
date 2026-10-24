# Sprint 10 — The story, told by its writer

The owner's UAT of 2026-10-22 (plan, phase 5, *What the owner's UAT
taught*) reshapes the course. This sprint builds what every chapter needs
from now on and rebuilds chapter 1 with it: a writing tool that has Gemini
draft the story and the child's texts from a brief, which Claude reviews;
item kinds and numbers; stars that mean something; closings for every
level and story pages for every chapter; the small rules the UAT found
(the notebook before arguments, picking up from beside, the `?` card, the
word said before the door opens); and the game's opening: a letter of
admission, a wizard made inside the story, a friend at the gate who teaches
the basics, and a borrowed wand. Sprints 11 and 12 carry the same shape
into chapters 2 and 3, the screen's guide, the map over the level and the
saved games (plan, phase 5).

The pieces, in this order: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6. The rules of
the earlier sprints hold: pieces in order, `ci/check.sh --e2e` green and one
local commit per piece, never a push, every word for the player through
`t()` or a content file, nothing forbidden and nothing secret, documents
and comments in the present (CLAUDE.md). The new rule of CLAUDE.md, *Who
writes what the child reads*, holds from this sprint: every text the child
reads is drafted by Gemini through the tool of 10.1 and reviewed; Claude
writes the briefs. Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D55 — Gemini drafts the child's words; Claude briefs and reviews.**
  `tools/write/write.py` takes a brief (`tools/write/briefs/<name>.md`),
  gathers the context the brief names (`story.md`, `course.md`, the
  lessons and levels written so far, the rules of CLAUDE.md for texts, the
  vocabulary of D27 and D59), calls Gemini with the key of
  `~/.config/kydux/secrets.env` (`GEMINI_API_KEY`), and writes what comes
  back under `drafts/` (ignored by git) as the files the brief asked for,
  in both languages, with a `manifest.json` beside them: the model, the
  brief, the date. Claude reads every draft, corrects it, and moves it
  into `content/`; the brief stays in the repository as the record of what
  was asked. The model is the newest Gemini Pro text model the API lists
  when the tool is built, pinned in the tool and in the versions table.
  The prompt never carries the forbidden list: it says *no name from a
  famous story of wizards or a school of magic*, and the hooks check what
  comes back. Rules out texts written by Claude except the briefs, the
  corrections, and words too small to brief (a button, a label, a notebook
  entry).
- **D56 — Items have kinds, and a number in their chapter.** A chapter's
  items are `lesson:<id>`, `level:<id>` and `story:<id>`. A story item is
  pages of Markdown under `content/stories/<id>/`, as a lesson without a
  Try it, ending in *Go on*; a chapter opens with one and closes with one.
  A level says its kind in `level.json`: `practice` (a screen to solve),
  `fix` (a program given that does not work, to repair), `improve` (a
  program that works, to make better: fewer lines, no bumps) or
  `challenge`. The map, the cards and the level's heading say the kind and
  the number within the chapter: *Lesson 3*, *Practice 4*, *Fix 2*, counted
  per kind in `course.json` by `pack-world.mjs`, so that the texts never
  carry a number. A fix or improve level has its program in
  `starting_code`, and the start card says it is to be repaired or
  bettered (`level.kind_fix`, `level.kind_improve`).
- **D57 — Stars say how well, and why.** A won level earns three stars
  and loses one for each of: a hint shown; the winning run bumping into a
  wall or a door (the wizard walked into something), or a bonus goal
  unmet when the level has one. A level cannot lose more than two: a win
  is always one star. The win card lists the three with their reason, won
  or lost (`stars.no_hints`, `stars.clean`, `stars.bonus` or, with no
  bonus, `stars.first_try`: no run before the winning one that was not
  won), so that the child knows what to try again for; the progress keeps
  the most stars and the number of runs. Rules out stars that only count
  bonus goals.
- **D58 — The wizard picks up what is on its tile or beside it, and may
  say which.** `wizard.pick_up()` takes the thing on the wizard's tile,
  else the one thing beside it (the four tiles, shelves included); with
  more than one in reach it is refused with `which_one`, a thought that
  names them (*There are several: say which, like wizard.pick_up(key)*).
  `wizard.pick_up(thing)` takes that thing when it is in reach. A thing on
  a shelf beside the wizard is picked up by hand; `fendra` is for what
  lies farther. Rules out a wizard who must stand on a shelf.
- **D59 — Easy word and technical word together, then the technical.**
  Each idea has the child's word and the proper one: *an action, which
  programmers call a method*; *what it knows, an attribute*; *the number
  in the brackets, an argument*; *a question, an expression*; *a name for
  a value, a variable*. A lesson gives both the first time, uses both
  side by side through the chapter that introduces the idea, and the
  course uses the proper word alone from the next chapter on. D27 keeps
  the proper words; the notebook's words follow this rule by chapter.
- **D60 — A lesson may teach a concept, which the notebook follows.**
  `teaches` in `lesson.json` may name a concept, `concept:<name>`, beside
  the API names: `concept:arguments`, `concept:comments`, `concept:print`.
  `pack-world.mjs` counts concepts among what is known at each level
  (D40), and the content tests hold a level's starting code and solution
  to them: a comment in the starting code needs `concept:comments` known,
  an argument in the solution needs `concept:arguments`. The notebook
  shows an action's example without arguments (`wizard.move_right()`,
  *walks a step to the right*) until `concept:arguments` is known, and
  with them after; `api.json` carries both examples and both wordings
  (`notebook.<role>.<member>` and `notebook.<role>.<member>.simple`).
- **D61 — The game opens in the story.** A fresh visit shows the
  introduction, `story:the-letter`, before the creator: the letter of
  admission, the first year, the road to the gate; its last page leads to
  the creator. The creator shows the looks of the gender chosen: the
  looks table says which gender each is for, four each; the name field is
  filled with *Kydux* by default, and a name that is a character's, a
  thing's, a spell's, the password's or a Python name in the course is
  refused with a word (`wizard.name_taken`). The start screen keeps
  *Continue*. Rules out the mechanics before the story.
- **D62 — Every level closes, and a chapter opens and closes.** A level's
  text has `outro`, said by its speaker on the win card, and `learned`,
  one sentence of what the child now knows (*Now you know how to tell an
  action how much to do*), shown under the stars; a chapter's last level
  has no `learned`, since the chapter's closing story page recaps the
  chapter's ideas. The content tests require `outro` on every level and
  `learned` on every level but a chapter's last.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out; D27 gains a sentence pointing to D59.

## 2. The story and the course, after this sprint

`story.md` is rewritten by Gemini from a brief that keeps its names and
tone and adds what the UAT asked: the letter of admission; the arrival at
the gate, which the wizard cannot open; Nuri, who arrives at the same
time, is of the wizard's gender, already knows some magic, and teaches the
basics at the gate (the tutorial, chapter 1); the gate opened and the
road up to the castle; Nuri's spare wand, lent, to be returned, and the
wand bank of the parents' association until the wizard can buy one at the
wand shop; the wizard's growth through the chapters (a wand of their
own, a broom, friends); each chapter's opening and closing beat; Dask,
Wenna, Eldra, Zarek, Orla and Bimo as they are.

Chapter 1 is rebuilt, its items in order:

```
story:the-letter          the game's opening, before the creator (D61)
story:at-the-gate         chapter 1 opens: the gate shut, Nuri arrives
lesson:what-a-program-is  Lesson 1: Nuri explains; a program, instructions
level:the-gate            Practice 1: one instruction, to the gate
lesson:objects-and-actions Lesson 2: a program is instructions; an action
                          needs someone to do it; characters and things
                          are objects; an action is a method (D59)
level:the-corridor        Practice 2: a sequence, round a corner
lesson:notes              Lesson 3: a comment is a note in the program
                          that does nothing, for a person (D60)
level:the-dark-note       Fix 1: a program with a wrong move, to repair
lesson:how-much           Lesson 4: an argument: how much
level:the-long-corridor   Practice 3: one line with a number
level:the-stairs          Improve 1: a program that bumps, to make clean
lesson:words              Lesson 5: strings; say takes an argument too
level:the-password        Practice 4: the word said beside the gate
lesson:things-to-carry    Lesson 6: pick up what is on your tile or beside
level:the-pedestal        Practice 5: Nuri's spare wand, lent
lesson:your-first-spell   Lesson 7: a spell's effect depends on where you
                          stand and what is near; zelim
level:the-sealed-door     Practice 6: the seal
level:the-way-in          Practice 7: the tutorial together
story:up-to-the-castle    chapter 1 closes: through the gate, the road up,
                          the castle; what you learned, in Nuri's words
```

The levels keep their maps and goals except where the kinds ask
otherwise: `the-dark-note` is a new short level (a corridor with one
corner) whose starting code has a wrong move to find and fix, with a
comment that says so; `the-stairs` keeps its map and starts with a
program that reaches the top but bumps twice. Every level gains `outro`
and `learned` (D62), and its `kind`. The first chapter says *an action*
beside *a method* throughout (D59). The notebook of the first two
practices shows the moves without arguments (D60).

## 3. The pieces

### 10.1 The writing tool

**`tools/write/write.py`** (D55): `write.py briefs/<name>.md` reads the
brief, whose front matter names the files to produce (paths under
`drafts/`, one per language) and the context to send (globs under
`content/` and `docs/dev/`), builds the prompt (the rules of CLAUDE.md on
texts for the child, D27 and D59, the names rule, the brief, the context
files in full), calls Gemini through the `google-genai` package installed
in `.venv`, parses the answer (JSON: a map of path to text) and writes
the drafts with `drafts/<name>/manifest.json`. A `--dry-run` prints the
prompt. The model is listed with the API and pinned; the versions table
gets it. `drafts/` goes into `.gitignore`. `tools/write/README.md` says
how a brief is written and how a draft becomes content: read, correct,
move, run the checks. The repository's checks refuse a draft committed
by mistake (a path under `drafts/`).

**Briefs for this sprint**, in `tools/write/briefs/`: `story-bible.md`
(section 2), `chapter-1.md` (every item of chapter 1: the two story
pages, the seven lessons, the eight levels' intros, outros, learned lines,
hints and starting-code comments, in both languages, in Nuri's voice
for the lessons and Ilda's for nothing yet), `the-letter.md` (the opening).
Each brief says the audience (a child of eight), the style (one idea per
sentence, why before how), the kind of each text and its length, the
names to use and the rule on names, and the pages' structure (D41).

**Tests.** pytest for the tool with the API faked: the prompt holds the
brief and every context file; the answer's files land under `drafts/`
with the manifest; a path outside `drafts/` is refused. The project check
for `drafts/` in the index.

### 10.2 Kinds, numbers, concepts and stars

**The course.** `story:` items (D56): `content/stories/<id>/{story.json,
en.md, es.md}`, `story.json` with `id` and `speaker`; `loadStory`,
`storyScreen` (the lesson screen without Try it, *Go on* at the end), the
route `#story/<id>`, the map's icon for a story page (a scroll),
`stopState` treats it as a lesson (read on its last page). `level.json`'s
`kind` (D56), checked by the loader (one of the four; `practice` when
absent). `pack-world.mjs` writes each item's kind and its number within
its chapter and kind into `course.json` (`numbers`: item to `{kind, n}`),
and the page says *Lesson 3* / *Practice 4* / *Fix 1* / *Improve 1* /
*Challenge 2* (`kinds.<kind>` with `{n}`) on the map's stops, the level
heading, the lesson heading and the start card. The start card of a fix
or improve level says what to do (`level.kind_fix`, `level.kind_improve`).

**Concepts** (D60): `teaches` accepts `concept:<name>`; `pack-world`
counts them in `known`; `tools/i18n_check.py` and the content tests know
the concept names (`arguments`, `comments`, `print`, `strings`); the
tests hold the starting code and solution of a level to the concepts
known there (a `#` line needs comments; a call with an argument needs
arguments; `print(` needs print; a quoted string needs strings). The
world's `api.table()` gives each action a `simple` example (the call with
no arguments) and `i18n` the `.simple` wording; the notebook and the
completion show the simple ones until `concept:arguments` is known.

**Stars** (D57): the controller counts bumps in the winning run and the
runs before it; the progress keeps `runs` per level; `stars()` takes
the hints shown, the bumps, the runs and the bonus goals and gives the
three with their reasons; the win card lists them (`#star-reasons`). The
map's stars follow.

**Tests.** Vitest: `stars()` for every case; the numbers from a course;
the notebook simple before arguments. pytest: the loader's `kind`; the
concepts held; `api.table()`'s simple examples. The browser: a story page
turns and goes on; the heading says *Practice 2*; a win with a hint shows
two stars with the reason.

### 10.3 The small rules the UAT found

- `pick_up` from beside, with an argument (D58): the world, `explain.py`
  for `pick_up("key")` (a thing, not a word), the thought `which_one`, the
  notebook's words, the lesson on things (10.5) says it. The high shelf
  keeps its book three tiles up.
- The `?` card opens above the notebook (the card's z-index), and says
  *Continue* (`level.continue`) when reopened, *Start* only the first time.
- The word said, then the door: the scene shows the bubble first and
  opens a password door in the second half of the tick.
- The spells lesson's words: a spell's effect depends on where the wizard
  stands and what is near, and may be nothing; some spells, later, take a
  target (10.5 writes it; here the notebook's `cast` says it).
- The creator (D61): the looks table gains `gender`, four looks each; the
  creator shows the chosen gender's looks and clears the look when the
  gender changes; the name field starts with *Kydux* (`wizard.default_name`,
  the same in both languages); reserved names: `tools/reserved_names.py`
  builds the list from `story.md`'s names, every thing and actor id of
  every level, every spell, the password and the words of chapter 1's
  code (`wizard`, `door`, `key`...), written by `pack-world.mjs` into
  `public/reserved.json`, which the creator refuses with
  `wizard.name_taken`; the list is held by a test to the content.
- The first level's Spanish title says the school gate (*La puerta del
  colegio*), and the password level's starting code names the word in its
  comment once comments are taught (it is: lesson 3 comes before).
- The method is said from the start: the opening story and the first
  lesson say that trying, watching and trying again is how a wizard
  learns (10.5 writes it).

**Tests.** pytest for `pick_up` beside, with several, with a name; the
reserved names. The browser: the `?` card over the open notebook and its
*Continue*; the creator's looks by gender, the default name, a reserved
name refused; the password door opens after the word.

### 10.4 The game's opening and the creator in the story

**`story:the-letter`** (D61): the route of a fresh visit is the opening
story, whose *Go on* leads to `#wizard`; the creator's Done leads to the
first item of the course; the start screen's *Continue* goes on as today,
and *Start from the beginning* returns to the opening. The map does not
list the opening (it is before the course), but chapter 1's opening story
page is the chapter's first stop.

**Tests.** The browser: a fresh visit lands on the letter, goes on to the
creator, and from Done to chapter 1's first stop; the loop suite follows.

### 10.5 The story bible and chapter 1, written

The briefs of 10.1 run; the drafts are read and corrected (names, the
rules, the facts of each level: what the map has, what the goals ask,
what the hints may say); `story.md` is replaced by its draft, and chapter
1's items by theirs, with `the-dark-note` added and `the-stairs` made an
improve level. The speaker of chapter 1 is Nuri (`nuri`), whose gender
follows the wizard's: the texts use choices (D37) for Nuri too, and the
scene draws Nuri, when a level has Nuri as an actor, with the first look
of the wizard's gender other than the wizard's own. `course.md`'s chapter
1 says what was built. Every text the child reads in chapter 1 is
Gemini's, reviewed; the report says what was corrected and why.

**Tests.** The content tests as they are, with `outro` and `learned`
required (D62), the concepts held (D60), and chapter 1's items of the
kinds and in the order of section 2.

### 10.6 Documents

- `architecture.md`: D55–D62; D27's pointer to D59; *Parts* with
  `tools/write/`, `content/stories/`; the versions table with
  `google-genai` and the model.
- `plan.md`: section 2.5's layout with stories and kinds; phase 5 as
  written; the versions.
- `dev-environment.md`: how a text is written (the brief, the tool, the
  review), in the guide's style; `#story/<id>` among the addresses;
  `drafts/` among what git ignores.
- `README.md` and `README.es.md`: *Playing* begins with the letter.
- `course.md`: chapter 1 as built; chapters 2 to 5 gain their opening and
  closing story pages and their fix and improve levels in outline, for
  sprint 11 and after.

## 4. What this sprint leaves out

Chapters 2 and 3 rewritten (sprint 11); the screen's guided overlay and
the map over the level with the chapter as a mini-map and what lies ahead
unnamed (sprint 11); the lessons readable from a level (sprint 11); the
saved games on the server (sprint 12); sound, animation and the page's
look (phase 4).

## 5. What the owner brings

- The Gemini key is in place; the first call will say whether the API
  and its billing are on. No install needs sudo: `google-genai` goes into
  `.venv`.
- After this sprint: a reading of the new story and chapter 1 before
  sprint 11 rewrites chapters 2 and 3 in the same shape.

## 6. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`10.1: the writing tool`), never a push; what this document leaves open
decided the simplest way and said in the commit; what turns out wrong
done the working way and logged in `architecture.md`; a short report to
the owner in Spanish at the end, with what differs, and what Gemini's
drafts needed corrected.

## 7. Acceptance test (for when the owner tries it)

1. In a private window, the game opens on the letter of admission, pages
   of story, before any mechanics; *Go on* leads to the creator.
2. The creator shows the looks of the gender chosen, the name field says
   *Kydux*, and *Dask* or *zelim* as a name is refused with a word.
3. Chapter 1 opens with a story page at the gate, where Nuri arrives; the
   first lesson is in Nuri's voice and says what a program is.
4. The map and the headings say *Lesson 1*, *Practice 1*, *Fix 1*,
   *Improve 1*; the fix level gives a program to repair and says so.
5. The notebook of the first practice shows `wizard.move_right()` with no
   number and *walks a step to the right*; after the lesson on arguments,
   the number and its words.
6. A win after a hint shows two stars, with the reason; bumping into the
   wall costs the clean star; the win card says what was learned, and
   the chapter ends with a story page that recaps.
7. The wizard picks up a thing from beside it; with two things in reach,
   it asks which; `wizard.pick_up(key)` takes the key.
8. The `?` card opens over the notebook and says *Continue*; in *The
   password*, the word shows before the door opens.
9. `story.md` and chapter 1's texts read as a child's story, in Nuri's
   voice, with the names of the bible; `tools/write/briefs/` holds what
   was asked of Gemini.
