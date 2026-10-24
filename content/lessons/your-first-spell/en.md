# Your first spell

Spells are cast with a wand, and when they are cast, they do something! A spell is a word of magic, a string, and if you say it without a wand it is only a normal word.

Casting is an action the wand gives your wizard, `wizard.cast("zelim")`. Without the wand, your wizard cannot cast spells!

---
## What a spell does

What a spell does depends on where you are and what you have near you, and it may do nothing at all.

Our first spell is *zelim*. This spell breaks the seal of a door right beside you. You can tell when a door is sealed because it shows a glowing rune.

---
## Try it

Let us cast your very first spell! We will move near a sealed door and cast *zelim* to break its seal.

```python try
wizard.move_right(2)
wizard.cast("zelim")
```
