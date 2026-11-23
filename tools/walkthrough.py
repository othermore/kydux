#!/usr/bin/env python3
"""A chapter's walkthrough as one document for the owner to read and write on: every
story step, with the pictures taken while its acts play before its own, every lesson
page, each level's card, start, route tick by tick and won card
in its first way (D216), and the check sheets of its scenes, from the pictures
e2e/walkthrough.spec.ts takes (`npm run walkthrough -- <chapter>` runs both), with a
**Comentarios:** line under every picture. A level with ways says under its card what
changes each time and what its card says when this time is different; with --all-ways,
the levels named show every way, each under its id, which the child never sees (D204).

    tools/walkthrough.py 03-passages
    tools/walkthrough.py 04-the-broom --all-ways the-shed,the-check
    tools/walkthrough.py --levels eldras-door the-moving-key left-or-right

It writes drafts/recorrido-capitulo-<n>-<date>.es.md and its pictures in the folder of
the same name beside it, in Spanish, for the seeded wizard. With --levels it writes
those levels alone, in the course's order, each under its chapter and with its number
there, from its chapter's pictures, to drafts/recorrido-niveles-cambiados-<date>.es.md.
A file already there may have the owner's comments in it, so it is never overwritten:
the next one has a number after its date.
"""

import datetime
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
KINDS = {"practice": "Práctica", "fix": "Arreglo", "improve": "Mejora", "challenge": "Reto"}
#: Who speaks, for the seeded wizard: Marta, a girl, so the friend is Teku.
WHO = {
    "voice": "la voz",
    "wizard": "Marta",
    "friend": "Teku, el amigo",
    "mate": "Nuri, la compañera",
}
SHEETS = (
    ("all", "Contacto"),
    ("sweep", "Barrido"),
    ("doors", "Puertas"),
    ("states", "Estados"),
)


def spoken(text: str) -> str:
    """A text as Marta reads it: her forms, the friend's, the names, and the words of the
    familiar a game with none yet is shown with (D266), as the page fills them."""
    sys.path.insert(0, str(REPO / "world" / "tests"))
    from wizard_words import for_wizard

    return for_wizard(text, "girl", "Marta", lang="es")


def free_path(drafts: Path, number: int | str, day: str) -> Path:
    """Where the document goes, a chapter's by its number or one named: a name nothing
    has, since the owner may have written in one that is there."""
    stem = f"recorrido-capitulo-{number}-{day}" if isinstance(number, int) else f"{number}-{day}"
    path = drafts / f"{stem}.es.md"
    turn = 2
    while path.exists():
        path = drafts / f"{stem}-{turn}.es.md"
        turn += 1
    return path


