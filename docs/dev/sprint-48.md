# Sprint 48 — A wizard that faces one way in the air, a hover that goes on after Stop, a wind in gusts, a lift and a landing seen and heard, a thought beside the head, a tip with its picture, and a run's end that sounds on time

On 2026-11-15 the owner played sprint 47 and wrote what they saw, in
their words:

> El mago de color naranja sigue vibrando. Y cuando lo paro aunque ya
> se quedan quietas congeladas las imágenes, en algunos puntos la del
> mago queda borrosa (congelada pero como duplicada o triplicada).
> Algo hay raro. Como si estuviese todo el tiempo cambiando de mirar
> al frente a mirar a los lados. Pasa con el mago chico de color
> naranja, no sé si pasa con los otros sprites.
>
> Además no me gusta que queden completamente congelados, he cambiado
> de opinión. Parar detendrá el programa, pero mantendrá la animación
> de volar en el sitio en el que esté, como wait. Al parar, el sonido
> puede dejar de sonar, porque ya no se está moviendo.
>
> El sonido de volar sigue sin gustarme aunque es más agudo. Ahora
> mismo suena como un sonido agudo como de un aspirador que estuviese
> muy bajito o muy lejos. Tiene cierta variabilidad, pero parece muy
> continuo. El viento es más cambiante. No puede ser un sonido
> continuo, sino que debe ser un sonido variable, como el sonido del
> viento, debe sonar como si hubiese algo de viento. El sonido de
> volar debe sonar con los comandos move, cada comando move mientras
> estás en la escoba debería generar un sonido mientras dura el
> movimiento, que tenga algún tipo de principio y final y evolución a
> lo largo del sonido, para que de sensación de variabilidad, y
> quizás el hechizo de montar y desmontar pueden ser otros dos
> sonidos que sean como de ascender y descender. Cuando está parado
> debe sonar muy muy bajo el viento, o ni siquiera sonar, y en
> movimiento el viento debe sonar como "más a rachas", no continuo.
> Con esta configuración suena un poco mejor, pero aún así no me
> convence: El viento de la escoba: air 2.70, tones 0.30
>
> La burbuja de pensamiento cuando está abajo no queda bien, porque
> queda muy lejos del personaje (y debería aparecer como desde su
> cabeza). Lo que se puede hacer es ponerla más cerca del personaje,
> pero a un lado... y que le salgan los puntos de la burbuja desde la
> esquina inferior en diagonal a la cabeza del personaje. Así hay
> tres posiciones para colocarla: encima del personaje, a la
> izquierda del personaje un poco elevada, o a la derecha del
> personaje un poco elevada. Incluso puede estar a la izquierda o
> derecha del personaje y no estar elevada nada, y que los puntos de
> la burbuja salgan desde el lado o incluso desde la esquina
> superior, pero que parezcan salir desde la cabeza.
>
> Las imágenes de los tips están mejor, pero ahora tardan en cargar y
> no queda bien porque a veces se carga el tip sin la imagen. Podemos
> pre-cargarlo antes de mostrar el tip, o comprimir más las imágenes
> para que se transmitan muy rápido, o volver a la resolución
> anterior pero al ponerlas en la pantalla ponerlas escaladas para
> que se vean más grandes.
>
> En la carrera, si no hay un "drevo" al final, el mago aterriza sin
> la animación de aterrizar y sin su sonido.
>
> Y cuando acaba la carrera y salen las puntuaciones, pasan unos 5-10
> segundos y luego suena el sonido de fallar el objetivo. Ese sonido
> debería sonar antes, aunque esperemos para mostrar bien los
> resultados y no cerremos el diálogo de la profesora. Pasa igual
> cuando se choca con el aro, y se muestra el pensamiento de que giró
> demasiado pronto, y luego unos segundos después suena el sonido de
> fallo de nivel. Eso es raro, debería sonar cuando se falla, aunque
> todavía esté saliendo el mensaje.

The designer looked for the cause of each before planning it.

