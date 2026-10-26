// The map of the course: each chapter as a path of stops, top to bottom, a book
// for a lesson and a door for a level. A stop is done, open or locked (D34); an
// open or done stop opens its item, a locked one does not, and the locked stops
// after the first are unnamed: their kind and number show, not what they hold
// (D71). From a level the map opens over it, marks the stop played, and closes
// back to it; choosing a stop from there goes through the level's own question.
// In the tester's mode (?debug) every stop opens and is named, for a tester to
// go straight to any of them.

import { type Course, itemHash, parseItem, stopState } from '../content/course';
import { debugging } from '../engine/debugging';
import { t } from '../i18n';
import { MAX_STARS, type Progress } from '../progress/store';
import { element } from './dom';
import type { Screen } from './screen';

export interface MapScreenParts {
  course: Course;
  progress: Progress;
  /** Every item's title, and every chapter's, in the language now set. */
  titles: Map<string, string>;
  /** Every numbered item's number in words, *Lesson 3* (D56). */
  numbers: Map<string, string>;
  chapterTitles: Map<string, string>;
  /** The item being played, marked *You are here* (D71). */
  here?: string;
  /** The map over a level: Back closes it, and a stop chosen is handed over. */
  overlay?: { onClose: () => void; onGo: (hash: string) => void };
}

function stateWords(state: string): string {
  switch (state) {
    case 'done':
      return t('map.done');
    case 'open':
      return t('map.open');
    default:
      return t('map.locked');
  }
}

export function mapScreen(parts: MapScreenParts): Screen {
  const { course, progress } = parts;
  const node = element('div', { className: 'map-screen' });
  const draw = () => {
    // Only the first locked stop is named: what lies further on is a surprise.
    let lockedSeen = 0;
    const testing = debugging();
    const chapters = course.chapters.map((chapter) => {
      const stops = chapter.items.map((item) => {
        const parsed = parseItem(item);
        const state = stopState(course, item, progress);
        if (state === 'locked') lockedSeen += 1;
        const unnamed = state === 'locked' && lockedSeen > 1 && !testing;
        const closed = state === 'locked' && !testing;
        const title = unnamed ? '?' : (parts.titles.get(item) ?? parsed?.id ?? item);
        const stars = parsed?.kind === 'level' ? (progress.levels[parsed.id]?.stars ?? 0) : 0;
        const icon = element('span', { className: `stop-icon ${parsed?.kind ?? 'level'}` });
        icon.setAttribute('aria-hidden', 'true');
        const number = parts.numbers.get(item);
        const label = element('span', { className: 'stop-title' }, [
          ...(number ? [element('span', { className: 'stop-number' }, [number]), ' '] : []),
          title,
        ]);
        const extra =
          state === 'done' && parsed?.kind === 'level'
            ? [element('span', { className: 'stop-stars' }, ['★'.repeat(stars) + '☆'.repeat(MAX_STARS - stars)])]
            : [];
        const here = item === parts.here;
        const body = [
          icon,
          label,
          ...extra,
          ...(here ? [element('span', { className: 'stop-here' }, [t('map.here')])] : []),
        ];
        const stop = closed
          ? element('span', { className: 'stop-body' }, body)
          : element('a', { className: 'stop-body', href: itemHash(item) }, body);
        stop.setAttribute('aria-label', `${title}: ${stateWords(state)}`);
        if (parts.overlay && !closed) {
          const { onGo } = parts.overlay;
          stop.addEventListener('click', (event) => {
            event.preventDefault();
            onGo(itemHash(item));
          });
        }
        const li = element('li', { className: 'stop' }, [stop]);
        li.dataset.state = state;
        li.dataset.item = item;
        if (unnamed) li.dataset.unnamed = 'true';
        if (here) li.dataset.here = 'true';
        return li;
      });
      return element('section', { className: 'map-chapter' }, [
        element('h2', {}, [parts.chapterTitles.get(chapter.id) ?? chapter.id]),
        element('ol', { className: 'stops' }, stops),
      ]);
    });
    const back = parts.overlay
      ? element('button', { id: 'map-close', type: 'button', className: 'quiet-button' }, [t('map.back_level')])
      : element('a', { id: 'map-back', className: 'quiet-button', href: '#start' }, [t('map.back')]);
    if (parts.overlay) back.addEventListener('click', parts.overlay.onClose);
    node.replaceChildren(back, ...chapters);
  };
  draw();
  // From a level, the map opens on the stop being played.
  queueMicrotask(() => node.querySelector('[data-here="true"]')?.scrollIntoView({ block: 'center' }));
  return { node, relabel: draw, destroy: () => {} };
}
