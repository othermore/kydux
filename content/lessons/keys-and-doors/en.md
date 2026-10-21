# Keys and doors

Most doors open by hand.
Some are locked, and open only with their key.

So the wizard needs the key first, carried.
Then the wizard stands beside the door, and opens it.

---

## Opening a door

A door is an object too, with an action of its own:

```python
door.open()
```

The wizard must stand right beside the door.
If the door is locked, the wizard must carry its key.
A door that is not locked opens the same way, with no key.

---

## Try it

In the next room, the key lies on the floor, and the door is locked.
Pick up the key first.

```python try
wizard.move_right(4)
wizard.pick_up()
```
