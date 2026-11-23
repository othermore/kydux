"""The familiars of the first year (D260, D261): the one table of kinds, colours and
names, and `Familiar`, the class a child's class inherits from to describe a kind of
familiar.

A class the child writes with `(Familiar)` is a kind of familiar, its name the kind
(`Fox`), and an object of it one creature. `Familiar` is made for each world
(`familiar_class`): its `__new__` takes whatever data the class is called with and keeps
the world's own state on the object under `_k_` names, so that the child's `__init__`
needs no `super()`; a class with no `__init__` of its own is given one that takes no
data, so that calling it with data is Python's own error. An object takes `name` and
`color` and nothing else; `position` is read, and is None before the creature is called.

The class is looked at when Python makes it (`__init_subclass__`): a method other than
those the level's block allows, or any other name in its body, stops the program at
that line, told by Orla (D261). The limits hold only for classes that inherit from the
world's `Familiar`: a lesson's own `class Crow:` is plain Python.

The table here is read by the page too: `app/scripts/pack-world.mjs` writes it as
familiars.json (`table()`), and the rules both sides share, a name's check, the
room-mate's colour and the friends' names, are held to the same cases,
`world/tests/familiar_cases.json`.
"""

import ast
import builtins
import keyword
import sys
from typing import TYPE_CHECKING, Any

from . import api
from .level import Position
from .things import Child

if TYPE_CHECKING:
    from .world import World

#: The six kinds a first-year may describe, each with its natural colours, the first the
#: one a text names when it needs one (D260).
KINDS: dict[str, tuple[str, ...]] = {
    "Fox": ("red", "white", "black"),
    "Crow": ("black", "white"),
    "Bat": ("black", "white"),
    "Hare": ("brown", "white"),
    "Mouse": ("brown", "white"),
    "Frog": ("green", "red"),
}
#: A colour of a kind kept for the friend, never offered to the child: the grey hare.
KEPT: dict[str, str] = {"Hare": "grey"}
#: Every kind's every colour, the friend's included: the fourteen sheets (D273).
SHEETS: dict[str, tuple[str, ...]] = {
    kind: (*colours, *([KEPT[kind]] if kind in KEPT else [])) for kind, colours in KINDS.items()
}
#: A familiar's height, in cells: half a child's (D273).
HEIGHT = 0.57
#: The friend's familiar, always a grey hare, and the room-mate's name.
FRIEND = {"kind": "Hare", "name": "Tolu", "color": "grey"}
MATE_NAME = "Kesi"
#: The friends' familiars' names when the child names theirs as one of them (D266).
ALTERNATES = {"Tolu": "Rumo", "Kesi": "Nabi"}
#: The description a level falls back on, with no draft of the game's (D265, D266).
DEFAULT = {"kind": "Fox", "name": "Pimu", "color": "red"}
#: A name's longest, in letters (D261).
LONGEST = 12
#: The names a familiar may not take, in lower case: the game's own and every id a
#: chapter 5 level gives a thing or an actor that a name could be (D261); a test keeps it
#: whole.
RESERVED = (
    "wizard",
    "familiar",
    "orla",
    "bimo",
    "rinlo",
    "friend",
    "mate",
    "moon",
    "sun",
    "star",
    "wand",
)
_BUILTINS = frozenset(name.lower() for name in dir(builtins))
#: The file name the kept class runs under in a living level (D269).
BOOK = "<book>"
#: The methods a level's block may allow (D260).
METHODS = ("__init__", "go_to")
#: What Python itself puts in a class's body, which the child did not write.
_PYTHON_S = frozenset(
    (
        "__module__",
        "__qualname__",
        "__doc__",
        "__firstlineno__",
        "__static_attributes__",
        "__classcell__",
        "__annotations__",
        "__annotate__",
        "__annotate_func__",
        "__orig_bases__",
        "__type_params__",
    )
)


