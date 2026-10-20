/**
 * Groups ("galaxies"): user-defined sets of notes.
 * A note belongs to at most one group. In the universe each group is drawn as
 * a glowing circle around its stars (see galaxyCircles below).
 */
import { createId } from '../utils/id';
import { boundsOf } from './layout';
import type { Group, Position, UniverseData } from './types';

export const GROUP_NAME_MAX = 40;

/** Galaxy colors the user can choose from. */
export const GROUP_COLORS = ['#c9b8ff', '#ffaccd', '#9fe8dc', '#ffd59e', '#a8c6ff', '#bfeaa4'] as const;

export function buildGroup(name: string, color: string, now = new Date()): Group {
  return {
    id: createId('g_'),
    name: name.trim().slice(0, GROUP_NAME_MAX),
    color,
    createdAt: now.toISOString(),
  };
}

export function validateGroupName(name: string): 'required' | 'tooLong' | null {
  const trimmed = name.trim();
  if (!trimmed) return 'required';
  if (trimmed.length > GROUP_NAME_MAX) return 'tooLong';
  return null;
}

export function addGroup(data: UniverseData, group: Group): UniverseData {
  if (data.groups.some((g) => g.id === group.id)) return data;
  return { ...data, groups: [...data.groups, group] };
}

export function updateGroup(
  data: UniverseData,
  id: string,
  patch: { name?: string; color?: string },
): UniverseData {
  if (!data.groups.some((g) => g.id === id)) return data;
  return {
    ...data,
    groups: data.groups.map((g) =>
      g.id === id
        ? {
            ...g,
            ...(patch.name !== undefined && { name: patch.name.trim().slice(0, GROUP_NAME_MAX) }),
            ...(patch.color !== undefined && { color: patch.color }),
          }
        : g,
    ),
  };
}

/** Deletes a group. Its notes are kept and simply become "no group". */
export function deleteGroup(data: UniverseData, id: string): UniverseData {
  if (!data.groups.some((g) => g.id === id)) return data;
  return {
    ...data,
    groups: data.groups.filter((g) => g.id !== id),
    notes: data.notes.map((n) => {
      if (n.groupId !== id) return n;
      const { groupId: _removed, ...rest } = n;
      return rest;
    }),
  };
}

export function setPinned(data: UniverseData, noteId: string, pinned: boolean): UniverseData {
  let changed = false;
  const notes = data.notes.map((n) => {
    if (n.id !== noteId || Boolean(n.pinned) === pinned) return n;
    changed = true;
    if (pinned) return { ...n, pinned: true };
    const { pinned: _removed, ...rest } = n;
    return rest;
  });
  return changed ? { ...data, notes } : data;
}

/** Centre of a group's stars (optionally ignoring one note), or null if it has none. */
export function groupCenter(data: UniverseData, groupId: string, excludeNoteId?: string): Position | null {
  const points: Position[] = [];
  for (const n of data.notes) {
    if (n.groupId === groupId && n.id !== excludeNoteId && data.layout[n.id]) points.push(data.layout[n.id]);
  }
  if (points.length === 0) return null;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

export interface GalaxyCircle {
  group: Group;
  cx: number;
  cy: number;
  r: number;
  count: number;
}

const GALAXY_PADDING = 70;
const GALAXY_MIN_RADIUS = 95;

/** One circle per non-empty group, large enough to enclose all of its stars. */
export function galaxyCircles(data: Pick<UniverseData, 'notes' | 'layout' | 'groups'>): GalaxyCircle[] {
  const result: GalaxyCircle[] = [];
  for (const group of data.groups) {
    const points = data.notes
      .filter((n) => n.groupId === group.id && data.layout[n.id])
      .map((n) => data.layout[n.id]);
    const b = boundsOf(points);
    if (!b) continue;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const far = Math.max(...points.map((p) => Math.hypot(p.x - cx, p.y - cy)));
    result.push({ group, cx, cy, r: Math.max(GALAXY_MIN_RADIUS, far + GALAXY_PADDING), count: points.length });
  }
  return result;
}
