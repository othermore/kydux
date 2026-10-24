# Else

Sometimes we need a backup plan.
What if the door is locked?
We must go the other way.
An `if` only runs when the answer is yes.
We need lines to run when the answer is no.

---

That is what `else` is for.
It means otherwise.
It goes after the lines of the `if`.
It must not be moved in.
It has its own colon `:`.
The lines under `else` are moved in by four spaces.
They only run when the condition is `False`.

---

## Try it

Let us test the left door.
Ask if it is locked.
Print one string if it is, and another if it is open.

```python try
if left_door.locked:
    print("left is locked")
else:
    print("left is open")
```
