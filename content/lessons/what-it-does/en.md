# What it does

Your familiar already knows things, and knows how to do what every familiar does. Now it is going to know how to do something of its own. You have used methods since the first day: `wizard.move_up()` uses a method of `wizard`. Today you will write one.

---
## Writing a method

A **method** is written with `def`, inside the class, and its first argument is `self`, as in `__init__`. Here `self` is the object that is given the order.

```python
class Crow:
    def __init__(self, name):
        self.name = name
        self.hops = 0

    def hop(self, times):
        self.hops = self.hops + times
        print(self.name, "has hopped", self.hops, "times")
```

---
## Using the method

You use it with the dot: `vesso.hop(3)`.

What comes before the dot is what Python puts in `self`. That is why there is only one thing between the brackets.

---
## What it is for

Whoever knows the method's name can send your familiar without knowing how it is made inside.

Inside a method, `self` can use everything the object has: its attributes and its other methods, the inherited ones too.

---
## Two orders

Here Vesso is given two orders. After each one he says how many times he has hopped so far: three, then five.

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
