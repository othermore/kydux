# Sprint 47 — A flight that stands still when the program does, a broom that hovers slowly, a wind that comes and goes, a thought after its bump, one letter for the code and larger tips

On 2026-11-15 the owner read chapter 4 to its end and wrote what they
saw, in their words:

> Cuando se para con parar, se debe parar el sonido del juego (no la
> música) y se debe parar las animaciones. Ahora mismo se queda
> vibrando el que está volando. Al ir para atrás con la barra
> deslizadora de abajo también se ven las escobas vibrando muy
> rápido. Debería quedarse detenido.
>
> Sin embargo cuando va volando y queramos que se pare (por ejemplo
> si hacemos wizard.wait(5)) debe verse moviéndose oscilando un poco
> arriba y abajo, pero mucho más despacio. El sprite que estoy usando
> (mago hombre color naranja) al menos, creo que está mal y produce
> esa vibración. El de Zarek si que parece que se mueve mejor.
>
> El mensaje de giré demasiado pronto tiene que salir un poco después
> del choque, no a la vez, y debe estar más arriba, para no tapar al
> personaje.
>
> En cap 4 historia 3 página 5, cuando dice (Al borde del campo,
> junto a la cancela, apartado de la clase), no se ve al niño al
> borde, hay que mover la cámara para que se vea.
>
> El sonido de la escoba no me gusta, suena como si fuese el sonido
> de barrer o de algún tipo de ventilador, debería sonar como algo
> mágico que vuela. Mucho más suave y más recordando al sonido del
> viento. Lo ideal es que sonase de forma intermitente, por ejemplo
> cuando se hacen los giros que se intensifique como si se acercase
> el sonido y luego se volviese a alejar.
>
> El comentario en el programa que dice
> # La pareja de aros está escrita tres veces. ¡Dale un nombre!
>
> Debe decir:
> # Las instrucciones para pasar por una pareja de aros se repiten
> tres veces igual. ¡Crea una función para no repetirlo!
>
> De fuente dejemos por defecto inconsolata a 16, que está bien.
>
> Las capturas de los tips estaría bien que se viesen un poco más
> grandes, son un poco pequeñas.

The designer looked for the cause of each before planning it.

- **The flying figure that vibrates.** The page shows a flying row's
  three frames in turn, each for 160 ms, by the scene's own clock: a
  640 ms beat of jumps of 3 pixels of the art, a pixel and a half of
  the scene, which no state of the program stops. The slider plays
  the run again from its first tick at every move of the hand, and
  each time the beat starts again from its first frame: so the
  brooms shake fast while it is dragged.
- **The orange wizard.** The tool makes a wizard's three flying
  frames, 3 pixels apart, and then scales the whole sheet to the
  figures' size (0.82): each frame is scaled from another place on
  the grid, and comes out a slightly different picture, its edges
  and its inner lines apart. The three in turn shimmer. Zarek is
  scaled first and moved after: his three frames are one picture
  moved, and he only goes up and down. Every look of the wizard has
  it, not the orange one alone.
- **The sound after Stop.** The wind stops when the broom lands and
  when a run starts again, and at nothing else: a program stopped in
  the air leaves it blowing. Every other effect is one short sound.
- **The broom's sound.** Noise through a wide band round 700 Hz, as
  loud all the flight long: a fan. And at every flown cell, a third
  of a tick, a short swell: at eight swells a second, a sweeping.
- **The thought at the bump.** The scene says the thought in the
  same call that plays the bump and nudges the figure. And the
  thought is put over the place the figure's feet have on the
  ground, a figure's height above it; a flying figure is drawn half
  a cell higher, and inside a ring 0.85 cells higher, so the cloud
  lies on its head and its hat.
- **The story of the finish.** Its first step asks for the whole
  width of the race course and every later step keeps it: Rinlo, by
  the gate, is at the picture's right edge, a few pixels tall.
- **The tips' pictures** are 640 by 360 and shown 560 pixels wide.

What this sprint holds:

