"""Chapter 5's figures and sprites hold what the page reads of them (D273): the fourteen
familiars' walking sheets, half a child's height, each figure of the right-facing row
the left-facing one turned over; Orla's sheet and Rinlo's sitting rows; the thread's and
the trail's sprites, lying; and the hall's plates' light whole (D287)."""

import json
import sys

import numpy as np
from conftest import REPO
from PIL import Image

sys.path.insert(0, str(REPO / "tools" / "art"))
import figures  # noqa: E402

CONTENT = REPO / "content"
FIGURES = CONTENT / "art" / "figures"
ABOUT = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
#: The kinds of the first year and their colours (D260), the friend's grey hare among
#: them: fourteen creatures.
FAMILIARS = {
    "fox": ("red", "white", "black"),
    "crow": ("black", "white"),
    "bat": ("black", "white"),
    "hare": ("brown", "white", "grey"),
    "mouse": ("brown", "white"),
    "frog": ("green", "red"),
}


def frames(name: str) -> np.ndarray:
    """A sheet's alpha, as [row][column] frames."""
    width, height = ABOUT["frame"]
    alpha = np.array(Image.open(FIGURES / f"{name}.webp").convert("RGBA"))[..., 3]
    rows = alpha.shape[0] // height
    return alpha.reshape(rows, height, 3, width).transpose(0, 2, 1, 3)


def test_every_familiar_has_its_walking_sheet_listed_for_the_page():
    names = {f"familiar-{kind}-{colour}" for kind, cs in FAMILIARS.items() for colour in cs}
    assert len(names) == 14
    assert set(ABOUT["familiars"]) == names
    assert ABOUT["familiar_height_cells"] == 0.57
    for name in names:
        assert name in ABOUT["figures"]
        assert ABOUT["sheets"][name] == {"walk": 0}
        width, height = ABOUT["frame"]
        assert Image.open(FIGURES / f"{name}.webp").size == (3 * width, 4 * height), name


def test_a_familiar_is_about_half_a_child_and_stands_on_the_foot_line():
    width, height = ABOUT["frame"]
    foot_line = height - ABOUT["foot"]
    cell = ABOUT["cell"]
    for name in ABOUT["familiars"]:
        for row in frames(name):
            for frame in row:
                drawn = np.nonzero((frame > 128).any(axis=1))[0]
                assert drawn.size, name
                # No figure is taller than two thirds of a cell, nor under the foot line.
                assert drawn[-1] - drawn[0] + 1 <= 0.67 * cell, name
                assert drawn[-1] < foot_line + 2, name


def test_a_familiar_s_right_row_is_its_left_row_turned_over():
    ways = ABOUT["ways"]
    left, right = ways.index("left"), ways.index("right")
    for name in ABOUT["familiars"]:
        sheet = frames(name)
        for column in range(3):
            turned = sheet[left][column][:, ::-1].astype(int)
            assert np.abs(turned - sheet[right][column].astype(int)).max() < 40, name


def test_orla_walks_as_a_grown_up_and_rinlo_sits():
    assert "orla" in ABOUT["figures"] and "orla" in ABOUT["adults"]
    assert ABOUT["sheets"]["rinlo"] == {"walk": 0, "sit": 4}
    sheet = frames("rinlo")
    assert sheet.shape[0] == 8
    for row in range(4, 8):
        for frame in sheet[row]:
            assert (frame > 128).any()
    # Sitting, he is lower than standing.
    standing = np.nonzero((sheet[0][1] > 128).any(axis=1))[0]
    sitting = np.nonzero((sheet[4][1] > 128).any(axis=1))[0]
    assert sitting[-1] - sitting[0] < standing[-1] - standing[0]


def test_the_thread_and_the_trail_are_sprites_lying_on_the_floor():
    things = CONTENT / "art" / "things"
    listed = json.loads((things / "things.json").read_text(encoding="utf-8"))
    for kind in ("thread", "trail"):
        sprite = listed[kind]
        assert sprite["lying"] is True
        assert (things / sprite["image"]).is_file()
        width, height = sprite["size"]
        assert 0 < height < width <= 1.0


def test_the_familiars_size_is_the_tool_s():
    assert figures.FAMILIAR_HEIGHT_CELLS == ABOUT["familiar_height_cells"]


