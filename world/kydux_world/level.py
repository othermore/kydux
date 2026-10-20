"""A level: its map, where the wizard starts, and what it asks of them.

A level is read from its level.json. The map is rows of characters for now:
`#` a wall, `.` floor, `S` where the wizard starts, and any other letter a
floor tile that goals may name by that letter (a marker), like `D` for the
door. Positions are (x, y) from the top-left corner, x to the right and y
down.
"""

import json
from dataclasses import dataclass, field
from typing import Any, NamedTuple


class Position(NamedTuple):
    x: int
    y: int


class LevelError(ValueError):
    """A level definition that cannot be played."""


@dataclass(frozen=True)
class GoalSpec:
    kind: str
    params: dict[str, Any] = field(default_factory=dict)


WALL, FLOOR, START = "#", ".", "S"


@dataclass(frozen=True)
class Level:
    id: str
    width: int = 1
    height: int = 1
    walls: frozenset[Position] = frozenset()
    start: Position = Position(0, 0)
    goals: tuple[GoalSpec, ...] = ()
    tick_limit: int = 1000
    markers: dict[str, Position] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Level":
        level_id = data.get("id")
        if not isinstance(level_id, str) or not level_id:
            raise LevelError("a level needs an id")
        rows = data.get("map")
        if not isinstance(rows, list) or not rows or not all(isinstance(r, str) for r in rows):
            raise LevelError(f"{level_id}: the map must be a list of rows of characters")
        width = len(rows[0])
        if width == 0 or any(len(row) != width for row in rows):
            raise LevelError(f"{level_id}: the map's rows must all be as long as the first")

        walls, starts, markers = set(), [], {}
        for y, row in enumerate(rows):
            for x, char in enumerate(row):
                here = Position(x, y)
                if char == WALL:
                    walls.add(here)
                elif char == START:
                    starts.append(here)
                elif char == FLOOR:
                    pass
                elif char.isalpha():
                    if char in markers:
                        raise LevelError(f"{level_id}: the marker {char} is on the map twice")
                    markers[char] = here
                else:
                    raise LevelError(f"{level_id}: {char!r} at {x},{y} is not a map character")
        if len(starts) != 1:
            raise LevelError(f"{level_id}: the map needs exactly one S, and has {len(starts)}")

        goals = []
        for spec in data.get("goals", []):
            if not isinstance(spec, dict) or not isinstance(spec.get("kind"), str):
                raise LevelError(f"{level_id}: a goal needs a kind")
            params = {k: v for k, v in spec.items() if k != "kind"}
            marker = params.get("marker")
            if marker is not None and marker not in markers:
                raise LevelError(f"{level_id}: a goal names the marker {marker}, not on the map")
            goals.append(GoalSpec(spec["kind"], params))

        tick_limit = data.get("tick_limit", 1000)
        if not isinstance(tick_limit, int) or tick_limit < 1:
            raise LevelError(f"{level_id}: tick_limit must be a whole number, 1 or more")

        return cls(
            id=level_id,
            width=width,
            height=len(rows),
            walls=frozenset(walls),
            start=starts[0],
            goals=tuple(goals),
            tick_limit=tick_limit,
            markers=markers,
        )

    @classmethod
    def from_json(cls, text: str) -> "Level":
        return cls.from_dict(json.loads(text))

    def inside(self, position: Position) -> bool:
        return 0 <= position.x < self.width and 0 <= position.y < self.height
