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


#: A room with two beds in it, for the figures who sleep in them (D91).
ROOM = Scene(
    "room",
    ("#######", "#..u..#", "#.....#", "#..u..#", "#######"),
    {**DEFAULT_TERRAINS, "u": {"kind": "furniture", "walk": False, "sight": True}},
    (
        {"kind": "bed", "id": "bed_1", "at": [3, 1]},
        {"kind": "bed", "id": "bed_2", "at": [3, 3]},
    ),
)
MATE = {"id": "mate", "kind": "friend", "at": [2, 1], "asleep": "bed_1"}


def in_the_room(steps, actors=(MATE,)):
    data = {"id": "a-night", "scene": "room", "wizard": [1, 2], "actors": list(actors)}
    return story_on_scene({**data, "steps": steps}, ROOM)


def by(who, doing):
    return {"who": "voice", "do": doing, "by": who}


def test_a_figure_lies_down_in_a_bed_beside_it_and_wakes():
    story = in_the_room(
        [
            by("mate", {"wake": True}),
            by("mate", {"walk": [2, 3]}),
            by("mate", {"sleep": "bed_2"}),
            by("wizard", {"walk": [4, 2]}),
            by("wizard", {"walk": [4, 1]}),
            by("wizard", {"sleep": "bed_1"}),
        ]
    )
    assert story["world"]["actors"][0]["asleep"] == "bed_1"


@pytest.mark.parametrize(
    ("steps", "says"),
    [
        ([by("mate", {"walk": [2, 2]})], "mate is asleep"),
        ([by("mate", {"face": "left"})], "mate is asleep"),
        ([{"who": "voice", "do": {"vanish": True}, "by": "mate"}], "mate is asleep"),
        ([by("wizard", {"wake": True})], "wizard is not asleep"),
        ([by("wizard", {"sleep": "bed_2"})], "beside no bed_2"),
        ([by("wizard", {"sleep": "bed_3"})], "no bed of the scene"),
        ([by("wizard", {"walk": [3, 2]}), by("wizard", {"sleep": "bed_1"})], "in bed_1 already"),
        # Who is asleep may still speak.
        ([{"who": "mate"}], ""),
    ],
)
def test_who_is_asleep_does_nothing_but_wake_and_a_bed_holds_one(steps, says):
    if not says:
        in_the_room(steps)
        return
    with pytest.raises(LevelError, match=says):
        in_the_room(steps)


def test_a_sleeper_is_staged_beside_its_bed():
    with pytest.raises(LevelError, match="beside no bed_1"):
        in_the_room([{"who": "voice"}], actors=[{**MATE, "at": [1, 1]}])


#: A room whose bed names the cell under its pillow (D130).
DORM = Scene(
    "dorm",
    ("#######", "#.uu..#", "#.....#", "#######"),
    {**DEFAULT_TERRAINS, "u": {"kind": "furniture", "walk": False, "sight": True}},
    ({"kind": "bed", "id": "bed_1", "at": [2, 1], "pillow_side": [3, 2]},),
)


def in_the_dorm(steps, actors):
    data = {"id": "to-bed", "scene": "dorm", "wizard": [5, 2], "actors": list(actors)}
    return story_on_scene({**data, "steps": steps}, DORM)


def test_a_figure_goes_to_bed_from_the_cell_under_its_pillow():
    friend = {"id": "nuri", "kind": "friend", "at": [1, 2]}
    in_the_dorm([by("nuri", [{"walk": [3, 2]}, {"sleep": "bed_1"}])], [friend])
    with pytest.raises(LevelError, match="from the cell under its pillow, 3,2"):
        in_the_dorm([by("nuri", {"sleep": "bed_1"})], [{**friend, "at": [1, 1]}])


def test_a_figure_asleep_from_the_start_is_staged_under_its_pillow():
    sleeper = {"id": "nuri", "kind": "friend", "at": [3, 2], "asleep": "bed_1"}
    story = in_the_dorm([by("nuri", {"wake": True})], [sleeper])
    assert story["world"]["actors"][0]["at"] == [3, 2]
    with pytest.raises(LevelError, match="from the cell under its pillow, 3,2"):
        in_the_dorm([{"who": "voice"}], [{**sleeper, "at": [1, 1]}])


def test_a_step_does_several_things_and_two_figures_walk_together():
    # D103: nuri and the wizard walk at once, nuri first named, so that each tile
    # nuri leaves is free for the wizard at the same tick.
    story = staged(
        actors=[{"id": "nuri", "kind": "friend", "at": [2, 1]}],
        steps=[
            {
                "who": "voice",
                "by": "wizard",
                "do": [{"by": "nuri", "walk": [4, 1]}, {"by": "wizard", "walk": [3, 1]}],
            },
            {"who": "voice", "by": "nuri", "do": [{"walk": [[4, 3], [3, 3]]}, {"face": "up"}]},
        ],
    )
    assert story["steps"][1]["do"][0]["walk"] == [[4, 3], [3, 3]]
    # Named the other way round, the wizard walks into nuri, who has not moved yet.
    with pytest.raises(LevelError, match="stopped at 2,1"):
        staged(
            actors=[{"id": "nuri", "kind": "friend", "at": [2, 1]}],
            steps=[
                {
                    "who": "voice",
                    "do": [{"by": "wizard", "walk": [3, 1]}, {"by": "nuri", "walk": [4, 1]}],
                }
            ],
        )


