import { describe, expect, it } from 'vitest';
import { FOOT_IN_CELL, figureDepth, thingDepth } from './depth';
import { BOB_MS, bobOf, FLY_LIFT, flownTick, flyFrame, RING_PAST, RING_RAISE, throughRing } from './flight';
import { FLOWN, LONG, lengthOf, Playback, type PlaybackEvent } from './playback';
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
  it('bobs over the flying rows: level, up, level, down, by the way the figure faces', () => {
    expect([0, 1, 2, 3, 4].map((step) => flyFrame(12, 'down', step * BOB_MS))).toEqual([36, 37, 36, 38, 36]);
    expect(flyFrame(12, 'up', 0)).toBe(45);
    expect(flyFrame(undefined, 'down', 0)).toBeNull();
  });

  it('lifts a figure with no flying rows a little up and down instead', () => {
    expect(bobOf(0)).toBeCloseTo(0);
    expect(bobOf(BOB_MS)).toBeGreaterThan(0);
    expect(bobOf(BOB_MS * 3)).toBeLessThan(0);
  });

  it('plays a tick whose every move is flown in a third of a walked one, at every speed', () => {
    expect(flownTick([move(1, true), move(1, true, 'zarek')])).toBe(true);
    expect(flownTick([move(1, true), move(1, false, 'friend')])).toBe(false);
    expect(flownTick([{ ...move(1, false), kind: 'wait', data: {} }])).toBe(false);
    expect(lengthOf([move(1, true)])).toBe(FLOWN);
    expect(lengthOf([move(1, false)])).toBe(1);
    expect(lengthOf([{ ...move(1, false), kind: 'untie', data: {} }])).toBe(LONG);
    const circling: PlaybackEvent = { tick: 1, actor: 'wizard', kind: 'circle', data: { at: [3, 4] }, line: null };
    expect(lengthOf([circling])).toBe(FLOWN);
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
