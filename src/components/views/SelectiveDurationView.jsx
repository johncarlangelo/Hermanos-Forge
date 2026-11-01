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
  RotateCcw,
  Sparkles,
  OctagonX,
  Clock,
  Layers,
  Scissors,
} from 'lucide-react';
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
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(':').map((p) => parseFloat(p));
  if (parts.some((n) => isNaN(n))) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

const PEAKS = Array.from(
  { length: 140 },
  (_, i) => 6 + 32 * Math.abs(Math.sin(i * 1.93) * Math.cos(i * 0.19)) * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.075)))
);

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
  const [hoverPosition, setHoverPosition] = useState(null);

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
    const minGap = Math.min(1, Math.max(0.1, (metadata?.duration || 60) * 0.01));
    if (parsed >= clip.endTime) {
      parsed = Math.max(0, clip.endTime - minGap);
      toast.error('Start time must be before end time.');
    }
    updateClip(clip.id, { startTime: Math.max(0, Math.min(parsed, metadata?.duration || 0)) });
  };

  const handleEndInputBlur = () => {
    setIsEditingEnd(false);
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(endInput);
    const minGap = Math.min(1, Math.max(0.1, (metadata?.duration || 60) * 0.01));
    if (parsed <= clip.startTime) {
      parsed = Math.min(metadata.duration, clip.startTime + minGap);
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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const startX = e.clientX;
    const initialStart = clip.startTime;
    const initialEnd = clip.endTime;
    const initialTime = isStart ? initialStart : initialEnd;
    const minGap = Math.min(1, Math.max(0.1, (metadata?.duration || 60) * 0.01));

    if (isStart) setIsDraggingStart(true);
    else setIsDraggingEnd(true);

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata || !metadata.duration) return;
      const trackWidth = trackRef.current.offsetWidth;
      if (!trackWidth) return;
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / trackWidth) * metadata.duration;

      if (isStart) {
        const newTime = Math.max(0, Math.min(initialTime + timeDelta, initialEnd - minGap));
        updateClip(clip.id, { startTime: newTime });
      } else {
        const newTime = Math.min(metadata.duration, Math.max(initialTime + timeDelta, initialStart + minGap));
        updateClip(clip.id, { endTime: newTime });
      }
    };

    const handlePointerUp = (upEvent) => {
      try {
        if (e.currentTarget.hasPointerCapture(upEvent.pointerId)) {
          e.currentTarget.releasePointerCapture(upEvent.pointerId);
        }
      } catch {
        /* ignore */
      }
      if (isStart) setIsDraggingStart(false);
      else setIsDraggingEnd(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleThumbKeyDown = (e, isStart) => {
    if (clip.isLocked || clip.isExcluded || !metadata) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const step = e.shiftKey ? 5 : e.altKey ? 0.2 : 1;
      const minGap = Math.min(1, Math.max(0.1, metadata.duration * 0.01));
      if (isStart) {
        let newStart = clip.startTime;
        if (e.key === 'Home') newStart = 0;
        else if (e.key === 'End') newStart = clip.endTime - minGap;
        else newStart += (e.key === 'ArrowRight' ? step : -step);
        newStart = Math.max(0, Math.min(newStart, clip.endTime - minGap));
        updateClip(clip.id, { startTime: newStart });
      } else {
        let newEnd = clip.endTime;
        if (e.key === 'Home') newEnd = clip.startTime + minGap;
        else if (e.key === 'End') newEnd = metadata.duration;
        else newEnd += (e.key === 'ArrowRight' ? step : -step);
        newEnd = Math.min(metadata.duration, Math.max(newEnd, clip.startTime + minGap));
        updateClip(clip.id, { endTime: newEnd });
      }
    }
  };

  const handleRangePointerDown = (e) => {
    if (clip.isLocked || clip.isExcluded) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const startX = e.clientX;
    const initialStart = clip.startTime;
    const initialEnd = clip.endTime;
    const duration = initialEnd - initialStart;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !metadata || !metadata.duration) return;
      const trackWidth = trackRef.current.offsetWidth;
      if (!trackWidth) return;
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = (deltaX / trackWidth) * metadata.duration;

      let newStart = initialStart + timeDelta;
      let newEnd = initialEnd + timeDelta;

      if (newStart < 0) {
        newStart = 0;
        newEnd = duration;
      } else if (newEnd > metadata.duration) {
        newEnd = metadata.duration;
        newStart = Math.max(0, metadata.duration - duration);
      }

      updateClip(clip.id, {
        startTime: Math.max(0, newStart),
        endTime: Math.min(metadata.duration, newEnd),
      });
    };

    const handlePointerUp = (upEvent) => {
      try {
        if (e.currentTarget.hasPointerCapture(upEvent.pointerId)) {
          e.currentTarget.releasePointerCapture(upEvent.pointerId);
        }
      } catch {
        /* ignore */
      }
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
      className={`p-5 rounded-2xl border transition-all surface-panel ${
        clip.isExcluded
          ? 'bg-[#12121a]/40 border-[#1e1e2a] opacity-50'
          : 'bg-[#12121a] border-[#1e1e2a] shadow-lg'
      }`}
    >
      {/* Clip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#1e1e2a]">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="brand" size="md">
            Segment #{index + 1}
          </Badge>

          <Input
            type="text"
            placeholder="Segment Title (e.g. Intro Scene)"
            value={clip.title}
            onChange={(e) => updateClip(clip.id, { title: e.target.value })}
            disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            className="h-8 text-xs sm:text-sm w-56 bg-[#0b0b10] border-[#2a2a3a]"
          />

          <Button
            variant={clip.isLocked ? 'accentMuted' : 'outline'}
            size="iconSm"
            onClick={() => updateClip(clip.id, { isLocked: !clip.isLocked })}
            disabled={clip.isExcluded || isDownloadingQueue}
            title={clip.isLocked ? 'Unlock Timeline' : 'Lock Timeline (Prevents accidental changes)'}
          >
            {clip.isLocked ? <Lock className="w-3.5 h-3.5 text-[#a78bfa]" /> : <Unlock className="w-3.5 h-3.5" />}
          </Button>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#b4b4c2] hover:text-[#f4f4f7] select-none">
            <input
              type="checkbox"
              checked={clip.isExcluded}
              onChange={() => updateClip(clip.id, { isExcluded: !clip.isExcluded })}
              disabled={isDownloadingQueue}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                clip.isExcluded
                  ? 'bg-[#7c3aed] border-[#7c3aed] text-white'
                  : 'border-[#2a2a3a] bg-[#0b0b10]'
              }`}
            >
              {clip.isExcluded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Exclude from batch</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b0b10] border border-[#1e1e2a] text-xs font-mono">
            <Clock className="w-3 h-3 text-[#a78bfa]" />
            <span className="text-[#7a7a8c]">LENGTH:</span>
            <span className="font-bold text-[#f4f4f7]">{formatTime(clipDuration)}</span>
          </div>

          {totalClips > 1 && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => removeClip(clip.id)}
              disabled={isDownloadingQueue}
              className="text-[#7a7a8c] hover:text-[#ef4444] hover:bg-[#ef44441a]"
              title="Remove Segment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Inline Download Status Badge */}
      {(clip.status !== 'idle' || clip.message) && (
        <div
          className={`my-3 p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2.5 ${
            clip.status === 'downloading'
              ? 'bg-[#7c3aed1a] border-[#7c3aed4d] text-[#c4b5fd]'
              : clip.status === 'done'
              ? 'bg-[#22c55e14] border-[#22c55e33] text-[#86efac]'
              : clip.status === 'error'
              ? 'bg-[#ef44441a] border-[#ef444455] text-[#fca5a5]'
              : 'bg-[#0b0b10] border-[#1e1e2a] text-[#b4b4c2]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 font-mono">
            {clip.status === 'downloading' && (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[#a78bfa]" />
            )}
            <span className="truncate">{clip.message || 'Queued in buffer...'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {clip.status === 'downloading' && (
              <span className="font-mono font-bold text-[#f4f4f7]">{(clip.progress || 0).toFixed(1)}%</span>
            )}
            {clip.status === 'error' && handleRetryClip && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRetryClip(clip)}
                className="h-7 text-xs px-2.5 font-semibold"
              >
                Retry Segment
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Timeline Visual Track (Filmstrip & Scrubber Style) */}
      <div
        className={`mt-4 ${
          clip.isLocked || clip.isExcluded ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#f4f4f7] uppercase tracking-wider font-mono">
              PRECISION SCRUBBER TRACK
            </span>
            <span className="text-[10px] font-mono text-[#a78bfa] bg-[#7c3aed1a] px-1.5 py-0.2 rounded border border-[#7c3aed33]">
              {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7a7a8c] font-mono mr-1">
              Zoom: {zoomLevel.toFixed(1)}x
            </span>
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
              title="Zoom out"
            >
              -
            </Button>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              aria-label="Timeline zoom level"
              className="w-20 sm:w-28 h-1.5 bg-[#0b0b10] rounded-lg appearance-none cursor-pointer accent-[#7c3aed] border border-[#2a2a3a]"
            />
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => Math.min(50, prev + 0.5))}
              title="Zoom in"
            >
              +
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3 text-[#7a7a8c]" />
            </Button>
          </div>
        </div>

        {/* Viewport & Scrubber Track */}
        <div
          ref={containerRef}
          className="w-full h-28 pt-8 pb-3 bg-[#0b0b10] rounded-xl border border-[#1e1e2a] overflow-x-auto overflow-y-hidden relative timeline-scrollbar select-none shadow-inner"
        >
          <div
            ref={trackRef}
            onPointerMove={(e) => {
              if (!trackRef.current || !metadata) return;
              const r = trackRef.current.getBoundingClientRect();
              const hoverSeconds = Math.max(0, Math.min(metadata.duration, ((e.clientX - r.left) / r.width) * metadata.duration));
              setHoverPosition(hoverSeconds);
            }}
            onPointerLeave={() => setHoverPosition(null)}
            className="h-full relative bg-[#12121a]/80"
            style={{ width: `${zoomLevel * 100}%` }}
          >
            {/* Synthetic Waveform Bed (Subframe region-splice blueprint) */}
            <div className="absolute inset-x-0 bottom-1 top-2 opacity-25 overflow-hidden pointer-events-none">
              <svg viewBox="0 0 420 50" preserveAspectRatio="none" className="w-full h-full">
                {PEAKS.map((h, i) => (
                  <path
                    key={i}
                    d={`M${i * 3 + 1.5} ${25 - h / 2}v${h}`}
                    stroke="#a78bfa"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>

            {/* Filmstrip Ticks Pattern */}
            <div className="absolute inset-0 pointer-events-none select-none opacity-40">
              <div className="absolute inset-x-0 top-0 h-2 border-b border-dashed border-[#2a2a3a]" />
              <div className="absolute inset-x-0 bottom-0 h-2 border-t border-dashed border-[#2a2a3a]" />
            </div>

            {/* Major Ticks */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute top-0 bottom-0 left-0 flex flex-col items-start justify-end pb-1 pl-1">
                <div className="w-px h-3 bg-[#3a3a4e] mb-0.5" />
                <span className="text-[10px] text-[#7a7a8c] font-mono opacity-80 whitespace-nowrap">
                  00:00:00
                </span>
              </div>

              {ticks.map((t, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
                  style={{ left: `${(t / metadata.duration) * 100}%` }}
                >
                  <div className="w-px h-3 bg-[#3a3a4e] mb-0.5" />
                  <span className="text-[10px] text-[#7a7a8c] font-mono opacity-80 whitespace-nowrap -ml-2.5">
                    {formatTimeShort(t)}
                  </span>
                </div>
              ))}

              <div className="absolute top-0 bottom-0 right-0 flex flex-col items-end justify-end pb-1 pr-1">
                <div className="w-px h-3 bg-[#3a3a4e] mb-0.5 mr-2" />
                <span className="text-[10px] text-[#7a7a8c] font-mono opacity-80 whitespace-nowrap">
                  {formatTime(metadata.duration)}
                </span>
              </div>
            </div>

            {/* Floating Cursor Hover Time Tooltip (Subframe cue-scrubber style) */}
            {hoverPosition !== null && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30"
                style={{ left: `${(hoverPosition / metadata.duration) * 100}%` }}
              >
                <div className="w-px h-full bg-[#38bdf8] opacity-80" />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1e1e2a] text-[#38bdf8] border border-[#38bdf84d] text-[10px] font-mono px-1.5 py-0.2 rounded shadow whitespace-nowrap">
                  {formatTime(hoverPosition)}
                </div>
              </div>
            )}

            {/* Draggable Highlighted Range with Active Glowing Waveform */}
            <div
              onPointerDown={handleRangePointerDown}
              className="absolute top-0 bottom-0 bg-[#7c3aed]/25 border-y-2 border-[#7c3aed] cursor-grab active:cursor-grabbing z-10 transition-colors hover:bg-[#7c3aed]/35 overflow-hidden"
              style={{
                left: `${(clip.startTime / metadata.duration) * 100}%`,
                right: `${100 - (clip.endTime / metadata.duration) * 100}%`,
              }}
            >
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <svg viewBox="0 0 420 50" preserveAspectRatio="none" className="w-full h-full">
                  {PEAKS.map((h, i) => (
                    <path
                      key={i}
                      d={`M${i * 3 + 1.5} ${25 - h / 2}v${h}`}
                      stroke="#c4b5fd"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Start Thumb Handle */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Segment start timecode"
              aria-valuenow={clip.startTime}
              aria-valuemin={0}
              aria-valuemax={clip.endTime}
              onPointerDown={(e) => handleThumbPointerDown(e, true)}
              onKeyDown={(e) => handleThumbKeyDown(e, true)}
              onMouseEnter={() => setIsHoveringStart(true)}
              onMouseLeave={() => setIsHoveringStart(false)}
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group focus:outline-none"
              style={{ left: `${(clip.startTime / metadata.duration) * 100}%` }}
            >
              <div
                className={`absolute -top-7 ${
                  clip.startTime < metadata.duration * 0.05
                    ? 'left-0'
                    : 'left-1/2 -translate-x-1/2'
                } bg-[#0b0b10] border border-[#7c3aed] text-[#ede9fe] text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap transition-opacity ${
                  isDraggingStart || isHoveringStart ? 'opacity-100' : 'opacity-0'
                }`}
              >
                START: {formatTime(clip.startTime)}
              </div>
              <div className="w-1.5 h-12 bg-white rounded-full border border-black/40 group-hover:bg-[#a78bfa] group-focus:bg-[#a78bfa] shadow-[0_0_8px_#7c3aed] transition-colors" />
            </div>

            {/* End Thumb Handle */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Segment end timecode"
              aria-valuenow={clip.endTime}
              aria-valuemin={clip.startTime}
              aria-valuemax={metadata.duration}
              onPointerDown={(e) => handleThumbPointerDown(e, false)}
              onKeyDown={(e) => handleThumbKeyDown(e, false)}
              onMouseEnter={() => setIsHoveringEnd(true)}
              onMouseLeave={() => setIsHoveringEnd(false)}
              className="absolute top-0 bottom-0 w-6 -ml-3 cursor-ew-resize flex flex-col items-center justify-center z-20 group focus:outline-none"
              style={{ left: `${(clip.endTime / metadata.duration) * 100}%` }}
            >
              <div
                className={`absolute -top-7 ${
                  clip.endTime > metadata.duration * 0.95
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2'
                } bg-[#0b0b10] border border-[#7c3aed] text-[#ede9fe] text-[10px] font-mono px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap transition-opacity ${
                  isDraggingEnd || isHoveringEnd ? 'opacity-100' : 'opacity-0'
                }`}
              >
                END: {formatTime(clip.endTime)}
              </div>
              <div className="w-1.5 h-12 bg-white rounded-full border border-black/40 group-hover:bg-[#a78bfa] group-focus:bg-[#a78bfa] shadow-[0_0_8px_#7c3aed] transition-colors" />
            </div>
          </div>
        </div>

        {/* Start / End Monospace Inputs Deck */}
        <div className="grid grid-cols-2 gap-4 mt-3.5">
          <div className="p-3 rounded-xl bg-[#0b0b10] border border-[#1e1e2a]">
            <label className="block text-[10px] font-bold text-[#9a9aac] uppercase tracking-wider mb-1 font-mono">
              START TIMECODE (hh:mm:ss or mm:ss)
            </label>
            <Input
              type="text"
              value={isEditingStart ? startInput : formatTime(clip.startTime)}
              onFocus={handleStartInputFocus}
              onChange={handleStartInputChange}
              onBlur={handleStartInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="font-mono text-center text-xs sm:text-sm h-8 tracking-wider bg-[#12121a] border-[#2a2a3a]"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
          <div className="p-3 rounded-xl bg-[#0b0b10] border border-[#1e1e2a]">
            <label className="block text-[10px] font-bold text-[#9a9aac] uppercase tracking-wider mb-1 font-mono">
              END TIMECODE (hh:mm:ss or mm:ss)
            </label>
            <Input
              type="text"
              value={isEditingEnd ? endInput : formatTime(clip.endTime)}
              onFocus={handleEndInputFocus}
              onChange={handleEndInputChange}
              onBlur={handleEndInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              className="font-mono text-center text-xs sm:text-sm h-8 tracking-wider bg-[#12121a] border-[#2a2a3a]"
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
  onTimingChange,
  onClipsCountChange,
  onProcessingChange,
  onStatusChange,
  onRegisterActions,
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
    onProcessingChange?.(isDownloading);
  }, [isDownloading, onProcessingChange]);

  useEffect(() => {
    onStatusChange?.(downloadStatus);
  }, [downloadStatus, onStatusChange]);

  useEffect(() => {
    onClipsCountChange?.(clips.filter((c) => !c.isExcluded).length);
    if (clips.length > 0 && metadata?.duration) {
      const first = clips[0];
      onTimingChange?.({
        duration: metadata.duration,
        startTime: first.startTime,
        endTime: first.endTime,
      });
    }
  }, [clips, metadata, onClipsCountChange, onTimingChange]);

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
              id: crypto.randomUUID(),
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
    const newStart = lastClip
      ? Math.max(0, Math.min(Math.max(0, metadata.duration - 5), lastClip.endTime))
      : 0;
    const newEnd = Math.min(metadata.duration, Math.max(newStart + 1, newStart + 60));

    setClips((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
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

  const handleDownloadAllRef = useRef(handleDownloadAll);
  useEffect(() => {
    handleDownloadAllRef.current = handleDownloadAll;
  });

  useEffect(() => {
    onRegisterActions?.({
      triggerDownload: () => handleDownloadAllRef.current(),
      triggerCancel: () => setShowCancelModal(true),
      setTrimRange: (startTime, endTime) => {
        setClips((prev) =>
          prev.map((c, i) =>
            i === 0 && !c.isLocked && !c.isExcluded
              ? {
                  ...c,
                  startTime: Math.max(0, startTime),
                  endTime: Math.max(startTime + 0.1, endTime),
                }
              : c
          )
        );
      },
    });
  }, [onRegisterActions]);

  const getThumbnailUrl = () => {
    if (metadata?.thumbnail) return metadata.thumbnail;
    if (metadata?.id) return `https://img.youtube.com/vi/${metadata.id}/mqdefault.jpg`;
    const ytMatch = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/watch\?v=)([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const formatOptions = useMemo(() => {
    if (metadata?.formats && metadata.formats.length > 0) {
      const dynamic = [...metadata.formats]
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map((f) => ({
          value: String(f.height),
          label: `${f.resolution || `${f.height}p`}${
            f.height >= 2160
              ? ' (4K UHD)'
              : f.height >= 1440
              ? ' (2K QHD)'
              : f.height >= 1080
              ? ' (Full HD)'
              : f.height >= 720
              ? ' (HD)'
              : ''
          }`,
        }));
      return [{ value: '', label: 'Best Available (Auto Probe)' }, ...dynamic];
    }
    return [
      { value: '', label: 'Best Available (Auto Probe)' },
      { value: '2160', label: '2160p (4K UHD)' },
      { value: '1440', label: '1440p (2K QHD)' },
      { value: '1080', label: '1080p Full HD' },
      { value: '720', label: '720p HD' },
      { value: '480', label: '480p SD' },
      { value: '360', label: '360p' },
    ];
  }, [metadata]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full pb-8">
      {/* Studio Header HUD */}
      <header className="flex w-full items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7a8c]">
            <span>STUDIO</span>
            <span>&gt;</span>
            <span className="text-[#a78bfa]">TIMELINE</span>
            <span>&gt;</span>
            <span className="text-[#f4f4f7]">KEYFRAME TRIMMER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f4f4f7] font-heading">
            Selective Duration Trimmer
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a8c]">
            Load stream keyframes, adjust dual scrubbing handles on the interactive timeline ruler, and download precise segments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-[#22c55e33] bg-[#22c55e14] px-3 py-1 shadow-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            <span className="text-xs font-bold text-[#86efac]">
              Engine Ready
            </span>
          </div>
        </div>
      </header>

      {/* URL & Stream Inspection Command Deck */}
      <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
        <div className="flex w-full flex-col items-start gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] font-mono">
            SOURCE VIDEO STREAM URL
          </span>
          <div className="flex items-center gap-2.5 w-full">
            <div className="flex-1">
              <Input
                size="md"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isFetchingDetails || isDownloading}
                leftIcon={<Video className="w-4 h-4 text-[#a78bfa]" />}
                className="font-mono bg-[#0b0b10] border-[#2a2a3a]"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleFetchDetails}
              isLoading={isFetchingDetails}
              disabled={!url || isDownloading}
              className="font-bold shrink-0 text-xs sm:text-sm px-6 h-9 shadow-md shadow-violet-950/40"
            >
              <Scissors className="w-4 h-4" />
              <span>Load Video</span>
            </Button>
          </div>
        </div>

        {/* Video Metadata & Global Resolution Selector Card */}
        {metadata && (
          <div className="p-5 bg-[#0b0b10] border border-[#1e1e2a] rounded-xl flex flex-col md:flex-row items-start gap-5 shadow-inner w-full">
            {/* Thumbnail with Fallback */}
            <div className="w-full md:w-48 aspect-video bg-[#14141d] rounded-lg overflow-hidden shrink-0 border border-[#2a2a3a] relative flex items-center justify-center group shadow-md">
              {getThumbnailUrl() ? (
                <img
                  src={getThumbnailUrl()}
                  alt={metadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 text-[#7a7a8c]">
                  <Video className="w-6 h-6 text-[#a78bfa]" />
                  <span className="text-xs font-mono">No Preview</span>
                </div>
              )}
              <div className="absolute bottom-1.5 right-1.5 bg-black/85 px-2 py-0.5 rounded text-xs font-mono text-[#f4f4f7] border border-[#2a2a3a]">
                {formatTimeShort(metadata.duration)}
              </div>
            </div>

            {/* Video Details & Quality Select */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] block mb-0.5 font-mono">
                  STREAM TITLE
                </span>
                <h3
                  className="text-sm sm:text-base font-bold text-[#f4f4f7] truncate"
                  title={metadata.title}
                >
                  {metadata.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] block mb-0.5 font-mono">
                    STREAM DURATION
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#f4f4f7]">
                    {formatTime(metadata.duration)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] block mb-0.5 font-mono">
                    PUBLISHER
                  </span>
                  <span className="font-sans text-sm font-semibold text-[#a78bfa] truncate block">
                    {metadata.uploader || metadata.channel || metadata.extractor_key || 'YouTube'}
                  </span>
                </div>
              </div>

              {/* Target Resolution / Quality Selector */}
              <div className="pt-1 max-w-xs">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#9a9aac] mb-1.5 font-mono">
                  TARGET EXPORT RESOLUTION
                </label>
                <Select
                  options={formatOptions}
                  value={selectedFormat}
                  onChange={setSelectedFormat}
                  disabled={isDownloading}
                  placeholder="Best Available (Auto Probe)"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Segments Studio Section */}
      {metadata && (
        <section className="flex w-full flex-col items-start gap-5 rounded-2xl border border-[#1e1e2a] bg-[#12121a] p-6 shadow-xl surface-panel">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#1e1e2a] w-full">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#a78bfa]" />
                <h3 className="text-sm sm:text-base font-bold text-[#f4f4f7] tracking-tight font-heading">
                  Timeline Trimming Segments ({clips.length})
                </h3>
              </div>
              <p className="text-xs text-[#7a7a8c] mt-0.5">
                Drag the start/end handles on the ruler or enter exact timecodes below.
              </p>
            </div>

            <Badge variant="brand" size="sm">
              {clips.filter((c) => !c.isExcluded).length} Active Segments
            </Badge>
          </div>

          {/* List of segment timelines */}
          <div className="space-y-4 w-full">
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

          {/* Add Another Segment Button (Positioned at bottom of segments list as requested) */}
          <div className="w-full pt-1">
            <Button
              variant="outline"
              size="md"
              onClick={addClip}
              disabled={isDownloading}
              className="w-full py-3.5 border-dashed border-[#2a2a3a] hover:border-[#7c3aed] hover:bg-[#7c3aed14] text-[#f4f4f7] font-semibold text-sm transition-all flex items-center justify-center gap-2.5 rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#a78bfa]" />
              <span>Add Another Segment</span>
            </Button>
          </div>

          {/* Frame-Accurate Cutting Switch */}
          <div className="w-full pt-2">
            <label className="flex items-center gap-3 p-3.5 bg-[#0b0b10] rounded-xl border border-[#1e1e2a] cursor-pointer select-none transition-colors hover:border-[#2a2a3a]">
              <input
                type="checkbox"
                checked={preciseCut}
                onChange={(e) => setPreciseCut(e.target.checked)}
                disabled={isDownloading}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
                  preciseCut
                    ? 'bg-[#7c3aed] border-[#7c3aed] text-white'
                    : 'border-[#2a2a3a] bg-[#12121a]'
                }`}
              >
                {preciseCut && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-[#f4f4f7] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
                  Frame-Accurate Cutting (FFmpeg Re-encoding)
                </span>
                <span className="text-xs text-[#7a7a8c] block mt-0.5">
                  Re-encodes boundaries for perfect frame alignment without keyframe stutter.
                </span>
              </div>
            </label>
          </div>

          {/* Download Status Message */}
          {downloadStatus && (
            <div className="w-full p-3.5 rounded-xl bg-[#0b0b10] border border-[#7c3aed4d] text-xs sm:text-sm text-[#ede9fe] font-mono flex items-center gap-2.5 shadow-sm">
              <Loader2 className="w-4 h-4 text-[#a78bfa] animate-spin shrink-0" />
              <span>{downloadStatus}</span>
            </div>
          )}

          {/* Action Execution Dock */}
          <div className="flex justify-end gap-3.5 pt-3 border-t border-[#1e1e2a] w-full">
            {isDownloading ? (
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowCancelModal(true)}
                className="font-semibold text-sm px-6"
              >
                <OctagonX className="w-4 h-4" />
                <span>Cancel Trimming</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownloadAll}
                disabled={isDownloading || clips.filter((c) => !c.isExcluded).length === 0}
                className="font-bold text-sm px-8 py-3 shadow-lg shadow-violet-950/50"
              >
                <Download className="w-4 h-4" />
                <span>Download Selected Clips ({clips.filter((c) => !c.isExcluded).length})</span>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Cancel Confirmation Modal */}
      <Dialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Trimming Operation?"
        maxWidth="max-w-sm"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--status-danger)]/15 text-[var(--status-danger)] shrink-0">
            <OctagonX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to stop the current download? Completed clips will remain in your destination folder.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4 -mx-5 -mb-5 px-5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowCancelModal(false)}
            className="text-xs sm:text-sm font-semibold"
          >
            Keep Going
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={confirmCancel}
            className="text-xs sm:text-sm font-semibold"
          >
            Yes, Cancel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default SelectiveDurationView;
