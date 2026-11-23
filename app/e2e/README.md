# The browser tests

These tests open the built game in a headless Chromium and use it as a child
would. Each `*.spec.ts` covers one part of the game: the start screen, the
creator, a lesson, a level, the map, the settings, the screen sizes.

They run with every other check:

```sh
ci/check.sh --e2e
```

Or alone, from `app/`, once the game is built:

```sh
npm run build
npm run e2e
```

`walkthrough.spec.ts` is not one of them: it plays a whole chapter for the owner to
read, and only `npm run walkthrough -- <chapter>` runs it (`docs/dev/dev-environment.md`).

## The loop and its screenshots

`loop.spec.ts` walks the whole game once in each language. It opens the game
fresh on the welcome page, starts playing into the story's opening, makes a
wizard, reads the story page at the
gate and the first lesson, sees the first step of the screen's guide, fails
the gate once, asks for a hint, wins, goes on to the next lesson, and opens
the map and the settings.

At each step it saves a screenshot. They are for a person to look at: the
test already checks what each step shows. They land in `shots/`, one folder
per language, numbered in the order they were taken:

```
app/e2e/shots/en/01-welcome.png
app/e2e/shots/en/02-opening.png
...
app/e2e/shots/es/19-settings.png
```

Git ignores the folder. Each run of the loop replaces it, so the shots are
always of the code that was just tested.

`published.spec.ts` plays the game as it is published (D328, D329): the
built files served plain, with no header of the game's, under the name
`kydux.kidux.org`, which the browser is told to find on this machine. It
checks that the page isolates itself, the notice about the cookies and its
two answers, and what is counted. It answers Google's and GoatCounter's
addresses itself, so nothing leaves the machine. It runs in the full
Chromium (`channel: 'chromium'`), since the headless shell does not take a
plain `http` address under a name for a secure one.

`helpers.ts` is not a test. It gives a test a wizard before the game loads,
for the tests of what comes after the creator.

While a screen loads, a child who has begun reads tips, and a slow load holds the
screen for a tip's ten seconds (D214). So the tips are off in every page a spec
opens: `playwright.config.ts` sets the key `kydux.tips-off` in the browser's
storage, and `seedWizard` sets it too, for a context a spec makes itself.
`waiting.spec.ts` alone turns them on, with `seedWizard(page, wizard, { tips:
true })` and an empty `storageState`.
