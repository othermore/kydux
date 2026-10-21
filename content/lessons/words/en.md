# Words

So far, the program has told the wizard where to go.
It can also tell the wizard what to **say**.

Words in a program go between quotes: `"Hello!"`.
Words in quotes are called a **string**: a string of letters, one after another.

---

## Why the quotes

Without quotes, the computer reads a word as an instruction, or as the name of something.
With quotes, it keeps the word just as it is.
It does not try to understand it.

That is why capitals matter.
To the computer, `"Hello"` and `"hello"` are not the same string.

---

## Saying something

```python
wizard.say("Hello!")
```

The wizard says the words in a bubble.
The string goes in the brackets, as a number does: it is the action's argument.

---

## Try it

Some doors in Arvelia listen.
Say the right word beside them, and they open.

```python try
wizard.say("Hello!")
```
