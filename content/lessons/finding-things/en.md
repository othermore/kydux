# Finding things

Some methods do something in the world, like moving or picking things up. Others give something back to you, like an answer!

The method `wizard.find_nearest("book")` gives you the nearest book. It gives you the thing itself, even if it is very far away.

---
## Keeping the answer

To keep an answer, we give it a name, which programmers call a variable.

We write it like this: `book = wizard.find_nearest("book")`. The `=` sign simply puts the value under the name so we can use it. It does not ask whether they are equal!

If there is no book at all, the answer is `None`, which is Python's word for nothing.

---
## Making it glow

To see which thing the name holds and where it is, `book.reveal()` makes it glow where it lies. It glows even through whatever hides it, and from then on you know where to walk.

---
## Try it

Eldra, our ghost, lost one of her books long ago. It lies in a corner of the library, by the pile of old books, half hidden behind it. A program finds it wherever it lies, so let us find it and make it glow!

```python try
book = wizard.find_nearest("book")
book.reveal()
```
