// What a screen shows while it loads (D214, D221): Kydux's mark and "Loading…" in one row,
// the words large, and under them a bar that moves (D249): a band that sweeps while the
// screen loads, and a fill over the time a tip still holds a ready screen; and, for a
// child who has begun, a tip about the game with its picture. No screen waits for Python,
// which loads in its worker behind the screens (main.ts); a screen waits for its own code,
// texts and pictures. A tip is due at once at the visit's first wait and at a screen of a
// scene other than the one last shown; any other wait shows no tip inside the grace and
// holds nothing, and after it a tip comes up. The start screen and the welcome page are
// given no tips (D341). The next tip comes every TIP_TIME. When the screen is ready with a
// tip up, it opens by itself once the tip has had its reading time (D175), never more than
// TIP_TIME; there is no button. The tips are shown in their order, from the one after the
// last shown, which the browser keeps; after the last comes the first. A tip comes up with
// its picture (D246): the picture is loaded and decoded first, as an element, and the view
// shows that element under no second request; a tip due waits for it, a screen ready
// meanwhile opens with no tip and that tip stays the next one, and a picture that fails
// shows the words alone. The page asks for the next tip's picture when it makes Python
// (main.ts), and, as each tip comes up, for the one after it. The browser tests turn the
// tips off with a key no setting shows, read once as the page opens.

import { type Course, items, LISTS_FROM, stopState } from '../content/course';
import { readingMs } from '../engine/bubble';
import type { Progress } from '../progress/store';
import { currentLanguage, t } from '../i18n';
import { element } from './dom';
import { markSvg } from './mark';
import { contentUrl } from '../content/address';

/** How long a wait shows no tip, in milliseconds. */
export const GRACE = 2000;
/** How long a tip is up before the next, and the most a ready screen waits under it. */
export const TIP_TIME = 10_000;
/** The tips, by their key under `tips.`, in the order they are shown; a tip told from a
 * stop (TIP_FROM) comes after every tip told always, so that leaving it out moves no
 * other tip's number (D357). */
export const TIPS = [
  'notebook',
  'spells',
  'click',
  'dot',
  'hint',
  'keys',
  'timeline',
  'zoom',
  'lesson',
  'map',
  'comments',
  'lists',
] as const;
/** The tips told only from a stop of the course on (D357): among a child's tips when, in
 * the game being played, that stop is open or done. */
export const TIP_FROM: Readonly<Record<string, string>> = { lists: LISTS_FROM };

/** The tips of the game being played (D357): every tip told always, and each tip told
 * from a stop the game has open or done; none told from a stop where no game is in play
 * or the course is not known. */
export function tipsOf(course: Course | null, progress: Progress | null): string[] {
  return TIPS.filter((key) => {
    const from = TIP_FROM[key];
    if (from === undefined) return true;
    if (!course || !progress?.wizard) return false;
    return stopState(course, from, progress) !== 'locked' && items(course).includes(from);
  });
}
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

/** The tip after the last one shown, kept in the browser; the first after the last, and
 * after a number past the game's tips (D357). */
export function nextTip(storage: Kept | null, count: number): number {
  const last = Number.parseInt(storage?.getItem(LAST_TIP) ?? '', 10);
  return Number.isInteger(last) && last >= 0 && last + 1 < count ? last + 1 : 0;
}

export interface WaitOptions {
  /** Whether this child may read tips: one who has begun (a wizard made or a game
   * saved), and the tips not turned off. */
  tips: boolean;
  /** Whether a tip is due at once, with no grace (D221). */
  due?: boolean;
  storage?: Kept | null;
  /** The tips' keys, the page's own unless a test gives others; read each time a tip is
   * due when given as a function, so that a wait begun before the course is known tells
   * a tip told from a stop once it is (D357). */
  keys?: readonly string[] | (() => readonly string[]);
  /** A tip comes up, by its key, with its picture loaded, or null where it failed. */
  onTip?: (key: string, picture: HTMLImageElement | null) => void;
  /** A tip's picture loaded and decoded, or null where it fails (D246); the tip comes up
   * when it comes. A wait given none puts its tips up at once, with no picture. */
  picture?: (key: string) => Promise<HTMLImageElement | null>;
  /** How long a tip takes to read, in milliseconds (D175); TIP_TIME unless given. */
  reading?: (key: string) => number;
  /** The screen is ready and a tip up holds it this many milliseconds more (D249). */
  onHold?: (ms: number) => void;
}

