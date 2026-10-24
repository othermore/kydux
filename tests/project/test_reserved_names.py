"""The names a wizard may not take (tools/reserved_names.py, D61) hold every name the
story and the levels give: a character's, a spell's, a password, a thing's id."""

import json
import re

import reserved_names
from conftest import REPO


def test_the_reserved_names_hold_the_story_and_the_levels():
    names = set(reserved_names.reserved())
    story = (REPO / "docs" / "dev" / "story.md").read_text(encoding="utf-8")
    for character_id in re.findall(r"^\| `([a-z]+)` \|", story, re.MULTILINE):
        assert character_id in names
    for path in sorted((REPO / "content" / "levels").glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in [*data.get("things", []), *data.get("actors", [])]:
            assert item["id"].lower() in names, f"{path.parent.name}: {item['id']}"
    assert {"wizard", "nuri", "dask", "zelim", "ambrel"} <= names
    assert all(name == name.lower() for name in names)
