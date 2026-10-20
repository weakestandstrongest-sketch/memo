import { forwardRef, useMemo, type ReactNode } from 'react';
import type { CategoryId, Group, Note } from '../domain/types';
import { ja } from '../i18n/ja';
import { dateBucket, formatLongDate, formatRelative, type DateBucket } from '../utils/format';
import { displayTitle, previewText } from '../utils/noteTitle';
import { CategoryFilter } from './CategoryFilter';
import { CloseIcon, EditIcon, LinkIcon, OrbitIcon, PinIcon, PlusIcon, SearchIcon, SmallPlusIcon } from './icons';
import { CategoryIcon } from './universe/CategoryGlyph';

export type NotesOrder = 'recent' | 'groups';

interface NotesViewProps {
  /** Memos that pass the search and the kind filter. */
  notes: Note[];
  totalCount: number;
  groups: Group[];
  linkCounts: Map<string, number>;
  selectedId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  activeCats: Set<CategoryId>;
  categoryCounts: Record<CategoryId, number>;
  onToggleCategory: (id: CategoryId) => void;
  onClearCategories: () => void;
  order: NotesOrder;
  onOrderChange: (order: NotesOrder) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onShowGroupInMap: (id: string) => void;
  onEditGroup: (id: string) => void;
  onCreateGroup: () => void;
  /** The "⋯" menu. */
  menu: ReactNode;
  /** "Now", for dates and "3分前". */
  now: number;
}

const t = ja.notes;
const BUCKETS: DateBucket[] = ['today', 'yesterday', 'week', 'earlier'];
const byRecent = (a: Note, b: Note) => b.updatedAt.localeCompare(a.updatedAt);

