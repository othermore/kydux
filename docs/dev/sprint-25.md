# Sprint 25 — Chapter 2 after the owner's last acceptance test: the lamp over every head, the spell's order, the friend out from behind the shelf

The owner's acceptance test of chapter 2 (2026-10-31, on commit eda1b91)
found three things: in the entrance the chandelier's lower part is drawn
behind the children who walk under it; in *The high shelf* the book is
seen given to Eldra before it has reached the wizard's hands; and in *The
wand bank* the friend appears out of nothing instead of walking out from
behind the high shelf. Three pieces, no Gemini image, before the owner's
next pass. Chapter 3 is sprint 26.

The rules of the earlier sprints hold: `ci/check.sh --e2e` green and one
local commit a piece, never a push, never a timer (the owner pushes with
`ci/push.sh`); every word for the player through `t()` or a content file;
nothing forbidden and nothing secret; documents and comments in the
present (CLAUDE.md); a chosen painting is mended in boxes, never painted
again (D88); reports show only pictures of the current commit. Section 4
is the Gemini budget, section 5 the owner's acceptance test, section 6
the hand-over, section 7 the prompt.

## 1. Decisions taken here

- **D95, a sentence more** (in `architecture.md`, this commit): a thing
  that hangs above every head, a chandelier, is `over`, drawn over every
  figure of the scene as a wall seen from above is; `hangs` is for what
  hangs on a wall at a figure's height, a torch, drawn as its row's.
- **D127 — A spell's pull is seen in order: the light, then the thing to
  the hands, then the hands.** Decided 2026-10-31 by the owner. When
  *fendra* takes a thing, the light leaves the wand and flies to the
  thing; only when the light reaches it does the thing leave its place,
  and it flies to the wizard's hands, where it stays seen, held, until
  the tick ends; the pick-up of a thing already in the hands shows the
  wizard's hands close on it with no second rise; and a give starts from
  the hands, after the pick-up has ended. Every step waits for the one
  before. Rules out a book that lands at the wizard's feet before the
  light has reached it, and a hand-over that begins while the book is
  still on its way.
- **D128 — A figure in a story may step out from behind a thing.**
  Decided 2026-10-31 by the owner. A story's `appear` may say `from`, a
  cell next to the one the figure appears on, which no one walks (a shelf,
  a counter) or which something covers: the figure is drawn walking out
  of it onto its cell over the step's tick, behind what stands there, and
  the world has it on its cell from the step's start. Rules out a figure
  that comes out of nothing where the scene has a thing to come out from
  behind.

## 2. What the owner found, and where it is fixed

