---
outputs:
  - content/stories/the-tower/text.en.json
  - content/stories/the-tower/text.es.json
  - content/stories/the-trail/text.en.json
  - content/stories/the-trail/text.es.json
  - content/stories/the-voice-in-the-tunnel/text.en.json
  - content/stories/the-voice-in-the-tunnel/text.es.json
  - content/stories/what-the-familiar-brought/text.en.json
  - content/stories/what-the-familiar-brought/text.es.json
  - content/stories/the-end-of-the-year/text.en.json
  - content/stories/the-end-of-the-year/text.es.json
context:
  - docs/dev/story.md
  - docs/dev/course.md
  - content/stories/the-morning-after/text.es.json
  - content/stories/the-finish/text.en.json
  - content/stories/the-finish/text.es.json
---
Write the five stories of chapter 5 of Kydux, *The familiar*, in English and Spanish: the
files listed. It is the last chapter of the first year. The owner wrote each story step by
step, in Spanish; their steps are given below, and you write each step's text from them.
Keep the owner's words wherever they are given between « », exactly as they are, and
write English that says the same; the rest you write in your own natural prose, with
the facts of each step and nothing more. Where this brief says a step is said by someone,
it is said by them.

## How a story is told in the game

A story is played on the game's scene, like a short play, one step at a time. Each step
is said by one speaker: **the voice**, the narrator, in a band under the scene, speaking to
the child as "you", the child being the wizard, two to four sentences; or **a
character**, in a speech bubble, one to three sentences, with no quotation marks and no
"she says". Before a step's words something may happen on the scene; the words go with
it and never contradict it. Each file is a JSON object, `{"title": "...", "steps": ["...",
...]}`, with exactly as many steps as the list below, in that order.

## The chapter in a page

The last day of the first year. Months have passed; the wizard flies with Arvelia's
broom racing team. The three have kept their secret all year: `{friend}` keeps the black
threads untied in the shed in a tin box, the cold voice has not been heard again, and the
older pupil who muttered at the edge of the field turns down another corridor whenever he
sees them. They do not know his name until Zarek, who never misses a chance to talk, lets
it out: Rinlo, from his year.

The first year ends at the top of Orla's tower. There each pupil is given a familiar, a
small creature that will go with them all their years at Arvelia. But no creature waits in
the hall: there is a circle of runes in the floor, a great book open on a lectern, and
Bimo, Orla's grey cat, asleep beside the book. A familiar is not chosen, Orla says: it is
described. What is described, the word *minka* calls into the circle; in there it is only
a trial, a figure of light that is not alive and comes undone by itself. A first-year may
describe six kinds of creature, in their natural colours, with a name, and nothing more.
But the one that leaves the circle takes on a soul and lives, and that cannot be undone.

Over the levels between the stories the wizard describes their familiar step by step,
`{friend}` makes theirs alone and is the first to take it out of the circle (Tolu, a grey
hare, a colour no first-year is given), `{mate}` fails again and again and in the end
copies the wizard's description, and the wizard's familiar, `{familiar}`, leaves the
circle and lives, learns to go where it is told, and goes to Orla's plates. Then:

- **The trail.** As soon as the trial is over, `{familiar}` sniffs at `{friend}`'s pocket,
  where the tin box is, darts into a tiny arch at the foot of the wall and comes back with
  another black thread, the same knot. The castle is full of small passages made for
  familiars to carry messages; no person fits in them, not even a child. Whoever knotted
  the brooms keeps thread in there.
- **Rinlo.** The three go down to the corridor below, where the passage has another
  mouth, and the wizard sends the familiar inside, corner after corner, up to a forgotten
  room, where Rinlo is hiding. Through the passage, which carries sounds like a pipe, they
  hear the cold voice: it knows who undid the knots and the wizard's name, and asks Rinlo
  to tie the last thread to the wizard's wand. Rinlo says no, breaks the thread into
  pieces and shouts at the voice to go; the familiar, born that very day, runs back to its
  wizard at the voice. Rinlo dares not come out, and wants the pieces taken away.
- **The proof.** The familiar gathers every piece and brings them back. A bolt is heard
  above; Rinlo comes down by the back stair and tells everything in a rush: flying
  terrifies him, the voice promised him the flying lessons would end and nobody would be
  hurt, and he never knew what it really wanted, until today.
- **Orla.** The four go up to the tower with the threads. Orla tells them what they are:
  far more than threads to tamper with brooms; the leavings of the soul of a wizard killed
  by a dark spell, evil itself made a thing by that death; they bring death and pain and
  destroy friendship and the soul. She locks them away, and believes them.
