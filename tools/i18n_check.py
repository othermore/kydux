#!/usr/bin/env python3
"""Keep every language in step, and every user-facing string in the i18n files.

    tools/i18n_check.py

Fails, printing file:line: message for each, on:
  - a key in one language's i18n/<lang>.json and not in another's;
  - a key the app uses, t('a.key'), that a language lacks;
  - a key no source uses, unless it starts with a prefix in tools/i18n_dynamic.txt
    (for keys made at run time, like `language.${lang}`);
  - a string literal in the app's code that reads like words for a person, which
    must come from t() instead. A line marked `// i18n-ignore` is left alone, and
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

KEY_USE = re.compile(r"""\bt\(\s*(['"])([\w.-]+)\1""")
LITERAL = re.compile(r"""'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`$]*)`""")
WORDS = re.compile(r"[A-Za-zÀ-ÿ]{2,}[,.!?:;]?\s+[A-Za-zÀ-ÿ]{2,}")
EXEMPT_LINE = re.compile(r"i18n-ignore|console\.|Error\(|^\s*import\s|^\s*//|^\s*\*")


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
                if WORDS.search(text):
                    findings.append(
                        f"{name}:{number}: a string for people, {text[:40]!r}, not through t()"
                    )

    for key, where in sorted(used.items()):
        for lang, catalog in languages.items():
            if key not in catalog:
                findings.append(f"{where}: {key} is not in i18n/{lang}.json")

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
