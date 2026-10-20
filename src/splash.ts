/** When the opening animation (index.html) starts fading into the universe, in ms after page load. */
const FADE_AT = 2100;
/** Length of the fade (keep in sync with `splash-out` in index.html). */
const FADE_MS = 550;

/** Time until the opening animation starts revealing the universe (0 when it isn't playing). */
export function splashRemainingMs() {
  if (!document.documentElement.classList.contains('is-splashing')) return 0;
  return Math.max(0, FADE_AT - performance.now());
}

/**
 * Lets the opening animation in index.html finish (or be skipped with a tap), then removes it.
 * While it plays, `html.is-splashing` holds back the stars' own fade-in, so they appear
 * just as the animation dissolves into the universe.
 */
export function startSplash() {
  const html = document.documentElement;
  const splash = document.getElementById('splash');
  if (!splash || html.classList.contains('no-splash')) {
    splash?.remove();
    html.classList.remove('is-splashing');
    return;
  }

  let done = false;
  const release = () => html.classList.remove('is-splashing');
  const remove = () => {
    if (done) return;
    done = true;
    release();
    splash.remove();
  };

  const elapsed = performance.now();
  const releaseTimer = window.setTimeout(release, Math.max(0, FADE_AT - elapsed));
  const removeTimer = window.setTimeout(remove, Math.max(0, FADE_AT + FADE_MS - elapsed) + 50);

  // A tap skips the rest of the animation.
  splash.addEventListener(
    'pointerdown',
    () => {
      window.clearTimeout(releaseTimer);
      window.clearTimeout(removeTimer);
      splash.classList.add('is-skipped');
      release();
      window.setTimeout(remove, 400);
    },
    { once: true },
  );
}
