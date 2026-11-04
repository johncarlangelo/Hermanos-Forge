import { useMemo } from 'react';
import { formatTimeShort } from './timeUtils';

const NICE_INTERVALS = [
  0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400,
];

function chooseInterval(duration, zoomLevel) {
  if (!duration || duration <= 0) return { major: 10, minor: 2 };
  const approxWidth = 800 * zoomLevel;
  const pixelsPerSec = approxWidth / duration;
  const targetSec = 90 / pixelsPerSec;

  let bestMajor = NICE_INTERVALS[0];
  for (const interval of NICE_INTERVALS) {
    if (interval >= targetSec) {
      bestMajor = interval;
      break;
    }
  }

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

export function TimelineRuler({ duration, zoomLevel = 1 }) {
  const { majorTicks, minorTicks } = useMemo(() => {
    if (!duration || duration <= 0) {
      return { majorTicks: [], minorTicks: [] };
    }

    const { major, minor } = chooseInterval(duration, zoomLevel);
    const majors = [];
    const minors = [];

    const maxTicks = 100;
    const safeMajor = Math.max(major, duration / maxTicks);

    for (let t = safeMajor; t < duration; t += safeMajor) {
      majors.push(t);
    }

    if (minor > 0 && duration / minor <= 250) {
      for (let t = minor; t < duration; t += minor) {
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
    <div className="w-full h-5 relative pointer-events-none select-none overflow-hidden bg-obsidian-950/90 border-b border-purple-900/30">
      {/* Origin tick (00:00) */}
      <div className="absolute top-0 bottom-0 left-0 flex flex-col items-start pl-1 justify-end pb-0.5">
        <span className="text-[10px] font-mono tabular-nums text-purple-300 font-medium tracking-tight">
          00:00
        </span>
        <div className="w-px h-1.5 bg-purple-400" />
      </div>

      {/* Minor ticks */}
      {minorTicks.map((t, idx) => (
        <div
          key={`min-${idx}`}
          className="absolute bottom-0"
          style={{ left: `${(t / duration) * 100}%` }}
        >
          <div className="w-px h-1 bg-purple-400/25 -translate-x-1/2" />
        </div>
      ))}

      {/* Major ticks with readable timestamps */}
      {majorTicks.map((t, idx) => (
        <div
          key={`maj-${idx}`}
          className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-0.5"
          style={{ left: `${(t / duration) * 100}%` }}
        >
          <span className="text-[10px] font-mono tabular-nums text-purple-200/90 tracking-tight whitespace-nowrap -translate-x-1/2">
            {formatTimeShort(t)}
          </span>
          <div className="w-px h-1.5 bg-purple-400/60 -translate-x-1/2" />
        </div>
      ))}

      {/* End tick (Duration) */}
      <div className="absolute top-0 bottom-0 right-0 flex flex-col items-end pr-1 justify-end pb-0.5">
        <span className="text-[10px] font-mono tabular-nums text-purple-300 font-medium tracking-tight">
          {formatTimeShort(duration)}
        </span>
        <div className="w-px h-1.5 bg-purple-400" />
      </div>
    </div>
  );
}

export default TimelineRuler;