- **The wizard that shakes.** It is not the amber boy's sheet, and
  not the frames' scaling that sprint 47 blamed: it is every look of
  the wizard, in the air. The page reads the way a figure faces back
  from the frame it shows (`facingOf`, `painted.ts`): the frame's row,
  modulo four. That holds for a sheet's first twelve rows, which go
  in fours. The wizard's flying rows are 14 to 17
  (`figures.json`, `rows.fly`), and 14 modulo 4 is 2. A wizard that
  flies facing down is given frame 42, of row 14; the next frame of
  the screen `flyFrames` reads row 14 as *right* and gives it frame
  48, of row 16, which it reads as *down*; and so on, sixty times a
  second. Facing left and facing up change places the same way. The
  eye sees the two pictures at once: blurred, doubled. Stop leaves
  whichever was up. Zarek's flying rows are 4 to 7, and 4 modulo 4
  is 0: he is read rightly, as the owner saw in sprint 47 (*El de
  Zarek si que parece que se mueve mejor*). The same wrong reading
  sets a landed wizard down facing another way, picks the side of a
  ring's plane at the lift, and sends a cast's light and its rows
  the wrong way in the air.
- **The flight frozen by Stop.** It is D235 as it was asked and
  built. The owner has seen it and wants the hover to go on.
- **The far vacuum cleaner.** The wind of sprint 47 is one loop of
  noise through a narrow band that sounds all the flight long, held
  at one even level in straight flight (`Wind.fly`), with two sines
  at 1568 and 2349 Hz that never change. A sound with no start and
  no end is a machine's, not the air's.
- **The thought far from the head.** With no room above, under the
  goals box (D240) or at the window's top, `showThought` puts the
  cloud under the place of the figure's feet on the ground. A flying
  figure's head is a cell and a half above that place, and two in a
  ring: the cloud is far from it, and its dots point up at the
  feet.
- **The tip with no picture.** The view sets the picture's address
  and shows the tip in the same moment (`waitingView`, `onTip`), so
  the words are up while the picture travels. The page asks for the
  next tip's picture ahead (`fetchNextTip`), but as the last of its
  idle work, after the first screen has shown: the first wait's
  picture is never asked for ahead; and what it asks for with
  `fetch` is asked for again by the `<img>` where the server lets
  nothing be kept.
- **The landing with no landing.** `land` in the scene sets the
  figure on its cell in one frame, with no sound of its own, and
  `lift` raises it the same way. What the owner sees and hears at a
  landing they cast is the spell's light and the spell's sound.
  The landing the world makes when a program ends in the air (D185)
  has no spell: nothing is seen but the figure lower, and nothing is
  heard.
- **The late sound.** The run's sound is played by the level's view
  when it draws the card (`level.ts`), and the controller holds the
  card until the words on the scene are read (`done`,
  `scene.settle`, D175): Ilda's verdict, the rim's thought. The
  sound waits with the card.

What this sprint holds:

1. The scene keeps the way each figure faces, and nothing reads it
   back from a frame (D241).
2. A figure in the air hovers whenever it is seen: after Stop too.
   Stop silences the wind (D242).
3. A lift and a landing are seen, a rise and a set-down, and heard,
   air that rises and air that falls; the landing at a program's
   end as the one cast (D244).
4. The wind is a gust for each flown command, each with its start,
   its changes and its end, no two alike; at rest, silence (D243).
5. A thought with no room above goes beside the head, its dots
   toward the head (D245).
6. A tip comes up with its picture loaded (D246).
7. The sound of a run's end plays when the run ends (D247).

The rules of the earlier sprints hold: pieces in order, one local
commit each, `ci/check.sh` and the browser specs a piece touches green
before it, the whole `ci/check.sh --e2e` once before the last commit;
never a push, never a timer, never a deploy; the servers on 443 and
5173 untouched; documents and comments in the present; every text
the child reads is Gemini's or the owner's own.

## 1. Decisions taken here

All are entered in `docs/dev/architecture.md` with this plan, where
they are told whole; D235, D236, D237 and D240 are brought to them,
and D175, D185, D215 and D221 name them.

- **D241 — The scene keeps the way each figure faces, and never
  reads it back from a frame.** From the owner's (*Como si estuviese
  todo el tiempo cambiando de mirar al frente a mirar a los lados*).
  The way is kept from the moment a figure is placed and set where
  the scene turns it; whatever asks is told the way kept. Rules out
  a way read from a frame's number.
- **D242 — A figure in the air hovers whenever it is seen, and Stop
  silences its wind.** The owner's (*Parar detendrá el programa,
  pero mantendrá la animación de volar en el sitio en el que esté,
  como wait*). The hover's clock always runs, but under reduced
  motion. Rules out a flight frozen in the air.
