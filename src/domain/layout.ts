import type { Layout, Note, Position } from './types';

/** Stars closer than this (in universe units) are considered overlapping. */
export const MIN_STAR_DISTANCE = 64;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFree(layout: Layout, p: Position, minDist: number, ignoreId?: string): boolean {
  for (const id in layout) {
    if (id === ignoreId) continue;
    if (distance(layout[id], p) < minDist) return false;
  }
  return true;
}

/**
 * Finds a spot near `near` that is not too close to existing stars.
 * Walks outward along a sunflower spiral until a free spot is found.
 */
export function findFreePosition(
  layout: Layout,
  near: Position,
  minDist = MIN_STAR_DISTANCE,
): Position {
  // Start with a small random offset so new stars don't all line up.
  const jitter = Math.random() * Math.PI * 2;
  for (let i = 0; i < 600; i++) {
    const r = i === 0 ? 0 : minDist * 0.75 * Math.sqrt(i);
    const theta = i * GOLDEN_ANGLE + jitter;
    const candidate = { x: near.x + r * Math.cos(theta), y: near.y + r * Math.sin(theta) };
    if (isFree(layout, candidate, minDist)) return round(candidate);
  }
  return round({ x: near.x + (Math.random() - 0.5) * 400, y: near.y + (Math.random() - 0.5) * 400 });
}

/**
 * Gently pushes the star `id` away from stars it overlaps with.
 * Used after the user drops a star on top of another one.
 */
export function resolveOverlap(layout: Layout, id: string, minDist = MIN_STAR_DISTANCE): Position {
  const start = layout[id];
  if (!start) return { x: 0, y: 0 };
  let p = { ...start };
  for (let iteration = 0; iteration < 16; iteration++) {
    let moved = false;
    for (const otherId in layout) {
      if (otherId === id) continue;
      const o = layout[otherId];
      const d = distance(p, o);
      if (d < minDist) {
        const angle = d < 0.001 ? Math.random() * Math.PI * 2 : Math.atan2(p.y - o.y, p.x - o.x);
        const push = minDist - d + 0.5;
        p = { x: p.x + Math.cos(angle) * push, y: p.y + Math.sin(angle) * push };
        moved = true;
      }
    }
    if (!moved) break;
  }
  return round(p);
}

/** Makes sure every note has a position; missing ones get a free spot near the centre. */
export function ensureLayout(notes: Note[], layout: Layout): Layout {
  const next: Layout = {};
  for (const note of notes) {
    if (layout[note.id]) next[note.id] = layout[note.id];
  }
  for (const note of notes) {
    if (!next[note.id]) next[note.id] = findFreePosition(next, { x: 0, y: 0 });
  }
  return next;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(positions: Position[]): Bounds | null {
  if (positions.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of positions) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function round(p: Position): Position {
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
}