def name_problem(name: object) -> str | None:
    """Why the book does not take a familiar's name, or None (D261): letters only, at
    most LONGEST of them, and, in lower case, no word of Python's, no builtin's name and
    no name of the game's."""
    if not isinstance(name, str) or not name.isalpha():
        return "name_letters"
    if len(name) > LONGEST:
        return "name_long"
    low = name.lower()
    if keyword.iskeyword(low) or keyword.issoftkeyword(low) or low in _BUILTINS:
        return "name_taken"
    if low in RESERVED:
        return "name_taken"
    return None


def worth(kind: str, color: object, coloured: bool = True) -> tuple[str, str | None]:
    """What a trial of a kind and a colour is worth (D261): `good`; `pale`, with its
    reason, `colour` (not the kind's own), `grey` (the friend's hare) or `none` (no colour
    given, `coloured` false); or `spark`, a kind no first-year describes."""
    if kind not in KINDS:
        return "spark", None
    if not coloured:
        return "pale", "none"
    if KEPT.get(kind) == color:
        return "pale", "grey"
    if color not in KINDS[kind]:
        return "pale", "colour"
    return "good", None


def mate_colour(kind: str, color: object) -> str | None:
    """The room-mate's copy's colour (D266): the kind's first colour that is not the
    child's; None for a kind no first-year describes."""
    colours = KINDS.get(kind)
    if colours is None:
        return None
    return next((colour for colour in colours if colour != color), colours[0])


def friends_names(name: object) -> dict[str, str]:
    """The friend's and the room-mate's familiars' names beside the child's (D266):
    Tolu and Kesi, or their alternates when the child's is one of them."""
    low = name.lower() if isinstance(name, str) else ""
    return {
        "friend": ALTERNATES["Tolu"] if low == "tolu" else "Tolu",
        "mate": ALTERNATES["Kesi"] if low == "kesi" else "Kesi",
    }


def table() -> dict[str, Any]:
    """The table for the page, written as familiars.json at build time."""
    return {
        "kinds": {kind: list(colours) for kind, colours in KINDS.items()},
        "kept": dict(KEPT),
        "sheets": {kind: list(colours) for kind, colours in SHEETS.items()},
        "height": HEIGHT,
        "friend": dict(FRIEND),
        "mate_name": MATE_NAME,
        "alternates": dict(ALTERNATES),
        "default": dict(DEFAULT),
        "longest": LONGEST,
        "reserved": list(RESERVED),
        "methods": list(METHODS),
        "python": sorted(
            {w.lower() for w in (*keyword.kwlist, *keyword.softkwlist)} | set(_BUILTINS)
        ),
    }


class NoAttribute(AttributeError):
    """A familiar read for an attribute it has not been given (D271): `no_attribute`."""

    def __init__(self, owner: str, name: str) -> None:
        super().__init__(f"{owner} has no attribute {name}", name=name)
        self.attribute = name


class NoSuchMethod(AttributeError):
    """A familiar told to do what its class does not know (D269): `no_such_method`, the
    familiar's name and the method's."""

    def __init__(self, familiar: str, method: str) -> None:
        super().__init__(f"{familiar} has no method {method}", name=method)
        self.familiar = familiar
        self.method = method