- **D243 — The broom's wind is a gust for each flown command.** The
  owner's (*cada comando move mientras estás en la escoba debería
  generar un sonido mientras dura el movimiento, que tenga algún
  tipo de principio y final y evolución*; *más a rachas, no
  continuo*). No sound lasts the flight long; at rest, none. Rules
  out a continuous sound, a steady tone, a gust for every cell, and
  two gusts alike.
- **D244 — A lift and a landing are seen and heard, whoever orders
  them.** The owner's (*otros dos sonidos que sean como de ascender
  y descender*; *si no hay un "drevo" al final, el mago aterriza sin
  la animación de aterrizar y sin su sonido*). Rules out a figure
  that changes its height in one frame, and a landing that differs
  by who ordered it.
- **D245 — A thought with no room above goes beside the head.** The
  owner's (*más cerca del personaje, pero a un lado... y que le
  salgan los puntos de la burbuja desde la esquina inferior en
  diagonal a la cabeza*). Rules out a thought far from the head it
  comes from.
- **D246 — A tip comes up with its picture.** The owner's (*a veces
  se carga el tip sin la imagen. Podemos pre-cargarlo antes de
  mostrar el tip*). Rules out words over an empty frame, a screen
  held for a picture, and a smaller picture stretched.
- **D247 — A run's end sounds when the run ends.** The owner's
  (*debería sonar cuando se falla, aunque todavía esté saliendo el
  mensaje*). The card still waits for the words. Rules out a sound
  that comes seconds after what it tells of.

## 2. What is asked

### 2.1 The way a figure faces (D241)

**The page.**

- The scene keeps each figure's way in a map of its own, by sprite.
  `face` (`scene.ts`) writes it, and every place that makes a figure
  writes its first way. Any place that sets a frame for a way
  without `face` goes through it, or writes the way too.
- `facingOf` and `FACING_OF_ROW` leave `painted.ts`. `playFrames`
  is given the way. `wizardFacing`, `flyFrames`, `lift`, `land`,
  `castLight` and every other reader ask the map; a figure with no
  way kept faces down.
- The scene's parent says `data-wizard-facing`, the way kept, and
  `data-wizard-frame`, the name of the frame the wizard's sprite
  shows, each written when it changes.

**Tests.**

- Vitest, `flight.test.ts`: `flyFrame` for the four ways is 42, 45,
  48, 51 on a flying row of 14 and 12, 15, 18, 21 on one of 4.
- Browser, `chapter-4.spec.ts`, in *El primer vuelo*, once with
  Pablo and once with Marta:

  ```python
  wizard.move_right(8)
  wizard.cast("drevo")
  wizard.move_right(2)
  wizard.wait(60)
  ```

  While it waits in the air, `data-wizard-frame` read on thirty
  frames of the screen in a row (`requestAnimationFrame`, in the
  page) is one value, 48, and `data-wizard-facing` is `right`.
- Browser, for each of the other three ways, in a level where it
  is flown: one frame, 42 down, 45 left, 51 up.
- Browser, *El primer vuelo*'s own program to its end: after the
  landing `data-wizard-facing` is `right` and the frame is the
  standing one of that way.

**The documents.** The headers of `painted.ts` and `scene.ts`
(`data-wizard-facing`, `data-wizard-frame`).

### 2.2 The hover that goes on (D242)

**The page.**

- `update` adds Phaser's `delta` to `hoverMs` every frame, but
  under reduced motion (`this.still`). Nothing else changes it.
- Stop leaves the wizard a flyer on its cell: its frame, its
  shadow and its hover as in a `wait`.
- At Stop, at a pause and at a run's end a gust that sounds fades
  in 0.15 seconds (2.4), and `data-wind` says `off`.

**Tests.** `chapter-4.spec.ts`, the tests of the hover: with 2.1's
program, `data-hover` read twice, 400 ms apart, grows while it
plays; after Stop (`data-state` `done`, `data-flying` still the
wizard); with the slider on a tick of the flight (`paused`); and
after a run that ends in the air. Under reduced motion it stays 0.
`data-wind` is `off` within 300 ms of Stop pressed in the middle of
a long flown move.

**The documents.** `architecture.md`: line 57's *while the program
plays*, and the events table's row `fly`. The headers of
`flight.ts` and of `scene.ts`.

### 2.3 The lift and the landing (D244)

**The page.**

- `flight.ts`: `LIFT_MS`, 300, and `riseOf(elapsed, length)`, from
  0 to 1, eased at both ends.
