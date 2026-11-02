// A floating figure never stands still (D120): while it stands, its frames go
// standing, first step, standing, second step, slowly and without end, its dress
// swaying at the hem; a walk stops the swaying, and its end starts it again.

/** How long each frame of the swaying is shown, in milliseconds. */
export const SWAY_MS = 450;
/** The frames of a row the swaying goes through: the standing frame between the
 * two step frames, whose dress is grown and swung (tools/art/figures.py). */
export const SWAY_STEPS = [1, 0, 1, 2] as const;

/** A clock that calls back every so many milliseconds until stopped: the scene's
 * own, or a fake one in a test. */
export interface SwayClock {
  every(ms: number, callback: () => void): () => void;
}

export class Sway {
  private stopTimer: (() => void) | null = null;
  private index = 0;

  /** `show` draws a step of the figure's row, the way it faces now. */
  constructor(
    private readonly clock: SwayClock,
    private readonly show: (step: number) => void,
  ) {}

  /** The standing frame, and the swaying from it on. */
  start(): void {
    this.stop();
    this.index = 0;
    this.show(SWAY_STEPS[0]);
    this.stopTimer = this.clock.every(SWAY_MS, () => {
      this.index = (this.index + 1) % SWAY_STEPS.length;
      this.show(SWAY_STEPS[this.index] ?? SWAY_STEPS[0]);
    });
  }

  /** No more swaying: a walk steps the frames, or the figure is gone. */
  stop(): void {
    this.stopTimer?.();
    this.stopTimer = null;
  }

  get swaying(): boolean {
    return this.stopTimer !== null;
  }
}
