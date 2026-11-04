import { useState, useRef } from 'react';
import { formatTime } from './timeUtils';

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
      aria-label={isStart ? 'In-point trimmer handle' : 'Out-point trimmer handle'}
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
        width: '16px',
        marginLeft: '-8px',
      }}
    >
      {/* Floating Precision HUD Tooltip */}
      <div
        className={`absolute -top-7 ${tooltipAlignClass} px-2 py-0.5 rounded-[4px] text-[10px] font-mono tabular-nums font-semibold whitespace-nowrap border pointer-events-none transition-all duration-150 z-40 bg-obsidian-950/95 text-purple-100 border-purple-500/60 shadow-md ${
          showHUD ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <span className="text-[9px] uppercase tracking-wider text-purple-300/70 mr-1 font-bold">
          {isStart ? 'IN' : 'OUT'}:
        </span>
        {formatTime(time, true)}
      </div>

      {/* Clean Minimalist Caliper Handle Bar */}
      <div
        className={`w-2.5 h-full rounded-[2px] border transition-all duration-100 flex items-center justify-center relative ${
          isDragging || isFocused
            ? 'bg-accent-violet border-purple-200 ring-1 ring-purple-300 shadow-glow-violet'
            : 'bg-obsidian-850 border-purple-400 hover:border-purple-200 hover:bg-purple-950'
        }`}
      >
        {/* Inward In/Out Bracket Caps */}
        {isStart ? (
          <>
            <div className="absolute top-0 right-0 w-1.5 h-1 bg-current opacity-80 rounded-tr-[1px]" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1 bg-current opacity-80 rounded-br-[1px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-0 w-1.5 h-1 bg-current opacity-80 rounded-tl-[1px]" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1 bg-current opacity-80 rounded-bl-[1px]" />
          </>
        )}

        {/* Minimalist Center Grip Notch */}
        <div
          className={`w-0.5 h-3 rounded-full transition-colors ${
            isDragging || isFocused ? 'bg-white' : 'bg-purple-300/80 group-hover:bg-white'
          }`}
        />
      </div>

      {/* Hairline guide extending through track */}
      <div
        className={`w-px h-full absolute top-0 pointer-events-none ${
          isDragging || isFocused ? 'bg-purple-300/60' : 'bg-transparent'
        }`}
      />
    </div>
  );
}

export default TimelineTrimmerHandle;
