# What it inherits

This is the description of your last trial. Look at its first line. You have written this since the first day, and I have not told you what it is.

```python
{familiar_source}

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
```

---
## The class `Familiar`

In the first line you say that a `{familiar_class}` is a `Familiar`. `Familiar` is another class, and it has been written in this book since long before you came: it describes what every familiar of Arvelia has.

A class that says it is of another has everything the other has, without writing it. That is called to **inherit**.

---
## What your familiar inherits

Your familiar knows where it is, `position`, and knows how to walk, with `move_up`, `move_down`, `move_left` and `move_right`. They are the same names your `wizard` uses, and they do the same.

As soon as it leaves the circle, it will be in your programs by its name.

---
## An empty class

Here is a small `Familiar`, written where you can see it. The class `Crow` is empty, and still Vesso is born with his name: he inherits the `__init__` of `Familiar`.

```python try
class Familiar:
    def __init__(self, name):
        self.name = name

class Crow(Familiar):
    pass

vesso = Crow("Vesso")
print(vesso.name)
```
