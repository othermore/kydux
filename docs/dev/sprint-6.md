# Sprint 6 — The wizard

The second half of phase 3 (`plan.md`, *The shell*). At the end a child
makes their wizard before the course begins: a name, whether the wizard is
a girl or a boy, and a look chosen among several; the scene shows that
wizard, and every word of the game speaks of them by name and in the right
gender. The level screen works on a tablet held sideways, and a browser
suite walks the whole loop in both languages, leaving screenshots for the
reviewer, since the owner tries the game only every few sprints.

The pieces, in this order: 3.9, 3.2, 3.7, 3.8. The rules of the earlier
sprints hold: pieces in order, `ci/check.sh --e2e` green and one local
commit per piece, never a push, every word for the player through `t()` or
a content file, nothing forbidden and nothing secret. Section 7 is the
owner's acceptance test.

## 1. Decisions taken here

- **D36 — The wizard is the child's: a name, a gender and a look, kept in
  the progress document.** `progress.wizard` is `{name, gender, look}` or
  null before the child has made one. `gender` is `girl` or `boy`; it
  chooses the words, nothing else. `look` is the id of one of the looks the
  game offers (`app/src/engine/looks.ts`): for now, palettes and hair
  styles drawn on the placeholder figure; with phase 4's art, the same ids
  pick sprite sheets or palette swaps, so the document does not change. The
  creator is at `#wizard`; *Continue* on the start screen leads there while
  there is no wizard, and the start screen offers *Change my wizard* once
  there is one. *Start from the beginning* keeps the wizard, as it keeps
  the language and the settings. The document's `version` stays 1: a
  document without `wizard` is read as one with null, which the start
  screen handles.
- **D37 — The words follow the wizard.** A text for the player may hold a
  choice, `{boy's words|girl's words}`, and the wizard's name, `{wizard}`.
  One function, `personal(text)` in `app/src/i18n/`, resolves both from
  `progress.wizard`, and every path a text takes to the screen goes through
  it: `t()` after its parameters, a lesson's Markdown before `marked`, a
  level's texts (title, goals, hints, starting code) when they are loaded.
  Either side of a choice may be empty, so that an ending can vary:
  `cansad{o|a}`. Before a wizard exists, which only a developer's direct
  address can bring about, the first side and the word `wizard.no_name`
  are used. `{wizard}` is distinct from `t()`'s `{name}`, which some keys
  use for a Python name. The i18n check requires that, in Spanish, the
  words `mago` and `maga` appear only inside a choice, so that no text
  speaks of a girl as a boy by oversight, and that every choice has exactly
  one `|`.
- **D38 — The screens the game is made for.** The level screen works from
  1024 × 700 pixels up, a tablet held sideways with its browser's bars, to
  any size; at 1280 × 720 the scene, the editor, Run and the goals are all
  in view without scrolling. Under 800 pixels of width the panes stack, as
  they do now, for a phone, which the game does not promise but must not
  break on. The browser suite checks the three sizes.
- **D39 — The loop suite leaves screenshots for the reviewer.** One
  Playwright spec walks the whole loop in each language, new wizard to the
  map after a win, and saves a screenshot at each step under
  `app/e2e/shots/<lang>/`, ignored by git. It is the sprint's evidence: the
  reviewer reads them in place of the owner's hands on the game.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out.

## 2. The words, after this sprint

The texts that speak of the wizard, in Spanish, written with choices:

```
"El cuaderno {del mago|de la maga}"
"Tu programa ha dado más de {limit} pasos y {el mago|la maga} está agotad{o|a}."
"# {El mago|La maga} avanza una casilla por paso."       (a level's starting code)
"Eres {un joven mago|una joven maga} recién llegad{o|a}." (if a text ever says so)
"¡Te damos la bienvenida al colegio, {wizard}!"           (a lesson)
```

English rarely needs a choice: `wizard` has no gender. Where it does, the
same syntax serves: `{he|she}`, `{his|her}`. The Python the child types
and the game's API stay as they are: `wizard` is the object's name, in
code, never a word to translate or to gender.

The texts to convert: every `mago` in `i18n/es.json`, the lessons'
`es.md`, the levels' `text.es.json` (the corridor's starting code names the
wizard). The lesson `01-first-action` greets the child by name in both
languages, to show the mechanism.

## 3. The progress document, after this sprint

```json
{
  "version": 1,
  "language": "es",
  "wizard": { "name": "Marta", "gender": "girl", "look": "amber" },
  "settings": { "speed": 2, "fontSize": 17, "split": 0.6 },
  "lessons": { "01-first-action": { "read": true } },
  "levels": { "01-the-corridor": { "won": true, "stars": 1, "code": "...", "hints": 2 } },
  "started": ["01-the-corridor"],
  "current": "level:02-the-locked-door"
}
```

