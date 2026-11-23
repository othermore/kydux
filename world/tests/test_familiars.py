"""Chapter 5's world: a class of the child's is a kind of familiar (D260), the first year's
limits told as stumbles of the story (D261), `minka` (D262), someone's words in a run
(D264), the book and Orla's orders (D267), the birth rehearsed (D268), the living familiar
(D269), its steps, the cells only it enters and what it sees (D270), the goals and the
explanations (D271).

Every case of the chapter's levels, a program and what it must give, is data in
familiar_cases.json, which the page reads too for the rules both sides share; the cases
run on the real levels of content/levels/ where they are, and on scratch levels made
here, on maps like the scenes', where they are not yet."""

import json
from pathlib import Path

import pytest
from kydux_world import api, familiars
from kydux_world.level import Level, LevelError, Position
from kydux_world.run import run_code
from kydux_world.world import World

ROOT = Path(__file__).resolve().parents[2]
CASES = json.loads((Path(__file__).parent / "familiar_cases.json").read_text(encoding="utf-8"))

#: The tower's hall as the levels play it (sprint-53.md, 3.2): the floor columns 5 to 14,
#: rows 4 to 10, the lectern on (9,3)-(10,4), the entrance arch below.
HALL = (
    ["#" * 20] * 4
    + ["#####....##....#####"]
    + ["#####..........#####"] * 6
    + ["#########..#########"]
    + ["#" * 20] * 3
)
#: The corridor below it, the passage only a familiar enters, and the forgotten room.
PASSAGE = [
    "#" * 20,
    "#" * 20,
    "#########...########",
    "########......######",
    "#############,######",
    "#############,######",
    "#############,######",
    "#############,######",
    "##########,,,,######",
    "##########,#########",
    "##########,#########",
    "##########,#########",
    "##########,#########",
    "#..................#",
    "#..................#",
]


def _with(rows: list[str], cell: tuple[int, int], char: str) -> list[str]:
    x, y = cell
    found = [list(row) for row in rows]
    found[y][x] = char
    return ["".join(row) for row in found]


PLATES = [
    {"kind": "plate", "id": "moon", "at": [6, 4]},
    {"kind": "plate", "id": "sun", "at": [13, 4]},
    {"kind": "plate", "id": "star", "at": [13, 10]},
]
ORLA = {"kind": "teacher", "id": "orla", "at": [11, 4], "facing": "down", "sight": 0}
CLASS = (
    "class Fox(Familiar):\n"
    "    def __init__(self, name, color):\n"
    "        self.name = name\n"
    "        self.color = color\n"
)
LEARNED = CLASS + CASES["levels"]["orlas-orders"]["solution"].split(CLASS, 1)[1].split("\n\n")[0]
LIVING = {"kind": "Fox", "name": "Pimu", "color": "red", "source": CLASS}
DRAFT = {"kind": "Fox", "name": "Pimu", "color": "red"}


def hall(level_id: str, **level: object) -> dict:
    return {
        "id": level_id,
        "map": _with(HALL, (10, 10), "S"),
        "voices": {"bimo": [9, 3]},
        "carrying": ["wand"],
        "spells": ["minka"],
        "things": PLATES,
        **level,
    }


def passage(level_id: str, **level: object) -> dict:
    return {
        "id": level_id,
        "map": _with(PASSAGE, (9, 13), "S"),
        "voices": {"cold_voice": [8, 2]},
        "zones": {"room": [[0, 1, 19, 3]]},
        "actors": [
            {"kind": "friend", "id": "friend", "at": [8, 13]},
            {"kind": "friend", "id": "mate", "at": [11, 14]},
            {"kind": "friend", "id": "rinlo", "at": [8, 3], "facing": "right", "sitting": True},
        ],
        **level,
    }


