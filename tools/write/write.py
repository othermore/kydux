#!/usr/bin/env python3
"""Have Gemini draft the texts the child reads, from a brief (architecture.md, D55).

    tools/write/write.py tools/write/briefs/<name>.md [--dry-run]

A brief is Markdown with a front matter between two `---` lines: `outputs:`,
the files to write, as paths of content/ (`content/lessons/if/en.md`) or of
docs/dev/ (the story bible, `docs/dev/story.md`), and
`context:`, the files Gemini is given in full, as globs from the repository's
root. The prompt is the rules every text follows (rules.md), the context files,
and the brief's own words. Gemini answers with a JSON object of path to text;
each file lands under drafts/<name>/, beside a manifest.json that says the
model, the brief and the date. A person reads every draft, corrects it and
moves it into content/; drafts/ is never committed.

The key is read from GEMINI_API_KEY in the environment or in
~/.config/kydux/secrets.env, and never printed.
"""

import argparse
import datetime
import glob
import json
import os
import sys
import time
from collections.abc import Callable
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
DRAFTS = REPO / "drafts"
SECRETS = Path.home() / ".config" / "kydux" / "secrets.env"
#: Where Gemini's drafts go once reviewed: the game's texts, and the story bible.
WRITABLE = ("content/", "docs/dev/")
#: The model that writes, pinned (architecture.md's versions table).
MODEL = "gemini-3.1-pro-preview"


class BriefError(ValueError):
    """A brief that cannot be sent, or an answer that cannot be written."""


def read_brief(path: Path) -> tuple[dict[str, list[str]], str]:
    """The brief's front matter, as lists by key, and its words."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise BriefError(f"{path.name}: a brief opens with its front matter between --- lines")
    head, _, body = text[4:].partition("\n---\n")
    fields: dict[str, list[str]] = {}
    key = None
    for line in head.splitlines():
        if line.startswith("  - ") or line.startswith("- "):
            if key is None:
                raise BriefError(f"{path.name}: an item before its key")
            fields[key].append(line.split("- ", 1)[1].strip())
        elif line.endswith(":"):
            key = line[:-1].strip()
            fields[key] = []
        elif line.strip():
            raise BriefError(f"{path.name}: cannot read {line!r}")
    for needed in ("outputs", "context"):
        if not fields.get(needed) and needed == "outputs":
            raise BriefError(f"{path.name}: a brief lists its outputs")
        fields.setdefault(needed, [])
    for output in fields["outputs"]:
        if not output.startswith(WRITABLE) or ".." in Path(output).parts:
            raise BriefError(f"{path.name}: {output} is not a path of content/ or docs/dev/")
    return fields, body.strip()


def context_files(patterns: list[str]) -> list[Path]:
    found: list[Path] = []
    for pattern in patterns:
        matches = sorted(Path(p) for p in glob.glob(str(REPO / pattern), recursive=True))
        if not matches:
            raise BriefError(f"the context {pattern} names no file")
        found.extend(m for m in matches if m.is_file() and m not in found)
    return found


def prompt(brief: Path) -> tuple[str, list[str]]:
    """The whole prompt for a brief, and the outputs it asks for."""
    fields, body = read_brief(brief)
    parts = [(HERE / "rules.md").read_text(encoding="utf-8"), "# The context\n"]
    for path in context_files(fields["context"]):
        name = path.relative_to(REPO).as_posix()
        parts.append(f"## {name}\n\n{path.read_text(encoding='utf-8')}")
    parts.append(f"# The brief\n\n{body}")
    parts.append("# The files to write\n\n" + "\n".join(f"- {o}" for o in fields["outputs"]))
    return "\n\n".join(parts), fields["outputs"]


def api_key() -> str:
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    if SECRETS.is_file():
        for line in SECRETS.read_text(encoding="utf-8").splitlines():
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip().strip("\"'")
    raise BriefError(f"no GEMINI_API_KEY in the environment or in {SECRETS}")


#: How many times a call is tried while the model is busy, and the first wait.
ATTEMPTS = 6
FIRST_WAIT_S = 15


def gemini(text: str) -> str:
    """Gemini's answer to a prompt, as JSON text. A model busy for a while (503, 429)
    is tried again, waiting twice as long each time."""
    from google import genai
    from google.genai import errors, types

    client = genai.Client(api_key=api_key())
    wait = FIRST_WAIT_S
    for attempt in range(1, ATTEMPTS + 1):
        try:
            answer = client.models.generate_content(
                model=MODEL,
                contents=text,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            return answer.text or ""
        except (errors.ServerError, errors.ClientError) as busy:
            if getattr(busy, "code", None) not in (429, 500, 503) or attempt == ATTEMPTS:
                raise
            said = f"write: the model is busy ({busy.code}); trying again in {wait} s"
            print(said, file=sys.stderr)
            time.sleep(wait)
            wait *= 2
    raise BriefError("the model stayed busy")


def write_drafts(
    brief: Path, ask: Callable[[str], str] = gemini, drafts: Path = DRAFTS
) -> list[Path]:
    """Sends the brief and writes the answer under drafts/<name>/, with its manifest."""
    text, outputs = prompt(brief)
    try:
        answer = json.loads(ask(text))
    except json.JSONDecodeError as broken:
        raise BriefError(f"the answer is not JSON: {broken}") from broken
    if not isinstance(answer, dict):
        raise BriefError("the answer is not a JSON object of path to text")
    unasked = sorted(set(answer) - set(outputs))
    missing = sorted(set(outputs) - set(answer))
    if unasked:
        raise BriefError(f"the answer has files the brief did not ask for: {unasked}")
    if missing:
        raise BriefError(f"the answer lacks {missing}")
    folder = drafts / brief.stem
    written = []
    for output in outputs:
        value = answer[output]
        if not isinstance(value, str):
            value = json.dumps(value, indent=2, ensure_ascii=False)
        target = folder / output
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(value.rstrip("\n") + "\n", encoding="utf-8")
        written.append(target)
    manifest = {
        "model": MODEL,
        "brief": brief.relative_to(REPO).as_posix() if brief.is_relative_to(REPO) else str(brief),
        "date": datetime.date.today().isoformat(),
        "files": outputs,
    }
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Have Gemini draft texts from a brief.")
    parser.add_argument("brief", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="print the prompt, send nothing")
    args = parser.parse_args()
    try:
        if args.dry_run:
            print(prompt(args.brief.resolve())[0])
            return 0
        for path in write_drafts(args.brief.resolve()):
            print(path.relative_to(REPO))
    except BriefError as error:
        print(f"write: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
