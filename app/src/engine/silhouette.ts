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
// thin key reads as a key, not as a line through it.

import Phaser from 'phaser';
import { coveredShare, HIDDEN_SHARE, inFront, type Solid } from './cover';

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