def test_a_walk_through_a_corner_must_go_straight_each_way():
    with pytest.raises(LevelError, match="straight line"):
        staged(actors=[], steps=[{"who": "wizard", "do": {"walk": [[1, 3], [3, 1]]}}])
    staged(actors=[], steps=[{"who": "wizard", "do": {"walk": [[1, 3], [3, 3], [3, 1]]}}])


def test_a_walk_may_end_out_of_sight_and_the_wizard_never_goes():
    story = staged(
        actors=[{"id": "nuri", "kind": "friend", "at": [3, 1]}],
        steps=[
            {"who": "nuri", "do": None},
            {"who": "voice", "do": {"by": "nuri", "walk": [5, 1], "vanish": True}},
        ],
    )
    assert story["world"]["actors"][0]["at"] == [3, 1]
    with pytest.raises(LevelError, match="speaks out of sight"):
        staged(
            actors=[{"id": "nuri", "kind": "friend", "at": [3, 1]}],
            steps=[{"who": "nuri", "do": {"walk": [5, 1], "vanish": True}}],
        )
    with pytest.raises(LevelError, match="stays in the story"):
        staged(actors=[], steps=[{"who": "wizard", "do": {"walk": [3, 1], "vanish": True}}])


def test_a_figure_opens_and_closes_a_door_beside_it():
    # The gate at 5,2 is shut; nuri opens it from beside it, walks through,
    # and closes it behind from the other side.
    story = staged(
        actors=[{"id": "nuri", "kind": "friend", "at": [4, 2]}],
        steps=[
            {
                "who": "voice",
                "by": "nuri",
                "do": [{"open": "gate"}, {"walk": [[5, 2], [5, 3]]}, {"close": "gate"}],
            }
        ],
    )
    assert story["steps"][0]["do"][0] == {"open": "gate"}
    with pytest.raises(LevelError, match="beside no gate"):
        staged(actors=[], steps=[{"who": "voice", "by": "wizard", "do": {"open": "gate"}}])
    with pytest.raises(LevelError, match="no door porch"):
        staged(actors=[], steps=[{"who": "voice", "by": "wizard", "do": {"open": "porch"}}])
    with pytest.raises(LevelError, match="shut already"):
        staged(
            actors=[{"id": "nuri", "kind": "friend", "at": [4, 2]}],
            steps=[{"who": "voice", "by": "nuri", "do": {"close": "gate"}}],
        )
    with pytest.raises(LevelError, match="doorway"):
        staged(
            actors=[{"id": "nuri", "kind": "friend", "at": [4, 2]}],
            steps=[
                {"who": "voice", "by": "nuri", "do": [{"open": "gate"}, {"walk": [5, 2]}]},
                {
                    "who": "voice",
                    "by": "wizard",
                    "do": [{"walk": [[4, 1], [4, 2]]}, {"close": "gate"}],
                },
            ],
        )


def test_a_story_may_be_told_under_the_morning_light_and_no_other():
    # A morning story on a scene painted at night (D124).
    assert staged(light="morning")["light"] == "morning"
    assert "light" not in staged()
    with pytest.raises(LevelError, match="light"):
        staged(light="noon")


def test_a_figure_may_step_out_from_behind_a_thing_on_a_cell_beside_it():
    # From behind the fence at 2,2 onto 2,1 (D128); the figure is on its cell.
    out = {"who": "nuri", "do": {"appear": [2, 1], "from": [2, 2]}}
    story = staged(steps=[out, {"who": "nuri", "do": {"walk": [4, 1]}}])
    assert story["steps"][0]["do"] == {"appear": [2, 1], "from": [2, 2]}
    # Two cells away, or out of a wall: refused.
    for behind, says in (([2, 3], "beside 2,1"), ([4, 1], "beside 2,1"), ([2, 0], "wall")):
        with pytest.raises(LevelError, match=says):
            staged(steps=[{"who": "nuri", "do": {"appear": [2, 1], "from": behind}}])
    # Off the map, on a scene whose floor reaches its edge.
    strip = Scene("strip", ("...",), dict(DEFAULT_TERRAINS))
    data = {"id": "a-story", "scene": "strip", "wizard": [2, 0]}
    off = {"who": "nuri", "do": {"appear": [0, 0], "from": [-1, 0]}}
    actors = [{"id": "nuri", "kind": "friend"}]
    with pytest.raises(LevelError, match="beside 0,0"):
        story_on_scene({**data, "actors": actors, "steps": [off]}, strip)
    with pytest.raises(LevelError, match="do is one of"):
        staged(steps=[{"who": "nuri", "do": {"walk": [2, 1], "from": [2, 2]}}])
