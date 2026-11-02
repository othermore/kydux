# Sprint 23 — The night seen: the lights go out, the wizard sleeps, the morning comes

The owner asked for it on 2026-10-29, after reading the chapter 2
document before their acceptance test: when the wizard lies down in
*Your bed*, the level ends with a card at once, and the night is never
seen. The owner wants the lights to go out, the wizard seen asleep for a
moment, and the day to come back before the card. One piece, 23.1, and
the hand-over. It is built before the owner's acceptance test of chapter
2 and before chapter 3, which is sprint 24.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit, never a push, never a timer (nothing is pushed before
Friday 2026-10-30, and then only with `ci/push.sh`); every word for the
player through `t()` or a content file; nothing forbidden and nothing
secret; documents and comments in the present (CLAUDE.md); reports show
only pictures of the current commit. Section 4 is the Gemini budget,
section 5 the owner's acceptance test, section 6 the hand-over, section 7
the prompt.

## 1. Decisions taken here

- **D124 — Going to sleep is seen: the lights go out, the sleeper is
  seen, the morning comes.** Decided 2026-10-29 by the owner. When a
  level is won by the wizard going to sleep (a `sleep` goal), the card
  waits: once the wizard lies in the bed, the night falls over the whole
  scene, a dark blue that leaves the sleeper and the room faintly seen,
  the wizard is seen asleep for a moment with a small thought of sleep,
  and then the dark lifts into a warm morning light that stays on the
  scene until the level is left; only then the card shows. A story that
  plays in the morning on a scene painted at night opens under that same
  morning light (`light` in its staging). The times are the page's own,
  not the run's speed. Rules out a win card over a wizard who has just
  lain down in the dark, and a morning story told on a night scene with
  no light of morning.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| In *Your bed* the card shows the moment the wizard lies down; the night is not seen, nor the morning. | `celebrate()` returns 0 for a wizard asleep (D84), and the outcome shows at once; the page has no light but the dark room of D52 (`darkness`, under the rows) and the dark passages' tint (D100). | 23.1 (D124). |
| *The morning* says "the bright morning light comes in at the window" on the night painting. | The dormitory is painted at night (its only painting, D84); the story has no light of its own. | 23.1: the story opens under the morning light. |

## 3. The piece

### 23.1 The night and the morning (D124)

**The light over the scene** (`app/src/engine/scene.ts`, a small module
`app/src/engine/light.ts` for the colours and times). A rectangle the
scene's size at a depth over every row and figure and under the speech
(`lightDepth`, `depth.ts`: `overDepth + 1`), `this.light`, with a colour
and an alpha: `night` is `(20, 28, 60)` at alpha 0.55; `morning` is
`(255, 214, 150)` at alpha 0.18; `none` is alpha 0. It is drawn at the
camera's whole view (fixed to the camera, `setScrollFactor(0)`, sized to
the viewport on every resize), so that the zoom and the drag never show
its edge. `data-light` on the scene's node says `none`, `falling`,
`night`, `dawning` or `morning`, for the tests.

**The sequence on a win by sleeping.** `celebrate()` for a wizard asleep
(`dataset.sleeping`) no longer returns 0: it returns the sequence's whole
length, `NIGHT_FALL_MS` 1200 + `NIGHT_HOLD_MS` 2000 + `DAWN_MS` 1500, and
plays it with the page's timers, after the lying-down tween has ended
(`layDown` resolves a promise, or the sequence starts `tickDuration ×
1.1` after the sleep event, the tween's length): the light fades from
`none` to `night` over `NIGHT_FALL_MS` (`falling`); holds `night` for
`NIGHT_HOLD_MS`, with a thought over the sleeper's head, the text
`level.sleeping` through `t()` ("z z z" in both languages, the thought
bubble of `speech.ts`), cleared when the dawn begins; then fades to
`morning` over `DAWN_MS` (`dawning`), and stays `morning`. The outcome
card waits for `celebrate()` as it does now (`controller.ts` 14.3). A
restart, a run, or leaving the level sets the light to `none` and clears
the thought; the timers are dropped as a cast's are (`stopCast`). A win
in a story (`options.story`) keeps returning 0. The dark room of D52
(`darkness`) and the dark passages (D100) are untouched.

**The morning story.** `story.json` takes an optional `light`
(`"morning"`); `kydux_world.level.story_on_scene` accepts it; the scene
sets the light on load and keeps it through every step, `Back` and
`Again` included. `content/stories/the-morning/story.json` says
`"light": "morning"`. No other story changes.

**Tests.** `app/src/engine/light.test.ts`: the sequence's states and
times on a fake clock (the light's colour and alpha at the end of each
phase; `none` after a reset). Browser tests (`app/e2e/chapter-2.spec.ts`
or `levels.spec.ts`): *Your bed* won with its solution: `data-light` goes
`falling`, `night`, `dawning`, `morning` in order, the outcome card is
absent while `night` and present after `morning`; a screenshot at
`night` (`night.png`) and one at `morning` with the card
(`morning-light.png`), 1440 × 900, Spanish, the girl wizard with the look
`teal`; *The morning* story opens with `data-light` `morning`
(`story-the-morning-1.png` shows it). The i18n check holds `level.
sleeping` in both languages.

**Documents.** `docs/dev/architecture.md`: D124 (this commit, section 1
above); D84's sentence "a wizard asleep is not woken to celebrate" says
the night is seen instead (D124); the parts list names `light.ts`.
`docs/dev/story.md` or `course.md` where the stories' staging keys are
listed, if a list exists: `light`. All in the present.

## 4. Gemini images

None. Texts: one word ("z z z"), too small to brief.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug`, in a private window, as a girl with
the look `teal`:

1. `#level/your-bed`: run the solution. The wizard walks to the trunk and
   lies down. The room goes dark and blue, the torches dimmed with it;
   the wizard is seen asleep with a small "z z z"; the dark lifts into a
   warm morning light; then the card appears. About five seconds in all,
   the same at every speed.
2. *Jugar otra vez*: the night is back to the painting's own light before
   the run.
3. `#story/the-morning`: from its first step the room is under the
   morning light, and it stays so through *Atrás* and *Otra vez*.
4. `#story/the-first-night`: no morning light; the night painting as it
   is.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the night and the morning in *Your bed* (the two
screenshots), the morning story's first step, the commit's hash and the
state of `ci/check.sh --e2e`, what differs from this plan and why, and the
prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-23.md (this plan), D52, D84, D91, D100 and D124 in
docs/dev/architecture.md, and the memory notes kydux-two-agents,
kydux-sprint-22-state and kydux-designer-review-22. Build sprint 23:
piece 23.1 as one local commit, ci/check.sh --e2e green before it,
never a push, never a timer (nothing is pushed before Friday
2026-10-30, and then only by the owner with ci/push.sh). Never stop or
build into the servers on ports 443 and 5173, and never kill a vite,
node or nginx process of the owner's (CLAUDE.md); a vite preview on
4173 is a leftover of a check run. No Gemini image. The plan decides
everything; where it does not, the owner does, through the designer.
Every document and comment in the present. Before git add, read git
diff of each file and stage only your own hunks; commit promptly. Hand
over what section 6 asks, and end with the prompt for the designer's
review.
```
