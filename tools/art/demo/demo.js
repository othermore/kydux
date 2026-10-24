// Kydux's art demo (D72): the game's real scenes drawn from painted pieces,
// and a story played on them. Every tall piece and every figure is drawn in
// the order of the row its base stands on, so that what is in front hides what
// is behind: a wall's top rises half a tile over the tile behind it, where the
// feet of a figure standing there are. The animation is a pure function of
// time, so that ?t=12 shows the same frame every time (for the screenshots).
'use strict';

const T = 48;
const R = 24;
const STEP = 0.3;
const DATA = window.KYDUX_DEMO;
const IMG = {};

const THEMES = {
  'the-gate': { floor: 'court', face: 'face', top: 'walltop', night: false },
  'the-library': { floor: 'planks', face: 'face-sand', top: 'walltop', night: false },
  'the-night-passages': { floor: 'floor-night', face: 'face-night', top: 'walltop', night: true },
};

const LABELS = {
  'the-field': 'Capítulo 1: el campo, una pintura',
  'the-gate': 'Capítulo 1: la puerta',
  'the-library': 'Capítulo 2: la biblioteca',
  'the-night-passages': 'Capítulo 3: los pasadizos',
};

const NOTES = {
  'the-field':
    'Una sola pintura de Gemini, hecha primero; el mapa sale de ella. Lo que se levanta (árboles, rocas, vallas, muros, las verjas) va recortado con transparencia y se dibuja por filas con las figuras, así que quien pasa por detrás queda tapado. La cámara sigue al mago. Se juegan los nueve niveles del capítulo 1 propuestos sobre esta escena. La rejilla es un trazo de lápiz que respira; el botón Rejilla la quita.',
  'the-gate':
    'Las soluciones de los niveles del capítulo 1, una tras otra: la contraseña abre la verja, la varita se recoge de la piedra y *zelim* rompe tres sellos. Nuri sigue al mago. Dentro de la entrada, el muro de delante tapa los pies: la profundidad sale del orden en que se dibujan las filas.',
  'the-library':
    'El nivel del libro perdido: el mago sube hasta el libro, pasa por detrás de las estanterías y se lo da a Eldra.',
  'the-night-passages':
    'De noche. Dask hace su ronda, la escalera aparece y desaparece, y la habitación oscura se ilumina con *kirra*.',
};

function loadImages() {
  return Promise.all(
    DATA.pieces.map(
      (name) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = `pieces/${name}.png`;
          IMG[name] = img;
        }),
    ),
  ).then(() =>
    Promise.all([
      loadField(),
      ...Object.entries(DATA.paintings).map(
        ([id, file]) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = file;
            IMG[`painting:${id}`] = img;
          }),
      ),
    ]),
  );
}

function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// ---------------------------------------------------------------- the scene

class Scene {
  constructor(data) {
    this.data = data;
    this.rows = data.rows;
    this.height = this.rows.length;
    this.width = this.rows[0].length;
    this.theme = THEMES[data.id];
  }
  kind(x, y) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return 'wall';
    return this.data.terrains[this.rows[y][x]].kind;
  }
  isWall(x, y) {
    return this.kind(x, y) === 'wall';
  }
  get pixels() {
    return [this.width * T, this.height * T + R];
  }
}

// ---------------------------------------------------------------- the ground, baked once

function pattern(ctx, name) {
  return IMG[name] && IMG[name].width ? ctx.createPattern(IMG[name], 'repeat') : '#888';
}

