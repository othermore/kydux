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

## The loop and its screenshots

`loop.spec.ts` walks the whole game once in each language. It opens the game
fresh, makes a wizard, reads the first lesson, fails the corridor once, asks
for a hint, wins, goes on to the next lesson, and opens the map and the
settings.

At each step it saves a screenshot. They are for a person to look at: the
test already checks what each step shows. They land in `shots/`, one folder
per language, numbered in the order they were taken:

```
app/e2e/shots/en/01-start.png
app/e2e/shots/en/02-creator.png
...
app/e2e/shots/es/14-settings.png
```

Git ignores the folder. Each run of the loop replaces it, so the shots are
always of the code that was just tested.

`helpers.ts` is not a test. It gives a test a wizard before the game loads,
for the tests of what comes after the creator.
