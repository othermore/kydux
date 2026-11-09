# Light and slabs

These night corridors are full of secrets. Do you see that dark room? We need to see what is inside.

The spell *kirra* lights the room you are in, so that what lies in the dark shows and you can find it.

---
## The slab that comes and goes

In the dark of the night, a hole opens in the floor of one cell. A stone slab covers it for a few ticks and is gone for as many, over and over.

If we cast the spell *osto* beside the hole, it holds the slab in place for a while. To know if it is safe to step, we ask `slab.in_place`. This way, we can do `while not slab.in_place:` with a wait underneath, and then step safely!

---
## Try it

Let us walk two steps along the corridor, right up to the hole for the next level, and check if the slab is ready for us to step on.

```python try
wizard.move_right(2)
print(slab.in_place)
```
