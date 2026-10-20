import { memo, useMemo } from 'react';
import type { GalaxyCircle } from '../../domain/groups';

interface GalaxyArtProps {
  circle: GalaxyCircle;
  dim: boolean;
  /** Current zoom, so the name stays readable at any zoom level. */
  zoom: number;
}

/** Small deterministic random numbers, so a galaxy looks the same every time. */
function seeded(seedText: string) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARMS = 2;
const TURNS = 1.15; // how far each arm winds around the centre

/** Point on a spiral arm: t = 0 (centre) … 1 (edge). */
function armPoint(r: number, arm: number, t: number, twist = 0) {
  const angle = (arm * Math.PI * 2) / ARMS + t * TURNS * Math.PI * 2 + twist;
  const radius = r * (0.1 + 0.8 * t);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

/**
 * A group drawn as a spiral galaxy: soft glow, two winding arms dusted with
 * small stars, a bright core and a slowly turning outer ring.
 * Everything is drawn around (0, 0) and moved into place, so it can rotate in place.
 */
export const GalaxyArt = memo(function GalaxyArt({ circle, dim, zoom }: GalaxyArtProps) {
  const { group, cx, cy, r } = circle;

  const art = useMemo(() => {
    const rand = seeded(group.id);
    const arms = Array.from({ length: ARMS }, (_, arm) => {
      const pts: string[] = [];
      for (let i = 0; i <= 40; i++) {
        const p = armPoint(r, arm, i / 40);
        pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      }
      return `M ${pts.join(' L ')}`;
    });
    const dustCount = Math.min(90, 40 + circle.count * 6);
    const dust = Array.from({ length: dustCount }, () => {
      const arm = Math.floor(rand() * ARMS);
      const t = Math.pow(rand(), 0.8);
      // Scatter around the arm; more scattered further out.
      const p = armPoint(r, arm, t, (rand() - 0.5) * (0.35 + t * 0.5));
      return {
        x: p.x + (rand() - 0.5) * r * 0.08,
        y: p.y + (rand() - 0.5) * r * 0.08,
        size: r * (0.004 + rand() * 0.01),
        alpha: 0.25 + rand() * 0.6,
        twinkle: rand() < 0.18,
        delay: (rand() * 6).toFixed(2),
      };
    });
    return { arms, dust };
  }, [group.id, r, circle.count]);

  const labelPx = 12.5 / zoom; // ~12.5px on screen at any zoom

  return (
    <g className={`galaxy ${dim ? 'is-dim' : ''}`} style={{ color: group.color }} transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill={`url(#galaxy-${group.id})`} />
      {/* Arms + dust turn slowly together */}
      <g className="galaxy-spin">
        {art.arms.map((d, i) => (
          <g key={i}>
            <path className="galaxy-arm-glow" d={d} vectorEffect="non-scaling-stroke" />
            <path className="galaxy-arm" d={d} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {art.dust.map((s, i) => (
          <circle
            key={i}
            className={s.twinkle ? 'galaxy-dust is-twinkling' : 'galaxy-dust'}
            cx={s.x}
            cy={s.y}
            r={s.size}
            opacity={s.alpha}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
      </g>
      <circle className="galaxy-core" r={r * 0.09} fill={`url(#galaxy-core-${group.id})`} />
      <circle className="galaxy-ring" r={r} vectorEffect="non-scaling-stroke" />
      <text className="galaxy-label" y={-r - labelPx * 0.6} textAnchor="middle" style={{ fontSize: labelPx }}>
        {group.name}
      </text>
    </g>
  );
});
