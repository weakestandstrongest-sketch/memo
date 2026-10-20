import { CATEGORY_LIST } from '../domain/categories';
import { ja } from '../i18n/ja';
import type { CategoryId } from '../domain/types';
import { CategoryIcon } from './universe/CategoryGlyph';

interface CategoryFilterProps {
  active: Set<CategoryId>;
  counts: Record<CategoryId, number>;
  onToggle: (id: CategoryId) => void;
  onClear: () => void;
  /** panel: list on the left (wide screens) · chips: one scrolling row under the search */
  variant: 'panel' | 'chips';
}

/** Category toggles. No category selected = show everything. */
export function CategoryFilter({ active, counts, onToggle, onClear, variant }: CategoryFilterProps) {
  const allActive = active.size === 0;
  return (
    <div className={`category-filter is-${variant}`} role="group" aria-label={ja.filter.groupLabel}>
      {variant === 'panel' && <h2 className="section-title">{ja.filter.heading}</h2>}
      <button
        type="button"
        className={`filter-chip ${allActive ? 'is-on' : ''}`}
        aria-pressed={allActive}
        onClick={onClear}
      >
        {variant === 'panel' && <span className="filter-all-dot" aria-hidden="true" />}
        <span className="filter-label">{ja.filter.all}</span>
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
            aria-label={`${c.label}（${counts[c.id]}）`}
          >
            <CategoryIcon category={c.id} size={variant === 'chips' ? 14 : 18} />
            <span className="filter-label">{c.label}</span>
            {variant === 'panel' && <span className="filter-count">{counts[c.id]}</span>}
          </button>
        );
      })}
    </div>
  );
}
