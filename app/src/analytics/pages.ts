// What is counted of a visit (D328), as plain values: the page a screen is counted as,
// GoatCounter's address for it, and what a visit to a level tells: each run as it ends,
// each hint read (D334), and the visit itself when it is won or left. A page is named
// by its screen and its id in the course, the same in every language, and never by
// anything the child wrote.

import type { Site } from './site';

/** A screen as it is counted: a path, a title, and the level it is, if it is one. */
export interface Page {
  path: string;
  title: string;
  level?: string;
}

const SCREENS = ['map', 'settings', 'wizard', 'about'];
const ID = /^[a-z0-9][a-z0-9-]*$/;

/** The page an address is counted as: `#level/<id>` as `/level/<id>`, a lesson read
 * again from a level as the lesson, any address that names no screen as `/start`, or
 * as `/about` for a `newcomer`, who is shown the welcome page there. */
export function pageOf(hash: string, newcomer = false): Page {
  const [name = '', id = ''] = hash.replace(/^#/, '').split('/');
  if ((name === 'level' || name === 'lesson' || name === 'story') && ID.test(id)) {
    const path = `/${name}/${id}`;
    return { path, title: `${name} ${id}`, ...(name === 'level' ? { level: id } : {}) };
  }
  const screen = SCREENS.includes(name) && id === '' ? name : newcomer ? 'about' : 'start';
  return { path: `/${screen}`, title: screen };
}

export interface GoatHit {
  /** The path counted, the site's prefix before it. */
  path: string;
  title: string;
  /** An event, a thing that happened, rather than a page seen. */
  event?: boolean;
  /** Where the visitor came from; told with the first page alone. */
  referrer?: string;
  /** The screen: width, height and scale. */
  screen?: readonly [number, number, number];
  /** A number that keeps a browser from answering from its cache. */
  random: string;
}

/** GoatCounter's address that counts a hit, asked for as an image: it needs no script
 * of GoatCounter's in the page and keeps nothing in the browser. */
export function goatUrl(site: Site, hit: GoatHit): string {
  const query = new URLSearchParams({ p: `${site.prefix}${hit.path}`, t: hit.title });
  if (hit.event) query.set('e', 'true');
  if (hit.referrer) query.set('r', hit.referrer);
  if (hit.screen) query.set('s', hit.screen.join(','));
  query.set('rnd', hit.random);
  return `${site.goatcounter}?${query.toString()}`;
}

/** What a visit to a level tells: the level, the seconds played in it, the programs
 * run, and with a win the hints read and the stars earned. */
export interface LevelTold {
  level: string;
  seconds: number;
  runs: number;
  hints?: number;
  stars?: number;
}

/** What a run tells as it ends (D334): the level, the seconds played in it so far, the
 * programs run with this one, how the run ended, and the kind of its error when it
 * ended in one. */
export interface RunTold {
  level: string;
  seconds: number;
  runs: number;
  result: string;
  error_kind?: string;
}

/** What a hint read tells (D334): the level, the seconds played in it so far, the
 * programs run before it, and the hints read with this one. */
export interface HintTold {
  level: string;
  seconds: number;
  runs: number;
  hints: number;
}

/** Python's own errors a program of the course can end in: their names are told as
 * they are. */
const PYTHON_ERRORS = new Set([
  'ArithmeticError',
  'AssertionError',
  'AttributeError',
  'ImportError',
  'IndentationError',
  'IndexError',
  'KeyError',
  'LookupError',
  'ModuleNotFoundError',
  'NameError',
  'NotImplementedError',
  'OverflowError',
  'RecursionError',
  'RuntimeError',
  'StopIteration',
  'SyntaxError',
  'TabError',
  'TypeError',
  'UnboundLocalError',
  'ValueError',
  'ZeroDivisionError',
]);

/** The kind an error is told as: the world's own kind for it, the one its explanation
 * to the child goes by (`missing_colon`, `unknown_name`); for an error the world has no
 * kind for, Python's name of it; `other` for anything else. A class of the child's own
 * is a name the child wrote, and is never told. */
export function errorKind(error: { type: string; explanation?: { kind: string } | null }): string {
  const kind = error.explanation?.kind ?? 'other';
  if (kind !== 'other' && /^[a-z][a-z_]*$/.test(kind)) return kind;
  return PYTHON_ERRORS.has(error.type) ? error.type : 'other';
}

/** A visit to a level, from its opening to the child's leaving: each run and each hint
 * is told as it happens, and the visit is told once, as won at its first win or as left
 * when the child leaves without one. */
export class LevelVisit {
  private seconds = 0;
  private runs = 0;
  private told = false;

  constructor(readonly level: string) {}

  /** Seconds played here: the page's play time, counted while the child is at it. */
  played(seconds: number): void {
    this.seconds += seconds;
  }

  ran(): void {
    this.runs += 1;
  }

  /** A run as it ended: `result` is its outcome's kind, `error` the kind of its error. */
  ended(result: string, error?: string): RunTold {
    const told = { level: this.level, seconds: this.seconds, runs: this.runs, result };
    return error ? { ...told, error_kind: error } : told;
  }

  /** A hint read: `hints` counts the hints read with it. */
  hinted(hints: number): HintTold {
    return { level: this.level, seconds: this.seconds, runs: this.runs, hints };
  }

  /** The visit as won, or null when it has been told already. */
  won(stars: number, hints: number): LevelTold | null {
    if (this.told) return null;
    this.told = true;
    return { level: this.level, seconds: this.seconds, runs: this.runs, hints, stars };
  }

  /** The visit as left, or null when it has been told already. */
  left(): LevelTold | null {
    if (this.told) return null;
    this.told = true;
    return { level: this.level, seconds: this.seconds, runs: this.runs };
  }
}