`readProgress` keeps a `wizard` only when its `name` is a string of 1 to
20 characters, its `gender` is `girl` or `boy`, and its `look` names a
look the game has; otherwise `wizard` is null and the start screen asks
for one. The name is trimmed, and may hold letters (any alphabet, accents
included), digits, spaces, hyphens and apostrophes; nothing else.

## 4. The pieces

### 3.9 The words follow the wizard

**`app/src/i18n/personal.ts`.** `personal(text, wizard)`: replaces each
`{a|b}` by `a` for a boy and `b` for a girl, and each `{wizard}` by the
name; with `wizard` null, by `a` and by `t('wizard.no_name')`. A `{…}`
with no `|` and not `wizard` is left as it is, so that `t()`'s parameters
and a Python `{}` survive. `t()` calls it last, with the wizard from the
progress document (`progress.wizard()`), after the parameters are in, so
that a parameter's value is never read for a choice. `loadLevelText`
applies it to every string of the text file, the starting code included,
and `loadLesson` to the Markdown before it is split into pages. The scene's
words (`words.ts`) already come from `t()`.

**The content.** Every Spanish text that names the wizard is written with
a choice (section 2). The lesson `01-first-action` says the child's name
on its first page, in both languages.

**The checks.** `tools/i18n_check.py` gains `check_choices`: in every
text for the player of every language (`i18n/<lang>.json`, the levels'
`text.<lang>.json`, the lessons' `<lang>.md` outside code), a `{…|…}`
holds exactly one `|`; and in Spanish, `mago` or `maga` appears only
inside a choice. The world's `test_levels` (or a new test beside it)
confirms that a level's starting code, with the first side of every choice
taken and then with the second, still parses as Python, so that a comment
is the only place a choice ever is.

**Tests.** Vitest for `personal`: both sides, an empty side, the name, no
wizard, a parameter left alone, a Python set literal left alone; `t()`
with a wizard set through a fake store. pytest for the content check.

### 3.2 The wizard creator

**`app/src/engine/looks.ts`.** The looks the game offers: an id and, for
the placeholder figure, its skin, hair, hair style (`short` or `long`),
robe and hat colours; eight looks, with four skin tones among them and the
two hair styles in both halves, so that a girl or a boy can pick any. A
look's words are not needed: the figure is the word. `placeholders.ts`
draws the wizard from a look (`drawWizard(ctx, x, facing, look)`), and
exports `drawLookPreview(canvas, look)`, the figure facing down, so that a
screen outside Phaser can show it. The long hair is drawn past the hat's
brim at the sides and, from behind, over the robe.

**The creator at `#wizard`.** A heading (`wizard.title`, *Your wizard*),
the name (`wizard.name`, a text input, `maxlength` 20, with the rule of
section 3 enforced as the child types and said under the field when a
character is refused, `wizard.name_rule`), the gender as two large buttons
with a figure each (`wizard.girl` *A girl*, `wizard.boy` *A boy*, a
`role="radiogroup"`), the looks as a row of eight figures drawn at three
times their size with `image-rendering: pixelated`, the chosen one framed
(`role="radiogroup"` too, each an `aria-label` `wizard.look_n`, *Look
{n}*), a preview of the chosen look at four times its size with the name
under it, and *Done* (`wizard.done`), enabled once the name is not empty.
Done saves `progress.wizard` and goes to `current` if there is one, else
the course's first item. When a wizard exists already, the screen opens
with its values, and a *Back* (`wizard.back`) to `#start` is shown beside
Done. Escape and the arrow keys work in each radiogroup.

**The start screen.** With no wizard, *Continue* reads `start.create`
(*Make your wizard*) and goes to `#wizard`; the map stays reachable. With
one, the screen shows the figure and the name beside the welcome
(`start.hello`, *Hello, {wizard}*), and a *Change my wizard* link
(`start.change_wizard`) to `#wizard`. `reset()` keeps the wizard.

**The scene.** `startScene` takes the look (`progress.wizard()?.look`,
else the first look) and draws the wizard's texture from it. The map's
done stops and the win card need nothing new; the win card's heading may
say the name (`outcome.won` becomes *You did it, {wizard}!* when a wizard
exists: write it with `{wizard}` and let `personal` put the name in, with
`wizard.no_name` serving when there is none).

**Tests.** Vitest: `readProgress` with a good wizard, a name too long, a
look the game lacks, a gender that is neither; the name rule; `looks` has
eight ids, each distinct, both hair styles and four skins. The browser: a
fresh visit's *Continue* opens the creator; Done is disabled with no
name; a name, a gender and a look chosen, Done opens the first lesson,
which greets by name; the start screen then says *Hello, {name}*; the
corridor's Spanish starting code says *La maga* for a girl; export, reset
and import bring the wizard back; the scene's wizard uses the look's robe
colour (read a pixel of the canvas, as the engine tests do).

### 3.7 Keyboard and screen

**The sizes.** The level screen at 1024 × 700, 1280 × 720 and 1920 × 1080:
no horizontal scroll; the scene's frame, the editor with at least eight
lines, Run and the goals panel in view without scrolling; the heading's
title, *?*, *Map* and the gear on one line or wrapped without overlap; the
buttons under the editor wrapping onto two lines when they must, the speed
select last. The header's language picker and the brand fit at 1024. The
notebook over the scene and the start, win and outcome cards fit inside
the scene's frame at 1024 × 700. The CSS changes are what these need:
likely the level screen's height, `calc(100vh - 110px)`, made from the
header's real height, the minimum editor height, and the buttons' wrap.

**The keyboard.** What exists, confirmed by the suite: Tab inserts four
spaces, Shift+Tab removes them, Escape leaves the editor's focus trap
(CodeMirror's `escape` then Tab moves on), Ctrl+Enter runs, Escape closes
a card, the split handle takes the arrow keys. New: on the level screen,
`Alt+R` runs and `Alt+N` opens the notebook, said in the buttons' `title`
(`level.run_key`, `level.notebook_key`); the keys are listed in the
settings screen under a small heading (`settings.keys`), through `t()`.

**Tests.** The browser at the three sizes, with `page.setViewportSize`;
a check that `document.documentElement.scrollWidth` equals the viewport's
width; bounding boxes of Run, the editor and the goals inside the viewport.
The keys: Tab in the editor, Ctrl+Enter, Alt+R, Alt+N.

### 3.8 The browser suite of the whole loop

**`app/e2e/loop.spec.ts`.** For each language: a fresh visit; the start
screen; the creator, with a name, a gender and a look; the first lesson's
pages; Try it into the corridor; the start card; a wrong run (a bump) and
its outcome card; the hint; the winning run and the win card; Next into
the second lesson; the map with the lesson and the corridor done; the
settings. At each step a screenshot to `app/e2e/shots/<lang>/<nn>-<step>.png`,
full page, with `app/e2e/shots/` in `.gitignore`. The spec asserts what
each step shows, as the other specs do; the screenshots are for eyes.
`ci/check.sh --e2e` says at the end where the screenshots are. A
`README.md` in `app/e2e/` says what the suite covers and how to read the
shots.

**Tests.** The suite is the test. `npm run e2e` keeps running every spec;
the loop spec is one more, under five minutes for both languages.

## 5. Documents

- `architecture.md`: D36–D39; *Parts* with `looks.ts`, `personal.ts`, the
  creator; the progress document's `wizard`.
- `plan.md`: phase 3 has 3.9 and says sprint 6 has 3.9, 3.2, 3.7 and
  3.8; section 2.7's document shows `wizard`; section 2.6 names the
  choices and `{wizard}`.
- `dev-environment.md`: `#wizard` in the table of addresses; the shots'
  directory and what it is for; in the guide's style.
- `README.md` and `README.es.md`: *Playing* begins with making the
  wizard, in one or two sentences.

## 6. What this sprint leaves out

The art (phase 4): the looks are the placeholder figure's palettes, drawn
to be replaced. Sound. The course proper (phase 5). A neutral gender in
Spanish, which the language does not give at a child's reading level; the
choice has two sides. The wizard's look on the map or in the cards.

## 7. Acceptance test (for when the owner tries it)

1. In a private window, `https://hija.local:5173` opens the start screen in
   Spanish. The big button says *Crea tu personaje*. Press it.
2. The creator asks for a name, *Una maga* or *Un mago*, and a look. With
   no name, *Listo* is greyed. Type a name, choose *Una maga* and a look.
   *Listo* opens the first lesson, which greets you by name.
3. Reach the lesson's last page and press *Probar*. The corridor's starting
   code says *La maga avanza una casilla por paso*. The wizard in the scene
   has the look you chose.
4. Win the corridor. The win card says your name. The start screen says
   *Hola, {name}* and offers *Cambiar mi personaje*.
5. Make the window 1024 pixels wide: the level screen still shows the
   scene, the editor and Ejecutar without scrolling sideways.
6. In the editor, Tab indents four spaces, Ctrl+Enter runs, Alt+N opens the
   notebook.
7. `app/e2e/shots/es/` holds the loop's screenshots after
   `ci/check.sh --e2e`.

## 8. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`3.9: the words follow the wizard`), never a push; what this document
leaves open decided the simplest way and said in the commit; what turns
out wrong done the working way and logged in `architecture.md`; a short
report to the owner in Spanish at the end, with what differs.
