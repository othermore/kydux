# Light and traps

These night passages are full of secrets. Do you see that dark room? We need to see what is inside.

The spell *kirra* lights the room you are in, so that what lies in the dark shows and you can find it.

---
## The hole that opens

In these passages there are holes that open in the floor: a magic trap, or a dark portal. The hole is closed for a few ticks, the floor whole over it, and open for as many, over and over.

To know how it is, we look at its attributes. `hole.open` is `True` while the hole is open, and `hole.closed` is `True` while the floor covers it: each is always the opposite of the other. So there are two ways to wait that are the same: `while hole.open:` waits while it is open, and `while not hole.closed:` waits while it is not closed. With a wait underneath, once the loop ends we can take the step.

And if we cast the spell *osto* beside the hole, it holds it closed for a while.

---
## Try it

Let us walk two steps along the corridor, right up to the edge of the next level's hole, and look whether it is closed.

```python try
wizard.move_right(2)
print(hole.closed)
```