- **Korvel.** Then she tells the rest. The voice is Korvel's. Long ago he wrote
  enchantments on the castle itself, at first to make it better, safer, more comfortable,
  more magical, and then, change by change, so that it would obey him alone; Orla and
  other wizards saw it and drove him out. The wizard's parents, wizards and among the best,
  set about rewriting the castle's spells, keeping the good and taking out what gave him
  control. Korvel came back to kill them; but the wizard's mother was already expecting the
  wizard, and the child not yet born protected them both, so that Korvel could kill only the
  magic in them: that is why they are not wizards now, and remember nothing. Their spells,
  not yet finished nor tied off, came undone with their magic, the castle's magic fell,
  and Korvel died with it, since, greedy for power and seeking to live for ever, he had put
  all his magic, his own soul, into the castle's spells. Orla always believed him dead;
  today she is not sure, and says so as a doubt, a possibility, never as something she
  knows: perhaps his soul is held in the walls, in remnants of old spells, waiting to take
  revenge and the castle back. Whose soul the threads are is never said.
- **The end.** Arvelia knows now: the school is on guard, but together. Rinlo is not
  alone, Zarek turns out not so fierce, and the wizard ends the year a pupil of Arvelia in
  their own right, with their broom, their two friends and their familiar asleep in their
  hood. Summer waits, and whatever comes after it.

**The tone.** The end of a year: sun in the tower's windows, exam nerves, small creatures
that do as they please. Laughs come from `{mate}`'s trials, from Bimo, who disapproves of
every newcomer from the lectern, and from Zarek. Rinlo is no villain: a frightened boy who
was deceived, told with warmth. The voice is heard once, from far off, and loses. What Orla
tells of the threads and of Korvel is darker than anything before in the game, and she
tells it herself, slowly, in a hall full of sun, with the four together; it may frighten a
little, and that is right. What she tells of the parents is a truth that gives strength:
the wizard protected someone before being born.

## Words the owner has ruled on

