---
outputs:
  - content/lessons/lists/en.md
  - content/lessons/lists/es.md
  - content/lessons/for-each/en.md
  - content/lessons/for-each/es.md
  - content/lessons/checking-each/en.md
  - content/lessons/checking-each/es.md
  - content/lessons/drevo/en.md
  - content/lessons/drevo/es.md
  - content/lessons/an-action-of-your-own/en.md
  - content/lessons/an-action-of-your-own/es.md
  - content/lessons/arguments-of-your-own/en.md
  - content/lessons/arguments-of-your-own/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/lessons/the-two-coordinates/es.md
  - content/lessons/if/es.md
---
Write the six lessons of chapter 4 of Kydux, *The broom*, in English and Spanish. The
owner's design of the chapter is given below in Spanish, sections 1 and 4: section 4
has each lesson, which the owner has read and likes. Keep its ideas, its examples and
its order, and write English that says the same. Where this brief and the design
differ, this brief wins.

The friend, `{friend}`, teaches five of them in the broom shed behind the castle, in
the morning, before breakfast, with `{mate}` beside them: daylight, no whispering.
Ilda, the flying teacher, warm, patient and a little funny, teaches *Drevo* on the
lake's edge. Each lesson is a few short pages, separated by a line with only `---`;
the first page opens with the `#` title, a page's heading is `##`.

## What the child knows by now

All of chapters 1 to 3: programs, objects and methods, comments, arguments, strings,
`say`, `pick_up`, a spell cast with the wand, attributes and `print`, `find_nearest`
kept in a variable, `None`, `door.open()` beside a door, `distance_to`, a sum and a
subtraction with names, a level played in several ways; the grid's cells, x from the
left and y from the top, both from 0, `wizard.position` and `thing.position` and a
position's `x` and `y`; `wait`; comparing with `==` and `not`; `if` and `else`; the
`for` loop counting with `range`, and `while`; the spells *zelim*, *fendra*, *orvim*,
*kirra* and *osto*. Never explain them again: a sentence may recall one in a few words.

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

## The lessons

