import { useState, useRef } from 'react';
import { formatTime } from './timeUtils';

/**
 * Interactive Timeline Playhead
 * Displays the current playback position with a distinct top scrubber flag,
 * vertical laser hairline, and real-time pointer tracking.
 */
export function TimelinePlayhead({
  playheadTime = 0,
  duration = 0,
  disabled = false,
  onPlayheadChange,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const trackWidthRef = useRef(0);

  if (!duration || duration <= 0) return null;

  const percent = Math.max(0, Math.min(100, (playheadTime / duration) * 100));

  const handlePointerDown = (e) => {
    if (disabled || !duration) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    setIsDragging(true);
    startXRef.current = e.clientX;
    startTimeRef.current = playheadTime;

    const track = e.currentTarget.parentElement;
    trackWidthRef.current = track ? track.offsetWidth : 1;

    const handlePointerMove = (moveEvent) => {
      if (!duration || trackWidthRef.current <= 0) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const timeDelta = (deltaX / trackWidthRef.current) * duration;
      const newTime = Math.max(0, Math.min(duration, startTimeRef.current + timeDelta));
      if (onPlayheadChange) onPlayheadChange(parseFloat(newTime.toFixed(2)));
    };

    const handlePointerUp = (upEvent) => {
      try {
        upEvent.currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Fallback
      }
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (e) => {
    if (disabled || !duration) return;
    let step = 0.5;
    if (e.shiftKey) step = 2.0;
    else if (e.altKey) step = 0.1;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newTime = Math.max(0, playheadTime - step);
      if (onPlayheadChange) onPlayheadChange(parseFloat(newTime.toFixed(2)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newTime = Math.min(duration, playheadTime + step);
      if (onPlayheadChange) onPlayheadChange(parseFloat(newTime.toFixed(2)));
    }
  };

  const showTooltip = isDragging || isHovering;

  return (
    <div
      role="slider"
      aria-label="Timeline playhead"
      aria-valuenow={playheadTime}
      aria-valuemin={0}
      aria-valuemax={duration}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="absolute top-0 bottom-0 z-40 flex flex-col items-center cursor-ew-resize select-none outline-none group -ml-2 w-4 pointer-events-auto"
      style={{ left: `${percent}%` }}
    >
      {/* Floating Playhead Time Tooltip */}
      <div
        className={`absolute -top-7 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold whitespace-nowrap border pointer-events-none transition-all duration-150 z-50 bg-obsidian-950/95 text-accent-neon border-purple-500/60 shadow-md ${
          showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {formatTime(playheadTime, true)}
      </div>

      {/* Top Playhead Scrubber Head (Inverted Triangle Badge) */}
      <div className="w-3.5 h-3.5 bg-accent-neon rounded-[2px] shadow-glow-violet flex items-center justify-center -mt-1 group-hover:scale-110 transition-transform">
        <div className="w-1.5 h-1.5 bg-obsidian-950 rounded-full" />
      </div>

      {/* Vertical Playhead Hairline */}
      <div className="w-0.5 flex-1 bg-accent-neon shadow-glow-violet opacity-90 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

export default TimelinePlayhead;