function bakeGround(scene) {
  const [w, h] = scene.pixels;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const outdoor = scene.data.id === 'the-gate';
  ctx.fillStyle = pattern(ctx, outdoor ? 'grass' : scene.theme.floor);
  ctx.fillRect(0, 0, w, h);
  // The floors of the passages, and in the garden the floor of the gatehouse.
  ctx.fillStyle = pattern(ctx, scene.theme.floor);
  for (let y = 0; y < scene.height; y += 1) {
    for (let x = 0; x < scene.width; x += 1) {
      const kind = scene.kind(x, y);
      if (outdoor && kind === 'floor') ctx.fillRect(x * T, R + y * T, T, T);
    }
  }
  // The path: its cells blurred into one soft shape, a dark edge round it.
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const m = mask.getContext('2d');
  m.fillStyle = '#fff';
  for (let y = 0; y < scene.height; y += 1) {
    for (let x = 0; x < scene.width; x += 1) {
      if (scene.kind(x, y) === 'path') m.fillRect(x * T + 3, R + y * T + 3, T - 6, T - 6);
    }
  }
  const soft = document.createElement('canvas');
  soft.width = w;
  soft.height = h;
  const s = soft.getContext('2d');
  s.filter = 'blur(7px)';
  s.drawImage(mask, 0, 0);
  const pixels = s.getImageData(0, 0, w, h);
  for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] > 110 ? 255 : 0;
  s.putImageData(pixels, 0, 0);
  const layer = (fill, grow) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = fill;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    for (const [dx, dy] of grow) g.drawImage(soft, dx, dy);
    return c;
  };
  const ring = [];
  for (let a = 0; a < 8; a += 1) ring.push([Math.round(3 * Math.cos(a)), Math.round(3 * Math.sin(a))]);
  ctx.drawImage(layer('#5b3a22', [[0, 0], ...ring]), 0, 0);
  ctx.drawImage(layer(pattern(ctx, 'dirt'), [[0, 0]]), 0, 0);
  // The shade at the foot of every wall, and the grass's small life.
  for (let y = 0; y < scene.height; y += 1) {
    for (let x = 0; x < scene.width; x += 1) {
      if (scene.isWall(x, y) && !scene.isWall(x, y + 1)) {
        const g = ctx.createLinearGradient(0, R + (y + 1) * T, 0, R + (y + 1) * T + 14);
        g.addColorStop(0, 'rgba(20,20,40,0.35)');
        g.addColorStop(1, 'rgba(20,20,40,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x * T, R + (y + 1) * T, T, 14);
      }
    }
  }
  if (outdoor) {
    const rnd = random(11);
    const decals = ['tuft', 'tuft', 'flowers-r', 'flowers-y', 'flowers-b', 'plant'];
    for (let y = 0; y < scene.height; y += 1) {
      for (let x = 0; x < scene.width; x += 1) {
        if (scene.kind(x, y) !== 'grass' || rnd() > 0.28) continue;
        const name = decals[Math.floor(rnd() * decals.length)];
        const img = IMG[name];
        if (!img || !img.width) continue;
        ctx.drawImage(img, x * T + 6 + rnd() * (T - 12 - img.width), R + y * T + 8 + rnd() * (T - 16 - img.height));
      }
    }
  }
  return canvas;
}

// ---------------------------------------------------------------- what stands up

/** A wall with only walls round it: the inside of a mass, drawn dark. */
function isDeep(scene, x, y) {
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (!scene.isWall(x + dx, y + dy)) return false;
  return true;
}

