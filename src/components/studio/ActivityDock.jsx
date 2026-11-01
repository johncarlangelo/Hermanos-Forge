import {
  Download,
  Scissors,
  Film,
  Clock,
  Settings,
  FolderOpen,
  Cookie,
  PanelRightClose,
  PanelRightOpen,
  Flame,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';

export function ActivityDock({
  activeTab,
  setActiveTab,
  historyCount = 0,
  cookieBrowser = 'Firefox',
  cookieStatus = 'missing',
  onOpenCookieWizard,
  globalOutputDir = '',
  onOpenOutputModal,
  isInspectorOpen = true,
  onToggleInspector,
}) {
  const primaryTools = [
    {
      id: 'download',
      label: 'Media Workbench',
      hotkey: '1',
      icon: <Download className="w-5 h-5" />,
      description: 'Single Stream Inspector & Direct Forge',
    },
    {
      id: 'mass-clip',
      label: 'Multi-Track Stitcher',
      hotkey: '2',
      badge: 'Batch',
      icon: <Scissors className="w-5 h-5" />,
      description: 'Multi-Clip Sequence Assembly & Concat Engine',
    },
    {
      id: 'selective',
      label: 'Timeline Trimmer',
      hotkey: '3',
      icon: <Film className="w-5 h-5" />,
      description: 'Precision Frame & Waveform Splicing',
    },
  ];

  const utilityTools = [
    {
      id: 'history',
      label: 'History Ledger',
      hotkey: '4',
      badge: historyCount > 0 ? String(historyCount) : null,
      icon: <Clock className="w-5 h-5" />,
      description: 'Render History & Output Archive',
    },
    {
      id: 'settings',
      label: 'Studio Settings',
      hotkey: '5',
      icon: <Settings className="w-5 h-5" />,
      description: 'Engine Diagnostics & Preferences',
    },
  ];

  const destinationFolderDisplay = globalOutputDir
    ? globalOutputDir.split(/[/\\]/).pop() || 'Destination'
    : 'System ~/Downloads';

  return (
    <aside
      className="w-16 shrink-0 bg-[#0a0a0f] border-r border-[#1e1e2a] flex flex-col justify-between items-center py-3 select-none z-20 relative"
      aria-label="Studio Activity Dock"
      data-purpose="studio-activity-dock"
    >
      {/* Top Section: Forge Studio Emblem & Tool Navigation */}
      <div className="flex flex-col items-center w-full gap-3">
        {/* Studio Brand Emblem */}
        <Tooltip content="Hermanos Forge Media Studio" position="right" delay={100}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center shadow-lg shadow-violet-950/40 border border-violet-500/30 cursor-default group transition-transform hover:scale-105">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
        </Tooltip>

        <div className="w-8 h-[1px] bg-[#1e1e2a] my-0.5" />

        {/* Primary Studio Tools */}
        <nav aria-label="Primary Studio Tools" className="flex flex-col items-center gap-2 w-full px-2">
          {primaryTools.map((tool) => {
            const isActive = activeTab === tool.id;
            return (
              <Tooltip
                key={tool.id}
                content={`${tool.label} (Ctrl+${tool.hotkey}) — ${tool.description}`}
                position="right"
                delay={80}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab(tool.id)}
                  aria-label={tool.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center relative transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#7c3aed26] border border-[#7c3aed66] text-[#ede9fe] shadow-md shadow-violet-950/30'
                      : 'border border-transparent hover:border-[#2a2a3a] hover:bg-[#ffffff0a] text-[#7a7a8c] hover:text-[#f4f4f7]'
                  }`}
                >
                  {/* Left Blade Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8b5cf6] shadow-sm shadow-[#8b5cf6]" />
                  )}

                  {/* Icon */}
                  <span className={`transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#7a7a8c]'}`}>
                    {tool.icon}
                  </span>

                  {/* Mini Hotkey Pill */}
                  <span className="absolute bottom-1 right-1 font-mono text-[9px] text-[#5c5c6e] leading-none pointer-events-none">
                    {tool.hotkey}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </nav>

        <div className="w-8 h-[1px] bg-[#1e1e2a] my-0.5" />

        {/* Utility Tools */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {utilityTools.map((tool) => {
            const isActive = activeTab === tool.id;
            return (
              <Tooltip
                key={tool.id}
                content={`${tool.label} (Ctrl+${tool.hotkey}) — ${tool.description}`}
                position="right"
                delay={80}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab(tool.id)}
                  aria-label={tool.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center relative transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#7c3aed26] border border-[#7c3aed66] text-[#ede9fe] shadow-md shadow-violet-950/30'
                      : 'border border-transparent hover:border-[#2a2a3a] hover:bg-[#ffffff0a] text-[#7a7a8c] hover:text-[#f4f4f7]'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8b5cf6] shadow-sm shadow-[#8b5cf6]" />
                  )}

                  <span className={`transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#7a7a8c]'}`}>
                    {tool.icon}
                  </span>

                  {/* Badge */}
                  {tool.badge && (
                    <span className="absolute top-1 right-1 font-mono text-[9px] px-1 py-0.2 rounded-full bg-[#7c3aed] text-white font-bold leading-tight">
                      {tool.badge}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Cookie Auth, Output Directory, and Inspector Toggle */}
      <div className="flex flex-col items-center gap-2 w-full px-2 pt-2 border-t border-[#1e1e2a]">
        {/* Cookie Auth Status Capsule */}
        <Tooltip
          content={`Cookie Auth: ${cookieBrowser} (${cookieStatus.toUpperCase()}) — Click to configure`}
          position="right"
          delay={80}
        >
          <button
            type="button"
            onClick={onOpenCookieWizard}
            aria-label="Browser Cookie Authentication"
            className="w-10 h-10 rounded-xl relative border border-[#1e1e2a] bg-[#12121a] hover:bg-[#1e1e2a] hover:border-[#2a2a3a] flex items-center justify-center text-[#a78bfa] transition cursor-pointer"
          >
            <Cookie className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                cookieStatus === 'active'
                  ? 'bg-[#22c55e] ring-2 ring-[#22c55e33]'
                  : cookieStatus === 'stale'
                  ? 'bg-[#facc15] ring-2 ring-[#facc1533]'
                  : 'bg-[#5c5c6e]'
              }`}
            />
          </button>
        </Tooltip>

        {/* Destination Directory Button */}
        <Tooltip
          content={`Output Folder: ${destinationFolderDisplay} — Click to change`}
          position="right"
          delay={80}
        >
          <button
            type="button"
            onClick={onOpenOutputModal}
            aria-label="Change Output Destination"
            className="w-10 h-10 rounded-xl border border-[#1e1e2a] bg-[#12121a] hover:bg-[#1e1e2a] hover:border-[#2a2a3a] flex items-center justify-center text-[#a78bfa] transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Toggle Right Inspector Rail */}
        <Tooltip
          content={`${isInspectorOpen ? 'Collapse' : 'Expand'} Studio Inspector (Ctrl+I)`}
          position="right"
          delay={80}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleInspector}
            aria-label="Toggle Studio Inspector Rail"
            className={`w-10 h-10 rounded-xl border transition cursor-pointer ${
              isInspectorOpen
                ? 'border-[#7c3aed4d] bg-[#7c3aed1a] text-[#c4b5fd]'
                : 'border-[#1e1e2a] bg-[#12121a] hover:bg-[#1e1e2a] text-[#7a7a8c] hover:text-[#f4f4f7]'
            }`}
          >
            {isInspectorOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </Button>
        </Tooltip>
      </div>
    </aside>
  );
}
