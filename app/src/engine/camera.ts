// The camera on the scene (D69): a window on it, the canvas taking the frame's
// shape, VIEW_TILES of the scene fitted to it at zoom 1 and more of the scene the
// other way, never a band of the frame's colour where the scene and its painted
// margin (D83) reach. It follows the wizard; the player zooms it with the buttons
// and the wheel and drags it to look around, which lets go of the wizard until the
// next run. In a story (D74) it is a window that keeps whoever each step is about,
// with their words, inside it, gliding only when they push past its edge, and
// never jumping. It says data-zoom (the zoom's step) and data-following on the
// scene's parent.

import Phaser from 'phaser';
import { TILE } from './placeholders';
import type { Tile } from './sight';

/** The most of a scene the camera shows at zoom 1, in tiles across and down. */
export const VIEW_TILES: Tile = [15, 9];
/** The zooms the player steps through, from the whole scene to a close look. */
export const ZOOMS = [0.5, 0.75, 1, 1.5, 2] as const;
const ZOOM_START = ZOOMS.indexOf(1);
/** How far, in pixels, the pointer moves before a press is a drag of the camera. */
const DRAG_THRESHOLD = 6;
/** In a story, the room, in the scene's pixels, the camera's window keeps between
 * its edge and the figure it follows with its words. */
const STORY_EDGE = TILE;

export interface CameraParts {
  /** The scene's size in tiles, and the margin painted round it on each side
   * (left, top, right, bottom). */
  columns: number;
  rows: number;
  margin: [number, number, number, number];
  /** In a story, the point the camera is on before any step. */
  story: { x: number; y: number } | null;
  wizard: () => Phaser.GameObjects.Sprite;
  /** A figure with its words, for the story's window to keep in view. */
  around: (figure: Phaser.GameObjects.Sprite) => Phaser.Geom.Rectangle;
}

