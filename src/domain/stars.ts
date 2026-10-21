import type { CategoryId, Note } from './types';

/**
 * The shapes a memo's star can take. Shapes are just a look: they carry no
 * meaning, and every memo can pick any of them (groups do the sorting).
 * Drawn by components/universe/StarGlyph.tsx.
 */
export const STAR_SHAPES = [
  'sparkle',
  'star',
  'burst',
  'twinkle',
  'star6',
  'snow',
  'diamond',
  'gem',
  'orb',
  'ring',
  'planet',
  'crescent',
  'sun',
  'comet',
  'heart',
  'flower',
] as const;

export type StarShape = (typeof STAR_SHAPES)[number];

export function isStarShape(value: unknown): value is StarShape {
  return typeof value === 'string' && (STAR_SHAPES as readonly string[]).includes(value);
}

/** Memos saved before shapes could be chosen kept the shape of their old "kind". */
const SHAPE_OF_KIND: Record<CategoryId, StarShape> = {
  ideas: 'sparkle',
  learning: 'planet',
  goals: 'star',
  journal: 'crescent',
  other: 'diamond',
};

export function shapeOf(note: Pick<Note, 'star' | 'category'>): StarShape {
  return note.star ?? SHAPE_OF_KIND[note.category];
}

/** A shape for a new memo: any of them, so the map stays varied without any effort. */
export function randomShape(random: () => number = Math.random): StarShape {
  return STAR_SHAPES[Math.floor(random() * STAR_SHAPES.length) % STAR_SHAPES.length];
}
