#!/usr/bin/env python3
"""Each level and each story on a scene (D65, D74), as the page reads it: a
level's level.json with the scene's map built in, the wizard's S at its start
and the E at its end; a story's story.json with its staging checked against the
scene and the world it is played in under `world`; on a painted scene, each
says so in `art` (D76). Printed as a JSON object,
{"levels": {id: level.json}, "stories": {id: story.json}}; pack-world.mjs
writes each into public/content/, so that the page loads a level on a scene as
any other, and a story with its world ready.

    tools/scene_maps.py
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"


def with_art(built: dict, scene_id: str, content: Path) -> dict:
    """A level's or story's world, told the scene it is on when that scene is painted
    (D76): the page then draws content/art/scenes/<scene>/ instead of placeholders."""
    if (content / "art" / "scenes" / scene_id / "art.json").is_file():
        return {**built, "art": scene_id}
    return built


def scene_maps(content: Path = CONTENT) -> dict[str, dict[str, dict]]:
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world.level import Level, on_scene, read_scene, story_on_scenes

    levels = {}
    for path in sorted((content / "levels").glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if "scene" not in data:
            continue
        # Read as the world reads it, so that a level badly placed fails here too.
        Level.from_directory(path.parent)
        levels[data["id"]] = with_art(
            on_scene(data, read_scene(content / "scenes", data["scene"], data["id"])),
            data["scene"],
            content,
        )
    stories = {}
    for path in sorted((content / "stories").glob("*/story.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        story = story_on_scenes(
            data, lambda scene, data=data: read_scene(content / "scenes", scene, data.get("id"))
        )
        story["world"] = with_art(story["world"], data["scene"], content)
        # A story told on several scenes in turn has each part's world on its own (39.4).
        for part in story.get("parts", []):
            part["world"] = with_art(part["world"], part["scene"], content)
        stories[data["id"]] = story
    return {"levels": levels, "stories": stories}


if __name__ == "__main__":
    print(json.dumps(scene_maps(), indent=2, ensure_ascii=False))
