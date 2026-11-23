# Lists

We have to check all the brooms, but how many are there? And how do we find them? There's a way to find all the things of the same kind. I'll show you.

Sometimes we want a variable to keep several values at once, all in order. We put them inside square brackets and separate them with commas, like this: `names = ["Teku", "Nuri", "Bimo"]`. If you tell the computer to `print(names)`, it shows the whole group!

Programmers call this a list.

---
## Find them all

How do we know how many values a list has? `len(names)` says the number.

Just like `find_nearest` gave us one thing, `wizard.find_all("broom")` gives us the list of every broom you can find from where you stand, nearest first. Remember that by the wall you'll find the hanging ones, and in the straw the ones lying on the floor! Each value in that list is a broom object, with its own attributes like `position`.

```python try
names = ["Teku", "Nuri", "Bimo"]
print(names)
print(len(names))
```

---
## Just one of them

And what if we just want one of the values of the list? Each value in a list is an element.

We can get an element of the list by its place, which programmers call an index. `names[0]` is the first one, since a list counts from 0, just like the cells of the grid. The third one would be `names[2]`!

Using an index the list doesn't have, like `names[3]` in a list of three, is an error, and the game will tell you: "The list doesn't have that many: it has 3, and you wanted number 4."

```python try
names = ["Teku", "Nuri", "Bimo"]
print(names[0])
print(names[2])
```
