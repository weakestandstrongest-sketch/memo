/**
 * React hook that holds the universe data, applies changes through a reducer
 * and saves automatically. Components call the `actions` it returns and never
 * touch storage directly.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createSampleUniverse } from '../domain/sampleData';
import type { Note, Position, UniverseData } from '../domain/types';
import {
  addNote,
  buildNote,
  checkConnection,
  connectNotes,
  deleteNote,
  disconnect,
  moveNote,
  settleNote,
  updateNote,
  type ConnectCheck,
  type NewNoteInput,
} from '../domain/universe';
import { createLocalStorageAdapter } from '../storage/localStorageAdapter';
import type { UniverseStorage } from '../storage/types';

type Action =
  | { type: 'add'; note: Note; near: Position }
  | { type: 'update'; id: string; patch: Partial<NewNoteInput> }
  | { type: 'delete'; id: string }
  | { type: 'connect'; a: string; b: string }
  | { type: 'disconnect'; connectionId: string }
  | { type: 'move'; id: string; position: Position }
  | { type: 'settle'; id: string }
  | { type: 'replace'; data: UniverseData };

function reducer(state: UniverseData, action: Action): UniverseData {
  switch (action.type) {
    case 'add':
      return addNote(state, action.note, action.near);
    case 'update':
      return updateNote(state, action.id, action.patch);
    case 'delete':
      return deleteNote(state, action.id);
    case 'connect':
      return connectNotes(state, action.a, action.b);
    case 'disconnect':
      return disconnect(state, action.connectionId);
    case 'move':
      return moveNote(state, action.id, action.position);
    case 'settle':
      return settleNote(state, action.id);
    case 'replace':
      return action.data;
  }
}

/** A message to show the user about the state of their saved data. */
export type StorageNotice = 'repaired' | 'corrupt' | 'unavailable' | 'save-failed' | null;

function loadInitial(storage: UniverseStorage): { data: UniverseData; notice: StorageNotice } {
  const result = storage.load();
  switch (result.status) {
    case 'ok':
      return { data: result.data, notice: result.repaired ? 'repaired' : null };
    case 'empty':
      return { data: createSampleUniverse(), notice: null };
    case 'corrupt':
      return { data: createSampleUniverse(), notice: 'corrupt' };
    case 'unavailable':
      return { data: createSampleUniverse(), notice: 'unavailable' };
  }
}

const SAVE_DELAY_MS = 300;
const defaultStorage = createLocalStorageAdapter();

export function useUniverseStore(storage: UniverseStorage = defaultStorage) {
  const [initial] = useState(() => loadInitial(storage));
  const [data, dispatch] = useReducer(reducer, initial.data);
  const [notice, setNotice] = useState<StorageNotice>(initial.notice);

  // Always-current copy of the data for action helpers and save-on-exit.
  const dataRef = useRef(data);
  dataRef.current = data;

  // --- Auto-save (debounced) ---------------------------------------------
  const dirty = useRef(false);
  const flush = useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    if (!storage.save(dataRef.current)) setNotice('save-failed');
  }, [storage]);

  useEffect(() => {
    dirty.current = true;
    const timer = window.setTimeout(flush, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, flush]);

  // Save immediately when the tab is hidden or closed (important on iPhone,
  // where Safari may discard background tabs without warning).
  useEffect(() => {
    const onHide = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flush]);

  // --- Actions -------------------------------------------------------------
  const actions = useMemo(
    () => ({
      /** Creates a note and its star near `near`. Returns the new note. */
      createNote(input: NewNoteInput, near: Position): Note {
        const note = buildNote(input);
        dispatch({ type: 'add', note, near });
        return note;
      },
      updateNote(id: string, patch: Partial<NewNoteInput>) {
        dispatch({ type: 'update', id, patch });
      },
      deleteNote(id: string) {
        dispatch({ type: 'delete', id });
      },
      /** Connects two stars. Returns why it failed, if it did. */
      connect(a: string, b: string): ConnectCheck {
        const check = checkConnection(dataRef.current, a, b);
        if (check.ok) dispatch({ type: 'connect', a, b });
        return check;
      },
      disconnect(connectionId: string) {
        dispatch({ type: 'disconnect', connectionId });
      },
      moveStar(id: string, position: Position) {
        dispatch({ type: 'move', id, position });
      },
      settleStar(id: string) {
        dispatch({ type: 'settle', id });
      },
      replaceAll(next: UniverseData) {
        dispatch({ type: 'replace', data: next });
      },
    }),
    [],
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  return { data, actions, notice, clearNotice };
}


export type UniverseActions = ReturnType<typeof useUniverseStore>['actions'];
