import { ja } from '../i18n/ja';
import { HistoryIcon, NotesIcon, OrbitIcon, PlusIcon, SettingsIcon } from './icons';

export type View = 'notes' | 'map';

interface TabBarProps {
  view: View;
  /** Dark glass, for when the black menu is behind the bar. */
  dark?: boolean;
  onViewChange: (view: View) => void;
  onCreate: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

/**
 * The floating bar at the bottom, iOS style: a frosted-glass pill with
 * メモ · 星図 · 歴史 · 設定, and a round ＋ on its own at the right.
 */
export function TabBar({ view, dark = false, onViewChange, onCreate, onOpenHistory, onOpenSettings }: TabBarProps) {
  const t = ja.tabs;
  return (
    <div className={`tabbar ${dark ? 'is-dark' : ''}`}>
      <nav className="tabbar-pill" aria-label={t.label}>
        <button
          type="button"
          className={`tab ${view === 'notes' ? 'is-active' : ''}`}
          aria-current={view === 'notes' ? 'page' : undefined}
          onClick={() => onViewChange('notes')}
        >
          <NotesIcon />
          <span className="tab-label">{t.notes}</span>
        </button>
        <button
          type="button"
          className={`tab ${view === 'map' ? 'is-active' : ''}`}
          aria-current={view === 'map' ? 'page' : undefined}
          onClick={() => onViewChange('map')}
        >
          <OrbitIcon />
          <span className="tab-label">{t.map}</span>
        </button>
        <button type="button" className="tab" onClick={onOpenHistory}>
          <HistoryIcon />
          <span className="tab-label">{t.history}</span>
        </button>
        <button type="button" className="tab" onClick={onOpenSettings}>
          <SettingsIcon />
          <span className="tab-label">{t.settings}</span>
        </button>
      </nav>
      <button type="button" className="tab-create" onClick={onCreate} aria-label={t.create} title={t.create}>
        <PlusIcon />
      </button>
    </div>
  );
}
