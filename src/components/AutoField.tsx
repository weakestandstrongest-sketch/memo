import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { registerPendingEdit } from '../state/pendingEdits';
import { isComposing } from '../utils/ime';

interface AutoFieldProps {
  value: string;
  /** Saves the text (after a short pause in typing, and when the field is left). */
  onSave: (value: string) => void;
  /** Focus moved into / out of the field. */
  onEditingChange?: (editing: boolean) => void;
  /** Enter key: called instead of adding a new line (titles). */
  onEnter?: () => void;
  className: string;
  placeholder: string;
  ariaLabel: string;
  maxLength: number;
  autoFocus?: boolean;
  enterKeyHint?: 'next' | 'done' | 'enter';
}

export interface AutoFieldHandle {
  focus(): void;
}

/** Pause in typing before the text is saved. */
const SAVE_DELAY_MS = 600;
/**
 * Leaving a field can move the panel (the keyboard closes). Reporting it a moment
 * later lets a tap that left the field (e.g. on ×) still land on its button.
 */
const LEAVE_DELAY_MS = 250;

/**
 * A text field that reads like plain text and saves by itself — the title and the
 * body of a memo. A tap puts the cursor right there (and opens the iPhone keyboard
 * straight away). It grows with its text, so the page scrolls instead of the field.
 */
export const AutoField = forwardRef<AutoFieldHandle, AutoFieldProps>(function AutoField(
  { value, onSave, onEditingChange, onEnter, className, placeholder, ariaLabel, maxLength, autoFocus, enterKeyHint },
  ref,
) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const saved = useRef(value);
  const latest = useRef({ draft, onSave, onEditingChange });
  latest.current = { draft, onSave, onEditingChange };
  const saveTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);

  useImperativeHandle(ref, () => ({ focus: () => fieldRef.current?.focus() }), []);

  function flush() {
    window.clearTimeout(saveTimer.current);
    const text = latest.current.draft;
    if (text !== saved.current) {
      saved.current = text;
      latest.current.onSave(text);
    }
  }

  // Text changed elsewhere (another device's backup, …): show it, unless the user is typing.
  useEffect(() => {
    if (!editing && value !== saved.current) {
      saved.current = value;
      setDraft(value);
    }
  }, [value, editing]);

  // Save what was typed when the memo is closed or another one is opened — and let
  // saving to storage (locking, the app going to the background) collect it first.
  useEffect(() => {
    const unregister = registerPendingEdit(flush);
    return () => {
      unregister();
      window.clearTimeout(leaveTimer.current);
      flush();
      if (leaveTimer.current !== undefined) latest.current.onEditingChange?.(false);
    };
  }, []);

  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  return (
    <textarea
      ref={fieldRef}
      className={className}
      value={draft}
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      enterKeyHint={enterKeyHint}
      onFocus={() => {
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = undefined;
        setEditing(true);
        onEditingChange?.(true);
      }}
      onBlur={() => {
        flush();
        setEditing(false);
        leaveTimer.current = window.setTimeout(() => {
          leaveTimer.current = undefined;
          latest.current.onEditingChange?.(false);
        }, LEAVE_DELAY_MS);
      }}
      onChange={(e) => {
        const text = onEnter ? e.target.value.replace(/\n/g, '') : e.target.value;
        setDraft(text);
        window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(flush, SAVE_DELAY_MS);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter && !isComposing(e)) {
          e.preventDefault();
          flush();
          onEnter();
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          e.currentTarget.blur();
        }
      }}
    />
  );
});
