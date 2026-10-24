# Sprint 13 — Chapter 1 made right on its painting

The owner's acceptance test of sprint 12 (2026-10-23, chapter 1 on the
painted field; the findings are in section 2) and Fable's review of the
sprint shape this sprint. It keeps to chapter 1 and to what every chapter
will need: the friend of the opposite gender and the words that follow
them; the wizard drawn in the look the child chose; the field placed
again so that nothing stands under a tree and every mark is seen; marks
and runes that pulse; the guide as the owner wants it; the notebook's
spells and words; the texts corrected; and the code tidied where the
sprint left it heavy. Chapters 2 and 3 enter the game in sprint 14, once
this chapter passes the owner's test.

The pieces, in this order: 13.1 to 13.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, every word for the player through `t()` or a content
file, nothing forbidden and nothing secret, documents and comments in the
present (CLAUDE.md), Gemini writes every text the child reads from a
brief. Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D77 — Two friends, and the one who teaches is of the other gender.**
  The story has two first-year friends: Nuri, a girl, and a boy with a
  name of his own (Teku unless the story bible's brief gives a better one;
  a word of neither language, easy to say, not on the forbidden list). The
  friend who meets the wizard at the gate and teaches chapters 1 and 3 is
  the one of the other gender: Nuri for a boy wizard, the boy for a girl
  wizard. A text names the friend as `{friend}`, and writes the friend's
  gendered words as a double-braced choice, `{{boy's words|girl's words}}`,
  resolved by the friend's gender; single braces stay the wizard's (D37).
  In `level.json` and `story.json` the friend is the actor and the speaker
  `friend`; the page resolves the figure and the name from the wizard's
  gender. Rules out a friend of the wizard's own gender, and a name fixed
  in a text.
- **D78 — The opening belongs to chapter 1, and stories are numbered.**
  `story:the-letter` is chapter 1's first item, keeping `opening` for the
  creator that follows it; every item's label carries its chapter and its
  number by kind, stories too: *Chapter 1 · Story 1*, *Chapter 1 ·
  Practice 4*. Rules out an unnumbered story before the course.
- **D79 — What stands on a cell is marked, and a mark is never hidden.**
  Every cell a thing of the painting stands on is in the scene's map as
  that thing's letter: a tree's trunk and the cell beside it when the
  trunk takes two, the flat stone (`o`, stood on by nothing, seen over). A
  level's start, end, things and friend lie on cells no cut-out covers; a
  test holds every level to it, reading the scene's art. The page draws
  the goal's mark as a ring that pulses, and a glow that pulses over a
  sealed door, above the ground; neither can be hidden, since the cell is
  free. A painting is asked for things that fit one cell where they can.
  Rules out a mark under a crown or an arch, and a cell walked through a
  tree.
- **D80 — The notebook has the spells and the words.** Beside what the
  wizard can do, the notebook has a tab, *Spells and words*: each spell
  the course has taught up to the level, with what it does, and each word
  the course has given (a password), with what it opens; the course
  accumulates them as it accumulates the API (D40). A level's `level.json`
  names its `spells` (as now) and its `words`. Rules out a child having to
  remember a spell's or a word's spelling from a lesson pages back.

## 2. What the owner's test of chapter 1 asks

