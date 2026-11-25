// When a screen's pictures are in (D341): the start screen and the welcome page fetch
// their own pictures before the page fetches anything for the screens after them. A
// picture that fails counts as come, one the browser fetches only when it is scrolled
// to is not waited for, and the wait is never longer than PICTURES_MS.

/** What is asked of a picture: an `img` of the page, or a stand-in under test. */
export interface Picture {
  complete: boolean;
  loading?: string;
  addEventListener(kind: 'load' | 'error', then: () => void, options?: { once: boolean }): void;
}

/** The most the page waits for a screen's pictures, in milliseconds. */
export const PICTURES_MS = 5000;

/** Resolves once every one of `pictures` has come or failed, and after `most`
 * milliseconds at the latest. */
export function pictured(pictures: Iterable<Picture>, most = PICTURES_MS): Promise<void> {
  const awaited = [...pictures]
    .filter((picture) => !picture.complete && picture.loading !== 'lazy')
    .map(
      (picture) =>
        new Promise<void>((come) => {
          picture.addEventListener('load', () => come(), { once: true });
          picture.addEventListener('error', () => come(), { once: true });
        }),
    );
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, most);
    void Promise.all(awaited).then(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}
