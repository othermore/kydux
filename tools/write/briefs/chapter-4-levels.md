---
outputs:
  - content/levels/the-shed/text.en.json
  - content/levels/the-shed/text.es.json
  - content/levels/the-brooms-in-a-row/text.en.json
  - content/levels/the-brooms-in-a-row/text.es.json
  - content/levels/the-brooms-in-the-straw/text.en.json
  - content/levels/the-brooms-in-the-straw/text.es.json
  - content/levels/the-check/text.en.json
  - content/levels/the-check/text.es.json
context:
  - docs/dev/story.md
  - content/levels/the-three-doors/text.en.json
  - content/levels/the-three-doors/text.es.json
  - content/levels/the-dark-room/text.es.json
  - content/levels/by-the-statues/text.es.json
---
Write the texts of the shed's four levels, 1 to 4 of chapter 4, *The broom*, in English and Spanish: the
files listed. All eight levels are described below, so that the texts follow on. The
owner's design of the chapter is given below in Spanish, sections 1 and 3: section 3
says what each level is about. Where this brief and the design differ on a cell or a
number, this brief wins: its cells are the final ones. Three of chapter 3's levels are
given for their voice and their shape.

## Where it happens, and who speaks

By morning, outdoors behind the castle. In the broom shed's four levels `{friend}`
speaks every intro and outro, with `{mate}` beside them; on the lake's edge and the
two long fields Ilda, the flying teacher, speaks them, warm, patient and a little
funny. Zarek, a pupil a year older, quick and proud, races the wizard in the last two.
Keep the story moving a little from level to level.

## What the child knows by now

All of chapters 1 to 3: programs, objects and methods, comments, arguments, strings,
`say`, `pick_up`, a spell cast with the wand, attributes and `print`, `find_nearest`
kept in a variable, `None`, `door.open()` beside a door, `distance_to`, a sum and a
subtraction with names, a level played in several ways; the grid's cells, x from the
left and y from the top, both from 0, `wizard.position` and `thing.position` and a
position's `x` and `y`; `wait`; comparing with `==` and `not`; `if` and `else`; the
`for` loop counting with `range`, and `while`; the spells *zelim*, *fendra*, *orvim*,
*kirra* and *osto*. Never explain them again: a sentence may recall one in a few words.

In chapter 4, before each level, the lessons: *Lists* (a list, `len`,
`wizard.find_all`), *For each one* (`for broom in brooms:`, `broom.untie()`), *An if
inside the loop* (`if` inside `for`, `broom.knotted`), *Drevo* (the spell lifts the
broom; the moves fly, over water, three times as fast), *An action of your own* (`def`,
a function, called by its name with brackets), *Arguments of your own* (a function's
arguments).

## Words the owner has ruled on

- A program **looks at** an attribute and **uses** a method; it never *asks*: never
  *preguntar*, *pregunta*, *ask*, *question*.
- A metaphor stands only where its idea is first explained, beside its programming
  word (*a list*, *una lista*; *a function*, *una función*; *an argument*, *un
  argumento*); after that, the programming word, recalled once in parentheses at most.
  Never *bajo un nombre* / *under a name*.
