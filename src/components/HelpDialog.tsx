import { CATEGORY_LIST } from '../domain/categories';
import { Modal } from './Modal';
import { CategoryIcon } from './universe/CategoryGlyph';

export function HelpDialog({ touch, onClose }: { touch: boolean; onClose: () => void }) {
  const gestures = touch
    ? [
        ['Tap a star', 'open its note'],
        ['Press & hold a star, then drag', 'move it'],
        ['Drag with one finger', 'fly around'],
        ['Pinch with two fingers', 'zoom in and out'],
      ]
    : [
        ['Click a star', 'open its note'],
        ['Drag a star', 'move it'],
        ['Drag empty space', 'fly around'],
        ['Scroll the mouse wheel', 'zoom in and out'],
        ['Press  /  or  N', 'search · new star'],
      ];
  return (
    <Modal
      title="How to explore"
      onClose={onClose}
      size="small"
      actions={
        <button type="button" className="button button-primary" data-autofocus onClick={onClose}>
          Got it
        </button>
      }
    >
      <dl className="help-list">
        {gestures.map(([g, what]) => (
          <div key={g} className="help-row">
            <dt>{g}</dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <h3 className="section-title">Star shapes</h3>
      <ul className="help-legend">
        {CATEGORY_LIST.map((c) => (
          <li key={c.id}>
            <CategoryIcon category={c.id} size={20} />
            <span>
              <strong>{c.label}</strong> — {c.shapeName}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