1. A flying figure is drawn in its level frame alone and the page
   moves it: a slow rise and fall, four times slower than the beat it
   replaces and smooth. It hovers only while the program plays:
   stopped, paused, ended or moved with the slider, a flight stands
   still (D235).
2. The broom's wind is heard only while the program plays, and is
   another sound: soft low air that wanders, almost silent while the
   broom hovers, a little more in straight flight, and at each turn
   a swell that comes near and goes away, with a faint high shimmer
   in it. The owner hears each part of it, and sets it, under
   `?debug` (D236).
3. A thought that tells of a bump comes half a second after the
   bump, and the words over a flying figure are over the figure as it
   is drawn (D237).
4. Inconsolata at 16 is the code's only letter; the other candidates
   and their chooser go (D238).
5. The tips' pictures are 960 by 540 and shown up to 800 pixels wide
   (D239).

Two of the owner's eight are done by the designer, in commits of
their own before this plan (2.6): the story of the finish frames the
gate from its fifth step, and the comment of *Los aros* is the
owner's sentence.

The rules of the earlier sprints hold: pieces in order, one local
commit each, `ci/check.sh` and the browser specs a piece touches green
before it, the whole `ci/check.sh --e2e` once before the last commit;
never a push, never a timer, never a deploy; the servers on 443 and
5173 untouched; documents and comments in the present; every text
the child reads is Gemini's or the owner's own.

## 1. Decisions taken here

All are entered in `docs/dev/architecture.md` with this plan; D185
and D188 are brought to D235 and D236, D223 to D238.

- **D235 — A flying figure hovers slowly, moved by the page, and
  only while the program plays.** The owner's, 2026-11-15 (*se debe
  parar las animaciones*; *debe verse moviéndose oscilando un poco
  arriba y abajo, pero mucho más despacio*). A flying figure is drawn
  in its flying row's level frame, and the page moves it up and down
  by a sine: 2.4 seconds a rise and fall, 0.05 cells each way, every
  figure at a place of its own in it so that two racers do not rise
  together, and none inside a ring's cell, whose hole is tight
  (D232). The hover has a clock of its own, which runs while the
  playback plays and in a story always: a program stopped, paused,
  ended or moved with the slider shows the flight still, where the
  clock stands. Under reduced motion there is no hover. Rules out a
  hover made of drawn frames, a hover on the scene's clock, and a
  figure that moves in a picture of a tick.
- **D236 — The broom's wind is soft air that swells at a turn, and
  is heard only while the program plays.** The owner's, 2026-11-15
  (*debería sonar como algo mágico que vuela. Mucho más suave y más
  recordando al sonido del viento*; *cuando se hacen los giros que se
  intensifique como si se acercase el sonido y luego se volviese a
  alejar*; *se debe parar el sonido del juego (no la música)*). The
  wind is low filtered noise whose band wanders slowly, almost silent
  while the broom hovers and a little louder while it flies on. At
  the lift and at every turn, a flown move whose way is not the way
  of the flown move before it, it swells: louder and higher for half
  a second, then back over a second, with two faint high tones in
  the swell. No flown cell makes a sound of its own. The wind blows
  while the playback plays and the wizard is in the air, and fades
  at once when the playback stops, pauses or ends; the music goes
  on. Under `?debug`, `#music` plays the wind at rest, in straight
  flight and in a turn, with a box and a slider for each of its two
  voices. Rules out a wind as loud all the flight long, a swell at
  every cell, and a wind over a program that does not play.
- **D237 — A thought about a bump comes after the bump, and words
  over a flying figure are over it as it is drawn.** The owner's,
  2026-11-15 (*tiene que salir un poco después del choque, no a la
  vez, y debe estar más arriba, para no tapar al personaje*). Every
  thought the wizard thinks with the bump's sound (a friend in the
  way, a high cell, a ring's side, a ring flown against its way, a
  ring's rim, `drevo` over a cell no one walks on) shows half a
  second after the bump, and its reading time (D175) counts from
  when it shows; the card waits for it as for any word. A thought or
  a bubble over a figure in the air is placed over the figure as it
  is drawn: higher by the flight's lift and by a ring's raise.
  Rules out a thought in the bump's own frame and words laid on a
  flying figure.
