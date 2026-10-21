import { forwardRef, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { shapeOf, STAR_SHAPES } from '../domain/stars';
import type { Group, Note } from '../domain/types';
import { LIMITS, type LinkedNote, type NewNoteInput } from '../domain/universe';
import { ja } from '../i18n/ja';
import { formatDateTime, formatRelative } from '../utils/format';
import { displayTitle } from '../utils/noteTitle';
import { AutoField, type AutoFieldHandle } from './AutoField';
import { BackIcon, ChevronIcon, CloseIcon, OrbitIcon, PinIcon, SmallPlusIcon, TrashIcon, UnlinkIcon } from './icons';
import { StarIcon } from './universe/StarGlyph';

export type NotePageVariant =
  /** From the memo list: full screen on phones, the right-hand pane on wide screens. */
  | 'page'
  /** From the map on phones: a sheet over the bottom of the map. */
  | 'sheet'
  /** From the map on wide screens: a panel on the right. */
  | 'side';

/** Value of the group <select> that starts a new group. */
const NEW_GROUP = '__new__';

interface NotePageProps {
  note: Note;
  links: LinkedNote[];
  groups: Group[];
  variant: NotePageVariant;
  /** Just made with ＋: put the cursor in the title. */
  autoFocusTitle: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<NewNoteInput>) => void;
  onNewGroup: () => void;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: (connectionId: string) => void;
  onOpenNote: (id: string) => void;
  onTogglePin: () => void;
  /** Only in the list: show this memo in the map. */
  onShowInMap?: () => void;
}

/**
 * One memo, as a page: a big title, a few properties (kind, group, dates), the text,
 * and the memos it is connected to. Everything is edited in place and saves itself.
 */
