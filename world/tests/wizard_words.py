"""The words that follow the wizard (D37) and the friend (D77), resolved as the
page resolves them, so that a test can read a text as a boy's wizard and as a
girl's would see it. The friend is of the wizard's other gender, as
app/src/engine/looks.ts has it; their names are the page's, from i18n."""

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


@cache
def names(lang: str = "en") -> dict[str, str]:
    """The characters' names in a language, as the page says them."""
    return json.loads((I18N / f"{lang}.json").read_text(encoding="utf-8"))["characters"]


def friend_of(gender: str, lang: str = "en") -> tuple[str, str, str]:
    """The friend of a wizard of `gender`: their id, their gender and their name."""
    friend_id, friend_gender = FRIEND[gender]
    return friend_id, friend_gender, names(lang)[friend_id]


def for_wizard(text: str, gender: str, name: str = "Ana", lang: str = "en") -> str:
    _id, friend_gender, friend_name = friend_of(gender, lang)
    text = FRIEND_CHOICE.sub(lambda m: m.group(SIDES[friend_gender]), text)
    text = CHOICE.sub(lambda m: m.group(SIDES[gender]), text)
    return text.replace("{wizard}", name).replace("{friend}", friend_name)
