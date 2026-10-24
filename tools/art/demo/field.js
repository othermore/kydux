// Chapter 1 painted first (the owner's choice, 2026-10-23): one painting by
// Gemini, its ground, and the things that stand up cut out of it with
// transparency (tools/art/image_first.py), each drawn in the order of the row
// its foot stands on, with the figures, so that a tree, a fence, a rock or a
// wall in front hides who is behind it. The camera follows the wizard down the
// tall scene; the cells are a pencil grid drawn over the whole scene, which
// breathes slowly. The wizard and Nuri play chapter 1's nine levels, each from
// its own start, as art/raw/image-first/levels.md proposes them.
'use strict';

const FIELD = window.KYDUX_DEMO.field;
const FT = FIELD ? FIELD.tile : 64;
const VIEW_ROWS = 12;
/** The figures were drawn for 48 pixels a cell. */
const FIGURE_SCALE = FT / 48;

const FIELD_LEVELS = [
  { title: 'Práctica 1: La puerta', place: [7, 20, 'right'], friend: [7, 21], actions: [{ walk: 'right', n: 1 }] },
  {
    title: 'Práctica 2: El rodeo',
    place: [14, 24, 'up'],
    friend: [14, 25],
    actions: [
      { walk: 'up', n: 2 },
      { walk: 'left', n: 2 },
    ],
  },
  {
    title: 'Arreglo 1: La nota',
    place: [8, 26, 'right'],
    friend: [7, 26],
    actions: [
      { walk: 'right', n: 2 },
      { walk: 'up', n: 1 },
      { walk: 'right', n: 1 },
    ],
  },
  { title: 'Práctica 3: El camino largo', place: [8, 24, 'left'], friend: [9, 24], actions: [{ walk: 'left', n: 5 }] },
  {
    title: 'Mejora 1: La cuesta',
    actions: [
      { walk: 'up', n: 4 },
      { walk: 'right', n: 2 },
    ],
  },
  {
    title: 'Práctica 4: La contraseña',
    place: [8, 23, 'up'],
    friend: [8, 24],
    actions: [{ walk: 'up', n: 3 }, { say: 'ambrel', italic: true }, { open: 'gate' }, { walk: 'up', n: 4 }],
  },
  {
    title: 'Práctica 5: La varita',
    actions: [{ walk: 'up', n: 2 }, { walk: 'right', n: 3 }, { pick: 'wand' }, { friend: 'down' }],
  },
  {
    title: 'Práctica 6: La puerta sellada',
    actions: [
      { walk: 'left', n: 3 },
      { walk: 'up', n: 2 },
      { cast: 'zelim', target: 'seal' },
      { walk: 'up', n: 2 },
    ],
  },
  {
    title: 'Práctica 7: La entrada',
    actions: [{ walk: 'up', n: 3 }, { say: 'ambrel', italic: true }, { open: 'door' }, { enter: true }],
  },
];

function fieldImage(name) {
  return IMG[`field:${name}`];
}

function loadField() {
  if (!FIELD) return Promise.resolve();
  const files = ['ground.png', 'baked.png', ...FIELD.layers.map((layer) => layer.file)];
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = `field/${file}`;
          IMG[`field:${file}`] = img;
        }),
    ),
  );
}

/** The pencil grid, drawn once: every line a little wobbly, its thickness and
 * darkness wandering along it, the same every time from its seed. */
