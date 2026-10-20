import { useMemo, useState } from 'react';
import { ja } from '../i18n/ja';
import { CATEGORIES } from '../domain/categories';
import type { Note, UniverseData } from '../domain/types';
import { matchesQuery, neighborIds } from '../domain/universe';
import { Modal } from './Modal';
import { TargetIcon } from './icons';
import { CategoryIcon } from './universe/CategoryGlyph';
import { displayTitle } from '../utils/noteTitle';

interface ConnectPickerProps {
  source: Note;
  data: UniverseData;
  onPick: (targetId: string) => void;
  /** Switch to "tap a star in the universe" mode. */
  onPickInUniverse: () => void;
  onClose: () => void;
}

/** Lets the user choose which star to connect to. */
export function ConnectPicker({ source, data, onPick, onPickInUniverse, onClose }: ConnectPickerProps) {
  const [query, setQuery] = useState('');
  const connected = useMemo(() => neighborIds(data.connections, source.id), [data.connections, source.id]);

  const candidates = useMemo(
    () =>
      data.notes
        .filter((n) => n.id !== source.id && matchesQuery(n, query))
        .sort((a, b) => {
          // Not-yet-connected stars first, then alphabetical.
          const ca = connected.has(a.id) ? 1 : 0;
          const cb = connected.has(b.id) ? 1 : 0;
          return ca - cb || displayTitle(a).localeCompare(displayTitle(b), 'ja');
        }),
    [data.notes, source.id, query, connected],
  );

  const others = data.notes.length - 1;

  return (
    <Modal title={ja.connect.title} onClose={onClose} className="connect-picker">
      <p className="picker-intro">
        {ja.connect.introBefore}
        <strong>{displayTitle(source)}</strong>
        {ja.connect.introAfter}
      </p>

      {others === 0 ? (
        <p className="empty-text">{ja.connect.needAnother}</p>
      ) : (
        <>
          <div className="picker-tools">
            <input
              className="input"
              type="search"
              data-autofocus
              placeholder={ja.connect.searchPlaceholder}
              aria-label={ja.connect.searchAria}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
            <button type="button" className="button button-ghost picker-universe" onClick={onPickInUniverse}>
              <TargetIcon />
              {ja.connect.pickInUniverse}
            </button>
          </div>

          <ul className="picker-list" aria-label={ja.connect.listLabel}>
            {candidates.map((n) => {
              const isConnected = connected.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    className="picker-item"
                    disabled={isConnected}
                    onClick={() => onPick(n.id)}
                  >
                    <CategoryIcon category={n.category} size={20} />
                    <span className="picker-item-text">
                      <span className="picker-item-title">{displayTitle(n)}</span>
                      <span className="picker-item-meta">{CATEGORIES[n.category].label}</span>
                    </span>
                    {isConnected && <span className="badge">{ja.connect.alreadyConnected}</span>}
                  </button>
                </li>
              );
            })}
            {candidates.length === 0 && <li className="empty-text">{ja.connect.noMatch(query)}</li>}
          </ul>
        </>
      )}
    </Modal>
  );
}
