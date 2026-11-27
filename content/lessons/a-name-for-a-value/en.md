# A name for a value

A program can keep a value and give it a name. But first let us see how a value is shown! To see it, we use `print`. It is Python's own way to show a value, right under the editor where you write your code.

`print` shows any value. It shows a number, like 7. It shows a sum: Python works it out first and writes the result. And it shows a string, the words in quotes, which appears without the quotes. Each `print` writes its own line. Try changing the numbers or the word, and run it again!

```python try
print(7)
print(2 + 3)
print("Hello")
```

---
## A variable

To keep a value, we give it a name, which programmers call a variable. A variable can hold anything. For example, a number or a string.

To create a variable, we define it. We do that with `=`: the variable's name on the left and the value on the right, as in `age = 9` and `name = "Marta"`.

When we use `print` with a variable, it shows what the variable holds: the 9 or Marta, not the word `age` or `name`. Try changing the number and the word!

```python try change
age = 9
name = "Marta"
print(age)
print(name)
```

---
## It can change

Why is it called a variable? Because what it holds can vary, that is, change. If the program defines the same variable again with another value, the variable keeps the new one and forgets the one before.

```python try
age = 9
print(age)
age = 10
print(age)
```

The program prints 9 first and then 10. It is the same variable, but its value has changed. Try putting another number in the third line!

---
## The name is yours to choose

The name of a variable is chosen by whoever writes the program; Python does not care which, only that the same name is written each time. A name uses letters, digits and the low line `_`, no spaces, and it never starts with a digit. A good name says what the value is!

Run this code. Then change the name, in **both** lines, to one of your own, and run it again: it prints the same. Then change it in one line only and see what the game answers. The program knows a value only by the name of the variable it was kept in.

```python try rename error
sweets = 12
print(sweets)
```

---
## A variable between the brackets

A variable that holds a number can go wherever a number would go, also as the argument of a move!

```python
steps = 2
wizard.move_left(steps)
```

With these two lines, your wizard walks two steps to the left. Why bother? When several moves need the same number, the program says the number once. And if the number must change one day, it is changed in one place! The reading room before us is the perfect place to try it.