class Document:
    """The document being written, from the content and the pictures in `shots`."""

    def __init__(
        self, content: Path, shots: Path, pictures: Path, all_ways: frozenset[str] = frozenset()
    ) -> None:
        self.content, self.shots, self.pictures = content, shots, pictures
        #: The levels shown in every way; every other level in its first (D216).
        self.all_ways = all_ways
        self.lines: list[str] = []
        self.counts = {"story": 0, "lesson": 0}
        self.kinds: dict[str, int] = {}
        self.missing = 0

    def picture(
        self, name: str, caption: str, source: Path | None = None, comments: bool = True
    ) -> None:
        """A picture, copied beside the document, with its caption and, unless it is one
        of several the comments go under, its comments line."""
        path = source or self.shots / name
        if not path.exists():
            self.lines.append(f"*(falta la captura `{name}`)*\n")
            self.missing += 1
            return
        self.pictures.mkdir(parents=True, exist_ok=True)
        shutil.copy(path, self.pictures / name)
        self.lines += [f"![{caption}]({self.pictures.name}/{name})\n", f"*{caption}*\n"]
        if comments:
            self.lines.append("**Comentarios:**\n\n")

    def story(self, story_id: str) -> None:
        self.counts["story"] += 1
        folder = self.content / "stories" / story_id
        text = json.loads((folder / "text.es.json").read_text(encoding="utf-8"))
        about = json.loads((folder / "story.json").read_text(encoding="utf-8"))
        steps = text["steps"]
        self.lines.append(
            f"## Historia {self.counts['story']}: {text['title']} (`story:{story_id}`)\n"
        )
        self.lines.append(f"Escena `{about['scene']}`. {len(steps)} pasos.\n")
        for number, (step, said) in enumerate(zip(about["steps"], steps, strict=True), 1):
            who = WHO.get(step.get("who", "voice"), step.get("who", "").capitalize())
            self.lines.append(f"### Paso {number} de {len(steps)}: {who}\n")
            self.lines.append(f"> {spoken(said)}\n")
            # The pictures taken while the step's acts play, a, b and on, then its own,
            # the comments under the last.
            playing = sorted(self.shots.glob(f"story-{story_id}-{number:02d}-[a-z].png"))
            for shot in playing:
                letter = shot.stem.rsplit("-", 1)[1]
                caption = f"{text['title']}, paso {number}, mientras ocurre ({letter})"
                self.picture(shot.name, caption, comments=False)
            self.picture(f"story-{story_id}-{number:02d}.png", f"{text['title']}, paso {number}")

    def lesson(self, lesson_id: str) -> None:
        self.counts["lesson"] += 1
        markdown = (self.content / "lessons" / lesson_id / "es.md").read_text(encoding="utf-8")
        title = markdown.splitlines()[0].lstrip("# ").strip()
        pages = markdown.split("\n---\n")
        self.lines.append(f"## Lección {self.counts['lesson']}: {title} (`lesson:{lesson_id}`)\n")
        self.lines.append(f"{len(pages)} páginas; el código de cada una, ya ejecutado.\n")
        for number, page in enumerate(pages, 1):
            heading = page.strip().splitlines()[0].lstrip("# ").strip()
            self.lines.append(f"### Página {number} de {len(pages)}: {heading}\n")
            plan = f"lesson-{lesson_id}-{number:02d}-plano.png"
            if (self.shots / plan).exists():
                self.picture(plan, f"{title}, página {number}: el plano que abre su código")
            self.picture(f"lesson-{lesson_id}-{number:02d}.png", f"{title}, página {number}")

    def level(self, level_id: str) -> None:
        folder = self.content / "levels" / level_id
        about = json.loads((folder / "level.json").read_text(encoding="utf-8"))
        text = json.loads((folder / "text.es.json").read_text(encoding="utf-8"))
        kind = KINDS.get(about.get("kind", "practice"), about.get("kind", ""))
        self.kinds[kind] = self.kinds.get(kind, 0) + 1
        title = spoken(text["title"])
        self.lines.append(f"## {kind} {self.kinds[kind]}: {title} (`level:{level_id}`)\n")
        where = f"Escena `{about['scene']}`. Empieza en {tuple(about['start'])}"
        if about.get("end"):
            where += f", la marca está en {tuple(about['end'])}"
        self.lines.append(where + ".\n")
        goals = " ".join(f"({i}) {goal}" for i, goal in enumerate(text["goals"], 1))
        self.lines.append(f"**Objetivos:** {spoken(goals)}\n")
        self.lines.append("### La tarjeta de entrada\n")
        self.lines.append(f"> {spoken(text.get('intro', ''))}\n")
        self.picture(f"level-{level_id}-00-tarjeta.png", f"{title}, tarjeta de entrada")
        self.lines.append("### El inicio, con el código de partida\n")
        self.picture(f"level-{level_id}-01-inicio.png", f"{title}, inicio")
        self.lines.append("### El programa que lo resuelve\n")
        solution = (folder / "solution.py").read_text(encoding="utf-8").rstrip()
        self.lines.append(f"```python\n{solution}\n```\n")
        ways = about.get("ways") or []
        every = bool(ways) and level_id in self.all_ways
        if ways:
            # What the start card says of what changes, and what a run's card says first
            # when the scene is another (D204); a level is shown in its first way (D216).
            self.lines.append(f"**Lo que cambia cada vez:** {spoken(text.get('changes', ''))}\n")
            self.lines.append(
                f"**Lo que dice cuando esta vez es distinto:** {spoken(text.get('changed', ''))}\n"
            )
        if every:
            self.lines.append(
                "Aquí se ve en todas sus disposiciones, cada una con su nombre interno; "
                "el niño nunca ve estos nombres.\n"
            )
        for way in (ways if every else ways[:1]) or [None]:
            tag = way["id"] if way else "unica"
            name = tag if every else "recorrido"
            if every:
                self.lines.append(f"### Disposición `{tag}`\n")
            else:
                self.lines.append("### El recorrido\n")
            frames = sorted(self.shots.glob(f"level-{level_id}-{tag}-tick-*.png"))
            if every and not frames:
                self.lines.append("El recorrido tick a tick se ve en la primera disposición.\n")
            for frame in frames:
                tick = int(re.search(r"tick-(\d+)", frame.name).group(1))
                self.picture(frame.name, f"{title}, {name}, tick {tick}")
            self.picture(f"level-{level_id}-{tag}-ganado.png", f"{title}, {name}: al ganar")
            # A trial that does not hold is seen while someone speaks, the card after it
            # (D276).
            card = f"level-{level_id}-{tag}-ganado-tarjeta.png"
            if (self.shots / card).exists():
                self.picture(card, f"{title}, {name}: la tarjeta al ganar")
        plan = f"level-{level_id}-plano.png"
        if (self.shots / plan).exists():
            self.lines.append("### El plano del mapa, abierto con `orvim`\n")
            self.picture(plan, f"{title}, el plano abierto")
        self.lines.append(f"**Al ganar dice:** {spoken(text.get('outro', ''))}\n")
        if text.get("learned"):
            self.lines.append(f"**Ahora sabes:** {spoken(text['learned'])}\n")

    def sheets(self, scenes: list[str], check: Path) -> None:
        self.lines.append("## Hojas de comprobación de las escenas\n")
        self.lines.append(
            "Tal como las deja `tools/art/export_scene.py`. El **contacto** pone una figura en "
            "cada casilla por la que se anda; el **barrido** recorta donde queda tapada; las "
            "**puertas** enseñan cada puerta cerrada y abierta; los **estados** las demás cosas "
            "que cambian.\n"
        )
        for scene in scenes:
            self.lines.append(f"### `{scene}`\n")
            for kind, label in SHEETS:
                source = check / f"{kind}-{scene}.png"
                if source.exists() and source.stat().st_size > 200:
                    self.picture(f"hoja-{kind}-{scene}.png", f"{label}: {scene}", source)


