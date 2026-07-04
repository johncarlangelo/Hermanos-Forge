import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Video, Loader2, Scissors } from 'lucide-react';
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

export default function SelectiveDownloader({ globalOutputDir, onRequestGlobalOutput, onDownloadSuccess }) {
  const [url, setUrl] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [preciseCut, setPreciseCut] = useState(true);

  // Timeline States
  const [zoomLevel, setZoomLevel] = useState(1);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startInput, setStartInput] = useState('00:00:00');
  const [endInput, setEndInput] = useState('00:00:00');

  // Execution states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

  // Interaction States
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isHoveringStart, setIsHoveringStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isHoveringEnd, setIsHoveringEnd] = useState(false);

  const trackRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (metadata && metadata.duration) {
      setStartTime(0);
      const initialEnd = Math.min(metadata.duration, 60);
      setEndTime(initialEnd);
      setStartInput(formatTime(0));
      setEndInput(formatTime(initialEnd));
      setZoomLevel(1);
    }
  }, [metadata]);

  useEffect(() => {
    if (window.electronAPI) {
      const handleProgress = (event, p) => setDownloadProgress(p);
      const handleStatus = (event, s) => setDownloadStatus(s);

      if (window.electronAPI.onProgressUpdate) window.electronAPI.onProgressUpdate(handleProgress);
      if (window.electronAPI.onStatusUpdate) window.electronAPI.onStatusUpdate(handleStatus);

      return () => {
        if (window.electronAPI.offProgressUpdate) window.electronAPI.offProgressUpdate(handleProgress);
        if (window.electronAPI.offStatusUpdate) window.electronAPI.offStatusUpdate(handleStatus);
      };
    }
  }, []);

  useEffect(() => {
    setStartInput(formatTime(startTime));
    setEndInput(formatTime(endTime));
  }, [startTime, endTime]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          const delta = e.deltaY > 0 ? -0.5 : 0.5;
          return Math.max(1, Math.min(prev + delta, 50));
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [metadata]);

  const fetchMetadata = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsFetchingDetails(true);
    setMetadata(null);
    setSelectedFormat('');
    setDownloadStatus('');
    setDownloadProgress(0);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getVideoMetadata(url);
        if (result && result.duration) {
          setMetadata(result);
          if (result.formats && result.formats.length > 0) {
            setSelectedFormat(result.formats[result.formats.length - 1].format_id);
          }
          toast.success('Video details loaded successfully!', { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
        } else {
          throw new Error('Invalid data received from backend.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load video details: ${err.message}`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleDownload = async () => {
    if (!metadata) return;

    let targetDir = globalOutputDir;
    if (!targetDir) {
      if (onRequestGlobalOutput) {
        targetDir = await onRequestGlobalOutput();
        if (!targetDir) return;
      } else {
        toast.error("No output folder selected.");
        return;
      }
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting download...');

    try {
      if (window.electronAPI && window.electronAPI.downloadClip) {
        const result = await window.electronAPI.downloadClip(
          url,
          targetDir,
          startTime,
          endTime,
          selectedFormat,
          preciseCut
        );

        if (result && result.success) {
          toast.success("Clip downloaded successfully!", { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
          if (onDownloadSuccess) {
            onDownloadSuccess(result.filepath, startInput, endInput, url, metadata?.title || 'Unknown Title');
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to download clip: ${err.message}`, { style: { borderRadius: '10px', background: '#1E293B', color: '#fff' } });
    } finally {
      setIsDownloading(false);
      setDownloadStatus('');
    }
  };

  // --- Text Input Handlers ---
  const handleStartInputChange = (e) => {
    setStartInput(e.target.value);
  };

  const handleEndInputChange = (e) => {
    setEndInput(e.target.value);
  };

  const handleStartInputBlur = () => {
    let parsed = parseTime(startInput);
    if (parsed >= endTime) {
      parsed = Math.max(0, endTime - 5);
      toast.error("Start time must be before end time.");
    }
    setStartTime(parsed);
    setStartInput(formatTime(parsed));
  };

  const handleEndInputBlur = () => {
    let parsed = parseTime(endInput);
    if (parsed <= startTime) {
      parsed = Math.min(metadata.duration, startTime + 5);
      toast.error("End time must be after start time.");
    } else if (parsed > metadata.duration) {
      parsed = metadata.duration;
    }
    setEndTime(parsed);
    setEndInput(formatTime(parsed));
  };

  // --- Draggable Thumb Handlers ---
  const handleThumbPointerDown = (e, isStart) => {
    e.stopPropagation();
    e.preventDefault();

    if (isStart) setIsDraggingStart(true);
    else setIsDraggingEnd(true);

    const startX = e.clientX;
    const initialTime = isStart ? startTime : endTime;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata) return;
      const trackWidth = trackRef.current.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / trackWidth) * metadata.duration;

      if (isStart) {
        const newTime = Math.max(0, Math.min(initialTime + timeDelta, endTime - 5));
        setStartTime(newTime);
        setStartInput(formatTime(newTime));
      } else {
        const newTime = Math.min(metadata.duration, Math.max(initialTime + timeDelta, startTime + 5));
        setEndTime(newTime);
        setEndInput(formatTime(newTime));
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

  // --- Draggable Range Handler ---
  const handleRangePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const initialStartTime = startTime;
    const initialEndTime = endTime;
    const rangeDuration = endTime - startTime;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata) return;
      const trackWidth = trackRef.current.offsetWidth;
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / trackWidth) * metadata.duration;

      let newStartTime = initialStartTime + timeDelta;
      let newEndTime = initialEndTime + timeDelta;

      if (newStartTime < 0) {
        newStartTime = 0;
        newEndTime = rangeDuration;
      } else if (newEndTime > metadata.duration) {
        newEndTime = metadata.duration;
        newStartTime = metadata.duration - rangeDuration;
      }

      setStartTime(newStartTime);
      setStartInput(formatTime(newStartTime));
      setEndTime(newEndTime);
      setEndInput(formatTime(newEndTime));
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
        <div className="glass-panel p-6 flex-1 flex flex-col min-h-min mb-6">
          {/* Header Info */}
          <div className="flex justify-between items-start mb-8">
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
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timeline UI */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
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
              {/* Static Track (Natively scrollable) */}
              <div
                ref={trackRef}
                className="h-full relative bg-surface"
                style={{ width: `${zoomLevel * 100}%` }}
              >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 49px, var(--border) 49px, var(--border) 50px)' }} />

                {/* Major Ticks */}
                <div className="absolute inset-0 pointer-events-none select-none">
                  {/* Start 00:00:00 */}
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

                  {/* End Max Duration */}
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
                    left: `${(startTime / metadata.duration) * 100}%`,
                    right: `${100 - (endTime / metadata.duration) * 100}%`
                  }}
                />

                {/* Start Thumb */}
                <div
                  onPointerDown={(e) => handleThumbPointerDown(e, true)}
                  onMouseEnter={() => setIsHoveringStart(true)}
                  onMouseLeave={() => setIsHoveringStart(false)}
                  className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
                  style={{ left: `${(startTime / metadata.duration) * 100}%` }}
                >
                  <div className={`absolute -top-10 ${startTime < metadata.duration * 0.05 ? 'left-0' : 'left-1/2 -translate-x-1/2'} bg-surface/95 backdrop-blur-sm border border-border text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg transition-opacity duration-150 pointer-events-none whitespace-nowrap ${isDraggingStart || isHoveringStart ? 'opacity-100' : 'opacity-0'}`}>
                    {formatTime(startTime)}
                  </div>
                  <div className={`w-1.5 h-14 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full transition-colors border border-black/20 ${isDraggingStart ? 'bg-primary' : 'group-hover:bg-primary'}`} />
                </div>

                {/* End Thumb */}
                <div
                  onPointerDown={(e) => handleThumbPointerDown(e, false)}
                  onMouseEnter={() => setIsHoveringEnd(true)}
                  onMouseLeave={() => setIsHoveringEnd(false)}
                  className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
                  style={{ left: `${(endTime / metadata.duration) * 100}%` }}
                >
                  <div className={`absolute -top-10 ${endTime > metadata.duration * 0.95 ? 'right-0' : 'left-1/2 -translate-x-1/2'} bg-surface/95 backdrop-blur-sm border border-border text-white text-xs font-mono px-2.5 py-1.5 rounded-md shadow-lg transition-opacity duration-150 pointer-events-none whitespace-nowrap ${isDraggingEnd || isHoveringEnd ? 'opacity-100' : 'opacity-0'}`}>
                    {formatTime(endTime)}
                  </div>
                  <div className={`w-1.5 h-14 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full transition-colors border border-black/20 ${isDraggingEnd ? 'bg-primary' : 'group-hover:bg-primary'}`} />
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="flex gap-6 items-center mt-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-textSecondary mb-2">Start Time</label>
                <input
                  type="text"
                  value={startInput}
                  onChange={handleStartInputChange}
                  onBlur={handleStartInputBlur}
                  className="input-field w-full h-12 font-mono text-center text-lg tracking-wider"
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
                  disabled={isDownloading}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
              {/* Settings Toggle */}
              <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-xl border border-border">
                <button
                  onClick={() => setPreciseCut(false)}
                  disabled={isDownloading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!preciseCut ? 'bg-surface shadow-sm text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`}
                  title="Fast (Stream Copy) - Cuts accurately to the nearest keyframe. Very fast, but might include extra seconds."
                >
                  Fast Cut
                </button>
                <button
                  onClick={() => setPreciseCut(true)}
                  disabled={isDownloading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${preciseCut ? 'bg-primary/20 text-primary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                  title="Precise Cut (Re-encode) - Cuts exactly at the specified frames. Slower, but perfect accuracy."
                >
                  Precise Cut
                </button>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading || !metadata}
                  className="btn-primary h-14 px-8 text-lg flex items-center gap-2 min-w-[200px] justify-center"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {downloadProgress > 0 ? `${downloadProgress.toFixed(1)}%` : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Clip
                    </>
                  )}
                </button>
                {downloadStatus && <span className="text-xs text-textSecondary">{downloadStatus}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
