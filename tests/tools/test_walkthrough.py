"""The walkthrough's document (tools/walkthrough.py): it says each stop in Marta's words,
with a comments line under every picture, and never overwrites a file the owner may have
written in."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tools"))
import walkthrough  # noqa: E402


def small_repo(tmp_path: Path) -> Path:
    content = tmp_path / "content"
    (content / "chapters" / "03-test").mkdir(parents=True)
    (content / "chapters" / "03-test" / "chapter.json").write_text(
        json.dumps({"items": ["story:s", "lesson:l", "level:v"]})
    )
    (content / "chapters" / "03-test" / "text.es.json").write_text(json.dumps({"title": "Prueba"}))
    (content / "stories" / "s").mkdir(parents=True)
    (content / "stories" / "s" / "story.json").write_text(
        json.dumps({"scene": "a-scene", "steps": [{"who": "friend"}]})
    )
    (content / "stories" / "s" / "text.es.json").write_text(
        json.dumps({"title": "Historia", "steps": ["Hola, {wizard}, {cansado|cansada}."]})
    )
    (content / "lessons" / "l").mkdir(parents=True)
    (content / "lessons" / "l" / "es.md").write_text("# Lección\n\nUna.\n\n---\n## Otra\n\nDos.\n")
    (content / "levels" / "v").mkdir(parents=True)
    (content / "levels" / "v" / "level.json").write_text(
        json.dumps({"scene": "a-scene", "start": [1, 2], "end": [3, 4], "ways": [{"id": "w"}]})
    )
    (content / "levels" / "v" / "solution.py").write_text("wizard.wait()\n")
    (content / "levels" / "v" / "text.es.json").write_text(
        json.dumps(
            {
                "title": "Nivel",
                "goals": ["Llega."],
                "intro": "Mira, {friend}.",
                "outro": "Ya.",
                "ways": {"w": "Una manera"},
            }
        )
    )
    shots = tmp_path / "app" / "e2e" / "shots" / "walkthrough-03-test"
    shots.mkdir(parents=True)
    for name in (
        "story-s-01.png",
        "lesson-l-01.png",
        "lesson-l-02.png",
        "level-v-00-tarjeta.png",
        "level-v-01-inicio.png",
        "level-v-w-tick-00.png",
        "level-v-w-ganado.png",
    ):
        (shots / name).write_bytes(b"png")
    return tmp_path


def test_the_document_says_each_stop_with_a_comments_line_under_each_picture(tmp_path):
    repo = small_repo(tmp_path)
    path = walkthrough.write_document("03-test", repo, day="2026-11-07")
    assert path.name == "recorrido-capitulo-3-2026-11-07.es.md"
    text = path.read_text(encoding="utf-8")
    assert "Hola, Marta, cansada." in text and "Mira, Teku." in text
    assert "### Manera: Una manera (`w`)" in text
    assert text.count("![") == 7 and text.count("**Comentarios:**") == 7 + 1
    assert (path.parent / path.name.removesuffix(".es.md") / "story-s-01.png").is_file()


def test_a_document_the_owner_may_have_written_in_is_never_overwritten(tmp_path):
    repo = small_repo(tmp_path)
    first = walkthrough.write_document("03-test", repo, day="2026-11-07")
    first.write_text("**Comentarios:** lo que el dueño ha escrito\n", encoding="utf-8")
    second = walkthrough.write_document("03-test", repo, day="2026-11-07")
    assert second != first and second.name == "recorrido-capitulo-3-2026-11-07-2.es.md"
    assert "lo que el dueño ha escrito" in first.read_text(encoding="utf-8")
