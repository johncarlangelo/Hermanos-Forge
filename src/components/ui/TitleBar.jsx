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
    <header className="h-11 w-full bg-[#0f0f16] border-b border-[#1e1e2a] select-none flex items-center justify-between px-3 sm:px-4 shrink-0 drag-region z-40 relative">
      {/* Branding */}
      <div className="flex items-center gap-3 no-drag-region">
        {/* App Brand Mark & Release Tag */}
        <div className="flex items-center gap-2.5">
          <img
            src={appIcon}
            alt="Hermanos Forge"
            draggable="false"
            className="w-5 h-5 rounded-md object-contain shadow-sm select-none"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#f4f4f7] tracking-wide font-sans">
              Hermanos Forge
            </span>
            <span className="font-mono text-[11px] text-[#a78bfa] bg-[#7c3aed1f] border border-[#7c3aed4d] px-1.5 py-0.5 rounded">
              Studio v1.1
            </span>
          </div>
        </div>
      </div>

      {/* Center Status Badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0b10] border border-[#1e1e2a] shadow-inner drag-region">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
        </span>
        <span className="text-xs font-medium text-[#d4d4de]">Engine Ready</span>
        <span className="text-[#5c5c6e] text-xs">•</span>
        <span className="text-xs font-mono text-[#a78bfa]">yt-dlp core</span>
      </div>

      {/* Window Controls & Quick Actions */}
      <div className="flex items-center h-full no-drag-region -mr-3 sm:-mr-4">
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize"
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition-colors duration-100"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition-colors duration-100"
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
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-white hover:bg-[#ef4444] transition-colors duration-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

export default TitleBar;
