---
outputs:
  - content/lessons/a-kind-of-thing/en.md
  - content/lessons/a-kind-of-thing/es.md
  - content/lessons/what-it-knows/en.md
  - content/lessons/what-it-knows/es.md
  - content/lessons/born-complete/en.md
  - content/lessons/born-complete/es.md
  - content/lessons/what-it-inherits/en.md
  - content/lessons/what-it-inherits/es.md
  - content/lessons/what-it-does/en.md
  - content/lessons/what-it-does/es.md
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/lessons/an-action-of-your-own/en.md
  - content/lessons/an-action-of-your-own/es.md
  - content/lessons/arguments-of-your-own/es.md
  - content/lessons/lists/es.md
---
Write the five lessons of chapter 5 of Kydux, *The familiar*, in English and Spanish: the
files listed. The owner wrote each lesson page by page, in Spanish; their pages are given
below. Keep their ideas, their examples and their order, every block exactly as given, and
write the words in your own natural prose; where a line is given between « », keep it as
it is. Write English that says the same.

Orla, the head of the school, teaches all five, standing by the lectern in the highest hall
of her tower, by the afternoon sun, the great book of Arvelia open beside her and Bimo, her
grey cat, asleep on it: calm and kind, a few words at a time. It is the last day of the
first year, and each pupil is being given a familiar, which is not chosen but described.
Each lesson is a few short pages, separated by a line with only `---`; the first page opens
with the `#` title; a page's heading, where it has one, is `##`.

## What the child knows by now

All of chapters 1 to 4: programs, objects and methods (*actions*), comments, arguments,
strings, attributes, `print`, variables, `None`, sums, the grid's cells and positions with
`x` and `y`, `==` and `not`, `if` and `else`, `for` with `range`, `while`, lists, `len`,
`for` over a list, `<` and `>`, flying with *drevo*, and functions of their own with `def`
and their arguments. They have read objects' attributes for three chapters
(`door.locked`, `thread.position.x`) and used their methods (`wizard.move_up()`). Never
explain any of it again: a sentence may recall one in a few words. What they do not know is
where objects come from: these lessons teach it.

## Words the owner has ruled on

- A metaphor stands only where its idea is first explained, beside its programming word,
  and only once; after that, the programming word, recalled once in parentheses at most.
  The ideas first explained here: a **class** (*clase*), an **object** (*objeto*), an
  **attribute** (*atributo*), `__init__` and `self`, to **inherit** (*heredar*), a
  **method** (*método*). The owner's one metaphor is the mould and the biscuits, in lesson 1.
- A program **looks at** an attribute and **uses** a method; it never *asks*: never
  *preguntar*, *pregunta*, *ask*, *question*. Never *bajo un nombre* / *under a name*.
- The computer, the game, runs the program, never "the castle"; Python is Python.
- `{wizard}` is the wizard; `{friend}` and `{mate}` the two friends (never Nuri or Teku). The
  wizard's familiar is `{familiar}`, and its class's name `{familiar_class}`: never its
  kind in words, since the child chooses it. The examples' creatures are Orla's own: Vesso,
  her old crow, black, and Dalu, a white crow.
- Not taught, and in no text: `super()`, attributes of a class, `__str__`, properties.
- A block that the child runs on the page is fenced ```python try; a block only shown, not
  run, is fenced ```python. Variables in the examples keep the names given (`vesso`,
  `dalu`, `one`, `other`) in both languages; the strings they print may be translated.
- Spanish from Spain, natural, for a child of eight to twelve; English that says the same.

## The lessons

1. `a-kind-of-thing`, *Un tipo de cosa* / *A kind of thing*, four pages.
   1. Orla: since the first day you know that in a program everything is an object: you, a
      door, a broom. What we have not told you is where they come from. Every door opens and
      can be locked; every broom flies. Someone once described what a door is, and ever since
      every door comes from that description.
   2. In Python the description of a kind of thing is called a **class**. It is written with
      `class`, a name with a capital letter and a colon, and under it, moved in, what that
      kind of thing has. If it has nothing yet, `pass` is written, which means "nothing here
      yet". The metaphor, here alone: the class is the mould, and it is not eaten; what is
      eaten are the biscuits that come out of it. Show, not run:
      ```python
      class Crow:
          pass
      ```
   3. A thing made with the class is an **object**. It is made by writing the class's name
      with brackets, and kept with a name, as any value. *Try it*:
      ```python try
      class Crow:
          pass


      one = Crow()
      other = Crow()
      print(one)
      print(other)
      print(one == other)
      ```
      Python shows each object in its own way: it says it is a `Crow` and a long number,
      which is its place in the memory. The two numbers differ, and the last line gives
      `False`: two objects have come out of one class, and they are not the same one.
   4. The page of Orla's book, with its drawings: the six kinds of familiar a first-year may
      describe, and each one's class: `Fox`, `Crow`, `Bat`, `Hare`, `Mouse` and `Frog`. Older
      pupils describe others; first-years, these. And one sentence: in the tower hall, the
      first line of your class also carries `(Familiar)`, like this, `class Fox(Familiar):`;
      with it you say that your fox is a familiar of Arvelia. What lies behind those brackets
      Orla tells later. The word that calls what you describe into the circle is *minka*:
      `wizard.cast("minka", ...)` with the object to call. Name the six kinds in words too
      (*zorro, cuervo, murciélago, liebre, ratón y rana*). No block on this page.
