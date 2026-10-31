import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Scissors,
  Film,
  Clock,
  Settings,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { TitleBar } from '@/components/ui/TitleBar';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }, []);

  // Collapsible Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch (err) {
        console.debug('Failed to persist sidebar collapsed state:', err);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

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

  const primaryNavItems = [
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
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0b10] text-[#f4f4f7] overflow-hidden font-sans select-none relative">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Desktop Shell */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Subframe Navigation Sidebar */}
        <aside
          className={`${
            isSidebarCollapsed ? 'w-16' : 'w-60 sm:w-64'
          } bg-[#0f0f16] border-r border-[#1e1e2a] flex flex-col justify-between shrink-0 p-3 select-none z-10 relative transition-all duration-200 ease-in-out`}
          data-purpose="workspace-navigation"
        >
          {/* Top: Nav Destination Links */}
          <div className="space-y-4">
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'} pt-1`}>
              {!isSidebarCollapsed && (
                <span className="text-xs font-mono uppercase tracking-wider text-[#5c5c6e] font-semibold truncate">
                  Workspace
                </span>
              )}
              {isSidebarCollapsed ? (
                <Tooltip content="Expand Sidebar (Ctrl+B)" position="right" delay={100}>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-[#a78bfa] hover:text-white hover:bg-[#ffffff0f] transition cursor-pointer"
                    aria-label="Expand Sidebar (Ctrl+B)"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition cursor-pointer"
                  title="Collapse Sidebar (Ctrl+B)"
                  aria-label="Collapse Sidebar (Ctrl+B)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>

            <nav aria-label="Main Workspaces Navigation" className="space-y-1">
              {primaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const buttonContent = (
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    aria-label={item.label}
                    className={`group flex items-center ${
                      isSidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full justify-between px-3 py-2.5'
                    } rounded-md font-medium text-xs sm:text-sm transition duration-150 cursor-pointer relative ${
                      isActive
                        ? 'border border-[#7c3aed4d] bg-[#7c3aed1f] text-[#ede9fe] shadow-sm'
                        : 'border border-transparent hover:bg-[#ffffff0a] text-[#b4b4c2] hover:text-[#f4f4f7]'
                    }`}
                  >
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} truncate`}>
                      <div
                        className={`transition shrink-0 ${
                          isActive
                            ? 'text-[#a78bfa]'
                            : 'text-[#7a7a8c] group-hover:text-[#b4b4c2]'
                        }`}
                      >
                        {item.icon}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className={`truncate tracking-tight ${isActive ? 'text-[#ede9fe] font-semibold' : ''}`}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isSidebarCollapsed && (
                      isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] shadow-[0_0_8px_#a78bfa] shrink-0" />
                      ) : item.badge !== undefined ? (
                        <span className="font-mono text-[11px] uppercase px-1.5 py-0.5 rounded shrink-0 text-[#9a9aac] bg-[#1e1e2a] border border-[#2a2a3a]">
                          {item.badge}
                        </span>
                      ) : null
                    )}
                  </button>
                );

                return isSidebarCollapsed ? (
                  <div key={item.id} className="flex justify-center">
                    <Tooltip content={item.label} position="right" delay={100}>
                      {buttonContent}
                    </Tooltip>
                  </div>
                ) : (
                  <div key={item.id}>
                    {buttonContent}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Navigation Lower Utilities: Side-by-side History & Settings above Output Folder */}
          <div className="space-y-3 pt-3 border-t border-[#1e1e2a]">
            {isSidebarCollapsed ? (
              /* Collapsible Icon-Only Lower Utilities with Tooltips */
              <div className="space-y-1.5 flex flex-col items-center">
                {/* Download History */}
                <Tooltip
                  content={`Download History${history.length > 0 ? ` (${history.length})` : ''}`}
                  position="right"
                  delay={100}
                >
                  <Button
                    variant={activeTab === 'history' ? 'accentMuted' : 'secondary'}
                    size="icon"
                    onClick={() => setActiveTab('history')}
                    aria-label="Download History"
                    className={`w-10 h-10 rounded-lg relative ${
                      activeTab === 'history'
                        ? 'bg-[#7c3aed1f] border border-[#7c3aed4d] text-[#ede9fe]'
                        : 'border border-[#1e1e2a] bg-[#14141d] hover:bg-[#1e1e2a] text-[#7a7a8c] hover:text-[#f4f4f7]'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-[#a78bfa]" />
                    {history.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#a78bfa]" />
                    )}
                  </Button>
                </Tooltip>

                {/* Settings */}
                <Tooltip content="Settings" position="right" delay={100}>
                  <Button
                    variant={activeTab === 'settings' ? 'accentMuted' : 'secondary'}
                    size="icon"
                    onClick={() => setActiveTab('settings')}
                    aria-label="Settings"
                    className={`w-10 h-10 rounded-lg ${
                      activeTab === 'settings'
                        ? 'bg-[#7c3aed1f] border border-[#7c3aed4d] text-[#ede9fe]'
                        : 'border border-[#1e1e2a] bg-[#14141d] hover:bg-[#1e1e2a] text-[#7a7a8c] hover:text-[#f4f4f7]'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-[#a78bfa]" />
                  </Button>
                </Tooltip>

                {/* Output Folder Icon Button */}
                <Tooltip
                  content={`Output: ${globalOutputDir ? globalOutputDir.split(/[/\\]/).pop() : 'Default'}`}
                  position="right"
                  delay={100}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowOutputFolderModal(true)}
                    className="w-10 h-10 rounded-lg bg-[#14141d] border border-[#1e1e2a] hover:border-[#2a2a3a] text-[#a78bfa] hover:bg-[#1e1e2a]"
                    aria-label="Change Output Folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </Tooltip>
              </div>
            ) : (
              /* Expanded Mode: Side-by-Side History & Settings, then Output Folder Card */
              <>
                <div className="grid grid-cols-2 gap-2" data-purpose="history-and-settings-row">
                  {/* Download History Button */}
                  <Button
                    variant={activeTab === 'history' ? 'accentMuted' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('history')}
                    aria-label="Download History"
                    className={`w-full justify-center gap-2 ${
                      activeTab === 'history'
                        ? 'border border-[#7c3aed4d] bg-[#7c3aed1f] text-[#ede9fe]'
                        : 'border border-[#1e1e2a] bg-[#14141d] hover:bg-[#1e1e2a] text-[#b4b4c2] hover:text-[#f4f4f7]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span className={`truncate tracking-tight ${activeTab === 'history' ? 'text-[#ede9fe] font-semibold' : ''}`}>
                      History
                    </span>
                  </Button>

                  {/* Settings Button */}
                  <Button
                    variant={activeTab === 'settings' ? 'accentMuted' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('settings')}
                    aria-label="Settings"
                    className={`w-full justify-center gap-2 ${
                      activeTab === 'settings'
                        ? 'border border-[#7c3aed4d] bg-[#7c3aed1f] text-[#ede9fe]'
                        : 'border border-[#1e1e2a] bg-[#14141d] hover:bg-[#1e1e2a] text-[#b4b4c2] hover:text-[#f4f4f7]'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-[#a78bfa]" />
                    <span className={`truncate tracking-tight ${activeTab === 'settings' ? 'text-[#ede9fe] font-semibold' : ''}`}>
                      Settings
                    </span>
                  </Button>
                </div>

                {/* Output Destination Box */}
                <div
                  onClick={() => setShowOutputFolderModal(true)}
                  className="bg-[#14141d] border border-[#1e1e2a] hover:border-[#2a2a3a] rounded-lg p-3 cursor-pointer transition group"
                  title={globalOutputDir || 'Default downloads folder'}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5c5c6e] block mb-1.5">
                    Output Folder
                  </span>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
                    <span className="whitespace-nowrap text-xs text-[#d4d4de] grow truncate font-mono">
                      {globalOutputDir ? globalOutputDir.split(/[/\\]/).pop() : 'System Default'}
                    </span>
                    <div className="flex h-5 items-center rounded border border-[#2a2a3a] px-1.5 hover:bg-[#ffffff0f] transition">
                      <span className="text-[10px] font-bold text-[#c4b5fd]">
                        Change
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#5c5c6e] font-mono truncate mt-1">
                    {globalOutputDir || 'Downloads'}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Workspace Area (Preserved views in DOM to retain state across tab switching) */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 custom-scrollbar bg-[#0b0b10] relative">
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
        className="h-7 bg-[#0b0b10] border-t border-[#1e1e2a] px-4 flex items-center justify-between text-xs font-mono text-[#5c5c6e] select-none relative z-10 shrink-0"
        data-purpose="window-bottom-status-strip"
      >
        <span>Media Engine: yt-dlp core</span>
        <span>© Hermanos 2026 — Studio Edition</span>
        <span className="flex items-center gap-1.5 text-[#22c55e]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          Ready
        </span>
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
