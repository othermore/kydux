# Sprint 15 — Chapter 2: the entrance, the dormitory and the library

The owner's design of chapter 2 (2026-10-26, `drafts/chapter-2/capitulo-2.md`,
in Spanish, with its images beside it) shapes this sprint: three scenes,
seventeen stops, and the rules the owner gave that day for every chapter
from here on (`docs/dev/course.md`, *How a level earns its idea*;
`art/README.md`, *What surrounds a scene*). The chapter enters the game
whole: its paintings cut and exported, its world features, its levels
and stories placed, its texts from Gemini, its tests, its documents.
Chapter 3 waits for the story's hook to be refined (section 4).

The pieces, in this order: 15.1 to 15.8. The rules of the earlier sprints
hold: pieces in order, `ci/check.sh --e2e` green and one local commit per
piece, never a push, every word for the player through `t()` or a content
file, nothing forbidden and nothing secret, documents and comments in the
present (CLAUDE.md), Gemini writes every text the child reads from a
brief. The design document is the truth for what the chapter contains;
this document says how it is built. Where the two differ, this one wins,
and the difference is said in the commit. At most eight Gemini images in
the sprint, for retries of the edits Fable made; the edits themselves are
done (section 5). Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D84 — The castle's entrance hall and the first-year dormitory are
  scenes.** `the-entrance` holds one story and no level: its map marks
  the carpet and the hall's floor walked on, so that a story's figures
  stand and walk on it, and nothing in it opens or is picked up.
  `the-dormitory` holds one level and two stories: a common room with a
  door below and an arched opening into each dormitory; the wizard's
  dormitory is always the right-hand one, whoever the wizard is, and the
  other dormitory's arch refuses the wizard with a thought of their own
  (`blocked` with reason `not_my_dormitory`, worded by the wizard's
  gender, as the other thoughts are), while actors pass it. A bed is a
  thing of kind `bed`, `free` or not; `wizard.sleep()` is an action that
  takes a tick beside a free bed and refuses elsewhere (`reason:
  no_bed`); a goal of kind `sleep` names the bed. Rules out mirroring the
  painting by gender: the scene is one picture, and what changes is who
  stands where and what the arch says.
- **D85 — A thing lies where the level says, and may be hidden and
  shown.** A thing's picture is cut from the painting where it is
  painted (the painting edited without it, as before), and the page
  draws it at the cell the level gives, which need not be the painted
  one: a key behind Eldra's armchair, a key in a different place in each
  way of a level (D51), a book on a lower shelf. A cell a cut-out covers
  wholly may hold a thing and be walked on, as a crown's cell is; the
  sweep lists such cells and the content test allows a thing there when
  the level says `hidden: true`. `thing.reveal()` is an action of a tick
  that shows the thing's outline through what covers it, the page's
  silhouette (`silhouette.ts`) made for any sprite and switched on by a
  `reveal` event until the thing is picked up. Rules out a second
  painting of the key in each place, and a world where what is hidden is
  absent.
- **D86 — `thing.distance_to(other)` is the steps between two things or
  figures.** The number of cells along the row or the column when the
  two share one, else the sum of both; an integer, never negative. On
  anything with a position: a thing, the wizard, an actor. Rules out a
  float distance, which a child cannot walk.
- **D87 — The story has a hook.** The story bible's *The wizard's way*
  is rewritten (from Gemini's draft, `tools/write/briefs/chapter-2-story-hook.md`,
  reviewed by Fable): chapter 2 ends at dusk with the rumour of the
  passages; in chapter 3 the children overhear that an "accident" is
  planned on the training field; in chapter 4 they prevent it; in chapter
  5 the familiar finds who did it. Chapters 3 to 5 keep their lessons;
  their levels are refined chapter by chapter before each is painted, by
  the rule of `course.md`, *How a level earns its idea*.

## 2. What the design leaves to build

- Two new scenes and one repainted (the library): their pictures are in
  `art/raw/` (section 5), edited by Fable; their maps, settings, cuts,
  exports and sweeps are this sprint's.
- World features: `sleep`, `bed`, `not_my_dormitory`, `reveal`,
  `distance_to`, a thing at a cell other than the painted one; D51's
  `ways` already exists and the moving key uses it as it is.
- Figures: Ilda, Wenna, Eldra, the wand bank's parent (if the owner names
  them; else a counter alone), and the mate, who is Nuri or Teku already
  drawn.
- Seventeen stops: five stories, five lessons, seven levels, with every
  text from Gemini.

## 3. The pieces

### 15.1 The story bible, the course and the chapter

