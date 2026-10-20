import { useEffect, useRef, useState } from 'react';
import { ja } from '../i18n/ja';
import { isAppleMobile } from '../storage/backupFile';
import { MenuIcon } from './icons';

interface DataMenuProps {
  onExport: () => void;
  onImportFile: (file: File) => void;
  onFitAll: () => void;
  onShowHelp: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  /** Only set while the passcode lock is on. */
  onLockNow?: () => void;
}

/** "⋯" menu with view and backup options. */
export function DataMenu({
  onExport,
  onImportFile,
  onFitAll,
  onShowHelp,
  onOpenSettings,
  onOpenHistory,
  onLockNow,
}: DataMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="menu" ref={wrapRef}>
      <button
        type="button"
        className="icon-button topbar-button"
        aria-label={ja.topbar.moreOptions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon />
      </button>
      {open && (
        <div className="menu-popover" role="menu">
          <button type="button" role="menuitem" className="menu-item" onClick={run(onFitAll)}>
            {ja.menu.fitAll}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={run(onOpenHistory)}>
            {ja.menu.history}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={run(onShowHelp)}>
            {ja.menu.help}
          </button>
          <div className="menu-separator" role="separator" />
          <button type="button" role="menuitem" className="menu-item" onClick={run(onExport)}>
            {ja.menu.export}
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={run(() => fileRef.current?.click())}>
            {ja.menu.import}
          </button>
          <div className="menu-separator" role="separator" />
          <button type="button" role="menuitem" className="menu-item" onClick={run(onOpenSettings)}>
            {ja.menu.settings}
          </button>
          {onLockNow && (
            <button type="button" role="menuitem" className="menu-item" onClick={run(onLockNow)}>
              {ja.menu.lockNow}
            </button>
          )}
          <p className="menu-note">{ja.menu.note}</p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        // iOS may grey out .json files when a file type filter is set, so only filter on other systems.
        accept={isAppleMobile() ? undefined : 'application/json,.json'}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onImportFile(file);
        }}
      />
    </div>
  );
}
