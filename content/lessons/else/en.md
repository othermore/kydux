# Else

When you ask a question with `if`, you know what to do if the answer is `True`. But what if the answer is no? You might want to do something else instead.

We use the word `else` to say what happens when the condition is `False`.

---
## Making a choice

The `else` goes at the same place as its `if`, with no spaces before it, and gets its own colon. Then, we move its lines in by four spaces underneath.

When the computer reads this, one of the two parts will always run. If the first part runs, it skips the second. If the first part is skipped, it runs the second!

---
## Try it

Let us check a door to see if it is locked. The computer will print one string or the other, but never both!

```python try
if left_door.locked:
    print("left is locked")
else:
    print("left is open")
```
