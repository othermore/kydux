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
#: How much lower a figure is drawn on a floor row right under a wall's foot, so that it
#: stands in the corridor and not on the wall (D149).
LOWERED_ROW = 0.3
#: The kinds of thing that open and close: a door and a hole (D167). Either may have
#: an `open` state and a `closed` one; what each is follows from its kind, never from
#: the states it happens to have.
KINDS = ("door", "hole")
#: The states that only a thing of one of KINDS has.
OPENING_STATES = ("open", "closed", "ajar")


@dataclass
class Settings:
    """A scene's settings (D82), read from its cut.json: what is its own, not the
    method's. A thing is what opens or is picked up: its box in cells (x0, y0, x1,
    y1), the row its foot stands on, whether it is solid, the edit without it, and
    its states, each the picture showing it, against that edit (`painting` for the
    painting itself, None for nothing drawn), with `hull`, `reach`, `largest`,
    `whole_box` and `rune` where it needs them, and its `kind`, `door` or `hole`, when it
    opens and closes (D167). A patch of the ground is a box in
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

    @property
    def lowered(self) -> list[dict]:
        """The cells a figure is drawn lower on: the ranges named, then each row named."""
        columns = len(self.marks()[0])
        whole = [
            {
                "about": "The floor row right under a wall's foot (D149).",
                "cells": [[0, row], [columns - 1, row]],
                "by": LOWERED_ROW,
            }
            for row in self.data.get("lowered_rows", [])
        ]
        return [*self.data.get("lowered", []), *whole]

    def refuse_unkinded(self) -> None:
        """A thing that opens and closes says whether it is a door or a hole (`kind`),
        and only such a thing has a kind (D167)."""
        for name, thing in self.things.items():
            kind = thing.get("kind")
            if kind is not None and kind not in KINDS:
                raise ValueError(f"{self.id}: {name} is of no kind that opens: {kind}")
            if kind is None and set(thing.get("states") or {}) & set(OPENING_STATES):
                raise ValueError(
                    f"{self.id}: {name} opens and closes but names no kind, door or hole"
                )

    def refuse_loose_feathers(self) -> None:
        """Only a state of a thing lying in the floor softens its mask's edge (`feather`,
        D287): it lies under every figure, and nothing is seen through it; whatever a
        figure walks behind keeps a mask of 0 or 1 (D155)."""
        for name, thing in self.things.items():
            if "feather" in (thing.get("diff") or {}):
                raise ValueError(f"{self.id}: {name} feathers its own mask, and only a state may")
            for state, picture in (thing.get("states") or {}).items():
                feathers = isinstance(picture, dict) and "feather" in (picture.get("diff") or {})
                if feathers and not thing.get("lying"):
                    raise ValueError(
                        f"{self.id}: {name}'s {state} is feathered, and {name} does not lie "
                        "in the floor"
                    )

    def refuse_long_nudges(self) -> None:
        """A figure walks its own column; only the cells round a door or an arch are
        nudged, never a whole column or row (D149); and a thing the game draws is shifted
        on a few cells by painted furniture, never a whole column or row (D207)."""
        marks = self.marks()
        for key, what in (("nudged", "nudge"), ("shifted", "shift")):
            for part in self.data.get(key, []):
                (x0, y0), (x1, y1) = part["cells"]
                if y1 - y0 + 1 >= len(marks) or x1 - x0 + 1 >= len(marks[0]):
                    raise ValueError(
                        f"{self.id}: a {what} over a whole column or row: {part['cells']}"
                    )


def settings(scene_id: str) -> Settings:
    path = SCENES / scene_id / "cut.json"
    found = Settings(scene_id, json.loads(path.read_text(encoding="utf-8")))
    found.refuse_long_nudges()
    found.refuse_unkinded()
    found.refuse_loose_feathers()
    return found


def scenes() -> list[str]:
    """Every scene with settings."""
    return sorted(path.parent.name for path in SCENES.glob("*/cut.json"))
