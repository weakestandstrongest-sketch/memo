/**
 * Pure functions that change the universe data.
 * They never mutate their input and never touch React or storage,
 * which makes them easy to test and to reuse (e.g. on a server later).
 */
import { createId } from '../utils/id';
import { groupCenter } from './groups';
import { findFreePosition, resolveOverlap } from './layout';
import type { CategoryId, Connection, Note, NoteDraft, Position, UniverseData } from './types';

export const LIMITS = {
  title: 120,
  body: 10000,
} as const;

export function emptyUniverse(): UniverseData {
  return { version: 1, notes: [], connections: [], layout: {}, groups: [] };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Problems found in a draft, as codes. The UI turns them into messages (see i18n/ja.ts). */
export interface DraftErrors {
  title?: 'required' | 'tooLong';
  body?: 'tooLong';
  category?: 'required';
}

export function validateDraft(draft: NoteDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = 'required';
  else if (title.length > LIMITS.title) errors.title = 'tooLong';
  if (draft.body.length > LIMITS.body) errors.body = 'tooLong';
  if (!draft.category) errors.category = 'required';
  return errors;
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export interface NewNoteInput {
  title: string;
  body: string;
  category: CategoryId;
  /** Group id, or null / undefined for "no group". */
  groupId?: string | null;
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
    ...(input.groupId ? { groupId: input.groupId } : {}),
  };
}

/**
 * Adds a note and places its star in a free spot near `near`
 * (or inside its group's galaxy, if it belongs to a group that already has stars).
 */
export function addNote(data: UniverseData, note: Note, near: Position): UniverseData {
  if (data.notes.some((n) => n.id === note.id)) return data;
  const galaxyCenter = note.groupId ? groupCenter(data, note.groupId) : null;
  const position = findFreePosition(data.layout, galaxyCenter ?? near);
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
  const current = data.notes.find((n) => n.id === id);
  if (!current) return data;

  const updated: Note = {
    ...current,
    ...(patch.title !== undefined && { title: patch.title.trim().slice(0, LIMITS.title) }),
    ...(patch.body !== undefined && { body: patch.body.slice(0, LIMITS.body) }),
    ...(patch.category !== undefined && { category: patch.category }),
    updatedAt: now.toISOString(),
  };
  if (patch.groupId !== undefined) {
    if (patch.groupId) updated.groupId = patch.groupId;
    else delete updated.groupId;
  }
  let next: UniverseData = { ...data, notes: data.notes.map((n) => (n.id === id ? updated : n)) };

  // Moving into another group: fly the star over to that galaxy.
  if (updated.groupId && updated.groupId !== current.groupId) {
    const center = groupCenter(next, updated.groupId, id);
    if (center) {
      const others = { ...next.layout };
      delete others[id];
      next = { ...next, layout: { ...next.layout, [id]: findFreePosition(others, center) } };
    }
  }
  return next;
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

/** Remembers that a note was opened just now (does not count as an edit). */
export function markOpened(data: UniverseData, id: string, now = new Date()): UniverseData {
  if (!data.notes.some((n) => n.id === id)) return data;
  const iso = now.toISOString();
  return { ...data, notes: data.notes.map((n) => (n.id === id ? { ...n, lastOpenedAt: iso } : n)) };
}

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
  return result.sort((x, y) => x.note.title.localeCompare(y.note.title, 'ja'));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Most recent time the note was written, edited or opened. */
export function lastTouched(note: Note): number {
  return Math.max(
    Date.parse(note.createdAt) || 0,
    Date.parse(note.updatedAt) || 0,
    note.lastOpenedAt ? Date.parse(note.lastOpenedAt) || 0 : 0,
  );
}

/**
 * How "fresh" a star is: 1 = touched within the last day,
 * fading slowly (on a log scale) to 0.4 for stars untouched for ~2 months or more.
 */
export function freshness(note: Note, now = Date.now()): number {
  const days = Math.max(0, (now - lastTouched(note)) / DAY_MS);
  if (days <= 1) return 1;
  const f = 1 - (0.6 * Math.log(days)) / Math.log(60);
  return Math.min(1, Math.max(0.4, f));
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

/**
 * Makes text easier to search in Japanese and English:
 * - full-width / half-width letters, digits and katakana are unified (NFKC), e.g. "ＡＢＣ" → "abc", "ｶﾀｶﾅ" → "カタカナ"
 * - katakana is turned into hiragana, so "ほし" also finds "ホシ"
 * - upper / lower case is ignored
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

/** Searches title and body. Empty query matches everything. */
export function matchesQuery(note: Note, query: string): boolean {
  const q = normalizeForSearch(query.trim());
  if (!q) return true;
  return normalizeForSearch(note.title).includes(q) || normalizeForSearch(note.body).includes(q);
}

// ---------------------------------------------------------------------------
// History ("宇宙の歴史")
// ---------------------------------------------------------------------------

/** The universe as it was at time `t`: only stars and connections that existed then. */
export function universeAt(data: UniverseData, t: number): UniverseData {
  const notes = data.notes.filter((n) => Date.parse(n.createdAt) <= t);
  const ids = new Set(notes.map((n) => n.id));
  const connections = data.connections.filter(
    (c) => ids.has(c.sourceId) && ids.has(c.targetId) && Date.parse(c.createdAt) <= t,
  );
  const layout: UniverseData['layout'] = {};
  for (const id of ids) if (data.layout[id]) layout[id] = data.layout[id];
  return { ...data, notes, connections, layout };
}

/** First and last moment worth showing in the history timeline. */
export function historyRange(data: UniverseData, now = Date.now()): { start: number; end: number } | null {
  if (data.notes.length === 0) return null;
  const times = data.notes.map((n) => Date.parse(n.createdAt)).filter(Number.isFinite);
  const start = Math.min(...times);
  const end = Math.max(now, ...times, ...data.connections.map((c) => Date.parse(c.createdAt)).filter(Number.isFinite));
  // Start just before the first star, so playback begins with an empty sky.
  return { start: start - Math.max(1000, (end - start) * 0.02), end };
}
