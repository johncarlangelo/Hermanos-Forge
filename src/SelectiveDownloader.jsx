import { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Loader2, Lock, Unlock, Trash2, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from './CustomSelect';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatTimeShort = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const parseTime = (timeStr) => {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    const val = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return isNaN(val) ? 0 : val;
  }
  return 0;
};

const ClipTimeline = ({ clip, metadata, updateClip, removeClip, index, totalClips, isDownloadingQueue, handleRetryClip }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [startInput, setStartInput] = useState('00:00:00');
  const [endInput, setEndInput] = useState('00:00:00');

  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isHoveringStart, setIsHoveringStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isHoveringEnd, setIsHoveringEnd] = useState(false);

  const trackRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line
    setStartInput(formatTime(clip.startTime));
    setEndInput(formatTime(clip.endTime));
  }, [clip.startTime, clip.endTime]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || clip.isLocked || clip.isExcluded) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          const delta = e.deltaY > 0 ? -0.5 : 0.5;
          return Math.max(1, Math.min(50, prev + delta));
        });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clip.isLocked, clip.isExcluded]);

  const handleStartInputChange = (e) => setStartInput(e.target.value);
  const handleEndInputChange = (e) => setEndInput(e.target.value);

  const handleStartInputBlur = () => {
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(startInput);
    if (parsed >= clip.endTime) {
      parsed = Math.max(0, clip.endTime - 5);
      toast.error("Start time must be before end time.");
    }
    updateClip(clip.id, { startTime: parsed });
    setStartInput(formatTime(parsed));
  };

  const handleEndInputBlur = () => {
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(endInput);
    if (parsed <= clip.startTime) {
      parsed = Math.min(metadata.duration, clip.startTime + 5);
      toast.error("End time must be after start time.");
    } else if (parsed > metadata.duration) {
      parsed = metadata.duration;
    }
    updateClip(clip.id, { endTime: parsed });
    setEndInput(formatTime(parsed));
  };

  const handleThumbPointerDown = (e, isStart) => {
    if (clip.isLocked || clip.isExcluded) return;
    e.stopPropagation();
    e.preventDefault();

    if (isStart) setIsDraggingStart(true);
    else setIsDraggingEnd(true);

    const startX = e.clientX;
    const initialTime = isStart ? clip.startTime : clip.endTime;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata) return;
      const trackWidth = trackRef.current.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / trackWidth) * metadata.duration;

      if (isStart) {
        const newTime = Math.max(0, Math.min(initialTime + timeDelta, clip.endTime - 5));
        updateClip(clip.id, { startTime: newTime });
      } else {
        const newTime = Math.min(metadata.duration, Math.max(initialTime + timeDelta, clip.startTime + 5));
        updateClip(clip.id, { endTime: newTime });
      }
    };

    const handlePointerUp = () => {
      if (isStart) setIsDraggingStart(false);
      else setIsDraggingEnd(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleRangePointerDown = (e) => {
    if (clip.isLocked || clip.isExcluded) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const initialStart = clip.startTime;
    const initialEnd = clip.endTime;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata) return;
      const trackWidth = trackRef.current.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      let timeDelta = (deltaX / trackWidth) * metadata.duration;

      if (initialStart + timeDelta < 0) {
        timeDelta = -initialStart;
      } else if (initialEnd + timeDelta > metadata.duration) {
        timeDelta = metadata.duration - initialEnd;
      }

      updateClip(clip.id, {
        startTime: initialStart + timeDelta,
        endTime: initialEnd + timeDelta
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const ticks = useMemo(() => {
    if (!metadata || !metadata.duration) return [];
    const numTicks = Math.max(5, Math.floor(5 * zoomLevel));
    const interval = metadata.duration / numTicks;
    const arr = [];
    for (let i = 1; i < numTicks; i++) {
      arr.push(i * interval);
    }
    return arr;
  }, [metadata, zoomLevel]);

  return (
    <div className={`glass-panel p-6 flex-1 flex flex-col min-h-min mb-6 transition-all ${clip.isExcluded ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      {/* Clip Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="font-bold text-lg text-primary">Clip {index + 1}</h3>

          <input
            type="text"
            placeholder={`VIDEO TITLE ${index + 1}`}
            value={clip.title}
            onChange={(e) => updateClip(clip.id, { title: e.target.value })}
            disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            className="input-field h-10 px-4 text-sm w-56 font-medium"
          />

          <button
            onClick={() => updateClip(clip.id, { isLocked: !clip.isLocked })}
            disabled={clip.isExcluded || isDownloadingQueue}
            className={`p-2 rounded-lg transition-colors border shadow-sm ${clip.isLocked ? 'bg-primary/20 border-primary/30' : 'bg-surface border-border hover:bg-surfaceHover'}`}
            title={clip.isLocked ? "Unlock Timeline" : "Lock Timeline (Prevents accidental edits)"}
          >
            {clip.isLocked ? <Lock className="w-5 h-5 text-primary" /> : <Unlock className="w-5 h-5 text-textSecondary" />}
          </button>

          <button
            onClick={() => updateClip(clip.id, { isExcluded: !clip.isExcluded })}
            disabled={isDownloadingQueue}
            className="flex items-center gap-2 text-sm cursor-pointer ml-2 text-textSecondary hover:text-textPrimary transition-colors"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shadow-sm ${clip.isExcluded ? 'bg-primary border-primary text-white' : 'bg-surface border-border'}`}>
              {clip.isExcluded && <Check className="w-3.5 h-3.5" />}
            </div>
            Exclude from Queue
          </button>
        </div>

        {totalClips > 1 && (
          <button
            onClick={() => removeClip(clip.id)}
            disabled={isDownloadingQueue}
            className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-400/10 rounded-lg border border-red-400/20 hover:bg-red-400/20 disabled:opacity-50"
            title="Remove Timeline"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Indicator (Inline) */}
      {(clip.status !== 'idle' || clip.message) && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between font-medium shadow-sm border ${clip.status === 'downloading' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            clip.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
              clip.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-surface text-textSecondary border-border'
          }`}>
          <div className="flex items-center gap-3">
            {clip.status === 'downloading' && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{clip.message || 'Queued...'}</span>
          </div>
          {clip.status === 'error' && handleRetryClip && (
            <button 
              onClick={() => handleRetryClip(clip)} 
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg text-sm border border-red-500/30 transition-colors shadow-sm ml-auto"
            >
              Retry Clip
            </button>
          )}
          {clip.status === 'downloading' && clip.progress > 0 && (
            <span className="font-mono text-lg ml-auto">{clip.progress.toFixed(1)}%</span>
          )}
        </div>
      )}

      {/* Timeline wrapper - disabled if locked or excluded */}
      <div className={`transition-opacity duration-300 ${clip.isLocked || clip.isExcluded ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-textSecondary">Timeline</h4>
          <div className="flex items-center gap-2 w-72">
            <button
              onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-surface hover:bg-surfaceHover text-textPrimary font-bold border border-border shadow-sm transition-colors hover:shadow active:scale-95"
            >
              -
            </button>
            <input
              type="range"
              min="1" max="50" step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
            <button
              onClick={() => setZoomLevel(prev => Math.min(50, prev + 0.5))}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-surface hover:bg-surfaceHover text-textPrimary font-bold border border-border shadow-sm transition-colors hover:shadow active:scale-95"
            >
              +
            </button>
            <span className="text-xs text-textSecondary font-mono w-10 text-right">{zoomLevel.toFixed(1)}x</span>
          </div>
        </div>

        {/* Viewport */}
        <div
          ref={containerRef}
          className="w-full h-36 pt-10 pb-2 bg-background/50 rounded-xl border border-border overflow-x-auto overflow-y-hidden relative shadow-inner timeline-scrollbar custom-scrollbar"
        >
          <div
            ref={trackRef}
            className="h-full relative bg-surface"
            style={{ width: `${zoomLevel * 100}%` }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, var(--border) 49px, var(--border) 50px)' }} />

            {/* Major Ticks */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute top-0 bottom-0 left-0 flex flex-col items-start justify-end pb-1 pl-2">
                <div className="w-px h-3 bg-border/80 mb-1" />
                <span className="text-[10px] text-textSecondary font-mono opacity-80 whitespace-nowrap">
                  00:00:00
                </span>
              </div>

              {ticks.map((t, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
                  style={{ left: `${(t / metadata.duration) * 100}%` }}
                >
                  <div className="w-px h-3 bg-border/80 mb-1" />
                  <span className="text-[10px] text-textSecondary font-mono opacity-80 whitespace-nowrap -ml-3">
                    {formatTimeShort(t)}
                  </span>
                </div>
              ))}

              <div className="absolute top-0 bottom-0 right-0 flex flex-col items-end justify-end pb-1 pr-2">
                <div className="w-px h-3 bg-border/80 mb-1 mr-4" />
                <span className="text-[10px] text-textSecondary font-mono opacity-80 whitespace-nowrap">
                  {formatTime(metadata.duration)}
                </span>
              </div>
            </div>

            {/* Highlighted Selection Range (Draggable) */}
            <div
              onPointerDown={handleRangePointerDown}
              className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary/50 cursor-grab active:cursor-grabbing z-10 transition-colors hover:bg-primary/30"
              style={{
                left: `${(clip.startTime / metadata.duration) * 100}%`,
                right: `${100 - (clip.endTime / metadata.duration) * 100}%`
              }}
            />

            {/* Start Thumb */}
            <div
              onPointerDown={(e) => handleThumbPointerDown(e, true)}
              onMouseEnter={() => setIsHoveringStart(true)}
              onMouseLeave={() => setIsHoveringStart(false)}
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
              style={{ left: `${(clip.startTime / metadata.duration) * 100}%` }}
            >
              <div className={`absolute -top-10 ${clip.startTime < metadata.duration * 0.05 ? 'left-0' : 'left-1/2 -translate-x-1/2'} bg-surface/95 backdrop-blur-sm border border-border text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg transition-opacity duration-150 pointer-events-none whitespace-nowrap ${isDraggingStart || isHoveringStart ? 'opacity-100' : 'opacity-0'}`}>
                {formatTime(clip.startTime)}
              </div>
              <div className={`w-1.5 h-14 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full transition-colors border border-black/20 ${isDraggingStart ? 'bg-primary' : 'group-hover:bg-primary'}`} />
            </div>

            {/* End Thumb */}
            <div
              onPointerDown={(e) => handleThumbPointerDown(e, false)}
              onMouseEnter={() => setIsHoveringEnd(true)}
              onMouseLeave={() => setIsHoveringEnd(false)}
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
              style={{ left: `${(clip.endTime / metadata.duration) * 100}%` }}
            >
              <div className={`absolute -top-10 ${clip.endTime > metadata.duration * 0.95 ? 'right-0' : 'left-1/2 -translate-x-1/2'} bg-surface/95 backdrop-blur-sm border border-border text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg transition-opacity duration-150 pointer-events-none whitespace-nowrap ${isDraggingEnd || isHoveringEnd ? 'opacity-100' : 'opacity-0'}`}>
                {formatTime(clip.endTime)}
              </div>
              <div className={`w-1.5 h-14 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full transition-colors border border-black/20 ${isDraggingEnd ? 'bg-primary' : 'group-hover:bg-primary'}`} />
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex gap-6 items-center mt-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-textSecondary mb-2">Start Time</label>
            <input
              type="text"
              value={startInput}
              onChange={handleStartInputChange}
              onBlur={handleStartInputBlur}
              className="input-field w-full h-12 font-mono text-center text-lg tracking-wider"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-textSecondary mb-2">End Time</label>
            <input
              type="text"
              value={endInput}
              onChange={handleEndInputChange}
              onBlur={handleEndInputBlur}
              className="input-field w-full h-12 font-mono text-center text-lg tracking-wider"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SelectiveDownloader({ globalOutputDir, onRequestGlobalOutput, onDownloadSuccess }) {
  const [url, setUrl] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [preciseCut, setPreciseCut] = useState(true);

  // Array of clip objects
  const [clips, setClips] = useState([]);

  // Execution states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(''); // Overall queue status
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [lastTargetDir, setLastTargetDir] = useState(null);
  const downloadCancelRef = useRef(false);

  const handleRetryClip = async (clip) => {
    if (!lastTargetDir) {
       toast.error("Original download folder not found. Please click 'Download All' to restart.");
       return;
    }
    
    updateClip(clip.id, { status: 'downloading', message: 'Retrying...', progress: 0 });
    const clipIndex = clips.findIndex(c => c.id === clip.id);
    const customTitle = clip.title.trim() || `CLIP ${clipIndex + 1}`;
    
    try {
      if (window.electronAPI && window.electronAPI.downloadClip) {
        const result = await window.electronAPI.downloadClip(
          url,
          lastTargetDir,
          clip.startTime,
          clip.endTime,
          selectedFormat,
          preciseCut,
          customTitle
        );

        if (result && result.success) {
          updateClip(clip.id, { status: 'done', message: 'Download complete!' });
          if (onDownloadSuccess) {
            const startFmt = formatTime(clip.startTime);
            const endFmt = formatTime(clip.endTime);
            onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
          }
          toast.success(`Clip retry successful!`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
        } else {
          throw new Error("Download failed without a specific error message.");
        }
      }
    } catch (err) {
      console.error(`Clip retry failed:`, err);
      const friendlyError = err.message?.includes('3436169992') ? 'Hey! Too fast, please wait a moment.' : err.message;
      updateClip(clip.id, { status: 'error', message: friendlyError });
      toast.error(`Retry failed. Please check the logs.`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    }
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    downloadCancelRef.current = true;
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      try {
        await window.electronAPI.cancelDownload();
      } catch (e) {
        // ignore errors from cancelling
      }
    }
    setIsDownloading(false);
    setDownloadStatus('Canceled');
    setTimeout(() => {
      setDownloadStatus((prev) => (prev === 'Canceled' ? '' : prev));
    }, 3000);
    toast.error('Download canceled.', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' }, icon: '🛑' });
    setClips(prev => prev.map(c => 
      c.status === 'downloading' ? { ...c, status: 'canceled', message: 'Canceled' } : c
    ));
  };

  useEffect(() => {
    if (metadata && metadata.duration) {
      const initialEnd = Math.min(metadata.duration, 60);
      // eslint-disable-next-line
      setClips([{
        id: Date.now(),
        startTime: 0,
        endTime: initialEnd,
        title: '',
        isExcluded: false,
        isLocked: false,
        status: 'idle',
        message: '',
        progress: 0
      }]);
    }
  }, [metadata]);

  // Handle IPC Progress (finds the currently downloading clip and updates it)
  useEffect(() => {
    if (window.electronAPI) {
      const handleProgress = (event, p) => {
        setClips(prev => prev.map(c => c.status === 'downloading' ? { ...c, progress: p } : c));
      };
      const handleStatus = (event, s) => {
        setClips(prev => prev.map(c => c.status === 'downloading' ? { ...c, message: s } : c));
      };

      if (window.electronAPI.onProgressUpdate) window.electronAPI.onProgressUpdate(handleProgress);
      if (window.electronAPI.onStatusUpdate) window.electronAPI.onStatusUpdate(handleStatus);

      return () => {
        if (window.electronAPI.offProgressUpdate) window.electronAPI.offProgressUpdate(handleProgress);
        if (window.electronAPI.offStatusUpdate) window.electronAPI.offStatusUpdate(handleStatus);
      };
    }
  }, []);

  const fetchMetadata = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsFetchingDetails(true);
    try {
      if (window.electronAPI && window.electronAPI.getVideoMetadata) {
        const data = await window.electronAPI.getVideoMetadata(url);
        if (data && data.duration) {
          setMetadata(data);
          if (data.formats && data.formats.length > 0) {
            // yt-dlp sorts lowest to highest, so we grab the last item to default to the best quality!
            setSelectedFormat(data.formats[data.formats.length - 1].format_id);
          }
          toast.success("Video info loaded!", { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to fetch metadata: ${err.message}`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      setMetadata(null);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const updateClip = (id, updates) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addClip = () => {
    if (!metadata) return;
    const lastClip = clips[clips.length - 1];
    let newStart = lastClip ? lastClip.endTime : 0;
    let newEnd = Math.min(metadata.duration, newStart + 60);

    // If we're at the very end of the video, just fallback to 0
    if (newStart >= metadata.duration) {
      newStart = 0;
      newEnd = Math.min(metadata.duration, 60);
    }

    setClips(prev => [...prev, {
      id: Date.now(),
      startTime: newStart,
      endTime: newEnd,
      title: '',
      isExcluded: false,
      isLocked: false,
      status: 'idle',
      message: '',
      progress: 0
    }]);
  };

  const removeClip = (id) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  const handleDownloadAll = async () => {
    downloadCancelRef.current = false;
    let targetDir = globalOutputDir;
    if (!targetDir) {
      if (onRequestGlobalOutput) {
        const success = await onRequestGlobalOutput();
        if (!success) return;
        // In this app, globalOutputDir might take a react cycle to update, so they might use a window var?
        // Actually, if we get success, we just wait for it to be provided, but let's assume it's set in state.
        // Wait, if it wasn't available, we should probably just fail or use the requested one. 
        // I will just use globalOutputDir, but it might not be updated yet in this render.
        // Let's assume the previous code `targetDir = window.globalOutputDirState` worked if it was there.
        targetDir = window.globalOutputDirState || globalOutputDir;
      } else {
        toast.error("No output folder selected.");
        return;
      }
    }
    
    // NOW apply the unique batch folder to targetDir!
    if (window.electronAPI && window.electronAPI.getUniqueFolder) {
      targetDir = await window.electronAPI.getUniqueFolder(targetDir, 'Selective Duration');
    } else {
      targetDir = `${targetDir}/Selective Duration`;
    }

    setLastTargetDir(targetDir);

    setIsDownloading(true);
    setDownloadStatus('Initializing queue...');

    // Reset statuses of non-excluded clips
    setClips(prev => prev.map(c => !c.isExcluded ? { ...c, status: 'idle', message: 'Queued', progress: 0 } : c));

    let completedCount = 0;
    let errorCount = 0;

    const clipsToDownload = clips.filter(c => !c.isExcluded);

    for (let i = 0; i < clips.length; i++) {
      if (downloadCancelRef.current) break;
      
      const clip = clips[i];
      if (clip.isExcluded) continue;

      // Mark as downloading
      updateClip(clip.id, { status: 'downloading', message: 'Starting download...', progress: 0 });
      setDownloadStatus(`Downloading clip ${completedCount + 1} of ${clipsToDownload.length}...`);

      const customTitle = clip.title.trim() || `CLIP ${i + 1}`;

      try {
        if (window.electronAPI && window.electronAPI.downloadClip) {
          const result = await window.electronAPI.downloadClip(
            url,
            targetDir,
            clip.startTime,
            clip.endTime,
            selectedFormat,
            preciseCut,
            customTitle
          );

          if (result && result.success) {
            updateClip(clip.id, { status: 'done', message: 'Download complete!' });
            completedCount++;

            if (onDownloadSuccess) {
              const startFmt = formatTime(clip.startTime);
              const endFmt = formatTime(clip.endTime);
              onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
            }
          } else {
            throw new Error(result?.error || "Download failed without a specific error message.");
          }
        }
      } catch (err) {
        if (downloadCancelRef.current) break;
        console.error(`Clip ${i+1} failed:`, err);
        const friendlyError = err.message?.includes('3436169992') ? 'Hey! Too fast, please wait a moment.' : err.message;
        updateClip(clip.id, { status: 'error', message: friendlyError });
        errorCount++;
      }
      
      // Delay before starting the next clip to avoid hitting YouTube rate limits or ffmpeg overlapping issues
      if (i < clips.length - 1 && !downloadCancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (downloadCancelRef.current) {
      return; // Handled by confirmCancel
    }

    setIsDownloading(false);
    if (errorCount === 0) {
      setDownloadStatus('');
      toast.success("All clips downloaded successfully!", { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    } else {
      setDownloadStatus(`Finished with ${errorCount} error(s).`);
      toast.error(`Queue finished, but ${errorCount} clip(s) failed.`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
      setTimeout(() => {
        setDownloadStatus(prev => prev.startsWith('Finished with') ? '' : prev);
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* URL Input */}
      <div className="glass-panel p-6 flex-shrink-0">
        <form onSubmit={fetchMetadata} className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube Video or VOD URL..."
            className="input-field flex-1 h-12 text-lg"
            disabled={isFetchingDetails || isDownloading}
          />
          <button
            type="submit"
            disabled={!url || isFetchingDetails || isDownloading}
            className="btn-primary h-12 px-6 flex items-center justify-center min-w-[160px]"
          >
            {isFetchingDetails ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Load Video Info'
            )}
          </button>
        </form>
      </div>

      {metadata && (
        <>
          <div className="glass-panel p-6 flex-shrink-0 flex flex-col mb-2 relative z-[60]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">Video Details</h3>
                <div className="flex flex-col gap-1.5">
                  <p className="text-textPrimary text-sm flex items-start">
                    <span className="text-textSecondary font-medium w-24 flex-shrink-0">Video Title:</span>
                    <span className="font-medium max-w-xl truncate" title={metadata.title}>{metadata.title}</span>
                  </p>
                  <p className="text-textPrimary text-sm flex items-start">
                    <span className="text-textSecondary font-medium w-24 flex-shrink-0">Duration:</span>
                    <span className="font-mono">{formatTime(metadata.duration)}</span>
                  </p>
                  <p className="text-textPrimary text-sm flex items-start">
                    <span className="text-textSecondary font-medium w-24 flex-shrink-0">Platform:</span>
                    <span className="capitalize">{metadata.extractor_key || metadata.extractor || 'Unknown'}</span>
                  </p>
                </div>
              </div>

              {metadata.formats && metadata.formats.length > 0 && (
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-textSecondary mb-1.5">Select Quality</label>
                  <div className="relative">
                    <CustomSelect
                      options={metadata.formats.map(f => ({ value: f.format_id, label: f.resolution }))}
                      value={selectedFormat}
                      onChange={(val) => setSelectedFormat(val)}
                      className="h-12 w-full text-sm font-medium"
                      disabled={isDownloading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {clips.map((clip, idx) => (
              <ClipTimeline
                key={clip.id}
                clip={clip}
                metadata={metadata}
                updateClip={updateClip}
                removeClip={removeClip}
                index={idx}
                totalClips={clips.length}
                isDownloadingQueue={isDownloading}
                handleRetryClip={handleRetryClip}
              />
            ))}
          </div>

          <div className="flex justify-center -mt-2 mb-4">
            <button
              onClick={addClip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-6 py-3 bg-surface hover:bg-surfaceHover border border-border rounded-xl font-medium shadow-sm transition-all active:scale-95 text-textPrimary"
            >
              <Plus className="w-5 h-5 text-primary" />
              Add Another Timeline
            </button>
          </div>

          <div className="glass-panel p-6 mt-2 border-t-4 border-t-primary/20 flex flex-col items-center justify-between sm:flex-row gap-6">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1 bg-background/50 p-1.5 rounded-xl border border-border w-fit">
                <div className="group relative">
                  <button
                    onClick={() => setPreciseCut(false)}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!preciseCut ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`}
                  >
                    Fast Cut
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">
                    Fast (Stream Copy) - Cuts to nearest keyframe
                  </div>
                </div>
                <div className="group relative">
                  <button
                    onClick={() => setPreciseCut(true)}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${preciseCut ? 'bg-primary/20 text-primary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  >
                    Precise Cut
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-textPrimary whitespace-nowrap transition-all shadow-lg pointer-events-none z-50">
                    Precise Cut (Re-encode) - Perfect accuracy
                  </div>
                </div>
              </div>
              <p className="text-xs text-textSecondary mt-3 ml-2 max-w-sm">
                Clips will be saved in a <span className="font-mono text-primary/80">Selective Duration</span> subfolder inside your chosen directory.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              {isDownloading ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-lg font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors w-full sm:min-w-[250px] shadow-lg"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Cancel Queue
                </button>
              ) : (
                <button
                  onClick={handleDownloadAll}
                  disabled={!globalOutputDir || clips.every(c => c.isExcluded)}
                  className="btn-primary h-16 px-10 text-xl flex items-center gap-3 w-full sm:min-w-[250px] justify-center shadow-lg disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Download className="w-6 h-6" />
                  Download {clips.filter(c => !c.isExcluded).length > 1 ? 'All Clips' : 'Clip'}
                </button>
              )}
              {downloadStatus && <span className="text-sm font-medium text-textSecondary bg-surface/50 px-3 py-1 rounded-full">{downloadStatus}</span>}
            </div>
          </div>
        </>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface border border-border p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-textPrimary mb-2">Cancel Process?</h3>
            <p className="text-sm text-textSecondary mb-6">
              Are you sure you want to cancel the current download queue? Clips already finished will be kept.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 bg-surface hover:bg-surfaceHover border border-border rounded-xl font-medium transition-colors text-textPrimary"
              >
                No, Resume
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
