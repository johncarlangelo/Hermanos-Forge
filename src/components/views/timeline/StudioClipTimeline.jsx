import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Film,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TimelineMinimap } from './TimelineMinimap';
import { TimelineFilmTrack } from './TimelineFilmTrack';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrimmerHandle } from './TimelineTrimmerHandle';
import { formatTime, parseTime, clamp } from './timeUtils';
import toast from 'react-hot-toast';

const PRESETS = [
  { label: '15s (Reel)', seconds: 15 },
  { label: '30s (TikTok)', seconds: 30 },
  { label: '60s (Shorts)', seconds: 60 },
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
  allClips = [],
  isDownloadingQueue = false,
  handleRetryClip,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isSlidingRange, setIsSlidingRange] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const duration = metadata?.duration || 0;
  const clipDuration = Math.max(0, clip.endTime - clip.startTime);
  const approxFrames = Math.round(clipDuration * 30); // 30fps estimate

  // Track container width and scroll for minimap viewport sync
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollLeft(container.scrollLeft);
    };

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });

    container.addEventListener('scroll', handleScroll);
    observer.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Mouse wheel zoom with Ctrl key
  useEffect(() => {
    const container = containerRef.current;
    if (!container || clip.isLocked || clip.isExcluded) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        setZoomLevel((prev) => clamp(prev + delta, 1, 50));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clip.isLocked, clip.isExcluded]);

  // Minimap seek callback
  const handleSeekMinimap = useCallback(
    (targetTime) => {
      if (!containerRef.current || !duration) return;
      const targetPercent = targetTime / duration;
      const totalTrackWidth = containerWidth * zoomLevel;
      const scrollPos = targetPercent * totalTrackWidth - containerWidth / 2;
      containerRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    },
    [duration, containerWidth, zoomLevel]
  );

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

  // Sub-second Nudge Helpers
  const nudgeStartTime = (delta) => {
    if (clip.isLocked || clip.isExcluded) return;
    const newStart = clamp(clip.startTime + delta, 0, clip.endTime - 0.1);
    updateClip(clip.id, { startTime: parseFloat(newStart.toFixed(2)) });
  };

  const nudgeEndTime = (delta) => {
    if (clip.isLocked || clip.isExcluded) return;
    const newEnd = clamp(clip.endTime + delta, clip.startTime + 0.1, duration);
    updateClip(clip.id, { endTime: parseFloat(newEnd.toFixed(2)) });
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
    toast.success(`Applied ${presetSec}s duration preset.`);
  };

  // Active Range Sliding Handler (Grab and slide whole window)
  const handleRangePointerDown = (e) => {
    if (clip.isLocked || clip.isExcluded || !duration) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
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
        // Fallback
      }
      setIsSlidingRange(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-200 ${
        clip.isExcluded
          ? 'bg-obsidian-950/60 border-purple-900/20 opacity-60'
          : 'bg-obsidian-900/90 border-purple-800/40 shadow-sm'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-purple-900/30">
        {/* Left: Badge, Title Input & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="accent" size="md">
            Segment #{index + 1}
          </Badge>

          <Input
            type="text"
            placeholder="Segment Name (e.g. Intro Hook, Chorus)"
            value={clip.title}
            onChange={(e) => updateClip(clip.id, { title: e.target.value })}
            disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            className="h-8 text-xs sm:text-sm w-56 bg-obsidian-950/80 border-purple-900/40"
          />

          <Button
            variant={clip.isLocked ? 'accentMuted' : 'outline'}
            size="iconSm"
            onClick={() => updateClip(clip.id, { isLocked: !clip.isLocked })}
            disabled={clip.isExcluded || isDownloadingQueue}
            title={clip.isLocked ? 'Unlock Timeline' : 'Lock Timeline (Prevents accidental movement)'}
          >
            {clip.isLocked ? <Lock className="w-3.5 h-3.5 text-accent-neon" /> : <Unlock className="w-3.5 h-3.5" />}
          </Button>

          {duplicateClip && (
            <Button
              variant="outline"
              size="iconSm"
              onClick={() => duplicateClip(clip.id)}
              disabled={clip.isExcluded || isDownloadingQueue}
              title="Duplicate Segment (Clone adjacent slice)"
            >
              <Copy className="w-3.5 h-3.5 text-purple-300" />
            </Button>
          )}

          <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] select-none ml-1">
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
                  ? 'bg-accent-violet border-accent-violet text-white'
                  : 'border-purple-800/60 bg-obsidian-950'
              }`}
            >
              {clip.isExcluded && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
            <span>Exclude</span>
          </label>
        </div>

        {/* Right: Quick Duration Presets & Duration Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-obsidian-950/80 p-1 rounded-lg border border-purple-900/30">
            <span className="text-[10px] uppercase font-mono tracking-wider text-purple-300/70 px-1 font-semibold">
              Presets:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.seconds)}
                disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-purple-200 hover:text-white hover:bg-purple-900/50 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-700/40 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-accent-neon" />
            <span className="font-mono text-xs tabular-nums text-purple-100 font-bold">
              {formatTime(clipDuration, true)}
            </span>
            <span className="text-[10px] font-mono text-purple-300/60 hidden sm:inline">
              ({approxFrames}f @ 30fps)
            </span>
          </div>

          {totalClips > 1 && (
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => removeClip(clip.id)}
              disabled={isDownloadingQueue}
              className="text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
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
          className={`my-3 p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-2.5 ${
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
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-accent-neon" />
            )}
            <span className="truncate">{clip.message || 'Queued...'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {clip.status === 'downloading' && (
              <span className="font-mono font-bold text-accent-neon">
                {(clip.progress || 0).toFixed(1)}%
              </span>
            )}
            {clip.status === 'error' && handleRetryClip && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRetryClip(clip)}
                className="h-7 text-xs px-2.5"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. Global Minimap Overview Track */}
      <div className={`mt-3.5 ${clip.isLocked || clip.isExcluded ? 'opacity-40 pointer-events-none' : ''}`}>
        <TimelineMinimap
          duration={duration}
          activeClip={clip}
          allClips={allClips}
          zoomLevel={zoomLevel}
          scrollLeft={scrollLeft}
          containerWidth={containerWidth}
          onSeekMinimap={handleSeekMinimap}
        />

        {/* 3. Zoom Deck & Keyboard Nudge Hints */}
        <div className="flex items-center justify-between my-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/80 font-bold flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-accent-neon" />
              Video Clip Trimmer
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-tertiary)] bg-obsidian-950/60 px-2 py-0.5 rounded border border-purple-900/30">
              <span className="text-accent-neon font-semibold">[← / →]</span> Nudge 0.1s &middot;
              <span className="text-accent-neon font-semibold">[Shift]</span> 1.0s &middot;
              <span className="text-accent-neon font-semibold">[Alt]</span> 0.05s
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono tabular-nums text-purple-200 mr-1">
              {zoomLevel.toFixed(1)}x
            </span>

            {/* Quick zoom step chips */}
            {[1, 2, 5, 10].map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoomLevel(z)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  zoomLevel === z
                    ? 'bg-accent-violet text-white font-bold'
                    : 'text-purple-300/70 hover:text-white bg-obsidian-950 border border-purple-900/30'
                }`}
              >
                {z}x
              </button>
            ))}

            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => clamp(prev - 0.5, 1, 50))}
              title="Zoom out timeline"
              className="w-6 h-6"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>

            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              aria-label="Timeline zoom level"
              className="w-16 sm:w-24 h-1 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-accent-violet border border-purple-900/40"
            />

            <Button
              variant="outline"
              size="iconSm"
              onClick={() => setZoomLevel((prev) => clamp(prev + 0.5, 1, 50))}
              title="Zoom in timeline"
              className="w-6 h-6"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom to 1x"
              className="w-6 h-6 text-purple-300"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* 4. Zoomable Video Trimmer Viewport */}
        <div
          ref={containerRef}
          className="w-full h-20 pt-6 pb-2 bg-obsidian-950 rounded-xl border border-purple-900/50 overflow-x-auto overflow-y-hidden relative timeline-scrollbar select-none shadow-inner"
        >
          <div
            ref={trackRef}
            className="h-full relative bg-obsidian-900/80 rounded-md"
            style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
          >
            {/* Clean Video Track with Dimmed Trim Masks */}
            <TimelineFilmTrack
              duration={duration}
              startTime={clip.startTime}
              endTime={clip.endTime}
            />

            {/* Adaptive Time Ruler */}
            <TimelineRuler duration={duration} zoomLevel={zoomLevel} />

            {/* Draggable Active Region Span (Clean translucent window, grab to slide) */}
            <div
              onPointerDown={handleRangePointerDown}
              className={`absolute top-0 bottom-0 bg-purple-500/10 hover:bg-purple-500/15 border-y border-purple-400/70 cursor-grab active:cursor-grabbing z-20 transition-colors ${
                isSlidingRange ? 'bg-purple-500/20 ring-1 ring-purple-300 shadow-sm' : ''
              }`}
              style={{
                left: `${duration > 0 ? (clip.startTime / duration) * 100 : 0}%`,
                right: `${duration > 0 ? 100 - (clip.endTime / duration) * 100 : 0}%`,
              }}
              title="Click and drag to slide segment across timeline"
            />

            {/* In-Point Trimmer Handle [ */}
            <TimelineTrimmerHandle
              type="start"
              time={clip.startTime}
              duration={duration}
              minTime={0}
              maxTime={clip.endTime - 0.1}
              disabled={clip.isLocked || clip.isExcluded}
              onTimeChange={(val) => updateClip(clip.id, { startTime: parseFloat(val.toFixed(2)) })}
            />

            {/* Out-Point Trimmer Handle ] */}
            <TimelineTrimmerHandle
              type="end"
              time={clip.endTime}
              duration={duration}
              minTime={clip.startTime + 0.1}
              maxTime={duration}
              disabled={clip.isLocked || clip.isExcluded}
              onTimeChange={(val) => updateClip(clip.id, { endTime: parseFloat(val.toFixed(2)) })}
            />
          </div>
        </div>

        {/* 5. Sub-Second Precision Deck & Timecode Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* IN Timecode Deck */}
          <div className="p-3 bg-obsidian-950/80 rounded-xl border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-purple-200 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-300" />
                In-Point (Start)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudgeStartTime(-1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Step backward 1s"
                >
                  -1s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeStartTime(-0.1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Nudge backward 0.1s"
                >
                  <ChevronLeft className="w-3 h-3 inline" /> 0.1s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeStartTime(0.1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Nudge forward 0.1s"
                >
                  0.1s <ChevronRight className="w-3 h-3 inline" />
                </button>
                <button
                  type="button"
                  onClick={() => nudgeStartTime(1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Step forward 1s"
                >
                  +1s
                </button>
              </div>
            </div>

            <Input
              type="text"
              value={isEditingStart ? startInput : formatTime(clip.startTime, true)}
              onFocus={handleStartInputFocus}
              onChange={handleStartInputChange}
              onBlur={handleStartInputBlur}
              className="font-mono text-center text-sm h-9 tracking-wider bg-obsidian-900 border-purple-900/60 text-purple-100 focus:border-accent-violet focus:ring-purple-500/30"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>

          {/* OUT Timecode Deck */}
          <div className="p-3 bg-obsidian-950/80 rounded-xl border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-purple-200 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
                Out-Point (End)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudgeEndTime(-1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Step backward 1s"
                >
                  -1s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeEndTime(-0.1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Nudge backward 0.1s"
                >
                  <ChevronLeft className="w-3 h-3 inline" /> 0.1s
                </button>
                <button
                  type="button"
                  onClick={() => nudgeEndTime(0.1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Nudge forward 0.1s"
                >
                  0.1s <ChevronRight className="w-3 h-3 inline" />
                </button>
                <button
                  type="button"
                  onClick={() => nudgeEndTime(1)}
                  disabled={clip.isLocked || clip.isExcluded}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-purple-300 hover:bg-purple-950 border border-purple-800/40 disabled:opacity-40"
                  title="Step forward 1s"
                >
                  +1s
                </button>
              </div>
            </div>

            <Input
              type="text"
              value={isEditingEnd ? endInput : formatTime(clip.endTime, true)}
              onFocus={handleEndInputFocus}
              onChange={handleEndInputChange}
              onBlur={handleEndInputBlur}
              className="font-mono text-center text-sm h-9 tracking-wider bg-obsidian-900 border-purple-900/60 text-purple-100 focus:border-accent-violet focus:ring-purple-500/30"
              disabled={clip.isLocked || clip.isExcluded || isDownloadingQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudioClipTimeline;
