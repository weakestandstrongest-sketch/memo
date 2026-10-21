import { describe, expect, it } from 'vitest';
import { ja } from '../i18n/ja';
import { isStarShape, randomShape, shapeOf, STAR_SHAPES } from './stars';

describe('star shapes', () => {
  it('has 16 distinct shapes, each with a Japanese name', () => {
    expect(STAR_SHAPES).toHaveLength(16);
    expect(new Set(STAR_SHAPES).size).toBe(16);
    for (const s of STAR_SHAPES) expect(ja.stars[s]).toBeTruthy();
  });

  it('recognises only known shapes', () => {
    expect(isStarShape('heart')).toBe(true);
    expect(isStarShape('dragon')).toBe(false);
    expect(isStarShape(undefined)).toBe(false);
  });

  it('uses the memo’s own shape, or one from its old kind', () => {
    expect(shapeOf({ star: 'flower', category: 'ideas' })).toBe('flower');
    expect(shapeOf({ category: 'journal' })).toBe('crescent');
  });

  it('picks a shape from the list', () => {
    expect(randomShape(() => 0)).toBe(STAR_SHAPES[0]);
    expect(randomShape(() => 0.9999)).toBe(STAR_SHAPES[15]);
    expect(STAR_SHAPES).toContain(randomShape());
  });
});
