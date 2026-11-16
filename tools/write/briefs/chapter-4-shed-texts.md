---
outputs:
  - content/levels/the-broom-at-your-feet/text.en.json
  - content/levels/the-broom-at-your-feet/text.es.json
  - content/levels/the-shed/text.en.json
  - content/levels/the-shed/text.es.json
  - content/levels/the-brooms-on-the-wall/text.en.json
  - content/levels/the-brooms-on-the-wall/text.es.json
  - content/levels/the-brooms-in-the-straw/text.en.json
  - content/levels/the-brooms-in-the-straw/text.es.json
  - content/levels/the-check/text.en.json
  - content/levels/the-check/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/sprint-40.md
  - content/levels/the-shed/text.es.json
  - content/levels/the-brooms-in-the-straw/text.es.json
  - content/levels/the-brooms-in-the-straw/text.en.json
  - content/levels/the-check/text.es.json
  - content/levels/the-check/text.en.json
---
Write the texts of the broom shed's five levels, the first five of chapter 4, *The
broom*, in English and Spanish: the files listed. The owner read the chapter and
reshaped the shed: sprint 40's plan, given in full above, says how (its sections 2.1 to
2.4 and the decisions D195 to D199). Where this brief and the plan differ on a cell or
a number, this brief wins. The texts of three of the shed's levels as they were are
given for their voice and their shape; their facts are old.

## Where it happens, and who speaks

The morning after a night the three children overheard, through a crack in a wall, a
cold voice talk an older pupil into tampering with the brooms before today's flying
lesson. They went down to the broom shed before breakfast to put it right. The shed:
a rack along its back wall with eight pegs, one a cell, columns 6 to 13; some brooms
hang on the pegs, others lie scattered in the straw on the floor; each tampered broom
has a black enchanted knot tied in its twigs. `{friend}` speaks every intro and outro,
with `{mate}` beside them.

## The rules of the game the texts lean on

- `find_nearest` and `find_all` find what lies near where the wizard stands: standing
  by the wall, under the rack (row 6), they find the brooms hung on the pegs; standing
  in the straw (rows 7 and 8), the brooms lying there. Nothing else. The broom's lesson
  just before these levels taught it.
- `broom.untie()` takes the knot off, from the broom's own cell when it lies on the
  floor, or from the cell under it when it hangs on a peg. `broom.knotted` is `True`
  while the knot is tied. Untying a broom with no knot is an error that stops the
  program.

## What the child knows by now

All of chapters 1 to 3 (programs, objects and methods, attributes and `print`,
`find_nearest` kept in a variable, `None`, sums with names, a level played in several
ways, the grid's cells and `position`'s `x` and `y`, `if`, `for` with `range`), and in
chapter 4, before each level, the lessons: *The broom and its knot* (the broom, `knotted`,
`untie()`, and that what you find depends on where you stand), *Lists* (a list, `len`,
`wizard.find_all`, one element by its place, `nombres[0]`), *For each one* (`for broom in
brooms:`, and `for i in range(len(brooms)):` with `brooms[i]`), *An if inside the loop*
(`if` inside `for`, `broom.knotted`). Never explain them again.

## Words the owner has ruled on

- The owner's own Spanish, below in quotes, goes into the Spanish files word for word;
  the English says the same, naturally.
- A program **looks at** an attribute and **uses** a method; it never *asks*: never
  *preguntar*, *pregunta*, *ask*, *question*.
- The computer, the game, runs the program, never "the castle".
- `{friend}` is the friend (their gendered Spanish words in double braces,
  `{{amigo|amiga}}`); `{mate}` is the dormitory mate (single braces, `{el|la}`);
  `{wizard}` is the wizard. Nuri and Teku are never named: write `{friend}` and
  `{mate}`.
- Spanish from Spain, natural, for a child of eight; English that says the same, with
  contractions in speech.

## Each level's file

A JSON object with exactly these keys:

- `title`: the level's name, given below in both languages.
- `goals`: a list of strings, as many as the level's goals below and in their order,
  each a short sentence. A bonus goal's sentence is plain: the game writes *Bonus:*
  before it.
- `starting_code`: the program the level starts with, one string, `\n` between lines
  and at the end. A practice's comments (`# ...`, in the child's language), one a step,
  say in the child's words what to do and name the method of the step in backquotes,
  and never give the numbers or the program. The fix level starts with the whole
  program given below, its code exactly as given, with one comment above it.
- `hints`: three, from the gentlest, on the idea, to the one that nearly says it all.
  A hint never is, quotes or spells out a line of the solution, nor its `for` or `if`
  line: it points at the idea, the direction or the method by its name, and may give
  numbers.
- `intro`: what `{friend}` says before the level: the situation, never the solution.
  Where the owner's words are given, they are the intro, word for word in Spanish.
- `outro`: what `{friend}` says after a win, one or two sentences that move the story
  on to the next level.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", what the idea is and what
  the child can now do with it.
- `ways`: only for a level played in several ways: each way's id to a few words.

Text between backquotes is shown as code everywhere.

## The levels

A *way* is one of the versions of a level that the same program must win. *The
solution* is for you, so that the hints are true; it never appears in a text.

1. `the-broom-at-your-feet`, *The broom at your feet* / *La escoba a tus pies*. Practice
   1. The wizard stands just inside the shed's door, on (9, 8), on a broom lying on the
   floor with a knot in its twigs; four brooms hang on the pegs above, knotted too, but
   this level is about the one at the wizard's feet only. Goals: take the knot off the
   broom at your feet; bonus: use `find_nearest`. Starting code: two comments: find the
   broom under your feet with `find_nearest`; take its knot off with `untie`. Solution:
   `broom = wizard.find_nearest("broom")`, `broom.untie()`. Learned: that a broom is an
   object whose `untie()` method takes its knot off, standing on it, and that
   `find_nearest` gives the one you need.
2. `the-shed`, *The shed* / *El cobertizo*. Practice 2. The wizard on (9, 8), by the
   door, in the straw. How many brooms are there in all? Some hang on the pegs (two,
   three or four, by the way), some lie hidden in the straw (four, the one untied a
   moment ago among them). From the straw, `find_all` finds the fallen ones; by the
   wall, two cells up, the hung ones. Goals: say how many brooms there are in all, with
   `say`; bonus: print a list with `print`. Starting code: four comments: find the
   brooms down here with `find_all`; walk up to the wall with `move_up`; find the hung
   ones with `find_all`; say how many there are in all with `say` and `len`. Solution:
   `fallen = wizard.find_all("broom")`, `wizard.move_up(2)`, `hung =
   wizard.find_all("broom")`, `wizard.say(len(fallen) + len(hung))`. Intro: it opens
   with the owner's words, "Pero ¿cuántas son? Y ¿cómo las encontramos?", and then
   `{friend}` reminds that from here one finds the ones in the straw, and by the wall
   the hung ones. Ways: `six` "six brooms", `seven` "seven brooms", `eight` "eight
   brooms". Learned: that `find_all` gives a list of what you find where you stand, and
   that two lists' `len` add up.
3. `the-brooms-on-the-wall`, *The brooms on the wall* / *Las escobas de la pared*.
   Practice 3. The wizard on (9, 8). On the rack hang two, three or four knotted brooms,
   by the way, from the first peg, column 6, rightwards; `{friend}` has set the ones in
   the straw aside for later (say so in a few words). Go up 2 to the wall and left 3 to
   under the first peg, (6, 6); then for each broom of the list: untie it, and step
   right to under the next. Goals: no broom left knotted; walk along the wall at least
   as far as cell (8, 6); bonus: use `for`. Starting code: five comments: walk up to the
   wall with `move_up`; left to under the first peg with `move_left`; find the hung
   brooms with `find_all`; for each broom: untie it with `untie`; a step right with
   `move_right`. Solution: `wizard.move_up(2)`, `wizard.move_left(3)`, `brooms =
   wizard.find_all("broom")`, `for broom in brooms:`, moved in, `broom.untie()` and
   `wizard.move_right()`. Ways: `two` "two brooms on the wall", `three` "three brooms",
   `four` "four brooms". Learned: that a `for` over a list runs its lines once for each
   broom, so that one program serves however many there are.
