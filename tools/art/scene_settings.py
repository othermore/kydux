"""A scene's settings (D82): everything the cut and the export need of a painted
scene that is the scene's own, not the method's, read from
art/scenes/<scene>/cut.json. tools/art/export_scene.py and tools/art/sweep.py
take a scene by its id and read it here; a setting left out is the field's,
the defaults in image_first.py."""

import json
from dataclasses import dataclass
from pathlib import Path

import image_first

REPO = Path(__file__).resolve().parents[2]
#: Each scene's settings, art/scenes/<scene>/cut.json.
SCENES = REPO / "art" / "scenes"
#: Where the export puts what it works on, in art/raw/, which git ignores.
WORK = REPO / "art" / "raw" / "game"


@dataclass
class Settings:
    """A scene's settings (D82), read from its cut.json: what is its own, not the
    method's. A thing is what opens or is picked up: its box in cells (x0, y0, x1,
    y1), the row its foot stands on, whether it is solid, the edit without it, and
    its states, each the picture showing it, against that edit (`painting` for the
    painting itself, None for nothing drawn), with `hull`, `reach`, `largest`,
    `whole_box` and `rune` where it needs them. A patch of the ground is a box in
    the page's pixels (x0, y0, x1, y1), filled from the band of the same height
    right above it, faded into it: where an edit without a thing left a trace of it.
    What the cut is told of the painting where it asks it (D93, D94): `grounds`,
    the parts given back to the ground; `kept`, the parts whose things stay whole
    whatever the ground beside them; `whole`, the parts whose things' holes are
    filled; `rows`, the parts whose things stand on a
    row; each a box or a polygon in cells. `checks`, when given, are the kinds of
    problem the sweep holds the scene to."""

    id: str
    data: dict

    @property
    def folder(self) -> Path:
        return REPO / self.data["sources"]["folder"]

    @property
    def edits(self) -> Path:
        return REPO / self.data["sources"]["edits"]

    @property
    def painting(self) -> Path:
        return self.folder / self.data["sources"]["painting"]

    @property
    def ground_only(self) -> Path:
        return self.folder / self.data["sources"]["ground"]

    @property
    def grid(self) -> dict:
        return json.loads((self.folder / self.data["sources"]["grid"]).read_text())

    @property
    def things(self) -> dict[str, dict]:
        return {
            name: {**thing, "box": tuple(thing["box"])}
            for name, thing in self.data.get("things", {}).items()
        }

    @property
    def thresholds(self) -> dict:
        """The colours the scene is read by, the field's where it gives none."""
        return image_first.thresholds(self.data.get("thresholds"))

    @property
    def patches(self) -> list[tuple[int, int, int, int]]:
        return [tuple(patch) for patch in self.data.get("patches", [])]

    @property
    def map(self) -> Path:
        return REPO / "content" / "scenes" / self.id / "map.txt"

    @property
    def out(self) -> Path:
        return REPO / "content" / "art" / "scenes" / self.id

    @property
    def src(self) -> Path:
        """Where the cut's pictures are put for image_first.py."""
        return WORK / f"{self.id}-src"

    @property
    def cut(self) -> Path:
        """Where image_first.py writes the cut."""
        return WORK / f"{self.id}-cut"

    def marks(self) -> list[str]:
        return [row for row in self.map.read_text().splitlines() if row]


def settings(scene_id: str) -> Settings:
    path = SCENES / scene_id / "cut.json"
    return Settings(scene_id, json.loads(path.read_text(encoding="utf-8")))


def scenes() -> list[str]:
    """Every scene with settings."""
    return sorted(path.parent.name for path in SCENES.glob("*/cut.json"))
