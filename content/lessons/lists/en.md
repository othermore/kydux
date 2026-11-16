# Lists

Sometimes we want a variable to keep several values at once, all in order. We put them inside square brackets and separate them with commas, like this: `names = ["Teku", "Nuri", "Bimo"]`. If you tell the computer to `print(names)`, it shows the whole group!

Programmers call this a list.

---
## Finding them all

How do we know how many values a list has? `len(names)` says the number.

Just like `find_nearest` gave us one thing, `wizard.find_all("broom")` gives us a list of every broom in the place, nearest first. The computer shows them to us even where the straw covers them! Each value in that list is a broom object, with its own attributes like `position`.

```python try
names = ["Teku", "Nuri", "Bimo"]
print(names)
print(len(names))
```
