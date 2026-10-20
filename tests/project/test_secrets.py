"""No secret in the repository: nothing shaped like a key, and none of this machine's values.

A failure names the file and the line, or the name of the secret, never its value.
"""

import re
from pathlib import Path

import pytest
from conftest import tracked_text

SECRETS_FILE = Path.home() / ".config" / "kydux" / "secrets.env"

SHAPES = {
    "a Google API key": re.compile(r"AIza[0-9A-Za-z_-]{35}"),
    "a GitHub token": re.compile(r"gh[pousr]_[0-9A-Za-z]{30,}"),
    "an API secret key": re.compile(r"sk-[0-9A-Za-z]{20,}"),
    "a private key": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY"),
    "a password or key written out": re.compile(
        r"(?i)(api[_-]?key|password|secret)\s*[:=]\s*['\"][^'\"\s]{8,}['\"]"
    ),
}


def test_nothing_shaped_like_a_secret():
    findings = [
        f"{name}:{number}: {shape}"
        for name, text in tracked_text()
        for number, line in enumerate(text.splitlines(), 1)
        for shape, pattern in SHAPES.items()
        if pattern.search(line)
    ]
    assert not findings, "\n".join(findings)


def _secret_values() -> dict[str, str]:
    if not SECRETS_FILE.is_file():
        pytest.skip(f"no {SECRETS_FILE} on this machine")
    values = {}
    for line in SECRETS_FILE.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            name, value = line.split("=", 1)
            value = value.strip().strip("'\"")
            if len(value) >= 8:
                values[name.strip()] = value
    return values


def test_no_value_of_this_machine_s_secrets():
    values = _secret_values()
    findings = [
        f"{path}: the value of {name}"
        for path, text in tracked_text()
        for name, value in values.items()
        if value in text
    ]
    assert not findings, "\n".join(findings)
