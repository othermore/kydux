# While

A `for` loop is great when you know the steps.
But we do not know how long Dask will look this way!
We must wait as long as he looks.
We can mix a loop and a condition together.
This is a `while` loop.

---

A `while` loop repeats its lines as long as its expression is `True`.
It asks the question.
It does the lines if the answer is yes.
Then it asks again.
When the answer is `False`, it stops.

---

If the answer never changes, the loop never stops!
You would wait until you are tired.
The game has a limit, and the run ends.
Always make sure the answer can change.

---

## Try it

Wait as long as Dask looks left.
Stay very quiet!

```python try
while dask.facing == "left":
    wizard.wait()
```
