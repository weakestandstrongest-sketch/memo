/**
 * React hook that holds the universe data, applies changes through a reducer
 * and saves automatically. Components call the `actions` it returns and never
 * touch storage directly.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createSampleUniverse } from '../domain/sampleData';
import { addGroup, buildGroup, deleteGroup, setPinned, updateGroup } from '../domain/groups';
import type { Group, Note, Position, UniverseData } from '../domain/types';
import {
  addNote,
  buildNote,
  checkConnection,
  connectNotes,
  deleteNote,
  disconnect,
  markOpened,
  moveNote,
  settleNote,
  updateNote,
  type ConnectCheck,
  type NewNoteInput,
} from '../domain/universe';
import { createLocalStorageAdapter } from '../storage/localStorageAdapter';
import type { UniverseStorage } from '../storage/types';
import { isBlankNote } from '../utils/noteTitle';
import { flushPendingEdits } from './pendingEdits';

type Action =
  | { type: 'add'; note: Note; near: Position }
  | { type: 'update'; id: string; patch: Partial<NewNoteInput> }
  | { type: 'delete'; id: string }
  | { type: 'delete-if-blank'; id: string }
  | { type: 'connect'; a: string; b: string }
  | { type: 'disconnect'; connectionId: string }
  | { type: 'move'; id: string; position: Position }
  | { type: 'settle'; id: string }
  | { type: 'replace'; data: UniverseData }
  | { type: 'add-group'; group: Group }
  | { type: 'update-group'; id: string; patch: { name?: string; color?: string } }
  | { type: 'delete-group'; id: string }
  | { type: 'pin'; id: string; pinned: boolean }
  | { type: 'opened'; id: string };

function reducer(state: UniverseData, action: Action): UniverseData {
  switch (action.type) {
    case 'add':
      return addNote(state, action.note, action.near);
    case 'update':
      return updateNote(state, action.id, action.patch);
    case 'delete':
      return deleteNote(state, action.id);
    case 'delete-if-blank': {
      // Checked here (not by the caller) so text saved just before still counts.
      const note = state.notes.find((n) => n.id === action.id);
      return note && isBlankNote(note) ? deleteNote(state, action.id) : state;
    }
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
    case 'add-group':
      return addGroup(state, action.group);
    case 'update-group':
      return updateGroup(state, action.id, action.patch);
    case 'delete-group':
      return deleteGroup(state, action.id);
    case 'pin':
      return setPinned(state, action.id, action.pinned);
    case 'opened':
      return markOpened(state, action.id);
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
    flushPendingEdits(); // text typed a moment ago, not yet handed over
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
      // The app is being closed (e.g. replaced by the lock screen): save right away.
      flush();
    };
  }, [flush]);

  // Applies an action to the always-current copy right away (and to React state as usual),
  // so a save that happens before the next render — locking, the app going to the
  // background — already includes it.
  const apply = useCallback((action: Action) => {
    dataRef.current = reducer(dataRef.current, action);
    dirty.current = true;
    dispatch(action);
  }, []);

  // --- Actions -------------------------------------------------------------
  const actions = useMemo(
    () => ({
      /** Creates a note and its star near `near`. Returns the new note. */
      createNote(input: NewNoteInput, near: Position): Note {
        const note = buildNote(input);
        apply({ type: 'add', note, near });
        return note;
      },
      updateNote(id: string, patch: Partial<NewNoteInput>) {
        apply({ type: 'update', id, patch });
      },
      deleteNote(id: string) {
        apply({ type: 'delete', id });
      },
      /** Removes a memo that was left with no title and no text (e.g. ＋ pressed by mistake). */
      deleteIfBlank(id: string) {
        apply({ type: 'delete-if-blank', id });
      },
      /** Connects two stars. Returns why it failed, if it did. */
      connect(a: string, b: string): ConnectCheck {
        const check = checkConnection(dataRef.current, a, b);
        if (check.ok) apply({ type: 'connect', a, b });
        return check;
      },
      disconnect(connectionId: string) {
        apply({ type: 'disconnect', connectionId });
      },
      moveStar(id: string, position: Position) {
        apply({ type: 'move', id, position });
      },
      settleStar(id: string) {
        apply({ type: 'settle', id });
      },
      replaceAll(next: UniverseData) {
        apply({ type: 'replace', data: next });
      },
      /** Creates a group (galaxy). Returns it so the caller can use its id. */
      createGroup(name: string, color: string): Group {
        const group = buildGroup(name, color);
        apply({ type: 'add-group', group });
        return group;
      },
      updateGroup(id: string, patch: { name?: string; color?: string }) {
        apply({ type: 'update-group', id, patch });
      },
      deleteGroup(id: string) {
        apply({ type: 'delete-group', id });
      },
      setPinned(id: string, pinned: boolean) {
        apply({ type: 'pin', id, pinned });
      },
      /** Records that a star was opened (makes it shine brighter for a while). */
      markOpened(id: string) {
        apply({ type: 'opened', id });
      },
    }),
    [],
  );

  const clearNotice = useCallback(() => setNotice(null), []);

  return { data, actions, notice, clearNotice };
}


export type UniverseActions = ReturnType<typeof useUniverseStore>['actions'];
