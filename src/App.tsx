import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_IDS, type CategoryId, type UniverseData } from './domain/types';
import { CONNECT_ERROR_MESSAGES, linkedNotes, matchesQuery } from './domain/universe';
import { useUniverseStore, type StorageNotice } from './state/useUniverseStore';
import { downloadBackup, readBackupFile } from './storage/backupFile';
import { readPref, writePref } from './storage/preferences';
import { useElementRect } from './hooks/useElementRect';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useVisualViewportVars } from './hooks/useVisualViewport';
import { CategoryFilter } from './components/CategoryFilter';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ConnectPicker } from './components/ConnectPicker';
import { DataMenu } from './components/DataMenu';
import { DetailPanel } from './components/DetailPanel';
import { HelpDialog } from './components/HelpDialog';
import { NoteFormModal } from './components/NoteFormModal';
import { SearchBox } from './components/SearchBox';
import { Toast, type ToastMessage } from './components/Toast';
import { TopBar } from './components/TopBar';
import { CloseIcon, FitIcon, PlusIcon, ZoomInIcon, ZoomOutIcon } from './components/icons';
import { Universe, type Insets, type UniverseHandle } from './components/universe/Universe';

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; id: string }
  | { kind: 'connect'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'import'; data: UniverseData }
  | { kind: 'help' }
  | null;

const NOTICE_TEXT: Record<Exclude<StorageNotice, null>, string> = {
  repaired: 'Some saved data was damaged and has been repaired.',
  corrupt: "Your saved universe couldn't be read. A backup copy was kept in this browser; showing sample stars.",
  unavailable: "This browser is blocking storage, so changes won't be saved after you close the page.",
  'save-failed': "Couldn't save your latest change — browser storage may be full.",
};

