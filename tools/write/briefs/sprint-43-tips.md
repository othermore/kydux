---
outputs:
  - content/tips/tips.es.json
  - content/tips/tips.en.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - docs/dev/sprint-43.md
  - i18n/es.json
  - i18n/en.json
  - content/levels/the-shed/text.*.json
  - content/levels/the-brooms-on-the-wall/text.*.json
---
Write the tips a child reads while a screen of Kydux loads, in English and in Spanish:
the two files listed, each a JSON object of a tip's key to its text. The plan that asks
for them, sprint 43, is given above in full; its section 2.2 says what a tip is for and
when it shows (D214). Where this brief and the plan differ, this brief wins.

## What a tip is

A child who has begun the game sees a tip under Kydux's mark when a screen takes more
than two seconds to load, and a new one every ten seconds. A tip tells one thing about
the game that helps the child play: where something is and what it does. It is one or
two sentences, read in ten seconds, said to the child as "you". It is true of the page
exactly as it is: a tip that is not exactly true is dropped.

## The owner's four tips

The game's owner wrote four tips in Spanish. They enter as they are; do not write them
again. Write only their English twins, saying the same in natural English, under the
same keys in `tips.en.json`, and copy the Spanish as it is under the same keys in
`tips.es.json`:

- `notebook`: *Abre el cuaderno para ver todas las instrucciones que puedes utilizar en
  tu programa.*
- `spells`: *En el cuaderno, además, puedes ver todos los hechizos y palabras mágicas
  disponibles.*
- `click`: *Si haces clic sobre una instrucción en el cuaderno, se escribe sola en el
  programa.*
- `dot`: *Si pones el nombre de un objeto seguido de un punto, te aparecen todas las
  cosas que tiene ese objeto para que no tengas que escribirlas.*

## Six more, in the same voice

Write six more, one under each key below, in both languages, in the owner's voice:
plain, friendly, one idea each, saying where the thing is and what it does. Each is
true of the page as it is today, as said here; say no more than this:

- `hint`: on a level, under the program, the button *Pista* / *Hint*. It is offered once
  a run has not won. Each press shows one more hint, up to three.
- `keys`: the keys. *Ctrl+Intro* or *Alt+R* runs the program (on a Mac *Cmd+Intro* or
  *Opción+R*); *Alt+N* opens or closes the notebook (on a Mac *Opción+N*). In English:
  *Ctrl+Enter* or *Alt+R*, *Cmd+Enter* or *Option+R*; *Alt+N*, *Option+N*. One tip may
  name only the run's keys, or both.
- `timeline`: the bar under the scene of a level. After a run, dragging it goes back and
  forth over what the program did, moment by moment, to see where something went wrong.
- `zoom`: on a level's scene, the buttons *+* and *−* (or the mouse's wheel) bring the
  scene nearer or farther, and the button *Buscar a mi maga* / *Buscar a mi mago* (in
  English *Find my wizard*) brings the wizard back into view. Write the Spanish button
  as the game writes it, with the choice for the wizard's gender:
  *Buscar a {mi mago|mi maga}*.
- `lesson`: on a lesson's page, the example of code can be changed, and the button
  *Ejecutar* / *Run* under it runs it there, to see what the change does.
- `map`: the button *Mapa* / *Map* opens the map of the chapter; every stop already
  reached can be opened again from it, to play a level once more, and a level won shows
  its stars there.

## Rules

- No tip says *manera* or *way* for the different arrangements a level is played in.
- Nothing the child does not need yet, and no metaphor.
- Spanish from Spain, with the wizard's gender always as a choice in braces, the boy's
  form first, as the rules above say.
- The names of the game's buttons in italics, as the game writes them.
- The JSON objects have exactly the ten keys `notebook`, `spells`, `click`, `dot`,
  `hint`, `keys`, `timeline`, `zoom`, `lesson`, `map`, in that order.
