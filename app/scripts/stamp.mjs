// The stamp of the world a page runs: the short hash of the world's Python files and
// the content packed with it, which pack-world.mjs writes into world.zip and into
// public/world-stamp.json, and which the page holds the running world to.

import { createHash } from 'node:crypto';

/** The first 12 hex digits of the sha256 of the files, each a name and its bytes,
 * taken in the order of their names, so that the same files always give the same
 * stamp and any changed byte gives another. */
export function worldStamp(files) {
  const hash = createHash('sha256');
  const sorted = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const { name, data } of sorted) {
    hash.update(name);
    hash.update('\0');
    hash.update(data);
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 12);
}
