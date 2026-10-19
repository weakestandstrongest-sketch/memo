/**
 * Export / import the universe as a JSON file.
 * Useful because localStorage is per browser and per device: this is how you
 * can move your universe from a PC to an iPhone in this MVP (no cloud sync yet).
 */
import type { UniverseData } from '../domain/types';
import { sanitizeUniverse } from './validate';

export function downloadBackup(data: UniverseData) {
  const json = JSON.stringify({ app: 'my-universe', exportedAt: new Date().toISOString(), ...data }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-universe-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function readBackupFile(file: File): Promise<UniverseData> {
  if (file.size > 20 * 1024 * 1024) throw new Error('That file is too large to be a My Universe backup.');
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const result = sanitizeUniverse(parsed);
  if (!result) throw new Error('That file does not look like a My Universe backup.');
  return result.data;
}
