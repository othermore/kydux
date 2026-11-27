# Where I am

We cannot see anything here, but that does not stop us from knowing where we are.

An object has methods, and it also knows things about itself, which programmers call attributes. For example, your wizard knows what it carries. A door knows whether it is locked or not.

---
## Looking at an attribute

To look at an object's attribute, we write a dot after its variable, but no brackets. We leave the brackets out because we are not using a method!

We just write `door.locked` or `wizard.items`.

---
## The position

With the naughty child's map, your wizard always knows which cell they are on. You can see it by opening the map, but if you need to see it inside the program, you can use `wizard.position`. `position` is an attribute of `wizard`, and it holds two numbers together, like `(15, 3)`.

We can also see the position of an object or thing that is on the scene. For example, if we have a key, `my_key`, we can see its position using `my_key.position`.

```python try
print(wizard.position)
```

---
## What cannot be seen

Sometimes we cannot see some things on the map (maybe there is a hiding spell, or maybe they are very small). However, using the `position` attribute, the program sees exactly where things are, even if you do not see them on the map.
