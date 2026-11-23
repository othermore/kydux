"""The world a child's code runs in: the wizard, the level's things and actors, ticks and events.

Everything is deterministic: the same level and the same code give the same
events. One tick is one thing done (architecture.md, D21): every action that
does something takes a tick, and in each tick, after the wizard, every
actor takes its step, a teacher who sees the wizard catches it, and the
goals are checked. Asking takes no tick. Each tick's events carry the line
of the child's code that caused them, for the page to play back.

A run ends early when the wizard is caught or past the tick limit. Both are
raised as BaseExceptions, which the child's `except Exception` does not
catch; and a world that has ended refuses every further action, so that a
bare `except:` cannot carry the run on.

A level that is a race (D189) starts with Ilda reading the program, a tick a
line, before the wizard's first action, and ends with the race flown out and
judged by her count (D234); a wizard in the air when the program ends sets down
where it is (D185). A flown step says which step of its command it is, and of how
many (D243).

A level with a familiar (D260) holds the world's `Familiar` among the program's names,
and in a living level the familiar itself (D269). A familiar's steps are ticks of its
own (D270); `minka` calls an object's trial into the circle, or brings the living
familiar back (D262); what the first year does not allow is told by Orla, a warning
that stops the program, or a trial that comes pale or as a spark (D261). After the
program the world may use the child's class itself: the book tries the line that
conjures the trial, and Orla gives her orders (D267); a level's familiar may be born,
rehearsed first (D268).
"""

import ast
import contextlib
import io
import sys
import textwrap
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
from functools import partial
from typing import Any

from . import familiars
from .actors import Actor, Friend, Teacher, make_actor, sight_tiles
from .goals import code_lines, make_goal
from .level import CARRIED_KINDS, Level, Position, Race
from .sandbox import child_builtins
from .things import Bed, Child, Door, Hole, Plate, Ring, Thing, make_thing, steps_between

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


class RunOver(BaseException):
    """The run has ended; the child's code is stopped. Not an Exception, so that the
    child's `except Exception` lets it through."""


class TooManyTicks(RunOver):
    """The run went past the level's tick limit."""

    def __init__(self, limit: int) -> None:
        super().__init__(f"the run went past {limit} steps")
        self.limit = limit


class Caught(RunOver):
    """An actor saw the wizard."""

    def __init__(self, by: str) -> None:
        super().__init__(f"{by} saw the wizard")
        self.by = by


class Refused(Exception):
    """An action the world cannot do with what it is given, which stops the child's
    program as any error does and is explained in the child's words (D22): untying a
    broom with no knot (`no_knot`, D183), or what the first year does not allow (D261).
    Its words name the thing, `by`, and what `detail` says of it."""

    def __init__(self, reason: str, by: str, detail: dict[str, Any] | None = None) -> None:
        super().__init__(f"{by}: {reason}")
        self.reason = reason
        self.by = by
        self.detail = dict(detail or {})


class WorldKept(Exception):
    """A living level whose kept class makes no familiar of its kind (D269)."""


class ActionArguments(TypeError):
    """An action given what it cannot take; `example`, how to call it, when its
    docstring's first example is not the one the child needs."""

    def __init__(self, action: str, message: str, example: str | None = None) -> None:
        super().__init__(message)
        self.action = action
        self.example = example


def child_line() -> int | None:
    """The line of the child's code running now: the outermost call into the world
    comes from it."""
    frame = sys._getframe(1)
    while frame is not None:
        if frame.f_code.co_filename == CHILD:
            return frame.f_lineno
        frame = frame.f_back
    return None


#: The four tiles beside a tile.
DELTAS = ((0, -1), (-1, 0), (1, 0), (0, 1))
#: How far the wizard walks to the cell under a bed's pillow to go to bed, at most
#: (D130).
PILLOW_WALK = 8
#: The ticks a ring missed adds to Ilda's count of a race (D234).
RING_PENALTY = 5


def _direction(here: Position, there: Position) -> Direction:
    """The way from a cell to one beside it, or along its row or column."""
    if there.x != here.x:
        return Direction.RIGHT if there.x > here.x else Direction.LEFT
    return Direction.DOWN if there.y > here.y else Direction.UP


