import { describe, expect, it } from 'vitest';
import { FOOT_IN_CELL, figureDepth, thingDepth } from './depth';
import {
  FLY_LIFT,
  flownTick,
  flyFrame,
  type Glide,
  glideAt,
  glideBegins,
  glideMost,
  glideOver,
  glideTo,
  HOVER_CELLS,
  HOVER_MS,
  hoverOf,
  hoverPhase,
  LIFT_MS,
  riseOf,
  RING_PAST,
  RING_RAISE,
  throughRing,
  turned,
} from './flight';
import { FLOWN, flownRun, LONG, lengthOf, Playback, type PlaybackEvent } from './playback';
import { spriteFoot, spriteScale, type ThingSprite } from './things';
import { TILE } from './placeholders';

const move = (tick: number, flying: boolean, actor = 'wizard'): PlaybackEvent => ({
  tick,
  actor,
  kind: 'move',
  data: { from: [0, 0], to: [1, 0], facing: 'right', ...(flying ? { flying: true } : {}) },
  line: 1,
});

describe('flying (D185)', () => {
  it("draws a flying figure in its flying row's level frame, by the way it faces (D235, D241)", () => {
    // The wizards' flying rows start at 14, Zarek's at 4.
    expect((['down', 'left', 'right', 'up'] as const).map((way) => flyFrame(14, way))).toEqual([42, 45, 48, 51]);
    expect((['down', 'left', 'right', 'up'] as const).map((way) => flyFrame(4, way))).toEqual([12, 15, 18, 21]);
    expect(flyFrame(undefined, 'down')).toBeNull();
  });

  it('rises over LIFT_MS, eased at both ends and never falling (D244)', () => {
    expect(riseOf(0, LIFT_MS)).toBe(0);
    expect(riseOf(LIFT_MS, LIFT_MS)).toBe(1);
    expect(riseOf(LIFT_MS * 2, LIFT_MS)).toBe(1);
    expect(riseOf(LIFT_MS / 2, LIFT_MS)).toBeGreaterThan(0);
    expect(riseOf(LIFT_MS / 2, LIFT_MS)).toBeLessThan(1);
    const steps = Array.from({ length: 31 }, (_, i) => riseOf((i * LIFT_MS) / 30, LIFT_MS));
    expect(steps.every((rise, i) => i === 0 || rise >= (steps[i - 1] as number))).toBe(true);
    // Eased: slower at its ends than in its middle.
    expect(riseOf(LIFT_MS / 10, LIFT_MS)).toBeLessThan(0.1);
  });

  it('hovers slowly: up its whole a quarter of the way, back after a rise and fall (D235)', () => {
    const wizard = hoverPhase('wizard');
    expect(wizard).toBe(0);
    expect(hoverOf(0, wizard)).toBeCloseTo(0);
    expect(hoverOf(HOVER_MS / 4, wizard)).toBeCloseTo(HOVER_CELLS);
    expect(hoverOf((HOVER_MS * 3) / 4, wizard)).toBeCloseTo(-HOVER_CELLS);
    expect(hoverOf(HOVER_MS, wizard)).toBeCloseTo(0);
  });

  it('tells a turn: a flown move whose way is not the way of the one before, when there was one (D236)', () => {
    expect(turned(null, 'up')).toBe(false);
    expect(turned('up', 'up')).toBe(false);
    expect(turned('up', 'right')).toBe(true);
    expect(turned('right', 'down')).toBe(true);
  });

  it('gives every other figure a place of its own in the hover, so that two racers do not rise together', () => {
    expect(hoverPhase('zarek')).toBe(0.625);
    expect(hoverPhase('zarek')).not.toBe(hoverPhase('wizard'));
    expect(hoverOf(0, hoverPhase('zarek'))).not.toBeCloseTo(hoverOf(0, hoverPhase('wizard')));
  });

  it('plays a tick whose every move is flown in a third of a walked one, at every speed', () => {
    expect(flownTick([move(1, true), move(1, true, 'zarek')])).toBe(true);
    expect(flownTick([move(1, true), move(1, false, 'friend')])).toBe(false);
    expect(flownTick([{ ...move(1, false), kind: 'wait', data: {} }])).toBe(false);
    expect(lengthOf([move(1, true)])).toBe(FLOWN);
    expect(lengthOf([move(1, false)])).toBe(1);
    expect(lengthOf([{ ...move(1, false), kind: 'untie', data: {} }])).toBe(LONG);
  });

  it('plays every tick of a level where the wizard can fly in a third, the hands as anywhere (D225)', () => {
    expect(lengthOf([move(1, false)], FLOWN)).toBe(FLOWN);
    expect(lengthOf([], FLOWN)).toBe(FLOWN);
    expect(lengthOf([], 1)).toBe(1);
    expect(lengthOf([{ ...move(1, false), kind: 'cast', data: {} }], FLOWN)).toBe(LONG);
    let waited = 0;
    const playback = new Playback({
      tickMs: 300,
      pace: FLOWN,
      schedule: (_callback, ms) => {
        waited = ms;
        return null;
      },
    });
    playback.load([move(1, false), { ...move(2, false), kind: 'wait', data: {} }]);
    playback.play();
    expect(waited).toBeCloseTo(100);
    // A walked step's three ticks are all played, the two with no event too.
    playback.load([move(1, false), { ...move(4, true), data: { flying: true } }]);
    expect(playback.length).toBe(4);
  });

  it('plays what was found before the first tick with the first tick', () => {
    const playback = new Playback({ tickMs: 400, schedule: () => null });
    const seen: [number, string[]][] = [];
    playback.onTick((tick, events) => seen.push([tick, events.map((event) => event.kind)]));
    const found: PlaybackEvent = { tick: 0, actor: 'world', kind: 'found', data: { ids: ['broom_1'] }, line: 1 };
    playback.load([found, { ...move(1, false), kind: 'say', data: { text: '6' } }]);
    expect(playback.length).toBe(1);
    playback.play();
    expect(seen.at(-1)).toEqual([1, ['found', 'say']]);
  });
});

