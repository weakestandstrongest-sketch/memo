import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Note, Position, UniverseData } from './domain/types';
import { randomShape } from './domain/stars';
import { formatDateTime } from './utils/format';
import { displayTitle } from './utils/noteTitle';
import { GROUP_COLORS } from './domain/groups';
import { historyRange, linkedNotes, matchesQuery, universeAt } from './domain/universe';
import { ja } from './i18n/ja';
import { useUniverseStore, type StorageNotice } from './state/useUniverseStore';
import { exportBackup, readBackupFile } from './storage/backupFile';
import { readPref, writePref } from './storage/preferences';
import { daysSinceBackup, isBackupDue, updateSettings, useSettings } from './storage/settings';
import { useElementRect } from './hooks/useElementRect';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useVisualViewportVars } from './hooks/useVisualViewport';
import { BackupReminder } from './components/BackupReminder';
import { GroupFilter, NO_GROUP } from './components/GroupFilter';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConnectPicker } from './components/ConnectPicker';
import { DataMenu } from './components/DataMenu';
import { GroupDialog } from './components/GroupDialog';
import { HelpDialog } from './components/HelpDialog';
import { HistoryBar } from './components/HistoryBar';
import { MapHeader } from './components/MapHeader';
import { NotePage, type NotePageVariant } from './components/NotePage';
import { NotesView, type NotesOrder, type NotesViewHandle } from './components/NotesView';
import { SearchBox } from './components/SearchBox';
import { SettingsDialog } from './components/SettingsDialog';
import { TabBar, type View } from './components/TabBar';
import { Toast, type ToastMessage } from './components/Toast';
import { CloseIcon, SmallPlusIcon, ZoomInIcon, ZoomOutIcon } from './components/icons';
import { Universe, type Insets, type UniverseHandle } from './components/universe/Universe';

type Dialog =
  | { kind: 'connect'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'import'; data: UniverseData }
  | { kind: 'help' }
  | { kind: 'settings' }
  /** `forNote`: the memo whose "グループ" asked for a new group (it joins the group). */
  | { kind: 'group-create'; forNote?: string }
  | { kind: 'group-edit'; id: string }
  | { kind: 'group-delete'; id: string }
  | null;

/** Space kept free above the bottom edge for the tab bar. */
const TAB_BAR_SPACE = 92;

const NOTICE_TEXT: Record<Exclude<StorageNotice, null>, string> = {
  repaired: ja.storageNotice.repaired,
  corrupt: ja.storageNotice.corrupt,
  unavailable: ja.storageNotice.unavailable,
  'save-failed': ja.storageNotice.saveFailed,
};

interface AppProps {
  /** Locks the app right away. Only set while the passcode lock is on. */
  onLockNow?: () => void;
}