Each with its title in both languages, its pages, and its block. A block is fenced
```python try, plain Python the child runs and changes on the page, never the wizard:
no move, no cast, no `find_all` (D174). The names in a block are the child's own
words, Spanish in the Spanish lesson and English in the English one. A lesson with a
block ends its last page with it; a lesson with none has none at all. The last page
never says what the button does.

1. `lists`, *Lists* / *Las listas*, two pages. Page 1: a variable may keep several
   values at once, in order, in square brackets and separated by commas:
   `names = ["Teku", "Nuri", "Bimo"]` (here the friends' names are the example's
   values, written as strings, which is right); `print(names)` shows the whole list;
   programmers call this a list. Page 2: `len(names)` says how many values a list has;
   `wizard.find_all("broom")` gives the list of every broom of the place, nearest first,
   as `find_nearest` gave one, and shows them even where the straw covers them; each
   value of that list is a broom, with its `position`. Its block, on page 2: a list of
   three names, printed, and its `len` printed.
2. `for-each`, *For each one* / *Para cada una*, one page: `for broom in brooms:` runs
   the lines moved in under it once for each value of the list, and in each turn
   `broom` is the next one; it is chapter 3's `for`, going through things instead of
   counting; the lines inside, moved in by four spaces, may use `broom`; for a broom,
   `broom.untie()` unties its knot, standing on it. Its block: a list of names and
   `for name in names:` printing each.
3. `checking-each`, *An if inside the loop* / *Un si dentro del bucle*, one page:
   inside a `for` an `if` may go, so that each turn does one thing or another by that
   turn's value; the `if`'s lines are moved in eight spaces, four for the `for` and four
   for the `if`; a broom's `broom.knotted` is `True` while its black thread is still
   knotted, and untying a broom with no knot is an error that stops the program, so a
   program looks at `knotted` before it unties. Its block: `for name in names:` with
   `if name == "Bimo":` printing that Bimo is a cat (in Spanish *es un gato*).
4. `drevo`, *Drevo*, one page, said by Ilda, no block: the word `drevo`, cast with the
   wand, `wizard.cast("drevo")`, lifts the broom the wizard carries; from then on the
   same moves fly; flying crosses water, hedges, fences and benches, and goes three
   times as fast; it does not go through the crowns of the trees nor through walls; the
   broom sets down where the program ends. The spell is cast in the level, not here.
5. `an-action-of-your-own`, *An action of your own* / *Una acción propia*, two pages.
   Page 1: `def two_rings():` and, moved in under it, its lines: this gives those lines
   a name, and programmers call it a function; writing the name with brackets,
   `two_rings()`, runs them, wherever it is written and as many times; the lines of the
   `def` do not run until someone calls the function. Page 2: a loop repeats the same
   lines one after another; a function is used wherever it is needed, with other lines
   between, and the program reads better: one line says *two rings* instead of four
   moves. Its block, on page 2: a `def greet():` that prints two lines, called twice,
   with a different `print` between the two calls.
6. `arguments-of-your-own`, *Arguments of your own* / *Argumentos propios*, one page:
   between the `def`'s brackets go names, the function's arguments; a call gives them
   values, in the same order, as `move_right(3)` is given its 3, and inside the function
   the names are worth those values; so the same function serves for things alike but
   not the same, as two rings at different distances. Its block: `def greet(name):`
   printing a greeting and the name (*Hola* in Spanish), called with two names.

## The owner's design, in Spanish

## 1. La historia en una página

*Escrita para una maga; para un mago, Teku y Nuri se intercambian como siempre.*

**La mañana siguiente.** Amanece en el dormitorio. Los tres no han dormido mucho: anoche, por la grieta del almacén, oyeron a una voz fría convencer a un alumno mayor de que hiciera algo con las escobas antes de la clase de vuelo de hoy. No pueden contarlo sin confesar que estaban fuera de la cama. Así que bajan al campo de escobas antes del desayuno, cuando aún no hay nadie, para arreglarlo ellos.

**El cobertizo.** El cobertizo de las escobas está detrás del castillo, al borde del césped. La puerta está abierta y dentro alguien ha estado revolviendo: la percha está vacía y las escobas de la clase andan por el suelo, unas puestas en fila junto al banco y otras tiradas entre la paja, donde apenas se ven. Teku levanta una y encuentra, escondido entre las ramas, un hilo negro anudado: un nudo encantado que haría que la escoba se encabritara en el aire y tirara a quien la monte. «La voz le dijo que lo hiciera en todas. Pero ¿cuántas son? ¿Y dónde están?» Aquí nacen las **listas** (ver todas las escobas de una vez aunque la paja las tape), el **bucle sobre una lista** (desatar el nudo de cada una de la fila, y luego ir a cada una de las tiradas contando casillas) y el **`if` dentro del bucle** (repasarlas todas por si alguna se ha escapado).

**La clase de vuelo.** Cuando terminan, llega Ilda con la clase y con Zarek, un alumno de segundo, rápido y presumido, que ya sabe volar y lo dice. Ilda enseña la palabra que levanta la escoba, **drevo**, y manda el primer ejercicio: cruzar el brazo del lago hasta la piedra blanca de la otra orilla. Volar cruza lo que andar no puede, y es mucho más rápido. Luego, el campo largo de los aros: tres parejas de aros, con un grupo de árboles entre la primera y la segunda que hay que pasar por arriba, y un estanque entre la segunda y la tercera que hay que pasar por abajo. El programa que lo hace es largo y repite tres veces el mismo tramo de dos aros, con una maniobra distinta en medio cada vez; la maga aprende a darle un nombre a esas líneas para usarlas donde haga falta: **una acción propia** (`def`). Zarek se ríe de lo despacio que van los de primero.

**La carrera.** Ilda deja que Zarek y la maga corran la pista larga: ocho aros a distancias distintas y la meta al fondo. La cuenta de Ilda es la de siempre en Arvelia: antes de dar la salida lee tu programa, un tick por línea, así que un programa largo despega tarde; cada aro saltado son cinco ticks de penalización antes de cruzar la meta; Zarek vuela a la vista y llega cuando llega. La maga escribe su programa con una **acción con argumentos** (cada tramo es distinto, pero es el mismo movimiento) y gana por poco. Zarek pide la revancha con los aros cambiados de sitio y vuela más fino: la maga solo cambia los números de sus llamadas y vuelve a ganar, pero sin una línea de más. Zarek pierde bien: «La próxima no te dejo». Ilda, que ha visto el hilo negro en la paja del cobertizo sin saber quién lo puso, le regala a la maga la escoba con la que ha volado: ya es suya. Al borde del campo, apartado, un alumno mayor masculla algo mirando las escobas: *«...dijo que nadie se haría daño... que así se acabarían las clases de vuelo...»*. Los tres se miran: es él, el de la grieta. No saben cómo se llama. La voz fría sigue siendo un misterio.

**El tono.** Luminoso: es el primer capítulo a la luz del día desde la llegada. El miedo de anoche se convierte en una mañana de aire libre, agua y hierba cortada, y el villano no aparece más que en el hilo negro. Las risas: Zarek y sus fanfarronadas, Nuri que no se fía de las escobas, Teku que quiere volar ya.

---

## 4. Las lecciones y las historias

Seis lecciones, de una idea cada una, con su bloque *Pruébalo* en Python a secas (D170, D174), nunca sobre el mago. Teku las da todas menos *Drevo*, que da Ilda (la profesora de vuelo); como en el capítulo 3, Teku es quien habla en los niveles del cobertizo, e Ilda en los del campo.

1. **Las listas** (`lesson:lists`, antes del nivel 3). Página 1: una variable que guarda varios valores a la vez, en orden, entre corchetes y separados por comas: `names = ["Teku", "Nuri", "Bimo"]`; `print(names)` enseña la lista entera; los programadores la llaman una lista. Página 2: `len(names)` dice cuántos valores tiene; `wizard.find_all("broom")` da la lista de todas las escobas del sitio, como `find_nearest` daba una sola, y las enseña aunque estén tapadas; cada valor de la lista es una escoba, con su `position`. *Pruébalo:* la lista de tres nombres impresa y su `len`.
2. **Para cada una** (`lesson:for-each`, antes del nivel 5). Una página: `for broom in brooms:` hace sus líneas una vez por cada valor de la lista, y en cada vuelta `broom` es el siguiente; es el `for` del capítulo 3, pero recorriendo cosas en vez de contar números; las líneas de dentro, metidas con cuatro espacios, pueden usar `broom`. *Pruébalo:* `for name in names: print(name)`.
3. **Un si dentro del bucle** (`lesson:checking-each`, antes del nivel 8). Una página: dentro de un `for` puede ir un `if`, para que cada vuelta haga una cosa u otra según el valor de esa vuelta; las líneas del `if` van metidas ocho espacios, cuatro por el `for` y cuatro por el `if`. *Pruébalo:* `for name in names:` / `if name == "Bimo":` / `print(name, "es un gato")`.
4. **Drevo** (`lesson:drevo`, antes del nivel 11, Ilda). Una página: la palabra levanta la escoba; a partir de ahí los `move` vuelan; volando se cruza el agua, los setos y las vallas, y se va tres veces más deprisa; por las copas de los árboles no se pasa; la escoba se posa donde el programa termina. Sin *Pruébalo* (el hechizo se lanza en el nivel, D174).
5. **Una acción propia** (`lesson:an-action-of-your-own`, antes del nivel 13). Página 1: `def two_rings():` y, metidas debajo, sus líneas: eso le da un nombre a esas líneas, y los programadores lo llaman una función; el nombre con paréntesis las ejecuta, donde se escriba y tantas veces como se escriba; las líneas del `def` no se ejecutan hasta que alguien llama a la función. Página 2: un bucle repite lo mismo seguido; una función se usa donde haga falta, con otras cosas en medio, y además el programa se lee (una línea dice *dos aros* en vez de cuatro movimientos). *Pruébalo:* un `def greet():` que imprime dos líneas, llamado dos veces con un `print` distinto en medio.
6. **Argumentos propios** (`lesson:arguments-of-your-own`, antes del nivel 15). Una página: entre los paréntesis del `def` van nombres, los argumentos de la función; al llamarla van valores, en el mismo orden, y dentro los nombres valen eso, como `move_right(3)` recibe el 3; la misma función sirve para cosas parecidas pero no iguales. *Pruébalo:* `def greet(name): print("Hola", name)`, llamada con dos nombres.

Las historias, paso a paso (tres a cuatro frases la voz, una a tres un personaje; en el juego cada paso va con lo que pasa en la escena):

**Historia 1, La mañana siguiente** (`story:the-morning-after`; el dormitorio por la mañana, luego el camino al cobertizo sobre la escena 1):
1. La voz: amanece; apenas has dormido; lo que oísteis por la grieta: alguien va a hacer algo con las escobas antes de la clase de vuelo de hoy, y no podéis decírselo a nadie sin confesar que estabais fuera de la cama. Los tres se levantan.
2. `{friend}`: vamos al cobertizo antes del desayuno; si llegamos antes que nadie, lo arreglamos nosotros y no hace falta contar nada.
3. `{mate}`: ¿y si está cerrado? / ¿y si es peligroso? (según el carácter: Nuri recelosa, Teku con prisa).
4. La voz: el camino de grava detrás del castillo hasta el cobertizo (las tres figuras entran por abajo de la escena 1 hasta la puerta). La puerta está abierta; dentro, la percha vacía y las escobas por el suelo, unas en fila junto al banco y otras medio tapadas por la paja.
5. `{friend}` levanta una escoba (la figura se agacha, como al recoger) y encuentra el hilo negro anudado entre las ramas: un nudo encantado; con esto la escoba se encabrita en el aire y tira a quien la monte. La voz le dijo que lo hiciera en todas.
6. `{friend}`: pero ¿cuántas son? Entre la paja casi no se ven. Para saber cuántas cosas hay de una clase sin verlas todas, hay una manera: te la enseño (a la lección).

**Historia 2, La clase de vuelo** (`story:the-flying-lesson`; la orilla del lago, escena 2):
1. La voz: habéis desatado hasta la última cuando se oyen voces en el campo: Ilda llega con la clase; nadie sabe nada; `{friend}` guarda el hilo negro en el bolsillo.
2. Ilda (entra por la izquierda con dos o tres figuras de primero detrás): buenos días, madrugadores; cada uno coge una escoba del cobertizo; `{wizard}`, esa es tuya por hoy: cuídala.
3. Zarek (llega volando por arriba, da una vuelta y se posa): los de primero andan con la escoba como con un paraguas; yo el año pasado crucé el lago el primer día.
4. Ilda: Zarek, al final de la fila. La escoba se levanta con una palabra, *drevo*, y volando se cruza lo que andando no: el agua, los setos. Primer ejercicio: hasta el final del embarcadero andando, allí la palabra, y sin parar hasta la piedra blanca de la otra orilla.
5. `{mate}`: no me fío de un palo que vuela / ¡yo primero! (según el carácter). La voz: te toca (al nivel).

**Historia 3, La meta** (`story:the-finish`; la pista de la carrera, escena 4, junto a la meta):
1. La voz: cruzas la meta y, un momento después, Zarek, por segunda vez. La clase aplaude desde la grada; Ilda sonríe.
2. Zarek (se posa al lado): vale, vale; has volado limpio, y con un programa más corto que el mío; la próxima no te dejo ganar.
3. Ilda: nadie se ha caído hoy, y eso que esta mañana he encontrado un hilo negro en la paja del cobertizo que no me ha gustado nada; alguien anduvo por allí de noche. `{wizard}`, has cuidado esa escoba como si fuera tuya: pues ya lo es.
4. La voz: al borde del campo, apartado de la clase, un alumno mayor mira las escobas y masculla, sin ver que os acercáis (las tres figuras andan hasta cerca de él; él está de lado): *dijo que nadie se haría daño... que así se acabarían las clases de vuelo...*
5. `{friend}` (en voz baja): es él; el de la grieta. No sé cómo se llama. Y la otra voz, la fría, no era de ningún alumno.
6. La voz: tenéis una escoba, un secreto más grande que esta mañana y una voz en los muros que nadie más ha oído. El capítulo se cierra con lo aprendido: listas, bucles sobre ellas, un `if` en cada vuelta, volar, funciones y argumentos.

---
