import { useState, type FormEvent } from 'react';
import { CATEGORY_LIST } from '../domain/categories';
import type { CategoryId, Note, NoteDraft } from '../domain/types';
import { LIMITS, validateDraft, type DraftErrors } from '../domain/universe';
import { formatDateTime } from '../utils/format';
import { CategoryIcon } from './universe/CategoryGlyph';
import { Modal } from './Modal';

interface NoteFormModalProps {
  /** The note being edited, or undefined to create a new one. */
  note?: Note;
  /** Pre-selected category for new notes (e.g. the active filter). */
  defaultCategory?: CategoryId | null;
  onSubmit: (values: { title: string; body: string; category: CategoryId }) => void;
  onClose: () => void;
}

export function NoteFormModal({ note, defaultCategory = null, onSubmit, onClose }: NoteFormModalProps) {
  const isEdit = Boolean(note);
  const [draft, setDraft] = useState<NoteDraft>({
    title: note?.title ?? '',
    body: note?.body ?? '',
    category: note?.category ?? defaultCategory,
  });
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (patch: Partial<NoteDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (submitted) setErrors(validateDraft(next));
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0 || !draft.category) {
      // Move focus to the first problem so it's easy to fix.
      const firstField = found.title ? 'note-title' : found.category ? 'note-category-ideas' : 'note-body';
      document.getElementById(firstField)?.focus();
      return;
    }
    onSubmit({ title: draft.title.trim(), body: draft.body, category: draft.category });
  };

  const formId = 'note-form';

  return (
    <Modal
      title={isEdit ? 'Edit star' : 'New star'}
      onClose={onClose}
      dismissOnBackdrop={false}
      className="note-form-modal"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="button button-primary">
            {isEdit ? 'Save changes' : 'Create star'}
          </button>
        </>
      }
    >
      <form
        id={formId}
        className="note-form"
        onSubmit={submit}
        noValidate
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
      >
        <div className="field">
          <label htmlFor="note-title" className="field-label">
            Title <span className="required">required</span>
          </label>
          <input
            id="note-title"
            data-autofocus
            className={`input ${errors.title ? 'has-error' : ''}`}
            value={draft.title}
            maxLength={LIMITS.title}
            placeholder="What is this star about?"
            autoComplete="off"
            enterKeyHint="next"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'note-title-error' : undefined}
            onChange={(e) => update({ title: e.target.value })}
          />
          {errors.title && (
            <p id="note-title-error" className="field-error" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <fieldset className="field">
          <legend className="field-label">
            Category <span className="required">required</span>
          </legend>
          <div className="category-picker" role="radiogroup" aria-invalid={Boolean(errors.category)}>
            {CATEGORY_LIST.map((c) => {
              const checked = draft.category === c.id;
              return (
                <label
                  key={c.id}
                  className={`category-option ${checked ? 'is-checked' : ''}`}
                  style={{ ['--cat-color' as string]: c.color }}
                >
                  <input
                    id={`note-category-${c.id}`}
                    type="radio"
                    name="category"
                    value={c.id}
                    checked={checked}
                    onChange={() => update({ category: c.id })}
                  />
                  <CategoryIcon category={c.id} size={22} />
                  <span className="category-option-label">{c.label}</span>
                </label>
              );
            })}
          </div>
          {errors.category && (
            <p className="field-error" role="alert">
              {errors.category}
            </p>
          )}
        </fieldset>

        <div className="field">
          <label htmlFor="note-body" className="field-label">
            Note <span className="optional">optional</span>
          </label>
          <textarea
            id="note-body"
            className={`input textarea ${errors.body ? 'has-error' : ''}`}
            value={draft.body}
            maxLength={LIMITS.body}
            rows={6}
            placeholder="Write down your thoughts…"
            onChange={(e) => update({ body: e.target.value })}
          />
          {errors.body && (
            <p className="field-error" role="alert">
              {errors.body}
            </p>
          )}
        </div>

        {note && (
          <p className="form-meta">
            Created {formatDateTime(note.createdAt)}
            {note.updatedAt !== note.createdAt && <> · Edited {formatDateTime(note.updatedAt)}</>}
          </p>
        )}
      </form>
    </Modal>
  );
}