- A flyer's record gains its rise, 0 to 1, and whether it is
  setting down. `flyFrames` draws the figure at `(FLY_LIFT +
  ring.raise + hover) * rise`, and its shadow as faint as the rise
  is low.
- `lift`: the rise starts at 0 and takes `LIFT_MS` at the
  playback's speed (`LIFT_MS * tickDuration / TICK_MS`). `land`:
  the rise goes back to 0 in the same time; when it is there the
  shadow goes, the figure leaves the flyers, and it stands facing
  the way kept (2.1). Until then it keeps its flying frame.
- The ticks that follow play meanwhile. A flown move right after a
  lift moves the figure as it rises. A step walked right after a
  landing moves it as it sets down: its walking frames show from
  the moment its feet are on the ground.
- A lift during a set-down goes up again from where the rise is; a
  landing during a rise goes down from where it is.
- Shown at once (`instant`: the slider, a restart, a tick drawn
  with no playback) and under reduced motion, the rise is 1 or 0
  at once.
- `data-flying` names a figure from its `fly` to its `land`, as
  the world does. `data-rise` says the wizard's rise, two decimals,
  written when it changes, and is not there on the ground.
- `settle(won)` counts a set-down under way, and the celebration
  of a run won starts when the wizard's feet are on its cell.
- `sfx.ts`, two effects: `lift`, noise swept from 300 to 1100 Hz,
  and `set_down`, noise swept from 900 to 220 Hz, each 0.6
  seconds, at a level of 0.12 that rises in its first fifth and
  falls to nothing by its end, with no click. If `Effect` has no
  rise of its own, it gains one. The wizard's `fly` plays `lift`
  and the wizard's `land` plays `set_down`, with or without `cast`
  in the event, in a tick not shown at once. They are effects: the
  settings mute them, `data-sounds` names them, and Stop does not
  cut them. No other figure's lift or landing sounds.

**Tests.**

- Vitest, `flight.test.ts`: `riseOf` is 0 at 0, 1 at its length
  and after, between the two at the half, and never falls.
- Browser, *El primer vuelo*'s own program: after the first
  `drevo`, `data-rise` is read under 1 and then 1, and
  `data-sounds` names `lift`; after the last, `data-rise` is read
  under 1, then gone, and `data-sounds` names `set_down`.
- Browser, *La carrera*'s own program, which ends with no `drevo`:
  at the wizard's `land`, `data-rise` is read under 1 and
  `data-sounds` names `set_down`; Zarek's landing adds no sound.
- Browser, the slider put on a tick of a flight: `data-rise` is 1
  in the next frame, and no `lift` is added to `data-sounds`.
- Under reduced motion `data-rise` is never read between 0 and 1.

**The documents.** `architecture.md`: the events table's rows `fly`
and `land`. The headers of `flight.ts`, `sfx.ts` and `scene.ts`
(`data-rise`).

### 2.4 The gusts (D243)

**The world.** `_move` (`world.py`) gives every flown step of the
wizard's its place in its command: `step`, from 1, and `steps`, the
command's count. A walked step has neither. `protocol.ts` and the
events table say them.

**The sound**, `engine/sound.ts`. `Wind` is made again; nothing of
it sounds unless asked.

- One loop of noise feeds three voices, each through the gain of
  its mix:
  - **air**: a bandpass (Q 1.1) and a lowpass at 2400 Hz, then the
    gust's level. The band's middle follows the level: 320 Hz at
    silence, 1000 Hz at `GUST_HIGH`.
  - **whistle**: a narrow bandpass (Q 12) whose middle goes from
    1700 to 2600 Hz with the level, at a quarter of the level's
    square: it is heard at the peaks alone.
  - **rest**: a bandpass at 300 Hz at a level of 0.006, on while
    the wizard is in the air, the program plays and no gust sounds.
    Its mix is off.
- `gustPlan(seconds, random)`, exported and pure: the gust's
  level in time, as points `{ at, level }` in seconds.
  - A peak drawn between `GUST_LOW`, 0.035, and `GUST_HIGH`, 0.07.
  - A rise from 0 to between 0.6 and 1 of the peak, in three
    tenths of `seconds`, not less than 0.06 nor more than 0.25.
  - Then a new target every 0.12 to 0.3 seconds, drawn between
    0.45 of the peak and the peak; one of them, at a place drawn
    between a quarter and seven tenths of `seconds`, is the peak.
  - After `seconds`, a fall to 0 in 0.45 to 0.7 seconds, drawn.
  - A plan shorter than its rise is the rise and the fall.
