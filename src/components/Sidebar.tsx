import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Group, Note } from '../domain/types';
import { matchesQuery } from '../domain/universe';
import { ja } from '../i18n/ja';
import { ChevronIcon, CloseIcon, EditIcon, PinIcon, PlusIcon, TargetIcon } from './icons';
import { CategoryIcon } from './universe/CategoryGlyph';

interface SidebarProps {
  notes: Note[];
  groups: Group[];
  selectedId: string | null;
  /** Wide screens: no dimmed backdrop, the universe stays usable next to the list. */
  overlay: boolean;
  onClose: () => void;
  onOpenNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onFocusGroup: (id: string) => void;
  onEditGroup: (id: string) => void;
  onCreateGroup: () => void;
}

const t = ja.sidebar;

const byRecent = (a: Note, b: Note) => b.updatedAt.localeCompare(a.updatedAt);

/** List of all stars: pinned first, then each group ("galaxy"), then stars without a group. */
export function Sidebar({
  notes,
  groups,
  selectedId,
  overlay,
  onClose,
  onOpenNote,
  onTogglePin,
  onFocusGroup,
  onEditGroup,
  onCreateGroup,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const panelRef = useRef<HTMLElement>(null);
  const swipe = useRef<{ x: number; y: number; dx: number; active: boolean } | null>(null);
  const [dragX, setDragX] = useState(0);

  const filtering = query.trim().length > 0;
  const visible = useMemo(() => notes.filter((n) => matchesQuery(n, query)), [notes, query]);
  const pinned = useMemo(() => visible.filter((n) => n.pinned).sort(byRecent), [visible]);
  const groupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);
  const byGroup = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const g of groups) map.set(g.id, []);
    for (const n of visible) if (n.groupId && map.has(n.groupId)) map.get(n.groupId)!.push(n);
    for (const list of map.values()) list.sort(byRecent);
    return map;
  }, [visible, groups]);
  const ungrouped = useMemo(
    () => visible.filter((n) => !n.groupId || !groupIds.has(n.groupId)).sort(byRecent),
    [visible, groupIds],
  );

  // Escape closes the list; keyboard users start at the close button.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) {
      panelRef.current?.querySelector<HTMLElement>('.sidebar-close')?.focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // --- Swipe left on the panel to close it (touch) ---
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'touch') return;
    swipe.current = { x: e.clientX, y: e.clientY, dx: 0, active: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const s = swipe.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        swipe.current = null; // vertical: the list is being scrolled
        return;
      }
      if (dx < -12) s.active = true;
    }
    if (s.active) {
      s.dx = dx;
      setDragX(Math.min(0, dx));
    }
  };
  const onPointerEnd = () => {
    const s = swipe.current;
    swipe.current = null;
    setDragX(0);
    if (s?.active && s.dx < -70) onClose();
  };

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const row = (n: Note) => (
    <li key={n.id} className={`sidebar-note ${n.id === selectedId ? 'is-selected' : ''}`}>
      <button type="button" className="sidebar-note-open" onClick={() => onOpenNote(n.id)}>
        <CategoryIcon category={n.category} size={18} />
        <span className="sidebar-note-title">{n.title}</span>
      </button>
      <button
        type="button"
        className={`icon-button sidebar-pin ${n.pinned ? 'is-pinned' : ''}`}
        onClick={() => onTogglePin(n.id)}
        aria-pressed={Boolean(n.pinned)}
        aria-label={n.pinned ? t.unpin(n.title) : t.pin(n.title)}
        title={n.pinned ? ja.detail.unpin : ja.detail.pin}
      >
        <PinIcon filled={n.pinned} size={16} />
      </button>
    </li>
  );

  const nothingFound = filtering && visible.length === 0;

  return (
    <div className={`sidebar-layer ${overlay ? 'is-overlay' : ''}`}>
      {overlay && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={panelRef}
        id="sidebar"
        className="sidebar"
        aria-label={t.title}
        style={dragX ? { transform: `translateX(${dragX}px)`, transition: 'none' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <header className="sidebar-header">
          <h2 className="sidebar-title">{t.title}</h2>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label={t.close}>
            <CloseIcon />
          </button>
        </header>

        <div className="sidebar-search">
          <input
            className="input"
            type="search"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchAria}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
          />
        </div>

        <div className="sidebar-scroll">
          {notes.length === 0 && <p className="empty-text sidebar-empty">{t.empty}</p>}
          {nothingFound && <p className="empty-text sidebar-empty">{t.noMatch(query.trim())}</p>}

          {pinned.length > 0 && (
            <section className="sidebar-section" aria-label={t.pinnedHeading}>
              <h3 className="sidebar-section-title">
                <PinIcon filled size={14} />
                {t.pinnedHeading}
              </h3>
              <ul className="sidebar-list">{pinned.map(row)}</ul>
            </section>
          )}

          {groups.map((g) => {
            const members = byGroup.get(g.id) ?? [];
            if (filtering && members.length === 0) return null;
            const isCollapsed = collapsed.has(g.id) && !filtering;
            return (
              <section key={g.id} className="sidebar-section sidebar-group" style={{ ['--group-color' as string]: g.color }}>
                <div className="sidebar-group-header">
                  <button
                    type="button"
                    className="sidebar-group-toggle"
                    onClick={() => toggleCollapsed(g.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? t.expand(g.name) : t.collapse(g.name)}
                  >
                    <span className={`sidebar-chevron ${isCollapsed ? '' : 'is-open'}`} aria-hidden="true">
                      <ChevronIcon />
                    </span>
                    <span className="group-dot" aria-hidden="true" />
                    <span className="sidebar-group-name">{g.name}</span>
                    <span className="sidebar-count">{members.length}</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onFocusGroup(g.id)}
                    disabled={members.length === 0}
                    aria-label={t.focusGroup(g.name)}
                    title={t.focusGroup(g.name)}
                  >
                    <TargetIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onEditGroup(g.id)}
                    aria-label={t.editGroup(g.name)}
                    title={t.editGroup(g.name)}
                  >
                    <EditIcon />
                  </button>
                </div>
                {!isCollapsed &&
                  (members.length > 0 ? (
                    <ul className="sidebar-list">{members.map(row)}</ul>
                  ) : (
                    <p className="empty-text sidebar-group-empty">{t.emptyGroup}</p>
                  ))}
              </section>
            );
          })}

          {ungrouped.length > 0 && (
            <section className="sidebar-section" aria-label={t.ungroupedHeading}>
              {groups.length > 0 && <h3 className="sidebar-section-title">{t.ungroupedHeading}</h3>}
              <ul className="sidebar-list">{ungrouped.map(row)}</ul>
            </section>
          )}
        </div>

        <footer className="sidebar-footer">
          <button type="button" className="button button-ghost sidebar-new-group" onClick={onCreateGroup}>
            <PlusIcon />
            {t.newGroup}
          </button>
          <p className="sidebar-hint">{t.swipeHint}</p>
        </footer>
      </aside>
    </div>
  );
}
