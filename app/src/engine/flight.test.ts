import { describe, expect, it } from 'vitest';
import { BOB_MS, bobOf, flownTick, flyFrame } from './flight';
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