function pencilGrid(columns, rows) {
  const canvas = document.createElement('canvas');
  canvas.width = columns * FT;
  canvas.height = rows * FT;
  const ctx = canvas.getContext('2d');
  const rnd = random(20261023);
  ctx.lineCap = 'round';
  const line = (x0, y0, x1, y1) => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.round(length / 10));
    const [nx, ny] = [(y0 - y1) / length, (x1 - x0) / length];
    const phase = [rnd() * 6.3, rnd() * 6.3];
    const wobble = (t) => 0.55 * Math.sin(t * 9 + phase[0]) + 0.35 * Math.sin(t * 23 + phase[1]);
    let width = 0.8 + rnd() * 0.3;
    let dark = 0.85;
    let [px, py] = [x0 + nx * wobble(0), y0 + ny * wobble(0)];
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const [qx, qy] = [x0 + (x1 - x0) * t + nx * wobble(t), y0 + (y1 - y0) * t + ny * wobble(t)];
      width = Math.min(1.3, Math.max(0.6, width + (rnd() - 0.5) * 0.18));
      dark = Math.min(1, Math.max(0.6, dark + (rnd() - 0.5) * 0.14));
      ctx.strokeStyle = `rgba(52, 42, 36, ${dark})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(qx, qy);
      ctx.stroke();
      [px, py] = [qx, qy];
    }
  };
  for (let c = 1; c < columns; c += 1) line(c * FT, 0, c * FT, rows * FT);
  for (let r = 1; r < rows; r += 1) line(0, r * FT, columns * FT, r * FT);
  return canvas;
}

class FieldWorld {
  constructor() {
    this.time = 0;
    this.level = 0;
    this.index = 0;
    this.actionTime = 0;
    this.effects = [];
    this.bubble = null;
    this.open = { gate: 0, seal: 0, door: 0 };
    this.opening = new Set();
    this.carried = false;
    this.inside = 0;
    this.wizard = { x: 7, y: 20, facing: 'right', from: null, to: null, t: 0, walked: 0, alpha: 1 };
    this.friend = { x: 7, y: 21, facing: 'right', from: null, to: null, t: 0, walked: 0, alpha: 1 };
    this.fade = 0;
    this.begin();
  }

  get current() {
    return FIELD_LEVELS[this.level];
  }

  begin() {
    const level = this.current;
    if (!level) return;
    this.index = 0;
    this.actionTime = 0;
    this.titleTime = 0;
    if (level.place) {
      const [x, y, facing] = level.place;
      Object.assign(this.wizard, { x, y, facing, from: null, to: null, t: 0 });
      const [fx, fy] = level.friend;
      Object.assign(this.friend, { x: fx, y: fy, from: null, to: null, t: 0, facing });
      // The figures appear at the level's start, the next level being dealt.
      this.fade = 0.6;
    }
  }

  step(fig, dt) {
    if (!fig.to) return;
    fig.t += dt / STEP;
    fig.walked += dt;
    if (fig.t >= 1) {
      [fig.x, fig.y] = fig.to;
      fig.from = fig.to = null;
      fig.t = 0;
    }
  }

  start(fig, dir) {
    const [dx, dy] = DIRS[dir];
    fig.facing = dir;
    fig.from = [fig.x, fig.y];
    fig.to = [fig.x + dx, fig.y + dy];
    fig.t = 0;
  }

  update(dt) {
    this.time += dt;
    this.titleTime += dt;
    this.fade = Math.max(0, this.fade - dt / 0.3);
    this.step(this.wizard, dt);
    this.step(this.friend, dt);
    for (const name of this.opening) this.open[name] = Math.min(1, this.open[name] + dt / 0.8);
    for (const e of this.effects) e.age += dt;
    this.effects = this.effects.filter((e) => e.age < e.life);
    if (this.bubble && (this.bubble.left -= dt) <= 0) this.bubble = null;
    this.act(dt);
  }

  act(dt) {
    const level = this.current;
    if (!level) {
      this.done = true;
      return;
    }
    // A level's title shows a moment before it plays.
    if (this.titleTime < 0.9) return;
    const action = level.actions[this.index];
    const next = () => {
      this.index += 1;
      this.actionTime = 0;
      this.stepsLeft = undefined;
    };
    if (!action) {
      if (this.actionTime === 0) this.actionTime = 0.0001;
      this.actionTime += dt;
      if (this.actionTime > 0.8 && !this.wizard.to && !this.friend.to) {
        this.level += 1;
        this.begin();
      }
      return;
    }
    this.actionTime += dt;
    const wiz = this.wizard;
    if (action.walk) {
      if (wiz.to) return;
      if (this.stepsLeft === undefined) this.stepsLeft = action.n;
      if (this.stepsLeft === 0) {
        next();
        return;
      }
      const behind = [wiz.x, wiz.y];
      this.start(wiz, action.walk);
      this.stepsLeft -= 1;
      const f = this.friend;
      if (!f.to && (f.x !== behind[0] || f.y !== behind[1])) {
        const dir = behind[0] > f.x ? 'right' : behind[0] < f.x ? 'left' : behind[1] > f.y ? 'down' : 'up';
        if (Math.abs(behind[0] - f.x) + Math.abs(behind[1] - f.y) === 1) this.start(f, dir);
      }
    } else if (action.friend) {
      // Nuri steps aside, out of the wizard's way back.
      if (!this.friend.to && this.actionTime < dt * 1.5) this.start(this.friend, action.friend);
      if (this.actionTime >= STEP + 0.1) next();
    } else if (action.say) {
      if (this.actionTime < dt * 1.5) this.bubble = { text: action.say, who: 'wizard', italic: action.italic, left: 1.6 };
      if (this.actionTime >= 1.2) next();
    } else if (action.open) {
      this.opening.add(action.open);
      if (this.actionTime >= 0.6) next();
    } else if (action.pick) {
      if (this.actionTime < dt * 1.5) {
        this.carried = true;
        this.effects.push({ kind: 'lift', x: 12, y: 14, age: 0, life: 0.7 });
      }
      if (this.actionTime >= 0.7) next();
    } else if (action.cast) {
      if (this.actionTime < dt * 1.5) {
        this.bubble = { text: action.cast, who: 'wizard', italic: true, left: 1.4 };
        this.effects.push({ kind: 'ring', x: wiz.x, y: wiz.y, age: 0, life: 0.8 });
        this.opening.add(action.target);
      }
      if (this.actionTime >= 1.3) next();
    } else if (action.enter) {
      // Into the castle's open door, where only the dark shows: the wizard, then Nuri.
      if (!wiz.to && this.actionTime < dt * 1.5) this.start(wiz, 'up');
      this.inside = Math.min(1, this.actionTime / 1.2);
      wiz.alpha = Math.max(0, 1 - this.actionTime / 0.5);
      const f = this.friend;
      if (this.actionTime > 0.35 && !f.to && f.y > 6) this.start(f, 'up');
      if (this.actionTime > 0.7) f.alpha = Math.max(0, 1 - (this.actionTime - 0.7) / 0.6);
      if (this.actionTime >= 2.4) next();
    }
  }
}

class FieldView {
  constructor(canvas) {
    this.canvas = canvas;
    this.world = new FieldWorld();
    this.grid = pencilGrid(FIELD.columns, FIELD.rows);
    [canvas.width, canvas.height] = [FIELD.columns * FT, VIEW_ROWS * FT];
    this.camera = null;
  }

  restart() {
    this.world = new FieldWorld();
    this.camera = null;
  }

  update(dt) {
    this.world.update(dt);
    if (this.world.done) this.restart();
  }

  /** The camera's top, on the wizard, eased, and never past the scene's ends. */
  follow(instant) {
    const [, fy] = figurePos(this.world.wizard);
    const wanted = Math.min(Math.max(0, (fy + 0.5) * FT - (VIEW_ROWS * FT) / 2), (FIELD.rows - VIEW_ROWS) * FT);
    this.camera = instant || this.camera === null ? wanted : this.camera + (wanted - this.camera) * 0.12;
    return Math.round(this.camera);
  }

  render(ctx, options) {
    const world = this.world;
    const top = this.follow(options.instant);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(0, -top);
    const ground = fieldImage(options.variant === 'baked' ? 'baked.png' : 'ground.png');
    if (ground && ground.width) ctx.drawImage(ground, 0, 0);
    // The castle's door, opening onto the dark inside.
    if (world.open.door > 0) {
      const [x0, y0, x1, y1] = FIELD.door.box.map((v) => v * FT);
      ctx.save();
      ctx.globalAlpha = world.open.door;
      ctx.fillStyle = '#05050a';
      ctx.beginPath();
      const r = (x1 - x0) / 2;
      ctx.moveTo(x0, y1);
      ctx.lineTo(x0, y0 + r);
      ctx.arc(x0 + r, y0 + r, r, Math.PI, 0);
      ctx.lineTo(x1, y1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    const items = [];
    for (const layer of FIELD.layers) {
      const img = fieldImage(layer.file);
      if (!img || !img.width) continue;
      let alpha = 1;
      if (layer.name === 'gate') alpha = 1 - world.open.gate;
      if (layer.name === 'seal') alpha = 1 - world.open.seal;
      if (layer.name === 'wand' && world.carried) alpha = 0;
      if (alpha <= 0) continue;
      items.push({
        key: layer.row + 1,
        layer: 0,
        draw: () => {
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, layer.at[0], layer.at[1]);
          ctx.globalAlpha = 1;
        },
      });
      // The rune's glow, fading as the seal breaks.
      if (layer.name === 'seal' && world.open.seal === 0) {
        items.push({
          key: layer.row + 1.01,
          layer: 1,
          draw: () => {
            const cx = 8.55 * FT;
            const cy = 11.35 * FT;
            const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, FT * 0.7);
            g.addColorStop(0, `rgba(120,200,255,${0.45 * (0.8 + 0.2 * Math.sin(world.time * 4))})`);
            g.addColorStop(1, 'rgba(120,200,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(cx - FT, cy - FT, 2 * FT, 2 * FT);
          },
        });
      }
    }
    const figures = [
      { fig: world.wizard, set: options.wizard === 'pixellab' ? 'pl-wizard' : 'wizard' },
      { fig: world.friend, set: 'nuri' },
    ];
    for (const { fig, set } of figures) {
      const [fx, fy] = figurePos(fig);
      const cx = fx * FT + FT / 2;
      const feet = (fy + 1) * FT - 8;
      fig.screen = [cx, feet - 26];
      if (fig.alpha <= 0) continue;
      items.push({
        key: fy + 1 - 8 / FT,
        layer: 3,
        draw: () => {
          ctx.save();
          ctx.globalAlpha = fig.alpha * (1 - world.fade);
          ctx.fillStyle = 'rgba(20,20,30,0.28)';
          ctx.beginPath();
          ctx.ellipse(cx, feet - 1, 19, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          drawSprite(ctx, `${set}-${fig.facing}-${frameOf(fig)}`, cx, feet, {
            scale: FIGURE_SCALE,
            crisp: set === 'pl-wizard',
          });
          ctx.restore();
        },
      });
    }
    items.sort((a, b) => a.key - b.key || a.layer - b.layer);
    for (const item of items) item.draw();
    for (const e of world.effects) {
      const cx = e.x * FT + FT / 2;
      const cy = (e.y + 1) * FT - 44;
      if (e.kind === 'ring') {
        const p = e.age / e.life;
        ctx.strokeStyle = `rgba(255,240,170,${1 - p})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + p * 60, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.kind === 'lift') {
        const img = fieldImage('wand.png');
        const layer = FIELD.layers.find((l) => l.name === 'wand');
        if (img && layer) {
          ctx.globalAlpha = 1 - e.age / e.life;
          ctx.drawImage(img, layer.at[0] - 20, layer.at[1] - (e.age / e.life) * 40);
          ctx.globalAlpha = 1;
        }
      }
    }
    if (options.grid && options.variant !== 'baked') {
      // The pencil breathes: its opacity goes slowly from 0.10 to 0.20 and back.
      ctx.globalAlpha = 0.15 + 0.05 * Math.sin((world.time * 2 * Math.PI) / 3.5);
      ctx.drawImage(this.grid, 0, 0);
      ctx.globalAlpha = 1;
    }
    if (world.bubble) drawBubble(ctx, { bubble: world.bubble, wizard: world.wizard, actors: {} });
    ctx.restore();
    // The level being played, in the corner.
    const level = world.current;
    if (level) {
      ctx.font = 'bold 22px system-ui, sans-serif';
      const w = ctx.measureText(level.title).width + 28;
      ctx.fillStyle = 'rgba(255,253,246,0.92)';
      ctx.strokeStyle = '#2a2430';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(14, 14, w, 40, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22252e';
      ctx.fillText(level.title, 28, 41);
    }
  }
}
