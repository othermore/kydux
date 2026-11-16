// How wide a speaker's bubble is and where it goes: at most a third of the scene's
// width, taller as it needs; above them, or below where above it would cover someone
// else and below it would not, or above and to one side of whoever it would cover; and
// how long words stay said, as long as they take to read (D175); a thought about a bump
// comes half a second after it, and words over a figure in the air are over it as it is
// drawn (D237); words go under who they are over where the goals box would cover them
// above (D240). Kept apart from speech.ts so that it is tested without Phaser.

/** How long after a bump the wizard's thought about it shows, in milliseconds (D237):
 * the bump is seen, and then read of. */
export const AFTER_BUMP_MS = 500;

/** How far over the place of a figure's feet on the ground the foot of the words over it
 * is, in cells (D237): its headroom, a figure's height, and how high it is drawn above
 * that place, flying, both in the scene's pixels of `tile` a cell. */
export function wordsOver(headroom: number, lifted: number, tile: number): number {
  return (headroom + lifted) / tile;
}

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

/** The top and the bottom a bubble stays between, in the scene's pixels, or its left
 * and its right, `size` the scene's height or its width: the scene's own, or what a
 * story step's framing shows of it (D199), where the camera does not follow the words. */
export function bubbleRoom(size: number, shown: readonly [number, number] | null): [number, number] {
  return shown ? [Math.max(0, shown[0]), Math.min(size, shown[1])] : [0, size];
}

/** The top that words over someone stay under, in the scene's pixels (D240): the room's
 * own `top`, or the foot of what of the page lies over the scene, `cover`, where the
 * words, from `left` to `right` and with their foot at `foot`, would be under it. */
export function roomTop(top: number, left: number, right: number, foot: number, cover: Box | null): number {
  const under = cover && cover.left < right && left < cover.right && cover.top < foot;
  return under ? Math.max(top, cover.bottom) : top;
}

/** Where the tail's tip goes across a bubble's box, from the box's middle and in the
 * box's own pixels: over who speaks, `offset` pixels of the scene from the middle of a
 * box drawn at `scale`, short of the box's round corners. */
export function bubbleTip(offset: number, scale: number, width: number): number {
  const reach = width / 2 - 12;
  return Math.min(Math.max(offset / scale, -reach), reach);
}

/** Where a bubble's middle goes across the scene: where it is wanted, over who speaks,
 * held in so that its half on each side stays between `sides`; from the left one where
 * it is wider than the room between them. */
export function bubbleMiddle(wanted: number, half: number, sides: readonly [number, number]): number {
  return Math.min(Math.max(wanted, sides[0] + half), Math.max(sides[0] + half, sides[1] - half));
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

/** How long words take to read, in milliseconds (D175): 0.8 seconds, and 50
 * thousandths more for each of their characters. */
export function readingMs(text: string): number {
  return 800 + 50 * [...text].length;
}

/** How many ticks of `tickMs` words said in a level stay: their reading time, three
 * ticks at least (D175). */
export function readingTicks(text: string, tickMs: number): number {
  return Math.max(3, Math.ceil(readingMs(text) / tickMs));
}

/** The milliseconds from `now` until the last of the words on the scene is gone, each
 * said until a time; 0 when none is on. Words said for ever, a sleeper's thought, are
 * not read to an end, and do not count. */
export function settleMs(untils: readonly number[], now: number): number {
  const ends = untils.filter((until) => Number.isFinite(until));
  return ends.length === 0 ? 0 : Math.max(0, ...ends.map((until) => until - now));
}
