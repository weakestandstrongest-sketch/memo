import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_IDS, type CategoryId, type Position, type UniverseData } from './domain/types';
import { formatDateTime } from './utils/format';
import { skyPhase, type SkyPhase } from './utils/sky';
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
import { CategoryFilter } from './components/CategoryFilter';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConnectPicker } from './components/ConnectPicker';
import { DataMenu } from './components/DataMenu';
import { DetailPanel } from './components/DetailPanel';
import { GroupDialog } from './components/GroupDialog';
import { HelpDialog } from './components/HelpDialog';
import { HistoryBar } from './components/HistoryBar';
import { NoteFormModal } from './components/NoteFormModal';
import { SearchBox } from './components/SearchBox';
import { SettingsDialog } from './components/SettingsDialog';
import { Sidebar } from './components/Sidebar';
import { Toast, type ToastMessage } from './components/Toast';
import { TopBar } from './components/TopBar';
import { Dock } from './components/Dock';
import { CloseIcon, PlusIcon, ZoomInIcon, ZoomOutIcon } from './components/icons';
import { Universe, type Insets, type UniverseHandle } from './components/universe/Universe';

type Dialog =
  /** `at`: where to put the new star (long press / double-click), otherwise the screen centre. */
  | { kind: 'create'; at?: Position }
  | { kind: 'edit'; id: string }
  | { kind: 'connect'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'import'; data: UniverseData }
  | { kind: 'help' }
  | { kind: 'settings' }
  | { kind: 'group-create' }
  | { kind: 'group-edit'; id: string }
  | { kind: 'group-delete'; id: string }
  | null;

