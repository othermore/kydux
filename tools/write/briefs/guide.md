---
outputs:
  - content/guide/text.en.json
  - content/guide/text.es.json
context:
  - docs/dev/story.md
  - content/stories/at-the-gate/text.en.json
  - content/lessons/what-a-program-is/en.md
  - content/levels/the-gate/text.en.json
---
Write the words of the screen's guide. The first time the child plays the
first level (*The gate*), right after its start card, the game dims the
screen but one part at a time, and shows a small card beside that part,
with an arrow pointing to it, and *Next* and *Skip* buttons (the game
writes those). The guide can be shown again from the `?` button. Nuri,
the wizard's friend, says these words, standing in the scene beside the
wizard; Nuri is the wizard's gender (Spanish choices for Nuri's gendered
words, and `{mago|maga}` for the wizard).

Each file is a JSON object with one key, `steps`, an object with exactly
these keys, in this order, each `{"title": ..., "text": ...}`: `title`
two to four words; `text` one or two short sentences.

1. `scene`: the scene, on the left. Your wizard stands here, in front of
   the great gate, and Nuri is beside you. This is where your program
   happens. You can drag the scene to look around, and zoom it with the
   `+` and `−` buttons.
2. `goals`: the goals, in the scene's corner: what the level asks. Each
   one is ticked when it is done.
3. `editor`: the editor, on the right: where the program is written, one
   instruction per line.
4. `run`: the *Run* button (*Ejecutar*): it makes the wizard do what the
   program says. *Restart* puts everything back.
5. `notebook`: the notebook (*cuaderno*), open now beside the scene: what
   your wizard can do, with an example; click an example to put it in the
   editor.
6. `hint`: the *Hint* button (*Pista*), after a run that did not work, for
   a clue; and the `?` button by the level's name, for the level's card
   and this guide again.
7. `method`: no part of the screen: the way to learn here. Try, watch
   what happens, and try again: a run that does not work is how a wizard
   finds out. Then: let us write the first instruction!

Short, warm, for a child of eight. Use the button names as the game
writes them: *Run*, *Restart*, *Hint*, *Notebook* / *Ejecutar*,
*Reiniciar*, *Pista*, *Cuaderno*.
