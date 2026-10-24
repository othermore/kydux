#!/usr/bin/env python3
"""The names a wizard may not take (D61): the story's characters and spells, every
password, every name the child's code knows a thing or an actor by, the roles
and the wizard itself. Printed as a JSON list, in small letters; pack-world.mjs
writes it as public/reserved.json for the creator.

    tools/reserved_names.py
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
STORY = REPO / "docs" / "dev" / "story.md"
LEVELS = REPO / "content" / "levels"


def reserved() -> list[str]:
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world import api, level

    names = {"wizard", *api.MEMBERS, *level.ACTOR_KINDS, *level.THING_KINDS, *level.KNOWN_SPELLS}
    story = STORY.read_text(encoding="utf-8")
    # The ids of the tables of characters and of spells, | `id` | ..., and the
    # characters' names beside them, a single word with a capital.
    names.update(re.findall(r"^\| `([a-z]+)` \|", story, re.MULTILINE))
    names.update(re.findall(r"^\| `[a-z]+` \| ([A-Z][a-z]+) \|", story, re.MULTILINE))
    # The passwords the bible names, in bold code.
    names.update(re.findall(r"\*\*`([a-z]+)`\*\*", story))
    for path in sorted(LEVELS.glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for item in [*data.get("things", []), *data.get("actors", [])]:
            names.add(item["id"])
            if isinstance(item.get("password"), str):
                names.add(item["password"])
        names.update(data.get("spells", []))
    return sorted({name.lower() for name in names})


if __name__ == "__main__":
    print(json.dumps(reserved(), indent=2))
