// The light over a scene (D124): none, the painting's own; the night that falls when
// the wizard has gone to sleep, a dark blue that leaves the sleeper and the room
// faintly seen; and the warm morning that follows it and stays, or that a morning
// story opens under. With it, how much of the day is seen (`day`): a scene painted
// at night shows its morning ground that much over its night one, from the dawn
// on (D126); a scene painted whole by morning is the morning itself, and its
// morning lays no light over it (WHOLE_MORNING). The times are the page's own,
// not the run's speed.

export type LightName = 'none' | 'night' | 'morning';
/** What the light is doing, for the tests (`data-light`). */
export type LightState = 'none' | 'falling' | 'night' | 'dawning' | 'morning';

export interface LightLook {
  colour: [number, number, number];
  alpha: number;
}

export const LIGHTS: Record<LightName, LightLook> = {
  none: { colour: [20, 28, 60], alpha: 0 },
  night: { colour: [20, 28, 60], alpha: 0.55 },
  morning: { colour: [255, 214, 150], alpha: 0.18 },
};

/** The morning over a scene painted whole by morning (D126): its picture is the
 * morning, and nothing is laid over it. */
export const WHOLE_MORNING: LightLook = { colour: LIGHTS.morning.colour, alpha: 0 };
/** How long the night takes to fall, how long it holds, and how long the dawn takes. */
export const NIGHT_FALL_MS = 1200;
export const NIGHT_HOLD_MS = 2000;
export const DAWN_MS = 1500;
/** The whole sequence, from the first dimming to the morning. */
export const NIGHT_MS = NIGHT_FALL_MS + NIGHT_HOLD_MS + DAWN_MS;

/** The light at a moment: what it is doing, its colour, and how much of the day
 * is seen, from 0, the night, to 1, the morning (D126). */
export type Light = LightLook & { state: LightState; day: number };

function between(from: LightLook, to: LightLook, share: number): LightLook {
  const t = Math.min(1, Math.max(0, share));
  return {
    colour: from.colour.map((c, i) => Math.round(c + ((to.colour[i] ?? c) - c) * t)) as [number, number, number],
    alpha: from.alpha + (to.alpha - from.alpha) * t,
  };
}

/** The light at `ms` since the night began to fall: falling into the night, the night
 * held, dawning into the `morning`, then the morning for good. */
export function nightAt(ms: number, morning: LightLook = LIGHTS.morning): Light {
  if (ms < NIGHT_FALL_MS) return { state: 'falling', day: 0, ...between(LIGHTS.none, LIGHTS.night, ms / NIGHT_FALL_MS) };
  if (ms < NIGHT_FALL_MS + NIGHT_HOLD_MS) return { state: 'night', day: 0, ...LIGHTS.night };
  if (ms < NIGHT_MS) {
    const day = (ms - NIGHT_FALL_MS - NIGHT_HOLD_MS) / DAWN_MS;
    return { state: 'dawning', day, ...between(LIGHTS.night, morning, day) };
  }
  return { state: 'morning', day: 1, ...morning };
}

/** The light over a scene as time goes: a still light, or the night's sequence from
 * the time it began, read on the scene's clock. */
export class SceneLight {
  private still: LightName = 'none';
  private began: number | null = null;
  /** The morning's look: LIGHTS.morning, or WHOLE_MORNING on a scene painted whole
   * by morning. */
  morning: LightLook = LIGHTS.morning;

  /** A light that does not change: the painting's own, or a morning story's. */
  set(light: LightName): void {
    this.still = light;
    this.began = null;
  }

  /** The night begins to fall at `now`. */
  fall(now: number): void {
    this.began = now;
  }

  at(now: number): Light {
    if (this.began !== null) return nightAt(now - this.began, this.morning);
    const look = this.still === 'morning' ? this.morning : LIGHTS[this.still];
    return { state: this.still, day: this.still === 'morning' ? 1 : 0, ...look };
  }
}
