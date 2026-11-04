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
  DownloadCloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [localEngineUpdate, setLocalEngineUpdate] = useState(null);
  const [isCheckingEngine, setIsCheckingEngine] = useState(false);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState(false);
  const [engineProgress, setEngineProgress] = useState(0);

  const currentEngine = {
    version: localEngineUpdate?.version ?? systemStatus?.ytdlp?.version ?? 'Bundled',
    source: localEngineUpdate?.source ?? systemStatus?.ytdlp?.source ?? 'Bundled',
    path: localEngineUpdate?.path ?? systemStatus?.ytdlp?.path ?? 'Bundled Python Package',
    latestVersion: localEngineUpdate?.latestVersion ?? systemStatus?.ytdlp?.latestVersion ?? null,
    updateAvailable: localEngineUpdate !== null ? localEngineUpdate.updateAvailable : Boolean(systemStatus?.ytdlp?.updateAvailable),
  };

  const handleCheckEngineUpdate = async () => {
    if (!window.electronAPI?.checkEngineVersion) return;
    setIsCheckingEngine(true);
    try {
      const res = await window.electronAPI.checkEngineVersion();
      if (res) {
        setLocalEngineUpdate({
          version: res.currentVersion,
          source: res.source,
          path: res.path,
          latestVersion: res.latestVersion,
          updateAvailable: res.updateAvailable,
        });
        if (res.updateAvailable && res.latestVersion) {
          toast.success(`Update available: v${res.latestVersion}`);
        } else if (res.offline) {
          toast.error('Could not reach update server. Operating in offline mode.');
        } else {
          toast.success(`yt-dlp engine is up to date (v${res.currentVersion}).`);
        }
      }
    } catch (err) {
      toast.error(`Check failed: ${err.message}`);
    } finally {
      setIsCheckingEngine(false);
    }
  };

  const handleUpdateEngine = async () => {
    if (!window.electronAPI?.updateEngine) return;
    setIsUpdatingEngine(true);
    setEngineProgress(0);
    try {
      let unsub = null;
      if (window.electronAPI.onEngineUpdateProgress) {
        unsub = window.electronAPI.onEngineUpdateProgress((pct) => {
          setEngineProgress(pct);
        });
      }
      const res = await window.electronAPI.updateEngine();
      if (unsub) unsub();

      if (res && res.success) {
        setLocalEngineUpdate({
          version: res.version,
          source: res.source,
          path: res.path,
          latestVersion: res.version,
          updateAvailable: false,
        });
        toast.success(`yt-dlp engine updated to v${res.version} successfully!`);
        if (onRefreshStatus) {
          onRefreshStatus();
        }
      } else {
        toast.error(`Update failed: ${res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdatingEngine(false);
      setEngineProgress(0);
    }
  };

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
            {/* yt-dlp Extraction Core */}
            <div className="p-4 bg-[var(--surface-2)]/70 border border-[var(--border-subdued)] rounded-xl col-span-1 sm:col-span-2 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subdued)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/40 text-[var(--accent-neon)] shrink-0">
                    <DownloadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[var(--text-primary)] font-heading">
                        yt-dlp Media Engine Core
                      </span>
                      <Badge
                        variant={currentEngine.source === 'AppData Updated' ? 'success' : 'default'}
                        size="sm"
                      >
                        {currentEngine.source === 'AppData Updated' ? 'AppData Updated' : 'Bundled'}
                      </Badge>
                      {currentEngine.updateAvailable && (
                        <Badge variant="accent" size="sm">
                          v{currentEngine.latestVersion} Available
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono text-xs text-[var(--text-secondary)] block mt-0.5">
                      Active: <span className="text-[var(--text-primary)] font-semibold">{currentEngine.version}</span>
                      {currentEngine.latestVersion && !currentEngine.updateAvailable && (
                        <span className="text-[var(--status-success)] ml-2">• Up to date</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentEngine.updateAvailable ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleUpdateEngine}
                      isLoading={isUpdatingEngine}
                      className="text-xs sm:text-sm font-semibold shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isUpdatingEngine ? 'animate-spin' : ''}`} />
                      <span>{isUpdatingEngine ? `Updating (${engineProgress}%)...` : 'Update yt-dlp Engine'}</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={handleCheckEngineUpdate}
                      isLoading={isCheckingEngine}
                      className="text-xs sm:text-sm font-semibold shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingEngine ? 'animate-spin' : ''}`} />
                      <span>{isCheckingEngine ? 'Checking...' : 'Check for Updates'}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-tertiary)] font-mono">
                <span className="truncate" title={currentEngine.path}>
                  Target: {currentEngine.path}
                </span>
                {isUpdatingEngine && (
                  <span className="text-[var(--accent-neon)] font-semibold shrink-0 ml-2">
                    {engineProgress}%
                  </span>
                )}
              </div>

              {isUpdatingEngine && (
                <div className="w-full bg-[var(--surface-1)] rounded-full h-1.5 mt-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-cyan)] h-full transition-all duration-200"
                    style={{ width: `${engineProgress}%` }}
                  />
                </div>
              )}
            </div>

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
