// The wizard's outline where something painted hides it (the owner's choice):
// on a painted scene a crown, a rock or a wall drawn in front of the wizard may
// cover it, and the child would lose it. When more than a quarter of the figure
// is covered, a thin yellow line of it is drawn over what covers it, only there,
// beating until it fades away and comes back, so that the child knows the
// wizard is behind. A figure covered less is seen well enough without it.
//
// The line is a sheet of outlines made once from the wizard's sheet, frame for
// frame, and a sprite of it follows the wizard. It is cut by a mask: copies of
// the painted rows and things, of which only those in front of the wizard are
// shown, so that the line shows where they cover the wizard and nowhere else.
// How much is covered is counted by cover.ts. A thing revealed (D85) glows
// (D107): its own shape filled with the line's yellow, half seen and beating,
// over whatever covers it, so that it is found among things like it too and a
// thin key reads as a key, not as a line through it. The goal's mark lies on the
// ground under every cut-out and figure (D160), and where a cut-out of the scene covers
// it its ring is drawn over the cut-out as the figures' line is, as thin, as bright and
// beating as it, masked by copies of the cut-outs and never over a figure (D168), so
// that the mark is read whole. A hole that osto holds closed shows its floor whole, and
// round it a crack of light between two dark lines, wider and narrower along its way,
// with dark cracks running from it out into the floor and in over the hole; the dark lines
// stay and the light beats as a figure's outline does, so that what is held is read in the
// hole's own shape (D167).

import Phaser from 'phaser';
import { coveredShare, HIDDEN_SHARE, inFront, ringCoveredShare, type Solid } from './cover';

/** The outline's colour, and how thick it is in the sheet's pixels. */
const COLOUR = [255, 214, 51] as const;
const THICK = 2;
/** How long the line takes to fade away, and as long to come back; a thing's glow
 * beats between half seen and less, never gone, so that a small thing is never lost. */
const BEAT_MS = 650;
const GLOW_MOST = 0.75;
const GLOW_LEAST = 0.35;

/** The textures' pixels, solid or not, read once for each. */
const solids = new Map<string, Solid | null>();

function solidOf(scene: Phaser.Scene, key: string): Solid | null {
  const known = solids.get(key);
  if (known !== undefined) return known;
  const image = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let read: Solid | null = null;
  if (context && image.width > 0 && image.height > 0) {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    const solid = new Uint8Array(image.width * image.height);
    for (let index = 0; index < solid.length; index += 1) solid[index] = (pixels[index * 4 + 3] ?? 0) > 127 ? 1 : 0;
    read = { width: image.width, solid };
  }
  solids.set(key, read);
  return read;
}

/** The outlines of a sheet's figures, frame for frame, as a texture named `key`;
 * `filled`, their shapes filled with the colour instead (D107). */
function outlineSheet(scene: Phaser.Scene, sheet: string, key: string, filled = false): void {
  const thick = THICK;
  if (scene.textures.exists(key)) return;
  const source = scene.textures.get(sheet);
  const image = source.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const { width, height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const solid = new Uint8Array(width * height);
  for (let index = 0; index < solid.length; index += 1) solid[index] = (pixels.data[index * 4 + 3] ?? 0) > 127 ? 1 : 0;
  const out = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (filled) {
        if (!solid[y * width + x]) continue;
        const at = (y * width + x) * 4;
        out.data[at] = COLOUR[0];
        out.data[at + 1] = COLOUR[1];
        out.data[at + 2] = COLOUR[2];
        out.data[at + 3] = 255;
        continue;
      }
      if (solid[y * width + x]) continue;
      // A pixel just outside the figure, within THICK of it, is the line.
      let near = false;
      for (let dy = -thick; dy <= thick && !near; dy += 1) {
        for (let dx = -thick; dx <= thick && !near; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && dx * dx + dy * dy <= thick * thick) {
            near = solid[ny * width + nx] === 1;
          }
        }
      }
      if (!near) continue;
      const at = (y * width + x) * 4;
      out.data[at] = COLOUR[0];
      out.data[at + 1] = COLOUR[1];
      out.data[at + 2] = COLOUR[2];
      out.data[at + 3] = 255;
    }
  }
  context.putImageData(out, 0, 0);
  const outlines = scene.textures.addCanvas(key, canvas);
  // The same frames as the sheet's, so that the outline shows the frame the wizard does.
  for (const name of source.getFrameNames()) {
    const frame = source.get(name);
    outlines?.add(name, 0, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight);
  }
}

