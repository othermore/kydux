#!/usr/bin/env python3
"""Each level on a scene (D65), as the page reads it: its level.json with the
scene's map built in, the wizard's S at its start and the E at its end.
Printed as a JSON object of level id to level.json; pack-world.mjs writes each
into public/content/levels/<id>/level.json, so that the page loads a level on a
scene as any other.

    tools/scene_maps.py
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"


def scene_maps() -> dict[str, dict]:
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world.level import Level, on_scene, scene_rows

    built = {}
    for path in sorted((CONTENT / "levels").glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if "scene" not in data:
            continue
        # Read as the world reads it, so that a level badly placed fails here too.
        Level.from_directory(path.parent)
        built[data["id"]] = on_scene(data, scene_rows(CONTENT / "scenes", data))
    return built


if __name__ == "__main__":
    print(json.dumps(scene_maps(), indent=2))
