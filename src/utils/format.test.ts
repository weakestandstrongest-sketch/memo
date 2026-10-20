import { describe, expect, it } from 'vitest';
import { dateBucket, formatDateTime, formatRelative, truncateByWidth } from './format';

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

describe('formatRelative and dateBucket', () => {
  const now = new Date(2026, 9, 20, 15, 0);
  const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();
  it('describes recent times', () => {
    expect(formatRelative(at(20, 14, 59), now)).toBe('1分前');
    expect(formatRelative(at(20, 15, 0), now)).toBe('たった今');
    expect(formatRelative(at(20, 9), now)).toBe('6時間前');
    expect(formatRelative(at(19, 23), now)).toBe('昨日');
    expect(formatRelative(at(3, 10), now)).toBe('10月3日');
    expect(formatRelative(new Date(2025, 2, 2).toISOString(), now)).toBe('2025年3月2日');
  });
  it('sorts memos into day buckets', () => {
    expect(dateBucket(at(20, 0, 5), now)).toBe('today');
    expect(dateBucket(at(19, 23), now)).toBe('yesterday');
    expect(dateBucket(at(15, 12), now)).toBe('week');
    expect(dateBucket(at(1, 12), now)).toBe('earlier');
  });
});
