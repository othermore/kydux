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
  - drafts/chapter-3/capitulo-3.md
  - content/levels/the-hidden-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
---
Write the texts of chapter 3's eleven levels, in English and Spanish. The owner's
design document is given in full: its section 3 says what each level is about, and
its section 4 how the friend's lessons sound. Where this brief and the design differ
on a cell or a number, this brief wins: its cells are the final ones. Two of chapter
2's levels are given for their voice.

## Where it happens, and who speaks

At night in the castle's passages, the three out of bed. `{friend}`, the friend met
at the gate, speaks every intro and outro, whispering; `{mate}`, the dormitory mate,
is beside them and may be mentioned. Dask is a strict teacher who walks the
corridors with a lantern. Keep the story moving a little from level to level. There
is a naughty child's map in the wizard's hands all along. Write `{friend}`, `{mate}`,
`{wizard}` and the gender braces as rules.md says.

## Each level's file

A JSON object with exactly these keys:

- `title`: the level's name, given below in both languages.
- `goals`: a list of strings, as many as the level's goals below and in their order,
  each a short sentence. A bonus goal's sentence is plain: the game writes *Bonus:*
  before it.
- `starting_code`: the program the level starts with, one string, `\n` between lines
  and at the end, as each level below says. A practice's comments (`# ...`, in the
  child's language), one a step, say in the child's words what to do and name the
  method of the step in backquotes, and never give the numbers or the program.
- `hints`: three, from the gentlest, on the idea, to the one that nearly says it all.
  A hint never is, quotes or spells out a line of the solution, not even the first or
  the shortest, and never quotes the `if`, `while` or `for` line of it: it points at
  the idea, the direction or the method by its name alone, and may give numbers.
- `intro`: what `{friend}` says before the level, one to three sentences, whispering:
  the situation, and the cells this brief names, never the solution.
- `outro`: what `{friend}` says after a win, one or two sentences that move the story
  on to what comes next.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says what the idea
  is and what the child can do with it now. Every level has it but the last,
  `the-night-walk`, which the chapter's closing story sums up.
- `ways`: only for a level played in several ways: an object from each way's id to its
  words, a few words each, as below.

Text between backquotes is shown as code everywhere, in intros, goals and learned too.

## What the child knows by now

All of chapters 1 and 2 (programs, methods, comments, arguments, strings, spells,
attributes and `print`, `find_nearest` under a name, `None`, `door.open()` beside a
door, a level played in several ways). In chapter 3, in order, the lessons before each
level: *The cells* (a cell is two numbers, x from the left and y from the top, both
from 0; `wizard.cast("orvim")` opens the plan); *Where I am* (`wizard.position`,
`key.position`); *True or false* (`==`, `not`, `dask.facing`); *If* (`if`,
`wizard.wait()`, a tick); *Else*; *Repeat* (`for step in range(3):`); *While*; *Light
and slabs* (*kirra*, `slab.in_place`, *osto*). Never explain them again.

## The levels

A *way* is one of the versions of a level that the same program must win. *The
solution* is for you, so that the hints are true; it never appears in a text.

1. `the-doors-corridor`, *The corridor of doors* / *El pasillo de las puertas*. Practice
   1. A long corridor of closed doors with dim rooms behind them, turning up at its far
   end to the arch of a tunnel. The three stand at its left end, on cell (1, 12). There
   is no mark on the floor: the map says the tunnel's mouth is cell (15, 3). Count what
   changes in each number and walk there in two straight moves; going in, they fade
   from sight: the tunnel is enchanted. Goals: walk to the tunnel's mouth, cell (15, 3)
   (say the cell); bonus: open the map with its word. Starting code: two comments, one a
   move, naming `move_right` and `move_up`. Solution: `wizard.move_right(14)`,
   `wizard.move_up(9)`. Learned: how to read two cells on the plan and count what
   changes in each number.

2. `the-dark-tunnel`, *The dark tunnel* / *El túnel oscuro*. Practice 2. Inside the
   enchanted tunnel, where no one is seen, on the scene or on the plan: nothing will
   be seen to move. Its other end is cell (19, 1), at the top right. Ask the program
   where you stand, count, walk blind. Goals: walk out at the tunnel's other end, cell
   (19, 1) (say the cell); bonus: ask where you stand with `position`. Starting code: a
   comment to print where the wizard stands, naming `position` and `print`, and two for
   the moves, `move_up` and `move_right`. Solution: `print(wizard.position)`,
   `wizard.move_up(2)`, `wizard.move_right(4)`. Learned: why a program asks where it is
   instead of looking.

