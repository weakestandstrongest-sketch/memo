import { describe, expect, it } from 'vitest';
import { formatDateTime, truncateByWidth } from './format';

describe('truncateByWidth', () => {
  it('keeps short text unchanged', () => {
    expect(truncateByWidth('Short title', 30)).toBe('Short title');
    expect(truncateByWidth('半導体のしくみ', 30)).toBe('半導体のしくみ');
  });

  it('counts Japanese characters as double width', () => {
    const jp = 'あいうえおかきくけこさしすせそたちつてと'; // 20 wide characters = width 40
    const result = truncateByWidth(jp, 30);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBe(16); // 15 characters + "…"
  });
});

describe('formatDateTime', () => {
  it('formats in Japanese', () => {
    expect(formatDateTime('2026-10-19T03:04:00.000Z')).toMatch(/2026年10月\d+日/);
  });

  it('handles invalid dates', () => {
    expect(formatDateTime('nope')).toBe('日時不明');
  });
});
