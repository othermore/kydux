import { describe, expect, it } from 'vitest';
import { DAWN_MS, LIGHTS, NIGHT_FALL_MS, NIGHT_HOLD_MS, NIGHT_MS, SceneLight, WHOLE_MORNING } from './light';

describe('the night seen when the wizard goes to sleep (D124)', () => {
  it('falls, holds, dawns and stays the morning, on its own clock', () => {
    const light = new SceneLight();
    expect(light.at(0)).toMatchObject({ state: 'none', alpha: 0 });
    light.fall(1000);
    expect(light.at(1000)).toMatchObject({ state: 'falling', alpha: 0 });
    expect(light.at(1000 + NIGHT_FALL_MS / 2).alpha).toBeCloseTo(LIGHTS.night.alpha / 2);
    expect(light.at(1000 + NIGHT_FALL_MS)).toMatchObject({ state: 'night', ...LIGHTS.night });
    expect(light.at(1000 + NIGHT_FALL_MS + NIGHT_HOLD_MS - 1)).toMatchObject({ state: 'night' });
    const dawn = light.at(1000 + NIGHT_FALL_MS + NIGHT_HOLD_MS + DAWN_MS / 2);
    expect(dawn.state).toBe('dawning');
    expect(dawn.alpha).toBeLessThan(LIGHTS.night.alpha);
    expect(dawn.alpha).toBeGreaterThan(LIGHTS.morning.alpha);
    expect(light.at(1000 + NIGHT_MS)).toMatchObject({ state: 'morning', ...LIGHTS.morning });
    expect(light.at(1000 + NIGHT_MS * 10)).toMatchObject({ state: 'morning', ...LIGHTS.morning });
  });

  it('shows the day only from the dawn, all of it once the morning has come (D126)', () => {
    const light = new SceneLight();
    expect(light.at(0).day).toBe(0);
    light.fall(0);
    expect(light.at(NIGHT_FALL_MS + NIGHT_HOLD_MS - 1).day).toBe(0);
    expect(light.at(NIGHT_FALL_MS + NIGHT_HOLD_MS + DAWN_MS / 2).day).toBeCloseTo(0.5);
    expect(light.at(NIGHT_MS).day).toBe(1);
    light.set('morning');
    expect(light.at(5).day).toBe(1);
    light.set('none');
    expect(light.at(5).day).toBe(0);
  });

  it('is the painting’s own light after a reset, and a morning story’s morning', () => {
    const light = new SceneLight();
    light.fall(0);
    light.set('none');
    expect(light.at(NIGHT_FALL_MS + 1)).toMatchObject({ state: 'none', alpha: 0 });
    light.set('morning');
    expect(light.at(123456)).toMatchObject({ state: 'morning', ...LIGHTS.morning });
  });

  it('lays no light over a scene painted whole by morning, and dawns into it (D126)', () => {
    const light = new SceneLight();
    light.morning = WHOLE_MORNING;
    light.set('morning');
    expect(light.at(5)).toMatchObject({ state: 'morning', day: 1, alpha: 0 });
    light.fall(0);
    const dawn = light.at(NIGHT_FALL_MS + NIGHT_HOLD_MS + DAWN_MS / 2);
    expect(dawn.alpha).toBeCloseTo(LIGHTS.night.alpha / 2);
    expect(light.at(NIGHT_MS)).toMatchObject({ state: 'morning', day: 1, alpha: 0 });
  });
});
