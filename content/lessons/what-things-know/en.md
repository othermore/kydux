# What things know

Every object in the castle has secrets. An object can do actions. But it also knows things about itself. A door knows if it is locked. Your wizard knows where they stand. What a thing knows is what programmers call an attribute.

---

You ask for an attribute with a dot. You do not use brackets. No brackets means nothing is done. You only ask a question.

```python
door.locked
```

To see the answer, you use `print`, Python's own action for showing a value. It shows the answer on the card under the editor.

```python
print(door.locked)
```

---

You can ask about many things. `wizard.position` tells you where you are. `wizard.items` lists what you carry. Let us test this carefully.

---

## Try it

Ask the door a question. See if it is locked.

```python try
print(door.locked)
```