- `Wind.gust(seconds)` plans a gust with `Math.random`, or with
  the function `Wind` was made with, and gives it whole to the
  sound's clock as ramps: no timer steps it. If a gust sounds, the
  new plan starts from the level it has at that moment (the old
  plan dropped, the value held), and no second voice is made.
- `Wind.stop(seconds)` drops the plan and fades to 0 in that time.
  `Wind.blowing` is true from a gust's start to its fall's end, by
  the page's own count where there is no sound.
- `remix`, `windMix` and `mixWind` keep their form, with the three
  voices. `Wind.fly`, `Wind.swell`, the two sines and their
  numbers go.

**The scene.**

- A flown `move` of the wizard's with `step` 1, in a tick not
  shown at once and with the program playing, calls
  `wind.gust(steps * duration * FLOWN / 1000)`. One with a later
  `step` calls it for the steps still to fly, `steps - step + 1`,
  only when no gust sounds: a flight that goes on after a pause.
- The gusts of the run are counted at every flown `move` with
  `step` 1, shown at once or not, in `data-wind-gusts`; a restart
  empties it. `data-sounds` names `wind` at each gust that sounds.
- A `bump` of the flying wizard, and a `blocked` that stops it in
  the air, call `wind.stop(0.05)`. Stop, a pause and the run's end
  call `wind.stop(0.15)`. A landing leaves a gust to fall.
- `lift` and `land` no longer start or end a wind. `turned`,
  `lastFlownWay`, the swells' count and `data-wind-swells` go.

**The debug page**, `ui/themes.ts`, *El viento de la escoba*: six
buttons, a one-cell move, a move of eight cells, a zigzag of eight
one-cell moves 133 ms apart, a lift, a landing, and a whole flight
(a lift, a move of one, the four moves of a pair of rings, a move
of eight, a landing). Three rows, `air`, `whistle` and `rest`, a
box and a slider each; the line under them says the mix as it
does. The labels are the programmer's, in both languages; the keys
of the samples that go, go.

**Tests.**

- pytest, `test_broom.py`: a flown `move_right(3)` gives `step` 1,
  2, 3 of `steps` 3; a walked move gives neither; a flown command
  cut by a bump gives the steps flown.
- Vitest, a new `sound.test.ts`, `gustPlan` with a fixed `random`: it
  starts and ends at 0; no level is over `GUST_HIGH`; the peak is
  there once; the points after the rise are 0.12 to 0.3 seconds
  apart; a plan of 0.133 seconds has the rise and the fall alone;
  two different `random`s give two different plans.
- Browser, `music.spec.ts`, the debug page's wind: six buttons, a
  box and a slider for each of the three voices, `rest` off, and
  the line says a voice turned on or off.
- Browser, *Los aros*' own program to its end: `data-wind-gusts`
  is 18, its flown `move_*` commands; `data-sounds` names `wind`.
- Browser, 2.1's program: `data-wind` is `on` during the flown
  move and `off` two seconds into the `wait`.
- Browser, a zigzag, `for i in range(6):` of `move_up(1)` and
  `move_down(1)` where they can be flown: twelve gusts counted,
  and `data-wind` never read `off` between the first and the last.
- Browser, sound muted in the settings: the gusts are counted the
  same.

**The documents.** `architecture.md`: the events table's rows
`move`, `fly`, `land` and `bump`, and lines 65 and 66. The headers
of `sound.ts`, `themes.ts`, `sfx.ts` where it names the wind,
`scene.ts`, `world.py` and `protocol.ts`.

### 2.5 The thought beside the head (D245)

**The page.**

