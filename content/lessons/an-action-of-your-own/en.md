# An action of your own

What if we want to do a special manoeuvre over and over? If we write `def quick_fly():` and, moved in under it, a few lines of code, we give those lines a name! Programmers call it a function.

```python
def quick_fly():
    wizard.cast("drevo")
    wizard.move_right(2)
    wizard.move_up(2)
    wizard.move_left(2)
    wizard.move_down(2)
    wizard.cast("drevo")

quick_fly()
```

Writing the name with brackets, like `quick_fly()`, runs those lines wherever it is written and as many times as you like. The lines inside the `def` do not run until someone calls the function.

---
## Better than a loop

A loop repeats the same lines one after another. A function is used wherever it is needed, even with other lines in between!

Your program also reads much better. Instead of writing six lines, one line simply says *quick flight*, so anyone reading your code knows exactly what you are doing.

```python try
def greet():
    print("Hello!")
    print("Welcome to Arvelia.")

greet()
print("And now...")
greet()
```
