/**
 * Decides which star labels to show so that they don't overlap.
 * Labels are placed in priority order; a label that would overlap one that is
 * already placed is skipped (the title is still shown on hover / in the details).
 */

export interface LabelCandidate {
  id: string;
  /** Horizontal centre of the label (px, relative to the universe origin). */
  x: number;
  /** Top edge of the label (px). */
  top: number;
  width: number;
  height: number;
  /** Lower = more important (0 = selected star). */
  priority: number;
  /** Tie-breaker: more connections = more important. */
  degree: number;
}

const GAP = 4; // minimum space between labels (px)

export function pickVisibleLabels(candidates: LabelCandidate[]): Set<string> {
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority || b.degree - a.degree);
  const placed: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const visible = new Set<string>();
  for (const c of sorted) {
    const box = { x1: c.x - c.width / 2, y1: c.top, x2: c.x + c.width / 2, y2: c.top + c.height };
    const overlaps = placed.some(
      (p) => box.x1 < p.x2 + GAP && box.x2 > p.x1 - GAP && box.y1 < p.y2 + GAP && box.y2 > p.y1 - GAP,
    );
    // The selected star's label is always shown.
    if (!overlaps || c.priority === 0) {
      placed.push(box);
      visible.add(c.id);
    }
  }
  return visible;
}
