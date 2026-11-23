// Where the game is published, and where its visits are counted there (D328). The
// same files run everywhere: on any other host, a computer of one's own or a server of
// trials, the page counts nothing, asks nothing and loads nothing from outside.

export interface Site {
  /** The hosts the game is published on. */
  hosts: readonly string[];
  /** Google Analytics' measurement id. */
  analytics: string;
  /** GoatCounter's address that counts a page. */
  goatcounter: string;
  /** What every path counted begins with: GoatCounter's site is shared with kidux.org. */
  prefix: string;
}

export const SITE: Site = {
  hosts: ['kydux.kidux.org'],
  analytics: 'G-LHD6DKXB9P',
  goatcounter: 'https://kidux.goatcounter.com/count',
  prefix: '/kydux',
};

/** Whether the page is the published game, by the host it was asked from. */
export function published(host: string = globalThis.location?.hostname ?? ''): boolean {
  return SITE.hosts.includes(host);
}
