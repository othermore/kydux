# Born complete

Giving the data one at a time, after the object is made, is easy but unsafe. In the book we must write one single instruction, one line, that conjures the familiar. Everything else will have to be in the familiar's description.

A class, the description, can assign the object's attributes, so that it has them the moment it is conjured.

---
## `__init__` and `self`

That is done with a method written inside the class, with a name Python knows: `__init__`, with two underscores on each side. It is the method used when an object of the class is conjured: Python runs it by itself every time.

Its first argument is always `self`: the object being born. What is kept in `self.` stays in the object.

```python
class Crow:
    def __init__(self, name, color):
        self.name = name
        self.color = color
```

---
## Making the object

Now the object is made by giving it its data between the brackets: `Crow("Vesso", "black")`. Those are the data the function `__init__` receives, and it sees to assigning them to the object.

`"Vesso"` goes to `name`, and `"black"` to `color`. Nothing is put in the call for `self`: Python puts that one in.

---
## Two whole crows

Here two crows are born, each with its data. Once you have tried it, take a piece of data out from between the brackets and see what Python says.

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
