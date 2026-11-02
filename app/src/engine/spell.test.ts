import { describe, expect, it } from 'vitest';
import { LONG } from './playback';
import { HELD, lightTimes, pullTimes } from './spell';

describe('a spell seen in order (D127)', () => {
  it('flies the thing to the hands only once the light has reached it, landing before the tick ends', () => {
    const tick = 400;
    const casting = tick * LONG * 0.95;
    const light = lightTimes(casting);
    expect(light.delay).toBeGreaterThan(0);
    expect(light.reaches).toBeCloseTo(light.delay + light.flight);
    const pull = pullTimes(light.reaches, tick);
    // Half a tick into the cast the light is on its way and the thing is in its place.
    expect(light.reaches).toBeGreaterThan(tick * 0.5);
    expect(pull.delay).toBe(light.reaches);
    // It lands in the hands a tenth of the long tick before the pick-up's tick.
    expect(pull.delay + pull.flight).toBeCloseTo(tick * LONG * (1 - HELD));
  });

  it('never flies the thing in less than a fifth of a tick', () => {
    expect(pullTimes(10_000, 400).flight).toBeCloseTo(80);
  });
});
