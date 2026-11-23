#!/usr/bin/env python3
"""Each level and each story on a scene (D65, D74), as the page reads it: a
level's level.json with the scene's map built in, the wizard's S at its start
and the E at its end; a story's story.json with its staging checked against the
scene and the world it is played in under `world`; on a painted scene, each
says so in `art` (D76). A story that goes on from the one before it with nothing
between (`continues`, D320) is held to the chapters' items and to that story.
Printed as a JSON object, {"levels": {id: level.json}, "stories": {id:
story.json}}; pack-world.mjs
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


def sitters(content: Path = CONTENT) -> frozenset[str]:
    """The figures whose sheets have the sitting rows (D273), which a story may seat and
    stand up (D279)."""
    path = content / "art" / "figures" / "figures.json"
    sheets = json.loads(path.read_text(encoding="utf-8")).get("sheets", {})
    return frozenset(name for name, sheet in sheets.items() if "sit" in sheet)


def scene_maps(content: Path = CONTENT) -> dict[str, dict[str, dict]]:
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world.level import (
        Level,
        LevelError,
        on_scene,
        read_scene,
        story_continues,
        story_on_scenes,
    )

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
            data,
            lambda scene, data=data: read_scene(content / "scenes", scene, data.get("id")),
            sitters(content),
        )
        story["world"] = with_art(story["world"], data["scene"], content)
        # A story told on several scenes in turn has each part's world on its own (39.4).
        for part in story.get("parts", []):
            part["world"] = with_art(part["world"], part["scene"], content)
        stories[data["id"]] = story
    # A story that goes on from the one before it with nothing between (D320), held to
    # the chapters' items and to that story's last part.
    told = {}
    for path in (content / "stories").glob("*/story.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        told[data["id"]] = data
    chapters = [
        json.loads(path.read_text(encoding="utf-8")).get("items", [])
        for path in sorted((content / "chapters").glob("*/chapter.json"))
    ]
    for story_id, data in told.items():
        if "continues" not in data:
            continue
        earlier = told.get(data["continues"])
        if earlier is None:
            raise LevelError(f"{story_id} continues {data['continues']}, which is no story")
        story_continues(earlier, data, chapters)
    return {"levels": levels, "stories": stories}


if __name__ == "__main__":
    print(json.dumps(scene_maps(), indent=2, ensure_ascii=False))