/** How deep a held hole's crack is drawn: on the floor, over the hole's own picture (2.8)
 * and under the goal's mark and everything that stands. */
const HELD_DEPTH = 2.85;
/** The crack of light round a held hole, in its picture's pixels: the light at its
 * narrowest and its widest along the crack, its middle on the row of pixels just outside
 * the hole's edge, and each dark edge beside it. */
const CRACK_NARROWEST = 1;
const CRACK_WIDEST = 3;
const CRACK_DARK = 2;
/** The light's colour, nearly white at the crack's middle and a pale yellow at its
 * edges, and the dark edges' colour. */
const CRACK_GLOW = [255, 238, 165] as const;
const CRACK_LIGHT = [255, 253, 236] as const;
const CRACK_EDGE = [24, 18, 12] as const;
/** The dark cracks that run from the crack of light out into the floor and in over the
 * hole, in its picture's pixels: one every so many pixels of the hole's edge, as few and
 * as many as these, each this short and this long, and how wide at its root. */
const CRACKS_EVERY = 14;
const CRACKS_FEWEST = 16;
const CRACKS_MOST = 48;
const CRACK_SHORTEST = 7;
const CRACK_LONGEST = 22;
const CRACK_ROOT = 2.4;
/** How far a held hole's crack picture reaches beyond the hole's on every side. */
const CRACK_PAD = Math.ceil(CRACK_WIDEST / 2 + CRACK_DARK) + 2 + CRACK_LONGEST;

/** Numbers from 0 to 1 that are the same for the same seed (mulberry32). */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed from a name, so that a hole's cracks are drawn the same every time. */
function seedOf(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) hash = Math.imul(hash ^ name.charCodeAt(index), 16777619);
  return hash >>> 0;
}

/** How often a crack splits, a branch of a crack, and a branch of a branch: never more. */
const CRACK_SPLITS = [0.65, 0.4] as const;

/** A dark crack from (x, y) along `angle`, `length` long: never a straight line, but a
 * zigzag of short steps, each turned the other way from the one before by a third of a
 * right angle or more, round a way that wanders a little; thinner toward its tip. Most
 * cracks split along their way into a branch, and a branch may split again, as cracks
 * in stone do (CRACK_SPLITS). */
function drawCrack(
  context: CanvasRenderingContext2D,
  random: () => number,
  [x, y]: [number, number],
  angle: number,
  length: number,
  root: number,
  depth = 0,
): void {
  const points: [number, number][] = [[x, y]];
  let [px, py, heading, left] = [x, y, angle, length];
  let side = random() < 0.5 ? -1 : 1;
  while (left > 0) {
    const step = Math.min(left, 1.5 + random() * 2);
    heading += (random() - 0.5) * 0.3;
    const toward = heading + side * (0.35 + random() * 0.45);
    px += Math.cos(toward) * step;
    py += Math.sin(toward) * step;
    points.push([px, py]);
    left -= step;
    side = -side;
  }
  context.strokeStyle = `rgb(${CRACK_EDGE.join(' ')} / 0.9)`;
  context.lineCap = 'round';
  for (let index = 1; index < points.length; index += 1) {
    const [from, to] = [points[index - 1], points[index]];
    if (!from || !to) continue;
    context.lineWidth = Math.max(0.6, root * (1 - (index - 1) / points.length));
    context.beginPath();
    context.moveTo(...from);
    context.lineTo(...to);
    context.stroke();
  }
  const splits = CRACK_SPLITS[depth] ?? 0;
  const from = points[Math.floor(points.length * (0.3 + random() * 0.4))];
  if (from && points.length > 2 && random() < splits) {
    const side = random() < 0.5 ? -1 : 1;
    const toward = angle + side * (0.45 + random() * 0.5);
    drawCrack(context, random, from, toward, length * (0.45 + random() * 0.2), root * 0.65, depth + 1);
  }
}

