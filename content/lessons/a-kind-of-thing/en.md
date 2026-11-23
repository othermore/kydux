# A kind of thing

Since your first day you have known that in a program everything is an object: you, a door, a broom. What we have not told you is where they come from. Every door opens and can be locked; every broom flies. Once, someone described what a door is, and ever since, every door has come from that description.

---
## The class

In Python, the description of a kind of thing is called a **class**. It is written with `class`, a name that starts with a capital letter, and a colon. Under it, moved in, goes what that kind of thing has. If it has nothing yet, you write `pass`, which means "nothing here yet".

A class is like a biscuit mould: nobody eats the mould; what you eat are the biscuits that come out of it.

```python
class Crow:
    pass
```

---
## The object

A thing made with the class is an **object**. You make one by writing the class's name with brackets, and you keep it with a name, like any value.

```python try
class Crow:
    pass

one = Crow()
other = Crow()
print(one)
print(other)
print(one == other)
```

When it prints an object, Python says it is a `Crow` and adds a long number, which is its place in the memory. The two numbers are different, and the last line gives `False`: two objects have come out of one class, and they are not the same one.

---
## The first-years' familiars

In the book of Arvelia there is a page for the first-year pupils. It gives the six kinds of familiar you may describe, and the class of each: the fox is `Fox`; the crow, `Crow`; the bat, `Bat`; the hare, `Hare`; the mouse, `Mouse`; and the frog, `Frog`. Older pupils describe others; first-years, these.

In the tower hall, the first line of your class also carries `(Familiar)`, like this: `class Fox(Familiar):`. With it you say that your fox is a familiar of Arvelia. What lies behind those brackets I will tell you later.

The spell that calls what you describe into the circle is *minka*: `wizard.cast("minka", ...)`, with the object you want to call.
