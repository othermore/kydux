// A familiar's trial in the circle (D263), drawn by the page from the creature's own
// sheet, frame by frame, so that no trial is painted. A trial with its colour, a white
// creature's too, is the whole figure washed a little towards white, half transparent,
// with an edge of light round it, and it stands still. A trial with no colour is only
// the figure's lines, its own dark lines and its outer edge, drawn thin in white light
// with the floor seen through, over a soft shade that lifts the lines off a pale floor,
// and with no edge of light: beside a white creature's trial, full and glowing, it is a
// hollow drawing, at the game's size as well. The scene makes its light tremble. The
// numbers are given at 200 pixels a cell and scaled to the sheet's cell. A trial that
// does not hold is seen a few seconds of the page's clock and then fades (D276, D285).
// Pure pixels and numbers, with no Phaser: the scene turns them into textures and
// sprites.

/** An image's pixels, RGBA, straight alpha, row by row. */
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** The cell the trials' numbers were chosen at, in pixels. */
const SAMPLE_CELL = 200;

/** A trial with its colour: the figure's colour kept at 0.7, white at 0.3, its alpha at
 * 0.72; its edge of light two glows, a warm wide one and a white narrow one, each the
 * figure grown by `size` pixels and blurred by `blur`. */
export const GOOD = {
  keep: 0.7,
  alpha: 0.72,
  glows: [
    { size: 27, blur: 10, colour: [255, 240, 150] as const, strength: 1 },
    { size: 9, blur: 2, colour: [255, 255, 255] as const, strength: 1 },
  ],
};

/** A trial with no colour: its outer edge `edge` pixels wide, two pixels of the sheet,
 * its dark lines where the figure is darker than `dark` (fully at `dark - fade`), no
 * veil of light inside, its lines white, and under them a soft shade alone: a glow
 * would fill so small a figure and make it a white creature's trial. */
export const PALE = {
  edge: 9,
  dark: 0.3,
  fade: 0.15,
  veil: 0,
  line: [255, 255, 255] as const,
  halos: [{ size: 13, blur: 4, colour: [60, 40, 30] as const, strength: 0.55 }],
};

/** How long a trial that does not hold is seen before it fades, and how long it takes to
 * fade, in milliseconds of the page's clock and not in ticks: a trial called in a run is
 * seen TRIAL_SEEN_MS at the normal speed, shorter as the speed is higher (D276); a trial
 * staged with no colour is seen TRIAL_STAGED_SEEN_MS from the start card's close,
 * whatever the speed, since the speed is a run's and the staged trial was called before
 * any run (D285). */
export const TRIAL_SEEN_MS = 4000;
export const TRIAL_STAGED_SEEN_MS = 10000;
export const TRIAL_FADE_MS = 1000;

/** The milliseconds a trial that does not hold has left, seen and fading, when it comes:
 * staged or called in a run. */
export function trialTime(staged: boolean): number {
  return (staged ? TRIAL_STAGED_SEEN_MS : TRIAL_SEEN_MS) + TRIAL_FADE_MS;
}

/** The milliseconds a fading trial has left after a frame of `delta` milliseconds played
 * at `speed`: a staged trial spends the page's plain clock, a called one the clock times
 * the speed (D276, D285). A paused run spends nothing; the scene does not ask. */
export function trialLeft(left: number, delta: number, speed: number, staged: boolean): number {
  return left - (staged ? delta : delta * speed);
}

/** How much of its alpha a fading trial is drawn with, `left` milliseconds left: whole
 * until its fade, then less and less over TRIAL_FADE_MS, nothing once it is gone. */
export function trialShown(left: number): number {
  return Math.max(0, Math.min(1, left / TRIAL_FADE_MS));
}

/** How a pale trial trembles (D263): a pixel of its sheet to each side, about eight
 * times a second. */
export const TREMBLE_MS = 125;
export const TREMBLE_PX = 1;

/** A number of the sample's pixels at the sheet's cell, an odd kernel size at least 1. */
function kernel(size: number, cell: number): number {
  const scaled = Math.max(1, Math.round((size * cell) / SAMPLE_CELL));
  return scaled % 2 === 1 ? scaled : scaled + 1;
}

function sigma(blur: number, cell: number): number {
  return (blur * cell) / SAMPLE_CELL;
}

