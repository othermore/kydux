#!/usr/bin/env python3
"""The art demo (D72): the game's real scenes drawn from painted pieces and
played, in a page of its own, so that the owner sees how the style would look
in the game before the game draws it.

    tools/art/trials/demo.py            build the page
    tools/art/trials/demo.py compare    after demo_shots.mjs: the sketch beside the shots

Builds art/raw/demo/ (not committed): index.html and demo.js, copied from
tools/art/trials/demo/; scenes.js, the scenes the page draws, read from
content/scenes/ (each tile's terrain, the fixed things, the rooms) and from
the levels the page plays (where their things and actors stand); and, from
the painting of chapter 1's scene over its 3/4 guide (layout.py guide34),
painted-the-gate.png cropped to the page's grid, with painted-grid.png, the
grid laid over it to see how well it keeps to the tiles. The pieces are cut
before, by sprites.py, into art/raw/demo/pieces/. The page opens from the
disk, with no server: everything it reads is a script or an image.
"""

import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
DEMO = REPO / "art" / "raw" / "demo"
SOURCE = REPO / "art" / "raw" / "demo-src"
sys.path.insert(0, str(HERE))
import layout  # noqa: E402

#: The scenes the page plays, and the levels whose things and actors it shows.
SCENES = {
    "the-gate": [],
    "the-field": [],
    "the-library": ["the-lost-book"],
    "the-night-passages": ["past-the-teacher", "the-moving-stairs", "the-dark-room"],
}


def scene_data(scene_id: str, levels: list[str]) -> dict:
    scene = layout.read(scene_id)
    things = [dict(thing) for thing in scene.things]
    actors = []
    for level_id in levels:
        level = json.loads((REPO / "content" / "levels" / level_id / "level.json").read_text())
        things += [t for t in level.get("things", []) if "kind" in t]
        actors += level.get("actors", [])
    return {
        "id": scene_id,
        "rows": list(scene.rows),
        "terrains": {
            letter: {"kind": t["kind"], "walk": t["walk"]} for letter, t in scene.terrains.items()
        },
        "things": things,
        "props": list(scene.props),
        "rooms": {room: list(box) for room, box in scene.rooms.items()},
        "actors": actors,
    }


def painted(scene_id: str, painting: Path) -> Path | None:
    """The painting of a scene's 3/4 guide, cropped to the page's grid: the scene's
    tiles, with RISE pixels above them for the first row's tops."""
    if not painting.is_file():
        return None
    scene = layout.read(scene_id)
    guided, band = layout.guide34(scene, (16, 9))
    full = Image.open(painting).convert("RGB").resize(guided.size, Image.LANCZOS)
    grid = layout.kinds(scene)
    width, height = len(grid[0]) * layout.TILE, len(grid) * layout.TILE + layout.RISE
    top = band - layout.RISE
    crop = full.crop((0, top, width, top + height))
    target = DEMO / f"painted-{scene_id}.png"
    crop.save(target)
    # The grid over it, the tiles not walked on tinted red, the guide's edges in white.
    check = crop.convert("RGBA")
    tint = Image.new("RGBA", check.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(tint)
    for y, row in enumerate(grid):
        for x, _kind in enumerate(row):
            box = (
                x * layout.TILE,
                layout.RISE + y * layout.TILE,
                (x + 1) * layout.TILE - 1,
                layout.RISE + (y + 1) * layout.TILE - 1,
            )
            if not scene.walks(x, y):
                draw.rectangle(box, fill=(220, 40, 40, 70))
            draw.rectangle(box, outline=(255, 255, 255, 90))
    check.alpha_composite(tint)
    check.save(DEMO / f"painted-grid-{scene_id}.png")
    return target


def build() -> Path:
    DEMO.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "demo.js", "field.js"):
        shutil.copy(HERE / "demo" / name, DEMO / name)
    # A scene the content no longer has is left out: chapter 1 is on the-field now.
    data = {
        scene_id: scene_data(scene_id, levels)
        for scene_id, levels in SCENES.items()
        if (REPO / "content" / "scenes" / scene_id / "map.txt").is_file()
    }
    pieces = sorted(p.stem for p in (DEMO / "pieces").glob("*.png"))
    paintings = {}
    made = painted("the-gate", SOURCE / "demo-painted-gate-3.png") if "the-gate" in data else None
    if made:
        paintings["the-gate"] = made.name
    payload = {"scenes": data, "pieces": pieces, "paintings": paintings}
    # Chapter 1 painted first, cut by tools/art/image_first.py, when it has been:
    # the latest painting first, the page's default.
    fields = {}
    for scene_id, folder in (("the-field-3", "field-3"), ("the-field", "field")):
        cut = DEMO / folder / "field.json"
        if cut.is_file():
            fields[scene_id] = {"dir": folder, **json.loads(cut.read_text(encoding="utf-8"))}
    if fields:
        payload["fields"] = fields
    (DEMO / "scenes.js").write_text(
        "// Made by tools/art/trials/demo.py from content/; not to be edited.\n"
        f"window.KYDUX_DEMO = {json.dumps(payload, indent=1)};\n",
        encoding="utf-8",
    )
    return DEMO / "index.html"


