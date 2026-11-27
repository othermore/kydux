"""The game asks every question in its own dialog, never in the browser's (D364): no
code of the game calls `window.confirm`, `window.alert` or `window.prompt`, whose
buttons say the browser's words in the browser's language and which stop the page,
the running program with it, while they wait."""

import re

from conftest import REPO

#: A call of one of the browser's dialogs, with or without `window.` before it.
CALL = re.compile(r"\b(confirm|alert|prompt)\s*\(")
SOURCES = REPO / "app" / "src"
CODE = {".ts", ".js", ".mjs", ".html"}


def test_no_code_of_the_game_opens_a_browser_dialog():
    found = []
    for path in sorted(SOURCES.rglob("*")):
        if path.suffix not in CODE or path.name.endswith(".test.ts"):
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if CALL.search(line):
                found.append(f"{path.relative_to(REPO).as_posix()}:{number}: {line.strip()}")
    assert found == [], "a browser dialog in the game's code; ask through ui/ask.ts (D364)"