| Finding | Cause | Where |
|---|---|---|
| Entrance: the chandelier's lower part is drawn behind the children walking under it. | `lamp` is `under` on row 13: over figures on rows 10 to 13, under a figure on row 14, whose head overlaps the lamp's lowest candles (its box ends at 14.0). | 25.1: `over`. |
| *The high shelf*: the book is given before it reaches the hands. | At the cast's tick the page starts the book's flight at once (0.9 tick, to the wizard's tile, under the figure) while the spell's light takes 1.5 ticks; the pick-up lifts and fades it; the give draws it from the hands. The order on the screen is book, light, bend, book again. | 25.2 (D127). |
| *The wand bank*: the friend appears suddenly. | `appear` fades the figure in on its cell (10,5); the high shelf is ground, so no cell beside it hides a figure. | 25.3 (D128): the high shelf cut as a static thing (a polygon, no Gemini), the friend drawn walking out from behind its right end. |

## 3. The pieces

### 25.1 The chandelier over every head

`art/scenes/the-entrance/cut.json`, `lamp`: `over: true`, no `under`,
row 13 as it is; the export writes it into `row-13-static-over.webp`
(as the front walls are, `overDepth`). The entrance exported again, its
sweep green (nobody is hidden by it on the carpet: the sweep counts a
figure under the lamp as covered, as before, on rows 10 to 13 and now on
14 too; the commit says the cells), `s25-the-entrance.png` kept. In the
game, *The entrance* step 7: the two walk up the carpet under the lamp
and their heads pass behind its candles. Screenshot `s25-lamp.png`.

### 25.2 The spell's order (D127)

`app/src/engine/scene.ts`. The `pull` of a cast's tick waits for the
light: `castLight` gives how long its flight takes to the thing
(`LIGHT_MS`, the share of the LONG tick it uses now); the thing's tween
starts then, from its place to the wizard's hands, the point the give
starts from now (`wizard.x`, `wizard.y − 16`), over the rest of the LONG
tick less a tenth, at the depth in front of the wizard; the glowing
`pulled` texture crossfades as now at the flight's start. The thing
stays there, seen, held. At `pick_up` of a thing that is in the hands
(the pull's target this run, kept in a set `inHands`), the image does not
rise: it fades where it is over the pick-up frames' last third, the
wizard's `pickup` frames as now. A `pick_up` of a thing on the floor is
as now. The give starts from the hands as now, at its own tick, which the
playback paces after the pick-up's LONG. A seek (`instant`) puts the
thing where the tick leaves it (in the hands, or gone). Unit test of the
timings on the fake clock where the scene's drawing can be tested, else a
browser test on *The high shelf* at speed 1 that reads `data-drawn` and
`data-carried` at three moments: after 0.5 tick of the cast the book is
still on the shelf; after the cast's tick the book is drawn at the
wizard's hands and not carried; after the pick-up it is carried and not
drawn. Screenshots `s25-cast-light.png` (the light on its way, the book
on the shelf), `s25-cast-hands.png` (the book at the hands), `s25-give.
png` (the book on its way to Eldra), at speed 1.

### 25.3 The friend walks out from behind the shelf (D128)

**The high shelf cut.** `art/scenes/the-library/cut.json`: a static
thing `shelf_high`, the tall bookcase along the top aisle's back wall,
columns 4 to 10, rows 3 to 5, cut by a polygon traced with `trace.py
look` on its outer outline (the top board, both sides, the bottom board
on the floor; 8 to 14 points), `row` 5, `under: true` (over a figure on
row 5 behind it, under row 6's), its hole for `rare_book`'s cut-out as
D93 gives (the book lying at 7,3 stays seen, and the pulled book flies
in front of it, its depth the destination's). The library exported again,
its sweep green, the states sheet and the all-cells sheet as before (no
cell walked changes), `s25-the-library.png` kept.

**The story.** `content/stories/the-wand-bank/story.json`, step 5: the
friend's `do` is `[{"appear": [10, 5], "from": [9, 5]}, {"face": "down"},
{"by": "wizard", "face": "up"}]`. `kydux_world.level.story_on_scene`
accepts `from` on an `appear`: a cell next to the figure's, on the map
(a shelf or floor), and places the figure on its cell as now; the page
(`scene.ts`, `showActor` for `appear`) draws the figure at `from`'s
point, behind what stands there, and walks it to its cell over the
tick's length, facing the way it goes, then faces as the step says; with
no `from`, the fade as now. Nothing of her shows before she steps out:
`export_scene.py check` composes the friend's figure at `from`'s point
behind `shelf_high` and counts the pixels of her seen (0 expected; the
hat's top lies about 1.7 cells under the shelf's top board); if any
shows, the point she is drawn from is lowered (`lowered` on that cell,
D95) until none does, and the commit says the count. Tests: the staging accepts `from` next to
the cell and refuses it two cells away or off the map; a browser test
on *The wand bank* step 5 that `data-actors` holds the friend at 10,5
after the step and a screenshot mid-step (`s25-friend-steps-out.png`)
shows her half out from behind the shelf.

**Documents.** D127 and D128 (this commit); `docs/dev/architecture.md`'s
events table says `appear`'s `from`; `art/README.md` says a tall
bookcase a figure comes out from behind is a static thing with `under`.

## 4. Gemini images

None. Texts: none.

## 5. Acceptance test (for when the owner tries it)

On `https://localhost:5173/?debug`, in a private window, as a girl with
the look `teal`:

1. `#story/the-entrance`, step 7: the two walk up the carpet; their heads
   go behind the chandelier's candles, never over them.
2. `#level/the-high-shelf` at speed 1: the light leaves the wand and
   reaches the book; the book then flies down to the wizard's hands and
   stays there; the wizard bends and the book is in hand; only then it
   floats to Eldra.
3. `#story/the-wand-bank`, step 5: the friend walks out from behind the
   right end of the high shelf into the gap before the counter, no fade.
4. The rest of chapter 2 as `drafts/uat-capitulo-2.es.md` says.

## 6. What the implementer hands over

A report in Spanish, one thing after another, each explained for a reader
who does not know the code, and then its picture, only pictures of the
final commit: the lamp over the two (the screenshot), the spell's three
moments, the friend stepping out; the commits with their hashes and the
state of `ci/check.sh --e2e`; what differs from this plan and why; and
the prompt for the designer's review.

## 7. The prompt for CLAUDE-programmer

```
Read /home/other/Projects/kydux/CLAUDE.md and .claude/working-model.md,
then docs/dev/sprint-25.md (this plan), D47, D74, D89, D93, D95, D103,
D127 and D128 in docs/dev/architecture.md, art/README.md ("The rules for
the cut-outs"), and the memory notes kydux-two-agents,
kydux-sprint-24-state, kydux-designer-review-24 and
kydux-uat-7-chapter-2. Build sprint 25: pieces 25.1 to 25.3, one local
commit each, ci/check.sh --e2e green before each, never a push, never a
timer (the owner pushes with ci/push.sh). Never stop or build into the
servers on ports 443 and 5173, and never kill a vite, node or nginx
process of the owner's (CLAUDE.md); a vite preview on 4173 is a
leftover of a check run. No Gemini image: the high shelf is cut by a
polygon traced by hand. The plan decides everything; where it does not,
the owner does, through the designer. Every document and comment in the
present. Before git add, read git diff of each file and stage only your
own hunks; commit promptly. Hand over what section 6 asks, and end with
the prompt for the designer's review.
```
