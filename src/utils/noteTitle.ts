import type { Note } from '../domain/types';
import { ja } from '../i18n/ja';

/** Longest title made from the first line of an untitled memo. */
const FIRST_LINE_MAX = 40;

/**
 * The name to show for a memo. Untitled memos (quick notes) use their first line,
 * or "無題" when they are still empty.
 */
export function displayTitle(note: Pick<Note, 'title' | 'body'>): string {
  const title = note.title.trim();
  if (title) return title;
  const firstLine = note.body
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, FIRST_LINE_MAX) : ja.note.untitled;
}

/** Text after the title, for one-line previews in lists. */
export function previewText(note: Pick<Note, 'title' | 'body'>): string {
  const lines = note.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  // An untitled memo already shows its first line as the title.
  if (!note.title.trim()) lines.shift();
  return lines.join(' ');
}

/** True when a memo has neither a title nor any text. */
export function isBlankNote(note: Pick<Note, 'title' | 'body'>): boolean {
  return !note.title.trim() && !note.body.trim();
}
