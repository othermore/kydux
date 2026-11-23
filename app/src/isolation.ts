// The page isolated on a server that sends no headers (D329). A server of the game's own
// sends the two headers that isolate the page, so that a runaway program can be stopped
// in place (D11); a host of plain files cannot. There the page registers a service
// worker, public/isolate.js, which answers every request of the game's own with those
// headers and its Content-Security-Policy, and loads itself once more, through it.

/** Kept for the tab's life while the page loads itself again, so that a browser that
 * stays without isolation is asked once and no more. */
const TRIED = 'kydux.isolating';

function tab(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

/** Whether the page has to isolate itself: it is not isolated, and it can be. */
export function needsIsolating(): boolean {
  if (globalThis.crossOriginIsolated === true) {
    tab()?.removeItem(TRIED);
    return false;
  }
  return globalThis.isSecureContext === true && 'serviceWorker' in navigator && tab()?.getItem(TRIED) !== '1';
}

/** Registers the service worker and loads the page again through it. Resolves to true
 * when the page is loading again, false when it stays as it is: a program that runs
 * away is then stopped by starting Python again. */
export async function isolate(): Promise<boolean> {
  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}isolate.js`);
    await navigator.serviceWorker.ready;
    tab()?.setItem(TRIED, '1');
    location.reload();
    return true;
  } catch (error) {
    console.info('Kydux: the page could not isolate itself.', error); // i18n-ignore
    return false;
  }
}
