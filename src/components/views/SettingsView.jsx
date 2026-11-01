import { useState } from 'react';
import {
  FolderOpen,
  Cookie,
  Server,
  RefreshCw,
  Terminal,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  ShieldCheck,
  HardDrive,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import pkg from '../../../package.json';

export function SettingsView({
  globalOutputDir,
  onSelectOutputDir,
  cookieBrowser,
  cookieStatus,
  cookieSyncDate,
  onOpenCookieWizard,
  systemStatus,
  isRefreshingStatus,
  onRefreshStatus,
}) {
  const [showDlls, setShowDlls] = useState(false);

  const renderStatusPill = (state) => {
    if (!state) return null;
    const s = String(state).toUpperCase();

    if (s.includes('ONLINE') || s === 'ACTIVE') {
      return (
        <Badge variant="success" size="sm" icon={<CheckCircle className="w-3 h-3" />}>
          ONLINE
        </Badge>
      );
    }
    if (s === 'STALE') {
      return (
        <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>
          STALE
        </Badge>
      );
    }
    if (s === 'MISSING') {
      return (
        <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
          MISSING
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        {state}
      </Badge>
    );
  };

  const handleOpenLogs = () => {
    if (window.electronAPI && window.electronAPI.openLogsWindow) {
      window.electronAPI.openLogsWindow();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Studio Header HUD */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>STUDIO</span>
            <span>&gt;</span>
            <span className="text-[#a78bfa]">SYSTEM</span>
            <span>&gt;</span>
            <span className="text-[#f4f4f7]">PREFERENCES &amp; ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Preferences &amp; Engine Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Configure storage destinations, manage browser session tokens, and inspect hardware codec acceleration.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            <span className="text-xs font-bold text-[#86efac]">
              Engine Ready
            </span>
          </div>
        </div>
      </header>

      {/* General Storage Preferences */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1e1e2a] w-full">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-[#a78bfa]" />
            <h2 className="text-sm font-bold text-[#f4f4f7] font-heading">
              Storage &amp; File Destinations
            </h2>
          </div>
          <Badge variant="default" size="sm" className="font-mono text-xs">
            Forge Studio v{pkg.version}
          </Badge>
        </div>

        <div className="w-full space-y-4">
          {/* Destination Directory Card */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] block font-mono">
                DEFAULT DOWNLOAD DESTINATION DIRECTORY
              </span>
              <span
                className="font-mono text-xs sm:text-sm text-[#f4f4f7] block mt-1.5 select-all truncate"
                title={globalOutputDir}
              >
                {globalOutputDir || 'System Default (~/Downloads)'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectOutputDir}
              className="shrink-0 self-start sm:self-auto font-bold text-xs px-4 border-[#2a2a3a]"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Change Directory</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Browser Authentication Studio */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1e1e2a] w-full">
          <div>
            <div className="flex items-center gap-2">
              <Cookie className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="text-sm font-bold text-[#f4f4f7] font-heading">
                Browser Cookie Authentication
              </h2>
            </div>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              Authenticate YouTube session tokens to bypass bot detection and unlock member-only streams.
            </p>
          </div>
        </div>

        <div className="w-full p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] font-mono">
                SESSION VAULT:
              </span>
              {renderStatusPill(cookieStatus === 'active' ? 'ONLINE' : cookieStatus)}
              <span className="text-xs font-mono text-[#a78bfa] font-bold">
                {cookieBrowser} Profile
              </span>
            </div>
            <span className="text-xs text-[#7a7a8c] block font-mono">
              {cookieSyncDate
                ? `Last synchronized: ${new Date(cookieSyncDate).toLocaleString()}`
                : 'Cookies have not yet been synchronized on this workstation.'}
            </span>
          </div>

          <Button
            variant={cookieStatus === 'active' ? 'outline' : 'primary'}
            size="sm"
            onClick={onOpenCookieWizard}
            className="shrink-0 self-start sm:self-auto font-bold text-xs px-4"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>{cookieStatus === 'active' ? 'Re-sync Cookies' : 'Launch Cookie Wizard'}</span>
          </Button>
        </div>

        {/* Privacy & Domain Whitelist Notice */}
        <div className="p-3.5 rounded-xl bg-[#0b0b10]/60 border border-[#1e1e2a] flex items-center gap-3 text-xs text-[#7a7a8c]">
          <ShieldCheck className="w-4 h-4 text-[#22c55e] shrink-0" />
          <span>
            Privacy Notice: Cookies are stored locally at <code className="text-[#a78bfa] font-mono">%AppData%\Hermanos Forge\cookies.txt</code> and whitelisted strictly to <code className="text-[#a78bfa] font-mono">.youtube.com</code> and <code className="text-[#a78bfa] font-mono">.google.com</code>.
          </span>
        </div>
      </section>

      {/* System Status & Runtime Diagnostics */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1e1e2a] w-full">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#a78bfa]" />
              <h2 className="text-sm font-bold text-[#f4f4f7] font-heading">
                System Runtime Diagnostics
              </h2>
            </div>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              Verify runtime availability of Python core binary, FFmpeg codecs, and hardware acceleration.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            isLoading={isRefreshingStatus}
            title="Refresh component health"
            className="text-xs font-bold border-[#2a2a3a]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin text-[#a78bfa]' : ''}`} />
            <span>Refresh Diagnostics</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {/* Backend Runtime */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl shadow-inner">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#a78bfa]" />
                Python Backend Worker
              </span>
              {renderStatusPill(systemStatus.backend?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2.5"
              title={systemStatus.backend?.path}
            >
              {systemStatus.backend?.path || 'Checking runtime path...'}
            </span>
          </div>

          {/* FFmpeg */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl shadow-inner">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#a78bfa]" />
                FFmpeg Transcoder
              </span>
              {renderStatusPill(systemStatus.ffmpeg?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2.5"
              title={systemStatus.ffmpeg?.path}
            >
              {systemStatus.ffmpeg?.path || 'Checking binary path...'}
            </span>
          </div>

          {/* FFprobe */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl shadow-inner">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#a78bfa]" />
                FFprobe Stream Inspector
              </span>
              {renderStatusPill(systemStatus.ffprobe?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2.5"
              title={systemStatus.ffprobe?.path}
            >
              {systemStatus.ffprobe?.path || 'Checking probe path...'}
            </span>
          </div>

          {/* Developer Logs Action */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl flex items-center justify-between gap-3 shadow-inner">
            <div className="min-w-0 pr-1">
              <span className="text-xs font-bold text-[#f4f4f7] block truncate">
                Subprocess Event Stream
              </span>
              <span className="text-[11px] text-[#5c5c6e] block mt-0.5 truncate font-mono">
                Real-time terminal window
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenLogs}
              className="shrink-0 whitespace-nowrap text-xs font-bold border-[#2a2a3a]"
            >
              <Terminal className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Launch Terminal</span>
            </Button>
          </div>
        </div>

        {/* Collapsible DLLs Section */}
        {systemStatus.dlls && systemStatus.dlls.length > 0 && (
          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={() => setShowDlls(!showDlls)}
              className="flex items-center justify-between w-full p-3 text-xs font-bold text-[#9a9aac] hover:text-[#f4f4f7] transition rounded-xl hover:bg-[#14141d] cursor-pointer"
            >
              <span>Bundled Hardware Codec Libraries ({systemStatus.dlls.length} DLLs active)</span>
              {showDlls ? <ChevronUp className="w-4 h-4 text-[#a78bfa]" /> : <ChevronDown className="w-4 h-4 text-[#7a7a8c]" />}
            </button>

            {showDlls && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-3 bg-[#0b0b10] rounded-xl border border-[#1e1e2a]">
                {systemStatus.dlls.map((dll) => (
                  <div
                    key={dll.name}
                    className="p-2 bg-[#14141d] rounded-lg border border-[#1e1e2a] text-xs font-mono flex items-center justify-between"
                    title={dll.path}
                  >
                    <span className="truncate mr-1 text-[#f4f4f7]">{dll.name}</span>
                    <span className="text-[#22c55e] shrink-0 font-bold text-[10px]">OK</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsView;
