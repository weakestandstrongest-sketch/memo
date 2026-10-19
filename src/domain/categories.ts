import { CATEGORY_IDS, type CategoryId } from './types';

/** The star shapes available. Drawn by components/universe/CategoryGlyph.tsx. */
export type StarShape = 'sparkle' | 'planet' | 'star' | 'crescent' | 'diamond';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  /** Main star color. */
  color: string;
  shape: StarShape;
  /** Short name of the shape, used in accessible labels ("Ideas, sparkle"). */
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
    label: 'Ideas',
    color: '#ffd166',
    shape: 'sparkle',
    shapeName: 'sparkle',
    description: 'Sparks, concepts and what-ifs',
  },
  learning: {
    id: 'learning',
    label: 'Learning',
    color: '#4cc9f0',
    shape: 'planet',
    shapeName: 'ringed planet',
    description: 'Things you studied or discovered',
  },
  goals: {
    id: 'goals',
    label: 'Goals',
    color: '#ff6b9a',
    shape: 'star',
    shapeName: 'five-pointed star',
    description: 'Where you want to go',
  },
  journal: {
    id: 'journal',
    label: 'Journal',
    color: '#b39cff',
    shape: 'crescent',
    shapeName: 'crescent moon',
    description: 'Moments, feelings and reflections',
  },
  other: {
    id: 'other',
    label: 'Other',
    color: '#7ee8b5',
    shape: 'diamond',
    shapeName: 'diamond',
    description: 'Everything else',
  },
};

export const CATEGORY_LIST: CategoryInfo[] = CATEGORY_IDS.map((id) => CATEGORIES[id]);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
