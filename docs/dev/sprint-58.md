# Sprint 58 — One start screen, with its people

On 2026-11-21, after the review of sprint 57, the owner looked at the
start screen with its named games and asked for it to be drawn again,
a comment at a time. On its buttons and its list:

> Lo unico que veo es que si mostramos directamente las partidas
> guardadas, ya no hace falta el botón cargar una partida, no?

> Cuando no hay partida no sale nada, pero una vez que has guardado,
> está bien que se muestre directamente. Podemos quitar también el
> botón de partida nueva de donde está, y mostrarlo dentro del cuadro
> de las partidas guardadas […] y podemos resaltar la partida que está
> cargada en este momento para que se vea claramente como que esa es
> la que está abierta (y el botón jugar ahí no sale o está
> desactivado). […] podemos en vez de tener un botón así de grande,
> tener lo de cambiar los nombres junto al nombre de la partida y del
> personaje, arriba, como un botón de editar (un lapiz o similar, más
> discreto), y los ajustes los podemos tener también arriba a la
> derecha junto al selector de idioma, con un icono de ajustes. Así
> descargamos la botonera y solo dejamos "Continuar" y "El mapa".

> Y la sección de "Tu progreso" también podemos eliminarla. El botón
> de exportar se pone junto a cada partida, y el de importar junto al
> botón de partida nueva. Y el mensaje que explica que las partidas se
> guardan en el navegador y se deben exportar […] se muestra debajo
> del título de la lista de partidas, con una fuente más pequeña o en
> cursiva para que se distinga.

> Y el mensaje de tu partida se guarda sola mientras juegas se pone
> junto al de exportar e importar.

On the screen a child with no wizard sees:

> No entiendo muy bien la pantalla en la que se ve "Qué es kydux" y
> "Empezar la historia". Esa pantalla debería ser simplemente la
> pantalla de inicio del juego (con el mapa, etc...). […] la pantalla
> puede ser como la pantalla principal del juego en cualquier caso,
> para que no haya dos pantallas distintas.

> Y lo de acabas de llegar al colegio también se puede quitar, solo
> tiene sentido al principio, en esa pantalla inicial mejor no
> ponerlo, simplemente cambia o "Iniciar partida" o "Continuar
> partida" según el caso

On its art:

> ya de paso en esa pantalla inicial del juego estaría bien mejorar el
> arte. Me gustaría que en el fondo y a los lados se viesen cosas,
> como una imagen del castillo y imágenes de los distintos personajes
> (idealmente a cuerpo completo, bien dibujados como recreados)

> y algunos de esos recursos se pueden incorporar también a la página
> inicial que se ve cuando no has iniciado ningún juego nunca, donde
> ahora mismo ya se ve el castillo pero se podrían ver más cosas por
> el fondo

> no debemos poner al mismo personaje con distintos colores de ropa,
> elegimos solo un color de cada personaje para las decoraciones de la
> página, y lo ideal sería hacer renderizados a cuerpo completo o
> imágenes con varios personajes o similar, para decorar más. Puedes
> usar gemini para eso.

And, seeing the first pictures of it:

> el icono de editar nombres debería ser un poco más grande y que se
> notase algo más. Y está puesto como en tierra de nadie, mejor
> ponerlo junto al nombre del personaje. Y el icono de ajustes también
> se puede hacer un poco más grande y que se vea un poco más.

> Es a proposito que el marco amarillo del botón verde no coincida
> justo con el botón? Y que el botón verde parezca un pixel o dos más
> alto que el botón marrón?

The designer builds this sprint, as it built sprint 46: the owner asks
for it within one conversation and reviews it by looking; nobody else
reviews it before the owner does.

## 1. What the owner's words change

Until this sprint the start screen was two. A child with no wizard saw
the welcome page's first part, a sentence of the story and *Begin the
story*; a child with one saw a row of five buttons (*Continue*, *The
map*, *Load a game*, *Change the names*, *Settings*), a list that
*Load a game* unfolded, *New game* under it, and a section *Your
progress* with one *Export* and one *Import*. The screen lay on the
bare parchment.

Reading the page for it showed two more things:

- **The gold ring did not fit a button.** A button stands on a foot
  drawn as a shadow under its box, and the ring of a key was an outline
  round the box alone, two pixels off it: the foot stood out under the
  ring. The start screen puts the key on its big button, so that Enter
  goes on, and there the ring is always seen.
- **The row's two buttons were not as tall.** The big button's letter
  is 20 pixels and its foot 3 deep; the quiet one beside it had a
  letter of 18 and a foot of 2.

## 2. Decisions

- **D293 — One start screen, with the saved games in a box on it.**
  The screen is the same with or without a wizard: a greeting, a row of
  buttons, the saved games. The big button says *Start game* or
  *Continue game*; *The map* stands beside it once there is a wizard.
  The box of games shows itself from the first saved game, with *New
  game* and *Import a game* at its top, a note in small italics under
  its title, and *Play*, *Export* and *Delete* a game; the game being
  played is framed and says *Open now*. A pencil beside the wizard's
  name opens the creator; a gear in the header opens the settings.
