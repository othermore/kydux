# True or false

Some questions have only two answers: yes or no. Is the door locked? Is Dask looking this way? In a program, this kind of question is called an expression.

The computer answers an expression with `True` or `False`.

---
## Comparing things

An attribute can be one of these answers, like `door.locked`. We can also compare two values to see if they are the same.

We use two equals signs `==` to ask the question (remember, one `=` names a value!). For example, `dask.facing == "left"` asks if Dask is looking left. We can even flip the answer using `not`.

---
## Asking methods

Some methods answer these questions too. The computer can check `dask.can_see(wizard)` to tell us if Dask can see you.

Let us try printing some answers to see what the computer says. Remember to keep your voice down!

```python try
print(dask.facing)
print(dask.can_see(wizard))
```
