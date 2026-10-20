"""No forbidden word in the repository (tools/forbidden.py), and the matcher's rules."""

import forbidden
import pytest

# A made-up word stands in for the real ones, which cannot be written here.
SAMPLE = forbidden.entries("# a comment\n\nzorblax\nZorb Lax\nquintar wand\n")
PATTERNS = [forbidden.pattern(entry) for entry in SAMPLE]


def test_entries_are_reduced_to_their_letters_once():
    assert SAMPLE == ["zorblax", "quintarwand"]


@pytest.mark.parametrize(
    "text",
    [
        "zorblax",
        "ZorbLax",
        "ZORBLAX is a game",
        "Zorb-Lax",
        "zorb_lax",
        "Zorb Lax",
        "z.o.r.b.l.a.x",
        "**Zorb**lax",
        "the zorblax.com site",
        "Zórblax",
        "a Quintar Wand",
        "quintar-wand",
    ],
)
def test_the_matcher_catches_every_spelling(text):
    assert forbidden.matches(text, PATTERNS)


@pytest.mark.parametrize("text", ["zorb", "lax zorb", "zor    blax", "quintar's broom wand"])
def test_the_matcher_leaves_other_text(text):
    assert not forbidden.matches(text, PATTERNS)


def test_a_finding_names_the_line_and_never_the_word():
    findings = list(forbidden.scan_text("notes.md", "one\nThe Zorb-Lax game\nthree", PATTERNS))
    assert [str(f) for f in findings] == ["notes.md:2: a forbidden word"]


def test_a_word_split_across_lines_is_found():
    assert list(forbidden.scan_text("x.md", "the zorb\nlax", PATTERNS))


def _patterns():
    patterns = forbidden.load()
    if patterns is None:
        pytest.skip(f"no forbidden list at {forbidden.list_path()} (expected in CI)")
    return patterns


def test_no_tracked_file_holds_a_forbidden_word(repo_root):
    findings = forbidden.scan_files(_patterns(), repo_root)
    assert not findings, "\n".join(map(str, findings))


def test_no_commit_message_holds_a_forbidden_word(repo_root):
    findings = forbidden.scan_history(_patterns(), repo_root)
    assert not findings, "\n".join(map(str, findings))