#: The levels as the plan places them, until content/levels/ has them.
SCRATCH = {
    "the-circle": hall(
        "the-circle",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [6, 7]},
            {"kind": "friend", "id": "mate", "at": [13, 7], "facing": "left"},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "trial": True,
                "at": [8, 7],
            },
            {
                "kind": "familiar",
                "id": "mate_familiar",
                "creature": "Frog",
                "color": "green",
                "trial": True,
                "at": [11, 6],
            },
        ],
        familiar={"stage": "trial", "circle": [8, 6, 11, 8], "trials": [[10, 7]], "methods": []},
        told={"won": [["orla", "won"], ["bimo", "bimo"]]},
        api=["wizard.cast"],
        goals=[{"kind": "trial", "count": 1}],
    ),
    "the-name-and-the-colour": hall(
        "the-name-and-the-colour",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [6, 7]},
            {"kind": "friend", "id": "mate", "at": [13, 7], "facing": "left"},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "color": "grey",
                "trial": True,
                "at": [8, 7],
            },
            {
                "kind": "familiar",
                "id": "mate_familiar",
                "creature": ["Bat", "Mouse"],
                "color": ["black", "brown"],
                "trial": True,
                "at": [11, 8],
            },
        ],
        familiar={
            "stage": "trial",
            "circle": [8, 6, 11, 8],
            "trials": [[10, 7]],
            "methods": [],
            "draft": {"kind": "Fox"},
        },
        api=["wizard.cast", "familiar.name", "familiar.color"],
        goals=[{"kind": "trial", "count": 1, "named": True, "coloured": True}],
    ),
    "one-line-in-the-book": hall(
        "one-line-in-the-book",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [6, 7]},
            {"kind": "friend", "id": "mate", "at": [13, 7], "facing": "left"},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "color": "grey",
                "trial": True,
                "at": [8, 7],
            },
            {"kind": "familiar", "id": "mate_familiar", "spark": True, "at": [11, 7]},
        ],
        familiar={
            "stage": "trial",
            "circle": [8, 6, 11, 8],
            "trials": [[10, 7]],
            "methods": ["__init__"],
            "book": True,
            "then": {"born": "friend_familiar", "to": [7, 7]},
            "draft": DRAFT,
        },
        api=["wizard.cast", "familiar.name", "familiar.color"],
        goals=[{"kind": "trial", "count": 1, "named": True, "coloured": True}, {"kind": "noted"}],
    ),
    "the-slate": hall(
        "the-slate",
        kind="fix",
        fault="missing_self",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [6, 7]},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "color": "grey",
                "at": [7, 7],
            },
            {"kind": "friend", "id": "mate", "at": [13, 7], "facing": "left"},
        ],
        familiar={
            "stage": "trial",
            "circle": [8, 6, 11, 8],
            "trials": [[10, 7], [11, 7]],
            "methods": ["__init__"],
            "draft": DRAFT,
        },
        told={"won": [["mate", "won"]]},
        api=["wizard.cast", "familiar.name", "familiar.color"],
        goals=[{"kind": "trial", "count": 2, "named": True, "coloured": True}],
    ),
    "out-of-the-circle": hall(
        "out-of-the-circle",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [7, 10]},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "color": "grey",
                "at": [6, 10],
            },
            {"kind": "friend", "id": "mate", "at": [13, 7], "facing": "left"},
            {
                "kind": "familiar",
                "id": "mate_familiar",
                "of": "mate",
                "trial": True,
                "at": [11, 7],
            },
        ],
        familiar={
            "stage": "birth",
            "circle": [8, 6, 11, 8],
            "trials": [[10, 7]],
            "methods": ["__init__"],
            "book": True,
            "then": {"born": "mate_familiar", "to": [12, 7]},
            "draft": DRAFT,
        },
        api=[
            "wizard.cast",
            "familiar.name",
            "familiar.color",
            "familiar.move_up",
            "familiar.move_down",
            "familiar.move_left",
            "familiar.move_right",
        ],
        goals=[
            {"kind": "trial", "count": 1, "named": True, "coloured": True},
            {"kind": "noted"},
            {"kind": "born"},
            {"kind": "familiar_at", "on": "moon"},
        ],
    ),
    "orlas-orders": hall(
        "orlas-orders",
        actors=[
            ORLA,
            {"kind": "friend", "id": "friend", "at": [7, 10]},
            {
                "kind": "familiar",
                "id": "friend_familiar",
                "creature": "Hare",
                "color": "grey",
                "at": [6, 10],
            },
            {"kind": "friend", "id": "mate", "at": [8, 10]},
            {"kind": "familiar", "id": "mate_familiar", "of": "mate", "at": [9, 10]},
        ],
        familiar={
            "stage": "living",
            "from": "source",
            "methods": ["__init__", "go_to"],
            "living": {**LIVING, "at": [10, 9], "facing": "up"},
            "orders": {
                "on": "sun",
                "steps": [
                    {"to": [13, 10], "key": "order_star"},
                    {"to": [11, 10], "key": "order_wizard"},
                ],
            },
        },
        spells=[],
        carrying=[],
        api=[
            "familiar.name",
            "familiar.color",
            "familiar.position",
            "familiar.move_up",
            "familiar.move_down",
            "familiar.move_left",
            "familiar.move_right",
        ],
        goals=[
            {"kind": "familiar_at", "on": "sun"},
            {"kind": "orders"},
            {"kind": "no_bumps", "of": "familiar", "bonus": True},
        ],
    ),
    "the-small-passage": passage(
        "the-small-passage",
        familiar={
            "stage": "living",
            "from": "learned",
            "methods": ["__init__", "go_to"],
            "living": {**LIVING, "learned": LEARNED, "at": [10, 13], "facing": "up"},
        },
        things=[
            {"kind": "trail", "id": "trail_1", "at": [10, 10]},
            {"kind": "trail", "id": "trail_2", "at": [12, 8]},
            {"kind": "trail", "id": "trail_3", "at": [13, 7]},
        ],
        api=["familiar.position", "familiar.go_to"],
        goals=[
            {"kind": "familiar_at", "at": [13, 3]},
            {"kind": "no_bumps", "of": "familiar", "bonus": True},
        ],
    ),
    "the-forgotten-room": passage(
        "the-forgotten-room",
        kind="challenge",
        carrying=["wand"],
        spells=["minka"],
        familiar={
            "stage": "living",
            "from": "learned",
            "methods": ["__init__", "go_to"],
            "living": {**LIVING, "learned": LEARNED, "at": [10, 13], "facing": "up"},
        },
        things=[
            {"kind": "thread", "id": "thread_1", "at": [9, 2], "zone": "room"},
            {"kind": "thread", "id": "thread_2", "at": [11, 3], "zone": "room"},
            {"kind": "thread", "id": "thread_3", "at": [12, 3], "zone": "room"},
            {"kind": "thread", "id": "thread_4", "at": [10, 3], "zone": "room"},
        ],
        api=["wizard.cast", "wizard.find_all", "familiar.position", "thing.position"],
        goals=[
            {"kind": "collect", "of": "thread", "all": True},
            {"kind": "no_bumps", "of": "familiar", "bonus": True},
        ],
        ways=[
            {"id": "a", "things": [{"id": "thread_4", "gone": True}]},
            {
                "id": "b",
                "things": [
                    {"id": "thread_1", "at": [9, 3]},
                    {"id": "thread_2", "at": [10, 3]},
                    {"id": "thread_3", "at": [11, 2]},
                    {"id": "thread_4", "gone": True},
                ],
            },
            {
                "id": "c",
                "things": [
                    {"id": "thread_1", "at": [9, 3]},
                    {"id": "thread_4", "at": [9, 2]},
                ],
            },
        ],
    ),
}