3. `the-tunnel-exit`, *The tunnel's exit* / *La salida del túnel*. Practice 3. Out of
   the tunnel, into a corridor that a second corridor crosses, the one Dask walks up
   and down. The mark is at its far end, by the third statue. Played two ways: `away`,
   Dask walks away down the crossing corridor; `watching`, Dask looks up at the crossing,
   this way, and turns after a moment. Goals: reach the mark; do not let Dask see you.
   Starting code: a comment to ask with `facing` whether Dask looks this way, `"up"`,
   and if so to wait one tick with `wait`, and a comment for the walk, `move_right`.
   Solution: `if dask.facing == "up":`, `wizard.wait()` moved in, then
   `wizard.move_right(13)`. Ways: `away` "Dask walks away", `watching` "Dask looks this
   way". Learned: that a condition does something only when its answer is true, and that
   what helps is knowing which way he faces.

4. `by-the-statues`, *By the statues* / *Junto a las estatuas*. Practice 4. Dask stands
   still in the middle of the wide corridor that goes down beside the statues, three
   cells wide, looking to one side. Played two ways: `looking_left`, `looking_right`. Go
   down the side he does not look at, to the mark in the arch at the bottom. Goals:
   reach the mark; do not let Dask see you. Starting code: the line
   `wizard.move_down(2)` given, then comments: if Dask looks left, go down his right side
   with `move_right`, `move_down` and `move_left`; else (`else`) down his left side; and
   the last steps down into the arch. Solution: `wizard.move_down(2)`; `if dask.facing
   == "left":` with `wizard.move_right()`, `wizard.move_down(3)`, `wizard.move_left()`
   moved in; `else:` with `wizard.move_left()`, `wizard.move_down(3)`,
   `wizard.move_right()` moved in; `wizard.move_down(2)`. Ways: `looking_left` "Dask looks
   left", `looking_right` "Dask looks right". Learned: that `else` gives the other way
   when the condition is false.

5. `left-or-right`, *Left or right* / *Izquierda o derecha*. Practice 5. A room with two
   doors in its bottom wall, `left_door` and `right_door`. One is locked, and it changes
   from night to night; there is no key anywhere. Beyond them a corridor runs along,
   with the mark at its right. Played two ways: `left_locked`, `right_locked`. Goals:
   reach the mark. Starting code: comments: ask with `locked` whether the left door is
   locked; if it is, walk to the right door, `move_down` and `move_right`, open it with
   `open`, go through and along the corridor; else the same by the left door. Solution:
   `if left_door.locked:`, moved in: `wizard.move_down(3)`, `wizard.move_right(3)`,
   `right_door.open()`, `wizard.move_down(3)`, `wizard.move_right(3)`; `else:`, moved in:
   `wizard.move_down(3)`, `wizard.move_left(3)`, `left_door.open()`, `wizard.move_down(3)`,
   `wizard.move_right(9)`. Ways: `left_locked` "The left door is locked", `right_locked`
   "The right door is locked". Learned: that `if` and `else` can ask what a thing knows,
   and choose the way by it.

6. `the-wrong-door`, *The wrong door* / *La puerta equivocada*. Fix 1. The same room on
   another night. `{friend}`'s own program from the last time has its two branches the
   wrong way round: it walks to the locked door in both ways. Goals: reach the mark.
   Starting code: exactly this program, with nothing else, comments included:

   ```
   if left_door.locked:
       wizard.move_down(3)
       wizard.move_left(3)
       left_door.open()
       wizard.move_down(3)
       wizard.move_right(9)
   else:
       wizard.move_down(3)
       wizard.move_right(3)
       right_door.open()
       wizard.move_down(3)
       wizard.move_right(3)
   ```

   Hints: the first says the program goes to the locked door in both ways, the second
   which lines belong under `if` and which under `else`. Ways as the last level.
   Learned: how to read a condition and see which branch runs.

7. `the-three-doors`, *The corridor of three doors* / *El pasillo de las tres puertas*.
   Improve 1. A straight corridor closed by three doors alike, four cells apart.
   `{friend}`'s program opens them in nine lines. Goals: reach the mark in the arch at
   the top; in fewer than 5 lines. Starting code: exactly these nine lines:

   ```
   door = wizard.find_nearest("door")
   door.open()
   wizard.move_up(4)
   door = wizard.find_nearest("door")
   door.open()
   wizard.move_up(4)
   door = wizard.find_nearest("door")
   door.open()
   wizard.move_up(4)
   ```

   Solution: `for step in range(3):` with the first three lines moved in. Learned: that a
   loop repeats its lines, so three doors take four lines, and that `door` is each time
   the next door.

