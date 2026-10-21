// What every screen of the game is to the page: a node to show, and what to do
// once it is shown, when the language changes, and when another takes its place.

export interface Screen {
  node: HTMLElement;
  /** Called once the node is in the page, which some screens measure. */
  mount?(): void;
  /** Draws every word again in the language now set. */
  relabel(): void | Promise<void>;
  destroy(): void;
}
