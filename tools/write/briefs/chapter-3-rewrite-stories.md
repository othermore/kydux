---
outputs:
  - content/stories/after-dark/text.en.json
  - content/stories/after-dark/text.es.json
  - content/stories/beyond-the-doors/text.en.json
  - content/stories/beyond-the-doors/text.es.json
  - content/stories/the-voices/text.en.json
  - content/stories/the-voices/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
context:
  - docs/dev/story.md
  - content/stories/after-dark/text.en.json
  - content/stories/after-dark/text.es.json
  - content/stories/beyond-the-doors/text.en.json
  - content/stories/beyond-the-doors/text.es.json
  - content/stories/the-voices/text.en.json
  - content/stories/the-voices/text.es.json
  - content/stories/caught/text.en.json
  - content/stories/caught/text.es.json
---
Write again the four stories of chapter 3 of Kydux, in English and Spanish, each file a
JSON object with its `title` and its `steps`, a string a step, as rules.md says. Their
present texts are given: keep every step word for word unless this brief changes it. The
owner read the first of them and wrote several of its steps by hand: those are given
between FIXED and END, in Spanish, and go into the Spanish file word for word, the English
file saying the same in natural English. The owner's words are the model of how the whole
chapter must speak to a child.

## How the chapter speaks

- A text the child reads says what a friend would say, in the order a child needs, and
  nothing about how the game is built.
- A program *looks at* an attribute, *sees* where it stands, *checks* its coordinates. It
  never *asks*: in Spanish *preguntar* and *pregunta* are out, in every form (*una pregunta*
  included, of an expression), and *mirar*, *ver*, *consultar*, *comprobar* take their
  place. In English likewise *look at*, *see*, *check*, never *ask*, *a question*.
- The tunnel is dark, not enchanted: the word *encantado*, *enchanted*, is in no text.
- No text says that a level is played in several ways, that the friend whispers, or that
  the game waits.
- The friend's reasons are said, and what the friend does not know is said as a guess
  (*creo que*).

## `after-dark`, *After dark* / *Después del anochecer*: nine steps

The staging stays. Who says each step, and what:

1. The voice, as it is.
2. `{mate}`: as it is.
3. The voice, as it is.
4. `{friend}`, FIXED:

   No podía dormir. Hoy en la biblioteca buscaba libros sobre este castillo, y en el que
   cogí encontré algo doblado: el mapa del niño travieso. Creo que lo dibujó hace años un
   alumno que se escapaba de noche. En la esquina tiene una palabra, *orvim*. Creo que es
   un hechizo para activarlo. Toma, quizás tú averigües cómo hacerlo.

   END
5. `{mate}`: write this one, one short question: why were you looking for books about the
   castle?
6. `{friend}`, FIXED:

   Los alumnos mayores dicen que los pasillos cambian de noche, y que el profesor Dask los
   patrulla para que nadie esté fuera de la cama. También hay rumores de que en esos
   pasillos pasan cosas raras o se oyen voces.

   END
7. `{friend}`, FIXED:

   Por eso creo que debemos ir a investigar... Y, si ese mapa funciona como creo, nos
   ayudará a orientarnos en los pasadizos, incluso a oscuras. Lo mejor es que lo
   consultemos en cada paso que demos por la noche en el castillo. ¿Qué decís, venís
   conmigo?

   END
8. The wizard: the present step 7, as it is.
9. The voice: the present step 8, as it is.

## `beyond-the-doors`, `the-voices`, `caught`

Keep every step, read by the rules above. In particular:

- `beyond-the-doors`: nothing about a level's ways; if a step speaks of how long Dask
  looks, it is said as what the three do not know.
- `the-voices`: the step that says *susurra* is the cold voice's, and stays. The friend
  does not whisper.
- `caught`, its last step: the child's *preguntado dónde están las cosas con `position`*
  becomes *mirado dónde están las cosas con `position`*, and *una pregunta, una
  expresión* becomes *una expresión, algo que el ordenador comprueba*, with the same
  change in English. It learned, in this order, the cells and `position`, to wait with
  `wait`, an expression, `if` and `else`, `for` and `while`, *kirra* and *osto*: name
  `wait` with them.
