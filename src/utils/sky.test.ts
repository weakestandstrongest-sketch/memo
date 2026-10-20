import { describe, expect, it } from 'vitest';
import { skyPhase } from './sky';

const at = (h: number) => new Date(2026, 9, 20, h, 30);

describe('skyPhase', () => {
  it('follows the time of day', () => {
    expect(skyPhase(at(6))).toBe('dawn');
    expect(skyPhase(at(12))).toBe('day');
    expect(skyPhase(at(17))).toBe('dusk');
    expect(skyPhase(at(23))).toBe('night');
    expect(skyPhase(at(3))).toBe('night');
  });
});
