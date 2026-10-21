import type { Group } from '../domain/types';
import { ja } from '../i18n/ja';

/** Filter value for memos without a group. */
export const NO_GROUP = '__none__';

interface GroupFilterProps {
  groups: Group[];
  /** Selected group ids (and/or NO_GROUP). Empty = everything. */
  active: Set<string>;
  /** Memos per group id (and NO_GROUP). */
  counts: Map<string, number>;
  onToggle: (id: string) => void;
  onClear: () => void;
  /** panel: list on the left of the map (wide screens) · chips: one scrolling row */
  variant: 'panel' | 'chips';
}

/** Narrow the memos down to one or more groups. */
export function GroupFilter({ groups, active, counts, onToggle, onClear, variant }: GroupFilterProps) {
  const options = [
    ...groups.map((g) => ({ id: g.id, label: g.name })),
    ...((counts.get(NO_GROUP) ?? 0) > 0 ? [{ id: NO_GROUP, label: ja.filter.none }] : []),
  ];
  return (
    <div className={`group-filter is-${variant}`} role="group" aria-label={ja.filter.groupLabel}>
      {variant === 'panel' && <h2 className="section-title">{ja.filter.heading}</h2>}
      <button
        type="button"
        className={`filter-chip ${active.size === 0 ? 'is-on' : ''}`}
        aria-pressed={active.size === 0}
        onClick={onClear}
      >
        <span className="filter-label">{ja.filter.all}</span>
      </button>
      {options.map((o) => {
        const on = active.has(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className={`filter-chip ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            onClick={() => onToggle(o.id)}
          >
            <span className="filter-label">{o.label}</span>
            <span className="filter-count">{counts.get(o.id) ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
