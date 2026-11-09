# Giving things

When you start a new level, you are starting a completely new program. This means that a variable you kept in the last program, like `book`, is gone, even when the thing itself is still in your wizard's hands!

The new program has never seen that variable, so it must find the thing again. It is always a little surprising the first time!

---
## Looking for what you carry

To look for something you are holding, you use `wizard.find_item("book")`. It gives back the thing of that kind your wizard carries, or `None` when you carry none.

It works just as `find_nearest` does, but `find_nearest` looks on the floor, while `find_item` looks in your wizard's hands! We keep it in a variable exactly as before, by writing `book = wizard.find_item("book")`.

---
## Giving a thing

Once a thing is kept in a variable, it can be handed to whoever stands right beside your wizard.

You just use the method `wizard.give(book)`, putting the variable that keeps it inside the brackets to say exactly what to give. If nobody stands beside your wizard, your wizard will say so and keep the thing.

---
## Try it

The book is in your hands, and Eldra waits at the other end of the hall, far from you. Nobody stands beside you yet.

Let us find the book and try to give it right here, just to see what your wizard says! Then, in the level, you will walk to Eldra first.

```python try
book = wizard.find_item("book")
wizard.give(book)
```
