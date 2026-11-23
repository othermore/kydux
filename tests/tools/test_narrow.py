"""tools/art/narrow.py: a passage narrower than a cell (D273), its trench squeezed onto
the middle of its cells by a warp, its flaps' outline, a painted grid line taken out;
and the sweep that stands a familiar on the cells only a familiar walks on."""

import sys
from pathlib import Path

import numpy as np

ART = Path(__file__).resolve().parents[2] / "tools" / "art"
sys.path.insert(0, str(ART))
import narrow  # noqa: E402
import sweep  # noqa: E402


def test_the_warp_draws_a_trench_narrow_round_its_middle_and_keeps_the_far_parts():
    # A trench painted from 100 to 200 goes to 30 pixels round 160; 50 pixels of
    # masonry beside it are stretched, and what lies farther stays.
    shown = narrow.squeezed_axis(400, [(100, 200, 160)], wide=30, margin=50)
    assert shown[0] == 0 and shown[399] == 399
    assert shown[30] == 30 and shown[370] == 370
    assert abs(shown[145] - 100) < 1 and abs(shown[175] - 200) < 1
    # Inside the narrow trench, the whole painted trench is shown, in order.
    inside = shown[146:175]
    assert np.all(np.diff(inside) > 0) and inside[0] > 100 and inside[-1] < 200


def test_a_squeezed_picture_shows_its_trench_narrower_on_its_middle():
    picture = np.full((60, 400, 3), 120, dtype=np.float32)
    picture[:, 100:200] = 230  # a light trench a hundred pixels wide
    sx = np.repeat(narrow.squeezed_axis(400, [(100, 200, 160)], 30, 50)[None, :], 60, axis=0)
    sy = np.repeat(np.arange(60, dtype=np.float32)[:, None], 400, axis=1)
    out = narrow.sample(picture, sx, sy)[30, :, 0]
    light = np.nonzero(out > 200)[0]
    assert light.size and abs(light.min() - 145) <= 2 and abs(light.max() - 175) <= 2


def test_a_flap_is_a_rectangle_with_a_round_top():
    mask = np.array(narrow.arch((0, 0, 40, 60)))
    assert mask[59, 0] == 255 and mask[59, 39] == 255  # its foot is square
    assert mask[0, 0] == 0 and mask[0, 20] == 255  # its top is round


def test_a_painted_grid_line_is_taken_out_with_what_lies_beside_it():
    picture = np.zeros((400, 200, 3), dtype=np.float32)
    picture[..., 0] = np.linspace(40, 80, 200)[None, :]
    picture[:, 98:103] = 250  # a light line down the picture
    narrow.erase(picture, 100)
    assert picture[:, 90:110].max() < 100


def test_the_sweep_tells_the_cells_only_a_familiar_walks_on():
    walked = sweep.walks("the-tower-passage")
    small = sweep.walks("the-tower-passage", small=True)
    assert small[12, 10] and small[8, 11] and small[4, 13]
    assert not walked[12, 10] and walked[13, 10]
    assert not (walked & small).any()


def test_the_sweep_counts_the_cells_only_a_story_walks_on_among_those_walked():
    """D288, D307: the landing, the back stairs down to the arch and the floor before the
    room's crates."""
    walked = sweep.walks("the-tower-passage")
    landing = [(x, 3) for x in range(2, 8)] + [(2, y) for y in range(4, 12)]
    assert all(walked[y, x] for x, y in landing)
    assert walked[12, 2] and not walked[11, 1] and not walked[11, 3]
    assert not walked[3, 14] and not walked[2, 6]
    # The corridor's two rows, the cell under the arch, the room's floor, and the story's.
    assert int(walked.sum()) == 36 + 1 + 9 + 14