- **D238 — Inconsolata at 16 is the code's only letter.** The
  owner's, 2026-11-15 (*de fuente dejemos por defecto inconsolata a
  16, que está bien*), closing D223. The editor and every piece of
  code the page shows are set in Inconsolata, and a new child's
  editor is at 16; the sizes stay 14, 16, 20 and 24. No other face
  is bundled, and nothing chooses a face. Rules out a letter chosen
  in the settings.
- **D239 — A tip's picture is 960 by 540 and shown as large as the
  window lets.** The owner's, 2026-11-15 (*estaría bien que se viesen
  un poco más grandes*). Each is taken at twice the page's pixels,
  made 960 by 540, a webp of less than 90 KB; the waiting view shows
  it up to 800 pixels wide, and never so large that the view
  scrolls. Rules out a picture enlarged beyond its own pixels.

## 2. What is asked

### 2.1 The hover (D235)

**The page.** `app/src/engine/flight.ts`:

- `BOB_MS`, `BOB_CELLS`, `bobOf` and the cycle of `flyFrame` go.
  `flyFrame(flyRow, facing)` gives the flying row's level frame,
  `(flyRow + ROW[facing]) * 3`, or null for a sheet with no flying
  rows.
- `HOVER_MS = 2400`, `HOVER_CELLS = 0.05`.
- `hoverPhase(id)`: where in its rise and fall a figure is at the
  clock's zero, from 0 to 1: 0 for the wizard, and for any other
  figure the sum of its id's character codes modulo 8, over 8
  (`zarek`: 0.625).
- `hoverOf(ms, phase)`: `sin((ms / HOVER_MS + phase) * 2π) *
  HOVER_CELLS`, in cells, positive upward.

`app/src/engine/scene.ts`:

- The scene keeps `hoverMs`, a count of milliseconds. `update` takes
  Phaser's `delta` and adds it to `hoverMs` while
  `this.playback.state === 'playing'` or the scene tells a story
  (`this.options.story`). Nothing else changes it: not a restart,
  not a seek, not a lift. It never runs under reduced motion
  (`this.still`).
- `flyFrames` sets each flyer's level frame and lifts it by
  `FLY_LIFT + ring.raise + hover`, where `hover = hoverOf(hoverMs,
  hoverPhase(id)) * (1 - ring.raise / RING_RAISE)`: whole outside a
  ring's cell, none at its middle. A figure with no flying rows
  hovers the same, in its standing frame. The shadow stays on the
  ground, as it is.
- The flyers' record loses `since`. It gains `raise`, the ring's
  raise of this frame, which 2.3 reads.
- The scene's parent says `data-hover`: `hoverMs` rounded to a whole
  number, written when it changes. A test reads from it that the
  hover stands.

A step under way when Stop is pressed ends on its cell, as a walked
one does: a figure never stands between two cells.

**The sheets stay as they are.** Their flying rows keep three frames
and the page draws the first. `tools/art/figures.py` is not touched
(2.7).

**Tests.**

- Vitest, `flight.test.ts`: the level frame by the way faced;
  `hoverOf` is 0 at the clock's zero for the wizard, `HOVER_CELLS` a
  quarter of `HOVER_MS` later, and back after `HOVER_MS`; Zarek's
  phase is not the wizard's; the two tests of the bobbing go.
- Browser, `chapter-4.spec.ts`, in *El primer vuelo* with

  ```python
  wizard.move_right(8)
  wizard.cast("drevo")
  wizard.wait(60)
  ```

  While it plays and `data-flying` names the wizard, `data-hover`
  read twice, 400 ms apart, grows. Stop pressed: `data-state` is
  `done`, `data-flying` still names the wizard, and `data-hover`
  read twice, 500 ms apart, is the same number. The same after the
  slider is moved back to a tick of the flight (`paused`), and it
  grows again once Play is pressed.