def scenes_of(content: Path, items: list[str]) -> list[str]:
    """The scenes a chapter's levels and stories are played on, in their order."""
    found: list[str] = []
    for item in items:
        kind, _, item_id = item.partition(":")
        if kind == "lesson":
            continue
        folder = (
            "stories/" + item_id + "/story.json"
            if kind == "story"
            else f"levels/{item_id}/level.json"
        )
        scene = json.loads((content / folder).read_text(encoding="utf-8")).get("scene")
        if scene and scene not in found:
            found.append(scene)
    return found


def built_from(repo: Path) -> str:
    """The commit the pictures are of, as the document says it, or nothing outside git."""
    done = subprocess.run(
        ["git", "-C", str(repo), "rev-parse", "--short", "HEAD"], capture_output=True, text=True
    )
    return f" (commit {done.stdout.strip()})" if done.returncode == 0 else ""


def write_document(
    chapter: str, repo: Path = REPO, day: str | None = None, all_ways: frozenset[str] = frozenset()
) -> Path:
    content = repo / "content"
    shots = repo / "app" / "e2e" / "shots" / f"walkthrough-{chapter}"
    folder = content / "chapters" / chapter
    items = json.loads((folder / "chapter.json").read_text(encoding="utf-8"))["items"]
    title = json.loads((folder / "text.es.json").read_text(encoding="utf-8"))["title"]
    number = int(chapter.split("-")[0])
    day = day or datetime.date.today().isoformat()
    drafts = repo / "drafts"
    drafts.mkdir(exist_ok=True)
    target = free_path(drafts, number, day)
    document = Document(content, shots, drafts / target.name.removesuffix(".es.md"), all_ways)
    document.lines += [
        f"# Capítulo {number}, {title}: todo el capítulo de principio a fin\n",
        f"Capturas del juego construido{built_from(repo)}, jugado por Marta en español, a 1280 "
        f"por 800: las {len(items)} paradas del capítulo, y al final las hojas de comprobación "
        "de sus escenas. Debajo de cada captura hay una línea **Comentarios:** para que "
        "escribas lo que ves mal.\n",
        "---\n",
    ]
    for item in items:
        kind, _, item_id = item.partition(":")
        {"story": document.story, "lesson": document.lesson, "level": document.level}[kind](
            item_id
        )
        document.lines.append("---\n")
    document.sheets(scenes_of(content, items), repo / "art" / "raw" / "game-check")
    target.write_text("\n".join(document.lines), encoding="utf-8")
    print(f"{target}: {document.missing} pictures missing")
    return target


