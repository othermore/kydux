---
outputs:
  - content/levels/the-doors-corridor/text.en.json
  - content/levels/the-doors-corridor/text.es.json
  - content/levels/the-dark-tunnel/text.en.json
  - content/levels/the-dark-tunnel/text.es.json
  - content/levels/the-tunnel-exit/text.en.json
  - content/levels/the-tunnel-exit/text.es.json
  - content/levels/by-the-statues/text.en.json
  - content/levels/by-the-statues/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/levels/the-wrong-door/text.en.json
  - content/levels/the-wrong-door/text.es.json
  - content/levels/the-three-doors/text.en.json
  - content/levels/the-three-doors/text.es.json
  - content/levels/past-the-teacher/text.en.json
  - content/levels/past-the-teacher/text.es.json
  - content/levels/the-opening-hole/text.en.json
  - content/levels/the-opening-hole/text.es.json
  - content/levels/the-dark-room/text.en.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-night-walk/text.en.json
  - content/levels/the-night-walk/text.es.json
context:
  - docs/dev/story.md
  - content/levels/the-doors-corridor/text.es.json
  - content/levels/the-dark-tunnel/text.es.json
  - content/levels/left-or-right/text.es.json
  - content/levels/the-wrong-door/text.es.json
  - content/levels/the-three-doors/text.es.json
  - content/levels/past-the-teacher/text.es.json
  - content/levels/the-opening-hole/text.es.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/the-night-walk/text.es.json
---
Write again the texts of chapter 3's eleven levels, in English and Spanish. The owner read
them and wrote some by hand: those are given below between FIXED and END, in Spanish, and
go into the Spanish file word for word, the English saying the same in natural English.
The owner's words are the model of how the whole chapter must speak to a child. The
present Spanish of most levels is given as context: it is what the owner corrected, and
it may be kept wherever these rules let it stand.

## How the chapter speaks

- A text the child reads says what a friend would say, in the order a child needs: the
  thing first, then the word for it, then an example with numbers, and nothing about how
  the game is built.
- A program *looks at* an attribute, *sees* where it stands, *checks* its coordinates. It
  never *asks*: in Spanish *preguntar* and *pregunta* are out, in every form (*preguntar
  dónde estoy*, *preguntarle a la puerta*, *pregúntalo*); say *mirar*, *ver*, *consultar*,
  *comprobar* (*ver nuestra posición*, *mirar nuestras coordenadas*, *buscarnos en el
  mapa*, *mirar lo que la puerta sabe*). In English likewise *look at*, *see*, *check*.
- The tunnel is dark, not enchanted: the word *encantado*, *enchanted*, is in no text.
- No text says that a level is played in several ways, that the friend whispers, or that
  the game waits: what the game does is shown, not told. A way's name is what is seen.
- What the friend does not know is said as a guess (*creo que*), and the friend's reasons
  are said.
- A bonus goal names the spell or the attribute plainly (*Abre el mapa con su hechizo.*).
- An outro tells what the three see next, not what the code did: it moves the story on.
  What the code did belongs to `learned`.
- A hint never is, quotes or spells out a line of the solution: it points at the idea, the
  direction or the method by its name alone, and may give numbers.

## Where it happens, and who speaks

At night in the castle's passages, the three out of bed. `{friend}`, the friend met at the
gate, speaks every intro and outro; `{mate}`, the dormitory mate, is beside them and may be
mentioned. Dask is a strict teacher who walks the corridors with a lantern. There is a
naughty child's map in the wizard's hands all along. Write `{friend}`, `{mate}`, `{wizard}`
and the gender braces as rules.md says; `{el mago|la maga}` for the wizard.

## Each level's file

