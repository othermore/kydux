"""Errors in the child's words: one test for each kind the page says (D22)."""

import pytest
from kydux_world.level import Level
from kydux_world.run import run_code

LEVEL = Level.from_dict(
    {
        "id": "explain",
        "map": ["##########", "#S...K...#", "#######D##", "#......E.#", "##########"],
        "things": [
            {"kind": "key", "id": "key", "marker": "K", "opens": "door"},
            {"kind": "door", "id": "door", "marker": "D", "locked": True},
        ],
        "api": ["wizard.move_right", "wizard.move_down", "wizard.pick_up", "door.open"],
        "goals": [{"kind": "reach", "marker": "E"}],
    }
)


def explained(code):
    result = run_code(LEVEL, code)
    assert result.status == "error", result
    return result.error.explanation, result.error.line


@pytest.mark.parametrize(
    ("code", "kind", "params", "line"),
    [
        (
            "wizard.mvoe_right()",
            "unknown_action",
            {"object": "wizard", "name": "mvoe_right", "suggestion": "move_right"},
            1,
        ),
        ("wizard.fly()", "unknown_action", {"object": "wizard", "name": "fly"}, 1),
        (
            "door.opn()",
            "unknown_action",
            {"object": "door", "name": "opn", "suggestion": "open"},
            1,
        ),
        ("wizrd.move_right(6)", "unknown_name", {"name": "wizrd", "suggestion": "wizard"}, 1),
        ("dor.open()", "unknown_name", {"name": "dor", "suggestion": "door"}, 1),
        ("dragon.roar()", "unknown_name", {"name": "dragon"}, 1),
        ("wizard.position = (7, 1)", "read_only", {"object": "wizard", "name": "position"}, 1),
        ("door.locked = False", "read_only", {"object": "door", "name": "locked"}, 1),
        ("wizard.jump = 3", "no_new_attribute", {"object": "wizard", "name": "jump"}, 1),
        ("wizard.move_right(3\n", "unclosed", {"what": "("}, 1),
        ("wizard.say([1, 2)\n", "syntax", None, 1),
        ("wizard.say('hello)\n", "unclosed", {"what": "'"}, 1),
        ("while True\n    wizard.move_right()\n", "missing_colon", {"keyword": "while"}, 1),
        ("if wizard.has('key')\n    door.open()\n", "missing_colon", {"keyword": "if"}, 1),
        ("while True:\nwizard.move_right()\n", "indentation", {}, 2),
        (
            "wizard.move_right('three')",
            "arguments",
            {"name": "move_right", "example": "wizard.move_right(3)"},
            1,
        ),
        (
            "wizard.move_right(-1)",
            "arguments",
            {"name": "move_right", "example": "wizard.move_right(3)"},
            1,
        ),
        (
            "wizard.say()",
            "arguments",
            {"name": "say", "example": 'wizard.say("Hello!")'},
            1,
        ),
        (
            "door.open(1, 2)",
            "arguments",
            {"name": "open", "example": "door.open()"},
            1,
        ),
        (
            "wizard.move_right(2)\nwizard.move_right\n",
            "not_called",
            {"object": "wizard", "name": "move_right", "example": "wizard.move_right(3)"},
            2,
        ),
        ("import js", "no_such_module", {"name": "js"}, 1),
        ("import spellbook", "no_such_module", {"name": "spellbook"}, 1),
        ("print(1 / 0)", "other", {"type": "ZeroDivisionError", "message": "division by zero"}, 1),
    ],
)
def test_each_error_is_explained(code, kind, params, line):
    explanation, at = explained(code)
    assert explanation["kind"] == kind
    if params is not None:
        assert explanation["params"] == params
    assert at == line


def test_naming_a_property_alone_is_not_an_error():
    assert run_code(LEVEL, "wizard.position\nwizard.move_right()").status == "incomplete"


def test_python_s_own_words_stay_beside_the_explanation():
    result = run_code(LEVEL, "wizrd.move_right(6)")
    assert result.error.type == "NameError"
    assert result.error.message == "name 'wizrd' is not defined"


def test_an_action_suggested_is_one_the_level_teaches():
    level = Level.from_dict({"id": "few", "map": ["S..."], "api": ["wizard.say"]})
    result = run_code(level, "wizard.sya('hi')")
    assert result.error.explanation["params"]["suggestion"] == "say"
    result = run_code(level, "wizard.move_rihgt()")
    assert "suggestion" not in result.error.explanation["params"]


def test_giving_the_wizard_a_method_of_one_s_own_is_told_apart_from_changing_one():
    # The owner's own try, from the acceptance test of sprint 3.
    code = (
        "import types\n"
        "def caminar_derecha(self):\n"
        "    self.position.x += 1\n"
        "wizard.caminar_derecha = types.MethodType(caminar_derecha, wizard)\n"
    )
    explanation, line = explained(code)
    assert explanation == {
        "kind": "no_new_attribute",
        "params": {"object": "wizard", "name": "caminar_derecha"},
    }
    assert line == 4
