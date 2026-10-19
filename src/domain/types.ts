/**
 * Core data model for My Universe.
 *
 * The note data (what the user wrote) is kept separate from the layout
 * (where each star sits on screen). Connections only reference note ids.
 * This keeps the model independent from the visualization, so features such
 * as AI-suggested connections or cloud sync can be added later without
 * touching the rendering code.
 */

export const CATEGORY_IDS = ['ideas', 'learning', 'goals', 'journal', 'other'] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Note {
  id: string;
  title: string;
  body: string;
  category: CategoryId;
  /** ISO 8601 timestamp, e.g. "2026-10-19T08:30:00.000Z" */
  createdAt: string;
  /** ISO 8601 timestamp of the last edit. */
  updatedAt: string;
  /** True for the demo notes added on first launch. They can be deleted like any other note. */
  sample?: boolean;
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
}

/** The fields a user fills in when creating or editing a note. */
export interface NoteDraft {
  title: string;
  body: string;
  category: CategoryId | null;
}
