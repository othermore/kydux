"""The published game: one policy in every place that states it, and ci/publish.sh.

The Content-Security-Policy of the game's own servers is written in three files, and
the published game's in two (D14, D19, D329): each must say what the others say. The
script's test makes a scratch repository with a copy of ci/publish.sh, a bare
repository to publish to and a folder that stands for the build, and runs
`ci/publish.sh --dry-run`, which pushes nothing and runs at any hour.
"""

import re
import shutil
import subprocess
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
HOST = "kydux.kidux.org"


def read(path: str) -> str:
    return (REPO / path).read_text(encoding="utf-8")


def constant(name: str) -> str:
    """A string constant of the service worker."""
    found = re.search(rf'const {name} =\s*"([^"]+)";', read("app/public/isolate.js"))
    assert found, name
    return found.group(1)


def own_policy() -> str:
    return constant("OWN")


def published_policy() -> str:
    return constant("PUBLISHED")


def test_the_development_server_sends_the_own_policy() -> None:
    config = read("app/vite.config.ts")
    block = config[config.index("const contentSecurityPolicy = [") :]
    block = block[: block.index("].join('; ')")]
    assert "; ".join(re.findall(r'"([^"]+)"', block)) == own_policy()


def test_nginx_sends_the_own_policy() -> None:
    header = r'add_header Content-Security-Policy "([^"]+)" always;'
    found = re.search(header, read("deploy/nginx-kydux.conf"))
    assert found
    assert found.group(1) == own_policy()


def test_the_page_states_the_published_policy() -> None:
    meta = r'<meta http-equiv="Content-Security-Policy" content="([^"]+)">'
    found = re.search(meta, read("app/index.html"))
    assert found
    # A page's own policy cannot say who may frame it: the header alone does.
    assert found.group(1) + "; frame-ancestors 'none'" == published_policy()


def test_the_published_policy_is_the_own_one_and_the_counting_hosts() -> None:
    own = own_policy().split("; ")
    published = published_policy().split("; ")
    assert len(own) == len(published)
    opened = {}
    for strict, wide in zip(own, published, strict=True):
        assert wide.startswith(strict)
        if wide != strict:
            opened[strict.split()[0]] = wide[len(strict) :].split()
    assert sorted(opened) == ["connect-src", "img-src", "script-src"]
    for hosts in opened.values():
        assert all(host.startswith("https://") for host in hosts)
    assert opened["script-src"] == ["https://*.googletagmanager.com"]
    assert "https://kidux.goatcounter.com" in opened["img-src"]


def test_the_published_host_is_one_everywhere() -> None:
    site = re.search(r"hosts: \[([^\]]*)\]", read("app/src/analytics/site.ts"))
    worker = re.search(r"const PUBLISHED_HOSTS = \[([^\]]*)\];", read("app/public/isolate.js"))
    assert site and worker
    assert site.group(1) == worker.group(1) == f"'{HOST}'"
    assert f"\nHOST={HOST}\n" in read("ci/publish.sh")


def git(where: Path, *args: str) -> str:
    done = subprocess.run(["git", *args], cwd=where, check=True, capture_output=True, text=True)
    return done.stdout.strip()


@pytest.fixture
def scratch(tmp_path: Path) -> Path:
    git(tmp_path, "init", "-q", "--bare", "-b", "main", str(tmp_path / "pages.git"))
    work = tmp_path / "work"
    (work / "ci").mkdir(parents=True)
    (work / "app").mkdir()
    git(work, "init", "-q", "-b", "main")
    git(work, "config", "user.name", "test")
    git(work, "config", "user.email", "test@example.org")
    shutil.copy(REPO / "ci" / "publish.sh", work / "ci" / "publish.sh")
    (work / ".gitignore").write_text("ci/\n")
    (work / "app" / "package.json").write_text('{"version": "0.1.0"}\n')
    git(work, "add", ".gitignore", "app/package.json")
    git(work, "commit", "-q", "-m", "Start")
    built = tmp_path / "dist"
    (built / "assets").mkdir(parents=True)
    (built / "index.html").write_text("<!doctype html>\n")
    (built / "assets" / "main.js").write_text("// built\n")
    (built / "assets" / "main.js.map").write_text("{}\n")
    return work


def publish(work: Path) -> subprocess.CompletedProcess:
    tmp = work.parent
    return subprocess.run(
        ["sh", str(work / "ci" / "publish.sh"), "--dry-run"],
        cwd=work,
        capture_output=True,
        text=True,
        env={
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "HOME": str(tmp),
            "TMPDIR": str(tmp),
            "KYDUX_PAGES_REMOTE": str(tmp / "pages.git"),
            "KYDUX_PAGES_DIST": str(tmp / "dist"),
        },
    )


def site_of(done: subprocess.CompletedProcess) -> Path:
    found = re.search(r"The commit is in (.+)$", done.stdout, re.MULTILINE)
    assert found, done.stdout + done.stderr
    return Path(found.group(1))


def test_a_publication_is_the_build_with_its_name_and_no_maps(scratch: Path) -> None:
    done = publish(scratch)
    assert done.returncode == 0, done.stderr
    site = site_of(done)
    files = sorted(git(site, "ls-files").splitlines())
    assert files == [".nojekyll", "CNAME", "assets/main.js", "index.html"]
    assert (site / "CNAME").read_text() == f"{HOST}\n"
    assert git(site, "rev-parse", "--abbrev-ref", "HEAD") == "gh-pages"
    head = git(scratch, "rev-parse", "--short", "HEAD")
    assert git(site, "log", "-1", "--format=%s") == f"Publish version 0.1.0 ({head})"
    assert git(site, "log", "-1", "--format=%an <%ae>") == "test <test@example.org>"
    # Nothing was pushed.
    assert git(scratch.parent / "pages.git", "branch", "--list") == ""


def test_a_publication_goes_on_top_of_the_branchs_last(scratch: Path) -> None:
    first = site_of(publish(scratch))
    git(first, "push", "-q", "origin", "gh-pages")
    was = git(first, "rev-parse", "HEAD")
    (scratch.parent / "dist" / "assets" / "main.js").write_text("// built again\n")
    second = site_of(publish(scratch))
    assert git(second, "rev-parse", "HEAD^") == was
    assert (second / "assets" / "main.js").read_text() == "// built again\n"
    # The same build once more is nothing to publish.
    git(second, "push", "-q", "origin", "gh-pages")
    again = publish(scratch)
    assert again.returncode == 0
    assert "nothing to publish" in again.stdout


def test_a_tree_with_changes_is_not_published(scratch: Path) -> None:
    (scratch / "app" / "package.json").write_text('{"version": "0.1.1"}\n')
    done = publish(scratch)
    assert done.returncode == 2
    assert "not committed" in done.stderr
