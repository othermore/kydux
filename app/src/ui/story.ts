// A story told on its scene (D74): the scene drawn wide, with no editor and no
// goals, and the zoom box on it (D106); under it the voice's band; each step's
// actions played on the scene, then its words said in a bubble over who says
// them, or by the voice in the band. Next goes on to the step after, Back to the
// one before; Enter and Space do what Next does. Again plays the step's actions
// once more, as R does, on a step that has some; Skip goes to the last step,
// every figure where the story leaves it, for a child who has read it before. On
// the last step Go on leads to what comes next; reaching it marks the story read,
// as reading a story to its end does. A story told on several scenes in turn (the
// morning after, from the dormitory to the shed) starts each part's scene as its
// first step comes. The screen shows before its scene's code is there (D214): the
// voice's words are read at once and steps that do nothing on the scene are gone on
// from, while the scene's place shows the story's still (the opening's, the welcome's
// painting of the castle) or the page's paper with Kydux's mark; a step's actions play
// when the scene comes, which fades in over the still.

import { marked } from 'marked';
import { itemHash } from '../content/course';
import { type Story, type StoryPart, type StoryStep, storyEvents } from '../content/stories';
import { lookOf } from '../engine/looks';
import type { SceneHandle, SceneOptions } from '../engine/scene';
import type { StoryFraming } from '../engine/zooming';
import { characterName, forWizard, t } from '../i18n';
import type { LevelJson } from '../runtime/protocol';
import * as progress from '../progress/progress';
import { element } from './dom';
import { markSvg } from './mark';
import { portrait, portraitOf } from './portraits';
import type { Screen } from './screen';
import { zoomBox } from './zoom';

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
  /** The picture the scene's place shows until the scene is there, with its words. */
  still?: { src: string; alt: string };
}

/** How long the scene takes to come in over the still, in milliseconds (style.css). */
const FADE_IN = 500;

/** The place framed at a step (D199): the last step's framing from the part's first
 * step to it, or none. */
export function framingAt(steps: readonly StoryStep[], first: number, step: number): StoryFraming | null {
  for (let index = step; index >= first; index -= 1) {
    const camera = steps[index]?.camera;
    if (camera?.fit) return { fit: [camera.fit[0][0], camera.fit[0][1], camera.fit[1][0], camera.fit[1][1]] };
    if (camera?.wide) return { wide: true };
  }
  return null;
}

