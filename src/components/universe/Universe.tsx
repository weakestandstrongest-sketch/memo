/**
 * The interactive universe: draws stars and connection lines with SVG and
 * handles all mouse / touch gestures.
 *
 * Gestures (Pointer Events work the same on desktop and iPhone Safari):
 *   Mouse:  click star = select · drag star = move · drag background = pan · wheel = zoom
 *   Touch:  tap star = select · press-and-hold star, then drag = move
 *           drag background (or a star, without holding) = pan · two-finger pinch = zoom
 *
 * Requiring a short hold before a star moves on touch screens keeps
 * "move the universe" and "move a star" from getting mixed up.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { CATEGORY_LIST } from '../../domain/categories';
import { ja } from '../../i18n/ja';
import { boundsOf } from '../../domain/layout';
import type { Position, UniverseData } from '../../domain/types';
import { degreeMap, neighborIds } from '../../domain/universe';
import { StarField, Twinkles } from './StarField';
import { displayWidth, truncateByWidth } from '../../utils/format';
import { pickVisibleLabels, type LabelCandidate } from './labels';
import { MAX_LABEL_WIDTH, StarNode, type StarEmphasis } from './StarNode';

export interface View {
  /** Screen position (px) of the universe origin. */
  x: number;
  y: number;
  /** Zoom factor. */
  k: number;
}

/** Space (px) covered by floating panels on each side of the screen. */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface UniverseHandle {
  /** Smoothly moves the camera to a star (and zooms in a little if far out). */
  focusOn(id: string): void;
  /** Pans only if the star is hidden behind a panel or off screen. */
  ensureVisible(id: string): void;
  fitAll(animate?: boolean): void;
  zoomBy(factor: number): void;
  /** The universe point currently at the centre of the visible area. */
  visibleCenter(): Position;
}

