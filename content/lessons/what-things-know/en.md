# What things know

An object does actions, which are its methods. But it also knows things about itself! Programmers call what an object knows its attributes.

A door knows whether it is locked. Your wizard knows where they stand, and what they carry.

---
## Asking for an attribute

Because asking for an attribute does not do an action, we write it with a dot but no brackets. We write `door.locked`, not `door.locked()`.

To see the answer, we use `print`. This is Python's own way to show a value, and it shows the answer right under your code. You can also print `wizard.position` or `wizard.items`.

---
## Try it

Let us ask a door if it is locked. When you run the program, the computer will show you what the door knows.

```python try
print(door.locked)
```
