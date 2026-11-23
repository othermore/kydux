# What it does

Your familiar already knows things: it knows how to do what every familiar does. Now you are going to teach it a new skill.

Until now you have used methods on objects: `wizard.move_up()` uses a method of `wizard`. Today you will write a method of your own.

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

Knowing the method's name, you can make your familiar run it without knowing how it is made inside.

Inside a method, `self` can use everything the object has: its attributes and its other methods, the inherited ones too.

---
## Two orders

Let us teach Vesso to hop and to count his hops. Every time you tell him to hop, he will tell you how many times he has hopped.

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
