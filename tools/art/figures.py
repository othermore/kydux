#!/usr/bin/env python3
"""The characters' walking sheets in every look (13.2, D77): each look of the
creator, and each friend, made from a base sheet by recolouring its parts, so
that the figures stay the same drawing and only their colours change.

    tools/art/figures.py [--check]
    tools/art/figures.py --cast <boy|girl> <edit.png>

A base sheet is four rows (down, left, right, up) of three frames, as
content/art/figures/figures.json says. Each opaque pixel is told by its colour
and its place in its frame: the hat and the robe are the base's cloth colour,
told apart by the hat's band; the band and the robe's stars are its gold; the
hair is the dark brown above the robe, the skin the light warm colour; the
outlines, the eyes' darkest and the boots are left as they are. A part takes
its new colour with its shading kept: each pixel's lightness against the
part's middle lightness. The looks' colours are app/src/engine/looks.ts's.

Writes content/art/figures/wizard-<look>.webp for every look and the friends'
sheets named in FRIENDS, from the bases in art/figures/ (BASES), and their list in
figures.json; --check writes art/raw/figures-check.png, every sheet side by
side, to look at. A wizard's sheet has four more rows after its walking ones,
the same ways in the same order: casting, the wand raised, pointed with its
light and lowered, recoloured from the casting base of its gender (CAST_BASES).
--cast makes that base from Gemini's edit of the walking base
(tools/art/prompts/figure-cast-<gender>.md), put back on the base's grid.
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
#: The friends (D77): their base and their colours, as a look's.
FRIENDS = {
    "teku": (
        "friend-boy",
        {
            "skin": "#a8714a",
            "hair": "#1f1a17",
            "robe": "#c86f2c",
            "hat": "#8a4515",
            "band": "#3fa7c9",
        },
    ),
    "nuri": (
        "friend-girl",
        {
            "skin": "#c98e5f",
            "hair": "#4a2c1a",
            "robe": "#3f8f5a",
            "hat": "#2f6b44",
            "band": "#e8c547",
        },
    ),
}
PARTS = ("skin", "hair", "robe", "hat", "band")


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


def from_edit(edited: Image.Image, base: Image.Image, frame: tuple[int, int]) -> Image.Image:
    """A Gemini edit of a base sheet, put back on the base's grid: the edit was asked
    of the base enlarged four times on a magenta canvas of 9:16, centred; it is
    sized back, its magenta made transparent, and each figure moved so that its feet
    stand where the base frame's do (the bottom of the drawing, at its middle)."""
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
    for top in range(0, old.shape[0], fh):
        for x0 in range(0, old.shape[1], fw):
            new_cell = small[top : top + fh, x0 : x0 + fw]
            base_cell = old[top : top + fh, x0 : x0 + fw]

            def feet(cell: np.ndarray) -> tuple[int, int]:
                ys, xs = np.where(cell[..., 3] > 128)
                return (int(ys.max()), int(round(xs.mean()))) if ys.size else (fh - 1, fw // 2)

            (by, bx), (ny, nx) = feet(base_cell), feet(new_cell)
            dy, dx = by - ny, bx - nx
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


def stacked(top: Image.Image, bottom: Image.Image) -> Image.Image:
    """One sheet over the other."""
    sheet = Image.new("RGBA", (top.width, top.height + bottom.height), (0, 0, 0, 0))
    sheet.paste(top, (0, 0))
    sheet.paste(bottom, (0, top.height))
    return sheet


def make(check: bool = False) -> list[Path]:
    about = json.loads((FIGURES / "figures.json").read_text(encoding="utf-8"))
    frame = tuple(about["frame"])
    bases = {key: (Image.open(BASE_DIR / name), hues) for key, (name, hues) in BASES.items()}
    casts = {key: Image.open(BASE_DIR / name) for key, name in CAST_BASES.items()}
    written = []
    for look_id, look in looks().items():
        base, hues = bases[look["gender"]]
        colours = {p: look[p] for p in PARTS}
        sheet = stacked(
            recolour_sheet(base, frame, colours, hues),
            recolour_sheet(casts[look["gender"]], frame, colours, hues),
        )
        target = FIGURES / f"wizard-{look_id}.webp"
        sheet.save(target, quality=90, method=6)
        written.append(target)
    for name, (key, colours) in FRIENDS.items():
        target = FIGURES / f"{name}.webp"
        base, hues = bases[key]
        recolour_sheet(base, frame, colours, hues).save(target, quality=90, method=6)
        written.append(target)
    names = sorted({p.stem for p in written} | {"wenna", "eldra", "dask"})
    about["figures"] = names
    (FIGURES / "figures.json").write_text(json.dumps(about, indent=2) + "\n", encoding="utf-8")
    if check:
        sheets = [Image.open(p).convert("RGBA") for p in written]
        strip = Image.new(
            "RGBA", (sum(s.width for s in sheets), sheets[0].height), (235, 235, 225, 255)
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
        "--cast", nargs=2, metavar=("GENDER", "EDIT"), help="make a casting base from an edit"
    )
    args = parser.parse_args()
    if args.cast:
        print(make_cast_base(args.cast[0], Path(args.cast[1])).relative_to(REPO))
        return 0
    for path in make(args.check):
        print(path.relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main())