- The computer, the game, runs the program, never "the castle".
- `{friend}` is the friend met at the gate (the wizard's other gender, the friend's own
  gendered words in double braces in Spanish); `{mate}` is the dormitory mate (the
  wizard's own gender, single braces); `{wizard}` is the wizard. Nuri and Teku are
  never named in a text: write `{friend}` and `{mate}`. Ilda, Zarek and Rinlo are named.
  The older pupil at the end is never named: the children do not know his name.
- Spanish from Spain, natural, for a child of eight; English that says the same.

## Each level's file

A JSON object with exactly these keys:

- `title`: the level's name, given below in both languages.
- `goals`: a list of strings, as many as the level's goals below and in their order,
  each a short sentence. A bonus goal's sentence is plain: the game writes *Bonus:*
  before it.
- `starting_code`: the program the level starts with, one string, `\n` between lines
  and at the end, as each level below says. A practice's comments (`# ...`, in the
  child's language), one a step, say in the child's words what to do and name the
  method or the word of the step in backquotes, and never give the numbers or the
  program. A fix or an improve level starts with the whole program given below, its
  code exactly as given, with the comment above it that the level says.
- `hints`: three, from the gentlest, on the idea, to the one that nearly says it all.
  A hint never is, quotes or spells out a line of the solution, not even the first or
  the shortest, and never quotes its `for`, `if` or `def` line: it points at the idea,
  the direction or the method by its name alone, and may give numbers.
- `intro`: what the speaker says before the level, one to three sentences: the
  situation, and the cells and numbers this brief names, never the solution.
- `outro`: what the speaker says after a win, one or two sentences that move the story
  on to what comes next.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says what the idea
  is and what the child can now do with it.
- `ways`: only for a level played in several ways: an object from each way's id to its
  words, a few words each, as below.

Text between backquotes is shown as code everywhere, in intros, goals and learned too.

## The levels

A *way* is one of the versions of a level that the same program must win. *The
solution* is for you, so that the hints are true; it never appears in a text.

1. `the-shed`, *The shed* / *El cobertizo*. Practice 1. In the shed, the wizard just
   inside the door, on (9, 8). Somewhere in the straw lie the class's brooms, hardly
   seen, each with the black thread knotted in its twigs; nobody knows how many there
   are: six, eight or nine, by the way played. `find_all` finds them all and shows
   them. Goals: say how many brooms there are, with `say`; bonus: print the list with
   `print`. Starting code: three comments: find all the brooms (`find_all`), print the
   list (`print`), say how many there are (`say`, `len`). Solution: `brooms =
   wizard.find_all("broom")`, `print(brooms)`, `wizard.say(len(brooms))`. Ways: `six`
   "six brooms", `eight` "eight brooms", `nine` "nine brooms". Learned: what a list is,
   that `len` says how many values it has, and that `find_all` gives every thing of a
   kind as a list, even hidden ones.
2. `the-brooms-in-a-row`, *The brooms in a row* / *Las escobas de la fila*. Practice
   2. The wizard on (9, 8). On row 6, from column 6 to the right, side by side, lie three,
   four or five knotted brooms, by the way. Go up 2 and left 3 to the first, then for
   each broom of the list: untie it standing on it, and step right to the next.
   Goals: no broom left knotted; walk along the row at least as far as cell (9, 6);
   bonus: use `for`. Starting code: a comment for going up (`move_up`), one for going
   left (`move_left`), one for the list (`find_all`), and one for the loop that, for each
   broom, unties it (`untie`) and steps right (`move_right`). Solution:
   `wizard.move_up(2)`, `wizard.move_left(3)`, `brooms = wizard.find_all("broom")`,
   `for broom in brooms:`, moved in `broom.untie()` and `wizard.move_right()`. Ways:
   `three` "three brooms in the row", `four` "four brooms", `five` "five brooms".
   Learned: that a `for` over a list runs its lines once for each value, and that only
   a loop unties every broom when nobody knows how many there are.
3. `the-brooms-in-the-straw`, *The brooms in the straw* / *Las escobas de la paja*.
   Practice 3. `{mate}` has stacked the row's brooms by the bench. The wizard is at
   the row's end, on (11, 6). The others lie scattered in the straw, three or four, each
   left of and never above the one before; the last always on (6, 8). For each: how many
   cells left and how many down from where the wizard stands, from the two numbers of
   both positions, walk them, untie. A move of zero steps walks nothing. Goals: no
   broom left knotted; end on (6, 8); bonus: use `x`. Starting code: a comment for the
   list (`find_all`), one for the loop, two for the two counts (left and down, with
   `position.x` and `position.y`), two for the moves (`move_left`, `move_down`) and one
   for the untie (`untie`). Solution: the loop with `left = wizard.position.x -
   broom.position.x`, `down = broom.position.y - wizard.position.y`, the two moves and
   the untie. Ways: `three` "three brooms in the straw", `four` "four brooms",
   `four_high` "four brooms, one on the row above". Learned: that inside the loop a
   program works with that turn's broom, so the same counts serve for every one.
4. `the-check`, *The check* / *La revisión*. Fix 1. The wizard on (6, 8). `{mate}` has
   laid every broom on the floor, from the corner to the hay, for a last look: six,
   eight or nine; two or three are still knotted (they escaped). `{friend}` turned the
   last level's program right and up, and it stops at the first broom, which has no
   knot: untying a broom with no knot is an error. The fix: untie only if the broom is
   knotted, an `if` inside the loop. Goals: no broom left knotted; end on the last broom,
   (13, 6); the program ends with no error; bonus: use `knotted`. Starting code: a
   comment from `{friend}` saying this is the program that checks every broom and that it
   stops at the first one, then exactly this program:
   ```
   brooms = wizard.find_all("broom")
   for broom in brooms:
       right = broom.position.x - wizard.position.x
       up = wizard.position.y - broom.position.y
       wizard.move_right(right)
       wizard.move_up(up)
       broom.untie()
   ```
   Solution: the same with `if broom.knotted:` and `broom.untie()` moved in under it.
   Ways: `six` "six brooms, two knotted", `eight` "eight brooms, two knotted", `nine`
   "nine brooms, three knotted". Learned: that an `if` inside a `for` decides in each
   turn, and that a method that needs something is used after looking at the attribute
   that says it.
5. `the-first-flight`, *The first flight* / *El primer vuelo*. Practice 4. Ilda speaks.
   On the lake's edge: the wizard on the gravel path, (1, 7), with the broom Ilda lent;
   the path ends on a short jetty, (7, 7) to (9, 7); then the lake's arm, water no one
   walks on; then the lawn and the round white stone, (14, 7). Ilda: walk to the jetty's
   end, there the word, and fly without stopping to the stone. Goals: land on the white
   stone; bonus: cast *drevo* from the jetty. Starting code: three comments: walk to the
   end of the jetty (`move_right`), the word that lifts the broom (`cast`), fly to the
   stone (`move_right`). Solution: `wizard.move_right(8)`, `wizard.cast("drevo")`,
   `wizard.move_right(5)`. Learned: that a spell can change how the wizard moves: flying,
   the same moves cross what walking cannot, and much faster.
6. `the-rings`, *The rings* / *Los aros*. Improve 1. Ilda speaks. The long ring field:
   the wizard on the chalk start line, (4, 7), the broom lent. Six rings stand in three
   pairs on row 8: (5, 8) and (7, 8); (18, 8) and (20, 8); (33, 8) and (35, 8). Between the
   first pair and the second, a clump of tall trees reaching up to the hedge: it is passed
   below; between the second and the third, a pond: it is passed above; at the end, the
   white stone, (37, 9). Each pair is flown the same way. Ilda's program does it all,
   written out: 21 lines. Make it shorter with a function for the pair, called in the
   three places; a `for` cannot do it, since what lies between the pairs is different
   each time. Goals: fly through the six rings in order; land on the white stone; fewer
   than 18 lines. Starting code: a comment from Ilda saying the pair of rings is written
   three times and to give it a name, then exactly this program:
   ```
   wizard.cast("drevo")
   wizard.move_right(1)
   wizard.move_down(2)
   wizard.move_right(2)
   wizard.move_up(2)
   wizard.move_right(2)
   wizard.move_down(6)
   wizard.move_right(9)
   wizard.move_up(6)
   wizard.move_down(2)
   wizard.move_right(2)
   wizard.move_up(2)
   wizard.move_right(2)
   wizard.move_up(2)
   wizard.move_right(11)
   wizard.move_down(2)
   wizard.move_down(2)
   wizard.move_right(2)
   wizard.move_up(2)
   wizard.move_right(2)
   wizard.move_down(2)
   ```
   Solution: `def two_rings():` with the pair's four moves, then the program with
   `two_rings()` in the three places. Learned: that `def` gives some lines a name, and
   that the name with brackets runs them wherever and as often as it is written.
7. `the-race`, *The race* / *La carrera*. Practice 5. Ilda speaks. The race course: the
   wizard on the start, (10, 7), Zarek beside, on (10, 5). Eight rings on row 8, at columns
   12, 15, 17, 20, 22, 24, 27 and 29; the finish at (31, 7). Ilda's count, which the intro
   says in a child's words: before the start Ilda reads both programs, a tick a line, so a
   long program takes off late; each ring missed costs five ticks before the finish; a tie
   is Zarek's. Zarek's program has 14 lines. The zigzag is the pairs' of the rings level,
   but the stretches differ: one function with two arguments serves for all four pairs.
   Goals: fly through the eight rings in order; cross the finish before Zarek; bonus:
   fewer than 12 lines. Starting code: Ilda's comments: a function with two arguments for
   a pair (`def`), the word (`cast`), the start (`move_right`), the four pairs. Solution:
   ```
   def two_rings(first, second):
       wizard.move_down(2)
       wizard.move_right(first)
       wizard.move_up(2)
       wizard.move_right(second)
   
   wizard.cast("drevo")
   wizard.move_right(2)
   two_rings(3, 2)
   two_rings(3, 2)
   two_rings(2, 3)
   two_rings(2, 2)
   ```
   Learned: that a function takes arguments between its brackets, each with a name it
   uses inside, so one function serves for stretches that differ, and a short program
   takes off sooner.
8. `the-rematch`, *The rematch* / *La revancha*. Improve 2. Ilda speaks. Zarek asks
   for a rematch: he has moved the rings, now at columns 12, 14, 17, 19, 22, 25, 27 and
   29, and flies more neatly: his program has 12 lines and crosses the finish at tick 50.
   The program that won the race starts the level; only the numbers of the calls need
   to change, and not a line may be added, since a tie is Zarek's. Goals: fly through the
   eight rings in order; cross the finish before Zarek. Starting code: a comment from
   Ilda saying this is the program that won the race and Zarek has moved the rings, then
   exactly the race's solution above. Solution: the calls `two_rings(2, 3)`, `(2, 3)`,
   `(3, 2)`, `(2, 2)`. Learned: that the arguments are what changes and the function what
   stays, so a program well made is changed by its numbers.

## The owner's design, in Spanish

## 1. La historia en una página

*Escrita para una maga; para un mago, Teku y Nuri se intercambian como siempre.*

**La mañana siguiente.** Amanece en el dormitorio. Los tres no han dormido mucho: anoche, por la grieta del almacén, oyeron a una voz fría convencer a un alumno mayor de que hiciera algo con las escobas antes de la clase de vuelo de hoy. No pueden contarlo sin confesar que estaban fuera de la cama. Así que bajan al campo de escobas antes del desayuno, cuando aún no hay nadie, para arreglarlo ellos.

**El cobertizo.** El cobertizo de las escobas está detrás del castillo, al borde del césped. La puerta está abierta y dentro alguien ha estado revolviendo: la percha está vacía y las escobas de la clase andan por el suelo, unas puestas en fila junto al banco y otras tiradas entre la paja, donde apenas se ven. Teku levanta una y encuentra, escondido entre las ramas, un hilo negro anudado: un nudo encantado que haría que la escoba se encabritara en el aire y tirara a quien la monte. «La voz le dijo que lo hiciera en todas. Pero ¿cuántas son? ¿Y dónde están?» Aquí nacen las **listas** (ver todas las escobas de una vez aunque la paja las tape), el **bucle sobre una lista** (desatar el nudo de cada una de la fila, y luego ir a cada una de las tiradas contando casillas) y el **`if` dentro del bucle** (repasarlas todas por si alguna se ha escapado).

**La clase de vuelo.** Cuando terminan, llega Ilda con la clase y con Zarek, un alumno de segundo, rápido y presumido, que ya sabe volar y lo dice. Ilda enseña la palabra que levanta la escoba, **drevo**, y manda el primer ejercicio: cruzar el brazo del lago hasta la piedra blanca de la otra orilla. Volar cruza lo que andar no puede, y es mucho más rápido. Luego, el campo largo de los aros: tres parejas de aros, con un grupo de árboles entre la primera y la segunda que hay que pasar por arriba, y un estanque entre la segunda y la tercera que hay que pasar por abajo. El programa que lo hace es largo y repite tres veces el mismo tramo de dos aros, con una maniobra distinta en medio cada vez; la maga aprende a darle un nombre a esas líneas para usarlas donde haga falta: **una acción propia** (`def`). Zarek se ríe de lo despacio que van los de primero.

**La carrera.** Ilda deja que Zarek y la maga corran la pista larga: ocho aros a distancias distintas y la meta al fondo. La cuenta de Ilda es la de siempre en Arvelia: antes de dar la salida lee tu programa, un tick por línea, así que un programa largo despega tarde; cada aro saltado son cinco ticks de penalización antes de cruzar la meta; Zarek vuela a la vista y llega cuando llega. La maga escribe su programa con una **acción con argumentos** (cada tramo es distinto, pero es el mismo movimiento) y gana por poco. Zarek pide la revancha con los aros cambiados de sitio y vuela más fino: la maga solo cambia los números de sus llamadas y vuelve a ganar, pero sin una línea de más. Zarek pierde bien: «La próxima no te dejo». Ilda, que ha visto el hilo negro en la paja del cobertizo sin saber quién lo puso, le regala a la maga la escoba con la que ha volado: ya es suya. Al borde del campo, apartado, un alumno mayor masculla algo mirando las escobas: *«...dijo que nadie se haría daño... que así se acabarían las clases de vuelo...»*. Los tres se miran: es él, el de la grieta. No saben cómo se llama. La voz fría sigue siendo un misterio.

**El tono.** Luminoso: es el primer capítulo a la luz del día desde la llegada. El miedo de anoche se convierte en una mañana de aire libre, agua y hierba cortada, y el villano no aparece más que en el hilo negro. Las risas: Zarek y sus fanfarronadas, Nuri que no se fía de las escobas, Teku que quiere volar ya.

---

## 3. Los escenarios y los niveles

Cuatro escenas al aire libre por la mañana, pedidas igual: una parte del terreno detrás del castillo vista desde arriba, el lugar del nivel en medio y alrededor más césped, setos, árboles, el agua del lago o el muro del castillo; nada de cielo ni de negro. El cobertizo y la orilla son de 20 × 15 casillas; los dos campos de aros, de 42 × 18 (imágenes 21:9; la cámara sigue al mago, como en el campo del capítulo 1). Sobre cada imagen va el nivel con su ruta: **S** donde empieza, **E** donde acaba (relleno si el juego muestra la marca, hueco si no), **B** una escoba (con nudo en marrón, sin nudo en gris), los aros numerados en el orden en que se pasan, en azul la ruta del mago y en naranja la de Zarek.

**Las escobas y los aros los dibuja el juego.** Gemini no respeta las columnas que se le piden: en tres pistas seguidas igualó los huecos entre los aros o los apiló de dos en dos. Así que las escobas y los aros se tratan como las llaves: una cosa (`broom`, `ring`) con su sprite, que el juego dibuja en la casilla que diga el nivel; el sprite del aro se recorta de la pintura buena del campo de los aros (`scene-ring-field-2`), el de la escoba se pide a Gemini. Las escenas se piden vacías: la base sin cosas que se muevan, como manda el método del capítulo 4 en adelante. Las casillas de abajo son las de la rejilla pintada, leídas a ojo; las definitivas las da la herramienta y, donde un obstáculo caiga una casilla más allá, el nivel conserva su forma (sus maniobras, sus cuentas) y las casillas se mueven con la pintura, como en el capítulo 3.

### Escena 1 — El cobertizo de las escobas (niveles 3, 5, 6 y 8, y la historia 1)


Un cobertizo largo de madera con el techo quitado, al borde del césped y bajo el muro trasero del castillo: la percha vacía en la pared de arriba, el suelo de tablas con paja amontonada en los bordes y despejado en medio, el banco de trabajo y el barril a la izquierda, la paca de heno a la derecha, la puerta doble abierta abajo y el camino de grava que viene del borde inferior. Dentro se anda por las filas 6, 7 y 8, columnas 6 a 13 (el banco ocupa las columnas 4 y 5, la paca las 14 a 16); la puerta es (9, 9) y (10, 9). Las escobas no están pintadas: el juego las dibuja donde el nivel diga. Salió a la primera y vale.

#### Nivel 3 — El cobertizo (Práctica 1, `level:the-shed`)


- **Empieza:** dentro de la puerta, (9, 8). Teku y Nuri al lado.
- **Acaba:** en el mismo sitio; no hay marca ni se anda.
- **Qué hay que hacer.** Entre la paja hay escobas que apenas se ven; son seis, ocho o nueve según la partida (tres formas: las mismas casillas que tendrán después las de la revisión). Teku: «Antes de nada: ¿cuántas hay? Si falta alguna, alguien se la ha llevado.» `find_all("broom")` las encuentra todas y las enseña (su silueta entre la paja, como `reveal`); la lista impresa las nombra con su casilla; `len` cuenta.
- **El código:**

  ```python
  brooms = wizard.find_all("broom")
  print(brooms)
  wizard.say(len(brooms))
  ```

- **Objetivos:** decir cuántas escobas hay (`say` con el número justo, en las tres formas). Extra: la lista impresa.
- **Lo que se aprende:** una variable puede guardar varias cosas a la vez, en orden: una lista; `len` dice cuántas; `find_all` da la lista de todas las cosas de una clase, aunque no se vean.

#### Nivel 5 — Las escobas de la fila (Práctica 2, `level:the-brooms-in-a-row`)


- **Empieza:** en (9, 8).
- **Acaba:** en la casilla siguiente a la última escoba de la fila, sin marca (distinta en cada forma, como en los niveles de varias formas del capítulo 3).
- **Qué hay que hacer.** Rinlo dejó una parte de las escobas puestas en fila en el suelo, junto al banco, pegadas una a otra en la fila 6 desde la columna 6: tres, cuatro o cinco (tres formas). Cada una tiene el hilo negro anudado entre las ramas (no se ve: está dentro). Hay que ir a la primera (dos arriba, tres a la izquierda) y, para cada escoba de la lista, desatarla de pie sobre ella y dar un paso a la derecha, hasta la siguiente. `find_all` las da en orden, de la más cercana a la más lejana, que desde el extremo izquierdo es de izquierda a derecha.
- **El código:**

  ```python
  wizard.move_up(2)
  wizard.move_left(3)
  brooms = wizard.find_all("broom")
  for broom in brooms:
      broom.untie()
      wizard.move_right()
  ```

- **Objetivos:** ninguna escoba con nudo (en las tres formas). Extra: el programa usa `for`.
- **Lo que se aprende:** `for broom in brooms:` hace sus líneas una vez por cada escoba, y dentro `broom` es cada vez la siguiente; como no se sabe cuántas son, solo un bucle las desata todas.

#### Nivel 6 — Las escobas de la paja (Práctica 3, `level:the-brooms-in-the-straw`)


- **Empieza:** al final de la fila, (11, 6). Las de la fila ya no están (Nuri las ha apilado junto al banco: no son cosas del nivel).
- **Acaba:** sobre la última escoba de la paja, (6, 8), en las tres formas, sin marca.
- **Qué hay que hacer.** Las que quedan están tiradas por la paja, cada una en una casilla distinta, siempre a la izquierda y no más arriba que la anterior (tres formas: tres o cuatro escobas). Para cada una: cuántas casillas a la izquierda y cuántas abajo desde donde está el mago, con `position.x` y `position.y` (la lección de las dos coordenadas del capítulo 3), andarlas, desatar. Un movimiento de cero pasos no hace nada (D133), así que la fórmula vale aunque la escoba esté en la misma fila.
- **El código:**

  ```python
  brooms = wizard.find_all("broom")
  for broom in brooms:
      left = wizard.position.x - broom.position.x
      down = broom.position.y - wizard.position.y
      wizard.move_left(left)
      wizard.move_down(down)
      broom.untie()
  ```

- **Las formas:** A, tres escobas en (10, 7), (8, 7) y (6, 8); B, cuatro en (10, 7), (9, 8), (7, 8) y (6, 8); C, cuatro en (10, 6), (9, 7), (7, 7) y (6, 8). En las tres, la distancia desde (11, 6) crece de una a la siguiente, que es el orden en que `find_all` las da, y cada una está a la izquierda y no más arriba que la anterior.
- **Objetivos:** ninguna escoba con nudo. Extra: el código usa `x`.
- **Lo que se aprende:** dentro del bucle se puede calcular con la escoba de esa vuelta: su casilla es distinta en cada vuelta, y el mismo cálculo sirve para todas.

#### Nivel 8 — La revisión (Arreglo 1, `level:the-check`)


- **Empieza:** en (6, 8), donde acabó el nivel 6.
- **Acaba:** sobre la última escoba de la revisión, (13, 6), sin marca.
- **Qué hay que hacer.** Ilda está al llegar. Nuri ha recogido todas las escobas y las ha dejado en el suelo, del rincón a la paca, para repasarlas: seis, ocho o nueve según la forma, y dos o tres siguen con nudo (se le escaparon a Teku). Teku saca el programa del nivel anterior, vuelto hacia la derecha y hacia arriba, y falla en la primera escoba, que no tiene nudo: *esta escoba no tiene nudo*. Arreglo: desatar solo si `broom.knotted`, con el `if` metido en el bucle y `untie` metido en el `if` (ocho espacios).
- **El programa dado** (el de Teku):

  ```python
  brooms = wizard.find_all("broom")
  for broom in brooms:
      right = broom.position.x - wizard.position.x
      up = wizard.position.y - broom.position.y
      wizard.move_right(right)
      wizard.move_up(up)
      broom.untie()
  ```

- **El arreglo:** la última línea pasa a ser

  ```python
      if broom.knotted:
          broom.untie()
  ```

- **Las formas:** A, seis escobas en (7, 8), (8, 7), (9, 7), (10, 6), (12, 6) y (13, 6), con nudo la (9, 7) y la (13, 6); B, ocho en (7, 8), (7, 7), (8, 7), (9, 7), (10, 6), (11, 6), (12, 6) y (13, 6), con nudo la (8, 7) y la (11, 6); C, nueve, las de B más (9, 6), con nudo la (7, 7), la (10, 6) y la (12, 6). Desde (6, 8) cada escoba está a la derecha y no más abajo que la anterior, y la distancia crece.
- **Objetivos:** ninguna escoba con nudo; el programa termina sin error. Extra: el código usa `knotted`.
- **Lo que se aprende:** un `if` dentro de un `for` decide en cada vuelta; una acción que necesita algo (un nudo que desatar) se mira antes con su atributo.

### Escena 2 — La orilla del lago (nivel 11 y la historia 2)


El borde del campo donde lo corta un brazo del lago, de arriba abajo de la imagen (columnas 8 a 12): el camino de grava viene del borde izquierdo por la fila 7 y acaba en un embarcadero corto de tablas, (7, 7) a (9, 7); al otro lado, el césped sigue hasta la tapia de piedra de la derecha, con la piedra blanca redonda en (14, 7), la marca de aterrizaje. Arriba la hilera de árboles, abajo los juncos. No hay puente ni vado: el agua no se pisa. Salió a la primera y vale.

#### Nivel 11 — El primer vuelo (Práctica 4, `level:the-first-flight`)


- **Empieza:** en el camino, (1, 7), con la escoba que Ilda le ha dado (`carrying: wand, broom`).
- **Acaba:** en la piedra blanca, (14, 7), con marca.
- **Qué hay que hacer.** Ilda: «Hasta el final del embarcadero andando. Allí, la palabra. Y no pares hasta la piedra.» Andar hasta (9, 7); `wizard.cast("drevo")` levanta la escoba; a partir de ahí los mismos `move` vuelan, cruzan el agua y van tres veces más deprisa. Si el programa intenta cruzar andando, el mundo dice que el agua no se pisa, y esa es la pista.
- **El código:**

  ```python
  wizard.move_right(8)
  wizard.cast("drevo")
  wizard.move_right(5)
  ```

- **Objetivos:** llegar a la piedra. Extra: *drevo* lanzado desde el embarcadero, no desde el césped (Ilda quiere que despeguen sobre el agua).
- **Lo que se aprende:** un hechizo que cambia cómo se mueve el mago: volando, los movimientos de siempre pasan por donde andando no se puede, y mucho más rápido. La escoba se posa sola donde el programa termina.

### Escena 3 — El campo largo de los aros (nivel 13)


Un césped largo (42 × 18) segado a rayas, con dos obstáculos: un grupo de tres árboles altos a un cuarto del campo (columnas 10 a 16, filas 4 a 11, pegado al seto de arriba) y un estanque pequeño a dos tercios (columnas 26 a 31, filas 7 a 11); la raya de salida en la columna 4, la piedra blanca de aterrizaje en (37, 9), el seto y el lago arriba, los bancos y el baúl abajo. Salió a la primera. Los seis aros los pone el juego en tres parejas: antes de los árboles, entre los árboles y el estanque, y después del estanque. Volando no se pasa por las copas de los árboles ni se vuela a ras del estanque (D186): como los árboles llegan hasta el seto, se pasan por abajo, y el estanque, por arriba. Las pinturas anteriores del campo pequeño (`scene-ring-field-2.jpg`, de la que sale el sprite del aro, y `scene-ring-field-base.jpg`, vacío) quedan en `escenas/`.

#### Nivel 13 — Los aros (Mejora 1, `level:the-rings`)


- **Empieza:** en la raya de salida, (4, 7), ya con *drevo* en el programa dado.
- **Acaba:** en la piedra blanca, (37, 9), con marca.
- **Qué hay que hacer.** El ejercicio de Ilda: tres parejas de aros, cada una igual (por el primero bajando, dos a la derecha, por el segundo subiendo, dos a la derecha), pero entre la primera y la segunda están los árboles, que se pasan por abajo (seis abajo, nueve a la derecha, seis arriba), y entre la segunda y la tercera el estanque, que se pasa por arriba (dos arriba, once a la derecha, dos abajo); al final, dos abajo hasta la piedra. El programa que da Ilda lo escribe todo seguido, veintiuna líneas. Mejora: darle nombre al tramo de dos aros y llamarlo en los tres sitios; las maniobras se quedan entre las llamadas. Un `for` no sirve, porque lo que hay entre las parejas es distinto cada vez.
- **Los aros:** (5, 8), (7, 8); (18, 8), (20, 8); (33, 8), (35, 8). Empieza en (4, 7), sobre la raya; acaba en la piedra, (37, 9).
- **El programa dado** (21 líneas): `cast("drevo")`, `move_right(1)`, los cuatro movimientos de la pareja, los tres de los árboles, los cuatro de la pareja, los tres del estanque, los cuatro de la pareja, `move_down(2)`.
- **El código mejorado** (17 líneas):

  ```python
  def two_rings():
      wizard.move_down(2)
      wizard.move_right(2)
      wizard.move_up(2)
      wizard.move_right(2)


  wizard.cast("drevo")
  wizard.move_right(1)
  two_rings()
  wizard.move_down(6)
  wizard.move_right(9)
  wizard.move_up(6)
  two_rings()
  wizard.move_up(2)
  wizard.move_right(11)
  wizard.move_down(2)
  two_rings()
  wizard.move_down(2)
  ```

- **Objetivos:** pasar los seis aros en orden y llegar a la piedra; en menos de 18 líneas.
- **Lo que se aprende:** `def` da un nombre a unas líneas; escribir el nombre con paréntesis las ejecuta, en cualquier sitio del programa y tantas veces como haga falta; una acción propia es como `move_right`, pero inventada por ti.

### Escena 4 — La pista de la carrera (niveles 15 y 16, y la historia 3)


La pista larga, 42 × 18: un césped segado a rayas con un rectángulo de cal, cuyo lado izquierdo (columna 10) es la salida y cuyo lado derecho (columna 31), con un poste y un banderín en cada punta, es la meta; la valla y la orilla del lago arriba; la grada de la clase abajo; árboles a los lados y una cancela en el seto de la derecha. Salió a la primera. Los ocho aros los pone el juego en la fila 8 entre la salida y la meta. Las pistas anteriores (20 × 15, con aros pintados o vacía) quedan en `escenas/scene-race-course*.jpg` y `scene-race-base.jpg`.

**La cuenta de Ilda** (D189): antes de la salida, Ilda lee los dos programas, un tick por línea (las líneas que cuentan son las de `lines_under`: ni vacías ni comentarios), y cada corredor despega cuando Ilda termina el suyo: Zarek tiene un programa de un número de líneas que el nivel dice, así que despega en ese tick y vuela su ruta a la vista hasta cruzar la meta en un tick fijo; el mago despega en el tick de sus líneas. Cada aro saltado son cinco ticks de penalización, que el mago cumple dando vueltas ante la meta antes de cruzarla. Gana quien cruza antes; el empate es de Zarek. La tarjeta final enseña la cuenta: *líneas + vuelo + penalización = tu tick; Zarek, el suyo*.

#### Nivel 15 — La carrera (Práctica 5, `level:the-race`)


- **Empieza:** en la raya de salida, (10, 7); Zarek a su lado, en (10, 5).
- **Acaba:** en la meta, (31, 7), con marca.
- **Qué hay que hacer.** Los ocho aros en orden y la meta, antes que Zarek. El zigzag es el mismo que en los aros, pero los tramos miden 3, 2, 3, 2, 2, 3, 2 y 2: una acción sin argumentos no sirve, porque cada vez es distinta. Con argumentos sí: `two_rings(3, 2)`, `two_rings(3, 2)`, `two_rings(2, 3)` y `two_rings(2, 2)`. El vuelo limpio son 38 ticks (el hechizo, dos a la derecha, ocho aros de dos y los tramos). Zarek tiene un programa de 14 líneas: despega en el tick 14, vuela 41 ticks con sus florituras y cruza la meta en el 55. El programa sin función tiene 18 líneas: despega en el 18 y cruza en el 56, un tick tarde. El programa con la función tiene 11: despega antes que Zarek y cruza en el 49. Saltarse un aro ahorra sus dos ticks de bajada o subida y cuesta cinco: nunca compensa.
- **Los aros:** fila 8, columnas 12, 15, 17, 20, 22, 24, 27 y 29.
- **El código:**

  ```python
  def two_rings(first, second):
      wizard.move_down(2)
      wizard.move_right(first)
      wizard.move_up(2)
      wizard.move_right(second)


  wizard.cast("drevo")
  wizard.move_right(2)
  two_rings(3, 2)
  two_rings(3, 2)
  two_rings(2, 3)
  two_rings(2, 2)
  ```

- **Objetivos:** pasar los ocho aros en orden; cruzar la meta antes que Zarek. Extra: en menos de 12 líneas.
- **Lo que se aprende:** una acción propia recibe argumentos entre sus paréntesis, con un nombre cada uno, y dentro usa esos nombres; así el mismo movimiento sirve para tramos distintos, y el programa es corto, que en la pista es rápido.

#### Nivel 16 — La revancha (Mejora 2, `level:the-rematch`)


- **Empieza y acaba** como la carrera; el programa dado es el que ganó la carrera (la solución del nivel 15).
- **Qué hay que hacer.** Zarek ha cambiado los aros de sitio: los tramos miden ahora 2, 3, 2, 3, 3, 2, 2 y 2 (los aros en las columnas 12, 14, 17, 19, 22, 25, 27 y 29; la meta sigue en la 31), y vuela más fino: su programa tiene 12 líneas y su vuelo dura 38 ticks, como el limpio, así que cruza en el 50. Con 11 líneas se cruza en el 49 y se gana por un tick; con una línea de más, empate en el 50, y el empate es de Zarek. Solo hay que cambiar los números de las cuatro llamadas: `two_rings(2, 3)`, `two_rings(2, 3)`, `two_rings(3, 2)`, `two_rings(2, 2)`.
- **Objetivos:** pasar los ocho aros en orden; cruzar la meta antes que Zarek.
- **Lo que se aprende:** los argumentos son lo que cambia; la función, lo que se queda. Un programa bien hecho se adapta cambiando números, no líneas.

---
