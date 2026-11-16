# For each one

If we have a list of brooms, how do we use them? We can write `for broom in brooms:` to run the lines moved in under it once for each value of the list. In each turn, `broom` is the next one!

It is exactly the `for` loop you already know, but going through things instead of counting. The lines inside, moved in by four spaces, can use `broom` to do something with it. For example, if you are standing on it, `broom.untie()` unties its knot.

```python try
names = ["Teku", "Nuri", "Bimo"]
for name in names:
    print(name)
```
