import { useState, type FormEvent } from 'react';
import { GROUP_COLORS, GROUP_NAME_MAX, validateGroupName } from '../domain/groups';
import type { Group } from '../domain/types';
import { ja } from '../i18n/ja';
import { isComposing } from '../utils/ime';
import { TrashIcon } from './icons';
import { Modal } from './Modal';

interface GroupDialogProps {
  /** The group being edited, or undefined to create a new one. */
  group?: Group;
  /** Color pre-selected for a new group. */
  suggestedColor?: string;
  onSubmit: (values: { name: string; color: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const t = ja.groupDialog;

/** Create or edit a group (shown as a circle around its memos in the map). */
export function GroupDialog({ group, suggestedColor, onSubmit, onDelete, onClose }: GroupDialogProps) {
  const [name, setName] = useState(group?.name ?? '');
  // The design is monochrome, so there is no color to pick; a color is still stored for the data format.
  const color = group?.color ?? suggestedColor ?? GROUP_COLORS[0];
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const problem = validateGroupName(name);
    if (problem) {
      setError(problem === 'required' ? t.errors.required : t.errors.tooLong(GROUP_NAME_MAX));
      document.getElementById('group-name')?.focus();
      return;
    }
    onSubmit({ name: name.trim(), color });
  };

  return (
    <Modal
      title={group ? t.editTitle : t.createTitle}
      onClose={onClose}
      size="small"
      dismissOnBackdrop={false}
      className="group-dialog"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onClose}>
            {ja.common.cancel}
          </button>
          <button type="submit" form="group-form" className="button button-primary">
            {group ? t.save : t.create}
          </button>
        </>
      }
    >
      <form id="group-form" onSubmit={submit} noValidate>
        <p className="group-dialog-note">{t.note}</p>
        <div className="field">
          <label htmlFor="group-name" className="field-label">
            {t.nameLabel}
          </label>
          <input
            id="group-name"
            data-autofocus
            className={`input ${error ? 'has-error' : ''}`}
            value={name}
            maxLength={GROUP_NAME_MAX}
            placeholder={t.namePlaceholder}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              // Enter that only confirms a Japanese IME conversion must not submit.
              if (e.key === 'Enter' && isComposing(e)) e.preventDefault();
            }}
          />
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {group && onDelete && (
          <button type="button" className="button button-ghost button-danger-text group-delete" onClick={onDelete}>
            <TrashIcon />
            {t.delete}
          </button>
        )}
      </form>
    </Modal>
  );
}