- `docs/dev/story.md`: *The wizard's way* replaced by the reviewed draft
  (`drafts/chapter-2-story-hook/docs/dev/the-wizards-way.en.md`, read and
  corrected first); the places table gains the entrance hall and the
  dormitory; the characters table gains whoever the draft adds, under the
  names rule, or the row is dropped and said in the commit.
- `docs/dev/course.md`: chapter 2's section rewritten to the seventeen
  stops of the design document's section 4, with the world features it
  needs; the count updated.
- `content/chapters/02-the-library/chapter.json`: the stops in order,
  ids: `story:the-entrance`, `story:the-first-night`, `level:your-bed`,
  `story:the-morning`, `story:at-the-library`, `lesson:what-things-know`,
  `lesson:finding-things`, `level:the-lost-book`, `lesson:keys-and-doors`,
  `level:the-hidden-key`, `lesson:the-distance`, `level:the-moving-key`,
  `level:the-wrong-order`, `lesson:fendra`, `level:the-high-shelf`,
  `level:eldras-book`, `story:the-wand-bank`. The chapter's title stays
  *The library*. Old items (`the-reading-room`, `which-way`,
  `the-locked-door`, `the-archive`, `a-name-for-a-value`,
  `in-the-castle`) are removed with their folders, briefs and tests.
- Check: `ci/check.sh`; the course book regenerated.

### 15.2 The world

In `world/kydux_world/`, with tests in `world/tests/`:

- `bed` kind, `free`; `wizard.sleep()`; goal `sleep` (`{kind: "sleep",
  bed: id}`), met when the wizard slept beside that bed; the `sleep`
  event for the page.
- The map character for an arch the wizard may not pass: `scene.json`
  names the cells (`forbidden: [[x, y], ...]` with a `reason`); a step
  into one is `blocked` with `reason: not_my_dormitory`; actors pass.
- `thing.reveal()`: an event `reveal` with the thing's id; a goal `uses`
  covers it.
- `thing.distance_to(other)` on things, actors and the wizard (D86).
- A thing may be `hidden: true` in `level.json`: the world treats it as
  any thing; the page draws it covered. `find_nearest` finds it as any
  thing in sight: sight is the map's, not the painting's.
- The API table (`kydux_world.api`) and the notebook's words for `sleep`,
  `reveal`, `distance_to`, `bed.free`.
- Check: `world/tests`, `test_api_table`, the i18n dynamic names.

### 15.3 The page

In `app/src/`:

- A thing drawn at its level's cell (D85): `painted.ts` places a thing's
  sprite by the cell the level gives, its foot on that cell's row, the
  painted `box` used only for the cut; `fendra`'s `pull` moves the sprite
  by cells the same way.
- `silhouette.ts` made for any sprite: the wizard's as now, and a thing's
  on `reveal`, beating until the thing is picked up; `data-revealed` on
  the scene names the things shown, for the tests.
