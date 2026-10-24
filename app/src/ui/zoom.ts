// The level's zoom box over the scene (D69): + and − zoom the camera a step at a
// time, as the mouse wheel does, each turned off where the camera can go no
// further; and when a drag has let go of the wizard, Find my wizard brings the
// camera back to it (12.6), shown only while the camera is not following.

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

/** The zoom box for the scene drawn in `sceneParent`, which says data-following. */
export function zoomBox(sceneParent: HTMLElement): ZoomBox {
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
    findWizard.hidden = sceneParent.dataset.following !== 'false';
  }).observe(sceneParent, { attributes: true, attributeFilter: ['data-following'] });
  return {
    node: element('div', { className: 'zoom-box' }, [zoomIn, zoomOut, findWizard]),
    attach(handle) {
      scene = handle;
      refresh();
    },
    relabel,
  };
}
