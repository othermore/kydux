#!/usr/bin/env python3
"""The characters' walking sheets in every look (13.2, D77): each look of the
creator, and each friend, made from a base sheet by recolouring its parts, so
that the figures stay the same drawing and only their colours change.

    tools/art/figures.py [--check]
    tools/art/figures.py --cast <boy|girl> <edit.png>
    tools/art/figures.py --pickup <boy|girl> <edit.png>
    tools/art/figures.py --win <boy|girl> <edit.png>
    tools/art/figures.py --standing <figure> <drawing.png>
    tools/art/figures.py --fly <boy|girl> <edit.png>
    tools/art/figures.py --drawn <figure> <drawing.png>
    tools/art/figures.py --drawn-fly <figure> <drawing.png>
    tools/art/figures.py --drawn-sit <figure> <drawing.png>
    tools/art/figures.py --familiar <kind> <colour> <drawing.png>
    tools/art/figures.py --familiars-check

A figure's standing frame, in every row of its sheet, has its feet together and its
weight on both, and a walking frame is made from it (D147). --standing makes a
figure's sheet again from a drawing of it standing still in the four views: each view
is cut from the drawing's magenta, as tall as the sheet's figure, its feet on the
frame's foot line, and each walking row made from it as below (STANDING_DRAWN).

A base sheet is four rows (down, left, right, up) of three frames, as
content/art/figures/figures.json says. Each opaque pixel is told by its colour
and its place in its frame: the hat and the robe are the base's cloth colour,
told apart by the hat's band; the band and the robe's stars are its gold; the
hair is the dark brown above the robe, the skin the light warm colour; the
outlines, the eyes' darkest and the boots are left as they are. A part takes
its new colour with its shading kept: each pixel's lightness against the
part's middle lightness. The looks' colours are app/src/engine/looks.ts's.

Every sheet is steadied before it is used (`steadied`): each frame is shifted
sideways so that its body lies over its row's standing frame, which keeps a
figure from swaying as it walks, whatever each frame's drawing or cut did. Then
every walking row is made from its standing frame (`walking`): a step frame is
the standing frame with only its legs, the lowest LEGS of the figure, taken
from the step's drawing, so that a figure walks moving its feet alone, never
turning its head or its arms; a figure that floats (FLOATING) has no legs, and
its step frames are the standing frame with its dress grown downward and its hem
swung, left in one and right in the other, which the page cycles through while
the figure stands (D120); figures.json lists them (`floating`).

Writes content/art/figures/wizard-<look>.webp for every look and the friends'
sheets named in FRIENDS, from the bases in art/figures/ (BASES), and their list in
figures.json; --check writes art/raw/figures-check.png, every sheet side by
side with the drawn figures, the things' sprites and the portraits, to look at. A wizard's
sheet has four more rows after its walking ones, the same ways in the same
order: casting, the wand raised, pointed with its light and lowered,
recoloured from the casting base of its gender (CAST_BASES);
four more, picking up the way it faces, bending, at the ground with both hands
in front of its feet and half up again (PICKUP_BASES); one facing down,
celebrating (WIN_BASES); and one asleep (SLEEP_BASES, D91), which the friends'
sheets have too, after their walking rows. figures.json names the rows (`rows`,
ROWS, and `sheets` for a sheet whose rows differ). --cast and --pickup make their
bases from Gemini's edits of the walking base (tools/art/prompts/figure-cast-
<gender>.md, figure-pickup-<gender>.md); --win from an edit of a sheet of the
standing frame (figure-act-<gender>.md); --sleep from an edit of the standing
sheet --sleep-input makes (figure-sleep-<kind>.md); each is put back on the
base's grid. Last, four rows flying (D188), riding the broom the way it faces, from
Gemini's edit of the walking base (--fly, figure-fly-<gender>.md): each row's middle
figure, level, then a little up and a little down, for the bobbing (FLY_BASES).

A figure with no sheet before it, a pupil a year older (DRAWN: Zarek, Rinlo), is made
from a drawing of it standing still in the four views (--drawn), each view as tall as
DRAWN says, its walking rows its standing frame three times; and its flying rows from a
drawing of it riding the broom in the same four views (--drawn-fly), scaled as its
standing views, bobbing as the wizard's; some views may be drawn again
(--drawn-fly-view), each as tall as the one it replaces. figures.json says its rows in
`sheets`.

A drawn figure may sit on the floor (--drawn-sit, D273): four more rows after its
walking and flying ones, from a drawing of it sitting in the four views, each view its
row's three frames, as tall as DRAWN_SIT says; Rinlo hiding in the forgotten room.

The familiars (--familiar, D273) are walking sheets of their own, one a kind and a colour
(FAMILIARS): Gemini's drawing of the creature in four rows of three on flat magenta, each
figure cut to its piece, scaled as its kind's standing figure facing down is FAMILIARS'
height, about half a child's, its bottom on the frame's foot line, the magenta's shades
round it cleared; the row to the right is the steadied row to the left turned over, and
a colour that is not the kind's first is checked against the first's sheet, frame by
frame. figures.json lists them (`familiars`) with their size (`familiar_height_cells`);
--familiars-check writes art/raw/game-check/figures-check-5.png to look at.

Each look's portrait (--portraits, D194) is its gender's base bust (PORTRAIT_BASES, cut
from Gemini's portrait of the base sheet's figure) with each part in the look's colour:
a bust's parts are read by portrait_parts, since its hat's brim lies below its band.
"""

import argparse
import colorsys
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
FIGURES = REPO / "content" / "art" / "figures"
LOOKS_TS = REPO / "app" / "src" / "engine" / "looks.ts"
RAW = REPO / "art" / "raw"
#: The base sheets, kept in the repository: what every look is recoloured from.
BASE_DIR = REPO / "art" / "figures"

#: The base sheets, each with the hue range (in degrees) of the cloth it is drawn
#: in: the wizard's blue for the boy and the girl (the girl's made from the boy's
#: by a Gemini edit), and the friends' green, Teku's short curls and Nuri's long
#: hair (Nuri's made from Teku's by an edit).
BASES = {
    "boy": ("wizard-base-boy.webp", (190, 260)),
    "girl": ("wizard-base-girl.webp", (190, 260)),
    "friend-boy": ("friend-base-boy.webp", (80, 170)),
    "friend-girl": ("friend-base-girl.webp", (80, 170)),
}
#: The wizard's casting frames, by gender: four rows of three, as the walking base's.
CAST_BASES = {"boy": "wizard-cast-boy.webp", "girl": "wizard-cast-girl.webp"}
#: The wizard picking up, by gender: four rows of three, as the walking base's,
#: bending forward, at the ground with both hands in front of the feet, and half
#: up again, the way it faces.
PICKUP_BASES = {"boy": "wizard-pickup-boy.webp", "girl": "wizard-pickup-girl.webp"}
#: The wizard celebrating, by gender: one row facing down, the arms up, a jump,
#: down again.
WIN_BASES = {"boy": "wizard-win-boy.webp", "girl": "wizard-win-girl.webp"}
#: Asleep, lying on the back seen from above, upright in the frame (the page lays
#: it along the bed, D91), by the sheet it is drawn for: one frame, three times.
SLEEP_BASES = {
    "boy": "wizard-sleep-boy.webp",
    "girl": "wizard-sleep-girl.webp",
    "friend-boy": "friend-sleep-boy.webp",
    "friend-girl": "friend-sleep-girl.webp",
}
#: The rows of a wizard's sheet by what they are (figures.json's `rows`): the
#: walking, casting and picking-up rows four each (down, left, right, up), then
#: the celebrating one, then the sleeping one. A friend's sheet has its walking
#: rows and its sleeping row after them (`sheets`, FRIEND_ROWS).
ROWS = {"walk": 0, "cast": 4, "pickup": 8, "win": 12, "sleep": 13, "fly": 14}
#: The wizard flying, by gender (D188): four rows, the ways' order, of three frames,
#: level, a little up and a little down.
FLY_BASES = {"boy": "wizard-fly-boy.webp", "girl": "wizard-fly-girl.webp"}
#: How far a flying frame bobs up and down, in pixels.
FLY_BOB = 3
#: The figures made from a drawing of them standing (--drawn): how tall each is in its
#: frame, in pixels, between the children's and the grown-ups', and the way each view
#: of its drawings faces, from left to right. A pupil a year older (D188).
DRAWN = {
    "zarek": (106, ("down", "right", "left", "up")),
    "rinlo": (106, ("down", "right", "left", "up")),
    # The head of the school (D273), a grown-up, who wears no hat (D98).
    "orla": (114, ("down", "right", "left", "up")),
}
FRIEND_ROWS = {"walk": 0, "sleep": 4}
#: How tall the figure is, at most, in each picking-up frame, against its standing
#: height: bending, at the ground, half up again. A frame the edit draws taller
#: is lowered (crouched), so that every way and both wizards go as low.
CROUCH = (0.88, 0.66, 0.9)
#: How much of the figure, from its feet up, is squeezed in a crouch.
CROUCHED = 0.5
#: The friends (D77): their base, and the skin and hair they always have. Their
#: robe, hat and band come in two sets each (D90), read from looks.ts's
#: FRIEND_SETS, a sheet a set, `<friend>-<set>`.
FRIENDS = {
    "teku": ("friend-boy", {"skin": "#a8714a", "hair": "#1f1a17"}),
    "nuri": ("friend-girl", {"skin": "#c98e5f", "hair": "#4a2c1a"}),
}
PARTS = ("skin", "hair", "robe", "hat", "band")
#: How much of a figure, from its feet up, a step frame keeps of its own drawing:
#: the boots and the robe's hem. The rest is the standing frame's.
LEGS = 0.2
#: The figures that float, and how many pixels each step frame's dress grows; and
#: how far the hem of a step frame's dress swings sideways, in pixels, left in the
#: first step frame and right in the second, from nothing at the dress's top
#: (D120: the page sways a floating figure through its frames while it stands).
FLOATING = {"eldra": (4, 8)}
FLOATING_SWAY = 3
#: The figures whose sheet is made from a drawing of them standing still (D147), and
#: the way each view of the drawing faces, from left to right; a view named `-left`
#: faces right in the drawing and is turned over for the row that faces left, where
#: the model drew the same side twice.
STANDING_DRAWN = {
    "dask": ("down", "right", "left", "up"),
    "wenna": ("down", "right", "-left", "up"),
}
#: How much of a floating figure, from the bottom up, is the dress that grows.
DRESS = 0.4


