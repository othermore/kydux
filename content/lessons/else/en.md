# Else

An `if` does its lines when the answer is yes.
But sometimes there is something else to do when it is no.

Two doors, one locked.
If the left one is locked, go right.
Otherwise, go left.

*Otherwise* is `else`.

---

## Writing an else

```python
if left_door.locked:
    print("left is locked")
else:
    print("left is open")
```

`else` comes after the lines of the `if`, at the same place as `if`, with its own colon.
Its lines, moved in, run only when the answer is `False`.

So one of the two always runs, and never both.

---

## Try it

The next level is played two ways: in each, a different door is locked.
Ask the left door first.

```python try
if left_door.locked:
    print("left is locked")
else:
    print("left is open")
```