def level_of(level_id: str) -> Level:
    """The level as content/levels/ has it, or the scratch level until it does."""
    directory = ROOT / "content" / "levels" / level_id
    if (directory / "level.json").is_file():
        return Level.from_directory(directory)
    return Level.from_dict(SCRATCH[level_id])


# The rules the page shares (D261, D266).


@pytest.mark.parametrize(("name", "problem"), CASES["names"])
def test_a_name_is_letters_only_short_and_no_name_of_python_s_or_the_game_s(name, problem):
    assert familiars.name_problem(name) == problem


@pytest.mark.parametrize(("kind", "color", "mate"), CASES["mate_colours"])
def test_the_room_mate_s_copy_is_the_kind_s_first_other_colour(kind, color, mate):
    assert familiars.mate_colour(kind, color) == mate


@pytest.mark.parametrize(("name", "friend", "mate"), CASES["friends"])
def test_the_friends_familiars_take_other_names_when_the_child_takes_theirs(name, friend, mate):
    assert familiars.friends_names(name) == {"friend": friend, "mate": mate}


@pytest.mark.parametrize(("kind", "color", "coloured", "worth", "reason"), CASES["worth"])
def test_a_trial_is_good_pale_or_a_spark(kind, color, coloured, worth, reason):
    assert familiars.worth(kind, color, coloured) == (worth, reason)


