# Sprint 52 — The guide before the card, and a flight at an even speed

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

The designer read the first as a goals box that fails to show,
and the owner set it right the same day, and gave Zarek's line
anew:

> El problema no es que no salga la tarjeta del nivel en la
> practica 1, es que sale antes del tutorial, luego ves el
> tutorial y se te ha olvidado el nivel. Hay que poner el tutorial
> primero y luego pasar a la tarjeta que dice lo que tenemos que
> hacer en ese nivel.
>
> La frase de zarek vamos a cambiarla de nuevo. Quiero que diga:
> No puede ser. Estoy seguro de que has hecho trampas, Kydux.
> ¡Pienso devolvertela!

What is there today, comment by comment.

**The guide.** The first level's start card opens with the page
and tells the level: what Teku says, and the goal. *Empezar*
closes it and, the first time, opens the screen's guide (D68),
eight steps about the parts of the screen. At their end the child
is before the level with the card's words eight steps behind.
There is a second fault under it: the card opens before the scene
has loaded its pictures, so on a slow load the guide opens over a
dark scene and its second step, *Objetivos del nivel*, outlines an
empty place, for the goals box is shown only once the scene has
drawn the level's start (D227).

**Zarek.** In the race's last story, `story:the-finish`, Zarek
grants the wizard a clean flight and a shorter program than his.
The owner wants him envious still: he cries foul.

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

1. In the first level the screen's guide comes first, over the
   scene drawn, and the start card after it (2.1, D258).
2. A flight glides at an even speed from its first cell to its
   last, the wizard's and the racers' (2.2, D259).
3. Zarek's line, in the owner's words. It is entered by the
   designer; nothing of it is left to build (2.3).

It is built after sprint 51, on the designer's last commit.

## 1. Decisions taken here

Their words are here; the programmer enters them in
`docs/dev/architecture.md` as it builds each.

- **D258 — In the first level the screen's guide comes first, and
  the start card after it.** Decided 2026-11-16 by the owner (*hay
  que poner el tutorial primero y luego pasar a la tarjeta que
  dice lo que tenemos que hacer en ese nivel*): a child who reads
  the card and then the guide's eight steps has forgotten the
  card. The first time the first level opens, no start card opens
  with the page. The guide (D68) opens by itself once the scene
  has drawn the level's start and the goals box has taken its
  shape and is shown (D227), so that every step outlines a part
  that is there. Ended or skipped, it gives way to the start card
  (D248), and the level starts from the card's *Empezar*. The
  guide once seen, the card opens with the page as in every
  level. *Enséñame la pantalla* on the card closes the card,
  shows the guide, waiting the same way on a page still loading,
  and opens the card again after it. Nothing is run while the
  guide is awaited or shown, and the goals box does not fold
  until the card after it is closed. Rules out a card read before
  the guide, a guide over a scene not drawn, a step about the
  goals with no goals in sight, and a wait of its own length in
  place of the page's own word that the scene and the box are
  shown.

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

### 2.1 The guide first, the card after (D258)

Where it is. `app/src/ui/level.ts`: `showStart()` is called at the
end of the page's load, before the scene's handle is attached; the
card's close calls `showGuide()` when the guide has not been seen,
and `showGuide()` opens `openGuide(...)` whatever the scene's
state; the guide's `onClose` marks it seen and gives the focus to
the editor. The goals box is measured and revealed 400 ms after
the handle is attached (`takeShape`, `goals.reveal()`), and until
then it is not seen. `app/src/ui/cards.ts`: `showScreen(onGuide,
close)` closes the card and plays the guide. `app/src/ui/guide.ts`
holds the steps and their targets; `app/e2e/guide.spec.ts` its
tests.

What is built.

- The first level, the guide not yet seen: the page opens with no
  start card. The guide opens when the scene's handle is attached
  and has drawn and the goals box is revealed. While it waits the
  page is the page as it loads: no veil, no outline, nothing new
  to read, and nothing can be run.
- The guide's end, by its last *Siguiente* or by *Saltar*, marks
  it seen and opens the start card, the card of a first opening,
  with *Empezar*. The card's close gives the focus to the editor
  and starts the goals box's three seconds (D227), as today.
- The guide seen: the card opens with the page, as in every
  level.
- *Enséñame la pantalla* (D248): the card closes, the guide plays
  under the same wait, and the card opens again after it, as a
  card opened again (*Continuar*).
- A level left before the guide opened opens no guide, and the
  guide stays unseen for the next visit.
- The guide's own words and steps do not change.

Tests, in `guide.spec.ts`:

- a new game at the gate: the guide opens with no start card on
  the page; at its second step the goals box is visible and holds
  the goal's words; after its last step the start card is open
  with Teku's words and the goal; *Empezar* closes it, and the
  goals box is visible, not folded, `data-revealed` true;
- the same with *Saltar* at the first step: the card opens;
- the pictures and the world held back by the test (a route that
  delays them): no `.guide` and no card while the scene is not
  drawn; released, the guide opens;
- the gate opened again, the guide seen: the card with the page,
  and no guide;
- *Enséñame la pantalla*: the guide, and the card again after it.

The specs that open the gate in a new game and press *Empezar*
first are brought to the new order.

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

- Spanish: *No puede ser. Estoy seguro de que has hecho trampas,
  {wizard}. ¡Pienso devolvértela!*
- English: *It can't be. I'm sure you cheated, {wizard}. I'll get
  you back for this!*

The Spanish is the owner's, with the wizard's own name where the
owner, who plays with the default one, wrote *Kydux*. The briefs
under `tools/write/briefs/` keep what Gemini was asked then.
Nothing is left to build.

### 2.4 What the owner will try

