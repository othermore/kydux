// A kind of thing's picture for a chip of the lists over the editor (D346): the art the
// level has, cropped to what is painted in it. A thing of the kind in the level with a
// cut-out of its scene gives its own; a kind with a sprite of its own
// (content/art/things/, D182) gives that; else a cut-out of the scene named after the
// kind (`old_book`); else there is none, and the chip shows its name alone. No picture
// is painted for the lists.

import { contentUrl } from '../content/address';
import type { LevelJson } from '../runtime/protocol';

interface SceneArt {
  things?: Record<string, { states?: Record<string, string> }>;
}

type Sprites = Record<string, { image?: string }>;

const fetched = new Map<string, Promise<unknown>>();

function json<T>(path: string): Promise<T | null> {
  if (!fetched.has(path)) {
    fetched.set(
      path,
      fetch(contentUrl(path))
        .then((response) =>
          response.ok && response.headers.get('content-type')?.includes('json') ? response.json() : null,
        )
        .catch(() => null),
    );
  }
  return fetched.get(path) as Promise<T | null>;
}

/** The first picture of a cut-out of the scene: lying, closed, or its first state. */
function stateOf(art: { states?: Record<string, string> } | undefined): string | null {
  const states = art?.states ?? {};
  return states.lying ?? states.closed ?? Object.values(states)[0] ?? null;
}

/** The address of a kind's picture in a level, or null. */
export async function kindPictureUrl(level: LevelJson, kind: string): Promise<string | null> {
  // A level on a painted scene names its art (painted.ts, D230).
  const painted = level.art ?? level.scene;
  const scene = typeof painted === 'string' ? painted : null;
  const art = scene ? await json<SceneArt>(`art/scenes/${scene}/art.json`) : null;
  const cutOuts = art?.things ?? {};
  const fromScene = (name: string) => {
    const file = stateOf(cutOuts[name]);
    return file && scene ? contentUrl(`art/scenes/${scene}/${file}`) : null;
  };
  const own = [
    ...((level.things as { kind?: string; id?: string; art?: string }[] | undefined) ?? []),
    ...((level.carrying as unknown[] | undefined) ?? []).map((carried) =>
      typeof carried === 'string' ? { kind: carried } : (carried as { kind?: string; id?: string; art?: string }),
    ),
  ];
  for (const thing of own) {
    if (thing.kind !== kind) continue;
    const name = thing.art ?? thing.id;
    const found = name ? fromScene(name) : null;
    if (found) return found;
  }
  const sprites = await json<Sprites>('art/things/things.json');
  const image = sprites?.[kind]?.image;
  if (image) return contentUrl(`art/things/${image}`);
  const named = Object.keys(cutOuts).find((name) => name === kind || name.endsWith(`_${kind}`));
  return named ? fromScene(named) : null;
}

const cropped = new Map<string, Promise<string | null>>();

/** A picture cropped to what is painted in it, as an address to show it from; null when
 * it cannot be loaded. */
export function croppedPicture(url: string): Promise<string | null> {
  if (!cropped.has(url)) {
    cropped.set(
      url,
      new Promise((done) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return done(url);
            context.drawImage(image, 0, 0);
            const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
            let left = width;
            let top = height;
            let right = -1;
            let bottom = -1;
            for (let y = 0; y < height; y += 1) {
              for (let x = 0; x < width; x += 1) {
                if ((data[(y * width + x) * 4 + 3] ?? 0) > 24) {
                  if (x < left) left = x;
                  if (x > right) right = x;
                  if (y < top) top = y;
                  if (y > bottom) bottom = y;
                }
              }
            }
            if (right < left || bottom < top) return done(url);
            const out = document.createElement('canvas');
            out.width = right - left + 1;
            out.height = bottom - top + 1;
            out.getContext('2d')?.drawImage(canvas, left, top, out.width, out.height, 0, 0, out.width, out.height);
            done(out.toDataURL('image/png'));
          } catch {
            done(url);
          }
        };
        image.onerror = () => done(null);
        image.src = url;
      }),
    );
  }
  return cropped.get(url) as Promise<string | null>;
}

/** A kind's picture in a level, cropped, or null. */
export async function kindPicture(level: LevelJson, kind: string): Promise<string | null> {
  const url = await kindPictureUrl(level, kind);
  return url ? croppedPicture(url) : null;
}
