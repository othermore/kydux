# Keys and doors

A door is an object, and it has a method of its own: `door.open()`.

But a door only opens for a wizard standing right beside it. And if the door is locked, it will only open when its key is carried!

---
## Hidden things

Sometimes you cannot see a thing on the floor, but it is there all the same for the program.

Your method `find_nearest` will find it wherever it lies. Then, the method `key.reveal()` shows its outline through whatever hides it, so that you know where to go.

---
## Try it

The key of the door ahead fell long ago behind something, and no one has seen it since.

Let us find it and reveal it!

```python try
key = wizard.find_nearest("key")
key.reveal()
```
