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

    if (s.includes('ONLINE')) {
      return (
        <Badge variant="success" size="sm" icon={<CheckCircle className="w-3 h-3" />}>
          {state}
        </Badge>
      );
    }
    if (s === 'STALE') {
      return (
        <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3" />}>
          Stale
        </Badge>
      );
    }
    if (s === 'MISSING') {
      return (
        <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
          Missing
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
      {/* Subframe Studio Header */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>Studio</span>
            <span>&gt;</span>
            <span>Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Preferences &amp; System
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Configure output destination directory, browser authentication, and desktop diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-solid border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shrink-0">
          <div className="flex h-2 w-2 flex-none items-start rounded-full bg-[#22c55e]" />
          <span className="text-xs font-bold text-[#86efac]">
            Engine ready
          </span>
        </div>
      </header>

      {/* General Preferences Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-xl border border-solid border-[#1e1e2a] bg-[#12121a] px-6 py-6 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e1e2a] w-full">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[#f4f4f7] font-heading">
              General Preferences
            </span>
          </div>
          <Badge variant="default" size="sm">
            v{pkg.version}
          </Badge>
        </div>

        <div className="w-full space-y-4">
          {/* Output Destination Well */}
          <div className="p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9a9aac] block">
                Default Destination Directory
              </span>
              <span className="font-mono text-xs text-[#d4d4de] block mt-1 select-all truncate" title={globalOutputDir}>
                {globalOutputDir || 'System Default (~/Downloads)'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectOutputDir}
              className="shrink-0 self-start sm:self-auto font-bold text-xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Change Directory</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Browser Authentication Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-xl border border-solid border-[#1e1e2a] bg-[#12121a] px-6 py-6 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e1e2a] w-full">
          <div>
            <h2 className="text-sm font-bold text-[#f4f4f7] font-heading">
              Browser Authentication
            </h2>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              Authenticate your session to unlock age-restricted, private, and member-only YouTube streams.
            </p>
          </div>
        </div>

        <div className="w-full p-4 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9a9aac]">
                Cookie Vault Status:
              </span>
              {renderStatusPill(cookieStatus === 'active' ? 'ONLINE' : cookieStatus)}
              <span className="text-xs font-mono text-[#a78bfa]">
                ({cookieBrowser})
              </span>
            </div>
            <span className="text-xs text-[#7a7a8c] block">
              {cookieSyncDate
                ? `Last synchronized: ${new Date(cookieSyncDate).toLocaleString()}`
                : 'Cookies have not yet been synchronized on this workstation.'}
            </span>
          </div>

          <Button
            variant={cookieStatus === 'active' ? 'outline' : 'primary'}
            size="sm"
            onClick={onOpenCookieWizard}
            className="shrink-0 self-start sm:self-auto font-bold text-xs"
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>{cookieStatus === 'active' ? 'Re-sync Cookies' : 'Configure Cookies'}</span>
          </Button>
        </div>
      </section>

      {/* System Status & Diagnostics Panel */}
      <section className="flex w-full flex-col items-start gap-5 rounded-xl border border-solid border-[#1e1e2a] bg-[#12121a] px-6 py-6 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e1e2a] w-full">
          <div>
            <h2 className="text-sm font-bold text-[#f4f4f7] font-heading">
              System Diagnostics
            </h2>
            <p className="text-xs text-[#7a7a8c] mt-0.5">
              Verify runtime availability of Python binary, FFmpeg codecs, and shared DLL modules.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            isLoading={isRefreshingStatus}
            title="Refresh component health"
            className="text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin text-[#a78bfa]' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
          {/* Backend Runtime */}
          <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#a78bfa]" />
                Python Backend
              </span>
              {renderStatusPill(systemStatus.backend?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2"
              title={systemStatus.backend?.path}
            >
              {systemStatus.backend?.path || 'Checking runtime path...'}
            </span>
          </div>

          {/* FFmpeg */}
          <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#a78bfa]" />
                FFmpeg Binary
              </span>
              {renderStatusPill(systemStatus.ffmpeg?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2"
              title={systemStatus.ffmpeg?.path}
            >
              {systemStatus.ffmpeg?.path || 'Checking binary path...'}
            </span>
          </div>

          {/* FFprobe */}
          <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-[#f4f4f7] flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-[#a78bfa]" />
                FFprobe Binary
              </span>
              {renderStatusPill(systemStatus.ffprobe?.state || 'CHECKING')}
            </div>
            <span
              className="font-mono text-[11px] text-[#5c5c6e] truncate block mt-2"
              title={systemStatus.ffprobe?.path}
            >
              {systemStatus.ffprobe?.path || 'Checking probe path...'}
            </span>
          </div>

          {/* Developer Logs Action */}
          <div className="p-3.5 bg-[#0b0b10] border border-[#1e1e2a] rounded-lg flex items-center justify-between gap-3">
            <div className="min-w-0 pr-1">
              <span className="text-xs font-bold text-[#f4f4f7] block truncate">
                Developer Logs
              </span>
              <span className="text-[11px] text-[#5c5c6e] block mt-0.5 truncate">
                Monitor subprocess streams
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenLogs} className="shrink-0 whitespace-nowrap text-xs font-bold">
              <Terminal className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span>Show Logs</span>
            </Button>
          </div>
        </div>

        {/* Collapsible DLLs Section */}
        {systemStatus.dlls && systemStatus.dlls.length > 0 && (
          <div className="pt-2 w-full">
            <button
              type="button"
              onClick={() => setShowDlls(!showDlls)}
              className="flex items-center justify-between w-full p-2.5 text-xs font-bold text-[#9a9aac] hover:text-[#f4f4f7] transition rounded-lg hover:bg-[#14141d]"
            >
              <span>Bundled Shared Libraries ({systemStatus.dlls.length} DLLs detected)</span>
              {showDlls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDlls && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-3 bg-[#0b0b10] rounded-lg border border-[#1e1e2a]">
                {systemStatus.dlls.map((dll) => (
                  <div
                    key={dll.name}
                    className="p-2 bg-[#14141d] rounded border border-[#1e1e2a] text-xs font-mono flex items-center justify-between"
                    title={dll.path}
                  >
                    <span className="truncate mr-1 text-[#f4f4f7]">{dll.name}</span>
                    <span className="text-[#22c55e] shrink-0 font-bold">OK</span>
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
