// How wide a speaker's bubble is and where it goes: at most a third of the scene's
// width, taller as it needs; above them, or below where above it would cover someone
// else and below it would not, or above and to one side of whoever it would cover. Kept
// apart from speech.ts so that it is tested without Phaser.

/** The tiles a bubble's words wrap at: what the page asks, at most a third of the scene. */
export function bubbleWrap(wrap: number, columns: number): number {
  return Math.min(wrap, columns / 3);
}

/** A box on the scene, in its pixels. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function meets(one: Box, other: Box): boolean {
  return one.left < other.right && other.left < one.right && one.top < other.bottom && other.top < one.bottom;
}

/** Whether a bubble goes below who speaks: where above there is no room, or where above
 * it would cover another figure and below it covers none. */
export function bubbleBelow(above: Box, below: Box, figures: readonly Box[], roomAbove: boolean): boolean {
  if (!roomAbove) return true;
  return figures.some((figure) => meets(above, figure)) && !figures.some((figure) => meets(below, figure));
}

/** How far sideways a bubble above who speaks moves to clear the figures it would cover,
 * the shorter way that stays inside the scene and covers no one; 0 where none does. */
export function bubbleShift(above: Box, figures: readonly Box[], sceneWidth: number): number {
  const covered = figures.filter((figure) => meets(above, figure));
  if (covered.length === 0) return 0;
  const gap = 6;
  const right = Math.max(...covered.map((figure) => figure.right)) + gap - above.left;
  const left = Math.min(...covered.map((figure) => figure.left)) - gap - above.right;
  const clear = (dx: number) => {
    const moved = { ...above, left: above.left + dx, right: above.right + dx };
    return moved.left >= 0 && moved.right <= sceneWidth && !figures.some((figure) => meets(moved, figure));
  };
  const ways = [right, left].filter(clear).sort((one, other) => Math.abs(one) - Math.abs(other));
  return ways[0] ?? 0;
}
