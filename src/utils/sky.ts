/** Parts of the day the sky color follows. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

/** 5–8 dawn · 8–16 day · 16–19 dusk · 19–5 night (local time). */
export function skyPhase(date = new Date()): SkyPhase {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 16) return 'day';
  if (h >= 16 && h < 19) return 'dusk';
  return 'night';
}
