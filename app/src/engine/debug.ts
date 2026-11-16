// What a tester sees on a scene opened with `?debug` in the address: layers over
// the scene that name and show its cells, turned on and off from a small panel in
// the scene's corner. Each cell's column and row, at its foot, and the cells'
// borders, drawn on a canvas of its own at the screen's resolution, so that they stay
// sharp however the scene is scaled (D208);
// each cell tinted by its kind of terrain, crossed out when no one walks on it,
// and in another colour while an open door's leaf lies on it (D125);
// and every painted image's mask, each row in its own colour. Which layers are on
// is kept in the browser for the next time. The panel says which page this is and
// which world it runs: the page's build, the stamp of the world it was built with,
// and the stamp of the world running (stamp.ts), the two the same; and a row of
// buttons plays each figure's step (D132), its numbers on it, for the owner to tune
// by ear.

import Phaser from 'phaser';
import type { Layout } from './layout';
import { FOOT_IN_CELL } from './depth';
import { TILE } from './placeholders';
import { t } from '../i18n';
import { debugWord } from './words';
import { EFFECTS, play, STEPS } from './sfx';

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
  margin: 0x4a3f5c,
  water: 0x3fa9f5,
  reeds: 0x7fb069,
  hedge: 0x2f8f4f,
  bench: 0xb08050,
  chest: 0x9b6b3a,
  stand: 0xc0905a,
  jetty: 0xc8a070,
  pole: 0x705030,
  gate: 0x805a30,
  lawn: 0x8fcf6f,
  furniture: 0xb5838d,
};
const OTHER = 0xff66cc;
/** The cross on a cell an open door's leaf lies on (D125). */
const LEAF = 0xff9f1a;
/** The cross on an enchanted cell, floor where no figure is seen (D135). */
const ENCHANTED = 0xb56bff;
/** The outline round each zone's cells, where its things are found from (D196). */
const ZONE_COLOURS = [0xffb000, 0x2fbf71, 0xb08cff, 0x00bcd4];
/** The cross on a low cell, which a flight crosses and a walk does not (D186). */
const LOW = 0x1f6fff;


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

/** A painted image, and the row its foot stands on. */
export interface PaintedImage {
  image: Phaser.GameObjects.Image;
  row: number;
}

/** A painted image and the mask drawn over it. */
interface Masked {
  source: Phaser.GameObjects.Image;
  mask: Phaser.GameObjects.Image;
}