- **D294 — A painting behind the start screen, and the school's people
  at the sides.** Eleven characters painted whole by Gemini, one set of
  colours each; a painting of the castle and the village fixed behind
  the start screen's sheet, the people in two groups at the window's
  foot; some of them on the welcome page.

Both are written in full in `architecture.md`.

## 3. Pieces

### 3.1 The start screen (`ui/start.ts`, `main.ts`)

- `#continue` is *Start game* (to the opening story) or *Continue game*
  (to the item last opened); the button does not name the item.
  `#map-link` only with a wizard. The story's sentence and the welcome's
  first part leave the screen; the header's link stays the way to the
  welcome page, and a first visit still opens on it (D193).
- `#games` whenever a game is saved: `.games-top` with the title and
  `.games-actions` (`#new`, `#import`), `#saved-note`, the form that
  asks an imported game's name (D291), the rows. A row's buttons are
  *Play* (or `.game-open`, *Open now*, on the row with `data-current`),
  `.export` and `.delete`. With no game saved, `#import` stands in the
  row of the big button and the form under it.
- *Export* downloads its row's game as `kydux-<name>.json`.
- `#change-wizard`, the pencil, in `.start-name` beside the greeting's
  `h2`; `#settings-link`, the gear, in the header's `.top-links`, absent
  on a level and on the settings. Both are `.icon-button`, 40 pixels
  round, with `aria-label` and `title`; `ui/icons.ts` draws them.
- In a window of 640 pixels or less a game's buttons go under its
  words.

### 3.2 The art (`ui/decor.ts`, `app/public/decor/`)

- `tools/art/sprites.py whole` keys, trims and scales a character
  painted whole. Eleven prompts, `tools/art/prompts/whole-<id>.md`, each
  with the character's small figure and portrait as references; each
  picture was the first try.
- `start-backdrop.md`: the castle in the right quarter, the village and
  the lake in the left one, calm sky and meadow in the middle half that
  the sheet covers, open grass along the foot. Two details of the
  welcome page's painting are its references; the third try is kept
  (the first two copied the reference's composition).
- `.start-screen` is a sheet of paper 760 pixels wide; `.backdrop` is
  fixed behind the page; the header is a band of paper while a backdrop
  is shown. The groups are placed figure by figure in the stylesheet,
  inside a strip as wide as the space beside the sheet, 460 pixels at
  most, shown from 1240 pixels of window.
- The welcome page: `.about-hero-figures` before the castle;
  `sectionWith()` puts a group beside the words of *What Kydux is*, *Who
  it is for* and *Free*.

### 3.3 The ring and the row

- A footed button's foot is two variables, `--foot-height` and
  `--foot-colour`; its ring is drawn as shadows round the button and
  round its foot, three pixels of gold close against both. The outline
  stays, transparent, for a window of forced colours.
- `.start-actions .quiet-button` has the big button's letter and foot.

### 3.4 Texts

No story and no lesson changes. The designer writes the labels, too
small to brief: *Start game* / *Iniciar partida* and *Continue game* /
*Continuar partida* (the owner's words), *Import a game* / *Importar una
partida*, *Open now* / *Abierta ahora*. The note under the list's title
joins the two sentences the screen already had, as the owner asks, with
their words: *Tu partida se guarda sola mientras juegas, en este
navegador. Para llevarla a otro navegador o a otro ordenador, o para
tener una copia de seguridad, expórtala a un fichero e impórtala allí.*
The keys `start.intro`, `start.load`, `start.settings`,
`start.progress`, `start.progress_about` and `about.more` leave.

### 3.5 Documents and checks

D293 and D294; D36, D61, D70, D193 and D291 in the present; the file
map, `plan.md`, both READMEs, `dev-environment.md`, `art/README.md`.
`start.spec.ts`, `wizard.spec.ts`, `settings.spec.ts` and
`about.spec.ts` follow the screen, with a new test for the painting and
the groups. `ci/check.sh` and those four specs after each piece;
`ci/check.sh --e2e` whole, once, at the end.

## 4. What the owner will try

Open the game where a game is already saved.

1. The start screen is a sheet of paper over a painting. The castle is at
   the right and the village at the left. In a wide window, the school's
   people stand at both sides, looking at the sheet. Nobody appears twice.
2. The row has two buttons, *Continuar partida* and *El mapa*. They are
   as tall as each other. The gold frame fits the green button.
3. The pencil beside *Hola, <nombre>* opens the wizard's page. The gear
   at the top right opens the settings.
4. The box *Partidas guardadas* is open by itself. The game being played
   is framed in gold and says *Abierta ahora*. Each game has *Exportar*
   and *Borrar*; the others have *Jugar*.
5. *Exportar* downloads a file named after the game. *Importar una
   partida* asks the name of the game the file brings, over the list.
6. *Partida nueva* begins the story. Before the wizard is made, go back
   to the start screen: it is the same screen, and its button says
   *Iniciar partida*.
7. Make the window narrow. The people leave and the painting stays. In a
   phone's width the games' buttons go under each game's words.
8. Open *Qué es Kydux*. Ilda, Nuri and Teku stand before the castle, and
   a small group stands beside three of the parts below.
