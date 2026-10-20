/**
 * Turns "unknown" JSON (from localStorage, an imported file, or a server in the
 * future) into valid UniverseData. Invalid pieces are repaired or dropped
 * instead of crashing the app.
 */
import { isCategoryId } from '../domain/categories';
import { ensureLayout } from '../domain/layout';
import { LIMITS, pairKey } from '../domain/universe';
import { GROUP_COLORS, GROUP_NAME_MAX } from '../domain/groups';
import type { Connection, ConnectionOrigin, Group, Layout, Note, UniverseData } from '../domain/types';
import { createId } from '../utils/id';

export interface SanitizeResult {
  data: UniverseData;
  /** How many items had to be fixed or dropped. 0 means the data was perfect. */
  repairs: number;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

const isValidDate = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v));

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Returns null when the value doesn't look like universe data at all. */
export function sanitizeUniverse(raw: unknown, now = new Date()): SanitizeResult | null {
  if (!isObject(raw) || !Array.isArray(raw.notes)) return null;

  let repairs = 0;
  const nowIso = now.toISOString();

  // --- Groups (added later; older data simply has none) ----------------------
  const groups: Group[] = [];
  const groupIds = new Set<string>();
  const rawGroups = Array.isArray(raw.groups) ? raw.groups : [];
  for (const item of rawGroups) {
    if (!isObject(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name) || groupIds.has(item.id)) {
      repairs++;
      continue;
    }
    groupIds.add(item.id);
    const color = typeof item.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : GROUP_COLORS[0];
    groups.push({
      id: item.id,
      name: item.name.trim().slice(0, GROUP_NAME_MAX),
      color,
      createdAt: isValidDate(item.createdAt) ? item.createdAt : nowIso,
    });
  }

  // --- Notes ---------------------------------------------------------------
  const notes: Note[] = [];
  const seenIds = new Set<string>();
  for (const item of raw.notes) {
    if (!isObject(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.title)) {
      repairs++;
      continue;
    }
    if (seenIds.has(item.id)) {
      repairs++;
      continue;
    }
    seenIds.add(item.id);

    const createdAt = isValidDate(item.createdAt) ? item.createdAt : nowIso;
    const updatedAt = isValidDate(item.updatedAt) ? item.updatedAt : createdAt;
    const category = isCategoryId(item.category) ? item.category : 'other';
    const body = typeof item.body === 'string' ? item.body : '';
    if (createdAt !== item.createdAt || category !== item.category || body !== item.body) repairs++;

    const note: Note = {
      id: item.id,
      title: item.title.trim().slice(0, LIMITS.title),
      body: body.slice(0, LIMITS.body),
      category,
      createdAt,
      updatedAt,
    };
    if (item.sample === true) note.sample = true;
    if (item.pinned === true) note.pinned = true;
    if (typeof item.groupId === 'string') {
      if (groupIds.has(item.groupId)) note.groupId = item.groupId;
      else repairs++; // points at a group that no longer exists
    }
    notes.push(note);
  }

  // --- Connections ---------------------------------------------------------
  const connections: Connection[] = [];
  const seenPairs = new Set<string>();
  const rawConnections = Array.isArray(raw.connections) ? raw.connections : [];
  if (raw.connections !== undefined && !Array.isArray(raw.connections)) repairs++;
  for (const item of rawConnections) {
    if (
      !isObject(item) ||
      !isNonEmptyString(item.sourceId) ||
      !isNonEmptyString(item.targetId) ||
      item.sourceId === item.targetId ||
      !seenIds.has(item.sourceId) ||
      !seenIds.has(item.targetId)
    ) {
      repairs++;
      continue;
    }
    const key = pairKey(item.sourceId, item.targetId);
    if (seenPairs.has(key)) {
      repairs++;
      continue;
    }
    seenPairs.add(key);
    const origin: ConnectionOrigin = item.origin === 'ai' ? 'ai' : 'user';
    connections.push({
      id: isNonEmptyString(item.id) ? item.id : createId('c_'),
      sourceId: item.sourceId,
      targetId: item.targetId,
      createdAt: isValidDate(item.createdAt) ? item.createdAt : nowIso,
      origin,
    });
  }

  // --- Layout --------------------------------------------------------------
  const rawLayout = isObject(raw.layout) ? raw.layout : {};
  const layout: Layout = {};
  for (const note of notes) {
    const p = rawLayout[note.id];
    if (isObject(p) && isFiniteNumber(p.x) && isFiniteNumber(p.y)) {
      layout[note.id] = { x: p.x, y: p.y };
    } else {
      repairs++;
    }
  }

  return {
    data: { version: 1, notes, connections, layout: ensureLayout(notes, layout), groups },
    repairs,
  };
}