function drawWall(ctx, scene, x, y) {
  // The scene's edge has no wall beyond it: the last row shows its face.
  const south = y + 1 < scene.height && scene.isWall(x, y + 1);
  if (isDeep(scene, x, y) && south) {
    ctx.fillStyle = '#22262f';
    ctx.fillRect(x * T, y * T, T, T);
    return;
  }
  ctx.fillStyle = pattern(ctx, scene.theme.top);
  ctx.fillRect(x * T, y * T, T, T);
  // Each tile of a wall's top is one capstone, its joints drawn dark.
  ctx.strokeStyle = 'rgba(50,40,55,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * T + 1.5, y * T + 1.5, T - 3, T - 3);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x * T + 3, y * T + 3, T - 6, 4);
  if (!south) {
    ctx.fillStyle = pattern(ctx, scene.theme.face);
    ctx.fillRect(x * T, (y + 1) * T, T, R);
    const g = ctx.createLinearGradient(0, (y + 1) * T, 0, (y + 1) * T + R);
    g.addColorStop(0, 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(30,15,10,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(x * T, (y + 1) * T, T, R);
    ctx.fillStyle = 'rgba(70,40,30,0.75)';
    ctx.fillRect(x * T, (y + 1) * T + R - 5, T, 5);
    ctx.fillStyle = 'rgba(255,255,240,0.35)';
    ctx.fillRect(x * T, (y + 1) * T - 4, T, 3);
  }
  ctx.strokeStyle = '#2a2430';
  ctx.lineCap = 'round';
  const line = (x0, y0, x1, y1, width) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  const bottom = south ? (y + 1) * T : (y + 1) * T + R;
  if (!scene.isWall(x, y - 1)) line(x * T, y * T + 1, (x + 1) * T, y * T + 1, 3);
  if (!scene.isWall(x - 1, y)) line(x * T + 1, y * T, x * T + 1, bottom, 3);
  if (!scene.isWall(x + 1, y)) line((x + 1) * T - 1, y * T, (x + 1) * T - 1, bottom, 3);
  if (!south) {
    line(x * T, (y + 1) * T, (x + 1) * T, (y + 1) * T, 2);
    line(x * T, bottom - 1, (x + 1) * T, bottom - 1, 3);
  }
}

function drawSprite(ctx, name, cx, base, options = {}) {
  const img = IMG[name];
  if (!img || !img.width) return;
  const scale = options.scale ?? 1;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  if (options.alpha !== undefined) ctx.globalAlpha = options.alpha;
  if (options.crisp) ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, cx - w / 2, base - h + (options.lift ?? 0), w, h);
  ctx.restore();
}

function drawFence(ctx, scene, x, y) {
  const base = R + (y + 1) * T - 6;
  const across = scene.kind(x - 1, y) === 'fence' || scene.kind(x + 1, y) === 'fence';
  if (across || !(scene.kind(x, y - 1) === 'fence' || scene.kind(x, y + 1) === 'fence')) {
    drawSprite(ctx, 'fence', x * T + T / 2, base, { scale: T / 46 });
    return;
  }
  // A fence going up the scene: its rails seen end-on, from post to post.
  if (scene.kind(x, y - 1) === 'fence') {
    ctx.fillStyle = '#8a5a32';
    ctx.strokeStyle = '#3d2614';
    ctx.lineWidth = 2;
    for (const dx of [-3, 3]) {
      ctx.fillRect(x * T + T / 2 + dx - 2, base - T - 22, 4, T + 4);
      ctx.strokeRect(x * T + T / 2 + dx - 2, base - T - 22, 4, T + 4);
    }
  }
  drawSprite(ctx, 'post', x * T + T / 2, base);
}

// ---------------------------------------------------------------- the stories

const DIRS = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };

function scriptFor(id) {
  if (id === 'the-gate') {
    return {
      wizard: [5, 6, 'right'],
      friend: ['nuri', 4, 6],
      actions: [
        { wait: 0.6 },
        { walk: 'right', n: 7 },
        { say: 'ambrel', italic: true },
        { open: 'gate' },
        { wait: 0.4 },
        { walk: 'right', n: 5 },
        { pick: 'wand' },
        { walk: 'right', n: 5 },
        { cast: 'zelim', target: 'door' },
        { walk: 'right', n: 3 },
        { walk: 'up', n: 1 },
        { say: 'ambrel', italic: true },
        { open: 'inner_gate' },
        { walk: 'up', n: 2 },
        { walk: 'left', n: 3 },
        { cast: 'zelim', target: 'first_seal' },
        { walk: 'left', n: 4 },
        { face: 'up' },
        { cast: 'zelim', target: 'second_seal' },
        { walk: 'up', n: 2 },
        { wait: 2.5 },
      ],
    };
  }
  if (id === 'the-library') {
    return {
      wizard: [8, 6, 'right'],
      friend: null,
      actions: [
        { wait: 0.6 },
        { walk: 'right', n: 2 },
        { walk: 'up', n: 2 },
        { pick: 'old_book' },
        { walk: 'down', n: 2 },
        { walk: 'right', n: 2 },
        { give: 'old_book', to: 'eldra' },
        { say: '¡Gracias!', who: 'eldra' },
        { wait: 2.5 },
      ],
    };
  }
  return {
    wizard: [2, 6, 'up'],
    friend: ['nuri', 2, 7],
    actions: [
      { wait: 0.4 },
      { until: (world) => world.actors.dask.facing === 'right' && world.actors.dask.x > 4 },
      { walk: 'up', n: 2 },
      { walk: 'up', n: 2 },
      { walk: 'right', n: 1 },
      { until: (world) => world.stairIn },
      { walk: 'right', n: 4 },
      { cast: 'kirra', light: 'dark-room' },
      { walk: 'right', n: 4 },
      { walk: 'down', n: 1 },
      { pick: 'key' },
      { walk: 'left', n: 1 },
      { face: 'down' },
      { open: 'door' },
      { walk: 'down', n: 2 },
      { wait: 2.5 },
    ],
  };
}

