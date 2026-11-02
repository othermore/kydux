"""The story bible, docs/dev/story.md, names everyone a level lets speak (D45):
a level's `speaker` is the id of a character in its table of characters."""

import json
import re

CHARACTER = re.compile(r"^\| `([a-z]+)` \| ", re.MULTILINE)


def characters(repo_root) -> set[str]:
    story = (repo_root / "docs" / "dev" / "story.md").read_text(encoding="utf-8")
    return set(CHARACTER.findall(story))


def test_the_story_has_its_characters(repo_root):
    found = characters(repo_root)
    assert {"ilda", "orla", "dask", "wenna", "nuri", "zarek", "bimo", "eldra"} <= found


def test_every_speaker_is_a_character_of_the_story(repo_root):
    known = characters(repo_root)
    for path in sorted((repo_root / "content" / "levels").glob("*/level.json")):
        speaker = json.loads(path.read_text(encoding="utf-8")).get("speaker")
        if speaker is not None:
            where = path.parent.name
            # `friend` and `mate` are Nuri or Teku, by the wizard's gender (D77, D84).
            wanted = {"nuri", "teku"} if speaker in ("friend", "mate") else {speaker}
            assert wanted <= known, f"{where}: the speaker {speaker!r} is not in story.md"
