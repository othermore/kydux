import { describe, expect, it } from 'vitest';
import { worldStamp } from '../../scripts/stamp.mjs';
import { staleWorld } from './stamp';

describe('the world stamp', () => {
  it('is the same for the same files, in any order, and another for a changed line', () => {
    const files = [
      { name: 'kydux_world/world.py', data: 'def sleep():\n    walk()\n' },
      { name: 'content/levels/your-bed/level.json', data: '{"id": "your-bed"}\n' },
    ];
    const stamp = worldStamp(files);
    expect(stamp).toMatch(/^[0-9a-f]{12}$/);
    expect(worldStamp([...files].reverse())).toBe(stamp);
    const changed = [files[0]!, { ...files[1]!, data: '{"id": "your-bed", "start": [16, 7]}\n' }];
    expect(worldStamp(changed)).not.toBe(stamp);
  });

  it('holds the running world to the page: another stamp, or none, is a stale world', () => {
    expect(staleWorld('cdc7d1ab9503', 'cdc7d1ab9503')).toBe(false);
    expect(staleWorld('cdc7d1ab9503', '0123456789ab')).toBe(true);
    expect(staleWorld('cdc7d1ab9503', undefined)).toBe(true);
    expect(staleWorld('cdc7d1ab9503', '')).toBe(true);
  });
});
