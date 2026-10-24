"""The comments of a reviewed .docx, read with the words they are on."""

import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
import doc_comments  # noqa: E402

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

DOCUMENT = f"""<?xml version="1.0" encoding="UTF-8"?>
<w:document {W}><w:body>
<w:p><w:r><w:t>Nuri te sonríe. </w:t></w:r>
<w:commentRangeStart w:id="0"/><w:r><w:t>La puerta escucha</w:t></w:r>
<w:commentRangeEnd w:id="0"/>
<w:r><w:t> las instrucciones.</w:t></w:r></w:p>
<w:p><w:commentRangeStart w:id="1"/><w:r><w:t>Camina hacia la puerta.</w:t></w:r>
<w:commentRangeEnd w:id="1"/></w:p>
</w:body></w:document>"""

COMMENTS = f"""<?xml version="1.0" encoding="UTF-8"?>
<w:comments {W}>
<w:comment w:id="0" w:author="othermore">
<w:p><w:r><w:t>Mejor: «La puerta obedece».</w:t></w:r></w:p></w:comment>
<w:comment w:id="1" w:author="othermore">
<w:p><w:r><w:t>Objetivo muy corto;</w:t></w:r></w:p>
<w:p><w:r><w:t>di adónde.</w:t></w:r></w:p></w:comment>
</w:comments>"""


def make_docx(path: Path, with_comments: bool = True) -> Path:
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("word/document.xml", DOCUMENT)
        if with_comments:
            archive.writestr("word/comments.xml", COMMENTS)
    return path


def test_each_comment_comes_with_the_words_it_is_on_in_order(tmp_path):
    found = doc_comments.comments(make_docx(tmp_path / "book.docx"))
    assert [c["on"] for c in found] == ["La puerta escucha", "Camina hacia la puerta."]
    assert found[0]["text"] == "Mejor: «La puerta obedece»."
    assert found[1]["text"] == "Objetivo muy corto;\ndi adónde."
    assert found[1]["author"] == "othermore"


def test_the_markdown_numbers_the_comments(tmp_path):
    text = doc_comments.markdown(doc_comments.comments(make_docx(tmp_path / "book.docx")))
    assert text.startswith(
        "1. On «La puerta escucha» — othermore:\n\n   Mejor: «La puerta obedece».\n"
    )
    assert "2. On «Camina hacia la puerta.»" in text


def test_a_document_without_comments_says_so(tmp_path):
    found = doc_comments.comments(make_docx(tmp_path / "plain.docx", with_comments=False))
    assert found == []
    assert doc_comments.markdown(found) == "No comments.\n"


GDOC_MD = """# Kydux

### <!-- gdoc_comment_begin: c1 -->Historia: La carta<!-- gdoc_comment_end: c1 -->

Algunos caminos son largos. <!-- gdoc_comment_begin: c2 -->Escribir la misma
línea seis veces es lento. Es fácil contar mal.<!-- gdoc_comment_end: c2 -->

Debes estar junto a la puerta
<!-- gdoc_comment_begin: c3 -->y decir exactamente ambrel.<!-- gdoc_comment_end: c3 -->

---
gdoc_comments:
  c1:
    status: ACTIVE
    token: AX5pRSlDIlHmUH
    head:
      author: Reviewer One
      time: '2026-10-23T09:54:43.657Z'
      body: Esto debería ser en pasado. Es decir, el juego debe empezar directamente
        en que estás ante la puerta.
      quote: 'Historia: La carta'
  c2:
    status: ACTIVE
    token: AX5pRSnJFi
    head:
      author: Reviewer One
      time: '2026-10-23T10:05:40.025Z'
      body: Escribir la misma linea seis veces es lento, y te puedes equivocar.
      quote: Escribir la misma l&#237;nea seis veces es lento. Es f&#225;cil contar
        mal.
    replies:
    - author: Reviewer One
      time: '2026-10-23T10:06:01.106Z'
      body: Y los programadores somos vagos.
  c3:
    status: ACTIVE
    token: AX5pRSnY
    head:
      author: Reviewer One
      time: '2026-10-23T10:11:07.772Z'
      body: hay que poner ambrel en cursiva
      quote: |-
        y decir exactamente ambrel.
        Segunda línea
"""


def test_a_markdown_download_gives_each_comment_its_words_and_its_replies(tmp_path):
    path = tmp_path / "book.md"
    path.write_text(GDOC_MD, encoding="utf-8")
    found = doc_comments.comments(path)
    assert [c["id"] for c in found] == ["c1", "c2", "c3"]
    assert found[0]["on"] == "Historia: La carta"
    assert found[0]["text"].startswith(
        "Esto debería ser en pasado. Es decir, el juego debe empezar"
    )
    assert found[1]["on"] == "Escribir la misma línea seis veces es lento. Es fácil contar mal."
    assert found[1]["replies"] == ["Y los programadores somos vagos."]
    assert found[2]["on"] == "y decir exactamente ambrel."
    text = doc_comments.markdown(found)
    assert "   > Y los programadores somos vagos." in text
