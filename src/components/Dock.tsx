import { ja } from '../i18n/ja';
import { HistoryIcon, ListIcon, OrbitIcon, PlusIcon, SettingsIcon } from './icons';

interface DockProps {
  sidebarOpen: boolean;
  onFitAll: () => void;
  onToggleSidebar: () => void;
  onCreate: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

/** The floating bar at the bottom: 宇宙 · 一覧 · ＋ · 歴史 · 設定. */
export function Dock({ sidebarOpen, onFitAll, onToggleSidebar, onCreate, onOpenHistory, onOpenSettings }: DockProps) {
  const d = ja.dock;
  return (
    <nav className="dock" aria-label={d.label}>
      <button type="button" className="dock-button" onClick={onFitAll} aria-label={d.universe} title={d.universe}>
        <OrbitIcon />
      </button>
      <button
        type="button"
        className={`dock-button ${sidebarOpen ? 'is-active' : ''}`}
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? ja.sidebar.close : ja.sidebar.open}
        title={d.list}
        aria-expanded={sidebarOpen}
        aria-controls="sidebar"
      >
        <ListIcon />
      </button>
      <button type="button" className="dock-create" onClick={onCreate} aria-label={ja.fab} title={ja.fab}>
        <span className="dock-create-orb">
          <PlusIcon />
        </span>
      </button>
      <button type="button" className="dock-button" onClick={onOpenHistory} aria-label={ja.history.open} title={ja.history.open}>
        <HistoryIcon />
      </button>
      <button type="button" className="dock-button" onClick={onOpenSettings} aria-label={d.settings} title={d.settings}>
        <SettingsIcon />
      </button>
    </nav>
  );
}