| Where | What |
| --- | --- |
| Every item | The story is numbered, and the label says the chapter: *Chapter 1 · Story 1: The letter* (D78). |
| The letter, 3 of 5 | The wizard walks straight up a column that is not the path, over flowers and grass. The walk follows the path, in straight stretches with turns; paths in a painting are asked to run roughly along rows and columns. |
| The letter, 4 of 5 | Not "you have no wand and know no magic": that comes later. "You have no idea how to get in." |
| Who are you | The figure in the game changes with the look chosen (13.2). |
| At the gate | Nuri, a girl, said "un alumno"; the friend is of the other gender and has the right name and words (D77). |
| At the gate, 8 of 8 | "But let me show you the most important things from the beginning" instead of "Let's start with what a program is". |
| The guide, 1 of 7 | "Here you see the game and its characters", not "this is where your program happens". |
| The guide, 2 of 7 | "These are the tasks you must finish to complete the level." |
| The guide, 3 of 7 | "This is where you write your program to control your wizard in the game. You write one instruction on each line, and with them you tell your wizard what to do." |
| The guide, 5 of 7 | The notebook's button is highlighted as well as its panel, with two arrows, so that the child sees the button opens it. |
| The guide, 6 of 7 | Hint and the question mark are two steps; a last step says that now we write the first instruction. |
| Starting again | Faster, and a spinner instead of words: only the feeling of a restart. |
| Practice 2 | The mark is hidden by a tree; it moves to a free cell (D79). |
| Lesson 3 | Opens "We want to leave a note in our program to remember something, to explain what it does, or to write down what is left to do", then the rest. |
| Fix 1 | "I wrote a program to reach that mark", not "on a note"; the level is *Fixing the program*; the wizard does not start behind a tree; the mark is not at a tree's foot; the tree's second cell is blocked (D79). |
| Lesson 4 | *How far we move* / *Cuánto nos movemos*. |
| Every mark | More visible: it pulses (D79). |
| Practice 4 | The password is in the starting code's comment, as agreed. |
| Early on | A lesson says what the round mark is: where the wizard must get to (lesson 1, and the guide's goals step). |
| Practice 5 | "I have a spare wand I can lend you, but so that you practise a little, I left it on that stone"; the stone's cell cannot be stood on (D79). |
| Practice 6 | The mark is hidden by the arch; it moves a cell. |
| Practice 7 | The rune on the castle's door is not seen: it glows (D79); the notebook has the spells and the words (D80). |
| Up to the castle, 3 of 7 | "when you picked up the wand" for "the fixed note"; a move's argument "says how many steps to take". |
| Up to the castle, 6 of 7 | "run by the parents' association" / "the Parent-Teacher Association". |
| In general | A thing that takes more than one cell has every cell marked, or fits one cell (D79). |

Later, not this sprint: the art of the lessons, the start screen and the
map, once the levels and the game work (plan, 4.6).

Fable's review adds: the restart's fades fixed in the review; the wizard
always Gemini's figure (13.2); the goal marker drawn under the cut-outs
(D79); the engine's scene file over 900 lines with three modes in it, and
trial scripts beside the production ones in `tools/art/` (13.8); the
story screen with no way to replay a step (left out).

## 3. The pieces

### 13.1 The friend of the other gender, and the story numbered (D77, D78)

- `docs/dev/story.md`: the two friends, with the boy's name from a brief
  to Gemini (`tools/write/briefs/story-bible.md` asks for three names
  that are words of neither language; the implementer picks one that is
  not reserved and not forbidden; the owner's example is Kidu). The bible
  says where each friend is: the one of the other gender meets the wizard
  at the gate and teaches chapters 1 and 3; the one of the wizard's own
  gender is their dormitory mate, and comes into chapters 2 and 3 (the
  library, the night out of bed), written in sprint 14. `i18n` gains
  `characters.<boy>`.
- `app/src/i18n/personal.ts`: `{friend}` and the double-braced choice;
  `friendOf(gender)` gives the friend's id and gender; the i18n check
  holds double braces to one bar, and Spanish `mago`/`maga` to single
  braces, `chico`/`chica` and the like inside double ones where the
  friend is meant (`tools/i18n_check.py`, with tests).
- The content: `actors` and `speaker` say `friend`; `story.json` steps
  say `friend`; the texts write `{friend}` and double-braced choices. The
  world treats `friend` as any friend actor. The page maps `friend` to
  the character: the figure's sheet (`content/art/figures/nuri.webp`, and
  the boy's, made in 13.2), the placeholder figure, the name in cards and
  bubbles, and `friendText`.
- `content/chapters/01-arrival/chapter.json` lists `story:the-letter`
  first; `pack-world.mjs` numbers stories by kind; `itemNumber` says the
  chapter too (`kinds.story`, `chapter.label` through i18n); the story
  screen, the lesson screen, the level's heading, the start card and the
  map show it. The opening's *Go on* leads to the creator or to the item
  after it, never to itself; *Continue* and the saved games' place never
  name the opening.
- Tests: personal, the i18n check, course.test, the content tests (a
  friend actor is `friend`), e2e (the friend's name and words for a girl
  and for a boy wizard; the labels).

### 13.2 The wizard's looks, and the two friends, drawn

- `tools/art/figures.py`: from the base wizard sheet
  (`art/raw/demo-src/`), one sheet per look of `looks.ts` (six), by a
  Gemini edit that changes only the robe, the hat's band, the hair's
  colour and style, and the skin, as the look says; each frame's
  silhouette checked against the base (a difference under a threshold),
  and a sheet that fails made by a palette swap of the base instead
  (`sprites.py`); the boy friend's sheet the same way from Nuri's.
  Written to `content/art/figures/wizard-<look>.webp` and
  `<boy>.webp`, listed in `figures.json`, with their `SOURCE.md`.
- `scene.ts` draws the wizard from the look's sheet, the friend from the
  gender's; the creator's preview and the start screen keep the drawn
  figures (`placeholders.ts`), until the UI's art (4.6).
- Budget: about eight Gemini images.
- Tests: the figures' check in `tests/tools`; e2e: `data-look` on the
  painted scene, and the friend's figure by gender.

### 13.3 The field placed again: footprints, marks, runes (D79)

- `content/scenes/the-field/map.txt` and `scene.json`: every cell a tree,
  rock, fence or the stone stands on is marked; `o` for the flat stone;
  the wand lies on it and is picked up from beside. The levels are placed
  again so that each level's start, end, things and friend are on free,
  uncovered cells, and each starts where the one before ended: the
  corridor's end and the fix's start and end in the open (the fix's wrong
  move still walks into the fence); the sealed gate's level ends a cell
  before the arch; the way in starts there. Solutions, wrong answers and
  the chain test follow.
- `tests/project/test_art_content.py`: for every level on a painted
  scene, those cells are not under an opaque pixel of any row image or
  thing state (reading `art.json` with Pillow); for every walkable cell, a
  cut-out's opaque pixels over it come only from a row above it (the
  owner's rule).
- The letter's walk follows the path: `story.json` stages it as straight
  stretches along the path's cells with turns, and the content test keeps
  every story walk on walkable cells.
- `scene.ts`: the goal's mark is a ring drawn by the page (D79): on a
  painted scene above the ground and under the cut-outs, on a placeholder
  scene over the floor; it pulses slowly in size and alpha (`Sine`, about
  1.2 s), still for a reader who asks for less motion. A sealed door gets a
  glow that pulses over its state image while sealed, gone once unsealed.
  `data-marks` lists the marks' tiles for the tests.
- `art/README.md` and the painting prompts: things fit one cell where
  they can; a tree's trunk is one cell; paths run roughly along rows and
  columns; each cell a thing stands on is marked.

### 13.4 The guide and the restart

- `content/guide/`: eight steps: `scene`, `goals` (with the round mark
  named), `editor`, `run`, `notebook`, `hint`, `about`, `method`, with the
  owner's words of section 2 (Gemini drafts them from
  `tools/write/briefs/guide.md`, which quotes the owner's sentences as
  the facts to say); `GUIDE_STEPS` the same eight. A step may have two
  targets (`targets`), each with its arrow and its highlight: the
  notebook's step points at the button and at the panel, opening the panel
  for the step.
- The restart (D75): the fade 120 ms out and in, held 160 ms; a spinner
  (`.restart-spinner`, CSS, no words) in place of the sentence, with
  `level.starting_again` as its `aria-label`; `data-restarting` stays for
  the tests.
- Tests: guide.spec for the eight steps and the notebook's two arrows;
  restart.spec for the spinner.

### 13.5 The notebook's spells and words (D80)

- `level.py`: `words`, the passwords the level gives, validated like
  `spells`; `pack-world.mjs` accumulates `spells` and `words` across the
  course into `course.json` (`spells_known`, `words_known`, as `known`),
  and the page gives the level the union, as it gives the API (D40).
- `notebook.ts`: two tabs, *Actions* (as now) and *Spells and words*;
  the second lists each spell with `spells.<name>` and each word with
  `words.<name>` from i18n ("*zelim*: breaks the seal of a door beside
  you"; "*ambrel*: the school's word, which opens its gates"), in italics
  as words to type, with a click that puts `wizard.cast("zelim")` or
  `wizard.say("ambrel")` in the editor, as the actions' examples do. The
  i18n check holds `spells.<name>` to `KNOWN_SPELLS` and `words.<name>`
  to the words the levels give.
- The password's level: the starting code's comment gives *ambrel*.
- Tests: notebook.test, the i18n check, e2e (the tab in the password's
  level and in the way in).

### 13.6 The words corrected

- Hand corrections, in the owner's words (section 2), in both languages,
  noted in the report: the letter's step 4; at the gate's step 8; lesson
  3's opening; lesson 4's title; the wand's intro; up to the castle's
  steps 3 and 6; the fix's title and intro; the password's comment.
- Briefs run again where the text changes shape: `chapter-1-lessons.md`
  (lesson 1 names the mark; lesson 6 the wand on the stone, as the owner
  says it), `chapter-1-levels.md` (the fix, the wand, and every level
  placed again in 13.3: positions and step counts), `chapter-1-stories.md`
  (the letter's walk, the friend), and the three chapters' briefs for
  `{friend}` and the double-braced choices (13.1): every text that names
  the friend comes back through Gemini, reviewed for the principles of
  sprint-12.md, section 2. `tools/write/rules.md` says how the friend is
  written.
- `tools/course_book.py` resolves `{friend}` and the double braces for
  the gender it writes for.

### 13.7 Documents

- `architecture.md`: D77–D80; *Parts* with `figures.py` and the new tab;
  the versions table if anything changes.
- `plan.md`: 2.5 with `words`, `friend` and the numbered stories; 4.5 as
  done for the wizard's looks; the sprint line.
- `dev-environment.md`: the friend in a text; how a look's sheet is made.
- `README.md` and `README.es.md`: the friend of the other gender, the
  notebook's spells and words, the pulsing mark.
- `course.md` and `story.md`: the two friends; chapter 1's items with the
  letter first.

### 13.8 Housekeeping

- `scene.ts` split: the painted drawing (`painted.ts`: art loading, the
  rows, the things' states, the figures' sheets, the grid, the marks and
  glows) apart from the scene's playback and camera, and the placeholder
  drawing in `placeholders.ts` as now; the handle unchanged, the tests
  unchanged.
- `tools/art/`: the trial scripts (`draw.py`, `contact.py`,
  `isometric.py`, `open_scene.py`, `layout.py`, `demo.py`, `demo/`,
  `demo_shots.mjs`, `interior.py`) under `tools/art/trials/`, the
  production ones (`generate.py`, `cut.py`, `sprites.py`,
  `map_from_image.py`, `image_first.py`, `export_scene.py`, `figures.py`)
  at the top, each with its usage line; `tests/tools/test_art.py` split
  the same way.

## 4. What this sprint leaves out

Chapters 2 and 3 on their paintings (sprint 14: the owner's choice on the
long stairs and the two rooms, the darkness and the sight cones drawn
above the cut-outs, a thing picked up staying gone, a goal to reach any
of several cells); the second friend, the wizard's dormitory mate, written
into chapters 2 and 3's stories and levels, with their texts briefed again
(sprint 14, from the bible of 13.1); the art of the lessons, the start screen and the map
(4.6); the story screen's replay of a step; chapters 4 and 5; the saved
games on the server.

## 5. What the owner brings

- Nothing before the sprint. Gemini's key and `agy` are in place.
- After it: the acceptance test of section 7, and the course book read
  again for chapter 1.

## 6. How the implementer works

As in sprint 12 (sprint-12.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`13.1: the friend of the other gender, and the story numbered`), never a
push, no timers; what this document leaves open decided the simplest way
and said in the commit; what turns out wrong done the working way and
logged in `architecture.md`; every text the child reads from Gemini
through a brief that opens with what the child knows by now, reviewed
against sprint-12.md, section 2, and asked for again when a draft clips
or errs; the owner's sentences of section 2 used as they are; a short
report in Spanish at the end, with what differs, what was corrected by
hand, the Gemini images spent, where the screenshots are, and section 7.

## 7. Acceptance test (for when the owner tries it)

1. A new game: the letter says *Chapter 1 · Story 1*, the wizard walks up
   along the path, and the letter says only that you have no idea how to
   get in.
2. Make a girl wizard: the friend who comes up the path is the boy, with
   his name and his words; make a boy wizard in a new game: the friend is
   Nuri, with hers.
3. The wizard in the scene has the look chosen in the creator.
4. The guide has eight steps with the owner's words; the notebook's step
   points at the button and the panel; hint and the question mark are two
   steps; the last says that now we write the first instruction.
5. *Run* shows a quick spinner, no words, and the run plays.
6. In every level the round mark is seen and pulses, never under a tree
   or an arch; nothing is walked through a tree; the stone cannot be
   stood on; the castle's door glows while sealed.
7. The password is in the comment; the notebook's *Spells and words* tab
   lists *zelim* and *ambrel* with what they do, from the levels that
   taught them.
8. The texts say what section 2 asks: the letter, the gate, lessons 3
   and 4, the fix, the wand, up to the castle.
9. The course book reads as a child's story, with the friend's name and
   words right for both wizards.