- Browser, the story `the-flying-lesson` at a step with a figure in
  the air: `data-hover` grows while the step's words are read.
- Under reduced motion `data-hover` stays 0 through a flight.

**The documents.** `architecture.md`: the events table's row `fly`,
and line 57's *lifted and bobbing*. D185 and D188 are brought by
the designer with this plan. The headers of `flight.ts` and of
`scene.ts` (`data-hover`).

### 2.2 The wind (D236)

**When it blows.** One method of the scene decides, called when the
playback's state changes, at a lift and at a landing: the wind blows
when the state is `playing`, the wizard is among the flyers and the
tick shown is not an instant one; else it does not. So:

- Stop, pause, the run's end, the slider: the wind fades in 0.15 s.
  The music is not touched.
- Play pressed on a paused run whose wizard is in the air: the wind
  starts again, with its 0.4 s rise and no swell.
- A landing fades it in 0.6 s. A restart cuts it in 0.02 s.
- In a story, the wind of a step's flight fades when the step is
  told.

`data-wind` is `on` exactly while it blows. `wind` is among
`data-sounds` once for each lift heard, as it is.

**The sound**, `app/src/engine/sound.ts`, the class `Wind`:

```
noise (2 s, looped) → bandpass → lowpass → level → swell → air ─┐
two sines ─────────────────────────────────→ shimmer → tones ───┴→ out → destination
```

| Part | What it is |
|---|---|
| bandpass | 380 Hz, Q 1.4. A sine of 0.23 Hz moves its frequency 60 Hz up and down, all the while: the air wanders. |
| lowpass | 1800 Hz: no hiss. |
| `level` | 0.008 while the broom hovers; 0.02 while it flies on. |
| `swell` | 1 at rest; 2.2 at a swell's height. |
| the two sines | 1568 Hz and 2349 Hz, a fifth apart. |
| `shimmer` | 0 at rest; 0.004 at a swell's height. |
| `air`, `tones` | each voice's mix: 1 unless the debug page sets it (below). |
| `out` | 0.0001 to 1 in 0.4 s at the start; back to 0.0001 at the stop, in the time the stop is given. |

Its calls:

- `start()`: builds the chain and raises `out`. The scene calls
  `swell()` after it at a lift, and not when a paused run goes on.
- `fly(seconds)`, at each flown move of the wizard: `level` goes to
  0.02 (`setTargetAtTime`, time constant 0.08 s) and is set to fall
  back to 0.008 from `seconds + 0.2` after now (time constant
  0.3 s). The next flown move cancels that fall and sets its own: a
  straight flight holds one level, with no beat of the cells.
- `swell()`, at a lift and at a turn: on `swell`, on the bandpass's
  frequency and on `shimmer`, each from where it is now, a straight
  ramp in 0.45 s to its height (2.2; 760 Hz; 0.004), then back to
  its rest (`setTargetAtTime` from the height's moment, time
  constant 0.37 s: back within about 1.1 s). A turn inside a swell
  starts from where the swell is.
- `stop(seconds)`: `out` falls in `seconds`, the sources stop after
  it, the context is let sleep (D231) as it is today.

The mix is `windMix` in `sound.ts`: `{ air: { on, volume }, tones:
{ on, volume } }`, each `on` and `1` when the page loads, never
kept; a voice off or at another volume sets its mix's gain, at once
if the wind blows.

**A turn**, `flight.ts`: `turned(before, now)`, true when `before`
is a way and is not `now`. The scene keeps the way of the wizard's
last flown move, none after a lift, a landing and a restart, and at
each flown move of the wizard calls `this.wind.fly(seconds)` and,
when it turned, `this.wind.swell()`. The scene's parent says
`data-wind-swells`: how many swells this run has had, 0 at a
restart, counted with the tick shown and so the same when the
slider replays it.

**The debug page**, `app/src/ui/themes.ts`, `?debug#music`, under
the themes: *The broom's wind* (*El viento de la escoba*), with four
buttons and a mixer made as the themes' is.

