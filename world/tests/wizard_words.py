"""The words that follow the wizard (D37) and the friend (D77), resolved as the
page resolves them, so that a test can read a text as a boy's wizard and as a
girl's would see it. The friend is of the wizard's other gender: Nuri for a boy,
Teku for a girl."""

import re

FRIEND_CHOICE = re.compile(r"\{\{([^{}|\n]*)\|([^{}|\n]*)\}\}")
CHOICE = re.compile(r"\{([^{}|\n]*)\|([^{}|\n]*)\}")
SIDES = {"boy": 1, "girl": 2}
#: The friend who teaches, by the wizard's gender: the other gender's (D77).
FRIEND = {"boy": ("nuri", "girl", "Nuri"), "girl": ("teku", "boy", "Teku")}


def friend_of(gender: str) -> tuple[str, str, str]:
    """The friend of a wizard of `gender`: their id, their gender and their name."""
    return FRIEND[gender]


def for_wizard(text: str, gender: str, name: str = "Ana") -> str:
    _id, friend_gender, friend_name = friend_of(gender)
    text = FRIEND_CHOICE.sub(lambda m: m.group(SIDES[friend_gender]), text)
    text = CHOICE.sub(lambda m: m.group(SIDES[gender]), text)
    return text.replace("{wizard}", name).replace("{friend}", friend_name)
