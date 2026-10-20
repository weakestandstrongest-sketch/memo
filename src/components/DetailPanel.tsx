import { forwardRef, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ja } from '../i18n/ja';
import { CATEGORIES } from '../domain/categories';
import type { Group, Note } from '../domain/types';
import type { LinkedNote } from '../domain/universe';
import { formatDateTime } from '../utils/format';
import { ChevronIcon, CloseIcon, EditIcon, LinkIcon, PinIcon, TargetIcon, TrashIcon, UnlinkIcon } from './icons';
import { InlineBodyEditor } from './InlineBodyEditor';
import { CategoryIcon } from './universe/CategoryGlyph';

interface DetailPanelProps {
  note: Note;
  links: LinkedNote[];
  /** The group (galaxy) this note belongs to, if any. */
  group: Group | null;
  /** Phone layout: shows as a bottom sheet instead of a side panel. */
  sheet: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: (connectionId: string) => void;
  onOpenNote: (id: string) => void;
  onTogglePin: () => void;
  /** Saves text typed straight into the memo. */
  onSaveBody: (body: string) => void;
}

/** Details of the selected star: a side panel on desktop, a bottom sheet on phones. */
export const DetailPanel = forwardRef<HTMLElement, DetailPanelProps>(function DetailPanel(
  { note, links, group, sheet, onClose, onEdit, onDelete, onConnect, onDisconnect, onOpenNote, onTogglePin, onSaveBody },
  ref,
) {
  const category = CATEGORIES[note.category];
  const [expanded, setExpanded] = useState(false);
  /** Typing into the memo: on phones the sheet then fills the space above the keyboard. */
  const [writing, setWriting] = useState(false);
  // Connected stars whose memo is shown inline (several can be open at once).
  const [openLinks, setOpenLinks] = useState<Set<string>>(() => new Set());
  const lastOpened = useRef<string | null>(null);
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

  // Bring a newly expanded memo into view (it may open below the visible part of the sheet).
  useEffect(() => {
    const id = lastOpened.current;
    if (!id) return;
    lastOpened.current = null;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document
      .querySelector(`[data-linked-note="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [openLinks]);
  const drag = useRef<{ startY: number; dy: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // --- Bottom-sheet handle: tap to expand/collapse, swipe down to close ---
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

  const classes = ['detail-panel', sheet ? 'is-sheet' : 'is-side', expanded && 'is-expanded', writing && 'is-writing']
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      ref={ref}
      className={classes}
      aria-label={ja.detail.ariaLabel(note.title)}
      style={{
        ['--cat-color' as string]: category.color,
        ...(dragOffset ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : {}),
      }}
    >
      {sheet && (
        <button
          type="button"
          className="sheet-handle"
          aria-label={expanded ? ja.detail.sheetCollapse : ja.detail.sheetExpand}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span />
        </button>
      )}

      <div className="detail-scroll">
        <header className="detail-hero">
          <span className="detail-orb" aria-hidden="true">
            <CategoryIcon category={note.category} size={34} />
          </span>
          <div className="detail-hero-text">
            <h2 className="detail-title">{note.title}</h2>
            <div className="detail-chips">
              <span className="category-badge">
                <span className="category-dot" aria-hidden="true" />
                {category.label}
              </span>
              {group && (
                <span className="group-badge" style={{ ['--group-color' as string]: group.color }}>
                  <span className="group-dot" aria-hidden="true" />
                  {group.name}
                </span>
              )}
              {note.sample && <span className="badge badge-muted">{ja.detail.sample}</span>}
            </div>
          </div>
          <button type="button" className="icon-button detail-close" onClick={onClose} aria-label={ja.detail.close}>
            <CloseIcon />
          </button>
        </header>

        <p className="detail-meta">
          <time dateTime={note.createdAt}>{ja.detail.created(formatDateTime(note.createdAt))}</time>
          {note.updatedAt !== note.createdAt && (
            <>
              <span aria-hidden="true"> ・ </span>
              <time dateTime={note.updatedAt}>{ja.detail.edited(formatDateTime(note.updatedAt))}</time>
            </>
          )}
        </p>

        <InlineBodyEditor body={note.body} onSave={onSaveBody} onEditingChange={setWriting} />

        <section className="detail-links" aria-labelledby="links-heading">
          <h3 id="links-heading" className="section-title">
            {ja.detail.linksHeading} <span className="count">{links.length}</span>
          </h3>
          {links.length === 0 ? (
            <p className="empty-text">{ja.detail.noLinks}</p>
          ) : (
            <ul className="link-list">
              {links.map(({ connection, note: other }) => {
                const isOpen = openLinks.has(other.id);
                const panelId = `linked-memo-${connection.id}`;
                return (
                  <li key={connection.id} className={`link-item ${isOpen ? 'is-open' : ''}`} data-linked-note={other.id}>
                    <div className="link-row">
                      <button
                        type="button"
                        className="link-open"
                        onClick={() => toggleLink(other.id)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={isOpen ? ja.detail.hideLinkedMemo(other.title) : ja.detail.showLinkedMemo(other.title)}
                      >
                        <CategoryIcon category={other.category} size={18} />
                        <span className="link-title">{other.title}</span>
                        <span className="link-chevron" aria-hidden="true">
                          <ChevronIcon />
                        </span>
                      </button>
                      <button
                        type="button"
                        className="icon-button link-remove"
                        onClick={() => onDisconnect(connection.id)}
                        aria-label={ja.detail.removeLink(other.title)}
                        title={ja.detail.removeLinkTooltip}
                      >
                        <UnlinkIcon />
                      </button>
                    </div>
                    {isOpen && (
                      <div id={panelId} className="linked-memo">
                        <p className="linked-memo-meta">
                          {CATEGORIES[other.category].label} ・ {ja.detail.created(formatDateTime(other.createdAt))}
                        </p>
                        {other.body ? (
                          <div className="linked-memo-body">{other.body}</div>
                        ) : (
                          <p className="linked-memo-body is-empty">{ja.detail.linkedEmptyBody}</p>
                        )}
                        <button type="button" className="button button-small linked-memo-open" onClick={() => onOpenNote(other.id)}>
                          <TargetIcon />
                          {ja.detail.openStar}
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

      <footer className="detail-actions">
        <button type="button" className="button button-primary" onClick={onConnect}>
          <LinkIcon />
          {ja.detail.connect}
        </button>
        <button type="button" className="round-button" onClick={onEdit} aria-label={ja.detail.edit} title={ja.detail.edit}>
          <EditIcon />
        </button>
        <button
          type="button"
          className={`round-button detail-pin ${note.pinned ? 'is-pinned' : ''}`}
          onClick={onTogglePin}
          aria-pressed={Boolean(note.pinned)}
          aria-label={note.pinned ? ja.detail.unpin : ja.detail.pin}
          title={note.pinned ? ja.detail.unpin : ja.detail.pin}
        >
          <PinIcon filled={note.pinned} />
        </button>
        <button
          type="button"
          className="round-button is-danger"
          onClick={onDelete}
          aria-label={ja.detail.deleteAria}
          title={ja.detail.deleteAria}
        >
          <TrashIcon />
        </button>
      </footer>
    </aside>
  );
});
