// A stair's state at a tick (D53), the same rule as kydux_world.things.Stair: in
// place for `period` ticks and away for as many, in place from tick 0, and in
// place too while `osto` holds it. The scene draws the stair as a step taken
// after the tick shown would find it, as `stair.in_place` says.

/** The ticks a stair is held in place: from the first, up to the last. */
export interface Hold {
  from: number;
  until: number;
}

export function stairInPlace(period: number, holds: readonly Hold[], tick: number): boolean {
  if (Math.floor(tick / Math.max(1, period)) % 2 === 0) return true;
  return holds.some((hold) => hold.from <= tick && tick < hold.until);
}
