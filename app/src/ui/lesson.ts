// A lesson, page by page: its Markdown rendered by marked (D33), Back and Next
// page, and on the last page the button that marks the lesson read and opens what
// comes next: Try it, where a level comes next for the example to be tried in;
// Go on, before another lesson or a story, and for a lesson with no example
// (D56). A lesson is drawn as its teacher speaking, the figure beside the words (D67). A
// page's code runs on the page itself, in the lesson's level (lessonrun.ts, D142). On a
// first reading, a page with code to try is left once its test is done (D354): its
// forward button, pressed before, leaves the page where it is and says under the block
// what is missing; Back always works. Reaching the last page marks the lesson read, once
// that page's test is done.

import { marked } from 'marked';
import { itemHash } from '../content/course';
import { type Lesson, type LessonTest, pageParts } from '../content/lessons';
import { debugging } from '../engine/debugging';
import { characterName, t } from '../i18n';
import * as progress from '../progress/progress';
import { element } from './dom';
import { portrait, portraitOf } from './portraits';
import { type LessonRunner, type RunBlock, runBlock } from './lessonrun';
import { type LessonRun, lessonTestDue } from './lessontest';
import type { Screen } from './screen';

export interface LessonScreenParts {
  lesson: Lesson;
  /** The lesson's number in its chapter, in words and in the language now set
   * (*Lesson 3*), or none. */
  label?: () => string | undefined;
  /** The course's item after this lesson, or null after the last. */
  next: string | null;
  /** A lesson read again from a level: where Back to the level goes (D71). */
  backTo?: string;
  /** The lesson in the language now set, for a change of language. */
  reload: () => Promise<Lesson>;
  /** How its code runs on the page, in the level after it; none with no level after it. */
  runner?: LessonRunner;
}

/** What a page's test still asks, in the child's words (D354). */
function askedWords(key: string): string {
  switch (key) {
    case 'lesson.not_run':
      return t('lesson.not_run');
    case 'lesson.trial_not_started':
      return t('lesson.trial_not_started');
    case 'lesson.trial_not_changed':
      return t('lesson.trial_not_changed');
    case 'lesson.trial_not_renamed':
      return t('lesson.trial_not_renamed');
    default:
      return t('lesson.trial_error_not_seen');
  }
}

export function lessonScreen(parts: LessonScreenParts): Screen {
  let lesson = parts.lesson;
  let page = 0;
  const node = element('div', { className: 'lesson-screen taught' });

  // The teacher beside a lesson's words: the character's portrait, with the name (D67,
  // D194).
  const teacher = () => {
    const speaker = lesson.speaker;
    const id = speaker ? portraitOf(speaker, progress.wizard()?.look) : null;
    if (!speaker || !id) return null;
    return element('figure', { id: 'lesson-teacher', className: 'lesson-teacher' }, [
      portrait(id, 'large'),
      element('figcaption', {}, [characterName(speaker)]),
    ]);
  };

  const markRead = () => progress.markRead(lesson.id);
  // A page's test is asked on a first reading (D354): not of a lesson read before, nor of
  // one read again from a level, nor in the tester's mode.
  let asks = false;
  const tested = new Set<number>();
  // The runs of each page's block in this visit, and its test.
  const runs = new Map<number, LessonRun[]>();
  const testOf = (at: number): { test: LessonTest; code: string } | null => {
    const part = pageParts(lesson.pages[at] ?? '').find((one) => 'code' in one);
    return part && 'code' in part ? { test: part.test, code: part.code } : null;
  };
  /** What the page's test still asks, or null when the page may be left. */
  const due = (at: number): string | null => {
    const block = testOf(at);
    if (!asks || !block || tested.has(at)) return null;
    return lessonTestDue(block.test, block.code, runs.get(at) ?? []);
  };
  const passed = (at: number) => {
    tested.add(at);
    progress.markTested(lesson.id, at);
    if (at === lesson.pages.length - 1) markRead();
  };
  // Try it leads to a level, where the example is tried; a lesson followed by
  // another lesson has nothing to try yet, and goes on to it.
  const tries = () => lesson.tryCode !== null && (parts.next?.startsWith('level:') ?? false);

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

  let blocks: RunBlock[] = [];

  const draw = () => {
    const last = page === lesson.pages.length - 1;
    if (last && due(page) === null) markRead();
    const shown = page;
    document.title = t('level.page_title', { title: lesson.title });
    const article = element('article', { className: 'lesson-page' });
    for (const block of blocks) block.destroy();
    blocks = [];
    for (const part of pageParts(lesson.pages[page] ?? '')) {
      if ('markdown' in part) {
        // The lessons are the project's own, with no HTML in them (a content check
        // refuses it), so marked's output is put in as it is.
        const words = element('div', { className: 'lesson-words' });
        words.innerHTML = marked.parse(part.markdown, { async: false });
        article.append(...words.children);
      } else if (parts.runner) {
        const block = runBlock(part.code, parts.runner, (run) => {
          runs.set(shown, [...(runs.get(shown) ?? []), run]);
          if (asks && !tested.has(shown) && lessonTestDue(part.test, part.code, runs.get(shown) ?? []) === null) {
            passed(shown);
            block.ask(null);
            block.node.dataset.passed = 'true';
          }
        });
        // The page's test and whether it is done, for the tests.
        block.node.dataset.test = part.test;
        if (due(shown) === null) block.node.dataset.passed = 'true';
        blocks.push(block);
        article.append(block.node);
      } else {
        const shown = element('pre', {}, [element('code', {}, [part.code])]);
        article.append(shown);
      }
    }
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
          parts.backTo ? t('lesson.back_to_level') : tries() ? t('lesson.try') : t('lesson.go_on'),
        ])
      : element('button', { id: 'lesson-next', type: 'button', className: 'big-button' }, [
          t('lesson.next'),
        ]);
    forward.addEventListener('click', () => {
      // A page whose test is not done stays, and says what is missing (D354).
      const missing = due(page);
      if (missing !== null) {
        blocks[0]?.ask(askedWords(missing));
        return;
      }
      if (last) tryIt();
      else {
        page += 1;
        draw();
      }
    });
    const label = parts.label?.();
    node.replaceChildren(
      element('div', { className: 'lesson-top' }, [
        ...(label ? [element('span', { id: 'lesson-number', className: 'item-number' }, [label])] : []),
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
    // A page is read from its top: its button takes the focus without bringing the
    // window down to it, on a page taller than the window.
    forward.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
  };

  return {
    node,
    mount: () => {
      // A lesson read again from a level: the child is still at the level.
      if (!parts.backTo) progress.setCurrent(`lesson:${lesson.id}`);
      asks = !debugging() && !parts.backTo && progress.load().lessons[lesson.id]?.read !== true;
      for (const at of progress.testedPages(lesson.id)) tested.add(at);
      draw();
    },
    async relabel() {
      lesson = await parts.reload();
      page = Math.min(page, lesson.pages.length - 1);
      draw();
    },
    destroy: () => {
      for (const block of blocks) block.destroy();
      blocks = [];
    },
  };
}
