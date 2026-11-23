// The hall at work in One line in the book (D300): the room-mate's tries, which come and
// go, and the friend's orders to her hare round a loop of cells. Both are the page's own
// show, on its own clock: the world's ticks, the goals and a run's data know nothing of
// them. This module chooses what is shown, the random number given to it; the scene
// draws it. It knows nothing of Phaser.

import type { Facing } from './sight';

/** A try of the room-mate's: the spark, or a kind of the first year, pale or in one of
 * its colours. */
export interface Try {
  look: 'spark' | 'pale' | 'good';
  kind: string | null;
  color: string | null;
}

/** How long a try stands, how long it takes to fade, and the wait before the next, in
 * milliseconds of the page's clock. */
export const TRY_SHOWN_MS = 2500;
export const TRY_FADE_MS = 600;
export const TRY_GAP_MS = 1200;
/** About one try in three is the spark. */
const SPARK_SHARE = 1 / 3;

/** Whether two tries are the same picture. */
export function sameTry(a: Try | null, b: Try): boolean {
  return a !== null && a.look === b.look && a.kind === b.kind && a.color === b.color;
}

/** The next try, from the first year's kinds and their colours (the friend's grey is no
 * child's colour): the spark about one time in three, else a kind, pale or in one of its
 * colours, each as likely; never the picture shown just before. */
export function nextTry(kinds: Record<string, readonly string[]>, previous: Try | null, random: () => number): Try {
  const names = Object.keys(kinds);
  const pick = (): Try => {
    if (names.length === 0 || random() < SPARK_SHARE) return { look: 'spark', kind: null, color: null };
    const kind = names[Math.min(names.length - 1, Math.floor(random() * names.length))] as string;
    const colours = kinds[kind] ?? [];
    const which = Math.min(colours.length, Math.floor(random() * (colours.length + 1)));
    const color = colours[which] ?? null;
    return { look: color === null ? 'pale' : 'good', kind, color };
  };
  for (let tries = 0; tries < 8; tries += 1) {
    const found = pick();
    if (!sameTry(previous, found)) return found;
  }
  // Still the same: the spark after a creature, the first kind pale after the spark.
  const first = names[0] ?? null;
  return previous?.look === 'spark' && first
    ? { look: 'pale', kind: first, color: null }
    : { look: 'spark', kind: null, color: null };
}

/** The pause between one of the friend's orders read and the next, in milliseconds. */
export const ORDER_PAUSE_MS = 700;

/** The friend's order for each way, its words' key. */
const ORDERS: Record<Facing, string> = {
  up: 'ambient.move_up',
  down: 'ambient.move_down',
  left: 'ambient.move_left',
  right: 'ambient.move_right',
};

/** One step of the friend's loop (D300): from the cell the hare stands on to the next of
 * the loop, the way it faces, and the order's key. The loop's last cell is the hare's own,
 * so that it goes round and round. */
export function drillStep(
  loop: readonly [number, number][],
  start: [number, number],
  index: number,
): { from: [number, number]; to: [number, number]; way: Facing; key: string } {
  const at = (i: number): [number, number] => (i < 0 ? start : (loop[i % loop.length] ?? start));
  const from = index === 0 ? start : at(index - 1);
  const to = at(index);
  const way: Facing = to[0] > from[0] ? 'right' : to[0] < from[0] ? 'left' : to[1] < from[1] ? 'up' : 'down';
  return { from, to, way, key: ORDERS[way] };
}
