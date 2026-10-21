import { STAR_SHAPES } from '../domain/stars';
import { ja } from '../i18n/ja';
import { Modal } from './Modal';
import { StarIcon } from './universe/StarGlyph';

export function HelpDialog({ touch, onClose }: { touch: boolean; onClose: () => void }) {
  const gestures = touch ? ja.help.touch : ja.help.mouse;
  return (
    <Modal
      title={ja.help.title}
      onClose={onClose}
      size="small"
      actions={
        <button type="button" className="button button-primary" data-autofocus onClick={onClose}>
          {ja.help.ok}
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
      <h3 className="section-title">{ja.help.shapesHeading}</h3>
      <p className="help-data">{ja.help.shapesText}</p>
      <ul className="help-shapes" aria-hidden="true">
        {STAR_SHAPES.map((shape) => (
          <li key={shape}>
            <StarIcon shape={shape} size={22} />
          </li>
        ))}
      </ul>
      <h3 className="section-title help-data-title">{ja.help.dataHeading}</h3>
      <p className="help-data">{ja.help.dataText}</p>
    </Modal>
  );
}
