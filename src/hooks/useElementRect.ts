import { useLayoutEffect, useState, type RefObject } from 'react';

export interface Box {
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** Tracks an element's on-screen box. Returns null while the element isn't rendered. */
export function useElementRect(ref: RefObject<HTMLElement | null>, active = true): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) {
      setBox(null);
      return;
    }
    const update = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) =>
        prev &&
        prev.width === r.width &&
        prev.height === r.height &&
        prev.top === r.top &&
        prev.left === r.left
          ? prev
          : { width: r.width, height: r.height, top: r.top, left: r.left, bottom: r.bottom, right: r.right },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref, active]);
  return box;
}
