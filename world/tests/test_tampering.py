"""The world refuses to be tampered with: a run is won by spells, not by setting things (D20)."""

import pytest
from kydux_world.level import Level
from kydux_world.run import run_code

CORRIDOR = Level.from_dict(
    {
        "id": "c",
        "map": ["#########", "#S.....D#", "#########"],
        "goals": [{"kind": "reach", "marker": "D"}],
    }
)


def test_setting_the_wizard_s_position_is_an_attribute_error():
    result = run_code(CORRIDOR, "wizard.position = (7, 1)")
    assert result.status == "error"
    assert result.error.type == "AttributeError"
    assert result.error.line == 1


@pytest.mark.parametrize(
    "code",
    [
        "wizard.facing = 'right'",
        "del wizard.position",
        "wizard.speed = 10",
        "wizard.move_right = None",
    ],
)
def test_nothing_of_the_child_s_objects_can_be_set_or_deleted(code):
    assert run_code(CORRIDOR, code).error.type == "AttributeError"


def test_the_world_is_out_of_the_child_s_sight():
    result = run_code(CORRIDOR, "print(hasattr(wizard, '_world'), 'world' in dir(wizard))")
    assert result.stdout == "False False\n"


def test_the_world_s_own_modules_are_refused_to_the_child():
    result = run_code(CORRIDOR, "import kydux_world")
    assert result.error.type == "ModuleNotFoundError"
    result = run_code(CORRIDOR, "from kydux_world.world import World")
    assert result.error.type == "ModuleNotFoundError"


def test_moving_the_wizard_from_behind_its_back_does_not_win():
    code = "from kydux_world.level import Position\n"  # refused, as above
    assert run_code(CORRIDOR, code).status == "error"
    code = (
        "object.__setattr__(wizard, '_k_position', type(wizard.position)(7, 1))\n"
        "wizard.say('here')\n"
    )
    result = run_code(CORRIDOR, code)
    assert result.status == "error"
    assert result.error.type == "WorldError"


def test_a_step_that_does_not_follow_on_is_found():
    code = (
        "wizard.move_right()\n"
        "object.__setattr__(wizard, '_k_position', type(wizard.position)(5, 1))\n"
        "wizard.move_right(2)\n"
    )
    result = run_code(CORRIDOR, code)
    assert result.status == "error"
    assert "does not follow on" in result.error.message


def test_an_honest_run_adds_up():
    assert run_code(CORRIDOR, "wizard.move_right(6)").status == "won"
    assert run_code(CORRIDOR, "wizard.move_right(3)\nwizard.move_left(2)").status == "incomplete"
    code = "wizard.move_right(9)\nwizard.move_left(2)\nwizard.move_right(2)"
    assert run_code(CORRIDOR, code).status == "won"