class World {
  constructor(scene) {
    this.scene = scene;
    this.script = scriptFor(scene.data.id);
    this.time = 0;
    this.index = 0;
    this.actionTime = 0;
    this.effects = [];
    this.bubble = null;
    this.lit = new Set();
    this.stairIn = true;
    const [wx, wy, wf] = this.script.wizard;
    this.wizard = { x: wx, y: wy, facing: wf, from: null, to: null, t: 0, walked: 0 };
    this.friend = null;
    if (this.script.friend) {
      const [, fx, fy] = this.script.friend;
      this.friend = { x: fx, y: fy, facing: 'right', from: null, to: null, t: 0, walked: 0 };
    }
    this.things = {};
    for (const t of scene.data.things) {
      this.things[t.id] = { ...t, open: t.open === true, glow: t.sealed ? 1 : 0, carried: false, given: null };
    }
    if (scene.data.id === 'the-gate') {
      this.things.wand = { id: 'wand', kind: 'wand', at: [17, 6], carried: false };
    }
    this.actors = {};
    for (const a of scene.data.actors) {
      if (a.kind === 'friend' && a.id === 'nuri') continue;
      this.actors[a.id] = {
        ...a,
        x: a.at[0],
        y: a.at[1],
        facing: a.facing ?? 'down',
        from: null,
        to: null,
        t: 0,
        walked: 0,
        home: [...a.at],
        goal: a.patrol ? a.patrol[0] : null,
      };
    }
  }

  stepFigure(fig, dt) {
    if (!fig.to) return;
    fig.t += dt / STEP;
    fig.walked += dt;
    if (fig.t >= 1) {
      fig.x = fig.to[0];
      fig.y = fig.to[1];
      fig.from = fig.to = null;
      fig.t = 0;
    }
  }

  startStep(fig, dir) {
    const [dx, dy] = DIRS[dir];
    fig.facing = dir;
    fig.from = [fig.x, fig.y];
    fig.to = [fig.x + dx, fig.y + dy];
    fig.t = 0;
  }

  update(dt) {
    this.time += dt;
    this.stepFigure(this.wizard, dt);
    if (this.friend) this.stepFigure(this.friend, dt);
    for (const a of Object.values(this.actors)) this.stepFigure(a, dt);
    // Dask walks his round; the stair comes and goes.
    const dask = this.actors.dask;
    if (dask && dask.patrol && !dask.to) {
      const goal = dask.goal;
      if (dask.x === goal[0] && dask.y === goal[1]) {
        dask.goal = goal === dask.home ? dask.patrol[0] : dask.home;
        dask.pause = 0.8;
      } else if ((dask.pause = (dask.pause ?? 0) - dt) <= 0) {
        this.startStep(dask, goal[0] < dask.x ? 'left' : 'right');
      }
    }
    this.stairIn = Math.floor(this.time / 1.2) % 2 === 0;
    for (const e of this.effects) e.age += dt;
    this.effects = this.effects.filter((e) => e.age < e.life);
    for (const t of Object.values(this.things)) {
      if (t.fading) {
        t.glow = Math.max(0, t.glow - dt / 0.9);
        if (t.glow === 0) {
          t.fading = false;
          t.open = true;
        }
      }
      if (t.given) {
        t.given.t = Math.min(1, t.given.t + dt / 0.6);
      }
    }
    if (this.bubble && (this.bubble.left -= dt) <= 0) this.bubble = null;
    this.act(dt);
  }

