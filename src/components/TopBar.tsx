import { forwardRef, type ReactNode } from 'react';
import { ja } from '../i18n/ja';

interface TopBarProps {
  search: ReactNode;
  menu: ReactNode;
  /** Category chips shown under the search (when the side panel doesn't fit). */
  chips: ReactNode | null;
  starCount: number;
  linkCount: number;
  /** Hour of the day, for the greeting. */
  hour: number;
}

export const TopBar = forwardRef<HTMLElement, TopBarProps>(function TopBar(
  { search, menu, chips, starCount, linkCount, hour },
  ref,
) {
  return (
    <header ref={ref} className="topbar">
      <div className="brand">
        <p className="brand-greeting" aria-live="polite">
          {ja.topbar.greeting(hour)}
          <span className="brand-count">
            {starCount}
            {ja.topbar.starsUnit}
            <span className="star-count-links"> ・ {ja.topbar.links(linkCount)}</span>
          </span>
        </p>
        <h1 className="brand-name">{ja.app.name}</h1>
      </div>

      <div className="topbar-search">{search}</div>

      <div className="topbar-right">{menu}</div>

      {chips && <div className="topbar-chips">{chips}</div>}
    </header>
  );
});
