# If

Knowing the answer to an expression is great, but doing something only when the answer is yes is even better! Programmers call this a condition. We write it with the word `if`.

We write `if`, then our expression, and a colon at the end. Underneath, we move our lines in by leaving four spaces. The computer will only run these spaced lines if the answer is `True`.

---
## Waiting for our moment

Sometimes Dask looks our way, and sometimes he looks away. If he is looking, we have to wait.

The method `wizard.wait()` makes your wizard stand still for a tick, a moment of the game, while everything else moves. And with `wizard.wait(2)`, they wait for two ticks!

---
## Try it

We will write a condition to hide from him. Since levels can be played in several ways, Dask might do different things.

This wait instruction will only run if he is looking to the left!

```python try
if dask.facing == "left":
    wizard.wait()
```