export default function App() {
  useVisualViewportVars();
  const { data, actions, notice, clearNotice } = useUniverseStore();

  const universeRef = useRef<UniverseHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  // --- Layout mode ---------------------------------------------------------
  const compact = useMediaQuery('(max-width: 719px)');
  const roomyFilters = useMediaQuery('(min-width: 900px) and (min-height: 560px)');
  const touch = useMediaQuery('(pointer: coarse)');

  // --- UI state --------------------------------------------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hintVisible, setHintVisible] = useState(() => readPref('hint-dismissed') !== '1');

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
      left: roomyFilters && filterBox ? filterBox.right + 8 : 0,
      right: detailVisible && !compact && detailBox ? detailBox.width + 24 : 0,
      bottom: detailVisible && compact && detailBox ? detailBox.height : 24,
    }),
    [topBox, filterBox, detailBox, roomyFilters, compact, detailVisible],
  );

  // --- Selection -------------------------------------------------------------
  const openStar = useCallback((id: string, jump: boolean) => {
    setSelectedId(id);
    // Wait a moment so the panel has been measured before moving the camera.
    window.setTimeout(() => {
      if (jump) universeRef.current?.focusOn(id);
      else universeRef.current?.ensureVisible(id);
    }, 80);
  }, []);

  const tryConnect = useCallback(
    (sourceId: string, targetId: string) => {
      const result = actions.connect(sourceId, targetId);
      if (result.ok) {
        const a = notesById.get(sourceId)?.title ?? '';
        const b = notesById.get(targetId)?.title ?? '';
        showToast(`Connected “${a}” with “${b}”`);
        setConnectSourceId(null);
        setDialog(null);
        setSelectedId(sourceId);
      } else {
        showToast(CONNECT_ERROR_MESSAGES[result.reason], 'error');
      }
    },
    [actions, notesById, showToast],
  );

  const onStarTap = useCallback(
    (id: string) => {
      setFiltersOpen(false);
      if (connectSourceId) tryConnect(connectSourceId, id);
      else openStar(id, false);
    },
    [connectSourceId, tryConnect, openStar],
  );

  const onBackgroundTap = useCallback(() => {
    setFiltersOpen(false);
    if (!connectSourceId) setSelectedId(null);
  }, [connectSourceId]);

  const onMoveEnd = useCallback((id: string) => actions.settleStar(id), [actions]);

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
        else if (filtersOpen) setFiltersOpen(false);
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, connectSourceId, filtersOpen]);

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
  const importFile = async (file: File) => {
    try {
      const imported = await readBackupFile(file);
      setDialog({ kind: 'import', data: imported });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not read that file.', 'error');
    }
  };

  // --- Render ----------------------------------------------------------------
  const editing = dialog?.kind === 'edit' ? notesById.get(dialog.id) : undefined;
  const connecting = dialog?.kind === 'connect' ? notesById.get(dialog.id) : undefined;
  const deleting = dialog?.kind === 'delete' ? notesById.get(dialog.id) : undefined;
  const showFab = !(compact && detailVisible) && !connectSourceId;

  return (
    <div
      className={[
        'app',
        compact ? 'is-compact' : 'is-wide',
        touch && 'is-touch',
        detailVisible && (compact ? 'has-sheet' : 'has-side-panel'),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Universe
        ref={universeRef}
        data={data}
        selectedId={selectedId}
        matchIds={matchIds}
        connectSourceId={connectSourceId}
        newStarId={newStarId}
        insets={insets}
        onStarTap={onStarTap}
        onBackgroundTap={onBackgroundTap}
        onMoveStar={actions.moveStar}
        onMoveEnd={onMoveEnd}
      />

      <TopBar
        ref={topbarRef}
        starCount={data.notes.length}
        linkCount={data.connections.length}
        showFilterButton={!roomyFilters}
        activeFilterCount={activeCats.size}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
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
            onExport={() => {
              downloadBackup(data);
              showToast('Backup file downloaded.');
            }}
            onImportFile={importFile}
          />
        }
      />

      {roomyFilters ? (
        <div ref={filterPanelRef} className="filter-panel glass">
          <CategoryFilter
            variant="panel"
            active={activeCats}
            counts={counts}
            onToggle={toggleCategory}
            onClear={() => setActiveCats(new Set())}
          />
        </div>
      ) : (
        filtersOpen && (
          <div
            id="filter-popover"
            className="filter-popover glass"
            style={{ top: insets.top + (filterActive ? 52 : 0) }}
          >
            <CategoryFilter
              variant="popover"
              active={activeCats}
              counts={counts}
              onToggle={toggleCategory}
              onClear={() => setActiveCats(new Set())}
            />
          </div>
        )
      )}

      {filterActive && !connectSourceId && (
        <div className="filter-status glass" style={{ top: insets.top }} role="status">
          <span>
            <strong>{matches.length}</strong> of {data.notes.length} stars match
          </span>
          <button type="button" className="button button-small" onClick={clearFilters}>
            Clear
          </button>
        </div>
      )}

      {connectSource && (
        <div className="connect-banner glass" style={{ top: insets.top }} role="status">
          <span>
            Tap a star to connect it with <strong>{connectSource.title}</strong>
          </span>
          <button type="button" className="button button-small" onClick={() => setConnectSourceId(null)}>
            Cancel
          </button>
        </div>
      )}

      {selected && detailVisible && (
        <DetailPanel
          key={selected.id}
          ref={detailRef}
          note={selected}
          links={links}
          sheet={compact}
          onClose={() => setSelectedId(null)}
          onEdit={() => setDialog({ kind: 'edit', id: selected.id })}
          onDelete={() => setDialog({ kind: 'delete', id: selected.id })}
          onConnect={() => setDialog({ kind: 'connect', id: selected.id })}
          onDisconnect={(connectionId) => {
            actions.disconnect(connectionId);
            showToast('Connection removed.');
          }}
          onOpenNote={(id) => openStar(id, true)}
        />
      )}

      <div className="view-controls">
        {!touch && (
          <>
            <button type="button" className="icon-button glass" aria-label="Zoom in" onClick={() => universeRef.current?.zoomBy(1.3)}>
              <ZoomInIcon />
            </button>
            <button type="button" className="icon-button glass" aria-label="Zoom out" onClick={() => universeRef.current?.zoomBy(1 / 1.3)}>
              <ZoomOutIcon />
            </button>
          </>
        )}
        <button
          type="button"
          className="icon-button glass"
          aria-label="Show whole universe"
          title="Show whole universe"
          onClick={() => universeRef.current?.fitAll()}
        >
          <FitIcon />
        </button>
      </div>

      {showFab && (
        <button type="button" className="fab" onClick={() => setDialog({ kind: 'create' })} aria-label="Add star">
          <PlusIcon />
          <span className="fab-label">Add star</span>
        </button>
      )}

      {hintVisible && !selected && !connectSourceId && (
        <div className="hint glass">
          <span>
            {touch
              ? 'Tap a star · Hold to move it · Pinch to zoom'
              : 'Click a star to open it · Drag to move · Scroll to zoom'}
          </span>
          <button type="button" className="icon-button" aria-label="Dismiss tip" onClick={dismissHint}>
            <CloseIcon />
          </button>
        </div>
      )}

      {data.notes.length === 0 && (
        <div className="empty-universe">
          <p className="empty-universe-title">Your universe is waiting for its first star.</p>
          <button type="button" className="button button-primary" onClick={() => setDialog({ kind: 'create' })}>
            <PlusIcon /> Create your first star
          </button>
        </div>
      )}

      <Toast toast={toast} onDone={clearToast} />

      {/* --- Dialogs ------------------------------------------------------ */}
      {dialog?.kind === 'create' && (
        <NoteFormModal
          defaultCategory={activeCats.size === 1 ? [...activeCats][0] : null}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            const near = universeRef.current?.visibleCenter() ?? { x: 0, y: 0 };
            const note = actions.createNote(values, near);
            setDialog(null);
            setNewStarId(note.id);
            openStar(note.id, false);
            showToast('A new star is born ✦');
          }}
        />
      )}

      {editing && (
        <NoteFormModal
          note={editing}
          onClose={() => setDialog(null)}
          onSubmit={(values) => {
            actions.updateNote(editing.id, values);
            setDialog(null);
            showToast('Changes saved.');
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
          title="Delete this star?"
          message={
            <p>
              “{deleting.title}” and its {linkedNotes(data, deleting.id).length} connection(s) will be removed. This
              can’t be undone.
            </p>
          }
          confirmLabel="Delete star"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            actions.deleteNote(deleting.id);
            setDialog(null);
            setSelectedId(null);
            showToast('Star deleted.');
          }}
        />
      )}

      {dialog?.kind === 'import' && (
        <ConfirmDialog
          title="Import backup?"
          message={
            <p>
              Replace your current universe ({data.notes.length} stars) with the backup ({dialog.data.notes.length}{' '}
              stars, {dialog.data.connections.length} connections)?
            </p>
          }
          confirmLabel="Replace universe"
          danger
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            actions.replaceAll(dialog.data);
            setDialog(null);
            setSelectedId(null);
            showToast('Backup imported.');
            window.setTimeout(() => universeRef.current?.fitAll(), 50);
          }}
        />
      )}

      {dialog?.kind === 'help' && <HelpDialog touch={touch} onClose={() => setDialog(null)} />}
    </div>
  );
}