/** A plane of values from 0 to 1, the image's size. */
type Plane = Float32Array;

/** The largest (or, `min`, the smallest) value within a square of `size` round each
 * pixel, out of the image counting as 0. */
export function spread(plane: Plane, width: number, height: number, size: number, min = false): Plane {
  const reach = Math.floor(size / 2);
  const pick = min ? Math.min : Math.max;
  const across = new Float32Array(plane.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let found = min ? 1 : 0;
      for (let dx = -reach; dx <= reach; dx += 1) {
        const at = x + dx;
        const value = at < 0 || at >= width ? 0 : (plane[y * width + at] ?? 0);
        found = pick(found, value);
      }
      across[y * width + x] = found;
    }
  }
  const out = new Float32Array(plane.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let found = min ? 1 : 0;
      for (let dy = -reach; dy <= reach; dy += 1) {
        const at = y + dy;
        const value = at < 0 || at >= height ? 0 : (across[at * width + x] ?? 0);
        found = pick(found, value);
      }
      out[y * width + x] = found;
    }
  }
  return out;
}

/** A plane blurred as a Gaussian of `deviation` pixels, by three box blurs. */
export function blurred(plane: Plane, width: number, height: number, deviation: number): Plane {
  if (deviation <= 0.25) return plane.slice();
  const box = Math.max(1, Math.round(Math.sqrt(4 * deviation * deviation + 1)));
  const reach = Math.floor(box / 2);
  let out: Plane = plane.slice();
  for (let pass = 0; pass < 3; pass += 1) {
    out = boxPass(boxPass(out, width, height, reach, true), width, height, reach, false);
  }
  return out;
}

function boxPass(plane: Plane, width: number, height: number, reach: number, across: boolean): Plane {
  const out = new Float32Array(plane.length);
  const count = reach * 2 + 1;
  const [lines, length] = across ? [height, width] : [width, height];
  for (let line = 0; line < lines; line += 1) {
    const at = (step: number) => (across ? line * width + step : step * width + line);
    let sum = 0;
    for (let step = -reach; step <= reach; step += 1) {
      if (step >= 0 && step < length) sum += plane[at(step)] ?? 0;
    }
    for (let step = 0; step < length; step += 1) {
      out[at(step)] = sum / count;
      const leaving = step - reach;
      const coming = step + reach + 1;
      if (leaving >= 0) sum -= plane[at(leaving)] ?? 0;
      if (coming < length) sum += plane[at(coming)] ?? 0;
    }
  }
  return out;
}

/** `layer` (straight alpha, 0 to 1) over `out`, both RGBA in floats. */
function over(out: Float32Array, colour: readonly number[], alpha: Plane): void {
  for (let i = 0; i < alpha.length; i += 1) {
    const a = Math.min(1, Math.max(0, alpha[i] ?? 0));
    if (a <= 0) continue;
    const below = out[i * 4 + 3] ?? 0;
    const together = a + below * (1 - a);
    for (let c = 0; c < 3; c += 1) {
      const mine = colour[c] ?? 0;
      const theirs = out[i * 4 + c] ?? 0;
      out[i * 4 + c] = (mine * a + theirs * below * (1 - a)) / together;
    }
    out[i * 4 + 3] = together;
  }
}

/** The body of the figure over `out`, each pixel its own colour. */
function bodyOver(out: Float32Array, colours: Float32Array, alpha: Plane): void {
  for (let i = 0; i < alpha.length; i += 1) {
    const a = Math.min(1, Math.max(0, alpha[i] ?? 0));
    if (a <= 0) continue;
    const below = out[i * 4 + 3] ?? 0;
    const together = a + below * (1 - a);
    for (let c = 0; c < 3; c += 1) {
      const theirs = out[i * 4 + c] ?? 0;
      out[i * 4 + c] = ((colours[i * 3 + c] ?? 0) * a + theirs * below * (1 - a)) / together;
    }
    out[i * 4 + 3] = together;
  }
}

function asPixels(out: Float32Array, width: number, height: number): Pixels {
  const data = new Uint8ClampedArray(out.length);
  for (let i = 0; i < out.length; i += 1) data[i] = i % 4 === 3 ? Math.round((out[i] ?? 0) * 255) : Math.round(out[i] ?? 0);
  return { width, height, data };
}