def looks() -> dict[str, dict[str, str]]:
    """Each look's gender and colours, read from looks.ts."""
    text = LOOKS_TS.read_text(encoding="utf-8")
    skins = dict(re.findall(r"(\w+): '(#[0-9a-f]{6})'", text.split("export const LOOKS")[0]))
    found = {}
    for block in re.findall(r"\{\s*id: '(\w+)'(.*?)\}", text.split("export const LOOKS")[1], re.S):
        look_id, body = block
        fields = dict(re.findall(r"(\w+): '([^']+)'", body))
        skin = re.search(r"skin: SKIN\.(\w+)", body)
        if skin:
            fields["skin"] = skins[skin.group(1)]
        found[look_id] = fields
    return found


def friend_sets() -> dict[str, dict[str, dict[str, str]]]:
    """Each friend's sets of colours (D90), read from looks.ts's FRIEND_SETS."""
    text = LOOKS_TS.read_text(encoding="utf-8").split("export const FRIEND_SETS")[1]
    text = text.split("};")[0]
    found: dict[str, dict[str, dict[str, str]]] = {}
    for friend, body in re.findall(r"(\w+): \{\s*(a: \{.*?\},\s*b: \{.*?\}),?\s*\}", text, re.S):
        found[friend] = {
            name: dict(re.findall(r"(\w+): '(#[0-9a-f]{6})'", fields))
            for name, fields in re.findall(r"(\w): \{([^}]*)\}", body)
        }
    return found


def _hsv(rgb: np.ndarray) -> np.ndarray:
    flat = rgb.reshape(-1, 3) / 255.0
    return np.array([colorsys.rgb_to_hsv(*p) for p in flat]).reshape(rgb.shape)


def parts_of(frame: np.ndarray, cloth_hues: tuple[int, int] = (190, 260)) -> dict[str, np.ndarray]:
    """Each part's mask in one frame (height × width × RGBA), its cloth in a hue range."""
    alpha = frame[..., 3] > 0
    hsv = _hsv(frame[..., :3].astype(float))
    hue, sat, val = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    low, high = cloth_hues
    cloth = alpha & (hue >= low) & (hue <= high) & (sat > 0.3) & (val > 0.15)
    gold = alpha & (hue >= 32) & (hue <= 62) & (sat > 0.4) & (val > 0.5)
    warm = alpha & ((hue <= 45) | (hue >= 340)) & (sat > 0.15)
    rows = np.arange(frame.shape[0])[:, None]
    # The hat's band: the lowest of the rows that hold many gold pixels in the
    # frame's top half; the hat is the cloth above it, the robe the cloth below.
    half = frame.shape[0] // 2
    gold_rows = np.where(gold[:half].sum(axis=1) >= 6)[0]
    band_bottom = int(gold_rows.max()) if gold_rows.size else half // 2
    band_top = int(gold_rows.min()) if gold_rows.size else band_bottom
    hat = cloth & (rows <= band_bottom + 2)
    robe = cloth & ~hat
    robe_rows = np.where(robe.sum(axis=1) >= 4)[0]
    robe_top = int(robe_rows.min()) if robe_rows.size else frame.shape[0]
    head = (rows > band_top - 2) & (rows < robe_top + 3)
    skin = warm & head & (val > 0.55) & (sat < 0.7)
    hair = warm & head & (val <= 0.55) & (val > 0.12) & ~skin
    # The hands are skin below the robe's top too.
    skin |= warm & (rows >= robe_top) & (val > 0.6) & (sat < 0.6) & (sat > 0.2)
    band = gold & (rows <= band_bottom + 2)
    stars = gold & ~band
    return {"hat": hat, "robe": robe, "band": band | stars, "skin": skin, "hair": hair}


