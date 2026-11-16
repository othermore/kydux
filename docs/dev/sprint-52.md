# Sprint 52 — The guide after the scene, and a flight at an even speed

On 2026-11-16, playing the game whole after sprint 51, the owner
gave three comments, in their words:

> En la verja, capitulo 1, practica 1, si se enciente el tutorial
> inicial que te enseña la pantalla, luego no se carga el panel
> que te dice lo que hay que hacer en ese nivel.
>
> En la última carrera no quiero que Zarek diga "Has jugado
> limpio". En su lugar debe decir "Solo has tenido suerte", es un
> personaje envidioso y no queremos que parezca bueno todavía.
>
> Y en el vuelo de escobas mientras se está volando hay una ligera
> sensación de que la escoba se mueve a "trompicones" de izquierda
> a derecha mientras avanza a la derecha, como si fuese frenandose
> y acelerando. Eso queda raro.

What is there today, comment by comment.

**The guide.** The first level's start card opens as soon as the
page is built, before the scene has loaded its pictures. A child
who presses *Empezar* at once gets the screen's guide (D68) over a
dark scene: its first step outlines a scene with nothing in it,
and its second, *Objetivos del nivel*, an empty place, for the
goals box takes its shape and is shown only once the scene has
drawn the level's start (D227). The guide ended, the box is still
missing until the scene arrives. On a fast load none of it shows:
with the scene there before *Empezar*, the box is in its place
during the guide and after it, in every window size tried, with
*Siguiente* to the end or with *Saltar*. The designer could not
make the box stay away for good; the slow load is the one way
found to see a guide and no goals box.

**Zarek.** In the race's last story, `story:the-finish`, Zarek
grants the wizard a clean flight and a shorter program than his.
The owner wants him envious still.

**The flight.** The scene draws every step of a figure as a move
of its own, nine tenths of its tick long and at an even speed,
and then the figure stands until the next tick. On foot the
stepping frames and the step's tap fill that rest. In the air a
cell takes a third of a walked one (D185), 133 ms at the playback's
own speed: the broom glides for 120 ms and stands for 13 and
whatever the timer adds, cell after cell, seven or eight times a
second. The camera follows the wizard with a lag of its own and
with rounded pixels, so on the screen the stops read as a broom
that is held back and let go again as it advances.

**What this sprint holds:**

1. The screen's guide opens once the scene and the goals box are
   on the screen (2.1, D258).
2. A flight glides at an even speed from its first cell to its
   last, the wizard's and the racers' (2.2, D259).
3. Zarek's line, in the owner's words. It is entered by the
   designer; nothing of it is left to build (2.3).

It is built after sprint 51, on the designer's last commit.

## 1. Decisions taken here

Their words are here; the programmer enters them in
`docs/dev/architecture.md` as it builds each.

- **D258 — The screen's guide opens once the screen it shows is
  there.** Decided 2026-11-16 from the owner's comment (*si se
  enciende el tutorial inicial que te enseña la pantalla, luego
  no se carga el panel que te dice lo que hay que hacer*). The
  guide of the first level (D68) opens when its start card is
  closed, the scene has drawn the level's start and the goals box
  has taken its shape and is shown (D227), whichever comes last.
  A card closed before the scene is there leaves the page as it
  loads, with no guide over it, and the guide opens by itself
  when the two are there; the box does not fold while the guide
  is awaited or shown. The same holds for *Enséñame la pantalla*
  (D248) pressed on the card of a page still loading. A guide
  that is open never outlines an empty place: each step that
  names a part of the screen finds it drawn. Rules out a guide
  over a dark scene, a step about the goals with no goals in
  sight, and a wait of its own length in place of the page's own
  word that the scene and the box are shown.

