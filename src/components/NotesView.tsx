import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from 'react';
import { shapeOf } from '../domain/stars';
import type { Group, Note } from '../domain/types';
import { ja } from '../i18n/ja';
import { dateBucket, formatLongDate, formatRelative, type DateBucket } from '../utils/format';
import { displayTitle, previewText } from '../utils/noteTitle';
import { GroupFilter, NO_GROUP } from './GroupFilter';
import { HomeIllustration } from './HomeIllustration';
import { ChevronIcon, CloseIcon, EditIcon, LinkIcon, OrbitIcon, PinIcon, SearchIcon, SmallPlusIcon } from './icons';
import { StarIcon } from './universe/StarGlyph';

export type NotesOrder = 'recent' | 'groups';

export interface NotesViewHandle {
  /** Shows the list and puts the cursor in the search field. */
  focusSearch: () => void;
  /** Back to the picture at the top. */
  goHome: () => void;
}

interface NotesViewProps {
  /** Memos that pass the search and the group filter. */
  notes: Note[];
  /** Every memo (for the counts and "つづきを書く"). */
  allNotes: Note[];
  linkTotal: number;
  groups: Group[];
  linkCounts: Map<string, number>;
  selectedId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  activeGroups: Set<string>;
  groupCounts: Map<string, number>;
  onToggleGroup: (id: string) => void;
  onClearGroups: () => void;
  order: NotesOrder;
  onOrderChange: (order: NotesOrder) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onShowMap: () => void;
  onShowGroupInMap: (id: string) => void;
  onEditGroup: (id: string) => void;
  onCreateGroup: () => void;
  /** The "⋯" menu. */
  menu: ReactNode;
  /** "Now", for dates and "3分前". */
  now: number;
  /** Tells whether the black list fills the screen (the tab bar turns dark). */
  onDarkChange?: (dark: boolean) => void;
}

const t = ja.notes;
const BUCKETS: DateBucket[] = ['today', 'yesterday', 'week', 'earlier'];
const byRecent = (a: Note, b: Note) => b.updatedAt.localeCompare(a.updatedAt);

/**
 * Home. The first screen is a picture with a few numbers (like a bank app's wallet);
 * swiping up brings the search and the list of memos, on black.
 */
export const NotesView = forwardRef<NotesViewHandle, NotesViewProps>(function NotesView(
  {
    notes,
    allNotes,
    linkTotal,
    groups,
    linkCounts,
    selectedId,
    query,
    onQueryChange,
    activeGroups,
    groupCounts,
    onToggleGroup,
    onClearGroups,
    order,
    onOrderChange,
    onOpen,
    onCreate,
    onShowMap,
    onShowGroupInMap,
    onEditGroup,
    onCreateGroup,
    menu,
    now,
    onDarkChange,
  },
  ref,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtering = query.trim().length > 0 || activeGroups.size > 0;
  const nowDate = new Date(now);
  const latest = useMemo(
    () => allNotes.reduce<Note | null>((best, n) => (!best || n.updatedAt > best.updatedAt ? n : best), null),
    [allNotes],
  );

  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const showList = () => listRef.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() });

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      listRef.current?.scrollIntoView({ block: 'start' });
      searchRef.current?.focus();
    },
    goHome: () => scrollRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() }),
  }));

  // The tab bar turns dark once the black list covers most of the screen.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !onDarkChange || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => onDarkChange(entry.intersectionRatio < 0.4), {
      root: scrollRef.current,
      threshold: [0, 0.4, 1],
    });
    io.observe(el);
    return () => {
      io.disconnect();
      onDarkChange(false);
    };
  }, [onDarkChange]);

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
          key: NO_GROUP,
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
            <StarIcon shape={shapeOf(n)} size={18} />
          </span>
          <span className="note-row-text">
            <span className={`note-row-title ${n.title.trim() ? '' : 'is-untitled'}`}>{displayTitle(n)}</span>
            {preview && <span className="note-row-preview">{preview}</span>}
          </span>
          <span className="note-row-meta">
            <span className="note-row-time">{formatRelative(n.updatedAt, nowDate)}</span>
            <span className="note-row-icons">
              {n.pinned && (
                <span className="note-row-pin" aria-label={t.pinned}>
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
    <div className="notes-view" aria-label={t.heading}>
      <div ref={scrollRef} className="notes-scroll">
        {/* --- First screen: the picture ---------------------------------- */}
        <section ref={heroRef} className="notes-hero" aria-label={ja.app.name}>
          <header className="hero-head">
            <div className="hero-titles">
              <h1 className="hero-title">{ja.app.name}</h1>
              <p className="hero-sub">{t.heroSub}</p>
            </div>
            {menu}
          </header>

          <div className="hero-art">
            <HomeIllustration className="hero-illustration" />
          </div>

          <div className="hero-info">
            <p className="hero-label">{formatLongDate(nowDate)}</p>
            <div className="hero-figures">
              <p className="hero-count">
                {allNotes.length}
                <span className="hero-count-unit">{t.countUnit}</span>
              </p>
              <button type="button" className="hero-box-button" onClick={onShowMap}>
                <OrbitIcon />
                {t.showMap}
              </button>
            </div>
            <p className="hero-links">{t.heroLinks(linkTotal)}</p>
            {latest ? (
              <button type="button" className="hero-continue" onClick={() => onOpen(latest.id)}>
                <span className="hero-continue-text">
                  <span className="hero-continue-label">{t.continue}</span>
                  <span className="hero-continue-title">{displayTitle(latest)}</span>
                </span>
                <ChevronIcon />
              </button>
            ) : (
              <button type="button" className="hero-continue" onClick={onCreate}>
                <span className="hero-continue-text">
                  <span className="hero-continue-title">{t.emptyAction}</span>
                </span>
                <ChevronIcon />
              </button>
            )}
          </div>

          <button type="button" className="hero-reveal" onClick={showList}>
            {t.reveal}
            <span className="hero-reveal-chevron" aria-hidden="true">
              <ChevronIcon />
            </span>
          </button>
        </section>

        {/* --- After swiping up: the memos, on black ------------------------ */}
        <section ref={listRef} className="notes-list-section" aria-label={t.listLabel}>
          <div className="notes-inner">
            <h2 className="notes-title">
              {t.heading}
              <span className="notes-count">{t.count(allNotes.length)}</span>
            </h2>

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
                <button
                  type="button"
                  className="icon-button notes-search-clear"
                  onClick={() => onQueryChange('')}
                  aria-label={ja.search.clear}
                >
                  <CloseIcon />
                </button>
              )}
            </label>

            <div className="notes-tools">
              {groups.length > 0 && (
                <GroupFilter
                  variant="chips"
                  groups={groups}
                  active={activeGroups}
                  counts={groupCounts}
                  onToggle={onToggleGroup}
                  onClear={onClearGroups}
                />
              )}
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

            {allNotes.length === 0 ? (
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
                      <h3 className="section-title">
                        {s.title}
                        {s.group && <span className="count">{s.notes.length}</span>}
                      </h3>
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
      </div>
    </div>
  );
});
