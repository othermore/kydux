"""The words that follow the wizard (D37), the friend (D77) and the dormitory mate
(D84), resolved as the page resolves them, so that a test can read a text as a
boy's wizard and as a girl's would see it. The friend is of the wizard's other
gender and the mate of its own, as app/src/engine/looks.ts has them; their names
are the page's, from i18n."""

import json
import re
from functools import cache
from pathlib import Path

I18N = Path(__file__).resolve().parents[2] / "i18n"
FRIEND_CHOICE = re.compile(r"\{\{([^{}|\n]*)\|([^{}|\n]*)\}\}")
CHOICE = re.compile(r"\{([^{}|\n]*)\|([^{}|\n]*)\}")
SIDES = {"boy": 1, "girl": 2}
#: The friend who teaches, by the wizard's gender: the other gender's, its id and
#: its gender (D77, looks.ts's teacherFriend).
FRIEND = {"boy": ("nuri", "girl"), "girl": ("teku", "boy")}
#: The dormitory mate, by the wizard's gender: its own (D84, looks.ts's dormitoryMate).
MATE = {"boy": "teku", "girl": "nuri"}


@cache
def names(lang: str = "en") -> dict[str, str]:
    """The characters' names in a language, as the page says them."""
    return json.loads((I18N / f"{lang}.json").read_text(encoding="utf-8"))["characters"]


def friend_of(gender: str, lang: str = "en") -> tuple[str, str, str]:
    """The friend of a wizard of `gender`: their id, their gender and their name."""
    friend_id, friend_gender = FRIEND[gender]
    return friend_id, friend_gender, names(lang)[friend_id]


def mate_of(gender: str, lang: str = "en") -> tuple[str, str]:
    """The dormitory mate of a wizard of `gender`: their id and their name."""
    return MATE[gender], names(lang)[MATE[gender]]


#: A choice by the familiar's kind's gender, `{familiar:el|la}` (D266).
FAMILIAR_CHOICE = re.compile(r"\{familiar:([^{}|\n]*)\|([^{}|\n]*)\}")
#: The class kept for the default familiar: level 10's solution's (D266).
SOURCE = (
    "class Fox(Familiar):\n"
    "    def __init__(self, name, color):\n"
    "        self.name = name\n"
    "        self.color = color"
)


def familiar_words(lang: str = "en", draft: dict | None = None) -> dict[str, str]:
    """The familiar's placeholders as the page fills them from a game with no familiar
    yet: the level's default draft, Pimu the red fox (D266), its words from i18n's
    `familiars` where they are, its class's name in small letters where not."""
    import sys

    sys.path.insert(0, str(I18N.parent / "world"))
    from kydux_world import familiars

    draft = draft or familiars.DEFAULT
    kind, name, color = draft["kind"], draft["name"], draft["color"]
    mate = familiars.mate_colour(kind, color) or ""
    others = familiars.friends_names(name)
    words = json.loads((I18N / f"{lang}.json").read_text(encoding="utf-8")).get("familiars", {})
    own = words.get(kind, {})
    colour = words.get("colors", {}).get(color, {})
    gender = own.get("gender", "m")
    return {
        "familiar": name,
        "familiar_var": name.lower(),
        "familiar_class": kind,
        "familiar_color": color,
        "familiar_kind": own.get("kind", kind.lower()),
        "familiar_a_kind": own.get("a_kind", kind.lower()),
        "familiar_color_word": colour.get(gender, color) if isinstance(colour, dict) else color,
        "familiar_source": SOURCE.replace("Fox", kind),
        "mate_familiar": others["mate"],
        "mate_var": others["mate"].lower(),
        "mate_color": mate,
        "friend_familiar": others["friend"],
        "_gender": gender,
    }


def for_wizard(text: str, gender: str, name: str = "Ana", lang: str = "en") -> str:
    _id, friend_gender, friend_name = friend_of(gender, lang)
    text = FRIEND_CHOICE.sub(lambda m: m.group(SIDES[friend_gender]), text)
    familiar = familiar_words(lang)
    side = 1 if familiar.pop("_gender") == "m" else 2
    text = FAMILIAR_CHOICE.sub(lambda m: m.group(side), text)
    for key, value in sorted(familiar.items(), key=lambda kv: -len(kv[0])):
        text = text.replace(f"{{{key}}}", value)
    text = CHOICE.sub(lambda m: m.group(SIDES[gender]), text)
    text = text.replace("{wizard}", name).replace("{friend}", friend_name)
    return text.replace("{mate}", mate_of(gender, lang)[1])
