#!/usr/bin/env python3
"""Painted pieces cut from a generated sheet (D72): characters, things and
textures in the painted style, which keep their brush strokes instead of
being reduced to true pixels as cut.py does for pixel art.

    tools/art/sprites.py figures <sheet.png> --out <folder> --name nuri --height 64 --side 0,1f,2f
    tools/art/sprites.py things <sheet.png> --out <folder> --names gate,... --height 64,...
    tools/art/sprites.py textures <sheet.png> --out <folder> --names grass,dirt,... --size 192
    tools/art/sprites.py sprite <picture.png> --out <thing.webp> --box x0,y0,x1,y1 --height 256
        [--lawn]
    tools/art/sprites.py portrait <bust.png> --out <portrait.webp>

A sheet is drawn on flat magenta. The magenta is keyed out softly: a pixel near
it is transparent, one at the edge of a figure partly so, with the magenta's
tint taken out of its colour, so that no pink fringe shows on the scene. The
pieces are found between the bands of magenta, in reading order (cut.cells),
trimmed to what is drawn and scaled with a smooth filter.

`figures` reads a walking sheet of three rows, down, left and up, of three
frames each (a step, standing, the other step), and writes
<name>-<way>-<frame>.png for the four ways, right being left mirrored; a
model that drew the side row facing right is mirrored back with --flip-side.
Every frame is scaled by the same factor, so that the figure keeps its size
from one frame to the next. `textures` writes each square of a grid of
textures, made seamless: the square blended with itself shifted by half, so
that it repeats without a seam. `sprite` cuts one thing of a kind drawn by the
game from its own picture (D182) out of a box of a picture: on flat magenta,
keyed out as a sheet is, and its rim of magenta's shades, a shadow or an edge
painted on the magenta, cleared from the outside in; with `--lawn`, a thing
painted standing on a lawn, the ring on its post, the lawn and its shadows taken
out by their colour, green over red, and only the thing's own piece kept, its
holes the lawn seen through it; trimmed, `height` pixels tall, written as a webp.
`portrait` cuts a character's bust painted on flat magenta (D194) into a square of 512
pixels, centred, the cut of its chest on the bottom edge.
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cut  # noqa: E402

Array = np.ndarray
MAGENTA = np.array([255, 0, 255])


def soft_key(image: Array, inner: int = 120, outer: int = 260) -> Array:
    """The image with the magenta keyed out softly: transparent within `inner` of
    it (summed over the three channels), opaque beyond `outer`, partly between,
    and the partly keyed pixels' colour freed of magenta (its green raised to
    the mean of its red and blue, which is what the magenta pulled down)."""
    out = image.astype(np.float32).copy()
    rgb = out[..., :3]
    distance = np.abs(rgb - MAGENTA).sum(axis=2)
    alpha = np.clip((distance - inner) / (outer - inner), 0.0, 1.0)
    # A pixel is magenta-tinted when its green falls short of its red and blue.
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    edge = alpha < 1.0
    rgb[..., 0] = np.where(edge, rgb[..., 0] - spill * 0.5, rgb[..., 0])
    rgb[..., 2] = np.where(edge, rgb[..., 2] - spill * 0.5, rgb[..., 2])
    out[..., 3] = np.minimum(out[..., 3], alpha * 255)
    return np.clip(out, 0, 255).astype(np.uint8)


def without_lines(image: Array, thickness: int = 8, share: float = 0.5) -> Array:
    """The keyed sheet with any thin line across it taken out: a model may draw a
    baseline under each row of figures, which would join the rows into one."""
    out = image.copy()
    covered = (out[..., 3] > 0).mean(axis=1)
    for start, end in cut._runs(covered > share):
        # A line stands alone: the rows just above and below it are nearly empty.
        above = covered[max(0, start - 4) : start]
        below = covered[end : end + 4]
        alone = (above.size == 0 or above.max() < 0.2) and (below.size == 0 or below.max() < 0.2)
        if end - start <= thickness and alone:
            out[start:end, :, 3] = 0
    return out


def pieces(image: Array, band: float = 0.985) -> list[tuple[int, tuple[int, int, int, int]]]:
    """The keyed sheet's pieces, as (row, box) in reading order: the row a piece's
    band of the sheet is in, counted from 0."""
    image = without_lines(image)
    boxes = cut.cells(image, band=band)
    rows = sorted({box[1] for box in boxes})
    return [(rows.index(box[1]), box) for box in boxes]


def scaled(piece: Array, factor: float) -> Image.Image:
    picture = Image.fromarray(piece)
    size = (max(1, round(picture.width * factor)), max(1, round(picture.height * factor)))
    return picture.resize(size, Image.LANCZOS)


def figures(
    path: Path, out: Path, name: str, height: int, flip_side: bool = False, side: str = ""
) -> list[Path]:
    """A walking sheet's frames, <name>-<way>-<n>.png, each figure `height` pixels
    tall for its standing frame, the others scaled alike. `side` chooses the side
    row's frames by their place, `f` after one to mirror it ("0,1f,2f"), for a
    model that drew some of them facing the other way."""
    image = soft_key(cut.load(path))
    found = pieces(image)
    rows: dict[int, list[Array]] = {}
    for row, (left, top, right, bottom) in found:
        rows.setdefault(row, []).append(cut.trim(image[top:bottom, left:right]))
    lines = [rows[r] for r in sorted(rows) if len(rows[r]) >= 2][:3]
    if len(lines) < 3:
        raise ValueError(f"{path.name}: {len(lines)} rows of frames found, not 3")
    standing = [line[len(line) // 2] for line in lines]
    factor = height / max(frame.shape[0] for frame in standing)
    out.mkdir(parents=True, exist_ok=True)
    written = []
    chosen = [(int(c.rstrip("f")), c.endswith("f")) for c in side.split(",") if c] or [
        (i, flip_side) for i in range(3)
    ]
    for way, line in zip(("down", "left", "up"), lines, strict=True):
        frames = [(line[i], f) for i, f in chosen] if way == "left" else [(f, False) for f in line]
        for index, (frame, flip) in enumerate(frames[:3]):
            picture = scaled(frame, factor)
            if flip:
                picture = picture.transpose(Image.FLIP_LEFT_RIGHT)
            target = out / f"{name}-{way}-{index}.png"
            picture.save(target)
            written.append(target)
            if way == "left":
                mirror = out / f"{name}-right-{index}.png"
                picture.transpose(Image.FLIP_LEFT_RIGHT).save(mirror)
                written.append(mirror)
    return written


def things(path: Path, out: Path, names: list[str], heights: list[int]) -> list[Path]:
    """A sheet's things in reading order, each named and `height` pixels tall; a
    name `-` skips its piece."""
    image = soft_key(cut.load(path))
    found = pieces(image)
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for (_row, (left, top, right, bottom)), name, height in zip(
        found, names, heights, strict=False
    ):
        if name == "-":
            continue
        piece = cut.trim(image[top:bottom, left:right])
        picture = scaled(piece, height / piece.shape[0])
        target = out / f"{name}.png"
        picture.save(target)
        written.append(target)
    return written


def seamless(square: Array) -> Array:
    """The square made to repeat without a seam: blended with itself shifted by
    half both ways, the shifted copy weighed most near the edges, where the
    original meets its neighbours."""
    size = square.shape[0]
    shifted = np.roll(square, (size // 2, size // 2), axis=(0, 1)).astype(np.float32)
    ramp = np.abs(np.linspace(-1.0, 1.0, size))
    # 0 in the middle of the square, 1 at its edges: where the shifted copy shows.
    weight = np.maximum.outer(ramp, ramp) ** 3
    weight = weight[..., None]
    return (square.astype(np.float32) * (1 - weight) + shifted * weight).astype(np.uint8)


def period(signal: Array, low: float = 0.15, high: float = 0.6) -> int:
    """The length after which a row of values best repeats itself, between `low`
    and `high` of its length: the lag of the highest correlation."""
    values = signal - signal.mean()
    best, lag = -np.inf, len(values)
    for shift in range(int(len(values) * low), int(len(values) * high)):
        a, b = values[:-shift], values[shift:]
        score = float((a * b).mean() / (a.std() * b.std() + 1e-6))
        if score > best:
            best, lag = score, shift
    return lag


def periodic(square: Array) -> Array:
    """A regular pattern, bricks or planks, cropped to a whole number of its
    periods across and down, so that it repeats without the ghost lines a blend
    would leave in its joints."""
    grey = square[..., :3].astype(np.float32).mean(axis=2)
    across = period(grey.mean(axis=0))
    down = period(grey.mean(axis=1))
    times_x = max(1, square.shape[1] // across)
    times_y = max(1, square.shape[0] // down)
    return square[: down * times_y, : across * times_x]


def textures(
    path: Path, out: Path, names: list[str], size: int, regular: tuple[str, ...] = ()
) -> list[Path]:
    """A grid's textures, each square cropped inside its edges, made seamless and
    scaled to `size` pixels a side; a texture named in `regular` is a regular
    pattern, cropped to its period instead of blended."""
    image = soft_key(cut.load(path))
    found = pieces(image)
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for (_row, (left, top, right, bottom)), name in zip(found, names, strict=False):
        side = min(right - left, bottom - top)
        margin = side // 20
        square = image[top + margin : top + side - margin, left + margin : left + side - margin]
        square = square.copy()
        square[..., 3] = 255
        made = periodic(square) if name in regular else seamless(square)
        # A period's crop keeps its shape: `size` is its width.
        tall = round(size * made.shape[0] / made.shape[1])
        tile = Image.fromarray(made).resize((size, tall), Image.LANCZOS)
        target = out / f"{name}.png"
        tile.save(target)
        written.append(target)
    return written


def off_lawn(image: Array) -> Array:
    """A thing painted on a lawn with the lawn taken out (D182): a pixel about as green
    as it is red, or greener, and far greener than blue, the lawn's yellow stripes, its
    green ones and their shadows, is the lawn's, and so is what is already clear; the
    thing is the largest group of the other pixels."""
    rgb = image[..., :3].astype(np.int16)
    lawn = (rgb[..., 1] >= rgb[..., 0] - 12) & (rgb[..., 1] > rgb[..., 2] + 40)
    if image.shape[2] == 4:
        lawn |= image[..., 3] < 128
    labelled = _groups(~lawn)
    sizes = np.bincount(labelled.ravel())
    sizes[0] = 0
    keep = labelled == int(sizes.argmax())
    out = (
        image.copy()
        if image.shape[2] == 4
        else np.dstack([image, np.full(image.shape[:2], 255, np.uint8)])
    )
    out[..., 3] = np.where(keep, out[..., 3], 0)
    return out


def off_magenta_rim(image: Array, margin: int = 20, depth: int | None = None) -> Array:
    """A keyed thing with its magenta rim taken out (D182): a pixel whose green falls
    short of its red and its blue by more than `margin` is magenta's, an edge or a
    shadow painted on it, and is cleared when it is reached from the clear pixels
    through others like it, at most `depth` pixels in when it is given, so that a
    crimson or a purple cloth beside the magenta keeps all but its rim; such a pixel
    inside the thing keeps its colour."""
    rgb = image[..., :3].astype(np.int16)
    clear = image[..., 3] == 0
    tinted = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] > margin
    passable = clear | tinted
    reached = clear.copy()
    steps = 0
    while depth is None or steps < depth:
        steps += 1
        grown = reached.copy()
        grown[1:] |= reached[:-1]
        grown[:-1] |= reached[1:]
        grown[:, 1:] |= reached[:, :-1]
        grown[:, :-1] |= reached[:, 1:]
        grown &= passable
        if np.array_equal(grown, reached):
            break
        reached = grown
    out = image.copy()
    out[..., 3] = np.where(reached, 0, out[..., 3])
    return out


def _groups(mask: Array) -> Array:
    """Each group of a mask's pixels that touch side by side, numbered from 1."""
    labelled = np.zeros(mask.shape, dtype=np.int32)
    count = 0
    height, width = mask.shape
    for y, x in zip(*np.nonzero(mask), strict=True):
        if labelled[y, x]:
            continue
        count += 1
        stack = [(y, x)]
        labelled[y, x] = count
        while stack:
            cy, cx = stack.pop()
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not labelled[ny, nx]:
                    labelled[ny, nx] = count
                    stack.append((ny, nx))
    return labelled