export const NotePage = forwardRef<HTMLElement, NotePageProps>(function NotePage(
  {
    note,
    links,
    groups,
    variant,
    autoFocusTitle,
    onClose,
    onUpdate,
    onNewGroup,
    onDelete,
    onConnect,
    onDisconnect,
    onOpenNote,
    onTogglePin,
    onShowInMap,
  },
  ref,
) {
  const t = ja.note;
  const pageRef = useRef<HTMLElement | null>(null);
  const bodyRef = useRef<AutoFieldHandle>(null);
  const [expanded, setExpanded] = useState(false);
  /** A field has the cursor: on phones the page then fills the space above the keyboard. */
  const [writing, setWriting] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const shape = shapeOf(note);
  const [openLinks, setOpenLinks] = useState<Set<string>>(() => new Set());
  const lastOpened = useRef<string | null>(null);

  const setRefs = (el: HTMLElement | null) => {
    pageRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  // Several fields report focus in and out; the page is "writing" while any of them has it.
  const onEditingChange = (on: boolean) =>
    setWriting(on || Boolean(pageRef.current?.contains(document.activeElement) && document.activeElement?.tagName === 'TEXTAREA'));

  const toggleLink = (id: string) =>
    setOpenLinks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        lastOpened.current = id;
      }
      return next;
    });

  // Bring a newly expanded memo into view (it may open below the visible part).
  useEffect(() => {
    const id = lastOpened.current;
    if (!id) return;
    lastOpened.current = null;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    pageRef.current
      ?.querySelector(`[data-linked-note="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [openLinks]);

  // --- Sheet handle: tap to expand/collapse, swipe down to close ---
  const drag = useRef<{ startY: number; dy: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const onHandleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    drag.current.dy = e.clientY - drag.current.startY;
    setDragOffset(Math.max(0, drag.current.dy));
  };
  const onHandleUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragOffset(0);
    if (!d) return;
    if (Math.abs(d.dy) < 6) setExpanded((v) => !v);
    else if (d.dy > 70) {
      if (expanded) setExpanded(false);
      else onClose();
    } else if (d.dy < -40) setExpanded(true);
  };

  const groupExists = Boolean(note.groupId && groups.some((g) => g.id === note.groupId));
  const classes = ['note-page', `is-${variant}`, expanded && 'is-expanded', writing && 'is-writing']
    .filter(Boolean)
    .join(' ');

  return (
    <article
      ref={setRefs}
      className={classes}
      aria-label={t.ariaLabel(displayTitle(note))}
      style={dragOffset ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
    >
      {variant === 'sheet' && (
        <button
          type="button"
          className="sheet-handle"
          aria-label={expanded ? t.sheetCollapse : t.sheetExpand}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span />
        </button>
      )}

      <header className="note-bar">
        <button
          type="button"
          className="icon-button note-close"
          onClick={onClose}
          aria-label={variant === 'page' ? t.back : t.close}
          title={variant === 'page' ? t.back : t.close}
        >
          {variant === 'page' ? <BackIcon /> : <CloseIcon />}
        </button>
        <div className="note-bar-actions">
          {writing ? (
            <button
              type="button"
              className="button button-small button-primary note-done"
              // Keep the cursor until the click, so the button doesn't move under the finger.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
            >
              {t.doneEditing}
            </button>
          ) : (
            <>
              {onShowInMap && (
                <button type="button" className="icon-button" onClick={onShowInMap} aria-label={t.showInMap} title={t.showInMap}>
                  <OrbitIcon />
                </button>
              )}
              <button
                type="button"
                className={`icon-button note-pin ${note.pinned ? 'is-pinned' : ''}`}
                onClick={onTogglePin}
                aria-pressed={Boolean(note.pinned)}
                aria-label={note.pinned ? t.unpin : t.pin}
                title={note.pinned ? t.unpin : t.pin}
              >
                <PinIcon filled={note.pinned} />
              </button>
              <button type="button" className="icon-button" onClick={onDelete} aria-label={t.deleteAria} title={t.deleteAria}>
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="note-scroll">
        <div className="note-inner">
          <AutoField
            className="note-title"
            value={note.title}
            onSave={(title) => onUpdate({ title })}
            onEditingChange={onEditingChange}
            onEnter={() => bodyRef.current?.focus()}
            placeholder={t.titlePlaceholder}
            ariaLabel={t.titleLabel}
            maxLength={LIMITS.title}
            autoFocus={autoFocusTitle}
            enterKeyHint="next"
          />

          <dl className="note-props">
            <div className="note-prop note-prop-shape">
              <dt>{t.shape}</dt>
              <dd>
                <button
                  type="button"
                  className={`shape-current ${shapesOpen ? 'is-open' : ''}`}
                  onClick={() => setShapesOpen((v) => !v)}
                  aria-expanded={shapesOpen}
                  aria-controls={`shapes-${note.id}`}
                  aria-label={shapesOpen ? t.shapeDone : `${t.shapeChange}（${ja.stars[shape]}）`}
                >
                  <StarIcon shape={shape} size={20} />
                  <span>{ja.stars[shape]}</span>
                </button>
              </dd>
            </div>
            {shapesOpen && (
              <div id={`shapes-${note.id}`} className="shape-picker" role="radiogroup" aria-label={t.shape}>
                {STAR_SHAPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={shape === s}
                    aria-label={ja.stars[s]}
                    title={ja.stars[s]}
                    className={`shape-option ${shape === s ? 'is-on' : ''}`}
                    onClick={() => onUpdate({ star: s })}
                  >
                    <StarIcon shape={s} size={22} />
                  </button>
                ))}
              </div>
            )}
            <div className="note-prop">
              <dt>
                <label htmlFor="note-group">{t.group}</label>
              </dt>
              <dd>
                <select
                  id="note-group"
                  className="prop-select"
                  value={groupExists ? note.groupId : ''}
                  onChange={(e) => {
                    if (e.target.value === NEW_GROUP) onNewGroup();
                    else onUpdate({ groupId: e.target.value || null });
                  }}
                >
                  <option value="">{t.noGroup}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                  <option value={NEW_GROUP}>{t.newGroupOption}</option>
                </select>
              </dd>
            </div>
            <div className="note-prop note-prop-dates">
              <dt>{t.updated}</dt>
              <dd>
                <time dateTime={note.updatedAt} title={formatDateTime(note.updatedAt)}>
                  {formatRelative(note.updatedAt)}
                </time>
                <span className="note-created">
                  {t.created} <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
                </span>
                {note.sample && <span className="badge">{t.sample}</span>}
              </dd>
            </div>
          </dl>

          <AutoField
            ref={bodyRef}
            className="note-body"
            value={note.body}
            onSave={(body) => onUpdate({ body })}
            onEditingChange={onEditingChange}
            placeholder={t.bodyPlaceholder}
            ariaLabel={t.bodyLabel}
            maxLength={LIMITS.body}
          />

          <section className="note-links" aria-labelledby={`links-${note.id}`}>
            <div className="note-links-head">
              <h3 id={`links-${note.id}`} className="section-title">
                {t.linksHeading} <span className="count">{links.length}</span>
              </h3>
              <button type="button" className="button button-small" onClick={onConnect} aria-label={t.connectAria}>
                <SmallPlusIcon />
                {t.connect}
              </button>
            </div>
            {links.length === 0 ? (
              <p className="empty-text">{t.noLinks}</p>
            ) : (
              <ul className="link-list">
                {links.map(({ connection, note: other }) => {
                  const isOpen = openLinks.has(other.id);
                  const panelId = `linked-memo-${connection.id}`;
                  const title = displayTitle(other);
                  return (
                    <li key={connection.id} className={`link-item ${isOpen ? 'is-open' : ''}`} data-linked-note={other.id}>
                      <div className="link-row">
                        <button
                          type="button"
                          className="link-open"
                          onClick={() => toggleLink(other.id)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          aria-label={isOpen ? t.hideLinkedMemo(title) : t.showLinkedMemo(title)}
                        >
                          <StarIcon shape={shapeOf(other)} size={16} />
                          <span className="link-title">{title}</span>
                          <span className="link-chevron" aria-hidden="true">
                            <ChevronIcon />
                          </span>
                        </button>
                        <button
                          type="button"
                          className="icon-button link-remove"
                          onClick={() => onDisconnect(connection.id)}
                          aria-label={t.removeLink(title)}
                          title={t.removeLinkTooltip}
                        >
                          <UnlinkIcon />
                        </button>
                      </div>
                      {isOpen && (
                        <div id={panelId} className="linked-memo">
                          {other.body ? (
                            <div className="linked-memo-body">{other.body}</div>
                          ) : (
                            <p className="linked-memo-body is-empty">{t.linkedEmptyBody}</p>
                          )}
                          <button type="button" className="button button-small linked-memo-open" onClick={() => onOpenNote(other.id)}>
                            {t.openLinked}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

        </div>
      </div>
    </article>
  );
});
