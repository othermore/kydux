import kydux_world
from kydux_world.level import Level


def test_the_package_has_a_version():
    assert kydux_world.__version__


def test_a_level_has_an_id():
    assert Level(id="01-the-corridor").id == "01-the-corridor"
