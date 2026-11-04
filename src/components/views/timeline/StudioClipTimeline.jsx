import { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Minus,
  Plus,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TimelineThumbnailTrack } from './TimelineThumbnailTrack';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrimmerHandle } from './TimelineTrimmerHandle';
import { TimelinePlayhead } from './TimelinePlayhead';
import { formatTime, parseTime, clamp } from './timeUtils';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
  { label: '60s', seconds: 60 },
  { label: 'Full', seconds: 'full' },
];

export function StudioClipTimeline({
  clip,
  metadata,
  updateClip,
  removeClip,
  duplicateClip,
  index,
  totalClips,
  isDownloadingQueue = false,
  handleRetryClip,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [userPlayheadTime, setUserPlayheadTime] = useState(null);

  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const [isSlidingRange, setIsSlidingRange] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const duration = metadata?.duration || 0;
  const clipDuration = Math.max(0, clip.endTime - clip.startTime);
  const approxFrames = Math.round(clipDuration * 30); // 30fps estimate

  // Derived playhead time clamped between 0 and duration
  const activePlayheadTime = userPlayheadTime !== null
    ? clamp(userPlayheadTime, 0, duration)
    : clip.startTime;

  // Mouse wheel zoom with Ctrl key
  useEffect(() => {
    const container = containerRef.current;
    if (!container || clip.isLocked || clip.isExcluded) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        setZoomLevel((prev) => clamp(prev + delta, 1, 30));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clip.isLocked, clip.isExcluded]);

  // Timecode Input Handlers
  const handleStartInputChange = (e) => setStartInput(e.target.value);
  const handleEndInputChange = (e) => setEndInput(e.target.value);

  const handleStartInputFocus = () => {
    setIsEditingStart(true);
    setStartInput(formatTime(clip.startTime, true));
  };

  const handleEndInputFocus = () => {
    setIsEditingEnd(true);
    setEndInput(formatTime(clip.endTime, true));
  };

  const handleStartInputBlur = () => {
    setIsEditingStart(false);
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(startInput);
    if (parsed >= clip.endTime) {
      parsed = Math.max(0, clip.endTime - 1);
      toast.error('Start time must be before end time.');
    }
    updateClip(clip.id, { startTime: parsed });
  };

  const handleEndInputBlur = () => {
    setIsEditingEnd(false);
    if (clip.isLocked || clip.isExcluded) return;
    let parsed = parseTime(endInput);
    if (parsed <= clip.startTime) {
      parsed = Math.min(duration, clip.startTime + 1);
      toast.error('End time must be after start time.');
    } else if (parsed > duration) {
      parsed = duration;
    }
    updateClip(clip.id, { endTime: parsed });
  };

  // Quick Preset Selection
  const applyPreset = (presetSec) => {
    if (clip.isLocked || clip.isExcluded || !duration) return;
    if (presetSec === 'full') {
      updateClip(clip.id, { startTime: 0, endTime: duration });
      toast.success('Segment set to full video duration.');
      return;
    }

    const newEnd = Math.min(duration, clip.startTime + presetSec);
    let newStart = clip.startTime;
    if (newEnd - newStart < presetSec) {
      newStart = Math.max(0, newEnd - presetSec);
    }
    updateClip(clip.id, {
      startTime: parseFloat(newStart.toFixed(2)),
      endTime: parseFloat(newEnd.toFixed(2)),
    });
    toast.success(`Applied ${presetSec}s preset.`);
  };

  // Active Range Sliding (Grab and slide the whole cut across track)
  const handleRangePointerDown = (e) => {
    if (clip.isLocked || clip.isExcluded || !duration) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }

    setIsSlidingRange(true);
    const startX = e.clientX;
    const initialStart = clip.startTime;
    const initialEnd = clip.endTime;
    const currentSpan = initialEnd - initialStart;

    const trackWidth = trackRef.current ? trackRef.current.offsetWidth : 1;

    const handlePointerMove = (moveEvent) => {
      if (!trackRef.current || !duration) return;
      const deltaX = moveEvent.clientX - startX;
      let timeDelta = (deltaX / trackWidth) * duration;

      let targetStart = initialStart + timeDelta;
      let targetEnd = initialEnd + timeDelta;

      if (targetStart < 0) {
        targetStart = 0;
        targetEnd = currentSpan;
      } else if (targetEnd > duration) {
        targetEnd = duration;
        targetStart = duration - currentSpan;
      }

      updateClip(clip.id, {
        startTime: parseFloat(targetStart.toFixed(2)),
        endTime: parseFloat(targetEnd.toFixed(2)),
      });
    };

    const handlePointerUp = (upEvent) => {
      try {
        upEvent.currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Safe fallback
      }
      setIsSlidingRange(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Track click to seek playhead
  const handleTrackPointerDown = (e) => {
    if (clip.isLocked || clip.isExcluded || !duration || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = parseFloat((ratio * duration).toFixed(2));
    setUserPlayheadTime(targetTime);
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 space-y-2.5 ${
        clip.isExcluded
          ? 'bg-obsidian-950/60 border-purple-900/20 opacity-60'
          : 'bg-obsidian-900/90 border-purple-800/40 shadow-sm'
      }`}
    >
      {/* 1. Single-Row Clean Segment Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-900/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="accent" size="sm" className="font-bold shrink-0">
            #{index + 1}
          </Badge>

          <div className="flex-1 max-w-[200px] min-w-[100px] shrink-0">
            <Input
              type="text"
              size="sm"
              placeholder="Segment Name (optional)"
              value={clip.title}
              onChange={(e) => updateClip(clip.id, { title: e.target.value })}
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
              className="h-7 text-xs bg-obsidian-950/80 border-purple-900/40 px-2"
            />
          </div>

          <Button
            variant={clip.isLocked ? 'accentMuted' : 'outline'}
            size="iconSm"
            onClick={() => updateClip(clip.id, { isLocked: !clip.isLocked })}
            disabled={clip.isExcluded || isDownloadingQueue}
            title={clip.isLocked ? 'Unlock Timeline' : 'Lock Timeline'}
            className="w-7 h-7 shrink-0"
          >
            {clip.isLocked ? <Lock className="w-3 h-3 text-accent-neon" /> : <Unlock className="w-3 h-3" />}
          </Button>

          {duplicateClip && (
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => duplicateClip(clip.id)}
              disabled={clip.isExcluded || isDownloadingQueue}
              title="Duplicate Segment"
              className="w-7 h-7 shrink-0"
            >
              <Copy className="w-3 h-3 text-purple-300" />
            </Button>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-purple-300/80 hover:text-purple-100 select-none shrink-0 ml-1">
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
                  ? 'bg-accent-violet border-accent-violet text-white'
                  : 'border-purple-800/60 bg-obsidian-950'
              }`}
            >
              {clip.isExcluded && <Check className="w-2 h-2 stroke-[3]" />}
            </div>
            <span className="text-[11px]">Exclude</span>
          </label>
        </div>

        {totalClips > 1 && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => removeClip(clip.id)}
            disabled={isDownloadingQueue}
            className="text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 w-7 h-7 shrink-0"
            title="Remove Segment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* 2. Compact Presets & Zoom Toolbar Row */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Presets chips */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase font-mono tracking-wider text-purple-300/70 mr-0.5 font-semibold">
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.seconds)}
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-purple-200 hover:text-white bg-obsidian-950 border border-purple-900/40 hover:border-purple-600 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Zoom Group with Slider & +/- Buttons */}
        <div className="flex items-center gap-1.5 bg-obsidian-950/90 border border-purple-900/40 rounded-lg px-2 py-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoomLevel((prev) => clamp(prev - 0.5, 1, 30))}
            disabled={zoomLevel <= 1}
            className="w-5 h-5 rounded flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/40 disabled:opacity-30 cursor-pointer"
            title="Zoom out"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>

          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            aria-label="Timeline zoom level"
            className="w-16 sm:w-24 h-1.5 bg-obsidian-850 rounded-full appearance-none cursor-pointer border border-purple-900/60 accent-accent-neon [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-neon [&::-webkit-slider-thumb]:hover:bg-white [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-all [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-neon [&::-moz-range-thumb]:border-0"
          />

          <button
            type="button"
            onClick={() => setZoomLevel((prev) => clamp(prev + 0.5, 1, 30))}
            disabled={zoomLevel >= 30}
            className="w-5 h-5 rounded flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-900/40 disabled:opacity-30 cursor-pointer"
            title="Zoom in"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>

          <span className="text-[10px] font-mono tabular-nums text-purple-200 font-bold min-w-[2.2rem] text-center">
            {zoomLevel.toFixed(1)}x
          </span>

          {zoomLevel > 1 && (
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="w-5 h-5 rounded flex items-center justify-center text-purple-400 hover:text-white hover:bg-purple-900/40 cursor-pointer"
              title="Reset Zoom to 1x"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Download Status */}
      {(clip.status !== 'idle' || clip.message) && (
        <div
          className={`my-1.5 p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            clip.status === 'downloading'
              ? 'bg-purple-950/40 border-accent-violet/40 text-purple-200'
              : clip.status === 'done'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : clip.status === 'error'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-obsidian-950 text-[var(--text-secondary)]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {clip.status === 'downloading' && (
              <Loader2 className="w-3 h-3 animate-spin shrink-0 text-accent-neon" />
            )}
            <span className="truncate text-xs">{clip.message || 'Queued...'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {clip.status === 'downloading' && (
              <span className="font-mono font-bold text-accent-neon text-xs">
                {(clip.progress || 0).toFixed(1)}%
              </span>
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

      {/* 3. Polished Thumbnail-Based Video Trimming Timeline Track */}
      <div
        ref={containerRef}
        className={`w-full bg-obsidian-950 rounded-lg border border-purple-900/50 overflow-x-auto overflow-y-hidden relative select-none shadow-inner ${
          clip.isLocked || clip.isExcluded ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          className="relative min-w-full flex flex-col"
          style={{ width: `${zoomLevel * 100}%` }}
        >
          {/* Top Time Ruler (Height: 20px) */}
          <TimelineRuler duration={duration} zoomLevel={zoomLevel} />

          {/* Filmstrip Thumbnail Track Container (Explicit Height: 64px / h-16) */}
          <div className="w-full h-16 relative">
            {/* Tiled Video Frame Thumbnails with Dimmed Trim Masks */}
            <TimelineThumbnailTrack
              metadata={metadata}
              duration={duration}
              startTime={clip.startTime}
              endTime={clip.endTime}
              zoomLevel={zoomLevel}
            />

            {/* Draggable Active Region Window (Slide window across timeline) */}
            <div
              onPointerDown={handleRangePointerDown}
              className={`absolute inset-y-0 bg-purple-500/10 hover:bg-purple-500/15 cursor-grab active:cursor-grabbing z-20 transition-colors ${
                isSlidingRange ? 'bg-purple-500/20' : ''
              }`}
              style={{
                left: `${duration > 0 ? (clip.startTime / duration) * 100 : 0}%`,
                right: `${duration > 0 ? 100 - (clip.endTime / duration) * 100 : 0}%`,
              }}
              title="Click and drag to slide clip segment"
            />

            {/* Clearly Visible In-Point Trim Handle */}
            <TimelineTrimmerHandle
              type="start"
              time={clip.startTime}
              duration={duration}
              minTime={0}
              maxTime={clip.endTime - 0.1}
              disabled={clip.isLocked || clip.isExcluded}
              onTimeChange={(val) => updateClip(clip.id, { startTime: parseFloat(val.toFixed(2)) })}
            />

            {/* Clearly Visible Out-Point Trim Handle */}
            <TimelineTrimmerHandle
              type="end"
              time={clip.endTime}
              duration={duration}
              minTime={clip.startTime + 0.1}
              maxTime={duration}
              disabled={clip.isLocked || clip.isExcluded}
              onTimeChange={(val) => updateClip(clip.id, { endTime: parseFloat(val.toFixed(2)) })}
            />

            {/* Distinct Draggable Playhead */}
            <TimelinePlayhead
              playheadTime={activePlayheadTime}
              duration={duration}
              disabled={clip.isLocked || clip.isExcluded}
              onPlayheadChange={setUserPlayheadTime}
            />
          </div>
        </div>
      </div>

      {/* 4. Compact Single-Row Start / Duration / End Controls */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Compact Start Input with explicit container width */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
            Start:
          </span>
          <div className="w-24 sm:w-28 shrink-0">
            <Input
              type="text"
              size="sm"
              value={isEditingStart ? startInput : formatTime(clip.startTime, true)}
              onFocus={handleStartInputFocus}
              onChange={handleStartInputChange}
              onBlur={handleStartInputBlur}
              className="font-mono text-center text-xs h-7 tracking-wide bg-obsidian-950 border-purple-900/60 text-purple-100 focus:border-accent-violet focus:ring-1 focus:ring-accent-violet px-1"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
        </div>

        {/* Center Clip Duration Pill (Clean & Integrated) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-700/40 shrink-0">
          <Clock className="w-3 h-3 text-accent-neon shrink-0" />
          <span className="font-mono text-xs tabular-nums text-purple-100 font-bold">
            {formatTime(clipDuration, true)}
          </span>
          <span className="text-[10px] font-mono text-purple-300/60 hidden sm:inline">
            ({approxFrames}f)
          </span>
        </div>

        {/* Compact End Input with explicit container width */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider">
            End:
          </span>
          <div className="w-24 sm:w-28 shrink-0">
            <Input
              type="text"
              size="sm"
              value={isEditingEnd ? endInput : formatTime(clip.endTime, true)}
              onFocus={handleEndInputFocus}
              onChange={handleEndInputChange}
              onBlur={handleEndInputBlur}
              className="font-mono text-center text-xs h-7 tracking-wide bg-obsidian-950 border-purple-900/60 text-purple-100 focus:border-accent-violet focus:ring-1 focus:ring-accent-violet px-1"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudioClipTimeline;
