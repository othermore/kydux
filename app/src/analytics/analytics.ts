// The published game counts how it is used (D328): each screen seen, as a page named by
// its id in the course, and each visit to a level, with the seconds played in it, the
// programs run, the hints read and the stars earned. Google Analytics gets them where
// the cookies are accepted, and is loaded only there; GoatCounter, which keeps nothing
// in the browser, gets the pages and the wins whatever the answer. On any other host
// nothing here does anything: every function returns at once.

import { accepted } from './consent';
import { goatUrl, type LevelTold, LevelVisit, type Page, pageOf } from './pages';
import { published, SITE } from './site';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

let started = false;
let goatFirst = true;
let lastPath: string | null = null;
let visit: LevelVisit | null = null;
let language: () => string = () => '';
let newcomer: () => boolean = () => false;

/** Google's tag is a queue its script reads; each entry is an `arguments` object, which
 * the script tells from an array. Where the cookies are refused there is no queue, and
 * nothing is kept for Google. */
function gtag(..._entry: unknown[]): void {
  window.dataLayer?.push(arguments);
}

function origin(): string {
  return `https://${SITE.hosts[0]}`;
}

/** A hit to GoatCounter: a page seen or, as an event, a thing that happened. */
export function goat(page: Pick<Page, 'path' | 'title'>, event = false): void {
  if (!published()) return;
  const picture = new Image();
  picture.src = goatUrl(SITE, {
    ...page,
    event,
    // The first page says where the visitor came from; the pages after it came from
    // the game itself.
    ...(goatFirst && document.referrer ? { referrer: document.referrer } : {}),
    screen: [window.screen.width, window.screen.height, window.devicePixelRatio || 1],
    random: Math.random().toString(36).slice(2),
  });
  goatFirst = false;
}

function tell(name: 'level_won' | 'level_left', told: LevelTold): void {
  gtag('event', name, { ...told, game_language: language() });
}

function leave(): void {
  const told = visit?.left();
  visit = null;
  if (told) tell('level_left', told);
}

function see(hash: string): void {
  const page = pageOf(hash, newcomer());
  if (page.path === lastPath) return;
  leave();
  lastPath = page.path;
  // Every event from here on is of this page: the time Google counts on a page, and a
  // level's win, are told of the screen's name and never of the document's own title.
  const named = { page_location: `${origin()}${page.path}`, page_title: page.title };
  gtag('set', named);
  gtag('event', 'page_view', { ...named, game_language: language() });
  goat(page);
  if (page.level) visit = new LevelVisit(page.level);
}

function loadGoogle(): void {
  window.dataLayer = window.dataLayer ?? [];
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  // The page is one document with many screens: each screen is sent as a page here.
  gtag('config', SITE.analytics, { send_page_view: false });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${SITE.analytics}`;
  document.head.append(tag);
}

/** Starts the counting, once the notice about cookies is answered: the screen on the
 * page is counted, and every screen after it; with a yes, Google's tag is loaded first.
 * `gameLanguage` says the language the game is read in, `isNewcomer` whether the child
 * has never played: the start screen is the welcome page then. */
export function start(gameLanguage: () => string, isNewcomer: () => boolean): void {
  if (started || !published()) return;
  started = true;
  language = gameLanguage;
  newcomer = isNewcomer;
  if (accepted()) loadGoogle();
  window.addEventListener('hashchange', () => see(location.hash));
  // A page that is left tells the level it was on; one that comes back is seen again.
  window.addEventListener('pagehide', leave);
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    lastPath = null;
    see(location.hash);
  });
  see(location.hash);
}

/** Seconds played, by the page's own count of play time. */
export function played(seconds: number): void {
  visit?.played(seconds);
}

/** A program run in a level. */
export function ran(level: string): void {
  if (visit?.level === level) visit.ran();
}

/** A level won, with the stars earned and the hints read. */
export function won(level: string, stars: number, hints: number): void {
  if (visit?.level !== level) return;
  const told = visit.won(stars, hints);
  if (!told) return;
  tell('level_won', told);
  goat({ path: `/won/${level}`, title: `won ${level}` }, true);
}
