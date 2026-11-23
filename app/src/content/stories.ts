// Loading a story (D74): its staging, story.json, which pack-world gives the
// world it is played in, and its words in the player's language,
// text.<lang>.json, from content/stories/<id>/. And the scene's events for its
// steps: each step's actions played as the world's events would be, the figures'
// at once (D103), then its words said in a bubble, or by the voice under the
// scene; a door's leaf, opening, moves whoever stands where it comes to lie
// (D125). The opening's first steps may be told over its still (`still`, D251), the
// first of them holding its letter before it (`letter`, D257). And the theme a step is
// told to, which the story or one of its steps may name (`music`, D314): a theme, or a
// theme and a movement of it, `the-truth/revelation` (D316), given to the music as
// written.

import type { Facing, Tile } from '../engine/sight';
import { fallbackLanguage, forWizard, type Language } from '../i18n';
import type { LevelJson, WorldEvent } from '../runtime/protocol';
import { contentUrl } from './address';

/** One thing a figure does in a step (D103), by its `by`, the step's, or the
 * speaker: a walk to a tile or through a list of them, each in a straight line,
 * ending out of sight when it says `vanish`; a turn; an appearing, maybe stepping
 * out `from` behind a thing on a cell beside (D128); a vanishing
 * (a speaker's once its words are said); lying down asleep in a bed and waking
 * (D91); opening or closing a door; standing up, seated, and sitting down; and
 * bringing a thing staged hidden into sight on its cell (D279). */
export type Action = { by?: string } & (
  | { walk: Tile | Tile[]; vanish?: true }
  | { fly: Tile | Tile[] }
  | { land: true }
  | { face: Facing }
  | { appear: Tile; from?: Tile; flying?: true }
  | { vanish: true }
  | { sleep: string }
  | { wake: true }
  | { open: string }
  | { close: string }
  | { stand: true }
  | { sit: true }
  | { show: string }
);

/** What a step does before its words: nothing, one action, or a list of them. */
export type Doing = null | Action | Action[];

export interface StoryStep {
  /** Who says the words: `voice`, under the scene; `wizard`; or an actor's id. */
  who: string;
  do: Doing;
  /** Who does the actions when they do not say, and who the camera keeps with:
   * the speaker when it is not given. */
  by?: string;
  text: string;
  /** The place the step frames (D199): a box of cells, or the scene's width. */
  camera?: { fit?: [[number, number], [number, number]]; wide?: boolean };
  /** Told over the story's still, the scene behind it (D251): the opening's first steps,
   * the voice's, doing nothing. */
  still?: boolean;
  /** Holds the story's letter before its still (D257): the first steps over the still. */
  letter?: boolean;
  /** A figure's words said as the step begins, its actions played under them (D275):
   * someone speaks while someone else is still on their way. */
  meanwhile?: boolean;
  /** The theme the story is told to from this step on (D314), or a theme and a
   * movement of it after a slash (D316). */
  music?: string;
}

/** A part of a story told on another scene (39.4): from its first step on, the
 * story goes on in this world, with this camera, light and figures in the air. */
export interface StoryPart {
  step: number;
  world: LevelJson;
  camera: Tile;
  light?: 'morning' | 'sunset';
  flying?: string[];
  /** Opened after time has passed: the scene gone dark and back (D280). */
  later?: boolean;
}

export interface Story {
  id: string;
  title: string;
  steps: StoryStep[];
  /** Words said on the dark before a part that opens after time has passed, by its first
   * step's index (D309). */
  later?: Record<number, string>;
  /** The scene the story is played on, with the wizard and the actors placed. */
  world: LevelJson;
  /** The tile the camera starts on, before any step (D74). */
  camera: Tile;
  /** The light the story is told under, besides its scene's own (D124). */
  light?: 'morning' | 'sunset';
  /** Who is in the air on a broom when the story starts (D185). */
  flying?: string[];
  /** The parts told on another scene, in order (39.4). */
  parts?: StoryPart[];
  /** The game's opening, before the course (D61). */
  opening?: boolean;
  /** The still a story's last steps are told over, the welcome's painting of the castle
   * (D251, `the-end-of-the-year`). */
  still?: 'castle';
  /** Who tells the story, for the map and the characters' names (D67). */
  speaker?: string;
  /** The theme the story opens to, in the place of its chapter's (D314), or a theme
   * and a movement of it after a slash (D316). */
  music?: string;
}

export class StoryNotFound extends Error {
  constructor(readonly id: string) {
    super(`no story ${id}`);
  }
}

interface StoryJson {
  id: string;
  steps: Omit<StoryStep, 'text'>[];
  world: LevelJson;
  camera: Tile;
  light?: string;
  flying?: string[];
  parts?: StoryPart[];
  opening?: boolean;
  speaker?: string;
  still?: string;
  music?: string;
}