1. A new game, up to the gate: the guide comes first, over the
   scene drawn, with no card before it. Its second step outlines
   the goals box, with *Camina hasta la verja* in it.
2. The guide to its end, or *Saltar*: the level's card opens, with
   what Teku says and the goal, and *Empezar* starts the level.
3. The gate opened again: the card at once, no guide. *Enséñame
   la pantalla* on it: the guide, and the card again.
4. Chapter 4, the first flight and the rings: the broom crosses
   the cells at one speed, with no pull and no push.
5. The race: Zarek's broom and the wizard's both glide.
6. The race's last story: Zarek says the wizard cheated.

### 2.5 What is left out, and why

- **The narrow windows.** At 800 by 600 the guide's *Siguiente*
  falls outside the window after its second step, and at 800 wide
  or less a sliver of the tower shows beside the letter (sprint
  51's review). They are one piece of work on small windows, for
  a sprint of its own.
- **The story page's words on a change of language** (four words
  keep the old one, sprint 51's review): small, and not asked.
- **A sign that the scene is loading**, for the moment the first
  level waits with no card: the page's own *Preparando Python…*
  is what there is. If the wait reads as a page that hangs, the
  report says so and a later sprint gives it a sign.

## 3. The pieces

One local commit each, in order.

### 3.1 The guide first, the card after (D258, 2.1)

The order and the wait in `level.ts` (and `cards.ts` where
*Enséñame la pantalla* asks), the tests of 2.1 in `guide.spec.ts`,
the other specs brought to the order; D258 entered, and D68, D227
and D248 brought to it where they say when the guide and the card
open. `ci/check.sh` and `guide.spec.ts`, with `start.spec.ts`,
`cards.spec.ts`, `level.spec.ts` and every spec that plays a new
game through the gate, green.

### 3.2 The measure, then the glide (D259, 2.2)

The measure first, its numbers kept for the report; then the
glide, the tests of 2.2; D259 entered, and D185, the events'
table (`move`, `fly`) and the header of the files touched brought
to it. `ci/check.sh`, `chapter-4.spec.ts`, `sound.spec.ts` and
`camera.spec.ts` green.

### 3.3 The whole check and the report

`ci/check.sh --e2e` whole, once, in a copy. The report in
Spanish, in `drafts/`, with the six steps of 2.4; the measure's
numbers before and after, in a small table and in plain words;
pictures of the current commit: the guide's first step with no
card, its second with the goals box outlined, and the card that
opens after it.
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
(showStart, showGuide, the goals box's reveal), app/src/ui/cards.ts
(showScreen), app/src/ui/guide.ts with app/e2e/guide.spec.ts,
app/src/engine/scene.ts (walk, the wizard's and a racer's move),
app/src/engine/playback.ts, app/src/engine/flight.ts,
app/src/engine/camera.ts, and the memory notes
kydux-checks-per-piece, kydux-report-images-current and
kydux-no-co-authored-by.

1. The guide (D258). In the gate, the first level, the start card
tells the level and then the screen's guide plays: after its eight
steps the child has forgotten the card. The owner wants the guide
first and the card after it. The first time, no card opens with
the page; the guide opens by itself once the scene has drawn the
level's start and the goals box is shown (today it can open over a
dark scene, its second step round an empty place); ended or
skipped, it gives way to the start card, and Empezar starts the
level. The guide once seen, the card opens with the page as today.
Enséñame la pantalla: the guide, then the card again.

2. The flight (D259). The owner sees the broom advance by fits and
starts, as if braking and speeding up. Every step is a move of its
own, 0.9 of its tick, and then a rest; a flown tick is a third of
a walked one, so the broom stops seven or eight times a second,
and the camera follows with a lag and rounded pixels. Measure it
first, frame by frame, on the screen; then make flown steps that
follow one another one glide at an even speed, the wizard's and
the racers'; the measure stays as a test. If the measure shows
another cause too, name it and mend it.

3. Zarek's line in the finish is changed already by the designer,
in the owner's words (he says the wizard cheated). Leave it.

Build pieces 3.1 to 3.3 in order, one local commit each; before
each commit ci/check.sh and the browser specs the piece touches
green, and the whole ci/check.sh --e2e once before the last, in a
copy with Playwright's own server on 4173 and the app built anew
in that copy; never a push, never a timer, never a deploy. Never
stop or build into the servers on ports 443 and 5173, and stop
your own preview when you are done. Nothing under .github/
changes. Nothing is asked of Gemini.

What the owner will look for:
(1) a new game, at the gate: the guide first, with no card before
    it, over the scene drawn, never over a dark one; its second
    step outlines the goals box with its goal in it;
(2) the guide ended or skipped: the level's card opens, and
    Empezar starts the level; the gate opened again: the card at
    once and no guide;
(3) in the first flight and the rings the broom crosses the cells
    at one speed, with no pull and no push;
(4) in the race both brooms glide, and the one ahead in the count
    is ahead on the screen;
(5) nothing else of the flight changed: a third of a walked step,
    the gust, the lift, the landing, the hover.

The plan gives the decisions' words: enter them as they are. Where
it does not decide (how the page says the scene has drawn, what
keeps Run from running while the guide is awaited, how the glide
is made, the bound of the browser test), take the smallest
choice that keeps its intent and say it in the commit. Do not
build what section 2.5 leaves out. Never edit content while a
browser run is going. Every document and comment in the present.
Before git add, read git diff of each file and stage only your own
hunks.

docs/dev/sprint-52.md and the finish's two text files are the
designer's and are committed already; leave them as they are.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.3 asks, with the owner's six steps of 2.4, the measure's
numbers before and after, and the pictures. Write your memory note
kydux-sprint-52-state, and end with the prompt for the designer's
review in English, in a code block.
```
