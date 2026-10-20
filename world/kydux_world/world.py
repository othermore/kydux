"""The world a child's code runs in: the wizard on the level's grid, ticks and events.

Everything is deterministic: the same level and the same code give the same
events. Each thing the wizard does takes whole ticks, and each tick records
an event, with the line of the child's code that caused it, for the page to
play back.
"""

import sys
from dataclasses import dataclass
from enum import Enum
from typing import Any

from .goals import make_goal
from .level import Level, Position

CHILD = "<child>"


class Direction(Enum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"

    @property
    def delta(self) -> tuple[int, int]:
        return {"up": (0, -1), "down": (0, 1), "left": (-1, 0), "right": (1, 0)}[self.value]


@dataclass(frozen=True)
class Event:
    tick: int
    actor: str
    kind: str
    data: dict[str, Any]
    line: int | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "tick": self.tick,
            "actor": self.actor,
            "kind": self.kind,
            "data": self.data,
            "line": self.line,
        }


class TooManyTicks(Exception):
    """The run went past the level's tick limit."""

    def __init__(self, limit: int) -> None:
        super().__init__(f"the run went past {limit} steps")
        self.limit = limit


def child_line() -> int | None:
    """The line of the child's code running now: the outermost call into the world
    comes from it."""
    frame = sys._getframe(1)
    while frame is not None:
        if frame.f_code.co_filename == CHILD:
            return frame.f_lineno
        frame = frame.f_back
    return None


class World:
    def __init__(self, level: Level) -> None:
        self.level = level
        self.tick = 0
        self.events: list[Event] = []
        self.wizard = Wizard(self)
        self.goals = [make_goal(spec, level) for spec in level.goals]
        #: For each goal by its index, the first tick it was met at.
        self.met_at: dict[int, int] = {}
        self._check_goals()

    def is_free(self, position: Position) -> bool:
        return self.level.inside(position) and position not in self.level.walls

    def record(self, actor: str, kind: str, data: dict[str, Any]) -> None:
        """One tick: the event that happened in it, then the goals checked. The
        level's tick limit is the most ticks a run may take; one more stops it."""
        if self.tick >= self.level.tick_limit:
            raise TooManyTicks(self.level.tick_limit)
        self.tick += 1
        self.events.append(Event(self.tick, actor, kind, data, child_line()))
        self._check_goals()

    def _check_goals(self) -> None:
        for index, goal in enumerate(self.goals):
            if index not in self.met_at and goal.check(self):
                self.met_at[index] = self.tick


def _steps(name: str, steps: object) -> int:
    if isinstance(steps, bool) or not isinstance(steps, int):
        raise TypeError(f"{name}() takes a whole number of steps, 1 or more")
    if steps < 1:
        raise ValueError(f"{name}() takes a whole number of steps, 1 or more")
    return steps


class Wizard:
    """The child's wizard. Its methods are the spells the child casts."""

    def __init__(self, world: World) -> None:
        self._world = world
        self.position = world.level.start
        self.facing = Direction.DOWN

    def __repr__(self) -> str:
        return f"<wizard at {self.position.x}, {self.position.y}>"

    def _move(self, direction: Direction, steps: int) -> None:
        for _ in range(steps):
            self.facing = direction
            dx, dy = direction.delta
            ahead = Position(self.position.x + dx, self.position.y + dy)
            if not self._world.is_free(ahead):
                self._world.record(
                    "wizard", "bump", {"at": list(self.position), "facing": direction.value}
                )
                return
            before = self.position
            self.position = ahead
            self._world.record(
                "wizard",
                "move",
                {"from": list(before), "to": list(ahead), "facing": direction.value},
            )

    def move_right(self, steps: int = 1) -> None:
        """Walk right, one tile per step, stopping at a wall."""
        self._move(Direction.RIGHT, _steps("move_right", steps))

    def move_left(self, steps: int = 1) -> None:
        """Walk left, one tile per step, stopping at a wall."""
        self._move(Direction.LEFT, _steps("move_left", steps))

    def move_up(self, steps: int = 1) -> None:
        """Walk up, one tile per step, stopping at a wall."""
        self._move(Direction.UP, _steps("move_up", steps))

    def move_down(self, steps: int = 1) -> None:
        """Walk down, one tile per step, stopping at a wall."""
        self._move(Direction.DOWN, _steps("move_down", steps))

    def say(self, text: object) -> None:
        """Say something out loud."""
        self._world.record("wizard", "say", {"text": str(text)})