class World:
    def __init__(self, level: Level, code: str = "") -> None:
        self.level = level
        #: The child's code, which some goals read (lines_under).
        self.code = code
        self.tick = 0
        self.events: list[Event] = []
        #: Whether the room is lit: a dark level is not, until kirra (D52).
        self.lit = not level.dark
        self.wizard = Wizard(self)
        self.things: dict[str, Thing] = {s.id: make_thing(self, s) for s in level.things}
        self.actors: dict[str, Actor] = {s.id: make_actor(self, s) for s in level.actors}
        #: Who caught the wizard, when someone did.
        self.caught_by: str | None = None
        #: The bed the wizard sleeps in, once it does (D84).
        self.slept: str | None = None
        self.over: RunOver | None = None
        #: Whether the child's code has come to its end, however it did.
        self.finished = False
        self.goals = [make_goal(spec, level) for spec in level.goals]
        #: For each goal by its index, the first tick it was met at, or failed at.
        self.met_at: dict[int, int] = {}
        self.failed_at: dict[int, int] = {}
        self._line: int | None = None
        #: The reason an error stopped the program, or the world refused it, once one
        #: did: what the `no_error` goal fails at.
        self.error: str | None = None
        #: In a race (D189): the lines Ilda read, the tick the wizard crossed the finish
        #: at, and the ticks added to its count for the rings it had missed by then
        #: (D234).
        self.read_lines = 0
        self.crossed_at: int | None = None
        self.penalty = 0
        #: The hidden things the wizard has found, by id (D184).
        self.found: set[str] = set()
        #: Every act's first tick and how many ticks it takes: the wizard's, a
        #: familiar's or the world's own after the program (D270).
        self.acts: list[tuple[int, int]] = []
        #: Whether the child's program has come to its end, before the world uses its
        #: class (D267): the goals that look at the program's end look then.
        self.program_over = False
        #: The world's `Familiar` in a level with a familiar (D260), the familiars made,
        #: by id, the trials standing in the circle in the order they were called, the
        #: living familiar (D269), and how the birth level's run is played: `rehearsal`,
        #: `passing` or `holding` (D268).
        self.familiar_block = level.familiar
        self.Familiar = familiars.familiar_class(self) if level.familiar else None
        self.made: dict[str, familiars.Familiar] = {}
        self.circle: list[familiars.Familiar] = []
        self.living: familiars.Familiar | None = None
        self.verdict = "rehearsal"
        #: Whether the book could note the trial (D267), and the line it wrote.
        self.noted: bool | None = None
        #: The familiar born this run, a step held at the circle's edge (D268).
        self.born: familiars.Familiar | None = None
        self.held = False
        #: The room-mate's copy of the child's familiar, its kind and colour (D268).
        self.copy: tuple[str, str | None] | None = None
        #: Orla's orders obeyed, and an error of the child's class after the program.
        self.obeyed = 0
        self.after_error: BaseException | None = None
        #: The class the living familiar took over, as written (D269).
        self.learned: str | None = None
        #: The familiar's cell at the program's end (D271).
        self.familiar_end: Position | None = None
        #: While the book calls the child's class (D267).
        self.booking = False
        self._tree: ast.AST | None = None
        self._check_goals()

    def prepare(self) -> None:
        """Before the program: in a living level, the familiar is made from its kept
        class, run under the book's file name, and stood on its cell (D269); the room-mate's
        copy of the child's familiar is drawn from the level's draft (D268)."""
        block = self.familiar_block
        if block is None:
            return
        mate = next((a for a in self.actors.values() if a._k_spec.of == "mate"), None)
        if mate is not None:
            described = block.draft or block.living
            kind = described.kind if described else familiars.DEFAULT["kind"]
            color = described.color if described else familiars.DEFAULT["color"]
            self.copy = (kind, familiars.mate_colour(kind, color))
        if block.living is None or block.stage != "living":
            return
        living = block.living
        source = block.kept_class() or ""
        names: dict[str, Any] = {
            "__name__": "__main__",
            "__builtins__": child_builtins(),
            "Familiar": self.Familiar,
        }
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(source, familiars.BOOK, "exec"), names)
        kind = names.get(living.kind)
        if not (isinstance(kind, type) and issubclass(kind, familiars.Familiar)):
            raise WorldKept(f"the kept class has no kind of familiar {living.kind}")
        with contextlib.redirect_stdout(io.StringIO()):
            try:
                creature = kind(living.name, living.color)
            except TypeError:
                creature = kind()
        object.__setattr__(creature, "_k_name", living.name)
        object.__setattr__(creature, "_k_color", living.color)
        self.made.pop(creature._k_id, None)
        creature._set(id="familiar", state="living", cell=living.at, facing=living.facing)
        self.made["familiar"] = creature
        self.living = creature

    # The familiars (D260 to D270): what the world's `Familiar` asks of the world.

    def _k_made(self, familiar: familiars.Familiar) -> None:
        """A familiar object made by the child's program, one creature: its id, and no
        cell until it is called (D262); one the book makes to try a line is the book's."""
        if self.booking:
            familiar._set(id="book", state="book", cell=None, facing="down", virtual=None)
            return
        number = 1 + sum(1 for name in self.made if name.startswith("familiar_"))
        name = f"familiar_{number}"
        familiar._set(id=name, state="object", cell=None, facing="down", virtual=None)
        self.made[name] = familiar

    def _k_looked_at(self, klass: type) -> None:
        """A kind of familiar made by the program, or the book's kept class (D260): its body
        holds nothing the level's block does not allow (D261); in a living level, the
        program's class of the familiar's kind takes the familiar over (D269)."""
        made = familiars.making_frame()
        file, line = made if made is not None else (CHILD, None)
        block = self.familiar_block
        source = self.code if file == CHILD else (block.kept_class() if block else None) or ""
        node = familiars.class_node(source, klass, line)
        methods = block.methods if block is not None else familiars.METHODS
        if node is not None:
            problem = familiars.body_problem(node, methods)
            if problem is not None:
                reason, name, at = problem
                own = at if file == CHILD else None
                self.warn(reason, "orla", at_line=own, name=name, line=own)
            if file == CHILD:
                segment = ast.get_source_segment(source, node, padded=True)
                klass._k_source = textwrap.dedent(segment) if segment else None  # type: ignore[attr-defined]
        if file == CHILD and self.living is not None:
            self._k_takes_over(klass, node)

    def _k_takes_over(self, klass: type, node: ast.ClassDef | None) -> None:
        """The program's class of the living familiar's kind, its `__init__` the kept one's,
        takes the familiar over, adding what it knows (D269); another kind, or another
        `__init__`, is a description changed, which Orla does not allow."""
        living = self.living
        assert living is not None
        old = type(living)
        if klass.__name__ != old.__name__:
            self.warn("class_changed", "orla", name=klass.__name__)
        kept = familiars.class_node(self.familiar_block.kept_class() or "", old, None)
        if familiars.init_of(node) != familiars.init_of(kept):
            self.warn("class_changed", "orla", name=klass.__name__)
        for key, value in vars(old).items():
            if callable(value) and not key.startswith("__") and key not in vars(klass):
                setattr(klass, key, value)
        object.__setattr__(living, "__class__", klass)
        own = sorted(
            key
            for key, value in vars(klass).items()
            if callable(value) and not key.startswith("_")
        )
        self.note(
            "familiar", "learned", {"id": "familiar", "kind": klass.__name__, "methods": own}
        )
        self.learned = getattr(klass, "_k_source", None)

    def _k_code_tree(self) -> ast.AST | None:
        if self._tree is None:
            try:
                self._tree = ast.parse(self.code)
            except SyntaxError:
                return None
        return self._tree

    def _k_called(self, member: str) -> bool:
        """Whether the line of the program running now calls a member by that name: a
        method asked of a familiar, rather than an attribute read (D269, D271)."""
        line = child_line()
        tree = self._k_code_tree()
        if line is None or tree is None:
            return False
        return any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and node.func.attr == member
            and node.lineno <= line <= (node.end_lineno or node.lineno)
            for node in ast.walk(tree)
        )

    def _k_puzzled(self, familiar: familiars.Familiar) -> None:
        """A familiar told what its class does not know tilts its head (D269)."""
        if familiar._k_state in ("trial", "living") and familiar._k_cell is not None:
            self.note(
                familiar._k_id, "puzzled", {"id": familiar._k_id, "at": list(familiar._k_cell)}
            )

    def _k_familiar_position(self, familiar: familiars.Familiar) -> Position | None:
        if familiar._k_virtual is not None:
            return familiar._k_virtual
        if familiar._k_state in ("trial", "living"):
            return familiar._k_cell
        return None

    def figure(self, name: str) -> familiars.Familiar:
        return self.made[name]

    def familiar_ids(self) -> set[str]:
        """The ids of the familiars on the scene: the child's and the others' (D270)."""
        others = {a.name for a in self.actors.values() if a._k_spec.kind == "familiar"}
        return set(self.made) | others

    def taken_by(self, position: Position, mover: object = None) -> tuple[str, str] | None:
        """Who stands on a cell, for a familiar walking there (D270): the wizard, an
        actor, or another familiar of the child's; None when no one does."""
        if self.wizard._k_position == position:
            return ("wizard", "wizard")
        for actor in self.actors.values():
            if actor._k_position == position and not getattr(actor, "_k_gone", False):
                return ("actor", actor.name)
        for name, other in self.made.items():
            if other is mover or other._k_state not in ("trial", "living"):
                continue
            if other._k_cell == position:
                return ("familiar", name)
        return None

    def familiar_can_enter(self, position: Position) -> bool:
        """Whether a familiar can step onto a cell's ground: the floor or a familiars'
        passage, no shut door, no open leaf, no open hole (D270)."""
        if not (self.level.familiar_walks(position) and self._not_shut(position)):
            return False
        if self.leaf_over(position) is not None:
            return False
        hole = self.hole_at(position)
        return hole is None or hole._k_closed_at(self.tick + 1)

    def _k_familiar_moves(
        self, familiar: familiars.Familiar, way: str, steps: object, name: str
    ) -> None:
        """A familiar's move (D270): the wizard's walk with the familiar as the one that
        walks, a cell a tick; a bump on what blocks, on the wizard, on an actor and on
        another familiar. A trial moves only in the birth level, held at the circle's edge
        in a run that is not passing and going on in footprints of light (D268). Where a
        move of one step or more ends, the familiar picks up what lies there and lights a
        plate."""
        if self.booking:
            raise familiars.NoSuchMethod(familiar._k_var(), name)
        try:
            count = _steps(name, steps)
        except ActionArguments as wrong:
            var = familiar._k_var().lower()
            raise ActionArguments(name, str(wrong), f"{var}.{name}(3)") from None
        if count == 0:
            return
        block = self.familiar_block
        state = familiar._k_state
        fid = familiar._k_id
        birth = block is not None and block.stage == "birth"
        if state not in ("trial", "living") or (state == "trial" and not birth):
            self.ready()
            here = list(self.wizard._k_position)
            self.act("blocked", {"at": here, "by": fid, "reason": "not_here", "tried": False})
            return
        direction = Direction(way)
        moved = 0
        for _ in range(count):
            self.ready()
            familiar._set(facing=way)
            virtual = familiar._k_virtual
            here = virtual if virtual is not None else familiar._k_cell
            dx, dy = direction.delta
            ahead = Position(here.x + dx, here.y + dy)
            stopped = self._k_familiar_stopped(familiar, ahead)
            if stopped is not None:
                bumped = {"at": list(here), "facing": way, **stopped}
                if virtual is not None:
                    bumped["footprint"] = True
                self.act("bump", bumped, actor=fid)
                break
            leaving = (
                familiar._k_state == "trial" and block is not None and not block.in_circle(ahead)
            )
            if virtual is None and leaving and self.verdict == "holding":
                # The step that would leave the circle is held at its edge (D268).
                self.held = True
                familiar._set(virtual=ahead)
                held = {"at": list(here), "to": list(ahead), "facing": way}
                self.act("held", held, actor=fid)
                continue
            if virtual is not None:
                familiar._set(virtual=ahead)
                step = {"from": list(here), "at": list(ahead), "facing": way}
                self.act("footprint", step, actor=fid)
                continue
            familiar._set(cell=ahead)
            moved += 1
            step = {"from": list(here), "to": list(ahead), "facing": way}
            born = partial(self._k_born, familiar, ahead) if leaving else None
            self.act("move", step, then=born, actor=fid)
        if moved:
            self._k_ends_move(familiar)

    def _k_familiar_stopped(
        self, familiar: familiars.Familiar, ahead: Position
    ) -> dict[str, Any] | None:
        """What stops a familiar's step onto a cell, as a bump's data, or None."""
        if not self.familiar_can_enter(ahead):
            by = (
                "door"
                if self.door_at(ahead) is not None
                else "hole"
                if self.hole_at(ahead) is not None
                else "wall"
            )
            stopped: dict[str, Any] = {"by": by}
            if ahead in self.level.kinds:
                stopped["kind"] = self.level.kinds[ahead]
            return stopped
        taken = self.taken_by(ahead, familiar)
        if taken is not None:
            return {"by": taken[0], "id": taken[1]}
        return None

    def _k_born(self, familiar: familiars.Familiar, at: Position) -> None:
        """A trial steps out of the circle and lives (D268)."""
        familiar._set(state="living")
        self.circle = [trial for trial in self.circle if trial is not familiar]
        self.born = familiar
        self.note(familiar._k_id, "born", {"id": familiar._k_id, "at": list(at)})

    def _k_ends_move(self, familiar: familiars.Familiar) -> None:
        """Where a familiar's move ends, in that step's tick: it picks up every thing that
        is carried that lies there, and a plate there is lit (D270)."""
        here = familiar._k_cell
        for thing in sorted(self.things.values(), key=lambda t: t.name):
            if thing._k_position != here:
                continue
            free = not (thing._k_carried or thing._k_given or thing._k_held)
            if thing.kind in CARRIED_KINDS and free:
                thing._pick(familiar._k_id)
                taken = {"id": thing.name, "at": list(here), "by": familiar._k_id}
                self.note(familiar._k_id, "pick_up", taken)
            if isinstance(thing, Plate) and not thing._k_lit:
                thing._set(lit=True)
                self.note(thing.name, "lit", {"id": thing.name, "at": list(here)})

    def tell(self, who: str, key: str, **values: Any) -> None:
        """Someone of the scene says something while the program runs (D264): a note in
        the tick going on, with the values its words take."""
        self.note(who, "told", {"who": who, "key": key, **values})

    def warn(
        self, reason: str, by: str, at_line: int | None | object = CHILD, **detail: Any
    ) -> None:
        """What the first year does not allow, told by Orla (D261): a tick, a `blocked`
        event with the reason and who says it, their words, and the program stopped as
        an error is. While the book tries a line, nothing is shown."""
        if self.booking:
            raise Refused(reason, by, detail)
        refused = {"at": list(self.wizard._k_position), "by": by, "reason": reason, "tried": False}
        self.act("blocked", {**refused, **detail}, line=at_line)
        self.tell(by, reason, **detail)
        self.error = reason
        raise Refused(reason, by, detail)

    def first_trial(self) -> familiars.Familiar | None:
        """The trial the level is about: the first standing in the circle of a first-year
        kind, or the one born this run."""
        if self.born is not None:
            return self.born
        for trial in self.circle:
            if familiars.kind_of(trial) in familiars.KINDS:
                return trial
        return None

    def described(self, familiar: familiars.Familiar) -> dict[str, Any]:
        """A trial as the world judges it (D261): its kind, its name when the book takes
        it, its colour when it is the kind's own, and what it is worth; a trial called is
        what it was when it came, whatever the program gives the object after."""
        seen = familiar.__dict__.get("_k_seen")
        if seen is not None:
            return dict(seen)
        kind = familiars.kind_of(familiar)
        name = familiar.__dict__.get("_k_name")
        color = familiar.__dict__.get("_k_color")
        worth, reason = familiars.worth(kind, color, familiars.given(familiar, "color"))
        named = familiars.given(familiar, "name") and familiars.name_problem(name) is None
        return {
            "kind": kind,
            "name": name if named else None,
            "color": color if worth == "good" else None,
            "worth": worth,
            "reason": reason,
        }

    def book_line(self, familiar: familiars.Familiar) -> tuple[str, bool]:
        """The book notes a good trial in one line made with the child's own class (D267):
        the line, and whether the class makes, from the trial's name and colour, a familiar
        with that name and colour. What it prints is dropped."""
        seen = self.described(familiar)
        name, color = seen["name"], seen["color"]
        line = f'{seen["kind"]}("{name}", "{color}")'
        self.booking = True
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                made = type(familiar)(name, color)
            ok = made.__dict__.get("_k_name") == name and made.__dict__.get("_k_color") == color
        except Exception:
            ok = False
        finally:
            self.booking = False
        return line, ok

    def familiar_result(self) -> dict[str, Any] | None:
        """What the page keeps of the run's familiar (D265): the trial the level is about,
        whether a familiar was born, the trial's class as written, and the class the living
        familiar took over."""
        if self.familiar_block is None:
            return None
        trial = self.first_trial()
        seen = self.described(trial) if trial is not None else None
        return {
            "trial": {k: seen[k] for k in ("kind", "name", "color")} if seen else None,
            "born": self.born is not None,
            "source": getattr(type(trial), "_k_source", None) if trial is not None else None,
            "learned": self.learned,
        }

    def begin(self) -> None:
        """The run's start, before the wizard's first action: in a race, Ilda reads
        the program, a tick a line, the line she reads lit, while the wizard stands on
        the start and the racer waits for its own lines (D189)."""
        if self.level.race is None:
            return
        counted = [
            number
            for number, line in enumerate(self.code.splitlines(), 1)
            if line.strip() and not line.strip().startswith("#")
        ]
        self.read_lines = code_lines(self.code)
        at = list(self.wizard.position)
        for count, number in enumerate(counted, 1):
            self.act("read", {"at": at, "count": count, "lines": self.read_lines}, line=number)

    def rings(self) -> list[str]:
        """The rings the wizard must fly through, in order: the `through_in_order`
        goal's (D187)."""
        for spec in self.level.goals:
            if spec.kind == "through_in_order":
                return list(spec.params.get("ids", []))
        return []

    def missed(self) -> list[str]:
        """The rings not flown through in their order (D187): a ring is flown through in
        its turn when it comes after the last one flown through; one passed over to
        fly through a later one is missed, and so is one flown through out of its
        turn, and one not flown through yet."""
        order = self.rings()
        done, passed = -1, set()
        for event in self.events:
            if event.kind == "through" and event.data.get("id") in order:
                index = order.index(event.data["id"])
                if index > done:
                    done = index
                    passed.add(event.data["id"])
        return [ring for ring in order if ring not in passed]

    def namespace(self) -> dict[str, Any]:
        """What the child's code holds: the wizard, and the level's things and actors by
        id; not what the wizard holds from the start, which the code asks for with
        `find_item` (D123), so that no name is put into the program unseen. Someone else's
        familiar is not among them: its name is told only to those it is trusted to
        (D266). In a level with a familiar, the world's `Familiar` (D260), and in a living
        level the familiar itself, by its name in small letters (D269)."""
        things = {name: thing for name, thing in self.things.items() if not thing._k_spec.carried}
        actors = {name: a for name, a in self.actors.items() if a._k_spec.kind != "familiar"}
        found: dict[str, Any] = {"wizard": self.wizard, **things, **actors}
        if self.Familiar is not None:
            found["Familiar"] = self.Familiar
        if self.living is not None:
            found[self.living.__dict__["_k_name"].lower()] = self.living
        return found

    def is_free(self, position: Position, flying: bool = False) -> bool:
        """Whether the wizard or an actor can walk onto a tile in the next tick: floor,
        no closed door, no open door's leaf (D125), and no cell of an open hole (D53,
        D167); or, `flying`, fly into it, a low cell too (D186)."""
        ground = self.level.flies(position) if flying else self.level.free(position)
        if not (ground and self._not_shut(position)):
            return False
        if self.leaf_over(position) is not None:
            return False
        hole = self.hole_at(position)
        return hole is None or hole._k_closed_at(self.tick + 1)

    def landable(self, position: Position) -> bool:
        """Whether a broom in the air may set down on a tile: one a walk may step on
        now, and no ring's (D215)."""
        return self.is_free(position) and self.ring_at(position) is None

    def hole_at(self, position: Position) -> Hole | None:
        """The hole one of whose cells a tile is, or None (D167)."""
        for thing in self.things.values():
            if isinstance(thing, Hole) and thing._k_on(position):
                return thing
        return None

    def near_wizard(self, position: Position) -> bool:
        """Whether a tile is the wizard's or one of its eight neighbours."""
        here = self.wizard._k_position
        return abs(position.x - here.x) <= 1 and abs(position.y - here.y) <= 1

    def in_dark(self, position: Position) -> bool:
        """Whether a tile is in the level's dark area: the dark rooms, or anywhere
        when the level names none (D52, D73)."""
        return self.level.dark and (not self.level.dark_area or position in self.level.dark_area)

    def is_clear(self, position: Position) -> bool:
        """Whether sight passes a tile: floor or a shelf, and no closed door (D46)."""
        return self.level.clear(position) and self._not_shut(position)

    def _not_shut(self, position: Position) -> bool:
        door = self.door_at(position)
        return door is None or door.is_open

    def friend_at(self, position: Position) -> str | None:
        """The id of the friend standing on a tile, or None (D66): a friend, or a teacher
        who only stands by and watches for no one, as Ilda on the field (sight 0)."""
        for actor in self.actors.values():
            standing = isinstance(actor, Teacher) and not actor._k_spec.sight
            if (isinstance(actor, Friend) or standing) and actor.position == position:
                return actor.name
        return None

    def familiar_at(self, position: Position) -> str | None:
        """The id of the familiar standing on a tile, the child's or someone else's, or
        None (D270)."""
        for actor in self.actors.values():
            if actor._k_spec.kind == "familiar" and actor._k_position == position:
                return actor.name
        for name, figure in self.made.items():
            if figure._k_state in ("trial", "living") and figure._k_cell == position:
                return name
        return None

    def ring_at(self, position: Position) -> Ring | None:
        """The ring standing on a tile, or None (D187)."""
        for thing in self.things.values():
            if isinstance(thing, Ring) and thing._k_position == position:
                return thing
        return None

    def door_at(self, position: Position) -> Door | None:
        for thing in self.things.values():
            if isinstance(thing, Door) and position in thing._k_spec.cells:
                return thing
        return None

    def up_high(self, thing: Thing) -> bool:
        """Whether a thing lies up on a shelf, out of the hands' reach from any tile
        (D129): on one of the level's high shelves, and not hidden under it (D85)."""
        return thing._k_position in self.level.high and not thing._k_spec.hidden

    def leaf_over(self, position: Position) -> Door | None:
        """The open door whose leaf lies on a tile (D125), or None."""
        for thing in self.things.values():
            if isinstance(thing, Door) and thing.is_open and position in thing._k_spec.covers:
                return thing
        return None

    def shove(self, door: Door) -> None:
        """A door has opened: whoever stands where its leaf comes to lie steps to the
        nearest free tile of the same row, away from the door (D125), in the door's
        tick, as an event of the door's."""
        figures: list[Child] = [self.wizard, *self.actors.values()]
        for figure in figures:
            here = figure._k_position
            if here not in door._k_spec.covers:
                continue
            taken = {other._k_position for other in figures if other is not figure}
            way = -1 if here.x < door._k_position.x else 1
            to = None
            for along in (way, -way):
                x = here.x + along
                while self.level.inside(Position(x, here.y)) and to is None:
                    tile = Position(x, here.y)
                    if not self.level.free(tile) or not self._not_shut(tile):
                        break
                    if self.is_free(tile) and tile not in taken:
                        to = tile
                    x += along
                if to is not None:
                    break
            if to is None:
                continue
            name = "wizard" if figure is self.wizard else figure.name
            figure._set(position=to)
            moved = {"id": name, "from": list(here), "to": list(to), "by": door.name}
            self.note(door.name, "shoved", moved)

    def door_beside(self, position: Position, opens: Callable[[Door], bool]) -> Door | None:
        """The first closed door next to `position`, by id, for which `opens` holds."""
        for thing in sorted(self.things.values(), key=lambda t: t.name):
            if not isinstance(thing, Door) or thing.is_open:
                continue
            if thing._k_beside(position) and opens(thing):
                return thing
        return None

    def carried(self) -> list[Thing]:
        return [t for t in self.things.values() if t._k_carried]

    def things_at(self, position: Position) -> list[Thing]:
        return [
            t for t in self.things.values() if t.position == position and t.kind in CARRIED_KINDS
        ]

    def ready(self) -> None:
        """Raises when the run has ended or has no tick left: every action asks first,
        before it changes anything."""
        if self.over is not None:
            raise self.over
        if self.tick >= self.level.tick_limit:
            self.over = TooManyTicks(self.level.tick_limit)
            raise self.over

    def act(
        self,
        kind: str,
        data: dict[str, Any],
        then: Callable[[], None] | None = None,
        line: int | None | object = CHILD,
        ticks: int = 1,
        actor: str = "wizard",
    ) -> None:
        """One tick of the wizard's, or of `actor`'s, a familiar's or the world's own after
        the program (D270): its event, what it does to the world (`then`, as a door opening
        to a spell), every actor's step, who sees it, the goals; or `ticks` of them, the
        event in the first. Its line is the child's code's running now, or the one given
        (Ilda's reading, D189)."""
        self.ready()
        self.tick += 1
        self.acts.append((self.tick, ticks))
        self._line = child_line() if line is CHILD else line  # type: ignore[assignment]
        self.events.append(Event(self.tick, actor, kind, data, self._line))
        if then is not None:
            then()
        self._tick_goes_on()
        # A walked step where the wizard can fly lasts three ticks (D225): the others go
        # by with no event of the wizard's, each with every actor's step.
        for _ in range(ticks - 1):
            self.ready()
            self.tick += 1
            self._tick_goes_on()

    def _tick_goes_on(self) -> None:
        """The rest of a tick: every actor's step, who sees the wizard, the goals."""
        for actor in self.actors.values():
            actor._step()
        for actor in self.actors.values():
            # Seen straight ahead, or walked into: either way the teacher has found it.
            if isinstance(actor, Teacher) and (
                actor.can_see(self.wizard) or actor.position == self.wizard.position
            ):
                self.note(actor.name, "seen", {"by": actor.name, "at": list(self.wizard.position)})
                self.caught_by = actor.name
                break
        self._check_goals()
        if self.caught_by is not None:
            self.over = Caught(self.caught_by)
            raise self.over

    def refuse(self, by: str, reason: str, at: list[int], **detail: object) -> None:
        """The wizard tries what cannot be done, and the program stops with an error in
        the child's words (D183): the try is seen, a tick, and raises; `detail` says
        more of it to the page, as the kind of a cell (D215)."""
        self.act("blocked", {"at": at, "by": by, "reason": reason, "tried": True, **detail})
        self.error = reason
        raise Refused(reason, by)

    def finish(self, ended: bool = True) -> None:
        """The child's code has ended, `ended` when it came to its end with the world
        still running: a broom in the air sets down where it is, over a cell that is
        walked on, and stays in the air over any other (D185, D215); a race is flown
        out until the racer crosses the finish (D189) and judged, a tick of Ilda's
        (D234); the world uses the child's class, the book and Orla's orders (D267); then
        the goals that are met only then are checked, and a run won ends with what
        follows it and the words said (D264, D268)."""
        here = self.wizard._k_position
        if self.over is None and self.wizard._k_flying and self.landable(here):
            self.wizard._set(flying=False)
            self.note("broom", "land", {"id": "wizard", "at": list(here)})
        race = self.level.race
        if ended and self.over is None and race is not None:
            at = list(self.wizard.position)
            try:
                while self.tick < min(race.tick, self.level.tick_limit):
                    self.act("wait", {"at": at, "after": True}, line=None)
            except RunOver:
                pass
        if ended and self.over is None and self.familiar_block is not None:
            self.program_over = True
            figure = self.living or self.born
            self.familiar_end = figure._k_cell if figure is not None else None
            self._check_goals()
            try:
                self._after_program()
            except RunOver:
                pass
            except Exception as caught:  # the child's own class failed: theirs (D267)
                self.after_error = caught
                self.error = type(caught).__name__
        self.finished = True
        if ended and self.over is None and race is not None:
            self._judge(race)
        self._check_goals()
        if ended and self.over is None and self.after_error is None:
            self._closing()

    def _after_program(self) -> None:
        """After the program, the child's class used by the world (D267): the book tries
        the line that conjures the trial, where the level's block says so, as a tick of
        its own; or, the familiar on the plate the orders follow, Orla gives each order,
        a tick of hers and the call of the child's `go_to`, its steps ticks of the
        familiar's."""
        block = self.familiar_block
        assert block is not None
        trial = self.first_trial()
        if block.book and block.stage == "trial" and trial is not None:
            seen = self.described(trial)
            if seen["worth"] == "good" and seen["name"] is not None:
                line, ok = self.book_line(trial)
                self.noted = ok
                self.act("book", {"line": line, "ok": ok, "ink": False}, line=None, actor="book")
        living = self.living or self.born
        plates = {t.name: t for t in self.things.values() if isinstance(t, Plate)}
        on = plates.get(block.orders_on or "")
        if not block.orders or living is None or on is None:
            return
        if living._k_cell != on._k_position:
            return
        var = living.__dict__["_k_name"].lower()
        for order in block.orders:
            x, y = order.to
            line = f"{var}.go_to({x}, {y})"
            self.act("order", {"line": line, "to": [x, y]}, line=None, actor="orla")
            self.tell("orla", order.key, **self._values(living))
            method = getattr(type(living), "go_to", None)
            if method is None:
                self._k_puzzled(living)
                raise familiars.NoSuchMethod(living._k_var(), "go_to")
            method(living, x, y)
            if living._k_cell != order.to:
                return
            self.obeyed += 1

    def _closing(self) -> None:
        """The run's end, after the goals: a run won is followed by the level's `then`, a
        familiar of someone else's stepping out of the circle and living, a tick of the
        world's, and the words said at a win (D264, D268); a birth level's run held at the
        circle's edge ends with Orla's words, `not_yet`, or `halt` with a familiar living."""
        block = self.familiar_block
        if block is None:
            return
        won = self.won()
        passing = block.stage != "birth" or self.verdict == "passing"
        if won and passing and block.then is not None:
            name, to = block.then
            actor = self.actors[name]
            here = actor._k_position
            facing = _direction(here, to).value if here != to else actor._k_facing
            actor._set(position=to, facing=facing)
            step = {"from": list(here), "to": list(to), "facing": facing}
            try:
                self.act("move", step, line=None, actor=name)
                self.note(name, "born", {"id": name, "at": list(to)})
            except RunOver:
                pass
        if won:
            trial = self.first_trial()
            values = self._values(trial) if trial is not None else {}
            for who, key in self.level.told_won:
                self.tell(who, key, **values)
        if block.stage == "birth" and self.verdict == "holding":
            if block.living is not None and self.circle:
                self.tell("orla", "halt")
            elif self.held:
                self.tell("orla", "not_yet")

    def _values(self, familiar: familiars.Familiar | None) -> dict[str, Any]:
        """The values a familiar gives the words said of it (D264)."""
        if familiar is None:
            return {}
        seen = self.described(familiar)
        return {key: seen[key] for key in ("kind", "name", "color") if seen[key] is not None}

    def _judge(self, race: Race) -> None:
        """Ilda's verdict of a race (D234), in a tick of its own while the run has one
        left: the lines, the flight, the rings missed and their penalty, the count they
        add up to, the racer's, and the winner, the one with the lower count; nobody at
        the same count (D220), and the racer when the wizard has not crossed."""
        crossed = self.crossed_at
        count = None if crossed is None else crossed + self.penalty
        if count is None or count > race.tick:
            winner: str | None = race.against
        else:
            winner = "wizard" if count < race.tick else None
        judged = {
            "at": list(self.wizard.position),
            "lines": self.read_lines,
            "flight": None if crossed is None else crossed - self.read_lines,
            "missed": self.penalty // RING_PENALTY,
            "penalty": self.penalty,
            "tick": count,
            "racer": race.against,
            "racer_lines": race.lines,
            "racer_tick": race.tick,
            "winner": winner,
        }
        if self.tick < self.level.tick_limit:
            try:
                self.act("judged", judged, line=None)
            except RunOver:
                pass
        else:
            self.note("wizard", "judged", judged)

    def won(self) -> bool:
        """Every goal that is not a bonus met, and none of them failed: a bonus goal
        that fails loses its star and not the level (D233)."""
        needed = [index for index, spec in enumerate(self.level.goals) if not spec.bonus]
        return all(index in self.met_at and index not in self.failed_at for index in needed)

    def note(self, actor: str, kind: str, data: dict[str, Any]) -> None:
        """An event in the tick going on, of an actor's or the world's."""
        self.events.append(Event(self.tick, actor, kind, data, self._line))

    def _check_goals(self) -> None:
        for index, goal in enumerate(self.goals):
            if index in self.met_at or index in self.failed_at:
                continue
            failed = getattr(goal, "failed", None)
            if failed is not None and failed(self):
                self.failed_at[index] = self.tick
            elif goal.check(self):
                self.met_at[index] = self.tick


