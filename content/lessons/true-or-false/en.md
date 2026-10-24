# True or false

Some questions have only two answers: yes, or no.
Is the door locked?
Is the wizard carrying the key?
Can the teacher see the wizard?

A program asks questions like these all the time.
It asks them so that it can choose what to do.

---

## Questions in Python

In Python, a question is an **expression**, and its answer is `True` or `False`.

```python
print(3 > 2)
print(door.locked)
```

The first line prints `True`: three is more than two.
The second prints `True` or `False`, as the door is.

---

## Is it the same?

`==` asks whether two values are the same:

```python
print(dask.facing == "left")
```

It is not `=`.
One `=` gives a value a name.
Two, `==`, ask a question.

`not` turns the answer round: `not door.locked` is `True` when the door is not locked.

An action can answer too:

```python
print(dask.can_see(wizard))
```

---

## Try it

Dask, the teacher of the passages, stands in the watchtower.
Ask which way he looks, and whether he can see the wizard.

```python try
print(dask.facing)
print(dask.can_see(wizard))
```
