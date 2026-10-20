import { ja } from '../i18n/ja';
import { CATEGORY_IDS, type CategoryId } from './types';

/** The star shapes available. Drawn by components/universe/CategoryGlyph.tsx. */
export type StarShape = 'sparkle' | 'planet' | 'star' | 'crescent' | 'diamond';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  /** Main star color. */
  color: string;
  shape: StarShape;
  /** Short name of the shape, used in accessible labels. */
  shapeName: string;
  description: string;
}

/** Monochrome design: every category is drawn in ink; the shapes tell them apart. */
export const INK = '#111111';

/**
 * Each category has a distinct shape, so categories can be
 * told apart without relying on color alone.
 */
export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  ideas: {
    id: 'ideas',
    label: ja.categories.ideas.label,
    color: INK,
    shape: 'sparkle',
    shapeName: ja.categories.ideas.shapeName,
    description: ja.categories.ideas.description,
  },
  learning: {
    id: 'learning',
    label: ja.categories.learning.label,
    color: INK,
    shape: 'planet',
    shapeName: ja.categories.learning.shapeName,
    description: ja.categories.learning.description,
  },
  goals: {
    id: 'goals',
    label: ja.categories.goals.label,
    color: INK,
    shape: 'star',
    shapeName: ja.categories.goals.shapeName,
    description: ja.categories.goals.description,
  },
  journal: {
    id: 'journal',
    label: ja.categories.journal.label,
    color: INK,
    shape: 'crescent',
    shapeName: ja.categories.journal.shapeName,
    description: ja.categories.journal.description,
  },
  other: {
    id: 'other',
    label: ja.categories.other.label,
    color: INK,
    shape: 'diamond',
    shapeName: ja.categories.other.shapeName,
    description: ja.categories.other.description,
  },
};

/** Order shown in pickers and filters: plain memo first. */
export const CATEGORY_LIST: CategoryInfo[] = (['other', 'ideas', 'learning', 'goals', 'journal'] as const).map(
  (id) => CATEGORIES[id],
);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