async function json<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  // A missing file comes back as the page itself, in HTML.
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
  return (await response.json()) as T;
}

export async function loadStory(id: string, lang: Language): Promise<Story> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new StoryNotFound(id);
  const url = (file: string) => contentUrl(`stories/${id}/${file}`);
  const staging = await json<StoryJson>(url('story.json'));
  if (!staging) throw new StoryNotFound(id);
  type Text = { title: string; steps: string[]; later?: Record<string, string> };
  const text = (await json<Text>(url(`text.${lang}.json`))) ?? (await json<Text>(url(`text.${fallbackLanguage}.json`)));
  if (!text) throw new StoryNotFound(id);
  // The words on the dark are keyed by the step's number, counted from 1 (D309).
  const later = Object.entries(text.later ?? {}).map(([step, words]) => [Number(step) - 1, forWizard(words)] as const);
  return {
    id,
    // The wizard's words go in as the text is read (D37).
    title: forWizard(text.title),
    steps: staging.steps.map((step, index) => ({ ...step, text: forWizard(text.steps[index] ?? '') })),
    world: staging.world,
    camera: staging.camera,
    ...(staging.light === 'morning' || staging.light === 'sunset' ? { light: staging.light } : {}),
    ...(Array.isArray(staging.flying) ? { flying: staging.flying.map(String) } : {}),
    ...(Array.isArray(staging.parts) ? { parts: staging.parts } : {}),
    ...(staging.opening === true ? { opening: true } : {}),
    ...(typeof staging.speaker === 'string' ? { speaker: staging.speaker } : {}),
    ...(staging.still === 'castle' ? { still: 'castle' as const } : {}),
    ...(typeof staging.music === 'string' ? { music: staging.music } : {}),
    ...(later.length > 0 ? { later: Object.fromEntries(later) } : {}),
  };
}

/** The theme in force at a step (D314), with its movement where one is named (D316):
 * the last one a step up to it names, else the story's own, else `chapter`'s, the theme
 * its chapter plays. So going back over a step that changed the theme, or its movement,
 * brings back the one before it. */
export function themeAt(
  story: Pick<Story, 'steps' | 'music'>,
  step: number,
  chapter: string | undefined,
): string | undefined {
  for (let index = Math.min(step, story.steps.length - 1); index >= 0; index -= 1) {
    const named = story.steps[index]?.music;
    if (named) return named;
  }
  return story.music ?? chapter;
}

/** A step's actions as a list. */
export function actionsOf(doing: Doing | undefined): Action[] {
  if (!doing) return [];
  return Array.isArray(doing) ? doing : [doing];
}

/** A walk's tiles: one, or the list it goes through. */
function waypoints(walk: Tile | Tile[]): Tile[] {
  return Array.isArray(walk[0]) ? (walk as Tile[]) : [walk as Tile];
}

/** The scene's events for a story, and for each step the ticks it plays: from
 * `first` to `last`, both included (a step with no tick of its own has `last`
 * one before `first`). Every tick has an event, so that tick n is the
 * playback's n-th. A step's actions are each figure's in turn, and the figures
 * play at once (D103): at each tick, each figure with an event left plays its
 * next, in the order the figures are first named. In a step where a familiar walks,
 * its ticks are played in half the time, given in `lengths` by their numbers: a
 * familiar's step takes one, and every other doing two, a person's step saying its
 * `ticks` and the second a `wait` (D277). An event of a figure other
 * than the step's `by`, or its speaker, says `aside`, for the camera to keep
 * with the one the step is about. A figure's words come after its step's actions,
 * or, in a step that says `meanwhile`, in the tick of the first of them (D275). */
