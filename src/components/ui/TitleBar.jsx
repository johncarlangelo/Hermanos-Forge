import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import appIcon from '@/assets/icon.svg';

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
    <header className="h-11 w-full bg-obsidian-950/85 border-b border-purple-900/25 select-none flex items-center justify-between px-3 sm:px-4 shrink-0 drag-region z-40 relative backdrop-blur-md">
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/25 to-transparent pointer-events-none" />

      {/* Branding */}
      <div className="flex items-center gap-3 no-drag-region">
        {/* App Brand Mark & Release Tag */}
        <div className="flex items-center gap-2.5">
          <img
            src={appIcon}
            alt="Hermanos Forge"
            draggable="false"
            className="w-6 h-6 rounded-md object-contain shadow-sm select-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-100 tracking-wide font-sans">
              Hermanos Forge
            </span>
            <span className="font-mono text-xs text-purple-300 bg-purple-950/70 border border-purple-700/40 px-1.5 py-0.5 rounded">
              v1.1.0
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian-950/90 border border-purple-800/40 shadow-inner drag-region">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-violet opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-neon shadow-glow-violet" />
        </span>
        <span className="text-xs font-medium text-slate-200">Engine Active</span>
        <span className="text-purple-400/60 text-xs">•</span>
        <span className="text-xs font-mono text-purple-300">yt-dlp core</span>
      </div>

      {/* Window Controls & Quick Actions */}
      <div className="flex items-center h-full no-drag-region -mr-3 sm:-mr-4">
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize"
          className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-purple-200 hover:bg-purple-950/40 transition-colors duration-100"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-purple-200 hover:bg-purple-950/40 transition-colors duration-100"
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
          className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors duration-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

export default TitleBar;
