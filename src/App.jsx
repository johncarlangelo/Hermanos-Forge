import { useState, useEffect, useRef, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

import { TitleBar } from '@/components/ui/TitleBar';
import { ActivityDock } from '@/components/studio/ActivityDock';
import { CommandBar } from '@/components/studio/CommandBar';
import { TimelineRuler } from '@/components/studio/TimelineRuler';
import { InspectorRail } from '@/components/studio/InspectorRail';

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

  // Collapsible Studio Inspector Rail State
  const [isInspectorOpen, setIsInspectorOpen] = useState(() => {
    try {
      return localStorage.getItem('inspector-open') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleInspector = useCallback(() => {
    setIsInspectorOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('inspector-open', String(next));
      } catch (err) {
        console.debug('Failed to persist inspector state:', err);
      }
      return next;
    });
  }, []);

  // Persistent Studio Timeline State
  const [timelineDuration, setTimelineDuration] = useState(180);
  const [timelineStart, setTimelineStart] = useState(0);
  const [timelineEnd, setTimelineEnd] = useState(180);
  const [timelineCurrent, setTimelineCurrent] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I' || e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleInspector();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('download');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('mass-clip');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('selective');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('history');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('settings');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleInspector]);

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

  // Multi-Track Stitcher Studio State
  const [massClips, setMassClips] = useState(() => {
    try {
      const saved = localStorage.getItem('mass-clips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isMassProcessing, setIsMassProcessing] = useState(false);
  const [massStatus, setMassStatus] = useState('');
  const massActionsRef = useRef(null);

  // Keyframe Trimmer Studio State
  const [trimmerClipsCount, setTrimmerClipsCount] = useState(0);
  const [isTrimmerDownloading, setIsTrimmerDownloading] = useState(false);
  const [trimmerStatus, setTrimmerStatus] = useState('');
  const trimmerActionsRef = useRef(null);

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
              if (inspectResult.duration && inspectResult.duration > 0) {
                setTimelineDuration(inspectResult.duration);
                setTimelineEnd(inspectResult.duration);
                setTimelineStart(0);
                setTimelineCurrent(0);
              }
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0b10] text-[#f4f4f7] overflow-hidden font-sans select-none relative">
      {/* Title Bar with Dynamic Breadcrumb */}
      <TitleBar activeTab={activeTab} />

      {/* Main Studio Workbench Shell (3-Zone Spatial Architecture) */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* 1. Left Activity Dock (Sleek Vertical Tool Dock) */}
        <ActivityDock
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          historyCount={history.length}
          cookieBrowser={cookieBrowser}
          cookieStatus={cookieStatus}
          onOpenCookieWizard={() => setShowCookieWizard(true)}
          globalOutputDir={globalOutputDir}
          onOpenOutputModal={() => setShowOutputFolderModal(true)}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={toggleInspector}
        />

        {/* 2. Center Stage (The Studio Canvas) */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#0b0b10] relative">
          {/* Header: Global Spotlight / Command Bar */}
          <CommandBar
            url={url}
            setUrl={handleUrlChange}
            isDownloading={isDownloading}
            isInspecting={isInspecting}
            urlError={urlError}
            singleVideoMetadata={singleVideoMetadata}
            playlistEntries={playlistEntries}
            onOpenPlaylistModal={() => setShowPlaylistModal(true)}
            onDownload={handleSingleDownload}
            activeTab={activeTab}
            onOpenCookieWizard={() => setShowCookieWizard(true)}
            onAddTrack={(trackUrl) => {
              massActionsRef.current?.addClipWithUrl(trackUrl);
              toast.success('Track added to stitch sequence!');
            }}
          />

          {/* Main Viewport: Rich Interactive Canvas */}
          <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 custom-scrollbar bg-[#0b0b10] relative">
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
                onNavigateTab={setActiveTab}
              />
            </div>

            <div className={activeTab === 'mass-clip' ? 'block' : 'hidden'}>
              <MassClipView
                globalOutputDir={globalOutputDir}
                onRequestGlobalOutput={handleSelectOutputDir}
                onClipsChange={setMassClips}
                onProcessingChange={setIsMassProcessing}
                onStatusChange={setMassStatus}
                onRegisterActions={(actions) => {
                  massActionsRef.current = actions;
                }}
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
                onTimingChange={({ duration, startTime, endTime }) => {
                  setTimelineDuration(duration);
                  setTimelineStart(startTime);
                  setTimelineEnd(endTime);
                }}
                onClipsCountChange={setTrimmerClipsCount}
                onProcessingChange={setIsTrimmerDownloading}
                onStatusChange={setTrimmerStatus}
                onRegisterActions={(actions) => {
                  trimmerActionsRef.current = actions;
                }}
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

          {/* Bottom Dock: Persistent Studio Timeline Ruler */}
          <TimelineRuler
            duration={timelineDuration}
            startTime={timelineStart}
            setStartTime={(val) => {
              setTimelineStart(val);
              if (activeTab === 'selective') {
                trimmerActionsRef.current?.setTrimRange(val, timelineEnd);
              }
            }}
            endTime={timelineEnd}
            setEndTime={(val) => {
              setTimelineEnd(val);
              if (activeTab === 'selective') {
                trimmerActionsRef.current?.setTrimRange(timelineStart, val);
              }
            }}
            currentTime={timelineCurrent}
            setCurrentTime={setTimelineCurrent}
            activeTab={activeTab}
            sequenceItemsCount={massClips.filter((c) => c.url && c.url.trim()).length}
          />
        </div>

        {/* 3. Right Inspector & Telemetry Rail (Collapsible) */}
        <InspectorRail
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          activeTab={activeTab}
          downloadType={downloadType}
          setDownloadType={setDownloadType}
          selectedQuality={selectedQuality}
          setSelectedQuality={setSelectedQuality}
          formats={formats}
          isFetchingFormats={isFetchingFormats}
          globalOutputDir={globalOutputDir}
          onOpenOutputModal={() => setShowOutputFolderModal(true)}
          isDownloading={isDownloading}
          progress={singleProgress}
          status={singleStatus}
          onDownload={handleSingleDownload}
          onCancelClick={() => setShowCancelConfirmModal(true)}
          url={url}
          singleVideoMetadata={singleVideoMetadata}
          playlistEntries={playlistEntries}
          onOpenPlaylistModal={() => setShowPlaylistModal(true)}
          onConvertLocal={handleConvertLocal}
          // Multi-track stitcher props
          massClips={massClips}
          isMassProcessing={isMassProcessing}
          massStatus={massStatus}
          onMassStitch={() => massActionsRef.current?.triggerStitch()}
          onMassCancel={() => massActionsRef.current?.triggerCancel()}
          // Keyframe trimmer props
          trimmerClipsCount={trimmerClipsCount}
          isTrimmerDownloading={isTrimmerDownloading}
          trimmerStatus={trimmerStatus}
          onTrimmerDownload={() => trimmerActionsRef.current?.triggerDownload()}
          onTrimmerCancel={() => trimmerActionsRef.current?.triggerCancel()}
          trimmerStartTime={timelineStart}
          trimmerEndTime={timelineEnd}
          // History ledger props
          historyCount={history.length}
          onOpenClearHistoryModal={() => setShowClearHistoryModal(true)}
          // Settings props
          systemStatus={systemStatus}
          onRefreshDiagnostics={refreshSystemStatus}
          isRefreshingDiagnostics={isRefreshingStatus}
          onOpenCookieWizard={() => setShowCookieWizard(true)}
          cookieBrowser={cookieBrowser}
          cookieStatus={cookieStatus}
        />
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
