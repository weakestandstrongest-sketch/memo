import { useId } from 'react';

/**
 * The app's mark: a four-pointed star in a soft nebula glow, with a tilted orbit
 * and two small planets. Used in the lock screen and matches the app icon
 * (public/favicon.svg) and the opening animation in index.html.
 */
export function AppMark({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="#fff4da" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#ffb4d0" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#8a68f0" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8a68f0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="48" fill={`url(#${id}-glow)`} />
      <ellipse rx="38" ry="12" transform="rotate(-24)" fill="none" stroke="#d7ccff" strokeOpacity="0.6" strokeWidth="1.6" />
      <path
        d="M0 -26C2.6 -6.5 6.5 -2.6 26 0C6.5 2.6 2.6 6.5 0 26C-2.6 6.5 -6.5 2.6 -26 0C-6.5 -2.6 -2.6 -6.5 0 -26Z"
        fill="#fff8ea"
      />
      <circle cx="29.4" cy="-18.6" r="3.4" fill="#a5e6ff" />
      <circle cx="-31" cy="18.3" r="2.6" fill="#ffb4d0" />
    </svg>
  );
}
