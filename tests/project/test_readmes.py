"""README.md and README.es.md say the same things: one is the other's translation."""

import re
from collections import Counter
from urllib.parse import urlparse

HEADING = re.compile(r"^(#{1,6})\s", re.MULTILINE)
IMAGE = re.compile(r"!\[[^\]]*\]\(([^)\s]+)")
LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)")
READMES = {"README.md", "README.es.md"}


def _read(repo_root, name):
    return (repo_root / name).read_text(encoding="utf-8")


def test_the_same_headings_in_the_same_order(repo_root):
    en, es = (_read(repo_root, name) for name in ("README.md", "README.es.md"))
    assert HEADING.findall(en) == HEADING.findall(es)


def test_the_same_pictures(repo_root):
    # Each shows its own language's pictures, under images/en/ and images/es/.
    en, es = (_read(repo_root, name) for name in ("README.md", "README.es.md"))
    assert IMAGE.findall(en) == [p.replace("/es/", "/en/") for p in IMAGE.findall(es)]


def _link_places(text):
    """Where the links lead, by site for a web address, leaving out the other README."""
    places = Counter()
    for target in LINK.findall(text):
        if target in READMES:
            continue
        url = urlparse(target)
        places[url.netloc or target.split("#")[0]] += 1
    return places


def test_links_to_the_same_places(repo_root):
    en, es = (_read(repo_root, name) for name in ("README.md", "README.es.md"))
    assert _link_places(en) == _link_places(es)
