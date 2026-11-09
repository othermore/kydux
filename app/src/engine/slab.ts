// A slab's state at a tick (D53, D138), the same rule as kydux_world.things.Slab: in
// place for `period` ticks and away for as many, in place from tick 0, and in
// place too while `osto` holds it. The scene draws the slab as a step taken
// after the tick shown would find it, as `slab.in_place` says.

/** The ticks a slab is held in place: from the first, up to the last. */
export interface Hold {
  from: number;
  until: number;
}

/** Whether a slab is held in place at a tick. */
export function slabHeld(holds: readonly Hold[], tick: number): boolean {
  return holds.some((hold) => hold.from <= tick && tick < hold.until);
}

export function slabInPlace(period: number, holds: readonly Hold[], tick: number): boolean {
  if (Math.floor(tick / Math.max(1, period)) % 2 === 0) return true;
  return slabHeld(holds, tick);
}