/** The crack of light round a hole held closed (D167), from the hole's picture `sheet`,
 * as two textures, `pad` pixels wider on every side than the picture: `<key>-light`, a
 * line of light where the picture meets the floor, as if the light of the hole came up
 * through the crack round the floor that closes it, wider and narrower along the crack
 * by the angle round the hole's middle; and `<key>-dark`, the crack itself, dark under
 * the light and on either side of it, and the dark cracks that run from it out into the
 * floor and in over the hole, the same every time for the same hole. */
function crackSheet(scene: Phaser.Scene, sheet: string, key: string, pad: number): void {
  if (scene.textures.exists(`${key}-light`)) return;
  const image = scene.textures.get(sheet).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const [width, height] = [image.width + pad * 2, image.height + pad * 2];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  context.drawImage(image, pad, pad);
  const pixels = context.getImageData(0, 0, width, height).data;
  const solid = new Uint8Array(width * height);
  let [sumX, sumY, count] = [0, 0, 0];
  for (let index = 0; index < solid.length; index += 1) {
    if ((pixels[index * 4 + 3] ?? 0) <= 127) continue;
    solid[index] = 1;
    sumX += index % width;
    sumY += Math.floor(index / width);
    count += 1;
  }
  const [middleX, middleY] = count > 0 ? [sumX / count, sumY / count] : [width / 2, height / 2];
  const reach = Math.ceil(CRACK_WIDEST / 2 + CRACK_DARK) + 1;
  const lit = context.createImageData(width, height);
  const dark = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inside = solid[y * width + x];
      // The distance to the nearest pixel on the boundary's other side, within reach.
      let nearest = Infinity;
      for (let dy = -reach; dy <= reach; dy += 1) {
        for (let dx = -reach; dx <= reach; dx += 1) {
          const [nx, ny] = [x + dx, y + dy];
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          if (solid[ny * width + nx] === inside) continue;
          nearest = Math.min(nearest, dx * dx + dy * dy);
        }
      }
      if (nearest === Infinity) continue;
      // How far from the crack's middle, the row of pixels just outside the hole's edge.
      const beyond = inside ? -(Math.sqrt(nearest) - 0.5) : Math.sqrt(nearest) - 0.5;
      const across = Math.abs(beyond - 0.5);
      const angle = Math.atan2(y - middleY, x - middleX);
      const wide = Math.min(1, Math.max(0, 0.5 + 0.3 * Math.sin(3 * angle + 1.3) + 0.25 * Math.sin(7 * angle + 0.4)));
      const half = (CRACK_NARROWEST + (CRACK_WIDEST - CRACK_NARROWEST) * wide) / 2;
      const at = (y * width + x) * 4;
      // The crack is dark from one edge to the other, so that it shows dark where its light
      // has faded; the light lies over its middle.
      if (across <= half + CRACK_DARK) {
        for (let channel = 0; channel < 3; channel += 1) dark.data[at + channel] = CRACK_EDGE[channel] ?? 0;
        dark.data[at + 3] = across <= half ? 255 : 230;
      }
      if (across <= half) {
        // Nearly white at the crack's middle, a pale yellow toward its edges.
        const light = 1 - across / half;
        for (let channel = 0; channel < 3; channel += 1) {
          const [edge, middle] = [CRACK_GLOW[channel] ?? 0, CRACK_LIGHT[channel] ?? 0];
          lit.data[at + channel] = Math.round(edge + (middle - edge) * light);
        }
        lit.data[at + 3] = 255;
      }
    }
  }
  context.putImageData(lit, 0, 0);
  scene.textures.addCanvas(`${key}-light`, canvas);
  const darkCanvas = document.createElement('canvas');
  darkCanvas.width = width;
  darkCanvas.height = height;
  const darkContext = darkCanvas.getContext('2d');
  if (!darkContext) return;
  darkContext.putImageData(dark, 0, 0);
  // The dark cracks, from points spread round the hole's edge, each along the edge's
  // outward or inward way there; the light is drawn over their roots.
  const edge: { x: number; y: number; angle: number }[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!solid[index] || (solid[index - 1] && solid[index + 1] && solid[index - width] && solid[index + width])) continue;
      edge.push({ x, y, angle: Math.atan2(y - middleY, x - middleX) });
    }
  }
  if (edge.length > 0) {
    edge.sort((one, other) => one.angle - other.angle);
    const random = seeded(seedOf(sheet));
    const count = Math.min(CRACKS_MOST, Math.max(CRACKS_FEWEST, Math.round(edge.length / CRACKS_EVERY)));
    for (let crack = 0; crack < count; crack += 1) {
      const at = edge[Math.floor(((crack + random() * 0.8) / count) * edge.length) % edge.length];
      if (!at) continue;
      // Outward, the way the floor round it lies: the sum of the ways to its open pixels.
      let [outX, outY] = [0, 0];
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          if (!solid[(at.y + dy) * width + at.x + dx]) [outX, outY] = [outX + dx, outY + dy];
        }
      }
      const outward = Math.atan2(outY, outX);
      const inward = random() < 0.4;
      const length = CRACK_SHORTEST + random() * (CRACK_LONGEST - CRACK_SHORTEST) * (inward ? 0.7 : 1);
      const angle = outward + (inward ? Math.PI : 0) + (random() - 0.5) * 0.8;
      drawCrack(darkContext, random, [at.x + 0.5, at.y + 0.5], angle, length, CRACK_ROOT);
    }
  }
  scene.textures.addCanvas(`${key}-dark`, darkCanvas);
}