- *At rest*: the wind for 4 s, hovering.
- *Flying on*: 4 s of flown moves, one each 133 ms.
- *A turn*: 1.5 s of flown moves, a swell, 2.5 s more.
- *A flight*: a lift, 12 moves, a turn, 8 moves, a turn, 12 moves, a
  landing.
- The mixer: `air` and `tones`, each a box and a slider from 0 to 3
  by 0.1, and the line that says the mix in words, for the owner to
  copy into their answer. *As written* puts both back.

Its other labels are the debug page's, in `debug.music.*` of both
languages, the programmer's own: too small to brief.

**Tests.**

- Vitest, beside the tests of `sleep.test.ts`: the wind keeps the
  context awake while it blows and lets it sleep after its fade;
  `fly` schedules `level` and never `swell`; `swell` schedules the
  three; a voice turned off has its mix at 0.
- Vitest, `flight.test.ts`: `turned`.
- Browser, `chapter-4.spec.ts`: in *El primer vuelo*'s solution
  `data-wind-swells` ends at 1, the lift's (its flight is one
  straight line); in *Los aros*'s solution it ends at one more than
  its turns, which the test counts from the run's flown `move`
  events. With the program of 2.1: `data-wind` is `on` while it
  plays in the air, `off` half a second after Stop with
  `data-flying` still naming the wizard, `off` after the slider is
  moved, `on` again after Play.
- Browser, `?debug#music`: the four buttons and the mixer are
  there; a voice's box unticked is said by the line.

**The documents.** `architecture.md`: the events table's rows `fly`,
`land` and `move`. The headers of `sound.ts`, of `themes.ts`, of
`sfx.ts` where it names the wind, and of `scene.ts` (`data-wind`,
`data-wind-swells`).

### 2.3 The thought after its bump, over the figure (D237)

**After the bump.** `app/src/engine/bubble.ts`: `AFTER_BUMP_MS =
500`. `Speech.think(text, tick, ticks, afterMs = 0)`, in
`speech.ts`:

- With `afterMs` over 0 nothing is drawn yet: the thought is kept
  as pending (its text, its ticks, and the scene's time it is due,
  `time.now + afterMs`), and a timer of the scene's shows it then.
- When it shows, it is built as a thought is today; its reading
  ends `ticks` ticks of `tickMs` after that moment, and it lasts
  until the tick `ticks` after the last tick `expire` was told of.
  `data-thought` is written then, not before.
- `settle()` counts a pending thought: until its due time and its
  reading time after it. The card waits (D175).
- A pending thought is dropped, its timer with it, by another
  thought or bubble, by `clearThought`, and by `expire` with
  `instant`: a restart and the slider show none.

The scene passes `AFTER_BUMP_MS` wherever it thinks with the bump's
sound, and nowhere else: `bump` by a friend, by a high cell and by a
ring; `flownAgainst` (`wrong_way`); `blocked` for `ring_rim` and
`no_landing`. A locked door, a thing out of reach and every other
refusal think at once, as they do.

**Over the figure.** `SpeechParts` gains `lifted(figure)`: how many
of the scene's pixels above the place of its feet on the ground a
figure is drawn; the scene gives `(FLY_LIFT + raise) * TILE` for a
flyer, without the hover, and 0 for anyone else. `Speech` takes it
away from the height it puts words at over a figure: in `anchor`
when the words are above, in `roomAbove`, in `aboveBox` of `say`,
and in the boxes of the other figures a bubble keeps clear of, top
and bottom. Words below a figure stay where they are: under its
feet's place on the ground, where its shadow is.