export default function App({ onLockNow }: AppProps) {
  useVisualViewportVars();
  const { data, actions, notice, clearNotice } = useUniverseStore();

  const universeRef = useRef<UniverseHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<NotesViewHandle>(null);
  // True while the black menu on the home fills the screen
  const [darkHome, setDarkHome] = useState(false);
  const mapHeadRef = useRef<HTMLElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);

  // --- Layout mode ---------------------------------------------------------
  const compact = useMediaQuery('(max-width: 719px)');
  // Room for the kind panel on the left of the map — otherwise kinds are chips under the search.
  const roomyFilters = useMediaQuery('(min-width: 900px) and (min-height: 600px)');
  const touch = useMediaQuery('(pointer: coarse)');

  // --- UI state --------------------------------------------------------------
  const [view, setView] = useState<View>('notes');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** The memo just made with ＋ (its title gets the cursor). */
  const [freshId, setFreshId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  /** Group filter: group ids and/or NO_GROUP. Empty = every memo. */
  const [activeGroups, setActiveGroups] = useState<Set<string>>(() => new Set());
  const [order, setOrder] = useState<NotesOrder>(() => (readPref('notes-order') === 'groups' ? 'groups' : 'recent'));
  /** "星図の歴史" playback: the map is shown as it was at `time`. */
  const [history, setHistory] = useState<{ start: number; end: number; time: number; playing: boolean } | null>(null);
  const [historyRequested, setHistoryRequested] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hintVisible, setHintVisible] = useState(() => readPref('hint-dismissed') !== '1');
  const settings = useSettings();
  // "Now", refreshed every minute and when the app comes back (for "3分前" and the reminder).
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setClock(Date.now());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(tick, 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToast({ id: Date.now() + Math.random(), text, tone });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  // Tell the user about storage problems (damaged data, storage blocked, …).
  useEffect(() => {
    if (notice) {
      showToast(NOTICE_TEXT[notice], notice === 'repaired' ? 'info' : 'error');
      clearNotice();
    }
  }, [notice, clearNotice, showToast]);

  // --- Derived data -------------------------------------------------------
  const notesById = useMemo(() => new Map(data.notes.map((n) => [n.id, n])), [data.notes]);
  const selected = selectedId ? notesById.get(selectedId) ?? null : null;
  const connectSource = connectSourceId ? notesById.get(connectSourceId) ?? null : null;
  const groupsById = useMemo(() => new Map(data.groups.map((g) => [g.id, g])), [data.groups]);
  const nextGroupColor = GROUP_COLORS[data.groups.length % GROUP_COLORS.length];
  const titleOf = useCallback((id: string) => {
    const note = notesById.get(id);
    return note ? displayTitle(note) : '';
  }, [notesById]);

  // Clear selection if the selected memo disappears (deleted, import…).
  useEffect(() => {
    if (selectedId && !notesById.has(selectedId)) setSelectedId(null);
    if (connectSourceId && !notesById.has(connectSourceId)) setConnectSourceId(null);
  }, [notesById, selectedId, connectSourceId]);

  // A memo left with no title and no text (＋ pressed, then closed) is removed quietly.
  const previousSelection = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousSelection.current;
    previousSelection.current = selectedId;
    if (previous && previous !== selectedId) actions.deleteIfBlank(previous);
  }, [selectedId, actions]);

  const groupIds = useMemo(() => new Set(data.groups.map((g) => g.id)), [data.groups]);
  const groupKey = useCallback(
    (n: Note) => (n.groupId && groupIds.has(n.groupId) ? n.groupId : NO_GROUP),
    [groupIds],
  );
  const filterActive = query.trim().length > 0 || activeGroups.size > 0;
  const matches = useMemo(
    () =>
      data.notes.filter(
        (n) => (activeGroups.size === 0 || activeGroups.has(groupKey(n))) && matchesQuery(n, query),
      ),
    [data.notes, activeGroups, query, groupKey],
  );
  const matchIds = useMemo(() => (filterActive ? new Set(matches.map((n) => n.id)) : null), [filterActive, matches]);
  const groupCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const n of data.notes) c.set(groupKey(n), (c.get(groupKey(n)) ?? 0) + 1);
    return c;
  }, [data.notes, groupKey]);
  const linkCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of data.connections) {
      m.set(c.sourceId, (m.get(c.sourceId) ?? 0) + 1);
      m.set(c.targetId, (m.get(c.targetId) ?? 0) + 1);
    }
    return m;
  }, [data.connections]);
  const links = useMemo(() => (selected ? linkedNotes(data, selected.id) : []), [data, selected]);

  // --- The memo page --------------------------------------------------------
  const pageVariant: NotePageVariant = view === 'notes' ? 'page' : compact ? 'sheet' : 'side';
  const pageVisible = Boolean(selected) && !connectSourceId && !history;

  // --- Space covered by panels (so the map centres stars in the visible area) ---
  const inMap = view === 'map';
  const headBox = useElementRect(mapHeadRef, inMap);
  const filterBox = useElementRect(filterPanelRef, inMap && roomyFilters);
  const pageBox = useElementRect(pageRef, inMap && pageVisible);
  const insets: Insets = useMemo(
    () => ({
      top: (headBox?.bottom ?? 0) + 8,
      left: roomyFilters && filterBox ? filterBox.right + 8 : 0,
      right: pageVisible && !compact && pageBox ? pageBox.width + 24 : 0,
      bottom: pageVisible && compact && pageBox ? pageBox.height : TAB_BAR_SPACE,
    }),
    [headBox, filterBox, pageBox, roomyFilters, compact, pageVisible],
  );

  // --- Opening memos ------------------------------------------------------------
  const openNote = useCallback(
    (id: string, jump = false) => {
      setSelectedId(id);
      setFreshId(null);
      actions.markOpened(id);
      if (view === 'map') {
        // Wait a moment so the panel has been measured before moving the camera.
        window.setTimeout(() => {
          if (jump) universeRef.current?.focusOn(id);
          else universeRef.current?.ensureVisible(id);
        }, 80);
      }
    },
    [actions, view],
  );

  /** ＋: a new, empty memo, opened with the cursor in its title. */
  const createMemo = useCallback(
    (at?: Position) => {
      let near = at;
      if (!near && view === 'map') near = universeRef.current?.visibleCenter();
      if (!near) {
        // Near the memo touched last, so new thoughts gather with recent ones in the map.
        const recent = data.notes.reduce<(typeof data.notes)[number] | null>(
          (best, n) => (!best || n.updatedAt > best.updatedAt ? n : best),
          null,
        );
        near = (recent && data.layout[recent.id]) || { x: 0, y: 0 };
      }
      // Filtering one group: the new memo joins it.
      const only = activeGroups.size === 1 ? [...activeGroups][0] : null;
      const groupId = only && only !== NO_GROUP ? only : null;
      const note = actions.createNote({ title: '', body: '', category: 'other', star: randomShape(), groupId }, near);
      setHistory(null);
      setConnectSourceId(null);
      setSelectedId(note.id);
      setFreshId(note.id);
      setNewStarId(note.id);
    },
    [actions, activeGroups, data, view],
  );

  const closePage = useCallback(() => {
    setSelectedId(null);
    setFreshId(null);
  }, []);

  const changeView = useCallback((next: View) => {
    setView(next);
    setHistory(null);
    if (next === 'notes') setConnectSourceId(null);
  }, []);

  const showInMap = (id: string) => {
    setView('map');
    window.setTimeout(() => universeRef.current?.focusOn(id), 120);
  };

  const tryConnect = useCallback(
    (sourceId: string, targetId: string) => {
      const result = actions.connect(sourceId, targetId);
      if (result.ok) {
        showToast(ja.toast.connected(titleOf(sourceId), titleOf(targetId)));
        setConnectSourceId(null);
        setDialog(null);
        setSelectedId(sourceId);
      } else {
        showToast(ja.connect.errors[result.reason], 'error');
      }
    },
    [actions, showToast, titleOf],
  );

  const onStarTap = useCallback(
    (id: string) => {
      if (history) {
        // While replaying history, a tap just tells when the memo was written.
        const note = notesById.get(id);
        if (note) showToast(ja.history.born(displayTitle(note), formatDateTime(note.createdAt)));
        return;
      }
      if (connectSourceId) tryConnect(connectSourceId, id);
      else openNote(id);
    },
    [connectSourceId, tryConnect, openNote, history, notesById, showToast],
  );

  const openHistory = useCallback(() => {
    const range = historyRange(data);
    if (!range || data.notes.length < 2) {
      showToast(ja.history.notEnough);
      return;
    }
    setSelectedId(null);
    setConnectSourceId(null);
    universeRef.current?.fitAll(false); // frame the whole (final) map first
    setHistory({ ...range, time: range.start, playing: true });
  }, [data, showToast]);
  const requestHistory = () => {
    if (view === 'map') openHistory();
    else {
      setView('map');
      setHistoryRequested(true);
    }
  };
  // History asked for from the memo list: start once the map is on screen.
  useEffect(() => {
    if (!historyRequested || view !== 'map') return;
    const t = window.setTimeout(() => {
      setHistoryRequested(false);
      openHistory();
    }, 60);
    return () => window.clearTimeout(t);
  }, [historyRequested, view, openHistory]);
  const closeHistory = useCallback(() => setHistory(null), []);
  const shownData = useMemo(() => (history ? universeAt(data, history.time) : data), [data, history]);
  const historyTicks = useMemo(() => data.notes.map((n) => Date.parse(n.createdAt)).sort((a, b) => a - b), [data.notes]);

  const onBackgroundTap = useCallback(() => {
    if (!connectSourceId) setSelectedId(null);
  }, [connectSourceId]);

  const onMoveEnd = useCallback((id: string) => actions.settleStar(id), [actions]);

  /** A star was dropped onto another one: put it back where it was and connect the two. */
  const onDropConnect = useCallback(
    (draggedId: string, targetId: string, from: Position) => {
      actions.moveStar(draggedId, from);
      const result = actions.connect(draggedId, targetId);
      if (result.ok) showToast(ja.toast.connected(titleOf(draggedId), titleOf(targetId)));
      else showToast(ja.connect.errors[result.reason], 'error');
    },
    [actions, showToast, titleOf],
  );

  const togglePin = (id: string) => {
    const note = notesById.get(id);
    if (!note) return;
    actions.setPinned(id, !note.pinned);
    showToast(note.pinned ? ja.toast.unpinned : ja.toast.pinned);
  };

  const toggleGroup = (id: string) =>
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearFilters = () => {
    setQuery('');
    setActiveGroups(new Set());
  };

  // --- Keyboard shortcuts (desktop) -----------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.closest?.('input, textarea, select, [contenteditable="true"]');
      if (dialog || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        if (view === 'notes') notesRef.current?.focusSearch();
        else searchRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        createMemo();
      } else if (e.key === 'Escape') {
        if (connectSourceId) setConnectSourceId(null);
        else closePage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, connectSourceId, createMemo, closePage, view]);

  // Safari's bar follows the page: black while the black menu fills the phone screen
  const darkScreen = compact && view === 'notes' && darkHome && !pageVisible;
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', darkScreen ? '#000000' : '#ffffff');
  }, [darkScreen]);

  // Clear the "new star" highlight after its birth animation.
  useEffect(() => {
    if (!newStarId) return;
    const t = window.setTimeout(() => setNewStarId(null), 2400);
    return () => window.clearTimeout(t);
  }, [newStarId]);

  const dismissHint = () => {
    setHintVisible(false);
    writePref('hint-dismissed', '1');
  };

  // --- Backup import / export ---------------------------------------------
  /** Exports a backup and remembers when, for the backup reminder. */
  const runExport = () => {
    exportBackup(data)
      .then((result) => {
        if (result === 'cancelled') return;
        showToast(result === 'shared' ? ja.toast.shared : ja.toast.exported);
        updateSettings((s) => ({
          ...s,
          backup: { ...s.backup, lastBackupAt: new Date().toISOString(), snoozedUntil: null },
        }));
      })
      .catch(() => showToast(ja.backup.errors.exportFailed, 'error'));
  };

  const importFile = async (file: File) => {
    try {
      const imported = await readBackupFile(file);
      setDialog({ kind: 'import', data: imported });
    } catch (err) {
      showToast(err instanceof Error ? err.message : ja.backup.errors.readFailed, 'error');
    }
  };

  // --- Render ----------------------------------------------------------------
  const connecting = dialog?.kind === 'connect' ? notesById.get(dialog.id) : undefined;
  const deleting = dialog?.kind === 'delete' ? notesById.get(dialog.id) : undefined;
  const hasOwnNotes = data.notes.some((n) => !n.sample);
  // The tab bar steps aside while a memo fills the phone screen.
  const showTabBar = !(compact && pageVisible) && !connectSourceId && !history;
  const showReminder =
    isBackupDue(settings.backup, hasOwnNotes, new Date(clock)) &&
    !dialog &&
    !connectSourceId &&
    !history &&
    !(compact && pageVisible);

  const menu = (
    <DataMenu
      onFitAll={() => {
        setView('map');
        window.setTimeout(() => universeRef.current?.fitAll(), 60);
      }}
      onShowHelp={() => setDialog({ kind: 'help' })}
      onExport={runExport}
      onImportFile={importFile}
      onOpenSettings={() => setDialog({ kind: 'settings' })}
      onOpenHistory={requestHistory}
      onLockNow={onLockNow}
    />
  );

  return (
    <div
      className={[
        'app',
        `view-${view}`,
        compact ? 'is-compact' : 'is-wide',
        touch && 'is-touch',
        pageVisible && 'has-page',
        history && 'is-history',
        !roomyFilters && 'has-chips',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {view === 'notes' ? (
        <NotesView
          ref={notesRef}
          onDarkChange={setDarkHome}
          notes={matches}
          allNotes={data.notes}
          linkTotal={data.connections.length}
          groups={data.groups}
          linkCounts={linkCounts}
          selectedId={pageVisible ? selectedId : null}
          query={query}
          onQueryChange={setQuery}
          activeGroups={activeGroups}
          groupCounts={groupCounts}
          onToggleGroup={toggleGroup}
          onClearGroups={() => setActiveGroups(new Set())}
          order={order}
          onOrderChange={(o) => {
            setOrder(o);
            writePref('notes-order', o);
          }}
          onOpen={(id) => openNote(id)}
          onCreate={() => createMemo()}
          onShowMap={() => changeView('map')}
          onShowGroupInMap={(id) => {
            setSelectedId(null);
            setView('map');
            window.setTimeout(() => universeRef.current?.focusGroup(id), 120);
          }}
          onEditGroup={(id) => setDialog({ kind: 'group-edit', id })}
          onCreateGroup={() => setDialog({ kind: 'group-create' })}
          menu={menu}
          now={clock}
        />
      ) : (
        <>
          <Universe
            ref={universeRef}
            data={shownData}
            historyMode={Boolean(history)}
            selectedId={selectedId}
            matchIds={matchIds}
            connectSourceId={connectSourceId}
            newStarId={newStarId}
            insets={insets}
            onStarTap={onStarTap}
            onBackgroundTap={onBackgroundTap}
            onMoveStar={actions.moveStar}
            onMoveEnd={onMoveEnd}
            focusMode={settings.display.focusMode}
            sky={null}
            onDropConnect={onDropConnect}
            onBackgroundLongPress={(at) => createMemo(at)}
          />

          <MapHeader
            ref={mapHeadRef}
            noteCount={data.notes.length}
            linkCount={data.connections.length}
            onFitAll={() => universeRef.current?.fitAll()}
            search={
              <SearchBox
                ref={searchRef}
                query={query}
                onQueryChange={setQuery}
                results={matches}
                onOpenResult={(id) => openNote(id, true)}
              />
            }
            chips={
              roomyFilters ? null : (
                data.groups.length === 0 ? null : (
                  <GroupFilter
                    variant="chips"
                    groups={data.groups}
                    active={activeGroups}
                    counts={groupCounts}
                    onToggle={toggleGroup}
                    onClear={() => setActiveGroups(new Set())}
                  />
                )
              )
            }
          />

          {roomyFilters && data.groups.length > 0 && (
            <div ref={filterPanelRef} className="filter-panel">
              <GroupFilter
                variant="panel"
                groups={data.groups}
                active={activeGroups}
                counts={groupCounts}
                onToggle={toggleGroup}
                onClear={() => setActiveGroups(new Set())}
              />
            </div>
          )}

          {filterActive && !connectSourceId && (
            <div className="filter-status" style={{ top: insets.top }} role="status">
              <span>{ja.filter.status(matches.length, data.notes.length)}</span>
              <button type="button" className="button button-small" onClick={clearFilters}>
                {ja.common.clear}
              </button>
            </div>
          )}

          {connectSource && (
            <div className="connect-banner" style={{ top: insets.top }} role="status">
              <span>
                {ja.connectBanner.before}
                <strong>{displayTitle(connectSource)}</strong>
                {ja.connectBanner.after}
              </span>
              <button type="button" className="button button-small" onClick={() => setConnectSourceId(null)}>
                {ja.common.cancel}
              </button>
            </div>
          )}

          {!touch && (
            <div className="view-controls">
              <button type="button" className="icon-button round-icon" aria-label={ja.view.zoomIn} title={ja.view.zoomIn} onClick={() => universeRef.current?.zoomBy(1.3)}>
                <ZoomInIcon />
              </button>
              <button type="button" className="icon-button round-icon" aria-label={ja.view.zoomOut} title={ja.view.zoomOut} onClick={() => universeRef.current?.zoomBy(1 / 1.3)}>
                <ZoomOutIcon />
              </button>
            </div>
          )}

          {history && (
            <HistoryBar
              start={history.start}
              end={history.end}
              time={history.time}
              playing={history.playing}
              ticks={historyTicks}
              visibleCount={shownData.notes.length}
              onTimeChange={(time) => setHistory((h) => (h ? { ...h, time } : h))}
              onPlayingChange={(playing) => setHistory((h) => (h ? { ...h, playing } : h))}
              onClose={closeHistory}
            />
          )}

          {hintVisible && !showReminder && !history && !selected && !connectSourceId && data.notes.length > 0 && (
            <div className="hint">
              <span>{touch ? ja.hint.touch : ja.hint.mouse}</span>
              <button type="button" className="icon-button" aria-label={ja.hint.dismiss} onClick={dismissHint}>
                <CloseIcon />
              </button>
            </div>
          )}

          {data.notes.length === 0 && (
            <div className="empty-map">
              <p>{ja.notes.empty}</p>
              <button type="button" className="button button-primary" onClick={() => createMemo()}>
                <SmallPlusIcon />
                {ja.notes.emptyAction}
              </button>
            </div>
          )}
        </>
      )}

      {view === 'notes' && !pageVisible && !compact && data.notes.length > 0 && (
        <div className="page-placeholder" aria-hidden="true">
          <p>{ja.notes.pickHint}</p>
        </div>
      )}

      {selected && pageVisible && (
        <NotePage
          key={selected.id}
          ref={pageRef}
          note={selected}
          links={links}
          groups={data.groups}
          variant={pageVariant}
          autoFocusTitle={freshId === selected.id}
          onClose={closePage}
          onUpdate={(patch) => {
            actions.updateNote(selected.id, patch);
            // Joining a group moves the star into its circle: keep it in view.
            if (patch.groupId !== undefined && view === 'map') {
              window.setTimeout(() => universeRef.current?.ensureVisible(selected.id), 80);
            }
          }}
          onNewGroup={() => setDialog({ kind: 'group-create', forNote: selected.id })}
          onDelete={() => setDialog({ kind: 'delete', id: selected.id })}
          onConnect={() => setDialog({ kind: 'connect', id: selected.id })}
          onDisconnect={(connectionId) => {
            actions.disconnect(connectionId);
            showToast(ja.toast.linkRemoved);
          }}
          onOpenNote={(id) => openNote(id, true)}
          onTogglePin={() => togglePin(selected.id)}
          onShowInMap={view === 'notes' ? () => showInMap(selected.id) : undefined}
        />
      )}

      {showReminder && (
        <BackupReminder
          days={settings.backup.lastBackupAt ? daysSinceBackup(settings.backup, new Date(clock)) : null}
          onExport={runExport}
          onLater={() => {
            updateSettings((s) => ({
              ...s,
              backup: { ...s.backup, snoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            }));
            showToast(ja.toast.reminderSnoozed);
          }}
        />
      )}

      {showTabBar && (
        <TabBar
          view={view}
          dark={view === 'notes' && darkHome}
          onViewChange={(next) => {
            // Tapping メモ again goes back to the picture
            if (next === 'notes' && view === 'notes') notesRef.current?.goHome();
            changeView(next);
          }}
          onCreate={() => createMemo()}
          onOpenHistory={requestHistory}
          onOpenSettings={() => setDialog({ kind: 'settings' })}
        />
      )}

      <Toast toast={toast} onDone={clearToast} />

      {/* --- Dialogs ------------------------------------------------------ */}
      {connecting && (
        <ConnectPicker
          source={connecting}
          data={data}
          onClose={() => setDialog(null)}
          onPick={(targetId) => tryConnect(connecting.id, targetId)}
          onPickInUniverse={() => {
            setDialog(null);
            setConnectSourceId(connecting.id);
            setView('map');
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={ja.deleteDialog.title}
          message={<p>{ja.deleteDialog.message(displayTitle(deleting), linkedNotes(data, deleting.id).length)}</p>}
          confirmLabel={ja.deleteDialog.confirm}
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            actions.deleteNote(deleting.id);
            setDialog(null);
            setSelectedId(null);
            showToast(ja.toast.deleted);
          }}
        />
      )}

      {dialog?.kind === 'import' && (
        <ConfirmDialog
          title={ja.importDialog.title}
          message={
            <p>
              {ja.importDialog.message(data.notes.length, dialog.data.notes.length, dialog.data.connections.length)}
            </p>
          }
          confirmLabel={ja.importDialog.confirm}
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            actions.replaceAll(dialog.data);
            setDialog(null);
            setSelectedId(null);
            showToast(ja.toast.imported);
            window.setTimeout(() => universeRef.current?.fitAll(), 50);
          }}
        />
      )}

      {dialog?.kind === 'help' && <HelpDialog touch={touch} onClose={() => setDialog(null)} />}

      {dialog?.kind === 'settings' && (
        <SettingsDialog onClose={() => setDialog(null)} onExport={runExport} onToast={showToast} />
      )}

      {dialog?.kind === 'group-create' && (
        <GroupDialog
          suggestedColor={nextGroupColor}
          onClose={() => setDialog(null)}
          onSubmit={({ name, color }) => {
            const group = actions.createGroup(name, color);
            if (dialog.forNote) actions.updateNote(dialog.forNote, { groupId: group.id });
            setDialog(null);
            showToast(ja.toast.groupCreated(name));
          }}
        />
      )}

      {dialog?.kind === 'group-edit' && groupsById.get(dialog.id) && (
        <GroupDialog
          group={groupsById.get(dialog.id)}
          onClose={() => setDialog(null)}
          onSubmit={(patch) => {
            actions.updateGroup(dialog.id, patch);
            setDialog(null);
            showToast(ja.toast.groupSaved);
          }}
          onDelete={() => setDialog({ kind: 'group-delete', id: dialog.id })}
        />
      )}

      {dialog?.kind === 'group-delete' && groupsById.get(dialog.id) && (
        <ConfirmDialog
          title={ja.deleteGroupDialog.title}
          message={
            <p>
              {ja.deleteGroupDialog.message(
                groupsById.get(dialog.id)!.name,
                data.notes.filter((n) => n.groupId === dialog.id).length,
              )}
            </p>
          }
          confirmLabel={ja.deleteGroupDialog.confirm}
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            actions.deleteGroup(dialog.id);
            setDialog(null);
            showToast(ja.toast.groupDeleted);
          }}
        />
      )}
    </div>
  );
}
