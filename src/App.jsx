import { useState, useEffect, useRef } from 'react';
import iconUrl from './assets/icon.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings, Clock, Trash2, FolderOpen, Video, Music, CheckCircle2, AlertCircle, Copy, Scissors, Menu, Terminal, Activity, Server, RefreshCw, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, X, OctagonX } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import pkg from '../package.json';
import MassClipDownloader from './MassClipDownloader';

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

  // Auto-refresh when the modal is opened
  useEffect(() => {
    if (isStatusOpen) {
      refreshStatus();
    }
  }, [isStatusOpen]);

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
    if (window.electronAPI) {
      window.electronAPI.onProgressUpdate((event, percent) => {
        setProgress(percent);
        try { console.log('electron status - PROGRESS:', percent); } catch (e) { }
      });
      window.electronAPI.onStatusUpdate((event, msg) => {
        setStatus(msg);
        try { console.log('electron status - STATUS:', msg); } catch (e) { }
      });
    }
  }, []);

  const handleUrlChange = async (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Auto fetch formats if valid YT url and MP4 selected
    if (newUrl && (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) && downloadType === 'mp4') {
      setIsFetchingFormats(true);
      try {
        if (window.electronAPI) {
          const fetchedFormats = await window.electronAPI.getAvailableFormats(newUrl);
          if (fetchedFormats && fetchedFormats.length > 0) {
            setFormats(fetchedFormats);
            setSelectedQuality(fetchedFormats[fetchedFormats.length - 1].height.toString()); // Best by default
          }
        }
      } catch (err) {
        console.error("Failed to fetch formats");
        toast.error("Failed to fetch video qualities. You can still try downloading with 'Best Available' settings.", {
          style: {
            borderRadius: '10px',
            background: '#1E293B',
            color: '#fff',
          },
        });
      } finally {
        setIsFetchingFormats(false);
      }
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
        result = await window.electronAPI.downloadYoutubeAsMp4(url, outdir, parseInt(selectedQuality) || null);
      } else {
        result = await window.electronAPI.downloadYoutubeAsMp3(url, outdir);
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
      }, 3000);

    } catch (err) {
      if (downloadCancelRef.current) {
        return; // Handled by confirmSingleCancel
      }
      setStatus(`Error: ${err.message}`);
      setIsDownloading(false);
      toast.error(`Download failed: ${err.message}`, {
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

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-textPrimary selection:bg-primary/30 selection:text-primary">
      <Toaster position="bottom-right" />

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
            onClick={() => setActiveTab('history')}
            className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${activeTab === 'history' ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                >
                  History
                </motion.span>
              )}
            </AnimatePresence>
            {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">History</div>}
          </button>

          <div className="mt-auto pt-4 flex flex-col gap-2">
            <button
              onClick={() => setIsOutputFolderModalOpen(true)}
              className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start text-textSecondary hover:text-white hover:bg-surfaceHover`}
            >
              <FolderOpen className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                  >
                    Set Output Folder
                  </motion.span>
                )}
              </AnimatePresence>
              {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Output Folder</div>}
            </button>

            <button
              onClick={() => window.electronAPI && window.electronAPI.openLogsWindow()}
              className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start text-textSecondary hover:text-white hover:bg-surfaceHover`}
            >
              <Terminal className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                  >
                    Show Logs
                  </motion.span>
                )}
              </AnimatePresence>
              {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">Developer Logs</div>}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`group relative flex items-center h-12 rounded-xl transition-all px-4 w-full justify-start ${isStatusOpen ? 'text-primary' : 'text-textSecondary'} hover:text-white hover:bg-surfaceHover`}
              >
                <Activity className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence initial={false}>
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium whitespace-nowrap ml-3 overflow-hidden"
                    >
                      System Status
                    </motion.span>
                  )}
                </AnimatePresence>
                {isSidebarCollapsed && <div className="absolute left-full ml-4 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">System Status</div>}
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full bottom-0 ml-4 w-80 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-4 z-50 overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-textPrimary flex items-center gap-2">
                        <Server className="w-4 h-4 text-primary" /> System Status
                      </h3>
                      <button
                        onClick={refreshStatus}
                        disabled={isRefreshingStatus}
                        className={`p-1.5 hover:bg-background rounded-md transition-colors ${isRefreshingStatus ? 'text-primary' : 'text-textSecondary hover:text-textPrimary'}`}
                        title="Refresh Status"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      <StatusItem name="Python Backend" status={systemStatus.backend?.state || 'CHECKING'} path={systemStatus.backend?.path} />
                      <StatusItem name="FFmpeg" status={systemStatus.ffmpeg?.state || 'CHECKING'} path={systemStatus.ffmpeg?.path} />
                      <StatusItem name="FFprobe" status={systemStatus.ffprobe?.state || 'CHECKING'} path={systemStatus.ffprobe?.path} />

                      {systemStatus.dlls && systemStatus.dlls.length > 0 && (
                        <>
                          <div className="text-[10px] font-semibold text-textSecondary uppercase tracking-wider pt-3 pb-1 border-t border-border/40 mt-3">
                            Shared Libraries (DLLs)
                          </div>
                          {systemStatus.dlls.map(dll => (
                            <StatusItem key={dll.name} name={dll.name} status={dll.state} path={dll.path} />
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            <div className="version-pill">v{pkg.version}</div>
            <ThemeToggle />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-5xl mx-auto w-full h-full p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'mass-stitch' ? (
                <motion.div
                  key="mass-stitch-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-full flex flex-col"
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
              ) : activeTab === 'download' ? (
                <motion.div
                  key="download-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="min-h-full flex flex-col gap-6"
                >
                  {/* URL Input Card */}
                  <div className="glass-panel p-6 flex items-center gap-6">
                    <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                      <Download className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-textSecondary mb-2">Video URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={url}
                          onChange={handleUrlChange}
                          placeholder="Paste link here..."
                          className="input-field h-12 text-lg"
                          disabled={isDownloading}
                        />
                      </div>
                    </div>
                    {/* Quick Download removed to encourage using the main Download control */}
                  </div>

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
                        <label className="block text-sm font-medium text-textSecondary mb-3">Video Quality</label>
                        <div className="relative">
                          {isFetchingFormats && <div className="absolute right-3 top-3 animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
                          <select
                            value={selectedQuality}
                            onChange={(e) => setSelectedQuality(e.target.value)}
                            disabled={isDownloading || formats.length === 0}
                            className="input-field h-[58px] appearance-none cursor-pointer"
                          >
                            <option value="">Best Available</option>
                            {formats.map(f => (
                              <option key={f.format_id} value={f.height}>{f.resolution}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 flex gap-4">
                      <button
                        onClick={handleConvertLocal}
                        disabled={isDownloading}
                        className="flex-1 bg-surface hover:bg-surfaceHover border border-border text-textPrimary h-14 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                      >
                        Convert Local MP4
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={!url || isDownloading}
                        className="flex-[2] btn-primary h-14 text-lg flex items-center justify-center"
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
              ) : (
                <motion.div
                  key="history-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full flex flex-col"
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
                        onClick={() => { setHistoryTab('stitch'); setHistoryPage(1); }}
                        className={`pb-2 text-sm font-medium transition-colors border-b-2 ${historyTab === 'stitch' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
                      >
                        Mass Clips
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar flex flex-col">
                      {(() => {
                        const filteredHistory = history.filter(h => historyTab === 'stitch' ? h.type === 'stitch' : h.type !== 'stitch');
                        const itemsPerPage = 5;
                        const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
                        const paginatedHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

                        if (filteredHistory.length === 0) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center text-textSecondary flex-1">
                              <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                              <p>No {historyTab === 'stitch' ? 'mass clip' : 'download'} history yet.</p>
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
                                    <div className={`p-3 rounded-lg mr-4 flex-shrink-0 ${item.type === 'mp4' ? 'bg-blue-500/10 text-blue-400' : item.type === 'stitch' ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                      {item.type === 'mp4' ? <Video className="w-5 h-5" /> : item.type === 'stitch' ? <Scissors className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                                    </div>
                                    <div className="overflow-hidden">
                                      <h3 className="font-medium text-textPrimary truncate max-w-[200px] sm:max-w-[300px]" title={item.filename}>{item.filename}</h3>
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
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return true; // Default to dark mode
    } catch (e) { return true; }
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
