#!/usr/bin/env python3
"""Find the words that must never appear in Kydux's repository.

    tools/forbidden.py files              every tracked or new file, its path and content
    tools/forbidden.py message <file>     a commit message (the commit-msg hook)
    tools/forbidden.py history            every commit message on the current branch

The words are a list kept outside the repository, one entry per line, in
~/.config/kydux/forbidden.txt (or $KYDUX_FORBIDDEN): the name of the game
Kydux takes after, and anything else the project must not name by accident.
They cannot be written in the repository, not even in this check.

An entry matches whatever its letters and digits spell, in any case, with
accents ignored and up to three other characters between any two of them:
an entry "zorblax" also catches "Zorb Lax", "zorb-lax" and "Z.o.r.b.l.a.x". A
finding names the file and the line, never the word, so that the output
can be shown anywhere.
"""

import os
import re
import subprocess
import sys
import unicodedata
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEFAULT_LIST = Path.home() / ".config" / "kydux" / "forbidden.txt"
#: What may stand between two letters of an entry and still spell it.
GAP = r"[\W_]{0,3}"


def list_path() -> Path:
    return Path(os.environ.get("KYDUX_FORBIDDEN", DEFAULT_LIST))


def fold(text: str) -> str:
    """Lower case, without accents, one character for one character."""
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return stripped.lower() if len(stripped) == len(text) else text.lower()


def entries(text: str) -> list[str]:
    """The list's entries reduced to their letters and digits, without repeats."""
    found = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        letters = "".join(c for c in fold(line) if c.isalnum())
        if letters and letters not in found:
            found.append(letters)
    return found


def pattern(entry: str) -> re.Pattern[str]:
    return re.compile(GAP.join(re.escape(c) for c in entry))


def load(path: Path | None = None) -> list[re.Pattern[str]] | None:
    """The list's patterns; None when there is no list on this machine."""
    path = path or list_path()
    if not path.is_file():
        return None
    return [pattern(entry) for entry in entries(path.read_text(encoding="utf-8"))]


def matches(text: str, patterns: Iterable[re.Pattern[str]]) -> bool:
    folded = fold(text)
    return any(p.search(folded) for p in patterns)


@dataclass(frozen=True)
class Finding:
    where: str
    line: int | None

    def __str__(self) -> str:
        at = f":{self.line}" if self.line else ""
        return f"{self.where}{at}: a forbidden word"


def scan_text(where: str, text: str, patterns: list[re.Pattern[str]]) -> Iterator[Finding]:
    # Line by line, so that a finding has a line; and the whole text with its
    # line breaks taken as gaps, so that a word split across two lines is found.
    found = False
    for number, line in enumerate(text.splitlines(), 1):
        if matches(line, patterns):
            found = True
            yield Finding(where, number)
    if not found and matches(text, patterns):
        yield Finding(where, None)


def tracked_files(root: Path = REPO) -> list[Path]:
    """Every file git tracks or would add: committed, staged or new, not ignored."""
    listed = subprocess.run(
        ["git", "ls-files", "-co", "--exclude-standard", "-z"],
        cwd=root,
        capture_output=True,
        check=True,
    ).stdout.decode("utf-8", "surrogateescape")
    return [root / name for name in listed.split("\0") if name and (root / name).is_file()]


def read_text(path: Path) -> str | None:
    """The file's text, or None for a file that is not UTF-8 text."""
    data = path.read_bytes()
    if b"\0" in data[:8192]:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def scan_files(patterns: list[re.Pattern[str]], root: Path = REPO) -> list[Finding]:
    findings = []
    for path in tracked_files(root):
        name = path.relative_to(root).as_posix()
        if matches(name, patterns):
            findings.append(Finding(name, None))
        text = read_text(path)
        if text is not None:
            findings.extend(scan_text(name, text, patterns))
    return findings


def scan_history(patterns: list[re.Pattern[str]], root: Path = REPO) -> list[Finding]:
    log = subprocess.run(
        ["git", "log", "--format=%h%x00%B%x00"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if log.returncode != 0:  # a repository with no commit yet
        return []
    fields = log.stdout.split("\0")
    findings = []
    for commit, message in zip(fields[0::2], fields[1::2], strict=False):
        findings.extend(scan_text(f"commit {commit.strip()}", message, patterns))
    return findings


def main(args: list[str]) -> int:
    patterns = load()
    if patterns is None:
        print(
            f"forbidden: no list at {list_path()}; create it (docs/dev/dev-environment.md)",
            file=sys.stderr,
        )
        return 1
    if args == ["files"]:
        findings = scan_files(patterns)
    elif args == ["history"]:
        findings = scan_history(patterns)
    elif len(args) == 2 and args[0] == "message":
        text = Path(args[1]).read_text(encoding="utf-8")
        message = "\n".join(line for line in text.splitlines() if not line.startswith("#"))
        findings = list(scan_text("the commit message", message, patterns))
    else:
        print(__doc__, file=sys.stderr)
        return 2
    for finding in findings:
        print(f"forbidden: {finding}", file=sys.stderr)
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
