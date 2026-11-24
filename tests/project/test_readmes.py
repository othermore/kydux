"""README.md and README.es.md say the same things: one is the other's translation.

Each says under its title the family Kydux belongs to, with the address the game's
own link has in that language, and so does the developer documentation's first page
(D338). Each has, under that line, the button of a donation, which leads where the
repository's own Sponsor button does (D340).
"""

import json
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


def _kidux(repo_root, language):
    texts = json.loads(_read(repo_root, f"i18n/{language}.json"))
    return texts["app"]["kidux_url"]


def test_each_page_says_the_family_under_its_title(repo_root):
    pages = {
        "README.md": ("en", "Part of the [Kidux]({}) family"),
        "README.es.md": ("es", "De la familia [Kidux]({})"),
        "docs/dev/README.md": ("en", "Kydux is part of the [Kidux]({}) family."),
    }
    for name, (language, line) in pages.items():
        top = _read(repo_root, name).split("\n")[:4]
        assert top[0].startswith("# "), name
        said = line.format(_kidux(repo_root, language))
        assert any(said in text for text in top[1:]), name


def test_each_readme_has_the_donation_button_of_the_repository(repo_root):
    funding = _read(repo_root, ".github/FUNDING.yml")
    account = re.search(r"^github: (\S+)$", funding, re.MULTILINE).group(1)
    button = (
        f'<a href="https://github.com/sponsors/{account}"><img src="https://img.shields.io/badge/'
    )
    for name in sorted(READMES):
        top = _read(repo_root, name).split("\n")[:6]
        assert any(text.startswith(button) for text in top), name
