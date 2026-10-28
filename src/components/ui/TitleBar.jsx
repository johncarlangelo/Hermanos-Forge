import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import iconUrl from '@/assets/icon.svg';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    if (window.electronAPI.isMaximizedWindow) {
      window.electronAPI.isMaximizedWindow().then((max) => {
        setIsMaximized(!!max);
      }).catch(() => {});
    }

    if (window.electronAPI.onMaximizedChange) {
      const unsub = window.electronAPI.onMaximizedChange((max) => {
        setIsMaximized(max);
      });
      return () => unsub && unsub();
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI && window.electronAPI.maximizeWindow) {
      const state = await window.electronAPI.maximizeWindow();
      setIsMaximized(state);
    }
  };

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <header className="h-9 w-full bg-[var(--surface-1)] border-b border-[var(--border-subdued)] select-none flex items-center justify-between px-3 shrink-0 drag-region z-40 relative">
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {/* Brand & App Title */}
      <div className="flex items-center gap-2.5 no-drag-region">
        <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 flex items-center justify-center shadow-sm">
          <img
            src={iconUrl}
            alt="Hermanos Forge"
            className="w-3.5 h-3.5 object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight">
            Hermanos Forge
          </span>
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
            v1.1.0
          </span>
        </div>
      </div>

      {/* Center Drag Region Context / Subdued Tag */}
      <div className="hidden sm:flex items-center gap-2 drag-region">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-2)]/80 text-[10px] text-[var(--text-secondary)] font-medium">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span>Engine Active</span>
        </div>
      </div>

      {/* Window Controls & Quick Actions */}
      <div className="flex items-center h-full no-drag-region -mr-3">
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize"
          className="h-9 w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors duration-100"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="h-9 w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors duration-100"
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="h-9 w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-rose-600 transition-colors duration-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

export default TitleBar;
