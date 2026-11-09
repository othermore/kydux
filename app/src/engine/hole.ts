// A hole's state at a tick (D53, D167), the same rule as kydux_world.things.Hole: closed
// for `period` ticks and open for as many, closed from tick 0, and closed too while
// `osto` holds it. The scene draws the hole as a step taken after the tick shown would
// find it, as `hole.closed` says.

/** The ticks a hole is held closed: from the first, up to the last. */
export interface Hold {
  from: number;
  until: number;
}

/** Whether a hole is held closed at a tick. */
export function holeHeld(holds: readonly Hold[], tick: number): boolean {
  return holds.some((hold) => hold.from <= tick && tick < hold.until);
}

/** Whether a hole is closed at a tick: in the closed half of its period, or held. */
export function holeClosed(period: number, holds: readonly Hold[], tick: number): boolean {
  if (Math.floor(tick / Math.max(1, period)) % 2 === 0) return true;
  return holeHeld(holds, tick);
}
