import { ja } from '../i18n/ja';

interface BackupReminderProps {
  /** Days since the last backup; null = never backed up. */
  days: number | null;
  onExport: () => void;
  onLater: () => void;
}

/** In-app reminder to export a backup (shown when the chosen interval has passed). */
export function BackupReminder({ days, onExport, onLater }: BackupReminderProps) {
  const t = ja.reminder;
  return (
    <aside className="reminder glass" role="status" aria-label={t.label}>
      <div className="reminder-text">
        <strong>{days === null ? t.never : t.due(days)}</strong>
        <span>{t.text}</span>
      </div>
      <div className="reminder-actions">
        <button type="button" className="button button-ghost button-small" onClick={onLater}>
          {t.later}
        </button>
        <button type="button" className="button button-primary button-small" onClick={onExport}>
          {t.exportNow}
        </button>
      </div>
    </aside>
  );
}