export function storyScreen(parts: StoryScreenParts): Screen {
  let story = parts.story;
  let step = 0;
  let scene: SceneHandle | null = null;
  let destroyed = false;
  /** The part of the story the scene shows (0, the story's own scene), and the one
   * being started, while it loads. */
  let shownPart = -1;
  let loadingPart = -1;

  const sceneParent = element('div', { id: 'scene', className: 'scene story-scene-waiting' });
  // The camera's zoom, as on a level's scene (D106).
  const zoom = zoomBox(sceneParent, { story: true });
  // Until the scene is there, its place shows the still, or the paper with the mark.
  const still = parts.still
    ? element('img', { id: 'story-still', className: 'story-still', src: parts.still.src, alt: parts.still.alt })
    : element('div', { id: 'story-still', className: 'story-still story-still-mark' }, [markSvg(72)]);
  const frame = element('div', { className: 'scene-frame story-frame' }, [still, sceneParent, zoom.node]);
  const voice = element('div', { id: 'story-voice', className: 'story-voice' });
  // What a figure says, for a screen reader, which cannot read the bubble.
  const heard = element('p', { id: 'story-heard', className: 'visually-hidden', ariaLive: 'polite' });
  // Who speaks in a bubble: their portrait and name in the band, which is silent then.
  const speaking = element('div', { id: 'story-speaker', className: 'story-speaker' });
  const back = element('button', { id: 'story-back', type: 'button', className: 'quiet-button' }, [
    t('lesson.previous'),
  ]);
  const count = element('span', { id: 'story-step', className: 'lesson-count' });
  const again = element('button', { id: 'story-again', type: 'button', className: 'quiet-button small' }, [
    t('story.again'),
  ]);
  const skip = element('button', { id: 'story-skip', type: 'button', className: 'link-button' }, [
    t('story.skip'),
  ]);
  const forward = element('button', { id: 'story-next', type: 'button', className: 'big-button' });
  const node = element('div', { className: 'story-screen' }, [
    element('div', { className: 'lesson-top' }, [
      ...(parts.label ? [element('span', { id: 'story-number', className: 'item-number' }, [parts.label])] : []),
      element('h2', { id: 'story-title', className: 'story-title' }),
      element('a', { id: 'story-map', className: 'quiet-button small', href: '#map' }, [t('map.open_map')]),
    ]),
    frame,
    element('div', { className: 'story-said' }, [voice, heard, skip]),
    element('div', { className: 'lesson-nav' }, [element('span', { className: 'story-back' }, [back, again]), count, forward]),
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
    // The voice has no name: only a figure's words are kept as said by someone.
    const said = current && !byVoice ? current : null;
    const who = said?.who === 'wizard' ? forWizard('{wizard}') : said ? characterName(said.who) : '';
    heard.textContent = said ? `${who}: ${said.text.replace(/[`*_]/g, '')}` : '';
    // While a figure speaks in its bubble, the band shows who it is (D194).
    const face = said ? portraitOf(said.who, progress.wizard()?.look) : null;
    speaking.replaceChildren(...(face ? [portrait(face, 'small'), element('span', {}, [who])] : []));
    if (face) voice.append(speaking);
    back.disabled = step === 0;
    // Again only where the step does something; Skip until the last step.
    again.hidden = !current?.do;
    skip.hidden = last();
    forward.textContent = last() ? t('lesson.go_on') : t('story.next');
    forward.id = last() ? 'story-go-on' : 'story-next';
    count.textContent = t('story.step', { n: step + 1, total: story.steps.length });
    if (last()) progress.markStoryRead(story.id);
  };

  /** The parts of the story by their first step: its own first, then each told on
   * another scene. */
  const partsOf = (): StoryPart[] => [
    {
      step: 0,
      world: story.world,
      camera: story.camera,
      ...(story.light ? { light: story.light } : {}),
      ...(story.flying ? { flying: story.flying } : {}),
    },
    ...(story.parts ?? []),
  ];
  const partAt = (index: number) => partsOf().filter((part) => part.step <= index).length - 1;

  /** The scene of a part started, the one before it gone, and the step played on it. */
  const startPart = (index: number) => {
    const part = partsOf()[index];
    if (!part || loadingPart === index) return;
    loadingPart = index;
    scene?.destroy();
    scene = null;
    // The scene that is gone said its playback was done; until this part's own plays,
    // the page says it is loading, so that nothing waiting for `done` reads the old one.
    sceneParent.dataset.state = 'loading';
    const look = lookOf(progress.wizard()?.look);
    const options = {
      story: {
        camera: part.camera,
        ...(part.light ? { light: part.light } : {}),
        ...(part.flying ? { flying: part.flying } : {}),
      },
    };
    void parts.startScene(sceneParent, part.world, look, options).then((handle) => {
      if (destroyed || loadingPart !== index) {
        handle.destroy();
        return;
      }
      scene = handle;
      shownPart = index;
      loadingPart = -1;
      sceneParent.dataset.storyPart = String(index);
      zoom.attach(handle);
      // The first scene comes in over the still, which then leaves.
      if (sceneParent.classList.contains('story-scene-waiting')) {
        sceneParent.classList.remove('story-scene-waiting');
        setTimeout(() => {
          still.hidden = true;
        }, FADE_IN);
      }
      play();
    })
      // A scene whose code did not arrive: the page says so (main.ts).
      .catch(() => {});
  };

  /** The scene as the step before left it, then this step played. */
  const play = () => {
    words();
    const index = partAt(step);
    if (index !== shownPart) {
      startPart(index);
      return;
    }
    if (!scene) return;
    const part = partsOf()[index];
    const end = partsOf()[index + 1]?.step ?? story.steps.length;
    const { events, spans } = storyEvents({
      steps: story.steps.slice(part?.step ?? 0, end),
      world: part?.world ?? story.world,
      flying: part?.flying ?? [],
    });
    const span = spans[step - (part?.step ?? 0)];
    if (!span) return;
    // A step played again brings back a camera a drag let go of (D106); the place the
    // last step of this part to frame one framed is held (D199).
    scene.follow();
    scene.place(framingAt(story.steps, part?.step ?? 0, step));
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
  again.addEventListener('click', () => play());
  skip.addEventListener('click', () => {
    step = story.steps.length - 1;
    play();
    forward.focus();
  });
  // Enter and Space go on, and R plays the step again, unless a button or a link
  // has the key already.
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea')) return;
    if (event.key === 'r' || event.key === 'R') {
      if (!again.hidden) play();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    go(1);
  };

  return {
    node,
    mount() {
      // The opening is before the course: Continue does not come back to it.
      if (!story.opening) progress.setCurrent(`story:${story.id}`);
      document.addEventListener('keydown', onKey);
      // The scene of the story's first part, with the wizard the child made, or the
      // first look before there is one.
      play();
      forward.focus();
    },
    async relabel() {
      story = await parts.reload();
      zoom.relabel();
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
