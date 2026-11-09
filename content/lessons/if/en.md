# If

Knowing the answer to an expression is great, but doing something only when the answer is yes is even better! Programmers call this a condition. We write it with the word `if`.

We write `if`, then our expression, and a colon at the end. Underneath, we move our lines in by leaving four spaces. The computer will only run these spaced lines if the answer is `True`.

---
## A condition

The first line is the condition. The line under it, moved in by four spaces, runs only when the condition is `True`. The last line is not moved in, so it runs always, and prints the word and your wizard's cell. Given two values separated by a comma, `print` writes both, with a space between them.

Dask looks up right now, so this program prints both lines. Change `"up"` to `"down"` and run it again, and only the cell is printed, because the condition is no longer `True`.

```python try
if dask.facing == "up":
    print("Looking up")
print("Position:", wizard.position)
```