2. `what-it-knows`, *Lo que sabe* / *What it knows*, four pages.
   1. Orla: an object knows things about itself: its **attributes**. You have looked at them
      many times: `door.locked`, `wizard.items`. Until today you have read them. Those of your
      class you write yourself.
   2. They are written as they are read, with the dot, and with `=` as any name:
      `vesso.name = "Vesso"`. The attribute is that object's own and no other's. And it is not
      the same as the program's name: `vesso` is how your program calls the object;
      `vesso.name` is what the object knows of itself.
   3. *Try it*:
      ```python try
      class Crow:
          pass


      vesso = Crow()
      vesso.name = "Vesso"
      vesso.color = "black"
      print(vesso.name, vesso.color)

      other = Crow()
      print(other.name)
      ```
      The last line gives an error, and it is the one to see: `other` is another object, and
      nobody has given it a name. The game's explanation: «Este objeto no tiene nada que se
      llame `name`.» Say that the error is meant, and why.
   4. The page of the book: a first-year's familiar has two attributes, `name` and `color`,
      and no more. The name is a single word. The colour is one of its kind's natural ones,
      with its drawings: a fox `"red"`, `"white"` or `"black"`; a crow `"black"` or `"white"`;
      a bat `"black"` or `"white"`; a hare `"brown"` or `"white"`; a mouse `"brown"` or
      `"white"`; a frog `"green"` or `"red"`. Never grey. Orla: the other colours, and other
      attributes, ask for magic learned in later years. No block on this page.
3. `born-complete`, *Nacer completo* / *Born complete*, four pages.
   1. Orla: giving the data one by one, after the object is made, is easy to forget, and a
      half-made familiar does not go in the book. A class can say what an object must be
      given to be born whole.
   2. That is done with an action written inside the class, with a name Python knows:
      `__init__`, two underscores on each side. Python runs it by itself each time an object
      of the class is born. Its first argument is always `self`: the object being born. What
      is kept in `self.` stays in the object. Show, not run:
      ```python
      class Crow:
          def __init__(self, name, color):
              self.name = name
              self.color = color
      ```
   3. Now the object is made by giving it its data between the brackets:
      `Crow("Vesso", "black")`. `"Vesso"` goes to `name` and `"black"` to `color`. `self` is
      given nothing: Python puts it there.
   4. *Try it*:
      ```python try
      class Crow:
          def __init__(self, name, color):
              self.name = name
              self.color = color


      vesso = Crow("Vesso", "black")
      dalu = Crow("Dalu", "white")
      print(vesso.name, vesso.color)
      print(dalu.name, dalu.color)
      ```
      With the usual invitation to change it: take a datum out from between the brackets and
      see what Python says.
4. `what-it-inherits`, *Lo que hereda* / *What it inherits*, four pages.
   1. Orla looks at the description of the child's last trial, which the game writes from
      what the child described, and puts her finger on the first line: «Esto lo has escrito
      desde el primer día, y no te he dicho qué es.» The page shows it, exactly so, a block
      only shown:
      ```python
      {familiar_source}

      {familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
      ```
   2. Orla: in the first line you said that a `{familiar_class}` is a `Familiar`. `Familiar` is
      another class, and it is written in this book since long before you came: it describes
      what every familiar of Arvelia has. A class that says it is of another has everything the
      other has, without writing it. That is called to **inherit**.
   3. What your familiar inherits: it knows where it is, `position`, and it knows how to walk,
      with `move_up`, `move_down`, `move_left` and `move_right`. They are the same names your
      `wizard` uses, and they do the same. As soon as it leaves the circle it will be in your
      programs by its name.
   4. *Try it*, with a small `Familiar` written in sight:
      ```python try
      class Familiar:
          def __init__(self, name):
              self.name = name


      class Crow(Familiar):
          pass


      vesso = Crow("Vesso")
      print(vesso.name)
      ```
      The class `Crow` is empty, and still Vesso is born with its name: it inherited the
      `__init__` from `Familiar`.
5. `what-it-does`, *Lo que hace* / *What it does*, five pages.
   1. Orla: your familiar already knows things, and knows how to do what every familiar does.
      Now it is going to know how to do something of its own. You use methods since the first
      day: `wizard.move_up()` uses a method of `wizard`. Today you write one.
   2. It is written with `def`, inside the class, and its first argument is `self`, as in
      `__init__`: here `self` is the object that is given the order. Show, not run:
      ```python
      class Crow:
          def __init__(self, name):
              self.name = name
              self.hops = 0

          def hop(self, times):
              self.hops = self.hops + times
              print(self.name, "has hopped", self.hops, "times")
      ```
      In Spanish, the printed words may be «ha saltado» and «veces».
   3. It is called with the dot: `vesso.hop(3)`. What is before the dot is what Python puts in
      `self`; that is why between the brackets there is only one thing.
   4. What it is for: whoever knows the method's name can send your familiar without knowing
      how it is made inside. Inside a method, `self` can use everything the object has: its
      attributes and its other methods, the inherited ones too.
   5. *Try it*: the class above and two orders:
      ```python try
      class Crow:
          def __init__(self, name):
              self.name = name
              self.hops = 0

          def hop(self, times):
              self.hops = self.hops + times
              print(self.name, "has hopped", self.hops, "times")


      vesso = Crow("Vesso")
      vesso.hop(3)
      vesso.hop(2)
      ```
      It prints how many hops Vesso has made after each order: three, then five.

Each lesson's title in its first page's `#`: *Un tipo de cosa* / *A kind of thing*; *Lo que
sabe* / *What it knows*; *Nacer completo* / *Born complete*; *Lo que hereda* / *What it
inherits*; *Lo que hace* / *What it does*. The last page of each ends with the lesson's last
block where it has one; the button to the level is the game's.