- `sleep`: the wizard lies down beside the bed (a row of the sheet if
  `figures.json` has one, else the figure turned down and lowered, as the
  pick-up's last frame) and the win card after it, as `celebrate` does.
- The `not_my_dormitory` thought through `blockedText`, with the
  gendered words from i18n.
- The entrance scene in a story: a scene with no level loads as the
  stories' scenes do (`scene_maps.py` gives the story its map).
- Check: Vitest for the placement and the distance; e2e in 15.7.

### 15.4 The three scenes' art

For each scene, `art/scenes/<id>/cut.json` and `manifest.toml` as the
field's, `tools/art/export_scene.py <id>`, the sweep green, and the check
pictures looked at before the commit:

- **`the-entrance`** (story only): grid from `art/raw/image-first-entrance/`;
  the map marks the carpet and the floor walked on, the pillars, benches
  and armour not; no things; night thresholds in `cut.json`.
- **`the-dormitory`**: pictures in `art/raw/game-dormitory/` (the border
  fixed, the grid removed); the map: the common room, the two
  dormitories, the arches, beds and trunks not walked on, the cell beside
  each bed walked on; things: eight beds (`bed_1` … `bed_4` in each
  dormitory, named left to right), the mate's bed not free; the other
  arch's cells `forbidden`; night thresholds.
- **`the-library`**: pictures in `art/raw/game-library/` (the border
  fixed, the grid removed, the edits without the keys, the glowing book,
  the lost book, and with each of the three doors open); the map from
  the painting; things: `wenna_door` (the partition's, open from the
  start of every level), `centre_door`, `room_door` (Eldra's), `vault_door`
  (locked, never opened), `key` cut once and placed by each level,
  `old_book`, `rare_book`, `eldras_book`; the cell behind the armchair
  walked on and covered; indoor thresholds. Where the painting's cut
  breaks a rule, the painting is edited again (the budget) or the map
  marks round it, and the sweep decides.
- Figures: Ilda, Wenna, Eldra and the parent from `tools/art/prompts/`
  as the friends were (`figure-*.md`), four ways and three frames each,
  through `tools/art/figures.py`; the ghost floats as the existing rule
  says.
- Check: `test_art_content` for every scene; `all-<scene>.png` and
  `sweep-<scene>.png` looked at; the owner's `?debug` view opens each.

### 15.5 The levels and the stories

- `content/levels/<id>/level.json` for the seven levels, each with
  `scene`, `start`, `end` or a `give`/`sleep` goal, `things`, `actors`
  (the mate standing by in every level from `your-bed` on; Wenna in the
  library's; Eldra where she is given), `carrying` the wand, `api`,
  `goals` with their bonuses, `tick_limit`; `the-moving-key` with three
  `ways` (the key at 3, 5 and 7 cells left of the start) and the mark at
  the start; `the-hidden-key` with the key `hidden: true` behind the
  armchair; `the-wrong-order` and `the-moving-key` with their given
  programs. Each level starts where the one before ended, as the design
  document places them on the painting; the exact cells from the map.
- `solution.py` and three or more `wrong/` programs a level, by the
  course's rule; `the-moving-key`'s wrong programs include the given one
  and one with the number typed.
- `content/stories/<id>/story.json` for the five stories: the entrance
  (Ilda, the wizard, the friend), the first night (the common room, the
  friend leaving through the left arch), the morning (the wizard's
  dormitory, both leaving through the door), at the library (Wenna
  opening her door and leading to the hall), the wand bank (Eldra
  leaving, the parent, the friend); the camera on who speaks (D74).
- `tools/scene_maps.py` builds each level's and story's map from its
  scene, as for the field.
- Check: `ci/check.sh`; `tests/project` for the levels' placement.

### 15.6 The texts

Briefs in `tools/write/briefs/`, one a kind, as sprint 12's for chapter 2
(`chapter-2-lessons.md`, `-levels.md`, `-stories.md`) are the model:

- the five stories, step by step, with their staging;
- the five lessons, Wenna's voice, each with its *Try it* on the scene;
- the seven levels: intro, outro, goals, hints, the given programs'
  comments; `your-bed`'s intro is the meeting with the mate, by gender;
- the new words: the arch's thought (two genders), `sleep` and `reveal`
  and `distance_to` in the notebook, the `sleep` goal's words, the bed in
  the thing words;
- English and Spanish, the same keys; every draft read, corrected and
  moved into `content/` or `i18n/`; the course book regenerated and read.
- Check: `ci/check.sh` (i18n keys, forbidden words, the course book).

### 15.7 The tests, the debug view and the pictures for the owner

- Playwright, `app/e2e/chapter-2.spec.ts`: every level won with its
  solution at speed 4, in Spanish for a girl wizard and in English for a
  boy; the other arch refused with its thought; `sleep` ends `your-bed`;
  the hidden key's `reveal` shows `data-revealed`; `the-moving-key` won
  in its three ways; each story played to its end; the map's stops in
  order. Screenshots of every stop to `app/e2e/shots/chapter-2/`, each
  scene zoomed out once, for the owner.
- The sweep's sheets for the three scenes in `art/raw/game-check/`.
- Check: `ci/check.sh --e2e` green.

### 15.8 Documents, and the prompt for the review

- `docs/dev/architecture.md`: D84 to D87 in the decision log; the module
  map; the world's API lines; the events table (`sleep`, `reveal`).
- `art/README.md`: the three scenes under *Where things are kept*; the
  figures added; the prompts' names.
- `content/art/scenes/<id>/SOURCE.md` for each scene; `docs/dev/
  dev-environment.md` if a step changes.
- The report in Spanish, and **the prompt for Fable's review**: a
  Markdown block the owner pastes to Fable, naming the commits in order,
  what differs from this plan and the design document and why, what was
  corrected by hand, the Gemini images spent, the check sheets and the
  screenshots to look at, and what is left open.

## 4. What this sprint leaves out

- Chapter 3's levels rewoven round the hook, and its scenes; chapters 4
  and 5 likewise: each refined with the owner before it is painted.
- The vault's level: the vault stays locked, for a challenge.
- `fendra`'s reach stays three cells; the rare book is drawn on the
  lower shelf (the design document's choice until the owner says five).
- The bed's `free` asked by the child (`print(bed.free)`): the mate says
  which bed is free; the attribute exists for a later lesson.

## 5. What the owner brings

- The design document and its answers to section 7 of it: the entrance
  painting, the name and figure of the wand bank's parent, who moves the
  key, `fendra`'s reach. Where an answer is missing, the design document's
  proposal stands.
- The pictures, edited by Fable on 2026-10-26: `art/raw/image-first-entrance/`
  (the hall with its grid), `art/raw/game-dormitory/` (`-border`, `-nogrid`),
  `art/raw/game-library/` (`-border`, `-nogrid`, `-nokeys`, `-nobook`,
  `-nooldbook`, `-partition-open`, `-centre-open`, `-room-open`); the
  prompts in `tools/art/prompts/`. Gemini paints the whole picture again
  on every edit: an edit differs from its source by a noise of mean 9 to
  12 (of 255) everywhere, with 1.5 to 4 % of the pixels over the cut's
  threshold of 70, so each thing is cut inside its own box only
  (`box_mask`), never from the whole difference, and the border edit is
  the base every later edit is measured against. The library's entrance
  came out of its border edit as a single door, not the double door the
  painting had; it stays unless the owner asks for the double door back
  (one edit from `game-library-border.md`, the budget). There is no
  floors-only edit indoors: the raised furniture is marked by the map and
  cut by its outline, or a floors-only edit is asked (the budget).

## 6. How the implementer works

As in sprint 14 (sprint-14.md, section 6): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`15.3: the page draws a thing where the level says`), never a push, no
timers; the development server left running (a build no longer breaks
it); what this document leaves open decided the simplest way and said in
the commit; what turns out wrong done the working way and logged in
`architecture.md`; every text the child reads from Gemini through a
brief; every scene exported looked at in `art/raw/game-check/all-<scene>.png`
before the commit; the design document read in full first, in Spanish.
At the end, the report in Spanish and the prompt for Fable's review
(15.8). Fable reviews, fixes the small things, and shows the owner every
screen as pictures; the owner tests with `?debug` (dev-environment.md),
and the findings become the next sprint; `ci/push.sh` runs only when the
owner says the chapter is stable.

## 7. Acceptance test (for when the owner tries it)

On `https://hija.local:5173/?debug`, a new game as a girl and again as a boy:

1. **The entrance.** After chapter 1's last story, the hall at night:
   Ilda welcomes the first-years and leads the way out through an arch;
   the camera follows who speaks.
2. **The first night.** The common room; the friend goes through the
   left arch. In the level, `wizard.move_left(…)` into the left arch is
   refused with the thought about the other dormitory; the right arch
   passes; the mate stands by their bed and speaks in the intro;
   `wizard.sleep()` beside the free bed wins, and beside another bed or
   in the common room it refuses.
3. **The morning.** The story in the right-hand dormitory; both leave
   through the door below.
4. **At the library.** Wenna opens the partition's door and leads to the
   hall; the mate is there in every level after.
5. **The lost book.** `find_nearest("book")` finds the book on the rug
   from the hall's right; `give` to Eldra wins; the bonus star asks for
   `find_nearest`.
6. **The hidden key.** No key in sight; `find_nearest("key")` finds it;
   `reveal()` draws its beating outline through the armchair; picked up
   from beside; `door.open()` beside the centre door; through to the top
   aisle.
7. **The moving key.** Run once: the key at three places, one after the
   other, and the given program fails in two of them; the solution with
   `distance_to` wins all three; the bonus refuses a typed number.
8. **The wrong order.** The given program fails at `door.open()` from
   afar; moved below the walk, it wins.
9. **The high shelf and Eldra's book.** `fendra` from below the glowing
   book brings it down three cells; the rare book picked up; Eldra's book
   from her room, given.
10. **The wand bank.** The story at the aisle's end; the chapter closes
    at dusk with the rumour; the map shows chapter 3's first stop open.
11. In `?debug`, every scene's cells and masks look right; the sweep's
    sheets show no figure cut wrong.

## 8. The prompt for Opus

```
Read /home/other/Projects/kydux/CLAUDE.md, then docs/dev/sprint-15.md
(this plan), then drafts/chapter-2/capitulo-2.md (the owner's design, in
Spanish, with its images beside it), then docs/dev/sprint-14.md section 6
and docs/dev/course.md ("How a level earns its idea") and art/README.md
("What surrounds a scene"). Build chapter 2 whole: pieces 15.1 to 15.8 in
order, one local commit per piece, ci/check.sh --e2e green before each,
never a push, never a timer. Gemini writes every text the child reads,
from briefs in tools/write/briefs/; you read, correct and move them in.
The paintings and their edits are in art/raw/ (sprint-15.md section 5);
you map, cut, export and sweep them, and look at every check picture.
Decide what the plan leaves open the simplest way and say it in the
commit. At the end, give the owner a short report in Spanish and the
prompt for Fable's review (section 15.8). Reply to the owner in Spanish;
code, comments, commits and documents in English, in the present tense.
```
