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
        self.caws = 0

    def caw(self, times):
        for i in range(times):
            print("Craaak!")
        self.caws = self.caws + times
        print("(and that makes", self.caws, "caws)")
```

With `times` we tell him how many caws to give. Then he says how many that makes.

---
## Using the method

You use it with the dot: `vesso.caw(3)`.

What comes before the dot is what Python puts in `self`. That is why there is only one thing between the brackets.

---
## What it is for

Knowing the method's name, you can make your familiar run it without knowing how it is made inside.

Inside a method, `self` can use everything the object has: its attributes and its other methods, the inherited ones too.

---
## Two orders

Let us teach Vesso to caw and to count his caws. Every time you tell him to caw, he will caw as many times as you say and tell you how many that makes.

```python try
class Crow:
    def __init__(self, name):
        self.name = name
        self.caws = 0

    def caw(self, times):
        for i in range(times):
            print("Craaak!")
        self.caws = self.caws + times
        print("(and that makes", self.caws, "caws)")

vesso = Crow("Vesso")
vesso.caw(3)
vesso.caw(2)
```
