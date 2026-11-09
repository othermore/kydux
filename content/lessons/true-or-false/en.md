# True or false

Look down the corridor. Dask is staring at the wall. Sometimes, questions only have two answers: yes or no. In a program, this kind of question is called an expression.

The computer answers an expression with `True` or `False`, which mean yes and no.

---
## Comparing things

We can compare two values to see if they are the same using two equal signs `==`. Remember that a single `=` names a value, while `==` asks a question!

For example, `dask.facing == "left"` asks if Dask is looking to the left. His attribute holds a string with the direction he looks: `"up"`, `"down"`, `"left"`, or `"right"`.

---
## Flipping the answer

We can even flip the computer's answer by writing `not` before the expression. If Dask is looking left, `not dask.facing == "left"` will answer `False`.

Let us look at how you would print an answer to see what the computer says. Remember to whisper!

```python
print(dask.facing == "left")
```
