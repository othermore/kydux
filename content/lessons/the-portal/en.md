# The portal that never closes

The hole on the way home is not like the one we crossed before. That one closed every few ticks, and a `while` loop waited for it.

This one is a dark portal that never closes on its own! It stays open, tick after tick, so a `while` loop that waits for it to close would wait for ever. We need another way to cross it safely.

---
## The spell *osto*

The spell *osto* is just what we need. When you cast it with the wand from a cell right beside the hole, using `wizard.cast("osto")`, it holds the floor shut over the hole for a while.

While it is held, a thin crack of light shows around it, and your steps across it land safely on the floor. So your program must cast *osto* from the cell before the hole, and then walk across at once, before the hold ends!