def _target(colour: str) -> tuple[float, float, float]:
    r, g, b = (int(colour[i : i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hsv(r, g, b)


def recolour(
    frame: np.ndarray, colours: dict[str, str], cloth_hues: tuple[int, int] = (190, 260)
) -> np.ndarray:
    """The frame with each part in its new colour, its shading kept."""
    out = frame.copy()
    hsv = _hsv(frame[..., :3].astype(float))
    for part, mask in parts_of(frame, cloth_hues).items():
        if part not in colours or not mask.any():
            continue
        h, s, v = _target(colours[part])
        middle = float(np.median(hsv[..., 2][mask])) or 1.0
        values = np.clip(hsv[..., 2][mask] / middle * v, 0, 1)
        rgb = np.array([colorsys.hsv_to_rgb(h, s, value) for value in values]) * 255
        out[..., :3][mask] = rgb.round().astype(np.uint8)
    return out


def recolour_sheet(
    sheet: Image.Image,
    frame: tuple[int, int],
    colours: dict[str, str],
    cloth_hues: tuple[int, int] = (190, 260),
) -> Image.Image:
    """Every frame of a sheet recoloured."""
    pixels = np.array(sheet.convert("RGBA"))
    width, height = frame
    for top in range(0, pixels.shape[0], height):
        for left in range(0, pixels.shape[1], width):
            cell = pixels[top : top + height, left : left + width]
            pixels[top : top + height, left : left + width] = recolour(cell, colours, cloth_hues)
    return Image.fromarray(pixels)


#: How tall every figure is drawn, as a part of the height it is cut at (D98), and
#: a grown-up as a part of that: the children then stand at most 1.15 cells and the
#: grown-ups, who wear no hat, at most 1.31, taller than every pupil and no giants,
#: and every figure passes under the doors it walks through with a tenth of a cell
#: over its hat.
SIZE = 0.82
GROWN_UP = 0.9
GROWN_UPS = ("wenna", "ilda", "dask", "baro", "orla")


def sized(
    sheet: Image.Image, frame: tuple[int, int], foot: int, size: float = SIZE
) -> Image.Image:
    """Every frame of the sheet drawn `size` as tall and as wide, its feet on the
    frame's foot line and its middle in the frame's middle, as before."""
    fw, fh = frame
    sheet = sheet.convert("RGBA")
    out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    w, h = round(fw * size), round(fh * size)
    for row in range(sheet.height // fh):
        for column in range(sheet.width // fw):
            cell = sheet.crop((column * fw, row * fh, (column + 1) * fw, (row + 1) * fh))
            x = column * fw + round(fw * (1 - size) / 2)
            y = row * fh + round((fh - foot) * (1 - size))
            out.alpha_composite(cell.resize((w, h), Image.LANCZOS), (x, y))
    return out


def _shifted(cell: np.ndarray, dx: int) -> np.ndarray:
    """A frame moved `dx` pixels to the right (left when negative)."""
    out = np.zeros_like(cell)
    width = cell.shape[1]
    if dx >= 0:
        out[:, dx:] = cell[:, : width - dx]
    else:
        out[:, : width + dx] = cell[:, -dx:]
    return out


def steadied(sheet: Image.Image, frame: tuple[int, int], reach: int = 20) -> Image.Image:
    """Every frame moved sideways so that its body lies over its row's standing
    frame, the second of the row, as far as the two overlap best within `reach`
    pixels; a casting row (the fifth on) follows the walking row of its way."""
    pixels = np.array(sheet.convert("RGBA"))
    fw, fh = frame
    out = pixels.copy()
    for row in range(pixels.shape[0] // fh):
        walking = row % 4
        standing = pixels[walking * fh : (walking + 1) * fh, fw : 2 * fw, 3] > 128
        for column in range(3):
            if row == walking and column == 1:
                continue
            cell = pixels[row * fh : (row + 1) * fh, column * fw : (column + 1) * fw]
            best = max(range(-reach, reach + 1), key=lambda dx: _overlap(cell, standing, dx))
            out[row * fh : (row + 1) * fh, column * fw : (column + 1) * fw] = _shifted(cell, best)
    return Image.fromarray(out, "RGBA")


def _overlap(cell: np.ndarray, standing: np.ndarray, dx: int) -> int:
    """How many pixels of a frame moved `dx` lie over the standing frame's."""
    moved = _shifted(cell[..., 3:] > 128, dx)[..., 0]
    return int((moved & standing).sum())


def walking(
    sheet: Image.Image,
    frame: tuple[int, int],
    floats: tuple[int, int] | None = None,
) -> Image.Image:
    """Each walking row (the first four) made from its standing frame, the second of
    the row, on a sheet already steadied: every other frame keeps its own legs, the
    lowest LEGS of the figure, blended into the standing frame above them over a few
    rows; or, for a figure that floats, the step frames are the standing frame with its
    dress, the lowest DRESS of it, stretched
    down by `floats` pixels (the first step's, the last's) and its hem swung
    FLOATING_SWAY pixels, left in the first and right in the last."""
    pixels = np.array(sheet.convert("RGBA")).astype(np.float32)
    fw, fh = frame
    out = pixels.copy()
    for row in range(min(4, pixels.shape[0] // fh)):
        standing = pixels[row * fh : (row + 1) * fh, fw : 2 * fw]
        opaque = np.where(standing[..., 3] > 128)[0]
        if not opaque.size:
            continue
        top, bottom = int(opaque.min()), int(opaque.max())
        for step, column in enumerate((0, 2)):
            cell = pixels[row * fh : (row + 1) * fh, column * fw : (column + 1) * fw]
            if floats is not None:
                sway = FLOATING_SWAY if step else -FLOATING_SWAY
                made = _dress_grown(standing, top, bottom, floats[step], sway)
            else:
                cut = bottom - int((bottom - top) * LEGS)
                blend = 6
                weight = np.clip((np.arange(fh) - (cut - blend)) / blend, 0, 1)[:, None, None]
                made = standing * (1 - weight) + cell * weight
            out[row * fh : (row + 1) * fh, column * fw : (column + 1) * fw] = made
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def _dress_grown(
    standing: np.ndarray, top: int, bottom: int, grow: int, sway: int = 0
) -> np.ndarray:
    """A floating figure's standing frame with its dress stretched `grow` pixels down
    and sheared sideways, nothing at the dress's top to `sway` pixels at its hem (to
    the right when positive)."""
    start = bottom - int((bottom - top) * DRESS)
    height = bottom + 1 - start
    dress = Image.fromarray(standing[start : bottom + 1].astype(np.uint8), "RGBA")
    longer = np.array(dress.resize((dress.width, height + grow), Image.LANCZOS)).astype(np.float32)
    if sway:
        rows = longer.shape[0]
        # Each row moved by its share of the sway, a fraction of a pixel blended.
        swung = np.zeros_like(longer)
        for row in range(rows):
            by = sway * row / max(1, rows - 1)
            whole = int(np.floor(by))
            part = by - whole
            line = longer[row]
            here = (
                np.roll(line, whole, axis=0) * (1 - part) + np.roll(line, whole + 1, axis=0) * part
            )
            swung[row] = here
        longer = swung
    made = standing.copy()
    end = min(made.shape[0], start + longer.shape[0])
    made[start:end] = longer[: end - start]
    return made


def from_edit(
    edited: Image.Image,
    base: Image.Image,
    frame: tuple[int, int],
    lifted: frozenset[tuple[int, int]] = frozenset(),
) -> Image.Image:
    """A Gemini edit of a base sheet, put back on the base's grid: the edit was asked
    of the base enlarged four times on a magenta canvas of 9:16, centred; it is
    sized back, its magenta made transparent, and each figure moved so that its feet
    stand where the base frame's do (the bottom of the drawing, at its middle). A
    frame in `lifted`, (row, column), off the ground in a jump, is moved as the
    first frame of its row is, so that it keeps its height above the others."""
    scale = 4
    width, height = base.width * scale, base.height * scale
    canvas = round(height * 9 / 16)
    left = (canvas - width) // 2
    big = edited.convert("RGB").resize((canvas, height), Image.LANCZOS)
    rgb = np.array(big.crop((left, 0, left + width, height))).astype(int)
    distance = np.abs(rgb - np.array([255, 0, 255])).sum(axis=2)
    alpha = np.clip((distance - 90) * 3, 0, 255).astype(np.uint8)
    # The magenta's spill on the edges goes: green lifted to the red-blue mean.
    spill = (rgb[..., 0] > rgb[..., 1] + 40) & (rgb[..., 2] > rgb[..., 1] + 40)
    rgb[spill, 1] = ((rgb[spill, 0] + rgb[spill, 2]) // 2 * 0.6).astype(int)
    keyed = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha]), "RGBA")
    small = np.array(keyed.resize(base.size, Image.LANCZOS))
    small[small[..., 3] < 24] = 0
    old = np.array(base.convert("RGBA"))
    out = np.zeros_like(old)
    fw, fh = frame

    def feet(cell: np.ndarray) -> tuple[int, int]:
        ys, xs = np.where(cell[..., 3] > 128)
        return (int(ys.max()), int(round(xs.mean()))) if ys.size else (fh - 1, fw // 2)

    for top in range(0, old.shape[0], fh):
        row_dy = None
        for x0 in range(0, old.shape[1], fw):
            new_cell = small[top : top + fh, x0 : x0 + fw]
            base_cell = old[top : top + fh, x0 : x0 + fw]
            (by, bx), (ny, nx) = feet(base_cell), feet(new_cell)
            dy, dx = by - ny, bx - nx
            if row_dy is None:
                row_dy = dy
            if (top // fh, x0 // fw) in lifted:
                dy = row_dy
            moved = np.zeros_like(new_cell)
            src = new_cell[max(0, -dy) : fh - max(0, dy), max(0, -dx) : fw - max(0, dx)]
            moved[
                max(0, dy) : max(0, dy) + src.shape[0], max(0, dx) : max(0, dx) + src.shape[1]
            ] = src
            out[top : top + fh, x0 : x0 + fw] = moved
    return Image.fromarray(out, "RGBA")


def whiten_light(sheet: Image.Image) -> Image.Image:
    """The wand's light white again where the magenta it was drawn on tinted it pink:
    a light pixel whose green falls short of its red and blue."""
    pixels = np.array(sheet.convert("RGBA")).astype(int)
    r, g, b = pixels[..., 0], pixels[..., 1], pixels[..., 2]
    pink = (r > 170) & (b > 170) & (g < np.minimum(r, b) - 25)
    pixels[..., 1] = np.where(pink, np.minimum(r, b), g)
    return Image.fromarray(pixels.astype(np.uint8), "RGBA")


def make_cast_base(gender: str, edit: Path) -> Path:
    """The casting base of a gender, from Gemini's edit of its walking base."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    base = Image.open(BASE_DIR / BASES[gender][0])
    cast = whiten_light(from_edit(Image.open(edit), base, tuple(about["frame"])))
    target = BASE_DIR / CAST_BASES[gender]
    cast.save(target, quality=90, method=6)
    return target


def drawn_height(frame: np.ndarray) -> int:
    """How tall the figure in a frame is, in pixels, from its top to its feet."""
    ys = np.nonzero(frame[..., 3].max(axis=1) > 128)[0]
    return int(ys[-1] - ys[0] + 1) if len(ys) else 0


def crouched(standing: np.ndarray, tall: int) -> np.ndarray:
    """A frame lowered into a crouch, `tall` pixels high at most: its lower part,
    CROUCHED of the figure from its feet up, squeezed towards the feet, and what is
    above it moved down with it. A frame already that low is kept."""
    alpha = standing[..., 3]
    ys = np.nonzero(alpha.max(axis=1) > 128)[0]
    if not len(ys) or ys[-1] - ys[0] + 1 <= tall:
        return standing
    top, bottom = int(ys[0]), int(ys[-1])
    start = bottom - int((bottom - top) * CROUCHED)
    lower = Image.fromarray(standing[start : bottom + 1].astype(np.uint8), "RGBA")
    height = max(1, lower.height - (bottom - top + 1 - tall))
    short = np.array(lower.resize((lower.width, height), Image.LANCZOS))
    made = np.zeros_like(standing)
    made[bottom + 1 - height : bottom + 1] = short
    drop = lower.height - height
    made[top + drop : start + drop] = standing[top:start]
    return made


def make_pickup_base(gender: str, edit: Path) -> Path:
    """The picking-up base of a gender, from Gemini's edit of its walking base: the
    rows facing down, left and right as the edit draws them, each frame lowered to
    CROUCH of its row's standing height where the edit drew it taller; the row
    seen from behind, which the edit leaves standing, made by lowering the walking
    base's standing frame from behind the same way."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    walk = Image.open(BASE_DIR / BASES[gender][0]).convert("RGBA")
    pixels = np.array(from_edit(Image.open(edit), walk, (fw, fh)))
    base = np.array(walk)
    middle = about["standing"]
    for row in range(4):
        cells = slice(row * fh, (row + 1) * fh)
        standing = base[cells, middle * fw : (middle + 1) * fw]
        full = drawn_height(standing)
        for step, share in enumerate(CROUCH):
            columns = slice(step * fw, (step + 1) * fw)
            # Seen from behind, the edit's frame is the standing one: start from it.
            drawn = standing if row == 3 else pixels[cells, columns]
            pixels[cells, columns] = crouched(drawn, round(full * share))
    target = BASE_DIR / PICKUP_BASES[gender]
    Image.fromarray(pixels, "RGBA").save(target, quality=90, method=6)
    return target


def make_win_base(gender: str, edit: Path) -> Path:
    """The celebrating base of a gender, from Gemini's edit of a sheet of its
    standing frame, four rows of three facing down
    (art/raw/figures/act-<gender>-base.png), whose second row celebrates (the first
    and the third pick up, and the fourth is a spare); the jump keeps its height."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    base = Image.open(RAW / "figures" / f"act-{gender}-base.png")
    acts = from_edit(Image.open(edit), base, (fw, fh), lifted=frozenset({(1, 1), (3, 1)}))
    target = BASE_DIR / WIN_BASES[gender]
    acts.crop((0, fh, 3 * fw, 2 * fh)).save(target, quality=90, method=6)
    return target


def standing_sheet(base: Image.Image, frame: tuple[int, int]) -> tuple[Image.Image, Image.Image]:
    """A figure's standing frame facing down, four rows of three, and the same
    enlarged four times and centred on a magenta canvas of 9:16: what Gemini is
    asked to edit when a sheet of one pose is wanted (the celebrating and the
    sleeping rows), and the base its edit is put back on."""
    fw, fh = frame
    standing = base.convert("RGBA").crop((fw, 0, 2 * fw, fh))
    sheet = Image.new("RGBA", (3 * fw, 4 * fh), (0, 0, 0, 0))
    for row in range(4):
        for column in range(3):
            sheet.alpha_composite(standing, (column * fw, row * fh))
    scale = 4
    height = sheet.height * scale
    canvas = Image.new("RGB", (round(height * 9 / 16), height), (255, 0, 255))
    big = sheet.resize((sheet.width * scale, height), Image.LANCZOS)
    canvas.paste(big, ((canvas.width - big.width) // 2, 0), big)
    return sheet, canvas


def make_sleep_input(kind: str) -> Path:
    """The picture Gemini edits into a sheet asleep, for a kind of SLEEP_BASES, from
    its walking base's standing frame."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    sheet, canvas = standing_sheet(Image.open(BASE_DIR / BASES[kind][0]), frame)
    sheet.save(RAW / "figures" / f"sleep-{kind}-base.png")
    target = RAW / "figures" / f"sleep-{kind}-input.png"
    canvas.save(target)
    return target


def one_figure(edited: Image.Image, height: int, frame: tuple[int, int], foot: int) -> Image.Image:
    """The first figure of an edit Gemini drew in more figures than asked, or larger:
    the piece of its top-left quarter keyed off its magenta, sized to `height` and
    set in a frame with its feet on the frame's foot line, in the middle."""
    rgb = np.array(edited.convert("RGB")).astype(int)
    quarter = rgb[: rgb.shape[0] // 4, : rgb.shape[1] // 4]
    distance = np.abs(quarter - np.array([255, 0, 255])).sum(axis=2)
    solid = distance > 150
    ys, xs = np.nonzero(solid)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    alpha = np.clip((distance - 90) * 3, 0, 255).astype(np.uint8)
    piece = Image.fromarray(np.dstack([quarter.astype(np.uint8), alpha]), "RGBA").crop(box)
    width = round(piece.width * height / piece.height)
    piece = piece.resize((width, height), Image.LANCZOS)
    fw, fh = frame
    out = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    out.alpha_composite(piece, ((fw - width) // 2, fh - foot - height))
    return out


def make_sleep_base(kind: str, edit: Path, like: str | None = None) -> Path:
    """The sleeping base of a kind, from Gemini's edit of its standing sheet
    (make_sleep_input): the first figure of the edit, three times in a row; with
    `like`, an edit that drew its figures otherwise, its first figure made as
    tall as that kind's (one_figure)."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    if like is None:
        base = Image.open(RAW / "figures" / f"sleep-{kind}-base.png")
        asleep = from_edit(Image.open(edit), base, (fw, fh))
        one = asleep.crop((fw, 0, 2 * fw, fh))
    else:
        # The edit drew its figures otherwise: the first one, as tall as `like`'s.
        other = np.array(Image.open(BASE_DIR / SLEEP_BASES[like]).convert("RGBA"))[..., 3] > 128
        rows = np.nonzero(other[:, fw : 2 * fw].any(axis=1))[0]
        one = one_figure(
            Image.open(edit), int(rows[-1] - rows[0] + 1), (fw, fh), fh - 1 - int(rows[-1])
        )
    row = Image.new("RGBA", (3 * fw, fh), (0, 0, 0, 0))
    for column in range(3):
        row.alpha_composite(one, (column * fw, 0))
    target = BASE_DIR / SLEEP_BASES[kind]
    row.save(target, quality=90, method=6)
    return target


def alone(cell: Image.Image) -> Image.Image:
    """A frame with only its figure: the largest group of its drawn pixels, touching
    side by side or corner to corner, without the bits of a neighbouring figure an edit
    or a drawing left at its edge."""
    pixels = np.array(cell.convert("RGBA"))
    drawn = pixels[..., 3] > 24
    seen = np.zeros(drawn.shape, dtype=np.int32)
    groups = []
    for y, x in zip(*np.nonzero(drawn), strict=True):
        if seen[y, x]:
            continue
        number = len(groups) + 1
        seen[y, x] = number
        stack, size = [(y, x)], 0
        while stack:
            cy, cx = stack.pop()
            size += 1
            for ny in (cy - 1, cy, cy + 1):
                for nx in (cx - 1, cx, cx + 1):
                    inside = 0 <= ny < drawn.shape[0] and 0 <= nx < drawn.shape[1]
                    if inside and drawn[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = number
                        stack.append((ny, nx))
        groups.append(size)
    if not groups:
        return cell
    keep = seen == int(np.argmax(groups)) + 1
    pixels[~keep] = 0
    return Image.fromarray(pixels, "RGBA")


def bobbing(level: Image.Image, frame: tuple[int, int]) -> Image.Image:
    """A row of three flying frames from its level one (D188): level, FLY_BOB pixels up
    and FLY_BOB pixels down."""
    fw, fh = frame
    level = alone(level)
    row = Image.new("RGBA", (fw * 3, fh), (0, 0, 0, 0))
    for index, dy in enumerate((0, -FLY_BOB, FLY_BOB)):
        moved = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        moved.alpha_composite(level, (0, dy) if dy >= 0 else (0, 0), (0, max(0, -dy), fw, fh))
        row.alpha_composite(moved, (index * fw, 0))
    return row


#: How far in a flying base's magenta rim is cleared, in pixels, and what counts as the
#: magenta's shade: green short of red and blue by FLY_MARGIN, red or blue at least
#: FLY_BRIGHT, so that the figure's dark outline stays (sprites.off_magenta_rim).
FLY_RIM = 2
FLY_MARGIN = 40
FLY_BRIGHT = 110


def make_fly_base(gender: str, edit: Path) -> Path:
    """The flying base of a gender, from Gemini's edit of its walking base (D188): each
    row's middle figure put back on the base's grid, then bobbing; the shades of the
    magenta it was painted on that stay round it cleared FLY_RIM pixels in."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    fw, fh = frame
    base = Image.open(BASE_DIR / BASES[gender][0])
    edited = from_edit(Image.open(edit), base, frame)
    rows = [
        bobbing(edited.crop((fw, row * fh, 2 * fw, (row + 1) * fh)), frame) for row in range(4)
    ]
    target = BASE_DIR / FLY_BASES[gender]
    stacked(*rows).save(target, quality=90, method=6)
    return clean_fly_base(gender)


def clean_fly_base(gender: str) -> Path:
    """A flying base with the shades of the magenta it was painted on that stay round
    it cleared FLY_RIM pixels in (sprites.off_magenta_rim), in place (--clean-fly)."""
    import sprites  # noqa: PLC0415 - the cut's tools, only for the bases

    target = BASE_DIR / FLY_BASES[gender]
    base = np.array(Image.open(target).convert("RGBA"))
    cleaned = sprites.off_magenta_rim(base, margin=FLY_MARGIN, depth=FLY_RIM, bright=FLY_BRIGHT)
    Image.fromarray(cleaned).save(target, quality=90, method=6)
    return target


def framed(view: Image.Image, scale: float, about: dict) -> Image.Image:
    """A drawn view in its frame, `scale` times its size, its feet on the frame's foot
    line and its middle in the frame's middle; what is wider than the frame cut at its
    sides."""
    fw, fh = tuple(about["frame"])
    small = view.resize((round(view.width * scale), round(view.height * scale)), Image.LANCZOS)
    if small.width > fw:
        side = (small.width - fw) // 2
        small = small.crop((side, 0, side + fw, small.height))
    cell = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    cell.alpha_composite(small, ((fw - small.width) // 2, fh - about["foot"] - small.height))
    return cell


def drawn_rows(
    name: str, drawing: Path, scale: float | None = None
) -> tuple[list[Image.Image], float]:
    """A drawing's four views in their frames, in the ways' order, the first as tall as
    DRAWN says unless a scale is given; and the scale."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    tall, order = DRAWN[name]
    views = drawn_views(Image.open(drawing))
    if len(views) != len(order):
        # Views drawn so close that a broom touches the next: the drawing in as many
        # equal parts as it has views, each its figure's.
        views = drawn_views(Image.open(drawing), len(order))
    if len(views) != len(order):
        raise SystemExit(f"{drawing}: {len(views)} figures drawn, {len(order)} wanted")
    scale = scale or tall / views[0].height
    by_way = {
        named.lstrip("-"): alone(framed(view, scale, about))
        for view, named in zip(views, order, strict=True)
    }
    return [by_way[way] for way in about["ways"]], scale


#: A drawn figure's rows after its walking ones, in this order where it has them: flying
#: (D188), and sitting on the floor (D273), four each, in the ways' order.
DRAWN_PARTS = ("fly", "sit")


def drawn_rows_of(name: str) -> dict[str, int]:
    """A drawn figure's rows (figures.json's `sheets`): walking, then each part of
    DRAWN_PARTS it has, four rows each."""
    rows, next_row = {"walk": 0}, 4
    for part in DRAWN_PARTS:
        if (BASE_DIR / f"{name}-{part}.webp").is_file():
            rows[part] = next_row
            next_row += 4
    return rows


def drawn_sheet(name: str) -> Path:
    """A drawn figure's sheet: its walking rows, then its flying rows and its sitting
    rows when it has them."""
    parts = [Image.open(BASE_DIR / f"{name}-standing.webp").convert("RGBA")]
    for part in DRAWN_PARTS:
        if (BASE_DIR / f"{name}-{part}.webp").is_file():
            parts.append(Image.open(BASE_DIR / f"{name}-{part}.webp").convert("RGBA"))
    target = FIGURES / f"{name}.webp"
    stacked(*parts).save(target, quality=90, method=6)
    return target


#: How tall a drawn figure sitting on the floor is in its frame, facing down, in pixels:
#: its head as big as standing, its body folded (D273).
DRAWN_SIT = {"rinlo": 76}


def make_drawn_sit(name: str, drawing: Path) -> Path:
    """A drawn figure's sitting rows (D273), from a drawing of it sitting on the floor in
    the four views, its view facing down as tall as DRAWN_SIT says and the others at the
    same scale, each view its row's three frames, its bottom on the frame's foot line;
    its sheet made."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    views = drawn_views(Image.open(drawing))
    scale = DRAWN_SIT[name] / views[0].height
    cells, _ = drawn_rows(name, drawing, scale)
    rows = []
    for cell in cells:
        row = Image.new("RGBA", (fw * 3, fh), (0, 0, 0, 0))
        for index in range(3):
            row.alpha_composite(cell, (index * fw, 0))
        rows.append(row)
    stacked(*rows).save(BASE_DIR / f"{name}-sit.webp", quality=90, method=6)
    return drawn_sheet(name)


def make_drawn(name: str, drawing: Path) -> Path:
    """A figure's walking rows from a drawing of it standing still in the four views
    (DRAWN), its standing frame three times a row, kept with the scale they were drawn
    at; its sheet made."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    cells, scale = drawn_rows(name, drawing)
    rows = []
    for cell in cells:
        row = Image.new("RGBA", (fw * 3, fh), (0, 0, 0, 0))
        for index in range(3):
            row.alpha_composite(cell, (index * fw, 0))
        rows.append(row)
    stacked(*rows).save(BASE_DIR / f"{name}-standing.webp", quality=90, method=6)
    (RAW / "figures" / f"{name}-scale.txt").write_text(f"{scale}\n", encoding="utf-8")
    return drawn_sheet(name)


def make_drawn_fly(name: str, drawing: Path) -> Path:
    """A drawn figure's flying rows (D188), from a drawing of it riding the broom in the
    four views, at the scale of its standing drawing, each bobbing; its sheet made."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    scale = float((RAW / "figures" / f"{name}-scale.txt").read_text(encoding="utf-8"))
    cells, _ = drawn_rows(name, drawing, scale)
    stacked(*(bobbing(cell, frame) for cell in cells)).save(
        BASE_DIR / f"{name}-fly.webp", quality=90, method=6
    )
    return drawn_sheet(name)


def make_drawn_fly_view(name: str, ways: str, drawing: Path) -> Path:
    """Views of a drawn figure's flying rows drawn again (--drawn-fly-view): `ways`, one
    way or several joined by commas, the drawing's figures from left to right; each as
    tall in its frame as the view it replaces, the magenta round it cleared as the
    wizard's flying rows' are, bobbing, in its row of the flying base; its sheet made."""
    import sprites  # noqa: PLC0415 - the cut's tools, only for the bases

    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    fw, fh = frame
    wanted = ways.split(",")
    views = drawn_views(Image.open(drawing))
    if len(views) != len(wanted):
        raise SystemExit(f"{drawing} has {len(views)} figures, and {len(wanted)} ways are named")
    base = Image.open(BASE_DIR / f"{name}-fly.webp").convert("RGBA")
    for way, view in zip(wanted, views, strict=True):
        row = about["ways"].index(way)
        level = np.array(base.crop((0, row * fh, fw, (row + 1) * fh)))[..., 3] > 0
        filled = np.flatnonzero(level.any(axis=1))
        tall = int(filled.max() - filled.min()) + 1
        cell = alone(framed(view, tall / view.height, about))
        cell = Image.fromarray(
            sprites.off_magenta_rim(
                np.array(cell), margin=FLY_MARGIN, depth=FLY_RIM, bright=FLY_BRIGHT
            )
        )
        base.paste(bobbing(cell, frame), (0, row * fh))
    base.save(BASE_DIR / f"{name}-fly.webp", quality=90, method=6)
    return drawn_sheet(name)


def drawn_views(drawing: Image.Image, parts: int = 0) -> list[Image.Image]:
    """A drawing's figures on flat magenta, from left to right, each cut to its own
    box with the magenta made transparent: what the columns with nothing drawn part,
    or, given `parts`, the drawing's equal parts across."""
    rgb = np.array(drawing.convert("RGB")).astype(int)
    distance = np.abs(rgb - np.array([255, 0, 255])).sum(axis=2)
    alpha = np.clip((distance - 90) * 3, 0, 255).astype(np.uint8)
    spill = (rgb[..., 0] > rgb[..., 1] + 40) & (rgb[..., 2] > rgb[..., 1] + 40)
    rgb[spill, 1] = ((rgb[spill, 0] + rgb[spill, 2]) // 2 * 0.6).astype(int)
    keyed = Image.fromarray(np.dstack([rgb.astype(np.uint8), alpha]), "RGBA")
    solid = distance > 150
    columns = solid.any(axis=0)
    edges = np.flatnonzero(np.diff(np.concatenate(([0], columns.astype(int), [0]))))
    if parts:
        width = drawing.width / parts
        edges = []
        for index in range(parts):
            inside = np.flatnonzero(columns[round(index * width) : round((index + 1) * width)])
            edges += [
                round(index * width) + int(inside[0]),
                round(index * width) + int(inside[-1]) + 1,
            ]
        edges = np.array(edges)
    views = []
    for start, end in zip(edges[::2], edges[1::2], strict=True):
        if end - start < drawing.width // 40:
            continue
        rows = np.nonzero(solid[:, start:end].any(axis=1))[0]
        views.append(keyed.crop((int(start), int(rows[0]), int(end), int(rows[-1]) + 1)))
    return views


def make_standing(name: str, drawing: Path) -> Path:
    """A figure's sheet made again from a drawing of it standing still (D147): each view
    is its row's standing frame, as tall as the figure was, its feet on the same line and
    its middle in the frame's; the sheet's step frames keep their legs (`walking`)."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    target = FIGURES / f"{name}.webp"
    sheet = Image.open(target).convert("RGBA")
    views = drawn_views(Image.open(drawing))
    order = STANDING_DRAWN[name]
    if len(views) != len(order):
        raise SystemExit(f"{drawing}: {len(views)} figures drawn, {len(order)} wanted")
    ways = about["ways"]
    old = np.array(sheet)
    rows = np.nonzero((old[:fh, fw : 2 * fw, 3] > 128).any(axis=1))[0]
    top, bottom = int(rows[0]), int(rows[-1])
    scale = (bottom - top + 1) / views[0].height
    out = sheet.copy()
    for view, named in zip(views, order, strict=True):
        way = named.lstrip("-")
        small = view.resize((round(view.width * scale), round(view.height * scale)), Image.LANCZOS)
        if named.startswith("-"):
            small = small.transpose(Image.FLIP_LEFT_RIGHT)
        y = ways.index(way) * fh + bottom + 1 - small.height
        x = fw + (fw - small.width) // 2
        out.paste((0, 0, 0, 0), (fw, ways.index(way) * fh, 2 * fw, (ways.index(way) + 1) * fh))
        out.alpha_composite(small, (x, y))
    made = walking(steadied(out, (fw, fh)), (fw, fh))
    made.save(target, quality=90, method=6)
    return target


def stacked(*sheets: Image.Image) -> Image.Image:
    """The sheets one under the other."""
    sheet = Image.new("RGBA", (sheets[0].width, sum(s.height for s in sheets)), (0, 0, 0, 0))
    top = 0
    for part in sheets:
        sheet.paste(part, (0, top))
        top += part.height
    return sheet


#: The wizard's base busts (D194), one a gender, cut from Gemini's portrait of the base
#: sheet's figure, in the base sheet's colours; and where the looks' portraits go.
PORTRAIT_BASES = {"boy": "portrait-wizard-boy.webp", "girl": "portrait-wizard-girl.webp"}
PORTRAITS = REPO / "content" / "art" / "portraits"


def _grown(mask: np.ndarray, radius: int) -> np.ndarray:
    """The mask grown by `radius` pixels, round."""
    out = mask.copy()
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dy * dy + dx * dx <= radius * radius:
                out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


def _shrunk(mask: np.ndarray, radius: int) -> np.ndarray:
    """The mask shrunk by `radius` pixels, round: what is thinner goes."""
    return ~_grown(~mask, radius)


def _pieces(mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The mask's pieces numbered from 1, and each piece's size."""
    import sprites  # noqa: PLC0415 - the cut's tools, only for the portraits

    labelled = sprites._groups(mask)
    sizes = np.bincount(labelled.ravel())
    sizes[0] = 0
    return labelled, sizes


def portrait_parts(
    bust: np.ndarray, cloth_hues: tuple[int, int] = (190, 260)
) -> dict[str, np.ndarray]:
    """Each part's mask in a bust (D194), which parts_of cannot read since a bust's hat
    brim lies below its band: the cloth's large pieces are the robe where they reach the
    bust's foot and the hat elsewhere; the band is the gold beside the hat and the darker
    gold joined to its densest rows, its curve and its shading with it; the stars the
    gold on the robe; the skin is light and warm; the hair the large warm dark pieces, its
    thin lines, the face's outline, left out."""
    alpha = bust[..., 3] > 0
    hsv = _hsv(bust[..., :3].astype(float))
    hue, sat, val = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    low, high = cloth_hues
    cloth = alpha & (hue >= low) & (hue <= high) & (sat > 0.25) & (val > 0.1)
    pieces, sizes = _pieces(cloth)
    large = np.nonzero(sizes > sizes.max() * 0.08)[0]
    foot = bust.shape[0] - 6
    robe_pieces = [n for n in large if np.nonzero(pieces == n)[0].max() >= foot]
    robe = np.isin(pieces, robe_pieces)
    hat = np.isin(pieces, [n for n in large if n not in robe_pieces])
    gold = alpha & (hue >= 30) & (hue <= 65) & (sat >= 0.4) & (val >= 0.45)
    near_robe = _grown(robe, 4)
    # The band: the gold beside the hat, and the darker, greyer gold joined to its densest
    # rows, its shaded edges and its curve down at the sides with it.
    near_hat = gold & _grown(hat, 24) & ~near_robe
    counts = near_hat.sum(axis=1)
    band = np.zeros_like(gold)
    if counts.max() > 0:
        top = bottom = int(counts.argmax())
        while top > 0 and counts[top - 1] >= counts.max() / 2:
            top -= 1
        while bottom < len(counts) - 1 and counts[bottom + 1] >= counts.max() / 2:
            bottom += 1
        seeds = np.zeros_like(gold)
        seeds[top : bottom + 1] = near_hat[top : bottom + 1]
        loose = alpha & (hue >= 20) & (hue <= 70) & (sat > 0.25) & (val > 0.2)
        loose &= _grown(hat, 30) & ~hat & ~near_robe
        pieces, _ = _pieces(loose)
        band = np.isin(pieces, np.unique(pieces[seeds & loose])) & (pieces > 0)
    stars = gold & near_robe & ~band
    skin = alpha & ((hue <= 30) | (hue >= 330)) & (sat > 0.1) & (sat < 0.75) & (val > 0.55)
    skin &= ~band & ~stars
    dark = alpha & ((hue <= 50) | (hue >= 330)) & (sat > 0.2) & (val > 0.1) & (val <= 0.6)
    dark &= ~skin & ~band
    cores, core_sizes = _pieces(_shrunk(dark, 3))
    core = np.isin(cores, np.nonzero(core_sizes >= dark.size * 0.003)[0])
    hair = _grown(core, 3) & dark
    return {"hat": hat, "robe": robe, "band": band | stars, "skin": skin, "hair": hair}


def make_portraits() -> list[Path]:
    """Each look's portrait (D194), content/art/portraits/wizard-<look>.webp: its
    gender's base bust with each part in the look's colour, its shading kept."""
    written = []
    busts = {
        gender: np.array(Image.open(BASE_DIR / name).convert("RGBA"))
        for gender, name in PORTRAIT_BASES.items()
    }
    parts = {gender: portrait_parts(bust) for gender, bust in busts.items()}
    PORTRAITS.mkdir(parents=True, exist_ok=True)
    for look_id, look in looks().items():
        bust = busts[look["gender"]]
        hsv = _hsv(bust[..., :3].astype(float))
        out = bust.copy()
        for part, mask in parts[look["gender"]].items():
            if not mask.any():
                continue
            h, s, v = _target(look[part])
            middle = float(np.median(hsv[..., 2][mask])) or 1.0
            values = np.clip(hsv[..., 2][mask] / middle * v, 0, 1)
            rgb = np.array([colorsys.hsv_to_rgb(h, s, value) for value in values]) * 255
            out[..., :3][mask] = rgb.round().astype(np.uint8)
        target = PORTRAITS / f"wizard-{look_id}.webp"
        Image.fromarray(out).save(target, quality=90, method=6)
        written.append(target)
    return written


#: The familiars (D273): six kinds, each in its colours, the kind's first colour drawn by
#: Gemini as a walking sheet, four rows of three on flat magenta, and its other colours
#: Gemini's edits of that drawing. Each kind: how tall its standing figure facing down is
#: in its frame, in pixels, about half a child's height (0.57 of a cell); and, for each way
#: but the right, the three frames of its row (a step, standing, the other step), each
#: the drawing's (row, column), and "turned" for a figure drawn facing the other way,
#: turned over. The row to the right is the row to the left mirrored, so
#: that every figure of it faces right and steps as the left one does.
FAMILIARS = {
    "fox": {
        "colours": ("red", "white", "black"),
        "height": 55,
        "frames": {
            "down": ((0, 0), (0, 1), (0, 2)),
            "left": ((1, 0), (1, 1), (1, 2)),
            "up": ((3, 0), (3, 1), (3, 2)),
        },
    },
    "crow": {
        "colours": ("black", "white"),
        "height": 52,
        "frames": {
            "down": ((0, 0), (0, 1), (0, 2)),
            # The drawing's third figure of that row faces right: the last of the row
            # before it, which faces right, turned over.
            "left": ((2, 0), (2, 1), (1, 2, "turned")),
            "up": ((3, 0), (3, 1), (3, 2)),
        },
    },
    "bat": {
        "colours": ("black", "white"),
        "height": 40,
        # A bat flies low, a little above the floor, in pixels.
        "lift": 8,
        "frames": {
            "down": ((0, 0), (0, 1), (0, 2)),
            "left": ((1, 0), (1, 1), (1, 2)),
            "up": ((3, 0), (3, 1), (3, 2)),
        },
    },
    "hare": {
        "colours": ("brown", "white", "grey"),
        "height": 57,
        "frames": {
            "down": ((0, 2), (0, 0), (0, 2)),
            "left": ((1, 1), (1, 0), (1, 2)),
            "up": ((3, 0), (3, 1), (3, 2)),
        },
    },
    "mouse": {
        "colours": ("brown", "white"),
        "height": 46,
        "frames": {
            "down": ((0, 0), (0, 1), (0, 2)),
            "left": ((1, 0), (1, 1), (2, 0)),
            "up": ((3, 0), (3, 1), (3, 2)),
        },
    },
    "frog": {
        "colours": ("green", "red"),
        "height": 40,
        "frames": {
            "down": ((0, 1), (0, 0), (0, 2)),
            "left": ((1, 1), (1, 0), (1, 2)),
            "up": ((3, 0), (3, 2), (3, 0)),
        },
    },
}
#: How tall a familiar is, as a part of a cell, for whoever needs its size (figures.json).
FAMILIAR_HEIGHT_CELLS = 0.57


def familiar_id(kind: str, colour: str) -> str:
    return f"familiar-{kind}-{colour}"


def drawing_cells(
    drawing: Image.Image, rows: int = 4, columns: int = 3
) -> list[list[Image.Image]]:
    """A drawing of figures on flat magenta in rows and columns, each figure keyed off
    the magenta and cut to its own box, the magenta's spill on its edge greyed as a
    drawn figure's is (drawn_views)."""
    rgb = np.array(drawing.convert("RGB")).astype(int)
    distance = np.abs(rgb - np.array([255, 0, 255])).sum(axis=2)
    alpha = np.clip((distance - 90) * 3, 0, 255).astype(np.uint8)
    spill = (rgb[..., 0] > rgb[..., 1] + 40) & (rgb[..., 2] > rgb[..., 1] + 40)
    rgb[spill, 1] = ((rgb[spill, 0] + rgb[spill, 2]) // 2 * 0.6).astype(int)
    keyed = np.dstack([rgb.astype(np.uint8), alpha])
    height, width = alpha.shape
    found = []
    for row in range(rows):
        line = []
        for column in range(columns):
            y0, y1 = row * height // rows, (row + 1) * height // rows
            x0, x1 = column * width // columns, (column + 1) * width // columns
            part = keyed[y0:y1, x0:x1]
            solid = part[..., 3] > 150
            ys, xs = np.nonzero(solid)
            if not ys.size:
                raise SystemExit(f"nothing drawn in row {row + 1}, column {column + 1}")
            box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
            # Its largest piece alone: a shadow drawn under a flying bat goes.
            piece = np.array(alone(Image.fromarray(part, "RGBA").crop(box)))
            ys, xs = np.nonzero(piece[..., 3] > 150)
            box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
            line.append(Image.fromarray(piece, "RGBA").crop(box))
        found.append(line)
    return found


def familiar_sheet(kind: str, drawing: Image.Image) -> Image.Image:
    """A familiar's walking sheet from Gemini's drawing of it (FAMILIARS): four rows of
    three frames in the figures' frame, every figure scaled as its kind's standing figure
    facing down is FAMILIARS' height, its bottom on the frame's foot line and its middle on
    the frame's, the largest piece of it kept (a shadow drawn under it goes); the row to
    the right the row to the left mirrored; steadied, as every sheet."""
    import sprites  # noqa: PLC0415 - the cut's tools, only for the bases

    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    foot = about["foot"]
    own = FAMILIARS[kind]
    cells = drawing_cells(drawing)
    pieces = {
        way: [
            cells[pick[0]][pick[1]].transpose(Image.FLIP_LEFT_RIGHT)
            if pick[2:] == ("turned",)
            else cells[pick[0]][pick[1]]
            for pick in own["frames"][way]
        ]
        for way in ("down", "left", "up")
    }
    standing = pieces["down"][1]
    scale = own["height"] / standing.height
    rows = {}
    for way, views in pieces.items():
        row = Image.new("RGBA", (fw * 3, fh), (0, 0, 0, 0))
        for index, view in enumerate(views):
            small = view.resize(
                (max(1, round(view.width * scale)), max(1, round(view.height * scale))),
                Image.LANCZOS,
            )
            if small.width > fw:
                side = (small.width - fw) // 2
                small = small.crop((side, 0, side + fw, small.height))
            cell = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
            lift = own.get("lift", 0)
            cell.alpha_composite(small, ((fw - small.width) // 2, fh - foot - lift - small.height))
            # The magenta's shades round it cleared as far as they reach, a shadow painted
            # under a bat too, then its largest piece alone.
            cleaned = sprites.off_magenta_rim(np.array(cell), margin=FLY_MARGIN, bright=FLY_BRIGHT)
            cell = alone(Image.fromarray(cleaned, "RGBA"))
            row.alpha_composite(cell, (index * fw, 0))
        rows[way] = row
    rows["right"] = Image.new("RGBA", (fw * 3, fh), (0, 0, 0, 0))
    sheet = steadied(stacked(*(rows[way] for way in about["ways"])), (fw, fh), reach=10)
    # The row to the right, the steadied row to the left turned over, frame by frame.
    left, right = about["ways"].index("left"), about["ways"].index("right")
    for index in range(3):
        cell = sheet.crop((index * fw, left * fh, (index + 1) * fw, (left + 1) * fh))
        sheet.paste(cell.transpose(Image.FLIP_LEFT_RIGHT), (index * fw, right * fh))
    return sheet


def outline_match(sheet: Image.Image, first: Image.Image) -> list[float]:
    """How alike two sheets' figures are, frame by frame: the share of their drawn
    pixels they have in common (intersection over union), a colour edit checked against
    its kind's first sheet."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    ours = np.array(sheet.convert("RGBA"))[..., 3] > 128
    theirs = np.array(first.convert("RGBA"))[..., 3] > 128
    shares = []
    for top in range(0, ours.shape[0], fh):
        for left in range(0, ours.shape[1], fw):
            a = ours[top : top + fh, left : left + fw]
            b = theirs[top : top + fh, left : left + fw]
            union = int((a | b).sum())
            shares.append(round(int((a & b).sum()) / union, 3) if union else 1.0)
    return shares


def make_familiar(kind: str, colour: str, drawing: Path) -> Path:
    """A familiar's sheet, content/art/figures/familiar-<kind>-<colour>.webp, from Gemini's
    drawing of it (--familiar); a colour that is not its kind's first is checked against
    the first's sheet, frame by frame, and the shares printed."""
    if colour not in FAMILIARS[kind]["colours"]:
        raise SystemExit(f"a {kind} is one of {', '.join(FAMILIARS[kind]['colours'])}")
    sheet = familiar_sheet(kind, Image.open(drawing))
    target = FIGURES / f"{familiar_id(kind, colour)}.webp"
    sheet.save(target, quality=90, method=6)
    first = FIGURES / f"{familiar_id(kind, FAMILIARS[kind]['colours'][0])}.webp"
    if colour != FAMILIARS[kind]["colours"][0] and first.is_file():
        print("outlines alike, frame by frame:", outline_match(sheet, Image.open(first)))
    return target


def familiars_check() -> Path:
    """The chapter 5's figures to look at (D273), art/raw/game-check/figures-check-5.png:
    the fourteen familiars' sheets, each frame's lower half twice its size with the foot
    line drawn, so that a stray pixel or a figure facing the wrong way shows; Orla's sheet
    and Rinlo's with its sitting rows, whole; and the thread's and the trail's sprites."""
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    fw, fh = tuple(about["frame"])
    foot, keep, scale = about["foot"], fh // 2, 2
    names = [
        familiar_id(kind, colour) for kind, own in FAMILIARS.items() for colour in own["colours"]
    ]
    block = (fw * 3 * scale + 16, keep * 4 * scale + 8)
    columns = 7
    rows = (len(names) + columns - 1) // columns
    people = [Image.open(FIGURES / f"{name}.webp").convert("RGBA") for name in ("orla", "rinlo")]
    things = REPO / "content" / "art" / "things"
    sprites = [Image.open(things / f"{name}.webp").convert("RGBA") for name in ("thread", "trail")]
    width = max(block[0] * columns, sum(s.width + 16 for s in people + sprites))
    height = block[1] * rows + max(s.height for s in people)
    sheet = Image.new("RGBA", (width, height), (225, 215, 195, 255))
    for index, name in enumerate(names):
        drawn = Image.open(FIGURES / f"{name}.webp").convert("RGBA")
        left, top = (index % columns) * block[0], (index // columns) * block[1]
        for row in range(4):
            part = drawn.crop((0, row * fh + fh - keep, fw * 3, (row + 1) * fh))
            part = part.resize((part.width * scale, part.height * scale), Image.NEAREST)
            y = top + row * keep * scale
            line = Image.new("RGBA", (part.width, 1), (120, 160, 220, 255))
            sheet.alpha_composite(line, (left, y + (keep - foot) * scale))
            sheet.alpha_composite(part, (left, y))
    x, y = 0, block[1] * rows
    for shown in people + sprites:
        sheet.alpha_composite(shown, (x, y))
        x += shown.width + 16
    target = RAW / "game-check" / "figures-check-5.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    sheet.convert("RGB").save(target)
    return target


def make(check: bool = False) -> list[Path]:
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    bases = {
        key: (walking(steadied(Image.open(BASE_DIR / name), frame), frame), hues)
        for key, (name, hues) in BASES.items()
    }
    casts = {key: steadied(Image.open(BASE_DIR / name), frame) for key, name in CAST_BASES.items()}
    pickups = {
        key: steadied(Image.open(BASE_DIR / name), frame) for key, name in PICKUP_BASES.items()
    }
    wins = {key: Image.open(BASE_DIR / name).convert("RGBA") for key, name in WIN_BASES.items()}
    sleeps = {
        key: Image.open(BASE_DIR / name).convert("RGBA")
        for key, name in SLEEP_BASES.items()
        if (BASE_DIR / name).is_file()
    }
    flies = {
        key: Image.open(BASE_DIR / name).convert("RGBA")
        for key, name in FLY_BASES.items()
        if (BASE_DIR / name).is_file()
    }
    written = []
    for look_id, look in looks().items():
        base, hues = bases[look["gender"]]
        colours = {p: look[p] for p in PARTS}
        sheet = stacked(
            recolour_sheet(base, frame, colours, hues),
            recolour_sheet(casts[look["gender"]], frame, colours, hues),
            recolour_sheet(pickups[look["gender"]], frame, colours, hues),
            recolour_sheet(wins[look["gender"]], frame, colours, hues),
            recolour_sheet(sleeps[look["gender"]], frame, colours, hues),
            *(
                [recolour_sheet(flies[look["gender"]], frame, colours, hues)]
                if look["gender"] in flies
                else []
            ),
        )
        target = FIGURES / f"wizard-{look_id}.webp"
        sized(sheet, frame, about["foot"]).save(target, quality=90, method=6)
        written.append(target)
    sets = friend_sets()
    for name, (key, own) in FRIENDS.items():
        base, hues = bases[key]
        for set_name, colours in sets[name].items():
            target = FIGURES / f"{name}-{set_name}.webp"
            both = {**own, **colours}
            sheet = stacked(
                recolour_sheet(base, frame, both, hues),
                recolour_sheet(sleeps[key], frame, both, hues),
            )
            sized(sheet, frame, about["foot"]).save(target, quality=90, method=6)
            written.append(target)
        (FIGURES / f"{name}.webp").unlink(missing_ok=True)
    # The list is whatever sheets the folder holds: these, and the figures cut once
    # by export_scene.py (Wenna, Eldra, Dask).
    about["figures"] = sorted(p.stem for p in FIGURES.glob("*.webp"))
    about["rows"] = ROWS
    about["floating"] = sorted(FLOATING)
    # The grown-ups, whose steps the page plays heavier than the children's (D132).
    about["adults"] = sorted(GROWN_UPS)
    # A sheet whose rows are not a wizard's says its own (D91).
    about["sheets"] = {
        f"{name}-{set_name}": FRIEND_ROWS for name in FRIENDS for set_name in sets[name]
    }
    # A drawn figure says its rows, the flying ones and the sitting ones where it has
    # them (D188, D273).
    for name in DRAWN:
        if (FIGURES / f"{name}.webp").is_file():
            about["sheets"][name] = drawn_rows_of(name)
    # The familiars (D273): a walking sheet each, about half a child's height.
    familiars = [
        familiar_id(kind, colour)
        for kind, own in FAMILIARS.items()
        for colour in own["colours"]
        if (FIGURES / f"{familiar_id(kind, colour)}.webp").is_file()
    ]
    for name in familiars:
        about["sheets"][name] = {"walk": 0}
    about["familiars"] = sorted(familiars)
    about["familiar_height_cells"] = FAMILIAR_HEIGHT_CELLS
    (FIGURES / "figures.json").write_text(json.dumps(about, indent=2) + "\n", encoding="utf-8")
    if check:
        # Every sheet written, then the drawn figures' and the things' sprites (D182),
        # and the portraits (D194).
        shown = [*written, *(FIGURES / f"{name}.webp" for name in DRAWN)]
        shown += sorted((REPO / "content" / "art" / "things").glob("*.webp"))
        shown += sorted(PORTRAITS.glob("*.webp"))
        sheets = [Image.open(p).convert("RGBA") for p in shown if p.is_file()]
        strip = Image.new(
            "RGBA",
            (sum(s.width for s in sheets), max(s.height for s in sheets)),
            (235, 235, 225, 255),
        )
        x = 0
        for sheet in sheets:
            strip.alpha_composite(sheet, (x, 0))
            x += sheet.width
        RAW.mkdir(parents=True, exist_ok=True)
        strip.save(RAW / "figures-check.png")
    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="The characters' sheets in every look.")
    parser.add_argument("--check", action="store_true", help="also write a sheet to look at")
    parser.add_argument(
        "--portraits", action="store_true", help="make each look's portrait from the base busts"
    )
    parser.add_argument(
        "--cast", nargs=2, metavar=("GENDER", "EDIT"), help="make a casting base from an edit"
    )
    parser.add_argument(
        "--pickup", nargs=2, metavar=("GENDER", "EDIT"), help="make a picking-up base from an edit"
    )
    parser.add_argument(
        "--win", nargs=2, metavar=("GENDER", "EDIT"), help="make a celebrating base from an edit"
    )
    parser.add_argument(
        "--sleep-input", metavar="KIND", help="make the picture Gemini edits into a sheet asleep"
    )
    parser.add_argument(
        "--sleep", nargs=2, metavar=("KIND", "EDIT"), help="make a sleeping base from an edit"
    )
    parser.add_argument(
        "--standing",
        nargs=2,
        metavar=("FIGURE", "DRAWING"),
        help="make a figure's sheet again from a drawing of it standing still",
    )
    parser.add_argument(
        "--fly", nargs=2, metavar=("GENDER", "EDIT"), help="make a flying base from an edit"
    )
    parser.add_argument(
        "--clean-fly", action="store_true", help="clear the flying bases' magenta rim"
    )
    parser.add_argument(
        "--drawn-fly-view",
        nargs=3,
        metavar=("FIGURE", "WAYS", "DRAWING"),
        help="draw views of a drawn figure's flying rows again (ways joined by commas)",
    )
    parser.add_argument(
        "--drawn", nargs=2, metavar=("FIGURE", "DRAWING"), help="make a figure from a drawing"
    )
    parser.add_argument(
        "--drawn-sit",
        nargs=2,
        metavar=("FIGURE", "DRAWING"),
        help="make a drawn figure's sitting rows from a drawing of it sitting",
    )
    parser.add_argument(
        "--familiars-check",
        action="store_true",
        help="write the sheet of chapter 5's figures to look at",
    )
    parser.add_argument(
        "--familiar",
        nargs=3,
        metavar=("KIND", "COLOUR", "DRAWING"),
        help="make a familiar's walking sheet from a drawing of it",
    )
    parser.add_argument(
        "--drawn-fly",
        nargs=2,
        metavar=("FIGURE", "DRAWING"),
        help="make a drawn figure's flying rows from a drawing of it on its broom",
    )
    parser.add_argument(
        "--like",
        metavar="KIND",
        help="with --sleep, for an edit of other figures: as tall as KIND",
    )
    args = parser.parse_args()
    if args.standing:
        print(make_standing(args.standing[0], Path(args.standing[1])).relative_to(REPO))
        return 0
    if args.fly:
        print(make_fly_base(args.fly[0], Path(args.fly[1])).relative_to(REPO))
        return 0
    if args.drawn:
        print(make_drawn(args.drawn[0], Path(args.drawn[1])).relative_to(REPO))
        return 0
    if args.drawn_sit:
        print(make_drawn_sit(args.drawn_sit[0], Path(args.drawn_sit[1])).relative_to(REPO))
        return 0
    if args.familiars_check:
        print(familiars_check().relative_to(REPO))
        return 0
    if args.familiar:
        kind, colour, drawing = args.familiar
        print(make_familiar(kind, colour, Path(drawing)).relative_to(REPO))
        return 0
    if args.drawn_fly_view:
        name, way, drawing = args.drawn_fly_view
        print(make_drawn_fly_view(name, way, Path(drawing)).relative_to(REPO))
        return 0
    if args.clean_fly:
        for gender in FLY_BASES:
            print(clean_fly_base(gender).relative_to(REPO))
        return 0
    if args.portraits:
        for path in make_portraits():
            print(path.relative_to(REPO))
        return 0
    if args.drawn_fly:
        print(make_drawn_fly(args.drawn_fly[0], Path(args.drawn_fly[1])).relative_to(REPO))
        return 0
    if args.sleep_input:
        print(make_sleep_input(args.sleep_input).relative_to(REPO))
        return 0
    if args.sleep:
        print(make_sleep_base(args.sleep[0], Path(args.sleep[1]), args.like).relative_to(REPO))
        return 0
    if args.cast:
        print(make_cast_base(args.cast[0], Path(args.cast[1])).relative_to(REPO))
        return 0
    if args.pickup:
        print(make_pickup_base(args.pickup[0], Path(args.pickup[1])).relative_to(REPO))
        return 0
    if args.win:
        print(make_win_base(args.win[0], Path(args.win[1])).relative_to(REPO))
        return 0
    for path in make(args.check):
        print(path.relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