/** How long a ready screen waits under a tip up: the tip's reading time, never more
 * than TIP_TIME (D221). */
export function readFor(ms: number): number {
  return Math.min(TIP_TIME, Math.max(0, ms));
}

/** One wait for a screen, its clock and its tips. */
export class Wait {
  private readonly storage: Kept | null;
  private shownAt: number | null = null;
  private readMs = TIP_TIME;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private opened = false;
  private open: (() => void) | null = null;
  /** The tip whose picture is awaited, put up when it comes (D246). */
  private awaited: string | null = null;

  constructor(private readonly options: WaitOptions) {
    this.storage = options.storage === undefined ? browserStorage() : options.storage;
    if (options.tips && this.keys.length > 0) this.timer = setTimeout(() => this.tip(), options.due ? 0 : GRACE);
  }

  /** The tips of the game being played, as they are now. */
  private get keys(): readonly string[] {
    const keys = this.options.keys;
    return typeof keys === 'function' ? keys() : (keys ?? TIPS);
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
    // A tip is up: no other comes; the screen waits for this one to be read, and the
    // view is told how long (D249).
    this.clear();
    const left = Math.max(0, this.shownAt + this.readMs - Date.now());
    this.options.onHold?.(left);
    this.timer = setTimeout(() => this.finish(), left);
  }

  /** The wait dropped: its timers stopped, nothing opened. */
  dispose(): void {
    this.opened = true;
    this.awaited = null;
    this.clear();
  }

  /** The next tip, put up once its picture has come (D246); the one up, if any, stays
   * meanwhile. */
  private tip(): void {
    const index = nextTip(this.storage, this.keys.length);
    const key = this.keys[index] ?? '';
    const picture = this.options.picture;
    if (!picture) {
      this.putUp(index, null);
      return;
    }
    this.awaited = key;
    void picture(key).then((loaded) => {
      if (this.opened || this.awaited !== key) return;
      this.awaited = null;
      this.putUp(index, loaded);
    });
  }

  /** A tip up, its picture with it: its number kept, its reading time from now, the
   * picture of the one after it asked for, and the next due in TIP_TIME. */
  private putUp(index: number, picture: HTMLImageElement | null): void {
    try {
      this.storage?.setItem(LAST_TIP, String(index));
    } catch {
      // A browser that keeps nothing shows the tips from the first each time.
    }
    this.shownAt = Date.now();
    const key = this.keys[index] ?? '';
    this.readMs = readFor(this.options.reading?.(key) ?? TIP_TIME);
    this.options.onTip?.(key, picture);
    const after = this.keys[(index + 1) % this.keys.length];
    if (after !== undefined) void this.options.picture?.(after);
    this.timer = setTimeout(() => this.tip(), TIP_TIME);
  }

