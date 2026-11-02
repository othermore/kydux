# A spell that reaches

A spell can reach across empty space! The spell *fendra*, cast with the wand using `wizard.cast("fendra")`, draws the nearest thing to your wizard's own cell.

It can reach up to three cells away in a straight line, in any of the four ways.

---
## Flying over things

The spell flies over shelves and bookcases, but it cannot pass through walls or closed doors.

If there is nothing near enough to draw, nothing comes, and your wizard will say so.

---
## Try it

A rare book glows on top of a bookcase nearby, but it is out of reach. We will use *fendra* to bring it down!

Remember that a spell moves things, but your hands carry them. You must pick the thing up once it has come to you.

```python try
wizard.move_right(5)
wizard.cast("fendra")
wizard.pick_up()
```
