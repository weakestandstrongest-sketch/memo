import { memo } from 'react';
import { INK } from '../../domain/categories';
import type { StarShape } from '../../domain/stars';

interface GlyphProps {
  shape: StarShape;
  /** Approximate radius in SVG units. */
  r: number;
  fill: string;
}

/** Draws one star shape centred on (0, 0). Must be placed inside an <svg>. */
export const Glyph = memo(function Glyph({ shape, r, fill }: GlyphProps) {
  switch (shape) {
    case 'sparkle':
      return <path d={sparklePath(r * 1.25)} fill={fill} />;
    case 'star':
      return <path d={starPath(5, r * 1.12, r * 0.5)} fill={fill} />;
    case 'burst':
      return <path d={starPath(8, r * 1.15, r * 0.5)} fill={fill} />;
    case 'twinkle':
      return <path d={`${sparklePath(r * 1.3)} ${rotate(sparklePath(r * 0.7), 45)}`} fill={fill} />;
    case 'star6':
      return <path d={starPath(6, r * 1.12, r * 0.62)} fill={fill} />;
    case 'snow':
      return (
        <g stroke={fill} strokeWidth={r * 0.24} strokeLinecap="round" fill="none">
          <path d={snowPath(r * 1.05)} />
        </g>
      );
    case 'diamond':
      return <path d={diamondPath(r * 1.05)} fill={fill} />;
    case 'gem':
      return <path d={polygonPath(6, r * 0.95, -Math.PI / 2)} fill={fill} />;
    case 'orb':
      return <circle r={r * 0.78} fill={fill} />;
    case 'ring':
      return <circle r={r * 0.72} fill="none" stroke={fill} strokeWidth={r * 0.3} />;
    case 'planet':
      return <Planet r={r} fill={fill} />;
    case 'crescent':
      return <path d={crescentPath(r * 0.92)} fill={fill} />;
    case 'sun':
      return (
        <g fill={fill}>
          <circle r={r * 0.5} />
          <path d={raysPath(8, r * 0.68, r * 1.12, r * 0.13)} />
        </g>
      );
    case 'comet':
      return <path d={cometPath(r)} fill={fill} />;
    case 'heart':
      return <path d={heartPath(r * 1.05)} fill={fill} />;
    case 'flower':
      return (
        <g fill={fill}>
          {Array.from({ length: 5 }, (_, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            return <circle key={i} cx={f(Math.cos(a) * r * 0.55)} cy={f(Math.sin(a) * r * 0.55)} r={r * 0.42} />;
          })}
        </g>
      );
  }
});

function Planet({ r, fill }: { r: number; fill: string }) {
  const ringRx = r * 1.15;
  const ringRy = r * 0.36;
  return (
    <g>
      {/* back half of the ring */}
      <g transform="rotate(-20)">
        <path d={`M ${-ringRx} 0 A ${ringRx} ${ringRy} 0 0 1 ${ringRx} 0`} fill="none" stroke={fill} strokeWidth={r * 0.13} opacity={0.55} />
      </g>
      <circle r={r * 0.62} fill={fill} />
      {/* front half of the ring */}
      <g transform="rotate(-20)">
        <path d={`M ${-ringRx} 0 A ${ringRx} ${ringRy} 0 0 0 ${ringRx} 0`} fill="none" stroke={fill} strokeWidth={r * 0.13} />
      </g>
    </g>
  );
}

/** Small standalone icon for buttons, chips and lists. */
export function StarIcon({ shape, size = 16 }: { shape: StarShape; size?: number }) {
  return (
    <svg className="star-icon" width={size} height={size} viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
      <Glyph shape={shape} r={9} fill={INK} />
    </svg>
  );
}

// --- Shape geometry ----------------------------------------------------------

const f = (n: number) => Math.round(n * 100) / 100;

/** Rotates every "x y" pair of a path made only of absolute M / C / L / Z commands. */
function rotate(path: string, degrees: number): string {
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const nums = path.match(/-?\d+(\.\d+)?/g) ?? [];
  let i = 0;
  return path.replace(/-?\d+(\.\d+)?\s+-?\d+(\.\d+)?/g, () => {
    const x = Number(nums[i++]);
    const y = Number(nums[i++]);
    return `${f(x * cos - y * sin)} ${f(x * sin + y * cos)}`;
  });
}

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

