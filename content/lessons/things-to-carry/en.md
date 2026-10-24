# Things to carry

Things are objects, just as the characters are, your wizard among them. Each thing has the name the code knows it by, like `key` or `book`.

Your wizard can pick things up! The method `wizard.pick_up()` picks up a thing, but the thing must be on your tile or right beside you.

---
## Which thing to pick up

When there are several things near you, you must tell the computer exactly which one you want. You do this by giving the thing's name as the argument, like `wizard.pick_up(key)`.

I have a spare wand I can lend you, but so that you practise a little, I left it on that stone. It is a flat stone just past the gate, beside the path!

---
## Try it

Let us walk over and pick up the wand. First we move, and then we use the method to pick it up!

```python try
wizard.move_right(3)
wizard.pick_up()
```
