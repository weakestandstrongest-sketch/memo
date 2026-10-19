/**
 * Creates a random unique id.
 *
 * `crypto.randomUUID()` only exists in "secure contexts" (HTTPS or localhost).
 * When an iPhone opens the dev server over plain http://192.168.x.x it is NOT
 * available, so we fall back to `crypto.getRandomValues`, which works everywhere.
 */
export function createId(prefix = ''): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function' && globalThis.isSecureContext !== false) {
    try {
      return prefix + c.randomUUID();
    } catch {
      // fall through
    }
  }
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
