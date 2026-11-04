/**
 * Clean & Minimalist Video Timeline Track
 * Provides a sleek, quiet track foundation with clean dimmed trim masks
 * and an illuminated active segment window.
 */
export function TimelineFilmTrack({
  duration,
  startTime,
  endTime,
}) {
  const startPercent = duration > 0 ? Math.max(0, Math.min(100, (startTime / duration) * 100)) : 0;
  const endPercent = duration > 0 ? Math.max(0, Math.min(100, (endTime / duration) * 100)) : 100;
  const activeWidthPercent = Math.max(0, endPercent - startPercent);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-lg bg-obsidian-950 border border-purple-950/40">
      {/* Subtle center hairline guide */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-purple-500/10" />

      {/* Head Trim Dimmed Mask (Unselected Before Start) */}
      <div
        className="absolute top-0 bottom-0 left-0 bg-black/65 transition-all duration-75 border-r border-purple-500/30"
        style={{ width: `${startPercent}%` }}
      />

      {/* Tail Trim Dimmed Mask (Unselected After End) */}
      <div
        className="absolute top-0 bottom-0 right-0 bg-black/65 transition-all duration-75 border-l border-purple-500/30"
        style={{ width: `${100 - endPercent}%` }}
      />

      {/* Active Video Cut Window (Illuminated Segment) */}
      <div
        className="absolute top-0 bottom-0 border-y border-purple-400/60 bg-purple-950/20 transition-all duration-75"
        style={{
          left: `${startPercent}%`,
          width: `${activeWidthPercent}%`,
        }}
      >
        {/* Subtle top specular highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-purple-300/30" />
      </div>
    </div>
  );
}

export default TimelineFilmTrack;
