# What things know

An object does actions, which you know are its methods. But an object also knows things about itself, which programmers call attributes.

For example, your wizard knows where it stands and what it carries. A door knows whether it is locked or not.

---
## Asking what an object knows

To ask an object for its attribute, we write a dot after its name, but no brackets. We leave the brackets out because nothing is being done!

We just write `door.locked`, `wizard.position`, or `wizard.items`.

---
## Showing the answer

To see the answer, we use `print`. It is Python's own way to show a value, and it shows the answer right under the editor where you write your code.

The door I just opened for you is a perfect one to ask. Let us see what it knows!

```python try
print(door.locked)
```
