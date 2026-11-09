# Else

When we check something with `if`, we know what to do if the answer is `True`. But what if the answer is no? We might want to do something else instead.

We use the word `else` to say what happens when the condition is `False`, and we write the lines that the computer must run then.

---
## Making a choice

The `else` goes in the same place as its `if`, with no spaces in front, and it has its own colon. Then, we move its lines in with four spaces underneath.

When the computer reads this, one of the two parts will always run. If the condition is true it runs the first one, and if it is false it runs the second one!

---
## Try it

For example, if the left door is locked, we go through the right one; if not, through the left.

Right now the left door is locked, so the program will print the first message!

```python try
if left_door.locked:
    print("We go through the right door")
else:
    print("We go through the left door")
```
