/**
 * True while the user is converting text with an input method (e.g. typing
 * Japanese and pressing Enter to confirm kanji). Such key presses must not
 * trigger actions like "submit" or "open the first search result".
 *
 * keyCode 229 covers Safari, which reports the confirming Enter after the
 * composition has already ended.
 */
export function isComposing(e: { nativeEvent: KeyboardEvent; keyCode?: number }): boolean {
  return e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229 || e.keyCode === 229;
}
