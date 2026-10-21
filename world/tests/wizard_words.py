"""The words that follow the wizard (D37), resolved as the page resolves them, so
that a test can read a text as a boy's wizard and as a girl's would see it."""

import re

CHOICE = re.compile(r"\{([^{}|\n]*)\|([^{}|\n]*)\}")
SIDES = {"boy": 1, "girl": 2}


def for_wizard(text: str, gender: str, name: str = "Ana") -> str:
    side = SIDES[gender]
    return CHOICE.sub(lambda m: m.group(side), text).replace("{wizard}", name)