def write_levels(
    levels: list[str],
    repo: Path = REPO,
    day: str | None = None,
    all_ways: frozenset[str] = frozenset(),
) -> Path:
    """Some levels alone, in the course's order, each under its chapter's heading, with
    its kind's number in its chapter and its chapter's pictures (sprint 42, 2.9)."""
    content = repo / "content"
    chapters = sorted(p.parent for p in (content / "chapters").glob("*/chapter.json"))
    day = day or datetime.date.today().isoformat()
    drafts = repo / "drafts"
    drafts.mkdir(exist_ok=True)
    target = free_path(drafts, "recorrido-niveles-cambiados", day)
    pictures = drafts / target.name.removesuffix(".es.md")
    document = Document(content, Path(), pictures, all_ways)
    document.lines += [
        "# Los niveles cuyos textos cambian, de principio a fin\n",
        f"Capturas del juego construido{built_from(repo)}, jugado por Marta en español, a 1280 "
        f"por 800: los {len(levels)} niveles, en el orden del curso, cada uno como lo enseña "
        "el recorrido de su capítulo. Debajo de cada captura hay una línea **Comentarios:** "
        "para que escribas lo que ves mal.\n",
        "---\n",
    ]
    found = []
    for folder in chapters:
        items = json.loads((folder / "chapter.json").read_text(encoding="utf-8"))["items"]
        shown = False
        kinds: dict[str, int] = {}
        for item in items:
            kind, _, item_id = item.partition(":")
            if kind != "level":
                continue
            about = json.loads(
                (content / "levels" / item_id / "level.json").read_text(encoding="utf-8")
            )
            name = KINDS.get(about.get("kind", "practice"), about.get("kind", ""))
            if item_id in levels:
                if not shown:
                    title = json.loads((folder / "text.es.json").read_text(encoding="utf-8"))
                    number = int(folder.name.split("-")[0])
                    document.lines.append(f"# Capítulo {number}, {title['title']}\n")
                    shown = True
                document.shots = repo / "app" / "e2e" / "shots" / f"walkthrough-{folder.name}"
                document.kinds = dict(kinds)
                document.level(item_id)
                document.lines.append("---\n")
                found.append(item_id)
            kinds[name] = kinds.get(name, 0) + 1
    missing = sorted(set(levels) - set(found))
    if missing:
        raise ValueError(f"no level {', '.join(missing)} in the course")
    target.write_text("\n".join(document.lines), encoding="utf-8")
    print(f"{target}: {document.missing} pictures missing")
    return target


def main(arguments: list[str]) -> int:
    all_ways: frozenset[str] = frozenset()
    if "--all-ways" in arguments:
        at = arguments.index("--all-ways")
        if at + 1 >= len(arguments):
            print(__doc__)
            return 2
        all_ways = frozenset(name for name in arguments[at + 1].split(",") if name)
        arguments = arguments[:at] + arguments[at + 2 :]
    if len(arguments) >= 2 and arguments[0] == "--levels":
        write_levels(arguments[1:], all_ways=all_ways)
        return 0
    if len(arguments) != 1:
        print(__doc__)
        return 2
    write_document(arguments[0], all_ways=all_ways)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
