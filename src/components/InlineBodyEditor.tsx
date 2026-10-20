import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LIMITS } from '../domain/universe';
import { ja } from '../i18n/ja';

interface InlineBodyEditorProps {
  body: string;
  /** Saves the text (called while typing, after a short pause, and when editing ends). */
  onSave: (body: string) => void;
  onEditingChange: (editing: boolean) => void;
}

/** Pause in typing before the text is saved. */
const SAVE_DELAY_MS = 600;
/**
 * Leaving writing mode moves the sheet back down. Waiting a moment lets a tap that
 * ended the writing (e.g. on ×) land on the button it started on.
 */
const LEAVE_DELAY_MS = 250;

/**
 * The memo's text in the detail panel. It reads like plain text, but it is a real
 * text field: a tap puts the cursor right there (and opens the iPhone keyboard
 * straight away, which a "tap → then show a field" approach can't do on iOS).
 * Changes save by themselves.
 */
export function InlineBodyEditor({ body, onSave, onEditingChange }: InlineBodyEditorProps) {
  const t = ja.detail;
  const [draft, setDraft] = useState(body);
  const [editing, setEditing] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const saved = useRef(body);
  const latest = useRef({ draft, onSave });
  latest.current = { draft, onSave };
  const timer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);

  function flush() {
    window.clearTimeout(timer.current);
    const text = latest.current.draft;
    if (text !== saved.current) {
      saved.current = text;
      latest.current.onSave(text);
    }
  }

  // Text changed elsewhere (the edit dialog, an import…): show it, unless the user is typing.
  useEffect(() => {
    if (!editing && body !== saved.current) {
      saved.current = body;
      setDraft(body);
    }
  }, [body, editing]);

  // Save what was typed when the panel closes or another star is opened.
  useEffect(
    () => () => {
      window.clearTimeout(leaveTimer.current);
      flush();
    },
    [],
  );

  // Grow with the text, so the panel scrolls instead of the field.
  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, editing]);

  const setEditingState = (on: boolean) => {
    setEditing(on);
    onEditingChange(on);
  };

  return (
    <div className={`body-editor ${editing ? 'is-editing' : ''}`}>
      {editing && (
        <div className="body-editor-bar">
          <span className="body-editor-note">{t.autosave}</span>
          <button
            type="button"
            className="button button-small button-primary"
            // Keep the field focused until the click, so the bar doesn't vanish under the finger.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => fieldRef.current?.blur()}
          >
            {t.doneEditing}
          </button>
        </div>
      )}
      <textarea
        ref={fieldRef}
        className="detail-body body-editor-field"
        value={draft}
        rows={1}
        maxLength={LIMITS.body}
        placeholder={t.tapToWrite}
        aria-label={t.bodyLabel}
        onFocus={() => {
          window.clearTimeout(leaveTimer.current);
          setEditingState(true);
        }}
        onBlur={() => {
          flush();
          leaveTimer.current = window.setTimeout(() => setEditingState(false), LEAVE_DELAY_MS);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
