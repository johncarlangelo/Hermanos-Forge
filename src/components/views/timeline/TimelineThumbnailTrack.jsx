import { useMemo } from 'react';
import { Film } from 'lucide-react';

/**
 * Thumbnail-Based Video Trimming Timeline Track
 * Displays actual extracted video frames or thumbnail tiles across the timeline
 * with dimmed head/tail trim masks and an illuminated active cut window.
 */
export function TimelineThumbnailTrack({
  metadata,
  duration,
  startTime,
  endTime,
  zoomLevel = 1,
}) {
  const startPercent = duration > 0 ? Math.max(0, Math.min(100, (startTime / duration) * 100)) : 0;
  const endPercent = duration > 0 ? Math.max(0, Math.min(100, (endTime / duration) * 100)) : 100;
  const activeWidthPercent = Math.max(0, endPercent - startPercent);

  // Generate thumbnail image URLs for filmstrip cells
  const thumbnailUrls = useMemo(() => {
    const list = [];
    if (!metadata) return list;

    const ytId = metadata.id;
    const defaultThumb = metadata.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);

    if (ytId) {
      // Use YouTube snapshot sequence for realistic visual frame progression
      const frames = [
        `https://img.youtube.com/vi/${ytId}/1.jpg`,
        `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        `https://img.youtube.com/vi/${ytId}/2.jpg`,
        `https://img.youtube.com/vi/${ytId}/3.jpg`,
        `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      ];
      return frames;
    }

    if (defaultThumb) {
      return [defaultThumb];
    }
    return [];
  }, [metadata]);

  // Compute number of visual frame tiles across the track width
  const tileCount = useMemo(() => {
    // Each 16:9 thumbnail at 56px height is ~100px wide
    // For 800px track at 1x: ~8-10 tiles; at higher zoom: scales up
    return Math.max(8, Math.min(60, Math.floor(10 * zoomLevel)));
  }, [zoomLevel]);

  const tiles = useMemo(() => {
    const items = [];
    const count = thumbnailUrls.length;
    for (let i = 0; i < tileCount; i++) {
      const url = count > 0 ? thumbnailUrls[i % count] : null;
      items.push({ id: i, url });
    }
    return items;
  }, [tileCount, thumbnailUrls]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-md bg-obsidian-950 border border-purple-900/40">
      {/* 1. Horizontal Filmstrip of Video Thumbnails */}
      <div className="w-full h-full flex items-center overflow-hidden">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="h-full flex-1 min-w-[70px] max-w-[130px] border-r border-obsidian-950/80 bg-obsidian-900 relative overflow-hidden shrink-0 flex items-center justify-center"
          >
            {tile.url ? (
              <img
                src={tile.url}
                alt=""
                className="w-full h-full object-cover opacity-75 select-none pointer-events-none"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Film className="w-4 h-4 text-purple-700/40" />
            )}
            {/* Subtle frame separation line */}
            <div className="absolute right-0 inset-y-0 w-px bg-black/60" />
          </div>
        ))}
      </div>

      {/* 2. Head Trim Mask (Dimmed Region Before Start) */}
      <div
        className="absolute top-0 bottom-0 left-0 bg-black/80 backdrop-blur-[1px] border-r border-purple-500/50 transition-all duration-75"
        style={{ width: `${startPercent}%` }}
      />

      {/* 3. Tail Trim Mask (Dimmed Region After End) */}
      <div
        className="absolute top-0 bottom-0 right-0 bg-black/80 backdrop-blur-[1px] border-l border-purple-500/50 transition-all duration-75"
        style={{ width: `${100 - endPercent}%` }}
      />

      {/* 4. Active Trimmed Selection Window (Bright / Illuminated) */}
      <div
        className="absolute top-0 bottom-0 border-y-2 border-accent-violet transition-all duration-75 pointer-events-none shadow-sm"
        style={{
          left: `${startPercent}%`,
          width: `${activeWidthPercent}%`,
        }}
      >
        {/* Top hairline specular highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-purple-300/40" />
      </div>
    </div>
  );
}

export default TimelineThumbnailTrack;

