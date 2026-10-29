import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Scissors,
  Film,
  Clock,
  Settings,
  Sun,
  Moon,
  FolderOpen,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { TitleBar } from '@/components/ui/TitleBar';
import { SingleDownloaderView } from '@/components/views/SingleDownloaderView';
import { MassClipView } from '@/components/views/MassClipView';
import { SelectiveDurationView } from '@/components/views/SelectiveDurationView';
import { HistoryView } from '@/components/views/HistoryView';
import { SettingsView } from '@/components/views/SettingsView';

import { CookieWizardModal } from '@/components/modals/CookieWizardModal';
import { PlaylistSelectorModal } from '@/components/modals/PlaylistSelectorModal';
import { ClearHistoryModal } from '@/components/modals/ClearHistoryModal';
import { CancelConfirmModal } from '@/components/modals/CancelConfirmModal';
import { OutputFolderModal } from '@/components/modals/OutputFolderModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('download'); // 'download' | 'mass-clip' | 'selective' | 'history' | 'settings'

  // Theme State (Dark mode default)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Persisted Output Directory
  const [globalOutputDir, setGlobalOutputDir] = useState(() => {
    try {
      return localStorage.getItem('global-outputDir') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    localStorage.setItem('global-outputDir', globalOutputDir);
  }, [globalOutputDir]);

  const handleSelectOutputDir = async () => {
    if (window.electronAPI && window.electronAPI.chooseDirectory) {
      const dir = await window.electronAPI.chooseDirectory();
      if (dir) {
        setGlobalOutputDir(dir);
        toast.success('Destination directory updated!');
        return dir;
      }
    }
    return null;
  };

  // Persisted History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('download-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('download-history', JSON.stringify(history));
  }, [history]);

  const addHistoryItem = useCallback((item) => {
    setHistory((prev) => [item, ...prev]);
  }, []);

  const deleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success('Record removed from history.');
  };

  const clearAllHistory = () => {
    setHistory([]);
    toast.success('All history records cleared.');
  };

  // Persisted Cookie Authentication State
  const [cookieBrowser, setCookieBrowser] = useState(() => {
    try {
      return localStorage.getItem('cookie-browser') || 'Chrome';
    } catch {
      return 'Chrome';
    }
  });

  const [cookieStatus, setCookieStatus] = useState(() => {
    try {
      return localStorage.getItem('cookie-status') || 'missing';
    } catch {
      return 'missing';
    }
  });

  const [cookieSyncDate, setCookieSyncDate] = useState(() => {
    try {
      return localStorage.getItem('cookie-sync-date') || '';
    } catch {
      return '';
    }
  });

  const [isSyncingCookies, setIsSyncingCookies] = useState(false);

  useEffect(() => {
    localStorage.setItem('cookie-browser', cookieBrowser);
  }, [cookieBrowser]);

  useEffect(() => {
    localStorage.setItem('cookie-status', cookieStatus);
  }, [cookieStatus]);

  useEffect(() => {
    localStorage.setItem('cookie-sync-date', cookieSyncDate);
  }, [cookieSyncDate]);

  const handleFirefoxSync = async () => {
    setIsSyncingCookies(true);
    try {
      if (window.electronAPI && window.electronAPI.extractCookies) {
        await window.electronAPI.extractCookies('Firefox');
        setCookieStatus('active');
        setCookieBrowser('Firefox');
        setCookieSyncDate(new Date().toISOString());
        toast.success('Firefox cookies synced successfully!');
        return true;
      }
    } catch (err) {
      const errMsg = err.message ? err.message.toLowerCase() : '';
      if (
        errMsg.includes('could not find firefox cookies database') ||
        errMsg.includes('firefox cookies database in')
      ) {
        toast.error("Firefox cookies database not found. Ensure Firefox is installed.");
      } else {
        toast.error(`Failed to sync Firefox cookies: ${err.message}`);
      }
      return false;
    } finally {
      setIsSyncingCookies(false);
    }
    return false;
  };

  const handleImportCookies = async (filePath = null) => {
    setIsSyncingCookies(true);
    try {
      if (window.electronAPI && window.electronAPI.importCookiesFile) {
        const res = await window.electronAPI.importCookiesFile(filePath, cookieBrowser);
        if (res && res.success) {
          setCookieStatus('active');
          setCookieSyncDate(new Date().toISOString());
          toast.success('Cookies imported and verified successfully!');
          return true;
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to import cookies file.');
      return false;
    } finally {
      setIsSyncingCookies(false);
    }
    return false;
  };

  // Single Downloader State
  const [url, setUrl] = useState('');
  const [formats, setFormats] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [isFetchingFormats, setIsFetchingFormats] = useState(false);
  const [downloadType, setDownloadType] = useState('mp4'); // 'mp4' | 'mp3'
  const [singleStatus, setSingleStatus] = useState('');
  const [singleProgress, setSingleProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  // Playlist & Inspection State
  const [isInspecting, setIsInspecting] = useState(false);
  const [playlistEntries, setPlaylistEntries] = useState([]);
  const [selectedPlaylistVideos, setSelectedPlaylistVideos] = useState([]);
  const [playlistDownloadQueue, setPlaylistDownloadQueue] = useState([]);
  const currentDownloadingVideoIdRef = useRef(null);
  const [singleVideoMetadata, setSingleVideoMetadata] = useState(null);
  const downloadCancelRef = useRef(false);

  // System Diagnostics State
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: { state: 'ONLINE', path: 'Checking...' },
    ffmpeg: { state: 'ONLINE', path: 'Checking...' },
    ffprobe: { state: 'ONLINE', path: 'Checking...' },
    dlls: [],
  });

  const refreshSystemStatus = useCallback(async () => {
    setIsRefreshingStatus(true);
    if (window.electronAPI && window.electronAPI.checkSystemStatus) {
      try {
        const res = await window.electronAPI.checkSystemStatus();
        setSystemStatus(res);
      } catch (err) {
        console.error('Failed to fetch system diagnostics', err);
      }
    }
    setIsRefreshingStatus(false);
  }, []);

  // Modal Visibility State
  const [showCookieWizard, setShowCookieWizard] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showOutputFolderModal, setShowOutputFolderModal] = useState(false);

  // Setup Global Electron IPC Event Listeners
  useEffect(() => {
    const unsubs = [];
    if (window.electronAPI) {
      const unsubProgress = window.electronAPI.onProgressUpdate((_event, percent) => {
        setSingleProgress(percent);
        if (currentDownloadingVideoIdRef.current) {
          setPlaylistDownloadQueue((prev) =>
            prev.map((item) =>
              item.id === currentDownloadingVideoIdRef.current
                ? { ...item, progress: percent }
                : item
            )
          );
        }
      });

      const unsubStatus = window.electronAPI.onStatusUpdate((_event, msg) => {
        setSingleStatus(msg);
        if (currentDownloadingVideoIdRef.current) {
          setPlaylistDownloadQueue((prev) =>
            prev.map((item) =>
              item.id === currentDownloadingVideoIdRef.current
                ? { ...item, status: msg }
                : item
            )
          );
        }
      });

      unsubs.push(unsubProgress, unsubStatus);

      if (window.electronAPI.onAuthError) {
        const unsubAuth = window.electronAPI.onAuthError(() => {
          setCookieStatus('stale');
          toast.error(
            'YouTube authentication failed. Your cookies may be expired. Please re-sync in Settings.',
            { duration: 6000 }
          );
        });
        unsubs.push(unsubAuth);
      }
    }

    return () => {
      unsubs.forEach((unsub) => unsub && unsub());
    };
  }, []);

  // Initial diagnostics load outside of cascading sync effect
  useEffect(() => {
    let mounted = true;
    if (window.electronAPI && window.electronAPI.checkSystemStatus) {
      window.electronAPI.checkSystemStatus().then((res) => {
        if (mounted && res) setSystemStatus(res);
      }).catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Format Fetching Helper
  const fetchFormats = useCallback(async (urlToFetch) => {
    setIsFetchingFormats(true);
    try {
      if (window.electronAPI && window.electronAPI.getAvailableFormats) {
        const fetchedFormats = await window.electronAPI.getAvailableFormats(urlToFetch);
        if (fetchedFormats && fetchedFormats.length > 0) {
          setFormats(fetchedFormats);
          setSelectedQuality(String(fetchedFormats[fetchedFormats.length - 1].height));
        }
      }
    } catch (err) {
      console.error('Failed to fetch formats', err);
      const errLower = err.message ? err.message.toLowerCase() : '';
      const isAuth =
        errLower.includes('private video') ||
        errLower.includes('confirm your age') ||
        errLower.includes('sign in');
      setUrlError(
        isAuth
          ? 'This video requires cookie authentication. Please sync your browser cookies in Settings.'
          : 'Could not fetch resolutions for this stream.'
      );
    } finally {
      setIsFetchingFormats(false);
    }
  }, []);

  // Single Downloader URL Change & Inspection
  const handleUrlChange = useCallback(
    async (newUrl) => {
      setUrl(newUrl);
      setUrlError(null);
      setPlaylistEntries([]);
      setSelectedPlaylistVideos([]);
      setSingleVideoMetadata(null);

      if (newUrl && (newUrl.includes('youtube.com') || newUrl.includes('youtu.be'))) {
        setIsInspecting(true);
        try {
          if (window.electronAPI && window.electronAPI.inspectUrl) {
            const inspectResult = await window.electronAPI.inspectUrl(newUrl);
            if (inspectResult && inspectResult._type === 'playlist' && inspectResult.entries) {
              setPlaylistEntries(inspectResult.entries);
              const validIds = inspectResult.entries
                .filter(
                  (v) =>
                    v.title &&
                    v.title !== '[Private video]' &&
                    v.title !== '[Deleted video]'
                )
                .map((v) => v.id);
              setSelectedPlaylistVideos(validIds);
              setIsInspecting(false);
              return;
            } else if (inspectResult && inspectResult.title) {
              setSingleVideoMetadata({
                title: inspectResult.title,
                id: inspectResult.id,
              });
            }
          }
        } catch (err) {
          console.error('Failed to inspect URL', err);
          const errLower = err.message ? err.message.toLowerCase() : '';
          const isAuth =
            errLower.includes('private video') ||
            errLower.includes('confirm your age') ||
            errLower.includes('sign in');
          setUrlError(
            isAuth
              ? 'This video is private or age-restricted. Please sync your browser cookies in Settings.'
              : 'Failed to inspect link metadata.'
          );
        }
        setIsInspecting(false);

        if (downloadType === 'mp4') {
          fetchFormats(newUrl);
        }
      }
    },
    [downloadType, fetchFormats]
  );

  // Single Download Execution
  const handleSingleDownload = async () => {
    if (!url) return;

    let outdir = globalOutputDir;
    if (!outdir) {
      outdir = await handleSelectOutputDir();
      if (!outdir) return;
    }

    setIsDownloading(true);
    setSingleProgress(0);
    setSingleStatus('Initializing media stream...');
    downloadCancelRef.current = false;

    try {
      let result;
      if (downloadType === 'mp4') {
        result = await window.electronAPI.downloadYoutubeAsMp4(
          url,
          outdir,
          parseInt(selectedQuality, 10) || null,
          true
        );
      } else {
        result = await window.electronAPI.downloadYoutubeAsMp3(url, outdir, true);
      }

      if (result && result.success === false) {
        throw new Error(result.error || 'Download failed');
      }

      setSingleStatus('Completed!');
      setSingleProgress(100);
      toast.success('Media downloaded successfully!');

      const filename = result.filepath ? result.filepath.split('\\').pop() : 'downloaded_media';
      addHistoryItem({
        id: Date.now(),
        url,
        filename,
        filepath: result.filepath,
        type: downloadType,
        date: new Date().toLocaleString(),
      });

      setTimeout(() => {
        setIsDownloading(false);
        setUrl('');
        setSingleProgress(0);
        setSingleStatus('');
        setSingleVideoMetadata(null);
        setFormats([]);
        setSelectedQuality('');
      }, 3000);
    } catch (err) {
      if (downloadCancelRef.current) return;
      const friendlyError = err.message?.includes('3436169992')
        ? 'Too fast! Please wait a few seconds and try again.'
        : err.message || 'Download failed';
      setSingleStatus(`Error: ${friendlyError}`);
      setIsDownloading(false);
      toast.error(`Download failed: ${friendlyError}`);
    }
  };

  // Playlist Download Execution
  const handlePlaylistDownload = async () => {
    if (selectedPlaylistVideos.length === 0) {
      toast.error('Select at least one video to download.');
      return;
    }

    let outdir = globalOutputDir;
    if (!outdir) {
      outdir = await handleSelectOutputDir();
      if (!outdir) return;
    }

    setShowPlaylistModal(false);
    setIsDownloading(true);
    downloadCancelRef.current = false;

    const videosToDownload = playlistEntries.filter((v) =>
      selectedPlaylistVideos.includes(v.id)
    );

    const initialQueue = videosToDownload.map((v) => ({
      id: v.id,
      url: v.url,
      title: v.title,
      progress: 0,
      status: 'Queued',
      error: false,
    }));

    setPlaylistDownloadQueue(initialQueue);

    for (let i = 0; i < videosToDownload.length; i++) {
      if (downloadCancelRef.current) break;
      const video = videosToDownload[i];
      currentDownloadingVideoIdRef.current = video.id;

      setPlaylistDownloadQueue((prev) =>
        prev.map((item) =>
          item.id === video.id ? { ...item, status: 'Downloading...' } : item
        )
      );

      try {
        let result;
        if (downloadType === 'mp4') {
          result = await window.electronAPI.downloadYoutubeAsMp4(video.url, outdir, null, true);
        } else {
          result = await window.electronAPI.downloadYoutubeAsMp3(video.url, outdir, true);
        }

        if (result && result.success === false) {
          throw new Error(result.error || 'Failed to download video');
        }

        setPlaylistDownloadQueue((prev) =>
          prev.map((item) =>
            item.id === video.id ? { ...item, status: 'Done', progress: 100 } : item
          )
        );

        addHistoryItem({
          id: Date.now() + i,
          url: video.url,
          filename: result.filepath ? result.filepath.split('\\').pop() : video.title,
          filepath: result.filepath,
          type: downloadType,
          date: new Date().toLocaleString(),
        });
      } catch (err) {
        if (downloadCancelRef.current) break;
        const friendlyError = err.message?.includes('3436169992')
          ? 'Too fast, please wait a moment.'
          : err.message;
        setPlaylistDownloadQueue((prev) =>
          prev.map((item) =>
            item.id === video.id ? { ...item, status: `Error: ${friendlyError}`, error: true } : item
          )
        );
      }
    }

    currentDownloadingVideoIdRef.current = null;
    if (!downloadCancelRef.current) {
      setSingleStatus('All selected playlist videos downloaded!');
      setTimeout(() => {
        setIsDownloading(false);
        setPlaylistDownloadQueue([]);
        setUrl('');
        setSingleVideoMetadata(null);
        setFormats([]);
        setSelectedQuality('');
      }, 3000);
    }
  };

  // Convert Local MP4 to MP3
  const handleConvertLocal = async () => {
    if (!window.electronAPI) return;

    const file = await window.electronAPI.chooseFile();
    if (!file) return;

    let outdir = globalOutputDir;
    if (!outdir) {
      outdir =
        (await window.electronAPI.chooseDirectory()) ||
        (await window.electronAPI.getDefaultDownloadPath());
    }

    setIsDownloading(true);
    setSingleProgress(0);
    setSingleStatus('Converting local MP4 to MP3 audio...');

    try {
      const result = await window.electronAPI.convertLocalMp4(file, outdir);
      setSingleStatus('Conversion Complete!');
      setSingleProgress(100);
      toast.success('Converted to MP3 successfully!');

      if (result && result.filepath) {
        addHistoryItem({
          id: Date.now(),
          url: file,
          filename: result.filepath.split('\\').pop(),
          filepath: result.filepath,
          type: 'mp3',
          date: new Date().toLocaleString(),
        });
      }

      setTimeout(() => {
        setIsDownloading(false);
        setSingleProgress(0);
        setSingleStatus('');
      }, 3000);
    } catch (err) {
      setIsDownloading(false);
      setSingleStatus('');
      toast.error(`Conversion failed: ${err.message}`);
    }
  };

  // Cancellation Confirmation
  const confirmSingleCancel = async () => {
    setShowCancelConfirmModal(false);
    downloadCancelRef.current = true;
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      try {
        await window.electronAPI.cancelDownload();
      } catch (err) {
        console.error('Failed to cancel download', err);
      }
    }
    setIsDownloading(false);
    setSingleProgress(0);
    setSingleStatus('');
    toast.error('Download canceled.', { icon: '🛑' });
  };

  const navItems = [
    {
      id: 'download',
      label: 'Single Media',
      icon: <Download className="w-4 h-4" />,
    },
    {
      id: 'mass-clip',
      label: 'Mass Clip Stitcher',
      icon: <Scissors className="w-4 h-4" />,
      badge: 'Batch',
    },
    {
      id: 'selective',
      label: 'Selective Trimming',
      icon: <Film className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Download History',
      icon: <Clock className="w-4 h-4" />,
      badge: history.length > 0 ? history.length : undefined,
    },
    {
      id: 'settings',
      label: 'Settings & Engine',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] dark:bg-obsidian-950 dark:text-slate-100 overflow-hidden font-sans select-none relative noise-overlay">
      {/* Top ambient lighting accent */}
      <div className="absolute inset-x-0 top-0 h-44 ambient-glow-purple pointer-events-none z-0" />

      {/* Title Bar */}
      <TitleBar />

      {/* Main Desktop Shell */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Obsidian Navigation Sidebar */}
        <aside
          className="w-60 sm:w-64 bg-[var(--surface-1)] dark:bg-obsidian-950/85 border-r border-purple-900/25 flex flex-col justify-between shrink-0 p-3.5 backdrop-blur-md select-none z-10 relative"
          data-purpose="workspace-navigation"
        >
          {/* Top: Nav Destination Links */}
          <div className="space-y-4">
            <div className="px-2.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400/70 font-semibold">
                Workspace Tools
              </span>
            </div>

            <nav aria-label="Main Navigation" className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-violet/25 via-purple-600/15 to-transparent border border-purple-500/40 text-purple-200 shadow-sm shadow-purple-950/50'
                        : 'border border-transparent hover:bg-purple-950/30 hover:border-purple-800/30 text-slate-400 hover:text-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`p-1.5 rounded-lg transition shrink-0 ${
                          isActive
                            ? 'bg-accent-violet/25 text-accent-neon shadow-sm shadow-purple-900/30'
                            : 'bg-obsidian-850 text-slate-400 group-hover:text-purple-300'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className={`truncate tracking-tight ${isActive ? 'text-white font-medium' : ''}`}>
                        {item.label}
                      </span>
                    </div>

                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-glow-violet shrink-0" />
                    ) : item.badge !== undefined ? (
                      <span
                        className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          typeof item.badge === 'string'
                            ? 'text-purple-400/80 bg-purple-950/50 border border-purple-800/40'
                            : 'text-accent-neon bg-purple-950/80 border border-purple-700/50 font-semibold'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Navigation Lower Utilities */}
          <div className="space-y-3 pt-4 border-t border-purple-900/30">
            {/* Output Destination Info Card */}
            <div
              onClick={() => setShowOutputFolderModal(true)}
              className="bg-obsidian-900/90 border border-purple-900/30 hover:border-purple-700/50 rounded-xl p-3 shadow-inner cursor-pointer transition group"
              title={globalOutputDir || 'Default downloads folder'}
            >
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
                  <FolderOpen className="w-3.5 h-3.5 text-accent-neon shrink-0" />
                  <span>Output Folder</span>
                </span>
                <span className="font-mono text-accent-neon text-[10px] shrink-0 opacity-80 group-hover:opacity-100">
                  Change
                </span>
              </div>
              <div className="font-mono text-xs text-slate-200 truncate select-all">
                {globalOutputDir ? globalOutputDir.split(/[/\\]/).pop() : 'System Default'}
              </div>
              <div className="text-[9px] text-purple-400/60 font-mono truncate mt-0.5">
                {globalOutputDir || 'Downloads'}
              </div>
            </div>

            {/* Bottom Action Buttons: Theme & Logs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleThemeToggle}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-obsidian-900 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-700/50 rounded-lg text-slate-300 hover:text-purple-200 text-[11px] transition cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-accent-violet" />
                    <span>Obsidian UI</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Studio Light</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.electronAPI?.openLogsWindow?.()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-obsidian-900 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-700/50 rounded-lg text-slate-300 hover:text-purple-200 text-[11px] font-mono transition cursor-pointer"
                title="Open Developer Logs"
                aria-label="Open Logs"
              >
                <span className="text-accent-neon font-bold">&gt;_</span>
                <span>Logs</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area (Preserved views in DOM to retain state across tab switching) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar bg-[var(--bg-base)] studio-ambient-bg relative">
          <div className={activeTab === 'download' ? 'block' : 'hidden'}>
            <SingleDownloaderView
              url={url}
              setUrl={handleUrlChange}
              downloadType={downloadType}
              setDownloadType={setDownloadType}
              selectedQuality={selectedQuality}
              setSelectedQuality={setSelectedQuality}
              formats={formats}
              isFetchingFormats={isFetchingFormats}
              isInspecting={isInspecting}
              urlError={urlError}
              singleVideoMetadata={singleVideoMetadata}
              playlistEntries={playlistEntries}
              selectedPlaylistVideos={selectedPlaylistVideos}
              isDownloading={isDownloading}
              progress={singleProgress}
              status={singleStatus}
              playlistDownloadQueue={playlistDownloadQueue}
              globalOutputDir={globalOutputDir}
              onSelectOutputDir={handleSelectOutputDir}
              onDownload={handleSingleDownload}
              onConvertLocal={handleConvertLocal}
              onCancelClick={() => setShowCancelConfirmModal(true)}
              onOpenPlaylistModal={() => setShowPlaylistModal(true)}
              onOpenCookieWizard={() => setShowCookieWizard(true)}
            />
          </div>

          <div className={activeTab === 'mass-clip' ? 'block' : 'hidden'}>
            <MassClipView
              globalOutputDir={globalOutputDir}
              onRequestGlobalOutput={handleSelectOutputDir}
              onStitchSuccess={(filepath, clips) => {
                const validClips = clips.filter((c) => c.url.trim());
                if (validClips.length > 0) {
                  const newItems = validClips.map((c, i) => {
                    let clipTitle = filepath.split(/[/\\]/).pop() + ` (Clip ${i + 1})`;
                    let clipFilepath = filepath;
                    if (c.state === 'done' && c.message) {
                      const parts = c.message.split('::');
                      if (parts.length === 2) {
                        clipTitle = parts[0];
                        clipFilepath = parts[1];
                      }
                    }
                    return {
                      id: Date.now() + i,
                      url: c.url.trim(),
                      filename: clipTitle,
                      filepath: clipFilepath,
                      type: 'stitch',
                      date: new Date().toLocaleString(),
                    };
                  });
                  setHistory((prev) => [...newItems.reverse(), ...prev]);
                } else {
                  addHistoryItem({
                    id: Date.now(),
                    url: 'Multiple clips',
                    filename: filepath.split(/[/\\]/).pop(),
                    filepath,
                    type: 'stitch',
                    date: new Date().toLocaleString(),
                  });
                }
              }}
            />
          </div>

          <div className={activeTab === 'selective' ? 'block' : 'hidden'}>
            <SelectiveDurationView
              globalOutputDir={globalOutputDir}
              onRequestGlobalOutput={handleSelectOutputDir}
              onDownloadSuccess={(filepath, start, end, videoUrl, videoTitle) => {
                addHistoryItem({
                  id: Date.now(),
                  url: videoUrl,
                  filename: videoTitle || (filepath ? filepath.split(/[/\\]/).pop() : 'Segment'),
                  durationTimestamp: `${start} - ${end}`,
                  filepath,
                  type: 'clip',
                  date: new Date().toLocaleString(),
                });
              }}
            />
          </div>

          <div className={activeTab === 'history' ? 'block' : 'hidden'}>
            <HistoryView
              history={history}
              onDeleteHistoryItem={deleteHistoryItem}
              onOpenClearModal={() => setShowClearHistoryModal(true)}
            />
          </div>

          <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
            <SettingsView
              globalOutputDir={globalOutputDir}
              onSelectOutputDir={handleSelectOutputDir}
              theme={theme}
              onThemeToggle={handleThemeToggle}
              cookieBrowser={cookieBrowser}
              cookieStatus={cookieStatus}
              cookieSyncDate={cookieSyncDate}
              onOpenCookieWizard={() => setShowCookieWizard(true)}
              systemStatus={systemStatus}
              isRefreshingStatus={isRefreshingStatus}
              onRefreshStatus={refreshSystemStatus}
            />
          </div>
        </main>
      </div>

      {/* Persistent Bottom Status Strip */}
      <footer
        className="h-7 bg-obsidian-950/90 border-t border-purple-900/30 px-4 flex items-center justify-between text-[11px] font-mono text-purple-400/60 select-none relative z-10 shrink-0"
        data-purpose="window-bottom-status-strip"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-accent-neon font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-neon shadow-glow-violet" />
            Ready to Forge
          </span>
          <span className="text-purple-900/50">|</span>
          <span className="truncate max-w-[280px] sm:max-w-md text-slate-400">
            Dest: {globalOutputDir || 'System Default (~/Downloads)'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>Engine: yt-dlp core</span>
          <span className="text-purple-900/50">|</span>
          <span className="text-purple-300/80">Hermanos Forge v1.1.0</span>
        </div>
      </footer>

      {/* Global Overlays & Modals */}
      <CookieWizardModal
        isOpen={showCookieWizard}
        onClose={() => setShowCookieWizard(false)}
        cookieBrowser={cookieBrowser}
        setCookieBrowser={setCookieBrowser}
        isSyncingCookies={isSyncingCookies}
        onFirefoxSync={handleFirefoxSync}
        onImportCookies={handleImportCookies}
      />

      <PlaylistSelectorModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        playlistEntries={playlistEntries}
        selectedVideos={selectedPlaylistVideos}
        setSelectedVideos={setSelectedPlaylistVideos}
        onConfirmDownload={handlePlaylistDownload}
        downloadType={downloadType}
      />

      <ClearHistoryModal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
        onConfirm={clearAllHistory}
      />

      <CancelConfirmModal
        isOpen={showCancelConfirmModal}
        onClose={() => setShowCancelConfirmModal(false)}
        onConfirm={confirmSingleCancel}
      />

      <OutputFolderModal
        isOpen={showOutputFolderModal}
        onClose={() => setShowOutputFolderModal(false)}
        currentPath={globalOutputDir}
        onSelectFolder={handleSelectOutputDir}
      />

      {/* Persistent Toaster */}
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
    </div>
  );
}
