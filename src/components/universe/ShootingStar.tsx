import { useEffect, useRef, useState } from 'react';
import type { Position } from '../../domain/types';

interface ShootingStarProps {
  /** Reads the current (displayed) positions, so the light follows moving stars. */
  getFrom: () => Position | undefined;
  getTo: () => Position | undefined;
  /** Current zoom, to keep the light the same size on screen. */
  zoom: number;
  onDone: () => void;
}

const DURATION = 1100;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** A small light that runs along a new connection, then flashes at the target star. */
export function ShootingStar({ getFrom, getTo, zoom, onDone }: ShootingStarProps) {
  const [t, setT] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const gradientId = useRef(`shoot-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      onDoneRef.current();
      return;
    }
    const begin = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - begin) / DURATION);
      setT(p);
      if (p < 1) frame = requestAnimationFrame(step);
      else onDoneRef.current();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const a = getFrom();
  const b = getTo();
  if (!a || !b) return null;

  // The light travels during the first 75% of the time, then the target flashes.
  const travel = Math.min(1, t / 0.75);
  const head = easeInOut(travel);
  const tail = easeInOut(Math.max(0, travel - 0.28));
  const hx = a.x + (b.x - a.x) * head;
  const hy = a.y + (b.y - a.y) * head;
  const tx = a.x + (b.x - a.x) * tail;
  const ty = a.y + (b.y - a.y) * tail;
  const px = 1 / zoom; // one screen pixel in universe units
  const flash = t > 0.7 ? (t - 0.7) / 0.3 : 0;

  return (
    <g className="shooting-star" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={tx} y1={ty} x2={hx} y2={hy}>
          <stop offset="0%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0.95} />
        </linearGradient>
      </defs>
      {travel < 1 && (
        <>
          <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={`url(#${gradientId})`} strokeWidth={2.4 * px} strokeLinecap="round" />
          <circle cx={hx} cy={hy} r={7 * px} fill="#fff" opacity={0.25} />
          <circle cx={hx} cy={hy} r={2.6 * px} fill="#fff" />
        </>
      )}
      {flash > 0 && (
        <circle
          cx={b.x}
          cy={b.y}
          r={(8 + flash * 34) * px}
          fill="none"
          stroke="#fff"
          strokeWidth={1.5 * px}
          opacity={1 - flash}
        />
      )}
    </g>
  );
}
