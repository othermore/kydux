#!/usr/bin/env python3
"""The comments of a reviewed document, printed with the words they are on.

    tools/doc_comments.py <file.docx | file.md>

A Google Doc downloaded as Microsoft Word (File > Download > Microsoft Word)
keeps its comments: each is in word/comments.xml, anchored in word/document.xml
between a commentRangeStart and a commentRangeEnd with its id. Downloaded as
Markdown, each comment's words are between <!-- gdoc_comment_begin: cN --> and
<!-- gdoc_comment_end: cN --> marks, and the comments are a block at the end,
after a line of ---, under gdoc_comments:, each with its head (author, time,
body, quote) and its replies. Printed as Markdown, one entry per comment, in
the document's order: the words commented on, in quotes, then the comment and
who wrote it, and each reply under it.
"""

import html
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


def q(tag: str) -> str:
    return f"{{{W}}}{tag}"


def comment_texts(archive: zipfile.ZipFile) -> dict[str, tuple[str, str]]:
    """Each comment's id to its author and text."""
    if "word/comments.xml" not in archive.namelist():
        return {}
    root = ET.fromstring(archive.read("word/comments.xml"))
    found = {}
    for comment in root.findall("w:comment", NS):
        paragraphs = []
        for paragraph in comment.findall(".//w:p", NS):
            paragraphs.append("".join(t.text or "" for t in paragraph.findall(".//w:t", NS)))
        found[comment.get(q("id"), "")] = (
            comment.get(q("author"), ""),
            "\n".join(p for p in paragraphs if p.strip()).strip(),
        )
    return found


def anchors(archive: zipfile.ZipFile) -> list[tuple[str, str]]:
    """Each comment's id with the words it is on, in the document's order."""
    root = ET.fromstring(archive.read("word/document.xml"))
    open_ranges: dict[str, list[str]] = {}
    order: list[tuple[str, str]] = []
    for node in root.iter():
        if node.tag == q("commentRangeStart"):
            open_ranges[node.get(q("id"), "")] = []
        elif node.tag == q("commentRangeEnd"):
            ident = node.get(q("id"), "")
            words = "".join(open_ranges.pop(ident, []))
            order.append((ident, re.sub(r"\s+", " ", words).strip()))
        elif node.tag == q("t") and open_ranges:
            for words in open_ranges.values():
                words.append(node.text or "")
        elif node.tag == q("p") and open_ranges:
            for words in open_ranges.values():
                words.append(" ")
    return order


MARK = re.compile(r"<!-- gdoc_comment_(begin|end): (\w+) -->")


def _scalar(lines: list[str], index: int, indent: int) -> tuple[str, int]:
    """The value of the key at `lines[index]`, which may go on over the lines
    indented deeper than `indent`: plain text folded with spaces, a 'quoted'
    string, or a block scalar (| or |-). Returns the value and the next index."""
    first = lines[index].split(":", 1)[1].strip()
    index += 1
    more = []
    while index < len(lines) and (
        not lines[index].strip() or len(lines[index]) - len(lines[index].lstrip()) > indent
    ):
        more.append(lines[index])
        index += 1
    if first in ("|", "|-"):
        body = [line.strip() for line in more]
        return "\n".join(body).strip(), index
    text = " ".join([first, *(line.strip() for line in more)]).strip()
    if len(text) >= 2 and text[0] == text[-1] == "'":
        text = text[1:-1].replace("''", "'")
    return html.unescape(text), index


def _entries(block: list[str], indent: int) -> list[tuple[str, int, int]]:
    """The keys at exactly `indent` spaces in `block`, each with where it starts and ends."""
    found = []
    for index, line in enumerate(block):
        if (
            line.strip()
            and len(line) - len(line.lstrip()) == indent
            and not line.lstrip().startswith("- ")
        ):
            found.append((line.strip().rstrip(":"), index))
    return [
        (key, start, found[i + 1][1] if i + 1 < len(found) else len(block))
        for i, (key, start) in enumerate(found)
    ]


def _fields(lines: list[str], indent: int) -> dict[str, str]:
    """author, time, body and quote at `indent`, in `lines`."""
    fields = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        depth = len(line) - len(line.lstrip())
        stripped = line.strip()
        if stripped and depth == indent and ":" in stripped:
            key = stripped.split(":", 1)[0].lstrip("- ").strip()
            fields[key], index = _scalar(lines, index, indent)
        else:
            index += 1
    return fields


def markdown_comments(text: str) -> list[dict[str, str]]:
    """The comments of a Markdown download, in the document's order."""
    body, _, tail = text.rpartition("\n---\n")
    if "gdoc_comments:" not in tail:
        return []
    lines = tail.splitlines()
    start = next(i for i, line in enumerate(lines) if line.strip() == "gdoc_comments:")
    block = lines[start + 1 :]
    heads: dict[str, dict[str, str]] = {}
    replies: dict[str, list[dict[str, str]]] = {}
    for ident, a, b in _entries(block, 2):
        entry = block[a + 1 : b]
        for key, c, d in _entries(entry, 4):
            if key == "head":
                heads[ident] = _fields(entry[c + 1 : d], 6)
            elif key == "replies":
                items, current = [], []
                for line in entry[c + 1 : d]:
                    if line.lstrip().startswith("- "):
                        if current:
                            items.append(_fields(current, 6))
                        current = [line.replace("- ", "  ", 1)]
                    else:
                        current.append(line)
                if current:
                    items.append(_fields(current, 6))
                replies[ident] = items
    # The words each comment is on, from the marks in the document, in order.
    order, open_marks, on = [], {}, {}
    plain = []
    position = 0
    for mark in MARK.finditer(body):
        plain.append(body[position : mark.start()])
        position = mark.end()
        kind, ident = mark.group(1), mark.group(2)
        if kind == "begin":
            open_marks[ident] = len("".join(plain))
            order.append(ident)
        elif ident in open_marks:
            on[ident] = "".join(plain)[open_marks.pop(ident) :]
    found = []
    for ident in order:
        head = heads.get(ident, {})
        words = re.sub(r"\s+", " ", on.get(ident) or head.get("quote", "")).strip()
        words = re.sub(r"[*#`]+", "", words).strip()
        found.append(
            {
                "id": ident,
                "author": head.get("author", ""),
                "on": words,
                "text": head.get("body", ""),
                "replies": [reply.get("body", "") for reply in replies.get(ident, [])],
            }
        )
    return found


def comments(path: Path) -> list[dict[str, str]]:
    """Every comment of the document: its id, who wrote it, the words it is on, and
    its text, in the document's order."""
    if path.suffix.lower() == ".md":
        return markdown_comments(path.read_text(encoding="utf-8"))
    with zipfile.ZipFile(path) as archive:
        texts = comment_texts(archive)
        found = []
        for ident, words in anchors(archive):
            # An anchor whose comment was deleted stays in some exports: nothing to read.
            if ident not in texts:
                continue
            author, text = texts[ident]
            found.append({"id": ident, "author": author, "on": words, "text": text})
        return found


def markdown(found: list[dict[str, str]]) -> str:
    if not found:
        return "No comments.\n"
    lines = []
    for index, comment in enumerate(found, 1):
        who = f" — {comment['author']}" if comment["author"] else ""
        lines += [
            f"{index}. On «{comment['on']}»{who}:",
            "",
            *(f"   {line}" for line in comment["text"].splitlines()),
            *(f"   > {reply}" for reply in comment.get("replies", []) if reply),
            "",
        ]
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    print(markdown(comments(Path(sys.argv[1]))), end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
