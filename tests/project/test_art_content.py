"""A painted scene and the levels on it hold together (D79): nothing of the painting
stands on a cell the map lets one walk on, and no level puts its start, its mark,
its things or its friend where a cut-out covers them."""

import json

import numpy as np
import pytest
from conftest import REPO
from PIL import Image

CONTENT = REPO / "content"
SCENES = sorted(p.parent.name for p in (CONTENT / "art" / "scenes").glob("*/art.json"))
#: How much of a cell's middle a cut-out may cover before the cell counts as hidden,
#: and how much of its lower half before something counts as standing on it.
HIDDEN = 0.08
STANDS = 0.2


def rows_of(scene: str) -> tuple[dict, dict[int, np.ndarray]]:
    """The scene's art, and each row's cut-outs as a mask over the whole scene."""
    folder = CONTENT / "art" / "scenes" / scene
    art = json.loads((folder / "art.json").read_text(encoding="utf-8"))
    cell = art["cell"]
    width, height = art["size"]
    masks = {}
    for row in art["rows"]:
        # What is drawn over whoever stands on its row, and what hangs on a wall,
        # stands on no cell (D95).
        if row.get("under") or row.get("hangs") or row.get("over"):
            continue
        image = np.array(Image.open(folder / row["image"]).convert("RGBA"))
        mask = np.zeros((height * cell, width * cell), dtype=bool)
        mask[row["top"] : row["top"] + image.shape[0], : image.shape[1]] = image[..., 3] > 128
        # A row's things and its static things are two images of the same row (D89).
        masks[row["row"]] = masks.get(row["row"], False) | mask
    return art, masks


def part(mask: np.ndarray, cell: int, x: int, y: int, top: float, bottom: float) -> float:
    """How much of a band of the cell (x, y) the mask covers, the cell's sides left out."""
    side = int(cell * 0.2)
    band = mask[
        y * cell + int(cell * top) : y * cell + int(cell * bottom),
        x * cell + side : (x + 1) * cell - side,
    ]
    return float(band.mean()) if band.size else 0.0


def walked(scene: str) -> set[tuple[int, int]]:
    rows = (CONTENT / "scenes" / scene / "map.txt").read_text(encoding="utf-8").split()
    terrains = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text(encoding="utf-8"))[
        "terrains"
    ]
    walks = {letter for letter, terrain in terrains.items() if terrain.get("walk")} | {"."}
    return {(x, y) for y, row in enumerate(rows) for x, char in enumerate(row) if char in walks}


@pytest.mark.parametrize("scene", SCENES)
def test_nothing_of_the_painting_stands_on_a_cell_walked_on(scene):
    art, masks = rows_of(scene)
    standing = [
        cell
        for cell in sorted(walked(scene))
        if cell[1] in masks and part(masks[cell[1]], art["cell"], *cell, 0.45, 1.0) > STANDS
    ]
    assert not standing, f"{scene}: something of the painting stands on {standing}"


def levels_on(scene: str) -> list[dict]:
    found = []
    for path in sorted((CONTENT / "levels").glob("*/level.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("scene") == scene:
            found.append(data)
    return found


@pytest.mark.parametrize("scene", SCENES)
def test_a_level_s_start_mark_things_and_friend_are_never_hidden(scene):
    art, masks = rows_of(scene)
    hidden = []
    for level in levels_on(scene):
        cells = {"start": level["start"]}
        if "end" in level:
            cells["mark"] = level["end"]
        for thing in level.get("things", []):
            # A door is in its wall, a thing lying on a stone is drawn over it, and a
            # thing the level hides lies under a cut-out on purpose (D85).
            if (
                "kind" in thing
                and thing["kind"] != "door"
                and "at" in thing
                and not thing.get("hidden")
            ):
                cells[thing["id"]] = thing["at"]
        for actor in level.get("actors", []):
            # A pupil asleep lies in its bed, under its quilt (D97).
            if "asleep" not in actor:
                cells[actor["id"]] = actor["at"]
        for what, (x, y) in cells.items():
            if what in art["things"]:
                continue
            front = max(
                (part(m, art["cell"], x, y, 0.15, 0.85) for row, m in masks.items() if row > y),
                default=0.0,
            )
            if front > HIDDEN:
                hidden.append(f"{level['id']}: its {what} at {x},{y}")
    assert not hidden, f"{scene}: hidden by a cut-out: " + "; ".join(hidden)


@pytest.mark.parametrize("scene", SCENES)
def test_every_bed_of_the_scene_has_its_pillow_and_its_quilt(scene):
    """A pupil asleep lies with its head on the bed's pillow, under its quilt (D91):
    every bed the scene holds has its place in the art, beside the bed's tile, and
    its quilt is a static row."""
    art = json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text())
    spec = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())
    beds = {t["id"]: t["at"] for t in spec.get("things", []) if t.get("kind") == "bed"}
    places = art.get("beds", {})
    assert set(places) == set(beds), scene
    statics = {row["row"] for row in art["rows"] if row.get("static")}
    for bed, (x, y) in beds.items():
        place = places[bed]
        assert place["row"] in statics, bed
        hx, hy = place["head"]
        # The pillow lies along the bed's own row, a cell or more from its tile.
        assert abs(hy - (y + 0.5)) < 1.5 and 1 <= abs(hx - (x + 0.5)) < 4, bed
        assert place["toward"] == ("right" if hx > x + 0.5 else "left"), bed
