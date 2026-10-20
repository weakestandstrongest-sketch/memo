import { useCallback, useEffect, useState } from 'react';
import App from './App';
import { LockScreen } from './components/LockScreen';
import { getSettings, useSettings } from './storage/settings';

/**
 * Shows the lock screen instead of the app while the passcode lock is active.
 * The app (and with it every note) is not rendered at all while locked.
 */
export function Root() {
  const { lock } = useSettings();
  const [locked, setLocked] = useState(() => getSettings().lock.enabled);

  // Lock again after the app has been in the background for the chosen time.
  useEffect(() => {
    if (!lock.enabled) return;
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        // "Right away": lock now, so the iPhone app switcher preview shows the lock screen.
        if (lock.autoLockMinutes === 0) setLocked(true);
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= lock.autoLockMinutes * 60_000) setLocked(true);
        hiddenAt = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [lock.enabled, lock.autoLockMinutes]);

  const unlock = useCallback(() => setLocked(false), []);
  const lockNow = useCallback(() => setLocked(true), []);

  if (locked && lock.enabled) return <LockScreen onUnlock={unlock} />;
  return <App onLockNow={lock.enabled ? lockNow : undefined} />;
}