  act(dt) {
    const action = this.script.actions[this.index];
    if (!action) {
      this.done = true;
      return;
    }
    this.actionTime += dt;
    const next = () => {
      this.index += 1;
      this.actionTime = 0;
      this.stepsLeft = undefined;
    };
    const wiz = this.wizard;
    if (action.wait !== undefined) {
      if (this.actionTime >= action.wait) next();
    } else if (action.until) {
      if (action.until(this)) next();
    } else if (action.walk) {
      if (wiz.to) return;
      if (this.stepsLeft === undefined) this.stepsLeft = action.n;
      if (this.stepsLeft === 0) {
        next();
        return;
      }
      const behind = [wiz.x, wiz.y];
      this.startStep(wiz, action.walk);
      this.stepsLeft -= 1;
      // The friend follows into the tile the wizard leaves.
      const f = this.friend;
      if (f && !f.to && (f.x !== behind[0] || f.y !== behind[1])) {
        const dir = behind[0] > f.x ? 'right' : behind[0] < f.x ? 'left' : behind[1] > f.y ? 'down' : 'up';
        this.startStep(f, dir);
      }
    } else if (action.face) {
      wiz.facing = action.face;
      next();
    } else if (action.say) {
      if (this.actionTime < dt * 1.5) {
        this.bubble = { text: action.say, who: action.who ?? 'wizard', italic: action.italic, left: 1.6 };
      }
      if (this.actionTime >= 1.2) next();
    } else if (action.open) {
      const t = this.things[action.open];
      if (t) t.open = true;
      next();
    } else if (action.pick) {
      if (this.actionTime < dt * 1.5) {
        const t = this.things[action.pick];
        if (t) t.carried = true;
        this.effects.push({ kind: 'lift', thing: action.pick, x: wiz.x, y: wiz.y, age: 0, life: 0.6 });
      }
      if (this.actionTime >= 0.6) next();
    } else if (action.give) {
      if (this.actionTime < dt * 1.5) {
        const t = this.things[action.give];
        const to = this.actors[action.to];
        if (t && to) t.given = { from: [wiz.x, wiz.y], to: [to.x, to.y], t: 0 };
      }
      if (this.actionTime >= 0.7) next();
    } else if (action.cast) {
      if (this.actionTime < dt * 1.5) {
        this.bubble = { text: `${action.cast}`, who: 'wizard', italic: true, left: 1.4 };
        this.effects.push({ kind: 'ring', x: wiz.x, y: wiz.y, age: 0, life: 0.8 });
        const t = action.target && this.things[action.target];
        if (t) t.fading = true;
        if (action.light) this.lit.add(action.light);
      }
      if (this.actionTime >= 1.3) next();
    }
  }
}

function figurePos(fig) {
  if (!fig.to) return [fig.x, fig.y];
  return [fig.from[0] + (fig.to[0] - fig.from[0]) * fig.t, fig.from[1] + (fig.to[1] - fig.from[1]) * fig.t];
}

function frameOf(fig) {
  if (!fig.to) return 1;
  return [0, 1, 2, 1][Math.floor(fig.walked / (STEP / 2)) % 4];
}

// ---------------------------------------------------------------- drawing a frame

const view = {
  scene: 'the-gate',
  variant: 'pieces',
  wizard: 'gemini',
  grid: false,
  playing: true,
};

