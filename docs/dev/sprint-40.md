# Sprint 40 — What the review of sprint 39 left

The designer's review of sprint 39 (2026-11-11, `drafts/uat-capitulo-4.es.md`
for the owner) accepted chapter 4, the music, the look and the portraits,
corrected the texts and the wizard's landing in a story by hand, and left
to this sprint what needs the tools, the page or a scene exported again.
The owner is away this week and tests through the designer's documents
with captures; nothing is released until the owner is happy with chapter
4 (no deploy, no tag). This sprint is small and holds only corrections;
chapter 5 comes in its own sprint once its design is approved.

The rules of the earlier sprints hold: pieces in order, one local commit
each, `ci/check.sh` and the browser specs a piece touches green before
it, the whole `ci/check.sh --e2e` once before the last commit; never a
push, never a timer; the servers on 443 and 5173 untouched, the owner's
preview on 4174 left alone; documents and comments in the present.

## 1. Decisions taken here

- **D195 — The map folds by chapter.** Decided 2026-11-11 by the designer
  under the owner's rule for the look (D193: clean, nothing crowded). The
  map shows each chapter as its card (its scene's strip and title); the
  chapter the wizard is in stands open, with its stops listed as now; a
  chapter finished is folded under its card with its stars' total and a
  line *Abrir* that unfolds it; a chapter still locked is folded and
  greyed, its first stop named. A chapter's fold is remembered while the
  page lives, not kept. Rules out a map that scrolls through every stop
  of every chapter to reach today's.

## 2. The pieces

### 40.1 The figures and the portraits

- The wizard's flying bases (`art/figures/wizard-fly-boy.webp`,
  `wizard-fly-girl.webp`) cleaned of their magenta rim with
  `off_magenta_rim` at depth 2, and the sixteen sheets made again
  (`figures.py`); the fringe measured on `figures-check.png` under 0.25 %
  of a flying frame's pixels, as the walking rows'.
- Zarek's flying row facing down (`zarek` sheet, `fly` row, the `down`
  way) shows the broom: its handle ahead of him and the twigs behind, as
  the wizard's does, the arm on the handle and not raised. One Gemini edit
  of the standing drawing's down view on the broom (`figure-zarek-fly.md`
  asked again for that way only, or the whole flying sheet again), 1
  image, +1 retry.
- The sand look's portrait band: the recolouring of the hat's band by
  parts leaves blotches where the band's pixels are classed as hat;
  `figures.py portrait_parts` takes the band by its row range within the
  hat, as the sheets' recolouring does, and the eight look portraits are
  made again; `portraits.png` looked at.
- Check: `ci/check.sh`; `app/e2e/wizard.spec.ts` and the chapter-4 spec's
  flight tests.

### 40.2 The field scenes' static cuts and the stories' camera

- `the-ring-field` and `the-race-course`: the trees' crowns at the sides
  and the clump's, the posts and the stand marked and cut as static things
  (`cut.json`), the scenes exported again, the sweep green: a figure walks
  behind a crown or a post whole or hidden only by it. Needed by any story
  told at their edges (La meta's Rinlo by the gate stands beside the
  hedge today).
- A story's `camera` on a wide scene may say `"wide": true`: the page
  frames the story's part zoomed out to show the whole lawn's width that
  fits (as the field's wide shot), and zooms back to follow at the next
  step with a camera; `the-finish`'s first step takes it, so that the race
  course and the stand are seen as Zarek lands.
- Check: `ci/check.sh`; `tests/project` (placement against the cut-outs);
  the chapter-4 spec's stories.

### 40.3 The notebook, and a joint beside an arch

- The notebook's words gain `def` (a function of your own, its arguments)
  and `len` (how many values a list has) as entries of their own, in
  `i18n/<lang>.json`, Claude's; `test_api_table` and the i18n names.
- The rim: a wall joint parallel to an arch's outer side for half a cell
  (the way down's `arch_low`, the crossing's `arch_mid`): `rimmed` drops a
  dark run that lies within two pixels of, and parallel to, the cut-out's
  own outline for more than a quarter of a cell; the two scenes exported
  again, the doors' sheets looked at. If no rule tells it from the outline
  in an hour's work, the piece says so and stops: it is harmless.
- Check: `ci/check.sh`.

### 40.4 The map folded by chapter (D195)

- `ui/map.ts`: the chapter cards as D195 says; `data-folded` on a folded
  chapter; the current chapter found from the progress; *Abrir* / *Open*
  and *Plegar* / *Fold* in `i18n`; the look's tokens; a Vitest test on the
  folding; the e2e `16-map.png` taken again.
- Check: `ci/check.sh`; `app/e2e/loop.spec.ts`.

### 40.5 The report

A report in Spanish with the pictures of the final commit (the figures'
sheet's tail, the portraits, the two field scenes' sweeps, the map folded
and unfolded, a story's wide shot), the commits, the images spent
(against the chapter's 50 and the look's 30), what differs and why, and the prompt for the
designer's review.

## 3. Gemini images

Two at most (Zarek's flying row), within the chapter's budget (26 of 50
spent).

## 4. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux. Read
first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-40.md (this plan, whole), docs/dev/sprint-39.md (what
you built last), drafts/uat-capitulo-4.es.md (the designer's review of
it, in Spanish, section 10 above all), and the memory notes
kydux-two-agents, kydux-sprint-39-state, kydux-designer-review-39 and
kydux-checks-per-piece. Build sprint 40 whole: pieces 40.1 to 40.5 in
order, one local commit each; before each commit ci/check.sh and the
browser specs the piece touches green, and the whole ci/check.sh --e2e
once before the last commit; never a push, never a timer, never a
deploy: the owner is away and nothing is released until they are happy
with chapter 4. Never stop or build into the servers on ports 443 and
5173, leave the owner's preview on 4174 alone, and stop your own
preview when you are done. Gemini paints at most 2 images, named in
their commits. The plan decides everything; where it does not, take the
smallest choice that keeps its intent and say it in the commit. Every
document and comment in the present. Before git add, read git diff of
each file and stage only your own hunks; commit promptly. Hand over a
report in Spanish as section 2's 40.5 asks, and end with the prompt for
the designer's review in English, in a code block.
```