/** A hole that osto holds closed (D167): the floor shows whole, and where the hole's
 * picture `key` would meet it, a crack of light, wider and narrower along its way, between
 * two dark lines, with dark cracks running from it, drawn where `image` draws the hole, so
 * that what is held is read in the hole's own shape. The dark lines and cracks stay; the
 * light alone fades away and comes back with the figures' beat. The scene shows it while
 * the hole is held. */
export function heldOutline(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  key: string,
  still: boolean,
): Phaser.GameObjects.Container {
  const pad = CRACK_PAD;
  const crackKey = `${key}-crack`;
  crackSheet(scene, key, crackKey, pad);
  // Its pictures are `pad` pixels wider on every side: drawn so that the hole's lines up.
  const [x, y] = [
    image.x + pad * image.scaleX * (2 * image.originX - 1),
    image.y + pad * image.scaleY * (2 * image.originY - 1),
  ];
  const [dark, light] = [`${crackKey}-dark`, `${crackKey}-light`].map((part) =>
    new Phaser.GameObjects.Image(scene, x, y, part)
      .setOrigin(image.originX, image.originY)
      .setScale(image.scaleX, image.scaleY),
  );
  const held = scene.add.container(0, 0, [dark, light].filter((part) => part !== undefined)).setDepth(HELD_DEPTH);
  held.setVisible(false);
  if (still) light?.setAlpha(0.85);
  else scene.tweens.add({ targets: light, alpha: { from: 1, to: 0 }, duration: BEAT_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return held;
}

/** A painted image, and its copy in the mask. */
interface Covering {
  source: Phaser.GameObjects.Image;
  copy: Phaser.GameObjects.Image;
}

export class Silhouette {
  private readonly line: Phaser.GameObjects.Sprite;
  private readonly mask: Phaser.GameObjects.Container;
  private readonly covers: Covering[] = [];
  /** Whether the line shows now: more than HIDDEN_SHARE of the figure covered, or,
   * for a thing revealed, whenever anything covers it. */
  shown = false;

  /** The outline of a figure, or of a thing revealed (D85) with `always`, which
   * shows whole, over whatever covers it. */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly figure: Phaser.GameObjects.Image,
    painted: Phaser.GameObjects.Image[],
    still: boolean,
    private readonly always = false,
  ) {
    const key = `${figure.texture.key}-${always ? 'glow' : 'outline'}`;
    outlineSheet(scene, figure.texture.key, key, always);
    this.line = scene.add.sprite(figure.x, figure.y, key, figure.frame.name).setDepth(9.5);
    // The mask: copies of what is painted, kept off the scene's own display list.
    const mask = new Phaser.GameObjects.Container(scene, 0, 0);
    this.mask = mask;
    for (const source of painted) {
      if (source === figure) continue;
      const copy = new Phaser.GameObjects.Image(scene, source.x, source.y, source.texture.key)
        .setOrigin(source.originX, source.originY)
        .setScale(source.scaleX, source.scaleY);
      mask.add(copy);
      this.covers.push({ source, copy });
    }
    if (!always) {
      this.line.enableFilters();
      this.line.filters?.external.addMask(mask, false, scene.cameras.main);
    }
    const [most, least] = always ? [GLOW_MOST, GLOW_LEAST] : [1, 0];
    if (still) this.line.setAlpha(always ? GLOW_MOST : 0.85);
    else scene.tweens.add({ targets: this.line, alpha: { from: most, to: least }, duration: BEAT_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Every frame: the mask of what is in front of the figure now, how much of it
   * that covers, and the line on the figure, in its frame, when enough does. */
  /** Whether the outline is left off: the wizard asleep is under its quilt, not
   * hidden by it (D91). */
  off = false;
  /** What the figure holds in its hands, which is in front of it and hides nothing
   * of it: a thing a spell has brought (D127). */
  held: ReadonlySet<Phaser.GameObjects.Image> = new Set();

  update(): void {
    const figure = this.figure;
    const front: Phaser.GameObjects.Image[] = [];
    for (const { source, copy } of this.covers) {
      if (copy.texture.key !== source.texture.key) copy.setTexture(source.texture.key);
      copy.setPosition(source.x, source.y);
      const before = !this.held.has(source) && inFront(figure, [source]).length > 0;
      copy.setVisible(before);
      if (before) front.push(source);
    }
    const share =
      figure.visible && !this.always ? coveredShare(figure, front, (key) => solidOf(this.scene, key)) : 0;
    this.shown = !this.off && (this.always ? figure.visible : share > HIDDEN_SHARE);
    // A thing drawn in another state, a book the spell has taken, glows so.
    const key = `${figure.texture.key}-${this.always ? 'glow' : 'outline'}`;
    if (this.line.texture.key !== key) {
      outlineSheet(this.scene, figure.texture.key, key, this.always);
      this.line.setTexture(key);
    }
    this.line
      .setPosition(figure.x, figure.y)
      .setOrigin(figure.originX, figure.originY)
      .setScale(figure.scaleX, figure.scaleY)
      .setFrame(figure.frame.name)
      .setVisible(this.shown);
  }

  /** The line taken away, with its mask. */
  destroy(): void {
    this.scene.tweens.killTweensOf(this.line);
    this.line.destroy();
    this.mask.destroy();
  }
}

/** What a mark's silhouette is masked by: a cut-out or a figure's sprite, and its copy. */
interface Over {
  source: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
  copy: Phaser.GameObjects.Image;
}

/** How much of a mark's ring must be covered for it to count as covered, for the tests. */
const MARK_COVERED = 0.02;

/** The copies of `sources`, in a mask kept off the scene's own display list. */
function copiesOf(
  scene: Phaser.Scene,
  sources: (Phaser.GameObjects.Image | Phaser.GameObjects.Sprite)[],
): { mask: Phaser.GameObjects.Container; overs: Over[] } {
  const mask = new Phaser.GameObjects.Container(scene, 0, 0);
  const overs = sources.map((source) => {
    const copy = new Phaser.GameObjects.Image(scene, source.x, source.y, source.texture.key, source.frame.name);
    mask.add(copy);
    return { source, copy };
  });
  return { mask, overs };
}

/** Each copy where its source is now, in its frame, seen when its source is seen and,
 * where `over` is given, drawn over the mark; the sources so seen. */
function follow(
  overs: Over[],
  over: (source: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) => boolean = () => true,
): (Phaser.GameObjects.Image | Phaser.GameObjects.Sprite)[] {
  const seen: (Phaser.GameObjects.Image | Phaser.GameObjects.Sprite)[] = [];
  for (const { source, copy } of overs) {
    if (copy.texture.key !== source.texture.key) copy.setTexture(source.texture.key, source.frame.name);
    else if (copy.frame.name !== source.frame.name) copy.setFrame(source.frame.name);
    const shown = source.visible && source.alpha > 0.05 && over(source);
    copy
      .setPosition(source.x, source.y)
      .setOrigin(source.originX, source.originY)
      .setScale(source.scaleX, source.scaleY)
      .setVisible(shown);
    if (shown) seen.push(source);
  }
  return seen;
}

/** The goal's mark where a cut-out of the scene hides it (D160, D168): the mark lies on
 * the ground, under every cut-out and every figure; in an open doorway, on the floor its
 * door's open picture paints, over that picture (D172). Where a cut-out covers it, its
 * ring is drawn over the cut-out as a figure's outline is drawn behind one (D107): a line
 * as thin as the figures', in their yellow, fading away and coming back with their beat,
 * only there. Where a figure stands over it, the figure covers it and nothing is drawn
 * over the figure. */
export class MarkSilhouette {
  private readonly ring: Phaser.GameObjects.Container;
  private readonly line: Phaser.GameObjects.Arc;
  private readonly beat: Phaser.GameObjects.Container | null;
  private readonly cutOuts: { mask: Phaser.GameObjects.Container; overs: Over[] };
  private readonly figures: { mask: Phaser.GameObjects.Container; overs: Over[] };
  /** Whether a cut-out covers the mark now. */
  covered = false;

  /** The silhouette of `mark`, a ring `radius` round its middle, drawn at `depth` where
   * one of `cutOuts`, the painted images, covers it and none of `figures` does; its line
   * as thick as a figure's outline on a figure drawn at `figureScale`. */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly mark: Phaser.GameObjects.Container,
    private readonly radius: number,
    cutOuts: Phaser.GameObjects.Image[],
    figures: Phaser.GameObjects.Sprite[],
    depth: number,
    still: boolean,
    figureScale: number,
  ) {
    this.line = scene.add.circle(0, 0, radius).setStrokeStyle(THICK * figureScale, Phaser.Display.Color.GetColor(...COLOUR), 1);
    this.ring = scene.add.container(mark.x, mark.y, [this.line]).setDepth(depth);
    // The mark's beat in size, which the ring follows; its alpha beats as a figure's line.
    const first = mark.list[0];
    this.beat = first instanceof Phaser.GameObjects.Container ? first : null;
    this.cutOuts = copiesOf(scene, cutOuts);
    this.figures = copiesOf(scene, figures);
    this.ring.enableFilters();
    this.ring.filters?.external.addMask(this.cutOuts.mask, false, scene.cameras.main);
    this.ring.filters?.external.addMask(this.figures.mask, true, scene.cameras.main);
    if (still) this.line.setAlpha(0.85);
    else scene.tweens.add({ targets: this.line, alpha: { from: 1, to: 0 }, duration: BEAT_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Every frame: the masks of the cut-outs and the figures drawn over the mark now, the
   * ring with the mark, and whether a cut-out covers it. Only what is deeper than the mark
   * is over it: an open door's picture lies under a mark in its doorway (D172). */
  update(): void {
    const over = (source: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite) => source.depth > this.mark.depth;
    const seen = follow(this.cutOuts.overs, over);
    follow(this.figures.overs, over);
    const scale = this.beat?.scaleX ?? 1;
    this.ring
      .setPosition(this.mark.x, this.mark.y)
      .setScale(scale)
      .setAlpha(this.mark.alpha)
      .setVisible(this.mark.visible);
    const share = this.mark.visible
      ? ringCoveredShare([this.mark.x, this.mark.y], this.radius * scale, seen, (key) => solidOf(this.scene, key))
      : 0;
    this.covered = share > MARK_COVERED;
  }

  /** The ring taken away, with its masks. */
  destroy(): void {
    this.scene.tweens.killTweensOf(this.line);
    this.ring.destroy();
    this.cutOuts.mask.destroy();
    this.figures.mask.destroy();
  }
}
