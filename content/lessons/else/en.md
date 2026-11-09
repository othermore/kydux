# Else

When you ask a question with `if`, you know what to do if the answer is `True`. But what if the answer is no? You might want to do something else instead.

We use the word `else` to say what happens when the condition is `False`, and we write the lines that the computer must run then.

---
## Making a choice

The `else` is put in the same place as its `if`, with no spaces before it, and it has its own colon. Then, we move its lines in with four spaces underneath.

When the computer reads this, one of the two parts will always run. If the condition is true it runs the first part, and if it is false it runs the second!

---
## Try it

Let us check which way Dask is looking right now.

The computer will print one string or the other, but never both!

```python try
if dask.facing == "left":
    print("Dask looks left")
else:
    print("Dask does not look left")
```