describe("things drawn from a sprite of their kind (D182)", () => {
  const ring: ThingSprite = { image: 'ring.webp', size: [1.75, 2], foot: [0.5, 1] };
  const broom: ThingSprite = { image: 'broom.webp', size: [1, 0.45], foot: [0.5, 0.75], lying: true };

  it('stands its foot on its cell, the ring on the lower edge and the broom lying on the floor', () => {
    expect(spriteFoot(ring, [5, 8])).toEqual([5.5 * TILE, 9 * TILE]);
    expect(spriteFoot(broom, [7, 8])).toEqual([7.5 * TILE, 8.75 * TILE]);
  });

  it("is scaled by the scene's cell, as a figure is, to its height in cells", () => {
    expect(spriteScale(ring, 200) * 200).toBeCloseTo(2 * TILE);
    expect(spriteScale(broom, 90) * 90).toBeCloseTo(0.45 * TILE);
  });
});

describe("a ring's cell flown through (D232)", () => {
  const rings: [number, number][] = [
    [5, 8],
    [7, 8],
  ];
  const feet = (x: number, y: number): [number, number] => [x + 0.5, y + FOOT_IN_CELL];

  it('draws the figure higher in the ring, its feet and broom above the lower rim', () => {
    const { raise } = throughRing(feet(5, 8), rings, 'up');
    expect(raise).toBe(RING_RAISE);
    // The ring's hole ends at the top of its cell: the figure's feet are drawn above it.
    expect(8 + FOOT_IN_CELL - FLY_LIFT - raise).toBeLessThan(8);
  });

  it('puts its feet past the ring the way it flew: up, behind the ring; down, in front', () => {
    const up = throughRing(feet(5, 8), rings, 'up');
    const down = throughRing(feet(7, 8), rings, 'down');
    expect(up.past).toBe(-RING_PAST);
    expect(down.past).toBe(RING_PAST);
    // The wizard is drawn a little over a figure at the same height (+0.0005).
    const ring = thingDepth(8);
    expect(figureDepth(8 + FOOT_IN_CELL + up.past) + 0.0005).toBeLessThan(ring);
    expect(figureDepth(8 + FOOT_IN_CELL + down.past)).toBeGreaterThan(ring);
  });

  it('climbs into the hole and out of it, with nothing a cell away or beside the ring', () => {
    for (const away of [feet(5, 9), feet(5, 7), feet(6, 8)]) {
      const { raise, past } = throughRing(away, rings, 'up');
      expect(raise).toBe(0);
      expect(Math.abs(past)).toBe(0);
    }
    const halfway = throughRing([5.5, 8.5 + FOOT_IN_CELL], rings, 'up');
    expect(halfway.raise).toBeCloseTo(RING_RAISE / 2);
    expect(halfway.past).toBeCloseTo(-RING_PAST / 2);
  });
});