  private finish(): void {
    if (this.opened || !this.open) return;
    this.opened = true;
    // A tip whose picture has not come is not put up, and its number is not kept.
    this.awaited = null;
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

/** The pictures asked for, by their address: each asked for once (D246). */
const pictures = new Map<string, Promise<HTMLImageElement | null>>();

/** A tip's picture loaded and decoded, as the element the view shows; null where it
 * fails (D246). */
export function tipPictureLoaded(key: string, language = currentLanguage()): Promise<HTMLImageElement | null> {
  const address = tipPicture(key, language);
  let loaded = pictures.get(address);
  if (!loaded) {
    const image = new Image(960, 540);
    image.alt = '';
    image.className = 'waiting-tip-picture';
    image.src = address;
    loaded = image.decode().then(
      () => image,
      () => null,
    );
    pictures.set(address, loaded);
  }
  return loaded;
}

/** The picture of the tip due next among the game's tips asked for ahead, when the page
 * makes Python (D246, D341, D357). */
export function askNextTip(keys: readonly string[] = TIPS): void {
  if (turnedOff || keys.length === 0) return;
  const key = keys[nextTip(browserStorage(), keys.length)] ?? keys[0] ?? TIPS[0];
  void tipPictureLoaded(key);
}

const SVG = 'http://www.w3.org/2000/svg';

/** A drawing pin the game draws (D358): its round head in the page's rose, a small shine
 * on it, and a short shadow under it; no file of art. */
function pin(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('class', 'tip-pin');
  svg.setAttribute('aria-hidden', 'true');
  const shape = (name: string, attributes: Record<string, string>) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    svg.append(node);
  };
  shape('ellipse', { cx: '18', cy: '22', rx: '9', ry: '4.5', fill: 'rgb(43 37 51 / 28%)' });
  shape('circle', { cx: '15', cy: '14', r: '10', fill: 'var(--rose)' });
  shape('circle', { cx: '15', cy: '14', r: '10', fill: 'none', stroke: 'var(--rose-deep)', 'stroke-width': '1.5' });
  shape('ellipse', { cx: '11.5', cy: '10.5', rx: '3.6', ry: '2.4', fill: 'rgb(255 255 255 / 70%)' });
  return svg;
}

/** Which way a tip's photograph is turned (D358): to the left at an even place in the
 * order of the tips, to the right at the next. */
export function turnOf(key: string): 'left' | 'right' {
  const place = (TIPS as readonly string[]).indexOf(key);
  return place % 2 === 0 ? 'left' : 'right';
}

/** A tip's picture shown as what it is, a photograph of the game pinned up (D358): in a
 * plain light frame with a lifted shadow, a little turned, a pin at its top edge's
 * middle; it takes no click. The picture is the element loaded first (D246). */
export function pinnedPhoto(picture: HTMLImageElement, key: string): HTMLElement {
  const photo = element('div', { className: 'tip-photo' }, [picture, pin()]);
  photo.dataset.turn = turnOf(key);
  return photo;
}

/** The waiting view: the mark and Loading… in a row, the bar under them (D249), and the
 * tip's place, hidden until a tip comes up with its picture loaded, then the picture
 * over its words (D246), shown as a photograph pinned up (D358). */
export function waitingView(
  tips: boolean,
  due = false,
  keys: readonly string[] | (() => readonly string[]) = TIPS,
): Waiting {
  const words = element('p', { id: 'waiting-tip', className: 'waiting-tip' });
  words.setAttribute('aria-live', 'polite');
  const tip = element('figure', { className: 'waiting-tip-box', hidden: true }, [words]);
  const bar = element('div', { id: 'waiting-bar', className: 'waiting-bar' }, [element('span', { className: 'waiting-bar-fill' })]);
  bar.setAttribute('aria-hidden', 'true');
  const node = element('div', { id: 'waiting', className: 'waiting' }, [
    element('div', { className: 'waiting-head' }, [markSvg(44), element('p', { className: 'waiting-loading' }, [t('waiting.loading')])]),
    bar,
    tip,
  ]);
  const wait = new Wait({
    tips: tips && !turnedOff,
    due,
    keys,
    reading: (key) => readingMs(t(`tips.${key}`).replace(/[*`]/g, '')),
    picture: (key) => tipPictureLoaded(key),
    // The loaded picture, pinned up, over the words, which stay straight; the words alone
    // where it failed, with no frame, no pin and no room kept for it.
    onTip: (key, picture) => {
      words.replaceChildren(...tipNodes(t(`tips.${key}`)));
      tip.replaceChildren(...(picture ? [pinnedPhoto(picture, key)] : []), words);
      tip.hidden = false;
      node.dataset.tip = key;
    },
    // The bar fills over the time the tip still holds the ready screen (D249).
    onHold: (ms) => {
      node.dataset.hold = String(Math.round(ms));
      bar.style.setProperty('--hold', `${Math.round(ms)}ms`);
    },
  });
  return { node, wait };
}
