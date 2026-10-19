import { useMemo, useState } from 'react';
import { CATEGORIES } from '../domain/categories';
import type { Note, UniverseData } from '../domain/types';
import { matchesQuery, neighborIds } from '../domain/universe';
import { Modal } from './Modal';
import { TargetIcon } from './icons';
import { CategoryIcon } from './universe/CategoryGlyph';

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
          return ca - cb || a.title.localeCompare(b.title);
        }),
    [data.notes, source.id, query, connected],
  );

  const others = data.notes.length - 1;

  return (
    <Modal title="Connect star" onClose={onClose} className="connect-picker">
      <p className="picker-intro">
        Link <strong>{source.title}</strong> to another star.
      </p>

      {others === 0 ? (
        <p className="empty-text">Create another star first, then you can connect them.</p>
      ) : (
        <>
          <div className="picker-tools">
            <input
              className="input"
              type="search"
              data-autofocus
              placeholder="Find a star…"
              aria-label="Find a star to connect"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              enterKeyHint="search"
            />
            <button type="button" className="button button-ghost picker-universe" onClick={onPickInUniverse}>
              <TargetIcon />
              Tap a star in the universe
            </button>
          </div>

          <ul className="picker-list" aria-label="Stars you can connect to">
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
                      <span className="picker-item-title">{n.title}</span>
                      <span className="picker-item-meta">{CATEGORIES[n.category].label}</span>
                    </span>
                    {isConnected && <span className="badge">Connected</span>}
                  </button>
                </li>
              );
            })}
            {candidates.length === 0 && <li className="empty-text">No stars match “{query}”.</li>}
          </ul>
        </>
      )}
    </Modal>
  );
}
