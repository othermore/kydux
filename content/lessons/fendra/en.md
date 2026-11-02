# A spell that reaches

A spell can reach across empty space! The spell *fendra*, cast with the wand, draws a thing to your wizard's own cell.

Because the library's high shelves are full of books, the spell needs to know exactly which one you want. You must give it the name your program keeps the thing under, as its second argument: `wizard.cast("fendra", book)`.

---
## Flying over things

The spell reaches up to three cells away in a straight line, in any of the four ways. It flies over shelves and bookcases, but it cannot pass through walls or closed doors.

If the thing you ask for is out of its reach, nothing comes, and your wizard will say so.

---
## Try it

A rare book lies among many others on a high bookcase, out of reach. First, we will find it and keep it under a name. Then we will walk under it and cast *fendra* at it!

Remember that a spell moves things, but your hands carry them. You must pick the thing up once it has come down to you.

```python try
book = wizard.find_nearest("book")
wizard.move_right(5)
wizard.cast("fendra", book)
wizard.pick_up()
```