interface UniverseProps {
  data: UniverseData;
  selectedId: string | null;
  /** Ids matching the active search/filter, or null when no filter is active. */
  matchIds: Set<string> | null;
  /** When connecting, the star we are connecting from. */
  connectSourceId: string | null;
  newStarId: string | null;
  insets: Insets;
  onStarTap(id: string): void;
  onBackgroundTap(): void;
  onMoveStar(id: string, position: Position): void;
  onMoveEnd(id: string): void;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const HOLD_TO_DRAG_MS = 260;
const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

type Gesture =
  | { kind: 'idle' }
  | {
      kind: 'press-star';
      id: string;
      pointerId: number;
      touch: boolean;
      startX: number;
      startY: number;
      grabDX: number;
      grabDY: number;
      timer: number | undefined;
    }
  | { kind: 'drag-star'; id: string; pointerId: number; grabDX: number; grabDY: number; moved: boolean }
  | {
      kind: 'pan';
      pointerId: number;
      touch: boolean;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      startTime: number;
      moved: boolean;
    }
  | { kind: 'pinch'; startDist: number; startK: number; anchor: Position };

/** Star radius grows a little with the number of connections and note length. */
function starSize(degree: number, bodyLength: number): number {
  const bodyBonus = bodyLength > 400 ? 2 : bodyLength > 0 ? 1 : 0;
  return 9 + Math.min(degree, 6) * 1.3 + bodyBonus;
}

export const Universe = forwardRef<UniverseHandle, UniverseProps>(function Universe(props, ref) {
  const { data, selectedId, matchIds, connectSourceId, newStarId, insets } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setViewState] = useState<View>({ x: 0, y: 0, k: 1 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const coarsePointer = useMemo(() => window.matchMedia?.('(pointer: coarse)').matches ?? false, []);
  // The fade-in animation only plays when the page first opens.
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  // Refs hold the latest values for event handlers without re-binding them.
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  const layoutRef = useRef(data.layout);
  const insetsRef = useRef(insets);
  const propsRef = useRef(props);
  layoutRef.current = data.layout;
  insetsRef.current = insets;
  propsRef.current = props;
  sizeRef.current = size;

  const pointers = useRef(new Map<number, Position>());
  const gesture = useRef<Gesture>({ kind: 'idle' });
  const animation = useRef(0);

  const setView = useCallback((v: View) => {
    viewRef.current = v;
    setViewState(v);
  }, []);

  // ---------------------------------------------------------------------------
  // Camera helpers
  // ---------------------------------------------------------------------------

  const screenToWorld = (p: Position, v = viewRef.current): Position => ({
    x: (p.x - v.x) / v.k,
    y: (p.y - v.y) / v.k,
  });

  /** Centre of the part of the screen not covered by panels. */
  const focalPoint = (): Position => {
    const { w, h } = sizeRef.current;
    const i = insetsRef.current;
    return { x: i.left + (w - i.left - i.right) / 2, y: i.top + (h - i.top - i.bottom) / 2 };
  };

  const stopAnimation = () => cancelAnimationFrame(animation.current);

  /** Animates the camera so that `center` (universe coords) ends up at the focal point with zoom `k`. */
  const animateTo = useCallback(
    (center: Position, k: number, duration = 650) => {
      stopAnimation();
      const startView = viewRef.current;
      const f = focalPoint();
      const startCenter = screenToWorld(f, startView);
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const begin = performance.now();
      const step = (now: number) => {
        const t = reduceMotion ? 1 : Math.min(1, (now - begin) / duration);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const kk = startView.k + (k - startView.k) * e;
        const cx = startCenter.x + (center.x - startCenter.x) * e;
        const cy = startCenter.y + (center.y - startCenter.y) * e;
        setView({ x: f.x - cx * kk, y: f.y - cy * kk, k: kk });
        if (t < 1) animation.current = requestAnimationFrame(step);
      };
      animation.current = requestAnimationFrame(step);
    },
    [setView],
  );

  const fitAll = useCallback(
    (animate = true) => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const b = boundsOf(Object.values(layoutRef.current));
      const i = insetsRef.current;
      const availW = Math.max(120, w - i.left - i.right);
      const availH = Math.max(120, h - i.top - i.bottom);
      if (!b) {
        const f = focalPoint();
        setView({ x: f.x, y: f.y, k: 1 });
        return;
      }
      // Screen-space margins: wide enough for star labels at the left/right edges.
      const padX = Math.min(100, availW * 0.22);
      const padY = 60;
      const k = clampZoom(
        Math.min(
          1.3,
          (availW - padX * 2) / Math.max(1, b.maxX - b.minX),
          (availH - padY * 2) / Math.max(1, b.maxY - b.minY),
        ),
      );
      const center = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
      if (animate) animateTo(center, k);
      else {
        const f = focalPoint();
        setView({ x: f.x - center.x * k, y: f.y - center.y * k, k });
      }
    },
    [animateTo, setView],
  );

  const zoomAt = useCallback(
    (p: Position, factor: number) => {
      const v = viewRef.current;
      const k = clampZoom(v.k * factor);
      const w = screenToWorld(p, v);
      setView({ x: p.x - w.x * k, y: p.y - w.y * k, k });
    },
    [setView],
  );

  useImperativeHandle(
    ref,
    () => ({
      focusOn(id) {
        const p = layoutRef.current[id];
        if (!p) return;
        const k = Math.min(1.6, Math.max(viewRef.current.k, 1));
        animateTo(p, k);
      },
      ensureVisible(id) {
        const p = layoutRef.current[id];
        if (!p) return;
        const v = viewRef.current;
        const { w, h } = sizeRef.current;
        const i = insetsRef.current;
        const sx = p.x * v.k + v.x;
        const sy = p.y * v.k + v.y;
        const m = 110; // keep room for the label
        if (sx < i.left + m || sx > w - i.right - m || sy < i.top + m || sy > h - i.bottom - m) {
          animateTo(p, v.k, 450);
        }
      },
      fitAll,
      zoomBy(factor) {
        const v = viewRef.current;
        const f = focalPoint();
        animateTo(screenToWorld(f, v), clampZoom(v.k * factor), 250);
      },
      visibleCenter() {
        return screenToWorld(focalPoint());
      },
    }),
    [animateTo, fitAll],
  );

  // ---------------------------------------------------------------------------
  // Size tracking (window resize, phone rotation)
  // ---------------------------------------------------------------------------

  const didInitialFit = useRef(false);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const prev = sizeRef.current;
      if (w === prev.w && h === prev.h) return;
      sizeRef.current = { w, h };
      setSize({ w, h });
      if (!didInitialFit.current && w > 0 && h > 0) {
        didInitialFit.current = true;
        fitAll(false);
      } else if (prev.w > 0) {
        // Keep the same part of the universe centred when the screen size changes.
        const v = viewRef.current;
        setView({ ...v, x: v.x + (w - prev.w) / 2, y: v.y + (h - prev.h) / 2 });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitAll, setView]);

  // ---------------------------------------------------------------------------
  // Mouse wheel / trackpad zoom (needs a non-passive listener to block page scroll)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAnimation();
      const rect = svg.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
      // Trackpad pinch arrives as wheel + ctrlKey with small deltas.
      const speed = e.ctrlKey ? 0.01 : 0.0015;
      const factor = Math.exp(-e.deltaY * unit * speed);
      zoomAt({ x: e.clientX - rect.left, y: e.clientY - rect.top }, factor);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // ---------------------------------------------------------------------------
  // Pointer gestures
  // ---------------------------------------------------------------------------

  const localPoint = (e: { clientX: number; clientY: number }): Position => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clearPressTimer = () => {
    const g = gesture.current;
    if (g.kind === 'press-star' && g.timer !== undefined) window.clearTimeout(g.timer);
  };

  const finishStarDrag = () => {
    const g = gesture.current;
    if (g.kind === 'drag-star') propsRef.current.onMoveEnd(g.id);
    setLiftedId(null);
  };

  const startPinch = () => {
    clearPressTimer();
    finishStarDrag();
    const [a, b] = Array.from(pointers.current.values());
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    gesture.current = {
      kind: 'pinch',
      startDist: Math.max(10, Math.hypot(a.x - b.x, a.y - b.y)),
      startK: viewRef.current.k,
      anchor: screenToWorld(mid),
    };
    setPanning(true);
  };

  const startPan = (pointerId: number, p: Position, touch: boolean, moved: boolean) => {
    gesture.current = {
      kind: 'pan',
      pointerId,
      touch,
      startX: p.x,
      startY: p.y,
      lastX: p.x,
      lastY: p.y,
      startTime: performance.now(),
      moved,
    };
  };

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopAnimation();
    const p = localPoint(e);
    pointers.current.set(e.pointerId, p);
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers refuse capture for synthetic events; gestures still work.
    }
    if (e.pointerType === 'mouse') e.preventDefault(); // avoid text selection while dragging

