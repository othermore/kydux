// What a tester sees on a scene opened with `?debug` in the address: layers over
// the scene that name and show its cells, turned on and off from a small panel in
// the scene's corner. Each cell's column and row, drawn on a canvas of its own at
// the screen's resolution, so that they stay sharp however the scene is scaled;
// each cell tinted by its kind of terrain, crossed out when no one walks on it;
// and every painted image's mask, each row in its own colour. Which layers are on
// is kept in the browser for the next time.

import Phaser from 'phaser';
import type { Layout } from './layout';
import { TILE } from './placeholders';
import { debugWord } from './words';

/** The layers a tester turns on and off. */
const LAYERS = ['numbers', 'cells', 'masks'] as const;
type DebugLayer = (typeof LAYERS)[number];

const STORAGE = 'kydux.debug';
/** Above the scene and its marks, under the words said (bubbles at 10). */
const DEPTH = 8.8;
/** The colour of each kind of terrain, and of a kind without one. */
const KIND_COLOURS: Record<string, number> = {
  wall: 0x8a8a99,
  floor: 0xd9c9a3,
  shelf: 0x9b6b3a,
  grass: 0x5fd35f,
  path: 0xf0c070,
  tree: 0x1e7a33,
  rock: 0x9aa0b0,
  fence: 0xb07a40,
  steps: 0xf4f4f4,
  bank: 0xa0703c,
  stone: 0x6fa8ff,
};
const OTHER = 0xff66cc;

/** Whether the page was opened with `?debug`. */
export function debugging(): boolean {
  return new URLSearchParams(globalThis.location?.search ?? '').has('debug');
}

function kept(): Record<DebugLayer, boolean> {
  const shown = { numbers: true, cells: false, masks: false };
  try {
    const saved = JSON.parse(globalThis.localStorage?.getItem(STORAGE) ?? '{}') as Partial<typeof shown>;
    for (const layer of LAYERS) if (typeof saved[layer] === 'boolean') shown[layer] = saved[layer];
  } catch {
    // Storage may be blocked: every layer starts as it does the first time.
  }
  return shown;
}

function keep(shown: Record<DebugLayer, boolean>): void {
  try {
    globalThis.localStorage?.setItem(STORAGE, JSON.stringify(shown));
  } catch {
    // Storage may be blocked: the layers are not remembered.
  }
}

/** The colour of a row's mask: the rows go round the colour wheel. */
function rowColour(row: number): number {
  return Phaser.Display.Color.HSVToRGB(((row * 47) % 360) / 360, 0.85, 1).color as number;
}

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

/** A painted image and the mask drawn over it. */
interface Masked {
  source: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Image;
}

