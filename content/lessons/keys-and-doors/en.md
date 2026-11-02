# Keys and doors

A door is an object, and it has a method of its own: `door.open()`.

But a door only opens for a wizard standing right beside it. And if the door is locked, it will only open when its key is carried!

---
## Hidden things

Sometimes you cannot see a thing on the floor, but it is there all the same for the program.

Your method `find_nearest` finds it wherever it lies, and `reveal` shows it through whatever hides it, as you learned.

---
## Try it

The key of the door ahead fell under the big bookcase long ago, and no one has seen it since.

Let us find it and make it glow!

```python try
key = wizard.find_nearest("key")
key.reveal()
```