export function storyEvents(story: Pick<Story, 'steps' | 'world' | 'flying'>): {
  events: WorldEvent[];
  spans: { first: number; last: number }[];
  lengths: Map<number, number>;
} {
  // The familiars of the story, whose steps are quick (D277).
  const familiars = new Set(
    ((story.world.actors as { id: string; kind?: string }[] | undefined) ?? [])
      .filter((actor) => actor.kind === 'familiar')
      .map((actor) => actor.id),
  );
  const lengths = new Map<number, number>();
  const where = new Map<string, Tile>();
  // Who is in the air, the staging's at first (D185).
  const aloft = new Set<string>(story.flying ?? []);
  const start = (story.world.map as string[] | undefined) ?? [];
  start.forEach((row, y) => {
    const x = row.indexOf('S');
    if (x >= 0) where.set('wizard', [x, y]);
  });
  for (const actor of (story.world.actors as { id: string; at?: Tile }[] | undefined) ?? []) {
    if (actor.at) where.set(actor.id, actor.at);
  }
  const beds = new Map<string, Tile>();
  const doors = new Map<string, { at: Tile; covers: Tile[] }>();
  const opened = new Set<string>();
  // Where each thing a figure may bring into sight lies (D279).
  const shownAt = new Map<string, Tile>();
  type Placed = { id: string; kind?: string; at?: Tile; open?: boolean; covers?: { open?: Tile[] } };
  for (const thing of (story.world.things as Placed[] | undefined) ?? []) {
    if (thing.at) shownAt.set(thing.id, thing.at);
    if (thing.kind === 'bed' && thing.at) beds.set(thing.id, thing.at);
    if (thing.kind === 'door' && thing.at) {
      doors.set(thing.id, { at: thing.at, covers: thing.covers?.open ?? [] });
      if (thing.open === true) opened.add(thing.id);
    }
  }
  // Where each figure in sight stands as the events play, for an opening door's
  // leaf to move whoever stands on it (D125).
  const standing = new Map(where);
  const same = (one: Tile, other: Tile) => one[0] === other[0] && one[1] === other[1];
  const underLeaf = (tile: Tile) => [...opened].some((id) => doors.get(id)?.covers.some((cell) => same(cell, tile)));
  const shut = (tile: Tile) => [...doors].some(([id, door]) => !opened.has(id) && same(door.at, tile));
  const floor = ([x, y]: Tile) => {
    const char = start[y]?.[x];
    return char !== undefined && char !== '#' && char !== '=';
  };
  const events: WorldEvent[] = [];
  const spans: { first: number; last: number }[] = [];
  let tick = 1;
  let vanishing: string | null = null;
  /** Whoever stands on a door's leaf as it opens steps to the nearest free tile
   * of the row, away from the door, as the world's staging check moves them. */
  const shove = (id: string) => {
    const door = doors.get(id);
    if (!door) return;
    for (const [who, at] of [...standing]) {
      if (!door.covers.some((cell) => same(cell, at))) continue;
      const away = at[0] < door.at[0] ? -1 : 1;
      let to: Tile | null = null;
      for (const along of [away, -away]) {
        for (let x = at[0] + along; !to && floor([x, at[1]]) && !shut([x, at[1]]); x += along) {
          const tile: Tile = [x, at[1]];
          const taken = [...standing].some(([other, there]) => other !== who && same(there, tile));
          if (!underLeaf(tile) && !taken) to = tile;
        }
        if (to) break;
      }
      if (!to) continue;
      events.push({ tick, actor: id, kind: 'shoved', data: { id: who, from: at, to, by: id }, line: null });
      standing.set(who, to);
      where.set(who, to);
    }
  };
  /** What an event does to who stands where and which doors are open. */
  const played = (actor: string, kind: string, data: Record<string, unknown>) => {
    if (kind === 'move') standing.set(actor, data.to as Tile);
    else if (kind === 'appear') standing.set(actor, data.at as Tile);
    else if (kind === 'vanish') standing.delete(actor);
    else if (kind === 'close') opened.delete(String(data.id));
    else if (kind === 'open') {
      opened.add(String(data.id));
      shove(String(data.id));
    }
  };
  const add = (actor: string, kind: string, data: Record<string, unknown>) => {
    events.push({ tick, actor, kind, data, line: null });
    played(actor, kind, data);
    tick += 1;
  };
  for (const step of story.steps) {
    const first = tick;
    // Who vanished at the step before goes as this one begins.
    if (vanishing) add(vanishing, 'vanish', {});
    vanishing = null;
    const about = step.by ?? step.who;
    const queues = new Map<string, { kind: string; data: Record<string, unknown> }[]>();
    for (const action of actionsOf(step.do)) {
      const doer = action.by ?? about;
      if ('vanish' in action && !('walk' in action) && doer === step.who && step.who !== 'voice') {
        // Who goes says its words first.
        vanishing = doer;
        continue;
      }
      const queue = queues.get(doer) ?? [];
      queues.set(doer, queue);
      const aside = doer !== about ? { aside: true } : {};
      if ('walk' in action || 'fly' in action) {
        // A flight lifts the broom first, once, and every step of it is flown (D185).
        const route = 'fly' in action ? action.fly : action.walk;
        const flown = 'fly' in action ? { flying: true } : {};
        if ('fly' in action && !aloft.has(doer)) {
          aloft.add(doer);
          queue.push({ kind: 'fly', data: { id: doer, ...aside } });
        }
        let [x, y] = where.get(doer) ?? waypoints(route)[0] ?? [0, 0];
        for (const [tx, ty] of waypoints(route)) {
          const way: Facing = tx > x ? 'right' : tx < x ? 'left' : ty > y ? 'down' : 'up';
          while (x !== tx || y !== ty) {
            const from: Tile = [x, y];
            x += Math.sign(tx - x);
            y += Math.sign(ty - y);
            queue.push({ kind: 'move', data: { from, to: [x, y], facing: way, ...flown, ...aside } });
          }
        }
        where.set(doer, [x, y]);
        if ('walk' in action && action.vanish) queue.push({ kind: 'vanish', data: { ...aside } });
      } else if ('land' in action) {
        aloft.delete(doer);
        queue.push({ kind: 'land', data: { id: doer, ...aside } });
      } else if ('face' in action) {
        queue.push({ kind: 'turn', data: { facing: action.face, ...aside } });
      } else if ('appear' in action) {
        const from = action.from ? { from: action.from } : {};
        if (action.flying && !aloft.has(doer)) {
          aloft.add(doer);
          queue.push({ kind: 'fly', data: { id: doer, ...aside } });
        }
        queue.push({ kind: 'appear', data: { at: action.appear, ...from, ...aside } });
        where.set(doer, action.appear);
      } else if ('vanish' in action) {
        queue.push({ kind: 'vanish', data: { ...aside } });
      } else if ('sleep' in action) {
        queue.push({
          kind: 'sleep',
          data: { id: action.sleep, at: where.get(doer) ?? null, bed: beds.get(action.sleep) ?? null, ...aside },
        });
      } else if ('wake' in action) {
        queue.push({ kind: 'wake', data: { at: where.get(doer) ?? null, ...aside } });
      } else if ('open' in action) {
        queue.push({ kind: 'open', data: { id: action.open, ...aside } });
      } else if ('close' in action) {
        queue.push({ kind: 'close', data: { id: action.close, ...aside } });
      } else if ('stand' in action) {
        queue.push({ kind: 'stand', data: { ...aside } });
      } else if ('sit' in action) {
        queue.push({ kind: 'sit', data: { ...aside } });
      } else if ('show' in action) {
        // A thing staged hidden comes into sight as a thing found does (D184, D279).
        const at = shownAt.get(action.show);
        queue.push({ kind: 'found', data: { ids: [action.show], ...(at ? { at: [at] } : {}), ...aside } });
      }
    }
    // Words said as the step begins, in the tick of its first actions (D275).
    const under = step.meanwhile === true && step.who !== 'voice' && [...queues.values()].some((queue) => queue.length > 0);
    if (under) events.push({ tick, actor: step.who, kind: 'say', data: { text: step.text }, line: null });
    // Where a familiar walks, the step is played in half ticks (D277).
    const quick = [...queues].some(
      ([actor, queue]) => familiars.has(actor) && queue.some((next) => next.kind === 'move' && next.data.flying !== true),
    );
    const busy = new Map<string, number>();
    while ([...queues.values()].some((queue) => queue.length > 0)) {
      for (const [actor, queue] of queues) {
        if ((busy.get(actor) ?? 0) > tick) {
          // A person's second half of a doing, in a step where a familiar walks.
          events.push({ tick, actor, kind: 'wait', data: { ...(actor !== about ? { aside: true } : {}) }, line: null });
          continue;
        }
        const next = queue.shift();
        if (!next) continue;
        const slow = quick && !(familiars.has(actor) && next.kind === 'move');
        if (slow) busy.set(actor, tick + 2);
        const data = slow && next.kind === 'move' ? { ...next.data, ticks: 2 } : next.data;
        // The wizard's broom lifts and lands as the world's own events do, noted by
        // the broom, so that the scene plays them as a flight and not as a step (D185).
        const broom = actor === 'wizard' && (next.kind === 'fly' || next.kind === 'land');
        // A thing brought into sight is the world's event, as a thing found is (D184, D279).
        const by = next.kind === 'found' ? 'world' : broom ? 'broom' : actor;
        events.push({ tick, actor: by, kind: next.kind, data, line: null });
        played(actor, next.kind, data);
      }
      if (quick) lengths.set(tick, 0.5);
      tick += 1;
    }
    // The last doings' second halves.
    while (quick && [...busy.values()].some((until) => until > tick)) {
      for (const [actor, until] of busy) {
        if (until > tick) events.push({ tick, actor, kind: 'wait', data: { ...(actor !== about ? { aside: true } : {}) }, line: null });
      }
      lengths.set(tick, 0.5);
      tick += 1;
    }
    if (step.who !== 'voice' && !under) add(step.who, 'say', { text: step.text });
    spans.push({ first, last: tick - 1 });
  }
  return { events, spans, lengths };
}
