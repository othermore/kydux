# While

A `for` loop is great when you know exactly how many times to repeat something. But we cannot know how long Dask will look our way!

We can use a different loop that keeps going as long as an expression is `True`. We write it with `while`.

---
## Waiting for a change

The `while` loop checks its expression, runs the moved-in lines if it is `True`, and then checks again. It only stops when the answer is `False`.

Be careful! If the answer never changes, the loop never ends. The game stops a run that goes on too long, so make sure the answer can change.

---
## Try it

Let us hide and wait. Your wizard will stand still over and over, as long as Dask keeps looking to the left!

```python try
while dask.facing == "left":
    wizard.wait()
```
