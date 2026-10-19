import { useEffect, useMemo, useRef } from 'react';

/**
 * Decorative background: faint stars drawn on a <canvas> in three depth layers
 * that move slightly as you pan (parallax). They are purely visual —
 * the canvas ignores all clicks and taps (pointer-events: none in CSS).
 */

interface StarFieldProps {
  width: number;
  height: number;
  /** Current pan offset of the universe, used for the parallax effect. */
  offsetX: number;
  offsetY: number;
}

interface BgStar {
  x: number;
  y: number;
  r: number;
  alpha: number;
  color: string;
}

interface Layer {
  depth: number;
  stars: BgStar[];
}

const TILE = 1200;

/** Small deterministic random generator, so the sky looks the same every time. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TINTS = ['#ffffff', '#ffffff', '#ffffff', '#cfd8ff', '#ffe9c7', '#d6c8ff'];

function makeLayers(): Layer[] {
  const rand = mulberry32(42);
  const spec = [
    { depth: 0.03, count: 260, rMin: 0.3, rMax: 0.8, aMin: 0.15, aMax: 0.45 },
    { depth: 0.08, count: 120, rMin: 0.5, rMax: 1.1, aMin: 0.25, aMax: 0.6 },
    { depth: 0.16, count: 40, rMin: 0.8, rMax: 1.6, aMin: 0.35, aMax: 0.8 },
  ];
  return spec.map((s) => ({
    depth: s.depth,
    stars: Array.from({ length: s.count }, () => ({
      x: rand() * TILE,
      y: rand() * TILE,
      r: s.rMin + rand() * (s.rMax - s.rMin),
      alpha: s.aMin + rand() * (s.aMax - s.aMin),
      color: TINTS[Math.floor(rand() * TINTS.length)],
    })),
  }));
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function StarField({ width, height, offsetX, offsetY }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layers = useMemo(makeLayers, []);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas || width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(width * dpr);
      const ph = Math.round(height * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const layer of layers) {
        const ox = mod(offsetX * layer.depth, TILE);
        const oy = mod(offsetY * layer.depth, TILE);
        for (const s of layer.stars) {
          // Repeat the tile so the sky is endless in every direction.
          for (let x = mod(s.x + ox, TILE) - TILE; x < width + 2; x += TILE) {
            if (x < -2) continue;
            for (let y = mod(s.y + oy, TILE) - TILE; y < height + 2; y += TILE) {
              if (y < -2) continue;
              ctx.globalAlpha = s.alpha;
              ctx.fillStyle = s.color;
              ctx.beginPath();
              ctx.arc(x, y, s.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    });
    return () => cancelAnimationFrame(frame.current);
  }, [width, height, offsetX, offsetY, layers]);

  return <canvas ref={canvasRef} className="starfield" style={{ width, height }} aria-hidden="true" />;
}

/** A few softly twinkling stars on top of the canvas (pure CSS animation). */
export function Twinkles() {
  const stars = useMemo(() => {
    const rand = mulberry32(7);
    return Array.from({ length: 22 }, (_, i) => ({
      key: i,
      left: `${(rand() * 100).toFixed(2)}%`,
      top: `${(rand() * 100).toFixed(2)}%`,
      size: 1 + rand() * 1.6,
      delay: `${(rand() * 8).toFixed(2)}s`,
      duration: `${(4 + rand() * 6).toFixed(2)}s`,
    }));
  }, []);
  return (
    <div className="twinkles" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.key}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