/** A star with `points` tips. */
function starPath(points: number, outer: number, inner: number): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    out.push(`${f(Math.cos(angle) * radius)} ${f(Math.sin(angle) * radius)}`);
  }
  return `M ${out.join(' L ')} Z`;
}

function polygonPath(sides: number, r: number, start: number): string {
  const out: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = start + (i * 2 * Math.PI) / sides;
    out.push(`${f(Math.cos(angle) * r)} ${f(Math.sin(angle) * r)}`);
  }
  return `M ${out.join(' L ')} Z`;
}

function diamondPath(r: number): string {
  const w = r * 0.72;
  return `M 0 ${f(-r)} L ${f(w)} 0 L 0 ${f(r)} L ${f(-w)} 0 Z`;
}

/** Six arms with a small V near each tip. */
function snowPath(r: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const tip = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    const mid = { x: Math.cos(a) * r * 0.55, y: Math.sin(a) * r * 0.55 };
    const side = r * 0.3;
    const l = { x: mid.x + Math.cos(a - 0.9) * side, y: mid.y + Math.sin(a - 0.9) * side };
    const rr = { x: mid.x + Math.cos(a + 0.9) * side, y: mid.y + Math.sin(a + 0.9) * side };
    parts.push(`M 0 0 L ${f(tip.x)} ${f(tip.y)}`);
    parts.push(`M ${f(l.x)} ${f(l.y)} L ${f(mid.x)} ${f(mid.y)} L ${f(rr.x)} ${f(rr.y)}`);
  }
  return parts.join(' ');
}

/** Thin triangular rays around a centre. */
function raysPath(count: number, inner: number, outer: number, half: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i * 2 * Math.PI) / count;
    const px = -Math.sin(a);
    const py = Math.cos(a);
    const bx = Math.cos(a) * inner;
    const by = Math.sin(a) * inner;
    parts.push(
      `M ${f(bx + px * half)} ${f(by + py * half)} L ${f(Math.cos(a) * outer)} ${f(Math.sin(a) * outer)} L ${f(bx - px * half)} ${f(by - py * half)} Z`,
    );
  }
  return parts.join(' ');
}

/** A round head with a tapering tail towards the lower left. */
function cometPath(r: number): string {
  const hx = r * 0.35;
  const hy = -r * 0.35;
  const hr = r * 0.52;
  const tail = { x: -r * 1.15, y: r * 1.15 };
  // tangent points of the head, perpendicular to the tail direction
  const d = Math.SQRT1_2;
  const p1 = { x: hx + d * hr, y: hy + d * hr };
  const p2 = { x: hx - d * hr, y: hy - d * hr };
  return [
    `M ${f(p1.x)} ${f(p1.y)}`,
    `A ${f(hr)} ${f(hr)} 0 1 0 ${f(p2.x)} ${f(p2.y)}`,
    `Q ${f(-r * 0.2)} ${f(r * 0.05)} ${f(tail.x)} ${f(tail.y)}`,
    `Q ${f(-r * 0.05)} ${f(r * 0.2)} ${f(p1.x)} ${f(p1.y)}`,
    'Z',
  ].join(' ');
}

function heartPath(r: number): string {
  return [
    `M 0 ${f(r * 0.85)}`,
    `C ${f(-r * 0.25)} ${f(r * 0.6)} ${f(-r)} ${f(r * 0.15)} ${f(-r)} ${f(-r * 0.3)}`,
    `C ${f(-r)} ${f(-r * 0.85)} ${f(-r * 0.25)} ${f(-r * 0.95)} 0 ${f(-r * 0.45)}`,
    `C ${f(r * 0.25)} ${f(-r * 0.95)} ${f(r)} ${f(-r * 0.85)} ${f(r)} ${f(-r * 0.3)}`,
    `C ${f(r)} ${f(r * 0.15)} ${f(r * 0.25)} ${f(r * 0.6)} 0 ${f(r * 0.85)}`,
    'Z',
  ].join(' ');
}

/** Crescent moon: a circle with an offset circle cut out of it. */
function crescentPath(R: number): string {
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
