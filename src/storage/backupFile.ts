/**
 * Export / import the universe as a JSON file.
 * localStorage is per browser and per device, so this is how you move your
 * universe between a PC and an iPhone (there is no cloud sync).
 */
import type { UniverseData } from '../domain/types';
import { ja } from '../i18n/ja';
import { sanitizeUniverse } from './validate';

export type ExportResult = 'downloaded' | 'shared' | 'cancelled';

function backupFileName() {
  return `asterism-${new Date().toISOString().slice(0, 10)}.json`;
}

/** True on iPhone / iPad (including iPads that report themselves as a Mac). */
export function isAppleMobile(): boolean {
  const nav = navigator as Navigator & { maxTouchPoints?: number };
  return /iPad|iPhone|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1);
}

/**
 * Saves a backup file.
 * - On iPhone / iPad: opens the share sheet, so the file can be saved to the
 *   Files app, sent with AirDrop, attached to a mail, etc.
 * - Elsewhere (Windows Chrome / Edge, …): downloads the file to the Downloads folder.
 */
export async function exportBackup(data: UniverseData): Promise<ExportResult> {
  // "my-universe" (the app's first name) stays, so backups from before and after the rename match.
  const json = JSON.stringify({ app: 'my-universe', exportedAt: new Date().toISOString(), ...data }, null, 2);
  const name = backupFileName();

  if (isAppleMobile() && typeof navigator.share === 'function' && typeof File === 'function') {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: ja.backup.shareTitle });
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
        // Share failed for another reason: fall back to a normal download below.
      }
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return 'downloaded';
}

export async function readBackupFile(file: File): Promise<UniverseData> {
  if (file.size > 20 * 1024 * 1024) throw new Error(ja.backup.errors.tooLarge);
  let text: string;
  try {
    text = await file.text();
  } catch {
    throw new Error(ja.backup.errors.readFailed);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, '')); // ignore a byte-order mark added by some editors
  } catch {
    throw new Error(ja.backup.errors.notJson);
  }
  const result = sanitizeUniverse(parsed);
  if (!result) throw new Error(ja.backup.errors.notBackup);
  return result.data;
}
