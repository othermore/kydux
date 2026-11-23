import { afterEach, describe, expect, it, vi } from 'vitest';
import { debugging } from './debugging';

function at(hostname: string, search: string): void {
  vi.stubGlobal('location', { hostname, search });
}

describe("the tester's mode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is opened by ?debug on a computer of one\'s own and on a server of trials', () => {
    at('localhost', '?debug');
    expect(debugging()).toBe(true);
    at('trials.example.org', '?debug=1&other');
    expect(debugging()).toBe(true);
  });

  it('is closed without ?debug', () => {
    at('localhost', '');
    expect(debugging()).toBe(false);
    at('localhost', '?debugging');
    expect(debugging()).toBe(false);
  });

  it('is not there on the published host (D335)', () => {
    at('kydux.kidux.org', '?debug');
    expect(debugging()).toBe(false);
  });
});
