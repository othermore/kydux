# Sprint 5 — The course

The first half of phase 3 (`plan.md`, *The shell*): the game around the
levels. At the end a child opens the game, picks up where they left off,
walks a chapter's map from a lesson to its level and on to the next, and
their progress is kept. Settings let the editor's text grow and the scene
and the editor share the screen as the child likes.

The pieces, in this order: 3.5, 3.1, 3.3, 3.4, 3.6. The wizard's look (3.2),
the layout for small screens (3.7) and the browser suite of the whole loop
(3.8) are sprint 6. The rules of the earlier sprints hold: pieces in order,
`ci/check.sh --e2e` green and one local commit per piece, never a push,
every word for the player through `t()` or a content file, nothing
forbidden and nothing secret. Section 7 is the owner's acceptance test.

## 1. Decisions taken here

- **D31 — Progress is one document behind one interface.** `ProgressStore`
  has `load()` and `save(progress)`; `LocalProgressStore` keeps the
  document in `localStorage`, and a remote one can come later behind the
  same interface (plan, phase 7). The document is one JSON object with a
  `version`, so that a later shape can read an earlier one. Nothing else in
  the game touches storage for progress: the speed, the hints shown, the
  code typed and the start cards move into it, and `sessionStorage` is no
  longer used.
- **D32 — The course is chapters of lessons and levels, in `content/`.** A
  chapter is a directory with `chapter.json` naming its items in order; a
  lesson is a directory with `lesson.json` and one Markdown file per
  language; a level stays as it is. The page reads `content/course.json`,
  written by `pack-world.mjs` from the chapters, so that it needs no
  directory listing.
- **D33 — A lesson is Markdown, rendered by `marked`, with no raw HTML.**
  The content is the project's own, so no sanitiser runs; a content check
  refuses an HTML tag in a lesson instead. Pages are separated by `---`. A
  fenced block marked `python try` is a *Try it* example: it goes into the
  next level's editor.
- **D34 — An item is open once the one before it is done.** In a chapter,
  the first item is open; a lesson is done once read to its last page; a
  level is done once won; the item after a done one is open. A level's
  address still opens it directly, for a developer and for the tests. A
  child who wants to go back can always replay.
- **D35 — The split between scene and editor, and the editor's text size,
  are the child's to set.** A handle between the two panes is dragged;
  the text size is chosen in settings; both are kept in the progress
  document under `settings`.

Each goes in `architecture.md`'s log, dated by `date -I`, with its
rationale and what it rules out.

## 2. The content, after this sprint

```
content/
  chapters/
    01-arrival/
      chapter.json      { "id": "01-arrival", "items": ["lesson:01-first-action",
                          "level:01-the-corridor", "lesson:02-steps", "level:02-the-locked-door",
                          "lesson:03-watching", "level:03-past-the-teacher"] }
      text.en.json      { "title": "Arrival" }
      text.es.json      { "title": "La llegada" }
  lessons/
    01-first-action/
      lesson.json       { "id": "01-first-action", "teaches": ["wizard.move_right"] }
      en.md  es.md
    02-steps/           arguments: a number of steps; picking up; opening
    03-watching/        attributes and waiting: watching the teacher
  levels/               as they are
```

The three lessons are short, for the engine's sake; the course proper is
phase 5. Each is two or three pages of a few sentences, in the voice of a
character of the school (unnamed for now: *your teacher*), with one code
example, and ends with a *Try it* block that opens the level after it. The
`teaches` list names what the lesson explains; the content check requires
every name in it to be taught by the level that follows (`api`).

A lesson's Markdown may use headings, paragraphs, bold and italic, lists,
inline code and fenced code. Images come with the art (phase 4).

## 3. The progress document

```json
{
  "version": 1,
  "language": "es",
  "settings": { "speed": 2, "fontSize": 17, "split": 0.6 },
  "lessons": { "01-first-action": { "read": true } },
  "levels": {
    "01-the-corridor": { "won": true, "stars": 1, "code": "wizard.move_right(6)\n", "hints": 2 }
  },
  "started": ["01-the-corridor"],
  "current": "level:02-the-locked-door"
}
```

