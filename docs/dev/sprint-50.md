# Sprint 50 — The notebook's page of Python

On 2026-11-16, while sprint 49 was being built, the owner asked for
one more thing, in their words:

> quiero añadir al cuaderno una sección más donde estén los
> elementos que se hayan ido enseñando ya de sintaxis: for, if,
> while, comparaciones, listas.... simplemente una linea recordando
> lo que hace cada uno, y un ejemplo. Eso ayuda al niño a ver la
> sintaxis para escribir los programas.

What is there today. The notebook (`app/src/ui/notebook.ts`) has
the level's objects with their actions and attributes, each with
an example to click (D30, D40), and a second tab with the spells
and the words (D80). Of Python's own it says three things, after
the objects: `len`, `def` and a `def`'s arguments (D60). A child
who has forgotten the colon of an `if`, how a `for` is written or
which of `=` and `==` compares, has only the lessons to page back
through.

What makes it cheap. A lesson already marks what it teaches of
Python as `concept:<name>` in `teaches`, the course packs the
concepts known at each level, and the page gives them to the
notebook (D60). And a test already holds every level's code to
the concepts taught before it. The designer has read the course
with the eleven new marks of 2.1 in a scratch script: every
level's starting code and solution, and every lesson's block,
uses only what a lesson before it has marked. No content changes
its order.

**What this sprint holds:**

1. Eleven concepts marked in the lessons that teach them, and the
   check that holds a level to its concepts reading them too
   (2.1).
2. A tab *Python* in the notebook: every word and sign of Python
   taught so far, with one line and an example (2.2, D256).
3. Seventeen lines written by Gemini, one a concept (section 4).

## 1. Decisions taken here

D256, to be entered in `docs/dev/architecture.md` by the
programmer as it is built, with these words or closer ones to
what is built:

- **D256 — The notebook has a page of Python.** Decided 2026-11-16
  by the owner (*quiero añadir al cuaderno una sección más donde
  estén los elementos que se hayan ido enseñando ya de sintaxis:
  for, if, while, comparaciones, listas.... simplemente una linea
  recordando lo que hace cada uno, y un ejemplo. Eso ayuda al niño
  a ver la sintaxis para escribir los programas*). Once a lesson
  has taught any of them, the notebook has a tab *Python*, between
  the actions and the spells and words: every word and sign of
  Python the course has taught up to the level, in the order the
  course teaches them, each as it is typed (`if`, `==`, `[ ]`),
  with one line that says what it does and an example of one to
  five lines (`notebook_python.<concept>.does` and `.example`). A
  lesson marks each in `teaches` (`concept:<name>`, D60): a
  comment, a string, `print`, a variable, a sum and a subtraction,
  `==`, `not`, `if`, `else`, `for` with `range`, `while`, a list
  and its index, `len`, `for` over a list, `<` and `>`, `def` and
  a `def`'s arguments. The examples are read, not put into the
  editor: they name things of other programs. An example needs
  only what is taught when its own concept is, and the test that
  holds a level's code to the concepts taught before it holds the
  examples too. Rules out a child paging back through the lessons
  for a colon or a bracket, an entry shown before its lesson, and
  a click that puts into the child's program a name its level does
  not hold.

D60 and D80 are brought to it in the same piece: Python's words
are in their own tab, not after the objects; the notebook has
three tabs.

## 2. What is asked

### 2.1 The marks, and the check that reads them

Eleven concepts join the seven of D60. Each is marked in the
lesson that explains it:

| Lesson | Gains in `teaches` |
|---|---|
| `what-things-know` | `concept:variables`, `concept:arithmetic` |
| `true-or-false` | `concept:equal`, `concept:not` |
| `if` | `concept:if` |
| `else` | `concept:else` |
| `repeat` | `concept:for_range` |
| `while` | `concept:while` |
| `lists` | `concept:lists` |
| `for-each` | `concept:for_each` |
| `less-or-greater` | `concept:less_greater` |

In a lesson's `teaches` the marks stand in the order the lesson
explains them: `what-things-know` has `concept:print` before
`concept:variables` and that before `concept:arithmetic`; `lists`
has `concept:lists` before `concept:len`. The course packs a
level's concepts in the order taught, and nothing else changes in
`pack-world.mjs`.

`world/tests/test_course_content.py` knows the eighteen
(`CONCEPTS`), and `concepts_used` reads the new ones from a piece
of code:

| Concept | What in the code needs it |
|---|---|
| `variables` | an assignment (`name = value`) |
| `arithmetic` | `+` or `-` between two values |
| `equal` | a comparison with `==` |
| `less_greater` | a comparison with `<` or `>` |
| `not` | `not` |
| `if` | an `if` |
| `else` | an `if` with an `else` |
| `for_range` | a `for` over a call of `range` |
| `for_each` | any other `for` |
| `while` | a `while` |
| `lists` | a list written with brackets, or an index |

So the test that a level's starting code and solution need only
the concepts taught before it covers the eighteen. It passes on
the course as it is; were it to fail on a level, the level stays
as it is and the report says which, for the designer.

One more test of the same kind: every block of a lesson
(`python try` or plain) that is whole Python needs only the
concepts taught up to that lesson, its own among them. A block
that is not a whole program (a line shown alone that does not
parse) is passed over.

### 2.2 The tab (D256)

**The tabs.** Three: *Acciones* (`actions`, what is there now but
Python's words), *Python* (`python`) and *Hechizos y palabras*
(`spells`), in that order. A tab is there once it has something:
*Python* from the first level after `lesson:notes` (*Arreglando
el programa*, `the-dark-note`, with one entry), the spells and
words as today. The bar
of tabs shows once there are two. So a tab never moves: *Python*
comes second in chapter 1, and the spells and words join after
it. Its button is `#notebook-tab-python`, its label
`notebook.tab_python`, *Python* in every language; the heading
`notebook.python` goes with the section it headed.

**The entries.** A list (`ul.notebook-syntax`), an item a concept
(`li[data-concept="<name>"]`), in the table's order, which is the
course's. In each item, three things one under the other:

1. the word or sign as it is typed, as code and a little larger
   than the line (`code.syntax-word`): the table's *Shown as*,
   which is Python and is not translated;
2. the line (`span.description`, through `withCode`, so a word
   between backquotes shows as code);
3. the example (`pre.syntax-example` with a `code`), in the
   editor's own font, its lines kept as they are, on the panel's
   colour for code. It is no button: nothing happens at a click,
   and its text can be selected. An example wider than the panel
   scrolls sideways inside its own box; none is at the narrowest
   width the game is played at.

The first tab's examples stay buttons that put a line into the
editor: they are made of the level's own objects.

**The table** (in `notebook.ts`, in place of `PYTHON`): concept,
and how it is shown.

| # | Concept | Shown as | Taught by | The line says |
|---|---|---|---|---|
| 1 | `comments` | `#` | `notes` | a comment is a note for whoever reads the program; the computer skips what follows the `#` on its line |
| 2 | `strings` | `" "` | `words` | a string is words between quotes; the computer keeps them exactly as written |
| 3 | `print` | `print()` | `what-things-know` | shows a value under the editor |
| 4 | `variables` | `=` | `what-things-know` | a variable keeps a value under a name: the name left of the `=`, the value right of it |
| 5 | `arithmetic` | `+  -` | `what-things-know` | add and subtract numbers; the result is a number, to keep or to use |
| 6 | `equal` | `==` | `true-or-false` | compares two values: `True` when they are equal, `False` when not |
| 7 | `not` | `not` | `true-or-false` | says the contrary of an expression |
| 8 | `if` | `if` | `if` | a condition: the lines moved in under it run only when its expression is `True` |
| 9 | `else` | `else` | `else` | goes with an `if`: its lines run when the condition is `False` |
| 10 | `for_range` | `for … in range()` | `repeat` | a loop: runs the lines moved in under it as many times as `range` says |
| 11 | `while` | `while` | `while` | a loop that runs its lines again and again while its expression is `True` |
| 12 | `lists` | `[ ]` | `lists` | a list is several values in order, between square brackets; an element is asked for by its index, counted from 0 |
| 13 | `len` | `len()` | `lists` | says how many values a list has |
| 14 | `for_each` | `for … in …` | `for-each` | a loop over a list: runs its lines once for each element |
| 15 | `less_greater` | `<  >` | `less-or-greater` | compare two numbers, less than and greater than; they answer `True` or `False` |
| 16 | `def` | `def` | `an-action-of-your-own` | a function: gives a name to the lines moved in under it; they run each time the name is written with its brackets |
| 17 | `def_arguments` | `def …(…)` | `arguments-of-your-own` | the names between the `def`'s brackets are the function's arguments; a call gives them their values in the same order |

`concept:arguments` has no entry: what goes between an action's
brackets is shown by every action of the first tab.

**The examples**, letter for letter. Where the two languages
differ, both are given; elsewhere the example is the same in
each.

1. `comments`:

   ```
   # Towards the door
   wizard.move_right()
   ```

   In Spanish the comment is `# Hacia la puerta`.

2. `strings`: `wizard.say("Hello")`; in Spanish
   `wizard.say("Hola")`.

3. `print`: `print(door.locked)`

4. `variables`: `book = wizard.find_nearest("book")`

5. `arithmetic`:

   ```
   total = 4 + 3
   rest = total - 2
   ```

6. `equal`: `print(dask.facing == "up")`

7. `not`: `print(not door.locked)`

8. `if`:

   ```
   if dask.facing == "up":
       wizard.move_right(2)
   ```

9. `else`:

   ```
   if left_door.locked:
       wizard.move_right(2)
   else:
       wizard.move_left(2)
   ```

10. `for_range`:

    ```
    for step in range(3):
        wizard.move_right(2)
    ```

11. `while`:

    ```
    while dask.facing == "right":
        wizard.wait()
    ```

12. `lists`:

    ```
    names = ["Teku", "Nuri", "Bimo"]
    print(names[0])
    ```

    In Spanish the variable is `nombres`, as in the lesson.

13. `len`: `print(len(brooms))`

14. `for_each`:

    ```
    for broom in brooms:
        broom.untie()
    ```

15. `less_greater`:

    ```
    if broom_x < my_x:
        wizard.move_left(my_x - broom_x)
    ```

    In Spanish the variables are `escoba_x` and `mi_x`, as in the
    lesson.

16. `def`:

    ```
    def quick_fly():
        wizard.move_right(2)
        wizard.move_up(2)

    quick_fly()
    ```

17. `def_arguments`:

    ```
    def greet(name):
        print("Hello", name)

    greet("Teku")
    ```

    In Spanish: `def saludar(nombre):`, `print("Hola", nombre)`,
    `saludar("Teku")`.

**The words.** `notebook_python.<concept>` holds two keys in each
language, `does` (the line) and `example`. The lines are Gemini's
(section 4), the seventeen written together so that they read as
one list: the three that are there are written again, since their
examples leave the line.

**What holds it together**, in tests:

- Vitest: the table's concepts are the keys of `notebook_python`
  in every language, each with a `does` and an `example`; the
  entries of a level are the table's that its concepts hold, in
  the table's order; the tabs are those that have something, in
  their order.
- pytest, beside the test of the levels' code: the keys of
  `notebook_python` are `CONCEPTS` but `arguments`; every example
  in every language is whole Python, has the same number of lines
  in each language, and needs only the concepts known once the
  lesson that marks its concept has been read.
- Browser (`notebook.spec.ts`): at *Arreglando el programa* the bar
  has two tabs and *Python* one entry, `comments`, with its example's
  two lines; a click on the example leaves the editor as it was;
  at chapter 4's last level the tab has the seventeen in order;
  at the course's first level there is no bar. The tests that
  click `len` or `def` in the notebook, if any, follow.

**A level outside the course** has every concept, as D60 says of
it: its notebook shows the seventeen.

### 2.3 What the owner will try

1. Chapter 1, *Arreglando el programa*: open the notebook. Two
   tabs; *Python* has `#` with its line and its example.
2. Chapter 3, *Junto a las estatuas*: *Python* has eight entries,
   up to `if`.
3. Chapter 4, *La revancha*: the seventeen, read in a scroll, and
   *Hechizos y palabras* as the third tab. Each line says in one
   breath what the word does, with the words of the lessons.
4. A click on an example of *Python* changes nothing in the
   editor. A click on an example of *Acciones* still writes its
   line.

### 2.4 What is left out, and why

- **No click that writes the example.** It would put `dask` or
  `brooms` into a level that has neither.
- **No link from an entry to its lesson.** The map opens every
  lesson read; the notebook reminds, it does not teach again.
- **No entry for what a level alone uses** (`None`, a `print` of
  two values, an `if` inside a loop): they are no word or sign of
  their own, and the list is long as it is.
- **No search and no grouping.** Seventeen entries in the order
  learned; a child finds a word where it has always been.

## 3. The pieces

One local commit each, in order.

### 3.1 The marks and the check (2.1)

The lessons' `teaches`, `CONCEPTS`, `concepts_used`, the test of
the lessons' blocks. `ci/check.sh` green.

### 3.2 The tab (D256, 2.2)

The brief, its drafts read and corrected, the lines and the
examples in `i18n/`; the table, the tabs and the entries in
`notebook.ts`, their styles; the three kinds of tests of 2.2;
`tools/i18n_dynamic.txt`'s words for `notebook_python.` and
`notebook.`; D256 entered and D60 and D80 brought to it; the
notebook's line in `README.md` and `README.es.md` naming the
page of Python; `docs/dev/plan.md` and `docs/dev/course.md` where
they tell the notebook or the concepts. `ci/check.sh` and
`notebook.spec.ts`, with every spec that opens the notebook,
green.

### 3.3 The whole check and the report

`ci/check.sh --e2e` whole, once, in a copy. The report in
Spanish, in `drafts/`, with the four steps of 2.3 and three
pictures of the current commit, in Spanish: the tab at *Arreglando
el programa*, at *Junto a las estatuas* and at *La revancha* (the
panel scrolled in two pictures if one does not hold it). The
seventeen lines in both languages are in the report as a table,
for the owner to read. The memory note `kydux-sprint-50-state`,
and the prompt for the designer's review.

## 4. Gemini

No image. One brief, `tools/write/briefs/sprint-50-the-python-page.md`,
written by the programmer from this plan and run with
`tools/write/write.py`: the seventeen lines in both languages.

The brief carries the bible, the course, every lesson of the
table whole in both languages, the three lines there are, the
owner's words whole, the table of 2.2 (what each line says) and
each example as 2.2 gives it, so that no line repeats its
example. And the rules: one sentence a line, two short ones at
most, no longer than about 110 letters; it says what the word or
sign does, as a reminder to one who has read the lesson, and
teaches nothing new; the programming words of the lessons and no
other (*comentario*, *cadena*, *variable*, *expresión*,
*condición*, *bucle*, *lista*, *elemento*, *índice*, *función*,
*argumento*; *comment*, *string*, *variable*, *expression*,
*condition*, *loop*, *list*, *element*, *index*, *function*,
*argument*), and the lessons' own words for a line moved in and
for brackets; no metaphor, since none of these is explained here
for the first time; nothing of the story and no character; no
mark of the wizard's gender; a word of Python between backquotes.

## 5. The prompt for CLAUDE-programmer

```
You are CLAUDE-programmer on Kydux, at /home/other/Projects/kydux.

This is sprint 50, a small one, planned while you were building
sprint 49. Read it when the command you are running ends. Finish
sprint 49 whole first, its last commit, its report and its prompt
for the review; then build this one without waiting for that
review.

Read: docs/dev/sprint-50.md (this plan, whole), D60 and D80 in
docs/dev/architecture.md, app/src/ui/notebook.ts with its tests,
world/tests/test_course_content.py from CONCEPTS to the test of a
level's code, and the memory note kydux-checks-per-piece.

The owner asks for one more section in the notebook: the words and
signs of Python taught so far, each with one line and an example,
so that a child sees how an if or a for is written while writing
a program. It is D256, a tab Python between the actions and the
spells and words. D256 is given in the plan's section 1 and is
yours to enter in architecture.md as you build it.

Build pieces 3.1 to 3.3 in order, one local commit each; before
each commit ci/check.sh and the browser specs the piece touches
green, and the whole ci/check.sh --e2e once before the last, in a
copy with Playwright's own server on 4173 and the app built anew
in that copy; never a push, never a timer, never a deploy. Never
stop or build into the servers on ports 443 and 5173, and stop
your own preview when you are done. No image is asked of Gemini.
One text is: the brief of section 4, run, its drafts read and
corrected; the key stays in ~/.config/kydux/secrets.env and never
enters a file of the tree, a commit, a log or the report. Nothing
under .github/ changes.

What the owner will look for:
(1) a tab Python in the notebook from Arreglando el programa
    (the-dark-note) on, second of the tabs, the spells and words
    third when they come;
(2) in it every word and sign taught up to the level, in the
    order taught, seventeen at the course's end: the word as it
    is typed, one line, an example of one to five lines;
(3) lines that remind in one breath, in the lessons' own words,
    with no metaphor and nothing new;
(4) examples that are read: a click writes nothing; the first
    tab's examples still write their line;
(5) len and def in that tab, no longer after the objects.

The plan gives the eleven marks, the table and every example
letter for letter: change none. The course holds to the new
marks as it is; if the check fails on a level, leave the level
and say which in the report. Where the plan does not decide,
take the smallest choice that keeps its intent and say it in the
commit. Never edit content while a browser run is going. Every
document and comment in the present. Before git add, read git
diff of each file and stage only your own hunks.

docs/dev/sprint-50.md is the designer's and is committed already;
leave it as it is.

Hand over, in drafts/ and never committed: the report in Spanish
as 3.3 asks, with the owner's four steps of 2.3, the three
pictures and the table of the seventeen lines. Write your memory
note kydux-sprint-50-state, and end with the prompt for the
designer's review in English, in a code block.
```
