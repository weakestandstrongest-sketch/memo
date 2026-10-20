/**
 * Device settings: the passcode lock and the backup reminder.
 *
 * Saved in this browser only (separately from the notes), so a backup file
 * never contains your passcode, and the PC and the iPhone each have their own lock.
 */
import { useSyncExternalStore } from 'react';
import type { KeyValueStore } from './localStorageAdapter';

export const SETTINGS_KEY = 'my-universe:settings:v1';

/** Minutes the app may stay in the background before it locks again. 0 = right away. */
export const AUTO_LOCK_OPTIONS = [0, 1, 5, 15, 60] as const;
/** Days between backup reminders. 0 = off. */
export const BACKUP_INTERVAL_OPTIONS = [0, 1, 3, 7, 14, 30] as const;

export interface LockSettings {
  enabled: boolean;
  /** Salted hash of the passcode (see security/passcode.ts). */
  hash: string;
  salt: string;
  /** Number of digits, so the lock screen can check automatically after the last digit. */
  length: number;
  autoLockMinutes: number;
}

export interface BackupSettings {
  intervalDays: number;
  /** ISO time of the last successful export. */
  lastBackupAt: string | null;
  /** "Later" was pressed: don't remind before this ISO time. */
  snoozedUntil: string | null;
  /** When this device started using reminders (used before the first backup). */
  firstSeenAt: string;
}

export interface DisplaySettings {
  /** Selecting a star gathers its connected stars around it (display only). */
  focusMode: boolean;
  /** The sky color follows the time of day. */
  timeSky: boolean;
  /** Play the opening animation when the app starts (read early by index.html). */
  splash: boolean;
}

export interface Settings {
  lock: LockSettings;
  backup: BackupSettings;
  display: DisplaySettings;
}

export function defaultSettings(now = new Date()): Settings {
  return {
    lock: { enabled: false, hash: '', salt: '', length: 0, autoLockMinutes: 5 },
    backup: { intervalDays: 7, lastBackupAt: null, snoozedUntil: null, firstSeenAt: now.toISOString() },
    display: { focusMode: true, timeSky: true, splash: true },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** Turns stored JSON into valid settings; anything invalid falls back to the default. */
export function sanitizeSettings(raw: unknown, now = new Date()): Settings {
  const d = defaultSettings(now);
  if (!isObject(raw)) return d;
  const lock = isObject(raw.lock) ? raw.lock : {};
  const backup = isObject(raw.backup) ? raw.backup : {};
  const display = isObject(raw.display) ? raw.display : {};

  const hash = typeof lock.hash === 'string' && /^[0-9a-f]{64}$/.test(lock.hash) ? lock.hash : '';
  const salt = typeof lock.salt === 'string' && lock.salt.length > 0 ? lock.salt : '';
  const length = typeof lock.length === 'number' && lock.length >= 4 && lock.length <= 8 ? lock.length : 0;
  const autoLock = (AUTO_LOCK_OPTIONS as readonly number[]).includes(lock.autoLockMinutes as number)
    ? (lock.autoLockMinutes as number)
    : d.lock.autoLockMinutes;
  const interval = (BACKUP_INTERVAL_OPTIONS as readonly number[]).includes(backup.intervalDays as number)
    ? (backup.intervalDays as number)
    : d.backup.intervalDays;

  return {
    lock: {
      // A lock without a usable passcode would lock you out, so it counts as "off".
      enabled: lock.enabled === true && hash !== '' && salt !== '' && length > 0,
      hash,
      salt,
      length,
      autoLockMinutes: autoLock,
    },
    backup: {
      intervalDays: interval,
      lastBackupAt: isDate(backup.lastBackupAt) ? backup.lastBackupAt : null,
      snoozedUntil: isDate(backup.snoozedUntil) ? backup.snoozedUntil : null,
      firstSeenAt: isDate(backup.firstSeenAt) ? backup.firstSeenAt : d.backup.firstSeenAt,
    },
    display: {
      focusMode: typeof display.focusMode === 'boolean' ? display.focusMode : d.display.focusMode,
      timeSky: typeof display.timeSky === 'boolean' ? display.timeSky : d.display.timeSky,
      splash: typeof display.splash === 'boolean' ? display.splash : d.display.splash,
    },
  };
}

// --- Backup reminder ---------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

/** Whole days since the last backup (or since reminders started, if never backed up). */
export function daysSinceBackup(backup: BackupSettings, now = new Date()): number {
  const base = Date.parse(backup.lastBackupAt ?? backup.firstSeenAt);
  return Math.max(0, Math.floor((now.getTime() - base) / DAY));
}

export function isBackupDue(backup: BackupSettings, hasOwnNotes: boolean, now = new Date()): boolean {
  if (backup.intervalDays <= 0 || !hasOwnNotes) return false;
  if (backup.snoozedUntil && now.getTime() < Date.parse(backup.snoozedUntil)) return false;
  const base = Date.parse(backup.lastBackupAt ?? backup.firstSeenAt);
  return now.getTime() - base >= backup.intervalDays * DAY;
}

// --- A tiny store that React components can subscribe to -----------------------------

function browserStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function load(store: KeyValueStore | null): Settings {
  if (!store) return defaultSettings();
  try {
    const raw = store.getItem(SETTINGS_KEY);
    const settings = sanitizeSettings(raw ? JSON.parse(raw) : null);
    if (!raw) store.setItem(SETTINGS_KEY, JSON.stringify(settings)); // remember firstSeenAt
    return settings;
  } catch {
    return defaultSettings();
  }
}

let current: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (!current) current = load(browserStore());
  return current;
}

/** Applies a change and saves it. Returns false if it could not be saved. */
export function updateSettings(change: (s: Settings) => Settings): boolean {
  const next = change(getSettings());
  current = next;
  listeners.forEach((l) => l());
  const store = browserStore();
  if (!store) return false;
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}

/** "Forgot passcode": erases everything Asterism saved in this browser. */
export function eraseAllLocalData() {
  const store = browserStore() as Storage | null;
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith('my-universe:')) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  } catch {
    // ignore
  }
  current = null;
}
