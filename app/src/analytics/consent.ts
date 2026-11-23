// The answer to the cookies that count the game's use (D328), the child's or their
// grown-up's, kept in the browser. A yes is kept for good. A no is kept with its
// moment, and lasts a day and a half: after it the notice asks again.

const KEY = 'kydux.cookies';
const YES = 'yes';
/** A no is written as `no@<its moment, in milliseconds>`. */
const NO = /^no@(\d+)$/;
/** How long a no is kept before the notice asks again, in milliseconds. */
export const REFUSAL_LASTS_MS = 36 * 60 * 60 * 1000;

type Kept = Pick<Storage, 'getItem'> | null;
type Keeps = Pick<Storage, 'setItem'> | null;

function read(storage: Kept): string {
  try {
    return storage?.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

function write(answer: string, storage: Keeps): void {
  try {
    storage?.setItem(KEY, answer);
  } catch {
    // A browser that refuses storage is asked again at its next visit.
  }
}

/** Whether the cookies have been accepted in this browser. */
export function accepted(storage: Kept = store()): boolean {
  return read(storage) === YES;
}

/** Whether the notice has its answer at the moment `now`: a yes, or a no that still
 * lasts. */
export function answered(storage: Kept = store(), now: number = Date.now()): boolean {
  const answer = read(storage);
  if (answer === YES) return true;
  const refused = NO.exec(answer);
  if (!refused) return false;
  const since = now - Number(refused[1]);
  return since >= 0 && since < REFUSAL_LASTS_MS;
}

export function accept(storage: Keeps = store()): void {
  write(YES, storage);
}

export function refuse(storage: Keeps = store(), now: number = Date.now()): void {
  write(`no@${now}`, storage);
}

/** The names of Google Analytics' cookies among a document's cookies. */
export function countingCookies(cookies: string): string[] {
  return cookies
    .split(';')
    .map((cookie) => (cookie.split('=')[0] ?? '').trim())
    .filter((name) => name.startsWith('_ga'));
}

/** The domains a cookie of this host may have been set on: none, the host, and each
 * domain above it down to two labels, with a dot before. */
export function cookieDomains(host: string): string[] {
  const labels = host.split('.');
  const domains = ['', host];
  for (let from = 0; labels.length - from >= 2; from += 1) domains.push(`.${labels.slice(from).join('.')}`);
  return domains;
}

/** Takes the yes back: the answer is a no, given now, and the counting cookies are
 * deleted. */
export function withdraw(): void {
  refuse();
  for (const name of countingCookies(document.cookie)) {
    for (const domain of cookieDomains(location.hostname)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

function store(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
