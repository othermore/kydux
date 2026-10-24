---
outputs:
  - content/guide/text.en.json
  - content/guide/text.es.json
context:
  - docs/dev/story.md
  - content/stories/the-letter/text.en.json
  - content/stories/at-the-gate/text.en.json
  - content/lessons/what-a-program-is/en.md
  - content/levels/the-gate/text.en.json
---
## What the child already knows

The child has read the letter of admission, made their wizard, and met
the friend at the castle's gate (*At the gate*). They have read the first
lesson, *What a program is*: a program is a list of instructions the
computer follows one after another, and `wizard.move_right()` makes the
wizard take one step right. They have seen the start card of the first
level, *The gate*, and are about to write their first program. They have
not yet pressed any button of the level's screen.

## What to write

The words of the screen's guide. The first time the child plays *The
gate*, right after its start card, the game dims the screen but one part
at a time, and shows a small card beside that part with an arrow pointing
to it, and *Next* and *Skip* buttons (the game writes those). The guide
can be shown again from the `?` button. The friend says these words,
standing in the scene beside the wizard: `{friend}` for the friend's name,
the friend's own gendered words in double braces, and the wizard's in
single braces, as the rules say.

Each file is a JSON object with one key, `steps`, an object with exactly
these eight keys, in this order, each `{"title": ..., "text": ...}`:
`title` two to four words; `text` one to three sentences.

The project's owner wrote some of these words. Where a step gives
a sentence in quotation marks, write that sentence exactly as given, in
its language, and add to it only what the step asks for. Everything else
a step says is the facts to tell, not the words to use: the friend tells
them to the child, speaking to them as *you*, in the warm, plain way of
the friend's lines in *At the gate*, so that each card reads as one thing
said aloud and leads into the next. A title names the part of the
screen, the way a child would call it.

1. `scene`: the scene, on the left. Its text opens with the owner's
   sentence, in English "Here you see the game and the characters of the
   game." and in Spanish "Aquí ves el juego y los personajes del juego."
   Then: the scene can be dragged to look around, and zoomed with the `+`
   and `−` buttons.
2. `goals`: the goals, in the scene's corner. Its text opens with "These
   are the tasks you must finish to complete the level." / "Estas son las
   tareas que debes terminar para completar el nivel." Then: the round
   mark that beats on the ground is the place the wizard must get to, and
   a goal is ticked when it is done.
3. `editor`: the editor, on the right. Its text is the owner's two
   sentences and nothing more: "This is where you write your program to
   control your wizard in the game. You write one instruction on each
   line, and with them you tell your wizard what to do." / "Aquí es donde
   escribes tu programa para controlar a tu personaje en el juego.
   Escribes una instrucción en cada línea y con ellas le dices al
   personaje lo que debe hacer."
4. `run`: the *Run* button (*Ejecutar*): it makes the wizard do what the
   program says. *Restart* (*Reiniciar*) puts everything back where it
   started.
5. `notebook`: the notebook (*Cuaderno*). The guide points at its button
   and at its panel at once, with two arrows, and opens the panel for
   this step. Say that the button opens the notebook, and that the
   notebook lists what your wizard can do, each with an example; clicking
   an example puts it in the editor.
6. `hint`: the *Hint* button (*Pista*) only: after a run that did not
   work, it gives a clue. A clue costs a star of the level.
7. `about`: the `?` button by the level's name only: it shows the level's
   card again, with what the level asks, and this guide.
8. `method`: no part of the screen: the way to learn here. Try, watch
   what happens, and try again: a run that does not work is how a wizard
   finds out what to change. It ends by saying that now we are going to
   write the first instruction.

Use the button names as the game writes them: *Run*, *Restart*, *Hint*,
*Notebook* / *Ejecutar*, *Reiniciar*, *Pista*, *Cuaderno*.
