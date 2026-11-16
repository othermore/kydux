#!/usr/bin/env python3
"""A chapter's walkthrough as one document for the owner to read and write on: every
story step, every lesson page, each level's card, start, route in its first way and won
card in every way, each way under its id, which the child never sees (D204), and the
check sheets of its scenes, from the pictures e2e/walkthrough.spec.ts takes (`npm run
walkthrough -- <chapter>` runs both), with a **Comentarios:** line under every picture.

    tools/walkthrough.py 03-passages

It writes drafts/recorrido-capitulo-<n>-<date>.es.md and its pictures in the folder of
the same name beside it, in Spanish, for the seeded wizard. A file already there may
have the owner's comments in it, so it is never overwritten: the next one has a number
after its date.
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
    """A text as Marta reads it: her forms, the friend's, and the names."""
    text = re.sub(r"\{\{([^{}|]*)\|([^{}|]*)\}\}", r"\1", text)
    text = re.sub(r"\{([^{}|]*)\|([^{}|]*)\}", r"\2", text)
    return text.replace("{wizard}", "Marta").replace("{friend}", "Teku").replace("{mate}", "Nuri")


def free_path(drafts: Path, number: int, day: str) -> Path:
    """Where the document goes: a name nothing has, since the owner may have written in
    one that is there."""
    stem = f"recorrido-capitulo-{number}-{day}"
    path = drafts / f"{stem}.es.md"
    turn = 2
    while path.exists():
        path = drafts / f"{stem}-{turn}.es.md"
        turn += 1
    return path


class Document:
    """The document being written, from the content and the pictures in `shots`."""

    def __init__(self, content: Path, shots: Path, pictures: Path) -> None:
        self.content, self.shots, self.pictures = content, shots, pictures
        self.lines: list[str] = []
        self.counts = {"story": 0, "lesson": 0}
        self.kinds: dict[str, int] = {}
        self.missing = 0

    def picture(self, name: str, caption: str, source: Path | None = None) -> None:
        """A picture, copied beside the document, with its caption and comments line."""
        path = source or self.shots / name
        if not path.exists():
            self.lines.append(f"*(falta la captura `{name}`)*\n")
            self.missing += 1
            return
        self.pictures.mkdir(parents=True, exist_ok=True)
        shutil.copy(path, self.pictures / name)
        self.lines += [
            f"![{caption}]({self.pictures.name}/{name})\n",
            f"*{caption}*\n",
            "**Comentarios:**\n\n",
        ]

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
        title = text["title"]
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
        if ways:
            # What the start card says of the ways, and what only this document names (D204).
            self.lines.append(f"**Lo que cambia cada vez:** {spoken(text.get('changes', ''))}\n")
            self.lines.append(
                "El nivel se juega en varias disposiciones, cada una con su nombre interno; "
                "el niño nunca ve estos nombres.\n"
            )
        for way in ways or [None]:
            tag = way["id"] if way else "unica"
            name = tag if way else "recorrido"
            if way:
                self.lines.append(f"### Disposición `{tag}`\n")
            else:
                self.lines.append("### El recorrido\n")
            frames = sorted(self.shots.glob(f"level-{level_id}-{tag}-tick-*.png"))
            if way and not frames:
                self.lines.append("El recorrido tick a tick se ve en la primera disposición.\n")
            for frame in frames:
                tick = int(re.search(r"tick-(\d+)", frame.name).group(1))
                self.picture(frame.name, f"{title}, {name}, tick {tick}")
            self.picture(f"level-{level_id}-{tag}-ganado.png", f"{title}, {name}: al ganar")
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


def write_document(chapter: str, repo: Path = REPO, day: str | None = None) -> Path:
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
    document = Document(content, shots, drafts / target.name.removesuffix(".es.md"))
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


def main(arguments: list[str]) -> int:
    if len(arguments) != 1:
        print(__doc__)
        return 2
    write_document(arguments[0])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
