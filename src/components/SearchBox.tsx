import { forwardRef, useRef, useState, type KeyboardEvent } from 'react';
import { ja } from '../i18n/ja';
import { CATEGORIES } from '../domain/categories';
import type { Note } from '../domain/types';
import { CloseIcon, SearchIcon } from './icons';
import { isComposing } from '../utils/ime';
import { CategoryIcon } from './universe/CategoryGlyph';

interface SearchBoxProps {
  query: string;
  onQueryChange: (q: string) => void;
  /** Notes matching the query and active filters. */
  results: Note[];
  onOpenResult: (id: string) => void;
}

const MAX_RESULTS = 8;

/** Search field with a dropdown of matching stars. Matching stars also light up in the universe. */
export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { query, onQueryChange, results, onOpenResult },
  inputRef,
) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const closeTimer = useRef<number | undefined>(undefined);
  const shown = results.slice(0, MAX_RESULTS);
  const showList = open && query.trim().length > 0;

  const openResult = (id: string) => {
    onOpenResult(id);
    setOpen(false);
    // Hide the phone keyboard so the universe is visible again.
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      // Enter that confirms a Japanese IME conversion must not open a result.
      if (isComposing(e)) return;
      e.preventDefault();
      const target = shown[active] ?? shown[0];
      if (target) openResult(target.id);
    } else if (e.key === 'Escape') {
      if (query) onQueryChange('');
      else e.currentTarget.blur();
    }
  };

  return (
    <div
      className="search"
      onFocus={() => {
        window.clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onBlur={() => {
        // Delay so a tap on a result still registers (iOS doesn't focus buttons).
        closeTimer.current = window.setTimeout(() => setOpen(false), 200);
      }}
    >
      <span className="search-icon">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        placeholder={ja.search.placeholder}
        aria-label={ja.search.ariaLabel}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showList}
        aria-controls="search-results"
        aria-autocomplete="list"
      />
      {query && (
        <button
          type="button"
          className="icon-button search-clear"
          aria-label={ja.search.clear}
          onClick={() => onQueryChange('')}
        >
          <CloseIcon />
        </button>
      )}

      {showList && (
        <ul id="search-results" className="search-results" role="listbox" aria-label={ja.search.resultsLabel}>
          {shown.length === 0 && <li className="search-empty">{ja.search.noMatch(query.trim())}</li>}
          {shown.map((n, i) => (
            <li key={n.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`search-result ${i === active ? 'is-active' : ''}`}
                onClick={() => openResult(n.id)}
                onMouseEnter={() => setActive(i)}
              >
                <CategoryIcon category={n.category} size={18} />
                <span className="search-result-text">
                  <span className="search-result-title">{n.title}</span>
                  <span className="search-result-meta">{CATEGORIES[n.category].label}</span>
                </span>
              </button>
            </li>
          ))}
          {results.length > MAX_RESULTS && (
            <li className="search-more">{ja.search.more(results.length - MAX_RESULTS)}</li>
          )}
        </ul>
      )}
    </div>
  );
});
