// A story told on its scene (D74): the scene drawn wide, with no editor and no
// goals; under it the voice's band; each step's action played on the scene,
// then its words said in a bubble over who says them, or by the voice in the
// band. Next goes on to the step after, Back to the one before; Enter and Space
// do what Next does. On the last step Go on leads to what comes next; reaching
// it marks the story read, as reading a story to its end does.

import { marked } from 'marked';
import { itemHash } from '../content/course';
import { type Story, storyEvents } from '../content/stories';
import { lookOf } from '../engine/looks';
import type { SceneHandle, SceneOptions } from '../engine/scene';
import { characterName, forWizard, t } from '../i18n';
import type { LevelJson } from '../runtime/protocol';
import * as progress from '../progress/progress';
import { element } from './dom';
import type { Screen } from './screen';

export interface StoryScreenParts {
  story: Story;
  /** Its chapter and number (D78): *Chapter 1 · Story 1*. */
  label?: string;
  /** The course's item after this story, or null after the last. */
  next: string | null;
  /** Where Go on leads when it is not to the course's next item: from the game's
   * opening, to the creator or to the course's start (D61). */
  onward?: string;
  startScene: (
    parent: HTMLElement,
    level: LevelJson,
    look: ReturnType<typeof lookOf>,
    options: SceneOptions,
  ) => Promise<SceneHandle>;
  /** The story in the language now set, for a change of language. */
  reload: () => Promise<Story>;
}

export function storyScreen(parts: StoryScreenParts): Screen {
  let story = parts.story;
  let step = 0;
  let scene: SceneHandle | null = null;
  let destroyed = false;

  const sceneParent = element('div', { id: 'scene', className: 'scene' });
  const frame = element('div', { className: 'scene-frame story-frame' }, [sceneParent]);
  const voice = element('div', { id: 'story-voice', className: 'story-voice' });
  // What a figure says, for a screen reader, which cannot read the bubble.
  const heard = element('p', { id: 'story-heard', className: 'visually-hidden', ariaLive: 'polite' });
  const back = element('button', { id: 'story-back', type: 'button', className: 'quiet-button' }, [
    t('lesson.previous'),
  ]);
  const count = element('span', { id: 'story-step', className: 'lesson-count' });
  const forward = element('button', { id: 'story-next', type: 'button', className: 'big-button' });
  const node = element('div', { className: 'story-screen' }, [
    element('div', { className: 'lesson-top' }, [
      ...(parts.label ? [element('span', { id: 'story-number', className: 'item-number' }, [parts.label])] : []),
      element('h2', { id: 'story-title', className: 'story-title' }),
      element('a', { id: 'story-map', className: 'quiet-button small', href: '#map' }, [t('map.open_map')]),
    ]),
    frame,
    element('div', { className: 'story-said' }, [voice, heard]),
    element('div', { className: 'lesson-nav' }, [back, count, forward]),
  ]);

  const last = () => step === story.steps.length - 1;

  const goOn = () => {
    progress.markStoryRead(story.id);
    const next = parts.next;
    if (next) progress.setCurrent(next);
    location.hash = parts.onward ?? (next ? itemHash(next) : '#map');
  };

  /** The step's words, and the buttons for it. */
  const words = () => {
    const current = story.steps[step];
    const title = node.querySelector('#story-title');
    if (title) title.textContent = story.title;
    document.title = t('level.page_title', { title: story.title });
    const byVoice = current?.who === 'voice';
    // The voice's words in the band; a figure's words are in its bubble.
    voice.innerHTML = byVoice ? marked.parseInline(current?.text ?? '', { async: false }) : '';
    voice.classList.toggle('silent', !byVoice);
    const who = current?.who === 'wizard' ? forWizard('{wizard}') : current ? characterName(current.who) : '';
    heard.textContent = current && !byVoice ? `${who}: ${current.text.replace(/[`*_]/g, '')}` : '';
    back.disabled = step === 0;
    forward.textContent = last() ? t('lesson.go_on') : t('story.next');
    forward.id = last() ? 'story-go-on' : 'story-next';
    count.textContent = t('story.step', { n: step + 1, total: story.steps.length });
    if (last()) progress.markStoryRead(story.id);
  };

  /** The scene as the step before left it, then this step played. */
  const play = () => {
    words();
    if (!scene) return;
    const { events, spans } = storyEvents(story);
    const span = spans[step];
    if (!span) return;
    scene.playback.load(events.filter((event) => event.tick <= span.last));
    scene.playback.seek(span.first - 1);
    scene.playback.play();
  };

  const go = (by: 1 | -1) => {
    if (by === 1 && last()) {
      goOn();
      return;
    }
    step = Math.min(Math.max(0, step + by), story.steps.length - 1);
    play();
  };
  back.addEventListener('click', () => go(-1));
  forward.addEventListener('click', () => go(1));
  // Enter and Space go on, unless a button or a link has them already.
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea')) return;
    event.preventDefault();
    go(1);
  };

  return {
    node,
    mount() {
      // The opening is before the course: Continue does not come back to it.
      if (!story.opening) progress.setCurrent(`story:${story.id}`);
      document.addEventListener('keydown', onKey);
      words();
      // The wizard the child made, or the first look before there is one.
      const look = lookOf(progress.wizard()?.look);
      void parts.startScene(sceneParent, story.world, look, { story: { camera: story.camera } }).then((handle) => {
        if (destroyed) {
          handle.destroy();
          return;
        }
        scene = handle;
        play();
      });
      forward.focus();
    },
    async relabel() {
      story = await parts.reload();
      play();
    },
    destroy() {
      destroyed = true;
      document.removeEventListener('keydown', onKey);
      scene?.destroy();
      scene = null;
    },
  };
}
