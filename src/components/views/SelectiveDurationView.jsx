import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  Download,
  Loader2,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Check,
  FolderOpen,
  RotateCcw,
  Sparkles,
  OctagonX,
  Clock,
  Film,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import toast from 'react-hot-toast';

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
    const val = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    return isNaN(val) ? 0 : val;
  }
  return 0;
};

function ClipTimeline({
  clip,
  metadata,
  updateClip,
  removeClip,
  index,
  totalClips,
  isDownloadingQueue,
  handleRetryClip,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isHoveringStart, setIsHoveringStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isHoveringEnd, setIsHoveringEnd] = useState(false);

  const trackRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || clip.isLocked || clip.isExcluded) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomLevel((prev) => {
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

  const handleStartInputFocus = () => {
    setIsEditingStart(true);
    setStartInput(formatTime(clip.startTime));
  };

  const handleEndInputFocus = () => {
    setIsEditingEnd(true);
    setEndInput(formatTime(clip.endTime));
  };

  const handleStartInputBlur = () => {
    setIsEditingStart(false);
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(startInput);
    if (parsed >= clip.endTime) {
      parsed = Math.max(0, clip.endTime - 5);
      toast.error('Start time must be before end time.');
    }
    updateClip(clip.id, { startTime: parsed });
  };

  const handleEndInputBlur = () => {
    setIsEditingEnd(false);
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(endInput);
    if (parsed <= clip.startTime) {
      parsed = Math.min(metadata.duration, clip.startTime + 5);
      toast.error('End time must be after start time.');
    } else if (parsed > metadata.duration) {
      parsed = metadata.duration;
    }
    updateClip(clip.id, { endTime: parsed });
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
        endTime: initialEnd + timeDelta,
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

  const clipDuration = Math.max(0, clip.endTime - clip.startTime);

  return (
    <div
      className={`p-4 rounded-[6px] border transition-colors ${
        clip.isExcluded
          ? 'bg-[var(--surface-2)]/40 border-[var(--border-subdued)] opacity-60'
          : 'bg-[var(--surface-2)] border-[var(--border-subdued)]'
      }`}
    >
      {/* Clip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subdued)]">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="accent" size="sm">
            Segment #{index + 1}
          </Badge>

          <Input
            type="text"
            placeholder={`Clip Title (optional)`}
            value={clip.title}
            onChange={(e) => updateClip(clip.id, { title: e.target.value })}
            disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            className="h-7 text-xs w-48 bg-[var(--surface-1)]"
          />

          <Button
            variant={clip.isLocked ? 'accentMuted' : 'outline'}
            size="iconSm"
            onClick={() => updateClip(clip.id, { isLocked: !clip.isLocked })}
            disabled={clip.isExcluded || isDownloadingQueue}
            title={clip.isLocked ? 'Unlock Timeline' : 'Lock Timeline (Prevents accidental edits)'}
          >
            {clip.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </Button>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] select-none">
            <input
              type="checkbox"
              checked={clip.isExcluded}
              onChange={() => updateClip(clip.id, { isExcluded: !clip.isExcluded })}
              disabled={isDownloadingQueue}
              className="sr-only"
            />
            <div
              className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center transition-colors ${
                clip.isExcluded
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                  : 'border-[var(--border-strong)] bg-[var(--surface-1)]'
              }`}
            >
              {clip.isExcluded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Exclude from batch</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-[var(--text-secondary)]">
            Duration: <strong className="text-[var(--text-primary)]">{formatTime(clipDuration)}</strong>
          </span>

          {totalClips > 1 && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => removeClip(clip.id)}
              disabled={isDownloadingQueue}
              className="text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
              title="Remove Segment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline Download Status */}
      {(clip.status !== 'idle' || clip.message) && (
        <div
          className={`my-3 p-2.5 rounded-[4px] border text-xs flex items-center justify-between gap-2 ${
            clip.status === 'downloading'
              ? 'bg-[var(--accent-muted)] border-[var(--accent-primary)]/30 text-[var(--accent-primary)]'
              : clip.status === 'done'
              ? 'bg-[var(--status-success)]/10 border-[var(--status-success)]/20 text-[var(--status-success)]'
              : clip.status === 'error'
              ? 'bg-[var(--status-danger)]/10 border-[var(--status-danger)]/20 text-[var(--status-danger)]'
              : 'bg-[var(--surface-1)] text-[var(--text-secondary)]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {clip.status === 'downloading' && (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            )}
            <span className="truncate">{clip.message || 'Queued...'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {clip.status === 'downloading' && (
              <span className="font-mono font-bold">{(clip.progress || 0).toFixed(1)}%</span>
            )}
            {clip.status === 'error' && handleRetryClip && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRetryClip(clip)}
                className="h-6 text-[10px] px-2"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Timeline Visual Track */}
      <div
        className={`mt-3 ${
          clip.isLocked || clip.isExcluded ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Interactive Timeline Trimmer
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono mr-1">
              Zoom: {zoomLevel.toFixed(1)}x
            </span>
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
              title="Zoom out timeline"
            >
              -
            </Button>
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => Math.min(50, prev + 0.5))}
              title="Zoom in timeline"
            >
              +
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Viewport */}
        <div
          ref={containerRef}
          className="w-full h-24 pt-6 pb-2 bg-[var(--surface-1)] rounded-[4px] border border-[var(--border-subdued)] overflow-x-auto overflow-y-hidden relative timeline-scrollbar select-none"
        >
          <div
            ref={trackRef}
            className="h-full relative bg-[var(--surface-2)]/60"
            style={{ width: `${zoomLevel * 100}%` }}
          >
            {/* Major Ticks */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute top-0 bottom-0 left-0 flex flex-col items-start justify-end pb-1 pl-1">
                <div className="w-px h-2.5 bg-[var(--border-strong)] mb-0.5" />
                <span className="text-[9px] text-[var(--text-secondary)] font-mono opacity-80 whitespace-nowrap">
                  00:00:00
                </span>
              </div>

              {ticks.map((t, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
                  style={{ left: `${(t / metadata.duration) * 100}%` }}
                >
                  <div className="w-px h-2.5 bg-[var(--border-strong)] mb-0.5" />
                  <span className="text-[9px] text-[var(--text-secondary)] font-mono opacity-80 whitespace-nowrap -ml-2.5">
                    {formatTimeShort(t)}
                  </span>
                </div>
              ))}

              <div className="absolute top-0 bottom-0 right-0 flex flex-col items-end justify-end pb-1 pr-1">
                <div className="w-px h-2.5 bg-[var(--border-strong)] mb-0.5 mr-2" />
                <span className="text-[9px] text-[var(--text-secondary)] font-mono opacity-80 whitespace-nowrap">
                  {formatTime(metadata.duration)}
                </span>
              </div>
            </div>

            {/* Draggable Highlighted Range */}
            <div
              onPointerDown={handleRangePointerDown}
              className="absolute top-0 bottom-0 bg-[var(--accent-primary)]/20 border-y-2 border-[var(--accent-primary)]/70 cursor-grab active:cursor-grabbing z-10 transition-colors hover:bg-[var(--accent-primary)]/30"
              style={{
                left: `${(clip.startTime / metadata.duration) * 100}%`,
                right: `${100 - (clip.endTime / metadata.duration) * 100}%`,
              }}
            />

            {/* Start Thumb Handle */}
            <div
              onPointerDown={(e) => handleThumbPointerDown(e, true)}
              onMouseEnter={() => setIsHoveringStart(true)}
              onMouseLeave={() => setIsHoveringStart(false)}
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
              style={{ left: `${(clip.startTime / metadata.duration) * 100}%` }}
            >
              <div
                className={`absolute -top-6 ${
                  clip.startTime < metadata.duration * 0.05
                    ? 'left-0'
                    : 'left-1/2 -translate-x-1/2'
                } bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-primary)] text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap ${
                  isDraggingStart || isHoveringStart ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {formatTime(clip.startTime)}
              </div>
              <div className="w-1 h-12 bg-white rounded-full border border-black/30 group-hover:bg-[var(--accent-primary)] transition-colors" />
            </div>

            {/* End Thumb Handle */}
            <div
              onPointerDown={(e) => handleThumbPointerDown(e, false)}
              onMouseEnter={() => setIsHoveringEnd(true)}
              onMouseLeave={() => setIsHoveringEnd(false)}
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-ew-resize flex flex-col items-center justify-center z-20 group"
              style={{ left: `${(clip.endTime / metadata.duration) * 100}%` }}
            >
              <div
                className={`absolute -top-6 ${
                  clip.endTime > metadata.duration * 0.95
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2'
                } bg-[var(--surface-1)] border border-[var(--border-strong)] text-[var(--text-primary)] text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap ${
                  isDraggingEnd || isHoveringEnd ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {formatTime(clip.endTime)}
              </div>
              <div className="w-1 h-12 bg-white rounded-full border border-black/30 group-hover:bg-[var(--accent-primary)] transition-colors" />
            </div>
          </div>
        </div>

        {/* Start / End Monospace Inputs */}
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Start Timestamp (hh:mm:ss)
            </label>
            <Input
              type="text"
              value={isEditingStart ? startInput : formatTime(clip.startTime)}
              onFocus={handleStartInputFocus}
              onChange={handleStartInputChange}
              onBlur={handleStartInputBlur}
              className="font-mono text-center text-xs h-7 tracking-wider bg-[var(--surface-1)]"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              End Timestamp (hh:mm:ss)
            </label>
            <Input
              type="text"
              value={isEditingEnd ? endInput : formatTime(clip.endTime)}
              onFocus={handleEndInputFocus}
              onChange={handleEndInputChange}
              onBlur={handleEndInputBlur}
              className="font-mono text-center text-xs h-7 tracking-wider bg-[var(--surface-1)]"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SelectiveDurationView({
  globalOutputDir,
  onRequestGlobalOutput,
  onDownloadSuccess,
}) {
  const [url, setUrl] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [preciseCut, setPreciseCut] = useState(true);

  const [clips, setClips] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [lastTargetDir, setLastTargetDir] = useState(null);
  const downloadCancelRef = useRef(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleProgress = (_event, p) => {
      setClips((prev) =>
        prev.map((c) => (c.status === 'downloading' ? { ...c, progress: p } : c))
      );
    };
    const handleStatus = (_event, s) => {
      setClips((prev) =>
        prev.map((c) => (c.status === 'downloading' ? { ...c, message: s } : c))
      );
    };

    if (window.electronAPI.onProgressUpdate) window.electronAPI.onProgressUpdate(handleProgress);
    if (window.electronAPI.onStatusUpdate) window.electronAPI.onStatusUpdate(handleStatus);

    return () => {
      if (window.electronAPI.offProgressUpdate)
        window.electronAPI.offProgressUpdate(handleProgress);
      if (window.electronAPI.offStatusUpdate)
        window.electronAPI.offStatusUpdate(handleStatus);
    };
  }, []);

  const handleFetchDetails = async () => {
    if (!url) {
      toast.error('Please enter a YouTube video URL first.');
      return;
    }
    setIsFetchingDetails(true);
    setMetadata(null);
    setClips([]);

    try {
      if (window.electronAPI && window.electronAPI.getVideoMetadata) {
        const meta = await window.electronAPI.getVideoMetadata(url);
        if (meta && meta.duration) {
          setMetadata(meta);
          const initialEnd = Math.min(meta.duration, 60);
          setClips([
            {
              id: Date.now(),
              startTime: 0,
              endTime: initialEnd,
              title: '',
              isExcluded: false,
              isLocked: false,
              status: 'idle',
              message: '',
              progress: 0,
            },
          ]);
          toast.success('Video loaded successfully!');
        } else {
          throw new Error('Could not retrieve video duration.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch metadata', err);
      toast.error('Failed to fetch video details. Ensure the link is valid.');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const addClip = () => {
    if (!metadata) return;
    const lastClip = clips[clips.length - 1];
    const newStart = lastClip ? Math.min(metadata.duration - 5, lastClip.endTime) : 0;
    const newEnd = Math.min(metadata.duration, newStart + 60);

    setClips((prev) => [
      ...prev,
      {
        id: Date.now(),
        startTime: newStart,
        endTime: newEnd,
        title: '',
        isExcluded: false,
        isLocked: false,
        status: 'idle',
        message: '',
        progress: 0,
      },
    ]);
  };

  const updateClip = (id, updates) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeClip = (id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRetryClip = async (clip) => {
    if (!lastTargetDir) {
      toast.error("Original destination folder not found. Please click 'Download Clips' to restart.");
      return;
    }

    updateClip(clip.id, { status: 'downloading', message: 'Retrying...', progress: 0 });
    const clipIndex = clips.findIndex((c) => c.id === clip.id);
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
          updateClip(clip.id, { status: 'done', message: 'Complete!' });
          if (onDownloadSuccess) {
            const startFmt = formatTime(clip.startTime);
            const endFmt = formatTime(clip.endTime);
            onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
          }
          toast.success('Clip retry successful!');
        } else {
          throw new Error('Download failed without a specific error message.');
        }
      }
    } catch (err) {
      console.error('Clip retry failed:', err);
      const friendlyError = err.message?.includes('3436169992')
        ? 'Hey! Too fast, please wait a moment.'
        : err.message;
      updateClip(clip.id, { status: 'error', message: friendlyError });
      toast.error('Retry failed. Please check developer logs.');
    }
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    downloadCancelRef.current = true;
    if (window.electronAPI && window.electronAPI.cancelDownload) {
      try {
        await window.electronAPI.cancelDownload();
      } catch (err) {
        console.error('Failed to cancel download', err);
      }
    }
    setIsDownloading(false);
    setDownloadStatus('Canceled');
    setTimeout(() => {
      setDownloadStatus((prev) => (prev === 'Canceled' ? '' : prev));
    }, 3000);
    toast.error('Trimming operation canceled.', { icon: '🛑' });
    setClips((prev) =>
      prev.map((c) =>
        c.status === 'downloading' ? { ...c, status: 'canceled', message: 'Canceled' } : c
      )
    );
  };

  const handleDownloadAll = async () => {
    const activeClips = clips.filter((c) => !c.isExcluded);
    if (activeClips.length === 0) {
      toast.error('No clips available to download.');
      return;
    }

    let targetDir = globalOutputDir;
    if (!targetDir && onRequestGlobalOutput) {
      targetDir = await onRequestGlobalOutput();
    }
    if (!targetDir) {
      toast.error('Please configure an output folder first.');
      return;
    }

    setLastTargetDir(targetDir);
    setIsDownloading(true);
    downloadCancelRef.current = false;
    setDownloadStatus('Preparing clips...');

    for (let i = 0; i < activeClips.length; i++) {
      if (downloadCancelRef.current) break;
      const clip = activeClips[i];
      const customTitle = clip.title.trim() || `CLIP ${i + 1}`;

      updateClip(clip.id, { status: 'downloading', message: 'Downloading segment...', progress: 0 });
      setDownloadStatus(`Processing clip ${i + 1} of ${activeClips.length}`);

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
            if (onDownloadSuccess) {
              const startFmt = formatTime(clip.startTime);
              const endFmt = formatTime(clip.endTime);
              onDownloadSuccess(result.filepath, startFmt, endFmt, url, customTitle);
            }
          } else {
            throw new Error('Download failed');
          }
        }
      } catch (err) {
        if (downloadCancelRef.current) break;
        const friendlyError = err.message?.includes('3436169992')
          ? 'Hey! Too fast, please wait a moment.'
          : err.message;
        updateClip(clip.id, { status: 'error', message: friendlyError });
      }
    }

    setIsDownloading(false);
    if (!downloadCancelRef.current) {
      setDownloadStatus('All clips finished!');
      toast.success('Completed selective trimming!');
    }
  };

  const formatOptions = [
    { value: '', label: 'Best Available' },
    { value: '1080', label: '1080p Full HD' },
    { value: '720', label: '720p HD' },
    { value: '480', label: '480p SD' },
    { value: '360', label: '360p' },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full pb-6">
      {/* URL & Inspection Card */}
      <Card className="surface-panel">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subdued)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-purple-950/50 border border-purple-800/40 flex items-center justify-center text-accent-neon shadow-sm">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Selective Duration Downloader
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Load video timeline and precisely extract designated timecode segments.
                </p>
              </div>
            </div>

            {metadata && (
              <Badge variant="success" size="sm" icon={<Clock className="w-3 h-3" />} pulse>
                Total: {formatTime(metadata.duration)}
              </Badge>
            )}
          </div>

          {/* URL Input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                size="lg"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter YouTube URL to load timeline..."
                disabled={isFetchingDetails || isDownloading}
                leftIcon={<Video className="w-4 h-4 text-accent-neon" />}
              />
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFetchDetails}
              isLoading={isFetchingDetails}
              disabled={!url || isDownloading}
              className="font-bold shrink-0"
            >
              Fetch Details
            </Button>
          </div>

          {/* Video Metadata Preview */}
          {metadata && (
            <div className="p-3.5 bg-[var(--surface-2)]/80 border border-[var(--border-subdued)] rounded-[12px] flex items-center gap-3.5 shadow-sm">
              <div className="w-28 aspect-video bg-black/60 rounded-[8px] overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                <img
                  src={metadata.thumbnail}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate" title={metadata.title}>
                  {metadata.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="accent" size="sm">
                    {metadata.uploader || 'YouTube Channel'}
                  </Badge>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    Duration: {formatTime(metadata.duration)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segments Section */}
      {metadata && (
        <Card className="surface-panel">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subdued)]">
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  Timeline Trimming Segments ({clips.length})
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Drag the start/end handles on the ruler or enter exact timecodes below.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addClip}
                disabled={isDownloading}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Segment
              </Button>
            </div>

            {/* List of timelines */}
            <div className="space-y-3">
              {clips.map((clip, index) => (
                <ClipTimeline
                  key={clip.id}
                  clip={clip}
                  metadata={metadata}
                  updateClip={updateClip}
                  removeClip={removeClip}
                  index={index}
                  totalClips={clips.length}
                  isDownloadingQueue={isDownloading}
                  handleRetryClip={handleRetryClip}
                />
              ))}
            </div>

            {/* Trimming Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                  Output Resolution
                </label>
                <Select
                  options={formatOptions}
                  value={selectedFormat}
                  onChange={setSelectedFormat}
                  disabled={isDownloading}
                  placeholder="Best Available"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2 bg-[var(--surface-2)] rounded-[6px] border border-[var(--border-subdued)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preciseCut}
                    onChange={(e) => setPreciseCut(e.target.checked)}
                    disabled={isDownloading}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                      preciseCut
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                        : 'border-[var(--border-strong)] bg-[var(--surface-1)]'
                    }`}
                  >
                    {preciseCut && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                      Frame-Accurate Cutting (Re-encode)
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] block">
                      Enables precise split boundaries without keyframe drift.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Destination Output Directory */}
            <div className="p-2.5 bg-[var(--surface-2)]/50 border border-[var(--border-subdued)] rounded-[6px] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block">
                    Save Destination
                  </span>
                  <span
                    className="font-mono text-xs text-[var(--text-primary)] truncate block"
                    title={globalOutputDir || 'Default downloads folder'}
                  >
                    {globalOutputDir || 'Default downloads folder'}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestGlobalOutput}
                disabled={isDownloading}
              >
                Browse
              </Button>
            </div>

            {/* Download Status Message */}
            {downloadStatus && (
              <div className="p-2.5 rounded-[6px] bg-[var(--accent-muted)] border border-[var(--accent-primary)]/30 text-xs text-[var(--accent-primary)] font-medium flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{downloadStatus}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              {isDownloading ? (
                <Button
                  variant="destructive"
                  size="md"
                  onClick={() => setShowCancelModal(true)}
                  className="font-semibold"
                >
                  <OctagonX className="w-4 h-4" />
                  Cancel Trimming
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownloadAll}
                  disabled={!globalOutputDir || clips.filter((c) => !c.isExcluded).length === 0}
                  className="font-semibold px-6"
                >
                  <Download className="w-4 h-4" />
                  Download Selected Clips ({clips.filter((c) => !c.isExcluded).length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Modal */}
      <Dialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Trimming Operation?"
        maxWidth="max-w-sm"
      >
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Are you sure you want to stop the current download? Completed clips will remain in your destination folder.
        </p>

        <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
          <Button variant="secondary" size="sm" onClick={() => setShowCancelModal(false)}>
            Keep Going
          </Button>
          <Button variant="destructive" size="sm" onClick={confirmCancel}>
            Yes, Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default SelectiveDurationView;