function alphaOf(figure: Pixels): Plane {
  const plane = new Float32Array(figure.width * figure.height);
  for (let i = 0; i < plane.length; i += 1) plane[i] = (figure.data[i * 4 + 3] ?? 0) / 255;
  return plane;
}

/** A trial with its colour, from a figure's pixels drawn at `cell` pixels a cell (D263). */
export function goodTrial(figure: Pixels, cell: number): Pixels {
  const { width, height } = figure;
  const alpha = alphaOf(figure);
  const out = new Float32Array(width * height * 4);
  for (const glow of GOOD.glows) {
    const halo = blurred(spread(alpha, width, height, kernel(glow.size, cell)), width, height, sigma(glow.blur, cell));
    over(out, glow.colour, halo.map((value) => value * glow.strength));
  }
  const colours = new Float32Array(width * height * 3);
  for (let i = 0; i < alpha.length; i += 1) {
    for (let c = 0; c < 3; c += 1) colours[i * 3 + c] = (figure.data[i * 4 + c] ?? 0) * GOOD.keep + 255 * (1 - GOOD.keep);
  }
  bodyOver(out, colours, alpha.map((value) => value * GOOD.alpha));
  return asPixels(out, width, height);
}

/** The lines a pale trial is drawn of, from 0 to 1: the figure's own dark lines and its
 * outer edge (D263). */
export function trialLines(figure: Pixels, cell: number): Plane {
  const { width, height } = figure;
  const inside = alphaOf(figure);
  const edge = spread(inside, width, height, kernel(PALE.edge, cell), true);
  const lines = new Float32Array(inside.length);
  for (let i = 0; i < inside.length; i += 1) {
    const lum = ((figure.data[i * 4] ?? 0) + (figure.data[i * 4 + 1] ?? 0) + (figure.data[i * 4 + 2] ?? 0)) / 3 / 255;
    const dark = Math.min(1, Math.max(0, (PALE.dark - lum) / PALE.fade)) * (inside[i] ?? 0);
    lines[i] = Math.min(1, Math.max(0, Math.max(dark, (inside[i] ?? 0) - (edge[i] ?? 0))));
  }
  return lines;
}

/** A trial with no colour, from a figure's pixels drawn at `cell` pixels a cell (D263). */
export function paleTrial(figure: Pixels, cell: number): Pixels {
  const { width, height } = figure;
  const inside = alphaOf(figure);
  const lines = trialLines(figure, cell);
  const out = new Float32Array(width * height * 4);
  for (const halo of PALE.halos) {
    const glow = blurred(spread(lines, width, height, kernel(halo.size, cell)), width, height, sigma(halo.blur, cell));
    over(out, halo.colour, glow.map((value) => value * halo.strength));
  }
  over(
    out,
    PALE.line,
    lines.map((value, i) => Math.min(1, value + (inside[i] ?? 0) * PALE.veil)),
  );
  return asPixels(out, width, height);
}

/** A whole sheet made trials frame by frame, each frame within its own bounds, so that
 * the trial's sheet has the creature's frames where the creature's has them. */
export function trialSheet(sheet: Pixels, frame: [number, number], cell: number, pale: boolean): Pixels {
  const [frameWidth, frameHeight] = frame;
  const out = new Uint8ClampedArray(sheet.data.length);
  for (let top = 0; top + frameHeight <= sheet.height; top += frameHeight) {
    for (let left = 0; left + frameWidth <= sheet.width; left += frameWidth) {
      const one = new Uint8ClampedArray(frameWidth * frameHeight * 4);
      for (let y = 0; y < frameHeight; y += 1) {
        const from = ((top + y) * sheet.width + left) * 4;
        one.set(sheet.data.subarray(from, from + frameWidth * 4), y * frameWidth * 4);
      }
      const made = (pale ? paleTrial : goodTrial)({ width: frameWidth, height: frameHeight, data: one }, cell);
      for (let y = 0; y < frameHeight; y += 1) {
        out.set(made.data.subarray(y * frameWidth * 4, (y + 1) * frameWidth * 4), ((top + y) * sheet.width + left) * 4);
      }
    }
  }
  return { width: sheet.width, height: sheet.height, data: out };
}