8. `past-the-teacher`, *Past the teacher* / *Pasar al profesor*. Practice 6. The long
   corridor of Dask's round, on row 7, crossed by the corridor you walk down, column 10.
   His lantern reaches a long way: while he faces right he sees the crossing from nearly
   anywhere on his round. Played three ways, each starting him at another point of his
   round, so that no number written in the code wins them all. Stop on (10, 6), the cell
   before the crossing, which he never sees. Goals: reach the mark in the bottom arch;
   do not let Dask see you. Starting code: comments: walk down to the cell before the
   crossing with `move_down`; wait while Dask faces right, with `while`, `facing` and
   `wait`; walk on down. Solution: `wizard.move_down(5)`; `while dask.facing == "right":`
   with `wizard.wait()` moved in; `wizard.move_down(7)`. Ways: `near` "Dask starts at the
   near end", `middle` "Dask starts near his far end", `far` "Dask starts on his way
   back". Learned: that `while` waits as long as something stays true, however long
   that is.

9. `the-moving-slab`, *The slab that comes and goes* / *La losa que va y viene*.
   Practice 7. A corridor with a hole in its floor, three cells ahead, and a stone slab
   that covers it for a few ticks and is gone for as many. The storeroom's arch is at
   the corridor's end, with the mark inside it. Played two ways: `three`, the slab comes
   and goes every three ticks; `four`, every four. Goals: reach the mark; bonus: ask
   `in_place`. Starting code: comments: walk the two steps to the hole's edge,
   `move_right`; wait while the slab is not in place, with `while`, `not`, `in_place` and
   `wait`; walk across. Solution: `wizard.move_right(2)`; `while not slab.in_place:` with
   `wizard.wait()` moved in; `wizard.move_right(3)`. Ways: `three` "Every three ticks",
   `four` "Every four ticks". Learned: that `while not` waits for something that is not
   true yet, and that `slab.in_place` says when.

10. `the-dark-room`, *The dark room* / *La sala oscura*. Practice 8. Inside the
    storeroom's arch, the room dark. In the dark `find_nearest("key")` finds nothing,
    since the key lies far from you, and the next line fails: the first hint says so.
    *kirra* lights the room; then find the key, print its cell, walk to it, pick it up,
    and walk to the cell above the locked door, the mark, and open it from there. The
    door is `store_door`. Goals: pick up the key; open the door; reach the mark; bonus:
    find the key with `find_nearest`. Starting code: comments, one a step: the light,
    finding the key and printing its cell (`find_nearest`, `position`, `print`), the walk
    to it, `pick_up`, the walk to the cell above the door, `open`. Solution:
    `wizard.cast("kirra")`, `key = wizard.find_nearest("key")`, `print(key.position)`,
    `wizard.move_right(4)`, `wizard.pick_up()`, `wizard.move_right()`,
    `wizard.move_down(2)`, `store_door.open()`. Learned: that *kirra* lights a room, and
    then things can be found and say their cell.

11. `the-night-walk`, *The night walk* / *El paseo nocturno*. Practice 9. Under the
    storeroom, on the way home, the chapter together: a key on the floor ahead, a locked
    door, a hole with its slab, and Dask's last corridor, which comes in from the left and
    ends at yours, his lantern reaching far. Played three ways, each starting him at
    another point of his round. Goals: pick up the key; open the door; reach the mark
    in the bottom arch; do not let Dask see you; bonus: ask `in_place`. Starting code:
    comments, one a step, in order: down to the key, pick it up, down to the door, open
    it (`door`), down to the hole's edge, wait for the slab, down to the cell before
    Dask's corridor, wait while he faces right, down to the arch. Solution:
    `wizard.move_down(2)`, `wizard.pick_up()`, `wizard.move_down()`, `door.open()`,
    `wizard.move_down(2)`, `while not slab.in_place:` with `wizard.wait()` moved in,
    `wizard.move_down(3)`, `while dask.facing == "right":` with `wizard.wait()` moved in,
    `wizard.move_down(4)`. Ways: `near`, `middle`, `far`, as in *Past the teacher*. No
    `learned`.
