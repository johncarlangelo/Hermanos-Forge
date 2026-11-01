import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  Layers,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatTimeShort = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function TimelineRuler({
  duration = 180,
  startTime = 0,
  setStartTime,
  endTime = 180,
  setEndTime,
  currentTime = 0,
  setCurrentTime,
  activeTab = 'download',
  sequenceItemsCount = 0,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const trackRef = useRef(null);

  const safeDuration = Math.max(1, duration || 180);
  const safeStart = Math.max(0, Math.min(startTime || 0, safeDuration));
  const safeEnd = Math.max(safeStart + 0.1, Math.min(endTime || safeDuration, safeDuration));
  const rangeDuration = safeEnd - safeStart;

  // Active dragging states
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Playhead simulation ticker
  useEffect(() => {
    let animId;
    if (isPlaying) {
      let lastTs = performance.now();
      const step = (now) => {
        const delta = (now - lastTs) / 1000;
        lastTs = now;
        setCurrentTime?.((prev) => {
          const next = (prev || 0) + delta;
          if (next >= safeEnd) {
            setIsPlaying(false);
            return safeStart;
          }
          return next;
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, safeEnd, safeStart, setCurrentTime]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingStart && !isDraggingEnd && !isDraggingPlayhead) return;
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = ratio * safeDuration;
      const minGap = Math.min(1, Math.max(0.1, safeDuration * 0.01));

      if (isDraggingStart && setStartTime) {
        const newStart = Math.max(0, Math.min(targetTime, safeEnd - minGap));
        setStartTime(newStart);
      } else if (isDraggingEnd && setEndTime) {
        const newEnd = Math.min(safeDuration, Math.max(targetTime, safeStart + minGap));
        setEndTime(newEnd);
      } else if (isDraggingPlayhead && setCurrentTime) {
        setCurrentTime(Math.max(0, Math.min(safeDuration, targetTime)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      setIsDraggingPlayhead(false);
    };

    if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDraggingStart,
    isDraggingEnd,
    isDraggingPlayhead,
    safeDuration,
    safeStart,
    safeEnd,
    setStartTime,
    setEndTime,
    setCurrentTime,
  ]);

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * safeDuration;
    setCurrentTime?.(targetTime);
  };

  // Generate ruler tick marks
  const tickCount = useMemo(() => {
    return Math.floor(20 * zoomLevel);
  }, [zoomLevel]);

  const ticks = useMemo(() => {
    const items = [];
    const step = safeDuration / tickCount;
    for (let i = 0; i <= tickCount; i++) {
      const timeSec = i * step;
      items.push({
        timeSec,
        label: formatTimeShort(timeSec),
        isMajor: i % 2 === 0,
        pct: (i / tickCount) * 100,
      });
    }
    return items;
  }, [safeDuration, tickCount]);

  const startPct = (safeStart / safeDuration) * 100;
  const endPct = (safeEnd / safeDuration) * 100;
  const playheadPct = ((currentTime || safeStart) / safeDuration) * 100;

  return (
    <footer
      className="h-22 bg-[#0c0c14] border-t border-[#1e1e2a] px-6 py-2 flex flex-col justify-between shrink-0 select-none z-10 relative"
      data-purpose="studio-timeline-ruler"
    >
      {/* Top Header: Timecode readouts, Transport buttons, Zoom scrubbers */}
      <div className="flex items-center justify-between text-xs font-mono">
        {/* Left: Timecode Pill Stack */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12121a] border border-[#1e1e2a] text-[#b4b4c2]">
            <span className="text-[10px] text-[#7a7a8c] uppercase font-bold">IN</span>
            <span className="text-[#a78bfa] font-bold">{formatTime(safeStart)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12121a] border border-[#1e1e2a] text-[#b4b4c2]">
            <span className="text-[10px] text-[#7a7a8c] uppercase font-bold">OUT</span>
            <span className="text-[#a78bfa] font-bold">{formatTime(safeEnd)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12121a] border border-[#1e1e2a] text-[#b4b4c2]">
            <span className="text-[10px] text-[#7a7a8c] uppercase font-bold">CLIP</span>
            <span className="text-[#22c55e] font-bold">{formatTime(rangeDuration)}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#12121a] border border-[#1e1e2a] text-[#7a7a8c]">
            <Clock className="w-3 h-3 text-[#5c5c6e]" />
            <span>TOTAL: {formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* Center: Transport Scrub Controls */}
        <div className="flex items-center gap-1">
          <Tooltip content="Jump to In-Point (Home)" position="top" delay={150}>
            <button
              type="button"
              onClick={() => setCurrentTime?.(safeStart)}
              className="p-1 rounded text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition"
              aria-label="Jump to start"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <Tooltip content={isPlaying ? 'Pause Preview' : 'Play Preview'} position="top" delay={150}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-md bg-[#7c3aed26] border border-[#7c3aed4d] text-[#c4b5fd] hover:bg-[#7c3aed40] transition cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </Tooltip>

          <Tooltip content="Jump to Out-Point (End)" position="top" delay={150}>
            <button
              type="button"
              onClick={() => setCurrentTime?.(safeEnd)}
              className="p-1 rounded text-[#7a7a8c] hover:text-[#f4f4f7] hover:bg-[#ffffff0f] transition"
              aria-label="Jump to end"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Right: Sequence duration tally & Zoom scrubbers */}
        <div className="flex items-center gap-2">
          {activeTab === 'mass-clip' && sequenceItemsCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#7c3aed1a] border border-[#7c3aed33] text-[#c4b5fd] text-[11px]">
              <Layers className="w-3 h-3 text-[#a78bfa]" />
              <span>SEQUENCE: {sequenceItemsCount} TRACKS</span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-[#12121a] border border-[#1e1e2a] rounded px-1 py-0.5">
            <Tooltip content="Zoom Out" position="top" delay={150}>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                className="p-0.5 text-[#7a7a8c] hover:text-[#f4f4f7]"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
            </Tooltip>

            <span className="text-[10px] text-[#7a7a8c] px-1 font-mono">{zoomLevel}x</span>

            <Tooltip content="Zoom In" position="top" delay={150}>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
                className="p-0.5 text-[#7a7a8c] hover:text-[#f4f4f7]"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </Tooltip>

            <Tooltip content="Reset Zoom" position="top" delay={150}>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-0.5 text-[#7a7a8c] hover:text-[#f4f4f7]"
                aria-label="Reset zoom"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Bottom: Studio Timeline Ruler Strip */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-10 w-full bg-[#08080d] border border-[#1e1e2a] rounded-lg cursor-pointer overflow-hidden group select-none shadow-inner"
        data-purpose="timeline-ruler-track"
      >
        {/* Tick Mark Scale */}
        <div className="absolute inset-0 pointer-events-none flex items-end">
          {ticks.map((tick, idx) => (
            <div
              key={idx}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${tick.pct}%` }}
            >
              {tick.isMajor && (
                <span className="text-[9px] font-mono text-[#5c5c6e] mb-1 leading-none select-none">
                  {tick.label}
                </span>
              )}
              <div
                className={`w-[1px] ${
                  tick.isMajor ? 'h-3 bg-[#2a2a3a]' : 'h-1.5 bg-[#1e1e2a]'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Multi-Track Sequence Blocks for mass-clip */}
        {activeTab === 'mass-clip' && sequenceItemsCount > 0 ? (
          <div className="absolute inset-0 pointer-events-none flex items-stretch">
            {Array.from({ length: sequenceItemsCount }).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 border-r border-[#7c3aed4d] bg-[#7c3aed14] flex items-center justify-center overflow-hidden"
              >
                <span className="font-mono text-[9px] text-[#c4b5fd] font-bold opacity-75">
                  Track {idx + 1}
                </span>
              </div>
            ))}
          </div>
        ) : (
          /* Selected Region Highlight */
          <div
            className="absolute top-0 bottom-0 bg-[#7c3aed26] border-y border-[#7c3aed66] pointer-events-none transition-all duration-75"
            style={{
              left: `${startPct}%`,
              width: `${Math.max(0, endPct - startPct)}%`,
            }}
          />
        )}

        {/* Left In-Point Trim Handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingStart(true);
          }}
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex items-center justify-center cursor-ew-resize z-20 group/handle"
          style={{ left: `${startPct}%` }}
          title={`In-Point: ${formatTime(safeStart)} (Drag to trim)`}
        >
          <div className="w-1.5 h-full bg-[#8b5cf6] rounded-l shadow-sm group-hover/handle:bg-[#a78bfa] group-hover/handle:w-2 transition-all flex items-center justify-center">
            <span className="w-0.5 h-3 bg-white/70 rounded-full" />
          </div>
        </div>

        {/* Right Out-Point Trim Handle */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingEnd(true);
          }}
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex items-center justify-center cursor-ew-resize z-20 group/handle"
          style={{ left: `${endPct}%` }}
          title={`Out-Point: ${formatTime(safeEnd)} (Drag to trim)`}
        >
          <div className="w-1.5 h-full bg-[#8b5cf6] rounded-r shadow-sm group-hover/handle:bg-[#a78bfa] group-hover/handle:w-2 transition-all flex items-center justify-center">
            <span className="w-0.5 h-3 bg-white/70 rounded-full" />
          </div>
        </div>

        {/* Playhead Cursor */}
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingPlayhead(true);
          }}
          className="absolute top-0 bottom-0 w-3 -ml-1.5 flex flex-col items-center cursor-ew-resize z-30 pointer-events-auto"
          style={{ left: `${playheadPct}%` }}
          title={`Playhead: ${formatTime(currentTime || safeStart)}`}
        >
          <div className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[6px] border-t-[#38bdf8]" />
          <div className="w-[1.5px] h-full bg-[#38bdf8] shadow-sm shadow-[#38bdf8]" />
        </div>
      </div>
    </footer>
  );
}
