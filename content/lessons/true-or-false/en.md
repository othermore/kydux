# True or false

## Other attributes

An attribute may hold something other than two numbers. For example, `dask.facing` holds a word, a string, that says which way Dask looks: `"up"`, `"down"`, `"left"`, or `"right"`. The attribute `wizard.facing` says the same for your wizard.

```python try
print(dask.facing)
```

---
## Comparing

We can compare two things to see whether they are the same with two equals signs `==`. The answer can only be yes or no, which in programming are called `True` and `False`. This is what we call an expression. Remember that a single `=` keeps a value in a variable, and `==` compares!

For example, let us see what happens if we compare numbers.

```python try
print(3 == 3)
print(3 == 4)
```

---
## Comparing attributes

We can compare two attributes to see if Dask and your wizard look the same way by writing `dask.facing == wizard.facing`. We can also compare an attribute and a literal, a value written just as it is: to check whether Dask looks up we use `dask.facing == "up"`.

Let us look at the answers to those two expressions.

```python try
print(dask.facing == wizard.facing)
print(dask.facing == "up")
```

---
## Saying the opposite

If we put the word `not` before an expression, it says the opposite. For example, if Dask looks up, `not dask.facing == "up"` will be `False`.

Let us check this by printing the opposite of Dask looking up.

```python try
print(not dask.facing == "up")
```

---
## Try it

Now you can change this small program. Print whether Dask looks down, then whether he does not.

```python try change
print(dask.facing == "down")
print(not dask.facing == "down")
```
