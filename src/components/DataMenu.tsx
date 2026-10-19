import { useEffect, useRef, useState } from 'react';
import { MenuIcon } from './icons';

interface DataMenuProps {
  onExport: () => void;
  onImportFile: (file: File) => void;
  onFitAll: () => void;
  onShowHelp: () => void;
}

/** "⋯" menu with view and backup options. */
export function DataMenu({ onExport, onImportFile, onFitAll, onShowHelp }: DataMenuProps) {
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
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MenuIcon />
      </button>
      {open && (
        <div className="menu-popover" role="menu">
          <button type="button" role="menuitem" className="menu-item" onClick={run(onFitAll)}>
            Show whole universe
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={run(onShowHelp)}>
            How to explore
          </button>
          <div className="menu-separator" role="separator" />
          <button type="button" role="menuitem" className="menu-item" onClick={run(onExport)}>
            Export backup (.json)
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={run(() => fileRef.current?.click())}>
            Import backup…
          </button>
          <p className="menu-note">Stars are saved in this browser only.</p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
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
