---
outputs:
  - content/the-cookies-notice/texts.es.json
  - content/the-cookies-notice/texts.en.json
context:
  - i18n/es.json
  - i18n/en.json
---
Write the whole of why the published game uses cookies, read by whoever is about to
refuse them, and the few words about them on the settings page. The owner of the game
has said what the notice is:

> Creo que estaría bien que hubiese simplemente un mensaje corto ("Usamos cookies para
> mejorar el juego") y un botón de aceptar y uno de "rechazar" y el de rechazar en lugar
> de rechazar que saque ya el mensaje completo explicando por qué, y pregunte: estás
> seguro de que quieres rechazarlas?

> Podemos hacer que funcione sin las cookies, no tendremos datos, pero pidamos dos o
> tres clics para llegar ahí.

> Si las cookies están rechazadas, una vez cada 1-2 días hay que volver a preguntar. Si
> están aceptadas, están aceptadas para siempre.

> Y no digas lo que cuenta el juego sin cookies, eso no hay que aclararlo en ningún
> sitio.

> Y lo de si eres menor: cámbialo por si eres menor y necesitas ayuda, pide a un
> adulto…

The game is published on the web at kydux.kidux.org. There, and only there, it counts
how it is played, so that the people who make it learn which levels take the longest and
where children get stuck, and can make those better. The notice is the first thing on
the page, before the story and before any wizard is made: a painting of the castle, one
line in the owner's words, *Usamos cookies para mejorar el juego* (*We use cookies to
make the game better*), and two buttons, *Aceptar* and *Rechazar* (*Accept*, *Refuse*).
Whoever presses *Rechazar* is not refused yet: they read the whole of why, the two
paragraphs written here, and under them the question *¿Seguro que quieres rechazarlas?*
with *Aceptar las cookies* and *Sí, rechazarlas*. After either answer the game opens.

Its readers are a child of eight to twelve and, often, the grown-up beside them. Write
it for both at once: as plain and warm as the welcome page (`about` in the files given
above), honest, with no legal words and no fuss, and short. No wizard exists yet, so
no text here uses `{wizard}` or a choice in braces, and no word depends on whether the
reader is a girl or a boy.

These are the facts. Say them truly, and say nothing more than them:

- What is counted: which screens are opened (each story, lesson and level), how long a
  level takes, how many times its program is run, how many hints are read, how many
  stars are earned.
- What is never sent: the wizard's name, the programs the child writes, and who the
  child is. Nobody is asked for a name, an address or an account.
- Who keeps the count: Google Analytics, which saves cookies in the browser. A cookie
  is a small note the browser keeps; with it the count can tell that a visit today and
  one tomorrow come from the same browser. Explain the word in one short clause, once,
  the first time it appears. Nothing else that counts is named: the notice is about
  cookies, and nothing else saves one.
- The game plays just the same without the cookies. It is then harder for the makers
  to know which levels to make better. No text says what the game counts without them.
- A child who needs help asks a grown-up to read the notice with them and to decide:
  *Si eres menor y necesitas ayuda, pide a un adulto…*
- The answer can be changed at any time on the settings page (*Ajustes*, *Settings*).
- A yes is kept for good. A no is kept for a day and a half; then the notice asks again.

Answer with two JSON objects, one a file: `texts.es.json` holds the Spanish,
`texts.en.json` the English. Each is an object of the keys below to a string. Use
exactly these keys and no others.

- `cookies.text`: the first paragraph of why, two or three sentences: why the game
  counts, what it counts and what it never sends.
- `cookies.detail`: the second paragraph, three or four sentences: who keeps the count
  and what a cookie is; that the game plays the same without them, and what is lost;
  that a child who needs help asks a grown-up; that the answer can be changed in the
  settings.
- `cookies.settings_accepted`: on the settings page, beside the button *Retirar el
  permiso* (*Withdraw the permission*), two sentences: the cookies are accepted in this
  browser and the game counts how it is played; the button takes the yes back and
  deletes the cookies, and the saved games stay where they are.
- `cookies.settings_refused`: on the settings page, beside the button *Aceptar las
  cookies* (*Accept the cookies*), one sentence: the cookies are refused in this
  browser. It does not say that the notice comes back.

## Rules

- Spanish from Spain. No *usted*: the notice speaks to the reader as *tú*.
- *cookies* is the word in both languages.
- Name Google Analytics exactly so.
- No exclamation marks, no jokes about biscuits, no metaphor, no magic words: this is
  the one page of the game that is not story.
- Nothing promises what the facts above do not say.
