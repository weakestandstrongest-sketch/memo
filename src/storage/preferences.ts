/** Small UI preferences (not part of the universe data). Failing storage is ignored. */
const PREFIX = 'my-universe:pref:';

export function readPref(name: string): string | null {
  try {
    return localStorage.getItem(PREFIX + name);
  } catch {
    return null;
  }
}

export function writePref(name: string, value: string) {
  try {
    localStorage.setItem(PREFIX + name, value);
  } catch {
    // ignore
  }
}
