#!/usr/bin/env python3
"""Keep every language in step, and every user-facing string in the i18n files.

    tools/i18n_check.py

Fails, printing file:line: message for each, on:
  - a key in one language's i18n/<lang>.json and not in another's;
  - a key the app uses, t('a.key'), that a language lacks;
  - a key no source uses, unless it starts with a prefix in tools/i18n_dynamic.txt
    (for keys made at run time, like `language.${lang}`);
  - a member of kydux_world.api's table without its words in the notebook,
    notebook.<role>.<member>, a kind of thing without its name, things.<kind>, or
    words for a member or a kind the world does not have;
  - a level, content/levels/<id>/, without a text.<lang>.json for every language
    in i18n/, or with texts whose keys differ, or with a different number of goals
    than its level.json, or a different number of hints in each language;
  - a choice for the wizard, {boy's words|girl's words}, with other than one bar,
    in any text for the player; and in Spanish, `mago` or `maga` outside a choice,
    so that no text speaks of a girl as a boy by oversight (D37);
  - a level's speaker without its name, characters.<speaker>, in a language;
  - a story, content/stories/<id>/, without a text.<lang>.json for every
    language, or with a title missing, or with other than one text for each
    step of its story.json (D74); or a figure who speaks in it, or its
    speaker, without its name in a language;
  - the screen's guide, content/guide/, without a text.<lang>.json for every
    language, or with steps that differ between languages, lack their words, or
    are not the steps GUIDE_STEPS in app/src/ui/guide.ts walks through, in order;
  - a string literal in the app's code that reads like words for a person (words
    separated by spaces, with a capitalised word or a sentence's final stop),
    which must come from t() instead. A line marked `// i18n-ignore` is left alone, and
    so are console messages, errors thrown for developers and imports.
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
I18N = REPO / "i18n"
SOURCES = REPO / "app" / "src"
DYNAMIC = REPO / "tools" / "i18n_dynamic.txt"
LEVELS = REPO / "content" / "levels"

KEY_USE = re.compile(r"""\bt\(\s*(['"])([\w.-]+)\1""")
LITERAL = re.compile(r"""'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`$]*)`""")
WORDS = re.compile(r"[A-Za-zÀ-ÿ]{2,}[,.!?:;]?\s+[A-Za-zÀ-ÿ]{2,}")
#: What makes words read like a sentence rather than code or class names.
SENTENCE = re.compile(r"(^|\s)[A-ZÀ-Þ][a-zß-ÿ]|[.!?…]$")
EXEMPT_LINE = re.compile(r"i18n-ignore|console\.|Error\(|^\s*import\s|^\s*//|^\s*/?\*")


def flatten(tree: dict, prefix: str = "") -> dict[str, str]:
    flat = {}
    for key, value in tree.items():
        name = f"{prefix}{key}"
        if isinstance(value, dict):
            flat.update(flatten(value, f"{name}."))
        else:
            flat[name] = value
    return flat


def catalogs() -> dict[str, dict[str, str]]:
    return {
        path.stem: flatten(json.loads(path.read_text(encoding="utf-8")))
        for path in sorted(I18N.glob("*.json"))
    }


def sources() -> list[Path]:
    return sorted(p for p in SOURCES.rglob("*.ts") if not p.name.endswith(".test.ts"))


def dynamic_prefixes() -> list[str]:
    if not DYNAMIC.is_file():
        return []
    return [
        line.strip()
        for line in DYNAMIC.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]


def check_levels(languages: list[str]) -> list[str]:
    findings = []
    if not LEVELS.is_dir():
        return findings
    for directory in sorted(p for p in LEVELS.iterdir() if (p / "level.json").is_file()):
        name = directory.relative_to(REPO).as_posix()
        goals = len(
            json.loads((directory / "level.json").read_text(encoding="utf-8")).get("goals", [])
        )
        texts = {}
        for lang in languages:
            path = directory / f"text.{lang}.json"
            if not path.is_file():
                findings.append(f"{name}: lacks text.{lang}.json")
                continue
            texts[lang] = flatten(json.loads(path.read_text(encoding="utf-8")))
        every_key = set().union(*(set(t) for t in texts.values())) if texts else set()
        for lang, text in texts.items():
            for key in sorted(every_key - set(text)):
                findings.append(f"{name}/text.{lang}.json: lacks {key}")
            said = text.get("goals")
            if not isinstance(said, list) or len(said) != goals:
                findings.append(
                    f"{name}/text.{lang}.json: {goals} goals in level.json, not as many here"
                )
        hints = {lang: len(text.get("hints", [])) for lang, text in texts.items()}
        if len(set(hints.values())) > 1:
            findings.append(f"{name}: a different number of hints in each language, {hints}")
    return findings


def check_speakers(languages: dict[str, dict[str, str]]) -> list[str]:
    """Every level's speaker has its name, characters.<speaker>, in every language (D45)."""
    findings = []
    for path in sorted(LEVELS.glob("*/level.json")):
        speaker = json.loads(path.read_text(encoding="utf-8")).get("speaker")
        if speaker is None:
            continue
        for lang, catalog in languages.items():
            if f"characters.{speaker}" not in catalog:
                where = path.relative_to(REPO).as_posix()
                findings.append(f"{where}: the speaker {speaker} has no name in i18n/{lang}.json")
    return findings


def check_stories(languages: dict[str, dict[str, str]]) -> list[str]:
    """Every story has its title and one text a step in every language, and every
    figure who speaks in it has its name (D74)."""
    findings = []
    for path in sorted((REPO / "content" / "stories").glob("*/story.json")):
        name = path.parent.relative_to(REPO).as_posix()
        story = json.loads(path.read_text(encoding="utf-8"))
        steps = story.get("steps", [])
        named = {step.get("who") for step in steps} - {"voice", "wizard"}
        if story.get("speaker"):
            named.add(story["speaker"])
        for lang, catalog in languages.items():
            text_path = path.parent / f"text.{lang}.json"
            if not text_path.is_file():
                findings.append(f"{name}: lacks text.{lang}.json")
                continue
            text = json.loads(text_path.read_text(encoding="utf-8"))
            if not text.get("title"):
                findings.append(f"{name}/text.{lang}.json: lacks a title")
            if len(text.get("steps", [])) != len(steps):
                findings.append(
                    f"{name}/text.{lang}.json: {len(steps)} steps in story.json, not as many here"
                )
            for who in sorted(map(str, named)):
                if f"characters.{who}" not in catalog:
                    findings.append(f"{name}: {who} has no name in i18n/{lang}.json")
    return findings


def check_guide(languages: list[str]) -> list[str]:
    """The screen's guide (D68) has the same steps in every language, each with its
    title and its words."""
    guide = REPO / "content" / "guide"
    findings, steps = [], {}
    for lang in languages:
        path = guide / f"text.{lang}.json"
        if not path.is_file():
            findings.append(f"content/guide: lacks text.{lang}.json")
            continue
        found = json.loads(path.read_text(encoding="utf-8")).get("steps", {})
        steps[lang] = list(found)
        for key, step in found.items():
            if not (isinstance(step, dict) and step.get("title") and step.get("text")):
                findings.append(f"content/guide/text.{lang}.json: {key} lacks its title or text")
    if len({tuple(keys) for keys in steps.values()}) > 1:
        findings.append("content/guide: the languages' steps differ")
    # The steps the screen walks through, GUIDE_STEPS in app/src/ui/guide.ts (12.6):
    # each has its words, and no words are for a step the screen does not have.
    source = (SOURCES / "ui" / "guide.ts").read_text(encoding="utf-8")
    listed = re.search(r"GUIDE_STEPS[^=]*=\s*\[(.*?)\];", source, re.S)
    shown = re.findall(r"key:\s*'([\w-]+)'", listed.group(1)) if listed else []
    for lang, keys in steps.items():
        if keys != shown:
            findings.append(
                f"content/guide/text.{lang}.json: steps {keys}, not GUIDE_STEPS' {shown}"
            )
    return findings


def check_chapters(languages: list[str]) -> list[str]:
    """Every chapter has its text, with its title, in every language."""
    chapters = REPO / "content" / "chapters"
    findings = []
    if not chapters.is_dir():
        return findings
    for directory in sorted(p for p in chapters.iterdir() if (p / "chapter.json").is_file()):
        name = directory.relative_to(REPO).as_posix()
        for lang in languages:
            path = directory / f"text.{lang}.json"
            if not path.is_file():
                findings.append(f"{name}: lacks text.{lang}.json")
            elif not json.loads(path.read_text(encoding="utf-8")).get("title"):
                findings.append(f"{name}/text.{lang}.json: lacks a title")
    return findings


#: Braces holding a bar: a choice for the wizard, well made or not.
BRACED_BAR = re.compile(r"\{[^{}\n]*\|[^{}\n]*\}")
#: The words for the wizard that Spanish genders; they belong inside a choice.
GENDERED = {"es": re.compile(r"\bmag[oa]\b", re.IGNORECASE)}
#: The words that choose the wizard's gender, which name it on purpose.
CHOOSE_GENDER = {"wizard.girl", "wizard.boy"}


def strings(value) -> list[str]:
    """Every string in a JSON value, however deep."""
    if isinstance(value, str):
        return [value]
    items = value.values() if isinstance(value, dict) else value if isinstance(value, list) else []
    return [text for item in items for text in strings(item)]


def player_texts(languages: dict[str, dict[str, str]]) -> list[tuple[str, str, str]]:
    """Every text for the player, as (language, where, text): the app's words, the
    levels', the chapters', the stories' and the lessons'."""
    texts = []
    for lang, catalog in languages.items():
        texts.extend(
            (lang, f"i18n/{lang}.json: {key}", text)
            for key, text in catalog.items()
            if key not in CHOOSE_GENDER
        )
    content = REPO / "content"
    for path in sorted([*content.glob("*/*/text.*.json"), *content.glob("guide/text.*.json")]):
        lang = path.name.split(".")[1]
        where = path.relative_to(REPO).as_posix()
        found = strings(json.loads(path.read_text(encoding="utf-8")))
        texts.extend((lang, where, text) for text in found)
    for path in sorted(content.glob("lessons/*/*.md")):
        where = path.relative_to(REPO).as_posix()
        texts.append((path.stem, where, path.read_text(encoding="utf-8")))
    return texts


def check_choices(languages: dict[str, dict[str, str]]) -> list[str]:
    """The choices for the wizard are well made, and Spanish genders the wizard only
    inside one (D37)."""
    findings = []
    for lang, where, text in player_texts(languages):
        for braced in BRACED_BAR.findall(text):
            if braced.count("|") != 1:
                findings.append(f"{where}: {braced!r} is a choice with other than two sides")
        gendered = GENDERED.get(lang)
        if gendered:
            for word in gendered.findall(BRACED_BAR.sub("", text)):
                findings.append(f"{where}: {word!r} outside a choice; write {{el mago|la maga}}")
    return findings


def check_world_words(languages: dict[str, dict[str, str]]) -> list[str]:
    """The words the page has for what the world defines, held to the world itself:
    notebook.<role>.<member> for every member of kydux_world.api's table (D30),
    notebook_simple.<role>.<member> for every action with a simple example (D60), and
    things.<kind> for every kind of thing in kydux_world.level, each language having
    them all and nothing more."""
    sys.path.insert(0, str(REPO / "world"))
    from kydux_world import api, level

    wanted = {
        f"notebook.{role}.{member}" for role, members in api.MEMBERS.items() for member in members
    }
    wanted |= {f"things.{kind}" for kind in level.THING_KINDS}
    # An action with a simple example has simple words too (D60).
    wanted |= {
        f"notebook_simple.{role}.{member['name']}"
        for role, members in api.table().items()
        for member in members
        if "simple" in member
    }
    findings = []
    for lang, catalog in languages.items():
        said = {
            key
            for key in catalog
            if (key.split(".")[0] in ("notebook", "notebook_simple") and key.count(".") == 2)
            or key.startswith("things.")
        }
        for key in sorted(wanted - said):
            findings.append(f"i18n/{lang}.json: lacks {key}, the words for it")
        for key in sorted(said - wanted):
            findings.append(f"i18n/{lang}.json: {key} names nothing the world has")
    return findings


def check() -> list[str]:
    findings = []
    languages = catalogs()
    if not languages:
        return [f"{I18N.relative_to(REPO)}: no language files"]
    every_key = set().union(*(set(c) for c in languages.values()))
    for lang, catalog in languages.items():
        for key in sorted(every_key - set(catalog)):
            findings.append(f"i18n/{lang}.json: lacks {key}")

    used: dict[str, str] = {}
    for path in sources():
        name = path.relative_to(REPO).as_posix()
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in KEY_USE.finditer(line):
                used.setdefault(match.group(2), f"{name}:{number}")
            if EXEMPT_LINE.search(line):
                continue
            keys_here = {m.start(2) - 1 for m in KEY_USE.finditer(line)}
            for literal in LITERAL.finditer(line):
                if literal.start() in keys_here:
                    continue
                text = next(g for g in literal.groups() if g is not None)
                if WORDS.search(text) and SENTENCE.search(text.strip()):
                    findings.append(
                        f"{name}:{number}: a string for people, {text[:40]!r}, not through t()"
                    )

    for key, where in sorted(used.items()):
        for lang, catalog in languages.items():
            if key not in catalog:
                findings.append(f"{where}: {key} is not in i18n/{lang}.json")

    findings.extend(check_levels(list(languages)))
    findings.extend(check_chapters(list(languages)))
    findings.extend(check_guide(list(languages)))
    findings.extend(check_speakers(languages))
    findings.extend(check_stories(languages))
    findings.extend(check_world_words(languages))
    findings.extend(check_choices(languages))

    prefixes = dynamic_prefixes()
    for key in sorted(every_key - set(used)):
        if not any(key.startswith(prefix) for prefix in prefixes):
            findings.append(f"i18n: {key} is used by nothing")
    return findings


def main() -> int:
    findings = check()
    for finding in findings:
        print(finding, file=sys.stderr)
    if not findings:
        print(f"i18n: {len(catalogs())} languages in step")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
