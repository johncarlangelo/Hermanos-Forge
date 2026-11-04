import { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { formatTime } from './timeUtils';

/**
 * Clearly Visible Draggable Start and End Trim Handles
 * Features prominent tactile caliper bars, directional inward chevrons,
 * smooth pointer capture, and floating real-time timecode tooltips.
 */
export function TimelineTrimmerHandle({
  type = 'start', // 'start' | 'end'
  time = 0,
  duration = 0,
  minTime = 0,
  maxTime = 0,
  disabled = false,
  onTimeChange,
  onDragStart,
  onDragEnd,
}) {
  const isStart = type === 'start';
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const trackWidthRef = useRef(0);

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
    if (onDragStart) onDragStart(type);

    startXRef.current = e.clientX;
    startTimeRef.current = time;

    const track = e.currentTarget.parentElement;
    trackWidthRef.current = track ? track.offsetWidth : 1;

    const handlePointerMove = (moveEvent) => {
      if (!duration || trackWidthRef.current <= 0) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const timeDelta = (deltaX / trackWidthRef.current) * duration;
      const rawTarget = startTimeRef.current + timeDelta;
      const clampedTime = Math.max(minTime, Math.min(maxTime, rawTarget));
      onTimeChange(clampedTime);
    };

    const handlePointerUp = (upEvent) => {
      try {
        upEvent.currentTarget.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Fallback
      }
      setIsDragging(false);
      if (onDragEnd) onDragEnd(type);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (e) => {
    if (disabled || !duration) return;

    let step = 0.1;
    if (e.shiftKey) step = 1.0;
    else if (e.altKey) step = 0.05;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newTime = Math.max(minTime, Math.min(maxTime, time - step));
      onTimeChange(newTime);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newTime = Math.max(minTime, Math.min(maxTime, time + step));
      onTimeChange(newTime);
    }
  };

  const percent = duration > 0 ? (time / duration) * 100 : 0;
  const showHUD = isHovering || isDragging || isFocused;

  const tooltipAlignClass =
    percent < 6
      ? 'left-0 translate-x-0'
      : percent > 94
      ? 'right-0 translate-x-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      role="slider"
      aria-label={isStart ? 'In-point trim handle' : 'Out-point trim handle'}
      aria-valuenow={time}
      aria-valuemin={minTime}
      aria-valuemax={maxTime}
      tabIndex={disabled ? -1 : 0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`absolute top-0 bottom-0 z-30 flex flex-col items-center justify-center cursor-ew-resize select-none outline-none group ${
        disabled ? 'pointer-events-none opacity-40' : ''
      }`}
      style={{
        left: `${percent}%`,
        width: '18px',
        marginLeft: '-9px',
      }}
    >
      {/* Floating Precision Time Tooltip */}
      <div
        className={`absolute -top-7 ${tooltipAlignClass} px-2 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold whitespace-nowrap border pointer-events-none transition-all duration-150 z-50 bg-obsidian-950/95 text-white border-purple-500/80 shadow-md ${
          showHUD ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <span className="text-[9px] uppercase tracking-wider text-purple-300 mr-1 font-semibold">
          {isStart ? 'START' : 'END'}:
        </span>
        {formatTime(time, true)}
      </div>

      {/* Prominent Tactile Caliper Handle Bar */}
      <div
        className={`w-3 h-full flex flex-col items-center justify-center transition-all duration-100 shadow-md border ${
          isStart ? 'rounded-l-[4px] border-r-0' : 'rounded-r-[4px] border-l-0'
        } ${
          isDragging || isFocused
            ? 'bg-purple-500 border-white ring-2 ring-purple-300 shadow-glow-violet'
            : 'bg-accent-violet border-purple-300/80 hover:bg-purple-600 hover:border-white'
        }`}
      >
        {/* Directional Inward Chevron */}
        {isStart ? (
          <ChevronRight className="w-2.5 h-2.5 text-white stroke-[3] shrink-0" />
        ) : (
          <ChevronLeft className="w-2.5 h-2.5 text-white stroke-[3] shrink-0" />
        )}
      </div>
    </div>
  );
}

export default TimelineTrimmerHandle;
