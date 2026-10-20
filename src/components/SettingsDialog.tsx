import { useEffect, useState } from 'react';
import { ja } from '../i18n/ja';
import { createSalt, hashPasscode, PASSCODE_MAX, PASSCODE_MIN, verifyPasscode } from '../security/passcode';
import {
  AUTO_LOCK_OPTIONS,
  BACKUP_INTERVAL_OPTIONS,
  updateSettings,
  useSettings,
  type Settings,
} from '../storage/settings';
import { formatDateTime } from '../utils/format';
import { Modal } from './Modal';
import { PinPad } from './PinPad';

type View = 'main' | 'set' | 'change' | 'disable';

interface SettingsDialogProps {
  onClose: () => void;
  onExport: () => void;
  onToast: (text: string, tone?: 'info' | 'error') => void;
}

const t = ja.settings;

export function SettingsDialog({ onClose, onExport, onToast }: SettingsDialogProps) {
  const settings = useSettings();
  const [view, setView] = useState<View>('main');

  const save = (change: (s: Settings) => Settings, success?: string) => {
    if (updateSettings(change)) {
      if (success) onToast(success);
    } else {
      onToast(t.saveFailed, 'error');
    }
  };

  if (view !== 'main') {
    return (
      <PasscodeFlow
        mode={view}
        onCancel={() => setView('main')}
        onDone={(message) => {
          setView('main');
          onToast(message);
        }}
        onSaveFailed={() => onToast(t.saveFailed, 'error')}
      />
    );
  }

  const { lock, backup } = settings;
  return (
    <Modal
      title={t.title}
      onClose={onClose}
      className="settings-dialog"
      actions={
        <button type="button" className="button button-primary" onClick={onClose}>
          {ja.common.close}
        </button>
      }
    >
      <section className="settings-section" aria-labelledby="settings-lock">
        <div className="settings-heading">
          <h3 id="settings-lock" className="section-title">
            {t.lockHeading}
          </h3>
          <span className={`status-pill ${lock.enabled ? 'is-on' : ''}`}>{lock.enabled ? t.on : t.off}</span>
        </div>
        <p className="settings-text">{lock.enabled ? t.lockOnText : t.lockOffText}</p>
        {lock.enabled ? (
          <>
            <div className="field">
              <label htmlFor="auto-lock" className="field-label">
                {t.autoLockLabel}
              </label>
              <select
                id="auto-lock"
                className="input select"
                value={lock.autoLockMinutes}
                onChange={(e) => {
                  const minutes = Number(e.target.value);
                  save((s) => ({ ...s, lock: { ...s.lock, autoLockMinutes: minutes } }));
                }}
              >
                {AUTO_LOCK_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t.autoLockOption(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-buttons">
              <button type="button" className="button button-ghost" onClick={() => setView('change')}>
                {t.changePasscode}
              </button>
              <button type="button" className="button button-ghost button-danger-text" onClick={() => setView('disable')}>
                {t.disableLock}
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="button button-primary" onClick={() => setView('set')}>
            {t.setPasscode}
          </button>
        )}
        <p className="settings-note">{t.lockLimitNote}</p>
      </section>

      <section className="settings-section" aria-labelledby="settings-backup">
        <h3 id="settings-backup" className="section-title">
          {t.backupHeading}
        </h3>
        <div className="field">
          <label htmlFor="backup-interval" className="field-label">
            {t.backupLabel}
          </label>
          <select
            id="backup-interval"
            className="input select"
            value={backup.intervalDays}
            onChange={(e) => {
              const days = Number(e.target.value);
              save((s) => ({ ...s, backup: { ...s.backup, intervalDays: days, snoozedUntil: null } }));
            }}
          >
            {BACKUP_INTERVAL_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {t.backupOption(d)}
              </option>
            ))}
          </select>
        </div>
        <p className="settings-text">{t.lastBackup(backup.lastBackupAt ? formatDateTime(backup.lastBackupAt) : null)}</p>
        <button type="button" className="button button-ghost" onClick={onExport}>
          {t.exportNow}
        </button>
        <p className="settings-note">{t.backupNote}</p>
      </section>

      <p className="settings-note settings-device-note">{t.deviceNote}</p>
    </Modal>
  );
}

