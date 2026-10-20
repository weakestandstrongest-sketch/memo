import { describe, expect, it } from 'vitest';
import { daysSinceBackup, defaultSettings, isBackupDue, sanitizeSettings } from './settings';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-20T12:00:00.000Z');
const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString();

describe('sanitizeSettings', () => {
  it('falls back to defaults for garbage', () => {
    expect(sanitizeSettings('nope', now)).toEqual(defaultSettings(now));
    expect(sanitizeSettings({ lock: { autoLockMinutes: 7 }, backup: { intervalDays: 99 } }, now).backup.intervalDays).toBe(7);
  });

  it('never leaves the lock "on" without a usable passcode', () => {
    const s = sanitizeSettings({ lock: { enabled: true, hash: 'short', salt: '', length: 4 } }, now);
    expect(s.lock.enabled).toBe(false);
    const ok = sanitizeSettings({ lock: { enabled: true, hash: 'a'.repeat(64), salt: 'x', length: 6, autoLockMinutes: 1 } }, now);
    expect(ok.lock).toMatchObject({ enabled: true, length: 6, autoLockMinutes: 1 });
  });
});

describe('backup reminder', () => {
  const base = { intervalDays: 7, lastBackupAt: null, snoozedUntil: null, firstSeenAt: ago(0) };

  it('is not due for a brand-new user', () => {
    expect(isBackupDue(base, true, now)).toBe(false);
  });

  it('is due when the interval has passed since the first use (never backed up)', () => {
    expect(isBackupDue({ ...base, firstSeenAt: ago(8) }, true, now)).toBe(true);
  });

  it('counts from the last backup', () => {
    expect(isBackupDue({ ...base, firstSeenAt: ago(60), lastBackupAt: ago(3) }, true, now)).toBe(false);
    expect(isBackupDue({ ...base, firstSeenAt: ago(60), lastBackupAt: ago(7) }, true, now)).toBe(true);
    expect(daysSinceBackup({ ...base, lastBackupAt: ago(10) }, now)).toBe(10);
  });

  it('respects "later", "off", and only-sample-data', () => {
    const due = { ...base, firstSeenAt: ago(30) };
    expect(isBackupDue({ ...due, snoozedUntil: new Date(now.getTime() + DAY).toISOString() }, true, now)).toBe(false);
    expect(isBackupDue({ ...due, intervalDays: 0 }, true, now)).toBe(false);
    expect(isBackupDue(due, false, now)).toBe(false);
  });
});
