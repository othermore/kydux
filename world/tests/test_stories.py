"""A story staged on its scene (D74): the world it is played in, and a staging
that does not fit the scene refused with the reason."""

import json

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
        "actors": [{"id": "nuri", "kind": "ghost"}],
        "steps": [
            {"who": "voice", "do": None},
            {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
            {"who": "nuri", "do": {"walk": [2, 1]}},
            {"who": "wizard", "do": {"face": "right"}},
            {"who": "nuri", "do": {"vanish": True}},
            {"who": "voice", "do": None},
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
        {"id": "nuri", "kind": "ghost", "at": [5, 1], "hidden": True, "sight": 0}
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


def test_a_story_says_which_way_its_wizard_faces_from_the_first_frame():
    """D308: `facing` beside `wizard` reaches the built world's start; down when not said."""
    assert staged(facing="up")["world"]["facing"] == "up"
    assert "facing" not in staged()["world"]
    assert "facing" not in staged(facing="left")
    with pytest.raises(LevelError, match="faces up, down, left or right"):
        staged(facing="north")


def test_a_story_and_a_step_may_name_the_theme_they_are_told_to():
    """D314, D316: `music` at a story's top and in a step is a theme's id, or a theme's
    and a movement's with a slash between them, carried as written into the story made
    whole, its parts' steps too; anything else is refused with the story and the step
    named, and so is `music` inside a step's scene."""
    from kydux_world.level import story_on_scenes

    story = staged(music="the-truth")
    assert story["music"] == "the-truth"
    steps = [{"who": "voice", "do": None}, {"who": "voice", "music": "the-familiar", "do": None}]
    assert staged(steps=steps, actors=[])["steps"][1]["music"] == "the-familiar"
    assert "music" not in staged()
    assert staged(music="the-truth/name")["music"] == "the-truth/name"
    turned = [
        {"who": "voice", "do": None},
        {"who": "voice", "music": "the-truth/love", "do": None},
    ]
    assert staged(steps=turned, actors=[])["steps"][1]["music"] == "the-truth/love"
    with pytest.raises(LevelError, match="a-story: music is a theme's id"):
        staged(music=3)
    for wrong in (5, "", "The Truth", "the_truth", "the-truth/", "/love", "the-truth/a/b"):
        bad = [{"who": "voice", "do": None}, {"who": "voice", "music": wrong, "do": None}]
        with pytest.raises(LevelError, match="a-story, step 2: music is a theme's id"):
            staged(steps=bad, actors=[])

    def told(second):
        data = {
            "id": "a-story",
            "scene": "yard",
            "wizard": [1, 1],
            "music": "the-truth",
            "steps": [{"who": "voice", "do": None}, second],
        }
        return story_on_scenes(data, {"yard": YARD}.get)

    part = {"who": "voice", "music": "the-familiar", "scene": {"scene": "yard", "wizard": [2, 1]}}
    whole = told({**part, "do": None})
    assert whole["music"] == "the-truth"
    assert whole["steps"][1]["music"] == "the-familiar"
    inside = {"who": "voice", "do": None, "scene": {"scene": "yard", "music": "the-familiar"}}
    with pytest.raises(LevelError, match="step 2: music is said beside the step's who"):
        told(inside)


def test_the_ending_s_two_stories_name_the_truth_and_bring_the_familiar_back():
    """D313, D314, D316: What the familiar brought turns to The truth, its piano alone, as
    the four go up to the tower, step 11; The end of the year opens to its organ's part,
    turns to the revelation at step 8, to the silence at step 24 and to the major's
    movement at step 26, and back to the familiar's theme at the dinner, step 32, the
    first told over the still; no other step names one."""
    import json
    from pathlib import Path

    stories = Path(__file__).resolve().parents[2] / "content" / "stories"

    def themes(story_id):
        story = json.loads((stories / story_id / "story.json").read_text())
        named = {n: step["music"] for n, step in enumerate(story["steps"], 1) if "music" in step}
        return story, named

    brought, named = themes("what-the-familiar-brought")
    assert "music" not in brought and named == {11: "the-truth/alone"}
    assert "scene" in brought["steps"][10] and "music" not in brought["steps"][10]["scene"]
    ending, named = themes("the-end-of-the-year")
    assert ending["music"] == "the-truth/name" and named == {
        8: "the-truth/revelation",
        24: "the-truth/silence",
        26: "the-truth/love",
        32: "the-familiar",
    }
    assert ending["steps"][31].get("still") is True and "still" not in ending["steps"][30]


def test_a_meanwhile_speaker_may_walk_out_of_sight_as_its_last_action():
    """D310: who speaks meanwhile says the words as the step begins and may walk out of
    the scene at its end; without meanwhile, a speaker out of sight is refused."""
    walk = {"walk": [0, 2], "leave": True}
    on_the_lane([{"who": "nuri", "meanwhile": True, "do": walk}])
    with pytest.raises(LevelError, match="speaks out of sight"):
        on_the_lane([{"who": "nuri", "do": walk}])


def test_the_tower_s_first_year_is_the_three_friends_who_leave_the_dormitory():
    """D310, D311: The tower has no walk-on pupil; at the end of its first part the three
    have left the dormitory by the left, none in sight, and at the end of its second the
    wizard and the mate are gone into the arch's dark with the friend."""
    import json
    from pathlib import Path

    from kydux_world.level import read_scene, story_on_scene

    content = Path(__file__).resolve().parents[2] / "content"
    story = json.loads((content / "stories" / "the-tower" / "story.json").read_text())
    assert {actor["id"] for actor in story["actors"]} == {"mate", "friend"}
    assert not any("classmate" in json.dumps(step) for step in story["steps"])
    first = story_on_scene(
        {**story, "steps": story["steps"][:6]}, read_scene(content / "scenes", story["scene"])
    )
    assert first["steps"][5]["do"][-1] == {"by": "wizard", "walk": [0, 15], "leave": True}
    six = [a for a in story["steps"][5]["do"] if a.get("leave")]
    assert sorted(a["by"] for a in six) == ["friend", "mate", "wizard"]
    # Into the left archway's tunnel, to its way out behind the wall (D319).
    seventeen = [a for a in story["steps"][16]["do"] if a.get("leave")]
    assert sorted(a["by"] for a in seventeen) == ["friend", "mate", "wizard"]
    assert {tuple(a["walk"][-1]) for a in seventeen} == {(14, 3)}


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
        ([{"who": "voice", "do": {"vanish": True}, "by": "mate"}], "mate is no ghost"),
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


#: A lane open at its two ends, with a door of floor at its top and its foot, and a way out
#: behind a cover (`o`, D319): the left edge at 0,2, the right at 6,2, the top at 2,0, the
#: foot at 2,4 and 3,4.
LANE = Scene(
    "lane",
    ("##g####", "##g##o#", "ggggggg", "#ggggg#", "##gg###"),
    {
        **TERRAINS,
        "o": {"kind": "wall", "walk": "story", "sight": False, "fly": False, "out": True},
    },
)


def on_the_lane(steps, actors=None, ways=None):
    data = {
        "id": "a-lane",
        "scene": "lane",
        "wizard": [1, 3],
        "actors": actors or [{"id": "nuri", "kind": "friend", "at": [3, 2]}],
        "steps": steps,
    }
    return story_on_scene(data, LANE, ways=ways)


@pytest.mark.parametrize(
    ("walk", "side"),
    [([0, 2], "left"), ([6, 2], "right"), ([[2, 2], [2, 0]], "top"), ([[2, 2], [2, 4]], "bottom")],
)
def test_a_walk_leaves_by_the_edge_it_heads_off(walk, side):
    """D319: a walk that leaves ends on the scene's edge, its last move heading off it."""
    ways: list = []
    on_the_lane([by("nuri", {"walk": walk, "leave": True}), {"who": "voice"}], ways=ways)
    end = walk if isinstance(walk[0], int) else walk[-1]
    assert ways == [
        {"scene": "lane", "story": "a-lane", "step": "a-lane, step 1", "who": "nuri"}
        | {"cell": end, "leaves": side}
    ]


def test_a_walk_leaves_by_a_way_out_behind_a_cover():
    """D319: or on a cell whose terrain says out, floor a story walks; the world the page
    draws names those cells."""
    ways: list = []
    story = on_the_lane([by("nuri", {"walk": [[5, 2], [5, 1]], "leave": True})], ways=ways)
    assert ways[0]["leaves"] == "out" and ways[0]["cell"] == [5, 1]
    assert story["world"]["out"] == [[5, 1]]


@pytest.mark.parametrize(
    ("doing", "says"),
    [
        # Reaching the border sideways is no way out, nor is a plain cell inside.
        ({"walk": [[3, 3], [3, 4], [2, 4]], "leave": True}, "leaves at 2,4, no way out"),
        ({"walk": [4, 2], "leave": True}, "leaves at 4,2, no way out"),
        ({"leave": True}, "leave ends a walk"),
        ({"fly": [0, 2], "leave": True}, "leave ends a walk"),
        ({"walk": [0, 2], "leave": False}, "leave is true"),
        ({"walk": [0, 2], "vanish": True}, "ends in leave"),
    ],
)
def test_a_walk_that_leaves_by_no_way_out_is_refused(doing, says):
    with pytest.raises(LevelError, match=says):
        on_the_lane([by("nuri", doing), {"who": "voice"}])


def test_who_has_left_does_nothing_more_and_the_wizard_leaves_last():
    """D319, D310: gone, a figure does nothing more; the wizard leaves only in a part's last
    step; two leave by one cell, one behind the other, the edge's cell free a tick after."""
    with pytest.raises(LevelError, match="nuri is out of sight"):
        on_the_lane([by("nuri", {"walk": [0, 2], "leave": True}), by("nuri", {"face": "up"})])
    with pytest.raises(LevelError, match="stays in the story"):
        on_the_lane([by("wizard", {"walk": [[1, 2], [0, 2]], "leave": True}), {"who": "voice"}])
    on_the_lane([{"who": "voice"}, by("wizard", {"walk": [[1, 2], [0, 2]], "leave": True})])
    two = [
        {"id": "nuri", "kind": "friend", "at": [2, 2]},
        {"id": "teku", "kind": "friend", "at": [3, 2]},
    ]
    pair = [
        {"by": "nuri", "walk": [0, 2], "leave": True},
        {"by": "teku", "walk": [0, 2], "leave": True},
    ]
    on_the_lane([{"who": "voice", "do": pair}], actors=two)
    with pytest.raises(LevelError, match="teku's walk is stopped at 2,2"):
        on_the_lane([{"who": "voice", "do": pair[::-1]}], actors=two)


@pytest.mark.parametrize(
    ("kind", "steps", "says"),
    [
        ("teacher", [{"who": "dask", "do": {"vanish": True}}, {"who": "voice"}], "no ghost"),
        ("friend", [by("dask", {"vanish": True})], "no ghost"),
        ("ghost", [{"who": "dask", "do": {"vanish": True}}], "no step comes after"),
        ("ghost", [{"who": "dask", "do": {"vanish": True}}, {"who": "voice"}], ""),
        ("familiar", [by("dask", {"vanish": True})], ""),
    ],
)
def test_a_figure_fades_out_only_as_a_ghost_or_a_familiar(kind, steps, says):
    """D322: a bare vanish is a ghost's or a familiar's; a speaker's is played as the next
    step begins, never in a part's last step."""
    actors = [{"id": "dask", "kind": kind, "at": [3, 2]}]
    if not says:
        on_the_lane(steps, actors=actors)
        return
    with pytest.raises(LevelError, match=says):
        on_the_lane(steps, actors=actors)


def test_a_way_out_is_floor_a_story_walks(tmp_path):
    """D319: a terrain says out only with walk story, and only as true."""
    from kydux_world.level import read_scene

    folder = tmp_path / "yard"
    folder.mkdir()
    (folder / "map.txt").write_text("###\n#o#\n###\n")
    for terrain in ({"kind": "wall", "out": True}, {"kind": "wall", "walk": "story", "out": 1}):
        (folder / "scene.json").write_text(json.dumps({"terrains": {"o": terrain}}))
        with pytest.raises(LevelError, match="way out only as floor a story walks"):
            read_scene(tmp_path, "yard")
    (folder / "scene.json").write_text(
        json.dumps({"terrains": {"o": {"kind": "wall", "walk": "story", "out": True}}})
    )
    assert read_scene(tmp_path, "yard").terrains["o"]["out"] is True


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


def test_a_story_s_last_steps_may_be_told_over_its_still():
    """D251, for the end of the year: a story that names its still, the castle, tells its
    last steps over it, in a row."""
    steps = [
        {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
        {"who": "voice", "do": None, "still": True},
        {"who": "voice", "do": None, "still": True},
    ]
    story = staged(still="castle", steps=steps)
    assert [step.get("still") for step in story["steps"]] == [None, True, True]
    with pytest.raises(LevelError, match="a story's still is one of"):
        staged(still="lake", steps=steps)


def test_the_openings_first_steps_may_be_told_over_its_still():
    """D251: `still` on the first steps in a row, of the voice, doing nothing, in a story
    that has a still (the opening)."""
    steps = [
        {"who": "voice", "do": None, "still": True},
        {"who": "voice", "do": None, "still": True},
        {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
    ]
    story = staged(opening=True, steps=steps)
    assert [step.get("still") for step in story["steps"]] == [True, True, None]


@pytest.mark.parametrize(
    ("change", "steps", "reason"),
    [
        ({}, [{"who": "voice", "do": None, "still": True}], "only in a story that has one"),
        (
            {"opening": True},
            [
                {"who": "voice", "do": None, "still": True},
                {"who": "voice", "do": None},
                {"who": "voice", "do": None, "still": True},
                {"who": "voice", "do": None},
            ],
            "the first, or the last, in a row",
        ),
        (
            {"opening": True},
            [{"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri", "still": True}],
            "does nothing",
        ),
        ({"opening": True}, [{"who": "wizard", "do": None, "still": True}], "the voice's"),
        ({"opening": True}, [{"who": "voice", "do": None, "still": "yes"}], "still is true"),
    ],
)
def test_a_step_over_the_still_is_refused_where_it_does_not_belong(change, steps, reason):
    with pytest.raises(LevelError, match=reason):
        staged(**change, steps=steps)


def test_a_figure_may_speak_while_its_steps_actions_play():
    """D275: `meanwhile` on a figure's step that does something."""
    steps = [
        {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
        {"who": "nuri", "do": {"by": "wizard", "face": "right"}, "meanwhile": True},
    ]
    story = staged(steps=steps)
    assert [step.get("meanwhile") for step in story["steps"]] == [None, True]


@pytest.mark.parametrize(
    ("step", "reason"),
    [
        ({"who": "nuri", "do": {"face": "left"}, "meanwhile": "yes"}, "meanwhile is true"),
        ({"who": "nuri", "do": None, "meanwhile": True}, "meanwhile is for a figure's words"),
        (
            {"who": "voice", "do": {"face": "left"}, "by": "nuri", "meanwhile": True},
            "meanwhile is for a figure's words",
        ),
    ],
)
def test_meanwhile_is_refused_where_it_does_not_belong(step, reason):
    with pytest.raises(LevelError, match=reason):
        staged(steps=[{"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"}, step])


def test_the_openings_first_step_may_hold_the_letter_before_its_still():
    """D257: `letter` on the first steps over the still, in a row."""
    steps = [
        {"who": "voice", "do": None, "still": True, "letter": True},
        {"who": "voice", "do": None, "still": True},
        {"who": "voice", "do": {"appear": [5, 1]}, "by": "nuri"},
    ]
    story = staged(opening=True, steps=steps)
    assert [step.get("letter") for step in story["steps"]] == [True, None, None]


@pytest.mark.parametrize(
    ("steps", "reason"),
    [
        ([{"who": "voice", "do": None, "still": True, "letter": "yes"}], "letter is true"),
        (
            [
                {"who": "voice", "do": None, "still": True},
                {"who": "voice", "do": None, "letter": True},
            ],
            "only on a step told over the still",
        ),
        (
            [
                {"who": "voice", "do": None, "still": True},
                {"who": "voice", "do": None, "still": True, "letter": True},
            ],
            "the first, in a row",
        ),
    ],
)
def test_a_step_holding_the_letter_is_refused_where_it_does_not_belong(steps, reason):
    with pytest.raises(LevelError, match=reason):
        staged(opening=True, steps=steps)


#: A room where Rinlo sits, and the pieces of a thread hidden in it (D279).
RINLO = {"id": "rinlo", "kind": "friend", "at": [1, 1], "facing": "right", "sitting": True}
PIECES = [
    {"kind": "thread", "id": "thread_1", "at": [2, 2], "hidden": True},
    {"kind": "thread", "id": "thread_2", "at": [4, 2], "hidden": True},
]


def seated(steps, actors=(RINLO,), things=PIECES, sitters=frozenset({"rinlo"})):
    data = {
        "id": "the-pieces",
        "scene": "room",
        "wizard": [5, 2],
        "actors": list(actors),
        "things": list(things),
    }
    return story_on_scene({**data, "steps": steps}, ROOM, sitters)


def test_a_seated_figure_stands_walks_shows_what_it_leaves_and_sits():
    seated(
        [
            by("rinlo", {"stand": True}),
            by(
                "rinlo",
                [
                    {"walk": [1, 2]},
                    {"walk": [2, 2]},
                    {"walk": [4, 2]},
                    {"show": "thread_2"},
                    {"walk": [2, 2]},
                    {"show": "thread_1"},
                    {"walk": [1, 2]},
                    {"face": "right"},
                    {"sit": True},
                ],
            ),
            {"who": "rinlo"},
        ]
    )


@pytest.mark.parametrize(
    ("steps", "says"),
    [
        ([by("wizard", {"stand": True})], "wizard stands up, and is not seated"),
        ([by("rinlo", {"walk": [1, 2]})], "rinlo is seated, and stands before walking"),
        ([by("wizard", {"sit": True})], "wizard has no sitting rows"),
        ([by("rinlo", {"show": "thread_3"})], "thread_3 is no thing staged hidden"),
        (
            [by("rinlo", {"show": "thread_1"}), by("rinlo", {"show": "thread_1"})],
            "in sight already",
        ),
        ([by("rinlo", {"stand": "yes"})], "stand is true"),
    ],
)
def test_a_story_s_stand_sit_and_show_are_checked(steps, says):
    with pytest.raises(LevelError, match=says):
        seated(steps)


def test_only_a_thing_the_wizard_carries_is_staged_hidden():
    with pytest.raises(LevelError, match="only a thing the wizard carries is hidden"):
        seated(
            [{"who": "voice"}],
            things=[{"kind": "door", "id": "door_1", "at": [2, 2], "hidden": True}],
        )


#: A room whose landing and stairs the painting shows and no level walks: `l`, a wall to a
#: level, and `v`, the floor before the crates, a shelf to it; `u` is furniture (D288); the
#: stairs' foot, `o`, a way out (D319).
LANDING = Scene(
    "landing",
    ("#######", "#lllvu#", "#l#...#", "#o#...#", "#######"),
    {
        **DEFAULT_TERRAINS,
        "u": {"kind": "furniture", "walk": False, "sight": True},
        "l": {"kind": "wall", "walk": "story", "sight": False, "fly": False},
        "o": {"kind": "wall", "walk": "story", "sight": False, "fly": False, "out": True},
        "v": {"kind": "furniture", "walk": "story", "sight": True, "fly": False},
    },
)


def on_the_landing(steps, at=(4, 2), things=()):
    data = {
        "id": "down-the-stairs",
        "scene": "landing",
        "wizard": [5, 3],
        "actors": [{"id": "rinlo", "kind": "friend", "at": list(at)}],
        "things": list(things),
    }
    return story_on_scene({**data, "steps": steps}, LANDING)


def test_a_story_s_figure_stands_on_and_walks_a_story_s_floor():
    """D288: the floor a story alone walks is floor to its figures, read from the scene;
    the level's map built under it keeps it a wall and a shelf."""
    story = on_the_landing(
        [by("rinlo", [{"walk": [[4, 1], [1, 1], [1, 3]], "leave": True}])], at=(4, 2)
    )
    assert story["world"]["map"][1:4] == ["####==#", "###...#", "###..S#"]
    on_the_landing([by("rinlo", {"walk": [1, 1]})], at=(4, 1))
    # A story's door stands on it: shut, it stops a walk; opened, it lets one through.
    door = {"kind": "door", "id": "side", "at": [3, 1], "open": False}
    with pytest.raises(LevelError, match="stopped at 3,1"):
        on_the_landing([by("rinlo", {"walk": [1, 1]})], at=(4, 1), things=[door])
    on_the_landing(
        [by("rinlo", [{"open": "side"}, {"walk": [[1, 1], [1, 3]], "leave": True}])],
        at=(4, 1),
        things=[door],
    )
    # Furniture that is no story's floor is refused, as ever.
    with pytest.raises(LevelError, match="rinlo stands on no floor"):
        on_the_landing([by("rinlo", {"walk": [4, 1]})], at=(5, 1))
    with pytest.raises(LevelError, match="stopped at 5,1"):
        on_the_landing([by("rinlo", {"walk": [[4, 1], [5, 1]]})], at=(4, 2))


def test_rinlo_opens_the_side_door_and_goes_down_the_back_stairs():
    """D289: Lo que trajo el familiar has the room's side door, shut, and twenty-eight
    steps, its texts as many in each language; walked through shut, the door stops him."""
    import copy
    import json
    from pathlib import Path

    from kydux_world.level import read_scene, story_on_scenes

    content = Path(__file__).resolve().parents[2] / "content"
    folder = content / "stories" / "what-the-familiar-brought"
    story = json.loads((folder / "story.json").read_text(encoding="utf-8"))
    assert story["things"] == [
        {"kind": "door", "id": "room_door", "at": [5, 3], "art": "room_door", "open": False}
    ]
    figures = json.loads((content / "art" / "figures" / "figures.json").read_text())
    sitters = frozenset(name for name, sheet in figures["sheets"].items() if "sit" in sheet)

    def built(data):
        return story_on_scenes(data, lambda name: read_scene(content / "scenes", name), sitters)

    assert len(built(story)["steps"]) == 28
    for lang in ("es", "en"):
        text = json.loads((folder / f"text.{lang}.json").read_text(encoding="utf-8"))
        assert len(text["steps"]) == 28
    shut = copy.deepcopy(story)
    shut["steps"][0]["do"] = [act for act in shut["steps"][0]["do"] if "open" not in act]
    with pytest.raises(LevelError, match="stopped at 5,3"):
        built(shut)