The scene's parent says `data-words-over`: while words are on and
above who they are over, how far over the place of its feet the
words' foot is, in cells with two decimals; `below` when they are
under; nothing with no words. On the ground it is 1.10 (the
figures' 1.02 cells and 4 pixels); in the air 1.60; in a ring's cell
1.95.

**Tests.**

- Vitest, `bubble.test.ts`: `wordsOver(headroom, lifted, tile)`, the
  pure function `Speech` and `data-words-over` both read, gives the
  three numbers above.
- Browser, `chapter-4.spec.ts`, *Los aros* with
  `wrong/turned_inside_the_ring.py`: the page notes, with a
  `MutationObserver` the test puts in, the moment `bump` enters
  `data-sounds` and the moment `data-thought` is written; the
  second is between 350 and 1500 ms after the first. While the
  thought is on, `data-words-over` is `1.95`, or `below` if the
  test's window leaves no room above, which the test tells apart
  and the report names. The card that says why the program stopped
  comes after the thought has been on.
- Browser, a level of chapter 1 with a friend in the way: the
  thought comes after the bump, and `data-words-over` is `1.10`.
- Browser, the slider moved across the bump's tick within the half
  second: no thought shows.

**The documents.** `architecture.md`: the events table's rows
`bump`, `blocked` and `wrong_way`; D175 names D237 where it says
when a word's reading time starts. The header of `speech.ts`
(`data-words-over`).

### 2.4 The code's letter (D238)

- `app/src/ui/codefont.ts` goes. `style.css` keeps Inconsolata's
  `@font-face` and `--mono-face`; Noto Sans Mono's `@font-face`,
  its folder `app/src/fonts/noto-sans-mono/` and every mention of
  it in a list of what the game bundles go.
- `Settings` loses `codeFont`; the editor's size a new child gets
  is 16, said where the settings' defaults are. `look.ts` sets the
  size and nothing of the face.
- `settings.ts` loses the chooser, and `debug.font.*` leaves both
  languages.
- A game kept with `codeFont` of a Noto candidate has its
  `fontSize` set to 16 when it is read, once: the field is not
  written back, so the next read finds none. A game kept with
  `inconsolata-16`, or with none, keeps the size it has.
- Tests: `store.test.ts` and `games.test.ts` for the three kept
  games above; `settings.spec.ts` loses the chooser's test and
  holds that `?debug` shows none; a browser test that the editor's
  computed face is Inconsolata and that no request asks for a Noto
  file.
- Documents: `architecture.md` and `dev-environment.md` wherever
  they name the chooser or the second face outside D223, which the
  designer brings to D238 with this plan.

### 2.5 The tips' pictures (D239)

- `app/e2e/tips-pictures.spec.ts`: `deviceScaleFactor: 2`, `WIDTH =
  960`, `HEIGHT = 540`, `MOST_BYTES = 90_000`. The crop round each
  thing is as it is, in the page's pixels; its picture has twice as
  many, and is made 960 by 540. The twenty pictures are made again,
  with `KYDUX_TIP_PICTURES=1`, and each is looked at.
- `waiting.ts`: the `img` says `width: 960, height: 540`.
- `style.css`: `.waiting-tip-box` up to `min(880px, 100%)` wide;
  `.waiting-tip-picture` as wide as the smallest of the box, 800 px
  and `calc((100vh - 330px) * 16 / 9)`; `.waiting` pads 24 px above
  where a tip is up. The 330 is the height of everything else in
  the view at its tallest tip, three lines of words: measured, and
  set to what the tests below need, the number said in the report.
- Tests, `waiting.spec.ts`: at 1280 by 800 a tip's picture is at
  least 720 px wide and the page does not scroll; at 1024 by 700 it
  is at least 480 px wide and the page does not scroll; at 390 by
  844 it is as wide as its box. With the tallest tip of each
  language.
- `load.spec.ts`: the first load's weight measured again, beside
  sprint 45's; a tip's picture is one file, up to 50 KB more.
- Documents: `dev-environment.md` where it says how the pictures
  are made; the header of the spec.

### 2.6 Done by the designer

Two commits before this plan; the programmer changes neither.

- **The story of the finish** (`0b3553c`).
  `content/stories/the-finish/story.json`: its fifth step, the one
  that names Rinlo, frames `[[30, 5], [40, 12]]` (D199), and the two
  steps after it keep that frame: the class beyond the finish and
  the gate with Rinlo beside it, each figure about twice as tall as
  on the whole width. `chapter-4.spec.ts` holds `wide` to the fourth
  step and the box from the fifth; `test_broom.py` holds that Rinlo
  and everyone the step moves are inside the box.
- **The comment of *Los aros*** (`41a9c91`). `text.es.json`'s
  starting code begins with the owner's sentence, letter for letter,
  one `#` line that the editor wraps (D223); `text.en.json` says the
  same: *The instructions to fly through a pair of rings are
  repeated three times, just the same. Make a function so you do
  not repeat them!*

### 2.7 What is left out, and why

- **The flying rows' other two frames.** They stay in the sheets,
  not drawn. Taking them out means making the two flying bases and
  Zarek's again from Gemini's edits, through the cleaning of their
  magenta rim, and every wizard's sheet with them, for frames
  nobody sees. They go the next time a flying row is made.
- **Eldra's sway (D120) and the beat of the end's mark.** They are
  the scene at rest: they move before a program runs and after it.
  The owner's words speak of the flight; if they meant these too,
  they will say.
- **The steps', the cast's and the door's sounds at Stop.** Each is
  over in a quarter of a second.
- **A thought's delay on a refusal with no bump**: a locked door, a
  thing out of reach.
- **A wind for Zarek.** The wind is the wizard's, as it is.
- **The wind's last numbers.** The designer cannot hear it. The
  plan's numbers are a first setting; the owner moves the two
  sliders and says what they hear, and the numbers follow in a
  small commit.

### 2.8 What the owner will try

**The flight that stands still**, in *El primer vuelo* (chapter 4,
Práctica 6):

1. This program, run:

   ```python
   wizard.move_right(8)
   wizard.cast("drevo")
   wizard.wait(60)
   ```

   The wizard walks to its broom, lifts, and stays in the air for
   eight seconds. It rises and falls slowly, a little,
   with no shimmer in its picture. The wind is a soft low air.
2. *Parar*, pressed while it hovers: the wizard is still in the
   air and does not move at all. The wind is gone within a moment.
   The music plays on.
3. The slider under the scene, dragged back and forth over the
   flight: the wizard and its shadow stand still at each place. No
   wind.
4. *La carrera*, any program that flies, and the slider dragged:
   Zarek stands still too. While the race plays, the two do not rise
   and fall together.

**The wind**, in *Los aros* (Mejora 1) and under `?debug`:

5. The level's own program, run: on each straight stretch the wind
   is low and even, with no beat. At each turn it swells, comes
   near and goes away, with a faint high tone in it.
6. `?debug#music`, at the page's foot, *El viento de la escoba*:
   the four buttons play the wind at rest, flying on, in a turn and
   in a whole flight. The two voices have a box and a slider each.
   What the owner likes is read in the line under them, to be
   copied into their answer.

**The thought**, in *Los aros*:

7. This program, run:

   ```python
   wizard.cast("drevo")
   wizard.move_right(1)
   wizard.move_up(1)
   wizard.move_right(1)
   ```

   The bump sounds and the ring shakes; half a second later the
   wizard thinks *Oh, giré demasiado pronto y rocé el aro.* The
   cloud is over its hat, and covers nothing of it. The card comes
   once the thought has been read.

**The rest:**

8. Chapter 4's third story, *La meta*, at its fifth page: the
   picture comes near to the gate, and Rinlo is seen beside it,
   apart from the class.
9. *Los aros*: the first line of the program is the owner's
   sentence.
10. The settings under `?debug`: no letter to choose; the code is
    in Inconsolata at 16.
11. The tips that come while a level loads: each picture is clearly
    larger, and the page does not scroll. The ten are also in the
    hand-over's page, to be seen without waiting for them.

## 3. The pieces

One local commit each, in this order.

### 3.1 The hover (D235, 2.1)

`flight.ts`, the scene's clock and `flyFrames`, `data-hover`, the
tests and the documents.

### 3.2 The wind (D236, 2.2)

When it blows, the new sound, the turn, `data-wind-swells`, the
debug page, the tests and the documents.

### 3.3 The thought after its bump, over the figure (D237, 2.3)

The pending thought, `lifted`, `data-words-over`, the tests and the
documents.

### 3.4 The code's letter (D238, 2.4)

### 3.5 The tips' pictures (D239, 2.5)

The spec, the twenty pictures made again and looked at, the view's
sizes, the tests, the load measured.

### 3.6 The whole check, the hand-over and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4.
The whole `ci/check.sh --e2e`, in a copy, with Playwright's own
server on 4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough made again whole, in its one arrangement
  (D216); the report names the pages that differ from the one the
  owner read: every picture of a flight, *Los aros* and the story
  of the finish;
- the ten tips with their pictures in Spanish, as sprint 44's page;
- the report in Spanish, with pictures of this commit only: the
  wizard and Zarek in the air in *La carrera*; the rim rubbed in
  *Los aros*, a picture at the bump with no thought and one a
  second later with the thought over the hat; *La meta*'s fifth
  page; the waiting view with a tip at 1280 by 800 and at 1024 by
  700; the debug page's wind; the load's table beside sprint 45's;
  what was built piece by piece; every choice the plan left and how
  it was taken; and the owner's eleven steps of 2.8, written to be
  followed.

## 4. Gemini images

None, and no text brief.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-47.md (this plan, whole), docs/dev/sprint-46.md and
docs/dev/sprint-45.md (what was built last), and the memory notes
kydux-two-agents, kydux-sprint-45-state, kydux-designer-review-45,
kydux-designer-sprint-46-notes, kydux-designer-sprint-47-plan and
kydux-checks-per-piece. Sprint 46 was built by the designer; read its
commits and the plan's with git log -p f35ce68..HEAD before you
start. The decisions D235 to D239 are entered in architecture.md as
built, with D185, D188 and D223 brought to them; the code is yours to
bring to them.

Build sprint 47 whole: pieces 3.1 to 3.6 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173; never a push,
never a timer, never a deploy: nothing is released until the owner is
happy with chapter 4. Never stop or build into the servers on ports
443 and 5173, and stop your own preview when you are done. No image
and no text is asked of Gemini; the key stays in
~/.config/kydux/secrets.env and never enters a file of the tree, a
commit, a log or the report.

What the owner will look for:
(1) a flying figure drawn in its level frame and moved by the page:
    a slow smooth rise and fall (2.4 s, 0.05 cells), each figure at
    its own place in it, none inside a ring; the hover's clock runs
    only while the playback plays, and in a story always: after
    Stop, in a pause, at the run's end and under the slider the
    flight stands still;
(2) the wind heard only while the program plays, the music
    untouched; a new sound: low wandering air, almost silent at
    rest, even in straight flight with no beat of the cells, and a
    swell that comes and goes at the lift and at each turn, with
    two faint high tones; under ?debug#music four buttons to hear
    it and a mixer of its two voices;
(3) a thought that tells of a bump shown half a second after the
    bump, the card still waiting for it, none under the slider; and
    the words over a flying figure placed over it as it is drawn;
(4) Inconsolata at 16 the code's only letter: the chooser, the
    setting and the other face gone, a kept game brought over;
(5) the tips' pictures at 960 by 540, shown up to 800 px wide, the
    waiting view never scrolling at 1024 by 700 and larger.

The story of the finish and the comment of Los aros are done
(0b3553c, 41a9c91): change neither.

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. The wind's
numbers are a first setting the owner will move by ear: build them
as written. The debug page's labels are yours, in both languages.
Never edit content while a browser run is going. Every document and
comment in the present. Before git add, read git diff of each file
and stage only your own hunks; commit promptly.

Hand over, in drafts/ and never committed: chapter 4's walkthrough
made again, the ten tips with their pictures, and the report in
Spanish as 3.6 asks, with the owner's eleven steps of 2.8. Write
your memory note kydux-sprint-47-state, and end with the prompt for
the designer's review in English, in a code block.
```