export class SceneCamera {
  /** In a story, who the camera is with: whoever the last step was about. */
  focus: Phaser.GameObjects.Sprite | null = null;
  /** The zoom's step in ZOOMS. */
  private zoomStep = ZOOM_START;
  /** In a story, what the camera follows: the focus, or the story's point; null
   * once a drag has let go of it. */
  private followed: { x: number; y: number } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly parent: HTMLElement,
    private readonly parts: CameraParts,
  ) {}

  private get camera(): Phaser.Cameras.Scene2D.Camera {
    return this.scene.cameras.main;
  }

  /** The camera over the whole scene, on the wizard; the wheel zooms it and a drag
   * moves it, which lets go of the wizard until the next run. */
  setUp(): void {
    const camera = this.camera;
    const { columns, rows, margin } = this.parts;
    const [left, top, right, bottom] = margin;
    camera.setBounds(-left * TILE, -top * TILE, (columns + left + right) * TILE, (rows + top + bottom) * TILE);
    camera.setRoundPixels(true);
    this.applyZoom();
    // The canvas is the frame's size: the zoom fits the window to it again, and a
    // story's window is made again.
    this.scene.scale.on('resize', (size: Phaser.Structs.Size) => {
      camera.setSize(size.width, size.height);
      this.applyZoom();
      if (this.parts.story) this.fitWindow();
    });
    if (this.parts.story) camera.centerOn(this.parts.story.x, this.parts.story.y);
    this.follow();
    this.scene.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (dy !== 0) this.zoomBy(dy < 0 ? 1 : -1);
    });
    // The wheel over the scene zooms it, and does not scroll the page under it.
    this.parent.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
    // A drag lets go of the wizard only once it is a real drag, a few pixels long, so
    // that a click or a shaky tap does not (12.6).
    let dragging = false;
    this.scene.input.on('pointerdown', () => {
      dragging = false;
    });
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      if (!dragging) {
        const far = Math.hypot(pointer.x - pointer.downX, pointer.y - pointer.downY);
        if (far < DRAG_THRESHOLD) return;
        dragging = true;
      }
      const dx = pointer.x - pointer.prevPosition.x;
      const dy = pointer.y - pointer.prevPosition.y;
      if (dx === 0 && dy === 0) return;
      camera.stopFollow();
      this.followed = null;
      this.parent.dataset.following = 'false';
      camera.scrollX -= dx / camera.zoom;
      camera.scrollY -= dy / camera.zoom;
    });
  }

  /** The camera back on the wizard, following it; in a story, gliding back to
   * whoever the last step was about, or to the story's point before any step. */
  follow(): void {
    const camera = this.camera;
    const story = this.parts.story;
    if (story) {
      const target = this.focus ?? story;
      if (target !== this.followed) {
        // Phaser's startFollow puts the camera on its target at once: to glide, it
        // keeps where it was and lets the lerp take it there.
        const { scrollX, scrollY } = camera;
        camera.startFollow(target, true, 0.08, 0.08);
        camera.setScroll(scrollX, scrollY);
        this.followed = target;
      }
      this.fitWindow();
      this.parent.dataset.following = String(this.focus !== null);
      return;
    }
    const wizard = this.parts.wizard();
    camera.startFollow(wizard, true, 0.2, 0.2);
    camera.centerOn(wizard.x, wizard.y);
    this.parent.dataset.following = 'true';
  }

  /** In a story, the camera's window: a dead zone the size of the view less the
   * figure followed with its words and a margin. While they are inside, the
   * camera stays still; when the figure pushes past an edge, the camera glides
   * just far enough to keep them in. Before any step it keeps on the story's
   * point. In the scene's pixels, as Phaser compares the dead zone with the figure. */
  fitWindow(): void {
    const camera = this.camera;
    if (!this.followed) return;
    if (!this.focus || this.followed !== this.focus) {
      camera.setFollowOffset(0, 0);
      camera.deadzone = null;
      return;
    }
    const box = this.parts.around(this.focus);
    // The point followed is the middle of the figure and its words.
    camera.setFollowOffset(this.focus.x - box.centerX, this.focus.y - box.centerY);
    const width = Math.max(0, camera.width / camera.zoom - box.width - STORY_EDGE * 2);
    const height = Math.max(0, camera.height / camera.zoom - box.height - STORY_EDGE * 2);
    // Phaser's setDeadzone puts the camera on its target at once while it follows;
    // a dead zone already made is only resized, and the camera stays.
    if (camera.deadzone) camera.deadzone.setSize(width, height);
    else {
      const { scrollX, scrollY } = camera;
      camera.setDeadzone(width, height);
      camera.setScroll(scrollX, scrollY);
    }
  }

  /** Whether the camera can zoom a step: never out so far that its window would
   * reach past the scene's edges, its margin with them, and show the frame's
   * colour beside it. */
  canZoomBy(step: 1 | -1): boolean {
    const zoom = ZOOMS[this.zoomStep + step];
    if (zoom === undefined) return false;
    if (step > 0) return true;
    return this.fits(zoom);
  }

  /** One step in or out of ZOOMS, about the camera's middle. */
  zoomBy(step: 1 | -1): boolean {
    if (!this.canZoomBy(step)) return false;
    this.zoomStep += step;
    this.applyZoom();
    if (this.parts.story) this.fitWindow();
    return true;
  }

  /** How far the camera is zoomed at the zoom step 1: the window, VIEW_TILES of the
   * scene or the whole of a small one, fitted to the canvas, which takes the
   * frame's shape; the other way the canvas shows more of the scene, so that no
   * band of the frame's colour is left beside it. */
  private fit(): number {
    const { width, height } = this.scene.scale.gameSize;
    const shownX = Math.min(this.parts.columns, VIEW_TILES[0]) * TILE;
    const shownY = Math.min(this.parts.rows, VIEW_TILES[1]) * TILE;
    return Math.max(0.01, Math.min(width / shownX, height / shownY));
  }

  /** The camera at the zoom step, fitted to the canvas; data-zoom is the step's.
   * Zoomed out further than the scene and its margin hold, at a new size of the
   * frame, the camera steps back in, never past the step it starts at. */
  private applyZoom(): void {
    while (this.zoomStep < ZOOM_START && !this.fits(ZOOMS[this.zoomStep] ?? 1)) this.zoomStep += 1;
    const step = ZOOMS[this.zoomStep] ?? 1;
    this.camera.setZoom(this.fit() * step);
    this.parent.dataset.zoom = String(step);
  }

  /** Whether the window, at a zoom step, lies within the scene and its margin. */
  private fits(step: number): boolean {
    const camera = this.camera;
    const bounds = camera.getBounds();
    const shown = this.fit() * step;
    return camera.width / shown <= bounds.width + 1 && camera.height / shown <= bounds.height + 1;
  }
}
