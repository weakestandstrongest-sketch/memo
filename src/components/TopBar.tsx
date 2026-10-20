import { forwardRef, type ReactNode } from 'react';
import { ja } from '../i18n/ja';
import { FilterIcon } from './icons';

interface TopBarProps {
  search: ReactNode;
  menu: ReactNode;
  starCount: number;
  linkCount: number;
  /** Show the filter button (when the category side panel doesn't fit). */
  showFilterButton: boolean;
  activeFilterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export const TopBar = forwardRef<HTMLElement, TopBarProps>(function TopBar(
  { search, menu, starCount, linkCount, showFilterButton, activeFilterCount, filtersOpen, onToggleFilters },
  ref,
) {
  return (
    <header ref={ref} className="topbar">
      <div className="brand">
        <Logo />
        <div className="brand-text">
          <h1 className="brand-name">{ja.app.name}</h1>
          <p className="brand-tagline">{ja.app.tagline}</p>
        </div>
      </div>

      <div className="topbar-search">{search}</div>

      <div className="topbar-right">
        <p className="star-count" aria-live="polite">
          <strong>{starCount}</strong> {ja.topbar.starsUnit}
          <span className="star-count-links"> ・ {ja.topbar.links(linkCount)}</span>
        </p>
        {showFilterButton && (
          <button
            type="button"
            className={`icon-button topbar-button ${activeFilterCount > 0 ? 'is-active' : ''}`}
            aria-label={ja.topbar.filterButton(activeFilterCount)}
            aria-expanded={filtersOpen}
            aria-controls="filter-popover"
            onClick={onToggleFilters}
          >
            <FilterIcon />
            {activeFilterCount > 0 && <span className="dot-badge">{activeFilterCount}</span>}
          </button>
        )}
        {menu}
      </div>
    </header>
  );
});

function Logo() {
  return (
    <svg className="logo" width="34" height="34" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="logo-glow">
          <stop offset="0%" stopColor="#ffe7a8" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#ffd166" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="19" fill="url(#logo-glow)" />
      <ellipse rx="17" ry="5.5" transform="rotate(-24)" fill="none" stroke="#8fa8ff" strokeOpacity="0.55" strokeWidth="1.2" />
      <path d="M0 -12 C1.2 -3 3 -1.2 12 0 C3 1.2 1.2 3 0 12 C-1.2 3 -3 1.2 -12 0 C-3 -1.2 -1.2 -3 0 -12Z" fill="#fff6dc" />
      <circle cx="13" cy="-9" r="1.4" fill="#4cc9f0" />
      <circle cx="-14" cy="8" r="1.1" fill="#ff6b9a" />
    </svg>
  );
}
