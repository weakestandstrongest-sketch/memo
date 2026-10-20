/**
 * Text fields that save after a short pause (AutoField) register here, so that
 * saving to storage can first collect what was typed in the last moment —
 * e.g. when the app is locked or sent to the background mid-sentence.
 */
const flushers = new Set<() => void>();

export function registerPendingEdit(flush: () => void): () => void {
  flushers.add(flush);
  return () => {
    flushers.delete(flush);
  };
}

export function flushPendingEdits() {
  for (const flush of [...flushers]) flush();
}
