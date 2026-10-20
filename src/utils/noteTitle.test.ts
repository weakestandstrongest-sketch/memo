import { describe, expect, it } from 'vitest';
import { displayTitle, isBlankNote, previewText } from './noteTitle';

describe('displayTitle', () => {
  it('uses the title when there is one', () => {
    expect(displayTitle({ title: ' 買い物 ', body: '牛乳' })).toBe('買い物');
  });
  it('uses the first line of the text for untitled memos', () => {
    expect(displayTitle({ title: '', body: '\n  電車で思いついた\n続き' })).toBe('電車で思いついた');
  });
  it('falls back to 無題', () => {
    expect(displayTitle({ title: '', body: '   ' })).toBe('無題');
  });
  it('keeps titles from first lines short', () => {
    expect(displayTitle({ title: '', body: 'あ'.repeat(100) })).toHaveLength(40);
  });
});

describe('previewText', () => {
  it('shows the text under a titled memo', () => {
    expect(previewText({ title: 'T', body: 'one\n\ntwo' })).toBe('one two');
  });
  it('skips the line already used as the title', () => {
    expect(previewText({ title: '', body: 'first\nsecond' })).toBe('second');
  });
});

describe('isBlankNote', () => {
  it('detects empty memos', () => {
    expect(isBlankNote({ title: ' ', body: '\n' })).toBe(true);
    expect(isBlankNote({ title: '', body: 'x' })).toBe(false);
  });
});
