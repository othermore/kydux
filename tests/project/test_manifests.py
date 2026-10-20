"""Every piece of art and sound says where it comes from, who made it, and its licence.

Each directory under art/ and sound/ that holds assets has a manifest.toml
with one table per file:

    ["wizard.png"]
    source = "generated: gemini-3-pro-image, prompts/wizard.txt"
    author = "Kydux contributors"
    licence = "GPL-3.0-or-later"

art/raw/, the unreviewed output of the tools, stays out of the repository.
"""

import tomllib

from conftest import REPO, tracked_files

REQUIRED = ("source", "author", "licence")
ASSET_ROOTS = ("art", "sound")


def _assets():
    for path in tracked_files():
        relative = path.relative_to(REPO)
        if relative.parts[0] in ASSET_ROOTS and relative.name != "manifest.toml":
            if relative.name in ("README.md",) or relative.suffix in (".txt", ".py"):
                continue
            yield relative


def test_every_asset_is_in_its_manifest():
    findings = []
    manifests = {}
    for asset in _assets():
        if "raw" in asset.parts:
            findings.append(f"{asset}: raw output is not committed")
            continue
        manifest_path = REPO / asset.parent / "manifest.toml"
        if manifest_path not in manifests:
            manifests[manifest_path] = (
                tomllib.loads(manifest_path.read_text(encoding="utf-8"))
                if manifest_path.is_file()
                else None
            )
        manifest = manifests[manifest_path]
        if manifest is None:
            findings.append(f"{asset}: no manifest.toml beside it")
            continue
        entry = manifest.get(asset.name)
        if entry is None:
            findings.append(f"{asset}: not in {asset.parent}/manifest.toml")
            continue
        missing = [key for key in REQUIRED if not entry.get(key)]
        if missing:
            findings.append(f"{asset}: its entry lacks {', '.join(missing)}")
    assert not findings, "\n".join(findings)