class Familiar(Child):
    """What every familiar of Arvelia has: a position, the four moves and `pick_up`, which a
    kind of familiar inherits (D270, D278). The world makes a class of its own from this one
    for each run (`familiar_class`); the child's class inherits from it."""

    _k_role = "familiar"

    def __new__(cls, *_data: Any, **_named: Any) -> "Familiar":
        familiar = object.__new__(cls)
        cls._k_world._k_made(familiar)
        return familiar

    def __init__(self) -> None:
        """Nothing: a class with no `__init__` of its own makes a familiar with no data."""

    def __init_subclass__(cls, **named: Any) -> None:
        super().__init_subclass__(**named)
        if "_k_world" in cls.__dict__:
            return  # the world's own Familiar, made for a run
        world: World = cls._k_world
        world._k_looked_at(cls)
        if "__init__" not in cls.__dict__:
            cls.__init__ = _no_data(cls.__name__)  # type: ignore[misc]

    @property
    def _k_child_name(self) -> str:
        return self._k_var()

    def _k_var(self) -> str:
        """How the familiar is named to the child: its name, or its kind."""
        name = self.__dict__.get("_k_name")
        return name if isinstance(name, str) else type(self).__name__

    def __repr__(self) -> str:
        name = self.__dict__.get("_k_name")
        where = self.__dict__.get("_k_cell")
        told = f" {name!r}" if isinstance(name, str) else ""
        at = f" at {where.x}, {where.y}" if where is not None else ""
        return f"<{type(self).__name__}{told}{at}>"

    def __setattr__(self, name: str, value: Any) -> None:
        if name in ("name", "color"):
            object.__setattr__(self, f"_k_{name}", value)
            return
        world: World = type(self)._k_world
        world.warn("other_attribute", "orla", name=name)

    def __delattr__(self, name: str) -> None:
        world: World = type(self)._k_world
        world.warn("other_attribute", "orla", name=name)

    def __getattr__(self, name: str) -> Any:
        # Only what the object does not have comes here (D269, D271): an attribute not
        # given, or a method its class does not know.
        if name.startswith("_"):
            raise AttributeError(name)
        if name == "go_to":
            type(self)._k_world._k_too_soon()
        if name not in ("name", "color") and type(self)._k_world._k_called(name):
            type(self)._k_world._k_puzzled(self)
            raise NoSuchMethod(self._k_var(), name)
        raise NoAttribute(type(self).__name__, name)

    def __dir__(self) -> list[str]:
        own = [
            key
            for klass in type(self).__mro__
            if issubclass(klass, Familiar)
            and klass is not Familiar
            and "_k_world" not in vars(klass)
            for key, value in vars(klass).items()
            if callable(value) and not key.startswith("_")
        ]
        return sorted({*api.MEMBERS["familiar"], *own})

    @property
    def name(self) -> str:
        """The familiar's name, which it knows itself by: `pimu.name`"""
        if "_k_name" not in self.__dict__:
            raise NoAttribute(type(self).__name__, "name")
        return self.__dict__["_k_name"]

    @property
    def color(self) -> str:
        """The familiar's colour, one of its kind's: `pimu.color`"""
        if "_k_color" not in self.__dict__:
            raise NoAttribute(type(self).__name__, "color")
        return self.__dict__["_k_color"]

    @property
    def position(self) -> Position | None:
        """Where the familiar stands, as x and y, or None before it is called:
        `pimu.position.x`"""
        return type(self)._k_world._k_familiar_position(self)

    def move_right(self, steps: int = 1) -> None:
        """Walk right, one cell per step, stopping where it cannot go: `pimu.move_right(3)`"""
        type(self)._k_world._k_familiar_moves(self, "right", steps, "move_right")

    def move_left(self, steps: int = 1) -> None:
        """Walk left, one cell per step, stopping where it cannot go: `pimu.move_left(3)`"""
        type(self)._k_world._k_familiar_moves(self, "left", steps, "move_left")

    def move_up(self, steps: int = 1) -> None:
        """Walk up, one cell per step, stopping where it cannot go: `pimu.move_up(3)`"""
        type(self)._k_world._k_familiar_moves(self, "up", steps, "move_up")

    def move_down(self, steps: int = 1) -> None:
        """Walk down, one cell per step, stopping where it cannot go: `pimu.move_down(3)`"""
        type(self)._k_world._k_familiar_moves(self, "down", steps, "move_down")

    def pick_up(self) -> None:
        """Pick up what lies on its own cell, and carry it: `pimu.pick_up()`"""
        type(self)._k_world._k_familiar_picks_up(self)