def test_the_table_has_fourteen_creatures_the_grey_hare_the_friend_s():
    assert sum(len(colours) for colours in familiars.SHEETS.values()) == 14
    assert "grey" not in familiars.KINDS["Hare"] and familiars.KEPT == {"Hare": "grey"}
    assert familiars.FRIEND == {"kind": "Hare", "name": "Tolu", "color": "grey"}
    assert all(len(colours) >= 2 for colours in familiars.KINDS.values())


def test_every_name_a_chapter_5_level_gives_that_a_familiar_could_take_is_reserved():
    """D261: a name is no id of a thing or an actor of the chapter's levels."""
    chapter = ROOT / "content/chapters/05-the-familiar/chapter.json"
    items = json.loads(chapter.read_text())["items"] if chapter.is_file() else list(SCRATCH)
    for item in items:
        kind, _, item_id = item.rpartition(":")
        if kind not in ("level", ""):
            continue
        level = level_of(item_id)
        for name in level.ids():
            if name.isalpha():
                assert name.lower() in familiars.RESERVED, f"{item_id}: {name}"


# Every case of the chapter's levels.


def _cases() -> list[tuple[str, str, str, dict]]:
    found = []
    for level_id, case in CASES["levels"].items():
        found.append((level_id, "solution", case["solution"], case["expect"]))
        for wrong in case["wrong"]:
            found.append((level_id, wrong["name"], wrong["code"], wrong["expect"]))
    return found


def _events(result, kind):
    return [e for e in result.events if e.kind == kind]


