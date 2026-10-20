import sys
from types import ModuleType

import pytest
from kydux_world import sandbox
from kydux_world.level import Level
from kydux_world.run import run_code, run_script

LEVEL = Level.from_dict({"id": "s", "map": ["S."]})


@pytest.mark.parametrize(
    "name",
    ["js", "pyodide", "pyodide.ffi", "pyodide_js", "_pyodide", "_pyodide._base", "micropip"],
)
def test_the_bridge_to_javascript_is_blocked(name):
    assert sandbox.blocked(name)


@pytest.mark.parametrize("name", ["json", "math", "random", "jsonschema", "pyodidex", "my_js"])
def test_other_modules_are_not(name):
    assert not sandbox.blocked(name)


@pytest.mark.parametrize("code", ["import js", "from pyodide.ffi import to_js", "import micropip"])
def test_the_child_s_code_cannot_import_them(code):
    result = run_script(code)
    assert result["error"]["type"] == "ModuleNotFoundError"
    assert result["error"]["line"] == 1


def test_not_even_when_they_are_loaded(monkeypatch):
    monkeypatch.setitem(sys.modules, "js", ModuleType("js"))
    result = run_code(LEVEL, "import js\nprint(js)")
    assert result.status == "error"
    assert result.error.type == "ModuleNotFoundError"
    assert result.stdout == ""


def test_the_standard_library_is_the_child_s_to_use():
    result = run_script("import math, random, json\nprint(math.floor(2.5))")
    assert result["status"] == "ok"
    assert result["stdout"] == "2\n"


def test_install_takes_the_bridge_out_of_sys_modules_and_refuses_it(monkeypatch):
    monkeypatch.setattr(sys, "meta_path", list(sys.meta_path))
    monkeypatch.setattr(sandbox, "_installed", False)
    for name in ("js", "pyodide", "pyodide.ffi", "_pyodide", "_pyodide._base"):
        monkeypatch.setitem(sys.modules, name, ModuleType(name))
    sandbox.install()
    assert "js" not in sys.modules
    assert "pyodide.ffi" not in sys.modules
    assert "_pyodide._base" in sys.modules, "Pyodide's own machinery stays loaded"
    assert isinstance(sys.meta_path[0], sandbox.Refuser)
    with pytest.raises(ModuleNotFoundError):
        __import__("js")
    sandbox.install()
    assert sum(isinstance(f, sandbox.Refuser) for f in sys.meta_path) == 1
