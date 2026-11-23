"""Chapter 5's figures and sprites hold what the page reads of them (D273): the fourteen
familiars' walking sheets, half a child's height, each figure of the right-facing row
the left-facing one turned over; Orla's sheet and Rinlo's sitting rows; the thread's and
the trail's sprites, lying; the hall's plates' light whole (D287) and their figures
dark (D304)."""

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


#: The middle of each plate on the hall's grounds, in pixels, measured on ground.webp.
PLATES = {"moon": (625, 428), "sun": (1297, 427), "star": (1297, 979)}


def dark_in(grey: np.ndarray, x: int, y: int) -> float:
    """The share of a plate's middle well darker than its brass: its engraving."""
    yy, xx = np.mgrid[0 : grey.shape[0], 0 : grey.shape[1]]
    middle = grey[(xx - x) ** 2 + (yy - y) ** 2 < 30**2]
    return float((middle < 0.6 * np.median(middle)).mean())


def test_the_sun_s_and_the_star_s_figures_read_as_clearly_as_the_moon_s():
    """D304: on both grounds the engraving on the sun's and the star's plate is as dark
    on its brass as the moon's."""
    hall = CONTENT / "art" / "scenes" / "the-tower-hall"
    for ground in ("ground.webp", "ground-sunset.webp"):
        grey = np.array(Image.open(hall / ground).convert("L")).astype(float)
        moon = dark_in(grey, *PLATES["moon"])
        assert moon > 0.05, ground
        assert dark_in(grey, *PLATES["sun"]) >= moon, ground
        assert dark_in(grey, *PLATES["star"]) >= moon, ground


def test_the_forgotten_room_s_side_door_rests_shut_and_opens_in_two_pieces():
    """D289: the story's door rests closed, its closed state draws nothing; open, its leaf
    stands on the landing beside the wall, as high as the shut door, on row 3, and its
    doorway lies on the floor, covering the whole of the shut door; the block at the
    doorway's foot is drawn over whoever crosses it, drawn on the doorway's middle with
    its feet on the middle of the cell below; on the landing, a figure is drawn with its
    feet below the leaf's foot."""
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
    crossing = next(part for part in art["lowered"] if part["cells"] == [[2, 3], [5, 3]])
    assert 4.4 <= 3 + 0.8 + crossing["by"] <= 4.6
    # The landing as low as the doorway, the figure going down once (D307).
    assert 3 + 0.8 + crossing["by"] > leaf[3]
    assert not any("leaf" in part for part in art["nudged"] + art["lowered"])
    assert any(row["image"] == "row-4-static.webp" for row in art["rows"])


def test_the_tunnel_and_the_arch_are_walked_behind_their_walls():
    """D307: the hall's tunnel (14, 1)-(14, 3) and the passage's last stairs (2, 9)-(2, 11)
    are walked by a story alone, and each opening has a cover on its row, cut from the
    painting less the opening, not over, at every hour of the scene."""
    for scene, cells, row in (
        ("the-tower-hall", [(14, 1), (14, 2), (14, 3)], 3),
        ("the-tower-passage", [(2, 9), (2, 10), (2, 11)], 12),
    ):
        rows = (CONTENT / "scenes" / scene / "map.txt").read_text(encoding="utf-8").splitlines()
        terrains = json.loads((CONTENT / "scenes" / scene / "scene.json").read_text())["terrains"]
        for x, y in cells:
            assert terrains[rows[y][x]]["walk"] == "story", (scene, x, y)
        art = json.loads((CONTENT / "art" / "scenes" / scene / "art.json").read_text())
        covers = [
            r for r in art["rows"] if r["row"] == row and r.get("static") and not r.get("over")
        ]
        assert len(covers) == 1, scene
        assert (CONTENT / "art" / "scenes" / scene / covers[0]["image"]).is_file()
        for image in covers[0].get("hours", {}).values():
            assert (CONTENT / "art" / "scenes" / scene / image).is_file()
