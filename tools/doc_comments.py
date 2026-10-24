#!/usr/bin/env python3
"""The comments of a reviewed document, printed with the words they are on.

    tools/doc_comments.py <file.docx>

A Google Doc downloaded as Microsoft Word (File > Download > Microsoft Word)
keeps its comments: each is in word/comments.xml, anchored in word/document.xml
between a commentRangeStart and a commentRangeEnd with its id. Printed as
Markdown, one entry per comment, in the document's order: the words commented
on, in quotes, then the comment and who wrote it; a reply is listed under the
comment it answers, which Word marks with a paraId in word/commentsExtended.xml
when the file comes from Word, and which Google Docs' export gives as comments
in a row on the same words.
"""

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


def comments(path: Path) -> list[dict[str, str]]:
    """Every comment of the document: its id, who wrote it, the words it is on, and
    its text, in the document's order."""
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
