# Light and stairs

These night passages are full of secrets. Do you see those dark rooms? We need a new spell to see inside them. The spell *kirra* lights the room you are in, so that what is in the dark shows.

There are also moving stairs here! They swing into place for a moment, then swing away again.

---
## Safe steps

A stair knows whether it is in place with the attribute `stair.in_place`. This says whether a step onto it right now would land.

If you stand beside a moving stair, you can cast the spell *osto*. It holds the moving stair still for a while, giving you time to cross safely!

---
## Try it

Let us walk up to a stair and check if it is ready for us to step on. We can print what the stair knows!

```python try
wizard.move_up(2)
print(stair.in_place)
```
