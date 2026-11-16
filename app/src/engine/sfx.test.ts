import { describe, expect, it } from 'vitest';
import { type Effect, EFFECTS, lasts, pitched, STEP_LOWER, STEPS } from './sfx';

describe("every figure's steps (D132)", () => {
  it('has three steps, taps of filtered noise: the wizard’s the shortest and quietest, the grown-ups’ the lowest', () => {
    const [wizard, child, adult] = STEPS.map((name) => EFFECTS[name]);
    for (const step of [wizard!, child!, adult!]) {
      expect(step.wave).toBe('noise');
      expect(step.seconds).toBeLessThanOrEqual(0.15);
      expect(step.volume).toBeLessThan(EFFECTS.bump.volume);
    }
    expect(wizard!.seconds).toBeLessThan(child!.seconds);
    expect(wizard!.volume).toBeLessThan(child!.volume);
    expect(child!.seconds).toBeLessThan(adult!.seconds);
    expect(adult!.from).toBeLessThan(child!.from);
    expect(adult!.from).toBeLessThan(wizard!.from);
  });

  it('plays every other step a little lower, so that a walk does not tick like a clock', () => {
    const lower = pitched(EFFECTS.step, STEP_LOWER);
    expect(STEP_LOWER).toBeLessThan(1);
    expect(lower.from).toBeCloseTo(EFFECTS.step.from * STEP_LOWER);
    expect(lower.to).toBeCloseTo(EFFECTS.step.to * STEP_LOWER);
    expect(lower.seconds).toBe(EFFECTS.step.seconds);
  });
});

describe("the wizard's lift and landing (D244, D253)", () => {
  it('lifts with air that rises and is gone, as a thing struck', () => {
    const lift: Effect = EFFECTS.lift;
    expect(lift.wave).toBe('noise');
    expect(lift.to).toBeGreaterThan(lift.from);
    expect(lift.even).toBeUndefined();
  });

  it('lands as a thing switched off: a hum and its air that fall two octaves, turned down evenly, twice as long, with a soft start', () => {
    const { lift, set_down: landing } = EFFECTS;
    const air = landing.under;
    expect(landing.wave).not.toBe('noise');
    expect(air.wave).toBe('noise');
    expect(air.band).toBeGreaterThan(1);
    for (const voice of [landing, air]) {
      expect(voice.from / voice.to).toBeGreaterThanOrEqual(4);
      expect(voice.even).toBe(true);
      expect(voice.attack).toBeGreaterThanOrEqual(0.08);
      expect(voice.seconds).toBeGreaterThanOrEqual(lift.seconds * 2);
    }
    expect(lasts(landing)).toBe(landing.seconds);
  });

  it('counts a voice under an effect in its length, and pitches it with it', () => {
    const chord: Effect = {
      wave: 'sine',
      from: 400,
      to: 200,
      seconds: 0.5,
      volume: 0.1,
      under: { wave: 'noise', from: 800, to: 400, seconds: 0.8, volume: 0.1 },
    };
    expect(lasts(chord)).toBe(0.8);
    expect(pitched(chord, 0.5)).toMatchObject({ from: 200, to: 100, under: { from: 400, to: 200 } });
  });
});
