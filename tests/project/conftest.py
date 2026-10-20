import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools"))

import forbidden  # noqa: E402


@pytest.fixture
def repo_root() -> Path:
    return REPO


def tracked_files() -> list[Path]:
    return forbidden.tracked_files(REPO)


def tracked_text() -> list[tuple[str, str]]:
    """Every tracked or new file that is text, as (path from the root, content)."""
    found = []
    for path in tracked_files():
        text = forbidden.read_text(path)
        if text is not None:
            found.append((path.relative_to(REPO).as_posix(), text))
    return found
