import json

from kydux_world.level import Level
from kydux_world.run import run_code, run_level_json, run_script


def test_print_is_captured():
    result = run_script('print("Hello, Kydux!")\nprint(1 + 1)')
    assert result["status"] == "ok"
    assert result["stdout"] == "Hello, Kydux!\n2\n"
    assert result["error"] is None


def test_an_error_names_its_type_message_and_the_child_s_line():
    result = run_script("x = 1\nprint(y)\n")
    assert result["status"] == "error"
    assert result["error"] == {
        "type": "NameError",
        "message": "name 'y' is not defined",
        "line": 2,
        "explanation": None,
    }


def test_an_error_inside_a_function_points_at_the_innermost_child_line():
    result = run_script("def f():\n    return 1 / 0\n\nf()\n")
    assert result["error"]["type"] == "ZeroDivisionError"
    assert result["error"]["line"] == 2


def test_a_syntax_error_has_its_line():
    result = run_script("print(1)\nprint((2)\n")
    assert result["status"] == "error"
    assert result["error"]["type"] == "SyntaxError"
    assert result["error"]["line"] == 2


def test_an_interrupt_is_reported_as_such():
    result = run_script("raise KeyboardInterrupt")
    assert result["status"] == "interrupted"
    assert result["error"] is None


def test_each_run_starts_afresh():
    run_script("leftover = 1")
    assert run_script("print(leftover)")["error"]["type"] == "NameError"


# Running in a level.

CORRIDOR = Level.from_dict(
    {
        "id": "c",
        "map": ["#######", "#S...D#", "#######"],
        "goals": [{"kind": "reach", "marker": "D"}],
        "tick_limit": 20,
    }
)


def test_reaching_the_goal_wins():
    result = run_code(CORRIDOR, "wizard.move_right(4)")
    assert result.status == "won"
    assert result.ticks == 4
    assert [g.met_at_tick for g in result.goals] == [4]


def test_falling_short_is_incomplete():
    result = run_code(CORRIDOR, "wizard.move_right(2)")
    assert result.status == "incomplete"
    assert result.goals[0].met is False


def test_an_error_keeps_the_events_before_it_and_its_line():
    result = run_code(CORRIDOR, "wizard.move_right(2)\nwizard.mvoe_right()\n")
    assert result.status == "error"
    assert result.error.type == "AttributeError"
    assert result.error.line == 2
    assert len(result.events) == 2


def test_a_syntax_error_has_no_events():
    result = run_code(CORRIDOR, "wizard.move_right(\n")
    assert result.status == "error"
    assert result.error.type == "SyntaxError"
    assert result.events == []


def test_the_tick_limit_ends_the_run():
    result = run_code(CORRIDOR, "while True:\n    wizard.say('again')\n")
    assert result.status == "too_many_ticks"
    assert result.ticks == 20
    assert len(result.events) == 20


def test_a_win_after_the_goal_still_counts_when_the_code_goes_on():
    assert run_code(CORRIDOR, "wizard.move_right(4)\nwizard.move_left()").status == "won"


def test_print_is_captured_in_a_level():
    assert run_code(CORRIDOR, "print('here')").stdout == "here\n"


def test_the_child_has_only_the_wizard():
    result = run_code(CORRIDOR, "print(sorted(k for k in globals() if not k.startswith('__')))")
    assert result.stdout == "['wizard']\n"


def test_the_worker_s_call_speaks_json():
    level = {"id": "j", "map": ["S.D"], "goals": [{"kind": "reach", "marker": "D"}]}
    result = json.loads(run_level_json(json.dumps(level), "wizard.move_right(2)"))
    assert result["status"] == "won"
    assert result["events"][0] == {
        "tick": 1,
        "actor": "wizard",
        "kind": "move",
        "data": {"from": [0, 0], "to": [1, 0], "facing": "right"},
        "line": 1,
    }
    assert result["goals"] == [
        {
            "kind": "reach",
            "params": {"marker": "D"},
            "met": True,
            "met_at_tick": 2,
            "failed": False,
            "failed_at_tick": None,
            "bonus": False,
        }
    ]
