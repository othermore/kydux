// The camera on the scene (D69): a window on it, the canvas taking the frame's
// shape, VIEW_TILES of the scene fitted to it at zoom 1 and more of the scene the
// other way, never a band of the frame's colour where the scene and its painted
// margin (D83) reach. It follows the wizard; the player zooms it with the buttons,
// a step of ZOOMS at a time, and with the wheel, a little at a time (D106), and
// drags it to look around, which lets go of the wizard until the next run. In a
// story (D74) it is a window that keeps whoever each step is about, with their
// words, inside it, gliding only when they push past its edge, and never jumping;
// dragged, it stays where it was dragged until the next step, so that the child
// can watch someone the story does not follow (D106). At a level's start it shows the
// wizard and every actor, zooming out as far as it must and no farther, and the run
// takes it back to the wizard, gliding (sprint 31).
// A story step may frame a place (D199): a box of cells shown whole, or the scene's
// width, held until a later step frames another or none.
// It says data-zoom (the zoom, to two decimals), data-following, data-dragged
// while a drag has let go of it, and data-view and data-bounds (the window and
// the scene with its margin, in tiles across and down, "w×h") on the scene's
// parent.

import Phaser from 'phaser';
import { TILE } from './placeholders';
import type { Tile } from './sight';
import { boxFrame, type StoryFraming, startFrame, steppedZoom, storyMiddle, wheeledZoom, ZOOMS } from './zooming';

export { ZOOMS };

/** The most of a scene the camera shows at zoom 1, in tiles across and down. */
export const VIEW_TILES: Tile = [15, 9];
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
  /** Whether the scene is painted: then the window never reaches past the painting
   * and its margin, however wide the canvas (D92). */
  painted: boolean;
  /** In a story, the point the camera is on before any step. */
  story: { x: number; y: number } | null;
  wizard: () => Phaser.GameObjects.Sprite;
  /** A figure with its words, for the story's window to keep in view. */
  around: (figure: Phaser.GameObjects.Sprite) => Phaser.Geom.Rectangle;
  /** Told the camera's zoom, the scene's pixels to the screen's, each time it changes. */
  zoomed: (cameraZoom: number) => void;
}

