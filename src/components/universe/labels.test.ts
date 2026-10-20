import { describe, expect, it } from 'vitest';
import { pickVisibleLabels, type LabelCandidate } from './labels';

const label = (id: string, x: number, top: number, priority = 3, degree = 0): LabelCandidate => ({
  id,
  x,
  top,
  width: 100,
  height: 14,
  priority,
  degree,
});

describe('pickVisibleLabels', () => {
  it('shows labels that do not overlap', () => {
    expect(pickVisibleLabels([label('a', 0, 0), label('b', 300, 0)])).toEqual(new Set(['a', 'b']));
  });

  it('hides the less important of two overlapping labels', () => {
    const result = pickVisibleLabels([label('low', 0, 0, 3), label('high', 20, 5, 1)]);
    expect(result).toEqual(new Set(['high']));
  });

  it('prefers stars with more connections', () => {
    const result = pickVisibleLabels([label('few', 0, 0, 3, 1), label('many', 10, 0, 3, 5)]);
    expect(result).toEqual(new Set(['many']));
  });

  it('always shows the selected star', () => {
    const result = pickVisibleLabels([label('neighbor', 0, 0, 1), label('selected', 5, 0, 0)]);
    expect(result.has('selected')).toBe(true);
  });
});
