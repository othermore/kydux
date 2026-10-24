// Pack kydux_world into public/world.zip, which the worker unpacks into Pyodide's
// file system, and copy the levels into public/content/ for the page to fetch:
// what the game needs of a level, never its solution or its wrong answers,
// which are the tests' and would otherwise ship with the game.
//
// The zip is written here, stored without compression and with a fixed date, so
// that the same sources always give the same bytes and no zip library is needed.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(app, '..');
const world = join(repo, 'world', 'kydux_world');
const publicDir = join(app, 'public');

function* walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    if (name === '__pycache__' || name.endsWith('.pyc')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data) {
  let c = 0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 1980-01-01 00:00, the earliest date a zip can hold.
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    locals.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

const entries = [...walk(world)].map((path) => ({
  name: relative(join(world, '..'), path).split(sep).join('/'),
  data: readFileSync(path),
}));
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'world.zip'), zip(entries));

const content = join(publicDir, 'content');
rmSync(content, { recursive: true, force: true });
const shipped = (path) => {
  const name = relative(join(repo, 'content'), path).split(sep);
  return !(name.includes('wrong') || name.at(-1) === 'solution.py');
};
if (existsSync(join(repo, 'content'))) {
  cpSync(join(repo, 'content'), content, { recursive: true, filter: shipped });
}

mkdirSync(content, { recursive: true });

// The course: its chapters in order, each with its items, lessons and levels
// (D32). The page reads it to draw the map and to know what comes next.
const chaptersDir = join(repo, 'content', 'chapters');
const chapters = existsSync(chaptersDir)
  ? readdirSync(chaptersDir)
      .filter((name) => existsSync(join(chaptersDir, name, 'chapter.json')))
      .sort()
      .map((name) => {
        const chapter = JSON.parse(readFileSync(join(chaptersDir, name, 'chapter.json'), 'utf8'));
        return { id: chapter.id, items: chapter.items };
      })
  : [];
// What the child knows on reaching each level (D40): every name taught by that
// level and by every level before it in the course. The page gives it to the
// world and to the notebook in place of the level's own `api`, so that an action
// once learned stays known; the notebook still shows only the objects present.
// The concepts known on reaching each level (D60): every `concept:<name>` the
// lessons before it teach, as arguments or comments, which the notebook follows.
// And each item's number within its chapter and its kind (D56): Lesson 3,
// Practice 4, so that no text carries a number.
const readJson = (...path) => JSON.parse(readFileSync(join(repo, 'content', ...path), 'utf8'));
const known = {};
const concepts = {};
const numbers = {};
const taught = new Set();
const ideas = new Set();
for (const chapter of chapters) {
  const counted = {};
  for (const item of chapter.items) {
    const [kind, id] = item.split(':');
    if (kind === 'lesson') {
      for (const name of readJson('lessons', id, 'lesson.json').teaches ?? []) {
        if (name.startsWith('concept:')) ideas.add(name.slice('concept:'.length));
      }
    }
    const numbered = kind === 'level' ? (readJson('levels', id, 'level.json').kind ?? 'practice') : kind;
    if (numbered !== 'story') {
      counted[numbered] = (counted[numbered] ?? 0) + 1;
      numbers[item] = { kind: numbered, n: counted[numbered] };
    }
    if (kind !== 'level') continue;
    for (const name of readJson('levels', id, 'level.json').api ?? []) taught.add(name);
    known[id] = [...taught];
    concepts[id] = [...ideas];
  }
}
writeFileSync(
  join(content, 'course.json'),
  `${JSON.stringify({ chapters, known, concepts, numbers }, null, 2)}\n`,
);

// The table of what the child can type, from the world itself (D30): the
// notebook and the editor's completion read it, so the page needs no Python
// to show it. The venv's Python when there is one, the PATH's otherwise, as in CI.
const venvPython = join(repo, '.venv', 'bin', 'python');
const python = existsSync(venvPython) ? venvPython : 'python3';
const table = spawnSync(python, ['-m', 'kydux_world.api'], {
  cwd: join(repo, 'world'),
  encoding: 'utf8',
});
if (table.status !== 0) {
  console.error(`pack-world: kydux_world.api failed\n${table.stderr}`);
  process.exit(1);
}
writeFileSync(join(publicDir, 'api.json'), table.stdout);

// The names a wizard may not take (D61): the story's, the levels' and the world's,
// gathered by tools/reserved_names.py from the same files; the creator refuses them.
const reserved = spawnSync(python, [join(repo, 'tools', 'reserved_names.py')], { encoding: 'utf8' });
if (reserved.status !== 0) {
  console.error(reserved.stderr);
  process.exit(1);
}
writeFileSync(join(publicDir, 'reserved.json'), reserved.stdout);

// A level on a chapter's scene (D65) ships with the scene's map built in, its
// start and its end on it, so that the page loads it as any other level.
const scened = spawnSync(python, [join(repo, 'tools', 'scene_maps.py')], { encoding: 'utf8' });
if (scened.status !== 0) {
  console.error(scened.stderr);
  process.exit(1);
}
for (const [id, level] of Object.entries(JSON.parse(scened.stdout))) {
  writeFileSync(join(content, 'levels', id, 'level.json'), `${JSON.stringify(level, null, 2)}\n`);
}

console.log(
  `pack-world: ${entries.length} files in public/world.zip, content/ copied, ${chapters.length} chapters in the course`,
);