def _no_data(kind: str) -> Any:
    """The `__init__` a class with none of its own is given: it takes no data, and is
    named as the child's class, so that Python's own error names it (D260)."""

    def __init__(self: Familiar) -> None:
        pass

    __init__.__qualname__ = f"{kind}.__init__"
    return __init__


def familiar_class(world: "World") -> type[Familiar]:
    """The `Familiar` of one run: what the child's classes inherit from, bound to the
    world they are made in."""
    return type("Familiar", (Familiar,), {"_k_world": world, "__module__": "__main__"})


def is_familiar(value: object) -> bool:
    return isinstance(value, Familiar)


def kind_of(familiar: Familiar) -> str:
    """A familiar's kind: its class's name (D260)."""
    return type(familiar).__name__


def given(familiar: Familiar, attribute: str) -> bool:
    return f"_k_{attribute}" in familiar.__dict__


def class_node(source: str, klass: type, line: int | None) -> ast.ClassDef | None:
    """The `class` statement in a program that made a class: of its name, at the line it
    was made at (or a decorator's), else the last of its name before that line."""
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None
    found = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.ClassDef) and node.name == klass.__name__
    ]
    first = getattr(klass, "__firstlineno__", None)
    for node in found:
        lines = {node.lineno, *(d.lineno for d in node.decorator_list)}
        if first in lines or line in lines:
            return node
    before = [node for node in found if line is None or node.lineno <= line]
    return before[-1] if before else (found[-1] if found else None)


def body_problem(node: ast.ClassDef, methods: tuple[str, ...]) -> tuple[str, str, int] | None:
    """The first thing in a class's body the first year does not allow (D261): its
    reason, the name it is about and its line; None when all of it is allowed."""
    for statement in node.body:
        if isinstance(statement, ast.Pass):
            continue
        if isinstance(statement, ast.Expr) and isinstance(statement.value, ast.Constant):
            continue  # a docstring, or a value said and left
        line = statement.lineno
        if isinstance(statement, ast.FunctionDef | ast.AsyncFunctionDef):
            line = min([line, *(d.lineno for d in statement.decorator_list)])
            if statement.name in methods:
                continue
            if statement.name == "go_to":
                return "go_to_not_yet", statement.name, line
            return "other_method", statement.name, line
        return "other_name", _first_name(statement), line
    return None


def _first_name(statement: ast.stmt) -> str:
    """The name a statement in a class's body gives, or the first it reads."""
    targets: list[ast.expr] = []
    if isinstance(statement, ast.Assign):
        targets = statement.targets
    elif isinstance(statement, ast.AnnAssign | ast.AugAssign):
        targets = [statement.target]
    elif isinstance(statement, ast.ClassDef):
        return statement.name
    elif isinstance(statement, ast.Import | ast.ImportFrom):
        return statement.names[0].asname or statement.names[0].name
    for target in targets:
        for node in ast.walk(target):
            if isinstance(node, ast.Name):
                return node.id
    for node in ast.walk(statement):
        if isinstance(node, ast.Name):
            return node.id
    return type(statement).__name__.lower()


def init_of(node: ast.ClassDef | None) -> str | None:
    """A class's `__init__` as Python reads it, to tell whether two are the same (D269)."""
    if node is None:
        return None
    for statement in node.body:
        if isinstance(statement, ast.FunctionDef) and statement.name == "__init__":
            return ast.dump(statement)
    return None


def making_frame() -> tuple[str, int] | None:
    """The file and the line of the program's `class` statement being run now: the
    child's program or the book's kept class."""
    from .world import CHILD

    frame = sys._getframe(1)
    while frame is not None:
        if frame.f_code.co_filename in (CHILD, BOOK):
            return frame.f_code.co_filename, frame.f_lineno
        frame = frame.f_back
    return None


if __name__ == "__main__":
    import json

    print(json.dumps(table(), indent=2))
