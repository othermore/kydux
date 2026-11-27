# A spell that reaches

A spell can reach across empty space! The spell *fendra*, cast with the wand, draws a thing to your wizard's own cell.

Because the library's high shelves are full of books, the spell needs to know exactly which one you want. You must give it the variable your program keeps the thing in, as its second argument: `wizard.cast("fendra", other_book)`.

---
## Flying over things

The spell reaches up to three cells away in a straight line, in any of the four ways. It flies over shelves and bookcases, but it cannot pass through walls or closed doors.

It cannot reach past a doorway, either: a thing inside a room is reached from the room's doorway, or from inside it, but never from in front of the room through its door, even an open one.

If the thing you name is out of its reach, nothing comes, and your wizard will say so.

Remember that a spell moves things, but your hands carry them. You must pick the thing up once it has come down to you.