export class DebugView {
  private readonly shown = kept();
  private readonly cells: Phaser.GameObjects.Graphics;
  /** The cells the open doors' leaves lie on, crossed out while they are open. */
  private readonly leaves: Phaser.GameObjects.Graphics;
  private readonly masks: Masked[] = [];
  private readonly numbers: HTMLCanvasElement;
  private readonly legend: HTMLElement;
  /** The page's build and the worlds' stamps, in the panel. */
  private readonly stamps: HTMLElement;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: Layout,
    private readonly parent: HTMLElement,
    painted: PaintedImage[],
    /** The cells painted beyond the playable area on each side (D83): left, top,
     * right, bottom. */
    private readonly margin: [number, number, number, number] = [0, 0, 0, 0],
  ) {
    this.cells = this.drawCells();
    this.leaves = this.scene.add.graphics().setDepth(DEPTH);
    for (const { image, row } of painted) this.masks.push({ source: image, mask: this.maskOf(image, row) });
    // Over the scene's canvas, in the frame the scene is in.
    const frame = parent.parentElement ?? parent;
    this.numbers = Object.assign(document.createElement('canvas'), { className: 'debug-numbers' });
    this.numbers.setAttribute('aria-hidden', 'true');
    this.legend = this.drawLegend();
    this.stamps = this.drawStamps();
    frame.append(this.numbers, this.panel(), this.legend);
    this.apply();
    parent.dataset.debug = 'true';
  }

  /** The cells drawn on, the margin's with them: the first column and row, and
   * the last ones past the end. */
  private get extent(): { x0: number; y0: number; x1: number; y1: number } {
    const [left, top, right, bottom] = this.margin;
    return { x0: -left, y0: -top, x1: this.map.width + right, y1: this.map.height + bottom };
  }

  /** The kind of a cell, `margin` past the playable area. */
  private kindAt(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return 'margin';
    return this.map.terrain[y]?.[x] ?? '';
  }

  /** Each cell tinted by its kind, and crossed out when no one walks on it: the
   * margin's cells, painted beyond the playable area, are never walked on. */
  private drawCells(): Phaser.GameObjects.Graphics {
    const cells = this.scene.add.graphics().setDepth(DEPTH);
    const { x0, y0, x1, y1 } = this.extent;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const kind = this.kindAt(x, y);
        cells.fillStyle(KIND_COLOURS[kind] ?? OTHER, 0.38).fillRect(x * TILE, y * TILE, TILE, TILE);
        const char = kind === 'margin' ? '#' : (this.map.rows[y]?.[x] ?? '#');
        if (char === '#' || char === '=' || char === '~') {
          // Red where no one walks or flies, blue where a flight crosses (D186).
          cells.lineStyle(2, char === '~' ? LOW : 0xff2a2a, 0.75);
          cells.lineBetween(x * TILE + 6, y * TILE + 6, (x + 1) * TILE - 6, (y + 1) * TILE - 6);
          cells.lineBetween((x + 1) * TILE - 6, y * TILE + 6, x * TILE + 6, (y + 1) * TILE - 6);
        }
      }
    }
    cells.lineStyle(3, ENCHANTED, 0.95);
    for (const [x, y] of this.map.enchanted) {
      cells.lineBetween(x * TILE + 6, y * TILE + 6, (x + 1) * TILE - 6, (y + 1) * TILE - 6);
      cells.lineBetween((x + 1) * TILE - 6, y * TILE + 6, x * TILE + 6, (y + 1) * TILE - 6);
    }
    // Each zone's cells framed in its colour, inset, so that two zones side by side
    // show their edge (D196).
    this.map.zones.forEach((zone, index) => {
      cells.lineStyle(3, ZONE_COLOURS[index % ZONE_COLOURS.length] ?? 0xffb000, 0.95);
      for (const [x, y] of zone.cells) cells.strokeRect(x * TILE + 10, y * TILE + 10, TILE - 20, TILE - 20);
    });
    cells.lineStyle(1, 0xffffff, 0.45);
    for (let x = x0; x <= x1; x += 1) cells.lineBetween(x * TILE, y0 * TILE, x * TILE, y1 * TILE);
    for (let y = y0; y <= y1; y += 1) cells.lineBetween(x0 * TILE, y * TILE, x1 * TILE, y * TILE);
    // Each ring's turn, in the order the level asks them flown through (D187), with an
    // arrow for the way it is flown (D219).
    this.map.rings.forEach((id, index) => {
      const ring = this.map.things.find((thing) => thing.id === id);
      if (!ring) return;
      const [x, y] = ring.tile;
      const arrow = ring.way === 'up' ? '↑' : ring.way === 'down' ? '↓' : '';
      cells.fillStyle(0x1f1f3a, 0.85).fillCircle((x + 0.5) * TILE, (y + 0.5) * TILE, TILE * 0.22);
      this.scene.add
        .text((x + 0.5) * TILE, (y + 0.5) * TILE, `${index + 1}${arrow}`, { fontSize: `${Math.round(TILE * 0.3)}px`, color: '#ffffff' })
        .setOrigin(0.5)
        .setDepth(DEPTH + 0.01)
        .setVisible(false)
        .setName('debug-ring');
    });
    return cells;
  }

  /** The cells the open doors' leaves lie on (D125), crossed out while they are
   * open; data-debug-leaves names them, "x,y" joined by ";". */
  doorsOpen(open: ReadonlySet<string>): void {
    this.leaves.clear();
    const covered = this.map.things
      .filter((thing) => thing.kind === 'door' && open.has(thing.id))
      .flatMap((thing) => thing.covers ?? []);
    this.leaves.lineStyle(3, LEAF, 0.95);
    for (const [x, y] of covered) {
      this.leaves.fillStyle(LEAF, 0.3).fillRect(x * TILE, y * TILE, TILE, TILE);
      this.leaves.lineBetween(x * TILE + 6, y * TILE + 6, (x + 1) * TILE - 6, (y + 1) * TILE - 6);
      this.leaves.lineBetween((x + 1) * TILE - 6, y * TILE + 6, x * TILE + 6, (y + 1) * TILE - 6);
    }
    if (covered.length > 0) this.parent.dataset.debugLeaves = covered.map((tile) => tile.join(',')).join(';');
    else delete this.parent.dataset.debugLeaves;
  }

  /** A painted image's mask: its shape filled with its row's colour, see-through. */
  private maskOf(source: Phaser.GameObjects.Image, row: number): Phaser.GameObjects.Image {
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
    box.append(this.stamps, this.drawSteps());
    return box;
  }

  /** A button for each step, the wizard's, a child's and a grown-up's, which plays it
   * and says its numbers: length, the filter's sweep, volume. */
  private drawSteps(): HTMLElement {
    const row = document.createElement('span');
    row.className = 'debug-steps';
    for (const name of STEPS) {
      const effect = EFFECTS[name];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'debug-toggle';
      button.id = `debug-${name.replace('_', '-')}`;
      button.textContent = debugWord(`steps.${name}`);
      button.title = `${effect.seconds} s, ${effect.from}→${effect.to} Hz, ${effect.volume}`;
      button.addEventListener('click', () => play(name));
      row.append(button);
    }
    return row;
  }

  /** The page's build and its world's stamp, and the running world's, each with its
   * name; the running world's said once it has loaded (main.ts puts it on the root). */
  private drawStamps(): HTMLElement {
    const stamps = document.createElement('span');
    stamps.className = 'debug-stamps';
    const part = (id: string, word: string, value: string) => {
      const item = document.createElement('span');
      item.id = id;
      item.dataset.stamp = value;
      item.textContent = `${debugWord(word)} ${value}`;
      return item;
    };
    stamps.append(
      part('debug-build', 'build', __BUILD__),
      part('debug-page-world', 'page_world', __WORLD_STAMP__),
      part('debug-world', 'world', this.running()),
    );
    return stamps;
  }

  /** The running world's stamp, or a dash while it loads. */
  private running(): string {
    return document.documentElement.dataset.worldStamp ?? '–';
  }

  /** What each colour of the cells' layer means. */
  private drawLegend(): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'debug-legend';
    const kinds = new Set(this.map.terrain.flat());
    if (this.margin.some((cells) => cells > 0)) kinds.add('margin');
    const entry = (colour: string, words: string, crossed = false) => {
      const item = document.createElement('span');
      const swatch = document.createElement('span');
      swatch.className = crossed ? 'debug-swatch crossed' : 'debug-swatch';
      if (colour) swatch.style.background = colour;
      item.append(swatch, words);
      legend.append(item);
    };
    // Each kind with the map's letters for it, so that a cell reads against map.txt.
    const letters = new Map<string, Set<string>>();
    this.map.terrain.forEach((row, y) =>
      row.forEach((kind, x) => {
        const letter = this.map.letters[y]?.[x];
        if (letter) letters.set(kind, (letters.get(kind) ?? new Set()).add(letter));
      }),
    );
    for (const kind of kinds) {
      const known = kind in KIND_COLOURS;
      const shown = [...(letters.get(kind) ?? [])].sort().join(' ');
      const words = debugWord(known ? `kinds.${kind}` : 'kinds.other');
      entry(hex(KIND_COLOURS[kind] ?? OTHER), shown ? `${shown} · ${words}` : words);
    }
    entry('', debugWord('blocked'), true);
    if (this.map.low.length > 0) entry(hex(LOW), debugWord('low'), true);
    if (this.map.things.some((thing) => (thing.covers ?? []).length > 0)) entry(hex(LEAF), debugWord('leaf'));
    if (this.map.enchanted.length > 0) entry(hex(ENCHANTED), debugWord('enchanted'), true);
    this.map.zones.forEach((zone, index) => {
      const colour = ZONE_COLOURS[index % ZONE_COLOURS.length] ?? 0xffb000;
      entry(hex(colour), `${debugWord('zone')}: ${t(`plan.zone.${zone.name}`)}`);
    });
    return legend;
  }

  /** Each layer shown as the panel says. */
  private apply(): void {
    this.cells.setVisible(this.shown.cells);
    this.leaves.setVisible(this.shown.cells);
    for (const number of this.scene.children.getAll('name', 'debug-ring')) {
      (number as Phaser.GameObjects.Text).setVisible(this.shown.cells);
    }
    this.legend.hidden = !this.shown.cells;
    for (const { mask } of this.masks) mask.setVisible(this.shown.masks);
    this.numbers.hidden = !this.shown.numbers;
    this.parent.dataset.debugLayers = LAYERS.filter((layer) => this.shown[layer]).join(',');
  }

  /** Every frame: the masks follow their images (a door opens, the wand is picked
   * up), and the numbers are drawn over the cells in view. */
  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    const world = this.stamps.querySelector<HTMLElement>('#debug-world');
    if (world && world.dataset.stamp !== this.running()) {
      world.dataset.stamp = this.running();
      world.textContent = `${debugWord('world')} ${this.running()}`;
    }
    if (this.shown.masks) {
      for (const { source, mask } of this.masks) {
        if (mask.texture.key !== source.texture.key) mask.setTexture(source.texture.key);
        mask.setPosition(source.x, source.y).setVisible(source.visible && source.alpha > 0.05);
      }
    }
    if (this.shown.numbers) this.drawNumbers(camera);
  }

  /** The column and row of each cell in view, at the screen's own resolution, on
   * the cell's floor: centred where a figure standing in it has its feet; and the
   * cells' borders, a dark line under a light one, seen on any ground (D208). The
   * canvas says where its cell (0, 0) begins and how wide a cell is, in its own
   * pixels (`data-grid`). */
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
    const { x0, y0, x1, y1 } = this.extent;
    const first = [Math.max(x0, Math.floor(view.x / TILE)), Math.max(y0, Math.floor(view.y / TILE))];
    const last = [Math.min(x1, Math.ceil(view.right / TILE)), Math.min(y1, Math.ceil(view.bottom / TILE))];
    const grid = `${Math.round(-view.x * scale)},${Math.round(-view.y * scale)},${(TILE * scale).toFixed(2)}`;
    if (this.numbers.dataset.grid !== grid) this.numbers.dataset.grid = grid;
    for (const [style, line] of [
      ['rgba(0, 0, 0, 0.55)', Math.max(3, 3 * ratio)],
      ['rgba(255, 255, 255, 0.8)', Math.max(1, ratio)],
    ] as const) {
      context.strokeStyle = style;
      context.lineWidth = line;
      context.beginPath();
      for (let x = first[0] ?? 0; x <= (last[0] ?? 0); x += 1) {
        const across = Math.round((x * TILE - view.x) * scale) + 0.5;
        context.moveTo(across, 0);
        context.lineTo(across, height);
      }
      for (let y = first[1] ?? 0; y <= (last[1] ?? 0); y += 1) {
        const down = Math.round((y * TILE - view.y) * scale) + 0.5;
        context.moveTo(0, down);
        context.lineTo(width, down);
      }
      context.stroke();
    }
    context.font = `bold ${Math.max(8, 9 * scale)}px monospace`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.lineWidth = Math.max(2, 2.5 * ratio);
    context.strokeStyle = '#000000';
    context.fillStyle = '#fff36b';
    for (let y = first[1] ?? 0; y < (last[1] ?? 0); y += 1) {
      for (let x = first[0] ?? 0; x < (last[0] ?? 0); x += 1) {
        const left = ((x + 0.5) * TILE - view.x) * scale;
        const top = ((y + FOOT_IN_CELL) * TILE - view.y) * scale;
        const words = `${x},${y}`;
        context.strokeText(words, left, top);
        context.fillText(words, left, top);
      }
    }
  }
}