def side_by_side(pictures: list[tuple[str, Image.Image]], height: int = 560) -> Image.Image:
    """Pictures in a row, each `height` pixels tall, with its label above it."""
    scaled = [
        (
            label,
            pic.convert("RGB").resize(
                (round(pic.width * height / pic.height), height), Image.LANCZOS
            ),
        )
        for label, pic in pictures
    ]
    width = sum(pic.width for _, pic in scaled) + 16 * (len(scaled) + 1)
    sheet = Image.new("RGB", (width, height + 48), (30, 32, 40))
    draw = ImageDraw.Draw(sheet)
    x = 16
    for label, pic in scaled:
        draw.text((x, 12), label, fill=(240, 240, 245))
        sheet.paste(pic, (x, 36))
        x += pic.width + 16
    return sheet


def compare() -> list[Path]:
    """The sketch beside the demo's chapter 1, cropped to the garden and the gate
    as the sketch shows them; and the sketch, the painting and the pieces."""
    shots = DEMO / "shots"
    sketch = Image.open(REPO / "art" / "raw" / "style-frames" / "frame-b-pro-v2.png")
    # The gate and the garden before it, about as much as the sketch shows: tiles
    # 3 to 16 across and 1 to 10 down, as a camera closer in would frame them.
    box = (3 * layout.TILE, layout.TILE, 17 * layout.TILE, 11 * layout.TILE + layout.RISE)
    pieces = Image.open(shots / "gate-pieces-ambrel.png").crop(box)
    paint = Image.open(shots / "gate-painted-ambrel.png").crop(box)
    first = side_by_side(
        [("the sketch (Gemini, one picture)", sketch), ("the demo: pieces", pieces)]
    )
    first.save(shots / "compare-sketch.png")
    second = side_by_side(
        [("the sketch", sketch), ("one painting, cut by cells", paint), ("pieces", pieces)]
    )
    second.save(shots / "compare-variants.png")
    made = [shots / "compare-sketch.png", shots / "compare-variants.png"]
    # Chapter 1 painted first, beside the sketch, when its shots have been taken.
    if (shots / "image-first-gate.png").is_file():
        third = side_by_side(
            [
                ("the style-B sketch", sketch),
                ("chapter 1, painted first", Image.open(shots / "image-first-gate.png")),
            ]
        )
        third.save(shots / "compare-image-first.png")
        made.append(shots / "compare-image-first.png")
    # The third painting, simpler and with the field before the gate, beside the sketch.
    if (shots / "image-first-3-gate.png").is_file():
        fourth = side_by_side(
            [
                ("the style-B sketch", sketch),
                (
                    "chapter 1, the field before the gate",
                    Image.open(shots / "image-first-3-gate.png"),
                ),
            ]
        )
        fourth.save(shots / "compare-image-first-3.png")
        made.append(shots / "compare-image-first-3.png")
    return made


if __name__ == "__main__":
    if sys.argv[1:] == ["compare"]:
        for path in compare():
            print(path.relative_to(REPO))
    else:
        print(build().relative_to(REPO))
