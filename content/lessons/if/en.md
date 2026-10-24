# If

Sometimes a program should do something only in some cases.
Wait, but only if the teacher is looking this way.
Open the door, but only if it is locked.

That is what `if` is for.
It means *only when*.

---

## Writing an if

```python
if dask.facing == "left":
    wizard.wait()
wizard.move_up(2)
```

After `if` comes a question, and then a colon, `:`.
The lines under it, moved in by four spaces, run only when the answer is `True`.
The four spaces say which lines belong to the `if`.

`wizard.wait()` makes the wizard stand still for one tick, while the world goes on.
A tick is one step of the castle's clock: every action the wizard does takes one.

The line that is not moved in runs every time, after the `if`.

---

## One program, every way

The next level is played two ways.
In one, Dask looks away.
In the other, he looks this way.

The same program must get through both.
A program that only walks gets caught in one way.
A program that only waits gets caught in the other.

---

## Try it

Ask the question, and wait only when the answer is yes.

```python try
if dask.facing == "left":
    wizard.wait()
```
