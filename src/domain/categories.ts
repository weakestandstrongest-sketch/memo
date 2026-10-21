import { CATEGORY_IDS, type CategoryId } from './types';

/** Monochrome design: every star is drawn in ink; the shapes tell them apart. */
export const INK = '#111111';

/** The old "kinds" are no longer shown, but are still read from older data and backups. */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
