/**
 * The app's mark: a four-pointed star on a tilted orbit with two small planets,
 * drawn in one color (currentColor). Matches the app icon (public/favicon.svg)
 * and the opening animation in index.html.
 */
export function AppMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <ellipse rx="40" ry="12.5" transform="rotate(-24)" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M0 -30C3 -7.5 7.5 -3 30 0C7.5 3 3 7.5 0 30C-3 7.5 -7.5 3 -30 0C-7.5 -3 -3 -7.5 0 -30Z"
        fill="currentColor"
      />
      <circle cx="31" cy="-19.6" r="4.2" fill="currentColor" />
      <circle cx="-32.6" cy="19.3" r="3.2" fill="currentColor" />
    </svg>
  );
}
