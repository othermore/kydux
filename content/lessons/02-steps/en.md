# Steps, keys and doors

Writing the same line many times is slow.
An action can take a number between its brackets.

```python
wizard.move_right(4)
```

This line makes the wizard take four steps.
The number is called an **argument**: it tells the action how much to do.

---

## Things in the world

Some levels have **things** in them, like a key or a door.
Each thing is an object too, with its own name and its own actions.

The wizard can pick up the thing on {his|her} tile:

```python
wizard.pick_up()
```

A door has an action of its own.
The wizard must stand next to it, and carry the key if it is locked:

```python
door.open()
```

---

## Try it

Walk to the key and pick it up.
Then find the way to the door.

```python try
wizard.move_right(4)
wizard.pick_up()
```