def test_each_plate_s_light_is_whole_in_both_lights():
    """D287: a lit plate's picture is as tall as its box, and no edge of it cuts the glow
    on the floor: its top, left and right columns are at alpha 0, and the moon's and the
    sun's bottom rows; the star's bottom is the hall's front wall, which ends its glow."""
    hall = CONTENT / "art" / "scenes" / "the-tower-hall"
    art = json.loads((hall / "art.json").read_text(encoding="utf-8"))
    settings = json.loads((REPO / "art" / "scenes" / "the-tower-hall" / "cut.json").read_text())
    cell = 96
    for plate in ("moon", "sun", "star"):
        box = settings["things"][plate]["box"]
        thing = art["things"][plate]
        assert (thing["left"], thing["top"]) == (round(box[0] * cell), round(box[1] * cell))
        for name in (thing["states"]["lit"], thing["hours"]["sunset"]["lit"]):
            alpha = np.array(Image.open(hall / name).convert("RGBA"))[..., 3]
            assert alpha.shape == (
                round(box[3] * cell) - round(box[1] * cell),
                round(box[2] * cell) - round(box[0] * cell),
            ), name
            assert alpha[0].max() == alpha[:, 0].max() == alpha[:, -1].max() == 0, name
            if plate == "star":
                assert alpha[-1].max() == 255, "the wall ends the star's glow"
            else:
                assert alpha[-1].max() == 0, name


def test_the_forgotten_room_s_side_door_rests_shut_and_opens_in_two_pieces():
    """D289: the story's door rests closed, its closed state draws nothing; open, its leaf
    stands on the landing beside the wall, as high as the shut door, on row 3, and its
    doorway lies on the floor, covering the whole of the shut door; the block at the
    doorway's foot is drawn over whoever crosses it, drawn on the doorway's middle and
    lower; on the landing, a figure is drawn with its feet below the leaf's foot."""
    passage = CONTENT / "art" / "scenes" / "the-tower-passage"
    art = json.loads((passage / "art.json").read_text(encoding="utf-8"))
    door = art["things"]["room_door"]
    assert door["kind"] == "door" and door["rest"] == "closed" and door["at"] == [5, 3]
    assert set(door["states"]) == {"closed", "open"} and door["row"] == 3
    assert set(door["floors"]) == {"open"}
    cell = art["cell"]
    shut = np.array(Image.open(passage / door["states"]["closed"]).convert("RGBA"))[..., 3]
    assert not shut.any()

    def extent(name: str) -> tuple[float, float, float, float]:
        alpha = np.array(Image.open(passage / name).convert("RGBA"))[..., 3]
        ys, xs = np.nonzero(alpha)
        left, top = door["left"], door["top"]
        return (
            (left + xs.min()) / cell,
            (top + ys.min()) / cell,
            (left + xs.max() + 1) / cell,
            (top + ys.max() + 1) / cell,
        )

    leaf = extent(door["states"]["open"])
    assert 3.95 <= leaf[3] <= 4.05 and 2.45 <= leaf[1] <= 2.6
    assert 4.45 <= leaf[0] <= 4.6 and leaf[2] <= 5.6
    doorway = extent(door["floors"]["open"])
    assert doorway[0] >= 5.3 and doorway[3] <= 4.2
    floor = np.array(Image.open(passage / door["floors"]["open"]).convert("RGBA"))[..., 3]
    x0, y0, x1, y1 = (round(v * cell) for v in (5.45, 2.57, 6.0, 4.08))
    covered = floor[y0 - door["top"] : y1 - door["top"], x0 - door["left"] : x1 - door["left"]]
    assert covered.all()
    # Crossing the doorway, a figure is drawn on its middle, lower, its feet behind the
    # block, a row 4 cover; the leaf draws no one away from it.
    assert {"cells": [[5, 3], [5, 3]], "by": 0.25} in [
        {k: v for k, v in part.items() if k in ("cells", "by")} for part in art["nudged"]
    ]
    assert any(part["cells"] == [[5, 3], [5, 3]] and part["by"] == 0.4 for part in art["lowered"])
    landing = next(part for part in art["lowered"] if part["cells"] == [[2, 3], [4, 3]])
    assert 3 + 0.8 + landing["by"] > leaf[3]
    assert not any("leaf" in part for part in art["nudged"] + art["lowered"])
    assert any(row["image"] == "row-4-static.webp" for row in art["rows"])
