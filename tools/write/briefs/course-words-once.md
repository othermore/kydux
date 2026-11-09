---
outputs:
  - content/lessons/notes/en.md
  - content/lessons/notes/es.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/objects-and-actions/es.md
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
  - content/lessons/giving-things/en.md
  - content/lessons/giving-things/es.md
  - content/lessons/the-distance/en.md
  - content/lessons/the-distance/es.md
  - content/lessons/counting-with-names/en.md
  - content/lessons/counting-with-names/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/levels/the-dark-note/text.en.json
  - content/levels/the-dark-note/text.es.json
  - content/levels/the-long-corridor/text.en.json
  - content/levels/the-long-corridor/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-book-returned/text.en.json
  - content/levels/the-book-returned/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
context:
  - docs/dev/course.md
  - content/lessons/notes/en.md
  - content/lessons/notes/es.md
  - content/lessons/objects-and-actions/en.md
  - content/lessons/objects-and-actions/es.md
  - content/lessons/the-right-place/en.md
  - content/lessons/the-right-place/es.md
  - content/lessons/your-first-spell/en.md
  - content/lessons/your-first-spell/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/giving-things/en.md
  - content/lessons/giving-things/es.md
  - content/lessons/the-distance/en.md
  - content/lessons/the-distance/es.md
  - content/lessons/counting-with-names/en.md
  - content/lessons/counting-with-names/es.md
  - content/lessons/fendra/en.md
  - content/lessons/fendra/es.md
  - content/lessons/true-or-false/en.md
  - content/lessons/true-or-false/es.md
  - content/lessons/repeat/en.md
  - content/lessons/repeat/es.md
  - content/levels/your-bed/text.en.json
  - content/levels/your-bed/text.es.json
  - content/levels/the-dark-note/text.en.json
  - content/levels/the-dark-note/text.es.json
  - content/levels/the-long-corridor/text.en.json
  - content/levels/the-long-corridor/text.es.json
  - content/levels/the-lost-book/text.en.json
  - content/levels/the-lost-book/text.es.json
  - content/levels/the-book-returned/text.en.json
  - content/levels/the-book-returned/text.es.json
  - content/levels/the-hidden-key/text.en.json
  - content/levels/the-hidden-key/text.es.json
  - content/levels/the-moving-key/text.en.json
  - content/levels/the-moving-key/text.es.json
  - content/levels/eldras-door/text.en.json
  - content/levels/eldras-door/text.es.json
  - content/levels/eldras-room/text.en.json
  - content/levels/eldras-room/text.es.json
  - content/levels/left-or-right/text.en.json
  - content/levels/left-or-right/text.es.json
  - content/stories/the-wand-bank/text.en.json
  - content/stories/the-wand-bank/text.es.json
---
Correct these texts of chapters 1, 2 and 3 of Kydux, in English and Spanish, by one rule the
owner gave. Each file's present text is given. Write each file whole, and keep every
sentence word for word unless this rule changes it: same pages, same steps, same keys, the
same code, and the same braces for the wizard and the friend. Do not improve anything else.

## The owner's rule

The owner dislikes metaphors for programming ideas (*preguntar*, *un nombre*, *lo que sabe*,
*una acción*) when they stay. A metaphor is used only the first time an idea is explained,
and the text says right there that in programming it is called X. From then on the text
uses X. The second time, it may recall the easy word in parentheses, once. Never again
after that.

- *Preguntar* and *pregunta* are out altogether, in every form, also for a thing one wants
  from the program: say *mirar*, *ver*, *consultar*, *comprobar* for an attribute (*mirar el
  atributo `locked` de la puerta*), and *usar* or *llamar a* for a method (*usa el método
  `distance_to`*, *`find_item` te da*). In English likewise *look at*, *see*, *check*, *use*,
  *call*, never *ask*, *a question*.
- Where each idea is first explained, and so where its easy word may stand once:

  | The idea | Its word from then on | Explained first in |
  | --- | --- | --- |
  | an action | method, *método* | `objects-and-actions` |
  | a note | comment, *comentario* | `notes` |
  | what an object knows | attribute, *atributo* | `what-things-know` |
  | a value kept under a name | variable, *variable* | `finding-things` |

- So, after its first explanation, an action is a method: *un método solo se puede usar en
  el lugar correcto*, *Lanzar un hechizo es un método que la varita le da a tu {mago|maga}*.
  A note is a comment. What a door knows is its attribute: *mirar el atributo `locked`*.
- And after `finding-things` a value is kept in a variable: never *guárdalo bajo un nombre*,
  but *guárdalo en una variable*, *keep it in a variable*. The level right after that lesson,
  `the-lost-book`, may recall it once in parentheses, *en una variable (el nombre bajo el que
  lo guardas)*. A name in `the-book-returned` is a variable: *una variable vive en su propio
  programa*. `step` in the lesson `repeat` is *una variable con la que el bucle cuenta*. A
  single `=` in `true-or-false` *guarda un valor en una variable*.
- `lesson:counting-with-names` has for its title *Contar con variables* / *Counting with
  variables*, and speaks of variables throughout.
- The first explanations themselves stay, with one change: `what-things-know` says at once
  that what an object knows is called an attribute, and its heading and its text then speak
  of looking at an attribute, *Mirar un atributo*, with no asking of any kind. `finding-things`
  keeps *le damos un nombre, algo que los programadores llaman una variable*, and then uses
  *variable*. `notes` says a note once, and *comentario* after it. `objects-and-actions` keeps
  its title, and says method after it has said that an action is called so.
- `the-right-place`: its title and text speak of methods; the wizard does not wonder: *no
  sabrá por qué se lo pides*.
- `the-wand-bank`, the friend's summing up: *Habéis aprendido a mirar los atributos de las
  cosas y a guardar lo que un método devuelve en una variable.* The rest of that step stays.
- `left-or-right`: its intro, its hint and its `learned` say *el atributo `locked`*, *the
  attribute `locked`*.
- A name in the ordinary sense stays as it is: *el nombre por el que la conoce el código*, a
  character's name.
