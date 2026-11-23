"""The portraits (D194): every character a lesson, a story or a level makes speak has one,
the friend and the dormitory mate both ways, and so has every look of the wizard; each is
a square of 512 pixels with a clear background."""

import json
import re
from pathlib import Path

import pytest
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
CONTENT = REPO / "content"
PORTRAITS = CONTENT / "art" / "portraits"
#: The characters D194 names, each with a portrait whether or not a text has them speak yet.
CHARACTERS = {
    "ilda",
    "orla",
    "dask",
    "wenna",
    "nuri",
    "teku",
    "zarek",
    "baro",
    "eldra",
    "rinlo",
    "bimo",
}


def speakers() -> set[str]:
    found = set()
    for path in (CONTENT / "lessons").glob("*/lesson.json"):
        found.add(json.loads(path.read_text()).get("speaker"))
    for path in (CONTENT / "levels").glob("*/level.json"):
        found.add(json.loads(path.read_text()).get("speaker"))
    for path in (CONTENT / "stories").glob("*/story.json"):
        story = json.loads(path.read_text())
        found.add(story.get("speaker"))
        found |= {step.get("who") for step in story["steps"]}
    # The voice is no one, and the cold voice is heard and never seen (D264).
    found -= {None, "voice", "wizard", "cold_voice"}
    # The friend and the mate are Nuri or Teku, as the wizard's gender makes them.
    if found & {"friend", "mate"}:
        found = (found - {"friend", "mate"}) | {"nuri", "teku"}
    return found


def looks() -> list[str]:
    text = (REPO / "app" / "src" / "engine" / "looks.ts").read_text()
    return re.findall(r"id: '(\w+)'", text.split("export const LOOKS")[1].split("];")[0])


@pytest.mark.parametrize("who", sorted(speakers() | CHARACTERS))
def test_every_character_who_speaks_has_a_portrait(who):
    assert (PORTRAITS / f"{who}.webp").is_file(), f"no portrait of {who}"


@pytest.mark.parametrize("look", looks())
def test_every_look_has_its_portrait(look):
    assert (PORTRAITS / f"wizard-{look}.webp").is_file()


def test_a_portrait_is_a_square_of_512_with_a_clear_background():
    for path in PORTRAITS.glob("*.webp"):
        picture = Image.open(path).convert("RGBA")
        assert picture.size == (512, 512), path.name
        assert picture.getpixel((0, 0))[3] == 0, path.name
