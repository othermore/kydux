// How wide a speaker's bubble is and where it goes: at most a third of the scene's
// width, taller as it needs; above them, or below where above it would cover someone
// else and below it would not, or above and to one side of whoever it would cover; and
// how long words stay said, as long as they take to read (D175); a thought about a bump
// comes half a second after it, and words over a figure in the air are over it as it is
// drawn (D237); words go under who they are over where the goals box would cover them
// above (D240); and a thought with no room above goes beside the head, raised or
// lower, its dots going to the head, and under the feet only where neither side has
// room (D245, thoughtPlace); and a bubble whose speaker walks out of what a story
// step's framing shows stays whole inside it (bubbleHeld). Kept apart from speech.ts so
// that it is tested without Phaser.

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

/** Where a bubble's anchor goes, from `y` over or under who speaks, for its box and
 * tail, which reach `over` above the anchor and `under` below it, to stay whole between
 * the top and the bottom of `room`, in the scene's pixels: who speaks walks out of what
 * a story step's framing shows, or leaves the scene (D319), and the words stay inside it
 * to be read. The top is kept where the room is shorter than the box. */
export function bubbleHeld(y: number, over: number, under: number, room: readonly [number, number]): number {
  return Math.max(Math.min(y, room[1] - under), room[0] + over);
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

/** The side of who speaks a bubble goes to (D284): where it would go below and cover what
 * words keep off, the familiar's circle, the side away from it, judged by its middle against
 * the speaker's; null where it does not. */
export function bubbleBeside(below: Box, keep: Box | null, speaker: number): 'left' | 'right' | null {
  if (!keep || !meets(below, keep)) return null;
  return (keep.left + keep.right) / 2 <= speaker ? 'right' : 'left';
}

/** How far sideways a bubble above who speaks moves to clear the figures it would cover,
 * the shorter way that stays inside the scene and covers no one; 0 where none does. It
 * moves `most` at the most, as far as its tail still reaches who speaks (D306): where no
 * way clears within it, the shorter way as far as `most`, the box covering what it must. */
export function bubbleShift(
  above: Box,
  figures: readonly Box[],
  sceneWidth: number,
  most = Number.POSITIVE_INFINITY,
): number {
  const covered = figures.filter((figure) => meets(above, figure));
  if (covered.length === 0) return 0;
  const gap = 6;
  const right = Math.max(...covered.map((figure) => figure.right)) + gap - above.left;
  const left = Math.min(...covered.map((figure) => figure.left)) - gap - above.right;
  const inside = (dx: number) => above.left + dx >= 0 && above.right + dx <= sceneWidth;
  const clear = (dx: number) => {
    const moved = { ...above, left: above.left + dx, right: above.right + dx };
    return inside(dx) && !figures.some((figure) => meets(moved, figure));
  };
  const shorter = (one: number, other: number) => Math.abs(one) - Math.abs(other);
  const ways = [right, left].filter((dx) => clear(dx) && Math.abs(dx) <= most).sort(shorter);
  if (ways[0] !== undefined) return ways[0];
  if (!Number.isFinite(most)) return 0;
  // The tail wins: the box moves the shorter way, no farther than the tail reaches.
  const partway = [right, left]
    .map((dx) => Math.sign(dx) * Math.min(Math.abs(dx), Math.max(0, most)))
    .filter(inside)
    .sort(shorter);
  return partway[0] ?? 0;
}

/** How far a bubble's box may move from over who speaks, in the scene's pixels, its tail
 * still reaching them (D306): half its width less the tail's margin, at its scale, less
 * what the scene's side already took. */
export function bubbleReach(width: number, scale: number, edgeTaken: number): number {
  return Math.max(0, (width / 2 - 12) * scale - Math.abs(edgeTaken));
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

/** Where a thought goes (D245): over the head, beside it on the left or on the right,
 * or under the place of the feet. */
export type ThoughtSide = 'above' | 'left' | 'right' | 'below';

/** A thought's place: where it goes, its cloud's box, and the middles and sizes of its
 * two dots, the larger nearer the cloud, all in the scene's pixels. */
export interface ThoughtPlacing {
  place: ThoughtSide;
  cloud: Box;
  dots: [{ x: number; y: number; radius: number }, { x: number; y: number; radius: number }];
}

/** What a thought's place is chosen from (D245), in the scene's pixels: the cloud's size
 * as drawn; the head of who thinks as it is drawn (its middle across, its top, its two
 * sides) and the place of its feet on the ground; the way it faces; what of the scene
 * the window shows, and what of the page lies over it (D240); and the other figures'
 * heads, which no cloud covers. */
export interface ThoughtRoom {
  width: number;
  height: number;
  head: { middle: number; top: number; left: number; right: number };
  feet: number;
  facing: 'up' | 'down' | 'left' | 'right';
  view: Box;
  cover: Box | null;
  heads: readonly Box[];
}

/** How far a cloud over the head stands above it, and beside it, from it; how clear of
 * the view's edges any cloud stays; and how far under the feet a cloud goes. */
const OVER_HEAD = 18;
const BESIDE_HEAD = 16;
const CLEAR = 4;
const UNDER_FEET = 36;
/** The dots' sizes, and where along the way from the cloud to the head each lies. */
const DOTS = [
  { radius: 4, along: 0.35 },
  { radius: 2.5, along: 0.8 },
] as const;

/** The two dots on the way from a point of the cloud to a point of the head. */
function dotsBetween(from: { x: number; y: number }, to: { x: number; y: number }): ThoughtPlacing['dots'] {
  const [near, far] = DOTS.map(({ radius, along }) => ({
    x: from.x + (to.x - from.x) * along,
    y: from.y + (to.y - from.y) * along,
    radius,
  }));
  return [near as ThoughtPlacing['dots'][0], far as ThoughtPlacing['dots'][1]];
}

/** Where a thought goes (D245), the first of these with room: over the head; beside it,
 * raised, its foot level with the head's top, on the first side and then the other;
 * beside it, slid down by the least that gives it room, its top no lower than the head's,
 * on the first side and then the other; under the feet. The first side is the one behind
 * a figure that faces left or right, else the one toward the middle of the view. A place
 * has room where the cloud is inside the view, CLEAR off its edges, and covers neither
 * what lies over the scene nor another head. */
export function thoughtPlace(room: ThoughtRoom): ThoughtPlacing {
  const { width, height, head, view } = room;
  const fits = (cloud: Box) =>
    cloud.left >= view.left + CLEAR &&
    cloud.right <= view.right - CLEAR &&
    cloud.top >= view.top + CLEAR &&
    cloud.bottom <= view.bottom - CLEAR &&
    !(room.cover && meets(cloud, room.cover)) &&
    !room.heads.some((other) => meets(cloud, other));
  // Over the head, held inside the view's sides as words are (bubbleMiddle).
  const middle = bubbleMiddle(head.middle, width / 2 + CLEAR, [view.left, view.right]);
  const above = { left: middle - width / 2, right: middle + width / 2, top: head.top - OVER_HEAD - height, bottom: head.top - OVER_HEAD };
  if (fits(above)) {
    const at = { x: head.middle, y: head.top };
    return { place: 'above', cloud: above, dots: dotsBetween({ x: head.middle - 6, y: above.bottom }, at) };
  }
  const behind = room.facing === 'right' ? 'left' : room.facing === 'left' ? 'right' : null;
  const toMiddle = head.middle < (view.left + view.right) / 2 ? 'right' : 'left';
  const first = behind ?? toMiddle;
  const sides: ('left' | 'right')[] = [first, first === 'left' ? 'right' : 'left'];
  const besideAt = (side: 'left' | 'right', top: number): Box =>
    side === 'right'
      ? { left: head.right + BESIDE_HEAD, right: head.right + BESIDE_HEAD + width, top, bottom: top + height }
      : { left: head.left - BESIDE_HEAD - width, right: head.left - BESIDE_HEAD, top, bottom: top + height };
  // The point of the head the dots go to: its near side, a little under its top.
  const aim = (side: 'left' | 'right') => ({ x: side === 'right' ? head.right : head.left, y: head.top + 8 });
  for (const side of sides) {
    const cloud = besideAt(side, head.top - height);
    if (fits(cloud)) {
      const corner = { x: side === 'right' ? cloud.left : cloud.right, y: cloud.bottom };
      return { place: side, cloud, dots: dotsBetween(corner, aim(side)) };
    }
  }
  for (const side of sides) {
    for (let down = 1; down <= height; down += 1) {
      const cloud = besideAt(side, head.top - height + down);
      if (!fits(cloud)) continue;
      const target = aim(side);
      const nearX = side === 'right' ? cloud.left : cloud.right;
      // From the near side at the head's height, or from the near top corner where the
      // cloud is wholly under the head's top.
      const from = cloud.top >= head.top ? { x: nearX, y: cloud.top } : { x: nearX, y: Math.min(Math.max(target.y, cloud.top + 6), cloud.bottom - 6) };
      return { place: side, cloud, dots: dotsBetween(from, target) };
    }
  }
  const top = room.feet + UNDER_FEET;
  const below = { left: middle - width / 2, right: middle + width / 2, top, bottom: top + height };
  return { place: 'below', cloud: below, dots: dotsBetween({ x: head.middle - 6, y: top }, { x: head.middle, y: room.feet + 22 }) };
}
