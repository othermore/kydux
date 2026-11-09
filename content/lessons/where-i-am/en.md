# Where I am

We cannot see anything here, but that does not stop us from knowing where we are. With the naughty child's map, your wizard always knows which cell they are on. You can see it by opening the map, but if you need to see it inside the program, you can use `wizard.position`. `position` is an attribute of `wizard`, and it holds two numbers together, like `(15, 3)`.

We can also see the position of an object or thing that is on the scene. For example, if we have a key, `key`, we can see its position using `key.position`.

```python try
print(wizard.position)
```

---
## What cannot be seen

Sometimes we cannot see some things on the map (maybe there is a hiding spell, or maybe they are very small). However, using the `position` attribute, the program sees exactly where things are, even if you do not see them on the map.
