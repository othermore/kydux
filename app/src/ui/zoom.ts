// The zoom box over a level's scene and a story's (D69, D106): + and − zoom the
// camera a step at a time, the mouse wheel a little at a time, each button turned
// off where the camera can go no further; and when a drag has let go of the
// wizard, Find my wizard brings the camera back to it (12.6), in a story to whoever
// the story is with, shown only while the camera is let go.

import type { SceneHandle } from '../engine/scene';
import { t } from '../i18n';
import { element } from './dom';

export interface ZoomBox {
  node: HTMLElement;
  /** The scene, once it is drawn: until then the buttons do nothing. */
  attach(scene: SceneHandle): void;
  /** Its words again, in the language now set. */
  relabel(): void;
}

/** The zoom box for the scene drawn in `sceneParent`, which says data-following,
 * data-dragged and data-zoom; in a story, the camera is let go only by a drag. */
export function zoomBox(sceneParent: HTMLElement, { story = false } = {}): ZoomBox {
  let scene: SceneHandle | null = null;
  const zoomIn = element('button', { id: 'zoom-in', type: 'button', className: 'zoom-button' }, ['+']);
  const zoomOut = element('button', { id: 'zoom-out', type: 'button', className: 'zoom-button' }, ['−']);
  const findWizard = element(
    'button',
    { id: 'find-wizard', type: 'button', className: 'zoom-button find-wizard', hidden: true },
    [t('level.find_wizard')],
  );
  const refresh = () => {
    zoomIn.disabled = !(scene?.canZoom(1) ?? true);
    zoomOut.disabled = !(scene?.canZoom(-1) ?? true);
  };
  const relabel = () => {
    for (const [button, words] of [
      [zoomIn, t('level.zoom_in')],
      [zoomOut, t('level.zoom_out')],
    ] as const) {
      button.title = words;
      button.setAttribute('aria-label', words);
    }
    findWizard.textContent = t('level.find_wizard');
  };
  relabel();
  zoomIn.addEventListener('click', () => {
    scene?.zoom(1);
    refresh();
  });
  zoomOut.addEventListener('click', () => {
    scene?.zoom(-1);
    refresh();
  });
  findWizard.addEventListener('click', () => scene?.follow());
  new MutationObserver(() => {
    findWizard.hidden = story ? sceneParent.dataset.dragged !== 'true' : sceneParent.dataset.following !== 'false';
    // The wheel zooms too: the buttons say where it can go from there.
    refresh();
  }).observe(sceneParent, { attributes: true, attributeFilter: ['data-following', 'data-dragged', 'data-zoom'] });
  return {
    node: element('div', { className: 'zoom-box' }, [zoomIn, zoomOut, findWizard]),
    attach(handle) {
      scene = handle;
      refresh();
    },
    relabel,
  };
}