def _whole(name: str, what: str, value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ActionArguments(name, f"{name}() takes a whole number of {what}, 1 or more")
    return value


def _steps(name: str, value: object) -> int:
    """A move's steps: a whole number, 0 or more. Zero walks nothing and takes no tick,
    the rest of a walk already done (D133); a number below zero is refused."""
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ActionArguments(name, f"{name}() takes a whole number of steps, 0 or more")
    return value


class Wizard(Child):
    """The child's wizard. Its methods are its actions, which the child's code makes it do:
    moving, waiting, saying, picking up, finding, looking at what it carries, and casting
    a spell with the wand (architecture.md, D27, D42)."""

    _k_role = "wizard"

    def __init__(self, world: World) -> None:
        # `ring`: the ring whose cell the wizard flew into, the way it was going and the
        # cell it flew in from, so that flying on the same way out of it goes through the
        # ring, along its way or against it (D187, D219).
        self._set(
            world=world, position=world.level.start, facing=Direction.DOWN, flying=False, ring=None
        )

    def __repr__(self) -> str:
        here = self._k_position
        return f"<wizard at {here.x}, {here.y} facing {self._k_facing.value}>"

    @property
    def position(self) -> Position:
        """Where the wizard stands, as x and y: `wizard.position.x`"""
        return self._k_position

    @property
    def facing(self) -> str:
        """The way the wizard looks: `"up"`, `"down"`, `"left"` or `"right"`: `wizard.facing`"""
        return self._k_facing.value

    @property
    def items(self) -> list[Thing]:
        """The things the wizard carries, as a list: `wizard.items`"""
        return self._k_world.carried()

    @property
    def flying(self) -> bool:
        """True while the wizard flies on its broom, from drevo on: `wizard.flying`"""
        return self._k_flying

    def _move(self, direction: Direction, steps: int) -> None:
        world: World = self._k_world
        for number in range(steps):
            world.ready()
            self._set(facing=direction)
            dx, dy = direction.delta
            here = self._k_position
            ahead = Position(here.x + dx, here.y + dy)
            flying = self._k_flying
            inside = self._k_ring
            if inside is not None and direction in (Direction.LEFT, Direction.RIGHT):
                # Inside a ring, a turn to its side rubs its rim: the program stops there,
                # the wizard still in the air in the ring, which is not flown (D226).
                world.refuse(inside[0], "ring_rim", list(here), facing=direction.value)
            friend = world.friend_at(ahead)
            if friend is not None:
                # A friend stands in the way: the wizard walks round (D66).
                world.act(
                    "bump",
                    {"at": list(here), "facing": direction.value, "by": "friend", "id": friend},
                )
                return
            familiar = world.familiar_at(ahead)
            if familiar is not None:
                # A familiar stands in the way, the child's or someone else's (D270).
                world.act(
                    "bump",
                    {
                        "at": list(here),
                        "facing": direction.value,
                        "by": "familiar",
                        "id": familiar,
                    },
                )
                return
            if ahead in world.level.forbidden:
                # A tile the wizard may not step on, though anyone else may (D84).
                reason = world.level.forbidden_reasons[ahead]
                refused = {"at": list(here), "by": "wizard", "reason": reason, "tried": False}
                world.act("blocked", {**refused, "facing": direction.value})
                return
            leaf = world.leaf_over(ahead)
            if leaf is not None:
                # An open door's leaf lies there (D125).
                refused = {
                    "at": list(here),
                    "by": leaf.name,
                    "reason": "door_leaf",
                    "tried": False,
                }
                world.act("blocked", {**refused, "facing": direction.value})
                return
            if not flying and ahead in world.level.low:
                # Water, a hedge, a bench: a flight crosses it, a walk does not (D186).
                kind = world.level.kinds.get(ahead, "low")
                refused = {"at": list(here), "by": "wizard", "reason": "no_walk", "tried": False}
                world.act("blocked", {**refused, "facing": direction.value, "kind": kind})
                return
            ring = world.ring_at(ahead)
            if ring is not None and not (flying and direction in (Direction.UP, Direction.DOWN)):
                # A ring is flown through from above or below, never walked into nor flown
                # into from its side (D187).
                world.act(
                    "bump",
                    {"at": list(here), "facing": direction.value, "by": "ring", "id": ring.name},
                )
                return
            if not world.is_free(ahead, flying):
                by = (
                    "door"
                    if world.door_at(ahead) is not None
                    else "hole"
                    if world.hole_at(ahead) is not None
                    else "high"
                    if flying
                    else "wall"
                )
                bumped = {"at": list(here), "facing": direction.value, "by": by}
                if ahead in world.level.kinds:
                    bumped["kind"] = world.level.kinds[ahead]
                world.act("bump", bumped)
                return
            through = self._k_through(direction)
            entered = (ring.name, direction, here) if ring is not None else None
            self._set(position=ahead, ring=entered)
            step = {"from": list(here), "to": list(ahead), "facing": direction.value}
            # A walked step where the wizard can fly takes three ticks, a flown one one
            # (D225); where a familiar walks, two (D277).
            ticks = 1 if flying else world.level.walk_ticks
            if flying:
                # Which step of its command a flown one is, and of how many, for the page
                # to give the command's wind its whole length (D243).
                step.update({"flying": True, "step": number + 1, "steps": steps})
            elif ticks > 1:
                step["ticks"] = ticks
            world.act(
                "move", step, then=partial(self._k_moved, through, here, ahead, ticks), ticks=ticks
            )

    def _k_moved(
        self, through: tuple[str, Position] | None, here: Position, ahead: Position, ticks: int
    ) -> None:
        """In a move's first tick, before the goals are looked at: the ring flown through
        along its way, or against it (D187, D219), and a race's finish crossed (D189), at
        the move's last tick (D225), with five ticks of penalty for each ring missed by
        then (D234)."""
        world: World = self._k_world
        if through is not None:
            name, came_from = through
            way = world.things[name]._k_spec.way
            moved = "up" if ahead.y < here.y else "down"
            if way == moved:
                world.note(
                    name, "through", {"id": name, "at": list(here), "from": list(came_from)}
                )
            else:
                # Against its way: the ring is not flown through, and counts as missed.
                wrong = {"id": name, "at": list(here), "way": way, "from": list(came_from)}
                world.note(name, "wrong_way", wrong)
        race = world.level.race
        if race is not None and ahead == race.finish and world.crossed_at is None:
            world.crossed_at = world.tick + ticks - 1
            world.penalty = RING_PENALTY * len(world.missed())

    def _k_through(self, direction: Direction) -> tuple[str, Position] | None:
        """The ring whose cell the wizard leaves the way it flew in, so flying through
        it (D187), with the cell it flew in from; or None."""
        entered = self._k_ring
        if entered is None:
            return None
        name, way, came_from = entered
        return (name, came_from) if way == direction else None

    def move_right(self, steps: int = 1) -> None:
        """Walk right, one tile per step, stopping at a wall or a closed door:
        `wizard.move_right(3)`"""
        self._move(Direction.RIGHT, _steps("move_right", steps))

    def move_left(self, steps: int = 1) -> None:
        """Walk left, one tile per step, stopping at a wall or a closed door:
        `wizard.move_left(3)`"""
        self._move(Direction.LEFT, _steps("move_left", steps))

    def move_up(self, steps: int = 1) -> None:
        """Walk up, one tile per step, stopping at a wall or a closed door:
        `wizard.move_up(3)`"""
        self._move(Direction.UP, _steps("move_up", steps))

    def move_down(self, steps: int = 1) -> None:
        """Walk down, one tile per step, stopping at a wall or a closed door:
        `wizard.move_down(3)`"""
        self._move(Direction.DOWN, _steps("move_down", steps))

    def say(self, text: object) -> None:
        """Say something out loud, a word or a number; a door beside the wizard opens to
        its password: `wizard.say("Hello!")`, `wizard.say(6)`"""
        if not isinstance(text, str | int | float):
            raise ActionArguments("say", "say() takes a word or a number", 'wizard.say("Hello!")')
        world: World = self._k_world
        said = str(text)
        world.ready()
        door = world.door_beside(self._k_position, lambda d: d.password == said)
        opens = (lambda: door._opened_by("word")) if door else None
        world.act("say", {"text": said}, then=opens)

    def cast(self, spell: str, thing: Any = None) -> None:
        """Cast a spell with the wand, which the wizard must carry; it works where the
        wizard stands, fendra on the thing it is given and minka on the familiar:
        `wizard.cast("zelim")`, `wizard.cast("fendra", book)`, `wizard.cast("minka", pimu)`"""
        if not isinstance(spell, str):
            raise ActionArguments("cast", "cast() takes a spell's name, in quotes")
        theirs = _child_s_own(thing)
        if spell == "minka" and not (familiars.is_familiar(thing) or theirs):
            # Nothing to call: no object, a thing of the world, or a class (D262).
            raise ActionArguments(
                "cast", "minka takes the familiar to call", 'wizard.cast("minka", pimu)'
            )
        if spell in AIMED and spell != "minka" and not isinstance(thing, Thing):
            raise ActionArguments(
                "cast", f"{spell} takes the thing to bring", f'wizard.cast("{spell}", book)'
            )
        if spell not in AIMED and thing is not None:
            raise ActionArguments("cast", f"{spell} takes no thing", f'wizard.cast("{spell}")')
        world: World = self._k_world
        world.ready()
        here = list(self._k_position)
        if not self.has("wand"):
            # Without the wand the wizard does not know the action (D27): nothing to try.
            world.act("blocked", {"at": here, "by": "wizard", "reason": "no_wand", "tried": False})
            return
        # The map's spell works wherever the map is carried, needed or not.
        if spell not in world.level.spells and not (spell == "orvim" and self.has("map")):
            refused = {"at": here, "by": "wizard", "reason": "unknown_spell", "tried": True}
            world.act("blocked", {**refused, "spell": spell})
            return
        if spell == "minka" and theirs:
            # An object of a class of the child's that does not say it is a familiar.
            world.warn("not_a_familiar", "orla", name=type(thing).__name__)
        effect = SPELLS[spell](world, self._k_position, thing)
        if effect.refused is not None:
            by = thing._k_id if familiars.is_familiar(thing) else getattr(thing, "name", None)
            refused = {"at": here, "by": by or "wizard", "reason": effect.refused, "tried": True}
            world.act("blocked", {**refused, "spell": spell})
            if effect.then is not None:
                effect.then()
            return
        world.act("cast", {"spell": spell, "at": here}, then=effect.then)
        if effect.after is not None:
            effect.after()

    def give(self, thing: Thing) -> None:
        """Give a thing the wizard carries to whoever stands beside it: `wizard.give(book)`"""
        if not isinstance(thing, Thing):
            raise ActionArguments("give", "give() takes a thing the wizard carries")
        world: World = self._k_world
        world.ready()
        here = self._k_position
        if not thing._k_carried:
            refused = {"at": list(here), "by": thing.name, "reason": "not_carried", "tried": False}
            world.act("blocked", refused)
            return
        beside = [
            actor
            for actor in sorted(world.actors.values(), key=lambda a: a.name)
            if abs(actor.position.x - here.x) + abs(actor.position.y - here.y) == 1
        ]
        if not beside:
            world.act(
                "blocked", {"at": list(here), "by": "wizard", "reason": "nobody", "tried": False}
            )
            return
        to = beside[0]
        thing._give(to.name)
        world.act("give", {"id": thing.name, "to": to.name, "at": list(here)})

    def wait(self, ticks: int = 1) -> None:
        """Stand still while the world moves on, one tick at a time: `wizard.wait(2)`"""
        for _ in range(_whole("wait", "ticks", ticks)):
            self._k_world.act("wait", {"at": list(self._k_position)})

    def pick_up(self, thing: Thing | None = None) -> None:
        """Pick up a thing on the wizard's tile, or beside it, and carry it; with several in
        reach, say which: `wizard.pick_up()`, `wizard.pick_up(key)`"""
        if thing is not None and not isinstance(thing, Thing):
            raise ActionArguments("pick_up", "pick_up() takes a thing by its name, with no quotes")
        world: World = self._k_world
        world.ready()
        here = self._k_position
        reach = self._k_in_reach()
        if thing is not None:
            if thing not in reach:
                # Seen up on a shelf in a straight line, it is too high for the hands.
                high = thing in self._k_too_high()
                reason = "too_high" if high else "far"
                refused = {"at": list(here), "by": thing.name, "reason": reason, "tried": high}
                world.act("blocked", refused)
                return
            chosen = thing
        else:
            if not reach:
                high = self._k_too_high()
                refused = (
                    {"by": high[0].name, "reason": "too_high"}
                    if high
                    else {"by": "wizard", "reason": "nothing"}
                )
                world.act("blocked", {"at": list(here), **refused, "tried": True})
                return
            # The wizard's own tile first; from beside, only when there is one to take.
            own = [t for t in reach if t._k_position == here]
            if own:
                chosen = own[0]
            elif len(reach) == 1:
                chosen = reach[0]
            else:
                names = [t.name for t in reach]
                refused = {"at": list(here), "by": "wizard", "reason": "which_one", "tried": False}
                world.act("blocked", {**refused, "things": names})
                return
        chosen._carry()
        world.act("pick_up", {"id": chosen.name, "at": list(here)})

    def _k_in_reach(self) -> list[Thing]:
        """The things the wizard can pick up: on its tile, or on one of the four beside it
        (D58), but for one up on a shelf, which only fendra brings down (D129); in
        reading order."""
        world: World = self._k_world
        here = self._k_position
        tiles = [here, *(Position(here.x + dx, here.y + dy) for dx, dy in DELTAS)]
        found = [t for tile in tiles for t in world.things_at(tile) if not world.up_high(t)]
        return sorted(
            found, key=lambda t: (t._k_position != here, t._k_position.y, t._k_position.x)
        )

    def _k_too_high(self) -> list[Thing]:
        """The things the hands cannot reach and fendra could: on a tile no one walks
        on, a shelf, in sight along one of the four ways, FENDRA_REACH tiles at most,
        nearest first."""
        world: World = self._k_world
        here = self._k_position
        return [
            thing for _, thing in in_line(world, here) if not world.level.free(thing._k_position)
        ]

    def _nearby(self, kind: object) -> list[Child]:
        """The things and actors of a kind the wizard finds where it stands, nearest
        first, a hung broom as near as the cell under it (D206): a thing of a zone only
        from within it, where the wizard or its living familiar stands (D196, D270); a
        thread's end on the floor by no one."""
        world: World = self._k_world
        here = self._k_position
        living = world.living or world.born
        seen_from = [here] if living is None else [here, living._k_cell]
        found: list[tuple[int, int, int, Child]] = []
        for item in [*world.things.values(), *world.actors.values()]:
            zone = item._k_spec.zone if isinstance(item, Thing) else None
            cells = world.level.zones.get(zone, ()) if zone is not None else ()
            if zone is not None and not any(cell in cells for cell in seen_from):
                continue
            if item.kind != kind or item.position is None or item.kind == "trail":
                continue
            where = item._k_reached_from() if isinstance(item, Thing) else item.position
            if where is not None:
                distance = abs(where.x - here.x) + abs(where.y - here.y)
                found.append((distance, where.y, where.x, item))
        return [item for *_, item in sorted(found, key=lambda f: f[:3])]

    def find_nearest(self, kind: str) -> Child | None:
        """The nearest thing of a kind, or None when there is none:
        `wizard.find_nearest("key")`"""
        nearby = self._nearby(kind)
        self._k_found(nearby[:1])
        return nearby[0] if nearby else None

    def find_item(self, kind: str) -> Thing | None:
        """The thing of a kind the wizard carries, or None when it carries none:
        `wizard.find_item("book")`"""
        carried = [item for item in self._k_world.carried() if item.kind == kind]
        return sorted(carried, key=lambda item: item.name)[0] if carried else None

    def find_all(self, kind: str) -> list[Child]:
        """Every thing of a kind, nearest first, as a list: `wizard.find_all("broom")`"""
        nearby = self._nearby(kind)
        self._k_found(nearby)
        return nearby

    def _k_found(self, found: list[Child]) -> None:
        """What the wizard finds that lay hidden, a broom in the straw, is seen from then
        on: the world's `found` event, in the tick going on, since finding takes none
        (D184)."""
        world: World = self._k_world
        hidden = [
            thing
            for thing in found
            if isinstance(thing, Thing) and thing._k_spec.hidden and thing.name not in world.found
        ]
        if not hidden:
            return
        world.found.update(thing.name for thing in hidden)
        cells = [list(thing._k_position) for thing in hidden]
        world.note("world", "found", {"ids": [thing.name for thing in hidden], "at": cells})

    def sleep(self) -> None:
        """Lie down in a free bed beside the wizard, and sleep: `wizard.sleep()`"""
        world: World = self._k_world
        world.ready()
        here = self._k_position
        # A bed beside the wizard, or one whose pillow it stands under (D84, D130).
        beds = [
            thing
            for thing in sorted(world.things.values(), key=lambda t: t.name)
            if isinstance(thing, Bed)
            and (
                abs(thing._k_position.x - here.x) + abs(thing._k_position.y - here.y) == 1
                or thing._k_spec.pillow_side == here
            )
        ]
        free = [bed for bed in beds if bed.free]
        if not free:
            reason = "bed_taken" if beds else "no_bed"
            world.act(
                "blocked", {"at": list(here), "by": "wizard", "reason": reason, "tried": False}
            )
            return
        bed = free[0]
        # To the floor under the bed's pillow first, a cell a tick, as any walk (D130).
        side = bed._k_spec.pillow_side
        for step in self._k_way_to(side) if side is not None else []:
            world.ready()
            direction = _direction(here, step)
            self._set(facing=direction, position=step)
            world.act("move", {"from": list(here), "to": list(step), "facing": direction.value})
            here = step
        # Then, facing the bed, into it.
        spot = bed._k_position
        facing = (
            _direction(here, Position(here.x, spot.y))
            if spot.y != here.y
            else _direction(here, Position(spot.x, here.y))
        )
        self._set(facing=facing)
        world.slept = bed.name
        data = {"id": bed.name, "at": list(here), "bed": list(spot), "facing": facing.value}
        world.act("sleep", data)

    def _k_way_to(self, target: Position) -> list[Position]:
        """The cells the wizard walks to reach `target`, by the shortest way over cells it
        can step on in turn (free, not forbidden it, no friend there), PILLOW_WALK at
        most; none when it is there already, or no such way."""
        world: World = self._k_world
        start = self._k_position
        came: dict[Position, Position | None] = {start: None}
        edge = [start]
        for _ in range(PILLOW_WALK):
            if target in came:
                break
            ahead = []
            for cell in edge:
                for dx, dy in DELTAS:
                    there = Position(cell.x + dx, cell.y + dy)
                    if there in came or there in world.level.forbidden:
                        continue
                    if not world.is_free(there) or world.friend_at(there) is not None:
                        continue
                    came[there] = cell
                    ahead.append(there)
            edge = ahead
        if target not in came or target == start:
            return []
        # Back from the target to the start, each cell to the one it was reached from.
        way, cell = [], target
        while cell != start:
            way.append(cell)
            cell = came[cell] or start
        return way[::-1]

    def distance_to(self, other: object) -> int | None:
        """How many steps lie between the wizard and a thing or someone, along the rows
        and the columns: `wizard.distance_to(key)`"""
        return steps_between(self, other)

    def _k_where(self) -> Position:
        return self._k_position

    def has(self, kind: str) -> bool:
        """True when the wizard carries a thing of that kind: `wizard.has("key")`"""
        return any(item.kind == kind for item in self._k_world.carried())


@dataclass(frozen=True)
class Effect:
    """What a spell does when cast: `then`, the change to the world in the wizard's
    tick, or nothing; or `refused`, the reason it could not be cast here."""

    then: Callable[[], None] | None = None
    refused: str | None = None
    #: What follows the cast's tick, in ticks of its own: a living familiar running back
    #: to the wizard (D262).
    after: Callable[[], None] | None = None


def _zelim(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Breaks the seal of a door beside the wizard; away from one it does nothing."""
    door = world.door_beside(here, lambda d: d._k_seal == "zelim")
    return Effect(then=(lambda: door._opened_by("spell")) if door else None)


#: How far `fendra` reaches along each of the four ways (D47).
FENDRA_REACH = 3


#: The spells cast on a thing the child names, the second argument of `cast`: fendra
#: on a thing, minka on a familiar (D262).
AIMED = ("fendra", "minka")


def _child_s_own(value: object) -> bool:
    """Whether a value is an object of a class the child's program made, and not one of
    the world's: what minka is told it cannot call unless the class says it is a
    familiar (D261)."""
    kind = type(value)
    return (
        not isinstance(value, type | Child)
        and getattr(kind, "__module__", None) == "__main__"
        and kind.__module__ != "builtins"
    )


def in_line(world: World, here: Position) -> list[tuple[int, Thing]]:
    """The things lying in sight from a tile along the four ways, FENDRA_REACH tiles at
    most each, through shelves and not through walls or closed doors, nor past a
    door's cell, open or shut, but the one the wizard stands on (D129), with how far
    each is: nearest first, then in reading order."""
    found: list[tuple[int, int, int, Thing]] = []
    for facing in ("up", "down", "left", "right"):
        for tile in sight_tiles(world.is_clear, here, facing, FENDRA_REACH):
            for thing in world.things_at(tile):
                distance = abs(tile.x - here.x) + abs(tile.y - here.y)
                found.append((distance, tile.y, tile.x, thing))
            if world.door_at(tile) is not None:
                break
    return [(distance, thing) for distance, _, _, thing in sorted(found, key=lambda f: f[:3])]


def _fendra(world: World, here: Position, thing: Thing | None) -> Effect:
    """Draws the thing named onto the wizard's tile, when it lies in sight along one of
    the four ways, three tiles at most, through shelves and not through walls or closed
    doors (D47), nor past a doorway the wizard does not stand in (D129); anywhere else,
    or carried, it is out of the spell's reach."""
    if thing is None or thing not in [found for _, found in in_line(world, here)]:
        return Effect(refused="out_of_reach")

    def pull() -> None:
        before = thing._k_position
        thing._set(position=here)
        world.note(thing.name, "pull", {"id": thing.name, "from": list(before), "to": list(here)})

    return Effect(then=pull)


def _kirra(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Lights the dark room the wizard is in for the rest of the run (D52, D73); in a
    lit room, or outside the dark one, it does nothing."""
    if world.lit or not world.in_dark(here):
        return Effect()

    def light() -> None:
        world.lit = True
        world.note("world", "light", {"at": list(here)})

    return Effect(then=light)


def _osto(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Holds a hole beside the wizard closed, from beside any of its cells (D53, D167);
    with none beside, refused."""
    beside = [
        thing
        for thing in sorted(world.things.values(), key=lambda t: t.name)
        if isinstance(thing, Hole) and thing._k_beside(here)
    ]
    if not beside:
        return Effect(refused="nothing_near")
    return Effect(then=beside[0]._hold)


def _orvim(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Opens the naughty child's map on the plan of the scene (D134): the world's `map`
    event, at which the page pauses and opens the plan; with no map carried, refused."""
    if not world.wizard.has("map"):
        return Effect(refused="no_map")
    return Effect(then=lambda: world.note("world", "map", {"at": list(here)}))


def _drevo(world: World, here: Position, _thing: Thing | None = None) -> Effect:
    """Lifts the broom the wizard carries into the air (D185): from then on every move
    flies, over the low cells and through the rings; with no broom carried, refused.
    Cast in the air, it sets the broom down on the wizard's cell, the moves after it
    walking (D215); over a cell no one walks on, the landing is refused and the
    program stops, the wizard still in the air."""
    if not world.wizard.has("broom"):
        return Effect(refused="no_broom")
    if world.wizard._k_flying:
        if not world.landable(here):
            kind = (
                "ring" if world.ring_at(here) is not None else world.level.kinds.get(here, "low")
            )
            world.refuse("wizard", "no_landing", list(here), kind=kind, spell="drevo")

        def land() -> None:
            world.wizard._set(flying=False)
            world.note("broom", "land", {"id": "wizard", "at": list(here), "cast": True})

        return Effect(then=land)

    def lift() -> None:
        world.wizard._set(flying=True)
        world.note("broom", "fly", {"id": "wizard", "at": list(here)})

    return Effect(then=lift)


def _minka(world: World, here: Position, familiar: Any) -> Effect:
    """Calls a familiar (D262). An object called in a level with the circle brings its
    trial into it: on the next free cell of the level's trials, or the oldest trial's,
    which dissolves; a kind no first-year describes gives a spark, and a colour not the
    kind's own a pale trial, with Orla's words (D261). A name Orla cannot write in the
    book stops the program. In the birth level the room-mate copies the trial, and in a
    run that passes Orla says so and writes its line in the book (D268). The living
    familiar runs back to the wizard and hands over what it carries; one already in the
    circle is not called twice."""
    block = world.familiar_block
    state = familiar._k_state
    if state == "living":
        return Effect(after=lambda: _call_back(world, familiar))
    if state == "trial":
        return Effect(refused="already_here")
    if block is None or block.stage == "living" or block.circle is None:
        # A second familiar, with one living: Orla stops it (D265).
        return Effect(refused="already_living", then=lambda: world.tell("orla", "halt"))
    if familiars.given(familiar, "name"):
        problem = familiars.name_problem(familiar.__dict__["_k_name"])
        if problem is not None:
            world.warn(problem, "orla", name=str(familiar.__dict__["_k_name"]))
    return Effect(then=lambda: _trial(world, familiar))


def _trial(world: World, familiar: familiars.Familiar) -> None:
    """In the cast's tick, the object's trial in the circle, or a spark (D262, D263)."""
    block = world.familiar_block
    assert block is not None
    seen = world.described(familiar)
    taken = {trial._k_cell for trial in world.circle}
    free = [cell for cell in block.trials if cell not in taken]
    fid = familiar._k_id
    if seen["worth"] == "spark":
        at = free[0] if free else world.circle[0]._k_cell
        world.note(fid, "spark", {"id": fid, "kind": seen["kind"], "at": list(at)})
        world.tell("orla", "spark", kind=seen["kind"])
        return
    dissolved = None
    if free:
        cell = free[0]
    else:
        oldest = world.circle.pop(0)
        cell = oldest._k_cell
        oldest._set(state="object", cell=None, seen=None)
        dissolved = oldest._k_id
    familiar._set(state="trial", cell=cell, facing="down", seen=seen)
    world.circle.append(familiar)
    pale = seen["worth"] == "pale"
    world.note(
        fid,
        "trial",
        {
            "id": fid,
            "kind": seen["kind"],
            "name": seen["name"],
            "color": seen["color"],
            "at": list(cell),
            "pale": pale,
            "reason": seen["reason"],
            "dissolved": dissolved,
            # Whether the trial holds, seen as long as the run is: with a name the book
            # took and a colour of its kind (D276); the page fades one that does not.
            "holds": seen["name"] is not None and seen["color"] is not None,
        },
    )
    given = familiar.__dict__.get("_k_color")
    if seen["reason"] in ("colour", "grey"):
        words = "pale_grey" if seen["reason"] == "grey" else "pale_colour"
        world.tell("orla", words, kind=seen["kind"], color=str(given))
        colours = list(familiars.KINDS[seen["kind"]])
        world.note("book", "book", {"kind": seen["kind"], "colors": colours})
    if block.stage != "birth":
        return
    _copied(world, seen)
    if seen["worth"] != "good" or seen["name"] is None:
        return
    line, ok = world.book_line(familiar)
    world.noted = ok
    if world.verdict == "passing" and ok:
        world.tell("orla", "go")
        world.note("book", "book", {"line": line, "ok": ok, "ink": True})
    elif world.verdict == "holding":
        world.note("book", "book", {"line": line, "ok": ok, "ink": False})


def _copied(world: World, seen: dict[str, Any]) -> None:
    """The room-mate copies the trial called, when it differs in kind or colour from her
    copy, and says so (D268)."""
    mate = next((a for a in world.actors.values() if a._k_spec.of == "mate"), None)
    if mate is None or world.copy is None:
        return
    kind = seen["kind"]
    copy = (kind, familiars.mate_colour(kind, seen["color"]))
    if copy == world.copy:
        return
    world.copy = copy
    world.note(mate.name, "copied", {"id": mate.name, "kind": copy[0], "color": copy[1]})
    world.tell("mate", "copy")


def _call_back(world: World, familiar: familiars.Familiar) -> None:
    """The living familiar runs back to the wizard by the shortest way over the cells a
    familiar enters, to the free cell beside the wizard nearest by that way (ties by y,
    then x), a cell a tick, and hands over what it carries in its last step's tick;
    beside the wizard already, it hands over with no step; with no way, it stays (D262)."""
    fid = familiar._k_id
    start = familiar._k_cell
    wizard = world.wizard._k_position
    beside = {Position(wizard.x + dx, wizard.y + dy) for dx, dy in DELTAS}
    if start in beside:
        _hand_over(world, familiar)
        return
    came: dict[Position, Position | None] = {start: None}
    edge, reached = [start], []
    while edge and not reached:
        ahead = []
        for cell in edge:
            for dx, dy in DELTAS:
                there = Position(cell.x + dx, cell.y + dy)
                if there in came or not world.familiar_can_enter(there):
                    continue
                if world.taken_by(there, familiar) is not None:
                    continue
                came[there] = cell
                ahead.append(there)
        reached = sorted((cell for cell in ahead if cell in beside), key=lambda c: (c.y, c.x))
        edge = ahead
    if not reached:
        here = list(world.wizard._k_position)
        world.note(fid, "blocked", {"at": here, "by": fid, "reason": "no_way", "tried": False})
        return
    way, cell = [], reached[0]
    while cell != start:
        way.append(cell)
        cell = came[cell] or start
    here = start
    for step in reversed(way):
        world.ready()
        facing = _direction(here, step).value
        familiar._set(cell=step, facing=facing)
        moved = {"from": list(here), "to": list(step), "facing": facing}
        world.act("move", moved, actor=fid)
        here = step
    _hand_over(world, familiar)


def _hand_over(world: World, familiar: familiars.Familiar) -> None:
    """The familiar hands the wizard everything it carries (D262)."""
    held = sorted(
        (t for t in world.things.values() if t._k_held == familiar._k_id), key=lambda t: t.name
    )
    if not held:
        return
    for thing in held:
        thing._carry()
    given = {"id": familiar._k_id, "things": [t.name for t in held], "at": list(familiar._k_cell)}
    world.note(familiar._k_id, "hand_over", given)


#: Each spell's effect, by its name (D42); kydux_world.level.KNOWN_SPELLS lists the
#: same names, so that a level can be checked without the world.
SPELLS: dict[str, Callable[[World, Position, Any], Effect]] = {
    "zelim": _zelim,
    "fendra": _fendra,
    "kirra": _kirra,
    "osto": _osto,
    "orvim": _orvim,
    "drevo": _drevo,
    "minka": _minka,
}