export class SceneCamera {
  /** In a story, who the camera is with: whoever the last step was about. */
  focus: Phaser.GameObjects.Sprite | null = null;
  /** The zoom, against the camera's fit (1 shows VIEW_TILES). */
  private zoom = 1;
  /** In a story, what the camera follows: the focus, or the story's point; null
   * once a drag has let go of it. */
  private followed: { x: number; y: number } | null = null;
  /** Whether a drag has let go of what the camera follows, until follow(). */
  private dragged = false;
  /** Whether it stands where a level's start framed it, off the wizard, until follow(). */
  private framed = false;
  /** In a story, the place a step frames (D199), held until a step frames none. */
  private placed: StoryFraming | null = null;

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
      if (dy !== 0) this.zoomWheel(dy);
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
      this.parent.dataset.dragged = 'true';
      this.dragged = true;
      camera.scrollX -= dx / camera.zoom;
      camera.scrollY -= dy / camera.zoom;
    });
  }

  /** The camera back on the wizard, following it; in a story, gliding back to
   * whoever the last step was about, or to the story's point before any step. */
  follow(): void {
    const camera = this.camera;
    const story = this.parts.story;
    this.dragged = false;
    delete this.parent.dataset.dragged;
    if (story && this.placed) {
      this.showPlaced(this.placed);
      return;
    }
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
    const { scrollX, scrollY } = camera;
    camera.startFollow(wizard, true, 0.2, 0.2);
    // From the frame of a level's start it glides; else it is on the wizard at once.
    if (this.framed) camera.setScroll(scrollX, scrollY);
    else camera.centerOn(wizard.x, wizard.y);
    this.framed = false;
    delete this.parent.dataset.framed;
    this.parent.dataset.following = 'true';
  }

  /** At a level's start: the wizard and every actor, `figures` being their tiles and
   * the wizard's first, in the window, zoomed out as far as it must and no farther. On
   * the wizard when they all fit round it; else on them, until a run or Find my wizard. */
  frame([wizard, ...others]: [Tile, ...Tile[]]): void {
    const camera = this.camera;
    const scale = this.fit() * TILE;
    const shown: Tile = [camera.width / scale, camera.height / scale];
    const { zoom, centre } = startFrame(others, wizard, shown, this.zoom, this.least());
    if (Math.abs(zoom - this.zoom) > 1e-6) {
      this.zoom = zoom;
      this.applyZoom();
    }
    if (!centre) {
      this.framed = false;
      this.follow();
      return;
    }
    camera.stopFollow();
    camera.centerOn(centre[0] * TILE, centre[1] * TILE);
    this.framed = true;
    this.parent.dataset.framed = 'true';
    this.parent.dataset.following = 'false';
  }

  /** In a story, a step's framing (D199): a box of cells shown whole and centred, or
   * the scene's width on the window's middle, kept until a step frames none; null lets
   * the camera follow whoever the steps are about again. data-camera-fit says it. */
  place(framing: StoryFraming | null): void {
    this.placed = framing;
    if (!framing) {
      delete this.parent.dataset.cameraFit;
      this.follow();
      return;
    }
    this.parent.dataset.cameraFit = 'fit' in framing ? framing.fit.join(',') : 'wide';
    this.showPlaced(framing);
  }

  /** In a story, the top and the bottom, in the scene's pixels, of what a step's
   * framing shows (D199); null where the camera follows whoever the steps are about. */
  shown(): [number, number] | null {
    if (!this.placed) return null;
    const camera = this.camera;
    const top = camera.scrollY + (camera.height / 2) * (1 - 1 / camera.zoom);
    return [top, top + camera.height / camera.zoom];
  }

  private showPlaced(framing: StoryFraming): void {
    const camera = this.camera;
    const scale = this.fit() * TILE;
    const shown: Tile = [camera.width / scale, camera.height / scale];
    const middle = camera.midPoint.y / TILE;
    const box: [number, number, number, number] =
      'fit' in framing ? framing.fit : [0, Math.floor(middle), this.parts.columns - 1, Math.floor(middle)];
    const { zoom, centre } = boxFrame(box, shown, this.least());
    camera.stopFollow();
    camera.deadzone = null;
    this.followed = null;
    if (Math.abs(zoom - this.zoom) > 1e-6) {
      this.zoom = zoom;
      this.applyZoom();
    }
    camera.centerOn(centre[0] * TILE, 'fit' in framing ? centre[1] * TILE : middle * TILE);
    this.parent.dataset.following = 'false';
  }

  /** In a story, at each tick: with whoever the step is about, unless a drag has
   * let go of them, until the next step. */
  keep(): void {
    if (!this.dragged && !this.placed) this.follow();
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
    // The point followed is the middle of the figure and its words, or, when the two
    // are taller than the window, what shows the figure whole, its words going past.
    const viewed = camera.height / camera.zoom;
    const middle = storyMiddle(box.top, box.bottom, viewed, STORY_EDGE);
    camera.setFollowOffset(this.focus.x - box.centerX, this.focus.y - middle);
    const width = Math.max(0, camera.width / camera.zoom - box.width - STORY_EDGE * 2);
    const height = Math.max(0, viewed - box.height - STORY_EDGE * 2);
    // Phaser's setDeadzone puts the camera on its target at once while it follows;
    // a dead zone already made is only resized, and the camera stays.
    if (camera.deadzone) camera.deadzone.setSize(width, height);
    else {
      const { scrollX, scrollY } = camera;
      camera.setDeadzone(width, height);
      camera.setScroll(scrollX, scrollY);
    }
  }

  /** Whether the camera can zoom a step of the buttons: never out so far that its
   * window would reach past the scene's edges, its margin with them, and show the
   * frame's colour beside it. */
  canZoomBy(step: 1 | -1): boolean {
    const zoom = steppedZoom(this.zoom, step);
    if (zoom === null) return false;
    if (step > 0) return true;
    return this.fits(zoom);
  }

  /** One step of the buttons in or out of ZOOMS, about the camera's middle. */
  zoomBy(step: 1 | -1): boolean {
    const zoom = steppedZoom(this.zoom, step);
    if (zoom === null || !this.canZoomBy(step)) return false;
    this.setZoom(zoom);
    return true;
  }

  /** A turn of the wheel: the zoom a little in or out (D106), never out past what
   * the scene and its margin hold. */
  zoomWheel(deltaY: number): void {
    const zoom = Math.max(wheeledZoom(this.zoom, deltaY), Math.min(this.zoom, this.least()));
    if (Math.abs(zoom - this.zoom) > 1e-6) this.setZoom(zoom);
  }

  private setZoom(zoom: number): void {
    this.zoom = zoom;
    this.applyZoom();
    if (this.parts.story) this.fitWindow();
  }

  /** How far the camera is zoomed at the zoom step 1: the window, VIEW_TILES of the
   * scene or the whole of a small one, fitted to the canvas, which takes the
   * frame's shape; the other way the canvas shows more of the scene, so that no
   * band of the frame's colour is left beside it. On a painted scene the zoom
   * goes no lower than the painting and its margin fill the canvas (D92). */
  private fit(): number {
    const { width, height } = this.scene.scale.gameSize;
    const { columns, rows, margin } = this.parts;
    const shownX = Math.min(columns, VIEW_TILES[0]) * TILE;
    const shownY = Math.min(rows, VIEW_TILES[1]) * TILE;
    const fitted = Math.min(width / shownX, height / shownY);
    if (!this.parts.painted) return Math.max(0.01, fitted);
    const [left, top, right, bottom] = margin;
    const floor = Math.max(width / ((columns + left + right) * TILE), height / ((rows + top + bottom) * TILE));
    return Math.max(0.01, fitted, floor);
  }

  /** The camera at the zoom, fitted to the canvas; data-zoom is the zoom's. Zoomed
   * out further than the scene and its margin hold, at a new size of the frame, the
   * camera comes back in as far as it must, never past the zoom of 1. */
  private applyZoom(): void {
    this.zoom = Math.max(this.zoom, Math.min(1, this.least()));
    this.camera.setZoom(this.fit() * this.zoom);
    this.parent.dataset.zoom = String(Math.round(this.zoom * 100) / 100);
    this.parts.zoomed(this.camera.zoom);
    const camera = this.camera;
    const bounds = camera.getBounds();
    const tiles = (width: number, height: number) => `${(width / TILE).toFixed(2)}×${(height / TILE).toFixed(2)}`;
    this.parent.dataset.view = tiles(camera.width / camera.zoom, camera.height / camera.zoom);
    this.parent.dataset.bounds = tiles(bounds.width, bounds.height);
  }

  /** Whether the window, at a zoom, lies within the scene and its margin. */
  private fits(zoom: number): boolean {
    return zoom >= this.least() - 1e-6;
  }

  /** The least zoom at which the window lies within the scene and its margin. */
  private least(): number {
    const camera = this.camera;
    const bounds = camera.getBounds();
    const fit = this.fit();
    return Math.max(camera.width / (fit * (bounds.width + 1)), camera.height / (fit * (bounds.height + 1)));
  }
}
