/**
 * Core data model for Asterism.
 *
 * The note data (what the user wrote) is kept separate from the layout
 * (where each star sits on screen). Connections only reference note ids.
 * This keeps the model independent from the visualization, so features such
 * as AI-suggested connections or cloud sync can be added later without
 * touching the rendering code.
 */

import type { StarShape } from './stars';

export const CATEGORY_IDS = ['ideas', 'learning', 'goals', 'journal', 'other'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Note {
  id: string;
  title: string;
  body: string;
  /** Old "kind" of the memo. No longer shown; kept so older data and backups stay valid. */
  category: CategoryId;
  /** The look of the memo's star in the map. Missing in older data (see shapeOf). */
  star?: StarShape;
  /** ISO 8601 timestamp, e.g. "2026-10-19T08:30:00.000Z" */
  createdAt: string;
  /** ISO 8601 timestamp of the last edit. */
  updatedAt: string;
  /** True for the demo notes added on first launch. They can be deleted like any other note. */
  sample?: boolean;
  /** ISO time the note was last opened (used to make recently used stars brighter). */
  lastOpenedAt?: string;
  /** Pinned notes are listed first in the sidebar. */
  pinned?: boolean;
  /** The group (galaxy) this note belongs to. Undefined = no group. */
  groupId?: string;
}

/** A user-defined group of notes, drawn as a "galaxy" in the universe. */
export interface Group {
  id: string;
  name: string;
  /** Galaxy color, e.g. "#8fa8ff". */
  color: string;
  createdAt: string;
}

/**
 * Who created a connection. The MVP only creates "user" connections.
 * "ai" is reserved for future AI-suggested relationships.
 */
export type ConnectionOrigin = 'user' | 'ai';

/** An undirected link between two notes. */
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  origin: ConnectionOrigin;
}

export interface Position {
  x: number;
  y: number;
}

/** Star positions in "universe" coordinates, keyed by note id. */
export type Layout = Record<string, Position>;

export interface UniverseData {
  version: 1;
  notes: Note[];
  connections: Connection[];
  layout: Layout;
  groups: Group[];
}

/** The fields a user fills in when creating or editing a note. */
export interface NoteDraft {
  title: string;
  body: string;
  category: CategoryId | null;
  /** Group id, or null for "no group". */
  groupId: string | null;
}
