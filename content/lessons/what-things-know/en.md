# What things know

An object can do things: those are its actions.
An object also knows things about itself.
Where it is.
What it carries.
Whether a door is locked.

What an object knows is an **attribute**.

---

## Asking

An attribute is written like an action, with a dot before its name.
But it has no brackets.
No brackets, because nothing is done: you only ask.

```python
wizard.position
```

To see the answer, give it to `print`, Python's own action for showing a value:

```python
print(wizard.position)
```

What the program prints shows on the card under the editor.

---

## What there is to know

- `wizard.position` is where the wizard stands.
- `wizard.items` is what the wizard carries.
- `door.locked` is `True` while the door needs its key, and `False` when it does not.

`True` and `False` are Python's words for *yes* and *no*.

---

## Try it

The short way out goes through a door.
Ask the door before you walk into it.

```python try
print(door.locked)
```