- **D259 — A flight glides: flown steps that follow one another
  are one move at an even speed.** Decided 2026-11-16 from the
  owner's comment (*la escoba se mueve a trompicones… como si
  fuese frenándose y acelerando*). A figure in the air that flies
  one cell after another, the wizard or a racer, crosses them
  without a rest between: from the first cell of a run of flown
  steps to its last, through the turns of its way and from one
  command to the next, its place on the screen advances by the
  same length in the same time, and it stands only where the
  program has it stand (a tick with no move, a bump, a landing,
  the run's end). The camera that follows it adds no shake of
  its own. A flown cell still takes a third of a walked one
  (D185); the trace, the ticks and the count are the world's and
  are untouched, as are the gust (D243), the lift and the
  landing (D244), the hover (D235, D242) and a walked step, which
  keeps its rest between steps under its frames and its tap.
  Paused, stopped, moved by the timeline or shown at once, the
  figure is on its cell as today. Rules out a move per cell
  shorter than its tick, a move per cell that eases in and out,
  and a flight made slower to hide the rests.

## 2. What is asked

### 2.1 The guide after the scene (D258)

Where it is. `app/src/ui/level.ts`: `showStart()` is called at the
end of the page's load, before the scene's handle is attached; the
card's close calls `showGuide()` at once when the guide has not
been seen, and `showGuide()` opens `openGuide(...)` whatever the
scene's state. The goals box is measured and revealed 400 ms after
the handle is attached (`takeShape`, `goals.reveal()`), and until
then it is not seen. `app/src/ui/guide.ts` holds the steps and
their targets; `app/e2e/guide.spec.ts` its tests.

What is built.

- The guide opens when three things are true: the card is closed,
  the scene's handle is attached and has drawn, the goals box is
  revealed. `guiding` is true from the card's close, so the box's
  three seconds (D227) start at the guide's end as today.
- While it waits, the page is the page as it loads: no veil, no
  outline, nothing new to read. The editor may take the focus;
  what the child types stays.
- A level left before the guide opened opens no guide (the page's
  `destroyed`), and the guide stays unseen (`progress.guided()`
  false) for the next visit.
- *Enséñame la pantalla* on the start card, and the card opened
  again with `?`, go by the same wait.

Tests, in `guide.spec.ts`:

- the pictures and the world held back by the test (a route that
  delays them), *Empezar* pressed at once: no `.guide` while the
  scene is not drawn; released, the guide opens, and at its second
  step the goals box is visible and holds the goal's words;
- the same guide gone through to its end: the goals box visible,
  not folded, and `data-revealed` true;
- the fast load as today, unchanged.

### 2.2 A flight at an even speed (D259)

Where it is. `app/src/engine/scene.ts`: `walk(sprite, facing, x,
y, duration)` adds one linear tween per step. The wizard's move
gives it `tickDuration * 0.9`, times `FLOWN` when flown; a racer's
move the same (`length`). Each step first puts the figure on its
`from` cell and starts anew. `app/src/engine/playback.ts` gives a
flown tick a third of the tick (`lengthOf`, `pace`), by a timer.
`app/src/engine/camera.ts` follows the wizard in a level with
`startFollow(wizard, true, 0.2, 0.2)`: a lag, and rounded pixels.

First the measure, before any change. A browser spec flies a
command of several cells (the first flight's water, or the rings)
and records, frame by frame, the time and the figure's place on
the screen, the camera counted. The report gives what it finds
today: how many frames of a flight the figure stands, and how far
its speed strays from its middle value. If the measure shows
another cause beside the rest between cells (the camera's
rounding against a figure that moves by parts of a pixel is the
one suspected), the report names it and the piece mends it too.

What is built.

- A flown step that follows a flown step of the same figure does
  not put the figure back and start anew: the move goes on from
  where the figure is, at the speed of one cell in one flown
  tick, and does not end before the next step can take it up. How
  it is done is the programmer's: one move per run of flown steps
  read ahead from the ticks, a move that outlasts its tick and is
  taken up by the next, or the figure's place computed from the
  playback's clock. The last flown step of a run ends on its
  cell, within a tenth of a tick of its time.
- The wizard and every racer alike; the two lanes of a race keep
  the same clock, so the figure that is ahead in the trace is
  ahead on the screen at every frame.
- The camera's follow in a flown level keeps its lag if the
  measure shows the figure even on the screen with it; it is
  changed only where the measure asks.
- Nothing of the world, the trace, the ticks' length, the sounds
  or the walked step changes. Pause holds the figure where the
  tick has it, as today; Stop, the timeline and a run shown at
  once put it on its cell.

Tests.

- A test of the part that says where a flying figure is at a
  time, apart from the drawing where the code allows it: across a
  run of flown cells the place is a straight line in time, with
  no flat part between cells, and it ends on the last cell.
- The measure's spec kept as a browser test with a bound a
  slow machine holds: between a flight's first and last cell no
  frame leaves the figure where the frame before had it, and it
  never goes back on the screen.
- The tests that fly today green as they are: `flight.test.ts`
  and `playback.test.ts`, and of the browser's, `chapter-4.spec.ts`
  and `sound.spec.ts`.

### 2.3 Zarek's line

Entered by the designer in `content/stories/the-finish/`, step 2:

| | Spanish | English |
|---|---|---|
| Zarek | Vale, vale. Solo has tenido suerte. La próxima vez no te dejaré ganar. | All right, all right. You just got lucky. Next time I won't let you win. |

*Solo has tenido suerte* is the owner's; the praise of the shorter
program goes with the praise of the flight, for the same reason.
The briefs under `tools/write/briefs/` keep what Gemini was asked
then. Nothing is left to build.

### 2.4 What the owner will try

1. A new game, up to the gate. *Empezar* pressed as soon as the
   card shows: the guide waits for the scene, and opens over the
   scene drawn. Its second step outlines the goals box, with
   *Camina hasta la verja* in it.
2. The guide to its end, or *Saltar*: the goals box is there.
3. Chapter 4, the first flight and the rings: the broom crosses
   the cells at one speed, with no pull and no push.
4. The race: Zarek's broom and the wizard's both glide.
5. The race's last story: Zarek says *Solo has tenido suerte*.

### 2.5 What is left out, and why

- **The narrow windows.** At 800 by 600 the guide's *Siguiente*
  falls outside the window after its second step, and at 800 wide
  or less a sliver of the tower shows beside the letter (sprint
  51's review). They are one piece of work on small windows, for
  a sprint of its own.
- **The story page's words on a change of language** (four words
  keep the old one, sprint 51's review): small, and not asked.
- **Another cause of the missing goals box.** If the owner sees
  it missing again after this sprint, with the scene drawn, the
  window's size and what was pressed are asked for then.

## 3. The pieces

One local commit each, in order.

### 3.1 The guide after the scene (D258, 2.1)

The wait in `level.ts`, the tests of 2.1 in `guide.spec.ts`; D258
entered, and D68, D227 and D248 brought to it where they say when
the guide opens. `ci/check.sh` and `guide.spec.ts`, with
`start.spec.ts`, `cards.spec.ts` and `level.spec.ts`, green.

### 3.2 The measure, then the glide (D259, 2.2)

The measure first, its numbers kept for the report; then the
glide, the tests of 2.2; D259 entered, and D185, the events'
table (`move`, `fly`) and the header of the files touched brought
to it. `ci/check.sh`, `chapter-4.spec.ts`, `sound.spec.ts` and
`camera.spec.ts` green.

### 3.3 The whole check and the report

`ci/check.sh --e2e` whole, once, in a copy. The report in
Spanish, in `drafts/`, with the five steps of 2.4; the measure's
numbers before and after, in a small table and in plain words;
pictures of the current commit: the guide's second step over the
scene with the goals box outlined, and the page after the guide.
The memory note `kydux-sprint-52-state`, and the prompt for the
designer's review.

## 4. Gemini

Nothing is asked of Gemini.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

First, a notice about the commits. The owner wants no
Co-Authored-By trailer in any Kydux commit, from now on and
whatever your harness suggests. The commits not yet on GitHub were
rewritten on 2026-11-16 to take the trailer out: every hash after
origin/main (7c97ec2) changed. Sprint 51's are 86bef87, a766169,
4870782 and ecfb7be; the old-to-new map is
drafts/commit-map-2026-11-16.txt. Throw away any copy or worktree
made before and copy the tree anew; never bring an old hash back
(no cherry-pick, no reset to one). Before you end, this must print
0:
  git log origin/main..HEAD --format=%B | grep -ci co-authored

This is sprint 52, a small one, from three comments of the
owner's. Build it on the last commit of main as you find it.

Read: docs/dev/sprint-52.md (this plan, whole), D68, D227, D248,
D185 and D243 in docs/dev/architecture.md, app/src/ui/level.ts
(showStart, showGuide, the goals box's reveal), app/src/ui/guide.ts
with app/e2e/guide.spec.ts, app/src/engine/scene.ts (walk, the
wizard's and a racer's move), app/src/engine/playback.ts,
app/src/engine/flight.ts, app/src/engine/camera.ts, and the memory
notes kydux-checks-per-piece, kydux-report-images-current and
kydux-no-co-authored-by.

1. The guide (D258). In the gate, the first level, the owner saw
the screen's guide and then no goals box. What reproduces: the
start card opens before the scene has loaded; Empezar pressed at
once opens the guide over a dark scene, its second step outlines
an empty place, and the box is missing until the scene arrives.
The guide must open only once the card is closed, the scene has
drawn the level's start and the goals box is shown. Tests with a
held-back load.

2. The flight (D259). The owner sees the broom advance by fits and
starts, as if braking and speeding up. Every step is a move of its
own, 0.9 of its tick, and then a rest; a flown tick is a third of
a walked one, so the broom stops seven or eight times a second,
and the camera follows with a lag and rounded pixels. Measure it
first, frame by frame, on the screen; then make flown steps that
follow one another one glide at an even speed, the wizard's and
the racers'; the measure stays as a test. If the measure shows
another cause too, name it and mend it.

3. Zarek's line in the finish is changed already by the designer
(Solo has tenido suerte). Leave it.

Build pieces 3.1 to 3.3 in order, one local commit each; before
each commit ci/check.sh and the browser specs the piece touches
green, and the whole ci/check.sh --e2e once before the last, in a
copy with Playwright's own server on 4173 and the app built anew
in that copy; never a push, never a timer, never a deploy. Never
stop or build into the servers on ports 443 and 5173, and stop
your own preview when you are done. Nothing under .github/
changes. Nothing is asked of Gemini.

What the owner will look for:
(1) a new game, Empezar pressed as soon as the gate's card shows:
    the guide opens over the scene drawn, never over a dark one;
(2) the guide's second step outlines the goals box with its goal
    in it, and after the guide, ended or skipped, the box is there;
(3) in the first flight and the rings the broom crosses the cells
    at one speed, with no pull and no push;
(4) in the race both brooms glide, and the one ahead in the count
    is ahead on the screen;
(5) nothing else of the flight changed: a third of a walked step,
    the gust, the lift, the landing, the hover.

The plan gives the decisions' words: enter them as they are. Where
it does not decide (how the page says the scene has drawn, how the
glide is made, the bound of the browser test), take the smallest
choice that keeps its intent and say it in the commit. Do not
build what section 2.5 leaves out. Never edit content while a
browser run is going. Every document and comment in the present.
Before git add, read git diff of each file and stage only your own
hunks.

docs/dev/sprint-52.md and the finish's two text files are the
designer's and are committed already; leave them as they are.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.3 asks, with the owner's five steps of 2.4, the measure's
numbers before and after, and the pictures. Write your memory note
kydux-sprint-52-state, and end with the prompt for the designer's
review in English, in a code block.
```