- `{wizard}` is the wizard; `{friend}` is the friend met at the gate (the wizard's other
  gender, the friend's own gendered words in double braces in Spanish, `{{alumno|alumna}}`);
  `{mate}` is the dormitory mate (the wizard's own gender, single braces, `{tu
  compañero|tu compañera}`). Nuri and Teku are never named in a text. Orla, Bimo, Zarek,
  Rinlo and Korvel are named; Korvel only where Orla names him, in the last story.
- The wizard's familiar is `{familiar}`, its name, which the game puts in: never its kind,
  never "fox", never *zorro*, since the child chooses the kind; *tu familiar* /
  *your familiar* is fine. A Spanish word that would follow the familiar's gender is avoided
  or written as `{familiar:el|la}`.
- The cold voice is never named, never described beyond its coldness, never explained.
- A program **looks at** an attribute and **uses** a method; never *preguntar* / *ask*.
- Spanish from Spain, natural, for a child of eight to twelve; English that says the same.

## The stories

1. `the-tower`, *The tower* / *La torre*, nine steps.
   1. voice (the dormitory by morning, the trunks half packed): months have passed and it
      is the last day of the year. `{wizard}` flies with Arvelia's broom racing team now.
   2. voice: the secret is still kept. The black threads sleep in a tin box of `{friend}`'s,
      the cold voice has not been heard again, and the older pupil from the edge of the field
      turns down another corridor whenever he sees them.
   3. Zarek (in the castle's entrance hall, on the way to the tower; he boasts of the race he
      nearly won; they ask him about the boy who never flies): «¿Ese? Rinlo, de mi curso. No
      se sube a una escoba ni atado.» Zarek's whole bubble may begin with a short boast.
   4. `{mate}`: «¿Se lo decimos hoy a Orla?» and `{friend}`: «¿Con qué? Tres hilos en una caja
      no prueban nada.» Both lines are said in this one step, by `{mate}`: write it as
      `{mate}`'s question and `{friend}`'s answer quoted inside it, or give `{mate}` the
      question alone and fold `{friend}`'s answer into the next step's voice; keep both lines.
   5. voice: the long winding stair, and at the top the highest hall of the castle: a circle
      in the floor, an enormous book on a lectern, and Bimo asleep beside the book.
   6. Orla: «Hoy cada uno de vosotros recibe su familiar.» The pupils look round: there is no
      creature. Orla: «Aquí no hay ninguno, no. Un familiar no se elige. Se describe.»
   7. Orla: «Lo que describáis, el hechizo *minka* lo llamará al círculo. Ahí dentro es solo
      una prueba: no vive, y se deshace sola. Probad cuanto queráis.» And the limit: «Sois de
      primero. El libro os admite seis tipos de criatura, con sus colores naturales, un
      nombre y nada más. Lo demás llegará en otros cursos.»
   8. Orla: «Pero el que salga del círculo tendrá alma, y vivirá. Eso ya no se deshace. Que
      nadie saque del círculo una criatura que no haya pensado bien.»
   9. Bimo, from where he sleeps on the lectern, has the last word. (On the scene `{friend}`
      has stepped into the circle and back, the chalk already in hand.) Bimo's step holds,
      first, `{mate}`'s whisper, quoted: «¿Y si no me gusta ninguno?», and then Bimo's own
      «Miau.», as in the steps above that hold two lines: for instance «¿Y si no me gusta
      ninguno?», susurra {mate}. Y Bimo, sin abrir los ojos: «Miau.»
2. `the-trail`, *The trail* / *El rastro*, seven steps, in the hall and then in the corridor
   a floor below.
   1. voice: the trial is over, and there are three creatures in the hall that did not exist
      this morning. Orla closes the book: «Cuidadlos. Lo que ve vuestro familiar, lo veis
      vosotros. Y su nombre, solo a quien queráis de verdad.» She goes down to fetch the next
      class. (On the scene Orla walks down and out by the stair.)
   2. voice: `{familiar}` sniffs at `{friend}`'s pocket, and `{friend}` cries out that the box
      of threads is in there: «¡Eh! Ahí llevo la caja de los hilos.» (Said in this step, by
      the voice telling it, `{friend}`'s words quoted.)
   3. voice: the creature crosses the hall like an arrow and slips into a tiny arch at the
      foot of the wall. It is heard running inside the wall. It comes back with something in
      its mouth: a black thread, with the same knot.
   4. `{friend}`: «Lo he leído. El castillo está lleno de pasadizos pequeños: los hicieron para
      que los familiares llevaran recados de una sala a otra. Una persona no cabe. Ni nosotros.»
   5. `{mate}`: «Quien anudó las escobas guarda hilo ahí dentro.» And `{friend}`'s answer:
      «Y si sabemos dónde, ya no son tres hilos en una caja.» (Both in `{mate}`'s step, as in
      the first story's fourth step.)
   6. voice: they go down a floor. In the corridor below the hall, at the foot of the wall,
      the passage has another mouth, small as a cat flap. Inside, by the light of the wand,
      another thread.
   7. `{mate}` crouches and not even their head fits. Looking at the creature: «`{familiar}`
      sí.» Write it as `{mate}`'s bubble.
3. `the-voice-in-the-tunnel`, *The voice in the tunnel* / *La voz en el túnel*, eight steps,
   in the corridor, the familiar inside the forgotten room.
   1. voice: `{familiar}` is inside the room. The passage carries sounds like a pipe, and the
      three crouch by the mouth.
   2. the cold voice, unhurried: «Alguien deshizo tus nudos, Rinlo. Yo sé quién fue. Se llama
      {wizard}.»
   3. voice: `{familiar}`, born today, flattens its ears and runs back through the passage
      to `{wizard}`'s feet.
   4. the cold voice: «Te queda un hilo. Átalo a su varita. Su próximo hechizo le estallará en
      las manos.»
   5. Rinlo: «No. Dijiste que nadie se haría daño, ¡y casi se caen todos! No. Vete.» Then
      something is heard breaking, once and again, and silence; the voice does not answer.
      Rinlo's words in his bubble; what is heard may close the bubble in italics.
   6. `{friend}`, towards the mouth, softly: «¿Rinlo? Te hemos oído. Le has dicho que no.» And
      Rinlo, after a while: «Lo he roto. Lo he hecho trozos.» (Both in `{friend}`'s step.)
   7. Rinlo: answering `{friend}`'s «Baja. Se lo contamos a Orla contigo.»: «No puedo salir ahí
      fuera. Llevaos los trozos. No quiero ni tocarlos.» (`{friend}`'s line may open
      Rinlo's step, quoted.)
   8. `{mate}`, looking at the creature: «Pues que los traiga `{familiar}`. Todos.»
4. `what-the-familiar-brought`, *What the familiar brought* / *Lo que trajo el familiar*,
   eight steps, in the corridor and then in the hall.
   1. voice: `{wizard}` has a handful of pieces of black thread. Above, a bolt is heard, and
      steps on the back stair. Rinlo comes out of the arch at the end of the corridor, very
      pale.
   2. Rinlo, in a rush: flying terrifies him; before every lesson he spends days without
      sleeping. The voice knew it. It spoke to him from a wall, promised him the lessons would
      stop and that nobody would be hurt, and showed him the knot.
   3. Rinlo: «¡Yo no sabía lo que hacía el nudo! Y hoy quería que te lo atara a ti.» And
      `{mate}`: «A mí tampoco me gustan las escobas.» Rinlo nearly laughs. (All in Rinlo's
      step.)
   4. voice: the four go up the tower. Orla is alone with the book. `{wizard}` lays the threads
      on the lectern. `{friend}`: «Son hilos para trucar escobas.» They tell everything, that
      they were out of bed that night too.
   5. Orla, who does not touch them: «Son mucho más que eso. Son los desechos del alma de un
      mago al que mataron con un hechizo oscuro. Son la esencia del mal, hecha cosa por esa
      muerte.»
   6. Orla: «Causan males que no se pueden contar. Atraen la muerte y el dolor. Destruyen la
      amistad, y el alma.» `{friend}`, voiceless: «Los he tenido meses en una caja.» Orla:
      «Sueltos, duermen. Es el nudo lo que los despierta. Habéis hecho bien en desatarlos, y
      mejor en traérmelos.» (All in Orla's step.)
   7. voice: Orla covers them with a cloth and locks them away. Orla: «Ese nudo no se enseña en
      Arvelia desde hace muchos años. Os creo.» To Rinlo: «Le has dicho que no. Eso era lo más
      difícil, y lo has hecho tú solo.»
   8. Orla: «Sentaos. Hay algo que debéis saber, y tú más que nadie, {wizard}.»
5. `the-end-of-the-year`, *The end of the year* / *El fin de curso*, nine steps, in the
   hall at sunset, the last two over a painting of the castle.
   1. Orla: the voice has a name: Korvel. Long ago he wrote enchantments on the castle
      itself. At first to make it better: safer, more comfortable, more magical. But little by
      little he put in changes so that the castle would obey him alone. Other wizards and she
      saw what he was doing, and drove him out.
   2. Orla, to `{wizard}`: «Tus padres estudiaron aquí. Eran magos, y de los mejores.» They set
      about rewriting the castle's spells: keeping the good, so that it would go on teaching
      the new pupils every year and protecting wizards, and taking out what Korvel had put in
      to control it.
   3. Orla: Korvel came back to kill them. But your mother was already expecting you, and you,
      not yet born, protected them both. Korvel could kill only the magic in them. That is why
      they are not wizards now, and why they remember nothing.
   4. Orla: the spells they had written were not yet finished nor tied off. When your parents'
      magic died they came undone, and the castle's magic fell with them. And Korvel died with
      it: greedy for power, and seeking to live for ever, he had put all his magic, his own
      soul, into those spells. «Tardamos años enteros en recomponer la magia de Arvelia. Y
      siempre creímos que Korvel había muerto.»
   5. Orla: «Hoy ya no estoy segura.» She says it as a doubt, a possibility, never as
      something she knows: perhaps his soul was left held in the walls, in remnants of old
      spells that never quite vanished, waiting to take revenge and to rule the castle again.
   6. voice: nobody says anything. `{mate}`, at last: «Entonces tú ya le ganaste una vez.»
      Orla: «Y sin saber todavía una sola palabra.» (Told by the voice, both lines quoted.)
   7. Orla: now the school knows, and nobody will listen to that voice alone again. Rinlo will
      help the teachers: he knows where it speaks.
   8. voice (over the painting of the castle): the end-of-year dinner. Zarek sits beside
      Rinlo, grumbling: «Si te da miedo, te enseño yo. Despacio.» Orla names `{wizard}` {un
      alumno|una alumna} of Arvelia in {his|her} own right. The second year waits.
   9. voice (over the painting of the castle): what the year taught, a sentence for each idea,
      from the first step to the classes, ending with: «Empezaste dando un paso. Acabas
      describiendo criaturas.» `{familiar}` sleeps in your hood. The end of the first year.
      Recall these ideas, in this order, in a few short sentences: instructions to the
      wizard's objects and their arguments; spells and things carried; names that keep a
      value, and what objects know of themselves; cells and positions; waiting, `if` and
      `else`, `for` and `while`; lists; flying; actions of your own with `def` and their
      arguments; and classes, objects, `__init__`, inheriting and methods.

Each title: *La torre* / *The tower*; *El rastro* / *The trail*; *La voz en el túnel* /
*The voice in the tunnel*; *Lo que trajo el familiar* / *What the familiar brought*; *El
fin de curso* / *The end of the year*.
