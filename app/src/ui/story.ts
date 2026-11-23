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
// when the scene comes, which fades in over the still. The opening's first steps are
// told over its still, the scene there behind it (`still`, D251): Next to the first step
// without it brings the scene in, and Back to one with it shows the still again at once;
// the frame says which in data-still. Its first step holds the letter before the painted
// castle (`letter`, D257): a sheet folded in half, the castle drawn in ink on it and the
// game's words of admission written by hand between the drawing and the fold, filling
// that room to the fold as if the letter went on behind it; placed on the painting
// whatever the frame shows of it, lowered out of the frame at the first step without it
// and raised again at Back; the frame says where it is in data-letter.

import { marked } from 'marked';
import { itemHash } from '../content/course';
import { type Story, type StoryPart, type StoryStep, storyEvents } from '../content/stories';
import { lookOf } from '../engine/looks';
import { readingMs } from '../engine/bubble';
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
  /** The letter held before the still at a step that holds it (D257): its picture, and
   * its heading, words and description in the language now set. */
  letter?: { src: string; title: () => string; words: () => string; alt: () => string };
}

/** How long the scene takes to come in over the still, in milliseconds (style.css). */
const FADE_IN = 500;

/** How long the letter takes to be lowered or raised, in milliseconds (style.css). */
const LETTER_MS = 600;

/** Time that passes in a story (D280): how long the scene takes to go dark and to come
 * back out of it, and how long it stays dark, in milliseconds (style.css); two seconds
 * in all. */
const PASS_FADE = 600;
const PASS_DARK = 800;

/** Where the letter lies on the painting (D257), in fractions of the painting: its width,
 * the middle it is centred on across, and its top. The painted castle lies from 0.516 to
 * 0.849 of the painting's width and from 0.054 to 0.498 of its height; the sheet covers
 * it whole. On the sheet, its drawing starts at DRAWN of its height, and a sheet held in a
 * hand is turned TURN degrees. */
const LETTER = { width: 0.43, middle: 0.682, top: 0.022 } as const;
const DRAWN = 0.05;
/** The letter's words (D257): their size, in fractions of the sheet's width, from the
 * least to the most; the narrowest column they may take, in a fraction of the room
 * between the drawing and the fold (style.css); and how full the last line must be at
 * least before it is spread to the column's edge, so that the words seem to go on
 * behind the fold. */
const WORDS_SIZE = { least: 0.024, most: 0.04 } as const;
const WORDS_COLUMN = 0.62;
const WORDS_FULL = 0.86;
/** The letter's hand, bundled with the game (style.css). */
const LETTER_FACE = 'Caveat';
const TURN = 3.5;
/** How far from the frame's edges the sheet keeps, in pixels. */
const LETTER_PAD = 8;

/** The sheet's box in the frame (D257): the painting shown under object-fit: cover,
 * centred; the sheet placed on it by LETTER, then held whole in the frame, turned,
 * LETTER_PAD from its edges, but for its upper margin, which may pass the frame's upper
 * edge up to its drawing where the frame cuts the painting at the castle's tip; made
 * smaller only where the frame cannot hold it. */
