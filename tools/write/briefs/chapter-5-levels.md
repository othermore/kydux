---
outputs:
  - content/levels/the-circle/text.en.json
  - content/levels/the-circle/text.es.json
  - content/levels/the-name-and-the-colour/text.en.json
  - content/levels/the-name-and-the-colour/text.es.json
  - content/levels/one-line-in-the-book/text.en.json
  - content/levels/one-line-in-the-book/text.es.json
  - content/levels/the-slate/text.en.json
  - content/levels/the-slate/text.es.json
  - content/levels/out-of-the-circle/text.en.json
  - content/levels/out-of-the-circle/text.es.json
  - content/levels/orlas-orders/text.en.json
  - content/levels/orlas-orders/text.es.json
  - content/levels/the-small-passage/text.en.json
  - content/levels/the-small-passage/text.es.json
  - content/levels/the-forgotten-room/text.en.json
  - content/levels/the-forgotten-room/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/levels/the-nearest-broom/text.es.json
  - content/levels/the-rings/text.en.json
  - content/levels/the-rings/text.es.json
  - content/levels/the-race/text.es.json
---
Write the texts of the eight levels of chapter 5 of Kydux, *The familiar*, in English and
Spanish: the files listed. The owner wrote each level in Spanish; what each is about,
its cells, its program and its words are given below. Keep the owner's words wherever
they are given between « », exactly as they are, and write English that says the same.
Two of chapter 4's levels are given for their voice and their shape.

## Where it happens, and who speaks

The last day of the first year, at the top of Orla's tower, by the afternoon sun: the
highest hall, with the great book of Arvelia open on the lectern and Bimo, Orla's grey
cat, asleep beside it; a circle of runes in the floor; three brass plates in the floor,
the moon's, the sun's and the star's. Each first-year describes a familiar as a class, and
Orla's word *minka* calls it into the circle: there it is only a trial, a figure of light
that comes undone by itself; once it leaves the circle it lives, for good. The wizard stands
by the circle and never moves; what moves is the creature. Then, a floor below, a corridor
with the mouth of a familiars' passage at the foot of its wall, the passage winding up inside
the wall to a forgotten room where Rinlo, an older pupil, is hiding.

Orla, the head of the school, calm and kind, a few words at a time, speaks the intros and
outros of the six levels in the hall but the slate's, which is `{mate}`'s. `{friend}`
speaks the small passage's, and `{mate}` the forgotten room's. `{friend}`, who has read
everything, makes their familiar alone and first: Tolu, a grey hare, a colour no
first-year is given. `{mate}` fails trial after trial (a frog that will not keep still, a
bat they do not like, a spark from a kind no first-year may have), and in the end copies the
wizard's description.

## What the child knows by now

All of chapters 1 to 4: programs, objects and methods, comments, arguments, strings,
attributes and `print`, variables, the grid's cells and positions with `x` and `y`, `==`,
`not`, `if` and `else`, `for` with `range` and over a list, `while`, lists and `len`, `<`
and `>`, flying with *drevo*, functions with `def` and their arguments. Never explain them
again: a sentence may recall one in a few words.

