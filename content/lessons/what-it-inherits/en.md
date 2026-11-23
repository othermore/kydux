# What it inherits

Look at this description of {familiar_a_kind}. In its first line there is something I have not told you much about yet: `Familiar`.

```python
{familiar_source}

{familiar_var} = {familiar_class}("{familiar}", "{familiar_color}")
```

---
## The class `Familiar`

With the first line you say that a `{familiar_class}` is a `Familiar`. `Familiar` is another class, and it has been written in this book since long before you came: it describes what no familiar of Arvelia can do without, and so we make things a little easier for you first-years.

A class that says it is of another has everything the other has, without writing it. That is called to **inherit**.

---
## What your familiar inherits

Your familiar knows where it is, `position`, and knows how to walk, with `move_up`, `move_down`, `move_left` and `move_right`. They are the same names your `wizard` uses, and they do the same. It also knows how to pick up what lies under it, with `pick_up`.

As soon as it leaves the circle, your familiar will become an object that is in your programs by its name, just as `wizard` is.

---
## An empty class

Here are two classes that are not of familiars. `Person` describes a person, who has a name. `Student`, a pupil's class, says it is a `Person`, and it is empty.

Even so, Tavi is made with a name: `Student` inherits the `__init__` of `Person`.

```python try
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    pass

tavi = Student("Tavi")
print(tavi.name)
```