#: A portrait's side, in pixels (D194).
PORTRAIT = 512


def portrait(path: Path, out: Path, size: int = PORTRAIT) -> Path:
    """A portrait bust painted on flat magenta (D194): keyed out, its magenta rim
    cleared, only its largest piece kept, trimmed, and scaled into a square of `size`
    pixels, centred, the cut of its chest on the bottom edge; written as a webp."""
    keyed = off_magenta_rim(soft_key(cut.load(path)), depth=4)
    labelled = _groups(keyed[..., 3] > 0)
    sizes = np.bincount(labelled.ravel())
    sizes[0] = 0
    keyed[..., 3] = np.where(labelled == int(sizes.argmax()), keyed[..., 3], 0)
    trimmed = cut.trim(keyed)
    picture = scaled(trimmed, min(size / trimmed.shape[0], size / trimmed.shape[1]))
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    square.alpha_composite(picture, ((size - picture.width) // 2, size - picture.height))
    out.parent.mkdir(parents=True, exist_ok=True)
    square.save(out, quality=90, method=6)
    return out


def sprite(path: Path, out: Path, box: tuple[int, int, int, int], height: int, lawn: bool) -> Path:
    """One thing cut from a box of a picture, keyed off magenta or off a lawn, trimmed,
    `height` pixels tall, written to `out` (a webp keeps its transparency)."""
    image = cut.load(path)
    left, top, right, bottom = box
    piece = image[top:bottom, left:right]
    keyed = off_magenta_rim(soft_key(piece))
    if lawn:
        keyed = off_lawn(keyed)
    trimmed = cut.trim(keyed)
    picture = scaled(trimmed, height / trimmed.shape[0])
    out.parent.mkdir(parents=True, exist_ok=True)
    picture.save(out, lossless=True) if out.suffix == ".webp" else picture.save(out)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Painted pieces cut from a sheet.")
    parser.add_argument("kind", choices=("figures", "things", "textures", "sprite", "portrait"))
    parser.add_argument("sheet", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--name", default="figure")
    parser.add_argument("--names", default="")
    parser.add_argument("--height", default="64", help="one height, or one per thing")
    parser.add_argument("--size", type=int, default=192)
    parser.add_argument("--flip-side", action="store_true")
    parser.add_argument("--side", default="", help="the side row's frames, as 0,1f,2f")
    parser.add_argument("--regular", default="", help="textures cropped to their period")
    parser.add_argument("--box", default="", help="a sprite's box in the picture, x0,y0,x1,y1")
    parser.add_argument("--lawn", action="store_true", help="a sprite painted on a lawn")
    args = parser.parse_args()
    if args.kind == "portrait":
        print(portrait(args.sheet, args.out))
        return 0
    if args.kind == "sprite":
        box = tuple(int(v) for v in args.box.split(","))
        if len(box) != 4:
            parser.error("a sprite needs its --box, x0,y0,x1,y1")
        written_one = sprite(args.sheet, args.out, box, int(args.height), args.lawn)  # type: ignore[arg-type]
        print(written_one)
        return 0
    names = [n.strip() for n in args.names.split(",") if n.strip()]
    if args.kind == "figures":
        written = figures(
            args.sheet, args.out, args.name, int(args.height), args.flip_side, args.side
        )
    elif args.kind == "things":
        heights = [int(h) for h in args.height.split(",")]
        heights += [heights[-1]] * (len(names) - len(heights))
        written = things(args.sheet, args.out, names, heights)
    else:
        regular = tuple(n for n in args.regular.split(",") if n)
        written = textures(args.sheet, args.out, names, args.size, regular)
    print(f"{len(written)} pieces in {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
