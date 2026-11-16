#!/usr/bin/env python3
"""Each chapter's card for the map (D193): a band across its first level's scene, cut from
the scene's painted ground and made small, content/art/chapters/<chapter>/card.webp.

    tools/art/chapter_cards.py

Run it again when a chapter's first level, or its scene's painting, changes.
"""

import json
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
CONTENT = REPO / "content"
#: The card's size in pixels, twice what the map shows, and the band's middle as a share
#: of the ground's height.
SIZE = (1120, 280)
MIDDLE = 0.45


def first_scene(chapter: dict) -> str | None:
    """The scene of the chapter's first level."""
    for item in chapter["items"]:
        kind, _, item_id = item.partition(":")
        if kind == "level":
            level = json.loads((CONTENT / "levels" / item_id / "level.json").read_text())
            return level.get("scene")
    return None


def card(chapter_dir: Path) -> Path | None:
    chapter = json.loads((chapter_dir / "chapter.json").read_text())
    scene = first_scene(chapter)
    ground = CONTENT / "art" / "scenes" / str(scene) / "ground.webp"
    if scene is None or not ground.is_file():
        return None
    image = Image.open(ground).convert("RGB")
    width = image.width
    height = round(width * SIZE[1] / SIZE[0])
    top = max(0, min(image.height - height, round(image.height * MIDDLE - height / 2)))
    band = image.crop((0, top, width, top + height)).resize(SIZE, Image.LANCZOS)
    out = CONTENT / "art" / "chapters" / chapter["id"] / "card.webp"
    out.parent.mkdir(parents=True, exist_ok=True)
    band.save(out, quality=78, method=6)
    return out


def main() -> int:
    for chapter_dir in sorted((CONTENT / "chapters").iterdir()):
        if (chapter_dir / "chapter.json").is_file():
            made = card(chapter_dir)
            print(made.relative_to(REPO) if made else f"{chapter_dir.name}: no scene painted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
