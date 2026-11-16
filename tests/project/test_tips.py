"""The tips shown while a screen loads (D221): every tip has its picture in every
language, 960 by 540 and light (D239), made by app/e2e/tips-pictures.spec.ts from the
game's own page."""

import json
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
TIPS = REPO / "content" / "tips"
#: The pictures' size, and the most one weighs.
SIZE = (960, 540)
MOST_BYTES = 90_000


def languages() -> dict[str, dict]:
    return {
        path.stem: json.loads(path.read_text(encoding="utf-8"))
        for path in sorted((REPO / "i18n").glob("*.json"))
    }


def test_every_tip_has_its_picture_in_every_language_small():
    found = languages()
    assert len(found) > 1
    for lang, catalog in found.items():
        for key in catalog["tips"]:
            picture = TIPS / lang / f"{key}.webp"
            assert picture.is_file(), f"{lang}: no picture for the tip {key}"
            assert picture.stat().st_size < MOST_BYTES, f"{lang}/{key} weighs too much"
            assert Image.open(picture).size == SIZE, f"{lang}/{key}"


def test_no_picture_is_for_a_tip_that_is_not():
    found = languages()
    for folder in TIPS.iterdir():
        assert folder.name in found, folder.name
        keys = set(found[folder.name]["tips"])
        assert {picture.stem for picture in folder.glob("*.webp")} <= keys, folder.name