`code` is the last code typed, `hints` how many hints were shown, `stars`
the most earned, `started` the levels whose start card has been seen,
`current` the item last opened. A `load()` of a document with an older
`version`, or none, gives the defaults.

## 4. The pieces

### 3.5 The progress store

**`app/src/progress/store.ts`.** `Progress` (the document above, typed),
`defaultProgress()`, `ProgressStore` (`load(): Progress`, `save(progress):
void`), `LocalProgressStore` under the key `kydux.progress`, and
`progress.ts` with the one instance the game uses and small helpers:
`levelProgress(id)`, `markWon(id, stars, code)`, `markRead(lessonId)`,
`setSetting(name, value)`, `setCurrent(item)`, each loading, changing and
saving. A storage that throws leaves a document in memory for the visit.
**Export / import**: `exportProgress(): string` (the JSON, pretty) and
`importProgress(text): Progress` (refuses a document that is not one, with
a message key); the buttons are 3.1's.

**The level screen** reads and writes through it: the speed, the code
typed, the hints shown, the start card seen, and a won run's stars and
code. `sessionStorage` goes. A won level marks `current` as the next item
of its chapter (3.3 gives the course).

**Tests.** Vitest with a fake storage: defaults, a save read back, an older
version read as defaults, a document that throws, export and import.

### 3.1 The start screen

At `#start`, and the page's default when there is no hash. A heading,
the tagline, and: *Continue* (`start.continue`, to `current`, or to the
first item when there is none; the button says where it goes, *Continue:
The locked door*), *Start from the beginning* (`start.new`, which asks
once, `start.new_confirm`, and resets the document), the language select,
*Settings* (`start.settings`, to `#settings`), and under a smaller
heading *Your progress* (`start.progress`): *Export* (`start.export`,
downloads `kydux-progress.json`) and *Import* (`start.import`, a file
picker; a bad file says `start.import_failed`). Plain DOM, through
`t()`.

**Tests.** The browser: a fresh visit lands on the start screen,
*Continue* opens the first lesson; after a win, *Continue* names the next
item; export then *Start from the beginning* then import brings the win
back.

### 3.3 The chapter map

**`content/course.json`**, written by `pack-world.mjs`: the chapters in
order with their items, each level's id and each lesson's id.
`content/course.ts` loads it; `course.items()` flattens it;
`course.next(item)`, `course.previous(item)`.

**The map at `#map`.** For the one chapter now, a path of stops top to
bottom: each stop a lesson (a book icon, placeholder-drawn in CSS) or a
level (a door icon), with its title from its texts, and a state: done
(ticked, a level with its stars), open (lit), or locked (grey, not a
link). D34 decides the state from the progress document. A stop opens
`#lesson/<id>` or `#level/<id>`. A heading with the chapter's title, and
a *Back* to `#start`. The *Next* of the win card (2.7) now goes to the
next item of the course, a lesson or a level, and on the last item to the
map; the level's `#about` card and the map agree on the titles.

**Tests.** Vitest for `course.next` and the state of a stop from a
progress document; the browser: the map's stops in order, the first open
and the rest locked, a won level making the next open.

### 3.4 The lesson viewer

`npm install --save-exact marked@<current>`; the version in
`architecture.md`.

**`content/lessons.ts`.** `loadLesson(id, lang)`: `lesson.json` and
`<lang>.md`, English when the language's file is missing; the Markdown
split into pages at `---`; the `python try` block of the last page taken
out as `tryCode`.

**At `#lesson/<id>`.** The lesson's title (its first heading), the page's
Markdown rendered by `marked` into a `<article>`, *Back* and *Next page*
(`lesson.previous`, `lesson.next`), *Page {n} of {total}*
(`lesson.page`), and on the last page *Try it* (`lesson.try`) which marks
the lesson read, stores `tryCode` as the next level's code when that
level has none typed yet, and opens the next item. Reading the last page
marks the lesson read even without *Try it*. Code blocks are shown with
Python's colours by CodeMirror's highlighter in read-only mode, or plain
`<pre>` if that costs more than it gives; the implementer decides and
says.

