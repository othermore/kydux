// The hop into a bed (D130): from the floor cell under its pillow, facing the bed,
// the figure rises in an arc into the bed's place and settles there, lying. Kept
// apart from the scene so that its path can be tested.

/** How long the hop lasts, against a tick, and how high it rises at its middle, in
 * cells. */
export const HOP_TICKS = 0.8;
export const HOP_RISE = 0.35;

/** Where the hop is at `t`, from 0 to 1: along the straight line from `from` to
 * `to`, raised by `rise` along a half sine, quick as it leaves the floor and slow at
 * the top, slow as it comes down and quick as it lands. */
export function hopAt(from: [number, number], to: [number, number], t: number, rise: number): [number, number] {
  const share = Math.min(1, Math.max(0, t));
  return [
    from[0] + (to[0] - from[0]) * share,
    from[1] + (to[1] - from[1]) * share - rise * Math.sin(Math.PI * share),
  ];
}

/** Whether the hop has reached its top, where the figure takes its lying frame. */
export function hopTop(t: number): boolean {
  return t >= 0.5;
}
