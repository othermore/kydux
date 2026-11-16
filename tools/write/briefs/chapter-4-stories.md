---
outputs:
  - content/stories/the-morning-after/text.en.json
  - content/stories/the-morning-after/text.es.json
  - content/stories/the-flying-lesson/text.en.json
  - content/stories/the-flying-lesson/text.es.json
  - content/stories/the-finish/text.en.json
  - content/stories/the-finish/text.es.json
context:
  - docs/dev/story.md
  - content/stories/after-dark/text.es.json
  - content/stories/the-voices/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
---
Write the three stories of chapter 4 of Kydux, *The broom*, in English and Spanish.
The owner's design is given below in Spanish, sections 1 and 4: section 4 has each
story step by step, which the owner likes. Keep its words wherever they are still
true, and write English that says the same. Where this brief says otherwise, it wins.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a time. Each
step is said by one speaker: **the voice**, the narrator, in a band under the scene,
speaking to the child as "you", the child being the wizard, two to four sentences; or
**a character**, in a speech bubble, one to three sentences, with no quotation marks
and no "she says". Before a step's words something may happen on the scene; the words
go with it and never contradict it. By day, warm, bright and a little funny. Each file
is a JSON object, `{"title": "...", "steps": ["...", ...]}`, with exactly as many steps
as the list below, in that order.

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

## The stories

1. `the-morning-after`, *The morning after* / *La mañana siguiente*, six steps.
   1. voice: dawn in the dormitory; you hardly slept; what the three heard through the
      crack: someone is going to do something to the brooms before today's flying
      lesson, and you cannot tell anyone without owning that you were out of bed.
      (On the scene `{mate}` wakes, and you both go to the common room's door and open it.)
   2. `{friend}` (comes in at the door): let us go to the shed before breakfast; if we get
      there first, we fix it ourselves and need not tell anyone.
   3. `{mate}`: by their character, worried or in a hurry (what if it is locked? what if
      it is dangerous?), in the wizard's own gender's words.
   4. voice: the gravel path behind the castle to the broom shed (the three walk up the
      path into the shed); the door is open; inside, the empty rack and the brooms on
      the floor, some in a row by the bench, others half hidden in the straw.
   5. `{friend}` (looking at a broom): hidden in its twigs, a black knotted thread, an
      enchanted knot; with it, the broom would buck in the air and throw its rider; the
      voice said to do it to all of them.
   6. `{friend}`: but how many are there? In the straw you hardly see them. There is a
      way to know how many things of a kind there are without seeing them all: I will
      show you (the lesson follows).
2. `the-flying-lesson`, *The flying lesson* / *La clase de vuelo*, six steps, on the
   lake's edge.
   1. voice: you had untied the very last one when voices come from the field: Ilda is
      coming with the class; nobody knows anything; `{friend}` puts the black thread in a
      pocket.
   2. Ilda (comes in from the left with two first-years behind her): good morning, early
      birds; each of you takes a broom from the shed; `{wizard}`, that one is yours for
      today: look after it.
   3. Zarek (flies in, circles and lands): the first-years carry their brooms like
      umbrellas; last year I crossed the lake on my first day.
   4. Ilda: Zarek, to the end of the line. The broom lifts with a word, *drevo*, and
      flying crosses what walking cannot: water, hedges. First exercise: walk to the end
      of the jetty, there the word, and without stopping to the white stone on the other
      bank.
   5. `{mate}`: by their character, *I do not trust a stick that flies* or *me first!*
   6. voice: your turn (a sentence or two leading to the lesson).
3. `the-finish`, *The finish* / *La meta*, six steps, on the race course by the finish.
   1. voice: you cross the finish and land, and a moment later Zarek, for the second
      time; the class cheers from the stand; Ilda smiles.
   2. Zarek (landed beside you): all right, all right; you flew clean, and with a
      shorter program than mine; next time I will not let you win.
   3. Ilda (comes from the stand, `{friend}` and `{mate}` behind her): no one fell
      today, though this morning she found a black thread in the shed's straw she did
      not like at all; someone was there at night. `{wizard}`, you looked after that broom
      as if it were yours: well, now it is.
   4. voice: at the edge of the field, apart from the class, by the gate, an older pupil
      stares at the brooms and mutters, without seeing you come near (the three walk up
      close; he stands sideways): his words in italics inside this step: *...he said no
      one would get hurt... that this way the flying lessons would end...* Never his name.
   5. `{friend}` (quietly): it is him, the one from the crack. I do not know his name.
      And the other voice, the cold one, was no pupil's.
   6. voice: you have a broom, a secret bigger than this morning's and a voice in the
      walls no one else has heard. The chapter closes with what was learned: lists,
      loops over them, an `if` in each turn, flying, functions and their arguments.

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
