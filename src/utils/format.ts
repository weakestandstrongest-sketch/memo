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