// --- Set / change / turn off the passcode ---------------------------------------------

type Step = 'current' | 'new' | 'confirm';

function PasscodeFlow({
  mode,
  onCancel,
  onDone,
  onSaveFailed,
}: {
  mode: Exclude<View, 'main'>;
  onCancel: () => void;
  onDone: (message: string) => void;
  onSaveFailed: () => void;
}) {
  const p = ja.passcodeSetup;
  const { lock } = useSettings();
  const [step, setStep] = useState<Step>(mode === 'set' ? 'new' : 'current');
  const [value, setValue] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const fail = (message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
    setValue('');
  };

  const submitCurrent = (pin: string) => {
    if (!verifyPasscode(pin, lock.salt, lock.hash)) return fail(p.wrongCurrent);
    setError(null);
    setValue('');
    if (mode === 'disable') {
      const ok = updateSettings((s) => ({ ...s, lock: { ...s.lock, enabled: false, hash: '', salt: '', length: 0 } }));
      if (ok) onDone(ja.toast.lockDisabled);
      else onSaveFailed();
    } else {
      setStep('new');
    }
  };

  const submitNew = () => {
    if (value.length < PASSCODE_MIN) return fail(p.tooShort(PASSCODE_MIN));
    setFirstPin(value);
    setValue('');
    setError(null);
    setStep('confirm');
  };

  const submitConfirm = (pin: string) => {
    if (pin !== firstPin) {
      setFirstPin('');
      setStep('new');
      return fail(p.mismatch);
    }
    const salt = createSalt();
    const ok = updateSettings((s) => ({
      ...s,
      lock: { ...s.lock, enabled: true, hash: hashPasscode(pin, salt), salt, length: pin.length },
    }));
    if (ok) onDone(mode === 'change' ? ja.toast.passcodeChanged : ja.toast.lockEnabled);
    else onSaveFailed();
  };

  // "current" and "confirm" check automatically once enough digits are entered.
  useEffect(() => {
    if (step === 'current' && value.length === lock.length) {
      const t = window.setTimeout(() => submitCurrent(value), 120);
      return () => window.clearTimeout(t);
    }
    if (step === 'confirm' && value.length === firstPin.length) {
      const t = window.setTimeout(() => submitConfirm(value), 120);
      return () => window.clearTimeout(t);
    }
    return undefined;
    // Only re-run when the typed value or the step changes.
  }, [value, step]);

  const title = mode === 'set' ? p.setTitle : mode === 'change' ? p.changeTitle : p.disableTitle;
  const prompt = step === 'current' ? p.enterCurrent : step === 'new' ? p.enterNew(PASSCODE_MIN, PASSCODE_MAX) : p.confirm;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="small"
      dismissOnBackdrop={false}
      className="passcode-dialog"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onCancel}>
            {ja.common.cancel}
          </button>
          {step === 'new' && (
            <button type="button" className="button button-primary" onClick={submitNew} disabled={value.length < PASSCODE_MIN}>
              {p.next}
            </button>
          )}
        </>
      }
    >
      <p className="passcode-prompt">{prompt}</p>
      <PinPad
        value={value}
        onChange={(v) => {
          setValue(v);
          if (error) setError(null);
        }}
        maxLength={step === 'current' ? lock.length : step === 'confirm' ? firstPin.length : PASSCODE_MAX}
        length={step === 'current' ? lock.length : step === 'confirm' ? firstPin.length : undefined}
        onEnter={step === 'new' ? submitNew : undefined}
        shakeKey={shakeKey}
        label={prompt}
      />
      <p className="lock-message" role="alert">
        {error ?? ''}
      </p>
      {mode !== 'disable' && <p className="settings-note">{p.note}</p>}
    </Modal>
  );
}
