# What things know

An object has methods. But an object also knows things about itself, which programmers call attributes.

For example, your wizard knows what it carries. A door knows whether it is locked or not.

---
## Looking at an attribute

To look at an object's attribute, we write a dot after its name, but no brackets. We leave the brackets out because we are not using a method!

We just write `door.locked` or `wizard.items`.

---
## Showing the value

To see it, we use `print`. It is Python's own way to show a value, right under the editor where you write your code.

`print` shows any value, not only an attribute. It shows a number, like 7. It shows a sum: Python works it out first and writes the result. And it shows a string, the words in quotes, which appears without the quotes. Each `print` writes its own line. Try changing the numbers or the word, and run it again!

```python try
print(7)
print(2 + 3)
print("Hello")
```

---
## Try it

The door I just opened for you is a perfect one to check. Let us look at its attribute!

```python try
print(door.locked)
```
