// A lesson or a story page, page by page: its Markdown rendered by marked
// (D33), Back and Next page, and on the last page Try it, which marks the
// lesson read and opens what comes next; a story page, or a lesson with no
// example, has Go on instead (D56). Reaching the last page marks it read. A
// lesson is drawn as its teacher speaking, the figure beside the words; a story
// page as a page of a book (D67).

import { marked } from 'marked';
import { itemHash } from '../content/course';
import type { Lesson } from '../content/lessons';
import { t } from '../i18n';
import { drawFigurePreview, friendFigure } from '../engine/placeholders';
import * as progress from '../progress/progress';
import { element } from './dom';
import type { Screen } from './screen';

export interface LessonScreenParts {
  lesson: Lesson;
  /** A lesson, or a story page, which is read the same way and kept apart. */
  kind: 'lesson' | 'story';
  /** The lesson's number in its chapter, in words (*Lesson 3*), or none. */
  label?: string;
  /** The course's item after this lesson, or null after the last. */
  next: string | null;
  /** Where Go on leads when it is not to the course's next item: from the game's
   * opening, to the creator or to the course's start (D61). */
  onward?: string;
  /** The lesson in the language now set, for a change of language. */
  reload: () => Promise<Lesson>;
}

export function lessonScreen(parts: LessonScreenParts): Screen {
  let lesson = parts.lesson;
  let page = 0;
  const node = element('div', { className: `lesson-screen ${parts.kind === 'story' ? 'story' : 'taught'}` });

  // The teacher beside a lesson's words: the character's figure, with the name (D67).
  const teacher = () => {
    const speaker = parts.kind === 'lesson' ? lesson.speaker : undefined;
    if (!speaker) return null;
    const figure = element('canvas', { className: 'lesson-figure' });
    drawFigurePreview(figure, friendFigure(speaker, progress.wizard()?.gender ?? 'girl'));
    return element('figure', { id: 'lesson-teacher', className: 'lesson-teacher' }, [
      figure,
      element('figcaption', {}, [t(`characters.${speaker}`)]),
    ]);
  };

  const markRead = () =>
    parts.kind === 'story' ? progress.markStoryRead(lesson.id) : progress.markRead(lesson.id);

  const tryIt = () => {
    markRead();
    const next = parts.next;
    if (next) progress.setCurrent(next);
    location.hash = parts.onward ?? (next ? itemHash(next) : '#map');
  };

  const draw = () => {
    const last = page === lesson.pages.length - 1;
    if (last) markRead();
    document.title = t('level.page_title', { title: lesson.title });
    const article = element('article', { className: 'lesson-page' });
    // The lessons are the project's own, with no HTML in them (a content check
    // refuses it), so marked's output is put in as it is.
    article.innerHTML = marked.parse(lesson.pages[page] ?? '', { async: false });
    const back = element('button', { id: 'lesson-back', type: 'button', className: 'quiet-button' }, [
      t('lesson.previous'),
    ]);
    back.disabled = page === 0;
    back.addEventListener('click', () => {
      page = Math.max(0, page - 1);
      draw();
    });
    const forward = last
      ? element('button', { id: 'lesson-try', type: 'button', className: 'big-button' }, [
          lesson.tryCode !== null ? t('lesson.try') : t('lesson.go_on'),
        ])
      : element('button', { id: 'lesson-next', type: 'button', className: 'big-button' }, [
          t('lesson.next'),
        ]);
    forward.addEventListener('click', () => {
      if (last) tryIt();
      else {
        page += 1;
        draw();
      }
    });
    node.replaceChildren(
      element('div', { className: 'lesson-top' }, [
        ...(parts.label ? [element('span', { id: 'lesson-number', className: 'item-number' }, [parts.label])] : []),
        element('a', { id: 'lesson-map', className: 'quiet-button small', href: '#map' }, [t('map.open_map')]),
      ]),
      element('div', { className: 'lesson-body' }, [...[teacher()].filter((n) => n !== null), article]),
      element('div', { className: 'lesson-nav' }, [
        back,
        element('span', { id: 'lesson-page', className: 'lesson-count' }, [
          t('lesson.page', { n: page + 1, total: lesson.pages.length }),
        ]),
        forward,
      ]),
    );
    forward.focus();
  };

  return {
    node,
    mount: () => {
      // The opening is before the course: Continue does not come back to it.
      if (!lesson.opening) progress.setCurrent(`${parts.kind}:${lesson.id}`);
      draw();
    },
    async relabel() {
      lesson = await parts.reload();
      page = Math.min(page, lesson.pages.length - 1);
      draw();
    },
    destroy: () => {},
  };
}
