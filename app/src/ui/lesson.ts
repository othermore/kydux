// A lesson, page by page: its Markdown rendered by marked (D33), Back and Next
// page, and on the last page Try it, which marks the lesson read and opens what
// comes next; a lesson with no example has Go on instead (D56). Reaching the
// last page marks it read. A lesson is drawn as its teacher speaking, the
// figure beside the words (D67).

import { marked } from 'marked';
import { itemHash } from '../content/course';
import type { Lesson } from '../content/lessons';
import { characterName, t } from '../i18n';
import { drawFigurePreview, friendFigure } from '../engine/placeholders';
import * as progress from '../progress/progress';
import { element } from './dom';
import type { Screen } from './screen';

export interface LessonScreenParts {
  lesson: Lesson;
  /** The lesson's number in its chapter, in words (*Lesson 3*), or none. */
  label?: string;
  /** The course's item after this lesson, or null after the last. */
  next: string | null;
  /** A lesson read again from a level: where Back to the level goes (D71). */
  backTo?: string;
  /** The lesson in the language now set, for a change of language. */
  reload: () => Promise<Lesson>;
}

export function lessonScreen(parts: LessonScreenParts): Screen {
  let lesson = parts.lesson;
  let page = 0;
  const node = element('div', { className: 'lesson-screen taught' });

  // The teacher beside a lesson's words: the character's figure, with the name (D67).
  const teacher = () => {
    const speaker = lesson.speaker;
    if (!speaker) return null;
    const figure = element('canvas', { className: 'lesson-figure' });
    drawFigurePreview(figure, friendFigure(speaker, progress.wizard()?.gender ?? 'girl'));
    return element('figure', { id: 'lesson-teacher', className: 'lesson-teacher' }, [
      figure,
      element('figcaption', {}, [characterName(speaker)]),
    ]);
  };

  const markRead = () => progress.markRead(lesson.id);

  const tryIt = () => {
    markRead();
    if (parts.backTo) {
      location.hash = parts.backTo;
      return;
    }
    const next = parts.next;
    if (next) progress.setCurrent(next);
    location.hash = next ? itemHash(next) : '#map';
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
          parts.backTo ? t('lesson.back_to_level') : lesson.tryCode !== null ? t('lesson.try') : t('lesson.go_on'),
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
        ...(parts.backTo
          ? [
              element('a', { id: 'lesson-to-level', className: 'quiet-button small', href: parts.backTo }, [
                t('lesson.back_to_level'),
              ]),
            ]
          : []),
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
      // A lesson read again from a level: the child is still at the level.
      if (!parts.backTo) progress.setCurrent(`lesson:${lesson.id}`);
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
