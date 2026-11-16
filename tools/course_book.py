#!/usr/bin/env python3
"""The course so far as one document to read and comment on: every chapter's
stories, lessons and levels in order, each story as its steps with who says
each and what they do (D74), with the texts the child reads, what
each lesson teaches, and each level's goals, starting code, hints and solution.

    tools/course_book.py [--lang es] [--gender girl] [out.md]

The texts are made for a wizard of the gender given (D37), named «(nombre)»,
so that the reader sees them as a child would. Written to drafts/ unless a
path is given; drafts/ is not committed, and the book is derived from
content/, so it is made again whenever the content changes.
"""

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CONTENT = REPO / "content"
sys.path.insert(0, str(REPO / "world"))
sys.path.insert(0, str(REPO / "world" / "tests"))
from wizard_words import friend_of, mate_of  # noqa: E402

WORDS = {
    "es": {
        "title": "Kydux — la historia y el curso, hasta ahora",
        "about": (
            "Todo lo que lee el niño, en el orden en que lo lee, y lo que cada "
            "nivel pide y cómo se resuelve. Los textos están puestos para {gender}; "
            "donde el juego pone el nombre del personaje, aquí dice «(nombre)»."
        ),
        "girl": "una maga",
        "boy": "un mago",
        "opening": "La apertura del juego",
        "chapter": "Capítulo",
        "story": "Historia",
        "lesson": "Lección",
        "teaches": "Lo que enseña",
        "level": "Nivel",
        "kinds": {
            "practice": "Práctica",
            "fix": "Arreglo",
            "improve": "Mejora",
            "challenge": "Desafío",
        },
        "scene": "Escena",
        "speaker": "Habla",
        "intro": "Antes de empezar",
        "goals": "Objetivos",
        "bonus": "Extra",
        "starting": "El programa con el que empieza",
        "empty": "(vacío)",
        "hints": "Pistas",
        "solution": "Solución",
        "changes": "Lo que cambia cada vez",
        "ways": "Disposiciones (nombres internos, que el niño nunca ve)",
        "outro": "Al ganar",
        "learned": "Lo aprendido",
        "page": "Página",
        "voice": "Narración",
        "does": {
            "walk": "camina",
            "face": "se vuelve",
            "appear": "aparece",
            "vanish": "se va",
            "sleep": "se acuesta",
            "wake": "se levanta",
            "open": "abre la puerta",
            "close": "cierra la puerta",
        },
        "carrying": "Lleva desde el principio",
    },
    "en": {
        "title": "Kydux — the story and the course, so far",
        "about": (
            "Everything the child reads, in the order they read it, and what each "
            "level asks and how it is solved. The texts are made for {gender}; where "
            "the game puts the wizard's name, this says «(name)»."
        ),
        "girl": "a girl wizard",
        "boy": "a boy wizard",
        "opening": "The game's opening",
        "chapter": "Chapter",
        "story": "Story",
        "lesson": "Lesson",
        "teaches": "What it teaches",
        "level": "Level",
        "kinds": {
            "practice": "Practice",
            "fix": "Fix",
            "improve": "Improve",
            "challenge": "Challenge",
        },
        "scene": "Scene",
        "speaker": "Spoken by",
        "intro": "Before it starts",
        "goals": "Goals",
        "bonus": "Bonus",
        "starting": "The program it starts with",
        "empty": "(empty)",
        "hints": "Hints",
        "solution": "Solution",
        "changes": "What changes each time",
        "ways": "Arrangements (inner names, which the child never sees)",
        "outro": "On a win",
        "learned": "What was learned",
        "page": "Page",
        "voice": "Narration",
        "does": {
            "walk": "walks",
            "face": "turns",
            "appear": "appears",
            "vanish": "goes",
            "sleep": "lies down",
            "wake": "gets up",
            "open": "opens the door",
            "close": "closes the door",
        },
        "carrying": "Carried from the start",
    },
}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def character(speaker: str, lang: str, gender: str) -> str:
    """A character's name; `friend` is the friend of the wizard's other gender (D77),
    `mate` the dormitory mate of its own (D84)."""
    names = load_json(REPO / "i18n" / f"{lang}.json").get("characters", {})
    who = (
        friend_of(gender)[0]
        if speaker == "friend"
        else mate_of(gender)[0]
        if speaker == "mate"
        else speaker
    )
    return names.get(who, who)


def pages(markdown: str) -> list[str]:
    return [p.strip() for p in re.split(r"^---$", markdown, flags=re.M) if p.strip()]


def made(text: str, lang: str, gender: str, name: str) -> str:
    from wizard_words import for_wizard

    return for_wizard(text, gender, name)


def story_section(story_id: str, lang: str, gender: str, name: str, w: dict) -> list[str]:
    """A story (D74) as its steps: who says each, what is done before it, the words."""
    path = CONTENT / "stories" / story_id
    about = load_json(path / "story.json")
    text = load_json(path / f"text.{lang}.json")
    title = made(text.get("title", story_id), lang, gender, name)
    lines = [f"### {w['story']}: {title}", "", f"*{w['scene']}: {about.get('scene')}*", ""]

    def who_is(who: str) -> str:
        if who == "voice":
            return w["voice"]
        return name if who == "wizard" else character(who, lang, gender)

    for step, said in zip(about.get("steps", []), text.get("steps", []), strict=False):
        # A step may do several things, each by its own figure (D103).
        doing = step.get("do") or []
        for action in doing if isinstance(doing, list) else [doing]:
            kind = next((key for key in action if key in w["does"]), None)
            if kind:
                who = action.get("by", step.get("by", step["who"]))
                lines += [f"*({who_is(who)} {w['does'][kind]})*", ""]
        lines += [f"**{who_is(step['who'])}:** {made(said, lang, gender, name)}", ""]
    return lines