describe('a flight glides (D259)', () => {
  /** A glide over four flown cells, right, right, up, right, a cell 32 pixels and a
   * step 100 ms, from tick 5. */
  const glide: Glide = {
    points: [
      { x: 0, y: 0, facing: 'right' },
      { x: 32, y: 0, facing: 'right' },
      { x: 64, y: 0, facing: 'right' },
      { x: 64, y: -32, facing: 'up' },
      { x: 96, y: -32, facing: 'right' },
    ],
    ends: [100, 200, 300, 400],
    tick: 5,
  };
  const path = (ms: number) => {
    const { x, y } = glideAt(glide, ms);
    return x - y;
  };

  it('crosses its cells on a straight line in time, with no flat part between them', () => {
    // The way gone, along the path, grows by the same length in the same time.
    for (let ms = 0; ms < 400; ms += 5) {
      expect(path(ms + 5) - path(ms)).toBeCloseTo(1.6, 6);
    }
    // At a cell it passes, it is neither held nor sped up.
    expect(glideAt(glide, 199)).toMatchObject({ to: 2, done: false });
    expect(glideAt(glide, 201)).toMatchObject({ to: 3, done: false });
    expect(path(201) - path(199)).toBeCloseTo(path(101) - path(99), 6);
  });

  it('faces the way it flies to its next cell, and ends on its last', () => {
    expect(glide.points[glideAt(glide, 250).to]?.facing).toBe('up');
    expect(glideAt(glide, 400)).toEqual({ x: 96, y: -32, to: 4, done: true });
    expect(glideAt(glide, 1000)).toEqual({ x: 96, y: -32, to: 4, done: true });
    expect(glideAt(glide, -20)).toMatchObject({ x: 0, y: 0, done: false });
  });

  it('cut at the tick shown, goes on to that tick\'s cell and stands there', () => {
    const cut = glideTo(glide, 6);
    expect(cut.points).toHaveLength(3);
    expect(cut.ends).toEqual([100, 200]);
    expect(glideAt(cut, 300)).toEqual({ x: 64, y: 0, to: 2, done: true });
    expect(glideTo(glide, 9)).toBe(glide);
  });

  it('has each step begin when the one before it ends, and is drawn no farther ahead of the tick shown than it is given', () => {
    expect([5, 6, 7, 8].map((tick) => glideBegins(glide, tick))).toEqual([0, 100, 200, 300]);
    // Given nothing ahead, it goes as far as the end of the step of the tick shown.
    expect([5, 7, 8].map((tick) => glideMost(glide, tick, 0))).toEqual([100, 300, 400]);
    // Given 250 ms, as far as that from the start of the step of the tick shown.
    expect([5, 7, 8].map((tick) => glideMost(glide, tick, 250))).toEqual([250, 450, 550]);
    // A page held up for a second in its first tick finds it on its third step, not at its end.
    expect(glideAt(glide, Math.min(1000, glideMost(glide, 5, 250)))).toMatchObject({ x: 64, y: -16, to: 3, done: false });
    // It is over at the tick of its last step, not before.
    expect([7, 8, 9].map((tick) => glideOver(glide, tick))).toEqual([false, true, true]);
  });

  it("reads a figure's run of flown steps ahead: on while it flies on, to a stand, a bump or a cast", () => {
    const step = (tick: number, from: number, to: number, actor = 'wizard'): PlaybackEvent => ({
      tick,
      actor,
      kind: 'move',
      data: { from: [from, 0], to: [to, 0], facing: 'right', flying: true },
      line: 1,
    });
    const ticks: PlaybackEvent[][] = [
      [step(1, 0, 1), step(1, 4, 5, 'zarek')],
      [step(2, 1, 2), step(2, 5, 6, 'zarek')],
      [step(3, 2, 3)],
      [{ ...step(4, 3, 3), kind: 'cast', data: { word: 'drevo' } }],
      [step(5, 3, 4)],
    ];
    expect(flownRun(ticks, 0, 'wizard', FLOWN).map(({ event }) => event.tick)).toEqual([1, 2, 3]);
    expect(flownRun(ticks, 0, 'zarek', FLOWN).map(({ event }) => event.tick)).toEqual([1, 2]);
    expect(flownRun(ticks, 0, 'wizard', FLOWN).map(({ length }) => length)).toEqual([FLOWN, FLOWN, FLOWN]);
    expect(flownRun(ticks, 3, 'wizard', FLOWN)).toEqual([]);
    // A step that does not go on from where the last ended ends the run.
    expect(flownRun([[step(1, 0, 1)], [step(2, 5, 6)]], 0, 'wizard').map(({ event }) => event.tick)).toEqual([1]);
    // A walked step is no flight.
    expect(flownRun([[{ ...step(1, 0, 1), data: { from: [0, 0], to: [1, 0] } }]], 0, 'wizard')).toEqual([]);
  });

  it('keeps its ticks on one clock: a timer that fires late makes the next one shorter', () => {
    let now = 0;
    const waits: number[] = [];
    const fired: (() => void)[] = [];
    const playback = new Playback({
      tickMs: 300,
      pace: FLOWN,
      now: () => now,
      schedule: (callback, ms) => {
        waits.push(ms);
        fired.push(callback);
        return null;
      },
    });
    playback.load([move(1, true), move(2, true), move(3, true), move(4, true)]);
    playback.play();
    expect(waits[0]).toBeCloseTo(100);
    // The first timer fires 7 ms late, the second 3 ms: each tick is still due on the
    // clock, every 100 ms from the play's start.
    now = 107;
    fired[0]?.();
    expect(waits[1]).toBeCloseTo(93);
    // The tick shown began when it was due, which is when a glide over it starts.
    expect(playback.startedAt).toBeCloseTo(100);
    now = 203;
    fired[1]?.();
    expect(waits[2]).toBeCloseTo(97);
    // A timer later than HELD, the page held up, starts the clock again from then.
    now = 600;
    fired[2]?.();
    expect(waits[3]).toBeCloseTo(100);
  });
});
