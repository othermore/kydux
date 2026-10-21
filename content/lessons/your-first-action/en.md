# Objects and actions

In a program, the things it talks about are **objects**.
The wizard is an object.
In the code, its name is `wizard`.

An object can do things.
What it can do are its **actions**.

---

## How to write an action

To make the wizard do an action, write its name, a dot, and the action:

```python
wizard.move_right()
```

The dot says: this action is the wizard's.
The brackets at the end say: do it now.

The wizard has four ways to walk:
`move_right`, `move_left`, `move_up` and `move_down`.

---

## One line, one step

Each line is one instruction.
Each of these actions takes one step.
So more lines make more steps:

```python
wizard.move_right()
wizard.move_down()
```

This program takes one step to the right, then one step down.

---

## Try it

The next corridor turns a corner.
Count the tiles: how many to the right, and how many down?

```python try
wizard.move_right()
wizard.move_down()
```
