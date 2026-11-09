# While

A `for` loop is great when you know exactly how many times you want to repeat something. But we need to wait while Dask looks to the right, and we do not know how many ticks he will do it for!

We can use another loop that repeats its lines over and over as long as its expression is true, and moves on when it becomes false. We write it with the word `while`.

---
## Until it changes

Be careful! If the answer never changes, the loop will never end.

But it is not a disaster: the game will stop a `while` that never ends thanks to the game's tick limit. Just make sure the answer can change!

---
## Try it

Your wizard stays still over and over, while Dask looks to the right. And when he turns, the program will print which way he looks!

```python try
while dask.facing == "right":
    wizard.wait()
print(dask.facing)
```
