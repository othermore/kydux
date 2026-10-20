from kydux_world.run import run_script


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
