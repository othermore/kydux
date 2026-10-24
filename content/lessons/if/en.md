# If

Knowing the answer to an expression is good, but doing something only when the answer is yes is even better! Programmers call this a condition. We write it with `if`.

In this game, a level can be played in more than one way, and the same program must win them all! Sometimes Dask is looking, and sometimes he is not.

---
## Writing a condition

We write `if`, then our expression, and finally a colon. Underneath, we move our lines in by four spaces. The computer will only run these moved-in lines when the answer is `True`.

If Dask is looking, we need to wait. The method `wizard.wait()` makes your wizard stand still for a moment while everything else moves on.

---
## Try it

Let us write a condition to hide from him. The wait instruction will only run if Dask is looking left!

```python try
if dask.facing == "left":
    wizard.wait()
```
