import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

/** How far (px) a finger has to move before it counts as a drag rather than a tap. */
const SLOP = 8;

interface Gesture {
  startY: number;
  startTime: number;
  /** Where the sheet was when the finger came down. */
  from: 'closed' | 'open';
  dragging: boolean;
}

/**
 * A sheet that slides up over the page, iOS style: pull it up from the page,
 * pull it down by its header (or by its content when scrolled to the top).
 *
 * `offset` is the sheet's distance (px) below its open position while a finger
 * holds it, and null otherwise (then CSS places it from `open`).
 */
export function useSheet(areaRef: RefObject<HTMLElement | null>, bodyRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const justDragged = useRef(false);

  const height = () => areaRef.current?.clientHeight || window.innerHeight;

  const begin = (y: number, from: Gesture['from']) => {
    gesture.current = { startY: y, startTime: performance.now(), from, dragging: false };
  };

  /** Returns true while the movement is moving the sheet. */
  const move = (y: number) => {
    const g = gesture.current;
    if (!g) return false;
    const dy = y - g.startY; // + is down
    if (!g.dragging) {
      if (g.from === 'closed' ? dy < -SLOP : dy > SLOP) g.dragging = true;
      else {
        if (Math.abs(dy) > SLOP) gesture.current = null; // wrong direction: not ours
        return false;
      }
    }
    setOffset(g.from === 'closed' ? Math.max(0, height() + dy) : Math.max(0, dy));
    return true;
  };

  const end = (y: number) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.dragging) return;
    justDragged.current = true; // swallow the click that follows a drag
    window.setTimeout(() => (justDragged.current = false), 0);
    const dy = y - g.startY;
    const flick = performance.now() - g.startTime < 300 && Math.abs(dy) > 40;
    if (g.from === 'closed') setOpen(-dy > height() * 0.18 || (flick && dy < 0));
    else setOpen(!(dy > Math.min(140, height() * 0.2) || (flick && dy > 0)));
    setOffset(null);
  };

  const cancel = () => {
    gesture.current = null;
    setOffset(null);
  };

  const pointerHandlers = (from: Gesture['from']) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0 || (from === 'closed') === open) return;
      begin(e.clientY, from);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (move(e.clientY) && !e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => end(e.clientY),
    onPointerCancel: cancel,
    onClickCapture: (e: ReactMouseEvent) => {
      if (justDragged.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
  });

  // Inside the sheet's scrolling content, pulling down at the very top moves the sheet.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !open) return;
    let tracking = false;
    const onStart = (e: TouchEvent) => {
      tracking = e.touches.length === 1 && el.scrollTop <= 0;
      if (tracking) begin(e.touches[0].clientY, 'open');
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      if (move(e.touches[0].clientY)) e.preventDefault();
      else if (!gesture.current) tracking = false; // scrolling the list instead
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      end(e.changedTouches[0].clientY);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', cancel);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', cancel);
    };
    // begin/move/end only use refs and state setters, so they need not be dependencies
  }, [open, bodyRef]);

  /** 0 = closed … 1 = open, following the finger while it drags. */
  const progress = offset === null ? (open ? 1 : 0) : Math.max(0, Math.min(1, 1 - offset / height()));

  return {
    open,
    setOpen,
    offset,
    progress,
    /** For the page under the sheet: drag up to open. */
    pullUp: pointerHandlers('closed'),
    /** For the sheet's header: drag down to close. */
    pullDown: pointerHandlers('open'),
  };
}
