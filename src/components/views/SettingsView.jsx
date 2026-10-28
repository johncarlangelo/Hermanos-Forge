import { useState } from 'react';
import {
  Settings,
  FolderOpen,
  Sun,
  Moon,
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
  theme,
  onThemeToggle,
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
    <div className="space-y-4 max-w-4xl mx-auto w-full pb-6">
      {/* General Preferences */}
      <Card className="surface-panel">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 flex items-center justify-center text-[var(--accent-primary)] shadow-sm shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Preferences & Appearance
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Configure output destination directory, visual theme, and desktop defaults.
                </p>
              </div>
            </div>
            <Badge variant="default" size="sm">
              v{pkg.version}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Output Destination */}
            <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Default Destination Directory
                </span>
                <span className="font-mono text-xs text-[var(--text-secondary)] block mt-0.5 select-all truncate" title={globalOutputDir}>
                  {globalOutputDir || 'System Default (~/Downloads)'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectOutputDir}
                className="shrink-0 self-start sm:self-auto font-medium"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Change Directory</span>
              </Button>
            </div>

            {/* Theme Toggle Tiles */}
            <div className="p-3.5 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Interface Theme
                </span>
                <span className="text-xs text-[var(--text-secondary)] block mt-0.5">
                  Choose between high-contrast Cine Dark or Clean Studio Light.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => theme !== 'dark' && onThemeToggle()}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-[8px] border transition-all duration-150 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[var(--surface-1)] text-[var(--text-primary)] border-teal-500/50 shadow-sm font-bold'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subdued)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-teal-400" />
                  <span>Dark Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => theme !== 'light' && onThemeToggle()}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-[8px] border transition-all duration-150 cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[var(--surface-1)] text-[var(--text-primary)] border-teal-500/50 shadow-sm font-bold'
                      : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subdued)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Studio</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browser Authentication */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[6px] bg-[var(--accent-muted)] text-[var(--accent-primary)]">
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Browser Authentication
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Authenticate your session to unlock age-restricted, private, and member-only YouTube streams.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Cookie Vault Status:
                </span>
                {renderStatusPill(cookieStatus === 'active' ? 'ONLINE' : cookieStatus)}
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  ({cookieBrowser})
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                {cookieSyncDate
                  ? `Last synchronized: ${new Date(cookieSyncDate).toLocaleString()}`
                  : 'Cookies have not yet been synchronized on this workstation.'}
              </span>
            </div>

            <Button
              variant={cookieStatus === 'active' ? 'outline' : 'primary'}
              size="sm"
              onClick={onOpenCookieWizard}
              className="shrink-0 self-start sm:self-auto"
            >
              <Cookie className="w-3.5 h-3.5" />
              <span>{cookieStatus === 'active' ? 'Re-sync Cookies' : 'Configure Cookies'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status & Diagnostics */}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[6px] bg-[var(--accent-muted)] text-[var(--accent-primary)]">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  System Diagnostics
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Verify runtime availability of Python binary, FFmpeg codecs, and shared DLL modules.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshStatus}
              isLoading={isRefreshingStatus}
              title="Refresh component health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Backend Runtime */}
            <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Python Backend
                </span>
                {renderStatusPill(systemStatus.backend?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-[10px] text-[var(--text-tertiary)] truncate block mt-1.5"
                title={systemStatus.backend?.path}
              >
                {systemStatus.backend?.path || 'Checking runtime path...'}
              </span>
            </div>

            {/* FFmpeg */}
            <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  FFmpeg Binary
                </span>
                {renderStatusPill(systemStatus.ffmpeg?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-[10px] text-[var(--text-tertiary)] truncate block mt-1.5"
                title={systemStatus.ffmpeg?.path}
              >
                {systemStatus.ffmpeg?.path || 'Checking binary path...'}
              </span>
            </div>

            {/* FFprobe */}
            <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  FFprobe Binary
                </span>
                {renderStatusPill(systemStatus.ffprobe?.state || 'CHECKING')}
              </div>
              <span
                className="font-mono text-[10px] text-[var(--text-tertiary)] truncate block mt-1.5"
                title={systemStatus.ffprobe?.path}
              >
                {systemStatus.ffprobe?.path || 'Checking probe path...'}
              </span>
            </div>

            {/* Developer Logs Action */}
            <div className="p-3 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-[8px] flex items-center justify-between gap-2.5">
              <div className="min-w-0 pr-1">
                <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                  Developer Logs
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] block mt-0.5 truncate">
                  Monitor subprocess streams
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleOpenLogs} className="shrink-0 whitespace-nowrap">
                <Terminal className="w-3.5 h-3.5" />
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
                className="flex items-center justify-between w-full p-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span>Bundled Shared Libraries ({systemStatus.dlls.length} DLLs detected)</span>
                {showDlls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDlls && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 p-2 bg-[var(--surface-2)]/60 rounded-[6px] border border-[var(--border-subdued)]">
                  {systemStatus.dlls.map((dll) => (
                    <div
                      key={dll.name}
                      className="p-1.5 bg-[var(--surface-1)] rounded-[4px] border border-[var(--border-subdued)] text-[10px] font-mono flex items-center justify-between"
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