/** Home: every memo, newest first (or by group), with search and a big "new memo" card. */
export const NotesView = forwardRef<HTMLInputElement, NotesViewProps>(function NotesView(
  {
    notes,
    totalCount,
    groups,
    linkCounts,
    selectedId,
    query,
    onQueryChange,
    activeCats,
    categoryCounts,
    onToggleCategory,
    onClearCategories,
    order,
    onOrderChange,
    onOpen,
    onCreate,
    onShowGroupInMap,
    onEditGroup,
    onCreateGroup,
    menu,
    now,
  },
  searchRef,
) {
  const filtering = query.trim().length > 0 || activeCats.size > 0;
  const nowDate = new Date(now);

  const sections = useMemo(() => {
    const sorted = [...notes].sort(byRecent);
    if (order === 'groups') {
      const known = new Set(groups.map((g) => g.id));
      return [
        ...groups.map((g) => ({
          key: g.id,
          group: g,
          title: g.name,
          notes: sorted.filter((n) => n.groupId === g.id),
        })),
        {
          key: 'ungrouped',
          group: null,
          title: t.ungrouped,
          notes: sorted.filter((n) => !n.groupId || !known.has(n.groupId)),
        },
      ];
    }
    const pinned = filtering ? [] : sorted.filter((n) => n.pinned);
    const rest = filtering ? sorted : sorted.filter((n) => !n.pinned);
    return [
      { key: 'pinned', group: null, title: t.pinned, notes: pinned },
      ...BUCKETS.map((b) => ({
        key: b,
        group: null,
        title: t.buckets[b],
        notes: rest.filter((n) => dateBucket(n.updatedAt, new Date(now)) === b),
      })),
    ].filter((s) => s.notes.length > 0);
  }, [notes, groups, order, filtering, now]);

  let index = 0; // for the staggered fade-in of rows

  const row = (n: Note) => {
    const links = linkCounts.get(n.id) ?? 0;
    const preview = previewText(n);
    const i = index++;
    return (
      <li key={n.id} style={{ ['--i' as string]: Math.min(i, 12) }}>
        <button
          type="button"
          className={`note-row ${n.id === selectedId ? 'is-selected' : ''}`}
          onClick={() => onOpen(n.id)}
          aria-current={n.id === selectedId ? 'true' : undefined}
        >
          <span className="note-row-glyph" aria-hidden="true">
            <CategoryIcon category={n.category} size={16} />
          </span>
          <span className="note-row-text">
            <span className={`note-row-title ${n.title.trim() ? '' : 'is-untitled'}`}>{displayTitle(n)}</span>
            {preview && <span className="note-row-preview">{preview}</span>}
          </span>
          <span className="note-row-meta">
            <span className="note-row-time">{formatRelative(n.updatedAt, nowDate)}</span>
            <span className="note-row-icons">
              {n.pinned && (
                <span className="note-row-pin" aria-label={ja.notes.pinned}>
                  <PinIcon filled size={12} />
                </span>
              )}
              {links > 0 && (
                <span className="note-row-links" aria-label={t.links(links)}>
                  <LinkIcon />
                  {links}
                </span>
              )}
            </span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="notes-view" aria-label={t.heading}>
      <div className="notes-inner">
        <header className="notes-head">
          <div className="notes-head-row">
            <span className="wordmark">{ja.app.name}</span>
            {menu}
          </div>
          <h1 className="notes-title">
            {t.heading}
            <span className="notes-count">{t.count(totalCount)}</span>
          </h1>
          <p className="notes-date">{formatLongDate(nowDate)}</p>
        </header>

        <button type="button" className="quick-card" onClick={onCreate}>
          <span className="quick-card-text">
            <span className="quick-card-title">{t.quickTitle}</span>
            <span className="quick-card-sub">{t.quickText}</span>
          </span>
          <span className="quick-card-plus" aria-hidden="true">
            <PlusIcon />
          </span>
        </button>

        <label className="notes-search">
          <SearchIcon />
          <input
            ref={searchRef}
            type="search"
            className="notes-search-input"
            value={query}
            placeholder={ja.search.placeholder}
            aria-label={ja.search.ariaLabel}
            enterKeyHint="search"
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (query) onQueryChange('');
                else e.currentTarget.blur();
              }
            }}
          />
          {query && (
            <button type="button" className="icon-button notes-search-clear" onClick={() => onQueryChange('')} aria-label={ja.search.clear}>
              <CloseIcon />
            </button>
          )}
        </label>

        <div className="notes-tools">
          <CategoryFilter
            variant="chips"
            active={activeCats}
            counts={categoryCounts}
            onToggle={onToggleCategory}
            onClear={onClearCategories}
          />
          <div className="segmented" role="radiogroup" aria-label={t.viewLabel}>
            {(['recent', 'groups'] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={order === o}
                className={`segmented-option ${order === o ? 'is-on' : ''}`}
                onClick={() => onOrderChange(o)}
              >
                {o === 'recent' ? t.viewRecent : t.viewGroups}
              </button>
            ))}
          </div>
        </div>

        {totalCount === 0 ? (
          <div className="notes-empty">
            <p>{t.empty}</p>
            <button type="button" className="button button-primary" onClick={onCreate}>
              <SmallPlusIcon />
              {t.emptyAction}
            </button>
          </div>
        ) : notes.length === 0 && order === 'recent' ? (
          <p className="notes-empty-text">{query.trim() ? t.noMatch(query.trim()) : t.noMatchFiltered}</p>
        ) : (
          <div className="notes-sections">
            {sections.map((s) => (
              <section key={s.key} className="notes-section" aria-label={s.title}>
                <div className="notes-section-head">
                  <h2 className="section-title">
                    {s.title}
                    {s.group && <span className="count">{s.notes.length}</span>}
                  </h2>
                  {s.group && (
                    <div className="notes-section-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onShowGroupInMap(s.group!.id)}
                        aria-label={t.showGroupInMap(s.group.name)}
                        title={t.showGroupInMap(s.group.name)}
                      >
                        <OrbitIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEditGroup(s.group!.id)}
                        aria-label={t.editGroup(s.group.name)}
                        title={t.editGroup(s.group.name)}
                      >
                        <EditIcon />
                      </button>
                    </div>
                  )}
                </div>
                {s.notes.length > 0 ? (
                  <ul className="note-list">{s.notes.map(row)}</ul>
                ) : (
                  <p className="notes-empty-text">{s.group ? t.emptyGroup : t.noMatchFiltered}</p>
                )}
              </section>
            ))}
            {order === 'groups' && (
              <button type="button" className="button button-ghost notes-new-group" onClick={onCreateGroup}>
                <SmallPlusIcon />
                {t.newGroup}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
});
