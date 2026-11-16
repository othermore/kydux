// What a screen shows while it loads (D214): Kydux's mark and "Loading…", and, for a
// child who has begun, a tip about the game. No screen waits for Python, which loads in
// its worker from the moment the page opens; a screen waits for its own code, texts
// and pictures. A wait shorter than the grace shows no tip and holds nothing; after
// the grace a tip comes up, and the next one every TIP_TIME. When the screen is ready
// with a tip up, Go on appears under it, and the screen opens when the tip has been up
// TIP_TIME or at the button, whichever comes first. The tips are shown in their order,
// from the one after the last shown, which the browser keeps; after the last comes the
// first. The browser tests turn them off with a key no setting shows, read once as the
// page opens.

import { t } from '../i18n';
import { element } from './dom';
import { markSvg } from './mark';

/** How long a wait shows no tip, in milliseconds. */
export const GRACE = 2000;
/** How long a tip is up before the next, and before a ready screen opens under it. */
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
  storage?: Kept | null;
  /** The tips' keys, the page's own unless a test gives others. */
  keys?: readonly string[];
  /** A tip comes up, by its key. */
  onTip?: (key: string) => void;
  /** The screen is ready under a tip: Go on is offered. */
  onOffer?: () => void;
}

/** One wait for a screen, its clock and its tips. */
export class Wait {
  private readonly storage: Kept | null;
  private readonly keys: readonly string[];
  private shownAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private opened = false;
  private open: (() => void) | null = null;

  constructor(private readonly options: WaitOptions) {
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    this.keys = options.keys ?? TIPS;
    if (options.tips && this.keys.length > 0) this.timer = setTimeout(() => this.tip(), GRACE);
  }

  /** Whether a tip is up. */
  get tipping(): boolean {
    return this.shownAt !== null;
  }

  /** The screen is ready: `open` it now, or when the tip up has been read. */
  ready(open: () => void): void {
    this.open = open;
    if (this.shownAt === null) {
      this.finish();
      return;
    }
    // A tip is up: no other comes; the screen waits for this one to be read.
    this.clear();
    this.options.onOffer?.();
    this.timer = setTimeout(() => this.finish(), Math.max(0, this.shownAt + TIP_TIME - Date.now()));
  }

  /** Go on, pressed: the ready screen opens at once. */
  go(): void {
    this.finish();
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
    this.options.onTip?.(this.keys[index] ?? '');
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

/** The waiting view: the mark, Loading…, and the tip's place with Go on under it. */
export function waitingView(tips: boolean): Waiting {
  const tip = element('p', { id: 'waiting-tip', className: 'waiting-tip', hidden: true });
  tip.setAttribute('aria-live', 'polite');
  const go = element('button', { id: 'waiting-go', type: 'button', className: 'big-button', hidden: true }, [
    t('waiting.go'),
  ]);
  const node = element('div', { id: 'waiting', className: 'waiting' }, [
    markSvg(64),
    element('p', { className: 'status waiting-loading' }, [t('waiting.loading')]),
    tip,
    go,
  ]);
  const wait = new Wait({
    tips: tips && !turnedOff,
    onTip: (key) => {
      tip.replaceChildren(...tipNodes(t(`tips.${key}`)));
      tip.hidden = false;
      node.dataset.tip = key;
    },
    onOffer: () => {
      go.hidden = false;
      node.dataset.ready = 'true';
      go.focus();
    },
  });
  go.addEventListener('click', () => wait.go());
  return { node, wait };
}
