// The wizard's outline where something painted hides it (the owner's choice of
// 2026-10-24): on a painted scene a crown, a rock or a wall drawn in front of the
// wizard may cover it wholly, and the child would lose it. A thin yellow line of
// its figure is drawn over what covers it, only there, beating until it fades
// away and comes back, so that the child knows the wizard is behind.
//
// The line is a sheet of outlines made once from the wizard's sheet, frame for
// frame, and a sprite of it follows the wizard. It is cut by a mask: copies of
// the painted rows and things, of which only those in front of the wizard are
// shown, so that the line shows where they cover the wizard and nowhere else.

import Phaser from 'phaser';

/** The outline's colour, and how thick it is in the sheet's pixels. */
const COLOUR = [255, 214, 51] as const;
const THICK = 2;
/** How long the line takes to fade away, and as long to come back. */
const BEAT_MS = 650;

/** The outlines of a sheet's figures, frame for frame, as a texture named `key`. */
function outlineSheet(scene: Phaser.Scene, sheet: string, key: string): void {
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
      if (solid[y * width + x]) continue;
      // A pixel just outside the figure, within THICK of it, is the line.
      let near = false;
      for (let dy = -THICK; dy <= THICK && !near; dy += 1) {
        for (let dx = -THICK; dx <= THICK && !near; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && dx * dx + dy * dy <= THICK * THICK) {
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
  private readonly covers: Covering[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly figure: Phaser.GameObjects.Sprite,
    painted: Phaser.GameObjects.Image[],
    still: boolean,
  ) {
    const key = `${figure.texture.key}-outline`;
    outlineSheet(scene, figure.texture.key, key);
    this.line = scene.add.sprite(figure.x, figure.y, key, figure.frame.name).setDepth(9.5);
    // The mask: copies of what is painted, kept off the scene's own display list.
    const mask = new Phaser.GameObjects.Container(scene, 0, 0);
    for (const source of painted) {
      const copy = new Phaser.GameObjects.Image(scene, source.x, source.y, source.texture.key)
        .setOrigin(source.originX, source.originY)
        .setScale(source.scaleX, source.scaleY);
      mask.add(copy);
      this.covers.push({ source, copy });
    }
    this.line.enableFilters();
    this.line.filters?.external.addMask(mask, false, scene.cameras.main);
    if (still) this.line.setAlpha(0.85);
    else scene.tweens.add({ targets: this.line, alpha: { from: 1, to: 0 }, duration: BEAT_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Every frame: the line on the figure, in its frame, and the mask of what is in
   * front of it now. */
  update(): void {
    const figure = this.figure;
    this.line
      .setPosition(figure.x, figure.y)
      .setOrigin(figure.originX, figure.originY)
      .setScale(figure.scaleX, figure.scaleY)
      .setFrame(figure.frame.name)
      .setVisible(figure.visible);
    for (const { source, copy } of this.covers) {
      if (copy.texture.key !== source.texture.key) copy.setTexture(source.texture.key);
      copy.setPosition(source.x, source.y);
      copy.setVisible(source.visible && source.alpha > 0.05 && source.depth > figure.depth);
    }
  }
}
