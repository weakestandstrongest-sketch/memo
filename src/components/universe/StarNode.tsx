import { memo, type KeyboardEvent } from 'react';
import { CATEGORIES } from '../../domain/categories';
import type { Note } from '../../domain/types';
import { Glyph } from './CategoryGlyph';

export type StarEmphasis =
  | 'normal'
  /** The selected star. */
  | 'selected'
  /** Directly connected to the selected star. */
  | 'neighbor'
  /** Matches the current search / filter. */
  | 'match'
  /** Faded a little because another star is selected. */
  | 'faded'
  /** Strongly dimmed because it doesn't match the search / filter. */
  | 'dimmed';

interface StarNodeProps {
  note: Note;
  x: number;
  y: number;
  /** Radius of the glyph in local units. */
  size: number;
  /** Extra scale so stars stay readable at any zoom level. */
  scale: number;
  /** Radius of the invisible touch / click target in local units. */
  hitRadius: number;
  emphasis: StarEmphasis;
  showLabel: boolean;
  /** Label font size in local units. */
  labelSize: number;
  hovered: boolean;
  lifted: boolean;
  isNew: boolean;
  /** True while the page-load fade-in plays. */
  intro: boolean;
  /** Index used to stagger the intro animation. */
  introIndex: number;
  onKeyActivate: (id: string) => void;
}

const MAX_LABEL = 30;

export const StarNode = memo(function StarNode({
  note,
  x,
  y,
  size,
  scale,
  hitRadius,
  emphasis,
  showLabel,
  labelSize,
  hovered,
  lifted,
  isNew,
  intro,
  introIndex,
  onKeyActivate,
}: StarNodeProps) {
  const category = CATEGORIES[note.category];
  const label = note.title.length > MAX_LABEL ? note.title.slice(0, MAX_LABEL - 1) + '…' : note.title;

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onKeyActivate(note.id);
    }
  };

  const classes = [
    'star-node',
    `star-${emphasis}`,
    hovered && 'is-hovered',
    lifted && 'is-lifted',
    isNew ? 'is-new' : intro && 'is-intro',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g
      className={classes}
      transform={`translate(${x} ${y})`}
      data-note-id={note.id}
      role="button"
      tabIndex={0}
      aria-label={`${note.title} — ${category.label} (${category.shapeName})`}
      aria-pressed={emphasis === 'selected'}
      onKeyDown={onKeyDown}
      style={{ ['--star-color' as string]: category.color, ['--intro-delay' as string]: `${Math.min(introIndex, 40) * 35}ms` }}
    >
      <g transform={`scale(${scale})`}>
        <g className="star-body">
          <circle className="star-hit" r={hitRadius} />
          <circle className="star-glow" r={size * 3} fill={`url(#glow-${note.category})`} />
          {isNew && <circle className="star-birth-ring" r={size * 1.6} />}
          {(emphasis === 'selected' || emphasis === 'match') && (
            <circle className="star-ring" r={size * 1.75 + 2} />
          )}
          <g className="star-glyph">
            <Glyph
              shape={category.shape}
              r={size}
              fill={`url(#core-${note.category})`}
              stroke={category.color}
            />
          </g>
          {(showLabel || hovered) && (
            <text
              className="star-label"
              y={size * 1.75 + labelSize + 3}
              textAnchor="middle"
              style={{ fontSize: emphasis === 'selected' ? labelSize * 1.12 : labelSize }}
            >
              {label}
            </text>
          )}
        </g>
      </g>
    </g>
  );
});
