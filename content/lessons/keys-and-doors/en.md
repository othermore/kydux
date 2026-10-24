# Keys and doors

There are many locked rooms in the library. A door is an object with a method of its own: `door.open()`. You can open a door when you stand right beside it.

But a locked door only opens for a wizard who carries its key!

---
## The order of things

Because the computer reads your program from top to bottom, doing each step in order, you must do things in the right order.

You have to pick up the key first, before you try to open the door. If you ask the door to open before you hold the key, it will stay firmly shut.

---
## Try it

Let us walk up to a key and pick it up. Once you have it, you will be ready to open the door!

```python try
wizard.move_up(2)
wizard.pick_up()
```
