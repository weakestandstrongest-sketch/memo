import { forwardRef, type ReactNode } from 'react';
import { ja } from '../i18n/ja';
import { FitIcon } from './icons';

interface MapHeaderProps {
  search: ReactNode;
  /** Kind chips under the search (when the side panel doesn't fit). */
  chips: ReactNode | null;
  noteCount: number;
  linkCount: number;
  onFitAll: () => void;
}

/** Top of the map ("星図"): title, counts, search and kinds. */
export const MapHeader = forwardRef<HTMLElement, MapHeaderProps>(function MapHeader(
  { search, chips, noteCount, linkCount, onFitAll },
  ref,
) {
  return (
    <header ref={ref} className="map-head">
      <div className="map-head-row">
        <div className="map-head-title">
          <h1 className="map-title">{ja.map.heading}</h1>
          <p className="map-count">{ja.map.count(noteCount, linkCount)}</p>
        </div>
        <button type="button" className="icon-button round-icon" onClick={onFitAll} aria-label={ja.view.fitAll} title={ja.view.fitAll}>
          <FitIcon />
        </button>
      </div>
      <div className="map-search">{search}</div>
      {chips && <div className="map-chips">{chips}</div>}
    </header>
  );
});
