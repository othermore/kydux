// What a screen shows while it loads (D214, D221): Kydux's mark and "Loading…", and,
// for a child who has begun, a tip about the game with its picture. No screen waits
// for Python, which loads in its worker from the moment the page opens; a screen waits
// for its own code, texts and pictures. A tip is due at once at the visit's first wait
// and at a screen of a scene other than the one last shown; any other wait shows no
// tip inside the grace and holds nothing, and after it a tip comes up. The next tip
// comes every TIP_TIME. When the screen is ready with a tip up, it opens by itself once
// the tip has had its reading time (D175), never more than TIP_TIME; there is no
// button. The tips are shown in their order, from the one after the last shown, which
// the browser keeps; after the last comes the first. The browser tests turn them off
// with a key no setting shows, read once as the page opens.

import { readingMs } from '../engine/bubble';
import { currentLanguage, t } from '../i18n';
import { element } from './dom';
import { markSvg } from './mark';
import { contentUrl } from '../content/address';

/** How long a wait shows no tip, in milliseconds. */
export const GRACE = 2000;
/** How long a tip is up before the next, and the most a ready screen waits under it. */
export const TIP_TIME = 10_000;
/** The tips, by their key under `tips.`, in the order they are shown. */
export const TIPS = ['notebook', 'spells', 'click', 'dot', 'hint', 'keys', 'timeline', 'zoom', 'lesson', 'map'] as const;
/** Where the browser keeps the last tip shown, and the key that turns the tips off. */
export const LAST_TIP = 'kydux.tip';
export const TIPS_OFF = 'kydux.tips-off';

type Kept = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): Kept | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Whether the tips are turned off for this page, read once as it opens. */
const turnedOff = (() => {
  try {
    return browserStorage()?.getItem(TIPS_OFF) === '1';
  } catch {
    return false;
  }
})();

/** The tip after the last one shown, kept in the browser. */
export function nextTip(storage: Kept | null, count: number): number {
  const last = Number.parseInt(storage?.getItem(LAST_TIP) ?? '', 10);
  return Number.isInteger(last) && last >= 0 ? (last + 1) % count : 0;
}

export interface WaitOptions {
  /** Whether this child may read tips: one who has begun (a wizard made or a game
   * saved), and the tips not turned off. */
  tips: boolean;
  /** Whether a tip is due at once, with no grace (D221). */
  due?: boolean;
  storage?: Kept | null;
  /** The tips' keys, the page's own unless a test gives others. */
  keys?: readonly string[];
  /** A tip comes up, by its key. */
  onTip?: (key: string) => void;
  /** How long a tip takes to read, in milliseconds (D175); TIP_TIME unless given. */
  reading?: (key: string) => number;
}

/** How long a ready screen waits under a tip up: the tip's reading time, never more
 * than TIP_TIME (D221). */
export function readFor(ms: number): number {
  return Math.min(TIP_TIME, Math.max(0, ms));
}

/** One wait for a screen, its clock and its tips. */
export class Wait {
  private readonly storage: Kept | null;
  private readonly keys: readonly string[];
  private shownAt: number | null = null;
  private readMs = TIP_TIME;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private opened = false;
  private open: (() => void) | null = null;

  constructor(private readonly options: WaitOptions) {
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.keys = options.keys ?? TIPS;
    if (options.tips && this.keys.length > 0) this.timer = setTimeout(() => this.tip(), options.due ? 0 : GRACE);
  }

  /** A tip is due now (D221): the screen's scene is known to be a new one. */
  due(): void {
    if (this.opened || this.shownAt !== null || !this.options.tips || this.keys.length === 0) return;
    this.clear();
    this.tip();
  }

  /** Whether a tip is up. */
  get tipping(): boolean {
    return this.shownAt !== null;
  }

  /** The screen is ready: `open` it now, or, a tip up, by itself once the tip has
   * had its reading time. */
  ready(open: () => void): void {
    this.open = open;
    if (this.shownAt === null) {
      this.finish();
      return;
    }
    // A tip is up: no other comes; the screen waits for this one to be read.
    this.clear();
    this.timer = setTimeout(() => this.finish(), Math.max(0, this.shownAt + this.readMs - Date.now()));
  }

  /** The wait dropped: its timers stopped, nothing opened. */
  dispose(): void {
    this.opened = true;
    this.clear();
  }

  private tip(): void {
    const index = nextTip(this.storage, this.keys.length);
    try {
      this.storage?.setItem(LAST_TIP, String(index));
    } catch {
      // A browser that keeps nothing shows the tips from the first each time.
    }
    this.shownAt = Date.now();
    const key = this.keys[index] ?? '';
    this.readMs = readFor(this.options.reading?.(key) ?? TIP_TIME);
    this.options.onTip?.(key);
    this.timer = setTimeout(() => this.tip(), TIP_TIME);
  }

  private finish(): void {
    if (this.opened || !this.open) return;
    this.opened = true;
    this.clear();
    this.open();
  }

  private clear(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}

export interface Waiting {
  node: HTMLElement;
  wait: Wait;
}

/** A tip's words as nodes: `*a button*` in italics and `` `code` `` as code, the rest as
 * it is. A tip needs no more, and the page's Markdown is not loaded yet. */
export function tipNodes(text: string): (Node | string)[] {
  return text
    .split(/(\*[^*]+\*|`[^`]+`)/)
    .filter((part) => part !== '')
    .map((part) =>
      part.length > 2 && part.startsWith('*') && part.endsWith('*')
        ? element('em', {}, [part.slice(1, -1)])
        : part.length > 2 && part.startsWith('`') && part.endsWith('`')
          ? element('code', {}, [part.slice(1, -1)])
          : part,
    );
}

/** A tip's picture (D221), in the page's language: content/tips/<lang>/<key>.webp. */
export function tipPicture(key: string, language = currentLanguage()): string {
  return contentUrl(`tips/${language}/${key}.webp`);
}

/** The next tip's picture fetched ahead, in idle time, so that it is there when the
 * tip comes up (D221). */
export function fetchNextTip(): Promise<unknown> {
  const key = TIPS[nextTip(browserStorage(), TIPS.length)] ?? TIPS[0];
  return fetch(tipPicture(key)).catch(() => {});
}

/** The waiting view: the mark, Loading…, and the tip's place, its picture over its
 * words, the picture's room kept while it comes. */
export function waitingView(tips: boolean, due = false): Waiting {
  const words = element('p', { id: 'waiting-tip', className: 'waiting-tip' });
  words.setAttribute('aria-live', 'polite');
  const picture = element('img', { className: 'waiting-tip-picture', alt: '', width: 640, height: 360 });
  const tip = element('figure', { className: 'waiting-tip-box', hidden: true }, [picture, words]);
  const node = element('div', { id: 'waiting', className: 'waiting' }, [
    markSvg(64),
    element('p', { className: 'status waiting-loading' }, [t('waiting.loading')]),
    tip,
  ]);
  const wait = new Wait({
    tips: tips && !turnedOff,
    due,
    reading: (key) => readingMs(t(`tips.${key}`).replace(/[*`]/g, '')),
    onTip: (key) => {
      picture.src = tipPicture(key);
      words.replaceChildren(...tipNodes(t(`tips.${key}`)));
      tip.hidden = false;
      node.dataset.tip = key;
    },
  });
  return { node, wait };
}
