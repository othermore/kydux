# While

A `for` loop is great when you know exactly how many times you want to repeat something. But we need to wait while Dask looks our way, and we do not know for how many ticks he will do it!

We can use another loop that repeats its lines over and over while its expression stays true, and moves on when it becomes false. We write it with the word `while`.

---
## Until it changes

Be careful! If the answer never changes, the loop will never end.

But it is not a disaster: the game will stop a `while` loop that does not end, thanks to the game's tick limit. Just make sure the answer can change!

---
## Try it

Let us hide and wait.

Your wizard will stand still over and over, while Dask keeps looking to the left!

```python try
while dask.facing == "left":
    wizard.wait()
```
