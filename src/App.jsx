import { useState, useEffect, useRef } from 'react';
import iconUrl from './assets/icon.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings, Clock, Trash2, FolderOpen, Video, Music, AlertCircle, Copy, Scissors, Terminal, Activity, Server, RefreshCw, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, X, OctagonX, Check, Loader2, Timer, Cookie, Upload, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import pkg from '../package.json';
import MassClipDownloader from './MassClipDownloader';
import SelectiveDownloader from './SelectiveDownloader';
import CustomSelect from './CustomSelect';

export default function App() {
  const [activeTab, setActiveTab] = useState('download'); // download, history
  const [historyTab, setHistoryTab] = useState('single'); // single, stitch
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [url, setUrl] = useState('');
  const [formats, setFormats] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [isFetchingFormats, setIsFetchingFormats] = useState(false);
  const [downloadType, setDownloadType] = useState('mp4'); // mp4, mp3

  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [urlError, setUrlError] = useState(null);

  const [cookieBrowser, setCookieBrowser] = useState(() => localStorage.getItem('cookie-browser') || 'Chrome');
  const [cookieStatus, setCookieStatus] = useState(() => localStorage.getItem('cookie-status') || 'missing');
  const [showCookieWizard, setShowCookieWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [cookieSyncDate, setCookieSyncDate] = useState(() => localStorage.getItem('cookie-sync-date') || '');
  const [isSyncingCookies, setIsSyncingCookies] = useState(false);
  const [isDraggingCookie, setIsDraggingCookie] = useState(false);

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
        setWizardStep(5); // Confirmation page
      }
    } catch (err) {
      const errMsg = err.message.toLowerCase();
      if (errMsg.includes('could not find firefox cookies database') || errMsg.includes('firefox cookies database in')) {
        toast.error("You don't have Firefox browser installed!", { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      } else {
        toast.error("Failed to sync Firefox cookies: " + err.message, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      }
    } finally {
      setIsSyncingCookies(false);
    }
  };

  const handleImportCookies = async (filePath = null) => {
    setIsSyncingCookies(true);
    try {
      if (window.electronAPI && window.electronAPI.importCookiesFile) {
        const res = await window.electronAPI.importCookiesFile(filePath, cookieBrowser);
        if (res && res.success) {
          setCookieStatus('active');
          setCookieSyncDate(new Date().toISOString());
          setWizardStep(5); // Confirmation page
        }
      }
    } catch (err) {
      toast.error(err.message, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    } finally {
      setIsSyncingCookies(false);
    }
  };

  // Playlist States
  const [isInspecting, setIsInspecting] = useState(false);
  const [playlistEntries, setPlaylistEntries] = useState([]);
  const [selectedPlaylistVideos, setSelectedPlaylistVideos] = useState([]);
  const [playlistDownloadQueue, setPlaylistDownloadQueue] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const currentDownloadingVideoIdRef = useRef(null);
  const [singleVideoMetadata, setSingleVideoMetadata] = useState(null);

  // Status Modal State
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    backend: { state: 'CHECKING', path: 'Fetching...' },
    ffmpeg: { state: 'CHECKING', path: 'Fetching...' },
    ffprobe: { state: 'CHECKING', path: 'Fetching...' },
    dlls: []
  });

  const refreshStatus = async () => {
    setIsRefreshingStatus(true);
    if (window.electronAPI && window.electronAPI.checkSystemStatus) {
      try {
        const status = await window.electronAPI.checkSystemStatus();
        setSystemStatus(status);
      } catch (err) {
        console.error('Failed to fetch system status', err);
      }
    }
    setIsRefreshingStatus(false);
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      refreshStatus();
    }
  }, [activeTab]);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('download-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDownloadCancelModal, setShowDownloadCancelModal] = useState(false);
  const downloadCancelRef = useRef(false);

  const confirmSingleCancel = async () => {
    setShowDownloadCancelModal(false);
    downloadCancelRef.current = true;
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      await window.electronAPI.cancelDownload();
    }
    setIsDownloading(false);
    setProgress(0);
    setStatus('');
    toast.error('Download canceled.', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' }, icon: '🛑' });
  };

  const [globalOutputDir, setGlobalOutputDir] = useState(() => localStorage.getItem('global-outputDir') || '');
  const [isOutputFolderModalOpen, setIsOutputFolderModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('global-outputDir', globalOutputDir);
  }, [globalOutputDir]);

  const handleGlobalOutputRequest = async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.chooseDirectory();
      if (dir) {
        setGlobalOutputDir(dir);
        return dir;
      }
    }
    return null;
  };

  useEffect(() => {
    localStorage.setItem('download-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    // Set up IPC listeners
    const unsubs = [];
    if (window.electronAPI) {
      const unsubProgress = window.electronAPI.onProgressUpdate((event, percent) => {
        setProgress(percent);
        if (currentDownloadingVideoIdRef.current) {
          setPlaylistDownloadQueue(prev => prev.map(item =>
            item.id === currentDownloadingVideoIdRef.current
              ? { ...item, progress: percent }
              : item
          ));
        }
      });
      const unsubStatus = window.electronAPI.onStatusUpdate((event, msg) => {
        setStatus(msg);
        if (currentDownloadingVideoIdRef.current) {
          setPlaylistDownloadQueue(prev => prev.map(item =>
            item.id === currentDownloadingVideoIdRef.current
              ? { ...item, status: msg }
              : item
          ));
        }
      });
      unsubs.push(unsubProgress, unsubStatus);

      if (window.electronAPI.onBrowserLocked) {
        const unsubLocked = window.electronAPI.onBrowserLocked((msg) => {
          setIsSyncingCookies(false);
          toast.error("Browser is locked! Please completely close it via Task Manager.", { duration: 5000, style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
        });
        unsubs.push(unsubLocked);
      }
      if (window.electronAPI.onAuthError) {
        const unsubAuth = window.electronAPI.onAuthError((msg) => {
          setCookieStatus('stale');
          toast.error("Authentication failed. Your cookies might be expired. Please re-sync in Settings.", { duration: 5000, style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
        });
        unsubs.push(unsubAuth);
      }
    }
    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  const fetchFormats = async (urlToFetch) => {
    setIsFetchingFormats(true);
    try {
      if (window.electronAPI) {
        const fetchedFormats = await window.electronAPI.getAvailableFormats(urlToFetch);
        if (fetchedFormats && fetchedFormats.length > 0) {
          setFormats(fetchedFormats);
          setSelectedQuality(fetchedFormats[fetchedFormats.length - 1].height.toString()); // Best by default
        }
      }
    } catch (err) {
      console.error("Failed to fetch formats", err);
      const errLower = err.message?.toLowerCase() || '';
      const isAuthError = errLower.includes('private video') || errLower.includes('confirm your age') || errLower.includes('sign in');
      setUrlError(isAuthError
        ? "This video is age-restricted or private. Please sync your browser cookies in Settings to download."
        : "Failed to fetch video qualities.");
    } finally {
      setIsFetchingFormats(false);
    }
  };

  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
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
            setSelectedPlaylistVideos(inspectResult.entries.map(v => v.id));
            setShowPlaylistModal(true);
            setIsInspecting(false);
            return;
          } else if (inspectResult && inspectResult.title) {
            setSingleVideoMetadata({ title: inspectResult.title, id: inspectResult.id });
          }
        }
      } catch (err) {
        console.error("Failed to inspect url", err);
        const errLower = err.message?.toLowerCase() || '';
        const isAuthError = errLower.includes('private video') || errLower.includes('confirm your age') || errLower.includes('sign in');
        setUrlError(isAuthError
          ? "This video is age-restricted or private. Please sync your browser cookies in Settings to download."
          : "Failed to inspect the link.");
      }
      setIsInspecting(false);

      // Auto fetch formats if valid YT url and MP4 selected
      if (downloadType === 'mp4') {
        fetchFormats(newUrl);
      }
    }
  };

  const handlePlaylistDownload = async () => {
    if (selectedPlaylistVideos.length === 0) {
      toast.error("Please select at least one video to download.");
      return;
    }

    let outdir = globalOutputDir;
    if (!outdir) {
      if (window.electronAPI) outdir = await window.electronAPI.chooseDirectory();
      if (!outdir) return;
    }

    setShowPlaylistModal(false);
    setIsDownloading(true);
    downloadCancelRef.current = false;

    const videosToDownload = playlistEntries.filter(v => selectedPlaylistVideos.includes(v.id));

    const initialQueue = videosToDownload.map(v => ({
      id: v.id,
      url: v.url,
      title: v.title,
      progress: 0,
      status: 'Queued',
      error: false
    }));

    setPlaylistDownloadQueue(initialQueue);

    for (let i = 0; i < videosToDownload.length; i++) {
      if (downloadCancelRef.current) break;
      const video = videosToDownload[i];
      currentDownloadingVideoIdRef.current = video.id;

      setPlaylistDownloadQueue(prev => prev.map(item => item.id === video.id ? { ...item, status: 'Starting...' } : item));

      try {
        let result;
        if (downloadType === 'mp4') {
          result = await window.electronAPI.downloadYoutubeAsMp4(video.url, outdir, null, true); // Best quality, noPlaylist=true
        } else {
          result = await window.electronAPI.downloadYoutubeAsMp3(video.url, outdir, true); // noPlaylist=true
        }

        if (result && result.success === false) {
          throw new Error(result.error || "Download failed");
        }

        setPlaylistDownloadQueue(prev => prev.map(item => item.id === video.id ? { ...item, status: 'Done', progress: 100 } : item));

        const newHistoryItem = {
          id: Date.now() + i,
          url: video.url,
          filename: result.filepath.split('\\').pop(),
          filepath: result.filepath,
          type: downloadType,
          date: new Date().toLocaleString()
        };
        setHistory(prev => [newHistoryItem, ...prev]);

      } catch (err) {
        if (downloadCancelRef.current) break;
        const friendlyError = err.message?.includes('3436169992') ? 'Hey! Too fast, please wait a moment.' : err.message;
        setPlaylistDownloadQueue(prev => prev.map(item => item.id === video.id ? { ...item, status: `Error: ${friendlyError}`, error: true } : item));
      }
    }

    currentDownloadingVideoIdRef.current = null;
    if (!downloadCancelRef.current) {
      setStatus('All selected videos downloaded!');
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

  const handleDownload = async () => {
    if (!url) return;

    let outdir = globalOutputDir;
    if (!outdir) {
      if (window.electronAPI) {
        outdir = await window.electronAPI.chooseDirectory();
      }
      if (!outdir) {
        // User cancelled prompt, abort download
        return;
      }
    }

    setIsDownloading(true);
    setProgress(0);
    setStatus('Initializing download...');
    downloadCancelRef.current = false;

    try {
      let result;
      if (downloadType === 'mp4') {
        result = await window.electronAPI.downloadYoutubeAsMp4(url, outdir, parseInt(selectedQuality) || null, true);
      } else {
        result = await window.electronAPI.downloadYoutubeAsMp3(url, outdir, true);
      }

      if (result && result.success === false) {
        throw new Error(result.error || "Download failed");
      }

      setStatus('Completed!');
      setProgress(100);
      toast.success(`Downloaded successfully!`, {
        style: {
          borderRadius: '10px',
          background: '#1E293B',
          color: '#fff',
        },
      });

      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        url,
        filename: result.filepath.split('\\').pop(),
        filepath: result.filepath,
        type: downloadType,
        date: new Date().toLocaleString()
      };
      setHistory([newHistoryItem, ...history]);

      setTimeout(() => {
        setIsDownloading(false);
        setUrl('');
        setProgress(0);
        setStatus('');
        setSingleVideoMetadata(null);
        setFormats([]);
        setSelectedQuality('');
      }, 3000);

    } catch (err) {
      if (downloadCancelRef.current) {
        return; // Handled by confirmSingleCancel
      }
      const friendlyError = err.message?.includes('3436169992') ? 'Hey! Too fast, please wait a moment.' : err.message;
      setStatus(`Error: ${friendlyError}`);
      setIsDownloading(false);
      toast.error(`Download failed: ${friendlyError}`, {
        style: {
          borderRadius: '10px',
          background: '#1E293B',
          color: '#fff',
        },
      });
    }
  };

  const handleConvertLocal = async () => {
    if (!window.electronAPI) return;

    const file = await window.electronAPI.chooseFile();
    if (!file) return;

    const outdir = (await window.electronAPI.chooseDirectory()) || (await window.electronAPI.getDefaultDownloadPath());

    setIsDownloading(true);
    setProgress(0);
    setStatus('Converting MP4 to MP3...');

    try {
      const result = await window.electronAPI.convertLocalMp4(file, outdir);

      setStatus('Completed!');
      setProgress(100);
      toast.success(`Converted to MP3 successfully!`, {
        style: {
          borderRadius: '10px',
          background: '#1E293B',
          color: '#fff',
        },
      });

      const newHistoryItem = {
        id: Date.now(),
        url: 'Local File',
        filename: result.filepath.split('\\').pop(),
        filepath: result.filepath,
        type: 'mp3',
        date: new Date().toLocaleString()
      };
      setHistory([newHistoryItem, ...history]);

      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
        setStatus('');
      }, 3000);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
      setIsDownloading(false);
      toast.error(`Conversion failed: ${err.message}`, {
        style: {
          borderRadius: '10px',
          background: '#1E293B',
          color: '#fff',
        },
      });
    }
  };

  const openLocation = async (filepath) => {
    if (window.electronAPI) {
      await window.electronAPI.openFileLocation(filepath);
    }
  };

  const deleteHistoryItem = (id) => {
    setHistory(history.filter(h => h.id !== id));
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-textPrimary selection:bg-primary/30 selection:text-primary">
      {/* Download Progress Modal */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface/95 border border-border p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" />

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-8 h-8 text-primary animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Downloading</h3>
                <p className="text-textSecondary text-sm max-w-[250px] truncate" title={status || 'Starting...'}>
                  {status || 'Starting...'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-textSecondary">Progress</span>
                  <span className="text-primary font-mono text-lg">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-background/50 border border-border/50 rounded-full h-3 overflow-hidden shadow-inner">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>
              </div>

              {playlistDownloadQueue.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {playlistDownloadQueue.map((item) => (
                    <div key={item.id} className="bg-background/40 border border-border/60 rounded-lg p-2 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-textPrimary truncate mr-2" title={item.title}>{item.title}</span>
                        <span className={`${item.error ? 'text-red-400' : item.progress === 100 ? 'text-green-400' : 'text-primary'}`}>{item.status}</span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${item.error ? 'bg-red-500' : item.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDownloadCancelModal(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 text-base h-12 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 font-medium transition-colors border border-red-600/20"
              >
                <OctagonX size={18} /> Cancel Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Download Cancel Modal */}
      {showDownloadCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[120] p-4">
          <div className="bg-surface/95 border border-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
            <h3 className="text-lg font-bold text-textPrimary">Cancel Download?</h3>
            <p className="text-sm text-textSecondary">
              Are you sure you want to cancel the current download?
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowDownloadCancelModal(false)}
                className="px-4 py-2 rounded-lg bg-background hover:bg-surfaceHover border border-border text-textPrimary font-medium transition-colors"
              >
                Keep Going
              </button>
              <button
                onClick={confirmSingleCancel}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Selection Modal */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface/95 border border-border p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary">Playlist Detected</h3>
                    <p className="text-sm text-textSecondary">Select the videos you want to download.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setUrl('');
                    setPlaylistEntries([]);
                    setSelectedPlaylistVideos([]);
                  }}
                  className="text-textSecondary hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-between items-center mb-4 px-1">
                <label className="flex items-center gap-3 cursor-pointer group text-sm font-medium text-textPrimary hover:text-white transition-colors">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedPlaylistVideos.length === playlistEntries.filter(v => v.title && v.title !== '[Private video]' && v.title !== '[Deleted video]').length && playlistEntries.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const validIds = playlistEntries
                            .filter(v => v.title && v.title !== '[Private video]' && v.title !== '[Deleted video]')
                            .map(v => v.id);
                          setSelectedPlaylistVideos(validIds);
                        } else {
                          setSelectedPlaylistVideos([]);
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-[1.5px] border-white/20 bg-white/5 rounded flex items-center justify-center peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/70 transition-all duration-200 shadow-sm">
                      <Check className={`w-3.5 h-3.5 text-white transition-all duration-200 ${(selectedPlaylistVideos.length === playlistEntries.filter(v => v.title && v.title !== '[Private video]' && v.title !== '[Deleted video]').length && playlistEntries.length > 0) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3} />
                    </div>
                  </div>
                  Select All ({playlistEntries.length})
                </label>
                <span className="text-sm text-primary font-medium">{selectedPlaylistVideos.length} selected</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar border border-border/50 rounded-xl bg-background/30 p-2 space-y-1 mb-6">
                {playlistEntries.map((video, index) => {
                  const isUnavailable = !video.title || video.title === '[Private video]' || video.title === '[Deleted video]';
                  const displayTitle = video.title || 'Unknown Video';

                  return (
                    <label key={video.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 border border-transparent group ${isUnavailable ? 'opacity-50 cursor-not-allowed bg-surface/20' : 'hover:bg-surface/60 cursor-pointer hover:border-border/50'}`}>
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedPlaylistVideos.includes(video.id)}
                          disabled={isUnavailable}
                          onChange={(e) => {
                            if (isUnavailable) return;
                            if (e.target.checked) {
                              setSelectedPlaylistVideos(prev => [...prev, video.id]);
                            } else {
                              setSelectedPlaylistVideos(prev => prev.filter(id => id !== video.id));
                            }
                          }}
                          className="peer sr-only"
                        />
                        <div className={`w-5 h-5 border-[1.5px] rounded flex items-center justify-center transition-all duration-200 shadow-sm ${isUnavailable ? 'border-white/10 bg-white/5' : 'border-white/20 bg-white/5 peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/70'}`}>
                          <Check className={`w-3.5 h-3.5 text-white transition-all duration-200 ${selectedPlaylistVideos.includes(video.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isUnavailable ? 'text-textSecondary line-through' : 'text-textPrimary'}`}>
                          {index + 1}. {displayTitle}
                        </p>
                        {isUnavailable && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" title="This video is private or deleted" />}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end flex-shrink-0">
                <button
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setUrl('');
                    setPlaylistEntries([]);
                    setSelectedPlaylistVideos([]);
                  }}
                  className="px-5 py-2.5 rounded-xl font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaylistDownload}
                  disabled={!globalOutputDir || selectedPlaylistVideos.length === 0}
                  className="px-5 py-2.5 rounded-xl font-medium btn-primary disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Selected
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear History Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface/95 border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold">Clear All History?</h3>
              </div>
              <p className="text-textSecondary mb-6">
                Are you sure you want to clear your download history? This will permanently delete both <strong className="text-textPrimary">Single Downloads</strong> and <strong className="text-textPrimary">Mass Clips</strong> history.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setHistory([]); setShowClearModal(false); }}
                  className="px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Folder Modal */}
      <AnimatePresence>
        {isOutputFolderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface/95 border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-primary" />
                  Output Folder
                </h3>
                <button onClick={() => setIsOutputFolderModalOpen(false)} className="text-textSecondary hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-textSecondary text-sm mb-4">
                Choose where your single downloads and mass clips will be saved.
              </p>

              <div className="bg-background/50 border border-border rounded-xl p-3 mb-6 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase text-textSecondary tracking-wider">Current Location</span>
                <span className="font-mono text-sm break-all text-textPrimary">{globalOutputDir || 'Not set'}</span>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={async () => {
                    const dir = await handleGlobalOutputRequest();
                    if (dir) setIsOutputFolderModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors"
                >
                  Select New Folder
                </button>
                <button
                  onClick={() => setIsOutputFolderModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Full height */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 flex flex-col transition-all duration-300 relative z-20 bg-transparent`}>
        {/* App Title and Collapse Toggle */}
        <div className="h-16 flex items-center pl-3 mb-2 flex-shrink-0 relative">
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
              <img src={iconUrl} alt="Hermanos Forge" className="w-full h-full object-contain" />
            </div>
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 overflow-hidden whitespace-nowrap"
                >
                  <h1 className="text-base font-bold bg-clip-text text-transparent pr-2" style={{ backgroundImage: 'var(--accent-gradient)' }}>
                    Hermanos Forge
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute right-1 flex-shrink-0 p-1.5 rounded-lg text-textSecondary hover:text-white hover:bg-surfaceHover transition-colors z-50 bg-background/50 backdrop-blur-sm"
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <div className="px-2 flex flex-col gap-2 flex-1 pb-4">
          <button
            onClick={() => setActiveTab('download')}
            className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${activeTab === 'download' ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                >
                  Download
                </motion.span>
              )}
            </AnimatePresence>
            {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Download</div>}
          </button>

          <button
            onClick={() => setActiveTab('mass-stitch')}
            className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${activeTab === 'mass-stitch' ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
          >
            <Scissors className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                >
                  Mass Clip
                </motion.span>
              )}
            </AnimatePresence>
            {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Mass Clip</div>}
          </button>

          <button
            onClick={() => setActiveTab('selective-duration')}
            className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${activeTab === 'selective-duration' ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
          >
            <Timer className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                >
                  Selective Duration
                </motion.span>
              )}
            </AnimatePresence>
            {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Selective Duration</div>}
          </button>

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('settings')}
              className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${activeTab === 'settings' ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
              {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Settings</div>}
              {cookieStatus === 'stale' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Nav Bar / Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-transparent z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold capitalize text-textPrimary">{activeTab === 'mass-stitch' ? 'Clip and Stitch' : activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-primary/20 text-primary' : 'hover:bg-surfaceHover text-textSecondary hover:text-textPrimary'}`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">History</span>
            </button>
            <div className="version-pill">v{pkg.version}</div>
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto w-full h-full p-6">
            <div className="w-full h-full relative">
              <motion.div
                initial={false}
                animate={{ opacity: activeTab === 'mass-stitch' ? 1 : 0, y: activeTab === 'mass-stitch' ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className={`min-h-full flex flex-col ${activeTab === 'mass-stitch' ? 'block' : 'hidden'}`}
              >
                <MassClipDownloader
                  globalOutputDir={globalOutputDir}
                  onRequestGlobalOutput={handleGlobalOutputRequest}
                  onStitchSuccess={(filepath, clips) => {
                    const validClips = clips.filter(c => c.url.trim());
                    if (validClips.length > 0) {
                      const newItems = validClips.map((c, i) => {
                        let clipTitle = filepath.split('\\').pop() + ` (Clip ${i + 1})`;
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
                          date: new Date().toLocaleString()
                        };
                      });
                      setHistory(prev => [...newItems.reverse(), ...prev]);
                    } else {
                      const newHistoryItem = {
                        id: Date.now(),
                        url: 'Multiple clips',
                        filename: filepath.split('\\').pop(),
                        filepath,
                        type: 'stitch',
                        date: new Date().toLocaleString()
                      };
                      setHistory(prev => [newHistoryItem, ...prev]);
                    }
                  }} />
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: activeTab === 'selective-duration' ? 1 : 0, y: activeTab === 'selective-duration' ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className={`min-h-full flex flex-col ${activeTab === 'selective-duration' ? 'block' : 'hidden'}`}
              >
                <SelectiveDownloader
                  globalOutputDir={globalOutputDir}
                  onRequestGlobalOutput={handleGlobalOutputRequest}
                  onDownloadSuccess={(filepath, start, end, url, videoTitle) => {
                    const newHistoryItem = {
                      id: Date.now(),
                      url: url,
                      filename: videoTitle || filepath.split('\\').pop(),
                      durationTimestamp: `${start} - ${end}`,
                      filepath,
                      type: 'clip',
                      date: new Date().toLocaleString()
                    };
                    setHistory(prev => [newHistoryItem, ...prev]);
                  }}
                />
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: activeTab === 'download' ? 1 : 0, y: activeTab === 'download' ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className={`min-h-full flex flex-col gap-6 ${activeTab === 'download' ? 'block' : 'hidden'}`}
              >
                {/* URL Input Card */}
                <div className="glass-panel p-6 flex items-center gap-6">
                  <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-textSecondary">Video URL</label>
                      {isInspecting && (
                        <div className="flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 shadow-sm">
                          <Loader2 size={12} className="mr-1.5 animate-spin" />
                          INSPECTING
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={url}
                        onChange={handleUrlChange}
                        placeholder="Paste link here..."
                        className={`input-field h-12 text-lg ${urlError ? 'border-amber-500/50 focus:border-amber-500' : ''}`}
                        disabled={isDownloading || isInspecting}
                      />
                    </div>
                    {urlError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 flex items-start gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>{urlError}</p>
                      </motion.div>
                    )}
                  </div>
                  {/* Quick Download removed to encourage using the main Download control */}
                </div>

                {/* Single Video Metadata Card */}
                {singleVideoMetadata && !isInspecting && !urlError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-4 flex items-center gap-4 border-primary/20 bg-primary/5"
                  >
                    <div className="flex-shrink-0 w-24 h-14 bg-background/50 rounded overflow-hidden flex items-center justify-center relative border border-border">
                      <img
                        src={`https://img.youtube.com/vi/${singleVideoMetadata.id}/mqdefault.jpg`}
                        className="w-full h-full object-cover"
                        alt="thumbnail"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-textPrimary truncate" title={singleVideoMetadata.title}>{singleVideoMetadata.title}</p>
                      <p className="text-xs text-textSecondary truncate mt-0.5">Ready to download • YouTube</p>
                    </div>
                  </motion.div>
                )}

                {/* Settings Card */}
                <div className="glass-panel p-6 flex-1 flex flex-col">
                  <div className="flex items-center mb-6">
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold">Download Options</h2>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Format Selection */}
                    <div className="flex-1 min-w-[280px]">
                      <label className="block text-sm font-medium text-textSecondary mb-3">Format</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all whitespace-nowrap ${downloadType === 'mp4' ? 'bg-primary/20 border-primary' : 'border-border hover:bg-surfaceHover'}`}>
                          <input type="radio" name="format" value="mp4" checked={downloadType === 'mp4'} onChange={() => setDownloadType('mp4')} className="hidden" disabled={isDownloading} />
                          <Video className={`w-5 h-5 mr-2 flex-shrink-0 ${downloadType === 'mp4' ? 'text-primary' : 'text-textSecondary'}`} />
                          <span className={downloadType === 'mp4' ? 'font-medium text-primary' : 'text-textSecondary'}>MP4 Video</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all whitespace-nowrap ${downloadType === 'mp3' ? 'bg-primary/20 border-primary' : 'border-border hover:bg-surfaceHover'}`}>
                          <input type="radio" name="format" value="mp3" checked={downloadType === 'mp3'} onChange={() => setDownloadType('mp3')} className="hidden" disabled={isDownloading} />
                          <Music className={`w-5 h-5 mr-2 flex-shrink-0 ${downloadType === 'mp3' ? 'text-primary' : 'text-textSecondary'}`} />
                          <span className={downloadType === 'mp3' ? 'font-medium text-primary' : 'text-textSecondary'}>MP3 Audio</span>
                        </label>
                      </div>
                    </div>

                    {/* Quality Selection (Only for MP4) */}
                    <div className={`flex-1 min-w-[200px] transition-opacity ${downloadType === 'mp4' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-textSecondary">Video Quality</label>
                        {isFetchingFormats && (
                          <div className="flex items-center px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 shadow-sm">
                            <Loader2 size={12} className="mr-1.5 animate-spin" />
                            FETCHING
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <CustomSelect
                          options={[
                            { value: '', label: 'Best Available' },
                            ...formats.map(f => ({ value: f.height, label: f.resolution }))
                          ]}
                          value={selectedQuality}
                          onChange={(val) => setSelectedQuality(val)}
                          disabled={isDownloading || formats.length === 0}
                          className="h-[58px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 flex gap-4">
                    <button
                      onClick={handleConvertLocal}
                      disabled={!globalOutputDir || isDownloading}
                      className="flex-1 bg-surface hover:bg-surfaceHover border border-border text-textPrimary h-14 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                    >
                      Convert Local MP4
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!globalOutputDir || !url || isDownloading || isFetchingFormats || isInspecting || urlError || playlistEntries.length > 0}
                      className="flex-[2] btn-primary h-14 text-lg flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isDownloading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : 'Download'}
                    </button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: activeTab === 'settings' ? 1 : 0, y: activeTab === 'settings' ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className={`min-h-full flex flex-col gap-6 ${activeTab === 'settings' ? 'block' : 'hidden'}`}
              >
                <div className="glass-panel p-6 flex flex-col gap-8">
                  <div>
                    <div className="flex items-center mb-4">
                      <Settings className="w-5 h-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">General Settings</h2>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
                        <div>
                          <h3 className="font-medium text-textPrimary">Output Folder</h3>
                          <p className="text-sm text-textSecondary mt-1">Change where your downloads are saved.</p>
                        </div>
                        <button
                          onClick={() => setIsOutputFolderModalOpen(true)}
                          className="px-4 py-2 bg-surface hover:bg-surfaceHover border border-border rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Set Folder
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-xl">
                        <div>
                          <h3 className="font-medium text-textPrimary">Developer Logs</h3>
                          <p className="text-sm text-textSecondary mt-1">Open a new window to monitor background processes.</p>
                        </div>
                        <button
                          onClick={() => window.electronAPI && window.electronAPI.openLogsWindow()}
                          className="px-4 py-2 bg-surface hover:bg-surfaceHover border border-border rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                          <Terminal className="w-4 h-4 mr-2" />
                          Show Logs
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <Cookie className="w-5 h-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">Browser Authentication</h2>
                    </div>
                    <div className="p-4 bg-background/50 border border-border rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-textPrimary">Cookie Setup</h3>
                        <p className="text-sm text-textSecondary mt-1">Sync your browser cookies to download age-restricted or private videos.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center mr-1">
                          <span className="text-[11px] font-semibold text-textSecondary mb-1 uppercase tracking-wider">Status</span>
                          {cookieStatus === 'active' && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px] tracking-wide uppercase">Active ({cookieBrowser})</span>}
                          {cookieStatus === 'stale' && <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[10px] tracking-wide uppercase">Stale</span>}
                          {cookieStatus === 'missing' && <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-[10px] tracking-wide uppercase">Missing</span>}
                        </div>
                        <button
                          onClick={() => { setWizardStep(1); setShowCookieWizard(true); }}
                          className="px-5 py-2 btn-primary rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          {cookieStatus === 'active' ? 'Re-sync' : 'Setup Cookie Sync'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Server className="w-5 h-5 mr-2 text-primary" />
                        <h2 className="text-xl font-semibold">System Status</h2>
                      </div>
                      <button
                        onClick={refreshStatus}
                        disabled={isRefreshingStatus}
                        className={`p-2 hover:bg-surface rounded-lg border border-border transition-colors ${isRefreshingStatus ? 'text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                        title="Refresh Status"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <StatusItem name="Python Backend" status={systemStatus.backend?.state || 'CHECKING'} path={systemStatus.backend?.path} />
                      <StatusItem name="FFmpeg" status={systemStatus.ffmpeg?.state || 'CHECKING'} path={systemStatus.ffmpeg?.path} />
                      <StatusItem name="FFprobe" status={systemStatus.ffprobe?.state || 'CHECKING'} path={systemStatus.ffprobe?.path} />
                      <StatusItem name="Cookies" status={cookieStatus === 'active' ? 'ONLINE' : (cookieStatus === 'stale' ? 'STALE' : 'MISSING')} path={cookieStatus === 'active' ? 'Configured' : 'Needs Setup'} />

                      {systemStatus.dlls && systemStatus.dlls.length > 0 && (
                        <div className="col-span-1 md:col-span-2 mt-2">
                          <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-3">
                            Shared Libraries (DLLs)
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {systemStatus.dlls.map(dll => (
                              <StatusItem key={dll.name} name={dll.name} status={dll.state} path={dll.path} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: activeTab === 'history' ? 1 : 0, y: activeTab === 'history' ? 0 : 10 }}
                transition={{ duration: 0.2 }}
                className={`h-full flex flex-col ${activeTab === 'history' ? 'block' : 'hidden'}`}
              >
                <div className="glass-panel p-6 flex-1 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-primary" />
                      <h2 className="text-xl font-semibold">Download History</h2>
                    </div>
                    {history.length > 0 && (
                      <button
                        onClick={() => setShowClearModal(true)}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 border-b border-border mb-4">
                    <button
                      onClick={() => { setHistoryTab('single'); setHistoryPage(1); }}
                      className={`pb-2 text-sm font-medium transition-colors border-b-2 ${historyTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
                    >
                      Single Downloads
                    </button>
                    <button
                      onClick={() => { setHistoryTab('selective'); setHistoryPage(1); }}
                      className={`pb-2 text-sm font-medium transition-colors border-b-2 ${historyTab === 'selective' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
                    >
                      Selective Duration
                    </button>
                    <button
                      onClick={() => { setHistoryTab('stitch'); setHistoryPage(1); }}
                      className={`pb-2 text-sm font-medium transition-colors border-b-2 ${historyTab === 'stitch' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
                    >
                      Mass Clips
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar flex flex-col">
                    {(() => {
                      const filteredHistory = history.filter(h => {
                        if (historyTab === 'single') return h.type === 'mp3' || h.type === 'mp4';
                        if (historyTab === 'selective') return h.type === 'clip';
                        if (historyTab === 'stitch') return h.type === 'stitch';
                        return false;
                      });
                      const itemsPerPage = 5;
                      const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
                      const paginatedHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

                      if (filteredHistory.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-textSecondary flex-1">
                            <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                            <p>No {historyTab === 'stitch' ? 'mass clip' : historyTab === 'selective' ? 'selective duration' : 'download'} history yet.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="flex-1 space-y-3">
                            {paginatedHistory.map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-background/40 border border-border rounded-lg p-4 flex items-center justify-between group hover:bg-surface transition-colors"
                              >
                                <div className="flex items-center overflow-hidden mr-4">
                                  <div className={`p-3 rounded-lg mr-4 flex-shrink-0 ${item.type === 'mp4' || item.type === 'clip' ? 'bg-blue-500/10 text-blue-400' : item.type === 'stitch' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {item.type === 'mp4' || item.type === 'clip' ? <Video className="w-5 h-5" /> : item.type === 'stitch' ? <Scissors className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                                  </div>
                                  <div className="overflow-hidden">
                                    <h3 className="font-medium text-textPrimary truncate max-w-[200px] sm:max-w-[300px]" title={item.filename}>{item.filename}</h3>
                                    {item.type === 'clip' && item.durationTimestamp && (
                                      <div className="text-xs text-textPrimary font-semibold truncate max-w-[200px] sm:max-w-[300px] my-1">
                                        Selected Duration Timestamp: {item.durationTimestamp}
                                      </div>
                                    )}
                                    <div className="text-xs text-primary truncate max-w-[200px] sm:max-w-[300px] my-1" title={item.url}>{item.url}</div>
                                    <div className="flex items-center text-xs text-textSecondary mt-1">
                                      <span className="uppercase font-semibold tracking-wider mr-3">{item.type}</span>
                                      <span>{item.date}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(item.url); toast.success('URL copied!'); }}
                                    className="p-2 bg-surface hover:bg-primary/20 hover:text-primary rounded-md transition-colors"
                                    title="Copy URL"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openLocation(item.filepath)}
                                    className="p-2 bg-surface hover:bg-primary/20 hover:text-primary rounded-md transition-colors"
                                    title="Open File Location"
                                  >
                                    <FolderOpen className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteHistoryItem(item.id)}
                                    className="p-2 bg-surface hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
                                    title="Remove from history"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50 flex-shrink-0">
                              <span className="text-xs text-textSecondary">
                                Showing {(historyPage - 1) * itemsPerPage + 1}-{Math.min(historyPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                  disabled={historyPage === 1}
                                  className="p-1.5 rounded-md bg-surface border border-border text-textSecondary hover:text-white hover:bg-surfaceHover disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium px-2">{historyPage} / {totalPages}</span>
                                <button
                                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                  disabled={historyPage === totalPages}
                                  className="p-1.5 rounded-md bg-surface border border-border text-textSecondary hover:text-white hover:bg-surfaceHover disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Cookie Sync Wizard Modal */}
      <AnimatePresence>
        {showCookieWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-background border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-semibold text-textPrimary">Browser Authentication</h3>
                <button onClick={() => setShowCookieWizard(false)} className="p-2 text-textSecondary hover:text-white rounded-lg hover:bg-background transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 pb-2 custom-scrollbar">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-background/50 border border-border rounded-lg p-4 mb-4">
                      <p className="text-sm text-textSecondary leading-relaxed">
                        This stays entirely on your device. Hermanos Forge — and its developer — never sees, stores, or sends your cookies anywhere. They're saved in a local file on this computer only, used only to talk to YouTube.
                      </p>
                    </div>
                    <h4 className="font-medium text-textPrimary mb-2">Which browser do you normally use?</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['Firefox', 'Chrome', 'Edge', 'Brave', 'Opera'].map(browser => (
                        <button
                          key={browser}
                          onClick={() => setCookieBrowser(browser)}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${cookieBrowser === browser ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-textSecondary/30'}`}
                        >
                          <div className={`w-4 h-4 rounded-full border ${cookieBrowser === browser ? 'border-primary bg-primary flex items-center justify-center' : 'border-textSecondary/50'}`}>
                            {cookieBrowser === browser && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span className="font-medium text-sm">{browser}</span>
                        </button>
                      ))}
                    </div>
                    {cookieBrowser === 'Firefox' && (
                      <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex gap-3 text-emerald-400 text-sm">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <p>Firefox works automatically — click Proceed and you're done.</p>
                      </div>
                    )}
                    <div className="flex justify-end mt-6 gap-3">
                      <button onClick={() => setShowCookieWizard(false)} className="px-5 py-2.5 rounded-xl font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors">Cancel</button>
                      <button
                        onClick={() => {
                          if (cookieBrowser === 'Firefox') {
                            handleFirefoxSync();
                          } else {
                            setWizardStep(2);
                          }
                        }}
                        disabled={isSyncingCookies}
                        className="px-5 py-2.5 rounded-xl font-medium btn-primary flex items-center gap-2"
                      >
                        {isSyncingCookies ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed'}
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-textPrimary">Install Extension</h4>
                    <p className="text-sm text-textSecondary leading-relaxed">
                      Chrome, Edge, and other Chromium browsers lock down login cookies extra tightly, so this needs one small one-time extra step — about 30 seconds.
                    </p>
                    <p className="text-sm text-textSecondary leading-relaxed">
                      Click the button below to open the Chrome Web Store and install the <strong>"Get cookies.txt LOCALLY"</strong> extension. (Edge users: allow extensions from other stores).
                    </p>
                    <div className="flex justify-center py-4">
                      <button
                        onClick={() => window.electronAPI && window.electronAPI.openExternal('https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc')}
                        className="px-6 py-3 bg-surface hover:bg-surfaceHover border border-border rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Open Chrome Web Store
                      </button>
                    </div>
                    <div className="flex justify-between mt-6">
                      <button onClick={() => setWizardStep(1)} className="px-5 py-2.5 rounded-xl font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors">Back</button>
                      <button onClick={() => setWizardStep(3)} className="px-5 py-2.5 rounded-xl font-medium btn-primary">Next</button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-textPrimary">Export Cookies</h4>
                    <p className="text-sm text-textSecondary leading-relaxed">
                      1. Go to <strong>youtube.com</strong> in your browser and make sure you're logged in.<br /><br />
                      2. Click the new extension icon in your browser toolbar (you may need to pin it first).<br /><br />
                      3. Make sure the Export Format is set to <strong>Netscape</strong>.<br /><br />
                      4. Click the main <strong>Export</strong> button <em>(Do not click "Export All Cookies")</em>. This will save a <code className="px-1 py-0.5 bg-background border border-border rounded">cookies.txt</code> file to your Downloads folder.
                    </p>
                    <div className="flex justify-between mt-6">
                      <button onClick={() => setWizardStep(2)} className="px-5 py-2.5 rounded-xl font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors">Back</button>
                      <button onClick={() => setWizardStep(4)} className="px-5 py-2.5 rounded-xl font-medium btn-primary">Next</button>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-textPrimary">Import File</h4>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3 text-amber-500 text-sm">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p>⚠️ This file can contain login info for other sites too. Never share it or upload it anywhere. Hermanos Forge automatically keeps only the YouTube-related cookies and discards the rest once you import it.</p>
                    </div>
                    <p className="text-sm text-textSecondary text-center">
                      <em>Note: You may safely delete your downloaded cookies.txt from your Downloads folder after dragging it here!</em>
                    </p>

                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${isDraggingCookie ? 'border-primary bg-primary/10' : 'border-border bg-background/50 hover:bg-background/80'}`}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCookie(true); }}
                      onDragLeave={() => setIsDraggingCookie(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setIsDraggingCookie(false);
                        const file = e.dataTransfer.files[0];
                        if (file && file.name.endsWith('.txt')) {
                          const path = window.electronAPI.getPathForFile ? window.electronAPI.getPathForFile(file) : file.path;
                          if (path) handleImportCookies(path);
                        } else {
                          toast.error("Please drop a valid .txt file.", { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
                        }
                      }}
                      onClick={async () => {
                        handleImportCookies(null);
                      }}
                    >
                      {isSyncingCookies ? (
                        <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                      ) : (
                        <Upload className={`w-10 h-10 mb-3 ${isDraggingCookie ? 'text-primary' : 'text-textSecondary'}`} />
                      )}
                      <p className="font-medium text-textPrimary mb-1">Drag and drop cookies.txt here</p>
                      <p className="text-xs text-textSecondary">or click to browse files</p>
                    </div>

                    <div className="flex justify-between mt-6">
                      <button onClick={() => setWizardStep(3)} className="px-5 py-2.5 rounded-xl font-medium bg-background border border-border text-textSecondary hover:text-white transition-colors" disabled={isSyncingCookies}>Back</button>
                      <button className="px-5 py-2.5 rounded-xl font-medium btn-primary invisible">Placeholder</button>
                    </div>
                  </div>
                )}

                {wizardStep === 5 && (
                  <div className="space-y-4 text-center py-6">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-semibold text-textPrimary">Saved Successfully</h4>
                    <p className="text-sm text-textSecondary max-w-sm mx-auto">
                      You can now download age-restricted and private videos.
                    </p>
                    <p className="text-sm text-textSecondary max-w-sm mx-auto mt-4 bg-background/50 p-3 rounded-lg border border-border text-left">
                      This usually stays working for a few weeks. If downloads start failing again, just repeat these steps — you'll get a heads-up in the app when that happens.
                    </p>
                    <div className="flex justify-center mt-6">
                      <button onClick={() => setShowCookieWizard(false)} className="px-8 py-3 rounded-xl font-medium btn-primary">Done</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="bottom-right" />
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return true; // Default to dark mode
    } catch { return true; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(s => !s)}
      className="p-2 rounded-full bg-surface border border-border shadow-sm hover:scale-105 transition-transform"
      title="Toggle Theme"
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </button>
  );
}

export function StatusItem({ name, status, path }) {
  let colorClass = 'bg-blue-500/10 text-blue-500 border border-blue-500/20'; // Default / CHECKING
  const isChecking = status === 'CHECKING';
  if (status.includes('ONLINE')) {
    colorClass = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
  } else if (status === 'MISSING') {
    colorClass = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
  } else if (status === 'STALE') {
    colorClass = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  }

  return (
    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-background/60 border border-border/60 hover:bg-background/80 transition-colors">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-textPrimary">{name}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide flex items-center ${colorClass}`}>
          {status}
          {isChecking && (
            <span className="inline-flex items-center gap-[2px] ml-1.5">
              <motion.span animate={{ y: [0, -2.5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="w-[3px] h-[3px] bg-current rounded-full" />
              <motion.span animate={{ y: [0, -2.5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} className="w-[3px] h-[3px] bg-current rounded-full" />
              <motion.span animate={{ y: [0, -2.5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-[3px] h-[3px] bg-current rounded-full" />
            </span>
          )}
        </span>
      </div>
      <div className="text-[10px] text-textSecondary font-mono truncate mt-0.5" title={path}>
        {path}
      </div>
    </div>
  );
}
