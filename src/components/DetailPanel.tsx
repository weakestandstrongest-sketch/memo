import { forwardRef, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CATEGORIES } from '../domain/categories';
import type { Note } from '../domain/types';
import type { LinkedNote } from '../domain/universe';
import { formatDateTime } from '../utils/format';
import { CloseIcon, EditIcon, LinkIcon, TrashIcon, UnlinkIcon } from './icons';
import { CategoryIcon } from './universe/CategoryGlyph';

interface DetailPanelProps {
  note: Note;
  links: LinkedNote[];
  /** Phone layout: shows as a bottom sheet instead of a side panel. */
  sheet: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: (connectionId: string) => void;
  onOpenNote: (id: string) => void;
}

/** Details of the selected star: a side panel on desktop, a bottom sheet on phones. */
export const DetailPanel = forwardRef<HTMLElement, DetailPanelProps>(function DetailPanel(
  { note, links, sheet, onClose, onEdit, onDelete, onConnect, onDisconnect, onOpenNote },
  ref,
) {
  const category = CATEGORIES[note.category];
  const [expanded, setExpanded] = useState(false);
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

  const classes = ['detail-panel', sheet ? 'is-sheet' : 'is-side', expanded && 'is-expanded'].filter(Boolean).join(' ');

  return (
    <aside
      ref={ref}
      className={classes}
      aria-label={`Star details: ${note.title}`}
      style={{
        ['--cat-color' as string]: category.color,
        ...(dragOffset ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : {}),
      }}
    >
      {sheet && (
        <button
          type="button"
          className="sheet-handle"
          aria-label={expanded ? 'Show less' : 'Show more'}
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span />
        </button>
      )}

      <header className="detail-header">
        <span className="category-badge">
          <CategoryIcon category={note.category} size={16} />
          {category.label}
        </span>
        {note.sample && <span className="badge badge-muted">Sample</span>}
        <button type="button" className="icon-button detail-close" onClick={onClose} aria-label="Close details">
          <CloseIcon />
        </button>
      </header>

      <div className="detail-scroll">
        <h2 className="detail-title">{note.title}</h2>
        <p className="detail-meta">
          <time dateTime={note.createdAt}>Created {formatDateTime(note.createdAt)}</time>
          {note.updatedAt !== note.createdAt && (
            <>
              <br />
              <time dateTime={note.updatedAt}>Edited {formatDateTime(note.updatedAt)}</time>
            </>
          )}
        </p>

        {note.body ? (
          <div className="detail-body">{note.body}</div>
        ) : (
          <p className="detail-body is-empty">No note text yet.</p>
        )}

        <section className="detail-links" aria-labelledby="links-heading">
          <h3 id="links-heading" className="section-title">
            Connected stars <span className="count">{links.length}</span>
          </h3>
          {links.length === 0 ? (
            <p className="empty-text">Not connected yet. Link it to a related idea.</p>
          ) : (
            <ul className="link-list">
              {links.map(({ connection, note: other }) => (
                <li key={connection.id} className="link-item">
                  <button type="button" className="link-open" onClick={() => onOpenNote(other.id)}>
                    <CategoryIcon category={other.category} size={18} />
                    <span className="link-title">{other.title}</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button link-remove"
                    onClick={() => onDisconnect(connection.id)}
                    aria-label={`Remove connection to ${other.title}`}
                    title="Remove connection"
                  >
                    <UnlinkIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="detail-actions">
        <button type="button" className="button button-primary" onClick={onConnect}>
          <LinkIcon />
          Connect star
        </button>
        <button type="button" className="button button-ghost" onClick={onEdit}>
          <EditIcon />
          Edit
        </button>
        <button type="button" className="button button-ghost button-danger-text" onClick={onDelete} aria-label="Delete star">
          <TrashIcon />
          <span className="hide-narrow">Delete</span>
        </button>
      </footer>
    </aside>
  );
});