export class DebugView {
  private readonly shown = kept();
  private readonly cells: Phaser.GameObjects.Graphics;
  private readonly masks: Masked[] = [];
  private readonly numbers: HTMLCanvasElement;
  private readonly legend: HTMLElement;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: Layout,
    private readonly parent: HTMLElement,
    painted: Phaser.GameObjects.Image[],
  ) {
    this.cells = this.drawCells();
    for (const source of painted) this.masks.push({ source, mask: this.maskOf(source) });
    // Over the scene's canvas, in the frame the scene is in.
    const frame = parent.parentElement ?? parent;
    this.numbers = Object.assign(document.createElement('canvas'), { className: 'debug-numbers' });
    this.numbers.setAttribute('aria-hidden', 'true');
    this.legend = this.drawLegend();
    frame.append(this.numbers, this.panel(), this.legend);
    this.apply();
    parent.dataset.debug = 'true';
  }

  /** Each cell tinted by its kind, and crossed out when no one walks on it. */
  private drawCells(): Phaser.GameObjects.Graphics {
    const cells = this.scene.add.graphics().setDepth(DEPTH);
    for (let y = 0; y < this.map.height; y += 1) {
      for (let x = 0; x < this.map.width; x += 1) {
        const kind = this.map.terrain[y]?.[x] ?? '';
        cells.fillStyle(KIND_COLOURS[kind] ?? OTHER, 0.38).fillRect(x * TILE, y * TILE, TILE, TILE);
        const char = this.map.rows[y]?.[x] ?? '#';
        if (char === '#' || char === '=') {
          cells.lineStyle(2, 0xff2a2a, 0.75);
          cells.lineBetween(x * TILE + 6, y * TILE + 6, (x + 1) * TILE - 6, (y + 1) * TILE - 6);
          cells.lineBetween((x + 1) * TILE - 6, y * TILE + 6, x * TILE + 6, (y + 1) * TILE - 6);
        }
      }
    }
    cells.lineStyle(1, 0xffffff, 0.45);
    for (let x = 0; x <= this.map.width; x += 1) cells.lineBetween(x * TILE, 0, x * TILE, this.map.height * TILE);
    for (let y = 0; y <= this.map.height; y += 1) cells.lineBetween(0, y * TILE, this.map.width * TILE, y * TILE);
    return cells;
  }

  /** A painted image's mask: its shape filled with its row's colour, see-through. */
  private maskOf(source: Phaser.GameObjects.Image): Phaser.GameObjects.Image {
    const row = Math.round((source.depth - 3) * 100 - 0.75);
    return this.scene.add
      .image(source.x, source.y, source.texture.key)
      .setOrigin(source.originX, source.originY)
      .setScale(source.scaleX, source.scaleY)
      .setTint(rowColour(row))
      .setTintMode(Phaser.TintModes.FILL)
      .setAlpha(0.45)
      .setDepth(DEPTH - 0.05);
  }

  /** The buttons that turn each layer on and off. */
  private panel(): HTMLElement {
    const box = document.createElement('div');
    box.className = 'debug-box';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', debugWord('title'));
    for (const layer of LAYERS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'debug-toggle';
      button.id = `debug-${layer}`;
      button.textContent = debugWord(layer);
      button.setAttribute('aria-pressed', String(this.shown[layer]));
      button.addEventListener('click', () => {
        this.shown[layer] = !this.shown[layer];
        button.setAttribute('aria-pressed', String(this.shown[layer]));
        keep(this.shown);
        this.apply();
      });
      box.append(button);
    }
    return box;
  }

  /** What each colour of the cells' layer means. */
  private drawLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'debug-legend';
    const kinds = new Set(this.map.terrain.flat());
    const entry = (colour: string, words: string, crossed = false) => {
      const item = document.createElement('span');
      const swatch = document.createElement('span');
      swatch.className = crossed ? 'debug-swatch crossed' : 'debug-swatch';
      if (colour) swatch.style.background = colour;
      item.append(swatch, words);
      legend.append(item);
    };
    for (const kind of kinds) {
      const known = kind in KIND_COLOURS;
      entry(hex(KIND_COLOURS[kind] ?? OTHER), debugWord(known ? `kinds.${kind}` : 'kinds.other'));
    }
    entry('', debugWord('blocked'), true);
    return legend;
  }

  /** Each layer shown as the panel says. */
  private apply(): void {
    this.cells.setVisible(this.shown.cells);
    this.legend.hidden = !this.shown.cells;
    for (const { mask } of this.masks) mask.setVisible(this.shown.masks);
    this.numbers.hidden = !this.shown.numbers;
    this.parent.dataset.debugLayers = LAYERS.filter((layer) => this.shown[layer]).join(',');
  }

  /** Every frame: the masks follow their images (a door opens, the wand is picked
   * up), and the numbers are drawn over the cells in view. */
  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    if (this.shown.masks) {
      for (const { source, mask } of this.masks) {
        if (mask.texture.key !== source.texture.key) mask.setTexture(source.texture.key);
        mask.setPosition(source.x, source.y).setVisible(source.visible && source.alpha > 0.05);
      }
    }
    if (this.shown.numbers) this.drawNumbers(camera);
  }

  /** The column and row of each cell in view, at the screen's own resolution. */
  private drawNumbers(camera: Phaser.Cameras.Scene2D.Camera): void {
    const canvas = this.scene.game.canvas;
    const frame = this.numbers.parentElement;
    if (!frame) return;
    const box = canvas.getBoundingClientRect();
    const outer = frame.getBoundingClientRect();
    const ratio = globalThis.devicePixelRatio || 1;
    Object.assign(this.numbers.style, {
      left: `${box.left - outer.left}px`,
      top: `${box.top - outer.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
    const width = Math.round(box.width * ratio);
    const height = Math.round(box.height * ratio);
    if (this.numbers.width !== width || this.numbers.height !== height) {
      this.numbers.width = width;
      this.numbers.height = height;
    }
    const context = this.numbers.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, height);
    // Screen pixels a pixel of the scene: the canvas's scaling, the camera's zoom.
    const scale = (box.width / canvas.width) * camera.zoom * ratio;
    const view = camera.worldView;
    context.font = `bold ${Math.max(8, 9 * scale)}px monospace`;
    context.textBaseline = 'top';
    context.lineWidth = Math.max(2, 2.5 * ratio);
    context.strokeStyle = '#000000';
    context.fillStyle = '#fff36b';
    const first = [Math.max(0, Math.floor(view.x / TILE)), Math.max(0, Math.floor(view.y / TILE))];
    const last = [Math.min(this.map.width, Math.ceil(view.right / TILE)), Math.min(this.map.height, Math.ceil(view.bottom / TILE))];
    for (let y = first[1] ?? 0; y < (last[1] ?? 0); y += 1) {
      for (let x = first[0] ?? 0; x < (last[0] ?? 0); x += 1) {
        const left = (x * TILE - view.x) * scale + 2 * scale;
        const top = (y * TILE - view.y) * scale + 1 * scale;
        const words = `${x},${y}`;
        context.strokeText(words, left, top);
        context.fillText(words, left, top);
      }
    }
  }
}
