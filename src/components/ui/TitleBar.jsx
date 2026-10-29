import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

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

      {/* Window Controls & Branding */}
      <div className="flex items-center gap-3.5 no-drag-region">
        {/* Mockup Traffic Lights / Quick Control Dots */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Window"
            title="Close"
            className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600 hover:opacity-80 transition cursor-pointer"
          />
          <button
            type="button"
            onClick={handleMinimize}
            aria-label="Minimize Window"
            title="Minimize"
            className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600 hover:opacity-80 transition cursor-pointer"
          />
          <button
            type="button"
            onClick={handleMaximize}
            aria-label={isMaximized ? 'Restore Window' : 'Maximize Window'}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="w-3 h-3 rounded-full bg-purple-500/80 border border-purple-600 hover:opacity-80 transition cursor-pointer"
          />
        </div>
        <div className="h-4 w-[1px] bg-purple-900/40 mx-0.5" />

        {/* App Brand Mark & Release Tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-accent-violet via-purple-500 to-accent-amethyst p-[1px] shadow-sm shadow-purple-900/40">
            <div className="w-full h-full bg-obsidian-900 rounded-[5px] flex items-center justify-center overflow-hidden">
              <span className="font-mono font-bold text-xs bg-gradient-to-r from-accent-neon to-purple-200 bg-clip-text text-transparent">
                H
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-100 tracking-wide font-sans">
              Hermanos Forge
            </span>
            <span className="font-mono text-[10px] text-purple-300 bg-purple-950/70 border border-purple-700/40 px-1.5 py-0.5 rounded">
              v1.1.0-pro
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
        <span className="text-[11px] font-medium text-slate-200">Engine Active</span>
        <span className="text-purple-400/60 text-[10px]">•</span>
        <span className="text-[10px] font-mono text-purple-300">yt-dlp core</span>
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