/** Width of the star list on wide screens (keep in sync with .sidebar in styles.css). */
const SIDEBAR_WIDTH = 320;
/** Space kept free above the bottom edge for the dock. */
const DOCK_SPACE = 104;
/** How long the "stars born today" note stays. */
const TODAY_NOTE_MS = 7000;

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
  const topbarRef = useRef<HTMLElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  // --- Layout mode ---------------------------------------------------------
  const compact = useMediaQuery('(max-width: 719px)');
  // Room for the category panel on the left — otherwise the categories are a row of chips under the search.
  const roomyFilters = useMediaQuery('(min-width: 900px) and (min-height: 600px)');
  const touch = useMediaQuery('(pointer: coarse)');

  // --- UI state --------------------------------------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(() => new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** "宇宙の歴史" playback: the universe is shown as it was at `time`. */
  const [history, setHistory] = useState<{ start: number; end: number; time: number; playing: boolean } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hintVisible, setHintVisible] = useState(() => readPref('hint-dismissed') !== '1');
  const settings = useSettings();
  // "Now", refreshed when the app comes back to the screen and every 30 minutes (for the reminder).
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setClock(Date.now());
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setInterval(tick, 30 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  // Sky color for the time of day (checked every 5 minutes).
  const [sky, setSky] = useState<SkyPhase>(() => skyPhase());
  useEffect(() => {
    const t = window.setInterval(() => setSky(skyPhase()), 5 * 60 * 1000);
    return () => window.clearInterval(t);
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

  // Clear selection if the selected note disappears (deleted, import…).
  useEffect(() => {
    if (selectedId && !notesById.has(selectedId)) setSelectedId(null);
    if (connectSourceId && !notesById.has(connectSourceId)) setConnectSourceId(null);
  }, [notesById, selectedId, connectSourceId]);

  const filterActive = query.trim().length > 0 || activeCats.size > 0;
  const matches = useMemo(
    () =>
      data.notes.filter(
        (n) => (activeCats.size === 0 || activeCats.has(n.category)) && matchesQuery(n, query),
      ),
    [data.notes, activeCats, query],
  );
  const matchIds = useMemo(() => (filterActive ? new Set(matches.map((n) => n.id)) : null), [filterActive, matches]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>;
    for (const n of data.notes) c[n.category]++;
    return c;
  }, [data.notes]);
  const links = useMemo(() => (selected ? linkedNotes(data, selected.id) : []), [data, selected]);

  // --- Space covered by panels (so the camera centres stars in the visible area) ---
  const detailVisible = Boolean(selected) && !connectSourceId;
  const topBox = useElementRect(topbarRef);
  const filterBox = useElementRect(filterPanelRef, roomyFilters);
  const detailBox = useElementRect(detailRef, detailVisible);
  const insets: Insets = useMemo(
    () => ({
      top: (topBox?.bottom ?? 0) + 8,
      left: Math.max(
        roomyFilters && filterBox ? filterBox.right + 8 : 0,
        sidebarOpen && !compact ? SIDEBAR_WIDTH + 24 : 0,
      ),
      right: detailVisible && !compact && detailBox ? detailBox.width + 24 : 0,
      bottom: detailVisible && compact && detailBox ? detailBox.height : DOCK_SPACE,
    }),
    [topBox, filterBox, detailBox, roomyFilters, compact, detailVisible, sidebarOpen],
  );

  // --- Selection -------------------------------------------------------------
  const openStar = useCallback((id: string, jump: boolean) => {
    setSelectedId(id);
    actions.markOpened(id);
    // Wait a moment so the panel has been measured before moving the camera.
    window.setTimeout(() => {
      if (jump) universeRef.current?.focusOn(id);
      else universeRef.current?.ensureVisible(id);
    }, 80);
  }, [actions]);

  const tryConnect = useCallback(
    (sourceId: string, targetId: string) => {
      const result = actions.connect(sourceId, targetId);
      if (result.ok) {
        const a = notesById.get(sourceId)?.title ?? '';
        const b = notesById.get(targetId)?.title ?? '';
        showToast(ja.toast.connected(a, b));
        setConnectSourceId(null);
        setDialog(null);
        setSelectedId(sourceId);
      } else {
        showToast(ja.connect.errors[result.reason], 'error');
      }
    },
    [actions, notesById, showToast],
  );

  const onStarTap = useCallback(
    (id: string) => {
      if (history) {
        // While replaying history, a tap just tells when the star was born.
        const note = notesById.get(id);
        if (note) showToast(ja.history.born(note.title, formatDateTime(note.createdAt)));
        return;
      }
      if (connectSourceId) tryConnect(connectSourceId, id);
      else openStar(id, false);
    },
    [connectSourceId, tryConnect, openStar, history, notesById, showToast],
  );

  const openHistory = () => {
    const range = historyRange(data);
    if (!range || data.notes.length < 2) {
      showToast(ja.history.notEnough);
      return;
    }
    setSelectedId(null);
    setConnectSourceId(null);
    setSidebarOpen(false);
    universeRef.current?.fitAll(false); // frame the whole (final) universe first
    setHistory({ ...range, time: range.start, playing: true });
  };
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
      if (result.ok) {
        const a = notesById.get(draggedId)?.title ?? '';
        const b = notesById.get(targetId)?.title ?? '';
        showToast(ja.toast.connected(a, b));
      } else {
        showToast(ja.connect.errors[result.reason], 'error');
      }
    },
    [actions, notesById, showToast],
  );
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const togglePin = (id: string) => {
    const note = notesById.get(id);
    if (!note) return;
    actions.setPinned(id, !note.pinned);
    showToast(note.pinned ? ja.toast.unpinned : ja.toast.pinned);
  };

  /** Creates the group typed in the note form (if any) and returns the group id to use. */
  const resolveGroupId = (values: { groupId: string | null; newGroupName?: string }) => {
    if (!values.newGroupName) return values.groupId;
    const group = actions.createGroup(values.newGroupName, nextGroupColor);
    showToast(ja.toast.groupCreated(group.name));
    return group.id;
  };

  // --- Filters -------------------------------------------------------------
  const toggleCategory = (id: CategoryId) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearFilters = () => {
    setQuery('');
    setActiveCats(new Set());
  };

  // --- Keyboard shortcuts (desktop) -----------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.closest?.('input, textarea, [contenteditable="true"]');
      if (dialog || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setDialog({ kind: 'create' });
      } else if (e.key === 'Escape') {
        if (connectSourceId) setConnectSourceId(null);
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, connectSourceId]);

  // Clear the "new star" highlight after its birth animation.
  useEffect(() => {
    if (!newStarId) return;
    const t = window.setTimeout(() => setNewStarId(null), 2400);
    return () => window.clearTimeout(t);
  }, [newStarId]);

  // "きょう、新しい星が…": stars born today, shown for a moment after the app opens.
  const [todayCount] = useState(() => {
    const today = new Date().toDateString();
    return data.notes.filter((n) => new Date(n.createdAt).toDateString() === today).length;
  });
  const [todayNoteOn, setTodayNoteOn] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setTodayNoteOn(false), TODAY_NOTE_MS);
    return () => window.clearTimeout(t);
  }, []);

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
  const editing = dialog?.kind === 'edit' ? notesById.get(dialog.id) : undefined;
  const connecting = dialog?.kind === 'connect' ? notesById.get(dialog.id) : undefined;
  const deleting = dialog?.kind === 'delete' ? notesById.get(dialog.id) : undefined;
  const showDock = !(compact && detailVisible) && !connectSourceId && !history;
  const hasOwnNotes = data.notes.some((n) => !n.sample);
  const showTodayNote =
    todayNoteOn && todayCount > 0 && !hintVisible && showDock && !selected && !dialog && !sidebarOpen;
  const showReminder =
    isBackupDue(settings.backup, hasOwnNotes, new Date(clock)) &&
    !dialog &&
    !connectSourceId &&
    !sidebarOpen &&
    !history &&
    !(compact && detailVisible);

  return (
    <div
      className={[
        'app',
        compact ? 'is-compact' : 'is-wide',
        touch && 'is-touch',
        detailVisible && (compact ? 'has-sheet' : 'has-side-panel'),
        history && 'is-history',
        !roomyFilters && 'has-chips',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
        onEdgeSwipe={openSidebar}
        focusMode={settings.display.focusMode}
        sky={settings.display.timeSky ? sky : null}
        onDropConnect={onDropConnect}
        onBackgroundLongPress={(at) => setDialog({ kind: 'create', at })}
      />

      <TopBar
        ref={topbarRef}
        starCount={data.notes.length}
        linkCount={data.connections.length}
        hour={new Date(clock).getHours()}
        chips={
          roomyFilters ? null : (
            <CategoryFilter
              variant="chips"
              active={activeCats}
              counts={counts}
              onToggle={toggleCategory}
              onClear={() => setActiveCats(new Set())}
            />
          )
        }
        search={
          <SearchBox
            ref={searchRef}
            query={query}
            onQueryChange={setQuery}
            results={matches}
            onOpenResult={(id) => openStar(id, true)}
          />
        }
        menu={
          <DataMenu
            onFitAll={() => universeRef.current?.fitAll()}
            onShowHelp={() => setDialog({ kind: 'help' })}
            onExport={runExport}
            onImportFile={importFile}
            onOpenSettings={() => setDialog({ kind: 'settings' })}
            onOpenHistory={openHistory}
            onLockNow={onLockNow}
          />
        }
      />

      {roomyFilters && (
        <div ref={filterPanelRef} className="filter-panel glass">
          <CategoryFilter
            variant="panel"
            active={activeCats}
            counts={counts}
            onToggle={toggleCategory}
            onClear={() => setActiveCats(new Set())}
          />
        </div>
      )}

      {filterActive && !connectSourceId && (
        <div className="filter-status glass" style={{ top: insets.top }} role="status">
          <span>
            {ja.filter.status(matches.length, data.notes.length)}
          </span>
          <button type="button" className="button button-small" onClick={clearFilters}>
            {ja.common.clear}
          </button>
        </div>
      )}

      {connectSource && (
        <div className="connect-banner glass" style={{ top: insets.top }} role="status">
          <span>
            {ja.connectBanner.before}
            <strong>{connectSource.title}</strong>
            {ja.connectBanner.after}
          </span>
          <button type="button" className="button button-small" onClick={() => setConnectSourceId(null)}>
            {ja.common.cancel}
          </button>
        </div>
      )}

      {selected && detailVisible && (
        <DetailPanel
          key={selected.id}
          ref={detailRef}
          note={selected}
          links={links}
          group={selected.groupId ? groupsById.get(selected.groupId) ?? null : null}
          sheet={compact}
          onTogglePin={() => togglePin(selected.id)}
          onClose={() => setSelectedId(null)}
          onEdit={() => setDialog({ kind: 'edit', id: selected.id })}
          onDelete={() => setDialog({ kind: 'delete', id: selected.id })}
          onConnect={() => setDialog({ kind: 'connect', id: selected.id })}
          onDisconnect={(connectionId) => {
            actions.disconnect(connectionId);
            showToast(ja.toast.linkRemoved);
          }}
          onOpenNote={(id) => openStar(id, true)}
        />
      )}

      {!touch && (
        <div className="view-controls">
          <button type="button" className="icon-button glass" aria-label={ja.view.zoomIn} title={ja.view.zoomIn} onClick={() => universeRef.current?.zoomBy(1.3)}>
            <ZoomInIcon />
          </button>
          <button type="button" className="icon-button glass" aria-label={ja.view.zoomOut} title={ja.view.zoomOut} onClick={() => universeRef.current?.zoomBy(1 / 1.3)}>
            <ZoomOutIcon />
          </button>
        </div>
      )}

      {showDock && (
        <Dock
          sidebarOpen={sidebarOpen}
          onFitAll={() => universeRef.current?.fitAll()}
          onToggleSidebar={() => (sidebarOpen ? closeSidebar() : openSidebar())}
          onCreate={() => setDialog({ kind: 'create' })}
          onOpenHistory={openHistory}
          onOpenSettings={() => setDialog({ kind: 'settings' })}
        />
      )}

      {showTodayNote && (
        <p className="today-note" role="status">
          <span className="today-dot" aria-hidden="true" />
          {ja.today(todayCount)}
        </p>
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

      {hintVisible && !showReminder && !history && !selected && !connectSourceId && (
        <div className="hint glass">
          <span>
            {touch ? ja.hint.touch : ja.hint.mouse}
          </span>
          <button type="button" className="icon-button" aria-label={ja.hint.dismiss} onClick={dismissHint}>
            <CloseIcon />
          </button>
        </div>
      )}

      {data.notes.length === 0 && (
        <div className="empty-universe">
          <p className="empty-universe-title">{ja.empty.title}</p>
          <button type="button" className="button button-primary" onClick={() => setDialog({ kind: 'create' })}>
            <PlusIcon /> {ja.empty.button}
          </button>
        </div>
      )}

      {sidebarOpen && (
        <Sidebar
          notes={data.notes}
          groups={data.groups}
          selectedId={selectedId}
          overlay={compact}
          onClose={closeSidebar}
          onOpenNote={(id) => {
            if (compact) closeSidebar();
            openStar(id, true);
          }}
          onTogglePin={togglePin}
          onFocusGroup={(id) => {
            if (compact) closeSidebar();
            setSelectedId(null);
            window.setTimeout(() => universeRef.current?.focusGroup(id), 80);
          }}
          onEditGroup={(id) => setDialog({ kind: 'group-edit', id })}
          onCreateGroup={() => setDialog({ kind: 'group-create' })}
        />
      )}

      <Toast toast={toast} onDone={clearToast} />

      {/* --- Dialogs ------------------------------------------------------ */}
      {dialog?.kind === 'create' && (
        <NoteFormModal
          defaultCategory={activeCats.size === 1 ? [...activeCats][0] : null}
          groups={data.groups}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            const near = dialog.at ?? universeRef.current?.visibleCenter() ?? { x: 0, y: 0 };
            const groupId = resolveGroupId(values);
            const note = actions.createNote({ ...values, groupId }, near);
            setDialog(null);
            setNewStarId(note.id);
            openStar(note.id, false);
            showToast(ja.toast.created);
          }}
        />
      )}

      {editing && (
        <NoteFormModal
          note={editing}
          groups={data.groups}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            const groupId = resolveGroupId(values);
            actions.updateNote(editing.id, {
              title: values.title,
              body: values.body,
              category: values.category,
              groupId,
            });
            // The star may have moved into its new galaxy: keep it in view.
            window.setTimeout(() => universeRef.current?.ensureVisible(editing.id), 80);
            setDialog(null);
            showToast(ja.toast.saved);
          }}
        />
      )}

      {connecting && (
        <ConnectPicker
          source={connecting}
          data={data}
          onClose={() => setDialog(null)}
          onPick={(targetId) => tryConnect(connecting.id, targetId)}
          onPickInUniverse={() => {
            setDialog(null);
            setConnectSourceId(connecting.id);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={ja.deleteDialog.title}
          message={<p>{ja.deleteDialog.message(deleting.title, linkedNotes(data, deleting.id).length)}</p>}
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
            actions.createGroup(name, color);
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
