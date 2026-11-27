# The broom and its knot

A broom is an object, just like the keys or the doors. When a program keeps it in a variable, for example `my_broom`, it can look at its `my_broom.knotted` attribute. This attribute is `True` while the black thread is tied in it and `False` once it's off.

You can also use its method `my_broom.untie()`, which takes the knot off. It only works when the wizard stands on the broom or, if it hangs on a peg, right under it.

To find the broom, `wizard.find_nearest("broom")` gives you the nearest one, just like it gave us a key in the library.

---
## What you find depends on where you stand

You have used methods that look for things before, like `find_nearest`. But these methods give you a different result depending on where your wizard is on the scene. That means you cannot always find everything. For example, in this shed, if you stand by the wall where the brooms hang, you'll only find the hanging brooms. And if you stand in the straw, you'll find the ones lying on the floor.
