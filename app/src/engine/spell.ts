// The times of a spell seen (D81, D127): the light leaves the wand once it is
// pointed and flies to what the spell is cast at, and bursts there; a thing the
// spell takes leaves its place only when the light reaches it, and flies to the
// wizard's hands, where it lands before the cast's long tick ends.

import { LONG } from './playback';

/** The light's flight, as shares of the cast's length: it waits for the wand to be
 * pointed, flies, and its ring fades. */
export const LIGHT_DELAY = 0.2;
export const LIGHT_FLIGHT = 0.45;
export const LIGHT_RING = 0.35;
/** The share of the cast's long tick left after the thing lands in the hands. */
export const HELD = 0.1;
/** The shortest flight of a thing to the hands, as a share of a tick. */
const SHORTEST = 0.2;

/** When the light leaves the wand, how long it flies, and when it reaches what the
 * spell is cast at, in milliseconds from the cast, for a cast lasting `casting`. */
export function lightTimes(casting: number): { delay: number; flight: number; reaches: number } {
  const delay = casting * LIGHT_DELAY;
  const flight = casting * LIGHT_FLIGHT;
  return { delay, flight, reaches: delay + flight };
}

/** When a thing the spell takes leaves its place and how long it flies to the
 * hands, in milliseconds from the cast: from the light's reaching it to a tenth of
 * the long tick before its end. */
export function pullTimes(reaches: number, tickMs: number): { delay: number; flight: number } {
  const lands = tickMs * LONG * (1 - HELD);
  return { delay: reaches, flight: Math.max(tickMs * SHORTEST, lands - reaches) };
}
