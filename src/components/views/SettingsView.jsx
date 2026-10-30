import { useState } from 'react';
import {
  Settings,
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
import { Card, CardContent } from '@/components/ui/Card';
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
      {/* General Preferences */}
      <Card className="surface-panel">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-accent-neon shadow-sm shrink-0">
                <Settings className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight font-heading">
                  Preferences &amp; System
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Configure output destination directory, browser authentication, and desktop defaults.
                </p>
              </div>
            </div>
            <Badge variant="default" size="md">
              v{pkg.version}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Output Destination */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  Default Destination Directory
                </span>
                <span className="font-mono text-xs sm:text-sm text-[var(--text-secondary)] block mt-1 select-all truncate" title={globalOutputDir}>
                  {globalOutputDir || 'System Default (~/Downloads)'}
                </span>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={onSelectOutputDir}
                className="shrink-0 self-start sm:self-auto font-semibold text-xs sm:text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Change Directory</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Authentication */}
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--accent-muted)] text-[var(--accent-primary)]">
                <Cookie className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] font-heading">
                  Browser Authentication
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Authenticate your session to unlock age-restricted, private, and member-only YouTube streams.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Cookie Vault Status:
                </span>
                {renderStatusPill(cookieStatus === 'active' ? 'ONLINE' : cookieStatus)}
                <span className="text-xs sm:text-sm font-mono text-[var(--text-secondary)]">
                  ({cookieBrowser})
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--text-secondary)] block">
                {cookieSyncDate
                  ? `Last synchronized: ${new Date(cookieSyncDate).toLocaleString()}`
                  : 'Cookies have not yet been synchronized on this workstation.'}
              </span>
            </div>

            <Button
              variant={cookieStatus === 'active' ? 'outline' : 'primary'}
              size="md"
              onClick={onOpenCookieWizard}
              className="shrink-0 self-start sm:self-auto font-semibold text-xs sm:text-sm"
            >
              <Cookie className="w-4 h-4" />
              <span>{cookieStatus === 'active' ? 'Re-sync Cookies' : 'Configure Cookies'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status & Diagnostics */}
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--accent-muted)] text-[var(--accent-primary)]">
                <Server className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] font-heading">
                  System Diagnostics
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Verify runtime availability of Python binary, FFmpeg codecs, and shared DLL modules.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="md"
              onClick={onRefreshStatus}
              isLoading={isRefreshingStatus}
              title="Refresh component health"
              className="text-xs sm:text-sm font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Backend Runtime */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--accent-primary)]" />
                  Python Backend
                </span>
                {renderStatusPill(systemStatus.backend?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-xs text-[var(--text-tertiary)] truncate block mt-2"
                title={systemStatus.backend?.path}
              >
                {systemStatus.backend?.path || 'Checking runtime path...'}
              </span>
            </div>

            {/* FFmpeg */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[var(--accent-primary)]" />
                  FFmpeg Binary
                </span>
                {renderStatusPill(systemStatus.ffmpeg?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-xs text-[var(--text-tertiary)] truncate block mt-2"
                title={systemStatus.ffmpeg?.path}
              >
                {systemStatus.ffmpeg?.path || 'Checking binary path...'}
              </span>
            </div>

            {/* FFprobe */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl">
              <div className="flex items-center justify-between gap-2.5">
                <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Server className="w-4 h-4 text-[var(--accent-primary)]" />
                  FFprobe Binary
                </span>
                {renderStatusPill(systemStatus.ffprobe?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-xs text-[var(--text-tertiary)] truncate block mt-2"
                title={systemStatus.ffprobe?.path}
              >
                {systemStatus.ffprobe?.path || 'Checking probe path...'}
              </span>
            </div>

            {/* Developer Logs Action */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0 pr-1">
                <span className="text-sm font-semibold text-[var(--text-primary)] block truncate">
                  Developer Logs
                </span>
                <span className="text-xs text-[var(--text-tertiary)] block mt-0.5 truncate">
                  Monitor subprocess streams
                </span>
              </div>
              <Button variant="secondary" size="md" onClick={handleOpenLogs} className="shrink-0 whitespace-nowrap text-xs sm:text-sm font-semibold">
                <Terminal className="w-4 h-4" />
                <span>Show Logs</span>
              </Button>
            </div>
          </div>

          {/* Collapsible DLLs Section */}
          {systemStatus.dlls && systemStatus.dlls.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDlls(!showDlls)}
                className="flex items-center justify-between w-full p-2.5 text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
              >
                <span>Bundled Shared Libraries ({systemStatus.dlls.length} DLLs detected)</span>
                {showDlls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDlls && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5 p-3 bg-[var(--surface-2)]/60 rounded-xl border border-[var(--border-subdued)]">
                  {systemStatus.dlls.map((dll) => (
                    <div
                      key={dll.name}
                      className="p-2 bg-[var(--surface-1)] rounded-lg border border-[var(--border-subdued)] text-xs font-mono flex items-center justify-between"
                      title={dll.path}
                    >
                      <span className="truncate mr-1 text-[var(--text-primary)]">{dll.name}</span>
                      <span className="text-[var(--status-success)] shrink-0 font-bold">OK</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsView;
