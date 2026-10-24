// Loading a story (D74): its staging, story.json, which pack-world gives the
// world it is played in, and its words in the player's language,
// text.<lang>.json, from content/stories/<id>/. And the scene's events for its
// steps: each step's action played as the world's events would be, then its
// words said in a bubble, or by the voice under the scene.

import type { Facing, Tile } from '../engine/sight';
import { fallbackLanguage, forWizard, type Language } from '../i18n';
import type { LevelJson, WorldEvent } from '../runtime/protocol';

/** What a step does before its words: a walk in a straight line, a turn, an
 * appearing, a vanishing once the words are said. */
export type Doing = null | { walk: Tile } | { face: Facing } | { appear: Tile } | { vanish: true };

export interface StoryStep {
  /** Who says the words: `voice`, under the scene; `wizard`; or an actor's id. */
  who: string;
  do: Doing;
  /** Who does the action when it is not the speaker, as when the voice tells it. */
  by?: string;
  text: string;
}

export interface Story {
  id: string;
  title: string;
  steps: StoryStep[];
  /** The scene the story is played on, with the wizard and the actors placed. */
  world: LevelJson;
  /** The tile the camera stays on. */
  camera: Tile;
  /** The game's opening, before the course (D61). */
  opening?: boolean;
  /** Who tells the story, for the map and the characters' names (D67). */
  speaker?: string;
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
  opening?: boolean;
  speaker?: string;
}

async function json<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  // A missing file comes back as the page itself, in HTML.
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
  return (await response.json()) as T;
}

export async function loadStory(id: string, lang: Language): Promise<Story> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new StoryNotFound(id);
  const url = (file: string) => `${import.meta.env.BASE_URL}content/stories/${id}/${file}`;
  const staging = await json<StoryJson>(url('story.json'));
  if (!staging) throw new StoryNotFound(id);
  const text =
    (await json<{ title: string; steps: string[] }>(url(`text.${lang}.json`))) ??
    (await json<{ title: string; steps: string[] }>(url(`text.${fallbackLanguage}.json`)));
  if (!text) throw new StoryNotFound(id);
  return {
    id,
    // The wizard's words go in as the text is read (D37).
    title: forWizard(text.title),
    steps: staging.steps.map((step, index) => ({ ...step, text: forWizard(text.steps[index] ?? '') })),
    world: staging.world,
    camera: staging.camera,
    ...(staging.opening === true ? { opening: true } : {}),
    ...(typeof staging.speaker === 'string' ? { speaker: staging.speaker } : {}),
  };
}

/** The scene's events for a story, and for each step the ticks it plays: from
 * `first` to `last`, both included (a step with no tick of its own has `last`
 * one before `first`). Every tick has an event, so that tick n is the
 * playback's n-th. */
export function storyEvents(story: Pick<Story, 'steps' | 'world'>): {
  events: WorldEvent[];
  spans: { first: number; last: number }[];
} {
  const where = new Map<string, Tile>();
  const start = (story.world.map as string[] | undefined) ?? [];
  start.forEach((row, y) => {
    const x = row.indexOf('S');
    if (x >= 0) where.set('wizard', [x, y]);
  });
  for (const actor of (story.world.actors as { id: string; at?: Tile }[] | undefined) ?? []) {
    if (actor.at) where.set(actor.id, actor.at);
  }
  const events: WorldEvent[] = [];
  const spans: { first: number; last: number }[] = [];
  let tick = 1;
  let vanishing: string | null = null;
  const add = (actor: string, kind: string, data: Record<string, unknown>) => {
    events.push({ tick, actor, kind, data, line: null });
    tick += 1;
  };
  for (const step of story.steps) {
    const first = tick;
    // Who vanished at the step before goes as this one begins.
    if (vanishing) add(vanishing, 'vanish', {});
    vanishing = null;
    const doer = step.by ?? step.who;
    const doing = step.do;
    if (doing && 'walk' in doing) {
      let [x, y] = where.get(doer) ?? doing.walk;
      const [tx, ty] = doing.walk;
      const way: Facing = tx > x ? 'right' : tx < x ? 'left' : ty > y ? 'down' : 'up';
      while (x !== tx || y !== ty) {
        const from: Tile = [x, y];
        x += Math.sign(tx - x);
        y += Math.sign(ty - y);
        add(doer, 'move', { from, to: [x, y], facing: way });
      }
      where.set(doer, [tx, ty]);
    } else if (doing && 'face' in doing) {
      add(doer, 'turn', { facing: doing.face });
    } else if (doing && 'appear' in doing) {
      add(doer, 'appear', { at: doing.appear });
      where.set(doer, doing.appear);
    } else if (doing && 'vanish' in doing) {
      vanishing = doer;
    }
    if (step.who !== 'voice') add(step.who, 'say', { text: step.text });
    spans.push({ first, last: tick - 1 });
  }
  return { events, spans };
}
