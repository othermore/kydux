# For each one

If we have a list of brooms, how do we use them? We can write `for broom in brooms:` to run the lines moved in under it once for each element of the list. In each turn, `broom` is the next one!

It's exactly the `for` loop you already know, but going through things instead of counting. The lines inside, moved in by four spaces, can use `broom` to do something with it. For example, if you stand on it, `broom.untie()` unties its knot.

```python try
names = ["Teku", "Nuri", "Bimo"]
for name in names:
    print(name)
```

---
## By its place

We can also do the same loop over the places of the list: `for i in range(len(brooms)):`. Here the `i` is the index counting the turns, from 0, as `range` does. Inside the loop we use `brooms[i]` to get the broom for that turn.

When is each way handy? The first one is great to do something with each element. The second one is good when the number of the turn matters too.

```python try
names = ["Teku", "Nuri", "Bimo"]
for i in range(len(names)):
    print(i, names[i])
```
