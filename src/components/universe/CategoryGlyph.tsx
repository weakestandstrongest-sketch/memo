import { memo } from 'react';
import { CATEGORIES, type StarShape } from '../../domain/categories';
import type { CategoryId } from '../../domain/types';

interface GlyphProps {
  shape: StarShape;
  /** Approximate radius in SVG units. */
  r: number;
  fill: string;
  stroke?: string;
}

/** Draws one star shape centred on (0, 0). Must be placed inside an <svg>. */
export const Glyph = memo(function Glyph({ shape, r, fill, stroke }: GlyphProps) {
  const strokeProps = stroke ? { stroke, strokeWidth: r * 0.08, strokeLinejoin: 'round' as const } : {};
  switch (shape) {
    case 'sparkle':
      return <path d={sparklePath(r * 1.25)} fill={fill} {...strokeProps} />;
    case 'star':
      return <path d={starPath(r * 1.12, r * 0.5)} fill={fill} {...strokeProps} />;
    case 'diamond':
      return <path d={diamondPath(r * 1.05)} fill={fill} {...strokeProps} />;
    case 'crescent':
      return <path d={crescentPath(r * 0.92)} fill={fill} {...strokeProps} />;
    case 'planet': {
      const ringRx = r * 1.15;
      const ringRy = r * 0.36;
      const ringColor = stroke ?? fill;
      return (
        <g>
          {/* back half of the ring */}
          <g transform="rotate(-20)">
            <path
              d={`M ${-ringRx} 0 A ${ringRx} ${ringRy} 0 0 1 ${ringRx} 0`}
              fill="none"
              stroke={ringColor}
              strokeWidth={r * 0.13}
              opacity={0.55}
            />
          </g>
          <circle r={r * 0.62} fill={fill} {...strokeProps} />
          {/* front half of the ring */}
          <g transform="rotate(-20)">
            <path
              d={`M ${-ringRx} 0 A ${ringRx} ${ringRy} 0 0 0 ${ringRx} 0`}
              fill="none"
              stroke={ringColor}
              strokeWidth={r * 0.13}
            />
          </g>
        </g>
      );
    }
  }
});

/** Small standalone icon for buttons, chips and lists. */
export function CategoryIcon({ category, size = 16 }: { category: CategoryId; size?: number }) {
  const info = CATEGORIES[category];
  return (
    <svg
      className="category-icon"
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <Glyph shape={info.shape} r={9} fill={info.color} />
    </svg>
  );
}

// --- Shape geometry ----------------------------------------------------------

const f = (n: number) => Math.round(n * 100) / 100;

/** Four-pointed sparkle with concave sides. */
function sparklePath(r: number): string {
  const a = r * 0.1;
  const b = r * 0.26;
  return [
    `M 0 ${f(-r)}`,
    `C ${f(a)} ${f(-b)} ${f(b)} ${f(-a)} ${f(r)} 0`,
    `C ${f(b)} ${f(a)} ${f(a)} ${f(b)} 0 ${f(r)}`,
    `C ${f(-a)} ${f(b)} ${f(-b)} ${f(a)} ${f(-r)} 0`,
    `C ${f(-b)} ${f(-a)} ${f(-a)} ${f(-b)} 0 ${f(-r)}`,
    'Z',
  ].join(' ');
}

/** Classic five-pointed star. */
function starPath(outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${f(Math.cos(angle) * radius)} ${f(Math.sin(angle) * radius)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

function diamondPath(r: number): string {
  const w = r * 0.72;
  return `M 0 ${f(-r)} L ${f(w)} 0 L 0 ${f(r)} L ${f(-w)} 0 Z`;
}

/** Crescent moon: a circle with an offset circle cut out of it. */
function crescentPath(R: number): string {
  // Centre of the "cut" circle (same radius), offset up and to the right.
  const cx = R * 0.55;
  const cy = -R * 0.35;
  const d = Math.hypot(cx, cy);
  const h = Math.sqrt(R * R - (d / 2) * (d / 2));
  const mx = cx / 2;
  const my = cy / 2;
  const ux = -cy / d;
  const uy = cx / d;
  const p1 = { x: mx + h * ux, y: my + h * uy };
  const p2 = { x: mx - h * ux, y: my - h * uy };
  return [
    `M ${f(p1.x)} ${f(p1.y)}`,
    `A ${f(R)} ${f(R)} 0 1 1 ${f(p2.x)} ${f(p2.y)}`,
    `A ${f(R)} ${f(R)} 0 0 0 ${f(p1.x)} ${f(p1.y)}`,
    'Z',
  ].join(' ');
}
