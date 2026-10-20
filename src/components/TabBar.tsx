import { ja } from '../i18n/ja';
import { HistoryIcon, NotesIcon, OrbitIcon, PlusIcon, SettingsIcon } from './icons';

export type View = 'notes' | 'map';

interface TabBarProps {
  view: View;
  onViewChange: (view: View) => void;
  onCreate: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

/** The bar at the bottom: メモ · 星図 · ＋ · 歴史 · 設定. */
export function TabBar({ view, onViewChange, onCreate, onOpenHistory, onOpenSettings }: TabBarProps) {
  const t = ja.tabs;
  return (
    <nav className="tabbar" aria-label={t.label}>
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
      <button type="button" className="tab-create" onClick={onCreate} aria-label={t.create} title={t.create}>
        <span className="tab-create-circle">
          <PlusIcon />
        </span>
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
  );
}
