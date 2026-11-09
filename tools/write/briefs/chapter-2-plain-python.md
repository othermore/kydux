---
outputs:
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/finding-things/en.md
  - content/lessons/finding-things/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/how-much/es.md
  - content/lessons/words/es.md
  - content/lessons/what-things-know/en.md
  - content/lessons/what-things-know/es.md
  - content/lessons/giving-things/es.md
  - content/lessons/counting-with-names/es.md
---
Write two lessons of chapter 2 again, in English and Spanish, each with new pages where the
child runs plain Python. The game's owner decided it: these are lessons of principle, and the
wizard is not needed to teach them (*son lecciones teóricas; no nos hace falta el mago*). A
page that teaches `print`, a variable or a sum carries a block the child runs and changes on
the page itself, and the block has no `wizard` in it: what it prints is the answer the child
reads under the editor. The owner asked for exactly this: for `print`, several prints, sums,
numbers and strings; for the variable, a number or a string kept in a variable and printed,
and two variables added into a third and printed.

Both lessons are taught by Wenna, the librarian, on the way into the library in the morning
(the story bible); keep her voice as the present files have it. The lessons' present files are
given: every page this brief does not change goes back word for word, in both languages.

## What the child knows by now

Chapter 1 taught a program, a method of an object (`wizard.move_right()`), a comment, an
argument (the number in the brackets, *how-much*), a string (words in quotes, *words*: the
computer keeps a string exactly as it is written), a thing to carry and a spell. Chapter 2,
before these two lessons, taught only `wizard.sleep()`. `print` is first taught in *Lo que
saben las cosas*, and the variable in *Encontrar cosas*. After them come *Dar cosas*
(`find_item`, `give`), *Llaves y puertas*, *La distancia* (`distance_to`, a number kept in a
variable and used twice) and *Contar con variables* (`5 - steps`, a number made from a
variable, used as a move's argument): do not teach what those lessons teach.

## How the lessons speak

- The thing first, then the word for it, then an example with numbers. A metaphor for an idea
  stands only where the idea is first explained, and says right there what it is called in
  programming; after that the programming word alone, recalled once in parentheses at most.
  The variable is first explained in *Encontrar cosas*, page 2, below: there and only there a
  variable may be "a name that holds a value".
- A program never *asks*; in Spanish *preguntar* is out in every form. It looks at an
  attribute, uses a method, keeps a value in a variable.
- Spanish from Spain, natural and warm, for a child of eight; the wizard's words in braces as
  the rules say. Short pages: three to six sentences each, as the present pages are.
- A page holds at most one block fenced ```python try. The blocks are given below exactly:
  write them as they are, in the language of each file. The variables' names in the blocks are
  the child's own words, not the game's: Spanish in the Spanish lesson, English in the English
  one.

## *Lo que saben las cosas* / *What things know* (`what-things-know`), four pages

1. As it is, word for word.
2. *Mirar un atributo* / *Looking at an attribute*: as it is, word for word.
3. *Mostrar el valor* / *Showing the value*, its title as it is. `print` is Python's way of showing a value, right
   under the editor where the child writes the code (keep that sentence of the present page
   3). It shows any value, not only an attribute: a number; a sum, which Python works out
   first and then shows its result; a string, the words in quotes, shown without the quotes.
   Each `print` writes its own line. Then invite the child to change the numbers or the word
   and run it again. The block, exactly:

   Spanish:
   ```python try
   print(7)
   print(2 + 3)
   print("Hola")
   ```

   English:
   ```python try
   print(7)
   print(2 + 3)
   print("Hello")
   ```

4. *Pruébalo* / *Try it*: the last two sentences of the present page 3, word for word (the
   door Wenna has just opened, its attribute looked at), and its block as it is:

   ```python try
   print(door.locked)
   ```

## *Encontrar cosas* / *Finding things* (`finding-things`), six pages

1. As it is, word for word: a method can give something back; `wizard.find_nearest("book")`
   gives the nearest book.
2. *Una variable* / *A variable*, new. To keep a value, we give it a name, which programmers
   call a variable (the present page 2's sentence, which is where the idea is first explained).
   A variable can hold a number or a string. It is written with `=`: the name on the left, the
   value on the right, as in `edad = 9` and `nombre = "Marta"` (English: `age = 9`, `name =
   "Marta"`). The `=` puts the value in the variable, it does not check whether two things are
   equal (the present page 2's sentence). `print` with the variable's name shows what it holds,
   the 9 or Marta, not the variable's name. Invite the child to change the number and the word.
   The block, exactly:

   Spanish:
   ```python try
   edad = 9
   nombre = "Marta"
   print(edad)
   print(nombre)
   ```

   English:
   ```python try
   age = 9
   name = "Marta"
   print(age)
   print(name)
   ```

3. *Sumar variables* / *Adding variables*, new. A variable that holds a number can be used as
   the number it holds: two variables can be added, and the sum kept in a third one,
   `total = a + b`, which `print` then shows. Invite the child to change `a` and `b`, and to
   try `a - b` in place of `a + b`. The block, exactly, the same in both languages:

   ```python try
   a = 4
   b = 3
   total = a + b
   print(total)
   ```

4. *Guardar lo que devuelve un método* / *Keeping what a method gives back*: the present page
   2, now that the child knows what a variable is. `book = wizard.find_nearest("book")` keeps
   in the variable `book` the book the method gives back, so that the program can use it
   afterwards; if there is no book at all, the value is `None`, Python's word for nothing.
   Neither explain the variable again nor say what `=` does: page 2 did. No block.
5. *Hacer que brille* / *Making it glow*: as it is, word for word.
6. *Pruébalo* / *Try it*: as it is, word for word, with its block.
