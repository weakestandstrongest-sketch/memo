/**
 * Pure functions that change the universe data.
 * They never mutate their input and never touch React or storage,
 * which makes them easy to test and to reuse (e.g. on a server later).
 */
import { createId } from '../utils/id';
import { findFreePosition, resolveOverlap } from './layout';
import type { CategoryId, Connection, Note, NoteDraft, Position, UniverseData } from './types';

export const LIMITS = {
  title: 120,
  body: 10000,
} as const;

export function emptyUniverse(): UniverseData {
  return { version: 1, notes: [], connections: [], layout: {} };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type DraftErrors = Partial<Record<'title' | 'body' | 'category', string>>;

export function validateDraft(draft: NoteDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = 'Please give your star a title.';
  else if (title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (draft.body.length > LIMITS.body) errors.body = `The note is too long (max ${LIMITS.body} characters).`;
  if (!draft.category) errors.category = 'Choose a category.';
  return errors;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface NewNoteInput {
  title: string;
  body: string;
  category: CategoryId;
}

export function buildNote(input: NewNoteInput, now = new Date()): Note {
  const iso = now.toISOString();
  return {
    id: createId('n_'),
    title: input.title.trim().slice(0, LIMITS.title),
    body: input.body.slice(0, LIMITS.body),
    category: input.category,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** Adds a note and places its star in a free spot near `near`. */
export function addNote(data: UniverseData, note: Note, near: Position): UniverseData {
  if (data.notes.some((n) => n.id === note.id)) return data;
  const position = findFreePosition(data.layout, near);
  return {
    ...data,
    notes: [...data.notes, note],
    layout: { ...data.layout, [note.id]: position },
  };
}

export function updateNote(
  data: UniverseData,
  id: string,
  patch: Partial<NewNoteInput>,
  now = new Date(),
): UniverseData {
  let changed = false;
  const notes = data.notes.map((n) => {
    if (n.id !== id) return n;
    changed = true;
    return {
      ...n,
      ...(patch.title !== undefined && { title: patch.title.trim().slice(0, LIMITS.title) }),
      ...(patch.body !== undefined && { body: patch.body.slice(0, LIMITS.body) }),
      ...(patch.category !== undefined && { category: patch.category }),
      updatedAt: now.toISOString(),
    };
  });
  return changed ? { ...data, notes } : data;
}

/** Deletes a note together with its star position and all its connections. */
export function deleteNote(data: UniverseData, id: string): UniverseData {
  if (!data.notes.some((n) => n.id === id)) return data;
  const layout = { ...data.layout };
  delete layout[id];
  return {
    ...data,
    notes: data.notes.filter((n) => n.id !== id),
    connections: data.connections.filter((c) => c.sourceId !== id && c.targetId !== id),
    layout,
  };
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

/** Order-independent key, so A→B and B→A count as the same connection. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export type ConnectCheck =
  | { ok: true }
  | { ok: false; reason: 'self' | 'duplicate' | 'missing' };

export function checkConnection(data: UniverseData, a: string, b: string): ConnectCheck {
  if (a === b) return { ok: false, reason: 'self' };
  const ids = new Set(data.notes.map((n) => n.id));
  if (!ids.has(a) || !ids.has(b)) return { ok: false, reason: 'missing' };
  const key = pairKey(a, b);
  if (data.connections.some((c) => pairKey(c.sourceId, c.targetId) === key)) {
    return { ok: false, reason: 'duplicate' };
  }
  return { ok: true };
}

export const CONNECT_ERROR_MESSAGES: Record<'self' | 'duplicate' | 'missing', string> = {
  self: 'A star cannot connect to itself.',
  duplicate: 'These stars are already connected.',
  missing: 'That star no longer exists.',
};

export function connectNotes(
  data: UniverseData,
  a: string,
  b: string,
  now = new Date(),
): UniverseData {
  if (!checkConnection(data, a, b).ok) return data;
  const connection: Connection = {
    id: createId('c_'),
    sourceId: a,
    targetId: b,
    createdAt: now.toISOString(),
    origin: 'user',
  };
  return { ...data, connections: [...data.connections, connection] };
}

export function disconnect(data: UniverseData, connectionId: string): UniverseData {
  const connections = data.connections.filter((c) => c.id !== connectionId);
  return connections.length === data.connections.length ? data : { ...data, connections };
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export function moveNote(data: UniverseData, id: string, position: Position): UniverseData {
  if (!data.layout[id]) return data;
  return { ...data, layout: { ...data.layout, [id]: position } };
}

/** Called after a drag ends: nudges the star so it does not sit on top of another. */
export function settleNote(data: UniverseData, id: string): UniverseData {
  if (!data.layout[id]) return data;
  const position = resolveOverlap(data.layout, id);
  const current = data.layout[id];
  if (position.x === current.x && position.y === current.y) return data;
  return moveNote(data, id, position);
}

// ---------------------------------------------------------------------------
// Queries (read-only helpers)
// ---------------------------------------------------------------------------

export function neighborIds(connections: Connection[], id: string): Set<string> {
  const result = new Set<string>();
  for (const c of connections) {
    if (c.sourceId === id) result.add(c.targetId);
    else if (c.targetId === id) result.add(c.sourceId);
  }
  return result;
}

export interface LinkedNote {
  connection: Connection;
  note: Note;
}

export function linkedNotes(data: UniverseData, id: string): LinkedNote[] {
  const byId = new Map(data.notes.map((n) => [n.id, n]));
  const result: LinkedNote[] = [];
  for (const c of data.connections) {
    const otherId = c.sourceId === id ? c.targetId : c.targetId === id ? c.sourceId : null;
    const note = otherId ? byId.get(otherId) : undefined;
    if (note) result.push({ connection: c, note });
  }
  return result.sort((x, y) => x.note.title.localeCompare(y.note.title));
}

/** Number of connections per note id. */
export function degreeMap(connections: Connection[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of connections) {
    map.set(c.sourceId, (map.get(c.sourceId) ?? 0) + 1);
    map.set(c.targetId, (map.get(c.targetId) ?? 0) + 1);
  }
  return map;
}

/** Case-insensitive search across title and body. Empty query matches everything. */
export function matchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return (
    note.title.toLocaleLowerCase().includes(q) || note.body.toLocaleLowerCase().includes(q)
  );
}
