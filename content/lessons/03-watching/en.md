# Watching and waiting

An object also knows things about itself.
These things are its **attributes**.

An attribute has no brackets, because it is not an action.
It is something you can ask about:

```python
print(teacher.facing)
```

This line writes which way the teacher looks: `"left"` or `"right"`.

---

## Waiting for the right moment

The wizard can stand still while the world goes on:

```python
wizard.wait()
```

A `while` loop does something again and again, as long as something is true.
So the wizard can wait for as long as the teacher looks this way.

---

## Try it

First, see which way the teacher looks.
Then wait one tick, and look again.

```python try
print(teacher.facing)
wizard.wait()
print(teacher.facing)
```