A JSON object with exactly these keys: `title`, given below in both languages; `goals`, a
list of strings as many as the level's goals below and in their order, each a short
sentence, a bonus goal's plain, the game writes *Extra:* before it; `starting_code`, one
string, `\n` between lines and at the end, as each level says: a practice's comments
(`# ...`, in the child's language), one a step, say in the child's words what to do and
name the method of the step in backquotes, and never give the numbers or the program;
`hints`, three, from the gentlest, on the idea, to the one that nearly says it all;
`intro`, what `{friend}` says before the level, one to three sentences: the situation and
the cells this brief names, never the solution; `outro`, one or two sentences; `learned`,
one sentence, "Now you know …" / "Ahora sabes …", what the idea is and what the child can do
with it now, on every level but the last; `ways`, only for a level played in several ways:
each way's id to its words. Text between backquotes is shown as code everywhere.

## What the child knows by now

All of chapters 1 and 2. In chapter 3, in order, the lessons before each level: *The cells*
(a cell is two numbers, x from the left and y from the top, both from 0;
`wizard.cast("orvim")` opens the plan); *Where I am* (`wizard.position`, `key.position`);
*Waiting* (`wizard.wait()`, a tick); *True or false* (other attributes, `dask.facing`,
`wizard.facing`, `==`, `True` and `False`, `not`); *If* (`if`, its colon and its four
spaces); *Else*; *Repeat* (`for step in range(3):`); *While*; *Light and slabs* (*kirra*,
`slab.in_place`, *osto*). Never explain them again.

## The levels

*The solution* is for you, so that the hints are true; it never appears in a text.

1. `the-doors-corridor`, *The corridor of doors* / *El pasillo de las puertas*. A long
   corridor of closed doors, turning up at its far end to the mouth of a dark tunnel. The
   three stand on cell (1, 12); no mark on the floor. Goals: walk to the tunnel's mouth,
   cell (15, 3) (say the cell); bonus, FIXED: Abre el mapa con su hechizo. END. Intro, FIXED:

   Mira cuántas puertas... ¡{mate} dice que el túnel está al final de este pasillo! Si
   abres el mapa haciendo el hechizo *orvim*, verás que estamos en la casilla (1, 12) y el
   mapa dice que la boca del túnel es la (15, 3). Como no hay marca en el suelo, ¡cuenta
   cuánto cambia cada número!

   END. Outro, FIXED: ¡Lo hemos conseguido! Este túnel al que hemos llegado está muy
   oscuro... END. Starting code: two comments, one a move, naming `move_right` and
   `move_up`. Solution: `wizard.move_right(14)`, `wizard.move_up(9)`. Learned: how to read
   two cells on the plan and count what changes in each number.

2. `the-dark-tunnel`, *The dark tunnel* / *El túnel oscuro*. Inside the dark tunnel, where
   nothing is seen. Its other end is cell (19, 1). Goals: walk out at the tunnel's other
   end, cell (19, 1) (say the cell); bonus: look at which cell you are on with `position`.
   Intro, FIXED:

   ¡Qué oscuro! En este túnel no se ve nada... y por algún motivo, ni siquiera el mapa nos
   muestra. Lo que sí vemos en el mapa es la salida del túnel, en la casilla (19, 1).
   ¡Podemos mirar dónde está {el mago|la maga}, contar los pasos y caminar a ciegas!

   END. Starting code: a comment to print where the wizard stands, naming `position` and
   `print`, and two for the moves, `move_up` and `move_right`. Solution:
   `print(wizard.position)`, `wizard.move_up(2)`, `wizard.move_right(4)`. Outro: we looked
   at our position and walked out: the three come out of the dark, into a lit corridor.
   Learned: that a program sees its position even where nothing is seen.

3. `the-tunnel-exit`, *The tunnel's exit* / *La salida del túnel*. Out of the tunnel, into a
   corridor that a second corridor crosses. Dask comes up that second corridor, from below,
   toward our row, looking up. If we cross now he sees us: wait two ticks for him to go by,
   then walk to the mark, by the first statue. Goals: reach the mark; do not let Dask see
   you. Starting code: a comment to wait with `wait`, a comment for the walk with
   `move_right`; neither gives the numbers. Solution: `wizard.wait(2)`,
   `wizard.move_right(9)`. Hints: on the idea of letting him go by; on counting the ticks,
   two; on the walk, nine cells. Outro: he went by without seeing us, and up ahead, among
   the statues, Dask again. Learned: what `wait` does and that its number says how many
   ticks.

4. `by-the-statues`, *By the statues* / *Junto a las estatuas*. Dask stands still between
   the first two statues, looking up or down. We are against the top wall: if he looks up,
   we go down two and pass below him; if he looks down, we cross straight; then down into
   the corridor between the second and the third statue, where the mark is. Goals: reach
   the mark; do not let Dask see you. Starting code: a comment for the condition (if Dask
   looks up, go down two cells with `move_down`), a comment for the walk right with
   `move_right`, a comment for the walk down with `move_down`; no numbers but the two the
   brief gives. Solution: `if dask.facing == "up":` with `wizard.move_down(2)` moved in, then
   `wizard.move_right(4)`, `wizard.move_down(3)`. Ways: `looking_up` *Dask looks up* / *Dask
   mira hacia arriba*; `looking_down` *Dask looks down* / *Dask mira hacia abajo*. Nothing
   about ways in the intro. Learned: that `if` does its lines only when its condition is
   true, and what comes after it always.

5. `left-or-right`, *Left or right* / *Izquierda o derecha*. A room with two doors in its
   bottom wall, `left_door` and `right_door`. One is locked; no key anywhere. Beyond them a
   corridor with the mark at its right. We can look at what the door knows,
   `left_door.locked`. Goals: reach the mark. Starting code: comments: look with `locked`
   whether the left door is locked; if it is, walk to the right door, `move_down` and
   `move_right`, open it with `open`, go through and along the corridor; else the same by
   the left door. Solution: `if left_door.locked:`, moved in: `wizard.move_down(3)`,
   `wizard.move_right(3)`, `right_door.open()`, `wizard.move_down(3)`, `wizard.move_right(3)`;
   `else:`, moved in: `wizard.move_down(3)`, `wizard.move_left(3)`, `left_door.open()`,
   `wizard.move_down(3)`, `wizard.move_right(9)`. Ways: `left_locked`, `right_locked`, as
   they are. Learned: that `if` and `else` can look at what a thing knows, and choose the
   way by it.

6. `the-wrong-door`, *The wrong door* / *La puerta equivocada*. As it is, by these rules:
   the given program exactly as it is, comments none; hints: the first says it goes to the
   locked door in both, the second which lines belong under `if` and which under `else`.
   Ways as the last level. Learned: how to read a condition and see which branch runs.

7. `the-three-doors`, *The corridor of three doors* / *El pasillo de las tres puertas*. As it
   is, by these rules; the nine lines exactly as they are. Goals: reach the mark in the arch
   at the top; in fewer than 5 lines.

8. `past-the-teacher`, *Past the teacher* / *Pasar al profesor*. As it is, by these rules.
   The intro without the words *ningún número fijo de esperas servirá*; it says instead:
   *no sabemos cuánto tiempo mirará hacia aquí, así que esperaremos mientras mire*. Goals:
   reach the mark in the arch below; do not let Dask see you. Ways as they are.

9. `the-moving-slab`, *The slab that comes and goes* / *La losa que va y viene*. As it is, by
   these rules; never *piedra* for the slab, *losa* and *agujero*. Goals: reach the mark;
   bonus: look at `in_place`. The outro without *preguntarle*: it says what they see ahead.

10. `the-dark-room`, *The dark room* / *La sala oscura*. As it is, by these rules.

11. `the-night-walk`, *The night walk* / *El paseo nocturno*. As it is, by these rules; its
    bonus: look at `in_place`. No `learned`.