**Content checks** (`world/tests/test_levels_content.py` grows, or a new
`test_course_content.py`): every chapter's items exist; every lesson has
`lesson.json`, a Markdown file for every language with the same number of
pages, no raw HTML, a `teaches` list whose names the following level's
`api` holds, and a `tryCode` that runs without an error in that level.
`tools/i18n_check.py` requires a chapter's text in every language.

**Tests.** The browser: a lesson's pages turned, *Try it* opening the
corridor with the example in the editor, the lesson marked read on the
map.

### 3.6 Settings

**At `#settings`**, from the start screen and from a gear button on the
level screen (`level.settings`): the language, the playback speed, the
editor's text size (`settings.font_size`, a select of 14, 17, 20 and 24
pixels), and *Back*. Each change saves through the store and applies at
once.

**The split.** A handle between the scene's pane and the editor's pane on
the level screen; dragging it (pointer events, mouse and touch) sets the
scene's share of the width between 35 % and 75 %, kept in `settings.split`
and applied as a CSS variable. Double-clicking the handle restores the
default. The scene follows, as it does a window resize.

**The editor's text size** is a CSS variable too, set from `settings`
when the level screen opens and when the setting changes.

**Tests.** Vitest for the clamp of the split; the browser: the font size
chosen shows in the editor's computed style and survives a reload; the
handle dragged moves the panes, and the value survives a reload.

## 5. Documents

- `architecture.md`: D31–D35; *Parts* with `progress/`, `content/course.ts`
  and `lessons.ts`, the screens, and `course.json` among `pack-world`'s
  files; the versions table with `marked`.
- `plan.md`: phase 3's pieces say which sprint has them; section 2.5's
  content layout and 2.7's progress document say what was built.
- `dev-environment.md`: the hashes of every screen, and that progress
  lives in the browser's `localStorage` under `kydux.progress`, with
  export and import on the start screen; in the guide's style.
- `README.md` and `README.es.md`: *Playing* says, in a few sentences, what
  a child does: open the game, continue, read a lesson, play its level.
  Still no way to install, so nothing about that yet.

## 6. What this sprint leaves out

The wizard's name and look (3.2), the layout under 1000 px and on a
tablet (3.7), the whole-loop browser suite with screenshots (3.8), sound,
the art, and the course proper (phase 5): the three lessons here are the
engine's proof, written to be replaced.

## 7. Acceptance test (for when the owner tries it)

1. `https://hija.local:5173` opens the start screen, in Spanish: *Continuar*
   says where it goes; *Empezar desde el principio*; *Ajustes*; *Exportar* and
   *Importar*.
2. *Continuar* opens the first lesson. Its pages turn; the last one has
   *Probar*, which opens the corridor with the example in the editor.
3. Win the corridor. *Siguiente* on the win card opens the second lesson,
   not a level. The map (`#map`) shows the lesson and the corridor done,
   the second lesson open, the rest locked.
4. In *Ajustes*, set the text size to 24: the editor's text grows at
   once. Back on a level, drag the handle between the scene and the
   editor: the panes follow; reload: they stay.
5. *Exportar* downloads a file; *Empezar desde el principio* asks and
   clears the map; *Importar* with the file brings it back.
6. Close the browser, open it again: the start screen's *Continuar* still
   says where it goes.

## 8. How the implementer works

As in the earlier sprints (sprint-1.md, section 7): one piece at a time,
`ci/check.sh --e2e` green and a local commit per piece named after it
(`3.5: the progress store`), never a push; what this document leaves open
decided the simplest way and said in the commit; what turns out wrong done
the working way and logged in `architecture.md`; a short report to the
owner in Spanish at the end, with what differs.
