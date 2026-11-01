import { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Activity } from 'lucide-react';
import appIcon from '@/assets/icon.svg';

const BREADCRUMB_MAP = {
  download: { section: 'WORKBENCH', page: 'SINGLE STREAM' },
  'mass-clip': { section: 'BATCH STUDIO', page: 'CLIP STITCHER' },
  selective: { section: 'TIMELINE', page: 'KEYFRAME TRIMMER' },
  history: { section: 'ARCHIVE', page: 'DOWNLOAD LEDGER' },
  settings: { section: 'SYSTEM', page: 'PREFERENCES' },
};

export function TitleBar({ activeTab = 'download' }) {
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

  const breadcrumb = BREADCRUMB_MAP[activeTab] || BREADCRUMB_MAP.download;

  return (
    <header className="h-11 w-full bg-[#0a0a0f] border-b border-[#1e1e2a] select-none flex items-center justify-between px-3 sm:px-4 shrink-0 drag-region z-40 relative">
      {/* Top specular highlight line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#7c3aed40] to-transparent pointer-events-none" />

      {/* Left: Branding & Studio Release Pill */}
      <div className="flex items-center gap-3 no-drag-region">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-6 h-6 rounded-md bg-[#12121a] border border-[#2a2a3a] shadow-sm">
            <img
              src={appIcon}
              alt="Hermanos Forge"
              draggable="false"
              className="w-4 h-4 rounded object-contain select-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#f4f4f7] tracking-tight font-sans">
              HERMANOS FORGE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold text-[#a78bfa] bg-[#7c3aed1a] border border-[#7c3aed33] px-1.5 py-0.5 rounded tracking-wide">
              PRO STUDIO
            </span>
          </div>
        </div>

        {/* Dynamic Studio Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-[#1e1e2a] text-[11px] font-mono text-[#7a7a8c]">
          <span className="text-[#5c5c6e]">STUDIO</span>
          <span className="text-[#3a3a4e]">/</span>
          <span className="text-[#8b5cf6] font-semibold">{breadcrumb.section}</span>
          <span className="text-[#3a3a4e]">/</span>
          <span className="text-[#d4d4de]">{breadcrumb.page}</span>
        </div>
      </div>

      {/* Center: Live Core Diagnostics Status Pill */}
      <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#0d0d14] border border-[#1e1e2a] shadow-inner drag-region">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
        </span>
        <span className="text-[11px] font-medium text-[#d4d4de] tracking-tight">ENGINE ACTIVE</span>
        <span className="text-[#3a3a4e] text-xs">•</span>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#a78bfa]">
          <Activity className="w-3 h-3 text-[#22c55e]" />
          <span>yt-dlp core</span>
        </div>
      </div>

      {/* Right: Tactile Window Controls */}
      <div className="flex items-center h-full no-drag-region -mr-3 sm:-mr-4">
        <button
          type="button"
          onClick={handleMinimize}
          aria-label="Minimize"
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0d] active:bg-[#ffffff14] transition-colors duration-100 cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0d] active:bg-[#ffffff14] transition-colors duration-100 cursor-pointer"
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
          className="h-11 w-11 flex items-center justify-center text-[#7a7a8c] hover:text-white hover:bg-[#ef4444] active:bg-[#dc2626] transition-colors duration-100 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}

export default TitleBar;

