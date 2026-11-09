# Light and slabs

These night passages are full of secrets. Do you see that dark room? We need to see what is inside.

The spell *kirra* lights the room you are in, so that what lies in the dark shows and you can find it.

---
## The slab that comes and goes

In the dark of the night, a hole opens up on the floor of a cell. A slab covers the hole for a few ticks and goes away for a few more, over and over.

If we cast the spell *osto* next to the hole, it holds the slab in place for a while. To know if it is safe to step on it, we check `hole.closed`. That way we can do `while not hole.closed:` with a wait underneath, and then take the step safely!

---
## Try it

Let us walk two steps down the corridor, right up to the next level's hole, and check if the slab is ready for us to step on.

```python try
wizard.move_right(2)
print(hole.closed)
```