4. `the-brooms-in-the-straw`, *The brooms in the straw* / *Las escobas de la paja*.
   Practice 4. The wizard on (12, 7), at the top right of the straw: they came down
   from the wall. Three brooms lie in the straw, knotted, by the way: each nearer the
   bottom left corner than the one before, the last always on (6, 8). From where the
   wizard stands, `find_all` gives them nearest first; for each: count how many cells
   left and how many down from where the wizard stands, from the two numbers of both
   positions, walk them, untie. A move of zero steps walks nothing. Goals: no broom
   left knotted; end on (6, 8); bonus: use `x`. Starting code: a comment for the list
   (`find_all`), one for the loop, two for the two counts (left and down, with
   `position.x` and `position.y`), two for the moves (`move_left`, `move_down`) and one
   for the untie (`untie`). Solution: the loop with `left = wizard.position.x -
   broom.position.x`, `down = broom.position.y - wizard.position.y`, the two moves and
   the untie. Intro, the owner's words, in Spanish word for word: "Ya hemos terminado
   con las escobas que estaban colgadas. ¡Las demás están tiradas por la paja! Desde
   donde estás, si usas `find_all` las encontrarás ordenadas empezando por la más
   cercana, y te puedes ir moviendo abajo y a la izquierda para ir desatando todas.
   Puedes calcular cuántos pasos tienes que andar desde donde estás en cada momento
   hasta la siguiente escoba, y así pasar por todas." Ways: `three` "three brooms in
   the straw", `three_low` "three brooms, lower down", `three_mid` "three brooms, in
   between". Learned: that inside the loop a program works with that turn's broom, so
   the same counts serve for every one.
5. `the-check`, *The check* / *La revisión*. Fix 1. The wizard on (6, 8), where the last
   level ended. `{mate}` has hung every broom back on its peg, from column 6: six, seven
   or eight, by the way, and some still have a knot. The program the friends used for
   the wall is given whole, with one comment above it: `wizard.move_up(2)`, `brooms =
   wizard.find_all("broom")`, `for broom in brooms:`, moved in, `broom.untie()` and
   `wizard.move_right()`. It stops at the first broom, which has no knot. Goals: no
   broom left knotted; walk along the wall at least as far as cell (11, 6); the program
   ends with no error; bonus: use `knotted`. Solution: the same program with `if
   broom.knotted:` before the untie, moved in once more, and the step right outside the
   `if`. Intro, the owner's words, in Spanish word for word: "{mate} ha dejado todas las
   escobas ordenadas, colgadas en sus ganchos en la pared. Se ha dado cuenta de que
   algunas todavía tienen un nudo encantado. ¡Algunas se nos escaparon, así que hay que
   repasarlas! He puesto el programa que usamos para recorrer las escobas en la pared,
   para ir una por una desatando el nudo. ¡Pero se para en la primera escoba, porque
   esa no tiene nudo, y desatar una escoba sin nudo es un error! ¿Puedes arreglar el
   programa con un `if`? Para ver si una escoba tiene nudo, se puede usar su atributo
   `knotted`." Ways: `six` "six brooms, two knotted", `seven` "seven brooms, three
   knotted", `eight` "eight brooms, two knotted". Outro: the brooms are safe, and the
   class is heard coming. Learned: that an `if` inside a `for` decides at each turn,
   and that a method that needs something is used after looking at the attribute that
   says it.