In chapter 5, the lessons, each right before the levels that need it: *A kind of thing* (a
class, `class Crow: pass`, and an object, `Crow()`; the six kinds; `(Familiar)` and
*minka*), *What it knows* (attributes, written with the dot: `vesso.name = "Vesso"`; a
first-year's familiar has `name` and `color`, one of its kind's colours), *Born complete*
(`__init__` and `self`: `Crow("Vesso", "black")`), *What it inherits* (`(Familiar)`: a fox
is a familiar and inherits `position` and the four moves), *What it does* (a method of the
class's own, with `def` inside it and `self`).

## The first year's limits

The book of Arvelia admits from a first-year a kind of the six, `Fox`, `Crow`, `Bat`,
`Hare`, `Mouse` or `Frog`; `name` and `color`, the colour one of its kind's own; `__init__`;
and, from *Orla's orders* on, `go_to`. Anything else stumbles, told by Orla in the game's own
words, never as an error: another kind gives a shapeless spark; a colour not the kind's own,
or a grey hare, a pale trial, only its lines of light; another attribute or another method
stops the program at that line. Those words are the game's already: do not write them.

## Words the owner has ruled on

- `{wizard}` is the wizard; `{friend}` is the friend met at the gate (the wizard's other
  gender, the friend's own gendered words in double braces in Spanish,
  `{{alumno|alumna}}`); `{mate}` is the dormitory mate (the wizard's own gender, single
  braces). Nuri and Teku are never named in a text. Orla, Bimo, Tolu and Rinlo are named.
- The wizard's familiar is `{familiar}`, its name, and `{familiar_var}` its name in the
  program, `{familiar_class}` its class, `{familiar_kind}` its kind in a word
  (*zorro*), `{familiar_a_kind}` with its article (*un zorro*), `{familiar_color}` its colour
  as the string the program writes (`red`); the room-mate's familiar, Kesi, is
  `{mate_familiar}`, `{mate_var}` and `{mate_color}`. The game puts them in: write them so, never a
  kind's name or a colour of your own, since the child chooses. A Spanish word that would
  follow the familiar's gender is avoided, or written `{familiar:el|la}`. Once the familiar
  lives (from *Out of the circle* on) a text names it `{familiar}` or *tu familiar* /
  *your familiar*, never by its kind.
- A program **looks at** an attribute and **uses** a method; it never *asks*: never
  *preguntar*, *pregunta*, *ask*, *question*. Never *bajo un nombre* / *under a name*.
- A metaphor stands only where its idea is first explained, in the lessons; here the
  programming words: class, object, attribute, `__init__`, `self`, to inherit, method.
- The computer, the game, runs the program, never "the castle".
- No text ever speaks of a level's *ways* (*maneras*), nor says how many there are.
- Spanish from Spain, natural, for a child of eight to twelve; English that says the same.

## Each level's file

A JSON object with exactly these keys, and `told` and `changes`/`changed` only where a level
below has them:

- `title`: the level's name, given below in both languages.
- `goals`: a list of strings, as many as the level's goals below and in their order, each a
  short sentence. A bonus goal's sentence is plain: the game writes *Bonus:* before it.
- `starting_code`: the program the level starts with, exactly as given below, one string,
  `\n` between lines and at the end, its comments (`# ...`) in the child's language and its
  placeholders (`{familiar_class}`, `{familiar_var}`...) kept as they are. Each comment is one
  sentence on one `#` line, never cut to fit a width, in the child's words, naming the method,
  the attribute or the word of its step in backquotes, never the program; where a level gives
  numbers in a comment, keep them.
- `hints`: three, from the gentlest, on the idea, to the one that nearly says it all. A hint
  never is, quotes or spells out a line of the solution, not even the shortest, and never
  quotes its `class`, `def`, `for` or `if` line: it points at the idea, the direction or the
  method by its name alone, and may give numbers.
- `intro`: what the speaker says on the start card before the level, one to three sentences:
  the situation, and the cells and numbers this brief names, never the solution. Where the
  owner's words are given, the intro is those words, with at most a sentence before them.
- `outro`: what the speaker says after a win, one or two sentences that move the story on.
- `learned`: one sentence, "Now you know …" / "Ahora sabes …", that says what the idea is and
  what the child can now do with it.
- `told`: the words the level's figures say while the program runs, an object from each key
  below to its words, the owner's where given.
- `changes` and `changed`: only for the last level, as it says.

## The levels

The cells are (column, row), from 0, x to the right and y down. *The solution* is for you, so
that the hints are true; it never appears in a text.

1. `the-circle`, *El círculo* / *The circle*. Practice 1, speaker Orla. The wizard on (10, 10)
   by the circle, whose inside is columns 8 to 11, rows 6 to 8; the wizard's trial appears on
   (10, 7). `{friend}` has a hare of light before them already; `{mate}` scowls at a frog that
   will not keep still. Goal (one): a trial of one of the six kinds in the circle. Starting
   code, three comments, each followed by an empty line: describe your kind of familiar with
   `class` and `(Familiar)`, empty for now, with `pass` under it; make one creature of that
   class and keep it in a name; call it with *minka*, `cast`. Solution:
   `class Fox(Familiar):`, moved in `pass`, `pimu = Fox()`, `wizard.cast("minka", pimu)`.
   The trial comes pale, its lines of light alone, with no colour and no name. Intro: Orla
   tells the wizard to describe a kind of familiar, make one and call it into the circle, and
   that the six kinds are in her book. `told`: `won`, Orla, «Es {familiar_a_kind}, sí. Pero
   aún no sabe de qué color es ni cómo se llama.»; `bimo`, Bimo, who opens an eye and closes it
   again: his bubble a short sound of a sleepy cat, the action in italics. Learned: a class
   describes a kind of thing, and an object is one thing made with it, with the class's name
   and brackets; the name `{familiar_var}` is only the program's name for it.
2. `the-name-and-the-colour`, *El nombre y el color* / *The name and the colour*. Practice 2,
   speaker Orla. As the circle: the trial before has come undone. `{friend}`'s hare now has its
   colour, grey; `{mate}` has swapped the frog for a creature they do not like either. Goal
   (one): a trial with its name and a colour of its kind. Starting code exactly:
   ```
   class {familiar_class}(Familiar):
       pass

   # Make one {familiar_kind} and keep it in a name.

   # Give it its name, with .name

   # Give it its colour, with .color

   # Call it with minka.
   ```
   (the comments in the child's language; their meaning kept; each ends as a sentence does).
   Solution: the class as given, `pimu = Fox()`, `pimu.name = "Pimu"`, `pimu.color = "red"`,
   the cast. The trial comes whole in its colour, steady, its name over it. Intro: Orla's
   words to `{friend}`, exactly: «¡Has logrado una liebre gris! Eso es algo excepcional para
   {{un alumno|una alumna}} de primero. Enhorabuena.», then, to the wizard, a sentence: give
   yours its name and its colour before you call it. Learned: an object keeps attributes of
   its own, written with the dot as they are read, and `{familiar_var}` is the program's name
   while `{familiar_var}.name` is what the object knows of itself.
3. `one-line-in-the-book`, *Una línea en el libro* / *One line in the book*. Practice 3, speaker
   Orla. As before; `{mate}`'s third trial is a spark, a kind no first-year may have. Orla has
   said that the book of Arvelia writes each familiar down in a single line, and that a
   description that cannot make it born in one line does not go in the book. Goals (two): a
   trial with its name and its colour; the book can note it in one line. Starting code exactly:
   ```
   class {familiar_class}(Familiar):
       # In place of pass, write __init__ with self, name and color.
       # Its first line keeps the name in self.
       # Its second line keeps the colour in self.
       pass

   # Make {familiar}, with its name and its colour, in one line.

   # Call it with minka.
   ```
   Solution: the class with `def __init__(self, name, color):`, `self.name = name`,
   `self.color = color`; `pimu = Fox("Pimu", "red")`; the cast. After the program the book
   writes the line in pencil, `Fox("Pimu", "red")`, made with the child's class; then
   `{friend}`'s hare, Tolu, steps out of the circle and lives. Intro: Orla, two sentences: the
   book writes each familiar in one line; teach your class to make yours born whole. Outro may
   speak of Tolu, the first familiar of the class to live. Learned: `__init__` is the action
   the class runs by itself when an object is born, `self` the object being born, and anyone
   can use your class without reading your program if they know what `__init__` takes.
4. `the-slate`, *La pizarra de {mate}* / *{mate}'s slate*. Fix 1, speaker `{mate}`. `{mate}`
   gives up: they want a familiar like the wizard's, in another colour, and copy the wizard's
   description on their slate in a hurry, add their own line, and whisper the name of theirs
   in the wizard's ear: Kesi. They hand the slate over: «Lánzalo tú, que a ti te sale.» Goal
   (one): `{familiar}` and `{mate_familiar}` in the circle, each with its name and its colour.
   Starting code exactly, with no comment above it (the start card says it is the slate):
   ```
   class {familiar_class}(Familiar):
       def __init__(name, color):
           name = name
           color = color

   {familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
   {mate_var} = {familiar_class}("{mate_familiar}", "{mate_color}")
   wizard.cast("minka", {familiar_var})
   wizard.cast("minka", {mate_var})
   ```
   Run as given, Python stops at line 6, `__init__` has no `self`; with `self` added, two pale
   trials with no name come, since `name = name` keeps nothing in the object. The fix: `self`
   in the `def`, and `self.` before the two names kept. Intro: `{mate}`'s words: their giving
   up, the copy, the name whispered, and «Lánzalo tú, que a ti te sale.» `told`: `won`,
   `{mate}`, «Ese. Ese sí.» Learned: the two slips everyone makes with a class, one Python
   tells (a missing `self`) and one nobody tells (a name kept only inside the action), and that
   one class makes as many familiars as needed, each with its own data.
5. `out-of-the-circle`, *Fuera del círculo* / *Out of the circle*. Practice 4, speaker Orla.
   The wizard's last trial has come undone. `{friend}` and Tolu wait by the entrance; `{mate}`
   waits right of the circle, ready to copy the wizard again. The moon's plate is on (6, 4).
   Goals (four): a trial with its name and its colour; the book can note it in one line; the
   familiar has left the circle; it is on the moon's plate. Starting code exactly:
   ```
   class {familiar_class}(Familiar):
       def __init__(self, name, color):
           self.name = name
           self.color = color

   {familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
   wizard.cast("minka", {familiar_var})

   # Two steps down, and it is out of the circle.

   # Four steps to the left.

   # Five steps up, to the moon's plate.
   ```
   (each move's comment names its method, `move_down`, `move_left`, `move_up`). Solution: those
   lines and `pimu.move_down(2)`, `pimu.move_left(4)`, `pimu.move_up(5)`. This is the last chance
   to change the kind, the name or the colour: the moment the child runs a program that meets
   every goal, the familiar is born, for good. Intro: Orla's words, exactly: «Mientras esté en
   el círculo, puedes deshacerlo y describir otro. Si lo sacas, vivirá. Piénsalo, y luego
   llévalo al plato de la luna.» `told`: `go`, Orla, «Si ya estás seguro, adelante. Deja que
   escriba la descripción en el libro de Arvelia, y luego puedes crear tu familiar.»;
   `not_yet`, Orla, «Así todavía no. Dentro del círculo puedes cambiarlo.»; `halt`, Orla,
   «¡Alto! Ya tienes un familiar, y eso es más que suficiente. No puedes crear otro.»; `copy`,
   `{mate}`, «¡Espera, que lo copio otra vez!». Outro: Orla, or the moment: the familiar is
   alive, has fur and a shadow, and looks at its wizard. Learned: the familiar walks with moves
   the child never wrote, inherited from `Familiar`, with the wizard's own names; an object is
   used with the dot, of the game's class or of yours.
6. `orlas-orders`, *Las órdenes de Orla* / *Orla's orders*. Practice 5, speaker Orla. The
   familiar, alive, is back by the wizard on (10, 9), facing up; the others watch from the
   entrance. The sun's plate is on (13, 4), the star's on (13, 10). Goals (three): the
   familiar on the sun's plate; it obeys Orla's two orders; bonus: it bumps into nothing.
   Starting code exactly (`{familiar_source}` is the class as the book keeps it; each empty
   line under a comment carries the spaces of the line to write there):
   ```
   {familiar_source}

       # Teach it go_to, with self, x and y.
       
           # If x is less than its own x, it goes left; else, right.
           
           # If y is less than its own y, it goes up; else, down.
           
   # Send {familiar} to the sun's plate: 13, 4.

   ```
   (the comments name `move_left` and `move_right`, `move_up` and `move_down` where they
   say left and right, up and down). Solution: the class with
   `def go_to(self, x, y):` that compares `x` with `self.position.x`, moves left or right the
   difference, then the same with `y`, up or down; and `pimu.go_to(13, 4)`. Then, after the
   program, Orla gives her two orders, which the game runs with the child's own `go_to`:
   «¡A la estrella!», to the star's plate, `go_to(13, 10)`, and «¡Con tu {mago|maga}!», back
   to the wizard's side, `go_to(11, 10)`. Intro: Orla's words, exactly: «Ahora lo mandaré yo.
   Los familiares nacen sabiendo andar, pero ir a un sitio hay que enseñárselo. En Arvelia,
   eso se llama `go_to`.» `told`: `order_star`, Orla, «¡A la estrella!»; `order_wizard`, Orla,
   «¡Con tu {mago|maga}!». Outro: Orla copies `go_to` into the book. Learned: a method is an
   action that belongs to a class, written with `def` inside it with `self`, used with the dot,
   and whoever knows its name can send the object without knowing how it is made inside.
7. `the-small-passage`, *El pasadizo pequeño* / *The small passage*. Practice 6, speaker
   `{friend}`. In the corridor below the hall: the wizard on (9, 13), the familiar beside them
   on (10, 13), before the mouth of the passage, a cat flap at the foot of the wall, (10, 12).
   The passage goes up column 10 to row 8, right along row 8 to column 13, and up column 13 to
   the forgotten room's flap; the room's floor is rows 2 and 3. Three ends of black thread lie
   along the passage: the trail. Only a familiar fits: the wizard does not move in this level.
   Goals (two): the familiar in the forgotten room, on (13, 3); bonus: it bumps into nothing.
   Starting code: three comments, each followed by an empty line: to the passage's first corner,
   10, 8; along it to 13, 8; up into the room, 13, 3 (each naming `go_to`). Solution:
   `pimu.go_to(10, 8)`, `pimu.go_to(13, 8)`, `pimu.go_to(13, 3)`. A `go_to` straight to the room
   from the corridor walks along the corridor first and bumps on its wall: the way is given
   corner by corner, read on the scene. Intro: `{friend}`: the passage, and the way in by the
   mouth; send `{familiar}` corner by corner. Learned: a method of your own class is used again
   and again like any of the wizard's, and your class is now a tool that does what the wizard
   cannot.
8. `the-forgotten-room`, *El cuarto olvidado* / *The forgotten room*. Challenge 1, speaker
   `{mate}`. As the passage: the familiar came running back to the wizard's side when it heard
   the voice. Rinlo broke his thread and threw the pieces on the room's floor without looking
   where they fell. The wizard cannot see into the room, but what the familiar sees, the wizard
   sees: `wizard.find_all` finds the pieces from where the familiar stands. Goals (two): the
   wizard ends with every piece of thread; bonus: the familiar bumps into nothing. Starting
   code: five comments, each followed by an empty line, one for each part of the work: to the
   first corner; to the second; up into the room (each naming `go_to`); for each piece of
   thread the wizard finds, send `{familiar}` to it (naming `find_all` and `go_to`); call it back
   with *minka*. Solution: the three `go_to`, then `for thread in wizard.find_all("thread"):`,
   moved in `pimu.go_to(thread.position.x, thread.position.y)`, then
   `wizard.cast("minka", pimu)`; *minka* calls a living familiar back to the wizard, and it
   hands over everything it carries. The pieces lie elsewhere each time the level is played,
   which no text says outright. Intro: `{mate}`: send `{familiar}` for every piece, as they
   promised Rinlo, and call it back. `changes`: one sentence, the owner's idea: Rinlo threw the
   pieces without looking where they fell («Rinlo tiró los trozos sin mirar dónde caían.»).
   `changed`: one sentence: this time, the pieces lie elsewhere in the room. Outro: the pieces
   in the wizard's hand, and a bolt heard above. Learned: the whole course in one program: an
   object of your own class, a method of yours with arguments, a list walked with `for`,
   attributes read with the dot, and a spell.

Each title: *El círculo* / *The circle*; *El nombre y el color* / *The name and the colour*;
*Una línea en el libro* / *One line in the book*; *La pizarra de {mate}* / *{mate}'s slate*;
*Fuera del círculo* / *Out of the circle*; *Las órdenes de Orla* / *Orla's orders*; *El
pasadizo pequeño* / *The small passage*; *El cuarto olvidado* / *The forgotten room*.
