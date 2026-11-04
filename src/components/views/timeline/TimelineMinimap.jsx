import { useState, useRef } from 'react';
import { formatTime } from './timeUtils';

export function TimelineMinimap({
  duration,
  activeClip,
  allClips = [],
  zoomLevel = 1,
  scrollLeft = 0,
  containerWidth = 0,
  onSeekMinimap,
}) {
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const minimapRef = useRef(null);

  if (!duration || duration <= 0) return null;

  const handlePointerDown = (e) => {
    if (!minimapRef.current || !onSeekMinimap) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    onSeekMinimap(targetTime);
  };

  const handlePointerMove = (e) => {
    if (!minimapRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, moveX / rect.width));
    setHoverTime(ratio * duration);
    setHoverX(moveX);
  };

  const handlePointerLeave = () => {
    setHoverTime(null);
  };

  // Viewport visible range
  const totalTrackWidth = containerWidth * zoomLevel;
  const viewportStartRatio = totalTrackWidth > 0 ? scrollLeft / totalTrackWidth : 0;
  const viewportWidthRatio = totalTrackWidth > 0 ? containerWidth / totalTrackWidth : 1;

  return (
    <div className="relative mb-2 select-none group">
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-tertiary)] mb-1">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-semibold text-purple-300/70">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-violet" />
          Full Video Duration Overview
        </span>
        <span className="tabular-nums text-purple-200">
          {formatTime(duration)}
        </span>
      </div>

      <div
        ref={minimapRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full h-5 bg-obsidian-950 rounded border border-purple-900/40 relative overflow-hidden cursor-pointer hover:border-purple-600/50 transition-colors"
      >
        {/* Subtle center hairline */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-purple-500/10 pointer-events-none" />

        {/* Other queued segments */}
        {allClips.map((c, i) => {
          if (!c || c.id === activeClip?.id) return null;
          const leftPercent = (c.startTime / duration) * 100;
          const widthPercent = Math.max(0.5, ((c.endTime - c.startTime) / duration) * 100);
          return (
            <div
              key={c.id || i}
              className="absolute top-0.5 bottom-0.5 rounded-[2px] bg-purple-900/40 border border-purple-700/40 pointer-events-none"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              title={`Segment #${i + 1}`}
            />
          );
        })}

        {/* Active segment highlighted in solid Obsidian Violet (No rainbow gradients) */}
        {activeClip && (
          <div
            className="absolute top-0.5 bottom-0.5 rounded-[2px] bg-accent-violet border border-purple-300/80 shadow-sm pointer-events-none transition-all duration-75"
            style={{
              left: `${(activeClip.startTime / duration) * 100}%`,
              width: `${Math.max(0.6, ((activeClip.endTime - activeClip.startTime) / duration) * 100)}%`,
            }}
          />
        )}

        {/* Zoom Viewport Lens (Visible when zoomLevel > 1) */}
        {zoomLevel > 1 && (
          <div
            className="absolute top-0 bottom-0 border border-white/60 bg-white/10 rounded-[2px] pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.max(0, viewportStartRatio * 100)}%`,
              width: `${Math.min(100, viewportWidthRatio * 100)}%`,
            }}
          />
        )}

        {/* Hover scrub line & timestamp */}
        {hoverTime !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 w-px bg-white/80 pointer-events-none"
              style={{ left: `${hoverX}px` }}
            />
            <div
              className="absolute top-0 -translate-y-full mb-1 z-30 px-1.5 py-0.5 rounded text-[10px] font-mono text-white bg-obsidian-950 border border-purple-500/50 shadow pointer-events-none -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TimelineMinimap;
