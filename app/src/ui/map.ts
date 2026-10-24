// The map of the course: each chapter as a path of stops, top to bottom, a book
// for a lesson and a door for a level. A stop is done, open or locked (D34); an
// open or done stop opens its item, a locked one does not.

import { type Course, itemHash, parseItem, stopState } from '../content/course';
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
    const chapters = course.chapters.map((chapter) => {
      const stops = chapter.items.map((item) => {
        const parsed = parseItem(item);
        const state = stopState(course, item, progress);
        const title = parts.titles.get(item) ?? parsed?.id ?? item;
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
        const body = [icon, label, ...extra];
        const stop =
          state === 'locked'
            ? element('span', { className: 'stop-body' }, body)
            : element('a', { className: 'stop-body', href: itemHash(item) }, body);
        stop.setAttribute('aria-label', `${title}: ${stateWords(state)}`);
        const li = element('li', { className: 'stop' }, [stop]);
        li.dataset.state = state;
        li.dataset.item = item;
        return li;
      });
      return element('section', { className: 'map-chapter' }, [
        element('h2', {}, [parts.chapterTitles.get(chapter.id) ?? chapter.id]),
        element('ol', { className: 'stops' }, stops),
      ]);
    });
    node.replaceChildren(
      element('a', { id: 'map-back', className: 'quiet-button', href: '#start' }, [t('map.back')]),
      ...chapters,
    );
  };
  draw();
  return { node, relabel: draw, destroy: () => {} };
}
