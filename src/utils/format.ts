/** "2026年10月19日 23:17" — Japanese date format in the user's own time zone. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '日時不明';
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString('ja-JP');
  }
}

/**
 * Shortens text to roughly `maxWidth` "half-width" characters.
 * Japanese (full-width) characters count as 2, so labels look equally long
 * whether they are written in Japanese or English.
 */
export function truncateByWidth(text: string, maxWidth: number): string {
  let width = 0;
  let result = '';
  for (const ch of text) {
    const w = isWide(ch) ? 2 : 1;
    if (width + w > maxWidth) return result.trimEnd() + '…';
    width += w;
    result += ch;
  }
  return result;
}

function isWide(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
    (code >= 0x2e80 && code <= 0xa4cf) || // CJK, kana, punctuation
    (code >= 0xac00 && code <= 0xd7a3) || // Hangul syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK compatibility
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) || // full-width forms
    (code >= 0xffe0 && code <= 0xffe6) ||
    code >= 0x1f300 // emoji and other wide symbols
  );
}

/** Width of text in "half-width" units (Japanese characters count as 2). */
export function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) width += isWide(ch) ? 2 : 1;
  return width;
}

/** "10月20日 火曜日" — today's date for the top of the memo list. */
export function formatLongDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
  } catch {
    return date.toLocaleDateString('ja-JP');
  }
}

/** "たった今" / "5分前" / "3時間前" / "昨日" / "10月18日" / "2025年3月2日" — for memo lists. */
export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const bucket = dateBucket(iso, now);
  if (bucket === 'today') return `${Math.floor(minutes / 60)}時間前`;
  if (bucket === 'yesterday') return '昨日';
  const sameYear = date.getFullYear() === now.getFullYear();
  return sameYear ? `${date.getMonth() + 1}月${date.getDate()}日` : `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export type DateBucket = 'today' | 'yesterday' | 'week' | 'earlier';

/** Which heading a memo goes under in the list (by local calendar day). */
export function dateBucket(iso: string, now = new Date()): DateBucket {
  const date = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return 'week';
  return 'earlier';
}