- `bubble.ts`: `thoughtPlace`, pure. It is given the cloud's width
  and height, the figure's head as it is drawn (its middle, its top
  and its two sides, in the scene's pixels), the way the figure
  faces, the room (the window's view of the scene, less the goals
  box's cover), and the other figures' heads. It gives the place,
  `above`, `left`, `right` or `below`; the cloud's corner; and the
  middles of the two dots.
- The places, tried in this order; the first with room is taken:
  1. **Above**, as it is (D237).
  2. **Beside, raised**, on the first side: the cloud's foot level
     with the head's top, its near edge a third of a cell from the
     head's near side. The dots go down in a diagonal from the
     cloud's near bottom corner to the head's near side, the larger
     nearer the cloud.
  3. **Beside, raised**, on the other side.
  4. **Beside, lower**, on the first side: the cloud slid down by
     the least that gives it room, and no lower than its top level
     with the head's top. The dots go to the head from the cloud's
     near side, at the head's height, or from its near top corner
     where the cloud is wholly under the head's top.
  5. **Beside, lower**, on the other side.
  6. **Below**, as it is.
- The first side is the one behind a figure that faces left or
  right; for one that faces up or down, the one toward the middle
  of the window's view.
- A place has room when the cloud is whole inside the room, 4
  pixels clear of its edges, and over no other figure's head.
- `showThought` (`speech.ts`) asks `thoughtPlace` when the thought
  shows, draws the cloud and its dots where it says, and keeps the
  place while the thought is up; `anchor` follows the figure with
  it, and the head is where the figure is drawn, lifted and in a
  ring's raise as `lifted` says. A bubble of words said (`say`)
  keeps its code.
- `data-words-place` says `above`, `left`, `right` or `below`, for
  a thought and for a bubble. `data-words-over` says a number for
  a thought beside the head as for one above: how far over the
  place of the feet the cloud's foot is.

**Tests.**

- Vitest, `bubble.test.ts`: with room, above; a head at the
  window's top facing right, left and raised; the same facing up,
  left of the window's middle, right; the first side taken by
  another head, the other side; too little room for the raised
  place on both sides, lower on the first; no room on either
  side, below; in every side place the dots lie between the
  cloud and the head, the last one within 6 pixels of the head's
  near side.
- Browser, `chapter-4.spec.ts`, the rim's thought under the goals
  box (D240's test): `data-words-place` is `left` or `right`,
  `data-words-over` is a number, and the cloud's box, read from
  the page, is clear of the goals box. With the box folded,
  `above`.
- Browser, a thought of a wizard on the ground at the window's
  top, in a level that has one: a side place.

**The documents.** `architecture.md`: line 40's words on
`bubble.ts`, and the events table's rows `bump`, `blocked` and
`wrong_way` where they say where a thought goes. The headers of
`bubble.ts` and `speech.ts` (`data-words-place`).

### 2.6 The tip with its picture (D246)

**The page**, `ui/waiting.ts` and `main.ts`.

- A tip's picture is loaded as an element: an `Image` given its
  address and awaited with `decode()`. The promises are kept by
  address, so that a picture is asked for once. One that fails
  gives nothing.
- `main.ts` asks for the picture of the tip due next when the page
  opens, before it starts to load the first screen and not in the
  idle queue. `Wait.tip` asks for the picture of the tip after the
  one it puts up. `fetchNextTip` goes.
- A tip due waits for its picture's promise. When it comes, the
  tip is put up: the view puts the loaded element in the picture's
  place and the words under it in the same frame; then the tip's
  number is kept and its reading time starts (D221). With no
  picture, the words go up alone and the picture's room is not
  there.
- A screen ready while the tip due still waits opens at once, with
  no tip, and the tip's number is not kept.
- A tip that takes the place of one that is up waits the same,
  the one up staying meanwhile.

**Tests.**

- Vitest, `waiting.test.ts`, with pictures that come when the test
  says: a tip due is not put up before its picture; it is put up
  when it comes, and its reading time counts from then; a screen
  ready before it opens with no tip, and the next wait's tip is
  the same one; a picture that fails puts the words up alone.
- Browser, `waiting.spec.ts`, the tips' pictures held 1.5 seconds
  on their way: while `data-tip` is not there, the tip's box is
  hidden; when `data-tip` is there, the `<img>` is `complete` and
  960 pixels wide by its own count. One request is made for a
  picture shown.
- Browser, the pictures' requests refused: the tip's words are
  up, and no picture's box.
- `load.spec.ts`: the first screen's time beside sprint 47's, in
  the report.

**The documents.** `architecture.md`: lines 91 to 98 on `main.ts`
and the tips' pictures. The headers of `waiting.ts` and `main.ts`.

### 2.7 The run's end that sounds on time (D247)

**The page.** The rule that picks the sound stays: `win` for a run
won, `fail` for any other outcome.

- `controller.ts`, `done`: a run not stopped plays its sound at
  once, before the wait of `scene.settle`.
- `level.ts`: the card plays the sound only for an outcome that
  had no playback, a program that cannot start.
- A stopped run plays none, as it does.

**Tests.** Browser, with the sounds read as the tests read them
(`data-sounds`, or the page's own list):

- *Los aros*, the rim's program of 2.8: `fail` is named within
  half a second of `data-state` `done`, while no card is up; the
  card comes after the thought, and adds no second `fail`.
- *La carrera*, `wrong/eighteen_lines.py`: `fail` is named while
  Ilda's verdict is up and no card is.
- *El primer vuelo*'s own program: `win` is named before the
  card.
- A program with an error in its first line: `fail` with its card.
- Stop: neither.

**The documents.** The headers of `controller.ts` and `level.ts`.

### 2.8 What the owner will try

**The wizard that faces one way**, in *El primer vuelo* (chapter 4,
Práctica 6), with the amber boy:

1. This program, run:

   ```python
   wizard.move_right(8)
   wizard.cast("drevo")
   wizard.move_right(2)
   wizard.wait(60)
   ```

   The wizard rises from the ground, with a sound of air going up.
   It flies two cells with a short gust. Then it hovers: one sharp
   picture, facing right, rising and falling slowly. No sound.
2. *Parar*, pressed while it hovers: the program stops and the
   wizard goes on hovering where it is. The picture is sharp.
3. The same with another look and with the girl.

**The gusts**, in *Los aros* (Mejora 1) and under `?debug`:

4. The level's own program, run: each move is a gust, with a start
   and an end; a long stretch changes as it goes; the zigzag
   through a pair of rings is one wind that changes. No two sound
   the same. Between moves, and at the end, silence.
5. *Parar* in the middle of the long stretch: the gust dies at
   once.
6. `?debug#music`, at the page's foot, *El viento de la escoba*:
   six buttons, and a box and a slider for `air`, `whistle` and
   `rest`. `rest` is off: turned on, a very faint air is heard
   while the wizard hovers. What the owner likes is read in the
   line under them, to be copied into their answer.

**The landing**, in *La carrera* (Práctica 7):

7. The level's own program, which has no `drevo` at its end: past
   the last ring the wizard sets down, with a sound of air going
   down, as it does where the program says `drevo`.

**The sound of the end**:

8. *La carrera*, a program that loses: the sound of the failure
   plays as Ilda's count comes up. The card comes later, once it
   is read, with no sound.
9. *Los aros*, this program:

   ```python
   wizard.cast("drevo")
   wizard.move_right(1)
   wizard.move_up(1)
   wizard.move_right(1)
   ```

   The bump, and at once the sound of the failure; half a second
   later the thought.

**The thought beside the head**:

10. The same program, with the goals box open: the cloud is beside
    the wizard's head, raised, and its dots go from its corner to
    the head. With the box folded it is over the hat.

**The tips**:

11. The page opened anew, and a level of another scene opened from
    the map: each tip comes up whole, its picture with its words.

### 2.9 What is left out, and why

- **The places of a bubble of words said.** The owner's words are
  of the thought. A bubble under its figure stays as it is; if it
  reads as far away too, it takes the same places in a later
  sprint.
- **A thought at a locked door, which comes at once.** There is no
  bump to see first. The owner looks at it in *La puerta de Eldra*
  (chapter 2) with `wizard.move_left(5)` and `door.open()`, and
  says.
- **A wind for Zarek**: the owner's (*Me parece bien*).
- **The flying rows' other two frames**, as in sprint 47.
- **The wind's last numbers.** The designer cannot hear it. The
  plan's numbers are a first setting; the owner moves the sliders
  and says what they hear, and the numbers follow in a small
  commit.
- **The browser tests on GitHub.** The owner asks whether they are
  needed (*Las pruebas de github fallan todo el rato ¿hacen
  falta?*). The designer answers in the report; nothing of
  `.github/` changes until the owner decides.
- **The two debts of the art**, the sand portrait's thin edge and
  the few pixels beside two arches and the shed's lintel: neither
  is seen at the game's size. They leave the list.

## 3. The pieces

One local commit each, in this order.

### 3.1 The way a figure faces (D241, 2.1)

The map of ways, `facingOf` gone, the two attributes, the tests.
The owner's first comment is answered by this piece alone: a
picture of the amber boy in the air, facing each way, goes in the
report.

### 3.2 The hover that goes on (D242, 2.2)

The clock, the tests of the hover turned round, the documents.

### 3.3 The lift and the landing (D244, 2.3)

`riseOf`, the flyers' rise, the set-down, the two effects,
`data-rise`, the tests and the documents.

### 3.4 The gusts (D243, 2.4)

The world's `step` and `steps`, `Wind` made again, the scene, the
debug page, the tests and the documents.

### 3.5 The thought beside the head (D245, 2.5)

`thoughtPlace`, `showThought`, `data-words-place`, the tests and
the documents.

### 3.6 The tip with its picture (D246, 2.6)

The pictures loaded ahead, the tip that waits, the tests, the load
measured.

### 3.7 The run's end that sounds on time (D247, 2.7)

### 3.8 The whole check, the hand-over and the report

`docs/dev/plan.md` names this sprint's decisions in its chapter 4,
and brings what it says of D235 and D236 to them. The whole
`ci/check.sh --e2e`, in a copy, with Playwright's own server on
4173. Then, in `drafts/`, never committed:

- chapter 4's walkthrough made again whole, in its one arrangement
  (D216); the report names the pages that differ from the one the
  owner read;
- the report in Spanish, with pictures of this commit only: the
  amber boy in the air facing each of the four ways, large; three
  pictures of a lift, at its start, its middle and its end, and
  three of the landing at the race's end; the rim's thought beside
  the head with the goals box open, and over the hat with it
  folded; a thought beside the head of a wizard on the ground, if
  a level has one; a tip as it comes up; the debug page's wind; a
  drawing of two gusts' levels in time, from `gustPlan`; the
  load's table beside sprint 47's; what was built piece by piece;
  every choice the plan left and how it was taken; and the owner's
  eleven steps of 2.8, written to be followed.

## 4. Gemini images

None, and no text brief.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

Read first: CLAUDE.md, .claude/working-model.md, docs/dev/README.md,
docs/dev/sprint-48.md (this plan, whole), docs/dev/sprint-47.md (what
was built last), and the memory notes kydux-two-agents,
kydux-sprint-47-state, kydux-designer-review-47,
kydux-designer-uat-sprint-47, kydux-designer-sprint-48-plan and
kydux-checks-per-piece. The decisions D241 to D247 are entered in
architecture.md as built, with D235, D236, D237 and D240 brought to
them; the code is yours to bring to them.

Build sprint 48 whole: pieces 3.1 to 3.8 in order, one local commit
each; before each commit ci/check.sh and the browser specs the piece
touches green, and the whole ci/check.sh --e2e once before the last
commit, in a copy with Playwright's own server on 4173; never a push,
never a timer, never a deploy: nothing is released until the owner is
happy with chapter 4. Never stop or build into the servers on ports
443 and 5173, and stop your own preview when you are done. No image
and no text is asked of Gemini; the key stays in
~/.config/kydux/secrets.env and never enters a file of the tree, a
commit, a log or the report. Nothing under .github/ changes.

What the owner will look for:
(1) a wizard in the air that shows one sharp picture: the scene
    keeps the way each figure faces and nothing reads it back from
    a frame's number (rows 14 to 17 modulo 4 is the bug: every look
    of the wizard has it, Zarek does not);
(2) the hover going on after Stop, in a pause, at a run's end in
    the air and under the slider; none under reduced motion;
(3) a lift that rises and a landing that sets down, 0.3 s, with a
    sound of air going up and of air going down, for the wizard;
    the landing the world makes at a program's end the same as the
    one cast;
(4) the wind as a gust for each flown move command, planned for
    the command's whole length from the world's step and steps:
    a rise, a level that wanders at random, a fall after the last
    cell; a new command takes a sounding gust on, never a second
    one over it; silence at rest; no steady tone; Stop and a bump
    end it; under ?debug#music six buttons and a mixer of air,
    whistle and rest;
(5) a thought with no room above put beside the head, raised or
    level, its dots going to the head; under the figure only where
    neither side has room; bubbles of words said untouched;
(6) a tip put up only with its picture loaded and decoded, the
    next one's asked for ahead, as the page opens and at each tip;
(7) the win and fail sounds played when the playback ends, the
    card still waiting for the words and silent.

The plan decides everything; where it does not, take the smallest
choice that keeps its intent and say it in the commit. The wind's
numbers are a first setting the owner will move by ear: build them
as written. The debug page's labels are yours, in both languages.
Never edit content while a browser run is going. Every document and
comment in the present. Before git add, read git diff of each file
and stage only your own hunks; commit promptly.

Hand over, in drafts/ and never committed: chapter 4's walkthrough
made again, and the report in Spanish as 3.8 asks, with the owner's
eleven steps of 2.8. Write your memory note kydux-sprint-48-state,
and end with the prompt for the designer's review in English, in a
code block.
```
