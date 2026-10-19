import type { UniverseData } from '../domain/types';

export type LoadResult =
  /** Saved data was found and is valid (`repaired` = some bad entries were fixed). */
  | { status: 'ok'; data: UniverseData; repaired: boolean }
  /** Nothing saved yet — first launch. */
  | { status: 'empty' }
  /** Something was saved but could not be read. A backup copy was kept. */
  | { status: 'corrupt' }
  /** Storage itself can't be used (e.g. blocked by browser settings). */
  | { status: 'unavailable' };

/**
 * Anything that can load and save a universe.
 *
 * The MVP uses localStorage (see localStorageAdapter.ts). A cloud or database
 * adapter can implement this same interface later; the rest of the app only
 * talks to this interface.
 */
export interface UniverseStorage {
  load(): LoadResult;
  /** Returns false if saving failed (e.g. storage full or blocked). */
  save(data: UniverseData): boolean;
}
