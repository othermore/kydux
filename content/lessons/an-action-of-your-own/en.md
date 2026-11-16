# An action of your own

What if we want to do a special manoeuvre over and over? If we write `def two_rings():` and, moved in under it, a few lines of code, we give those lines a name! Programmers call it a function.

Writing the name with brackets, like `two_rings()`, runs those lines wherever it is written and as many times as you like. The lines inside the `def` do not run until someone calls the function.

---
## Better than a loop

A loop repeats the same lines one after another. A function is used wherever it is needed, even with other lines in between!

Your program also reads much better. Instead of writing four moves, one line simply says *two rings*, so anyone reading your code knows exactly what you are doing.

```python try
def greet():
    print("Hello!")
    print("Welcome to Arvelia.")

greet()
print("And now...")
greet()
```