def lesson_section(
    lesson_id: str, number: str, lang: str, gender: str, name: str, w: dict
) -> list[str]:
    path = CONTENT / "lessons" / lesson_id
    about = load_json(path / "lesson.json")
    body = made((path / f"{lang}.md").read_text(encoding="utf-8"), lang, gender, name)
    body = body.replace("```python try", "```python")
    parts = pages(body)
    title = re.sub(r"^#\s+", "", parts[0].splitlines()[0]) if parts else lesson_id
    lines = [f"### {number}: {title}", ""]
    if about.get("speaker"):
        lines += [f"*{w['speaker']}: {character(about['speaker'], lang, gender)}*", ""]
    taught = ", ".join(f"`{t}`" for t in about.get("teaches", []))
    if taught:
        lines += [f"*{w['teaches']}: {taught}*", ""]
    for index, page in enumerate(parts, 1):
        text = page if index > 1 else "\n".join(page.splitlines()[1:]).strip()
        lines += [f"**{w['page']} {index}**", "", text, ""]
    return lines


def level_section(
    level_id: str, number: str, lang: str, gender: str, name: str, w: dict
) -> list[str]:
    path = CONTENT / "levels" / level_id
    level = load_json(path / "level.json")
    text = load_json(path / f"text.{lang}.json")
    say = lambda s: made(s, lang, gender, name)  # noqa: E731
    lines = [f"### {number}: {say(text['title'])}", ""]
    facts = []
    if level.get("scene"):
        facts.append(f"{w['scene']}: `{level['scene']}`")
    if level.get("speaker"):
        facts.append(f"{w['speaker']}: {character(level['speaker'], lang, gender)}")
    if level.get("carrying"):
        kinds = [entry if isinstance(entry, str) else entry["kind"] for entry in level["carrying"]]
        facts.append(f"{w['carrying']}: {', '.join(kinds)}")
    lines += [f"*{' · '.join(facts)}*", ""]
    if text.get("intro"):
        lines += [f"**{w['intro']}** — {say(text['intro'])}", ""]
    lines += [f"**{w['goals']}**", ""]
    for goal, spec in zip(text["goals"], level.get("goals", []), strict=False):
        bonus = f"{w['bonus']}: " if spec.get("bonus") else ""
        lines.append(f"- {bonus}{say(goal)}")
    lines.append("")
    if level.get("ways"):
        # What the start card says, and the ways' ids, which only this book names (D204).
        lines += [f"**{w['changes']}**: {say(text.get('changes', ''))}", ""]
        lines += [f"**{w['ways']}**: " + ", ".join(f"`{way['id']}`" for way in level["ways"]), ""]
    code = say(text.get("starting_code", ""))
    lines += [f"**{w['starting']}**", ""]
    lines += [f"```python\n{code}```" if code.strip() else w["empty"], ""]
    if text.get("hints"):
        lines += [f"**{w['hints']}**", ""]
        lines += [f"{i}. {say(h)}" for i, h in enumerate(text["hints"], 1)]
        lines.append("")
    solution = (path / "solution.py").read_text(encoding="utf-8")
    lines += [f"**{w['solution']}**", "", f"```python\n{solution}```", ""]
    if text.get("outro"):
        lines += [f"**{w['outro']}** — {say(text['outro'])}", ""]
    if text.get("learned"):
        lines += [f"**{w['learned']}** — {say(text['learned'])}", ""]
    return lines


def book(lang: str, gender: str) -> str:
    w = WORDS[lang]
    name = "(nombre)" if lang == "es" else "(name)"
    lines = [f"# {w['title']}", "", w["about"].format(gender=w[gender]), ""]
    opening = [
        p for p in (CONTENT / "stories").iterdir() if load_json(p / "story.json").get("opening")
    ]
    if opening:
        lines += [f"## {w['opening']}", ""]
        lines += story_section(opening[0].name, lang, gender, name, w)
    for chapter_dir in sorted(
        p for p in (CONTENT / "chapters").iterdir() if (p / "chapter.json").is_file()
    ):
        chapter = load_json(chapter_dir / "chapter.json")
        title = load_json(chapter_dir / f"text.{lang}.json").get("title", chapter["id"])
        lines += [f"## {w['chapter']} {chapter_dir.name[:2].lstrip('0')}: {title}", ""]
        counts: dict[str, int] = {}
        for item in chapter["items"]:
            kind, _, item_id = item.partition(":")
            if kind == "story":
                lines += story_section(item_id, lang, gender, name, w)
            elif kind == "lesson":
                counts["lesson"] = counts.get("lesson", 0) + 1
                lines += lesson_section(
                    item_id, f"{w['lesson']} {counts['lesson']}", lang, gender, name, w
                )
            else:
                level_kind = load_json(CONTENT / "levels" / item_id / "level.json").get(
                    "kind", "practice"
                )
                counts[level_kind] = counts.get(level_kind, 0) + 1
                number = f"{w['kinds'][level_kind]} {counts[level_kind]}"
                lines += level_section(item_id, number, lang, gender, name, w)
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="The course so far, as one document.")
    parser.add_argument("--lang", default="es", choices=sorted(WORDS))
    parser.add_argument("--gender", default="girl", choices=("girl", "boy"))
    parser.add_argument("out", nargs="?", type=Path)
    args = parser.parse_args()
    out = args.out or REPO / "drafts" / f"course-book.{args.lang}.md"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(book(args.lang, args.gender), encoding="utf-8")
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
