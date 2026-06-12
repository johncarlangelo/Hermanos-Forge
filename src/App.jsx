import { useState, useEffect } from 'react';
import iconUrl from './assets/icon.svg';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings, Clock, Trash2, FolderOpen, Video, Music, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('download'); // download, history
  const [url, setUrl] = useState('');
  const [formats, setFormats] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [isFetchingFormats, setIsFetchingFormats] = useState(false);
  const [downloadType, setDownloadType] = useState('mp4'); // mp4, mp3
  
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('download-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('download-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    // Set up IPC listeners
    if (window.electronAPI) {
      window.electronAPI.onProgressUpdate((event, percent) => {
        setProgress(percent);
      });
      window.electronAPI.onStatusUpdate((event, msg) => {
        setStatus(msg);
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
    
    let outdir;
    if (window.electronAPI) {
      outdir = await window.electronAPI.chooseDirectory();
    }
    if (!outdir && window.electronAPI && window.electronAPI.getDefaultDownloadPath) {
      outdir = await window.electronAPI.getDefaultDownloadPath();
    }
    
    setIsDownloading(true);
    setProgress(0);
    setStatus('Initializing download...');
    
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
    <div className="min-h-screen w-full bg-background">
      <div className="max-w-6xl mx-auto w-full flex flex-col p-6 min-h-screen">
        <Toaster position="bottom-right" />

        {/* Header */}
        <header className="app-header">
          <div className="flex items-center gap-3">
            <div className="app-icon-wrap">
              <img src={iconUrl} alt="Hermanos Forge" className="app-icon" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--accent-gradient)' }}>
                Hermanos Forge
              </h1>
              <p className="text-textSecondary text-sm mt-1">Sleek Media Downloader</p>
            </div>
          </div>

          <div className="nav-group">
            <div className="pill-nav">
              <button 
                onClick={() => setActiveTab('download')}
                className={`px-4 py-2 rounded-full transition-all ${activeTab === 'download' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-white'}`}
              >
                <Download className="w-4 h-4 inline-block mr-2" />
                Download
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-full transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-white'}`}
              >
                <Clock className="w-4 h-4 inline-block mr-2" />
                History
              </button>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Area */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'download' ? (
            <motion.div 
              key="download-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col gap-6"
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
                      placeholder="Paste YouTube link here..."
                      className="input-field h-12 text-lg"
                      disabled={isDownloading}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button onClick={handleDownload} className="btn-primary h-12 px-5">Quick Download</button>
                </div>
              </div>

              {/* Settings Card */}
              <div className="glass-panel p-6 flex-1 flex flex-col">
                <div className="flex items-center mb-6">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  <h2 className="text-xl font-semibold">Download Options</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-3">Format</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${downloadType === 'mp4' ? 'bg-primary/20 border-primary' : 'border-border hover:bg-surfaceHover'}`}>
                        <input type="radio" name="format" value="mp4" checked={downloadType === 'mp4'} onChange={() => setDownloadType('mp4')} className="hidden" disabled={isDownloading} />
                        <Video className={`w-5 h-5 mr-2 ${downloadType === 'mp4' ? 'text-primary' : 'text-textSecondary'}`} />
                        <span className={downloadType === 'mp4' ? 'font-medium text-primary' : 'text-textSecondary'}>MP4 Video</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${downloadType === 'mp3' ? 'bg-primary/20 border-primary' : 'border-border hover:bg-surfaceHover'}`}>
                        <input type="radio" name="format" value="mp3" checked={downloadType === 'mp3'} onChange={() => setDownloadType('mp3')} className="hidden" disabled={isDownloading} />
                        <Music className={`w-5 h-5 mr-2 ${downloadType === 'mp3' ? 'text-primary' : 'text-textSecondary'}`} />
                        <span className={downloadType === 'mp3' ? 'font-medium text-primary' : 'text-textSecondary'}>MP3 Audio</span>
                      </label>
                    </div>
                  </div>

                  {/* Quality Selection (Only for MP4) */}
                  <div className={`transition-opacity ${downloadType === 'mp4' ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
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
              
              {/* Progress Bar Area */}
              <AnimatePresence>
                {isDownloading && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-panel p-5 overflow-hidden"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-textPrimary">{status || 'Starting...'}</span>
                      <span className="text-primary font-mono">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                      <motion.div 
                        className="bg-primary h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    <h2 className="text-xl font-semibold">Download History</h2>
                  </div>
                  {history.length > 0 && (
                     <button 
                      onClick={clearHistory}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-textSecondary">
                      <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
                      <p>No history yet. Start downloading!</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-background/40 border border-border rounded-lg p-4 flex items-center justify-between group hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center overflow-hidden mr-4">
                          <div className={`p-3 rounded-lg mr-4 ${item.type === 'mp4' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {item.type === 'mp4' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-medium text-textPrimary truncate max-w-sm" title={item.filename}>{item.filename}</h3>
                            <div className="text-xs text-primary truncate max-w-sm my-1" title={item.url}>{item.url}</div>
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
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </button>
    );
  }
