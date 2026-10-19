import { useEffect } from 'react';

/**
 * Publishes the *visible* part of the screen as CSS variables:
 *   --vv-height  height not covered by the on-screen keyboard
 *   --vv-top     how far iOS Safari scrolled the page when the keyboard opened
 *
 * Modals use these so their inputs and Save buttons stay above the iPhone keyboard.
 */
export function useVisualViewportVars() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    const update = () => {
      const height = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      root.style.setProperty('--vv-height', `${Math.round(height)}px`);
      root.style.setProperty('--vv-top', `${Math.round(top)}px`);
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
}
