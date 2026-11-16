// What the browser tests share with their configuration: how much longer they wait
// on GitHub's runner, which plays the game some three times slower than hija (D191).

/** How many times longer every wait is under `CI`. */
export const CI_TIMES = process.env.CI ? 3 : 1;

/**
 * A wait of the specs' own, `ms` milliseconds here and three times that under `CI`:
 * a `waitForFunction`'s or an expect's timeout, or a pause that lets the scene settle.
 * A pause that samples a moment inside a tick is not one: it keeps its milliseconds.
 */
export function ciTimes(ms: number): number {
  return ms * CI_TIMES;
}
