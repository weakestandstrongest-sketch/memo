import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { CATEGORY_LIST } from '../domain/categories';
import { GROUP_NAME_MAX, validateGroupName } from '../domain/groups';
import type { CategoryId, Group, Note, NoteDraft } from '../domain/types';
import { LIMITS, validateDraft, type DraftErrors } from '../domain/universe';
import { ja } from '../i18n/ja';
import { formatDateTime } from '../utils/format';
import { isComposing } from '../utils/ime';
import { CategoryIcon } from './universe/CategoryGlyph';
import { Modal } from './Modal';

interface NoteFormModalProps {
  /** The note being edited, or undefined to create a new one. */
  note?: Note;
  /** Pre-selected category for new notes (e.g. the active filter). */
  defaultCategory?: CategoryId | null;
  /** Pre-selected group for new notes. */
  defaultGroupId?: string | null;
  groups: Group[];
  /** `newGroupName` is set when the user chose "create a new group". */
  onSubmit: (values: {
    title: string;
    body: string;
    category: CategoryId;
    groupId: string | null;
    newGroupName?: string;
  }) => void;
  onClose: () => void;
}

const t = ja.form;
const NEW_GROUP = '__new__';

/** Turns validation codes into Japanese messages. */
function errorText(errors: DraftErrors) {
  return {
    title:
      errors.title === 'required'
        ? t.errors.titleRequired
        : errors.title === 'tooLong'
          ? t.errors.titleTooLong(LIMITS.title)
          : undefined,
    body: errors.body ? t.errors.bodyTooLong(LIMITS.body) : undefined,
    category: errors.category ? t.errors.categoryRequired : undefined,
  };
}

export function NoteFormModal({
  note,
  defaultCategory = null,
  defaultGroupId = null,
  groups,
  onSubmit,
  onClose,
}: NoteFormModalProps) {
  const isEdit = Boolean(note);
  const [draft, setDraft] = useState<NoteDraft>({
    title: note?.title ?? '',
    body: note?.body ?? '',
    category: note?.category ?? defaultCategory,
    groupId: note ? (note.groupId ?? null) : defaultGroupId,
  });
  const [groupChoice, setGroupChoice] = useState<string>(draft.groupId ?? '');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupError, setNewGroupError] = useState<string | null>(null);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const messages = errorText(errors);

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
    const groupProblem = groupChoice === NEW_GROUP ? validateGroupName(newGroupName) : null;
    setNewGroupError(
      groupProblem === 'required'
        ? ja.groupDialog.errors.required
        : groupProblem === 'tooLong'
          ? ja.groupDialog.errors.tooLong(GROUP_NAME_MAX)
          : null,
    );
    if (groupProblem && Object.keys(found).length === 0) {
      document.getElementById('note-new-group')?.focus();
      return;
    }
    if (Object.keys(found).length > 0 || !draft.category) {
      // Move focus to the first problem so it's easy to fix.
      const firstField = found.title ? 'note-title' : found.category ? 'note-category-ideas' : 'note-body';
      document.getElementById(firstField)?.focus();
      return;
    }
    onSubmit({
      title: draft.title.trim(),
      body: draft.body,
      category: draft.category,
      groupId: groupChoice && groupChoice !== NEW_GROUP ? groupChoice : null,
      ...(groupChoice === NEW_GROUP ? { newGroupName: newGroupName.trim() } : {}),
    });
  };

  // Enter in the title moves on to the next field instead of submitting.
  // While a Japanese IME is converting text, Enter only confirms the conversion.
  const onTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || isComposing(e)) return;
    e.preventDefault();
    document.getElementById('note-body')?.focus();
  };

  const formId = 'note-form';

  return (
    <Modal
      title={isEdit ? t.editTitle : t.newTitle}
      onClose={onClose}
      dismissOnBackdrop={false}
      className="note-form-modal"
      actions={
        <>
          <button type="button" className="button button-ghost" onClick={onClose}>
            {ja.common.cancel}
          </button>
          <button type="submit" form={formId} className="button button-primary">
            {isEdit ? t.save : t.create}
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
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isComposing(e)) submit();
        }}
      >
        <div className="field">
          <label htmlFor="note-title" className="field-label">
            {t.titleLabel} <span className="required">{t.required}</span>
          </label>
          <input
            id="note-title"
            data-autofocus
            className={`input ${messages.title ? 'has-error' : ''}`}
            value={draft.title}
            maxLength={LIMITS.title}
            placeholder={t.titlePlaceholder}
            autoComplete="off"
            enterKeyHint="next"
            aria-invalid={Boolean(messages.title)}
            aria-describedby={messages.title ? 'note-title-error' : undefined}
            onChange={(e) => update({ title: e.target.value })}
            onKeyDown={onTitleKeyDown}
          />
          {messages.title && (
            <p id="note-title-error" className="field-error" role="alert">
              {messages.title}
            </p>
          )}
        </div>

        <fieldset className="field">
          <legend className="field-label">
            {t.categoryLabel} <span className="required">{t.required}</span>
          </legend>
          <div className="category-picker" role="radiogroup" aria-invalid={Boolean(messages.category)}>
            {CATEGORY_LIST.map((c) => {
              const checked = draft.category === c.id;
              return (
                <label
                  key={c.id}
                  className={`category-option ${checked ? 'is-checked' : ''}`}
                  style={{ ['--cat-color' as string]: c.color }}
                  title={c.description}
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
          {messages.category && (
            <p className="field-error" role="alert">
              {messages.category}
            </p>
          )}
        </fieldset>

        <div className="field">
          <label htmlFor="note-group" className="field-label">
            {t.groupLabel} <span className="optional">{t.optional}</span>
          </label>
          <select
            id="note-group"
            className="input select"
            value={groupChoice}
            onChange={(e) => setGroupChoice(e.target.value)}
          >
            <option value="">{t.noGroup}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
            <option value={NEW_GROUP}>{t.newGroupOption}</option>
          </select>
          {groupChoice === NEW_GROUP && (
            <>
              <input
                id="note-new-group"
                className={`input new-group-input ${newGroupError ? 'has-error' : ''}`}
                value={newGroupName}
                maxLength={GROUP_NAME_MAX}
                placeholder={ja.groupDialog.namePlaceholder}
                aria-label={ja.groupDialog.nameLabel}
                autoComplete="off"
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  if (newGroupError) setNewGroupError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposing(e)) e.preventDefault();
                }}
              />
              {newGroupError && (
                <p className="field-error" role="alert">
                  {newGroupError}
                </p>
              )}
            </>
          )}
        </div>

        <div className="field">
          <label htmlFor="note-body" className="field-label">
            {t.bodyLabel} <span className="optional">{t.optional}</span>
          </label>
          <textarea
            id="note-body"
            className={`input textarea ${messages.body ? 'has-error' : ''}`}
            value={draft.body}
            maxLength={LIMITS.body}
            rows={6}
            placeholder={t.bodyPlaceholder}
            onChange={(e) => update({ body: e.target.value })}
          />
          {messages.body && (
            <p className="field-error" role="alert">
              {messages.body}
            </p>
          )}
        </div>

        {note && (
          <p className="form-meta">
            {ja.detail.created(formatDateTime(note.createdAt))}
            {note.updatedAt !== note.createdAt && <> ・ {ja.detail.edited(formatDateTime(note.updatedAt))}</>}
          </p>
        )}
      </form>
    </Modal>
  );
}
