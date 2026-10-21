# While

A `for` repeats a number of times you know.
But sometimes you do not know how many times.

Wait, as long as the teacher looks this way.
Nobody knows for how long: it depends on the teacher.

A loop that goes on *as long as* a question says yes is a `while`.

---

## Writing a while

```python
while dask.facing == "left":
    wizard.wait()
wizard.move_up(2)
```

`while` asks its question.
If the answer is `True`, it does its lines, and then asks again.
When the answer is `False`, it stops, and the program goes on below it.

---

## A while that never ends

If the answer never turns to `False`, the loop never stops.
The wizard would wait for ever.

The level has a limit of ticks, so the run ends, and the card says so.
Then look at the question: can its answer ever change?

---

## Try it

Wait as long as Dask looks this way, and then cross.

```python try
while dask.facing == "left":
    wizard.wait()
```
