"""A level: the map and what it asks of the wizard."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Level:
    id: str
