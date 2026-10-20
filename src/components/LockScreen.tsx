import { useEffect, useState } from 'react';
import { AppMark } from './AppMark';
import { ja } from '../i18n/ja';
import { verifyPasscode } from '../security/passcode';
import { readPref, writePref } from '../storage/preferences';
import { eraseAllLocalData, useSettings } from '../storage/settings';
import { Modal } from './Modal';
import { PinPad } from './PinPad';
import { Twinkles } from './universe/StarField';

/** After this many wrong tries, entering is paused for a while (longer each time). */
const TRIES_BEFORE_PAUSE = 5;
const PAUSE_SECONDS = 30;

function readNumberPref(name: string): number {
  const n = Number(readPref(name));
  return Number.isFinite(n) ? n : 0;
}

/** Full-screen lock. The notes are not rendered at all while it is shown. */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { lock } = useSettings();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [failures, setFailures] = useState(() => readNumberPref('lock-failures'));
  // Stored, so reloading the page doesn't skip the pause.
  const [pausedUntil, setPausedUntil] = useState(() => readNumberPref('lock-paused-until'));
  const [now, setNow] = useState(() => Date.now());
  const [forgotOpen, setForgotOpen] = useState(false);

  const secondsLeft = Math.max(0, Math.ceil((pausedUntil - now) / 1000));
  const paused = secondsLeft > 0;

  useEffect(() => {
    if (!paused) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [paused]);

  // Check automatically once all digits are entered.
  useEffect(() => {
    if (value.length < lock.length) return;
    const t = window.setTimeout(() => {
      if (verifyPasscode(value, lock.salt, lock.hash)) {
        writePref('lock-failures', '0');
        onUnlock();
        return;
      }
      const nextFailures = failures + 1;
      setFailures(nextFailures);
      writePref('lock-failures', String(nextFailures));
      if (nextFailures % TRIES_BEFORE_PAUSE === 0) {
        const until = Date.now() + PAUSE_SECONDS * 1000 * (nextFailures / TRIES_BEFORE_PAUSE);
        setPausedUntil(until);
        setNow(Date.now());
        writePref('lock-paused-until', String(until));
      }
      setError(ja.lock.wrong);
      setShakeKey((k) => k + 1);
      setValue('');
    }, 120); // let the last dot appear first
    return () => window.clearTimeout(t);
  }, [value, lock, failures, onUnlock]);

  return (
    <main className="lock-screen" aria-label={ja.lock.screenLabel}>
      <Twinkles />
      <div className="lock-content">
        <AppMark className="lock-logo" size={72} />
        <h1 className="lock-app-name">{ja.app.name}</h1>
        <p className="lock-title">{ja.lock.title}</p>

        <PinPad
          value={value}
          onChange={(v) => {
            setValue(v);
            if (error) setError(null);
          }}
          maxLength={lock.length}
          length={lock.length}
          disabled={paused}
          shakeKey={shakeKey}
          label={ja.lock.title}
          cornerAction={
            <button type="button" className="pin-forgot" onClick={() => setForgotOpen(true)}>
              {ja.lock.forgot}
            </button>
          }
        />

        <p className="lock-message" role="alert">
          {paused ? ja.lock.cooldown(secondsLeft) : (error ?? '')}
        </p>
        <p className="lock-hint">{ja.lock.keyboardHint}</p>
      </div>

      {forgotOpen && <ForgotDialog onClose={() => setForgotOpen(false)} />}
    </main>
  );
}

/** "Forgot passcode": the only way out is erasing this browser's data (no server, no recovery). */
function ForgotDialog({ onClose }: { onClose: () => void }) {
  const t = ja.forgotDialog;
  const [typed, setTyped] = useState('');
  const confirmed = typed.trim() === t.confirmWord;
  return (
    <Modal
      title={t.title}
      onClose={onClose}
      size="small"
      role="alertdialog"
      className="forgot-dialog"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onClose}>
            {ja.common.cancel}
          </button>
          <button
            type="button"
            className="button button-danger"
            disabled={!confirmed}
            onClick={() => {
              eraseAllLocalData();
              window.location.reload();
            }}
          >
            {t.confirm}
          </button>
        </>
      }
    >
      <p className="confirm-message">{t.text}</p>
      <p className="confirm-message forgot-backup">{t.backupText}</p>
      <label className="field-label" htmlFor="forgot-confirm">
        {t.typeLabel}
      </label>
      <input
        id="forgot-confirm"
        className="input"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        placeholder={t.confirmWord}
      />
    </Modal>
  );
}