    if (pointers.current.size >= 2) {
      startPinch();
      return;
    }

    const touch = e.pointerType === 'touch';
    const starEl = (e.target as Element).closest?.('[data-note-id]');
    const id = starEl?.getAttribute('data-note-id');
    const pos = id ? layoutRef.current[id] : undefined;

    if (id && pos) {
      const w = screenToWorld(p);
      const g: Gesture = {
        kind: 'press-star',
        id,
        pointerId: e.pointerId,
        touch,
        startX: p.x,
        startY: p.y,
        grabDX: pos.x - w.x,
        grabDY: pos.y - w.y,
        timer: undefined,
      };
      if (touch) {
        // Press and hold to pick the star up.
        g.timer = window.setTimeout(() => {
          const cur = gesture.current;
          if (cur.kind === 'press-star' && cur.pointerId === g.pointerId) {
            gesture.current = {
              kind: 'drag-star',
              id: cur.id,
              pointerId: cur.pointerId,
              grabDX: cur.grabDX,
              grabDY: cur.grabDY,
              moved: false,
            };
            setLiftedId(cur.id);
            navigator.vibrate?.(10);
          }
        }, HOLD_TO_DRAG_MS);
      }
      gesture.current = g;
    } else {
      startPan(e.pointerId, p, touch, false);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const p = localPoint(e);

    // Hover (mouse only, no button pressed).
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse') {
        const id = (e.target as Element).closest?.('[data-note-id]')?.getAttribute('data-note-id') ?? null;
        if (id !== hoverId) setHoverId(id);
      }
      return;
    }

    pointers.current.set(e.pointerId, p);
    const g = gesture.current;

    switch (g.kind) {
      case 'pinch': {
        const [a, b] = Array.from(pointers.current.values());
        if (!a || !b) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const k = clampZoom((g.startK * dist) / g.startDist);
        setView({ x: mid.x - g.anchor.x * k, y: mid.y - g.anchor.y * k, k });
        return;
      }
      case 'press-star': {
        if (g.pointerId !== e.pointerId) return;
        const slop = g.touch ? 10 : 4;
        if (Math.hypot(p.x - g.startX, p.y - g.startY) <= slop) return;
        clearPressTimer();
        if (g.touch) {
          // Finger moved before the hold finished → the user wants to pan.
          startPan(e.pointerId, { x: g.startX, y: g.startY }, true, true);
          setPanning(true);
          applyPan(p);
        } else {
          gesture.current = { kind: 'drag-star', id: g.id, pointerId: g.pointerId, grabDX: g.grabDX, grabDY: g.grabDY, moved: true };
          setLiftedId(g.id);
          moveDraggedStar(p);
        }
        return;
      }
      case 'drag-star': {
        if (g.pointerId !== e.pointerId) return;
        g.moved = true;
        moveDraggedStar(p);
        return;
      }
      case 'pan': {
        if (g.pointerId !== e.pointerId) return;
        if (!g.moved && Math.hypot(p.x - g.startX, p.y - g.startY) > (g.touch ? 8 : 3)) {
          g.moved = true;
          setPanning(true);
        }
        applyPan(p);
        return;
      }
    }
  };

  const applyPan = (p: Position) => {
    const g = gesture.current;
    if (g.kind !== 'pan') return;
    const v = viewRef.current;
    setView({ ...v, x: v.x + p.x - g.lastX, y: v.y + p.y - g.lastY });
    g.lastX = p.x;
    g.lastY = p.y;
  };

  const moveDraggedStar = (p: Position) => {
    const g = gesture.current;
    if (g.kind !== 'drag-star') return;
    const w = screenToWorld(p);
    propsRef.current.onMoveStar(g.id, {
      x: Math.round((w.x + g.grabDX) * 10) / 10,
      y: Math.round((w.y + g.grabDY) * 10) / 10,
    });
  };

  const endPointer = (e: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    switch (g.kind) {
      case 'pinch': {
        const remaining = Array.from(pointers.current.entries());
        if (remaining.length === 1) {
          const [id, p] = remaining[0];
          startPan(id, p, true, true); // continue as a pan with the remaining finger
        } else if (remaining.length === 0) {
          gesture.current = { kind: 'idle' };
          setPanning(false);
        }
        return;
      }
      case 'press-star': {
        if (g.pointerId !== e.pointerId) return;
        clearPressTimer();
        gesture.current = { kind: 'idle' };
        if (!cancelled) propsRef.current.onStarTap(g.id);
        return;
      }
      case 'drag-star': {
        if (g.pointerId !== e.pointerId) return;
        finishStarDrag();
        gesture.current = { kind: 'idle' };
        // Held but never moved → treat as a tap.
        if (!g.moved && !cancelled) propsRef.current.onStarTap(g.id);
        return;
      }
      case 'pan': {
        if (g.pointerId !== e.pointerId) return;
        gesture.current = { kind: 'idle' };
        setPanning(false);
        if (!g.moved && !cancelled && performance.now() - g.startTime < 600) {
          propsRef.current.onBackgroundTap();
        }
        return;
      }
    }
  };

  // Safari (macOS + iOS) fires its own "gesture" events for pinch; block them
  // so the whole page doesn't zoom instead of the universe.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', block);
    document.addEventListener('gesturechange', block);
    return () => {
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('gesturechange', block);
    };
  }, []);

  useEffect(() => () => stopAnimation(), []);

  const onKeyActivate = useCallback((id: string) => propsRef.current.onStarTap(id), []);

  // ---------------------------------------------------------------------------
  // Derived visual state
  // ---------------------------------------------------------------------------

  const degrees = useMemo(() => degreeMap(data.connections), [data.connections]);
  const focusId = connectSourceId ?? selectedId;
  const neighbors = useMemo(
    () => (focusId ? neighborIds(data.connections, focusId) : new Set<string>()),
    [data.connections, focusId],
  );
  const noteIndex = useMemo(() => new Map(data.notes.map((n, i) => [n.id, i])), [data.notes]);

  const emphasisOf = (id: string): StarEmphasis => {
    if (id === focusId) return 'selected';
    if (matchIds) return matchIds.has(id) ? (neighbors.has(id) ? 'neighbor' : 'match') : 'dimmed';
    if (focusId) return neighbors.has(id) ? 'neighbor' : 'faded';
    return 'normal';
  };

  // Stars shrink a little less than the universe when zooming out, so they stay visible.
  const starScale = Math.pow(view.k, -0.55);
  const minHitPx = coarsePointer ? 22 : 12;
  // Labels never get smaller than ~10px on screen.
  const labelSize = Math.max(11, 10.5 / (view.k * starScale));

  // Which labels fit without overlapping (recomputed on zoom or when stars move).
  const visibleLabels = useMemo(() => {
    const k = view.k;
    const glyphToScreen = starScale * k;
    const fontPx = labelSize * glyphToScreen;
    const rank: Record<StarEmphasis, number> = { selected: 0, neighbor: 1, match: 2, normal: 3, faded: 4, dimmed: 9 };
    const candidates: LabelCandidate[] = [];
    for (const note of data.notes) {
      const pos = data.layout[note.id];
      const emphasis = emphasisOf(note.id);
      if (!pos || emphasis === 'dimmed') continue;
      const degree = degrees.get(note.id) ?? 0;
      const size = starSize(degree, note.body.length);
      candidates.push({
        id: note.id,
        x: pos.x * k,
        top: pos.y * k + (size * 1.75 + 3) * glyphToScreen,
        width: displayWidth(truncateByWidth(note.title, MAX_LABEL_WIDTH)) * fontPx * 0.52 + 4,
        height: fontPx * 1.3,
        priority: rank[emphasis],
        degree,
      });
    }
    return pickVisibleLabels(candidates);
    // emphasisOf only depends on the values listed here.
  }, [data.notes, data.layout, degrees, view.k, starScale, labelSize, focusId, matchIds, neighbors]);
  const categoryOf = useMemo(() => new Map(data.notes.map((n) => [n.id, n.category])), [data.notes]);

  // Selected / hovered stars are drawn last so they sit on top.
  const orderedNotes = useMemo(() => {
    const top = new Set([focusId, hoverId, liftedId].filter(Boolean) as string[]);
    if (top.size === 0) return data.notes;
    return [...data.notes.filter((n) => !top.has(n.id)), ...data.notes.filter((n) => top.has(n.id))];
  }, [data.notes, focusId, hoverId, liftedId]);

  const cursor = liftedId || panning ? 'grabbing' : hoverId ? 'pointer' : 'grab';

  return (
    <div ref={wrapRef} className="universe">
      <div
        className="nebula"
        aria-hidden="true"
        style={{ transform: `translate3d(${(view.x * 0.04).toFixed(1)}px, ${(view.y * 0.04).toFixed(1)}px, 0)` }}
      />
      <StarField width={size.w} height={size.h} offsetX={view.x} offsetY={view.y} />
      <Twinkles />
      <svg
        ref={svgRef}
        className="universe-svg"
        width={size.w}
        height={size.h}
        style={{ cursor }}
        role="application"
        aria-label={ja.app.universeLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endPointer(e, false)}
        onPointerCancel={(e) => endPointer(e, true)}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse' && !pointers.current.has(e.pointerId)) setHoverId(null);
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          {CATEGORY_LIST.map((c) => (
            <radialGradient key={`glow-${c.id}`} id={`glow-${c.id}`}>
              <stop offset="0%" stopColor={c.color} stopOpacity={0.55} />
              <stop offset="35%" stopColor={c.color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0} />
            </radialGradient>
          ))}
          {CATEGORY_LIST.map((c) => (
            <radialGradient key={`core-${c.id}`} id={`core-${c.id}`} cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor={c.color} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0.85} />
            </radialGradient>
          ))}
        </defs>

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          <g className="links">
            {data.connections.map((c) => {
              const a = data.layout[c.sourceId];
              const b = data.layout[c.targetId];
              if (!a || !b) return null;
              const touchesFocus = focusId !== null && (c.sourceId === focusId || c.targetId === focusId);
              const dim = matchIds !== null && !(matchIds.has(c.sourceId) && matchIds.has(c.targetId));
              const cls = touchesFocus ? 'link link-active' : dim ? 'link link-dim' : focusId ? 'link link-faded' : 'link';
              const color = touchesFocus ? `var(--cat-${categoryOf.get(focusId!) ?? 'other'})` : undefined;
              return (
                <g key={c.id} className={cls} style={color ? { color } : undefined}>
                  {touchesFocus && (
                    <line className="link-glow" x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke" />
                  )}
                  <line className="link-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} vectorEffect="non-scaling-stroke" />
                </g>
              );
            })}
          </g>

          <g className="stars">
            {orderedNotes.map((note) => {
              const pos = data.layout[note.id];
              if (!pos) return null;
              const emphasis = emphasisOf(note.id);
              const size = starSize(degrees.get(note.id) ?? 0, note.body.length);
              return (
                <StarNode
                  key={note.id}
                  note={note}
                  x={pos.x}
                  y={pos.y}
                  size={size}
                  scale={starScale}
                  hitRadius={Math.max(size + 6, minHitPx / (view.k * starScale))}
                  emphasis={emphasis}
                  showLabel={visibleLabels.has(note.id)}
                  hovered={hoverId === note.id}
                  lifted={liftedId === note.id}
                  isNew={newStarId === note.id}
                  labelSize={labelSize}
                  intro={!introDone}
                  introIndex={noteIndex.get(note.id) ?? 0}
                  onKeyActivate={onKeyActivate}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
});
