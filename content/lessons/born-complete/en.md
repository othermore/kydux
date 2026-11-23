# Born complete

Giving the data one at a time, after the object is made, is easy to forget, and a half-made familiar does not go in the book. A class can say what an object must be given to be born whole.

---
## `__init__` and `self`

That is done with an action written inside the class, with a name Python knows: `__init__`, with two underscores on each side. Python runs it by itself every time an object of the class is born.

Its first argument is always `self`: the object being born. What is kept in `self.` stays in the object.

```python
class Crow:
    def __init__(self, name, color):
        self.name = name
        self.color = color
```

---
## Making the object

Now the object is made by giving it its data between the brackets: `Crow("Vesso", "black")`.

`"Vesso"` goes to `name`, and `"black"` to `color`. `self` is given nothing: Python puts it there.

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
