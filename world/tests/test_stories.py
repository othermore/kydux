"""A story staged on its scene (D74): the world it is played in, and a staging
that does not fit the scene refused with the reason."""

import pytest
from kydux_world.level import DEFAULT_TERRAINS, LevelError, Scene, story_on_scene

TERRAINS = {
    **DEFAULT_TERRAINS,
    "g": {"kind": "grass", "walk": True, "sight": True},
    "f": {"kind": "fence", "walk": False, "sight": True},
}
YARD = Scene(
    "yard",
    ("#######", "#ggggg#", "#gfggg#", "#ggggg#", "#######"),
    TERRAINS,
    ({"kind": "door", "id": "gate", "at": [5, 2], "password": "ambrel"},),
)


def staged(**change):
    data = {
        "id": "a-story",
        "scene": "yard",
        "wizard": [1, 1],
        "camera": [3, 2],
        "actors": [{"id": "nuri", "kind": "friend"}],
        "steps": [
            {"who": "voice", "do": None},
            {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
            {"who": "nuri", "do": {"walk": [2, 1]}},
            {"who": "wizard", "do": {"face": "right"}},
            {"who": "nuri", "do": {"vanish": True}},
        ],
    }
    data.update(change)
    return story_on_scene(data, YARD)


def test_a_story_comes_with_the_world_it_is_played_in():
    story = staged()
    world = story["world"]
    assert world["map"][1] == "#S....#"
    assert world["terrain"][2] == "#gfggg#"
    assert world["things"][0]["id"] == "gate"
    # An actor who appears is out of sight until then, where it first appears;
    # no one watches for the wizard.
    assert world["actors"] == [
        {"id": "nuri", "kind": "friend", "at": [5, 1], "hidden": True, "sight": 0}
    ]
    assert story["camera"] == [3, 2]
    assert [step["who"] for step in story["steps"]][:2] == ["voice", "voice"]
    assert "wizard" not in story and "actors" not in story


@pytest.mark.parametrize(
    ("steps", "says"),
    [
        ([{"who": "nuri", "do": None}], "nuri speaks out of sight"),
        ([{"who": "voice", "do": {"walk": [3, 1]}}], "done by no one"),
        ([{"who": "eldra", "do": None}], "eldra is no one"),
        ([{"who": "wizard", "do": {"walk": [3, 3]}}], "straight line"),
        (
            [{"who": "wizard", "do": {"walk": [1, 3]}}, {"who": "wizard", "do": {"walk": [5, 3]}}],
            "",
        ),
        ([{"who": "wizard", "do": {"walk": [1, 4]}}], "stopped at 1,4"),
        ([{"who": "wizard", "do": {"jump": [1, 2]}}], "do is one of"),
        ([{"who": "wizard", "do": {"face": "north"}}], "face is one of"),
        ([{"who": "wizard", "do": {"vanish": True}}], "stays in the story"),
        ([{"who": "voice", "do": None, "by": "nuri"}], "there is none"),
    ],
)
def test_a_staging_that_does_not_fit_says_why(steps, says):
    if not says:
        # Two straight walks round the corner fit.
        staged(steps=steps, actors=[])
        return
    with pytest.raises(LevelError, match=says):
        staged(steps=steps)


def test_a_walk_stops_at_a_fence_a_shut_door_and_another_figure():
    fence = [{"who": "wizard", "do": {"walk": [1, 2]}}, {"who": "wizard", "do": {"walk": [3, 2]}}]
    with pytest.raises(LevelError, match="stopped at 2,2"):
        staged(steps=fence, actors=[])
    door = [{"who": "wizard", "do": {"walk": [1, 2]}}]
    staged(steps=door, actors=[])
    with pytest.raises(LevelError, match="stopped at 5,2"):
        staged(
            actors=[],
            wizard=[4, 1],
            steps=[
                {"who": "wizard", "do": {"walk": [4, 2]}},
                {"who": "wizard", "do": {"face": "right"}},
                {"who": "wizard", "do": {"walk": [5, 2]}},
            ],
        )
    # An open gate is walked through.
    staged(
        actors=[],
        wizard=[4, 2],
        things=[{"id": "gate", "open": True}],
        steps=[{"who": "wizard", "do": {"walk": [5, 2]}}],
    )
    with pytest.raises(LevelError, match="stopped at 3,1"):
        staged(
            actors=[{"id": "nuri", "kind": "friend", "at": [3, 1]}],
            steps=[{"who": "wizard", "do": {"walk": [4, 1]}}],
        )


def test_an_actor_never_seen_or_seen_twice_is_an_error():
    with pytest.raises(LevelError, match="never appears"):
        staged(steps=[{"who": "voice", "do": None}])
    twice = [
        {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
        {"who": "voice", "do": {"appear": [5, 3]}, "by": "nuri"},
    ]
    with pytest.raises(LevelError, match="already in sight"):
        staged(steps=twice)
