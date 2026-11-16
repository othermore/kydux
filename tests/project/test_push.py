"""ci/push.sh refuses a version tag on a commit of another version (D179).

Each test makes a scratch repository with a copy of ci/push.sh and a bare origin
beside it, and runs only the tags' check (`ci/push.sh --tags`), which pushes
nothing and runs at any hour.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]


def git(where: Path, *args: str) -> str:
    done = subprocess.run(["git", *args], cwd=where, check=True, capture_output=True, text=True)
    return done.stdout.strip()


def commit_version(where: Path, version: str) -> None:
    (where / "app").mkdir(exist_ok=True)
    (where / "app" / "package.json").write_text(json.dumps({"version": version}) + "\n")
    git(where, "add", "app/package.json")
    git(where, "commit", "-q", "-m", f"Version {version}")


@pytest.fixture
def scratch(tmp_path: Path) -> Path:
    origin = tmp_path / "origin.git"
    git(tmp_path, "init", "-q", "--bare", "-b", "main", str(origin))
    work = tmp_path / "work"
    work.mkdir()
    git(work, "init", "-q", "-b", "main")
    git(work, "config", "user.name", "test")
    git(work, "config", "user.email", "test@example.org")
    git(work, "remote", "add", "origin", str(origin))
    (work / "ci").mkdir()
    shutil.copy(REPO / "ci" / "push.sh", work / "ci" / "push.sh")
    (work / ".gitignore").write_text("ci/\n")
    git(work, "add", ".gitignore")
    git(work, "commit", "-q", "-m", "Start")
    return work


def check(work: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["sh", str(work / "ci" / "push.sh"), "--tags"],
        cwd=work,
        capture_output=True,
        text=True,
    )


def test_a_tag_on_its_versions_commit_is_let_through(scratch: Path) -> None:
    commit_version(scratch, "0.0.6")
    git(scratch, "tag", "-a", "v0.0.6", "-m", "Version 0.0.6")
    done = check(scratch)
    assert done.returncode == 0, done.stderr
    assert "each on their version's commit" in done.stdout


def test_a_tag_on_a_commit_of_another_version_is_refused(scratch: Path) -> None:
    commit_version(scratch, "0.0.5")
    (scratch / "notes.txt").write_text("more work\n")
    git(scratch, "add", "notes.txt")
    git(scratch, "commit", "-q", "-m", "More work")
    git(scratch, "tag", "-a", "v0.0.6", "-m", "Version 0.0.6")
    done = check(scratch)
    assert done.returncode == 2
    assert "v0.0.6" in done.stderr
    assert "says version 0.0.5, not 0.0.6" in done.stderr
    assert "version commit first" in done.stderr


def test_a_tag_already_on_origin_is_not_looked_at(scratch: Path) -> None:
    commit_version(scratch, "0.0.5")
    (scratch / "notes.txt").write_text("more work\n")
    git(scratch, "add", "notes.txt")
    git(scratch, "commit", "-q", "-m", "More work")
    git(scratch, "tag", "-a", "v0.0.4", "-m", "Version 0.0.4")
    git(scratch, "push", "-q", "--follow-tags", "origin", "main")
    done = check(scratch)
    assert done.returncode == 0, done.stderr


def test_a_light_tag_is_no_version_tag(scratch: Path) -> None:
    commit_version(scratch, "0.0.5")
    git(scratch, "tag", "v-trial")
    done = check(scratch)
    assert done.returncode == 0, done.stderr
