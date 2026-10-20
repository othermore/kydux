"""What a level asks of the wizard, each goal checked after every tick."""

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol

from .level import GoalSpec, Level, LevelError, Position

if TYPE_CHECKING:
    from .world import World


class Goal(Protocol):
    def check(self, world: "World") -> bool: ...


@dataclass
class GoalResult:
    kind: str
    params: dict[str, Any] = field(default_factory=dict)
    met: bool = False
    met_at_tick: int | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "params": self.params,
            "met": self.met,
            "met_at_tick": self.met_at_tick,
        }


class ReachGoal:
    """Met once the wizard has stood on a tile: a marker's, or one given by x and y."""

    def __init__(self, spec: GoalSpec, level: Level) -> None:
        if "marker" in spec.params:
            self.target = level.markers[spec.params["marker"]]
        elif "at" in spec.params:
            x, y = spec.params["at"]
            self.target = Position(int(x), int(y))
            if not level.inside(self.target):
                raise LevelError(f"{level.id}: the reach goal's tile is off the map")
        else:
            raise LevelError(f"{level.id}: a reach goal needs a marker or at")

    def check(self, world: "World") -> bool:
        return world.wizard.position == self.target


GOALS: dict[str, type] = {"reach": ReachGoal}


def make_goal(spec: GoalSpec, level: Level) -> Goal:
    kind = GOALS.get(spec.kind)
    if kind is None:
        raise LevelError(f"{level.id}: there is no goal of kind {spec.kind}")
    return kind(spec, level)
