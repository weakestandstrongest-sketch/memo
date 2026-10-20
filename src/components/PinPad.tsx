import { useEffect, useRef, type ReactNode } from 'react';
import { ja } from '../i18n/ja';

interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  /** Fixed number of dots (lock screen). Otherwise the dots grow as you type. */
  length?: number;
  /** Called on the keyboard Enter key. */
  onEnter?: () => void;
  disabled?: boolean;
  /** Change this number to play the "wrong passcode" shake. */
  shakeKey?: number;
  /** Extra button in the bottom-left corner of the keypad (e.g. "forgot"). */
  cornerAction?: ReactNode;
  label: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** iPhone-style passcode keypad: dots plus big number buttons (also works with a keyboard). */
export function PinPad({
  value,
  onChange,
  maxLength,
  length,
  onEnter,
  disabled,
  shakeKey = 0,
  cornerAction,
  label,
}: PinPadProps) {
  const latest = useRef({ value, onChange, onEnter, disabled, maxLength });
  latest.current = { value, onChange, onEnter, disabled, maxLength };

  const press = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  };
  const backspace = () => {
    if (!disabled) onChange(value.slice(0, -1));
  };

  // Hardware keyboard: digits, Backspace, Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest?.('input, textarea, select')) return;
      const s = latest.current;
      if (s.disabled) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (s.value.length < s.maxLength) s.onChange(s.value + e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        s.onChange(s.value.slice(0, -1));
      } else if (e.key === 'Enter' && s.onEnter) {
        e.preventDefault();
        s.onEnter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dots = length ?? Math.max(4, value.length);

  return (
    <div className="pinpad" role="group" aria-label={label}>
      <div key={shakeKey} className={`pin-dots ${shakeKey ? 'is-shaking' : ''}`} aria-live="polite" aria-label={`${value.length} / ${dots}`}>
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className={`pin-dot ${i < value.length ? 'is-filled' : ''}`} />
        ))}
      </div>
      <div className="pin-keys">
        {KEYS.map((k) => (
          <button key={k} type="button" className="pin-key" onClick={() => press(k)} disabled={disabled}>
            {k}
          </button>
        ))}
        <div className="pin-corner">{cornerAction}</div>
        <button type="button" className="pin-key" onClick={() => press('0')} disabled={disabled}>
          0
        </button>
        <button
          type="button"
          className="pin-key pin-key-back"
          onClick={backspace}
          disabled={disabled || value.length === 0}
          aria-label={ja.lock.backspace}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5h11v14H9l-6-7 6-7z" />
            <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