@pytest.mark.parametrize(
    ("level_id", "name", "code", "expect"), _cases(), ids=lambda v: str(v)[:40]
)
def test_every_case_of_the_chapter_gives_what_it_must(level_id, name, code, expect):
    result = run_code(level_of(level_id), code)
    assert result.status == expect["status"], (name, result.error)
    if "explanation" in expect:
        assert result.error is not None
        assert result.error.explanation["kind"] == expect["explanation"], result.error
        if "line" in expect:
            assert result.error.line == expect["line"]
        if "params" in expect:
            params = result.error.explanation["params"]
            assert {k: params.get(k) for k in expect["params"]} == expect["params"]
    told = [[e.data["who"], e.data["key"]] for e in _events(result, "told")]
    if "told" in expect:
        assert told == expect["told"], told
    if "trial" in expect:
        trial = _events(result, "trial")[0].data
        assert {k: trial[k] for k in expect["trial"]} == expect["trial"]
    if "trials" in expect:
        assert len(_events(result, "trial")) == expect["trials"]
    if expect.get("spark"):
        assert _events(result, "spark") and not _events(result, "trial")
    if "colours" in expect:
        books = [e.data for e in _events(result, "book") if "colors" in e.data]
        assert books and books[0]["colors"] == expect["colours"]
    if "book" in expect:
        books = [e.data for e in _events(result, "book") if "line" in e.data]
        assert books, "the book noted nothing"
        assert {k: books[0][k] for k in expect["book"]} == expect["book"]
    if "passes" in expect:
        assert result.passes is expect["passes"]
    if "born" in expect:
        born = [e for e in _events(result, "born") if e.actor.startswith("familiar")]
        assert born and born[0].data["at"] == expect["born"]
    if "born_actor" in expect:
        actor, at = expect["born_actor"]
        assert [actor, at] in [[e.data["id"], e.data["at"]] for e in _events(result, "born")]
    if "held" in expect:
        held = _events(result, "held")
        assert held and held[0].data["at"] == expect["held"]
    if "footprints" in expect:
        assert [e.data["at"] for e in _events(result, "footprint")] == expect["footprints"]
    if "footprint_bump" in expect:
        bumps = [e.data["at"] for e in _events(result, "bump") if e.data.get("footprint")]
        assert expect["footprint_bump"] in bumps
    if "bump" in expect:
        bumps = [e.data["at"] for e in _events(result, "bump") if e.actor != "wizard"]
        assert bumps and bumps[0] == expect["bump"], bumps
    if "not_here" in expect:
        refused = [e for e in _events(result, "blocked") if e.data["reason"] == "not_here"]
        assert len(refused) == expect["not_here"]
    if "lit" in expect:
        assert expect["lit"] in [e.data["id"] for e in _events(result, "lit")]
    if "steps" in expect:
        mine = [e for e in _events(result, "move") if e.actor.startswith("familiar")]
        assert len(mine) == expect["steps"]
    if "end" in expect:
        moves = [e for e in _events(result, "move") if e.actor.startswith("familiar")]
        assert moves[-1].data["to"] == expect["end"]
    if "orders" in expect:
        assert len(_events(result, "order")) == expect["orders"]
    if expect.get("learned"):
        assert _events(result, "learned") and result.familiar["learned"]
    if expect.get("puzzled"):
        assert _events(result, "puzzled")
    if "copied" in expect:
        copied = _events(result, "copied")
        assert copied and [copied[0].data["kind"], copied[0].data["color"]] == expect["copied"]
    if "ticks" in expect:
        assert result.ticks == expect["ticks"]
    if "handed" in expect:
        handed = _events(result, "hand_over")
        assert handed and len(handed[-1].data["things"]) == expect["handed"]
    if "ways" in expect:
        statuses = {way: r.status for way, r in result.ways}
        assert {w: statuses[w] for w in expect["ways"]} == expect["ways"]
    if "result" in expect:
        assert result.familiar["trial"] == expect["result"]


# What the world does, one thing at a time.


def test_a_class_with_no_init_called_with_data_is_python_s_own_error():
    result = run_code(level_of("the-circle"), 'class Fox(Familiar):\n    pass\n\nFox("Pimu")\n')
    assert result.error.type == "TypeError"
    assert result.error.explanation == {
        "kind": "object_arguments",
        "params": {"name": "Fox", "wanted": 0, "given": 1},
    }


def test_a_lesson_s_own_classes_are_plain_python():
    """D260: the limits hold only for a class of the world's Familiar."""
    code = (
        "class Crow:\n    def hop(self, times):\n        self.hops = times\n\n"
        "class Familiar:\n    def __init__(self, name):\n        self.name = name\n\n"
        "class Raven(Familiar):\n    pass\n\n"
        'vesso = Crow()\nvesso.hop(3)\nprint(vesso.hops, Raven("Dalu").name)\n'
    )
    result = run_code(level_of("the-circle"), code)
    assert result.status == "incomplete" and result.stdout == "3 Dalu\n"


def test_an_attribute_never_given_is_explained_on_any_object():
    result = run_code(level_of("the-circle"), "class Crow:\n    pass\n\nprint(Crow().name)\n")
    assert result.error.explanation == {"kind": "no_attribute", "params": {"name": "name"}}
    code = "class Fox(Familiar):\n    pass\n\nprint(Fox().name)\n"
    result = run_code(level_of("the-circle"), code)
    assert result.error.explanation == {"kind": "no_attribute", "params": {"name": "name"}}


def test_an_object_called_twice_is_not_called_again_and_the_program_goes_on():
    code = (
        "class Fox(Familiar):\n    pass\n\npimu = Fox()\n"
        'wizard.cast("minka", pimu)\nwizard.cast("minka", pimu)\n'
    )
    result = run_code(level_of("the-circle"), code)
    assert result.status == "won"
    assert [e.data["reason"] for e in _events(result, "blocked")] == ["already_here"]


