import { CATEGORY_LIST } from '../domain/categories';
import type { CategoryId } from '../domain/types';
import { CategoryIcon } from './universe/CategoryGlyph';

interface CategoryFilterProps {
  active: Set<CategoryId>;
  counts: Record<CategoryId, number>;
  onToggle: (id: CategoryId) => void;
  onClear: () => void;
  variant: 'panel' | 'popover';
}

/** Category toggles. No category selected = show everything. */
export function CategoryFilter({ active, counts, onToggle, onClear, variant }: CategoryFilterProps) {
  const allActive = active.size === 0;
  return (
    <div className={`category-filter is-${variant}`} role="group" aria-label="Filter by category">
      {variant === 'panel' && <h2 className="section-title">Categories</h2>}
      <button
        type="button"
        className={`filter-chip ${allActive ? 'is-on' : ''}`}
        aria-pressed={allActive}
        onClick={onClear}
      >
        <span className="filter-all-dot" aria-hidden="true" />
        <span className="filter-label">All stars</span>
      </button>
      {CATEGORY_LIST.map((c) => {
        const on = active.has(c.id);
        return (
          <button
            key={c.id}
            type="button"
            className={`filter-chip ${on ? 'is-on' : ''}`}
            style={{ ['--cat-color' as string]: c.color }}
            aria-pressed={on}
            onClick={() => onToggle(c.id)}
            title={c.description}
          >
            <CategoryIcon category={c.id} size={18} />
            <span className="filter-label">{c.label}</span>
            <span className="filter-count">{counts[c.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
