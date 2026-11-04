import { useMemo } from 'react';
import { formatTimeShort } from './timeUtils';

const NICE_INTERVALS = [
  0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400,
];

function chooseInterval(duration, zoomLevel) {
  if (!duration || duration <= 0) return { major: 10, minor: 2 };
  // Approximate width per second (assuming typical container width ~ 800px)
  const approxWidth = 800 * zoomLevel;
  const pixelsPerSec = approxWidth / duration;

  // Desired distance between major ticks is around 80px to 140px
  const targetSec = 100 / pixelsPerSec;

  // Find closest interval in nice intervals list
  let bestMajor = NICE_INTERVALS[0];
  for (const interval of NICE_INTERVALS) {
    if (interval >= targetSec) {
      bestMajor = interval;
      break;
    }
  }

  // Minor interval is typically 1/2 or 1/5 of major
  let bestMinor = bestMajor / 5;
  if (bestMajor <= 0.5) bestMinor = bestMajor / 2;
  else if (bestMajor === 1) bestMinor = 0.2;
  else if (bestMajor === 2) bestMinor = 0.5;
  else if (bestMajor === 10) bestMinor = 2;
  else if (bestMajor === 15) bestMinor = 5;
  else if (bestMajor === 30) bestMinor = 10;
  else if (bestMajor === 60) bestMinor = 15;

  return { major: bestMajor, minor: bestMinor };
}

export function TimelineRuler({ duration, zoomLevel }) {
  const { majorTicks, minorTicks } = useMemo(() => {
    if (!duration || duration <= 0) {
      return { majorTicks: [], minorTicks: [] };
    }

    const { major, minor } = chooseInterval(duration, zoomLevel);
    const majors = [];
    const minors = [];

    // Avoid generating thousands of ticks if duration is massive
    const maxTicks = 120;
    const safeMajor = Math.max(major, duration / maxTicks);

    for (let t = safeMajor; t < duration; t += safeMajor) {
      majors.push(t);
    }

    if (minor > 0 && duration / minor <= 300) {
      for (let t = minor; t < duration; t += minor) {
        // Only add minor if it doesn't collide closely with a major tick
        const isNearMajor = majors.some((m) => Math.abs(m - t) < minor * 0.4);
        if (!isNearMajor) {
          minors.push(t);
        }
      }
    }

    return { majorTicks: majors, minorTicks: minors };
  }, [duration, zoomLevel]);

  if (!duration) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Top subtle ruler border */}
      <div className="absolute top-0 inset-x-0 h-px bg-purple-500/20" />

      {/* Origin tick (00:00) */}
      <div className="absolute top-0 left-0 flex flex-col items-start pl-1">
        <div className="w-px h-3.5 bg-accent-neon/70 shadow-sm" />
        <span className="text-[10px] font-mono text-[var(--text-secondary)] tracking-tight opacity-90 pl-0.5 mt-0.5">
          00:00
        </span>
      </div>

      {/* Minor ticks */}
      {minorTicks.map((t, idx) => (
        <div
          key={`min-${idx}`}
          className="absolute top-0"
          style={{ left: `${(t / duration) * 100}%` }}
        >
          <div className="w-px h-1.5 bg-purple-400/25 -translate-x-1/2" />
        </div>
      ))}

      {/* Major ticks */}
      {majorTicks.map((t, idx) => (
        <div
          key={`maj-${idx}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${(t / duration) * 100}%` }}
        >
          <div className="w-px h-3.5 bg-purple-400/60 shadow-sm -translate-x-1/2" />
          <span className="text-[10px] font-mono tabular-nums text-[var(--text-secondary)] tracking-tight opacity-90 -translate-x-1/2 mt-0.5 whitespace-nowrap">
            {formatTimeShort(t)}
          </span>
        </div>
      ))}

      {/* End tick (Duration) */}
      <div className="absolute top-0 right-0 flex flex-col items-end pr-1">
        <div className="w-px h-3.5 bg-accent-neon/70 shadow-sm" />
        <span className="text-[10px] font-mono tabular-nums text-[var(--text-secondary)] tracking-tight opacity-90 pr-0.5 mt-0.5">
          {formatTimeShort(duration)}
        </span>
      </div>
    </div>
  );
}

export default TimelineRuler;