def test_with_every_trial_s_cell_taken_the_oldest_trial_dissolves():
    code = (
        "class Fox(Familiar):\n    pass\n\none = Fox()\nother = Fox()\n"
        'wizard.cast("minka", one)\nwizard.cast("minka", other)\n'
    )
    result = run_code(level_of("the-circle"), code)
    trials = _events(result, "trial")
    assert [t.data["at"] for t in trials] == [[10, 7], [10, 7]]
    assert trials[1].data["dissolved"] == trials[0].data["id"]


def test_a_familiar_takes_name_and_color_and_nothing_else_even_inside_init():
    code = (
        "class Fox(Familiar):\n    def __init__(self, name, color):\n"
        "        self.name = name\n        self.size = 2\n\n"
        'pimu = Fox("Pimu", "red")\n'
    )
    result = run_code(level_of("one-line-in-the-book"), code)
    assert result.error.explanation["kind"] == "other_attribute"
    assert result.error.explanation["params"]["name"] == "size"
    assert result.error.line == 4


def test_a_name_in_the_class_s_body_is_not_the_first_year_s():
    code = "class Fox(Familiar):\n    legs = 4\n"
    result = run_code(level_of("the-circle"), code)
    assert result.error.explanation["kind"] == "other_name"
    assert result.error.explanation["params"]["name"] == "legs"
    assert result.error.line == 2


def test_the_rehearsal_is_silent_and_the_shown_run_is_the_one_played():
    level = level_of("out-of-the-circle")
    code = CASES["levels"]["out-of-the-circle"]["solution"]
    result = run_code(level, code)
    assert result.passes is True and result.familiar["born"] is True
    assert result.familiar["source"].startswith("class Fox(Familiar):")
    told = [e.data["key"] for e in _events(result, "told")]
    assert told.count("go") == 1


def test_with_a_familiar_living_a_second_is_halted_and_the_practice_is_the_rehearsal_s():
    data = dict(SCRATCH["out-of-the-circle"])
    block = dict(data["familiar"])
    block["living"] = None
    level = level_of("out-of-the-circle")
    living = familiars.DEFAULT | {"source": CLASS}
    from dataclasses import replace

    from kydux_world.level import Living

    kept = Living(living["kind"], living["name"], living["color"], CLASS, Position(10, 9))
    level = replace(level, familiar=replace(level.familiar, living=kept))
    code = CASES["levels"]["out-of-the-circle"]["solution"]
    result = run_code(level, code)
    assert result.passes is False
    assert result.status == "won"
    assert result.familiar["born"] is False
    assert [e.data["key"] for e in _events(result, "told")][-1] == "halt"
    assert not _events(result, "born")


def test_the_living_familiar_is_in_the_program_by_its_name_and_its_class_takes_it_over():
    code = CASES["levels"]["orlas-orders"]["solution"]
    result = run_code(level_of("orlas-orders"), code)
    learned = _events(result, "learned")
    assert learned and learned[0].data["methods"] == ["go_to"]
    assert "def go_to(self, x, y):" in result.familiar["learned"]


def test_describing_the_living_familiar_again_only_adds():
    level = level_of("the-small-passage")
    code = CLASS + "\npimu.go_to(10, 8)\n"
    result = run_code(level, code)
    assert result.status == "incomplete" and result.error is None
    assert [e.data["to"] for e in _events(result, "move")][-1] == [10, 8]


def test_the_orders_lines_light_the_child_s_own_go_to():
    code = CASES["levels"]["orlas-orders"]["solution"]
    result = run_code(level_of("orlas-orders"), code)
    orders = _events(result, "order")
    assert [o.data["line"] for o in orders] == ["pimu.go_to(13, 10)", "pimu.go_to(11, 10)"]
    after = [e for e in result.events if e.tick > orders[0].tick and e.kind == "move"]
    assert after and all(e.line is not None and 6 <= e.line <= 14 for e in after)