function render(ctx, scene, world, ground) {
  const [w, h] = scene.pixels;
  ctx.clearRect(0, 0, w, h);
  const painting = view.variant === 'painted' ? IMG[`painting:${scene.data.id}`] : null;
  ctx.drawImage(painting && painting.width ? painting : ground, 0, 0);

  const items = [];
  const add = (key, layer, draw) => items.push({ key, layer, draw });
  for (let y = 0; y < scene.height; y += 1) {
    for (let x = 0; x < scene.width; x += 1) {
      const kind = scene.kind(x, y);
      if (painting) {
        // The painting's own wall, hedge or fence, cut by its cell and drawn again
        // in its row, over whatever stands behind it.
        if (kind === 'wall' || kind === 'hedge') {
          add(y + 1, 0, () => ctx.drawImage(painting, x * T, y * T, T, T + R, x * T, y * T, T, T + R));
        } else if (kind === 'fence') {
          add(y + 0.9, 1, () => ctx.drawImage(painting, x * T, R + y * T - 8, T, T + 8, x * T, R + y * T - 8, T, T + 8));
        }
        continue;
      }
      if (kind === 'wall') add(y + 1, 0, () => drawWall(ctx, scene, x, y));
      else if (kind === 'hedge') {
        const name = ['bush-1', 'bush-2', 'bush-3'][(x * 7 + y * 3) % 3];
        add(y + 0.9, 1, () => drawSprite(ctx, name, x * T + T / 2, R + (y + 1) * T + 2, { scale: 1.05 }));
      } else if (kind === 'fence') add(y + 0.9, 1, () => drawFence(ctx, scene, x, y));
      else if (kind === 'shelf') add(y + 0.95, 1, () => drawSprite(ctx, 'shelf', x * T + T / 2, R + (y + 1) * T + 2, { scale: 0.86 }));
    }
  }
  if (!painting) {
    for (const prop of scene.data.props) {
      add(prop.at[1] + 0.2, -1, () => drawSprite(ctx, 'stone', prop.at[0] * T + T / 2, R + (prop.at[1] + 1) * T - 8, { scale: 0.75 }));
    }
  }
  // The things: doors and gates stand in their tile, the rest lies on the floor.
  for (const t of Object.values(world.things)) {
    const [x, y] = t.at;
    const cx = x * T + T / 2;
    const base = R + (y + 1) * T - 2;
    if (t.kind === 'door') {
      const gate = typeof t.password === 'string';
      add(y + 0.5, 2, () => {
        drawSprite(ctx, gate ? (t.open ? 'gate-open' : 'gate') : t.open ? 'door-open' : 'door-sealed', cx, base, {
          scale: gate ? 0.95 : 0.85,
        });
        if (t.sealed && !t.open && t.glow > 0) {
          const g = ctx.createRadialGradient(cx, base - 30, 2, cx, base - 30, 30);
          g.addColorStop(0, `rgba(120,200,255,${0.55 * t.glow})`);
          g.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - 32, base - 62, 64, 64);
        }
      });
    } else if (t.kind === 'stair') {
      add(y + 0.3, -1, () => drawSprite(ctx, 'stair', cx, base - 6 + Math.sin(world.time * 3) * 2, { alpha: world.stairIn ? 1 : 0.15 }));
    } else if (!t.carried) {
      const name = t.kind === 'wand' ? 'wand' : t.kind === 'key' ? 'key' : 'book';
      if (t.given) {
        const p = t.given.t;
        const gx = (t.given.from[0] + (t.given.to[0] - t.given.from[0]) * p) * T + T / 2;
        const gy = R + (t.given.from[1] + 0.6) * T - Math.sin(p * Math.PI) * 30;
        if (p < 1) add(99, 5, () => drawSprite(ctx, name, gx, gy, { alpha: 1 - p * 0.6 }));
      } else {
        add(y + 0.3, -1, () => drawSprite(ctx, name, cx, base - 10, { scale: name === 'wand' ? 0.9 : 1 }));
      }
    }
  }
  // The figures, by where their feet are.
  const figures = [{ fig: world.wizard, set: view.wizard === 'pixellab' ? 'pl-wizard' : 'wizard' }];
  if (world.friend) figures.push({ fig: world.friend, set: 'nuri' });
  for (const [id, a] of Object.entries(world.actors)) figures.push({ fig: a, set: id });
  for (const { fig, set } of figures) {
    const [fx, fy] = figurePos(fig);
    const cx = fx * T + T / 2;
    const feet = R + (fy + 1) * T - 6;
    add(fy + 1 - 6 / T, 3, () => {
      ctx.fillStyle = 'rgba(20,20,30,0.28)';
      ctx.beginPath();
      ctx.ellipse(cx, feet - 1, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      const ghost = set === 'eldra';
      const bob = ghost ? Math.sin(world.time * 2.5) * 3 - 4 : 0;
      drawSprite(ctx, `${set}-${fig.facing}-${frameOf(fig)}`, cx, feet + bob, {
        crisp: set === 'pl-wizard',
        alpha: ghost ? 0.85 : 1,
      });
    });
    fig.screen = [cx, feet];
  }
  items.sort((a, b) => a.key - b.key || a.layer - b.layer);
  for (const item of items) item.draw();

  // Effects over everything: a spell's ring, a thing lifted.
  for (const e of world.effects) {
    const cx = e.x * T + T / 2;
    const cy = R + (e.y + 1) * T - 34;
    if (e.kind === 'ring') {
      const p = e.age / e.life;
      ctx.strokeStyle = `rgba(255,240,170,${1 - p})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 + p * 46, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === 'lift') {
      const t = world.things[e.thing];
      const name = t && t.kind === 'wand' ? 'wand' : t && t.kind === 'key' ? 'key' : 'book';
      drawSprite(ctx, name, cx, cy - (e.age / e.life) * 26, { alpha: 1 - e.age / e.life });
    }
  }
  if (scene.theme.night) drawNight(ctx, scene, world);
  if (world.bubble) drawBubble(ctx, world);
  if (view.grid) drawGrid(ctx, scene);
}

function drawNight(ctx, scene, world) {
  const [w, h] = scene.pixels;
  const dark = document.createElement('canvas');
  dark.width = w;
  dark.height = h;
  const d = dark.getContext('2d');
  d.fillStyle = 'rgba(12,16,48,0.52)';
  d.fillRect(0, 0, w, h);
  // A dark room is darker still until it is lit.
  for (const [id, box] of Object.entries(scene.data.rooms)) {
    if (world.lit.has(id) || id !== 'dark-room') continue;
    const [x0, y0, x1, y1] = box;
    d.fillStyle = 'rgba(4,6,18,0.85)';
    d.fillRect(x0 * T, R + y0 * T - R, (x1 - x0 + 1) * T, (y1 - y0 + 1) * T + R);
  }
  d.globalCompositeOperation = 'destination-out';
  const [cx, feet] = world.wizard.screen ?? [0, 0];
  const g = d.createRadialGradient(cx, feet - 20, 10, cx, feet - 20, 90);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  d.fillStyle = g;
  d.fillRect(cx - 100, feet - 120, 200, 200);
  ctx.drawImage(dark, 0, 0);
}

function drawBubble(ctx, world) {
  const b = world.bubble;
  const who = b.who === 'wizard' ? world.wizard : world.actors[b.who];
  if (!who || !who.screen) return;
  const [cx, feet] = who.screen;
  ctx.font = `${b.italic ? 'italic ' : ''}bold 17px system-ui, sans-serif`;
  const w = ctx.measureText(b.text).width + 22;
  const x = cx - w / 2;
  const y = feet - 112;
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = '#2a2430';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 32, 12);
  ctx.moveTo(cx - 7, y + 32);
  ctx.lineTo(cx, y + 44);
  ctx.lineTo(cx + 7, y + 32);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(cx - 6, y + 29, 12, 5);
  ctx.fillStyle = '#22252e';
  ctx.fillText(b.text, x + 11, y + 22);
}

function drawGrid(ctx, scene) {
  for (let y = 0; y < scene.height; y += 1) {
    for (let x = 0; x < scene.width; x += 1) {
      const walk = scene.data.terrains[scene.rows[y][x]].walk;
      if (!walk) {
        ctx.fillStyle = 'rgba(220,40,40,0.22)';
        ctx.fillRect(x * T, R + y * T, T, T);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * T + 0.5, R + y * T + 0.5, T - 1, T - 1);
    }
  }
}

// ---------------------------------------------------------------- the page

const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
let scene = null;
let world = null;
let ground = null;
let last = null;
/** The field painted first, when it is the scene shown. */
let field = null;

function choose(sceneId) {
  view.scene = sceneId;
  field = null;
  if (sceneId === 'the-field') {
    field = new FieldView(canvas);
    if (!['painted', 'baked'].includes(view.variant)) view.variant = 'painted';
    document.getElementById('note').innerHTML = NOTES[sceneId];
    buttons();
    return;
  }
  scene = new Scene(DATA.scenes[sceneId]);
  if (!DATA.paintings[sceneId]) view.variant = 'pieces';
  [canvas.width, canvas.height] = scene.pixels;
  ground = bakeGround(scene);
  world = new World(scene);
  document.getElementById('note').innerHTML = NOTES[sceneId].replace(/\*(\w+)\*/g, '<em>$1</em>');
  buttons();
}

/** The world as it is `seconds` after the start, stepped as the page steps it. */
function seek(seconds) {
  if (field) {
    field.restart();
    for (let t = 0; t < seconds; t += 1 / 60) field.update(1 / 60);
    return;
  }
  world = new World(scene);
  for (let t = 0; t < seconds; t += 1 / 60) world.update(1 / 60);
}

function buttons() {
  const make = (box, entries, current, pick) => {
    const holder = document.getElementById(box);
    holder.querySelectorAll('button').forEach((b) => b.remove());
    for (const [value, label, enabled = true] of entries) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.disabled = !enabled;
      b.setAttribute('aria-pressed', String(value === current));
      b.addEventListener('click', () => pick(value));
      holder.append(b);
    }
  };
  const ids = [...(DATA.field ? ['the-field'] : []), ...Object.keys(DATA.scenes)];
  make('scenes', ids.map((id) => [id, LABELS[id]]), view.scene, (id) => choose(id));
  make(
    'variants',
    field
      ? [
          ['painted', 'Pintura y lápiz'],
          ['baked', 'Rejilla de Gemini'],
        ]
      : [
          ['pieces', 'Piezas'],
          ['painted', 'Una pintura', Boolean(DATA.paintings[view.scene])],
        ],
    view.variant,
    (v) => {
      view.variant = v;
      buttons();
    },
  );
  make(
    'wizards',
    [
      ['gemini', 'Gemini'],
      ['pixellab', 'PixelLab'],
    ],
    view.wizard,
    (v) => {
      view.wizard = v;
      buttons();
    },
  );
  document.getElementById('grid').setAttribute('aria-pressed', String(view.grid));
  document.getElementById('play').textContent = view.playing ? 'Pausa' : 'Seguir';
}

document.getElementById('play').addEventListener('click', () => {
  view.playing = !view.playing;
  buttons();
});
document.getElementById('restart').addEventListener('click', () => {
  if (field) field.restart();
  else world = new World(scene);
});
document.getElementById('grid').addEventListener('click', () => {
  view.grid = !view.grid;
  buttons();
});

function frame(now) {
  const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
  last = now;
  if (field) {
    if (view.playing) field.update(dt);
    field.render(ctx, { variant: view.variant, wizard: view.wizard, grid: view.grid });
    requestAnimationFrame(frame);
    return;
  }
  if (view.playing) {
    world.update(dt);
    if (world.done) world = new World(scene);
  }
  render(ctx, scene, world, ground);
  requestAnimationFrame(frame);
}

loadImages().then(() => {
  const params = new URLSearchParams(location.search);
  view.variant = params.get('variant') ?? view.variant;
  view.wizard = params.get('wizard') ?? view.wizard;
  const first = params.get('scene') ?? (DATA.field ? 'the-field' : 'the-gate');
  // The field's pencil grid is on unless the address turns it off.
  view.grid = params.has('grid') ? params.get('grid') === '1' : first === 'the-field';
  choose(first);
  if (params.has('t')) {
    view.playing = false;
    seek(Number(params.get('t')));
    if (field) field.render(ctx, { variant: view.variant, wizard: view.wizard, grid: view.grid, instant: true });
    buttons();
  }
  document.body.dataset.ready = 'true';
  requestAnimationFrame(frame);
});
