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

/**
 * Each category has a distinct color AND a distinct shape, so categories can be
 * told apart without relying on color alone.
 */
export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  ideas: {
    id: 'ideas',
    label: ja.categories.ideas.label,
    color: '#ffe3a0',
    shape: 'sparkle',
    shapeName: ja.categories.ideas.shapeName,
    description: ja.categories.ideas.description,
  },
  learning: {
    id: 'learning',
    label: ja.categories.learning.label,
    color: '#a5e6ff',
    shape: 'planet',
    shapeName: ja.categories.learning.shapeName,
    description: ja.categories.learning.description,
  },
  goals: {
    id: 'goals',
    label: ja.categories.goals.label,
    color: '#ffb4d0',
    shape: 'star',
    shapeName: ja.categories.goals.shapeName,
    description: ja.categories.goals.description,
  },
  journal: {
    id: 'journal',
    label: ja.categories.journal.label,
    color: '#d4c6ff',
    shape: 'crescent',
    shapeName: ja.categories.journal.shapeName,
    description: ja.categories.journal.description,
  },
  other: {
    id: 'other',
    label: ja.categories.other.label,
    color: '#b4f2d2',
    shape: 'diamond',
    shapeName: ja.categories.other.shapeName,
    description: ja.categories.other.description,
  },
};

export const CATEGORY_LIST: CategoryInfo[] = CATEGORY_IDS.map((id) => CATEGORIES[id]);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