def test_a_familiar_s_steps_are_ticks_and_follow_on():
    world = World(level_of("orlas-orders"), "")
    world.prepare()
    pimu = world.living
    pimu.move_right(2)
    assert world.tick == 2
    assert [e.actor for e in world.events] == ["familiar", "familiar"]
    pimu.move_up(0)
    assert world.tick == 2


def test_the_wizard_does_not_enter_a_familiars_passage_and_thinks_of_it():
    level = level_of("the-small-passage")
    assert level.familiar_walks(Position(10, 12)) and not level.free(Position(10, 12))
    result = run_code(level, "wizard.move_right(1)\nwizard.move_up(1)\n")
    bumps = _events(result, "bump")
    assert bumps[0].data["by"] == "familiar"


def test_a_zone_s_things_are_found_where_the_living_familiar_stands():
    world = World(level_of("the-forgotten-room").way("a"), "")
    world.prepare()
    assert world.wizard.find_all("thread") == []
    world.living._set(cell=Position(13, 3))
    found = [t.name for t in world.wizard.find_all("thread")]
    assert found == ["thread_1", "thread_2", "thread_3"]


def test_a_trail_is_found_by_no_one_and_walked_over():
    world = World(level_of("the-small-passage"), "")
    world.prepare()
    world.living._set(cell=Position(10, 11))
    assert world.wizard.find_all("trail") == []


def test_minka_with_no_familiar_is_refused_as_an_aimed_spell_with_nothing_to_aim_at():
    for code in ('wizard.cast("minka")\n', 'wizard.cast("minka", moon)\n'):
        result = run_code(level_of("the-circle"), code)
        assert result.error.explanation["kind"] == "arguments"


def test_the_sandbox_s_rules_hold_for_a_method_of_the_child_s_class():
    code = (
        "class Fox(Familiar):\n    def __init__(self, name, color):\n"
        "        import js\n        self.name = name\n        self.color = color\n\n"
        'pimu = Fox("Pimu", "red")\n'
    )
    result = run_code(level_of("one-line-in-the-book"), code)
    assert result.error.type == "ModuleNotFoundError"


def test_moving_a_familiar_from_behind_its_back_is_found():
    code = (
        CLASS.replace("Fox", "Fox") + '\npimu = Fox("Pimu", "red")\nwizard.cast("minka", pimu)\n'
        "pimu.move_down(1)\n"
        "object.__setattr__(pimu, '_k_cell', type(wizard.position)(5, 5))\n"
        "pimu.move_down(1)\n"
    )
    result = run_code(level_of("out-of-the-circle"), code)
    assert result.status == "error" and result.error.type == "WorldError"


def test_the_level_s_block_is_checked():
    data = dict(SCRATCH["the-circle"])
    for wrong, reason in [
        ({"stage": "grown"}, "stage"),
        ({"stage": "trial", "circle": [8, 6, 11, 8], "trials": [[6, 5]]}, "the trials' cells"),
        (
            {"stage": "trial", "circle": [8, 6, 11, 8], "trials": [[10, 7]], "methods": ["fly"]},
            "methods",
        ),
        ({"stage": "living"}, "its living familiar"),
        (
            {
                "stage": "trial",
                "circle": [8, 6, 11, 8],
                "trials": [[10, 7]],
                "draft": {"kind": "Dragon"},
            },
            "draft's kind",
        ),
    ]:
        with pytest.raises(LevelError, match=reason):
            Level.from_dict({**data, "familiar": wrong})


def test_the_api_knows_the_familiar_and_its_own_go_to():
    assert api.known("familiar.move_up") and api.known("familiar.go_to")
    assert api.role_of("familiar") == "familiar"
    assert "go_to" not in api.MEMBERS["familiar"]
    table = api.table()
    assert [m["name"] for m in table["familiar"]] == list(api.MEMBERS["familiar"])


def test_the_result_says_what_the_page_keeps():
    result = run_code(level_of("the-circle"), CASES["levels"]["the-circle"]["solution"])
    assert result.to_dict()["familiar"] == {
        "trial": {"kind": "Fox", "name": None, "color": None},
        "born": False,
        "source": "class Fox(Familiar):\n    pass",
        "learned": None,
    }
