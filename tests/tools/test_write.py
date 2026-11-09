"""The writing tool (tools/write/write.py, D55), with Gemini faked."""

import json
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools" / "write"))

import write  # noqa: E402

BRIEF = """---
outputs:
  - content/lessons/sample/en.md
  - content/lessons/sample/es.md
context:
  - docs/dev/story.md
---
Write a lesson about samples.
"""


def brief(tmp_path: Path, text: str = BRIEF) -> Path:
    path = tmp_path / "sample.md"
    path.write_text(text, encoding="utf-8")
    return path


def test_the_prompt_holds_the_rules_the_context_and_the_brief(tmp_path):
    text, outputs = write.prompt(brief(tmp_path))
    assert "How a text for the child is written" in text
    assert "## docs/dev/story.md" in text
    assert (REPO / "docs/dev/story.md").read_text(encoding="utf-8")[:200] in text
    assert "Write a lesson about samples." in text
    assert outputs == ["content/lessons/sample/en.md", "content/lessons/sample/es.md"]


def test_the_answer_lands_under_drafts_with_its_manifest(tmp_path):
    answer = {
        "content/lessons/sample/en.md": "# Sample\n",
        "content/lessons/sample/es.md": "# Muestra",
    }
    drafts = tmp_path / "drafts"
    written = write.write_drafts(brief(tmp_path), lambda _: json.dumps(answer), drafts)
    assert [p.relative_to(drafts).as_posix() for p in written] == [
        "sample/content/lessons/sample/en.md",
        "sample/content/lessons/sample/es.md",
    ]
    assert (drafts / "sample/content/lessons/sample/es.md").read_text() == "# Muestra\n"
    manifest = json.loads((drafts / "sample/manifest.json").read_text())
    assert manifest["model"] == write.MODEL and manifest["files"] == list(answer)


@pytest.mark.parametrize(
    ("answer", "says"),
    [
        ("not json", "not JSON"),
        ("[]", "not a JSON object"),
        (json.dumps({"content/lessons/sample/en.md": "x"}), "lacks"),
        (
            json.dumps(
                {
                    "content/lessons/sample/en.md": "x",
                    "content/lessons/sample/es.md": "x",
                    "content/levels/other/text.en.json": "x",
                }
            ),
            "did not ask for",
        ),
    ],
)
def test_an_answer_that_is_not_what_was_asked_is_refused(tmp_path, answer, says):
    with pytest.raises(write.BriefError, match=says):
        write.write_drafts(brief(tmp_path), lambda _: answer, tmp_path / "drafts")


def test_a_brief_writes_only_into_content_and_the_developers_docs(tmp_path):
    write.prompt(brief(tmp_path, BRIEF.replace("content/lessons/sample/es.md", "docs/dev/x.md")))
    with pytest.raises(write.BriefError, match="not a path of content"):
        write.prompt(brief(tmp_path, BRIEF.replace("content/lessons/sample/es.md", "ci/check.sh")))
    with pytest.raises(write.BriefError, match="not a path of content"):
        write.prompt(brief(tmp_path, BRIEF.replace("lessons/sample/es.md", "../ci/check.sh")))


def test_every_brief_in_the_repository_can_be_read(tmp_path):
    """Every brief reads on GitHub too, where drafts/ does not exist: no context of
    a brief names a draft (the designer's design documents stay in drafts/)."""
    for path in sorted((REPO / "tools" / "write" / "briefs").glob("*.md")):
        text = path.read_text(encoding="utf-8")
        drafts = [line for line in text.splitlines() if line.strip().startswith("- drafts/")]
        assert not drafts, f"{path.name} names a draft as context: {drafts}"
        write.prompt(path)


def test_the_second_key_is_read_after_the_first(tmp_path, monkeypatch):
    secrets = tmp_path / "secrets.env"
    secrets.write_text("OTHER=x\nGEMINI_API_KEY_2=two\nGEMINI_API_KEY=one\n", encoding="utf-8")
    monkeypatch.setattr(write, "SECRETS", secrets)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY_2", raising=False)
    assert write.api_keys() == ["one", "two"]
    secrets.write_text("GEMINI_API_KEY=one\n", encoding="utf-8")
    assert write.api_keys() == ["one"]
