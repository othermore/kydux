# If

Knowing the answer to an expression is great, but doing something only when the answer is yes is even better! Programmers call this a condition. We write it with the word `if`.

We write `if`, then our expression, and a colon at the end. Underneath, we move our lines in by leaving four spaces. The computer will only run these spaced lines if the answer is `True`.

---
## A condition

If Dask looks up, we want to walk down two cells.

This code prints your wizard's cell, which only changes if the condition is true.

```python try
if dask.facing == "up":
    wizard.move_down(2)
print(wizard.position)
```

---
## Try it

Change `"up"` for `"down"` in the code. You will see that the cell stays the same because the condition is no longer true!

```python try
if dask.facing == "up":
    wizard.move_down(2)
print(wizard.position)
```
