# An if inside the loop

An `if` can go inside a `for`, so that each turn does one thing or another depending on that turn's value. The `if`'s lines are moved in by eight spaces: four for the `for` and four for the `if`.

A broom's `knotted` attribute is `True` while its black thread is still knotted. Untying a broom with no knot is an error that stops the program, so we must make sure our program looks at `knotted` before it unties!

```python try
names = ["Teku", "Nuri", "Bimo"]
for name in names:
    if name == "Bimo":
        print(name, "is a cat")
```
