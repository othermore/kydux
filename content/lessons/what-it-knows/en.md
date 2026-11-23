# What it knows

An object knows things about itself: its **attributes**. You have looked at them many times: `door.locked`, `wizard.items`. Until today you only read them. The ones of your own class, you write yourself.

---
## Written as they are read

An attribute is written just as it is read, with the dot, and it is given its value with `=`, like any name: `vesso.name = "Vesso"`.

The attribute belongs to that object and to no other. And it is not the same as the program's name: `vesso` is what your program calls the object; `vesso.name` is what the object knows of itself.

---
## An error to see

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

The last line gives an error, and it is just the one to see: `other` is another object, and nobody has given it a name. The game explains it like this: "This object has nothing called `name`."

---
## Two attributes, and no more

As I told you before, the rules are clear for first-year pupils: a first-year's familiar has two attributes, `name` and `color`, and no more. The name is a single word.

The colour is one of its kind's natural ones: a fox can be `"red"`, `"white"` or `"black"`; a crow, `"black"` or `"white"`; a bat, `"black"` or `"white"`; a hare, `"brown"` or `"white"`; a mouse, `"brown"` or `"white"`; and a frog, `"green"` or `"red"`. Grey, never.

The other colours, and other attributes, need deeper magical knowledge, and you will not be able to do it until later years.
