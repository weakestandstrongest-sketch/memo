import type { UniverseData } from '../domain/types';
import type { LoadResult, UniverseStorage } from './types';
import { sanitizeUniverse } from './validate';

// Keys keep the app's first name ("My Universe"), so data saved before the rename is still found.
export const STORAGE_KEY = 'my-universe:data:v1';
const BACKUP_PREFIX = 'my-universe:backup:';

/** Minimal part of the Web Storage API we need (makes testing easy). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage can throw when cookies/storage are blocked.
    return null;
  }
}

export function createLocalStorageAdapter(
  store: KeyValueStore | null = defaultStore(),
  key = STORAGE_KEY,
): UniverseStorage {
  return {
    load(): LoadResult {
      if (!store) return { status: 'unavailable' };
      let raw: string | null;
      try {
        raw = store.getItem(key);
      } catch {
        return { status: 'unavailable' };
      }
      if (raw === null) return { status: 'empty' };

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        backup(store, raw);
        return { status: 'corrupt' };
      }
      const result = sanitizeUniverse(parsed);
      if (!result) {
        backup(store, raw);
        return { status: 'corrupt' };
      }
      return { status: 'ok', data: result.data, repaired: result.repairs > 0 };
    },

    save(data: UniverseData): boolean {
      if (!store) return false;
      try {
        store.setItem(key, JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Keeps a copy of unreadable data so nothing is lost silently.
 * The key is based on the content, so the same data is only backed up once.
 */
function backup(store: KeyValueStore, raw: string) {
  try {
    store.setItem(BACKUP_PREFIX + hash(raw), raw);
  } catch {
    // Storage full — nothing more we can do.
  }
}

/** Small, fast string hash (djb2). Not for security — only to name backup keys. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