function letterBox(
  frame: { width: number; height: number },
  painting: { width: number; height: number },
  sheet: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const scale = Math.max(frame.width / painting.width, frame.height / painting.height);
  const shownWidth = painting.width * scale;
  const offset = { x: (frame.width - shownWidth) / 2, y: (frame.height - painting.height * scale) / 2 };
  const ratio = sheet.height / sheet.width;
  const angle = (TURN * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  // The sheet turned: how wide and how tall its box is, and how far above its middle its
  // drawing starts.
  const turned = (width: number) => ({
    across: width * cos + width * ratio * sin,
    down: width * sin + width * ratio * cos,
    drawn: width * ratio * (0.5 - DRAWN) * cos + width * 0.5 * sin,
  });
  let width = LETTER.width * shownWidth;
  const fits = (w: number) => {
    const t = turned(w);
    return t.across <= frame.width - 2 * LETTER_PAD && t.drawn + t.down / 2 <= frame.height - LETTER_PAD;
  };
  while (width > 40 && !fits(width)) width *= 0.97;
  const t = turned(width);
  const height = width * ratio;
  let middleX = offset.x + LETTER.middle * shownWidth;
  let middleY = offset.y + LETTER.top * painting.height * scale + height / 2;
  middleX = Math.min(Math.max(middleX, LETTER_PAD + t.across / 2), frame.width - LETTER_PAD - t.across / 2);
  middleY = Math.max(middleY, t.drawn);
  middleY = Math.min(middleY, frame.height - LETTER_PAD - t.down / 2);
  return { left: middleX - width / 2, top: middleY - height / 2, width, height };
}

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
  /** Whether the story's first scene has come, and the fade of the scene in over the
   * still under way. */
  let came = false;
  let fading: ReturnType<typeof setTimeout> | null = null;
  /** The timer that hides the letter once it is lowered (D257). */
  let lowering: ReturnType<typeof setTimeout> | null = null;

  const sceneParent = element('div', { id: 'scene', className: 'scene story-scene-waiting' });
  // The camera's zoom, as on a level's scene (D106).
  const zoom = zoomBox(sceneParent, { story: true });
  // Until the scene is there, its place shows the still, or the paper with the mark.
  const still = parts.still
    ? element('img', { id: 'story-still', className: 'story-still', src: parts.still.src, alt: parts.still.alt })
    : element('div', { id: 'story-still', className: 'story-still story-still-mark' }, [markSvg(72)]);
  // The letter (D257): its picture and the game's words between its drawing and its
  // fold, a heading and a paragraph, over the still and under the scene. The paragraph
  // ends in a mark that tells how far its last line runs.
  const letterTitle = element('p', { className: 'story-letter-title' });
  const letterBody = element('p', { className: 'story-letter-body' });
  const letterEnd = element('span', { className: 'story-letter-end' });
  const letterText = element('div', { className: 'story-letter-text' }, [letterTitle, letterBody]);
  const letterWords = element('div', { className: 'story-letter-words' }, [letterText]);
  const letterPicture = parts.letter
    ? element('img', { className: 'story-letter-sheet', src: parts.letter.src, alt: parts.letter.alt() })
    : null;
  const letter =
    parts.letter && letterPicture
      ? element('div', { id: 'story-letter', className: 'story-letter', hidden: true }, [letterPicture, letterWords])
      : null;
  // The dark the scene goes into and comes back out of while time passes (D280), and
  // the words said on it, in a box with no tail (D309).
  const darkWords = element('p', { id: 'story-dark-words', className: 'story-dark-words', hidden: true });
  const dark = element('div', { id: 'story-dark', className: 'story-dark' }, [darkWords]);
  const frame = element('div', { className: 'scene-frame story-frame' }, [
    still,
    ...(letter ? [letter] : []),
    sceneParent,
    dark,
    zoom.node,
  ]);
  /** The letter's words and description in the language now set (D257). */
  const sayLetter = () => {
    if (!parts.letter || !letterPicture) return;
    letterTitle.textContent = parts.letter.title();
    letterBody.replaceChildren(parts.letter.words(), letterEnd);
    letterPicture.alt = parts.letter.alt();
  };
  sayLetter();
  // The painting, the letter and its handwriting come into sight together: the bare
  // castle is never shown first, nor the words in another letter (D257). The sheet
  // follows the frame's size.
  let resized: ResizeObserver | null = null;
  if (letter && letterPicture) {
    frame.classList.add('story-letter-loading');
    const pictures = [letterPicture, ...(still instanceof HTMLImageElement ? [still] : [])];
    const hand = document.fonts?.load(`500 16px ${LETTER_FACE}`).catch(() => []) ?? Promise.resolve([]);
    void Promise.allSettled([...pictures.map((picture) => picture.decode()), hand]).then(() => {
      frame.classList.remove('story-letter-loading');
      placeLetter();
    });
    resized = new ResizeObserver(() => placeLetter());
    resized.observe(frame);
  }
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
    heard.textContent = said ? `${who}: ${said.text.replace(/[`*]/g, '')}` : '';
    // While a figure speaks in its bubble, the band shows who it is (D194).
    const face = said ? portraitOf(said.who, progress.wizard()?.look) : null;
    // A voice with no figure and no portrait, the cold voice, by its name alone (D264).
    const named = said && !face && said.who !== 'wizard';
    speaking.replaceChildren(
      ...(face ? [portrait(face, 'small'), element('span', {}, [who])] : named ? [element('span', {}, [who])] : []),
    );
    if (face || named) voice.append(speaking);
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

  /** Time that passes, while a step's words are not yet said (D280): counted so that a
   * step gone to meanwhile drops it. */
  let passing = 0;

  /** The scene of a part started, the one before it gone, and the step played on it, or
   * what `then` does once it is there. */
  const startPart = (index: number, then: () => void = () => play()) => {
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
      came = true;
      then();
    })
      // A scene whose code did not arrive: the page says so (main.ts).
      .catch(() => {});
  };

  /** The sheet placed on the painting as the frame now shows it (D257). */
  const placeLetter = () => {
    if (!letter || !letterPicture) return;
    const box = frame.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const painting =
      still instanceof HTMLImageElement && still.naturalWidth > 0
        ? { width: still.naturalWidth, height: still.naturalHeight }
        : { width: 16, height: 9 };
    const sheet =
      letterPicture.naturalWidth > 0
        ? { width: letterPicture.naturalWidth, height: letterPicture.naturalHeight }
        : { width: 1000, height: 727 };
    const place = letterBox({ width: box.width, height: box.height }, painting, sheet);
    letter.style.left = `${place.left}px`;
    letter.style.top = `${place.top}px`;
    letter.style.width = `${place.width}px`;
    letter.style.height = `${place.height}px`;
    letter.style.setProperty('--letter-width', `${place.width}px`);
    // Lowered, it goes out over the frame's lower edge, turned a little more.
    letter.style.setProperty('--letter-drop', `${box.height - place.top + place.height * 0.2 + 16}px`);
    fitWords();
  };

  /** The letter's words fitted to the room between its drawing and its fold (D257):
   * the heading and the paragraph as large as they fit there, in a column a little
   * narrower where that fills the paragraph's last line, which is then spread to the
   * column's edge and stands on the fold, as if the letter went on behind it. Sizes are
   * read from the layout, which the sheet's turn does not change. */
  const fitWords = () => {
    if (!letter || letter.hidden) return;
    const room = { width: letterWords.clientWidth, height: letterWords.clientHeight };
    const sheet = letter.offsetWidth;
    if (room.width === 0 || room.height === 0 || sheet === 0) return;
    letterWords.classList.add('story-letter-measuring');
    const fits = (size: number) => {
      letterText.style.fontSize = `${size}px`;
      return letterText.offsetHeight <= room.height;
    };
    let best: { column: number; size: number; full: number } | null = null;
    for (let column = 1; column >= WORDS_COLUMN - 1e-9; column -= 0.02) {
      letterText.style.width = `${column * room.width}px`;
      let [least, most] = [WORDS_SIZE.least * sheet, WORDS_SIZE.most * sheet];
      if (!fits(least)) continue;
      for (let round = 0; round < 10; round += 1) {
        const size = (least + most) / 2;
        if (fits(size)) least = size;
        else most = size;
      }
      fits(least);
      const full = (letterEnd.offsetLeft - letterBody.offsetLeft) / letterBody.clientWidth;
      const better =
        best === null ||
        (full >= WORDS_FULL && (best.full < WORDS_FULL || least > best.size)) ||
        (full < WORDS_FULL && best.full < WORDS_FULL && full > best.full);
      if (better) best = { column, size: least, full };
    }
    letterWords.classList.remove('story-letter-measuring');
    const chosen = best ?? { column: 1, size: WORDS_SIZE.least * sheet, full: 0 };
    letterText.style.width = `${chosen.column * room.width}px`;
    letterText.style.fontSize = `${chosen.size}px`;
    letterWords.dataset.spread = String(chosen.full >= WORDS_FULL);
  };

  /** The letter before the castle or lowered away (D257): at once at the page's first
   * draw and with motion reduced, else lowered or raised in LETTER_MS; hidden once it is
   * lowered, and to a screen reader as it goes. */
  const showLetter = (front: boolean) => {
    if (!letter) return;
    const was = frame.dataset.letter;
    const now = front ? 'front' : 'aside';
    if (was === now) return;
    if (lowering !== null) clearTimeout(lowering);
    lowering = null;
    const atOnce = was === undefined || matchMedia('(prefers-reduced-motion: reduce)').matches;
    letter.setAttribute('aria-hidden', String(!front));
    letter.classList.toggle('story-letter-at-once', atOnce);
    if (front) {
      letter.hidden = false;
      placeLetter();
      // Drawn lowered first, so that it rises from there.
      void letter.offsetWidth;
      frame.dataset.letter = now;
      return;
    }
    frame.dataset.letter = now;
    if (atOnce) {
      letter.hidden = true;
      return;
    }
    lowering = setTimeout(() => {
      lowering = null;
      letter.hidden = true;
    }, LETTER_MS);
  };

  /** What the scene's place shows (D251): the still while the first scene has not come
   * or the step is told over it, the still at once, the scene behind it and the zoom box
   * hidden; else the scene, come in over the still, which then leaves. */
  const showPlace = () => {
    const onStill = !came || story.steps[step]?.still === true;
    frame.dataset.still = onStill ? 'on' : 'off';
    showLetter(story.steps[step]?.letter === true);
    if (fading !== null) clearTimeout(fading);
    fading = null;
    zoom.node.hidden = onStill;
    if (onStill) {
      still.hidden = false;
      sceneParent.classList.add('story-scene-waiting');
      return;
    }
    if (!sceneParent.classList.contains('story-scene-waiting')) {
      still.hidden = true;
      return;
    }
    sceneParent.classList.remove('story-scene-waiting');
    fading = setTimeout(() => {
      fading = null;
      still.hidden = true;
    }, FADE_IN);
  };

  /** Time passes before a part marked later (D280): the scene goes dark, the part's
   * staging is drawn in the dark, comes back out of it, and the step is played, its words
   * said, once it is back. The band says nothing meanwhile. */
  const passTime = (index: number) => {
    const token = ++passing;
    words();
    voice.replaceChildren();
    heard.textContent = '';
    sceneParent.dataset.state = 'loading';
    frame.dataset.passing = 'dark';
    const darkFrom = performance.now();
    // Words on the dark, if the part has any: the dark waits for their reading (D309).
    const said = story.later?.[partsOf()[index]?.step ?? -1];
    darkWords.textContent = said ?? '';
    darkWords.hidden = !said;
    const darkMs = Math.max(PASS_DARK, said ? readingMs(said) : 0);
    const after = (then: () => void, ms: number) =>
      setTimeout(() => {
        if (token === passing && !destroyed) then();
      }, ms);
    after(() => {
      startPart(index, () => {
        if (token !== passing) return;
        after(() => {
          frame.dataset.passing = 'back';
          after(() => {
            delete frame.dataset.passing;
            darkWords.hidden = true;
            play();
          }, PASS_FADE);
        }, Math.max(0, darkFrom + PASS_FADE + darkMs - performance.now()));
      });
    }, PASS_FADE);
  };

  /** The scene as the step before left it, then this step played; `onward`, reached by
   * Next, where a part marked later opens after time has passed (D280). */
  const play = (onward = false) => {
    if (frame.dataset.passing) {
      // A step gone to while time passes is shown at once, a part started in the dark
      // started again for it.
      passing += 1;
      delete frame.dataset.passing;
      darkWords.hidden = true;
      if (!scene || loadingPart !== -1) {
        loadingPart = -1;
        shownPart = -1;
      }
    }
    const passed = partsOf()[partAt(step)];
    if (onward && passed?.later && passed.step === step && partAt(step) !== shownPart) {
      passTime(partAt(step));
      return;
    }
    words();
    showPlace();
    const index = partAt(step);
    if (index !== shownPart) {
      startPart(index);
      return;
    }
    if (!scene) return;
    const part = partsOf()[index];
    const end = partsOf()[index + 1]?.step ?? story.steps.length;
    const { events, spans, lengths } = storyEvents({
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
    scene.playback.load(
      events.filter((event) => event.tick <= span.last),
      lengths,
    );
    scene.playback.seek(span.first - 1);
    scene.playback.play();
  };

  const go = (by: 1 | -1) => {
    if (by === 1 && last()) {
      goOn();
      return;
    }
    step = Math.min(Math.max(0, step + by), story.steps.length - 1);
    play(by === 1);
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
      sayLetter();
      placeLetter();
      play();
    },
    destroy() {
      destroyed = true;
      if (fading !== null) clearTimeout(fading);
      if (lowering !== null) clearTimeout(lowering);
      resized?.disconnect();
      document.removeEventListener('keydown', onKey);
      scene?.destroy();
      scene = null;
    },
  };
}
